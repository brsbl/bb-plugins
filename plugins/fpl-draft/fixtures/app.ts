/** Invented data only. Numeric IDs are fixture keys, never live API inputs. */
export const LEAGUE = {
  leagueName: "Lantern Cup",
  scoring: "h",
  transactionMode: "waivers",
  currentEvent: 2,
  nextEvent: 3,
  events: [
    { id: 1, name: "Gameweek 1", deadlineTime: "2026-08-21T17:30:00Z", finished: true, started: true },
    { id: 2, name: "Gameweek 2", deadlineTime: "2026-08-28T17:30:00Z", finished: false, started: true },
    { id: 3, name: "Gameweek 3", deadlineTime: "2026-09-04T17:30:00Z", finished: false, started: false },
  ],
  managers: [
    { leagueEntryId: 910002, entryId: 920002, teamName: "Copper Kites", managerName: "Manager Amber", shortName: "CK", waiverPick: 6 },
    { leagueEntryId: 910001, entryId: 920001, teamName: "Velvet Comets", managerName: "Manager Indigo", shortName: "VC", waiverPick: 3 },
  ],
  viewerLeagueEntryId: 910002,
  viewerWarning: null,
};

export const WEEK = {
  event: 2,
  live: true,
  fetchedAt: "2026-09-01T12:00:00Z",
  matchups: [
    {
      event: 2, started: true, finished: false,
      home: { leagueEntryId: 910001, teamName: "Velvet Comets", managerName: "Manager Indigo", points: 31, result: "L" as const },
      away: { leagueEntryId: 910002, teamName: "Copper Kites", managerName: "Manager Amber", points: 44, result: "W" as const },
    },
  ],
  table: [
    { leagueEntryId: 910002, rank: 1, won: 1, drawn: 1, lost: 0, played: 2, pointsFor: 81, pointsAgainst: 62, leaguePoints: 4, rankDelta: 2, liveLeaguePoints: 3, form: ["D", "W"] as const, averageFor: 40.5 },
    { leagueEntryId: 910001, rank: 2, won: 0, drawn: 0, lost: 2, played: 2, pointsFor: 62, pointsAgainst: 81, leaguePoints: 0, rankDelta: 0, liveLeaguePoints: 0, form: ["L", "L"] as const, averageFor: 31 },
  ],
};

export const sq = (o: Record<string, unknown>) => ({
  elementId: 1, name: "Player", team: "ROS", position: "GKP" as const, slot: 1,
  starting: true, eventPoints: 3, eventMinutes: 90, minutesPerGame: 90,
  availability: "a", news: "", ...o,
});

/** One player per combination of availability and playing time. */
export const MULTI_WEEK = {
  ...WEEK,
  matchups: [
    WEEK.matchups[0]!,
    {
      event: 2, started: true, finished: false,
      home: { leagueEntryId: 900, teamName: "Paper Rockets", managerName: "Manager Cedar", points: 25, result: "L" as const },
      away: { leagueEntryId: 901, teamName: "Silver Acorns", managerName: "Manager Quartz", points: 39, result: "W" as const },
    },
  ],
};

export const SQUAD = {
  available: true, reason: null,
  players: [
    sq({ elementId: 1, name: "Fit", minutesPerGame: 90 }),
    sq({ elementId: 2, name: "Injured", position: "DEF" as const, slot: 2, availability: "i", news: "Calf injury", minutesPerGame: 88 }),
    sq({ elementId: 3, name: "Doubtful", position: "DEF" as const, slot: 3, availability: "d", news: "Knock", minutesPerGame: 85 }),
    sq({ elementId: 4, name: "Fringe", position: "MID" as const, slot: 4, minutesPerGame: 12 }),
    sq({ elementId: 5, name: "InjuredFringe", position: "MID" as const, slot: 5, availability: "i", news: "Foot", minutesPerGame: 4 }),
    sq({ elementId: 6, name: "DoubtfulFringe", position: "FWD" as const, slot: 15, starting: false, availability: "d", news: "Ill", minutesPerGame: 9 }),
  ],
};

export const cand = (o: Record<string, unknown> = {}) => ({
  elementId: 10, name: "Defender Cedar", team: "SIL", pointsPerGame: 3.4, minutesPerGame: 90,
  seasonPoints: 17, goals: 0, assists: 1, defending: 34, bonus: 1,
  availability: "a", news: "",
  fplStats: { pointsPerMatch: 6.8, form: 4.2, minutes: 450, starts: 5, cleanSheets: 2, expectedGoals: 1.23, expectedAssists: 0.45 },
  opponents: [{ opponent: "CED", averagePoints: null, sample: 0, difficulty: 3, isHome: true, event: 3 }],
  ...o,
});

const INJURED_DEFENDER = cand({ elementId: 3, name: "Defender Amber", team: "QUA", pointsPerGame: 0, minutesPerGame: 0, seasonPoints: 0, goals: 0, assists: 0, defending: 0, bonus: 0, availability: "i", news: "Calf injury", opponents: [] });
const RESERVE_KEEPER = cand({ elementId: 4, name: "Keeper Indigo", team: "VIO", pointsPerGame: 0, minutesPerGame: 0, seasonPoints: 0, opponents: [] });

export const PLAN = {
  available: true, reason: null, waiverPick: 6, totalManagers: 12,
  fetchedAt: "2026-09-01T12:00:00Z",
  weakSpots: [
    { position: "DEF" as const, player: INJURED_DEFENDER, weakness: "injured" as const },
    { position: "GKP" as const, player: RESERVE_KEEPER, weakness: "fringe" as const },
    { position: "FWD" as const, player: cand({ elementId: 6, name: "DoubtfulFringe", team: "COP", minutesPerGame: 9, pointsPerGame: 0.2, availability: "d", news: "Ill" }), weakness: "doubtful" as const },
  ],
  swaps: [
    {
      position: "DEF" as const,
      out: INJURED_DEFENDER,
      in: cand(),
      fallbacks: [cand({ elementId: 11, name: "Defender Quartz", pointsPerGame: 2.4 })],
      gain: 3.1,
      // Nine managers need a defender; four of them pick before seat 6.
      competition: { position: "DEF" as const, managersNeeding: 9, totalManagers: 12, needingPicks: [1, 2, 4, 5, 7, 8, 9, 11, 12] },
    },
    {
      position: "GKP" as const,
      out: RESERVE_KEEPER,
      in: cand({ elementId: 12, name: "Keeper Copper", team: "TEA", pointsPerGame: 0.6 }),
      fallbacks: [],
      gain: 0.5,
      competition: { position: "GKP" as const, managersNeeding: 4, totalManagers: 12, needingPicks: [6, 8, 10, 12] },
    },
  ],
};

export const rpc = (o: Record<string, unknown> = {}) => ({
  getLeague: () => LEAGUE, getWeek: () => WEEK, getSquad: () => SQUAD, getWaiverPlan: () => PLAN, getNextWaiverOrder: () => null, ...o,
});

