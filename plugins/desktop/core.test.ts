import { describe, expect, it } from "vitest";

import {
  buildGroups,
  filterLifecycle,
  gridPositions,
  groupThreads,
  clearanceShift,
  nextFreePosition,
  trackNeedsInput,
  resizeRect,
  resolveSidebarPreferences,
  sortThreads,
  type DesktopThread,
  type Folder,
} from "./core";

function thread(id: string, overrides: Partial<DesktopThread> = {}): DesktopThread {
  return {
    id,
    title: id,
    projectId: "proj",
    sectionId: null,
    hostId: null,
    providerId: "codex",
    status: "idle",
    isArchived: false,
    isHidden: false,
    isUnread: false,
    needsInput: false,
    createdAt: 0,
    updatedAt: 0,
    ...overrides,
  };
}

function folder(overrides: Partial<Folder>): Folder {
  return {
    id: "fld",
    name: "Folder",
    hideFromSidebar: false,
    threadIds: [],
    createdAt: 0,
    ...overrides,
  };
}

describe("groups", () => {
  const threads = [
    thread("a", { sectionId: "sec_1", hostId: "host_1" }),
    thread("b", { isArchived: true, projectId: "other" }),
    thread("c"),
  ];

  it("mirrors sidebar sections plus the loose Threads bucket, then desktop folders", () => {
    const groups = buildGroups({
      organize: "section",
      sections: [{ id: "sec_1", name: "Review" }],
      projects: [],
      machines: [],
      folders: [folder({ threadIds: ["c", "missing", "a"] })],
      threads,
    });
    expect(groups.map((group) => group.key)).toEqual(["section:sec_1", "section:none", "folder:fld"]);
    expect(groupThreads(groups[1]!, threads).map((t) => t.id)).toEqual(["b", "c"]);
    expect(groupThreads(groups[2]!, threads).map((t) => t.id)).toEqual(["c", "a"]);
  });

  it("only shows projects and machines that have threads", () => {
    const byProject = buildGroups({
      organize: "project",
      sections: [],
      projects: [{ id: "proj", name: "bb" }, { id: "empty", name: "Empty" }],
      machines: [],
      folders: [],
      threads,
    });
    expect(byProject.map((group) => group.name)).toEqual(["bb"]);
    const byMachine = buildGroups({
      organize: "machine",
      sections: [],
      projects: [],
      machines: [{ id: "host_1", name: "Laptop" }],
      folders: [],
      threads,
    });
    expect(byMachine.map((group) => group.name)).toEqual(["Laptop", "No machine"]);
  });

  it("treats lifecycle as a filter, not a folder", () => {
    expect(filterLifecycle(threads, "archived").map((t) => t.id)).toEqual(["b"]);
    expect(filterLifecycle(threads, "active").map((t) => t.id)).toEqual(["a", "c"]);
  });
});

describe("sortThreads", () => {
  it("puts running threads first when sorting by update, like the sidebar", () => {
    const sorted = sortThreads(
      [
        thread("old-running", { status: "active", updatedAt: 1 }),
        thread("new", { updatedAt: 5 }),
        thread("mid", { updatedAt: 3 }),
      ],
      "updated",
    );
    expect(sorted.map((t) => t.id)).toEqual(["old-running", "new", "mid"]);
  });

  it("sorts alphabetically with numeric awareness and honors direction", () => {
    const threads = [thread("1", { title: "Task 10" }), thread("2", { title: "task 2" })];
    expect(sortThreads(threads, "alpha").map((t) => t.title)).toEqual(["task 2", "Task 10"]);
    expect(sortThreads(threads, "alpha", "descending").map((t) => t.title)).toEqual(["Task 10", "task 2"]);
  });
});

describe("resolveSidebarPreferences", () => {
  it("reads the thread-list preferences and falls back to its defaults", () => {
    expect(
      resolveSidebarPreferences({
        chronologicalSort: "alpha",
        sortDirection: "default",
        organizationMode: "project",
        threadLifecycles: ["active", "archived"],
        hiddenGroups: ["threads", "section:sec_1", "project:proj"],
      }),
    ).toEqual({
      sort: { key: "alpha", direction: "ascending" },
      organize: "project",
      lifecycle: "all",
      hiddenGroupKeys: ["section:none", "section:sec_1", "project:proj"],
    });
    expect(resolveSidebarPreferences(null)).toEqual({
      sort: { key: "updated", direction: "descending" },
      organize: "section",
      lifecycle: "active",
      hiddenGroupKeys: [],
    });
  });
});

describe("layout geometry", () => {
  it("wraps grid positions to the canvas width", () => {
    const positions = gridPositions(5, 16 * 2 + 96 * 3);
    expect(positions[2]).toEqual({ x: 16 + 192, y: 16 });
    expect(positions[3]).toEqual({ x: 16, y: 16 + 92 });
  });

  it("finds the first free grid cell", () => {
    expect(nextFreePosition([{ x: 16, y: 16 }], 800)).toEqual({ x: 112, y: 16 });
  });

  it("skips grid cells overlapped by icons dropped between cells", () => {
    expect(nextFreePosition([{ x: 104, y: 18 }], 800)).toEqual({ x: 208, y: 16 });
  });

  it("resizes from the west edge without letting the window shrink below the minimum", () => {
    const start = { x: 100, y: 100, width: 400, height: 300 };
    expect(resizeRect(start, "w", { x: 50, y: 0 })).toEqual({ x: 150, y: 100, width: 350, height: 300 });
    expect(resizeRect(start, "nw", { x: 1000, y: 1000 })).toEqual({ x: 220, y: 220, width: 280, height: 180 });
  });
});

describe("trackNeedsInput", () => {
  it("does not announce threads that already needed input when tracking starts", () => {
    const first = trackNeedsInput({ known: null, queue: [] }, ["a"]);
    expect(first).toMatchObject({ queue: [], arrived: false });
  });

  it("queues newly waiting threads in arrival order and drops answered ones", () => {
    let tracker = trackNeedsInput({ known: null, queue: [] }, []);
    tracker = trackNeedsInput(tracker, ["a"]);
    expect(tracker).toMatchObject({ queue: ["a"], arrived: true });
    tracker = trackNeedsInput(tracker, ["a", "b"]);
    expect(tracker).toMatchObject({ queue: ["a", "b"], arrived: true });
    tracker = trackNeedsInput(tracker, ["b"]);
    expect(tracker).toMatchObject({ queue: ["b"], arrived: false });
  });

  it("announces a dismissed thread again only after it stops and restarts waiting", () => {
    let tracker = trackNeedsInput(trackNeedsInput({ known: null, queue: [] }, []), ["a"]);
    tracker = { ...tracker, queue: [] };
    expect(trackNeedsInput(tracker, ["a"])).toMatchObject({ queue: [], arrived: false });
    tracker = trackNeedsInput(tracker, []);
    expect(trackNeedsInput(tracker, ["a"])).toMatchObject({ queue: ["a"], arrived: true });
  });
});

describe("clearanceShift", () => {
  const composer = { x: 300, y: 50, width: 600, height: 150 };
  const viewport = { width: 1200, height: 900 };

  it("leaves windows that do not overlap alone", () => {
    expect(clearanceShift({ x: 300, y: 400, width: 400, height: 300 }, composer, viewport)).toBeNull();
  });

  it("moves a window the shortest distance that clears the composer", () => {
    expect(clearanceShift({ x: 350, y: 150, width: 400, height: 300 }, composer, viewport)).toEqual({ x: 0, y: 62 });
    expect(clearanceShift({ x: 850, y: 60, width: 200, height: 700 }, composer, viewport)).toEqual({ x: 62, y: 0 });
  });

  it("prefers a shift that keeps the whole window on screen", () => {
    expect(clearanceShift({ x: 350, y: 100, width: 400, height: 600 }, composer, viewport)).toEqual({ x: 0, y: 112 });
    expect(clearanceShift({ x: 600, y: 80, width: 280, height: 800 }, composer, viewport)).toEqual({ x: 312, y: 0 });
  });

  it("lets a window hang off an edge when nothing fits, keeping its title bar reachable", () => {
    expect(clearanceShift({ x: 350, y: 100, width: 400, height: 780 }, composer, viewport)).toEqual({ x: 0, y: 112 });
  });
});
