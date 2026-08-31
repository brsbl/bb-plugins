import { randomBytes } from "node:crypto";
import { join } from "node:path";

import type { BbPluginApi } from "@get-bb/plugin-sdk";
import { z } from "zod";

import {
  commitNewRuleFiles,
  ensureMaintenanceCheckout,
  MaintenanceHeadChangedError,
  readMaintenanceHead,
} from "./history";

/**
 * Archive-triggered doctrine harvest.
 *
 * When a thread is archived, a hidden harvester agent reads that thread and
 * proposes rules; an independent reviewer agent judges each proposal. Only
 * approved proposals are written under `rules/<category>/ddr_NNN.md`, using the
 * same schema `loadDoctrine` parses and the conventions in
 * `maintenance/automation-prompt.md`.
 *
 * Proposals — approved and rejected — are persisted so that recurring signal is
 * countable across threads. The reviewer is handed that history so it can drop a
 * proposal it already rejected, or approve one whose evidence is thin in any
 * single thread but now recurs.
 */

/**
 * Created with plain idempotent DDL rather than `bb.storage.migrate`.
 * `migrate` keys each statement by its index in one shared `_bb_migrations`
 * table, and `@brsbl/bb-thread-history-maintenance` is already a caller on this
 * same per-plugin database. A second independent caller would see the first
 * caller's indices as already applied and silently skip its own statements.
 */
const HARVEST_SCHEMA = [
  `CREATE TABLE IF NOT EXISTS harvest_threads (
     thread_id TEXT PRIMARY KEY,
     project_id TEXT NOT NULL,
     queued_at INTEGER NOT NULL,
     processed_at INTEGER,
     outcome TEXT
   )`,
  `CREATE TABLE IF NOT EXISTS harvest_proposals (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     thread_id TEXT NOT NULL,
     rule_key TEXT NOT NULL,
     payload TEXT NOT NULL,
     created_at INTEGER NOT NULL,
     verdict TEXT,
     reason TEXT,
     written_path TEXT
   )`,
  `CREATE INDEX IF NOT EXISTS harvest_proposals_rule_key
     ON harvest_proposals (rule_key)`,
];

/**
 * Distinct source threads that must carry the same normalized proposal before
 * the reviewer may approve it on recurrence alone. Deliberately a plain
 * constant rather than a scanning subsystem.
 */
export const RECURRENCE_APPROVAL_THRESHOLD = 3;
export const HARVEST_RULE_FILE_LIMIT = 5;
const REVIEW_CATALOG_RETRY_LIMIT = 2;
const HARVESTED_STATE = "pending:harvested";
const HARVESTER_CAPABILITY_PREFIX = "pending:harvester:";
const REVIEWED_HEAD_PREFIX = "pending:reviewed:";
const REVIEWER_CAPABILITY_PREFIX = "internal:reviewer:";

const KEY_STOP_TOKENS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "before", "but", "by", "for",
  "from", "in", "into", "is", "it", "its", "must", "not", "of", "on", "one",
  "only", "or", "should", "that", "the", "their", "them", "then", "there",
  "they", "this", "to", "use", "used", "when", "with", "without",
]);

const UNSAFE_RENDERED_PATTERNS: ReadonlyArray<{
  pattern: RegExp;
  message: string;
}> = [
  {
    pattern: /\b(?:thr|msg|message|seg)_[a-z0-9_-]+\b/i,
    message: "must not contain thread or message identifiers",
  },
  {
    pattern: /(?:\b[a-z][a-z0-9+.-]*:\/\/|\bwww\.)\S*/i,
    message: "must not contain URLs",
  },
  {
    pattern:
      /(?:-----BEGIN [A-Z ]*PRIVATE KEY-----|\bAKIA[0-9A-Z]{16}\b|\bgh[pousr]_[A-Za-z0-9]{20,}\b|\bsk-[A-Za-z0-9_-]{16,}\b|\b(?:api[_ -]?key|access[_ -]?token|token|password|secret)\s*[:=]\s*\S+)/i,
    message: "must not contain credentials or secrets",
  },
];

function renderedString(minimum: number, maximum: number) {
  return z
    .string()
    .trim()
    .min(minimum)
    .max(maximum)
    .refine((value) => !/[\r\n]/.test(value), "must be a single line")
    .superRefine((value, context) => {
      for (const unsafe of UNSAFE_RENDERED_PATTERNS) {
        if (unsafe.pattern.test(value)) {
          context.addIssue({ code: "custom", message: unsafe.message });
        }
      }
    });
}

function renderedList(minimum = 0, maximum = 20, itemLength = 400) {
  return z.array(renderedString(1, itemLength)).min(minimum).max(maximum);
}

export const harvestProposalSchema = z.object({
  title: renderedString(3, 120),
  statement: renderedString(10, 1_000),
  kind: z.enum(["principle", "standard", "guideline", "taste", "anti_pattern"]),
  strength: z.enum(["required", "default", "preference", "warning"]),
  confidence: z.enum(["low", "medium", "high"]).default("low"),
  domain: renderedString(3, 80).regex(/^[a-z-]+\.[a-z-]+$/),
  products: renderedList(1, 20, 80),
  activities: renderedList(1, 20, 80),
  artifacts: renderedList(1, 20, 80),
  surfaces: renderedList(0, 20, 120).default([]),
  why: renderedString(10, 1_000),
  prefer: renderedList(1),
  avoid: renderedList(1),
  use_when: renderedList(1),
  not_when: renderedList().default([]),
  exceptions: renderedList().default([]),
  evidence: renderedList(1),
  checks: renderedList(1),
});

export type HarvestProposal = z.infer<typeof harvestProposalSchema>;

export const harvestVerdictSchema = z.object({
  approve: z.boolean(),
  reason: renderedString(3, 600),
});

export interface StoredProposal {
  id: number;
  threadId: string;
  ruleKey: string;
  proposal: HarvestProposal;
  createdAt: number;
  verdict: "approved" | "rejected" | null;
  reason: string | null;
  writtenPath: string | null;
}

export interface RecurrenceContext {
  /** Distinct source threads carrying this normalized proposal, including the current one. */
  recurrence: number;
  /** Whether recurrence has reached the threshold at which thin single-thread evidence is acceptable. */
  meetsRecurrenceThreshold: boolean;
  priorVerdicts: Array<{
    verdict: "approved" | "rejected" | null;
    reason: string | null;
    at: number;
  }>;
}

/**
 * Normalized identity for a proposal, used to count recurring signal across
 * threads. Domain plus the significant tokens of the title: stable under
 * rewording of the body, and cheap to explain.
 */
export function normalizeRuleKey(
  proposal: Pick<HarvestProposal, "domain" | "title">,
): string {
  const tokens = (proposal.title.toLocaleLowerCase().match(/[a-z0-9]+/g) ?? [])
    .filter((token) => token.length > 2 && !KEY_STOP_TOKENS.has(token));
  return `${proposal.domain}|${[...new Set(tokens)].sort().join("-")}`;
}

/** Next `ddr_NNN` after the highest already allocated, zero-padded to three digits. */
export function allocateRuleId(existingIds: readonly string[]): string {
  const highest = existingIds.reduce((best, id) => {
    const match = /^ddr_(\d+)$/.exec(id);
    if (!match) return best;
    return Math.max(best, Number(match[1]));
  }, 0);
  return `ddr_${String(highest + 1).padStart(3, "0")}`;
}

/** `rules/<category>/<id>.md`, where the category is the domain's first segment. */
export function ruleRelativePath(domain: string, id: string): string {
  return join("rules", domain.split(".")[0], `${id}.md`);
}

function frontmatterList(values: readonly string[]): string {
  return JSON.stringify(values);
}

function bulletList(values: readonly string[]): string {
  return values.map((value) => `- ${value}`).join("\n");
}

/**
 * Render a proposal as a rule file that `parseRule` accepts. Evidence count is
 * the source of truth for `supporting_episodes`, which `validateRelations`
 * requires to match.
 */
export function renderRuleMarkdown(
  proposal: HarvestProposal,
  id: string,
  updated: string,
): string {
  proposal = harvestProposalSchema.parse(proposal);
  const sections = [
    `# ${proposal.title}`,
    "",
    proposal.statement,
    "",
    "## Why",
    "",
    proposal.why,
    "",
    "## Prefer",
    "",
    bulletList(proposal.prefer),
    "",
    "## Avoid",
    "",
    bulletList(proposal.avoid),
    "",
    "## Use when",
    "",
    bulletList(proposal.use_when),
  ];
  if (proposal.not_when.length > 0) {
    sections.push("", "## Do not use when", "", bulletList(proposal.not_when));
  }
  if (proposal.exceptions.length > 0) {
    sections.push("", "## Exceptions", "", bulletList(proposal.exceptions));
  }
  sections.push(
    "",
    "## Evidence",
    "",
    bulletList(proposal.evidence),
    "",
    "## Check",
    "",
    bulletList(proposal.checks),
    "",
  );
  const frontmatter = [
    "---",
    `id: ${id}`,
    `kind: ${proposal.kind}`,
    `strength: ${proposal.strength}`,
    `confidence: ${proposal.confidence}`,
    "status: active",
    `domain: ${proposal.domain}`,
    `products: ${frontmatterList(proposal.products)}`,
    `activities: ${frontmatterList(proposal.activities)}`,
    `artifacts: ${frontmatterList(proposal.artifacts)}`,
    `surfaces: ${frontmatterList(proposal.surfaces)}`,
    "relations: []",
    `supporting_episodes: ${proposal.evidence.length}`,
    "challenging_episodes: 0",
    `updated: ${updated}`,
    "---",
    "",
    "",
  ].join("\n");
  return `${frontmatter}${sections.join("\n")}`;
}

export function isoDate(timestamp: number): string {
  return new Date(timestamp).toISOString().slice(0, 10);
}

/** A thread whose archive should trigger a harvest. */
export interface HarvestThread {
  id: string;
  projectId: string;
  title: string | null;
  visibility?: string | null;
  originPluginId?: string | null;
}

export interface HarvestAgentRequest {
  kind: "harvester" | "reviewer";
  /** The archived thread being harvested, not the spawned agent's own thread. */
  threadId: string;
  projectId: string;
  /** Environment of the archived thread, reused by the spawned agent when present. */
  title: string;
  prompt: string;
}

export interface HarvestDependencies {
  bb: BbPluginApi;
  resolveDoctrineRoot: () => Promise<string>;
  /** Existing rule ids, used for ID allocation and duplicate awareness. */
  listRuleIds: (doctrineRoot: string) => Promise<string[]>;
  /** Compact catalog of existing rules, given to the reviewer. */
  describeExistingRules: (doctrineRoot: string) => Promise<string>;
  /** Parses and validates the complete personalized corpus after draft writes. */
  validateRules: (doctrineRoot: string) => Promise<void>;
  /** Runs one hidden agent to completion. Injected so tests do not need a real host. */
  runAgent: (request: HarvestAgentRequest) => Promise<void>;
  now?: () => number;
}

/**
 * Only visible, non-plugin threads are harvested. Excluding plugin-origin
 * threads keeps the harvester's and reviewer's own threads out of the queue,
 * which would otherwise let the feature feed on its own output.
 */
export function isHarvestableThread(thread: HarvestThread): boolean {
  if (thread.originPluginId) return false;
  if (thread.visibility && thread.visibility !== "visible") return false;
  return true;
}

export function createHarvest(dependencies: HarvestDependencies) {
  const {
    bb,
    resolveDoctrineRoot,
    listRuleIds,
    describeExistingRules,
    validateRules,
    runAgent,
  } = dependencies;
  const now = dependencies.now ?? (() => Date.now());
  let database: ReturnType<BbPluginApi["storage"]["database"]> | null = null;

  function db() {
    if (!database) {
      database = bb.storage.database();
      for (const statement of HARVEST_SCHEMA) database.exec(statement);
    }
    return database;
  }

  function readProposal(row: Record<string, unknown>): StoredProposal {
    return {
      id: Number(row.id),
      threadId: String(row.thread_id),
      ruleKey: String(row.rule_key),
      proposal: JSON.parse(String(row.payload)) as HarvestProposal,
      createdAt: Number(row.created_at),
      verdict: (row.verdict as StoredProposal["verdict"]) ?? null,
      reason: (row.reason as string | null) ?? null,
      writtenPath: (row.written_path as string | null) ?? null,
    };
  }

  function capabilityToken(): string {
    return randomBytes(32).toString("base64url");
  }

  function isReviewerCapability(value: string | null): boolean {
    return value?.startsWith(REVIEWER_CAPABILITY_PREFIX) ?? false;
  }

  function rawThreadOutcome(threadId: string): string | null | undefined {
    const row = db()
      .prepare(`SELECT outcome FROM harvest_threads WHERE thread_id = ?`)
      .get(threadId) as Record<string, unknown> | undefined;
    if (!row) return undefined;
    return (row.outcome as string | null) ?? null;
  }

  function isPending(threadId: string): boolean {
    return Boolean(
      db()
        .prepare(
          `SELECT 1 FROM harvest_threads
           WHERE thread_id = ? AND processed_at IS NULL`,
        )
        .get(threadId),
    );
  }

  function hasHarvesterReport(threadId: string): boolean {
    const outcome = rawThreadOutcome(threadId);
    return (
      outcome === HARVESTED_STATE ||
      (outcome?.startsWith(REVIEWED_HEAD_PREFIX) ?? false)
    );
  }

  function beginHarvester(threadId: string): string | null {
    if (!isPending(threadId) || hasHarvesterReport(threadId)) return null;
    const token = capabilityToken();
    const result = db()
      .prepare(
        `UPDATE harvest_threads SET outcome = ?
         WHERE thread_id = ? AND processed_at IS NULL`,
      )
      .run(`${HARVESTER_CAPABILITY_PREFIX}${token}`, threadId);
    return result.changes > 0 ? token : null;
  }

  /**
   * Marks a thread as pending harvest. Returns false when the thread has been
   * seen before, which is what makes repeated archive/unarchive cycles a no-op.
   */
  function enqueue(thread: HarvestThread): boolean {
    if (!isHarvestableThread(thread)) return false;
    const result = db()
      .prepare(
        `INSERT INTO harvest_threads
           (thread_id, project_id, queued_at)
         VALUES (?, ?, ?)
         ON CONFLICT (thread_id) DO NOTHING`,
      )
      .run(thread.id, thread.projectId, now());
    return result.changes > 0;
  }

  /** Queued, unprocessed threads. Persisted, so a restart resumes the queue. */
  function pendingThreads(): Array<{
    threadId: string;
    projectId: string;
  }> {
    return db()
      .prepare(
        `SELECT thread_id, project_id FROM harvest_threads
         WHERE processed_at IS NULL
         ORDER BY queued_at, thread_id`,
      )
      .all()
      .map((row) => {
        const record = row as Record<string, unknown>;
        return {
          threadId: String(record.thread_id),
          projectId: String(record.project_id),
        };
      });
  }

  function markProcessed(threadId: string, outcome: string): void {
    db()
      .prepare(
        `UPDATE harvest_threads SET processed_at = ?, outcome = ?
         WHERE thread_id = ? AND processed_at IS NULL`,
      )
      .run(now(), outcome, threadId);
  }

  function recordProposals(
    threadId: string,
    token: string,
    proposals: readonly HarvestProposal[],
  ): StoredProposal[] {
    const validated = proposals.map((proposal) =>
      harvestProposalSchema.parse(proposal),
    );
    const databaseHandle = db();
    const transact = databaseHandle.transaction(() => {
      const expected = `${HARVESTER_CAPABILITY_PREFIX}${token}`;
      const state = databaseHandle
        .prepare(
          `SELECT outcome FROM harvest_threads
           WHERE thread_id = ? AND processed_at IS NULL`,
        )
        .get(threadId) as Record<string, unknown> | undefined;
      if (!state || state.outcome !== expected) {
        throw new Error("invalid or expired harvester capability");
      }

      const stored: StoredProposal[] = [];
      const seen = new Set<string>();
      for (const proposal of validated) {
        const ruleKey = normalizeRuleKey(proposal);
        if (seen.has(ruleKey)) continue;
        seen.add(ruleKey);
        const existing = databaseHandle
          .prepare(
            `SELECT * FROM harvest_proposals
             WHERE thread_id = ? AND rule_key = ?
             ORDER BY id LIMIT 1`,
          )
          .get(threadId, ruleKey);
        if (existing) {
          stored.push(readProposal(existing as Record<string, unknown>));
          continue;
        }
        const createdAt = now();
        const result = databaseHandle
          .prepare(
            `INSERT INTO harvest_proposals
               (thread_id, rule_key, payload, created_at)
             VALUES (?, ?, ?, ?)`,
          )
          .run(threadId, ruleKey, JSON.stringify(proposal), createdAt);
        stored.push({
          id: Number(result.lastInsertRowid),
          threadId,
          ruleKey,
          proposal,
          createdAt,
          verdict: null,
          reason: null,
          writtenPath: null,
        });
      }
      const transitioned = databaseHandle
        .prepare(
          `UPDATE harvest_threads SET outcome = ?
           WHERE thread_id = ? AND processed_at IS NULL AND outcome = ?`,
        )
        .run(HARVESTED_STATE, threadId, expected);
      if (transitioned.changes !== 1) {
        throw new Error("invalid or expired harvester capability");
      }
      return stored;
    });
    return transact();
  }

  function recordVerdict(
    proposalId: number,
    token: string,
    verdict: "approved" | "rejected",
    reason: string,
  ): void {
    const parsedReason = harvestVerdictSchema.parse({
      approve: verdict === "approved",
      reason,
    }).reason;
    const capability = `${REVIEWER_CAPABILITY_PREFIX}${token}`;
    const result = db()
      .prepare(
        `UPDATE harvest_proposals
         SET verdict = ?, reason = ?, written_path = NULL
         WHERE id = ? AND verdict IS NULL AND reason = ?
           AND EXISTS (
             SELECT 1 FROM harvest_threads
             WHERE harvest_threads.thread_id = harvest_proposals.thread_id
               AND harvest_threads.processed_at IS NULL
           )`,
      )
      .run(verdict, parsedReason, proposalId, capability);
    if (result.changes !== 1) {
      throw new Error("invalid or expired reviewer capability");
    }
  }

  function beginReviewer(proposalId: number): string | null {
    const token = capabilityToken();
    const result = db()
      .prepare(
        `UPDATE harvest_proposals SET reason = ?
         WHERE id = ? AND verdict IS NULL
           AND EXISTS (
             SELECT 1 FROM harvest_threads
             WHERE harvest_threads.thread_id = harvest_proposals.thread_id
               AND harvest_threads.processed_at IS NULL
           )`,
      )
      .run(`${REVIEWER_CAPABILITY_PREFIX}${token}`, proposalId);
    return result.changes === 1 ? token : null;
  }

  function setSystemVerdict(
    proposalId: number,
    verdict: "approved" | "rejected",
    reason: string,
  ): void {
    db()
      .prepare(
        `UPDATE harvest_proposals
         SET verdict = ?, reason = ?, written_path = NULL
         WHERE id = ?
           AND EXISTS (
             SELECT 1 FROM harvest_threads
             WHERE harvest_threads.thread_id = harvest_proposals.thread_id
               AND harvest_threads.processed_at IS NULL
           )`,
      )
      .run(verdict, reason, proposalId);
  }

  function setWrittenPath(proposalId: number, writtenPath: string): void {
    db()
      .prepare(
        `UPDATE harvest_proposals SET written_path = ?
         WHERE id = ? AND verdict = 'approved' AND written_path IS NULL`,
      )
      .run(writtenPath, proposalId);
  }

  function setReviewedHead(threadId: string, head: string): boolean {
    const result = db()
      .prepare(
        `UPDATE harvest_threads SET outcome = ?
         WHERE thread_id = ? AND processed_at IS NULL`,
      )
      .run(`${REVIEWED_HEAD_PREFIX}${head}`, threadId);
    return result.changes === 1;
  }

  function reviewedHead(threadId: string): string | null {
    const outcome = rawThreadOutcome(threadId);
    return outcome?.startsWith(REVIEWED_HEAD_PREFIX)
      ? outcome.slice(REVIEWED_HEAD_PREFIX.length)
      : null;
  }

  function resetReviewDecisions(
    threadId: string,
    proposalIds?: readonly number[],
  ): void {
    const databaseHandle = db();
    const reset = databaseHandle.transaction(() => {
      if (proposalIds && proposalIds.length > 0) {
        const placeholders = proposalIds.map(() => "?").join(", ");
        databaseHandle
          .prepare(
            `UPDATE harvest_proposals
             SET verdict = NULL, reason = NULL, written_path = NULL
             WHERE thread_id = ? AND written_path IS NULL
               AND id IN (${placeholders})`,
          )
          .run(threadId, ...proposalIds);
      } else {
        databaseHandle
          .prepare(
            `UPDATE harvest_proposals
             SET verdict = NULL, reason = NULL, written_path = NULL
             WHERE thread_id = ? AND written_path IS NULL`,
          )
          .run(threadId);
      }
      databaseHandle
        .prepare(
          `UPDATE harvest_threads SET outcome = ?
           WHERE thread_id = ? AND processed_at IS NULL`,
        )
        .run(HARVESTED_STATE, threadId);
    });
    reset();
  }

  function pendingProposals(threadId: string): StoredProposal[] {
    return db()
      .prepare(
        `SELECT * FROM harvest_proposals
         WHERE thread_id = ?
           AND (verdict IS NULL OR (verdict = 'approved' AND written_path IS NULL))
         ORDER BY id`,
      )
      .all(threadId)
      .map((row) => readProposal(row as Record<string, unknown>));
  }

  /**
   * Cross-thread signal for one proposal: how many distinct threads have raised
   * it, and what was decided before.
   */
  function recurrenceContext(
    ruleKey: string,
    threadId: string,
  ): RecurrenceContext {
    const rows = db()
      .prepare(
        `SELECT thread_id, verdict, reason, created_at
         FROM harvest_proposals
         WHERE rule_key = ?
         ORDER BY created_at`,
      )
      .all(ruleKey)
      .map((row) => row as Record<string, unknown>);
    const threads = new Set(rows.map((row) => String(row.thread_id)));
    threads.add(threadId);
    return {
      recurrence: threads.size,
      meetsRecurrenceThreshold: threads.size >= RECURRENCE_APPROVAL_THRESHOLD,
      priorVerdicts: rows
        .filter((row) => String(row.thread_id) !== threadId)
        .map((row) => ({
          verdict: (row.verdict as StoredProposal["verdict"]) ?? null,
          reason: isReviewerCapability((row.reason as string | null) ?? null)
            ? null
            : ((row.reason as string | null) ?? null),
          at: Number(row.created_at),
        })),
    };
  }

  function alreadyApproved(ruleKey: string): StoredProposal | null {
    const row = db()
      .prepare(
        `SELECT * FROM harvest_proposals
         WHERE rule_key = ? AND verdict = 'approved' AND written_path IS NOT NULL
         ORDER BY id LIMIT 1`,
      )
      .get(ruleKey);
    return row ? readProposal(row as Record<string, unknown>) : null;
  }

  function harvesterPrompt(threadId: string, token: string): string {
    return [
      "You are the Design Doctrine harvester. Work silently; nobody is watching this thread.",
      "",
      `Read the complete history of bb thread ${threadId} with \`bb thread log ${threadId} --format minimal\`,`,
      "paginating with `--format json --limit 500 --after-seq <seq>` if the minimal timeline is windowed.",
      "",
      "Decide whether that thread contains durable product/UX/UI/visual-design/design-system/AI-interaction",
      "judgment worth a doctrine rule.",
      "",
      "Rules of evidence:",
      "- Only messages the user wrote are evidence. Assistant and subagent output never is.",
      "- One-off task constraints, tool failures, environment breakage, and general engineering or",
      "  PR-process direction are not doctrine.",
      "- Silence is the expected result. Most threads warrant nothing.",
      "",
      "Report exactly once, even when you found nothing, by running:",
      "",
      `  bb doctrine harvest propose --thread ${threadId} --token ${token} --json '<json-array>'`,
      "",
      "The array is empty when nothing is warranted. Each element must be an object with:",
      "title, statement, kind, strength, confidence, domain, products, activities, artifacts,",
      "surfaces, why, prefer, avoid, use_when, not_when, exceptions, evidence, checks.",
      "",
      "Evidence lines must be short, anonymous, one per episode. Never include thread ids,",
      "message ids, transcripts, credentials, or private URLs.",
      "",
      "Do not write or edit any rule file yourself.",
    ].join("\n");
  }

  function reviewerPrompt(
    stored: StoredProposal,
    context: RecurrenceContext,
    existingRules: string,
    token: string,
  ): string {
    const priors = context.priorVerdicts.length
      ? context.priorVerdicts
          .map(
            (entry) =>
              `- ${entry.verdict ?? "undecided"}: ${entry.reason ?? "(no reason recorded)"}`,
          )
          .join("\n")
      : "- none";
    return [
      "You are an independent Design Doctrine reviewer. You did not write this proposal.",
      "Judge it; do not improve it.",
      "",
      "Approve only if all of these hold:",
      "1. It is genuinely new — not a duplicate or restatement of an existing rule below.",
      "2. It does not contradict an existing rule.",
      "3. It is supported by concrete feedback the user actually gave.",
      "",
      `This proposal has been raised in ${context.recurrence} distinct thread(s).`,
      context.meetsRecurrenceThreshold
        ? `Because that reaches the recurrence threshold of ${RECURRENCE_APPROVAL_THRESHOLD}, evidence that would be too thin from a single thread is acceptable: the pattern has repeated independently.`
        : `That is below the recurrence threshold of ${RECURRENCE_APPROVAL_THRESHOLD}, so judge it on this thread's evidence alone.`,
      "",
      "Previous verdicts on this same proposal:",
      priors,
      "",
      "If it was rejected before for a reason that still applies, reject it again for the same reason.",
      "",
      "Proposal:",
      JSON.stringify(stored.proposal, null, 2),
      "",
      "Existing rules:",
      existingRules,
      "",
      "Report exactly once by running:",
      "",
      `  bb doctrine harvest verdict --proposal ${stored.id} --token ${token} --approve --reason '<why>'`,
      "or",
      `  bb doctrine harvest verdict --proposal ${stored.id} --token ${token} --reject --reason '<why>'`,
    ].join("\n");
  }

  /** Harvest one queued thread. Unsafe or interrupted work remains pending for a later drain. */
  async function harvestThread(
    threadId: string,
    projectId: string,
  ): Promise<void> {
    let doctrineRoot: string;
    try {
      doctrineRoot = await resolveDoctrineRoot();
      await ensureMaintenanceCheckout(doctrineRoot);
    } catch (error) {
      bb.log.warn(
        `doctrine harvest: waiting for a clean maintenance checkout: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return;
    }

    if (!isPending(threadId)) return;

    if (!hasHarvesterReport(threadId)) {
      const token = beginHarvester(threadId);
      if (!token) return;
      try {
        await runAgent({
          kind: "harvester",
          threadId,
          projectId,
          title: "Doctrine harvest",
          prompt: harvesterPrompt(threadId, token),
        });
      } catch (error) {
        bb.log.warn(
          `doctrine harvest: harvester failed for ${threadId}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
        return;
      }
      if (!isPending(threadId)) return;
      if (!hasHarvesterReport(threadId)) {
        bb.log.warn(
          `doctrine harvest: harvester returned without reporting for ${threadId}`,
        );
        return;
      }
    }

    const allProposals = () =>
      db()
        .prepare(
          `SELECT * FROM harvest_proposals WHERE thread_id = ? ORDER BY id`,
        )
        .all(threadId)
        .map((row) => readProposal(row as Record<string, unknown>));
    if (allProposals().length === 0) {
      bb.log.info(`doctrine harvest: no proposals from ${threadId}`);
      markProcessed(threadId, "no-proposals");
      return;
    }

    for (let attempt = 0; attempt < REVIEW_CATALOG_RETRY_LIMIT; attempt += 1) {
      if (!isPending(threadId)) return;

      const carriedApprovals = pendingProposals(threadId).filter(
        (proposal) => proposal.verdict === "approved" && proposal.writtenPath === null,
      );
      const carriedHead = reviewedHead(threadId);
      if (carriedApprovals.length > 0 && carriedHead) {
        const currentHead = await readMaintenanceHead(doctrineRoot);
        if (currentHead === carriedHead) {
          const committed = await commitApproved(
            doctrineRoot,
            threadId,
            carriedHead,
            carriedApprovals,
          );
          if (committed === "done" || committed === "waiting") return;
          continue;
        }
        resetReviewDecisions(threadId, carriedApprovals.map((item) => item.id));
      } else if (carriedApprovals.length > 0) {
        // Old installs can contain approved/unwritten rows without a recorded
        // catalog HEAD. Re-review them instead of trusting an unknown corpus.
        resetReviewDecisions(threadId, carriedApprovals.map((item) => item.id));
      }

      await ensureMaintenanceCheckout(doctrineRoot);
      const catalogHead = await readMaintenanceHead(doctrineRoot);
      const existingRules = await describeExistingRules(doctrineRoot);
      if ((await readMaintenanceHead(doctrineRoot)) !== catalogHead) {
        continue;
      }

      const reviewedIds: number[] = [];
      const proposals = pendingProposals(threadId).filter(
        (proposal) => proposal.verdict === null,
      );
      for (const stored of proposals) {
        if (!isPending(threadId)) return;
        try {
          harvestProposalSchema.parse(stored.proposal);
        } catch {
          const reason = "proposal failed safety validation";
          setSystemVerdict(stored.id, "rejected", reason);
          reviewedIds.push(stored.id);
          bb.log.warn(
            `doctrine harvest: rejected proposal ${stored.id} from ${threadId} — ${reason}`,
          );
          continue;
        }
        const duplicate = alreadyApproved(stored.ruleKey);
        if (duplicate) {
          const reason = `duplicate of an already-approved proposal (${duplicate.writtenPath})`;
          setSystemVerdict(stored.id, "rejected", reason);
          reviewedIds.push(stored.id);
          bb.log.info(
            `doctrine harvest: rejected proposal ${stored.id} from ${threadId} — ${reason}`,
          );
          continue;
        }
        const context = recurrenceContext(stored.ruleKey, threadId);
        const token = beginReviewer(stored.id);
        if (!token) {
          if (!isPending(threadId)) return;
          continue;
        }
        reviewedIds.push(stored.id);
        try {
          await runAgent({
            kind: "reviewer",
            threadId,
            projectId,
            title: "Doctrine review",
            prompt: reviewerPrompt(stored, context, existingRules, token),
          });
        } catch (error) {
          if (!isPending(threadId)) return;
          const reason = "reviewer agent failed before recording a verdict";
          recordVerdict(stored.id, token, "rejected", reason);
          bb.log.warn(
            `doctrine harvest: rejected proposal ${stored.id} from ${threadId} — ${reason}: ${
              error instanceof Error ? error.message : String(error)
            }`,
          );
          continue;
        }
        if (!isPending(threadId)) return;
        const decided = db()
          .prepare(`SELECT * FROM harvest_proposals WHERE id = ?`)
          .get(stored.id);
        const verdict = decided
          ? readProposal(decided as Record<string, unknown>)
          : null;
        if (!verdict || verdict.verdict === null) {
          const reason = "reviewer returned no verdict";
          recordVerdict(stored.id, token, "rejected", reason);
          bb.log.warn(
            `doctrine harvest: rejected proposal ${stored.id} from ${threadId} — ${reason}`,
          );
          continue;
        }
        if (verdict.verdict === "rejected") {
          bb.log.info(
            `doctrine harvest: rejected proposal ${stored.id} from ${threadId} — ${verdict.reason ?? "no reason given"}`,
          );
          continue;
        }
        const approvedCount = pendingProposals(threadId).filter(
          (proposal) => proposal.verdict === "approved",
        ).length;
        if (approvedCount > HARVEST_RULE_FILE_LIMIT) {
          const reason = `archive harvests are limited to ${HARVEST_RULE_FILE_LIMIT} rule files`;
          setSystemVerdict(stored.id, "rejected", reason);
          bb.log.warn(
            `doctrine harvest: rejected proposal ${stored.id} from ${threadId} — ${reason}`,
          );
        }
      }

      if (!isPending(threadId)) return;
      const headBeforeCommit = await readMaintenanceHead(doctrineRoot);
      if (headBeforeCommit !== catalogHead) {
        resetReviewDecisions(threadId, reviewedIds);
        continue;
      }
      const approved = pendingProposals(threadId).filter(
        (proposal) => proposal.verdict === "approved" && proposal.writtenPath === null,
      );
      if (approved.length === 0) {
        markProcessed(threadId, "no-approvals");
        return;
      }
      if (!setReviewedHead(threadId, catalogHead) || !isPending(threadId)) return;
      const committed = await commitApproved(
        doctrineRoot,
        threadId,
        catalogHead,
        approved,
      );
      if (committed === "done" || committed === "waiting") return;
      resetReviewDecisions(threadId, reviewedIds);
    }

    bb.log.warn(
      `doctrine harvest: maintenance checkout kept changing for ${threadId}; review remains pending`,
    );

    async function commitApproved(
      root: string,
      pendingThreadId: string,
      catalogHead: string,
      approvedProposals: readonly StoredProposal[],
    ): Promise<"done" | "retry" | "waiting"> {
      if (!isPending(pendingThreadId)) return "waiting";
      try {
        const existingIds = await listRuleIds(root);
        const drafts = approvedProposals.map((stored) => {
          const proposal = harvestProposalSchema.parse(stored.proposal);
          const id = allocateRuleId(existingIds);
          existingIds.push(id);
          return {
            stored,
            file: {
              relativePath: ruleRelativePath(proposal.domain, id),
              content: renderRuleMarkdown(proposal, id, isoDate(now())),
            },
          };
        });
        if (!isPending(pendingThreadId)) return "waiting";
        await commitNewRuleFiles(
          root,
          drafts.map((draft) => draft.file),
          () => validateRules(root),
          catalogHead,
        );
        for (const draft of drafts) {
          setWrittenPath(draft.stored.id, draft.file.relativePath);
          bb.log.info(
            `doctrine harvest: committed ${draft.file.relativePath} from ${pendingThreadId} — ${draft.stored.reason ?? "approved"}`,
          );
        }
        markProcessed(pendingThreadId, `approved:${drafts.length}`);
        return "done";
      } catch (error) {
        if (error instanceof MaintenanceHeadChangedError) {
          resetReviewDecisions(
            pendingThreadId,
            approvedProposals.map((proposal) => proposal.id),
          );
          return "retry";
        }
        bb.log.warn(
          `doctrine harvest: approved rule batch for ${pendingThreadId} remains pending: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
        return "waiting";
      }
    }
  }

  return {
    enqueue,
    cancel(threadId: string): void {
      const databaseHandle = db();
      const purge = databaseHandle.transaction(() => {
        databaseHandle
          .prepare(`DELETE FROM harvest_proposals WHERE thread_id = ?`)
          .run(threadId);
        databaseHandle
          .prepare(`DELETE FROM harvest_threads WHERE thread_id = ?`)
          .run(threadId);
      });
      purge();
    },
    isPending,
    pendingThreads,
    pendingProposals,
    recordProposals,
    recordVerdict,
    recurrenceContext,
    harvestThread,
    proposalsForThread(threadId: string): StoredProposal[] {
      return db()
        .prepare(
          `SELECT * FROM harvest_proposals WHERE thread_id = ? ORDER BY id`,
        )
        .all(threadId)
        .map((row) => readProposal(row as Record<string, unknown>))
        .map((proposal) => ({
          ...proposal,
          reason: isReviewerCapability(proposal.reason) ? null : proposal.reason,
        }));
    },
    threadState(threadId: string): {
      queuedAt: number;
      processedAt: number | null;
      outcome: string | null;
    } | null {
      const row = db()
        .prepare(`SELECT * FROM harvest_threads WHERE thread_id = ?`)
        .get(threadId) as Record<string, unknown> | undefined;
      if (!row) return null;
      return {
        queuedAt: Number(row.queued_at),
        processedAt:
          row.processed_at === null || row.processed_at === undefined
            ? null
            : Number(row.processed_at),
        outcome:
          row.processed_at === null || row.processed_at === undefined
            ? null
            : ((row.outcome as string | null) ?? null),
      };
    },
  };
}

export type Harvest = ReturnType<typeof createHarvest>;
