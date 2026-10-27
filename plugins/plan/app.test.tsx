// @vitest-environment jsdom
import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import { loadPluginApp, renderSlot } from "@get-bb/plugin-sdk/testing/app";
import { createFakePluginHost, makeThreadResponse } from "@get-bb/plugin-sdk/testing";
import { afterEach, expect, it } from "vitest";
import plugin from "./server.js";
import { rpcContract, type Snapshot } from "./rpc.js";

const disposers: Array<() => Promise<void>> = [];
afterEach(async () => { cleanup(); for (const dispose of disposers.splice(0)) await dispose(); });

async function setup(options: { metric?: string[] } = {}) {
  const host = createFakePluginHost({ pluginId: "plan", sdk: { threads: {
    get: async ({ threadId }) => makeThreadResponse({ id: threadId, title: "Conversion" }),
  } } });
  plugin(host.bb);
  disposers.push(() => host.harness.lifecycle.dispose());
  const cli = async (argv: string[]) => {
    const result = await host.harness.behavior.runCli([...argv, "--json"]);
    expect(result.exitCode).toBe(0);
    return JSON.parse(result.stdout);
  };
  const priority = await cli(["priority", "add", "Grow weekly users", ...(options.metric ?? ["--now", "100", "--target", "200"])]);
  const objective = await cli(["objective", "add", priority.id, "Lift activation"]);
  const app = await loadPluginApp(() => import("./app.js"));
  const rpc = Object.fromEntries(Object.keys(rpcContract).map((method) => [method, (input: unknown) => host.harness.behavior.callRpc(method, input)]));
  const slot = renderSlot(app.threadPanelActions[0]!, { threadId: "thr_test", params: {} }, { rpc });
  await screen.findByText("Lift activation");
  const refresh = async () => {
    const before = slot.rpcCalls.filter(call => call.method === "snapshot").length;
    await slot.emitRealtime("changed", {});
    await waitFor(() => expect(slot.rpcCalls.filter(call => call.method === "snapshot").length).toBeGreaterThan(before));
  };
  const snapshot = () => host.harness.behavior.callRpc("snapshot", {}) as Promise<Snapshot>;
  return { cli, slot, priority, objective, refresh, snapshot, db: host.bb.storage.database() };
}

it("keeps a pencil draft's original revision when an agent edits the objective", async () => {
  const { cli, objective, refresh, snapshot } = await setup();
  fireEvent.click(screen.getByRole("button", { name: "Edit objective: Lift activation" }));
  fireEvent.change(screen.getByRole("textbox", { name: "Objective" }), { target: { value: "My older draft" } });
  await cli(["objective", "edit", objective.id, "--name", "Fresh agent update", "--expected-revision", "1"]);
  await refresh();
  fireEvent.keyDown(screen.getByRole("textbox", { name: "Objective" }), { key: "Enter" });
  await screen.findByRole("alert");
  expect((await snapshot()).priorities[0]!.objectives[0]!.name).toBe("Fresh agent update");
  expect(screen.queryByRole("textbox", { name: "Objective" })).toBeNull();
});

it("rejects an older metric draft after a realtime target update", async () => {
  const { cli, priority, refresh, snapshot } = await setup();
  fireEvent.click(screen.getByRole("button", { name: "Edit target for Grow weekly users" }));
  fireEvent.change(screen.getByRole("textbox", { name: "Target" }), { target: { value: "250" } });
  await cli(["priority", "edit", priority.id, "--target", "300", "--expected-revision", "1"]);
  await refresh();
  fireEvent.blur(screen.getByRole("textbox", { name: "Target" }));
  await screen.findByRole("alert");
  expect((await snapshot()).priorities[0]!.target).toBe(300);
});

it("always shows Orgs & teams, formats a percent metric, and sets the open priority while editing it", async () => {
  const { slot, priority } = await setup({ metric: ["--metric", "4-week retention", "--now", "40", "--target", "45"] });
  expect(screen.getByRole("button", { name: "Orgs & teams" })).toBeTruthy();
  expect(screen.getByText(/40%/)).toBeTruthy();
  expect(screen.getByText(/45% 4-week retention/)).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Edit target for Grow weekly users" }));
  await waitFor(() => expect(slot.rpcCalls.some((call) => call.method === "openRecord"
    && JSON.stringify(call.input) === JSON.stringify({ threadId: "thr_test", record: { kind: "priority", id: priority.id } }))).toBe(true));
  expect(screen.getByRole("textbox", { name: "Baseline" })).toBeTruthy();
  expect(screen.getByRole("textbox", { name: "Constraints" })).toBeTruthy();
  expect(screen.getByRole("combobox", { name: "Format" })).toBeTruthy();
});

it("shows Evidence as the mockup does: one funnel row, step sources in Sources, and one Open both submissions button with B beside it", async () => {
  const { cli, objective, db, slot } = await setup();
  await cli(["objective", "assign", objective.id, "--thread", "thr_team", "--expected-revision", "1"]);
  const sized = await cli(["investment", "add", objective.id, "Onboarding checklist"]);
  const unsized = await cli(["investment", "add", objective.id, "Discord welcome bot"]);
  const research = (extra: Record<string, unknown>) => JSON.stringify({
    requestId: "rr_1", submissionThreadIds: ["thr_suba", "thr_subb"], reconciliationThreadId: "thr_rec", basis: null, lift: null, missing: null, rationale: null,
    ownerProposal: null, metricLink: null, cost: "2 weeks", dependencies: "Email opt-in", funnelSteps: null, ...extra,
  });
  db.prepare("UPDATE plan_investments SET lift = ?, rank = 1, research = ? WHERE id = ?").run(JSON.stringify({
    low: 30, base: 60, high: 95, unit: "Added week-1 active users", method: "Forecast: comparable test", cost: "2 weeks", dependencies: "None", sources: ["https://src.example/a"],
  }), research({ funnelSteps: [
    { step: "Download", value: 1, unit: "x", sources: ["https://src.example/download"], linkToNext: { rate: 0.5, sources: ["https://src.example/rate"] } },
    { step: "install", value: 1, unit: "x", sources: ["https://src.example/install"], linkToNext: { rate: 0.4, sources: ["https://src.example/rate2"] } },
    { step: "active in week 1", value: 1, unit: "x", sources: ["https://src.example/active"], linkToNext: null },
  ] }), sized.id);
  db.prepare("UPDATE plan_investments SET research = ? WHERE id = ?").run(research({ missing: "No data on Discord joiners" }), unsized.id);
  await slot.emitRealtime("changed", {});
  fireEvent.click(await screen.findByText("Lift activation"));
  fireEvent.click(await screen.findByRole("button", { name: "Onboarding checklist" }));
  expect(await screen.findByText("Download → install → active in week 1, each step sourced")).toBeTruthy();
  expect(screen.getByText("https://src.example/rate2")).toBeTruthy();
  expect(screen.getByText("added week-1 active users")).toBeTruthy();
  expect(screen.queryByText("Funnel steps", { selector: ".pl-gh" })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Open both submissions" }));
  fireEvent.click(screen.getByRole("button", { name: "Open submission B" }));
  expect(slot.navigateCalls).toEqual([{ method: "toThread", threadId: "thr_suba" }, { method: "toThread", threadId: "thr_subb" }]);

  fireEvent.click(screen.getByRole("button", { name: /‹ Lift activation/ }));
  fireEvent.click(await screen.findByRole("button", { name: "Discord welcome bot" }));
  expect(await screen.findByText("No data on Discord joiners")).toBeTruthy();
  expect(screen.getAllByText("Researching").length).toBeGreaterThan(0);
  expect(screen.getByText("Email opt-in")).toBeTruthy();
});

it("opens a proposed objective's decision data with its Approve check, and offers Unassign in the team picker", async () => {
  const { cli, priority, db, slot, snapshot } = await setup();
  const proposed = await cli(["objective", "add", priority.id, "Reduce week-4 drop-off", "--proposed", "--assign", "thr_team"]);
  db.prepare("UPDATE plan_objectives SET research = ?, rank = 1 WHERE id = ?").run(JSON.stringify({
    requestId: "rr_1", submissionThreadIds: ["thr_suba", "thr_subb"], reconciliationThreadId: "thr_rec", basis: null,
    lift: { low: 10, base: 25, high: 40, unit: "weekly active users" }, missing: null, funnelSteps: null, rationale: "Week-4 is where teams drop",
    ownerProposal: "Product / Core", metricLink: { claim: "Retained teams count toward WAU", sources: ["https://src.example/link"] }, cost: "3 weeks", dependencies: "Template content",
  }), proposed.id);
  await slot.emitRealtime("changed", {});
  expect(await screen.findByText("Proposed · Conversion · +25")).toBeTruthy();
  fireEvent.click(screen.getByText("Reduce week-4 drop-off"));
  expect(await screen.findByText("Week-4 is where teams drop")).toBeTruthy();
  expect(screen.getByText("Retained teams count toward WAU")).toBeTruthy();
  expect(screen.getByText("Template content")).toBeTruthy();
  expect(screen.getByText("Research starts once the objective is approved")).toBeTruthy();
  expect(screen.getByRole("button", { name: "Open both submissions" })).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Edit team for Reduce week-4 drop-off" }));
  const picker = screen.getByRole("combobox", { name: "Assign a team: @mention its thread" });
  expect(document.querySelector(`#${picker.getAttribute("list")!.replace(/:/g, "\\:")} option[value="Unassign"]`)).toBeTruthy();
  fireEvent.change(picker, { target: { value: "Unassign" } });
  fireEvent.keyDown(picker, { key: "Enter" });
  await waitFor(async () => expect((await snapshot()).priorities[0]!.objectives[1]!.assigneeThreadId).toBeNull());
  fireEvent.click(screen.getByRole("button", { name: "Approve objective Reduce week-4 drop-off" }));
  await waitFor(async () => expect((await snapshot()).priorities[0]!.objectives[1]!.approved).toBe(true));
});
