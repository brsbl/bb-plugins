import Database from "better-sqlite3";
import { describe, expect, it } from "vitest";
import type { InvestmentState, Lift, ResearchEvidence } from "../model.js";
import { createPlanService, type ThreadInfo } from "../service.js";
import type { Migrate } from "../store.js";
import {
  allObjectives, busyFor, canShowStart, chooseThread, emptyPortfolioText, groupOrgs, liftText, metricPatch, objectiveMeta, originLabel,
  mentionText, ownerObjectives, portfolioRows, researchFinishedUnsized, startBlockedReason, startRetryHint, teamLabel, threadQuery, unknownLiftText,
} from "./view-model.js";
import type { ActiveStart } from "../start.js";

const migrate: Migrate = (db, statements) => {
  db.exec("CREATE TABLE IF NOT EXISTS test_migrations (id INTEGER PRIMARY KEY)");
  statements.forEach((statement, id) => {
    if (db.prepare("SELECT 1 FROM test_migrations WHERE id = ?").get(id)) return;
    db.exec(statement);
    db.prepare("INSERT INTO test_migrations (id) VALUES (?)").run(id);
  });
};

const THREADS: Record<string, ThreadInfo> = {
  thr_conversion: { id: "thr_conversion", name: "Growth / Conversion", parentThreadId: null },
  thr_paid: { id: "thr_paid", name: "Growth / Paid acquisition", parentThreadId: null },
};

function setup() {
  const db = new Database(":memory:");
  const service = createPlanService({
    db,
    migrate,
    findThread: async (threadId) => THREADS[threadId] ?? null,
    publish: () => {},
    now: () => new Date("2026-10-27T12:00:00Z"),
  });
  const setLift = (id: string, base: number | null, state: InvestmentState = "not_started", rank: number | null = null) => {
    const lift: Lift | null = base === null ? null : { low: base - 20, base, high: base + 30, unit: "added week-1 active users", method: "Forecast", cost: "1 week", dependencies: "None", sources: [] };
    db.prepare("UPDATE plan_investments SET lift = ?, state = ?, rank = ? WHERE id = ?").run(lift ? JSON.stringify(lift) : null, state, rank, id);
  };
  const setMissing = (id: string, missing: string) => {
    const research: ResearchEvidence = {
      requestId: "rr_1", submissionThreadIds: ["thr_a", "thr_b"], reconciliationThreadId: "thr_r", basis: null, lift: null, missing, funnelSteps: null, rationale: null, ownerProposal: null,
    };
    db.prepare("UPDATE plan_investments SET lift = NULL, rank = NULL, research = ? WHERE id = ?").run(JSON.stringify(research), id);
  };
  const finishResearch = (phase = "published") => {
    db.prepare("UPDATE research_requests SET status = 'claimed', claimed_at = created_at").run();
    db.prepare(`INSERT INTO research_jobs (request_id, phase, project_id, detail, updated_at) SELECT id, ?, 'prj', NULL, created_at FROM research_requests WHERE true
      ON CONFLICT (request_id) DO UPDATE SET phase = excluded.phase`).run(phase);
  };
  const objectives = async () => allObjectives((await service.overview()).priorities);
  const objective = async (id: string) => (await objectives()).find((entry) => entry.id === id)!;
  return { db, service, setLift, setMissing, finishResearch, objectives, objective };
}

describe("portfolio view model", () => {
  it("orders by the stored computed rank, not raw base lift, and lists unranked items after them", async () => {
    const { service, setLift, setMissing, finishResearch, objective } = setup();
    const priority = await service.addPriority({ name: "Grow weekly active users" });
    const target = await service.addObjective({ priorityId: priority.id, name: "Lift activation", assigneeThreadId: "thr_conversion" });
    const names = ["Day-2 email nudge", "Discord welcome bot", "Onboarding checklist", "Template gallery", "Other-basis estimate"];
    const added: Array<{ id: string }> = [];
    for (const name of names) added.push(await service.addInvestment({ objectiveId: target.id, name }));
    setLift(added[0]!.id, 25, "not_started", 1);
    setLift(added[2]!.id, 60, "in_progress", 2);
    setLift(added[3]!.id, -5, "not_started", 3);
    setLift(added[4]!.id, 500, "not_started", null);
    const { ranked, unranked } = portfolioRows(await objective(target.id));
    expect(ranked.map((entry) => entry.name)).toEqual(["Day-2 email nudge", "Onboarding checklist", "Template gallery"]);
    expect(unranked.map((entry) => entry.name)).toEqual(["Discord welcome bot", "Other-basis estimate"]);
    expect(ranked.map(canShowStart)).toEqual([true, false, true]);
    expect(unranked.map(canShowStart)).toEqual([false, false]);

    setMissing(added[1]!.id, "No data on Discord joins per signup");
    finishResearch();
    const view = await objective(target.id);
    const discord = view.investments.find((entry) => entry.id === added[1]!.id)!;
    expect(researchFinishedUnsized(discord)).toBe(true);
    expect(liftText(view, discord)).toBe("—");
    expect(canShowStart(discord)).toBe(false);
    const researching = await service.addInvestment({ objectiveId: target.id, name: "Still researching" });
    const next = await objective(target.id);
    const fresh = next.investments.find((entry) => entry.id === researching.id)!;
    expect(researchFinishedUnsized(fresh)).toBe(false);
    expect(liftText(next, fresh)).toBe("Researching");
    expect(liftText(next, next.investments.find((entry) => entry.id === added[0]!.id)!)).toBeNull();
  });

  it("shows Researching only while an approved objective has a team, otherwise — or the waiting copy", async () => {
    const { service, objective } = setup();
    const priority = await service.addPriority({ name: "Grow weekly active users" });
    const assigned = await service.addObjective({ priorityId: priority.id, name: "Assigned", assigneeThreadId: "thr_conversion" });
    const unassigned = await service.addObjective({ priorityId: priority.id, name: "Unassigned" });
    const proposed = await service.addObjective({ priorityId: priority.id, name: "Proposed", proposed: true, assigneeThreadId: "thr_paid" });

    expect(emptyPortfolioText(await objective(assigned.id))).toBe("Researching");
    expect(emptyPortfolioText(await objective(unassigned.id))).toBe("Research starts once a team is assigned");
    expect(unknownLiftText(await objective(assigned.id))).toBe("Researching");
    expect(unknownLiftText(await objective(unassigned.id))).toBe("—");
    expect(unknownLiftText(await objective(proposed.id))).toBe("—");

    await service.assignObjective({ id: unassigned.id, expectedRevision: 1, assigneeThreadId: "thr_paid" });
    expect(emptyPortfolioText(await objective(unassigned.id))).toBe("Researching");
  });

  it("blocks Start on every objective of a team with work in progress, but not on other teams", async () => {
    const { service, setLift, objectives, objective } = setup();
    const priority = await service.addPriority({ name: "Grow weekly active users" });
    const first = await service.addObjective({ priorityId: priority.id, name: "Lift activation", assigneeThreadId: "thr_conversion" });
    const second = await service.addObjective({ priorityId: priority.id, name: "Shorten install", assigneeThreadId: "thr_conversion" });
    const other = await service.addObjective({ priorityId: priority.id, name: "Find a paid channel", assigneeThreadId: "thr_paid" });
    const unassigned = await service.addObjective({ priorityId: priority.id, name: "Answer faster" });
    const running = await service.addInvestment({ objectiveId: first.id, name: "Install-page copy test" });

    expect(startBlockedReason(await objectives(), await objective(second.id), [])).toBeNull();
    setLift(running.id, 35, "in_progress");

    const all = await objectives();
    expect(startBlockedReason(all, await objective(first.id), [])).toBe("Conversion is working on Install-page copy test");
    expect(startBlockedReason(all, await objective(second.id), [])).toBe("Conversion is working on Install-page copy test");
    expect(busyFor(all, second.assigneeThreadId, [])).toMatchObject({ objective: { id: first.id }, investment: { id: running.id } });
    expect(startBlockedReason(all, await objective(other.id), [])).toBeNull();
    expect(startBlockedReason(all, await objective(unassigned.id), [])).toBe("Assign a team first");
    const proposed = await service.addObjective({ priorityId: priority.id, name: "Proposed", proposed: true, assigneeThreadId: "thr_paid" });
    expect(startBlockedReason(await objectives(), await objective(proposed.id), [])).toBe("Approve the objective first");
    const bare = await service.addInvestment({ objectiveId: other.id, name: "No brief yet" });
    const otherView = await objective(other.id);
    expect(startBlockedReason(all, otherView, [], otherView.investments.find((entry) => entry.id === bare.id))).toBe("Add a deliverable and acceptance criteria to the brief first");
    expect(objectiveMeta(await objective(first.id))).toBe("Growth / Conversion · In progress: Install-page copy test");
    expect(objectiveMeta(await objective(unassigned.id))).toBe("Unassigned");

    setLift(running.id, 35, "done");
    expect(startBlockedReason(await objectives(), await objective(second.id), [])).toBeNull();
  });

  it("blocks Start when the assigned thread no longer exists", async () => {
    const { service, objectives, objective } = setup();
    const priority = await service.addPriority({ name: "Grow weekly active users" });
    const target = await service.addObjective({ priorityId: priority.id, name: "Lift activation", assigneeThreadId: "thr_conversion" });
    const saved = THREADS.thr_conversion!;
    delete THREADS.thr_conversion;
    try {
      expect(startBlockedReason(await objectives(), await objective(target.id), [])).toBe("The assigned team thread no longer exists");
    } finally {
      THREADS.thr_conversion = saved;
    }
  });
});

describe("lift while research is active", () => {
  it("shows Researching for every unsized investment while its objective's portfolio research is pending or in flight, and — once none is", async () => {
    const { service, setLift, setMissing, finishResearch, objective } = setup();
    const priority = await service.addPriority({ name: "Grow weekly active users" });
    const target = await service.addObjective({ priorityId: priority.id, name: "Lift activation", assigneeThreadId: "thr_conversion" });
    const unsized = await service.addInvestment({ objectiveId: target.id, name: "Discord welcome bot" });
    const sized = await service.addInvestment({ objectiveId: target.id, name: "Onboarding checklist" });
    setMissing(unsized.id, "No data on Discord joins per signup");
    setLift(sized.id, 40, "not_started", 1);
    const lift = async () => {
      const view = await objective(target.id);
      return view.investments.map((entry) => liftText(view, entry));
    };

    expect(await lift()).toEqual(["Researching", null]);
    finishResearch("researching");
    expect(await lift()).toEqual(["Researching", null]);
    finishResearch("reconciling");
    expect(await lift()).toEqual(["Researching", null]);
    finishResearch("published");
    expect((await objective(target.id)).researchActive).toBe(false);
    expect(await lift()).toEqual(["—", null]);

    const proposed = await service.addObjective({ priorityId: priority.id, name: "Proposed", proposed: true, assigneeThreadId: "thr_paid" });
    await service.addInvestment({ objectiveId: proposed.id, name: "Waiting" });
    const waiting = await objective(proposed.id);
    expect(waiting.researchActive).toBe(true);
    expect(liftText(waiting, waiting.investments[0]!)).toBe("—");
  });
});

describe("team labels", () => {
  it("shows the live parent org before the team, and only the team when there's no live parent", async () => {
    const { service, objective } = setup();
    THREADS.thr_growth = { id: "thr_growth", name: "Growth", parentThreadId: null };
    THREADS.thr_team = { id: "thr_team", name: "Conversion", parentThreadId: "thr_growth" };
    try {
      const priority = await service.addPriority({ name: "Grow weekly active users" });
      const target = await service.addObjective({ priorityId: priority.id, name: "Lift activation", assigneeThreadId: "thr_team" });
      const view = await objective(target.id);
      expect(view.assignee).toEqual({ threadId: "thr_team", name: "Conversion", available: true, parent: { threadId: "thr_growth", name: "Growth" } });
      expect(teamLabel(view.assignee!)).toBe("Growth / Conversion");
      expect(objectiveMeta(view)).toBe("Growth / Conversion");
      delete THREADS.thr_growth;
      const orphan = await objective(target.id);
      expect(orphan.assignee?.parent).toBeNull();
      expect(teamLabel(orphan.assignee!)).toBe("Conversion");
    } finally {
      delete THREADS.thr_growth;
      delete THREADS.thr_team;
    }
  });
});

describe("unconfirmed Starts", () => {
  it("counts an uncertain Start as the team's work, blocking its other Starts but leaving the uncertain one as the retry", async () => {
    const { service, setLift, objectives, objective } = setup();
    const priority = await service.addPriority({ name: "Grow weekly active users" });
    const first = await service.addObjective({ priorityId: priority.id, name: "Lift activation", assigneeThreadId: "thr_conversion" });
    const second = await service.addObjective({ priorityId: priority.id, name: "Shorten install", assigneeThreadId: "thr_conversion" });
    const brief = { deliverable: "A checklist", acceptanceCriteria: "Ships" };
    const pending = await service.addInvestment({ objectiveId: first.id, name: "Onboarding checklist", brief });
    const rival = await service.addInvestment({ objectiveId: second.id, name: "Install-page copy test", brief });
    setLift(pending.id, 40, "not_started", 1);
    setLift(rival.id, 20, "not_started", 1);
    const starts: ActiveStart[] = [{ id: "st_1", investmentId: pending.id, assigneeThreadId: "thr_conversion", status: "uncertain" }];
    const all = await objectives();
    const firstView = await objective(first.id);
    const secondView = await objective(second.id);
    const mine = firstView.investments.find((entry) => entry.id === pending.id)!;
    const theirs = secondView.investments.find((entry) => entry.id === rival.id)!;

    expect(busyFor(all, "thr_conversion", starts)).toMatchObject({ investment: { id: pending.id }, start: { status: "uncertain" } });
    expect(startBlockedReason(all, secondView, starts, theirs)).toBe("Conversion is working on Onboarding checklist");
    expect(startBlockedReason(all, firstView, starts, mine)).toBeNull();
    expect(startRetryHint(starts, mine)).toContain("won't send twice");
    expect(startRetryHint(starts, theirs)).toBeNull();
    expect(startBlockedReason(all, secondView, [], theirs)).toBeNull();
  });
});

describe("navigation view model", () => {
  it("names the breadcrumb after where the portfolio was opened from", () => {
    expect(originLabel({ kind: "plan" })).toBe("Plan");
    expect(originLabel({ kind: "owner", owner: { kind: "team", threadId: "thr_conversion", name: "Conversion" } })).toBe("Conversion");
    expect(originLabel({ kind: "owner", owner: { kind: "org", threadId: "thr_growth", name: null } })).toBe("thr_growth");
  });

  it("groups assignee threads under their parent org and lists an org's objectives with its teams'", async () => {
    const { service, objectives } = setup();
    const priority = await service.addPriority({ name: "Grow weekly active users" });
    const conversion = await service.addObjective({ priorityId: priority.id, name: "Lift activation", assigneeThreadId: "thr_conversion" });
    const paid = await service.addObjective({ priorityId: priority.id, name: "Find a paid channel", assigneeThreadId: "thr_paid" });
    await service.addObjective({ priorityId: priority.id, name: "Unassigned" });
    const growth = { threadId: "thr_growth", name: "Growth" };
    const orgs = groupOrgs([
      { threadId: "thr_conversion", name: "Conversion", parent: growth },
      { threadId: "thr_paid", name: "Paid acquisition", parent: growth },
      { threadId: "thr_conversion", name: "Conversion", parent: growth },
      { threadId: "thr_community", name: "Community", parent: null },
    ]);
    expect(orgs).toEqual([
      { threadId: "thr_growth", name: "Growth", teams: [{ threadId: "thr_conversion", name: "Conversion" }, { threadId: "thr_paid", name: "Paid acquisition" }] },
      { threadId: "thr_community", name: "Community", teams: [] },
    ]);
    const all = await objectives();
    expect(ownerObjectives(all, orgs, { kind: "org", ...growth }).map((entry) => entry.id)).toEqual([conversion.id, paid.id]);
    expect(ownerObjectives(all, orgs, { kind: "team", threadId: "thr_paid", name: "Paid acquisition" }).map((entry) => entry.id)).toEqual([paid.id]);
  });
});

describe("inline edit helpers", () => {
  it("builds a metric patch with only changed fields and seeds a missing baseline", async () => {
    const { service } = setup();
    const priority = await service.addPriority({ name: "Grow weekly active users", metric: "weekly active users", now: 1450, target: 2000, by: "2027-01-31" });
    const view = (await service.overview()).priorities[0]!;
    expect(metricPatch(view, { now: "1,500", target: "2000", by: "2027-01-31" })).toEqual({ now: 1500, baseline: 1500 });
    expect(metricPatch(view, { now: "abc", target: "2000", by: "" })).toBe("Now must be a number");
    const patch = metricPatch(view, { now: "1500", target: "", by: "2027-02-28" });
    expect(patch).toEqual({ now: 1500, target: null, by: "2027-02-28", baseline: 1500 });
    const saved = await service.editPriority({ id: priority.id, expectedRevision: priority.revision, ...(patch as Record<string, unknown>) });
    expect(saved).toMatchObject({ now: 1500, target: null, by: "2027-02-28", baseline: 1500, revision: 2 });
  });

  it("resolves an @mention to a thread ID, an empty mention to unassigned, and an unknown name to nothing", () => {
    const options = [{ id: "thr_conversion", name: "Growth / Conversion" }];
    expect(chooseThread("@Growth / Conversion", options)).toEqual({ id: "thr_conversion" });
    expect(chooseThread("@growth / conversion", options)).toEqual({ id: "thr_conversion" });
    expect(chooseThread("@thr_paid", options)).toEqual({ id: "thr_paid" });
    expect(chooseThread("@", options)).toEqual({ id: null });
    expect(chooseThread("@Growth", options)).toBeNull();
    expect(chooseThread("@@Growth / Conversion", options)).toEqual({ id: "thr_conversion" });
    expect(mentionText("@@Gro")).toBe("@Gro");
    expect(mentionText("@Gro")).toBe("@Gro");
    expect(mentionText("Gro")).toBe("Gro");
    expect(threadQuery("@@Gro")).toBe("Gro");
  });
});
