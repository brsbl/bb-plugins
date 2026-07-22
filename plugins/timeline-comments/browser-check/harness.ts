import "../app.css";
import { mountTimelineCommentsController } from "../controller.js";
import type { PluginContentScriptContext } from "@bb/plugin-sdk/app";

const threadId = "thr_browser";
const messageId = "msg_browser";
const prose = document.querySelector<HTMLElement>(
  "[data-bb-message-prose-root]",
)!;
const text = prose.textContent ?? "";
const phrases = [
  "First exact browser anchor",
  "Second exact browser anchor",
  "Third exact browser anchor",
  "Fourth exact browser anchor",
  "Fifth exact browser anchor",
  "Sixth exact browser anchor",
  "Seventh exact browser anchor",
  "Eighth exact browser anchor",
];
const now = Date.now();
const summaries = phrases.map((exact, index) => {
  const start = text.indexOf(exact);
  return {
    id: `comment_thread_${index}`,
    bbThreadId: threadId,
    messageId,
    messageRole: "assistant" as const,
    selector: {
      version: 1 as const,
      coordinateSpace: "rendered-text-utf16" as const,
      start,
      end: start + exact.length,
      exact,
      prefix: text.slice(Math.max(0, start - 32), start),
      suffix: text.slice(start + exact.length, start + exact.length + 32),
    },
    version: 1,
    createdAt: now + index,
    updatedAt: now + index,
    resolvedAt: null,
    replyCount: 0,
  };
});

const context = {
  pluginId: "timeline-comments",
  generation: 1,
  signal: new AbortController().signal,
  rpc: {
    async call(method: string) {
      if (method === "listOpenAnchors")
        return { anchors: summaries, nextCursor: null };
      if (method === "getCommentThread") {
        const summary = summaries[0]!;
        const rootComment = {
          id: "comment_root",
          threadId: summary.id,
          parentId: null,
          body: "Verify the real browser geometry before shipping.",
          version: 1,
          createdAt: now,
          updatedAt: now,
        };
        return {
          thread: { ...summary, rootComment },
          comments: [rootComment],
          nextCursor: null,
        };
      }
      throw new Error(`Unexpected RPC ${method}`);
    },
  },
  realtime: {
    subscribe: () => () => {},
    getConnectionState: () => "connected" as const,
    subscribeConnectionState: () => () => {},
  },
  navigate: { toCompose: () => {} },
} as unknown as PluginContentScriptContext;

mountTimelineCommentsController(context);

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function withinViewport(rect: DOMRect): boolean {
  return (
    rect.left >= 0 &&
    rect.top >= 0 &&
    rect.right <= window.innerWidth &&
    rect.bottom <= window.innerHeight
  );
}

void (async () => {
  const result = document.querySelector<HTMLOutputElement>("#result")!;
  try {
    await wait(300);
    const markers = [
      ...document.querySelectorAll<HTMLButtonElement>(".bb-comments-marker"),
    ];
    if (markers.length !== 4)
      throw new Error(
        `Expected 4 de-overlapped markers, got ${markers.length}`,
      );
    const overflow = markers.find((marker) => marker.textContent === "5");
    if (overflow === undefined)
      throw new Error("Expected one 5-thread overflow marker");
    const tops = markers.map((marker) => marker.getBoundingClientRect().top);
    if (new Set(tops).size !== markers.length)
      throw new Error("Markers overlap vertically");

    overflow.click();
    await wait(30);
    const cluster = document.querySelector<HTMLElement>(".bb-comments-cluster");
    if (cluster === null || cluster.querySelectorAll("button").length !== 5) {
      throw new Error("Overflow marker did not expose all grouped threads");
    }
    if (!withinViewport(cluster.getBoundingClientRect()))
      throw new Error("Cluster escaped the viewport");

    markers[0]!.click();
    await wait(80);
    const popover = document.querySelector<HTMLElement>(".bb-comments-thread");
    if (popover === null)
      throw new Error("Thread marker did not open its popover");
    if (!withinViewport(popover.getBoundingClientRect()))
      throw new Error("Thread popover escaped the viewport");
    if (CSS.highlights.get("bb-timeline-comments")?.size !== 8) {
      throw new Error("Custom Highlight registry did not retain every anchor");
    }
    if (CSS.highlights.get("bb-timeline-comments-active")?.size !== 1) {
      throw new Error("Open thread did not strengthen exactly one highlight");
    }

    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );
    if (document.querySelector(".bb-comments-thread") !== null) {
      throw new Error("Escape did not dismiss the thread popover");
    }
    if (document.activeElement !== markers[0]) {
      throw new Error("Popover dismissal did not restore marker focus");
    }
    markers[0]!.click();
    await wait(80);

    document.body.dataset.testStatus = "passed";
    result.value =
      "Passed: real Chrome laid out 8 highlights, 4 non-overlapping gutter targets, a 5-thread overflow menu, and a bounded thread popover.";
  } catch (error) {
    document.body.dataset.testStatus = "failed";
    result.value = error instanceof Error ? error.message : String(error);
  }
})();
