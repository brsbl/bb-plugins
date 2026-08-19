/**
 * BB transport adapter for Moss's CommentPopover and CommentMessage model.
 * Keep interaction state and transitions in
 * sync with packages/desktop/src/renderer/editor/components in the Moss repo;
 * only the persisted comment shape and RPC calls are BB-specific here.
 */
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal, flushSync } from "react-dom";
import { createRoot, type Root } from "react-dom/client";
import {
  CheckCheck,
  MessageSquareText,
  MoreHorizontal,
  Pencil,
  Send,
  Trash2,
  X,
} from "lucide-react";
import type { PluginRpcClient } from "@bb/plugin-sdk/app";
import {
  experimental_CompactComposer,
  type CompactComposerValue,
} from "@get-bb/plugin-sdk/app";
import type {
  TimelineComment,
  TimelineCommentThreadDetail,
  timelineCommentsRpcContract,
} from "./server.js";
import { commentBodyError } from "./comment-body.js";
import {
  commentValuesEqual,
  emptyCommentValue,
  readCommentDraft,
  trimCommentValue,
  writeCommentDraft,
} from "./comment-value.js";

type Rpc = PluginRpcClient<typeof timelineCommentsRpcContract>;

const MODE_TRANSITION = {
  duration: 150,
  easing: "cubic-bezier(0.22, 1, 0.36, 1)",
} as const;

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong";
}

function isChangedStateError(error: unknown): boolean {
  return /\bchanged\b/iu.test(errorMessage(error));
}

async function reloadCompleteThread(
  rpc: Rpc,
  current: TimelineCommentThreadDetail,
): Promise<TimelineCommentThreadDetail | null> {
  let listCursor: string | undefined;
  let found = false;
  do {
    const page = await rpc.call("listCommentThreads", {
      bbThreadId: current.thread.bbThreadId,
      filter: "all",
      ...(listCursor === undefined ? {} : { cursor: listCursor }),
    });
    found = page.threads.some(({ id }) => id === current.thread.id);
    listCursor = page.nextCursor ?? undefined;
  } while (!found && listCursor !== undefined);
  if (!found) return null;

  let detail: TimelineCommentThreadDetail | null = null;
  let commentCursor: string | undefined;
  do {
    const page = await rpc.call("getCommentThread", {
      bbThreadId: current.thread.bbThreadId,
      commentThreadId: current.thread.id,
      ...(commentCursor === undefined ? {} : { cursor: commentCursor }),
    });
    detail =
      detail === null
        ? page
        : { ...page, comments: [...detail.comments, ...page.comments] };
    commentCursor = page.nextCursor ?? undefined;
  } while (commentCursor !== undefined);
  return detail;
}

function focusAdjacentToActionsTrigger(
  trigger: HTMLButtonElement,
  backwards: boolean,
): boolean {
  const focusable = [
    ...document.querySelectorAll<HTMLElement>(
      'button:not(:disabled), textarea:not(:disabled), input:not(:disabled), [href], [tabindex]:not([tabindex="-1"])',
    ),
  ].filter(
    (node) =>
      node.getClientRects().length > 0 &&
      node.closest('[aria-hidden="true"], [inert], [hidden]') === null &&
      node.closest(".bb-comments-actions-popover") === null,
  );
  const current = focusable.indexOf(trigger);
  const adjacent = focusable[current + (backwards ? -1 : 1)];
  if (adjacent === undefined) return false;
  adjacent.focus({ preventScroll: true });
  return true;
}

function actionsTriggerIsFullyVisible(trigger: HTMLButtonElement): boolean {
  const scrollViewport = trigger.closest<HTMLElement>(
    ".bb-comments-thread-comments",
  );
  if (scrollViewport === null) return true;
  const triggerRect = trigger.getBoundingClientRect();
  const viewportRect = scrollViewport.getBoundingClientRect();
  return (
    triggerRect.top >= viewportRect.top &&
    triggerRect.bottom <= viewportRect.bottom
  );
}

function reducedMotion(): boolean {
  return (
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function relativeTime(value: number): string {
  const elapsed = Math.max(0, Date.now() - value);
  if (elapsed < 60_000) return "just now";
  if (elapsed < 3_600_000) {
    const minutes = Math.floor(elapsed / 60_000);
    return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
  }
  if (elapsed < 86_400_000) {
    const hours = Math.floor(elapsed / 3_600_000);
    return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  }
  const days = Math.floor(elapsed / 86_400_000);
  return `${days} ${days === 1 ? "day" : "days"} ago`;
}

function absoluteTime(value: number): string {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
}

function useMeasuredModeTransition(
  elementRef: React.RefObject<HTMLElement | null>,
  active: boolean,
): (update: () => void) => void {
  const startHeightRef = useRef<number | null>(null);
  const animationRef = useRef<Animation | null>(null);
  const cleanupTimerRef = useRef<number | null>(null);

  const run = useCallback(
    (update: () => void) => {
      const element = elementRef.current;
      if (!element || typeof element.animate !== "function" || reducedMotion()) {
        update();
        return;
      }
      if (cleanupTimerRef.current !== null) {
        window.clearTimeout(cleanupTimerRef.current);
        cleanupTimerRef.current = null;
      }
      animationRef.current?.cancel();
      animationRef.current = null;
      element.style.removeProperty("overflow");
      startHeightRef.current = element.getBoundingClientRect().height;
      update();
    },
    [elementRef],
  );

  useLayoutEffect(() => {
    const startHeight = startHeightRef.current;
    startHeightRef.current = null;
    const element = elementRef.current;
    if (startHeight === null || !element) return;
    const endHeight = element.getBoundingClientRect().height;
    if (Math.abs(endHeight - startHeight) < 0.5) return;
    element.style.overflow = "hidden";
    const animation = element.animate(
      [{ height: `${startHeight}px` }, { height: `${endHeight}px` }],
      MODE_TRANSITION,
    );
    animationRef.current = animation;
    const finish = () => {
      if (animationRef.current !== animation) return;
      animationRef.current = null;
      if (cleanupTimerRef.current !== null) {
        window.clearTimeout(cleanupTimerRef.current);
        cleanupTimerRef.current = null;
      }
      element.style.removeProperty("overflow");
    };
    animation.addEventListener("finish", finish, { once: true });
    cleanupTimerRef.current = window.setTimeout(() => {
      if (animationRef.current === animation) {
        animationRef.current = null;
        animation.cancel();
        element.style.removeProperty("overflow");
      }
      cleanupTimerRef.current = null;
    }, 200);
  }, [active, elementRef]);

  useEffect(
    () => () => {
      startHeightRef.current = null;
      if (cleanupTimerRef.current !== null)
        window.clearTimeout(cleanupTimerRef.current);
      animationRef.current?.cancel();
      elementRef.current?.style.removeProperty("overflow");
    },
    [elementRef],
  );

  return run;
}

interface HostCommentComposerProps {
  threadId: string;
  value: CompactComposerValue;
  onChange: (value: CompactComposerValue) => void;
  onSubmit: (value: CompactComposerValue) => void;
  placeholder: string;
  accessibleLabel: string;
  submitLabel: string;
  autoFocus?: boolean;
  onCancel?: () => void;
  submitPending?: boolean;
}

const CompactComposer = experimental_CompactComposer;

function HostCommentComposer({
  threadId,
  value,
  onChange,
  onSubmit,
  placeholder,
  accessibleLabel,
  submitLabel,
  autoFocus = false,
  onCancel,
  submitPending = false,
}: HostCommentComposerProps) {
  const validationMessage =
    value.text.trim() === "" ? null : commentBodyError(value.text);
  return (
    <CompactComposer
      threadId={threadId}
      value={value}
      onChange={onChange}
      onSubmit={onSubmit}
      onCancel={onCancel}
      isSubmitting={submitPending}
      disabled={commentBodyError(value.text) !== null}
      validationMessage={validationMessage}
      placeholder={placeholder}
      autoFocus={autoFocus}
      accessibleLabel={accessibleLabel}
      submitLabel={submitLabel}
      className="bb-comments-host-composer"
    />
  );
}

interface CommentMessageProps {
  threadId: string;
  comment: TimelineComment;
  isEditing: boolean;
  submitPending: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: (value: CompactComposerValue) => void;
  onDelete: () => void;
}

function CommentMessage({
  threadId,
  comment,
  isEditing,
  submitPending,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
}: CommentMessageProps) {
  const rowRef = useRef<HTMLElement | null>(null);
  const editDraftKey = `bb.timeline-comments.edit:${comment.id}`;
  const originalValue = useMemo<CompactComposerValue>(
    () => ({ text: comment.body, mentions: comment.mentions ?? [] }),
    [comment.body, comment.mentions],
  );
  const [editValue, setEditValue] = useState(
    () => readCommentDraft(editDraftKey) ?? originalValue,
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const menuTriggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const runModeTransition = useMeasuredModeTransition(rowRef, isEditing);
  const wasEditingRef = useRef(isEditing);
  const cancelEdit = useCallback(() => {
    sessionStorage.removeItem(editDraftKey);
    setEditValue(originalValue);
    onCancelEdit();
  }, [editDraftKey, onCancelEdit, originalValue]);

  useLayoutEffect(() => {
    if (wasEditingRef.current && !isEditing) {
      menuTriggerRef.current?.focus({ preventScroll: true });
    }
    wasEditingRef.current = isEditing;
  }, [isEditing]);

  useLayoutEffect(() => {
    const row = rowRef.current;
    if (!row || typeof row.animate !== "function" || reducedMotion()) return;
    row.animate(
      [
        { opacity: 0, transform: "translateY(-4px)" },
        { opacity: 1, transform: "translateY(0)" },
      ],
      MODE_TRANSITION,
    );
  }, []);

  useEffect(
    () => setEditValue(readCommentDraft(editDraftKey) ?? originalValue),
    [editDraftKey, originalValue],
  );
  useLayoutEffect(() => {
    if (!menuOpen) return;
    const close = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        (rowRef.current?.contains(event.target) || menuRef.current?.contains(event.target))
      ) return;
      setMenuOpen(false);
    };
    const closeOnFocus = (event: FocusEvent) => {
      if (
        event.target instanceof Node &&
        (rowRef.current?.contains(event.target) || menuRef.current?.contains(event.target))
      ) return;
      setMenuOpen(false);
    };
    const closeOnScroll = () => setMenuOpen(false);
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      setMenuOpen(false);
      menuTriggerRef.current?.focus({ preventScroll: true });
    };
    document.addEventListener("pointerdown", close, true);
    document.addEventListener("focusin", closeOnFocus, true);
    document.addEventListener("keydown", closeOnEscape, true);
    window.addEventListener("scroll", closeOnScroll, true);
    return () => {
      document.removeEventListener("pointerdown", close, true);
      document.removeEventListener("focusin", closeOnFocus, true);
      document.removeEventListener("keydown", closeOnEscape, true);
      window.removeEventListener("scroll", closeOnScroll, true);
    };
  }, [menuOpen]);

  useLayoutEffect(() => {
    if (!menuOpen) return;
    const trigger = menuTriggerRef.current;
    const menu = menuRef.current;
    if (!trigger || !menu) return;
    const rect = trigger.getBoundingClientRect();
    const menuRect = menu.getBoundingClientRect();
    setMenuPosition({
      top: Math.min(window.innerHeight - menuRect.height - 8, rect.bottom + 4),
      left: Math.max(8, Math.min(window.innerWidth - menuRect.width - 8, rect.right - menuRect.width)),
    });
    menu.querySelector<HTMLButtonElement>('[role="menuitem"]')?.focus({
      preventScroll: true,
    });
  }, [menuOpen]);

  const onMenuKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const items = [...event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="menuitem"]')];
    if (items.length === 0) return;
    const current = Math.max(0, items.indexOf(document.activeElement as HTMLButtonElement));
    let next: number | null = null;
    if (event.key === "ArrowDown") next = (current + 1) % items.length;
    if (event.key === "ArrowUp") next = (current - 1 + items.length) % items.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = items.length - 1;
    if (event.key === "Escape") {
      event.preventDefault();
      setMenuOpen(false);
      menuTriggerRef.current?.focus({ preventScroll: true });
      return;
    }
    if (event.key === "Tab") {
      const moved =
        menuTriggerRef.current !== null &&
        focusAdjacentToActionsTrigger(menuTriggerRef.current, event.shiftKey);
      if (moved) {
        event.preventDefault();
      }
      setMenuOpen(false);
      return;
    }
    if (next !== null) {
      event.preventDefault();
      items[next]?.focus({ preventScroll: true });
    }
  };

  const menuPortalTarget = rowRef.current?.closest<HTMLElement>(
    '[data-bb-plugin-decoration="timeline-comments"]',
  );

  return (
    <article
      ref={rowRef}
      className="bb-comments-comment comment-edit-surface"
      data-bb-comment-id={comment.id}
      data-comment-message="true"
      data-comment-editing={isEditing ? "true" : undefined}
      data-editing={isEditing ? "true" : undefined}
    >
      <header className="bb-comments-message-header" data-comment-message-header="true">
        <div>
          <strong>Me</strong>
          <time dateTime={new Date(comment.createdAt).toISOString()} title={absoluteTime(comment.createdAt)}>
            {relativeTime(comment.createdAt)}
          </time>
        </div>
        <div className="bb-comments-actions-menu">
          {isEditing ? (
            <button
              type="button"
              className="bb-comments-icon-control bb-comments-edit-cancel"
              aria-label="Cancel comment edit"
              disabled={submitPending}
              onClick={() => runModeTransition(cancelEdit)}
            >
              <X aria-hidden="true" />
            </button>
          ) : (
            <button
              ref={menuTriggerRef}
              type="button"
              className="bb-comments-icon-control"
              aria-label="Comment actions"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              onClick={() => {
                const trigger = menuTriggerRef.current;
                if (!menuOpen && trigger && !actionsTriggerIsFullyVisible(trigger)) {
                  return;
                }
                // Commit the portal and its layout-effect dismissal listeners
                // before native scrolling can run in the same interaction turn.
                flushSync(() => setMenuOpen((open) => !open));
              }}
            >
              <MoreHorizontal aria-hidden="true" />
            </button>
          )}
          {menuOpen && menuPortalTarget ? createPortal(
            <div
              ref={menuRef}
              className="bb-comments-actions-popover"
              role="menu"
              style={{ top: menuPosition.top, left: menuPosition.left }}
              onKeyDown={onMenuKeyDown}
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  runModeTransition(onStartEdit);
                }}
              >
                <Pencil aria-hidden="true" /> Edit
              </button>
              <button type="button" role="menuitem" className="bb-comments-destructive" onClick={onDelete}>
                <Trash2 aria-hidden="true" /> Delete
              </button>
            </div>,
            menuPortalTarget,
          ) : null}
        </div>
      </header>
      <div
        className="bb-comments-edit-composer"
        data-comment-edit-composer={isEditing ? "true" : undefined}
        data-comment-view-content={isEditing ? undefined : "true"}
      >
        {isEditing ? (
          <HostCommentComposer
            threadId={threadId}
            value={editValue}
            onChange={(value) => {
              setEditValue(value);
              if (commentValuesEqual(value, originalValue)) {
                sessionStorage.removeItem(editDraftKey);
              } else {
                writeCommentDraft(editDraftKey, value);
              }
            }}
            onSubmit={(value) => runModeTransition(() => onSaveEdit(value))}
            placeholder="Edit comment…"
            accessibleLabel="Edit comment"
            submitLabel="Save comment"
            autoFocus
            onCancel={() => runModeTransition(cancelEdit)}
            submitPending={submitPending}
          />
        ) : (
          <p className="bb-comments-comment-body">{comment.body}</p>
        )}
      </div>
    </article>
  );
}

interface MossCommentPopoverProps {
  rpc: Rpc;
  initialDetail: TimelineCommentThreadDetail;
  onClose: () => void;
  onChanged: () => void;
  onSendToAgent: () => void;
}

function MossCommentPopover({
  rpc,
  initialDetail,
  onClose,
  onChanged,
  onSendToAgent,
}: MossCommentPopoverProps) {
  const [detail, setDetail] = useState(initialDetail);
  const [editingId, setEditingId] = useState<string | null>(null);
  const replyDraftKey = `bb.timeline-comments.reply:${initialDetail.thread.id}`;
  const [replyValue, setReplyValue] = useState(
    () => readCommentDraft(replyDraftKey) ?? emptyCommentValue(),
  );
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);

  const recoverChangedState = async (caught: unknown): Promise<void> => {
    setError(errorMessage(caught));
    if (!isChangedStateError(caught)) return;
    try {
      const fresh = await reloadCompleteThread(rpc, detail);
      if (fresh === null) {
        onClose();
        onChanged();
        return;
      }
      setDetail(fresh);
      setEditingId((current) =>
        current !== null && fresh.comments.some(({ id }) => id === current)
          ? current
          : null,
      );
      onChanged();
    } catch (refreshError) {
      setError(errorMessage(refreshError));
    }
  };

  const mutate = async (operation: () => Promise<TimelineCommentThreadDetail>) => {
    if (busyRef.current) return null;
    busyRef.current = true;
    setBusy(true);
    setError(null);
    try {
      const fresh = await operation();
      setDetail(fresh);
      onChanged();
      return fresh;
    } catch (caught) {
      await recoverChangedState(caught);
      return null;
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const removeComment = async (comment: TimelineComment) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError(null);
    try {
      const result = await rpc.call("deleteComment", {
        bbThreadId: detail.thread.bbThreadId,
        commentId: comment.id,
        expectedVersion: comment.version,
        expectedThreadVersion: detail.thread.version,
      });
      if (result.thread === null) onClose();
      else setDetail(result.thread);
      onChanged();
    } catch (caught) {
      await recoverChangedState(caught);
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const startEdit = (comment: TimelineComment) => {
    setEditingId(comment.id);
  };
  const finishEdit = () => {
    setEditingId(null);
  };

  return (
    <div className="bb-comments-thread-inner moss-comment-popover">
      <header className="bb-comments-thread-header" data-comment-thread-header="true">
        <div className="bb-comments-thread-source">
          <MessageSquareText aria-hidden="true" />
          <span>Comment</span>
        </div>
        <div className="bb-comments-header-actions" data-comment-thread-actions="true">
          <button
            type="button"
            className="bb-comments-icon-control"
            aria-label={detail.thread.resolvedAt === null ? "Resolve thread" : "Reopen thread"}
            aria-pressed={detail.thread.resolvedAt !== null}
            disabled={busy}
            onClick={() =>
              void mutate(() =>
                rpc.call("setThreadResolved", {
                  bbThreadId: detail.thread.bbThreadId,
                  commentThreadId: detail.thread.id,
                  expectedVersion: detail.thread.version,
                  resolved: detail.thread.resolvedAt === null,
                }),
              )
            }
          >
            <CheckCheck aria-hidden="true" />
          </button>
          <button type="button" className="bb-comments-icon-control" aria-label="Send thread to agent" onClick={onSendToAgent}>
            <Send aria-hidden="true" />
          </button>
          <button
            type="button"
            className="bb-comments-icon-control bb-comments-destructive"
            aria-label="Delete thread"
            disabled={busy}
            onClick={() => {
              if (!window.confirm("Delete this comment thread?")) return;
              const rootComment = detail.comments.find((comment) => comment.parentId === null);
              if (!rootComment) return;
              void removeComment(rootComment);
            }}
          >
            <Trash2 aria-hidden="true" />
          </button>
        </div>
      </header>
      <div className="bb-comments-thread-comments comment-thread-scroll">
        {detail.comments.map((comment) => (
          <CommentMessage
            key={comment.id}
            threadId={detail.thread.bbThreadId}
            comment={comment}
            isEditing={editingId === comment.id}
            submitPending={busy}
            onStartEdit={() => startEdit(comment)}
            onCancelEdit={finishEdit}
            onSaveEdit={(value) => {
              const nextValue = trimCommentValue(value);
              const currentValue = {
                text: comment.body,
                mentions: comment.mentions ?? [],
              } satisfies CompactComposerValue;
              if (
                commentBodyError(nextValue.text) !== null ||
                commentValuesEqual(nextValue, currentValue)
              ) {
                sessionStorage.removeItem(
                  `bb.timeline-comments.edit:${comment.id}`,
                );
                finishEdit();
                return;
              }
              void mutate(() =>
                rpc.call("updateComment", {
                  bbThreadId: detail.thread.bbThreadId,
                  commentId: comment.id,
                  expectedVersion: comment.version,
                  body: nextValue.text,
                  mentions: [...nextValue.mentions],
                }),
              ).then((fresh) => {
                if (fresh) {
                  sessionStorage.removeItem(
                    `bb.timeline-comments.edit:${comment.id}`,
                  );
                  finishEdit();
                }
              });
            }}
            onDelete={() => {
              if (!window.confirm(comment.parentId === null ? "Delete this comment thread?" : "Delete this reply?")) return;
              void removeComment(comment);
            }}
          />
        ))}
      </div>
      {detail.thread.resolvedAt === null ? (
        <form
          className="bb-comments-reply comment-reply-region"
          data-comment-reply-region="true"
          data-editing={editingId ? "true" : "false"}
          aria-hidden={editingId ? true : undefined}
          inert={editingId ? true : undefined}
          onSubmit={(event) => event.preventDefault()}
        >
          <div className="bb-comments-reply-inner comment-reply-region-inner">
            <div
              className="bb-comments-inline-composer"
              data-bb-comment-reply-composer="true"
              data-comment-reply-composer="true"
              aria-hidden={editingId ? true : undefined}
              inert={editingId ? true : undefined}
            >
              <HostCommentComposer
                threadId={detail.thread.bbThreadId}
                value={replyValue}
                onChange={(value) => {
                  setReplyValue(value);
                  writeCommentDraft(replyDraftKey, value);
                }}
                onSubmit={(value) => {
                  const nextValue = trimCommentValue(value);
                  if (commentBodyError(nextValue.text) !== null) return;
                  void mutate(() =>
                    rpc.call("reply", {
                      bbThreadId: detail.thread.bbThreadId,
                      commentThreadId: detail.thread.id,
                      body: nextValue.text,
                      mentions: [...nextValue.mentions],
                    }),
                  ).then((fresh) => {
                    if (fresh) {
                      sessionStorage.removeItem(replyDraftKey);
                      setReplyValue(emptyCommentValue());
                    }
                  });
                }}
                placeholder="Reply..."
                accessibleLabel="Reply to comment thread"
                submitLabel="Reply"
                submitPending={busy}
              />
            </div>
          </div>
        </form>
      ) : null}
      {error ? <div className="bb-comments-error" role="status">{error}</div> : null}
    </div>
  );
}

export interface MountMossCommentPopoverOptions {
  rpc: Rpc;
  detail: TimelineCommentThreadDetail;
  onClose: () => void;
  onChanged: () => void;
  onSendToAgent: () => void;
}

export function mountMossCommentPopover(
  host: HTMLElement,
  options: MountMossCommentPopoverOptions,
): () => void {
  let root: Root | null = createRoot(host);
  flushSync(() => {
    root?.render(<MossCommentPopover initialDetail={options.detail} {...options} />);
  });
  return () => {
    root?.unmount();
    root = null;
  };
}

export interface MountMossCommentComposerOptions {
  bbThreadId: string;
  initialValue: CompactComposerValue;
  onChange: (value: CompactComposerValue) => void;
  onCancel: () => void;
  onSubmit: (value: CompactComposerValue) => Promise<void>;
}

function MossNewCommentComposer({
  bbThreadId,
  initialValue,
  onChange,
  onCancel,
  onSubmit,
}: MountMossCommentComposerOptions) {
  const [value, setValue] = useState(initialValue);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="bb-comments-new-comment-input" data-comment-new-composer="true">
      <HostCommentComposer
        threadId={bbThreadId}
        value={value}
        onChange={(next) => {
          setValue(next);
          onChange(next);
        }}
        onCancel={onCancel}
        onSubmit={(draft) => {
          const nextValue = trimCommentValue(draft);
          if (
            busyRef.current ||
            commentBodyError(nextValue.text) !== null
          ) {
            return;
          }
          busyRef.current = true;
          setBusy(true);
          setError(null);
          void onSubmit(nextValue)
            .catch((caught) =>
              setError(
                caught instanceof Error ? caught.message : "Something went wrong",
              ),
            )
            .finally(() => {
              busyRef.current = false;
              setBusy(false);
            });
        }}
        placeholder="Add a comment…"
        accessibleLabel="Add a comment"
        submitLabel="Add comment"
        autoFocus
        submitPending={busy}
      />
      {error ? <div className="bb-comments-error" role="status">{error}</div> : null}
    </div>
  );
}

export function mountMossCommentComposer(
  host: HTMLElement,
  options: MountMossCommentComposerOptions,
): () => void {
  let root: Root | null = createRoot(host);
  flushSync(() => {
    root?.render(<MossNewCommentComposer {...options} />);
  });
  return () => {
    root?.unmount();
    root = null;
  };
}
