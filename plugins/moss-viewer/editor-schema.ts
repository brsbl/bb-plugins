// Schemas for the parts of @moss-multi/editor's file bridge (API 1,
// vendor/moss-editor-host/contract.d.ts) that cross bb's RPC between the panel, the
// server and the note's host. The types are moss-multi's; these only validate
// them at each boundary.
import { z } from "zod";
import type * as Moss from "./vendor/moss-editor-host/contract.js";

type Assert<T extends true> = T;

/** Opaque version tokens; the host's are `versionToken` strings. */
const token = z.string().min(1).max(200);
export const noteId = z.string().min(1).max(200);

const noteFile = z.enum(["markdown", "comments", "layout", "meta"]);
export const notEditableReason = z.enum([
  "external",
  "unadopted",
  "trashed",
  "noMarkdown",
  "outsideNotes",
  "unreadableMeta",
  "duplicateId",
  "hostUnsupported",
]);

const location = z.object({ folderPath: z.string(), folderName: z.string(), markdownName: z.string() });
const notFound = z.object({ kind: z.literal("notFound") });
const notEditable = z.object({ kind: z.literal("notEditable"), reason: notEditableReason });

export const readResult = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("note"),
    files: z.object({ markdown: z.string(), comments: z.string().nullable(), layout: z.string().nullable(), meta: z.string() }),
    location,
    version: token,
    metaVersion: token,
  }),
  notFound,
  notEditable,
]);

export const companionRead = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("file"), text: z.string(), version: token }),
  z.object({ kind: z.literal("absent"), version: token }),
]);

/** A note-relative path that stays inside the note folder, as `readCompanion` and assets take them. */
export const relativePath = z
  .string()
  .min(1)
  .max(4096)
  .refine((value) => !value.includes("\0") && !value.startsWith("/") && !value.startsWith("~"), "Invalid note-relative path");

const fileOp = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("put"), file: noteFile, text: z.string() }).strict(),
  z.object({ kind: z.literal("delete"), file: z.enum(["comments", "layout"]) }).strict(),
]);

const FILE_ORDER: readonly Moss.MossNoteFile[] = ["markdown", "comments", "layout", "meta"];

export const noteWrite = z
  .object({
    baseVersion: token,
    baseMetaVersion: token,
    companions: z.array(z.object({ relativePath, version: token }).strict()).max(64).readonly(),
    rename: z.object({ kind: z.literal("renameFolder"), desiredName: z.string().min(1).max(1024) }).strict().nullable(),
    ops: z.array(fileOp).min(1).max(4).readonly(),
  })
  .strict()
  .superRefine((write, context) => {
    const order = write.ops.map((op) => FILE_ORDER.indexOf(op.file));
    if (order.some((position, index) => index > 0 && position <= order[index - 1]!)) {
      context.addIssue({ code: "custom", message: "A write names each file at most once, in the order markdown, comments, layout, meta." });
    }
    if (!write.ops.some((op) => op.kind === "put" && op.file === "meta")) {
      context.addIssue({ code: "custom", message: "Every write puts meta.json." });
    }
    if (write.rename && !write.ops.some((op) => op.kind === "put" && op.file === "markdown")) {
      context.addIssue({ code: "custom", message: "A folder rename comes with a markdown put." });
    }
  });

const files = z.array(noteFile).readonly();
const preserved = z.array(z.string()).readonly();
const writeFailed = z.object({
  kind: z.literal("failed"),
  code: z.string().nullable(),
  message: z.string(),
  applied: files,
  preserved,
  location,
});

export const writeResult = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("saved"), version: token, metaVersion: token, location }),
  z.object({
    kind: z.literal("conflict"),
    reason: z.enum(["content", "companion", "meta", "raced"]),
    version: token,
    metaVersion: token,
    applied: files,
    preserved,
    location,
  }),
  writeFailed,
  notFound,
  notEditable,
]);

export const externalChange = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("changed"), version: token, metaVersion: token }),
  z.object({ kind: z.literal("removed"), reason: z.union([z.literal("notFound"), notEditableReason]) }),
]);

export const assetRef = z.custom<Moss.MossAssetRef>(
  (value) => typeof value === "string" && /^assets\/[^/\\\0]+$/.test(value),
  "An asset reference is assets/<name>",
);

const refused = z.object({
  kind: z.literal("refused"),
  reason: z.enum(["tooLarge", "type", "noSpace", "name"]),
  maxBytes: z.number().int().min(0).optional(),
});

export const assetPutResult = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("stored"), ref: assetRef }),
  z.object({ kind: z.literal("exists") }),
  refused,
  notFound,
  notEditable,
]);

/** bb's own step before `put` completes: an upload arrives in chunks, each staged on the host. */
export const assetChunkResult = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("staged"), size: z.number().int().min(0) }),
  refused,
  notFound,
  notEditable,
]);

/** A new asset's file name as the editor chose it: no directory, no leading dot. */
export const assetName = z
  .string()
  .min(1)
  .max(255)
  .refine((value) => !/[/\\\0]/.test(value) && !value.startsWith("."), "Invalid asset name");

const frontmatterFieldMeta = z.object({
  source: z.enum(["user", "inferred", "user-removed"]),
  lastModified: z.number(),
  missedInferenceCount: z.number().optional(),
});

/** A draft (unsaved edits) or a receipt (the bytes of a completed save), as bb keeps them beyond a mount. */
export const draft = z.object({
  noteId,
  baseVersion: token,
  companions: z.array(z.object({ relativePath, version: token })).max(64).readonly(),
  files: z.object({ markdown: z.string(), comments: z.string().nullable(), layout: z.string().nullable() }),
  intents: z.object({
    frontmatterMetaUpdates: z.record(z.string(), frontmatterFieldMeta),
    commentColors: z.record(z.string(), z.number()),
  }),
  at: z.number(),
});

// What the host returns must be a valid bridge value, and what the panel parses
// must be one the editor accepts.
export type SchemaChecks = [
  Assert<Moss.MossReadResult extends z.input<typeof readResult> ? true : false>,
  Assert<z.output<typeof readResult> extends Moss.MossReadResult ? true : false>,
  Assert<Moss.MossCompanionRead extends z.input<typeof companionRead> ? true : false>,
  Assert<Moss.MossNoteWrite extends z.input<typeof noteWrite> ? true : false>,
  Assert<z.output<typeof noteWrite> extends Moss.MossNoteWrite ? true : false>,
  Assert<Moss.MossWriteResult extends z.input<typeof writeResult> ? true : false>,
  Assert<z.output<typeof writeResult> extends Moss.MossWriteResult ? true : false>,
  Assert<Moss.MossExternalChange extends z.input<typeof externalChange> ? true : false>,
  Assert<z.output<typeof externalChange> extends Moss.MossExternalChange ? true : false>,
  Assert<Moss.MossAssetPutResult extends z.input<typeof assetPutResult> ? true : false>,
  Assert<z.output<typeof assetPutResult> extends Moss.MossAssetPutResult ? true : false>,
  Assert<Moss.MossDraft extends z.input<typeof draft> ? true : false>,
  Assert<z.output<typeof draft> extends Moss.MossDraft ? true : false>,
];
