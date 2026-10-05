// The Mac host's side of @moss-multi/editor's file bridge (API 1,
// vendor/moss-editor-contract.ts). Notes are found by meta.json id; Moss's file
// rules come from the editor release's pure host helpers, never reimplemented
// here; files move only through `applyWrite`'s verified replacement.
import { randomUUID } from "node:crypto";
import { constants } from "node:fs";
import { copyFile, link, lstat, mkdir, open, readdir, readFile, realpath, stat, unlink } from "node:fs/promises";
import { basename, dirname, extname, isAbsolute, join, relative, resolve, sep } from "node:path";
import type {
  ExperimentalHostRpcContext,
  ExperimentalHostWatchEvent,
  ExperimentalHostWatchSubscription,
} from "@get-bb/plugin-sdk/host";
import { MAX_ASSET_BYTES, MAX_NOTE_BYTES, type hostSignals } from "./contract.js";
import {
  codedError,
  errorCode,
  locationOf,
  pathExists,
  readOptional,
  stateVersions,
  type NoteState,
  type PathExchange,
} from "./editor-files.js";
import { applyWrite } from "./editor-write.js";
import { HostFileError, isInside, readAssetIn } from "./host-notes.js";
import type * as Moss from "./vendor/moss-editor-contract.js";

type HostContext = ExperimentalHostRpcContext<typeof hostSignals>;

export interface EditorHostDeps {
  helpers: Moss.MossEditorHostModule;
  paths: PathExchange;
  /** The canonical Moss workspace, ~/Moss. */
  workspaceRoot(): Promise<string>;
  uuid?(): string;
}

/** How long the id index may be reused before a lookup rescans ~/Moss/Notes. */
const INDEX_TTL_MS = 10_000;
const MAX_INDEXED_DIRECTORIES = 20_000;
/** How long a watch lasts unless an open editor renews it. */
export const WATCH_LEASE_MS = 60_000;
/** A note whose files together exceed this is refused, keeping each read well under the 8 MiB host RPC limit. */
const MAX_READ_BYTES = MAX_NOTE_BYTES + 2 * 1024 * 1024;
const ASSET_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".mp4", ".webm", ".mov"]);

type Lookup = { kind: "found"; directory: string } | { kind: "notFound" } | { kind: "duplicate" };
type Missing = { kind: "notFound" } | { kind: "notEditable"; reason: Moss.MossNotEditableReason };

function idOf(metaText: string | null): string | null {
  if (metaText === null) return null;
  try {
    const meta = JSON.parse(metaText) as unknown;
    const id = meta && typeof meta === "object" ? Reflect.get(meta, "id") : null;
    return typeof id === "string" ? id : null;
  } catch {
    return null;
  }
}

export function createEditorHost(deps: EditorHostDeps) {
  const { helpers, paths } = deps;
  const names = helpers.MOSS_NOTE_FILES;
  const uuid = deps.uuid ?? randomUUID;

  // One read or write of a note at a time, keyed by its id.
  const queues = new Map<string, Promise<void>>();
  function exclusive<T>(key: string, task: () => Promise<T>): Promise<T> {
    const result = (queues.get(key) ?? Promise.resolve()).then(task);
    const settled = result.then(
      () => undefined,
      () => undefined,
    );
    queues.set(key, settled);
    void settled.then(() => {
      if (queues.get(key) === settled) queues.delete(key);
    });
    return result;
  }

  async function keyOf(directory: string): Promise<string | null> {
    const id = idOf((await readOptional(join(directory, names.meta)))?.toString("utf8") ?? null);
    return id === null ? null : helpers.noteIdKey(id);
  }

  // id key → note folders that carry it, from the last scan of ~/Moss/Notes.
  let folders = new Map<string, string[]>();
  let scannedAt = -Infinity;

  async function scan(): Promise<void> {
    const root = join(await deps.workspaceRoot(), names.notesRoot);
    const next = new Map<string, string[]>();
    const queue = [root];
    for (let visited = 0; queue.length > 0 && visited < MAX_INDEXED_DIRECTORIES; visited += 1) {
      const directory = queue.shift()!;
      const entries = await readdir(directory, { withFileTypes: true }).catch(() => []);
      if (directory !== root && entries.some((entry) => entry.name === names.meta && entry.isFile())) {
        const key = await keyOf(directory);
        if (key !== null) next.set(key, [...(next.get(key) ?? []), directory]);
      }
      for (const entry of entries) {
        if (entry.isDirectory() && entry.name !== names.assetsDir && !entry.name.startsWith(".")) {
          queue.push(join(directory, entry.name));
        }
      }
    }
    folders = next;
    scannedAt = Date.now();
  }

  async function verified(key: string): Promise<Lookup> {
    const live: string[] = [];
    for (const directory of folders.get(key) ?? []) {
      if ((await keyOf(directory)) === key) live.push(directory);
    }
    if (live.length > 1) return { kind: "duplicate" };
    return live.length === 1 ? { kind: "found", directory: live[0]! } : { kind: "notFound" };
  }

  /** The note folder whose meta.json carries `noteId`, rescanning when the index is stale or misses, as a Moss rename moves folders. */
  async function lookup(noteId: string): Promise<Lookup> {
    const key = helpers.noteIdKey(noteId);
    if (Date.now() - scannedAt > INDEX_TTL_MS) await scan();
    const found = await verified(key);
    if (found.kind !== "notFound") return found;
    await scan();
    return verified(key);
  }

  function moved(key: string, from: string, to: string): void {
    folders.set(key, [...(folders.get(key) ?? []).filter((directory) => directory !== from), to]);
  }

  /** Moss's two-step markdown resolution: probe the candidates in order, then pick from a listing. */
  async function resolveMarkdown(directory: string, folderName: string, noteId: string): Promise<string | null> {
    for (const candidate of helpers.markdownCandidates({ folderName, noteId })) {
      if (await pathExists(join(directory, candidate))) return candidate;
    }
    const entries = await readdir(directory);
    const listed = await Promise.all(
      entries.map(async (name) => {
        const details = await stat(join(directory, name)).catch(() => null);
        return { name, isFile: details?.isFile() ?? false, mtimeMs: details?.mtimeMs ?? 0 };
      }),
    );
    return helpers.pickMarkdownFallback(listed);
  }

  async function readState(directory: string): Promise<NoteState> {
    const root = await deps.workspaceRoot();
    const within = relative(root, directory);
    const segments = within !== "" && !within.startsWith("..") && !isAbsolute(within) ? within.split(sep) : null;
    const folderName = basename(directory);
    const meta = await readOptional(join(directory, names.meta));
    const metaText = meta?.toString("utf8") ?? null;
    const markdownName = await resolveMarkdown(directory, folderName, idOf(metaText) ?? "");
    let markdown: NoteState["markdown"] = null;
    if (markdownName !== null) {
      const path = join(directory, markdownName);
      // The entry's own identity, as the write's same-file check compares it.
      const details = await lstat(path);
      markdown = { bytes: await readFile(path), dev: details.dev, ino: details.ino };
    }
    return {
      directory,
      folderName,
      folderPath: segments ? helpers.folderPathFor(segments) : "",
      markdownName,
      markdown,
      comments: await readOptional(join(directory, names.comments)),
      layout: await readOptional(join(directory, names.layout)),
      meta,
      editability: helpers.noteEditability({ workspaceSegments: segments, metaText, hasMarkdown: markdownName !== null }),
    };
  }

  async function refusalFor(state: NoteState): Promise<Moss.MossNotEditableReason | null> {
    if (state.editability.kind === "notEditable") return state.editability.reason;
    return (await paths.supports(state.directory)) ? null : "hostUnsupported";
  }

  function missing(found: Exclude<Lookup, { kind: "found" }>): Missing {
    return found.kind === "notFound" ? { kind: "notFound" } : { kind: "notEditable", reason: "duplicateId" };
  }

  /** The note's folder state when it is editable, or why it is not. */
  async function editableState(noteId: string): Promise<{ kind: "ok"; state: NoteState } | Missing> {
    const found = await lookup(noteId);
    if (found.kind !== "found") return missing(found);
    const state = await readState(found.directory);
    const reason = await refusalFor(state);
    return reason === null ? { kind: "ok", state } : { kind: "notEditable", reason };
  }

  async function companionBytes(directory: string, relativePath: string): Promise<Buffer | null> {
    const root = await realpath(directory);
    let target: string;
    try {
      target = await realpath(resolve(root, relativePath));
    } catch (error) {
      if (errorCode(error) === "ENOENT" || errorCode(error) === "ENOTDIR") return null;
      throw error;
    }
    return isInside(root, target) ? readFile(target) : null;
  }

  // Watches: one per note an editor has open, renewed by the editor and keyed by id.
  interface NoteWatch {
    key: string;
    noteId: string;
    directory: string | null;
    /** The state open editors know, so a repeat is not announced. */
    last: string;
    context: HostContext;
    subscription: Promise<ExperimentalHostWatchSubscription> | null;
    expiry: ReturnType<typeof setTimeout> | undefined;
  }
  const watches = new Map<string, NoteWatch>();

  async function currentChange(noteId: string): Promise<{ change: Moss.MossExternalChange; directory: string | null }> {
    const found = await lookup(noteId);
    if (found.kind !== "found") {
      const gone = missing(found);
      return { change: { kind: "removed", reason: gone.kind === "notFound" ? "notFound" : gone.reason }, directory: null };
    }
    const state = await readState(found.directory);
    const reason = await refusalFor(state);
    if (reason !== null) return { change: { kind: "removed", reason }, directory: found.directory };
    return { change: { kind: "changed", ...stateVersions(helpers, state) }, directory: found.directory };
  }

  async function release(subscription: Promise<ExperimentalHostWatchSubscription> | null): Promise<void> {
    await (await subscription?.catch(() => null))?.dispose();
  }

  /** Points the watch at the note's folder now, which a rename may have moved. */
  function follow(watch: NoteWatch, directory: string | null): void {
    if (watch.directory === directory) return;
    void release(watch.subscription);
    watch.subscription = null;
    watch.directory = directory;
    if (directory === null) return;
    const subscription = watch.context.experimental_watch(
      { rootPath: directory, ignoredPaths: [names.assetsDir], debounceMs: 200 },
      (event) => noteEvent(watch, event),
    );
    watch.subscription = subscription;
    subscription.catch(() => {
      // The watch could not start; renewals still report the note's state.
      if (watch.subscription === subscription) {
        watch.subscription = null;
        watch.directory = null;
      }
    });
  }

  async function stopWatch(watch: NoteWatch): Promise<void> {
    clearTimeout(watch.expiry);
    if (watches.get(watch.key) === watch) watches.delete(watch.key);
    const subscription = watch.subscription;
    watch.subscription = null;
    watch.directory = null;
    await release(subscription);
  }

  async function noteEvent(watch: NoteWatch, event: ExperimentalHostWatchEvent): Promise<void> {
    // bb's own temp and held files start with a dot; they never change the note.
    if (event.kind === "changed" && event.changes.every((change) => basename(change.path).startsWith("."))) return;
    const change = await exclusive<Moss.MossExternalChange | null>(watch.key, async () => {
      if (watches.get(watch.key) !== watch) return null;
      const { change, directory } = await currentChange(watch.noteId);
      follow(watch, directory);
      const serialized = JSON.stringify(change);
      if (serialized === watch.last) return null;
      watch.last = serialized;
      return change;
    }).catch(() => null);
    if (change !== null) await watch.context.experimental_emitSignal("editorNoteChanged", { noteId: watch.noteId, change });
  }

  return {
    async editorRead({ noteId }: { noteId: string }): Promise<Moss.MossReadResult> {
      return exclusive<Moss.MossReadResult>(helpers.noteIdKey(noteId), async () => {
        const editable = await editableState(noteId);
        if (editable.kind !== "ok") return editable;
        const { state } = editable;
        const size = (state.markdown?.bytes.length ?? 0) + (state.comments?.length ?? 0) + (state.layout?.length ?? 0) + (state.meta?.length ?? 0);
        if (size > MAX_READ_BYTES) throw codedError("EFBIG", "This note is too large to edit in bb.");
        return {
          kind: "note",
          files: {
            markdown: state.markdown!.bytes.toString("utf8"),
            comments: state.comments?.toString("utf8") ?? null,
            layout: state.layout?.toString("utf8") ?? null,
            meta: state.meta!.toString("utf8"),
          },
          location: locationOf(state),
          ...stateVersions(helpers, state),
        };
      });
    },

    async editorReadCompanion({ noteId, relativePath }: { noteId: string; relativePath: string }): Promise<Moss.MossCompanionRead> {
      return exclusive<Moss.MossCompanionRead>(helpers.noteIdKey(noteId), async () => {
        const found = await lookup(noteId);
        if (found.kind !== "found") throw codedError("ENOENT", "This note is no longer in ~/Moss/Notes.");
        const bytes = await companionBytes(found.directory, relativePath);
        const version = helpers.versionToken([{ role: "companion", bytes }]);
        return bytes === null ? { kind: "absent", version } : { kind: "file", text: bytes.toString("utf8"), version };
      });
    },

    async editorWrite({ noteId, write }: { noteId: string; write: Moss.MossNoteWrite }): Promise<Moss.MossWriteResult> {
      const key = helpers.noteIdKey(noteId);
      return exclusive<Moss.MossWriteResult>(key, async () => {
        const editable = await editableState(noteId);
        if (editable.kind !== "ok") return editable;
        const { state } = editable;
        const result = await applyWrite({ helpers, paths, uuid, readState, companionBytes }, state, write);
        if (result.kind === "saved" || result.kind === "conflict" || result.kind === "failed") {
          const directory = join(dirname(state.directory), result.location.folderName);
          if (directory !== state.directory) moved(key, state.directory, directory);
          const watch = watches.get(key);
          if (watch) {
            follow(watch, directory);
            // bb's own save is not an outside change.
            if (result.kind === "saved") {
              watch.last = JSON.stringify({ kind: "changed", version: result.version, metaVersion: result.metaVersion });
            }
          }
        }
        return result;
      });
    },

    /**
     * Watches the note for WATCH_LEASE_MS, renewed by each call, and returns its
     * state. A change made outside bb emits `editorNoteChanged` at once; the
     * state each renewal returns catches one a missed signal or a moved folder
     * would otherwise hide.
     */
    async editorWatch({ noteId }: { noteId: string }, context: HostContext): Promise<Moss.MossExternalChange> {
      const key = helpers.noteIdKey(noteId);
      return exclusive<Moss.MossExternalChange>(key, async () => {
        const { change, directory } = await currentChange(noteId);
        let watch = watches.get(key);
        if (watch === undefined) {
          watch = { key, noteId, directory: null, last: "", context, subscription: null, expiry: undefined };
          watches.set(key, watch);
        }
        const renewed = watch;
        renewed.context = context;
        renewed.last = JSON.stringify(change);
        follow(renewed, directory);
        clearTimeout(renewed.expiry);
        renewed.expiry = setTimeout(() => void stopWatch(renewed), WATCH_LEASE_MS);
        return change;
      });
    },

    async editorAssetChunk(
      { noteId, upload, offset, data }: { noteId: string; upload: string; offset: number; data: string },
      context: HostContext,
    ) {
      const editable = await editableState(noteId);
      if (editable.kind !== "ok") return editable;
      const bytes = Buffer.from(data, "base64");
      if (offset + bytes.length > MAX_ASSET_BYTES) return { kind: "refused" as const, reason: "tooLarge" as const, maxBytes: MAX_ASSET_BYTES };
      const path = stagingPath(context, upload);
      await mkdir(dirname(path), { recursive: true });
      const handle = await open(path, offset === 0 ? "w" : "r+");
      try {
        if ((await handle.stat()).size !== offset) throw codedError("EINVAL", "This upload's chunks arrived out of order.");
        await handle.write(bytes, 0, bytes.length, offset);
      } catch (error) {
        if (errorCode(error) === "ENOSPC") return { kind: "refused" as const, reason: "noSpace" as const };
        throw error;
      } finally {
        await handle.close();
      }
      return { kind: "staged" as const, size: offset + bytes.length };
    },

    async editorAssetCommit(
      { noteId, upload, name, size }: { noteId: string; upload: string; name: string; size: number },
      context: HostContext,
    ): Promise<Moss.MossAssetPutResult> {
      const staged = stagingPath(context, upload);
      try {
        return await exclusive<Moss.MossAssetPutResult>(helpers.noteIdKey(noteId), async () => {
          const editable = await editableState(noteId);
          if (editable.kind !== "ok") return editable;
          if (!ASSET_EXTENSIONS.has(extname(name).toLowerCase())) return { kind: "refused", reason: "type" };
          if ((await stat(staged).catch(() => null))?.size !== size) {
            throw codedError("EINVAL", "This upload is incomplete. Add the file again.");
          }
          return placeAsset(staged, editable.state.directory, name);
        });
      } finally {
        await unlink(staged).catch(() => undefined);
      }
    },

    /** Copies an asset from any note bb can find into this note, as a cross-note paste in Moss does. */
    async editorAssetCopy({
      noteId,
      sourceNoteId,
      sourceRef,
      name,
    }: {
      noteId: string;
      sourceNoteId: string;
      sourceRef: string;
      name: string;
    }): Promise<Moss.MossAssetPutResult> {
      return exclusive<Moss.MossAssetPutResult>(helpers.noteIdKey(noteId), async () => {
        const editable = await editableState(noteId);
        if (editable.kind !== "ok") return editable;
        if (!ASSET_EXTENSIONS.has(extname(name).toLowerCase())) return { kind: "refused", reason: "type" };
        const source = await lookup(sourceNoteId);
        if (source.kind !== "found") return { kind: "notFound" };
        const sourceRoot = await realpath(source.directory);
        const file = await realpath(resolve(sourceRoot, sourceRef)).catch(() => null);
        const details = file === null ? null : await stat(file);
        if (file === null || !isInside(sourceRoot, file) || !details?.isFile()) return { kind: "notFound" };
        if (details.size > MAX_ASSET_BYTES) return { kind: "refused", reason: "tooLarge", maxBytes: MAX_ASSET_BYTES };
        return placeAsset(file, editable.state.directory, name);
      });
    },

    /** Reads part of a media file in the note's folder; URLs carry the id, so they outlive a folder rename. */
    async editorAsset({ noteId, ...input }: { noteId: string; ref: string; offset: number; length: number }) {
      return readAssetIn(async () => {
        const found = await lookup(noteId);
        if (found.kind !== "found") throw new HostFileError("not_found", "This note is no longer in ~/Moss/Notes.");
        return realpath(found.directory);
      }, input);
    },

    /** Stops every watch, when the host worker shuts down. */
    async dispose(): Promise<void> {
      await Promise.all([...watches.values()].map(stopWatch));
    },
  };

  function stagingPath(context: HostContext, upload: string): string {
    return join(context.experimental_paths.tempDir, "moss-uploads", upload);
  }

  async function assetsDirectory(directory: string): Promise<string> {
    const path = join(directory, names.assetsDir);
    await mkdir(path, { recursive: true });
    const canonical = await realpath(path);
    if (!isInside(await realpath(directory), canonical)) throw codedError("EXDEV", "This note's assets folder is outside the note.");
    return canonical;
  }

  /** Creates `assets/<name>` exclusively from `source`; a taken name is the editor's to change. */
  async function placeAsset(source: string, directory: string, name: string): Promise<Moss.MossAssetPutResult> {
    const assets = await assetsDirectory(directory);
    const temp = join(assets, helpers.sidecarFileName(name, uuid(), "tmp"));
    try {
      await copyFile(source, temp, constants.COPYFILE_EXCL);
      await link(temp, join(assets, name));
      return { kind: "stored", ref: `assets/${name}` };
    } catch (error) {
      if (errorCode(error) === "EEXIST") return { kind: "exists" };
      if (errorCode(error) === "ENOSPC") return { kind: "refused", reason: "noSpace" };
      throw error;
    } finally {
      await unlink(temp).catch(() => undefined);
    }
  }
}

export type EditorHost = ReturnType<typeof createEditorHost>;

/** Every bridge method on a host that cannot edit: notes open read-only in the viewer. */
export function unsupportedEditorHost() {
  const unsupported = { kind: "notEditable" as const, reason: "hostUnsupported" as const };
  return {
    editorRead: async (): Promise<Moss.MossReadResult> => unsupported,
    editorReadCompanion: async (): Promise<Moss.MossCompanionRead> => {
      throw codedError("ENOTSUP", "This host cannot edit Moss notes.");
    },
    editorWrite: async (): Promise<Moss.MossWriteResult> => unsupported,
    editorWatch: async (): Promise<Moss.MossExternalChange> => ({ kind: "removed", reason: "hostUnsupported" }),
    editorAssetChunk: async () => unsupported,
    editorAssetCommit: async (): Promise<Moss.MossAssetPutResult> => unsupported,
    editorAssetCopy: async (): Promise<Moss.MossAssetPutResult> => unsupported,
    editorAsset: async () => ({ ok: false as const, code: "not_allowed" as const, message: "This host cannot edit Moss notes." }),
    dispose: async () => undefined,
  };
}
