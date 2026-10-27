import Database from "better-sqlite3";
import { createFakePluginHost, makeThreadResponse } from "@get-bb/plugin-sdk/testing";
import { afterEach, describe, expect, it } from "vitest";
import type { Lift } from "./model.js";
import plugin from "./server.js";
import { createPlanService, PlanError } from "./service.js";
import { acceptanceCriteria, briefMessage, classifySendError, createStartService, SendFailure, type StartHost, type TeamThread } from "./start.js";
import type { Migrate } from "./store.js";

const migrate: Migrate = (db, statements) => {
  db.exec("CREATE TABLE IF NOT EXISTS test_migrations (id INTEGER PRIMARY KEY)");
  statements.forEach((statement, id) => {
    if (db.prepare("SELECT 1 FROM test_migrations WHERE id = ?").get(id)) return;
    db.exec(statement);
    db.prepare("INSERT INTO test_migrations (id) VALUES (?)").run(id);
  });
};

const CRITERIA = "- Checklist shows in every new first thread\n- Completion is tracked in Analytics";
const BRIEF = {
  deliverable: "Onboarding checklist shipped in the first thread",
  scope: "First-thread empty state only",
  acceptanceCriteria: CRITERIA,
  measurement: "Week-1 active (Analytics definition)",
  sources: ["https://notes.example/onboarding"],
};

type SendMode = "ok" | "lost" | "timeout" | "rejected";

function fakeHost() {
  const threads: Record<string, TeamThread> = {
    thr_conversion: { id: "thr_conversion", name: "Growth / Conversion", parentThreadId: "thr_growth" },
    thr_paid: { id: "thr_paid", name: "Growth / Paid acquisition", parentThreadId: "thr_growth" },
    thr_growth: { id: "thr_growth", name: "Growth", parentThreadId: null },
    thr_worker: { id: "thr_worker", name: "Checklist worker", parentThreadId: "thr_conversion" },
    thr_grandworker: { id: "thr_grandworker", name: "Checklist QA", parentThreadId: "thr_worker" },
    thr_planner: { id: "thr_planner", name: "Planning", parentThreadId: null },
  };
  const delivered: Array<{ threadId: string; text: string }> = [];
  const state = { sendAttempts: 0, modes: [] as SendMode[], delayMs: 0, checkFails: false };
  const host: StartHost = {
    thread: async (threadId) => threads[threadId] ?? null,
    send: async (threadId, text) => {
      state.sendAttempts += 1;
      if (state.delayMs) await new Promise((done) => setTimeout(done, state.delayMs));
      const mode = state.modes.shift() ?? "ok";
      if (mode === "rejected") throw Object.assign(new Error("HTTP 400: thread is archived"), { status: 400 });
      if (mode === "timeout") throw new Error("BB request timed out after 30 seconds.");
      delivered.push({ threadId, text });
      if (mode === "lost") throw new Error("socket hang up");
    },
    wasSent: async (threadId, marker) => {
      if (state.checkFails) throw new Error("connection refused");
      return delivered.some((entry) => entry.threadId === threadId && entry.text.includes(marker));
    },
  };
  return { host, threads, delivered, state };
}

async function setup() {
  const db = new Database(":memory:");
  const fake = fakeHost();
  const now = () => new Date("2026-10-27T12:00:00Z");
  const plan = createPlanService({ db, migrate, findThread: async (id) => fake.threads[id] ?? null, publish: () => {}, now });
  const starts = createStartService({ db, migrate, host: fake.host, publish: () => {}, now });
  const lift: Lift = { low: 30, base: 60, high: 95, unit: "added week-1 active users", method: "Forecast", cost: "2 weeks", dependencies: "None", sources: [] };
  const checked = (id: string, rank = 1) => db.prepare("UPDATE plan_investments SET lift = ?, rank = ? WHERE id = ?").run(JSON.stringify(lift), rank, id);
  const priority = await plan.addPriority({ name: "Grow weekly active users" });
  const objective = await plan.addObjective({ priorityId: priority.id, name: "Lift activation", assigneeThreadId: "thr_conversion" });
  const sibling = await plan.addObjective({ priorityId: priority.id, name: "Shorten install", assigneeThreadId: "thr_conversion" });
  const paid = await plan.addObjective({ priorityId: priority.id, name: "Find a paid channel", assigneeThreadId: "thr_paid" });
  const ready = async (objectiveId: string, name: string, rank = 1) => {
    const investment = await plan.addInvestment({ objectiveId, name, brief: BRIEF });
    checked(investment.id, rank);
    return investment;
  };
  const state = (id: string) => (db.prepare("SELECT state FROM plan_investments WHERE id = ?").get(id) as { state: string }).state;
  return { db, plan, starts, fake, checked, priority, objective, sibling, paid, ready, state };
}

async function rejects(run: Promise<unknown>, code: string) {
  const error = await run.then(() => null, (caught: unknown) => caught);
  expect(error).toBeInstanceOf(PlanError);
  expect((error as PlanError).code).toBe(code);
  return error as PlanError;
}

const delivery = (overrides: Record<string, unknown> = {}) => ({
  deliverable: "Checklist live behind the onboarding flag: https://github.example/pr/12",
  criteria: [
    { criterion: "Checklist shows in every new first thread", evidence: "QA run on 20 fresh threads: https://qa.example/run/4" },
    { criterion: "Completion is tracked in Analytics", evidence: "Event checklist_completed on the Analytics board: https://analytics.example/e/9" },
  ],
  measurement: "Week-1 active from the Analytics definition, read weekly",
  ...overrides,
});

describe("Start preconditions", () => {
  it("refuses each missing precondition and sends nothing", async () => {
    const { plan, starts, fake, checked, priority, objective, ready, db } = await setup();
    const unranked = await plan.addInvestment({ objectiveId: objective.id, name: "Unranked", brief: BRIEF });
    expect((await rejects(starts.start({ id: unranked.id }), "not_ready")).message).toContain("lift isn't checked and reconciled");

    const proposed = await plan.addObjective({ priorityId: priority.id, name: "Proposed", proposed: true, assigneeThreadId: "thr_paid" });
    const unapproved = await ready(proposed.id, "Unapproved");
    expect((await rejects(starts.start({ id: unapproved.id }), "not_ready")).message).toContain("Approve its objective first");

    const unassigned = await plan.addObjective({ priorityId: priority.id, name: "Nobody" });
    const orphan = await ready(unassigned.id, "Orphan");
    expect((await rejects(starts.start({ id: orphan.id }), "not_ready")).message).toContain("Assign a team first");

    const noDeliverable = await plan.addInvestment({ objectiveId: objective.id, name: "No deliverable", brief: { ...BRIEF, deliverable: undefined } });
    checked(noDeliverable.id);
    expect((await rejects(starts.start({ id: noDeliverable.id }), "not_ready")).message).toContain("brief.deliverable");

    for (const field of ["scope", "measurement", "sources"] as const) {
      const partial = await plan.addInvestment({ objectiveId: objective.id, name: `No ${field}`, brief: { ...BRIEF, [field]: undefined } });
      checked(partial.id);
      expect((await rejects(starts.start({ id: partial.id }), "not_ready")).message).toContain(`brief.${field}`);
    }

    const noCriteria = await plan.addInvestment({ objectiveId: objective.id, name: "No criteria", brief: { deliverable: "A thing" } });
    checked(noCriteria.id);
    const both = await rejects(starts.start({ id: noCriteria.id }), "not_ready");
    expect(both.message).toContain("brief.acceptanceCriteria");
    expect(both.hint).toContain(`bb plan investment edit ${noCriteria.id}`);

    const gone = await plan.addObjective({ priorityId: priority.id, name: "Gone team", assigneeThreadId: "thr_planner" });
    const ghost = await ready(gone.id, "Ghost");
    delete fake.threads.thr_planner;
    await rejects(starts.start({ id: ghost.id }), "unknown_thread");

    const finished = await ready(objective.id, "Finished");
    db.prepare("UPDATE plan_investments SET state = 'done' WHERE id = ?").run(finished.id);
    await rejects(starts.start({ id: finished.id }), "wrong_state");
    await rejects(starts.start({ id: "inv_missing" }), "not_found");
    expect(fake.state.sendAttempts).toBe(0);
  });
});

describe("existing activity already running", () => {
  it("sets an existing investment In progress without sending, from the user or any agent thread, and obeys one per team", async () => {
    const { plan, starts, fake, objective, sibling, state } = await setup();
    const running = await plan.addInvestment({ objectiveId: objective.id, name: "Install-page copy test", existing: true });
    const fresh = await plan.addInvestment({ objectiveId: objective.id, name: "Brand new", brief: BRIEF });
    const other = await plan.addInvestment({ objectiveId: sibling.id, name: "Also running", existing: true });

    await rejects(starts.markInProgress({ id: fresh.id }), "wrong_state");
    expect(await starts.markInProgress({ id: running.id })).toMatchObject({ state: "in_progress" });
    expect(fake.state.sendAttempts).toBe(0);
    expect(fake.delivered).toEqual([]);
    expect((await rejects(starts.markInProgress({ id: other.id }), "team_busy")).message).toContain("Install-page copy test");
    await rejects(starts.markInProgress({ id: running.id }), "wrong_state");

    const done = await starts.deliver({ id: running.id, output: {
      deliverable: "Copy test concluded: https://notes.example/result", criteria: [{ criterion: "Test reached significance", evidence: "Readout: https://analytics.example/r/1" }],
    } }, "thr_conversion");
    expect(done.state).toBe("done");
    expect(await starts.markInProgress({ id: other.id })).toMatchObject({ state: "in_progress" });
    expect(state(other.id)).toBe("in_progress");
  });
});

describe("one investment at a time per team", () => {
  it("sends the saved brief, marks it In progress, and blocks the team's other investments under any objective", async () => {
    const { starts, fake, objective, sibling, paid, ready, state } = await setup();
    const first = await ready(objective.id, "Onboarding checklist");
    const second = await ready(objective.id, "Day-2 email nudge", 2);
    const elsewhere = await ready(sibling.id, "Install-page copy test");
    const otherTeam = await ready(paid.id, "Search-intent landing test");

    const started = await starts.start({ id: first.id });
    expect(started.state).toBe("in_progress");
    expect(fake.delivered).toHaveLength(1);
    const message = fake.delivered[0]!;
    expect(message.threadId).toBe("thr_conversion");
    for (const part of [BRIEF.deliverable, BRIEF.scope, "1. Checklist shows in every new first thread", "2. Completion is tracked in Analytics", BRIEF.measurement, BRIEF.sources[0]!, first.id, `bb plan investment deliver --id ${first.id} --output`]) {
      expect(message.text).toContain(part);
    }

    expect((await rejects(starts.start({ id: second.id }), "team_busy")).message).toBe("Conversion is working on Onboarding checklist.");
    await rejects(starts.start({ id: elsewhere.id }), "team_busy");
    expect((await starts.start({ id: otherTeam.id })).state).toBe("in_progress");
    expect(await starts.start({ id: first.id })).toMatchObject({ state: "in_progress" });
    expect(fake.delivered).toHaveLength(2);
    expect([state(second.id), state(elsewhere.id)]).toEqual(["not_started", "not_started"]);
  });

  it("lets two simultaneous starts send exactly once", async () => {
    const { starts, fake, objective, sibling, ready, state } = await setup();
    const first = await ready(objective.id, "Onboarding checklist");
    const rival = await ready(sibling.id, "Install-page copy test");
    fake.state.delayMs = 10;
    const results = await Promise.allSettled([starts.start({ id: first.id }), starts.start({ id: first.id }), starts.start({ id: rival.id })]);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    const codes = results.flatMap((result) => (result.status === "rejected" ? [(result.reason as PlanError).code] : []));
    expect(codes.sort()).toEqual(["start_pending", "team_busy"]);
    expect(fake.state.sendAttempts).toBe(1);
    expect([state(first.id), state(rival.id)]).toEqual(["in_progress", "not_started"]);
  });
});

describe("send failures", () => {
  it("keeps an uncertain start reserved, then confirms the accepted message on retry without sending again", async () => {
    const { starts, fake, objective, sibling, ready, state } = await setup();
    const first = await ready(objective.id, "Onboarding checklist");
    const rival = await ready(sibling.id, "Install-page copy test");
    fake.state.modes = ["lost"];
    const uncertain = await rejects(starts.start({ id: first.id }), "send_uncertain");
    expect(uncertain.hint).toContain("won't send twice");
    expect(state(first.id)).toBe("not_started");
    await rejects(starts.start({ id: rival.id }), "team_busy");

    fake.state.checkFails = true;
    await rejects(starts.start({ id: first.id }), "send_uncertain");
    fake.state.checkFails = false;
    expect((await starts.start({ id: first.id })).state).toBe("in_progress");
    expect(fake.delivered).toHaveLength(1);
    expect(fake.state.sendAttempts).toBe(1);
  });

  it("resends the same brief once when the uncertain send never arrived", async () => {
    const { starts, fake, objective, ready } = await setup();
    const first = await ready(objective.id, "Onboarding checklist");
    fake.state.modes = ["timeout"];
    await rejects(starts.start({ id: first.id }), "send_uncertain");
    expect(fake.delivered).toHaveLength(0);
    expect((await starts.start({ id: first.id })).state).toBe("in_progress");
    expect(await starts.start({ id: first.id })).toMatchObject({ state: "in_progress" });
    expect(fake.delivered).toHaveLength(1);
    expect(fake.state.sendAttempts).toBe(2);
  });

  it("releases the team on a definite failure and surfaces the error", async () => {
    const { starts, fake, objective, sibling, ready, state } = await setup();
    const first = await ready(objective.id, "Onboarding checklist");
    const rival = await ready(sibling.id, "Install-page copy test");
    fake.state.modes = ["rejected"];
    expect((await rejects(starts.start({ id: first.id }), "send_failed")).message).toContain("thread is archived");
    expect(state(first.id)).toBe("not_started");
    expect((await starts.start({ id: rival.id })).state).toBe("in_progress");
    expect(fake.delivered.map((entry) => entry.text.includes(rival.id))).toEqual([true]);
  });

  it("lists an uncertain Start as active and keeps the team busy until it is confirmed", async () => {
    const { starts, fake, objective, sibling, ready } = await setup();
    const first = await ready(objective.id, "Onboarding checklist");
    const rival = await ready(sibling.id, "Install-page copy test");
    fake.state.modes = ["timeout"];
    await rejects(starts.start({ id: first.id }), "send_uncertain");
    expect(starts.active()).toEqual([expect.objectContaining({ investmentId: first.id, assigneeThreadId: "thr_conversion", status: "uncertain" })]);
    expect((await rejects(starts.start({ id: rival.id }), "team_busy")).message).toBe("Conversion is working on Onboarding checklist.");
  });

  it("confirms an uncertain Start in the background once the brief shows up, without ever sending", async () => {
    const { starts, fake, objective, ready, state } = await setup();
    const first = await ready(objective.id, "Onboarding checklist");
    fake.state.modes = ["lost"];
    await rejects(starts.start({ id: first.id }), "send_uncertain");
    fake.state.checkFails = true;
    expect(await starts.reconcile()).toBe(0);
    expect(starts.active()).toMatchObject([{ status: "uncertain" }]);
    fake.state.checkFails = false;
    expect(await starts.reconcile()).toBe(1);
    expect(state(first.id)).toBe("in_progress");
    expect(starts.active()).toMatchObject([{ status: "sent" }]);
    expect(await starts.reconcile()).toBe(0);
    expect(fake.state.sendAttempts).toBe(1);
  });

  it("leaves an undelivered uncertain Start for the user's retry instead of resending it in the background", async () => {
    const { starts, fake, objective, ready, state } = await setup();
    const first = await ready(objective.id, "Onboarding checklist");
    fake.state.modes = ["timeout"];
    await rejects(starts.start({ id: first.id }), "send_uncertain");
    expect(await starts.reconcile()).toBe(0);
    expect(await starts.reconcile()).toBe(0);
    expect(fake.state.sendAttempts).toBe(1);
    expect(state(first.id)).toBe("not_started");
    expect(starts.active()).toMatchObject([{ status: "uncertain" }]);
    expect((await starts.start({ id: first.id })).state).toBe("in_progress");
    expect(fake.delivered).toHaveLength(1);
  });

  it("treats 4xx responses as definite and timeouts, 5xx and lost connections as uncertain", () => {
    expect(classifySendError(Object.assign(new Error("bad"), { status: 404 })).definite).toBe(true);
    expect(classifySendError(Object.assign(new Error("timeout"), { status: 408 })).definite).toBe(false);
    expect(classifySendError(Object.assign(new Error("down"), { status: 503 })).definite).toBe(false);
    expect(classifySendError(new Error("socket hang up")).definite).toBe(false);
    expect(classifySendError(new SendFailure(true, "no")).definite).toBe(true);
  });
});

describe("Done", () => {
  async function started() {
    const context = await setup();
    const first = await context.ready(context.objective.id, "Onboarding checklist");
    const next = await context.ready(context.sibling.id, "Install-page copy test");
    await context.starts.start({ id: first.id });
    return { ...context, first, next };
  }

  it("rejects an absent caller, unrelated threads, a bare finished and missing per-criterion evidence", async () => {
    const { starts, first, state } = await started();
    await rejects(starts.deliver({ id: first.id, output: delivery() }, null), "not_assignee");
    await rejects(starts.deliver({ id: first.id, output: delivery() }, "thr_planner"), "not_assignee");
    await rejects(starts.deliver({ id: first.id, output: delivery() }, "thr_growth"), "not_assignee");
    await rejects(starts.deliver({ id: first.id, output: delivery() }, "thr_paid"), "not_assignee");
    await rejects(starts.deliver({ id: first.id, output: "finished" }, "thr_conversion"), "rejected");
    await rejects(starts.deliver({ id: first.id, output: { deliverable: "finished" } }, "thr_conversion"), "rejected");
    const partial = await rejects(starts.deliver({ id: first.id, output: delivery({ criteria: [delivery().criteria[0]] }) }, "thr_conversion"), "rejected");
    expect(partial.message).toContain('Acceptance criterion not addressed: "Completion is tracked in Analytics"');
    const trivial = await rejects(starts.deliver({ id: first.id, output: delivery({ criteria: [delivery().criteria[0], { criterion: "Completion is tracked in Analytics", evidence: "done" }] }) }, "thr_conversion"), "rejected");
    expect(trivial.message).toContain("isn't evidence");
    const invented = await rejects(starts.deliver({ id: first.id, output: delivery({ criteria: [...delivery().criteria, { criterion: "Looks nice", evidence: "Screenshot" }] }) }, "thr_conversion"), "rejected");
    expect(invented.message).toContain("isn't one of this investment's acceptance criteria");
    const unmeasured = await rejects(starts.deliver({ id: first.id, output: delivery({ measurement: undefined }) }, "thr_conversion"), "rejected");
    expect(unmeasured.message).toContain("measurement");
    expect(state(first.id)).toBe("in_progress");
  });

  it("marks Done from a worker of the team thread and frees the team without starting the next investment", async () => {
    const { starts, fake, first, next, state, db } = await started();
    await rejects(starts.start({ id: next.id }), "team_busy");
    const done = await starts.deliver({ id: first.id, output: JSON.stringify(delivery()) }, "thr_grandworker");
    expect(done.state).toBe("done");
    expect(db.prepare("SELECT thread_id FROM plan_deliveries WHERE investment_id = ?").get(first.id)).toEqual({ thread_id: "thr_grandworker" });
    expect(state(next.id)).toBe("not_started");
    expect(fake.delivered).toHaveLength(1);
    await rejects(starts.deliver({ id: first.id, output: delivery() }, "thr_conversion"), "wrong_state");
    expect((await starts.start({ id: next.id })).state).toBe("in_progress");
    expect(fake.delivered).toHaveLength(2);
  });
});

describe("brief helpers", () => {
  it("splits acceptance criteria into one criterion per line, dropping bullets and numbering", () => {
    expect(acceptanceCriteria("1. First\n  2) Second\n\n- Third\n* [x] Fourth\nFifth")).toEqual(["First", "Second", "Third", "Fourth", "Fifth"]);
  });

  it("quotes the deliver command so it pastes into a shell", async () => {
    const { plan, objective } = await setup();
    const investment = await plan.addInvestment({ objectiveId: objective.id, name: "Quote test", brief: { deliverable: "x", acceptanceCriteria: "Team's sign-off" } });
    const text = briefMessage({ startId: "st_1", investment, objective });
    expect(text).toContain(`"criterion":"Team'\\''s sign-off"`);
  });
});

describe("plugin wiring", () => {
  const disposers: Array<() => Promise<void>> = [];
  afterEach(async () => { for (const dispose of disposers.splice(0)) await dispose(); });

  it("starts from the panel RPC through bb.sdk.threads.send, reconciles a lost reply from the thread's messages in the background, and delivers from the CLI", async () => {
    const THREADS = {
      thr_conversion: makeThreadResponse({ id: "thr_conversion", title: "Conversion", parentThreadId: "thr_growth" }),
      thr_growth: makeThreadResponse({ id: "thr_growth", title: "Growth", parentThreadId: null }),
      thr_worker: makeThreadResponse({ id: "thr_worker", title: "Worker", parentThreadId: "thr_conversion" }),
    };
    const requested: string[] = [];
    let loseReply = true;
    const { bb, harness } = createFakePluginHost({
      pluginId: "plan",
      sdk: {
        threads: {
          get: async ({ threadId }) => {
            const thread = THREADS[threadId as keyof typeof THREADS];
            if (!thread) throw new Error("thread not found");
            return thread;
          },
          send: async (args) => {
            const part = args.input[0];
            requested.push(part && part.type === "text" ? part.text : "");
            if (loseReply) { loseReply = false; throw new Error("socket hang up"); }
            return { ok: true, delivery: "sent" };
          },
          queuedMessages: { list: async () => [] },
          events: {
            list: async ({ threadId, limit, beforeSeq, order }) => {
              expect(limit).toBe("100");
              expect(order).toBe("desc");
              const texts = [...requested, ...Array.from({ length: 100 }, () => "Unrelated later message")];
              return texts.map((text, index) => ({
                id: `evt_${index}`, threadId, seq: index + 1, createdAt: 1, scope: { kind: "thread" }, type: "client/turn/requested",
                data: { input: [{ type: "text", text, mentions: [] }] },
              })).filter(event => beforeSeq === undefined || event.seq < Number(beforeSeq)).reverse().slice(0, 100) as never;
            },
          },
        },
      },
    });
    plugin(bb);
    disposers.push(() => harness.lifecycle.dispose());
    const rpc = (method: string, input: unknown) => harness.behavior.callRpc(method, input) as Promise<{ ok: boolean; code?: string; value?: { id: string; state: string } }>;
    const priority = await rpc("addPriority", { name: "Grow weekly active users", originThreadId: "thr_growth" });
    const objective = await rpc("addObjective", { priorityId: priority.value!.id, name: "Lift activation", assigneeThreadId: "thr_conversion", originThreadId: "thr_growth" });
    const investment = await rpc("addInvestment", { objectiveId: objective.value!.id, name: "Onboarding checklist", brief: BRIEF });
    bb.storage.database().prepare("UPDATE plan_investments SET lift = ?, rank = 1 WHERE id = ?")
      .run(JSON.stringify({ low: 30, base: 60, high: 95, unit: "users", method: "Forecast", cost: "2 weeks", dependencies: "None", sources: [] }), investment.value!.id);

    expect(await rpc("startInvestment", { id: investment.value!.id })).toMatchObject({ ok: false, code: "send_uncertain" });
    const uncertain = await harness.behavior.callRpc("snapshot", {}) as { starts: unknown[] };
    expect(uncertain.starts).toEqual([expect.objectContaining({ investmentId: investment.value!.id, status: "uncertain" })]);
    const run = harness.behavior.runService("research-runner");
    await new Promise((done) => setTimeout(done, 20));
    run.controller.abort();
    await run.done;
    const confirmed = await harness.behavior.callRpc("snapshot", {}) as { starts: unknown[] };
    expect(confirmed.starts).toEqual([expect.objectContaining({ investmentId: investment.value!.id, status: "sent" })]);
    expect(await rpc("startInvestment", { id: investment.value!.id })).toMatchObject({ ok: true, value: { state: "in_progress" } });
    const sends = harness.inspection.sdk.callsTo("threads.send").map((call) => call[0] as Record<string, unknown>);
    expect(sends).toHaveLength(1);
    expect(sends[0]).toMatchObject({ threadId: "thr_conversion", mode: "queue-if-active" });
    expect(sends[0]).not.toHaveProperty("senderThreadId");

    const id = investment.value!.id;
    const outsider = await harness.behavior.runCli(["investment", "deliver", "--id", id, "--output", JSON.stringify(delivery()), "--json"], { threadId: "thr_growth" });
    expect(JSON.parse(outsider.stdout)).toMatchObject({ ok: false, error: { code: "not_assignee" } });
    const bare = await harness.behavior.runCli(["investment", "deliver", "--id", id, "--output", "{\"deliverable\":\"finished\"}", "--json"], { threadId: "thr_worker" });
    expect(JSON.parse(bare.stdout)).toMatchObject({ ok: false, error: { code: "rejected" } });
    const done = await harness.behavior.runCli(["investment", "deliver", "--id", id, "--output", JSON.stringify(delivery()), "--json"], { threadId: "thr_worker" });
    expect(JSON.parse(done.stdout)).toMatchObject({ id, state: "done" });

    const tool = await harness.behavior.callAgentTool("plan", { action: "investment_start", id }, { threadId: "thr_conversion" });
    const part = typeof tool === "string" ? null : tool.content[0];
    expect(part && part.type === "text" ? JSON.parse(part.text) : null).toMatchObject({ ok: false, error: { code: "wrong_state" } });
  });
});
