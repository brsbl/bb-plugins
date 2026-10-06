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
/** Why the host declined to read a note asset; each maps to one HTTP status. */
export const assetRefusals = ["invalid", "not_found", "not_allowed", "unsupported"] as const;
export type AssetRefusal = (typeof assetRefusals)[number];

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
    /** The sandboxed page each of the note's HTML blocks runs in. */
    htmlFrameUrl: z.string(),
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
});
