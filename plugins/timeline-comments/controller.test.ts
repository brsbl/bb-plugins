// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import type { PluginContentScriptContext } from "@bb/plugin-sdk/app";
import {
  beginTimelineComment,
  focusTimelineComment,
  refreshTimelineCommentAnchors,
  registerTimelineCommentThreadWindow,
  subscribeTimelineCommentHandoff,
  subscribeTimelineCommentAnchorHealth,
} from "./bridge.js";
import { mountTimelineCommentsController } from "./controller.js";

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

describe("timeline comments controller teardown", () => {
  it("mounts on the real content-script contract and captures a DOM selection", () => {
    document.body.innerHTML = `
      <div data-thread-window>
        <div class="thread-scrollbar">
          <div data-timeline-row-id="msg_1">
            <div data-sidebar-swipe-selectable>source text</div>
          </div>
        </div>
      </div>
    `;
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        async json() {
          return { ok: true, result: { anchors: [], nextCursor: null } };
        },
        status: 200,
      })),
    );
    const originalClientRects = Object.getOwnPropertyDescriptor(
      Range.prototype,
      "getClientRects",
    );
    Object.defineProperty(Range.prototype, "getClientRects", {
      configurable: true,
      value: () => [{ x: 20, y: 30, width: 60, height: 18 }],
    });
    const controller = new AbortController();
    const dispose = mountTimelineCommentsController({
      pluginId: "timeline-comments",
      generation: 1,
      signal: controller.signal,
    });
    const text = document.querySelector("[data-sidebar-swipe-selectable]")!
      .firstChild!;
    const range = document.createRange();
    range.setStart(text, 0);
    range.setEnd(text, 6);
    document.getSelection()!.removeAllRanges();
    document.getSelection()!.addRange(range);
    beginTimelineComment({
      threadId: "thr_1",
      message: {
        id: "msg_1",
        threadId: "thr_1",
        role: "assistant",
        text: "source text",
        sourceSeqEnd: 1,
      },
      selectedText: "source",
      openPanel: () => true,
    });
    const composer = document.querySelector<HTMLElement>(
      ".bb-comments-composer",
    )!;
    expect(composer).not.toBeNull();
    expect(composer.querySelector(".bb-comments-composer-footer")).toBeNull();
    expect(composer.querySelector('button[aria-label="Add comment"]')).not.toBeNull();
    const textarea = composer.querySelector<HTMLTextAreaElement>(
      '[aria-label="Add a comment"]',
    )!;
    expect(composer.querySelector('[data-comment-new-composer="true"]')).not.toBeNull();
    expect(textarea.getAttribute("aria-label")).toBe("Add a comment");
    controller.abort();
    dispose();
    document.getSelection()!.removeAllRanges();
    if (originalClientRects === undefined) {
      delete (Range.prototype as Partial<Range>).getClientRects;
    } else {
      Object.defineProperty(
        Range.prototype,
        "getClientRects",
        originalClientRects,
      );
    }
    vi.unstubAllGlobals();
  });

  it("opens the composer for a selection spanning rendered blocks", () => {
    document.body.innerHTML = `
      <div data-thread-window>
        <div class="thread-scrollbar">
          <div data-timeline-row-id="msg_1">
            <div data-sidebar-swipe-selectable><p>source</p><p>text</p></div>
          </div>
        </div>
      </div>
    `;
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        async json() {
          return { ok: true, result: { anchors: [], nextCursor: null } };
        },
        status: 200,
      })),
    );
    const originalClientRects = Object.getOwnPropertyDescriptor(
      Range.prototype,
      "getClientRects",
    );
    Object.defineProperty(Range.prototype, "getClientRects", {
      configurable: true,
      value: () => [{ x: 20, y: 30, width: 60, height: 36 }],
    });
    const controller = new AbortController();
    const dispose = mountTimelineCommentsController({
      pluginId: "timeline-comments",
      generation: 1,
      signal: controller.signal,
    });
    const blocks = document.querySelectorAll(
      "[data-sidebar-swipe-selectable] p",
    );
    const range = document.createRange();
    range.setStart(blocks[0]!.firstChild!, 0);
    range.setEnd(blocks[1]!.firstChild!, 4);
    document.getSelection()!.removeAllRanges();
    document.getSelection()!.addRange(range);

    // Chromium serializes block boundaries in Selection.toString(), while
    // Range.toString() and the plugin's rendered-text offsets do not.
    beginTimelineComment({
      threadId: "thr_1",
      message: {
        id: "msg_1",
        threadId: "thr_1",
        role: "assistant",
        text: "source\n\ntext",
        sourceSeqEnd: 1,
      },
      selectedText: "source\n\ntext",
      openPanel: () => true,
    });

    expect(document.querySelector(".bb-comments-composer")).not.toBeNull();
    controller.abort();
    dispose();
    document.getSelection()!.removeAllRanges();
    if (originalClientRects === undefined) {
      delete (Range.prototype as Partial<Range>).getClientRects;
    } else {
      Object.defineProperty(
        Range.prototype,
        "getClientRects",
        originalClientRects,
      );
    }
    vi.unstubAllGlobals();
  });

  it("keeps a connected window association across overlapping composer cleanup", async () => {
    document.body.innerHTML = `<div data-thread-window></div>`;
    const fetchRequest = vi.fn(async (_url: string, _init: RequestInit) => ({
      ok: true,
      async json() {
        return { ok: true, result: { anchors: [], nextCursor: null } };
      },
      status: 200,
    }));
    vi.stubGlobal("fetch", fetchRequest);
    const dispose = mountTimelineCommentsController({
      pluginId: "timeline-comments",
      generation: 1,
      signal: new AbortController().signal,
    });
    const windowNode =
      document.querySelector<HTMLElement>("[data-thread-window]")!;
    const unregisterFirst = registerTimelineCommentThreadWindow(
      "thr_1",
      windowNode,
    );
    const unregisterSecond = registerTimelineCommentThreadWindow(
      "thr_1",
      windowNode,
    );
    await vi.waitFor(() => expect(fetchRequest).toHaveBeenCalled());

    unregisterFirst();
    const callsBeforeRefresh = fetchRequest.mock.calls.length;
    refreshTimelineCommentAnchors();
    await vi.waitFor(() =>
      expect(fetchRequest.mock.calls.length).toBeGreaterThan(callsBeforeRefresh),
    );
    expect(
      JSON.parse(String(fetchRequest.mock.calls.at(-1)?.[1].body)),
    ).toEqual({ threadIds: ["thr_1"] });

    const unregisterReassigned = registerTimelineCommentThreadWindow(
      "thr_2",
      windowNode,
    );
    unregisterSecond();
    const callsBeforeReassignment = fetchRequest.mock.calls.length;
    refreshTimelineCommentAnchors();
    await vi.waitFor(() =>
      expect(fetchRequest.mock.calls.length).toBeGreaterThan(
        callsBeforeReassignment,
      ),
    );
    expect(
      JSON.parse(String(fetchRequest.mock.calls.at(-1)?.[1].body)),
    ).toEqual({ threadIds: ["thr_2"] });

    windowNode.remove();
    unregisterReassigned();
    dispose();
    vi.unstubAllGlobals();
  });

  it("removes portalled comment UI when its mounted thread pane becomes hidden", async () => {
    document.body.innerHTML = `
      <div data-split-pane-id="pane-1">
        <div data-thread-window>
          <div data-timeline-row-id="msg_1">
            <div data-sidebar-swipe-selectable>source text</div>
          </div>
        </div>
      </div>
      <div data-split-pane-id="pane-2">
        <div data-thread-window></div>
      </div>
      <div data-split-pane-id="pane-3">
        <div data-thread-window>
          <div data-timeline-row-id="msg_1">
            <div data-sidebar-swipe-selectable>source text</div>
          </div>
        </div>
      </div>
    `;
    const rootComment = {
      id: "comment_1",
      threadId: "comment_thread_1",
      parentId: null,
      body: "Visible comment",
      version: 1,
      createdAt: 1,
      updatedAt: 1,
    };
    const thread = {
      id: "comment_thread_1",
      bbThreadId: "thr_1",
      messageId: "msg_1",
      messageRole: "assistant" as const,
      selector: {
        version: 1 as const,
        coordinateSpace: "rendered-text-utf16" as const,
        start: 0,
        end: 6,
        exact: "source",
        prefix: "",
        suffix: " text",
      },
      version: 1,
      createdAt: 1,
      updatedAt: 1,
      resolvedAt: null,
      rootComment,
      replyCount: 0,
    };
    const listRequests: string[][] = [];
    let delayListResponse = false;
    const delayedListResponse = deferred<void>();
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init: RequestInit) => {
        const input = JSON.parse(String(init.body ?? "null")) as {
          threadIds?: string[];
        };
        if (url.endsWith("/listOpenAnchors")) {
          const threadIds = input.threadIds ?? [];
          listRequests.push(threadIds);
          const { rootComment: _rootComment, ...anchor } = thread;
          return {
            ok: true,
            async json() {
              if (delayListResponse) await delayedListResponse.promise;
              return {
                ok: true,
                result: {
                  anchors: threadIds.includes("thr_1") ? [anchor] : [],
                  nextCursor: null,
                },
              };
            },
            status: 200,
          };
        }
        return {
          ok: true,
          async json() {
            return {
              ok: true,
              result: { thread, comments: [rootComment], nextCursor: null },
            };
          },
          status: 200,
        };
      }),
    );
    const originalClientRects = Object.getOwnPropertyDescriptor(
      Range.prototype,
      "getClientRects",
    );
    const originalBoundingRect = Object.getOwnPropertyDescriptor(
      Range.prototype,
      "getBoundingClientRect",
    );
    const originalElementBoundingRect = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      "getBoundingClientRect",
    );
    const rect = {
      x: 20,
      y: 30,
      top: 30,
      right: 80,
      bottom: 48,
      left: 20,
      width: 60,
      height: 18,
      toJSON: () => ({}),
    } as DOMRect;
    Object.defineProperty(Range.prototype, "getClientRects", {
      configurable: true,
      value: () => [rect],
    });
    Object.defineProperty(Range.prototype, "getBoundingClientRect", {
      configurable: true,
      value: () => rect,
    });
    let narrowMessageGutter = false;
    Object.defineProperty(HTMLElement.prototype, "getBoundingClientRect", {
      configurable: true,
      value: function (this: HTMLElement) {
        if (this.matches("[data-sidebar-swipe-selectable]")) {
          const left = narrowMessageGutter ? 10 : 60;
          const right = narrowMessageGutter ? 790 : 740;
          return {
            ...rect,
            x: left,
            left,
            right,
            width: right - left,
          };
        }
        return {
          ...rect,
          x: 0,
          y: 0,
          top: 0,
          right: 800,
          bottom: 700,
          left: 0,
          width: 800,
          height: 700,
        };
      },
    });
    const dispose = mountTimelineCommentsController({
      pluginId: "timeline-comments",
      generation: 1,
      signal: new AbortController().signal,
    });
    const panes = document.querySelectorAll<HTMLElement>("[data-split-pane-id]");
    const windows = document.querySelectorAll<HTMLElement>("[data-thread-window]");
    const unregisterFirst = registerTimelineCommentThreadWindow(
      "thr_1",
      windows[0]!,
    );
    const unregisterSecond = registerTimelineCommentThreadWindow(
      "thr_2",
      windows[1]!,
    );
    const unregisterDuplicate = registerTimelineCommentThreadWindow(
      "thr_1",
      windows[2]!,
    );

    await vi.waitFor(() =>
      expect(document.querySelector(".bb-comments-marker")).not.toBeNull(),
    );
    narrowMessageGutter = true;
    window.dispatchEvent(new Event("resize"));
    await vi.waitFor(() =>
      expect(document.querySelector(".bb-comments-marker")).toBeNull(),
    );
    narrowMessageGutter = false;
    window.dispatchEvent(new Event("resize"));
    await vi.waitFor(() =>
      expect(document.querySelector(".bb-comments-marker")).not.toBeNull(),
    );
    document
      .querySelector<HTMLButtonElement>(".bb-comments-marker")!
      .click();
    await vi.waitFor(() =>
      expect(document.body.textContent).toContain("Visible comment"),
    );

    document
      .querySelector<HTMLButtonElement>(
        'button[aria-label="Send thread to agent"]',
      )!
      .click();
    expect(document.querySelector(".bb-comments-thread")).not.toBeNull();

    const markerBeforeHandoff = document.querySelector<HTMLButtonElement>(
      ".bb-comments-marker",
    )!;
    const restoreHandoffMarkerFocus = vi.spyOn(markerBeforeHandoff, "focus");
    const unregisterHandoff = subscribeTimelineCommentHandoff({
      threadId: "thr_1",
      getThreadWindow: () => windows[0]!,
      accept: async () => true,
    });
    document
      .querySelector<HTMLButtonElement>(
        'button[aria-label="Send thread to agent"]',
      )!
      .click();
    await vi.waitFor(() =>
      expect(document.querySelector(".bb-comments-thread")).toBeNull(),
    );
    expect(restoreHandoffMarkerFocus).not.toHaveBeenCalled();
    unregisterHandoff();

    markerBeforeHandoff.click();
    await vi.waitFor(() =>
      expect(document.body.textContent).toContain("Visible comment"),
    );

    const markerBeforeHide = document.querySelector<HTMLButtonElement>(
      ".bb-comments-marker",
    )!;
    const restoreHiddenMarkerFocus = vi.spyOn(markerBeforeHide, "focus");
    const requestsBeforeNonVisibilityMutation = listRequests.length;
    panes[0]!.classList.add("fullscreen-layout-transition");
    panes[0]!.style.setProperty("--transition-progress", "0.5");
    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(listRequests).toHaveLength(requestsBeforeNonVisibilityMutation);

    panes[0]!.setAttribute("aria-hidden", "true");
    await vi.waitFor(() => {
      expect(document.querySelector(".bb-comments-marker")).not.toBeNull();
      expect(document.querySelector(".bb-comments-thread")).toBeNull();
      expect(listRequests.at(-1)).toEqual(["thr_1", "thr_2"]);
    });
    expect(restoreHiddenMarkerFocus).not.toHaveBeenCalled();

    panes[0]!.removeAttribute("aria-hidden");
    await vi.waitFor(() => {
      expect(document.querySelector(".bb-comments-marker")).not.toBeNull();
      expect(listRequests.at(-1)).toEqual(["thr_1", "thr_2"]);
    });
    document
      .querySelector<HTMLButtonElement>(".bb-comments-marker")!
      .click();
    await vi.waitFor(() =>
      expect(document.body.textContent).toContain("Visible comment"),
    );

    const visibleMarker = document.querySelector<HTMLButtonElement>(
      ".bb-comments-marker",
    )!;
    const restoreVisibleMarkerFocus = vi.spyOn(visibleMarker, "focus");
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(document.querySelector(".bb-comments-thread")).toBeNull();
    expect(restoreVisibleMarkerFocus).toHaveBeenCalledTimes(1);
    visibleMarker.click();
    await vi.waitFor(() =>
      expect(document.body.textContent).toContain("Visible comment"),
    );

    panes[1]!.setAttribute("aria-hidden", "true");
    await vi.waitFor(() => {
      expect(document.querySelector(".bb-comments-marker")).not.toBeNull();
      expect(document.querySelector(".bb-comments-thread")).not.toBeNull();
      expect(listRequests.at(-1)).toEqual(["thr_1"]);
    });

    panes[1]!.removeAttribute("aria-hidden");
    await vi.waitFor(() =>
      expect(listRequests.at(-1)).toEqual(["thr_1", "thr_2"]),
    );
    delayListResponse = true;
    panes[2]!.setAttribute("aria-hidden", "true");
    panes[0]!.remove();
    await vi.waitFor(() => {
      expect(listRequests.at(-1)).toEqual(["thr_2"]);
      expect(document.querySelector(".bb-comments-marker")).toBeNull();
      expect(document.querySelector(".bb-comments-thread")).toBeNull();
    });
    delayedListResponse.resolve();

    unregisterDuplicate();
    unregisterSecond();
    unregisterFirst();
    dispose();
    for (const [prototype, property, descriptor] of [
      [Range.prototype, "getClientRects", originalClientRects],
      [Range.prototype, "getBoundingClientRect", originalBoundingRect],
      [
        HTMLElement.prototype,
        "getBoundingClientRect",
        originalElementBoundingRect,
      ],
    ] as const) {
      if (descriptor === undefined) Reflect.deleteProperty(prototype, property);
      else Object.defineProperty(prototype, property, descriptor);
    }
    vi.unstubAllGlobals();
  });

  it("coalesces refresh requests that arrive during an active anchor load", async () => {
    document.body.innerHTML = `<div data-thread-window></div>`;
    const firstResponse = deferred<void>();
    let requestCount = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        requestCount += 1;
        const current = requestCount;
        return {
          ok: true,
          async json() {
            if (current === 1) await firstResponse.promise;
            return {
              ok: true,
              result: { anchors: [], nextCursor: null },
            };
          },
          status: 200,
        };
      }),
    );
    const dispose = mountTimelineCommentsController({
      pluginId: "timeline-comments",
      generation: 1,
      signal: new AbortController().signal,
    });
    const unregister = registerTimelineCommentThreadWindow(
      "thr_1",
      document.querySelector<HTMLElement>("[data-thread-window]")!,
    );
    await vi.waitFor(() => expect(requestCount).toBe(1));

    refreshTimelineCommentAnchors();
    refreshTimelineCommentAnchors();
    refreshTimelineCommentAnchors();
    firstResponse.resolve();

    await vi.waitFor(() => expect(requestCount).toBe(2));
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(requestCount).toBe(2);
    unregister();
    dispose();
    vi.unstubAllGlobals();
  });

  it("closes the selection composer when its parent thread stops rendering", async () => {
    document.body.innerHTML = `
      <div data-split-pane-id="pane-1">
        <div data-thread-window>
          <div data-timeline-row-id="msg_1">
            <div data-sidebar-swipe-selectable>source text</div>
          </div>
        </div>
      </div>
      <div data-split-pane-id="pane-2">
        <div data-thread-window></div>
      </div>
    `;
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        async json() {
          return { ok: true, result: { anchors: [], nextCursor: null } };
        },
        status: 200,
      })),
    );
    const originalClientRects = Object.getOwnPropertyDescriptor(
      Range.prototype,
      "getClientRects",
    );
    Object.defineProperty(Range.prototype, "getClientRects", {
      configurable: true,
      value: () => [{ x: 20, y: 30, width: 60, height: 18 }],
    });
    const dispose = mountTimelineCommentsController({
      pluginId: "timeline-comments",
      generation: 1,
      signal: new AbortController().signal,
    });
    const windowNodes =
      document.querySelectorAll<HTMLElement>("[data-thread-window]");
    const unregister = registerTimelineCommentThreadWindow(
      "thr_1",
      windowNodes[0]!,
    );
    const unregisterDuplicate = registerTimelineCommentThreadWindow(
      "thr_1",
      windowNodes[1]!,
    );
    const text = document.querySelector("[data-sidebar-swipe-selectable]")!
      .firstChild!;
    const range = document.createRange();
    range.setStart(text, 0);
    range.setEnd(text, 6);
    document.getSelection()!.removeAllRanges();
    document.getSelection()!.addRange(range);
    beginTimelineComment({
      threadId: "thr_1",
      message: {
        id: "msg_1",
        threadId: "thr_1",
        role: "assistant",
        text: "source text",
        sourceSeqEnd: 1,
      },
      selectedText: "source",
      openPanel: () => true,
    });
    expect(document.querySelector(".bb-comments-composer")).not.toBeNull();

    document.querySelector<HTMLElement>("[data-split-pane-id]")!.hidden = true;
    await vi.waitFor(() =>
      expect(document.querySelector(".bb-comments-composer")).toBeNull(),
    );

    unregister();
    unregisterDuplicate();
    dispose();
    document.getSelection()!.removeAllRanges();
    if (originalClientRects === undefined) {
      delete (Range.prototype as Partial<Range>).getClientRects;
    } else {
      Object.defineProperty(
        Range.prototype,
        "getClientRects",
        originalClientRects,
      );
    }
    vi.unstubAllGlobals();
  });

  it("restores and opens a resolved panel row even though open anchors omit it", async () => {
    document.body.innerHTML = `
      <div data-thread-window>
        <div class="thread-scrollbar">
          <div data-timeline-row-id="msg_1">
            <div data-sidebar-swipe-selectable>source text</div>
          </div>
        </div>
      </div>
    `;
    const resolvedThread = {
      id: "comment_thread_resolved",
      bbThreadId: "thr_1",
      messageId: "msg_1",
      messageRole: "assistant" as const,
      selector: {
        version: 1 as const,
        coordinateSpace: "rendered-text-utf16" as const,
        start: 0,
        end: 6,
        exact: "source",
        prefix: "",
        suffix: " text",
      },
      version: 2,
      createdAt: 1,
      updatedAt: 2,
      resolvedAt: 2,
      rootComment: {
        id: "comment_1",
        threadId: "comment_thread_resolved",
        parentId: null,
        body: "Resolved review note",
        version: 1,
        createdAt: 1,
        updatedAt: 1,
      },
      replyCount: 0,
    };
    const fetchRequest = vi.fn(async (url: string) => {
      const result = url.endsWith("/listOpenAnchors")
        ? { anchors: [], nextCursor: null }
        : {
            thread: resolvedThread,
            comments: [resolvedThread.rootComment],
            nextCursor: null,
          };
      return {
        ok: true,
        async json() {
          return { ok: true, result };
        },
        status: 200,
      };
    });
    vi.stubGlobal("fetch", fetchRequest);
    const originalClientRects = Object.getOwnPropertyDescriptor(
      Range.prototype,
      "getClientRects",
    );
    const originalBoundingRect = Object.getOwnPropertyDescriptor(
      Range.prototype,
      "getBoundingClientRect",
    );
    const originalScrollIntoView = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      "scrollIntoView",
    );
    const rect = {
      x: 20,
      y: 30,
      top: 30,
      right: 80,
      bottom: 48,
      left: 20,
      width: 60,
      height: 18,
      toJSON: () => ({}),
    } as DOMRect;
    Object.defineProperty(Range.prototype, "getClientRects", {
      configurable: true,
      value: () => [rect],
    });
    Object.defineProperty(Range.prototype, "getBoundingClientRect", {
      configurable: true,
      value: () => rect,
    });
    const scrollIntoView = vi.fn();
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: scrollIntoView,
    });
    const dispose = mountTimelineCommentsController({
      pluginId: "timeline-comments",
      generation: 1,
      signal: new AbortController().signal,
    });
    const unregisterWindow = registerTimelineCommentThreadWindow(
      "thr_1",
      document.querySelector<HTMLElement>("[data-thread-window]")!,
    );

    await expect(focusTimelineComment(resolvedThread)).resolves.toBe(true);
    expect(scrollIntoView).toHaveBeenCalledWith({
      block: "center",
      behavior: "smooth",
    });
    expect(document.querySelector(".bb-comments-thread")).not.toBeNull();
    await vi.waitFor(() =>
      expect(document.body.textContent).toContain("Resolved review note"),
    );

    unregisterWindow();
    dispose();
    for (const [prototype, property, descriptor] of [
      [Range.prototype, "getClientRects", originalClientRects],
      [Range.prototype, "getBoundingClientRect", originalBoundingRect],
      [HTMLElement.prototype, "scrollIntoView", originalScrollIntoView],
    ] as const) {
      if (descriptor === undefined) Reflect.deleteProperty(prototype, property);
      else Object.defineProperty(prototype, property, descriptor);
    }
    vi.unstubAllGlobals();
  });

  it("does not restore or republish anchors after a deferred load resolves", async () => {
    document.body.innerHTML = `
      <div data-thread-window>
        <div class="thread-scrollbar">
          <div data-timeline-row-id="msg_1">
            <div data-sidebar-swipe-selectable>source</div>
          </div>
        </div>
      </div>
    `;
    const page = deferred<{
      anchors: Array<{
        id: string;
        bbThreadId: string;
        messageId: string;
        messageRole: "assistant";
        selector: {
          version: 1;
          coordinateSpace: "rendered-text-utf16";
          start: number;
          end: number;
          exact: string;
          prefix: string;
          suffix: string;
        };
        version: number;
        createdAt: number;
        updatedAt: number;
        resolvedAt: null;
        replyCount: number;
      }>;
      nextCursor: null;
    }>();
    const fetchRequest = vi.fn(async (_url: string, init: RequestInit) => ({
      ok: true,
      async json() {
        return { ok: true, result: await page.promise };
      },
      status: 200,
    }));
    vi.stubGlobal("fetch", fetchRequest);
    const dispose = mountTimelineCommentsController({
      pluginId: "timeline-comments",
      generation: 1,
      signal: new AbortController().signal,
    } as PluginContentScriptContext);
    const unregisterWindow = registerTimelineCommentThreadWindow(
      "thr_1",
      document.querySelector<HTMLElement>("[data-thread-window]")!,
    );
    await vi.waitFor(() => expect(fetchRequest).toHaveBeenCalled());
    expect(fetchRequest.mock.calls[0]?.[0]).toBe(
      "/api/v1/plugins/timeline-comments/rpc/listOpenAnchors",
    );
    expect(JSON.parse(String(fetchRequest.mock.calls[0]?.[1].body))).toEqual({
      threadIds: ["thr_1"],
    });

    const healthChanged = vi.fn();
    const unsubscribe = subscribeTimelineCommentAnchorHealth(healthChanged);
    dispose();
    healthChanged.mockClear();
    page.resolve({
      anchors: [
        {
          id: "comment_thread_1",
          bbThreadId: "thr_1",
          messageId: "msg_1",
          messageRole: "assistant",
          selector: {
            version: 1,
            coordinateSpace: "rendered-text-utf16",
            start: 0,
            end: 6,
            exact: "source",
            prefix: "",
            suffix: "",
          },
          version: 1,
          createdAt: 1,
          updatedAt: 1,
          resolvedAt: null,
          replyCount: 0,
        },
      ],
      nextCursor: null,
    });
    await page.promise;
    await Promise.resolve();

    expect(healthChanged).not.toHaveBeenCalled();
    expect(
      document.querySelector("[data-bb-plugin-decoration='timeline-comments']"),
    ).toBeNull();
    unsubscribe();
    unregisterWindow();
    vi.unstubAllGlobals();
  });
});
