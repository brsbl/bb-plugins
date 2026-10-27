import { z } from "zod";

export const LIMITS = { name: 200, metric: 200, constraints: 2000, briefField: 4000, source: 1000, sources: 50, id: 100 } as const;

const name = z.string().trim().min(1, "Name can't be empty").max(LIMITS.name);
const recordId = z.string().trim().min(1).max(LIMITS.id);
const threadId = z.string().trim().regex(/^thr_[A-Za-z0-9_-]+$/, "Use a bb thread ID, like thr_…, not a name");
const revision = z.number().int().min(1);
const amount = z.number().finite();
const metric = z.string().trim().min(1).max(LIMITS.metric);
const constraints = z.string().trim().min(1).max(LIMITS.constraints);
const briefText = z.string().trim().min(1).max(LIMITS.briefField);
const source = z.string().trim().min(1).max(LIMITS.source);
const sources = z.array(source).max(LIMITS.sources);

export const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD").refine((value) => {
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}, "Not a real date");

export const INVESTMENT_STATES = ["not_started", "in_progress", "done"] as const;
export type InvestmentState = (typeof INVESTMENT_STATES)[number];

export const RESEARCH_KINDS = ["discover_objectives", "build_portfolio", "refresh_portfolio", "assess_edit"] as const;
export type ResearchKind = (typeof RESEARCH_KINDS)[number];
export const RESEARCH_STATUSES = ["pending", "claimed"] as const;
export type ResearchStatus = (typeof RESEARCH_STATUSES)[number];
export type RecordKind = "priority" | "objective" | "investment";
export const METRIC_FORMATS = ["number", "percent"] as const;
export type MetricFormat = (typeof METRIC_FORMATS)[number];
export const BRIEF_FIELDS = ["deliverable", "scope", "acceptanceCriteria", "measurement", "sources"] as const;
export type BriefField = (typeof BRIEF_FIELDS)[number];
export const NO_PROJECT = "No project for research threads. Set the Plan plugin's researchProjectId setting, create the priority or objective from a thread in the project research should use, or assign an objective to a team thread so research can use its project.";
export const HOLD_REASON = "Checking whether this edit changes the research";
export const NO_PROJECT_SHORT = "Research can't start: no project for its threads. Set Plan's Research project setting.";

export function acceptanceCriteria(criteria: string): string[] {
  return criteria.split(/\r?\n/)
    .map((line) => line.replace(/^\s*(?:(?:[-*•]|\d+[.)]|\[[ xX]\])\s+)+/, "").trim())
    .filter(Boolean);
}

export function briefIssues(brief: Brief): string[] {
  const issues: string[] = [];
  if (!brief.deliverable) issues.push("brief.deliverable: add what the team hands back");
  if (!brief.scope) issues.push("brief.scope: add what the work covers and excludes");
  if (!brief.acceptanceCriteria || !acceptanceCriteria(brief.acceptanceCriteria).length) issues.push("brief.acceptanceCriteria: add how the deliverable is accepted, one criterion per line");
  if (!brief.measurement) issues.push("brief.measurement: add how the result is measured");
  if (!brief.sources?.length) issues.push("brief.sources: add at least one source");
  return issues;
}

export function inferMetricFormat(metric: string | null | undefined): MetricFormat {
  return metric && (metric.includes("%") || /retention/i.test(metric)) ? "percent" : "number";
}

export const briefSchema = z.strictObject({
  deliverable: briefText.optional(),
  scope: briefText.optional(),
  acceptanceCriteria: briefText.optional(),
  measurement: briefText.optional(),
  sources: sources.optional(),
});
export type Brief = z.infer<typeof briefSchema>;

export const liftSchema = z.strictObject({
  low: amount,
  base: amount,
  high: amount,
  unit: z.string().trim().min(1).max(LIMITS.metric),
  method: briefText,
  cost: briefText,
  dependencies: briefText,
  sources,
}).refine((lift) => lift.low <= lift.base && lift.base <= lift.high, "Lift must satisfy low ≤ base ≤ high");
export type Lift = z.infer<typeof liftSchema>;

export interface Priority {
  id: string;
  name: string;
  metric: string | null;
  baseline: number | null;
  now: number | null;
  target: number | null;
  by: string | null;
  constraints: string | null;
  metricFormat: MetricFormat;
  originThreadId: string | null;
  revision: number;
  createdAt: string;
  updatedAt: string;
}

export interface FunnelStep {
  step: string;
  value: number;
  unit: string;
  sources: string[];
  linkToNext: { rate: number | null; sources: string[] } | null;
}

export interface ResearchEvidence {
  requestId: string;
  submissionThreadIds: string[];
  reconciliationThreadId: string | null;
  basis: { unit: string; period: string; population: string } | null;
  lift: { low: number; base: number; high: number; unit: string } | null;
  missing: string | null;
  funnelSteps: FunnelStep[] | null;
  rationale: string | null;
  ownerProposal: string | null;
  metricLink: { claim: string; sources: string[] } | null;
  cost: string | null;
  dependencies: string | null;
}

export interface Objective {
  id: string;
  priorityId: string;
  name: string;
  approved: boolean;
  assigneeThreadId: string | null;
  originThreadId: string | null;
  research: ResearchEvidence | null;
  rank: number | null;
  revision: number;
  createdAt: string;
  updatedAt: string;
}

export interface Investment {
  id: string;
  objectiveId: string;
  name: string;
  existing: boolean;
  state: InvestmentState;
  brief: Brief;
  briefSetByHand: BriefField[];
  lift: Lift | null;
  research: ResearchEvidence | null;
  rank: number | null;
  revision: number;
  createdAt: string;
  updatedAt: string;
}

export interface EditedRecord {
  kind: RecordKind;
  id: string;
  revision: number;
  fields: string[];
}

export interface ResearchDetail {
  fields?: string[];
  objectiveId?: string;
  reason?: string;
  investmentIds?: string[];
  reasons?: string[];
  coalesced?: string[];
  group?: string;
  records?: EditedRecord[];
  lastEditAt?: string;
  hold?: boolean;
}

export interface ResearchRequest {
  id: string;
  kind: ResearchKind;
  idempotencyKey: string;
  subjectKind: RecordKind;
  subjectId: string;
  subjectRevision: number;
  detail: ResearchDetail | null;
  status: ResearchStatus;
  createdAt: string;
  claimedAt: string | null;
  claimedBy: string | null;
}

export interface Assignee {
  threadId: string;
  name: string | null;
  available: boolean;
  parent: { threadId: string; name: string | null } | null;
}

export type ObjectiveView = Objective & {
  assignee: Assignee | null; investments: Investment[]; researchActive: boolean; researchBlocked: string | null; researchHold: string | null;
};
export type PriorityView = Priority & { objectives: ObjectiveView[]; researchBlocked: string | null };
export interface Overview { priorities: PriorityView[] }

const atLeastOneChange = (keys: readonly string[]) => (value: Record<string, unknown>) => keys.some((key) => value[key] !== undefined);

const PRIORITY_FIELDS = ["name", "metric", "metricFormat", "baseline", "now", "target", "by", "constraints"] as const;
const metricFormat = z.enum(METRIC_FORMATS);
export const priorityAddInput = z.strictObject({
  name,
  metric: metric.optional(),
  metricFormat: metricFormat.optional(),
  baseline: amount.optional(),
  now: amount.optional(),
  target: amount.optional(),
  by: isoDate.optional(),
  constraints: constraints.optional(),
});
export const priorityEditInput = z.strictObject({
  id: recordId,
  expectedRevision: revision,
  name: name.optional(),
  metric: metric.nullable().optional(),
  metricFormat: metricFormat.optional(),
  baseline: amount.nullable().optional(),
  now: amount.nullable().optional(),
  target: amount.nullable().optional(),
  by: isoDate.nullable().optional(),
  constraints: constraints.nullable().optional(),
}).refine(atLeastOneChange(PRIORITY_FIELDS), "Change at least one field");

const OBJECTIVE_FIELDS = ["name", "priorityId"] as const;
export const objectiveAddInput = z.strictObject({
  priorityId: recordId,
  name,
  proposed: z.boolean().optional(),
  assigneeThreadId: threadId.optional(),
});
export const priorityAddRpcInput = priorityAddInput.extend({ originThreadId: threadId });
export const objectiveAddRpcInput = objectiveAddInput.extend({ originThreadId: threadId });
export const objectiveEditInput = z.strictObject({
  id: recordId,
  expectedRevision: revision,
  name: name.optional(),
  priorityId: recordId.optional(),
}).refine(atLeastOneChange(OBJECTIVE_FIELDS), "Change at least one field");
export const objectiveApproveInput = z.strictObject({ id: recordId, expectedRevision: revision });
export const objectiveAssignInput = z.strictObject({ id: recordId, expectedRevision: revision, assigneeThreadId: threadId.nullable() });

export const briefPatchSchema = z.strictObject({
  deliverable: briefText.nullable().optional(),
  scope: briefText.nullable().optional(),
  acceptanceCriteria: briefText.nullable().optional(),
  measurement: briefText.nullable().optional(),
  sources: sources.nullable().optional(),
});
const INVESTMENT_FIELDS = ["name", "existing", "brief"] as const;
export const investmentAddInput = z.strictObject({
  objectiveId: recordId,
  name,
  existing: z.boolean().optional(),
  brief: briefSchema.optional(),
});
export const investmentEditInput = z.strictObject({
  id: recordId,
  expectedRevision: revision,
  name: name.optional(),
  existing: z.boolean().optional(),
  brief: briefPatchSchema.optional(),
}).refine(atLeastOneChange(INVESTMENT_FIELDS), "Change at least one field");

export const showInput = z.strictObject({ id: recordId });
export const emptyInput = z.strictObject({});
export const researchListInput = z.strictObject({
  status: z.enum(RESEARCH_STATUSES).optional(),
  kind: z.enum(RESEARCH_KINDS).optional(),
});
export const researchClaimInput = z.strictObject({ id: recordId, claimedBy: z.string().trim().min(1).max(LIMITS.id) });
export const RECORD_KINDS = ["priority", "objective", "investment"] as const;
export const openRecordInput = z.strictObject({
  threadId,
  record: z.strictObject({ kind: z.enum(RECORD_KINDS), id: recordId }).nullable(),
});
export interface OpenRecord { kind: RecordKind; id: string }
