// @vitest-environment jsdom
import { fireEvent, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { PluginRpcClient } from "@bb/plugin-sdk/app";
import type {
  TimelineCommentThreadDetail,
  timelineCommentsRpcContract,
} from "./server.js";
import { mountMossCommentPopover } from "./comment-components.js";

const detail: TimelineCommentThreadDetail = {
  thread: {
    id: "ct_1",
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
      suffix: " text",
    },
    version: 1,
    createdAt: 1,
    updatedAt: 1,
    resolvedAt: null,
    rootComment: {
      id: "comment_1",
      threadId: "ct_1",
      parentId: null,
      body: "First comment",
      version: 1,
      createdAt: 1,
      updatedAt: 1,
    },
    replyCount: 0,
  },
  comments: [
    {
      id: "comment_1",
      threadId: "ct_1",
      parentId: null,
      body: "First comment",
      version: 1,
      createdAt: 1,
      updatedAt: 1,
    },
  ],
  nextCursor: null,
};

afterEach(() => {
  document.body.replaceChildren();
});

describe("Moss comment component port", () => {
  it("renders the Moss thread, message, and flat reply component structure", () => {
    const host = document.body.appendChild(document.createElement("section"));
    const unmount = mountMossCommentPopover(host, {
      rpc: { call: vi.fn() } as unknown as PluginRpcClient<
        typeof timelineCommentsRpcContract
      >,
      detail,
      onClose: vi.fn(),
      onChanged: vi.fn(),
      onSendToAgent: vi.fn(),
    });

    expect(host.querySelector("[data-comment-thread-header]")).not.toBeNull();
    expect(host.querySelector("[data-comment-thread-actions]")).not.toBeNull();
    expect(host.querySelector("[data-comment-message]")).not.toBeNull();
    expect(host.querySelector("[data-comment-view-content]")?.textContent).toContain(
      "First comment",
    );
    expect(host.querySelector("[data-comment-reply-region]")).not.toBeNull();
    expect(host.querySelector("[data-comment-reply-composer]")).not.toBeNull();
    expect(
      host.querySelector(".bb-comments-inline-composer[data-comment-reply-composer]"),
    ).not.toBeNull();
    unmount();
  });

  it("moves responsive side controls into a footer for multiline comments", async () => {
    const host = document.body.appendChild(document.createElement("section"));
    const unmount = mountMossCommentPopover(host, {
      rpc: { call: vi.fn() } as unknown as PluginRpcClient<
        typeof timelineCommentsRpcContract
      >,
      detail,
      onClose: vi.fn(),
      onChanged: vi.fn(),
      onSendToAgent: vi.fn(),
    });
    const input = host.querySelector<HTMLTextAreaElement>(
      '[aria-label="Reply to comment thread"]',
    )!;
    fireEvent.change(input, { target: { value: "First line\nSecond line" } });

    await waitFor(() =>
      expect(
        host
          .querySelector(".bb-comments-mention-input")
          ?.getAttribute("data-mention-input-expanded"),
      ).toBe("true"),
    );
    expect(
      host
        .querySelector("[data-mention-input-footer]")
        ?.getAttribute("data-mention-input-footer-state"),
    ).toBe("expanded");
    expect(
      host
        .querySelector("[data-mention-input-compact-actions]")
        ?.getAttribute("aria-hidden"),
    ).toBe("true");
    expect(
      host
        .querySelector("[data-mention-input-expanded-actions]")
        ?.getAttribute("aria-hidden"),
    ).toBe("false");
    unmount();
  });

  it("moves the last comment's edit footer into the stable reply region", async () => {
    const host = document.body.appendChild(document.createElement("section"));
    host.dataset.bbPluginDecoration = "timeline-comments";
    const unmount = mountMossCommentPopover(host, {
      rpc: { call: vi.fn() } as unknown as PluginRpcClient<
        typeof timelineCommentsRpcContract
      >,
      detail,
      onClose: vi.fn(),
      onChanged: vi.fn(),
      onSendToAgent: vi.fn(),
    });

    fireEvent.click(host.querySelector('button[aria-label="Comment actions"]')!);
    fireEvent.click(host.querySelector('[role="menuitem"]')!);

    await waitFor(() =>
      expect(host.querySelector("[data-comment-message]")?.getAttribute("data-comment-editing")).toBe(
        "true",
      ),
    );
    const replyRegion = host.querySelector("[data-comment-reply-region]")!;
    expect(replyRegion.getAttribute("data-last-editing")).toBe("true");
    expect(
      replyRegion
        .querySelector("[data-comment-reply-composer]")
        ?.getAttribute("aria-hidden"),
    ).toBe("true");
    expect(
      replyRegion.querySelector(
        "[data-comment-edit-footer-host] [data-mention-input-footer]",
      ),
    ).not.toBeNull();
    expect(
      host.querySelector("[data-comment-edit-composer] [data-mention-input-surface]"),
    ).not.toBeNull();
    unmount();
  });
});
