import { createFakePluginHost, makeThreadResponse } from "@get-bb/plugin-sdk/testing";
import { afterEach, describe, expect, it } from "vitest";
import plugin from "./server.js";

const disposers: Array<() => Promise<void>> = [];
afterEach(async () => { for (const dispose of disposers.splice(0)) await dispose(); });
function setup() {
  const { bb, harness } = createFakePluginHost({
    pluginId: "file-pins", experimental_hostEntry: true,
    sdk: { threads: { get: async ({ threadId }) => makeThreadResponse({ id: threadId, environmentId: "env-mac" }) }, environments: { get: async () => ({ hostId: "mac" }) } },
    experimental_callHostRpc: async ({ method, input, hostId }) => {
      if (hostId === "offline") throw new Error("Host offline");
      if (method === "openMossNote") return { opened: true };
      const { path } = input as { path: string };
      return { path: path === "~/note.md" ? "/Users/me/note.md" : path, name: "note.md" };
    },
  });
  plugin(bb);
  disposers.push(() => harness.lifecycle.dispose());
  return harness;
}
describe("thread file pins", () => {
  it("opens only a pin in the requested thread, on its saved file host", async () => {
    const h = setup();
    const pinned = await h.behavior.callRpc("pin", { threadId: "one", hostId: "mac", path: "~/note.md" }) as { id: string };
    expect(await h.behavior.callRpc("openMossNote", { threadId: "one", pinId: pinned.id })).toEqual({ opened: true });
    expect(h.inspection.experimental_hostRpcCalls.at(-1)).toMatchObject({ method: "openMossNote", hostId: "mac", input: { path: "/Users/me/note.md" } });
    await expect(h.behavior.callRpc("openMossNote", { threadId: "two", pinId: pinned.id })).rejects.toThrow("no longer pinned");
  });
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
  });
  it("removes storage when a thread is deleted", async () => {
    const h = setup();
    await h.behavior.callRpc("pin", { threadId: "one", hostId: "mac", path: "/note.md" });
    await h.behavior.emitThreadEvent("thread.deleted", { thread: makeThreadResponse({ id: "one" }) });
    expect(await h.behavior.callRpc("list", { threadId: "one" })).toEqual({ pins: [] });
  });
});
