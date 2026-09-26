/**
 * Who is on stage, and what they are doing. The window keeps showing the
 * last thread's cousin while the user is elsewhere in bb, so the stage only
 * changes hands when another thread opens.
 */
export type StageMode =
  /** The thread is working: the cousin rolls. */
  | "rolling"
  /** The thread is idle: the cousin stops and rests. */
  | "resting"
  /** The user left for a non-thread page: the cousin stops and waits. */
  | "waiting"
  /** No thread has been opened yet. */
  | "empty";

export interface StageState {
  threadId: string | null;
  mode: StageMode;
}

export interface StageInput {
  /** The thread the user is looking at, or null on any other page. */
  threadId: string | null;
  working: boolean;
}

export interface StageHandoff {
  /** The cousin who rolls off screen, if one was on stage. */
  exitingThreadId: string | null;
  enteringThreadId: string;
}

export const EMPTY_STAGE: StageState = { threadId: null, mode: "empty" };

export function resolveStage(
  previous: StageState,
  input: StageInput,
): { state: StageState; handoff: StageHandoff | null } {
  if (input.threadId === null) {
    return {
      state:
        previous.threadId === null
          ? EMPTY_STAGE
          : { threadId: previous.threadId, mode: "waiting" },
      handoff: null,
    };
  }
  const mode: StageMode = input.working ? "rolling" : "resting";
  if (previous.threadId === input.threadId) {
    return { state: { threadId: input.threadId, mode }, handoff: null };
  }
  return {
    state: { threadId: input.threadId, mode },
    handoff: {
      exitingThreadId: previous.threadId,
      enteringThreadId: input.threadId,
    },
  };
}

/** Thread statuses bb treats as busy. Unknown values count as idle. */
const WORKING_STATUSES = new Set(["starting", "active"]);
/** Indicators that mean a turn or background work is running, for hosts without `status`. */
const WORKING_INDICATORS = new Set([
  "runtime",
  "working-draft",
  "workflow",
  "background-agent",
  "background-command",
]);

export function isThreadWorking(thread: {
  indicator: string;
  status?: string;
}): boolean {
  // A thread blocked on the user is not making progress, even mid-turn.
  if (thread.indicator === "waiting-for-input") return false;
  if (thread.status !== undefined) return WORKING_STATUSES.has(thread.status);
  return WORKING_INDICATORS.has(thread.indicator);
}

/**
 * How the ball should react to a compaction count. Compactions only
 * accumulate, so a lower reading is stale and ignored: taking it would make
 * the next true reading pop as if the thread had just compacted. An unknown
 * count (`null`) changes nothing, and the first known count is shown quietly.
 */
export function compactionChange(
  shown: number | null,
  reported: number | null,
): { kind: "pop" | "set"; compactions: number } | null {
  if (reported === null) return null;
  if (shown === null) return { kind: "set", compactions: reported };
  return reported > shown ? { kind: "pop", compactions: reported } : null;
}

/**
 * Orders the replies to overlapping reads of one thread. A reply older than
 * one already applied is stale and dropped; a newer one always lands, so
 * frequent refreshes never starve the window of updates.
 */
export function createReadOrder() {
  let issued = 0;
  let applied = 0;
  return {
    begin: () => ++issued,
    accept(read: number): boolean {
      if (read <= applied) return false;
      applied = read;
      return true;
    },
  };
}
