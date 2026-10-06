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
  AtSign,
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
import type { PluginRpcClient } from "@get-bb/plugin-sdk/app";
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
const DRAFT_TTL = 24 * 60 * 60 * 1_000;

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

function readDraft(key: string): string | null {
  const saved = sessionStorage.getItem(key);
  if (saved === null) return null;
  try {
    const parsed = JSON.parse(saved) as {
      body?: unknown;
      expiresAt?: unknown;
    };
    if (
      typeof parsed.body === "string" &&
      typeof parsed.expiresAt === "number" &&
      parsed.expiresAt > Date.now()
    ) {
      return parsed.body;
    }
  } catch {
    // Invalid or expired drafts are discarded below.
  }
  sessionStorage.removeItem(key);
  return null;
}

function writeDraft(key: string, body: string): void {
  if (body.trim() === "") {
    sessionStorage.removeItem(key);
    return;
  }
  sessionStorage.setItem(
    key,
    JSON.stringify({ body, expiresAt: Date.now() + DRAFT_TTL }),
  );
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
  submitPending?: boolean;
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
  submitPending = false,
}: CommentTextInputProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const inputContentRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const previousFooterVisibleRef = useRef(false);
  const compactHeightRef = useRef<number | null>(null);
  const compactContentOffsetRef = useRef<number | null>(null);
  const expandedHeightRef = useRef<number | null>(null);
  const responsiveHeightAnimationRef = useRef<Animation | null>(null);
  const responsiveContentAnimationRef = useRef<Animation | null>(null);
  const responsiveAnimationCleanupTimerRef = useRef<number | null>(null);
  const responsiveMeasurementFrameRef = useRef<number | null>(null);
  const [responsiveFooterLatched, setResponsiveFooterLatched] = useState(false);
  const hasExplicitLineBreak = value.includes("\n");
  const responsiveExpansionRequested =
    hasExplicitLineBreak || responsiveFooterLatched;
  const footerVisible = persistentFooter || responsiveExpansionRequested;
  const responsiveCompact = !persistentFooter && !footerVisible;
  const error = value.trim() === "" ? null : commentBodyError(value);
  const submitDisabled = commentBodyError(value) !== null;

  const animateResponsiveHeightToNaturalSize = useCallback(() => {
    const root = rootRef.current;
    const previousNaturalHeight = expandedHeightRef.current;
    if (!root || previousNaturalHeight === null) return;

    const naturalHeight = Array.from(root.children).reduce((height, child) => {
      if (
        !(child instanceof HTMLElement) ||
        window.getComputedStyle(child).position === "absolute"
      ) {
        return height;
      }
      return height + child.getBoundingClientRect().height;
    }, 0);
    if (Math.abs(naturalHeight - previousNaturalHeight) < 0.5) return;
    expandedHeightRef.current = naturalHeight;

    const runningAnimation = responsiveHeightAnimationRef.current;
    const startHeight = runningAnimation
      ? root.getBoundingClientRect().height
      : previousNaturalHeight;
    responsiveHeightAnimationRef.current = null;
    runningAnimation?.cancel();
    if (responsiveAnimationCleanupTimerRef.current !== null) {
      window.clearTimeout(responsiveAnimationCleanupTimerRef.current);
      responsiveAnimationCleanupTimerRef.current = null;
    }

    if (
      typeof root.animate !== "function" ||
      reducedMotion() ||
      Math.abs(naturalHeight - startHeight) < 0.5
    ) {
      root.style.removeProperty("overflow");
      return;
    }

    root.style.overflow = "hidden";
    const heightAnimation = root.animate(
      [{ height: `${startHeight}px` }, { height: `${naturalHeight}px` }],
      MODE_TRANSITION,
    );
    responsiveHeightAnimationRef.current = heightAnimation;
    const finishTransition = () => {
      if (responsiveHeightAnimationRef.current !== heightAnimation) return;
      responsiveHeightAnimationRef.current = null;
      if (responsiveAnimationCleanupTimerRef.current !== null) {
        window.clearTimeout(responsiveAnimationCleanupTimerRef.current);
        responsiveAnimationCleanupTimerRef.current = null;
      }
      root.style.removeProperty("overflow");
    };
    heightAnimation.addEventListener("finish", finishTransition, { once: true });
    responsiveAnimationCleanupTimerRef.current = window.setTimeout(() => {
      if (responsiveHeightAnimationRef.current === heightAnimation) {
        responsiveHeightAnimationRef.current = null;
        heightAnimation.cancel();
        root.style.removeProperty("overflow");
      }
      responsiveAnimationCleanupTimerRef.current = null;
    }, 200);
  }, []);

  useLayoutEffect(() => {
    if (persistentFooter) {
      previousFooterVisibleRef.current = footerVisible;
      return;
    }
    const root = rootRef.current;
    const content = inputContentRef.current;
    const row = root?.querySelector<HTMLElement>('[data-mention-input-row="true"]');
    if (!root || !content || !row) return;

    const wasVisible = previousFooterVisibleRef.current;
    previousFooterVisibleRef.current = footerVisible;
    const currentNaturalHeight =
      root.offsetHeight || root.getBoundingClientRect().height;
    const currentContentOffset =
      Number.parseFloat(window.getComputedStyle(row).paddingLeft) || 0;

    if (wasVisible === footerVisible) {
      if (!footerVisible) {
        const previousCompactHeight = compactHeightRef.current;
        if (
          previousCompactHeight === null ||
          currentNaturalHeight <= previousCompactHeight + 0.5
        ) {
          compactHeightRef.current = currentNaturalHeight;
          compactContentOffsetRef.current = currentContentOffset;
        }
      } else if (!responsiveHeightAnimationRef.current) {
        expandedHeightRef.current = currentNaturalHeight;
      }
      return;
    }

    const runningHeightAnimation = responsiveHeightAnimationRef.current;
    const animatedStartHeight = runningHeightAnimation
      ? root.getBoundingClientRect().height
      : null;
    responsiveHeightAnimationRef.current = null;
    runningHeightAnimation?.cancel();
    responsiveContentAnimationRef.current?.cancel();
    responsiveContentAnimationRef.current = null;
    if (responsiveAnimationCleanupTimerRef.current !== null) {
      window.clearTimeout(responsiveAnimationCleanupTimerRef.current);
      responsiveAnimationCleanupTimerRef.current = null;
    }
    root.style.removeProperty("overflow");

    const endHeight = root.offsetHeight || root.getBoundingClientRect().height;
    const startHeight =
      animatedStartHeight ??
      (footerVisible ? compactHeightRef.current : expandedHeightRef.current) ??
      endHeight;
    if (footerVisible) expandedHeightRef.current = endHeight;
    else {
      compactHeightRef.current = endHeight;
      compactContentOffsetRef.current = currentContentOffset;
    }

    if (
      typeof root.animate !== "function" ||
      reducedMotion() ||
      Math.abs(endHeight - startHeight) < 0.5
    ) return;

    root.style.overflow = "hidden";
    const heightAnimation = root.animate(
      [{ height: `${startHeight}px` }, { height: `${endHeight}px` }],
      MODE_TRANSITION,
    );
    responsiveHeightAnimationRef.current = heightAnimation;

    if (footerVisible) {
      const compactContentOffset = compactContentOffsetRef.current;
      const contentOffset =
        compactContentOffset === null
          ? 0
          : compactContentOffset - currentContentOffset;
      if (Math.abs(contentOffset) >= 0.5) {
        const contentAnimation = content.animate(
          [
            { transform: `translateX(${contentOffset}px)` },
            { transform: "translateX(0)" },
          ],
          MODE_TRANSITION,
        );
        responsiveContentAnimationRef.current = contentAnimation;
        contentAnimation.addEventListener(
          "finish",
          () => {
            if (responsiveContentAnimationRef.current === contentAnimation)
              responsiveContentAnimationRef.current = null;
          },
          { once: true },
        );
      }
    }

    const finishTransition = () => {
      if (responsiveHeightAnimationRef.current !== heightAnimation) return;
      responsiveHeightAnimationRef.current = null;
      if (responsiveAnimationCleanupTimerRef.current !== null) {
        window.clearTimeout(responsiveAnimationCleanupTimerRef.current);
        responsiveAnimationCleanupTimerRef.current = null;
      }
      root.style.removeProperty("overflow");
    };
    heightAnimation.addEventListener("finish", finishTransition, { once: true });
    responsiveAnimationCleanupTimerRef.current = window.setTimeout(() => {
      if (responsiveHeightAnimationRef.current === heightAnimation) {
        responsiveHeightAnimationRef.current = null;
        heightAnimation.cancel();
        root.style.removeProperty("overflow");
      }
      responsiveAnimationCleanupTimerRef.current = null;
    }, 200);
  }, [footerVisible, persistentFooter]);

  useEffect(
    () => () => {
      if (responsiveMeasurementFrameRef.current !== null)
        window.cancelAnimationFrame(responsiveMeasurementFrameRef.current);
      if (responsiveAnimationCleanupTimerRef.current !== null)
        window.clearTimeout(responsiveAnimationCleanupTimerRef.current);
      responsiveHeightAnimationRef.current?.cancel();
      responsiveContentAnimationRef.current?.cancel();
      responsiveHeightAnimationRef.current = null;
      responsiveContentAnimationRef.current = null;
      rootRef.current?.style.removeProperty("overflow");
    },
    [],
  );

  const shouldExpandResponsiveFooter = useCallback(() => {
    const element = textareaRef.current;
    if (!element) return false;
    const computedLineHeight = Number.parseFloat(
      window.getComputedStyle(element).lineHeight,
    );
    const singleLineHeight = Number.isFinite(computedLineHeight)
      ? computedLineHeight
      : 20;
    const contentHeight = Math.max(
      element.scrollHeight,
      element.getBoundingClientRect().height,
    );
    const singleLineOverflow = element.scrollWidth > element.clientWidth + 0.5;
    return (
      Boolean(element.value.trim()) &&
      (singleLineOverflow || contentHeight > singleLineHeight * 1.5)
    );
  }, []);

  const cancelResponsiveFooterMeasurement = useCallback(() => {
    if (responsiveMeasurementFrameRef.current === null) return;
    window.cancelAnimationFrame(responsiveMeasurementFrameRef.current);
    responsiveMeasurementFrameRef.current = null;
  }, []);

  const scheduleResponsiveFooterMeasurement = useCallback(() => {
    if (responsiveMeasurementFrameRef.current !== null) return;
    responsiveMeasurementFrameRef.current = window.requestAnimationFrame(() => {
      responsiveMeasurementFrameRef.current = null;
      if (shouldExpandResponsiveFooter()) setResponsiveFooterLatched(true);
    });
  }, [shouldExpandResponsiveFooter]);

  useLayoutEffect(() => {
    if (persistentFooter) {
      cancelResponsiveFooterMeasurement();
      return;
    }
    if (!value.trim()) {
      cancelResponsiveFooterMeasurement();
      setResponsiveFooterLatched(false);
      return;
    }
    if (responsiveFooterLatched) {
      cancelResponsiveFooterMeasurement();
      return;
    }
    if (hasExplicitLineBreak) {
      cancelResponsiveFooterMeasurement();
      setResponsiveFooterLatched(true);
      return;
    }
    scheduleResponsiveFooterMeasurement();
  }, [
    cancelResponsiveFooterMeasurement,
    hasExplicitLineBreak,
    persistentFooter,
    responsiveFooterLatched,
    scheduleResponsiveFooterMeasurement,
    value,
  ]);

  useLayoutEffect(() => {
    if (persistentFooter || typeof ResizeObserver === "undefined") return;
    const element = textareaRef.current;
    if (!element) return;
    const handleResize = () => {
      if (responsiveFooterLatched) animateResponsiveHeightToNaturalSize();
      else scheduleResponsiveFooterMeasurement();
    };
    const resizeObserver = new ResizeObserver(handleResize);
    const mutationObserver =
      responsiveFooterLatched || typeof MutationObserver === "undefined"
        ? null
        : new MutationObserver(scheduleResponsiveFooterMeasurement);
    resizeObserver.observe(element);
    mutationObserver?.observe(element, {
      childList: true,
      characterData: true,
      subtree: true,
    });
    return () => {
      resizeObserver.disconnect();
      mutationObserver?.disconnect();
    };
  }, [
    animateResponsiveHeightToNaturalSize,
    persistentFooter,
    responsiveFooterLatched,
    scheduleResponsiveFooterMeasurement,
  ]);

  useEffect(() => {
    if (!autoFocus) return;
    const frame = requestAnimationFrame(() => textareaRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [autoFocus]);

  const insertMentionTrigger = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const nextValue = `${value.slice(0, start)}@${value.slice(end)}`;
    onChange(nextValue);
    window.requestAnimationFrame(() => {
      textarea.focus({ preventScroll: true });
      textarea.setSelectionRange(start + 1, start + 1);
    });
  }, [onChange, value]);

  const submit = (
    <button
      type="button"
      className="bb-comments-submit-shortcut"
      disabled={submitPending || submitDisabled}
      aria-label="Submit comment"
      title="Submit comment · ⌘/Ctrl Enter"
      onMouseDown={(event) => event.preventDefault()}
      onClick={() => {
        if (!submitPending) onSubmit(value);
      }}
    >
      <Command aria-hidden="true" />
      <CornerDownLeft aria-hidden="true" />
    </button>
  );

  const footer = (
    <div
      className="bb-comments-edit-footer"
      data-mention-input-footer="true"
      data-mention-input-footer-state="expanded"
      data-persistent-footer="true"
    >
      <button
        type="button"
        className="bb-comments-context-control"
        aria-label="Mention context"
        disabled={submitPending}
        onMouseDown={(event) => event.preventDefault()}
        onClick={insertMentionTrigger}
      >
        <AtSign aria-hidden="true" />
      </button>
      {submit}
    </div>
  );

  return (
    <div
      ref={rootRef}
      className="bb-comments-mention-input"
      data-mention-input-expanded={footerVisible ? "true" : "false"}
      aria-busy={submitPending || undefined}
    >
      <div className="bb-comments-input-surface" data-mention-input-surface="true">
        <div
          className="bb-comments-input-row"
          data-mention-input-row="true"
          data-responsive-compact={responsiveCompact ? "true" : "false"}
        >
          <div
            ref={inputContentRef}
            className="bb-comments-input-content"
            data-mention-input-content="true"
          >
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
              readOnly={submitPending}
              aria-disabled={submitPending || undefined}
              value={value}
              onChange={(event) => onChange(event.currentTarget.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape" && onCancel && !submitPending) {
                  event.preventDefault();
                  onCancel();
                  return;
                }
                if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                  event.preventDefault();
                  if (!submitPending && !submitDisabled) onSubmit(value);
                }
              }}
            />
          </div>
        </div>
        {error ? <div className="bb-comments-error" role="status">{error}</div> : null}
      </div>
      {persistentFooter
        ? footerPortalTarget
          ? createPortal(footer, footerPortalTarget)
          : footer
        : (
          <>
            <div
              className="bb-comments-responsive-footer"
              aria-hidden="true"
              data-mention-input-footer="true"
              data-mention-input-footer-state={
                footerVisible ? "expanded" : "collapsed"
              }
            >
              <div
                className="bb-comments-responsive-footer-divider"
                data-mention-input-footer-divider="true"
              />
            </div>
            <div
              className="bb-comments-responsive-actions"
              data-mention-input-responsive-actions="true"
            >
              <div className="bb-comments-responsive-action-switcher">
                <div
                  className="bb-comments-compact-actions"
                  aria-hidden={footerVisible}
                  inert={footerVisible || undefined}
                  data-mention-input-compact-actions="true"
                >
                  <button
                    type="button"
                    className="bb-comments-context-control"
                    aria-label="Add comment context"
                    disabled={submitPending}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={insertMentionTrigger}
                  >
                    <Plus aria-hidden="true" />
                  </button>
                </div>
                <div
                  className="bb-comments-expanded-actions"
                  aria-hidden={!footerVisible}
                  inert={!footerVisible || undefined}
                  data-mention-input-expanded-actions="true"
                >
                  <button
                    type="button"
                    className="bb-comments-context-control"
                    aria-label="Mention context"
                    disabled={submitPending}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={insertMentionTrigger}
                  >
                    <AtSign aria-hidden="true" />
                  </button>
                </div>
              </div>
              <div
                className="bb-comments-responsive-submit"
                data-mention-input-responsive-submit="true"
              >
                {submit}
              </div>
            </div>
          </>
        )}
    </div>
  );
}

interface CommentMessageProps {
  comment: TimelineComment;
  isLast: boolean;
  isEditing: boolean;
  editFooterPortalTarget: HTMLElement | null;
  submitPending: boolean;
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
  submitPending,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
}: CommentMessageProps) {
  const rowRef = useRef<HTMLElement | null>(null);
  const editDraftKey = `bb.timeline-comments.edit:${comment.id}`;
  const [editText, setEditText] = useState(
    () => readDraft(editDraftKey) ?? comment.body,
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const menuTriggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const runModeTransition = useMeasuredModeTransition(rowRef, isEditing);
  const wasEditingRef = useRef(isEditing);
  const cancelEdit = useCallback(() => {
    sessionStorage.removeItem(editDraftKey);
    setEditText(comment.body);
    onCancelEdit();
  }, [comment.body, editDraftKey, onCancelEdit]);

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
    () => setEditText(readDraft(editDraftKey) ?? comment.body),
    [comment.body, editDraftKey],
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
          <CommentTextInput
            value={editText}
            onChange={(value) => {
              setEditText(value);
              if (value === comment.body) sessionStorage.removeItem(editDraftKey);
              else writeDraft(editDraftKey, value);
            }}
            onSubmit={(body) => runModeTransition(() => onSaveEdit(body))}
            placeholder="Edit comment…"
            ariaLabel="Edit comment"
            persistentFooter
            footerPortalTarget={isLast ? editFooterPortalTarget : null}
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
  const [replyText, setReplyText] = useState(
    () => readDraft(replyDraftKey) ?? "",
  );
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const replyRegionRef = useRef<HTMLFormElement | null>(null);
  const [editFooterHost, setEditFooterHost] = useState<HTMLDivElement | null>(null);
  const replyStartHeightRef = useRef<number | null>(null);
  const replyAnimationRef = useRef<Animation | null>(null);
  const lastCommentId = detail.comments.at(-1)?.id ?? null;
  const isEditingLast = editingId !== null && editingId === lastCommentId;

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
            comment={comment}
            isLast={comment.id === lastCommentId}
            isEditing={editingId === comment.id}
            editFooterPortalTarget={editFooterHost}
            submitPending={busy}
            onStartEdit={() => startEdit(comment)}
            onCancelEdit={finishEdit}
            onSaveEdit={(body) => {
              const nextBody = body.trim();
              if (commentBodyError(nextBody) !== null || nextBody === comment.body) {
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
                  body: nextBody,
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
                onChange={(value) => {
                  setReplyText(value);
                  writeDraft(replyDraftKey, value);
                }}
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
                    if (fresh) {
                      sessionStorage.removeItem(replyDraftKey);
                      setReplyText("");
                    }
                  });
                }}
                placeholder="Reply..."
                ariaLabel="Reply to comment thread"
                submitPending={busy}
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
  const busyRef = useRef(false);
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
          if (busyRef.current || commentBodyError(body) !== null) return;
          busyRef.current = true;
          setBusy(true);
          setError(null);
          void onSubmit(body)
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
        ariaLabel="Add a comment"
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
