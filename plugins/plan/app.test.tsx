// @vitest-environment jsdom
import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import { loadPluginApp, renderSlot } from "@get-bb/plugin-sdk/testing/app";
import { createFakePluginHost, makeThreadResponse } from "@get-bb/plugin-sdk/testing";
import { afterEach, expect, it } from "vitest";
import plugin from "./server.js";
import type { Snapshot } from "./rpc.js";

const disposers: Array<() => Promise<void>> = [];
afterEach(async () => { cleanup(); for (const dispose of disposers.splice(0)) await dispose(); });

async function setup() {
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
  const priority = await cli(["priority", "add", "Grow weekly users", "--now", "100", "--target", "200"]);
  const objective = await cli(["objective", "add", priority.id, "Lift activation"]);
  const app = await loadPluginApp(() => import("./app.js"));
  const slot = renderSlot(app.threadPanelActions[0]!, { threadId: "thr_test", params: {} }, { rpc: {
    snapshot: () => host.harness.behavior.callRpc("snapshot", {}),
    openRecord: input => host.harness.behavior.callRpc("openRecord", input),
    editPriority: input => host.harness.behavior.callRpc("editPriority", input),
    editObjective: input => host.harness.behavior.callRpc("editObjective", input),
  } });
  await screen.findByText("Lift activation");
  const refresh = async () => {
    const before = slot.rpcCalls.filter(call => call.method === "snapshot").length;
    await slot.emitRealtime("changed", {});
    await waitFor(() => expect(slot.rpcCalls.filter(call => call.method === "snapshot").length).toBeGreaterThan(before));
  };
  const snapshot = () => host.harness.behavior.callRpc("snapshot", {}) as Promise<Snapshot>;
  return { cli, slot, priority, objective, refresh, snapshot };
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
