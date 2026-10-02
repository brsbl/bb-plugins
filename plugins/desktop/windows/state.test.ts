import { describe, expect, it } from "vitest";
import type { Rect } from "../core";
import { parseSpec, windowId, type WindowSpec } from "./specs";
import { dockedRect, parseWindows, placeWindows, serializeWindows, windowReducer, type WindowState } from "./state";

const area = { x: 0, y: 48, width: 1440, height: 766 };

/** Windows as a shipped release stored them in `bb-desktop:windows:v1`. */
const STORED_V1 = JSON.stringify([
  { spec: { kind: "threads" }, rect: { x: 120, y: 90, width: 460, height: 560 }, z: 3, minimized: false, restoreRect: null },
  { spec: { kind: "finder", key: "section:sec_1" }, rect: { x: 200, y: 120, width: 560, height: 400 }, z: 4, minimized: true, restoreRect: null },
  { spec: { kind: "thread", threadId: "thr_a" }, rect: area, z: 7, minimized: false, restoreRect: { x: 300, y: 100, width: 620, height: 640 } },
  { spec: { kind: "panel", threadId: "thr_a" }, rect: { x: 930, y: 100, width: 320, height: 560 }, z: 5, minimized: false, restoreRect: null },
  { spec: { kind: "buddy-list", threadId: "thr_a" }, rect: { x: 10, y: 100, width: 280, height: 560 }, z: 6, minimized: false, restoreRect: null },
  { spec: { kind: "thread-tab", threadId: "thr_a", tab: "terminal", tabId: "tab_1" }, rect: { x: 40, y: 60, width: 680, height: 420 }, z: 8, minimized: false, restoreRect: null },
  { spec: { kind: "app", key: "ambient:mixer" }, rect: { x: 40, y: 60, width: 520, height: 420 }, z: 9, minimized: false, restoreRect: null },
  { spec: { kind: "solitaire" }, rect: { x: 60, y: 70, width: 720, height: 540 }, z: 2, minimized: false, restoreRect: null },
  { spec: { kind: "new-thread", groupKey: null }, rect: { x: 60, y: 70, width: 720, height: 420 }, z: 10, minimized: false, restoreRect: null },
  { spec: { kind: "retired-kind" }, rect: { x: 0, y: 0, width: 10, height: 10 }, z: 11, minimized: false, restoreRect: null },
]);

describe("stored windows (v1)", () => {
  it("restores every persisted kind with its v1 id", () => {
    const { windows, nextZ } = parseWindows(STORED_V1, area);
    expect(windows.map((window) => window.id)).toEqual([
      "threads",
      "finder:section:sec_1",
      "thread:thr_a",
      "panel:thr_a",
      "buddy-list:thr_a",
      "thread-tab:tab_1",
      "app:ambient:mixer",
      "solitaire",
    ]);
    expect(nextZ).toBe(10);
    expect(windows[1]!.minimized).toBe(true);
    expect(windows.every((window) => !window.openedThisSession)).toBe(true);
  });

  it("keeps a maximized window filling the work area with its restore rect", () => {
    const thread = parseWindows(STORED_V1, area).windows.find((window) => window.id === "thread:thr_a")!;
    expect(thread.rect).toEqual(area);
    expect(thread.restoreRect).toEqual({ x: 300, y: 100, width: 620, height: 640 });
  });

  it("loads stored rects as they were left, even ones the measured work area would clip", () => {
    const stored = JSON.parse(STORED_V1) as { spec: unknown; rect: unknown; restoreRect: unknown }[];
    // Before the taskbar is measured the work area is shorter than the real one, and narrower windows are possible too.
    const { windows } = parseWindows(STORED_V1, { x: 0, y: 48, width: 400, height: 300 });
    expect(windows.find((window) => window.id === "threads")!.rect).toEqual(stored[0]!.rect);
    expect(windows.find((window) => window.id === "thread:thr_a")!.restoreRect).toEqual(stored[2]!.restoreRect);
    expect(JSON.parse(serializeWindows(windows)).map((entry: { rect: unknown }) => entry.rect)).toEqual(
      stored.slice(0, 8).map((entry, index) => (index === 2 ? { x: 0, y: 48, width: 400, height: 300 } : entry.rect)),
    );
  });

  it("round-trips through the stored format", () => {
    const { windows } = parseWindows(STORED_V1, area);
    const again = parseWindows(serializeWindows(windows), area).windows;
    expect(again).toEqual(windows);
  });

  it("never stores form windows", () => {
    expect(parseSpec({ kind: "new-folder" })).toBeNull();
    expect(parseSpec({ kind: "new-thread", groupKey: null })).toBeNull();
    const opened = windowReducer({ windows: [], nextZ: 1 }, { type: "open", spec: { kind: "new-folder" }, rect: area });
    expect(JSON.parse(serializeWindows(opened.windows))).toEqual([]);
  });

  it("ignores corrupt storage", () => {
    expect(parseWindows("{", area)).toEqual({ windows: [], nextZ: 1 });
    expect(parseWindows(JSON.stringify({ spec: { kind: "threads" } }), area)).toEqual({ windows: [], nextZ: 1 });
  });

  it("keeps window ids stable", () => {
    expect(windowId({ kind: "new-thread", groupKey: null })).toBe("new-thread:desktop");
    expect(windowId({ kind: "new-thread", groupKey: "folder:f1" })).toBe("new-thread:folder:f1");
    expect(windowId({ kind: "media-player" })).toBe("media-player");
  });
});

describe("work area changes", () => {
  const small = { x: 0, y: 48, width: 600, height: 400 };
  const loaded = parseWindows(STORED_V1, area);

  it("keeps stored rects through a shrink and back, and only maximized windows track the area", () => {
    const shrunk = windowReducer(loaded, { type: "fit-maximized", viewport: small });
    expect(shrunk.windows.find((window) => window.id === "thread:thr_a")!.rect).toEqual(small);
    const restored = windowReducer(shrunk, { type: "fit-maximized", viewport: area });
    expect(restored.windows).toEqual(loaded.windows);
    expect(serializeWindows(restored.windows)).toBe(serializeWindows(loaded.windows));
  });

  it("fits windows only where they are shown", () => {
    const shown = placeWindows(windowReducer(loaded, { type: "fit-maximized", viewport: small }).windows, small);
    for (const window of shown) {
      expect(window.rect.x + window.rect.width).toBeLessThanOrEqual(small.x + small.width);
      expect(window.rect.y + window.rect.height).toBeLessThanOrEqual(small.y + small.height);
    }
    expect(shown.find((window) => window.id === "threads")!.rect).toEqual({ x: 120, y: 48, width: 460, height: 400 });
    expect(placeWindows(loaded.windows, area).find((window) => window.id === "threads")).toBe(loaded.windows[0]);
  });

  it("restores a maximized window to its own rect, not one fitted to a smaller area", () => {
    const shrunk = windowReducer(loaded, { type: "fit-maximized", viewport: small });
    const restored = windowReducer(shrunk, { type: "maximize", id: "thread:thr_a", viewport: small });
    expect(restored.windows.find((window) => window.id === "thread:thr_a")).toMatchObject({
      rect: { x: 300, y: 100, width: 620, height: 640 },
      restoreRect: null,
    });
    const remaximized = windowReducer(restored, { type: "maximize", id: "thread:thr_a", viewport: area });
    expect(remaximized.windows.find((window) => window.id === "thread:thr_a")).toMatchObject({
      rect: area,
      restoreRect: { x: 300, y: 100, width: 620, height: 640 },
    });
  });
});

describe("navigating a window", () => {
  const rect = { x: 100, y: 100, width: 560, height: 400 };
  const opened = windowReducer({ windows: [], nextZ: 1 }, { type: "open", spec: { kind: "more" }, rect });

  it("shows a folder in the same window, then goes back and forward", () => {
    const inFolder = windowReducer(opened, { type: "navigate", id: "more", spec: { kind: "finder", key: "section:s1" } });
    expect(inFolder.windows.map((window) => [window.id, window.rect])).toEqual([["finder:section:s1", rect]]);
    const back = windowReducer(inFolder, { type: "go", id: "finder:section:s1", direction: "back" });
    expect(back.windows.map((window) => window.id)).toEqual(["more"]);
    expect(back.windows[0]!.history).toEqual({ back: [], forward: [{ kind: "finder", key: "section:s1" }] });
    const forward = windowReducer(back, { type: "go", id: "more", direction: "forward" });
    expect(forward.windows.map((window) => window.id)).toEqual(["finder:section:s1"]);
    expect(windowReducer(forward, { type: "go", id: "finder:section:s1", direction: "forward" })).toBe(forward);
  });

  it("closes another window already showing the place it navigates to", () => {
    const both = windowReducer(opened, { type: "open", spec: { kind: "finder", key: "section:s1" }, rect });
    const navigated = windowReducer(both, { type: "navigate", id: "more", spec: { kind: "finder", key: "section:s1" } });
    expect(navigated.windows.map((window) => [window.id, window.rect])).toEqual([["finder:section:s1", rect]]);
  });

  it("does not store history", () => {
    const inFolder = windowReducer(opened, { type: "navigate", id: "more", spec: { kind: "finder", key: "section:s1" } });
    expect(serializeWindows(inFolder.windows)).not.toContain("history");
  });
});

describe("windows docked to a thread", () => {
  const thread = { x: 300, y: 100, width: 600, height: 500 };
  const open = (state: WindowState, spec: WindowSpec, rect: Rect) => windowReducer(state, { type: "open", spec, rect });
  let docked: WindowState = { windows: [], nextZ: 1 };
  docked = open(docked, { kind: "thread", threadId: "thr_a" }, thread);
  docked = open(docked, { kind: "buddy-list", threadId: "thr_a" }, { x: 12, y: 100, width: 280, height: 500 });
  docked = open(docked, { kind: "panel", threadId: "thr_a" }, { x: 908, y: 100, width: 320, height: 500 });
  docked = open(docked, { kind: "thread-tab", threadId: "thr_a", tab: "terminal", tabId: "t1" }, { x: 40, y: 60, width: 400, height: 300 });
  docked = open(docked, { kind: "panel", threadId: "thr_b" }, { x: 908, y: 100, width: 320, height: 500 });
  const rectOf = (state: WindowState, id: string) => state.windows.find((window) => window.id === id)!.rect;

  it("docks a window against its side of the thread as the thread moves or resizes", () => {
    const list = rectOf(docked, "buddy-list:thr_a");
    const info = rectOf(docked, "panel:thr_a");
    expect(dockedRect(list, thread, { ...thread, x: 340, y: 140 })).toEqual({ x: 52, y: 140, width: 280, height: 500 });
    expect(dockedRect(info, thread, { x: 250, y: 100, width: 700, height: 560 })).toEqual({ x: 958, y: 100, width: 320, height: 560 });
  });

  it("stores exactly the docked rects the drag showed, and leaves every other window alone", () => {
    const shown = { "buddy-list:thr_a": { x: 0, y: 140, width: 280, height: 500 }, "panel:thr_a": { x: 948, y: 140, width: 320, height: 500 } };
    const moved = windowReducer(docked, { type: "move", id: "thread:thr_a", rect: { ...thread, x: 340, y: 140 }, attached: shown });
    expect(rectOf(moved, "buddy-list:thr_a")).toEqual(shown["buddy-list:thr_a"]);
    expect(rectOf(moved, "panel:thr_a")).toEqual(shown["panel:thr_a"]);
    expect(rectOf(moved, "thread-tab:t1")).toEqual(rectOf(docked, "thread-tab:t1"));
    expect(rectOf(moved, "panel:thr_b")).toEqual(rectOf(docked, "panel:thr_b"));
  });

  it("leaves docked windows in place when the thread moves without a drag, such as a composer nudge", () => {
    const nudged = windowReducer(docked, { type: "move", id: "thread:thr_a", rect: { ...thread, x: 360 } });
    expect(rectOf(nudged, "buddy-list:thr_a")).toEqual(rectOf(docked, "buddy-list:thr_a"));
    expect(rectOf(nudged, "panel:thr_a")).toEqual(rectOf(docked, "panel:thr_a"));
  });

  it("minimizes and restores them together, raising the thread above them", () => {
    const minimized = windowReducer(docked, { type: "minimize", id: "thread:thr_a", minimized: true });
    expect(minimized.windows.filter((window) => window.minimized).map((window) => window.id)).toEqual([
      "thread:thr_a",
      "buddy-list:thr_a",
      "panel:thr_a",
    ]);
    const restored = windowReducer(minimized, { type: "focus", id: "thread:thr_a" });
    expect(restored.windows.some((window) => window.minimized)).toBe(false);
    const z = (id: string) => restored.windows.find((window) => window.id === id)!.z;
    expect(z("thread:thr_a")).toBe(Math.max(...restored.windows.map((window) => window.z)));
    expect(z("panel:thr_a")).toBeGreaterThan(z("panel:thr_b"));
  });
});
