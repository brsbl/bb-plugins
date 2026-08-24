import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

import {
  createFakePluginHost,
  makeThreadResponse,
} from "@get-bb/plugin-sdk/testing";
import { afterEach, describe, expect, it } from "vitest";

import {
  allocateRuleId,
  harvestProposalSchema,
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

async function makeDoctrineRoot(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), "doctrine-harvest-"));
  temporaryRoots.push(root);
  await mkdir(join(root, "rules", "interaction"), { recursive: true });
  await writeFile(join(root, "rules", "interaction", "ddr_001.md"), SEED_RULE, "utf8");
  await execFileAsync("git", ["-C", root, "init", "-b", "doctrine-maintenance"]);
  await execFileAsync("git", ["-C", root, "config", "user.name", "Design Doctrine Test"]);
  await execFileAsync("git", ["-C", root, "config", "user.email", "doctrine-test@example.com"]);
  await execFileAsync("git", ["-C", root, "add", "rules/interaction/ddr_001.md"]);
  await execFileAsync("git", ["-C", root, "commit", "-m", "seed rules"]);
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

interface AgentScript {
  /** JSON array the harvester reports for a given archived thread. */
  propose: (threadId: string) => HarvestProposal[];
  /** Verdict the reviewer reports for a given proposal id. */
  review?: (proposalId: number, prompt: string) => { approve: boolean; reason: string };
  /** Prompts handed to reviewer agents, in order. */
  reviewerPrompts: string[];
  /** Prompts handed to harvester agents, in order. */
  harvesterPrompts: string[];
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
    if (proposeMatch && !reviewMatch) {
      script.harvesterPrompts.push(prompt);
      const threadId = proposeMatch[1];
      await harness.behavior.runCli([
        "harvest",
        "propose",
        "--thread",
        threadId,
        "--json",
        JSON.stringify(script.propose(threadId)),
      ]);
    } else if (reviewMatch) {
      script.reviewerPrompts.push(prompt);
      const proposalId = Number(reviewMatch[1]);
      const verdict = script.review?.(proposalId, prompt);
      if (verdict) {
        await harness.behavior.runCli([
          "harvest",
          "verdict",
          "--proposal",
          String(proposalId),
          verdict.approve ? "--approve" : "--reject",
          "--reason",
          verdict.reason,
        ]);
      }
    }
    return makeThreadResponse({ id: `spawned-${harness.sdk.calls.length}` });
  }) as never);
  harness.sdk.stub("threads.wait", (async () => ({ matched: true })) as never);

  await plugin(bb);
  return host;
}

async function archiveAndSettle(
  harness: Awaited<ReturnType<typeof startPlugin>>["harness"],
  threadId: string,
) {
  await harness.behavior.emitThreadEvent("thread.archived", {
    thread: makeThreadResponse({
      id: threadId,
      projectId: "proj_test",
      visibility: "visible",
      originPluginId: null,
    }),
  });
  for (let attempt = 0; attempt < 200; attempt += 1) {
    const result = await harness.behavior.runCli([
      "harvest",
      "status",
      "--thread",
      threadId,
    ]);
    const parsed = JSON.parse(result.stdout ?? "{}") as {
      thread: { processedAt: number | null } | null;
    };
    if (parsed.thread && parsed.thread.processedAt !== null) return parsed;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error(`harvest for ${threadId} did not settle`);
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
});
