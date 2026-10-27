import Database from "better-sqlite3";
import { describe, expect, it } from "vitest";
import { createPlanService, PlanError, type ThreadInfo } from "./service.js";
import type { Migrate } from "./store.js";

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
    expect((await requests("assess_edit")).length).toBe(1);

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
      records: [{ kind: "investment", id: investment.id, revision: 3, fields: ["name", "brief"] }],
    }]);

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
