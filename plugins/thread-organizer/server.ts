import type { BbPluginApi } from "@bb/plugin-sdk";

import {
  advanceEvaluationMilestone,
  classifySection,
  deriveTaskTitle,
  isEligibleThread,
  isSubstantiveText,
  resolveSectionId,
  type SectionClassification,
} from "./core.js";

const STATE_PREFIX = "thread:v1:";
const NEW_SECTION_CONFIDENCE = 0.85;
const NEW_SECTION_MARGIN = 0.2;
const MOVE_SECTION_CONFIDENCE = 0.92;
const MOVE_SECTION_MARGIN = 0.25;
const TITLE_CONFIDENCE = 0.9;
const MAX_COMPLETED_EVENT_DRAIN = 100;

type Thread = Awaited<ReturnType<BbPluginApi["sdk"]["threads"]["update"]>>;
type EvaluationPhase = "active" | "created" | "settings" | "turn";

interface ThreadState {
  completedTurns: number;
  createdAt: number;
  hasAppliedSection: boolean;
  hasAppliedTitle: boolean;
  lastAppliedSectionId: string | null;
  lastAppliedTitle: string | null;
  lastCompletedSeq: number;
  nextEvaluationTurn: number;
  pendingSectionId: string | null;
  pendingSectionStreak: number;
  sectionLocked: boolean;
  titleLocked: boolean;
  version: 1;
}

function stateKey(threadId: string): string {
  return `${STATE_PREFIX}${threadId}`;
}

function initialState(thread: Thread): ThreadState {
  return {
    completedTurns: 0,
    createdAt: thread.createdAt,
    hasAppliedSection: false,
    hasAppliedTitle: false,
    lastAppliedSectionId: null,
    lastAppliedTitle: null,
    lastCompletedSeq: 0,
    nextEvaluationTurn: 1,
    pendingSectionId: null,
    pendingSectionStreak: 0,
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
    (typeof state.lastAppliedSectionId === "string" ||
      state.lastAppliedSectionId === null) &&
    (typeof state.lastAppliedTitle === "string" ||
      state.lastAppliedTitle === null) &&
    typeof state.lastCompletedSeq === "number" &&
    typeof state.nextEvaluationTurn === "number" &&
    (typeof state.pendingSectionId === "string" ||
      state.pendingSectionId === null) &&
    typeof state.pendingSectionStreak === "number" &&
    typeof state.sectionLocked === "boolean" &&
    typeof state.titleLocked === "boolean"
  );
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

export default function plugin(bb: BbPluginApi): void {
  const settings = bb.settings.define({
    mode: {
      type: "select",
      label: "Mode",
      description:
        "Observe logs recommendations without changing threads. Apply enables high-confidence updates.",
      options: ["observe", "apply"],
      default: "observe",
    },
  });
  const queues = new Map<string, Promise<void>>();
  let disposed = false;

  async function readState(threadId: string): Promise<ThreadState | null> {
    const stored = await bb.storage.kv.get<unknown>(stateKey(threadId));
    if (stored === undefined) return null;
    if (isThreadState(stored)) return stored;
    bb.log.warn(`thread=${threadId} action=ignore-invalid-state`);
    return null;
  }

  async function saveState(
    threadId: string,
    state: ThreadState,
  ): Promise<void> {
    await bb.storage.kv.set(stateKey(threadId), state);
  }

  function enqueue(threadId: string, work: () => Promise<void>): Promise<void> {
    const previous = queues.get(threadId) ?? Promise.resolve();
    const current = previous
      .catch(() => undefined)
      .then(async () => {
        if (!disposed) await work();
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : String(error);
        bb.log.error(`thread=${threadId} action=queue-failed error=${message}`);
      })
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
      if (!state.hasAppliedSection || phase !== "turn") return;
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
  ): Promise<void> {
    const state = await readState(threadId);
    if (state === null) return;
    const thread = (await bb.sdk.threads.get({ threadId })) as Thread;
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

    const attempts = phase === "active" ? 3 : 1;
    const historyTexts = await loadContextTexts(thread, attempts);
    const texts = [
      ...(thread.title === null ? [] : [thread.title]),
      ...(thread.titleFallback === null ? [] : [thread.titleFallback]),
      ...historyTexts,
    ];
    const { mode } = await settings.get();

    if (!state.sectionLocked) {
      try {
        const project = await bb.sdk.projects.get({
          projectId: thread.projectId,
        });
        const decision = classifySection({
          projectName: project.name,
          texts,
        });
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
              mode,
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
      await applyTitle(thread, state, phase, historyTexts, mode);
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
      if ((await readState(thread.id)) === null) return;
      await evaluate(thread.id, "active");
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
      await saveState(thread.id, state);
      if (due) await evaluate(thread.id, "turn");
    }),
  );

  const forget = (threadId: string) =>
    enqueue(threadId, async () => {
      await bb.storage.kv.delete(stateKey(threadId));
    });
  bb.events.on("thread.archived", ({ thread }) => forget(thread.id));
  bb.events.on("thread.deleted", ({ thread }) => forget(thread.id));

  settings.onChange((next, previous) => {
    if (next.mode === previous.mode) return;
    bb.log.info(`action=mode-changed previous=${previous.mode} next=${next.mode}`);
    if (next.mode !== "apply") return;
    void bb.storage.kv
      .list(STATE_PREFIX)
      .then((keys) =>
        Promise.all(
          keys.map((key) =>
            enqueue(key.slice(STATE_PREFIX.length), () =>
              evaluate(key.slice(STATE_PREFIX.length), "settings"),
            ),
          ),
        ),
      )
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : String(error);
        bb.log.error(`action=apply-mode-evaluation-failed error=${message}`);
      });
  });

  bb.onDispose(() => {
    disposed = true;
  });
  void settings
    .get()
    .then(({ mode }) => bb.log.info(`Thread Organizer loaded mode=${mode}`))
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      bb.log.warn(`action=mode-read-failed error=${message}`);
    });
}
