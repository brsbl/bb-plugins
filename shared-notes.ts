// Send to agent: the note panel's header button puts a mention of the note
// in the panel's thread's composer, and the mention resolves at
// send time to the note's path on its host plus the selection: its markdown,
// its lines in the file, and the headings over it.
import { randomUUID } from "node:crypto";
import type { BbPluginApi } from "@get-bb/plugin-sdk";
import { SHARE_PROVIDER, type SharedSelection } from "./share.js";
import { database } from "./storage.js";

/** How long a shared note's mention stays resolvable in an unsent draft. */
export const SHARE_KEEP_MS = 30 * 24 * 60 * 60 * 1000;

export interface SharedNote {
  hostId: string;
  path: string;
  title: string;
  noteId: string | null;
  selection: SharedSelection | null;
}

/** A kept selection; one shared before line ranges has only its text. */
type KeptSelection = Omit<SharedSelection, "lines"> & { lines: SharedSelection["lines"] | null };
type KeptNote = Omit<SharedNote, "selection"> & { selection: KeptSelection | null };

const lineRange = ({ start, end }: SharedSelection["lines"]) => (start === end ? `line ${start}` : `lines ${start}–${end}`);

/** Where a selection is: its lines in the file and the headings over it. */
function selectionPlace({ lines, headings }: KeptSelection): string {
  if (lines === null) return "this text in the note";
  return headings.length === 0 ? `${lineRange(lines)} of the file` : `${lineRange(lines)} of the file, under “${headings.join(" › ")}”`;
}

/** The prompt input the agent receives, after Moss's own Share with Agent prompt. */
export function shareContext(note: KeptNote, hostName: string): string {
  const host = hostName === note.hostId ? `host \`${note.hostId}\`` : `${hostName} (host \`${note.hostId}\`)`;
  const lines = [
    "The user shared a Moss note with you from bb's Moss Viewer. Moss is a local Markdown notes app the user and agents both read and write.",
    "",
    `- Note: \`${note.title}\``,
    `- File: \`${note.path}\` on ${host}. If you run on another machine, the file is on that one, not yours.`,
  ];
  if (note.noteId !== null) lines.push(`- Moss link: \`[[${note.title}|${note.noteId}]]\``);
  const selection = note.selection;
  if (selection !== null) {
    lines.push("", `The user selected ${selectionPlace(selection)}:`, "", ...selection.markdown.split("\n").map((line) => `> ${line}`));
    if (selection.truncated) {
      const rest = selection.lines === null ? "" : ` (${lineRange(selection.lines)})`;
      lines.push("", `The selection is truncated; read the rest from the file${rest}.`);
    }
  }
  lines.push(
    "",
    "Before editing a Moss note, read `~/Moss/.moss/skills/writing-guidelines.md` and `notes.md` on the note's host, then the focused modules there as needed.",
  );
  return lines.join("\n");
}

export function sharedNotes(bb: BbPluginApi) {
  const db = database(bb);
  const insert = db.prepare(
    `INSERT INTO shared_notes (id, host_id, path, title, note_id, selection, selection_place, shared_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  const select = db.prepare(
    `SELECT host_id, path, title, note_id, selection, selection_place FROM shared_notes WHERE id = ? AND shared_at >= ?`,
  );
  const prune = db.prepare(`DELETE FROM shared_notes WHERE shared_at < ?`);

  return {
    share(note: SharedNote): string {
      const now = Date.now();
      prune.run(now - SHARE_KEEP_MS);
      const id = randomUUID();
      const { selection } = note;
      const place = selection === null ? null : JSON.stringify({ lines: selection.lines, headings: selection.headings, truncated: selection.truncated });
      insert.run(id, note.hostId, note.path, note.title, note.noteId, selection?.markdown ?? null, place, now);
      return id;
    },
    get(id: string): KeptNote | null {
      const row = select.get(id, Date.now() - SHARE_KEEP_MS) as
        | { host_id: string; path: string; title: string; note_id: string | null; selection: string | null; selection_place: string | null }
        | undefined;
      if (!row) return null;
      const place = row.selection_place === null ? null : (JSON.parse(row.selection_place) as Omit<SharedSelection, "markdown">);
      const selection: KeptSelection | null =
        row.selection === null ? null : { markdown: row.selection, lines: null, headings: [], truncated: false, ...place };
      return { hostId: row.host_id, path: row.path, title: row.title, noteId: row.note_id, selection };
    },
  };
}

export function registerShareProvider(bb: BbPluginApi, shares: ReturnType<typeof sharedNotes>): void {
  bb.ui.registerMentionProvider({
    id: SHARE_PROVIDER,
    label: "Moss notes",
    // Pills come only from the panel's Send to agent button.
    search: () => [],
    async resolve(id) {
      const note = shares.get(id);
      if (note === null) throw new Error("This shared Moss note has expired. Share it again from the note's panel.");
      const hosts = await bb.sdk.hosts.list().catch(() => []);
      return { context: shareContext(note, hosts.find((machine) => machine.id === note.hostId)?.name ?? note.hostId) };
    },
  });
}
