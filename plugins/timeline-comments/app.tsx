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

function AddCommentsAction() {
  const rpc = useRpc<typeof timelineCommentsRpcContract>();
  const composer = useComposer();
  const [busy, setBusy] = useState(false);
  const threadId =
    composer.scope.kind === "thread" ? composer.scope.threadId : null;

  if (threadId === null) return null;

  const addComments = async () => {
    setBusy(true);
    try {
      const summary = await rpc.call("getThreadHandoffSummary", {
        bbThreadId: threadId,
      });
      if (summary.threadCount === 0) return;
      composer.insertMention({
        provider: "thread-comments",
        id: threadId,
        label: `${summary.commentCount} ${summary.commentCount === 1 ? "comment" : "comments"} from ${summary.threadCount} open ${summary.threadCount === 1 ? "thread" : "threads"}`,
      });
      composer.focus();
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      className="bb-comments-composer-action"
      aria-label="Add comments to chat"
      title="Add comments to chat"
      disabled={busy}
      onMouseDown={(event) => event.preventDefault()}
      onClick={() => void addComments()}
    >
      <MessageSquareText aria-hidden="true" size={16} strokeWidth={1.5} />
    </button>
  );
}

function CommentPanel({ threadId, revealMessage }: PluginThreadPanelProps) {
  const rpc = useRpc<typeof timelineCommentsRpcContract>();
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    await loadThreads(false);
  }, [loadThreads]);

  useEffect(() => {
    setActiveId(null);
    void loadThreads(false);
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

  return (
    <section className="bb-comments-panel" aria-label="Timeline comments">
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
    actions: [{ id: "add-comments", component: AddCommentsAction }],
  });
  app.slots.threadPanelAction({
    id: "comments",
    title: "Comments",
    icon: "MessageSquare",
    component: CommentPanel,
    layout: "flush",
  });
  app.slots.experimental_messageAction({
    id: "comment-selection",
    title: "Comment",
    icon: "MessageSquare",
    placements: ["selection-menu"],
    run(context) {
      beginTimelineComment(context);
    },
  });
});
