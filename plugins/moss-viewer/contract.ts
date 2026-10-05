import { defineRpcContract } from "@get-bb/plugin-sdk";
import { z } from "zod";

const id = z.string().min(1).max(200);
export const filePath = z
  .string()
  .min(1)
  .max(4096)
  .refine((value) => !value.includes("\0"), "Invalid file path");

/** Bytes per host read. Base64 keeps one chunk well under the 8 MiB host RPC output limit. */
export const ASSET_CHUNK_BYTES = 2 * 1024 * 1024;
/** Notes larger than this are refused rather than shipped through host RPC. */
export const MAX_NOTE_BYTES = 4 * 1024 * 1024;
/** layout.json or comments.json larger than this keeps the note read-only. */
export const MAX_SIDECAR_BYTES = 1024 * 1024;
/** The largest image or video an editor may add to a note's assets/ folder. */
export const MAX_ASSET_BYTES = 256 * 1024 * 1024;
/** Why the host declined to read a note asset; each maps to one HTTP status. */
export const assetRefusals = ["invalid", "not_found", "not_allowed", "unsupported"] as const;
export type AssetRefusal = (typeof assetRefusals)[number];
/** Why the host declined to add a note asset. */
const assetWriteRefusal = z.object({
  ok: z.literal(false),
  code: z.enum([...assetRefusals, "too_large"]),
  message: z.string(),
});

/** A content hash of a note's Markdown, layout.json and comments.json together. */
const version = z.string().regex(/^[0-9a-f]{64}$/);
/** A sidecar's exact text, or null when the note has none. */
const sidecar = z.string().nullable();

/**
 * An editable note's files as raw text, so a save writes back exactly the bytes
 * Moss's own serializer produced.
 */
const noteFiles = z.object({ path: filePath, markdown: z.string(), layout: sidecar, comments: sidecar, version });
export type NoteFiles = z.infer<typeof noteFiles>;

/** The files a save replaces; an omitted file is left alone and a null sidecar is removed. */
const fileChanges = z
  .object({ markdown: z.string().optional(), layout: sidecar.optional(), comments: sidecar.optional() })
  .strict();

const saveResult = z.discriminatedUnion("status", [
  z.object({ status: z.literal("saved"), version }),
  /** The note changed after `baseVersion`; nothing was written. */
  z.object({ status: z.literal("conflict"), version }),
]);
export type SaveResult = z.infer<typeof saveResult>;

const uploadId = z.string().regex(/^[0-9a-f]{32}$/);
/** Base64 of at most one ASSET_CHUNK_BYTES chunk. */
const chunkData = z.string().max(Math.ceil(ASSET_CHUNK_BYTES / 3) * 4);
const assetName = z.string().min(1).max(255);

/** Signals from a host to the server; `version` is null once the note can no longer be read there. */
export const hostSignals = {
  noteChanged: { payload: z.object({ path: filePath, version: version.nullable() }) },
};

/** The realtime channel that tells open editors a note changed on disk. */
export const NOTE_CHANGED_CHANNEL = "note-changed";
export const noteChanged = z.object({ hostId: id, path: filePath, version: version.nullable() });
export type NoteChanged = z.infer<typeof noteChanged>;

const note = z.object({
  id,
  title: z.string(),
  path: filePath,
  folderPath: z.string(),
  updatedAt: z.number().optional(),
});
export type MossNoteEntry = z.infer<typeof note>;

const noteFile = z.discriminatedUnion("moss", [
  z.object({
    moss: z.literal(true),
    path: filePath,
    markdown: z.string(),
    /** The note's layout.json sidecar as parsed JSON; the viewer validates its shape. */
    layout: z.unknown(),
    noteId: id.nullable(),
    modifiedMs: z.number(),
    /** A `<Title>/<Title>.md` note in ~/Moss/Notes, which bb may edit. */
    editable: z.boolean(),
  }),
  /** `missing` when no file exists at the path on this host. */
  z.object({ moss: z.literal(false), path: filePath, missing: z.boolean() }),
]);

export type HostNote = z.infer<typeof noteFile>;

export const hostContract = defineRpcContract({
  readNote: {
    input: z.object({ path: filePath }).strict(),
    output: noteFile,
  },
  listNotes: {
    input: z.object({}).strict(),
    output: z.object({ notes: z.array(note), truncated: z.boolean() }),
  },
  /** Reads `length` bytes from `offset` of a media file inside a Moss note's folder; length 0 reads only its size. */
  readAsset: {
    input: z
      .object({
        notePath: filePath,
        ref: z.string().min(1).max(4096),
        offset: z.number().int().min(0),
        length: z.number().int().min(0).max(ASSET_CHUNK_BYTES),
      })
      .strict(),
    output: z.discriminatedUnion("ok", [
      z.object({
        ok: z.literal(true),
        contentType: z.string(),
        size: z.number().int().min(0),
        modifiedMs: z.number(),
        offset: z.number().int().min(0),
        data: z.string(),
      }),
      z.object({ ok: z.literal(false), code: z.enum(assetRefusals), message: z.string() }),
    ]),
  },
  openInMoss: {
    input: z.object({ path: filePath }).strict(),
    output: z.object({ opened: z.literal(true) }).strict(),
  },
  /** An editable note's files and their version. */
  readNoteFiles: {
    input: z.object({ path: filePath }).strict(),
    output: noteFiles,
  },
  /** Replaces a note's files, unless any of them changed since `baseVersion`. */
  writeNoteFiles: {
    input: z.object({ path: filePath, baseVersion: version, files: fileChanges }).strict(),
    output: saveResult,
  },
  /**
   * Watches an editable note's folder for a while and returns its current version.
   * Calling again renews the watch; a change made outside bb emits `noteChanged`.
   */
  watchNote: {
    input: z.object({ path: filePath }).strict(),
    output: z.object({ version }).strict(),
  },
  /** Stages the chunk of an upload that starts at `offset`; chunks arrive in order. */
  writeAssetChunk: {
    input: z.object({ notePath: filePath, upload: uploadId, offset: z.number().int().min(0), data: chunkData }).strict(),
    output: z.discriminatedUnion("ok", [z.object({ ok: z.literal(true), size: z.number().int().min(0) }), assetWriteRefusal]),
  },
  /** Moves a fully staged upload into the note's assets/ folder under a free name. */
  commitAsset: {
    input: z.object({ notePath: filePath, upload: uploadId, name: assetName, size: z.number().int().min(0) }).strict(),
    output: z.discriminatedUnion("ok", [z.object({ ok: z.literal(true), ref: z.string() }), assetWriteRefusal]),
  },
});

const readResult = z.discriminatedUnion("moss", [
  z.object({
    moss: z.literal(true),
    hostId: id,
    path: filePath,
    markdown: z.string(),
    layout: z.unknown(),
    noteId: id.nullable(),
    modifiedMs: z.number(),
    editable: z.boolean(),
    /** The viewer's frame document. */
    frameUrl: z.string(),
    /** The route that serves this note's media; see `assetHref`. */
    assetRoute: z.string(),
  }),
  /** Not a Moss note: bb's own preview takes it, unless `message` explains why the note could not be found. */
  z.object({ moss: z.literal(false), message: z.string().nullable() }),
]);
export type ReadResult = z.infer<typeof readResult>;

export const rpcContract = defineRpcContract({
  /**
   * Reads a file a bb panel opened. Host files carry an absolute path and a host,
   * either named or implied by the thread's environment; workspace files are
   * relative to their environment's worktree.
   */
  read: {
    input: z
      .object({
        kind: z.enum(["host", "workspace"]),
        path: filePath,
        hostId: id.nullable(),
        environmentId: id.nullable(),
      })
      .strict(),
    output: readResult,
  },
  notes: {
    input: z.object({ hostId: id }).strict(),
    output: z.object({ notes: z.array(note) }),
  },
  openInMoss: {
    input: z.object({ hostId: id, path: filePath }).strict(),
    output: z.object({ opened: z.literal(true) }).strict(),
  },
  // The editor's file bridge, each method answered by the note's host.
  files: {
    input: z.object({ hostId: id, path: filePath }).strict(),
    output: noteFiles,
  },
  save: {
    input: z.object({ hostId: id, path: filePath, baseVersion: version, files: fileChanges }).strict(),
    output: saveResult,
  },
  watch: {
    input: z.object({ hostId: id, path: filePath }).strict(),
    output: z.object({ version }).strict(),
  },
  putAssetChunk: {
    input: z
      .object({ hostId: id, notePath: filePath, upload: uploadId, offset: z.number().int().min(0), data: chunkData })
      .strict(),
    output: hostContract.writeAssetChunk.output,
  },
  commitAsset: {
    input: z
      .object({ hostId: id, notePath: filePath, upload: uploadId, name: assetName, size: z.number().int().min(0) })
      .strict(),
    output: hostContract.commitAsset.output,
  },
});
