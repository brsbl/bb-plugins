// @vitest-environment jsdom
import { act, fireEvent, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { PluginRpcClient } from "@bb/plugin-sdk/app";
import type {
  TimelineCommentThreadDetail,
  timelineCommentsRpcContract,
} from "./server.js";
import {
  mountMossCommentComposer,
  mountMossCommentPopover,
} from "./comment-components.js";

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
  sessionStorage.clear();
  vi.restoreAllMocks();
});

function mountWithRpc(
  host: HTMLElement,
  call: ReturnType<typeof vi.fn> = vi.fn(),
) {
  host.dataset.bbPluginDecoration = "timeline-comments";
  host.classList.add("bb-comments-thread");
  return mountMossCommentPopover(host, {
    rpc: { call } as unknown as PluginRpcClient<
      typeof timelineCommentsRpcContract
    >,
    detail,
    onClose: vi.fn(),
    onChanged: vi.fn(),
    onSendToAgent: vi.fn(),
  });
}

function openRootEdit(host: HTMLElement): HTMLTextAreaElement {
  fireEvent.click(host.querySelector('button[aria-label="Comment actions"]')!);
  fireEvent.click(host.querySelector('[role="menuitem"]')!);
  return host.querySelector<HTMLTextAreaElement>('[aria-label="Edit comment"]')!;
}

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

  it("restores reply and edit drafts across remounts and clears them only on cancel", () => {
    const replyKey = "bb.timeline-comments.reply:ct_1";
    const editKey = "bb.timeline-comments.edit:comment_1";
    let host = document.body.appendChild(document.createElement("section"));
    let unmount = mountWithRpc(host);

    fireEvent.change(
      host.querySelector('[aria-label="Reply to comment thread"]')!,
      { target: { value: "Unsent reply" } },
    );
    const edit = openRootEdit(host);
    fireEvent.change(edit, { target: { value: "Unsent edit" } });
    expect(JSON.parse(sessionStorage.getItem(replyKey)!).body).toBe("Unsent reply");
    expect(JSON.parse(sessionStorage.getItem(editKey)!).body).toBe("Unsent edit");
    unmount();
    host.remove();

    host = document.body.appendChild(document.createElement("section"));
    unmount = mountWithRpc(host);
    expect(
      host.querySelector<HTMLTextAreaElement>(
        '[aria-label="Reply to comment thread"]',
      )?.value,
    ).toBe("Unsent reply");
    expect(openRootEdit(host).value).toBe("Unsent edit");

    fireEvent.click(host.querySelector('[aria-label="Cancel comment edit"]')!);
    expect(sessionStorage.getItem(editKey)).toBeNull();
    expect(sessionStorage.getItem(replyKey)).not.toBeNull();
    unmount();
  });

  it("clears a reverted edit draft so a later server body wins", () => {
    const editKey = "bb.timeline-comments.edit:comment_1";
    let host = document.body.appendChild(document.createElement("section"));
    let unmount = mountWithRpc(host);
    const edit = openRootEdit(host);
    fireEvent.change(edit, { target: { value: "Changed locally" } });
    expect(sessionStorage.getItem(editKey)).not.toBeNull();
    fireEvent.change(edit, { target: { value: detail.comments[0]!.body } });
    expect(sessionStorage.getItem(editKey)).toBeNull();
    unmount();
    host.remove();

    host = document.body.appendChild(document.createElement("section"));
    host.dataset.bbPluginDecoration = "timeline-comments";
    host.classList.add("bb-comments-thread");
    unmount = mountMossCommentPopover(host, {
      rpc: { call: vi.fn() } as unknown as PluginRpcClient<
        typeof timelineCommentsRpcContract
      >,
      detail: {
        ...detail,
        thread: {
          ...detail.thread,
          rootComment: { ...detail.thread.rootComment, body: "Updated remotely" },
        },
        comments: [
          { ...detail.comments[0]!, body: "Updated remotely" },
        ],
      },
      onClose: vi.fn(),
      onChanged: vi.fn(),
      onSendToAgent: vi.fn(),
    });
    expect(openRootEdit(host).value).toBe("Updated remotely");
    unmount();
  });

  it("drops expired drafts instead of restoring them", () => {
    const key = "bb.timeline-comments.reply:ct_1";
    sessionStorage.setItem(
      key,
      JSON.stringify({ body: "Expired", expiresAt: Date.now() - 1 }),
    );
    const host = document.body.appendChild(document.createElement("section"));
    const unmount = mountWithRpc(host);
    expect(
      host.querySelector<HTMLTextAreaElement>(
        '[aria-label="Reply to comment thread"]',
      )?.value,
    ).toBe("");
    expect(sessionStorage.getItem(key)).toBeNull();
    unmount();
  });

  it("permits only one reply mutation while the first request is pending", async () => {
    let resolveReply!: (value: TimelineCommentThreadDetail) => void;
    const pending = new Promise<TimelineCommentThreadDetail>((resolve) => {
      resolveReply = resolve;
    });
    const call = vi.fn(() => pending);
    const host = document.body.appendChild(document.createElement("section"));
    const unmount = mountWithRpc(host, call);
    const input = host.querySelector<HTMLTextAreaElement>(
      '[aria-label="Reply to comment thread"]',
    )!;
    fireEvent.change(input, { target: { value: "One reply" } });
    const submit = host.querySelector<HTMLButtonElement>(
      'button[aria-label="Submit comment"]',
    )!;

    act(() => {
      submit.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      input.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "Enter",
          metaKey: true,
          bubbles: true,
        }),
      );
    });

    expect(call).toHaveBeenCalledTimes(1);
    expect(submit.disabled).toBe(true);
    expect(input.readOnly).toBe(true);
    resolveReply(detail);
    await waitFor(() => expect(input.value).toBe(""));
    expect(sessionStorage.getItem("bb.timeline-comments.reply:ct_1")).toBeNull();
    unmount();
  });

  it("restores reply submission after a rejected request", async () => {
    let rejectReply!: (error: Error) => void;
    const first = new Promise<TimelineCommentThreadDetail>((_resolve, reject) => {
      rejectReply = reject;
    });
    const call = vi
      .fn()
      .mockImplementationOnce(() => first)
      .mockResolvedValueOnce(detail);
    const host = document.body.appendChild(document.createElement("section"));
    const unmount = mountWithRpc(host, call);
    const input = host.querySelector<HTMLTextAreaElement>(
      '[aria-label="Reply to comment thread"]',
    )!;
    fireEvent.change(input, { target: { value: "Retry this reply" } });
    const submit = host.querySelector<HTMLButtonElement>(
      'button[aria-label="Submit comment"]',
    )!;

    fireEvent.click(submit);
    expect(input.readOnly).toBe(true);
    rejectReply(new Error("Temporary failure"));
    await waitFor(() => expect(input.readOnly).toBe(false));
    expect(input.value).toBe("Retry this reply");
    expect(submit.disabled).toBe(false);

    fireEvent.click(submit);
    await waitFor(() => expect(call).toHaveBeenCalledTimes(2));
    unmount();
  });

  it("permits only one update mutation while the first request is pending", async () => {
    let resolveUpdate!: (value: TimelineCommentThreadDetail) => void;
    const pending = new Promise<TimelineCommentThreadDetail>((resolve) => {
      resolveUpdate = resolve;
    });
    const call = vi.fn(() => pending);
    const host = document.body.appendChild(document.createElement("section"));
    const unmount = mountWithRpc(host, call);
    const input = openRootEdit(host);
    fireEvent.change(input, { target: { value: "Updated once" } });
    const submit = host.querySelector<HTMLButtonElement>(
      'button[aria-label="Submit comment"]',
    )!;

    act(() => {
      submit.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      input.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "Enter",
          metaKey: true,
          bubbles: true,
        }),
      );
    });

    expect(call).toHaveBeenCalledTimes(1);
    expect(submit.disabled).toBe(true);
    expect(input.readOnly).toBe(true);
    resolveUpdate(detail);
    await waitFor(() =>
      expect(host.querySelector('[aria-label="Edit comment"]')).toBeNull(),
    );
    expect(sessionStorage.getItem("bb.timeline-comments.edit:comment_1")).toBeNull();
    unmount();
  });

  it("refreshes changed state and retries an edit with fresh versions", async () => {
    const freshDetail: TimelineCommentThreadDetail = {
      ...detail,
      thread: {
        ...detail.thread,
        version: 2,
        rootComment: {
          ...detail.thread.rootComment,
          body: "Updated remotely",
          version: 2,
        },
      },
      comments: [
        {
          ...detail.comments[0]!,
          body: "Updated remotely",
          version: 2,
        },
      ],
    };
    const savedDetail: TimelineCommentThreadDetail = {
      ...freshDetail,
      thread: {
        ...freshDetail.thread,
        version: 3,
        rootComment: {
          ...freshDetail.thread.rootComment,
          body: "Keep my local edit",
          version: 3,
        },
      },
      comments: [
        {
          ...freshDetail.comments[0]!,
          body: "Keep my local edit",
          version: 3,
        },
      ],
    };
    const remoteReply = {
      id: "comment_2",
      threadId: "ct_1",
      parentId: "comment_1",
      body: "Added remotely",
      version: 1,
      createdAt: 2,
      updatedAt: 2,
    };
    let updateAttempts = 0;
    let detailPage = 0;
    const call = vi.fn(async (method: string, input: unknown) => {
      if (method === "updateComment") {
        updateAttempts += 1;
        if (updateAttempts === 1) {
          throw new Error("Comment changed; refresh and retry");
        }
        expect(input).toMatchObject({
          commentId: "comment_1",
          expectedVersion: 2,
          body: "Keep my local edit",
        });
        return savedDetail;
      }
      if (method === "listCommentThreads") {
        expect(input).toEqual({ bbThreadId: "thr_1", filter: "all" });
        return { threads: [freshDetail.thread], nextCursor: null };
      }
      if (method === "getCommentThread") {
        detailPage += 1;
        if (detailPage === 1) {
          expect(input).toEqual({
            bbThreadId: "thr_1",
            commentThreadId: "ct_1",
          });
          return { ...freshDetail, nextCursor: "comment_page_2" };
        }
        expect(input).toEqual({
          bbThreadId: "thr_1",
          commentThreadId: "ct_1",
          cursor: "comment_page_2",
        });
        return { ...freshDetail, comments: [remoteReply], nextCursor: null };
      }
      throw new Error(`Unexpected RPC ${method}`);
    });
    const host = document.body.appendChild(document.createElement("section"));
    const unmount = mountWithRpc(host, call);
    const input = openRootEdit(host);
    fireEvent.change(input, { target: { value: "Keep my local edit" } });
    const save = host.querySelector<HTMLButtonElement>(
      '[data-comment-edit-footer-host] button[aria-label="Submit comment"]',
    )!;
    fireEvent.click(save);

    await waitFor(() =>
      expect(call).toHaveBeenCalledWith("getCommentThread", {
        bbThreadId: "thr_1",
        commentThreadId: "ct_1",
      }),
    );
    expect(
      host.querySelector<HTMLTextAreaElement>('[aria-label="Edit comment"]')
        ?.value,
    ).toBe("Keep my local edit");
    expect(host.textContent).toContain("Added remotely");

    fireEvent.click(
      host.querySelector(
        '[data-comment-editing="true"] button[aria-label="Submit comment"]',
      )!,
    );
    await waitFor(() => expect(updateAttempts).toBe(2));
    await waitFor(() =>
      expect(host.querySelector('[aria-label="Edit comment"]')).toBeNull(),
    );
    unmount();
  });

  it("makes a pending new-comment composer read-only until its request settles", async () => {
    let rejectSubmit!: (error: Error) => void;
    const pending = new Promise<void>((_resolve, reject) => {
      rejectSubmit = reject;
    });
    const onSubmit = vi.fn(() => pending);
    const host = document.body.appendChild(document.createElement("section"));
    const unmount = mountMossCommentComposer(host, {
      initialValue: "",
      onChange: vi.fn(),
      onCancel: vi.fn(),
      onSubmit,
    });
    const input = host.querySelector<HTMLTextAreaElement>(
      '[aria-label="Add a comment"]',
    )!;
    fireEvent.change(input, { target: { value: "Pending comment" } });
    fireEvent.click(
      host.querySelector('button[aria-label="Submit comment"]')!,
    );
    expect(input.readOnly).toBe(true);

    rejectSubmit(new Error("Temporary failure"));
    await waitFor(() => expect(input.readOnly).toBe(false));
    expect(input.value).toBe("Pending comment");
    unmount();
  });

  it("moves focus past the actions trigger on Tab and before it on Shift+Tab", async () => {
    vi.spyOn(HTMLElement.prototype, "getClientRects").mockImplementation(
      () => [{ width: 1, height: 1 }] as unknown as DOMRectList,
    );
    const host = document.body.appendChild(document.createElement("section"));
    const unmount = mountWithRpc(host);
    const trigger = host.querySelector<HTMLButtonElement>(
      'button[aria-label="Comment actions"]',
    )!;
    fireEvent.click(trigger);
    const firstMenuItem = host.querySelector<HTMLElement>('[role="menuitem"]')!;
    fireEvent.keyDown(firstMenuItem, { key: "Tab" });
    expect(document.activeElement).toBe(
      host.querySelector('[aria-label="Reply to comment thread"]'),
    );
    expect(host.querySelector('[role="menu"]')).toBeNull();

    fireEvent.click(trigger);
    const reopenedMenuItem = host.querySelector<HTMLElement>('[role="menuitem"]')!;
    fireEvent.keyDown(reopenedMenuItem, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(
      host.querySelector('[aria-label="Delete thread"]'),
    );
    expect(host.querySelector('[role="menu"]')).toBeNull();
    unmount();
  });

  it("lets Tab leave a resolved thread when its last action has no successor", async () => {
    vi.spyOn(HTMLElement.prototype, "getClientRects").mockImplementation(
      () => [{ width: 1, height: 1 }] as unknown as DOMRectList,
    );
    const host = document.body.appendChild(document.createElement("section"));
    host.dataset.bbPluginDecoration = "timeline-comments";
    host.classList.add("bb-comments-thread");
    const unmount = mountMossCommentPopover(host, {
      rpc: { call: vi.fn() } as unknown as PluginRpcClient<
        typeof timelineCommentsRpcContract
      >,
      detail: {
        ...detail,
        thread: { ...detail.thread, resolvedAt: 2 },
      },
      onClose: vi.fn(),
      onChanged: vi.fn(),
      onSendToAgent: vi.fn(),
    });
    const trigger = host.querySelector<HTMLButtonElement>(
      'button[aria-label="Comment actions"]',
    )!;
    fireEvent.click(trigger);
    const allowed = fireEvent.keyDown(
      host.querySelector<HTMLElement>('[role="menuitem"]')!,
      { key: "Tab" },
    );

    expect(allowed).toBe(true);
    await waitFor(() => expect(host.querySelector('[role="menu"]')).toBeNull());
    unmount();
  });

  it("installs scroll dismissal before control returns from opening the menu", async () => {
    const host = document.body.appendChild(document.createElement("section"));
    const unmount = mountWithRpc(host);
    host.querySelector<HTMLButtonElement>(
      'button[aria-label="Comment actions"]',
    )!.click();
    expect(host.querySelector('[role="menu"]')).not.toBeNull();
    window.dispatchEvent(new Event("scroll"));
    await waitFor(() => expect(host.querySelector('[role="menu"]')).toBeNull());
    unmount();
  });
});
