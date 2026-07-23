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
        const replies = Array.from({ length: 12 }, (_, index) => ({
          id: `comment_reply_${index}`,
          threadId: summary.id,
          parentId: rootComment.id,
          body: `Reply ${index + 1} keeps this thread long enough to scroll.`,
          version: 1,
          createdAt: now + index + 1,
          updatedAt: now + index + 1,
        }));
        return {
          thread: { ...summary, rootComment, replyCount: replies.length },
          comments: [rootComment, ...replies],
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
  navigate: {},
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
    const overlay = document.querySelector<HTMLElement>(
      ".bb-comments-overlay",
    );
    if (
      overlay?.parentElement?.dataset.bbPluginDecoration !== "timeline-comments"
    ) {
      throw new Error("Overlay is outside the plugin CSS ownership boundary");
    }
    const markers = [
      ...document.querySelectorAll<HTMLButtonElement>(".bb-comments-marker"),
    ];
    if (markers.length !== 1)
      throw new Error(`Expected 1 local cluster, got ${markers.length}`);
    const overflow = markers.find((marker) => marker.textContent === "8");
    if (overflow === undefined)
      throw new Error("Expected one 8-thread collision marker");
    if (overflow.querySelector("svg") === null)
      throw new Error("Collision marker omitted its comment icon");
    const clusterIconRect = overflow
      .querySelector("svg")!
      .getBoundingClientRect();
    const clusterCountRect = overflow
      .querySelector(".bb-comments-marker-count")!
      .getBoundingClientRect();
    if (clusterIconRect.width !== 20 || clusterIconRect.height !== 20)
      throw new Error("Cluster icon does not match the single-marker icon size");
    if (
      overflow.dataset.bbCommentGutter === "left" &&
      clusterCountRect.right > clusterIconRect.left
    )
      throw new Error("Left-gutter cluster count is not gutter-side");
    const markerRect = overflow.getBoundingClientRect();
    const proseRect = prose.getBoundingClientRect();
    if (Math.abs(proseRect.left - markerRect.right - 8) > 1)
      throw new Error("Gutter marker is not 8px from the message text");
    const tops = markers.map((marker) => marker.getBoundingClientRect().top);
    if (new Set(tops).size !== markers.length)
      throw new Error("Markers overlap vertically");

    overflow.click();
    await wait(30);
    const cluster = document.querySelector<HTMLElement>(".bb-comments-cluster");
    if (cluster === null || cluster.querySelectorAll("button").length !== 8) {
      throw new Error("Overflow marker did not expose all grouped threads");
    }
    if (!withinViewport(cluster.getBoundingClientRect()))
      throw new Error("Cluster escaped the viewport");
    if (document.activeElement !== cluster.querySelector("button"))
      throw new Error("Cluster did not focus its first thread");

    cluster.querySelector<HTMLButtonElement>("button")!.click();
    await wait(80);
    const popover = document.querySelector<HTMLElement>(".bb-comments-thread");
    if (popover === null)
      throw new Error("Thread marker did not open its popover");
    if (
      popover.parentElement?.dataset.bbPluginDecoration !== "timeline-comments"
    )
      throw new Error(
        "Thread popover is outside the plugin CSS ownership boundary",
      );
    if (!withinViewport(popover.getBoundingClientRect()))
      throw new Error("Thread popover escaped the viewport");
    if (document.activeElement !== popover)
      throw new Error("Thread popover did not receive focus");
    const reply = popover.querySelector<HTMLTextAreaElement>(
      ".bb-comments-reply-input",
    );
    const replyButton = popover.querySelector<HTMLButtonElement>(
      'button[aria-label="Reply"]',
    );
    if (reply === null || replyButton?.disabled !== true)
      throw new Error("Blank reply was not disabled");
    const emptyReplyHeight = reply.getBoundingClientRect().height;
    const replyComposer = reply.closest<HTMLElement>(
      ".bb-comments-inline-composer",
    )!;
    reply.value = "First line\nSecond line\nThird line";
    reply.dispatchEvent(new InputEvent("input", { bubbles: true }));
    if (replyComposer.getAnimations().length === 0)
      throw new Error("Multiline reply expansion did not animate");
    await wait(130);
    const replyNearTerminalHeight = replyComposer.getBoundingClientRect().height;
    await wait(70);
    const replyTerminalHeight = replyComposer.getBoundingClientRect().height;
    if (
      Math.abs(replyTerminalHeight - replyNearTerminalHeight) > 2 ||
      replyComposer.getAnimations().length !== 0
    ) {
      throw new Error("Multiline reply snapped after its height animation");
    }
    if (reply.getBoundingClientRect().height <= emptyReplyHeight)
      throw new Error("Multiline reply input did not grow with its content");
    if (replyComposer.dataset.multiline !== "true")
      throw new Error("Multiline reply did not switch composer layout");
    reply.value = "Ready";
    reply.dispatchEvent(new InputEvent("input", { bubbles: true }));
    await wait(180);
    if (replyButton.disabled)
      throw new Error("Valid reply did not enable submission");
    if (replyComposer.dataset.multiline !== "true")
      throw new Error("Expanded reply layout did not stay latched like Moss");
    reply.value = "";
    reply.dispatchEvent(new InputEvent("input", { bubbles: true }));
    if (replyComposer.getAnimations().length === 0)
      throw new Error("Reply collapse did not animate");
    await wait(180);
    if (replyComposer.dataset.multiline !== "false")
      throw new Error("Cleared reply did not restore inline layout");
    reply.value = "Ready";
    reply.dispatchEvent(new InputEvent("input", { bubbles: true }));
    if (CSS.highlights.get("bb-timeline-comments")?.size !== 8) {
      throw new Error("Custom Highlight registry did not retain every anchor");
    }
    if (CSS.highlights.get("bb-timeline-comments-active")?.size !== 1) {
      throw new Error("Open thread did not strengthen exactly one highlight");
    }

    popover
      .querySelector<HTMLElement>(
        '.bb-comments-actions-menu > button[aria-label="Comment actions"]',
      )
      ?.click();
    await wait(0);
    const actionsMenu = document.querySelector<HTMLElement>(
      ".bb-comments-actions-popover",
    );
    if (actionsMenu === null)
      throw new Error("Comment actions menu did not open");
    if (
      popover.contains(actionsMenu) ||
      actionsMenu.parentElement?.dataset.bbPluginDecoration !==
        "timeline-comments"
    ) {
      throw new Error("Comment actions menu was not rendered in its portal");
    }
    if (
      getComputedStyle(
        popover.querySelector<HTMLElement>(".bb-comments-thread-comments")!,
      ).overflowY !== "auto"
    ) {
      throw new Error("Opening comment actions disabled comment scrolling");
    }
    const actionsRect = actionsMenu.getBoundingClientRect();
    const deleteButton = [...actionsMenu.querySelectorAll("button")].find(
      (button) => button.textContent === "Delete",
    );
    const deleteRect = deleteButton?.getBoundingClientRect();
    const visibleAtDelete =
      deleteRect === undefined
        ? null
        : document.elementFromPoint(
            deleteRect.left + deleteRect.width / 2,
            deleteRect.top + deleteRect.height / 2,
          );
    if (
      deleteButton === undefined ||
      deleteRect === undefined ||
      !withinViewport(actionsRect) ||
      !deleteButton.contains(visibleAtDelete)
    )
      throw new Error("Comment actions menu is clipped by the thread chrome");

    const menuItems = [
      ...actionsMenu.querySelectorAll<HTMLButtonElement>('[role="menuitem"]'),
    ];
    if (document.activeElement !== menuItems[0])
      throw new Error("Comment actions menu did not focus its first item");
    menuItems[0]!.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }),
    );
    if (document.activeElement !== menuItems[1])
      throw new Error("ArrowDown did not move to the next comment action");
    menuItems[1]!.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }),
    );
    if (document.activeElement !== menuItems[0])
      throw new Error("ArrowDown did not wrap comment action focus");
    menuItems[0]!.dispatchEvent(
      new KeyboardEvent("keydown", { key: "End", bubbles: true }),
    );
    if (document.activeElement !== menuItems.at(-1))
      throw new Error("End did not focus the final comment action");
    menuItems.at(-1)!.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Home", bubbles: true }),
    );
    if (document.activeElement !== menuItems[0])
      throw new Error("Home did not focus the first comment action");
    menuItems[0]!.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true }),
    );
    if (document.activeElement !== menuItems.at(-1))
      throw new Error("ArrowUp did not wrap comment action focus");
    menuItems.at(-1)!.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Tab", bubbles: true }),
    );
    await wait(0);
    if (
      document.querySelector(".bb-comments-actions-popover") !== null ||
      document.activeElement === document.body
    ) {
      throw new Error("Tab did not dismiss the menu and preserve focus");
    }

    popover
      .querySelector<HTMLButtonElement>(
        '.bb-comments-actions-menu > button[aria-label="Comment actions"]',
      )
      ?.click();
    document.activeElement?.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Tab",
        shiftKey: true,
        bubbles: true,
      }),
    );
    await wait(0);
    if (
      document.querySelector(".bb-comments-actions-popover") !== null ||
      document.activeElement === document.body
    ) {
      throw new Error("Shift+Tab did not dismiss the menu and preserve focus");
    }

    popover
      .querySelector<HTMLButtonElement>(
        '.bb-comments-actions-menu > button[aria-label="Comment actions"]',
      )
      ?.click();
    popover.focus({ preventScroll: true });
    await wait(0);
    if (document.querySelector(".bb-comments-actions-popover") !== null)
      throw new Error("Moving focus outside did not dismiss the actions menu");

    const commentsScroller = popover.querySelector<HTMLElement>(
      ".bb-comments-thread-comments",
    )!;
    commentsScroller.scrollTop = 0;
    popover
      .querySelector<HTMLButtonElement>(
        '.bb-comments-actions-menu > button[aria-label="Comment actions"]',
      )
      ?.click();
    commentsScroller.scrollTop = commentsScroller.scrollHeight;
    commentsScroller.dispatchEvent(new Event("scroll"));
    await wait(30);
    if (document.querySelector(".bb-comments-actions-popover") !== null)
      throw new Error("Scrolling its trigger out of view did not dismiss menu");
    commentsScroller.scrollTop = 0;
    commentsScroller.dispatchEvent(new Event("scroll"));
    await wait(30);

    popover
      .querySelector<HTMLButtonElement>(
        '.bb-comments-actions-menu > button[aria-label="Comment actions"]',
      )
      ?.click();
    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );
    if (
      document.querySelector(".bb-comments-actions-popover") !== null ||
      document.querySelector(".bb-comments-thread") === null
    ) {
      throw new Error("Escape did not dismiss only the comment actions menu");
    }
    popover
      .querySelector<HTMLButtonElement>(
        '.bb-comments-actions-menu > button[aria-label="Comment actions"]',
      )
      ?.click();
    const editButton = [
      ...document.querySelectorAll<HTMLButtonElement>(
        ".bb-comments-actions-popover button",
      ),
    ].find((button) => button.textContent === "Edit");
    editButton?.click();
    if (document.querySelector(".bb-comments-actions-popover") !== null)
      throw new Error("Comment action did not dismiss its portal menu");
    const editInput = popover.querySelector<HTMLTextAreaElement>(
      ".bb-comments-edit-input",
    );
    if (
      editInput === null ||
      editInput.value !== "Verify the real browser geometry before shipping."
    ) {
      throw new Error("Comment edit did not replace the message body");
    }
    const saveEdit = popover.querySelector<HTMLButtonElement>(
      'button[aria-label="Save comment"]',
    );
    if (saveEdit?.disabled !== false)
      throw new Error("Unchanged comment cannot exit editing like Moss");
    const editComposer = editInput.closest<HTMLElement>(
      ".bb-comments-inline-composer",
    );
    const editRect = editInput.getBoundingClientRect();
    const saveRect = saveEdit.getBoundingClientRect();
    if (
      editComposer?.dataset.multiline !== "true" ||
      saveRect.top < editRect.bottom
    ) {
      throw new Error("Multiline edit did not move actions below the text");
    }
    editInput.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );
    if (
      document.querySelector(".bb-comments-thread") === null ||
      document.querySelector(".bb-comments-edit-input") !== null
    ) {
      throw new Error("Escape did not cancel editing in place");
    }
    const restoredCommentAction = popover.querySelector<HTMLButtonElement>(
      `[data-bb-comment-id="comment_root"] ` +
        '.bb-comments-actions-menu > button[aria-label="Comment actions"]',
    );
    if (document.activeElement !== restoredCommentAction)
      throw new Error("Cancelling edit did not restore comment action focus");

    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );
    if (document.querySelector(".bb-comments-thread") !== null) {
      throw new Error("Escape did not dismiss the thread popover");
    }
    if (!document.activeElement?.classList.contains("bb-comments-marker")) {
      throw new Error("Popover dismissal did not restore marker focus");
    }
    document
      .querySelector<HTMLButtonElement>(".bb-comments-marker")
      ?.click();
    document
      .querySelector<HTMLButtonElement>(".bb-comments-cluster button")
      ?.click();
    await wait(80);
    if (document.querySelector(".bb-comments-thread") === null)
      throw new Error("Thread popover did not reopen");
    if (
      [...document.querySelectorAll("button")].some((button) =>
        button.textContent?.includes("Send to agent"),
      )
    )
      throw new Error("Removed agent handoff action is still visible");

    document.body.dataset.testStatus = "passed";
    result.value =
      "Passed: real Chrome laid out 8 highlights, one local collision cluster, an 8-thread chooser, and a bounded thread popover.";
  } catch (error) {
    document.body.dataset.testStatus = "failed";
    result.value = error instanceof Error ? error.message : String(error);
  }
})();
