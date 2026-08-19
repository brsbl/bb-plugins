import type { BbPluginApi } from "@get-bb/plugin-sdk";

import {
  PHASE_SECTION_NAMES,
  advanceEvaluationMilestone,
  classifyPhase,
  deriveTaskTitle,
  isEligibleThread,
  isManageableThread,
  isSubstantiveText,
  parsePhaseTarget,
  resolvePhaseSectionId,
  type PhaseClassification,
  type PhaseTarget,
} from "./core.js";

const STATE_PREFIX = "thread:v1:";
const OWNED_SECTIONS_KEY = "sections:v1";
const THREAD_LIST_PAGE_SIZE = 100;
const RECONCILIATION_INTERVAL_MS = 5 * 60_000;
const MAX_COMPLETED_EVENT_DRAIN = 100;
const CLASSIFIER_VERSION = 3;

type Thread = Awaited<ReturnType<BbPluginApi["sdk"]["threads"]["update"]>>;
type Section = Awaited<
  ReturnType<BbPluginApi["sdk"]["threadSections"]["create"]>
>;

interface ThreadState {
  version: 2;
  completedTurns: number;
  createdAt: number;
  hasAppliedSection: boolean;
  hasAppliedTitle: boolean;
  lastAppliedSectionId: string | null;
  lastAppliedTitle: string | null;
  lastCompletedSeq: number;
  nextEvaluationTurn: number;
  phaseClassification: {
    classifierVersion: number;
    decision: PhaseClassification;
  } | null;
  sectionLocked: boolean;
  titleLocked: boolean;
}

interface LegacyThreadState extends Omit<Partial<ThreadState>, "version"> {
  version?: 1 | 2;
  sectionClassification?: { decision?: unknown } | null;
}

function stateKey(threadId: string): string {
  return `${STATE_PREFIX}${threadId}`;
}

function initialState(
  thread: Pick<Thread, "createdAt" | "sectionId" | "title">,
): ThreadState {
  return {
    version: 2,
    completedTurns: 0,
    createdAt: thread.createdAt,
    hasAppliedSection: false,
    hasAppliedTitle: false,
    lastAppliedSectionId: null,
    lastAppliedTitle: null,
    lastCompletedSeq: 0,
    nextEvaluationTurn: 1,
    phaseClassification: null,
    sectionLocked: thread.sectionId !== null,
    titleLocked: thread.title !== null,
  };
}

function migrateState(value: unknown, thread: Thread): ThreadState {
  if (!value || typeof value !== "object") return initialState(thread);
  const legacy = value as LegacyThreadState;
  const appliedSection = legacy.hasAppliedSection === true;
  return {
    ...initialState(thread),
    completedTurns:
      typeof legacy.completedTurns === "number" ? legacy.completedTurns : 0,
    createdAt:
      typeof legacy.createdAt === "number"
        ? legacy.createdAt
        : thread.createdAt,
    hasAppliedSection: appliedSection,
    hasAppliedTitle: legacy.hasAppliedTitle === true,
    lastAppliedSectionId:
      typeof legacy.lastAppliedSectionId === "string"
        ? legacy.lastAppliedSectionId
        : null,
    lastAppliedTitle:
      typeof legacy.lastAppliedTitle === "string"
        ? legacy.lastAppliedTitle
        : null,
    lastCompletedSeq:
      typeof legacy.lastCompletedSeq === "number" ? legacy.lastCompletedSeq : 0,
    nextEvaluationTurn:
      typeof legacy.nextEvaluationTurn === "number"
        ? legacy.nextEvaluationTurn
        : 1,
    phaseClassification:
      legacy.version === 2 ? (legacy.phaseClassification ?? null) : null,
    sectionLocked:
      legacy.version === 2
        ? legacy.sectionLocked === true
        : appliedSection
          ? false
          : legacy.sectionLocked === true || thread.sectionId !== null,
    titleLocked:
      legacy.version === 2
        ? legacy.titleLocked === true
        : legacy.titleLocked === true ||
          (!legacy.hasAppliedTitle && thread.title !== null),
  };
}

function promptTexts(
  history: Awaited<ReturnType<BbPluginApi["sdk"]["threads"]["promptHistory"]>>,
): string[] {
  return [...history]
    .sort((a, b) => a.createdAt - b.createdAt)
    .flatMap((entry) =>
      entry.input.flatMap((item) =>
        item.type === "text" && item.visibility !== "agent-only"
          ? [item.text]
          : [],
      ),
    );
}

function abortableDelay(ms: number, signal: AbortSignal): Promise<void> {
  if (signal.aborted) return Promise.resolve();
  return new Promise((resolve) => {
    const timer = setTimeout(done, ms);
    signal.addEventListener("abort", done, { once: true });
    function done() {
      clearTimeout(timer);
      signal.removeEventListener("abort", done);
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
  let ownershipQueue: Promise<void> = Promise.resolve();
  let disposed = false;

  async function readState(thread: Thread): Promise<ThreadState> {
    return migrateState(
      await bb.storage.kv.get<unknown>(stateKey(thread.id)),
      thread,
    );
  }
  async function saveState(
    threadId: string,
    state: ThreadState,
  ): Promise<void> {
    await bb.storage.kv.set(stateKey(threadId), state);
  }
  async function ownedSectionIds(): Promise<Set<string>> {
    const stored = await bb.storage.kv.get<unknown>(OWNED_SECTIONS_KEY);
    return new Set(
      Array.isArray(stored)
        ? stored.filter((id): id is string => typeof id === "string")
        : [],
    );
  }
  async function saveOwnedSections(ids: Set<string>): Promise<void> {
    await bb.storage.kv.set(OWNED_SECTIONS_KEY, [...ids].sort());
  }
  async function mutateOwnedSections(
    mutate: (ids: Set<string>) => Promise<void> | void,
  ): Promise<void> {
    const current = ownershipQueue
      .catch(() => undefined)
      .then(async () => {
        const ids = await ownedSectionIds();
        await mutate(ids);
        await saveOwnedSections(ids);
      });
    ownershipQueue = current;
    await current;
  }

  function enqueue(threadId: string, work: () => Promise<void>): Promise<void> {
    const previous = queues.get(threadId) ?? Promise.resolve();
    const current = previous
      .catch(() => undefined)
      .then(async () => {
        if (!disposed) await work();
      })
      .catch((error: unknown) =>
        bb.log.error(
          `thread=${threadId} action=queue-failed error=${error instanceof Error ? error.message : String(error)}`,
        ),
      )
      .finally(() => {
        if (queues.get(threadId) === current) queues.delete(threadId);
      });
    queues.set(threadId, current);
    return current;
  }

  async function ensurePhaseSection(target: PhaseTarget): Promise<Section> {
    const listed = await bb.sdk.threadSections.list();
    const existingId = resolvePhaseSectionId(listed, target);
    if (existingId) return listed.find((section) => section.id === existingId)!;
    try {
      const created = await bb.sdk.threadSections.create({
        name: PHASE_SECTION_NAMES[target],
      });
      await mutateOwnedSections((owned) => {
        owned.add(created.id);
      });
      bb.log.info(
        `action=phase-section-created target=${target} section=${created.id}`,
      );
      return created;
    } catch (error) {
      const raced = await bb.sdk.threadSections.list();
      const racedId = resolvePhaseSectionId(raced, target);
      if (racedId) return raced.find((section) => section.id === racedId)!;
      throw error;
    }
  }

  async function reconcileOwnedSections(): Promise<void> {
    await mutateOwnedSections(async (owned) => {
      if (!owned.size) return;
      const existing = new Set(
        (await bb.sdk.threadSections.list()).map((section) => section.id),
      );
      for (const id of [...owned]) {
        if (!existing.has(id)) owned.delete(id);
      }
    });
  }

  function syncManualLocks(state: ThreadState, thread: Thread): void {
    if (
      !state.titleLocked &&
      (state.hasAppliedTitle
        ? thread.title !== state.lastAppliedTitle
        : thread.title !== null)
    )
      state.titleLocked = true;
    if (
      !state.sectionLocked &&
      (state.hasAppliedSection
        ? thread.sectionId !== state.lastAppliedSectionId
        : thread.sectionId !== null)
    )
      state.sectionLocked = true;
  }

  async function moveToPhase(
    thread: Thread,
    state: ThreadState,
    target: PhaseTarget,
    explicit: boolean,
  ): Promise<Thread> {
    const { inboxMode } = await settings.get();
    if (!explicit && state.sectionLocked) return thread;
    if (inboxMode !== "apply" && !explicit) {
      bb.log.info(
        `thread=${thread.id} mode=observe action=propose-phase target=${target}`,
      );
      return thread;
    }
    const section = await ensurePhaseSection(target);
    if (thread.sectionId === section.id) return thread;
    const fresh = (await bb.sdk.threads.get({ threadId: thread.id })) as Thread;
    if (!explicit) {
      syncManualLocks(state, fresh);
      if (
        state.sectionLocked ||
        !isManageableThread(fresh) ||
        fresh.sectionId !== thread.sectionId
      )
        return fresh;
    }
    const updated = await bb.sdk.threads.update({
      threadId: thread.id,
      sectionId: section.id,
    });
    state.hasAppliedSection = true;
    state.lastAppliedSectionId = section.id;
    // Agent-declared phases remain stable until the agent declares another
    // transition; explicit CLI moves always bypass this automatic lock.
    state.sectionLocked = explicit;
    state.phaseClassification = {
      classifierVersion: CLASSIFIER_VERSION,
      decision: {
        target,
        confidence: 1,
        reasons: [explicit ? "agent transition" : "automatic phase mapping"],
      },
    };
    await saveState(thread.id, state);
    await reconcileOwnedSections();
    bb.log.info(`thread=${thread.id} action=phase-updated target=${target}`);
    return updated;
  }

  async function evaluate(threadId: string): Promise<void> {
    const thread = (await bb.sdk.threads.get({ threadId })) as Thread;
    if (!isManageableThread(thread)) return;
    const state = await readState(thread);
    syncManualLocks(state, thread);
    const history = promptTexts(
      await bb.sdk.threads.promptHistory({ threadId, limit: "6" }),
    );
    const texts = [
      ...(thread.title ? [thread.title] : []),
      ...(thread.titleFallback ? [thread.titleFallback] : []),
      ...history,
    ];
    const decision = classifyPhase(texts);
    state.phaseClassification = {
      classifierVersion: CLASSIFIER_VERSION,
      decision,
    };
    await moveToPhase(thread, state, decision.target, false);
    if (!state.titleLocked && thread.title === null) {
      const source = history.find(isSubstantiveText) ?? thread.titleFallback;
      const candidate = source ? deriveTaskTitle(source) : null;
      if (
        candidate &&
        candidate.confidence >= 0.9 &&
        (await settings.get()).inboxMode === "apply"
      ) {
        const updated = await bb.sdk.threads.update({
          threadId,
          title: candidate.title,
        });
        state.hasAppliedTitle = true;
        state.lastAppliedTitle = updated.title;
      }
    }
    await saveState(threadId, state);
  }

  async function consumeCompletedTurns(
    threadId: string,
    state: ThreadState,
  ): Promise<boolean> {
    let drained = 0;
    while (drained < MAX_COMPLETED_EVENT_DRAIN) {
      const event = await bb.sdk.threads.events.wait({
        threadId,
        type: "turn/completed",
        waitMs: "1",
        ...(state.lastCompletedSeq
          ? { afterSeq: String(state.lastCompletedSeq) }
          : {}),
      });
      if (!event) break;
      state.lastCompletedSeq = event.seq;
      if (event.type === "turn/completed" && event.data.status === "completed")
        state.completedTurns += 1;
      drained += 1;
    }
    const due = state.completedTurns >= state.nextEvaluationTurn;
    if (due)
      state.nextEvaluationTurn = advanceEvaluationMilestone(
        state.nextEvaluationTurn,
        state.completedTurns,
      );
    return due;
  }

  async function reconcileExisting(signal: AbortSignal): Promise<void> {
    let offset = 0;
    while (!signal.aborted) {
      const page = await bb.sdk.threads.list({
        archived: false,
        hasParent: false,
        limit: THREAD_LIST_PAGE_SIZE,
        offset,
        signal,
      });
      for (const thread of page)
        if (!signal.aborted && isManageableThread(thread))
          await evaluate(thread.id);
      if (page.length < THREAD_LIST_PAGE_SIZE) break;
      offset += THREAD_LIST_PAGE_SIZE;
    }
    if (!signal.aborted) await reconcileOwnedSections();
  }

  bb.events.on("thread.created", ({ thread }) =>
    enqueue(thread.id, async () => {
      if (isEligibleThread(thread)) await evaluate(thread.id);
    }),
  );
  bb.events.on("thread.active", ({ thread }) =>
    enqueue(thread.id, () => evaluate(thread.id)),
  );
  bb.events.on("thread.idle", ({ thread }) =>
    enqueue(thread.id, async () => {
      const fresh = (await bb.sdk.threads.get({
        threadId: thread.id,
      })) as Thread;
      if (!isManageableThread(fresh)) return;
      const state = await readState(fresh);
      if (await consumeCompletedTurns(thread.id, state))
        await evaluate(thread.id);
      else await saveState(thread.id, state);
    }),
  );
  bb.events.on("thread.failed", ({ thread }) =>
    enqueue(thread.id, async () => {
      const fresh = (await bb.sdk.threads.get({
        threadId: thread.id,
      })) as Thread;
      const state = await readState(fresh);
      if (!state.hasAppliedSection && isManageableThread(fresh))
        await moveToPhase(fresh, state, "inbox", false);
    }),
  );
  const forget = (threadId: string) =>
    enqueue(threadId, async () => {
      const thread = (await bb.sdk.threads
        .get({ threadId })
        .catch(() => null)) as Thread | null;
      const state = thread ? await readState(thread) : null;
      if (
        thread &&
        state?.hasAppliedSection &&
        thread.sectionId === state.lastAppliedSectionId
      ) {
        await bb.sdk.threads
          .update({ threadId, sectionId: null })
          .catch(() => undefined);
      }
      await bb.storage.kv.delete(stateKey(threadId));
      await reconcileOwnedSections();
    });
  bb.events.on("thread.archived", ({ thread }) => forget(thread.id));
  bb.events.on("thread.deleted", ({ thread }) => forget(thread.id));

  bb.cli.register({
    name: "organizer",
    summary: "Move the current bb thread through development phases",
    commands: [
      {
        name: "phase",
        summary: "Move the current thread to a phase",
        usage:
          "bb organizer phase <planning|spec-review|building|handoff|testing-deploy|inbox>",
      },
    ],
    async run(argv, context) {
      if (argv[0] !== "phase" || !argv[1])
        return {
          exitCode: 2,
          stderr:
            "Usage: bb organizer phase <planning|spec-review|building|handoff|testing-deploy|inbox>\n",
        };
      const target = parsePhaseTarget(argv[1]);
      if (!target)
        return { exitCode: 2, stderr: `Unknown phase: ${argv[1]}\n` };
      if (!context.threadId)
        return {
          exitCode: 2,
          stderr: "Run inside a bb thread so BB_THREAD_ID is available.\n",
        };
      const thread = (await bb.sdk.threads.get({
        threadId: context.threadId,
      })) as Thread;
      if (!isManageableThread(thread))
        return { exitCode: 2, stderr: "This thread cannot be organized.\n" };
      const state = await readState(thread);
      await moveToPhase(thread, state, target, true);
      return {
        exitCode: 0,
        stdout: `Moved ${thread.id} to ${PHASE_SECTION_NAMES[target]}.\n`,
      };
    },
  });
  bb.agents.configure(() => ({
    tools: [],
    skills: ["thread-phase-organizer"],
  }));

  bb.background.service("phase-reconciliation", {
    async start(signal) {
      while (!signal.aborted) {
        await reconcileExisting(signal);
        if (!signal.aborted)
          await abortableDelay(RECONCILIATION_INTERVAL_MS, signal);
      }
    },
  });
  bb.onDispose(async () => {
    disposed = true;
    await Promise.allSettled([...queues.values()]);
  });
  void settings
    .get()
    .then(({ inboxMode }) =>
      bb.log.info(`Thread Organizer loaded mode=${inboxMode}`),
    );
}
