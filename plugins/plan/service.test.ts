import Database from "better-sqlite3";
import { describe, expect, it } from "vitest";
import { createPlanService, PlanError, type ThreadInfo } from "./service.js";
import { MIGRATIONS, type Migrate } from "./store.js";

const migrate: Migrate = (db, statements) => {
  db.exec("CREATE TABLE IF NOT EXISTS test_migrations (id INTEGER PRIMARY KEY)");
  statements.forEach((statement, id) => {
    if (db.prepare("SELECT 1 FROM test_migrations WHERE id = ?").get(id)) return;
    db.exec(statement);
    db.prepare("INSERT INTO test_migrations (id) VALUES (?)").run(id);
  });
};

const THREADS: Record<string, ThreadInfo> = {
  thr_growthconv: { id: "thr_growthconv", name: "Growth / Conversion", parentThreadId: null },
  thr_paidacq: { id: "thr_paidacq", name: "Growth / Paid acquisition", parentThreadId: null },
};

function setup() {
  const db = new Database(":memory:");
  const published: Array<{ kind: string; id: string }> = [];
  const lookups: string[] = [];
  const threads = { ...THREADS };
  const service = createPlanService({
    db,
    migrate,
    findThread: async (threadId) => { lookups.push(threadId); return threads[threadId] ?? null; },
    publish: (change) => published.push(change),
    now: () => new Date("2026-10-27T12:00:00Z"),
  });
  const requests = async (kind?: "discover_objectives" | "build_portfolio" | "refresh_portfolio" | "assess_edit") =>
    service.listResearchRequests(kind ? { kind } : {});
  return { db, service, published, lookups, threads, requests };
}

async function rejects(run: Promise<unknown>, code: string) {
  const error = await run.then(() => null, (caught: unknown) => caught);
  expect(error).toBeInstanceOf(PlanError);
  expect((error as PlanError).code).toBe(code);
  return error as PlanError;
}

async function seed(service: ReturnType<typeof setup>["service"], options: { proposed?: boolean } = {}) {
  const priority = await service.addPriority({ name: "Grow weekly active users", metric: "weekly active users", baseline: 1200, now: 1450, target: 2000, by: "2027-01-31" });
  const objective = await service.addObjective({ priorityId: priority.id, name: "Lift download → week-1 activation", ...(options.proposed ? { proposed: true } : {}) });
  return { priority, objective };
}

describe("records", () => {
  it("saves records with fields missing and fills explicit nulls once", async () => {
    const { service } = setup();
    const priority = await service.addPriority({ name: "Keep teams using bb weekly" });
    expect(priority).toMatchObject({ metric: null, baseline: null, now: null, target: null, by: null, constraints: null, revision: 1 });
    const objective = await service.addObjective({ priorityId: priority.id, name: "Reduce week-4 drop-off" });
    expect(objective).toMatchObject({ approved: true, assigneeThreadId: null, revision: 1 });
    const investment = await service.addInvestment({ objectiveId: objective.id, name: "Day-2 email nudge" });
    expect(investment).toMatchObject({ existing: false, state: "not_started", brief: {}, lift: null, revision: 1 });
    const overview = await service.overview();
    expect(overview.priorities[0]?.objectives[0]?.investments.map((entry) => entry.id)).toEqual([investment.id]);
  });

  it("rejects links to records that don't exist", async () => {
    const { service } = setup();
    await rejects(service.addObjective({ priorityId: "pri_missing", name: "Orphan" }), "not_found");
    await rejects(service.addInvestment({ objectiveId: "obj_missing", name: "Orphan" }), "not_found");
    const { objective } = await seed(service);
    await rejects(service.editObjective({ id: objective.id, expectedRevision: 1, priorityId: "pri_missing" }), "not_found");
  });
});

describe("optimistic concurrency", () => {
  it("rejects a stale revision and leaves the newer edit in place", async () => {
    const { service, requests } = setup();
    const { priority, objective } = await seed(service);
    const mine = await service.editPriority({ id: priority.id, expectedRevision: 1, target: 2200 });
    expect(mine.revision).toBe(2);
    const error = await rejects(service.editPriority({ id: priority.id, expectedRevision: 1, target: 1800 }), "stale_revision");
    expect(error.message).toContain("revision 2");
    expect((await service.showPriority({ id: priority.id })).target).toBe(2200);
    expect(await requests("assess_edit")).toEqual([]);
    expect((await requests("refresh_portfolio")).map((request) => request.detail?.reasons)).toEqual([["Company priority target changed"]]);

    await service.editObjective({ id: objective.id, expectedRevision: 1, name: "Activation" });
    await rejects(service.approveObjective({ id: objective.id, expectedRevision: 1 }), "stale_revision");
    await rejects(service.assignObjective({ id: objective.id, expectedRevision: 1, assigneeThreadId: "thr_growthconv" }), "stale_revision");
    expect((await service.showObjective({ id: objective.id })).assigneeThreadId).toBeNull();

    const investment = await service.addInvestment({ objectiveId: objective.id, name: "Checklist" });
    await service.editInvestment({ id: investment.id, expectedRevision: 1, brief: { deliverable: "A checklist" } });
    await rejects(service.editInvestment({ id: investment.id, expectedRevision: 1, name: "Other" }), "stale_revision");
    expect((await service.showInvestment({ id: investment.id })).name).toBe("Checklist");
  });

  it("requires expectedRevision on every update", async () => {
    const { service } = setup();
    const { priority, objective } = await seed(service);
    await rejects(service.editPriority({ id: priority.id, name: "x" }), "invalid");
    await rejects(service.approveObjective({ id: objective.id }), "invalid");
    await rejects(service.assignObjective({ id: objective.id, assigneeThreadId: "thr_growthconv" }), "invalid");
  });
});

describe("research triggers", () => {
  it("creates one build_portfolio when an objective is approved, then assigned", async () => {
    const { service, requests } = setup();
    const { objective } = await seed(service, { proposed: true });
    expect(objective.approved).toBe(false);
    const assigned = await service.assignObjective({ id: objective.id, expectedRevision: 1, assigneeThreadId: "thr_growthconv" });
    expect(await requests("build_portfolio")).toEqual([]);
    await service.approveObjective({ id: objective.id, expectedRevision: assigned.revision });
    expect((await requests("build_portfolio")).map((request) => request.subjectId)).toEqual([objective.id]);
  });

  it("creates one build_portfolio when an objective is assigned, then approved", async () => {
    const { service, requests } = setup();
    const { objective } = await seed(service, { proposed: true });
    const approved = await service.approveObjective({ id: objective.id, expectedRevision: 1 });
    expect(await requests("build_portfolio")).toEqual([]);
    const assigned = await service.assignObjective({ id: objective.id, expectedRevision: approved.revision, assigneeThreadId: "thr_growthconv" });
    expect((await requests("build_portfolio")).length).toBe(1);

    const reassigned = await service.assignObjective({ id: objective.id, expectedRevision: assigned.revision, assigneeThreadId: "thr_paidacq" });
    const unassigned = await service.assignObjective({ id: objective.id, expectedRevision: reassigned.revision, assigneeThreadId: null });
    await service.assignObjective({ id: objective.id, expectedRevision: unassigned.revision, assigneeThreadId: "thr_growthconv" });
    expect((await requests("build_portfolio")).length).toBe(1);
  });

  it("starts research immediately for a user-added objective created with its team", async () => {
    const { service, requests } = setup();
    const { priority } = await seed(service);
    await service.addObjective({ priorityId: priority.id, name: "Find an efficient paid channel", assigneeThreadId: "thr_paidacq" });
    expect((await requests("build_portfolio")).length).toBe(1);
  });

  it("creates each trigger exactly once", async () => {
    const { service, requests } = setup();
    const { priority, objective } = await seed(service);
    expect((await requests("discover_objectives")).map((request) => request.subjectId)).toEqual([priority.id]);

    const approvedAgain = await service.approveObjective({ id: objective.id, expectedRevision: 1 });
    expect(approvedAgain.revision).toBe(1);

    const investment = await service.addInvestment({ objectiveId: objective.id, name: "Install-page copy test", existing: true });
    expect((await requests("refresh_portfolio"))).toMatchObject([{ subjectKind: "objective", subjectId: objective.id, detail: { objectiveId: objective.id, investmentIds: [investment.id] } }]);

    const unchanged = await service.editInvestment({ id: investment.id, expectedRevision: 1, name: "Install-page copy test" });
    expect(unchanged.revision).toBe(1);
    expect(await requests("assess_edit")).toEqual([]);

    const renamed = await service.editInvestment({ id: investment.id, expectedRevision: 1, name: "Install-page test" });
    await service.editInvestment({ id: investment.id, expectedRevision: renamed.revision, brief: { scope: "Copy only" } });
    expect((await requests("assess_edit")).map((request) => request.detail)).toEqual([{
      group: `objective:${objective.id}`, lastEditAt: "2026-10-27T12:00:00.000Z",
      records: [{ kind: "investment", id: investment.id, revision: 2, fields: ["name"] }],
    }]);
    expect((await requests("refresh_portfolio"))[0]!.detail?.reasons).toEqual(["Install-page test: brief.scope changed"]);

    expect((await requests()).length).toBe(3);
  });

  it("does not create assess_edit for assignment or approval", async () => {
    const { service, requests } = setup();
    const { objective } = await seed(service, { proposed: true });
    const approved = await service.approveObjective({ id: objective.id, expectedRevision: 1 });
    await service.assignObjective({ id: objective.id, expectedRevision: approved.revision, assigneeThreadId: "thr_growthconv" });
    expect(await requests("assess_edit")).toEqual([]);
  });

  it("lets exactly one claimant take a request", async () => {
    const { service } = setup();
    await seed(service);
    const [request] = await service.listResearchRequests({ status: "pending" });
    const claimed = await service.claimResearchRequest({ id: request!.id, claimedBy: "thr_researcher1" });
    expect(claimed).toMatchObject({ status: "claimed", claimedBy: "thr_researcher1" });
    await rejects(service.claimResearchRequest({ id: request!.id, claimedBy: "thr_researcher2" }), "already_claimed");
    expect(await service.listResearchRequests({ status: "pending" })).toEqual([]);
  });
});

describe("material edits", () => {
  const checked = (db: Database.Database, id: string, rank: number) => db.prepare("UPDATE plan_investments SET lift = ?, rank = ?, research = ? WHERE id = ?").run(
    JSON.stringify({ low: 1, base: rank * 10, high: 99, unit: "users", method: "Forecast", cost: "1 week", dependencies: "None", sources: [] }), rank,
    JSON.stringify({ requestId: "rr_1", submissionThreadIds: [], reconciliationThreadId: null, basis: null, lift: null, missing: null, funnelSteps: null, rationale: null, ownerProposal: null, metricLink: null, cost: null, dependencies: null }),
    id,
  );

  it("clears the edited investment's lift and rank at once, renumbers the rest, and queues fresh research; a rename keeps the evidence", async () => {
    const { db, service, requests } = setup();
    const { objective } = await seed(service);
    const first = await service.addInvestment({ objectiveId: objective.id, name: "Checklist" });
    const second = await service.addInvestment({ objectiveId: objective.id, name: "Email" });
    const third = await service.addInvestment({ objectiveId: objective.id, name: "Gallery" });
    [first, second, third].forEach((entry, index) => checked(db, entry.id, index + 1));
    db.prepare("UPDATE research_requests SET status = 'claimed'").run();

    const renamed = await service.editInvestment({ id: first.id, expectedRevision: 1, name: "Checklist v2" });
    expect(renamed).toMatchObject({ rank: 1, lift: { base: 10 } });
    expect(await requests("refresh_portfolio")).toMatchObject([{ status: "claimed" }]);

    const scoped = await service.editInvestment({ id: first.id, expectedRevision: 2, brief: { scope: "Only teams" } });
    expect(scoped).toMatchObject({ rank: null, lift: null, research: null, briefSetByHand: ["scope"] });
    const portfolio = (await service.showObjective({ id: objective.id })).investments;
    expect(portfolio.map((entry) => [entry.name, entry.rank])).toEqual([["Checklist v2", null], ["Email", 1], ["Gallery", 2]]);
    const pending = (await requests("refresh_portfolio")).filter((request) => request.status === "pending");
    expect(pending).toMatchObject([{ detail: { investmentIds: [first.id], reasons: ["Checklist v2: brief.scope changed"] } }]);
  });

  it("clears every portfolio under a priority when its target changes", async () => {
    const { db, service } = setup();
    const { priority, objective } = await seed(service);
    const other = await service.addObjective({ priorityId: priority.id, name: "Paid", assigneeThreadId: "thr_paidacq" });
    const a = await service.addInvestment({ objectiveId: objective.id, name: "A" });
    const b = await service.addInvestment({ objectiveId: other.id, name: "B" });
    checked(db, a.id, 1);
    checked(db, b.id, 1);
    await service.editPriority({ id: priority.id, expectedRevision: 1, now: 1500 });
    expect((await service.showInvestment({ id: a.id })).rank).toBe(1);
    await service.editPriority({ id: priority.id, expectedRevision: 2, target: 2400 });
    expect([(await service.showInvestment({ id: a.id })).rank, (await service.showInvestment({ id: b.id })).lift]).toEqual([null, null]);
  });

  it("tracks which brief fields were set by hand", async () => {
    const { service } = setup();
    const { objective } = await seed(service);
    const added = await service.addInvestment({ objectiveId: objective.id, name: "A", brief: { deliverable: "Thing", sources: ["https://x.example"] } });
    expect(added.briefSetByHand).toEqual(["deliverable", "sources"]);
    const edited = await service.editInvestment({ id: added.id, expectedRevision: 1, brief: { sources: null, measurement: "WAU" } });
    expect(edited.briefSetByHand).toEqual(["deliverable", "measurement"]);
  });
});

describe("upgrading an existing database", () => {
  it("marks existing brief fields as set by hand and infers a percent format for existing priorities", async () => {
    const db = new Database(":memory:");
    const previous = MIGRATIONS.slice(0, MIGRATIONS.indexOf("ALTER TABLE plan_priorities ADD COLUMN metric_format TEXT NOT NULL DEFAULT 'number' CHECK (metric_format IN ('number', 'percent'))"));
    expect(previous.length).toBeGreaterThan(10);
    migrate(db, previous);
    db.prepare("INSERT INTO plan_priorities (id, name, metric, revision, created_at, updated_at) VALUES ('pri_old', 'Keep teams', '4-week retention', 1, 'x', 'x')").run();
    db.prepare("INSERT INTO plan_objectives (id, priority_id, name, approved, revision, created_at, updated_at) VALUES ('obj_old', 'pri_old', 'Reduce drop-off', 1, 1, 'x', 'x')").run();
    db.prepare(`INSERT INTO plan_investments (id, objective_id, name, existing, state, brief, revision, created_at, updated_at)
      VALUES ('inv_old', 'obj_old', 'Email', 0, 'not_started', '{"deliverable":"A","sources":["https://x.example"]}', 1, 'x', 'x')`).run();
    const service = createPlanService({ db, migrate, findThread: async () => null, publish: () => {}, now: () => new Date("2026-10-27T12:00:00Z") });
    expect(await service.showInvestment({ id: "inv_old" })).toMatchObject({ briefSetByHand: ["deliverable", "sources"] });
    expect((await service.showPriority({ id: "pri_old" })).metricFormat).toBe("percent");
  });
});

describe("protected fields", () => {
  it("rejects lift and state through edit", async () => {
    const { service } = setup();
    const { objective } = await seed(service);
    const investment = await service.addInvestment({ objectiveId: objective.id, name: "Checklist" });
    const lift = { low: 1, base: 2, high: 3, unit: "users", method: "Forecast", cost: "1 week", dependencies: "None", sources: [] };
    await rejects(service.editInvestment({ id: investment.id, expectedRevision: 1, lift }), "invalid");
    await rejects(service.editInvestment({ id: investment.id, expectedRevision: 1, state: "in_progress" }), "invalid");
    await rejects(service.addInvestment({ objectiveId: objective.id, name: "Other", state: "done" }), "invalid");
    await rejects(service.addInvestment({ objectiveId: objective.id, name: "Other", lift }), "invalid");
    expect(await service.showInvestment({ id: investment.id })).toMatchObject({ state: "not_started", lift: null, revision: 1 });
  });
});

describe("assignment", () => {
  it("rejects unknown thread IDs and typed names, and never writes them", async () => {
    const { service, lookups } = setup();
    const { objective } = await seed(service);
    await rejects(service.assignObjective({ id: objective.id, expectedRevision: 1, assigneeThreadId: "thr_doesnotexist" }), "unknown_thread");
    await rejects(service.assignObjective({ id: objective.id, expectedRevision: 1, assigneeThreadId: "Growth / Conversion" }), "invalid");
    await rejects(service.addObjective({ priorityId: objective.priorityId, name: "x", assigneeThreadId: "thr_doesnotexist" }), "unknown_thread");
    expect(lookups).toEqual(["thr_doesnotexist", "thr_doesnotexist"]);
    expect((await service.showObjective({ id: objective.id })).assigneeThreadId).toBeNull();
  });

  it("reads the assignee's name live from the thread", async () => {
    const { service, threads } = setup();
    const { objective } = await seed(service);
    await service.assignObjective({ id: objective.id, expectedRevision: 1, assigneeThreadId: "thr_growthconv" });
    expect((await service.showObjective({ id: objective.id })).assignee).toEqual({ threadId: "thr_growthconv", name: "Growth / Conversion", available: true, parent: null });
    threads.thr_growthconv = { id: "thr_growthconv", name: "Growth / Activation", parentThreadId: null };
    expect((await service.showObjective({ id: objective.id })).assignee?.name).toBe("Growth / Activation");
    delete threads.thr_growthconv;
    expect((await service.overview()).priorities[0]?.objectives[0]?.assignee).toEqual({ threadId: "thr_growthconv", name: null, available: false, parent: null });
  });
});
