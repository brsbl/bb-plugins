import { describe, expect, it } from "vitest";
import { defaultRect, parseWindows, serializeWindows, windowReducer, type WindowState } from "./window-state";

const rect = { x: 0, y: 0, width: 600, height: 400 };
const empty: WindowState = { windows: [], nextZ: 1 };

describe("window state", () => {
  it("keeps one window per place and raises it when opened again", () => {
    let state = windowReducer(empty, { type: "open", spec: { kind: "thread", threadId: "thr_a" }, rect });
    state = windowReducer(state, { type: "open", spec: { kind: "threads" }, rect });
    state = windowReducer(state, { type: "minimize", id: "thread:thr_a", minimized: true });
    state = windowReducer(state, { type: "open", spec: { kind: "thread", threadId: "thr_a" }, rect: { ...rect, x: 999 } });
    expect(state.windows).toHaveLength(2);
    const thread = state.windows.find((window) => window.id === "thread:thr_a")!;
    expect(thread.minimized).toBe(false);
    expect(thread.rect.x).toBe(0);
    expect(thread.z).toBeGreaterThan(state.windows.find((window) => window.id === "threads")!.z);
  });

  it("navigates a Finder window through places with Back and Forward", () => {
    let state = windowReducer(empty, { type: "open", spec: { kind: "more" }, rect });
    state = windowReducer(state, { type: "navigate", id: "more", spec: { kind: "finder", key: "section:a" } });
    expect(state.windows[0]!.id).toBe("finder:section:a");
    state = windowReducer(state, { type: "go", id: "finder:section:a", direction: "back" });
    expect(state.windows[0]!.id).toBe("more");
    state = windowReducer(state, { type: "go", id: "more", direction: "forward" });
    expect(state.windows[0]!.id).toBe("finder:section:a");
  });

  it("moving a maximized window restores it at the moved rect", () => {
    let state = windowReducer(empty, { type: "open", spec: { kind: "threads" }, rect });
    state = windowReducer(state, { type: "maximize", id: "threads", maximized: true });
    state = windowReducer(state, { type: "move", id: "threads", rect: { ...rect, x: 50 } });
    expect(state.windows[0]).toMatchObject({ maximized: false, rect: { x: 50 } });
  });

  it("persists windows but never the New folder or New thread forms", () => {
    let state = windowReducer(empty, { type: "open", spec: { kind: "thread", threadId: "thr_a" }, rect });
    state = windowReducer(state, { type: "open", spec: { kind: "new-folder", at: null }, rect });
    state = windowReducer(state, { type: "open", spec: { kind: "new-thread", groupKey: "section:none" }, rect });
    state = windowReducer(state, { type: "maximize", id: "thread:thr_a", maximized: true });
    const restored = parseWindows(serializeWindows(state.windows));
    expect(restored.windows.map((window) => window.id)).toEqual(["thread:thr_a"]);
    expect(restored.windows[0]!.maximized).toBe(true);
    expect(parseWindows("not json")).toEqual(empty);
  });

  it("opens new windows centered in the current view, in canvas coordinates", () => {
    const placed = defaultRect({ kind: "threads" }, 0, { x: -500, y: 0, zoom: 0.5 }, { x: 0, y: 0, width: 1000, height: 800 });
    expect(placed.x + placed.width / 2).toBe(2000);
    expect(placed.y + placed.height / 2).toBe(800);
  });
});
