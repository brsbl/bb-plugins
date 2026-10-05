import { defineRpcContract } from "@get-bb/plugin-sdk";
import { z } from "zod";
import {
  assetChunkResult,
  assetName,
  assetPutResult,
  assetRef,
  companionRead,
  draft,
  externalChange,
  noteId,
  noteWrite,
  readResult as editorReadResult,
  relativePath,
  writeResult,
} from "./editor-schema.js";

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
/** The largest image or video the editor may add to a note; the host refuses larger ones as `tooLarge`. */
export const MAX_ASSET_BYTES = 256 * 1024 * 1024;
/** Why the host declined to read a note asset; each maps to one HTTP status. */
export const assetRefusals = ["invalid", "not_found", "not_allowed", "unsupported"] as const;
export type AssetRefusal = (typeof assetRefusals)[number];

const uploadId = z.string().regex(/^[0-9a-f]{32}$/);
/** Base64 of at most one ASSET_CHUNK_BYTES chunk. */
const chunkData = z.string().max(Math.ceil(ASSET_CHUNK_BYTES / 3) * 4);

/** Signals from a host to the server: a note an editor watches changed on disk, outside bb. */
export const hostSignals = {
  editorNoteChanged: { payload: z.object({ noteId, change: externalChange }) },
};

/** The realtime channel that relays `editorNoteChanged` to open editors. */
export const NOTE_CHANGED_CHANNEL = "editor-note-changed";
export const noteChanged = z.object({ hostId: id, noteId, change: externalChange });
export type NoteChanged = z.infer<typeof noteChanged>;

const assetReadResult = z.discriminatedUnion("ok", [
  z.object({
    ok: z.literal(true),
    contentType: z.string(),
    size: z.number().int().min(0),
    modifiedMs: z.number(),
    offset: z.number().int().min(0),
    data: z.string(),
  }),
  z.object({ ok: z.literal(false), code: z.enum(assetRefusals), message: z.string() }),
]);
const assetChunk = { upload: uploadId, offset: z.number().int().min(0), data: chunkData };
const assetCommit = { upload: uploadId, name: assetName, mimeType: z.string().min(1).max(200), size: z.number().int().min(0) };
const assetCopy = { sourceNoteId: noteId, sourceRef: assetRef, name: assetName };

/** The editor's file bridge as the note's host answers it; every method names the note by its meta.json id. */
const editorHostMethods = {
  editorRead: { input: z.object({ noteId }).strict(), output: editorReadResult },
  editorReadCompanion: { input: z.object({ noteId, relativePath }).strict(), output: companionRead },
  editorWrite: { input: z.object({ noteId, write: noteWrite }).strict(), output: writeResult },
  /**
   * Watches the note for a while and returns its state now. Calling again renews
   * the watch; a change made outside bb emits `editorNoteChanged`.
   */
  editorWatch: { input: z.object({ noteId }).strict(), output: externalChange },
  /** Stages the chunk of an upload that starts at `offset`; chunks arrive in order. */
  editorAssetChunk: { input: z.object({ noteId, ...assetChunk }).strict(), output: assetChunkResult },
  /** Creates the staged upload exclusively as `assets/<name>`. */
  editorAssetCommit: { input: z.object({ noteId, ...assetCommit }).strict(), output: assetPutResult },
  editorAssetCopy: { input: z.object({ noteId, ...assetCopy }).strict(), output: assetPutResult },
  /** Reads part of a media file in the note's folder, found by id so its URL outlives a rename. */
  editorAsset: {
    input: z
      .object({ noteId, ref: z.string().min(1).max(4096), offset: z.number().int().min(0), length: z.number().int().min(0).max(ASSET_CHUNK_BYTES) })
      .strict(),
    output: assetReadResult,
  },
};

const savedKind = z.enum(["receipt", "draft"]);

/** The same bridge methods for the panel, each sent to the note's host. */
const hostIdInput = { hostId: id };
const editorRpcMethods = {
  editorRead: { input: z.object({ ...hostIdInput, noteId }).strict(), output: editorReadResult },
  editorReadCompanion: { input: z.object({ ...hostIdInput, noteId, relativePath }).strict(), output: companionRead },
  editorWrite: { input: z.object({ ...hostIdInput, noteId, write: noteWrite }).strict(), output: writeResult },
  editorWatch: { input: z.object({ ...hostIdInput, noteId }).strict(), output: externalChange },
  editorAssetChunk: { input: z.object({ ...hostIdInput, noteId, ...assetChunk }).strict(), output: assetChunkResult },
  editorAssetCommit: { input: z.object({ ...hostIdInput, noteId, ...assetCommit }).strict(), output: assetPutResult },
  editorAssetCopy: { input: z.object({ ...hostIdInput, noteId, ...assetCopy }).strict(), output: assetPutResult },
  /** Keeps a note's last save receipt, or the draft an unmount left unsaved, beyond the mount. */
  editorKeep: {
    input: z.object({ ...hostIdInput, noteId, kind: savedKind, draft }).strict(),
    output: z.object({ kept: z.literal(true) }).strict(),
  },
  /** What bb kept for a note: its last receipt and any unsaved draft, each null when none. */
  editorKept: {
    input: z.object({ ...hostIdInput, noteId }).strict(),
    output: z.object({ receipt: draft.nullable(), draft: draft.nullable() }).strict(),
  },
  editorForget: {
    input: z.object({ ...hostIdInput, noteId, kind: savedKind }).strict(),
    output: z.object({ forgotten: z.literal(true) }).strict(),
  },
};

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
    output: assetReadResult,
  },
  openInMoss: {
    input: z.object({ path: filePath }).strict(),
    output: z.object({ opened: z.literal(true) }).strict(),
  },
  ...editorHostMethods,
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
  ...editorRpcMethods,
});
