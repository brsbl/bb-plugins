import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
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
  TimelineComment,
  TimelineCommentThreadDetail,
  TimelineCommentThreadSummary,
  timelineCommentsRpcContract,
} from "./server.js";
import {
  beginTimelineComment,
  focusTimelineComment,
  getTimelineCommentAnchorHealth,
  subscribeTimelineCommentAnchorHealth,
} from "./bridge.js";
import { commentBodyError } from "./comment-body.js";
import { createIndividualHandoffPrompt } from "./handoff.js";
import { mountTimelineCommentsController } from "./controller.js";
import "./app.css";

type Filter = "open" | "resolved" | "all";

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong";
}

function excerpt(value: string, length: number): string {
  return value.length > length ? `${value.slice(0, length - 1)}…` : value;
}

function CommentPanel({ threadId, revealMessage }: PluginThreadPanelProps) {
  const rpc = useRpc<typeof timelineCommentsRpcContract>();
  const composer = useComposer();
  const navigate = useBbNavigate();
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
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<TimelineCommentThreadDetail | null>(
    null,
  );
  const [editingComment, setEditingComment] = useState<{
    id: string;
    body: string;
  } | null>(null);
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

  const loadDetail = useCallback(
    async (commentThreadId: string, cursor?: string) => {
      const page = await rpc.call("getCommentThread", {
        bbThreadId: threadId,
        commentThreadId,
        ...(cursor !== undefined ? { cursor } : {}),
      });
      setDetail((current) =>
        cursor !== undefined && current?.thread.id === commentThreadId
          ? { ...page, comments: [...current.comments, ...page.comments] }
          : page,
      );
      return page;
    },
    [rpc, threadId],
  );

  const reconcile = useCallback(async () => {
    await Promise.all([loadThreads(false), loadSummary()]);
    if (expandedId !== null) {
      try {
        await loadDetail(expandedId);
      } catch {
        setExpandedId(null);
        setDetail(null);
      }
    }
  }, [expandedId, loadDetail, loadSummary, loadThreads]);

  useEffect(() => {
    setExpandedId(null);
    setDetail(null);
    setEditingComment(null);
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
    setExpandedId(item.id);
    setError(null);
    try {
      await loadDetail(item.id);
      if (request !== revealRequest.current) return;
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

  const mutate = async (operation: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try {
      await operation();
      await reconcile();
    } catch (caught) {
      setError(errorMessage(caught));
      if (/changed/iu.test(errorMessage(caught))) await reconcile();
    } finally {
      setBusy(false);
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

  const saveEditedComment = async (comment: TimelineComment) => {
    if (editingComment?.id !== comment.id) return;
    if (editingComment.body === comment.body) {
      setEditingComment(null);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const updated = await rpc.call("updateComment", {
        bbThreadId: threadId,
        commentId: comment.id,
        expectedVersion: comment.version,
        body: editingComment.body,
      });
      setDetail(updated);
      setEditingComment(null);
      await reconcile();
    } catch (caught) {
      const message = errorMessage(caught);
      setError(message);
      if (/changed/iu.test(message)) {
        await reconcile();
        setEditingComment(null);
      }
    } finally {
      setBusy(false);
    }
  };

  const deleteComment = (comment: TimelineComment) => {
    if (
      !window.confirm(
        comment.parentId === null
          ? "Delete this comment thread?"
          : "Delete this reply?",
      )
    )
      return;
    void mutate(async () => {
      const result = await rpc.call("deleteComment", {
        bbThreadId: threadId,
        commentId: comment.id,
        expectedVersion: comment.version,
      });
      if (result.deletedThreadId !== null) {
        setExpandedId(null);
        setDetail(null);
      } else {
        setDetail(result.thread);
      }
    });
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
          const isExpanded = expandedId === item.id;
          const itemDetail =
            isExpanded && detail?.thread.id === item.id ? detail : null;
          return (
            <article className="bb-comments-panel-row" key={item.id}>
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
              {itemDetail !== null ? (
                <div className="bb-comments-panel-thread">
                  {itemDetail.comments.map((comment) => (
                    <div className="bb-comments-panel-comment" key={comment.id}>
                      {editingComment?.id === comment.id ? (
                        <form
                          className="bb-comments-panel-edit"
                          onSubmit={(event) => {
                            event.preventDefault();
                            void saveEditedComment(comment);
                          }}
                        >
                          <textarea
                            aria-label="Edit comment"
                            autoFocus
                            maxLength={20_000}
                            value={editingComment.body}
                            onChange={(event) =>
                              setEditingComment({
                                id: comment.id,
                                body: event.target.value,
                              })
                            }
                          />
                          <div>
                            <button
                              type="button"
                              onClick={() => setEditingComment(null)}
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              disabled={
                                busy ||
                                editingComment.body === comment.body ||
                                commentBodyError(editingComment.body) !== null
                              }
                            >
                              Save
                            </button>
                          </div>
                        </form>
                      ) : (
                        <>
                          <p>{comment.body}</p>
                          <div>
                            <button
                              type="button"
                              onClick={() =>
                                navigate.toCompose({
                                  initialPrompt: createIndividualHandoffPrompt(
                                    comment.body,
                                    itemDetail.thread.selector.exact,
                                  ),
                                  focusPrompt: true,
                                })
                              }
                            >
                              Send to agent
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setEditingComment({
                                  id: comment.id,
                                  body: comment.body,
                                })
                              }
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="bb-comments-destructive"
                              onClick={() => deleteComment(comment)}
                            >
                              Delete
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                  {itemDetail.nextCursor !== null ? (
                    <button
                      type="button"
                      className="bb-comments-load-more"
                      onClick={() =>
                        void loadDetail(
                          item.id,
                          itemDetail.nextCursor ?? undefined,
                        )
                      }
                    >
                      Load more replies
                    </button>
                  ) : null}
                  {itemDetail.thread.resolvedAt === null ? (
                    <ReplyForm
                      disabled={busy}
                      onReply={(body) =>
                        mutate(async () => {
                          const updated = await rpc.call("reply", {
                            bbThreadId: threadId,
                            commentThreadId: item.id,
                            body,
                          });
                          setDetail(updated);
                        })
                      }
                    />
                  ) : null}
                  <button
                    type="button"
                    className="bb-comments-resolve"
                    disabled={busy}
                    onClick={() =>
                      void mutate(async () => {
                        const updated = await rpc.call("setThreadResolved", {
                          bbThreadId: threadId,
                          commentThreadId: item.id,
                          expectedVersion: itemDetail.thread.version,
                          resolved: itemDetail.thread.resolvedAt === null,
                        });
                        setDetail(updated);
                      })
                    }
                  >
                    {itemDetail.thread.resolvedAt === null
                      ? "Resolve thread"
                      : "Reopen thread"}
                  </button>
                </div>
              ) : null}
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

function ReplyForm({
  disabled,
  onReply,
}: {
  disabled: boolean;
  onReply(body: string): Promise<unknown>;
}) {
  const [body, setBody] = useState("");
  return (
    <form
      className="bb-comments-panel-reply"
      onSubmit={(event) => {
        event.preventDefault();
        void onReply(body).then(() => setBody(""));
      }}
    >
      <textarea
        value={body}
        placeholder="Reply…"
        maxLength={20_000}
        onChange={(event) => setBody(event.target.value)}
      />
      <button
        type="submit"
        className="bb-comments-primary"
        disabled={disabled || commentBodyError(body) !== null}
      >
        Reply
      </button>
    </form>
  );
}

export default definePluginApp((app) => {
  app.experimental_contentScripts.register({
    id: "timeline-comment-anchors",
    mount: mountTimelineCommentsController,
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
