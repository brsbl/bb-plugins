import { createFakePluginHost } from "@get-bb/plugin-sdk/testing";
import { afterEach, describe, expect, it } from "vitest";

import { createStore, STORE_MIGRATIONS, type CoordinatorRecord, type ItemRecord } from "./store";
import { BUILT_IN_TEMPLATES } from "./templates";

const cleanups: Array<() => Promise<void>> = [];
afterEach(async () => {
  for (const cleanup of cleanups.splice(0)) await cleanup();
});

function host() {
  const { bb, harness } = createFakePluginHost({ pluginId: "coordinator-mode" });
  cleanups.push(() => harness.lifecycle.dispose());
  return bb;
}

function setup() {
  return createStore(host());
}

const ship = BUILT_IN_TEMPLATES[0]!;

const coordinator = (threadId: string): CoordinatorRecord => ({
  threadId, projectId: "proj", template: ship, paused: false, autoApprove: true, rulesVersion: 1, appliedRulesVersion: 1,
  lastOpenedAt: 10, lastBriefingAt: 10, lastBriefedAt: null, createdAt: 10,
});

const item = (id: string, overrides: Partial<ItemRecord> = {}): ItemRecord => ({
  id, coordinatorThreadId: "thr_coord", title: `Item ${id}`, stageIndex: 0, status: "active", reason: null, link: null,
  primaryThreadId: null, helperThreadIds: [], proposed: false, approved: false, rejectedReason: null, review: null, failedAt: null,
  summary: null, waitingOn: null, pr: null, createdAt: 20, updatedAt: 20, ...overrides,
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
      id: "a1", coordinatorThreadId: "thr_coord", itemId: "i1", action: "merge_pr", summary: "Merge it", args: { kind: "merge", itemId: "i1" },
      reason: "Asks you first: Merge a PR.", createdAt: 30,
    });
    expect(store.approvals.pending("thr_coord")).toEqual([
      {
        id: "a1", coordinatorThreadId: "thr_coord", itemId: "i1", action: "merge_pr", summary: "Merge it", args: { kind: "merge", itemId: "i1" },
        reason: "Asks you first: Merge a PR.", createdAt: 30,
      },
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
    store.cards.upsert({ ref: "qa:i1:2", coordinatorThreadId: "thr_coord", cardId: "cm-qa-1", directive: "::action{id=\"cm-qa-1\"}", createdAt: 5 });
    store.coordinators.delete("thr_coord");
    expect(store.coordinators.get("thr_coord")).toBeNull();
    expect(store.items.get("i1")).toBeNull();
    expect(store.memberships()).toEqual([]);
    expect(store.log.list("thr_coord")).toEqual([]);
    expect(store.cards.get("qa:i1:2")).toBeNull();
  });

  it("records adopted sub-threads as the item's primary, with their own role", () => {
    const store = setup();
    store.coordinators.insert(coordinator("thr_coord"));
    store.items.create(item("i1", { primaryThreadId: "thr_old" }), "adopted");
    store.threads.add("i1", "thr_helper", "helper");
    expect(store.items.get("i1")).toMatchObject({ primaryThreadId: "thr_old", helperThreadIds: ["thr_helper"] });
    const byThread = new Map(store.memberships().map((entry) => [entry.threadId, entry]));
    expect(byThread.get("thr_old")).toMatchObject({ itemId: "i1", role: "adopted" });
  });

  it("keeps summary, waiting-on, and PR evidence out of reach of stale saves", () => {
    const store = setup();
    store.coordinators.insert(coordinator("thr_coord"));
    const stale = store.items.create(item("i1", { summary: "First pass" }));
    store.items.setContext("i1", { waitingOn: "moss-multi" }, 30);
    store.items.setPr("i1", { number: 327, url: "https://github.com/o/r/pull/327", state: "open", checks: "passing" });
    store.items.save({ ...stale, stageIndex: 2 });
    expect(store.items.get("i1")).toMatchObject({
      stageIndex: 2, summary: "First pass", waitingOn: "moss-multi",
      pr: { number: 327, url: "https://github.com/o/r/pull/327", state: "open", checks: "passing" },
    });
    store.items.setContext("i1", { summary: null }, 31);
    expect(store.items.get("i1")).toMatchObject({ summary: null, waitingOn: "moss-multi" });
  });

  it("tracks owned cards per ref: open, resolved, and reopened by a new upsert", () => {
    const store = setup();
    store.cards.upsert({ ref: "qa:i1:2", coordinatorThreadId: "thr_coord", cardId: "cm-qa-1", directive: "::action{id=\"cm-qa-1\"}", createdAt: 5 });
    expect(store.cards.open("thr_coord").map((card) => card.ref)).toEqual(["qa:i1:2"]);
    expect(store.cards.resolve("qa:i1:2", 6)).toBe(true);
    expect(store.cards.resolve("qa:i1:2", 7)).toBe(false);
    expect(store.cards.open("thr_coord")).toEqual([]);
    store.cards.upsert({ ref: "qa:i1:2", coordinatorThreadId: "thr_coord", cardId: "cm-qa-1", directive: "::action{id=\"cm-qa-1\"}", createdAt: 8 });
    expect(store.cards.get("qa:i1:2")).toMatchObject({ resolvedAt: null, createdAt: 8 });
  });

  it("migrates proposed items to tracked items whose sub-threads are adopted", () => {
    const bb = host();
    const db = bb.storage.database();
    // The schema as shipped before proposed items went away.
    bb.storage.migrate(db, STORE_MIGRATIONS.slice(0, 10));
    db.prepare(`INSERT INTO coordinators (thread_id, project_id, template_json, last_opened_at, last_briefing_at, created_at)
      VALUES ('thr_coord', 'proj', ?, 1, 1, 1)`).run(JSON.stringify(ship));
    db.prepare(`INSERT INTO items (id, coordinator_thread_id, title, stage_index, status, primary_thread_id, proposed, created_at, updated_at)
      VALUES ('old', 'thr_coord', 'Old work', 0, 'active', 'thr_old', 1, 1, 1)`).run();
    db.prepare("INSERT INTO item_threads (item_id, thread_id, role) VALUES ('old', 'thr_old', 'primary')").run();
    db.prepare(`INSERT INTO items (id, coordinator_thread_id, title, stage_index, status, primary_thread_id, proposed, created_at, updated_at)
      VALUES ('kept', 'thr_coord', 'Kept work', 1, 'active', 'thr_kept', 0, 2, 2)`).run();
    db.prepare("INSERT INTO item_threads (item_id, thread_id, role) VALUES ('kept', 'thr_kept', 'primary')").run();

    const store = createStore(bb);
    expect(store.items.get("old")).toMatchObject({ proposed: false, primaryThreadId: "thr_old", summary: null, pr: null });
    const byThread = new Map(store.memberships().map((entry) => [entry.threadId, entry]));
    expect(byThread.get("thr_old")).toMatchObject({ itemId: "old", role: "adopted" });
    expect(byThread.get("thr_kept")).toMatchObject({ itemId: "kept", role: "primary" });
    expect(store.coordinators.get("thr_coord")?.lastBriefedAt).toBeNull();
  });
});
