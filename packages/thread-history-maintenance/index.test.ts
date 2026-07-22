import {
  createFakePluginHost,
  makeThreadResponse,
} from "@bb/plugin-sdk/testing";
import { describe, expect, it, vi } from "vitest";

import { createThreadHistoryMaintenance } from "./index.js";

const scanOptions = {
  leaseSeconds: 60,
  limit: 200,
  maxBytes: 262_144,
  maxMessageBytes: 8_192,
};

function userRow(id: string, sequence: number, createdAt: number, text: string) {
  return {
    id,
    threadId: "thr_test",
    turnId: `turn_${sequence}`,
    sourceSeqStart: sequence,
    sourceSeqEnd: sequence,
    startedAt: createdAt,
    createdAt,
    kind: "conversation" as const,
    role: "user" as const,
    text,
    attachments: null,
    initiator: "user" as const,
    senderThreadId: null,
    systemMessageKind: "unlabeled" as const,
    systemMessageSubject: null,
    turnRequest: { kind: "message" as const, status: "accepted" as const },
    mentions: [],
  };
}

function assistantRow(
  id: string,
  sequence: number,
  createdAt: number,
  text: string,
) {
  return {
    id,
    threadId: "thr_test",
    turnId: `turn_${sequence - 1}`,
    sourceSeqStart: sequence,
    sourceSeqEnd: sequence,
    startedAt: createdAt,
    createdAt,
    kind: "conversation" as const,
    role: "assistant" as const,
    text,
    attachments: null,
    turnRequest: null,
  };
}

function timeline(rows: unknown[], maxSeq: number) {
  return {
    rows,
    maxSeq,
    timelinePage: {
      kind: "latest",
      segmentLimit: 100,
      returnedSegmentCount: rows.length,
      hasOlderRows: false,
      olderCursor: null,
    },
    activePromptMode: null,
    activeThinking: null,
    activeWorkflow: null,
    activeBackgroundCommands: [],
    pendingTodos: null,
    goal: null,
    modelFallback: null,
  };
}

function createHarness() {
  let thread = makeThreadResponse({
    id: "thr_test",
    projectId: "proj_test",
    title: "Task episode",
    createdAt: 1,
    updatedAt: 10,
  });
  let currentTimeline = timeline([], 0);
  const list = vi.fn(async (args?: { archived?: boolean }) =>
    args?.archived ? [] : [thread],
  );
  const getTimeline = vi.fn(async () => currentTimeline);
  const get = vi.fn(async () => thread);
  const host = createFakePluginHost({
    pluginId: "history-test",
    sdk: { threads: { get, list, timeline: getTimeline } },
  });

  return {
    ...host,
    list,
    get,
    getTimeline,
    setThread(updatedAt: number, status: "active" | "idle" = "idle") {
      thread = makeThreadResponse({ ...thread, status, updatedAt });
      return thread;
    },
    setTimeline(rows: unknown[], maxSeq: number) {
      currentTimeline = timeline(rows, maxSeq);
    },
  };
}

describe("idle-episode thread history maintenance", () => {
  it("does not replay stale lifecycle events delivered before the baseline", async () => {
    const harness = createHarness();
    const maintenance = createThreadHistoryMaintenance(harness.bb);

    await maintenance.observeThread(harness.setThread(10));
    await expect(maintenance.scan(scanOptions)).resolves.toMatchObject({
      baseline_established: true,
      lease_id: null,
      episodes: [],
      pending_thread_count: 0,
    });
    expect(harness.getTimeline).not.toHaveBeenCalled();
    await harness.harness.lifecycle.dispose();
  });

  it("tracks newly created threads so their first idle episode is learnable", async () => {
    const harness = createHarness();
    const maintenance = createThreadHistoryMaintenance(harness.bb);
    await maintenance.scan(scanOptions);
    await maintenance.forgetThread("thr_test");

    await maintenance.observeCreated(harness.setThread(11));
    const idleThread = harness.setThread(21);
    harness.setTimeline(
      [userRow("msg_1", 1, 20, "Learn this first episode.")],
      1,
    );
    await maintenance.observeThread(idleThread);

    const scanned = await maintenance.scan(scanOptions);
    expect(scanned).toMatchObject({
      episode_count: 1,
      episodes: [
        { messages: [{ role: "user", text: "Learn this first episode." }] },
      ],
    });
    await maintenance.release(scanned.lease_id!);
    await harness.harness.lifecycle.dispose();
  });

  it("defers a queued thread that became active again", async () => {
    const harness = createHarness();
    const maintenance = createThreadHistoryMaintenance(harness.bb);
    await maintenance.scan(scanOptions);
    await maintenance.observeThread(harness.setThread(21));
    harness.setThread(30, "active");
    harness.setTimeline(
      [userRow("msg_1", 1, 20, "Do not scan this mid-turn.")],
      1,
    );

    await expect(maintenance.scan(scanOptions)).resolves.toMatchObject({
      lease_id: null,
      episodes: [],
      deferred_thread_count: 1,
      pending_thread_count: 1,
    });
    expect(harness.getTimeline).not.toHaveBeenCalled();
    await harness.harness.lifecycle.dispose();
  });

  it("baselines once, queues idle threads, and advances per-thread checkpoints", async () => {
    const harness = createHarness();
    const maintenance = createThreadHistoryMaintenance(harness.bb);

    await expect(maintenance.scan(scanOptions)).resolves.toMatchObject({
      baseline_established: true,
      inventory_reconciled: true,
      checkpoint_mode: "per-thread",
      lease_id: null,
      episodes: [],
    });
    expect(harness.list).toHaveBeenCalledTimes(2);
    expect(harness.getTimeline).not.toHaveBeenCalled();

    const idleThread = harness.setThread(21);
    harness.setTimeline(
      [
        userRow("msg_1", 1, 20, "Keep this focused."),
        assistantRow("msg_2", 2, 21, "Done."),
      ],
      2,
    );
    await maintenance.observeThread(idleThread);
    const scanned = await maintenance.scan(scanOptions);

    expect(harness.list).toHaveBeenCalledTimes(2);
    expect(harness.getTimeline).toHaveBeenCalledTimes(1);
    expect(scanned).toMatchObject({
      checkpoint_mode: "per-thread",
      episode_count: 1,
      message_count: 2,
      episodes: [
        {
          thread_id: "thr_test",
          checkpoint_before: { sequence: null, updated_at: 10 },
          checkpoint_commit: { sequence: 2, updated_at: 21 },
          complete: true,
          messages: [
            { role: "user", text: "Keep this focused." },
            { role: "assistant", text: "Done." },
          ],
        },
      ],
    });
    expect(scanned.lease_id).toMatch(/^[a-f0-9]{32}$/);
    await expect(
      maintenance.advance({ leaseId: scanned.lease_id! }),
    ).resolves.toEqual({ advanced_threads: 1, pending_thread_count: 0 });

    const nextIdle = harness.setThread(31);
    harness.setTimeline(
      [
        userRow("msg_1", 1, 20, "Keep this focused."),
        assistantRow("msg_2", 2, 21, "Done."),
        userRow("msg_3", 3, 30, "Make the title quieter."),
        assistantRow("msg_4", 4, 31, "Updated."),
      ],
      4,
    );
    await maintenance.observeThread(nextIdle);
    await expect(maintenance.scan(scanOptions)).resolves.toMatchObject({
      episodes: [
        {
          checkpoint_before: { sequence: 2, updated_at: 21 },
          messages: [
            { source_key: "msg_3" },
            { source_key: "msg_4" },
          ],
        },
      ],
    });
    await harness.harness.lifecycle.dispose();
  });

  it("keeps a newer idle episode queued when an older lease advances", async () => {
    const harness = createHarness();
    const maintenance = createThreadHistoryMaintenance(harness.bb);
    await maintenance.scan(scanOptions);

    const firstIdle = harness.setThread(21);
    harness.setTimeline(
      [userRow("msg_1", 1, 20, "First correction.")],
      1,
    );
    await maintenance.observeThread(firstIdle);
    const first = await maintenance.scan(scanOptions);

    const secondIdle = harness.setThread(31);
    harness.setTimeline(
      [
        userRow("msg_1", 1, 20, "First correction."),
        userRow("msg_2", 2, 30, "Second correction."),
      ],
      2,
    );
    await maintenance.observeThread(secondIdle);
    await expect(
      maintenance.advance({ leaseId: first.lease_id! }),
    ).resolves.toEqual({ advanced_threads: 1, pending_thread_count: 1 });

    const second = await maintenance.scan(scanOptions);
    expect(second.episodes).toMatchObject([
      { messages: [{ source_key: "msg_2", text: "Second correction." }] },
    ]);
    await maintenance.release(second.lease_id!);
    await harness.harness.lifecycle.dispose();
  });

  it("uses startup inventory reconciliation only to recover missed events", async () => {
    const harness = createHarness();
    const first = createThreadHistoryMaintenance(harness.bb);
    await first.scan(scanOptions);
    expect(harness.list).toHaveBeenCalledTimes(2);

    harness.setThread(21);
    harness.setTimeline(
      [userRow("msg_1", 1, 20, "Recovered after downtime.")],
      1,
    );
    const afterRestart = createThreadHistoryMaintenance(harness.bb);
    const scanned = await afterRestart.scan(scanOptions);

    expect(harness.list).toHaveBeenCalledTimes(4);
    expect(scanned).toMatchObject({
      inventory_reconciled: true,
      episodes: [
        { messages: [{ text: "Recovered after downtime." }] },
      ],
    });
    await afterRestart.release(scanned.lease_id!);
    await harness.harness.lifecycle.dispose();
  });

  it("migrates a legacy high-water cursor without replaying older history", async () => {
    const harness = createHarness();
    harness.setThread(30);
    harness.setTimeline(
      [
        userRow("msg_old", 1, 10, "Already learned."),
        userRow("msg_new", 2, 25, "New recurring signal."),
      ],
      2,
    );
    await harness.bb.storage.kv.set("legacy:v1", {
      version: 1,
      cursor: { created_at: 20, item_id: "thr_previous" },
    });
    const maintenance = createThreadHistoryMaintenance(harness.bb, {
      legacyStateKeys: ["legacy:v1"],
    });

    const scanned = await maintenance.scan(scanOptions);
    expect(scanned).toMatchObject({
      baseline_established: true,
      episodes: [
        { messages: [{ source_key: "msg_new" }] },
      ],
    });
    expect(await harness.bb.storage.kv.get("legacy:v1")).toBeUndefined();
    await maintenance.release(scanned.lease_id!);
    await harness.harness.lifecycle.dispose();
  });
});
