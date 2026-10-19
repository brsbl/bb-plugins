import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  Markdown,
  experimental_Icon as Icon,
  experimental_useSidebarThreads as useSidebarThreads,
  useBbNavigate,
  useSdk,
} from "@get-bb/plugin-sdk/app";
import { buildChannels, counterpartIds, type Channel, type ChannelMessage } from "./dispatch-model.js";
import { canReadOlder, readOlder, readPage, refreshHistory, startHistory, type History } from "./dispatch-history.js";

export const DISPATCH_ACTION_ID = "dispatch";
/** Threads refetch when their sidebar state changes; this only catches anything that change missed. */
const SAFETY_REFRESH_MS = 5 * 60_000;
const MAX_COUNTERPARTS = 16;
const MAX_CONCURRENT_READS = 4;

type SidebarThread = ReturnType<typeof useSidebarThreads>["threads"][number];

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

interface Cached { stamp: string; history: History }

/** Channels for one thread, retaining cursor pages only for the open conversation. */
export function useChannels(threadId: string) {
  const sdk = useSdk();
  const org = useOrg(threadId);
  const [pages, setPages] = useState(new Map<string, Cached>());
  const [loading, setLoading] = useState(false);
  const [lastSeen, setLastSeen] = useState(() => readLastSeen(threadId));
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const cache = useRef(new Map<string, Cached>());
  const inFlight = useRef<AbortController | null>(null);
  const orgRef = useRef(org);
  orgRef.current = org;

  useEffect(() => {
    cache.current = new Map();
    setPages(new Map());
    setStatus("loading");
  }, [threadId]);

  const load = useCallback(async (force: boolean) => {
    inFlight.current?.abort();
    const controller = new AbortController();
    inFlight.current = controller;
    setLoading(true);
    const { signal } = controller;
    const current = orgRef.current;
    const read = async (id: string): Promise<History> => {
      const stamp = current.stamps.get(id) ?? "";
      const cached = cache.current.get(id);
      if (!force && cached && stamp !== "" && cached.stamp === stamp) return cached.history;
      const latest = await readPage(sdk, id, signal);
      const history = refreshHistory(cached?.history, latest);
      if (!signal.aborted) cache.current.set(id, { stamp, history });
      return history;
    };
    try {
      const own = await read(threadId);
      if (signal.aborted) return;
      const ids = counterpartIds({ selfId: threadId, parentId: current.parentId, childIds: current.childIds, selfRows: own.rows }).slice(0, MAX_COUNTERPARTS);
      // Prune counterparts that left the bounded set, including their retained pages.
      for (const id of cache.current.keys()) if (id !== threadId && !ids.includes(id)) cache.current.delete(id);
      await inBatches(ids, MAX_CONCURRENT_READS, async (id) => {
        try { await read(id); } catch { /* Keep any loaded history; the channel offers a thread link. */ }
      });
      if (!signal.aborted) {
        setPages(new Map(cache.current));
        setStatus("ready");
      }
    } catch {
      if (!signal.aborted) setStatus((value) => value === "ready" ? value : "error");
    } finally {
      if (inFlight.current === controller) {
        inFlight.current = null;
        setLoading(false);
      }
    }
  }, [sdk, threadId]);

  const stampKey = [threadId, ...(org.parentId ? [org.parentId] : []), ...org.childIds].map((id) => `${id}=${org.stamps.get(id) ?? ""}`).join(",");
  useEffect(() => { void load(false); }, [load, stampKey]);
  useEffect(() => () => inFlight.current?.abort(), []);
  useVisibleInterval(() => { void load(true); }, SAFETY_REFRESH_MS);

  const loadEarlier = useCallback(async (counterpartId: string, retry = false) => {
    if (inFlight.current) return;
    const controller = new AbortController();
    inFlight.current = controller;
    setLoading(true);
    const { signal } = controller;
    try {
      // A scroll affects only the open channel's two timelines, never every worker.
      await Promise.all([threadId, counterpartId].map(async (id) => {
        const cached = cache.current.get(id);
        if (!cached) return;
        const previous = retry ? { ...cached.history, failed: false } : cached.history;
        if (!canReadOlder(previous)) return;
        let history: History;
        try {
          history = await readOlder(sdk, id, previous, signal);
        } catch (error) {
          if (signal.aborted) return;
          // A stale cursor needs a new latest snapshot. Pause automatic paging
          // after recovery (or a network error) so a bad cursor cannot loop.
          const stale = error instanceof Error && /cursor.*(no longer|invalid|available)/i.test(error.message);
          if (stale) {
            try { history = { ...startHistory(await readPage(sdk, id, signal)), failed: true }; }
            catch { history = { ...previous, failed: true }; }
          } else history = { ...previous, failed: true };
        }
        if (!signal.aborted && cache.current.get(id) === cached) cache.current.set(id, { ...cached, history });
      }));
      if (!signal.aborted) setPages(new Map(cache.current));
    } finally {
      if (inFlight.current === controller) {
        inFlight.current = null;
        setLoading(false);
      }
    }
  }, [sdk, threadId]);

  const channels = useMemo(() => buildChannels({
    selfId: threadId, parentId: org.parentId, childIds: org.childIds, titles: org.titles,
    pending: org.pending, pendingKnown: org.ready, lastSeen,
    selfRows: pages.get(threadId)?.history.rows ?? [],
    counterpartRows: new Map([...pages].filter(([id]) => id !== threadId).map(([id, cached]) => [id, cached.history.rows])),
    completeHistory: new Set([...pages].filter(([, cached]) => cached.history.complete).map(([id]) => id)),
  }), [threadId, org, lastSeen, pages]);
  const seen = useCallback((counterpartId: string) => {
    markSeen(threadId, counterpartId);
    setLastSeen(readLastSeen(threadId));
  }, [threadId]);
  return {
    channels, status, seen, loadEarlier, loadingEarlier: loading,
    canLoadEarlier: (id: string) => [threadId, id].some((key) => canReadOlder(pages.get(key)?.history)),
    historyLimited: (id: string) => status === "ready" && [threadId, id].some((key) => !pages.has(key) || pages.get(key)?.history.limited),
    historyFailed: (id: string) => [threadId, id].some((key) => pages.get(key)?.history.failed),
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
  const { channels, status, seen, canLoadEarlier, loadingEarlier, loadEarlier, historyLimited, historyFailed } = useChannels(threadId);
  const navigate = useBbNavigate();
  const requested = typeof params === "object" && params !== null ? (params as { counterpart?: unknown }).counterpart : undefined;
  const [active, setActive] = useState<string | null>(typeof requested === "string" ? requested : null);
  const current = channels.find((channel) => channel.counterpartId === active) ?? channels[0];
  const earlier = useCallback(() => { if (current) void loadEarlier(current.counterpartId); }, [current?.counterpartId, loadEarlier]);
  const scroll = useTimelineScroll(current?.counterpartId, current?.latestAt, current?.messages.length ?? 0,
    current ? canLoadEarlier(current.counterpartId) : false, loadingEarlier, earlier);

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
          {historyLimited(current.counterpartId) ? (
            <p className="dp-empty">Earlier messages are available in the threads. <button type="button" onClick={() => navigate.toThread(threadId)}>Open this thread</button>{" "}<button type="button" onClick={() => navigate.toThread(current.counterpartId)}>Open {current.title}</button></p>
          ) : null}
          {historyFailed(current.counterpartId) ? (
            <p className="dp-empty">Couldn't load older messages. <button type="button" disabled={loadingEarlier} onClick={() => void loadEarlier(current.counterpartId, true)}>Retry</button></p>
          ) : null}
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
      aria-label="Open Agent Channels"
      title="Agent Channels: this thread's conversations with other agents"
      onClick={() => navigate.openThreadPanel({ actionId: DISPATCH_ACTION_ID, title: "Agent Channels" })}
    >
      <Icon name="delegation/agent-channels" className="dp-header-icon" aria-hidden />
      Agent Channels
      {attention ? <span className="dp-dot dp-dot-attention" aria-label="A report needs you" /> : null}
    </button>
  );
}
