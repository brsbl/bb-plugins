// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import type { PluginContentScriptContext } from "@bb/plugin-sdk/app";
import {
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
    const call = vi.fn(() => page.promise);
    const dispose = mountTimelineCommentsController({
      pluginId: "timeline-comments",
      generation: 1,
      signal: new AbortController().signal,
      rpc: { call },
      realtime: {
        subscribe: () => () => {},
        getConnectionState: () => "connected",
        subscribeConnectionState: () => () => {},
      },
      navigate: {},
    } as unknown as PluginContentScriptContext);
    await vi.waitFor(() => expect(call).toHaveBeenCalledWith(
      "listOpenAnchors",
      { threadIds: ["thr_1"] },
    ));

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
  });
});
