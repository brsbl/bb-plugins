import type {
  PluginContentScriptContext,
  PluginMessageActionContext,
  PluginRpcClient,
} from "@bb/plugin-sdk/app";
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
} from "./anchors.js";
import { createIndividualHandoffPrompt } from "./handoff.js";
import { commentBodyError } from "./comment-body.js";
import {
  installTimelineCommentsController,
  publishTimelineCommentAnchorHealth,
  type TimelineCommentAnchorHealth,
} from "./bridge.js";

type Rpc = PluginRpcClient<typeof timelineCommentsRpcContract>;

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
const MARKER_SIZE = 32;
const MARKER_TEXT_GAP = 8;

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
  if (elapsed < 60_000) return "now";
  if (elapsed < 3_600_000) return `${Math.floor(elapsed / 60_000)}m`;
  if (elapsed < 86_400_000) return `${Math.floor(elapsed / 3_600_000)}h`;
  if (elapsed < 604_800_000) return `${Math.floor(elapsed / 86_400_000)}d`;
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(value);
}

type IconName = "check" | "close" | "more" | "note" | "send" | "trash";

function icon(name: IconName): SVGSVGElement {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute(OWNED, "");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("width", "16");
  svg.setAttribute("height", "16");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "1.7");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.setAttribute("aria-hidden", "true");
  const definitions: Record<IconName, string[]> = {
    check: ["M5 12l4 4L19 6", "M3 7l3 3", "M13 16l2 2 6-7"],
    close: ["M7 7l10 10", "M17 7 7 17"],
    more: [],
    note: [
      "M6.5 3.5h8.8L19.5 7.7v12.8h-13z",
      "M15 3.5v4.4h4.5",
      "M9.5 12h7",
      "M9.5 15.5h4.5",
    ],
    send: ["M4 4l16 8-16 8 3-8-3-8Z", "M7 12h13"],
    trash: [
      "M4 7h16",
      "M9 7V4h6v3",
      "m6 4-.5 7",
      "m10-7 .5 7",
      "M6 7l1 14h10l1-14",
    ],
  };
  if (name === "more") {
    for (const cx of ["6", "12", "18"]) {
      const circle = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "circle",
      );
      circle.setAttribute("cx", cx);
      circle.setAttribute("cy", "12");
      circle.setAttribute("r", "1");
      circle.setAttribute("fill", "currentColor");
      circle.setAttribute("stroke", "none");
      svg.append(circle);
    }
    return svg;
  }
  for (const definition of definitions[name]) {
    const path = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path",
    );
    path.setAttribute("d", definition);
    svg.append(path);
  }
  return svg;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong";
}

function isRelevantMutation(record: MutationRecord): boolean {
  const selector =
    "[data-bb-thread-window], [data-bb-conversation-message-id], [data-bb-message-prose-root]";
  return [...record.addedNodes, ...record.removedNodes].some(
    (node) =>
      node instanceof Element &&
      (node.matches(selector) || node.querySelector(selector) !== null),
  );
}

class TimelineCommentsController {
  readonly #rpc: Rpc;
  readonly #navigate: PluginContentScriptContext["navigate"];
  readonly #portal = decorateRoot(element("div", "bb-comments-portal"));
  readonly #overlay = element("div", "bb-comments-overlay");
  readonly #highlightStyle = element("style");
  readonly #anchors = new Map<string, TimelineCommentThreadSummary>();
  readonly #restored = new Map<string, RestoredThread>();
  readonly #disposers: Array<() => void> = [];
  readonly #observer: MutationObserver;
  readonly #resizeObserver: ResizeObserver | null;
  #refreshNonce = 0;
  #refreshing: Promise<void> | null = null;
  #frame: number | null = null;
  #popover: HTMLElement | null = null;
  #composer: HTMLElement | null = null;
  #activeIds = new Set<string>();
  #provisionalRange: Range | null = null;
  #openThreadId: string | null = null;
  #destroyed = false;
  #sawConnected = false;
  #focusNonce = 0;
  #outsideComposer: ((event: PointerEvent) => void) | null = null;
  #outsidePopover: ((event: PointerEvent) => void) | null = null;
  #popoverKeydown: ((event: KeyboardEvent) => void) | null = null;
  #popoverInvoker: HTMLElement | null = null;

  constructor(context: PluginContentScriptContext) {
    this.#rpc = context.rpc as Rpc;
    this.#navigate = context.navigate;
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
      if (records.some(isRelevantMutation)) this.scheduleRefresh();
    });
    this.#observer.observe(document.body, { childList: true, subtree: true });
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
    this.#disposers.push(
      context.realtime.subscribe("comments-changed", () =>
        this.scheduleRefresh(),
      ),
    );
    this.#disposers.push(
      context.realtime.subscribeConnectionState((state) => {
        if (state === "connected") {
          if (this.#sawConnected) this.scheduleRefresh();
          this.#sawConnected = true;
        }
      }),
    );
    this.#sawConnected = context.realtime.getConnectionState() === "connected";
    this.#disposers.push(installTimelineCommentsController(this));
    this.scheduleRefresh();
  }

  beginComment(context: PluginMessageActionContext): void {
    if (context.selection === undefined || context.selectedText === undefined)
      return;
    this.closeComposer();
    const root = this.findProse(context.threadId, context.message.id);
    const restored =
      root === null ? null : restoreSelector(root, context.selection);
    this.#provisionalRange = restored?.range ?? null;
    this.rebuildHighlights();

    const key = `bb.timeline-comments.draft:${context.threadId}:${context.message.id}:${context.selection.start}:${context.selection.end}`;
    const shell = element("form", "bb-comments-composer");
    shell.setAttribute("role", "dialog");
    shell.setAttribute("aria-label", "Add comment");
    const textarea = element(
      "textarea",
      "bb-comments-textarea",
    ) as HTMLTextAreaElement;
    textarea.placeholder = "Add a comment…";
    textarea.maxLength = 20_000;
    textarea.value = readDraft(key) ?? "";
    const footer = element("div", "bb-comments-composer-footer");
    footer.append(element("span", "bb-comments-hint", "⌘/Ctrl Enter"));
    const submit = element(
      "button",
      "bb-comments-primary",
      "Comment",
    ) as HTMLButtonElement;
    submit.type = "submit";
    footer.append(submit);
    const error = element("div", "bb-comments-error");
    error.setAttribute("role", "status");
    shell.append(textarea, error, footer);

    const firstRect = context.selection.rects[0];
    const x = firstRect?.x ?? window.innerWidth / 2;
    const y = context.selection.rects.at(-1)?.y ?? window.innerHeight / 2;
    shell.style.left = `${Math.max(8, Math.min(window.innerWidth - 328, x))}px`;
    shell.style.top = `${Math.max(8, Math.min(window.innerHeight - 180, y + 22))}px`;
    const validate = () => {
      const message = commentBodyError(textarea.value);
      submit.disabled = message !== null;
      error.textContent =
        message !== null && textarea.value.trim() !== "" ? message : "";
      return message;
    };
    const persist = () => writeDraft(key, textarea.value);
    textarea.addEventListener("input", () => {
      persist();
      validate();
    });
    textarea.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        persist();
        this.closeComposer();
      }
      if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        shell.requestSubmit();
      }
    });
    shell.addEventListener("submit", (event) => {
      event.preventDefault();
      if (validate() !== null) return;
      submit.disabled = true;
      error.textContent = "";
      void this.#rpc
        .call("createThread", {
          bbThreadId: context.threadId,
          message: context.message,
          selector: {
            ...context.selection!,
            rects: context.selection!.rects.map((rect) => ({ ...rect })),
          },
          body: textarea.value,
        })
        .then((detail) => {
          sessionStorage.removeItem(key);
          this.closeComposer();
          this.#openThreadId = detail.thread.id;
          return this.refresh();
        })
        .then(() => this.openThread(detailId(this.#openThreadId)))
        .catch((caught) => {
          submit.disabled = false;
          error.textContent = errorMessage(caught);
        });
    });
    validate();
    this.#composer = shell;
    this.#portal.append(shell);
    this.#outsideComposer = (event) => {
      if (event.target instanceof Node && shell.contains(event.target)) return;
      persist();
      this.closeComposer();
    };
    document.addEventListener("pointerdown", this.#outsideComposer, true);
    requestAnimationFrame(() => textarea.focus());
  }

  async focusThread(commentThreadId: string): Promise<boolean> {
    const request = ++this.#focusNonce;
    this.#openThreadId = commentThreadId;
    await this.refresh();
    if (request !== this.#focusNonce || this.#destroyed) return false;
    const restored = this.#restored.get(commentThreadId);
    if (restored === undefined) return false;
    const scrollRoot = restored.window.querySelector<HTMLElement>(
      "[data-bb-thread-scroll-root]",
    );
    if (scrollRoot === null) return false;
    const rangeRect = restored.range.getBoundingClientRect();
    const scrollRect = scrollRoot.getBoundingClientRect();
    scrollRoot.scrollBy({
      top:
        rangeRect.top +
        rangeRect.height / 2 -
        (scrollRect.top + scrollRect.height / 2),
      behavior: "smooth",
    });
    this.setActive([commentThreadId]);
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => resolve()),
    );
    if (request !== this.#focusNonce || this.#destroyed) return false;
    this.scheduleLayout();
    restored.marker?.focus({ preventScroll: true });
    await this.openThread(commentThreadId);
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
    const threadIds = [
      ...document.querySelectorAll<HTMLElement>("[data-bb-thread-window]"),
    ]
      .map((node) => node.dataset.bbThreadWindow)
      .filter((id): id is string => typeof id === "string" && id !== "")
      .filter((id, index, all) => all.indexOf(id) === index)
      .slice(0, 20);
    this.#anchors.clear();
    if (threadIds.length > 0) {
      let cursor: string | undefined;
      do {
        const page = await this.#rpc.call("listOpenAnchors", {
          threadIds,
          ...(cursor !== undefined ? { cursor } : {}),
        });
        for (const anchor of page.anchors)
          this.#anchors.set(anchor.id, anchor as TimelineCommentThreadSummary);
        cursor = page.nextCursor ?? undefined;
      } while (cursor !== undefined && !this.#destroyed);
    }
    this.restoreAll();
  }

  private findWindow(threadId: string): HTMLElement | null {
    return document.querySelector<HTMLElement>(
      `[data-bb-thread-window="${escapeSelector(threadId)}"]`,
    );
  }

  private findProse(threadId: string, messageId: string): HTMLElement | null {
    const windowNode = this.findWindow(threadId);
    const row = windowNode?.querySelector<HTMLElement>(
      `[data-bb-conversation-message-id="${escapeSelector(messageId)}"]`,
    );
    return (
      row?.querySelector<HTMLElement>("[data-bb-message-prose-root]") ?? null
    );
  }

  private restoreAll(): void {
    this.#restored.clear();
    this.#overlay.replaceChildren();
    this.#resizeObserver?.disconnect();
    const health = new Map<string, TimelineCommentAnchorHealth>();
    for (const anchor of this.#anchors.values()) {
      const windowNode = this.findWindow(anchor.bbThreadId);
      const prose = this.findProse(anchor.bbThreadId, anchor.messageId);
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
        if (threads.length === 1) marker.append(icon("note"));
        else marker.textContent = String(threads.length);
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
    this.#portal.append(menu);
    this.installPopoverDismissal(marker);
    this.positionNear(marker, menu);
    first?.focus({ preventScroll: true });
  }

  private async openThread(commentThreadId: string): Promise<void> {
    const anchor =
      this.#anchors.get(commentThreadId) ??
      this.#restored.get(commentThreadId)?.anchor;
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
    delete popover.dataset.editing;
    popover.replaceChildren();
    const header = element("header", "bb-comments-thread-header");
    const source = element("div", "bb-comments-thread-source", "Comment");
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
    resolve.append(icon("check"));
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
    const agent = element(
      "button",
      "bb-comments-icon-control",
    ) as HTMLButtonElement;
    agent.type = "button";
    agent.setAttribute("aria-label", "Send thread to agent");
    agent.title = "Send thread to agent";
    agent.append(icon("send"));
    agent.addEventListener("click", () => {
      const prompt = createIndividualHandoffPrompt(
        detail.comments.map(({ body }) => body).join("\n\n"),
        detail.thread.selector.exact,
      );
      this.closePopover();
      this.#navigate.toCompose({ initialPrompt: prompt, focusPrompt: true });
    });
    const removeThread = element(
      "button",
      "bb-comments-icon-control bb-comments-destructive",
    ) as HTMLButtonElement;
    removeThread.type = "button";
    removeThread.setAttribute("aria-label", "Delete thread");
    removeThread.title = "Delete thread";
    removeThread.append(icon("trash"));
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
    headerActions.append(resolve, agent, removeThread);
    header.append(source, headerActions);
    popover.append(header);

    const comments = element("div", "bb-comments-thread-comments");
    for (const comment of detail.comments)
      comments.append(this.renderComment(detail, comment, popover));
    popover.append(comments);

    if (detail.thread.resolvedAt === null) {
      const reply = element("form", "bb-comments-reply");
      const replyComposer = element("div", "bb-comments-inline-composer");
      const draftKey = `bb.timeline-comments.reply:${detail.thread.id}`;
      const textarea = element(
        "textarea",
        "bb-comments-reply-input",
      ) as HTMLTextAreaElement;
      textarea.placeholder = "Reply…";
      textarea.maxLength = 20_000;
      textarea.value = readDraft(draftKey) ?? "";
      const send = element(
        "button",
        "bb-comments-icon-control",
      ) as HTMLButtonElement;
      send.type = "submit";
      send.setAttribute("aria-label", "Reply");
      send.title = "Reply · ⌘/Ctrl Enter";
      send.append(icon("send"));
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
      reply.append(replyComposer, error);
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
          .then(() => {
            sessionStorage.removeItem(draftKey);
            return this.openThread(detail.thread.id);
          })
          .catch((caught) => {
            send.disabled = false;
            this.handlePopoverMutationError(popover, detail, caught);
          });
      });
      validate();
      popover.append(reply);
    }
  }

  private renderComment(
    detail: TimelineCommentThreadDetail,
    comment: TimelineComment,
    popover: HTMLElement,
  ): HTMLElement {
    const row = element("article", "bb-comments-comment");
    const buildHeader = (action: HTMLElement): HTMLElement => {
      const header = element("header", "bb-comments-message-header");
      const byline = element("div");
      byline.append(element("strong", undefined, "You"));
      const timestamp = element("time", undefined, relativeTime(comment.createdAt));
      timestamp.dateTime = new Date(comment.createdAt).toISOString();
      timestamp.title = formatTime(comment.createdAt);
      byline.append(timestamp);
      header.append(byline, action);
      return header;
    };
    const body = element("p", "bb-comments-comment-body", comment.body);
    const actions = element("details", "bb-comments-actions-menu");
    const actionsTrigger = element(
      "summary",
      "bb-comments-icon-control",
    ) as HTMLElement;
    actionsTrigger.setAttribute("role", "button");
    actionsTrigger.setAttribute("aria-label", "Comment actions");
    actionsTrigger.title = "Comment actions";
    actionsTrigger.append(icon("more"));
    const actionsMenu = element("div");
    actionsMenu.setAttribute("role", "menu");
    const agent = element(
      "button",
      undefined,
      "Send to agent",
    ) as HTMLButtonElement;
    agent.type = "button";
    agent.setAttribute("role", "menuitem");
    agent.addEventListener("click", () => {
      const prompt = createIndividualHandoffPrompt(
        comment.body,
        detail.thread.selector.exact,
      );
      this.closePopover();
      this.#navigate.toCompose({
        initialPrompt: prompt,
        focusPrompt: true,
      });
    });
    const edit = element(
      "button",
      undefined,
      "Edit",
    ) as HTMLButtonElement;
    edit.type = "button";
    edit.setAttribute("role", "menuitem");
    edit.addEventListener("click", () => {
      const draftKey = `bb.timeline-comments.edit:${comment.id}`;
      popover.dataset.editing = "true";
      row.dataset.editing = "true";
      actions.open = false;
      const textarea = element(
        "textarea",
        "bb-comments-edit-input",
      ) as HTMLTextAreaElement;
      textarea.setAttribute("aria-label", "Edit comment");
      textarea.maxLength = 20_000;
      textarea.value = readDraft(draftKey) ?? comment.body;
      const editComposer = element("div", "bb-comments-inline-composer");
      const save = element(
        "button",
        "bb-comments-submit-shortcut",
        "⌘ ↵",
      ) as HTMLButtonElement;
      save.type = "button";
      save.setAttribute("aria-label", "Save comment");
      save.title = "Save comment · ⌘/Ctrl Enter";
      const error = element("div", "bb-comments-error");
      error.setAttribute("role", "status");
      const validate = () => {
        const message = commentBodyError(textarea.value);
        save.disabled = message !== null || textarea.value === comment.body;
        error.textContent =
          message !== null && textarea.value.trim() !== "" ? message : "";
        return message;
      };
      const cancelEdit = () => {
        sessionStorage.removeItem(draftKey);
        this.renderThreadPopover(popover, detail);
      };
      textarea.addEventListener("input", () => {
        if (textarea.value === comment.body) sessionStorage.removeItem(draftKey);
        else writeDraft(draftKey, textarea.value);
        validate();
      });
      textarea.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          cancelEdit();
        }
        if (
          event.key === "Enter" &&
          (event.metaKey || event.ctrlKey)
        ) {
          event.preventDefault();
          save.click();
        }
      });
      save.addEventListener("click", () => {
        if (validate() !== null) return;
        save.disabled = true;
        void this.#rpc
          .call("updateComment", {
            bbThreadId: detail.thread.bbThreadId,
            commentId: comment.id,
            expectedVersion: comment.version,
            body: textarea.value,
          })
          .then(() => {
            sessionStorage.removeItem(draftKey);
            return this.openThread(detail.thread.id);
          })
          .catch((caught) => {
            save.disabled = false;
            this.handlePopoverMutationError(popover, detail, caught);
          });
      });
      editComposer.append(textarea, save);
      row.replaceChildren(buildHeader(actions), editComposer, error);
      validate();
      textarea.focus();
    });
    const remove = element(
      "button",
      "bb-comments-destructive",
      "Delete",
    ) as HTMLButtonElement;
    remove.type = "button";
    remove.setAttribute("role", "menuitem");
    remove.addEventListener("click", () => {
      if (
        !window.confirm(
          comment.parentId === null
            ? "Delete this comment thread?"
            : "Delete this reply?",
        )
      )
        return;
      remove.disabled = true;
      void this.#rpc
        .call("deleteComment", {
          bbThreadId: detail.thread.bbThreadId,
          commentId: comment.id,
          expectedVersion: comment.version,
        })
        .then((result) => {
          if (result.deletedThreadId !== null) this.closePopover();
          else void this.openThread(detail.thread.id);
          this.scheduleRefresh();
        })
        .catch((caught) => {
          remove.disabled = false;
          this.handlePopoverMutationError(popover, detail, caught);
        });
    });
    actionsMenu.append(edit, agent, remove);
    actions.append(actionsTrigger, actionsMenu);
    row.append(buildHeader(actions), body);
    return row;
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
          this.#popoverInvoker?.contains(event.target) === true)
      ) {
        return;
      }
      this.closePopover();
    };
    this.#popoverKeydown = (event) => {
      if (event.key !== "Escape") return;
      if (
        event.target instanceof Element &&
        event.target.closest(".bb-comments-edit-input") !== null
      ) {
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
    const width = Math.min(340, window.innerWidth - 16);
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
    this.#composer?.remove();
    this.#composer = null;
    this.#provisionalRange = null;
    this.rebuildHighlights();
  }

  private closePopover(clearOpen = true): void {
    const invoker = this.#popoverInvoker;
    this.removePopoverDismissal();
    this.#popoverInvoker = null;
    this.#popover?.remove();
    this.#popover = null;
    if (clearOpen) this.#openThreadId = null;
    this.setActive([]);
    if (clearOpen && invoker?.isConnected === true) {
      invoker.focus({ preventScroll: true });
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
