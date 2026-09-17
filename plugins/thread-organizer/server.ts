import { defineRpcContract, type BbPluginApi } from "@get-bb/plugin-sdk";
import { z } from "zod";

import {
  DEFAULT_WORKFLOW_CONFIG,
  ENTRY_PROMPT_MAX_LENGTH,
  INBOX_RULE,
  WORKFLOW_CONFIG_VERSION,
  buildWorkflowSkillSlot,
  cloneWorkflowConfig,
  createStageKey,
  editableWorkflowConfig,
  editableWorkflowConfig,
  entryPromptMessage,
  firstWorkflowStage,
  hasEntryPrompt,
  inboxStage,
  isManageableThread,
  isUnreadThread,
  legacySectionNames,
  localSectionName,
  mergeEditableWorkflowConfig,
  normalizeEditableWorkflowConfig,
  parseWorkflowConfig,
  placementForThread,
  stageForSectionId,
  type EditableWorkflowConfig,
  type EditableWorkflowStage,
  type OrganizableThread,
  type WorkflowConfig,
  type WorkflowStage,
} from "./core.js";

const CONFIG_KEY = "workflow-config:v1";
const PENDING_CONFIG_OPERATION_KEY = "workflow-config-operation:v1";
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
    // Accepted and discarded: written by the first entry-prompt build.
    entryPromptDelivery: z.unknown().optional(),
    entryPromptOnAgentMove: z.unknown().optional(),
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

// Version stays 5: every field after rememberedStageKey is optional on read so
// an older build can still open this record, and absent fields are seeded.
interface ThreadWorkflowState {
  /** The last workflow stage the thread landed in; Inbox never counts. */
  lastLandedStageKey: string | null;
  pendingEntryPrompt: PendingEntryPrompt | null;
  /** A prompt the host queued rather than started; retracted if the thread moves on. */
  queuedEntryPrompt: QueuedEntryPrompt | null;
  recentEntryPrompts: EntryPromptRecord[];
  rememberedStageKey: string;
  version: 5;
}

interface ReconcileOptions {
  explicitStageKey?: string;
  /** Record where the thread sits without treating it as an entry. */
  seedLanding?: boolean;
}

type ThreadRecord = Awaited<ReturnType<BbPluginApi["sdk"]["threads"]["get"]>>;
type EntryPromptOutcome = "sent" | "queued" | "deferred" | "dropped" | null;

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
        // A remembered stage that no longer exists falls back in place so the
        // rest of the record survives a config change.
        const remembered =
          configSnapshot.stages.find(
            (stage) =>
              stage.key === value.rememberedStageKey && stage.role === "stage",
          ) ?? initialRememberedStage(thread);
        return {
          created: false,
          state: {
            version: 5,
            rememberedStageKey: remembered.key,
            // Records written before landings were tracked already sat in
            // their remembered stage; seeding from it keeps an upgrade silent.
            lastLandedStageKey:
              "lastLandedStageKey" in value
                ? parseStageKeyOrNull(value.lastLandedStageKey)
                : remembered.key,
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
      rememberedStageKey: remembered.key,
      lastLandedStageKey: remembered.key,
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

  async function reconcileThread(
    threadId: string,
    options: ReconcileOptions = {},
  ): Promise<EntryPromptOutcome> {
    const { explicitStageKey, seedLanding = false } = options;
    const thread = await bb.sdk.threads.get({ threadId });
    if (!isManageableThread(thread)) return null;
    const { created, state } = await readThreadState(thread);
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

    // A thread only "lands" in a workflow stage; Inbox routing never counts,
    // so the plugin's own Inbox round trips cannot re-trigger an entry prompt.
    const landedStageKey =
      destination.role === "stage" ? destination.key : state.lastLandedStageKey;
    const entered =
      !created &&
      !seedLanding &&
      landedStageKey !== null &&
      landedStageKey !== state.lastLandedStageKey;
    state.lastLandedStageKey = landedStageKey;

    // The thread's real target moved on; anything still aimed at the old
    // stage must not fire.
    if (
      state.pendingEntryPrompt !== null &&
      state.pendingEntryPrompt.stageKey !== state.rememberedStageKey
    ) {
      bb.log.info(
        `thread=${threadId} action=entry-prompt-dropped stage=${state.pendingEntryPrompt.stageKey} reason=re-targeted`,
      );
      state.pendingEntryPrompt = null;
    }
    if (
      state.queuedEntryPrompt !== null &&
      state.queuedEntryPrompt.stageKey !== state.rememberedStageKey
    ) {
      await retractQueuedEntryPrompt(threadId, state);
    }

    if (entered && hasEntryPrompt(destination)) {
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
        await reconcileThread(threadId, { seedLanding: true });
      });
    }
  }

  async function finishConfigOperation(
    operation: PendingConfigOperation,
  ): Promise<void> {
    configSnapshot = cloneWorkflowConfig(operation.nextConfig);
    await bb.storage.kv.set(CONFIG_KEY, configSnapshot);
    for (const threadId of await listManageableThreadIds()) {
      // Stages the config no longer has fall back inside readThreadState;
      // a config-induced remap records the landing without firing.
      await enqueue(threadId, async () => {
        await reconcileThread(threadId, { seedLanding: true });
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

  type CliResult = { exitCode: number; stdout?: string; stderr?: string };
  const CLI_USAGE = [
    "Usage:",
    "  bb organizer phase <stage-key>",
    "  bb organizer prompt [<stage-key>] [--set <text> | --clear]",
    "  bb organizer section list",
    "  bb organizer section add <title> [--after <stage-key>] [--rule <text>]",
    "",
  ].join("\n");
  const NEW_SECTION_RULE = "Describe the work that belongs in this section.";
  const SECTION_TITLE_MAX_LENGTH = 80;

  const stageByKey = (raw: string): WorkflowStage | undefined => {
    const key = raw.trim().toLocaleLowerCase();
    return configSnapshot.stages.find((stage) => stage.key === key);
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

  /**
   * Validate an edited config the same way the settings UI does, then save
   * it through the same path so sections and thread landings stay in sync.
   * Exit code 2 is a validation problem; 1 is a failed save.
   */
  async function saveEditedConfig(
    edited: EditableWorkflowConfig,
    success: string,
  ): Promise<CliResult> {
    try {
      normalizeEditableWorkflowConfig(edited);
    } catch (error) {
      return { exitCode: 2, stderr: `${describeError(error)}\n` };
    }
    try {
      await saveConfig(edited);
    } catch (error) {
      return {
        exitCode: 1,
        stderr: `Could not save the workflow: ${describeError(error)}\n`,
      };
    }
    return { exitCode: 0, stdout: `${success}\n` };
  }

  async function runPhase(
    argv: readonly string[],
    threadId: string | null | undefined,
  ): Promise<CliResult> {
    if (!argv[0]) return { exitCode: 2, stderr: CLI_USAGE };
    if (!threadId) {
      return {
        exitCode: 2,
        stderr: "Run inside a bb thread so BB_THREAD_ID is available.\n",
      };
    }
    const stage = stageByKey(argv[0]);
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

  async function runPrompt(argv: readonly string[]): Promise<CliResult> {
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
    const stage = stageByKey(rawKey);
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
    const edited = editableWorkflowConfig(configSnapshot);
    const index = edited.stages.findIndex((entry) => entry.key === stage.key);
    const current = edited.stages[index]!;
    if (rest[0] === "--clear" && rest.length === 1) {
      const { entryPrompt: _omitted, ...withoutPrompt } = current;
      edited.stages[index] = withoutPrompt;
      return saveEditedConfig(
        edited,
        `Cleared the entry prompt for ${stageLabel(stage)}.`,
      );
    }
    if (rest[0] === "--set") {
      const text = rest.slice(1).join(" ");
      if (text.trim().length === 0) {
        return {
          exitCode: 2,
          stderr: "Provide the prompt text after --set, or use --clear.\n",
        };
      }
      edited.stages[index] = { ...current, entryPrompt: text };
      return saveEditedConfig(
        edited,
        `Set the entry prompt for ${stageLabel(stage)}.`,
      );
    }
    return { exitCode: 2, stderr: CLI_USAGE };
  }

  async function runSection(argv: readonly string[]): Promise<CliResult> {
    const [subcommand, ...rest] = argv;
    if (subcommand === undefined || subcommand === "list") {
      const lines = configSnapshot.stages.map((stage) => {
        const note =
          stage.role === "inbox"
            ? "system-managed"
            : stage.entryPrompt
              ? "entry prompt"
              : "";
        return `${stage.key.padEnd(17)} ${stage.title}${note ? `  [${note}]` : ""}`;
      });
      return { exitCode: 0, stdout: `${lines.join("\n")}\n` };
    }
    if (subcommand !== "add") return { exitCode: 2, stderr: CLI_USAGE };
    const [rawTitle, ...options] = rest;
    const title = rawTitle?.trim() ?? "";
    if (title.length === 0) {
      return { exitCode: 2, stderr: "Provide a section title.\n" };
    }
    if (title.length > SECTION_TITLE_MAX_LENGTH) {
      return {
        exitCode: 2,
        stderr: `Section titles must be at most ${SECTION_TITLE_MAX_LENGTH} characters.\n`,
      };
    }
    let after: string | undefined;
    let rule: string | undefined;
    for (let index = 0; index < options.length; index += 1) {
      const option = options[index];
      const value = options[index + 1];
      if (option === "--after" && value !== undefined) {
        after = value;
        index += 1;
      } else if (option === "--rule" && value !== undefined) {
        rule = value;
        index += 1;
      } else {
        return { exitCode: 2, stderr: CLI_USAGE };
      }
    }
    const edited = editableWorkflowConfig(configSnapshot);
    let position = edited.stages.length;
    let anchor: WorkflowStage | undefined;
    if (after !== undefined) {
      anchor = stageByKey(after);
      if (!anchor) {
        return {
          exitCode: 2,
          stderr: `Unknown stage: ${after}\nAvailable: ${stageKeysLine(true)}\n`,
        };
      }
      position =
        edited.stages.findIndex((entry) => entry.key === anchor!.key) + 1;
    }
    const key = createStageKey(
      title,
      edited.stages.map((entry) => entry.key),
    );
    edited.stages.splice(position, 0, {
      key,
      role: "stage",
      title,
      rule: rule?.trim() || NEW_SECTION_RULE,
    });
    return saveEditedConfig(
      edited,
      `Added ${title} (${key})${anchor ? ` after ${anchor.title}` : ""}.`,
    );
  }

  bb.cli.register({
    name: "organizer",
    summary: "Manage workflow sections and entry prompts, or move the current thread",
    commands: [
      {
        name: "phase",
        summary: "Apply a workflow stage to the current thread",
        usage: "bb organizer phase <stage-key>",
      },
      {
        name: "prompt",
        summary: "Show, set, or clear a section's entry prompt",
        usage: "bb organizer prompt [<stage-key>] [--set <text> | --clear]",
      },
      {
        name: "section",
        summary: "List sections or add one",
        usage:
          "bb organizer section list | add <title> [--after <stage-key>] [--rule <text>]",
      },
    ],
    async run(argv, context) {
      const [command, ...rest] = argv;
      switch (command) {
        case "phase":
          return runPhase(rest, context.threadId);
        case "prompt":
          return runPrompt(rest);
        case "section":
          return runSection(rest);
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
