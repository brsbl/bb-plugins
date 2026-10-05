import { createFakePluginHost, makeQueueEntry } from "@get-bb/plugin-sdk/testing";
import { afterEach, describe, expect, it } from "vitest";
import plugin, { createStore } from "./server.js";
import { actionMessage, type Item } from "./model.js";

const ref = { threadId: "thr_test", id: "esc-1" };
const reply = { type: "reply", summary: "Escrow follow-up", subject: "Missing refund", to: ["escrow@example.com"], original: { from: "Escrow", body: "Your refund is on the way." }, draft: "Original draft" };
const hosts: ReturnType<typeof createFakePluginHost>[] = [];
function setup() { const host = createFakePluginHost({ pluginId: "inline-action-cards" }); hosts.push(host); return { ...host, store: createStore(host.bb) }; }
afterEach(async () => { for (const host of hosts.splice(0)) await host.harness.lifecycle.dispose(); });

describe("durable inline actions", () => {
  it("claims the latest saved draft once and refuses stale writes, clicks, and reports", () => {
    const { store } = setup();
    store.create(ref.threadId, ref.id, reply);
    const saved = store.save({ ...ref, revision: 1, draft: "User's exact edited draft" });
    expect(() => store.save({ ...ref, revision: 1, draft: "Stale autosave" })).toThrow("changed elsewhere");
    expect(() => store.prepare({ ...ref, revision: 1, action: "send" })).toThrow("changed elsewhere");
    const pending = store.prepare({ ...ref, revision: saved.revision, action: "send" });
    expect(actionMessage(pending)).toBe("Send ");
    expect(() => store.prepare({ ...ref, revision: pending.revision, action: "send" })).toThrow("in progress");
    const claimed = store.claim(ref.threadId, ref.id, pending.attempt!.id);
    expect(claimed.content).toMatchObject({ draft: "User's exact edited draft" });
    expect(claimed.attempt!.sentAt).toBeTruthy();
    expect(() => store.claim(ref.threadId, ref.id, pending.attempt!.id)).toThrow("already claimed");
    expect(() => store.save({ ...ref, revision: claimed.revision, draft: "Too late" })).toThrow("cannot be edited");
    expect(() => store.report(ref.threadId, ref.id, "stale", "succeeded", "Sent", false)).toThrow("current claimed");
    const done = store.report(ref.threadId, ref.id, pending.attempt!.id, "succeeded", "Sent", false);
    expect(done.state).toBe("succeeded");
    expect(() => store.reopen({ ...ref, revision: done.revision })).toThrow("Check the outcome");
  });
  it("requires verified failure before retry, isolates threads, and resumes deferred cards", () => {
    const { store } = setup();
    store.create(ref.threadId, ref.id, { type: "decide", question: "File receipts?", consequence: "Add the Receipts label." });
    expect(() => store.get("thr_other", ref.id)).toThrow("unavailable");
    expect(() => store.create(ref.threadId, ref.id, reply)).toThrow("already exists");
    expect(() => store.prepare({ ...ref, revision: 1, action: "send" })).toThrow("does not belong");
    const first = store.prepare({ ...ref, revision: 1, action: "yes" });
    store.claim(ref.threadId, ref.id, first.attempt!.id);
    const uncertain = store.report(ref.threadId, ref.id, first.attempt!.id, "failed", "Check whether the label was applied", false);
    expect(() => store.prepare({ ...ref, revision: uncertain.revision, action: "yes" })).toThrow("in progress");
    const safe = store.report(ref.threadId, ref.id, first.attempt!.id, "failed", "No label was applied. Reconnect Gmail.", true);
    const retried = store.prepare({ ...ref, revision: safe.revision, action: "yes" });
    expect(retried.attempt!.id).not.toBe(first.attempt!.id);
    expect(() => store.claim(ref.threadId, ref.id, first.attempt!.id)).toThrow("stale");
    store.create(ref.threadId, "later", reply);
    const later = store.prepare({ ...ref, id: "later", revision: 1, action: "later" });
    store.claim(ref.threadId, "later", later.attempt!.id);
    const deferred = store.report(ref.threadId, "later", later.attempt!.id, "succeeded", "Later", false);
    expect(store.reopen({ ...ref, id: "later", revision: deferred.revision }).state).toBe("ready");
  });
  it("persists through reload and exposes scoped CLI and validated RPC", async () => {
    const host = createFakePluginHost({ pluginId: "inline-action-cards" }); hosts.push(host); plugin(host.bb);
    const created = await host.harness.behavior.runCli(["create", ref.id, "--thread", ref.threadId, "--item", JSON.stringify(reply)]);
    expect(created.stdout).toBe('::action{id="esc-1"}\n');
    const reloaded = await host.harness.lifecycle.reload(plugin);
    hosts[hosts.indexOf(host)] = reloaded;
    const saved = await reloaded.harness.behavior.callRpc("save", { ...ref, revision: 1, draft: "After reload" });
    expect(saved).toMatchObject({ revision: 2, content: { draft: "After reload" } });
    await expect(reloaded.harness.behavior.callRpc("get", { ...ref, id: "../escape" })).rejects.toThrow();
  });
});

it("resolves stable approvals into hidden context and preserves legacy items", async () => {
  const host = createFakePluginHost({ pluginId: "inline-action-cards" }); hosts.push(host); plugin(host.bb);
  await host.harness.behavior.runCli(["create", ref.id, "--thread", ref.threadId, "--item", JSON.stringify(reply)]);
  const pending = await host.harness.behavior.callRpc("prepare", { ...ref, revision: 1, action: "send" }) as { attempt: { id: string } };
  const provider = host.harness.registrations.mentionProviders[0]!;
  const resolved = await provider.resolve(`${ref.threadId}:${ref.id}:${pending.attempt.id}`);
  expect(JSON.parse(resolved.context)).toMatchObject({ intent: "approved-action", itemId: ref.id, attemptId: pending.attempt.id, threadId: ref.threadId, action: "send" });
  expect(() => provider.resolve(`${ref.threadId}:${ref.id}:stale`)).toThrow("replaced");
  expect(JSON.parse((await provider.resolve(`${ref.threadId}:${ref.id}:changes`)).context).intent).toBe("request-changes");
});
it("bulk approval atomically reserves only the displayed ready rows of a matching action", () => {
  const { store } = setup();
  const content = { type: "decide", question: "Newsletter", consequence: "Archive from inbox", yesLabel: "Archive", noLabel: "Keep", actionKey: "archive-email" };
  ["a", "b", "c"].forEach((id) => store.create(ref.threadId, id, content));
  store.createTable(ref.threadId, "news", { title: "Newsletters", ids: ["a", "b", "c"] });
  const args = { threadId: ref.threadId, id: "news", items: ["a", "b", "c"].map((id) => ({ id, revision: 1 })) };
  expect(() => store.prepareTable({ ...args, items: args.items.slice(0, 2) })).toThrow("changed");
  expect(store.get(ref.threadId, "a").state).toBe("ready");
  const approved = store.prepareTable(args);
  expect(approved).toHaveLength(3);
  expect(new Set(approved.map((item) => item.attempt!.id)).size).toBe(3);
  expect(() => store.prepareTable(args)).toThrow("changed");
  store.create(ref.threadId, "other", { ...content, actionKey: "delete-email" });
  store.createTable(ref.threadId, "mixed", { title: "Different operations", ids: ["a", "other"] });
  expect(() => store.prepareTable({ ...args, id: "mixed", items: [{ id: "other", revision: 1 }] })).toThrow("do not share");
  expect(() => store.table("thr_other", "news")).toThrow("unavailable");
});

it("lists every card once, keeps pending, failed and Later cards waiting with Later last, and sorts newest first", async () => {
  const { store } = setup();
  store.create("thr_one", "same-id", reply);
  store.create("thr_two", "same-id", reply);
  store.create("thr_one", "pending", reply);
  store.create("thr_two", "failed", reply);
  const pending = store.prepare({ threadId: "thr_one", id: "pending", revision: 1, action: "send" });
  const fail = store.prepare({ threadId: "thr_two", id: "failed", revision: 1, action: "send" });
  store.claim("thr_two", "failed", fail.attempt!.id);
  store.report("thr_two", "failed", fail.attempt!.id, "failed", "Reconnect Gmail", true);
  const sent = store.prepare({ threadId: "thr_two", id: "same-id", revision: 1, action: "send" });
  store.claim("thr_two", "same-id", sent.attempt!.id);
  store.report("thr_two", "same-id", sent.attempt!.id, "succeeded", "Sent", false);
  for (const [id, action] of [["later", "later"], ["skipped", "skip"]] as const) {
    store.create("thr_one", id, reply);
    const attempt = store.prepare({ threadId: "thr_one", id, revision: 1, action });
    store.claim("thr_one", id, attempt.attempt!.id);
    store.report("thr_one", id, attempt.attempt!.id, "succeeded", action === "later" ? "Later" : "Skipped", false);
  }
  const log = await store.log();
  expect(log.waiting.at(-1)).toMatchObject({ id: "later", state: "succeeded" });
  expect(log.done.map((item) => item.id).sort()).toEqual(["same-id", "skipped"]);
  log.waiting.pop();
  expect(log.waiting.map((item) => item.state).sort()).toEqual(["failed", "pending", "ready"]);
  expect(log.waiting.find((item) => item.id === "pending")?.attempt?.id).toBe(pending.attempt!.id);
  expect(log.waiting.map((item) => item.updatedAt)).toEqual(log.waiting.map((item) => item.updatedAt).sort().reverse());
  const scoped = await store.log("thr_one");
  expect(scoped.waiting.map((item) => item.id)).toEqual(expect.arrayContaining(["same-id", "pending", "later"]));
  expect(scoped.done.map((item) => item.id)).toEqual(["skipped"]);
  expect((await store.log("thr_empty")).waiting).toEqual([]);
});

it("CLI log defaults to all threads, supports JSON and explicit thread filters", async () => {
  const host = createFakePluginHost({ pluginId: "inline-action-cards" }); hosts.push(host); plugin(host.bb);
  for (const threadId of ["thr_one", "thr_two"]) await host.harness.behavior.runCli(["create", "reply", "--thread", threadId, "--item", JSON.stringify(reply)]);
  const all = await host.harness.behavior.runCli(["log", "--json"]);
  expect(JSON.parse(all.stdout!).waiting).toHaveLength(2);
  const scoped = await host.harness.behavior.runCli(["log", "--thread", "thr_two", "--json"]);
  expect(JSON.parse(scoped.stdout!).waiting).toMatchObject([{ threadId: "thr_two" }]);
  const text = await host.harness.behavior.runCli(["log"]);
  expect(text.stdout).toContain("Waiting on you\n");
  expect(text.stdout).toContain("Escrow follow-up");
  expect(text.stdout).toContain("Done\n");
  const invalid = await host.harness.behavior.runCli(["log", "--thread", "../escape"]);
  expect(invalid.exitCode).not.toBe(0);
});

it("log choices submit to their owning thread and resend the same durable attempt", async () => {
  const host = createFakePluginHost({ pluginId: "inline-action-cards", sdk: { threads: {
    get: ({ threadId }) => ({ title: threadId === "thr_other" ? "Refund follow-up" : "Inbox review", projectId: "proj_cards" }),
    send: () => ({ kind: "queued" }),
  } } }); hosts.push(host); plugin(host.bb);
  await host.harness.behavior.runCli(["create", ref.id, "--thread", "thr_other", "--item", JSON.stringify(reply)]);
  const args = { threadId: "thr_other", id: ref.id, revision: 1, action: "send" };
  const pending = await host.harness.behavior.callRpc("decideFromLog", args) as Item;
  expect(pending.state).toBe("pending");
  expect(pending.attempt!.sentAt).toBeTruthy();
  const send = host.harness.sdk.callsTo("threads.send")[0]![0];
  expect(send).toMatchObject({ threadId: "thr_other", mode: "queue-if-active", input: [{ text: "Send Escrow follow-up", mentions: [{
    start: 5, end: 21, resource: { kind: "plugin", pluginId: "inline-action-cards", itemId: `action:thr_other:${ref.id}:${pending.attempt!.id}` },
  }] }] });
  await expect(host.harness.behavior.callRpc("decideFromLog", args)).rejects.toThrow("changed");
  const resent = await host.harness.behavior.callRpc("decideFromLog", { threadId: "thr_other", id: ref.id, revision: pending.revision }) as Item;
  expect(resent.attempt!.id).toBe(pending.attempt!.id);
  const log = await host.harness.behavior.callRpc("log", {});
  expect(log).toMatchObject({ waiting: [{ threadTitle: "Refund follow-up" }] });
});

const choice = { type: "choice", question: "Which account setup?", recommended: "multi", consequence: "Applies to new threads only.", options: [
  { id: "single", label: "UserSingle", hint: "One account for every thread" },
  { id: "multi", label: "UserMultiple", hint: "Pick an account per thread" },
  { id: "pool", label: "Pool" },
] };
describe("choice cards", () => {
  it("validates options and keeps choice cards out of tables", () => {
    const { store } = setup();
    expect(() => store.create(ref.threadId, "c", { ...choice, options: choice.options.slice(0, 1) })).toThrow();
    expect(() => store.create(ref.threadId, "c", { ...choice, options: [...choice.options, ...choice.options.slice(0, 4)].map((option, index) => ({ ...option, id: `o${index}` })) })).toThrow();
    expect(() => store.create(ref.threadId, "c", { ...choice, options: [choice.options[0], choice.options[0]] })).toThrow("own id");
    expect(() => store.create(ref.threadId, "c", { ...choice, recommended: "missing" })).toThrow("Recommend");
    expect(() => store.create(ref.threadId, "c", { ...choice, options: [{ id: "a", label: "Two\nlines" }, { id: "b", label: "B" }] })).toThrow();
    store.create(ref.threadId, "c", choice);
    expect(() => store.createTable(ref.threadId, "t", { title: "Choices", ids: ["c"] })).toThrow("stand alone");
  });
  it("claims and reports the chosen option once, and retries only the same option", () => {
    const { store } = setup();
    store.create(ref.threadId, "c", choice);
    expect(() => store.prepare({ ...ref, id: "c", revision: 1, action: "choose" })).toThrow("Pick an option");
    expect(() => store.prepare({ ...ref, id: "c", revision: 1, action: "yes" })).toThrow("does not belong");
    expect(() => store.choose({ ...ref, id: "c", revision: 1, choice: "missing" })).toThrow("does not belong");
    store.create(ref.threadId, "d", { type: "decide", question: "Archive?", consequence: "Archive it." });
    expect(() => store.choose({ ...ref, id: "d", revision: 1, choice: "multi" })).toThrow("does not belong");
    const pending = store.choose({ ...ref, id: "c", revision: 1, choice: "multi" });
    expect(pending.attempt).toMatchObject({ action: "choose", choice: { id: "multi", label: "UserMultiple" } });
    expect(actionMessage(pending)).toBe("Use UserMultiple ");
    expect(() => store.choose({ ...ref, id: "c", revision: pending.revision, choice: "single" })).toThrow("in progress");
    store.claim(ref.threadId, "c", pending.attempt!.id);
    expect(() => store.claim(ref.threadId, "c", pending.attempt!.id)).toThrow("already claimed");
    const failed = store.report(ref.threadId, "c", pending.attempt!.id, "failed", "Settings are locked. Retry.", true);
    expect(() => store.choose({ ...ref, id: "c", revision: failed.revision, choice: "single" })).toThrow("original option");
    const retried = store.choose({ ...ref, id: "c", revision: failed.revision, choice: "multi" });
    store.claim(ref.threadId, "c", retried.attempt!.id);
    const done = store.report(ref.threadId, "c", retried.attempt!.id, "succeeded", "UserMultiple chosen", false);
    expect(done).toMatchObject({ state: "succeeded", result: { message: "UserMultiple chosen" }, attempt: { choice: { id: "multi" } } });
    const later = store.prepare({ ...ref, id: "d", revision: 1, action: "later" });
    expect(later.attempt!.choice).toBeUndefined();
  });
  it("round-trips through the CLI, reload, and hidden mention context", async () => {
    const host = createFakePluginHost({ pluginId: "inline-action-cards" }); hosts.push(host); plugin(host.bb);
    const created = await host.harness.behavior.runCli(["create", "setup", "--thread", ref.threadId, "--item", JSON.stringify(choice)]);
    expect(created.stdout).toBe('::action{id="setup"}\n');
    const reloaded = await host.harness.lifecycle.reload(plugin);
    hosts[hosts.indexOf(host)] = reloaded;
    const pending = await reloaded.harness.behavior.callRpc("choose", { threadId: ref.threadId, id: "setup", revision: 1, choice: "single" }) as { attempt: { id: string } };
    const provider = reloaded.harness.registrations.mentionProviders[0]!;
    const context = JSON.parse((await provider.resolve(`${ref.threadId}:setup:${pending.attempt.id}`)).context);
    expect(context).toMatchObject({ intent: "approved-action", action: "choose", attemptId: pending.attempt.id, choice: { id: "single", label: "UserSingle" } });
    const got = await reloaded.harness.behavior.runCli(["get", "setup", "--thread", ref.threadId]);
    expect(JSON.parse(got.stdout)).toMatchObject({ content: { type: "choice", recommended: "multi" }, attempt: { choice: { id: "single" } } });
    const bad = await reloaded.harness.behavior.runCli(["create", "bad", "--thread", ref.threadId, "--item", JSON.stringify({ ...choice, options: [] })]).then((result) => result.exitCode, () => 1);
    expect(bad).not.toBe(0);
  });
});

it("settles a sent request and reopens it if its queued message is deleted", async () => {
  const host = createFakePluginHost({ pluginId: "inline-action-cards" }); hosts.push(host); plugin(host.bb);
  const { callRpc, emitThreadEvent, runCli } = host.harness.behavior;
  const decide = { type: "decide", question: "Merge PR?", consequence: "Squash into main", yesLabel: "Merge" };
  for (const id of ["now", "gone"]) await runCli(["create", id, "--thread", ref.threadId, "--item", JSON.stringify(decide)]);
  const get = async (id: string) => await callRpc("get", { threadId: ref.threadId, id }) as Item;
  const prepare = async (id: string) => (await callRpc("prepare", { threadId: ref.threadId, id, revision: 1, action: "yes" }) as Item).attempt!.id;
  const entry = (id: string, attemptId: string) => makeQueueEntry({ threadId: ref.threadId, content: [{ type: "text", text: "Merge Merge PR", mentions: [{ start: 6, end: 14, resource: { kind: "plugin", pluginId: "inline-action-cards", itemId: `action:${ref.threadId}:${id}:${attemptId}`, label: "Merge PR" } }] }] });

  const now = await prepare("now");
  const sent = await callRpc("submitted", { threadId: ref.threadId, id: "now", attemptId: now }) as Item;
  expect(sent.attempt!.sentAt).toBeTruthy();
  // A repeated acknowledgement keeps the first send time.
  expect((await callRpc("submitted", { threadId: ref.threadId, id: "now", attemptId: now }) as Item).revision).toBe(sent.revision);

  const gone = await prepare("gone");
  await callRpc("submitted", { threadId: ref.threadId, id: "gone", attemptId: gone });
  await emitThreadEvent("message.cancelled", { entry: entry("gone", gone) });
  expect(await get("gone")).toMatchObject({ state: "ready", attempt: null });

  // Stale attempts are ignored.
  expect((await emitThreadEvent("message.cancelled", { entry: entry("now", "ea45f71a-c216-4da4-a226-65736f4eccfd") })).errors).toEqual([]);
  expect((await get("now")).state).toBe("pending");
});

it("lets a choice held by its note return to ready for a new choice", () => {
  const { store } = setup();
  store.create(ref.threadId, ref.id, reply);
  const pending = store.prepare({ ...ref, revision: 1, action: "send", note: "Don't send yet" });
  store.claim(ref.threadId, ref.id, pending.attempt!.id);
  const held = store.report(ref.threadId, ref.id, pending.attempt!.id, "failed", "Held the reply; not sent yet", true);
  expect(held).toMatchObject({ state: "failed", result: { retryable: true }, attempt: { note: "Don't send yet" } });
  expect(store.reopen({ ...ref, revision: held.revision })).toMatchObject({ state: "ready", attempt: null, result: null });
});

it("validates short notes, retains retry conditions, and accepts previously persisted attempts", async () => {
  const { store, bb } = setup();
  store.create(ref.threadId, ref.id, reply);
  const pending = store.prepare({ ...ref, revision: 1, action: "send", note: "  do not send yet  " });
  expect(pending.attempt!.note).toBe("do not send yet");
  store.claim(ref.threadId, ref.id, pending.attempt!.id);
  const failed = store.report(ref.threadId, ref.id, pending.attempt!.id, "failed", "No email sent", true);
  expect(store.prepare({ ...ref, revision: failed.revision, action: "send" }).attempt!.note).toBe("do not send yet");
  const legacy = store.get(ref.threadId, ref.id);
  delete legacy.attempt!.note;
  bb.storage.database().prepare("UPDATE action_items SET value = ? WHERE thread_id = ? AND item_id = ?").run(JSON.stringify(legacy), ref.threadId, ref.id);
  expect(store.get(ref.threadId, ref.id).attempt?.note).toBeUndefined();
  store.create(ref.threadId, "bounded", reply);
  expect(() => store.prepare({ ...ref, id: "bounded", revision: 1, action: "send", note: "x".repeat(1001) })).toThrow();
  expect(store.get(ref.threadId, "bounded").state).toBe("ready");
});

describe("plugin-handled cards", () => {
  const owner = { pluginId: "coordinator-mode", ref: "qa:item-7" };
  const decide = { type: "decide", question: "Approve QA for Moss viewer?", consequence: "Moves it to Ready to merge.", yesLabel: "Approve", noLabel: "Reject" } as const;
  const sentToOwner = (host: ReturnType<typeof createFakePluginHost>) => host.harness.sdk.callsTo("plugins.callRpc").map(([args]) => {
    const { pluginId, method, input } = args as { pluginId: string; method: string; input: unknown };
    return { pluginId, method, input };
  });

  it("upserts by owner reference, keeps unchanged revisions, and refuses colliding IDs", async () => {
    const { store } = setup();
    const created = store.createOwned({ ...ref, owner, content: decide });
    expect(created.directive).toBe('::action{id="esc-1" thread="thr_test"}');
    expect(created.item).toMatchObject({ owner, state: "ready", revision: 1 });
    expect(store.createOwned({ ...ref, owner, content: decide }).item.revision).toBe(1);
    expect(store.createOwned({ ...ref, owner, content: { ...decide, question: "Approve QA again?" } }).item).toMatchObject({ revision: 2, owner, content: { question: "Approve QA again?" } });
    expect(() => store.createOwned({ ...ref, owner: { ...owner, ref: "qa:item-8" }, content: decide })).toThrow("already exists");
    expect(() => store.createOwned({ ...ref, id: "elsewhere", owner, content: decide })).toThrow("already has card esc-1");
    expect(() => store.create(ref.threadId, ref.id, reply)).toThrow("already exists");
    store.create(ref.threadId, "agent-card", reply);
    expect(store.get(ref.threadId, "agent-card").owner).toBeUndefined();
    expect(() => store.createOwned({ ...ref, id: "agent-card", owner: { ...owner, ref: "qa:item-9" }, content: decide })).toThrow("already exists");
    // A resolved card stays resolved through content updates unless its owner reopens it.
    store.resolveOwned({ ...owner, outcome: "approved", message: "Approved" });
    expect(store.createOwned({ ...ref, owner, content: { ...decide, question: "Changed" } }).item.state).toBe("succeeded");
    expect(store.createOwned({ ...ref, owner, content: { ...decide, question: "Changed" }, reopen: true }).item).toMatchObject({ state: "ready", attempt: null, result: null });

    const host = createFakePluginHost({ pluginId: "inline-action-cards" }); hosts.push(host); plugin(host.bb);
    await expect(host.harness.behavior.callRpc("createOwned", { ...ref, owner, content: reply })).rejects.toThrow();
    await expect(host.harness.behavior.callRpc("createOwned", { ...ref, owner: { pluginId: "Not a plugin", ref: "x" }, content: decide })).rejects.toThrow();
  });

  it("sends a click straight to its owner, records its answer, and retries a failure", async () => {
    let failure: Error | null = new Error("Coordinator is paused.");
    const host = createFakePluginHost({ pluginId: "inline-action-cards", sdk: { plugins: { callRpc: () => {
      if (failure) throw failure;
      return { message: "QA approved; merging next" };
    } } } }); hosts.push(host); plugin(host.bb);
    const { callRpc } = host.harness.behavior;
    await callRpc("createOwned", { ...ref, owner, content: decide });
    const failed = await callRpc("decideOwned", { ...ref, revision: 1, action: "yes", note: "after lunch" }) as Item;
    expect(failed).toMatchObject({ state: "failed", result: { message: "Coordinator is paused.", retryable: true }, attempt: { action: "yes", note: "after lunch" } });
    failure = null;
    await expect(callRpc("decideOwned", { ...ref, revision: failed.revision, action: "no" })).rejects.toThrow("Retry the original action");
    const done = await callRpc("decideOwned", { ...ref, revision: failed.revision, action: "yes" }) as Item;
    expect(done).toMatchObject({ state: "succeeded", result: { message: "QA approved; merging next", retryable: false } });
    const request = { pluginId: "coordinator-mode", method: "actionCards.decide", input: { ref: "qa:item-7", action: "yes", note: "after lunch" } };
    expect(sentToOwner(host)).toEqual([request, request]);
    await expect(callRpc("decideOwned", { ...ref, revision: done.revision, action: "yes" })).rejects.toThrow("finished");

    failure = new Error("x".repeat(600));
    await callRpc("createOwned", { ...ref, id: "long", owner: { ...owner, ref: "long" }, content: decide });
    expect((await callRpc("decideOwned", { ...ref, id: "long", revision: 1, action: "no" }) as Item).result!.message).toHaveLength(500);
    failure = null;

    const choiceContent = { type: "choice", question: "Which reviewer?", options: [{ id: "ana", label: "Ana" }, { id: "bo", label: "Bo" }] };
    await callRpc("createOwned", { ...ref, id: "pick", owner: { ...owner, ref: "reviewer" }, content: choiceContent });
    await expect(callRpc("decideOwned", { ...ref, id: "pick", revision: 1, action: "choose" })).rejects.toThrow("Pick an option");
    await callRpc("decideOwned", { ...ref, id: "pick", revision: 1, action: "choose", choice: "bo" });
    expect(sentToOwner(host).at(-1)).toEqual({ pluginId: "coordinator-mode", method: "actionCards.decide", input: { ref: "reviewer", action: "choose", choice: { id: "bo", label: "Bo" } } });

    // Skip stays local; the owner hears nothing and Resume reopens the card.
    await callRpc("createOwned", { ...ref, id: "skip", owner: { ...owner, ref: "skip" }, content: decide });
    const before = sentToOwner(host).length;
    const skipped = await callRpc("decideOwned", { ...ref, id: "skip", revision: 1, action: "skip" }) as Item;
    expect(skipped).toMatchObject({ state: "succeeded", result: { message: "Skipped" } });
    expect(sentToOwner(host)).toHaveLength(before);
    expect(await callRpc("reopen", { ...ref, id: "skip", revision: skipped.revision })).toMatchObject({ state: "ready" });

    // The Action log routes owned cards to the owner, never to the agent.
    await callRpc("createOwned", { ...ref, id: "from-log", owner: { ...owner, ref: "from-log" }, content: decide });
    expect(await callRpc("decideFromLog", { ...ref, id: "from-log", revision: 1, action: "no" })).toMatchObject({ state: "succeeded" });
    expect(sentToOwner(host).at(-1)).toMatchObject({ input: { ref: "from-log", action: "no" } });
    expect(host.harness.sdk.callsTo("threads.send")).toEqual([]);
    await expect(callRpc("decideOwned", { ...ref, id: "agent", revision: 1, action: "yes" })).rejects.toThrow("unavailable");
  });

  it("closes a card that resolved elsewhere without contacting anyone", async () => {
    const { store, harness } = setup();
    expect(store.resolveOwned({ ...owner, outcome: "closed", message: "Untracked" })).toBeNull();
    store.createOwned({ ...ref, owner, content: decide });
    const closed = store.resolveOwned({ ...owner, outcome: "approved", message: "Approved in the sub-thread" })!;
    expect(closed.item).toMatchObject({ state: "succeeded", attempt: null, result: { message: "Approved in the sub-thread", retryable: false } });
    expect(store.resolveOwned({ ...owner, outcome: "closed", message: "Again" })!.item.revision).toBe(closed.item.revision);
    store.createOwned({ ...ref, id: "later", owner: { ...owner, ref: "later" }, content: decide });
    await store.decideOwned({ ...ref, id: "later", revision: 1, action: "later" });
    expect(store.resolveOwned({ ...owner, ref: "later", outcome: "declined", message: "Rejected" })!.item).toMatchObject({ state: "succeeded", attempt: null, result: { message: "Rejected" } });
    expect((await store.log()).done.map((item) => item.id).sort()).toEqual(["esc-1", "later"]);
    expect(harness.sdk.calls).toEqual([expect.objectContaining({ path: "threads.get" })]);
  });

  it("refuses agent claims, reports, and composer actions on owned cards", async () => {
    const host = createFakePluginHost({ pluginId: "inline-action-cards" }); hosts.push(host); plugin(host.bb);
    const { callRpc, runCli } = host.harness.behavior;
    await callRpc("createOwned", { ...ref, owner, content: decide });
    const message = "This card is handled by coordinator-mode; agents don't act on it.";
    const attempt = "ea45f71a-c216-4da4-a226-65736f4eccfd";
    const claim = await runCli(["claim", ref.id, "--thread", ref.threadId, "--attempt", attempt]);
    expect(claim.exitCode).not.toBe(0);
    expect(claim.stderr).toContain(message);
    const report = await runCli(["report", ref.id, "--thread", ref.threadId, "--attempt", attempt, "--outcome", "succeeded", "--message", "Approved"]);
    expect(report.exitCode).not.toBe(0);
    expect(report.stderr).toContain(message);
    await expect(callRpc("prepare", { ...ref, revision: 1, action: "yes" })).rejects.toThrow(message);
    await expect(callRpc("comment", { ...ref, revision: 1, note: "Wait" })).rejects.toThrow(message);
    const table = await runCli(["create-table", "group", "--thread", ref.threadId, "--table", JSON.stringify({ title: "Decisions", ids: [ref.id] })]);
    expect(table.stderr).toContain(message);
    expect(await callRpc("get", ref)).toMatchObject({ state: "ready", revision: 1 });
  });

  it("offers Retry when a restart interrupts an owner call", async () => {
    const host = createFakePluginHost({ pluginId: "inline-action-cards", sdk: { plugins: { callRpc: () => new Promise(() => {}) } } }); hosts.push(host); plugin(host.bb);
    await host.harness.behavior.callRpc("createOwned", { ...ref, owner, content: decide });
    void host.harness.behavior.callRpc("decideOwned", { ...ref, revision: 1, action: "yes" });
    await expect.poll(async () => (await host.harness.behavior.callRpc("get", ref) as Item).state).toBe("pending");
    const reloaded = await host.harness.lifecycle.reload(plugin);
    hosts[hosts.indexOf(host)] = reloaded;
    expect(await reloaded.harness.behavior.callRpc("get", ref)).toMatchObject({ state: "failed", attempt: { action: "yes" }, result: { retryable: true, message: "Interrupted before coordinator-mode answered. Retry to send it again." } });
  });
});
