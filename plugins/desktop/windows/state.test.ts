import { describe, expect, it } from "vitest";
import { parseSpec, windowId } from "./specs";
import { parseWindows, serializeWindows, windowReducer } from "./state";

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
