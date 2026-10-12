import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Markdown,
  experimental_Icon as Icon,
  experimental_useSidebarThreads as useSidebarThreads,
  useBbContext,
  useBbNavigate,
  useSdk,
} from "@get-bb/plugin-sdk/app";
import { buildChannels, counterpartIds, currentQuestions, type Channel, type ChannelMessage } from "./dispatch-model.js";

export const DISPATCH_ACTION_ID = "dispatch";
/** Timeline segments read per thread. Older history stays one "Load earlier" away. */
const SEGMENTS = 20;
/** bb rejects reads above 100 segments. */
const MAX_SEGMENTS = 100;
/** Threads refetch when their sidebar state changes; this only catches anything that change missed. */
const SAFETY_REFRESH_MS = 5 * 60_000;
/** While a report waits, re-read its question until bb has written the notice. */
const QUESTION_REFRESH_MS = 15_000;
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

// bb keys a panel tab by its params, so "Open channel" reuses the one Dispatch tab and hands it the
// channel here instead: a fresh panel reads the pending request, an open one hears the event.
const OPEN_CHANNEL_EVENT = "dispatch:open-channel";
const pendingChannel = new Map<string, string>();

function requestChannel(threadId: string, counterpartId: string) {
  pendingChannel.set(threadId, counterpartId);
  window.dispatchEvent(new CustomEvent(OPEN_CHANNEL_EVENT, { detail: { threadId, counterpartId } }));
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

function useVisibleInterval(callback: () => void, ms: number, enabled = true) {
  const saved = useRef(callback);
  saved.current = callback;
  useEffect(() => {
    if (!enabled) return;
    const tick = () => { if (document.visibilityState === "visible") saved.current(); };
    const timer = window.setInterval(tick, ms);
    document.addEventListener("visibilitychange", tick);
    return () => { window.clearInterval(timer); document.removeEventListener("visibilitychange", tick); };
  }, [ms, enabled]);
}

interface Cached { stamp: string; segments: number; page: Page }

/** Channels for one thread: its own rows, plus each counterpart's rows sent by this thread. */
export function useChannels(threadId: string) {
  const sdk = useSdk();
  const org = useOrg(threadId);
  const [segments, setSegments] = useState(SEGMENTS);
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
      setCounterpartRows(new Map(pages.map(([id, page]) => [id, page.rows])));
      setCompleteHistory(new Set(pages.filter(([, page]) => page.complete).map(([id]) => id)));
      setStatus("ready");
    } catch {
      if (!signal.aborted) setStatus((value) => (value === "ready" ? value : "error"));
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
    loadEarlier: () => setSegments((count) => Math.min(count + SEGMENTS, MAX_SEGMENTS)),
  };
}

// ── Panel ───────────────────────────────────────────────────────────────────

function ActivityDot({ channel }: { channel: Channel }) {
  if (channel.needsYou) return <span className="dp-dot dp-dot-attention" aria-label="Needs you" />;
  if (channel.unread) return <span className="dp-dot" aria-label="New activity" />;
  return null;
}

const DIR_LABEL: Record<ChannelMessage["dir"], string> = {
  brief: "started with",
  out: "Message from",
  in: "Message from",
  finished: "finished",
  failed: "failed",
  interrupted: "was interrupted",
  "needs-you": "needs attention",
};
const DIR_ICON: Record<ChannelMessage["dir"], string> = {
  brief: "MessageSquarePlus",
  out: "MessageSquare",
  in: "MessageSquare",
  finished: "CircleCheck",
  failed: "AlertCircle",
  interrupted: "Square",
  "needs-you": "AlertTriangle",
};

function MessageRow({ message, selfTitle, channel }: { message: ChannelMessage; selfTitle: string; channel: Channel }) {
  const sender = message.dir === "out" ? selfTitle : channel.title;
  const isMessage = message.dir === "out" || message.dir === "in";
  return (
    <li className={`dp-message dp-message-${message.dir}`}>
      <div className="dp-message-title">
        <Icon name={DIR_ICON[message.dir]} fallback="MessageSquare" className="dp-message-icon" aria-hidden />
        {isMessage ? (
          <>
            <span className="dp-muted">Message from</span>
            <span className="dp-pill">{sender}</span>
          </>
        ) : (
          <>
            <span className="dp-pill">{channel.title}</span>
            <span className="dp-muted">{DIR_LABEL[message.dir]}</span>
          </>
        )}
        <span className="dp-time">{new Date(message.at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span>
      </div>
      <div className="dp-message-body"><Markdown content={message.text || "_(no text)_"} /></div>
      {message.dir === "out" && (message.steer || message.status === "pending" || message.status === "rejected") ? (
        <p className="dp-delivery">
          {message.status === "rejected" ? "Not delivered" : message.status === "pending" ? "Queued" : "Steered into its running turn"}
        </p>
      ) : null}
    </li>
  );
}

export function DispatchPanel({ threadId, params }: { threadId: string; params: unknown }) {
  const { channels, status, seen, canLoadEarlier, loadEarlier } = useChannels(threadId);
  const navigate = useBbNavigate();
  const requested = typeof params === "object" && params !== null ? (params as { counterpart?: unknown }).counterpart : undefined;
  const [active, setActive] = useState<string | null>(() => pendingChannel.get(threadId) ?? (typeof requested === "string" ? requested : null));
  const sidebar = useSidebarThreads();
  const selfTitle = sidebar.threads.find((thread) => thread.id === threadId)?.displayTitle ?? "This thread";
  const current = channels.find((channel) => channel.counterpartId === active) ?? channels[0];

  useEffect(() => {
    pendingChannel.delete(threadId);
    const onOpen = (event: Event) => {
      const detail = (event as CustomEvent<{ threadId: string; counterpartId: string }>).detail;
      if (detail.threadId !== threadId) return;
      pendingChannel.delete(threadId);
      setActive(detail.counterpartId);
    };
    window.addEventListener(OPEN_CHANNEL_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_CHANNEL_EVENT, onOpen);
  }, [threadId]);

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
        <div className="dp-channel" role="tabpanel">
          <div className="dp-channel-head">
            <span className="dp-channel-title">{selfTitle} ↔ {current.title}</span>
            <span className="dp-muted">· {current.relation === "report" ? "your report" : current.relation === "parent" ? "your lead" : "peer"}</span>
            <span className="dp-spacer" />
            <button type="button" className="dp-link" onClick={() => navigate.toThread(current.counterpartId)}>Open {current.title}</button>
          </div>
          {current.messages.length === 0 ? (
            <p className="dp-empty">No messages in the loaded history.</p>
          ) : (
            <ol className="dp-messages">
              {current.messages.map((message) => <MessageRow key={message.id} message={message} selfTitle={selfTitle} channel={current} />)}
            </ol>
          )}
          {canLoadEarlier(current.counterpartId) ? (
            <button type="button" className="dp-link dp-earlier" onClick={loadEarlier}>Load earlier messages</button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

// ── Needs-you banner above the composer ─────────────────────────────────────

/** One line per report waiting on the user, read from the live sidebar and this thread's own rows. */
export function NeedsYouBanner() {
  const { threadId } = useBbContext();
  const sidebar = useSidebarThreads();
  const sdk = useSdk();
  const navigate = useBbNavigate();
  const [questions, setQuestions] = useState<Map<string, string>>(new Map());
  const waiting = useMemo(
    () => (threadId ? sidebar.threads.filter((thread) => isReportOf(thread, threadId) && thread.hasPendingInteraction) : []),
    [sidebar, threadId],
  );
  const waitingKey = waiting.map((thread) => thread.id).join(",");

  const inFlight = useRef<AbortController | null>(null);
  const readQuestions = useCallback(() => {
    if (!threadId) return;
    inFlight.current?.abort();
    const controller = new AbortController();
    inFlight.current = controller;
    void conversationPage(sdk, threadId, 10, controller.signal).then((page) => {
      if (!controller.signal.aborted) setQuestions(currentQuestions(page.rows));
    }, () => undefined);
  }, [sdk, threadId]);
  useEffect(() => {
    if (waitingKey) readQuestions();
    return () => inFlight.current?.abort();
  }, [readQuestions, waitingKey]);
  // bb writes the needs-attention notice just after it marks the report as waiting, so re-read until it's there.
  useVisibleInterval(readQuestions, QUESTION_REFRESH_MS, waiting.some((thread) => !questions.has(thread.id)));

  if (!threadId || waiting.length === 0) return null;
  return (
    <div className="dp-banners">
      {waiting.map((thread) => (
        <div key={thread.id} className="dp-banner">
          <span className="dp-dot dp-dot-attention" aria-hidden />
          <span className="dp-banner-name">{thread.displayTitle}</span>
          <span className="dp-banner-question">{(questions.get(thread.id) ?? "is waiting on you").split("\n")[0]}</span>
          <button
            type="button"
            className="dp-button"
            onClick={() => {
              requestChannel(threadId, thread.id);
              navigate.openThreadPanel({ actionId: DISPATCH_ACTION_ID, title: "Dispatch" });
            }}
          >
            Open channel
          </button>
        </div>
      ))}
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
      aria-label="Open Dispatch"
      title="Dispatch: this thread's agent channels"
      onClick={() => navigate.openThreadPanel({ actionId: DISPATCH_ACTION_ID, title: "Dispatch" })}
    >
      <Icon name="Workflow" className="dp-message-icon" aria-hidden />
      Dispatch
      {attention ? <span className="dp-dot dp-dot-attention" aria-label="A report needs you" /> : null}
    </button>
  );
}
