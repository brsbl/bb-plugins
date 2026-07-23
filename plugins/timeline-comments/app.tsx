import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { MessageSquareText } from "lucide-react";
import {
  definePluginApp,
  useBbNavigate,
  useComposer,
  useRealtime,
  useRealtimeConnectionState,
  useRpc,
  type PluginThreadPanelProps,
} from "@bb/plugin-sdk/app";
import type {
  TimelineCommentThreadSummary,
  timelineCommentsRpcContract,
} from "./server.js";
import {
  beginTimelineComment,
  focusTimelineComment,
  getTimelineCommentAnchorHealth,
  subscribeTimelineCommentAnchorHealth,
} from "./bridge.js";
import { mountTimelineCommentsController } from "./controller.js";
import "./app.css";

type Filter = "open" | "resolved" | "all";

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong";
}

function excerpt(value: string, length: number): string {
  return value.length > length ? `${value.slice(0, length - 1)}…` : value;
}

function OpenCommentsAction() {
  const navigate = useBbNavigate();
  const openThreadPanel = navigate.experimental_openThreadPanel;

  if (typeof openThreadPanel !== "function") return null;

  return (
    <button
      type="button"
      className="bb-comments-composer-action"
      aria-label="Open comments"
      title="Open comments"
      onMouseDown={(event) => event.preventDefault()}
      onClick={() =>
        openThreadPanel({
          actionId: "comments",
          title: "Comments",
        })
      }
    >
      <MessageSquareText aria-hidden="true" size={16} strokeWidth={1.5} />
    </button>
  );
}

function CommentPanel({ threadId, revealMessage }: PluginThreadPanelProps) {
  const rpc = useRpc<typeof timelineCommentsRpcContract>();
  const composer = useComposer();
  const connection = useRealtimeConnectionState();
  const anchorHealth = useSyncExternalStore(
    subscribeTimelineCommentAnchorHealth,
    getTimelineCommentAnchorHealth,
    getTimelineCommentAnchorHealth,
  );
  const previousConnection = useRef(connection);
  const revealRequest = useRef(0);
  const [filter, setFilter] = useState<Filter>("open");
  const [threads, setThreads] = useState<TimelineCommentThreadSummary[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [unanchored, setUnanchored] = useState<Set<string>>(new Set());
  const [summary, setSummary] = useState({ threadCount: 0, commentCount: 0 });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSummary = useCallback(async () => {
    try {
      const result = await rpc.call("getThreadHandoffSummary", {
        bbThreadId: threadId,
      });
      setSummary({
        threadCount: result.threadCount,
        commentCount: result.commentCount,
      });
    } catch (caught) {
      setError(errorMessage(caught));
    }
  }, [rpc, threadId]);

  const loadThreads = useCallback(
    async (append = false) => {
      setLoading(true);
      setError(null);
      try {
        const cursor = append ? nextCursor : null;
        const page = await rpc.call("listCommentThreads", {
          bbThreadId: threadId,
          filter,
          ...(cursor !== null ? { cursor } : {}),
        });
        setThreads((current) =>
          append ? [...current, ...page.threads] : page.threads,
        );
        setNextCursor(page.nextCursor);
      } catch (caught) {
        setError(errorMessage(caught));
      } finally {
        setLoading(false);
      }
    },
    [filter, nextCursor, rpc, threadId],
  );

  const reconcile = useCallback(async () => {
    await Promise.all([loadThreads(false), loadSummary()]);
  }, [loadSummary, loadThreads]);

  useEffect(() => {
    setActiveId(null);
    void Promise.all([loadThreads(false), loadSummary()]);
  }, [filter, threadId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(
    () => () => {
      revealRequest.current += 1;
    },
    [threadId],
  );

  useRealtime("comments-changed", (payload) => {
    if (
      typeof payload === "object" &&
      payload !== null &&
      (payload as { bbThreadId?: unknown }).bbThreadId === threadId
    ) {
      void reconcile();
    }
  });

  useEffect(() => {
    const previous = previousConnection.current;
    previousConnection.current = connection;
    if (connection === "connected" && previous === "reconnecting")
      void reconcile();
  }, [connection, reconcile]);

  const activate = async (item: TimelineCommentThreadSummary) => {
    const request = ++revealRequest.current;
    setActiveId(item.id);
    setError(null);
    try {
      const revealed = await revealMessage(item.messageId);
      if (request !== revealRequest.current) return;
      const anchored =
        revealed === "revealed" && (await focusTimelineComment(item.id));
      if (request !== revealRequest.current) return;
      setUnanchored((current) => {
        const next = new Set(current);
        if (anchored) next.delete(item.id);
        else next.add(item.id);
        return next;
      });
    } catch (caught) {
      if (request === revealRequest.current) setError(errorMessage(caught));
    }
  };

  const addAll = async () => {
    setBusy(true);
    setError(null);
    try {
      const latest = await rpc.call("getThreadHandoffSummary", {
        bbThreadId: threadId,
      });
      if (latest.threadCount === 0)
        throw new Error("There are no open comments to add");
      if (
        composer.scope.kind !== "thread" ||
        composer.scope.threadId !== threadId
      ) {
        throw new Error("The current thread composer is not available");
      }
      composer.insertMention({
        provider: "thread-comments",
        id: threadId,
        label: `${latest.commentCount} comments from ${latest.threadCount} open ${latest.threadCount === 1 ? "thread" : "threads"}`,
      });
      composer.focus();
      setSummary({
        threadCount: latest.threadCount,
        commentCount: latest.commentCount,
      });
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="bb-comments-panel" aria-label="Timeline comments">
      <header className="bb-comments-panel-header">
        <div>
          <h2>Comments</h2>
          <p>
            {summary.commentCount} open{" "}
            {summary.commentCount === 1 ? "comment" : "comments"}
          </p>
        </div>
        {summary.threadCount > 0 ? (
          <button
            type="button"
            className="bb-comments-primary"
            disabled={busy}
            onClick={() => void addAll()}
          >
            Add all to chat
          </button>
        ) : null}
      </header>

      <div
        className="bb-comments-filters"
        role="group"
        aria-label="Comment state"
      >
        {(["open", "resolved", "all"] as const).map((value) => (
          <button
            type="button"
            aria-pressed={filter === value}
            key={value}
            onClick={() => setFilter(value)}
          >
            {value[0]!.toUpperCase() + value.slice(1)}
          </button>
        ))}
      </div>

      {error !== null ? (
        <div className="bb-comments-panel-error" role="status">
          {error}
        </div>
      ) : null}
      <div className="bb-comments-panel-list">
        {!loading && threads.length === 0 ? (
          <div className="bb-comments-empty">
            No {filter === "all" ? "" : `${filter} `}comments.
          </div>
        ) : null}
        {threads.map((item) => {
          return (
            <article
              className="bb-comments-panel-row"
              data-active={activeId === item.id ? "true" : undefined}
              key={item.id}
            >
              <button
                type="button"
                className="bb-comments-row-summary"
                onClick={() => void activate(item)}
              >
                <span className="bb-comments-row-source">
                  “{excerpt(item.selector.exact, 90)}”
                </span>
                <span className="bb-comments-row-body">
                  {excerpt(item.rootComment.body, 140)}
                </span>
                <span className="bb-comments-row-meta">
                  {item.replyCount}{" "}
                  {item.replyCount === 1 ? "reply" : "replies"}
                  {item.resolvedAt !== null ? " · Resolved" : ""}
                  {unanchored.has(item.id) ||
                  anchorHealth.get(item.id) === "unanchored"
                    ? " · Unanchored"
                    : ""}
                </span>
              </button>
            </article>
          );
        })}
        {loading ? <div className="bb-comments-loading">Loading…</div> : null}
        {!loading && nextCursor !== null ? (
          <button
            type="button"
            className="bb-comments-load-more"
            onClick={() => void loadThreads(true)}
          >
            Load more
          </button>
        ) : null}
      </div>
    </section>
  );
}

export default definePluginApp((app) => {
  app.experimental_contentScripts.register({
    id: "timeline-comment-anchors",
    mount: mountTimelineCommentsController,
  });
  app.composer.customize({
    id: "timeline-comments",
    scopes: ["thread"],
    actions: [{ id: "open-comments", component: OpenCommentsAction }],
  });
  app.slots.threadPanelAction({
    id: "comments",
    title: "Comments",
    icon: "Comment01",
    component: CommentPanel,
    layout: "flush",
  });
  app.slots.experimental_messageAction({
    id: "comment-selection",
    title: "Comment",
    icon: "Comment01",
    placements: ["selection-menu"],
    run(context) {
      beginTimelineComment(context);
    },
  });
});
