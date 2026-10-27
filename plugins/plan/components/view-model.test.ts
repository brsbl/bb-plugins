import Database from "better-sqlite3";
import { describe, expect, it } from "vitest";
import type { InvestmentState, Lift, ResearchEvidence } from "../model.js";
import { createPlanService, type ThreadInfo } from "../service.js";
import type { Migrate } from "../store.js";
import {
  allObjectives, busyFor, canShowStart, chooseThread, emptyPortfolioText, evidenceSources, formatAmount, formatBy, funnelSummary, groupOrgs, liftText,
  liveOwner, metricPatch, objectiveMeta, orderedObjectives, originLabel, mentionText, ownerObjectives, portfolioRows, researchFinishedUnsized,
  startBlockedReason, startRetryHint, teamLabel, threadQuery, unitLabel, unknownLiftText,
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
      metricLink: null, cost: "1 week", dependencies: "Discord admin access",
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
    expect(liftText(view, discord)).toBe("Researching");
    expect(discord.research).toMatchObject({ cost: "1 week", dependencies: "Discord admin access" });
    expect(liftText(view, view.investments.find((entry) => entry.id === added[4]!.id)!)).toBe("Unranked");
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
    expect(emptyPortfolioText(await objective(proposed.id))).toBe("Research starts once the objective is approved");
    expect(unknownLiftText(await objective(assigned.id))).toBe("Researching");
    expect(unknownLiftText(await objective(unassigned.id))).toBe("—");
    expect(unknownLiftText(await objective(proposed.id))).toBe("—");

    await service.assignObjective({ id: unassigned.id, expectedRevision: 1, assigneeThreadId: "thr_paid" });
    expect(emptyPortfolioText(await objective(unassigned.id))).toBe("Researching");
  });

  it("blocks Start on every objective of a team with work in progress, but not on other teams", async () => {
    const { db, service, setLift, objectives, objective } = setup();
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
    expect(startBlockedReason(all, otherView, [], otherView.investments.find((entry) => entry.id === bare.id))).toBe("Complete the brief first: deliverable, scope, acceptance criteria, measurement and sources");
    const partial = await service.addInvestment({ objectiveId: other.id, name: "Two fields", brief: { deliverable: "A thing", acceptanceCriteria: "Ships" } });
    const partialView = await objective(other.id);
    expect(startBlockedReason(all, partialView, [], partialView.investments.find((entry) => entry.id === partial.id))).toContain("Complete the brief first");
    expect(objectiveMeta(await objective(first.id))).toBe("Growth / Conversion · In progress: Install-page copy test");
    expect(objectiveMeta(await objective(unassigned.id))).toBe("Unassigned");

    setLift(running.id, 35, "done");
    expect(startBlockedReason(await objectives(), await objective(second.id), [])).toBeNull();
    const assess = await service.editObjective({ id: second.id, expectedRevision: second.revision, name: "Shorten install flow" });
    const [request] = await service.listResearchRequests({ kind: "assess_edit" });
    db.prepare("INSERT INTO research_holds (objective_id, request_id, reason, created_at) VALUES (?, ?, 'Checking whether this edit changes the research', 'x')").run(assess.id, request!.id);
    expect(startBlockedReason(await objectives(), await objective(second.id), [])).toBe("Checking whether this edit changes the research");
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
  it("shows Researching for every investment without checked lift while its objective is approved and assigned, even after a run couldn't size it", async () => {
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
    expect(await lift()).toEqual(["Researching", null]);

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
    const brief = { deliverable: "A checklist", scope: "First thread", acceptanceCriteria: "Ships", measurement: "WAU", sources: ["https://notes.example"] };
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

  it("reads owner headings and breadcrumb labels from the live org list, so renames follow", () => {
    const orgs = [{ threadId: "thr_growth", name: "Growth org", teams: [{ threadId: "thr_conversion", name: "Activation" }] }];
    const team = { kind: "team" as const, threadId: "thr_conversion", name: "Conversion" };
    expect(liveOwner(orgs, team).name).toBe("Activation");
    expect(liveOwner(orgs, { kind: "org", threadId: "thr_growth", name: "Growth" }).name).toBe("Growth org");
    expect(originLabel({ kind: "owner", owner: team }, orgs)).toBe("Activation");
    expect(liveOwner([], team).name).toBe("Conversion");
  });

  it("lists proposed objectives after adopted ones in computed rank order, with owner and base lift", async () => {
    const { db, service } = setup();
    const priority = await service.addPriority({ name: "Grow weekly active users" });
    const adopted = await service.addObjective({ priorityId: priority.id, name: "Adopted" });
    const low = await service.addObjective({ priorityId: priority.id, name: "Low", proposed: true });
    const unsized = await service.addObjective({ priorityId: priority.id, name: "Unsized", proposed: true, assigneeThreadId: "thr_paid" });
    const high = await service.addObjective({ priorityId: priority.id, name: "High", proposed: true });
    const evidence = (base: number | null) => JSON.stringify({
      requestId: "rr_1", submissionThreadIds: ["thr_a", "thr_b"], reconciliationThreadId: "thr_r", basis: null,
      lift: base === null ? null : { low: base - 5, base, high: base + 5, unit: "weekly active users" }, missing: null, funnelSteps: null,
      rationale: "Why", ownerProposal: "Growth / Conversion owns onboarding", metricLink: null, cost: null, dependencies: null,
    });
    db.prepare("UPDATE plan_objectives SET research = ?, rank = ? WHERE id = ?").run(evidence(10), 2, low.id);
    db.prepare("UPDATE plan_objectives SET research = ?, rank = ? WHERE id = ?").run(evidence(80), 1, high.id);
    db.prepare("UPDATE plan_objectives SET research = ?, rank = NULL WHERE id = ?").run(evidence(null), unsized.id);
    const objectives = (await service.overview()).priorities[0]!.objectives;
    const ordered = orderedObjectives(objectives);
    expect(ordered.map((entry) => entry.id)).toEqual([adopted.id, high.id, low.id, unsized.id]);
    expect(objectiveMeta(ordered[1]!)).toBe("Proposed · Growth / Conversion owns onboarding · +80");
    expect(objectiveMeta(ordered[3]!)).toBe("Proposed · Growth / Paid acquisition");
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
    const same = { baseline: "", now: "1450", target: "2000", by: "2027-01-31", metric: "weekly active users", metricFormat: "number" as const, constraints: "" };
    expect(metricPatch(view, { ...same, now: "1,500" })).toEqual({ now: 1500, baseline: 1500 });
    expect(metricPatch(view, { ...same, now: "abc", by: "" })).toBe("Now must be a number");
    expect(metricPatch(view, { ...same, baseline: "x" })).toBe("Baseline must be a number");
    const patch = metricPatch(view, { ...same, now: "1500", target: "", by: "2027-02-28" });
    expect(patch).toEqual({ now: 1500, target: null, by: "2027-02-28", baseline: 1500 });
    const saved = await service.editPriority({ id: priority.id, expectedRevision: priority.revision, ...(patch as Record<string, unknown>) });
    expect(saved).toMatchObject({ now: 1500, target: null, by: "2027-02-28", baseline: 1500, revision: 2 });
    const current = (await service.overview()).priorities[0]!;
    const edit = metricPatch(current, { baseline: "1200", now: "1500", target: "", by: "2027-02-28", metric: "4-week retention", metricFormat: "percent", constraints: "No paid ads" });
    expect(edit).toEqual({ baseline: 1200, metric: "4-week retention", metricFormat: "percent", constraints: "No paid ads" });
    expect(await service.editPriority({ id: priority.id, expectedRevision: 2, ...(edit as Record<string, unknown>) })).toMatchObject({ baseline: 1200, metric: "4-week retention", metricFormat: "percent", constraints: "No paid ads" });
  });

  it("formats metric values by the priority's format, lowercases a sentence-case unit, and drops the year for dates within a year", async () => {
    const { service } = setup();
    expect((await service.addPriority({ name: "Keep teams", metric: "4-week retention", now: 40 })).metricFormat).toBe("percent");
    expect((await service.addPriority({ name: "Activation", metric: "Activation %" })).metricFormat).toBe("percent");
    expect((await service.addPriority({ name: "Grow", metric: "weekly active users" })).metricFormat).toBe("number");
    expect((await service.addPriority({ name: "Override", metric: "retained teams", metricFormat: "number" })).metricFormat).toBe("number");
    expect(formatAmount(40, "percent")).toBe("40%");
    expect(formatAmount(1450, "number")).toBe("1,450");
    expect(unitLabel("Added week-1 active users")).toBe("added week-1 active users");
    expect(unitLabel("WAU")).toBe("WAU");
    const today = new Date("2026-10-27T12:00:00Z");
    expect(formatBy("2026-12-31", today)).toBe("Dec 31");
    expect(formatBy("2027-01-31", today)).toBe("Jan 31");
    expect(formatBy("2027-12-31", today)).toBe("Dec 31, 2027");
    expect(formatBy("2025-01-31", today)).toBe("Jan 31, 2025");
  });

  it("summarizes funnel steps in one row and includes every step source in Sources", () => {
    const investment = {
      lift: { sources: ["https://a.example"] }, brief: { sources: ["https://brief.example"] },
      research: { metricLink: null, funnelSteps: [
        { step: "Download", value: 1, unit: "x", sources: ["https://d.example"], linkToNext: { rate: 0.5, sources: ["https://link.example"] } },
        { step: "install", value: 1, unit: "x", sources: ["https://i.example"], linkToNext: null },
      ] },
    } as unknown as Parameters<typeof funnelSummary>[0];
    expect(funnelSummary(investment)).toBe("Download → install, each step sourced");
    expect(evidenceSources(investment)).toEqual(["https://a.example", "https://brief.example", "https://d.example", "https://link.example", "https://i.example"]);
  });

  it("resolves an @mention to a thread ID, an empty mention to unassigned, and an unknown name to nothing", () => {
    const options = [{ id: "thr_conversion", name: "Conversion", label: "Growth / Conversion" }, { id: "thr_conv2", name: "Conversion", label: "Product / Conversion" }];
    expect(chooseThread("@Product / Conversion", options)).toEqual({ id: "thr_conv2" });
    expect(chooseThread("Unassign", options)).toEqual({ id: null });
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
