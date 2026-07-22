import { execFile } from "node:child_process";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

import { describe, expect, it } from "vitest";

import {
  detailRowEndIndex,
  displayDomainIdentifier,
  domainFilterFromIdentifier,
  filterRules,
  ruleIdFromPath,
  rulePath,
  SUBDOMAIN_MESH_STYLES,
  subdomainFromIdentifier,
  titleCaseDomainFilter,
  toggledRulePath,
} from "./app-logic";
import {
  gitStatusFingerprint,
  loadDoctrine,
  readGit,
  searchDoctrine,
} from "./server";

const execFileAsync = promisify(execFile);

async function runGit(root: string, ...args: string[]) {
  return execFileAsync("git", ["-C", root, ...args], { encoding: "utf8" });
}

describe("design doctrine library", () => {
  it("loads the Markdown rules directly", async () => {
    const library = await loadDoctrine(process.cwd());

    expect(library.rules.length).toBeGreaterThan(0);
    expect(
      Object.values(library.status_counts).reduce(
        (total, count) => total + count,
        0,
      ),
    ).toBe(library.rules.length);
    expect(new Set(library.rules.map((rule) => rule.id)).size).toBe(
      library.rules.length,
    );
    expect(library.rules.every((rule) => rule.canonical_path.endsWith(".md"))).toBe(true);
    expect(library.domains).toContain("interaction");
  });

  it("searches rule content with AND semantics", async () => {
    const library = await loadDoctrine(process.cwd());
    const results = searchDoctrine(library.rules, "compact utilities");

    expect(results.map((rule) => rule.id)).toContain("ddr_001");
  });

  it("uses scoped single-episode rules without an approval queue", async () => {
    const library = await loadDoctrine(process.cwd());
    const results = searchDoctrine(library.rules, "explicit click");
    const rule = library.rules.find((item) => item.id === "ddr_011");

    expect(results.map((item) => item.id)).toContain("ddr_011");
    expect(rule?.status).toBe("active");
    expect(rule?.confidence).toBe("medium");
  });

  it("keeps published evidence free of private bb locators", async () => {
    const library = await loadDoctrine(process.cwd());
    const evidence = library.rules.flatMap((rule) => rule.evidence).join("\n");

    expect(evidence).not.toMatch(/\b(?:thr|proj|env)_[a-z0-9_-]+\b/i);
    expect(evidence).not.toContain("/Users/");
  });

  it("keeps every rule status visible in the library", async () => {
    const library = await loadDoctrine(process.cwd());
    const mixedStatuses = [
      { ...library.rules[0], status: "active" as const },
      { ...library.rules[1], status: "conflicted" as const },
      { ...library.rules[2], status: "retired" as const },
    ];

    expect(filterRules(mixedStatuses, "all", "").map((rule) => rule.status)).toEqual([
      "active",
      "conflicted",
      "retired",
    ]);
  });

  it("places detail after the selected responsive grid row", () => {
    expect(detailRowEndIndex(0, 8, 3)).toBe(2);
    expect(detailRowEndIndex(4, 8, 3)).toBe(5);
    expect(detailRowEndIndex(7, 8, 3)).toBe(7);
    expect(detailRowEndIndex(4, 8, 2)).toBe(5);
    expect(detailRowEndIndex(4, 8, 1)).toBe(4);
  });

  it("preserves deep links and collapses a selected rule", () => {
    expect(rulePath("ddr_001")).toBe("rule/ddr_001");
    expect(ruleIdFromPath("rule/ddr_001")).toBe("ddr_001");
    expect(toggledRulePath(null, "ddr_001")).toBe("rule/ddr_001");
    expect(toggledRulePath("ddr_001", "ddr_001")).toBe("");
    expect(toggledRulePath("ddr_001", "ddr_002")).toBe("rule/ddr_002");
  });

  it("presents domain identifiers in lowercase without changing rule data", async () => {
    const library = await loadDoctrine(process.cwd());
    const rule = library.rules.find((item) => item.id === "ddr_029");

    expect(displayDomainIdentifier("AI.CONTEXT")).toBe("ai.context");
    expect(displayDomainIdentifier(rule?.domain ?? "")).toBe("ai.context");
    expect(rule?.domain).toBe("ai.context");
  });

  it("maps rule-domain identifiers to the existing top-level filter", () => {
    expect(domainFilterFromIdentifier("AI.CONTEXT")).toBe("ai");
    expect(domainFilterFromIdentifier("information.hierarchy")).toBe("information");
    expect(subdomainFromIdentifier("AI.CONTEXT")).toBe("context");
  });

  it("title-cases the top-level filter labels", () => {
    expect(titleCaseDomainFilter("all")).toBe("All");
    expect(titleCaseDomainFilter("ai")).toBe("AI");
    expect(titleCaseDomainFilter("design-system")).toBe("Design System");
  });

  it("gives every current subdomain a unique mesh endpoint", async () => {
    const library = await loadDoctrine(process.cwd());
    const subdomains = [
      ...new Set(library.rules.map((rule) => subdomainFromIdentifier(rule.domain))),
    ].sort();
    const mappedSubdomains = Object.keys(SUBDOMAIN_MESH_STYLES).sort();
    const meshEndpoints = mappedSubdomains.map(
      (subdomain) => SUBDOMAIN_MESH_STYLES[subdomain].idle,
    );

    expect(mappedSubdomains).toEqual(subdomains);
    expect(new Set(meshEndpoints).size).toBe(meshEndpoints.length);
  });

  it("scopes Git status to the plugin directory", async () => {
    const repository = await mkdtemp(join(tmpdir(), "doctrine-git-scope-"));
    const pluginRoot = join(repository, "plugins", "design-doctrine");
    try {
      await mkdir(join(pluginRoot, "rules"), { recursive: true });
      await writeFile(join(pluginRoot, "rules", "rule.md"), "rule\n");
      await writeFile(join(pluginRoot, "README.md"), "before\n");
      await writeFile(join(repository, "unrelated.txt"), "before\n");
      await runGit(repository, "init");
      await runGit(repository, "config", "user.email", "tests@example.com");
      await runGit(repository, "config", "user.name", "Tests");
      await runGit(repository, "add", ".");
      await runGit(repository, "commit", "-m", "initial");

      const cleanFingerprint = await gitStatusFingerprint(pluginRoot);
      await writeFile(join(repository, "unrelated.txt"), "after\n");
      expect(await readGit(pluginRoot)).toMatchObject({
        available: true,
        dirty: false,
        changed_files: 0,
      });
      expect(await gitStatusFingerprint(pluginRoot)).toBe(cleanFingerprint);

      await writeFile(join(pluginRoot, "README.md"), "after\n");
      expect(await gitStatusFingerprint(pluginRoot)).not.toBe(cleanFingerprint);
      expect(await readGit(pluginRoot)).toMatchObject({
        available: true,
        dirty: true,
        changed_files: 1,
      });
      await writeFile(join(pluginRoot, "README.md"), "before\n");

      await writeFile(join(pluginRoot, "rules", "rule.md"), "changed\n");
      expect(await readGit(pluginRoot)).toMatchObject({
        available: true,
        dirty: true,
        changed_files: 1,
      });
    } finally {
      await rm(repository, { recursive: true, force: true });
    }
  });

});
