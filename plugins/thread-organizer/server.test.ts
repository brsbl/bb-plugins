import {
  createFakePluginHost,
  makeThreadResponse,
} from "@bb/plugin-sdk/testing";
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
  let sections: Array<{
    id: string;
    name: string;
    createdAt: number;
    updatedAt: number;
  }> = [];
  let sectionCounter = 0;
  const update = vi.fn(
    async (args: {
      threadId: string;
      sectionId?: string | null;
      title?: string | null;
    }) => {
      thread = makeThreadResponse({
        ...thread,
        ...(Object.hasOwn(args, "sectionId")
          ? { sectionId: args.sectionId ?? null }
          : {}),
        ...(Object.hasOwn(args, "title") ? { title: args.title ?? null } : {}),
        updatedAt: thread.updatedAt + 1,
      });
      return thread;
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
  const remove = vi.fn(
    async ({ id, onlyIfEmpty }: { id: string; onlyIfEmpty?: boolean }) => {
      if (!onlyIfEmpty) throw new Error("unsafe delete");
      if (thread.sectionId === id) throw new Error("section not empty");
      const section = sections.find((candidate) => candidate.id === id)!;
      sections = sections.filter((candidate) => candidate.id !== id);
      return { id, name: section.name, updatedThreadCount: 0 };
    },
  );
  const host = createFakePluginHost({
    pluginId: "thread-organizer",
    settings: { inboxMode: "apply" },
    sdk: {
      threadSections: { create, delete: remove, list: async () => sections },
      threads: {
        events: { wait: async () => null },
        get: async () => thread,
        list: async ({ sectionId }: { sectionId?: string } = {}) =>
          sectionId && thread.sectionId === sectionId ? [thread] : [],
        promptHistory: async () => [promptEntry(prompt)],
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
    sections: () => sections,
    setThread: (changes: Partial<typeof thread>) => {
      thread = makeThreadResponse({ ...thread, ...changes });
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

  it("moves the current thread through the CLI and removes its empty prior section", async () => {
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
      "✅ Testing / Deploy",
    ]);
    expect(organizer.remove).toHaveBeenCalledWith({
      id: "sec_1",
      onlyIfEmpty: true,
    });
    await organizer.harness.behavior.emitThreadEvent("thread.active", {
      thread: organizer.current(),
    });
    expect(organizer.sections().map(({ name }) => name)).toEqual([
      "✅ Testing / Deploy",
    ]);
    await organizer.harness.lifecycle.dispose();
  });

  it("keeps an occupied section when conditional deletion rejects", async () => {
    const organizer = createHarness();
    plugin(organizer.bb);
    await organizer.harness.behavior.emitThreadEvent("thread.created", {
      thread: organizer.current(),
    });
    organizer.setThread({ sectionId: null });
    organizer.remove.mockRejectedValueOnce(new Error("section not empty"));
    await organizer.harness.behavior.runCli(["phase", "handoff"], {
      threadId: "thr_test",
    });
    expect(organizer.sections().map(({ name }) => name)).toContain(
      "🛠️ Building",
    );
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

  it("clears its assignment and removes the last phase section on archive", async () => {
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
    expect(organizer.sections()).toEqual([]);
    await organizer.harness.lifecycle.dispose();
  });
});
