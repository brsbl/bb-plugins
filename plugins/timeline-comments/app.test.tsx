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
      { id: "comments", title: "Comments", layout: "flush" },
    ]);
    expect(app.composerCustomizations).toMatchObject([
      {
        id: "timeline-comments",
        scopes: ["thread"],
        actions: [{ id: "open-comments" }],
      },
    ]);
    expect(app.contentScripts.map(({ id }) => id)).toEqual([
      "timeline-comment-anchors",
    ]);
  });

  it("opens the Comments panel from the thread composer action", async () => {
    const app = await loadPluginApp(() => import("./app.js"));
    const action = renderSlot(
      app.composerCustomizations[0]!.actions![0]!,
      {},
      {
        context: { threadId: "thr_1" },
        composer: { scope: { kind: "thread", threadId: "thr_1" } },
        openThreadPanel: () => true,
      },
    );

    fireEvent.click(
      action.getByRole("button", { name: "Open comments" }),
    );

    expect(action.inspection.navigateCalls).toEqual([
      {
        method: "experimental_openThreadPanel",
        options: { actionId: "comments", title: "Comments" },
      },
    ]);
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

  it("adds a fresh bulk mention without replacing the existing draft", async () => {
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
        composer: {
          text: "Keep this draft",
          scope: { kind: "thread", threadId: "thr_1" },
        },
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
    const button = await panel.findByRole("button", {
      name: "Add all to chat",
    });
    fireEvent.click(button);
    await vi.waitFor(() =>
      expect(panel.inspection.composer.mentions).toHaveLength(1),
    );
    expect(panel.inspection.composer.mentions[0]).toEqual({
      provider: "thread-comments",
      id: "thr_1",
      label: "1 comments from 1 open thread",
    });
    expect(panel.inspection.composer.text).toContain("Keep this draft");
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
});
