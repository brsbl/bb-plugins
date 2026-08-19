import "../app.css";
import "../test/compact-composer-runtime.js";
import { registerTimelineCommentThreadWindow } from "../bridge.js";
import { mountTimelineCommentsController } from "../controller.js";
import type { PluginContentScriptContext } from "@bb/plugin-sdk/app";

const threadId = "thr_browser";
const messageId = "msg_browser";
const prose = document.querySelector<HTMLElement>(
  "[data-sidebar-swipe-selectable]",
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
const rootComment = {
  id: "comment_root",
  threadId: summaries[0]!.id,
  parentId: null,
  body: "Verify the real browser geometry before shipping.",
  version: 1,
  createdAt: now,
  updatedAt: now,
};
const replies = Array.from({ length: 12 }, (_, index) => ({
  id: `comment_reply_${index}`,
  threadId: summaries[0]!.id,
  parentId: rootComment.id,
  body: `Reply ${index + 1} keeps this thread long enough to scroll.`,
  version: 1,
  createdAt: now + index + 1,
  updatedAt: now + index + 1,
}));

const nativeFetch = window.fetch.bind(window);
window.fetch = async (input, init) => {
  const url = String(input);
  const method = url.split("/").at(-1);
  if (url.startsWith("/api/v1/plugins/timeline-comments/rpc/")) {
    let result: unknown;
    if (method === "listOpenAnchors") {
      result = { anchors: summaries, nextCursor: null };
    } else if (method === "getCommentThread") {
      const summary = summaries[0]!;
      result = {
        thread: { ...summary, rootComment, replyCount: replies.length },
        comments: [rootComment, ...replies],
        nextCursor: null,
      };
    } else if (method === "reply") {
      const insertedReply = {
        id: "comment_reply_incremental",
        threadId: summaries[0]!.id,
        parentId: rootComment.id,
        body: "Preserve this reply draft",
        version: 1,
        createdAt: now + replies.length + 1,
        updatedAt: now + replies.length + 1,
      };
      result = {
        thread: {
          ...summaries[0]!,
          version: 2,
          rootComment,
          replyCount: replies.length + 1,
        },
        comments: [rootComment, ...replies, insertedReply],
        nextCursor: null,
      };
    } else {
      throw new Error(`Unexpected RPC ${method}`);
    }
    return new Response(JSON.stringify({ ok: true, result }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }
  return nativeFetch(input, init);
};

const context: PluginContentScriptContext = {
  pluginId: "timeline-comments",
  generation: 1,
  signal: new AbortController().signal,
};

mountTimelineCommentsController(context);
registerTimelineCommentThreadWindow(
  threadId,
  document.querySelector<HTMLElement>("[data-thread-window]")!,
);

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function waitUntil(
  predicate: () => boolean,
  message: string,
  timeout = 2_000,
): Promise<void> {
  const deadline = performance.now() + timeout;
  while (!predicate()) {
    if (performance.now() >= deadline) throw new Error(message);
    await wait(16);
  }
}

function withinViewport(rect: DOMRect): boolean {
  return (
    rect.left >= 0 &&
    rect.top >= 0 &&
    rect.right <= window.innerWidth &&
    rect.bottom <= window.innerHeight
  );
}

function setTextareaValue(textarea: HTMLTextAreaElement, value: string): void {
  Object.getOwnPropertyDescriptor(
    HTMLTextAreaElement.prototype,
    "value",
  )?.set?.call(textarea, value);
  textarea.dispatchEvent(new InputEvent("input", { bubbles: true }));
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
    if (clusterIconRect.width !== 15 || clusterIconRect.height !== 15)
      throw new Error("Cluster icon does not match the single-marker icon size");
    if (
      overflow.dataset.bbCommentGutter === "left" &&
      clusterCountRect.right > clusterIconRect.left
    )
      throw new Error("Left-gutter cluster count is not gutter-side");
    const markerRect = overflow.getBoundingClientRect();
    const tableRect = prose.querySelector("table")!.getBoundingClientRect();
    if (Math.abs(markerRect.left - tableRect.right - 8) > 1)
      throw new Error("Gutter marker did not account for the table width");
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
      'textarea[aria-label="Reply to comment thread"]',
    );
    let replyButton = popover.querySelector<HTMLButtonElement>(
      'button[aria-label="Reply"]',
    );
    if (reply === null || replyButton?.disabled !== true)
      throw new Error("Blank reply was not disabled");
    if (reply.closest('[data-testid="bb-compact-composer"]') === null)
      throw new Error("Reply did not render through the host compact composer");
    setTextareaValue(reply, "Ready");
    await wait(30);
    replyButton = popover.querySelector<HTMLButtonElement>(
      'button[aria-label="Reply"]',
    );
    if (replyButton?.disabled !== false)
      throw new Error("Valid reply did not enable submission");
    if (document.querySelector(".bb-comments-mention-menu") !== null)
      throw new Error("Deleted custom mention picker is still mounted");
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
    await wait(30);
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
      (button) => button.textContent?.trim() === "Delete",
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
      throw new Error(
        `Comment actions menu is clipped by the thread chrome: menu=${JSON.stringify(actionsRect.toJSON())} delete=${deleteRect ? JSON.stringify(deleteRect.toJSON()) : "missing"} visible=${visibleAtDelete?.className ?? visibleAtDelete?.nodeName ?? "none"}`,
      );

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
    await wait(0);
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
    await wait(0);
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

    const clippedTrigger = popover.querySelector<HTMLButtonElement>(
      `[data-bb-comment-id="comment_root"] ` +
        '.bb-comments-actions-menu > button[aria-label="Comment actions"]',
    )!;
    const scrollerRect = commentsScroller.getBoundingClientRect();
    const triggerRect = clippedTrigger.getBoundingClientRect();
    commentsScroller.scrollTop +=
      triggerRect.top -
      scrollerRect.top +
      triggerRect.height / 2;
    commentsScroller.dispatchEvent(new Event("scroll"));
    await wait(30);
    const clippedRect = clippedTrigger.getBoundingClientRect();
    if (
      clippedRect.top >= scrollerRect.top ||
      clippedRect.bottom <= scrollerRect.top
    ) {
      throw new Error("Browser fixture did not partially clip action trigger");
    }
    const originalAddEventListener = document.addEventListener;
    let pointerdownListenerAdds = 0;
    document.addEventListener = ((
      type: string,
      listener: EventListenerOrEventListenerObject,
      options?: boolean | AddEventListenerOptions,
    ) => {
      if (type === "pointerdown") pointerdownListenerAdds += 1;
      originalAddEventListener.call(document, type, listener, options);
    }) as typeof document.addEventListener;
    clippedTrigger.focus({ preventScroll: true });
    try {
      clippedTrigger.click();
    } finally {
      document.addEventListener = originalAddEventListener;
    }
    if (
      document.querySelector(".bb-comments-actions-popover") !== null ||
      clippedTrigger.getAttribute("aria-expanded") !== "false" ||
      pointerdownListenerAdds !== 0
    ) {
      throw new Error(
        "Partially clipped trigger left a menu or dismissal listener open",
      );
    }
    commentsScroller.scrollTop = 0;
    commentsScroller.dispatchEvent(new Event("scroll"));
    await wait(30);

    popover
      .querySelector<HTMLButtonElement>(
        '.bb-comments-actions-menu > button[aria-label="Comment actions"]',
      )
      ?.click();
    await wait(0);
    document.activeElement?.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );
    await wait(0);
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
    const originalBody = popover.querySelector<HTMLElement>(
      '[data-bb-comment-id="comment_root"] .bb-comments-comment-body',
    );
    const originalReplyInput = popover.querySelector<HTMLTextAreaElement>(
      'textarea[aria-label="Reply to comment thread"]',
    );
    if (originalBody === null || originalReplyInput === null)
      throw new Error("Thread fixture omitted persistent edit surfaces");
    const originalEditingRow = originalBody.closest(".bb-comments-comment");
    setTextareaValue(originalReplyInput, "Preserve this reply draft");
    const editButton = [
      ...document.querySelectorAll<HTMLButtonElement>(
        ".bb-comments-actions-popover button",
      ),
    ].find((button) => button.textContent?.trim() === "Edit");
    editButton?.click();
    await wait(0);
    if (document.querySelector(".bb-comments-actions-popover") !== null)
      throw new Error("Comment action did not dismiss its portal menu");
    const editInput = popover.querySelector<HTMLTextAreaElement>(
      '[data-bb-comment-id="comment_root"] textarea[aria-label="Edit comment"]',
    );
    if (
      editInput === null ||
      editInput.value !== "Verify the real browser geometry before shipping."
    ) {
      throw new Error("Comment edit did not expose its incremental editor");
    }
    const editingRow = editInput.closest<HTMLElement>(".bb-comments-comment")!;
    const cancelEditButton = editingRow.querySelector<HTMLButtonElement>(
      'button[aria-label="Cancel comment edit"]',
    );
    if (
      editingRow.dataset.editing !== "true" ||
      !editingRow.getAnimations().some(({ effect }) => effect !== null) ||
      cancelEditButton === null ||
      getComputedStyle(cancelEditButton).display === "none" ||
      originalEditingRow !== editingRow
    ) {
      throw new Error("Comment edit rebuilt the row or omitted its height animation");
    }
    const replyRegion = popover.querySelector<HTMLElement>(".bb-comments-reply");
    if (
      replyRegion?.dataset.editing !== "true" ||
      replyRegion.getAttribute("inert") === null
    ) {
      throw new Error("Editing above replies did not incrementally collapse them");
    }
    const saveEdit = popover.querySelector<HTMLButtonElement>(
      '[data-bb-comment-id="comment_root"] button[aria-label="Save comment"]',
    );
    if (saveEdit?.disabled !== false)
      throw new Error("Unchanged comment cannot exit editing like Moss");
    saveEdit.focus();
    saveEdit.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );
    await wait(0);
    if (
      document.querySelector(".bb-comments-thread") === null ||
      editingRow.dataset.editing === "true" ||
      replyRegion?.dataset.editing !== "false"
    ) {
      throw new Error("Escape did not cancel editing in place");
    }
    if (
      originalReplyInput !==
        popover.querySelector<HTMLTextAreaElement>(
          'textarea[aria-label="Reply to comment thread"]',
        ) ||
      originalReplyInput.value !== "Preserve this reply draft"
    ) {
      throw new Error("Editing rebuilt or cleared the mounted reply composer");
    }
    originalReplyInput.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Enter",
        metaKey: true,
        bubbles: true,
      }),
    );
    await waitUntil(
      () =>
        originalReplyInput.value === "" &&
        [...popover.querySelectorAll(".bb-comments-comment")].some((row) =>
          row.textContent?.includes("Preserve this reply draft"),
        ),
      "Reply RPC did not settle and render its inserted reply",
    );
    const insertedReply = [...popover.querySelectorAll(".bb-comments-comment")]
      .find((row) => row.textContent?.includes("Preserve this reply draft"));
    if (
      document.querySelector(".bb-comments-thread") !== popover ||
      originalReplyInput !==
        popover.querySelector<HTMLTextAreaElement>(
          'textarea[aria-label="Reply to comment thread"]',
        ) ||
      originalReplyInput.value !== "" ||
      insertedReply === undefined ||
      insertedReply.getAnimations().length === 0
    ) {
      throw new Error(
        `Reply did not insert incrementally into the open thread: ${JSON.stringify({
          threadPreserved: document.querySelector(".bb-comments-thread") === popover,
          inputPreserved:
            originalReplyInput ===
            popover.querySelector<HTMLTextAreaElement>(
              'textarea[aria-label="Reply to comment thread"]',
            ),
          inputValue: originalReplyInput.value,
          inserted: insertedReply !== undefined,
          animations: insertedReply?.getAnimations().length ?? 0,
        })}`,
      );
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
