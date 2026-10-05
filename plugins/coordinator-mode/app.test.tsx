// @vitest-environment jsdom
import { cleanup, fireEvent, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { loadPluginApp, renderSlot } from "@get-bb/plugin-sdk/testing/app";
import type { CoordinatorItem, CoordinatorState, CoordinatorStatus, CoordinatorTemplate, PendingApproval } from "./contracts.js";

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
  lastBriefedAt: null,
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
    summary: null,
    waitingOn: null,
    pr: null,
    createdAt: 0,
    updatedAt: 0,
    ...patch,
  };
}

const items = [
  item("qa", "Finder in Start menu", { stageIndex: 2 }),
  item("review", "Left-align message actions", { stageIndex: 3, waitingOn: "moss-multi" }),
  item("build", "Solid strip under composer", {
    stageIndex: 1, reason: "QA rejected: the strip is still translucent", pr: { number: 327, url: null, state: "open", checks: "passing" },
  }),
  item("merged", "AIM thread padding", { stageIndex: 4, status: "done" }),
];

const mergeApproval: PendingApproval = {
  id: "ap_1", coordinatorThreadId: threadId, itemId: "build", action: "merge_pr", summary: "Merge PR #330", args: {},
  reason: "Asks you first: Merge a PR.", createdAt: 0,
};

const sidebarThreads = {
  threads: [{ id: threadId, projectId: "proj_1", displayTitle: "Desktop AIM" }],
} as never;

afterEach(cleanup);

function renderPanel(status: () => CoordinatorStatus, rpc: Record<string, (input: unknown) => unknown> = {}) {
  return loadPluginApp(() => import("./app.js")).then((app) => renderSlot(app.threadPanelActions[0]!, panelProps, {
    sidebarThreads,
    rpc: { status, markOpened: () => ({ ok: true }), ...rpc },
  }));
}

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

    expect(await slot.findByText("Desktop AIM · Ship")).toBeDefined();
    const calls = slot.inspection.rpcCalls.filter((call) => call.method !== "status");
    expect(calls).toEqual([
      { method: "markOpened", input: { threadId } },
      { method: "templates", input: {} },
      { method: "turnOn", input: { threadId, template: ship } },
      { method: "setAutoApprove", input: { threadId, autoApprove: true } },
    ]);
  });

  it("puts decisions first, then in-progress rows with their status, then Done collapsed", async () => {
    const slot = await renderPanel(() => ({
      state: { ...state, lastBriefedAt: Date.now() - 12 * 60_000 - 1_000 }, items, approvals: [mergeApproval], staleRules: false,
    }));

    expect(await slot.findByText("Desktop AIM · Ship")).toBeDefined();
    const needs = slot.getByRole("region", { name: "Needs you" });
    expect(within(needs).getByText("Needs you · 1 of 2")).toBeDefined();
    expect(within(needs).getByRole("heading", { name: "Approve QA for “Finder in Start menu”?" })).toBeDefined();
    expect(within(needs).getByText("Approving moves it to Review.")).toBeDefined();
    expect(within(needs).getByRole("button", { name: "Approve" })).toBeDefined();
    expect(within(needs).getByRole("button", { name: "Reject…" })).toBeDefined();

    const also = slot.getByRole("region", { name: "Also needs you" });
    expect(within(also).getByText("Approve: Merge PR #330?")).toBeDefined();
    expect(within(also).getByText("Asks you first: Merge a PR.")).toBeDefined();
    expect(within(also).getByRole("button", { name: "Decline…" })).toBeDefined();

    const progress = slot.getByRole("region", { name: "In progress" });
    expect(within(progress).getByText("In progress · 2")).toBeDefined();
    expect(within(progress).getByText("Review · Waiting on moss-multi")).toBeDefined();
    expect(within(progress).getByText("Building · PR #327 · CI passing")).toBeDefined();
    expect(within(progress).getByText("QA rejected: the strip is still translucent")).toBeDefined();

    const done = slot.getByText("Done · 1").closest("details")!;
    expect(done.open).toBe(false);
    expect(within(done).getByText("AIM thread padding")).toBeDefined();
    expect(within(done).getByText("Merged")).toBeDefined();

    expect(slot.getByText("Auto-approve on")).toBeDefined();
    expect(slot.getByText("Briefed 12 min ago")).toBeDefined();
    // Decisions are the panel's own rows, never Markdown-rendered card directives.
    expect(slot.queryByTestId("bb-markdown")).toBeNull();
  });

  it("approves a QA decision through approveItem", async () => {
    const slot = await renderPanel(() => ({ state, items, approvals: [], staleRules: false }), { approveItem: () => ({ ok: true }) });
    const needs = await slot.findByRole("region", { name: "Needs you" });
    fireEvent.click(within(needs).getByRole("button", { name: "Approve" }));
    await waitFor(() => expect(slot.inspection.rpcCalls).toContainEqual({ method: "approveItem", input: { itemId: "qa" } }));
  });

  it("still offers Approve for a blocked item at an approval stage", async () => {
    const blocked = item("blocked", "Blocked at QA", { stageIndex: 2, status: "blocked", reason: "Denied `gh pr merge`" });
    const slot = await renderPanel(() => ({ state, items: [blocked], approvals: [], staleRules: false }));
    const needs = await slot.findByRole("region", { name: "Needs you" });
    expect(within(needs).getByText("Needs you · 1")).toBeDefined();
    expect(within(needs).getByRole("heading", { name: "Approve QA for “Blocked at QA”?" })).toBeDefined();
    expect(within(needs).getByText("Blocked. Approving moves it to Review.")).toBeDefined();
    expect(within(needs).getByRole("button", { name: "Approve" })).toBeDefined();
  });

  it("requires a reason before rejecting an item", async () => {
    const slot = await renderPanel(() => ({ state, items, approvals: [], staleRules: false }), { rejectItem: () => ({ ok: true }) });
    const needs = await slot.findByRole("region", { name: "Needs you" });
    fireEvent.click(within(needs).getByRole("button", { name: "Reject…" }));
    const submit = within(needs).getByRole("button", { name: "Reject" }) as HTMLButtonElement;
    expect(submit.disabled).toBe(true);
    fireEvent.submit(submit.closest("form")!);
    expect(slot.inspection.rpcCalls.some((call) => call.method === "rejectItem")).toBe(false);

    fireEvent.change(within(needs).getByRole("textbox", { name: "Reason for rejecting" }), { target: { value: "Icon is blurry" } });
    expect(submit.disabled).toBe(false);
    fireEvent.click(submit);

    await waitFor(() => expect(slot.inspection.rpcCalls).toContainEqual({
      method: "rejectItem",
      input: { itemId: "qa", reason: "Icon is blurry" },
    }));
  });

  it("approves and declines ask-first requests through resolveApproval", async () => {
    const second: PendingApproval = { ...mergeApproval, id: "ap_2", summary: "Archive primary sub-thread thr_x" };
    const slot = await renderPanel(() => ({ state, items: [], approvals: [mergeApproval, second], staleRules: false }), {
      resolveApproval: () => ({ ok: true }),
    });
    const needs = await slot.findByRole("region", { name: "Needs you" });
    expect(within(needs).getByRole("heading", { name: "Approve: Merge PR #330?" })).toBeDefined();
    fireEvent.click(within(needs).getByRole("button", { name: "Approve" }));
    await waitFor(() => expect(slot.inspection.rpcCalls).toContainEqual({ method: "resolveApproval", input: { approvalId: "ap_1", approve: true } }));

    const also = slot.getByRole("region", { name: "Also needs you" });
    fireEvent.click(within(also).getByRole("button", { name: "Decline…" }));
    fireEvent.click(within(also).getByRole("button", { name: "Decline" }));
    await waitFor(() => expect(slot.inspection.rpcCalls).toContainEqual({ method: "resolveApproval", input: { approvalId: "ap_2", approve: false } }));
  });

  it("stops tracking an item from its row menu", async () => {
    const slot = await renderPanel(() => ({ state, items, approvals: [], staleRules: false }), { cutItem: () => ({ ok: true }) });
    fireEvent.click(await slot.findByRole("button", { name: "More for Left-align message actions" }));
    fireEvent.click(slot.getByRole("menuitem", { name: "Stop tracking" }));
    await waitFor(() => expect(slot.inspection.rpcCalls).toContainEqual({ method: "cutItem", input: { itemId: "review" } }));
    expect(slot.queryByRole("button", { name: "More for AIM thread padding" })).toBeNull();
  });

  it("keeps pause, auto-approve, and turn off in the header menu", async () => {
    const slot = await renderPanel(() => ({ state, items, approvals: [], staleRules: false }), {
      setPaused: () => ({ ok: true }),
      setAutoApprove: () => ({ ok: true }),
      turnOff: () => ({ ok: true }),
    });
    const open = async () => fireEvent.click(await slot.findByRole("button", { name: "Coordinator options" }));

    await open();
    expect(slot.getByRole("menuitemcheckbox", { name: "Auto-approve" }).getAttribute("aria-checked")).toBe("true");
    expect(slot.getByRole("menuitem", { name: "Edit rules" })).toBeDefined();
    fireEvent.click(slot.getByRole("menuitem", { name: "Pause" }));
    await waitFor(() => expect(slot.inspection.rpcCalls).toContainEqual({ method: "setPaused", input: { threadId, paused: true } }));

    await open();
    fireEvent.click(slot.getByRole("menuitemcheckbox", { name: "Auto-approve" }));
    await waitFor(() => expect(slot.inspection.rpcCalls).toContainEqual({ method: "setAutoApprove", input: { threadId, autoApprove: false } }));

    await open();
    fireEvent.click(slot.getByRole("menuitem", { name: "Turn off" }));
    expect(slot.getByText("Turn off Coordinator Mode? The thread and its history stay.")).toBeDefined();
    expect(slot.inspection.rpcCalls.some((call) => call.method === "turnOff")).toBe(false);
    fireEvent.click(slot.getByRole("button", { name: "Turn off" }));
    await waitFor(() => expect(slot.inspection.rpcCalls).toContainEqual({ method: "turnOff", input: { threadId } }));
  });

  it("edits the running coordinator's rules through updateTemplate", async () => {
    let saved: CoordinatorTemplate | null = null;
    const slot = await renderPanel(
      () => ({ state: saved ? { ...state, template: saved, rulesVersion: 2 } : state, items: [], approvals: [], staleRules: saved !== null }),
      { updateTemplate: (input) => { saved = (input as { template: CoordinatorTemplate }).template; return { ok: true }; } },
    );

    fireEvent.click(await slot.findByRole("button", { name: "Coordinator options" }));
    fireEvent.click(slot.getByRole("menuitem", { name: "Edit rules" }));
    const purpose = slot.getByRole("textbox", { name: "Purpose" });
    expect((purpose as HTMLTextAreaElement).value).toBe(ship.purpose);
    fireEvent.change(purpose, { target: { value: "Ship only what I approve." } });
    fireEvent.click(slot.getByRole("button", { name: "Save rules" }));

    expect(await slot.findByText("Using old rules.")).toBeDefined();
    expect(slot.inspection.rpcCalls).toContainEqual({
      method: "updateTemplate",
      input: { threadId, template: { ...ship, purpose: "Ship only what I approve." } },
    });
  });

  it("offers a restart when the coordinator runs on old rules", async () => {
    let stale = true;
    const slot = await renderPanel(() => ({ state, items: [], approvals: [], staleRules: stale }), {
      restartCoordinator: () => { stale = false; return { ok: true }; },
    });

    expect(await slot.findByText("Using old rules.")).toBeDefined();
    fireEvent.click(slot.getByRole("button", { name: "Restart" }));

    await waitFor(() => expect(slot.queryByText("Using old rules.")).toBeNull());
    expect(slot.inspection.rpcCalls).toContainEqual({ method: "restartCoordinator", input: { threadId } });
  });
});
