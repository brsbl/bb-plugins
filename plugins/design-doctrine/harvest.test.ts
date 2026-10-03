import { execFile } from "node:child_process";
import {
  chmod,
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rm,
  unlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { promisify } from "node:util";

import {
  createFakePluginHost,
  makeThreadResponse,
} from "@get-bb/plugin-sdk/testing";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  allocateRuleId,
  harvestProposalSchema,
  harvestVerdictSchema,
  isHarvestableThread,
  normalizeRuleKey,
  renderRuleMarkdown,
  ruleRelativePath,
  type HarvestProposal,
} from "./harvest";
import plugin from "./server";
import { loadDoctrine } from "./server";

const SEED_RULE = `---
id: ddr_001
kind: guideline
strength: default
confidence: high
status: active
domain: interaction.efficiency
products: ["global"]
activities: ["design"]
artifacts: ["component"]
surfaces: ["toolbars"]
relations: []
supporting_episodes: 1
challenging_episodes: 0
updated: 2026-01-01
---

# Keep routine utilities compact

Routine utilities default to compact icon-only controls with concise tooltips.

## Why

Dense operational surfaces should not fill with labels that repeat the icon.

## Prefer

- Use a semantically exact icon with an accessible name.

## Avoid

- Large labelled controls for routine inspection actions.

## Use when

- The action is routine, local, and repeated in a dense surface.

## Do not use when

- The action is destructive or unfamiliar.

## Evidence

- Asked routine toolbar actions to become icon-only with tooltips.

## Check

- Does every icon-only action have an accessible name?
`;

const temporaryRoots: string[] = [];
const execFileAsync = promisify(execFile);
vi.setConfig({ testTimeout: 30_000 });

async function makeDoctrineRoot({ nested = false } = {}): Promise<string> {
  const repository = await mkdtemp(join(tmpdir(), "doctrine-harvest-"));
  temporaryRoots.push(repository);
  const root = nested ? join(repository, "plugins", "design-doctrine") : repository;
  await mkdir(join(root, "rules", "interaction"), { recursive: true });
  await writeFile(join(root, "rules", "interaction", "ddr_001.md"), SEED_RULE, "utf8");
  await execFileAsync("git", ["-C", repository, "init", "-b", "doctrine-maintenance"]);
  await execFileAsync("git", ["-C", repository, "config", "user.name", "Design Doctrine Test"]);
  await execFileAsync("git", [
    "-C",
    repository,
    "config",
    "user.email",
    "doctrine-test@example.com",
  ]);
  await execFileAsync("git", ["-C", root, "add", "rules/interaction/ddr_001.md"]);
  await execFileAsync("git", ["-C", repository, "commit", "-m", "seed rules"]);
  return root;
}

afterEach(async () => {
  while (temporaryRoots.length > 0) {
    const root = temporaryRoots.pop();
    if (root) await rm(root, { recursive: true, force: true });
  }
});

function makeProposal(overrides: Partial<HarvestProposal> = {}): HarvestProposal {
  return harvestProposalSchema.parse({
    title: "Reserve alarm color for errors",
    statement:
      "Dense surfaces stay neutral; red marks a real error and nothing else.",
    kind: "guideline",
    strength: "default",
    confidence: "low",
    domain: "visual.color",
    products: ["global"],
    activities: ["design"],
    artifacts: ["component"],
    surfaces: ["status chips"],
    why: "Non-error red trains people to ignore the one signal that matters.",
    prefer: ["Reserve alarm color for genuine error states."],
    avoid: ["Using alarm color for attention or pending states."],
    use_when: ["A surface marks status with color."],
    not_when: [],
    exceptions: [],
    evidence: ["Asked that an attention state stop using the error color."],
    checks: ["Is anything non-error using the alarm color?"],
    ...overrides,
  });
}

function deferred(): { promise: Promise<void>; resolve: () => void } {
  let resolve = () => undefined;
  const promise = new Promise<void>((complete) => {
    resolve = complete;
  });
  return { promise, resolve };
}

async function waitFor(
  condition: () => boolean | Promise<boolean>,
  message: string,
): Promise<void> {
  for (let attempt = 0; attempt < 1_000; attempt += 1) {
    if (await condition()) return;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error(message);
}

async function commitRule(
  root: string,
  proposal: HarvestProposal,
  id: string,
): Promise<void> {
  const relativePath = ruleRelativePath(proposal.domain, id);
  await mkdir(dirname(join(root, relativePath)), { recursive: true });
  await writeFile(
    join(root, relativePath),
    renderRuleMarkdown(proposal, id, "2026-08-24"),
    "utf8",
  );
  await execFileAsync("git", ["-C", root, "add", "--", relativePath]);
  await execFileAsync("git", [
    "-C",
    root,
    "commit",
    "-m",
    `add ${id}`,
    "--",
    relativePath,
  ]);
}

interface AgentScript {
  /** JSON array the harvester reports for a given archived thread. */
  propose: (threadId: string) => HarvestProposal[];
  /** Verdict the reviewer reports for a given proposal id. */
  review?: (proposalId: number, prompt: string) => { approve: boolean; reason: string };
  /** Prompts handed to reviewer agents, in order. */
  reviewerPrompts: string[];
  /** Prompts handed to harvester agents, in order. */
  harvesterPrompts: string[];
  reportHarvester?: boolean;
  reportReviewer?: boolean;
  waitForHarvester?: (threadId: string) => Promise<void>;
  waitForReviewer?: (proposalId: number) => Promise<void>;
  afterHarvesterReport?: (threadId: string) => Promise<void>;
  afterReviewerReport?: (
    proposalId: number,
    prompt: string,
    harness: ReturnType<typeof createFakePluginHost>["harness"],
  ) => Promise<void>;
}

async function startPlugin(root: string, script: AgentScript) {
  const host = createFakePluginHost({
    pluginId: "design-doctrine",
    settings: { doctrinePath: root },
    sdk: { threads: { list: async () => [] } },
    agentSkillIds: ["design-doctrine"],
  });
  const { bb, harness } = host;

  harness.sdk.stub("threads.spawn", (async (args: { prompt: string }) => {
    const prompt = args.prompt;
    const proposeMatch = /harvest propose --thread (\S+)/.exec(prompt);
    const reviewMatch = /harvest verdict --proposal (\d+)/.exec(prompt);
    const tokenMatch = /--token (\S+)/.exec(prompt);
    if ((proposeMatch || reviewMatch) && !tokenMatch) {
      throw new Error("worker prompt omitted its capability token");
    }
    if (proposeMatch && !reviewMatch) {
      script.harvesterPrompts.push(prompt);
      const threadId = proposeMatch[1];
      await script.waitForHarvester?.(threadId);
      if (script.reportHarvester !== false) {
        await harness.behavior.runCli([
          "harvest",
          "propose",
          "--thread",
          threadId,
          "--token",
          tokenMatch![1],
          "--json",
          JSON.stringify(script.propose(threadId)),
        ]);
        await script.afterHarvesterReport?.(threadId);
      }
    } else if (reviewMatch) {
      script.reviewerPrompts.push(prompt);
      const proposalId = Number(reviewMatch[1]);
      await script.waitForReviewer?.(proposalId);
      const verdict = script.review?.(proposalId, prompt);
      if (verdict && script.reportReviewer !== false) {
        await harness.behavior.runCli([
          "harvest",
          "verdict",
          "--proposal",
          String(proposalId),
          "--token",
          tokenMatch![1],
          verdict.approve ? "--approve" : "--reject",
          "--reason",
          verdict.reason,
        ]);
        await script.afterReviewerReport?.(proposalId, prompt, harness);
      }
    }
    return makeThreadResponse({ id: `spawned-${harness.sdk.calls.length}` });
  }) as never);
  harness.sdk.stub("threads.wait", (async () => ({ matched: true })) as never);
  harness.sdk.stub("threads.archive", (async () => ({ ok: true })) as never);

  await plugin(bb);
  return host;
}

async function archiveAndSettle(
  harness: Awaited<ReturnType<typeof startPlugin>>["harness"],
  threadId: string,
) {
  let lastResult = "";
  await harness.behavior.emitThreadEvent("thread.archived", {
    thread: makeThreadResponse({
      id: threadId,
      projectId: "proj_test",
      visibility: "visible",
      originPluginId: null,
    }),
  });
  for (let attempt = 0; attempt < 2_000; attempt += 1) {
    const result = await harness.behavior.runCli([
      "harvest",
      "status",
      "--thread",
      threadId,
    ]);
    const parsed = JSON.parse(result.stdout || "{}") as {
      thread: { processedAt: number | null } | null;
    };
    lastResult = result.stdout ?? "";
    if (parsed.thread && parsed.thread.processedAt !== null) return parsed;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error(
    `harvest for ${threadId} did not settle: ${lastResult}; logs=${JSON.stringify(
      harness.logEntries.map((entry) => entry.message),
    )}`,
  );
}

async function writtenRuleFiles(root: string): Promise<string[]> {
  const categories = await readdir(join(root, "rules"), { withFileTypes: true });
  const files: string[] = [];
  for (const category of categories) {
    if (!category.isDirectory()) continue;
    const entries = await readdir(join(root, "rules", category.name));
    for (const entry of entries) files.push(`${category.name}/${entry}`);
  }
  return files.sort();
}

describe("harvest pure helpers", () => {
  it("allocates the next rule id after the highest existing one", () => {
    expect(allocateRuleId(["ddr_001", "ddr_036", "ddr_004"])).toBe("ddr_037");
    expect(allocateRuleId([])).toBe("ddr_001");
    expect(allocateRuleId(["ddr_040", "ext_010"])).toBe("ddr_041");
  });

  it("places a rule under its domain category", () => {
    expect(ruleRelativePath("visual.color", "ddr_037")).toBe(
      join("rules", "visual", "ddr_037.md"),
    );
  });

  it("normalizes proposals to a key that survives rewording of the body", () => {
    const first = normalizeRuleKey({
      domain: "visual.color",
      title: "Reserve alarm color for errors",
    });
    const second = normalizeRuleKey({
      domain: "visual.color",
      title: "Errors reserve the alarm color",
    });
    expect(first).toBe(second);
    expect(
      normalizeRuleKey({ domain: "visual.layout", title: "Reserve alarm color for errors" }),
    ).not.toBe(first);
  });

  it("renders markdown the doctrine parser accepts", async () => {
    const root = await makeDoctrineRoot();
    await writeFile(
      join(root, "rules", "visual-check.md"),
      "placeholder",
      "utf8",
    ).catch(() => undefined);
    await mkdir(join(root, "rules", "visual"), { recursive: true });
    await writeFile(
      join(root, "rules", "visual", "ddr_002.md"),
      renderRuleMarkdown(makeProposal(), "ddr_002", "2026-08-19"),
      "utf8",
    );
    const library = await loadDoctrine(root);
    const rule = library.rules.find((item) => item.id === "ddr_002");
    expect(rule?.title).toBe("Reserve alarm color for errors");
    expect(rule?.supporting_episodes).toBe(1);
    expect(rule?.evidence).toHaveLength(1);
    // Frontmatter is followed by a blank line, like the hand-written rules.
    expect(
      renderRuleMarkdown(makeProposal(), "ddr_002", "2026-08-19"),
    ).toContain("---\n\n# Reserve alarm color for errors");
  });

  it("never renders a single-episode rule as required or above low confidence", async () => {
    const root = await makeDoctrineRoot();
    await mkdir(join(root, "rules", "visual"), { recursive: true });
    await writeFile(
      join(root, "rules", "visual", "ddr_002.md"),
      renderRuleMarkdown(
        makeProposal({ strength: "required", confidence: "high" }),
        "ddr_002",
        "2026-08-19",
      ),
      "utf8",
    );
    await writeFile(
      join(root, "rules", "visual", "ddr_003.md"),
      renderRuleMarkdown(
        makeProposal({
          title: "Keep status chips neutral",
          strength: "required",
          confidence: "high",
          evidence: [
            "Asked that an attention state stop using the error color.",
            "Asked again that a pending chip stop looking like an error.",
          ],
        }),
        "ddr_003",
        "2026-08-19",
      ),
      "utf8",
    );
    await writeFile(
      join(root, "rules", "visual", "ddr_004.md"),
      renderRuleMarkdown(
        makeProposal({
          title: "Keep pending chips neutral",
          strength: "required",
          confidence: "high",
          evidence: [
            "Asked that an attention state stop using the error color.",
            "Asked again that a pending chip stop looking like an error.",
          ],
        }),
        "ddr_004",
        "2026-08-19",
        2,
      ),
      "utf8",
    );
    const library = await loadDoctrine(root);
    expect(library.rules.find((rule) => rule.id === "ddr_002")).toMatchObject({
      strength: "default",
      confidence: "low",
      supporting_episodes: 1,
    });
    expect(library.rules.find((rule) => rule.id === "ddr_003")).toMatchObject({
      strength: "default",
      confidence: "low",
    });
    expect(library.rules.find((rule) => rule.id === "ddr_004")).toMatchObject({
      strength: "required",
      confidence: "high",
    });
  });

  it("rejects identifiers, URLs, secrets, multiline text, and oversized rendered strings", () => {
    const base = makeProposal();
    const scalarFields = ["title", "statement", "domain", "why"] as const;
    const listFields = [
      "products",
      "activities",
      "artifacts",
      "surfaces",
      "prefer",
      "avoid",
      "use_when",
      "not_when",
      "exceptions",
      "evidence",
      "checks",
    ] as const;
    for (const field of scalarFields) {
      expect(
        harvestProposalSchema.safeParse({ ...base, [field]: "contains thr_private123" })
          .success,
        field,
      ).toBe(false);
    }
    for (const field of listFields) {
      expect(
        harvestProposalSchema.safeParse({ ...base, [field]: ["contains msg_private123"] })
          .success,
        field,
      ).toBe(false);
    }
    for (const unsafe of [
      "See https://private.example.test/design",
      "api_key=topsecretvalue",
      "line one\nline two",
      "x".repeat(1_001),
    ]) {
      expect(
        harvestProposalSchema.safeParse({ ...base, statement: unsafe }).success,
      ).toBe(false);
    }
    expect(
      harvestVerdictSchema.safeParse({
        approve: true,
        reason: "token=privatecredentialvalue",
      }).success,
    ).toBe(false);
    expect(() =>
      renderRuleMarkdown(
        { ...base, evidence: ["See https://private.example.test"] } as HarvestProposal,
        "ddr_002",
        "2026-08-24",
      ),
    ).toThrow();
  });

  it("excludes plugin-origin and hidden threads from harvest", () => {
    expect(
      isHarvestableThread({ id: "t", projectId: "p", title: null, visibility: "visible" }),
    ).toBe(true);
    expect(
      isHarvestableThread({
        id: "t",
        projectId: "p",
        title: null,
        visibility: "visible",
        originPluginId: "design-doctrine",
      }),
    ).toBe(false);
    expect(
      isHarvestableThread({ id: "t", projectId: "p", title: null, visibility: "hidden" }),
    ).toBe(false);
  });
});

describe("archive-triggered harvest", () => {
  it("writes a rule when the reviewer approves", async () => {
    const root = await makeDoctrineRoot();
    const script: AgentScript = {
      propose: () => [makeProposal()],
      review: () => ({ approve: true, reason: "new, and grounded in this thread" }),
      reviewerPrompts: [],
      harvesterPrompts: [],
    };
    const { harness } = await startPlugin(root, script);

    const status = await archiveAndSettle(harness, "thr_approve");

    expect(await writtenRuleFiles(root)).toEqual([
      "interaction/ddr_001.md",
      "visual/ddr_002.md",
    ]);
    const written = await readFile(join(root, "rules", "visual", "ddr_002.md"), "utf8");
    expect(written).toContain("# Reserve alarm color for errors");
    const library = await loadDoctrine(root);
    expect(library.rules.map((rule) => rule.id).sort()).toEqual([
      "ddr_001",
      "ddr_002",
    ]);
    expect(status.thread).toMatchObject({ outcome: "approved:1" });
    const spawns = harness.sdk.callsTo("threads.spawn").map(([args]) => args);
    expect(spawns).toHaveLength(2);
    expect(spawns).toEqual(
      spawns.map(() =>
        expect.objectContaining({
          projectId: "proj_personal",
          environment: { type: "host", workspace: { type: "personal" } },
        }),
      ),
    );
    expect(harness.sdk.callsTo("threads.archive")).toHaveLength(spawns.length);
    const rulesStatus = await execFileAsync("git", [
      "-C",
      root,
      "status",
      "--porcelain=v1",
      "--untracked-files=all",
      "--",
      "rules",
    ]);
    expect(rulesStatus.stdout).toBe("");
    const commits = await execFileAsync("git", [
      "-C",
      root,
      "log",
      "--format=%s",
      "--",
      "rules",
    ]);
    expect(commits.stdout).toContain("doctrine: harvest archived feedback");
    expect(
      harness.logEntries.some((entry) =>
        entry.message.includes("committed rules/visual/ddr_002.md"),
      ),
    ).toBe(true);
    await harness.lifecycle.dispose();
  });

  it("commits approved rules when the plugin is a subdirectory of its repository", async () => {
    const root = await makeDoctrineRoot({ nested: true });
    const script: AgentScript = {
      propose: () => [makeProposal()],
      review: () => ({ approve: true, reason: "new, and grounded in this thread" }),
      reviewerPrompts: [],
      harvesterPrompts: [],
    };
    const { harness } = await startPlugin(root, script);

    const status = await archiveAndSettle(harness, "thr_nested");

    expect(status.thread).toMatchObject({ outcome: "approved:1" });
    expect(await writtenRuleFiles(root)).toEqual([
      "interaction/ddr_001.md",
      "visual/ddr_002.md",
    ]);
    const committed = await execFileAsync("git", [
      "-C",
      root,
      "log",
      "-1",
      "--name-only",
      "--format=%s",
    ]);
    expect(committed.stdout).toContain("plugins/design-doctrine/rules/visual/ddr_002.md");
    await harness.lifecycle.dispose();
  });

  it("commits multiple approved rules with distinct ids in one batch", async () => {
    const root = await makeDoctrineRoot();
    const script: AgentScript = {
      propose: () => [
        makeProposal(),
        makeProposal({
          title: "Keep warnings visually distinct from errors",
          statement:
            "Warning states use their own treatment instead of borrowing the error signal.",
          domain: "visual.status",
        }),
      ],
      review: () => ({ approve: true, reason: "new and grounded" }),
      reviewerPrompts: [],
      harvesterPrompts: [],
    };
    const { harness } = await startPlugin(root, script);

    const status = await archiveAndSettle(harness, "thr_batch");

    expect(await writtenRuleFiles(root)).toEqual([
      "interaction/ddr_001.md",
      "visual/ddr_002.md",
      "visual/ddr_003.md",
    ]);
    expect(status.thread).toMatchObject({ outcome: "approved:2" });
    const latestCommit = await execFileAsync("git", [
      "-C",
      root,
      "show",
      "--format=%s",
      "--name-only",
      "HEAD",
    ]);
    expect(latestCommit.stdout).toContain("doctrine: harvest archived feedback");
    expect(latestCommit.stdout).toContain("rules/visual/ddr_002.md");
    expect(latestCommit.stdout).toContain("rules/visual/ddr_003.md");
    await harness.lifecycle.dispose();
  });

  it("writes nothing and records the reason when the reviewer rejects", async () => {
    const root = await makeDoctrineRoot();
    const script: AgentScript = {
      propose: () => [makeProposal()],
      review: () => ({ approve: false, reason: "already covered by ddr_001" }),
      reviewerPrompts: [],
      harvesterPrompts: [],
    };
    const { harness } = await startPlugin(root, script);

    await archiveAndSettle(harness, "thr_reject");

    expect(await writtenRuleFiles(root)).toEqual(["interaction/ddr_001.md"]);
    const status = await harness.behavior.runCli([
      "harvest",
      "status",
      "--thread",
      "thr_reject",
    ]);
    expect(status.stdout).toContain("already covered by ddr_001");
    expect(status.stdout).toContain('"verdict": "rejected"');
    expect(
      harness.logEntries.some((entry) =>
        entry.message.includes("already covered by ddr_001"),
      ),
    ).toBe(true);
    await harness.lifecycle.dispose();
  });

  it("spawns no reviewer and writes nothing when the thread warrants no rule", async () => {
    const root = await makeDoctrineRoot();
    const script: AgentScript = {
      propose: () => [],
      reviewerPrompts: [],
      harvesterPrompts: [],
    };
    const { harness } = await startPlugin(root, script);

    const status = await archiveAndSettle(harness, "thr_quiet");

    expect(await writtenRuleFiles(root)).toEqual(["interaction/ddr_001.md"]);
    expect(script.reviewerPrompts).toHaveLength(0);
    expect(status.thread).toMatchObject({ outcome: "no-proposals" });
    expect(
      harness.logEntries.some((entry) =>
        entry.message.includes("no proposals from thr_quiet"),
      ),
    ).toBe(true);
    await harness.behavior.emitThreadEvent("thread.archived", {
      thread: makeThreadResponse({ id: "thr_quiet", projectId: "proj_test" }),
    });
    expect(script.harvesterPrompts).toHaveLength(1);
    await harness.lifecycle.dispose();
  });

  it("rejects unsafe CLI proposals and missing or incorrect harvester capabilities without writing", async () => {
    const root = await makeDoctrineRoot();
    const script: AgentScript = {
      propose: () => [makeProposal()],
      reportHarvester: false,
      reviewerPrompts: [],
      harvesterPrompts: [],
    };
    const { harness } = await startPlugin(root, script);
    await harness.behavior.emitThreadEvent("thread.archived", {
      thread: makeThreadResponse({
        id: "thr_untrusted",
        projectId: "proj_test",
        visibility: "visible",
      }),
    });
    await waitFor(
      () => script.harvesterPrompts.length === 1,
      "harvester prompt was not captured",
    );
    const prompt = script.harvesterPrompts[0];
    const token = /--token (\S+)/.exec(prompt)?.[1];
    expect(token).toBeTruthy();
    const unsafe = {
      ...makeProposal(),
      evidence: ["Read https://private.example.test/thread"],
    } as HarvestProposal;
    for (const tokenArgs of [[], ["--token", "wrong-capability"]]) {
      const result = await harness.behavior.runCli([
        "harvest",
        "propose",
        "--thread",
        "thr_untrusted",
        ...tokenArgs,
        "--json",
        JSON.stringify([makeProposal()]),
      ]);
      expect(result.exitCode).toBe(1);
    }
    const unsafeResult = await harness.behavior.runCli([
      "harvest",
      "propose",
      "--thread",
      "thr_untrusted",
      "--token",
      token!,
      "--json",
      JSON.stringify([unsafe]),
    ]);
    expect(unsafeResult.exitCode).toBe(1);
    const status = await harness.behavior.runCli([
      "harvest",
      "status",
      "--thread",
      "thr_untrusted",
    ]);
    expect(status.stdout).not.toContain(token!);
    expect(status.stdout).toContain('"proposals": []');
    expect(await writtenRuleFiles(root)).toEqual(["interaction/ddr_001.md"]);
    const commits = await execFileAsync("git", ["-C", root, "rev-list", "--count", "HEAD"]);
    expect(commits.stdout.trim()).toBe("1");
    await harness.lifecycle.dispose();
  });

  it("requires a one-time reviewer capability and redacts it from status", async () => {
    const root = await makeDoctrineRoot();
    const reviewerGate = deferred();
    const script: AgentScript = {
      propose: () => [makeProposal()],
      review: () => ({ approve: true, reason: "new and grounded" }),
      reportReviewer: false,
      waitForReviewer: () => reviewerGate.promise,
      reviewerPrompts: [],
      harvesterPrompts: [],
    };
    const { harness } = await startPlugin(root, script);
    await harness.behavior.emitThreadEvent("thread.archived", {
      thread: makeThreadResponse({
        id: "thr_reviewer_capability",
        projectId: "proj_test",
        visibility: "visible",
      }),
    });
    await waitFor(
      () => script.reviewerPrompts.length === 1,
      "reviewer prompt was not captured",
    );
    const prompt = script.reviewerPrompts[0];
    const proposalId = Number(/--proposal (\d+)/.exec(prompt)?.[1]);
    const token = /--token (\S+)/.exec(prompt)?.[1];
    expect(proposalId).toBeGreaterThan(0);
    expect(token).toBeTruthy();
    for (const tokenArgs of [[], ["--token", "wrong-capability"]]) {
      const result = await harness.behavior.runCli([
        "harvest",
        "verdict",
        "--proposal",
        String(proposalId),
        ...tokenArgs,
        "--approve",
        "--reason",
        "new and grounded",
      ]);
      expect(result.exitCode).toBe(1);
    }
    const before = await harness.behavior.runCli([
      "harvest",
      "status",
      "--thread",
      "thr_reviewer_capability",
    ]);
    expect(before.stdout).not.toContain(token!);
    expect(before.stdout).toContain('"verdict": null');
    expect(before.stdout).toContain('"reason": null');

    const accepted = await harness.behavior.runCli([
      "harvest",
      "verdict",
      "--proposal",
      String(proposalId),
      "--token",
      token!,
      "--approve",
      "--reason",
      "new and grounded",
    ]);
    expect(accepted.exitCode).toBe(0);
    const replay = await harness.behavior.runCli([
      "harvest",
      "verdict",
      "--proposal",
      String(proposalId),
      "--token",
      token!,
      "--reject",
      "--reason",
      "changed my mind",
    ]);
    expect(replay.exitCode).toBe(1);
    reviewerGate.resolve();
    const status = await archiveAndSettle(harness, "thr_reviewer_capability");
    expect(status.thread).toMatchObject({ outcome: "approved:1" });
    await harness.lifecycle.dispose();
  });

  it("never re-harvests a thread across repeated archive cycles", async () => {
    const root = await makeDoctrineRoot();
    const script: AgentScript = {
      propose: () => [makeProposal()],
      review: () => ({ approve: true, reason: "new" }),
      reviewerPrompts: [],
      harvesterPrompts: [],
    };
    const { harness } = await startPlugin(root, script);

    await archiveAndSettle(harness, "thr_once");
    // Unarchive/re-archive cycles re-fire the event; the thread is already known.
    await harness.behavior.emitThreadEvent("thread.archived", {
      thread: makeThreadResponse({ id: "thr_once", projectId: "proj_test" }),
    });
    await harness.behavior.emitThreadEvent("thread.archived", {
      thread: makeThreadResponse({ id: "thr_once", projectId: "proj_test" }),
    });

    expect(script.harvesterPrompts).toHaveLength(1);
    expect(await writtenRuleFiles(root)).toEqual([
      "interaction/ddr_001.md",
      "visual/ddr_002.md",
    ]);
    await harness.lifecycle.dispose();
  });

  it("keeps approved work pending after a commit failure and resumes once without rerunning agents", async () => {
    const root = await makeDoctrineRoot();
    const proposal = makeProposal();
    const hookPath = join(root, ".git", "hooks", "pre-commit");
    await writeFile(hookPath, "#!/bin/sh\nexit 1\n", "utf8");
    await chmod(hookPath, 0o755);
    const script: AgentScript = {
      // A repeated report in one worker call must reuse the same rule key.
      propose: () => [proposal, proposal],
      review: () => ({ approve: true, reason: "new and grounded" }),
      reviewerPrompts: [],
      harvesterPrompts: [],
    };
    const { harness } = await startPlugin(root, script);
    await harness.behavior.emitThreadEvent("thread.archived", {
      thread: makeThreadResponse({
        id: "thr_commit_retry",
        projectId: "proj_test",
        visibility: "visible",
      }),
    });
    await waitFor(
      () =>
        harness.logEntries.some((entry) =>
          entry.message.includes("approved rule batch for thr_commit_retry remains pending"),
        ),
      "failed commit did not leave the batch pending",
    );
    const pending = await harness.behavior.runCli([
      "harvest",
      "status",
      "--thread",
      "thr_commit_retry",
    ]);
    expect(pending.stdout).toContain('"processedAt": null');
    expect(pending.stdout).toContain('"verdict": "approved"');
    expect(pending.stdout).toContain('"written_path": null');
    expect(pending.stdout?.match(/"rule_key"/g)).toHaveLength(1);
    expect(await writtenRuleFiles(root)).toEqual(["interaction/ddr_001.md"]);

    await unlink(hookPath);
    const status = await archiveAndSettle(harness, "thr_commit_retry");
    expect(status.thread).toMatchObject({ outcome: "approved:1" });
    expect(script.harvesterPrompts).toHaveLength(1);
    expect(script.reviewerPrompts).toHaveLength(1);
    expect(await writtenRuleFiles(root)).toEqual([
      "interaction/ddr_001.md",
      "visual/ddr_002.md",
    ]);
    const commits = await execFileAsync("git", [
      "-C",
      root,
      "log",
      "--format=%s",
      "--",
      "rules/visual/ddr_002.md",
    ]);
    expect(commits.stdout.trim().split("\n")).toEqual([
      "doctrine: harvest archived feedback",
    ]);
    await harness.lifecycle.dispose();
  });

  it("re-reviews against a fresh catalog when maintenance HEAD changes before commit", async () => {
    const root = await makeDoctrineRoot();
    let changedHead = false;
    const concurrentRule = makeProposal({
      title: "Keep pending status distinct from errors",
      statement:
        "Pending status uses a neutral treatment instead of borrowing the error signal.",
      domain: "visual.status",
    });
    const script: AgentScript = {
      propose: () => [makeProposal()],
      review: () => ({ approve: true, reason: "new and grounded" }),
      afterReviewerReport: async () => {
        if (changedHead) return;
        changedHead = true;
        await commitRule(root, concurrentRule, "ddr_002");
      },
      reviewerPrompts: [],
      harvesterPrompts: [],
    };
    const { harness } = await startPlugin(root, script);

    const status = await archiveAndSettle(harness, "thr_head_race");

    expect(status.thread).toMatchObject({ outcome: "approved:1" });
    expect(script.reviewerPrompts).toHaveLength(2);
    expect(script.reviewerPrompts[1]).toContain(
      "Keep pending status distinct from errors",
    );
    expect(await writtenRuleFiles(root)).toEqual([
      "interaction/ddr_001.md",
      "visual/ddr_002.md",
      "visual/ddr_003.md",
    ]);
    await harness.lifecycle.dispose();
  });

  it("freezes the doctrine root for catalog, validation, and commit across a settings change", async () => {
    const originalRoot = await makeDoctrineRoot();
    const changedRoot = await makeDoctrineRoot();
    let changedSettings = false;
    const script: AgentScript = {
      propose: () => [makeProposal()],
      review: () => ({ approve: true, reason: "new and grounded" }),
      afterReviewerReport: async (_proposalId, _prompt, harness) => {
        if (changedSettings) return;
        changedSettings = true;
        await harness.behavior.setSettings({ doctrinePath: changedRoot });
      },
      reviewerPrompts: [],
      harvesterPrompts: [],
    };
    const { harness } = await startPlugin(originalRoot, script);

    const status = await archiveAndSettle(harness, "thr_root_freeze");

    expect(status.thread).toMatchObject({ outcome: "approved:1" });
    expect(await writtenRuleFiles(originalRoot)).toEqual([
      "interaction/ddr_001.md",
      "visual/ddr_002.md",
    ]);
    expect(await writtenRuleFiles(changedRoot)).toEqual([
      "interaction/ddr_001.md",
    ]);
    await harness.lifecycle.dispose();
  });

  it("tells the reviewer when a previously rejected proposal recurs across threads", async () => {
    const root = await makeDoctrineRoot();
    const script: AgentScript = {
      propose: () => [makeProposal()],
      review: (_proposalId, prompt) =>
        prompt.includes("reaches the recurrence threshold")
          ? { approve: true, reason: "pattern has now repeated independently" }
          : { approve: false, reason: "single-thread evidence is too thin" },
      reviewerPrompts: [],
      harvesterPrompts: [],
    };
    const { harness } = await startPlugin(root, script);

    await archiveAndSettle(harness, "thr_signal_a");
    await archiveAndSettle(harness, "thr_signal_b");

    // First two threads: below threshold, judged on their own evidence.
    expect(script.reviewerPrompts[0]).toContain("raised in 1 distinct thread");
    expect(script.reviewerPrompts[0]).toContain("below the recurrence threshold");
    expect(script.reviewerPrompts[1]).toContain("raised in 2 distinct thread");
    expect(await writtenRuleFiles(root)).toEqual(["interaction/ddr_001.md"]);

    // The third thread carries the prior rejections and their reasons.
    await archiveAndSettle(harness, "thr_signal_c");
    expect(script.reviewerPrompts[2]).toContain("raised in 3 distinct thread");
    expect(script.reviewerPrompts[2]).toContain("reaches the recurrence threshold");
    expect(script.reviewerPrompts[2]).toContain("single-thread evidence is too thin");
    expect(await writtenRuleFiles(root)).toEqual([
      "interaction/ddr_001.md",
      "visual/ddr_002.md",
    ]);
    await harness.lifecycle.dispose();
  });

  it("drops a proposal that duplicates one already approved, without a reviewer", async () => {
    const root = await makeDoctrineRoot();
    const script: AgentScript = {
      propose: () => [makeProposal()],
      review: () => ({ approve: true, reason: "new" }),
      reviewerPrompts: [],
      harvesterPrompts: [],
    };
    const { harness } = await startPlugin(root, script);

    await archiveAndSettle(harness, "thr_first");
    expect(script.reviewerPrompts).toHaveLength(1);

    await archiveAndSettle(harness, "thr_duplicate");

    expect(script.reviewerPrompts).toHaveLength(1);
    expect(await writtenRuleFiles(root)).toEqual([
      "interaction/ddr_001.md",
      "visual/ddr_002.md",
    ]);
    const status = await harness.behavior.runCli([
      "harvest",
      "status",
      "--thread",
      "thr_duplicate",
    ]);
    expect(status.stdout).toContain("duplicate of an already-approved proposal");
    await harness.lifecycle.dispose();
  });

  it("purges a deleted queued thread before any worker can record or commit", async () => {
    const root = await makeDoctrineRoot();
    const blockerGate = deferred();
    const script: AgentScript = {
      propose: () => [],
      waitForHarvester: (threadId) =>
        threadId === "thr_queue_blocker" ? blockerGate.promise : Promise.resolve(),
      reviewerPrompts: [],
      harvesterPrompts: [],
    };
    const { harness } = await startPlugin(root, script);
    await harness.behavior.emitThreadEvent("thread.archived", {
      thread: makeThreadResponse({
        id: "thr_queue_blocker",
        projectId: "proj_test",
        visibility: "visible",
      }),
    });
    await waitFor(
      () => script.harvesterPrompts.length === 1,
      "blocking harvester did not start",
    );
    await harness.behavior.emitThreadEvent("thread.archived", {
      thread: makeThreadResponse({
        id: "thr_deleted_queued",
        projectId: "proj_test",
        visibility: "visible",
      }),
    });
    await harness.behavior.emitThreadEvent("thread.deleted", {
      thread: makeThreadResponse({
        id: "thr_deleted_queued",
        projectId: "proj_test",
      }),
    });
    blockerGate.resolve();
    await archiveAndSettle(harness, "thr_queue_blocker");

    const status = await harness.behavior.runCli([
      "harvest",
      "status",
      "--thread",
      "thr_deleted_queued",
    ]);
    expect(status.stdout).toContain('"thread": null');
    expect(status.stdout).toContain('"proposals": []');
    expect(script.harvesterPrompts).toHaveLength(1);
    expect(await writtenRuleFiles(root)).toEqual(["interaction/ddr_001.md"]);
    await harness.lifecycle.dispose();
  });

  it("purges a thread deleted while its reviewer is in flight and never commits", async () => {
    const root = await makeDoctrineRoot();
    const reviewerGate = deferred();
    const script: AgentScript = {
      propose: () => [makeProposal()],
      review: () => ({ approve: true, reason: "new and grounded" }),
      waitForReviewer: () => reviewerGate.promise,
      reviewerPrompts: [],
      harvesterPrompts: [],
    };
    const { harness } = await startPlugin(root, script);
    await harness.behavior.emitThreadEvent("thread.archived", {
      thread: makeThreadResponse({
        id: "thr_deleted_in_flight",
        projectId: "proj_test",
        visibility: "visible",
      }),
    });
    await waitFor(
      () => script.reviewerPrompts.length === 1,
      "reviewer did not start",
    );
    await harness.behavior.emitThreadEvent("thread.deleted", {
      thread: makeThreadResponse({
        id: "thr_deleted_in_flight",
        projectId: "proj_test",
      }),
    });
    reviewerGate.resolve();
    await waitFor(
      () => harness.sdk.callsTo("threads.wait").length >= 2,
      "in-flight reviewer did not finish",
    );

    const status = await harness.behavior.runCli([
      "harvest",
      "status",
      "--thread",
      "thr_deleted_in_flight",
    ]);
    expect(status.stdout).toContain('"thread": null');
    expect(status.stdout).toContain('"proposals": []');
    expect(await writtenRuleFiles(root)).toEqual(["interaction/ddr_001.md"]);
    const commits = await execFileAsync("git", ["-C", root, "rev-list", "--count", "HEAD"]);
    expect(commits.stdout.trim()).toBe("1");
    await harness.lifecycle.dispose();
  });
});

describe("harvest activity feed", () => {
  interface ActivityPage {
    queued: number;
    processedToday: number;
    publication: { url: string } | null;
    items: Array<{
      threadId: string;
      title: string | null;
      result: string;
      addedRuleIds: string[];
      proposals: Array<{ title: string; result: string; reason: string | null; ruleId: string | null }>;
    }>;
    nextCursor: { processedAt: number; threadId: string } | null;
  }

  it("pages processed threads newest first by keyset and labels unpublished approvals as waiting", async () => {
    const root = await makeDoctrineRoot();
    const { bb, harness } = await startPlugin(root, {
      propose: () => [],
      reviewerPrompts: [],
      harvesterPrompts: [],
    });
    harness.sdk.stub("threads.get", (async ({ threadId }: { threadId: string }) => {
      if (threadId === "thr_gone") throw new Error("thread not found");
      return makeThreadResponse({ id: threadId, title: `Title ${threadId}` });
    }) as never);
    await harness.behavior.callRpc("getHarvestActivity", {});
    const database = bb.storage.database();
    const insertThread = database.prepare(
      `INSERT INTO harvest_threads (thread_id, project_id, queued_at, processed_at, outcome)
       VALUES (?, 'proj_test', 0, ?, ?)`,
    );
    const insertProposal = database.prepare(
      `INSERT INTO harvest_proposals (thread_id, rule_key, payload, created_at, verdict, reason, written_path)
       VALUES (?, ?, ?, 0, ?, ?, ?)`,
    );
    const payload = (title: string) => JSON.stringify(makeProposal({ title }));
    insertThread.run("thr_a", 3_000, "approved:1");
    insertProposal.run("thr_a", "a", payload("Published rule"), "approved", "grounded", "rules/interaction/ddr_001.md");
    insertThread.run("thr_b", 3_000, "approved:1");
    insertProposal.run("thr_b", "b", payload("Committed, not merged"), "approved", "grounded", "rules/visual/ddr_009.md");
    insertThread.run("thr_c", 2_000, "no-approvals");
    insertProposal.run("thr_c", "c1", payload("Approved, never written"), "approved", "grounded", null);
    insertProposal.run("thr_c", "c2", payload("Duplicate idea"), "rejected", "already covered by ddr_001", null);
    insertThread.run("thr_gone", 1_000, "no-approvals");
    insertProposal.run("thr_gone", "d", payload("Thin evidence"), "rejected", "one-off preference", null);
    insertThread.run("thr_queued", null, null);

    const first = (await harness.behavior.callRpc("getHarvestActivity", {
      limit: 2,
      dayStart: 1_500,
    })) as ActivityPage;
    expect(first).toMatchObject({ queued: 1, processedToday: 3, publication: null });
    expect(first.items.map((item) => [item.threadId, item.result, item.addedRuleIds])).toEqual([
      ["thr_b", "waiting", []],
      ["thr_a", "added", ["ddr_001"]],
    ]);
    expect(first.items[0].title).toBe("Title thr_b");
    expect(first.nextCursor).toEqual({ processedAt: 3_000, threadId: "thr_a" });

    const second = (await harness.behavior.callRpc("getHarvestActivity", {
      limit: 2,
      before: first.nextCursor,
      dayStart: 1_500,
    })) as ActivityPage;
    expect(second.items.map((item) => [item.threadId, item.result])).toEqual([
      ["thr_c", "waiting"],
      ["thr_gone", "rejected"],
    ]);
    expect(second.items[0].proposals).toEqual([
      expect.objectContaining({ title: "Approved, never written", result: "waiting", ruleId: null }),
      expect.objectContaining({ title: "Duplicate idea", result: "rejected", reason: "already covered by ddr_001" }),
    ]);
    expect(second.items[1].title).toBeNull();
    expect(second.nextCursor).toBeNull();

    const cli = await harness.behavior.runCli(["harvest", "activity", "--limit", "1"]);
    expect(cli.exitCode).toBe(0);
    expect(cli.stdout).toMatch(/^1 thread queued · 0 processed today\n/);
    expect(cli.stdout).toContain("Title thr_b · Waiting to publish");
    expect(cli.stdout.trim().split("\n")).toHaveLength(2);
    await harness.lifecycle.dispose();
  });

  it("lists only threads that proposed a rule, keeping keyset pages full", async () => {
    const root = await makeDoctrineRoot();
    const { bb, harness } = await startPlugin(root, {
      propose: () => [],
      reviewerPrompts: [],
      harvesterPrompts: [],
    });
    await harness.behavior.callRpc("getHarvestActivity", {});
    const database = bb.storage.database();
    const insertThread = database.prepare(
      `INSERT INTO harvest_threads (thread_id, project_id, queued_at, processed_at, outcome)
       VALUES (?, 'proj_test', 0, ?, ?)`,
    );
    const insertProposal = database.prepare(
      `INSERT INTO harvest_proposals (thread_id, rule_key, payload, created_at, verdict, reason)
       VALUES (?, ?, ?, 0, 'rejected', 'one-off preference')`,
    );
    for (const [threadId, processedAt, proposed] of [
      ["thr_1", 5_000, true],
      ["thr_empty_a", 4_000, false],
      ["thr_empty_b", 4_000, false],
      ["thr_2", 3_000, true],
      ["thr_empty_c", 2_000, false],
      ["thr_3", 1_000, true],
    ] as const) {
      insertThread.run(threadId, processedAt, proposed ? "no-approvals" : "no-proposals");
      if (proposed) {
        insertProposal.run(threadId, threadId, JSON.stringify(makeProposal({ title: `Rule number ${processedAt}` })));
      }
    }

    const first = (await harness.behavior.callRpc("getHarvestActivity", {
      limit: 2,
      dayStart: 0,
    })) as ActivityPage;
    expect(first.processedToday).toBe(6);
    expect(first.items.map((item) => item.threadId)).toEqual(["thr_1", "thr_2"]);
    expect(first.nextCursor).toEqual({ processedAt: 3_000, threadId: "thr_2" });
    const second = (await harness.behavior.callRpc("getHarvestActivity", {
      limit: 2,
      before: first.nextCursor,
      dayStart: 0,
    })) as ActivityPage;
    expect(second.items.map((item) => item.threadId)).toEqual(["thr_3"]);
    expect(second.nextCursor).toBeNull();

    const cli = await harness.behavior.runCli(["harvest", "activity"]);
    expect(cli.stdout).not.toContain("thr_empty");
    expect(cli.stdout.trim().split("\n")).toHaveLength(4);
    await harness.lifecycle.dispose();
  });

  it("cancels a waiting rule so no carried approval can commit it", async () => {
    const root = await makeDoctrineRoot();
    const { bb, harness } = await startPlugin(root, {
      propose: () => [],
      reviewerPrompts: [],
      harvesterPrompts: [],
    });
    await harness.behavior.callRpc("getHarvestActivity", {});
    const head = (await execFileAsync("git", ["-C", root, "rev-parse", "HEAD"])).stdout.trim();
    const database = bb.storage.database();
    const insertProposal = database.prepare(
      `INSERT INTO harvest_proposals (thread_id, rule_key, payload, created_at, verdict, reason, written_path)
       VALUES (?, ?, ?, 0, 'approved', 'grounded', ?)`,
    );
    database
      .prepare(
        `INSERT INTO harvest_threads (thread_id, project_id, queued_at, processed_at, outcome)
         VALUES ('thr_carried', 'proj_test', 0, NULL, ?)`,
      )
      .run(`pending:reviewed:${head}`);
    const carried = Number(
      insertProposal.run(
        "thr_carried",
        "carried",
        JSON.stringify(makeProposal({ title: "Deliver notes through the workspace" })),
        null,
      ).lastInsertRowid,
    );
    database
      .prepare(
        `INSERT INTO harvest_threads (thread_id, project_id, queued_at, processed_at, outcome)
         VALUES ('thr_stale', 'proj_test', 0, 2000, 'approved:1')`,
      )
      .run();
    const stale = Number(
      insertProposal.run(
        "thr_stale",
        "stale",
        JSON.stringify(makeProposal({ title: "Never merged" })),
        "rules/visual/ddr_009.md",
      ).lastInsertRowid,
    );

    const cancelledCarried = await harness.behavior.runCli([
      "harvest",
      "cancel",
      "--proposal",
      String(carried),
    ]);
    expect(cancelledCarried).toMatchObject({ exitCode: 0 });
    expect(cancelledCarried.stdout).toBe(`Cancelled proposal ${carried}.\n`);
    expect(
      await harness.behavior.callRpc("cancelProposal", { proposalId: stale }),
    ).toEqual({ proposalId: stale, ruleId: "ddr_009", publication: null });
    expect(
      harness.inspection.realtimeSignals.some((signal) => signal.channel === "harvest-changed"),
    ).toBe(true);

    const settled = await archiveAndSettle(harness, "thr_carried");
    expect(settled).toMatchObject({
      thread: { outcome: "no-approvals" },
      proposals: [{ id: carried, verdict: "cancelled", reason: "Cancelled by you", written_path: null }],
    });
    expect(await writtenRuleFiles(root)).toEqual(["interaction/ddr_001.md"]);

    const activity = (await harness.behavior.callRpc("getHarvestActivity", {})) as ActivityPage;
    expect(activity.items.find((item) => item.threadId === "thr_stale")).toMatchObject({
      result: "cancelled",
      proposals: [{ title: "Never merged", result: "cancelled", ruleId: null, reason: "Cancelled by you" }],
    });
    await harness.lifecycle.dispose();
  });

  it("refuses to cancel a rule that is not waiting to publish", async () => {
    const root = await makeDoctrineRoot();
    const { bb, harness } = await startPlugin(root, {
      propose: () => [],
      reviewerPrompts: [],
      harvesterPrompts: [],
    });
    await harness.behavior.callRpc("getHarvestActivity", {});
    const database = bb.storage.database();
    database
      .prepare(
        `INSERT INTO harvest_threads (thread_id, project_id, queued_at, processed_at, outcome)
         VALUES ('thr_done', 'proj_test', 0, 1000, 'approved:1')`,
      )
      .run();
    const insertProposal = database.prepare(
      `INSERT INTO harvest_proposals (thread_id, rule_key, payload, created_at, verdict, reason, written_path)
       VALUES ('thr_done', ?, ?, 0, ?, ?, ?)`,
    );
    const published = Number(
      insertProposal.run("p", JSON.stringify(makeProposal()), "approved", "grounded", "rules/interaction/ddr_001.md")
        .lastInsertRowid,
    );
    const rejected = Number(
      insertProposal.run("r", JSON.stringify(makeProposal({ title: "Thin idea" })), "rejected", "one-off", null)
        .lastInsertRowid,
    );
    const statusBefore = await harness.behavior.runCli(["harvest", "status", "--thread", "thr_done"]);

    await expect(
      harness.behavior.callRpc("cancelProposal", { proposalId: published }),
    ).rejects.toThrow("ddr_001 is already published; retire the rule instead");
    const refusedRejected = await harness.behavior.runCli([
      "harvest",
      "cancel",
      "--proposal",
      String(rejected),
    ]);
    expect(refusedRejected.exitCode).toBe(1);
    expect(refusedRejected.stderr).toContain(`Proposal ${rejected} was rejected`);
    await expect(
      harness.behavior.callRpc("cancelProposal", { proposalId: 9_999 }),
    ).rejects.toThrow("Proposal 9999 not found");

    expect(
      (await harness.behavior.runCli(["harvest", "status", "--thread", "thr_done"])).stdout,
    ).toBe(statusBefore.stdout);
    await harness.lifecycle.dispose();
  });

  it("announces a finished thread and shows the reviewer's rejection reason", async () => {
    const root = await makeDoctrineRoot();
    const { harness } = await startPlugin(root, {
      propose: () => [makeProposal()],
      review: () => ({ approve: false, reason: "already covered by ddr_001" }),
      reviewerPrompts: [],
      harvesterPrompts: [],
    });

    await archiveAndSettle(harness, "thr_rejected_feed");

    expect(
      harness.inspection.realtimeSignals.filter(
        (signal) => signal.channel === "harvest-changed",
      ).length,
    ).toBeGreaterThanOrEqual(2);
    const activity = (await harness.behavior.callRpc("getHarvestActivity", {})) as ActivityPage;
    expect(activity.items).toEqual([
      expect.objectContaining({
        threadId: "thr_rejected_feed",
        result: "rejected",
        proposals: [
          expect.objectContaining({
            title: "Reserve alarm color for errors",
            result: "rejected",
            reason: "already covered by ddr_001",
          }),
        ],
      }),
    ]);
    await harness.lifecycle.dispose();
  });
});
