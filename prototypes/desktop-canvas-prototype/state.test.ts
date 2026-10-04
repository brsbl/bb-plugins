import { describe, expect, it } from "vitest";
import { fitCamera, folderFor, initialLayout, readLayout, zoomAt } from "./state";

describe("persisted canvas state", () => {
  it("recovers corrupt, future, and unbounded camera data without trapping the canvas offscreen", () => {
    for (const raw of ["{", JSON.stringify({ ...initialLayout(), version: 2 }), JSON.stringify({ ...initialLayout(), camera: { x: 0, y: 0, zoom: 0 } })]) {
      expect(readLayout(raw)).toEqual(initialLayout());
    }
  });
  it("round trips folders, membership, windows and prompt presentation independently of thread metadata", () => {
    const state = initialLayout();
    state.folders = [{ id: "folder:one", name: "Ideas" }];
    state.membership = { thread: "folder:one" };
    state.windows = [{ id: "thread", x: 210, y: -80, minimized: true }];
    state.composer = "hidden";
    const loaded = readLayout(JSON.stringify(state));
    expect(loaded).toEqual(state);
    const thread = Object.freeze({ id: "thread", projectId: "real-project" });
    expect(folderFor(thread, loaded)).toBe("folder:one");
    loaded.folders = [];
    expect(folderFor(thread, loaded)).toBe("project:real-project");
  });
  it("adds folder windows without resetting layouts saved before window kinds existed", () => {
    const legacy = { ...initialLayout(), windows: [{ id: "thr_existing", x: 210, y: -80, minimized: true }] };
    const loaded = readLayout(JSON.stringify(legacy));
    expect(loaded).toEqual(legacy);
    loaded.windows.push({ id: "project:real-project", kind: "folder", x: 100, y: 120, minimized: false });
    expect(readLayout(JSON.stringify(loaded))).toEqual(loaded);
  });
  it("keeps the point under the pointer fixed while zooming, including the zoom limit", () => {
    const camera = { x: 80, y: -50, zoom: 0.75 };
    const anchor = { x: 520, y: 300 };
    const next = zoomAt(camera, 9, anchor);
    expect((anchor.x - next.x) / next.zoom).toBeCloseTo((anchor.x - camera.x) / camera.zoom);
    expect((anchor.y - next.y) / next.zoom).toBeCloseTo((anchor.y - camera.y) / camera.zoom);
    expect(next.zoom).toBe(1.5);
  });
  it("fits negative world positions inside the visible area with space for the dock", () => {
    const camera = fitCamera([{ x: -300, y: -200, width: 1200, height: 700 }], 1100, 800);
    expect(-300 * camera.zoom + camera.x).toBeGreaterThanOrEqual(48);
    expect(900 * camera.zoom + camera.x).toBeLessThanOrEqual(1052);
    expect(500 * camera.zoom + camera.y).toBeLessThanOrEqual(720);
  });
});
