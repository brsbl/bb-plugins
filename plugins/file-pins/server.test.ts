import { createFakePluginHost, makeHostResponse, makeThreadResponse } from "@get-bb/plugin-sdk/testing";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import plugin from "./server.js";

const icons = vi.hoisted(() => ({ origins: [] as string[] }));
vi.mock("@brsbl/bb-website-icons", async (original) => ({
  ...await original<typeof import("@brsbl/bb-website-icons")>(),
  IconService: class {
    setEnabled() {}
    async get(origin: string) { icons.origins.push(origin); return "data:image/png;base64,AA=="; }
  },
}));

// GitHub's pulls API, stubbed so no test reaches the network.
const github = { calls: [] as string[], reply: (): Response => new Response("{}", { status: 404 }) };
beforeEach(() => {
  github.calls.length = 0;
  github.reply = () => new Response("{}", { status: 404 });
  vi.stubGlobal("fetch", async (url: string) => { github.calls.push(url); return github.reply(); });
});
const disposers: Array<() => Promise<void>> = [];
afterEach(async () => { for (const dispose of disposers.splice(0)) await dispose(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });
function setup() {
  const { bb, harness } = createFakePluginHost({
    pluginId: "file-pins", experimental_hostEntry: true,
    sdk: {
      threads: { get: async ({ threadId }) => makeThreadResponse({ id: threadId, environmentId: "env-mac" }) },
      environments: { get: async () => ({ hostId: "mac", path: "/Users/me/project" }) },
      hosts: { list: async () => [
        makeHostResponse({ id: "mac", name: "My Mac", status: "connected" }),
        makeHostResponse({ id: "linux", name: "Worker", status: "disconnected" }),
        makeHostResponse({ id: "pi", name: "Pi", status: "connected" }),
      ] },
    },
    experimental_callHostRpc: async ({ method, input, hostId }) => {
      if (hostId === "offline") throw new Error("Host offline");
      if (method === "inspect") return { files: (input as { paths: string[] }).paths.map((path) => ({ path, status: path.includes("gone") ? "missing" : "available" })) };
      const { path } = input as { path: string };
      return { path: path === "~/note.md" ? "/Users/me/note.md" : path, name: path.split("/").at(-1)! };
    },
  });
  plugin(bb);
  disposers.push(() => harness.lifecycle.dispose());
  return { ...harness, bb };
}
describe("thread file pins", () => {
  it("preserves concurrent pins, deduplicates canonical paths, isolates threads, and survives reload", async () => {
    const h = setup();
    const first = await h.behavior.callRpc("pin", { threadId: "one", hostId: "mac", path: "~/note.md" });
    await Promise.all([
      h.behavior.callRpc("pin", { threadId: "one", hostId: "mac", path: "/Users/me/note.md" }),
      h.behavior.callRpc("pin", { threadId: "one", hostId: "linux", path: "/Users/me/note.md" }),
      h.behavior.callRpc("pin", { threadId: "one", hostId: "mac", path: "/Users/me/second.md" }),
    ]);
    const { harness: reloaded } = await h.lifecycle.reload(plugin);
    disposers.push(() => reloaded.lifecycle.dispose());
    const listed = await reloaded.behavior.callRpc("list", { threadId: "one" }) as { pins: unknown[] };
    expect(listed.pins).toHaveLength(3);
    expect(listed.pins).toContainEqual(first);
    expect(await reloaded.behavior.callRpc("list", { threadId: "two" })).toEqual({ pins: [] });
    expect(h.inspection.experimental_hostRpcCalls[0]?.hostId).toBe("mac");
  });
  it("rejects missing-host files without creating pins; unpins without host access", async () => {
    const h = setup();
    await expect(h.behavior.callRpc("pin", { threadId: "one", hostId: "offline", path: "/note.md" })).rejects.toThrow();
    const pin = await h.behavior.callRpc("pin", { threadId: "one", hostId: "mac", path: "/note.md" }) as { id: string };
    const calls = h.inspection.experimental_hostRpcCalls.length;
    expect(await h.behavior.callRpc("unpin", { threadId: "one", pinId: pin.id })).toEqual({ removed: true });
    expect(h.inspection.experimental_hostRpcCalls).toHaveLength(calls);
    expect(await h.behavior.callRpc("list", { threadId: "one" })).toEqual({ pins: [] });
  });
  it("routes explicit-machine CLI pins to that host without forwarding another host's cwd", async () => {
    const h = setup();
    const response = await h.behavior.runCli(["pin", "/note.md", "--machine", "linux", "--thread", "destination", "--json"], { threadId: "invoking", cwd: "/Users/me/project", signal: new AbortController().signal });
    expect(response.exitCode).toBe(0);
    expect(h.inspection.experimental_hostRpcCalls.at(-1)).toMatchObject({ hostId: "linux", input: { path: "/note.md" } });
    expect(h.inspection.experimental_hostRpcCalls.at(-1)?.input).not.toHaveProperty("cwd");
    expect((await h.behavior.runCli(["list", "--thread", "destination", "--json"], { signal: new AbortController().signal })).stdout).toContain("/note.md");
    const { id } = JSON.parse(response.stdout ?? "") as { id: string };
    const removed = await h.behavior.runCli(["remove", id, "--thread", "destination", "--json"], { signal: new AbortController().signal });
    expect(JSON.parse(removed.stdout ?? "")).toEqual({ removed: true });
    expect(await h.behavior.callRpc("list", { threadId: "destination" })).toEqual({ pins: [] });
  });
  it("restores a removed pin in place without accessing its host and scopes Undo to the thread", async () => {
    const h = setup();
    const first = await h.behavior.callRpc("pin", { threadId: "one", hostId: "mac", path: "/gone.md" }) as { id: string };
    const second = await h.behavior.callRpc("pin", { threadId: "one", hostId: "mac", path: "/second.md" });
    const calls = h.inspection.experimental_hostRpcCalls.length;
    const { undoToken } = await h.behavior.callRpc("remove", { threadId: "one", pinId: first.id }) as { undoToken: string };
    await expect(h.behavior.callRpc("undo", { threadId: "two", undoToken })).rejects.toThrow("expired");
    expect(await h.behavior.callRpc("undo", { threadId: "one", undoToken })).toEqual(first);
    expect(await h.behavior.callRpc("list", { threadId: "one" })).toEqual({ pins: [first, second] });
    expect(h.inspection.experimental_hostRpcCalls).toHaveLength(calls);
    await expect(h.behavior.callRpc("undo", { threadId: "one", undoToken })).rejects.toThrow("expired");
  });
  it("retains missing pins and distinguishes offline hosts", async () => {
    const h = setup();
    for (const [hostId, path] of [["mac", "/gone.md"], ["linux", "/offline.md"], ["mac", "/here.md"]]) {
      await h.behavior.callRpc("pin", { threadId: "one", hostId, path });
    }
    const result = await h.behavior.callRpc("inspect", { threadId: "one" }) as { pins: unknown[]; threadHostId: string | null };
    expect(result.threadHostId).toBe("mac");
    expect(result.pins).toMatchObject([
      { path: "/gone.md", status: "missing", hostName: "My Mac" },
      { path: "/offline.md", status: "unavailable", hostName: "Worker" },
      { path: "/here.md", status: "available" },
    ]);
    expect((await h.behavior.callRpc("list", { threadId: "one" }) as { pins: unknown[] }).pins).toHaveLength(3);
  });
  it("resolves relative paths against the thread workspace on its own machine only", async () => {
    const h = setup();
    await h.behavior.callRpc("pin", { threadId: "one", hostId: "mac", path: "docs/note.md" });
    expect(h.inspection.experimental_hostRpcCalls.at(-1)).toMatchObject({ method: "resolveFile", hostId: "mac", input: { path: "docs/note.md", cwd: "/Users/me/project" } });
    await h.behavior.callRpc("pin", { threadId: "one", hostId: "pi", path: "/srv/note.md" });
    expect(h.inspection.experimental_hostRpcCalls.at(-1)?.input).not.toHaveProperty("cwd");
  });
  it("resolves the composer pill to the shipped skill's instructions and never lists it in the @ menu", async () => {
    const h = setup();
    const provider = h.registrations.mentionProviders.find((item) => item.id === "pin")!;
    expect(await provider.search({ trigger: "@", query: "pin", projectId: null, threadId: "one" })).toEqual([]);
    const { context } = await provider.resolve("file");
    expect(context).toMatch(/^## Pin the files and links the user names/);
    expect(context).toContain("bb file-pins pin <path>");
    expect(context).toContain("bb file-pins pin <url>");
    expect(context).not.toContain("name: file-pins");
    await expect(provider.resolve("other")).rejects.toThrow("out of date");
  });
  it("points every thread at the skill's proactive link-pinning rule", () => {
    const h = setup();
    expect(h.registrations.instructionProvider?.({ threadId: "one", projectId: "p" })).toMatch(/bb file-pins pin <url> --title .*file-pins skill/);
  });
  it("repins in place only after the replacement resolves successfully", async () => {
    const h = setup();
    const original = await h.behavior.callRpc("pin", { threadId: "one", hostId: "mac", path: "/gone.md" }) as { id: string };
    await expect(h.behavior.callRpc("repin", { threadId: "one", pinId: original.id, hostId: "offline", path: "/new.md" })).rejects.toThrow("offline");
    expect(await h.behavior.callRpc("list", { threadId: "one" })).toEqual({ pins: [original] });
    const replacement = await h.behavior.callRpc("repin", { threadId: "one", pinId: original.id, hostId: "mac", path: "/new.md" });
    expect(replacement).toMatchObject({ id: original.id, path: "/new.md" });
    expect(await h.behavior.callRpc("list", { threadId: "one" })).toEqual({ pins: [replacement] });
  });
  it("saves order and overflow pins together, rejects stale arrangements, and restores placement on Undo", async () => {
    const h = setup();
    const first = await h.behavior.callRpc("pin", { threadId: "one", hostId: "mac", path: "/first.md" }) as { id: string };
    const second = await h.behavior.callRpc("pin", { threadId: "one", hostId: "mac", path: "/second.md" }) as { id: string };
    const third = await h.behavior.callRpc("pin", { threadId: "one", hostId: "mac", path: "/third.md" }) as { id: string };
    await h.behavior.callRpc("arrange", { threadId: "one", order: [second.id, first.id, third.id], more: [third.id] });
    const { harness: reloaded } = await h.lifecycle.reload(plugin);
    disposers.push(() => reloaded.lifecycle.dispose());
    expect(await reloaded.behavior.callRpc("list", { threadId: "one" })).toEqual({ pins: [second, first, third] });
    expect(await reloaded.behavior.callRpc("inspect", { threadId: "one" })).toMatchObject({ more: [third.id] });
    await expect(reloaded.behavior.callRpc("arrange", { threadId: "one", order: [first.id, second.id], more: [] })).rejects.toThrow("changed");
    await expect(reloaded.behavior.callRpc("arrange", { threadId: "two", order: [first.id], more: [] })).rejects.toThrow("changed");
    const { undoToken } = await reloaded.behavior.callRpc("remove", { threadId: "one", pinId: third.id }) as { undoToken: string };
    expect(await reloaded.behavior.callRpc("inspect", { threadId: "one" })).toMatchObject({ more: [] });
    await reloaded.behavior.callRpc("undo", { threadId: "one", undoToken });
    expect(await reloaded.behavior.callRpc("inspect", { threadId: "one" })).toMatchObject({ more: [third.id] });
  });
  it("loads pins stored before URL pins existed unchanged", async () => {
    const h = setup();
    const stored = [
      { id: "a", hostId: "mac", path: "/Users/me/a.md", name: "a.md", createdAt: "2026-01-01T00:00:00.000Z" },
      { id: "b", hostId: "linux", path: "/srv/b.ts", name: "b.ts", createdAt: "2026-01-02T00:00:00.000Z" },
    ];
    await h.bb.storage.kv.set("thread:one:pins:v1", stored);
    await h.bb.storage.kv.set("thread:one:more:v1", ["b"]);
    expect(await h.behavior.callRpc("list", { threadId: "one" })).toEqual({ pins: stored });
    expect(await h.behavior.callRpc("inspect", { threadId: "one" })).toMatchObject({ pins: [{ id: "a", status: "available" }, { id: "b", status: "unavailable" }], more: ["b"] });
    const link = await h.behavior.callRpc("pinUrl", { threadId: "one", url: "https://example.com/docs" }) as { id: string };
    await h.behavior.callRpc("arrange", { threadId: "one", order: [link.id, "a", "b"], more: ["b"] });
    expect(await h.bb.storage.kv.get("thread:one:pins:v1")).toEqual([expect.objectContaining({ kind: "url" }), ...stored]);
  });
  it("pins http(s) URLs beside files, de-duplicates exact URLs and shares order, Undo and capacity", async () => {
    const h = setup();
    const file = await h.behavior.callRpc("pin", { threadId: "one", hostId: "mac", path: "/note.md" });
    const link = await h.behavior.callRpc("pinUrl", { threadId: "one", url: "https://Example.com/a/b/c?q=1", title: " Example\n page " }) as { id: string };
    expect(link).toMatchObject({ kind: "url", url: "https://example.com/a/b/c?q=1", name: "Example page" });
    expect(await h.behavior.callRpc("pinUrl", { threadId: "one", url: "https://example.com/a/b/c?q=1" })).toEqual(link);
    expect(await h.behavior.callRpc("pinUrl", { threadId: "one", url: "https://example.com/a/b/c" })).toMatchObject({ name: "example.com/a/…/c" });
    for (const url of ["ftp://example.com", "javascript:alert(1)", "https://me:pw@example.com"]) {
      await expect(h.behavior.callRpc("pinUrl", { threadId: "one", url })).rejects.toThrow("http(s)");
    }
    const calls = h.inspection.experimental_hostRpcCalls.length;
    const inspected = await h.behavior.callRpc("inspect", { threadId: "one" }) as { pins: Array<{ id: string }> };
    expect(inspected.pins.map((pin) => pin.id)).toEqual([(file as { id: string }).id, link.id, expect.any(String)]);
    expect(inspected.pins[1]).toEqual(link);
    expect(h.inspection.experimental_hostRpcCalls.slice(calls).flatMap(({ input }) => (input as { paths: string[] }).paths)).toEqual(["/note.md"]);
    const { undoToken } = await h.behavior.callRpc("remove", { threadId: "one", pinId: link.id }) as { undoToken: string };
    expect(await h.behavior.callRpc("undo", { threadId: "one", undoToken })).toEqual(link);
    expect((await h.behavior.callRpc("list", { threadId: "one" }) as { pins: Array<{ id: string }> }).pins[1]).toEqual(link);
    await expect(h.behavior.callRpc("repin", { threadId: "one", pinId: link.id, hostId: "mac", path: "/x.md" })).rejects.toThrow("no longer pinned");
    for (let index = 3; index < 40; index++) await h.behavior.callRpc("pinUrl", { threadId: "one", url: `https://example.com/${index}` });
    await expect(h.behavior.callRpc("pinUrl", { threadId: "one", url: "https://example.com/full" })).rejects.toThrow("up to 40 pins");
    await expect(h.behavior.callRpc("pin", { threadId: "one", hostId: "mac", path: "/full.md" })).rejects.toThrow("up to 40 pins");
  });
  it("pins, lists and removes URLs from the CLI without a file host", async () => {
    const h = setup();
    const signal = new AbortController().signal;
    const calls = h.inspection.experimental_hostRpcCalls.length;
    const pinned = await h.behavior.runCli(["pin", "https://github.com/brsbl/bb-plugins/pull/343", "--title", "PR 343", "--thread", "one", "--json"], { signal });
    expect(pinned.exitCode).toBe(0);
    const { id } = JSON.parse(pinned.stdout ?? "") as { id: string };
    expect((await h.behavior.runCli(["pin", "https://example.com", "--thread", "one"], { signal })).stdout).toMatch(/^Pinned https:\/\/example\.com\/\n/);
    expect(h.inspection.experimental_hostRpcCalls).toHaveLength(calls);
    expect((await h.behavior.runCli(["list", "--thread", "one"], { signal })).stdout).toBe(`${id}\turl\thttps://github.com/brsbl/bb-plugins/pull/343\n${(await h.behavior.callRpc("list", { threadId: "one" }) as { pins: Array<{ id: string }> }).pins[1]!.id}\turl\thttps://example.com/`);
    expect(JSON.parse((await h.behavior.runCli(["list", "--thread", "one", "--json"], { signal })).stdout ?? "").pins[0]).toMatchObject({ id, kind: "url", name: "PR 343" });
    expect(JSON.parse((await h.behavior.runCli(["remove", id, "--thread", "one", "--json"], { signal })).stdout ?? "")).toEqual({ removed: true });
    const rejected = await h.behavior.runCli(["pin", "ftp://example.com/file", "--thread", "one"], { signal }).catch((error: unknown) => error);
    expect(String((rejected as { stderr?: string }).stderr ?? rejected)).toContain("http(s)");
  });
  it("looks up only a URL pin's own origin for its favicon", async () => {
    const h = setup();
    icons.origins.length = 0;
    const file = await h.behavior.callRpc("pin", { threadId: "one", hostId: "mac", path: "/note.md" }) as { id: string };
    const link = await h.behavior.callRpc("pinUrl", { threadId: "one", url: "https://docs.example.com/private/path?token=1" }) as { id: string };
    expect(await h.behavior.callRpc("icon", { threadId: "one", pinId: link.id })).toEqual({ dataUrl: "data:image/png;base64,AA==" });
    expect(await h.behavior.callRpc("icon", { threadId: "one", pinId: file.id })).toEqual({ dataUrl: null });
    expect(await h.behavior.callRpc("icon", { threadId: "two", pinId: link.id })).toEqual({ dataUrl: null });
    expect(icons.origins).toEqual(["https://docs.example.com"]);
  });
  it("looks a pinned PR's state up once, rechecks only when stale, and keeps the last state when GitHub can't answer", async () => {
    const h = setup();
    const now = vi.spyOn(Date, "now");
    now.mockReturnValue(1_000_000_000);
    github.reply = () => new Response(JSON.stringify({ state: "open", draft: false, merged_at: null }), { status: 200 });
    const pr = await h.behavior.callRpc("pinUrl", { threadId: "one", url: "https://github.com/get-bb/bb/pull/5075/files" }) as { id: string };
    const other = await h.behavior.callRpc("pinUrl", { threadId: "one", url: "https://example.com/" }) as { id: string };
    expect(await h.behavior.callRpc("prState", { threadId: "one", pinId: pr.id })).toEqual({ state: "open" });
    expect(await h.behavior.callRpc("prState", { threadId: "one", pinId: other.id })).toEqual({ state: null });
    expect(github.calls).toEqual(["https://api.github.com/repos/get-bb/bb/pulls/5075"]);
    // Still fresh, so no second request; once stale, a failed check keeps the last state.
    await h.behavior.callRpc("prState", { threadId: "one", pinId: pr.id });
    now.mockReturnValue(1_000_000_000 + 11 * 60_000);
    github.reply = () => new Response("{}", { status: 403 });
    expect(await h.behavior.callRpc("prState", { threadId: "one", pinId: pr.id })).toEqual({ state: "open" });
    github.reply = () => new Response(JSON.stringify({ state: "closed", draft: false, merged_at: "2026-10-07T00:00:00Z" }), { status: 200 });
    expect(await h.behavior.callRpc("prState", { threadId: "one", pinId: pr.id })).toEqual({ state: "merged" });
    // A merge is final: no more requests, even much later.
    now.mockReturnValue(1_000_000_000 + 30 * 24 * 60 * 60_000);
    await h.behavior.callRpc("prState", { threadId: "one", pinId: pr.id });
    expect(github.calls).toHaveLength(3);
  });
  it("removes storage when a thread is deleted", async () => {
    const h = setup();
    await h.behavior.callRpc("pin", { threadId: "one", hostId: "mac", path: "/note.md" });
    await h.behavior.emitThreadEvent("thread.deleted", { thread: makeThreadResponse({ id: "one" }) });
    expect(await h.behavior.callRpc("list", { threadId: "one" })).toEqual({ pins: [] });
  });
});
