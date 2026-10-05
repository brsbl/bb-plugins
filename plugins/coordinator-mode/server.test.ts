import type { BbPluginApi, PluginThreadEventPayloads } from "@get-bb/plugin-sdk";
import { createFakePluginHost, makePluginAgentConfigurationContext, makeThreadResponse } from "@get-bb/plugin-sdk/testing";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { CoordinatorStatus, CoordinatorTemplate } from "./contracts";
import plugin from "./server";
import { BUILT_IN_TEMPLATES } from "./templates";

type Thread = PluginThreadEventPayloads["thread.idle"]["thread"];
type Interaction = PluginThreadEventPayloads["interaction.pending"]["interaction"];
type ExecutionOptions = Awaited<ReturnType<BbPluginApi["sdk"]["threads"]["defaultExecutionOptions"]>>;

const COORD = "thr_coord";
const ship = BUILT_IN_TEMPLATES.find((template) => template.id === "ship")!;

const cleanups: Array<() => Promise<void>> = [];
afterEach(async () => {
  for (const cleanup of cleanups.splice(0)) await cleanup();
  vi.useRealTimers();
});

type RpcCall = { pluginId: string; method: string; input: Record<string, unknown> };

/**
 * Fakes for other plugins' RPC. `actionCards` installs a minimal Action Cards that keeps owned cards
 * by ref; `briefs` installs Briefs' publishFromPlugin. Anything else fails like an uninstalled plugin.
 */
function setup(options: { children?: Thread[]; actionCards?: boolean; briefs?: boolean } = {}) {
  vi.useFakeTimers({ toFake: ["Date"] });
  let clock = 1_000_000;
  const tick = () => vi.setSystemTime((clock += 1_000));
  const advance = (ms: number) => vi.setSystemTime((clock += ms));
  tick();

  const rpcCalls: RpcCall[] = [];
  const ownedCards = new Map<string, { id: string; threadId: string; state: "ready" | "resolved"; outcome?: unknown; message?: unknown }>();
  const pluginRpc = (pluginId: string, method: string, input: Record<string, unknown>): unknown => {
    rpcCalls.push({ pluginId, method, input });
    if (pluginId === "inline-action-cards" && options.actionCards) {
      if (method === "createOwned") {
        const owner = input.owner as { ref: string };
        const card = { id: String(input.id), threadId: String(input.threadId), state: "ready" as const };
        ownedCards.set(owner.ref, card);
        return { item: card, directive: `::action{id="${card.id}" thread="${card.threadId}"}` };
      }
      if (method === "resolveOwned") {
        const card = ownedCards.get(String(input.ref));
        if (!card) return null;
        const resolved = { ...card, state: "resolved" as const, outcome: input.outcome, message: input.message };
        ownedCards.set(String(input.ref), resolved);
        return { item: resolved };
      }
    }
    if (pluginId === "digests" && options.briefs && method === "publishFromPlugin") return { threadId: "thr_brief" };
    throw new Error(`plugin "${pluginId}" has no rpc method "${method}"`);
  };
  const callRpc = async (args: { pluginId: string; method: string; input?: unknown; outputSchema: { parse(value: unknown): unknown } }) =>
    args.outputSchema.parse(pluginRpc(args.pluginId, args.method, (args.input ?? {}) as Record<string, unknown>));

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
        defaultExecutionOptions: async ({ threadId }) =>
          threadId === COORD
            ? ({ model: "claude-sonnet", permissionMode: "full", reasoningLevel: "medium", serviceTier: "default", source: "client/thread/start" } as ExecutionOptions)
            : null,
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
      plugins: { callRpc: callRpc as never },
    },
  });
  cleanups.push(() => harness.lifecycle.dispose());
  plugin(bb);

  const status = async () => (await harness.callRpc("status", { threadId: COORD })) as CoordinatorStatus;
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
    pullRequest = {
      outcome: "available",
      pullRequest: { number: 12, url: "https://github.com/o/r/pull/12", state, checks: { state: checks, failedCount: 0, passedCount: 1, pendingCount: 0, totalCount: 1 } },
    };
  };
  const commandInteraction = (threadId: string, command: string, id: string) => ({
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
  const callsTo = (method: string) => rpcCalls.filter((call) => call.method === method);
  /** Waits for calls to another plugin, then lets the awaiting code record their results. */
  const waitForCalls = async (method: string, count: number) => {
    await vi.waitFor(() => expect(callsTo(method)).toHaveLength(count));
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
  };
  /** Drives an added item to Your QA: its PR opens and its sub-thread goes idle. */
  const reachQa = async () => {
    const { item } = await addStartedItem();
    setPullRequest("open");
    await event("thread.idle", "thr_sub_1");
    expect((await status()).items[0]?.stageIndex).toBe(2);
    return item;
  };
  /** Runs exactly one evidence-poll pass. */
  const runTick = async () => {
    const before = harness.inspection.sdk.callsTo("threads.get").length;
    const run = harness.runService("evidence-poll");
    await vi.waitFor(() => expect(harness.inspection.sdk.callsTo("threads.get").length).toBeGreaterThan(before));
    run.controller.abort();
    await run.done;
  };

  return {
    harness, status, thread, threads, missing, pendingInteractions, event, turnOn, addStartedItem, setPullRequest,
    requestCommand, resolutionsFor, runTick, advance, callsTo, waitForCalls, ownedCards, reachQa,
  };
}

describe("Coordinator Mode plugin", () => {
  it("turns on a coordinator, tracks existing sub-threads as items, and restarts with the kickoff", async () => {
    const child = makeThreadResponse({ id: "thr_old", projectId: "proj", parentThreadId: COORD, title: "Old work" });
    const { harness, status, turnOn } = setup({ children: [child] });
    await turnOn();

    const current = await status();
    expect(current.state).toMatchObject({ threadId: COORD, paused: false, autoApprove: true, lastBriefedAt: null });
    expect(current.state?.template.id).toBe("ship");
    expect(current.staleRules).toBe(false);
    // Tracked at once, no confirmation: it moved past Asked to Building.
    expect(current.items).toEqual([expect.objectContaining({ title: "Old work", proposed: false, primaryThreadId: "thr_old", stageIndex: 1 })]);

    const send = harness.inspection.sdk.callsTo("threads.send").at(-1)?.[0];
    expect(send).toMatchObject({ threadId: COORD, mode: "queue-if-active" });
    // Turning on must not change the thread's own permission mode.
    expect(send).not.toHaveProperty("permissionMode");
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

  it("starts sub-threads on the coordinator's provider, model, and permission mode", async () => {
    const { harness, threads, turnOn, addStartedItem } = setup();
    threads.set(COORD, makeThreadResponse({ id: COORD, projectId: "proj", status: "idle", providerId: "claude-code" }));
    await turnOn();
    await addStartedItem();
    expect(harness.inspection.sdk.callsTo("threads.spawn").at(-1)?.[0]).toMatchObject({
      providerId: "claude-code", model: "claude-sonnet", reasoningLevel: "medium", permissionMode: "full",
    });
  });

  it("auto-approves ordinary commands for members and ignores other threads", async () => {
    const { turnOn, addStartedItem, requestCommand, resolutionsFor } = setup();
    await turnOn();
    await addStartedItem();
    await requestCommand("thr_sub_1", "npm test", "int_ok");
    expect(resolutionsFor("int_ok").at(-1)?.[0]).toMatchObject({ resolution: { decision: "allow_once", grantedPermissions: null } });

    await requestCommand("thr_other", "npm test", "int_other");
    expect(resolutionsFor("int_other")).toHaveLength(0);
  });

  it("advances through QA and Review only on evidence, and only a reviewer sub-thread's verdict moves Review", async () => {
    const { harness, status, event, turnOn, addStartedItem, setPullRequest } = setup();
    await turnOn();
    const { item } = await addStartedItem();

    setPullRequest("open");
    await event("thread.idle", "thr_sub_1");
    expect((await status()).items[0]?.stageIndex).toBe(2); // Your QA

    await harness.callRpc("approveItem", { itemId: item.id });
    expect((await status()).items[0]?.stageIndex).toBe(3); // Review

    // Neither the coordinator nor a helper sub-thread can record a verdict.
    await expect(harness.callAgentTool("coordinator_review_verdict", { pass: true }, { threadId: COORD })).rejects.toThrow(/review sub-thread/);
    await harness.callAgentTool("coordinator_start_sub_thread", { itemId: item.id, prompt: "Fix nits", role: "helper" }, { threadId: COORD });
    const helperConfig = await harness.resolveAgentConfiguration(makePluginAgentConfigurationContext({ thread: { id: "thr_sub_2" } }));
    expect(helperConfig.tools).toEqual([]);
    await expect(harness.callAgentTool("coordinator_review_verdict", { pass: true }, { threadId: "thr_sub_2" })).rejects.toThrow(/review sub-thread/);
    expect((await status()).items[0]?.stageIndex).toBe(3);

    await harness.callAgentTool("coordinator_start_sub_thread", { itemId: item.id, prompt: "Review it", role: "reviewer" }, { threadId: COORD });
    expect(harness.inspection.sdk.callsTo("threads.spawn").at(-1)?.[0]).toMatchObject({ parentThreadId: COORD, environment: { type: "reuse", environmentId: "env_1" } });
    const reviewerConfig = await harness.resolveAgentConfiguration(makePluginAgentConfigurationContext({ thread: { id: "thr_sub_3" } }));
    expect(reviewerConfig.tools.map((tool) => tool.name)).toEqual(["coordinator_review_verdict"]);

    await harness.callAgentTool("coordinator_review_verdict", { pass: true }, { threadId: "thr_sub_3" });
    // Merged, waiting on the PR.
    expect((await status()).items[0]).toMatchObject({ stageIndex: 4, status: "active", helperThreadIds: ["thr_sub_2", "thr_sub_3"] });

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

  it("applies the rules to adopted sub-threads but never auto-approves them, until they stop being tracked", async () => {
    const child = makeThreadResponse({ id: "thr_old", projectId: "proj", parentThreadId: COORD, title: "Old work" });
    const { harness, status, turnOn, requestCommand, resolutionsFor } = setup({ children: [child] });
    await turnOn();
    const [adopted] = (await status()).items;

    // Ordinary commands wait for the user, even with auto-approve on.
    await requestCommand("thr_old", "npm test", "int_adopted");
    expect(resolutionsFor("int_adopted")).toHaveLength(0);
    // Never rules still deny: Ship never merges before Review passes.
    await requestCommand("thr_old", "gh pr merge 3", "int_merge");
    expect(resolutionsFor("int_merge").at(-1)?.[0]).toMatchObject({ resolution: { decision: "deny" } });
    // Ask rules still ask: archiving may target a primary sub-thread.
    await requestCommand("thr_old", "bb thread archive thr_x", "int_archive");
    expect(resolutionsFor("int_archive")).toHaveLength(0);
    expect((await status()).approvals).toEqual([expect.objectContaining({ action: "archive_sub_thread", itemId: adopted!.id })]);

    const config = await harness.resolveAgentConfiguration(makePluginAgentConfigurationContext({ thread: { id: "thr_old" } }));
    expect(config.instructions).toContain("Don't send progress updates");

    // confirmItem is a no-op kept for older callers; it does not make the thread auto-approved.
    await expect(harness.callRpc("confirmItem", { itemId: adopted!.id })).resolves.toEqual({ ok: true });
    await requestCommand("thr_old", "npm test", "int_confirmed");
    expect(resolutionsFor("int_confirmed")).toHaveLength(0);

    await harness.callRpc("cutItem", { itemId: adopted!.id });
    expect((await status()).items[0]?.status).toBe("cut");
    const after = await harness.resolveAgentConfiguration(makePluginAgentConfigurationContext({ thread: { id: "thr_old" } }));
    expect(after.instructions ?? "").not.toContain("Don't send progress updates");
  });

  it("tells every tracked sub-thread to report once, briefly, and keeps coordinator instructions within the cap", async () => {
    const { harness, turnOn, addStartedItem } = setup();
    await turnOn();
    const { item } = await addStartedItem();
    await harness.callAgentTool("coordinator_start_sub_thread", { itemId: item.id, prompt: "Review it", role: "reviewer" }, { threadId: COORD });

    const primary = await harness.resolveAgentConfiguration(makePluginAgentConfigurationContext({ thread: { id: "thr_sub_1" } }));
    expect(primary.instructions).toContain("Don't send progress updates");
    expect(primary.instructions).toContain("3 lines or fewer");
    expect(primary.instructions).toContain("don't message the coordinator with bb thread tell");
    const reviewer = await harness.resolveAgentConfiguration(makePluginAgentConfigurationContext({ thread: { id: "thr_sub_2" } }));
    expect(reviewer.instructions).toContain("3 lines or fewer");
    expect(reviewer.instructions).toContain("coordinator_review_verdict");

    const coordinator = await harness.resolveAgentConfiguration(makePluginAgentConfigurationContext({ thread: { id: COORD } }));
    expect(coordinator.instructions?.length).toBeLessThanOrEqual(4096);
    expect(coordinator.instructions).toContain("Never ask for approval in prose");
    expect(coordinator.instructions).toContain("Report only when done or blocked");
  });

  it("denies `gh pr merge` from a sub-thread before Review passes, then unblocks the item when its stage passes", async () => {
    const { status, event, turnOn, addStartedItem, setPullRequest, requestCommand, resolutionsFor } = setup();
    await turnOn();
    await addStartedItem();
    await requestCommand("thr_sub_1", "gh pr merge 12 --squash", "int_merge");
    expect(resolutionsFor("int_merge").at(-1)?.[0]).toMatchObject({ threadId: "thr_sub_1", resolution: { decision: "deny" } });
    const blocked = (await status()).items[0];
    expect(blocked).toMatchObject({ stageIndex: 1, status: "blocked" });
    expect(blocked?.reason).toContain("gh pr merge");

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

  it("raises a QA card on entering Your QA, embeds it in the briefing, and resolves it when approved in the panel", async () => {
    const { harness, status, turnOn, reachQa, callsTo, waitForCalls, ownedCards } = setup({ actionCards: true });
    await turnOn();
    const item = await reachQa();
    const ref = `qa:${item.id}:2`;

    await waitForCalls("createOwned", 1);
    const [created] = callsTo("createOwned");
    expect(created?.input).toMatchObject({
      threadId: COORD,
      owner: { pluginId: "coordinator-mode", ref },
      content: { type: "decide", question: "Approve QA for “Solid strip”?", yesLabel: "Approve", noLabel: "Reject" },
      reopen: true,
    });
    expect(String(created?.input.id)).toMatch(/^cm-qa-[0-9a-f]{16}$/u);
    expect(String((created?.input.content as { consequence: string }).consequence)).toContain("Approving moves it to Review.");

    const briefing = String(await harness.callAgentTool("coordinator_briefing", {}, { threadId: COORD }));
    expect(briefing.split("\n")).toContain(`::action{id="${String(created?.input.id)}" thread="${COORD}"}`);
    expect(briefing).not.toContain("Waiting for your approval");
    expect((await status()).state?.lastBriefedAt).not.toBeNull();

    await harness.callRpc("approveItem", { itemId: item.id });
    expect((await status()).items[0]?.stageIndex).toBe(3);
    await vi.waitFor(() => expect(callsTo("resolveOwned")).toHaveLength(1));
    expect(callsTo("resolveOwned")[0]?.input).toMatchObject({ pluginId: "coordinator-mode", ref, outcome: "approved" });
    expect(ownedCards.get(ref)?.state).toBe("resolved");
  });

  it("applies decisions from the card through actionCards.decide and refuses stale ones", async () => {
    const { harness, status, event, turnOn, reachQa, callsTo, waitForCalls } = setup({ actionCards: true });
    await turnOn();
    const item = await reachQa();
    const ref = `qa:${item.id}:2`;
    await waitForCalls("createOwned", 1);

    const rejected = await harness.callRpc("actionCards.decide", { ref, action: "no", note: "Icon is blurry" });
    expect(rejected).toEqual({ message: "Rejected. “Solid strip” goes back to Building." });
    expect((await status()).items[0]).toMatchObject({ stageIndex: 1, reason: "Icon is blurry" });
    await expect(harness.callRpc("actionCards.decide", { ref, action: "yes" })).rejects.toThrow(/no longer waiting/u);

    // Fresh work brings it back to Your QA, and the same ref's card is raised again.
    await event("thread.active", "thr_sub_1");
    await event("thread.idle", "thr_sub_1");
    expect((await status()).items[0]?.stageIndex).toBe(2);
    await waitForCalls("createOwned", 2);
    expect(callsTo("createOwned")[1]?.input).toMatchObject({ owner: { ref }, reopen: true });

    const approved = await harness.callRpc("actionCards.decide", { ref, action: "yes" });
    expect(approved).toEqual({ message: "Approved. “Solid strip” moves to Review." });
    expect((await status()).items[0]?.stageIndex).toBe(3);
    // Action Cards records card clicks itself, so Coordinator Mode never resolves those cards a second time.
    await Promise.resolve();
    expect(callsTo("resolveOwned")).toEqual([]);
    await expect(harness.callRpc("actionCards.decide", { ref: "nonsense", action: "yes" })).rejects.toThrow(/doesn't know/u);
  });

  it("raises a card for an ask-first request and closes it when the request is answered in the sub-thread", async () => {
    const { status, turnOn, requestCommand, pendingInteractions, callsTo, waitForCalls } = setup({ actionCards: true });
    const askToStart: CoordinatorTemplate = { ...ship, rules: [{ kind: "gated", action: "start_sub_thread", column: "ask" }] };
    await turnOn(askToStart);
    await requestCommand(COORD, "bb thread spawn --prompt x", "int_ask");
    const [approval] = (await status()).approvals;
    expect(approval?.reason).toBe("Asks you first: Start a sub-thread.");

    await waitForCalls("createOwned", 1);
    expect(callsTo("createOwned")[0]?.input).toMatchObject({
      owner: { ref: `approval:${approval!.id}` },
      content: { type: "decide", consequence: "Asks you first: Start a sub-thread.", yesLabel: "Approve", noLabel: "Decline" },
    });
    expect(String((callsTo("createOwned")[0]?.input.content as { question: string }).question)).toMatch(/^Approve: Run `bb thread spawn --prompt x`/u);
    expect(String(callsTo("createOwned")[0]?.input.id)).toMatch(/^cm-ap-[0-9a-f]{16}$/u);

    pendingInteractions.splice(0); // the user answered it in the thread
    expect((await status()).approvals).toEqual([]);
    await vi.waitFor(() => expect(callsTo("resolveOwned")).toHaveLength(1));
    expect(callsTo("resolveOwned")[0]?.input).toMatchObject({ ref: `approval:${approval!.id}`, outcome: "closed", message: "Answered in the sub-thread." });
  });

  it("runs an approval decided on its card, then refuses the same card again", async () => {
    const { harness, status, turnOn, addStartedItem, callsTo, waitForCalls } = setup({ actionCards: true });
    const askToMerge: CoordinatorTemplate = {
      ...ship,
      rules: [...ship.rules.filter((rule) => !(rule.kind === "gated" && rule.action === "merge_pr")), { kind: "gated", action: "merge_pr", column: "ask" }],
    };
    await turnOn(askToMerge);
    const { item } = await addStartedItem();
    await harness.callAgentTool("coordinator_merge_pr", { itemId: item.id }, { threadId: COORD });
    const [approval] = (await status()).approvals;
    const ref = `approval:${approval!.id}`;
    await waitForCalls("createOwned", 1);

    const result = await harness.callRpc("actionCards.decide", { ref, action: "yes" }) as { message: string };
    expect(result.message).toMatch(/^Approved\. Merged the PR for "Solid strip"/u);
    expect(harness.inspection.sdk.callsTo("environments.mergePullRequest")).toHaveLength(1);
    await expect(harness.callRpc("actionCards.decide", { ref, action: "yes" })).rejects.toThrow(/already answered/u);
  });

  it("closes open cards when Coordinator Mode turns off", async () => {
    const { harness, turnOn, reachQa, callsTo, waitForCalls } = setup({ actionCards: true });
    await turnOn();
    const item = await reachQa();
    await waitForCalls("createOwned", 1);
    await harness.callRpc("turnOff", { threadId: COORD });
    await vi.waitFor(() => expect(callsTo("resolveOwned")).toHaveLength(1));
    expect(callsTo("resolveOwned")[0]?.input).toMatchObject({ ref: `qa:${item.id}:2`, outcome: "closed", message: "Coordinator Mode was turned off." });
  });

  it("falls back to panel decisions and a text briefing when Action Cards isn't installed", async () => {
    const { harness, status, turnOn, reachQa, callsTo } = setup();
    await turnOn();
    const item = await reachQa();
    await vi.waitFor(() => expect(callsTo("createOwned").length).toBeGreaterThan(0));

    const briefing = String(await harness.callAgentTool("coordinator_briefing", {}, { threadId: COORD }));
    expect(briefing).toContain("Waiting for your approval at Your QA");
    expect(briefing).not.toContain("::action");

    await harness.callRpc("approveItem", { itemId: item.id });
    expect((await status()).items[0]?.stageIndex).toBe(3);
    const warnings = harness.inspection.logEntries.filter((entry) => entry.message.includes("Action Cards"));
    expect(warnings).toHaveLength(1);
  });

  it("keeps item summaries and waiting-on current through coordinator_update_item", async () => {
    const { harness, status, turnOn } = setup();
    await turnOn();
    await harness.callAgentTool("coordinator_add_item", { title: "Moss editor", summary: "Embed the Moss editor in bb." }, { threadId: COORD });
    const [item] = (await status()).items;
    expect(item).toMatchObject({ summary: "Embed the Moss editor in bb.", waitingOn: null, proposed: false });

    await harness.callAgentTool("coordinator_update_item", { itemId: item!.id, waitingOn: "moss-multi" }, { threadId: COORD });
    expect((await status()).items[0]).toMatchObject({ summary: "Embed the Moss editor in bb.", waitingOn: "moss-multi" });
    await harness.callAgentTool("coordinator_update_item", { itemId: item!.id, summary: "Moss editor inside bb.", waitingOn: "" }, { threadId: COORD });
    expect((await status()).items[0]).toMatchObject({ summary: "Moss editor inside bb.", waitingOn: null });

    await expect(harness.callAgentTool("coordinator_update_item", { itemId: item!.id, summary: "x" }, { threadId: "thr_sub_9" }))
      .rejects.toThrow(/Only a thread in Coordinator Mode/u);
  });

  it("keeps the last PR evidence for the status line", async () => {
    const { status, event, turnOn, addStartedItem, setPullRequest } = setup();
    await turnOn();
    await addStartedItem();
    expect((await status()).items[0]?.pr).toBeNull();
    setPullRequest("open", "pending");
    await event("thread.active", "thr_sub_1");
    expect((await status()).items[0]?.pr).toBeNull(); // only read when a check needs it
    await event("thread.idle", "thr_sub_1");
    expect((await status()).items[0]?.pr).toEqual({ number: 12, url: "https://github.com/o/r/pull/12", state: "open", checks: "pending" });
  });

  it("publishes scheduled briefings to Briefs with the decisions' cards attached", async () => {
    const { harness, threads, turnOn, reachQa, runTick, advance, callsTo, waitForCalls } = setup({ actionCards: true, briefs: true });
    threads.set(COORD, makeThreadResponse({ id: COORD, projectId: "proj", status: "idle", title: "Moss plugins" }));
    await turnOn({ ...ship, briefingCron: "* * * * *", briefingLabel: "Every minute" });
    await reachQa();
    await waitForCalls("createOwned", 1);
    const cardId = String(callsTo("createOwned")[0]?.input.id);
    const sends = harness.inspection.sdk.callsTo("threads.send").length;

    advance(120_000);
    await runTick();
    const [published] = callsTo("publishFromPlugin");
    expect(published?.pluginId).toBe("digests");
    expect(published?.input).toMatchObject({
      source: { pluginId: "coordinator-mode", key: COORD, name: "Moss plugins coordinator" },
      headline: expect.stringMatching(/^1 needs you · \d+ changed$/u),
      lede: "Solid strip: Waiting for your approval at Your QA",
      cards: [{ threadId: COORD, id: cardId }],
    });
    // The cards travel separately, so the details don't repeat them.
    expect(String(published?.input.details)).not.toContain("::action");
    expect(harness.inspection.sdk.callsTo("threads.send")).toHaveLength(sends);
  });

  it("falls back to nudging the coordinator when Briefs isn't installed", async () => {
    const { harness, turnOn, runTick, advance, callsTo } = setup();
    await turnOn({ ...ship, briefingCron: "* * * * *", briefingLabel: "Every minute" });
    advance(120_000);
    await runTick();
    expect(callsTo("publishFromPlugin")).toHaveLength(1);
    const nudge = harness.inspection.sdk.callsTo("threads.send").at(-1)?.[0];
    expect(nudge).toMatchObject({ threadId: COORD });
    expect(JSON.stringify(nudge)).toContain("coordinator_briefing");
  });

  it("turns a coordinator on from the CLI with a built-in template", async () => {
    const { harness, status } = setup();
    const result = await harness.runCli(["on", "--thread", COORD, "--template", "content"]);
    expect(result.exitCode).toBe(0);
    expect((await status()).state?.template.id).toBe("content");
    expect((await harness.runCli(["on", "--thread", COORD, "--template", "nope"])).exitCode).not.toBe(0);
  });

  it("turns a coordinator off from the CLI", async () => {
    const { harness, status, turnOn } = setup();
    await turnOn();
    const result = await harness.runCli(["off", "--thread", COORD]);
    expect(result.exitCode).toBe(0);
    expect((await status()).state).toBeNull();
  });
});
