import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createFakePluginHost,
  makeThreadResponse,
  type FakePluginHost,
} from "@bb/plugin-sdk/testing";
import { z } from "zod";
import plugin, {
  commentBodySchema,
  commentThreadDetailSchema,
  renderedTextSelectorSchema,
} from "./server.js";

afterEach(() => vi.restoreAllMocks());

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
      expectedThreadVersion: reopened.thread.version,
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
      expectedThreadVersion: latest.thread.version,
    });
    const db = host.bb.storage.database();
    expect(
      db.prepare("SELECT COUNT(*) AS count FROM comment_threads").get(),
    ).toEqual({ count: 0 });
    expect(db.prepare("SELECT COUNT(*) AS count FROM comments").get()).toEqual({
      count: 0,
    });
  });

  it("rejects a stale root deletion after a concurrent reply changes the thread", async () => {
    const host = await loadPlugin();
    const created = await createComment(host, "Root");
    const replied = commentThreadDetailSchema.parse(
      await host.harness.callRpc("reply", {
        bbThreadId: "thr_1",
        commentThreadId: created.thread.id,
        body: "Concurrent reply",
      }),
    );

    await expect(
      host.harness.callRpc("deleteComment", {
        bbThreadId: "thr_1",
        commentId: created.thread.rootComment.id,
        expectedVersion: created.thread.rootComment.version,
        expectedThreadVersion: created.thread.version,
      }),
    ).rejects.toThrow("Comment thread changed");

    const retained = commentThreadDetailSchema.parse(
      await host.harness.callRpc("getCommentThread", {
        bbThreadId: "thr_1",
        commentThreadId: created.thread.id,
      }),
    );
    expect(retained.comments.map((comment) => comment.body)).toEqual([
      "Root",
      "Concurrent reply",
    ]);

    await host.harness.callRpc("deleteComment", {
      bbThreadId: "thr_1",
      commentId: retained.thread.rootComment.id,
      expectedVersion: retained.thread.rootComment.version,
      expectedThreadVersion: replied.thread.version,
    });
    await expect(
      host.harness.callRpc("getCommentThread", {
        bbThreadId: "thr_1",
        commentThreadId: created.thread.id,
      }),
    ).rejects.toThrow("not found");
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
    expect(firstComments.comments[0]?.parentId).toBeNull();
    expect(
      firstComments.comments.slice(1).every(({ parentId }) => parentId !== null),
    ).toBe(true);
    expect(firstComments.nextCursor).not.toBeNull();
    const secondComments = commentThreadDetailSchema.parse(
      await host.harness.callRpc("getCommentThread", {
        bbThreadId: "thr_1",
        commentThreadId: target.id,
        cursor: firstComments.nextCursor ?? undefined,
      }),
    );
    expect(secondComments.comments).toHaveLength(1);
    expect(secondComments.comments[0]?.parentId).not.toBeNull();
    const allComments = [
      ...firstComments.comments,
      ...secondComments.comments,
    ];
    expect(allComments).toHaveLength(101);
    expect(new Set(allComments.map(({ id }) => id)).size).toBe(101);
    expect(
      allComments.filter(({ parentId }) => parentId === null),
    ).toHaveLength(1);

    const firstCliPage = await host.harness.runCli(
      ["get", target.id, "--limit", "1", "--json"],
      { threadId: "thr_1" },
    );
    const firstCliComment = JSON.parse(firstCliPage.stdout ?? "").comments[0];
    expect(firstCliComment.parentId).toBeNull();
    const firstHumanCliPage = await host.harness.runCli(
      ["get", target.id, "--limit", "1"],
      { threadId: "thr_1" },
    );
    expect(firstHumanCliPage.stdout).toContain(
      `Comment: ${target.rootComment.body}`,
    );
    const secondCliPage = await host.harness.runCli(
      [
        "get",
        target.id,
        "--limit",
        "1",
        "--cursor",
        JSON.parse(firstCliPage.stdout ?? "").nextCursor,
        "--json",
      ],
      { threadId: "thr_1" },
    );
    const secondCliResult = JSON.parse(secondCliPage.stdout ?? "");
    expect(secondCliResult.comments[0].parentId).not.toBeNull();
    const secondHumanCliPage = await host.harness.runCli(
      [
        "get",
        target.id,
        "--limit",
        "1",
        "--cursor",
        JSON.parse(firstCliPage.stdout ?? "").nextCursor,
      ],
      { threadId: "thr_1" },
    );
    expect(secondHumanCliPage.stdout).toContain(
      `Reply: ${secondCliResult.comments[0].body}`,
    );

    const context = (
      await host.harness.registrations.mentionProviders[0]!.resolve("thr_1")
    ).context;
    expect(context.indexOf(`Comment: ${target.rootComment.body}`)).toBeLessThan(
      context.indexOf("Reply: "),
    );
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
    const db = host.bb.storage.database();
    const prepare = vi.spyOn(db, "prepare");
    prepare.mockClear();
    await host.harness.callRpc("getThreadHandoffSummary", {
      bbThreadId: "thr_1",
    });
    expect(
      prepare.mock.calls.filter(([sql]) =>
        String(sql).includes("JOIN comments c ON c.thread_id = t.id"),
      ),
    ).toHaveLength(1);
    prepare.mockClear();
    provider.resolve("thr_1");
    expect(
      prepare.mock.calls.filter(([sql]) =>
        String(sql).includes("JOIN comments c ON c.thread_id = t.id"),
      ),
    ).toHaveLength(1);
    prepare.mockRestore();

    expect(
      provider.search({
        trigger: "@",
        query: "comments",
        projectId: "proj_1",
        threadId: "thr_1",
      }),
    ).toMatchObject([{ title: "3 comments from 2 open threads" }]);
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
    expect(
      provider.search({
        trigger: "@",
        query: "comments",
        projectId: "proj_1",
        threadId: "thr_1",
      }),
    ).toMatchObject([{ title: "2 comments from 1 open threads" }]);
    const refreshed = await provider.resolve("thr_1");
    expect(refreshed.context).not.toContain("second source");
  });

  it("removes plugin-owned comments when their BB thread is deleted", async () => {
    const host = await loadPlugin();
    await createComment(host, "Delete with the thread");
    await createComment(host, "Keep another thread", {
      bbThreadId: "thr_2",
    });

    await host.harness.emitThreadEvent("thread.deleted", {
      thread: makeThreadResponse({ id: "thr_1" }),
    });

    const db = host.bb.storage.database();
    expect(
      db
        .prepare(
          "SELECT bb_thread_id AS bbThreadId, COUNT(*) AS count FROM comment_threads GROUP BY bb_thread_id",
        )
        .all(),
    ).toEqual([{ bbThreadId: "thr_2", count: 1 }]);
    expect(db.prepare("SELECT COUNT(*) AS count FROM comments").get()).toEqual({
      count: 1,
    });
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
    host.bb.storage
      .database()
      .prepare(
        `INSERT INTO comments (
           id, thread_id, parent_id, body, version, created_at, updated_at
         ) VALUES (?, ?, ?, ?, 1, ?, ?)`,
      )
      .run(
        "invalid_after_limit",
        created.thread.id,
        created.thread.rootComment.id,
        Buffer.from([1]),
        9_999_999_999_999,
        9_999_999_999_999,
      );
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
    await createComment(host, "Read me next", { messageId: "msg_2" });
    const listed = await host.harness.runCli(
      ["list", "--limit", "1", "--json"],
      {
        threadId: "thr_1",
      },
    );
    expect(listed.exitCode).toBe(0);
    const firstListPage = JSON.parse(listed.stdout ?? "");
    expect(firstListPage.threads).toHaveLength(1);
    expect(firstListPage.nextCursor).toEqual(expect.any(String));
    const nextListed = await host.harness.runCli(
      ["list", "--limit", "1", "--cursor", firstListPage.nextCursor, "--json"],
      { threadId: "thr_1" },
    );
    expect(JSON.parse(nextListed.stdout ?? "").threads).toHaveLength(1);

    await host.harness.callRpc("reply", {
      bbThreadId: "thr_1",
      commentThreadId: created.thread.id,
      body: "Reply",
    });
    const fetched = await host.harness.runCli(
      ["get", created.thread.id, "--limit", "1", "--json"],
      { threadId: "thr_1" },
    );
    expect(fetched.exitCode).toBe(0);
    const firstCommentPage = JSON.parse(fetched.stdout ?? "");
    expect(firstCommentPage.comments).toHaveLength(1);
    expect(firstCommentPage.nextCursor).toEqual(expect.any(String));
    const nextFetched = await host.harness.runCli(
      [
        "get",
        created.thread.id,
        "--limit",
        "1",
        "--cursor",
        firstCommentPage.nextCursor,
        "--json",
      ],
      { threadId: "thr_1" },
    );
    const secondCommentPage = JSON.parse(nextFetched.stdout ?? "");
    expect(
      [
        firstCommentPage.comments[0].body,
        secondCommentPage.comments[0].body,
      ].sort(),
    ).toEqual(["Read me", "Reply"]);

    const humanList = await host.harness.runCli(["list", "--limit", "1"], {
      threadId: "thr_1",
    });
    expect(humanList.stdout).toContain(
      "More results available. Continue with --cursor ",
    );
    const invalidLimit = await host.harness.runCli(
      ["get", created.thread.id, "--limit", "101"],
      { threadId: "thr_1" },
    );
    expect(invalidLimit).toMatchObject({ exitCode: 1 });
    expect(invalidLimit.stderr).toContain("integer from 1 to 100");
  });

  it("rejects unknown CLI commands, options, arguments, and missing option values", async () => {
    const host = await loadPlugin();
    const cases: Array<{ argv: string[]; message: string }> = [
      { argv: [], message: "A command is required" },
      { argv: ["ls"], message: "Unknown comments command" },
      { argv: ["list", "extra"], message: "Unexpected argument for list" },
      { argv: ["list", "--wat"], message: "Unknown option for list" },
      { argv: ["get", "--json"], message: "comment-thread-id" },
      {
        argv: ["get", "comment_1", "--state", "open"],
        message: "Unknown option for get",
      },
      { argv: ["list", "--thread"], message: "--thread requires a value" },
      {
        argv: ["list", "--thread", "--json"],
        message: "--thread requires a value",
      },
      { argv: ["list", "--cursor"], message: "--cursor requires a value" },
      {
        argv: ["list", "--cursor", "--json"],
        message: "--cursor requires a value",
      },
      { argv: ["list", "--limit"], message: "--limit requires a value" },
      {
        argv: ["list", "--limit", "--json"],
        message: "--limit requires a value",
      },
      { argv: ["list", "--state"], message: "--state requires a value" },
      {
        argv: ["list", "--state", "--json"],
        message: "--state requires a value",
      },
    ];

    for (const { argv, message } of cases) {
      const result = await host.harness.runCli(argv, { threadId: "thr_1" });
      expect(result.exitCode, argv.join(" ")).toBe(1);
      expect(result.stderr, argv.join(" ")).toContain(message);
    }
  });

  it("accepts an escaped generated comment-thread ID that begins with dashes", async () => {
    const host = await loadPlugin();
    const created = await createComment(host, "Escaped ID");
    const escapedId = "--generated-comment-thread";
    const db = host.bb.storage.database();
    db.transaction(() => {
      db.prepare(
        `INSERT INTO comment_threads (
           id, bb_thread_id, message_id, message_role,
           selector_version, selector_start, selector_end, selector_exact,
           selector_prefix, selector_suffix, version, created_at, updated_at,
           resolved_at
         )
         SELECT
           ?, bb_thread_id, message_id, message_role,
           selector_version, selector_start, selector_end, selector_exact,
           selector_prefix, selector_suffix, version, created_at, updated_at,
           resolved_at
         FROM comment_threads
         WHERE id = ?`,
      ).run(escapedId, created.thread.id);
      db.prepare("UPDATE comments SET thread_id = ? WHERE thread_id = ?").run(
        escapedId,
        created.thread.id,
      );
      db.prepare("DELETE FROM comment_threads WHERE id = ?").run(
        created.thread.id,
      );
    })();

    const fetched = await host.harness.runCli(
      ["get", "--", escapedId, "--json"],
      { threadId: "thr_1" },
    );
    expect(fetched.exitCode).toBe(0);
    expect(JSON.parse(fetched.stdout ?? "")).toMatchObject({
      thread: { id: escapedId },
      comments: [{ body: "Escaped ID" }],
    });

    const unescapedFlag = await host.harness.runCli(["get", "--json"], {
      threadId: "thr_1",
    });
    expect(unescapedFlag.exitCode).toBe(1);
    expect(unescapedFlag.stderr).toContain("comment-thread-id");
  });

  it("keeps Unicode-heavy CLI pages below the host limit and fails clearly for one oversized record", async () => {
    const host = await loadPlugin();
    const body = "😀".repeat(10_000);
    for (let index = 0; index < 30; index += 1) {
      await createComment(host, body, { messageId: `msg_${index}` });
    }

    const listed = await host.harness.runCli(["list", "--json"], {
      threadId: "thr_1",
    });
    expect(listed.exitCode).toBe(0);
    expect(Buffer.byteLength(listed.stdout ?? "", "utf8")).toBeLessThan(
      1_048_576,
    );
    const page = JSON.parse(listed.stdout ?? "");
    expect(page.threads.length).toBeGreaterThan(0);
    expect(page.threads.length).toBeLessThan(30);
    expect(page.nextCursor).toEqual(expect.any(String));

    const oversized = page.threads[0];
    for (let index = 0; index < 24; index += 1) {
      await host.harness.callRpc("reply", {
        bbThreadId: "thr_1",
        commentThreadId: oversized.id,
        body,
      });
    }
    const fetched = await host.harness.runCli(
      ["get", oversized.id, "--json"],
      { threadId: "thr_1" },
    );
    expect(fetched.exitCode).toBe(0);
    expect(Buffer.byteLength(fetched.stdout ?? "", "utf8")).toBeLessThan(
      1_048_576,
    );
    const commentPage = JSON.parse(fetched.stdout ?? "");
    expect(commentPage.comments.length).toBeGreaterThan(0);
    expect(commentPage.comments.length).toBeLessThan(25);
    expect(commentPage.nextCursor).toEqual(expect.any(String));

    const exact = "😀".repeat(240_000);
    host.bb.storage
      .database()
      .prepare(
        `UPDATE comment_threads
         SET selector_start = 0, selector_end = ?, selector_exact = ?
         WHERE id = ?`,
      )
      .run(exact.length, exact, oversized.id);
    const oneRecord = await host.harness.runCli(
      ["list", "--limit", "1", "--json"],
      { threadId: "thr_1" },
    );
    expect(oneRecord.exitCode).toBe(1);
    expect(oneRecord.stderr).toContain(
      "A single comment thread exceeds the CLI output size limit",
    );
  });
});
