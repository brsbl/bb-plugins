import type {
  PluginContentScriptContext,
  PluginMessageActionContext,
  PluginRpcClient,
} from "@bb/plugin-sdk/app";
import {
  StickyNote,
  createElement as createLucideElement,
  type IconNode,
} from "lucide";
import type {
  TimelineCommentThreadDetail,
  TimelineCommentThreadSummary,
  timelineCommentsRpcContract,
} from "./server.js";
import {
  chooseAvailableGutter,
  layoutGutterMarkers,
  restoreSelector,
  selectorForRange,
  type StoredSelector,
} from "./anchors.js";
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
import {
  emptyCommentValue,
  readCommentDraft,
  writeCommentDraft,
} from "./comment-value.js";

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
  side: "left" | "right" | null;
  desiredY: number;
  window: HTMLElement;
  prose: HTMLElement;
}

function renderedContentBounds(
  prose: HTMLElement,
): Pick<DOMRect, "left" | "right"> {
  const proseRect = prose.getBoundingClientRect();
  let left = proseRect.left;
  let right = proseRect.right;
  for (const table of prose.querySelectorAll("table")) {
    const tableRect = table.getBoundingClientRect();
    left = Math.min(left, tableRect.left);
    right = Math.max(right, tableRect.right);
  }
  return { left, right };
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

function isRelevantMutation(record: MutationRecord): boolean {
  const selector = `[data-thread-window], [data-timeline-row-id], ${MESSAGE_PROSE_SELECTOR}`;
  return [...record.addedNodes, ...record.removedNodes].some(
    (node) =>
      node instanceof window.Element &&
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
  readonly #threadWindowVisibility = new Map<HTMLElement, boolean>();
  readonly #disposers: Array<() => void> = [];
  readonly #observer: MutationObserver;
  readonly #resizeObserver: ResizeObserver | null;
  #refreshNonce = 0;
  #refreshing: Promise<void> | null = null;
  #refreshQueued = false;
  #frame: number | null = null;
  #popover: HTMLElement | null = null;
  #threadUiCleanup: (() => void) | null = null;
  #composer: HTMLElement | null = null;
  #composerUiCleanup: (() => void) | null = null;
  #composerThreadId: string | null = null;
  #composerWindow: HTMLElement | null = null;
  #popoverThreadIds = new Set<string>();
  #popoverWindows = new Set<HTMLElement>();
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
      const visibilityChanged = this.reconcileThreadWindowVisibility();
      if (visibilityChanged) {
        this.syncAttachedUiVisibility();
        // Visibility is host-owned state. Reconcile cached anchors now so
        // portalled markers and highlights disappear in the same DOM turn,
        // even when the following RPC refresh is slow or fails.
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
    const shell = element("div", "bb-comments-composer");
    shell.setAttribute("role", "dialog");
    shell.setAttribute("aria-label", "Add comment");
    const initialValue = readCommentDraft(key) ?? emptyCommentValue();

    const firstRect = captured.rects[0];
    const x = firstRect?.x ?? window.innerWidth / 2;
    const y = captured.rects.at(-1)?.y ?? window.innerHeight / 2;
    shell.style.left = `${Math.max(8, Math.min(window.innerWidth - COMPOSER_WIDTH - 8, x))}px`;
    shell.style.top = `${Math.max(8, Math.min(window.innerHeight - 144, y + 17))}px`;
    let draftValue = initialValue;
    const persist = () => writeCommentDraft(key, draftValue);
    this.#composerUiCleanup = mountMossCommentComposer(shell, {
      bbThreadId: context.threadId,
      initialValue,
      onChange: (value) => {
        draftValue = value;
        persist();
      },
      onCancel: () => {
        persist();
        this.closeComposer();
      },
      onSubmit: async (value) => {
        const detail = await this.#rpc.call("createThread", {
          bbThreadId: context.threadId,
          message: context.message,
          selector: {
            ...captured.selector,
            rects: captured.rects.map((rect) => ({ ...rect })),
          },
          body: value.text,
          mentions: [...value.mentions],
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
    this.#composerWindow = captured.threadWindow;
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
      if (
        ![...this.#threadWindows.values()].some((registered) =>
          registered.has(windowNode),
        )
      ) {
        this.#threadWindowVisibility.delete(windowNode);
      }
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
    this.#threadWindowVisibility.set(
      windowNode,
      isThreadWindowRendered(windowNode),
    );
    if (changed || windows.size !== size) this.scheduleRefresh();
  }

  private threadIdForWindow(windowNode: HTMLElement): string | null {
    for (const [threadId, windows] of this.#threadWindows) {
      if (windows.has(windowNode)) return threadId;
    }
    return null;
  }

  private reconcileThreadWindowVisibility(): boolean {
    let changed = false;
    for (const windows of this.#threadWindows.values()) {
      for (const windowNode of windows) {
        const rendered = isThreadWindowRendered(windowNode);
        const previous = this.#threadWindowVisibility.get(windowNode);
        this.#threadWindowVisibility.set(windowNode, rendered);
        if (previous !== undefined && previous !== rendered) changed = true;
      }
    }
    return changed;
  }

  private syncAttachedUiVisibility(): void {
    const visibleThreadIds = new Set(
      [...this.#threadWindows.keys()].filter(
        (threadId) => this.findWindow(threadId) !== null,
      ),
    );
    if (
      (this.#composerWindow !== null &&
        !isThreadWindowRendered(this.#composerWindow)) ||
      (this.#composerWindow === null &&
        this.#composerThreadId !== null &&
        !visibleThreadIds.has(this.#composerThreadId))
    ) {
      this.closeComposer();
    }
    if (
      (this.#popoverWindows.size > 0 &&
        [...this.#popoverWindows].some(
          (windowNode) => !isThreadWindowRendered(windowNode),
        )) ||
      (this.#popoverWindows.size === 0 &&
        this.#popoverThreadIds.size > 0 &&
        [...this.#popoverThreadIds].some(
          (threadId) => !visibleThreadIds.has(threadId),
        ))
    ) {
      this.closePopover(true, false);
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
    if (
      restored === undefined ||
      !isThreadWindowRendered(restored.window)
    ) {
      return false;
    }
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
    if (this.#refreshQueued || this.#refreshing !== null) return;
    this.#refreshQueued = true;
    queueMicrotask(() => {
      this.#refreshQueued = false;
      void this.refresh().catch((error: unknown) => {
        if (!this.#destroyed)
          console.error("timeline-comments refresh failed", error);
      });
    });
  }

  async refresh(): Promise<void> {
    if (this.#destroyed) return;
    if (this.#refreshing !== null) {
      return this.#refreshing;
    }
    this.#refreshing = (async () => {
      let nonce: number;
      do {
        nonce = this.#refreshNonce;
        await this.loadAnchors();
      } while (nonce !== this.#refreshNonce && !this.#destroyed);
    })();
    try {
      await this.#refreshing;
    } finally {
      this.#refreshing = null;
    }
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
        if (
          ![...this.#threadWindows.values()].some((registered) =>
            registered.has(windowNode),
          )
        ) {
          this.#threadWindowVisibility.delete(windowNode);
        }
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
      for (const table of prose.querySelectorAll("table")) {
        this.#resizeObserver?.observe(table);
      }
      const fragments = [...restored.range.getClientRects()].filter(
        (rect) => rect.width > 0 || rect.height > 0,
      );
      const fallback = restored.range.getBoundingClientRect();
      const rects = fragments.length > 0 ? fragments : [fallback];
      const contentBounds = renderedContentBounds(prose);
      const side = chooseAvailableGutter(
        rects,
        contentBounds,
        windowNode.getBoundingClientRect(),
        MARKER_SIZE + MARKER_TEXT_GAP,
      );
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
      const contentBounds = renderedContentBounds(restored.prose);
      restored.side = chooseAvailableGutter(
        fragments,
        contentBounds,
        restored.window.getBoundingClientRect(),
        MARKER_SIZE + MARKER_TEXT_GAP,
      );
      restored.marker = null;
    }
    const groups = new Map<string, RestoredThread[]>();
    for (const restored of this.#restored.values()) {
      if (restored.side === null) continue;
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
        const side = threads[0]?.side;
        if (side === null || side === undefined) continue;
        const marker = element(
          "button",
          "bb-comments-marker",
        ) as HTMLButtonElement;
        marker.type = "button";
        marker.dataset.bbCommentGutter = side;
        marker.style.top = `${placement.y}px`;
        const contentBounds = threads.map(({ prose }) =>
          renderedContentBounds(prose),
        );
        const gutterX =
          side === "left"
            ? Math.min(...contentBounds.map(({ left }) => left)) -
              MARKER_SIZE -
              MARKER_TEXT_GAP
            : Math.max(...contentBounds.map(({ right }) => right)) +
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
    if (
      this.#openThreadId !== null &&
      this.#restored.get(this.#openThreadId)?.marker === null
    ) {
      this.closePopover();
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
    this.#popoverWindows = new Set(threads.map(({ window }) => window));
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
    const restored = this.#restored.get(commentThreadId);
    const parentWindow = restored?.window ?? this.findWindow(anchor.bbThreadId);
    if (parentWindow === null || !isThreadWindowRendered(parentWindow)) return;
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
    const restoredWindow = restored?.window ?? parentWindow;
    this.#popoverWindows =
      restoredWindow === undefined
        ? new Set<HTMLElement>()
        : new Set([restoredWindow]);
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
    delete popover.dataset.editing;
    popover.replaceChildren();
    this.#threadUiCleanup = mountMossCommentPopover(popover, {
      rpc: this.#rpc,
      detail,
      onClose: () => this.closePopover(),
      onChanged: () => this.scheduleRefresh(),
      onSendToAgent: () => {
        void requestTimelineCommentHandoff(detail.thread.bbThreadId).then(
          (accepted) => {
            if (accepted && this.#popover === popover) {
              this.closePopover(true, false);
            }
          },
        );
      },
    });
  }

  private installPopoverDismissal(invoker: HTMLElement | null): void {
    this.removePopoverDismissal();
    this.#popoverInvoker = invoker;
    this.#outsidePopover = (event) => {
      if (
        event.target instanceof Node &&
        (this.#popover?.contains(event.target) === true ||
          this.#popoverInvoker?.contains(event.target) === true ||
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
    this.#composerWindow = null;
    this.#provisionalRange = null;
    this.rebuildHighlights();
  }

  private closePopover(clearOpen = true, restoreFocus = true): void {
    const invoker = this.#popoverInvoker;
    const currentMarker =
      this.#openThreadId === null
        ? null
        : (this.#restored.get(this.#openThreadId)?.marker ?? null);
    const focusTarget =
      invoker?.isConnected === true ? invoker : currentMarker;
    this.removePopoverDismissal();
    this.#threadUiCleanup?.();
    this.#threadUiCleanup = null;
    this.#popoverInvoker = null;
    this.#popover?.remove();
    this.#popover = null;
    this.#popoverThreadIds.clear();
    this.#popoverWindows.clear();
    if (clearOpen) this.#openThreadId = null;
    this.setActive([]);
    if (restoreFocus && clearOpen && focusTarget?.isConnected === true) {
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
