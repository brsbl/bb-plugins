import { createFakePluginHost, makeHostResponse, makeThreadResponse } from "@get-bb/plugin-sdk/testing";
import { afterEach, describe, expect, it, vi } from "vitest";
import plugin from "./server.js";
import { createStore } from "./store.js";
import type { PullRequestItem, ReadResult, Snapshot } from "./contract.js";

const disposers: Array<() => Promise<void>> = [];
afterEach(async () => { for (const dispose of disposers.splice(0)) await dispose(); });
function snapshot(number = 1): Snapshot {
  return { nodeId: `PR_${number}`, url: `https://github.com/acme/repo/pull/${number}`, repository: "acme/repo", number, title: `PR ${number}`, body: "Private description", author: "alice", state: "open", headSha: "abc", headBranch: "fix", baseBranch: "main", updatedAt: "2026-10-04T00:00:00Z", fetchedAt: "2026-10-04T00:00:00Z", checks: { state: "passing", passing: 1, failing: 0, pending: 0, total: 1, complete: true, items: [{ name: "CI", state: "passing", url: null }] }, review: "approved", mergeability: "mergeable", queued: false, autoMerge: false, additions: 1, deletions: 1, changedFiles: 1, originThreadIds: [], stack: { state: "none", items: [] } };
}
function setup() {
  let response: (input: { url: string; expectedAccountId?: string }, hostId: string) => Promise<ReadResult> = async (input) => ({ ok: true, accountId: "U_A", login: "alice", snapshot: snapshot(Number(input.url.split("/").at(-1))) });
  const threads = [makeThreadResponse({ id: "thr_a", environmentId: "env_a", title: "Implementation" }), makeThreadResponse({ id: "thr_b", environmentId: "env_b", title: "Review" })];
  const { bb, harness } = createFakePluginHost({ pluginId: "pull-requests", experimental_hostEntry: true, sdk: {
    threads: { get: async ({ threadId }) => { const thread = threads.find((entry) => entry.id === threadId); if (!thread) throw new Error("No thread"); return thread; }, list: async ({ offset = 0, environmentId } = {}) => offset ? [] : threads.filter((thread) => !environmentId || thread.environmentId === environmentId) },
    environments: { get: async ({ environmentId }) => ({ hostId: environmentId === "env_b" ? "host_b" : "host_a", path: "/repo" }), pullRequest: async () => ({ outcome: "available", pullRequest: { url: snapshot().url } }) },
    hosts: { list: async () => [makeHostResponse({ id: "host_a", status: "connected" }), makeHostResponse({ id: "host_b", status: "connected" })] },
  }, experimental_callHostRpc: async ({ input, hostId }) => response(input as { url: string; expectedAccountId?: string }, hostId) });
  plugin(bb); disposers.push(() => harness.lifecycle.dispose());
  const rpc = <T = unknown>(method: string, input: unknown) => harness.behavior.callRpc(method, input) as Promise<T>;
  const link = async (number = 1, threadId = "thr_a") => {
    const preview = await rpc<{ token: string }>("preview", { url: snapshot(number).url, threadId });
    return rpc<PullRequestItem>("link", { token: preview.token });
  };
  const settle = async () => { await vi.waitFor(async () => expect(await rpc("list", {})).toMatchObject({ coverage: { running: false } })); };
  return { bb, harness, rpc, link, settle, threads, setResponse: (next: typeof response) => { response = next; } };
}
describe("PR registry and host identity", () => {
  it("persists deduplicated links, suppression and preferred navigation independently of GitHub", async () => {
    const h = setup();
    const first = await h.link(); await h.link(); await h.link(1, "thr_b");
    expect((await h.rpc<PullRequestItem>("show", { id: first.id })).links).toHaveLength(2);
    await h.rpc("prefer", { id: first.id, threadId: "thr_b" });
    const { undoToken } = await h.rpc<{ undoToken: string }>("unlink", { id: first.id, threadId: "thr_b" });
    expect((await h.rpc<PullRequestItem>("show", { id: first.id })).preferredThreadId).toBeNull();
    await h.rpc("undo", { token: undoToken });
    const store = createStore(h.bb);
    store.unlink(first.id, "thr_b");
    store.link(first.id, { threadId: "thr_b", evidence: "environment", origin: false, environmentId: "env_b", createdAt: "now", actor: "discovery" });
    expect(store.get(first.id).links).toHaveLength(1);
    const reload = await h.harness.lifecycle.reload(plugin); disposers.push(() => reload.harness.lifecycle.dispose());
    expect(await reload.harness.behavior.callRpc("show", { id: first.id })).toMatchObject({ links: [{ threadId: "thr_a" }] });
  });
  it("retains transient cache, hides one denied PR, and hides all snapshots on account loss", async () => {
    const h = setup(); const one = await h.link(1), two = await h.link(2);
    h.setResponse(async () => ({ ok: false, kind: "unavailable", message: "Offline" }));
    await h.rpc("refresh", { id: one.id }); await h.settle();
    expect(await h.rpc("show", { id: one.id })).toMatchObject({ sourceState: "stale", snapshot: { title: "PR 1" } });
    h.setResponse(async () => ({ ok: false, kind: "denied", message: "Denied" }));
    await h.rpc("refresh", { id: one.id }); await h.settle();
    expect(await h.rpc("show", { id: one.id })).toMatchObject({ snapshot: null, sourceState: "denied" });
    expect(await h.rpc("show", { id: two.id })).toMatchObject({ snapshot: { title: "PR 2" } });
    h.setResponse(async () => ({ ok: false, kind: "auth-changed", message: "Account switched" }));
    await h.rpc("refresh", { id: two.id }); await h.settle();
    expect(await h.rpc("show", { id: two.id })).toMatchObject({ snapshot: null, sourceState: "auth-changed" });
  });
  it("observing a new account through a new URL invalidates old-account snapshots without switching their readers", async () => {
    const h = setup(); const one = await h.link(1), two = await h.link(2);
    h.setResponse(async (input) => ({ ok: true, accountId: "U_B", login: "bob", snapshot: snapshot(Number(input.url.split("/").at(-1))) }));
    await h.rpc("preview", { url: snapshot(3).url, threadId: "thr_a" });
    for (const item of [one, two]) expect(await h.rpc("show", { id: item.id })).toMatchObject({ snapshot: null, reader: { accountId: "U_A" }, sourceState: "auth-changed" });
    const switched = await h.rpc<PullRequestItem>("source", { id: one.id, hostId: "host_a" });
    expect(switched).toMatchObject({ snapshot: { title: "PR 1" }, reader: { accountId: "U_B" } });
    expect(await h.rpc("show", { id: two.id })).toMatchObject({ snapshot: null, reader: { accountId: "U_A" } });
  });
  it("deduplicates discovery reads by PR across environments and never claims hidden thread links", async () => {
    const h = setup();
    await h.rpc("refresh", { discover: true }); await h.settle();
    const listing = await h.rpc<{ items: PullRequestItem[] }>("list", {});
    expect(listing.items).toHaveLength(1); expect(listing.items[0]?.links).toHaveLength(2);
    expect(h.harness.inspection.experimental_hostRpcCalls.filter((call) => call.method === "read")).toHaveLength(1);
    h.threads[1]!.visibility = "hidden";
    expect((await h.rpc<PullRequestItem>("show", { id: listing.items[0]!.id })).links).toHaveLength(1);
    await expect(h.rpc("preview", { url: snapshot(2).url, threadId: "thr_b" })).rejects.toThrow("hidden");
  });
  it("discards late refresh replies after an explicit source change", async () => {
    const h = setup(); const item = await h.link(); await h.link(1, "thr_b");
    let release: ((value: ReadResult) => void) | undefined;
    h.setResponse(async (input, hostId) => hostId === "host_a" ? new Promise((resolve) => { release = resolve; }) : { ok: true, accountId: "U_B", login: "bob", snapshot: { ...snapshot(), title: "New source" } });
    await h.rpc("refresh", { id: item.id });
    await vi.waitFor(() => expect(release).toBeDefined());
    await h.rpc("source", { id: item.id, hostId: "host_b" });
    release!({ ok: true, accountId: "U_A", login: "alice", snapshot: { ...snapshot(), title: "Late old reply" } });
    await h.settle();
    expect(await h.rpc("show", { id: item.id })).toMatchObject({ reader: { hostId: "host_b" }, snapshot: { title: "New source" } });
  });
  it("targets the calling CLI thread by default and records explicit cross-thread intent", async () => {
    const h = setup();
    const created = await h.harness.behavior.runCli(["link", snapshot().url], { threadId: "thr_a", signal: new AbortController().signal });
    expect(created.exitCode).toBe(0);
    const next = await h.harness.behavior.runCli(["link", snapshot().url, "--thread", "thr_b"], { threadId: "thr_a", signal: new AbortController().signal });
    expect(JSON.parse(next.stdout)).toMatchObject({ links: expect.arrayContaining([{ threadId: "thr_b", evidence: "agent-explicit", origin: false, environmentId: "env_b", createdAt: expect.any(String), actor: "thr_a" }]) });
    await expect(h.rpc("preview", { url: snapshot().url, threadId: "thr_a", hostId: "host_b" })).rejects.toThrow("thread's machine");
  });
});
