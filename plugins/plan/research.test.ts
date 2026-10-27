import Database from "better-sqlite3";
import { createFakePluginHost, makeThreadResponse } from "@get-bb/plugin-sdk/testing";
import { afterEach, describe, expect, it } from "vitest";
import { NO_PROJECT_SHORT } from "./model.js";
import { ASSESS_QUIET_MS, createResearchService, liftDifferences, NO_PROJECT, rankByLift, traceIssues, type ResearchHost, type SpawnRequest } from "./research.js";
import plugin from "./server.js";
import { createPlanService, PlanError, type ThreadInfo } from "./service.js";
import { createStartService, type StartHost } from "./start.js";
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

interface FakeOptions { projectId?: string | null; concurrency?: number; threadProjects?: Record<string, string> }

function fakeHost(options: FakeOptions = {}) {
  const spawned: Array<SpawnRequest & { id: string }> = [];
  const state = { projectId: options.projectId ?? null, concurrency: options.concurrency ?? 2, failNextSpawnAfterCreate: false };
  const host: ResearchHost = {
    settings: async () => ({ projectId: state.projectId, concurrency: state.concurrency }),
    threadProject: async (threadId) => (options.threadProjects ?? { thr_growthconv: "prj_growth" })[threadId] ?? null,
    spawnThread: async (request) => {
      const id = `thr_research${spawned.length + 1}`;
      spawned.push({ ...request, id });
      if (state.failNextSpawnAfterCreate) {
        state.failNextSpawnAfterCreate = false;
        throw new Error("connection reset");
      }
      return id;
    },
    findSpawnedThread: async ({ projectId, title }) => spawned.find((entry) => entry.projectId === projectId && entry.title === title)?.id ?? null,
    log: () => {},
  };
  return { host, spawned, state };
}

function setup(options: FakeOptions = {}) {
  const db = new Database(":memory:");
  const fake = fakeHost(options);
  const findThread = async (threadId: string) => THREADS[threadId] ?? null;
  const clock = { at: Date.parse("2026-10-27T12:00:00Z") };
  const now = () => new Date(clock.at);
  const advance = (ms: number) => { clock.at += ms; };
  const plan = createPlanService({ db, migrate, findThread, publish: () => {}, now });
  const make = () => createResearchService({ db, migrate, host: fake.host, findThread, publish: () => {}, now });
  return { db, plan, research: make(), restart: make, advance, ...fake };
}

async function rejects(run: Promise<unknown>, code: string) {
  const error = await run.then(() => null, (caught: unknown) => caught);
  expect(error).toBeInstanceOf(PlanError);
  expect((error as PlanError).code).toBe(code);
  return error as PlanError;
}

const PERIOD = "week ending 2026-12-06";
const UNIT = "weekly active users";
const m = (value: number, unit = UNIT, period = PERIOD) => ({ value, unit, period, sources: ["https://analytics.example/wau"] });
function lift(baseline: number, low: number, base: number, high: number, overrides: Record<string, unknown> = {}) {
  return {
    method: "observational",
    methodNote: "Cohort comparison of users who saw the checklist",
    population: "New signups",
    unit: UNIT,
    period: PERIOD,
    baseline: m(baseline),
    withChange: { low: m(baseline + low), base: m(baseline + base), high: m(baseline + high) },
    lift: { low, base, high },
    ...overrides,
  };
}
const investment = (key: string, name: string, extra: Record<string, unknown> = {}) => ({
  key, name, existing: false, cost: "2 weeks", dependencies: "None", deliverable: `${name} shipped`, scope: `${name} only`,
  acceptanceCriteria: `${name} is live for new signups`, measurement: "Shared WAU", sources: ["https://notes.example/plan"], ...extra,
});
const coverage = { searched: "Onboarding funnel, support tickets, Oct 2026", excluded: [], sources: ["https://notes.example/search"] };

async function portfolioSetup(options: FakeOptions = {}) {
  const context = setup(options);
  const priority = await context.plan.addPriority({ name: "Grow weekly active users", metric: UNIT, now: 1450, target: 2000 });
  const objective = await context.plan.addObjective({ priorityId: priority.id, name: "Lift activation", assigneeThreadId: "thr_growthconv" });
  const existing = await context.plan.addInvestment({ objectiveId: objective.id, name: "Onboarding checklist", existing: true });
  const requests = await context.plan.listResearchRequests({});
  const build = requests.find((request) => request.kind === "build_portfolio")!;
  return { ...context, priority, objective, existing, build, requests };
}

const threadFor = (spawned: Array<SpawnRequest & { id: string }>, requestId: string, role: string) =>
  spawned.find((entry) => entry.metadata.researchRequestId === requestId && entry.metadata.role === role)!.id;

describe("research runner", () => {
  it("creates exactly two research threads per request, and none more on retries, restarts or a lost spawn reply", async () => {
    const { research, restart, build, spawned, state } = await portfolioSetup({ concurrency: 5 });
    state.failNextSpawnAfterCreate = true;
    await research.tick();
    await research.tick();
    await research.tick();
    await restart().tick();
    const forBuild = spawned.filter((entry) => entry.metadata.researchRequestId === build.id);
    expect(forBuild.map((entry) => entry.metadata.role).sort()).toEqual(["a", "b"]);
    expect(forBuild.every((entry) => entry.projectId === "prj_growth")).toBe(true);
    expect(forBuild[0]!.prompt).toContain(`--slot ${forBuild[0]!.metadata.role}`);
    expect(forBuild[0]!.prompt).toContain("Do not look for, read or ask about its work, do not message any other thread");
    const shown = await research.show({ requestId: build.id });
    expect(shown.phase).toBe("researching");
    expect(shown.threads.map((entry) => entry.threadId).every(Boolean)).toBe(true);
  });

  it("respects the concurrency cap and starts the next request when one finishes", async () => {
    const context = setup({ concurrency: 2 });
    const priority = await context.plan.addPriority({ name: "First" });
    await context.plan.addPriority({ name: "Second" });
    await context.plan.addPriority({ name: "Third" });
    await context.plan.addObjective({ priorityId: priority.id, name: "Assigned", proposed: true, assigneeThreadId: "thr_growthconv" });
    await context.research.tick();
    await context.research.tick();
    const started = new Set(context.spawned.map((entry) => entry.metadata.researchRequestId));
    expect(started.size).toBe(2);
    expect(context.spawned).toHaveLength(4);
    const discover = (await context.research.list({ kind: "discover_objectives" }));
    expect(discover.map((entry) => entry.phase)).toEqual(["researching", "researching", null]);

    const first = discover[0]!.request;
    for (const slot of ["a", "b"] as const) {
      await context.research.submit({ requestId: first.id, slot, submission: { candidates: [{
        key: "act", name: "Lift activation", rationale: "Activation gates WAU", metricLink: { claim: "Activated users are WAU", sources: ["https://analytics.example/def"] },
        owner: { proposal: "Growth / Conversion" }, lift: lift(1450, 20, 40, 70),
      }], limitations: "One quarter of data" } }, threadFor(context.spawned, first.id, slot));
    }
    await context.research.tick();
    expect(context.spawned.filter((entry) => entry.metadata.role === "reconcile")).toHaveLength(1);
    expect(new Set(context.spawned.map((entry) => entry.metadata.researchRequestId)).size).toBe(2);
    await context.research.reconcile({ requestId: first.id, reconciliation: { candidates: [{
      key: "act", name: "Lift activation", rationale: "Activation gates WAU", metricLink: { claim: "Activated users are WAU", sources: ["https://analytics.example/def"] },
      owner: { proposal: "Growth / Conversion" }, lift: lift(1450, 20, 40, 70), from: [{ slot: "a", key: "act" }, { slot: "b", key: "act" }], liftFrom: { slot: "a", key: "act" },
    }], disagreements: [], excluded: [], limitations: "One quarter of data" } }, threadFor(context.spawned, first.id, "reconcile"));
    await context.research.tick();
    expect(new Set(context.spawned.map((entry) => entry.metadata.researchRequestId)).size).toBe(3);
  });

  it("reports a clear blocked status when no research project can be found, and starts once one is set", async () => {
    const context = setup({ threadProjects: {} });
    const priority = await context.plan.addPriority({ name: "Grow weekly active users" });
    await context.research.tick();
    const [blocked] = await context.research.list({});
    expect(blocked).toMatchObject({ phase: "blocked", detail: NO_PROJECT, request: { id: expect.any(String), status: "pending", subjectId: priority.id } });
    expect(context.spawned).toHaveLength(0);
    context.state.projectId = "prj_research";
    await context.research.tick();
    expect(context.spawned.map((entry) => entry.projectId)).toEqual(["prj_research", "prj_research"]);
  });

  it("holds portfolio research until the objective is approved and assigned", async () => {
    const context = setup({ projectId: "prj_research" });
    const priority = await context.plan.addPriority({ name: "Grow weekly active users" });
    const objective = await context.plan.addObjective({ priorityId: priority.id, name: "Proposed one", proposed: true });
    await context.plan.addInvestment({ objectiveId: objective.id, name: "Day-2 email" });
    await context.research.tick();
    const [refresh] = await context.research.list({ kind: "refresh_portfolio" });
    expect(refresh).toMatchObject({ phase: "blocked", detail: "Waiting for the objective to be approved." });
  });
});

describe("submissions", () => {
  it("never publishes from one submission and keeps it hidden until both are saved", async () => {
    const { research, plan, build, spawned, existing, objective } = await portfolioSetup();
    await research.tick();
    const result = await research.submit({ requestId: build.id, slot: "a", submission: {
      coverage, investments: [investment("check", "Onboarding checklist", { investmentId: existing.id, existing: true, lift: lift(1450, 20, 40, 70) })], limitations: "None",
    } }, threadFor(spawned, build.id, "a"));
    expect(result.next).toContain("Nothing publishes from one submission");
    await research.tick();
    const shown = await research.show({ requestId: build.id });
    expect(shown.phase).toBe("researching");
    expect(shown.submissions).toEqual([expect.objectContaining({ slot: "a", body: null })]);
    expect(spawned.some((entry) => entry.metadata.role === "reconcile")).toBe(false);
    expect((await plan.showObjective({ id: objective.id })).investments[0]).toMatchObject({ lift: null, rank: null });
    await rejects(research.reconcile({ requestId: build.id, reconciliation: {} }, null), "wrong_phase");
    await rejects(research.submit({ requestId: build.id, slot: "a", submission: { coverage, investments: [], limitations: "x" } }, threadFor(spawned, build.id, "a")), "already_submitted");
  });

  it("rejects submissions without a caller thread, so one caller can't fill both independent slots", async () => {
    const { research, build, spawned, existing } = await portfolioSetup();
    await research.tick();
    const valid = { coverage, investments: [investment("check", "Onboarding checklist", { investmentId: existing.id, existing: true, lift: lift(1450, 20, 40, 70) })], limitations: "None" };
    await rejects(research.submit({ requestId: build.id, slot: "a", submission: valid }, null), "not_your_slot");
    await rejects(research.submit({ requestId: build.id, slot: "b", submission: valid }, null), "not_your_slot");
    await research.submit({ requestId: build.id, slot: "a", submission: valid }, threadFor(spawned, build.id, "a"));
    await rejects(research.submit({ requestId: build.id, slot: "b", submission: valid }, threadFor(spawned, build.id, "a")), "not_your_slot");
    expect((await research.show({ requestId: build.id })).submissions.map((entry) => entry.slot)).toEqual(["a"]);
  });

  it("rejects a submission from another thread, then bad arithmetic, mismatched units, missing sources, a broken funnel and left-out existing activity", async () => {
    const { research, build, spawned, existing } = await portfolioSetup();
    await research.tick();
    const threadA = threadFor(spawned, build.id, "a");
    const valid = { coverage, investments: [investment("check", "Onboarding checklist", { investmentId: existing.id, existing: true, lift: lift(1450, 20, 40, 70) })], limitations: "None" };
    await rejects(research.submit({ requestId: build.id, slot: "a", submission: valid }, threadFor(spawned, build.id, "b")), "not_your_slot");

    const wrongMath = lift(1450, 20, 40, 70);
    wrongMath.lift = { low: 20, base: 45, high: 70 };
    const wrongUnit = lift(1450, 20, 40, 70);
    wrongUnit.withChange.high = m(1520, "installs");
    const noSource = lift(1450, 20, 40, 70);
    noSource.baseline = { ...m(1450), sources: [] };
    const funnel = lift(1450, 20, 40, 70, { funnelSteps: [
      { step: "Downloads", value: 800, unit: "installs", sources: ["https://store.example"] },
      { step: "Week-1 active", value: 40, unit: UNIT, sources: ["https://analytics.example"] },
    ] });
    const math = await rejects(research.submit({ requestId: build.id, slot: "a", submission: {
      coverage, investments: [
        investment("math", "Bad math", { lift: wrongMath }),
        investment("unit", "Bad unit", { lift: wrongUnit }),
        investment("funnel", "Broken funnel", { lift: funnel }),
      ], limitations: "None",
    } }, threadA), "rejected");
    expect(math.message).toContain('investments[0] ("Bad math").lift.lift.base is 45, but lift = with the change − baseline = 1490 − 1450 = 40');
    expect(math.message).toContain('investments[1] ("Bad unit").lift.withChange.high is in "installs" but the estimate\'s unit is "weekly active users"');
    expect(math.message).toContain('investments[2] ("Broken funnel").lift.funnelSteps[0] ("Downloads") has no supported link to the next step');
    expect(math.message).toContain(`Existing activity left out: ${existing.id} ("Onboarding checklist")`);

    const sources = await rejects(research.submit({ requestId: build.id, slot: "a", submission: {
      coverage, investments: [investment("check", "Onboarding checklist", { investmentId: existing.id, lift: noSource })], limitations: "None",
    } }, threadA), "rejected");
    expect(sources.message).toContain("investments.0.lift.baseline.sources: needs at least one source");

    const unsizedless = await rejects(research.submit({ requestId: build.id, slot: "a", submission: {
      coverage: { ...coverage, searched: "" }, investments: [investment("check", "Onboarding checklist", { investmentId: existing.id })], limitations: "None",
    } }, threadA), "rejected");
    expect(unsizedless.message).toContain("coverage.searched: can't be empty");

    const missingLift = await rejects(research.submit({ requestId: build.id, slot: "a", submission: {
      coverage, investments: [investment("check", "Onboarding checklist", { investmentId: existing.id })], limitations: "None",
    } }, threadA), "rejected");
    expect(missingLift.message).toContain("give lift, or unsized.missing");

    await research.submit({ requestId: build.id, slot: "a", submission: valid }, threadA);
    expect((await research.show({ requestId: build.id })).submissions).toHaveLength(1);
  });

  it("keeps submissions immutable in storage", async () => {
    const { db, research, build, spawned, existing } = await portfolioSetup();
    await research.tick();
    await research.submit({ requestId: build.id, slot: "a", submission: {
      coverage, investments: [investment("check", "Onboarding checklist", { investmentId: existing.id, unsized: { missing: "No cohort data yet" } })], limitations: "None",
    } }, threadFor(spawned, build.id, "a"));
    expect(() => db.prepare("UPDATE research_submissions SET body = '{}'").run()).toThrow("immutable");
    expect(() => db.prepare("DELETE FROM research_submissions").run()).toThrow("immutable");
  });
});

async function bothSubmitted() {
  const context = await portfolioSetup();
  await context.research.tick();
  const a = { coverage, investments: [
    investment("check", "Onboarding checklist", { investmentId: context.existing.id, existing: true, lift: lift(1450, 20, 40, 70, { funnelSteps: [
      { step: "Signups", value: 900, unit: "signups", sources: ["https://analytics.example/signups"], linkToNext: { rate: 0.05, sources: ["https://analytics.example/conv"] } },
      { step: "Week-1 active", value: 45, unit: UNIT, sources: ["https://analytics.example/wau"] },
    ] }) }),
    investment("email", "Day-2 email", { lift: lift(1450, 5, 10, 20) }),
    investment("bot", "Discord welcome bot", { unsized: { missing: "No data on Discord joiners' activation" } }),
  ], limitations: "One quarter" };
  const b = { coverage, investments: [
    investment("onboarding", "Onboarding checklist", { investmentId: context.existing.id, existing: true, lift: lift(1450, 10, 30, 50) }),
    investment("email", "Day-2 email", { lift: lift(1450, 5, 10, 20) }),
    investment("gallery", "Template gallery", { lift: lift(1450, 30, 60, 90) }),
  ], limitations: "Forecast only" };
  await context.research.submit({ requestId: context.build.id, slot: "a", submission: a }, threadFor(context.spawned, context.build.id, "a"));
  await context.research.submit({ requestId: context.build.id, slot: "b", submission: b }, threadFor(context.spawned, context.build.id, "b"));
  await context.research.tick();
  return { ...context, a, b, reconciler: threadFor(context.spawned, context.build.id, "reconcile") };
}

function validReconciliation(context: Awaited<ReturnType<typeof bothSubmitted>>) {
  const [check, email, bot] = context.a.investments;
  const gallery = context.b.investments[2]!;
  return {
    coverage,
    investments: [
      { ...check, from: [{ slot: "a", key: "check" }, { slot: "b", key: "onboarding" }], liftFrom: { slot: "a", key: "check" } },
      { ...email, from: [{ slot: "a", key: "email" }, { slot: "b", key: "email" }], liftFrom: { slot: "a", key: "email" } },
      { ...bot, from: [{ slot: "a", key: "bot" }] },
      { ...gallery, from: [{ slot: "b", key: "gallery" }], liftFrom: { slot: "b", key: "gallery" } },
    ],
    disagreements: [
      { topic: "Checklist lift", affects: ["check"], positions: { a: "+40 from cohorts", b: "+30 forecast" }, resolution: "Cohort data covers the same population", resolved: true },
      { topic: "Only a found the bot", affects: ["bot"], positions: { a: "Candidate", b: "Not found" }, resolution: "Kept; b's search skipped Discord", resolved: true },
      { topic: "Only b found the gallery", affects: ["gallery"], positions: { a: "Not found", b: "+60" }, resolution: "Kept; a's search skipped templates", resolved: true },
    ],
    excluded: [],
    limitations: "Lift for the bot needs Discord data",
  };
}

describe("reconciliation and publishing", () => {
  it("creates one reconciliation thread only after both submissions, and shows them both", async () => {
    const context = await bothSubmitted();
    await context.research.tick();
    expect(context.spawned.filter((entry) => entry.metadata.role === "reconcile" && entry.metadata.researchRequestId === context.build.id)).toHaveLength(1);
    const shown = await context.research.show({ requestId: context.build.id });
    expect(shown.phase).toBe("reconciling");
    expect(shown.submissions.map((entry) => entry.body)).toEqual([context.a, context.b]);
    expect(context.spawned.find((entry) => entry.id === context.reconciler)!.prompt).toContain("Template gallery");
  });

  it("rejects an untraced item, a changed lift, a silently dropped item and an unlisted disagreement", async () => {
    const context = await bothSubmitted();
    const valid = validReconciliation(context);
    const invented = { ...valid, investments: [...valid.investments, { ...investment("new", "Invented idea", { unsized: { missing: "?" } }), from: [{ slot: "a", key: "ghost" }] }] };
    const untraced = await rejects(context.research.reconcile({ requestId: context.build.id, reconciliation: invented }, context.reconciler), "rejected");
    expect(untraced.message).toContain('investments[4] ("Invented idea") traces to a:ghost, which isn\'t in submission a');

    const changed = structuredClone(valid);
    Object.assign(changed.investments[1]!, { lift: lift(1450, 5, 12, 20) });
    const lifted = await rejects(context.research.reconcile({ requestId: context.build.id, reconciliation: changed }, context.reconciler), "rejected");
    expect(lifted.message).toContain('investments[1] ("Day-2 email").lift differs from a:email\'s lift');

    const dropped = { ...valid, investments: valid.investments.slice(0, 3), disagreements: valid.disagreements.slice(0, 2) };
    const drop = await rejects(context.research.reconcile({ requestId: context.build.id, reconciliation: dropped }, context.reconciler), "rejected");
    expect(drop.message).toContain('Submission b item "gallery" ("Template gallery") is neither reconciled nor listed in excluded');

    const unlisted = { ...valid, disagreements: valid.disagreements.slice(1) };
    const quiet = await rejects(context.research.reconcile({ requestId: context.build.id, reconciliation: unlisted }, context.reconciler), "rejected");
    expect(quiet.message).toContain('investments[0] ("Onboarding checklist"): submissions disagree on base lift, range, sources (a: +40 weekly active users per week ending 2026-12-06, b: +30');

    const unresolved = structuredClone(valid);
    unresolved.disagreements[0]!.resolved = false;
    const open = await rejects(context.research.reconcile({ requestId: context.build.id, reconciliation: unresolved }, context.reconciler), "rejected");
    expect(open.message).toContain('is affected by unresolved disagreement "Checklist lift", so it can\'t carry lift');

    await rejects(context.research.reconcile({ requestId: context.build.id, reconciliation: valid }, threadFor(context.spawned, context.build.id, "a")), "not_your_slot");
    await rejects(context.research.reconcile({ requestId: context.build.id, reconciliation: valid }, null), "not_your_slot");
    expect((await context.research.show({ requestId: context.build.id })).reconciliation).toBeNull();
  });

  it("publishes lift through the publish-only path, computes the ranking, and leaves unsized items unranked with what's missing", async () => {
    const context = await bothSubmitted();
    const result = await context.research.reconcile({ requestId: context.build.id, reconciliation: validReconciliation(context) }, context.reconciler);
    expect(result.summary).toBe("Published 4 investments: 3 ranked, 1 unranked.");
    const portfolio = (await context.plan.showObjective({ id: context.objective.id })).investments;
    const byName = Object.fromEntries(portfolio.map((entry) => [entry.name, entry]));
    expect(portfolio).toHaveLength(4);
    expect(byName["Onboarding checklist"]).toMatchObject({ id: context.existing.id, rank: 2, lift: { low: 20, base: 40, high: 70, unit: UNIT }, revision: 1 });
    expect(byName["Onboarding checklist"]!.lift!.method).toBe("Observational comparison: Cohort comparison of users who saw the checklist");
    expect(byName["Onboarding checklist"]!.research).toMatchObject({
      requestId: context.build.id, reconciliationThreadId: context.reconciler,
      submissionThreadIds: [threadFor(context.spawned, context.build.id, "a"), threadFor(context.spawned, context.build.id, "b")],
      funnelSteps: [expect.objectContaining({ step: "Signups", linkToNext: { rate: 0.05, sources: ["https://analytics.example/conv"] } }), expect.objectContaining({ step: "Week-1 active", linkToNext: null })],
    });
    expect(byName["Template gallery"]).toMatchObject({ rank: 1, existing: false, lift: { base: 60 } });
    expect(byName["Day-2 email"]).toMatchObject({ rank: 3 });
    expect(byName["Discord welcome bot"]).toMatchObject({ rank: null, lift: null, research: { missing: "No data on Discord joiners' activation" } });
    expect((await context.research.show({ requestId: context.build.id })).phase).toBe("published");
    await rejects(context.research.reconcile({ requestId: context.build.id, reconciliation: validReconciliation(context) }, context.reconciler), "wrong_phase");

    const edited = await context.plan.editInvestment({ id: context.existing.id, expectedRevision: 1, name: "Checklist v2" });
    expect(edited.lift).toMatchObject({ base: 40 });
    await rejects(context.plan.editInvestment({ id: context.existing.id, expectedRevision: 2, lift: { low: 0, base: 999, high: 999 } }), "invalid");
  });

  it("ranks only items on the most common unit and period basis", () => {
    const wau = { unit: "wau", period: "w1", population: "New signups" };
    const { ranks, reasons } = rankByLift([
      { id: "x", name: "X", base: 10, basis: wau },
      { id: "y", name: "Y", base: 500, basis: { ...wau, unit: "installs" } },
      { id: "z", name: "Z", base: 30, basis: wau },
      { id: "p", name: "P", base: 900, basis: { ...wau, population: "Existing teams" } },
      { id: "u", name: "U", base: null, basis: null },
    ]);
    expect(Object.fromEntries(ranks)).toEqual({ x: 2, y: null, z: 1, p: null, u: null });
    expect(reasons.get("p")).toContain("not the portfolio's shared basis (wau per w1 for New signups)");
    expect(reasons.get("y")).toContain("measured as installs per w1");
    expect(reasons.has("x")).toBe(false);
  });

  it("ranks nothing when incompatible groups tie, instead of breaking the tie by lift", () => {
    const { ranks, reasons } = rankByLift([
      { id: "a", name: "A", base: 10, basis: { unit: "wau", period: "w1", population: "New signups" } },
      { id: "b", name: "B", base: 500, basis: { unit: "wau", period: "w1", population: "Existing teams" } },
    ]);
    expect(Object.fromEntries(ranks)).toEqual({ a: null, b: null });
    expect(reasons.get("b")).toContain("no main comparable group");
  });

  it("derives objectives as proposed records, ranked by lift, with owner proposals", async () => {
    const context = setup({ projectId: "prj_research" });
    const priority = await context.plan.addPriority({ name: "Grow weekly active users", metric: UNIT });
    const [discover] = await context.plan.listResearchRequests({ kind: "discover_objectives" });
    await context.research.tick();
    const candidate = (key: string, name: string, extra: Record<string, unknown>) => ({
      key, name, rationale: `${name} moves WAU`, metricLink: { claim: "Counts toward WAU", sources: ["https://analytics.example/def"] },
      owner: { proposal: "Growth / Conversion", threadId: "thr_growthconv" }, effort: "About 3 weeks", dependencies: "Analytics event", ...extra,
    });
    const a = { candidates: [candidate("act", "Lift activation", { lift: lift(1450, 20, 40, 70) }), candidate("ret", "Reduce week-4 drop-off", { lift: lift(1450, 50, 80, 120) })], limitations: "x" };
    const b = { candidates: [candidate("act", "Lift activation", { lift: lift(1450, 20, 40, 70) }), candidate("ret", "Reduce week-4 drop-off", { lift: lift(1450, 50, 80, 120) })], limitations: "y" };
    const bad = { candidates: [{ ...candidate("act", "Lift activation", { lift: lift(1450, 20, 40, 70) }), metricLink: { claim: "Trust me", sources: [] } }], limitations: "x" };
    const unsourced = await rejects(context.research.submit({ requestId: discover!.id, slot: "a", submission: bad }, threadFor(context.spawned, discover!.id, "a")), "rejected");
    expect(unsourced.message).toContain("candidates.0.metricLink.sources: needs at least one source");
    await context.research.submit({ requestId: discover!.id, slot: "a", submission: a }, threadFor(context.spawned, discover!.id, "a"));
    await context.research.submit({ requestId: discover!.id, slot: "b", submission: b }, threadFor(context.spawned, discover!.id, "b"));
    await context.research.tick();
    await context.research.reconcile({ requestId: discover!.id, reconciliation: {
      candidates: a.candidates.map((entry) => ({ ...entry, from: [{ slot: "a", key: entry.key }, { slot: "b", key: entry.key }], liftFrom: { slot: "a", key: entry.key } })),
      disagreements: [], excluded: [], limitations: "x",
    } }, threadFor(context.spawned, discover!.id, "reconcile"));
    const objectives = (await context.plan.showPriority({ id: priority.id })).objectives;
    expect(objectives.map((entry) => [entry.name, entry.approved, entry.rank, entry.assigneeThreadId])).toEqual([
      ["Lift activation", false, 2, "thr_growthconv"],
      ["Reduce week-4 drop-off", false, 1, "thr_growthconv"],
    ]);
    expect(objectives[0]!.research).toMatchObject({ rationale: "Lift activation moves WAU", ownerProposal: "Growth / Conversion" });
    expect(objectives[0]!.research).toMatchObject({ metricLink: { claim: "Counts toward WAU" }, cost: "About 3 weeks", dependencies: "Analytics event" });
    expect((await context.plan.listResearchRequests({ kind: "build_portfolio" }))).toHaveLength(0);
  });
});

describe("research tied to its inputs", () => {
  const briefOf = (prompt: string) => prompt.slice(prompt.indexOf("```json"), prompt.indexOf("```", prompt.indexOf("```json") + 7));

  it("gives both slots and the reconciliation the brief frozen when the request started, even when a spawn is retried after an edit", async () => {
    const context = await portfolioSetup();
    context.state.failNextSpawnAfterCreate = true;
    await context.research.tick();
    await context.plan.editInvestment({ id: context.existing.id, expectedRevision: 1, brief: { deliverable: "Edited after the request started" } });
    await context.research.tick();
    const [a, b] = ["a", "b"].map((role) => context.spawned.find((entry) => entry.metadata.researchRequestId === context.build.id && entry.metadata.role === role)!);
    expect(briefOf(a!.prompt)).toBe(briefOf(b!.prompt));
    expect(b!.prompt).not.toContain("Edited after the request started");
    expect(b!.prompt).toContain("frozen when this request started");
  });

  it("supersedes a reconciliation whose inputs changed since the request started: nothing publishes and a fresh run is queued", async () => {
    const context = await bothSubmitted();
    expect(briefOf(context.spawned.find((entry) => entry.id === context.reconciler)!.prompt)).toBe(briefOf(context.spawned.find((entry) => entry.id === threadFor(context.spawned, context.build.id, "a"))!.prompt));
    await context.plan.editPriority({ id: context.priority.id, expectedRevision: 1, target: 2400 });
    const result = await context.research.reconcile({ requestId: context.build.id, reconciliation: validReconciliation(context) }, context.reconciler);
    expect(result).toMatchObject({ published: [], superseded: true });
    expect(result.summary).toContain(`priority ${context.priority.id} (revision 1 → 2)`);
    expect((await context.research.show({ requestId: context.build.id })).phase).toBe("closed");
    expect((await context.plan.showObjective({ id: context.objective.id })).investments).toMatchObject([{ id: context.existing.id, lift: null, rank: null }]);
    const followUps = (await context.plan.listResearchRequests({ kind: "refresh_portfolio" })).filter((request) => request.idempotencyKey.includes(`superseded:${context.build.id}`));
    expect(followUps).toHaveLength(1);
    expect(followUps[0]!.detail?.reasons?.[0]).toContain("Inputs changed while research");
  });

  it("publishes despite a rename, a new now value or new constraints, which go to the edit assessment instead", async () => {
    const context = await bothSubmitted();
    await context.plan.editPriority({ id: context.priority.id, expectedRevision: 1, now: 1500, constraints: "No paid ads", name: "Grow WAU" });
    await context.plan.editObjective({ id: context.objective.id, expectedRevision: context.objective.revision, name: "Lift week-1 activation" });
    await context.plan.editInvestment({ id: context.existing.id, expectedRevision: 1, name: "Checklist v2", brief: { deliverable: "Reworded" } });
    const result = await context.research.reconcile({ requestId: context.build.id, reconciliation: validReconciliation(context) }, context.reconciler);
    expect(result).toMatchObject({ superseded: false });
    expect(result.published).toHaveLength(4);
  });

  it("supersedes a submission whose inputs changed, instead of saving work on stale inputs", async () => {
    const context = await portfolioSetup();
    await context.research.tick();
    await context.plan.editInvestment({ id: context.existing.id, expectedRevision: 1, brief: { scope: "Teams only" } });
    const result = await context.research.submit({ requestId: context.build.id, slot: "a", submission: {
      coverage, investments: [investment("check", "Onboarding checklist", { investmentId: context.existing.id, existing: true, unsized: { missing: "None yet" } })], limitations: "None",
    } }, threadFor(context.spawned, context.build.id, "a"));
    expect(result).toMatchObject({ accepted: false, next: expect.stringContaining("Superseded") });
    expect((await context.research.show({ requestId: context.build.id })).submissions).toEqual([]);
  });

  it("clears rank and lift for every investment when an assessment reruns research, so Start is unavailable until a fresh reconciliation", async () => {
    const context = await bothSubmitted();
    context.research.tick();
    await context.research.reconcile({ requestId: context.build.id, reconciliation: validReconciliation(context) }, context.reconciler);
    expect((await context.plan.showObjective({ id: context.objective.id })).investments.filter((entry) => entry.rank !== null)).toHaveLength(3);
    await context.plan.editObjective({ id: context.objective.id, expectedRevision: context.objective.revision, name: "Lift activation for teams" });
    context.advance(ASSESS_QUIET_MS);
    await context.research.tick();
    const [assess] = await context.research.list({ kind: "assess_edit" });
    await context.research.rerun({ requestId: assess!.request.id, objectiveIds: [context.objective.id], reason: "Population changed to teams" }, threadFor(context.spawned, assess!.request.id, "assess"));
    const portfolio = (await context.plan.showObjective({ id: context.objective.id })).investments;
    expect(portfolio.map((entry) => [entry.rank, entry.lift])).toEqual(portfolio.map(() => [null, null]));
  });
});

describe("holds on lift-relevant edits", () => {
  async function held() {
    const context = await bothSubmitted();
    await context.research.reconcile({ requestId: context.build.id, reconciliation: validReconciliation(context) }, context.reconciler);
    const sent: string[] = [];
    const host: StartHost = {
      thread: async (threadId) => THREADS[threadId] ?? null,
      send: async (_threadId, text) => { sent.push(text); },
      wasSent: async () => false,
    };
    const startsFor = () => createStartService({ db: context.db, migrate, host, publish: () => {}, now: () => new Date("2026-10-27T12:00:00Z") });
    const email = (await context.plan.showObjective({ id: context.objective.id })).investments.find((entry) => entry.name === "Day-2 email")!;
    await context.plan.editInvestment({ id: email.id, expectedRevision: email.revision, brief: { scope: "Existing teams only" } });
    await context.research.tick();
    const [assess] = await context.research.list({ kind: "assess_edit" });
    return { ...context, sent, startsFor, email, assess: assess!, assessor: () => threadFor(context.spawned, assess!.request.id, "assess") };
  }

  it("keeps lift visible but blocks Start, and starts the assessment without the quiet window", async () => {
    const context = await held();
    expect(context.assess.phase).toBe("assessing");
    const view = await context.plan.showObjective({ id: context.objective.id });
    expect(view.researchHold).toBe("Checking whether this edit changes the research");
    expect(view.investments.find((entry) => entry.id === context.email.id)).toMatchObject({ rank: 3, lift: { base: 10 } });
    const gallery = view.investments.find((entry) => entry.name === "Template gallery")!;
    const error = await rejects(context.startsFor().start({ id: gallery.id }), "not_ready");
    expect(error.message).toContain("Checking whether this edit changes the research");
    expect(context.sent).toEqual([]);
  });

  it("survives a restart, and close releases it with lift and rank kept", async () => {
    const context = await held();
    const restarted = createPlanService({ db: context.db, migrate, findThread: async (id) => THREADS[id] ?? null, publish: () => {}, now: () => new Date() });
    expect((await restarted.showObjective({ id: context.objective.id })).researchHold).not.toBeNull();
    const gallery = (await restarted.showObjective({ id: context.objective.id })).investments.find((entry) => entry.name === "Template gallery")!;
    await rejects(context.startsFor().start({ id: gallery.id }), "not_ready");
    await context.restart().close({ requestId: context.assess.request.id, reason: "Scope wording only" }, context.assessor());
    const view = await restarted.showObjective({ id: context.objective.id });
    expect(view.researchHold).toBeNull();
    expect(view.investments.find((entry) => entry.id === context.email.id)).toMatchObject({ rank: 3, lift: { base: 10 } });
    expect((await context.startsFor().start({ id: gallery.id })).state).toBe("in_progress");
    expect(context.sent).toHaveLength(1);
  });

  it("rerun releases the hold, clears lift and rank, and queues the refresh", async () => {
    const context = await held();
    const result = await context.research.rerun({ requestId: context.assess.request.id, objectiveIds: [context.objective.id], reason: "Population changed" }, context.assessor());
    const view = await context.plan.showObjective({ id: context.objective.id });
    expect(view.researchHold).toBeNull();
    expect(view.investments.every((entry) => entry.rank === null && entry.lift === null)).toBe(true);
    expect(result.refreshRequests).toHaveLength(1);
    expect((await context.plan.listResearchRequests({ kind: "refresh_portfolio" })).map((request) => request.id)).toContain(result.refreshRequests[0]);
  });
});

describe("Start-ready briefs from research", () => {
  it("writes deliverable, scope, acceptance criteria, measurement and sources to new and existing investments, but never over a field set by hand", async () => {
    const context = await portfolioSetup();
    await context.plan.editInvestment({ id: context.existing.id, expectedRevision: 1, brief: { scope: "Hand-written scope" } });
    const build = (await context.plan.listResearchRequests({})).find((request) => request.kind === "build_portfolio")!;
    await context.research.tick();
    const submission: { coverage: typeof coverage; investments: Array<Record<string, unknown> & { key: string }>; limitations: string } = { coverage, investments: [
      investment("check", "Onboarding checklist", { investmentId: context.existing.id, existing: true, unsized: { missing: "No cohort data" }, cost: "3 weeks", dependencies: "Analytics event" }),
      investment("email", "Day-2 email", { lift: lift(1450, 5, 10, 20) }),
    ], limitations: "None" };
    for (const slot of ["a", "b"] as const) await context.research.submit({ requestId: build.id, slot, submission }, threadFor(context.spawned, build.id, slot));
    await context.research.tick();
    await context.research.reconcile({ requestId: build.id, reconciliation: {
      coverage, investments: submission.investments.map((entry) => ({ ...entry, from: [{ slot: "a", key: entry.key }, { slot: "b", key: entry.key }], ...(entry.lift ? { liftFrom: { slot: "a", key: entry.key } } : {}) })),
      disagreements: [], excluded: [], limitations: "None",
    } }, threadFor(context.spawned, build.id, "reconcile"));
    const byName = Object.fromEntries((await context.plan.showObjective({ id: context.objective.id })).investments.map((entry) => [entry.name, entry]));
    expect(byName["Onboarding checklist"]!.brief).toEqual({
      scope: "Hand-written scope", deliverable: "Onboarding checklist shipped", acceptanceCriteria: "Onboarding checklist is live for new signups",
      measurement: "Shared WAU", sources: ["https://notes.example/plan"],
    });
    expect(byName["Onboarding checklist"]!.research).toMatchObject({ missing: "No cohort data", cost: "3 weeks", dependencies: "Analytics event" });
    expect(byName["Day-2 email"]).toMatchObject({ rank: 1, briefSetByHand: [], brief: { deliverable: "Day-2 email shipped", scope: "Day-2 email only", acceptanceCriteria: "Day-2 email is live for new signups" } });
  });

  it("rejects a portfolio submission missing any brief field", async () => {
    const context = await portfolioSetup();
    await context.research.tick();
    const { deliverable: _d, scope: _s, acceptanceCriteria: _c, ...bare } = investment("check", "Onboarding checklist", { investmentId: context.existing.id, unsized: { missing: "x" } });
    const error = await rejects(context.research.submit({ requestId: context.build.id, slot: "a", submission: { coverage, investments: [bare], limitations: "None" } }, threadFor(context.spawned, context.build.id, "a")), "rejected");
    expect(error.message).toContain("investments.0.deliverable");
    expect(error.message).toContain("investments.0.scope");
    expect(error.message).toContain("investments.0.acceptanceCriteria");
  });
});

describe("disagreements and comparability", () => {
  it("requires a listed disagreement when submissions differ only in population, baseline or method", async () => {
    const context = await bothSubmitted();
    const valid = validReconciliation(context);
    for (const [field, value] of [["population", "Existing teams"], ["method", "forecast"]] as const) {
      const changed = { ...lift(1450, 5, 10, 20), [field]: value };
      expect(liftDifferences({ key: "email", name: "Day-2 email", lift: lift(1450, 5, 10, 20) as never }, { key: "email", name: "Day-2 email", lift: changed as never })).toEqual([field]);
    }
    const a = { key: "email", name: "Day-2 email", lift: lift(1450, 5, 10, 20) as never };
    const b = { key: "email", name: "Day-2 email", lift: { ...lift(1450, 5, 10, 20), population: "Existing teams" } as never };
    const issues = traceIssues("investments", [{ ...a, from: [{ slot: "a", key: "email" }, { slot: "b", key: "email" }], liftFrom: { slot: "a", key: "email" } }], { a: [a], b: [b] }, [], []);
    expect(issues).toEqual([expect.stringContaining("submissions disagree on population")]);
    expect(traceIssues("investments", [{ ...a, from: [{ slot: "a", key: "email" }, { slot: "b", key: "email" }], liftFrom: { slot: "a", key: "email" } }], { a: [a], b: [b] }, [
      { topic: "Population", affects: ["email"], positions: { a: "New signups", b: "Existing teams" }, resolution: "The objective targets new signups", resolved: true },
    ], [])).toEqual([]);
    const shifted = lift(1400, 5, 10, 20);
    expect(liftDifferences({ key: "x", name: "X", lift: lift(1450, 5, 10, 20) as never }, { key: "x", name: "X", lift: shifted as never })).toEqual(["baseline"]);
    expect(valid.investments).toHaveLength(4);
  });

  it("keeps the whole portfolio unranked while any disagreement is unresolved, recording why", async () => {
    const context = await bothSubmitted();
    const reconciliation = validReconciliation(context) as ReturnType<typeof validReconciliation> & { investments: Array<Record<string, unknown>> };
    reconciliation.disagreements[1] = { ...reconciliation.disagreements[1]!, resolved: false };
    const result = await context.research.reconcile({ requestId: context.build.id, reconciliation }, context.reconciler);
    expect(result.summary).toContain("0 ranked, 4 unranked");
    const portfolio = (await context.plan.showObjective({ id: context.objective.id })).investments;
    expect(portfolio.every((entry) => entry.rank === null)).toBe(true);
    const gallery = portfolio.find((entry) => entry.name === "Template gallery")!;
    expect(gallery.lift).toMatchObject({ base: 60 });
    expect(gallery.research?.missing).toContain('unresolved disagreement ("Only a found the bot")');
  });
});

describe("research project", () => {
  it("uses the project of the thread the priority or objective was created in before the assigned-team fallback, and shows a short line when blocked", async () => {
    const context = setup({ threadProjects: { thr_planning: "prj_planning", thr_growthconv: "prj_growth" } });
    const priority = await context.plan.addPriority({ name: "Grow weekly active users" }, "thr_planning");
    await context.plan.addObjective({ priorityId: priority.id, name: "Lift", assigneeThreadId: "thr_growthconv" }, "thr_nowhere");
    await context.research.tick();
    expect(new Set(context.spawned.map((entry) => entry.projectId))).toEqual(new Set(["prj_planning"]));

    const blocked = setup({ threadProjects: {} });
    const lonely = await blocked.plan.addPriority({ name: "Lonely" }, "thr_nowhere");
    await blocked.research.tick();
    expect((await blocked.plan.showPriority({ id: lonely.id })).researchBlocked).toBe(NO_PROJECT_SHORT);
    blocked.state.projectId = "prj_set";
    await blocked.research.tick();
    expect((await blocked.plan.showPriority({ id: lonely.id })).researchBlocked).toBeNull();
  });
});

describe("edit assessment", () => {
  async function assessing() {
    const context = await portfolioSetup({ concurrency: 10 });
    const renamed = await context.plan.editObjective({ id: context.objective.id, expectedRevision: context.objective.revision, name: "Lift week-1 activation" });
    context.advance(ASSESS_QUIET_MS);
    await context.research.tick();
    const [assess] = await context.research.list({ kind: "assess_edit" });
    const thread = threadFor(context.spawned, assess!.request.id, "assess");
    return { ...context, renamed, assess: assess!.request, thread };
  }

  it("closes with no research impact and creates nothing", async () => {
    const context = await assessing();
    expect(context.spawned.filter((entry) => entry.metadata.researchRequestId === context.assess.id).map((entry) => entry.metadata.role)).toEqual(["assess"]);
    const before = (await context.plan.listResearchRequests({})).length;
    await rejects(context.research.close({ requestId: context.assess.id, reason: "Rename only" }, null), "not_your_slot");
    await context.research.close({ requestId: context.assess.id, reason: "Rename only" }, context.thread);
    expect((await context.plan.listResearchRequests({})).length).toBe(before);
    expect((await context.research.show({ requestId: context.assess.id }))).toMatchObject({ phase: "closed", detail: "No research impact: Rename only" });
    await rejects(context.research.rerun({ requestId: context.assess.id, objectiveIds: [context.objective.id], reason: "late" }, context.thread), "wrong_phase");
  });

  it("reruns research with exactly one refresh request for the affected objective", async () => {
    const context = await assessing();
    await rejects(context.research.rerun({ requestId: context.assess.id, objectiveIds: [context.objective.id], reason: "x" }, "thr_someoneelse"), "not_your_slot");
    await rejects(context.research.rerun({ requestId: context.assess.id, objectiveIds: [context.objective.id], reason: "x" }, null), "not_your_slot");
    const result = await context.research.rerun({ requestId: context.assess.id, objectiveIds: [context.objective.id, context.objective.id], reason: "Scope changed" }, context.thread);
    await rejects(context.research.rerun({ requestId: context.assess.id, objectiveIds: [context.objective.id], reason: "Scope changed" }, context.thread), "wrong_phase");
    const reruns = (await context.plan.listResearchRequests({ kind: "refresh_portfolio" })).filter((request) => request.subjectKind === "objective");
    expect(reruns).toHaveLength(1);
    expect(result.refreshRequests).toEqual([reruns[0]!.id]);
    expect(reruns[0]).toMatchObject({ subjectId: context.objective.id, subjectRevision: context.renamed.revision, detail: { objectiveId: context.objective.id, reasons: ["Scope changed"] } });
  });
});

describe("batched research", () => {
  const unsizedSubmission = (existingId: string, extra: Array<{ id: string; name: string }> = []) => ({
    coverage,
    investments: [
      investment("check", "Onboarding checklist", { investmentId: existingId, existing: true, unsized: { missing: "No cohort data yet" } }),
      ...extra.map((entry, index) => investment(`extra${index}`, entry.name, { investmentId: entry.id, unsized: { missing: "No data yet" } })),
    ],
    limitations: "None",
  });
  const reconcileUnsized = (submission: ReturnType<typeof unsizedSubmission>) => ({
    coverage,
    investments: submission.investments.map((entry) => ({ ...entry, from: [{ slot: "a", key: entry.key }, { slot: "b", key: entry.key }] })),
    disagreements: [],
    excluded: [],
    limitations: "None",
  });
  const portfolioRequests = async (plan: ReturnType<typeof setup>["plan"]) =>
    (await plan.listResearchRequests({})).filter((request) => request.kind === "build_portfolio" || request.kind === "refresh_portfolio");

  it("folds investment adds into the pending portfolio run, so a whole batch gets one pair of research threads", async () => {
    const { plan, research, objective, existing, build, spawned } = await portfolioSetup({ concurrency: 5 });
    const more = [];
    for (const name of ["Day-2 email", "Template gallery", "Discord welcome bot"]) more.push(await plan.addInvestment({ objectiveId: objective.id, name }));
    const queued = await portfolioRequests(plan);
    expect(queued.map((request) => request.id)).toEqual([build.id]);
    expect(queued[0]!.detail).toMatchObject({ objectiveId: objective.id, investmentIds: [existing.id, ...more.map((entry) => entry.id)] });
    await research.tick();
    await research.tick();
    const forBuild = spawned.filter((entry) => entry.metadata.researchRequestId === build.id);
    expect(spawned.filter((entry) => entry.prompt.includes("an objective's portfolio"))).toHaveLength(2);
    expect(forBuild.map((entry) => entry.metadata.role).sort()).toEqual(["a", "b"]);
    for (const entry of [existing, ...more]) expect(forBuild[0]!.prompt).toContain(entry.id);
  });

  it("runs one portfolio research at a time per objective and coalesces triggers during a run into one follow-up", async () => {
    const context = await portfolioSetup({ concurrency: 5 });
    const { plan, research, objective, existing, build, spawned } = context;
    await research.tick();
    context.advance(1000);
    const more = [];
    for (const name of ["Day-2 email", "Template gallery", "Discord welcome bot"]) more.push(await plan.addInvestment({ objectiveId: objective.id, name }));
    const followUps = (await portfolioRequests(plan)).filter((request) => request.id !== build.id);
    expect(followUps).toHaveLength(1);
    const followUp = followUps[0]!;
    expect(followUp).toMatchObject({ kind: "refresh_portfolio", status: "pending", detail: { investmentIds: more.map((entry) => entry.id) } });

    await research.tick();
    await research.tick();
    const portfolioThreads = () => spawned.filter((entry) => entry.metadata.researchRequestId === build.id || entry.metadata.researchRequestId === followUp.id);
    expect(portfolioThreads()).toHaveLength(2);
    expect(await research.show({ requestId: followUp.id })).toMatchObject({ phase: "blocked", detail: expect.stringContaining(`Waiting for portfolio research ${build.id}`) });
    expect((await plan.showObjective({ id: objective.id })).researchActive).toBe(true);

    const submission = unsizedSubmission(existing.id);
    for (const slot of ["a", "b"] as const) await research.submit({ requestId: build.id, slot, submission }, threadFor(spawned, build.id, slot));
    await research.tick();
    await plan.addInvestment({ objectiveId: objective.id, name: "Arrives during reconciliation" });
    expect((await portfolioRequests(plan)).map((request) => request.id)).toEqual([build.id, followUp.id]);
    await research.reconcile({ requestId: build.id, reconciliation: reconcileUnsized(submission) }, threadFor(spawned, build.id, "reconcile"));
    await research.tick();
    await research.tick();
    const followUpThreads = spawned.filter((entry) => entry.metadata.researchRequestId === followUp.id);
    expect(followUpThreads.map((entry) => entry.metadata.role).sort()).toEqual(["a", "b"]);
    expect(portfolioThreads().filter((entry) => entry.metadata.role !== "reconcile")).toHaveLength(4);
    expect((await research.show({ requestId: followUp.id })).request.detail?.investmentIds).toHaveLength(4);
  });

  it("folds a refresh queued before approval into the build, so approving starts one run", async () => {
    const context = setup({ projectId: "prj_research" });
    const priority = await context.plan.addPriority({ name: "Grow weekly active users" });
    const proposed = await context.plan.addObjective({ priorityId: priority.id, name: "Proposed one", proposed: true });
    const early = await context.plan.addInvestment({ objectiveId: proposed.id, name: "Day-2 email" });
    const approved = await context.plan.approveObjective({ id: proposed.id, expectedRevision: 1 });
    await context.plan.assignObjective({ id: proposed.id, expectedRevision: approved.revision, assigneeThreadId: "thr_growthconv" });
    const queued = await portfolioRequests(context.plan);
    expect(queued.map((request) => request.kind)).toEqual(["refresh_portfolio", "build_portfolio"]);
    await context.research.tick();
    await context.research.tick();
    const forObjective = context.spawned.filter((entry) => queued.some((request) => request.id === entry.metadata.researchRequestId));
    expect(forObjective).toHaveLength(2);
    const [refresh, build] = await Promise.all(queued.map((request) => context.research.show({ requestId: request.id })));
    expect(refresh).toMatchObject({ phase: "researching", request: { detail: { investmentIds: [early.id], coalesced: [build!.request.id] } } });
    expect(build).toMatchObject({ phase: "closed", detail: `Covered by research ${refresh!.request.id}.`, request: { status: "claimed" } });
  });

  it("debounces edits under one objective into one assessment covering every changed record and field", async () => {
    const context = await portfolioSetup({ concurrency: 10 });
    const { plan, research, objective, existing, spawned } = context;
    await research.tick();
    const second = await plan.addInvestment({ objectiveId: objective.id, name: "Day-2 email" });
    const renamed = await plan.editObjective({ id: objective.id, expectedRevision: objective.revision, name: "Lift week-1 activation" });
    const edited = await plan.editInvestment({ id: existing.id, expectedRevision: existing.revision, name: "Checklist v2" });
    context.advance(60_000);
    await plan.editInvestment({ id: edited.id, expectedRevision: edited.revision, brief: { deliverable: "Checklist in the first thread" } });
    await plan.editInvestment({ id: second.id, expectedRevision: second.revision, brief: { measurement: "WAU" } });
    const assessments = await plan.listResearchRequests({ kind: "assess_edit" });
    expect(assessments).toHaveLength(1);
    expect(assessments[0]).toMatchObject({ subjectKind: "objective", subjectId: objective.id, detail: { group: `objective:${objective.id}`, records: [
      { kind: "objective", id: objective.id, revision: renamed.revision, fields: ["name"] },
      { kind: "investment", id: existing.id, revision: 3, fields: ["name", "brief.deliverable"] },
      { kind: "investment", id: second.id, revision: 2, fields: ["brief.measurement"] },
    ] } });

    context.advance(ASSESS_QUIET_MS - 1000);
    await research.tick();
    expect(spawned.filter((entry) => entry.metadata.role === "assess")).toHaveLength(0);
    expect((await research.show({ requestId: assessments[0]!.id })).detail).toContain("Waiting for edits to settle");
    context.advance(1000);
    await research.tick();
    await research.tick();
    const assess = spawned.filter((entry) => entry.metadata.role === "assess");
    expect(assess).toHaveLength(1);
    expect(assess[0]!.prompt).toContain("3 Plan records were edited");
    expect(assess[0]!.prompt).toContain(second.id);

    const latest = await plan.showInvestment({ id: second.id });
    await plan.editInvestment({ id: second.id, expectedRevision: latest.revision, name: "Day-2 email v2" });
    expect(await plan.listResearchRequests({ kind: "assess_edit" })).toHaveLength(2);
  });

  it("debounces priority edits separately from objective edits", async () => {
    const context = await portfolioSetup();
    const first = await context.plan.editPriority({ id: context.priority.id, expectedRevision: 1, now: 1500 });
    await context.plan.editPriority({ id: context.priority.id, expectedRevision: first.revision, name: "Grow WAU" });
    await context.plan.editObjective({ id: context.objective.id, expectedRevision: context.objective.revision, name: "Activation" });
    const assessments = await context.plan.listResearchRequests({ kind: "assess_edit" });
    expect(assessments.map((request) => request.detail?.group)).toEqual([`priority:${context.priority.id}`, `objective:${context.objective.id}`]);
    expect(assessments[0]!.detail?.records).toEqual([{ kind: "priority", id: context.priority.id, revision: 3, fields: ["now", "name"] }]);
  });
});

describe("plugin wiring", () => {
  const disposers: Array<() => Promise<void>> = [];
  afterEach(async () => { for (const dispose of disposers.splice(0)) await dispose(); });

  it("creates research threads through bb.sdk.threads.spawn in the configured project and takes submissions from the CLI", async () => {
    const created: Array<{ id: string; title: string; projectId: string }> = [];
    const { bb, harness } = createFakePluginHost({
      pluginId: "plan",
      settings: { researchProjectId: "prj_research" },
      sdk: {
        threads: {
          get: async ({ threadId }) => makeThreadResponse({ id: threadId, title: "Growth / Conversion", projectId: "prj_growth" }),
          list: async () => created.map((entry) => makeThreadResponse({ id: entry.id, title: entry.title, projectId: entry.projectId })),
          spawn: async (args) => {
            const id = `thr_spawned${created.length + 1}`;
            created.push({ id, title: args.title ?? "", projectId: args.projectId });
            return makeThreadResponse({ id, title: args.title ?? null, projectId: args.projectId });
          },
        },
      },
    });
    plugin(bb);
    disposers.push(() => harness.lifecycle.dispose());
    const add = await harness.behavior.runCli(["priority", "add", "Grow weekly active users", "--json"]);
    expect(add.exitCode).toBe(0);
    const run = harness.behavior.runService("research-runner");
    await new Promise((done) => setTimeout(done, 20));
    run.controller.abort();
    await run.done;
    const spawns = harness.inspection.sdk.callsTo("threads.spawn").map((call) => call[0] as Record<string, unknown>);
    expect(spawns).toHaveLength(2);
    expect(spawns.map((spawn) => spawn.visibility)).toEqual(["hidden", "hidden"]);
    expect(spawns[0]).toMatchObject({ projectId: "prj_research", environment: { type: "project-default" }, pluginMetadata: { role: "a" } });
    const listed = JSON.parse((await harness.behavior.runCli(["research", "list", "--json"])).stdout);
    const requestId = listed.requests[0].request.id as string;
    const submission = JSON.stringify({ candidates: [{
      key: "act", name: "Lift activation", rationale: "Activation gates WAU", metricLink: { claim: "Activated users are WAU", sources: ["https://analytics.example/def"] },
      owner: { proposal: "Growth / Conversion" }, unsized: { missing: "No activation data" },
    }], limitations: "None" });
    const wrong = await harness.behavior.runCli(["research", "submit", "--request", requestId, "--slot", "a", "--data", submission, "--json"], { threadId: "thr_spawned2" });
    expect(JSON.parse(wrong.stdout)).toMatchObject({ ok: false, error: { code: "not_your_slot" } });
    const accepted = await harness.behavior.runCli(["research", "submit", "--request", requestId, "--slot", "a", "--data", submission, "--json"], { threadId: "thr_spawned1" });
    expect(JSON.parse(accepted.stdout)).toMatchObject({ requestId, slot: "a", accepted: true });
  });
});
