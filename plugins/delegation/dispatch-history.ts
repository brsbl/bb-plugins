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
  // Turn summaries can be split across pages. Flatten each page before deduping
  // conversations; delegation childRows belong to other threads and are excluded.
  const rows = new Map<string, Conversation>();
  const pending = [...page.rows].reverse();
  while (pending.length) {
    const row = pending.pop()!;
    if (row.kind === "conversation") {
      if (!rows.has(row.id)) rows.set(row.id, row);
    } else if (row.kind === "turn" && row.children) {
      for (let index = row.children.length - 1; index >= 0; index--) pending.push(row.children[index]!);
    }
  }
  const meta = page.timelinePage as { hasOlderRows?: boolean; olderCursor?: Cursor | null; historySnapshot?: string } | undefined;
  return {
    rows: [...rows.values()], cursor: meta?.olderCursor, snapshot: meta?.historySnapshot,
    complete: meta?.hasOlderRows !== undefined ? meta.hasOlderRows === false : meta?.olderCursor == null,
  };
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
  return bounded({ ...page, pages: 1, segments: PAGE_SEGMENTS, visited: new Set(), limited: false, failed: false });
}

function mergeRows(older: Conversation[], newer: Conversation[]): Conversation[] {
  return [...new Map([...older, ...newer].map((row) => [row.id, row])).values()];
}

export function refreshHistory(previous: History | undefined, latest: Page): History {
  // A changed snapshot can regroup or remove loaded rows. Start a fresh walk
  // instead of mixing history surfaces; unchanged snapshots keep all older pages.
  if (!previous || latest.snapshot === undefined || latest.snapshot !== previous.snapshot) return startHistory(latest);
  return bounded({ ...previous, rows: mergeRows(previous.rows, latest.rows) });
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
    return bounded({ ...history, ...page, segments, pages: history.pages + 1,
      limited: !page.complete && segments === MAX_LEGACY_SEGMENTS });
  }
  if (history.cursor === null) return { ...history, complete: true };
  const key = cursorKey(history.cursor);
  const page = await readPage(sdk, threadId, signal, history.cursor);
  const visited = new Set(history.visited).add(key);
  return bounded({
    ...history, ...page, rows: mergeRows(page.rows, history.rows), pages: history.pages + 1, visited,
    limited: !page.complete && (!page.cursor || visited.has(cursorKey(page.cursor))),
  });
}
