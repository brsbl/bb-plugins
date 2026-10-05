import { lstat, open, readFile, stat } from "node:fs/promises";
import type * as Moss from "./vendor/moss-editor-contract.js";

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

const utf8 = (text: string) => new TextEncoder().encode(text);

/** The note's two versions (`MossNoteVersion`, `MossMetaVersion`) over the given byte states. */
export function noteVersions(
  helpers: Pick<Moss.MossEditorHostModule, "versionToken">,
  files: { markdown: Uint8Array | null; comments: Uint8Array | null; layout: Uint8Array | null; meta: Uint8Array | null },
  folderPath: string,
): { version: string; metaVersion: string } {
  return {
    version: helpers.versionToken([
      { role: "markdown", bytes: files.markdown },
      { role: "comments", bytes: files.comments },
      { role: "layout", bytes: files.layout },
    ]),
    metaVersion: helpers.versionToken([
      { role: "meta", bytes: files.meta },
      { role: "folderPath", bytes: utf8(folderPath) },
    ]),
  };
}

export function stateVersions(helpers: Pick<Moss.MossEditorHostModule, "versionToken">, state: NoteState) {
  return noteVersions(helpers, { ...state, markdown: state.markdown?.bytes ?? null }, state.folderPath);
}

export function locationOf(state: NoteState): Moss.MossNoteLocation {
  return {
    folderPath: state.folderPath,
    folderName: state.folderName,
    markdownName: state.markdownName ?? `${state.folderName}.md`,
  };
}
