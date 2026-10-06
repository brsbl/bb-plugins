// @vitest-environment jsdom
import { cleanup, fireEvent, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { loadPluginApp, renderSlot } from "@get-bb/plugin-sdk/testing/app";
import type { CoordinatorItem, CoordinatorState, CoordinatorTemplate } from "./contracts.js";

const threadId = "thr_coord";
const panelProps = { threadId, params: null };

const ship: CoordinatorTemplate = {
  id: "ship",
  name: "Ship",
  purpose: "Ship the fixes I ask for here.",
  stages: [
    { name: "Asked", check: "none" },
    { name: "Building", check: "pr_open" },
    { name: "Your QA", check: "you_approve" },
    { name: "Review", check: "reviewer_passes" },
    { name: "Merged", check: "pr_merged" },
  ],
  rules: [
    { kind: "gated", action: "start_sub_thread", column: "alone" },
    { kind: "gated", action: "merge_pr", column: "never", condition: { kind: "before_stage_passes", stage: "Review" } },
    { kind: "instruction", column: "never", text: "Post anything" },
  ],
  subThreadRules: "Use Claude unless I say otherwise.",
  briefingCron: null,
  briefingLabel: "Whenever an item changes stage",
  intakePrefix: "worker:",
};

const state: CoordinatorState = {
  threadId,
  template: ship,
  paused: false,
  autoApprove: true,
  appliedRulesVersion: 1,
  rulesVersion: 1,
  lastOpenedAt: 0,
  createdAt: 0,
};

function item(id: string, title: string, patch: Partial<CoordinatorItem> = {}): CoordinatorItem {
  return {
    id,
    coordinatorThreadId: threadId,
    title,
    stageIndex: 1,
    status: "active",
    reason: null,
    link: null,
    primaryThreadId: `thr_${id}`,
    helperThreadIds: [],
    proposed: false,
    createdAt: 0,
    updatedAt: 0,
    ...patch,
  };
}

const items = [
  item("qa", "Finder in Start menu", { stageIndex: 2 }),
  item("review", "Left-align message actions", { stageIndex: 3, helperThreadIds: ["thr_review_helper"] }),
  item("build", "Solid strip under composer", { stageIndex: 1, reason: "QA rejected: the strip is still translucent" }),
  item("merged", "AIM thread padding", { stageIndex: 4, status: "done" }),
  item("idea", "Theme picker", { stageIndex: 0, proposed: true, primaryThreadId: null }),
];

const sidebarThreads = {
  threads: [{ id: threadId, projectId: "proj_1", displayTitle: "Desktop AIM" }],
} as never;

afterEach(cleanup);

describe("Coordinator Mode app", () => {
  it("registers the Coordinator panel action and a settings section", async () => {
    const app = await loadPluginApp(() => import("./app.js"));
    expect(app.threadPanelActions.map((action) => [action.id, action.title])).toEqual([["coordinator", "Coordinator"]]);
    expect(app.settingsSections.map((section) => section.id)).toEqual(["coordinator-mode"]);
    // The host already shows the plugin's name and description above the section.
    expect(app.settingsSections[0]?.title).toBeUndefined();
  });

  it("shows the template summary when off and turns on with the chosen template", async () => {
    const app = await loadPluginApp(() => import("./app.js"));
    let on = false;
    const slot = renderSlot(app.threadPanelActions[0]!, panelProps, {
      sidebarThreads,
      rpc: {
        status: () => ({ state: on ? state : null, items: [], approvals: [], staleRules: false }),
        templates: () => ({ templates: [ship] }),
        markOpened: () => ({ ok: true }),
        turnOn: () => { on = true; return { ok: true }; },
        setAutoApprove: () => ({ ok: true }),
      },
    });

    expect(await slot.findByText(ship.purpose)).toBeDefined();
    const stages = slot.getByRole("list", { name: "Stages" });
    expect(within(stages).getAllByRole("listitem").map((node) => node.textContent)).toEqual(ship.stages.map((stage) => stage.name));
    expect(slot.getByText("Does alone")).toBeDefined();
    expect(slot.getByText("Asks you first")).toBeDefined();
    expect(slot.getByText("Merge a PR before Review passes")).toBeDefined();
    const instruction = slot.getByText("Post anything").closest("li")!;
    expect(within(instruction).getByText("Instruction only · not enforced")).toBeDefined();
    expect(slot.getByText(ship.subThreadRules)).toBeDefined();
    expect(slot.getByText(ship.briefingLabel)).toBeDefined();
    expect((slot.getByRole("checkbox") as HTMLInputElement).checked).toBe(true);

    fireEvent.click(slot.getByRole("button", { name: "Turn on" }));

    expect(await slot.findByText("Desktop AIM")).toBeDefined();
    const calls = slot.inspection.rpcCalls.filter((call) => call.method !== "status");
    expect(calls).toEqual([
      { method: "markOpened", input: { threadId } },
      { method: "templates", input: {} },
      { method: "turnOn", input: { threadId, template: ship } },
      { method: "setAutoApprove", input: { threadId, autoApprove: true } },
    ]);
  });

  it("groups items into Needs you, In progress, and Done", async () => {
    const app = await loadPluginApp(() => import("./app.js"));
    const slot = renderSlot(app.threadPanelActions[0]!, panelProps, {
      sidebarThreads,
      rpc: {
        status: () => ({ state, items, approvals: [], staleRules: false }),
        markOpened: () => ({ ok: true }),
      },
    });

    expect(await slot.findByText("Desktop AIM")).toBeDefined();
    expect(slot.getByText("Coordinator · 5 sub-threads")).toBeDefined();

    const needs = slot.getByText("Needs you · 2").closest("details")!;
    const progress = slot.getByText("In progress · 2").closest("details")!;
    const done = slot.getByText("Done · 1").closest("details")!;
    expect([needs.open, progress.open, done.open]).toEqual([true, true, false]);

    expect(within(needs).getByText("Finder in Start menu")).toBeDefined();
    expect(within(needs).getByText("Your QA")).toBeDefined();
    expect(within(needs).getByText("Theme picker")).toBeDefined();
    expect(within(needs).getByRole("button", { name: "Keep" })).toBeDefined();
    expect(within(progress).getByText("Left-align message actions")).toBeDefined();
    expect(within(progress).getByText("Solid strip under composer")).toBeDefined();
    expect(within(progress).getByText("QA rejected: the strip is still translucent")).toBeDefined();
    expect(within(done).getByText("AIM thread padding")).toBeDefined();
    expect(within(done).getByText("Merged")).toBeDefined();
  });

  it("still offers Approve for a blocked item at an approval stage", async () => {
    const app = await loadPluginApp(() => import("./app.js"));
    const blocked = item("blocked", "Blocked at QA", { stageIndex: 2, status: "blocked", reason: "Denied `gh pr merge`" });
    const slot = renderSlot(app.threadPanelActions[0]!, panelProps, {
      sidebarThreads,
      rpc: {
        status: () => ({ state, items: [blocked], approvals: [], staleRules: false }),
        markOpened: () => ({ ok: true }),
      },
    });

    const needs = (await slot.findByText("Needs you · 1")).closest("details")!;
    expect(within(needs).getByText("Blocked at QA")).toBeDefined();
    expect(within(needs).getByRole("button", { name: "Approve" })).toBeDefined();
  });

  it("requires a reason before rejecting an item", async () => {
    const app = await loadPluginApp(() => import("./app.js"));
    const slot = renderSlot(app.threadPanelActions[0]!, panelProps, {
      sidebarThreads,
      rpc: {
        status: () => ({ state, items, approvals: [], staleRules: false }),
        markOpened: () => ({ ok: true }),
        rejectItem: () => ({ ok: true }),
      },
    });

    const row = (await slot.findByText("Finder in Start menu")).closest("li")!;
    fireEvent.click(within(row).getByRole("button", { name: "Reject" }));
    const submit = within(row).getByRole("button", { name: "Reject" }) as HTMLButtonElement;
    expect(submit.disabled).toBe(true);
    fireEvent.submit(submit.closest("form")!);
    expect(slot.inspection.rpcCalls.some((call) => call.method === "rejectItem")).toBe(false);

    fireEvent.change(within(row).getByRole("textbox", { name: "Reason for rejecting" }), { target: { value: "Icon is blurry" } });
    expect(submit.disabled).toBe(false);
    fireEvent.click(submit);

    await waitFor(() => expect(slot.inspection.rpcCalls).toContainEqual({
      method: "rejectItem",
      input: { itemId: "qa", reason: "Icon is blurry" },
    }));
  });

  it("edits the running coordinator's rules through updateTemplate", async () => {
    const app = await loadPluginApp(() => import("./app.js"));
    let saved: CoordinatorTemplate | null = null;
    const slot = renderSlot(app.threadPanelActions[0]!, panelProps, {
      sidebarThreads,
      rpc: {
        status: () => ({ state: saved ? { ...state, template: saved, rulesVersion: 2 } : state, items: [], approvals: [], staleRules: saved !== null }),
        markOpened: () => ({ ok: true }),
        updateTemplate: (input) => { saved = (input as { template: CoordinatorTemplate }).template; return { ok: true }; },
      },
    });

    fireEvent.click(await slot.findByRole("button", { name: "Edit rules" }));
    const purpose = slot.getByRole("textbox", { name: "Purpose" });
    expect((purpose as HTMLTextAreaElement).value).toBe(ship.purpose);
    fireEvent.change(purpose, { target: { value: "Ship only what I approve." } });
    fireEvent.click(slot.getByRole("button", { name: "Save rules" }));

    expect(await slot.findByText("Using old rules")).toBeDefined();
    expect(slot.inspection.rpcCalls).toContainEqual({
      method: "updateTemplate",
      input: { threadId, template: { ...ship, purpose: "Ship only what I approve." } },
    });
  });

  it("offers a restart when the coordinator runs on old rules", async () => {
    const app = await loadPluginApp(() => import("./app.js"));
    let stale = true;
    const slot = renderSlot(app.threadPanelActions[0]!, panelProps, {
      sidebarThreads,
      rpc: {
        status: () => ({ state, items: [], approvals: [], staleRules: stale }),
        markOpened: () => ({ ok: true }),
        restartCoordinator: () => { stale = false; return { ok: true }; },
      },
    });

    expect(await slot.findByText("Using old rules")).toBeDefined();
    fireEvent.click(slot.getByRole("button", { name: "Restart" }));

    await waitFor(() => expect(slot.queryByText("Using old rules")).toBeNull());
    expect(slot.inspection.rpcCalls).toContainEqual({ method: "restartCoordinator", input: { threadId } });
  });
});
