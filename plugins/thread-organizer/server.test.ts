import {
  createFakePluginHost,
  makeThreadResponse,
} from "@get-bb/plugin-sdk/testing";
import { describe, expect, it, vi } from "vitest";

import plugin from "./server.js";

const sections = [
  { id: "sec_bb", name: "bb" },
  { id: "sec_design", name: "Design" },
  { id: "sec_extensions", name: "bb Extensions" },
  { id: "sec_moss", name: "moss" },
  { id: "sec_qa", name: "QA" },
  { id: "sec_writing", name: "Writing" },
];

function promptEntry(text: string, createdAt = 1) {
  return {
    id: `prompt_${createdAt}`,
    createdAt,
    input: [{ type: "text" as const, text }],
  };
}

function completedEvent(seq: number) {
  return {
    id: `event_${seq}`,
    createdAt: seq,
    data: { providerThreadId: null, status: "completed" as const },
    scope: { kind: "thread" as const },
    seq,
    threadId: "thr_test",
    type: "turn/completed" as const,
  };
}

function createHarness(input?: {
  archiveAfterList?: boolean;
  existingThreads?: boolean;
  getFailures?: number;
  legacyModeOnly?: boolean;
  mode?: "apply" | "observe";
  projectName?: string;
  prompt?: string;
  thread?: Parameters<typeof makeThreadResponse>[0];
}) {
  const prompt =
    input?.prompt ??
    "Create a bb plugin that automatically organizes new threads.";
  let thread = makeThreadResponse({
    id: "thr_test",
    projectId: "proj_test",
    status: "starting",
    title: null,
    titleFallback: prompt,
    ...input?.thread,
  });
  const events: ReturnType<typeof completedEvent>[] = [];
  type ThreadChangedCallback = (event: {
    changes: readonly ("pin-state-changed" | "status-changed")[];
    entity: "thread";
    id?: string;
    type: "changed";
  }) => void;
  const threadChangedCallbacks = new Set<ThreadChangedCallback>();
  let remainingGetFailures = input?.getFailures ?? 0;
  let promptHistory = [promptEntry(prompt)];
  const update = vi.fn(
    async (args: {
      sectionId?: string | null;
      threadId: string;
      title?: string | null;
    }) => {
      thread = makeThreadResponse({
        ...thread,
        ...(Object.hasOwn(args, "sectionId")
          ? { sectionId: args.sectionId ?? null }
          : {}),
        ...(Object.hasOwn(args, "title")
          ? { title: args.title ?? null }
          : {}),
        updatedAt: thread.updatedAt + 1,
      });
      return thread;
    },
  );
  const pin = vi.fn(async () => {
    thread = makeThreadResponse({
      ...thread,
      pinnedAt: thread.updatedAt + 1,
      updatedAt: thread.updatedAt + 1,
    });
    return thread;
  });
  const unpin = vi.fn(async () => {
    thread = makeThreadResponse({
      ...thread,
      pinnedAt: null,
      updatedAt: thread.updatedAt + 1,
    });
    return thread;
  });
  const host = createFakePluginHost({
    pluginId: "thread-organizer",
    settings: input?.legacyModeOnly
      ? { mode: input?.mode ?? "observe" }
      : { inboxMode: input?.mode ?? "observe" },
    sdk: {
      subscribe: ({ callback: realtimeCallback }) => {
        const callback = realtimeCallback as ThreadChangedCallback;
        threadChangedCallbacks.add(callback);
        return () => {
          threadChangedCallbacks.delete(callback);
        };
      },
      projects: {
        get: async () => ({
          id: "proj_test",
          name: input?.projectName ?? "Personal",
        }),
      },
      threadSections: { list: async () => sections },
      threads: {
        events: {
          wait: async (args: { afterSeq?: string }) => {
            const after = Number(args.afterSeq ?? 0);
            return events.find((event) => event.seq > after) ?? null;
          },
        },
        get: async () => {
          if (remainingGetFailures > 0) {
            remainingGetFailures -= 1;
            throw new Error("transient get failure");
          }
          return thread;
        },
        list: async () => {
          if (!input?.existingThreads) return [];
          const listed = thread;
          if (input.archiveAfterList) {
            thread = makeThreadResponse({
              ...thread,
              archivedAt: thread.updatedAt + 1,
            });
          }
          return [listed];
        },
        pin,
        promptHistory: async () => promptHistory,
        unpin,
        update,
      },
    },
  });

  return {
    ...host,
    addCompletedTurn(seq: number) {
      events.push(completedEvent(seq));
      thread = makeThreadResponse({ ...thread, status: "idle" });
    },
    currentThread() {
      return thread;
    },
    emitThreadChanged(
      ...changes: ("pin-state-changed" | "status-changed")[]
    ): void {
      for (const callback of threadChangedCallbacks) {
        callback({
          changes,
          entity: "thread",
          id: thread.id,
          type: "changed",
        });
      }
    },
    setPromptHistory(...texts: string[]): void {
      promptHistory = texts.map((text, index) =>
        promptEntry(text, index + 1),
      );
    },
    setThread(
      changes: Partial<ReturnType<typeof makeThreadResponse>>,
    ): void {
      thread = makeThreadResponse({ ...thread, ...changes });
    },
    pin,
    unpin,
    update,
  };
}

describe("Thread Organizer plugin", () => {
  it("registers a headless apply-mode lifecycle", async () => {
    const { bb, harness } = createHarness();
    plugin(bb);

    expect(harness.inspection.registrations.settingsDescriptors).toMatchObject({
      inboxMode: { default: "apply", options: ["observe", "apply"] },
    });
    expect(harness.inspection.registrations.threadEventHandlers).toMatchObject({
      "thread.active": 1,
      "thread.archived": 1,
      "thread.created": 1,
      "thread.deleted": 1,
      "thread.failed": 1,
      "thread.idle": 1,
    });
    expect(harness.inspection.registrations.cli).toBeNull();
    expect(harness.inspection.registrations.rpcMethods).toEqual([]);
    await harness.lifecycle.dispose();
  });

  it("uses the new apply default instead of a stored legacy observe value", async () => {
    const organizer = createHarness({
      existingThreads: true,
      legacyModeOnly: true,
      mode: "observe",
      thread: { status: "idle" },
    });
    plugin(organizer.bb);

    const service = organizer.harness.behavior.runService(
      "inbox-reconciliation",
    );
    await vi.waitFor(() => {
      expect(organizer.pin).toHaveBeenCalledWith({ threadId: "thr_test" });
    });
    service.controller.abort();
    await service.done;

    expect(organizer.harness.inspection.logEntries).toContainEqual(
      expect.objectContaining({
        message: expect.stringContaining("Thread Organizer loaded mode=apply"),
      }),
    );
    await organizer.harness.lifecycle.dispose();
  });

  it("logs a recommendation without changing a thread in observe mode", async () => {
    const { bb, harness, currentThread, update } = createHarness();
    plugin(bb);

    await harness.behavior.emitThreadEvent("thread.created", {
      thread: currentThread(),
    });

    expect(update).not.toHaveBeenCalled();
    expect(harness.inspection.logEntries).toContainEqual(
      expect.objectContaining({
        level: "info",
        message: expect.stringContaining(
          "mode=observe action=propose-section target=extensions",
        ),
      }),
    );
    await harness.lifecycle.dispose();
  });

  it("classifies personal-workspace threads without a project GET", async () => {
    const { bb, harness, currentThread } = createHarness({
      thread: { projectId: "proj_personal" },
    });
    plugin(bb);

    await harness.behavior.emitThreadEvent("thread.created", {
      thread: currentThread(),
    });

    expect(
      harness.inspection.sdk.callsTo("projects.get"),
    ).toHaveLength(0);
    expect(harness.inspection.logEntries).toContainEqual(
      expect.objectContaining({
        message: expect.stringContaining(
          "mode=observe action=propose-section target=extensions",
        ),
      }),
    );
    await harness.lifecycle.dispose();
  });

  it("places a new unsectioned plugin thread in Extensions in apply mode", async () => {
    const { bb, harness, currentThread, update } = createHarness({
      mode: "apply",
    });
    plugin(bb);

    await harness.behavior.emitThreadEvent("thread.created", {
      thread: currentThread(),
    });

    expect(update).toHaveBeenCalledWith({
      threadId: "thr_test",
      sectionId: "sec_extensions",
    });
    await harness.lifecycle.dispose();
  });

  it("uses the pinned area as an inbox while preserving the semantic section", async () => {
    const organizer = createHarness({ mode: "apply" });
    plugin(organizer.bb);
    await organizer.harness.behavior.emitThreadEvent("thread.created", {
      thread: organizer.currentThread(),
    });
    expect(organizer.currentThread().sectionId).toBe("sec_extensions");

    organizer.setThread({ status: "idle" });
    await organizer.harness.behavior.emitThreadEvent("thread.idle", {
      lastAssistantText: "Done.",
      thread: organizer.currentThread(),
    });

    expect(organizer.pin).toHaveBeenCalledWith({ threadId: "thr_test" });
    expect(organizer.currentThread().pinnedAt).not.toBeNull();
    expect(organizer.currentThread().sectionId).toBe("sec_extensions");

    organizer.setThread({ status: "active" });
    await organizer.harness.behavior.emitThreadEvent("thread.active", {
      thread: organizer.currentThread(),
    });

    expect(organizer.unpin).toHaveBeenCalledWith({ threadId: "thr_test" });
    expect(organizer.currentThread().pinnedAt).toBeNull();
    expect(organizer.currentThread().sectionId).toBe("sec_extensions");
    await organizer.harness.lifecycle.dispose();
  });

  it("reuses its durable section decision during pin lifecycle changes", async () => {
    const organizer = createHarness({ mode: "apply" });
    plugin(organizer.bb);
    await organizer.harness.behavior.emitThreadEvent("thread.created", {
      thread: organizer.currentThread(),
    });
    const promptHistoryCalls =
      organizer.harness.inspection.sdk.callsTo("threads.promptHistory").length;
    const projectCalls =
      organizer.harness.inspection.sdk.callsTo("projects.get").length;
    const sectionListCalls =
      organizer.harness.inspection.sdk.callsTo("threadSections.list").length;

    organizer.setThread({ status: "idle" });
    await organizer.harness.behavior.emitThreadEvent("thread.idle", {
      lastAssistantText: "Done.",
      thread: organizer.currentThread(),
    });
    organizer.setThread({ status: "active" });
    await organizer.harness.behavior.emitThreadEvent("thread.active", {
      thread: organizer.currentThread(),
    });

    expect(
      organizer.harness.inspection.sdk.callsTo("threads.promptHistory"),
    ).toHaveLength(promptHistoryCalls);
    expect(
      organizer.harness.inspection.sdk.callsTo("projects.get"),
    ).toHaveLength(projectCalls);
    expect(
      organizer.harness.inspection.sdk.callsTo("threadSections.list"),
    ).toHaveLength(sectionListCalls);
    expect(
      await organizer.bb.storage.kv.get("thread:v1:thr_test"),
    ).toMatchObject({
      sectionClassification: {
        decision: { target: "extensions" },
      },
    });
    await organizer.harness.lifecycle.dispose();
  });

  it("remembers organizer-owned pins across reloads", async () => {
    const organizer = createHarness({ mode: "apply" });
    plugin(organizer.bb);
    await organizer.harness.behavior.emitThreadEvent("thread.created", {
      thread: organizer.currentThread(),
    });
    organizer.setThread({ status: "idle" });
    await organizer.harness.behavior.emitThreadEvent("thread.idle", {
      lastAssistantText: "Done.",
      thread: organizer.currentThread(),
    });
    expect(
      await organizer.bb.storage.kv.get("thread:v1:thr_test"),
    ).toMatchObject({
      inboxManagedPinnedAt: organizer.currentThread().pinnedAt,
    });

    const reloaded = await organizer.harness.lifecycle.reload(plugin);
    organizer.setThread({ status: "active" });
    await reloaded.harness.behavior.emitThreadEvent("thread.active", {
      thread: organizer.currentThread(),
    });

    expect(organizer.unpin).toHaveBeenCalledWith({ threadId: "thr_test" });
    expect(organizer.currentThread().pinnedAt).toBeNull();
    await reloaded.harness.lifecycle.dispose();
  });

  it("adopts an existing idle thread into the inbox on startup", async () => {
    const organizer = createHarness({
      existingThreads: true,
      mode: "apply",
      thread: { status: "idle" },
    });
    plugin(organizer.bb);

    const service = organizer.harness.behavior.runService(
      "inbox-reconciliation",
    );
    await vi.waitFor(() => {
      expect(organizer.pin).toHaveBeenCalledWith({ threadId: "thr_test" });
    });
    service.controller.abort();
    await service.done;
    expect(organizer.currentThread().pinnedAt).not.toBeNull();
    expect(
      organizer.harness.inspection.sdk.callsTo("threads.list")[0]?.[0],
    ).toMatchObject({
      archived: false,
      hasParent: false,
    });
    await organizer.harness.lifecycle.dispose();
  });

  it("adopts an existing failed thread into the inbox on startup", async () => {
    const organizer = createHarness({
      existingThreads: true,
      mode: "apply",
      thread: { status: "error" },
    });
    plugin(organizer.bb);

    const service = organizer.harness.behavior.runService(
      "inbox-reconciliation",
    );
    await vi.waitFor(() => {
      expect(organizer.pin).toHaveBeenCalledWith({ threadId: "thr_test" });
    });
    service.controller.abort();
    await service.done;
    await organizer.harness.lifecycle.dispose();
  });

  it("skips a thread archived while startup reconciliation is running", async () => {
    const organizer = createHarness({
      archiveAfterList: true,
      existingThreads: true,
      mode: "apply",
      thread: { status: "idle" },
    });
    plugin(organizer.bb);

    const service = organizer.harness.behavior.runService(
      "inbox-reconciliation",
    );
    await vi.waitFor(() => {
      expect(
        organizer.harness.inspection.sdk.callsTo("threads.get"),
      ).toHaveLength(1);
    });
    service.controller.abort();
    await service.done;
    expect(organizer.pin).not.toHaveBeenCalled();
    expect(await organizer.bb.storage.kv.list("thread:")).toEqual([]);
    await organizer.harness.lifecycle.dispose();
  });

  it("uses realtime changes instead of rescanning on the old five-second interval", async () => {
    vi.useFakeTimers();
    try {
      const organizer = createHarness({
        existingThreads: true,
        mode: "apply",
        thread: { status: "idle" },
      });
      plugin(organizer.bb);

      const service = organizer.harness.behavior.runService(
        "inbox-reconciliation",
      );
      let settled = false;
      void service.done.then(() => {
        settled = true;
      });
      await vi.advanceTimersByTimeAsync(0);
      expect(settled).toBe(false);
      expect(organizer.pin).toHaveBeenCalledWith({ threadId: "thr_test" });
      const listCalls =
        organizer.harness.inspection.sdk.callsTo("threads.list").length;

      organizer.setThread({ status: "active" });
      await vi.advanceTimersByTimeAsync(5_000);

      expect(
        organizer.harness.inspection.sdk.callsTo("threads.list"),
      ).toHaveLength(listCalls);
      expect(organizer.unpin).not.toHaveBeenCalled();

      organizer.emitThreadChanged("status-changed");
      await vi.advanceTimersByTimeAsync(0);

      expect(organizer.unpin).toHaveBeenCalledWith({
        threadId: "thr_test",
      });
      service.controller.abort();
      await service.done;
      await organizer.harness.lifecycle.dispose();
    } finally {
      vi.useRealTimers();
    }
  });

  it("snoozes a manually unpinned idle thread until its next completed run", async () => {
    const organizer = createHarness({
      existingThreads: true,
      mode: "apply",
      thread: { status: "idle" },
    });
    plugin(organizer.bb);

    const service = organizer.harness.behavior.runService(
      "inbox-reconciliation",
    );
    await vi.waitFor(() => {
      expect(organizer.pin).toHaveBeenCalledTimes(1);
    });

    organizer.setThread({ pinnedAt: null, status: "idle" });
    organizer.emitThreadChanged("pin-state-changed");
    await vi.waitFor(async () => {
      expect(
        await organizer.bb.storage.kv.get("thread:v1:thr_test"),
      ).toMatchObject({ inboxSnoozed: true });
    });

    expect(organizer.pin).toHaveBeenCalledTimes(1);
    expect(organizer.currentThread().pinnedAt).toBeNull();

    organizer.setThread({ status: "active" });
    await organizer.harness.behavior.emitThreadEvent("thread.active", {
      thread: organizer.currentThread(),
    });
    organizer.setThread({ status: "idle" });
    await organizer.harness.behavior.emitThreadEvent("thread.idle", {
      lastAssistantText: "Done.",
      thread: organizer.currentThread(),
    });

    expect(organizer.pin).toHaveBeenCalledTimes(2);
    expect(organizer.currentThread().pinnedAt).not.toBeNull();
    service.controller.abort();
    await service.done;
    await organizer.harness.lifecycle.dispose();
  });

  it("retries a transient reconciliation failure without a reload", async () => {
    const organizer = createHarness({
      existingThreads: true,
      getFailures: 1,
      mode: "apply",
      thread: { status: "idle" },
    });
    plugin(organizer.bb);

    const service = organizer.harness.behavior.runService(
      "inbox-reconciliation",
    );
    await vi.waitFor(() => {
      expect(organizer.pin).toHaveBeenCalledWith({ threadId: "thr_test" });
    });
    service.controller.abort();
    await service.done;

    expect(organizer.harness.inspection.logEntries).toContainEqual(
      expect.objectContaining({
        message: expect.stringContaining(
          "action=reconciliation-retry attempt=1 error=transient get failure",
        ),
      }),
    );
    await organizer.harness.lifecycle.dispose();
  });

  it("surfaces an exhausted reconciliation failure to the service host", async () => {
    vi.useFakeTimers();
    try {
      const organizer = createHarness({
        existingThreads: true,
        getFailures: 3,
        mode: "apply",
        thread: { status: "idle" },
      });
      plugin(organizer.bb);

      const service = organizer.harness.behavior.runService(
        "inbox-reconciliation",
      );
      const outcome = service.done.catch((error: unknown) => error);
      await vi.advanceTimersByTimeAsync(600);

      await expect(outcome).resolves.toEqual(
        expect.objectContaining({ message: "transient get failure" }),
      );
      expect(organizer.pin).not.toHaveBeenCalled();
      await organizer.harness.lifecycle.dispose();
    } finally {
      vi.useRealTimers();
    }
  });

  it("bounds reconciliation workers and admits no mutation after abort", async () => {
    const threads = Array.from({ length: 8 }, (_, index) =>
      makeThreadResponse({
        id: `thr_${index}`,
        projectId: "proj_test",
        status: "error",
        titleFallback: `Thread ${index}`,
      }),
    );
    let releaseGets: () => void = () => undefined;
    const getGate = new Promise<void>((resolve) => {
      releaseGets = resolve;
    });
    let getCalls = 0;
    const getSignals: Array<AbortSignal | undefined> = [];
    const pin = vi.fn();
    const host = createFakePluginHost({
      pluginId: "thread-organizer",
      settings: { inboxMode: "apply" },
      sdk: {
        threads: {
          get: async ({ signal, threadId }) => {
            getCalls += 1;
            getSignals.push(signal);
            await getGate;
            return threads.find((thread) => thread.id === threadId)!;
          },
          list: async () => threads,
          pin,
        },
      },
    });
    plugin(host.bb);

    const service = host.harness.behavior.runService(
      "inbox-reconciliation",
    );
    await vi.waitFor(() => {
      expect(getCalls).toBe(4);
    });
    expect(getSignals).toHaveLength(4);
    expect(getSignals.every((signal) => signal instanceof AbortSignal)).toBe(
      true,
    );
    service.controller.abort();
    releaseGets();
    await service.done;

    expect(getCalls).toBe(4);
    expect(pin).not.toHaveBeenCalled();
    await host.harness.lifecycle.dispose();
  });

  it("repeats discovery to close a pin-order pagination gap", async () => {
    const threads = Array.from({ length: 101 }, (_, index) =>
      makeThreadResponse({
        id: `thr_${index}`,
        projectId: "proj_test",
        status: "error",
        titleFallback: `Thread ${index}`,
      }),
    );
    const byId = new Map(threads.map((thread) => [thread.id, thread]));
    const pinned = new Set<string>();
    let pass = 0;
    const host = createFakePluginHost({
      pluginId: "thread-organizer",
      settings: { inboxMode: "apply" },
      sdk: {
        threads: {
          get: async ({ threadId }) => byId.get(threadId)!,
          list: async (args) => {
            const offset = args?.offset ?? 0;
            if (offset === 0) {
              return pass === 0
                ? threads.slice(0, 100)
                : threads.slice(1, 101);
            }
            const duplicate = threads[pass === 0 ? 99 : 100]!;
            pass += 1;
            return [duplicate];
          },
          pin: async ({ threadId }) => {
            pinned.add(threadId);
            const thread = byId.get(threadId)!;
            const updated = makeThreadResponse({
              ...thread,
              pinnedAt: thread.updatedAt + 1,
            });
            byId.set(threadId, updated);
            return updated;
          },
        },
      },
    });
    plugin(host.bb);

    const service = host.harness.behavior.runService(
      "inbox-reconciliation",
    );
    await vi.waitFor(() => {
      expect(pinned.size).toBe(101);
    });
    service.controller.abort();
    await service.done;

    expect(pinned).toEqual(new Set(threads.map((thread) => thread.id)));
    await host.harness.lifecycle.dispose();
  });

  it("preserves a manually pinned active thread", async () => {
    const organizer = createHarness({
      mode: "apply",
      thread: { pinnedAt: 10 },
    });
    plugin(organizer.bb);
    await organizer.harness.behavior.emitThreadEvent("thread.created", {
      thread: organizer.currentThread(),
    });

    organizer.setThread({ status: "active" });
    await organizer.harness.behavior.emitThreadEvent("thread.active", {
      thread: organizer.currentThread(),
    });

    expect(organizer.pin).not.toHaveBeenCalled();
    expect(organizer.unpin).not.toHaveBeenCalled();
    expect(organizer.currentThread().pinnedAt).toBe(10);
    await organizer.harness.lifecycle.dispose();
  });

  it("keeps a same-run manual unpin snoozed until another run starts", async () => {
    const organizer = createHarness({
      mode: "apply",
      thread: { pinnedAt: 10, status: "active" },
    });
    plugin(organizer.bb);
    await organizer.harness.behavior.emitThreadEvent("thread.created", {
      thread: organizer.currentThread(),
    });
    await organizer.harness.behavior.emitThreadEvent("thread.active", {
      thread: organizer.currentThread(),
    });

    organizer.setThread({ pinnedAt: null });
    organizer.emitThreadChanged("pin-state-changed");
    await vi.waitFor(async () => {
      expect(
        await organizer.bb.storage.kv.get("thread:v1:thr_test"),
      ).toMatchObject({
        inboxLastPhase: "active",
        inboxSnoozed: true,
      });
    });

    organizer.setThread({ status: "idle" });
    await organizer.harness.behavior.emitThreadEvent("thread.idle", {
      lastAssistantText: "Done.",
      thread: organizer.currentThread(),
    });
    expect(organizer.pin).not.toHaveBeenCalled();

    organizer.setThread({ status: "active" });
    await organizer.harness.behavior.emitThreadEvent("thread.active", {
      thread: organizer.currentThread(),
    });
    organizer.setThread({ status: "idle" });
    await organizer.harness.behavior.emitThreadEvent("thread.idle", {
      lastAssistantText: "Done again.",
      thread: organizer.currentThread(),
    });

    expect(organizer.pin).toHaveBeenCalledTimes(1);
    expect(organizer.currentThread().pinnedAt).not.toBeNull();
    await organizer.harness.lifecycle.dispose();
  });

  it("treats a coalesced prior-run unpin followed by chat as a new run", async () => {
    const organizer = createHarness({ mode: "apply" });
    plugin(organizer.bb);
    await organizer.harness.behavior.emitThreadEvent("thread.created", {
      thread: organizer.currentThread(),
    });
    organizer.setThread({ status: "idle" });
    await organizer.harness.behavior.emitThreadEvent("thread.idle", {
      lastAssistantText: "Done.",
      thread: organizer.currentThread(),
    });
    expect(organizer.pin).toHaveBeenCalledTimes(1);

    organizer.setThread({ pinnedAt: null, status: "active" });
    await organizer.harness.behavior.emitThreadEvent("thread.active", {
      thread: organizer.currentThread(),
    });
    expect(
      await organizer.bb.storage.kv.get("thread:v1:thr_test"),
    ).toMatchObject({
      inboxLastPhase: "active",
      inboxSnoozed: false,
    });

    organizer.setThread({ status: "idle" });
    await organizer.harness.behavior.emitThreadEvent("thread.idle", {
      lastAssistantText: "Done again.",
      thread: organizer.currentThread(),
    });
    expect(organizer.pin).toHaveBeenCalledTimes(2);
    expect(organizer.currentThread().pinnedAt).not.toBeNull();
    await organizer.harness.lifecycle.dispose();
  });

  it("snoozes an unpin that happens after the active run starts", async () => {
    const organizer = createHarness({ mode: "apply" });
    plugin(organizer.bb);
    await organizer.harness.behavior.emitThreadEvent("thread.created", {
      thread: organizer.currentThread(),
    });
    organizer.setThread({ status: "idle" });
    await organizer.harness.behavior.emitThreadEvent("thread.idle", {
      lastAssistantText: "Done.",
      thread: organizer.currentThread(),
    });
    expect(organizer.pin).toHaveBeenCalledTimes(1);

    let signalGetStarted: () => void = () => undefined;
    const getStarted = new Promise<void>((resolve) => {
      signalGetStarted = resolve;
    });
    let releaseGet: () => void = () => undefined;
    const getGate = new Promise<void>((resolve) => {
      releaseGet = resolve;
    });
    let gateNextGet = true;
    organizer.harness.inspection.sdk.stub("threads.get", async () => {
      if (gateNextGet) {
        gateNextGet = false;
        signalGetStarted();
        await getGate;
      }
      return organizer.currentThread();
    });

    organizer.setThread({ status: "active" });
    const activeSnapshot = organizer.currentThread();
    const activeEvent =
      organizer.harness.behavior.emitThreadEvent("thread.active", {
        thread: activeSnapshot,
      });
    await getStarted;

    organizer.setThread({ pinnedAt: null });
    releaseGet();
    await activeEvent;
    expect(
      await organizer.bb.storage.kv.get("thread:v1:thr_test"),
    ).toMatchObject({
      inboxLastPhase: "active",
      inboxSnoozed: true,
    });

    organizer.setThread({ status: "idle" });
    await organizer.harness.behavior.emitThreadEvent("thread.idle", {
      lastAssistantText: "Still done.",
      thread: organizer.currentThread(),
    });
    expect(organizer.pin).toHaveBeenCalledTimes(1);
    await organizer.harness.lifecycle.dispose();
  });

  it("does not adopt a manual pin after an organizer pin request rejects", async () => {
    const organizer = createHarness({ mode: "apply" });
    plugin(organizer.bb);
    await organizer.harness.behavior.emitThreadEvent("thread.created", {
      thread: organizer.currentThread(),
    });
    organizer.pin.mockRejectedValueOnce(new Error("pin rejected"));

    organizer.setThread({ status: "idle" });
    await organizer.harness.behavior.emitThreadEvent("thread.idle", {
      lastAssistantText: "Done.",
      thread: organizer.currentThread(),
    });
    expect(
      await organizer.bb.storage.kv.get("thread:v1:thr_test"),
    ).toMatchObject({
      inboxManagedPinnedAt: null,
      inboxPendingPin: false,
    });

    organizer.setThread({ pinnedAt: 100 });
    organizer.emitThreadChanged("pin-state-changed");
    await vi.waitFor(async () => {
      expect(
        await organizer.bb.storage.kv.get("thread:v1:thr_test"),
      ).toMatchObject({
        inboxManagedPinnedAt: null,
        inboxObservedPinned: true,
      });
    });
    organizer.setThread({ status: "active" });
    await organizer.harness.behavior.emitThreadEvent("thread.active", {
      thread: organizer.currentThread(),
    });

    expect(organizer.unpin).not.toHaveBeenCalled();
    expect(organizer.currentThread().pinnedAt).toBe(100);
    await organizer.harness.lifecycle.dispose();
  });

  it("snoozes a manual unpin after an organizer unpin request rejects", async () => {
    const organizer = createHarness({ mode: "apply" });
    plugin(organizer.bb);
    await organizer.harness.behavior.emitThreadEvent("thread.created", {
      thread: organizer.currentThread(),
    });
    organizer.setThread({ status: "idle" });
    await organizer.harness.behavior.emitThreadEvent("thread.idle", {
      lastAssistantText: "Done.",
      thread: organizer.currentThread(),
    });
    organizer.unpin.mockRejectedValueOnce(new Error("unpin rejected"));

    organizer.setThread({ status: "active" });
    await organizer.harness.behavior.emitThreadEvent("thread.active", {
      thread: organizer.currentThread(),
    });
    expect(
      await organizer.bb.storage.kv.get("thread:v1:thr_test"),
    ).toMatchObject({ inboxPendingUnpin: false });

    organizer.setThread({ pinnedAt: null });
    organizer.emitThreadChanged("pin-state-changed");
    await vi.waitFor(async () => {
      expect(
        await organizer.bb.storage.kv.get("thread:v1:thr_test"),
      ).toMatchObject({
        inboxLastPhase: "active",
        inboxSnoozed: true,
      });
    });

    organizer.setThread({ status: "idle" });
    await organizer.harness.behavior.emitThreadEvent("thread.idle", {
      lastAssistantText: "Still done.",
      thread: organizer.currentThread(),
    });
    expect(organizer.pin).toHaveBeenCalledTimes(1);
    await organizer.harness.lifecycle.dispose();
  });

  it("uses fresh status when lifecycle events arrive out of order", async () => {
    const organizer = createHarness({ mode: "apply" });
    plugin(organizer.bb);
    await organizer.harness.behavior.emitThreadEvent("thread.created", {
      thread: organizer.currentThread(),
    });

    organizer.setThread({ status: "active" });
    await organizer.harness.behavior.emitThreadEvent("thread.idle", {
      lastAssistantText: "Stale idle event.",
      thread: makeThreadResponse({
        ...organizer.currentThread(),
        status: "idle",
      }),
    });
    expect(organizer.pin).not.toHaveBeenCalled();

    organizer.setThread({ status: "idle" });
    await organizer.harness.behavior.emitThreadEvent("thread.active", {
      thread: makeThreadResponse({
        ...organizer.currentThread(),
        status: "active",
      }),
    });
    expect(organizer.pin).toHaveBeenCalledTimes(1);
    await organizer.harness.lifecycle.dispose();
  });

  it("preserves ambiguous pin ownership after the post-pin state save fails", async () => {
    const organizer = createHarness({ mode: "apply" });
    plugin(organizer.bb);
    await organizer.harness.behavior.emitThreadEvent("thread.created", {
      thread: organizer.currentThread(),
    });

    const originalSet = organizer.bb.storage.kv.set.bind(
      organizer.bb.storage.kv,
    );
    let failPostPinSave = true;
    vi.spyOn(organizer.bb.storage.kv, "set").mockImplementation(
      async (key, value) => {
        if (
          failPostPinSave &&
          organizer.currentThread().pinnedAt !== null
        ) {
          failPostPinSave = false;
          throw new Error("post-pin save failed");
        }
        await originalSet(key, value);
      },
    );

    organizer.setThread({ status: "idle" });
    await organizer.harness.behavior.emitThreadEvent("thread.idle", {
      lastAssistantText: "Done.",
      thread: organizer.currentThread(),
    });
    expect(organizer.currentThread().pinnedAt).not.toBeNull();
    expect(
      await organizer.bb.storage.kv.get("thread:v1:thr_test"),
    ).toMatchObject({ inboxPendingPin: true });

    const reloaded = await organizer.harness.lifecycle.reload(plugin);
    organizer.emitThreadChanged("pin-state-changed");
    await vi.waitFor(async () => {
      expect(
        await reloaded.bb.storage.kv.get("thread:v1:thr_test"),
      ).toMatchObject({
        inboxManagedPinnedAt: null,
        inboxObservedPinned: true,
        inboxPendingPin: false,
      });
    });

    organizer.setThread({ status: "active" });
    await reloaded.harness.behavior.emitThreadEvent("thread.active", {
      thread: organizer.currentThread(),
    });
    expect(organizer.unpin).not.toHaveBeenCalled();
    expect(organizer.currentThread().pinnedAt).not.toBeNull();
    await reloaded.harness.lifecycle.dispose();
  });

  it("does not adopt a manual re-pin after the post-pin state save fails", async () => {
    const organizer = createHarness({ mode: "apply" });
    plugin(organizer.bb);
    await organizer.harness.behavior.emitThreadEvent("thread.created", {
      thread: organizer.currentThread(),
    });

    const originalSet = organizer.bb.storage.kv.set.bind(
      organizer.bb.storage.kv,
    );
    let failPostPinSave = true;
    vi.spyOn(organizer.bb.storage.kv, "set").mockImplementation(
      async (key, value) => {
        if (
          failPostPinSave &&
          organizer.currentThread().pinnedAt !== null
        ) {
          failPostPinSave = false;
          throw new Error("post-pin save failed");
        }
        await originalSet(key, value);
      },
    );

    organizer.setThread({ status: "idle" });
    await organizer.harness.behavior.emitThreadEvent("thread.idle", {
      lastAssistantText: "Done.",
      thread: organizer.currentThread(),
    });
    expect(
      await organizer.bb.storage.kv.get("thread:v1:thr_test"),
    ).toMatchObject({ inboxPendingPin: true });

    const reloaded = await organizer.harness.lifecycle.reload(plugin);
    organizer.setThread({ pinnedAt: 100, status: "active" });
    await reloaded.harness.behavior.emitThreadEvent("thread.active", {
      thread: organizer.currentThread(),
    });

    expect(organizer.unpin).not.toHaveBeenCalled();
    expect(organizer.currentThread().pinnedAt).toBe(100);
    await reloaded.harness.lifecycle.dispose();
  });

  it("preserves a manual re-pin of an organizer-managed thread", async () => {
    const organizer = createHarness({ mode: "apply" });
    plugin(organizer.bb);
    await organizer.harness.behavior.emitThreadEvent("thread.created", {
      thread: organizer.currentThread(),
    });

    organizer.setThread({ status: "idle" });
    await organizer.harness.behavior.emitThreadEvent("thread.idle", {
      lastAssistantText: "Done.",
      thread: organizer.currentThread(),
    });
    organizer.setThread({
      pinnedAt: null,
      status: "idle",
    });
    await organizer.harness.behavior.emitThreadEvent("thread.idle", {
      lastAssistantText: "Still done.",
      thread: organizer.currentThread(),
    });
    organizer.setThread({
      pinnedAt: 100,
      status: "active",
    });
    await organizer.harness.behavior.emitThreadEvent("thread.active", {
      thread: organizer.currentThread(),
    });

    expect(organizer.unpin).not.toHaveBeenCalled();
    expect(organizer.currentThread().pinnedAt).toBe(100);
    await organizer.harness.lifecycle.dispose();
  });

  it("pins failed work into the inbox", async () => {
    const organizer = createHarness({ mode: "apply" });
    plugin(organizer.bb);
    await organizer.harness.behavior.emitThreadEvent("thread.created", {
      thread: organizer.currentThread(),
    });

    organizer.setThread({ status: "error" });
    await organizer.harness.behavior.emitThreadEvent("thread.failed", {
      error: "Provider failed",
      thread: organizer.currentThread(),
    });

    expect(organizer.pin).toHaveBeenCalledWith({ threadId: "thr_test" });
    expect(organizer.currentThread().pinnedAt).not.toBeNull();
    await organizer.harness.lifecycle.dispose();
  });

  it("reconciles the inbox immediately when apply mode is enabled", async () => {
    const organizer = createHarness({ mode: "observe" });
    plugin(organizer.bb);
    await organizer.harness.behavior.emitThreadEvent("thread.created", {
      thread: organizer.currentThread(),
    });
    organizer.setThread({ status: "idle" });
    await organizer.harness.behavior.emitThreadEvent("thread.idle", {
      lastAssistantText: "Done.",
      thread: organizer.currentThread(),
    });
    expect(organizer.pin).not.toHaveBeenCalled();

    await organizer.harness.behavior.setSettings({ inboxMode: "apply" });

    await vi.waitFor(() => {
      expect(organizer.pin).toHaveBeenCalledWith({ threadId: "thr_test" });
    });
    await organizer.harness.lifecycle.dispose();
  });

  it("removes archived stored state before applying inbox changes", async () => {
    const organizer = createHarness({ mode: "observe" });
    plugin(organizer.bb);
    await organizer.harness.behavior.emitThreadEvent("thread.created", {
      thread: organizer.currentThread(),
    });
    expect(
      await organizer.bb.storage.kv.list("thread:"),
    ).toHaveLength(1);

    organizer.setThread({ archivedAt: 100, status: "idle" });
    await organizer.harness.behavior.setSettings({ inboxMode: "apply" });
    await vi.waitFor(async () => {
      expect(await organizer.bb.storage.kv.list("thread:")).toEqual([]);
    });

    expect(organizer.pin).not.toHaveBeenCalled();
    await organizer.harness.lifecycle.dispose();
  });

  it("never changes an explicit creation-time section", async () => {
    const { bb, harness, currentThread, update } = createHarness({
      mode: "apply",
      thread: { sectionId: "sec_qa" },
    });
    plugin(bb);

    await harness.behavior.emitThreadEvent("thread.created", {
      thread: currentThread(),
    });

    expect(update).not.toHaveBeenCalled();
    await harness.lifecycle.dispose();
  });

  it("locks title and section management after manual overrides", async () => {
    const organizer = createHarness({ mode: "apply" });
    plugin(organizer.bb);
    await organizer.harness.behavior.emitThreadEvent("thread.created", {
      thread: organizer.currentThread(),
    });
    expect(organizer.currentThread().sectionId).toBe("sec_extensions");

    organizer.setThread({
      sectionId: "sec_qa",
      status: "active",
      title: "My Manual Title",
    });
    await organizer.harness.behavior.emitThreadEvent("thread.active", {
      thread: organizer.currentThread(),
    });

    expect(organizer.update).toHaveBeenCalledTimes(1);
    expect(organizer.harness.inspection.logEntries).toContainEqual(
      expect.objectContaining({
        message: expect.stringContaining(
          "action=manual-lock title=true section=true",
        ),
      }),
    );
    await organizer.harness.lifecycle.dispose();
  });

  it("repairs a missing title only after the first completed turn", async () => {
    const organizer = createHarness({
      mode: "apply",
      projectName: "Personal",
      prompt: "Please fix the external file nav.",
    });
    plugin(organizer.bb);
    await organizer.harness.behavior.emitThreadEvent("thread.created", {
      thread: organizer.currentThread(),
    });
    expect(organizer.update).not.toHaveBeenCalled();

    await organizer.harness.behavior.emitThreadEvent("thread.idle", {
      lastAssistantText: null,
      thread: organizer.currentThread(),
    });
    expect(organizer.update).not.toHaveBeenCalled();

    organizer.addCompletedTurn(10);
    await organizer.harness.behavior.emitThreadEvent("thread.idle", {
      lastAssistantText: "Done.",
      thread: organizer.currentThread(),
    });

    expect(organizer.update).toHaveBeenCalledWith({
      threadId: "thr_test",
      title: "Fix External File Nav",
    });
    await organizer.harness.lifecycle.dispose();
  });

  it("evaluates at turns 1 and 5, not every idle transition", async () => {
    const organizer = createHarness({ mode: "observe" });
    plugin(organizer.bb);
    await organizer.harness.behavior.emitThreadEvent("thread.created", {
      thread: organizer.currentThread(),
    });

    for (let turn = 1; turn <= 5; turn += 1) {
      organizer.addCompletedTurn(turn * 10);
      await organizer.harness.behavior.emitThreadEvent("thread.idle", {
        lastAssistantText: "Done.",
        thread: organizer.currentThread(),
      });
    }

    const turnProposals = organizer.harness.inspection.logEntries.filter(
      ({ message }) =>
        message.includes("phase=turn") &&
        message.includes("action=propose-section"),
    );
    expect(turnProposals).toHaveLength(2);
    await organizer.harness.lifecycle.dispose();
  });

  it("moves a managed section after two due evaluations of clear recent intent", async () => {
    const initialPrompt = "Write a blog post about organizing bb threads.";
    const organizer = createHarness({
      mode: "apply",
      projectName: "Personal",
      prompt: initialPrompt,
      thread: {
        projectId: "proj_personal",
        title: "Write Thread Organization Blog Post",
      },
    });
    plugin(organizer.bb);
    await organizer.harness.behavior.emitThreadEvent("thread.created", {
      thread: organizer.currentThread(),
    });
    expect(organizer.currentThread().sectionId).toBe("sec_writing");

    organizer.setPromptHistory(
      initialPrompt,
      "Create a bb plugin for automatic thread organization.",
    );
    organizer.setThread({ status: "active" });
    await organizer.harness.behavior.emitThreadEvent("thread.active", {
      thread: organizer.currentThread(),
    });
    organizer.addCompletedTurn(10);
    await organizer.harness.behavior.emitThreadEvent("thread.idle", {
      lastAssistantText: "Done.",
      thread: organizer.currentThread(),
    });
    expect(organizer.currentThread().sectionId).toBe("sec_writing");

    for (let turn = 2; turn <= 5; turn += 1) {
      organizer.setThread({ status: "active" });
      await organizer.harness.behavior.emitThreadEvent("thread.active", {
        thread: organizer.currentThread(),
      });
      organizer.addCompletedTurn(turn * 10);
      await organizer.harness.behavior.emitThreadEvent("thread.idle", {
        lastAssistantText: "Done.",
        thread: organizer.currentThread(),
      });
    }

    expect(organizer.currentThread().sectionId).toBe("sec_extensions");
    expect(
      organizer.update.mock.calls.filter(
        ([args]) => args.sectionId !== undefined,
      ),
    ).toEqual([
      [{ threadId: "thr_test", sectionId: "sec_writing" }],
      [{ threadId: "thr_test", sectionId: "sec_extensions" }],
    ]);
    await organizer.harness.lifecycle.dispose();
  });

  it("abstains from moving on mixed recent section intent", async () => {
    const initialPrompt = "Write a blog post about organizing bb threads.";
    const organizer = createHarness({
      mode: "apply",
      projectName: "Personal",
      prompt: initialPrompt,
    });
    plugin(organizer.bb);
    await organizer.harness.behavior.emitThreadEvent("thread.created", {
      thread: organizer.currentThread(),
    });

    organizer.setPromptHistory(
      initialPrompt,
      "Write a blog post about creating a bb plugin.",
    );
    organizer.addCompletedTurn(10);
    await organizer.harness.behavior.emitThreadEvent("thread.idle", {
      lastAssistantText: "Done.",
      thread: organizer.currentThread(),
    });
    for (let turn = 2; turn <= 5; turn += 1) {
      organizer.addCompletedTurn(turn * 10);
      await organizer.harness.behavior.emitThreadEvent("thread.idle", {
        lastAssistantText: "Done.",
        thread: organizer.currentThread(),
      });
    }

    expect(organizer.currentThread().sectionId).toBe("sec_writing");
    expect(
      organizer.update.mock.calls.filter(
        ([args]) => args.sectionId !== undefined,
      ),
    ).toEqual([
      [{ threadId: "thr_test", sectionId: "sec_writing" }],
    ]);
    await organizer.harness.lifecycle.dispose();
  });

  it("preserves a pending move across an unclassifiable active phase", async () => {
    const organizer = createHarness({
      mode: "apply",
      projectName: "Personal",
      prompt: "Plan quarterly work.",
      thread: {
        projectId: "proj_personal",
        title: "Quarterly Plan",
      },
    });
    plugin(organizer.bb);
    await organizer.harness.behavior.emitThreadEvent("thread.created", {
      thread: organizer.currentThread(),
    });
    expect(organizer.currentThread().sectionId).toBeNull();

    organizer.setPromptHistory(
      "Create a bb plugin for automatic thread organization.",
    );
    organizer.setThread({ status: "active" });
    await organizer.harness.behavior.emitThreadEvent("thread.active", {
      thread: organizer.currentThread(),
    });
    expect(organizer.currentThread().sectionId).toBe("sec_extensions");

    organizer.addCompletedTurn(10);
    await organizer.harness.behavior.emitThreadEvent("thread.idle", {
      lastAssistantText: "Done.",
      thread: organizer.currentThread(),
    });

    organizer.setPromptHistory("Write a blog post about bb workflows.");
    for (let turn = 2; turn <= 5; turn += 1) {
      organizer.setThread({ status: "active" });
      await organizer.harness.behavior.emitThreadEvent("thread.active", {
        thread: organizer.currentThread(),
      });
      organizer.addCompletedTurn(turn * 10);
      await organizer.harness.behavior.emitThreadEvent("thread.idle", {
        lastAssistantText: "Done.",
        thread: organizer.currentThread(),
      });
    }
    expect(organizer.currentThread().sectionId).toBe("sec_extensions");

    organizer.setPromptHistory("ok");
    organizer.setThread({ status: "active" });
    await organizer.harness.behavior.emitThreadEvent("thread.active", {
      thread: organizer.currentThread(),
    });

    organizer.setPromptHistory("Write a blog post about bb workflows.");
    for (let turn = 6; turn <= 15; turn += 1) {
      organizer.setThread({ status: "active" });
      await organizer.harness.behavior.emitThreadEvent("thread.active", {
        thread: organizer.currentThread(),
      });
      organizer.addCompletedTurn(turn * 10);
      await organizer.harness.behavior.emitThreadEvent("thread.idle", {
        lastAssistantText: "Done.",
        thread: organizer.currentThread(),
      });
    }

    expect(organizer.currentThread().sectionId).toBe("sec_writing");
    await organizer.harness.lifecycle.dispose();
  });

  it("ignores hidden and plugin-originated workers", async () => {
    const organizer = createHarness({
      mode: "apply",
      thread: { originPluginId: "automations", visibility: "hidden" },
    });
    plugin(organizer.bb);
    await organizer.harness.behavior.emitThreadEvent("thread.created", {
      thread: organizer.currentThread(),
    });

    expect(organizer.update).not.toHaveBeenCalled();
    expect(
      organizer.harness.inspection.sdk.callsTo("threads.get"),
    ).toHaveLength(0);
    await organizer.harness.lifecycle.dispose();
  });

  it("forgets archived threads", async () => {
    const organizer = createHarness({ mode: "observe" });
    plugin(organizer.bb);
    await organizer.harness.behavior.emitThreadEvent("thread.created", {
      thread: organizer.currentThread(),
    });
    const callsBeforeArchive =
      organizer.harness.inspection.sdk.callsTo("threads.get").length;

    organizer.setThread({ archivedAt: 10, status: "idle" });
    await organizer.harness.behavior.emitThreadEvent("thread.archived", {
      thread: organizer.currentThread(),
    });
    organizer.setThread({ archivedAt: null, status: "active" });
    await organizer.harness.behavior.emitThreadEvent("thread.active", {
      thread: organizer.currentThread(),
    });

    expect(
      organizer.harness.inspection.sdk.callsTo("threads.get"),
    ).toHaveLength(callsBeforeArchive);
    await organizer.harness.lifecycle.dispose();
  });
});
