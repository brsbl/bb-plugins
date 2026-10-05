import type { PluginThreadEventPayloads } from "@get-bb/plugin-sdk";
import { createFakePluginHost, makePluginAgentConfigurationContext, makeThreadResponse } from "@get-bb/plugin-sdk/testing";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { CoordinatorTemplate, RpcMethods } from "./contracts";
import plugin from "./server";
import { BUILT_IN_TEMPLATES } from "./templates";

type Thread = PluginThreadEventPayloads["thread.idle"]["thread"];
type Interaction = PluginThreadEventPayloads["interaction.pending"]["interaction"];
type Status = ReturnType<RpcMethods["status"]>;

const COORD = "thr_coord";
const ship = BUILT_IN_TEMPLATES.find((template) => template.id === "ship")!;

const cleanups: Array<() => Promise<void>> = [];
afterEach(async () => {
  for (const cleanup of cleanups.splice(0)) await cleanup();
  vi.useRealTimers();
});

function setup(options: { children?: Thread[] } = {}) {
  vi.useFakeTimers({ toFake: ["Date"] });
  let clock = 1_000_000;
  const tick = () => vi.setSystemTime((clock += 1_000));
  tick();

  const threads = new Map<string, Thread>([[COORD, makeThreadResponse({ id: COORD, projectId: "proj", status: "idle" })]]);
  let spawned = 0;
  let pullRequest: unknown = { outcome: "absent" };
  /** Threads whose lookup fails as not found. */
  const missing = new Set<string>();
  /** Requests still waiting in their sub-threads, as interactions.list reports them. */
  const pendingInteractions: Interaction[] = [];
  const { bb, harness } = createFakePluginHost({
    pluginId: "coordinator-mode",
    sdk: {
      threads: {
        get: async ({ threadId }) => {
          if (missing.has(threadId)) throw new Error(`Thread ${threadId} not found`);
          return threads.get(threadId) ?? makeThreadResponse({ id: threadId, projectId: "proj" });
        },
        list: async () => options.children ?? [],
        send: async () => ({ ok: true }),
        stop: async () => ({ ok: true }),
        archive: async () => ({ ok: true }),
        spawn: async (args) => {
          spawned += 1;
          const thread = makeThreadResponse({
            id: `thr_sub_${spawned}`, projectId: "proj", environmentId: `env_${spawned}`, parentThreadId: args.parentThreadId ?? null, status: "active",
          });
          threads.set(thread.id, thread);
          return thread;
        },
        interactions: {
          resolve: async () => ({}),
          list: async ({ threadId }) => pendingInteractions.filter((entry) => entry.threadId === threadId),
        },
      },
      environments: {
        pullRequest: async () => pullRequest,
        mergePullRequest: async () => ({ ok: true, action: "pull_request_merge", method: "squash", message: "Merged." }),
      },
    },
  });
  cleanups.push(() => harness.lifecycle.dispose());
  plugin(bb);

  const status = async () => (await harness.callRpc("status", { threadId: COORD })) as Status;
  const thread = (id: string): Thread => threads.get(id) ?? makeThreadResponse({ id });
  const setThreadStatus = (id: string, status: Thread["status"]) => threads.set(id, { ...thread(id), status });
  const event = async (name: "thread.active" | "thread.idle", id: string) => {
    tick();
    setThreadStatus(id, name === "thread.active" ? "active" : "idle");
    if (name === "thread.active") await harness.emitThreadEvent("thread.active", { thread: thread(id) });
    else await harness.emitThreadEvent("thread.idle", { thread: thread(id), lastAssistantText: null });
  };
  const turnOn = async (template: CoordinatorTemplate = ship) => {
    await harness.callRpc("turnOn", { threadId: COORD, template });
  };
  /** Adds an item through the intake path, which also starts its primary sub-thread. */
  const addStartedItem = async () => {
    const result = await harness.callAgentTool("coordinator_add_item", { title: "Solid strip", startSubThread: true, prompt: "Build it" }, { threadId: COORD, projectId: "proj" });
    const item = (await status()).items.at(-1)!;
    return { result, item };
  };
  const setPullRequest = (state: "open" | "merged", checks: "passing" | "pending" = "passing") => {
    pullRequest = { outcome: "available", pullRequest: { state, checks: { state: checks, failedCount: 0, passedCount: 1, pendingCount: 0, totalCount: 1 } } };
  };
  const commandInteraction = (threadId: string, command: string, id = "int_1") => ({
    id, threadId, turnId: "turn_1", createdAt: 1, providerId: "claude-code", providerRequestId: "req", providerThreadId: "prov",
    resolution: null, resolvedAt: null, status: "pending", statusReason: null,
    payload: {
      kind: "approval", availableDecisions: ["allow_once", "deny"], reason: null,
      subject: { kind: "command", command, cwd: null, itemId: "cmd", actions: [], sessionGrant: null },
    },
  }) as unknown as Interaction;

  /** Emits a command request and keeps it listed as pending, like a real unanswered request. */
  const requestCommand = async (threadId: string, command: string, id: string) => {
    const interaction = commandInteraction(threadId, command, id);
    pendingInteractions.push(interaction);
    await harness.emitThreadEvent("interaction.pending", { thread: thread(threadId), interaction });
  };
  const resolutionsFor = (interactionId: string) =>
    harness.inspection.sdk.callsTo("threads.interactions.resolve")
      .filter(([args]) => (args as { interactionId?: string } | undefined)?.interactionId === interactionId);
  /** Runs exactly one evidence-poll pass. */
  const runTick = async () => {
    const before = harness.inspection.sdk.callsTo("threads.get").length;
    const run = harness.runService("evidence-poll");
    await vi.waitFor(() => expect(harness.inspection.sdk.callsTo("threads.get").length).toBeGreaterThan(before));
    run.controller.abort();
    await run.done;
  };

  return {
    bb, harness, status, thread, threads, missing, pendingInteractions, event, tick, turnOn, addStartedItem, setPullRequest,
    commandInteraction, requestCommand, resolutionsFor, runTick,
  };
}

describe("Coordinator Mode plugin", () => {
  it("turns on a coordinator, lists existing sub-threads as proposed items, and restarts with the kickoff", async () => {
    const child = makeThreadResponse({ id: "thr_old", projectId: "proj", parentThreadId: COORD, title: "Old work" });
    const { harness, status, turnOn } = setup({ children: [child] });
    await turnOn();

    const current = await status();
    expect(current.state).toMatchObject({ threadId: COORD, paused: false, autoApprove: true });
    expect(current.state?.template.id).toBe("ship");
    expect(current.staleRules).toBe(false);
    expect(current.items).toEqual([expect.objectContaining({ title: "Old work", proposed: true, primaryThreadId: "thr_old" })]);

    const send = harness.inspection.sdk.callsTo("threads.send").at(-1)?.[0];
    expect(send).toMatchObject({ threadId: COORD, mode: "queue-if-active", permissionMode: "accept-edits" });
    expect(JSON.stringify(send)).toContain("Coordinator Mode is on");

    const configured = await harness.resolveAgentConfiguration(makePluginAgentConfigurationContext({ thread: { id: COORD } }));
    expect(configured.tools.map((tool) => tool.name)).toContain("coordinator_briefing");
    expect(configured.tools.map((tool) => tool.name)).not.toContain("coordinator_review_verdict");
    expect(configured.instructions).toContain("Ship");
    const stranger = await harness.resolveAgentConfiguration(makePluginAgentConfigurationContext({ thread: { id: "thr_stranger" } }));
    expect(stranger.tools).toEqual([]);
  });

  it("refuses a merge through the tool before Review passes and blocks the item", async () => {
    const { harness, status, turnOn, addStartedItem } = setup();
    await turnOn();
    const { item } = await addStartedItem();
    expect(item).toMatchObject({ stageIndex: 1, primaryThreadId: "thr_sub_1", proposed: false });

    const result = await harness.callAgentTool("coordinator_merge_pr", { itemId: item.id }, { threadId: COORD });
    expect(String(result)).toMatch(/Refused/);
    expect(harness.inspection.sdk.callsTo("environments.mergePullRequest")).toHaveLength(0);
    expect((await status()).items[0]).toMatchObject({ status: "blocked" });
  });

  it("denies `gh pr merge` from a member sub-thread before Review passes", async () => {
    const { harness, status, thread, turnOn, addStartedItem, commandInteraction } = setup();
    await turnOn();
    await addStartedItem();
    await harness.emitThreadEvent("interaction.pending", { thread: thread("thr_sub_1"), interaction: commandInteraction("thr_sub_1", "gh pr merge 12 --squash") });

    expect(harness.inspection.sdk.callsTo("threads.interactions.resolve").at(-1)?.[0]).toMatchObject({
      threadId: "thr_sub_1", interactionId: "int_1", resolution: { decision: "deny" },
    });
    const item = (await status()).items[0];
    expect(item?.status).toBe("blocked");
    expect(item?.reason).toContain("gh pr merge");
  });

  it("auto-approves ordinary commands for members and ignores other threads", async () => {
    const { harness, thread, turnOn, addStartedItem, commandInteraction } = setup();
    await turnOn();
    await addStartedItem();
    await harness.emitThreadEvent("interaction.pending", { thread: thread("thr_sub_1"), interaction: commandInteraction("thr_sub_1", "npm test", "int_ok") });
    expect(harness.inspection.sdk.callsTo("threads.interactions.resolve").at(-1)?.[0]).toMatchObject({
      interactionId: "int_ok", resolution: { decision: "allow_once", grantedPermissions: null },
    });

    const before = harness.inspection.sdk.callsTo("threads.interactions.resolve").length;
    await harness.emitThreadEvent("interaction.pending", { thread: thread("thr_other"), interaction: commandInteraction("thr_other", "npm test", "int_other") });
    expect(harness.inspection.sdk.callsTo("threads.interactions.resolve")).toHaveLength(before);
  });

  it("advances through QA and Review only on evidence, and the reviewer's verdict moves Review", async () => {
    const { harness, status, event, turnOn, addStartedItem, setPullRequest } = setup();
    await turnOn();
    const { item } = await addStartedItem();

    setPullRequest("open");
    await event("thread.idle", "thr_sub_1");
    expect((await status()).items[0]?.stageIndex).toBe(2); // Your QA

    await harness.callRpc("approveItem", { itemId: item.id });
    expect((await status()).items[0]?.stageIndex).toBe(3); // Review

    await harness.callAgentTool("coordinator_start_sub_thread", { itemId: item.id, prompt: "Review it", role: "reviewer" }, { threadId: COORD });
    const spawn = harness.inspection.sdk.callsTo("threads.spawn").at(-1)?.[0];
    expect(spawn).toMatchObject({ parentThreadId: COORD, environment: { type: "reuse", environmentId: "env_1" } });

    // The coordinator cannot record a verdict for its own item.
    await expect(harness.callAgentTool("coordinator_review_verdict", { pass: true }, { threadId: COORD })).rejects.toThrow(/review sub-thread/);
    const helperConfig = await harness.resolveAgentConfiguration(makePluginAgentConfigurationContext({ thread: { id: "thr_sub_2" } }));
    expect(helperConfig.tools.map((tool) => tool.name)).toEqual(["coordinator_review_verdict"]);

    await harness.callAgentTool("coordinator_review_verdict", { pass: true }, { threadId: "thr_sub_2" });
    expect((await status()).items[0]).toMatchObject({ stageIndex: 4, status: "active" }); // Merged, waiting on the PR

    // After Review passed, Ship merges alone.
    const merged = await harness.callAgentTool("coordinator_merge_pr", { itemId: item.id }, { threadId: COORD });
    expect(String(merged)).toContain("Merged");
    expect(harness.inspection.sdk.callsTo("environments.mergePullRequest").at(-1)?.[0]).toEqual({ environmentId: "env_1", method: "squash" });
  });

  it("Reject moves the item back with the reason and waits for fresh work before passing again", async () => {
    const { harness, status, event, turnOn, addStartedItem, setPullRequest } = setup();
    await turnOn();
    const { item } = await addStartedItem();
    setPullRequest("open");
    await event("thread.idle", "thr_sub_1");
    expect((await status()).items[0]?.stageIndex).toBe(2);

    await harness.callRpc("rejectItem", { itemId: item.id, reason: "The strip is not solid" });
    expect((await status()).items[0]).toMatchObject({ stageIndex: 1, reason: "The strip is not solid", status: "active" });
    const note = harness.inspection.sdk.callsTo("threads.send").at(-1)?.[0];
    expect(note).toMatchObject({ threadId: "thr_sub_1", mode: "queue-if-active" });
    expect(JSON.stringify(note)).toContain("The strip is not solid");

    // The PR is still open, but that is stale evidence until the sub-thread works again.
    await event("thread.idle", "thr_sub_1");
    expect((await status()).items[0]?.stageIndex).toBe(1);

    await event("thread.active", "thr_sub_1");
    await event("thread.idle", "thr_sub_1");
    expect((await status()).items[0]).toMatchObject({ stageIndex: 2, reason: null });
  });

  it("asks before merging when the rule says ask, and merges once approved", async () => {
    const { harness, status, turnOn, addStartedItem } = setup();
    const askToMerge: CoordinatorTemplate = {
      ...ship,
      rules: [...ship.rules.filter((rule) => !(rule.kind === "gated" && rule.action === "merge_pr")), { kind: "gated", action: "merge_pr", column: "ask" }],
    };
    await turnOn(askToMerge);
    const { item } = await addStartedItem();

    const result = await harness.callAgentTool("coordinator_merge_pr", { itemId: item.id }, { threadId: COORD });
    expect(String(result)).toMatch(/Waiting for approval/);
    expect(harness.inspection.sdk.callsTo("environments.mergePullRequest")).toHaveLength(0);
    const [approval] = (await status()).approvals;
    expect(approval).toMatchObject({ action: "merge_pr", itemId: item.id });

    await harness.callRpc("resolveApproval", { approvalId: approval!.id, approve: true });
    expect(harness.inspection.sdk.callsTo("environments.mergePullRequest")).toHaveLength(1);
    expect((await status()).approvals).toEqual([]);
    expect(JSON.stringify(harness.inspection.sdk.callsTo("threads.send").at(-1)?.[0])).toContain("approved");
  });

  it("marks rules stale after a template edit until the coordinator restarts", async () => {
    const { harness, status, turnOn } = setup();
    await turnOn();
    await harness.callRpc("updateTemplate", { threadId: COORD, template: { ...ship, purpose: "Ship faster." } });
    expect((await status()).staleRules).toBe(true);
    await harness.callRpc("restartCoordinator", { threadId: COORD });
    expect((await status()).staleRules).toBe(false);
    await harness.callRpc("turnOff", { threadId: COORD });
    expect((await status()).state).toBeNull();
  });

  it("gives a chained command the strictest decision of its gated actions", async () => {
    const { harness, status, turnOn, addStartedItem, requestCommand, resolutionsFor } = setup();
    await turnOn();
    const { item } = await addStartedItem();
    // Spawning is alone, but merging before Review is never: the whole command is denied.
    await requestCommand("thr_sub_1", "bb thread spawn --prompt x && gh pr merge 1", "int_chain");
    expect(resolutionsFor("int_chain").at(-1)?.[0]).toMatchObject({ resolution: { decision: "deny" } });
    expect((await status()).items[0]?.status).toBe("blocked");

    const mergeAlone: CoordinatorTemplate = {
      ...ship,
      rules: [
        { kind: "gated", action: "start_sub_thread", column: "alone" },
        { kind: "gated", action: "archive_sub_thread", column: "ask", condition: { kind: "primary_only" } },
        { kind: "gated", action: "merge_pr", column: "alone" },
      ],
    };
    await harness.callRpc("updateTemplate", { threadId: COORD, template: mergeAlone });
    await harness.callAgentTool("coordinator_start_sub_thread", { itemId: item.id, prompt: "Fix it", role: "helper" }, { threadId: COORD });
    // Archiving asks (its target may be a primary), so the merge after it waits too.
    await requestCommand("thr_sub_2", "bb thread archive thr_x; gh pr merge 1", "int_helper");
    expect(resolutionsFor("int_helper")).toHaveLength(0);
    const [approval] = (await status()).approvals;
    expect(approval).toMatchObject({ action: "archive_sub_thread", itemId: item.id });
    expect(approval?.summary).toContain("merge a PR");
  });

  it("only gives confirmed, open items' sub-threads membership", async () => {
    const child = makeThreadResponse({ id: "thr_old", projectId: "proj", parentThreadId: COORD, title: "Old work" });
    const { harness, status, turnOn, requestCommand, resolutionsFor } = setup({ children: [child] });
    await turnOn();
    const [proposed] = (await status()).items;

    await requestCommand("thr_old", "npm test", "int_proposed");
    expect(resolutionsFor("int_proposed")).toHaveLength(0);

    await harness.callRpc("confirmItem", { itemId: proposed!.id });
    await requestCommand("thr_old", "npm test", "int_kept");
    expect(resolutionsFor("int_kept").at(-1)?.[0]).toMatchObject({ resolution: { decision: "allow_once" } });

    await harness.callRpc("cutItem", { itemId: proposed!.id });
    await requestCommand("thr_old", "npm test", "int_cut");
    expect(resolutionsFor("int_cut")).toHaveLength(0);
  });

  it("keeps checking a blocked item and unblocks it when its stage passes", async () => {
    const { status, event, turnOn, addStartedItem, setPullRequest, requestCommand } = setup();
    await turnOn();
    await addStartedItem();
    await requestCommand("thr_sub_1", "gh pr merge 1", "int_merge");
    expect((await status()).items[0]).toMatchObject({ stageIndex: 1, status: "blocked" });

    setPullRequest("open");
    await event("thread.active", "thr_sub_1");
    await event("thread.idle", "thr_sub_1");
    expect((await status()).items[0]).toMatchObject({ stageIndex: 2, status: "active", reason: null }); // Your QA
  });

  it("never reads the PR for items before the first PR stage", async () => {
    const { harness, status, turnOn, addStartedItem, runTick } = setup();
    const buildThenMerge: CoordinatorTemplate = {
      ...ship,
      stages: [{ name: "Asked", check: "none" }, { name: "Building", check: "thread_done" }, { name: "Merged", check: "pr_merged" }],
      rules: [{ kind: "gated", action: "start_sub_thread", column: "alone" }],
    };
    await turnOn(buildThenMerge);
    await addStartedItem();
    expect((await status()).items[0]?.stageIndex).toBe(1);

    await runTick();
    expect(harness.inspection.sdk.callsTo("environments.pullRequest")).toHaveLength(0);
  });

  it("only lets reviewer sub-threads record a verdict", async () => {
    const { harness, status, event, turnOn, addStartedItem, setPullRequest } = setup();
    await turnOn();
    const { item } = await addStartedItem();
    setPullRequest("open");
    await event("thread.idle", "thr_sub_1");
    await harness.callRpc("approveItem", { itemId: item.id });
    expect((await status()).items[0]?.stageIndex).toBe(3); // Review

    await harness.callAgentTool("coordinator_start_sub_thread", { itemId: item.id, prompt: "Fix nits", role: "helper" }, { threadId: COORD });
    const helperConfig = await harness.resolveAgentConfiguration(makePluginAgentConfigurationContext({ thread: { id: "thr_sub_2" } }));
    expect(helperConfig.tools).toEqual([]);
    expect(helperConfig.instructions ?? "").not.toContain("coordinator_review_verdict");
    await expect(harness.callAgentTool("coordinator_review_verdict", { pass: true }, { threadId: "thr_sub_2" })).rejects.toThrow(/review sub-thread/);
    expect((await status()).items[0]?.stageIndex).toBe(3);

    await harness.callAgentTool("coordinator_start_sub_thread", { itemId: item.id, prompt: "Review it", role: "reviewer" }, { threadId: COORD });
    expect(harness.inspection.sdk.callsTo("threads.spawn").at(-1)?.[0]).toMatchObject({ environment: { type: "reuse", environmentId: "env_1" } });
    await harness.callAgentTool("coordinator_review_verdict", { pass: true }, { threadId: "thr_sub_3" });
    expect((await status()).items[0]).toMatchObject({ stageIndex: 4, status: "active" });
    expect((await status()).items[0]?.helperThreadIds).toEqual(["thr_sub_2", "thr_sub_3"]);
  });

  it("clears an approval once its request was answered in the sub-thread", async () => {
    const { status, turnOn, addStartedItem, requestCommand, pendingInteractions } = setup();
    const askToStart: CoordinatorTemplate = { ...ship, rules: [{ kind: "gated", action: "start_sub_thread", column: "ask" }] };
    await turnOn(askToStart);
    await addStartedItem(); // asks; approval for the tool call
    const before = (await status()).approvals.length;
    await requestCommand(COORD, "bb thread spawn --prompt x", "int_ask");
    expect((await status()).approvals).toHaveLength(before + 1);

    pendingInteractions.splice(0); // the user answered it in the thread
    const after = await status();
    expect(after.approvals).toHaveLength(before);
    expect(after.approvals.some((approval) => approval.args.interactionId === "int_ask")).toBe(false);
  });

  it("skips archived coordinators and removes deleted ones on the poll", async () => {
    const { harness, status, thread, threads, missing, turnOn, addStartedItem, runTick } = setup();
    await turnOn();
    await addStartedItem(); // Building waits on the PR, so a live coordinator would read it

    const reads = harness.inspection.sdk.callsTo("environments.pullRequest").length;
    threads.set(COORD, { ...thread(COORD), archivedAt: 5 });
    await runTick();
    expect(harness.inspection.sdk.callsTo("environments.pullRequest")).toHaveLength(reads);
    expect((await status()).state).not.toBeNull();

    missing.add(COORD);
    await runTick();
    const current = await status();
    expect(current.state).toBeNull();
    expect(current.items).toEqual([]);
  });

  it("turns a coordinator off from the CLI", async () => {
    const { harness, status, turnOn } = setup();
    await turnOn();
    const result = await harness.runCli(["off", "--thread", COORD]);
    expect(result.exitCode).toBe(0);
    expect((await status()).state).toBeNull();
  });
});
