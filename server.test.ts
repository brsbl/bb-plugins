import { describe, expect, it, vi } from "vitest";
import { createFakePluginHost, makeHostResponse } from "@get-bb/plugin-sdk/testing";
import {
  createOpenInMossPlugin,
  type OpenInMossDependencies,
} from "./server";
import { runOnHost } from "./open";
import { pathInput } from "./contract";

function dependencies(
  overrides: Partial<OpenInMossDependencies> = {},
): OpenInMossDependencies {
  return {
    platform: "darwin",
    realpath: async (filePath) => filePath,
    stat: async () => ({ isFile: () => true }),
    open: async () => {},
    ...overrides,
  };
}

async function loadPlugin(deps: OpenInMossDependencies) {
  const host = createFakePluginHost({
    pluginId: "open-in-moss",
    sdk: { hosts: { list: async () => [makeHostResponse({ id: "host_mac" })] } },
    experimental_callHostRpc: ({ method, input }) => runOnHost(pathInput.parse(input).path, method === "open", deps),
  });
  await createOpenInMossPlugin(deps)(host.bb);
  return host;
}

async function post(
  deps: OpenInMossDependencies,
  body: unknown,
): Promise<Response> {
  const { harness } = await loadPlugin(deps);
  return harness.fetchHttp("POST", "/open", {
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /open", () => {
  it("opens a Mac file through its host when the server runs on Linux", async () => {
    const localOpen = vi.fn(async () => {});
    const host = createFakePluginHost({
      pluginId: "open-in-moss",
      experimental_callHostRpc: async () => ({
        ok: true,
        path: "/Users/brsbl/Moss/Notes/Tweets/Tweets.md",
      }),
    });
    await createOpenInMossPlugin(dependencies({ platform: "linux", open: localOpen }))(host.bb);
    const response = await host.harness.fetchHttp("POST", "/open", {
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        path: "/Users/brsbl/Moss/Notes/Tweets/Tweets.md",
        hostId: "host_mac",
      }),
    });

    expect(response.status).toBe(200);
    expect(host.harness.experimental_hostRpcCalls).toContainEqual(expect.objectContaining({
      hostId: "host_mac",
      method: "open",
      input: { path: "/Users/brsbl/Moss/Notes/Tweets/Tweets.md" },
    }));
    expect(localOpen).not.toHaveBeenCalled();
  });

  it("discovers the file on a Mac without opening it during probes", async () => {
    const open = vi.fn(async () => {});
    const host = createFakePluginHost({
      pluginId: "open-in-moss",
      sdk: { hosts: { list: async () => [
        makeHostResponse({ id: "host_linux" }),
        makeHostResponse({ id: "host_mac" }),
        makeHostResponse({ id: "host_offline", status: "disconnected" }),
      ] } },
      experimental_callHostRpc: ({ hostId, method, input }) => runOnHost(
        pathInput.parse(input).path, method === "open",
        dependencies({ platform: hostId === "host_mac" ? "darwin" : "linux", open }),
      ),
    });
    const localOpen = vi.fn(async () => {});
    await createOpenInMossPlugin(dependencies({ platform: "linux", open: localOpen }))(host.bb);
    const response = await host.harness.fetchHttp("POST", "/open", {
      body: JSON.stringify({ path: "/Users/brsbl/Moss/Notes/Tweets/Tweets.md" }),
    });
    expect(response.status).toBe(200);
    expect(open).toHaveBeenCalledExactlyOnceWith("/Users/brsbl/Moss/Notes/Tweets/Tweets.md");
    expect(localOpen).not.toHaveBeenCalled();
    expect(host.harness.experimental_hostRpcCalls.map(({ hostId, method }) => ({ hostId, method }))).toEqual([
      { hostId: "host_linux", method: "probe" },
      { hostId: "host_mac", method: "probe" },
      { hostId: "host_mac", method: "open" },
    ]);
  });

  it("opens on the first matching host by ID when another host fails or also matches", async () => {
    const host = createFakePluginHost({
      pluginId: "open-in-moss",
      sdk: { hosts: { list: async () => [
        makeHostResponse({ id: "host_c" }),
        makeHostResponse({ id: "host_b" }),
        makeHostResponse({ id: "host_a" }),
      ] } },
      experimental_callHostRpc: ({ hostId }) => {
        if (hostId === "host_a") throw new Error("not running plugins");
        return { ok: true, path: "/notes/spec.md" };
      },
    });
    await createOpenInMossPlugin(dependencies({ platform: "linux" }))(host.bb);
    const response = await host.harness.fetchHttp("POST", "/open", { body: JSON.stringify({ path: "/notes/spec.md" }) });
    expect(response.status).toBe(200);
    expect(host.harness.experimental_hostRpcCalls.filter(({ method }) => method === "open"))
      .toEqual([expect.objectContaining({ hostId: "host_b" })]);
  });

  it("reports an unreachable host when no reachable host has the file", async () => {
    const host = createFakePluginHost({
      pluginId: "open-in-moss",
      sdk: { hosts: { list: async () => [makeHostResponse({ id: "linux" }), makeHostResponse({ id: "mac" })] } },
      experimental_callHostRpc: ({ hostId, input }) => {
        if (hostId === "mac") throw new Error("asleep");
        return runOnHost(pathInput.parse(input).path, false, dependencies({ platform: "linux" }));
      },
    });
    await createOpenInMossPlugin(dependencies({ platform: "linux" }))(host.bb);
    const response = await host.harness.fetchHttp("POST", "/open", { body: JSON.stringify({ path: "/notes/spec.md" }) });
    expect(response.status).toBe(502);
    expect(host.harness.experimental_hostRpcCalls.every(({ method }) => method === "probe")).toBe(true);
  });

  it("opens a file on a macOS server locally without probing hosts", async () => {
    const open = vi.fn(async () => {});
    const { harness } = await loadPlugin(dependencies({ open }));
    const response = await harness.fetchHttp("POST", "/open", { body: JSON.stringify({ path: "/notes/spec.md" }) });
    expect(response.status).toBe(200);
    expect(open).toHaveBeenCalledExactlyOnceWith("/notes/spec.md");
    expect(harness.experimental_hostRpcCalls).toHaveLength(0);
  });

  it("never retries a failed targeted launch on another host or the server", async () => {
    const localOpen = vi.fn(async () => {});
    const host = createFakePluginHost({
      pluginId: "open-in-moss",
      experimental_callHostRpc: () => { throw new Error("host disconnected"); },
    });
    await createOpenInMossPlugin(dependencies({ open: localOpen }))(host.bb);
    const response = await host.harness.fetchHttp("POST", "/open", {
      body: JSON.stringify({ path: "/notes/spec.md", hostId: "host_mac" }),
    });
    expect(response.status).toBe(502);
    expect(host.harness.experimental_hostRpcCalls).toHaveLength(1);
    expect(localOpen).not.toHaveBeenCalled();
  });

  it("resolves and opens a Markdown file in Moss", async () => {
    const open = vi.fn(async () => {});
    const realpath = vi.fn(async () => "/real/notes/spec.md");
    const response = await post(
      dependencies({ open, realpath }),
      { path: "/workspace/spec.md" },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      ok: true,
      opened: true,
      path: "/real/notes/spec.md",
    });
    expect(realpath).toHaveBeenCalledWith("/workspace/spec.md");
    expect(open).toHaveBeenCalledWith("/real/notes/spec.md");
  });

  it("rejects malformed, relative, and non-Markdown paths", async () => {
    for (const body of [
      null,
      {},
      { path: "notes/spec.md" },
      { path: "/workspace/spec.ts" },
      { path: "/workspace/spec.md", hostId: 42 },
      { path: "/workspace/spec.md", hostId: "" },
    ]) {
      const response = await post(dependencies(), body);
      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({ ok: false });
    }
  });

  it("rejects missing files and non-files without launching Moss", async () => {
    const missingOpen = vi.fn(async () => {});
    const missing = await post(
      dependencies({
        open: missingOpen,
        realpath: async () => {
          throw new Error("ENOENT");
        },
      }),
      { path: "/workspace/gone.md" },
    );
    expect(missing.status).toBe(404);
    expect(missingOpen).not.toHaveBeenCalled();

    const directoryOpen = vi.fn(async () => {});
    const directory = await post(
      dependencies({
        open: directoryOpen,
        stat: async () => ({ isFile: () => false }),
      }),
      { path: "/workspace/folder.md" },
    );
    expect(directory.status).toBe(422);
    expect(directoryOpen).not.toHaveBeenCalled();
  });

  it("reports unsupported platforms and launch failures", async () => {
    const unsupported = await post(
      dependencies({ platform: "linux" }),
      { path: "/workspace/spec.md" },
    );
    expect(unsupported.status).toBe(409);

    const failed = await post(
      dependencies({
        open: async () => {
          throw new Error("Moss is missing");
        },
      }),
      { path: "/workspace/spec.md" },
    );
    expect(failed.status).toBe(502);
    expect(await failed.json()).toEqual({
      ok: false,
      error: {
        code: "open_failed",
        message: "Moss could not open that Markdown file.",
      },
    });
  });
});
