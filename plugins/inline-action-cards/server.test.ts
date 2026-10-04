import { createFakePluginHost } from "@get-bb/plugin-sdk/testing";
import { afterEach, describe, expect, it } from "vitest";
import plugin, { createStore } from "./server.js";
import { actionMessage } from "./model.js";

const ref = { threadId: "thr_test", id: "esc-1" };
const reply = { type: "reply", summary: "Escrow follow-up", subject: "Missing refund", to: ["escrow@example.com"], original: { from: "Escrow", body: "Your refund is on the way." }, draft: "Original draft" };
const hosts: ReturnType<typeof createFakePluginHost>[] = [];
function setup() { const host = createFakePluginHost({ pluginId: "inline-action-cards" }); hosts.push(host); return { ...host, store: createStore(host.bb) }; }
afterEach(async () => { for (const host of hosts.splice(0)) await host.harness.lifecycle.dispose(); });

it("contributes decision guidance to every thread without loading the skill", () => {
  const host = createFakePluginHost({ pluginId: "inline-action-cards" }); hosts.push(host); plugin(host.bb);
  const provider = host.harness.registrations.instructionProvider;
  expect(provider).toBeTypeOf("function");
  const instructions = provider!({ threadId: "thr_fresh", projectId: "proj_fresh" });
  expect(instructions).toBeTruthy();
  expect(instructions!.length).toBeLessThan(800);
  for (const text of ["decision or approval", "sending an email", "merging/shipping", "switching a setting", "applying a change", "two options", "instead of asking in prose", "bb action-cards create", '::action{id="..."}', "own line", "what Yes does", "No declines", "3+ similar items", "bb action-cards create-table", '::actions{id="..."}', "bb action-cards claim", "bb action-cards report", "inline-action-cards skill"]) {
    expect(instructions).toContain(text);
  }
  expect(provider!({ threadId: "thr_other", projectId: "proj_other" })).toBe(instructions);
});

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
