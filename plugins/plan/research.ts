import { z } from "zod";
import {
  BRIEF_FIELDS, LIMITS, liftSchema, NO_PROJECT, RESEARCH_KINDS, RESEARCH_STATUSES,
  type Brief, type EditedRecord, type FunnelStep, type Investment, type Lift, type Objective, type RecordKind, type ResearchDetail, type ResearchEvidence, type ResearchKind,
  type ResearchRequest,
} from "./model.js";
import { invalidateResearch, mergeList, newId, parse, PlanError, queuePortfolioRefresh, type ThreadInfo } from "./service.js";

export { NO_PROJECT };
import { createStore, type Db, type Migrate } from "./store.js";

export const SLOTS = ["a", "b"] as const;
export type Slot = (typeof SLOTS)[number];
export type ThreadRole = Slot | "reconcile" | "assess";
export const RESEARCH_PHASES = ["blocked", "researching", "reconciling", "assessing", "published", "closed"] as const;
export type ResearchPhase = (typeof RESEARCH_PHASES)[number];
const IN_FLIGHT: readonly ResearchPhase[] = ["researching", "reconciling", "assessing"];
export const RUNNER = "plan-research-runner";
export const DEFAULT_CONCURRENCY = 2;
export const ASSESS_QUIET_MS = 120_000;
const PORTFOLIO_KINDS: readonly ResearchKind[] = ["build_portfolio", "refresh_portfolio"];

export const SKILLS = {
  discover: "discover-objectives",
  portfolio: "build-portfolio",
  lift: "calculate-lift",
  reconcile: "reconcile-research",
  assess: "assess-edit",
} as const;

const KIND_LABEL: Record<ResearchKind, string> = {
  discover_objectives: "derive objectives for a company priority",
  build_portfolio: "build an objective's portfolio",
  refresh_portfolio: "refresh an objective's portfolio",
  assess_edit: "assess whether an edit affects research",
};
const ROLE_LABEL: Record<ThreadRole, string> = { a: "Plan research A", b: "Plan research B", reconcile: "Plan reconciliation", assess: "Plan edit assessment" };
const METHOD_LABEL = { experiment: "Experiment", observational: "Observational comparison", forecast: "Forecast" } as const;

const text = z.string().trim().min(1, "can't be empty").max(LIMITS.briefField);
const nameText = z.string().trim().min(1, "can't be empty").max(LIMITS.name);
const key = z.string().trim().min(1, "can't be empty").max(LIMITS.id);
const sourceList = z.array(z.string().trim().min(1).max(LIMITS.source)).min(1, "needs at least one source").max(LIMITS.sources);
const finite = z.number().finite();
const threadIdSchema = z.string().trim().regex(/^thr_[A-Za-z0-9_-]+$/, "Use a bb thread ID, like thr_…");
const slot = z.enum(SLOTS);
const measure = z.strictObject({ value: finite, unit: text, period: text, sources: sourceList });
const funnelStep = z.strictObject({
  step: text,
  value: finite,
  unit: text,
  sources: sourceList,
  linkToNext: z.strictObject({ rate: finite.optional(), sources: sourceList }).optional(),
});

export const estimateSchema = z.strictObject({
  method: z.enum(["experiment", "observational", "forecast"]),
  methodNote: text,
  population: text,
  unit: text,
  period: text,
  baseline: measure,
  withChange: z.strictObject({ low: measure, base: measure, high: measure }),
  lift: z.strictObject({ low: finite, base: finite, high: finite }),
  funnelSteps: z.array(funnelStep).min(2).max(20).optional(),
});
export type Estimate = z.infer<typeof estimateSchema>;
const unsized = z.strictObject({ missing: text });

const candidateFields = {
  key,
  name: nameText,
  rationale: text,
  metricLink: z.strictObject({ claim: text, sources: sourceList }),
  owner: z.strictObject({ proposal: text, threadId: threadIdSchema.optional() }),
  effort: text.optional(),
  dependencies: text.optional(),
  lift: estimateSchema.optional(),
  unsized: unsized.optional(),
};
const investmentFields = {
  key,
  investmentId: key.optional(),
  name: nameText,
  existing: z.boolean(),
  cost: text,
  dependencies: text,
  deliverable: text,
  scope: text,
  acceptanceCriteria: text,
  measurement: text,
  sources: sourceList,
  lift: estimateSchema.optional(),
  unsized: unsized.optional(),
};
const ref = z.strictObject({ slot, key });
const traceFields = {
  from: z.array(ref).min(1, "must trace to at least one submission item").max(10),
  liftFrom: ref.optional(),
  recomputation: z.strictObject({ reason: text }).optional(),
};
const coverage = z.strictObject({
  searched: text,
  excluded: z.array(z.strictObject({ item: text, reason: text })).max(200),
  sources: sourceList,
});
const disagreement = z.strictObject({
  topic: text,
  affects: z.array(key).min(1, "name the affected item keys").max(100),
  positions: z.strictObject({ a: text, b: text }),
  resolution: text,
  resolved: z.boolean(),
});
const excluded = z.strictObject({ slot, key, reason: text });

export const objectivesSubmission = z.strictObject({ candidates: z.array(z.strictObject(candidateFields)).min(1).max(50), limitations: text });
export const portfolioSubmission = z.strictObject({ coverage, investments: z.array(z.strictObject(investmentFields)).max(100), limitations: text });
export const objectivesReconciliation = z.strictObject({
  candidates: z.array(z.strictObject({ ...candidateFields, ...traceFields })).max(100),
  disagreements: z.array(disagreement).max(200),
  excluded: z.array(excluded).max(200),
  limitations: text,
});
export const portfolioReconciliation = z.strictObject({
  coverage,
  investments: z.array(z.strictObject({ ...investmentFields, ...traceFields })).max(200),
  disagreements: z.array(disagreement).max(200),
  excluded: z.array(excluded).max(200),
  limitations: text,
});
type ObjectivesSubmission = z.infer<typeof objectivesSubmission>;
type PortfolioSubmission = z.infer<typeof portfolioSubmission>;
type ObjectivesReconciliation = z.infer<typeof objectivesReconciliation>;
type PortfolioReconciliation = z.infer<typeof portfolioReconciliation>;
type Submission = ObjectivesSubmission | PortfolioSubmission;
type Item = { key: string; name: string; lift?: Estimate; unsized?: { missing: string } };
type TracedItem = Item & z.infer<z.ZodObject<typeof traceFields>>;
type Disagreement = z.infer<typeof disagreement>;

const payload = z.record(z.string(), z.unknown());
export const submitInput = z.strictObject({ requestId: key, slot, submission: payload });
export const reconcileInput = z.strictObject({ requestId: key, reconciliation: payload });
export const rerunInput = z.strictObject({ requestId: key, objectiveIds: z.array(key).min(1, "Name at least one objective").max(50), reason: text });
export const closeInput = z.strictObject({ requestId: key, reason: text });
export const requestInput = z.strictObject({ requestId: key });
export const listInput = z.strictObject({
  status: z.enum(RESEARCH_STATUSES).optional(),
  kind: z.enum(RESEARCH_KINDS).optional(),
  phase: z.enum(RESEARCH_PHASES).optional(),
});

function schemaIssues(schema: z.ZodType, value: unknown): { data: unknown; issues: string[] } {
  const result = schema.safeParse(value);
  if (result.success) return { data: result.data, issues: [] };
  return { data: null, issues: result.error.issues.slice(0, 25).map((issue) => `${issue.path.length ? `${issue.path.join(".")}: ` : ""}${issue.message}`) };
}

function reject(what: string, issues: string[]): never {
  throw new PlanError("rejected", `${what} rejected:\n${issues.map((issue) => `- ${issue}`).join("\n")}`, "Fix every listed problem and submit again; nothing was saved.");
}

const close = (a: number, b: number) => Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));
const label = (list: string, index: number, item: { name: string }) => `${list}[${index}] ("${item.name}")`;

export function estimateIssues(estimate: Estimate, where: string): string[] {
  const issues: string[] = [];
  const measures = [
    ["baseline", estimate.baseline],
    ["withChange.low", estimate.withChange.low],
    ["withChange.base", estimate.withChange.base],
    ["withChange.high", estimate.withChange.high],
  ] as const;
  for (const [name, entry] of measures) {
    if (entry.unit !== estimate.unit) issues.push(`${where}.lift.${name} is in "${entry.unit}" but the estimate's unit is "${estimate.unit}"; units must match`);
    if (entry.period !== estimate.period) issues.push(`${where}.lift.${name} covers "${entry.period}" but the estimate's period is "${estimate.period}"; periods must match`);
  }
  for (const bound of ["low", "base", "high"] as const) {
    const expected = estimate.withChange[bound].value - estimate.baseline.value;
    if (!close(estimate.lift[bound], expected)) {
      issues.push(`${where}.lift.lift.${bound} is ${estimate.lift[bound]}, but lift = with the change − baseline = ${estimate.withChange[bound].value} − ${estimate.baseline.value} = ${expected}`);
    }
  }
  const { low, base, high } = estimate.lift;
  if (!(low <= base && base <= high)) issues.push(`${where}.lift.lift must satisfy low ≤ base ≤ high (got ${low}, ${base}, ${high})`);
  estimate.funnelSteps?.forEach((step, index, steps) => {
    if (index < steps.length - 1 && !step.linkToNext) issues.push(`${where}.lift.funnelSteps[${index}] ("${step.step}") has no supported link to the next step`);
  });
  return issues;
}

function itemIssues(list: string, items: Item[]): string[] {
  const issues: string[] = [];
  const seen = new Set<string>();
  items.forEach((item, index) => {
    const where = label(list, index, item);
    if (seen.has(item.key)) issues.push(`${where}: key "${item.key}" is used twice; keys must be unique`);
    seen.add(item.key);
    if (item.lift && item.unsized) issues.push(`${where}: give lift or unsized.missing, not both`);
    if (!item.lift && !item.unsized) issues.push(`${where}: give lift, or unsized.missing saying what evidence is missing to size it`);
    if (item.lift) issues.push(...estimateIssues(item.lift, where));
  });
  return issues;
}

type PortfolioItem = PortfolioSubmission["investments"][number];

function portfolioIssues(list: string, items: PortfolioItem[], portfolio: Investment[], required: Investment[]): string[] {
  const issues: string[] = [];
  const known = new Set(portfolio.map((investment) => investment.id));
  const referenced = new Map<string, number>();
  items.forEach((item, index) => {
    if (!item.investmentId) return;
    const where = label(list, index, item);
    if (!known.has(item.investmentId)) issues.push(`${where}: investmentId ${item.investmentId} isn't in this objective's portfolio`);
    if (referenced.has(item.investmentId)) issues.push(`${where}: investmentId ${item.investmentId} is already covered by ${list}[${referenced.get(item.investmentId)}]`);
    referenced.set(item.investmentId, index);
  });
  for (const investment of required) {
    if (!referenced.has(investment.id)) {
      issues.push(`Existing activity left out: ${investment.id} ("${investment.name}") is in the portfolio; include it with investmentId ${investment.id}`);
    }
  }
  return issues;
}

async function ownerIssues(list: string, items: ObjectivesSubmission["candidates"], findThread: (id: string) => Promise<ThreadInfo | null>): Promise<string[]> {
  const issues: string[] = [];
  for (const [index, item] of items.entries()) {
    if (item.owner.threadId && !(await findThread(item.owner.threadId).catch(() => null))) {
      issues.push(`${label(list, index, item)}: owner.threadId ${item.owner.threadId} isn't an existing bb thread`);
    }
  }
  return issues;
}

const liftState = (item: Item) => item.lift
  ? `${item.lift.lift.base >= 0 ? "+" : ""}${item.lift.lift.base} ${item.lift.unit} per ${item.lift.period}`
  : "unsized";

const estimateSources = (estimate: Estimate) => unique([
  ...estimate.baseline.sources,
  ...estimate.withChange.low.sources,
  ...estimate.withChange.base.sources,
  ...estimate.withChange.high.sources,
  ...(estimate.funnelSteps ?? []).flatMap((step) => [...step.sources, ...(step.linkToNext?.sources ?? [])]),
]).sort();

export function liftDifferences(a: Item, b: Item): string[] {
  if (!a.lift || !b.lift) return !a.lift && !b.lift ? [] : ["sizing"];
  const x = a.lift;
  const y = b.lift;
  const differences: string[] = [];
  if (x.unit !== y.unit) differences.push("unit");
  if (x.period !== y.period) differences.push("period");
  if (x.population.trim().toLowerCase() !== y.population.trim().toLowerCase()) differences.push("population");
  if (!close(x.baseline.value, y.baseline.value)) differences.push("baseline");
  if (x.method !== y.method) differences.push("method");
  if (!close(x.lift.base, y.lift.base)) differences.push("base lift");
  if (!close(x.lift.low, y.lift.low) || !close(x.lift.high, y.lift.high)) differences.push("range");
  if (JSON.stringify(estimateSources(x)) !== JSON.stringify(estimateSources(y))) differences.push("sources");
  return differences;
}

export function traceIssues(list: string, items: TracedItem[], submissions: Record<Slot, Item[]>, disagreements: Disagreement[], excludedItems: z.infer<typeof excluded>[]): string[] {
  const issues: string[] = [];
  const find = (entry: { slot: Slot; key: string }) => submissions[entry.slot].find((item) => item.key === entry.key) ?? null;
  const used = new Set<string>();
  const keys = new Set(items.map((item) => item.key));
  const listed = new Set(disagreements.flatMap((entry) => entry.affects));
  items.forEach((item, index) => {
    const where = label(list, index, item);
    const sources = item.from.map((entry) => {
      const found = find(entry);
      if (!found) issues.push(`${where} traces to ${entry.slot}:${entry.key}, which isn't in submission ${entry.slot}`);
      used.add(`${entry.slot}:${entry.key}`);
      return found ? { slot: entry.slot, item: found } : null;
    }).filter((entry) => entry !== null);
    if (item.lift) {
      if (item.liftFrom && item.recomputation) issues.push(`${where}: use liftFrom or recomputation, not both`);
      else if (item.liftFrom) {
        const fromRef = item.liftFrom;
        if (!item.from.some((entry) => entry.slot === fromRef.slot && entry.key === fromRef.key)) issues.push(`${where}.liftFrom ${fromRef.slot}:${fromRef.key} must also be listed in from`);
        const source = find(fromRef);
        if (source && JSON.stringify(source.lift ?? null) !== JSON.stringify(item.lift)) {
          issues.push(`${where}.lift differs from ${fromRef.slot}:${fromRef.key}'s lift; copy it exactly, or replace liftFrom with recomputation and show the inputs`);
        }
      } else if (!item.recomputation) {
        issues.push(`${where}.lift must come from a submission (liftFrom) or an explicit recomputation (recomputation.reason, with its inputs in lift)`);
      }
    } else if (item.liftFrom || item.recomputation) {
      issues.push(`${where}: liftFrom and recomputation only apply when the item has lift`);
    }
    const slots = new Set(sources.map((entry) => entry.slot));
    if (sources.length && !listed.has(item.key)) {
      if (slots.size === 1) {
        issues.push(`${where} comes only from submission ${[...slots][0]}; list it in disagreements with how it was resolved`);
      } else {
        const a = sources.find((entry) => entry.slot === "a")!.item;
        const b = sources.find((entry) => entry.slot === "b")!.item;
        const differences = liftDifferences(a, b);
        if (differences.length) {
          issues.push(`${where}: submissions disagree on ${differences.join(", ")} (a: ${liftState(a)}, b: ${liftState(b)}); list it in disagreements with a resolution`);
        }
      }
    }
  });
  for (const entry of excludedItems) {
    if (!find(entry)) issues.push(`excluded ${entry.slot}:${entry.key} isn't in submission ${entry.slot}`);
    used.add(`${entry.slot}:${entry.key}`);
  }
  for (const current of SLOTS) {
    for (const item of submissions[current]) {
      if (!used.has(`${current}:${item.key}`)) issues.push(`Submission ${current} item "${item.key}" ("${item.name}") is neither reconciled nor listed in excluded with a reason`);
    }
  }
  disagreements.forEach((entry, index) => {
    for (const affected of entry.affects) {
      if (!keys.has(affected)) issues.push(`disagreements[${index}] ("${entry.topic}") affects "${affected}", which isn't a reconciled item key`);
    }
    if (entry.resolved) return;
    items.forEach((item, itemIndex) => {
      if (entry.affects.includes(item.key) && item.lift) {
        issues.push(`${label(list, itemIndex, item)} is affected by unresolved disagreement "${entry.topic}", so it can't carry lift; set unsized.missing to the unanswered question`);
      }
    });
  });
  return issues;
}

export interface Basis { unit: string; period: string; population: string }
export interface Rankable { id: string; name: string; base: number | null; basis: Basis | null }
export interface Ranking { ranks: Map<string, number | null>; reasons: Map<string, string> }

const basisKey = (basis: Basis) => JSON.stringify([basis.unit, basis.period, basis.population.trim().toLowerCase()]);
const basisLabel = (basis: Basis) => `${basis.unit} per ${basis.period} for ${basis.population}`;

export function rankByLift(items: Rankable[], blocked: string | null = null): Ranking {
  const ranks = new Map<string, number | null>(items.map((item) => [item.id, null]));
  const reasons = new Map<string, string>();
  const sized = items.filter((item): item is Rankable & { base: number; basis: Basis } => item.base !== null && item.basis !== null);
  if (!sized.length) return { ranks, reasons };
  if (blocked) {
    for (const item of sized) reasons.set(item.id, blocked);
    return { ranks, reasons };
  }
  const groups = new Map<string, { basis: Basis; members: typeof sized }>();
  for (const item of sized) {
    const key = basisKey(item.basis);
    const group = groups.get(key) ?? { basis: item.basis, members: [] };
    group.members.push(item);
    groups.set(key, group);
  }
  const largest = Math.max(...[...groups.values()].map((group) => group.members.length));
  const leaders = [...groups.values()].filter((group) => group.members.length === largest);
  if (leaders.length > 1) {
    const reason = `Not ranked: sized items are on ${groups.size} different bases with no main comparable group (${[...groups.values()].map((group) => basisLabel(group.basis)).join("; ")}). Put them on one shared unit, period and population.`;
    for (const item of sized) reasons.set(item.id, reason);
    return { ranks, reasons };
  }
  const main = leaders[0]!;
  main.members.sort((x, y) => y.base - x.base || x.name.localeCompare(y.name)).forEach((item, index) => ranks.set(item.id, index + 1));
  for (const item of sized) {
    if (!main.members.includes(item)) reasons.set(item.id, `Not ranked: measured as ${basisLabel(item.basis)}, not the portfolio's shared basis (${basisLabel(main.basis)}).`);
  }
  return { ranks, reasons };
}

const unique = (values: string[]) => [...new Set(values)];

function toLift(estimate: Estimate, item: { cost: string; dependencies: string; sources: string[] }): Lift {
  const sources = unique([...item.sources, ...estimateSources(estimate)]).slice(0, LIMITS.sources);
  return parse(liftSchema, {
    low: estimate.lift.low,
    base: estimate.lift.base,
    high: estimate.lift.high,
    unit: estimate.unit,
    method: `${METHOD_LABEL[estimate.method]}: ${estimate.methodNote}`.slice(0, LIMITS.briefField),
    cost: item.cost,
    dependencies: item.dependencies,
    sources,
  });
}

function funnelSteps(estimate: Estimate | undefined): FunnelStep[] | null {
  return estimate?.funnelSteps?.map((step) => ({
    step: step.step,
    value: step.value,
    unit: step.unit,
    sources: step.sources,
    linkToNext: step.linkToNext ? { rate: step.linkToNext.rate ?? null, sources: step.linkToNext.sources } : null,
  })) ?? null;
}

const rankable = (record: { id: string; name: string; research: ResearchEvidence | null }): Rankable => ({
  id: record.id, name: record.name, base: record.research?.lift?.base ?? null, basis: record.research?.lift ? record.research.basis : null,
});

const unresolvedReason = (disagreements: Disagreement[]): string | null => {
  const open = disagreements.filter((entry) => !entry.resolved);
  if (!open.length) return null;
  return `Not ranked: the portfolio has ${open.length === 1 ? "an unresolved disagreement" : `${open.length} unresolved disagreements`} (${open.map((entry) => `"${entry.topic}"`).join(", ")}); nothing ranks until it is resolved.`;
};

interface InputRecord { kind: RecordKind; id: string; revision: number; content: string }
interface FrozenInputs { brief: unknown; records: InputRecord[]; investmentIds: string[] | null }

interface JobRow { request_id: string; phase: ResearchPhase; project_id: string | null; detail: string | null; updated_at: string; inputs: string | null }
interface ThreadRow { request_id: string; role: ThreadRole; project_id: string; title: string; thread_id: string | null; created_at: string }
interface SubmissionRow { request_id: string; slot: Slot; subject_revision: number; thread_id: string | null; body: string; created_at: string }
interface ReconciliationRow { request_id: string; thread_id: string | null; body: string; created_at: string }

export interface SpawnRequest {
  projectId: string;
  title: string;
  prompt: string;
  metadata: { researchRequestId: string; role: ThreadRole };
}

export interface ResearchHost {
  settings(): Promise<{ projectId: string | null; concurrency: number }>;
  threadProject(threadId: string): Promise<string | null>;
  spawnThread(request: SpawnRequest): Promise<string>;
  findSpawnedThread(args: { projectId: string; title: string }): Promise<string | null>;
  log(message: string): void;
}

export interface ResearchDeps {
  db: Db;
  migrate: Migrate;
  host: ResearchHost;
  findThread(threadId: string): Promise<ThreadInfo | null>;
  publish(change: { kind: RecordKind; id: string }): void;
  now(): Date;
}

export interface ResearchJobView {
  request: ResearchRequest;
  phase: ResearchPhase | null;
  detail: string | null;
  threads: Array<{ role: ThreadRole; threadId: string | null }>;
  submissions: Array<{ slot: Slot; threadId: string | null; createdAt: string; body: unknown | null }>;
  reconciliation: { threadId: string | null; createdAt: string; body: unknown } | null;
}

export type ResearchService = ReturnType<typeof createResearchService>;

export function createResearchService(deps: ResearchDeps) {
  const store = createStore(deps.db, deps.migrate);
  const db = deps.db;
  const stamp = () => deps.now().toISOString();

  const jobById = db.prepare("SELECT * FROM research_jobs WHERE request_id = ?");
  const upsertJob = db.prepare(`INSERT INTO research_jobs (request_id, phase, project_id, detail, updated_at) VALUES (@request_id, @phase, @project_id, @detail, @updated_at)
    ON CONFLICT (request_id) DO UPDATE SET phase = excluded.phase, project_id = COALESCE(excluded.project_id, research_jobs.project_id), detail = excluded.detail, updated_at = excluded.updated_at`);
  const jobDetail = db.prepare("UPDATE research_jobs SET detail = @detail, updated_at = @updated_at WHERE request_id = @request_id");
  const jobInputs = db.prepare("UPDATE research_jobs SET inputs = @inputs WHERE request_id = @request_id");
  const inFlight = db.prepare(`SELECT COUNT(*) AS count FROM research_jobs WHERE phase IN (${IN_FLIGHT.map(() => "?").join(", ")})`);
  const activeJobs = db.prepare(`SELECT * FROM research_jobs WHERE phase IN (${IN_FLIGHT.map(() => "?").join(", ")}) ORDER BY updated_at, rowid`);
  const threadRow = db.prepare("SELECT * FROM research_threads WHERE request_id = ? AND role = ?");
  const threadsFor = db.prepare("SELECT * FROM research_threads WHERE request_id = ? ORDER BY created_at, rowid");
  const reserveThread = db.prepare(`INSERT INTO research_threads (request_id, role, project_id, title, thread_id, created_at)
    VALUES (@request_id, @role, @project_id, @title, NULL, @created_at) ON CONFLICT (request_id, role) DO NOTHING`);
  const setThread = db.prepare("UPDATE research_threads SET thread_id = @thread_id WHERE request_id = @request_id AND role = @role AND thread_id IS NULL");
  const submissionRow = db.prepare("SELECT * FROM research_submissions WHERE request_id = ? AND slot = ?");
  const submissionsFor = db.prepare("SELECT * FROM research_submissions WHERE request_id = ? ORDER BY slot");
  const insertSubmission = db.prepare(`INSERT INTO research_submissions (request_id, slot, subject_revision, thread_id, body, created_at)
    VALUES (@request_id, @slot, @subject_revision, @thread_id, @body, @created_at)`);
  const reconciliationRow = db.prepare("SELECT * FROM research_reconciliations WHERE request_id = ?");
  const insertReconciliation = db.prepare("INSERT INTO research_reconciliations (request_id, thread_id, body, created_at) VALUES (@request_id, @thread_id, @body, @created_at)");

  const job = (requestId: string) => (jobById.get(requestId) as JobRow | undefined) ?? null;
  const setJob = (requestId: string, phase: ResearchPhase, projectId: string | null, detail: string | null) =>
    upsertJob.run({ request_id: requestId, phase, project_id: projectId, detail, updated_at: stamp() });
  const thread = (requestId: string, role: ThreadRole) => (threadRow.get(requestId, role) as ThreadRow | undefined) ?? null;
  const submission = (requestId: string, current: Slot) => (submissionRow.get(requestId, current) as SubmissionRow | undefined) ?? null;
  const submissions = (requestId: string) => submissionsFor.all(requestId) as SubmissionRow[];

  const requireRequest = (requestId: string): ResearchRequest => {
    const request = store.research(requestId);
    if (!request) throw new PlanError("not_found", `No research request ${requestId}.`, "Run `bb plan research list` to see requests.");
    return request;
  };

  const requirePhase = (request: ResearchRequest, phases: readonly ResearchPhase[], action: string): JobRow => {
    const current = job(request.id);
    if (!current || !phases.includes(current.phase)) {
      throw new PlanError("wrong_phase", `Research request ${request.id} can't ${action}: it is ${current?.phase ?? "waiting to start"}.`, current?.detail ?? undefined);
    }
    return current;
  };

  const requireCaller = (request: ResearchRequest, role: ThreadRole, callerThreadId: string | null): string => {
    const owner = thread(request.id, role)?.thread_id ?? null;
    if (!callerThreadId) {
      throw new PlanError("not_your_slot", `Run this from the ${ROLE_LABEL[role]} thread for research request ${request.id}; calls without a thread are rejected.`);
    }
    if (!owner) {
      throw new PlanError("not_your_slot", `The ${ROLE_LABEL[role]} thread for research request ${request.id} isn't registered yet.`, "Wait a moment, then submit again.");
    }
    if (callerThreadId !== owner) {
      throw new PlanError("not_your_slot", `Only ${ROLE_LABEL[role]} thread ${owner} can do this for research request ${request.id}.`);
    }
    return owner;
  };

  const objectiveIdFor = (request: ResearchRequest): string | null => {
    if (request.kind === "build_portfolio") return request.subjectId;
    if (request.kind === "refresh_portfolio") return request.detail?.objectiveId ?? (request.subjectKind === "objective" ? request.subjectId : null);
    return null;
  };

  const frozen = (requestId: string): FrozenInputs | null => {
    const raw = job(requestId)?.inputs;
    return raw ? JSON.parse(raw) as FrozenInputs : null;
  };

  const portfolioAt = (objectiveId: string, request: ResearchRequest) => {
    const ids = frozen(request.id)?.investmentIds;
    if (ids) return store.investmentsFor(objectiveId).filter((investment) => ids.includes(investment.id));
    const at = request.claimedAt ?? stamp();
    return store.investmentsFor(objectiveId).filter((investment) => investment.createdAt <= at);
  };

  const coveredReasons = (detail: ResearchDetail | null) => mergeList(detail?.reasons, detail?.reason ? [detail.reason] : []);

  const editedRecords = (request: ResearchRequest): EditedRecord[] => request.detail?.records
    ?? [{ kind: request.subjectKind, id: request.subjectId, revision: request.subjectRevision, fields: request.detail?.fields ?? [] }];

  const editedRecord = (record: EditedRecord) => {
    if (record.kind === "priority") return store.priority(record.id);
    if (record.kind === "objective") return store.objective(record.id);
    return store.investment(record.id);
  };

  const subjectName = (request: ResearchRequest): string => {
    if (request.subjectKind === "priority") return store.priority(request.subjectId)?.name ?? request.subjectId;
    if (request.subjectKind === "objective") return store.objective(request.subjectId)?.name ?? request.subjectId;
    return store.investment(request.subjectId)?.name ?? request.subjectId;
  };

  const priorityInput = (id: string): InputRecord | null => {
    const priority = store.priority(id);
    if (!priority) return null;
    const { name, metric, baseline, now, target, by, constraints } = priority;
    return { kind: "priority", id, revision: priority.revision, content: JSON.stringify({ name, metric, baseline, now, target, by, constraints }) };
  };
  const objectiveInput = (id: string): InputRecord | null => {
    const objective = store.objective(id);
    return objective ? { kind: "objective", id, revision: objective.revision, content: JSON.stringify({ name: objective.name, priorityId: objective.priorityId }) } : null;
  };
  const investmentInput = (id: string): InputRecord | null => {
    const investment = store.investment(id);
    if (!investment) return null;
    const brief = Object.fromEntries(BRIEF_FIELDS.map((field) => [field, investment.brief[field] ?? null]));
    return { kind: "investment", id, revision: investment.revision, content: JSON.stringify({ name: investment.name, existing: investment.existing, brief }) };
  };
  const currentInput = (record: InputRecord) => record.kind === "priority" ? priorityInput(record.id) : record.kind === "objective" ? objectiveInput(record.id) : investmentInput(record.id);

  const freeze = (request: ResearchRequest): FrozenInputs => {
    const objectiveId = objectiveIdFor(request);
    if (objectiveId) {
      const objective = store.objective(objectiveId);
      const investmentIds = store.investmentsFor(objectiveId).map((investment) => investment.id);
      const records = [
        objective ? priorityInput(objective.priorityId) : null,
        objectiveInput(objectiveId),
        ...investmentIds.map(investmentInput),
      ].filter((record): record is InputRecord => record !== null);
      return { brief: liveBrief(request, investmentIds), records, investmentIds };
    }
    const records = request.kind === "discover_objectives" ? [priorityInput(request.subjectId)].filter((record): record is InputRecord => record !== null) : [];
    return { brief: liveBrief(request, null), records, investmentIds: null };
  };

  const changedInputs = (request: ResearchRequest): string[] => (frozen(request.id)?.records ?? []).flatMap((record) => {
    const current = currentInput(record);
    if (!current) return [`${record.kind} ${record.id} was removed`];
    return current.content === record.content ? [] : [`${record.kind} ${record.id} (revision ${record.revision} → ${current.revision})`];
  });

  const brief = (request: ResearchRequest): unknown => frozen(request.id)?.brief ?? liveBrief(request, null);

  const liveBrief = (request: ResearchRequest, investmentIds: string[] | null): unknown => {
    const objectiveId = objectiveIdFor(request);
    if (objectiveId) {
      const objective = store.objective(objectiveId);
      const priority = objective ? store.priority(objective.priorityId) : null;
      return {
        priority,
        objective: objective && { id: objective.id, name: objective.name, revision: objective.revision, assigneeThreadId: objective.assigneeThreadId },
        portfolio: (investmentIds ? store.investmentsFor(objectiveId).filter((investment) => investmentIds.includes(investment.id)) : portfolioAt(objectiveId, request)).map((investment) => ({
          investmentId: investment.id, name: investment.name, existing: investment.existing, brief: investment.brief, lift: investment.lift,
        })),
        ...(request.detail?.investmentIds?.length ? { addedInvestmentIds: request.detail.investmentIds } : {}),
        ...(coveredReasons(request.detail).length ? { rerunReasons: coveredReasons(request.detail) } : {}),
      };
    }
    if (request.kind === "assess_edit") {
      const edits = editedRecords(request).map((record) => ({ ...record, record: editedRecord(record) }));
      const objective = request.subjectKind === "objective" ? store.objective(request.subjectId) : null;
      const priority = request.subjectKind === "priority" ? store.priority(request.subjectId) : objective ? store.priority(objective.priorityId) : null;
      return { edits, objective, priority };
    }
    if (request.subjectKind === "priority") {
      const priority = store.priority(request.subjectId);
      return {
        priority,
        objectives: store.objectivesFor(request.subjectId).map((objective) => ({
          id: objective.id, name: objective.name, approved: objective.approved, assigneeThreadId: objective.assigneeThreadId,
          investments: store.investmentsFor(objective.id).map((investment) => ({ id: investment.id, name: investment.name, existing: investment.existing, state: investment.state })),
        })),
        ...(request.detail?.fields ? { changedFields: request.detail.fields } : {}),
      };
    }
    if (request.subjectKind === "objective") {
      const objective = store.objective(request.subjectId);
      return { objective, priority: objective ? store.priority(objective.priorityId) : null, changedFields: request.detail?.fields ?? [] };
    }
    const investment = store.investment(request.subjectId);
    return { investment, objective: investment ? store.objective(investment.objectiveId) : null, changedFields: request.detail?.fields ?? [] };
  };

  const json = (value: unknown) => "```json\n" + JSON.stringify(value, null, 2) + "\n```";

  const prompt = (request: ResearchRequest, role: ThreadRole): string => {
    if (role === "a" || role === "b") {
      const skill = request.kind === "discover_objectives" ? SKILLS.discover : SKILLS.portfolio;
      return [
        `You are independent research agent ${role.toUpperCase()} for Plan research request ${request.id}: ${KIND_LABEL[request.kind]}.`,
        `Follow the Plan plugin's \`${skill}\` skill, and its \`${SKILLS.lift}\` skill for every lift. This is the research standard in org-status README §6: work alone from original sources and record sources, method, calculations and limits.`,
        "Independence: a second agent is researching this same brief separately. Do not look for, read or ask about its work, do not message any other thread, and do not change Plan records. Your only output is one submission; Plan publishes nothing until both submissions are reconciled.",
        "Brief (the records as frozen when this request started; the other agent and the reconciliation get this same brief):",
        json(brief(request)),
        `When ready, save your submission JSON to a file and run \`bb plan research submit --request ${request.id} --slot ${role} --file <path>\` (or pipe it with \`--data-stdin\`). A rejection lists exactly what to fix; fix it and submit again. An accepted submission is final.`,
      ].join("\n\n");
    }
    if (role === "reconcile") {
      const saved = submissions(request.id).map((row) => ({ slot: row.slot, threadId: row.thread_id, submission: JSON.parse(row.body) as unknown }));
      return [
        `You reconcile Plan research request ${request.id}: ${KIND_LABEL[request.kind]}.`,
        `Follow the Plan plugin's \`${SKILLS.reconcile}\` skill, and its \`${SKILLS.lift}\` skill for any recomputation. Both independent submissions are saved below. Compare them claim by claim; do not average, vote, or invent items. Do not message any other thread or change Plan records.`,
        "Brief (the same frozen brief both research agents got):",
        json(brief(request)),
        "Submissions:",
        json(saved),
        `Submit with \`bb plan research reconcile --request ${request.id} --file <path>\` (or \`--data-stdin\`). A rejection lists exactly what to fix. A valid reconciliation publishes to the Plan.`,
      ].join("\n\n");
    }
    const edits = editedRecords(request);
    return [
      `${edits.length === 1 ? "A Plan record was" : `${edits.length} Plan records were`} edited. Assess whether the edits affect research, for Plan request ${request.id}. Judge them together as one batch.`,
      `Follow the Plan plugin's \`${SKILLS.assess}\` skill. Do not message any other thread or change Plan records.`,
      `Edited records, each with the fields that changed, under ${request.subjectKind} ${request.subjectId}:`,
      json(brief(request)),
      `If it can't change any lift (a rename or wording change keeps the evidence), run \`bb plan research close --request ${request.id} --reason <why>\`.`,
      `If it can, run \`bb plan research rerun --request ${request.id} --objective <objectiveId> --reason <why>\`, repeating --objective only for the objectives whose portfolios are affected.`,
    ].join("\n\n");
  };

  const ensureThread = async (request: ResearchRequest, role: ThreadRole, projectId: string): Promise<string> => {
    const existing = thread(request.id, role);
    if (existing?.thread_id) return existing.thread_id;
    if (!existing) {
      reserveThread.run({ request_id: request.id, role, project_id: projectId, title: `${ROLE_LABEL[role]} · ${subjectName(request).slice(0, 80)} (${request.id})`, created_at: stamp() });
    }
    const row = thread(request.id, role)!;
    if (row.thread_id) return row.thread_id;
    const found = await deps.host.findSpawnedThread({ projectId: row.project_id, title: row.title });
    const threadId = found ?? await deps.host.spawnThread({
      projectId: row.project_id, title: row.title, prompt: prompt(request, role), metadata: { researchRequestId: request.id, role },
    });
    setThread.run({ request_id: request.id, role, thread_id: threadId });
    return thread(request.id, role)!.thread_id!;
  };

  const rolesFor = (phase: ResearchPhase): ThreadRole[] => {
    if (phase === "researching") return ["a", "b"];
    if (phase === "reconciling") return ["a", "b", "reconcile"];
    if (phase === "assessing") return ["assess"];
    return [];
  };

  const advance = async (row: JobRow) => {
    const request = store.research(row.request_id);
    if (!request || !row.project_id) return;
    let phase = row.phase;
    if (phase === "researching" && submissions(request.id).length === SLOTS.length) {
      setJob(request.id, "reconciling", null, null);
      phase = "reconciling";
    }
    try {
      for (const role of rolesFor(phase)) await ensureThread(request, role, row.project_id);
    } catch (error) {
      const message = `Couldn't create a research thread: ${error instanceof Error ? error.message : String(error)}. Plan retries automatically.`;
      jobDetail.run({ request_id: request.id, detail: message, updated_at: stamp() });
      deps.host.log(`${request.id}: ${message}`);
    }
  };

  const gate = (request: ResearchRequest): string | null => {
    if (request.kind === "assess_edit" && request.detail?.lastEditAt) {
      const wait = Date.parse(request.detail.lastEditAt) + ASSESS_QUIET_MS - deps.now().getTime();
      if (wait > 0) return `Waiting for edits to settle; the assessment starts ${Math.ceil(wait / 1000)}s after the last edit and covers every edit until then.`;
    }
    const objectiveId = objectiveIdFor(request);
    if (!objectiveId) return null;
    const objective = store.objective(objectiveId);
    if (!objective) return `Objective ${objectiveId} no longer exists.`;
    if (!objective.approved) return "Waiting for the objective to be approved.";
    if (!objective.assigneeThreadId) return "Waiting for a team to be assigned to the objective.";
    const [running] = store.inFlightPortfolioFor(objectiveId).filter((entry) => entry.id !== request.id);
    if (running) return `Waiting for portfolio research ${running.id} on this objective to finish; this run then covers every change since.`;
    return null;
  };

  const foldPendingPortfolio = (request: ResearchRequest) => {
    const objectiveId = objectiveIdFor(request);
    if (!objectiveId || !PORTFOLIO_KINDS.includes(request.kind)) return;
    const others = store.pendingPortfolioFor(objectiveId).filter((entry) => entry.id !== request.id);
    if (!others.length) return;
    let detail: ResearchDetail = { ...request.detail, objectiveId };
    for (const other of others) {
      if (!store.claimResearch(other.id, RUNNER, stamp())) continue;
      setJob(other.id, "closed", null, `Covered by research ${request.id}.`);
      detail = {
        ...detail,
        investmentIds: mergeList(detail.investmentIds, [...(other.detail?.investmentIds ?? []), ...(other.subjectKind === "investment" ? [other.subjectId] : [])]),
        reasons: mergeList(detail.reasons, coveredReasons(other.detail)),
        coalesced: mergeList(detail.coalesced, [other.id, ...(other.detail?.coalesced ?? [])]),
      };
    }
    store.setResearchDetail(request.id, detail);
  };

  const originProject = async (request: ResearchRequest): Promise<string | null> => {
    const objectiveId = objectiveIdFor(request)
      ?? (request.subjectKind === "objective" ? request.subjectId : request.subjectKind === "investment" ? store.investment(request.subjectId)?.objectiveId ?? null : null);
    const objective = objectiveId ? store.objective(objectiveId) : null;
    const priority = store.priority(objective?.priorityId ?? (request.subjectKind === "priority" ? request.subjectId : ""));
    for (const threadId of [objective?.originThreadId, priority?.originThreadId]) {
      if (!threadId) continue;
      const projectId = await deps.host.threadProject(threadId).catch(() => null);
      if (projectId) return projectId;
    }
    return null;
  };

  const defaultProject = async (): Promise<string | null> => {
    for (const objective of store.objectives()) {
      if (!objective.assigneeThreadId) continue;
      const projectId = await deps.host.threadProject(objective.assigneeThreadId).catch(() => null);
      if (projectId) return projectId;
    }
    return null;
  };

  const runTick = async () => {
    const settings = await deps.host.settings();
    const cap = Math.max(1, Math.floor(settings.concurrency));
    for (const row of activeJobs.all(...IN_FLIGHT) as JobRow[]) await advance(row);
    let running = (inFlight.get(...IN_FLIGHT) as { count: number }).count;
    let fallback: string | null | undefined;
    for (const listed of store.researchRequests({ status: "pending", kind: null })) {
      if (running >= cap) break;
      const request = store.research(listed.id);
      if (!request || request.status !== "pending") continue;
      const waiting = gate(request);
      if (waiting) { setJob(request.id, "blocked", null, waiting); continue; }
      let projectId = settings.projectId ?? await originProject(request);
      if (!projectId) {
        if (fallback === undefined) fallback = await defaultProject();
        projectId = fallback;
      }
      if (!projectId) { setJob(request.id, "blocked", null, NO_PROJECT); continue; }
      const target = projectId;
      const started = store.transaction(() => {
        if (gate(request) || !store.claimResearch(request.id, RUNNER, stamp())) return false;
        foldPendingPortfolio(request);
        setJob(request.id, request.kind === "assess_edit" ? "assessing" : "researching", target, null);
        jobInputs.run({ request_id: request.id, inputs: JSON.stringify(freeze(store.research(request.id)!)) });
        return true;
      });
      if (!started) continue;
      running += 1;
      await advance(job(request.id)!);
    }
  };

  let chain: Promise<void> = Promise.resolve();
  const tick = (): Promise<void> => {
    chain = chain.then(runTick, runTick);
    return chain;
  };
  const kick = () => { tick().catch((error: unknown) => deps.host.log(`Research runner failed: ${error instanceof Error ? error.message : String(error)}`)); };

  const validateSubmission = async (request: ResearchRequest, body: unknown): Promise<Submission> => {
    if (request.kind === "discover_objectives") {
      const { data, issues } = schemaIssues(objectivesSubmission, body);
      if (issues.length) reject("Submission", issues);
      const value = data as ObjectivesSubmission;
      const all = [...itemIssues("candidates", value.candidates), ...(await ownerIssues("candidates", value.candidates, deps.findThread))];
      if (all.length) reject("Submission", all);
      return value;
    }
    const { data, issues } = schemaIssues(portfolioSubmission, body);
    if (issues.length) reject("Submission", issues);
    const value = data as PortfolioSubmission;
    const objectiveId = objectiveIdFor(request)!;
    const all = [
      ...itemIssues("investments", value.investments),
      ...portfolioIssues("investments", value.investments, store.investmentsFor(objectiveId), portfolioAt(objectiveId, request)),
    ];
    if (all.length) reject("Submission", all);
    return value;
  };

  const savedSubmissions = (request: ResearchRequest): Record<Slot, Submission> => {
    const rows = submissions(request.id);
    const bySlot = (current: Slot) => JSON.parse(rows.find((row) => row.slot === current)!.body) as Submission;
    return { a: bySlot("a"), b: bySlot("b") };
  };

  const evidence = (request: ResearchRequest, item: Item, extra: Partial<ResearchEvidence> = {}): ResearchEvidence => ({
    requestId: request.id,
    submissionThreadIds: SLOTS.map((current) => thread(request.id, current)?.thread_id).filter((id): id is string => Boolean(id)),
    reconciliationThreadId: thread(request.id, "reconcile")?.thread_id ?? null,
    basis: item.lift ? { unit: item.lift.unit, period: item.lift.period, population: item.lift.population } : null,
    lift: item.lift ? { low: item.lift.lift.low, base: item.lift.lift.base, high: item.lift.lift.high, unit: item.lift.unit } : null,
    missing: item.unsized?.missing ?? null,
    funnelSteps: funnelSteps(item.lift),
    rationale: null,
    ownerProposal: null,
    metricLink: null,
    cost: null,
    dependencies: null,
    ...extra,
  });

  const publishObjectives = (request: ResearchRequest, value: ObjectivesReconciliation, at: string) => {
    const priority = store.priority(request.subjectId);
    if (!priority) throw new PlanError("not_found", `Company priority ${request.subjectId} no longer exists; nothing was published.`);
    const existing = new Set(store.objectivesFor(priority.id).map((objective) => objective.name.trim().toLowerCase()));
    const created: Objective[] = [];
    for (const candidate of value.candidates) {
      if (existing.has(candidate.name.trim().toLowerCase())) continue;
      const objective: Objective = {
        id: newId("objective"),
        priorityId: priority.id,
        name: candidate.name,
        approved: false,
        assigneeThreadId: candidate.owner.threadId ?? null,
        originThreadId: null,
        research: evidence(request, candidate, {
          rationale: candidate.rationale, ownerProposal: candidate.owner.proposal, metricLink: candidate.metricLink,
          cost: candidate.effort ?? null, dependencies: candidate.dependencies ?? null,
        }),
        rank: null,
        revision: 1,
        createdAt: at,
        updatedAt: at,
      };
      store.insertObjective(objective);
      existing.add(candidate.name.trim().toLowerCase());
      created.push(objective);
    }
    const { ranks, reasons } = rankByLift(created.map(rankable), unresolvedReason(value.disagreements));
    for (const objective of created) {
      store.setObjectiveRank(objective.id, ranks.get(objective.id) ?? null);
      const reason = reasons.get(objective.id);
      if (reason && objective.research) store.setObjectiveEvidence(objective.id, { ...objective.research, missing: reason });
    }
    return { kind: "priority" as const, id: priority.id, summary: `Proposed ${created.length} objective${created.length === 1 ? "" : "s"}; you choose which to adopt.`, ids: created.map((objective) => objective.id) };
  };

  const publishPortfolio = (request: ResearchRequest, value: PortfolioReconciliation, at: string) => {
    const objectiveId = objectiveIdFor(request)!;
    if (!store.objective(objectiveId)) throw new PlanError("not_found", `Objective ${objectiveId} no longer exists; nothing was published.`);
    const ids: string[] = [];
    for (const item of value.investments) {
      const lift = item.lift ? toLift(item.lift, item) : null;
      const research = evidence(request, item, { cost: item.cost, dependencies: item.dependencies });
      const researched: Required<Brief> = {
        deliverable: item.deliverable, scope: item.scope, acceptanceCriteria: item.acceptanceCriteria, measurement: item.measurement, sources: item.sources.slice(0, LIMITS.sources),
      };
      const current = store.investmentsFor(objectiveId);
      const match = item.investmentId
        ? current.find((investment) => investment.id === item.investmentId)
        : current.find((investment) => investment.name.trim().toLowerCase() === item.name.trim().toLowerCase());
      if (match) {
        const merged: Brief = { ...match.brief };
        for (const field of BRIEF_FIELDS) {
          if (!match.briefSetByHand.includes(field)) Object.assign(merged, { [field]: researched[field] });
        }
        store.publishInvestmentResearch(match.id, lift, research, merged, at);
        ids.push(match.id);
        continue;
      }
      const investment: Investment = {
        id: newId("investment"),
        objectiveId,
        name: item.name,
        existing: item.existing,
        state: "not_started",
        brief: researched,
        briefSetByHand: [],
        lift,
        research,
        rank: null,
        revision: 1,
        createdAt: at,
        updatedAt: at,
      };
      store.insertInvestment(investment);
      ids.push(investment.id);
    }
    const portfolio = store.investmentsFor(objectiveId);
    const blocked = unresolvedReason(value.disagreements);
    const { ranks, reasons } = rankByLift(portfolio.map((investment) => rankable({ ...investment, research: investment.lift ? investment.research : null })), blocked);
    for (const investment of portfolio) {
      store.setInvestmentRank(investment.id, ranks.get(investment.id) ?? null);
      const reason = reasons.get(investment.id);
      if (reason && investment.research) store.setInvestmentEvidence(investment.id, { ...investment.research, missing: reason });
    }
    const ranked = ids.filter((id) => ranks.get(id) !== null).length;
    const summary = `Published ${ids.length} investment${ids.length === 1 ? "" : "s"}: ${ranked} ranked, ${ids.length - ranked} unranked.${blocked ? ` ${blocked}` : ""}`;
    return { kind: "objective" as const, id: objectiveId, summary, ids };
  };

  const supersede = (request: ResearchRequest, changed: string[]): string => {
    const at = stamp();
    const reason = `Inputs changed while research ${request.id} ran: ${changed.join("; ")}`;
    const summary = `Superseded: ${changed.join("; ")} changed after this research started. Nothing was published; a fresh run covers the change.`;
    store.transaction(() => {
      const objectiveId = objectiveIdFor(request);
      const objective = objectiveId ? store.objective(objectiveId) : null;
      if (objective) {
        const followUp = queuePortfolioRefresh(store, objective, { key: `superseded:${request.id}`, investmentId: null, reason }, at);
        const next = store.research(followUp)!;
        store.setResearchDetail(followUp, { ...next.detail, investmentIds: mergeList(next.detail?.investmentIds, request.detail?.investmentIds ?? []) });
      } else if (request.kind === "discover_objectives") {
        const priority = store.priority(request.subjectId);
        if (priority) {
          store.insertResearch({
            id: newId("research"), kind: "discover_objectives", idempotencyKey: `discover_objectives:${priority.id}:after:${request.id}`, subjectKind: "priority",
            subjectId: priority.id, subjectRevision: priority.revision, detail: { reasons: [reason] }, createdAt: at,
          });
        }
      }
      setJob(request.id, "closed", null, summary);
    });
    deps.publish({ kind: request.subjectKind, id: request.subjectId });
    kick();
    return summary;
  };

  const view = (request: ResearchRequest): ResearchJobView => {
    const current = job(request.id);
    const rows = submissions(request.id);
    const reveal = rows.length === SLOTS.length;
    const reconciled = (reconciliationRow.get(request.id) as ReconciliationRow | undefined) ?? null;
    return {
      request,
      phase: current?.phase ?? null,
      detail: current?.detail ?? null,
      threads: (threadsFor.all(request.id) as ThreadRow[]).map((row) => ({ role: row.role, threadId: row.thread_id })),
      submissions: rows.map((row) => ({ slot: row.slot, threadId: row.thread_id, createdAt: row.created_at, body: reveal ? JSON.parse(row.body) as unknown : null })),
      reconciliation: reconciled ? { threadId: reconciled.thread_id, createdAt: reconciled.created_at, body: JSON.parse(reconciled.body) as unknown } : null,
    };
  };

  return {
    tick,
    kick,

    async list(input: unknown = {}): Promise<ResearchJobView[]> {
      const value = parse(listInput, input);
      return store.researchRequests({ status: value.status ?? null, kind: value.kind ?? null })
        .map(view)
        .filter((entry) => !value.phase || entry.phase === value.phase);
    },

    async show(input: unknown): Promise<ResearchJobView> {
      const { requestId } = parse(requestInput, input);
      return view(requireRequest(requestId));
    },

    async submit(input: unknown, callerThreadId: string | null) {
      const value = parse(submitInput, input);
      const request = requireRequest(value.requestId);
      if (request.kind === "assess_edit") throw new PlanError("wrong_phase", `Research request ${request.id} assesses an edit; use close or rerun instead of submit.`);
      requirePhase(request, ["researching"], "take submissions");
      const owner = requireCaller(request, value.slot, callerThreadId);
      const previous = submission(request.id, value.slot);
      if (previous) {
        throw new PlanError("already_submitted", `Slot ${value.slot} already submitted for research request ${request.id} at ${previous.created_at}; submissions are immutable.`);
      }
      const changed = changedInputs(request);
      if (changed.length) {
        return { requestId: request.id, slot: value.slot, accepted: false, next: supersede(request, changed) };
      }
      const body = await validateSubmission(request, value.submission);
      const result = store.transaction(() => {
        requirePhase(request, ["researching"], "take submissions");
        if (submission(request.id, value.slot)) throw new PlanError("already_submitted", `Slot ${value.slot} already submitted for research request ${request.id}; submissions are immutable.`);
        insertSubmission.run({
          request_id: request.id, slot: value.slot, subject_revision: request.subjectRevision, thread_id: owner,
          body: JSON.stringify(body), created_at: stamp(),
        });
        const complete = submissions(request.id).length === SLOTS.length;
        if (complete) setJob(request.id, "reconciling", null, null);
        return complete;
      });
      kick();
      return {
        requestId: request.id,
        slot: value.slot,
        accepted: true,
        next: result ? "Both submissions are saved; a reconciliation thread compares them next." : `Waiting for slot ${value.slot === "a" ? "b" : "a"}. Nothing publishes from one submission.`,
      };
    },

    async reconcile(input: unknown, callerThreadId: string | null) {
      const value = parse(reconcileInput, input);
      const request = requireRequest(value.requestId);
      requirePhase(request, ["reconciling"], "take a reconciliation");
      const owner = requireCaller(request, "reconcile", callerThreadId);
      const stale = changedInputs(request);
      if (stale.length) return { requestId: request.id, published: [] as string[], summary: supersede(request, stale), superseded: true };
      const saved = savedSubmissions(request);
      let body: ObjectivesReconciliation | PortfolioReconciliation;
      if (request.kind === "discover_objectives") {
        const { data, issues } = schemaIssues(objectivesReconciliation, value.reconciliation);
        if (issues.length) reject("Reconciliation", issues);
        const parsed = data as ObjectivesReconciliation;
        const all = [
          ...itemIssues("candidates", parsed.candidates),
          ...traceIssues("candidates", parsed.candidates, { a: (saved.a as ObjectivesSubmission).candidates, b: (saved.b as ObjectivesSubmission).candidates }, parsed.disagreements, parsed.excluded),
          ...(await ownerIssues("candidates", parsed.candidates, deps.findThread)),
        ];
        if (all.length) reject("Reconciliation", all);
        body = parsed;
      } else {
        const { data, issues } = schemaIssues(portfolioReconciliation, value.reconciliation);
        if (issues.length) reject("Reconciliation", issues);
        const parsed = data as PortfolioReconciliation;
        const objectiveId = objectiveIdFor(request)!;
        const all = [
          ...itemIssues("investments", parsed.investments),
          ...portfolioIssues("investments", parsed.investments, store.investmentsFor(objectiveId), portfolioAt(objectiveId, request)),
          ...traceIssues("investments", parsed.investments, { a: (saved.a as PortfolioSubmission).investments, b: (saved.b as PortfolioSubmission).investments }, parsed.disagreements, parsed.excluded),
        ];
        if (all.length) reject("Reconciliation", all);
        body = parsed;
      }
      const at = stamp();
      const published = store.transaction(() => {
        requirePhase(request, ["reconciling"], "take a reconciliation");
        const late = changedInputs(request);
        if (late.length) return null;
        insertReconciliation.run({ request_id: request.id, thread_id: owner, body: JSON.stringify(body), created_at: at });
        const result = request.kind === "discover_objectives"
          ? publishObjectives(request, body as ObjectivesReconciliation, at)
          : publishPortfolio(request, body as PortfolioReconciliation, at);
        setJob(request.id, "published", null, result.summary);
        return result;
      });
      if (!published) return { requestId: request.id, published: [] as string[], summary: supersede(request, changedInputs(request)), superseded: true };
      deps.publish({ kind: published.kind, id: published.id });
      kick();
      return { requestId: request.id, published: published.ids, summary: published.summary, superseded: false };
    },

    async rerun(input: unknown, callerThreadId: string | null) {
      const value = parse(rerunInput, input);
      const request = requireRequest(value.requestId);
      if (request.kind !== "assess_edit") throw new PlanError("wrong_phase", `Research request ${request.id} isn't an edit assessment; only assessments can rerun research.`);
      requirePhase(request, ["assessing"], "rerun research");
      requireCaller(request, "assess", callerThreadId);
      const at = stamp();
      const created = store.transaction(() => {
        requirePhase(request, ["assessing"], "rerun research");
        const ids = unique(value.objectiveIds).map((objectiveId) => {
          const objective = store.objective(objectiveId);
          if (!objective) throw new PlanError("not_found", `No objective ${objectiveId}.`, "Run `bb plan show` to list objectives.");
          return invalidateResearch(store, objective, null, { key: `rerun:${request.id}`, investmentId: null, reason: value.reason }, at);
        });
        setJob(request.id, "closed", null, `Research rerun: ${value.reason}`);
        return ids;
      });
      for (const objectiveId of unique(value.objectiveIds)) deps.publish({ kind: "objective", id: objectiveId });
      kick();
      return { requestId: request.id, outcome: "rerun", refreshRequests: created };
    },

    async close(input: unknown, callerThreadId: string | null) {
      const value = parse(closeInput, input);
      const request = requireRequest(value.requestId);
      if (request.kind !== "assess_edit") throw new PlanError("wrong_phase", `Research request ${request.id} isn't an edit assessment; it closes by publishing a reconciliation.`);
      requirePhase(request, ["assessing"], "close");
      requireCaller(request, "assess", callerThreadId);
      setJob(request.id, "closed", null, `No research impact: ${value.reason}`);
      kick();
      return { requestId: request.id, outcome: "no_research_impact" };
    },
  };
}
