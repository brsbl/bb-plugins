// Share with Agent: the panel puts a mention of the note in its thread's
// composer, and the mention resolves at send time to the note's path on its
// host plus the text the user had selected. moss-multi's viewer and editor
// hide Moss's own Share with Agent, so the panel's header owns the button.
import { randomUUID } from "node:crypto";
import type { BbPluginApi } from "@get-bb/plugin-sdk";
import { SHARE_PROVIDER } from "./share.js";
import { database } from "./storage.js";

/** How long a shared note's mention stays resolvable in an unsent draft. */
export const SHARE_KEEP_MS = 30 * 24 * 60 * 60 * 1000;

export interface SharedNote {
  hostId: string;
  path: string;
  title: string;
  noteId: string | null;
  selection: string | null;
}

/** The prompt input the agent receives, after Moss's own Share with Agent prompt. */
export function shareContext(note: SharedNote, hostName: string): string {
  const host = hostName === note.hostId ? `host \`${note.hostId}\`` : `${hostName} (host \`${note.hostId}\`)`;
  const lines = [
    "The user shared a Moss note with you from bb's Moss Viewer. Moss is a local Markdown notes app the user and agents both read and write.",
    "",
    `- Note: \`${note.title}\``,
    `- File: \`${note.path}\` on ${host}. If you run on another machine, the file is on that one, not yours.`,
  ];
  if (note.noteId !== null) lines.push(`- Moss link: \`[[${note.title}|${note.noteId}]]\``);
  if (note.selection !== null) {
    lines.push("", "The user selected this text in the note:", "", ...note.selection.split("\n").map((line) => `> ${line}`));
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
    `INSERT INTO shared_notes (id, host_id, path, title, note_id, selection, shared_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
  );
  const select = db.prepare(`SELECT host_id, path, title, note_id, selection FROM shared_notes WHERE id = ? AND shared_at >= ?`);
  const prune = db.prepare(`DELETE FROM shared_notes WHERE shared_at < ?`);

  return {
    share(note: SharedNote): string {
      const now = Date.now();
      prune.run(now - SHARE_KEEP_MS);
      const id = randomUUID();
      insert.run(id, note.hostId, note.path, note.title, note.noteId, note.selection, now);
      return id;
    },
    get(id: string): SharedNote | null {
      const row = select.get(id, Date.now() - SHARE_KEEP_MS) as
        | { host_id: string; path: string; title: string; note_id: string | null; selection: string | null }
        | undefined;
      return row ? { hostId: row.host_id, path: row.path, title: row.title, noteId: row.note_id, selection: row.selection } : null;
    },
  };
}

export function registerShareProvider(bb: BbPluginApi, shares: ReturnType<typeof sharedNotes>): void {
  bb.ui.registerMentionProvider({
    id: SHARE_PROVIDER,
    label: "Moss notes",
    // Pills come only from the panel's Share with Agent button.
    search: () => [],
    async resolve(id) {
      const note = shares.get(id);
      if (note === null) throw new Error("This shared Moss note has expired. Share it again from the note's panel.");
      const hosts = await bb.sdk.hosts.list().catch(() => []);
      return { context: shareContext(note, hosts.find((machine) => machine.id === note.hostId)?.name ?? note.hostId) };
    },
  });
}
