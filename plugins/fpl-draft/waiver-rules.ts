import type { Position, SwapCandidate } from "./core";

export const WAIVER_SIGNALS = ["playing-time", "availability", "attacking-involvement", "defensive-involvement", "form-and-fixtures", "keeper-cover", "depth-minutes"] as const;
export const WAIVER_CAUTIONS = ["small-sample", "missing-stats", "goals-ahead-of-xg", "clean-sheet-streak", "harder-fixtures", "lower-attacking-involvement", "minutes-alone", "unavailable", "no-supported-upgrade"] as const;
export type WaiverAssessment = {
  strength: "upgrade" | "depth" | "weak";
  signals: (typeof WAIVER_SIGNALS)[number][];
  cautions: (typeof WAIVER_CAUTIONS)[number][];
};

export const WAIVER_STRENGTH_LABELS = { upgrade: "Supported upgrade", depth: "Depth option", weak: "Weak evidence" } as const;
const RULE_TEXT = {
  "playing-time": "More established playing time",
  availability: "Fit replacement for an unavailable player",
  "attacking-involvement": "Higher xG + xA per 90",
  "defensive-involvement": "Higher defensive involvement above the position's scoring threshold",
  "form-and-fixtures": "Better Form and fixtures over an established minutes sample",
  "keeper-cover": "Adds goalkeeper cover",
  "depth-minutes": "More minutes for a limited-playing-time squad slot",
  "small-sample": "Limited minutes or starts",
  "missing-stats": "Some supporting stats are unavailable",
  "goals-ahead-of-xg": "Goals substantially exceed xG",
  "clean-sheet-streak": "Short clean-sheet streak",
  "harder-fixtures": "Harder next fixtures",
  "lower-attacking-involvement": "Lower xG + xA per 90",
  "minutes-alone": "More minutes alone do not justify replacing a player already getting meaningful minutes",
  unavailable: "Incoming player is not fully available",
  "no-supported-upgrade": "Higher points alone do not establish an upgrade",
} as const;

export function describeWaiverAssessment(assessment: WaiverAssessment): string {
  return `${WAIVER_STRENGTH_LABELS[assessment.strength]}: ${[...assessment.signals, ...assessment.cautions].map(rule => RULE_TEXT[rule]).join("; ")}.`;
}

// Policy thresholds, not fitted probabilities or forecasts. Two full matches
// and two starts are the minimum evidence for a supported upgrade. Shorter
// samples can still support depth. Never turn unknown xG/xA into zero.
const MIN_MINUTES = 180;
const MIN_STARTS = 2;
const REGULAR_MINUTES = 60;
const PLAYING_TIME_GAIN = 20;
const ATTACKING_GAIN_PER_90 = 0.1;
const DEFENSIVE_GAIN_PER_90 = 2;
const DEFENSIVE_THRESHOLD: Record<Position, number> = { GKP: Infinity, DEF: 10, MID: 12, FWD: 12 };

export function hasEstablishedMinutes(player: SwapCandidate): boolean {
  return player.availability === "a" && player.minutesPerGame >= REGULAR_MINUTES &&
    (player.fplStats?.minutes ?? 0) >= MIN_MINUTES && (player.fplStats?.starts ?? 0) >= MIN_STARTS;
}

function attackingRate(player: SwapCandidate): number | null {
  const stats = player.fplStats;
  if (!stats || stats.expectedGoals == null || stats.expectedAssists == null) return null;
  // The floor prevents a cameo from producing an enormous per-90 rate.
  return (stats.expectedGoals + stats.expectedAssists) * 90 / Math.max(MIN_MINUTES, stats.minutes);
}

function fixtureDifficulty(player: SwapCandidate): number | null {
  if (player.opponents.length < 3) return null;
  return player.opponents.slice(0, 3).reduce((sum, fixture) => sum + fixture.difficulty, 0) / 3;
}

/** Evaluate a like-for-like swap independently of its old points-based gain. */
export function assessWaiver(args: {
  out: SwapCandidate;
  incoming: SwapCandidate;
  position: Position;
  coveredKeeper?: boolean;
}): WaiverAssessment {
  const { out, incoming, position, coveredKeeper = false } = args;
  const signals: WaiverAssessment["signals"] = [];
  const cautions: WaiverAssessment["cautions"] = [];
  const stats = incoming.fplStats;
  const coveredBackup = position === "GKP" && coveredKeeper && !hasEstablishedMinutes(out);
  const enoughSample = stats != null && stats.minutes >= MIN_MINUTES && stats.starts >= MIN_STARTS;
  if (!enoughSample) cautions.push("small-sample");
  if (!stats || !out.fplStats || (position !== "GKP" && (attackingRate(incoming) === null || attackingRate(out) === null))) cautions.push("missing-stats");
  if (position !== "GKP" && stats?.expectedGoals != null && incoming.goals >= 2 &&
      incoming.goals - stats.expectedGoals >= 1 && incoming.goals > 2 * stats.expectedGoals) cautions.push("goals-ahead-of-xg");
  if ((position === "GKP" || position === "DEF") && stats && stats.starts <= 4 && stats.cleanSheets >= 2 &&
      stats.cleanSheets / Math.max(1, stats.starts) >= 0.75) cautions.push("clean-sheet-streak");
  const beforeFixtures = fixtureDifficulty(out);
  const afterFixtures = fixtureDifficulty(incoming);
  if (beforeFixtures !== null && afterFixtures !== null && afterFixtures - beforeFixtures >= 1 / 3 - 1e-9) cautions.push("harder-fixtures");
  if (incoming.availability !== "a") return { strength: "weak", signals, cautions: [...cautions, "unavailable"] };

  const minutesGain = incoming.minutesPerGame - out.minutesPerGame;
  if (hasEstablishedMinutes(incoming) && minutesGain >= PLAYING_TIME_GAIN) signals.push("playing-time");
  if (hasEstablishedMinutes(incoming) && out.availability !== "a") signals.push("availability");
  const noMinutesLoss = incoming.minutesPerGame >= out.minutesPerGame - PLAYING_TIME_GAIN;
  const beforeAttack = attackingRate(out);
  const afterAttack = attackingRate(incoming);
  if (position !== "GKP" && beforeAttack !== null && afterAttack !== null &&
      beforeAttack - afterAttack >= ATTACKING_GAIN_PER_90 - 1e-9) cautions.push("lower-attacking-involvement");
  if (position !== "GKP" && enoughSample && noMinutesLoss && beforeAttack !== null && afterAttack !== null &&
      afterAttack - beforeAttack >= ATTACKING_GAIN_PER_90 - 1e-9) signals.push("attacking-involvement");
  if (position !== "GKP" && enoughSample && noMinutesLoss && out.fplStats && stats) {
    const beforeDefending = out.defending * 90 / Math.max(MIN_MINUTES, out.fplStats.minutes);
    const afterDefending = incoming.defending * 90 / stats.minutes;
    if (afterDefending >= DEFENSIVE_THRESHOLD[position] && afterDefending - beforeDefending >= DEFENSIVE_GAIN_PER_90) signals.push("defensive-involvement");
  }
  // Form is realized output too. It needs a separate fixture advantage and a
  // longer sample; neither Form nor a finishing/clean-sheet streak stands alone.
  if (stats && stats.minutes >= 450 && stats.starts >= 5 && noMinutesLoss && stats.form != null && out.fplStats?.form != null &&
      stats.form - out.fplStats.form >= 0.5 && beforeFixtures !== null && afterFixtures !== null &&
      beforeFixtures - afterFixtures >= 2 / 3 - 1e-9 && !cautions.includes("goals-ahead-of-xg")) signals.push("form-and-fixtures");

  if (signals.length === 1 && signals[0] === "playing-time" && out.availability === "a" && out.minutesPerGame >= 30 && !coveredBackup) {
    return { strength: "weak", signals, cautions: [...cautions, "minutes-alone"] };
  }
  if (signals.length > 0) {
    // All 15 players remain eligible. A second playable keeper adds cover when
    // another healthy regular already exists; it is not the squad's top need.
    if (coveredBackup) {
      return { strength: "depth", signals: [...signals, "keeper-cover"], cautions };
    }
    return { strength: hasEstablishedMinutes(incoming) ? "upgrade" : "depth", signals, cautions };
  }
  if (out.minutesPerGame < 30 && minutesGain >= PLAYING_TIME_GAIN && (stats?.minutes ?? 0) >= 90 && (stats?.starts ?? 0) >= 1) {
    return { strength: "depth", signals: ["depth-minutes"], cautions };
  }
  return { strength: "weak", signals, cautions: [...cautions, "no-supported-upgrade"] };
}
