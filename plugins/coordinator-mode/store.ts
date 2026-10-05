import type { BbPluginApi } from "@get-bb/plugin-sdk";

import type {
  CoordinatorItem,
  CoordinatorState,
  CoordinatorTemplate,
  GatedAction,
  ItemPullRequest,
  ItemStatus,
  LogEntry,
  PendingApproval,
} from "./contracts";

/** Append only: the SDK migration runner records each statement's index and hash. */
export const STORE_MIGRATIONS = [
  `CREATE TABLE coordinators (
    thread_id TEXT PRIMARY KEY,
    project_id TEXT,
    template_json TEXT NOT NULL,
    paused INTEGER NOT NULL DEFAULT 0,
    auto_approve INTEGER NOT NULL DEFAULT 1,
    rules_version INTEGER NOT NULL DEFAULT 1,
    applied_rules_version INTEGER NOT NULL DEFAULT 1,
    last_opened_at INTEGER NOT NULL,
    last_briefing_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL
  )`,
  `CREATE TABLE items (
    id TEXT PRIMARY KEY,
    coordinator_thread_id TEXT NOT NULL,
    title TEXT NOT NULL,
    stage_index INTEGER NOT NULL,
    status TEXT NOT NULL,
    reason TEXT,
    link TEXT,
    primary_thread_id TEXT,
    proposed INTEGER NOT NULL,
    approved INTEGER NOT NULL DEFAULT 0,
    rejected_reason TEXT,
    review_json TEXT,
    failed_at INTEGER,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`,
  `CREATE INDEX items_coordinator ON items(coordinator_thread_id, created_at)`,
  `CREATE TABLE item_threads (
    item_id TEXT NOT NULL,
    thread_id TEXT NOT NULL,
    role TEXT NOT NULL,
    PRIMARY KEY (item_id, thread_id)
  )`,
  `CREATE UNIQUE INDEX item_threads_thread ON item_threads(thread_id)`,
  `CREATE TABLE approvals (
    id TEXT PRIMARY KEY,
    coordinator_thread_id TEXT NOT NULL,
    item_id TEXT,
    action TEXT NOT NULL,
    summary TEXT NOT NULL,
    args_json TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    resolved_at INTEGER,
    outcome TEXT
  )`,
  `CREATE INDEX approvals_pending ON approvals(coordinator_thread_id, resolved_at)`,
  `CREATE TABLE log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    coordinator_thread_id TEXT NOT NULL,
    item_id TEXT,
    kind TEXT NOT NULL,
    action TEXT,
    text TEXT NOT NULL,
    at INTEGER NOT NULL
  )`,
  `CREATE INDEX log_coordinator ON log(coordinator_thread_id, at)`,
  `CREATE TABLE thread_activity (
    thread_id TEXT PRIMARY KEY,
    last_active_at INTEGER,
    last_idle_at INTEGER
  )`,
  // Item context the coordinator keeps current, and the last PR evidence read for the status line.
  `ALTER TABLE items ADD COLUMN summary TEXT`,
  `ALTER TABLE items ADD COLUMN waiting_on TEXT`,
  `ALTER TABLE items ADD COLUMN pr_json TEXT`,
  // Why the rules asked, shown on the approval's card.
  `ALTER TABLE approvals ADD COLUMN reason TEXT`,
  `ALTER TABLE coordinators ADD COLUMN briefed_at INTEGER`,
  // Action Cards owned cards, one row per decision ref. An open row has resolved_at NULL.
  `CREATE TABLE cards (
    ref TEXT PRIMARY KEY,
    coordinator_thread_id TEXT NOT NULL,
    card_id TEXT NOT NULL,
    directive TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    resolved_at INTEGER
  )`,
  `CREATE INDEX cards_coordinator ON cards(coordinator_thread_id, resolved_at)`,
  // Proposed items are gone: existing ones become tracked, and their sub-threads count as adopted.
  `UPDATE item_threads SET role = 'adopted' WHERE role = 'primary' AND item_id IN (SELECT id FROM items WHERE proposed = 1)`,
  `UPDATE items SET proposed = 0 WHERE proposed = 1`,
];

/**
 * Reviewers are helpers that may record a review verdict. Adopted threads are primaries that
 * existed before Coordinator Mode tracked them: they count as primary but are never auto-approved.
 */
export type ThreadRole = "primary" | "adopted" | "helper" | "reviewer";

/** Roles that hold an item's primary sub-thread. */
export function isPrimaryRole(role: string): boolean {
  return role === "primary" || role === "adopted";
}

export type ReviewVerdict = { pass: boolean; findings?: string };

/** A coordinator row: the public state plus server-only bookkeeping. */
export type CoordinatorRecord = CoordinatorState & {
  projectId: string | null;
  lastBriefingAt: number;
};

/** An item row: the public item plus the evidence only the server reads. */
export type ItemRecord = CoordinatorItem & {
  approved: boolean;
  rejectedReason: string | null;
  review: ReviewVerdict | null;
  /** When the item last failed a check; checks wait for fresh thread activity after it. */
  failedAt: number | null;
};

export type Membership = {
  threadId: string;
  coordinatorThreadId: string;
  itemId: string | null;
  role: "coordinator" | ThreadRole;
};

export type ApprovalRecord = PendingApproval & {
  resolvedAt: number | null;
  outcome: string | null;
};

export type CardRecord = {
  ref: string;
  coordinatorThreadId: string;
  cardId: string;
  directive: string;
  createdAt: number;
  resolvedAt: number | null;
};

type CoordinatorRow = {
  thread_id: string;
  project_id: string | null;
  template_json: string;
  paused: number;
  auto_approve: number;
  rules_version: number;
  applied_rules_version: number;
  last_opened_at: number;
  last_briefing_at: number;
  briefed_at: number | null;
  created_at: number;
};

type ItemRow = {
  id: string;
  coordinator_thread_id: string;
  title: string;
  stage_index: number;
  status: string;
  reason: string | null;
  link: string | null;
  primary_thread_id: string | null;
  proposed: number;
  approved: number;
  rejected_reason: string | null;
  review_json: string | null;
  failed_at: number | null;
  summary: string | null;
  waiting_on: string | null;
  pr_json: string | null;
  created_at: number;
  updated_at: number;
};

type ApprovalRow = {
  id: string;
  coordinator_thread_id: string;
  item_id: string | null;
  action: string;
  summary: string;
  args_json: string;
  reason: string | null;
  created_at: number;
  resolved_at: number | null;
  outcome: string | null;
};

type CardRow = {
  ref: string;
  coordinator_thread_id: string;
  card_id: string;
  directive: string;
  created_at: number;
  resolved_at: number | null;
};

type LogRow = {
  id: number;
  coordinator_thread_id: string;
  item_id: string | null;
  kind: string;
  action: string | null;
  text: string;
  at: number;
};

const ITEM_STATUSES: readonly ItemStatus[] = ["active", "blocked", "cut", "done"];
const GATED_ACTIONS: readonly GatedAction[] = ["start_sub_thread", "archive_sub_thread", "merge_pr", "digest_publish"];

function toStatus(value: string): ItemStatus {
  return (ITEM_STATUSES as readonly string[]).includes(value) ? (value as ItemStatus) : "active";
}

function toAction(value: string): GatedAction {
  if (!(GATED_ACTIONS as readonly string[]).includes(value)) throw new Error(`Unknown gated action ${value}.`);
  return value as GatedAction;
}

function toRole(value: string): ThreadRole {
  return value === "primary" || value === "adopted" || value === "reviewer" ? value : "helper";
}

function toRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function parsePr(json: string | null): ItemPullRequest | null {
  if (json === null) return null;
  const value = toRecord(JSON.parse(json));
  const state = value.state === "open" || value.state === "closed" || value.state === "merged" || value.state === "draft" ? value.state : null;
  if (!state) return null;
  const checks = value.checks === "passing" || value.checks === "failing" || value.checks === "pending" ? value.checks : "none";
  return {
    number: typeof value.number === "number" ? value.number : null,
    url: typeof value.url === "string" ? value.url : null,
    state,
    checks,
  };
}

function fromCardRow(row: CardRow): CardRecord {
  return {
    ref: row.ref,
    coordinatorThreadId: row.coordinator_thread_id,
    cardId: row.card_id,
    directive: row.directive,
    createdAt: row.created_at,
    resolvedAt: row.resolved_at,
  };
}

function parseReview(json: string | null): ReviewVerdict | null {
  if (json === null) return null;
  const value = toRecord(JSON.parse(json));
  if (typeof value.pass !== "boolean") return null;
  return typeof value.findings === "string" ? { pass: value.pass, findings: value.findings } : { pass: value.pass };
}

function fromCoordinatorRow(row: CoordinatorRow): CoordinatorRecord {
  return {
    threadId: row.thread_id,
    projectId: row.project_id,
    // The template was validated with parseTemplate before it was stored.
    template: JSON.parse(row.template_json) as CoordinatorTemplate,
    paused: row.paused === 1,
    autoApprove: row.auto_approve === 1,
    rulesVersion: row.rules_version,
    appliedRulesVersion: row.applied_rules_version,
    lastOpenedAt: row.last_opened_at,
    lastBriefingAt: row.last_briefing_at,
    lastBriefedAt: row.briefed_at,
    createdAt: row.created_at,
  };
}

/** Private data stays in the plugin's own SQLite database, the only authority on membership. */
export function createStore(bb: Pick<BbPluginApi, "storage">) {
  const db = bb.storage.database();
  bb.storage.migrate(db, STORE_MIGRATIONS);

  const helperIds = (itemId: string): string[] =>
    (db.prepare("SELECT thread_id FROM item_threads WHERE item_id = ? AND role NOT IN ('primary', 'adopted') ORDER BY rowid").all(itemId) as { thread_id: string }[])
      .map((row) => row.thread_id);

  const fromItemRow = (row: ItemRow): ItemRecord => ({
    id: row.id,
    coordinatorThreadId: row.coordinator_thread_id,
    title: row.title,
    stageIndex: row.stage_index,
    status: toStatus(row.status),
    reason: row.reason,
    link: row.link,
    primaryThreadId: row.primary_thread_id,
    helperThreadIds: helperIds(row.id),
    proposed: row.proposed === 1,
    approved: row.approved === 1,
    rejectedReason: row.rejected_reason,
    review: parseReview(row.review_json),
    failedAt: row.failed_at,
    summary: row.summary,
    waitingOn: row.waiting_on,
    pr: parsePr(row.pr_json),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });

  const fromApprovalRow = (row: ApprovalRow): ApprovalRecord => ({
    id: row.id,
    coordinatorThreadId: row.coordinator_thread_id,
    itemId: row.item_id,
    action: toAction(row.action),
    summary: row.summary,
    args: toRecord(JSON.parse(row.args_json)),
    reason: row.reason,
    createdAt: row.created_at,
    resolvedAt: row.resolved_at,
    outcome: row.outcome,
  });

  const fromLogRow = (row: LogRow): LogEntry & { action: GatedAction | null } => ({
    id: row.id,
    coordinatorThreadId: row.coordinator_thread_id,
    itemId: row.item_id,
    kind: row.kind as LogEntry["kind"],
    text: row.text,
    at: row.at,
    action: row.action === null ? null : toAction(row.action),
  });

  const coordinators = {
    get(threadId: string): CoordinatorRecord | null {
      const row = db.prepare("SELECT * FROM coordinators WHERE thread_id = ?").get(threadId) as CoordinatorRow | undefined;
      return row ? fromCoordinatorRow(row) : null;
    },
    list(): CoordinatorRecord[] {
      return (db.prepare("SELECT * FROM coordinators ORDER BY created_at").all() as CoordinatorRow[]).map(fromCoordinatorRow);
    },
    insert(record: CoordinatorRecord): CoordinatorRecord {
      db.prepare(`INSERT INTO coordinators (thread_id, project_id, template_json, paused, auto_approve, rules_version,
        applied_rules_version, last_opened_at, last_briefing_at, briefed_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
        record.threadId, record.projectId, JSON.stringify(record.template), record.paused ? 1 : 0, record.autoApprove ? 1 : 0,
        record.rulesVersion, record.appliedRulesVersion, record.lastOpenedAt, record.lastBriefingAt, record.lastBriefedAt, record.createdAt,
      );
      return record;
    },
    update(threadId: string, patch: Partial<Omit<CoordinatorRecord, "threadId" | "createdAt">>): CoordinatorRecord {
      const previous = coordinators.get(threadId);
      if (!previous) throw new Error("This thread is not a coordinator.");
      const next: CoordinatorRecord = { ...previous, ...patch };
      db.prepare(`UPDATE coordinators SET project_id = ?, template_json = ?, paused = ?, auto_approve = ?, rules_version = ?,
        applied_rules_version = ?, last_opened_at = ?, last_briefing_at = ?, briefed_at = ? WHERE thread_id = ?`).run(
        next.projectId, JSON.stringify(next.template), next.paused ? 1 : 0, next.autoApprove ? 1 : 0, next.rulesVersion,
        next.appliedRulesVersion, next.lastOpenedAt, next.lastBriefingAt, next.lastBriefedAt, threadId,
      );
      return next;
    },
    /** Removes the coordinator and everything it tracks. Threads themselves are untouched. */
    delete(threadId: string): void {
      db.transaction(() => {
        db.prepare("DELETE FROM item_threads WHERE item_id IN (SELECT id FROM items WHERE coordinator_thread_id = ?)").run(threadId);
        db.prepare("DELETE FROM items WHERE coordinator_thread_id = ?").run(threadId);
        db.prepare("DELETE FROM approvals WHERE coordinator_thread_id = ?").run(threadId);
        db.prepare("DELETE FROM log WHERE coordinator_thread_id = ?").run(threadId);
        db.prepare("DELETE FROM cards WHERE coordinator_thread_id = ?").run(threadId);
        db.prepare("DELETE FROM coordinators WHERE thread_id = ?").run(threadId);
      })();
    },
  };

  const items = {
    get(id: string): ItemRecord | null {
      const row = db.prepare("SELECT * FROM items WHERE id = ?").get(id) as ItemRow | undefined;
      return row ? fromItemRow(row) : null;
    },
    list(coordinatorThreadId: string): ItemRecord[] {
      return (db.prepare("SELECT * FROM items WHERE coordinator_thread_id = ? ORDER BY created_at, id").all(coordinatorThreadId) as ItemRow[])
        .map(fromItemRow);
    },
    /** Creates an item; its primary sub-thread, if any, is recorded with `primaryRole`. */
    create(record: ItemRecord, primaryRole: "primary" | "adopted" = "primary"): ItemRecord {
      db.transaction(() => {
        db.prepare(`INSERT INTO items (id, coordinator_thread_id, title, stage_index, status, reason, link, primary_thread_id,
          proposed, approved, rejected_reason, review_json, failed_at, summary, waiting_on, pr_json, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
          record.id, record.coordinatorThreadId, record.title, record.stageIndex, record.status, record.reason, record.link,
          record.primaryThreadId, record.proposed ? 1 : 0, record.approved ? 1 : 0, record.rejectedReason,
          record.review ? JSON.stringify(record.review) : null, record.failedAt, record.summary, record.waitingOn,
          record.pr ? JSON.stringify(record.pr) : null, record.createdAt, record.updatedAt,
        );
        if (record.primaryThreadId) threads.add(record.id, record.primaryThreadId, primaryRole);
      })();
      return items.get(record.id) ?? record;
    },
    /**
     * Saves stage, status, and evidence. Summary, waiting-on, and PR are written only by
     * setContext and setPr, so a save from a stale read never undoes them.
     */
    save(record: ItemRecord): ItemRecord {
      db.prepare(`UPDATE items SET title = ?, stage_index = ?, status = ?, reason = ?, link = ?, primary_thread_id = ?, proposed = ?,
        approved = ?, rejected_reason = ?, review_json = ?, failed_at = ?, updated_at = ? WHERE id = ?`).run(
        record.title, record.stageIndex, record.status, record.reason, record.link, record.primaryThreadId, record.proposed ? 1 : 0,
        record.approved ? 1 : 0, record.rejectedReason, record.review ? JSON.stringify(record.review) : null, record.failedAt,
        record.updatedAt, record.id,
      );
      return items.get(record.id) ?? record;
    },
    /** Updates the coordinator's summary and waiting-on text; undefined leaves a field as it is. */
    setContext(id: string, context: { summary?: string | null; waitingOn?: string | null }, at: number): ItemRecord | null {
      const current = items.get(id);
      if (!current) return null;
      db.prepare("UPDATE items SET summary = ?, waiting_on = ?, updated_at = ? WHERE id = ?").run(
        context.summary === undefined ? current.summary : context.summary,
        context.waitingOn === undefined ? current.waitingOn : context.waitingOn,
        at, id,
      );
      return items.get(id);
    },
    /** Records the last PR evidence read for the item. Leaves updatedAt alone: reading is not a change. */
    setPr(id: string, pr: ItemPullRequest): void {
      db.prepare("UPDATE items SET pr_json = ? WHERE id = ?").run(JSON.stringify(pr), id);
    },
  };

  const threads = {
    /** Records a sub-thread for an item. A thread belongs to at most one item. */
    add(itemId: string, threadId: string, role: ThreadRole): void {
      db.transaction(() => {
        db.prepare("DELETE FROM item_threads WHERE thread_id = ?").run(threadId);
        db.prepare("INSERT INTO item_threads (item_id, thread_id, role) VALUES (?, ?, ?)").run(itemId, threadId, role);
        if (isPrimaryRole(role)) {
          db.prepare("UPDATE items SET primary_thread_id = ? WHERE id = ?").run(threadId, itemId);
        }
      })();
    },
    /** Whether the thread is recorded for any item, live or not. */
    has(threadId: string): boolean {
      return db.prepare("SELECT 1 FROM item_threads WHERE thread_id = ?").get(threadId) !== undefined;
    },
  };

  /**
   * Every coordinator and member sub-thread, for the synchronous in-memory membership cache.
   * Only open (active or blocked) items confer membership on their sub-threads.
   */
  const memberships = (): Membership[] => {
    const result: Membership[] = (db.prepare("SELECT thread_id FROM coordinators").all() as { thread_id: string }[])
      .map((row) => ({ threadId: row.thread_id, coordinatorThreadId: row.thread_id, itemId: null, role: "coordinator" }));
    const rows = db.prepare(`SELECT t.thread_id, t.item_id, t.role, i.coordinator_thread_id FROM item_threads t
      JOIN items i ON i.id = t.item_id
      WHERE i.status IN ('active', 'blocked')`).all() as { thread_id: string; item_id: string; role: string; coordinator_thread_id: string }[];
    for (const row of rows) {
      result.push({
        threadId: row.thread_id,
        coordinatorThreadId: row.coordinator_thread_id,
        itemId: row.item_id,
        role: toRole(row.role),
      });
    }
    return result;
  };

  const approvals = {
    create(record: PendingApproval): void {
      db.prepare(`INSERT INTO approvals (id, coordinator_thread_id, item_id, action, summary, args_json, reason, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(
        record.id, record.coordinatorThreadId, record.itemId, record.action, record.summary, JSON.stringify(record.args), record.reason,
        record.createdAt,
      );
    },
    get(id: string): ApprovalRecord | null {
      const row = db.prepare("SELECT * FROM approvals WHERE id = ?").get(id) as ApprovalRow | undefined;
      return row ? fromApprovalRow(row) : null;
    },
    pending(coordinatorThreadId: string): PendingApproval[] {
      return (db.prepare("SELECT * FROM approvals WHERE coordinator_thread_id = ? AND resolved_at IS NULL ORDER BY created_at, id")
        .all(coordinatorThreadId) as ApprovalRow[])
        .map(fromApprovalRow)
        .map(({ resolvedAt: _resolvedAt, outcome: _outcome, ...approval }) => approval);
    },
    /** Marks the approval resolved; returns false when it was already resolved. */
    resolve(id: string, outcome: string, at: number): boolean {
      return db.prepare("UPDATE approvals SET resolved_at = ?, outcome = ? WHERE id = ? AND resolved_at IS NULL").run(at, outcome, id).changes > 0;
    },
  };

  const log = {
    append(entry: { coordinatorThreadId: string; itemId: string | null; kind: LogEntry["kind"]; text: string; at: number; action?: GatedAction | null }): void {
      db.prepare("INSERT INTO log (coordinator_thread_id, item_id, kind, action, text, at) VALUES (?, ?, ?, ?, ?, ?)").run(
        entry.coordinatorThreadId, entry.itemId, entry.kind, entry.action ?? null, entry.text, entry.at,
      );
    },
    list(coordinatorThreadId: string, since = 0): Array<LogEntry & { action: GatedAction | null }> {
      return (db.prepare("SELECT * FROM log WHERE coordinator_thread_id = ? AND at > ? ORDER BY at, id").all(coordinatorThreadId, since) as LogRow[])
        .map(fromLogRow);
    },
    /** Whether the item has any entry of these kinds, optionally for one action. */
    has(itemId: string, kinds: LogEntry["kind"][], action?: GatedAction): boolean {
      const marks = kinds.map(() => "?").join(", ");
      const sql = `SELECT 1 FROM log WHERE item_id = ? AND kind IN (${marks})${action ? " AND action = ?" : ""} LIMIT 1`;
      const values: string[] = [itemId, ...kinds, ...(action ? [action] : [])];
      return db.prepare(sql).get(...values) !== undefined;
    },
  };

  const activity = {
    get(threadId: string): { lastActiveAt: number | null; lastIdleAt: number | null } {
      const row = db.prepare("SELECT last_active_at, last_idle_at FROM thread_activity WHERE thread_id = ?").get(threadId) as
        | { last_active_at: number | null; last_idle_at: number | null }
        | undefined;
      return { lastActiveAt: row?.last_active_at ?? null, lastIdleAt: row?.last_idle_at ?? null };
    },
    markActive(threadId: string, at: number): void {
      db.prepare(`INSERT INTO thread_activity (thread_id, last_active_at) VALUES (?, ?)
        ON CONFLICT(thread_id) DO UPDATE SET last_active_at = excluded.last_active_at`).run(threadId, at);
    },
    markIdle(threadId: string, at: number): void {
      db.prepare(`INSERT INTO thread_activity (thread_id, last_idle_at) VALUES (?, ?)
        ON CONFLICT(thread_id) DO UPDATE SET last_idle_at = excluded.last_idle_at`).run(threadId, at);
    },
  };

  const cards = {
    get(ref: string): CardRecord | null {
      const row = db.prepare("SELECT * FROM cards WHERE ref = ?").get(ref) as CardRow | undefined;
      return row ? fromCardRow(row) : null;
    },
    /** Cards not yet resolved, oldest first. */
    open(coordinatorThreadId: string): CardRecord[] {
      return (db.prepare("SELECT * FROM cards WHERE coordinator_thread_id = ? AND resolved_at IS NULL ORDER BY created_at, ref")
        .all(coordinatorThreadId) as CardRow[]).map(fromCardRow);
    },
    /** Records a card Action Cards created (or reopened) for a ref, open again. */
    upsert(record: Omit<CardRecord, "resolvedAt">): void {
      db.prepare(`INSERT INTO cards (ref, coordinator_thread_id, card_id, directive, created_at, resolved_at) VALUES (?, ?, ?, ?, ?, NULL)
        ON CONFLICT(ref) DO UPDATE SET coordinator_thread_id = excluded.coordinator_thread_id, card_id = excluded.card_id,
        directive = excluded.directive, created_at = excluded.created_at, resolved_at = NULL`).run(
        record.ref, record.coordinatorThreadId, record.cardId, record.directive, record.createdAt,
      );
    },
    /** Marks the ref's card resolved; returns false when it was not open. */
    resolve(ref: string, at: number): boolean {
      return db.prepare("UPDATE cards SET resolved_at = ? WHERE ref = ? AND resolved_at IS NULL").run(at, ref).changes > 0;
    },
    reopen(ref: string): void {
      db.prepare("UPDATE cards SET resolved_at = NULL WHERE ref = ?").run(ref);
    },
  };

  return { coordinators, items, threads, memberships, approvals, log, activity, cards };
}
