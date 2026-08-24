import {
  createFakePluginHost,
  makeThreadResponse,
} from "@get-bb/plugin-sdk/testing";
import type { BbPluginApi } from "@get-bb/plugin-sdk";
import { describe, expect, it, vi } from "vitest";

import {
  DEFAULT_WORKFLOW_CONFIG,
  editableWorkflowConfig,
  localSectionName,
  type WorkflowConfig,
} from "./core.js";
import plugin from "./server.js";

type TestThread = ReturnType<typeof makeThreadResponse>;
type ThreadSpawnArgs = Parameters<BbPluginApi["sdk"]["threads"]["spawn"]>[0];

interface TestSection {
  createdAt: number;
  id: string;
  name: string;
  updatedAt: number;
}

function agentContext(originPluginId: string | null = null) {
  return {
    thread: {
      id: "thr_test",
      title: "Current work",
      parentThreadId: null,
      sourceThreadId: null,
    },
    project: {
      id: "proj_test",
      kind: "standard" as const,
      name: "Test project",
      gitRemoteUrl: null,
    },
    environment: {
      id: "env_test",
      name: "Test",
      path: process.cwd(),
      workspaceProvisionType: "managed-worktree" as const,
      branchName: "test",
    },
    host: { id: "host_test", name: "Test host" },
    provider: {
      id: "codex",
      model: "test",
      capabilities: { supportsNativeUserQuestion: true },
    },
    origin: { kind: null, pluginId: originPluginId },
  };
}

function createHarness(options: { legacyPlanning?: boolean } = {}) {
  const initialThread = makeThreadResponse({
    id: "thr_test",
    projectId: "proj_test",
    status: "starting",
    lastReadAt: 0,
    latestAttentionAt: 10,
  });
  const threads = new Map<string, TestThread>([
    [initialThread.id, initialThread],
  ]);
  const getTestThread = (threadId = "thr_test") => {
    const thread = threads.get(threadId);
    if (!thread) throw new Error(`unknown test thread: ${threadId}`);
    return thread;
  };
  let sectionCounter = 0;
  let sections: TestSection[] = options.legacyPlanning
    ? [
        {
          id: "sec_legacy_planning",
          name: "📋 Planning",
          createdAt: 1,
          updatedAt: 1,
        },
      ]
    : [];
  const changedCallbacks: Array<(threadId: string) => void> = [];

  const create = vi.fn(async ({ name }: { name: string }) => {
    const section: TestSection = {
      id: `sec_${++sectionCounter}`,
      name,
      createdAt: sectionCounter + 10,
      updatedAt: sectionCounter + 10,
    };
    sections.push(section);
    return section;
  });
  const updateSection = vi.fn(
    async ({ id, name }: { id: string; name: string }) => {
      const section = sections.find((candidate) => candidate.id === id)!;
      section.name = name;
      section.updatedAt += 1;
      return { id, name, updatedThreadCount: 0 };
    },
  );
  const deleteSection = vi.fn(async ({ id }: { id: string }) => {
    const section = sections.find((candidate) => candidate.id === id)!;
    for (const [threadId, thread] of threads) {
      if (thread.sectionId === id) {
        threads.set(
          threadId,
          makeThreadResponse({ ...thread, sectionId: null }),
        );
      }
    }
    sections = sections.filter((candidate) => candidate.id !== id);
    return { id, name: section.name, updatedThreadCount: 0 };
  });
  const updateThread = vi.fn(
    async ({
      threadId,
      sectionId,
      title,
    }: {
      threadId: string;
      sectionId?: string | null;
      title?: string | null;
    }) => {
      const thread = getTestThread(threadId);
      const updated = makeThreadResponse({
        ...thread,
        ...(sectionId !== undefined ? { sectionId } : {}),
        ...(title !== undefined ? { title } : {}),
        updatedAt: thread.updatedAt + 1,
      });
      threads.set(threadId, updated);
      return updated;
    },
  );
  const getThread = vi.fn(async ({ threadId }: { threadId: string }) =>
    getTestThread(threadId),
  );
  const listThreads = vi.fn(async () => [...threads.values()]);
  const listSections = vi.fn(async () =>
    sections.map((section) => ({ ...section })),
  );
  const spawnThread = vi.fn(async (_args: ThreadSpawnArgs) =>
    makeThreadResponse({
      id: "thr_title_worker",
      projectId: getTestThread().projectId,
      environmentId: getTestThread().environmentId,
      visibility: "hidden",
      originPluginId: "thread-organizer",
      title: "Reassess thread title",
    }),
  );
  const waitThread = vi.fn(async () => ({ matched: true }));
  const outputThread = vi.fn(async () => ({
    output:
      '{"decisions":[{"id":"thr_test","action":"rename","title":"Implement semantic thread titles"}]}',
  }));
  const timelineThread = vi.fn(async () => ({
    rows: [
      {
        kind: "conversation",
        role: "user",
        text: "Implement semantic thread title reassessment.",
      },
    ],
  }));
  const archiveThread = vi.fn(async () => ({}));
  const stopThread = vi.fn(async () => ({ ok: true }));

  const host = createFakePluginHost({
    pluginId: "thread-organizer",
    agentSkillIds: ["thread-phase-organizer"],
    sdk: {
      subscribe: (args) => {
        const callback = args.callback as unknown as (event: {
          changes: ["read-state-changed"];
          entity: "thread";
          id: string;
          type: "changed";
        }) => void;
        changedCallbacks.push((threadId) =>
          callback({
            entity: "thread",
            type: "changed",
            id: threadId,
            changes: ["read-state-changed"],
          }),
        );
        return () => undefined;
      },
      threadSections: {
        create,
        delete: deleteSection,
        list: listSections,
        update: updateSection,
      },
      threads: {
        archive: archiveThread,
        get: getThread,
        list: listThreads,
        output: outputThread,
        spawn: spawnThread,
        stop: stopThread,
        timeline: timelineThread,
        update: updateThread,
        wait: waitThread,
      },
    },
  });

  return {
    ...host,
    create,
    deleteSection,
    archiveThread,
    getThread,
    listSections,
    listThreads,
    outputThread,
    updateSection,
    updateThread,
    spawnThread,
    stopThread,
    timelineThread,
    waitThread,
    current: (threadId = "thr_test") => getTestThread(threadId),
    sections: () => sections.map((section) => ({ ...section })),
    addThread(changes: Partial<TestThread> & { id: string }) {
      threads.set(
        changes.id,
        makeThreadResponse({
          projectId: "proj_test",
          status: "active",
          lastReadAt: 0,
          latestAttentionAt: 10,
          ...changes,
        }),
      );
    },
    setThread(changes: Partial<TestThread>, threadId = "thr_test") {
      const thread = getTestThread(threadId);
      threads.set(threadId, makeThreadResponse({ ...thread, ...changes }));
    },
    emitChanged(threadId = "thr_test") {
      for (const callback of changedCallbacks) callback(threadId);
    },
  };
}

async function configFor(
  organizer: ReturnType<typeof createHarness>,
): Promise<WorkflowConfig> {
  return (await organizer.harness.behavior.callRpc(
    "getConfig",
    {},
  )) as WorkflowConfig;
}

describe("Thread Organizer server", () => {
  it("does not activate agent configuration before saved workflow initialization finishes", async () => {
    const organizer = createHarness();
    let release!: () => void;
    const blocked = new Promise<void>((resolve) => {
      release = resolve;
    });
    organizer.listSections.mockImplementationOnce(async () => {
      await blocked;
      return [];
    });

    const activation = plugin(organizer.bb);
    expect(
      organizer.harness.inspection.registrations.agentConfigurationProvider,
    ).toBeNull();
    release();
    await activation;
    expect(
      organizer.harness.inspection.registrations.agentConfigurationProvider,
    ).not.toBeNull();
    await organizer.harness.lifecycle.dispose();
  });

  it("registers its workflow surfaces and creates every default native section", async () => {
    const organizer = createHarness();
    await plugin(organizer.bb);
    const config = await configFor(organizer);

    expect(organizer.harness.inspection.registrations.cli?.name).toBe(
      "organizer",
    );
    expect(organizer.harness.inspection.registrations.rpcMethods).toEqual([
      "getConfig",
      "saveConfig",
    ]);
    expect(
      organizer.harness.inspection.registrations.agentConfigurationProvider,
    ).not.toBeNull();
    expect(config.stages.every((stage) => stage.sectionId !== null)).toBe(true);
    expect(organizer.sections().map(({ name }) => name)).toEqual(
      DEFAULT_WORKFLOW_CONFIG.stages.map(localSectionName),
    );
    await organizer.harness.lifecycle.dispose();
  });

  it("migrates an emoji-prefixed default in place and preserves its id", async () => {
    const organizer = createHarness({ legacyPlanning: true });
    await plugin(organizer.bb);
    const config = await configFor(organizer);
    const planning = config.stages.find((stage) => stage.key === "planning")!;

    expect(planning.sectionId).toBe("sec_legacy_planning");
    expect(organizer.sections()).toContainEqual(
      expect.objectContaining({
        id: "sec_legacy_planning",
        name: "📋 Planning",
      }),
    );
    await organizer.harness.lifecycle.dispose();
  });

  it("keeps Inbox sticky across read changes until work resumes", async () => {
    const organizer = createHarness();
    await plugin(organizer.bb);
    const config = await configFor(organizer);
    const sectionId = (key: string) =>
      config.stages.find((stage) => stage.key === key)!.sectionId;

    await organizer.harness.behavior.emitThreadEvent("thread.created", {
      thread: organizer.current(),
    });
    expect(organizer.current().sectionId).toBe(sectionId("planning"));

    organizer.setThread({
      status: "idle",
      lastReadAt: 0,
      latestAttentionAt: 20,
    });
    await organizer.harness.behavior.emitThreadEvent("thread.idle", {
      thread: organizer.current(),
      lastAssistantText: null,
    });
    expect(organizer.current().sectionId).toBe(sectionId("inbox"));

    organizer.setThread({ lastReadAt: 20 });
    await organizer.harness.behavior.emitThreadEvent("thread.idle", {
      thread: organizer.current(),
      lastAssistantText: null,
    });
    expect(organizer.current().sectionId).toBe(sectionId("inbox"));

    organizer.setThread({ lastReadAt: 0 });
    organizer.emitChanged();
    await vi.waitFor(() =>
      expect(organizer.current().sectionId).toBe(sectionId("inbox")),
    );

    organizer.setThread({ status: "starting" });
    await organizer.harness.behavior.emitThreadEvent("thread.active", {
      thread: organizer.current(),
    });
    expect(organizer.current().sectionId).toBe(sectionId("planning"));
    expect(
      organizer.harness.inspection.sdk.callsTo("threads.promptHistory"),
    ).toHaveLength(0);
    expect(organizer.spawnThread).not.toHaveBeenCalled();
    await organizer.harness.lifecycle.dispose();
  });

  it("migrates an existing Inbox placement into sticky state", async () => {
    const organizer = createHarness();
    organizer.setThread({
      status: "idle",
      lastReadAt: 10,
      latestAttentionAt: 10,
      sectionId: "sec_1",
    });
    await organizer.bb.storage.kv.set("thread:v3:thr_test", {
      version: 3,
      rememberedStageKey: "planning",
      lastObservedSectionId: "sec_1",
    });
    await plugin(organizer.bb);
    const config = await configFor(organizer);
    const inboxId = config.stages.find(
      (stage) => stage.key === "inbox",
    )!.sectionId;
    const planningId = config.stages.find(
      (stage) => stage.key === "planning",
    )!.sectionId;

    await organizer.harness.behavior.emitThreadEvent("thread.idle", {
      thread: organizer.current(),
      lastAssistantText: null,
    });
    expect(organizer.current().sectionId).toBe(inboxId);
    await expect(
      organizer.bb.storage.kv.get("thread:v3:thr_test"),
    ).resolves.toMatchObject({ version: 4, inboxLatched: true });

    organizer.setThread({ status: "starting" });
    await organizer.harness.behavior.emitThreadEvent("thread.active", {
      thread: organizer.current(),
    });
    expect(organizer.current().sectionId).toBe(planningId);
    await organizer.harness.lifecycle.dispose();
  });

  it("organizes visible automation roots and gives their agents phase guidance", async () => {
    const organizer = createHarness();
    organizer.setThread({
      originPluginId: "automations",
      status: "active",
    });
    await plugin(organizer.bb);

    await expect(
      organizer.harness.behavior.runCli(["phase", "building"], {
        threadId: "thr_test",
      }),
    ).resolves.toMatchObject({ exitCode: 0 });
    await expect(
      organizer.harness.behavior.resolveAgentConfiguration(
        agentContext("automations"),
      ),
    ).resolves.toMatchObject({ skills: ["thread-phase-organizer"] });
    await organizer.harness.lifecycle.dispose();
  });

  it("reassesses the affected title after a semantic stage transition", async () => {
    const organizer = createHarness();
    organizer.setThread({
      environmentId: "env_test",
      status: "active",
      title: "Old work title",
    });
    await plugin(organizer.bb);

    await organizer.harness.behavior.runCli(["phase", "building"], {
      threadId: "thr_test",
    });

    await vi.waitFor(() =>
      expect(organizer.spawnThread).toHaveBeenCalledOnce(),
    );
    await vi.waitFor(() =>
      expect(organizer.current().title).toBe(
        "Implement semantic thread titles",
      ),
    );
    expect(organizer.spawnThread).toHaveBeenCalledWith(
      expect.objectContaining({
        environment: { type: "reuse", environmentId: "env_test" },
        permissionMode: "accept-edits",
        projectId: "proj_test",
        visibility: "hidden",
      }),
    );
    expect(organizer.spawnThread.mock.calls[0]?.[0].prompt).toContain(
      "Implement semantic thread title reassessment.",
    );
    expect(organizer.waitThread).toHaveBeenCalledWith(
      expect.objectContaining({
        event: "turn/completed",
        threadId: "thr_title_worker",
      }),
    );
    expect(organizer.archiveThread).toHaveBeenCalledWith({
      threadId: "thr_title_worker",
    });
    expect(organizer.stopThread).toHaveBeenCalledWith({
      threadId: "thr_title_worker",
    });
    await expect(
      organizer.harness.behavior.resolveAgentConfiguration(
        agentContext("thread-organizer"),
      ),
    ).resolves.toMatchObject({ skills: [] });
    await organizer.harness.lifecycle.dispose();
  });

  it("reassesses a title when the current stage is autonomously refreshed", async () => {
    const organizer = createHarness();
    organizer.setThread({ status: "active", title: "Old planning title" });
    await plugin(organizer.bb);

    const result = await organizer.harness.behavior.runCli(
      ["phase", "planning"],
      { threadId: "thr_test" },
    );

    expect(result.stdout).toContain("queued a title refresh");
    expect(result.stdout).not.toContain("Confirm");

    await vi.waitFor(() =>
      expect(organizer.current().title).toBe(
        "Implement semantic thread titles",
      ),
    );
    expect(organizer.spawnThread).toHaveBeenCalledOnce();
    await organizer.harness.lifecycle.dispose();
  });

  it("batches title reassessments for multiple threads into one worker", async () => {
    const organizer = createHarness();
    organizer.setThread({ status: "active", title: "First old title" });
    organizer.addThread({
      id: "thr_second",
      status: "active",
      title: "Second old title",
    });
    organizer.outputThread.mockResolvedValueOnce({
      output: JSON.stringify({
        decisions: [
          {
            id: "thr_test",
            action: "rename",
            title: "First current work",
          },
          {
            id: "thr_second",
            action: "rename",
            title: "Second current work",
          },
        ],
      }),
    });
    await plugin(organizer.bb);

    await Promise.all([
      organizer.harness.behavior.runCli(["phase", "building"], {
        threadId: "thr_test",
      }),
      organizer.harness.behavior.runCli(["phase", "building"], {
        threadId: "thr_second",
      }),
    ]);

    await vi.waitFor(() => {
      expect(organizer.current().title).toBe("First current work");
      expect(organizer.current("thr_second").title).toBe("Second current work");
    });
    expect(organizer.spawnThread).toHaveBeenCalledOnce();
    const prompt = organizer.spawnThread.mock.calls[0]?.[0].prompt ?? "";
    expect(prompt).toContain('"id":"thr_test"');
    expect(prompt).toContain('"id":"thr_second"');
    await organizer.harness.lifecycle.dispose();
  });

  it("does not overwrite a title changed while reassessment is running", async () => {
    const organizer = createHarness();
    organizer.setThread({ status: "active", title: "Initial title" });
    let releaseOutput!: () => void;
    const outputReady = new Promise<void>((resolve) => {
      releaseOutput = resolve;
    });
    organizer.outputThread.mockImplementationOnce(async () => {
      await outputReady;
      return {
        output:
          '{"decisions":[{"id":"thr_test","action":"rename","title":"Stale generated title"}]}',
      };
    });
    await plugin(organizer.bb);

    await organizer.harness.behavior.runCli(["phase", "building"], {
      threadId: "thr_test",
    });
    await vi.waitFor(() =>
      expect(organizer.spawnThread).toHaveBeenCalledOnce(),
    );
    organizer.setThread({ title: "User-chosen title" });
    releaseOutput();

    await vi.waitFor(() => expect(organizer.stopThread).toHaveBeenCalledOnce());
    expect(organizer.current().title).toBe("User-chosen title");
    expect(
      organizer.updateThread.mock.calls.filter(
        ([input]) => input.title !== undefined,
      ),
    ).toHaveLength(0);
    await organizer.harness.lifecycle.dispose();
  });

  it("remembers a user move made while unread, but keeps the row in Inbox", async () => {
    const organizer = createHarness();
    await plugin(organizer.bb);
    const config = await configFor(organizer);
    const sectionId = (key: string) =>
      config.stages.find((stage) => stage.key === key)!.sectionId;

    organizer.setThread({
      status: "idle",
      lastReadAt: 10,
      latestAttentionAt: 10,
      sectionId: sectionId("planning"),
    });
    await organizer.harness.behavior.emitThreadEvent("thread.idle", {
      thread: organizer.current(),
      lastAssistantText: null,
    });

    organizer.setThread({
      lastReadAt: 0,
      latestAttentionAt: 20,
      sectionId: sectionId("on-hold"),
    });
    await organizer.harness.behavior.emitThreadEvent("thread.idle", {
      thread: organizer.current(),
      lastAssistantText: null,
    });
    expect(organizer.current().sectionId).toBe(sectionId("inbox"));

    organizer.setThread({ lastReadAt: 20 });
    await organizer.harness.behavior.emitThreadEvent("thread.idle", {
      thread: organizer.current(),
      lastAssistantText: null,
    });
    expect(organizer.current().sectionId).toBe(sectionId("inbox"));

    organizer.setThread({ status: "starting" });
    await organizer.harness.behavior.emitThreadEvent("thread.active", {
      thread: organizer.current(),
    });
    expect(organizer.current().sectionId).toBe(sectionId("on-hold"));
    await organizer.harness.lifecycle.dispose();
  });

  it("moves explicitly with dynamic CLI keys and never accepts Inbox", async () => {
    const organizer = createHarness();
    await plugin(organizer.bb);
    const config = await configFor(organizer);
    organizer.setThread({ status: "active" });

    await expect(
      organizer.harness.behavior.runCli(["phase", "on-hold"], {
        threadId: "thr_test",
      }),
    ).resolves.toMatchObject({
      exitCode: 0,
      stdout: expect.stringContaining("On Hold"),
    });
    expect(organizer.current().sectionId).toBe(
      config.stages.find((stage) => stage.key === "on-hold")!.sectionId,
    );
    await expect(
      organizer.harness.behavior.runCli(["phase", "inbox"], {
        threadId: "thr_test",
      }),
    ).resolves.toMatchObject({ exitCode: 2 });
    await organizer.harness.lifecycle.dispose();
  });

  it("returns a CLI failure when the explicit move cannot be reconciled", async () => {
    const organizer = createHarness();
    await plugin(organizer.bb);
    organizer.setThread({ status: "active" });
    organizer.updateThread.mockRejectedValueOnce(new Error("update failed"));

    const result = await organizer.harness.behavior.runCli(
      ["phase", "on-hold"],
      { threadId: "thr_test" },
    );

    expect(result).toMatchObject({
      exitCode: 1,
      stdout: "",
      stderr: expect.stringContaining("update failed"),
    });
    expect(result.stdout).not.toContain("Set thr_test workflow stage");
    await organizer.harness.lifecycle.dispose();
  });

  it("serializes configuration reconciliation before a newer explicit move", async () => {
    const organizer = createHarness();
    await plugin(organizer.bb);
    const current = await configFor(organizer);
    const planning = current.stages.find((stage) => stage.key === "planning")!;
    organizer.setThread({
      status: "active",
      sectionId: planning.sectionId,
    });
    let release!: () => void;
    let markStarted!: () => void;
    const blocked = new Promise<void>((resolve) => {
      release = resolve;
    });
    const started = new Promise<void>((resolve) => {
      markStarted = resolve;
    });
    const staleSnapshot = organizer.current();
    organizer.getThread.mockImplementationOnce(async () => {
      markStarted();
      await blocked;
      return staleSnapshot;
    });
    const edited = editableWorkflowConfig(current);
    edited.stages[1] = {
      ...edited.stages[1]!,
      rule: "Updated while an explicit move is queued.",
    };

    const save = organizer.harness.behavior.callRpc("saveConfig", edited);
    await started;
    const move = organizer.harness.behavior.runCli(["phase", "on-hold"], {
      threadId: "thr_test",
    });
    release();
    await Promise.all([save, move]);

    expect(organizer.current().sectionId).toBe(
      current.stages.find((stage) => stage.key === "on-hold")!.sectionId,
    );
    await organizer.harness.lifecycle.dispose();
  });

  it("saves Inbox presentation and custom rules into the next agent session", async () => {
    const organizer = createHarness();
    await plugin(organizer.bb);
    const current = await configFor(organizer);
    const edited = editableWorkflowConfig(current);
    edited.stages[0] = {
      ...edited.stages[0]!,
      title: "Needs Me",
      icon: "MailOpen",
    };
    edited.stages[1] = {
      ...edited.stages[1]!,
      title: "Shaping",
      rule: "Clarifying the outcome and constraints.",
    };

    const saved = (await organizer.harness.behavior.callRpc(
      "saveConfig",
      edited,
    )) as WorkflowConfig;
    const configuration =
      await organizer.harness.behavior.resolveAgentConfiguration(
        agentContext(),
      );

    expect(saved.stages[0]).toMatchObject({
      title: "Needs Me",
      icon: "MailOpen",
    });
    expect(organizer.sections()).toContainEqual(
      expect.objectContaining({ name: "📬 Needs Me" }),
    );
    expect(configuration.skills).toEqual(["thread-phase-organizer"]);
    expect(configuration.instructions).toContain(
      "| planning | Shaping | Clarifying the outcome and constraints. |",
    );
    expect(configuration.instructions).toContain(
      "**Needs Me** is the protected Inbox section",
    );
    await organizer.harness.lifecycle.dispose();
  });

  it("migrates remembered work before deleting a removed stage", async () => {
    const organizer = createHarness();
    await plugin(organizer.bb);
    const current = await configFor(organizer);
    organizer.setThread({ status: "active" });
    await organizer.harness.behavior.runCli(["phase", "handoff"], {
      threadId: "thr_test",
    });
    const handoff = current.stages.find((stage) => stage.key === "handoff")!;
    expect(organizer.current().sectionId).toBe(handoff.sectionId);

    const edited = editableWorkflowConfig(current);
    edited.stages = edited.stages.filter((stage) => stage.key !== "handoff");
    await organizer.harness.behavior.callRpc("saveConfig", edited);

    expect(organizer.current().sectionId).toBe(
      current.stages.find((stage) => stage.key === "planning")!.sectionId,
    );
    expect(organizer.deleteSection).toHaveBeenCalledWith({
      id: handoff.sectionId,
    });
    await organizer.harness.lifecycle.dispose();
  });

  it.each(["migration", "deletion"] as const)(
    "resumes a partially failed %s cleanup after plugin restart",
    async (failure) => {
      const organizer = createHarness();
      await plugin(organizer.bb);
      const current = await configFor(organizer);
      organizer.setThread({ status: "active" });
      await organizer.harness.behavior.runCli(["phase", "handoff"], {
        threadId: "thr_test",
      });
      const handoff = current.stages.find((stage) => stage.key === "handoff")!;
      const edited = editableWorkflowConfig(current);
      edited.stages = edited.stages.filter((stage) => stage.key !== "handoff");
      if (failure === "migration") {
        organizer.updateThread.mockRejectedValueOnce(
          new Error("migration failed"),
        );
      } else {
        organizer.deleteSection.mockRejectedValueOnce(
          new Error("deletion failed"),
        );
      }

      await expect(
        organizer.harness.behavior.callRpc("saveConfig", edited),
      ).rejects.toThrow(`${failure} failed`);

      const replacement = await organizer.harness.lifecycle.reload(plugin);
      const recovered = (await replacement.harness.behavior.callRpc(
        "getConfig",
        {},
      )) as WorkflowConfig;
      expect(recovered.stages.some((stage) => stage.key === "handoff")).toBe(
        false,
      );
      expect(
        organizer
          .sections()
          .some((section) => section.id === handoff.sectionId),
      ).toBe(false);
      expect(organizer.current().sectionId).toBe(
        recovered.stages.find((stage) => stage.key === "planning")!.sectionId,
      );
      await replacement.harness.lifecycle.dispose();
    },
  );
});
