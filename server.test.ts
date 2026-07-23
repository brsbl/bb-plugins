import {
  createFakePluginHost,
  makeThreadResponse,
} from "@bb/plugin-sdk/testing";
import { describe, expect, it, vi } from "vitest";

import plugin from "./server.js";

const sections = [
  { id: "sec_bb", name: "bb" },
  { id: "sec_design", name: "Design" },
  { id: "sec_extensions", name: "Extensions" },
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
    settings: { mode: input?.mode ?? "observe" },
    sdk: {
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
        get: async () => thread,
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
  it("registers a headless observe-mode lifecycle", async () => {
    const { bb, harness } = createHarness();
    plugin(bb);

    expect(harness.inspection.registrations.settingsDescriptors).toMatchObject({
      mode: { default: "observe", options: ["observe", "apply"] },
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

  it("does not unpin a thread that was pinned manually", async () => {
    const organizer = createHarness({
      mode: "apply",
      thread: { pinnedAt: 10 },
    });
    plugin(organizer.bb);
    await organizer.harness.behavior.emitThreadEvent("thread.created", {
      thread: organizer.currentThread(),
    });

    organizer.setThread({ status: "idle" });
    await organizer.harness.behavior.emitThreadEvent("thread.idle", {
      lastAssistantText: "Done.",
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
