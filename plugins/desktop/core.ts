export type Lifecycle = "active" | "archived" | "all";
export type Organize = "section" | "project" | "machine";
export type SortKey = "updated" | "created" | "alpha";
export type SortDirection = "ascending" | "descending";
export type SortPreference = "sidebar" | SortKey;
export type OrganizePreference = "sidebar" | Organize;
export type LifecyclePreference = "sidebar" | Lifecycle;

export interface Preferences {
  sort: SortPreference;
  organize: OrganizePreference;
  lifecycle: LifecyclePreference;
  quickLaunch: string[];
}

export const DEFAULT_QUICK_LAUNCH = ["show-desktop", "new-thread", "threads"] as const;

export interface Folder {
  id: string;
  name: string;
  hideFromSidebar: boolean;
  threadIds: string[];
  createdAt: number;
}

export interface NamedEntity {
  id: string;
  name: string;
}

export interface DesktopThread {
  id: string;
  title: string;
  projectId: string;
  sectionId: string | null;
  hostId: string | null;
  providerId: string;
  status: "active" | "error" | "idle" | "pending" | "starting" | "stopping";
  isArchived: boolean;
  isHidden: boolean;
  isUnread: boolean;
  needsInput: boolean;
  createdAt: number;
  updatedAt: number;
}

export type DesktopGroup =
  | { key: string; kind: "folder"; name: string; folder: Folder }
  | { key: string; kind: "section" | "project" | "machine"; name: string; id: string | null };

export interface Point {
  x: number;
  y: number;
}

export interface Rect extends Point {
  width: number;
  height: number;
}

export const ICON_CELL = { width: 96, height: 92 } as const;
export const ICON_MARGIN = 16;

export function threadMatchesLifecycle(
  thread: DesktopThread,
  lifecycle: Lifecycle,
): boolean {
  if (lifecycle === "all") return true;
  return lifecycle === "archived" ? thread.isArchived : !thread.isArchived;
}

export function filterLifecycle(
  threads: readonly DesktopThread[],
  lifecycle: Lifecycle,
): DesktopThread[] {
  return threads.filter((thread) => threadMatchesLifecycle(thread, lifecycle));
}

export function groupThreads(
  group: DesktopGroup,
  threads: readonly DesktopThread[],
): DesktopThread[] {
  switch (group.kind) {
    case "folder": {
      const byId = new Map(threads.map((thread) => [thread.id, thread]));
      return group.folder.threadIds.flatMap((id) => {
        const thread = byId.get(id);
        return thread === undefined ? [] : [thread];
      });
    }
    case "section":
      return threads.filter((thread) => thread.sectionId === group.id);
    case "project":
      return threads.filter((thread) => thread.projectId === group.id);
    case "machine":
      return threads.filter((thread) => thread.hostId === group.id);
  }
}

export function buildGroups(args: {
  organize: Organize;
  sections: readonly NamedEntity[];
  projects: readonly NamedEntity[];
  machines: readonly NamedEntity[];
  folders: readonly Folder[];
  threads: readonly DesktopThread[];
}): DesktopGroup[] {
  const present = (ids: Iterable<string | null>) => new Set(ids);
  let organized: DesktopGroup[];
  if (args.organize === "section") {
    organized = [
      ...args.sections.map((section) => ({
        key: `section:${section.id}`,
        kind: "section" as const,
        name: section.name,
        id: section.id,
      })),
      { key: "section:none", kind: "section", name: "Threads", id: null },
    ];
  } else if (args.organize === "project") {
    const used = present(args.threads.map((thread) => thread.projectId));
    organized = args.projects
      .filter((project) => used.has(project.id))
      .map((project) => ({
        key: `project:${project.id}`,
        kind: "project" as const,
        name: project.name,
        id: project.id,
      }));
  } else {
    const used = present(args.threads.map((thread) => thread.hostId));
    organized = [
      ...args.machines
        .filter((machine) => used.has(machine.id))
        .map((machine) => ({
          key: `machine:${machine.id}`,
          kind: "machine" as const,
          name: machine.name,
          id: machine.id,
        })),
      ...(used.has(null)
        ? [{ key: "machine:none", kind: "machine" as const, name: "No machine", id: null }]
        : []),
    ];
  }
  return [
    ...organized,
    ...args.folders.map((folder) => ({
      key: `folder:${folder.id}`,
      kind: "folder" as const,
      name: folder.name,
      folder,
    })),
  ];
}

export function acceptsDrop(group: DesktopGroup): boolean {
  return group.kind === "folder" || group.kind === "section";
}

export function naturalDirection(key: SortKey): SortDirection {
  return key === "alpha" ? "ascending" : "descending";
}

export function sortThreads(
  threads: readonly DesktopThread[],
  key: SortKey,
  direction: SortDirection = naturalDirection(key),
): DesktopThread[] {
  const sign = direction === "ascending" ? 1 : -1;
  return [...threads].sort((left, right) => {
    if (key === "alpha") {
      const byTitle = left.title.localeCompare(right.title, undefined, {
        sensitivity: "base",
        numeric: true,
      });
      return sign * (byTitle !== 0 ? byTitle : left.id.localeCompare(right.id));
    }
    if (key === "updated") {
      const leftActive = left.status === "active";
      if (leftActive !== (right.status === "active")) return leftActive ? -1 : 1;
    }
    const field = key === "created" ? "createdAt" : "updatedAt";
    const delta = left[field] - right[field];
    return sign * (delta !== 0 ? delta : left.id.localeCompare(right.id));
  });
}

export function resolveSidebarPreferences(preferences: unknown): {
  sort: { key: SortKey; direction: SortDirection };
  organize: Organize;
  lifecycle: Lifecycle;
  hiddenGroupKeys: string[];
} {
  const record =
    typeof preferences === "object" && preferences !== null
      ? (preferences as Record<string, unknown>)
      : {};
  const rawSort = record.chronologicalSort;
  const key: SortKey =
    rawSort === "created" || rawSort === "alpha" ? rawSort : "updated";
  const rawDirection = record.sortDirection;
  const direction: SortDirection =
    rawDirection === "ascending" || rawDirection === "descending"
      ? rawDirection
      : naturalDirection(key);
  const organize: Organize =
    record.organizationMode === "project"
      ? "project"
      : record.organizationMode === "machine"
        ? "machine"
        : "section";
  const lifecycles = Array.isArray(record.threadLifecycles) ? record.threadLifecycles : [];
  const lifecycle: Lifecycle =
    lifecycles.includes("active") && lifecycles.includes("archived")
      ? "all"
      : lifecycles.includes("archived")
        ? "archived"
        : "active";
  const hiddenGroupKeys = (Array.isArray(record.hiddenGroups) ? record.hiddenGroups : []).flatMap(
    (group: unknown) =>
      group === "threads" ? ["section:none"] : typeof group === "string" && group.includes(":") ? [group] : [],
  );
  return { sort: { key, direction }, organize, lifecycle, hiddenGroupKeys };
}

export function gridPositions(count: number, canvasWidth: number): Point[] {
  const columns = Math.max(
    1,
    Math.floor((canvasWidth - ICON_MARGIN * 2) / ICON_CELL.width),
  );
  return Array.from({ length: count }, (_, index) => ({
    x: ICON_MARGIN + (index % columns) * ICON_CELL.width,
    y: ICON_MARGIN + Math.floor(index / columns) * ICON_CELL.height,
  }));
}

export function nextFreePosition(
  taken: readonly Point[],
  canvasWidth: number,
): Point {
  const candidates = gridPositions(taken.length * 4 + 1, canvasWidth);
  const free = candidates.find((candidate) =>
    taken.every(
      (point) =>
        Math.abs(point.x - candidate.x) >= ICON_CELL.width ||
        Math.abs(point.y - candidate.y) >= ICON_CELL.height,
    ),
  );
  return free ?? candidates.at(-1)!;
}

export function snapToGrid(point: Point): Point {
  return {
    x: Math.max(
      ICON_MARGIN,
      ICON_MARGIN +
        Math.round((point.x - ICON_MARGIN) / ICON_CELL.width) * ICON_CELL.width,
    ),
    y: Math.max(
      ICON_MARGIN,
      ICON_MARGIN +
        Math.round((point.y - ICON_MARGIN) / ICON_CELL.height) *
          ICON_CELL.height,
    ),
  };
}

export const MIN_WINDOW = { width: 280, height: 180 } as const;

export function clampRect(
  rect: Rect,
  area: { x?: number; y?: number; width: number; height: number },
): Rect {
  const top = area.y ?? 0;
  const width = Math.min(Math.max(rect.width, MIN_WINDOW.width), area.width);
  const height = Math.min(Math.max(rect.height, MIN_WINDOW.height), area.height);
  return {
    width,
    height,
    x: Math.min(Math.max(rect.x, 40 - width), area.width - 40),
    y: Math.min(Math.max(rect.y, top), top + area.height - 32),
  };
}

export type ResizeEdge = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

export function resizeRect(start: Rect, edge: ResizeEdge, delta: Point): Rect {
  let { x, y, width, height } = start;
  if (edge.includes("e")) width = Math.max(MIN_WINDOW.width, start.width + delta.x);
  if (edge.includes("s")) height = Math.max(MIN_WINDOW.height, start.height + delta.y);
  if (edge.includes("w")) {
    width = Math.max(MIN_WINDOW.width, start.width - delta.x);
    x = start.x + start.width - width;
  }
  if (edge.includes("n")) {
    height = Math.max(MIN_WINDOW.height, start.height - delta.y);
    y = start.y + start.height - height;
  }
  return { x, y, width, height };
}

export function tileRects(
  count: number,
  area: Rect,
  gap = 8,
): Rect[] {
  if (count === 0) return [];
  const columns = Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / columns);
  const width = Math.floor((area.width - gap * (columns + 1)) / columns);
  const height = Math.floor((area.height - gap * (rows + 1)) / rows);
  return Array.from({ length: count }, (_, index) => ({
    x: area.x + gap + (index % columns) * (width + gap),
    y: area.y + gap + Math.floor(index / columns) * (height + gap),
    width,
    height,
  }));
}

export interface NeedsInputTracker {
  known: ReadonlySet<string> | null;
  queue: readonly string[];
}

export function trackNeedsInput(
  tracker: NeedsInputTracker,
  pendingIds: readonly string[],
): NeedsInputTracker & { arrived: boolean } {
  const pending = new Set(pendingIds);
  if (tracker.known === null) return { known: pending, queue: [], arrived: false };
  const previous = tracker.known;
  const kept = tracker.queue.filter((id) => pending.has(id));
  const arrived = pendingIds.filter((id) => !previous.has(id) && !kept.includes(id));
  return { known: pending, queue: [...kept, ...arrived], arrived: arrived.length > 0 };
}

export function clearanceShift(
  rect: Rect,
  obstacle: Rect,
  viewport: { width: number; height: number },
  gap = 12,
): Point | null {
  const overlaps =
    rect.x < obstacle.x + obstacle.width + gap &&
    rect.x + rect.width > obstacle.x - gap &&
    rect.y < obstacle.y + obstacle.height + gap &&
    rect.y + rect.height > obstacle.y - gap;
  if (!overlaps) return null;
  const candidates: Point[] = [
    { x: 0, y: obstacle.y + obstacle.height + gap - rect.y },
    { x: 0, y: obstacle.y - gap - (rect.y + rect.height) },
    { x: obstacle.x - gap - (rect.x + rect.width), y: 0 },
    { x: obstacle.x + obstacle.width + gap - rect.x, y: 0 },
  ].sort((left, right) => Math.hypot(left.x, left.y) - Math.hypot(right.x, right.y));
  const fits = (shift: Point) =>
    rect.x + shift.x >= 0 &&
    rect.y + shift.y >= 0 &&
    rect.x + shift.x + rect.width <= viewport.width &&
    rect.y + shift.y + rect.height <= viewport.height;
  const reachable = (shift: Point) =>
    rect.y + shift.y >= 0 &&
    rect.y + shift.y + 40 <= viewport.height &&
    rect.x + shift.x + rect.width >= 80 &&
    rect.x + shift.x <= viewport.width - 80;
  return candidates.find(fits) ?? candidates.find(reachable) ?? null;
}
