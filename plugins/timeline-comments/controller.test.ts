// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import type { PluginContentScriptContext } from "@bb/plugin-sdk/app";
import {
  beginTimelineComment,
  focusTimelineComment,
  refreshTimelineCommentAnchors,
  registerTimelineCommentThreadWindow,
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
            <div data-no-sidebar-swipe>source text</div>
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
    const text = document.querySelector("[data-no-sidebar-swipe]")!
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

  it("restores and opens a resolved panel row even though open anchors omit it", async () => {
    document.body.innerHTML = `
      <div data-thread-window>
        <div class="thread-scrollbar">
          <div data-timeline-row-id="msg_1">
            <div data-no-sidebar-swipe>source text</div>
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
            <div data-no-sidebar-swipe>source</div>
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
