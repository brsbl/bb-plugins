import { briefIssues, type Assignee, type Investment, type Lift, type MetricFormat, type ObjectiveView, type PriorityView } from "../model.js";
import type { ActiveStart } from "../start.js";

export interface ThreadRef { threadId: string; name: string | null }
export interface OrgGroup extends ThreadRef { teams: ThreadRef[] }
export interface AssigneeThread extends ThreadRef { parent: ThreadRef | null }

export type Owner = ThreadRef & { kind: "org" | "team" };
export type Origin = { kind: "plan" } | { kind: "owner"; owner: Owner };

export function groupOrgs(threads: AssigneeThread[]): OrgGroup[] {
  const orgs: OrgGroup[] = [];
  const orgFor = (ref: ThreadRef) => {
    let org = orgs.find((entry) => entry.threadId === ref.threadId);
    if (!org) orgs.push(org = { threadId: ref.threadId, name: ref.name, teams: [] });
    return org;
  };
  for (const thread of threads) {
    if (!thread.parent) { orgFor(thread); continue; }
    const org = orgFor(thread.parent);
    if (!org.teams.some((team) => team.threadId === thread.threadId)) org.teams.push({ threadId: thread.threadId, name: thread.name });
  }
  return orgs;
}

export function allObjectives(priorities: PriorityView[]): ObjectiveView[] {
  return priorities.flatMap((priority) => priority.objectives);
}

export function ownerObjectives(objectives: ObjectiveView[], orgs: OrgGroup[], owner: Owner): ObjectiveView[] {
  if (owner.kind === "team") return objectives.filter((objective) => objective.assigneeThreadId === owner.threadId);
  const org = orgs.find((entry) => entry.threadId === owner.threadId);
  const ids = new Set([owner.threadId, ...(org?.teams.map((team) => team.threadId) ?? [])]);
  return objectives.filter((objective) => objective.assigneeThreadId !== null && ids.has(objective.assigneeThreadId));
}

export function liveOwner(orgs: OrgGroup[], owner: Owner): Owner {
  for (const org of orgs) {
    if (owner.kind === "org" && org.threadId === owner.threadId) return { ...owner, name: org.name };
    const team = org.teams.find((entry) => entry.threadId === owner.threadId);
    if (team) return { ...owner, name: team.name };
  }
  return owner;
}

export function orderedObjectives(objectives: ObjectiveView[]): ObjectiveView[] {
  const proposed = objectives.filter((objective) => !objective.approved)
    .map((objective, index) => ({ objective, index }))
    .sort((a, b) => (a.objective.rank ?? Infinity) - (b.objective.rank ?? Infinity) || a.index - b.index)
    .map((entry) => entry.objective);
  return [...objectives.filter((objective) => objective.approved), ...proposed];
}

export function inProgress(objective: ObjectiveView): Investment | undefined {
  return objective.investments.find((investment) => investment.state === "in_progress");
}

export interface Busy { objective: ObjectiveView; investment: Investment; start: ActiveStart | null }

export function busyFor(objectives: ObjectiveView[], threadId: string | null, starts: readonly ActiveStart[]): Busy | null {
  if (!threadId) return null;
  for (const start of starts) {
    if (start.assigneeThreadId !== threadId) continue;
    for (const objective of objectives) {
      const investment = objective.investments.find((entry) => entry.id === start.investmentId);
      if (investment) return { objective, investment, start };
    }
  }
  for (const objective of objectives) {
    if (objective.assigneeThreadId !== threadId) continue;
    const investment = inProgress(objective);
    if (investment) return { objective, investment, start: null };
  }
  return null;
}

export function threadLabel(ref: ThreadRef | null): string {
  return ref ? ref.name ?? ref.threadId : "";
}

export function teamLabel(assignee: Assignee): string {
  return assignee.parent ? `${threadLabel(assignee.parent)} / ${threadLabel(assignee)}` : threadLabel(assignee);
}

export function assigneeLabel(objective: ObjectiveView): string | null {
  return objective.assignee ? teamLabel(objective.assignee) : null;
}

export function objectiveMeta(objective: ObjectiveView): string {
  if (!objective.approved) {
    const owner = assigneeLabel(objective) ?? objective.research?.ownerProposal ?? "Unassigned";
    const lift = objective.research?.lift;
    return ["Proposed", owner, lift ? signedAmount(lift.base) : ""].filter(Boolean).join(" · ");
  }
  const active = inProgress(objective);
  return [assigneeLabel(objective) ?? "Unassigned", active ? `In progress: ${active.name}` : ""].filter(Boolean).join(" · ");
}

export function researching(objective: ObjectiveView): boolean {
  return objective.approved && objective.assigneeThreadId !== null;
}

export function emptyPortfolioText(objective: ObjectiveView): string {
  if (researching(objective)) return "Researching";
  if (!objective.approved) return objective.assigneeThreadId ? "Research starts once the objective is approved" : "Research starts once the objective is approved and a team is assigned";
  return "Research starts once a team is assigned";
}

export function unknownLiftText(objective: ObjectiveView): string {
  return researching(objective) ? "Researching" : "—";
}

export type RankedInvestment = Investment & { rank: number };

export function portfolioRows(objective: ObjectiveView): { ranked: RankedInvestment[]; unranked: Investment[] } {
  const ranked = objective.investments.filter((investment): investment is RankedInvestment => investment.rank !== null)
    .sort((a, b) => a.rank - b.rank);
  return { ranked, unranked: objective.investments.filter((investment) => investment.rank === null) };
}

export function researchFinishedUnsized(investment: Investment): boolean {
  return investment.lift === null && Boolean(investment.research?.missing);
}

export function liftText(objective: ObjectiveView, investment: Investment): string | null {
  if (investment.lift) return investment.rank === null ? "Unranked" : null;
  return researching(objective) ? "Researching" : "—";
}

export function canShowStart(investment: Investment): boolean {
  return investment.state === "not_started" && investment.rank !== null;
}

export function startBlockedReason(objectives: ObjectiveView[], objective: ObjectiveView, starts: readonly ActiveStart[], investment?: Investment): string | null {
  if (!objective.approved) return "Approve the objective first";
  if (!objective.assigneeThreadId || !objective.assignee) return "Assign a team first";
  if (!objective.assignee.available) return "The assigned team thread no longer exists";
  if (objective.researchHold) return objective.researchHold;
  if (investment && briefIssues(investment.brief).length) return "Complete the brief first: deliverable, scope, acceptance criteria, measurement and sources";
  const busy = busyFor(objectives, objective.assigneeThreadId, starts);
  if (!busy || (investment && busy.investment.id === investment.id)) return null;
  const team = (objective.assignee.name ?? "This team").split(" / ").pop() ?? "This team";
  return `${team} is working on ${busy.investment.name}`;
}

export function startRetryHint(starts: readonly ActiveStart[], investment: Investment): string | null {
  const start = starts.find((entry) => entry.investmentId === investment.id);
  if (!start || start.status === "sent") return null;
  return start.status === "uncertain"
    ? "Couldn't confirm the brief reached the team. Press Start to check; it won't send twice."
    : "The brief is being sent to the team.";
}

export function originLabel(origin: Origin, orgs: OrgGroup[] = []): string {
  return origin.kind === "plan" ? "Plan" : threadLabel(liveOwner(orgs, origin.owner));
}

export function liftDomain(lifts: Lift[]): { min: number; max: number } {
  const min = Math.min(0, ...lifts.map((lift) => lift.low));
  const max = Math.max(0, ...lifts.map((lift) => lift.high));
  return max > min ? { min, max } : { min, max: min + 1 };
}

export function liftBar(lift: Lift, domain: { min: number; max: number }): { left: number; width: number; base: number } {
  const x = (value: number) => ((value - domain.min) / (domain.max - domain.min)) * 100;
  return { left: x(lift.low), width: x(lift.high) - x(lift.low), base: x(lift.base) };
}

export function formatAmount(value: number | null, format: MetricFormat = "number"): string {
  if (value === null) return "—";
  const text = value.toLocaleString("en-US");
  return format === "percent" ? `${text}%` : text;
}

export function signedAmount(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toLocaleString("en-US")}`;
}

export function unitLabel(unit: string): string {
  return /^[A-Z][a-z]/.test(unit) ? unit[0]!.toLowerCase() + unit.slice(1) : unit;
}

export function funnelSummary(investment: Investment): string | null {
  const steps = investment.research?.funnelSteps;
  return steps?.length ? `${steps.map((step) => step.step).join(" → ")}, each step sourced` : null;
}

export function evidenceSources(investment: Investment): string[] {
  const steps = investment.research?.funnelSteps ?? [];
  return [...new Set([
    ...(investment.lift?.sources ?? []),
    ...(investment.brief.sources ?? []),
    ...(investment.research?.metricLink?.sources ?? []),
    ...steps.flatMap((step) => [...step.sources, ...(step.linkToNext?.sources ?? [])]),
  ])];
}

const YEAR_MS = 365 * 24 * 60 * 60 * 1000;

export function formatBy(iso: string, today: Date = new Date()): string {
  const date = new Date(`${iso}T00:00:00Z`);
  const ahead = date.getTime() - Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const sameYear = date.getUTCFullYear() === today.getUTCFullYear() || (ahead >= 0 && ahead < YEAR_MS);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", ...(sameYear ? {} : { year: "numeric" }), timeZone: "UTC" });
}

export function metricProgress(priority: Pick<PriorityView, "baseline" | "now" | "target">): number {
  const { baseline, now, target } = priority;
  if (baseline === null || now === null || target === null || target === baseline) return 0;
  return Math.max(0, Math.min(100, Math.round(((now - baseline) / (target - baseline)) * 100)));
}

export function parseAmount(text: string): number | null | undefined {
  const cleaned = text.replace(/[^0-9.-]/g, "");
  if (!text.trim()) return null;
  const value = Number(cleaned);
  return cleaned && Number.isFinite(value) ? value : undefined;
}

export interface MetricFields { baseline: string; now: string; target: string; by: string; metric: string; metricFormat: MetricFormat; constraints: string }

export function metricPatch(priority: PriorityView, fields: MetricFields): Record<string, unknown> | string {
  const baselineInput = parseAmount(fields.baseline);
  const now = parseAmount(fields.now);
  const target = parseAmount(fields.target);
  if (baselineInput === undefined) return "Baseline must be a number";
  if (now === undefined) return "Now must be a number";
  if (target === undefined) return "Target must be a number";
  const by = fields.by.trim() || null;
  const metric = fields.metric.trim() || null;
  const constraints = fields.constraints.trim() || null;
  const baseline = baselineInput ?? (priority.baseline === null ? now : null);
  const patch: Record<string, unknown> = {};
  if (baseline !== priority.baseline) patch.baseline = baseline;
  if (now !== priority.now) patch.now = now;
  if (target !== priority.target) patch.target = target;
  if (by !== priority.by) patch.by = by;
  if (metric !== priority.metric) patch.metric = metric;
  if (fields.metricFormat !== priority.metricFormat) patch.metricFormat = fields.metricFormat;
  if (constraints !== priority.constraints) patch.constraints = constraints;
  return patch;
}

export function threadQuery(text: string): string {
  return text.trim().replace(/^@+/, "").trim();
}

export function mentionText(text: string): string {
  return text.replace(/^\s*@+/, "@");
}

export const UNASSIGN = "Unassign";

export function chooseThread(text: string, options: { id: string; name: string; label: string }[]): { id: string | null } | null {
  const query = threadQuery(text);
  if (!query || query === UNASSIGN) return { id: null };
  if (/^thr_[A-Za-z0-9_-]+$/.test(query)) return { id: query };
  const lower = query.toLowerCase();
  const exact = options.find((option) => option.label === query) ?? options.find((option) => option.label.toLowerCase() === lower)
    ?? options.find((option) => option.name === query) ?? options.find((option) => option.name.toLowerCase() === lower);
  return exact ? { id: exact.id } : null;
}
