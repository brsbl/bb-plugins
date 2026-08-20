import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

import type { BbPluginApi } from "@bb/plugin-sdk";
import { z } from "zod";

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
     environment_id TEXT,
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

const KEY_STOP_TOKENS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "before", "but", "by", "for",
  "from", "in", "into", "is", "it", "its", "must", "not", "of", "on", "one",
  "only", "or", "should", "that", "the", "their", "them", "then", "there",
  "they", "this", "to", "use", "used", "when", "with", "without",
]);

export const harvestProposalSchema = z.object({
  title: z.string().trim().min(3).max(120),
  statement: z.string().trim().min(10),
  kind: z.enum(["principle", "standard", "guideline", "taste", "anti_pattern"]),
  strength: z.enum(["required", "default", "preference", "warning"]),
  confidence: z.enum(["low", "medium", "high"]).default("low"),
  domain: z.string().regex(/^[a-z-]+\.[a-z-]+$/),
  products: z.array(z.string().trim().min(1)).min(1),
  activities: z.array(z.string().trim().min(1)).min(1),
  artifacts: z.array(z.string().trim().min(1)).min(1),
  surfaces: z.array(z.string().trim().min(1)).default([]),
  why: z.string().trim().min(10),
  prefer: z.array(z.string().trim().min(1)).min(1),
  avoid: z.array(z.string().trim().min(1)).min(1),
  use_when: z.array(z.string().trim().min(1)).min(1),
  not_when: z.array(z.string().trim().min(1)).default([]),
  exceptions: z.array(z.string().trim().min(1)).default([]),
  evidence: z.array(z.string().trim().min(1)).min(1),
  checks: z.array(z.string().trim().min(1)).min(1),
});

export type HarvestProposal = z.infer<typeof harvestProposalSchema>;

export const harvestVerdictSchema = z.object({
  approve: z.boolean(),
  reason: z.string().trim().min(3).max(600),
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
  environmentId?: string | null;
  visibility?: string | null;
  originPluginId?: string | null;
}

export interface HarvestAgentRequest {
  kind: "harvester" | "reviewer";
  /** The archived thread being harvested, not the spawned agent's own thread. */
  threadId: string;
  projectId: string;
  /** Environment of the archived thread, reused by the spawned agent when present. */
  environmentId: string | null;
  title: string;
  prompt: string;
}

export interface HarvestDependencies {
  bb: BbPluginApi;
  resolveDoctrineRoot: () => Promise<string>;
  /** Existing rule ids, used for ID allocation and duplicate awareness. */
  listRuleIds: () => Promise<string[]>;
  /** Compact catalog of existing rules, given to the reviewer. */
  describeExistingRules: () => Promise<string>;
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
  const { bb, resolveDoctrineRoot, listRuleIds, describeExistingRules, runAgent } =
    dependencies;
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

  /**
   * Marks a thread as pending harvest. Returns false when the thread has been
   * seen before, which is what makes repeated archive/unarchive cycles a no-op.
   */
  function enqueue(thread: HarvestThread): boolean {
    if (!isHarvestableThread(thread)) return false;
    const result = db()
      .prepare(
        `INSERT INTO harvest_threads
           (thread_id, project_id, environment_id, queued_at)
         VALUES (?, ?, ?, ?)
         ON CONFLICT (thread_id) DO NOTHING`,
      )
      .run(thread.id, thread.projectId, thread.environmentId ?? null, now());
    return result.changes > 0;
  }

  /** Queued, unprocessed threads. Persisted, so a restart resumes the queue. */
  function pendingThreads(): Array<{
    threadId: string;
    projectId: string;
    environmentId: string | null;
  }> {
    return db()
      .prepare(
        `SELECT thread_id, project_id, environment_id FROM harvest_threads
         WHERE processed_at IS NULL
         ORDER BY queued_at, thread_id`,
      )
      .all()
      .map((row) => {
        const record = row as Record<string, unknown>;
        return {
          threadId: String(record.thread_id),
          projectId: String(record.project_id),
          environmentId:
            record.environment_id === null || record.environment_id === undefined
              ? null
              : String(record.environment_id),
        };
      });
  }

  function markProcessed(threadId: string, outcome: string): void {
    db()
      .prepare(
        `UPDATE harvest_threads SET processed_at = ?, outcome = ?
         WHERE thread_id = ?`,
      )
      .run(now(), outcome, threadId);
  }

  function recordProposals(
    threadId: string,
    proposals: readonly HarvestProposal[],
  ): StoredProposal[] {
    const insert = db().prepare(
      `INSERT INTO harvest_proposals
         (thread_id, rule_key, payload, created_at)
       VALUES (?, ?, ?, ?)`,
    );
    const stored: StoredProposal[] = [];
    for (const proposal of proposals) {
      const ruleKey = normalizeRuleKey(proposal);
      const createdAt = now();
      const result = insert.run(
        threadId,
        ruleKey,
        JSON.stringify(proposal),
        createdAt,
      );
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
    return stored;
  }

  function recordVerdict(
    proposalId: number,
    verdict: "approved" | "rejected",
    reason: string,
    writtenPath: string | null = null,
  ): void {
    db()
      .prepare(
        `UPDATE harvest_proposals
         SET verdict = ?, reason = ?, written_path = ?
         WHERE id = ?`,
      )
      .run(verdict, reason, writtenPath, proposalId);
  }

  function pendingProposals(threadId: string): StoredProposal[] {
    return db()
      .prepare(
        `SELECT * FROM harvest_proposals
         WHERE thread_id = ? AND verdict IS NULL
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
          reason: (row.reason as string | null) ?? null,
          at: Number(row.created_at),
        })),
    };
  }

  function alreadyApproved(ruleKey: string): StoredProposal | null {
    const row = db()
      .prepare(
        `SELECT * FROM harvest_proposals
         WHERE rule_key = ? AND verdict = 'approved'
         ORDER BY id LIMIT 1`,
      )
      .get(ruleKey);
    return row ? readProposal(row as Record<string, unknown>) : null;
  }

  async function writeApprovedRule(proposal: HarvestProposal): Promise<string> {
    const root = await resolveDoctrineRoot();
    const id = allocateRuleId(await listRuleIds());
    const relativePath = ruleRelativePath(proposal.domain, id);
    const absolutePath = join(root, relativePath);
    await mkdir(join(absolutePath, ".."), { recursive: true });
    await writeFile(
      absolutePath,
      renderRuleMarkdown(proposal, id, isoDate(now())),
      "utf8",
    );
    return relativePath;
  }

  function harvesterPrompt(threadId: string): string {
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
      `  bb doctrine harvest propose --thread ${threadId} --json '<json-array>'`,
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
      `  bb doctrine harvest verdict --proposal ${stored.id} --approve --reason '<why>'`,
      "or",
      `  bb doctrine harvest verdict --proposal ${stored.id} --reject --reason '<why>'`,
    ].join("\n");
  }

  /** Harvest one queued thread. Never throws; failures are logged and the thread is closed out. */
  async function harvestThread(
    threadId: string,
    projectId: string,
    environmentId: string | null = null,
  ): Promise<void> {
    try {
      await runAgent({
        kind: "harvester",
        threadId,
        projectId,
        environmentId,
        title: "Doctrine harvest",
        prompt: harvesterPrompt(threadId),
      });
    } catch (error) {
      bb.log.warn(
        `doctrine harvest: harvester failed for ${threadId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      markProcessed(threadId, "harvester-failed");
      return;
    }

    const proposals = pendingProposals(threadId);
    if (proposals.length === 0) {
      bb.log.info(`doctrine harvest: no proposals from ${threadId}`);
      markProcessed(threadId, "no-proposals");
      return;
    }

    const existingRules = await describeExistingRules();
    let approved = 0;
    for (const stored of proposals) {
      const duplicate = alreadyApproved(stored.ruleKey);
      if (duplicate) {
        const reason = `duplicate of an already-approved proposal (${duplicate.writtenPath ?? "unwritten"})`;
        recordVerdict(stored.id, "rejected", reason);
        bb.log.info(
          `doctrine harvest: rejected proposal ${stored.id} from ${threadId} — ${reason}`,
        );
        continue;
      }
      const context = recurrenceContext(stored.ruleKey, threadId);
      try {
        await runAgent({
          kind: "reviewer",
          threadId,
          projectId,
          environmentId,
          title: "Doctrine review",
          prompt: reviewerPrompt(stored, context, existingRules),
        });
      } catch (error) {
        const reason = `reviewer failed: ${
          error instanceof Error ? error.message : String(error)
        }`;
        recordVerdict(stored.id, "rejected", reason);
        bb.log.warn(
          `doctrine harvest: rejected proposal ${stored.id} from ${threadId} — ${reason}`,
        );
        continue;
      }
      const decided = db()
        .prepare(`SELECT * FROM harvest_proposals WHERE id = ?`)
        .get(stored.id);
      const verdict = decided
        ? readProposal(decided as Record<string, unknown>)
        : null;
      if (!verdict || verdict.verdict === null) {
        const reason = "reviewer returned no verdict";
        recordVerdict(stored.id, "rejected", reason);
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
      try {
        const relativePath = await writeApprovedRule(verdict.proposal);
        recordVerdict(
          stored.id,
          "approved",
          verdict.reason ?? "approved",
          relativePath,
        );
        approved += 1;
        bb.log.info(
          `doctrine harvest: wrote ${relativePath} from ${threadId} — ${verdict.reason ?? "approved"}`,
        );
      } catch (error) {
        const reason = `could not write rule: ${
          error instanceof Error ? error.message : String(error)
        }`;
        recordVerdict(stored.id, "rejected", reason);
        bb.log.warn(
          `doctrine harvest: rejected proposal ${stored.id} from ${threadId} — ${reason}`,
        );
      }
    }
    markProcessed(threadId, approved > 0 ? `approved:${approved}` : "no-approvals");
  }

  return {
    enqueue,
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
        .map((row) => readProposal(row as Record<string, unknown>));
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
        outcome: (row.outcome as string | null) ?? null,
      };
    },
  };
}

export type Harvest = ReturnType<typeof createHarvest>;
