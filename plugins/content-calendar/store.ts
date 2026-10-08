import type { Conflict } from "./model.js";
import type { Fields, Unit } from "./mapping.js";
import type { ServiceDeps } from "./service-api.js";

type Db = ServiceDeps["db"];

/** Append-only: `bb.storage.migrate` keys each statement by its index. */
export const MIGRATIONS = [
  `CREATE TABLE cc_items (
    cc_id TEXT PRIMARY KEY,
    event_id TEXT UNIQUE,
    etag TEXT,
    created TEXT,
    fields TEXT NOT NULL,
    base TEXT,
    dirty TEXT NOT NULL DEFAULT '[]',
    rewrite INTEGER NOT NULL DEFAULT 0,
    seq INTEGER,
    deleted INTEGER NOT NULL DEFAULT 0,
    block TEXT,
    series_start TEXT,
    conflict TEXT,
    lost TEXT,
    notice TEXT,
    updated_at TEXT NOT NULL
  )`,
  "CREATE INDEX cc_items_seq ON cc_items (seq)",
  "CREATE TABLE cc_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)",
  "CREATE TABLE cc_deleted_events (event_id TEXT PRIMARY KEY, deleted_at TEXT NOT NULL)",
  "ALTER TABLE cc_items ADD COLUMN raw TEXT",
  "ALTER TABLE cc_items ADD COLUMN client_id TEXT",
];

/** One cached item and its event. `base` is the last version read from or confirmed by Google. */
export interface Row {
  ccId: string;
  eventId: string | null;
  etag: string | null;
  created: string | null;
  fields: Fields;
  base: Fields | null;
  /** Units changed in bb and not yet confirmed by Google. */
  dirty: Unit[];
  /** Push even without dirty units: new ID, first-sight prefix and block, or the Monday roll. */
  rewrite: boolean;
  /** Queue position; null when nothing waits. */
  seq: number | null;
  /** Deleted in bb; the event delete is queued. */
  deleted: boolean;
  /** The block text bb last wrote. */
  block: string | null;
  /** The description exactly as Google last returned it. */
  raw: string | null;
  /** The event ID bb inserts with, so a retried insert finds the first one. */
  clientId: string | null;
  seriesStart: string | null;
  conflict: Conflict | null;
  /** bb's losing unit values, written back by reapply. */
  lost: Partial<Fields> | null;
  notice: string | null;
  updatedAt: string;
}

interface RawRow {
  cc_id: string;
  event_id: string | null;
  etag: string | null;
  created: string | null;
  fields: string;
  base: string | null;
  dirty: string;
  rewrite: number;
  seq: number | null;
  deleted: number;
  block: string | null;
  raw: string | null;
  client_id: string | null;
  series_start: string | null;
  conflict: string | null;
  lost: string | null;
  notice: string | null;
  updated_at: string;
}

function fromRaw(raw: RawRow): Row {
  return {
    ccId: raw.cc_id,
    eventId: raw.event_id,
    etag: raw.etag,
    created: raw.created,
    fields: JSON.parse(raw.fields) as Fields,
    base: raw.base ? (JSON.parse(raw.base) as Fields) : null,
    dirty: JSON.parse(raw.dirty) as Unit[],
    rewrite: raw.rewrite === 1,
    seq: raw.seq,
    deleted: raw.deleted === 1,
    block: raw.block,
    raw: raw.raw,
    clientId: raw.client_id,
    seriesStart: raw.series_start,
    conflict: raw.conflict ? (JSON.parse(raw.conflict) as Conflict) : null,
    lost: raw.lost ? (JSON.parse(raw.lost) as Partial<Fields>) : null,
    notice: raw.notice,
    updatedAt: raw.updated_at,
  };
}

export type Store = ReturnType<typeof createStore>;

export function createStore(db: Db, migrate: ServiceDeps["migrate"]) {
  migrate(db, MIGRATIONS);
  const select = "SELECT * FROM cc_items";
  const byId = db.prepare(`${select} WHERE cc_id = ?`);
  const byEvent = db.prepare(`${select} WHERE event_id = ?`);
  const all = db.prepare(`${select} ORDER BY cc_id`);
  const byClient = db.prepare(`${select} WHERE client_id = ? AND event_id IS NULL`);
  const queue = db.prepare(`${select} WHERE seq IS NOT NULL ORDER BY seq`);
  const upsert = db.prepare(`INSERT INTO cc_items
    (cc_id, event_id, etag, created, fields, base, dirty, rewrite, seq, deleted, block, raw, client_id, series_start, conflict, lost, notice, updated_at)
    VALUES (@cc_id, @event_id, @etag, @created, @fields, @base, @dirty, @rewrite, @seq, @deleted, @block, @raw, @client_id, @series_start, @conflict, @lost, @notice, @updated_at)
    ON CONFLICT (cc_id) DO UPDATE SET event_id = excluded.event_id, etag = excluded.etag, created = excluded.created,
      fields = excluded.fields, base = excluded.base, dirty = excluded.dirty, rewrite = excluded.rewrite, seq = excluded.seq,
      deleted = excluded.deleted, block = excluded.block, raw = excluded.raw, client_id = excluded.client_id, series_start = excluded.series_start, conflict = excluded.conflict,
      lost = excluded.lost, notice = excluded.notice, updated_at = excluded.updated_at`);
  const remove = db.prepare("DELETE FROM cc_items WHERE cc_id = ?");
  const rename = db.prepare("UPDATE cc_items SET cc_id = ? WHERE cc_id = ?");
  const clearItems = db.prepare("DELETE FROM cc_items");
  const metaGet = db.prepare("SELECT value FROM cc_meta WHERE key = ?");
  const metaSet = db.prepare("INSERT INTO cc_meta (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value");
  const metaDelete = db.prepare("DELETE FROM cc_meta WHERE key = ?");
  const deletedAdd = db.prepare("INSERT OR REPLACE INTO cc_deleted_events (event_id, deleted_at) VALUES (?, ?)");
  const deletedHas = db.prepare("SELECT 1 FROM cc_deleted_events WHERE event_id = ?");
  const deletedRemove = db.prepare("DELETE FROM cc_deleted_events WHERE event_id = ?");
  const deletedClear = db.prepare("DELETE FROM cc_deleted_events");

  const meta = {
    get(key: string): string | null {
      const row = metaGet.get(key) as { value: string } | undefined;
      return row ? row.value : null;
    },
    set(key: string, value: string | null): void {
      if (value === null) metaDelete.run(key);
      else metaSet.run(key, value);
    },
  };

  return {
    meta,
    row(ccId: string): Row | null {
      const raw = byId.get(ccId) as RawRow | undefined;
      return raw ? fromRaw(raw) : null;
    },
    rowByEvent(eventId: string): Row | null {
      const raw = byEvent.get(eventId) as RawRow | undefined;
      return raw ? fromRaw(raw) : null;
    },
    /** A row whose insert may have reached Google under its client ID. */
    rowByClient(clientId: string): Row | null {
      const raw = byClient.get(clientId) as RawRow | undefined;
      return raw ? fromRaw(raw) : null;
    },
    rows(): Row[] {
      return (all.all() as RawRow[]).map(fromRaw);
    },
    queued(): Row[] {
      return (queue.all() as RawRow[]).map(fromRaw);
    },
    put(row: Row): void {
      upsert.run({
        cc_id: row.ccId,
        event_id: row.eventId,
        etag: row.etag,
        created: row.created,
        fields: JSON.stringify(row.fields),
        base: row.base ? JSON.stringify(row.base) : null,
        dirty: JSON.stringify(row.dirty),
        rewrite: row.rewrite ? 1 : 0,
        seq: row.seq,
        deleted: row.deleted ? 1 : 0,
        block: row.block,
        raw: row.raw,
        client_id: row.clientId,
        series_start: row.seriesStart,
        conflict: row.conflict ? JSON.stringify(row.conflict) : null,
        lost: row.lost ? JSON.stringify(row.lost) : null,
        notice: row.notice,
        updated_at: row.updatedAt,
      });
    },
    remove(ccId: string): void {
      remove.run(ccId);
    },
    rename(from: string, to: string): void {
      rename.run(to, from);
    },
    clearItems(): void {
      clearItems.run();
    },
    /** Monotonic queue positions, so queued writes replay in the order they were made. */
    nextSeq(): number {
      const next = Number(meta.get("seq") ?? "0") + 1;
      meta.set("seq", String(next));
      return next;
    },
    markDeleted(eventId: string, at: string): void {
      deletedAdd.run(eventId, at);
    },
    wasDeleted(eventId: string): boolean {
      return deletedHas.get(eventId) !== undefined;
    },
    forgetDeleted(eventId: string): void {
      deletedRemove.run(eventId);
    },
    clearDeleted(): void {
      deletedClear.run();
    },
    transaction<T>(run: () => T): T {
      return db.transaction(run)();
    },
  };
}
