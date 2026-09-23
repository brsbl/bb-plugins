// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  loadPluginApp,
  mountPluginContentScripts,
  type MountedPluginContentScripts,
} from "@get-bb/plugin-sdk/testing/app";

const speak = vi.fn();
const stop = vi.fn();

vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), {
    dismiss: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
    message: vi.fn(),
  }),
}));
vi.mock("./player", () => ({
  ReadAloudPlayer: class {
    speak = speak;
    stop = stop;
    unlockAudio() {}
    dispose() {}
  },
}));

const app = await loadPluginApp(() => import("./app"));
const action = app.messageActions[0]!;
let mounted: MountedPluginContentScripts;
let settingsRequests: Array<{ url: string; resolve: () => void }>;

function run(messageId: string, text: string, selectedText?: string) {
  return action.run({
    threadId: "thr_1",
    message: { id: messageId, threadId: "thr_1", role: "assistant", text, sourceSeqEnd: 1 },
    selectedText,
    openPanel: () => false,
  } as Parameters<typeof action.run>[0]);
}

beforeEach(async () => {
  settingsRequests = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(
      (url: string) =>
        new Promise((resolve) =>
          settingsRequests.push({
            url,
            resolve: () =>
              resolve({
                ok: true,
                json: async () => ({ voice: "bm_george", speed: 1.25, device: "wasm" }),
              }),
          }),
        ),
    ),
  );
  mounted = await mountPluginContentScripts(app, { pluginId: "read-aloud-dev" });
});

afterEach(async () => {
  await mounted.lifecycle.dispose();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe("Read aloud action", () => {
  it("reads settings from the installed plugin id and speaks the cleaned text", async () => {
    const reading = run("msg_1", "## Done\n\nIt **works**.");
    settingsRequests[0]!.resolve();
    await reading;
    expect(settingsRequests[0]!.url).toBe("/api/v1/plugins/read-aloud-dev/http/settings");
    expect(speak).toHaveBeenCalledWith(
      "msg_1",
      { chunks: ["Done.", "It works."], voice: "bm_george", speed: 1.25, device: "wasm" },
      expect.any(Object),
    );
  });

  it("does not start when stopped or toggled off while preparing", async () => {
    const first = run("msg_1", "Hello.");
    const toggle = run("msg_1", "Hello.");
    settingsRequests[0]!.resolve();
    await Promise.all([first, toggle]);
    expect(speak).not.toHaveBeenCalled();
  });

  it("plays only the most recently clicked message", async () => {
    const a = run("msg_a", "First.");
    const b = run("msg_b", "Second.");
    settingsRequests[1]!.resolve();
    settingsRequests[0]!.resolve();
    await Promise.all([a, b]);
    expect(speak).toHaveBeenCalledTimes(1);
    expect(speak.mock.calls[0]![0]).toBe("msg_b");
  });

  it("switches to a different selection in the same message", async () => {
    const first = run("msg_1", "One. Two.", "One.");
    settingsRequests[0]!.resolve();
    await first;
    const second = run("msg_1", "One. Two.", "Two.");
    settingsRequests[1]!.resolve();
    await second;
    expect(speak.mock.calls.map((call) => call[1].chunks)).toEqual([["One."], ["Two."]]);
  });
});
