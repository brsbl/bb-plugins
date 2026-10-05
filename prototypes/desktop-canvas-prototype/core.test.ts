import { describe, expect, it } from "vitest";
import { findFreeRect, fitCamera, folderSummary, trackNeedsInput, gridPositions, nextFreePosition, resizeRect, revealCamera, tileRects, toScreen, toWorld, zoomAt, type DesktopThread } from "./core";

describe("camera", () => {
  it("zooms around the anchor, so the point under the pointer stays put", () => {
    const camera = { x: 40, y: -20, zoom: 1 };
    const anchor = { x: 300, y: 200 };
    const before = toWorld(camera, anchor);
    const zoomed = zoomAt(camera, 1.6, anchor);
    expect(toScreen(zoomed, before).x).toBeCloseTo(anchor.x);
    expect(toScreen(zoomed, before).y).toBeCloseTo(anchor.y);
  });

  it("clamps zoom and fits content inside the work area without zooming past 100%", () => {
    expect(zoomAt({ x: 0, y: 0, zoom: 1 }, 50, { x: 0, y: 0 }).zoom).toBe(2);
    const area = { x: 0, y: 0, width: 1000, height: 700 };
    const fitted = fitCamera({ x: 0, y: 0, width: 200, height: 100 }, area);
    expect(fitted.zoom).toBe(1);
    const wide = fitCamera({ x: -2000, y: 0, width: 4000, height: 500 }, area);
    expect(wide.zoom).toBeLessThan(1);
    const left = toScreen(wide, { x: -2000, y: 0 });
    expect(left.x).toBeGreaterThanOrEqual(0);
  });

  it("reveals an offscreen or zoomed-out window at 100% and leaves a visible one alone", () => {
    const area = { x: 0, y: 0, width: 1200, height: 800 };
    const rect = { x: 3000, y: 2000, width: 600, height: 400 };
    const revealed = revealCamera({ x: 0, y: 0, zoom: 0.5 }, rect, area);
    expect(revealed.zoom).toBe(1);
    const screen = toScreen(revealed, rect);
    expect(screen.x).toBe(300);
    expect(screen.y).toBe(200);
    expect(revealCamera(revealed, rect, area)).toBe(revealed);
  });
});

describe("geometry", () => {
  it("resizes from the west and north edges without moving the opposite edges", () => {
    const start = { x: 100, y: 100, width: 500, height: 400 };
    const resized = resizeRect(start, "nw", { x: 50, y: -30 });
    expect(resized).toEqual({ x: 150, y: 70, width: 450, height: 430 });
    expect(resizeRect(start, "e", { x: -1000, y: 0 }).width).toBe(320);
  });

  it("tiles windows in a near-square grid inside the area", () => {
    const rects = tileRects(3, { x: 0, y: 0, width: 1000, height: 600 });
    expect(rects).toHaveLength(3);
    for (const rect of rects) {
      expect(rect.x + rect.width).toBeLessThanOrEqual(1000);
      expect(rect.y + rect.height).toBeLessThanOrEqual(600);
    }
  });

  it("places new icons in the first free grid slot", () => {
    const area = { x: 0, y: 0, width: 400, height: 1000 };
    const [first, second] = gridPositions(2, area);
    expect(nextFreePosition([first!], area)).toEqual(second);
  });
});

describe("status", () => {
  const thread = (patch: Partial<DesktopThread>): DesktopThread => ({
    id: "t", displayTitle: "t", projectId: "p", sectionId: null, providerId: "codex", status: "idle", hasPendingInteraction: false,
    isArchived: false, isPinned: false, isUnread: false, createdAt: 1, updatedAt: 1, ...patch,
  });

  it("summarizes a folder by who needs you first, then who is working, then unread", () => {
    expect(folderSummary("Inbox", [])).toBe("Inbox — empty");
    expect(folderSummary("Inbox", [thread({ hasPendingInteraction: true }), thread({ status: "active" })])).toBe("Inbox — 2 threads, 1 needs input");
    expect(folderSummary("Inbox", [thread({ status: "active" }), thread({ isUnread: true })])).toBe("Inbox — 2 threads, 1 running");
    expect(folderSummary("Inbox", [thread({ isUnread: true }), thread({})])).toBe("Inbox — 2 threads, 1 unread");
  });
});

describe("needs input", () => {
  it("queues threads that start waiting after the first look, and drops ones that stop", () => {
    let tracker = trackNeedsInput({ known: null, queue: [] }, ["a"]);
    expect(tracker.queue).toEqual([]);
    tracker = trackNeedsInput(tracker, ["a", "b"]);
    expect(tracker).toMatchObject({ queue: ["b"], arrived: true });
    tracker = trackNeedsInput(tracker, ["a"]);
    expect(tracker).toMatchObject({ queue: [], arrived: false });
  });
});

describe("placement beside a folder", () => {
  const desired = { x: 100, y: 0, width: 400, height: 300 };

  it("uses the desired spot when it is free", () => {
    expect(findFreeRect(desired, [{ x: 600, y: 600, width: 100, height: 100 }])).toEqual(desired);
  });

  it("takes the nearest free spot below or to the right when windows are already there", () => {
    const overlaps = (a: typeof desired, b: typeof desired) => a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
    const occupied = [desired];
    for (let count = 0; count < 3; count += 1) {
      const next = findFreeRect(desired, occupied);
      expect(occupied.some((other) => overlaps(next, other))).toBe(false);
      expect(next.x).toBeGreaterThanOrEqual(desired.x);
      expect(next.y).toBeGreaterThanOrEqual(desired.y);
      occupied.push(next);
    }
    expect(findFreeRect(desired, [desired])).toEqual({ ...desired, y: 316 });
  });
});
