// Edits that must outlive an editor mount, kept on the bb server: each note's
// last save receipt, so a save Moss later replaces can be restored, and the
// draft an unmount had to leave unsaved (moss-multi's contract §5.5 and
// `unmount` returning `kept`).
import type { BbPluginApi } from "@get-bb/plugin-sdk";
import { database } from "./storage.js";
import type * as Moss from "./vendor/moss-editor.contract.js";

/** How long bb keeps a receipt or draft after it was last written. */
export const KEEP_MS = 30 * 24 * 60 * 60 * 1000;

export type SavedKind = "receipt" | "draft";

export function editorSaves(bb: BbPluginApi) {
  const db = database(bb);
  const upsert = db.prepare(
    `INSERT INTO editor_saves (host_id, note_id, kind, draft, version, kept_at) VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT (host_id, note_id, kind) DO UPDATE SET draft = excluded.draft, version = excluded.version, kept_at = excluded.kept_at`,
  );
  const select = db.prepare(`SELECT kind, draft, version FROM editor_saves WHERE host_id = ? AND note_id = ? AND kept_at >= ?`);
  const remove = db.prepare(`DELETE FROM editor_saves WHERE host_id = ? AND note_id = ? AND kind = ?`);
  const prune = db.prepare(`DELETE FROM editor_saves WHERE kept_at < ?`);

  return {
    /** Keeps the latest receipt (with the version its save produced) or draft for a note, replacing the one before. */
    keep(hostId: string, noteId: string, kind: SavedKind, draft: Moss.MossDraft, version: string | null): void {
      const now = Date.now();
      prune.run(now - KEEP_MS);
      upsert.run(hostId, noteId, kind, JSON.stringify(draft), kind === "receipt" ? version : null, now);
    },
    kept(hostId: string, noteId: string): { receipt: Moss.MossDraft | null; receiptVersion: string | null; draft: Moss.MossDraft | null } {
      const kept = { receipt: null as Moss.MossDraft | null, receiptVersion: null as string | null, draft: null as Moss.MossDraft | null };
      const rows = select.all(hostId, noteId, Date.now() - KEEP_MS) as Array<{ kind: SavedKind; draft: string; version: string | null }>;
      for (const row of rows) {
        const draft = JSON.parse(row.draft) as Moss.MossDraft;
        if (row.kind === "draft") kept.draft = draft;
        else Object.assign(kept, { receipt: draft, receiptVersion: row.version });
      }
      return kept;
    },
    forget(hostId: string, noteId: string, kind: SavedKind): void {
      remove.run(hostId, noteId, kind);
    },
  };
}
