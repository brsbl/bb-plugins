import { createFakePluginHost, makeHostResponse, makeThreadResponse } from "@get-bb/plugin-sdk/testing";
import { afterEach, describe, expect, it } from "vitest";
import plugin from "./server.js";

const disposers: Array<() => Promise<void>> = [];
afterEach(async () => { for (const dispose of disposers.splice(0)) await dispose(); });
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
    const result = await h.behavior.callRpc("inspect", { threadId: "one" }) as { pins: unknown[] };
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
    expect(context).toMatch(/^## Pin the file the user names/);
    expect(context).toContain("bb file-pins pin <path>");
    expect(context).not.toContain("name: file-pins");
    await expect(provider.resolve("other")).rejects.toThrow("out of date");
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
  it("removes storage when a thread is deleted", async () => {
    const h = setup();
    await h.behavior.callRpc("pin", { threadId: "one", hostId: "mac", path: "/note.md" });
    await h.behavior.emitThreadEvent("thread.deleted", { thread: makeThreadResponse({ id: "one" }) });
    expect(await h.behavior.callRpc("list", { threadId: "one" })).toEqual({ pins: [] });
  });
});
