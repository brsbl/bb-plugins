/**
 * BB transport adapter for Moss's CommentPopover, CommentMessage, and
 * CommentTextInput component model. Keep interaction state and transitions in
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
  Command,
  CornerDownLeft,
  MessageSquareText,
  MoreHorizontal,
  Pencil,
  Plus,
  Send,
  Trash2,
  X,
} from "lucide-react";
import type { PluginRpcClient } from "@bb/plugin-sdk/app";
import type {
  TimelineComment,
  TimelineCommentThreadDetail,
  timelineCommentsRpcContract,
} from "./server.js";
import { commentBodyError } from "./comment-body.js";

type Rpc = PluginRpcClient<typeof timelineCommentsRpcContract>;

const MODE_TRANSITION = {
  duration: 150,
  easing: "cubic-bezier(0.22, 1, 0.36, 1)",
} as const;

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

interface CommentTextInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  placeholder: string;
  ariaLabel: string;
  persistentFooter?: boolean;
  footerPortalTarget?: HTMLElement | null;
  autoFocus?: boolean;
  onCancel?: () => void;
}

function CommentTextInput({
  value,
  onChange,
  onSubmit,
  placeholder,
  ariaLabel,
  persistentFooter = false,
  footerPortalTarget,
  autoFocus = false,
  onCancel,
}: CommentTextInputProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const previousExpandedRef = useRef(false);
  const startHeightRef = useRef<number | null>(null);
  const animationRef = useRef<Animation | null>(null);
  const [responsiveFooterLatched, setResponsiveFooterLatched] = useState(false);
  const expanded =
    persistentFooter || value.includes("\n") || responsiveFooterLatched;
  const error = value.trim() === "" ? null : commentBodyError(value);
  const submitDisabled = commentBodyError(value) !== null;

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || previousExpandedRef.current === expanded) return;
    previousExpandedRef.current = expanded;
    const startHeight = startHeightRef.current;
    startHeightRef.current = null;
    if (startHeight === null || typeof root.animate !== "function" || reducedMotion())
      return;
    const endHeight = root.getBoundingClientRect().height;
    if (Math.abs(endHeight - startHeight) < 0.5) return;
    animationRef.current?.cancel();
    root.style.overflow = "hidden";
    const animation = root.animate(
      [{ height: `${startHeight}px` }, { height: `${endHeight}px` }],
      MODE_TRANSITION,
    );
    animationRef.current = animation;
    animation.addEventListener(
      "finish",
      () => {
        if (animationRef.current !== animation) return;
        animationRef.current = null;
        root.style.removeProperty("overflow");
      },
      { once: true },
    );
  }, [expanded]);

  useEffect(() => {
    if (!autoFocus) return;
    const frame = requestAnimationFrame(() => textareaRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [autoFocus]);

  useEffect(() => {
    if (!persistentFooter && value.trim() === "") setResponsiveFooterLatched(false);
  }, [persistentFooter, value]);

  const beginResponsiveTransition = () => {
    if (rootRef.current) startHeightRef.current = rootRef.current.getBoundingClientRect().height;
  };

  const submit = (
    <button
      type="button"
      className="bb-comments-submit-shortcut"
      disabled={submitDisabled}
      aria-label="Submit comment"
      title="Submit comment · ⌘/Ctrl Enter"
      onMouseDown={(event) => event.preventDefault()}
      onClick={() => onSubmit(value)}
    >
      <Command aria-hidden="true" />
      <CornerDownLeft aria-hidden="true" />
    </button>
  );

  const footer = (
    <div
      className="bb-comments-edit-footer"
      data-mention-input-footer="true"
      data-persistent-footer="true"
    >
      <button
        type="button"
        className="bb-comments-context-control"
        aria-label="Add comment context"
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => textareaRef.current?.focus()}
      >
        <Plus aria-hidden="true" />
      </button>
      {submit}
    </div>
  );

  return (
    <div
      ref={rootRef}
      className="bb-comments-mention-input"
      data-mention-input-expanded={expanded ? "true" : "false"}
    >
      <div className="bb-comments-input-surface" data-mention-input-surface="true">
        <div className="bb-comments-input-row" data-mention-input-row="true">
          {!expanded ? (
            <button
              type="button"
              className="bb-comments-context-control"
              aria-label="Add comment context"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => textareaRef.current?.focus()}
            >
              <Plus aria-hidden="true" />
            </button>
          ) : null}
          <textarea
            ref={textareaRef}
            className={
              persistentFooter
                ? "bb-comments-edit-input"
                : "bb-comments-reply-input"
            }
            aria-label={ariaLabel}
            placeholder={placeholder}
            maxLength={20_000}
            value={value}
            onChange={(event) => {
              beginResponsiveTransition();
              if (
                !persistentFooter &&
                event.currentTarget.value.trim() !== "" &&
                (event.currentTarget.value.includes("\n") ||
                  event.currentTarget.scrollHeight >
                    event.currentTarget.clientHeight + 1)
              ) {
                setResponsiveFooterLatched(true);
              }
              onChange(event.currentTarget.value);
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape" && onCancel) {
                event.preventDefault();
                onCancel();
                return;
              }
              if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                event.preventDefault();
                if (!submitDisabled) onSubmit(value);
              }
            }}
          />
          {!expanded ? submit : null}
        </div>
        {error ? <div className="bb-comments-error" role="status">{error}</div> : null}
      </div>
      {expanded
        ? footerPortalTarget
          ? createPortal(footer, footerPortalTarget)
          : footer
        : null}
    </div>
  );
}

interface CommentMessageProps {
  comment: TimelineComment;
  isLast: boolean;
  isEditing: boolean;
  editFooterPortalTarget: HTMLElement | null;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: (body: string) => void;
  onDelete: () => void;
}

function CommentMessage({
  comment,
  isLast,
  isEditing,
  editFooterPortalTarget,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
}: CommentMessageProps) {
  const rowRef = useRef<HTMLElement | null>(null);
  const [editText, setEditText] = useState(comment.body);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuTriggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const runModeTransition = useMeasuredModeTransition(rowRef, isEditing);
  const wasEditingRef = useRef(isEditing);

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

  useEffect(() => setEditText(comment.body), [comment.body]);
  useEffect(() => {
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
      event.preventDefault();
      setMenuOpen(false);
      menuTriggerRef.current?.focus({ preventScroll: true });
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
              onClick={() => runModeTransition(onCancelEdit)}
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
              onClick={() => setMenuOpen((open) => !open)}
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
          <CommentTextInput
            value={editText}
            onChange={setEditText}
            onSubmit={(body) => runModeTransition(() => onSaveEdit(body))}
            placeholder="Edit comment…"
            ariaLabel="Edit comment"
            persistentFooter
            footerPortalTarget={isLast ? editFooterPortalTarget : null}
            autoFocus
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
  const [replyText, setReplyText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const replyRegionRef = useRef<HTMLFormElement | null>(null);
  const [editFooterHost, setEditFooterHost] = useState<HTMLDivElement | null>(null);
  const replyStartHeightRef = useRef<number | null>(null);
  const replyAnimationRef = useRef<Animation | null>(null);
  const lastCommentId = detail.comments.at(-1)?.id ?? null;
  const isEditingLast = editingId !== null && editingId === lastCommentId;

  const beginReplyRegionTransition = useCallback(() => {
    const region = replyRegionRef.current;
    if (!region) return;
    replyAnimationRef.current?.cancel();
    replyAnimationRef.current = null;
    region.style.removeProperty("height");
    region.style.removeProperty("overflow");
    replyStartHeightRef.current = region.getBoundingClientRect().height;
  }, []);

  useLayoutEffect(() => {
    const region = replyRegionRef.current;
    const startHeight = replyStartHeightRef.current;
    replyStartHeightRef.current = null;
    if (!region || startHeight === null || reducedMotion() || typeof region.animate !== "function") return;
    const endHeight = region.getBoundingClientRect().height;
    if (Math.abs(endHeight - startHeight) < 0.5) return;
    region.style.overflow = "hidden";
    const animation = region.animate(
      [{ height: `${startHeight}px` }, { height: `${endHeight}px` }],
      MODE_TRANSITION,
    );
    replyAnimationRef.current = animation;
    animation.addEventListener(
      "finish",
      () => {
        if (replyAnimationRef.current !== animation) return;
        replyAnimationRef.current = null;
        region.style.removeProperty("overflow");
      },
      { once: true },
    );
  }, [isEditingLast]);

  const mutate = async (operation: () => Promise<TimelineCommentThreadDetail>) => {
    setBusy(true);
    setError(null);
    try {
      const fresh = await operation();
      setDetail(fresh);
      onChanged();
      return fresh;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong");
      return null;
    } finally {
      setBusy(false);
    }
  };

  const startEdit = (comment: TimelineComment) => {
    if (comment.id === lastCommentId) beginReplyRegionTransition();
    setEditingId(comment.id);
  };
  const finishEdit = () => {
    if (editingId === lastCommentId) beginReplyRegionTransition();
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
              setBusy(true);
              void rpc
                .call("deleteComment", {
                  bbThreadId: detail.thread.bbThreadId,
                  commentId: rootComment.id,
                  expectedVersion: rootComment.version,
                  expectedThreadVersion: detail.thread.version,
                })
                .then(() => {
                  onChanged();
                  onClose();
                })
                .catch((caught) => setError(caught instanceof Error ? caught.message : "Something went wrong"))
                .finally(() => setBusy(false));
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
            comment={comment}
            isLast={comment.id === lastCommentId}
            isEditing={editingId === comment.id}
            editFooterPortalTarget={editFooterHost}
            onStartEdit={() => startEdit(comment)}
            onCancelEdit={finishEdit}
            onSaveEdit={(body) => {
              const nextBody = body.trim();
              if (commentBodyError(nextBody) !== null || nextBody === comment.body) {
                finishEdit();
                return;
              }
              void mutate(() =>
                rpc.call("updateComment", {
                  bbThreadId: detail.thread.bbThreadId,
                  commentId: comment.id,
                  expectedVersion: comment.version,
                  body: nextBody,
                }),
              ).then((fresh) => {
                if (fresh) finishEdit();
              });
            }}
            onDelete={() => {
              if (!window.confirm(comment.parentId === null ? "Delete this comment thread?" : "Delete this reply?")) return;
              void rpc
                .call("deleteComment", {
                  bbThreadId: detail.thread.bbThreadId,
                  commentId: comment.id,
                  expectedVersion: comment.version,
                  expectedThreadVersion: detail.thread.version,
                })
                .then((result) => {
                  if (result.thread === null) onClose();
                  else setDetail(result.thread);
                  onChanged();
                })
                .catch((caught) => setError(caught instanceof Error ? caught.message : "Something went wrong"));
            }}
          />
        ))}
      </div>
      {detail.thread.resolvedAt === null ? (
        <form
          ref={replyRegionRef}
          className="bb-comments-reply comment-reply-region"
          data-comment-reply-region="true"
          data-editing={editingId && !isEditingLast ? "true" : "false"}
          data-last-editing={isEditingLast ? "true" : "false"}
          aria-hidden={editingId && !isEditingLast ? true : undefined}
          inert={editingId && !isEditingLast ? true : undefined}
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
              <CommentTextInput
                value={replyText}
                onChange={setReplyText}
                onSubmit={(body) => {
                  const nextBody = body.trim();
                  if (commentBodyError(nextBody) !== null) return;
                  void mutate(() =>
                    rpc.call("reply", {
                      bbThreadId: detail.thread.bbThreadId,
                      commentThreadId: detail.thread.id,
                      body: nextBody,
                    }),
                  ).then((fresh) => {
                    if (fresh) setReplyText("");
                  });
                }}
                placeholder="Reply..."
                ariaLabel="Reply to comment thread"
              />
            </div>
            <div
              ref={setEditFooterHost}
              className="bb-comments-edit-footer-host"
              data-bb-comment-edit-footer-host="true"
              data-comment-edit-footer-host="true"
            />
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
  initialValue: string;
  onChange: (value: string) => void;
  onCancel: () => void;
  onSubmit: (value: string) => Promise<void>;
}

function MossNewCommentComposer({
  initialValue,
  onChange,
  onCancel,
  onSubmit,
}: MountMossCommentComposerOptions) {
  const [value, setValue] = useState(initialValue);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="bb-comments-new-comment-input" data-comment-new-composer="true">
      <CommentTextInput
        value={value}
        onChange={(next) => {
          setValue(next);
          onChange(next);
        }}
        onCancel={onCancel}
        onSubmit={(body) => {
          if (busy || commentBodyError(body) !== null) return;
          setBusy(true);
          setError(null);
          void onSubmit(body)
            .catch((caught) =>
              setError(
                caught instanceof Error ? caught.message : "Something went wrong",
              ),
            )
            .finally(() => setBusy(false));
        }}
        placeholder="Add a comment…"
        ariaLabel="Add a comment"
        autoFocus
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
