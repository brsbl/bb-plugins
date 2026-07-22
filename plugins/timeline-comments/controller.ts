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
}

const OWNED = "data-bb-timeline-comments-owned";
const NORMAL_HIGHLIGHT = "bb-timeline-comments";
const ACTIVE_HIGHLIGHT = "bb-timeline-comments-active";
const DRAFT_TTL = 24 * 60 * 60 * 1_000;
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
    document.body.append(this.#highlightStyle, this.#overlay);

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
    document.body.append(shell);
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
      const side = chooseNearestGutter(
        rects,
        windowNode.getBoundingClientRect(),
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
      restored.side = chooseNearestGutter(
        fragments,
        restored.window.getBoundingClientRect(),
      );
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
        marker.style.left = `${threads[0]!.side === "left" ? Math.max(8, windowRect.left + 6) : Math.min(window.innerWidth - 32, windowRect.right - 30)}px`;
        marker.setAttribute(
          "aria-label",
          threads.length === 1
            ? `Open comment thread${threads[0]!.anchor.replyCount > 0 ? ` with ${threads[0]!.anchor.replyCount} ${threads[0]!.anchor.replyCount === 1 ? "reply" : "replies"}` : ""}`
            : `Open ${threads.length} comment threads`,
        );
        marker.textContent = threads.length === 1 ? "" : String(threads.length);
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
    document.body.append(menu);
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
    document.body.append(popover);
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
    popover.replaceChildren();
    const header = element("header", "bb-comments-thread-header");
    const source = element(
      "div",
      "bb-comments-thread-source",
      `“${sourceExcerpt(detail.thread.selector.exact)}”`,
    );
    const headerActions = element("div", "bb-comments-header-actions");
    const resolve = element(
      "button",
      "bb-comments-quiet",
      detail.thread.resolvedAt === null ? "Resolve" : "Reopen",
    ) as HTMLButtonElement;
    resolve.type = "button";
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
    const close = element(
      "button",
      "bb-comments-icon-button",
      "×",
    ) as HTMLButtonElement;
    close.type = "button";
    close.setAttribute("aria-label", "Close comment thread");
    close.addEventListener("click", () => this.closePopover());
    headerActions.append(resolve, close);
    header.append(source, headerActions);
    popover.append(header);

    const comments = element("div", "bb-comments-thread-comments");
    for (const comment of detail.comments)
      comments.append(this.renderComment(detail, comment, popover));
    popover.append(comments);

    if (detail.thread.resolvedAt === null) {
      const reply = element("form", "bb-comments-reply");
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
        "bb-comments-primary",
        "Reply",
      ) as HTMLButtonElement;
      send.type = "submit";
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
      reply.append(textarea, send, error);
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
    const meta = element(
      "div",
      "bb-comments-comment-meta",
      `${comment.parentId === null ? "Comment" : "Reply"} · ${formatTime(comment.createdAt)}`,
    );
    const body = element("p", "bb-comments-comment-body", comment.body);
    const actions = element("div", "bb-comments-comment-actions");
    const agent = element(
      "button",
      "bb-comments-quiet",
      "Send to agent",
    ) as HTMLButtonElement;
    agent.type = "button";
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
      "bb-comments-quiet",
      "Edit",
    ) as HTMLButtonElement;
    edit.type = "button";
    edit.addEventListener("click", () => {
      const draftKey = `bb.timeline-comments.edit:${comment.id}`;
      const textarea = element(
        "textarea",
        "bb-comments-edit-input",
      ) as HTMLTextAreaElement;
      textarea.maxLength = 20_000;
      textarea.value = readDraft(draftKey) ?? comment.body;
      const editActions = element("div", "bb-comments-edit-actions");
      const cancel = element(
        "button",
        "bb-comments-quiet",
        "Cancel",
      ) as HTMLButtonElement;
      cancel.type = "button";
      const save = element(
        "button",
        "bb-comments-primary",
        "Save",
      ) as HTMLButtonElement;
      save.type = "button";
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
      cancel.addEventListener("click", cancelEdit);
      textarea.addEventListener("input", () => {
        if (textarea.value === comment.body) sessionStorage.removeItem(draftKey);
        else writeDraft(draftKey, textarea.value);
        validate();
      });
      textarea.addEventListener("keydown", (event) => {
        if (event.key !== "Escape") return;
        event.preventDefault();
        cancelEdit();
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
      editActions.append(cancel, save);
      row.replaceChildren(meta, textarea, error, editActions);
      validate();
      textarea.focus();
    });
    const remove = element(
      "button",
      "bb-comments-quiet bb-comments-destructive",
      "Delete",
    ) as HTMLButtonElement;
    remove.type = "button";
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
    actions.append(agent, edit, remove);
    row.append(meta, body, actions);
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
    this.#overlay.remove();
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
