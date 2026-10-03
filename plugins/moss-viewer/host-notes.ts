import { execFile } from "node:child_process";
import { open, readdir, readFile, realpath, stat } from "node:fs/promises";
import { homedir, platform } from "node:os";
import { basename, dirname, extname, isAbsolute, join, relative, resolve } from "node:path";
import { MAX_NOTE_BYTES, type AssetRefusal, type MossNoteEntry } from "./contract.js";

const MARKDOWN = /\.(?:md|markdown)$/i;
// The same distinctive markers file-pins uses to call a Markdown file a Moss note.
const MOSS_MARKER = /\n[ \t]{0,3}(?:(?:`{3,}|~{3,})moss-[a-z][\w-]*\b|:::tabs\b)/;
const MAX_LAYOUT_BYTES = 256 * 1024;
const MAX_LISTED_NOTES = 5000;
const MAX_LISTED_DIRECTORIES = 20000;
const LIST_TTL_MS = 10_000;

const MEDIA_TYPES: Readonly<Record<string, string>> = {
  ".apng": "image/apng",
  ".avif": "image/avif",
  ".bmp": "image/bmp",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".m4v": "video/mp4",
  ".mov": "video/quicktime",
  ".mp4": "video/mp4",
  ".ogv": "video/ogg",
  ".webm": "video/webm",
};

export class HostFileError extends Error {
  constructor(
    readonly code: AssetRefusal | "too_large",
    message: string,
  ) {
    super(message);
    this.name = "HostFileError";
  }
}

function notesRoot(): string {
  return resolve(homedir(), "Moss/Notes");
}

function isInside(root: string, path: string): boolean {
  const within = relative(root, path);
  return within !== "" && within !== ".." && !within.startsWith("../") && !isAbsolute(within);
}

async function canonicalFile(path: string): Promise<{ path: string; size: number; modifiedMs: number }> {
  if (!isAbsolute(path)) throw new HostFileError("invalid", "The file path must be absolute.");
  let canonical: string;
  try {
    canonical = await realpath(path);
  } catch {
    throw new HostFileError("not_found", `${path} is no longer available on this host.`);
  }
  const details = await stat(canonical);
  if (!details.isFile()) throw new HostFileError("invalid", `${path} is not a file.`);
  return { path: canonical, size: details.size, modifiedMs: details.mtimeMs };
}

async function canonicalNotesRoot(): Promise<string> {
  return realpath(notesRoot()).catch(() => notesRoot());
}

function hasMossMarkers(markdown: string): boolean {
  return MOSS_MARKER.test(`\n${markdown}`);
}

async function readNoteId(directory: string): Promise<string | null> {
  try {
    const meta = JSON.parse(await readFile(join(directory, "meta.json"), "utf8")) as unknown;
    const id = meta && typeof meta === "object" ? Reflect.get(meta, "id") : null;
    return typeof id === "string" && id.length > 0 && id.length <= 200 ? id : null;
  } catch {
    return null;
  }
}

async function readLayout(directory: string): Promise<unknown> {
  try {
    const path = join(directory, "layout.json");
    if ((await stat(path)).size > MAX_LAYOUT_BYTES) return null;
    return JSON.parse(await readFile(path, "utf8")) as unknown;
  } catch {
    return null;
  }
}

/** Reads a Markdown file and, when it is a Moss note, the sidecars the viewer needs. */
export async function readNote({ path }: { path: string }) {
  if (!MARKDOWN.test(path)) return { moss: false as const, path };
  const file = await canonicalFile(path);
  if (!MARKDOWN.test(file.path)) return { moss: false as const, path: file.path };
  const inNotes = isInside(await canonicalNotesRoot(), file.path);
  if (file.size > MAX_NOTE_BYTES) {
    // bb's own preview handles large Markdown; only a real Moss note is refused.
    if (!inNotes) return { moss: false as const, path: file.path };
    throw new HostFileError("too_large", "This note is too large to preview.");
  }
  const markdown = await readFile(file.path, "utf8");
  const moss = inNotes || hasMossMarkers(markdown);
  if (!moss) return { moss: false as const, path: file.path };
  const directory = dirname(file.path);
  return {
    moss: true as const,
    path: file.path,
    markdown,
    layout: await readLayout(directory),
    noteId: await readNoteId(directory),
    modifiedMs: file.modifiedMs,
  };
}

function noteFileIn(directory: string, names: readonly string[]): string | null {
  const preferred = `${basename(directory)}.md`;
  if (names.includes(preferred)) return join(directory, preferred);
  const markdown = names.filter((name) => MARKDOWN.test(name)).sort();
  return markdown.length > 0 ? join(directory, markdown[0]!) : null;
}

async function noteEntry(directory: string, names: readonly string[], root: string): Promise<MossNoteEntry | null> {
  let meta: unknown;
  try {
    meta = JSON.parse(await readFile(join(directory, "meta.json"), "utf8")) as unknown;
  } catch {
    return null;
  }
  if (!meta || typeof meta !== "object") return null;
  const id = Reflect.get(meta, "id");
  const title = Reflect.get(meta, "title");
  const folderPath = Reflect.get(meta, "folderPath");
  const updatedAt = Reflect.get(meta, "updatedAt");
  const path = noteFileIn(directory, names);
  if (typeof id !== "string" || id.length === 0 || id.length > 200 || path === null) return null;
  const parent = relative(root, dirname(directory));
  return {
    id,
    title: typeof title === "string" ? title : basename(directory),
    path,
    folderPath: typeof folderPath === "string" ? folderPath : parent ? `Notes/${parent}` : "Notes",
    ...(typeof updatedAt === "number" && Number.isFinite(updatedAt) ? { updatedAt } : {}),
  };
}

let listed: { root: string; at: number; result: { notes: MossNoteEntry[]; truncated: boolean } } | null = null;

/** Every note under ~/Moss/Notes, as wiki links name them: by title, or by the id in meta.json. */
export async function listNotes(): Promise<{ notes: MossNoteEntry[]; truncated: boolean }> {
  const root = await canonicalNotesRoot();
  if (listed?.root === root && Date.now() - listed.at < LIST_TTL_MS) return listed.result;
  const notes: MossNoteEntry[] = [];
  const queue = [root];
  let visited = 0;
  let truncated = false;
  while (queue.length > 0) {
    if (notes.length >= MAX_LISTED_NOTES || visited >= MAX_LISTED_DIRECTORIES) {
      truncated = true;
      break;
    }
    const directory = queue.shift()!;
    visited += 1;
    const entries = await readdir(directory, { withFileTypes: true }).catch(() => []);
    const names = entries.filter((entry) => entry.isFile()).map((entry) => entry.name);
    if (names.includes("meta.json")) {
      const entry = await noteEntry(directory, names, root);
      if (entry) notes.push(entry);
    }
    for (const entry of entries) {
      if (entry.isDirectory() && entry.name !== "assets" && !entry.name.startsWith(".")) {
        queue.push(join(directory, entry.name));
      }
    }
  }
  listed = { root, at: Date.now(), result: { notes, truncated } };
  return listed.result;
}

const mossNoteCache = new Map<string, { modifiedMs: number; moss: boolean }>();

async function mossNoteDirectory(notePath: string): Promise<string> {
  if (!MARKDOWN.test(notePath)) throw new HostFileError("not_allowed", "Assets load only for Moss notes.");
  const note = await canonicalFile(notePath);
  const cached = mossNoteCache.get(note.path);
  let moss = cached?.modifiedMs === note.modifiedMs ? cached.moss : null;
  if (moss === null) {
    moss =
      MARKDOWN.test(note.path) &&
      (isInside(await canonicalNotesRoot(), note.path) ||
        (note.size <= MAX_NOTE_BYTES && hasMossMarkers(await readFile(note.path, "utf8"))));
    mossNoteCache.set(note.path, { modifiedMs: note.modifiedMs, moss });
  }
  if (!moss) throw new HostFileError("not_allowed", "Assets load only for Moss notes.");
  return dirname(note.path);
}

function assetCandidates(ref: string): string[] {
  const trimmed = ref.trim().replace(/^\.\//, "");
  const candidates = [trimmed];
  try {
    const decoded = decodeURIComponent(trimmed);
    if (decoded !== trimmed) candidates.push(decoded);
  } catch {
    // Not percent-encoded; the literal reference is the only candidate.
  }
  return candidates;
}

async function readAssetChunk({
  notePath,
  ref,
  offset,
  length,
}: {
  notePath: string;
  ref: string;
  offset: number;
  length: number;
}) {
  if (/^[a-z][a-z0-9+.-]*:/i.test(ref)) {
    throw new HostFileError("not_allowed", "Only note-local media loads through this host.");
  }
  const directory = await mossNoteDirectory(notePath);
  let asset: { path: string; size: number; modifiedMs: number } | null = null;
  for (const candidate of assetCandidates(ref)) {
    const target = resolve(directory, candidate);
    if (!isInside(directory, target)) continue;
    const file = await canonicalFile(target).catch(() => null);
    if (file && isInside(directory, file.path)) {
      asset = file;
      break;
    }
  }
  if (asset === null) throw new HostFileError("not_found", `${ref} is not in this note's folder.`);
  const contentType = MEDIA_TYPES[extname(asset.path).toLowerCase()];
  if (contentType === undefined) {
    throw new HostFileError("unsupported", `${ref} is not an image or video.`);
  }
  const start = Math.min(offset, asset.size);
  const count = Math.min(length, asset.size - start);
  let data = "";
  if (count > 0) {
    const handle = await open(asset.path, "r");
    try {
      const buffer = Buffer.alloc(count);
      const { bytesRead } = await handle.read(buffer, 0, count, start);
      data = buffer.subarray(0, bytesRead).toString("base64");
    } finally {
      await handle.close();
    }
  }
  return { ok: true as const, contentType, size: asset.size, modifiedMs: asset.modifiedMs, offset: start, data };
}

/**
 * Reads part of a media file a Moss note references. The reference resolves
 * against the note's folder and must stay inside it, so this cannot read other
 * files on the host.
 */
export async function readAsset(input: { notePath: string; ref: string; offset: number; length: number }) {
  try {
    return await readAssetChunk(input);
  } catch (error) {
    if (error instanceof HostFileError && error.code !== "too_large") {
      return { ok: false as const, code: error.code, message: error.message };
    }
    throw error;
  }
}

export async function openInMoss({ path }: { path: string }): Promise<{ opened: true }> {
  if (platform() !== "darwin") {
    throw new HostFileError("unsupported", "Moss notes open in Moss only on a Mac with the Moss app installed.");
  }
  if (!MARKDOWN.test(path)) throw new HostFileError("invalid", "Only Markdown notes open in Moss.");
  const file = await canonicalFile(path);
  await new Promise<void>((accept, reject) => {
    execFile("/usr/bin/open", ["-a", "Moss", file.path], { timeout: 15_000 }, (error) => {
      if (error) reject(new HostFileError("unsupported", "Moss could not open this note. Check that Moss is installed on this Mac."));
      else accept();
    });
  });
  return { opened: true };
}
