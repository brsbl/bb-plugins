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
  isPinned: boolean;
  isHidden: boolean;
  isUnread: boolean;
  needsInput: boolean;
  createdAt: number;
  updatedAt: number;
}

export type DesktopGroup =
  | { key: string; kind: "folder"; name: string; folder: Folder }
  | { key: string; kind: "section" | "project" | "machine"; name: string; id: string | null }
  /** The sidebar's Pinned group. Like the sidebar, pinned threads show only here, not in their section or project. */
  | { key: string; kind: "pinned"; name: string };

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

/** The fields of a sidebar thread the desktop takes live, ahead of its own snapshot. */
export interface LiveThreadState {
  title: string | null;
  titleFallback: string | null;
  sectionId: string | null;
  status: DesktopThread["status"];
  isUnread: boolean;
  hasPendingInteraction: boolean;
  isArchived: boolean;
  isPinned: boolean;
  updatedAt: number;
  host: { id: string } | null;
}

/**
 * Applies bb's live sidebar state to a snapshot thread, so moves (Thread Organizer filing into Inbox, say), pins,
 * archiving and reads show on the desktop as soon as the sidebar shows them, without waiting for a snapshot.
 */
export function withLiveState(thread: DesktopThread, live: LiveThreadState | undefined): DesktopThread {
  if (live === undefined) return thread;
  const merged: DesktopThread = {
    ...thread,
    title: live.title ?? live.titleFallback ?? thread.title,
    sectionId: live.sectionId,
    hostId: live.host?.id ?? thread.hostId,
    status: live.status,
    isUnread: live.isUnread,
    needsInput: live.hasPendingInteraction,
    isArchived: live.isArchived,
    isPinned: live.isPinned,
    updatedAt: Math.max(thread.updatedAt, live.updatedAt),
  };
  // Unchanged threads keep their identity, so a live update for one thread doesn't look like a change to all of them.
  return (Object.keys(merged) as (keyof DesktopThread)[]).every((key) => merged[key] === thread[key]) ? thread : merged;
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
    case "pinned":
      return threads.filter((thread) => thread.isPinned);
    case "section":
      return threads.filter((thread) => !thread.isPinned && thread.sectionId === group.id);
    case "project":
      return threads.filter((thread) => !thread.isPinned && thread.projectId === group.id);
    case "machine":
      return threads.filter((thread) => !thread.isPinned && thread.hostId === group.id);
  }
}

/** Every group's threads in one pass, for the same membership `groupThreads` gives one group at a time. */
export function groupMembers(
  groups: readonly DesktopGroup[],
  threads: readonly DesktopThread[],
): Map<string, DesktopThread[]> {
  const byId = new Map(threads.map((thread) => [thread.id, thread]));
  const buckets = new Map<string, DesktopThread[]>();
  const add = (key: string, thread: DesktopThread) => {
    const bucket = buckets.get(key);
    if (bucket === undefined) buckets.set(key, [thread]);
    else bucket.push(thread);
  };
  for (const thread of threads) {
    if (thread.isPinned) {
      add("pinned", thread);
      continue;
    }
    add(`section:${thread.sectionId}`, thread);
    add(`project:${thread.projectId}`, thread);
    add(`machine:${thread.hostId}`, thread);
  }
  const members = new Map<string, DesktopThread[]>();
  for (const group of groups) {
    if (group.kind === "folder") {
      members.set(
        group.key,
        group.folder.threadIds.flatMap((id) => {
          const thread = byId.get(id);
          return thread === undefined ? [] : [thread];
        }),
      );
    } else {
      members.set(group.key, buckets.get(group.kind === "pinned" ? "pinned" : `${group.kind}:${group.id}`) ?? []);
    }
  }
  return members;
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
  const pinned: DesktopGroup[] = args.threads.some((thread) => thread.isPinned)
    ? [{ key: "pinned", kind: "pinned", name: "Pinned" }]
    : [];
  return [
    ...pinned,
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

// One collator for every comparison: localeCompare with options builds a new one each call, about 20x slower.
const titleCollator = new Intl.Collator(undefined, { sensitivity: "base", numeric: true });

export function sortThreads(
  threads: readonly DesktopThread[],
  key: SortKey,
  direction: SortDirection = naturalDirection(key),
): DesktopThread[] {
  const sign = direction === "ascending" ? 1 : -1;
  return [...threads].sort((left, right) => {
    if (key === "alpha") {
      const byTitle = titleCollator.compare(left.title, right.title);
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

export const MIN_WINDOW = { width: 280, height: 180 } as const;

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

