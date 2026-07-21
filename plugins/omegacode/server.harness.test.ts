import { createFakePluginHost } from "@bb/plugin-sdk/testing";
import { afterEach, describe, expect, it, vi } from "vitest";

import plugin, {
  createGlobalRunPresenter,
  resetOmegacodeCachesForTest,
} from "./server";

type GlobalRunPresenter = ReturnType<typeof createGlobalRunPresenter>;

const presenters: GlobalRunPresenter[] = [];

function presenterFor(bb: Parameters<typeof createGlobalRunPresenter>[0]) {
  const presenter = createGlobalRunPresenter(bb);
  presenters.push(presenter);
  return presenter;
}

async function flushMicrotasks(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

const ownedRun = {
  runId: "wf_owner_lookup",
  workflow: "owner.workflow.js",
  workflowName: "Owner lookup",
  description: null,
  phases: [],
  createdAt: null,
  status: "completed",
  updatedAt: null,
  heartbeatAgeMs: null,
  counts: {
    total: 0,
    running: 0,
    queued: 0,
    completed: 0,
    failed: 0,
    cancelled: 0,
  },
  agents: [],
  owner: {
    threadId: "thr_slow_owner",
    environmentId: "env_owner",
    projectId: "proj_owner",
  },
  workflowFile: null,
  journalDescription: null,
};

const completedRunWithWorkerHistory = {
  ...ownedRun,
  runId: "wf_completed_history",
  createdAt: 100,
  updatedAt: 200,
  counts: {
    total: 1,
    running: 0,
    queued: 0,
    completed: 1,
    failed: 0,
    cancelled: 0,
  },
  agents: [
    {
      index: 1,
      label: "Completed worker",
      phase: "Verify",
      provider: "codex",
      model: "gpt-test",
      state: "completed",
      startedAt: 10,
      bytes: 42,
      tokens: 99,
      durationMs: 100,
    },
  ],
};

afterEach(() => {
  for (const presenter of presenters.splice(0)) presenter.dispose();
  resetOmegacodeCachesForTest();
  vi.useRealTimers();
});

describe("Omegacode plugin contract", () => {
  it("returns global runs immediately while an owner lookup is unresolved", () => {
    vi.useFakeTimers();
    const delayedThreadsGet = vi.fn(
      () => new Promise<never>(() => {}),
    );
    const bb = {
      sdk: { threads: { get: delayedThreadsGet } },
    };

    const presenter = presenterFor(bb as never);
    const response = presenter.present([ownedRun] as never);

    expect(delayedThreadsGet).not.toHaveBeenCalled();
    vi.advanceTimersByTime(0);
    expect(delayedThreadsGet).toHaveBeenCalledWith({
      threadId: "thr_slow_owner",
      signal: expect.any(AbortSignal),
    });
    expect(Array.isArray(response)).toBe(true);
    if (!Array.isArray(response)) return;
    expect(response[0]?.owner).toEqual({
      threadId: "thr_slow_owner",
      environmentId: "env_owner",
      projectId: "proj_owner",
      threadTitle: null,
      threadAvailable: false,
    });
  });

  it("deduplicates and serializes owner label warming, then publishes the result", async () => {
    vi.useFakeTimers();
    const resolveThreads: Array<(thread: { title: string }) => void> = [];
    const threadsGet = vi.fn(
      () =>
        new Promise<{ title: string }>((resolve) => {
          resolveThreads.push(resolve);
        }),
    );
    const publish = vi.fn();
    const bb = {
      sdk: { threads: { get: threadsGet } },
      realtime: { publish },
      log: { warn: vi.fn() },
    };
    const secondOwnerRun = {
      ...ownedRun,
      runId: "wf_second_owner_lookup",
      owner: { ...ownedRun.owner, threadId: "thr_second_owner" },
    };
    const presenter = presenterFor(bb as never);

    presenter.present([ownedRun, secondOwnerRun] as never);
    presenter.present([ownedRun, secondOwnerRun] as never);
    expect(threadsGet).not.toHaveBeenCalled();
    vi.advanceTimersByTime(0);
    expect(threadsGet).toHaveBeenCalledTimes(1);

    resolveThreads[0]?.({ title: "Recovered owner" });
    await flushMicrotasks();

    expect(publish).not.toHaveBeenCalled();
    expect(threadsGet).toHaveBeenCalledTimes(2);
    expect(threadsGet).toHaveBeenLastCalledWith({
      threadId: "thr_second_owner",
      signal: expect.any(AbortSignal),
    });

    resolveThreads[1]?.({ title: "Second owner" });
    await flushMicrotasks();

    expect(publish).toHaveBeenCalledTimes(1);
    expect(publish).toHaveBeenCalledWith("omegacode", {
      changedAt: expect.any(Number),
      ownerLabelsChanged: true,
    });
    expect(
      presenter.present([ownedRun, secondOwnerRun] as never).map((run) => run.owner),
    ).toEqual([
      expect.objectContaining({
        threadTitle: "Recovered owner",
        threadAvailable: true,
      }),
      expect.objectContaining({
        threadTitle: "Second owner",
        threadAvailable: true,
      }),
    ]);
    expect(threadsGet).toHaveBeenCalledTimes(2);
  });

  it("cancels queued owner warming and suppresses publication on dispose", async () => {
    vi.useFakeTimers();
    const resolveThreads: Array<(thread: { title: string }) => void> = [];
    const signals: AbortSignal[] = [];
    const threadsGet = vi.fn(
      ({ signal }: { signal: AbortSignal }) =>
        new Promise<{ title: string }>((resolve) => {
          signals.push(signal);
          resolveThreads.push(resolve);
        }),
    );
    const publish = vi.fn();
    const presenter = presenterFor({
      sdk: { threads: { get: threadsGet } },
      realtime: { publish },
      log: { warn: vi.fn() },
    } as never);
    const secondOwnerRun = {
      ...ownedRun,
      runId: "wf_disposed_queue",
      owner: { ...ownedRun.owner, threadId: "thr_disposed_queue" },
    };

    presenter.present([ownedRun, secondOwnerRun] as never);
    vi.advanceTimersByTime(0);
    expect(threadsGet).toHaveBeenCalledTimes(1);

    presenter.dispose();
    expect(signals[0]?.aborted).toBe(true);
    resolveThreads[0]?.({ title: "Too late" });
    await flushMicrotasks();

    expect(threadsGet).toHaveBeenCalledTimes(1);
    expect(publish).not.toHaveBeenCalled();
  });

  it("slims terminal global history without losing its summary or owner", () => {
    vi.useFakeTimers();
    const bb = {
      sdk: { threads: { get: () => new Promise<never>(() => {}) } },
    };
    const presenter = presenterFor(bb as never);

    for (const status of ["completed", "cancelled"]) {
      const response = presenter.present(
        [{ ...completedRunWithWorkerHistory, runId: `wf_${status}_history`, status }] as never,
      );

      expect(response[0]).toMatchObject({
        runId: `wf_${status}_history`,
        status,
        createdAt: 100,
        updatedAt: 200,
        counts: {
          total: 1,
          completed: 1,
        },
        owner: {
          threadId: "thr_slow_owner",
          environmentId: "env_owner",
          threadTitle: null,
          threadAvailable: false,
        },
      });
      expect(response[0]?.agents).toEqual([]);
    }
  });

  it("registers thread-scoped status surfaces", async () => {
    const { bb, harness } = createFakePluginHost({ pluginId: "omega" });

    await plugin(bb);

    expect(harness.inspection.registrations.rpcMethods.sort()).toEqual([
      "allRuns",
      "runs",
    ]);
    expect(harness.inspection.registrations.cli?.name).toBe("omegacode");
    expect(
      harness.inspection.registrations.services.map(({ name }) => name),
    ).toContain("watch");
    await harness.lifecycle.dispose();
  });
});
