import { createHash, randomBytes } from "node:crypto";
import { constants } from "node:fs";
import { copyFile, mkdir, open, realpath, rename, stat, unlink } from "node:fs/promises";
import { basename, dirname, extname, join } from "node:path";
import type {
  ExperimentalHostRpcContext,
  ExperimentalHostWatchEvent,
  ExperimentalHostWatchSubscription,
} from "@get-bb/plugin-sdk/host";
import {
  MAX_ASSET_BYTES,
  MAX_NOTE_BYTES,
  MAX_SIDECAR_BYTES,
  type NoteFiles,
  type SaveResult,
  type hostSignals,
} from "./contract.js";
import { HostFileError, MEDIA_TYPES, canonicalFile, canonicalNotesRoot, isEditablePath, isInside } from "./host-notes.js";

type HostContext = ExperimentalHostRpcContext<typeof hostSignals>;

/** A note's files, in the order a save puts them in place: sidecars before the Markdown that refers to them. */
const FILES = ["layout", "comments", "markdown"] as const;
type FileKey = (typeof FILES)[number];
type NoteBytes = Record<FileKey, Buffer | null> & { markdown: Buffer };
const SIDECARS = { layout: "layout.json", comments: "comments.json" } as const;

/** How long a watch lasts unless an open editor renews it. */
export const WATCH_LEASE_MS = 60_000;

interface EditableNote {
  path: string;
  directory: string;
}

const errorCode = (error: unknown) => (error as NodeJS.ErrnoException | null)?.code;

async function editableNote(path: string): Promise<EditableNote> {
  const file = await canonicalFile(path);
  if (!isEditablePath(file.path, await canonicalNotesRoot())) {
    throw new HostFileError("not_allowed", "Only notes in ~/Moss/Notes can be edited in bb.");
  }
  return { path: file.path, directory: dirname(file.path) };
}

function fileOf(note: EditableNote, key: FileKey): string {
  return key === "markdown" ? note.path : join(note.directory, SIDECARS[key]);
}

/** A regular file's bytes, or null when there is none. A symlink is refused rather than followed out of the note. */
async function readPlainFile(path: string, limit: number, label: string): Promise<Buffer | null> {
  const handle = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW).catch((error: unknown) => {
    if (errorCode(error) === "ENOENT") return null;
    if (errorCode(error) === "ELOOP") throw new HostFileError("unsupported", `${label} is a link, so the note stays read-only.`);
    throw error;
  });
  if (handle === null) return null;
  try {
    const details = await handle.stat();
    if (!details.isFile()) throw new HostFileError("unsupported", `${label} is not a file, so the note stays read-only.`);
    if (details.size > limit) throw new HostFileError("too_large", `${label} is too large to edit in bb.`);
    return await handle.readFile();
  } finally {
    await handle.close();
  }
}

async function readNoteBytes(note: EditableNote): Promise<NoteBytes> {
  const markdown = await readPlainFile(note.path, MAX_NOTE_BYTES, "This note");
  if (markdown === null) throw new HostFileError("not_found", `${note.path} is no longer available on this host.`);
  return {
    markdown,
    layout: await readPlainFile(fileOf(note, "layout"), MAX_SIDECAR_BYTES, "This note's layout.json"),
    comments: await readPlainFile(fileOf(note, "comments"), MAX_SIDECAR_BYTES, "This note's comments.json"),
  };
}

/** One hash over the three files, so a change to any of them, or a sidecar appearing or going, is a new version. */
export function noteVersion(files: Record<FileKey, Uint8Array | null>): string {
  const hash = createHash("sha256");
  for (const key of FILES) {
    const bytes = files[key];
    if (bytes === null) hash.update(`${key}:none\0`);
    else hash.update(`${key}:${bytes.length}\0`).update(bytes);
  }
  return hash.digest("hex");
}

// Moss writes UTF-8. Anything else would not survive the round trip, so it stays read-only. A BOM is kept.
const utf8 = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true });

function decode(bytes: Buffer, label: string): string {
  try {
    return utf8.decode(bytes);
  } catch {
    throw new HostFileError("unsupported", `${label} is not UTF-8 text, so the note stays read-only.`);
  }
}

const queues = new Map<string, Promise<void>>();

/** Runs one read or write of a note at a time, so a save never interleaves with another save or a version check. */
function exclusive<T>(path: string, task: () => Promise<T>): Promise<T> {
  const result = (queues.get(path) ?? Promise.resolve()).then(task);
  const settled = result.then(
    () => undefined,
    () => undefined,
  );
  queues.set(path, settled);
  void settled.then(() => {
    if (queues.get(path) === settled) queues.delete(path);
  });
  return result;
}

/** An editable note's Markdown, layout.json and comments.json, exactly as on disk, with their version. */
export async function readNoteFiles({ path }: { path: string }): Promise<NoteFiles> {
  const note = await editableNote(path);
  const files = await exclusive(note.path, () => readNoteBytes(note));
  return {
    path: note.path,
    markdown: decode(files.markdown, "This note"),
    layout: files.layout && decode(files.layout, "This note's layout.json"),
    comments: files.comments && decode(files.comments, "This note's comments.json"),
    version: noteVersion(files),
  };
}

function sameBytes(left: Buffer | null, right: Buffer | null): boolean {
  return left === null || right === null ? left === right : left.equals(right);
}

async function syncDirectory(directory: string): Promise<void> {
  const handle = await open(directory, "r").catch(() => null);
  try {
    await handle?.sync();
  } catch {
    // Not every file system flushes a directory; the renames are atomic either way.
  } finally {
    await handle?.close();
  }
}

/**
 * Writes each changed file beside its target and flushes it, then renames them
 * all into place, so Moss never reads a half-written file. A last version check
 * just before the renames lets a change that landed meanwhile win. Returns the
 * version on disk when that happened, or null once the files are in place.
 */
async function replaceFiles(note: EditableNote, keys: readonly FileKey[], next: NoteBytes, expected: string): Promise<string | null> {
  const staged = new Map<string, string>();
  try {
    for (const key of keys) {
      const bytes = next[key];
      if (bytes === null) continue;
      const target = fileOf(note, key);
      const mode = await stat(target).then(
        (details) => details.mode & 0o777,
        () => 0o644,
      );
      const temp = join(note.directory, `.${basename(target)}.bb-${randomBytes(6).toString("hex")}.tmp`);
      const handle = await open(temp, "wx", mode);
      staged.set(target, temp);
      try {
        await handle.writeFile(bytes);
        // The process umask may have narrowed the mode the file was created with.
        await handle.chmod(mode);
        await handle.sync();
      } finally {
        await handle.close();
      }
    }
    const latest = noteVersion(await readNoteBytes(note));
    if (latest !== expected) return latest;
    for (const key of keys) {
      const target = fileOf(note, key);
      const temp = staged.get(target);
      if (temp === undefined) {
        await unlink(target).catch((error: unknown) => {
          if (errorCode(error) !== "ENOENT") throw error;
        });
      } else {
        await rename(temp, target);
        staged.delete(target);
      }
    }
    await syncDirectory(note.directory);
    return null;
  } finally {
    await Promise.all([...staged.values()].map((temp) => unlink(temp).catch(() => undefined)));
  }
}

function nextBytes(current: Buffer | null, change: string | null | undefined): Buffer | null {
  if (change === undefined) return current;
  return change === null ? null : Buffer.from(change, "utf8");
}

/**
 * Saves an editable note's changed files, unless any of the three changed since
 * `baseVersion`: then nothing is written and the caller learns the version on disk.
 */
export async function writeNoteFiles({
  path,
  baseVersion,
  files,
}: {
  path: string;
  baseVersion: string;
  files: { markdown?: string; layout?: string | null; comments?: string | null };
}): Promise<SaveResult> {
  const note = await editableNote(path);
  return exclusive(note.path, async () => {
    const current = await readNoteBytes(note);
    const currentVersion = noteVersion(current);
    if (currentVersion !== baseVersion) return { status: "conflict", version: currentVersion };
    const next: NoteBytes = {
      markdown: files.markdown === undefined ? current.markdown : Buffer.from(files.markdown, "utf8"),
      layout: nextBytes(current.layout, files.layout),
      comments: nextBytes(current.comments, files.comments),
    };
    if (next.markdown.length > MAX_NOTE_BYTES) throw new HostFileError("too_large", "This note is too large to save from bb.");
    for (const key of ["layout", "comments"] as const) {
      if ((next[key]?.length ?? 0) > MAX_SIDECAR_BYTES) {
        throw new HostFileError("too_large", `This note's ${SIDECARS[key]} is too large to save from bb.`);
      }
    }
    const changed = FILES.filter((key) => !sameBytes(current[key], next[key]));
    if (changed.length > 0) {
      const conflict = await replaceFiles(note, changed, next, currentVersion);
      if (conflict !== null) return { status: "conflict", version: conflict };
    }
    const version = noteVersion(next);
    // bb's own save is not an outside change.
    const watch = watches.get(note.path);
    if (watch) watch.version = version;
    return { status: "saved", version };
  });
}

interface NoteWatch {
  note: EditableNote;
  /** The version open editors know, from the last watch renewal, save or signal. */
  version: string | null;
  context: HostContext;
  subscription: Promise<ExperimentalHostWatchSubscription> | null;
  expiry: ReturnType<typeof setTimeout> | undefined;
}

const watches = new Map<string, NoteWatch>();

async function stopWatch(watch: NoteWatch): Promise<void> {
  clearTimeout(watch.expiry);
  if (watches.get(watch.note.path) === watch) watches.delete(watch.note.path);
  const subscription = await watch.subscription?.catch(() => null);
  await subscription?.dispose();
}

/** Stops every watch, when the host worker shuts down. */
export async function stopWatches(): Promise<void> {
  await Promise.all([...watches.values()].map(stopWatch));
}

function touchesNote(watch: NoteWatch, event: ExperimentalHostWatchEvent): boolean {
  if (event.kind !== "changed") return true;
  const names = new Set([basename(watch.note.path), SIDECARS.layout, SIDECARS.comments]);
  return event.changes.some((change) => names.has(basename(change.path)));
}

async function noteEvent(watch: NoteWatch, event: ExperimentalHostWatchEvent): Promise<void> {
  if (!touchesNote(watch, event)) return;
  const changed = await exclusive(watch.note.path, async () => {
    const version = await readNoteBytes(watch.note).then(noteVersion, () => null);
    if (watches.get(watch.note.path) !== watch || version === watch.version) return false;
    watch.version = version;
    return true;
  });
  if (changed) await watch.context.experimental_emitSignal("noteChanged", { path: watch.note.path, version: watch.version });
}

/**
 * Watches an editable note's folder for WATCH_LEASE_MS, renewed by each call, and
 * returns its version. A change made outside bb emits `noteChanged`, so an open
 * editor learns of it at once; the version each renewal returns catches one a
 * dropped signal missed.
 */
export async function watchNote({ path }: { path: string }, context: HostContext): Promise<{ version: string }> {
  const note = await editableNote(path);
  const version = noteVersion(await exclusive(note.path, () => readNoteBytes(note)));
  let watch = watches.get(note.path);
  if (watch === undefined) {
    const created: NoteWatch = { note, version, context, subscription: null, expiry: undefined };
    watches.set(note.path, created);
    created.subscription = context.experimental_watch(
      { rootPath: note.directory, ignoredPaths: ["assets"], debounceMs: 150 },
      (event) => noteEvent(created, event),
    );
    try {
      await created.subscription;
    } catch (error) {
      await stopWatch(created);
      throw error;
    }
    watch = created;
  }
  const renewed = watch;
  renewed.version = version;
  renewed.context = context;
  clearTimeout(renewed.expiry);
  renewed.expiry = setTimeout(() => void stopWatch(renewed), WATCH_LEASE_MS);
  return { version };
}

/** A safe name for a new asset: the last segment of `name`, its extension a supported image or video. */
export function assetFileName(name: string): string {
  const last = name.split(/[\\/]/).pop() ?? "";
  const extension = extname(last).toLowerCase();
  if (MEDIA_TYPES[extension] === undefined) {
    throw new HostFileError("unsupported", `${last || name} is not an image or video.`);
  }
  const stem = last
    .slice(0, last.length - extension.length)
    .normalize("NFC")
    .replace(/[^\p{L}\p{N}._-]+/gu, "-")
    .replace(/^[-.]+|[-.]+$/g, "")
    .slice(0, 100);
  return `${stem || "file"}${extension}`;
}

function refusal(error: unknown) {
  if (error instanceof HostFileError) return { ok: false as const, code: error.code, message: error.message };
  if (errorCode(error) === "ENOENT") {
    return { ok: false as const, code: "invalid" as const, message: "This upload is no longer available. Add the file again." };
  }
  throw error;
}

function stagingPath(context: HostContext, upload: string): string {
  return join(context.experimental_paths.tempDir, "moss-uploads", upload);
}

/** Stages one chunk of a new asset in the worker's temp folder; the note's folder is untouched until commit. */
export async function writeAssetChunk(
  { notePath, upload, offset, data }: { notePath: string; upload: string; offset: number; data: string },
  context: HostContext,
) {
  try {
    await editableNote(notePath);
    const bytes = Buffer.from(data, "base64");
    if (offset + bytes.length > MAX_ASSET_BYTES) {
      throw new HostFileError("too_large", `Files over ${MAX_ASSET_BYTES / 1024 / 1024} MB can't be added from bb.`);
    }
    const path = stagingPath(context, upload);
    await mkdir(dirname(path), { recursive: true });
    const handle = await open(path, offset === 0 ? "w" : "r+");
    try {
      if ((await handle.stat()).size !== offset) throw new HostFileError("invalid", "This upload's chunks arrived out of order.");
      await handle.write(bytes, 0, bytes.length, offset);
    } finally {
      await handle.close();
    }
    return { ok: true as const, size: offset + bytes.length };
  } catch (error) {
    return refusal(error);
  }
}

async function assetsDirectory(note: EditableNote): Promise<string> {
  const path = join(note.directory, "assets");
  try {
    await mkdir(path, { recursive: true });
  } catch (error) {
    if (errorCode(error) === "EEXIST" || errorCode(error) === "ENOTDIR") {
      throw new HostFileError("invalid", "This note's assets is not a folder.");
    }
    throw error;
  }
  const canonical = await realpath(path);
  if (!isInside(note.directory, canonical)) throw new HostFileError("not_allowed", "This note's assets folder is outside the note.");
  return canonical;
}

/** Copies without replacing anything: a taken name gets -2, -3, … before its extension. */
async function copyUnique(source: string, directory: string, name: string): Promise<string> {
  const extension = extname(name);
  const stem = name.slice(0, name.length - extension.length);
  for (let index = 1; index < 1000; index += 1) {
    const candidate = index === 1 ? name : `${stem}-${index}${extension}`;
    const target = join(directory, candidate);
    try {
      await copyFile(source, target, constants.COPYFILE_EXCL);
      return candidate;
    } catch (error) {
      if (errorCode(error) === "EEXIST") continue;
      await unlink(target).catch(() => undefined);
      throw error;
    }
  }
  throw new HostFileError("invalid", `This note already has too many files named ${name}.`);
}

/**
 * Moves a fully staged upload into the note's assets/ folder under a free name,
 * and returns the note-relative reference the editor writes into the note.
 */
export async function commitAsset(
  { notePath, upload, name, size }: { notePath: string; upload: string; name: string; size: number },
  context: HostContext,
) {
  const staged = stagingPath(context, upload);
  try {
    const note = await editableNote(notePath);
    const fileName = assetFileName(name);
    const details = await stat(staged).catch(() => null);
    if (details?.size !== size) throw new HostFileError("invalid", "This upload is incomplete. Add the file again.");
    return { ok: true as const, ref: `assets/${await copyUnique(staged, await assetsDirectory(note), fileName)}` };
  } catch (error) {
    return refusal(error);
  } finally {
    await unlink(staged).catch(() => undefined);
  }
}
