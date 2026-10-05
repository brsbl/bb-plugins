import { createFakePluginHost, makeHostResponse, makeThreadResponse } from "@get-bb/plugin-sdk/testing";
import { afterEach, describe, expect, it, vi } from "vitest";
import plugin from "./server.js";
import { createStore } from "./store.js";
import type { PullRequestItem, ReadResult, SearchResult, Snapshot } from "./contract.js";

const disposers: Array<() => Promise<void>> = [];
afterEach(async () => { for (const dispose of disposers.splice(0)) await dispose(); });
function snapshot(number = 1): Snapshot {
  return { nodeId: `PR_${number}`, url: `https://github.com/acme/repo/pull/${number}`, repository: "acme/repo", number, title: `PR ${number}`, body: "Private description", author: "alice", state: "open", headSha: "abc", headBranch: "fix", baseBranch: "main", updatedAt: "2026-10-04T00:00:00Z", fetchedAt: "2026-10-04T00:00:00Z", checks: { state: "passing", passing: 1, failing: 0, pending: 0, total: 1, complete: true, items: [{ name: "CI", state: "passing", url: null }] }, review: "approved", mergeability: "mergeable", queued: false, autoMerge: false, additions: 1, deletions: 1, changedFiles: 1, originThreadIds: [], stack: { state: "none", items: [] } };
}
function setup() {
  let beforeThreadRead = async () => {};
  let response: (input: { url: string; expectedAccountId?: string }, hostId: string) => Promise<ReadResult> = async (input) => ({ ok: true, accountId: "U_A", login: "alice", snapshot: snapshot(Number(input.url.split("/").at(-1))) });
  let searchResponse: (input: { scope: string }, hostId: string) => Promise<SearchResult> = async () => ({ ok: true, accountId: "U_A", login: "alice", snapshots: [snapshot()], nextCursor: null });
  const threads = [makeThreadResponse({ id: "thr_a", environmentId: "env_a", title: "Implementation" }), makeThreadResponse({ id: "thr_b", environmentId: "env_b", title: "Review" })];
  const { bb, harness } = createFakePluginHost({ pluginId: "pull-requests", experimental_hostEntry: true, sdk: {
    threads: { get: async ({ threadId }) => { await beforeThreadRead(); const thread = threads.find((entry) => entry.id === threadId); if (!thread) throw new Error("No thread"); return thread; }, list: async ({ offset = 0, environmentId } = {}) => offset ? [] : threads.filter((thread) => !environmentId || thread.environmentId === environmentId) },
    environments: { get: async ({ environmentId }) => ({ hostId: environmentId === "env_b" ? "host_b" : "host_a", path: "/repo" }), pullRequest: async () => ({ outcome: "available", pullRequest: { url: snapshot().url } }) },
    hosts: { list: async () => [makeHostResponse({ id: "host_a", status: "connected" }), makeHostResponse({ id: "host_b", status: "connected" })] },
  }, experimental_callHostRpc: async ({ method, input, hostId }) => method === "search" ? searchResponse(input as { scope: string }, hostId) : response(input as { url: string; expectedAccountId?: string }, hostId) });
  plugin(bb); disposers.push(() => harness.lifecycle.dispose());
  const rpc = <T = unknown>(method: string, input: unknown) => harness.behavior.callRpc(method, input) as Promise<T>;
  const link = async (number = 1, threadId = "thr_a") => {
    const preview = await rpc<{ token: string }>("preview", { url: snapshot(number).url, threadId });
    return rpc<PullRequestItem>("link", { token: preview.token });
  };
  const settle = async () => { await vi.waitFor(async () => expect(await rpc("list", {})).toMatchObject({ coverage: { running: false } })); };
  return { bb, harness, rpc, link, settle, threads, setSearchResponse: (next: typeof searchResponse) => { searchResponse = next; }, setBeforeThreadRead: (next: typeof beforeThreadRead) => { beforeThreadRead = next; }, setResponse: (next: typeof response) => { response = next; } };
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
  it("hides all cached private PRs when a new-URL preview discovers missing authentication", async () => {
    const h = setup(); const one = await h.link(1), two = await h.link(2);
    h.setResponse(async () => ({ ok: false, kind: "authentication-required", message: "Sign in on this machine." }));
    await expect(h.rpc("preview", { url: snapshot(3).url, threadId: "thr_a" })).rejects.toThrow("Sign in");
    for (const item of [one, two]) expect(await h.rpc("show", { id: item.id })).toMatchObject({ snapshot: null, reader: { accountId: "U_A" }, sourceState: "authentication-required" });
  });
  it("queries GitHub without scanning threads or environments and allows unlinked PRs", async () => {
    const h = setup();
    h.threads.splice(0);
    await h.rpc("refresh", { discover: true }); await h.settle();
    const listing = await h.rpc<{ items: PullRequestItem[] }>("list", {});
    expect(listing.items).toHaveLength(1);
    expect(listing.items[0]).toMatchObject({ discoveredFromGitHub: true, links: [], snapshot: { title: "PR 1" } });
    expect(h.harness.inspection.sdk.callsTo("threads.list")).toHaveLength(0);
    expect(h.harness.inspection.sdk.callsTo("environments.pullRequest")).toHaveLength(0);
    expect(await h.rpc("show", { id: listing.items[0]!.id })).toMatchObject({ snapshot: { body: "Private description" } });
    expect(await h.rpc("pin", { id: listing.items[0]!.id, pinned: true })).toMatchObject({ pinned: true });
  });
  it("unions same-account sources with different repository access without duplicating PRs", async () => {
    const h = setup();
    h.setSearchResponse(async (_input, hostId) => ({ ok: true, accountId: "U_A", login: "alice", snapshots: hostId === "host_a" ? [snapshot(1)] : [snapshot(1), snapshot(2)], nextCursor: null }));
    await h.rpc("refresh", { discover: true }); await h.settle();
    const listing = await h.rpc<{ items: PullRequestItem[] }>("list", {});
    expect(listing.items.map((item) => item.id).sort()).toEqual(["github:PR_1", "github:PR_2"]);
    expect(listing.items.find((item) => item.id === "github:PR_1")?.reader?.hostId).toBe("host_a");
    expect(listing.items.find((item) => item.id === "github:PR_2")?.reader?.hostId).toBe("host_b");
  });
  it("ignores thread references in project PRs the reader neither wrote nor was asked to review", async () => {
    const h = setup();
    const value = { ...snapshot(), author: "mallory", requestedReviewers: ["someone-else"], body: "BB-Thread-ID: thr_a\n@thread:thr_b" };
    h.setSearchResponse(async () => ({ ok: true, accountId: "U_A", login: "alice", snapshots: [value], nextCursor: null }));
    await h.rpc("refresh", { discover: true }); await h.settle();
    expect((await h.rpc<PullRequestItem>("show", { id: "github:PR_1" })).links).toEqual([]);
  });
  it("associates description references on search and refresh while preserving explicit unlinks", async () => {
    const h = setup();
    h.threads.push(makeThreadResponse({ id: "thr_hidden", visibility: "hidden" }), makeThreadResponse({ id: "thr_deleted", deletedAt: Date.now() }));
    h.threads[1]!.archivedAt = Date.now();
    const value = { ...snapshot(), body: "BB-Thread-ID: thr_a\n[Review](https://brsbl.getbb.app/threads/thr_b)\n@thread:thr_a thr_hidden thr_deleted thr_unknown", originThreadIds: ["thr_a"] };
    h.setSearchResponse(async () => ({ ok: true, accountId: "U_A", login: "alice", snapshots: [value], nextCursor: null }));
    await h.rpc("refresh", { discover: true }); await h.settle();
    const item = await h.rpc<PullRequestItem>("show", { id: "github:PR_1" });
    expect(item.links.map((link) => link.threadId)).toEqual(["thr_a", "thr_b"]);
    expect(item.links.every((link) => link.evidence === "body-marker" && !link.origin)).toBe(true);
    expect(h.harness.inspection.sdk.callsTo("threads.list")).toHaveLength(0);
    expect(h.harness.inspection.sdk.callsTo("environments.get")).toHaveLength(0);
    h.setResponse(async () => ({ ok: true, accountId: "U_A", login: "alice", snapshot: value }));
    await h.rpc("refresh", { discover: true, includeArchived: true }); await h.settle();
    expect((await h.rpc<PullRequestItem>("show", { id: item.id })).links.map((link) => [link.threadId, link.origin])).toEqual([["thr_a", true], ["thr_b", false]]);
    await h.rpc("unlink", { id: item.id, threadId: "thr_b" });
    h.threads.push(makeThreadResponse({ id: "thr_later", environmentId: null }));
    h.setResponse(async () => ({ ok: true, accountId: "U_A", login: "alice", snapshot: { ...value, body: value.body + "\nAdded thr_later" } }));
    await h.rpc("refresh", { id: item.id }); await h.settle();
    expect((await h.rpc<PullRequestItem>("show", { id: item.id })).links.map((link) => link.threadId)).toEqual(["thr_a", "thr_later"]);
    await h.rpc("refresh", { discover: true }); await h.settle();
    expect((await h.rpc<PullRequestItem>("show", { id: item.id })).links.map((link) => link.threadId)).toEqual(["thr_a", "thr_later"]);
  });
  it("does not associate a delayed body reference after GitHub access is revoked", async () => {
    const h = setup(); let release!: () => void;
    h.setBeforeThreadRead(() => new Promise<void>((resolve) => { release = resolve; }));
    h.setSearchResponse(async (input, hostId) => input.scope === "authored" && hostId === "host_a"
      ? { ok: true, accountId: "U_A", login: "alice", snapshots: [{ ...snapshot(), body: "Related: thr_b" }], nextCursor: null }
      : { ok: false, kind: "authentication-required", message: "Access lost" });
    await h.rpc("refresh", { discover: true }); await vi.waitFor(() => expect(release).toBeDefined());
    h.setResponse(async () => ({ ok: false, kind: "authentication-required", message: "Access lost" }));
    await expect(h.rpc("changes", { id: "github:PR_1" })).rejects.toThrow("Access lost");
    h.setBeforeThreadRead(async () => {}); release(); await h.settle();
    expect(await h.rpc("show", { id: "github:PR_1" })).toMatchObject({ snapshot: null, links: [] });
  });
  it.each(["auth-changed", "authentication-required"] as const)("rejects delayed history after Changes reports %s", async (kind) => {
    const h = setup(); const item = await h.link(); const store = createStore(h.bb);
    store.save({ ...item, snapshot: { ...item.snapshot!, state: "closed" } });
    let release!: (result: SearchResult) => void;
    h.setSearchResponse(async (input, hostId) => {
      if (hostId === "host_b") return { ok: false, kind, message: "Access lost" };
      if (input.scope === "history") return new Promise((resolve) => { release = resolve; });
      return { ok: true, accountId: "U_A", login: "alice", snapshots: [], nextCursor: null };
    });
    await h.rpc("refresh", { discover: true });
    await vi.waitFor(() => expect(release).toBeDefined());
    h.setResponse(async () => ({ ok: false, kind, message: "Access lost" }));
    await expect(h.rpc("changes", { id: item.id })).rejects.toThrow("Access lost");
    release({ ok: true, accountId: "U_A", login: "alice", snapshots: [{ ...snapshot(), state: "closed" }, snapshot(99)], nextCursor: null });
    await h.settle();
    expect(await h.rpc("show", { id: item.id })).toMatchObject({ snapshot: null, sourceState: kind });
    expect(() => store.get("github:PR_99")).toThrow();
  });
  it("invalidates retained closed snapshots when a failed search confirms a different account", async () => {
    const h = setup(); const item = await h.link();
    createStore(h.bb).save({ ...item, pinned: true, snapshot: { ...item.snapshot!, state: "closed" } });
    h.setSearchResponse(async () => ({ ok: false, kind: "unavailable", accountId: "U_B", message: "Search timed out" }));
    h.setResponse(async () => ({ ok: false, kind: "auth-changed", message: "Account changed" }));
    await h.rpc("refresh", { discover: true }); await h.settle();
    expect(await h.rpc("show", { id: item.id })).toMatchObject({ snapshot: null, pinned: true, reader: { accountId: "U_A" }, links: [{ threadId: "thr_a" }] });
  });
  it("keeps hidden thread links private when GitHub independently discovers the PR", async () => {
    const h = setup(); const item = await h.link();
    h.threads[0]!.visibility = "hidden";
    await h.rpc("refresh", { discover: true }); await h.settle();
    expect(await h.rpc("show", { id: item.id })).toMatchObject({ links: [], discoveredFromGitHub: true, snapshot: { title: "PR 1" } });
    await expect(h.rpc("preview", { url: item.url, threadId: "thr_a" })).rejects.toThrow("hidden");
  });
  it("does not restore an older GitHub search result after repository access is denied", async () => {
    const h = setup(); const item = await h.link();
    let release!: (result: SearchResult) => void;
    h.setSearchResponse(() => new Promise((resolve) => { release = resolve; }));
    await h.rpc("refresh", { discover: true });
    await vi.waitFor(() => expect(release).toBeDefined());
    h.setResponse(async () => ({ ok: false, kind: "denied", message: "Access denied" }));
    await expect(h.rpc("changes", { id: item.id })).rejects.toThrow("Access denied");
    h.setSearchResponse(async () => ({ ok: true, accountId: "U_A", login: "alice", snapshots: [], nextCursor: null }));
    release({ ok: true, accountId: "U_A", login: "alice", snapshots: [snapshot()], nextCursor: null });
    await h.settle();
    expect(await h.rpc("show", { id: item.id })).toMatchObject({ snapshot: null, sourceState: "denied" });
  });
  it("invalidates cached accounts on a mid-read switch during a new-URL preview and rejects older reads", async () => {
    const h = setup(); const one = await h.link(1), two = await h.link(2);
    let release!: (value: ReadResult) => void;
    h.setResponse(async (input) => input.url === one.url ? new Promise((resolve) => { release = resolve; }) : { ok: false, kind: "auth-changed", accountId: "U_A", message: "Account switched" });
    await h.rpc("refresh", { id: one.id });
    await vi.waitFor(() => expect(release).toBeDefined());
    await expect(h.rpc("preview", { url: snapshot(3).url, threadId: "thr_a" })).rejects.toThrow("Account switched");
    for (const item of [one, two]) expect(await h.rpc("show", { id: item.id })).toMatchObject({ snapshot: null, sourceState: "auth-changed" });
    release({ ok: true, accountId: "U_A", login: "alice", snapshot: snapshot(1) });
    await h.settle();
    expect(await h.rpc("show", { id: one.id })).toMatchObject({ snapshot: null, sourceState: "auth-changed" });
  });
  it("rejects an older summary after Changes reports repository access denied", async () => {
    const h = setup(); const item = await h.link();
    let release!: (value: ReadResult) => void;
    h.setResponse(async () => new Promise((resolve) => { release = resolve; }));
    await h.rpc("refresh", { id: item.id });
    await vi.waitFor(() => expect(release).toBeDefined());
    h.setResponse(async () => ({ ok: false, kind: "denied", message: "Access denied" }));
    await expect(h.rpc("changes", { id: item.id })).rejects.toThrow("Access denied");
    release({ ok: true, accountId: "U_A", login: "alice", snapshot: snapshot() });
    await h.settle();
    expect(await h.rpc("show", { id: item.id })).toMatchObject({ snapshot: null, sourceState: "denied" });
  });
  it("returns current access state when a pin response waits on thread eligibility", async () => {
    const h = setup(); const item = await h.link();
    const store = createStore(h.bb);
    let release!: () => void;
    const pending = new Promise<void>((resolve) => { release = resolve; });
    let waiting = false;
    h.setBeforeThreadRead(async () => {
      if (store.get(item.id).pinned) { waiting = true; await pending; }
    });
    const pin = h.rpc<PullRequestItem>("pin", { id: item.id, pinned: true });
    await vi.waitFor(() => expect(waiting).toBe(true));
    store.invalidateConnection(item.reader!, "auth-changed", "Account switched");
    release();
    expect(await pin).toMatchObject({ pinned: true, snapshot: null, sourceState: "auth-changed" });
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
