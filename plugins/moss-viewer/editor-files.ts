import { lstat, open, readFile, stat } from "node:fs/promises";
import type * as Moss from "./vendor/moss-editor-host/contract.js";

/**
 * The two file operations Node lacks that the editor's lossless write needs on
 * the note's volume (moss-multi's `MossNoteWrite`, design §5.4). On a Mac a
 * helper provides them with `renamex_np`.
 */
export interface PathExchange {
  /** Swaps the files at two paths in one folder atomically: each then holds the other's previous file. */
  exchange(first: string, second: string): Promise<void>;
  /** Renames `from` to `to`, failing with EEXIST when `to` exists. Used for the folder rename. */
  renameExclusive(from: string, to: string): Promise<void>;
  /** Whether the volume holding `directory` can do both. Notes anywhere else stay read-only. */
  supports(directory: string): Promise<boolean>;
}

/** One note folder's files as read under the note's lock. */
export interface NoteState {
  directory: string;
  folderName: string;
  /** Moss's `folderPath` for the folder, for example `Notes/Projects`. */
  folderPath: string;
  /** The markdown file Moss's two-step resolution picked, or null when the folder has none. */
  markdownName: string | null;
  markdown: { bytes: Buffer; dev: number; ino: number } | null;
  comments: Buffer | null;
  layout: Buffer | null;
  meta: Buffer | null;
  editability: Moss.MossEditability;
}

export const errorCode = (error: unknown): string | undefined => (error as NodeJS.ErrnoException | null)?.code;

export function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** An Error carrying a POSIX `code`, as the bridge's rejections do. */
export function codedError(code: string, message: string): Error {
  return Object.assign(new Error(message), { code });
}

const isMissing = (error: unknown) => errorCode(error) === "ENOENT" || errorCode(error) === "ENOTDIR";

/** A file's bytes, following links, or null when nothing is there. */
export async function readOptional(path: string): Promise<Buffer | null> {
  return readFile(path).catch((error: unknown) => {
    if (isMissing(error)) return null;
    throw error;
  });
}

/** Whether something exists at `path`, following links, as Moss's `pathExists` asks. */
export async function pathExists(path: string): Promise<boolean> {
  return stat(path).then(
    () => true,
    (error: unknown) => {
      if (isMissing(error)) return false;
      throw error;
    },
  );
}

/** The directory entry itself, without following a link, or null when there is none. */
export async function entryAt(path: string) {
  return lstat(path).catch((error: unknown) => {
    if (isMissing(error)) return null;
    throw error;
  });
}

// The codes Moss's persistFile ignores when a volume cannot flush.
const UNFLUSHABLE = new Set(["EINVAL", "ENOTSUP", "EPERM", "ENOSYS", "EISDIR"]);

/** Flushes a file or folder to disk. */
export async function syncPath(path: string): Promise<void> {
  const handle = await open(path, "r");
  try {
    await handle.sync();
  } catch (error) {
    if (!UNFLUSHABLE.has(errorCode(error) ?? "")) throw error;
  } finally {
    await handle.close();
  }
}

/** Creates `path`, which must not exist, with `bytes` and the given mode, and flushes it. */
export async function writeNew(path: string, bytes: Uint8Array, mode = 0o644): Promise<void> {
  const handle = await open(path, "wx", mode);
  try {
    await handle.writeFile(bytes);
    // The process umask may have narrowed the mode the file was created with.
    await handle.chmod(mode);
    await handle.sync().catch((error: unknown) => {
      if (!UNFLUSHABLE.has(errorCode(error) ?? "")) throw error;
    });
  } finally {
    await handle.close();
  }
}

const ascii = (head: Uint8Array, at: number, text: string) =>
  [...text].every((char, index) => head[at + index] === char.charCodeAt(0));

const bytesAt = (head: Uint8Array, at: number, bytes: readonly number[]) => bytes.every((byte, index) => head[at + index] === byte);

// What a QuickTime file may start with besides `ftyp`.
const QUICKTIME_ATOMS = ["ftyp", "moov", "mdat", "wide", "free", "skip", "pnot"];

/**
 * Whether a file's first bytes are what its extension claims, so a mislabelled
 * upload (HTML named .png, say) is refused rather than stored and served.
 */
export function contentMatches(extension: string, head: Uint8Array): boolean {
  switch (extension) {
    case ".png":
      return bytesAt(head, 0, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    case ".jpg":
    case ".jpeg":
      return bytesAt(head, 0, [0xff, 0xd8, 0xff]);
    case ".gif":
      return ascii(head, 0, "GIF87a") || ascii(head, 0, "GIF89a");
    case ".webp":
      return ascii(head, 0, "RIFF") && ascii(head, 8, "WEBP");
    case ".webm":
      return bytesAt(head, 0, [0x1a, 0x45, 0xdf, 0xa3]);
    case ".mp4":
      return ascii(head, 4, "ftyp");
    case ".mov":
      return QUICKTIME_ATOMS.some((atom) => ascii(head, 4, atom));
    case ".svg":
      return /^﻿?\s*(?:<\?xml[^>]*>\s*)?(?:<!--[\s\S]*?-->\s*)*(?:<!DOCTYPE\s+svg[^>]*>\s*)?<svg[\s>]/i.test(
        new TextDecoder().decode(head),
      );
    default:
      return false;
  }
}

const utf8 = (text: string) => new TextEncoder().encode(text);

type VersionToken = Pick<Moss.MossEditorHostModule, "versionToken">;

/** The note's two versions (`MossNoteVersion`, `MossMetaVersion`) over the given byte states. */
export async function noteVersions(
  helpers: VersionToken,
  files: { markdown: Uint8Array | null; comments: Uint8Array | null; layout: Uint8Array | null; meta: Uint8Array | null },
  folderPath: string,
): Promise<{ version: string; metaVersion: string }> {
  return {
    version: await helpers.versionToken([
      { role: "markdown", bytes: files.markdown },
      { role: "comments", bytes: files.comments },
      { role: "layout", bytes: files.layout },
    ]),
    metaVersion: await helpers.versionToken([
      { role: "meta", bytes: files.meta },
      { role: "folderPath", bytes: utf8(folderPath) },
    ]),
  };
}

export function stateVersions(helpers: VersionToken, state: NoteState) {
  return noteVersions(helpers, { ...state, markdown: state.markdown?.bytes ?? null }, state.folderPath);
}

/** One companion file's version. */
export async function companionVersion(helpers: VersionToken, bytes: Uint8Array | null): Promise<string> {
  return helpers.versionToken([{ role: "companion", bytes }]);
}

export function locationOf(state: NoteState): Moss.MossNoteLocation {
  return {
    folderPath: state.folderPath,
    folderName: state.folderName,
    markdownName: state.markdownName ?? `${state.folderName}.md`,
  };
}
