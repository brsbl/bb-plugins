import { defineRpcContract } from "@get-bb/plugin-sdk";
import { z } from "zod";

export const CHANGED = "pull-requests-changed";
const id = z.string().min(1).max(250);
const text = z.string();
export const urlSchema = z.string().max(2048);
export const readerSchema = z.object({ hostId: id, accountId: id, login: text });
export type Reader = z.infer<typeof readerSchema>;
export const checkSchema = z.object({ name: text, state: z.enum(["passing", "failing", "pending", "neutral", "unknown"]), url: text.nullable() });
export const snapshotSchema = z.object({
  nodeId: id, url: text, repository: text, number: z.number().int().positive(), title: text, body: text,
  author: text.nullable(), state: z.enum(["open", "draft", "merged", "closed"]), headSha: text,
  headBranch: text, baseBranch: text, updatedAt: text, fetchedAt: text,
  checks: z.object({ state: z.enum(["passing", "failing", "pending", "none", "unknown"]), passing: z.number(), failing: z.number(), pending: z.number(), total: z.number(), complete: z.boolean(), items: z.array(checkSchema) }),
  review: z.enum(["approved", "changes-requested", "required", "none", "unknown"]),
  mergeability: z.enum(["mergeable", "conflicts", "blocked", "unknown"]),
  queued: z.boolean(), autoMerge: z.boolean(), additions: z.number(), deletions: z.number(), changedFiles: z.number(),
  originThreadIds: z.array(id),
  stack: z.object({ state: z.enum(["available", "none", "unavailable"]), items: z.array(z.object({ url: text, title: text, number: z.number(), state: text })) }),
});
export type Snapshot = z.infer<typeof snapshotSchema>;
export const linkSchema = z.object({
  threadId: id, evidence: z.enum(["environment", "body-marker", "user-explicit", "agent-explicit"]),
  origin: z.boolean(), environmentId: id.nullable(), createdAt: text, actor: text,
});
export type Link = z.infer<typeof linkSchema>;
export const sourceStateSchema = z.enum(["available", "stale", "unavailable", "offline", "denied", "auth-changed", "authentication-required"]);
export const itemSchema = z.object({
  id, url: text, snapshot: snapshotSchema.nullable(), reader: readerSchema.nullable(),
  sourceState: sourceStateSchema, sourceMessage: text.nullable(), lastAttemptAt: text.nullable(),
  links: z.array(linkSchema), preferredThreadId: id.nullable(), pinned: z.boolean(),
});
export type PullRequestItem = z.infer<typeof itemSchema>;
export const coverageSchema = z.object({ running: z.boolean(), checked: z.number(), total: z.number(), unavailable: z.number(), incomplete: z.boolean(), lastDiscoveryAt: text.nullable(), includesArchived: z.boolean() });
export const listingSchema = z.object({ items: z.array(itemSchema), nextCursor: text.nullable(), total: z.number(), coverage: coverageSchema });
export type Listing = z.infer<typeof listingSchema>;
export const threadSchema = z.object({ id, title: text, projectId: id, environmentId: id.nullable(), hostId: id.nullable(), archived: z.boolean() });
export type ThreadChoice = z.infer<typeof threadSchema>;
export const changesSchema = z.object({ headSha: text, files: z.array(z.object({ path: text, previousPath: text.nullable(), additions: z.number(), deletions: z.number(), status: text, patch: text.nullable() })), total: z.number(), truncated: z.boolean(), message: text.nullable() });
export type Changes = z.infer<typeof changesSchema>;
const failureSchema = z.object({ ok: z.literal(false), kind: z.enum(["denied", "authentication-required", "auth-changed", "unavailable"]), message: text, accountId: id.optional() });
export const readResultSchema = z.discriminatedUnion("ok", [z.object({ ok: z.literal(true), accountId: id, login: text, snapshot: snapshotSchema }), failureSchema]);
export type ReadResult = z.infer<typeof readResultSchema>;
export const hostContract = defineRpcContract({
  read: { input: z.object({ url: urlSchema, expectedAccountId: id.optional() }), output: readResultSchema },
  changes: { input: z.object({ url: urlSchema, expectedAccountId: id, headSha: text }), output: z.discriminatedUnion("ok", [z.object({ ok: z.literal(true), changes: changesSchema }), failureSchema]) },
});
export const listInput = z.object({ cursor: text.optional(), limit: z.number().int().min(1).max(100).default(100), query: text.max(300).optional(), view: z.enum(["all", "open", "history"]).default("all") });
export const rpcContract = defineRpcContract({
  list: { input: listInput, output: listingSchema },
  show: { input: z.object({ id }), output: itemSchema },
  refresh: { input: z.object({ discover: z.boolean().default(false), includeArchived: z.boolean().default(false), id: id.optional() }), output: coverageSchema },
  context: { input: z.object({ query: text.max(300).optional(), cursor: text.optional(), threadIds: z.array(id).max(100).optional() }), output: z.object({ threads: z.array(threadSchema), nextCursor: text.nullable(), hosts: z.array(z.object({ id, name: text, connected: z.boolean() })) }) },
  preview: { input: z.object({ url: urlSchema, threadId: id, hostId: id.optional() }), output: z.object({ token: id, snapshot: snapshotSchema, reader: readerSchema, thread: threadSchema }) },
  link: { input: z.object({ token: id }), output: itemSchema },
  unlink: { input: z.object({ id, threadId: id }), output: z.object({ undoToken: id.nullable() }) },
  undo: { input: z.object({ token: id }), output: itemSchema },
  prefer: { input: z.object({ id, threadId: id.nullable() }), output: itemSchema },
  pin: { input: z.object({ id, pinned: z.boolean() }), output: itemSchema },
  source: { input: z.object({ id, hostId: id }), output: itemSchema },
  changes: { input: z.object({ id }), output: changesSchema },
});
