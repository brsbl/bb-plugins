import { describe, expect, it } from "vitest";

import {
  applyTransactions,
  buildCompetition,
  buildFixtureRun,
  buildOpponentRecords,
  buildWaiverPlan,
  buildWeakSpots,
  isWeak,
  valuePlayer,
  buildManagerIndex,
  buildMatchups,
  buildPlayerRows,
  buildProjectedTable,
  buildSquad,
  buildTable,
  comparablePosition,
  resolveManager,
  resultFor,
  sortPlayers,
} from "./core";
import type {
  DraftElement,
  DraftElementStatusRow,
  DraftLeagueEntry,
  DraftMatch,
  DraftTeam,
} from "./api";

const RULES = { h2h_win: 3, h2h_draw: 1, h2h_lose: 0 };
const TYPES = [
  { id: 1, singular_name_short: "GKP" },
  { id: 2, singular_name_short: "DEF" },
  { id: 3, singular_name_short: "MID" },
  { id: 4, singular_name_short: "FWD" },
];

function entry(overrides: Partial<DraftLeagueEntry> & { id: number }): DraftLeagueEntry {
  return {
    entry_id: overrides.id + 1000,
    entry_name: `Team ${overrides.id}`,
    player_first_name: "First",
    player_last_name: `Last${overrides.id}`,
    short_name: `T${overrides.id}`,
    waiver_pick: 1,
    ...overrides,
  };
}

function match(overrides: Partial<DraftMatch>): DraftMatch {
  return {
    event: 1,
    started: true,
    finished: true,
    league_entry_1: 1,
    league_entry_1_points: 0,
    league_entry_2: 2,
    league_entry_2_points: 0,
    ...overrides,
  };
}

function element(overrides: Partial<DraftElement> & { id: number }): DraftElement {
  return {
    web_name: `P${overrides.id}`,
    team: 1,
    element_type: 3,
    status: "a",
    news: "",
    draft_rank: 100,
    total_points: 0,
    event_points: 0,
    form: "0.0",
    points_per_game: "0.0",
    minutes: 0,
    starts: 0,
    goals_scored: 0,
    assists: 0,
    clean_sheets: 0,
    bonus: 0,
    bps: 0,
    defensive_contribution: 0,
    expected_goals: "0.00",
    expected_assists: "0.00",
    chance_of_playing_next_round: null,
    ...overrides,
  };
}

const TEAMS = new Map<number, DraftTeam>([
  [1, { id: 1, name: "Arsenal", short_name: "ARS" }],
  [2, { id: 2, name: "Brentford", short_name: "BRE" }],
]);

describe("manager index", () => {
  it("keeps the league-entry and global-entry id namespaces separate", () => {
    const index = buildManagerIndex([entry({ id: 16832 }), entry({ id: 26643 })]);
    expect(index.byLeagueEntry.get(16832)?.entryId).toBe(17832);
    expect(index.byEntry.get(17832)?.leagueEntryId).toBe(16832);
    // A league-entry id must never resolve through the global-entry map.
    expect(index.byEntry.get(16832)).toBeUndefined();
  });

  it("resolves a manager by team, manager or short name and rejects ambiguity", () => {
    const index = buildManagerIndex([
      entry({ id: 1, entry_name: "Red Cards", short_name: "RC" }),
      entry({ id: 2, entry_name: "Blue Cards", short_name: "RC" }),
    ]);
    expect(resolveManager(index, "red cards")?.leagueEntryId).toBe(1);
    expect(resolveManager(index, "First Last1")?.leagueEntryId).toBe(1);
    expect(resolveManager(index, "RC")).toBeNull();
    expect(resolveManager(index, "  ")).toBeNull();
  });
});

describe("results", () => {
  it("derives W/D/L from the scores because the API never fills the winner", () => {
    expect(resultFor(58, 33)).toBe("W");
    expect(resultFor(33, 58)).toBe("L");
    expect(resultFor(40, 40)).toBe("D");
  });
});

describe("league table", () => {
  const managers = buildManagerIndex([
    entry({ id: 1 }),
    entry({ id: 2 }),
    entry({ id: 3 }),
    entry({ id: 4 }),
  ]).managers;

  it("counts only finished matches and derives played from them", () => {
    const table = buildTable({
      matches: [
        match({ league_entry_1: 1, league_entry_1_points: 58, league_entry_2: 2, league_entry_2_points: 33 }),
        match({ event: 2, started: true, finished: false, league_entry_1: 1, league_entry_1_points: 10, league_entry_2: 2, league_entry_2_points: 60 }),
      ],
      managers,
      rules: RULES,
      includeUnfinished: false,
    });
    const first = table.find((row) => row.leagueEntryId === 1);
    // Not 38, which is what the API's own matches_played reports.
    expect(first?.played).toBe(1);
    expect(first?.leaguePoints).toBe(3);
    expect(first?.pointsFor).toBe(58);
  });

  it("records results oldest first for the form strip", () => {
    const table = buildTable({
      matches: [
        match({ event: 2, league_entry_1: 1, league_entry_1_points: 10, league_entry_2: 2, league_entry_2_points: 60 }),
        match({ event: 1, league_entry_1: 1, league_entry_1_points: 58, league_entry_2: 2, league_entry_2_points: 33 }),
      ],
      managers,
      rules: RULES,
      includeUnfinished: false,
    });
    expect(table.find((row) => row.leagueEntryId === 1)?.form).toEqual(["W", "L"]);
    expect(table.find((row) => row.leagueEntryId === 2)?.form).toEqual(["L", "W"]);
  });

  it("reports points scored per gameweek", () => {
    const table = buildTable({
      matches: [
        match({ event: 1, league_entry_1: 1, league_entry_1_points: 50, league_entry_2: 2, league_entry_2_points: 10 }),
        match({ event: 2, league_entry_1: 1, league_entry_1_points: 30, league_entry_2: 2, league_entry_2_points: 10 }),
      ],
      managers,
      rules: RULES,
      includeUnfinished: false,
    });
    expect(table.find((row) => row.leagueEntryId === 1)?.averageFor).toBe(40);
  });

  it("awards a point each for a draw", () => {
    const table = buildTable({
      matches: [match({ league_entry_1_points: 40, league_entry_2_points: 40 })],
      managers,
      rules: RULES,
      includeUnfinished: false,
    });
    expect(table.find((row) => row.leagueEntryId === 1)?.drawn).toBe(1);
    expect(table.find((row) => row.leagueEntryId === 1)?.leaguePoints).toBe(1);
    expect(table.find((row) => row.leagueEntryId === 2)?.leaguePoints).toBe(1);
  });

  it("breaks tied league points on fantasy points even when score difference disagrees", () => {
    const table = buildTable({
      matches: [
        match({ league_entry_1: 1, league_entry_1_points: 50, league_entry_2: 2, league_entry_2_points: 0 }),
        match({ league_entry_1: 3, league_entry_1_points: 60, league_entry_2: 4, league_entry_2_points: 59 }),
      ],
      managers,
      rules: RULES,
      includeUnfinished: false,
    });
    expect(table[0]?.leagueEntryId).toBe(3);
    expect(table[1]?.leagueEntryId).toBe(1);
  });

  it("ignores matches referencing teams outside the league", () => {
    const table = buildTable({
      matches: [match({ league_entry_1: 99, league_entry_2: 98 })],
      managers,
      rules: RULES,
      includeUnfinished: false,
    });
    expect(table.every((row) => row.played === 0)).toBe(true);
  });
});

describe("projected table", () => {
  const managers = buildManagerIndex([entry({ id: 1 }), entry({ id: 2 })]).managers;

  it("folds in-flight scores in and reports the rank movement they cause", () => {
    const matches = [
      // Settled: team 2 leads.
      match({ event: 1, league_entry_1: 1, league_entry_1_points: 10, league_entry_2: 2, league_entry_2_points: 40 }),
      // Live: team 1 is winning, which would level the table on points and
      // put team 1 ahead on points for.
      match({ event: 2, started: true, finished: false, league_entry_1: 1, league_entry_1_points: 70, league_entry_2: 2, league_entry_2_points: 20 }),
    ];
    const projected = buildProjectedTable({ matches, managers, rules: RULES });
    const first = projected.find((row) => row.leagueEntryId === 1);
    expect(first?.rank).toBe(1);
    expect(first?.rankDelta).toBe(1);
    expect(first?.liveLeaguePoints).toBe(3);
    expect(first?.played).toBe(2);
  });

  it("reports no movement when nothing is in flight", () => {
    const projected = buildProjectedTable({
      matches: [match({ league_entry_1_points: 50, league_entry_2_points: 10 })],
      managers,
      rules: RULES,
    });
    expect(projected.every((row) => row.rankDelta === 0)).toBe(true);
    expect(projected.every((row) => row.liveLeaguePoints === 0)).toBe(true);
  });
});

describe("matchups", () => {
  const index = buildManagerIndex([entry({ id: 1 }), entry({ id: 2 })]);

  it("names both sides and leaves the result blank until kickoff", () => {
    const [upcoming] = buildMatchups(
      [match({ event: 3, started: false, finished: false })],
      index,
      3,
    );
    expect(upcoming?.home.teamName).toBe("Team 1");
    expect(upcoming?.home.result).toBeNull();
    expect(upcoming?.away.result).toBeNull();
  });

  it("shows a live result once the week has started", () => {
    const [live] = buildMatchups(
      [match({ event: 2, started: true, finished: false, league_entry_1_points: 49, league_entry_2_points: 19 })],
      index,
      2,
    );
    expect(live?.home.result).toBe("W");
    expect(live?.away.result).toBe("L");
    expect(live?.finished).toBe(false);
  });
});

describe("squad", () => {
  it("splits the XI from the bench and joins live points", () => {
    const squad = buildSquad({
      picks: [
        { element: 2, position: 12 },
        { element: 1, position: 1 },
      ],
      elements: new Map([
        [1, element({ id: 1, element_type: 1, web_name: "Raya" })],
        [2, element({ id: 2, element_type: 4, web_name: "Osula", status: "i", news: "Foot injury" })],
      ]),
      teams: TEAMS,
      types: TYPES,
      live: { elements: { "1": { stats: { total_points: 6, minutes: 90 } } } },
    });
    expect(squad.map((player) => player.slot)).toEqual([1, 12]);
    expect(squad[0]?.starting).toBe(true);
    expect(squad[0]?.eventPoints).toBe(6);
    expect(squad[1]?.starting).toBe(false);
    expect(squad[1]?.availability).toBe("i");
    // Missing live entries must not throw; they score zero.
    expect(squad[1]?.eventPoints).toBe(0);
  });
});

describe("player rows", () => {
  // `owner` carries the GLOBAL entry id (1001 here), not the league-entry id.
  const ownership = new Map<number, DraftElementStatusRow>([
    [1, { element: 1, owner: null, status: "a", in_accepted_trade: false }],
    [2, { element: 2, owner: 1001, status: "o", in_accepted_trade: false }],
  ]);
  const index = buildManagerIndex([entry({ id: 1, entry_name: "Red Cards" })]);
  const fixturesByTeam = new Map([
    [
      1,
      buildFixtureRun(
        [
          { event: 3, difficulty: 2, is_home: true, team_a: 2, team_h: 1 },
          { event: 4, difficulty: 4, is_home: false, team_a: 1, team_h: 2 },
        ],
        TEAMS,
        4,
      ),
    ],
  ]);

  it("resolves ownership through the global-entry namespace", () => {
    const rows = buildPlayerRows({
      elements: [element({ id: 1 }), element({ id: 2 })],
      teams: TEAMS,
      types: TYPES,
      ownership,
      index,
      fixturesByTeam,
    });
    expect(rows.find((row) => row.elementId === 1)?.ownedBy).toBeNull();
    expect(rows.find((row) => row.elementId === 2)?.ownedBy).toBe("Red Cards");
  });

  it("does not resolve an owner from the league-entry namespace", () => {
    const rows = buildPlayerRows({
      elements: [element({ id: 2 })],
      teams: TEAMS,
      types: TYPES,
      // 1 is the league-entry id; ownership never uses it.
      ownership: new Map([
        [2, { element: 2, owner: 1, status: "o", in_accepted_trade: false }],
      ]),
      index,
      fixturesByTeam,
    });
    expect(rows[0]?.ownedBy).toBeNull();
  });

  it("drops players who have left the league", () => {
    const rows = buildPlayerRows({
      elements: [element({ id: 1 }), element({ id: 3, status: "u" })],
      teams: TEAMS,
      types: TYPES,
      ownership,
      index,
      fixturesByTeam,
    });
    expect(rows.map((row) => row.elementId)).toEqual([1]);
  });

  it("coerces the string-typed numeric fields and averages fixture difficulty", () => {
    const [row] = buildPlayerRows({
      elements: [element({ id: 1, form: "7.5", points_per_game: "6.0" })],
      teams: TEAMS,
      types: TYPES,
      ownership,
      index,
      fixturesByTeam,
    });
    expect(row?.form).toBe(7.5);
    expect(row?.pointsPerGame).toBe(6);
    expect(row?.fixtureDifficulty).toBe(3);
    expect(row?.fixtures[0]?.opponent).toBe("BRE");
    expect(row?.fixtures[1]?.isHome).toBe(false);
  });

  it("reports no difficulty when a team has no published fixtures", () => {
    const [row] = buildPlayerRows({
      elements: [element({ id: 1, team: 2 })],
      teams: TEAMS,
      types: TYPES,
      ownership,
      index,
      fixturesByTeam,
    });
    expect(row?.fixtureDifficulty).toBeNull();
  });
});

describe("sorting and comparison", () => {
  const index = buildManagerIndex([entry({ id: 1 })]);
  const rows = buildPlayerRows({
    elements: [
      element({ id: 1, total_points: 10, element_type: 3 }),
      element({ id: 2, total_points: 30, element_type: 3 }),
      element({ id: 3, total_points: 20, element_type: 4 }),
    ],
    teams: TEAMS,
    types: TYPES,
    ownership: new Map(),
    index,
    fixturesByTeam: new Map(),
  });

  it("sorts descending for scoring columns", () => {
    expect(sortPlayers(rows, "totalPoints").map((row) => row.elementId)).toEqual([2, 3, 1]);
  });

  it("sorts fixture difficulty ascending, since easier is better", () => {
    const withRuns = buildPlayerRows({
      elements: [element({ id: 1, team: 1 }), element({ id: 2, team: 2 })],
      teams: TEAMS,
      types: TYPES,
      ownership: new Map(),
      index,
      fixturesByTeam: new Map([
        [1, buildFixtureRun([{ event: 3, difficulty: 5, is_home: true, team_a: 2, team_h: 1 }], TEAMS, 4)],
        [2, buildFixtureRun([{ event: 3, difficulty: 2, is_home: true, team_a: 1, team_h: 2 }], TEAMS, 4)],
      ]),
    });
    expect(sortPlayers(withRuns, "fixtureDifficulty").map((row) => row.elementId)).toEqual([2, 1]);
  });

  it("only allows comparison within a single position", () => {
    expect(comparablePosition(rows.filter((row) => row.position === "MID"))).toBe("MID");
    expect(comparablePosition(rows)).toBeNull();
    expect(comparablePosition([])).toBeNull();
  });
});

describe("waiver model", () => {
  const types = TYPES;
  const gp = 2;

  it("shrinks the rate so a cameo cannot outrank a regular starter", () => {
    // 1 point from 1 minute is a 90 pts/90 rate before shrinkage.
    const cameo = valuePlayer(element({ id: 1, total_points: 1, minutes: 1, starts: 0 }), gp);
    const starter = valuePlayer(
      element({ id: 2, total_points: 17, minutes: 180, starts: 2 }),
      gp,
    );
    expect(cameo.pointsPerGame).toBeLessThan(starter.pointsPerGame);
    expect(cameo.pointsPerGame).toBeLessThan(1);
  });

  it("reports points per game to one decimal place", () => {
    // 17 points from 2 games, damped by three empty games: 17 / 5 = 3.4
    expect(valuePlayer(element({ id: 1, total_points: 17, minutes: 180 }), 2).pointsPerGame).toBe(3.4);
    expect(valuePlayer(element({ id: 2, total_points: 0, minutes: 0 }), 2).pointsPerGame).toBe(0);
  });

  it("reports average minutes per game, not a share", () => {
    expect(valuePlayer(element({ id: 1, minutes: 180 }), 2).minutesPerGame).toBe(90);
    expect(valuePlayer(element({ id: 1, minutes: 90 }), 2).minutesPerGame).toBe(45);
  });

  it("treats the unavailable and the barely-played as weak", () => {
    expect(isWeak(element({ id: 1, status: "i", minutes: 180 }), gp)).toBe(true);
    expect(isWeak(element({ id: 2, status: "s", minutes: 180 }), gp)).toBe(true);
    expect(isWeak(element({ id: 3, minutes: 40 }), gp)).toBe(true);
    expect(isWeak(element({ id: 4, minutes: 180 }), gp)).toBe(false);
  });

  it("counts each manager once per position however many holes they have", () => {
    const competition = buildCompetition({
      squads: new Map([
        [1, [{ element: 1, position: 1 }, { element: 2, position: 2 }]],
        [2, [{ element: 3, position: 1 }]],
      ]),
      elements: new Map([
        [1, element({ id: 1, element_type: 2, status: "i" })],
        [2, element({ id: 2, element_type: 2, minutes: 0 })],
        [3, element({ id: 3, element_type: 2, minutes: 180 })],
      ]),
      types,
      gamesPlayed: gp,
    });
    const def = competition.get("DEF");
    // Manager 1 has two broken defenders but is one manager needing a defender.
    expect(def?.managersNeeding).toBe(1);
    expect(def?.totalManagers).toBe(2);
  });

  it("does not count a covered backup keeper as rival demand", () => {
    const competition = buildCompetition({
      squads: new Map([[1, [{ element: 1, position: 1 }, { element: 2, position: 12 }]], [2, [{ element: 3, position: 1 }]]]),
      elements: new Map([
        [1, element({ id: 1, element_type: 1, status: "a", minutes: 180 })],
        [2, element({ id: 2, element_type: 1, status: "a", minutes: 0 })],
        [3, element({ id: 3, element_type: 1, status: "i", minutes: 0 })],
      ]), types, gamesPlayed: gp, waiverPickOf: id => id,
    });
    expect(competition.get("GKP")?.needingPicks).toEqual([2]);
  });

  it("lists the waiver seats of the managers who need a position, first to last", () => {
    const competition = buildCompetition({
      squads: new Map([
        [1, [{ element: 1, position: 1 }]],
        [2, [{ element: 2, position: 1 }]],
        [3, [{ element: 3, position: 1 }]],
      ]),
      elements: new Map([
        [1, element({ id: 1, element_type: 2, status: "i" })],
        [2, element({ id: 2, element_type: 2, minutes: 180 })],
        [3, element({ id: 3, element_type: 2, minutes: 0 })],
      ]),
      types,
      gamesPlayed: gp,
      waiverPickOf: (entryId) => ({ 1: 3, 2: 1, 3: 2 })[entryId] ?? null,
    });
    // Managers 1 (seat 3) and 3 (seat 2) need a defender; manager 2 does not.
    expect(competition.get("DEF")?.needingPicks).toEqual([2, 3]);
  });

  it("uses head-to-head history when it exists and falls back when it does not", () => {
    const records = buildOpponentRecords({
      fixtures: [
        { event: 3, difficulty: 4, is_home: true, team_a: 2, team_h: 1 },
        // Home against team 1, an opponent never faced in this history.
        { event: 4, difficulty: 2, is_home: true, team_a: 1, team_h: 2 },
      ],
      history: [
        { opponent_team: 2, total_points: 8, minutes: 90 },
        { opponent_team: 2, total_points: 2, minutes: 90 },
        { opponent_team: 2, total_points: 0, minutes: 0 },
      ],
      teams: TEAMS,
      limit: 4,
    });
    // Averaged over the two appearances; the blank is excluded.
    expect(records[0]?.averagePoints).toBe(5);
    expect(records[0]?.sample).toBe(2);
    expect(records[1]?.averagePoints).toBeNull();
    expect(records[1]?.sample).toBe(0);
    expect(records[1]?.difficulty).toBe(2);
  });

  const candidate = (
    id: number,
    name: string,
    pointsPerGame: number,
    minutesPerGame: number,
    availability = "a",
  ) => ({
    elementId: id,
    name,
    team: "ARS",
    pointsPerGame,
    minutesPerGame,
    seasonPoints: 0,
    goals: 0,
    assists: 0,
    defending: 0,
    bonus: 0,
    fplStats: { pointsPerMatch: pointsPerGame, form: pointsPerGame, minutes: minutesPerGame * 3,
      starts: minutesPerGame >= 60 ? 3 : 0, cleanSheets: 0, expectedGoals: pointsPerGame, expectedAssists: 0 },
    availability,
    news: "",
    opponents: [],
  });

  it("pairs each swap within a position and ranks by the gain", () => {
    const squad = [candidate(1, "WeakDef", 0.2, 0), candidate(2, "WeakMid", 1.5, 80)];
    const pool = [candidate(10, "GoodDef", 3.4, 90), candidate(11, "OkMid", 1.9, 85)];
    const swaps = buildWaiverPlan({
      squad,
      squadPositions: new Map([[1, "DEF"], [2, "MID"]]),
      pool,
      poolPositions: new Map([[10, "DEF"], [11, "MID"]]),
      competition: new Map(),
    });
    expect(swaps).toHaveLength(2);
    expect(swaps[0]?.position).toBe("DEF");
    expect(swaps[0]?.in.name).toBe("GoodDef");
    expect(swaps[0]?.out.name).toBe("WeakDef");
    // The bigger upgrade is ranked first.
    expect(swaps[0]!.gain).toBeGreaterThan(swaps[1]!.gain);
  });

  it("ranks weak spots worst first and lists a healthy regular only when a claim would drop him", () => {
    const squad = [
      candidate(1, "SolidDef", 3.0, 90),
      candidate(2, "LowDef", 1.2, 88),
      candidate(3, "Cameo", 0.4, 12),
      candidate(4, "Crocked", 2.2, 80, "i"),
      candidate(5, "Knock", 2.5, 85, "d"),
    ];
    const squadPositions = new Map<number, "DEF" | "MID">([
      [1, "DEF"],
      [2, "DEF"],
      [3, "MID"],
      [4, "MID"],
      [5, "MID"],
    ]);
    const swaps = buildWaiverPlan({
      squad,
      squadPositions,
      pool: [candidate(10, "FreeDef", 2.0, 90)],
      poolPositions: new Map([[10, "DEF"]]),
      competition: new Map(),
    });
    const spots = buildWeakSpots({ squad, squadPositions, swaps });
    expect(spots.map((spot) => `${spot.player.name}:${spot.weakness}`)).toEqual([
      "Crocked:injured",
      "Knock:doubtful",
      "Cameo:fringe",
      "LowDef:lowest",
    ]);
    // A solid defender is never a weak spot, however low he ranks.
    expect(spots.some((spot) => spot.player.name === "SolidDef")).toBe(false);
  });

  it("never proposes a cross-position swap", () => {
    const swaps = buildWaiverPlan({
      squad: [candidate(1, "WeakFwd", 0.1, 5)],
      squadPositions: new Map([[1, "FWD"]]),
      pool: [candidate(10, "GreatDef", 5, 90)],
      poolPositions: new Map([[10, "DEF"]]),
      competition: new Map(),
    });
    expect(swaps).toEqual([]);
  });

  it("proposes nothing when the pool is no better", () => {
    const swaps = buildWaiverPlan({
      squad: [candidate(1, "Mine", 3.4, 90)],
      squadPositions: new Map([[1, "DEF"]]),
      pool: [candidate(10, "Worse", 0.4, 10)],
      poolPositions: new Map([[10, "DEF"]]),
      competition: new Map(),
    });
    expect(swaps).toEqual([]);
  });

  it("gives every swap a different outgoing player so none is skipped", () => {
    const swaps = buildWaiverPlan({
      squad: [candidate(1, "A", 0.2, 0), candidate(2, "B", 0.3, 10), candidate(3, "C", 0.1, 0)],
      squadPositions: new Map([[1, "DEF"], [2, "MID"], [3, "FWD"]]),
      pool: [candidate(10, "X", 3, 90), candidate(11, "Y", 3, 90), candidate(12, "Z", 3, 90)],
      poolPositions: new Map([[10, "DEF"], [11, "MID"], [12, "FWD"]]),
      competition: new Map(),
    });
    const outgoing = swaps.map((swap) => swap.out.elementId);
    expect(new Set(outgoing).size).toBe(outgoing.length);
  });

  it("prefers a fit starter over an injured player with a better rate", () => {
    const swaps = buildWaiverPlan({
      squad: [candidate(1, "Mine", 1.0, 90)],
      squadPositions: new Map([[1, "DEF"]]),
      pool: [candidate(10, "Injured", 6, 90, "i"), candidate(11, "Fit", 2.5, 90)],
      poolPositions: new Map([[10, "DEF"], [11, "DEF"]]),
      competition: new Map(),
    });
    expect(swaps[0]?.in.name).toBe("Fit");
  });
});

describe("current roster", () => {
  const pick = (element: number, position: number) => ({ element, position });
  const move = (o: Partial<{ event: number; entry: number; index: number; element_in: number; element_out: number; result: string }>) => ({
    event: 3, entry: 900, index: 1, element_in: 0, element_out: 0, result: "a", ...o,
  });

  it("replays an accepted move onto the published lineup", () => {
    const roster = applyTransactions({
      picks: [pick(1, 1), pick(2, 2)],
      transactions: [move({ element_in: 99, element_out: 2 })],
      entryId: 900,
      afterEvent: 2,
    });
    expect(roster.map((p) => p.element)).toEqual([1, 99]);
    // The incoming player inherits the slot of the one they replaced.
    expect(roster.find((p) => p.element === 99)?.position).toBe(2);
  });

  it("ignores other managers' moves", () => {
    const roster = applyTransactions({
      picks: [pick(1, 1)],
      transactions: [move({ entry: 111, element_in: 99, element_out: 1 })],
      entryId: 900,
      afterEvent: 2,
    });
    expect(roster.map((p) => p.element)).toEqual([1]);
  });

  it("ignores denied claims and moves already reflected in the lineup", () => {
    const roster = applyTransactions({
      picks: [pick(1, 1)],
      transactions: [
        move({ element_in: 99, element_out: 1, result: "di" }),
        move({ event: 2, element_in: 98, element_out: 1 }),
      ],
      entryId: 900,
      afterEvent: 2,
    });
    expect(roster.map((p) => p.element)).toEqual([1]);
  });

  it("applies a chain of moves in processing order", () => {
    const roster = applyTransactions({
      picks: [pick(1, 1)],
      transactions: [
        move({ index: 2, element_in: 3, element_out: 2 }),
        move({ index: 1, element_in: 2, element_out: 1 }),
      ],
      entryId: 900,
      afterEvent: 2,
    });
    // 1 becomes 2, then 2 becomes 3 — order matters.
    expect(roster.map((p) => p.element)).toEqual([3]);
  });

  it("skips a move whose outgoing player is no longer held", () => {
    const roster = applyTransactions({
      picks: [pick(1, 1)],
      transactions: [move({ element_in: 99, element_out: 55 })],
      entryId: 900,
      afterEvent: 2,
    });
    expect(roster.map((p) => p.element)).toEqual([1]);
  });

  it("leaves the lineup untouched when nothing has happened since", () => {
    const picks = [pick(1, 1), pick(2, 2)];
    expect(applyTransactions({ picks, transactions: [], entryId: 900, afterEvent: 2 })).toEqual(picks);
  });
});
