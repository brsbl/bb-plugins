import type { useSdk } from "@get-bb/plugin-sdk/app";

type Sdk = ReturnType<typeof useSdk>;
type TimelineRow = Awaited<ReturnType<Sdk["threads"]["timeline"]>>["rows"][number];
type Conversation = Extract<TimelineRow, { kind: "conversation" }>;
export interface Cursor { anchorId: string; anchorSeq: number }
export interface Page {
  rows: Conversation[];
  cursor: Cursor | null | undefined;
  complete: boolean;
  snapshot?: string;
  maxSeq?: number;
  surface?: string;
  olderRowsSourceSeqEnd?: number | null;
  updates?: Conversation[];
}
export interface History extends Page {
  pages: number;
  segments: number;
  visited: Set<string>;
  limited: boolean;
  failed: boolean;
}
export const PAGE_SEGMENTS = 20;
const MAX_LEGACY_SEGMENTS = 100;
const MAX_PAGES = 20;
const MAX_ROWS = 2_000;
const MAX_RETAINED_CHARS = 1_000_000;
const cursorKey = (cursor: Cursor) => JSON.stringify([cursor.anchorId, cursor.anchorSeq]);

export async function readPage(sdk: Sdk, threadId: string, signal: AbortSignal, cursor?: Cursor, segments = PAGE_SEGMENTS): Promise<Page> {
  const page = await sdk.threads.timeline({
    threadId, segmentLimit: String(segments), includeNestedRows: "true", signal,
    ...(cursor ? { beforeAnchorId: cursor.anchorId, beforeAnchorSeq: String(cursor.anchorSeq) } : {}),
  });
  const meta = page.timelinePage as { hasOlderRows?: boolean; olderCursor?: Cursor | null; historySnapshot?: string; olderRowsSourceSeqEnd?: number | null; olderRowUpdates?: TimelineRow[] } | undefined;
  return {
    rows: conversations(page.rows), cursor: meta?.olderCursor, snapshot: meta?.historySnapshot,
    maxSeq: page.maxSeq, surface: JSON.stringify([page.completedTurnDisplay, page.contextBoundarySeq]),
    olderRowsSourceSeqEnd: meta?.olderRowsSourceSeqEnd, updates: conversations(meta?.olderRowUpdates ?? []),
    complete: meta?.hasOlderRows !== undefined ? meta.hasOlderRows === false : meta?.olderCursor == null,
  };
}

function conversations(input: TimelineRow[]): Conversation[] {
  // Flatten split turn summaries before deduping; delegation childRows belong to other threads.
  const rows = new Map<string, Conversation>();
  const pending = [...input].reverse();
  while (pending.length) {
    const row = pending.pop()!;
    if (row.kind === "conversation") {
      if (!rows.has(row.id)) rows.set(row.id, row);
    } else if (row.kind === "turn" && row.children) {
      for (let index = row.children.length - 1; index >= 0; index--) pending.push(row.children[index]!);
    }
  }
  return [...rows.values()].sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id));
}

function bounded(history: History): History {
  const rows = history.rows.sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id));
  let chars = 0;
  let start = rows.length;
  while (start > 0 && rows.length - start < MAX_ROWS) {
    const size = JSON.stringify(rows[start - 1]).length;
    if (chars + size > MAX_RETAINED_CHARS) break;
    chars += size;
    start--;
  }
  const truncated = start > 0;
  return {
    ...history, rows: rows.slice(start), complete: history.complete && !truncated,
    limited: history.limited || truncated || (!history.complete && history.pages >= MAX_PAGES),
  };
}

export function startHistory(page: Page): History {
  return bounded({ ...page, updates: undefined, pages: 1, segments: PAGE_SEGMENTS, visited: new Set(), limited: false, failed: false });
}

function mergeRows(older: Conversation[], newer: Conversation[]): Conversation[] {
  return [...new Map([...older, ...newer].map((row) => [row.id, row])).values()];
}

export function refreshHistory(previous: History | undefined, latest: Page): History {
  if (!previous) return startHistory(latest);
  if (latest.snapshot === undefined) {
    // Legacy refreshes re-read the already expanded window.
    return bounded({ ...startHistory(latest), segments: previous.segments, pages: previous.pages,
      limited: !latest.complete && previous.segments === MAX_LEGACY_SEGMENTS });
  }
  if (latest.maxSeq === undefined || previous.maxSeq === undefined || latest.olderRowsSourceSeqEnd === undefined) {
    return latest.snapshot === previous.snapshot
      ? bounded({ ...previous, rows: mergeRows(previous.rows, latest.rows) })
      : startHistory(latest);
  }
  const windowStart = latest.cursor?.anchorSeq ?? 0;
  const omittedEnd = latest.olderRowsSourceSeqEnd;
  // Match bb's timeline merge contract: the latest window must reach the loaded
  // tip, and omitted older rows must not have changed beyond that tip.
  if (latest.surface !== previous.surface || latest.maxSeq < previous.maxSeq || windowStart > previous.maxSeq + 1 ||
      (omittedEnd !== null && omittedEnd > previous.maxSeq)) return startHistory(latest);
  const updates = new Map(latest.updates?.map((row) => [row.id, row]));
  const loaded = previous.rows.map((row) => updates.get(row.id) ?? row);
  const latestIds = new Set(latest.rows.map((row) => row.id));
  const shared = loaded.filter((row) => latestIds.has(row.id)).map((row) => row.id);
  const sharedIds = new Set(shared);
  const latestShared = latest.rows.filter((row) => sharedIds.has(row.id)).map((row) => row.id);
  const dropped = loaded.some((row) => !latestIds.has(row.id) && !(latest.cursor &&
    (row.sourceSeqEnd < windowStart || (omittedEnd !== null && row.sourceSeqEnd <= omittedEnd) || updates.has(row.id))));
  if (dropped || shared.some((id, index) => id !== latestShared[index]) ||
      (shared.length === 0 && windowStart <= previous.maxSeq)) return startHistory(latest);
  const cursor = previous.cursor === null || latest.cursor === null ? null
    : previous.cursor && latest.cursor && previous.cursor.anchorSeq <= latest.cursor.anchorSeq ? previous.cursor : latest.cursor;
  return bounded({ ...previous, ...latest, rows: mergeRows(loaded, latest.rows), cursor,
    complete: previous.complete || latest.complete, updates: undefined });
}

export function canReadOlder(history: History | undefined): history is History {
  return !!history && !history.complete && !history.limited && !history.failed;
}

export async function readOlder(sdk: Sdk, threadId: string, history: History, signal: AbortSignal): Promise<History> {
  if (!canReadOlder(history)) return history;
  if (history.cursor === undefined) {
    // Older servers may advertise history without returning a cursor.
    const segments = Math.min(history.segments + PAGE_SEGMENTS, MAX_LEGACY_SEGMENTS);
    const page = await readPage(sdk, threadId, signal, undefined, segments);
    return bounded({ ...history, ...page, updates: undefined, segments, pages: history.pages + 1,
      limited: !page.complete && segments === MAX_LEGACY_SEGMENTS });
  }
  if (history.cursor === null) return { ...history, complete: true };
  const key = cursorKey(history.cursor);
  const page = await readPage(sdk, threadId, signal, history.cursor);
  const visited = new Set(history.visited).add(key);
  return bounded({
    ...history, cursor: page.cursor, complete: page.complete, rows: mergeRows(page.rows, history.rows), pages: history.pages + 1, visited,
    limited: !page.complete && (!page.cursor || visited.has(cursorKey(page.cursor))),
  });
}
