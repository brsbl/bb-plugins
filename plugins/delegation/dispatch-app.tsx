import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Markdown,
  experimental_Icon as Icon,
  experimental_useSidebarThreads as useSidebarThreads,
  useBbContext,
  useBbNavigate,
  useSdk,
} from "@get-bb/plugin-sdk/app";
import { buildChannels, counterpartIds, incoming, type Channel, type ChannelMessage } from "./dispatch-model.js";

export const DISPATCH_ACTION_ID = "dispatch";
/** Timeline segments read per thread. Older history stays one "Load earlier" away. */
const SEGMENTS = 30;
/** No live event hook exists for other threads, so refresh on a bounded interval while visible. */
const REFRESH_MS = 30_000;
const MAX_COUNTERPARTS = 16;

type Sdk = ReturnType<typeof useSdk>;

async function conversationPage(sdk: Sdk, threadId: string, segments: number, signal: AbortSignal): Promise<{ rows: unknown[]; complete: boolean }> {
  const page = await sdk.threads.timeline({ threadId, segmentLimit: String(segments), signal });
  return {
    rows: (page.rows as unknown[]).filter((row) => (row as { kind?: string }).kind === "conversation"),
    complete: !(page.timelinePage as { hasOlderRows?: boolean } | undefined)?.hasOlderRows,
  };
}
async function conversationRows(sdk: Sdk, threadId: string, segments: number, signal: AbortSignal): Promise<unknown[]> {
  return (await conversationPage(sdk, threadId, segments, signal)).rows;
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

/** The org around a thread, from bb's live sidebar state. */
function useOrg(threadId: string) {
  const sidebar = useSidebarThreads();
  return useMemo(() => {
    const self = sidebar.threads.find((thread) => thread.id === threadId);
    const children = sidebar.threads.filter((thread) => thread.parentThreadId === threadId && !thread.isArchived);
    const titles = new Map(sidebar.threads.map((thread) => [thread.id, thread.displayTitle] as const));
    const pending = new Set(sidebar.threads.filter((thread) => thread.hasPendingInteraction).map((thread) => thread.id));
    return { parentId: self?.parentThreadId ?? null, childIds: children.map((thread) => thread.id), titles, pending, ready: sidebar.status === "ready" };
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

/** Channels for one thread: its own rows, plus each counterpart's rows sent by this thread. */
export function useChannels(threadId: string) {
  const sdk = useSdk();
  const org = useOrg(threadId);
  const [segments, setSegments] = useState(SEGMENTS);
  const [selfRows, setSelfRows] = useState<unknown[]>([]);
  const [counterpartRows, setCounterpartRows] = useState<Map<string, unknown[]>>(new Map());
  const [completeHistory, setCompleteHistory] = useState<Set<string>>(new Set());
  const [lastSeen, setLastSeen] = useState(() => readLastSeen(threadId));
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const childKey = org.childIds.join(",");

  const load = useCallback(async (signal: AbortSignal) => {
    try {
      const own = await conversationRows(sdk, threadId, segments, signal);
      const ids = counterpartIds({ selfId: threadId, parentId: org.parentId, childIds: org.childIds, selfRows: own }).slice(0, MAX_COUNTERPARTS);
      const pages = await Promise.all(ids.map(async (id) => {
        try { return [id, await conversationPage(sdk, id, segments, signal)] as const; } catch { return [id, { rows: [] as unknown[], complete: false }] as const; }
      }));
      if (signal.aborted) return;
      setSelfRows(own);
      setCounterpartRows(new Map(pages.map(([id, page]) => [id, page.rows])));
      setCompleteHistory(new Set(pages.filter(([, page]) => page.complete).map(([id]) => id)));
      setStatus("ready");
    } catch {
      if (!signal.aborted) setStatus((current) => (current === "ready" ? current : "error"));
    }
    // childKey stands in for org.childIds.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sdk, threadId, segments, org.parentId, childKey]);

  const refresh = useCallback(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return controller;
  }, [load]);
  useEffect(() => {
    const controller = refresh();
    return () => controller.abort();
  }, [refresh]);
  useVisibleInterval(() => { refresh(); }, REFRESH_MS);

  const channels = useMemo(
    () => buildChannels({ selfId: threadId, parentId: org.parentId, childIds: org.childIds, titles: org.titles, pending: org.pending, lastSeen, selfRows, counterpartRows, completeHistory }),
    [threadId, org, lastSeen, selfRows, counterpartRows, completeHistory],
  );
  const seen = useCallback((counterpartId: string) => {
    markSeen(threadId, counterpartId);
    setLastSeen(readLastSeen(threadId));
  }, [threadId]);
  return { channels, status, seen, loadEarlier: () => setSegments((count) => count + SEGMENTS), refresh };
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
  const { channels, status, seen, loadEarlier } = useChannels(threadId);
  const navigate = useBbNavigate();
  const requested = typeof params === "object" && params !== null ? (params as { counterpart?: unknown }).counterpart : undefined;
  const [active, setActive] = useState<string | null>(typeof requested === "string" ? requested : null);
  const sidebar = useSidebarThreads();
  const selfTitle = sidebar.threads.find((thread) => thread.id === threadId)?.displayTitle ?? "This thread";
  const current = channels.find((channel) => channel.counterpartId === active) ?? channels[0];

  // "Open channel" reuses an already-open panel, so follow each new request.
  useEffect(() => {
    if (typeof requested === "string") setActive(requested);
  }, [params, requested]);

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
          <button type="button" className="dp-link dp-earlier" onClick={loadEarlier}>Load earlier messages</button>
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
    () => (threadId ? sidebar.threads.filter((thread) => thread.parentThreadId === threadId && thread.hasPendingInteraction && !thread.isArchived) : []),
    [sidebar, threadId],
  );
  const waitingKey = waiting.map((thread) => thread.id).join(",");

  useEffect(() => {
    if (!threadId || waiting.length === 0) return;
    const controller = new AbortController();
    void conversationRows(sdk, threadId, 10, controller.signal).then((rows) => {
      const latest = new Map<string, string>();
      for (const [id, messages] of incoming(rows)) {
        const notice = [...messages].reverse().find((message) => message.dir === "needs-you");
        if (notice) latest.set(id, notice.text);
      }
      setQuestions(latest);
    }, () => undefined);
    return () => controller.abort();
    // waitingKey stands in for waiting.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sdk, threadId, waitingKey]);

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
            onClick={() => navigate.openThreadPanel({ actionId: DISPATCH_ACTION_ID, title: "Dispatch", params: { counterpart: thread.id } })}
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
  const attention = sidebar.threads.some((thread) => thread.parentThreadId === threadId && thread.hasPendingInteraction && !thread.isArchived);
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
