// Test stand-ins for what the host gets from elsewhere: moss-multi's pure host
// helpers (moss-editor-host.js, not yet released) and the Mac's atomic exchange.
// They follow the contract's descriptions closely enough to exercise bb's own
// code; the real helpers replace them once the editor release is vendored.
import { createHash } from "node:crypto";
import { lstat, rename } from "node:fs/promises";
import type { PathExchange } from "../editor-files.js";
import type * as Moss from "../vendor/moss-editor-contract.js";

const NOTE_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const notEditable = (reason: Moss.MossNotEditableReason): Moss.MossEditability => ({ kind: "notEditable", reason });

export const hostHelpers: Moss.MossEditorHostModule = {
  MOSS_EDITOR_API: 1,
  MOSS_EDITOR_INFO: { api: 1, version: "0.0.0-test", features: [] },
  MOSS_NOTE_FILES: {
    notesRoot: "Notes",
    trashRoot: "Trash",
    externalFolder: "External",
    meta: "meta.json",
    comments: "comments.json",
    layout: "layout.json",
    legacyMarkdown: "note.md",
    folderMeta: ".folder.json",
    assetsDir: "assets",
  },
  isMossNoteId: (value) => NOTE_ID.test(value.trim()),
  noteIdKey: (noteId) => noteId.trim(),
  markdownCandidates: ({ folderName, noteId }) => [...new Set([`${folderName.trim() || "Untitled"}.md`, `${noteId.trim()}.md`, "note.md"])],
  pickMarkdownFallback: (entries) => {
    const markdown = entries.filter((entry) => entry.isFile && /\.(?:md|markdown)$/i.test(entry.name));
    const sorted = [...markdown].sort((left, right) => right.mtimeMs - left.mtimeMs || left.name.localeCompare(right.name));
    return sorted[0]?.name ?? null;
  },
  allocateFolderName: ({ desiredName, currentName, siblingNames, caseInsensitive }) => {
    const same = (left: string, right: string) => (caseInsensitive ? left.toLowerCase() === right.toLowerCase() : left === right);
    if (same(desiredName, currentName)) return desiredName;
    const taken = (name: string) => siblingNames.some((sibling) => same(sibling, name));
    let candidate = desiredName;
    for (let index = 1; taken(candidate); index += 1) candidate = `${desiredName} (${index})`;
    return candidate;
  },
  folderPathFor: (segments) => segments.slice(0, -1).join("/"),
  sidecarFileName: (targetName, uuid, suffix) => `.${targetName}.${uuid}.${suffix}`,
  versionToken: (parts) => {
    const hash = createHash("sha256");
    for (const { role, bytes } of parts) {
      hash.update(`${role}\0`);
      if (bytes === null) hash.update("-");
      else hash.update(`${bytes.length}\0`).update(bytes);
      hash.update("\0");
    }
    return `sha256:${hash.digest("hex")}`;
  },
  noteEditability: ({ workspaceSegments, metaText, hasMarkdown }) => {
    if (workspaceSegments?.[0] === "Trash") return notEditable("trashed");
    if (!workspaceSegments || workspaceSegments[0] !== "Notes" || workspaceSegments.length < 2) return notEditable("outsideNotes");
    if (workspaceSegments[1] === "External") return notEditable("external");
    if (metaText === null) return notEditable("unadopted");
    let meta: unknown;
    try {
      meta = JSON.parse(metaText);
    } catch {
      return notEditable("unreadableMeta");
    }
    if (!meta || typeof meta !== "object" || Array.isArray(meta)) return notEditable("unreadableMeta");
    const fields = meta as Record<string, unknown>;
    if (typeof fields.id !== "string" || !NOTE_ID.test(fields.id.trim())) return notEditable("unadopted");
    if (fields.trashedAt != null) return notEditable("trashed");
    if (fields.systemNoteType === "external" || fields.externalFilePath) return notEditable("external");
    return hasMarkdown ? { kind: "editable" } : notEditable("noMarkdown");
  },
};

type Hook = (first: string, second: string) => Promise<void> | void;

/**
 * An exchange made of plain renames: not atomic, which is fine in a test with
 * no other writer, but each side can be interrupted to play one.
 */
export class TestPaths implements PathExchange {
  supported = true;
  /** Runs just before an exchange, as if another writer landed after the host's check. */
  before: Hook | null = null;
  /** Runs just after an exchange, as if another writer landed right after it. */
  after: Hook | null = null;
  /** Makes the next exchange fail with this code, as an I/O error would. */
  failNext: string | null = null;

  async exchange(first: string, second: string): Promise<void> {
    await this.before?.(first, second);
    if (this.failNext !== null) {
      const code = this.failNext;
      this.failNext = null;
      throw Object.assign(new Error(`${code}: exchange failed`), { code });
    }
    await lstat(first);
    await lstat(second);
    const aside = `${first}.swapping`;
    await rename(first, aside);
    await rename(second, first);
    await rename(aside, second);
    await this.after?.(first, second);
  }

  async renameExclusive(from: string, to: string): Promise<void> {
    if (await lstat(to).then(() => true, () => false)) throw Object.assign(new Error(`EEXIST: ${to}`), { code: "EEXIST" });
    await rename(from, to);
  }

  async supports(): Promise<boolean> {
    return this.supported;
  }
}
