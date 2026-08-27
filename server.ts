import { defineRpcContract, type BbPluginApi } from "@get-bb/plugin-sdk";
import { z } from "zod";

import {
  DEFAULT_WORKFLOW_CONFIG,
  INBOX_RULE,
  SECTION_ICON_OPTIONS,
  WORKFLOW_CONFIG_VERSION,
  buildWorkflowSkillSlot,
  cloneWorkflowConfig,
  editableWorkflowConfig,
  firstWorkflowStage,
  inboxStage,
  isManageableThread,
  isUnreadThread,
  legacySectionNames,
  localSectionName,
  mergeEditableWorkflowConfig,
  parseWorkflowConfig,
  placementForThread,
  stageForSectionId,
  type EditableWorkflowConfig,
  type OrganizableThread,
  type WorkflowConfig,
  type WorkflowStage,
} from "./core.js";

const CONFIG_KEY = "workflow-config:v1";
const PENDING_CONFIG_OPERATION_KEY = "workflow-config-operation:v1";
const THREAD_STATE_PREFIX = "thread:v3:";
const LEGACY_THREAD_STATE_PREFIX = "thread:v1:";
const THREAD_LIST_PAGE_SIZE = 100;

const editableStageSchema = z
  .object({
    icon: z.enum(SECTION_ICON_OPTIONS),
    key: z.string().min(1).max(40),
    role: z.enum(["inbox", "stage"]),
    rule: z.string().min(1).max(240),
    title: z.string().min(1).max(80),
  })
  .strict();

const editableWorkflowConfigSchema = z
  .object({
    version: z.literal(WORKFLOW_CONFIG_VERSION),
    stages: z.array(editableStageSchema).min(2).max(12),
  })
  .strict();

const workflowConfigSchema = editableWorkflowConfigSchema.extend({
  stages: z.array(
    editableStageSchema.extend({ sectionId: z.string().min(1).nullable() }),
  ),
});

const pendingConfigOperationSchema = z
  .object({
    version: z.literal(1),
    nextConfig: workflowConfigSchema,
    removedStages: z.array(
      z
        .object({
          key: z.string().min(1),
          sectionId: z.string().min(1).nullable(),
        })
        .strict(),
    ),
  })
  .strict();

export const rpcContract = defineRpcContract({
  getConfig: {
    input: z.object({}).strict(),
    output: workflowConfigSchema,
  },
  saveConfig: {
    input: editableWorkflowConfigSchema,
    output: workflowConfigSchema,
  },
});

type Thread = OrganizableThread & {
  id: string;
};
type Section = Awaited<
  ReturnType<BbPluginApi["sdk"]["threadSections"]["list"]>
>[number];

interface ThreadWorkflowState {
  rememberedStageKey: string;
  version: 5;
}

type PendingConfigOperation = z.infer<typeof pendingConfigOperationSchema>;

function threadStateKey(threadId: string): string {
  return `${THREAD_STATE_PREFIX}${threadId}`;
}

function legacyThreadStateKey(threadId: string): string {
  return `${LEGACY_THREAD_STATE_PREFIX}${threadId}`;
}

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function sectionMatchesName(section: Section, name: string): boolean {
  return (
    section.name.normalize("NFKC").trim().toLocaleLowerCase() ===
    name.normalize("NFKC").trim().toLocaleLowerCase()
  );
}

export default async function plugin(bb: BbPluginApi): Promise<void> {
  let configSnapshot = cloneWorkflowConfig(DEFAULT_WORKFLOW_CONFIG);
  let disposed = false;
  const reconciliationController = new AbortController();
  const queues = new Map<string, Promise<void>>();
  let configQueue: Promise<void> = Promise.resolve();
  let startupReconciliation: Promise<void> = Promise.resolve();

  function enqueue(threadId: string, work: () => Promise<void>): Promise<void> {
    const previous = queues.get(threadId) ?? Promise.resolve();
    const operation = previous
      .catch(() => undefined)
      .then(async () => {
        if (!disposed) await work();
      });
    let tail: Promise<void>;
    tail = operation
      .catch((error: unknown) => {
        bb.log.error(
          `thread=${threadId} action=reconcile-failed error=${describeError(error)}`,
        );
      })
      .finally(() => {
        if (queues.get(threadId) === tail) queues.delete(threadId);
      });
    queues.set(threadId, tail);
    return operation;
  }

  function schedule(
    threadId: string,
    work: () => Promise<void>,
  ): Promise<void> {
    return enqueue(threadId, work).catch(() => undefined);
  }

  async function ensureWorkflowSections(
    input: WorkflowConfig,
  ): Promise<WorkflowConfig> {
    const config = cloneWorkflowConfig(input);
    let listed = await bb.sdk.threadSections.list();
    const claimed = new Set<string>();

    for (const stage of config.stages) {
      const displayName = localSectionName(stage);
      let section =
        (stage.sectionId
          ? listed.find((candidate) => candidate.id === stage.sectionId)
          : undefined) ??
        listed.find(
          (candidate) =>
            !claimed.has(candidate.id) &&
            [displayName, ...legacySectionNames(stage)].some((name) =>
              sectionMatchesName(candidate, name),
            ),
        );

      if (!section) {
        try {
          const created = await bb.sdk.threadSections.create({
            name: displayName,
          });
          section = created;
          listed = [...listed, section];
          bb.log.info(
            `action=workflow-section-created stage=${stage.key} section=${section.id}`,
          );
        } catch (error) {
          listed = await bb.sdk.threadSections.list();
          section = listed.find((candidate) =>
            sectionMatchesName(candidate, displayName),
          );
          if (!section) throw error;
        }
      }

      claimed.add(section.id);
      stage.sectionId = section.id;
      if (section.name !== displayName) {
        await bb.sdk.threadSections.update({
          id: section.id,
          name: displayName,
        });
      }
    }
    return config;
  }

  async function loadConfig(): Promise<void> {
    const pendingResult = pendingConfigOperationSchema.safeParse(
      await bb.storage.kv.get<unknown>(PENDING_CONFIG_OPERATION_KEY),
    );
    const pending = pendingResult.success ? pendingResult.data : null;
    const stored = parseWorkflowConfig(
      await bb.storage.kv.get<unknown>(CONFIG_KEY),
    );
    configSnapshot = await ensureWorkflowSections(
      pending?.nextConfig ??
        stored ??
        cloneWorkflowConfig(DEFAULT_WORKFLOW_CONFIG),
    );
    await bb.storage.kv.set(CONFIG_KEY, configSnapshot);
    if (pending !== null) {
      const resumable = {
        ...pending,
        nextConfig: cloneWorkflowConfig(configSnapshot),
      } satisfies PendingConfigOperation;
      await bb.storage.kv.set(PENDING_CONFIG_OPERATION_KEY, resumable);
      await finishConfigOperation(resumable);
    }
    bb.realtime.publish("workflow-config-changed", {
      version: configSnapshot.version,
    });
    bb.log.info(
      `Thread Organizer loaded stages=${configSnapshot.stages.length}`,
    );
  }

  function initialRememberedStage(thread: Thread): WorkflowStage {
    const current = stageForSectionId(configSnapshot, thread.sectionId);
    return current?.role === "stage"
      ? current
      : firstWorkflowStage(configSnapshot);
  }

  async function readThreadState(thread: Thread): Promise<ThreadWorkflowState> {
    const stored = await bb.storage.kv.get<unknown>(threadStateKey(thread.id));
    if (stored && typeof stored === "object") {
      const value = stored as {
        rememberedStageKey?: unknown;
        version?: unknown;
      };
      const remembered = configSnapshot.stages.find(
        (stage) =>
          stage.key === value.rememberedStageKey && stage.role === "stage",
      );
      if (
        (value.version === 3 || value.version === 4 || value.version === 5) &&
        remembered
      ) {
        return {
          version: 5,
          rememberedStageKey: remembered.key,
        };
      }
    }

    const legacy = await bb.storage.kv.get<unknown>(
      legacyThreadStateKey(thread.id),
    );
    let remembered = initialRememberedStage(thread);
    if (legacy && typeof legacy === "object") {
      const lastAppliedSectionId = (
        legacy as { lastAppliedSectionId?: unknown }
      ).lastAppliedSectionId;
      if (typeof lastAppliedSectionId === "string") {
        const legacyStage = stageForSectionId(
          configSnapshot,
          lastAppliedSectionId,
        );
        if (legacyStage?.role === "stage") remembered = legacyStage;
      }
    }
    const migrated: ThreadWorkflowState = {
      version: 5,
      rememberedStageKey: remembered.key,
    };
    await bb.storage.kv.set(threadStateKey(thread.id), migrated);
    if (legacy !== undefined) {
      await bb.storage.kv.delete(legacyThreadStateKey(thread.id));
    }
    return migrated;
  }

  async function saveThreadState(
    threadId: string,
    state: ThreadWorkflowState,
  ): Promise<void> {
    await bb.storage.kv.set(threadStateKey(threadId), state);
  }

  async function reconcileThread(
    threadId: string,
    explicitStageKey?: string,
  ): Promise<void> {
    const thread = await bb.sdk.threads.get({ threadId });
    if (!isManageableThread(thread)) return;
    const state = await readThreadState(thread);
    const currentStage = stageForSectionId(configSnapshot, thread.sectionId);

    if (explicitStageKey) {
      state.rememberedStageKey = explicitStageKey;
    } else if (currentStage?.role === "stage") {
      state.rememberedStageKey = currentStage.key;
    }

    if (
      !configSnapshot.stages.some(
        (stage) =>
          stage.key === state.rememberedStageKey && stage.role === "stage",
      )
    ) {
      state.rememberedStageKey = firstWorkflowStage(configSnapshot).key;
    }

    const destination = placementForThread(
      configSnapshot,
      thread,
      state.rememberedStageKey,
      explicitStageKey !== undefined,
    );
    if (!destination.sectionId) {
      throw new Error(`Stage ${destination.key} has no native section.`);
    }
    if (thread.sectionId !== destination.sectionId) {
      await bb.sdk.threads.update({
        threadId,
        sectionId: destination.sectionId,
      });
      bb.log.info(
        `thread=${threadId} action=section-updated stage=${destination.key}`,
      );
    }
    await saveThreadState(threadId, state);
  }

  async function listManageableThreadIds(
    signal?: AbortSignal,
  ): Promise<string[]> {
    const result: string[] = [];
    let offset = 0;
    while (!signal?.aborted) {
      const page = await bb.sdk.threads.list({
        archived: false,
        hasParent: false,
        limit: THREAD_LIST_PAGE_SIZE,
        offset,
        ...(signal ? { signal } : {}),
      });
      result.push(
        ...page.filter(isManageableThread).map((thread) => thread.id),
      );
      if (page.length < THREAD_LIST_PAGE_SIZE) break;
      offset += THREAD_LIST_PAGE_SIZE;
    }
    return result;
  }

  async function reconcileExisting(signal?: AbortSignal): Promise<void> {
    for (const threadId of await listManageableThreadIds(signal)) {
      if (signal?.aborted) return;
      await schedule(threadId, () => reconcileThread(threadId));
    }
  }

  async function finishConfigOperation(
    operation: PendingConfigOperation,
  ): Promise<void> {
    configSnapshot = cloneWorkflowConfig(operation.nextConfig);
    await bb.storage.kv.set(CONFIG_KEY, configSnapshot);
    const removedKeys = new Set(
      operation.removedStages.map((stage) => stage.key),
    );

    for (const threadId of await listManageableThreadIds()) {
      await enqueue(threadId, async () => {
        const thread = await bb.sdk.threads.get({
          threadId,
        });
        if (!isManageableThread(thread)) return;
        const state = await readThreadState(thread);
        if (removedKeys.has(state.rememberedStageKey)) {
          state.rememberedStageKey = firstWorkflowStage(configSnapshot).key;
          await saveThreadState(thread.id, state);
        }
        await reconcileThread(thread.id);
      });
    }

    const existingSectionIds = new Set(
      (await bb.sdk.threadSections.list()).map((section) => section.id),
    );
    for (const stage of operation.removedStages) {
      if (!stage.sectionId || !existingSectionIds.has(stage.sectionId)) {
        continue;
      }
      await bb.sdk.threadSections.delete({ id: stage.sectionId });
      existingSectionIds.delete(stage.sectionId);
    }
    await bb.storage.kv.delete(PENDING_CONFIG_OPERATION_KEY);
  }

  async function resumePendingConfigOperation(): Promise<void> {
    const parsed = pendingConfigOperationSchema.safeParse(
      await bb.storage.kv.get<unknown>(PENDING_CONFIG_OPERATION_KEY),
    );
    if (parsed.success) await finishConfigOperation(parsed.data);
  }

  async function saveConfig(
    edited: EditableWorkflowConfig,
  ): Promise<WorkflowConfig> {
    let result = configSnapshot;
    const operation = configQueue
      .catch(() => undefined)
      .then(async () => {
        await resumePendingConfigOperation();
        const previous = configSnapshot;
        const next = await ensureWorkflowSections(
          mergeEditableWorkflowConfig(previous, edited),
        );
        const nextKeys = new Set(next.stages.map((stage) => stage.key));
        const nextSectionIds = new Set(
          next.stages.flatMap((stage) =>
            stage.sectionId === null ? [] : [stage.sectionId],
          ),
        );
        const removed = previous.stages.filter(
          (stage) =>
            stage.role === "stage" &&
            !nextKeys.has(stage.key) &&
            (stage.sectionId === null || !nextSectionIds.has(stage.sectionId)),
        );

        const pending = {
          version: 1,
          nextConfig: cloneWorkflowConfig(next),
          removedStages: removed.map(({ key, sectionId }) => ({
            key,
            sectionId,
          })),
        } satisfies PendingConfigOperation;
        await bb.storage.kv.set(PENDING_CONFIG_OPERATION_KEY, pending);
        await finishConfigOperation(pending);

        bb.realtime.publish("workflow-config-changed", {
          version: configSnapshot.version,
        });
        result = cloneWorkflowConfig(configSnapshot);
      });
    configQueue = operation;
    await operation;
    return result;
  }

  try {
    await loadConfig();
  } catch (error) {
    bb.log.error(`action=workflow-load-failed error=${describeError(error)}`);
    throw error;
  }

  bb.rpc.register(rpcContract, {
    getConfig() {
      return cloneWorkflowConfig(configSnapshot);
    },
    saveConfig,
  });

  bb.cli.register({
    name: "organizer",
    summary: "Move the current thread to a workflow stage",
    commands: [
      {
        name: "phase",
        summary: "Apply a workflow stage",
        usage: "bb organizer phase <stage-key>",
      },
    ],
    async run(argv, context) {
      if (argv[0] !== "phase" || !argv[1]) {
        return {
          exitCode: 2,
          stderr: "Usage: bb organizer phase <stage-key>\n",
        };
      }
      if (!context.threadId) {
        return {
          exitCode: 2,
          stderr: "Run inside a bb thread so BB_THREAD_ID is available.\n",
        };
      }
      const key = argv[1].trim().toLocaleLowerCase();
      const stage = configSnapshot.stages.find(
        (candidate) => candidate.key === key,
      );
      if (!stage || stage.role === "inbox") {
        const available = configSnapshot.stages
          .filter((candidate) => candidate.role === "stage")
          .map((candidate) => candidate.key)
          .join(", ");
        return {
          exitCode: 2,
          stderr: `Unknown or system-managed stage: ${argv[1]}\nAvailable: ${available}\n`,
        };
      }
      const thread = await bb.sdk.threads.get({
        threadId: context.threadId,
      });
      if (!isManageableThread(thread)) {
        return { exitCode: 2, stderr: "This thread cannot be organized.\n" };
      }
      try {
        await enqueue(thread.id, () => reconcileThread(thread.id, stage.key));
      } catch (error) {
        return {
          exitCode: 1,
          stderr: `Could not set the workflow stage: ${describeError(error)}\n`,
        };
      }
      return {
        exitCode: 0,
        stdout: `Applied ${stage.title} to ${thread.id}.\n`,
      };
    },
  });

  bb.agents.configure(({ thread, origin }) => {
    if (
      thread.parentThreadId !== null ||
      thread.sourceThreadId !== null ||
      origin.kind !== null ||
      origin.pluginId === bb.pluginId
    ) {
      return { tools: [], skills: [] };
    }
    return {
      tools: [],
      skills: ["thread-phase-organizer"],
      instructions: [
        "Thread Organizer’s current workflow for this session, generated from the user’s plugin settings:",
        "",
        buildWorkflowSkillSlot(configSnapshot),
      ].join("\n"),
    };
  });

  for (const event of [
    "thread.created",
    "thread.active",
    "thread.idle",
    "thread.failed",
  ] as const) {
    bb.events.on(event, ({ thread }) =>
      schedule(thread.id, () => reconcileThread(thread.id)),
    );
  }
  for (const event of ["thread.archived", "thread.deleted"] as const) {
    bb.events.on(event, ({ thread }) =>
      schedule(thread.id, async () => {
        await bb.storage.kv.delete(threadStateKey(thread.id));
        await bb.storage.kv.delete(legacyThreadStateKey(thread.id));
      }),
    );
  }

  const unsubscribe = bb.sdk.subscribe({
    event: "thread:changed",
    callback(event) {
      if (!event.id) return;
      const threadId = event.id;
      const readStateChanged = event.changes.includes("read-state-changed");
      void schedule(threadId, async () => {
        if (readStateChanged) {
          const thread = await bb.sdk.threads.get({ threadId });
          if (!isUnreadThread(thread)) return;
        }
        await reconcileThread(threadId);
      });
    },
  });

  bb.onDispose(async () => {
    disposed = true;
    reconciliationController.abort();
    unsubscribe();
    await Promise.allSettled([
      startupReconciliation,
      ...queues.values(),
      configQueue,
    ]);
  });

  startupReconciliation = reconcileExisting(
    reconciliationController.signal,
  ).catch((error: unknown) => {
    if (!reconciliationController.signal.aborted) {
      bb.log.error(
        `action=workflow-reconciliation-failed error=${describeError(error)}`,
      );
    }
  });
  await startupReconciliation;
}

export { editableWorkflowConfig, INBOX_RULE };
