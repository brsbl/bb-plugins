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

function httpError(status: number, code: string | null) {
  return Object.assign(new Error(`HTTP ${status}`), {
    name: "BbHttpError",
    body: null,
    code,
    status,
  });
}

function userRow(
  id: string,
  sequence: number,
  createdAt: number,
  text: string,
) {
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

function timeline(
  rows: unknown[],
  maxSeq: number,
  page: {
    hasOlderRows?: boolean;
    olderCursor?: { anchorSeq: number; anchorId: string } | null;
    kind?: "latest" | "older";
  } = {},
) {
  return {
    rows,
    maxSeq,
    timelinePage: {
      kind: page.kind ?? "latest",
      segmentLimit: 100,
      returnedSegmentCount: rows.length,
      hasOlderRows: page.hasOlderRows ?? false,
      olderCursor: page.olderCursor ?? null,
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
  let listed = true;
  const list = vi.fn(async (args?: { archived?: boolean }) =>
    args?.archived || !listed ? [] : [thread],
  );
  const getTimeline = vi.fn(
    async (_args?: { beforeAnchorSeq?: string }) => currentTimeline,
  );
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
    setCreatedThread(createdAt: number, updatedAt: number) {
      thread = makeThreadResponse({
        ...thread,
        createdAt,
        status: "idle",
        updatedAt,
      });
      return thread;
    },
    setListed(value: boolean) {
      listed = value;
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

  it("queues an unknown idle thread created after the established baseline", async () => {
    const harness = createHarness();
    const maintenance = createThreadHistoryMaintenance(harness.bb);
    await maintenance.scan(scanOptions);
    await maintenance.forgetThread("thr_test");

    const createdAt = Date.now() + 1;
    const idleThread = harness.setCreatedThread(createdAt, createdAt + 2);
    harness.setTimeline(
      [
        userRow(
          "msg_missed_create",
          1,
          createdAt + 1,
          "Learn the missed thread.",
        ),
      ],
      1,
    );

    await expect(maintenance.observeThread(idleThread)).resolves.toEqual({
      queued: true,
    });
    const scanned = await maintenance.scan(scanOptions);
    expect(scanned).toMatchObject({
      episode_count: 1,
      episodes: [
        {
          checkpoint_before: { sequence: null, updated_at: createdAt },
          messages: [{ source_key: "msg_missed_create" }],
        },
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
          messages: [{ source_key: "msg_3" }, { source_key: "msg_4" }],
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
    harness.setTimeline([userRow("msg_1", 1, 20, "First correction.")], 1);
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
      episodes: [{ messages: [{ text: "Recovered after downtime." }] }],
    });
    await afterRestart.release(scanned.lease_id!);
    await harness.harness.lifecycle.dispose();
  });

  it("prunes absent threads and their lease items during reconciliation", async () => {
    const harness = createHarness();
    const maintenance = createThreadHistoryMaintenance(harness.bb);
    await maintenance.scan(scanOptions);
    await maintenance.observeThread(harness.setThread(21));

    const db = harness.bb.storage.database();
    db.prepare(
      `INSERT INTO thread_history_lease_items (
        lease_id, thread_id, target_sequence, target_at,
        observed_thread_updated_at, complete
      ) VALUES (?, ?, ?, ?, ?, ?)`,
    ).run("orphaned_lease", "thr_test", 1, 21, 21, 1);
    harness.setListed(false);

    await expect(
      maintenance.scan({ ...scanOptions, forceReconcile: true }),
    ).resolves.toMatchObject({
      inventory_reconciled: true,
      pending_thread_count: 0,
    });
    expect(
      db
        .prepare(
          "SELECT COUNT(*) AS count FROM thread_history_threads WHERE thread_id = ?",
        )
        .get("thr_test"),
    ).toEqual({ count: 0 });
    expect(
      db
        .prepare(
          "SELECT COUNT(*) AS count FROM thread_history_lease_items WHERE thread_id = ?",
        )
        .get("thr_test"),
    ).toEqual({ count: 0 });
    await harness.harness.lifecycle.dispose();
  });

  it("prunes a candidate on thread_not_found but propagates transient lookup errors", async () => {
    const missingHarness = createHarness();
    const missingMaintenance = createThreadHistoryMaintenance(
      missingHarness.bb,
    );
    await missingMaintenance.scan(scanOptions);
    await missingMaintenance.observeThread(missingHarness.setThread(21));
    missingHarness.get.mockRejectedValueOnce(
      httpError(404, "thread_not_found"),
    );

    await expect(missingMaintenance.scan(scanOptions)).resolves.toMatchObject({
      lease_id: null,
      pending_thread_count: 0,
    });
    expect(missingHarness.getTimeline).not.toHaveBeenCalled();
    await missingHarness.harness.lifecycle.dispose();

    const transientHarness = createHarness();
    const transientMaintenance = createThreadHistoryMaintenance(
      transientHarness.bb,
    );
    await transientMaintenance.scan(scanOptions);
    await transientMaintenance.observeThread(transientHarness.setThread(21));
    transientHarness.get.mockRejectedValueOnce(
      httpError(503, "host_unavailable"),
    );

    await expect(transientMaintenance.scan(scanOptions)).rejects.toMatchObject({
      status: 503,
      code: "host_unavailable",
    });
    await transientHarness.harness.lifecycle.dispose();
  });

  it("revalidates after loading and defers an idle thread updated mid-read", async () => {
    const harness = createHarness();
    const maintenance = createThreadHistoryMaintenance(harness.bb);
    await maintenance.scan(scanOptions);
    await maintenance.observeThread(harness.setThread(21));
    harness.getTimeline.mockImplementationOnce(async () => {
      harness.setThread(22, "idle");
      return timeline(
        [userRow("msg_race", 1, 20, "Do not learn this incomplete turn.")],
        1,
      );
    });

    await expect(maintenance.scan(scanOptions)).resolves.toMatchObject({
      lease_id: null,
      episodes: [],
      deferred_thread_count: 1,
      pending_thread_count: 1,
    });
    expect(harness.get).toHaveBeenCalledTimes(2);
    await harness.harness.lifecycle.dispose();
  });

  it("revalidates after loading and defers a thread that becomes active", async () => {
    const harness = createHarness();
    const maintenance = createThreadHistoryMaintenance(harness.bb);
    await maintenance.scan(scanOptions);
    await maintenance.observeThread(harness.setThread(21));
    harness.getTimeline.mockImplementationOnce(async () => {
      harness.setThread(21, "active");
      return timeline(
        [userRow("msg_active_race", 1, 20, "This turn resumed.")],
        1,
      );
    });

    await expect(maintenance.scan(scanOptions)).resolves.toMatchObject({
      lease_id: null,
      episodes: [],
      deferred_thread_count: 1,
      pending_thread_count: 1,
    });
    expect(harness.get).toHaveBeenCalledTimes(2);
    await harness.harness.lifecycle.dispose();
  });

  it("prunes a thread deleted between timeline load and revalidation", async () => {
    const harness = createHarness();
    const maintenance = createThreadHistoryMaintenance(harness.bb);
    await maintenance.scan(scanOptions);
    const idle = harness.setThread(21);
    await maintenance.observeThread(idle);
    harness.setTimeline(
      [userRow("msg_deleted", 1, 20, "This thread disappears.")],
      1,
    );
    harness.get
      .mockResolvedValueOnce(idle)
      .mockRejectedValueOnce(httpError(404, "thread_not_found"));

    await expect(maintenance.scan(scanOptions)).resolves.toMatchObject({
      lease_id: null,
      episodes: [],
      pending_thread_count: 0,
    });
    expect(harness.getTimeline).toHaveBeenCalledTimes(1);
    await harness.harness.lifecycle.dispose();
  });

  it("drains an unchanged multi-page timeline without skipping or looping", async () => {
    const harness = createHarness();
    const maintenance = createThreadHistoryMaintenance(harness.bb);
    await maintenance.scan(scanOptions);
    await maintenance.observeThread(harness.setThread(21));

    harness.getTimeline.mockImplementation(async (args) => {
      const beforeSequence = Number(args?.beforeAnchorSeq ?? "12");
      const sequence = beforeSequence - 1;
      return timeline(
        [
          userRow(
            `msg_${sequence}`,
            sequence,
            sequence === 1 ? 9 : 9 + sequence,
            sequence === 1 ? "Already learned." : `Unseen message ${sequence}`,
          ),
        ],
        11,
        {
          hasOlderRows: sequence > 1,
          olderCursor:
            sequence > 1
              ? { anchorSeq: sequence, anchorId: `msg_${sequence}` }
              : null,
          kind: args?.beforeAnchorSeq === undefined ? "latest" : "older",
        },
      );
    });

    const learnedIds: string[] = [];
    let pendingThreadCount = 1;
    for (
      let scanCount = 0;
      scanCount < 20 && pendingThreadCount > 0;
      scanCount += 1
    ) {
      const callsBefore = harness.getTimeline.mock.calls.length;
      const scanned = await maintenance.scan(scanOptions);
      expect(
        harness.getTimeline.mock.calls.length - callsBefore,
      ).toBeLessThanOrEqual(4);
      for (const episode of scanned.episodes) {
        learnedIds.push(
          ...episode.messages.map((message) => message.source_key),
        );
      }
      if (scanned.lease_id !== null) {
        const advanced = await maintenance.advance({
          leaseId: scanned.lease_id,
        });
        pendingThreadCount = advanced.pending_thread_count;
      } else {
        pendingThreadCount = scanned.pending_thread_count;
      }
    }

    expect(pendingThreadCount).toBe(0);
    expect(learnedIds).toEqual(
      Array.from({ length: 10 }, (_, index) => `msg_${index + 2}`),
    );
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
      episodes: [{ messages: [{ source_key: "msg_new" }] }],
    });
    expect(await harness.bb.storage.kv.get("legacy:v1")).toBeUndefined();
    await maintenance.release(scanned.lease_id!);
    await harness.harness.lifecycle.dispose();
  });
});
