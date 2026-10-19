import { createHash, randomUUID } from "node:crypto";

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
  SourceSchema,
  parseStored,
  type Connection,
  type DigestDefinition,
  type Issue,
  type IssueListInput,
  type IssuePatch,
  type MailClass,
  type PublishInput,
  type Source,
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
  // One row per email across briefs: shown, handed off to its owner, or released.
  `CREATE TABLE digest_emails (
    id TEXT PRIMARY KEY,
    class TEXT,
    state TEXT NOT NULL,
    owner_digest_id TEXT,
    issue_id TEXT,
    handed_off_by TEXT,
    handoff_until INTEGER,
    note TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`,
  // Each inbox's copy of an email; email_id is null for a counted email nobody showed.
  `CREATE TABLE digest_email_copies (
    connection_id TEXT NOT NULL,
    gmail_message_id TEXT NOT NULL,
    email_id TEXT,
    gmail_thread_id TEXT,
    rfc_message_id TEXT,
    fingerprint TEXT,
    received_at INTEGER,
    PRIMARY KEY (connection_id, gmail_message_id)
  )`,
  `CREATE INDEX digest_email_copies_rfc ON digest_email_copies(rfc_message_id) WHERE rfc_message_id IS NOT NULL`,
  `CREATE INDEX digest_email_copies_fingerprint ON digest_email_copies(fingerprint, received_at) WHERE fingerprint IS NOT NULL`,
];

const HOUR = 3_600_000;
const COPY_WINDOW = 72 * HOUR;
const HANDOFF_GRACE = 24 * HOUR;

/** An enabled, scheduled brief that owns a mail class, computed live by the service. */
export type Owner = { class: "money" | "newsletters"; digestId: string; name: string; connectionIds: string[]; nextRunAt: number };
/** Omitted for external publishers. `returnedHandoffs` are the email ids digest_begin returned. */
export type PublishOptions = { strict?: boolean; owners?: Owner[]; returnedHandoffs?: string[] };
export const EmailCandidateSchema = SourceSchema.pick({
  connectionId: true, messageId: true, rfcMessageId: true, from: true, subject: true, receivedAt: true,
});
export type EmailCandidate = z.input<typeof EmailCandidateSchema>;
export type EmailStatus =
  | { status: "shown"; digestId: string; digestName: string; issueId: string | null; threadId: string | null; shownAt: number }
  | { status: "handed-to-you"; emailId: string; class: MailClass | null; handedOffBy: string | null }
  | { status: "handed-off"; ownerDigestId: string | null; ownerName: string; until: number | null }
  | { status: "possible-copy"; digestId: string; digestName: string; issueId: string | null; row?: { title: string; text: string } }
  | { status: "released"; reason: string | null }
  | { status: "new" };
export type Handoff = {
  emailId: string; connectionId: string; messageId: string; threadId?: string; class: MailClass | null;
  ownerDigestId: string; handedOffBy: string | null; handedOffByName: string; since: number;
};

type EmailRow = {
  id: string; class: MailClass | null; state: "shown" | "handoff" | "released"; owner_digest_id: string | null;
  issue_id: string | null; handed_off_by: string | null; handoff_until: number | null; note: string | null;
  created_at: number; updated_at: number;
};
type Placement = NonNullable<Source["placement"]> | "copy";
type Plan = { source: Source; gmail: boolean; placement: Placement; email: EmailRow | undefined };

/** Sender address plus normalized subject, hashed; only the hash is stored. */
export function emailFingerprint(from: string, subject: string): string {
  const address = (/<([^>]*)>/u.exec(from)?.[1] ?? from).trim().toLowerCase();
  let normalized = subject.toLowerCase().replace(/\s+/gu, " ").trim();
  for (let previous = ""; previous !== normalized;) {
    previous = normalized;
    normalized = normalized.replace(/^(?:re|fwd?)\s*:\s*/u, "");
  }
  return createHash("sha256").update(`${address}\n${normalized}`).digest("hex");
}

const day = (ms: number) => new Date(ms).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }).replace(",", "");
const sourceKey = (connectionId: string, messageId: string) => `${connectionId}\u0000${messageId}`;

type JsonRow = { data: string };
function parseRow<T>(row: unknown, schema: z.ZodType<T>): T | null {
  return row === undefined ? null : parseStored(schema, JSON.parse((row as JsonRow).data));
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

  const isGmail = (connectionId: string): boolean => {
    const url = connectionGet(connectionId)?.url;
    return url !== undefined && new URL(url).hostname === "mail.google.com";
  };
  const digestName = (digestId: string | null, owners: Owner[] = []): string => digestId === null ? "another brief"
    : owners.find((owner) => owner.digestId === digestId)?.name ?? definitionGet(digestId)?.name ?? digestId;
  const emailGet = (id: string): EmailRow | undefined =>
    db.prepare("SELECT * FROM digest_emails WHERE id = ?").get(id) as EmailRow | undefined;
  const copyEmailId = (connectionId: string, messageId: string): string | null => (db.prepare(`SELECT email_id
    FROM digest_email_copies WHERE connection_id = ? AND gmail_message_id = ?`).get(connectionId, messageId) as { email_id: string | null } | undefined)?.email_id ?? null;
  /** Exact inbox key first, then the RFC Message-ID from any inbox. */
  const findEmail = (connectionId: string, messageId: string, rfcMessageId?: string): EmailRow | undefined => {
    const emailId = copyEmailId(connectionId, messageId) ?? (rfcMessageId === undefined ? undefined
      : (db.prepare(`SELECT email_id FROM digest_email_copies WHERE rfc_message_id = ? AND email_id IS NOT NULL
        ORDER BY received_at LIMIT 1`).get(rfcMessageId) as { email_id: string } | undefined)?.email_id);
    return emailId === undefined ? undefined : emailGet(emailId);
  };
  const shownError = (source: Pick<Source, "connectionId" | "messageId">, email: EmailRow) => new Error(
    `Message ${source.messageId} from ${source.connectionId} was already shown in ${digestName(email.owner_digest_id)} on ${day(email.updated_at)}. Remove it and publish again.`,
  );
  /** The brief row that cites a Gmail message, so a later brief can say what was shown. */
  const briefRow = (issueId: string | null, messageId: string): { title: string; text: string } | undefined => {
    const brief = issueId === null ? undefined : issueGet(issueId)?.brief;
    if (!brief) return undefined;
    const row = brief.items.find((item) => item.messageId === messageId)
      ?? brief.later.find((item) => item.messageId === messageId)
      ?? [...brief.tail?.items ?? [], ...brief.all?.items ?? []].find((item) => item.messageIds?.includes(messageId));
    return row && { title: row.title, text: "text" in row ? row.text : "" };
  };

  // Legacy Gmail sources become shown emails, oldest first so the first brief keeps them. Idempotent on every start.
  db.transaction(() => {
    const ids = (db.prepare("SELECT DISTINCT connection_id FROM digest_processed_sources").all() as { connection_id: string }[])
      .map((row) => row.connection_id)
      .filter((id) => connectionGet(id) === null ? id.startsWith("gmail") : isGmail(id));
    const legacyEmails = db.prepare(`INSERT OR IGNORE INTO digest_emails
      (id, state, owner_digest_id, issue_id, created_at, updated_at)
      SELECT 'legacy:' || p.connection_id || ':' || p.message_id, 'shown', p.digest_id, p.issue_id, p.processed_at, p.processed_at
      FROM digest_processed_sources p WHERE p.connection_id = ? AND NOT EXISTS (SELECT 1 FROM digest_email_copies c
        WHERE c.connection_id = p.connection_id AND c.gmail_message_id = p.message_id)
      ORDER BY p.processed_at, p.digest_id`);
    const legacyCopies = db.prepare(`INSERT OR IGNORE INTO digest_email_copies (connection_id, gmail_message_id, email_id, gmail_thread_id)
      SELECT p.connection_id, p.message_id, 'legacy:' || p.connection_id || ':' || p.message_id, p.thread_id
      FROM digest_processed_sources p WHERE p.connection_id = ? ORDER BY p.processed_at, p.digest_id`);
    for (const id of ids) { legacyEmails.run(id); legacyCopies.run(id); }
  }).immediate();

  const definitions = {
    list(): DigestDefinition[] {
      return (db.prepare("SELECT data FROM digest_definitions ORDER BY id").all() as JsonRow[])
        .map((row) => parseStored(DigestDefinitionSchema, JSON.parse(row.data)));
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
        .map((row) => parseStored(ConnectionSchema, JSON.parse(row.data)));
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
        .all(...values, limit, offset) as JsonRow[]).map((row) => parseStored(IssueSchema, JSON.parse(row.data)));
    },
    /**
     * The issue, every processed message, and the email ledger change together, or nothing changes.
     * Gmail sources are shown by one brief only; strict runs also enforce class ownership and handoffs.
     */
    publish(id: string, input: z.input<typeof PublishInputSchema>, now: number, options: PublishOptions = {}): Issue {
      const payload: PublishInput = PublishInputSchema.parse(input);
      const publishedAt = IssueSchema.shape.createdAt.parse(now);
      const strict = options.strict === true;
      const owners = options.owners ?? [];
      const returned = new Set(options.returnedHandoffs ?? []);
      return db.transaction(() => {
        const previous = requireIssue(id);
        if (previous.state === "ready") return previous;
        const definition = definitionGet(previous.digestId);
        if (definition === null) throw new Error(`No digest ${previous.digestId}.`);
        const digestId = previous.digestId;
        const gmail = new Map(definition.connectionIds.map((connectionId) => [connectionId, isGmail(connectionId)] as const));
        const ownsHere = (owner: Owner, mailClass: MailClass | undefined, connectionId: string) =>
          owner.class === mailClass && owner.connectionIds.includes(connectionId);
        // The earliest eligible other brief that owns this class in this inbox.
        const ownerFor = (mailClass: MailClass | undefined, connectionId: string): Owner | undefined => owners
          .filter((owner) => owner.digestId !== digestId && ownsHere(owner, mailClass, connectionId))
          .sort((a, b) => a.nextRunAt - b.nextRunAt)[0];
        const findProcessed = db.prepare(`SELECT issue_id FROM digest_processed_sources
          WHERE digest_id = ? AND connection_id = ? AND message_id = ?`);
        const plans = payload.sources.map((source): Plan => {
          if (!definition.connectionIds.includes(source.connectionId)) {
            throw new Error(`Connection ${source.connectionId} is not listed on this brief.`);
          }
          const isGmailSource = gmail.get(source.connectionId) === true;
          if ((!isGmailSource || !strict) && source.deduplicate !== false && findProcessed.get(digestId, source.connectionId, source.messageId) !== undefined) {
            throw new Error(`Message ${source.messageId} from ${source.connectionId} was already digested. Remove it and revise the brief before publishing.`);
          }
          if (!isGmailSource) return { source, gmail: false, placement: "shown", email: undefined };
          const label = `Message ${source.messageId} from ${source.connectionId}`;
          if (strict && source.copyOf === undefined && source.placement === undefined) {
            throw new Error(`${label} needs a placement: shown, handoff, released, or counted.`);
          }
          const placement: Placement = source.copyOf !== undefined ? "copy" : source.placement ?? "shown";
          const email = findEmail(source.connectionId, source.messageId, source.rfcMessageId);
          const returnedHere = email !== undefined && returned.has(email.id);
          if ((placement === "shown" || placement === "handoff") && email?.state === "shown") throw shownError(source, email);
          // A pending handoff belongs to its owner whatever class this run gives it.
          if (strict && placement === "shown" && source.urgent !== true && !returnedHere && email?.state === "handoff" && email.owner_digest_id !== digestId) {
            throw new Error(`${label} is waiting for ${digestName(email.owner_digest_id, owners)}. Leave it out, or set urgent.`);
          }
          if (strict && placement === "shown" && source.urgent !== true && !returnedHere
            && !owners.some((owner) => owner.digestId === digestId && ownsHere(owner, source.class, source.connectionId))) {
            const owner = ownerFor(source.class, source.connectionId);
            if (owner) throw new Error(`${owner.name} owns ${source.class} mail from ${source.connectionId}; hand it off with placement handoff, or set urgent.`);
          }
          if (placement === "handoff" && ownerFor(source.class, source.connectionId) === undefined) {
            throw new Error(`${label} has no other brief that owns ${source.class ?? "unclassified"} mail from ${source.connectionId}. Show it or count it instead.`);
          }
          if (placement === "released" && !returnedHere) {
            throw new Error(`${label} was not handed to this brief, so it cannot be released.`);
          }
          if (source.copyOf !== undefined) {
            const { connectionId, messageId } = source.copyOf;
            const inPayload = payload.sources.some((other) => other.connectionId === connectionId && other.messageId === messageId && other.copyOf === undefined);
            const recorded = db.prepare(`SELECT 1 FROM digest_email_copies WHERE connection_id = ? AND gmail_message_id = ?`).get(connectionId, messageId) !== undefined;
            if (!inPayload && !recorded) {
              throw new Error(`${label} is marked as a copy of ${messageId} from ${connectionId}, which is neither in this brief nor recorded.`);
            }
          }
          return { source, gmail: true, placement, email };
        });
        if (strict && payload.brief) {
          const brief = payload.brief;
          const shownIds = new Set(plans.filter((plan) => plan.placement === "shown").map((plan) => plan.source.messageId));
          const readsGmail = [...gmail.values()].some(Boolean);
          const cite = (where: string, messageIds: string[] | undefined) => {
            if (messageIds === undefined || messageIds.length === 0) {
              if (readsGmail) throw new Error(`Each ${where} needs the Gmail message ID of the shown email it is about.`);
              return;
            }
            for (const messageId of messageIds) {
              if (shownIds.has(messageId)) continue;
              const plan = plans.find((candidate) => candidate.source.messageId === messageId);
              throw new Error(plan
                ? `Message ${messageId} is ${plan.placement === "copy" ? "a copy" : plan.placement}, so it cannot appear in the brief.`
                : `The brief cites message ${messageId}, which is not a shown source of this brief.`);
            }
          };
          for (const item of brief.items) cite("card in items", item.messageId === undefined ? undefined : [item.messageId]);
          for (const item of brief.later) cite("entry in later", item.messageId === undefined ? undefined : [item.messageId]);
          for (const row of brief.tail?.items ?? []) cite("row in tail", row.messageIds);
          for (const row of brief.all?.items ?? []) cite("row in all", row.messageIds);
        }
        if (strict) {
          const unaccounted = [...returned].filter((emailId) => !plans.some(({ email, placement }) => email?.id === emailId
            && (placement === "shown" || placement === "released" || (placement === "handoff" && email.owner_digest_id !== digestId))));
          if (unaccounted.length) throw new Error(`Show or release every email handed to this brief: ${unaccounted.join(", ")}.`);
        }

        const result = IssueSchema.parse({ ...previous, ...payload, state: "ready", recovery: null, publishedAt });
        writeIssue(result);
        const insertProcessed = db.prepare(`INSERT INTO digest_processed_sources
          (digest_id, connection_id, message_id, thread_id, issue_id, processed_at) VALUES (?, ?, ?, ?, ?, ?)
          ON CONFLICT(digest_id, connection_id, message_id) DO NOTHING`);
        for (const source of payload.sources) {
          insertProcessed.run(digestId, source.connectionId, source.messageId, source.threadId ?? null, id, publishedAt);
        }
        const upsertEmail = db.prepare(`INSERT INTO digest_emails
          (id, class, state, owner_digest_id, issue_id, handed_off_by, handoff_until, note, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET class = coalesce(excluded.class, class), state = excluded.state,
            owner_digest_id = excluded.owner_digest_id, issue_id = excluded.issue_id, handed_off_by = excluded.handed_off_by,
            handoff_until = excluded.handoff_until, note = excluded.note, updated_at = excluded.updated_at`);
        const upsertCopy = db.prepare(`INSERT INTO digest_email_copies
          (connection_id, gmail_message_id, email_id, gmail_thread_id, rfc_message_id, fingerprint, received_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(connection_id, gmail_message_id) DO UPDATE SET email_id = coalesce(excluded.email_id, email_id),
            gmail_thread_id = coalesce(excluded.gmail_thread_id, gmail_thread_id), rfc_message_id = coalesce(excluded.rfc_message_id, rfc_message_id),
            fingerprint = coalesce(excluded.fingerprint, fingerprint), received_at = coalesce(excluded.received_at, received_at)`);
        const writeCopy = (source: Source, emailId: string | null) => upsertCopy.run(
          source.connectionId, source.messageId, emailId, source.threadId ?? null, source.rfcMessageId ?? null,
          source.from !== undefined && source.subject !== undefined ? emailFingerprint(source.from, source.subject) : null,
          source.receivedAt ?? null,
        );
        const emailIds = new Map<string, string | null>();
        for (const { source, gmail: isGmailSource, placement, email } of plans) {
          if (!isGmailSource || placement === "copy") continue;
          let emailId = email?.id ?? null;
          const write = (state: EmailRow["state"], ownerDigestId: string | null, issueId: string | null, handedOffBy: string | null, until: number | null, note: string | null) => {
            emailId ??= randomUUID();
            upsertEmail.run(emailId, source.class ?? null, state, ownerDigestId, issueId, handedOffBy, until, note, publishedAt, publishedAt);
          };
          if (placement === "shown") write("shown", digestId, id, null, null, null);
          else if (placement === "handoff") {
            const owner = ownerFor(source.class, source.connectionId)!;
            write("handoff", owner.digestId, null, digestId, owner.nextRunAt + HANDOFF_GRACE, null);
          } else if (placement === "released") write("released", null, null, null, null, source.reason ?? null);
          writeCopy(source, emailId);
          emailIds.set(sourceKey(source.connectionId, source.messageId), emailId);
        }
        for (const { source, placement } of plans) {
          if (placement !== "copy" || source.copyOf === undefined) continue;
          const target = sourceKey(source.copyOf.connectionId, source.copyOf.messageId);
          writeCopy(source, emailIds.has(target) ? emailIds.get(target)! : copyEmailId(source.copyOf.connectionId, source.copyOf.messageId));
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
    /** Advisory: where each candidate email already stands across briefs. Never changes state. */
    emailStatus(digestId: string, candidates: EmailCandidate[], owners: Owner[], returnedHandoffs: string[]): EmailStatus[] {
      DigestIdSchema.parse(digestId);
      const returned = new Set(returnedHandoffs);
      const likelyCopy = db.prepare(`SELECT c.gmail_message_id, e.owner_digest_id, e.issue_id
        FROM digest_email_copies c JOIN digest_emails e ON e.id = c.email_id
        WHERE c.fingerprint = ? AND c.received_at BETWEEN ? AND ? AND c.connection_id <> ? AND e.state = 'shown'
        ORDER BY abs(c.received_at - ?) LIMIT 1`);
      return z.array(EmailCandidateSchema).max(500).parse(candidates).map((candidate): EmailStatus => {
        const email = findEmail(candidate.connectionId, candidate.messageId, candidate.rfcMessageId);
        if (email?.state === "shown") {
          const owner = email.owner_digest_id ?? "";
          return { status: "shown", digestId: owner, digestName: digestName(email.owner_digest_id, owners), issueId: email.issue_id,
            threadId: email.issue_id === null ? null : issueGet(email.issue_id)?.threadId ?? null, shownAt: email.updated_at };
        }
        if (email?.state === "handoff") {
          return email.owner_digest_id === digestId || returned.has(email.id)
            ? { status: "handed-to-you", emailId: email.id, class: email.class, handedOffBy: email.handed_off_by }
            : { status: "handed-off", ownerDigestId: email.owner_digest_id, ownerName: digestName(email.owner_digest_id, owners), until: email.handoff_until };
        }
        if (email?.state === "released") return { status: "released", reason: email.note };
        const { from, subject, receivedAt } = candidate;
        if (from === undefined || subject === undefined || receivedAt === undefined) return { status: "new" };
        const match = likelyCopy.get(emailFingerprint(from, subject), receivedAt - COPY_WINDOW, receivedAt + COPY_WINDOW, candidate.connectionId, receivedAt) as
          { gmail_message_id: string; owner_digest_id: string | null; issue_id: string | null } | undefined;
        if (match === undefined) return { status: "new" };
        const row = briefRow(match.issue_id, match.gmail_message_id);
        return { status: "possible-copy", digestId: match.owner_digest_id ?? "", digestName: digestName(match.owner_digest_id, owners),
          issueId: match.issue_id, ...(row ? { row } : {}) };
      });
    },
    /** Handoffs this brief must show or release: its own, plus orphans whose owner stopped or missed its run. */
    handoffsFor(digestId: string, connectionIds: string[], eligibleOwnerIds: Set<string>, now: number): Handoff[] {
      DigestIdSchema.parse(digestId);
      const ids = z.array(DigestIdSchema).max(20).parse(connectionIds);
      if (ids.length === 0) return [];
      const rows = db.prepare(`SELECT e.id, e.class, e.owner_digest_id, e.handed_off_by, e.handoff_until, e.updated_at,
          c.connection_id, c.gmail_message_id, c.gmail_thread_id
        FROM digest_emails e JOIN digest_email_copies c ON c.email_id = e.id
        WHERE e.state = 'handoff' AND c.connection_id IN (${ids.map(() => "?").join(", ")})
        ORDER BY e.updated_at, e.id, c.connection_id, c.gmail_message_id`).all(...ids) as (Pick<EmailRow, "id" | "class" | "handed_off_by" | "handoff_until" | "updated_at">
          & { owner_digest_id: string; connection_id: string; gmail_message_id: string; gmail_thread_id: string | null })[];
      const seen = new Set<string>();
      return rows.flatMap((row): Handoff[] => {
        if (seen.has(row.id)) return [];
        const orphaned = !eligibleOwnerIds.has(row.owner_digest_id) || now > (row.handoff_until ?? 0);
        if (row.owner_digest_id !== digestId && !orphaned) return [];
        seen.add(row.id);
        return [{
          emailId: row.id, connectionId: row.connection_id, messageId: row.gmail_message_id,
          ...(row.gmail_thread_id === null ? {} : { threadId: row.gmail_thread_id }),
          class: row.class, ownerDigestId: row.owner_digest_id, handedOffBy: row.handed_off_by,
          handedOffByName: digestName(row.handed_off_by), since: row.updated_at,
        }];
      });
    },
  };
}

export type DigestStore = ReturnType<typeof createStore>;
