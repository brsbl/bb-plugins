import type { BbPluginApi } from "@get-bb/plugin-sdk";
import { z } from "zod";

import {
  ConnectionSchema,
  DigestDefinitionSchema,
  DigestIdSchema,
  IdSchema,
  IssueListInputSchema,
  IssuePatchSchema,
  IssueSchema,
  PublishInputSchema,
  type Connection,
  type DigestDefinition,
  type Issue,
  type IssueListInput,
  type IssuePatch,
  type PublishInput,
} from "./model";

/** Append only: the SDK migration runner records each statement's index and hash. */
export const STORE_MIGRATIONS = [
  `CREATE TABLE digest_definitions (id TEXT PRIMARY KEY, data TEXT NOT NULL)`,
  `CREATE TABLE digest_connections (id TEXT PRIMARY KEY, data TEXT NOT NULL)`,
  `CREATE TABLE digest_issues (
    id TEXT PRIMARY KEY,
    digest_id TEXT NOT NULL,
    thread_id TEXT,
    dedupe_key TEXT,
    state TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    data TEXT NOT NULL,
    UNIQUE (digest_id, dedupe_key)
  )`,
  `CREATE UNIQUE INDEX digest_issues_thread ON digest_issues(thread_id) WHERE thread_id IS NOT NULL`,
  `CREATE INDEX digest_issues_created ON digest_issues(created_at DESC, id)`,
  `CREATE TABLE digest_processed_sources (
    digest_id TEXT NOT NULL,
    connection_id TEXT NOT NULL,
    message_id TEXT NOT NULL,
    thread_id TEXT,
    issue_id TEXT NOT NULL,
    processed_at INTEGER NOT NULL,
    PRIMARY KEY (digest_id, connection_id, message_id)
  )`,
];

type JsonRow = { data: string };
function parseRow<T>(row: unknown, schema: z.ZodType<T>): T | null {
  return row === undefined ? null : schema.parse(JSON.parse((row as JsonRow).data));
}

/** Private data stays in the SDK's plugin-owned SQLite database, never in thread storage. */
export function createStore(bb: Pick<BbPluginApi, "storage">) {
  const db = bb.storage.database();
  bb.storage.migrate(db, STORE_MIGRATIONS);

  const definitionGet = (id: string): DigestDefinition | null => parseRow(
    db.prepare("SELECT data FROM digest_definitions WHERE id = ?").get(DigestIdSchema.parse(id)),
    DigestDefinitionSchema,
  );
  const connectionGet = (id: string): Connection | null => parseRow(
    db.prepare("SELECT data FROM digest_connections WHERE id = ?").get(DigestIdSchema.parse(id)),
    ConnectionSchema,
  );
  const issueGet = (id: string): Issue | null => parseRow(
    db.prepare("SELECT data FROM digest_issues WHERE id = ?").get(IdSchema.parse(id)),
    IssueSchema,
  );
  const issueGetByKey = (digestId: string, key: string): Issue | null => parseRow(
    db.prepare("SELECT data FROM digest_issues WHERE digest_id = ? AND dedupe_key = ?").get(
      DigestIdSchema.parse(digestId), IssueSchema.shape.dedupeKey.unwrap().unwrap().parse(key),
    ),
    IssueSchema,
  );
  const requireIssue = (id: string): Issue => {
    const issue = issueGet(id);
    if (issue === null) throw new Error(`No brief ${id}.`);
    return issue;
  };
  const writeIssue = (issue: Issue): Issue => {
    db.prepare(`UPDATE digest_issues SET thread_id = ?, state = ?, data = ? WHERE id = ?`).run(
      issue.threadId, issue.state, JSON.stringify(issue), issue.id,
    );
    return issue;
  };

  const definitions = {
    list(): DigestDefinition[] {
      return (db.prepare("SELECT data FROM digest_definitions ORDER BY id").all() as JsonRow[])
        .map((row) => DigestDefinitionSchema.parse(JSON.parse(row.data)));
    },
    get: definitionGet,
    put(input: z.input<typeof DigestDefinitionSchema>): DigestDefinition {
      const value = DigestDefinitionSchema.parse(input);
      db.prepare(`INSERT INTO digest_definitions (id, data) VALUES (?, ?)
        ON CONFLICT(id) DO UPDATE SET data = excluded.data`).run(value.id, JSON.stringify(value));
      return value;
    },
  };

  const connections = {
    list(): Connection[] {
      return (db.prepare("SELECT data FROM digest_connections ORDER BY id").all() as JsonRow[])
        .map((row) => ConnectionSchema.parse(JSON.parse(row.data)));
    },
    get: connectionGet,
    put(input: z.input<typeof ConnectionSchema>): Connection {
      const value = ConnectionSchema.parse(input);
      db.prepare(`INSERT INTO digest_connections (id, data) VALUES (?, ?)
        ON CONFLICT(id) DO UPDATE SET data = excluded.data`).run(value.id, JSON.stringify(value));
      return value;
    },
  };

  const issues = {
    /** Returns the existing issue when the brief's idempotency key was already used. */
    create(input: z.input<typeof IssueSchema>): Issue {
      const value = IssueSchema.parse(input);
      if (value.state === "ready" || value.publishedAt !== null || value.sources.length > 0) {
        throw new Error("Use publish to complete a brief and record its sources.");
      }
      if (definitionGet(value.digestId) === null) throw new Error(`No digest ${value.digestId}.`);
      return db.transaction(() => {
        if (value.dedupeKey !== null) {
          const existing = issueGetByKey(value.digestId, value.dedupeKey);
          if (existing !== null) return existing;
        }
        const sameId = issueGet(value.id);
        if (sameId !== null) {
          if (sameId.digestId === value.digestId && sameId.dedupeKey === value.dedupeKey) return sameId;
          throw new Error(`Brief id ${value.id} is already used by another publication.`);
        }
        db.prepare(`INSERT INTO digest_issues (id, digest_id, thread_id, dedupe_key, state, created_at, data)
          VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
          value.id, value.digestId, value.threadId, value.dedupeKey, value.state, value.createdAt, JSON.stringify(value),
        );
        return value;
      }).immediate();
    },
    get: issueGet,
    collectingIds(): string[] {
      // Reconciliation must also find old owners outside the paginated UI list.
      return (db.prepare("SELECT id FROM digest_issues WHERE state = 'collecting'").all() as { id: string }[]).map(({ id }) => id);
    },
    getByThread(threadId: string): Issue | null {
      return parseRow(db.prepare("SELECT data FROM digest_issues WHERE thread_id = ?").get(IdSchema.parse(threadId)), IssueSchema);
    },
    getByKey: issueGetByKey,
    update(id: string, input: IssuePatch): Issue {
      const patch = IssuePatchSchema.parse(input);
      return db.transaction(() => {
        const previous = requireIssue(id);
        if (previous.state === "ready" && Object.keys(patch).some((key) => !["readAt", "threadId"].includes(key))) {
          throw new Error("A published brief cannot be rewritten.");
        }
        if (previous.threadId !== null && patch.threadId !== undefined && patch.threadId !== previous.threadId) {
          throw new Error("A brief already belongs to a thread.");
        }
        return writeIssue(IssueSchema.parse({ ...previous, ...patch }));
      }).immediate();
    },
    list(input: IssueListInput = {}): Issue[] {
      const { digestId, state, limit, offset } = IssueListInputSchema.parse(input);
      const clauses: string[] = [];
      const values: (string | number)[] = [];
      if (digestId !== undefined) { clauses.push("digest_id = ?"); values.push(digestId); }
      if (state !== undefined) { clauses.push("state = ?"); values.push(state); }
      const where = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";
      return (db.prepare(`SELECT data FROM digest_issues ${where} ORDER BY created_at DESC, id LIMIT ? OFFSET ?`)
        .all(...values, limit, offset) as JsonRow[]).map((row) => IssueSchema.parse(JSON.parse(row.data)));
    },
    /** The issue and every processed message become visible together, or nothing changes. */
    publish(id: string, input: z.input<typeof PublishInputSchema>, now: number): Issue {
      const payload: PublishInput = PublishInputSchema.parse(input);
      const publishedAt = IssueSchema.shape.createdAt.parse(now);
      return db.transaction(() => {
        const previous = requireIssue(id);
        if (previous.state === "ready") return previous;
        const definition = definitionGet(previous.digestId);
        if (definition === null) throw new Error(`No digest ${previous.digestId}.`);
        const findProcessed = db.prepare(`SELECT issue_id FROM digest_processed_sources
          WHERE digest_id = ? AND connection_id = ? AND message_id = ?`);
        for (const source of payload.sources) {
          if (!definition.connectionIds.includes(source.connectionId)) {
            throw new Error(`Connection ${source.connectionId} is not listed on this brief.`);
          }
          if (source.deduplicate !== false && findProcessed.get(previous.digestId, source.connectionId, source.messageId) !== undefined) {
            throw new Error(`Message ${source.messageId} from ${source.connectionId} was already digested. Remove it and revise the brief before publishing.`);
          }
        }
        const result = IssueSchema.parse({ ...previous, ...payload, state: "ready", recovery: null, publishedAt });
        writeIssue(result);
        const insertProcessed = db.prepare(`INSERT INTO digest_processed_sources
          (digest_id, connection_id, message_id, thread_id, issue_id, processed_at) VALUES (?, ?, ?, ?, ?, ?)
          ON CONFLICT(digest_id, connection_id, message_id) DO NOTHING`);
        for (const source of payload.sources) {
          insertProcessed.run(previous.digestId, source.connectionId, source.messageId, source.threadId ?? null, id, publishedAt);
        }
        return result;
      }).immediate();
    },
  };

  return {
    definitions,
    connections,
    issues,
    /** Preserves candidate order, removes repeated candidates, and never changes source state. */
    processed(digestId: string, connectionId: string, messageIds: string[]): string[] {
      DigestIdSchema.parse(digestId);
      DigestIdSchema.parse(connectionId);
      const candidates = z.array(IdSchema).max(1_000).parse(messageIds);
      const lookup = db.prepare(`SELECT 1 FROM digest_processed_sources
        WHERE digest_id = ? AND connection_id = ? AND message_id = ?`);
      return [...new Set(candidates)].filter((messageId) => lookup.get(digestId, connectionId, messageId) !== undefined);
    },
  };
}

export type DigestStore = ReturnType<typeof createStore>;
