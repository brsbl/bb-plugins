// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import type { PluginContentScriptContext } from "@bb/plugin-sdk/app";
import {
  beginTimelineComment,
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
      <div data-bb-thread-window="thr_1">
        <div data-bb-thread-scroll-root>
          <div data-bb-conversation-message-id="msg_1">
            <div data-bb-message-prose-root>source text</div>
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
    const text = document.querySelector("[data-bb-message-prose-root]")!
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

  it("does not restore or republish anchors after a deferred load resolves", async () => {
    document.body.innerHTML = `
      <div data-bb-thread-window="thr_1">
        <div data-bb-thread-scroll-root>
          <div data-bb-conversation-message-id="msg_1">
            <div data-bb-message-prose-root>source</div>
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
    vi.unstubAllGlobals();
  });
});
