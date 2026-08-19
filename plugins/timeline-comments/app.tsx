import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { ChatFeedback01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import {
  definePluginApp,
  useComposer,
  useRealtime,
  useRealtimeConnectionState,
  useRpc,
  type PluginThreadPanelProps,
} from "@get-bb/plugin-sdk/app";
import type {
  TimelineCommentThreadSummary,
  timelineCommentsRpcContract,
} from "./server.js";
import {
  beginTimelineComment,
  focusTimelineComment,
  getTimelineCommentAnchorHealth,
  refreshTimelineCommentAnchors,
  registerTimelineCommentThreadWindow,
  subscribeTimelineCommentAnchorHealth,
  subscribeTimelineCommentHandoff,
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

function threadWindowForNode(node: HTMLElement | null): HTMLElement | null {
  return (
    node?.closest<HTMLElement>("[data-thread-window]") ??
    document.querySelector<HTMLElement>(
      '[data-split-pane-id][data-focused="true"] [data-thread-window]',
    ) ??
    (document.querySelectorAll<HTMLElement>("[data-thread-window]").length === 1
      ? document.querySelector<HTMLElement>("[data-thread-window]")
      : null)
  );
}

function TimelineCommentHandoffBridge() {
  const rpc = useRpc<typeof timelineCommentsRpcContract>();
  const composer = useComposer();
  const composerRef = useRef(composer);
  const root = useRef<HTMLSpanElement>(null);
  const requestGeneration = useRef(0);
  const requestPending = useRef(false);
  const threadId =
    composer.scope.kind === "thread" ? composer.scope.threadId : null;
  useLayoutEffect(() => {
    composerRef.current = composer;
  }, [composer]);

  useLayoutEffect(() => {
    if (threadId === null) return;
    const generation = ++requestGeneration.current;
    let mounted = true;
    const threadWindow = threadWindowForNode(root.current);
    if (threadWindow === null) return;
    const unregisterWindow = registerTimelineCommentThreadWindow(
      threadId,
      threadWindow,
    );
    const unregisterHandoff = subscribeTimelineCommentHandoff({
      threadId,
      getThreadWindow: () => threadWindow,
      accept: async () => {
        if (requestPending.current) return false;
        requestPending.current = true;
        try {
          const summary = await rpc.call("getThreadHandoffSummary", {
            bbThreadId: threadId,
          });
          if (
            !mounted ||
            generation !== requestGeneration.current ||
            summary.threadCount === 0
          ) {
            return false;
          }
          composerRef.current.insertMention({
            provider: "thread-comments",
            id: threadId,
            label: `${summary.commentCount} ${summary.commentCount === 1 ? "comment" : "comments"} from ${summary.threadCount} open ${summary.threadCount === 1 ? "thread" : "threads"}`,
          });
          composerRef.current.focus();
          return true;
        } catch {
          return false;
        } finally {
          if (generation === requestGeneration.current) {
            requestPending.current = false;
          }
        }
      },
    });
    return () => {
      mounted = false;
      requestGeneration.current += 1;
      requestPending.current = false;
      unregisterHandoff();
      unregisterWindow();
    };
  }, [rpc, threadId]);

  return <span ref={root} hidden aria-hidden="true" />;
}

function AddCommentsAction() {
  const rpc = useRpc<typeof timelineCommentsRpcContract>();
  const composer = useComposer();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const requestGeneration = useRef(0);
  const threadId =
    composer.scope.kind === "thread" ? composer.scope.threadId : null;
  const currentThreadId = useRef(threadId);

  useLayoutEffect(() => {
    currentThreadId.current = threadId;
    requestGeneration.current += 1;
    setBusy(false);
    setError(null);
    setNotice(null);
    return () => {
      currentThreadId.current = null;
      requestGeneration.current += 1;
    };
  }, [threadId]);

  useRealtime("comments-changed", (payload) => {
    if (
      typeof payload === "object" &&
      payload !== null &&
      (payload as { bbThreadId?: unknown }).bbThreadId === threadId
    ) {
      setNotice(null);
      refreshTimelineCommentAnchors();
    }
  });

  const addComments = useCallback(async () => {
    if (threadId === null) return;
    const generation = ++requestGeneration.current;
    const isCurrentRequest = () =>
      generation === requestGeneration.current &&
      currentThreadId.current === threadId;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const summary = await rpc.call("getThreadHandoffSummary", {
        bbThreadId: threadId,
      });
      if (!isCurrentRequest()) return;
      if (summary.threadCount === 0) {
        setNotice("No open comments");
        return;
      }
      composer.insertMention({
        provider: "thread-comments",
        id: threadId,
        label: `${summary.commentCount} ${summary.commentCount === 1 ? "comment" : "comments"} from ${summary.threadCount} open ${summary.threadCount === 1 ? "thread" : "threads"}`,
      });
      composer.focus();
    } catch (caught) {
      if (isCurrentRequest()) setError(errorMessage(caught));
    } finally {
      if (isCurrentRequest()) setBusy(false);
    }
  }, [composer, rpc, threadId]);

  if (threadId === null) return null;

  const actionLabel =
    error === null
      ? "Add comments to chat"
      : "Retry adding comments to chat";
  const tooltipLabel =
    error === null ? actionLabel : `${actionLabel}: ${error}`;

  return (
    <span className="bb-comments-composer-action-wrap">
      {error !== null ? (
        <span className="bb-comments-composer-action-error" role="alert">
          Couldn’t add comments
        </span>
      ) : null}
      {notice !== null ? (
        <span className="bb-comments-composer-action-status" role="status">
          {notice}
        </span>
      ) : null}
      <TooltipPrimitive.Provider delayDuration={250}>
        <TooltipPrimitive.Root>
          <TooltipPrimitive.Trigger asChild>
            <button
              type="button"
              className="bb-comments-composer-action"
              aria-label={actionLabel}
              disabled={busy}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => void addComments()}
            >
              <span className="bb-comments-composer-action-icon">
                <HugeiconsIcon
                  icon={ChatFeedback01Icon}
                  aria-hidden="true"
                  data-icon="ChatFeedback"
                />
              </span>
            </button>
          </TooltipPrimitive.Trigger>
          <TooltipPrimitive.Portal>
            <TooltipPrimitive.Content
              className="bb-comments-composer-action-tooltip"
              side="top"
              sideOffset={7}
              collisionPadding={8}
            >
              {tooltipLabel}
            </TooltipPrimitive.Content>
          </TooltipPrimitive.Portal>
        </TooltipPrimitive.Root>
      </TooltipPrimitive.Provider>
    </span>
  );
}

function CommentPanel({ threadId }: PluginThreadPanelProps) {
  const rpc = useRpc<typeof timelineCommentsRpcContract>();
  const connection = useRealtimeConnectionState();
  const anchorHealth = useSyncExternalStore(
    subscribeTimelineCommentAnchorHealth,
    getTimelineCommentAnchorHealth,
    getTimelineCommentAnchorHealth,
  );
  const previousConnection = useRef(connection);
  const revealRequest = useRef(0);
  const loadGeneration = useRef(0);
  const [filter, setFilter] = useState<Filter>("open");
  const loadScope = useRef({ filter, threadId });
  const [threads, setThreads] = useState<TimelineCommentThreadSummary[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [unanchored, setUnanchored] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useLayoutEffect(() => {
    loadScope.current = { filter, threadId };
    loadGeneration.current += 1;
    return () => {
      loadGeneration.current += 1;
    };
  }, [filter, threadId]);

  const loadThreads = useCallback(
    async (append = false) => {
      if (
        loadScope.current.threadId !== threadId ||
        loadScope.current.filter !== filter
      )
        return;
      const generation = ++loadGeneration.current;
      const cursor = append ? nextCursor : null;
      const isCurrentLoad = () =>
        generation === loadGeneration.current &&
        loadScope.current.threadId === threadId &&
        loadScope.current.filter === filter;
      setLoading(true);
      setError(null);
      if (!append) {
        setThreads([]);
        setNextCursor(null);
      }
      try {
        const page = await rpc.call("listCommentThreads", {
          bbThreadId: threadId,
          filter,
          ...(cursor !== null ? { cursor } : {}),
        });
        if (!isCurrentLoad()) return;
        setThreads((current) =>
          append ? [...current, ...page.threads] : page.threads,
        );
        setNextCursor(page.nextCursor);
      } catch (caught) {
        if (!isCurrentLoad()) return;
        setError(errorMessage(caught));
      } finally {
        if (isCurrentLoad()) setLoading(false);
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
      const anchored = await focusTimelineComment(item);
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
  app.contentScripts.register({
    id: "timeline-comment-anchors",
    mount: mountTimelineCommentsController,
  });
  app.composer.customize({
    id: "timeline-comments",
    scopes: ["thread"],
    actions: [{ id: "add-comments", component: AddCommentsAction }],
    banners: [
      {
        id: "comment-handoff-bridge",
        chrome: "bare",
        component: TimelineCommentHandoffBridge,
      },
    ],
  });
  app.slots.threadPanelAction({
    id: "comments",
    title: "Comments List",
    icon: "ChatFeedback",
    component: CommentPanel,
    layout: "flush",
  });
  app.slots.messageAction({
    id: "comment-selection",
    title: "Comment",
    icon: "ChatFeedback",
    run(context) {
      if (context.selectedText === undefined) {
        context.openPanel({ actionId: "comments", title: "Comments List" });
      } else {
        beginTimelineComment(context);
      }
    },
  });
});
