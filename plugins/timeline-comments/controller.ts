import type {
  PluginContentScriptContext,
  PluginMessageActionContext,
  PluginRpcClient,
} from "@bb/plugin-sdk/app";
import {
  CheckCheck,
  Command,
  CornerDownLeft,
  EllipsisVertical,
  Pencil,
  StickyNote,
  Trash2,
  X,
  createElement as createLucideElement,
  type IconNode,
} from "lucide";
import type {
  TimelineComment,
  TimelineCommentThreadDetail,
  TimelineCommentThreadSummary,
  timelineCommentsRpcContract,
} from "./server.js";
import {
  chooseNearestGutter,
  layoutGutterMarkers,
  restoreSelector,
  selectorForRange,
  type StoredSelector,
} from "./anchors.js";
import { commentBodyError } from "./comment-body.js";
import {
  installTimelineCommentsController,
  publishTimelineCommentAnchorHealth,
  requestTimelineCommentHandoff,
  type TimelineCommentAnchorHealth,
} from "./bridge.js";
import {
  mountMossCommentComposer,
  mountMossCommentPopover,
} from "./comment-components.js";

type Rpc = PluginRpcClient<typeof timelineCommentsRpcContract>;

interface CapturedSelection {
  bbThreadId: string | null;
  messageId: string;
  prose: HTMLElement;
  range: Range;
  rects: Array<{ x: number; y: number; width: number; height: number }>;
  selector: StoredSelector;
  threadWindow: HTMLElement;
}

function contentScriptRpcClient(signal: AbortSignal): Rpc {
  return {
    async call(method, input) {
      const response = await fetch(
        `/api/v1/plugins/timeline-comments/rpc/${String(method)}`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(input ?? null),
          signal,
        },
      );
      const envelope = (await response.json()) as
        | { ok: true; result: unknown }
        | { ok: false; error?: { message?: string } };
      if (!response.ok || !envelope.ok) {
        throw new Error(
          envelope.ok
            ? "Timeline comments request failed."
            : (envelope.error?.message ?? "Timeline comments request failed."),
        );
      }
      return envelope.result;
    },
  } as Rpc;
}

interface RestoredThread {
  anchor: TimelineCommentThreadSummary;
  range: Range;
  marker: HTMLButtonElement | null;
  side: "left" | "right";
  desiredY: number;
  window: HTMLElement;
  prose: HTMLElement;
}

const OWNED = "data-bb-timeline-comments-owned";
const NORMAL_HIGHLIGHT = "bb-timeline-comments";
const ACTIVE_HIGHLIGHT = "bb-timeline-comments-active";
const DRAFT_TTL = 24 * 60 * 60 * 1_000;
const PLUGIN_DECORATION = "data-bb-plugin-decoration";
const MARKER_SIZE = 24;
const MARKER_TEXT_GAP = 8;
const COMPOSER_WIDTH = 216;
const POPOVER_WIDTH = 264;
const MESSAGE_PROSE_SELECTOR =
  "[data-sidebar-swipe-selectable], [data-no-sidebar-swipe]";

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

function element<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  node.setAttribute(OWNED, "");
  if (className !== undefined) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/** BB scopes plugin CSS to descendants of this ownership boundary. */
function decorateRoot<T extends HTMLElement>(node: T): T {
  node.setAttribute(PLUGIN_DECORATION, "timeline-comments");
  return node;
}

function escapeSelector(value: string): string {
  return (
    globalThis.CSS?.escape?.(value) ?? value.replace(/[^a-zA-Z0-9_-]/gu, "\\$&")
  );
}

function sourceExcerpt(text: string): string {
  return text.length > 120 ? `${text.slice(0, 117)}…` : text;
}

function formatTime(value: number): string {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
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
  if (elapsed < 604_800_000) {
    const days = Math.floor(elapsed / 86_400_000);
    return `${days} ${days === 1 ? "day" : "days"} ago`;
  }
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(value);
}

function icon(node: IconNode): SVGElement {
  const svg = createLucideElement(node);
  svg.setAttribute(OWNED, "");
  svg.setAttribute("width", "16");
  svg.setAttribute("height", "16");
  svg.setAttribute("stroke-width", "1.5");
  svg.setAttribute("aria-hidden", "true");
  return svg;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong";
}

function selectionTextMatches(rangeText: string, hostText: string): boolean {
  const canonicalize = (value: string) =>
    value.replace(/[\r\n\t]/g, "").trim();
  return canonicalize(rangeText) === canonicalize(hostText);
}

const inlineComposerAnimations = new WeakMap<HTMLElement, Animation>();
const inlineComposerNaturalHeights = new WeakMap<HTMLElement, number>();
const modeTransitionAnimations = new WeakMap<HTMLElement, Animation>();

function runMeasuredModeTransition(
  element: HTMLElement,
  update: () => void,
): void {
  const scrollRegion = element.closest<HTMLElement>(
    ".bb-comments-thread-comments",
  );
  const scrollTop = scrollRegion?.scrollTop;
  const running = modeTransitionAnimations.get(element);
  const startHeight = element.getBoundingClientRect().height;
  running?.cancel();
  modeTransitionAnimations.delete(element);
  element.style.removeProperty("overflow");
  update();
  if (scrollRegion !== null && scrollTop !== undefined) {
    scrollRegion.scrollTop = scrollTop;
    requestAnimationFrame(() => {
      if (scrollRegion.isConnected) scrollRegion.scrollTop = scrollTop;
    });
  }
  const endHeight = element.getBoundingClientRect().height;
  if (
    Math.abs(endHeight - startHeight) < 0.5 ||
    typeof element.animate !== "function" ||
    matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    return;
  }
  element.style.overflow = "hidden";
  const animation = element.animate(
    [{ height: `${startHeight}px` }, { height: `${endHeight}px` }],
    {
      duration: 150,
      easing: "cubic-bezier(0.22, 1, 0.36, 1)",
    },
  );
  modeTransitionAnimations.set(element, animation);
  const finish = () => {
    if (modeTransitionAnimations.get(element) !== animation) return;
    modeTransitionAnimations.delete(element);
    element.style.removeProperty("overflow");
  };
  animation.addEventListener("finish", finish, { once: true });
  animation.addEventListener("cancel", finish, { once: true });
}

function removeWithTransition(element: HTMLElement, remove: () => void): void {
  if (
    typeof element.animate !== "function" ||
    matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    remove();
    return;
  }
  const height = element.getBoundingClientRect().height;
  element.style.overflow = "hidden";
  const animation = element.animate(
    [
      { height: `${height}px`, opacity: 1 },
      { height: "0px", opacity: 0 },
    ],
    { duration: 150, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
  );
  animation.addEventListener("finish", remove, { once: true });
  animation.addEventListener("cancel", remove, { once: true });
}

function animateInsertion(element: HTMLElement): void {
  if (
    typeof element.animate !== "function" ||
    matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    return;
  }
  element.animate(
    [
      { opacity: 0, transform: "translateY(-4px)" },
      { opacity: 1, transform: "translateY(0)" },
    ],
    { duration: 150, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
  );
}

function syncInlineComposerLayout(
  textarea: HTMLTextAreaElement,
  composer: HTMLElement,
  animate = true,
): void {
  const styles = getComputedStyle(textarea);
  const lineHeight = Number.parseFloat(styles.lineHeight) || 20;
  const verticalPadding =
    (Number.parseFloat(styles.paddingTop) || 0) +
    (Number.parseFloat(styles.paddingBottom) || 0);
  const currentMultiline = composer.dataset.multiline === "true";
  const hasText = textarea.value.trim() !== "";
  const requestsMultiline =
    textarea.value.includes("\n") ||
    textarea.scrollHeight - verticalPadding > lineHeight + 1;
  const nextMultiline =
    hasText && (currentMultiline || requestsMultiline);
  const running = inlineComposerAnimations.get(composer);
  const startHeight =
    running === undefined
      ? (inlineComposerNaturalHeights.get(composer) ??
        composer.getBoundingClientRect().height)
      : composer.getBoundingClientRect().height;
  running?.cancel();
  inlineComposerAnimations.delete(composer);
  composer.style.removeProperty("overflow");
  composer.dataset.multiline = nextMultiline ? "true" : "false";
  const endHeight = composer.getBoundingClientRect().height;
  inlineComposerNaturalHeights.set(composer, endHeight);
  if (
    !animate ||
    Math.abs(endHeight - startHeight) < 0.5 ||
    typeof composer.animate !== "function" ||
    matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    return;
  }
  composer.style.overflow = "hidden";
  const animation = composer.animate(
    [{ height: `${startHeight}px` }, { height: `${endHeight}px` }],
    {
      duration: 150,
      easing: "cubic-bezier(0.22, 1, 0.36, 1)",
    },
  );
  inlineComposerAnimations.set(composer, animation);
  const finish = () => {
    if (inlineComposerAnimations.get(composer) !== animation) return;
    inlineComposerAnimations.delete(composer);
    composer.style.removeProperty("overflow");
  };
  animation.addEventListener("finish", finish, { once: true });
  animation.addEventListener("cancel", finish, { once: true });
}

function isRelevantMutation(record: MutationRecord): boolean {
  const selector = `[data-thread-window], [data-timeline-row-id], ${MESSAGE_PROSE_SELECTOR}`;
  return [...record.addedNodes, ...record.removedNodes].some(
    (node) =>
      node instanceof Element &&
      (node.matches(selector) || node.querySelector(selector) !== null),
  );
}

function isThreadWindowRendered(windowNode: HTMLElement): boolean {
  if (!windowNode.isConnected) return false;
  if (windowNode.closest('[aria-hidden="true"], [hidden], [inert]') !== null) {
    return false;
  }
  const checkVisibility = (
    windowNode as HTMLElement & {
      checkVisibility?: (options?: {
        contentVisibilityAuto?: boolean;
        visibilityProperty?: boolean;
      }) => boolean;
    }
  ).checkVisibility;
  return (
    checkVisibility?.call(windowNode, {
      contentVisibilityAuto: true,
      visibilityProperty: true,
    }) ?? true
  );
}

class TimelineCommentsController {
  readonly #rpc: Rpc;
  readonly #portal = decorateRoot(element("div", "bb-comments-portal"));
  readonly #overlay = element("div", "bb-comments-overlay");
  readonly #highlightStyle = element("style");
  readonly #anchors = new Map<string, TimelineCommentThreadSummary>();
  readonly #restored = new Map<string, RestoredThread>();
  readonly #threadWindows = new Map<string, Set<HTMLElement>>();
  readonly #disposers: Array<() => void> = [];
  readonly #observer: MutationObserver;
  readonly #resizeObserver: ResizeObserver | null;
  #refreshNonce = 0;
  #refreshing: Promise<void> | null = null;
  #frame: number | null = null;
  #popover: HTMLElement | null = null;
  #threadUiCleanup: (() => void) | null = null;
  #composer: HTMLElement | null = null;
  #composerUiCleanup: (() => void) | null = null;
  #composerThreadId: string | null = null;
  #popoverThreadIds = new Set<string>();
  #activeIds = new Set<string>();
  #provisionalRange: Range | null = null;
  #openThreadId: string | null = null;
  #destroyed = false;
  #selectionSnapshot: CapturedSelection | null = null;
  #focusNonce = 0;
  #outsideComposer: ((event: PointerEvent) => void) | null = null;
  #outsidePopover: ((event: PointerEvent) => void) | null = null;
  #popoverKeydown: ((event: KeyboardEvent) => void) | null = null;
  #popoverInvoker: HTMLElement | null = null;
  #actionsMenu: HTMLElement | null = null;
  #actionsTrigger: HTMLButtonElement | null = null;
  #outsideActionsMenu: ((event: PointerEvent) => void) | null = null;

  constructor(context: PluginContentScriptContext) {
    this.#rpc = contentScriptRpcClient(context.signal);
    this.#overlay.setAttribute("aria-live", "polite");
    this.#highlightStyle.textContent = `
      ::highlight(${NORMAL_HIGHLIGHT}) {
        text-decoration: underline;
        text-decoration-color: color-mix(in oklab, var(--foreground) 62%, transparent);
        text-decoration-thickness: 1px;
        text-underline-offset: 3px;
      }
      ::highlight(${ACTIVE_HIGHLIGHT}) {
        background: color-mix(in oklab, var(--primary) 12%, transparent);
        text-decoration: underline;
        text-decoration-color: var(--foreground);
        text-decoration-thickness: 2px;
        text-underline-offset: 3px;
      }
    `;
    this.#portal.append(this.#overlay);
    document.body.append(this.#highlightStyle, this.#portal);

    this.#observer = new MutationObserver((records) => {
      const visibilityChanged = records.some((record) =>
        this.isThreadVisibilityMutation(record),
      );
      if (visibilityChanged) {
        this.syncAttachedUiVisibility();
        this.restoreAll();
      }
      if (visibilityChanged || records.some(isRelevantMutation)) {
        this.scheduleRefresh();
      }
    });
    this.#observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["aria-hidden", "class", "hidden", "inert", "style"],
    });
    this.#resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(() => this.scheduleLayout());

    const onViewportChange = () => this.scheduleLayout();
    document.addEventListener("scroll", onViewportChange, true);
    window.addEventListener("resize", onViewportChange);
    this.#disposers.push(() =>
      document.removeEventListener("scroll", onViewportChange, true),
    );
    this.#disposers.push(() =>
      window.removeEventListener("resize", onViewportChange),
    );
    const rememberSelection = () => {
      const captured = this.captureCurrentSelection();
      if (captured !== null) this.#selectionSnapshot = captured;
    };
    const refreshVisible = () => {
      if (document.visibilityState === "visible") this.scheduleRefresh();
    };
    document.addEventListener("selectionchange", rememberSelection);
    document.addEventListener("visibilitychange", refreshVisible);
    window.addEventListener("focus", refreshVisible);
    this.#disposers.push(() =>
      document.removeEventListener("selectionchange", rememberSelection),
    );
    this.#disposers.push(() =>
      document.removeEventListener("visibilitychange", refreshVisible),
    );
    this.#disposers.push(() =>
      window.removeEventListener("focus", refreshVisible),
    );
    this.#disposers.push(installTimelineCommentsController(this));
    this.scheduleRefresh();
  }

  beginComment(context: PluginMessageActionContext): void {
    if (context.selectedText === undefined) return;
    const current = this.captureCurrentSelection();
    if (current !== null) this.#selectionSnapshot = current;
    const captured = current ?? this.#selectionSnapshot;
    if (
      captured === null ||
      (captured.bbThreadId !== null &&
        captured.bbThreadId !== context.threadId) ||
      captured.messageId !== context.message.id ||
      !selectionTextMatches(captured.selector.exact, context.selectedText)
    ) {
      return;
    }
    this.rememberThreadWindow(context.threadId, captured.threadWindow);
    this.#selectionSnapshot = {
      ...captured,
      bbThreadId: context.threadId,
    };
    this.closeComposer();
    const restored =
      captured.prose.isConnected
        ? restoreSelector(captured.prose, captured.selector)
        : null;
    this.#provisionalRange = restored?.range ?? captured.range.cloneRange();
    this.rebuildHighlights();

    const key = `bb.timeline-comments.draft:${context.threadId}:${context.message.id}:${captured.selector.start}:${captured.selector.end}`;
    const shell = element("form", "bb-comments-composer");
    shell.setAttribute("role", "dialog");
    shell.setAttribute("aria-label", "Add comment");
    const initialValue = readDraft(key) ?? "";

    const firstRect = captured.rects[0];
    const x = firstRect?.x ?? window.innerWidth / 2;
    const y = captured.rects.at(-1)?.y ?? window.innerHeight / 2;
    shell.style.left = `${Math.max(8, Math.min(window.innerWidth - COMPOSER_WIDTH - 8, x))}px`;
    shell.style.top = `${Math.max(8, Math.min(window.innerHeight - 144, y + 17))}px`;
    let draftValue = initialValue;
    const persist = () => writeDraft(key, draftValue);
    this.#composerUiCleanup = mountMossCommentComposer(shell, {
      initialValue,
      onChange: (value) => {
        draftValue = value;
        persist();
      },
      onCancel: () => {
        persist();
        this.closeComposer();
      },
      onSubmit: async (body) => {
        const detail = await this.#rpc.call("createThread", {
          bbThreadId: context.threadId,
          message: context.message,
          selector: {
            ...captured.selector,
            rects: captured.rects.map((rect) => ({ ...rect })),
          },
          body,
        });
        sessionStorage.removeItem(key);
        this.closeComposer();
        this.#openThreadId = detail.thread.id;
        await this.refresh();
        await this.openThread(detailId(this.#openThreadId));
      },
    });
    this.#composer = shell;
    this.#composerThreadId = context.threadId;
    this.#portal.append(shell);
    this.#outsideComposer = (event) => {
      if (event.target instanceof Node && shell.contains(event.target)) return;
      persist();
      this.closeComposer();
    };
    document.addEventListener("pointerdown", this.#outsideComposer, true);
  }

  refreshAnchors(): void {
    this.scheduleRefresh();
  }

  registerThreadWindow(threadId: string, windowNode: HTMLElement): () => void {
    if (threadId === "" || !windowNode.matches("[data-thread-window]")) {
      return () => {};
    }
    this.rememberThreadWindow(threadId, windowNode);
    return () => {
      // A thread window can contain multiple composer-action mounts, and BB
      // temporarily removes all composer actions for pending interactions.
      // Keep the last known association for the lifetime of the connected
      // window; a later registration reassigns a reused window, while refresh
      // pruning removes disconnected windows.
      if (windowNode.isConnected) return;
      const windows = this.#threadWindows.get(threadId);
      windows?.delete(windowNode);
      if (windows?.size === 0) this.#threadWindows.delete(threadId);
      this.scheduleRefresh();
    };
  }

  private rememberThreadWindow(
    threadId: string,
    windowNode: HTMLElement,
  ): void {
    let changed = false;
    for (const [otherThreadId, windows] of this.#threadWindows) {
      if (otherThreadId === threadId || !windows.delete(windowNode)) continue;
      changed = true;
      if (windows.size === 0) this.#threadWindows.delete(otherThreadId);
    }
    const windows = this.#threadWindows.get(threadId) ?? new Set<HTMLElement>();
    const size = windows.size;
    windows.add(windowNode);
    this.#threadWindows.set(threadId, windows);
    if (changed || windows.size !== size) this.scheduleRefresh();
  }

  private threadIdForWindow(windowNode: HTMLElement): string | null {
    for (const [threadId, windows] of this.#threadWindows) {
      if (windows.has(windowNode)) return threadId;
    }
    return null;
  }

  private isThreadVisibilityMutation(record: MutationRecord): boolean {
    if (record.type !== "attributes" || !(record.target instanceof Element)) {
      return false;
    }
    for (const windows of this.#threadWindows.values()) {
      for (const windowNode of windows) {
        if (record.target === windowNode || record.target.contains(windowNode)) {
          return true;
        }
      }
    }
    return false;
  }

  private syncAttachedUiVisibility(): void {
    const visibleThreadIds = new Set(
      [...this.#threadWindows.keys()].filter(
        (threadId) => this.findWindow(threadId) !== null,
      ),
    );
    if (
      this.#composerThreadId !== null &&
      !visibleThreadIds.has(this.#composerThreadId)
    ) {
      this.closeComposer();
    }
    if (
      this.#popoverThreadIds.size > 0 &&
      [...this.#popoverThreadIds].some(
        (threadId) => !visibleThreadIds.has(threadId),
      )
    ) {
      this.closePopover();
    }
  }

  private captureCurrentSelection(): CapturedSelection | null {
    const selection = document.getSelection();
    if (
      selection === null ||
      selection.rangeCount !== 1 ||
      selection.isCollapsed
    )
      return null;
    const range = selection.getRangeAt(0).cloneRange();
    const startElement =
      range.startContainer instanceof Element
        ? range.startContainer
        : range.startContainer.parentElement;
    const prose = startElement?.closest<HTMLElement>(
      MESSAGE_PROSE_SELECTOR,
    );
    if (
      prose === undefined ||
      prose === null ||
      !prose.contains(range.endContainer)
    )
      return null;
    const message = prose.closest<HTMLElement>("[data-timeline-row-id]");
    const threadWindow = prose.closest<HTMLElement>("[data-thread-window]");
    const messageId = message?.dataset.timelineRowId;
    const selector = selectorForRange(prose, range);
    if (
      messageId === undefined ||
      threadWindow === null ||
      selector === null
    )
      return null;
    const rects = [...range.getClientRects()].map(({ x, y, width, height }) => ({
      x,
      y,
      width,
      height,
    }));
    if (rects.length === 0) return null;
    return {
      bbThreadId: this.threadIdForWindow(threadWindow),
      messageId,
      prose,
      range,
      rects,
      selector,
      threadWindow,
    };
  }

  async focusThread(anchor: TimelineCommentThreadSummary): Promise<boolean> {
    const request = ++this.#focusNonce;
    this.#openThreadId = anchor.id;
    await this.refresh();
    if (request !== this.#focusNonce || this.#destroyed) return false;
    if (!this.#restored.has(anchor.id)) {
      this.#anchors.set(anchor.id, anchor);
      this.restoreAll();
    }
    const restored = this.#restored.get(anchor.id);
    if (restored === undefined) return false;
    restored.prose.scrollIntoView({
      block: "center",
      behavior: "smooth",
    });
    this.setActive([anchor.id]);
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => resolve()),
    );
    if (request !== this.#focusNonce || this.#destroyed) return false;
    this.scheduleLayout();
    restored.marker?.focus({ preventScroll: true });
    await this.openThread(anchor.id, anchor);
    return true;
  }

  scheduleRefresh(): void {
    this.#refreshNonce += 1;
    queueMicrotask(() => {
      void this.refresh().catch((error: unknown) => {
        if (!this.#destroyed)
          console.error("timeline-comments refresh failed", error);
      });
    });
  }

  async refresh(): Promise<void> {
    if (this.#destroyed) return;
    if (this.#refreshing !== null) {
      await this.#refreshing;
      if (!this.#destroyed) return this.refresh();
      return;
    }
    const nonce = this.#refreshNonce;
    this.#refreshing = this.loadAnchors();
    try {
      await this.#refreshing;
    } finally {
      this.#refreshing = null;
    }
    if (nonce !== this.#refreshNonce && !this.#destroyed) await this.refresh();
  }

  private async loadAnchors(): Promise<void> {
    this.syncAttachedUiVisibility();
    const threadIds = [...this.#threadWindows.keys()]
      .filter((threadId) => this.findWindow(threadId) !== null)
      .slice(0, 20);
    this.#anchors.clear();
    if (threadIds.length > 0) {
      let cursor: string | undefined;
      do {
        const page = await this.#rpc.call("listOpenAnchors", {
          threadIds,
          ...(cursor !== undefined ? { cursor } : {}),
        });
        if (this.#destroyed) return;
        for (const anchor of page.anchors)
          this.#anchors.set(anchor.id, anchor as TimelineCommentThreadSummary);
        cursor = page.nextCursor ?? undefined;
      } while (cursor !== undefined && !this.#destroyed);
    }
    if (this.#destroyed) return;
    this.restoreAll();
  }

  private findWindow(threadId: string): HTMLElement | null {
    const windows = this.#threadWindows.get(threadId);
    if (windows === undefined) return null;
    for (const windowNode of windows) {
      if (!windowNode.isConnected) {
        windows.delete(windowNode);
        continue;
      }
      if (isThreadWindowRendered(windowNode)) return windowNode;
    }
    if (windows.size === 0) this.#threadWindows.delete(threadId);
    return null;
  }

  private findProse(
    threadId: string,
    messageId: string,
    selector: StoredSelector,
  ): HTMLElement | null {
    const windowNode = this.findWindow(threadId);
    const row = windowNode?.querySelector<HTMLElement>(
      `[data-timeline-row-id="${escapeSelector(messageId)}"]`,
    );
    if (row === undefined || row === null) return null;
    for (const candidate of row.querySelectorAll<HTMLElement>(
      MESSAGE_PROSE_SELECTOR,
    )) {
      if (candidate.matches("button, input, textarea, select, a")) continue;
      if (restoreSelector(candidate, selector) !== null) return candidate;
    }
    return null;
  }

  private restoreAll(): void {
    this.#restored.clear();
    this.#overlay.replaceChildren();
    this.#resizeObserver?.disconnect();
    const health = new Map<string, TimelineCommentAnchorHealth>();
    for (const anchor of this.#anchors.values()) {
      const windowNode = this.findWindow(anchor.bbThreadId);
      const prose = this.findProse(
        anchor.bbThreadId,
        anchor.messageId,
        anchor.selector,
      );
      if (windowNode === null || prose === null) {
        health.set(anchor.id, "not-mounted");
        continue;
      }
      const restored = restoreSelector(prose, anchor.selector);
      if (restored === null) {
        health.set(anchor.id, "unanchored");
        continue;
      }
      health.set(anchor.id, "anchored");
      this.#resizeObserver?.observe(windowNode);
      this.#resizeObserver?.observe(prose);
      const fragments = [...restored.range.getClientRects()].filter(
        (rect) => rect.width > 0 || rect.height > 0,
      );
      const fallback = restored.range.getBoundingClientRect();
      const rects = fragments.length > 0 ? fragments : [fallback];
      const proseRect = prose.getBoundingClientRect();
      const side = chooseNearestGutter(rects, {
        left: proseRect.left,
        right: proseRect.right,
        width: windowNode.getBoundingClientRect().width,
      });
      const desiredY =
        rects.reduce((sum, rect) => sum + rect.top + rect.height / 2, 0) /
        rects.length;
      this.#restored.set(anchor.id, {
        anchor,
        range: restored.range,
        marker: null,
        side,
        desiredY,
        window: windowNode,
        prose,
      });
    }
    publishTimelineCommentAnchorHealth(health);
    this.rebuildHighlights();
    this.layoutMarkers();
  }

  private rebuildHighlights(): void {
    const registry = globalThis.CSS?.highlights;
    const HighlightClass = globalThis.Highlight;
    if (registry === undefined || HighlightClass === undefined) return;
    const normal = new HighlightClass();
    const active = new HighlightClass();
    for (const [id, restored] of this.#restored) {
      const paintRange =
        typeof globalThis.StaticRange === "undefined"
          ? restored.range
          : new StaticRange({
              startContainer: restored.range.startContainer,
              startOffset: restored.range.startOffset,
              endContainer: restored.range.endContainer,
              endOffset: restored.range.endOffset,
            });
      normal.add(paintRange);
      if (this.#activeIds.has(id)) active.add(paintRange);
    }
    if (this.#provisionalRange !== null) {
      const range = this.#provisionalRange;
      active.add(
        typeof globalThis.StaticRange === "undefined"
          ? range
          : new StaticRange({
              startContainer: range.startContainer,
              startOffset: range.startOffset,
              endContainer: range.endContainer,
              endOffset: range.endOffset,
            }),
      );
    }
    registry.set(NORMAL_HIGHLIGHT, normal);
    registry.set(ACTIVE_HIGHLIGHT, active);
  }

  private scheduleLayout(): void {
    if (this.#frame !== null) return;
    this.#frame = requestAnimationFrame(() => {
      this.#frame = null;
      this.layoutMarkers();
      this.positionPopover();
      this.positionActionsMenu();
    });
  }

  private layoutMarkers(): void {
    this.#overlay.replaceChildren();
    for (const restored of this.#restored.values()) {
      const rects = [...restored.range.getClientRects()];
      const bounding = restored.range.getBoundingClientRect();
      const fragments = rects.length > 0 ? rects : [bounding];
      restored.desiredY =
        fragments.reduce((sum, rect) => sum + rect.top + rect.height / 2, 0) /
        fragments.length;
      const proseRect = restored.prose.getBoundingClientRect();
      restored.side = chooseNearestGutter(fragments, {
        left: proseRect.left,
        right: proseRect.right,
        width: restored.window.getBoundingClientRect().width,
      });
      restored.marker = null;
    }
    const groups = new Map<string, RestoredThread[]>();
    for (const restored of this.#restored.values()) {
      const key = `${restored.anchor.bbThreadId}:${restored.side}`;
      const list = groups.get(key) ?? [];
      list.push(restored);
      groups.set(key, list);
    }
    for (const list of groups.values()) {
      const windowRect = list[0]!.window.getBoundingClientRect();
      const top = Math.max(8, windowRect.top);
      const bottom = Math.min(window.innerHeight - 8, windowRect.bottom);
      for (const placement of layoutGutterMarkers(
        list.map(({ anchor, desiredY }) => ({ id: anchor.id, desiredY })),
        top,
        bottom,
        MARKER_SIZE,
      )) {
        const threads = placement.ids
          .map((id) => this.#restored.get(id)!)
          .filter(Boolean);
        const marker = element(
          "button",
          "bb-comments-marker",
        ) as HTMLButtonElement;
        marker.type = "button";
        marker.dataset.bbCommentGutter = threads[0]!.side;
        marker.style.top = `${placement.y}px`;
        const proseRects = threads.map(({ prose }) =>
          prose.getBoundingClientRect(),
        );
        const gutterX =
          threads[0]!.side === "left"
            ? Math.min(...proseRects.map(({ left }) => left)) -
              MARKER_SIZE -
              MARKER_TEXT_GAP
            : Math.max(...proseRects.map(({ right }) => right)) +
              MARKER_TEXT_GAP;
        marker.style.left = `${Math.max(
          8,
          Math.min(window.innerWidth - MARKER_SIZE - 8, gutterX),
        )}px`;
        marker.setAttribute(
          "aria-label",
          threads.length === 1
            ? `Open comment thread${threads[0]!.anchor.replyCount > 0 ? ` with ${threads[0]!.anchor.replyCount} ${threads[0]!.anchor.replyCount === 1 ? "reply" : "replies"}` : ""}`
            : `Open ${threads.length} comment threads`,
        );
        marker.append(icon(StickyNote));
        if (threads.length > 1) {
          marker.classList.add("bb-comments-marker-cluster");
          marker.append(
            element(
              "span",
              "bb-comments-marker-count",
              String(threads.length),
            ),
          );
        }
        marker.addEventListener("mouseenter", () =>
          this.setActive(placement.ids),
        );
        marker.addEventListener("mouseleave", () => this.setActive([]));
        marker.addEventListener("focus", () => this.setActive(placement.ids));
        marker.addEventListener("blur", () => this.setActive([]));
        marker.addEventListener("click", () => {
          if (threads.length === 1) void this.openThread(threads[0]!.anchor.id);
          else this.openCluster(marker, threads);
        });
        this.#overlay.append(marker);
        for (const thread of threads) thread.marker = marker;
      }
    }
  }

  private setActive(ids: string[]): void {
    this.#activeIds = new Set(ids);
    this.rebuildHighlights();
  }

  private openCluster(
    marker: HTMLButtonElement,
    threads: RestoredThread[],
  ): void {
    this.closePopover();
    const menu = element("div", "bb-comments-popover bb-comments-cluster");
    menu.setAttribute("role", "dialog");
    menu.setAttribute("aria-label", "Comment threads");
    let first: HTMLButtonElement | null = null;
    for (const thread of threads) {
      const button = element(
        "button",
        "bb-comments-cluster-row",
      ) as HTMLButtonElement;
      button.type = "button";
      button.textContent = sourceExcerpt(thread.anchor.selector.exact);
      button.addEventListener(
        "click",
        () => void this.openThread(thread.anchor.id),
      );
      first ??= button;
      menu.append(button);
    }
    this.#popover = menu;
    this.#popoverThreadIds = new Set(
      threads.map(({ anchor }) => anchor.bbThreadId),
    );
    this.#portal.append(menu);
    this.installPopoverDismissal(marker);
    this.positionNear(marker, menu);
    first?.focus({ preventScroll: true });
  }

  private async openThread(
    commentThreadId: string,
    fallbackAnchor?: TimelineCommentThreadSummary,
  ): Promise<void> {
    const anchor =
      this.#anchors.get(commentThreadId) ??
      this.#restored.get(commentThreadId)?.anchor ??
      fallbackAnchor;
    if (anchor === undefined) return;
    this.#openThreadId = commentThreadId;
    this.closePopover(false);
    this.setActive([commentThreadId]);
    const popover = element(
      "section",
      "bb-comments-popover bb-comments-thread",
    );
    popover.setAttribute("role", "dialog");
    popover.setAttribute("aria-label", "Comment thread");
    popover.tabIndex = -1;
    popover.append(element("div", "bb-comments-loading", "Loading…"));
    this.#popover = popover;
    this.#popoverThreadIds = new Set([anchor.bbThreadId]);
    this.#portal.append(popover);
    this.installPopoverDismissal(
      this.#restored.get(commentThreadId)?.marker ?? null,
    );
    this.positionPopover();
    popover.focus({ preventScroll: true });
    try {
      const detail = await this.loadThread(anchor.bbThreadId, commentThreadId);
      if (this.#popover !== popover) return;
      this.renderThreadPopover(popover, detail);
      this.positionPopover();
    } catch (caught) {
      popover.replaceChildren(
        element("div", "bb-comments-error", errorMessage(caught)),
      );
    }
  }

  private async loadThread(
    bbThreadId: string,
    commentThreadId: string,
  ): Promise<TimelineCommentThreadDetail> {
    let cursor: string | undefined;
    let detail: TimelineCommentThreadDetail | null = null;
    do {
      const page = (await this.#rpc.call("getCommentThread", {
        bbThreadId,
        commentThreadId,
        ...(cursor !== undefined ? { cursor } : {}),
      })) as TimelineCommentThreadDetail;
      detail =
        detail === null
          ? page
          : { ...page, comments: [...detail.comments, ...page.comments] };
      cursor = page.nextCursor ?? undefined;
    } while (cursor !== undefined);
    return detail!;
  }

  private renderThreadPopover(
    popover: HTMLElement,
    detail: TimelineCommentThreadDetail,
  ): void {
    this.#threadUiCleanup?.();
    this.#threadUiCleanup = null;
    this.closeActionsMenu();
    delete popover.dataset.editing;
    popover.replaceChildren();
    this.#threadUiCleanup = mountMossCommentPopover(popover, {
      rpc: this.#rpc,
      detail,
      onClose: () => this.closePopover(),
      onChanged: () => this.scheduleRefresh(),
      onSendToAgent: () => {
        requestTimelineCommentHandoff(detail.thread.bbThreadId);
        this.closePopover();
      },
    });
  }

  private renderLegacyThreadPopover(
    popover: HTMLElement,
    detail: TimelineCommentThreadDetail,
  ): void {
    this.closeActionsMenu();
    delete popover.dataset.editing;
    popover.replaceChildren();
    const header = element("header", "bb-comments-thread-header");
    const source = element("div", "bb-comments-thread-source");
    source.append(icon(StickyNote), document.createTextNode("Comment"));
    const headerActions = element("div", "bb-comments-header-actions");
    const resolve = element(
      "button",
      "bb-comments-icon-control",
    ) as HTMLButtonElement;
    resolve.type = "button";
    resolve.setAttribute(
      "aria-label",
      detail.thread.resolvedAt === null ? "Resolve thread" : "Reopen thread",
    );
    resolve.title =
      detail.thread.resolvedAt === null ? "Resolve thread" : "Reopen thread";
    resolve.setAttribute(
      "aria-pressed",
      String(detail.thread.resolvedAt !== null),
    );
    resolve.append(icon(CheckCheck));
    resolve.addEventListener("click", () => {
      resolve.disabled = true;
      void this.#rpc
        .call("setThreadResolved", {
          bbThreadId: detail.thread.bbThreadId,
          commentThreadId: detail.thread.id,
          expectedVersion: detail.thread.version,
          resolved: detail.thread.resolvedAt === null,
        })
        .then(() => {
          this.closePopover();
          this.scheduleRefresh();
        })
        .catch((caught) => {
          resolve.disabled = false;
          this.handlePopoverMutationError(popover, detail, caught);
        });
    });
    const removeThread = element(
      "button",
      "bb-comments-icon-control bb-comments-destructive",
    ) as HTMLButtonElement;
    removeThread.type = "button";
    removeThread.setAttribute("aria-label", "Delete thread");
    removeThread.title = "Delete thread";
    removeThread.append(icon(Trash2));
    removeThread.addEventListener("click", () => {
      if (!window.confirm("Delete this comment thread?")) return;
      const root = detail.comments.find(({ parentId }) => parentId === null);
      if (root === undefined) return;
      removeThread.disabled = true;
      void this.#rpc
        .call("deleteComment", {
          bbThreadId: detail.thread.bbThreadId,
          commentId: root.id,
          expectedVersion: root.version,
          expectedThreadVersion: detail.thread.version,
        })
        .then(() => {
          this.closePopover();
          this.scheduleRefresh();
        })
        .catch((caught) => {
          removeThread.disabled = false;
          this.handlePopoverMutationError(popover, detail, caught);
        });
    });
    headerActions.append(resolve, removeThread);
    header.append(source, headerActions);
    popover.append(header);

    const comments = element("div", "bb-comments-thread-comments");
    for (const comment of detail.comments)
      comments.append(this.renderComment(detail, comment, popover));
    popover.append(comments);

    if (detail.thread.resolvedAt === null) {
      const reply = element("form", "bb-comments-reply");
      reply.dataset.editing = "false";
      reply.dataset.lastEditing = "false";
      const replyInner = element("div", "bb-comments-reply-inner");
      const replyComposer = element("div", "bb-comments-inline-composer");
      replyComposer.dataset.bbCommentReplyComposer = "true";
      const editFooterHost = element(
        "div",
        "bb-comments-edit-footer-host",
      );
      editFooterHost.dataset.bbCommentEditFooterHost = "true";
      const draftKey = `bb.timeline-comments.reply:${detail.thread.id}`;
      const textarea = element(
        "textarea",
        "bb-comments-reply-input",
      ) as HTMLTextAreaElement;
      textarea.placeholder = "Reply...";
      textarea.maxLength = 20_000;
      textarea.value = readDraft(draftKey) ?? "";
      const send = element(
        "button",
        "bb-comments-submit-shortcut",
      ) as HTMLButtonElement;
      send.type = "submit";
      send.setAttribute("aria-label", "Reply");
      send.title = "Reply · ⌘/Ctrl Enter";
      send.append(icon(Command), icon(CornerDownLeft));
      const error = element("div", "bb-comments-error");
      error.setAttribute("role", "status");
      const validate = () => {
        const message = commentBodyError(textarea.value);
        send.disabled = message !== null;
        error.textContent =
          message !== null && textarea.value.trim() !== "" ? message : "";
        return message;
      };
      textarea.addEventListener("input", () => {
        writeDraft(draftKey, textarea.value);
        syncInlineComposerLayout(textarea, replyComposer);
        validate();
      });
      textarea.addEventListener("keydown", (event) => {
        if (
          event.key === "Enter" &&
          (event.metaKey || event.ctrlKey)
        ) {
          event.preventDefault();
          reply.requestSubmit();
        }
      });
      replyComposer.append(textarea, send);
      replyInner.append(replyComposer, error, editFooterHost);
      reply.append(replyInner);
      reply.addEventListener("submit", (event) => {
        event.preventDefault();
        if (validate() !== null) return;
        send.disabled = true;
        void this.#rpc
          .call("reply", {
            bbThreadId: detail.thread.bbThreadId,
            commentThreadId: detail.thread.id,
            body: textarea.value,
          })
          .then((result) => {
            if (this.#popover !== popover) return;
            const fresh = result as TimelineCommentThreadDetail;
            const knownIds = new Set(detail.comments.map(({ id }) => id));
            Object.assign(detail.thread, fresh.thread);
            detail.comments.splice(0, detail.comments.length, ...fresh.comments);
            sessionStorage.removeItem(draftKey);
            textarea.value = "";
            syncInlineComposerLayout(textarea, replyComposer);
            validate();
            for (const freshComment of fresh.comments) {
              if (knownIds.has(freshComment.id)) continue;
              const freshRow = this.renderComment(detail, freshComment, popover);
              comments.append(freshRow);
              animateInsertion(freshRow);
            }
            this.scheduleRefresh();
          })
          .catch((caught) => {
            send.disabled = false;
            this.handlePopoverMutationError(popover, detail, caught);
          });
      });
      validate();
      popover.append(reply);
      syncInlineComposerLayout(textarea, replyComposer, false);
    }
  }

  private renderComment(
    detail: TimelineCommentThreadDetail,
    comment: TimelineComment,
    popover: HTMLElement,
  ): HTMLElement {
    const row = element("article", "bb-comments-comment");
    row.dataset.bbCommentId = comment.id;
    let currentComment = comment;
    const buildHeader = (action: HTMLElement): HTMLElement => {
      const header = element("header", "bb-comments-message-header");
      const byline = element("div");
      byline.append(element("strong", undefined, "Me"));
      const timestamp = element(
        "time",
        undefined,
        relativeTime(currentComment.createdAt),
      );
      timestamp.dateTime = new Date(currentComment.createdAt).toISOString();
      timestamp.title = formatTime(currentComment.createdAt);
      byline.append(timestamp);
      header.append(byline, action);
      return header;
    };
    const body = element("p", "bb-comments-comment-body", currentComment.body);
    const actions = element("div", "bb-comments-actions-menu");
    const actionsTrigger = element(
      "button",
      "bb-comments-icon-control",
    ) as HTMLButtonElement;
    actionsTrigger.type = "button";
    actionsTrigger.setAttribute("aria-label", "Comment actions");
    actionsTrigger.setAttribute("aria-haspopup", "menu");
    actionsTrigger.setAttribute("aria-expanded", "false");
    actionsTrigger.title = "Comment actions";
    actionsTrigger.append(icon(EllipsisVertical));
    const cancel = element(
      "button",
      "bb-comments-icon-control bb-comments-edit-cancel",
    ) as HTMLButtonElement;
    cancel.type = "button";
    cancel.setAttribute("aria-label", "Cancel comment edit");
    cancel.title = "Cancel edit";
    cancel.append(icon(X));
    const actionsMenu = element("div", "bb-comments-actions-popover");
    actionsMenu.setAttribute("role", "menu");
    const menuItems = () =>
      [...actionsMenu.querySelectorAll<HTMLButtonElement>('[role="menuitem"]')]
        .filter((item) => !item.disabled);
    actionsMenu.addEventListener("keydown", (event) => {
      const items = menuItems();
      const current = items.indexOf(document.activeElement as HTMLButtonElement);
      let next: HTMLButtonElement | undefined;
      if (event.key === "ArrowDown")
        next = items[(current + 1 + items.length) % items.length];
      if (event.key === "ArrowUp")
        next = items[(current - 1 + items.length) % items.length];
      if (event.key === "Home") next = items[0];
      if (event.key === "End") next = items.at(-1);
      if (next !== undefined) {
        event.preventDefault();
        next.focus({ preventScroll: true });
        return;
      }
      if (event.key !== "Tab") return;
      event.preventDefault();
      this.focusAdjacentToActionsTrigger(actionsTrigger, event.shiftKey);
      this.closeActionsMenu();
    });
    actionsMenu.addEventListener("focusout", () => {
      queueMicrotask(() => {
        if (
          this.#actionsMenu === actionsMenu &&
          !actionsMenu.contains(document.activeElement)
        ) {
          this.closeActionsMenu();
        }
      });
    });
    actionsTrigger.addEventListener("click", () => {
      if (this.#actionsTrigger === actionsTrigger) {
        this.closeActionsMenu();
        return;
      }
      this.openActionsMenu(actionsTrigger, actionsMenu);
    });
    const edit = element("button") as HTMLButtonElement;
    edit.type = "button";
    edit.tabIndex = -1;
    edit.setAttribute("role", "menuitem");
    edit.append(icon(Pencil), document.createTextNode("Edit"));
    const draftKey = `bb.timeline-comments.edit:${comment.id}`;
    const textarea = element(
      "textarea",
      "bb-comments-edit-input",
    ) as HTMLTextAreaElement;
    textarea.setAttribute("aria-label", "Edit comment");
    textarea.maxLength = 20_000;
    const editComposer = element("div", "bb-comments-edit-composer");
    const localFooterHost = element(
      "div",
      "bb-comments-local-edit-footer-host",
    );
    const editFooter = element("div", "bb-comments-edit-footer");
    const save = element(
      "button",
      "bb-comments-edit-submit",
    ) as HTMLButtonElement;
    save.type = "button";
    save.append(icon(Command), icon(CornerDownLeft));
    save.setAttribute("aria-label", "Save comment");
    save.title = "Save comment · ⌘/Ctrl Enter";
    editFooter.append(save);
    localFooterHost.append(editFooter);
    const error = element("div", "bb-comments-error");
    error.setAttribute("role", "status");
    editComposer.append(textarea, error, localFooterHost);
    const validate = () => {
      const message = commentBodyError(textarea.value);
      save.disabled = message !== null;
      error.textContent =
        message !== null && textarea.value.trim() !== "" ? message : "";
      return message;
    };
    const resetReplyRegion = () => {
      const reply = popover.querySelector<HTMLElement>(".bb-comments-reply");
      if (reply === null) return;
      reply.dataset.editing = "false";
      reply.dataset.lastEditing = "false";
      reply.removeAttribute("aria-hidden");
      reply.removeAttribute("inert");
      const replyComposer = reply.querySelector<HTMLElement>(
        "[data-bb-comment-reply-composer]",
      );
      replyComposer?.removeAttribute("aria-hidden");
      replyComposer?.removeAttribute("inert");
      localFooterHost.append(editFooter);
    };
    const finishEdit = (focusTrigger: boolean) => {
      runMeasuredModeTransition(row, () => {
        delete popover.dataset.editing;
        delete row.dataset.editing;
        resetReplyRegion();
      });
      if (focusTrigger) actionsTrigger.focus({ preventScroll: true });
    };
    const cancelEdit = () => {
      sessionStorage.removeItem(draftKey);
      finishEdit(true);
    };
    cancel.addEventListener("click", cancelEdit);
    textarea.addEventListener("input", () => {
      if (textarea.value === currentComment.body)
        sessionStorage.removeItem(draftKey);
      else writeDraft(draftKey, textarea.value);
      validate();
    });
    textarea.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        cancelEdit();
      }
      if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        save.click();
      }
    });
    save.addEventListener("click", () => {
      if (validate() !== null) return;
      const nextBody = textarea.value.trim();
      if (nextBody === currentComment.body) {
        cancelEdit();
        return;
      }
      save.disabled = true;
      void this.#rpc
        .call("updateComment", {
          bbThreadId: detail.thread.bbThreadId,
          commentId: currentComment.id,
          expectedVersion: currentComment.version,
          body: nextBody,
        })
        .then((result) => {
          if (this.#popover !== popover) return;
          const fresh = result as TimelineCommentThreadDetail;
          const updated = fresh.comments.find(({ id }) => id === currentComment.id);
          if (updated !== undefined) currentComment = updated;
          Object.assign(detail.thread, fresh.thread);
          body.textContent = currentComment.body;
          sessionStorage.removeItem(draftKey);
          finishEdit(false);
          this.scheduleRefresh();
        })
        .catch((caught) => {
          save.disabled = false;
          this.handlePopoverMutationError(popover, detail, caught);
        });
    });
    edit.addEventListener("click", () => {
      if (popover.dataset.editing !== undefined) return;
      this.closeActionsMenu();
      textarea.value = readDraft(draftKey) ?? currentComment.body;
      const isLastComment = detail.comments.at(-1)?.id === currentComment.id;
      const reply = popover.querySelector<HTMLElement>(".bb-comments-reply");
      runMeasuredModeTransition(row, () => {
        popover.dataset.editing = currentComment.id;
        row.dataset.editing = "true";
        if (reply !== null) {
          if (isLastComment) {
            reply.dataset.lastEditing = "true";
            const replyComposer = reply.querySelector<HTMLElement>(
              "[data-bb-comment-reply-composer]",
            );
            replyComposer?.setAttribute("aria-hidden", "true");
            replyComposer?.setAttribute("inert", "");
            reply
              .querySelector<HTMLElement>("[data-bb-comment-edit-footer-host]")
              ?.append(editFooter);
          } else {
            reply.dataset.editing = "true";
            reply.setAttribute("aria-hidden", "true");
            reply.setAttribute("inert", "");
          }
        }
      });
      validate();
      textarea.focus({ preventScroll: true });
    });
    const remove = element(
      "button",
      "bb-comments-destructive",
    ) as HTMLButtonElement;
    remove.type = "button";
    remove.tabIndex = -1;
    remove.setAttribute("role", "menuitem");
    remove.append(icon(Trash2), document.createTextNode("Delete"));
    remove.addEventListener("click", () => {
      if (
        !window.confirm(
          currentComment.parentId === null
            ? "Delete this comment thread?"
            : "Delete this reply?",
        )
      )
        return;
      remove.disabled = true;
      void this.#rpc
        .call("deleteComment", {
          bbThreadId: detail.thread.bbThreadId,
          commentId: currentComment.id,
          expectedVersion: currentComment.version,
          expectedThreadVersion: detail.thread.version,
        })
        .then((result) => {
          if (result.deletedThreadId !== null) {
            this.closePopover();
          } else if (result.thread !== null) {
            Object.assign(detail.thread, result.thread.thread);
            detail.comments.splice(
              0,
              detail.comments.length,
              ...result.thread.comments,
            );
            removeWithTransition(row, () => row.remove());
          }
          this.scheduleRefresh();
        })
        .catch((caught) => {
          remove.disabled = false;
          this.handlePopoverMutationError(popover, detail, caught);
        });
    });
    actionsMenu.append(edit, remove);
    actions.append(actionsTrigger, cancel);
    row.append(buildHeader(actions), body, editComposer);
    return row;
  }

  private focusAdjacentToActionsTrigger(
    trigger: HTMLButtonElement,
    backwards: boolean,
  ): void {
    const popover = trigger.closest(".bb-comments-thread");
    if (popover === null) {
      trigger.focus({ preventScroll: true });
      return;
    }
    const focusable = [
      ...popover.querySelectorAll<HTMLElement>(
        'button:not(:disabled), textarea:not(:disabled), input:not(:disabled), [href], [tabindex]:not([tabindex="-1"])',
      ),
    ].filter((node) => node.getClientRects().length > 0);
    const current = focusable.indexOf(trigger);
    const adjacent = focusable[current + (backwards ? -1 : 1)] ?? trigger;
    adjacent.focus({ preventScroll: true });
  }

  private openActionsMenu(
    trigger: HTMLButtonElement,
    menu: HTMLElement,
  ): void {
    this.closeActionsMenu();
    this.#actionsMenu = menu;
    this.#actionsTrigger = trigger;
    trigger.setAttribute("aria-expanded", "true");
    this.#portal.append(menu);
    this.positionActionsMenu();
    if (this.#actionsMenu !== menu) return;

    this.#outsideActionsMenu = (event) => {
      if (
        event.target instanceof Node &&
        (menu.contains(event.target) || trigger.contains(event.target))
      ) {
        return;
      }
      this.closeActionsMenu();
    };
    document.addEventListener("pointerdown", this.#outsideActionsMenu, true);
    menu.querySelector<HTMLButtonElement>("button")?.focus({
      preventScroll: true,
    });
  }

  private positionActionsMenu(): void {
    const menu = this.#actionsMenu;
    const trigger = this.#actionsTrigger;
    if (menu === null || trigger === null) return;
    if (!trigger.isConnected) {
      this.closeActionsMenu();
      return;
    }
    const triggerRect = trigger.getBoundingClientRect();
    const scrollViewport = trigger.closest<HTMLElement>(
      ".bb-comments-thread-comments",
    );
    if (scrollViewport !== null) {
      const viewportRect = scrollViewport.getBoundingClientRect();
      if (
        triggerRect.top < viewportRect.top ||
        triggerRect.bottom > viewportRect.bottom
      ) {
        this.closeActionsMenu();
        return;
      }
    }
    const menuRect = menu.getBoundingClientRect();
    const gap = 4;
    const maxLeft = Math.max(8, window.innerWidth - menuRect.width - 8);
    const left = Math.max(
      8,
      Math.min(
        maxLeft,
        triggerRect.right - menuRect.width,
      ),
    );
    const below = triggerRect.bottom + gap;
    const candidateTop =
      below + menuRect.height <= window.innerHeight - 8
        ? below
        : triggerRect.top - menuRect.height - gap;
    const maxTop = Math.max(8, window.innerHeight - menuRect.height - 8);
    const top = Math.max(8, Math.min(maxTop, candidateTop));
    menu.style.left = `${left}px`;
    menu.style.top = `${top}px`;
  }

  private closeActionsMenu(restoreFocus = false): void {
    const trigger = this.#actionsTrigger;
    if (this.#outsideActionsMenu !== null) {
      document.removeEventListener(
        "pointerdown",
        this.#outsideActionsMenu,
        true,
      );
      this.#outsideActionsMenu = null;
    }
    this.#actionsMenu?.remove();
    this.#actionsMenu = null;
    this.#actionsTrigger = null;
    trigger?.setAttribute("aria-expanded", "false");
    if (restoreFocus && trigger?.isConnected === true)
      trigger.focus({ preventScroll: true });
  }

  private showPopoverError(popover: HTMLElement, error: unknown): void {
    const existing = popover.querySelector(".bb-comments-error");
    const node = existing ?? element("div", "bb-comments-error");
    node.textContent = errorMessage(error);
    if (existing === null) popover.append(node);
  }

  private handlePopoverMutationError(
    popover: HTMLElement,
    detail: TimelineCommentThreadDetail,
    error: unknown,
  ): void {
    this.showPopoverError(popover, error);
    if (!/changed/iu.test(errorMessage(error))) return;
    void this.loadThread(detail.thread.bbThreadId, detail.thread.id).then(
      (fresh) => {
        if (this.#popover !== popover) return;
        this.renderThreadPopover(popover, fresh);
        this.showPopoverError(popover, error);
      },
    );
  }

  private installPopoverDismissal(invoker: HTMLElement | null): void {
    this.removePopoverDismissal();
    this.#popoverInvoker = invoker;
    this.#outsidePopover = (event) => {
      if (
        event.target instanceof Node &&
        (this.#popover?.contains(event.target) === true ||
          this.#popoverInvoker?.contains(event.target) === true ||
          this.#actionsMenu?.contains(event.target) === true ||
          this.#portal
            .querySelector(".bb-comments-actions-popover")
            ?.contains(event.target) === true)
      ) {
        return;
      }
      this.closePopover();
    };
    this.#popoverKeydown = (event) => {
      if (event.key !== "Escape") return;
      const componentMenu = this.#portal.querySelector(
        ".bb-comments-actions-popover",
      );
      if (componentMenu !== null) {
        event.preventDefault();
        event.stopPropagation();
        this.#popover
          ?.querySelector<HTMLButtonElement>(
            'button[aria-label="Comment actions"][aria-expanded="true"]',
          )
          ?.click();
        return;
      }
      if (this.#actionsMenu !== null) {
        event.preventDefault();
        this.closeActionsMenu(true);
        return;
      }
      const cancelEdit = this.#popover?.querySelector<HTMLButtonElement>(
        'button[aria-label="Cancel comment edit"]',
      );
      if (
        this.#popover?.querySelector('[data-comment-editing="true"]') !== null &&
        cancelEdit != null
      ) {
        event.preventDefault();
        event.stopPropagation();
        cancelEdit.click();
        return;
      }
      event.preventDefault();
      this.closePopover();
    };
    document.addEventListener("pointerdown", this.#outsidePopover, true);
    document.addEventListener("keydown", this.#popoverKeydown, true);
  }

  private removePopoverDismissal(): void {
    if (this.#outsidePopover !== null) {
      document.removeEventListener("pointerdown", this.#outsidePopover, true);
      this.#outsidePopover = null;
    }
    if (this.#popoverKeydown !== null) {
      document.removeEventListener("keydown", this.#popoverKeydown, true);
      this.#popoverKeydown = null;
    }
  }

  private positionPopover(): void {
    if (this.#popover === null || this.#openThreadId === null) return;
    const marker = this.#restored.get(this.#openThreadId)?.marker;
    if (marker !== null && marker !== undefined)
      this.positionNear(marker, this.#popover);
  }

  private positionNear(anchor: HTMLElement, popover: HTMLElement): void {
    const rect = anchor.getBoundingClientRect();
    const width = Math.min(POPOVER_WIDTH, window.innerWidth - 16);
    popover.style.width = `${width}px`;
    const leftOption = rect.left - width - 8;
    const rightOption = rect.right + 8;
    const fitsLeft = leftOption >= 8;
    const fitsRight = rightOption + width <= window.innerWidth - 8;
    const gutter = anchor.dataset.bbCommentGutter;
    const left =
      gutter === "left" && fitsLeft
        ? leftOption
        : gutter === "right" && fitsRight
          ? rightOption
          : fitsRight
            ? rightOption
            : leftOption;
    popover.style.left = `${Math.max(8, Math.min(window.innerWidth - width - 8, left))}px`;
    const height = Math.min(
      popover.getBoundingClientRect().height || 300,
      window.innerHeight - 16,
    );
    popover.style.top = `${Math.max(8, Math.min(window.innerHeight - height - 8, rect.top - 8))}px`;
  }

  private closeComposer(): void {
    if (this.#outsideComposer !== null) {
      document.removeEventListener("pointerdown", this.#outsideComposer, true);
      this.#outsideComposer = null;
    }
    this.#composerUiCleanup?.();
    this.#composerUiCleanup = null;
    this.#composer?.remove();
    this.#composer = null;
    this.#composerThreadId = null;
    this.#provisionalRange = null;
    this.rebuildHighlights();
  }

  private closePopover(clearOpen = true): void {
    const invoker = this.#popoverInvoker;
    const currentMarker =
      this.#openThreadId === null
        ? null
        : (this.#restored.get(this.#openThreadId)?.marker ?? null);
    const focusTarget =
      invoker?.isConnected === true ? invoker : currentMarker;
    this.closeActionsMenu();
    this.removePopoverDismissal();
    this.#threadUiCleanup?.();
    this.#threadUiCleanup = null;
    this.#popoverInvoker = null;
    this.#popover?.remove();
    this.#popover = null;
    this.#popoverThreadIds.clear();
    if (clearOpen) this.#openThreadId = null;
    this.setActive([]);
    if (clearOpen && focusTarget?.isConnected === true) {
      focusTarget.focus({ preventScroll: true });
    }
  }

  destroy(): void {
    if (this.#destroyed) return;
    this.#destroyed = true;
    this.#focusNonce += 1;
    this.#observer.disconnect();
    this.#resizeObserver?.disconnect();
    if (this.#frame !== null) cancelAnimationFrame(this.#frame);
    for (const dispose of this.#disposers.splice(0).reverse()) dispose();
    this.closeComposer();
    this.closePopover();
    this.#portal.remove();
    this.#highlightStyle.remove();
    publishTimelineCommentAnchorHealth(new Map());
    globalThis.CSS?.highlights?.delete(NORMAL_HIGHLIGHT);
    globalThis.CSS?.highlights?.delete(ACTIVE_HIGHLIGHT);
  }
}

function detailId(id: string | null): string {
  if (id === null) throw new Error("Comment thread was not created");
  return id;
}

export function mountTimelineCommentsController(
  context: PluginContentScriptContext,
): () => void {
  const controller = new TimelineCommentsController(context);
  return () => controller.destroy();
}
