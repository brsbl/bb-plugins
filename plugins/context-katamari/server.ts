import type { BbPluginApi } from "@get-bb/plugin-sdk";

import {
  type ContextUsage,
  contextKatamariRpcContract,
  TURN_HISTORY_LIMIT,
  type TurnCost,
} from "./contract";

/** Compactions past this are still shown, just as "this many or more". */
export const COMPACTION_READ_LIMIT = 99;
/** bb's largest events page; turn bookkeeping is a handful of events per turn, so this spans the history. */
const TURN_MARKER_READ_LIMIT = 100;
const PROMPT_LENGTH = 140;
/** Threads whose compaction point is remembered at once. */
const COMPACT_POINT_LIMIT = 400;
/** Usage readings kept per thread; the oldest turns become unmeasured past this. */
const LEDGER_READING_LIMIT = 200;

const TURN_MARKERS = [
  "turn/started",
  "turn/completed",
  "turn/input/accepted",
  "client/turn/requested",
] as const;

/** The fields read from thread events; everything else about them is ignored. */
export interface TurnMarker {
  seq: number;
  type: string;
  scope: { kind: string; turnId?: string };
  data: unknown;
}

/** A turn's bookkeeping before its context growth is known. */
export interface TurnOutline {
  turnId: string;
  startedSeq: number;
  completedSeq: number | null;
  status: TurnCost["status"];
  prompt: string | null;
}

function field(value: unknown, ...path: string[]): unknown {
  let current = value;
  for (const key of path) {
    if (current === null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

function promptText(input: unknown): string | null {
  if (!Array.isArray(input)) return null;
  const text = input
    .map((part) => (field(part, "type") === "text" ? field(part, "text") : null))
    .filter((part): part is string => typeof part === "string")
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
  if (text === "") return null;
  return text.length > PROMPT_LENGTH ? `${text.slice(0, PROMPT_LENGTH - 1)}…` : text;
}

/** Pair each recent turn with the prompt that began it, newest first. */
export function outlineTurns(markers: readonly TurnMarker[]): TurnOutline[] {
  const prompts = new Map<string, string | null>();
  for (const marker of markers) {
    if (marker.type !== "client/turn/requested") continue;
    const requestId = field(marker.data, "requestId");
    if (typeof requestId === "string") prompts.set(requestId, promptText(field(marker.data, "input")));
  }
  const turns = new Map<string, TurnOutline & { promptSeq: number }>();
  const turnFor = (marker: TurnMarker) => {
    const turnId = marker.scope.kind === "turn" ? marker.scope.turnId : undefined;
    if (!turnId) return null;
    let turn = turns.get(turnId);
    if (!turn) {
      turn = {
        turnId,
        startedSeq: -1,
        completedSeq: null,
        status: "running",
        prompt: null,
        promptSeq: Number.POSITIVE_INFINITY,
      };
      turns.set(turnId, turn);
    }
    return turn;
  };
  for (const marker of markers) {
    const turn = turnFor(marker);
    if (!turn) continue;
    switch (marker.type) {
      case "turn/started":
        turn.startedSeq = marker.seq;
        break;
      case "turn/completed": {
        turn.completedSeq = marker.seq;
        const status = field(marker.data, "status");
        turn.status = status === "failed" || status === "interrupted" ? status : "completed";
        break;
      }
      case "turn/input/accepted": {
        // A turn can take more input while it runs; the first message is the one that began it.
        const requestId = field(marker.data, "clientRequestId");
        if (typeof requestId === "string" && prompts.has(requestId) && marker.seq < turn.promptSeq) {
          turn.promptSeq = marker.seq;
          turn.prompt = prompts.get(requestId) ?? null;
        }
        break;
      }
    }
  }
  return [...turns.values()]
    .filter((turn) => turn.startedSeq >= 0)
    .sort((first, second) => second.startedSeq - first.startedSeq)
    .slice(0, TURN_HISTORY_LIMIT)
    .map(({ promptSeq: _promptSeq, ...turn }) => turn);
}

interface ReportedUsage {
  estimated: boolean;
  modelContextWindow: number;
  usedTokens: number;
  snapshot?: { autoCompactAtTokens: number | null } | undefined;
}

/**
 * The ball is "full" where the provider compacts, not at the raw window: a
 * thread never gets past that point, so the biggest katamari should match it.
 */
export function toContextUsage(
  usage: ReportedUsage | null,
  knownCompactAt: number | null = null,
): ContextUsage | null {
  if (usage === null || !(usage.modelContextWindow > 0)) return null;
  const compactAt = usage.snapshot?.autoCompactAtTokens ?? knownCompactAt;
  const capacityTokens =
    compactAt !== null && compactAt > 0 && compactAt < usage.modelContextWindow
      ? compactAt
      : usage.modelContextWindow;
  return {
    usedTokens: Math.max(0, usage.usedTokens),
    capacityTokens,
    estimated: usage.estimated,
  };
}

/**
 * bb keeps only a thread's latest usage report once it prunes, so the plugin
 * records the reports it sees to measure each turn afterwards.
 */
export interface UsageLedger {
  /** Turns that started after this event were watched from their start. */
  watchedFrom: number;
  /** [event seq, used tokens] for each usage report seen, oldest first. */
  readings: [number, number][];
}

/** Add a usage report to a thread's ledger; the first report starts the watch. */
export function recordReading(
  ledger: UsageLedger | undefined,
  reading: [number, number] | null,
): UsageLedger {
  // A thread that has not reported usage yet is watched from its very start.
  const next = ledger ?? { watchedFrom: reading?.[0] ?? 0, readings: [] };
  if (reading === null || next.readings.some(([seq]) => seq === reading[0])) return next;
  const readings = [...next.readings, reading].sort((first, second) => first[0] - second[0]);
  const dropped = readings.splice(0, Math.max(0, readings.length - LEDGER_READING_LIMIT));
  const lastDropped = dropped.at(-1);
  return {
    watchedFrom: lastDropped ? Math.max(next.watchedFrom, lastDropped[0]) : next.watchedFrom,
    readings,
  };
}

/** The context size just before an event: null when nothing had been reported yet. */
function usageBefore(ledger: UsageLedger, seq: number): number | null {
  let used: number | null = null;
  for (const [readingSeq, tokens] of ledger.readings) {
    if (readingSeq >= seq) break;
    used = tokens;
  }
  return used;
}

/**
 * What each turn added, measured up to the next turn's start because
 * providers can report a turn's usage just after it completes. Turns that
 * began before the plugin was watching are left out rather than guessed.
 */
export function measureTurns(
  outlines: readonly TurnOutline[],
  ledger: UsageLedger,
  latestUsed: number | null,
): TurnCost[] {
  const turns: TurnCost[] = [];
  outlines.forEach((turn, index) => {
    if (turn.startedSeq <= ledger.watchedFrom) return;
    // Newest first, so the turn after this one is the previous entry.
    const nextStartedSeq = outlines[index - 1]?.startedSeq ?? null;
    const before = usageBefore(ledger, turn.startedSeq);
    const after = nextStartedSeq === null ? latestUsed : usageBefore(ledger, nextStartedSeq);
    turns.push({
      turnId: turn.turnId,
      prompt: turn.prompt,
      status: turn.status,
      contextTokens: (after ?? 0) - (before ?? 0),
      // Nothing reported before the turn: its growth is mostly bb's own
      // system prompt and tools, not what the prompt asked for.
      ...(before === null ? { baseline: true } : {}),
    });
  });
  return turns;
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export default function plugin(bb: BbPluginApi): void {
  // Only some usage reports carry the compaction point; remember it so the
  // ball's capacity does not jump back to the raw window between them.
  const compactPoints = new Map<string, number>();
  const ledgers = new Map<string, UsageLedger>();

  const ledgerKey = (threadId: string) => `ledger:${threadId}`;

  /** Read the thread's latest usage report into its ledger. */
  const observe = async (threadId: string): Promise<{ ledger: UsageLedger; latest: number | null }> => {
    const [stored, [report]] = await Promise.all([
      ledgers.has(threadId)
        ? Promise.resolve(ledgers.get(threadId))
        : bb.storage.kv.get<UsageLedger>(ledgerKey(threadId)),
      bb.sdk.threads.events.list({
        threadId,
        types: ["thread/contextWindowUsage/updated"],
        order: "desc",
        limit: "1",
      }),
    ]);
    const used = field(report?.data, "contextWindowUsage", "usedTokens");
    const reading: [number, number] | null =
      report && typeof used === "number" ? [report.seq, used] : null;
    const ledger = recordReading(stored, reading);
    ledgers.set(threadId, ledger);
    if (ledger !== stored) await bb.storage.kv.set(ledgerKey(threadId), ledger);
    return { ledger, latest: reading?.[1] ?? null };
  };

  // A turn's starting size is the latest report when the thread wakes up.
  bb.events.on("thread.active", async ({ thread }) => {
    await observe(thread.id).catch((error: unknown) => {
      bb.log.debug(`Could not record usage for ${thread.id}: ${describe(error)}`);
    });
  });
  bb.events.on("thread.deleted", async ({ thread }) => {
    ledgers.delete(thread.id);
    compactPoints.delete(thread.id);
    await bb.storage.kv.delete(ledgerKey(thread.id));
  });

  const readTurns = async (threadId: string): Promise<TurnCost[]> => {
    const [markers, { ledger, latest }] = await Promise.all([
      bb.sdk.threads.events.list({
        threadId,
        types: TURN_MARKERS,
        order: "desc",
        limit: String(TURN_MARKER_READ_LIMIT),
      }),
      observe(threadId),
    ]);
    return measureTurns(outlineTurns(markers as readonly TurnMarker[]), ledger, latest);
  };

  bb.rpc.register(contextKatamariRpcContract, {
    async readThreadContext({ threadId }) {
      const [usage, compactions, turns] = await Promise.all([
        bb.sdk.threads
          .context({ threadId })
          .then((result) => {
            const reported = result.usage?.snapshot?.autoCompactAtTokens;
            if (typeof reported === "number" && reported > 0) {
              compactPoints.delete(threadId);
              compactPoints.set(threadId, reported);
              if (compactPoints.size > COMPACT_POINT_LIMIT) {
                const oldest = compactPoints.keys().next().value;
                if (oldest !== undefined) compactPoints.delete(oldest);
              }
            }
            return toContextUsage(result.usage, compactPoints.get(threadId) ?? null);
          })
          .catch((error: unknown) => {
            bb.log.debug(`Could not read context for ${threadId}: ${describe(error)}`);
            return null;
          }),
        bb.sdk.threads.events
          .list({
            threadId,
            types: ["thread/compacted"],
            order: "desc",
            limit: String(COMPACTION_READ_LIMIT),
          })
          .then((events) => events.length)
          .catch((error: unknown) => {
            bb.log.debug(`Could not count compactions for ${threadId}: ${describe(error)}`);
            // Unknown, not zero: a false zero followed by the real count looks like a compaction.
            return null;
          }),
        readTurns(threadId).catch((error: unknown) => {
          bb.log.debug(`Could not read turns for ${threadId}: ${describe(error)}`);
          return [];
        }),
      ]);
      return { usage, compactions, turns };
    },
  });
}
