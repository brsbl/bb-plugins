import { defineRpcContract, type BbPluginApi } from "@get-bb/plugin-sdk";
import { z } from "zod";

import {
  DEFAULT_STAGE_RULE,
  DEFAULT_WORKFLOW_CONFIG,
  ENTRY_PROMPT_MAX_LENGTH,
  MAX_WORKFLOW_STAGES,
  INBOX_RULE,
  WORKFLOW_CONFIG_VERSION,
  buildWorkflowSkillSlot,
  cloneWorkflowConfig,
  createStageKey,
  editableWorkflowConfig,
  entryPromptMessage,
  hasEntryPrompt,
  isManageableThread,
  isRunningThread,
  isUnreadThread,
  localSectionName,
  mergeEditableWorkflowConfig,
  normalizeEditableWorkflowConfig,
  parseWorkflowConfig,
  placementForThread,
  RETURNING_INBOX_DESCRIPTION,
  returnsAfterRead,
  stageForSectionId,
  syncStagesWithSections,
  type EditableWorkflowConfig,
  type EditableWorkflowStage,
  type OrganizableThread,
  WORKFLOW_CHANGE_INTERACTION_ID,
  WORKFLOW_CHANGED_ELSEWHERE_MESSAGE,
  type WorkflowConfig,
  type WorkflowStage,
} from "./core.js";
import {
  THREAD_LIST_PLUGIN_ID,
  readSidebarSectionOrder,
  syncSidebarOrder,
  type ThreadListRpc,
} from "./sidebar-order.js";

/**
 * bb notifies section list changes (create, rename, delete) as a
 * `threads-changed` update on the Personal project; the plugin syncs its
 * stages from bb on that signal.
 */
const PERSONAL_PROJECT_ID = "proj_personal";

const CONFIG_KEY = "workflow-config:v1";
/** The last config that parsed, served if the stored one ever fails to. */
const LAST_GOOD_CONFIG_KEY = "workflow-config:last-good:v1";
/** Sections of stages removed in settings whose delete has not gone through. */
const PENDING_DELETES_KEY = "section-deletes:v1";
/** The main Inbox as it was when its section was deleted in bb. */
const DELETED_INBOX_KEY = "deleted-inbox:v1";
/** Written by 0.1.17 and earlier; its removals become pending deletes. */
const LEGACY_PENDING_OPERATION_KEY = "workflow-config-operation:v1";
const THREAD_STATE_PREFIX = "thread:v3:";
const LEGACY_THREAD_STATE_PREFIX = "thread:v1:";
const THREAD_LIST_PAGE_SIZE = 100;
// Entry prompts retry on later reconciles while a thread cannot be written to,
// spaced out so a burst of streamed events cannot burn the budget, then expire;
// the window caps how often one thread can be prompted.
const ENTRY_PROMPT_RETRY_INTERVAL_MS = 30 * 1000;
const ENTRY_PROMPT_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const ENTRY_PROMPT_SAME_STAGE_COOLDOWN_MS = 10 * 60 * 1000;
const ENTRY_PROMPT_WINDOW_MS = 30 * 60 * 1000;
const ENTRY_PROMPT_MAX_PER_WINDOW = 3;
const ENTRY_PROMPT_HISTORY = 6;

const editableStageSchema = z
  .object({
    // Accepted and discarded so configs and clients written before
    // section icons were removed keep validating.
    icon: z.unknown().optional(),
    entryPrompt: z.string().max(ENTRY_PROMPT_MAX_LENGTH).optional(),
    catchesPluginId: z.string().max(128).optional(),
    returnAfterRead: z.boolean().optional(),
    // Accepted and discarded: written by the first entry-prompt build.
    entryPromptDelivery: z.unknown().optional(),
    entryPromptOnAgentMove: z.unknown().optional(),
    key: z.string().min(1).max(40),
    role: z.enum(["inbox", "stage"]),
    rule: z.string().min(1).max(240),
    title: z.string().min(1),
  })
  .strict();

const editableWorkflowConfigSchema = z
  .object({
    version: z.literal(WORKFLOW_CONFIG_VERSION),
    stages: z.array(editableStageSchema).max(MAX_WORKFLOW_STAGES),
  })
  .strict();

const workflowConfigSchema = editableWorkflowConfigSchema.extend({
  revision: z.number().int().nonnegative().optional(),
  stages: z.array(
    editableStageSchema.extend({ sectionId: z.string().min(1).nullable() }),
  ),
});

/** A save must name the revision it was based on so stale editors are refused. */
const saveConfigInputSchema = editableWorkflowConfigSchema.extend({
  baseRevision: z.number().int().nonnegative(),
});

const legacyPendingOperationSchema = z.object({
  removedStages: z.array(z.object({ sectionId: z.string().min(1).nullable() })),
});

export const rpcContract = defineRpcContract({
  getConfig: {
    input: z.object({}).strict(),
    output: workflowConfigSchema,
  },
  saveConfig: {
    input: saveConfigInputSchema,
    output: workflowConfigSchema,
  },
  /** Takes bb's sections as they are now; the sidebar calls it after a drag. */
  syncFromBb: {
    input: z.object({}).strict(),
    output: workflowConfigSchema,
  },
  /** Plugins that created at least one open root thread, so they can fill an inbox. */
  listThreadSourcePlugins: {
    input: z.object({}).strict(),
    output: z.array(z.string()),
  },
});

type Thread = OrganizableThread & {
  id: string;
};
type Section = Awaited<
  ReturnType<BbPluginApi["sdk"]["threadSections"]["list"]>
>[number];

interface PendingEntryPrompt {
  attempts: number;
  enteredAt: number;
  lastAttemptAt?: number;
  lastError?: string;
  stageKey: string;
}

interface QueuedEntryPrompt {
  queuedMessageId: string;
  stageKey: string;
}

interface EntryPromptRecord {
  sentAt: number;
  stageKey: string;
}

interface ThreadWorkflowState {
  /** Tracks automatic inbox placement so later user moves can dismiss its claim. */
  claimedInboxKey?: string;
  dismissedInboxPluginId?: string;
  /** The last workflow stage the thread landed in; Inbox never counts. */
  lastLandedStageKey: string | null;
  pendingEntryPrompt: PendingEntryPrompt | null;
  /** A prompt the host queued rather than started; retracted if the thread moves on. */
  queuedEntryPrompt: QueuedEntryPrompt | null;
  recentEntryPrompts: EntryPromptRecord[];
  rememberedStageKey: string | null;
  version: 5;
}

interface ReconcileOptions {
  reconcileParent?: boolean;
  explicitStageKey?: string;
  /** Let an inbox set to return read threads release this one if it is idle and read. */
  releaseRead?: boolean;
  /** Record where the thread sits without treating it as an entry. */
  seedLanding?: boolean;
}

type ThreadRecord = Awaited<ReturnType<BbPluginApi["sdk"]["threads"]["get"]>>;
type EntryPromptOutcome = "sent" | "queued" | "deferred" | "dropped" | null;

function threadStateKey(threadId: string): string {
  return `${THREAD_STATE_PREFIX}${threadId}`;
}

function legacyThreadStateKey(threadId: string): string {
  return `${LEGACY_THREAD_STATE_PREFIX}${threadId}`;
}

/** A CLI argument or configuration problem: reported with exit code 2. */
class CliInputError extends Error {}

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function parseStageKeyOrNull(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function parsePendingEntryPrompt(value: unknown): PendingEntryPrompt | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<PendingEntryPrompt>;
  if (
    typeof candidate.stageKey !== "string" ||
    typeof candidate.enteredAt !== "number"
  ) {
    return null;
  }
  return {
    attempts: typeof candidate.attempts === "number" ? candidate.attempts : 0,
    enteredAt: candidate.enteredAt,
    stageKey: candidate.stageKey,
    ...(typeof candidate.lastAttemptAt === "number"
      ? { lastAttemptAt: candidate.lastAttemptAt }
      : {}),
    ...(typeof candidate.lastError === "string"
      ? { lastError: candidate.lastError }
      : {}),
  };
}

function parseQueuedEntryPrompt(value: unknown): QueuedEntryPrompt | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<QueuedEntryPrompt>;
  return typeof candidate.queuedMessageId === "string" &&
    typeof candidate.stageKey === "string"
    ? { queuedMessageId: candidate.queuedMessageId, stageKey: candidate.stageKey }
    : null;
}

function entryPromptNote(outcome: EntryPromptOutcome): string {
  switch (outcome) {
    case "sent":
      return " Sent its entry prompt.";
    case "queued":
      return " Queued its entry prompt for after this turn.";
    case "deferred":
      return " Its entry prompt will be retried.";
    case "dropped":
      return " Its entry prompt was not sent; see the plugin log.";
    default:
      return "";
  }
}

function queuedMessageIdFrom(result: unknown): string | null {
  // Newer hosts report where the message went; the pinned SDK only types { ok }.
  if (!result || typeof result !== "object") return null;
  const response = result as { delivery?: unknown; queuedMessage?: unknown };
  if (
    response.delivery !== "queued" ||
    !response.queuedMessage ||
    typeof response.queuedMessage !== "object"
  ) {
    return null;
  }
  const id = (response.queuedMessage as { id?: unknown }).id;
  return typeof id === "string" ? id : null;
}

function parseEntryPromptRecords(value: unknown): EntryPromptRecord[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const candidate = entry as Partial<EntryPromptRecord>;
    return typeof candidate.stageKey === "string" &&
      typeof candidate.sentAt === "number"
      ? [{ sentAt: candidate.sentAt, stageKey: candidate.stageKey }]
      : [];
  });
}

function isSectionNotFound(error: unknown): boolean {
  return /section[ _]not[ _]found/iu.test(describeError(error));
}

function stringList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string")
    : [];
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

  const threadListRpc: ThreadListRpc = (method, input) =>
    bb.sdk.plugins.callRpc({
      pluginId: THREAD_LIST_PLUGIN_ID,
      method,
      input,
      outputSchema: z.unknown(),
    });

  async function persistConfig(): Promise<void> {
    await bb.storage.kv.set(CONFIG_KEY, configSnapshot);
    await bb.storage.kv.set(LAST_GOOD_CONFIG_KEY, configSnapshot);
  }

  function publishConfig(): void {
    bb.realtime.publish("workflow-config-changed", {
      version: configSnapshot.version,
      revision: configSnapshot.revision ?? 0,
    });
  }

  /**
   * Gives each stage without a section one, created in bb. Only stages that
   * never had a section get here: new ones from settings or the CLI, and the
   * defaults on a fresh install. A stage whose section was deleted is dropped
   * by the sync instead, so nothing is ever rebuilt.
   */
  async function createMissingSections(config: WorkflowConfig): Promise<boolean> {
    let created = false;
    for (const stage of config.stages) {
      if (stage.sectionId !== null) continue;
      const name = localSectionName(stage);
      const section = await bb.sdk.threadSections.create({ name });
      stage.sectionId = section.id;
      created = true;
      bb.log.info(
        `action=workflow-section-created stage=${stage.key} section=${section.id}`,
      );
    }
    return created;
  }

  /** Deletes the sections of removed stages, keeping any that still fail. */
  async function runPendingDeletes(existing: ReadonlySet<string>): Promise<Set<string>> {
    const pending = stringList(await bb.storage.kv.get<unknown>(PENDING_DELETES_KEY));
    const deleted = new Set<string>();
    const remaining: string[] = [];
    for (const sectionId of pending) {
      if (!existing.has(sectionId)) continue;
      try {
        await bb.sdk.threadSections.delete({ id: sectionId });
        deleted.add(sectionId);
        bb.log.info(`action=section-deleted section=${sectionId}`);
      } catch (error) {
        if (isSectionNotFound(error)) {
          deleted.add(sectionId);
          continue;
        }
        remaining.push(sectionId);
        bb.log.warn(
          `action=section-delete-failed section=${sectionId} error=${describeError(error)}`,
        );
      }
    }
    if (remaining.length !== pending.length) {
      await bb.storage.kv.set(PENDING_DELETES_KEY, remaining);
    }
    return new Set([...deleted, ...remaining]);
  }

  async function writeSidebarOrder(config: WorkflowConfig): Promise<void> {
    try {
      const sections = await bb.sdk.threadSections.list();
      await syncSidebarOrder(
        config,
        sections.map((section) => section.id),
        threadListRpc,
      );
    } catch (error) {
      bb.log.warn(`action=sidebar-order-sync-failed error=${describeError(error)}`);
    }
  }

  let loggedUnmanaged = 0;

  /**
   * Takes bb's sections as they are: drops stages whose section is gone,
   * takes renames, adds sections created in bb, and follows the sidebar
   * order. Runs on the config queue. Changes nothing when bb's sections
   * cannot be listed, so a failed call never reads as "everything deleted".
   */
  async function syncFromBb(): Promise<void> {
    let sections: Section[];
    try {
      sections = await bb.sdk.threadSections.list();
    } catch (error) {
      bb.log.warn(`action=section-sync-skipped error=${describeError(error)}`);
      return;
    }
    const skipped = await runPendingDeletes(
      new Set(sections.map((section) => section.id)),
    );
    sections = sections.filter((section) => !skipped.has(section.id));
    let sidebarOrder: string[] | null = null;
    try {
      sidebarOrder = await readSidebarSectionOrder(
        threadListRpc,
        sections.map((section) => section.id),
      );
    } catch (error) {
      bb.log.warn(`action=sidebar-order-read-failed error=${describeError(error)}`);
    }
    const deletedInbox = parseWorkflowConfig({
      version: WORKFLOW_CONFIG_VERSION,
      stages: [await bb.storage.kv.get<unknown>(DELETED_INBOX_KEY)],
    })?.stages[0] ?? null;
    const previous = configSnapshot;
    const result = syncStagesWithSections(
      previous,
      sections,
      sidebarOrder,
      deletedInbox,
    );
    const next = result.config;
    const created = await createMissingSections(next);
    if (result.unmanaged !== loggedUnmanaged) {
      loggedUnmanaged = result.unmanaged;
      if (result.unmanaged > 0) {
        bb.log.warn(
          `action=stage-limit-reached limit=${MAX_WORKFLOW_STAGES} unmanaged=${result.unmanaged}`,
        );
      }
    }
    if (JSON.stringify(next.stages) === JSON.stringify(previous.stages)) return;
    next.revision = (previous.revision ?? 0) + 1;
    configSnapshot = next;
    await persistConfig();
    if (result.droppedInbox !== null) {
      await bb.storage.kv.set(DELETED_INBOX_KEY, {
        ...result.droppedInbox,
        sectionId: null,
      });
    } else if (deletedInbox !== null && next.stages.some((stage) => stage.key === "inbox")) {
      await bb.storage.kv.delete(DELETED_INBOX_KEY);
    }
    for (const change of result.changes) bb.log.info(change);
    if (created) await writeSidebarOrder(next);
    publishConfig();
  }

  async function loadConfig(): Promise<void> {
    const raw = await bb.storage.kv.get<unknown>(CONFIG_KEY);
    let stored = parseWorkflowConfig(raw);
    if (raw !== undefined && stored === null) {
      // Never fall back to the defaults once a config exists: that would
      // create every default section again.
      stored = parseWorkflowConfig(
        await bb.storage.kv.get<unknown>(LAST_GOOD_CONFIG_KEY),
      );
      if (stored === null) {
        throw new Error("The stored workflow config could not be read.");
      }
      bb.log.error("action=config-unreadable using=last-good");
    }
    configSnapshot = stored ?? cloneWorkflowConfig(DEFAULT_WORKFLOW_CONFIG);
    // Every served config carries a revision so editors can prove which
    // state their save is based on.
    if (configSnapshot.revision === undefined) configSnapshot.revision = 0;

    const legacy = legacyPendingOperationSchema.safeParse(
      await bb.storage.kv.get<unknown>(LEGACY_PENDING_OPERATION_KEY),
    );
    if (legacy.success) {
      await addPendingDeletes(
        legacy.data.removedStages.flatMap((stage) =>
          stage.sectionId === null ? [] : [stage.sectionId],
        ),
      );
    }
    await bb.storage.kv.delete(LEGACY_PENDING_OPERATION_KEY);

    await syncFromBb();
    await persistConfig();
    publishConfig();
    bb.log.info(
      `Thread Organizer loaded stages=${configSnapshot.stages.length}`,
    );
  }

  async function addPendingDeletes(sectionIds: readonly string[]): Promise<void> {
    if (sectionIds.length === 0) return;
    const pending = stringList(await bb.storage.kv.get<unknown>(PENDING_DELETES_KEY));
    await bb.storage.kv.set(PENDING_DELETES_KEY, [
      ...new Set([...pending, ...sectionIds]),
    ]);
  }

  function initialRememberedStage(thread: Thread): WorkflowStage | null {
    const current = stageForSectionId(configSnapshot, thread.sectionId);
    return current?.role === "stage"
      ? current
      : null;
  }

  async function readThreadState(
    thread: Thread,
  ): Promise<{ created: boolean; state: ThreadWorkflowState }> {
    const stored = await bb.storage.kv.get<unknown>(threadStateKey(thread.id));
    if (stored && typeof stored === "object") {
      const value = stored as Record<string, unknown>;
      if (
        value.version === 3 ||
        value.version === 4 ||
        value.version === 5 ||
        value.version === 6
      ) {
        // A remembered stage that no longer exists means no section; the
        // rest of the record survives the config change.
        const remembered = value.rememberedStageKey === null
          ? null
          : configSnapshot.stages.find(
            (stage) =>
              stage.key === value.rememberedStageKey && stage.role === "stage",
          ) ?? null;
        return {
          created: false,
          state: {
            version: 5,
            rememberedStageKey: remembered?.key ?? null,
            ...(typeof value.claimedInboxKey === "string" ? { claimedInboxKey: value.claimedInboxKey } : {}),
            ...(typeof value.dismissedInboxPluginId === "string" ? { dismissedInboxPluginId: value.dismissedInboxPluginId } : {}),
            // Records written before landings were tracked already sat in
            // their remembered stage; seeding from it keeps an upgrade silent.
            lastLandedStageKey:
              "lastLandedStageKey" in value
                ? parseStageKeyOrNull(value.lastLandedStageKey)
                : remembered?.key ?? null,
            pendingEntryPrompt: parsePendingEntryPrompt(
              value.pendingEntryPrompt,
            ),
            queuedEntryPrompt: parseQueuedEntryPrompt(value.queuedEntryPrompt),
            recentEntryPrompts: parseEntryPromptRecords(
              value.recentEntryPrompts,
            ),
          },
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
      rememberedStageKey: remembered?.key ?? null,
      lastLandedStageKey: remembered?.key ?? null,
      pendingEntryPrompt: null,
      queuedEntryPrompt: null,
      recentEntryPrompts: [],
    };
    await bb.storage.kv.set(threadStateKey(thread.id), migrated);
    if (legacy !== undefined) {
      await bb.storage.kv.delete(legacyThreadStateKey(thread.id));
    }
    return { created: true, state: migrated };
  }

  async function saveThreadState(
    threadId: string,
    state: ThreadWorkflowState,
  ): Promise<void> {
    await bb.storage.kv.set(threadStateKey(threadId), state);
  }

  async function hasRunningChildren(threadId: string): Promise<boolean> {
    let offset = 0;
    while (!reconciliationController.signal.aborted) {
      const children = await bb.sdk.threads.list({
        parentThreadId: threadId,
        archived: false,
        includeHidden: true,
        limit: THREAD_LIST_PAGE_SIZE,
        offset,
        signal: reconciliationController.signal,
      });
      if (children.some(isRunningThread)) return true;
      if (children.length < THREAD_LIST_PAGE_SIZE) return false;
      offset += THREAD_LIST_PAGE_SIZE;
    }
    return false;
  }

  async function reconcileThread(
    threadId: string,
    options: ReconcileOptions = {},
  ): Promise<EntryPromptOutcome> {
    const {
      explicitStageKey,
      reconcileParent = true,
      releaseRead = false,
      seedLanding = false,
    } = options;
    const thread = await bb.sdk.threads.get({ threadId });
    if (thread.parentThreadId !== null) {
      if (!reconcileParent) return null;
      const parentThreadId = thread.parentThreadId;
      await schedule(parentThreadId, async () => {
        await reconcileThread(parentThreadId);
      });
      return null;
    }
    if (!isManageableThread(thread)) return null;
    const { created, state } = await readThreadState(thread);
    const currentStage = stageForSectionId(configSnapshot, thread.sectionId);
    // A sweep must not empty an inbox filled by hand: threads dropped there
    // are usually already read, so only a real read event may release them.
    const release =
      releaseRead &&
      !(
        seedLanding &&
        currentStage?.role === "inbox" &&
        currentStage.key !== "inbox" &&
        currentStage.catchesPluginId === undefined
      );

    const priorInbox = configSnapshot.stages.find(
      (stage) => stage.key === state.claimedInboxKey && stage.role === "inbox",
    );
    if (
      priorInbox &&
      (explicitStageKey !== undefined || thread.sectionId !== priorInbox.sectionId)
    ) {
      if (priorInbox.catchesPluginId) {
        state.dismissedInboxPluginId = priorInbox.catchesPluginId;
      }
      delete state.claimedInboxKey;
    } else if (!priorInbox) {
      delete state.claimedInboxKey;
    }

    // A section no stage owns is the user's own bucket, not a misplacement.
    // Leave the thread where they put it and sync so the section becomes a
    // stage. An explicit stage move still wins.
    if (
      explicitStageKey === undefined &&
      thread.sectionId !== null &&
      currentStage === null
    ) {
      void requestSync();
      return null;
    }

    if (explicitStageKey) {
      state.rememberedStageKey = explicitStageKey;
    } else if (currentStage?.role === "stage") {
      state.rememberedStageKey = currentStage.key;
    }

    if (
      state.rememberedStageKey !== null &&
      !configSnapshot.stages.some(
        (stage) =>
          stage.key === state.rememberedStageKey && stage.role === "stage",
      )
    ) {
      state.rememberedStageKey = null;
    }

    let matchedInbox: WorkflowStage | null = null;
    if (
      explicitStageKey === undefined && state.rememberedStageKey === null &&
      (currentStage?.role !== "inbox" || currentStage.key === "inbox")
    ) {
      const candidates = configSnapshot.stages.filter((stage) =>
        stage.role === "inbox" && stage.catchesPluginId !== undefined &&
        stage.catchesPluginId !== state.dismissedInboxPluginId,
      );
      matchedInbox = candidates.find(
        (stage) => stage.catchesPluginId === thread.originPluginId,
      ) ?? null;
      if (!matchedInbox) {
        for (const stage of candidates) {
          const metadata = await bb.sdk.threads.getPluginMetadata({
            threadId, pluginId: stage.catchesPluginId!,
          });
          if (metadata.inbox === true) {
            matchedInbox = stage;
            break;
          }
        }
      }
    }
    const runningChildren =
      !isRunningThread(thread) &&
      (thread.queuedMessageCount ?? 0) === 0 &&
      (isUnreadThread(thread) || currentStage?.key === "inbox") &&
      !matchedInbox &&
      (currentStage?.role !== "inbox" || currentStage.key === "inbox") &&
      await hasRunningChildren(threadId);
    const destination = placementForThread(
      configSnapshot,
      thread,
      state.rememberedStageKey,
      explicitStageKey !== undefined,
      matchedInbox,
      release,
      runningChildren,
    );
    if (destination && !destination.sectionId) {
      throw new Error(`Stage ${destination.key} has no native section.`);
    }
    const destinationSectionId = destination?.sectionId ?? null;
    if (destination?.role === "inbox" && destination.key !== "inbox") {
      state.claimedInboxKey = destination.key;
    }
    if (thread.sectionId !== destinationSectionId) {
      try {
        await bb.sdk.threads.update({
          threadId,
          sectionId: destinationSectionId,
        });
      } catch (error) {
        if (!isSectionNotFound(error)) throw error;
        // The section was deleted in bb; sync drops its stage instead of
        // retrying the move into a section that no longer exists.
        bb.log.warn(
          `thread=${threadId} action=section-missing stage=${destination?.key ?? "unassigned"}`,
        );
        void requestSync();
        return null;
      }
      bb.log.info(
        `thread=${threadId} action=section-updated stage=${destination?.key ?? "unassigned"}`,
      );
    }

    // A thread only "lands" in a workflow stage; Inbox routing never counts,
    // so the plugin's own Inbox round trips cannot re-trigger an entry prompt.
    const landedStageKey =
      destination === null
        ? null
        : destination.role === "stage" ? destination.key : state.lastLandedStageKey;
    const entered =
      !created &&
      !seedLanding &&
      // Reading a thread must not start another agent turn.
      !(release && returnsAfterRead(currentStage, thread)) &&
      landedStageKey !== null &&
      landedStageKey !== state.lastLandedStageKey;
    state.lastLandedStageKey = landedStageKey;

    // The thread's real target moved on; anything still aimed at the old
    // stage must not fire.
    if (
      state.pendingEntryPrompt !== null &&
      (state.pendingEntryPrompt.stageKey !== state.rememberedStageKey ||
        (destination?.role === "inbox" && destination.key !== "inbox"))
    ) {
      bb.log.info(
        `thread=${threadId} action=entry-prompt-dropped stage=${state.pendingEntryPrompt.stageKey} reason=re-targeted`,
      );
      state.pendingEntryPrompt = null;
    }
    if (
      state.queuedEntryPrompt !== null &&
      (state.queuedEntryPrompt.stageKey !== state.rememberedStageKey ||
        (destination?.role === "inbox" && destination.key !== "inbox"))
    ) {
      await retractQueuedEntryPrompt(threadId, state);
    }

    if (entered && destination && hasEntryPrompt(destination)) {
      state.pendingEntryPrompt = {
        attempts: 0,
        enteredAt: Date.now(),
        stageKey: destination.key,
      };
    }
    await saveThreadState(threadId, state);
    return state.pendingEntryPrompt === null
      ? null
      : await deliverEntryPrompt(thread, state);
  }

  async function retractQueuedEntryPrompt(
    threadId: string,
    state: ThreadWorkflowState,
  ): Promise<void> {
    const queued = state.queuedEntryPrompt;
    if (queued === null) return;
    state.queuedEntryPrompt = null;
    try {
      await bb.sdk.threads.queuedMessages.delete({
        threadId,
        queuedMessageId: queued.queuedMessageId,
      });
      bb.log.info(
        `thread=${threadId} action=entry-prompt-retracted stage=${queued.stageKey}`,
      );
    } catch (error) {
      // Already dispatched or removed by the user; nothing left to retract.
      bb.log.info(
        `thread=${threadId} action=entry-prompt-retract-skipped stage=${queued.stageKey} error=${describeError(error)}`,
      );
    }
  }

  async function deliverEntryPrompt(
    thread: ThreadRecord,
    state: ThreadWorkflowState,
  ): Promise<EntryPromptOutcome> {
    const pending = state.pendingEntryPrompt;
    if (pending === null) return null;
    const now = Date.now();
    if (
      pending.lastAttemptAt !== undefined &&
      now - pending.lastAttemptAt < ENTRY_PROMPT_RETRY_INTERVAL_MS
    ) {
      return "deferred";
    }
    const drop = async (reason: string): Promise<EntryPromptOutcome> => {
      state.pendingEntryPrompt = null;
      await saveThreadState(thread.id, state);
      bb.log.warn(
        `thread=${thread.id} action=entry-prompt-dropped stage=${pending.stageKey} reason=${reason}`,
      );
      return "dropped";
    };
    const stage = configSnapshot.stages.find(
      (candidate) => candidate.key === pending.stageKey,
    );
    if (!stage || !hasEntryPrompt(stage)) return drop("no-prompt");
    if (now - pending.enteredAt > ENTRY_PROMPT_MAX_AGE_MS) {
      return drop("expired");
    }
    const recent = state.recentEntryPrompts.filter(
      (record) => now - record.sentAt < ENTRY_PROMPT_WINDOW_MS,
    );
    if (
      recent.length >= ENTRY_PROMPT_MAX_PER_WINDOW ||
      recent.some(
        (record) =>
          record.stageKey === stage.key &&
          now - record.sentAt < ENTRY_PROMPT_SAME_STAGE_COOLDOWN_MS,
      )
    ) {
      return drop("rate-limited");
    }

    const titleFallback =
      (thread as { titleFallback?: string | null }).titleFallback ?? "";
    const text = entryPromptMessage(stage, {
      stage: { key: stage.key, title: stage.title },
      thread: { id: thread.id, title: thread.title ?? titleFallback },
    });
    let result: unknown;
    try {
      result = await bb.sdk.threads.send({
        threadId: thread.id,
        mode: "queue-if-active",
        input: [{ type: "text", text, mentions: [] }],
      });
    } catch (error) {
      state.pendingEntryPrompt = {
        ...pending,
        attempts: pending.attempts + 1,
        lastAttemptAt: now,
        lastError: describeError(error),
      };
      await saveThreadState(thread.id, state);
      bb.log.info(
        `thread=${thread.id} action=entry-prompt-deferred stage=${stage.key} attempt=${pending.attempts + 1} error=${describeError(error)}`,
      );
      return "deferred";
    }
    const queuedMessageId = queuedMessageIdFrom(result);
    state.pendingEntryPrompt = null;
    state.queuedEntryPrompt =
      queuedMessageId === null
        ? null
        : { queuedMessageId, stageKey: stage.key };
    state.recentEntryPrompts = [
      ...recent,
      { sentAt: now, stageKey: stage.key },
    ].slice(-ENTRY_PROMPT_HISTORY);
    await saveThreadState(thread.id, state);
    const outcome: EntryPromptOutcome =
      queuedMessageId === null ? "sent" : "queued";
    bb.log.info(
      `thread=${thread.id} action=entry-prompt-${outcome} stage=${stage.key}`,
    );
    return outcome;
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
      await schedule(threadId, async () => {
        await reconcileThread(threadId, { releaseRead: true, seedLanding: true });
      });
    }
  }

  let queuedSync: Promise<void> | null = null;

  /**
   * Queues one sync on the config queue, shared by every request made
   * before it starts. Never rejects; failures are logged.
   */
  function requestSync(): Promise<void> {
    if (disposed) return Promise.resolve();
    if (queuedSync !== null) return queuedSync;
    const run = configQueue
      .catch(() => undefined)
      .then(async () => {
        queuedSync = null;
        if (!disposed) await syncFromBb();
      })
      .catch((error: unknown) => {
        bb.log.error(`action=section-sync-failed error=${describeError(error)}`);
      });
    queuedSync = run;
    configQueue = run;
    return run;
  }

  async function sweepThreads(): Promise<void> {
    for (const threadId of await listManageableThreadIds()) {
      if (disposed) return;
      // A config-induced remap records the landing without firing.
      await schedule(threadId, async () => {
        await reconcileThread(threadId, { releaseRead: true, seedLanding: true });
      });
    }
  }

  /**
   * Saves a settings or CLI edit. It first takes bb's current sections, so an
   * editor opened before a change in bb is refused rather than undoing it.
   * Removed stages have their sections deleted in bb, which leaves their
   * threads with no section.
   */
  async function saveConfig(
    edited:
      | EditableWorkflowConfig
      | ((current: WorkflowConfig) => EditableWorkflowConfig),
  ): Promise<WorkflowConfig> {
    let result = configSnapshot;
    const operation = configQueue
      .catch(() => undefined)
      .then(async () => {
        await syncFromBb();
        const previous = configSnapshot;
        // Resolve the edit against the config as it stands now, inside the
        // queue, so a caller that started from an older snapshot cannot
        // revert a save that landed before it.
        const input =
          typeof edited === "function"
            ? edited(cloneWorkflowConfig(previous))
            : edited;
        const currentRevision = previous.revision ?? 0;
        if (input.baseRevision !== currentRevision) {
          throw new Error(WORKFLOW_CHANGED_ELSEWHERE_MESSAGE);
        }
        const next = mergeEditableWorkflowConfig(previous, input);
        if (
          previous.stages.some((stage) => stage.key === "inbox") &&
          !next.stages.some((stage) => stage.key === "inbox")
        ) {
          throw new Error(
            "The main Inbox can only be removed by deleting its section in the sidebar.",
          );
        }
        next.revision = currentRevision + 1;
        const nextKeys = new Set(next.stages.map((stage) => stage.key));
        const removed = previous.stages.flatMap((stage) =>
          !nextKeys.has(stage.key) && stage.sectionId !== null
            ? [stage.sectionId]
            : [],
        );
        await addPendingDeletes(removed);
        await runPendingDeletes(new Set(removed));
        const sectionNames = new Map(
          (await bb.sdk.threadSections.list()).map((section) => [
            section.id,
            section.name.trim(),
          ]),
        );
        for (const stage of next.stages) {
          if (
            stage.sectionId === null ||
            sectionNames.get(stage.sectionId) === localSectionName(stage)
          ) {
            continue;
          }
          await bb.sdk.threadSections.update({
            id: stage.sectionId,
            name: localSectionName(stage),
          });
        }
        const created = await createMissingSections(next);
        const reordered =
          next.stages.map((stage) => stage.key).join("\n") !==
          previous.stages.map((stage) => stage.key).join("\n");
        configSnapshot = next;
        await persistConfig();
        // The sidebar owns the order a later sync reads, so it is written
        // before the queue moves on.
        if (created || reordered) await writeSidebarOrder(next);
        publishConfig();
        result = cloneWorkflowConfig(configSnapshot);
      });
    configQueue = operation.catch(() => undefined);
    await operation;
    // Move threads to match the saved config, as every save always has.
    await sweepThreads();
    return result;
  }

  try {
    await loadConfig();
  } catch (error) {
    bb.log.error(`action=workflow-load-failed error=${describeError(error)}`);
    throw error;
  }

  const syncedConfig = async (): Promise<WorkflowConfig> => {
    await requestSync();
    return cloneWorkflowConfig(configSnapshot);
  };

  bb.rpc.register(rpcContract, {
    getConfig: syncedConfig,
    syncFromBb: syncedConfig,
    saveConfig,
    async listThreadSourcePlugins() {
      const sources = new Set<string>();
      for (let offset = 0; ; offset += THREAD_LIST_PAGE_SIZE) {
        const page = await bb.sdk.threads.list({
          archived: false,
          hasParent: false,
          limit: THREAD_LIST_PAGE_SIZE,
          offset,
        });
        for (const thread of page) {
          if (thread.originPluginId !== null) sources.add(thread.originPluginId);
        }
        if (page.length < THREAD_LIST_PAGE_SIZE) break;
      }
      return [...sources].sort();
    },
  });

  type CliResult = { exitCode: number; stdout?: string; stderr?: string };
  type CliContext = { threadId?: string; signal?: AbortSignal };
  type ConfigChange = {
    /** Heading of the approval form. */
    title: string;
    /** Introduces the shown text; receives the key of the affected stage. */
    summary: (key: string) => string;
    /** Field of the affected stage the form shows, as it will be stored. */
    field: "entryPrompt" | "rule" | null;
    /** Applied inside the save queue against the current config. */
    apply: (current: WorkflowConfig) => {
      edited: EditableWorkflowConfig;
      message: string;
      key: string;
    };
  };
  const CLI_USAGE = [
    "Usage:",
    "  bb organizer phase <stage-key>",
    "  bb organizer prompt [<stage-key>] [--set <text> | --clear]",
    "  bb organizer section list",
    "  bb organizer section add <title> [--after <stage-key>] [--rule <text>] [--inbox [--catches-plugin <plugin-id>]]",
    "  bb organizer section rule <stage-key> [--set <text>]",
    "  bb organizer section type <stage-key> [--set stage|inbox] [--catches-plugin <plugin-id>]",
    "  bb organizer section after-read <inbox-key> [--set stay|return]",
    "",
  ].join("\n");
  const CONFIRMATION_TIMEOUT_MS = 10 * 60 * 1000;

  const findStage = (
    config: WorkflowConfig,
    raw: string,
  ): WorkflowStage | undefined => {
    const key = raw.trim().toLocaleLowerCase();
    return config.stages.find((stage) => stage.key === key);
  };
  const stageKeysLine = (includeInbox: boolean): string =>
    configSnapshot.stages
      .filter((stage) => includeInbox || stage.role === "stage")
      .map((stage) => stage.key)
      .join(", ");
  const stageLabel = (stage: EditableWorkflowStage): string =>
    `${stage.title} (${stage.key})`;
  const indent = (text: string): string =>
    text
      .split("\n")
      .map((line) => `${"".padEnd(18)}${line}`)
      .join("\n");
  /** The config as it will be stored, or exit code 2 when it is not valid. */
  const validated = (edited: EditableWorkflowConfig): EditableWorkflowConfig => {
    try {
      return {
        ...normalizeEditableWorkflowConfig(edited),
        ...(edited.baseRevision === undefined
          ? {}
          : { baseRevision: edited.baseRevision }),
      };
    } catch (error) {
      throw new CliInputError(describeError(error));
    }
  };

  /**
   * Configuration changes from the CLI pass three steps: the change is
   * checked against the current config so an impossible request fails before
   * anyone is asked; the user approves the text exactly as it will be stored,
   * in the thread that ran the command, because entry prompts become
   * user-role messages and rules become agent instructions; then the change
   * is re-derived and saved inside the config queue so it cannot revert a
   * save that landed first. The approval confirms the user's intent for a
   * CLI-initiated change. It is not an authorization boundary: the plugin's
   * saveConfig RPC stays reachable by local processes under the host's rules.
   */
  async function confirmAndSave(
    context: CliContext,
    change: ConfigChange,
  ): Promise<CliResult> {
    let preview: { edited: EditableWorkflowConfig; key: string };
    try {
      const applied = change.apply(configSnapshot);
      preview = { edited: validated(applied.edited), key: applied.key };
    } catch (error) {
      if (error instanceof CliInputError) {
        return { exitCode: 2, stderr: `${error.message}\n` };
      }
      throw error;
    }
    const shown = preview.edited.stages.find(
      (stage) => stage.key === preview.key,
    );
    const text = change.field === null ? null : (shown?.[change.field] ?? null);
    if (!context.threadId) {
      return {
        exitCode: 2,
        stderr:
          "Run this inside a bb thread so the change can be approved there, or use Settings.\n",
      };
    }
    const decision = await bb.ui.requestInput(
      {
        threadId: context.threadId,
        rendererId: WORKFLOW_CHANGE_INTERACTION_ID,
        title: change.title,
        payload: { summary: change.summary(preview.key), text },
        timeoutMs: CONFIRMATION_TIMEOUT_MS,
      },
      context.signal ? { signal: context.signal } : {},
    );
    if (decision.outcome !== "submitted" || decision.value !== true) {
      const reason =
        decision.outcome === "cancelled" ? ` (${decision.reason})` : "";
      return {
        exitCode: 2,
        stderr: `Not approved${reason}; the workflow was left unchanged.\n`,
      };
    }
    let message = "";
    try {
      await saveConfig((current) => {
        const result = change.apply(current);
        message = result.message;
        return validated(result.edited);
      });
    } catch (error) {
      if (error instanceof CliInputError) {
        return { exitCode: 2, stderr: `${error.message}\n` };
      }
      return {
        exitCode: 1,
        stderr: `Could not save the workflow: ${describeError(error)}\n`,
      };
    }
    bb.log.info(
      `thread=${context.threadId} action=config-changed-from-cli change=${JSON.stringify(change.title)}`,
    );
    return { exitCode: 0, stdout: `${message}\n` };
  }

  async function runPhase(
    argv: readonly string[],
    threadId: string | undefined,
  ): Promise<CliResult> {
    if (!argv[0]) return { exitCode: 2, stderr: CLI_USAGE };
    if (!threadId) {
      return {
        exitCode: 2,
        stderr: "Run inside a bb thread so BB_THREAD_ID is available.\n",
      };
    }
    const stage = findStage(configSnapshot, argv[0]);
    if (!stage || stage.role === "inbox") {
      return {
        exitCode: 2,
        stderr: `Unknown or system-managed stage: ${argv[0]}\nAvailable: ${stageKeysLine(false)}\n`,
      };
    }
    const thread = await bb.sdk.threads.get({ threadId });
    if (!isManageableThread(thread)) {
      return { exitCode: 2, stderr: "This thread cannot be organized.\n" };
    }
    const result: { outcome: EntryPromptOutcome } = { outcome: null };
    try {
      await enqueue(thread.id, async () => {
        result.outcome = await reconcileThread(thread.id, {
          explicitStageKey: stage.key,
        });
      });
    } catch (error) {
      return {
        exitCode: 1,
        stderr: `Could not set the workflow stage: ${describeError(error)}\n`,
      };
    }
    return {
      exitCode: 0,
      stdout: `Applied ${stage.title} to ${thread.id}.${entryPromptNote(
        result.outcome,
      )}\n`,
    };
  }

  async function runPrompt(
    argv: readonly string[],
    context: CliContext,
  ): Promise<CliResult> {
    const [rawKey, ...rest] = argv;
    if (rawKey === undefined) {
      const blocks = configSnapshot.stages.map((stage) => {
        const body =
          stage.role === "inbox"
            ? "(Inbox cannot send an entry prompt)"
            : stage.entryPrompt ?? "(no entry prompt)";
        return `${stage.key.padEnd(17)} ${stage.title}\n${indent(body)}`;
      });
      return { exitCode: 0, stdout: `${blocks.join("\n")}\n` };
    }
    const stage = findStage(configSnapshot, rawKey);
    if (!stage) {
      return {
        exitCode: 2,
        stderr: `Unknown stage: ${rawKey}\nAvailable: ${stageKeysLine(true)}\n`,
      };
    }
    if (rest.length === 0) {
      return {
        exitCode: 0,
        stdout: stage.entryPrompt
          ? `${stage.entryPrompt}\n`
          : `${stageLabel(stage)} has no entry prompt.\n`,
      };
    }
    if (stage.role === "inbox") {
      return { exitCode: 2, stderr: "Inbox cannot send an entry prompt.\n" };
    }
    const withStage = (
      current: WorkflowConfig,
      update: (target: EditableWorkflowStage) => EditableWorkflowStage,
    ): EditableWorkflowConfig => {
      const edited = editableWorkflowConfig(current);
      const index = edited.stages.findIndex((entry) => entry.key === stage.key);
      const target = edited.stages[index];
      if (index < 0 || target === undefined) {
        throw new CliInputError(
          `Stage ${stage.key} no longer exists; the workflow changed elsewhere.`,
        );
      }
      edited.stages[index] = update(target);
      return edited;
    };
    if (rest.length === 1 && rest[0] === "--clear") {
      return confirmAndSave(context, {
        title: `Clear the entry prompt for ${stage.title}`,
        summary: () =>
          `Threads landing in ${stage.title} will no longer receive a message.`,
        field: null,
        apply: (current) => ({
          edited: withStage(
            current,
            ({ entryPrompt: _omitted, ...withoutPrompt }) => withoutPrompt,
          ),
          message: `Cleared the entry prompt for ${stageLabel(stage)}.`,
          key: stage.key,
        }),
      });
    }
    if (rest[0] === "--set") {
      const text = rest[1];
      if (rest.length !== 2 || text === undefined || text.startsWith("--")) {
        return {
          exitCode: 2,
          stderr:
            "Provide the prompt text as one quoted argument after --set, or use --clear.\n",
        };
      }
      if (text.trim().length === 0) {
        return {
          exitCode: 2,
          stderr: "Provide the prompt text after --set, or use --clear.\n",
        };
      }
      return confirmAndSave(context, {
        title: `Set the entry prompt for ${stage.title}`,
        summary: () =>
          `Threads landing in ${stage.title} will receive this message:`,
        field: "entryPrompt",
        apply: (current) => ({
          edited: withStage(current, (target) => ({
            ...target,
            entryPrompt: text,
          })),
          message: `Set the entry prompt for ${stageLabel(stage)}.`,
          key: stage.key,
        }),
      });
    }
    return { exitCode: 2, stderr: CLI_USAGE };
  }

  async function runSection(
    argv: readonly string[],
    context: CliContext,
  ): Promise<CliResult> {
    const [subcommand, ...rest] = argv;
    if (subcommand === undefined || subcommand === "list") {
      await requestSync();
      const lines = configSnapshot.stages.map((stage) => {
        const note =
          stage.key === "inbox"
            ? "system-managed"
            : stage.role === "inbox"
              ? `inbox · ${stage.catchesPluginId ?? "manual"}`
            : stage.entryPrompt
              ? "entry prompt"
              : "";
        return `${stage.key.padEnd(17)} ${stage.title}${note ? `  [${note}]` : ""}`;
      });
      return { exitCode: 0, stdout: `${lines.join("\n")}\n` };
    }
    if (subcommand === "rule") return runSectionRule(rest, context);
    if (subcommand === "type") return runSectionType(rest, context);
    if (subcommand === "after-read") return runSectionAfterRead(rest, context);
    if (subcommand !== "add") return { exitCode: 2, stderr: CLI_USAGE };
    const [rawTitle, ...options] = rest;
    const title = rawTitle?.trim() ?? "";
    if (title.length === 0) {
      return { exitCode: 2, stderr: "Provide a section title.\n" };
    }
    let after: string | undefined;
    let rule: string | undefined;
    let inbox = false;
    let catchesPluginId: string | undefined;
    for (let index = 0; index < options.length; index += 1) {
      const option = options[index];
      const value = options[index + 1];
      if (option === "--after" && value !== undefined) {
        after = value;
        index += 1;
      } else if (option === "--rule" && value !== undefined) {
        rule = value;
        index += 1;
      } else if (option === "--inbox") {
        inbox = true;
      } else if (option === "--catches-plugin" && value !== undefined) {
        catchesPluginId = value;
        index += 1;
      } else {
        return { exitCode: 2, stderr: CLI_USAGE };
      }
    }
    const anchorNow = after === undefined ? null : findStage(configSnapshot, after);
    if (after !== undefined && !anchorNow) {
      return {
        exitCode: 2,
        stderr: `Unknown stage: ${after}\nAvailable: ${stageKeysLine(true)}\n`,
      };
    }
    const finalRule = rule?.trim() || DEFAULT_STAGE_RULE;
    return confirmAndSave(context, {
      title: `Add section "${title}"`,
      summary: (key) =>
        `${anchorNow ? `After ${anchorNow.title}` : "At the end"}, keyed ${key}${inbox ? catchesPluginId === undefined ? ", as a manual inbox" : `, for threads from ${catchesPluginId}` : ""}, with this rule for agents:`,
      field: "rule",
      apply: (current) => {
        const edited = editableWorkflowConfig(current);
        let position = edited.stages.length;
        let anchor: WorkflowStage | undefined;
        if (after !== undefined) {
          anchor = findStage(current, after);
          if (!anchor) {
            throw new CliInputError(
              `Stage ${after} no longer exists; the workflow changed elsewhere.`,
            );
          }
          const anchorKey = anchor.key;
          position =
            edited.stages.findIndex((entry) => entry.key === anchorKey) + 1;
        }
        const key = createStageKey(
          title,
          edited.stages.map((entry) => entry.key),
        );
        edited.stages.splice(position, 0, {
          key,
          role: inbox ? "inbox" : "stage",
          ...(catchesPluginId !== undefined ? { catchesPluginId } : {}),
          title,
          rule: finalRule,
        });
        return {
          edited,
          message: `Added ${title} (${key})${anchor ? ` after ${anchor.title}` : ""}.`,
          key,
        };
      },
    });
  }

  async function runSectionRule(
    argv: readonly string[],
    context: CliContext,
  ): Promise<CliResult> {
    const [rawKey, ...rest] = argv;
    if (rawKey === undefined) return { exitCode: 2, stderr: CLI_USAGE };
    const stage = findStage(configSnapshot, rawKey);
    if (!stage) {
      return {
        exitCode: 2,
        stderr: `Unknown stage: ${rawKey}\nAvailable: ${stageKeysLine(true)}\n`,
      };
    }
    if (rest.length === 0) {
      const rule = stage.key === "inbox" && stage.returnAfterRead
        ? RETURNING_INBOX_DESCRIPTION
        : stage.rule;
      return { exitCode: 0, stdout: `${rule}\n` };
    }
    if (stage.key === "inbox") {
      return {
        exitCode: 2,
        stderr: "The Inbox rule is system-managed. Use `bb organizer section after-read inbox` to choose what happens after reading.\n",
      };
    }
    const text = rest[1];
    if (rest[0] !== "--set" || rest.length !== 2 || text === undefined) {
      return { exitCode: 2, stderr: CLI_USAGE };
    }
    if (text.trim().length === 0) {
      return { exitCode: 2, stderr: "Provide the rule text after --set.\n" };
    }
    return confirmAndSave(context, {
      title: `Set the rule for ${stage.title}`,
      summary: () => `Agents will file work into ${stage.title} by this rule:`,
      field: "rule",
      apply: (current) => {
        const edited = editableWorkflowConfig(current);
        const index = edited.stages.findIndex((entry) => entry.key === stage.key);
        const target = edited.stages[index];
        if (index < 0 || target === undefined) {
          throw new CliInputError(
            `Stage ${stage.key} no longer exists; the workflow changed elsewhere.`,
          );
        }
        edited.stages[index] = { ...target, rule: text };
        return {
          edited,
          message: `Set the rule for ${stageLabel(stage)}.`,
          key: stage.key,
        };
      },
    });
  }

  async function runSectionType(
    argv: readonly string[],
    context: CliContext,
  ): Promise<CliResult> {
    const [rawKey, ...rest] = argv;
    if (rawKey === undefined) return { exitCode: 2, stderr: CLI_USAGE };
    const stage = findStage(configSnapshot, rawKey);
    if (!stage) {
      return {
        exitCode: 2,
        stderr: `Unknown stage: ${rawKey}\nAvailable: ${stageKeysLine(true)}\n`,
      };
    }
    if (rest.length === 0) {
      return {
        exitCode: 0,
        stdout: `${stage.role}${stage.key === "inbox" ? " (everything)" : stage.catchesPluginId ? ` (${stage.catchesPluginId})` : stage.role === "inbox" ? " (manual)" : ""}\n`,
      };
    }
    if (stage.key === "inbox") {
      return { exitCode: 2, stderr: "The main Inbox is protected.\n" };
    }
    const role = rest[1];
    if (
      rest[0] !== "--set" ||
      !((role === "stage" && rest.length === 2) ||
        (role === "inbox" && rest.length === 2) ||
        (role === "inbox" && rest.length === 4 && rest[2] === "--catches-plugin"))
    ) {
      return { exitCode: 2, stderr: CLI_USAGE };
    }
    const catchesPluginId = rest[3];
    return confirmAndSave(context, {
      title: `Set the section type for ${stage.title}`,
      summary: () => role === "inbox"
        ? `${stage.title} will ${catchesPluginId === undefined ? "hold threads you move there by hand" : `receive threads from ${catchesPluginId}`} and ${stage.role === "inbox" && stage.returnAfterRead ? "move them back once you read them" : "keep them until you move or archive them"}.`
        : `${stage.title} will be a workflow section with normal Inbox routing.`,
      field: null,
      apply: (current) => {
        const edited = editableWorkflowConfig(current);
        const index = edited.stages.findIndex((entry) => entry.key === stage.key);
        const target = edited.stages[index];
        if (target === undefined) {
          throw new CliInputError(
            `Stage ${stage.key} no longer exists; the workflow changed elsewhere.`,
          );
        }
        const {
          catchesPluginId: _previousFilter,
          returnAfterRead,
          ...fields
        } = target;
        edited.stages[index] = {
          ...fields, role: role as "stage" | "inbox",
          ...(role === "inbox" && catchesPluginId !== undefined ? { catchesPluginId } : {}),
          ...(role === "inbox" && returnAfterRead ? { returnAfterRead } : {}),
        };
        return {
          edited, key: stage.key,
          message: `Set ${stageLabel(stage)} to ${role}.`,
        };
      },
    });
  }

  async function runSectionAfterRead(
    argv: readonly string[],
    context: CliContext,
  ): Promise<CliResult> {
    const [rawKey, ...rest] = argv;
    if (rawKey === undefined) return { exitCode: 2, stderr: CLI_USAGE };
    const stage = findStage(configSnapshot, rawKey);
    if (!stage) {
      return {
        exitCode: 2,
        stderr: `Unknown stage: ${rawKey}\nAvailable: ${stageKeysLine(true)}\n`,
      };
    }
    if (stage.role !== "inbox") {
      return {
        exitCode: 2,
        stderr: `${stage.title} is not an inbox; only inboxes hold threads until they are read.\n`,
      };
    }
    if (rest.length === 0) {
      return {
        exitCode: 0,
        stdout: `${stage.returnAfterRead ? "return" : "stay"}\n`,
      };
    }
    const choice = rest[1];
    if (
      rest.length !== 2 ||
      rest[0] !== "--set" ||
      (choice !== "stay" && choice !== "return")
    ) {
      return { exitCode: 2, stderr: CLI_USAGE };
    }
    const returnAfterRead = choice === "return";
    return confirmAndSave(context, {
      title: `Set after-reading behavior for ${stage.title}`,
      summary: () => returnAfterRead
        ? `Threads in ${stage.title} will move back to their workflow section as soon as you read them.`
        : `Read threads will stay in ${stage.title} until work resumes or you move them.`,
      field: null,
      apply: (current) => {
        const edited = editableWorkflowConfig(current);
        const index = edited.stages.findIndex((entry) => entry.key === stage.key);
        const target = edited.stages[index];
        if (target?.role !== "inbox") {
          throw new CliInputError(
            `Inbox ${stage.key} no longer exists; the workflow changed elsewhere.`,
          );
        }
        const { returnAfterRead: _previous, ...fields } = target;
        edited.stages[index] = {
          ...fields,
          ...(returnAfterRead ? { returnAfterRead } : {}),
        };
        return {
          edited,
          key: stage.key,
          message: `Set ${stageLabel(stage)} to ${choice} after reading.`,
        };
      },
    });
  }

  bb.cli.register({
    name: "organizer",
    summary:
      "Manage workflow sections and entry prompts, or move the current thread",
    commands: [
      {
        name: "phase",
        summary: "Apply a workflow stage to the current thread",
        usage: "bb organizer phase <stage-key>",
      },
      {
        name: "prompt",
        summary:
          "Show, set, or clear a section's entry prompt (changes ask for approval in the thread)",
        usage: "bb organizer prompt [<stage-key>] [--set <text> | --clear]",
      },
      {
        name: "section",
        summary:
          "List sections or add one (changes ask for approval in the thread)",
        usage:
          "bb organizer section list | add <title> [--after <stage-key>] [--rule <text>] [--inbox [--catches-plugin <plugin-id>]] | rule <stage-key> [--set <text>] | type <stage-key> [--set stage|inbox] [--catches-plugin <plugin-id>] | after-read <inbox-key> [--set stay|return]",
      },
    ],
    async run(argv, context) {
      const [command, ...rest] = argv;
      const cliContext: CliContext = {
        ...(context.threadId ? { threadId: context.threadId } : {}),
        ...(context.signal ? { signal: context.signal } : {}),
      };
      switch (command) {
        case "phase":
          return runPhase(rest, cliContext.threadId);
        case "prompt":
          return runPrompt(rest, cliContext);
        case "section":
          return runSection(rest, cliContext);
        default:
          return { exitCode: 2, stderr: CLI_USAGE };
      }
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
    "thread.unarchived",
    "thread.active",
    "thread.idle",
    "thread.failed",
  ] as const) {
    bb.events.on(event, ({ thread }) =>
      schedule(thread.id, async () => {
        await reconcileThread(thread.id);
      }),
    );
  }
  for (const event of ["thread.archived", "thread.deleted"] as const) {
    bb.events.on(event, ({ thread }) =>
      schedule(thread.id, async () => {
        await bb.storage.kv.delete(threadStateKey(thread.id));
        await bb.storage.kv.delete(legacyThreadStateKey(thread.id));
        if (thread.parentThreadId !== null) {
          const parentThreadId = thread.parentThreadId;
          await schedule(parentThreadId, async () => {
            await reconcileThread(parentThreadId);
          });
        }
      }),
    );
  }

  // bb has no section event; creating, renaming or deleting one is reported
  // as a threads change on the Personal project.
  const unsubscribeSections = bb.sdk.subscribe({
    event: "project:changed",
    projectId: PERSONAL_PROJECT_ID,
    callback(event) {
      if (event.changes.includes("threads-changed")) void requestSync();
    },
  });

  const unsubscribe = bb.sdk.subscribe({
    event: "thread:changed",
    callback(event) {
      if (!event.id) return;
      const threadId = event.id;
      const reconcileParent = event.changes.some((change) =>
        change === "thread-created" ||
        change === "thread-deleted" ||
        change === "status-changed" ||
        change === "archived-changed" ||
        change === "parent-changed"
      );
      const readStateChanged = event.changes.includes("read-state-changed");
      void schedule(threadId, async () => {
        if (readStateChanged) {
          const thread = await bb.sdk.threads.get({ threadId });
          if (!isUnreadThread(thread)) {
            const currentStage = stageForSectionId(configSnapshot, thread.sectionId);
            if (returnsAfterRead(currentStage, thread)) {
              await reconcileThread(threadId, { releaseRead: true, reconcileParent });
              return;
            }
            if (thread.queuedMessageCount === 0) return;
          }
        }
        await reconcileThread(threadId, { reconcileParent });
      });
    },
  });

  bb.onDispose(async () => {
    disposed = true;
    reconciliationController.abort();
    unsubscribeSections();
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
