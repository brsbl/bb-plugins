import { describe, expect, it } from "vitest";
import { buildWaiverPlan, buildWeakSpots, type Position, type SwapCandidate } from "./core";

const player = (elementId: number, name: string, pointsPerGame: number, minutesPerGame = 90): SwapCandidate => ({
  elementId, name, pointsPerGame, minutesPerGame, team: "ARS", seasonPoints: 0,
  goals: 0, assists: 0, defending: 0, bonus: 0, availability: "a", news: "", opponents: [],
  fplStats: { pointsPerMatch: pointsPerGame, form: pointsPerGame, minutes: minutesPerGame * 3,
    starts: minutesPerGame >= 60 ? 3 : minutesPerGame >= 30 ? 1 : 0, cleanSheets: 0, expectedGoals: pointsPerGame, expectedAssists: 0 },
});
const squad = [
  player(1, "Starting keeper", 4), player(2, "Backup keeper", 0, 0),
  ...[5, 5, 5, 4, 0].map((score, i) => player(i + 3, `Defender ${i}`, score)),
  ...[5, 5, 5, 2, 0].map((score, i) => player(i + 8, `Midfielder ${i}`, score)),
  player(13, "Unreliable starting forward", 0.1, 10), player(14, "Reserve forward", 0, 0), player(15, "Other forward", 0, 0),
];
const squadPositions = new Map<number, Position>(squad.map(p => [p.elementId, p.elementId <= 2 ? "GKP" : p.elementId <= 7 ? "DEF" : p.elementId <= 12 ? "MID" : "FWD"]));
const plan = (keeper: number) => buildWaiverPlan({
  squad, squadPositions, competition: new Map(),
  pool: [player(20, "Free keeper", keeper), player(21, "Free forward", 3), player(22, "Keeper fallback", 3)],
  poolPositions: new Map([[20, "GKP"], [21, "FWD"], [22, "GKP"]]),
});

describe("full-squad waiver priorities", () => {
  it("includes a keeper upgrade even when the existing starter rates higher", () => {
    expect(plan(3).map(swap => swap.position)).toEqual(["FWD", "GKP"]);
    expect(plan(3)[1]!.assessment?.strength).toBe("depth");
  });

  it("ranks by squad improvement and retains reserve upgrades as fallbacks", () => {
    const swaps = plan(4.5);
    expect(swaps.map(swap => swap.position)).toEqual(["FWD", "GKP"]);
    expect(swaps[1]!.gain).toBe(4.5);
    // Optional XI metrics keep their existing meaning without controlling priority.
    expect(swaps[1]).toMatchObject({ lineupGain: 0.5, lineupOut: "Starting keeper" });
    expect(swaps[1]!.fallbacks.map(player => player.name)).toEqual(["Keeper fallback"]);
  });

  it("suggests Wilson to Thomas-Asante even though Sesko already rates higher", () => {
    const forwards = [player(13, "Nmecha", 0.8, 13), player(14, "Wilson", 0.5, 4), player(15, "Sesko", 1.2, 18)];
    // Nine regular outfield players keep both reserve forwards outside the XI.
    const others = squad.filter(player => squadPositions.get(player.elementId) !== "FWD")
      .map(player => player.elementId === 7 ? { ...player, pointsPerGame: 3 } : player);
    const swaps = buildWaiverPlan({
      squad: [...others, ...forwards],
      squadPositions, competition: new Map(),
      pool: [player(20, "Thomas-Asante", 0.7, 40)], poolPositions: new Map([[20, "FWD"]]),
    });
    expect(swaps).toHaveLength(1);
    expect(swaps[0]).toMatchObject({ out: { name: "Wilson" }, in: { name: "Thomas-Asante" }, lineupGain: 0 });
    expect(swaps[0]!.gain).toBeGreaterThan(0.15);
  });

  it("does not call a covered backup goalkeeper the squad's weakest spot", () => {
    const args = { squad, squadPositions, swaps: plan(4.5), startingElementIds: new Set([1, 3, 4, 5, 6, 8, 9, 10, 11, 12, 13]) };
    const spots = buildWeakSpots(args);
    expect(spots[0]!.player.name).toBe("Reserve forward");
    expect(spots.some(spot => spot.player.elementId === 2)).toBe(false);
  });

  it("keeps outfield weakness ranks stable when the starting lineup changes", () => {
    const args = { squad, squadPositions, swaps: plan(4.5) };
    const first = buildWeakSpots({ ...args, startingElementIds: new Set([1, 13]) });
    const switched = buildWeakSpots({ ...args, startingElementIds: new Set([1, 14, 15]) });
    expect(first.map(spot => spot.player.elementId)).toEqual(switched.map(spot => spot.player.elementId));
  });

  it("keeps squad gains separate from the optional XI impact metrics", () => {
    const swaps = buildWaiverPlan({ squad, squadPositions, competition: new Map(),
      pool: [player(20, "Free midfielder", 3.5), player(21, "Free defender", 3)],
      poolPositions: new Map([[20, "MID"], [21, "DEF"]]),
    });
    expect(swaps.map(swap => swap.position)).toEqual(["MID", "DEF"]);
    expect(swaps[0]).toMatchObject({ gain: 3.5, lineupGain: 3.5 });
    expect(swaps[1]).toMatchObject({ gain: 3, lineupGain: 1, lineupOut: "Midfielder 3" });
  });
});
