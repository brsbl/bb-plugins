import { describe, expect, it } from "vitest";
import {
  buildGroups,
  fitCamera,
  gridPositions,
  groupMembers,
  nextFreePosition,
  resizeRect,
  revealCamera,
  tileRects,
  toScreen,
  toWorld,
  zoomAt,
  type DesktopThread,
} from "./core";

const thread = (id: string, patch: Partial<DesktopThread> = {}): DesktopThread => ({
  id,
  title: id,
  projectId: "proj_a",
  sectionId: null,
  hostId: "host_a",
  providerId: "codex",
  status: "idle",
  isArchived: false,
  isPinned: false,
  isUnread: false,
  needsInput: false,
  createdAt: 1,
  updatedAt: 1,
  ...patch,
});

describe("groups", () => {
  it("files threads into sections, the loose Threads bucket, Pinned and desktop folders", () => {
    const threads = [thread("a", { sectionId: "sec_1" }), thread("b"), thread("c", { isPinned: true, sectionId: "sec_1" })];
    const groups = buildGroups({
      organize: "section",
      sections: [{ id: "sec_1", name: "Inbox" }],
      projects: [],
      machines: [],
      folders: [{ id: "fld_1", name: "Next up", threadIds: ["b", "missing"], createdAt: 1 }],
      threads,
    });
    expect(groups.map((group) => group.key)).toEqual(["pinned", "section:sec_1", "section:none", "folder:fld_1"]);
    const members = groupMembers(groups, threads);
    expect(members.get("pinned")?.map((t) => t.id)).toEqual(["c"]);
    expect(members.get("section:sec_1")?.map((t) => t.id)).toEqual(["a"]);
    expect(members.get("section:none")?.map((t) => t.id)).toEqual(["b"]);
    expect(members.get("folder:fld_1")?.map((t) => t.id)).toEqual(["b"]);
  });

  it("shows only projects and machines that have threads", () => {
    const threads = [thread("a", { hostId: null })];
    const byProject = buildGroups({ organize: "project", sections: [], projects: [{ id: "proj_a", name: "A" }, { id: "proj_b", name: "B" }], machines: [], folders: [], threads });
    expect(byProject.map((group) => group.key)).toEqual(["project:proj_a"]);
    const byMachine = buildGroups({ organize: "machine", sections: [], projects: [], machines: [{ id: "host_a", name: "Air" }], folders: [], threads });
    expect(byMachine.map((group) => group.key)).toEqual(["machine:none"]);
    expect(groupMembers(byMachine, threads).get("machine:none")?.map((t) => t.id)).toEqual(["a"]);
  });
});

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
