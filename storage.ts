// The plugin's database. `bb.storage.migrate` numbers statements by their index,
// so every table shares this one append-only list.
import type { BbPluginApi } from "@get-bb/plugin-sdk";

export const MIGRATIONS = [
  `CREATE TABLE editor_saves (
      host_id TEXT NOT NULL,
      note_id TEXT NOT NULL,
      kind TEXT NOT NULL CHECK (kind IN ('receipt', 'draft')),
      draft TEXT NOT NULL,
      -- For a receipt, the version the save produced; null for a draft.
      version TEXT,
      kept_at INTEGER NOT NULL,
      PRIMARY KEY (host_id, note_id, kind)
    )`,
  `CREATE TABLE shared_notes (
      id TEXT PRIMARY KEY,
      host_id TEXT NOT NULL,
      path TEXT NOT NULL,
      title TEXT NOT NULL,
      note_id TEXT,
      selection TEXT,
      shared_at INTEGER NOT NULL
    )`,
  // Where a shared selection is in the note, as JSON `{lines, headings, truncated}`; null for pills shared before it.
  `ALTER TABLE shared_notes ADD COLUMN selection_place TEXT`,
];

export function database(bb: BbPluginApi) {
  const db = bb.storage.database();
  bb.storage.migrate(db, MIGRATIONS);
  return db;
}
