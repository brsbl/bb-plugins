/**
 * What the King says about the thread, and the sums behind it: how big a
 * swallow was, what a finished turn cost, and how long a line stays up.
 */
import type { TurnCost } from "./contract";
import { formatTokens } from "./katamari-math";
import type { StageMode } from "./stage";

// The royal commentary, in the game's grand and slightly absurd voice.
export const LINES = {
  enter: ["Roll, Prince, roll!", "Ah, this thread. We remember it.", "A fresh cousin arrives!"],
  rolling: ["Work, work! Roll, roll!", "Onward! Everything sticks eventually."],
  resting: ["The thread rests. So shall We.", "A little break. Very royal."],
  waiting: ["We shall wait right here.", "Off elsewhere? We keep the katamari warm."],
  compacted: ["Lighter, and wiser.", "Everything that mattered stuck.", "A fresh start, with a new star."],
  sprinkle: ["We sprinkle some snacks. Roll them up!"],
  full: ["It is ENORMOUS. Compaction beckons."],
  knockedOff: ["Oh! Things fell off. Careful, Prince."],
} as const;

/** Share of the context window one swallow takes before it counts as a bite, a gulp, or HEAVY. */
export const GULP_TIERS = [
  { tier: "nibble", below: 0.005 },
  { tier: "bite", below: 0.02 },
  { tier: "gulp", below: 0.05 },
  { tier: "heavy", below: Number.POSITIVE_INFINITY },
] as const;

export type GulpTier = (typeof GULP_TIERS)[number]["tier"];

export function gulpTier(share: number): GulpTier {
  return (GULP_TIERS.find((entry) => share < entry.below) ?? GULP_TIERS[3]).tier;
}

export function clip(text: string, length: number): string {
  return text.length > length ? `${text.slice(0, length - 1).trimEnd()}…` : text;
}

/** The King's verdict on a finished turn: what the prompt cost the context. */
export function receipt(turn: TurnCost, capacity: number | null): string {
  const quote = turn.prompt ? `"${clip(turn.prompt, 34)}"` : "That turn";
  if (turn.contextTokens < 0) return `${quote} ended lighter, thanks to a compaction.`;
  const grew = formatTokens(turn.contextTokens);
  if (turn.baseline) {
    return `A thread starts heavy: bb's system prompt and tools came first. ${quote} began at ${grew}.`;
  }
  switch (gulpTier(capacity ? turn.contextTokens / capacity : 0)) {
    case "heavy":
      return `A HEAVY one! ${quote} swallowed ${grew}.`;
    case "nibble":
      return `A light snack: ${quote} took just ${grew}.`;
    default:
      return `${quote} swallowed ${grew}.`;
  }
}

export function line(options: readonly string[]): string {
  return options[Math.floor(Math.random() * options.length)];
}

/** Long lines stay up long enough to finish typing and be read. */
export function speechSeconds(text: string): number {
  return Math.max(3.8, text.length * 0.03 + 2.2);
}

/** The line for a thread that starts or stops working, or that the user left; null for none. */
export function modeLine(mode: StageMode): string | null {
  if (mode === "rolling") return line(LINES.rolling);
  if (mode === "resting") return line(LINES.resting);
  if (mode === "waiting") return line(LINES.waiting);
  return null;
}

export function pickupLine(fill: number): string {
  return fill >= 0.95 ? line(LINES.full) : `Splendid! ${Math.round(fill * 100)}% full.`;
}

export function compactedLine(compactions: number): string {
  return `POP! Compaction #${compactions}. ${line(LINES.compacted)}`;
}

export function coinsLine(usedTokens: number): string {
  return `${formatTokens(usedTokens)} tokens! Every turn re-reads all of it. Coins, coins, coins!`;
}

/** A turn's bar in the strip: a compaction, the setup turn, or how much its prompt swallowed. */
export function turnTier(turn: TurnCost, capacity: number | null): GulpTier | "setup" | "compacted" {
  if (turn.contextTokens < 0) return "compacted";
  if (turn.baseline) return "setup";
  return gulpTier(capacity ? turn.contextTokens / capacity : 0);
}

export interface UsageReading {
  threadId: string | null;
  usedTokens: number | null;
  ready: boolean;
}

export interface Swallow {
  /** Share of the context window the new usage took. */
  share: number;
  tier: GulpTier | "setup";
  /** The chomp label, e.g. "+3k" or "GULP! +12k". */
  label: string;
}

/** The context one thread took on between two usage readings, or null when none landed. */
export function swallow(
  previous: UsageReading,
  next: UsageReading & { capacityTokens: number | null; compactions: number | null },
): Swallow | null {
  if (previous.threadId !== next.threadId) return null;
  // A thread we watched start with nothing measured: its first usage is the
  // system prompt and tools arriving, not history we opened onto. After a
  // compaction the usage also blanks briefly, and what returns is the summary.
  const setup = previous.usedTokens === null && previous.ready && (next.compactions ?? 0) === 0;
  const before = setup ? 0 : previous.usedTokens;
  if (
    before === null ||
    next.usedTokens === null ||
    next.capacityTokens === null ||
    next.usedTokens <= before
  ) {
    return null;
  }
  const swallowed = next.usedTokens - before;
  const share = swallowed / next.capacityTokens;
  const tier = setup ? "setup" : gulpTier(share);
  return {
    share,
    tier,
    label: setup
      ? `+${formatTokens(swallowed)} setup`
      : `${tier === "heavy" ? "GULP! " : ""}+${formatTokens(swallowed)}`,
  };
}
