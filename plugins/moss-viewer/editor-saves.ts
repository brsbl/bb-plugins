// Edits that must outlive an editor mount, kept on the bb server: each note's
// last save receipt, so a save Moss later replaces can be restored, and the
// draft an unmount had to leave unsaved (moss-multi's contract §5.5 and
// `unmount` returning `kept`).
import type { BbPluginApi } from "@get-bb/plugin-sdk";
import type * as Moss from "./vendor/moss-editor-host/contract.js";

/** How long bb keeps a receipt or draft after it was last written. */
export const KEEP_MS = 30 * 24 * 60 * 60 * 1000;

export type SavedKind = "receipt" | "draft";

export function editorSaves(bb: BbPluginApi) {
  const db = bb.storage.database();
  bb.storage.migrate(db, [
    `CREATE TABLE editor_saves (
      host_id TEXT NOT NULL,
      note_id TEXT NOT NULL,
      kind TEXT NOT NULL CHECK (kind IN ('receipt', 'draft')),
      draft TEXT NOT NULL,
      kept_at INTEGER NOT NULL,
      PRIMARY KEY (host_id, note_id, kind)
    )`,
  ]);
  const upsert = db.prepare(
    `INSERT INTO editor_saves (host_id, note_id, kind, draft, kept_at) VALUES (?, ?, ?, ?, ?)
     ON CONFLICT (host_id, note_id, kind) DO UPDATE SET draft = excluded.draft, kept_at = excluded.kept_at`,
  );
  const select = db.prepare(`SELECT kind, draft FROM editor_saves WHERE host_id = ? AND note_id = ? AND kept_at >= ?`);
  const remove = db.prepare(`DELETE FROM editor_saves WHERE host_id = ? AND note_id = ? AND kind = ?`);
  const prune = db.prepare(`DELETE FROM editor_saves WHERE kept_at < ?`);

  return {
    /** Keeps the latest receipt or draft for a note, replacing the one before. */
    keep(hostId: string, noteId: string, kind: SavedKind, draft: Moss.MossDraft): void {
      const now = Date.now();
      prune.run(now - KEEP_MS);
      upsert.run(hostId, noteId, kind, JSON.stringify(draft), now);
    },
    kept(hostId: string, noteId: string): Record<SavedKind, Moss.MossDraft | null> {
      const kept: Record<SavedKind, Moss.MossDraft | null> = { receipt: null, draft: null };
      const rows = select.all(hostId, noteId, Date.now() - KEEP_MS) as Array<{ kind: SavedKind; draft: string }>;
      for (const row of rows) kept[row.kind] = JSON.parse(row.draft) as Moss.MossDraft;
      return kept;
    },
    forget(hostId: string, noteId: string, kind: SavedKind): void {
      remove.run(hostId, noteId, kind);
    },
  };
}
