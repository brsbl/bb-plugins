// @vitest-environment jsdom
import { cleanup, fireEvent } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { PluginThreadPanelProps } from "@bb/plugin-sdk/app";
import {
  loadPluginApp,
  mountPluginContentScripts,
  renderSlot,
} from "./test/plugin-sdk-app-harness.js";
import type { timelineCommentsRpcContract } from "./server.js";

afterEach(cleanup);

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

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
    suffix: "",
  },
  version: 1,
  createdAt: 1,
  updatedAt: 1,
  resolvedAt: null,
  rootComment: {
    id: "comment_1",
    threadId: "comment_thread_1",
    parentId: null,
    body: "Make the API explicit.",
    version: 1,
    createdAt: 1,
    updatedAt: 1,
  },
  replyCount: 0,
};

describe("timeline comments app", () => {
  it("registers a selection action, composer action, Comments panel, and one content script", async () => {
    const app = await loadPluginApp(() => import("./app.js"));
    expect(app.messageActions).toMatchObject([
      {
        id: "comment-selection",
        title: "Comment",
        placements: ["selection-menu"],
      },
    ]);
    expect(app.threadPanelActions).toMatchObject([
      {
        id: "comments",
        title: "Comments",
        icon: "MessageSquare",
        layout: "flush",
      },
    ]);
    expect(app.composerCustomizations).toMatchObject([
      {
        id: "timeline-comments",
        scopes: ["thread"],
        actions: [{ id: "add-comments" }],
      },
    ]);
    expect(app.contentScripts.map(({ id }) => id)).toEqual([
      "timeline-comment-anchors",
    ]);
  });

  it("adds open comments to the draft from the thread composer action", async () => {
    const app = await loadPluginApp(() => import("./app.js"));
    const action = renderSlot(
      app.composerCustomizations[0]!.actions![0]!,
      {},
      {
        context: { threadId: "thr_1" },
        composer: {
          text: "Keep this draft",
          scope: { kind: "thread", threadId: "thr_1" },
        },
        rpc: {
          getThreadHandoffSummary: () => ({
            threadCount: 1,
            commentCount: 1,
            codePointSize: 100,
          }),
        },
      },
    );

    fireEvent.click(
      action.getByRole("button", { name: "Add comments to chat" }),
    );
    await vi.waitFor(() =>
      expect(action.inspection.composer.mentions).toHaveLength(1),
    );
    expect(action.inspection.composer.mentions[0]).toEqual({
      provider: "thread-comments",
      id: "thr_1",
      label: "1 comment from 1 open thread",
    });
    expect(action.inspection.composer.text).toContain("Keep this draft");
    expect(action.inspection.navigateCalls).toEqual([]);
  });

  it("shows a compact error and recovers when adding comments is retried", async () => {
    const getThreadHandoffSummary = vi
      .fn()
      .mockRejectedValueOnce(new Error("Summary unavailable"))
      .mockResolvedValueOnce({
        threadCount: 1,
        commentCount: 2,
        codePointSize: 100,
      });
    const app = await loadPluginApp(() => import("./app.js"));
    const action = renderSlot(
      app.composerCustomizations[0]!.actions![0]!,
      {},
      {
        context: { threadId: "thr_1" },
        composer: {
          text: "",
          scope: { kind: "thread", threadId: "thr_1" },
        },
        rpc: { getThreadHandoffSummary },
      },
    );

    fireEvent.click(
      action.getByRole("button", { name: "Add comments to chat" }),
    );
    expect((await action.findByRole("alert")).textContent).toBe(
      "Couldn’t add comments",
    );
    expect(action.inspection.composer.mentions).toHaveLength(0);

    fireEvent.click(
      action.getByRole("button", { name: "Retry adding comments to chat" }),
    );
    await vi.waitFor(() =>
      expect(action.inspection.composer.mentions).toHaveLength(1),
    );
    expect(action.queryByRole("alert")).toBeNull();
    expect(getThreadHandoffSummary).toHaveBeenCalledTimes(2);
  });

  it("removes every content-script node and tolerates repeated disposal", async () => {
    const app = await loadPluginApp(() => import("./app.js"));
    const scripts = await mountPluginContentScripts(app, {
      pluginId: "timeline-comments",
    });
    expect(
      document.querySelectorAll("[data-bb-timeline-comments-owned]"),
    ).toHaveLength(3);
    await scripts.lifecycle.dispose();
    await scripts.lifecycle.dispose();
    expect(
      document.querySelectorAll("[data-bb-timeline-comments-owned]"),
    ).toHaveLength(0);
  });

  it("shows the comment list without a duplicate title or chat action", async () => {
    const app = await loadPluginApp(() => import("./app.js"));
    const panel = renderSlot<
      PluginThreadPanelProps,
      typeof timelineCommentsRpcContract
    >(
      app.threadPanelActions[0]!,
      {
        threadId: "thr_1",
        params: null,
        revealMessage: vi.fn(async () => "revealed" as const),
      },
      {
        context: { threadId: "thr_1" },
        rpc: {
          listCommentThreads: () => ({ threads: [thread], nextCursor: null }),
          getThreadHandoffSummary: () => ({
            threadCount: 1,
            commentCount: 1,
            codePointSize: 100,
          }),
          getCommentThread: () => ({
            thread,
            comments: [thread.rootComment],
            nextCursor: null,
          }),
          createThread: () => ({
            thread,
            comments: [thread.rootComment],
            nextCursor: null,
          }),
          reply: () => ({
            thread,
            comments: [thread.rootComment],
            nextCursor: null,
          }),
          updateComment: () => ({
            thread,
            comments: [thread.rootComment],
            nextCursor: null,
          }),
          deleteComment: () => ({ deletedThreadId: null, thread: null }),
          setThreadResolved: () => ({
            thread,
            comments: [thread.rootComment],
            nextCursor: null,
          }),
          listOpenAnchors: () => ({ anchors: [], nextCursor: null }),
        },
      },
    );
    expect(panel.queryByRole("heading", { name: "Comments" })).toBeNull();
    expect(panel.queryByRole("button", { name: "Add to chat" })).toBeNull();
    expect(panel.queryByText("1 open comment")).toBeNull();
    expect(await panel.findByRole("button", { name: /source/i })).not.toBeNull();
  });

  it("uses panel rows only to reveal the anchored thread popover", async () => {
    const app = await loadPluginApp(() => import("./app.js"));
    const revealMessage = vi.fn(async () => "revealed" as const);
    const panel = renderSlot<
      PluginThreadPanelProps,
      typeof timelineCommentsRpcContract
    >(
      app.threadPanelActions[0]!,
      { threadId: "thr_1", params: null, revealMessage },
      {
        context: { threadId: "thr_1" },
        rpc: {
          listCommentThreads: () => ({ threads: [thread], nextCursor: null }),
          getThreadHandoffSummary: () => ({
            threadCount: 1,
            commentCount: 1,
            codePointSize: 100,
          }),
          getCommentThread: () => ({
            thread,
            comments: [thread.rootComment],
            nextCursor: null,
          }),
          createThread: () => ({
            thread,
            comments: [thread.rootComment],
            nextCursor: null,
          }),
          reply: () => ({
            thread,
            comments: [thread.rootComment],
            nextCursor: null,
          }),
          updateComment: () => ({
            thread,
            comments: [thread.rootComment],
            nextCursor: null,
          }),
          deleteComment: () => ({ deletedThreadId: null, thread: null }),
          setThreadResolved: () => ({
            thread,
            comments: [thread.rootComment],
            nextCursor: null,
          }),
          listOpenAnchors: () => ({ anchors: [], nextCursor: null }),
        },
      },
    );
    const row = await panel.findByRole("button", { name: /source/i });
    fireEvent.click(row);
    await vi.waitFor(() =>
      expect(revealMessage).toHaveBeenCalledWith("msg_1"),
    );
    expect(row.closest("article")?.dataset.active).toBe("true");
    expect(
      panel.queryByRole("button", { name: "Comment actions" }),
    ).toBeNull();
    expect(panel.inspection.navigateCalls).toEqual([]);
  });

  it("keeps the newest filter response when an older load resolves later", async () => {
    const firstPage = deferred<{
      threads: typeof thread[];
      nextCursor: string | null;
    }>();
    const stalePage = deferred<{
      threads: typeof thread[];
      nextCursor: string | null;
    }>();
    const newestPage = deferred<{
      threads: typeof thread[];
      nextCursor: string | null;
    }>();
    const listCommentThreads = vi
      .fn()
      .mockReturnValueOnce(firstPage.promise)
      .mockReturnValueOnce(stalePage.promise)
      .mockReturnValueOnce(newestPage.promise);
    const app = await loadPluginApp(() => import("./app.js"));
    const panel = renderSlot<
      PluginThreadPanelProps,
      typeof timelineCommentsRpcContract
    >(
      app.threadPanelActions[0]!,
      {
        threadId: "thr_1",
        params: null,
        revealMessage: vi.fn(async () => "revealed" as const),
      },
      {
        context: { threadId: "thr_1" },
        rpc: {
          listCommentThreads,
          getThreadHandoffSummary: () => ({
            threadCount: 1,
            commentCount: 1,
            codePointSize: 100,
          }),
          getCommentThread: () => ({
            thread,
            comments: [thread.rootComment],
            nextCursor: null,
          }),
          createThread: () => ({
            thread,
            comments: [thread.rootComment],
            nextCursor: null,
          }),
          reply: () => ({
            thread,
            comments: [thread.rootComment],
            nextCursor: null,
          }),
          updateComment: () => ({
            thread,
            comments: [thread.rootComment],
            nextCursor: null,
          }),
          deleteComment: () => ({ deletedThreadId: null, thread: null }),
          setThreadResolved: () => ({
            thread,
            comments: [thread.rootComment],
            nextCursor: null,
          }),
          listOpenAnchors: () => ({ anchors: [], nextCursor: null }),
        },
      },
    );

    firstPage.resolve({ threads: [thread], nextCursor: null });
    expect(await panel.findByText("Make the API explicit.")).not.toBeNull();

    fireEvent.click(panel.getByRole("button", { name: "Resolved" }));
    await vi.waitFor(() => expect(listCommentThreads).toHaveBeenCalledTimes(2));
    expect(panel.queryByText("Make the API explicit.")).toBeNull();

    fireEvent.click(panel.getByRole("button", { name: "All" }));
    await vi.waitFor(() => expect(listCommentThreads).toHaveBeenCalledTimes(3));
    const newestThread = {
      ...thread,
      id: "comment_thread_newest",
      rootComment: {
        ...thread.rootComment,
        id: "comment_newest",
        threadId: "comment_thread_newest",
        body: "Newest response",
      },
    };
    newestPage.resolve({ threads: [newestThread], nextCursor: "newest-cursor" });
    expect(await panel.findByText("Newest response")).not.toBeNull();

    stalePage.resolve({
      threads: [
        {
          ...thread,
          id: "comment_thread_stale",
          rootComment: {
            ...thread.rootComment,
            id: "comment_stale",
            threadId: "comment_thread_stale",
            body: "Stale response",
          },
        },
      ],
      nextCursor: "stale-cursor",
    });
    await vi.waitFor(() =>
      expect(panel.queryByText("Stale response")).toBeNull(),
    );
    expect(panel.getByText("Newest response")).not.toBeNull();
    expect(panel.getByRole("button", { name: "Load more" })).not.toBeNull();
  });
});
