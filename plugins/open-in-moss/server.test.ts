import { describe, expect, it, vi } from "vitest";
import { createFakePluginHost } from "@get-bb/plugin-sdk/testing";
import {
  createOpenInMossPlugin,
  type OpenInMossDependencies,
} from "./server";

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
  const host = createFakePluginHost({ pluginId: "open-in-moss" });
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
