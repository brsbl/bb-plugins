import { describe, expect, it, vi } from "vitest";
import {
  createFakePluginHost,
  type FakePluginHost,
} from "@bb/plugin-sdk/testing";
import { z } from "zod";
import plugin, {
  commentBodySchema,
  commentThreadDetailSchema,
  renderedTextSelectorSchema,
} from "./server.js";

const threadPageSchema = z.object({
  threads: z.array(commentThreadDetailSchema.shape.thread),
  nextCursor: z.string().nullable(),
});

async function loadPlugin(): Promise<FakePluginHost> {
  const host = createFakePluginHost({ pluginId: "timeline-comments" });
  await plugin(host.bb);
  return host;
}

function createInput(
  body: string,
  overrides: { bbThreadId?: string; messageId?: string; exact?: string } = {},
) {
  const bbThreadId = overrides.bbThreadId ?? "thr_1";
  const exact = overrides.exact ?? "stable";
  return {
    bbThreadId,
    message: {
      id: overrides.messageId ?? "msg_1",
      threadId: bbThreadId,
      role: "assistant" as const,
      text: exact,
      sourceSeqEnd: 4,
    },
    selector: {
      version: 1 as const,
      coordinateSpace: "rendered-text-utf16" as const,
      start: 0,
      end: exact.length,
      exact,
      prefix: "",
      suffix: "",
      rects: [{ x: 10, y: 20, width: 40, height: 18 }],
    },
    body,
  };
}

async function createComment(
  host: FakePluginHost,
  body: string,
  overrides?: Parameters<typeof createInput>[1],
) {
  return commentThreadDetailSchema.parse(
    await host.harness.callRpc("createThread", createInput(body, overrides)),
  );
}

describe("timeline comments backend", () => {
  it("enforces foreign keys and creates a scoped root thread before publishing", async () => {
    const host = await loadPlugin();
    const db = host.bb.storage.database();
    expect(db.pragma("foreign_keys", { simple: true })).toBe(1);

    const created = await createComment(host, "Make the contract explicit.");
    expect(created.thread).toMatchObject({
      bbThreadId: "thr_1",
      messageId: "msg_1",
      messageRole: "assistant",
      replyCount: 0,
      resolvedAt: null,
      selector: { exact: "stable", start: 0, end: 6 },
      rootComment: { body: "Make the contract explicit.", version: 1 },
    });
    expect(created.comments).toHaveLength(1);
    expect(host.harness.realtimeSignals).toEqual([
      {
        channel: "comments-changed",
        payload: {
          bbThreadId: "thr_1",
          commentThreadId: created.thread.id,
        },
      },
    ]);

    await expect(
      host.harness.callRpc("createThread", {
        ...createInput("Wrong scope"),
        message: { ...createInput("Wrong scope").message, threadId: "thr_2" },
      }),
    ).rejects.toThrow("does not belong");
  });

  it("validates required bodies, Unicode length, selectors, and strict inputs", async () => {
    const host = await loadPlugin();
    expect(() => commentBodySchema.parse("   ")).toThrow(
      "Comment body is required",
    );
    expect(() => commentBodySchema.parse("😀".repeat(10_001))).toThrow(
      "10,000 Unicode code points",
    );
    expect(() =>
      renderedTextSelectorSchema.parse({
        ...createInput("Valid body").selector,
        end: 2,
      }),
    ).toThrow("UTF-16");
    await expect(
      host.harness.callRpc("listCommentThreads", {
        bbThreadId: "thr_1",
        filter: "open",
        unexpected: true,
      }),
    ).rejects.toThrow("rpc input validation failed");
  });

  it("persists reply, edit, resolve, reopen, reply deletion, and root cascade with optimistic versions", async () => {
    const host = await loadPlugin();
    const created = await createComment(host, "Root");
    const replied = commentThreadDetailSchema.parse(
      await host.harness.callRpc("reply", {
        bbThreadId: "thr_1",
        commentThreadId: created.thread.id,
        body: "Reply",
      }),
    );
    const reply = replied.comments.find(
      (comment) => comment.parentId !== null,
    )!;
    expect(replied.thread.replyCount).toBe(1);

    const edited = commentThreadDetailSchema.parse(
      await host.harness.callRpc("updateComment", {
        bbThreadId: "thr_1",
        commentId: reply.id,
        expectedVersion: reply.version,
        body: "Edited reply",
      }),
    );
    expect(edited.comments.at(-1)?.body).toBe("Edited reply");
    await expect(
      host.harness.callRpc("updateComment", {
        bbThreadId: "thr_1",
        commentId: reply.id,
        expectedVersion: reply.version,
        body: "Stale edit",
      }),
    ).rejects.toThrow("changed");

    const resolved = commentThreadDetailSchema.parse(
      await host.harness.callRpc("setThreadResolved", {
        bbThreadId: "thr_1",
        commentThreadId: created.thread.id,
        expectedVersion: edited.thread.version,
        resolved: true,
      }),
    );
    expect(resolved.thread.resolvedAt).not.toBeNull();
    await expect(
      host.harness.callRpc("reply", {
        bbThreadId: "thr_1",
        commentThreadId: created.thread.id,
        body: "Blocked",
      }),
    ).rejects.toThrow("Resolved");
    const reopened = commentThreadDetailSchema.parse(
      await host.harness.callRpc("setThreadResolved", {
        bbThreadId: "thr_1",
        commentThreadId: created.thread.id,
        expectedVersion: resolved.thread.version,
        resolved: false,
      }),
    );

    const editedReply = reopened.comments.find(
      (comment) => comment.parentId !== null,
    )!;
    const afterReplyDelete = await host.harness.callRpc("deleteComment", {
      bbThreadId: "thr_1",
      commentId: editedReply.id,
      expectedVersion: editedReply.version,
    });
    expect(afterReplyDelete).toMatchObject({
      deletedThreadId: null,
      thread: { thread: { replyCount: 0 } },
    });

    const latest = commentThreadDetailSchema.parse(
      await host.harness.callRpc("getCommentThread", {
        bbThreadId: "thr_1",
        commentThreadId: created.thread.id,
      }),
    );
    await host.harness.callRpc("deleteComment", {
      bbThreadId: "thr_1",
      commentId: latest.thread.rootComment.id,
      expectedVersion: latest.thread.rootComment.version,
    });
    const db = host.bb.storage.database();
    expect(
      db.prepare("SELECT COUNT(*) AS count FROM comment_threads").get(),
    ).toEqual({ count: 0 });
    expect(db.prepare("SELECT COUNT(*) AS count FROM comments").get()).toEqual({
      count: 0,
    });
  });

  it("keeps root and reply pagination independent and cursor-bound", async () => {
    vi.spyOn(Date, "now").mockImplementation(() => 1_000);
    const host = await loadPlugin();
    for (let index = 0; index < 51; index += 1) {
      await createComment(host, `Root ${index}`, {
        messageId: `msg_${index}`,
      });
    }
    const firstRoots = threadPageSchema.parse(
      await host.harness.callRpc("listCommentThreads", {
        bbThreadId: "thr_1",
        filter: "open",
      }),
    );
    expect(firstRoots.threads).toHaveLength(50);
    expect(firstRoots.nextCursor).not.toBeNull();
    const secondRoots = threadPageSchema.parse(
      await host.harness.callRpc("listCommentThreads", {
        bbThreadId: "thr_1",
        filter: "open",
        cursor: firstRoots.nextCursor ?? undefined,
      }),
    );
    expect(secondRoots.threads).toHaveLength(1);
    await expect(
      host.harness.callRpc("listCommentThreads", {
        bbThreadId: "thr_other",
        filter: "open",
        cursor: firstRoots.nextCursor,
      }),
    ).rejects.toThrow("does not match");

    const target = firstRoots.threads[0]!;
    for (let index = 0; index < 100; index += 1) {
      await host.harness.callRpc("reply", {
        bbThreadId: "thr_1",
        commentThreadId: target.id,
        body: `Reply ${index}`,
      });
    }
    const firstComments = commentThreadDetailSchema.parse(
      await host.harness.callRpc("getCommentThread", {
        bbThreadId: "thr_1",
        commentThreadId: target.id,
      }),
    );
    expect(firstComments.comments).toHaveLength(100);
    expect(firstComments.nextCursor).not.toBeNull();
    const secondComments = commentThreadDetailSchema.parse(
      await host.harness.callRpc("getCommentThread", {
        bbThreadId: "thr_1",
        commentThreadId: target.id,
        cursor: firstComments.nextCursor ?? undefined,
      }),
    );
    expect(secondComments.comments).toHaveLength(1);
  });

  it("serializes every currently open comment for mention resolution and omits resolved threads", async () => {
    const host = await loadPlugin();
    const first = await createComment(host, "First root", {
      exact: "first source",
      messageId: "msg_first",
    });
    const second = await createComment(host, "Second root", {
      exact: "second source",
      messageId: "msg_second",
    });
    await host.harness.callRpc("reply", {
      bbThreadId: "thr_1",
      commentThreadId: first.thread.id,
      body: "First reply",
    });
    const summary = await host.harness.callRpc("getThreadHandoffSummary", {
      bbThreadId: "thr_1",
    });
    expect(summary).toMatchObject({ threadCount: 2, commentCount: 3 });

    const provider = host.harness.registrations.mentionProviders[0]!;
    const resolved = await provider.resolve("thr_1");
    expect(resolved.context).toContain("first source");
    expect(resolved.context).toContain("First reply");
    expect(resolved.context).toContain("second source");

    await host.harness.callRpc("setThreadResolved", {
      bbThreadId: "thr_1",
      commentThreadId: second.thread.id,
      expectedVersion: second.thread.version,
      resolved: true,
    });
    const refreshed = await provider.resolve("thr_1");
    expect(refreshed.context).not.toContain("second source");
  });

  it("rejects bulk handoff before insertion and at mention resolution above 64k code points", async () => {
    const host = await loadPlugin();
    const body = "x".repeat(10_000);
    const created = await createComment(host, body);
    for (let index = 0; index < 6; index += 1) {
      await host.harness.callRpc("reply", {
        bbThreadId: "thr_1",
        commentThreadId: created.thread.id,
        body,
      });
    }
    await expect(
      host.harness.callRpc("getThreadHandoffSummary", { bbThreadId: "thr_1" }),
    ).rejects.toThrow("64,000-code-point handoff limit");
    expect(() =>
      host.harness.registrations.mentionProviders[0]!.resolve("thr_1"),
    ).toThrow("64,000-code-point handoff limit");
  });

  it("exposes bounded read-only CLI discovery for agents", async () => {
    const host = await loadPlugin();
    const created = await createComment(host, "Read me");
    const listed = await host.harness.runCli(["list", "--json"], {
      threadId: "thr_1",
    });
    expect(listed.exitCode).toBe(0);
    expect(JSON.parse(listed.stdout ?? "").threads).toHaveLength(1);
    const fetched = await host.harness.runCli(
      ["get", created.thread.id, "--json"],
      { threadId: "thr_1" },
    );
    expect(fetched.exitCode).toBe(0);
    expect(JSON.parse(fetched.stdout ?? "").comments[0].body).toBe("Read me");
  });
});
