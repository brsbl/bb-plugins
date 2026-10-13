import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  Markdown,
  experimental_Icon as Icon,
  experimental_useSidebarThreads as useSidebarThreads,
  useBbNavigate,
  useSdk,
} from "@get-bb/plugin-sdk/app";
import { buildChannels, counterpartIds, type Channel, type ChannelMessage } from "./dispatch-model.js";

export const DISPATCH_ACTION_ID = "dispatch";
/** Timeline segments read per thread. Scrolling to the top of a channel reads older ones. */
const SEGMENTS = 20;
/** bb rejects reads above 100 segments. */
const MAX_SEGMENTS = 100;
/** Threads refetch when their sidebar state changes; this only catches anything that change missed. */
const SAFETY_REFRESH_MS = 5 * 60_000;
const MAX_COUNTERPARTS = 16;
const MAX_CONCURRENT_READS = 4;

type Sdk = ReturnType<typeof useSdk>;
type SidebarThread = ReturnType<typeof useSidebarThreads>["threads"][number];
interface Page { rows: unknown[]; complete: boolean }

async function conversationPage(sdk: Sdk, threadId: string, segments: number, signal: AbortSignal): Promise<Page> {
  const page = await sdk.threads.timeline({ threadId, segmentLimit: String(Math.min(segments, MAX_SEGMENTS)), signal });
  return {
    rows: (page.rows as unknown[]).filter((row) => (row as { kind?: string }).kind === "conversation"),
    complete: !(page.timelinePage as { hasOlderRows?: boolean } | undefined)?.hasOlderRows,
  };
}

/** Run reads a few at a time so a large org doesn't fan out at once. */
async function inBatches<T, R>(items: readonly T[], limit: number, run: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await run(items[index]!);
    }
  }));
  return results;
}

function lastSeenKey(threadId: string) {
  return `dispatch:last-seen:${threadId}`;
}
function readLastSeen(threadId: string): Map<string, number> {
  try {
    return new Map(Object.entries(JSON.parse(localStorage.getItem(lastSeenKey(threadId)) ?? "{}") as Record<string, number>));
  } catch {
    return new Map();
  }
}
function markSeen(threadId: string, counterpartId: string) {
  const seen = readLastSeen(threadId);
  seen.set(counterpartId, Date.now());
  localStorage.setItem(lastSeenKey(threadId), JSON.stringify(Object.fromEntries(seen)));
}

/** Spawned reports only; bb's sidebar also links forks by parentThreadId. */
function isReportOf(thread: SidebarThread, threadId: string) {
  return thread.parentThreadId === threadId && thread.originKind === null && !thread.isArchived;
}

/** Changes whenever bb shows new activity on a thread, so its timeline is worth re-reading. */
function activityStamp(thread: SidebarThread | undefined) {
  if (!thread) return "";
  return [thread.updatedAt, thread.latestAttentionAt, thread.status, thread.runtimeStatus, thread.hasPendingInteraction, JSON.stringify(thread.queuedWork)].join("|");
}

/** The org around a thread, from bb's live sidebar state. */
function useOrg(threadId: string) {
  const sidebar = useSidebarThreads();
  return useMemo(() => {
    const self = sidebar.threads.find((thread) => thread.id === threadId);
    const children = sidebar.threads.filter((thread) => isReportOf(thread, threadId));
    const titles = new Map(sidebar.threads.map((thread) => [thread.id, thread.displayTitle] as const));
    const pending = new Set(sidebar.threads.filter((thread) => thread.hasPendingInteraction).map((thread) => thread.id));
    const stamps = new Map(sidebar.threads.map((thread) => [thread.id, activityStamp(thread)] as const));
    return {
      parentId: self && self.originKind === null ? self.parentThreadId : null,
      childIds: children.map((thread) => thread.id),
      titles,
      pending,
      stamps,
      ready: sidebar.status === "ready",
    };
  }, [sidebar, threadId]);
}

function useVisibleInterval(callback: () => void, ms: number) {
  const saved = useRef(callback);
  saved.current = callback;
  useEffect(() => {
    const tick = () => { if (document.visibilityState === "visible") saved.current(); };
    const timer = window.setInterval(tick, ms);
    document.addEventListener("visibilitychange", tick);
    return () => { window.clearInterval(timer); document.removeEventListener("visibilitychange", tick); };
  }, [ms]);
}

interface Cached { stamp: string; segments: number; page: Page }

/** Channels for one thread: its own rows, plus each counterpart's rows sent by this thread. */
export function useChannels(threadId: string) {
  const sdk = useSdk();
  const org = useOrg(threadId);
  const [segments, setSegments] = useState(SEGMENTS);
  /** The window the last finished read used; behind `segments` while an older page loads. */
  const [loadedSegments, setLoadedSegments] = useState(SEGMENTS);
  const [selfRows, setSelfRows] = useState<unknown[]>([]);
  const [counterpartRows, setCounterpartRows] = useState<Map<string, unknown[]>>(new Map());
  const [completeHistory, setCompleteHistory] = useState<Set<string>>(new Set());
  const [selfComplete, setSelfComplete] = useState(false);
  const [lastSeen, setLastSeen] = useState(() => readLastSeen(threadId));
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const cache = useRef(new Map<string, Cached>());
  const inFlight = useRef<AbortController | null>(null);
  const orgRef = useRef(org);
  orgRef.current = org;

  useEffect(() => {
    cache.current = new Map();
    setStatus("loading");
  }, [threadId]);

  /** Re-read only threads whose sidebar activity changed since their last read (or every thread when forced). */
  const load = useCallback(async (force: boolean) => {
    inFlight.current?.abort();
    const controller = new AbortController();
    inFlight.current = controller;
    const { signal } = controller;
    const current = orgRef.current;
    const read = async (id: string): Promise<Page> => {
      const stamp = current.stamps.get(id) ?? "";
      const cached = cache.current.get(id);
      if (!force && cached && cached.segments === segments && stamp !== "" && cached.stamp === stamp) return cached.page;
      const page = await conversationPage(sdk, id, segments, signal);
      if (!signal.aborted) cache.current.set(id, { stamp, segments, page });
      return page;
    };
    try {
      const own = await read(threadId);
      const ids = counterpartIds({ selfId: threadId, parentId: current.parentId, childIds: current.childIds, selfRows: own.rows }).slice(0, MAX_COUNTERPARTS);
      const pages = await inBatches(ids, MAX_CONCURRENT_READS, async (id) => {
        try { return [id, await read(id)] as const; } catch { return [id, cache.current.get(id)?.page ?? { rows: [], complete: false }] as const; }
      });
      if (signal.aborted) return;
      setSelfRows(own.rows);
      setSelfComplete(own.complete);
      setLoadedSegments(segments);
      setCounterpartRows(new Map(pages.map(([id, page]) => [id, page.rows])));
      setCompleteHistory(new Set(pages.filter(([, page]) => page.complete).map(([id]) => id)));
      setStatus("ready");
    } catch {
      if (!signal.aborted) {
        setStatus((value) => (value === "ready" ? value : "error"));
        setLoadedSegments(segments);
      }
    }
  }, [sdk, threadId, segments]);

  // Sidebar state is live, so a change to any thread in the org triggers a read of just that thread.
  const stampKey = [threadId, ...(org.parentId ? [org.parentId] : []), ...org.childIds].map((id) => `${id}=${org.stamps.get(id) ?? ""}`).join(",");
  useEffect(() => {
    void load(false);
  }, [load, stampKey]);
  useEffect(() => () => inFlight.current?.abort(), []);
  useVisibleInterval(() => { void load(true); }, SAFETY_REFRESH_MS);

  const channels = useMemo(
    () => buildChannels({ selfId: threadId, parentId: org.parentId, childIds: org.childIds, titles: org.titles, pending: org.pending, pendingKnown: org.ready, lastSeen, selfRows, counterpartRows, completeHistory }),
    [threadId, org, lastSeen, selfRows, counterpartRows, completeHistory],
  );
  const loadEarlier = useCallback(() => setSegments((count) => Math.min(count + SEGMENTS, MAX_SEGMENTS)), []);
  const seen = useCallback((counterpartId: string) => {
    markSeen(threadId, counterpartId);
    setLastSeen(readLastSeen(threadId));
  }, [threadId]);
  return {
    channels,
    status,
    seen,
    /** Whether older history exists for a channel and bb will still serve a larger window. */
    canLoadEarlier: (counterpartId: string) => segments < MAX_SEGMENTS && !(selfComplete && completeHistory.has(counterpartId)),
    loadingEarlier: loadedSegments !== segments,
    loadEarlier,
  };
}

// ── Panel ───────────────────────────────────────────────────────────────────

function ActivityDot({ channel }: { channel: Channel }) {
  if (channel.needsYou) return <span className="dp-dot dp-dot-attention" aria-label="Needs you" />;
  if (channel.unread) return <span className="dp-dot" aria-label="New activity" />;
  return null;
}

/** Reads like a thread timeline between two agents: this thread speaks as the sender, the counterpart replies. */
const REPLY_NOTE: Partial<Record<ChannelMessage["dir"], string>> = {
  failed: "Failed",
  interrupted: "Interrupted",
};

function MessageRow({ message }: { message: ChannelMessage }) {
  if (message.dir === "brief" || message.dir === "out") {
    const delivery = message.status === "rejected" ? "Not delivered" : message.status === "pending" ? "Queued" : message.steer ? "Steered into its running turn" : null;
    return (
      <li className="dp-sent">
        <div className="dp-bubble"><Markdown content={message.text || "_(no text)_"} /></div>
        {delivery ? <p className="dp-note">{delivery}</p> : null}
      </li>
    );
  }
  const note = REPLY_NOTE[message.dir];
  return (
    <li className={`dp-reply${message.dir === "failed" ? " dp-reply-failed" : ""}`}>
      {message.text ? <Markdown content={message.text} /> : null}
      {note ? <p className="dp-note">{note}</p> : null}
    </li>
  );
}

/**
 * Keeps the newest message in view and reads older history from the top, like a thread does. A channel too short
 * to scroll keeps reading older pages until it fills or its history is complete.
 */
function useTimelineScroll(key: string | undefined, latestAt: number | undefined, count: number, canLoad: boolean, loading: boolean, loadEarlier: () => void) {
  const ref = useRef<HTMLDivElement | null>(null);
  const pinned = useRef(true);
  /** Distance from the bottom to keep while an older page loads. */
  const restore = useRef<number | null>(null);
  const shownKey = useRef(key);
  const requestOlder = useCallback((el: HTMLDivElement) => {
    restore.current = el.scrollHeight - el.scrollTop;
    loadEarlier();
  }, [loadEarlier]);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (shownKey.current !== key) {
      shownKey.current = key;
      pinned.current = true;
      restore.current = null;
    }
    if (restore.current !== null) {
      if (loading) return;
      el.scrollTop = el.scrollHeight - restore.current;
      restore.current = null;
    } else if (pinned.current) {
      el.scrollTop = el.scrollHeight;
    }
    if (canLoad && !loading && el.scrollHeight <= el.clientHeight) requestOlder(el);
  }, [key, latestAt, count, canLoad, loading, requestOlder]);
  const onScroll = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    pinned.current = el.scrollHeight - el.scrollTop - el.clientHeight < 24;
    if (el.scrollTop < 48 && canLoad && !loading && restore.current === null) requestOlder(el);
  }, [canLoad, loading, requestOlder]);
  return { ref, onScroll };
}

export function DispatchPanel({ threadId, params }: { threadId: string; params: unknown }) {
  const { channels, status, seen, canLoadEarlier, loadingEarlier, loadEarlier } = useChannels(threadId);
  const requested = typeof params === "object" && params !== null ? (params as { counterpart?: unknown }).counterpart : undefined;
  const [active, setActive] = useState<string | null>(typeof requested === "string" ? requested : null);
  const current = channels.find((channel) => channel.counterpartId === active) ?? channels[0];
  const scroll = useTimelineScroll(current?.counterpartId, current?.latestAt, current?.messages.length ?? 0,
    current ? canLoadEarlier(current.counterpartId) : false, loadingEarlier, loadEarlier);

  useEffect(() => {
    if (current) seen(current.counterpartId);
    // Mark seen when the shown channel or its latest message changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.counterpartId, current?.latestAt]);

  if (status === "loading" && channels.length === 0) return <p className="dp-empty">Loading channels…</p>;
  if (channels.length === 0) {
    return <p className="dp-empty">{status === "error" ? "Couldn't load this thread's channels." : "No agent conversations yet. Channels appear when this thread starts a worker or another agent messages it."}</p>;
  }
  return (
    <div className="dp-panel">
      <div className="dp-tabs" role="tablist" aria-label="Channels">
        {channels.map((channel) => (
          <button
            key={channel.counterpartId}
            type="button"
            role="tab"
            aria-selected={channel === current}
            className={channel === current ? "dp-tab dp-tab-active" : "dp-tab"}
            onClick={() => setActive(channel.counterpartId)}
          >
            {channel.title}
            <ActivityDot channel={channel} />
          </button>
        ))}
      </div>
      {current ? (
        <div className="dp-channel" role="tabpanel" aria-label={current.title} ref={scroll.ref} onScroll={scroll.onScroll}>
          {current.messages.length === 0 ? (
            <p className="dp-empty">No messages yet.</p>
          ) : (
            <ol className="dp-messages">
              {current.messages.map((message) => <MessageRow key={message.id} message={message} />)}
            </ol>
          )}
        </div>
      ) : null}
    </div>
  );
}

// ── Header button ───────────────────────────────────────────────────────────

export function DispatchHeaderButton({ threadId }: { threadId: string }) {
  const navigate = useBbNavigate();
  const sidebar = useSidebarThreads();
  const attention = sidebar.threads.some((thread) => isReportOf(thread, threadId) && thread.hasPendingInteraction);
  return (
    <button
      type="button"
      className="dp-header-button"
      aria-label={attention ? "Agent Channels, a report needs you" : "Agent Channels"}
      title={attention ? "Agent Channels: a report needs you" : "Agent Channels"}
      onClick={() => navigate.openThreadPanel({ actionId: DISPATCH_ACTION_ID, title: "Agent Channels" })}
    >
      <Icon name="delegation/agent-channels" className="dp-header-icon" aria-hidden />
      {attention ? <span className="dp-dot dp-dot-attention dp-header-dot" aria-hidden /> : null}
    </button>
  );
}
