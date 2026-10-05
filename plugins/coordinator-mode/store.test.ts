import { createFakePluginHost } from "@get-bb/plugin-sdk/testing";
import { afterEach, describe, expect, it } from "vitest";

import { createStore, type CoordinatorRecord, type ItemRecord } from "./store";
import { BUILT_IN_TEMPLATES } from "./templates";

const cleanups: Array<() => Promise<void>> = [];
afterEach(async () => {
  for (const cleanup of cleanups.splice(0)) await cleanup();
});

function setup() {
  const { bb, harness } = createFakePluginHost({ pluginId: "coordinator-mode" });
  cleanups.push(() => harness.lifecycle.dispose());
  return createStore(bb);
}

const ship = BUILT_IN_TEMPLATES[0]!;

const coordinator = (threadId: string): CoordinatorRecord => ({
  threadId, projectId: "proj", template: ship, paused: false, autoApprove: true, rulesVersion: 1, appliedRulesVersion: 1,
  lastOpenedAt: 10, lastBriefingAt: 10, createdAt: 10,
});

const item = (id: string, overrides: Partial<ItemRecord> = {}): ItemRecord => ({
  id, coordinatorThreadId: "thr_coord", title: `Item ${id}`, stageIndex: 0, status: "active", reason: null, link: null,
  primaryThreadId: null, helperThreadIds: [], proposed: false, approved: false, rejectedReason: null, review: null, failedAt: null,
  createdAt: 20, updatedAt: 20, ...overrides,
});

describe("Coordinator Mode store", () => {
  it("round-trips coordinators and updates", () => {
    const store = setup();
    store.coordinators.insert(coordinator("thr_coord"));
    expect(store.coordinators.get("thr_coord")).toEqual(coordinator("thr_coord"));
    const updated = store.coordinators.update("thr_coord", { paused: true, rulesVersion: 2 });
    expect(updated.paused).toBe(true);
    expect(store.coordinators.get("thr_coord")?.rulesVersion).toBe(2);
    expect(store.coordinators.list()).toHaveLength(1);
    expect(() => store.coordinators.update("thr_missing", { paused: true })).toThrow(/not a coordinator/);
  });

  it("round-trips items with evidence and helper threads", () => {
    const store = setup();
    store.coordinators.insert(coordinator("thr_coord"));
    store.items.create(item("i1", { primaryThreadId: "thr_primary" }));
    store.threads.add("i1", "thr_helper", "helper");
    const saved = store.items.save({
      ...store.items.get("i1")!, stageIndex: 3, approved: true, rejectedReason: "No", review: { pass: false, findings: "Bug" }, failedAt: 99,
    });
    expect(saved).toMatchObject({
      primaryThreadId: "thr_primary", helperThreadIds: ["thr_helper"], stageIndex: 3, approved: true,
      rejectedReason: "No", review: { pass: false, findings: "Bug" }, failedAt: 99,
    });
    expect(store.items.list("thr_coord").map((entry) => entry.id)).toEqual(["i1"]);
  });

  it("answers membership for coordinators and their sub-threads only", () => {
    const store = setup();
    store.coordinators.insert(coordinator("thr_coord"));
    store.items.create(item("i1", { primaryThreadId: "thr_primary" }));
    store.threads.add("i1", "thr_helper", "helper");
    const byThread = new Map(store.memberships().map((entry) => [entry.threadId, entry]));
    expect(byThread.get("thr_coord")).toEqual({ threadId: "thr_coord", coordinatorThreadId: "thr_coord", itemId: null, role: "coordinator" });
    expect(byThread.get("thr_primary")).toMatchObject({ coordinatorThreadId: "thr_coord", itemId: "i1", role: "primary" });
    expect(byThread.get("thr_helper")).toMatchObject({ itemId: "i1", role: "helper" });
    expect(byThread.has("thr_other")).toBe(false);
  });

  it("keeps pending approvals until they are resolved once", () => {
    const store = setup();
    store.coordinators.insert(coordinator("thr_coord"));
    store.approvals.create({
      id: "a1", coordinatorThreadId: "thr_coord", itemId: "i1", action: "merge_pr", summary: "Merge it", args: { kind: "merge", itemId: "i1" }, createdAt: 30,
    });
    expect(store.approvals.pending("thr_coord")).toEqual([
      { id: "a1", coordinatorThreadId: "thr_coord", itemId: "i1", action: "merge_pr", summary: "Merge it", args: { kind: "merge", itemId: "i1" }, createdAt: 30 },
    ]);
    expect(store.approvals.resolve("a1", "approved", 40)).toBe(true);
    expect(store.approvals.resolve("a1", "declined", 41)).toBe(false);
    expect(store.approvals.pending("thr_coord")).toEqual([]);
    expect(store.approvals.get("a1")).toMatchObject({ resolvedAt: 40, outcome: "approved" });
  });

  it("filters the log by time and finds actions per item", () => {
    const store = setup();
    store.log.append({ coordinatorThreadId: "thr_coord", itemId: "i1", kind: "item_created", text: "Added", at: 5 });
    store.log.append({ coordinatorThreadId: "thr_coord", itemId: "i1", kind: "action_run", text: "Merged", at: 15, action: "merge_pr" });
    expect(store.log.list("thr_coord", 10).map((entry) => entry.text)).toEqual(["Merged"]);
    expect(store.log.has("i1", ["action_run"], "merge_pr")).toBe(true);
    expect(store.log.has("i1", ["action_run"], "start_sub_thread")).toBe(false);
    expect(store.log.has("i2", ["action_run"])).toBe(false);
  });

  it("tracks thread activity and deletes a coordinator with everything it tracks", () => {
    const store = setup();
    store.activity.markActive("thr_primary", 5);
    store.activity.markIdle("thr_primary", 7);
    expect(store.activity.get("thr_primary")).toEqual({ lastActiveAt: 5, lastIdleAt: 7 });
    expect(store.activity.get("thr_none")).toEqual({ lastActiveAt: null, lastIdleAt: null });

    store.coordinators.insert(coordinator("thr_coord"));
    store.items.create(item("i1", { primaryThreadId: "thr_primary" }));
    store.log.append({ coordinatorThreadId: "thr_coord", itemId: "i1", kind: "item_created", text: "Added", at: 5 });
    store.coordinators.delete("thr_coord");
    expect(store.coordinators.get("thr_coord")).toBeNull();
    expect(store.items.get("i1")).toBeNull();
    expect(store.memberships()).toEqual([]);
    expect(store.log.list("thr_coord")).toEqual([]);
  });
});
