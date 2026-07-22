import { randomUUID } from "node:crypto";

import type { BbPluginApi } from "@bb/plugin-sdk";

const THREAD_PAGE_SIZE = 1_000;
const TIMELINE_SEGMENT_LIMIT = "100";
const TIMELINE_CONCURRENCY = 8;
const DEFAULT_RECONCILE_INTERVAL_MS = 30 * 24 * 60 * 60 * 1_000;
const STARTUP_RECONCILE_GAP_MS = 5 * 60 * 1_000;

const META_INITIALIZED_AT = "initialized_at";
const META_LAST_RECONCILED_AT = "last_reconciled_at";
const META_LAST_PREPARED_AT = "last_prepared_at";

type ThreadList = Awaited<ReturnType<BbPluginApi["sdk"]["threads"]["list"]>>;
type ThreadListItem = ThreadList[number];
type ThreadTimeline = Awaited<
  ReturnType<BbPluginApi["sdk"]["threads"]["timeline"]>
>;

export interface HistoryThread {
  id: string;
  projectId: string;
  title: string | null;
  titleFallback: string | null;
  visibility: "visible" | "hidden";
  originPluginId: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface HistoryScanOptions {
  leaseSeconds: number;
  limit: number;
  maxBytes: number;
  maxMessageBytes: number;
  forceReconcile?: boolean;
  signal?: AbortSignal;
}

export interface HistoryAdvanceInput {
  leaseId: string;
}

export interface ThreadHistoryMaintenanceOptions {
  beforeScan?: () => Promise<void>;
  legacyStateKeys?: string[];
  reconcileIntervalMs?: number;
}

interface StoredThread {
  thread_id: string;
  project_id: string;
  title: string;
  checkpoint_sequence: number | null;
  checkpoint_at: number;
  latest_thread_updated_at: number;
  pending: number;
  pending_since: number | null;
}

interface StoredLease {
  id: string;
  acquired_at: number;
  expires_at: number;
}

interface StoredLeaseItem {
  thread_id: string;
  target_sequence: number;
  target_at: number;
  observed_thread_updated_at: number;
  complete: number;
}

interface HistoryMessage {
  source_key: string;
  source_sequence: number;
  role: "user" | "assistant";
  created_at: number;
  text: string;
  truncated: boolean;
}

interface LoadedEpisode {
  state: StoredThread;
  messages: HistoryMessage[];
  targetSequence: number;
  targetAt: number;
}

interface LeaseTarget {
  threadId: string;
  targetSequence: number;
  targetAt: number;
  observedThreadUpdatedAt: number;
  complete: boolean;
}

function isEligibleThread(thread: HistoryThread): boolean {
  return thread.visibility === "visible" && thread.originPluginId === null;
}

function utf8Length(value: string): number {
  return new TextEncoder().encode(value).length;
}

function clipUtf8(value: string, maxBytes: number): string {
  const encoded = new TextEncoder().encode(value);
  if (encoded.length <= maxBytes) return value;
  return new TextDecoder("utf-8", { fatal: false })
    .decode(encoded.slice(0, maxBytes))
    .replace(/\uFFFD$/, "");
}

function isDirectUserMessage(text: string): boolean {
  const stripped = text.trimStart();
  return !(
    stripped.startsWith("[bb system]") ||
    stripped.startsWith("[bb message") ||
    stripped.startsWith("<bb system")
  );
}

function titleFor(thread: HistoryThread): string {
  return thread.title ?? thread.titleFallback ?? "";
}

async function listAllThreads(
  bb: BbPluginApi,
  signal?: AbortSignal,
): Promise<ThreadListItem[]> {
  const byId = new Map<string, ThreadListItem>();
  for (const archived of [false, true]) {
    for (let offset = 0; ; offset += THREAD_PAGE_SIZE) {
      const page = await bb.sdk.threads.list({
        archived,
        limit: THREAD_PAGE_SIZE,
        offset,
        signal,
      });
      for (const thread of page) byId.set(thread.id, thread);
      if (page.length < THREAD_PAGE_SIZE) break;
    }
  }
  return [...byId.values()].filter(isEligibleThread);
}

function legacyCursorAt(value: unknown, now: number): number | null {
  if (typeof value !== "object" || value === null) return null;
  const record = value as Record<string, unknown>;
  const lease = record.lease;
  if (typeof lease === "object" && lease !== null) {
    const leaseRecord = lease as Record<string, unknown>;
    if (
      typeof leaseRecord.id === "string" &&
      typeof leaseRecord.expires_at === "number" &&
      leaseRecord.expires_at > now
    ) {
      throw new Error(
        `legacy maintenance lease ${leaseRecord.id} is active until ${leaseRecord.expires_at}`,
      );
    }
  }
  const cursor = record.cursor;
  if (typeof cursor !== "object" || cursor === null) return null;
  const createdAt = (cursor as Record<string, unknown>).created_at;
  return typeof createdAt === "number" && Number.isSafeInteger(createdAt)
    ? createdAt
    : null;
}

function messageFromRow(
  row: ThreadTimeline["rows"][number],
  maxMessageBytes: number,
): HistoryMessage | null {
  if (row.kind !== "conversation") return null;
  if (
    row.role === "user" &&
    (row.initiator !== "user" || !isDirectUserMessage(row.text))
  ) {
    return null;
  }
  const text = clipUtf8(row.text, maxMessageBytes);
  return {
    source_key: row.id,
    source_sequence: row.sourceSeqEnd,
    role: row.role,
    created_at: row.createdAt,
    text,
    truncated: text !== row.text,
  };
}

async function loadEpisode(
  bb: BbPluginApi,
  state: StoredThread,
  maxMessageBytes: number,
  signal?: AbortSignal,
): Promise<LoadedEpisode> {
  const rows = new Map<string, ThreadTimeline["rows"][number]>();
  let beforeAnchorSeq: string | undefined;
  let beforeAnchorId: string | undefined;
  let targetSequence = state.checkpoint_sequence ?? 0;

  while (true) {
    const timeline = await bb.sdk.threads.timeline({
      threadId: state.thread_id,
      includeNestedRows: "false",
      segmentLimit: TIMELINE_SEGMENT_LIMIT,
      signal,
      ...(beforeAnchorSeq === undefined
        ? {}
        : { beforeAnchorSeq, beforeAnchorId }),
    });
    if (beforeAnchorSeq === undefined) targetSequence = timeline.maxSeq;

    for (const row of timeline.rows) {
      const isNew =
        state.checkpoint_sequence === null
          ? row.createdAt >= state.checkpoint_at
          : row.sourceSeqEnd > state.checkpoint_sequence;
      if (isNew) rows.set(row.id, row);
    }

    const oldestCreatedAt = timeline.rows.reduce(
      (oldest, row) => Math.min(oldest, row.createdAt),
      Number.POSITIVE_INFINITY,
    );
    const oldestSequence = timeline.rows.reduce(
      (oldest, row) => Math.min(oldest, row.sourceSeqStart),
      Number.POSITIVE_INFINITY,
    );
    const reachedCheckpoint =
      state.checkpoint_sequence === null
        ? oldestCreatedAt < state.checkpoint_at
        : oldestSequence <= state.checkpoint_sequence;
    const olderCursor = timeline.timelinePage.olderCursor;
    if (
      reachedCheckpoint ||
      !timeline.timelinePage.hasOlderRows ||
      olderCursor === null
    ) {
      break;
    }
    beforeAnchorSeq = String(olderCursor.anchorSeq);
    beforeAnchorId = olderCursor.anchorId;
  }

  const messages = [...rows.values()]
    .sort(
      (left, right) =>
        left.sourceSeqStart - right.sourceSeqStart ||
        left.id.localeCompare(right.id),
    )
    .map((row) => messageFromRow(row, maxMessageBytes))
    .filter((message): message is HistoryMessage => message !== null);

  return {
    state,
    messages,
    targetSequence,
    targetAt: state.latest_thread_updated_at,
  };
}

export function createThreadHistoryMaintenance(
  bb: BbPluginApi,
  options: ThreadHistoryMaintenanceOptions = {},
) {
  const db = bb.storage.database();
  bb.storage.migrate(db, [
    `CREATE TABLE IF NOT EXISTS thread_history_meta (
      key TEXT PRIMARY KEY,
      integer_value INTEGER
    )`,
    `CREATE TABLE IF NOT EXISTS thread_history_threads (
      thread_id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      title TEXT NOT NULL,
      checkpoint_sequence INTEGER,
      checkpoint_at INTEGER NOT NULL,
      latest_thread_updated_at INTEGER NOT NULL,
      pending INTEGER NOT NULL DEFAULT 0,
      pending_since INTEGER,
      last_seen_at INTEGER NOT NULL
    )`,
    `CREATE INDEX IF NOT EXISTS thread_history_pending_idx
      ON thread_history_threads (pending, pending_since, thread_id)`,
    `CREATE TABLE IF NOT EXISTS thread_history_leases (
      id TEXT PRIMARY KEY,
      acquired_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS thread_history_lease_items (
      lease_id TEXT NOT NULL,
      thread_id TEXT NOT NULL,
      target_sequence INTEGER NOT NULL,
      target_at INTEGER NOT NULL,
      observed_thread_updated_at INTEGER NOT NULL,
      complete INTEGER NOT NULL,
      PRIMARY KEY (lease_id, thread_id)
    )`,
    `ALTER TABLE thread_history_threads
      ADD COLUMN created_observed INTEGER NOT NULL DEFAULT 0`,
  ]);

  const reconcileIntervalMs =
    options.reconcileIntervalMs ?? DEFAULT_RECONCILE_INTERVAL_MS;
  let startupReconcileRequired = true;
  let queue: Promise<unknown> = Promise.resolve();

  function exclusive<T>(operation: () => Promise<T>): Promise<T> {
    const result = queue.then(operation, operation);
    queue = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  }

  function meta(key: string): number | null {
    const row = db
      .prepare("SELECT integer_value FROM thread_history_meta WHERE key = ?")
      .get(key) as { integer_value: number } | undefined;
    return row?.integer_value ?? null;
  }

  function setMeta(key: string, value: number): void {
    db.prepare(
      `INSERT INTO thread_history_meta (key, integer_value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET integer_value = excluded.integer_value`,
    ).run(key, value);
  }

  const lastPreparedAt = meta(META_LAST_PREPARED_AT);
  startupReconcileRequired =
    lastPreparedAt === null ||
    Date.now() - lastPreparedAt >= STARTUP_RECONCILE_GAP_MS;

  function activeLease(now: number): StoredLease | null {
    const leases = db
      .prepare(
        "SELECT id, acquired_at, expires_at FROM thread_history_leases ORDER BY acquired_at LIMIT 1",
      )
      .all() as StoredLease[];
    const lease = leases[0] ?? null;
    if (lease === null) return null;
    if (lease.expires_at > now) return lease;
    const clear = db.transaction(() => {
      db.prepare("DELETE FROM thread_history_lease_items WHERE lease_id = ?").run(
        lease.id,
      );
      db.prepare("DELETE FROM thread_history_leases WHERE id = ?").run(lease.id);
    });
    clear();
    return null;
  }

  function repairStalePrebaselineRows(): number {
    const result = db.prepare(
      `UPDATE thread_history_threads SET
        checkpoint_at = latest_thread_updated_at,
        pending = 0,
        pending_since = NULL
      WHERE checkpoint_sequence IS NULL
        AND checkpoint_at = 0
        AND created_observed = 0`,
    ).run();
    return result.changes;
  }

  async function initialize(
    now: number,
    signal?: AbortSignal,
  ): Promise<{ established: boolean; reconciled: boolean }> {
    if (meta(META_INITIALIZED_AT) !== null) {
      return { established: false, reconciled: false };
    }

    let legacyAt: number | null = null;
    for (const key of options.legacyStateKeys ?? []) {
      const value = await bb.storage.kv.get<unknown>(key);
      const candidate = legacyCursorAt(value, now);
      if (candidate !== null && (legacyAt === null || candidate > legacyAt)) {
        legacyAt = candidate;
      }
    }

    const threads = await listAllThreads(bb, signal);
    const insert = db.prepare(
      `INSERT OR IGNORE INTO thread_history_threads (
        thread_id, project_id, title, checkpoint_sequence, checkpoint_at,
        latest_thread_updated_at, pending, pending_since, last_seen_at,
        created_observed
      ) VALUES (?, ?, ?, NULL, ?, ?, ?, ?, ?, 0)`,
    );
    const write = db.transaction(() => {
      for (const thread of threads) {
        const pending = legacyAt !== null && thread.updatedAt > legacyAt;
        insert.run(
          thread.id,
          thread.projectId,
          titleFor(thread),
          legacyAt ?? thread.updatedAt,
          thread.updatedAt,
          pending ? 1 : 0,
          pending ? now : null,
          now,
        );
      }
      setMeta(META_INITIALIZED_AT, now);
      setMeta(META_LAST_RECONCILED_AT, now);
    });
    write();
    for (const key of options.legacyStateKeys ?? []) {
      await bb.storage.kv.delete(key);
    }
    startupReconcileRequired = false;
    return { established: threads.length > 0, reconciled: true };
  }

  async function reconcile(
    now: number,
    signal?: AbortSignal,
  ): Promise<void> {
    const threads = await listAllThreads(bb, signal);
    const upsert = db.prepare(
      `INSERT INTO thread_history_threads (
        thread_id, project_id, title, checkpoint_sequence, checkpoint_at,
        latest_thread_updated_at, pending, pending_since, last_seen_at,
        created_observed
      ) VALUES (?, ?, ?, NULL, 1, ?, 1, ?, ?, 0)
      ON CONFLICT(thread_id) DO UPDATE SET
        project_id = excluded.project_id,
        title = excluded.title,
        pending = CASE
          WHEN excluded.latest_thread_updated_at > thread_history_threads.latest_thread_updated_at
          THEN 1 ELSE thread_history_threads.pending END,
        pending_since = CASE
          WHEN excluded.latest_thread_updated_at > thread_history_threads.latest_thread_updated_at
          THEN COALESCE(thread_history_threads.pending_since, excluded.pending_since)
          ELSE thread_history_threads.pending_since END,
        latest_thread_updated_at = MAX(
          thread_history_threads.latest_thread_updated_at,
          excluded.latest_thread_updated_at
        ),
        last_seen_at = excluded.last_seen_at`,
    );
    const write = db.transaction(() => {
      for (const thread of threads) {
        upsert.run(
          thread.id,
          thread.projectId,
          titleFor(thread),
          thread.updatedAt,
          now,
          now,
        );
      }
      setMeta(META_LAST_RECONCILED_AT, now);
    });
    write();
    startupReconcileRequired = false;
  }

  function advanceStoredThread(target: LeaseTarget): void {
    const current = db
      .prepare(
        "SELECT latest_thread_updated_at FROM thread_history_threads WHERE thread_id = ?",
      )
      .get(target.threadId) as
      | { latest_thread_updated_at: number }
      | undefined;
    if (current === undefined) return;
    const stillPending =
      !target.complete ||
      current.latest_thread_updated_at > target.observedThreadUpdatedAt;
    db.prepare(
      `UPDATE thread_history_threads SET
        checkpoint_sequence = ?,
        checkpoint_at = ?,
        pending = ?,
        pending_since = CASE WHEN ? = 1 THEN COALESCE(pending_since, ?) ELSE NULL END
      WHERE thread_id = ?`,
    ).run(
      target.targetSequence,
      target.targetAt,
      stillPending ? 1 : 0,
      stillPending ? 1 : 0,
      Date.now(),
      target.threadId,
    );
  }

  function pendingCount(): number {
    const row = db
      .prepare("SELECT COUNT(*) AS count FROM thread_history_threads WHERE pending = 1")
      .get() as { count: number };
    return row.count;
  }

  return {
    prepare() {
      return exclusive(async () => {
        const now = Date.now();
        const initialized = await initialize(now);
        repairStalePrebaselineRows();
        setMeta(META_LAST_PREPARED_AT, now);
        return { inventory_reconciled: initialized.reconciled };
      });
    },

    observeCreated(thread: HistoryThread) {
      return exclusive(async () => {
        if (!isEligibleThread(thread)) return { tracked: false };
        const now = Date.now();
        db.prepare(
          `INSERT INTO thread_history_threads (
            thread_id, project_id, title, checkpoint_sequence, checkpoint_at,
            latest_thread_updated_at, pending, pending_since, last_seen_at,
            created_observed
          ) VALUES (?, ?, ?, NULL, 0, ?, 0, NULL, ?, 1)
          ON CONFLICT(thread_id) DO UPDATE SET
            project_id = excluded.project_id,
            title = excluded.title,
            latest_thread_updated_at = MAX(
              thread_history_threads.latest_thread_updated_at,
              excluded.latest_thread_updated_at
            ),
            last_seen_at = excluded.last_seen_at`,
        ).run(
          thread.id,
          thread.projectId,
          titleFor(thread),
          thread.updatedAt,
          now,
        );
        return { tracked: true };
      });
    },

    observeThread(thread: HistoryThread) {
      return exclusive(async () => {
        if (!isEligibleThread(thread)) return { queued: false };
        const now = Date.now();
        const existing = db
          .prepare(
            "SELECT thread_id FROM thread_history_threads WHERE thread_id = ?",
          )
          .get(thread.id) as { thread_id: string } | undefined;
        if (existing === undefined) {
          db.prepare(
            `INSERT INTO thread_history_threads (
              thread_id, project_id, title, checkpoint_sequence, checkpoint_at,
              latest_thread_updated_at, pending, pending_since, last_seen_at,
              created_observed
            ) VALUES (?, ?, ?, NULL, ?, ?, 0, NULL, ?, 0)`,
          ).run(
            thread.id,
            thread.projectId,
            titleFor(thread),
            thread.updatedAt,
            thread.updatedAt,
            now,
          );
          return { queued: false };
        }
        db.prepare(
          `UPDATE thread_history_threads SET
            project_id = ?,
            title = ?,
            latest_thread_updated_at = MAX(latest_thread_updated_at, ?),
            pending = 1,
            pending_since = COALESCE(pending_since, ?),
            last_seen_at = ?
          WHERE thread_id = ?`,
        ).run(
          thread.projectId,
          titleFor(thread),
          thread.updatedAt,
          now,
          now,
          thread.id,
        );
        return { queued: true };
      });
    },

    forgetThread(threadId: string) {
      return exclusive(async () => {
        db.prepare("DELETE FROM thread_history_lease_items WHERE thread_id = ?").run(
          threadId,
        );
        const result = db
          .prepare("DELETE FROM thread_history_threads WHERE thread_id = ?")
          .run(threadId);
        return { forgotten: result.changes > 0 };
      });
    },

    scan(scanOptions: HistoryScanOptions) {
      return exclusive(async () => {
        await options.beforeScan?.();
        const now = Date.now();
        const lease = activeLease(now);
        if (lease !== null) {
          throw new Error(
            `maintenance lease ${lease.id} is active until ${lease.expires_at}`,
          );
        }

        const initialized = await initialize(now, scanOptions.signal);
        repairStalePrebaselineRows();
        let inventoryReconciled = initialized.reconciled;
        const lastReconciledAt = meta(META_LAST_RECONCILED_AT) ?? 0;
        if (
          !initialized.reconciled &&
          (scanOptions.forceReconcile === true ||
            startupReconcileRequired ||
            now - lastReconciledAt >= reconcileIntervalMs)
        ) {
          await reconcile(now, scanOptions.signal);
          inventoryReconciled = true;
        }

        const candidateLimit = Math.min(Math.max(scanOptions.limit, 8), 1_000);
        const candidates = db
          .prepare(
            `SELECT thread_id, project_id, title, checkpoint_sequence,
              checkpoint_at, latest_thread_updated_at, pending, pending_since
            FROM thread_history_threads
            WHERE pending = 1
            ORDER BY pending_since, thread_id
            LIMIT ?`,
          )
          .all(candidateLimit) as StoredThread[];

        const episodes: Array<{
          thread_id: string;
          project_id: string;
          title: string;
          checkpoint_before: { sequence: number | null; updated_at: number };
          checkpoint_commit: { sequence: number; updated_at: number };
          complete: boolean;
          messages: HistoryMessage[];
        }> = [];
        const leaseTargets: LeaseTarget[] = [];
        const automaticTargets: LeaseTarget[] = [];
        let messageCount = 0;
        let messageBytes = 0;
        let hitBound = false;
        let deferredThreadCount = 0;

        for (let start = 0; start < candidates.length && !hitBound; start += TIMELINE_CONCURRENCY) {
          const loaded = await Promise.all(
            candidates
              .slice(start, start + TIMELINE_CONCURRENCY)
              .map(async (candidate) => {
                const thread = await bb.sdk.threads.get({
                  threadId: candidate.thread_id,
                  signal: scanOptions.signal,
                });
                if (thread.status !== "idle" && thread.status !== "error") {
                  return null;
                }
                return loadEpisode(
                  bb,
                  candidate,
                  scanOptions.maxMessageBytes,
                  scanOptions.signal,
                );
              }),
          );

          for (const episode of loaded) {
            if (episode === null) {
              deferredThreadCount += 1;
              continue;
            }
            if (episode.messages.length === 0) {
              automaticTargets.push({
                threadId: episode.state.thread_id,
                targetSequence: episode.targetSequence,
                targetAt: episode.targetAt,
                observedThreadUpdatedAt: episode.state.latest_thread_updated_at,
                complete: true,
              });
              continue;
            }

            const remainingCount = scanOptions.limit - messageCount;
            const remainingBytes = scanOptions.maxBytes - messageBytes;
            const fullBytes = episode.messages.reduce(
              (total, message) => total + utf8Length(message.text),
              0,
            );
            let selected = episode.messages;
            let complete = true;
            if (
              selected.length > remainingCount ||
              fullBytes > remainingBytes
            ) {
              if (episodes.length > 0) {
                hitBound = true;
                break;
              }
              selected = [];
              let selectedBytes = 0;
              for (const message of episode.messages) {
                const bytes = utf8Length(message.text);
                if (
                  selected.length >= remainingCount ||
                  selectedBytes + bytes > remainingBytes
                ) {
                  break;
                }
                selected.push(message);
                selectedBytes += bytes;
              }
              complete = selected.length === episode.messages.length;
            }

            if (selected.length === 0) {
              hitBound = true;
              break;
            }
            const selectedBytes = selected.reduce(
              (total, message) => total + utf8Length(message.text),
              0,
            );
            const lastMessage = selected[selected.length - 1];
            const targetSequence = complete
              ? episode.targetSequence
              : lastMessage.source_sequence;
            const targetAt = complete
              ? episode.targetAt
              : lastMessage.created_at;
            episodes.push({
              thread_id: episode.state.thread_id,
              project_id: episode.state.project_id,
              title: episode.state.title,
              checkpoint_before: {
                sequence: episode.state.checkpoint_sequence,
                updated_at: episode.state.checkpoint_at,
              },
              checkpoint_commit: {
                sequence: targetSequence,
                updated_at: targetAt,
              },
              complete,
              messages: selected,
            });
            leaseTargets.push({
              threadId: episode.state.thread_id,
              targetSequence,
              targetAt,
              observedThreadUpdatedAt: episode.state.latest_thread_updated_at,
              complete,
            });
            messageCount += selected.length;
            messageBytes += selectedBytes;
            if (
              messageCount >= scanOptions.limit ||
              messageBytes >= scanOptions.maxBytes ||
              !complete
            ) {
              hitBound = true;
              break;
            }
          }
        }

        if (automaticTargets.length > 0) {
          const applyAutomatic = db.transaction(() => {
            for (const target of automaticTargets) advanceStoredThread(target);
          });
          applyAutomatic();
        }

        if (leaseTargets.length === 0) {
          return {
            baseline_established: initialized.established,
            inventory_reconciled: inventoryReconciled,
            checkpoint_mode: "per-thread" as const,
            lease_id: null,
            episodes,
            episode_count: 0,
            message_count: 0,
            message_bytes: 0,
            pending_thread_count: pendingCount(),
            deferred_thread_count: deferredThreadCount,
          };
        }

        const leaseId = randomUUID().replaceAll("-", "");
        const expiresAt = now + scanOptions.leaseSeconds * 1_000;
        const insertLease = db.transaction(() => {
          db.prepare(
            "INSERT INTO thread_history_leases (id, acquired_at, expires_at) VALUES (?, ?, ?)",
          ).run(leaseId, now, expiresAt);
          const insertItem = db.prepare(
            `INSERT INTO thread_history_lease_items (
              lease_id, thread_id, target_sequence, target_at,
              observed_thread_updated_at, complete
            ) VALUES (?, ?, ?, ?, ?, ?)`,
          );
          for (const target of leaseTargets) {
            insertItem.run(
              leaseId,
              target.threadId,
              target.targetSequence,
              target.targetAt,
              target.observedThreadUpdatedAt,
              target.complete ? 1 : 0,
            );
          }
        });
        insertLease();

        return {
          baseline_established: initialized.established,
          inventory_reconciled: inventoryReconciled,
          checkpoint_mode: "per-thread" as const,
          lease_id: leaseId,
          lease_expires_at: expiresAt,
          episodes,
          episode_count: episodes.length,
          message_count: messageCount,
          message_bytes: messageBytes,
          pending_thread_count: pendingCount(),
          deferred_thread_count: deferredThreadCount,
        };
      });
    },

    advance(input: HistoryAdvanceInput) {
      return exclusive(async () => {
        const lease = db
          .prepare(
            "SELECT id, acquired_at, expires_at FROM thread_history_leases WHERE id = ?",
          )
          .get(input.leaseId) as StoredLease | undefined;
        if (lease === undefined) {
          throw new Error("maintenance lease does not match this run");
        }
        const items = db
          .prepare(
            `SELECT thread_id, target_sequence, target_at,
              observed_thread_updated_at, complete
            FROM thread_history_lease_items WHERE lease_id = ?`,
          )
          .all(input.leaseId) as StoredLeaseItem[];
        const apply = db.transaction(() => {
          for (const item of items) {
            advanceStoredThread({
              threadId: item.thread_id,
              targetSequence: item.target_sequence,
              targetAt: item.target_at,
              observedThreadUpdatedAt: item.observed_thread_updated_at,
              complete: item.complete === 1,
            });
          }
          db.prepare("DELETE FROM thread_history_lease_items WHERE lease_id = ?").run(
            input.leaseId,
          );
          db.prepare("DELETE FROM thread_history_leases WHERE id = ?").run(
            input.leaseId,
          );
        });
        apply();
        return {
          advanced_threads: items.length,
          pending_thread_count: pendingCount(),
        };
      });
    },

    release(leaseId: string) {
      return exclusive(async () => {
        const lease = db
          .prepare("SELECT id FROM thread_history_leases WHERE id = ?")
          .get(leaseId) as { id: string } | undefined;
        if (lease === undefined) {
          throw new Error("maintenance lease does not match this run");
        }
        const clear = db.transaction(() => {
          db.prepare("DELETE FROM thread_history_lease_items WHERE lease_id = ?").run(
            leaseId,
          );
          db.prepare("DELETE FROM thread_history_leases WHERE id = ?").run(leaseId);
        });
        clear();
        return { released: leaseId, pending_thread_count: pendingCount() };
      });
    },
  };
}
