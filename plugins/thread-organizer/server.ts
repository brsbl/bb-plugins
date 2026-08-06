import type { BbPluginApi } from "@bb/plugin-sdk";

import {
  advanceEvaluationMilestone,
  classifySection,
  deriveTaskTitle,
  isEligibleThread,
  isManageableThread,
  isSubstantiveText,
  resolveSectionId,
  type SectionClassification,
} from "./core.js";

const STATE_PREFIX = "thread:v1:";
const PERSONAL_PROJECT_ID = "proj_personal";
const NEW_SECTION_CONFIDENCE = 0.85;
const NEW_SECTION_MARGIN = 0.2;
const MOVE_SECTION_CONFIDENCE = 0.92;
const MOVE_SECTION_MARGIN = 0.25;
const TITLE_CONFIDENCE = 0.9;
const MAX_COMPLETED_EVENT_DRAIN = 100;
const THREAD_LIST_PAGE_SIZE = 100;
const RECONCILIATION_CONCURRENCY = 4;
const RECONCILIATION_INTERVAL_MS = 5 * 60_000;
const RECONCILIATION_RETRY_DELAYS_MS = [100, 500] as const;
const SECTION_CLASSIFIER_VERSION = 2;

type Thread = Awaited<ReturnType<BbPluginApi["sdk"]["threads"]["update"]>>;
type ThreadSeed = Pick<Thread, "createdAt" | "sectionId" | "title">;
type EvaluationPhase = "active" | "created" | "settings" | "turn";

interface SectionClassificationCache {
  classifierVersion: number;
  completedTurns: number;
  contextAvailable: boolean;
  decision: SectionClassification | null;
  evaluatedAt: number;
}

interface ThreadState {
  completedTurns: number;
  createdAt: number;
  hasAppliedSection: boolean;
  hasAppliedTitle: boolean;
  inboxManagedPinnedAt: number | null;
  inboxObservedPinned: boolean;
  inboxPendingPin: boolean;
  inboxPendingUnpin: boolean;
  inboxLastPhase: "active" | "failed" | "idle" | null;
  inboxSnoozed: boolean;
  lastAppliedSectionId: string | null;
  lastAppliedTitle: string | null;
  lastCompletedSeq: number;
  nextEvaluationTurn: number;
  pendingSectionId: string | null;
  pendingSectionStreak: number;
  sectionClassification: SectionClassificationCache | null;
  sectionLocked: boolean;
  titleLocked: boolean;
  version: 1;
}

function stateKey(threadId: string): string {
  return `${STATE_PREFIX}${threadId}`;
}

function initialState(thread: ThreadSeed): ThreadState {
  return {
    completedTurns: 0,
    createdAt: thread.createdAt,
    hasAppliedSection: false,
    hasAppliedTitle: false,
    inboxManagedPinnedAt: null,
    inboxObservedPinned: false,
    inboxPendingPin: false,
    inboxPendingUnpin: false,
    inboxLastPhase: null,
    inboxSnoozed: false,
    lastAppliedSectionId: null,
    lastAppliedTitle: null,
    lastCompletedSeq: 0,
    nextEvaluationTurn: 1,
    pendingSectionId: null,
    pendingSectionStreak: 0,
    sectionClassification: null,
    sectionLocked: thread.sectionId !== null,
    titleLocked: thread.title !== null,
    version: 1,
  };
}

function isThreadState(value: unknown): value is ThreadState {
  if (typeof value !== "object" || value === null) return false;
  const state = value as Partial<ThreadState>;
  return (
    state.version === 1 &&
    typeof state.completedTurns === "number" &&
    typeof state.createdAt === "number" &&
    typeof state.hasAppliedSection === "boolean" &&
    typeof state.hasAppliedTitle === "boolean" &&
    (typeof state.inboxManagedPinnedAt === "number" ||
      state.inboxManagedPinnedAt === null ||
      state.inboxManagedPinnedAt === undefined) &&
    (typeof state.inboxObservedPinned === "boolean" ||
      state.inboxObservedPinned === undefined) &&
    (typeof state.inboxPendingPin === "boolean" ||
      state.inboxPendingPin === undefined) &&
    (typeof state.inboxPendingUnpin === "boolean" ||
      state.inboxPendingUnpin === undefined) &&
    (state.inboxLastPhase === "active" ||
      state.inboxLastPhase === "failed" ||
      state.inboxLastPhase === "idle" ||
      state.inboxLastPhase === null ||
      state.inboxLastPhase === undefined) &&
    (typeof state.inboxSnoozed === "boolean" ||
      state.inboxSnoozed === undefined) &&
    (typeof state.lastAppliedSectionId === "string" ||
      state.lastAppliedSectionId === null) &&
    (typeof state.lastAppliedTitle === "string" ||
      state.lastAppliedTitle === null) &&
    typeof state.lastCompletedSeq === "number" &&
    typeof state.nextEvaluationTurn === "number" &&
    (typeof state.pendingSectionId === "string" ||
      state.pendingSectionId === null) &&
    typeof state.pendingSectionStreak === "number" &&
    (state.sectionClassification === undefined ||
      state.sectionClassification === null ||
      (typeof state.sectionClassification === "object" &&
        typeof state.sectionClassification.classifierVersion === "number" &&
        typeof state.sectionClassification.completedTurns === "number" &&
        typeof state.sectionClassification.contextAvailable === "boolean" &&
        (state.sectionClassification.decision === null ||
          typeof state.sectionClassification.decision === "object") &&
        typeof state.sectionClassification.evaluatedAt === "number")) &&
    typeof state.sectionLocked === "boolean" &&
    typeof state.titleLocked === "boolean"
  );
}

function normalizeThreadState(state: ThreadState): ThreadState {
  return {
    ...state,
    inboxManagedPinnedAt: state.inboxManagedPinnedAt ?? null,
    inboxObservedPinned: state.inboxObservedPinned ?? false,
    inboxPendingPin: state.inboxPendingPin ?? false,
    inboxPendingUnpin: state.inboxPendingUnpin ?? false,
    inboxLastPhase: state.inboxLastPhase ?? null,
    inboxSnoozed: state.inboxSnoozed ?? false,
    sectionClassification: state.sectionClassification ?? null,
  };
}

function syncManualLocks(state: ThreadState, thread: Thread): boolean {
  let changed = false;
  if (!state.titleLocked) {
    const externalTitle =
      state.hasAppliedTitle
        ? thread.title !== state.lastAppliedTitle
        : thread.title !== null;
    if (externalTitle) {
      state.titleLocked = true;
      changed = true;
    }
  }
  if (!state.sectionLocked) {
    const externalSection =
      state.hasAppliedSection
        ? thread.sectionId !== state.lastAppliedSectionId
        : thread.sectionId !== null;
    if (externalSection) {
      state.sectionLocked = true;
      changed = true;
    }
  }
  return changed;
}

function promptTexts(
  history: Awaited<
    ReturnType<BbPluginApi["sdk"]["threads"]["promptHistory"]>
  >,
): string[] {
  return [...history]
    .sort((left, right) => left.createdAt - right.createdAt)
    .flatMap((entry) =>
      entry.input.flatMap((item) =>
        item.type === "text" && item.visibility !== "agent-only"
          ? [item.text]
          : [],
      ),
    );
}

function mostRecentSubstantiveText(texts: string[]): string | null {
  for (let index = texts.length - 1; index >= 0; index -= 1) {
    const text = texts[index]!;
    if (isSubstantiveText(text)) return text;
  }
  return null;
}

function classificationSummary(decision: SectionClassification): string {
  return [
    `target=${decision.target}`,
    `confidence=${decision.confidence.toFixed(2)}`,
    `margin=${decision.margin.toFixed(2)}`,
    `reason=${decision.reasons.join(",")}`,
  ].join(" ");
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function abortableDelay(
  milliseconds: number,
  signal: AbortSignal,
): Promise<void> {
  if (signal.aborted) return Promise.resolve();
  return new Promise((resolve) => {
    const timeout = setTimeout(finish, milliseconds);
    signal.addEventListener("abort", finish, { once: true });

    function finish(): void {
      clearTimeout(timeout);
      signal.removeEventListener("abort", finish);
      resolve();
    }
  });
}

export default function plugin(bb: BbPluginApi): void {
  const settings = bb.settings.define({
    inboxMode: {
      type: "select",
      label: "Mode",
      description:
        "Apply organizes threads automatically. Observe only logs proposed changes.",
      options: ["observe", "apply"],
      default: "apply",
    },
  });
  const queues = new Map<string, Promise<void>>();
  let acceptingWork = true;
  let disposed = false;

  async function readState(threadId: string): Promise<ThreadState | null> {
    const stored = await bb.storage.kv.get<unknown>(stateKey(threadId));
    if (stored === undefined) return null;
    if (isThreadState(stored)) return normalizeThreadState(stored);
    bb.log.warn(`thread=${threadId} action=ignore-invalid-state`);
    return null;
  }

  async function saveState(
    threadId: string,
    state: ThreadState,
  ): Promise<void> {
    await bb.storage.kv.set(stateKey(threadId), state);
  }

  function enqueue(
    threadId: string,
    work: () => Promise<void>,
    containErrors = true,
  ): Promise<void> {
    if (!acceptingWork) return Promise.resolve();
    const previous = queues.get(threadId) ?? Promise.resolve();
    const workPromise = previous
      .catch(() => undefined)
      .then(async () => {
        if (!disposed) await work();
      });
    const contained = containErrors
      ? workPromise.catch((error: unknown) => {
          const message =
            error instanceof Error ? error.message : String(error);
          bb.log.error(
            `thread=${threadId} action=queue-failed error=${message}`,
          );
        })
      : workPromise;
    const current = contained
      .finally(() => {
        if (queues.get(threadId) === current) queues.delete(threadId);
      });
    queues.set(threadId, current);
    return current;
  }

  async function loadContextTexts(
    thread: Thread,
    attempts: number,
  ): Promise<string[]> {
    let loaded: string[] = [];
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      try {
        loaded = promptTexts(
          await bb.sdk.threads.promptHistory({
            threadId: thread.id,
            limit: "6",
          }),
        );
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        bb.log.debug(
          `thread=${thread.id} action=prompt-history-unavailable attempt=${attempt + 1} error=${message}`,
        );
      }
      if (loaded.some(isSubstantiveText) || attempt === attempts - 1) break;
      await delay(attempt === 0 ? 150 : 600);
    }
    return loaded;
  }

  async function reconcileInbox(
    thread: Thread,
    state: ThreadState,
    phase: "active" | "failed" | "idle",
    signal?: AbortSignal,
    runStartPinnedAt?: number | null,
  ): Promise<void> {
    const { inboxMode } = await settings.get();
    if (signal?.aborted) return;
    const threadId = thread.id;
    const startedNewRun =
      phase === "active" && state.inboxLastPhase !== "active";
    if (
      startedNewRun &&
      thread.pinnedAt === null &&
      state.inboxObservedPinned &&
      runStartPinnedAt === undefined
    ) {
      bb.log.debug(
        `thread=${threadId} phase=${phase} action=await-run-start-pin-observation`,
      );
      return;
    }
    state.inboxLastPhase = phase;
    if (startedNewRun) state.inboxSnoozed = false;

    if (state.inboxPendingPin && thread.pinnedAt !== null) {
      state.inboxManagedPinnedAt = null;
      state.inboxObservedPinned = true;
      state.inboxPendingPin = false;
      bb.log.warn(
        `thread=${threadId} phase=${phase} action=inbox-pin-ownership-ambiguous`,
      );
    }

    let recoveredManagedUnpin = false;
    if (state.inboxPendingUnpin && thread.pinnedAt === null) {
      state.inboxManagedPinnedAt = null;
      state.inboxObservedPinned = false;
      state.inboxPendingUnpin = false;
      recoveredManagedUnpin = true;
      bb.log.info(
        `thread=${threadId} phase=${phase} action=inbox-unpin-adopted`,
      );
    }

    if (
      thread.pinnedAt === null &&
      state.inboxObservedPinned &&
      !recoveredManagedUnpin
    ) {
      state.inboxManagedPinnedAt = null;
      state.inboxObservedPinned = false;
      state.inboxPendingPin = false;
      state.inboxPendingUnpin = false;
      if (startedNewRun && runStartPinnedAt === null) {
        bb.log.info(
          `thread=${threadId} phase=${phase} action=prior-run-unpin-observed`,
        );
      } else {
        state.inboxSnoozed = true;
        bb.log.info(
          `thread=${threadId} phase=${phase} action=inbox-snoozed`,
        );
      }
    }

    if (phase !== "active") {
      if (thread.pinnedAt !== null) {
        if (
          state.inboxManagedPinnedAt !== null &&
          state.inboxManagedPinnedAt !== thread.pinnedAt
        ) {
          state.inboxManagedPinnedAt = null;
        }
        state.inboxObservedPinned = true;
        return;
      }
      if (state.inboxSnoozed) return;
      if (inboxMode !== "apply") {
        bb.log.info(
          `thread=${threadId} phase=${phase} mode=observe action=propose-inbox-pin`,
        );
        return;
      }
      if (signal?.aborted) return;
      if (!state.inboxPendingPin) {
        state.inboxPendingPin = true;
        await saveState(threadId, state);
      }
      if (signal?.aborted) return;
      let pinned: Thread;
      try {
        pinned = await bb.sdk.threads.pin({ threadId });
      } catch (error: unknown) {
        const fresh = (await bb.sdk.threads.get({ threadId })) as Thread;
        state.inboxPendingPin = false;
        if (fresh.pinnedAt === null) {
          state.inboxManagedPinnedAt = null;
          state.inboxObservedPinned = false;
        } else {
          state.inboxManagedPinnedAt = null;
          state.inboxObservedPinned = true;
        }
        await saveState(threadId, state);
        throw error;
      }
      state.inboxManagedPinnedAt = pinned.pinnedAt;
      state.inboxObservedPinned = true;
      state.inboxPendingPin = false;
      bb.log.info(
        `thread=${threadId} phase=${phase} mode=apply action=inbox-pinned`,
      );
      return;
    }

    if (thread.pinnedAt === null) {
      state.inboxManagedPinnedAt = null;
      state.inboxObservedPinned = false;
      state.inboxPendingPin = false;
      state.inboxPendingUnpin = false;
      return;
    }
    state.inboxObservedPinned = true;
    if (state.inboxManagedPinnedAt !== thread.pinnedAt) {
      state.inboxManagedPinnedAt = null;
      return;
    }
    if (inboxMode !== "apply") {
      bb.log.info(
        `thread=${threadId} phase=${phase} mode=observe action=propose-inbox-unpin`,
      );
      return;
    }
    if (signal?.aborted) return;
    if (!state.inboxPendingUnpin) {
      state.inboxPendingUnpin = true;
      await saveState(threadId, state);
    }
    if (signal?.aborted) return;
    try {
      await bb.sdk.threads.unpin({ threadId });
    } catch (error: unknown) {
      const fresh = (await bb.sdk.threads.get({ threadId })) as Thread;
      state.inboxPendingUnpin = false;
      if (fresh.pinnedAt === null) {
        state.inboxManagedPinnedAt = null;
        state.inboxObservedPinned = false;
        state.inboxSnoozed = true;
      } else {
        if (fresh.pinnedAt !== state.inboxManagedPinnedAt) {
          state.inboxManagedPinnedAt = null;
        }
        state.inboxObservedPinned = true;
      }
      await saveState(threadId, state);
      throw error;
    }
    state.inboxManagedPinnedAt = null;
    state.inboxObservedPinned = false;
    state.inboxPendingUnpin = false;
    bb.log.info(
      `thread=${threadId} phase=${phase} mode=apply action=inbox-unpinned`,
    );
  }

  async function applySection(
    thread: Thread,
    state: ThreadState,
    phase: EvaluationPhase,
    decision: SectionClassification,
    targetSectionId: string,
    mode: string,
  ): Promise<void> {
    if (state.sectionLocked) return;

    const movingManagedSection = thread.sectionId !== null;
    if (
      movingManagedSection &&
      (!state.hasAppliedSection || phase !== "turn")
    ) {
      return;
    }
    const minimumConfidence = movingManagedSection
      ? MOVE_SECTION_CONFIDENCE
      : NEW_SECTION_CONFIDENCE;
    const minimumMargin = movingManagedSection
      ? MOVE_SECTION_MARGIN
      : NEW_SECTION_MARGIN;
    if (
      decision.confidence < minimumConfidence ||
      decision.margin < minimumMargin
    ) {
      state.pendingSectionId = null;
      state.pendingSectionStreak = 0;
      return;
    }
    if (thread.sectionId === targetSectionId) {
      state.pendingSectionId = null;
      state.pendingSectionStreak = 0;
      return;
    }

    if (movingManagedSection) {
      if (state.pendingSectionId === targetSectionId) {
        state.pendingSectionStreak += 1;
      } else {
        state.pendingSectionId = targetSectionId;
        state.pendingSectionStreak = 1;
      }
      if (state.pendingSectionStreak < 2) return;
    }

    if (mode !== "apply") {
      bb.log.info(
        `thread=${thread.id} phase=${phase} mode=observe action=propose-section ${classificationSummary(decision)}`,
      );
      return;
    }

    const fresh = (await bb.sdk.threads.get({
      threadId: thread.id,
    })) as Thread;
    syncManualLocks(state, fresh);
    if (
      state.sectionLocked ||
      !isEligibleThread(fresh) ||
      fresh.sectionId !== thread.sectionId
    ) {
      return;
    }
    const updated = await bb.sdk.threads.update({
      threadId: thread.id,
      sectionId: targetSectionId,
    });
    state.hasAppliedSection = true;
    state.lastAppliedSectionId = updated.sectionId;
    state.pendingSectionId = null;
    state.pendingSectionStreak = 0;
    bb.log.info(
      `thread=${thread.id} phase=${phase} mode=apply action=section-updated ${classificationSummary(decision)}`,
    );
  }

  async function applyTitle(
    thread: Thread,
    state: ThreadState,
    phase: EvaluationPhase,
    texts: string[],
    mode: string,
  ): Promise<void> {
    if (phase !== "turn" || state.titleLocked || thread.title !== null) return;
    const source =
      texts.find(isSubstantiveText) ?? thread.titleFallback ?? undefined;
    if (source === undefined) return;
    const candidate = deriveTaskTitle(source);
    if (candidate === null || candidate.confidence < TITLE_CONFIDENCE) return;

    if (mode !== "apply") {
      bb.log.info(
        `thread=${thread.id} phase=${phase} mode=observe action=propose-title confidence=${candidate.confidence.toFixed(2)} title=${JSON.stringify(candidate.title)}`,
      );
      return;
    }

    const fresh = (await bb.sdk.threads.get({
      threadId: thread.id,
    })) as Thread;
    syncManualLocks(state, fresh);
    if (state.titleLocked || !isEligibleThread(fresh) || fresh.title !== null) {
      return;
    }
    const updated = await bb.sdk.threads.update({
      threadId: thread.id,
      title: candidate.title,
    });
    state.hasAppliedTitle = true;
    state.lastAppliedTitle = updated.title;
    bb.log.info(
      `thread=${thread.id} phase=${phase} mode=apply action=title-updated confidence=${candidate.confidence.toFixed(2)} title=${JSON.stringify(candidate.title)}`,
    );
  }

  async function evaluate(
    threadId: string,
    phase: EvaluationPhase,
    signal?: AbortSignal,
  ): Promise<void> {
    const state = await readState(threadId);
    if (state === null) return;
    if (signal?.aborted) return;
    const thread = (await bb.sdk.threads.get({ threadId })) as Thread;
    if (signal?.aborted) return;
    const locksChanged = syncManualLocks(state, thread);
    if (locksChanged) {
      bb.log.info(
        `thread=${threadId} action=manual-lock title=${state.titleLocked} section=${state.sectionLocked}`,
      );
    }
    if (thread.archivedAt !== null || thread.deletedAt !== null) {
      await bb.storage.kv.delete(stateKey(threadId));
      return;
    }
    if (!isEligibleThread(thread)) {
      await saveState(threadId, state);
      return;
    }

    const { inboxMode } = await settings.get();
    if (signal?.aborted) return;
    const movingManagedSection =
      state.hasAppliedSection && thread.sectionId !== null;
    const canManageSection =
      !state.sectionLocked &&
      (!movingManagedSection || phase === "turn");
    const cachedClassification = state.sectionClassification;
    const needsClassification =
      canManageSection &&
      (cachedClassification === null ||
        cachedClassification.classifierVersion !== SECTION_CLASSIFIER_VERSION ||
        (phase === "active" &&
          (!cachedClassification.contextAvailable ||
            cachedClassification.decision === null)) ||
        (phase === "turn" &&
          cachedClassification.completedTurns < state.completedTurns));
    const needsHistory = needsClassification || phase === "turn";
    const historyTexts = needsHistory
      ? await loadContextTexts(
          thread,
          phase === "active" || phase === "created" ? 3 : 1,
        )
      : [];
    if (signal?.aborted) return;
    const texts = [
      ...(thread.title === null ? [] : [thread.title]),
      ...(thread.titleFallback === null ? [] : [thread.titleFallback]),
      ...historyTexts,
    ];
    const latestPromptText = mostRecentSubstantiveText(historyTexts);
    const sectionTexts =
      phase === "turn" &&
      state.hasAppliedSection &&
      thread.sectionId !== null
        ? latestPromptText === null
          ? []
          : [latestPromptText]
        : texts;

    if (canManageSection) {
      try {
        let decision = cachedClassification?.decision ?? null;
        if (needsClassification) {
          const projectName =
            thread.projectId === PERSONAL_PROJECT_ID
              ? "Personal"
              : (
                  await bb.sdk.projects.get({
                    projectId: thread.projectId,
                  })
                ).name;
          decision = classifySection({
            projectName,
            texts: sectionTexts,
          });
          state.sectionClassification = {
            classifierVersion: SECTION_CLASSIFIER_VERSION,
            completedTurns: state.completedTurns,
            contextAvailable: sectionTexts.some(isSubstantiveText),
            decision,
            evaluatedAt: Date.now(),
          };
          bb.log.info(
            decision === null
              ? `thread=${threadId} phase=${phase} action=section-classified target=none`
              : `thread=${threadId} phase=${phase} action=section-classified ${classificationSummary(decision)}`,
          );
        } else {
          bb.log.debug(
            `thread=${threadId} phase=${phase} action=section-cache-hit target=${decision?.target ?? "none"}`,
          );
        }
        if (decision !== null) {
          const sectionId = resolveSectionId(
            await bb.sdk.threadSections.list(),
            decision.target,
          );
          if (sectionId === null) {
            bb.log.warn(
              `thread=${threadId} phase=${phase} action=section-unavailable target=${decision.target}`,
            );
          } else {
            await applySection(
              thread,
              state,
              phase,
              decision,
              sectionId,
              inboxMode,
            );
          }
        } else {
          state.pendingSectionId = null;
          state.pendingSectionStreak = 0;
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        bb.log.warn(
          `thread=${threadId} phase=${phase} action=section-evaluation-failed error=${message}`,
        );
      }
    }

    try {
      await applyTitle(thread, state, phase, historyTexts, inboxMode);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      bb.log.warn(
        `thread=${threadId} phase=${phase} action=title-evaluation-failed error=${message}`,
      );
    }
    await saveState(threadId, state);
  }

  async function consumeCompletedTurns(
    threadId: string,
    state: ThreadState,
  ): Promise<void> {
    let drained = 0;
    while (drained < MAX_COMPLETED_EVENT_DRAIN) {
      const event = await bb.sdk.threads.events.wait({
        threadId,
        type: "turn/completed",
        waitMs: "1",
        ...(state.lastCompletedSeq === 0
          ? {}
          : { afterSeq: String(state.lastCompletedSeq) }),
      });
      if (event === null) break;
      state.lastCompletedSeq = event.seq;
      if (
        event.type === "turn/completed" &&
        event.data.status === "completed"
      ) {
        state.completedTurns += 1;
      }
      drained += 1;
    }
    if (drained === MAX_COMPLETED_EVENT_DRAIN) {
      bb.log.warn(
        `thread=${threadId} action=turn-drain-capped limit=${MAX_COMPLETED_EVENT_DRAIN}`,
      );
    }
  }

  function inboxPhase(thread: Thread): "active" | "failed" | "idle" {
    if (thread.status === "idle") return "idle";
    if (thread.status === "error") return "failed";
    return "active";
  }

  async function reconcileManagedThread(
    threadId: string,
    signal?: AbortSignal,
  ): Promise<void> {
    if (signal?.aborted) return;
    const fresh = (await bb.sdk.threads.get({ threadId })) as Thread;
    if (signal?.aborted) return;
    if (!isManageableThread(fresh)) {
      if (!signal?.aborted) {
        await bb.storage.kv.delete(stateKey(threadId));
      }
      return;
    }
    let state = await readState(threadId);
    if (signal?.aborted) return;
    const adopted = state === null;
    if (state === null) {
      state = initialState(fresh);
    }
    if (signal?.aborted) return;
    await reconcileInbox(fresh, state, inboxPhase(fresh), signal);
    if (signal?.aborted) return;
    await saveState(threadId, state);
    if (
      isEligibleThread(fresh) &&
      (adopted ||
        state.sectionClassification?.classifierVersion !==
          SECTION_CLASSIFIER_VERSION)
    ) {
      await evaluate(threadId, "settings", signal);
    }
  }

  async function discoverThreadIds(signal: AbortSignal): Promise<string[]> {
    const discovered = new Set<string>();
    let foundNewIds = true;
    while (foundNewIds && !disposed && !signal.aborted) {
      foundNewIds = false;
      let offset = 0;
      while (!disposed && !signal.aborted) {
        const page = await bb.sdk.threads.list({
          archived: false,
          excludeSideChats: true,
          hasParent: false,
          limit: THREAD_LIST_PAGE_SIZE,
          offset,
          signal,
        });
        for (const thread of page) {
          if (!discovered.has(thread.id)) {
            discovered.add(thread.id);
            foundNewIds = true;
          }
        }
        if (page.length < THREAD_LIST_PAGE_SIZE) break;
        offset += THREAD_LIST_PAGE_SIZE;
      }
    }
    return [...discovered];
  }

  async function reconcileWithRetry(
    threadId: string,
    signal: AbortSignal,
  ): Promise<void> {
    for (
      let attempt = 0;
      attempt <= RECONCILIATION_RETRY_DELAYS_MS.length;
      attempt += 1
    ) {
      if (signal.aborted) return;
      try {
        await enqueue(
          threadId,
          () => reconcileManagedThread(threadId, signal),
          false,
        );
        return;
      } catch (error: unknown) {
        if (signal.aborted) return;
        const retryDelay = RECONCILIATION_RETRY_DELAYS_MS[attempt];
        if (retryDelay === undefined) throw error;
        const message =
          error instanceof Error ? error.message : String(error);
        bb.log.warn(
          `thread=${threadId} action=reconciliation-retry attempt=${attempt + 1} error=${message}`,
        );
        await abortableDelay(retryDelay, signal);
      }
    }
  }

  async function reconcileExistingThreads(signal: AbortSignal): Promise<void> {
    const threadIds = await discoverThreadIds(signal);
    let nextIndex = 0;
    let firstError: unknown;
    const workerCount = Math.min(
      RECONCILIATION_CONCURRENCY,
      threadIds.length,
    );
    const workers = Array.from({ length: workerCount }, async () => {
      while (!signal.aborted && firstError === undefined) {
        const threadId = threadIds[nextIndex];
        nextIndex += 1;
        if (threadId === undefined || signal.aborted) return;
        try {
          await reconcileWithRetry(threadId, signal);
        } catch (error: unknown) {
          firstError ??= error;
        }
      }
    });
    await Promise.all(workers);
    if (firstError !== undefined) throw firstError;
  }

  bb.events.on("thread.created", ({ thread }) =>
    enqueue(thread.id, async () => {
      if (!isEligibleThread(thread)) return;
      if ((await readState(thread.id)) !== null) return;
      await saveState(thread.id, initialState(thread));
      await evaluate(thread.id, "created");
    }),
  );

  bb.events.on("thread.active", ({ thread }) =>
    enqueue(thread.id, async () => {
      await evaluate(thread.id, "active");
      const state = await readState(thread.id);
      if (state === null) return;
      const fresh = (await bb.sdk.threads.get({
        threadId: thread.id,
      })) as Thread;
      if (!isManageableThread(fresh)) {
        await bb.storage.kv.delete(stateKey(thread.id));
        return;
      }
      await reconcileInbox(
        fresh,
        state,
        inboxPhase(fresh),
        undefined,
        thread.pinnedAt,
      );
      await saveState(thread.id, state);
    }),
  );

  bb.events.on("thread.idle", ({ thread }) =>
    enqueue(thread.id, async () => {
      const state = await readState(thread.id);
      if (state === null) return;
      try {
        await consumeCompletedTurns(thread.id, state);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        bb.log.warn(
          `thread=${thread.id} action=turn-count-failed error=${message}`,
        );
      }
      const due = state.completedTurns >= state.nextEvaluationTurn;
      if (due) {
        state.nextEvaluationTurn = advanceEvaluationMilestone(
          state.nextEvaluationTurn,
          state.completedTurns,
        );
      }
      const fresh = (await bb.sdk.threads.get({
        threadId: thread.id,
      })) as Thread;
      if (!isManageableThread(fresh)) {
        await bb.storage.kv.delete(stateKey(thread.id));
        return;
      }
      await reconcileInbox(fresh, state, inboxPhase(fresh));
      await saveState(thread.id, state);
      if (due) await evaluate(thread.id, "turn");
    }),
  );

  bb.events.on("thread.failed", ({ thread }) =>
    enqueue(thread.id, async () => {
      const state = await readState(thread.id);
      if (state === null) return;
      const fresh = (await bb.sdk.threads.get({
        threadId: thread.id,
      })) as Thread;
      if (!isManageableThread(fresh)) {
        await bb.storage.kv.delete(stateKey(thread.id));
        return;
      }
      await reconcileInbox(fresh, state, inboxPhase(fresh));
      await saveState(thread.id, state);
    }),
  );

  const forget = (threadId: string) =>
    enqueue(threadId, async () => {
      await bb.storage.kv.delete(stateKey(threadId));
    });
  bb.events.on("thread.archived", ({ thread }) => forget(thread.id));
  bb.events.on("thread.deleted", ({ thread }) => forget(thread.id));

  let unsubscribeThreadChanges: () => void = () => undefined;
  try {
    unsubscribeThreadChanges = bb.sdk.subscribe({
      event: "thread:changed",
      callback(event) {
        const threadId = event.id;
        if (
          threadId === undefined ||
          (!event.changes.includes("pin-state-changed") &&
            !event.changes.includes("status-changed"))
        ) {
          return;
        }
        void enqueue(threadId, () => reconcileManagedThread(threadId));
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    bb.log.warn(`action=realtime-subscribe-failed error=${message}`);
  }

  settings.onChange((next, previous) => {
    if (next.inboxMode === previous.inboxMode) return;
    bb.log.info(
      `action=mode-changed previous=${previous.inboxMode} next=${next.inboxMode}`,
    );
    if (next.inboxMode !== "apply") return;
    void bb.storage.kv
      .list(STATE_PREFIX)
      .then(async (keys) => {
        for (const key of keys) {
          const threadId = key.slice(STATE_PREFIX.length);
          await enqueue(threadId, async () => {
            const state = await readState(threadId);
            if (state === null) return;
            const thread = (await bb.sdk.threads.get({
              threadId,
            })) as Thread;
            if (!isManageableThread(thread)) {
              await bb.storage.kv.delete(stateKey(threadId));
              return;
            }
            await reconcileInbox(thread, state, inboxPhase(thread));
            await saveState(threadId, state);
            await evaluate(threadId, "settings");
          });
        }
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : String(error);
        bb.log.error(`action=apply-mode-evaluation-failed error=${message}`);
      });
  });

  bb.background.service("inbox-reconciliation", {
    async start(signal) {
      while (!signal.aborted) {
        await reconcileExistingThreads(signal);
        if (signal.aborted) return;
        await abortableDelay(RECONCILIATION_INTERVAL_MS, signal);
      }
    },
  });

  bb.onDispose(async () => {
    acceptingWork = false;
    unsubscribeThreadChanges();
    await Promise.allSettled([...queues.values()]);
    disposed = true;
  });
  void settings
    .get()
    .then(({ inboxMode }) =>
      bb.log.info(`Thread Organizer loaded mode=${inboxMode}`),
    )
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      bb.log.warn(`action=mode-read-failed error=${message}`);
    });
}
