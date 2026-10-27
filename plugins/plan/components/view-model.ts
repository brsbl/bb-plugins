import type { Investment, Lift, ObjectiveView, PriorityView } from "../model.js";

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

export function inProgress(objective: ObjectiveView): Investment | undefined {
  return objective.investments.find((investment) => investment.state === "in_progress");
}

export function busyFor(objectives: ObjectiveView[], threadId: string | null): { objective: ObjectiveView; investment: Investment } | null {
  if (!threadId) return null;
  for (const objective of objectives) {
    if (objective.assigneeThreadId !== threadId) continue;
    const investment = inProgress(objective);
    if (investment) return { objective, investment };
  }
  return null;
}

export function threadLabel(ref: ThreadRef | null): string {
  return ref ? ref.name ?? ref.threadId : "";
}

export function assigneeLabel(objective: ObjectiveView): string | null {
  return objective.assignee ? threadLabel(objective.assignee) : null;
}

export function objectiveMeta(objective: ObjectiveView): string {
  const active = inProgress(objective);
  return [assigneeLabel(objective) ?? "Unassigned", active ? `In progress: ${active.name}` : ""].filter(Boolean).join(" · ");
}

export function researching(objective: ObjectiveView): boolean {
  return objective.approved && objective.assigneeThreadId !== null;
}

export function emptyPortfolioText(objective: ObjectiveView): string {
  return researching(objective) ? "Researching" : "Research starts once a team is assigned";
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
  if (investment.lift) return null;
  return researchFinishedUnsized(investment) ? "—" : unknownLiftText(objective);
}

export function canShowStart(investment: Investment): boolean {
  return investment.state === "not_started" && investment.rank !== null;
}

export function startBlockedReason(objectives: ObjectiveView[], objective: ObjectiveView, investment?: Investment): string | null {
  if (!objective.approved) return "Approve the objective first";
  if (!objective.assigneeThreadId || !objective.assignee) return "Assign a team first";
  if (!objective.assignee.available) return "The assigned team thread no longer exists";
  if (investment && (!investment.brief.deliverable || !investment.brief.acceptanceCriteria)) return "Add a deliverable and acceptance criteria to the brief first";
  const busy = busyFor(objectives, objective.assigneeThreadId);
  if (!busy) return null;
  const team = (objective.assignee.name ?? "This team").split(" / ").pop() ?? "This team";
  return `${team} is working on ${busy.investment.name}`;
}

export function originLabel(origin: Origin): string {
  return origin.kind === "plan" ? "Plan" : threadLabel(origin.owner);
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

export function formatAmount(value: number | null): string {
  return value === null ? "—" : value.toLocaleString("en-US");
}

export function formatBy(iso: string, today: Date = new Date()): string {
  const date = new Date(`${iso}T00:00:00Z`);
  const sameYear = date.getUTCFullYear() === today.getUTCFullYear();
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

export function metricPatch(priority: PriorityView, fields: { now: string; target: string; by: string; metric?: string }): Record<string, unknown> | string {
  const now = parseAmount(fields.now);
  const target = parseAmount(fields.target);
  if (now === undefined) return "Now must be a number";
  if (target === undefined) return "Target must be a number";
  const by = fields.by.trim() || null;
  const patch: Record<string, unknown> = {};
  if (now !== priority.now) patch.now = now;
  if (target !== priority.target) patch.target = target;
  if (by !== priority.by) patch.by = by;
  if (fields.metric !== undefined) {
    const metric = fields.metric.trim() || null;
    if (metric !== priority.metric) patch.metric = metric;
  }
  if (priority.baseline === null && now !== null) patch.baseline = now;
  return patch;
}

export function threadQuery(text: string): string {
  return text.replace(/^@/, "").trim();
}

export function chooseThread(text: string, options: { id: string; name: string }[]): { id: string | null } | null {
  const query = threadQuery(text);
  if (!query) return { id: null };
  if (/^thr_[A-Za-z0-9_-]+$/.test(query)) return { id: query };
  const exact = options.find((option) => option.name === query) ?? options.find((option) => option.name.toLowerCase() === query.toLowerCase());
  return exact ? { id: exact.id } : null;
}
