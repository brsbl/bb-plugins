import { createFakePluginHost, makeQueueEntry } from "@get-bb/plugin-sdk/testing";
import { afterEach, describe, expect, it } from "vitest";
import plugin, { createStore } from "./server.js";
import { actionMessage, type Item } from "./model.js";

const ref = { threadId: "thr_test", id: "esc-1" };
const reply = { type: "reply", summary: "Billing follow-up", subject: "Missing refund", to: ["billing@example.com"], original: { from: "Billing", body: "Your refund is on the way." }, draft: "Original draft" };
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
  // Replies are sent one reviewed draft at a time, never in bulk.
  store.create(ref.threadId, "reply", reply);
  store.createTable(ref.threadId, "with-reply", { title: "Newsletters and a reply", ids: ["a", "reply"] });
  expect(() => store.prepareTable({ ...args, id: "with-reply", items: [{ id: "reply", revision: 1 }] })).toThrow("do not share");
  expect(store.get(ref.threadId, "reply").state).toBe("ready");
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
  expect(text.stdout).toContain("Billing follow-up");
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
  expect(send).toMatchObject({ threadId: "thr_other", mode: "queue-if-active", input: [{ text: "Send Billing follow-up", mentions: [{
    start: 5, end: 22, resource: { kind: "plugin", pluginId: "inline-action-cards", itemId: `action:thr_other:${ref.id}:${pending.attempt!.id}` },
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
  it("validates options and accepts choice cards in tables", () => {
    const { store } = setup();
    expect(() => store.create(ref.threadId, "c", { ...choice, options: choice.options.slice(0, 1) })).toThrow();
    expect(() => store.create(ref.threadId, "c", { ...choice, options: [...choice.options, ...choice.options.slice(0, 4)].map((option, index) => ({ ...option, id: `o${index}` })) })).toThrow();
    expect(() => store.create(ref.threadId, "c", { ...choice, options: [choice.options[0], choice.options[0]] })).toThrow("own id");
    expect(() => store.create(ref.threadId, "c", { ...choice, recommended: "missing" })).toThrow("Recommend");
    expect(() => store.create(ref.threadId, "c", { ...choice, options: [{ id: "a", label: "Two\nlines" }, { id: "b", label: "B" }] })).toThrow();
    store.create(ref.threadId, "c", choice);
    expect(store.createTable(ref.threadId, "t", { title: "Choices", ids: ["c"] })).toMatchObject({ ids: ["c"] });
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

describe("decision sheets", () => {
  it("accepts optional context and images, and rejects relative or insecure image sources", () => {
    const { store } = setup();
    const decide = { type: "decide", question: "Merge #412?", consequence: "Squash-merge it.", recommended: "yes", context: "## Diff\n- `TTL` 30d → 7d", media: [{ src: "/tmp/shot.png", alt: "Screenshot" }, { src: "https://example.com/a.png", alt: "Chart", caption: "p95" }] };
    expect(store.create(ref.threadId, "d", decide).content).toMatchObject({ context: decide.context, media: decide.media, recommended: "yes" });
    expect(store.create(ref.threadId, "plain", { type: "decide", question: "Archive?", consequence: "Archive it." }).content).not.toHaveProperty("context");
    for (const src of ["shot.png", "http://example.com/a.png", "javascript:alert(1)", "/Users/me/.ssh/id_ed25519", "/etc/passwd"]) expect(() => store.create(ref.threadId, "bad", { ...decide, media: [{ src, alt: "x" }] })).toThrow();
    expect(() => store.create(ref.threadId, "bad", { ...decide, media: Array.from({ length: 5 }, () => decide.media[0]) })).toThrow();
    expect(() => store.create(ref.threadId, "bad", { ...decide, recommended: "maybe" })).toThrow();
  });
  it("prepares a batch of mixed rows atomically, one attempt and note per row", () => {
    const { store } = setup();
    store.create(ref.threadId, "c", choice);
    store.create(ref.threadId, "d", { type: "decide", question: "Archive?", consequence: "Archive it.", yesLabel: "Archive" });
    store.create(ref.threadId, "r", reply);
    store.create(ref.threadId, "outside", { type: "decide", question: "Other?", consequence: "Other." });
    store.createTable(ref.threadId, "t", { title: "Triage", ids: ["c", "d", "r"] });
    const batch = (items: unknown[]) => store.prepareBatch({ threadId: ref.threadId, id: "t", items } as never);
    expect(() => batch([{ id: "outside", revision: 1, action: "yes" }])).toThrow("does not belong");
    expect(() => batch([{ id: "c", revision: 1, action: "choose" }])).toThrow("Pick an option");
    expect(() => batch([{ id: "d", revision: 1, action: "yes" }, { id: "c", revision: 1, action: "choose", choice: "missing" }])).toThrow();
    expect(store.get(ref.threadId, "d").state).toBe("ready");
    expect(() => batch([{ id: "d", revision: 2, action: "yes" }])).toThrow("changed");
    const items = batch([
      { id: "c", revision: 1, action: "choose", choice: "pool", note: "  only for now " },
      { id: "d", revision: 1, action: "no" },
      { id: "r", revision: 1, action: "send", note: "" },
    ]);
    expect(items.map((item) => [item.id, item.state, item.attempt?.action, item.attempt?.note])).toEqual([["c", "pending", "choose", "only for now"], ["d", "pending", "no", undefined], ["r", "pending", "send", undefined]]);
    expect(items[0]!.attempt!.choice).toEqual({ id: "pool", label: "Pool" });
    expect(actionMessage(items[0]!)).toBe("Use Pool ");
    expect(new Set(items.map((item) => item.attempt!.id)).size).toBe(3);
    expect(() => batch([{ id: "d", revision: items[1]!.revision, action: "yes" }])).toThrow("in progress");
  });
  it("answers a follow-up on its card and returns follow-ups with the card", async () => {
    const host = createFakePluginHost({ pluginId: "inline-action-cards" }); hosts.push(host); plugin(host.bb);
    await host.harness.behavior.runCli(["create", "d", "--thread", ref.threadId, "--item", JSON.stringify({ type: "decide", question: "Rotate the key?", consequence: "Rotate it." })]);
    const { commentId } = await host.harness.behavior.callRpc("comment", { threadId: ref.threadId, id: "d", revision: 1, note: "Which CI secrets use it?" }) as { commentId: string };
    const context = JSON.parse((await host.harness.registrations.mentionProviders[0]!.resolve(`${ref.threadId}:d:comment_${commentId}`)).context);
    expect(context).toMatchObject({ intent: "comment", commentId });
    expect(context.instruction).toContain("bb action-cards answer");
    expect(await host.harness.behavior.callRpc("get", { threadId: ref.threadId, id: "d" })).toMatchObject({ followUps: [{ commentId, note: "Which CI secrets use it?", answer: null }] });
    const answered = await host.harness.behavior.runCli(["answer", "d", "--thread", ref.threadId, "--comment", commentId, "--message", "Three: **deploy**, **e2e**, and **nightly**."]);
    expect(JSON.parse(answered.stdout!)).toMatchObject({ revision: 1, state: "ready", followUps: [{ commentId, answer: "Three: **deploy**, **e2e**, and **nightly**." }] });
    const missing = await host.harness.behavior.runCli(["answer", "d", "--thread", ref.threadId, "--comment", "ea45f71a-c216-4da4-a226-65736f4eccfd", "--message", "No such follow-up"]).then((result) => result.exitCode, () => 1);
    expect(missing).not.toBe(0);
    const table = await host.harness.behavior.callRpc("table", { threadId: ref.threadId, id: "missing" }).catch((error: unknown) => error);
    expect(table).toBeInstanceOf(Error);
  });
});
