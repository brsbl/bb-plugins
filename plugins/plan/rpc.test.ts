import { createFakePluginHost, makeThreadResponse } from "@get-bb/plugin-sdk/testing";
import { afterEach, describe, expect, it } from "vitest";
import plugin from "./server.js";

const disposers: Array<() => Promise<void>> = [];
afterEach(async () => { for (const dispose of disposers.splice(0)) await dispose(); });

const THREADS = {
  thr_growth: makeThreadResponse({ id: "thr_growth", title: "Growth", parentThreadId: null }),
  thr_conversion: makeThreadResponse({ id: "thr_conversion", title: "Conversion", parentThreadId: "thr_growth" }),
  thr_community: makeThreadResponse({ id: "thr_community", title: "Community", parentThreadId: null }),
};

const MENTIONABLE = [
  makeThreadResponse({ id: "thr_research", title: "Plan research A · Lift activation (rr_1234)", originPluginId: "plan", visibility: "visible" }),
  makeThreadResponse({ id: "thr_assess", title: "Plan edit assessment · Lift activation (rr_5678)", originPluginId: null, visibility: "visible" }),
  makeThreadResponse({ id: "thr_helper", title: "Growth helper", originPluginId: "other-plugin", visibility: "visible" }),
  makeThreadResponse({ id: "thr_hidden", title: "Growth hidden", originPluginId: null, visibility: "hidden" }),
  makeThreadResponse({ id: "thr_growth", title: "Growth", originPluginId: null, visibility: "visible" }),
  makeThreadResponse({ id: "thr_gone", title: "Growth old", originPluginId: null, visibility: "visible", deletedAt: 1 }),
];

function setup() {
  const searched: string[] = [];
  const { bb, harness } = createFakePluginHost({
    pluginId: "plan",
    sdk: {
      threads: {
        get: async ({ threadId }) => {
          const thread = THREADS[threadId as keyof typeof THREADS];
          if (!thread) throw new Error("thread not found");
          return thread;
        },
        list: async () => MENTIONABLE,
        search: async ({ query }) => {
          searched.push(query);
          return { active: { results: MENTIONABLE.map((thread) => ({ thread, matches: [{ sourceKind: "title" }] })) }, archived: { results: [] } } as never;
        },
      },
    },
  });
  plugin(bb);
  disposers.push(() => harness.lifecycle.dispose());
  const rpc = (method: string, input: unknown) => harness.behavior.callRpc(method, input);
  return { harness, rpc, searched };
}

describe("Plan panel RPC", () => {
  it("returns the plan with orgs and teams derived from assignee threads", async () => {
    const { rpc } = setup();
    const priority = await rpc("addPriority", { name: "Grow weekly active users" }) as { ok: true; value: { id: string } };
    expect(priority.ok).toBe(true);
    await rpc("addObjective", { priorityId: priority.value.id, name: "Lift activation", assigneeThreadId: "thr_conversion" });
    await rpc("addObjective", { priorityId: priority.value.id, name: "Answer faster", assigneeThreadId: "thr_community" });
    await rpc("addObjective", { priorityId: priority.value.id, name: "Unassigned" });
    const snapshot = await rpc("snapshot", {}) as { priorities: Array<{ objectives: unknown[] }>; orgs: unknown };
    expect(snapshot.priorities[0]?.objectives).toHaveLength(3);
    expect(snapshot.orgs).toEqual([
      { threadId: "thr_growth", name: "Growth", teams: [{ threadId: "thr_conversion", name: "Conversion" }] },
      { threadId: "thr_community", name: "Community", teams: [] },
    ]);
  });

  it("labels a team with its live parent org", async () => {
    const { rpc } = setup();
    const priority = await rpc("addPriority", { name: "Grow weekly active users" }) as { value: { id: string } };
    await rpc("addObjective", { priorityId: priority.value.id, name: "Lift activation", assigneeThreadId: "thr_conversion" });
    await rpc("addObjective", { priorityId: priority.value.id, name: "Answer faster", assigneeThreadId: "thr_community" });
    const snapshot = await rpc("snapshot", {}) as { priorities: Array<{ objectives: Array<{ assignee: unknown }> }> };
    expect(snapshot.priorities[0]!.objectives.map((objective) => objective.assignee)).toEqual([
      { threadId: "thr_conversion", name: "Conversion", available: true, parent: { threadId: "thr_growth", name: "Growth" } },
      { threadId: "thr_community", name: "Community", available: true, parent: null },
    ]);
  });

  it("suggests only user threads for a team @mention, never plugin-made, hidden or Plan research threads, and ignores extra @s", async () => {
    const { rpc, searched } = setup();
    expect(await rpc("searchThreads", { query: "@@Gro" })).toEqual({ threads: [{ id: "thr_growth", name: "Growth" }] });
    expect(searched).toEqual(["Gro"]);
    expect(await rpc("searchThreads", { query: "@" })).toEqual({ threads: [{ id: "thr_growth", name: "Growth" }] });
    expect(searched).toEqual(["Gro"]);
  });

  it("returns a stale edit as a stale_revision outcome without applying it", async () => {
    const { rpc } = setup();
    const priority = await rpc("addPriority", { name: "Grow weekly active users" }) as { value: { id: string } };
    expect(await rpc("editPriority", { id: priority.value.id, expectedRevision: 1, name: "Grow weekly actives" })).toMatchObject({ ok: true, value: { revision: 2 } });
    expect(await rpc("editPriority", { id: priority.value.id, expectedRevision: 1, name: "Overwrite" })).toMatchObject({ ok: false, code: "stale_revision" });
    const snapshot = await rpc("snapshot", {}) as { priorities: Array<{ name: string }> };
    expect(snapshot.priorities[0]?.name).toBe("Grow weekly actives");
  });

  it("reports the record open in this thread's panel through the plan tool's show", async () => {
    const { harness, rpc } = setup();
    const priority = await rpc("addPriority", { name: "Grow weekly active users" }) as { value: { id: string } };
    const objective = await rpc("addObjective", { priorityId: priority.value.id, name: "Lift activation" }) as { value: { id: string } };
    const show = async (threadId: string) => JSON.parse(await harness.behavior.callAgentTool("plan", { action: "show" }, { threadId }) as string);

    expect((await show("thr_planning")).openInPanel).toBeNull();
    await rpc("openRecord", { threadId: "thr_planning", record: { kind: "objective", id: objective.value.id } });
    expect((await show("thr_planning")).openInPanel).toEqual({ kind: "objective", id: objective.value.id });
    expect((await show("thr_other")).openInPanel).toBeNull();
    await rpc("openRecord", { threadId: "thr_planning", record: null });
    expect((await show("thr_planning")).openInPanel).toBeNull();
    await expect(rpc("openRecord", { threadId: "Planning", record: null })).rejects.toThrow();
  });
});
