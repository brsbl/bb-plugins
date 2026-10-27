import { randomBytes } from "node:crypto";
import type { z } from "zod";
import {
  briefSchema, emptyInput, investmentAddInput, investmentEditInput, objectiveAddInput, objectiveApproveInput, objectiveAssignInput,
  objectiveEditInput, openRecordInput, priorityAddInput, priorityEditInput, researchClaimInput, researchListInput, showInput,
  type Assignee, type Brief, type Investment, type Objective, type ObjectiveView, type OpenRecord, type Overview, type Priority, type PriorityView,
  type RecordKind, type ResearchKind, type ResearchRequest,
} from "./model.js";
import { createStore, type Db, type Migrate, type Store } from "./store.js";

export type PlanErrorCode = "invalid" | "not_found" | "stale_revision" | "unknown_thread" | "already_claimed" | "rejected" | "wrong_phase" | "not_your_slot" | "already_submitted"
  | "not_ready" | "wrong_state" | "team_busy" | "start_pending" | "send_uncertain" | "send_failed" | "not_assignee";

export class PlanError extends Error {
  constructor(readonly code: PlanErrorCode, message: string, readonly hint?: string) {
    super(message);
    this.name = "PlanError";
  }
}

export interface ThreadInfo {
  id: string;
  name: string | null;
}

export interface PlanDeps {
  db: Db;
  migrate: Migrate;
  findThread(threadId: string): Promise<ThreadInfo | null>;
  publish(change: { kind: RecordKind; id: string }): void;
  now(): Date;
}

const LABEL: Record<RecordKind, string> = { priority: "company priority", objective: "objective", investment: "investment" };
const PREFIX: Record<RecordKind | "research", string> = { priority: "pri", objective: "obj", investment: "inv", research: "rr" };

export function parse<S extends z.ZodType>(schema: S, input: unknown): z.output<S> {
  const result = schema.safeParse(input);
  if (result.success) return result.data;
  const issue = result.error.issues[0];
  const where = issue?.path.length ? `${issue.path.join(".")}: ` : "";
  throw new PlanError("invalid", `${where}${issue?.message ?? "Invalid input"}`);
}

export function newId(kind: RecordKind | "research"): string {
  return `${PREFIX[kind]}_${randomBytes(8).toString("hex")}`;
}

function missing(kind: RecordKind, id: string): PlanError {
  return new PlanError("not_found", `No ${LABEL[kind]} ${id}.`, "Run `bb plan show` to list records and their IDs.");
}

function stale(kind: RecordKind, id: string, expected: number, current: number): PlanError {
  return new PlanError(
    "stale_revision",
    `This ${LABEL[kind]} changed since revision ${expected}; it is now at revision ${current}. Your edit was not applied.`,
    `Run \`bb plan ${kind} show ${id}\` to read the latest version, then retry with --expected-revision ${current}.`,
  );
}

function checkRevision(kind: RecordKind, id: string, current: { revision: number } | null, expected: number): void {
  if (!current) throw missing(kind, id);
  if (current.revision !== expected) throw stale(kind, id, expected, current.revision);
}

function changedFields<T extends object>(before: T, after: T, keys: readonly (keyof T)[]): string[] {
  return keys.filter((key) => JSON.stringify(before[key]) !== JSON.stringify(after[key])).map(String);
}

function applyPatch(base: Brief, patch: Record<string, unknown>): Record<string, unknown> {
  const next: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) continue;
    if (value === null) delete next[key];
    else next[key] = value;
  }
  return next;
}

export type PlanService = ReturnType<typeof createPlanService>;

export function createPlanService(deps: PlanDeps) {
  const store: Store = createStore(deps.db, deps.migrate);
  const stamp = () => deps.now().toISOString();

  const trigger = (kind: ResearchKind, key: string, subjectKind: RecordKind, subjectId: string, subjectRevision: number, detail: ResearchRequest["detail"], at: string) => {
    store.insertResearch({ id: newId("research"), kind, idempotencyKey: key, subjectKind, subjectId, subjectRevision, detail, createdAt: at });
  };

  const maybeBuildPortfolio = (objective: Objective, at: string) => {
    if (objective.approved && objective.assigneeThreadId) {
      trigger("build_portfolio", `build_portfolio:${objective.id}`, "objective", objective.id, objective.revision, null, at);
    }
  };

  const assessEdit = (kind: RecordKind, id: string, revision: number, fields: string[], at: string) => {
    trigger("assess_edit", `assess_edit:${kind}:${id}:${revision}`, kind, id, revision, { fields }, at);
  };

  const requireThread = async (threadId: string): Promise<ThreadInfo> => {
    const thread = await deps.findThread(threadId);
    if (!thread) {
      throw new PlanError("unknown_thread", `No bb thread ${threadId}.`, "Assign an existing org or team thread by its ID (@mention it in the panel).");
    }
    return thread;
  };

  const assigneeLookup = async (objectives: Objective[]) => {
    const ids = [...new Set(objectives.map((objective) => objective.assigneeThreadId).filter((id): id is string => id !== null))];
    const found = new Map<string, ThreadInfo | null>();
    await Promise.all(ids.map(async (id) => { found.set(id, await deps.findThread(id).catch(() => null)); }));
    return (threadId: string | null): Assignee | null => {
      if (!threadId) return null;
      const thread = found.get(threadId) ?? null;
      return { threadId, name: thread?.name ?? null, available: thread !== null };
    };
  };

  const objectiveViews = async (objectives: Objective[], investmentsOf: (objectiveId: string) => Investment[]): Promise<ObjectiveView[]> => {
    const assignee = await assigneeLookup(objectives);
    return objectives.map((objective) => ({ ...objective, assignee: assignee(objective.assigneeThreadId), investments: investmentsOf(objective.id) }));
  };

  const changed = (kind: RecordKind, id: string) => deps.publish({ kind, id });
  const openInPanel = new Map<string, OpenRecord>();

  return {
    async addPriority(input: unknown): Promise<Priority> {
      const value = parse(priorityAddInput, input);
      const at = stamp();
      const priority: Priority = {
        id: newId("priority"),
        name: value.name,
        metric: value.metric ?? null,
        baseline: value.baseline ?? null,
        now: value.now ?? null,
        target: value.target ?? null,
        by: value.by ?? null,
        constraints: value.constraints ?? null,
        revision: 1,
        createdAt: at,
        updatedAt: at,
      };
      store.transaction(() => {
        store.insertPriority(priority);
        trigger("discover_objectives", `discover_objectives:${priority.id}`, "priority", priority.id, 1, null, at);
      });
      changed("priority", priority.id);
      return priority;
    },

    async editPriority(input: unknown): Promise<Priority> {
      const value = parse(priorityEditInput, input);
      const { id, expectedRevision, ...patch } = value;
      const result = store.transaction(() => {
        const current = store.priority(id);
        checkRevision("priority", id, current, expectedRevision);
        const base = current!;
        const next: Priority = {
          ...base,
          name: patch.name ?? base.name,
          metric: patch.metric !== undefined ? patch.metric : base.metric,
          baseline: patch.baseline !== undefined ? patch.baseline : base.baseline,
          now: patch.now !== undefined ? patch.now : base.now,
          target: patch.target !== undefined ? patch.target : base.target,
          by: patch.by !== undefined ? patch.by : base.by,
          constraints: patch.constraints !== undefined ? patch.constraints : base.constraints,
        };
        const fields = changedFields(base, next, ["name", "metric", "baseline", "now", "target", "by", "constraints"]);
        if (!fields.length) return { record: base, changed: false };
        const at = stamp();
        const saved = { ...next, revision: base.revision + 1, updatedAt: at };
        if (!store.updatePriority(saved, expectedRevision)) throw stale("priority", id, expectedRevision, store.priority(id)?.revision ?? expectedRevision);
        assessEdit("priority", id, saved.revision, fields, at);
        return { record: saved, changed: true };
      });
      if (result.changed) changed("priority", id);
      return result.record;
    },

    async listPriorities(input: unknown = {}): Promise<Priority[]> {
      parse(emptyInput, input);
      return store.priorities();
    },

    async showPriority(input: unknown): Promise<PriorityView> {
      const { id } = parse(showInput, input);
      const priority = store.priority(id);
      if (!priority) throw missing("priority", id);
      return { ...priority, objectives: await objectiveViews(store.objectivesFor(id), (objectiveId) => store.investmentsFor(objectiveId)) };
    },

    async addObjective(input: unknown): Promise<Objective> {
      const value = parse(objectiveAddInput, input);
      if (value.assigneeThreadId) await requireThread(value.assigneeThreadId);
      const at = stamp();
      const objective: Objective = {
        id: newId("objective"),
        priorityId: value.priorityId,
        name: value.name,
        approved: !value.proposed,
        assigneeThreadId: value.assigneeThreadId ?? null,
        research: null,
        rank: null,
        revision: 1,
        createdAt: at,
        updatedAt: at,
      };
      store.transaction(() => {
        if (!store.priority(value.priorityId)) throw missing("priority", value.priorityId);
        store.insertObjective(objective);
        maybeBuildPortfolio(objective, at);
      });
      changed("objective", objective.id);
      return objective;
    },

    async editObjective(input: unknown): Promise<Objective> {
      const value = parse(objectiveEditInput, input);
      const { id, expectedRevision } = value;
      const result = store.transaction(() => {
        const current = store.objective(id);
        checkRevision("objective", id, current, expectedRevision);
        const base = current!;
        if (value.priorityId !== undefined && !store.priority(value.priorityId)) throw missing("priority", value.priorityId);
        const next: Objective = { ...base, name: value.name ?? base.name, priorityId: value.priorityId ?? base.priorityId };
        const fields = changedFields(base, next, ["name", "priorityId"]);
        if (!fields.length) return { record: base, changed: false };
        const at = stamp();
        const saved = { ...next, revision: base.revision + 1, updatedAt: at };
        if (!store.updateObjective(saved, expectedRevision)) throw stale("objective", id, expectedRevision, store.objective(id)?.revision ?? expectedRevision);
        assessEdit("objective", id, saved.revision, fields, at);
        return { record: saved, changed: true };
      });
      if (result.changed) changed("objective", id);
      return result.record;
    },

    async approveObjective(input: unknown): Promise<Objective> {
      const { id, expectedRevision } = parse(objectiveApproveInput, input);
      const result = store.transaction(() => {
        const current = store.objective(id);
        checkRevision("objective", id, current, expectedRevision);
        const base = current!;
        if (base.approved) return { record: base, changed: false };
        const at = stamp();
        const saved: Objective = { ...base, approved: true, revision: base.revision + 1, updatedAt: at };
        if (!store.updateObjective(saved, expectedRevision)) throw stale("objective", id, expectedRevision, store.objective(id)?.revision ?? expectedRevision);
        maybeBuildPortfolio(saved, at);
        return { record: saved, changed: true };
      });
      if (result.changed) changed("objective", id);
      return result.record;
    },

    async assignObjective(input: unknown): Promise<Objective> {
      const { id, expectedRevision, assigneeThreadId } = parse(objectiveAssignInput, input);
      const current = store.objective(id);
      checkRevision("objective", id, current, expectedRevision);
      if (assigneeThreadId) await requireThread(assigneeThreadId);
      const result = store.transaction(() => {
        const latest = store.objective(id);
        checkRevision("objective", id, latest, expectedRevision);
        const base = latest!;
        if (base.assigneeThreadId === assigneeThreadId) return { record: base, changed: false };
        const at = stamp();
        const saved: Objective = { ...base, assigneeThreadId, revision: base.revision + 1, updatedAt: at };
        if (!store.updateObjective(saved, expectedRevision)) throw stale("objective", id, expectedRevision, store.objective(id)?.revision ?? expectedRevision);
        maybeBuildPortfolio(saved, at);
        return { record: saved, changed: true };
      });
      if (result.changed) changed("objective", id);
      return result.record;
    },

    async showObjective(input: unknown): Promise<ObjectiveView> {
      const { id } = parse(showInput, input);
      const objective = store.objective(id);
      if (!objective) throw missing("objective", id);
      const [view] = await objectiveViews([objective], (objectiveId) => store.investmentsFor(objectiveId));
      return view!;
    },

    async addInvestment(input: unknown): Promise<Investment> {
      const value = parse(investmentAddInput, input);
      const at = stamp();
      const investment: Investment = {
        id: newId("investment"),
        objectiveId: value.objectiveId,
        name: value.name,
        existing: value.existing ?? false,
        state: "not_started",
        brief: value.brief ?? {},
        lift: null,
        research: null,
        rank: null,
        revision: 1,
        createdAt: at,
        updatedAt: at,
      };
      store.transaction(() => {
        if (!store.objective(value.objectiveId)) throw missing("objective", value.objectiveId);
        store.insertInvestment(investment);
        trigger("refresh_portfolio", `refresh_portfolio:${investment.id}`, "investment", investment.id, 1, { objectiveId: investment.objectiveId }, at);
      });
      changed("investment", investment.id);
      return investment;
    },

    async editInvestment(input: unknown): Promise<Investment> {
      const value = parse(investmentEditInput, input);
      const { id, expectedRevision } = value;
      const result = store.transaction(() => {
        const current = store.investment(id);
        checkRevision("investment", id, current, expectedRevision);
        const base = current!;
        const brief: Brief = value.brief ? parse(briefSchema, applyPatch(base.brief, value.brief)) : base.brief;
        const next: Investment = { ...base, name: value.name ?? base.name, existing: value.existing ?? base.existing, brief };
        const fields = changedFields(base, next, ["name", "existing", "brief"]);
        if (!fields.length) return { record: base, changed: false };
        const at = stamp();
        const saved = { ...next, revision: base.revision + 1, updatedAt: at };
        if (!store.updateInvestment(saved, expectedRevision)) throw stale("investment", id, expectedRevision, store.investment(id)?.revision ?? expectedRevision);
        assessEdit("investment", id, saved.revision, fields, at);
        return { record: saved, changed: true };
      });
      if (result.changed) changed("investment", id);
      return result.record;
    },

    async showInvestment(input: unknown): Promise<Investment> {
      const { id } = parse(showInput, input);
      const investment = store.investment(id);
      if (!investment) throw missing("investment", id);
      return investment;
    },

    async overview(input: unknown = {}): Promise<Overview> {
      parse(emptyInput, input);
      const investments = new Map<string, Investment[]>();
      for (const investment of store.investments()) investments.set(investment.objectiveId, [...(investments.get(investment.objectiveId) ?? []), investment]);
      const views = await objectiveViews(store.objectives(), (objectiveId) => investments.get(objectiveId) ?? []);
      return {
        priorities: store.priorities().map((priority): PriorityView => ({ ...priority, objectives: views.filter((view) => view.priorityId === priority.id) })),
      };
    },

    async setOpenRecord(input: unknown): Promise<{ threadId: string; record: OpenRecord | null }> {
      const { threadId, record } = parse(openRecordInput, input);
      if (record) openInPanel.set(threadId, record);
      else openInPanel.delete(threadId);
      return { threadId, record };
    },

    openRecord(threadId: string): OpenRecord | null {
      return openInPanel.get(threadId) ?? null;
    },

    async listResearchRequests(input: unknown = {}): Promise<ResearchRequest[]> {
      const value = parse(researchListInput, input);
      return store.researchRequests({ status: value.status ?? null, kind: value.kind ?? null });
    },

    async claimResearchRequest(input: unknown): Promise<ResearchRequest> {
      const { id, claimedBy } = parse(researchClaimInput, input);
      return store.transaction(() => {
        const current = store.research(id);
        if (!current) throw new PlanError("not_found", `No research request ${id}.`);
        if (!store.claimResearch(id, claimedBy, stamp())) {
          throw new PlanError("already_claimed", `Research request ${id} was already claimed by ${current.claimedBy ?? "another agent"}.`);
        }
        return store.research(id)!;
      });
    },
  };
}
