import { createFakePluginHost, makeThreadResponse } from "@get-bb/plugin-sdk/testing";
import { afterEach, describe, expect, it } from "vitest";
import plugin from "./server.js";

const disposers: Array<() => Promise<void>> = [];
afterEach(async () => { for (const dispose of disposers.splice(0)) await dispose(); });

function setup() {
  const { bb, harness } = createFakePluginHost({
    pluginId: "plan",
    sdk: {
      threads: {
        get: async ({ threadId }) => {
          if (threadId === "thr_growthconv") return makeThreadResponse({ id: threadId, title: "Growth / Conversion" });
          if (threadId === "thr_deletedteam") return makeThreadResponse({ id: threadId, title: "Old team", deletedAt: 1 });
          throw new Error("thread not found");
        },
      },
    },
  });
  plugin(bb);
  disposers.push(() => harness.lifecycle.dispose());
  const db = bb.storage.database();
  const cli = async (argv: string[]) => {
    const result = await harness.behavior.runCli(argv);
    return { ...result, body: result.stdout ? JSON.parse(result.stdout) : null };
  };
  const tool = async (input: Record<string, unknown>) => {
    const result = await harness.behavior.callAgentTool("plan", input);
    if (typeof result === "string") return { isError: false, body: JSON.parse(result) };
    const part = result.content[0];
    return { isError: result.isError === true, body: part && part.type === "text" ? JSON.parse(part.text) : null };
  };
  const requests = (kind: string) => db.prepare("SELECT subject_id AS subjectId FROM research_requests WHERE kind = ?").all(kind);
  return { harness, cli, tool, requests };
}

describe("bb plan CLI and plan tool", () => {
  it("edit the same records, and a stale edit from either side is rejected", async () => {
    const { cli, tool } = setup();
    const priority = (await cli(["priority", "add", "Grow weekly active users", "--metric", "weekly active users", "--now", "1,450", "--target", "2000", "--by", "2027-01-31", "--json"])).body;
    expect(priority).toMatchObject({ now: 1450, target: 2000, revision: 1 });

    const edited = await tool({ action: "priority_edit", id: priority.id, expectedRevision: 1, target: 2200 });
    expect(edited).toMatchObject({ isError: false, body: { target: 2200, revision: 2 } });

    const stale = await cli(["priority", "edit", priority.id, "--target", "1800", "--expected-revision", "1", "--json"]);
    expect(stale.exitCode).not.toBe(0);
    expect(stale.body).toMatchObject({ ok: false, error: { code: "stale_revision" } });
    expect(stale.body.error.hint).toContain("--expected-revision 2");

    const staleTool = await tool({ action: "priority_edit", id: priority.id, expectedRevision: 1, name: "Other" });
    expect(staleTool).toMatchObject({ isError: true, body: { ok: false, error: { code: "stale_revision" } } });

    const shown = (await cli(["priority", "show", priority.id, "--json"])).body;
    expect(shown).toMatchObject({ name: "Grow weekly active users", target: 2200, revision: 2 });

    const cleared = (await cli(["priority", "edit", priority.id, "--clear", "by,constraints", "--expected-revision", "2", "--json"])).body;
    expect(cleared).toMatchObject({ by: null, revision: 3 });
  });

  it("creates one build_portfolio across tool assign and CLI approve", async () => {
    const { cli, tool, requests } = setup();
    const priority = (await cli(["priority", "add", "Grow weekly active users", "--json"])).body;
    const proposed = (await tool({ action: "objective_add", priorityId: priority.id, name: "Answer community questions faster", proposed: true })).body;
    expect(proposed).toMatchObject({ approved: false, revision: 1 });
    const assigned = (await tool({ action: "objective_assign", id: proposed.id, expectedRevision: 1, assigneeThreadId: "thr_growthconv" })).body;
    expect(requests("build_portfolio")).toEqual([]);
    const approved = await cli(["objective", "approve", proposed.id, "--expected-revision", String(assigned.revision), "--json"]);
    expect(approved.body).toMatchObject({ approved: true, assigneeThreadId: "thr_growthconv" });
    await cli(["objective", "approve", proposed.id, "--expected-revision", String(approved.body.revision), "--json"]);
    expect(requests("build_portfolio")).toEqual([{ subjectId: proposed.id }]);

    const shown = (await cli(["objective", "show", proposed.id, "--json"])).body;
    expect(shown.assignee).toEqual({ threadId: "thr_growthconv", name: "Growth / Conversion", available: true, parent: null });
  });

  it("rejects unknown and deleted threads and sends nothing on assign", async () => {
    const { cli, harness } = setup();
    const priority = (await cli(["priority", "add", "Grow weekly active users", "--json"])).body;
    const objective = (await cli(["objective", "add", priority.id, "Lift activation", "--json"])).body;
    for (const thread of ["thr_unknownteam", "thr_deletedteam"]) {
      const result = await cli(["objective", "assign", objective.id, "--thread", thread, "--expected-revision", "1", "--json"]);
      expect(result.body).toMatchObject({ ok: false, error: { code: "unknown_thread" } });
    }
    const named = await cli(["objective", "assign", objective.id, "--thread", "@Growth", "--expected-revision", "1", "--json"]);
    expect(named.body).toMatchObject({ ok: false, error: { code: "invalid" } });
    await cli(["objective", "assign", objective.id, "--thread", "thr_growthconv", "--expected-revision", "1", "--json"]);
    expect(harness.inspection.sdk.calls.map((call) => call.path).filter((path) => path !== "threads.get")).toEqual([]);
  });

  it("offers no way to write lift or state", async () => {
    const { cli, tool } = setup();
    const priority = (await cli(["priority", "add", "Grow weekly active users", "--json"])).body;
    const objective = (await cli(["objective", "add", priority.id, "Lift activation", "--json"])).body;
    const investment = (await cli(["investment", "add", objective.id, "Onboarding checklist", "--deliverable", "Checklist in first thread", "--source", "https://example.com/a", "--json"])).body;
    expect(investment).toMatchObject({ brief: { deliverable: "Checklist in first thread", sources: ["https://example.com/a"] }, lift: null, state: "not_started" });

    expect((await cli(["investment", "edit", investment.id, "--state", "done", "--expected-revision", "1"])).exitCode).not.toBe(0);
    const viaTool = await tool({ action: "investment_edit", id: investment.id, expectedRevision: 1, state: "done", lift: { base: 10 } });
    expect(viaTool).toMatchObject({ isError: true, body: { error: { code: "invalid" } } });

    const edited = (await cli(["investment", "edit", investment.id, "--existing", "yes", "--clear", "sources", "--expected-revision", "1", "--json"])).body;
    expect(edited).toMatchObject({ existing: true, brief: { deliverable: "Checklist in first thread" }, state: "not_started", lift: null, revision: 2 });
    expect(edited.brief.sources).toBeUndefined();
  });

  it("marks existing running activity In progress from the user's CLI, and rejects the tool from a thread that isn't the team's", async () => {
    const { cli, tool, harness } = setup();
    const priority = (await cli(["priority", "add", "Grow weekly active users", "--json"])).body;
    const objective = (await cli(["objective", "add", priority.id, "Lift activation", "--assign", "thr_growthconv", "--json"])).body;
    const running = (await cli(["investment", "add", objective.id, "Install-page copy test", "--existing", "--json"])).body;
    const viaTool = await tool({ action: "investment_mark_in_progress", id: running.id });
    expect(viaTool).toMatchObject({ isError: true, body: { error: { code: "not_assignee" } } });
    const marked = await cli(["investment", "mark-in-progress", "--id", running.id, "--json"]);
    expect(marked.body).toMatchObject({ id: running.id, state: "in_progress" });
    expect(harness.inspection.sdk.callsTo("threads.send")).toHaveLength(0);
  });

  it("records the calling thread as the origin of priorities and objectives added from the CLI or tool", async () => {
    const { harness, tool } = setup();
    const added = JSON.parse((await harness.behavior.runCli(["priority", "add", "Grow", "--metric", "4-week retention", "--json"], { threadId: "thr_growthconv" })).stdout);
    expect(added).toMatchObject({ originThreadId: "thr_growthconv", metricFormat: "percent" });
    const objective = await tool({ action: "objective_add", priorityId: added.id, name: "Lift" });
    expect(objective.body.originThreadId).toBe("thread-test");
    const formatted = JSON.parse((await harness.behavior.runCli(["priority", "edit", added.id, "--format", "number", "--expected-revision", "1", "--json"])).stdout);
    expect(formatted).toMatchObject({ metricFormat: "number", revision: 2 });
  });

  it("shows the whole plan and publishes each change for the panel", async () => {
    const { cli, harness } = setup();
    const priority = (await cli(["priority", "add", "Grow weekly active users", "--json"])).body;
    const objective = (await cli(["objective", "add", priority.id, "Lift activation", "--assign", "thr_growthconv", "--json"])).body;
    await cli(["investment", "add", objective.id, "Install-page copy test", "--existing", "--json"]);
    const text = await harness.behavior.runCli(["show"]);
    expect(text.stdout).toContain("Lift activation · @Growth / Conversion");
    expect(text.stdout).toContain("Install-page copy test · Researching · Not started");
    expect(harness.inspection.realtimeSignals.map((signal) => signal.channel)).toEqual(["changed", "changed", "changed"]);
  });
});
