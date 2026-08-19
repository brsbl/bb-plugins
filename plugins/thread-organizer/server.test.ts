import {
  createFakePluginHost,
  makeThreadResponse,
} from "@get-bb/plugin-sdk/testing";
import { describe, expect, it, vi } from "vitest";
import plugin from "./server.js";

function promptEntry(text: string) {
  return {
    id: "prompt",
    createdAt: 1,
    input: [{ type: "text" as const, text }],
  };
}

function createHarness(prompt = "Implement the dynamic organizer sections") {
  let thread = makeThreadResponse({
    id: "thr_test",
    projectId: "proj_test",
    status: "starting",
    title: null,
    titleFallback: prompt,
  });
  const additionalThreads = new Map<string, typeof thread>();
  const promptByThreadId = new Map([[thread.id, prompt]]);
  let sections: Array<{
    id: string;
    name: string;
    createdAt: number;
    updatedAt: number;
  }> = [];
  const occupiedSectionIds = new Set<string>();
  let sectionCounter = 0;
  const update = vi.fn(
    async (args: {
      threadId: string;
      sectionId?: string | null;
      title?: string | null;
    }) => {
      const current =
        args.threadId === thread.id
          ? thread
          : additionalThreads.get(args.threadId)!;
      const updated = makeThreadResponse({
        ...current,
        ...(Object.hasOwn(args, "sectionId")
          ? { sectionId: args.sectionId ?? null }
          : {}),
        ...(Object.hasOwn(args, "title") ? { title: args.title ?? null } : {}),
        updatedAt: current.updatedAt + 1,
      });
      if (args.threadId === thread.id) thread = updated;
      else additionalThreads.set(args.threadId, updated);
      return updated;
    },
  );
  const create = vi.fn(async ({ name }: { name: string }) => {
    const section = {
      id: `sec_${++sectionCounter}`,
      name,
      createdAt: sectionCounter,
      updatedAt: sectionCounter,
    };
    sections.push(section);
    return section;
  });
  const remove = vi.fn(async ({ id }: { id: string }) => {
    if (thread.sectionId === id || occupiedSectionIds.has(id)) {
      throw new Error("test attempted to delete an occupied section");
    }
    const section = sections.find((candidate) => candidate.id === id)!;
    sections = sections.filter((candidate) => candidate.id !== id);
    return { id, name: section.name, updatedThreadCount: 0 };
  });
  const host = createFakePluginHost({
    pluginId: "thread-organizer",
    settings: { inboxMode: "apply" },
    sdk: {
      threadSections: { create, delete: remove, list: async () => sections },
      threads: {
        events: { wait: async () => null },
        get: async ({ threadId }: { threadId: string }) =>
          threadId === thread.id ? thread : additionalThreads.get(threadId)!,
        list: async ({ sectionId }: { sectionId?: string } = {}) => {
          if (!sectionId) return [thread];
          if (thread.sectionId === sectionId) return [thread];
          return occupiedSectionIds.has(sectionId)
            ? [makeThreadResponse({ id: `occupant_${sectionId}`, sectionId })]
            : [];
        },
        promptHistory: async ({ threadId }: { threadId: string }) => [
          promptEntry(promptByThreadId.get(threadId) ?? prompt),
        ],
        update,
      },
    },
  });
  return {
    ...host,
    create,
    remove,
    update,
    current: () => thread,
    addThread: (id: string, nextPrompt: string) => {
      const added = makeThreadResponse({
        ...thread,
        id,
        sectionId: null,
        title: null,
        titleFallback: nextPrompt,
      });
      additionalThreads.set(id, added);
      promptByThreadId.set(id, nextPrompt);
      return added;
    },
    sections: () => sections,
    setThread: (changes: Partial<typeof thread>) => {
      thread = makeThreadResponse({ ...thread, ...changes });
    },
    setSectionOccupied: (sectionId: string, occupied = true) => {
      if (occupied) occupiedSectionIds.add(sectionId);
      else occupiedSectionIds.delete(sectionId);
    },
  };
}

describe("Thread Organizer phase lifecycle", () => {
  it("registers the phase CLI and bundled agent skill", async () => {
    const organizer = createHarness();
    plugin(organizer.bb);
    expect(organizer.harness.inspection.registrations.cli).toMatchObject({
      name: "organizer",
    });
    expect(
      organizer.harness.inspection.registrations.agentConfigurationProvider,
    ).toBeTypeOf("function");
    await organizer.harness.lifecycle.dispose();
  });

  it("creates only the needed section and assigns a new thread", async () => {
    const organizer = createHarness();
    plugin(organizer.bb);
    await organizer.harness.behavior.emitThreadEvent("thread.created", {
      thread: organizer.current(),
    });
    expect(organizer.create).toHaveBeenCalledWith({ name: "🛠️ Building" });
    expect(organizer.sections().map(({ name }) => name)).toEqual([
      "🛠️ Building",
    ]);
    expect(organizer.current().sectionId).toBe("sec_1");
    await organizer.harness.lifecycle.dispose();
  });

  it("serializes ownership records across concurrent phase creation", async () => {
    const organizer = createHarness();
    const testing = organizer.addThread(
      "thr_testing",
      "Run regression tests and deploy",
    );
    plugin(organizer.bb);
    await Promise.all([
      organizer.harness.behavior.emitThreadEvent("thread.created", {
        thread: organizer.current(),
      }),
      organizer.harness.behavior.emitThreadEvent("thread.created", {
        thread: testing,
      }),
    ]);
    expect(organizer.sections().map(({ name }) => name).sort()).toEqual([
      "✅ Testing / Deploy",
      "🛠️ Building",
    ]);
    await expect(organizer.bb.storage.kv.get("sections:v1")).resolves.toEqual([
      "sec_1",
      "sec_2",
    ]);
    await organizer.harness.lifecycle.dispose();
  });

  it("uses Inbox as a named fallback and never pins", async () => {
    const organizer = createHarness("Please continue");
    plugin(organizer.bb);
    await organizer.harness.behavior.emitThreadEvent("thread.created", {
      thread: organizer.current(),
    });
    expect(organizer.sections()[0]?.name).toBe("📥 Inbox");
    expect(
      organizer.harness.inspection.sdk.callsTo("threads.pin"),
    ).toHaveLength(0);
    await organizer.harness.lifecycle.dispose();
  });

  it("moves the current thread without destructively deleting its empty prior section", async () => {
    const organizer = createHarness();
    plugin(organizer.bb);
    await organizer.harness.behavior.emitThreadEvent("thread.created", {
      thread: organizer.current(),
    });
    const result = await organizer.harness.behavior.runCli(
      ["phase", "testing-deploy"],
      { threadId: "thr_test" },
    );
    expect(result).toMatchObject({
      exitCode: 0,
      stdout: expect.stringContaining("✅ Testing / Deploy"),
    });
    expect(organizer.sections().map(({ name }) => name)).toEqual([
      "🛠️ Building",
      "✅ Testing / Deploy",
    ]);
    expect(organizer.remove).not.toHaveBeenCalled();
    await organizer.harness.behavior.emitThreadEvent("thread.active", {
      thread: organizer.current(),
    });
    expect(organizer.sections().map(({ name }) => name)).toEqual([
      "🛠️ Building",
      "✅ Testing / Deploy",
    ]);
    await organizer.harness.lifecycle.dispose();
  });

  it("keeps an occupied owned section without calling delete", async () => {
    const organizer = createHarness();
    plugin(organizer.bb);
    await organizer.harness.behavior.emitThreadEvent("thread.created", {
      thread: organizer.current(),
    });
    organizer.setSectionOccupied("sec_1");
    await organizer.harness.behavior.runCli(["phase", "handoff"], {
      threadId: "thr_test",
    });
    expect(organizer.sections().map(({ name }) => name)).toContain(
      "🛠️ Building",
    );
    expect(organizer.remove).not.toHaveBeenCalledWith({ id: "sec_1" });
    await organizer.harness.lifecycle.dispose();
  });

  it("preserves an explicit creation-time section", async () => {
    const organizer = createHarness();
    organizer.setThread({ sectionId: "sec_manual" });
    plugin(organizer.bb);
    await organizer.harness.behavior.emitThreadEvent("thread.created", {
      thread: organizer.current(),
    });
    expect(organizer.create).not.toHaveBeenCalled();
    expect(organizer.current().sectionId).toBe("sec_manual");
    await organizer.harness.lifecycle.dispose();
  });

  it("clears its assignment without deleting the last phase section on archive", async () => {
    const organizer = createHarness();
    plugin(organizer.bb);
    await organizer.harness.behavior.emitThreadEvent("thread.created", {
      thread: organizer.current(),
    });
    organizer.setThread({ archivedAt: Date.now() });
    await organizer.harness.behavior.emitThreadEvent("thread.archived", {
      thread: organizer.current(),
    });
    expect(organizer.current().sectionId).toBeNull();
    expect(organizer.sections().map(({ name }) => name)).toEqual([
      "🛠️ Building",
    ]);
    expect(organizer.remove).not.toHaveBeenCalled();
    await organizer.harness.lifecycle.dispose();
  });
});
