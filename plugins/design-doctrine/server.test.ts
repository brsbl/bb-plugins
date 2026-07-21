import { execFile } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import Database from "better-sqlite3";
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
const PLUGIN_ROOT = dirname(fileURLToPath(import.meta.url));
const SCAN_HISTORY = join(PLUGIN_ROOT, "scripts", "scan-history.py");

async function runGit(root: string, ...args: string[]) {
  return execFileAsync("git", ["-C", root, ...args], { encoding: "utf8" });
}

describe("design doctrine library", () => {
  it("loads the Markdown rules directly", async () => {
    const library = await loadDoctrine(process.cwd());

    expect(library.rules).toHaveLength(33);
    expect(library.status_counts).toEqual({ active: 33 });
    expect(new Set(library.rules.map((rule) => rule.id)).size).toBe(33);
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

  it("leases a maintenance scan until its exact cursor is advanced", async () => {
    const temporary = await mkdtemp(join(tmpdir(), "doctrine-maintenance-"));
    const databasePath = join(temporary, "bb.db");
    const statePath = join(temporary, "state.json");
    const database = new Database(databasePath);
    try {
      database.exec(`
        CREATE TABLE threads (
          id TEXT PRIMARY KEY,
          project_id TEXT,
          title TEXT,
          title_fallback TEXT
        );
        CREATE TABLE thread_search_segments (
          id TEXT PRIMARY KEY,
          thread_id TEXT NOT NULL,
          source_key TEXT,
          source_kind TEXT NOT NULL,
          created_at INTEGER NOT NULL,
          text TEXT NOT NULL
        );
        INSERT INTO threads VALUES ('thr_test', 'proj_test', 'Design task', NULL);
        INSERT INTO thread_search_segments VALUES (
          'seg_test', 'thr_test', 'message:test', 'user_message', 42,
          'Keep the interface compact.'
        );
      `);
      const scanArgs = [
        SCAN_HISTORY,
        "--db",
        databasePath,
        "--state",
        statePath,
        "scan",
        "--lease-seconds",
        "60",
      ];
      const first = await execFileAsync("python3", scanArgs, {
        encoding: "utf8",
      });
      const result = JSON.parse(first.stdout) as {
        lease_id: string;
        cursor_commit: { created_at: number; segment_id: string };
      };

      expect(result.lease_id).toMatch(/^[a-f0-9]{32}$/);
      await expect(
        execFileAsync("python3", scanArgs, { encoding: "utf8" }),
      ).rejects.toMatchObject({ stderr: expect.stringContaining("maintenance lease") });
      await expect(
        execFileAsync(
          "python3",
          [
            SCAN_HISTORY,
            "--state",
            statePath,
            "advance",
            "--created-at",
            "42",
            "--segment-id",
            "seg_test",
            "--lease-id",
            "wrong",
          ],
          { encoding: "utf8" },
        ),
      ).rejects.toMatchObject({ stderr: expect.stringContaining("does not match") });

      await execFileAsync(
        "python3",
        [
          SCAN_HISTORY,
          "--state",
          statePath,
          "advance",
          "--created-at",
          String(result.cursor_commit.created_at),
          "--segment-id",
          result.cursor_commit.segment_id,
          "--lease-id",
          result.lease_id,
        ],
        { encoding: "utf8" },
      );
      expect(JSON.parse(await readFile(statePath, "utf8"))).toEqual({
        version: 1,
        cursor: { created_at: 42, segment_id: "seg_test" },
      });

      const caughtUp = await execFileAsync("python3", scanArgs, {
        encoding: "utf8",
      });
      expect(JSON.parse(caughtUp.stdout)).toMatchObject({
        cursor_before: { created_at: 42, segment_id: "seg_test" },
        cursor_commit: { created_at: 42, segment_id: "seg_test" },
        lease_id: null,
        messages: [],
      });
      expect(JSON.parse(await readFile(statePath, "utf8"))).toEqual({
        version: 1,
        cursor: { created_at: 42, segment_id: "seg_test" },
      });
    } finally {
      database.close();
      await rm(temporary, { recursive: true, force: true });
    }
  }, 10_000);

  it("refuses a scan without touching pre-existing tracked or untracked rules", async () => {
    const repository = await mkdtemp(join(tmpdir(), "doctrine-dirty-rules-"));
    const rulesRoot = join(repository, "rules");
    const trackedRule = join(rulesRoot, "tracked.md");
    const untrackedRule = join(rulesRoot, "untracked.md");
    const statePath = join(repository, "state", "state.json");
    const missingDatabase = join(repository, "missing.db");
    try {
      await mkdir(rulesRoot, { recursive: true });
      await writeFile(trackedRule, "original\n");
      await runGit(repository, "init");
      await runGit(repository, "config", "user.email", "tests@example.com");
      await runGit(repository, "config", "user.name", "Tests");
      await runGit(repository, "add", ".");
      await runGit(repository, "commit", "-m", "initial");

      const scanArgs = [
        SCAN_HISTORY,
        "--db",
        missingDatabase,
        "--state",
        statePath,
        "scan",
        "--repository-root",
        repository,
      ];

      await writeFile(trackedRule, "tracked work\n");
      await expect(
        execFileAsync("python3", scanArgs, { encoding: "utf8" }),
      ).rejects.toMatchObject({
        stderr: expect.stringContaining("rules tree has pre-existing work"),
      });
      expect(await readFile(trackedRule, "utf8")).toBe("tracked work\n");

      await writeFile(trackedRule, "original\n");
      await writeFile(untrackedRule, "untracked work\n");
      await expect(
        execFileAsync("python3", scanArgs, { encoding: "utf8" }),
      ).rejects.toMatchObject({
        stderr: expect.stringContaining("rules tree has pre-existing work"),
      });
      expect(await readFile(untrackedRule, "utf8")).toBe("untracked work\n");
      await expect(readFile(statePath, "utf8")).rejects.toMatchObject({
        code: "ENOENT",
      });
    } finally {
      await rm(repository, { recursive: true, force: true });
    }
  });

  it("reports staged files outside the maintenance rules directory", async () => {
    const repository = await mkdtemp(join(tmpdir(), "doctrine-staged-scope-"));
    const pluginRoot = join(repository, "plugins", "design-doctrine");
    try {
      await mkdir(join(pluginRoot, "rules"), { recursive: true });
      await writeFile(join(pluginRoot, "rules", "rule.md"), "rule\n");
      await writeFile(join(repository, "outside.txt"), "outside\n");
      await runGit(repository, "init");
      await runGit(repository, "add", ".");

      await expect(
        execFileAsync(
          "python3",
          [SCAN_HISTORY, "verify-staged", "--repository-root", pluginRoot],
          { encoding: "utf8" },
        ),
      ).rejects.toMatchObject({ stderr: expect.stringContaining("outside.txt") });

      await runGit(repository, "rm", "--cached", "outside.txt");
      const verified = await execFileAsync(
        "python3",
        [SCAN_HISTORY, "verify-staged", "--repository-root", pluginRoot],
        { encoding: "utf8" },
      );
      expect(JSON.parse(verified.stdout)).toMatchObject({ unexpected: [] });
    } finally {
      await rm(repository, { recursive: true, force: true });
    }
  });
});
