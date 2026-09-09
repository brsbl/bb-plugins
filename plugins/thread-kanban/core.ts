// Dependency-free helpers shared by the server and the frontend bundle.

export const BOARD_CHANGED_CHANNEL = "board-changed";
export const UNSECTIONED_COLUMN_KEY = "__unsectioned";

export interface BoardSectionLike {
  id: string;
  name: string;
}

export interface BoardThreadLike {
  id: string;
  title: string;
  sectionId: string | null;
  status: "active" | "error" | "idle" | "starting" | "stopping";
  displayStatus: string;
  unread: boolean;
  pendingInteractions: number;
  pinned: boolean;
  updatedAt: number;
}

export interface BoardColumn<T extends BoardThreadLike> {
  key: string;
  sectionId: string | null;
  name: string;
  threads: T[];
}

/**
 * bb's sidebar keeps the user's manual section order in browser storage as
 * an array of row ids such as `"pinned"`, `"sections"`, `"section:<id>"`, and
 * `"threads"`. This is a host-internal key read here only; anything
 * unparseable yields `null` and the board keeps bb's list order.
 */
export const SIDEBAR_SECTION_ORDER_STORAGE_KEY = "bb.sidebar.manualSectionOrder";
export const SIDEBAR_SECTIONS_ANCHOR = "sections";
const SIDEBAR_SECTION_PREFIX = "section:";

export function parseSidebarSectionOrder(raw: string | null | undefined): string[] | null {
  if (!raw) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!Array.isArray(parsed) || parsed.some((entry) => typeof entry !== "string")) {
    return null;
  }
  return parsed as string[];
}

/**
 * Sections in the order the sidebar shows them. Mirrors the sidebar's own
 * merge: walk the stored order, expand the `sections` anchor into bb's list
 * order, place explicit `section:<id>` rows where they sit, then slot sections
 * the stored order has never seen right after the last placed section.
 */
export function orderSections<T extends BoardSectionLike>(
  sections: readonly T[],
  storedOrder: readonly string[] | null,
): T[] {
  if (!storedOrder) return [...sections];
  const byId = new Map(sections.map((section) => [section.id, section]));
  const placed = new Set<string>();
  const ordered: string[] = [];
  const place = (id: string) => {
    if (byId.has(id) && !placed.has(id)) {
      placed.add(id);
      ordered.push(id);
    }
  };
  for (const row of storedOrder) {
    if (row === SIDEBAR_SECTIONS_ANCHOR) {
      for (const section of sections) place(section.id);
    } else if (row.startsWith(SIDEBAR_SECTION_PREFIX)) {
      place(row.slice(SIDEBAR_SECTION_PREFIX.length));
    }
  }
  const unplaced = sections.filter((section) => !placed.has(section.id));
  ordered.push(...unplaced.map((section) => section.id));
  return ordered.map((id) => byId.get(id)!);
}

export function sortBoardThreads<T extends BoardThreadLike>(threads: readonly T[]): T[] {
  return [...threads].sort((left, right) => {
    if (left.pinned !== right.pinned) return left.pinned ? -1 : 1;
    return right.updatedAt - left.updatedAt;
  });
}

/**
 * One column per section, in section order. Threads outside every section get
 * a leading "No section" column only while at least one such thread exists,
 * so the board mirrors the sidebar without an always-empty column.
 */
export function buildColumns<T extends BoardThreadLike>(
  sections: readonly BoardSectionLike[],
  threads: readonly T[],
): BoardColumn<T>[] {
  const knownSections = new Set(sections.map((section) => section.id));
  const unsectioned = threads.filter(
    (thread) => thread.sectionId === null || !knownSections.has(thread.sectionId),
  );
  const columns: BoardColumn<T>[] = sections.map((section) => ({
    key: section.id,
    sectionId: section.id,
    name: section.name,
    threads: sortBoardThreads(
      threads.filter((thread) => thread.sectionId === section.id),
    ),
  }));
  if (unsectioned.length > 0) {
    columns.unshift({
      key: UNSECTIONED_COLUMN_KEY,
      sectionId: null,
      name: "No section",
      threads: sortBoardThreads(unsectioned),
    });
  }
  return columns;
}

export function relativeTime(timestamp: number, now = Date.now()): string {
  const seconds = Math.max(0, Math.round((now - timestamp) / 1_000));
  if (seconds < 60) return "now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d`;
  const months = Math.round(days / 30);
  return `${months}mo`;
}

export type ThreadTone = "active" | "attention" | "error" | "idle";

export function threadTone(thread: BoardThreadLike): ThreadTone {
  if (thread.pendingInteractions > 0) return "attention";
  if (thread.status === "error") return "error";
  if (thread.status === "active" || thread.status === "starting") return "active";
  if (thread.unread) return "attention";
  return "idle";
}

export function threadStatusLabel(thread: BoardThreadLike): string {
  if (thread.pendingInteractions > 0) return "Needs your input";
  switch (thread.status) {
    case "active":
      return "Working";
    case "starting":
      return "Starting";
    case "stopping":
      return "Stopping";
    case "error":
      return "Error";
    case "idle":
      return thread.unread ? "Unread" : "Idle";
  }
}

export const RECENT_LIMIT = 10;

export interface DashboardSummary<T extends BoardThreadLike> {
  active: T[];
  waiting: T[];
  perSection: { key: string; name: string; count: number }[];
  recent: T[];
}

export function isActiveThread(thread: BoardThreadLike): boolean {
  return thread.status === "active" || thread.status === "starting";
}

/** Waiting on the user: a pending interaction, or unread output on a thread that is not working. */
export function isWaitingOnUser(thread: BoardThreadLike): boolean {
  if (thread.pendingInteractions > 0) return true;
  return thread.unread && !isActiveThread(thread);
}

export function buildDashboard<T extends BoardThreadLike>(
  sections: readonly BoardSectionLike[],
  threads: readonly T[],
): DashboardSummary<T> {
  const byUpdated = [...threads].sort((left, right) => right.updatedAt - left.updatedAt);
  const perSection = buildColumns(sections, threads).map((column) => ({
    key: column.key,
    name: column.name,
    count: column.threads.length,
  }));
  return {
    active: byUpdated.filter(isActiveThread),
    waiting: byUpdated.filter(isWaitingOnUser),
    perSection,
    recent: byUpdated.slice(0, RECENT_LIMIT),
  };
}
