import type Database from "better-sqlite3";
import { BRIEF_FIELDS, type BriefField, type MetricFormat } from "./model.js";
import type {
  Brief, Investment, InvestmentState, Lift, Objective, Priority, RecordKind, ResearchDetail, ResearchEvidence, ResearchKind, ResearchRequest, ResearchStatus,
} from "./model.js";

export type Db = Database.Database;
export type Migrate = (db: Db, statements: string[]) => void;

export const MIGRATIONS = [
  `CREATE TABLE plan_priorities (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    metric TEXT,
    baseline_value REAL,
    current_value REAL,
    target_value REAL,
    due_by TEXT,
    constraints TEXT,
    revision INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE plan_objectives (
    id TEXT PRIMARY KEY,
    priority_id TEXT NOT NULL REFERENCES plan_priorities (id),
    name TEXT NOT NULL,
    approved INTEGER NOT NULL,
    assignee_thread_id TEXT,
    revision INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  "CREATE INDEX plan_objectives_priority ON plan_objectives (priority_id)",
  `CREATE TABLE plan_investments (
    id TEXT PRIMARY KEY,
    objective_id TEXT NOT NULL REFERENCES plan_objectives (id),
    name TEXT NOT NULL,
    existing INTEGER NOT NULL,
    state TEXT NOT NULL CHECK (state IN ('not_started', 'in_progress', 'done')),
    brief TEXT NOT NULL,
    lift TEXT,
    revision INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  "CREATE INDEX plan_investments_objective ON plan_investments (objective_id)",
  `CREATE TABLE research_requests (
    id TEXT PRIMARY KEY,
    idempotency_key TEXT NOT NULL UNIQUE,
    kind TEXT NOT NULL,
    subject_kind TEXT NOT NULL,
    subject_id TEXT NOT NULL,
    subject_revision INTEGER NOT NULL,
    detail TEXT,
    status TEXT NOT NULL CHECK (status IN ('pending', 'claimed')),
    created_at TEXT NOT NULL,
    claimed_at TEXT,
    claimed_by TEXT
  )`,
  "CREATE INDEX research_requests_status ON research_requests (status, created_at)",
  "ALTER TABLE plan_objectives ADD COLUMN research TEXT",
  "ALTER TABLE plan_objectives ADD COLUMN rank INTEGER",
  "ALTER TABLE plan_investments ADD COLUMN research TEXT",
  "ALTER TABLE plan_investments ADD COLUMN rank INTEGER",
  `CREATE TABLE research_jobs (
    request_id TEXT PRIMARY KEY REFERENCES research_requests (id),
    phase TEXT NOT NULL CHECK (phase IN ('blocked', 'researching', 'reconciling', 'assessing', 'published', 'closed')),
    project_id TEXT,
    detail TEXT,
    updated_at TEXT NOT NULL
  )`,
  "CREATE INDEX research_jobs_phase ON research_jobs (phase)",
  `CREATE TABLE research_threads (
    request_id TEXT NOT NULL REFERENCES research_requests (id),
    role TEXT NOT NULL CHECK (role IN ('a', 'b', 'reconcile', 'assess')),
    project_id TEXT NOT NULL,
    title TEXT NOT NULL,
    thread_id TEXT,
    created_at TEXT NOT NULL,
    PRIMARY KEY (request_id, role)
  )`,
  `CREATE TABLE research_submissions (
    request_id TEXT NOT NULL REFERENCES research_requests (id),
    slot TEXT NOT NULL CHECK (slot IN ('a', 'b')),
    subject_revision INTEGER NOT NULL,
    thread_id TEXT,
    body TEXT NOT NULL,
    created_at TEXT NOT NULL,
    PRIMARY KEY (request_id, slot)
  )`,
  "CREATE TRIGGER research_submissions_immutable_update BEFORE UPDATE ON research_submissions BEGIN SELECT RAISE(ABORT, 'research submissions are immutable'); END",
  "CREATE TRIGGER research_submissions_immutable_delete BEFORE DELETE ON research_submissions BEGIN SELECT RAISE(ABORT, 'research submissions are immutable'); END",
  `CREATE TABLE research_reconciliations (
    request_id TEXT PRIMARY KEY REFERENCES research_requests (id),
    thread_id TEXT,
    body TEXT NOT NULL,
    created_at TEXT NOT NULL
  )`,
  "CREATE TRIGGER research_reconciliations_immutable_update BEFORE UPDATE ON research_reconciliations BEGIN SELECT RAISE(ABORT, 'research reconciliations are immutable'); END",
  "CREATE TRIGGER research_reconciliations_immutable_delete BEFORE DELETE ON research_reconciliations BEGIN SELECT RAISE(ABORT, 'research reconciliations are immutable'); END",
  `CREATE TABLE plan_starts (
    id TEXT PRIMARY KEY,
    investment_id TEXT NOT NULL REFERENCES plan_investments (id),
    assignee_thread_id TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('sending', 'uncertain', 'sent', 'failed', 'done')),
    message TEXT NOT NULL,
    error TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  "CREATE UNIQUE INDEX plan_starts_one_per_team ON plan_starts (assignee_thread_id) WHERE status IN ('sending', 'uncertain', 'sent')",
  "CREATE UNIQUE INDEX plan_starts_one_per_investment ON plan_starts (investment_id) WHERE status IN ('sending', 'uncertain', 'sent')",
  `CREATE TABLE plan_deliveries (
    investment_id TEXT PRIMARY KEY REFERENCES plan_investments (id),
    start_id TEXT NOT NULL REFERENCES plan_starts (id),
    thread_id TEXT NOT NULL,
    body TEXT NOT NULL,
    created_at TEXT NOT NULL
  )`,
  "ALTER TABLE plan_priorities ADD COLUMN metric_format TEXT NOT NULL DEFAULT 'number' CHECK (metric_format IN ('number', 'percent'))",
  "UPDATE plan_priorities SET metric_format = 'percent' WHERE instr(metric, '%') > 0 OR lower(metric) LIKE '%retention%'",
  "ALTER TABLE plan_priorities ADD COLUMN origin_thread_id TEXT",
  "ALTER TABLE plan_objectives ADD COLUMN origin_thread_id TEXT",
  "ALTER TABLE plan_investments ADD COLUMN brief_manual TEXT NOT NULL DEFAULT '[]'",
  "UPDATE plan_investments SET brief_manual = (SELECT json_group_array(key) FROM json_each(plan_investments.brief))",
  "ALTER TABLE research_jobs ADD COLUMN inputs TEXT",
  `CREATE TABLE research_holds (
    objective_id TEXT PRIMARY KEY REFERENCES plan_objectives (id),
    request_id TEXT NOT NULL REFERENCES research_requests (id),
    reason TEXT NOT NULL,
    created_at TEXT NOT NULL
  )`,
  "CREATE INDEX research_holds_request ON research_holds (request_id)",
];

interface PriorityRow {
  id: string;
  name: string;
  metric: string | null;
  baseline_value: number | null;
  current_value: number | null;
  target_value: number | null;
  due_by: string | null;
  constraints: string | null;
  metric_format: MetricFormat;
  origin_thread_id: string | null;
  revision: number;
  created_at: string;
  updated_at: string;
}

interface ObjectiveRow {
  id: string;
  priority_id: string;
  name: string;
  approved: number;
  assignee_thread_id: string | null;
  origin_thread_id: string | null;
  research: string | null;
  rank: number | null;
  revision: number;
  created_at: string;
  updated_at: string;
}

interface InvestmentRow {
  id: string;
  objective_id: string;
  name: string;
  existing: number;
  state: InvestmentState;
  brief: string;
  brief_manual: string;
  lift: string | null;
  research: string | null;
  rank: number | null;
  revision: number;
  created_at: string;
  updated_at: string;
}

interface ResearchRow {
  id: string;
  idempotency_key: string;
  kind: ResearchKind;
  subject_kind: RecordKind;
  subject_id: string;
  subject_revision: number;
  detail: string | null;
  status: ResearchStatus;
  created_at: string;
  claimed_at: string | null;
  claimed_by: string | null;
}

const toPriority = (row: PriorityRow): Priority => ({
  id: row.id,
  name: row.name,
  metric: row.metric,
  baseline: row.baseline_value,
  now: row.current_value,
  target: row.target_value,
  by: row.due_by,
  constraints: row.constraints,
  metricFormat: row.metric_format,
  originThreadId: row.origin_thread_id,
  revision: row.revision,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const toObjective = (row: ObjectiveRow): Objective => ({
  id: row.id,
  priorityId: row.priority_id,
  name: row.name,
  approved: row.approved === 1,
  assigneeThreadId: row.assignee_thread_id,
  originThreadId: row.origin_thread_id,
  research: row.research ? (JSON.parse(row.research) as ResearchEvidence) : null,
  rank: row.rank,
  revision: row.revision,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const toInvestment = (row: InvestmentRow): Investment => ({
  id: row.id,
  objectiveId: row.objective_id,
  name: row.name,
  existing: row.existing === 1,
  state: row.state,
  brief: JSON.parse(row.brief) as Brief,
  briefSetByHand: briefFields(JSON.parse(row.brief_manual) as unknown),
  lift: row.lift ? (JSON.parse(row.lift) as Lift) : null,
  research: row.research ? (JSON.parse(row.research) as ResearchEvidence) : null,
  rank: row.rank,
  revision: row.revision,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const briefFields = (value: unknown): BriefField[] => (Array.isArray(value) ? BRIEF_FIELDS.filter((field) => value.includes(field)) : []);

const toResearch = (row: ResearchRow): ResearchRequest => ({
  id: row.id,
  kind: row.kind,
  idempotencyKey: row.idempotency_key,
  subjectKind: row.subject_kind,
  subjectId: row.subject_id,
  subjectRevision: row.subject_revision,
  detail: row.detail ? (JSON.parse(row.detail) as ResearchDetail) : null,
  status: row.status,
  createdAt: row.created_at,
  claimedAt: row.claimed_at,
  claimedBy: row.claimed_by,
});

export type Store = ReturnType<typeof createStore>;

export function createStore(db: Db, migrate: Migrate) {
  migrate(db, MIGRATIONS);
  const priorityById = db.prepare("SELECT * FROM plan_priorities WHERE id = ?");
  const priorities = db.prepare("SELECT * FROM plan_priorities ORDER BY created_at, rowid");
  const insertPriority = db.prepare(`INSERT INTO plan_priorities (id, name, metric, baseline_value, current_value, target_value, due_by, constraints, metric_format, origin_thread_id, revision, created_at, updated_at)
    VALUES (@id, @name, @metric, @baseline, @now, @target, @by, @constraints, @metric_format, @origin_thread_id, @revision, @created_at, @updated_at)`);
  const updatePriority = db.prepare(`UPDATE plan_priorities SET name = @name, metric = @metric, baseline_value = @baseline, current_value = @now, target_value = @target,
    due_by = @by, constraints = @constraints, metric_format = @metric_format, revision = revision + 1, updated_at = @updated_at WHERE id = @id AND revision = @expected`);

  const objectiveById = db.prepare("SELECT * FROM plan_objectives WHERE id = ?");
  const objectivesByPriority = db.prepare("SELECT * FROM plan_objectives WHERE priority_id = ? ORDER BY created_at, rowid");
  const objectives = db.prepare("SELECT * FROM plan_objectives ORDER BY created_at, rowid");
  const insertObjective = db.prepare(`INSERT INTO plan_objectives (id, priority_id, name, approved, assignee_thread_id, origin_thread_id, research, rank, revision, created_at, updated_at)
    VALUES (@id, @priority_id, @name, @approved, @assignee_thread_id, @origin_thread_id, @research, @rank, @revision, @created_at, @updated_at)`);
  const updateObjective = db.prepare(`UPDATE plan_objectives SET priority_id = @priority_id, name = @name, approved = @approved,
    assignee_thread_id = @assignee_thread_id, revision = revision + 1, updated_at = @updated_at WHERE id = @id AND revision = @expected`);

  const investmentById = db.prepare("SELECT * FROM plan_investments WHERE id = ?");
  const investmentsByObjective = db.prepare("SELECT * FROM plan_investments WHERE objective_id = ? ORDER BY created_at, rowid");
  const investments = db.prepare("SELECT * FROM plan_investments ORDER BY created_at, rowid");
  const insertInvestment = db.prepare(`INSERT INTO plan_investments (id, objective_id, name, existing, state, brief, brief_manual, lift, research, rank, revision, created_at, updated_at)
    VALUES (@id, @objective_id, @name, @existing, @state, @brief, @brief_manual, @lift, @research, @rank, @revision, @created_at, @updated_at)`);
  const publishInvestment = db.prepare("UPDATE plan_investments SET lift = @lift, research = @research, brief = @brief, updated_at = @updated_at WHERE id = @id");
  const clearInvestment = db.prepare("UPDATE plan_investments SET lift = NULL, research = NULL, rank = NULL, updated_at = @updated_at WHERE id = @id");
  const setResearchOnly = db.prepare("UPDATE plan_investments SET research = @research WHERE id = @id");
  const setObjectiveResearch = db.prepare("UPDATE plan_objectives SET research = @research WHERE id = @id");
  const rankInvestment = db.prepare("UPDATE plan_investments SET rank = @rank WHERE id = @id");
  const rankObjective = db.prepare("UPDATE plan_objectives SET rank = @rank WHERE id = @id");
  const updateInvestment = db.prepare(`UPDATE plan_investments SET name = @name, existing = @existing, brief = @brief, brief_manual = @brief_manual,
    revision = revision + 1, updated_at = @updated_at WHERE id = @id AND revision = @expected`);

  const insertResearch = db.prepare(`INSERT INTO research_requests (id, idempotency_key, kind, subject_kind, subject_id, subject_revision, detail, status, created_at)
    VALUES (@id, @idempotency_key, @kind, @subject_kind, @subject_id, @subject_revision, @detail, 'pending', @created_at)
    ON CONFLICT (idempotency_key) DO NOTHING`);
  const researchById = db.prepare("SELECT * FROM research_requests WHERE id = ?");
  const researchList = db.prepare(`SELECT * FROM research_requests WHERE (@status IS NULL OR status = @status) AND (@kind IS NULL OR kind = @kind)
    ORDER BY created_at, rowid`);
  const claimResearch = db.prepare("UPDATE research_requests SET status = 'claimed', claimed_at = @at, claimed_by = @by WHERE id = @id AND status = 'pending'");
  const researchByKey = db.prepare("SELECT * FROM research_requests WHERE idempotency_key = ?");
  const setResearchDetail = db.prepare("UPDATE research_requests SET detail = @detail WHERE id = @id");
  const portfolioObjective = "COALESCE(json_extract(r.detail, '$.objectiveId'), CASE WHEN r.subject_kind = 'objective' THEN r.subject_id END)";
  const portfolioKinds = "r.kind IN ('build_portfolio', 'refresh_portfolio')";
  const pendingPortfolio = db.prepare(`SELECT r.* FROM research_requests r WHERE ${portfolioKinds} AND r.status = 'pending' AND ${portfolioObjective} = ?
    ORDER BY r.created_at, r.rowid`);
  const inFlightPortfolio = db.prepare(`SELECT r.* FROM research_requests r JOIN research_jobs j ON j.request_id = r.id
    WHERE ${portfolioKinds} AND j.phase IN ('researching', 'reconciling') AND ${portfolioObjective} = ? ORDER BY r.created_at, r.rowid`);
  const activePortfolio = db.prepare(`SELECT DISTINCT ${portfolioObjective} AS objective_id FROM research_requests r LEFT JOIN research_jobs j ON j.request_id = r.id
    WHERE ${portfolioKinds} AND (r.status = 'pending' OR j.phase IN ('researching', 'reconciling'))`);
  const blockedJobs = db.prepare(`SELECT r.subject_kind, r.subject_id, j.detail FROM research_requests r JOIN research_jobs j ON j.request_id = r.id
    WHERE r.status = 'pending' AND j.phase = 'blocked' AND j.detail = ?`);
  const upsertHold = db.prepare(`INSERT INTO research_holds (objective_id, request_id, reason, created_at) VALUES (@objective_id, @request_id, @reason, @at)
    ON CONFLICT (objective_id) DO UPDATE SET request_id = excluded.request_id, reason = excluded.reason`);
  const holdsByRequest = db.prepare("SELECT objective_id FROM research_holds WHERE request_id = ?");
  const releaseHolds = db.prepare("DELETE FROM research_holds WHERE request_id = ?");
  const holdFor = db.prepare("SELECT reason FROM research_holds WHERE objective_id = ?");
  const allHolds = db.prepare("SELECT objective_id, reason FROM research_holds");
  const pendingAssess = db.prepare(`SELECT r.* FROM research_requests r WHERE r.kind = 'assess_edit' AND r.status = 'pending' AND json_extract(r.detail, '$.group') = ?
    ORDER BY r.created_at, r.rowid`);

  return {
    transaction<T>(run: () => T): T {
      return db.transaction(run)();
    },
    priority(id: string): Priority | null {
      const row = priorityById.get(id) as PriorityRow | undefined;
      return row ? toPriority(row) : null;
    },
    priorities(): Priority[] {
      return (priorities.all() as PriorityRow[]).map(toPriority);
    },
    insertPriority(priority: Priority): void {
      insertPriority.run({
        id: priority.id, name: priority.name, metric: priority.metric, baseline: priority.baseline, now: priority.now, target: priority.target,
        by: priority.by, constraints: priority.constraints, metric_format: priority.metricFormat, origin_thread_id: priority.originThreadId,
        revision: priority.revision, created_at: priority.createdAt, updated_at: priority.updatedAt,
      });
    },
    updatePriority(priority: Priority, expected: number): boolean {
      return updatePriority.run({
        id: priority.id, name: priority.name, metric: priority.metric, baseline: priority.baseline, now: priority.now, target: priority.target,
        by: priority.by, constraints: priority.constraints, metric_format: priority.metricFormat, updated_at: priority.updatedAt, expected,
      }).changes === 1;
    },
    objective(id: string): Objective | null {
      const row = objectiveById.get(id) as ObjectiveRow | undefined;
      return row ? toObjective(row) : null;
    },
    objectivesFor(priorityId: string): Objective[] {
      return (objectivesByPriority.all(priorityId) as ObjectiveRow[]).map(toObjective);
    },
    objectives(): Objective[] {
      return (objectives.all() as ObjectiveRow[]).map(toObjective);
    },
    insertObjective(objective: Objective): void {
      insertObjective.run({
        id: objective.id, priority_id: objective.priorityId, name: objective.name, approved: objective.approved ? 1 : 0,
        assignee_thread_id: objective.assigneeThreadId, origin_thread_id: objective.originThreadId,
        research: objective.research ? JSON.stringify(objective.research) : null, rank: objective.rank,
        revision: objective.revision, created_at: objective.createdAt, updated_at: objective.updatedAt,
      });
    },
    updateObjective(objective: Objective, expected: number): boolean {
      return updateObjective.run({
        id: objective.id, priority_id: objective.priorityId, name: objective.name, approved: objective.approved ? 1 : 0,
        assignee_thread_id: objective.assigneeThreadId, updated_at: objective.updatedAt, expected,
      }).changes === 1;
    },
    investment(id: string): Investment | null {
      const row = investmentById.get(id) as InvestmentRow | undefined;
      return row ? toInvestment(row) : null;
    },
    investmentsFor(objectiveId: string): Investment[] {
      return (investmentsByObjective.all(objectiveId) as InvestmentRow[]).map(toInvestment);
    },
    investments(): Investment[] {
      return (investments.all() as InvestmentRow[]).map(toInvestment);
    },
    insertInvestment(investment: Investment): void {
      insertInvestment.run({
        id: investment.id, objective_id: investment.objectiveId, name: investment.name, existing: investment.existing ? 1 : 0, state: investment.state,
        brief: JSON.stringify(investment.brief), brief_manual: JSON.stringify(investment.briefSetByHand), lift: investment.lift ? JSON.stringify(investment.lift) : null,
        research: investment.research ? JSON.stringify(investment.research) : null, rank: investment.rank, revision: investment.revision,
        created_at: investment.createdAt, updated_at: investment.updatedAt,
      });
    },
    publishInvestmentResearch(id: string, lift: Lift | null, research: ResearchEvidence, brief: Brief, at: string): void {
      publishInvestment.run({ id, lift: lift ? JSON.stringify(lift) : null, research: JSON.stringify(research), brief: JSON.stringify(brief), updated_at: at });
    },
    clearInvestmentResearch(id: string, at: string): void {
      clearInvestment.run({ id, updated_at: at });
    },
    setInvestmentEvidence(id: string, research: ResearchEvidence | null): void {
      setResearchOnly.run({ id, research: research ? JSON.stringify(research) : null });
    },
    setObjectiveEvidence(id: string, research: ResearchEvidence | null): void {
      setObjectiveResearch.run({ id, research: research ? JSON.stringify(research) : null });
    },
    setInvestmentRank(id: string, rank: number | null): void {
      rankInvestment.run({ id, rank });
    },
    setObjectiveRank(id: string, rank: number | null): void {
      rankObjective.run({ id, rank });
    },
    updateInvestment(investment: Investment, expected: number): boolean {
      return updateInvestment.run({
        id: investment.id, name: investment.name, existing: investment.existing ? 1 : 0, brief: JSON.stringify(investment.brief),
        brief_manual: JSON.stringify(investment.briefSetByHand), updated_at: investment.updatedAt, expected,
      }).changes === 1;
    },
    insertResearch(request: Omit<ResearchRequest, "status" | "claimedAt" | "claimedBy">): boolean {
      return insertResearch.run({
        id: request.id, idempotency_key: request.idempotencyKey, kind: request.kind, subject_kind: request.subjectKind, subject_id: request.subjectId,
        subject_revision: request.subjectRevision, detail: request.detail ? JSON.stringify(request.detail) : null, created_at: request.createdAt,
      }).changes === 1;
    },
    research(id: string): ResearchRequest | null {
      const row = researchById.get(id) as ResearchRow | undefined;
      return row ? toResearch(row) : null;
    },
    researchRequests(filter: { status: ResearchStatus | null; kind: ResearchKind | null }): ResearchRequest[] {
      return (researchList.all(filter) as ResearchRow[]).map(toResearch);
    },
    claimResearch(id: string, by: string, at: string): boolean {
      return claimResearch.run({ id, by, at }).changes === 1;
    },
    researchByKey(key: string): ResearchRequest | null {
      const row = researchByKey.get(key) as ResearchRow | undefined;
      return row ? toResearch(row) : null;
    },
    setResearchDetail(id: string, detail: ResearchDetail): void {
      setResearchDetail.run({ id, detail: JSON.stringify(detail) });
    },
    pendingPortfolioFor(objectiveId: string): ResearchRequest[] {
      return (pendingPortfolio.all(objectiveId) as ResearchRow[]).map(toResearch);
    },
    inFlightPortfolioFor(objectiveId: string): ResearchRequest[] {
      return (inFlightPortfolio.all(objectiveId) as ResearchRow[]).map(toResearch);
    },
    activePortfolioObjectiveIds(): Set<string> {
      return new Set((activePortfolio.all() as Array<{ objective_id: string | null }>).map((row) => row.objective_id).filter((id): id is string => id !== null));
    },
    researchBlockedBy(detail: string): Set<string> {
      return new Set((blockedJobs.all(detail) as Array<{ subject_kind: RecordKind; subject_id: string }>).map((row) => `${row.subject_kind}:${row.subject_id}`));
    },
    holdObjective(objectiveId: string, requestId: string, reason: string, at: string): void {
      upsertHold.run({ objective_id: objectiveId, request_id: requestId, reason, at });
    },
    heldBy(requestId: string): string[] {
      return (holdsByRequest.all(requestId) as Array<{ objective_id: string }>).map((row) => row.objective_id);
    },
    releaseHolds(requestId: string): void {
      releaseHolds.run(requestId);
    },
    hold(objectiveId: string): string | null {
      return (holdFor.get(objectiveId) as { reason: string } | undefined)?.reason ?? null;
    },
    holds(): Map<string, string> {
      return new Map((allHolds.all() as Array<{ objective_id: string; reason: string }>).map((row) => [row.objective_id, row.reason]));
    },
    pendingAssessFor(group: string): ResearchRequest[] {
      return (pendingAssess.all(group) as ResearchRow[]).map(toResearch);
    },
  };
}
