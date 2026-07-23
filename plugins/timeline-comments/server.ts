import { randomBytes } from "node:crypto";
import { Buffer } from "node:buffer";
import {
  defineRpcContract,
  PLUGIN_CLI_OUTPUT_MAX_BYTES,
  type BbPluginApi,
} from "@bb/plugin-sdk";
import { z } from "zod";
import { COMMENT_BODY_CODE_POINT_LIMIT } from "./comment-body.js";

const ROOT_PAGE_SIZE = 50;
const COMMENT_PAGE_SIZE = 100;
const ANCHOR_PAGE_SIZE = 200;
const HANDOFF_CODE_POINT_LIMIT = 64_000;
const CLI_OUTPUT_BUDGET_BYTES = Math.min(
  900_000,
  PLUGIN_CLI_OUTPUT_MAX_BYTES - 64 * 1_024,
);

const idSchema = z.string().min(1).max(256);
const bodySchema = z
  .string()
  .transform((body) => body.trim())
  .refine((body) => body.length > 0, "Comment body is required")
  .refine(
    (body) => Array.from(body).length <= COMMENT_BODY_CODE_POINT_LIMIT,
    `Comment body must be at most ${COMMENT_BODY_CODE_POINT_LIMIT.toLocaleString("en-US")} Unicode code points`,
  );
export const commentBodySchema = bodySchema;
const utf16ContextSchema = z
  .string()
  .refine((value) => value.length <= 32, "Selector context is too long");
const rectSchema = z
  .object({
    x: z.number().finite(),
    y: z.number().finite(),
    width: z.number().finite().nonnegative(),
    height: z.number().finite().nonnegative(),
  })
  .strict();
const selectorFields = {
  version: z.literal(1),
  coordinateSpace: z.literal("rendered-text-utf16"),
  start: z.number().int().nonnegative(),
  end: z.number().int().positive(),
  exact: z.string().refine((value) => value.trim().length > 0),
  prefix: utf16ContextSchema,
  suffix: utf16ContextSchema,
};

function refineSelectorSpan(
  selector: { start: number; end: number; exact: string },
  context: z.core.$RefinementCtx,
) {
  if (selector.end <= selector.start) {
    context.addIssue({
      code: "custom",
      message: "Selector end must be greater than start",
      path: ["end"],
      input: selector,
    });
  }
  if (selector.end - selector.start !== selector.exact.length) {
    context.addIssue({
      code: "custom",
      message: "Selector offsets must span exact text in UTF-16 units",
      path: ["exact"],
      input: selector,
    });
  }
}

export const renderedTextSelectorSchema = z
  .object({
    ...selectorFields,
    rects: z.array(rectSchema).min(1).max(1_000),
  })
  .strict()
  .superRefine(refineSelectorSpan);

const storedSelectorSchema = z
  .object(selectorFields)
  .strict()
  .superRefine(refineSelectorSpan);
const messageReferenceSchema = z
  .object({
    id: idSchema,
    threadId: idSchema,
    role: z.enum(["user", "assistant"]),
    text: z.string(),
    sourceSeqEnd: z.number().int().nonnegative(),
  })
  .strict();
const commentSchema = z
  .object({
    id: idSchema,
    threadId: idSchema,
    parentId: idSchema.nullable(),
    body: z.string(),
    version: z.number().int().positive(),
    createdAt: z.number().int().nonnegative(),
    updatedAt: z.number().int().nonnegative(),
  })
  .strict();
export const commentThreadSummarySchema = z
  .object({
    id: idSchema,
    bbThreadId: idSchema,
    messageId: idSchema,
    messageRole: z.enum(["user", "assistant"]),
    selector: storedSelectorSchema,
    version: z.number().int().positive(),
    createdAt: z.number().int().nonnegative(),
    updatedAt: z.number().int().nonnegative(),
    resolvedAt: z.number().int().nonnegative().nullable(),
    rootComment: commentSchema,
    replyCount: z.number().int().nonnegative(),
  })
  .strict();
const anchorSchema = commentThreadSummarySchema.omit({ rootComment: true });
export const commentThreadDetailSchema = z
  .object({
    thread: commentThreadSummarySchema,
    comments: z.array(commentSchema),
    nextCursor: z.string().nullable(),
  })
  .strict();
export type TimelineComment = z.infer<typeof commentSchema>;
export type TimelineCommentThreadSummary = z.infer<
  typeof commentThreadSummarySchema
>;
export type TimelineCommentThreadDetail = z.infer<
  typeof commentThreadDetailSchema
>;
const cursorInputSchema = z.string().min(1).max(2_048).optional();
const rootFilterSchema = z.enum(["open", "resolved", "all"]);

export const timelineCommentsRpcContract = defineRpcContract({
  listOpenAnchors: {
    input: z
      .object({
        threadIds: z.array(idSchema).min(1).max(20),
        cursor: cursorInputSchema,
      })
      .strict(),
    output: z
      .object({
        anchors: z.array(anchorSchema),
        nextCursor: z.string().nullable(),
      })
      .strict(),
  },
  listCommentThreads: {
    input: z
      .object({
        bbThreadId: idSchema,
        filter: rootFilterSchema,
        cursor: cursorInputSchema,
      })
      .strict(),
    output: z
      .object({
        threads: z.array(commentThreadSummarySchema),
        nextCursor: z.string().nullable(),
      })
      .strict(),
  },
  getCommentThread: {
    input: z
      .object({
        bbThreadId: idSchema,
        commentThreadId: idSchema,
        cursor: cursorInputSchema,
      })
      .strict(),
    output: commentThreadDetailSchema,
  },
  getThreadHandoffSummary: {
    input: z.object({ bbThreadId: idSchema }).strict(),
    output: z
      .object({
        threadCount: z.number().int().nonnegative(),
        commentCount: z.number().int().nonnegative(),
        codePointSize: z.number().int().nonnegative(),
      })
      .strict(),
  },
  createThread: {
    input: z
      .object({
        bbThreadId: idSchema,
        message: messageReferenceSchema,
        selector: renderedTextSelectorSchema,
        body: bodySchema,
      })
      .strict(),
    output: commentThreadDetailSchema,
  },
  reply: {
    input: z
      .object({
        bbThreadId: idSchema,
        commentThreadId: idSchema,
        body: bodySchema,
      })
      .strict(),
    output: commentThreadDetailSchema,
  },
  updateComment: {
    input: z
      .object({
        bbThreadId: idSchema,
        commentId: idSchema,
        expectedVersion: z.number().int().positive(),
        body: bodySchema,
      })
      .strict(),
    output: commentThreadDetailSchema,
  },
  deleteComment: {
    input: z
      .object({
        bbThreadId: idSchema,
        commentId: idSchema,
        expectedVersion: z.number().int().positive(),
        expectedThreadVersion: z.number().int().positive(),
      })
      .strict(),
    output: z
      .object({
        deletedThreadId: idSchema.nullable(),
        thread: commentThreadDetailSchema.nullable(),
      })
      .strict(),
  },
  setThreadResolved: {
    input: z
      .object({
        bbThreadId: idSchema,
        commentThreadId: idSchema,
        expectedVersion: z.number().int().positive(),
        resolved: z.boolean(),
      })
      .strict(),
    output: commentThreadDetailSchema,
  },
});

type Database = ReturnType<BbPluginApi["storage"]["database"]>;

const threadRowSchema = z.object({
  id: z.string(),
  bbThreadId: z.string(),
  messageId: z.string(),
  messageRole: z.enum(["user", "assistant"]),
  selectorVersion: z.number(),
  selectorStart: z.number(),
  selectorEnd: z.number(),
  selectorExact: z.string(),
  selectorPrefix: z.string(),
  selectorSuffix: z.string(),
  version: z.number(),
  createdAt: z.number(),
  updatedAt: z.number(),
  resolvedAt: z.number().nullable(),
  rootId: z.string(),
  rootBody: z.string(),
  rootVersion: z.number(),
  rootCreatedAt: z.number(),
  rootUpdatedAt: z.number(),
  replyCount: z.number(),
});
type ThreadRow = z.infer<typeof threadRowSchema>;
const commentRowSchema = z.object({
  id: z.string(),
  threadId: z.string(),
  parentId: z.string().nullable(),
  body: z.string(),
  version: z.number(),
  createdAt: z.number(),
  updatedAt: z.number(),
});
type CommentRow = z.infer<typeof commentRowSchema>;

const cursorSchema = z
  .object({
    method: z.enum(["anchors", "threads", "comments"]),
    scope: z.string(),
    filter: z.string(),
    parentRank: z.number().int().min(0).max(1).optional(),
    createdAt: z.number().int().nonnegative(),
    id: z.string(),
  })
  .strict();
type Cursor = z.infer<typeof cursorSchema>;

function encodeCursor(cursor: Cursor): string {
  return Buffer.from(JSON.stringify(cursor), "utf8").toString("base64url");
}

function decodeCursor(
  encoded: string | undefined,
  expected: Pick<Cursor, "method" | "scope" | "filter">,
): Cursor | null {
  if (encoded === undefined) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
  } catch {
    throw new Error("Invalid pagination cursor");
  }
  const cursor = cursorSchema.parse(parsed);
  if (
    cursor.method !== expected.method ||
    cursor.scope !== expected.scope ||
    cursor.filter !== expected.filter
  ) {
    throw new Error("Pagination cursor does not match this query");
  }
  return cursor;
}

function randomId(): string {
  return randomBytes(18).toString("base64url");
}

function mapComment(row: CommentRow): z.infer<typeof commentSchema> {
  return commentSchema.parse(row);
}

function mapThread(row: ThreadRow): z.infer<typeof commentThreadSummarySchema> {
  return commentThreadSummarySchema.parse({
    id: row.id,
    bbThreadId: row.bbThreadId,
    messageId: row.messageId,
    messageRole: row.messageRole,
    selector: {
      version: 1,
      coordinateSpace: "rendered-text-utf16",
      start: row.selectorStart,
      end: row.selectorEnd,
      exact: row.selectorExact,
      prefix: row.selectorPrefix,
      suffix: row.selectorSuffix,
    },
    version: row.version,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    resolvedAt: row.resolvedAt,
    rootComment: {
      id: row.rootId,
      threadId: row.id,
      parentId: null,
      body: row.rootBody,
      version: row.rootVersion,
      createdAt: row.rootCreatedAt,
      updatedAt: row.rootUpdatedAt,
    },
    replyCount: row.replyCount,
  });
}

const THREAD_SELECT = `
  SELECT
    t.id,
    t.bb_thread_id AS bbThreadId,
    t.message_id AS messageId,
    t.message_role AS messageRole,
    t.selector_version AS selectorVersion,
    t.selector_start AS selectorStart,
    t.selector_end AS selectorEnd,
    t.selector_exact AS selectorExact,
    t.selector_prefix AS selectorPrefix,
    t.selector_suffix AS selectorSuffix,
    t.version,
    t.created_at AS createdAt,
    t.updated_at AS updatedAt,
    t.resolved_at AS resolvedAt,
    root.id AS rootId,
    root.body AS rootBody,
    root.version AS rootVersion,
    root.created_at AS rootCreatedAt,
    root.updated_at AS rootUpdatedAt,
    (SELECT COUNT(*) FROM comments replies
      WHERE replies.thread_id = t.id AND replies.parent_id IS NOT NULL) AS replyCount
  FROM comment_threads t
  JOIN comments root ON root.thread_id = t.id AND root.parent_id IS NULL
`;

function getThreadRow(
  db: Database,
  bbThreadId: string,
  commentThreadId: string,
): ThreadRow {
  const row = db
    .prepare(`${THREAD_SELECT} WHERE t.id = ? AND t.bb_thread_id = ?`)
    .get(commentThreadId, bbThreadId);
  if (row === undefined) throw new Error("Comment thread not found");
  return threadRowSchema.parse(row);
}

function getCommentRow(db: Database, commentId: string): CommentRow {
  const row = db
    .prepare(
      `SELECT id, thread_id AS threadId, parent_id AS parentId, body, version,
        created_at AS createdAt, updated_at AS updatedAt
       FROM comments WHERE id = ?`,
    )
    .get(commentId);
  if (row === undefined) throw new Error("Comment not found");
  return commentRowSchema.parse(row);
}

function getCommentThread(
  db: Database,
  input: {
    bbThreadId: string;
    commentThreadId: string;
    cursor?: string;
    limit?: number;
  },
): z.infer<typeof commentThreadDetailSchema> {
  const pageSize = input.limit ?? COMMENT_PAGE_SIZE;
  const thread = mapThread(
    getThreadRow(db, input.bbThreadId, input.commentThreadId),
  );
  const cursor = decodeCursor(input.cursor, {
    method: "comments",
    scope: `${input.bbThreadId}:${input.commentThreadId}`,
    filter: "chronological",
  });
  const cursorParentRank = cursor?.parentRank ?? 1;
  const rows = db
    .prepare(
      `SELECT id, thread_id AS threadId, parent_id AS parentId, body, version,
        created_at AS createdAt, updated_at AS updatedAt
       FROM comments
       WHERE thread_id = ?
         AND (
           ? IS NULL
           OR (CASE WHEN parent_id IS NULL THEN 0 ELSE 1 END) > ?
           OR (
             (CASE WHEN parent_id IS NULL THEN 0 ELSE 1 END) = ?
             AND (created_at > ? OR (created_at = ? AND id > ?))
           )
         )
       ORDER BY
         CASE WHEN parent_id IS NULL THEN 0 ELSE 1 END ASC,
         created_at ASC,
         id ASC
       LIMIT ?`,
    )
    .all(
      input.commentThreadId,
      cursor?.id ?? null,
      cursorParentRank,
      cursorParentRank,
      cursor?.createdAt ?? 0,
      cursor?.createdAt ?? 0,
      cursor?.id ?? "",
      pageSize + 1,
    )
    .map((row) => commentRowSchema.parse(row));
  const hasNext = rows.length > pageSize;
  const page = rows.slice(0, pageSize);
  const last = page.at(-1);
  return commentThreadDetailSchema.parse({
    thread,
    comments: page.map(mapComment),
    nextCursor:
      hasNext && last !== undefined
        ? encodeCursor({
            method: "comments",
            scope: `${input.bbThreadId}:${input.commentThreadId}`,
            filter: "chronological",
            parentRank: last.parentId === null ? 0 : 1,
            createdAt: last.createdAt,
            id: last.id,
          })
        : null,
  });
}

function listCommentThreads(
  db: Database,
  input: {
    bbThreadId: string;
    filter: "open" | "resolved" | "all";
    cursor?: string;
    limit?: number;
  },
): {
  threads: z.infer<typeof commentThreadSummarySchema>[];
  nextCursor: string | null;
} {
  const pageSize = input.limit ?? ROOT_PAGE_SIZE;
  const cursor = decodeCursor(input.cursor, {
    method: "threads",
    scope: input.bbThreadId,
    filter: input.filter,
  });
  const stateSql =
    input.filter === "open"
      ? "AND t.resolved_at IS NULL"
      : input.filter === "resolved"
        ? "AND t.resolved_at IS NOT NULL"
        : "";
  const rows = db
    .prepare(
      `${THREAD_SELECT}
       WHERE t.bb_thread_id = ? ${stateSql}
         AND (? IS NULL OR t.created_at > ? OR (t.created_at = ? AND t.id > ?))
       ORDER BY t.created_at ASC, t.id ASC
       LIMIT ?`,
    )
    .all(
      input.bbThreadId,
      cursor?.id ?? null,
      cursor?.createdAt ?? 0,
      cursor?.createdAt ?? 0,
      cursor?.id ?? "",
      pageSize + 1,
    )
    .map((row) => threadRowSchema.parse(row));
  const hasNext = rows.length > pageSize;
  const page = rows.slice(0, pageSize);
  const last = page.at(-1);
  return {
    threads: page.map(mapThread),
    nextCursor:
      hasNext && last !== undefined
        ? encodeCursor({
            method: "threads",
            scope: input.bbThreadId,
            filter: input.filter,
            createdAt: last.createdAt,
            id: last.id,
          })
        : null,
  };
}

function listOpenAnchors(
  db: Database,
  input: { threadIds: string[]; cursor?: string },
): { anchors: z.infer<typeof anchorSchema>[]; nextCursor: string | null } {
  const threadIds = [...new Set(input.threadIds)].sort();
  const scope = threadIds.join("\u001f");
  const cursor = decodeCursor(input.cursor, {
    method: "anchors",
    scope,
    filter: "open",
  });
  const placeholders = threadIds.map(() => "?").join(", ");
  const rows = db
    .prepare(
      `${THREAD_SELECT}
       WHERE t.bb_thread_id IN (${placeholders}) AND t.resolved_at IS NULL
         AND (? IS NULL OR t.created_at > ? OR (t.created_at = ? AND t.id > ?))
       ORDER BY t.created_at ASC, t.id ASC
       LIMIT ?`,
    )
    .all(
      ...threadIds,
      cursor?.id ?? null,
      cursor?.createdAt ?? 0,
      cursor?.createdAt ?? 0,
      cursor?.id ?? "",
      ANCHOR_PAGE_SIZE + 1,
    )
    .map((row) => threadRowSchema.parse(row));
  const hasNext = rows.length > ANCHOR_PAGE_SIZE;
  const page = rows.slice(0, ANCHOR_PAGE_SIZE);
  const last = page.at(-1);
  return {
    anchors: page.map((row) => {
      const { rootComment: _rootComment, ...anchor } = mapThread(row);
      return anchorSchema.parse(anchor);
    }),
    nextCursor:
      hasNext && last !== undefined
        ? encodeCursor({
            method: "anchors",
            scope,
            filter: "open",
            createdAt: last.createdAt,
            id: last.id,
          })
        : null,
  };
}

interface SerializedHandoff {
  context: string;
  threadCount: number;
  commentCount: number;
  codePointSize: number;
}

const handoffRowSchema = z.object({
  commentThreadId: z.string(),
  selectorExact: z.string(),
  commentId: z.string(),
  parentId: z.string().nullable(),
  body: z.string(),
});

function handoffLimitError(): Error {
  return new Error(
    `Open comments exceed the ${HANDOFF_CODE_POINT_LIMIT.toLocaleString("en-US")}-code-point handoff limit`,
  );
}

function readOpenComments(
  db: Database,
  bbThreadId: string,
  includeContext: boolean,
): SerializedHandoff {
  const rows = db
    .prepare(
      `SELECT
         t.id AS commentThreadId,
         t.selector_exact AS selectorExact,
         c.id AS commentId,
         c.parent_id AS parentId,
         c.body
       FROM comment_threads t
       JOIN comments c ON c.thread_id = t.id
       WHERE t.bb_thread_id = ? AND t.resolved_at IS NULL
       ORDER BY
         t.created_at ASC,
         t.id ASC,
         CASE WHEN c.parent_id IS NULL THEN 0 ELSE 1 END ASC,
         c.created_at ASC,
         c.id ASC`,
    )
    .iterate(bbThreadId);
  const sections: string[] = [];
  let sectionCount = 0;
  let codePointSize = 0;
  let threadCount = 0;
  let commentCount = 0;
  let currentThreadId: string | null = null;

  const addSection = (section: string) => {
    if (sectionCount > 0) codePointSize += 2;
    codePointSize += Array.from(section).length;
    if (codePointSize > HANDOFF_CODE_POINT_LIMIT) throw handoffLimitError();
    sectionCount += 1;
    if (includeContext) sections.push(section);
  };

  for (const rawRow of rows) {
    const row = handoffRowSchema.parse(rawRow);
    if (currentThreadId === null) {
      addSection(`# Open timeline comments for BB thread ${bbThreadId}`);
    }
    if (row.commentThreadId !== currentThreadId) {
      currentThreadId = row.commentThreadId;
      threadCount += 1;
      addSection(`## Source: “${row.selectorExact}”`);
    }
    commentCount += 1;
    addSection(`${row.parentId === null ? "Comment" : "Reply"}: ${row.body}`);
  }

  if (currentThreadId === null) {
    const context = `No open comments remain for BB thread ${bbThreadId}.`;
    return {
      context: includeContext ? context : "",
      threadCount: 0,
      commentCount: 0,
      codePointSize: Array.from(context).length,
    };
  }
  return {
    context: includeContext ? sections.join("\n\n") : "",
    threadCount,
    commentCount,
    codePointSize,
  };
}

function serializeOpenComments(
  db: Database,
  bbThreadId: string,
): SerializedHandoff {
  return readOpenComments(db, bbThreadId, true);
}

function summarizeOpenComments(
  db: Database,
  bbThreadId: string,
): Omit<SerializedHandoff, "context"> {
  const { context: _context, ...summary } = readOpenComments(
    db,
    bbThreadId,
    false,
  );
  return summary;
}

function countOpenComments(
  db: Database,
  bbThreadId: string,
): { threadCount: number; commentCount: number } {
  const row = db
    .prepare(
      `SELECT
         COUNT(DISTINCT t.id) AS threadCount,
         COUNT(c.id) AS commentCount
       FROM comment_threads t
       LEFT JOIN comments c ON c.thread_id = t.id
       WHERE t.bb_thread_id = ? AND t.resolved_at IS NULL`,
    )
    .get(bbThreadId);
  return z
    .object({
      threadCount: z.number().int().nonnegative(),
      commentCount: z.number().int().nonnegative(),
    })
    .parse(row);
}

function parseCli(argv: string[]): {
  command: "list" | "get";
  threadId: string | undefined;
  commentThreadId: string | undefined;
  json: boolean;
  filter: "open" | "resolved" | "all";
  cursor: string | undefined;
  limit: number;
} {
  const rawCommand = argv[0];
  if (rawCommand !== "list" && rawCommand !== "get") {
    throw new Error(
      rawCommand === undefined
        ? "A command is required: list or get"
        : `Unknown comments command: ${rawCommand}`,
    );
  }
  const command = rawCommand;
  let index = 1;
  let commentThreadId: string | undefined;
  if (command === "get") {
    const candidate = argv[index];
    if (candidate === undefined || candidate.startsWith("--")) {
      throw new Error("get requires a comment-thread-id");
    }
    commentThreadId = candidate;
    index += 1;
  }
  let threadId: string | undefined;
  let filter: "open" | "resolved" | "all" = "open";
  let json = false;
  let cursor: string | undefined;
  const maxLimit = command === "get" ? COMMENT_PAGE_SIZE : ROOT_PAGE_SIZE;
  let limit = maxLimit;
  const takeValue = (flag: string): string => {
    const value = argv[index + 1];
    if (value === undefined || value.startsWith("--")) {
      throw new Error(`${flag} requires a value`);
    }
    index += 2;
    return value;
  };
  while (index < argv.length) {
    const arg = argv[index]!;
    if (arg === "--json") {
      json = true;
      index += 1;
      continue;
    }
    if (arg === "--thread") {
      threadId = takeValue(arg);
      continue;
    }
    if (arg === "--cursor") {
      cursor = takeValue(arg);
      continue;
    }
    if (arg === "--limit") {
      const rawLimit = takeValue(arg);
      limit = Number(rawLimit);
      if (!Number.isInteger(limit) || limit < 1 || limit > maxLimit) {
        throw new Error(`--limit must be an integer from 1 to ${maxLimit}`);
      }
      continue;
    }
    if (arg === "--state" && command === "list") {
      const state = takeValue(arg);
      if (state !== "open" && state !== "resolved" && state !== "all") {
        throw new Error("--state must be open, resolved, or all");
      }
      filter = state;
      continue;
    }
    throw new Error(
      arg.startsWith("--")
        ? `Unknown option for ${command}: ${arg}`
        : `Unexpected argument for ${command}: ${arg}`,
    );
  }
  return {
    command,
    threadId,
    commentThreadId,
    json,
    filter,
    cursor,
    limit,
  };
}

function utf8Size(value: string): number {
  return Buffer.byteLength(value, "utf8");
}

function renderCliPage<T>(input: {
  records: T[];
  inheritedNextCursor: string | null;
  cursorFor: (record: T) => string;
  renderHuman: (record: T, index: number) => string;
  renderJson: (records: T[], nextCursor: string | null) => string;
  json: boolean;
  oversizedLabel: string;
}): string {
  const render = (records: T[], nextCursor: string | null): string => {
    if (input.json) return `${input.renderJson(records, nextCursor)}\n`;
    const rows = records.map(input.renderHuman).join("\n");
    const continuation =
      nextCursor === null
        ? ""
        : `${rows.length > 0 ? "\n" : ""}More results available. Continue with --cursor ${nextCursor}`;
    return `${rows}${continuation}${rows.length > 0 || continuation.length > 0 ? "\n" : ""}`;
  };

  const complete = render(input.records, input.inheritedNextCursor);
  if (utf8Size(complete) <= CLI_OUTPUT_BUDGET_BYTES) return complete;

  for (let length = input.records.length - 1; length >= 1; length -= 1) {
    const records = input.records.slice(0, length);
    const nextCursor = input.cursorFor(records.at(-1)!);
    const candidate = render(records, nextCursor);
    if (utf8Size(candidate) <= CLI_OUTPUT_BUDGET_BYTES) return candidate;
  }

  throw new Error(
    `A single ${input.oversizedLabel} exceeds the CLI output size limit; request a smaller record`,
  );
}

export default function timelineCommentsPlugin(bb: BbPluginApi): void {
  const db = bb.storage.database();
  db.pragma("foreign_keys = ON");
  if (db.pragma("foreign_keys", { simple: true }) !== 1) {
    throw new Error("Timeline comments requires SQLite foreign keys");
  }
  bb.storage.migrate(db, [
    `CREATE TABLE comment_threads (
      id TEXT PRIMARY KEY,
      bb_thread_id TEXT NOT NULL,
      message_id TEXT NOT NULL,
      message_role TEXT NOT NULL CHECK (message_role IN ('user', 'assistant')),
      selector_version INTEGER NOT NULL CHECK (selector_version = 1),
      selector_start INTEGER NOT NULL,
      selector_end INTEGER NOT NULL,
      selector_exact TEXT NOT NULL,
      selector_prefix TEXT NOT NULL,
      selector_suffix TEXT NOT NULL,
      version INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      resolved_at INTEGER
    );
    CREATE TABLE comments (
      id TEXT PRIMARY KEY,
      thread_id TEXT NOT NULL REFERENCES comment_threads(id) ON DELETE CASCADE,
      parent_id TEXT REFERENCES comments(id) ON DELETE CASCADE,
      body TEXT NOT NULL,
      version INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE INDEX comment_threads_by_bb_thread
      ON comment_threads(bb_thread_id, resolved_at, created_at, id);
    CREATE INDEX comments_by_thread
      ON comments(thread_id, created_at, id);`,
  ]);

  const publishChanged = (bbThreadId: string, commentThreadId: string) => {
    bb.realtime.publish("comments-changed", {
      bbThreadId,
      commentThreadId,
    });
  };

  bb.events.on("thread.deleted", ({ thread }) => {
    db.prepare("DELETE FROM comment_threads WHERE bb_thread_id = ?").run(
      thread.id,
    );
  });

  bb.rpc.register(timelineCommentsRpcContract, {
    listOpenAnchors(input) {
      return listOpenAnchors(db, input);
    },
    listCommentThreads(input) {
      return listCommentThreads(db, input);
    },
    getCommentThread(input) {
      return getCommentThread(db, input);
    },
    getThreadHandoffSummary({ bbThreadId }) {
      const summary = summarizeOpenComments(db, bbThreadId);
      return {
        threadCount: summary.threadCount,
        commentCount: summary.commentCount,
        codePointSize: summary.codePointSize,
      };
    },
    createThread(input) {
      if (input.message.threadId !== input.bbThreadId) {
        throw new Error("Message does not belong to the requested BB thread");
      }
      const now = Date.now();
      const commentThreadId = randomId();
      const rootCommentId = randomId();
      db.transaction(() => {
        db.prepare(
          `INSERT INTO comment_threads (
            id, bb_thread_id, message_id, message_role,
            selector_version, selector_start, selector_end, selector_exact,
            selector_prefix, selector_suffix, version, created_at, updated_at
          ) VALUES (?, ?, ?, ?, 1, ?, ?, ?, ?, ?, 1, ?, ?)`,
        ).run(
          commentThreadId,
          input.bbThreadId,
          input.message.id,
          input.message.role,
          input.selector.start,
          input.selector.end,
          input.selector.exact,
          input.selector.prefix,
          input.selector.suffix,
          now,
          now,
        );
        db.prepare(
          `INSERT INTO comments (
            id, thread_id, parent_id, body, version, created_at, updated_at
          ) VALUES (?, ?, NULL, ?, 1, ?, ?)`,
        ).run(rootCommentId, commentThreadId, input.body, now, now);
      })();
      const result = getCommentThread(db, {
        bbThreadId: input.bbThreadId,
        commentThreadId,
      });
      publishChanged(input.bbThreadId, commentThreadId);
      return result;
    },
    reply(input) {
      const current = getThreadRow(db, input.bbThreadId, input.commentThreadId);
      if (current.resolvedAt !== null) {
        throw new Error("Resolved comment threads cannot receive replies");
      }
      const now = Date.now();
      const id = randomId();
      db.transaction(() => {
        db.prepare(
          `INSERT INTO comments (
            id, thread_id, parent_id, body, version, created_at, updated_at
          ) VALUES (?, ?, ?, ?, 1, ?, ?)`,
        ).run(id, current.id, current.rootId, input.body, now, now);
        db.prepare(
          `UPDATE comment_threads
           SET version = version + 1, updated_at = ? WHERE id = ?`,
        ).run(now, current.id);
      })();
      const result = getCommentThread(db, input);
      publishChanged(input.bbThreadId, input.commentThreadId);
      return result;
    },
    updateComment(input) {
      const comment = getCommentRow(db, input.commentId);
      const current = getThreadRow(db, input.bbThreadId, comment.threadId);
      const now = Date.now();
      const updated = db.transaction(() => {
        const change = db
          .prepare(
            `UPDATE comments
             SET body = ?, version = version + 1, updated_at = ?
             WHERE id = ? AND version = ?`,
          )
          .run(input.body, now, input.commentId, input.expectedVersion);
        if (change.changes !== 1) return false;
        db.prepare(
          `UPDATE comment_threads
           SET version = version + 1, updated_at = ? WHERE id = ?`,
        ).run(now, current.id);
        return true;
      })();
      if (!updated) throw new Error("Comment changed; refresh and retry");
      const result = getCommentThread(db, {
        bbThreadId: input.bbThreadId,
        commentThreadId: current.id,
      });
      publishChanged(input.bbThreadId, current.id);
      return result;
    },
    deleteComment(input) {
      const comment = getCommentRow(db, input.commentId);
      const current = getThreadRow(db, input.bbThreadId, comment.threadId);
      if (comment.parentId === null) {
        const change = db.transaction(() =>
          db
            .prepare(
              `DELETE FROM comment_threads
               WHERE id = ? AND bb_thread_id = ? AND version = ?
                 AND EXISTS (
                   SELECT 1 FROM comments
                   WHERE comments.id = ? AND comments.thread_id = comment_threads.id
                     AND comments.parent_id IS NULL AND comments.version = ?
                 )`,
            )
            .run(
              current.id,
              input.bbThreadId,
              input.expectedThreadVersion,
              comment.id,
              input.expectedVersion,
            ),
        )();
        if (change.changes !== 1) {
          throw new Error("Comment thread changed; refresh and retry");
        }
        publishChanged(input.bbThreadId, current.id);
        return { deletedThreadId: current.id, thread: null };
      }
      const now = Date.now();
      db.transaction(() => {
        const threadChange = db
          .prepare(
            `UPDATE comment_threads
             SET version = version + 1, updated_at = ?
             WHERE id = ? AND bb_thread_id = ? AND version = ?`,
          )
          .run(
            now,
            current.id,
            input.bbThreadId,
            input.expectedThreadVersion,
          );
        if (threadChange.changes !== 1) {
          throw new Error("Comment thread changed; refresh and retry");
        }
        const commentChange = db
          .prepare("DELETE FROM comments WHERE id = ? AND version = ?")
          .run(comment.id, input.expectedVersion);
        if (commentChange.changes !== 1) {
          throw new Error("Comment changed; refresh and retry");
        }
      })();
      const result = getCommentThread(db, {
        bbThreadId: input.bbThreadId,
        commentThreadId: current.id,
      });
      publishChanged(input.bbThreadId, current.id);
      return { deletedThreadId: null, thread: result };
    },
    setThreadResolved(input) {
      const now = Date.now();
      const change = db.transaction(() =>
        db
          .prepare(
            `UPDATE comment_threads
             SET resolved_at = ?, version = version + 1, updated_at = ?
             WHERE id = ? AND bb_thread_id = ? AND version = ?`,
          )
          .run(
            input.resolved ? now : null,
            now,
            input.commentThreadId,
            input.bbThreadId,
            input.expectedVersion,
          ),
      )();
      if (change.changes !== 1) {
        throw new Error("Comment thread changed; refresh and retry");
      }
      const result = getCommentThread(db, input);
      publishChanged(input.bbThreadId, input.commentThreadId);
      return result;
    },
  });

  bb.ui.registerMentionProvider({
    id: "thread-comments",
    label: "Thread comments",
    triggers: ["@"],
    search({ query, threadId }) {
      if (threadId === null || !"comments".includes(query.toLowerCase())) {
        return [];
      }
      const counts = countOpenComments(db, threadId);
      return [
        {
          id: threadId,
          title: `${counts.commentCount} comments from ${counts.threadCount} open threads`,
          subtitle: "Local timeline comments",
        },
      ];
    },
    resolve(bbThreadId) {
      const serialized = serializeOpenComments(db, bbThreadId);
      return { context: serialized.context };
    },
  });

  bb.cli.register({
    name: "comments",
    summary: "Read timeline comments attached to BB threads",
    commands: [
      {
        name: "list",
        summary: "List comment threads",
        usage:
          "bb comments list [--thread <id>] [--state open|resolved|all] [--cursor <cursor>] [--limit 1-50] [--json]",
      },
      {
        name: "get",
        summary: "Read one comment thread",
        usage:
          "bb comments get <comment-thread-id> [--thread <id>] [--cursor <cursor>] [--limit 1-100] [--json]",
      },
    ],
    run(argv, context) {
      try {
        const parsed = parseCli(argv);
        const bbThreadId = parsed.threadId ?? context.threadId;
        if (bbThreadId === undefined) {
          return {
            exitCode: 2,
            stderr: "A BB thread context or --thread <id> is required.\n",
          };
        }
        if (parsed.command === "get") {
          if (parsed.commentThreadId === undefined) {
            return {
              exitCode: 2,
              stderr:
                "Usage: bb comments get <comment-thread-id> [--thread <id>] [--cursor <cursor>] [--limit 1-100] [--json]\n",
            };
          }
          const detail = getCommentThread(db, {
            bbThreadId,
            commentThreadId: parsed.commentThreadId,
            cursor: parsed.cursor,
            limit: parsed.limit,
          });
          return {
            exitCode: 0,
            stdout: renderCliPage({
              records: detail.comments,
              inheritedNextCursor: detail.nextCursor,
              cursorFor: (comment) =>
                encodeCursor({
                  method: "comments",
                  scope: `${bbThreadId}:${parsed.commentThreadId}`,
                  filter: "chronological",
                  parentRank: comment.parentId === null ? 0 : 1,
                  createdAt: comment.createdAt,
                  id: comment.id,
                }),
              renderHuman: (comment) =>
                `${comment.parentId === null ? "Comment" : "Reply"}: ${comment.body}`,
              renderJson: (comments, nextCursor) =>
                JSON.stringify({ ...detail, comments, nextCursor }),
              json: parsed.json,
              oversizedLabel: "comment",
            }),
          };
        }
        const result = listCommentThreads(db, {
          bbThreadId,
          filter: parsed.filter,
          cursor: parsed.cursor,
          limit: parsed.limit,
        });
        return {
          exitCode: 0,
          stdout: renderCliPage({
            records: result.threads,
            inheritedNextCursor: result.nextCursor,
            cursorFor: (thread) =>
              encodeCursor({
                method: "threads",
                scope: bbThreadId,
                filter: parsed.filter,
                createdAt: thread.createdAt,
                id: thread.id,
              }),
            renderHuman: (thread) =>
              `${thread.id}\t${thread.resolvedAt === null ? "open" : "resolved"}\t${thread.selector.exact}\t${thread.rootComment.body}`,
            renderJson: (threads, nextCursor) =>
              JSON.stringify({ threads, nextCursor }),
            json: parsed.json,
            oversizedLabel: "comment thread",
          }),
        };
      } catch (error) {
        return {
          exitCode: 1,
          stderr: `${error instanceof Error ? error.message : String(error)}\n`,
        };
      }
    },
  });
}
