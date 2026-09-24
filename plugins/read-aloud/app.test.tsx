// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  loadPluginApp,
  mountPluginContentScripts,
  type MountedPluginContentScripts,
} from "@get-bb/plugin-sdk/testing/app";
import { toast } from "sonner";

import type { FetchSpeech } from "./player";

const player = vi.hoisted(() => ({
  fetchSpeech: null as FetchSpeech | null,
  reading: null as string | null,
  speak: vi.fn(),
  stop: vi.fn(),
  setSpeed: vi.fn(),
}));

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
    constructor(fetchSpeech: FetchSpeech) {
      player.fetchSpeech = fetchSpeech;
    }
    isReading(key: string) {
      return player.reading === key;
    }
    speak(key: string, ...rest: unknown[]) {
      player.reading = key;
      player.speak(key, ...rest);
    }
    stop() {
      player.reading = null;
      player.stop();
    }
    setSpeed = player.setSpeed;
    unlock() {}
  },
}));

const app = await loadPluginApp(() => import("./app"));
const action = app.messageActions[0]!;
let mounted: MountedPluginContentScripts;

function run(messageId: string, text: string, selectedText?: string) {
  return action.run({
    threadId: "thr_1",
    message: { id: messageId, threadId: "thr_1", role: "assistant", text, sourceSeqEnd: 1 },
    selectedText,
    openPanel: () => false,
  } as Parameters<typeof action.run>[0]);
}

beforeEach(async () => {
  localStorage.clear();
  player.reading = null;
  mounted = await mountPluginContentScripts(app, { pluginId: "read-aloud-dev" });
});

afterEach(async () => {
  await mounted.lifecycle.dispose();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe("Read aloud action", () => {
  it("speaks cleaned chunks and fetches audio from the installed plugin id", async () => {
    run("msg_1", "## Done\n\nIt **works**.");
    expect(player.speak).toHaveBeenCalledWith("msg_1", ["Done.", "It works."], 1, expect.any(Object));

    const fetch = vi.fn(async () => new Response(new Blob(["wav"])));
    vi.stubGlobal("fetch", fetch);
    await player.fetchSpeech!("Done.", 1.5, new AbortController().signal);
    expect(fetch).toHaveBeenCalledWith(
      "/api/v1/plugins/read-aloud-dev/http/speak",
      expect.objectContaining({ method: "POST", body: JSON.stringify({ text: "Done.", speed: 1.5 }) }),
    );
  });

  it("stops when the same message is pressed again", () => {
    run("msg_1", "Hello.");
    run("msg_1", "Hello.");
    expect(player.speak).toHaveBeenCalledTimes(1);
    expect(player.reading).toBeNull();
  });

  it("switches to a different selection in the same message", () => {
    run("msg_1", "One. Two.", "One.");
    run("msg_1", "One. Two.", "Two.");
    expect(player.speak.mock.calls.map((call) => call[1])).toEqual([["One."], ["Two."]]);
  });

  it("cycles 1×, 1.5×, 2× from the toast and remembers the choice", () => {
    run("msg_1", "Hello.");
    const speedAction = () =>
      vi.mocked(toast).mock.lastCall![1]!.action as {
        label: string;
        onClick(event: { preventDefault(): void }): void;
      };
    expect(speedAction().label).toBe("1×");
    speedAction().onClick({ preventDefault() {} });
    expect(player.setSpeed).toHaveBeenLastCalledWith(1.5);
    expect(speedAction().label).toBe("1.5×");
    speedAction().onClick({ preventDefault() {} });
    speedAction().onClick({ preventDefault() {} });
    expect(player.setSpeed).toHaveBeenLastCalledWith(1);
    expect(localStorage.getItem("read-aloud:speed")).toBe("1");

    localStorage.setItem("read-aloud:speed", "2");
    run("msg_2", "Again.");
    expect(player.speak).toHaveBeenLastCalledWith("msg_2", ["Again."], 2, expect.any(Object));
  });
});
