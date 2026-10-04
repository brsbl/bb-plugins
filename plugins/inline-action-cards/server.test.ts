import { createFakePluginHost } from "@get-bb/plugin-sdk/testing";
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

it("lists every card once, groups pending with ready, and sorts decided newest first", async () => {
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
  const log = await store.log();
  expect(log.waiting.map((item) => item.state).sort()).toEqual(["pending", "ready"]);
  expect(log.waiting.find((item) => item.id === "pending")?.attempt?.id).toBe(pending.attempt!.id);
  expect(log.decided.map((item) => item.updatedAt)).toEqual(log.decided.map((item) => item.updatedAt).sort().reverse());
  expect(log.decided.map((item) => item.state).sort()).toEqual(["failed", "succeeded"]);
  const scoped = await store.log("thr_one");
  expect(scoped.waiting).toHaveLength(2);
  expect(scoped.decided).toEqual([]);
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
  expect(text.stdout).toContain("Decided\n");
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
