// @vitest-environment jsdom
import { act, cleanup, fireEvent } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { PluginThreadPanelProps } from "@get-bb/plugin-sdk/app";
import {
  loadPluginApp,
  mountPluginContentScripts,
  renderSlot,
} from "@get-bb/plugin-sdk/testing/app";
import {
  installTimelineCommentsController,
  requestTimelineCommentHandoff,
} from "./bridge.js";
import type { timelineCommentsRpcContract } from "./server.js";

afterEach(() => {
  cleanup();
  document.body.replaceChildren();
});

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
        icon: "ChatFeedback",
      },
    ]);
    expect(app.messageActions[0]).not.toHaveProperty("placements");
    expect(app.threadPanelActions).toMatchObject([
      {
        id: "comments",
        title: "Comments",
        icon: "ChatFeedback",
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

    const message = {
      id: "msg_1",
      threadId: "thr_1",
      role: "assistant" as const,
      text: "source",
      sourceSeqEnd: 1,
    };
    const openPanel = vi.fn(() => true);
    await app.messageActions[0]!.run({
      threadId: "thr_1",
      message,
      openPanel,
    });
    expect(openPanel).toHaveBeenCalledWith({
      actionId: "comments",
      title: "Comments",
    });

    const beginComment = vi.fn();
    const uninstallController = installTimelineCommentsController({
      beginComment,
      focusThread: vi.fn(async () => false),
      registerThreadWindow: vi.fn(() => () => {}),
      refreshAnchors: vi.fn(),
    });
    await app.messageActions[0]!.run({
      threadId: "thr_1",
      message,
      selectedText: "source",
      openPanel,
    });
    expect(beginComment).toHaveBeenCalledWith(
      expect.objectContaining({ selectedText: "source" }),
    );
    uninstallController();
  });

  it("adds open comments to the draft from the thread composer action", async () => {
    document.body.innerHTML = `
      <div data-split-pane-id="pane_other" data-focused="false">
        <div id="other-window" data-thread-window></div>
      </div>
      <div data-split-pane-id="pane_focused" data-focused="true">
        <div id="focused-window" data-thread-window></div>
      </div>
    `;
    const registerThreadWindow = vi.fn(() => () => {});
    const uninstallController = installTimelineCommentsController({
      beginComment: vi.fn(),
      focusThread: vi.fn(async () => false),
      registerThreadWindow,
      refreshAnchors: vi.fn(),
    });
    const app = await loadPluginApp(() => import("./app.js"));
    const bridge = renderSlot(
      app.composerCustomizations[0]!.banners![0]!,
      {},
      {
        context: { threadId: "thr_1" },
        composer: { scope: { kind: "thread", threadId: "thr_1" } },
        rpc: { getThreadHandoffSummary: vi.fn() },
      },
    );
    document.querySelector("#focused-window")!.append(bridge.container);
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

    expect(
      action.container.querySelector('[data-icon="ChatFeedback"]'),
    ).not.toBeNull();

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
    expect(registerThreadWindow).toHaveBeenCalledWith(
      "thr_1",
      document.querySelector("#focused-window"),
    );
    uninstallController();
  });

  it("delivers a popover handoff to exactly one visible focused thread instance", async () => {
    document.body.innerHTML = `
      <div data-split-pane-id="pane_other" data-focused="false">
        <div id="other-window" data-thread-window></div>
      </div>
      <div data-split-pane-id="pane_focused" data-focused="true">
        <div id="focused-window" data-thread-window></div>
      </div>
    `;
    const app = await loadPluginApp(() => import("./app.js"));
    const bridge = app.composerCustomizations[0]!.banners![0]!;
    const otherSummary = vi.fn(() => ({
      threadCount: 1,
      commentCount: 1,
      codePointSize: 100,
    }));
    const focusedSummary = vi.fn(() => ({
      threadCount: 1,
      commentCount: 2,
      codePointSize: 100,
    }));
    const other = renderSlot(bridge, {}, {
      context: { threadId: "thr_initial_other" },
      composer: { scope: { kind: "thread", threadId: "thr_initial_other" } },
      rpc: { getThreadHandoffSummary: otherSummary },
    });
    const focused = renderSlot(bridge, {}, {
      context: { threadId: "thr_initial_focused" },
      composer: {
        scope: { kind: "thread", threadId: "thr_initial_focused" },
      },
      rpc: { getThreadHandoffSummary: focusedSummary },
    });
    document.querySelector("#other-window")!.append(other.container);
    document.querySelector("#focused-window")!.append(focused.container);
    await other.behavior.setComposerScope({
      kind: "thread",
      threadId: "thr_1",
    });
    await focused.behavior.setComposerScope({
      kind: "thread",
      threadId: "thr_1",
    });

    await expect(requestTimelineCommentHandoff("thr_1")).resolves.toBe(true);
    await vi.waitFor(() => expect(focusedSummary).toHaveBeenCalledTimes(1));
    expect(otherSummary).not.toHaveBeenCalled();

    document
      .querySelector("[data-split-pane-id='pane_focused']")!
      .setAttribute("aria-hidden", "true");
    await expect(requestTimelineCommentHandoff("thr_1")).resolves.toBe(true);
    await vi.waitFor(() => expect(otherSummary).toHaveBeenCalledTimes(1));
    expect(focusedSummary).toHaveBeenCalledTimes(1);
    expect(focused.inspection.composer.mentions).toHaveLength(1);

    document
      .querySelector("[data-split-pane-id='pane_other']")!
      .setAttribute("aria-hidden", "true");
    await expect(requestTimelineCommentHandoff("thr_1")).resolves.toBe(false);
    expect(otherSummary).toHaveBeenCalledTimes(1);
    expect(focusedSummary).toHaveBeenCalledTimes(1);
  });

  it("keeps handoff unacknowledged on failure, empty state, or scope teardown", async () => {
    document.body.innerHTML = `
      <div data-split-pane-id="pane" data-focused="true">
        <div id="thread-window" data-thread-window></div>
      </div>
    `;
    const staleSummary = deferred<{
      threadCount: number;
      commentCount: number;
      codePointSize: number;
    }>();
    const getThreadHandoffSummary = vi
      .fn()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce({
        threadCount: 0,
        commentCount: 0,
        codePointSize: 0,
      })
      .mockReturnValueOnce(staleSummary.promise);
    const app = await loadPluginApp(() => import("./app.js"));
    const bridge = app.composerCustomizations[0]!.banners![0]!;
    const mounted = renderSlot(bridge, {}, {
      context: { threadId: "thr_1" },
      composer: { scope: { kind: "thread", threadId: "thr_1" } },
      rpc: { getThreadHandoffSummary },
    });
    document.querySelector("#thread-window")!.append(mounted.container);

    await expect(requestTimelineCommentHandoff("thr_1")).resolves.toBe(false);
    await expect(requestTimelineCommentHandoff("thr_1")).resolves.toBe(false);
    const pending = requestTimelineCommentHandoff("thr_1");
    await mounted.behavior.setComposerScope({
      kind: "thread",
      threadId: "thr_2",
    });
    staleSummary.resolve({
      threadCount: 1,
      commentCount: 1,
      codePointSize: 100,
    });

    await expect(pending).resolves.toBe(false);
    expect(mounted.inspection.composer.mentions).toHaveLength(0);
    expect(getThreadHandoffSummary).toHaveBeenCalledTimes(3);
  });

  it("keeps a handoff valid while the same composer draft changes", async () => {
    document.body.innerHTML = `
      <div data-split-pane-id="pane" data-focused="true">
        <div id="thread-window" data-thread-window></div>
      </div>
    `;
    const summary = deferred<{
      threadCount: number;
      commentCount: number;
      codePointSize: number;
    }>();
    const app = await loadPluginApp(() => import("./app.js"));
    const bridge = app.composerCustomizations[0]!.banners![0]!;
    const mounted = renderSlot(bridge, {}, {
      context: { threadId: "thr_1" },
      composer: {
        text: "Initial draft",
        scope: { kind: "thread", threadId: "thr_1" },
      },
      rpc: { getThreadHandoffSummary: () => summary.promise },
    });
    document.querySelector("#thread-window")!.append(mounted.container);

    const pending = requestTimelineCommentHandoff("thr_1");
    await mounted.behavior.setComposerText("Edited during handoff");
    summary.resolve({
      threadCount: 1,
      commentCount: 1,
      codePointSize: 100,
    });

    await expect(pending).resolves.toBe(true);
    expect(mounted.inspection.composer.mentions).toHaveLength(1);
    expect(mounted.inspection.composer.text).toContain("Edited during handoff");
  });

  it("reports when the thread has no open comments to add", async () => {
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
            threadCount: 0,
            commentCount: 0,
            codePointSize: 0,
          }),
        },
      },
    );

    fireEvent.click(
      action.getByRole("button", { name: "Add comments to chat" }),
    );

    expect((await action.findByRole("status")).textContent).toBe(
      "No open comments",
    );
    expect(action.inspection.composer.mentions).toHaveLength(0);
    expect(action.inspection.composer.text).toBe("Keep this draft");
    expect(
      (
        action.getByRole("button", {
          name: "Add comments to chat",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(false);
  });

  it("binds the persistent bridge to its containing thread window", async () => {
    document.body.innerHTML = `
      <div data-split-pane-id="pane_main" data-focused="true">
        <div id="main-window" data-thread-window></div>
      </div>
      <div id="embedded-window" data-thread-window>
      </div>
    `;
    const registerThreadWindow = vi.fn(() => () => {});
    const uninstallController = installTimelineCommentsController({
      beginComment: vi.fn(),
      focusThread: vi.fn(async () => false),
      registerThreadWindow,
      refreshAnchors: vi.fn(),
    });
    const app = await loadPluginApp(() => import("./app.js"));
    const bridge = renderSlot(
      app.composerCustomizations[0]!.banners![0]!,
      {},
      {
        context: { threadId: "thr_initial" },
        composer: {
          scope: { kind: "thread", threadId: "thr_initial" },
        },
      },
    );
    document.querySelector("#embedded-window")!.append(bridge.container);
    registerThreadWindow.mockClear();

    await bridge.behavior.setComposerScope({
      kind: "thread",
      threadId: "thr_embedded",
    });

    expect(registerThreadWindow).toHaveBeenCalledWith(
      "thr_embedded",
      document.querySelector("#embedded-window"),
    );
    expect(registerThreadWindow).not.toHaveBeenCalledWith(
      "thr_embedded",
      document.querySelector("#main-window"),
    );
    uninstallController();
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

  it("does not add a handoff from a composer scope that changed in flight", async () => {
    const staleSummary = deferred<{
      threadCount: number;
      commentCount: number;
      codePointSize: number;
    }>();
    const getThreadHandoffSummary = vi
      .fn()
      .mockReturnValueOnce(staleSummary.promise)
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
    await vi.waitFor(() =>
      expect(getThreadHandoffSummary).toHaveBeenCalledWith({
        bbThreadId: "thr_1",
      }),
    );
    await action.behavior.setComposerScope({
      kind: "thread",
      threadId: "thr_2",
    });
    await act(async () => {
      staleSummary.resolve({
        threadCount: 1,
        commentCount: 1,
        codePointSize: 100,
      });
      await staleSummary.promise;
    });
    expect(
      (
        action.getByRole("button", {
          name: "Add comments to chat",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(false);
    expect(action.inspection.composer.mentions).toHaveLength(0);
    expect(action.queryByRole("alert")).toBeNull();

    fireEvent.click(
      action.getByRole("button", { name: "Add comments to chat" }),
    );
    await vi.waitFor(() =>
      expect(action.inspection.composer.mentions).toHaveLength(1),
    );
    expect(action.inspection.composer.mentions[0]?.id).toBe("thr_2");
    expect(getThreadHandoffSummary).toHaveBeenLastCalledWith({
      bbThreadId: "thr_2",
    });

    await action.behavior.setComposerScope({
      kind: "new-thread",
      projectId: null,
    });
    expect(action.queryByRole("button", { name: "Add comments to chat" })).toBeNull();
    await action.behavior.setComposerScope({
      kind: "thread",
      threadId: "thr_2",
    });
    expect(
      action.getByRole("button", { name: "Add comments to chat" }),
    ).not.toBeNull();
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

  it("uses panel rows only to focus the anchored thread popover", async () => {
    const app = await loadPluginApp(() => import("./app.js"));
    const focusThread = vi.fn(async () => true);
    const uninstallController = installTimelineCommentsController({
      beginComment: vi.fn(),
      focusThread,
      registerThreadWindow: vi.fn(() => () => {}),
      refreshAnchors: vi.fn(),
    });
    const panel = renderSlot<
      PluginThreadPanelProps,
      typeof timelineCommentsRpcContract
    >(
      app.threadPanelActions[0]!,
      { threadId: "thr_1", params: null },
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
      expect(focusThread).toHaveBeenCalledWith(thread),
    );
    expect(row.closest("article")?.dataset.active).toBe("true");
    expect(
      panel.queryByRole("button", { name: "Comment actions" }),
    ).toBeNull();
    expect(panel.inspection.navigateCalls).toEqual([]);
    uninstallController();
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
