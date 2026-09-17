import type { BbPluginApi } from "@get-bb/plugin-sdk";
import {
  createFakePluginHost,
  makeThreadResponse,
} from "@get-bb/plugin-sdk/testing";
import { describe, expect, it, vi } from "vitest";

import {
  DEFAULT_WORKFLOW_CONFIG,
  editableWorkflowConfig,
  localSectionName,
  type EditableWorkflowConfig,
  type WorkflowConfig,
} from "./core.js";
import plugin from "./server.js";

type TestThread = ReturnType<typeof makeThreadResponse>;

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

function createHarness(
  options: { iconEraSections?: boolean; legacyPlanning?: boolean } = {},
) {
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
  let sections: TestSection[] = [
    ...(options.legacyPlanning
      ? [
          {
            id: "sec_legacy_planning",
            name: "📋 Planning",
            createdAt: 1,
            updatedAt: 1,
          },
        ]
      : []),
    // Names the icon-era plugin gave its defaults (emoji derived from the
    // default icons), as found on every install of the previous release.
    ...(options.iconEraSections
      ? [
          {
            id: "sec_icon_spec_review",
            name: "📄 Spec Review",
            createdAt: 1,
            updatedAt: 1,
          },
          {
            id: "sec_icon_testing",
            name: "🧪 Testing / Deploy",
            createdAt: 1,
            updatedAt: 1,
          },
          {
            id: "sec_icon_on_hold",
            name: "⏸️ On Hold",
            createdAt: 1,
            updatedAt: 1,
          },
        ]
      : []),
  ];
  type TestThreadChange =
    | "archived-changed"
    | "order-changed"
    | "parent-changed"
    | "read-state-changed"
    | "title-changed";
  const changedCallbacks: Array<
    (threadId: string, changes: readonly TestThreadChange[]) => void
  > = [];

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
  const listThreads = vi.fn(async (_input?: { signal?: AbortSignal }) => [
    ...threads.values(),
  ]);
  const listSections = vi.fn(async () =>
    sections.map((section) => ({ ...section })),
  );
  const spawnThread = vi.fn(async () =>
    makeThreadResponse({
      id: "thr_unexpected_worker",
      projectId: getTestThread().projectId,
      environmentId: getTestThread().environmentId,
      visibility: "hidden",
      originPluginId: "thread-organizer",
      title: "Unexpected worker",
    }),
  );

  type SendThreadMessage = BbPluginApi["sdk"]["threads"]["send"];
  const sendMessage = vi.fn<SendThreadMessage>(
    async () => ({}) as Awaited<ReturnType<SendThreadMessage>>,
  );

  const deleteQueuedMessage = vi.fn(
    async (_args: { queuedMessageId: string; threadId: string }) =>
      ({ ok: true }) as never,
  );

  const host = createFakePluginHost({
    pluginId: "thread-organizer",
    agentSkillIds: ["thread-phase-organizer"],
    sdk: {
      subscribe: (args) => {
        const callback = args.callback as unknown as (event: {
          changes: readonly TestThreadChange[];
          entity: "thread";
          id: string;
          type: "changed";
        }) => void;
        changedCallbacks.push((threadId, changes) =>
          callback({
            entity: "thread",
            type: "changed",
            id: threadId,
            changes,
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
        get: getThread,
        list: listThreads,
        queuedMessages: { delete: deleteQueuedMessage },
        send: sendMessage,
        spawn: spawnThread,
        update: updateThread,
      },
    },
  });

  return {
    ...host,
    create,
    deleteSection,
    getThread,
    listSections,
    deleteQueuedMessage,
    listThreads,
    sendMessage,
    updateSection,
    updateThread,
    spawnThread,
    current: (threadId = "thr_test") => getTestThread(threadId),
    sections: () => sections.map((section) => ({ ...section })),
    setThread(changes: Partial<TestThread>, threadId = "thr_test") {
      const thread = getTestThread(threadId);
      threads.set(threadId, makeThreadResponse({ ...thread, ...changes }));
    },
    emitChanged(
      changes: TestThreadChange | readonly TestThreadChange[] =
        "read-state-changed",
      threadId = "thr_test",
    ) {
      const changeList = Array.isArray(changes) ? changes : [changes];
      for (const callback of changedCallbacks) callback(threadId, changeList);
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

  it("keeps the plugin registered when startup reconciliation fails", async () => {
    const organizer = createHarness();
    organizer.setThread({
      status: "idle",
      lastReadAt: 0,
      latestAttentionAt: 20,
    });
    organizer.updateThread.mockRejectedValueOnce(new Error("update failed"));

    await expect(plugin(organizer.bb)).resolves.toBeUndefined();

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
    await organizer.harness.lifecycle.dispose();
  });

  it("handles lifecycle events while startup reconciliation is listing threads", async () => {
    const organizer = createHarness();
    let releaseList!: () => void;
    let markListStarted!: () => void;
    const listBlocked = new Promise<void>((resolve) => {
      releaseList = resolve;
    });
    const listStarted = new Promise<void>((resolve) => {
      markListStarted = resolve;
    });
    organizer.listThreads.mockImplementationOnce(async () => {
      markListStarted();
      await listBlocked;
      return [organizer.current()];
    });

    const activation = plugin(organizer.bb);
    await listStarted;
    organizer.setThread({
      status: "idle",
      lastReadAt: 0,
      latestAttentionAt: 20,
    });
    await organizer.harness.behavior.emitThreadEvent("thread.idle", {
      thread: organizer.current(),
      lastAssistantText: null,
    });

    expect(organizer.current().sectionId).toBe("sec_1");
    releaseList();
    await activation;
    await organizer.harness.lifecycle.dispose();
  });

  it("re-fetches current thread state after startup listing", async () => {
    const organizer = createHarness();
    organizer.setThread({
      status: "idle",
      lastReadAt: 0,
      latestAttentionAt: 20,
      sectionId: "sec_2",
    });
    organizer.listThreads.mockImplementationOnce(async () => {
      const stale = organizer.current();
      organizer.setThread({
        status: "active",
        lastReadAt: 20,
        latestAttentionAt: 20,
        sectionId: "sec_4",
      });
      return [stale];
    });

    await plugin(organizer.bb);

    expect(organizer.current().sectionId).toBe("sec_4");
    await expect(
      organizer.bb.storage.kv.get("thread:v3:thr_test"),
    ).resolves.toMatchObject({ version: 5, rememberedStageKey: "building" });
    await organizer.harness.lifecycle.dispose();
  });

  it("aborts startup listing when the plugin is disposed", async () => {
    const organizer = createHarness();
    let releaseList!: () => void;
    let markListStarted!: () => void;
    let listSignal: AbortSignal | undefined;
    const listBlocked = new Promise<void>((resolve) => {
      releaseList = resolve;
    });
    const listStarted = new Promise<void>((resolve) => {
      markListStarted = resolve;
    });
    organizer.listThreads.mockImplementationOnce(async (input) => {
      listSignal = input?.signal;
      markListStarted();
      await listBlocked;
      return [organizer.current()];
    });

    const activation = plugin(organizer.bb);
    await listStarted;
    const disposal = organizer.harness.lifecycle.dispose();

    expect(listSignal?.aborted).toBe(true);
    releaseList();
    await Promise.all([activation, disposal]);
    expect(organizer.listThreads).toHaveBeenCalledTimes(1);
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
        name: "Planning",
      }),
    );
    await organizer.harness.lifecycle.dispose();
  });

  it("adopts icon-era default section names by name when no config is stored", async () => {
    const organizer = createHarness({ iconEraSections: true });
    await plugin(organizer.bb);
    const config = await configFor(organizer);
    const sectionId = (key: string) =>
      config.stages.find((stage) => stage.key === key)!.sectionId;

    expect(sectionId("spec-review")).toBe("sec_icon_spec_review");
    expect(sectionId("testing-deploy")).toBe("sec_icon_testing");
    expect(sectionId("on-hold")).toBe("sec_icon_on_hold");
    expect(organizer.create.mock.calls.map(([{ name }]) => name)).toEqual([
      "Inbox",
      "Planning",
      "Building",
      "Handoff",
    ]);
    expect(organizer.sections()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "sec_icon_spec_review",
          name: "Spec Review",
        }),
        expect.objectContaining({
          id: "sec_icon_testing",
          name: "Testing / Deploy",
        }),
        expect.objectContaining({ id: "sec_icon_on_hold", name: "On Hold" }),
      ]),
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
    await organizer.bb.storage.kv.set("thread:v3:thr_test", {
      version: 4,
      inboxLatched: false,
      rememberedStageKey: "planning",
      lastObservedSectionId: sectionId("inbox"),
    });
    organizer.emitChanged(["read-state-changed", "title-changed"]);
    await new Promise((resolve) => setTimeout(resolve, 0));
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

  it("does not remove a running Inbox thread when it becomes read", async () => {
    const organizer = createHarness();
    await plugin(organizer.bb);
    const config = await configFor(organizer);
    const inboxId = config.stages.find(
      (stage) => stage.key === "inbox",
    )!.sectionId;

    organizer.setThread({
      status: "idle",
      lastReadAt: 0,
      latestAttentionAt: 20,
    });
    await organizer.harness.behavior.emitThreadEvent("thread.idle", {
      thread: organizer.current(),
      lastAssistantText: null,
    });
    expect(organizer.current().sectionId).toBe(inboxId);

    organizer.setThread({ status: "active", lastReadAt: 20 });
    const fetchCount = organizer.getThread.mock.calls.length;
    organizer.emitChanged(["read-state-changed", "title-changed"]);
    await vi.waitFor(() =>
      expect(organizer.getThread.mock.calls.length).toBeGreaterThan(fetchCount),
    );

    expect(organizer.current().sectionId).toBe(inboxId);
    await organizer.harness.lifecycle.dispose();
  });

  it("routes lifecycle events from current state instead of event snapshots", async () => {
    const organizer = createHarness();
    await plugin(organizer.bb);
    expect(organizer.harness.inspection.registrations.services).toEqual([]);
    const config = await configFor(organizer);
    const sectionId = (key: string) =>
      config.stages.find((stage) => stage.key === key)!.sectionId;

    const stale = makeThreadResponse({
      ...organizer.current(),
      status: "idle",
      lastReadAt: 0,
      latestAttentionAt: 20,
      sectionId: sectionId("planning"),
    });
    organizer.setThread({
      status: "active",
      lastReadAt: 20,
      latestAttentionAt: 20,
      sectionId: sectionId("building"),
    });
    await organizer.harness.behavior.emitThreadEvent("thread.idle", {
      thread: stale,
      lastAssistantText: null,
    });

    expect(organizer.current().sectionId).toBe(sectionId("building"));
    expect(organizer.getThread).toHaveBeenCalledWith({ threadId: "thr_test" });
    await organizer.harness.lifecycle.dispose();
  });

  it("reconciles every thread change as a current-state invalidation", async () => {
    const organizer = createHarness();
    await plugin(organizer.bb);
    const config = await configFor(organizer);
    const onHoldId = config.stages.find(
      (stage) => stage.key === "on-hold",
    )!.sectionId;
    organizer.setThread({
      status: "active",
      lastReadAt: 20,
      latestAttentionAt: 20,
      sectionId: onHoldId,
    });

    organizer.emitChanged("parent-changed");

    await vi.waitFor(async () => {
      await expect(
        organizer.bb.storage.kv.get("thread:v3:thr_test"),
      ).resolves.toMatchObject({ version: 5, rememberedStageKey: "on-hold" });
    });
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
    ).resolves.toMatchObject({ version: 5, rememberedStageKey: "planning" });

    organizer.setThread({ status: "starting" });
    await organizer.harness.behavior.emitThreadEvent("thread.active", {
      thread: organizer.current(),
    });
    expect(organizer.current().sectionId).toBe(planningId);
    await organizer.harness.lifecycle.dispose();
  });

  it("treats a visible Inbox placement as authoritative on startup", async () => {
    const organizer = createHarness();
    organizer.setThread({
      status: "idle",
      lastReadAt: 10,
      latestAttentionAt: 10,
      sectionId: "sec_1",
    });
    await organizer.bb.storage.kv.set("thread:v3:thr_test", {
      version: 4,
      inboxLatched: false,
      rememberedStageKey: "planning",
      lastObservedSectionId: "sec_1",
    });

    await plugin(organizer.bb);
    const config = await configFor(organizer);
    const inboxId = config.stages.find(
      (stage) => stage.key === "inbox",
    )!.sectionId;

    expect(organizer.current().sectionId).toBe(inboxId);
    await expect(
      organizer.bb.storage.kv.get("thread:v3:thr_test"),
    ).resolves.toMatchObject({ version: 5, rememberedStageKey: "planning" });
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

  it("moves stages without changing the thread title or spawning a worker", async () => {
    const organizer = createHarness();
    organizer.setThread({ status: "active", title: "Durable project title" });
    await plugin(organizer.bb);

    const result = await organizer.harness.behavior.runCli(
      ["phase", "building"],
      { threadId: "thr_test" },
    );

    expect(result).toMatchObject({
      exitCode: 0,
      stdout: expect.stringContaining("Applied Building to thr_test."),
    });
    expect(result.stdout).not.toContain("title");
    expect(organizer.current().title).toBe("Durable project title");
    expect(organizer.spawnThread).not.toHaveBeenCalled();
    expect(
      organizer.updateThread.mock.calls.filter(
        ([input]) => input.title !== undefined,
      ),
    ).toEqual([]);
    await organizer.harness.lifecycle.dispose();
  });

  it("keeps unread user moves in Inbox, then accepts an explicit move once read", async () => {
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

    organizer.setThread({ sectionId: sectionId("on-hold") });
    organizer.emitChanged("title-changed");
    await vi.waitFor(async () => {
      expect(organizer.current().sectionId).toBe(sectionId("on-hold"));
      await expect(
        organizer.bb.storage.kv.get("thread:v3:thr_test"),
      ).resolves.toMatchObject({ version: 5, rememberedStageKey: "on-hold" });
    });

    organizer.setThread({ lastReadAt: 0 });
    organizer.emitChanged();
    await vi.waitFor(() =>
      expect(organizer.current().sectionId).toBe(sectionId("inbox")),
    );
    organizer.setThread({ status: "starting" });
    await organizer.harness.behavior.emitThreadEvent("thread.active", {
      thread: organizer.current(),
    });
    expect(organizer.current().sectionId).toBe(sectionId("on-hold"));
    await organizer.harness.lifecycle.dispose();
  });

  it("moves a read Inbox thread through the CLI while unread moves stay in Inbox", async () => {
    const organizer = createHarness();
    await plugin(organizer.bb);
    const config = await configFor(organizer);
    const sectionId = (key: string) =>
      config.stages.find((stage) => stage.key === key)!.sectionId;

    organizer.setThread({
      status: "idle",
      lastReadAt: 0,
      latestAttentionAt: 20,
      sectionId: sectionId("planning"),
    });
    await organizer.harness.behavior.emitThreadEvent("thread.idle", {
      thread: organizer.current(),
      lastAssistantText: null,
    });
    expect(organizer.current().sectionId).toBe(sectionId("inbox"));

    await organizer.harness.behavior.runCli(["phase", "on-hold"], {
      threadId: "thr_test",
    });
    expect(organizer.current().sectionId).toBe(sectionId("inbox"));
    await expect(
      organizer.bb.storage.kv.get("thread:v3:thr_test"),
    ).resolves.toMatchObject({ version: 5, rememberedStageKey: "on-hold" });

    organizer.setThread({ lastReadAt: 20 });
    await organizer.harness.behavior.emitThreadEvent("thread.idle", {
      thread: organizer.current(),
      lastAssistantText: null,
    });
    expect(organizer.current().sectionId).toBe(sectionId("inbox"));

    await organizer.harness.behavior.runCli(["phase", "on-hold"], {
      threadId: "thr_test",
    });
    expect(organizer.current().sectionId).toBe(sectionId("on-hold"));
    await expect(
      organizer.bb.storage.kv.get("thread:v3:thr_test"),
    ).resolves.toMatchObject({ version: 5, rememberedStageKey: "on-hold" });
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
    });
    expect(organizer.sections()).toContainEqual(
      expect.objectContaining({ name: "Needs Me" }),
    );
    expect(configuration.skills).toEqual(["thread-phase-organizer"]);
    expect(configuration.instructions).toContain(
      "| planning | Shaping | Clarifying the outcome and constraints. |",
    );
    expect(configuration.instructions).toContain(
      "**Needs Me** is the protected Inbox section",
    );
    expect(configuration.instructions).toContain(
      "generated from the user’s plugin settings",
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

async function saveStagePatch(
  organizer: ReturnType<typeof createHarness>,
  key: string,
  patch: Partial<EditableWorkflowConfig["stages"][number]>,
): Promise<WorkflowConfig> {
  const edited = editableWorkflowConfig(await configFor(organizer));
  const index = edited.stages.findIndex((stage) => stage.key === key);
  edited.stages[index] = { ...edited.stages[index]!, ...patch };
  return (await organizer.harness.behavior.callRpc(
    "saveConfig",
    edited,
  )) as WorkflowConfig;
}

describe("entry prompts", () => {
  const threadState = (organizer: ReturnType<typeof createHarness>) =>
    organizer.bb.storage.kv.get("thread:v3:thr_test");

  it("sends a stage's entry prompt once when a read idle thread lands in it", async () => {
    const organizer = createHarness();
    await plugin(organizer.bb);
    organizer.setThread({
      status: "idle",
      lastReadAt: 10,
      latestAttentionAt: 10,
      title: "Fix the flaky test",
    });
    const config = await saveStagePatch(organizer, "spec-review", {
      entryPrompt: "Review {{thread.title}} in {{stage.title}}.",
    });
    const sectionId = (key: string) =>
      config.stages.find((stage) => stage.key === key)!.sectionId;
    expect(organizer.sendMessage).not.toHaveBeenCalled();

    organizer.setThread({ sectionId: sectionId("spec-review") });
    organizer.emitChanged("order-changed");
    await vi.waitFor(() =>
      expect(organizer.sendMessage).toHaveBeenCalledTimes(1),
    );
    expect(organizer.sendMessage).toHaveBeenCalledWith({
      threadId: "thr_test",
      mode: "queue-if-active",
      input: [
        {
          type: "text",
          text: "Thread Organizer — entering “Spec Review”:\n\nReview Fix the flaky test in Spec Review.",
          mentions: [],
        },
      ],
    });

    organizer.emitChanged("title-changed");
    await vi.waitFor(async () => {
      await expect(threadState(organizer)).resolves.toMatchObject({
        version: 5,
        lastLandedStageKey: "spec-review",
        pendingEntryPrompt: null,
        recentEntryPrompts: [expect.objectContaining({ stageKey: "spec-review" })],
      });
    });
    expect(organizer.sendMessage).toHaveBeenCalledTimes(1);

    // Leaving and re-entering inside the cooldown is refused, not re-sent.
    organizer.setThread({ sectionId: sectionId("planning") });
    organizer.emitChanged("order-changed");
    await vi.waitFor(async () => {
      await expect(threadState(organizer)).resolves.toMatchObject({
        lastLandedStageKey: "planning",
      });
    });
    organizer.setThread({ sectionId: sectionId("spec-review") });
    organizer.emitChanged("order-changed");
    await vi.waitFor(async () => {
      await expect(threadState(organizer)).resolves.toMatchObject({
        lastLandedStageKey: "spec-review",
        pendingEntryPrompt: null,
      });
    });
    expect(organizer.sendMessage).toHaveBeenCalledTimes(1);
    await organizer.harness.lifecycle.dispose();
  });

  it("queues the entry prompt when an agent moves an active thread with the CLI, unless the stage opts out", async () => {
    const organizer = createHarness();
    await plugin(organizer.bb);
    organizer.setThread({
      status: "active",
      lastReadAt: 10,
      latestAttentionAt: 10,
    });
    await saveStagePatch(organizer, "handoff", {
      entryPrompt: "Package the handoff.",
    });
    await saveStagePatch(organizer, "testing-deploy", {
      entryPrompt: "Run the release checks.",
      entryPromptOnAgentMove: false,
    });

    await expect(
      organizer.harness.behavior.runCli(["phase", "handoff"], {
        threadId: "thr_test",
      }),
    ).resolves.toMatchObject({
      exitCode: 0,
      stdout: "Applied Handoff to thr_test. Sent its entry prompt.\n",
    });
    expect(organizer.sendMessage).toHaveBeenCalledTimes(1);
    expect(organizer.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({ threadId: "thr_test", mode: "queue-if-active" }),
    );

    await expect(
      organizer.harness.behavior.runCli(["phase", "handoff"], {
        threadId: "thr_test",
      }),
    ).resolves.toMatchObject({ stdout: "Applied Handoff to thr_test.\n" });
    expect(organizer.sendMessage).toHaveBeenCalledTimes(1);

    await expect(
      organizer.harness.behavior.runCli(["phase", "testing-deploy"], {
        threadId: "thr_test",
      }),
    ).resolves.toMatchObject({
      stdout: "Applied Testing / Deploy to thr_test.\n",
    });
    expect(organizer.sendMessage).toHaveBeenCalledTimes(1);
    await organizer.harness.lifecycle.dispose();
  });

  it("never sends on the plugin's own Inbox round trip", async () => {
    const organizer = createHarness();
    await plugin(organizer.bb);
    organizer.setThread({
      status: "idle",
      lastReadAt: 10,
      latestAttentionAt: 10,
    });
    const config = await saveStagePatch(organizer, "spec-review", {
      entryPrompt: "Review it.",
    });
    const sectionId = (key: string) =>
      config.stages.find((stage) => stage.key === key)!.sectionId;

    organizer.setThread({ sectionId: sectionId("spec-review") });
    organizer.emitChanged("order-changed");
    await vi.waitFor(() =>
      expect(organizer.sendMessage).toHaveBeenCalledTimes(1),
    );

    organizer.setThread({ latestAttentionAt: 20 });
    await organizer.harness.behavior.emitThreadEvent("thread.idle", {
      thread: organizer.current(),
      lastAssistantText: null,
    });
    expect(organizer.current().sectionId).toBe(sectionId("inbox"));

    organizer.setThread({ lastReadAt: 20, status: "starting" });
    await organizer.harness.behavior.emitThreadEvent("thread.active", {
      thread: organizer.current(),
    });
    expect(organizer.current().sectionId).toBe(sectionId("spec-review"));
    expect(organizer.sendMessage).toHaveBeenCalledTimes(1);
    await organizer.harness.lifecycle.dispose();
  });

  it("waits for an unread move to land once the thread is read", async () => {
    const organizer = createHarness();
    await plugin(organizer.bb);
    organizer.setThread({
      status: "idle",
      lastReadAt: 10,
      latestAttentionAt: 10,
    });
    const config = await saveStagePatch(organizer, "on-hold", {
      entryPrompt: "Parked.",
    });
    const sectionId = (key: string) =>
      config.stages.find((stage) => stage.key === key)!.sectionId;

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
    expect(organizer.sendMessage).not.toHaveBeenCalled();

    organizer.setThread({ lastReadAt: 20, status: "starting" });
    await organizer.harness.behavior.emitThreadEvent("thread.active", {
      thread: organizer.current(),
    });
    expect(organizer.current().sectionId).toBe(sectionId("on-hold"));
    expect(organizer.sendMessage).toHaveBeenCalledTimes(1);
    await organizer.harness.lifecycle.dispose();
  });

  it("retries a deferred entry prompt no more than every thirty seconds", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    try {
      const organizer = createHarness();
      await plugin(organizer.bb);
      organizer.setThread({
        status: "idle",
        lastReadAt: 10,
        latestAttentionAt: 10,
      });
      const config = await saveStagePatch(organizer, "spec-review", {
        entryPrompt: "Review it.",
      });
      const sectionId = (key: string) =>
        config.stages.find((stage) => stage.key === key)!.sectionId;
      organizer.sendMessage.mockRejectedValueOnce(
        new Error("Thread is stopping"),
      );

      organizer.setThread({ sectionId: sectionId("spec-review") });
      organizer.emitChanged("order-changed");
      await vi.waitFor(async () => {
        await expect(threadState(organizer)).resolves.toMatchObject({
          pendingEntryPrompt: expect.objectContaining({
            stageKey: "spec-review",
            attempts: 1,
            lastError: "Thread is stopping",
          }),
        });
      });
      expect(organizer.sendMessage).toHaveBeenCalledTimes(1);

      // A burst of streamed events inside the interval does not retry.
      for (let index = 0; index < 5; index += 1) {
        await organizer.harness.behavior.emitThreadEvent("thread.idle", {
          thread: organizer.current(),
          lastAssistantText: null,
        });
      }
      expect(organizer.sendMessage).toHaveBeenCalledTimes(1);
      await expect(threadState(organizer)).resolves.toMatchObject({
        pendingEntryPrompt: expect.objectContaining({ attempts: 1 }),
      });

      vi.setSystemTime(Date.now() + 31_000);
      await organizer.harness.behavior.emitThreadEvent("thread.idle", {
        thread: organizer.current(),
        lastAssistantText: null,
      });
      expect(organizer.sendMessage).toHaveBeenCalledTimes(2);
      await expect(threadState(organizer)).resolves.toMatchObject({
        pendingEntryPrompt: null,
        version: 5,
      });
      await organizer.harness.lifecycle.dispose();
    } finally {
      vi.useRealTimers();
    }
  });

  it("drops a pending entry prompt when its stage is removed", async () => {
    const organizer = createHarness();
    await plugin(organizer.bb);
    organizer.setThread({
      status: "idle",
      lastReadAt: 10,
      latestAttentionAt: 10,
    });
    const config = await saveStagePatch(organizer, "on-hold", {
      entryPrompt: "Parked.",
    });
    const sectionId = (key: string) =>
      config.stages.find((stage) => stage.key === key)!.sectionId;
    organizer.sendMessage.mockRejectedValue(new Error("Thread is stopping"));

    organizer.setThread({ sectionId: sectionId("on-hold") });
    organizer.emitChanged("order-changed");
    await vi.waitFor(async () => {
      await expect(threadState(organizer)).resolves.toMatchObject({
        pendingEntryPrompt: expect.objectContaining({ stageKey: "on-hold" }),
      });
    });

    const edited = editableWorkflowConfig(await configFor(organizer));
    edited.stages = edited.stages.filter((stage) => stage.key !== "on-hold");
    await organizer.harness.behavior.callRpc("saveConfig", edited);
    await expect(threadState(organizer)).resolves.toMatchObject({
      rememberedStageKey: "planning",
      lastLandedStageKey: "planning",
      pendingEntryPrompt: null,
    });
    await organizer.harness.lifecycle.dispose();
  });

  it("migrates version 5 state without firing a prompt", async () => {
    const organizer = createHarness();
    await organizer.bb.storage.kv.set("thread:v3:thr_test", {
      version: 5,
      rememberedStageKey: "spec-review",
    });
    await plugin(organizer.bb);
    await saveStagePatch(organizer, "spec-review", {
      entryPrompt: "Review it.",
    });
    const config = await configFor(organizer);
    expect(organizer.current().sectionId).toBe(
      config.stages.find((stage) => stage.key === "spec-review")!.sectionId,
    );
    expect(organizer.sendMessage).not.toHaveBeenCalled();
    await expect(threadState(organizer)).resolves.toMatchObject({
      version: 5,
      rememberedStageKey: "spec-review",
      lastLandedStageKey: "spec-review",
      pendingEntryPrompt: null,
      recentEntryPrompts: [],
    });
    await organizer.harness.lifecycle.dispose();
  });

  it("records landings without firing when a config save adopts an occupied section", async () => {
    const organizer = createHarness();
    await plugin(organizer.bb);
    const adopted = await organizer.create({ name: "Review" });
    organizer.setThread({
      status: "idle",
      lastReadAt: 10,
      latestAttentionAt: 10,
      sectionId: adopted.id,
    });

    const edited = editableWorkflowConfig(await configFor(organizer));
    edited.stages.push({
      key: "review",
      role: "stage",
      title: "Review",
      rule: "A PR is ready for its review.",
      entryPrompt: "Review it.",
    });
    const saved = (await organizer.harness.behavior.callRpc(
      "saveConfig",
      edited,
    )) as WorkflowConfig;
    expect(saved.stages.find((stage) => stage.key === "review")?.sectionId).toBe(
      adopted.id,
    );
    expect(organizer.sendMessage).not.toHaveBeenCalled();
    await expect(threadState(organizer)).resolves.toMatchObject({
      rememberedStageKey: "review",
      lastLandedStageKey: "review",
      pendingEntryPrompt: null,
    });
    await organizer.harness.lifecycle.dispose();
  });

  it("keeps an opted-out agent landing silent but fires when the user moves the thread back in", async () => {
    const organizer = createHarness();
    await plugin(organizer.bb);
    organizer.setThread({
      status: "active",
      lastReadAt: 10,
      latestAttentionAt: 10,
    });
    const config = await saveStagePatch(organizer, "handoff", {
      entryPrompt: "Package the handoff.",
      entryPromptOnAgentMove: false,
    });
    const sectionId = (key: string) =>
      config.stages.find((stage) => stage.key === key)!.sectionId;

    await organizer.harness.behavior.runCli(["phase", "handoff"], {
      threadId: "thr_test",
    });
    expect(organizer.sendMessage).not.toHaveBeenCalled();
    await expect(threadState(organizer)).resolves.toMatchObject({
      suppressedEntryStageKey: "handoff",
      lastLandedStageKey: "handoff",
    });

    organizer.setThread({ status: "idle", latestAttentionAt: 20 });
    await organizer.harness.behavior.emitThreadEvent("thread.idle", {
      thread: organizer.current(),
      lastAssistantText: null,
    });
    expect(organizer.current().sectionId).toBe(sectionId("inbox"));

    organizer.setThread({ lastReadAt: 20, sectionId: sectionId("handoff") });
    organizer.emitChanged("order-changed");
    await vi.waitFor(() =>
      expect(organizer.sendMessage).toHaveBeenCalledTimes(1),
    );
    await expect(threadState(organizer)).resolves.toMatchObject({
      suppressedEntryStageKey: null,
      pendingEntryPrompt: null,
    });
    await organizer.harness.lifecycle.dispose();
  });

  it("retracts a queued entry prompt when the thread moves on before it dispatches", async () => {
    const organizer = createHarness();
    await plugin(organizer.bb);
    organizer.setThread({
      status: "active",
      lastReadAt: 10,
      latestAttentionAt: 10,
    });
    const config = await saveStagePatch(organizer, "handoff", {
      entryPrompt: "Package the handoff.",
    });
    const sectionId = (key: string) =>
      config.stages.find((stage) => stage.key === key)!.sectionId;
    organizer.sendMessage.mockResolvedValueOnce({
      ok: true,
      delivery: "queued",
      queuedMessage: { id: "qmsg_1" },
    } as never);

    await expect(
      organizer.harness.behavior.runCli(["phase", "handoff"], {
        threadId: "thr_test",
      }),
    ).resolves.toMatchObject({
      stdout:
        "Applied Handoff to thr_test. Queued its entry prompt for after this turn.\n",
    });
    await expect(threadState(organizer)).resolves.toMatchObject({
      queuedEntryPrompt: { queuedMessageId: "qmsg_1", stageKey: "handoff" },
    });

    organizer.setThread({ sectionId: sectionId("on-hold") });
    organizer.emitChanged("order-changed");
    await vi.waitFor(() =>
      expect(organizer.deleteQueuedMessage).toHaveBeenCalledWith({
        threadId: "thr_test",
        queuedMessageId: "qmsg_1",
      }),
    );
    await expect(threadState(organizer)).resolves.toMatchObject({
      queuedEntryPrompt: null,
      lastLandedStageKey: "on-hold",
    });
    expect(organizer.sendMessage).toHaveBeenCalledTimes(1);
    await organizer.harness.lifecycle.dispose();
  });

  it("honors the opt-out when an agent move lands only after the thread is read", async () => {
    const organizer = createHarness();
    await plugin(organizer.bb);
    organizer.setThread({
      status: "idle",
      lastReadAt: 10,
      latestAttentionAt: 10,
    });
    const config = await saveStagePatch(organizer, "testing-deploy", {
      entryPrompt: "Run the release checks.",
      entryPromptOnAgentMove: false,
    });
    const sectionId = (key: string) =>
      config.stages.find((stage) => stage.key === key)!.sectionId;

    organizer.setThread({ latestAttentionAt: 20 });
    await organizer.harness.behavior.runCli(["phase", "testing-deploy"], {
      threadId: "thr_test",
    });
    expect(organizer.current().sectionId).toBe(sectionId("inbox"));
    await expect(threadState(organizer)).resolves.toMatchObject({
      deferredAgentMoveStageKey: "testing-deploy",
    });

    organizer.setThread({ lastReadAt: 20, status: "starting" });
    await organizer.harness.behavior.emitThreadEvent("thread.active", {
      thread: organizer.current(),
    });
    expect(organizer.current().sectionId).toBe(sectionId("testing-deploy"));
    expect(organizer.sendMessage).not.toHaveBeenCalled();
    await expect(threadState(organizer)).resolves.toMatchObject({
      deferredAgentMoveStageKey: null,
      suppressedEntryStageKey: "testing-deploy",
    });
    await organizer.harness.lifecycle.dispose();
  });

  it("drops a pending prompt when an unread thread is re-targeted before it lands", async () => {
    const organizer = createHarness();
    await plugin(organizer.bb);
    organizer.setThread({
      status: "idle",
      lastReadAt: 10,
      latestAttentionAt: 10,
    });
    const config = await saveStagePatch(organizer, "on-hold", {
      entryPrompt: "Parked.",
    });
    const sectionId = (key: string) =>
      config.stages.find((stage) => stage.key === key)!.sectionId;
    organizer.sendMessage.mockRejectedValue(new Error("Thread is stopping"));

    organizer.setThread({ sectionId: sectionId("on-hold") });
    organizer.emitChanged("order-changed");
    await vi.waitFor(async () => {
      await expect(threadState(organizer)).resolves.toMatchObject({
        pendingEntryPrompt: expect.objectContaining({ stageKey: "on-hold" }),
      });
    });

    organizer.setThread({ latestAttentionAt: 20 });
    await organizer.harness.behavior.emitThreadEvent("thread.idle", {
      thread: organizer.current(),
      lastAssistantText: null,
    });
    expect(organizer.current().sectionId).toBe(sectionId("inbox"));

    organizer.setThread({ sectionId: sectionId("building") });
    organizer.emitChanged("order-changed");
    await vi.waitFor(async () => {
      await expect(threadState(organizer)).resolves.toMatchObject({
        rememberedStageKey: "building",
        pendingEntryPrompt: null,
      });
    });
    expect(organizer.sendMessage).toHaveBeenCalledTimes(1);
    await organizer.harness.lifecycle.dispose();
  });
});
