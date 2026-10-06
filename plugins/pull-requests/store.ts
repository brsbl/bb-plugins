import type { BbPluginApi } from "@get-bb/plugin-sdk";
import { itemSchema, type Link, type PullRequestItem, type Reader, type Snapshot } from "./contract.js";

type Row = { value: string; revision: number };
export function createStore(bb: BbPluginApi) {
  const db = bb.storage.database();
  bb.storage.migrate(db, [
    "CREATE TABLE pull_requests (id TEXT PRIMARY KEY, value TEXT NOT NULL, revision INTEGER NOT NULL DEFAULT 0)",
    "CREATE TABLE pull_request_urls (url TEXT PRIMARY KEY COLLATE NOCASE, id TEXT NOT NULL)",
    "CREATE TABLE pull_request_links (pr_id TEXT NOT NULL, thread_id TEXT NOT NULL, value TEXT NOT NULL, suppressed INTEGER NOT NULL DEFAULT 0, PRIMARY KEY(pr_id,thread_id))",
  ]);
  function links(id: string): Link[] {
    return (db.prepare("SELECT value FROM pull_request_links WHERE pr_id=? AND suppressed=0 ORDER BY thread_id").all(id) as { value: string }[]).map((row) => JSON.parse(row.value) as Link);
  }
  function get(id: string): PullRequestItem {
    const row = db.prepare("SELECT value FROM pull_requests WHERE id=?").get(id) as Row | undefined;
    if (!row) throw new Error("This pull request is not in the registry. Refresh or link it again.");
    return { ...itemSchema.parse(JSON.parse(row.value)), links: links(id) };
  }
  function save(item: PullRequestItem) {
    db.prepare("INSERT INTO pull_requests(id,value) VALUES(?,?) ON CONFLICT(id) DO UPDATE SET value=excluded.value, revision=pull_requests.revision+1").run(item.id, JSON.stringify({ ...item, links: [] }));
    db.prepare("INSERT INTO pull_request_urls VALUES(?,?) ON CONFLICT(url) DO UPDATE SET id=excluded.id").run(item.url, item.id);
    return get(item.id);
  }
  function byUrl(url: string): PullRequestItem | null {
    const row = db.prepare("SELECT id FROM pull_request_urls WHERE url=?").get(url) as { id: string } | undefined;
    return row ? get(row.id) : null;
  }
  function upsert(snapshot: Snapshot, reader: Reader): PullRequestItem {
    const id = `github:${snapshot.nodeId}`;
    const row = db.prepare("SELECT value FROM pull_requests WHERE id=?").get(id) as Row | undefined;
    const existing = row ? get(id) : null;
    // Another verified reader stays authoritative until the user selects a replacement.
    if (existing?.reader && (existing.reader.hostId !== reader.hostId || existing.reader.accountId !== reader.accountId)) return existing;
    return save({ id, url: snapshot.url, snapshot, reader, sourceState: "available", sourceMessage: null, lastAttemptAt: snapshot.fetchedAt, discoveredFromGitHub: existing?.discoveredFromGitHub, links: existing?.links ?? [], preferredThreadId: existing?.preferredThreadId ?? null, pinned: existing?.pinned ?? false });
  }
  function link(id: string, value: Link, explicit = false) {
    const row = db.prepare("SELECT value,suppressed FROM pull_request_links WHERE pr_id=? AND thread_id=?").get(id, value.threadId) as { value: string; suppressed: number } | undefined;
    if (row && !explicit) {
      if (row.suppressed) return get(id);
      const previous = JSON.parse(row.value) as Link;
      // An origin marker upgrades provenance, but cannot overwrite explicit correction.
      if ((previous.evidence !== "environment" && previous.evidence !== "body-marker") || !value.origin) return get(id);
    }
    if (row && explicit) value = { ...value, origin: value.origin || (JSON.parse(row.value) as Link).origin };
    db.prepare("INSERT INTO pull_request_links VALUES(?,?,?,0) ON CONFLICT(pr_id,thread_id) DO UPDATE SET value=excluded.value,suppressed=0").run(id, value.threadId, JSON.stringify(value));
    return get(id);
  }
  function unlink(id: string, threadId: string): Link | null {
    const previous = links(id).find((link) => link.threadId === threadId) ?? null;
    if (previous) {
      db.prepare("UPDATE pull_request_links SET suppressed=1 WHERE pr_id=? AND thread_id=?").run(id, threadId);
      const item = get(id);
      if (item.preferredThreadId === threadId) save({ ...item, preferredThreadId: null });
    }
    return previous;
  }
  return {
    get, save, byUrl, upsert, link, unlink,
    list(args: { offset: number; limit: number; query?: string; view?: string; author?: string }) {
      const visible = `(json_extract(value,'$.discoveredFromGitHub')=1 OR EXISTS(SELECT 1 FROM pull_request_links l WHERE l.pr_id=pull_requests.id AND suppressed=0))`;
      // "@me" means authored by the GitHub account that read the pull request. Rows whose content is
      // hidden after access loss stay listed so their recovery state remains reachable.
      const condition = `${visible}
        AND (?='' OR (?='@me' AND (json_extract(value,'$.snapshot') IS NULL OR lower(json_extract(value,'$.snapshot.author'))=lower(json_extract(value,'$.reader.login')))) OR lower(coalesce(json_extract(value,'$.snapshot.author'),''))=lower(?))
        AND (?='' OR instr(lower(coalesce(json_extract(value,'$.snapshot.title'),'') || ' ' || coalesce(json_extract(value,'$.snapshot.repository'),'') || ' ' || coalesce(json_extract(value,'$.snapshot.number'),'')),lower(?))>0)
        AND (?='all' OR (?='history' AND json_extract(value,'$.snapshot.state') IN ('closed','merged')) OR (?='open' AND coalesce(json_extract(value,'$.snapshot.state'),'open') NOT IN ('closed','merged')))`;
      const author = args.author ?? "";
      const bindings = [author, author, author, args.query ?? "", args.query ?? "", args.view ?? "all", args.view ?? "all", args.view ?? "all"];
      const total = (db.prepare(`SELECT count(*) AS total FROM pull_requests WHERE ${condition}`).get(...bindings) as { total: number }).total;
      const rows = db.prepare(`SELECT id FROM pull_requests WHERE ${condition} ORDER BY json_extract(value,'$.pinned') DESC, coalesce(json_extract(value,'$.snapshot.updatedAt'),'') DESC, id LIMIT ? OFFSET ?`).all(...bindings, args.limit, args.offset) as { id: string }[];
      const authors = (db.prepare(`SELECT DISTINCT json_extract(value,'$.snapshot.author') AS author FROM pull_requests WHERE ${visible} AND json_extract(value,'$.snapshot.author') IS NOT NULL ORDER BY lower(author)`).all() as { author: string }[]).map((row) => row.author);
      return { items: rows.map((row) => get(row.id)), total, authors };
    },
    knownOpenIds() {
      return (db.prepare("SELECT id FROM pull_requests WHERE coalesce(json_extract(value,'$.snapshot.state'),'open') NOT IN ('closed','merged') AND (json_extract(value,'$.discoveredFromGitHub')=1 OR EXISTS(SELECT 1 FROM pull_request_links l WHERE l.pr_id=pull_requests.id AND suppressed=0))").all() as { id: string }[]).map((row) => row.id);
    },
    removeThread(threadId: string) {
      db.transaction(() => {
        db.prepare("DELETE FROM pull_request_links WHERE thread_id=?").run(threadId);
        const rows = db.prepare("SELECT id FROM pull_requests WHERE json_extract(value,'$.preferredThreadId')=?").all(threadId) as { id: string }[];
        for (const row of rows) save({ ...get(row.id), preferredThreadId: null });
      })();
    },
    readersOnHost(hostId: string): Reader[] {
      const rows = db.prepare("SELECT DISTINCT json_extract(value,'$.reader') AS reader FROM pull_requests WHERE json_extract(value,'$.reader.hostId')=? AND json_extract(value,'$.snapshot') IS NOT NULL").all(hostId) as { reader: string }[];
      return rows.map((row) => JSON.parse(row.reader) as Reader);
    },
    invalidateConnection(reader: Reader, kind: "authentication-required" | "auth-changed", message: string) {
      db.transaction(() => {
        const rows = db.prepare("SELECT id FROM pull_requests WHERE json_extract(value,'$.reader.hostId')=? AND json_extract(value,'$.reader.accountId')=?").all(reader.hostId, reader.accountId) as { id: string }[];
        for (const row of rows) save({ ...get(row.id), snapshot: null, sourceState: kind, sourceMessage: message, lastAttemptAt: new Date().toISOString() });
      })();
    },
  };
}
export type Store = ReturnType<typeof createStore>;
