/**
 * Pure derivations over FPL Draft API payloads.
 *
 * Kept free of I/O so the API traps this game has are covered by unit tests:
 * the two id namespaces, results that must be derived from scores, and
 * `matches_played` counts that cannot be trusted.
 */

import type {
  DraftElement,
  DraftElementStatusRow,
  DraftFixture,
  DraftLeagueEntry,
  DraftLiveEvent,
  DraftMatch,
  DraftPick,
  DraftTeam,
} from "./api.js";
import { assessWaiver, hasEstablishedMinutes, type WaiverAssessment } from "./waiver-rules.js";

export type Position = "GKP" | "DEF" | "MID" | "FWD";
export const POSITIONS: readonly Position[] = ["GKP", "DEF", "MID", "FWD"];

export interface Manager {
  /** League-scoped id: matches, standings and element ownership use this. */
  leagueEntryId: number;
  /** Global entry id: `/entry/{id}/…` paths use this. */
  entryId: number;
  teamName: string;
  managerName: string;
  shortName: string;
  waiverPick: number | null;
}

export interface ManagerIndex {
  managers: Manager[];
  byLeagueEntry: Map<number, Manager>;
  byEntry: Map<number, Manager>;
}

export function buildManagerIndex(entries: DraftLeagueEntry[]): ManagerIndex {
  const managers = entries.map((entry) => ({
    leagueEntryId: entry.id,
    entryId: entry.entry_id,
    teamName: entry.entry_name,
    managerName: `${entry.player_first_name} ${entry.player_last_name}`.trim(),
    shortName: entry.short_name,
    waiverPick: entry.waiver_pick,
  }));
  return {
    managers,
    byLeagueEntry: new Map(managers.map((m) => [m.leagueEntryId, m])),
    byEntry: new Map(managers.map((m) => [m.entryId, m])),
  };
}

/**
 * Resolve a manager by team name, manager name or short name.
 * Returns null when the query is absent, unmatched or ambiguous.
 */
export function resolveManager(index: ManagerIndex, query: string): Manager | null {
  const needle = query.trim().toLocaleLowerCase();
  if (needle.length === 0) return null;
  const matches = index.managers.filter((manager) =>
    [manager.teamName, manager.managerName, manager.shortName].some(
      (candidate) => candidate.toLocaleLowerCase() === needle,
    ),
  );
  return matches.length === 1 ? (matches[0] ?? null) : null;
}

export type MatchResult = "W" | "D" | "L";

/**
 * The API leaves `winning_league_entry` null even on finished, decisive
 * matches, so results are always derived by comparing the two scores.
 */
export function resultFor(pointsFor: number, pointsAgainst: number): MatchResult {
  if (pointsFor > pointsAgainst) return "W";
  if (pointsFor < pointsAgainst) return "L";
  return "D";
}

export interface TableRow {
  leagueEntryId: number;
  rank: number;
  won: number;
  drawn: number;
  lost: number;
  played: number;
  pointsFor: number;
  pointsAgainst: number;
  leaguePoints: number;
  /** Results oldest to newest, for the form strip. */
  form: MatchResult[];
  /** Points scored per gameweek played. */
  averageFor: number;
}

export interface H2HPointsRules {
  h2h_win: number;
  h2h_draw: number;
  h2h_lose: number;
}

/**
 * Build the league table from match scores.
 *
 * `includeUnfinished` folds started-but-unfinished matches in at their current
 * score, which is what makes the projected table move while a week is live.
 * `standings[].matches_played` from the API always reports the number of
 * matches *scheduled* (38), so played counts are derived here instead.
 */
export function buildTable(args: {
  matches: DraftMatch[];
  managers: Manager[];
  rules: H2HPointsRules;
  includeUnfinished: boolean;
}): TableRow[] {
  const { matches, managers, rules, includeUnfinished } = args;
  const rows = new Map<number, Omit<TableRow, "rank">>();
  for (const manager of managers) {
    rows.set(manager.leagueEntryId, {
      leagueEntryId: manager.leagueEntryId,
      won: 0,
      drawn: 0,
      lost: 0,
      played: 0,
      pointsFor: 0,
      pointsAgainst: 0,
      leaguePoints: 0,
      form: [],
      averageFor: 0,
    });
  }

  const counted = matches
    .filter((match) => (includeUnfinished ? match.started : match.finished))
    // Oldest first, so the form strip reads left to right.
    .sort((a, b) => a.event - b.event);
  for (const match of counted) {
    const home = rows.get(match.league_entry_1);
    const away = rows.get(match.league_entry_2);
    if (home === undefined || away === undefined) continue;
    const homePoints = match.league_entry_1_points;
    const awayPoints = match.league_entry_2_points;
    for (const [side, pointsFor, pointsAgainst] of [
      [home, homePoints, awayPoints],
      [away, awayPoints, homePoints],
    ] as const) {
      side.played += 1;
      side.pointsFor += pointsFor;
      side.pointsAgainst += pointsAgainst;
      const result = resultFor(pointsFor, pointsAgainst);
      side.form.push(result);
      if (result === "W") {
        side.won += 1;
        side.leaguePoints += rules.h2h_win;
      } else if (result === "D") {
        side.drawn += 1;
        side.leaguePoints += rules.h2h_draw;
      } else {
        side.lost += 1;
        side.leaguePoints += rules.h2h_lose;
      }
    }
  }

  return [...rows.values()]
    .map((row) => ({
      ...row,
      averageFor:
        row.played === 0 ? 0 : Math.round((row.pointsFor / row.played) * 10) / 10,
    }))
    .sort(
      (a, b) =>
        b.leaguePoints - a.leaguePoints ||
        b.pointsFor - b.pointsAgainst - (a.pointsFor - a.pointsAgainst) ||
        b.pointsFor - a.pointsFor ||
        a.leagueEntryId - b.leagueEntryId,
    )
    .map((row, position) => ({ ...row, rank: position + 1 }));
}

export interface ProjectedTableRow extends TableRow {
  /** Positive when the live results would move this team up the table. */
  rankDelta: number;
  liveLeaguePoints: number;
}

/**
 * Pair the settled table with the one implied by in-flight scores, so the
 * panel can show what the week is currently doing to the standings.
 */
export function buildProjectedTable(args: {
  matches: DraftMatch[];
  managers: Manager[];
  rules: H2HPointsRules;
}): ProjectedTableRow[] {
  const settled = buildTable({ ...args, includeUnfinished: false });
  const projected = buildTable({ ...args, includeUnfinished: true });
  const settledRank = new Map(settled.map((row) => [row.leagueEntryId, row]));
  return projected.map((row) => {
    const before = settledRank.get(row.leagueEntryId);
    return {
      ...row,
      rankDelta: before === undefined ? 0 : before.rank - row.rank,
      liveLeaguePoints:
        row.leaguePoints - (before === undefined ? 0 : before.leaguePoints),
    };
  });
}

export interface MatchupSide {
  leagueEntryId: number;
  teamName: string;
  managerName: string;
  points: number;
  result: MatchResult | null;
}

export interface Matchup {
  event: number;
  started: boolean;
  finished: boolean;
  home: MatchupSide;
  away: MatchupSide;
}

export function buildMatchups(
  matches: DraftMatch[],
  index: ManagerIndex,
  event: number,
): Matchup[] {
  return matches
    .filter((match) => match.event === event)
    .map((match) => {
      const homeManager = index.byLeagueEntry.get(match.league_entry_1);
      const awayManager = index.byLeagueEntry.get(match.league_entry_2);
      const decided = match.started;
      const side = (
        manager: Manager | undefined,
        leagueEntryId: number,
        points: number,
        against: number,
      ): MatchupSide => ({
        leagueEntryId,
        teamName: manager?.teamName ?? "Unknown team",
        managerName: manager?.managerName ?? "",
        points,
        result: decided ? resultFor(points, against) : null,
      });
      return {
        event: match.event,
        started: match.started,
        finished: match.finished,
        home: side(
          homeManager,
          match.league_entry_1,
          match.league_entry_1_points,
          match.league_entry_2_points,
        ),
        away: side(
          awayManager,
          match.league_entry_2,
          match.league_entry_2_points,
          match.league_entry_1_points,
        ),
      };
    });
}

export function positionOf(
  element: DraftElement,
  types: { id: number; singular_name_short: string }[],
): Position {
  const type = types.find((candidate) => candidate.id === element.element_type);
  const short = type?.singular_name_short ?? "";
  return (POSITIONS as readonly string[]).includes(short) ? (short as Position) : "MID";
}

export interface SquadPlayer {
  elementId: number;
  name: string;
  team: string;
  position: Position;
  /** 1-11 is the starting XI, 12-15 the bench in order. */
  slot: number;
  starting: boolean;
  eventPoints: number;
  eventMinutes: number;
  /** Season average, used to mark substitutes. Independent of availability. */
  minutesPerGame: number;
  availability: string;
  news: string;
}

export function buildSquad(args: {
  picks: DraftPick[];
  elements: Map<number, DraftElement>;
  teams: Map<number, DraftTeam>;
  types: { id: number; singular_name_short: string }[];
  live: DraftLiveEvent | null;
  gamesPlayed?: number;
}): SquadPlayer[] {
  const { picks, elements, teams, types, live } = args;
  const games = Math.max(1, args.gamesPlayed ?? 1);
  return [...picks]
    .sort((a, b) => a.position - b.position)
    .map((pick) => {
      const element = elements.get(pick.element);
      const stats = live?.elements[String(pick.element)]?.stats;
      return {
        elementId: pick.element,
        name: element?.web_name ?? `#${pick.element}`,
        team: element === undefined ? "" : (teams.get(element.team)?.short_name ?? ""),
        position: element === undefined ? "MID" : positionOf(element, types),
        slot: pick.position,
        starting: pick.position <= 11,
        eventPoints: stats?.total_points ?? 0,
        eventMinutes: stats?.minutes ?? 0,
        minutesPerGame: Math.round((element?.minutes ?? 0) / games),
        availability: element?.status ?? "a",
        news: element?.news ?? "",
      };
    });
}

/**
 * A manager's roster as it stands now.
 *
 * Future-gameweek picks return 404, so the only readable lineup is the last
 * started gameweek. Any waiver or free-agent move made since then has already
 * changed the squad, so those transactions are replayed over the published
 * picks. Without this the plugin recommends dropping players you no longer own.
 */
export function applyTransactions(args: {
  picks: DraftPick[];
  transactions: {
    event: number;
    entry: number;
    index: number;
    element_in: number;
    element_out: number;
    result: string;
  }[];
  entryId: number;
  afterEvent: number;
}): DraftPick[] {
  const { picks, transactions, entryId, afterEvent } = args;
  const applicable = transactions
    .filter(
      (transaction) =>
        transaction.entry === entryId &&
        transaction.event > afterEvent &&
        transaction.result === "a",
    )
    .sort((a, b) => a.event - b.event || a.index - b.index);
  const roster = picks.map((pick) => ({ ...pick }));
  for (const move of applicable) {
    const slot = roster.find((pick) => pick.element === move.element_out);
    // A move whose outgoing player is already gone has nothing to replace.
    if (slot === undefined) continue;
    slot.element = move.element_in;
  }
  return roster;
}

export interface FixtureRun {
  event: number;
  opponent: string;
  isHome: boolean;
  difficulty: number;
}

/**
 * Fixture difficulty is a property of the team, not the player: every player
 * at a club returns the same run. One `element-summary` call per team is
 * therefore enough to cover the whole player pool.
 */
export function buildFixtureRun(
  fixtures: DraftFixture[],
  teams: Map<number, DraftTeam>,
  limit: number,
): FixtureRun[] {
  return fixtures.slice(0, limit).map((fixture) => ({
    event: fixture.event,
    opponent:
      teams.get(fixture.is_home ? fixture.team_a : fixture.team_h)?.short_name ?? "",
    isHome: fixture.is_home,
    difficulty: fixture.difficulty,
  }));
}

export interface PlayerRow {
  elementId: number;
  name: string;
  team: string;
  position: Position;
  ownedBy: string | null;
  goals: number;
  assists: number;
  defensiveContribution: number;
  bonus: number;
  /** Expected playing time is not published; starts and minutes stand in. */
  starts: number;
  minutes: number;
  chanceOfPlaying: number | null;
  totalPoints: number;
  pointsPerGame: number;
  form: number;
  availability: string;
  news: string;
  fixtures: FixtureRun[];
  fixtureDifficulty: number | null;
}

function toNumber(value: string | null | undefined): number {
  const parsed = Number.parseFloat(value ?? "0");
  return Number.isFinite(parsed) ? parsed : 0;
}

function meanDifficulty(fixtures: FixtureRun[]): number | null {
  if (fixtures.length === 0) return null;
  const total = fixtures.reduce((sum, fixture) => sum + fixture.difficulty, 0);
  return Number((total / fixtures.length).toFixed(2));
}

export function buildPlayerRows(args: {
  elements: DraftElement[];
  teams: Map<number, DraftTeam>;
  types: { id: number; singular_name_short: string }[];
  ownership: Map<number, DraftElementStatusRow>;
  index: ManagerIndex;
  fixturesByTeam: Map<number, FixtureRun[]>;
}): PlayerRow[] {
  const { elements, teams, types, ownership, index, fixturesByTeam } = args;
  return elements
    // `u` marks players who have left the league; the official UI hides them.
    .filter((element) => element.status !== "u")
    .map((element) => {
      const status = ownership.get(element.id);
      // Ownership is the one league-scoped payload keyed by the *global*
      // entry id. Matches and standings use the league-entry id instead, so
      // this lookup deliberately goes through the other map.
      const owner =
        status?.owner == null
          ? null
          : (index.byEntry.get(status.owner)?.teamName ?? null);
      const fixtures = fixturesByTeam.get(element.team) ?? [];
      return {
        elementId: element.id,
        name: element.web_name,
        team: teams.get(element.team)?.short_name ?? "",
        position: positionOf(element, types),
        ownedBy: owner,
        goals: element.goals_scored,
        assists: element.assists,
        defensiveContribution: element.defensive_contribution,
        bonus: element.bonus,
        starts: element.starts,
        minutes: element.minutes,
        chanceOfPlaying: element.chance_of_playing_next_round,
        totalPoints: element.total_points,
        pointsPerGame: toNumber(element.points_per_game),
        form: toNumber(element.form),
        availability: element.status,
        news: element.news,
        fixtures,
        fixtureDifficulty: meanDifficulty(fixtures),
      };
    });
}

export type OwnershipFilter = "all" | "free" | "owned";

export function filterPlayers(
  rows: PlayerRow[],
  filters: { position: Position | "all"; ownership: OwnershipFilter; query: string },
): PlayerRow[] {
  const query = filters.query.trim().toLocaleLowerCase();
  return rows.filter((row) => {
    if (filters.position !== "all" && row.position !== filters.position) return false;
    if (filters.ownership === "free" && row.ownedBy !== null) return false;
    if (filters.ownership === "owned" && row.ownedBy === null) return false;
    if (query.length === 0) return true;
    return (
      row.name.toLocaleLowerCase().includes(query) ||
      row.team.toLocaleLowerCase().includes(query)
    );
  });
}

export type PlayerSortKey =
  | "totalPoints"
  | "form"
  | "goals"
  | "assists"
  | "defensiveContribution"
  | "bonus"
  | "minutes"
  | "fixtureDifficulty";

export function sortPlayers(rows: PlayerRow[], key: PlayerSortKey): PlayerRow[] {
  return [...rows].sort((a, b) => {
    if (key === "fixtureDifficulty") {
      // An easier run is a better run, so this column sorts ascending.
      const left = a.fixtureDifficulty ?? Number.POSITIVE_INFINITY;
      const right = b.fixtureDifficulty ?? Number.POSITIVE_INFINITY;
      return left - right || b.totalPoints - a.totalPoints;
    }
    return b[key] - a[key] || b.totalPoints - a.totalPoints;
  });
}

/** Comparison is only meaningful within a position, so mixed sets are rejected. */
export function comparablePosition(rows: PlayerRow[]): Position | null {
  const first = rows[0];
  if (first === undefined) return null;
  return rows.every((row) => row.position === first.position) ? first.position : null;
}

/* -------------------------------------------------------------------------
 * Waiver model
 *
 * Draft fixes the squad at 2/5/5/3 and every transaction observed in a real
 * league was a like-for-like positional swap, so the swap — not the player —
 * is the unit of recommendation.
 * ---------------------------------------------------------------------- */

/** Games of zero production added to damp small samples. */
export const SHRINK_GAMES = 3;
/** Below this average a player is a substitute rather than a starter. */
export const STARTER_MINUTES = 30;

export interface PlayerValue {
  /**
   * Points per game, shrunk by three empty games so a substitute who scored
   * once cannot outrank a regular starter this early in a season.
   */
  pointsPerGame: number;
  /** Average minutes per game. 90 is every minute of every match. */
  minutesPerGame: number;
  available: boolean;
}

export function valuePlayer(
  element: DraftElement,
  gamesPlayed: number,
): PlayerValue {
  const games = Math.max(1, gamesPlayed);
  const minutes = element.minutes ?? 0;
  return {
    pointsPerGame:
      Math.round((element.total_points / (games + SHRINK_GAMES)) * 10) / 10,
    minutesPerGame: Math.round(minutes / games),
    available: element.status === "a",
  };
}

/** A rostered player who cannot be relied on: unavailable, or a substitute. */
export function isWeak(element: DraftElement, gamesPlayed: number): boolean {
  if (element.status === "i" || element.status === "s" || element.status === "u") return true;
  return valuePlayer(element, gamesPlayed).minutesPerGame < STARTER_MINUTES;
}

export interface PositionCompetition {
  position: Position;
  /** Managers carrying at least one weak player in this position. */
  managersNeeding: number;
  totalManagers: number;
  /**
   * Waiver picks of the managers who need this position, ascending. A rival
   * whose pick comes before yours can take the player before your claim runs.
   */
  needingPicks: number[];
}

/**
 * How crowded a position is across the whole league. This is the honest
 * substitute for contention: pending claims are not readable by anyone, so
 * competition is inferred from who has a hole rather than who has claimed.
 */
export function buildCompetition(args: {
  squads: Map<number, DraftPick[]>;
  elements: Map<number, DraftElement>;
  types: { id: number; singular_name_short: string }[];
  gamesPlayed: number;
  /** Waiver pick for a manager, keyed by global entry id. */
  waiverPickOf?: (entryId: number) => number | null;
}): Map<Position, PositionCompetition> {
  const { squads, elements, types, gamesPlayed } = args;
  const waiverPickOf = args.waiverPickOf ?? (() => null);
  const needing = new Map<Position, Set<number>>(
    POSITIONS.map((position) => [position, new Set<number>()]),
  );
  for (const [entryId, picks] of squads) {
    const hasPlayingKeeper = picks.some(pick => {
      const element = elements.get(pick.element);
      return element !== undefined && positionOf(element, types) === "GKP" &&
        element.status === "a" && valuePlayer(element, gamesPlayed).minutesPerGame >= STARTER_MINUTES;
    });
    for (const pick of picks) {
      const element = elements.get(pick.element);
      if (element === undefined || !isWeak(element, gamesPlayed)) continue;
      if (hasPlayingKeeper && positionOf(element, types) === "GKP") continue;
      needing.get(positionOf(element, types))?.add(entryId);
    }
  }
  return new Map(
    POSITIONS.map((position) => {
      const entries = [...(needing.get(position) ?? [])];
      return [
        position,
        {
          position,
          managersNeeding: entries.length,
          totalManagers: squads.size,
          needingPicks: entries
            .map((entryId) => waiverPickOf(entryId))
            .filter((pick): pick is number => pick !== null)
            .sort((a, b) => a - b),
        },
      ];
    }),
  );
}

export interface OpponentRecord {
  opponent: string;
  /** Average points this player scored against this club, when known. */
  averagePoints: number | null;
  /** Matches behind the average. Two is the realistic ceiling per season. */
  sample: number;
  /** Used when there is no head-to-head history. */
  difficulty: number;
  isHome: boolean;
  event: number;
}

/**
 * Per-opponent record for the next fixtures. Falls back to club difficulty
 * whenever this player has never faced that opponent in the available history.
 */
export function buildOpponentRecords(args: {
  fixtures: DraftFixture[];
  history: { opponent_team: number; total_points: number; minutes: number }[];
  teams: Map<number, DraftTeam>;
  limit: number;
}): OpponentRecord[] {
  const { fixtures, history, teams, limit } = args;
  return fixtures.slice(0, limit).map((fixture) => {
    const opponentId = fixture.is_home ? fixture.team_a : fixture.team_h;
    const met = history.filter(
      (entry) => entry.opponent_team === opponentId && entry.minutes > 0,
    );
    const averagePoints =
      met.length === 0
        ? null
        : Number(
            (met.reduce((sum, entry) => sum + entry.total_points, 0) / met.length).toFixed(1),
          );
    return {
      opponent: teams.get(opponentId)?.short_name ?? "",
      averagePoints,
      sample: met.length,
      difficulty: fixture.difficulty,
      isHome: fixture.is_home,
      event: fixture.event,
    };
  });
}

export interface SwapCandidate {
  elementId: number;
  name: string;
  team: string;
  pointsPerGame: number;
  minutesPerGame: number;
  seasonPoints: number;
  goals: number;
  assists: number;
  defending: number;
  bonus: number;
  /** Published FPL stats for display and evidence rules; per-game fields retain their meaning. */
  fplStats?: {
    pointsPerMatch: number | null;
    form?: number | null;
    minutes: number;
    starts: number;
    cleanSheets: number;
    expectedGoals: number | null;
    expectedAssists: number | null;
  };
  availability: string;
  news: string;
  opponents: OpponentRecord[];
}

export interface Swap {
  position: Position;
  out: SwapCandidate;
  in: SwapCandidate;
  fallbacks: SwapCandidate[];
  gain: number;
  /** Evidence for priority, separate from the existing points-based gain. */
  assessment?: WaiverAssessment;
  /** Improvement to the best legal XI's rating, not predicted match points. */
  lineupGain?: number;
  /** The incumbent who would leave the XI, which may differ from the drop. */
  lineupOut?: string;
  competition: PositionCompetition;
}

function meanDifficultyOf(records: OpponentRecord[]): number {
  if (records.length === 0) return 3;
  return records.reduce((sum, r) => sum + r.difficulty, 0) / records.length;
}

function rank(candidate: SwapCandidate): number {
  const security = Math.min(1, candidate.minutesPerGame / 90);
  const fixtureAdjustment = 1 + (3 - meanDifficultyOf(candidate.opponents)) * 0.1;
  const availability =
    candidate.availability === "a" ? 1 : candidate.availability === "d" ? 0.5 : 0.05;
  return candidate.pointsPerGame * (0.35 + 0.65 * security) * fixtureAdjustment * availability;
}

/** One keeper, at least 3 defenders, 2 midfielders and 1 forward; 11 total. */
function strongestLineup(squad: SwapCandidate[], positions: Map<number, Position>) {
  const limits: Record<Position, [number, number]> = { GKP: [1, 1], DEF: [3, 5], MID: [2, 5], FWD: [1, 3] };
  const selected: SwapCandidate[] = [];
  const remaining: SwapCandidate[] = [];
  for (const position of POSITIONS) {
    const [min, max] = limits[position];
    const players = squad.filter(player => positions.get(player.elementId) === position)
      .sort((a, b) => rank(b) - rank(a)).slice(0, max);
    if (players.length < min) return null;
    selected.push(...players.slice(0, min));
    remaining.push(...players.slice(min));
  }
  selected.push(...remaining.sort((a, b) => rank(b) - rank(a)).slice(0, 11 - selected.length));
  if (selected.length !== 11) return null;
  return { players: selected, rating: selected.reduce((total, player) => total + rank(player), 0) };
}

/**
 * One swap per position across the full squad, including reserves. Supported
 * upgrades precede depth options; points-only upgrades are not recommended.
 *
 * Each swap drops a different player on purpose: the Draft waiver run skips a
 * later claim whose outgoing player has already left, which is how a real
 * manager in this league wasted two of six claims.
 */
export function buildWaiverPlan(args: {
  squad: SwapCandidate[];
  squadPositions: Map<number, Position>;
  pool: SwapCandidate[];
  poolPositions: Map<number, Position>;
  competition: Map<Position, PositionCompetition>;
  minimumGain?: number;
}): Swap[] {
  const { squad, squadPositions, pool, poolPositions, competition } = args;
  const minimumGain = args.minimumGain ?? 0.15;
  const before = strongestLineup(squad, squadPositions);
  const swaps: Swap[] = [];
  const strength = { upgrade: 2, depth: 1, weak: 0 };
  const priority = (a: Swap, b: Swap) =>
    strength[b.assessment!.strength] - strength[a.assessment!.strength] || b.gain - a.gain ||
    a.out.elementId - b.out.elementId || a.in.elementId - b.in.elementId;
  for (const position of POSITIONS) {
    const mine = squad.filter(p => squadPositions.get(p.elementId) === position);
    const theirs = pool.filter(p => poolPositions.get(p.elementId) === position);
    const options: Swap[] = [];
    for (const out of mine) {
      const coveredKeeper = position === "GKP" && mine.some(player => player.elementId !== out.elementId && hasEstablishedMinutes(player));
      for (const incoming of theirs) {
        if (incoming.elementId === out.elementId) continue;
        const gain = Number((rank(incoming) - rank(out)).toFixed(2));
        if (gain <= minimumGain) continue;
        const assessment = assessWaiver({ out, incoming, position, coveredKeeper });
        if (assessment.strength === "weak") continue;
        options.push({ position, out, in: incoming, gain, assessment, fallbacks: [],
          competition: competition.get(position) ?? { position, managersNeeding: 0, totalManagers: 0, needingPicks: [] },
        });
      }
    }
    options.sort(priority);
    const best = options[0];
    if (!best) continue;
    // Fallbacks must improve the same outgoing slot under the same evidence rules.
    best.fallbacks = options.filter(option => option.out.elementId === best.out.elementId && option.in.elementId !== best.in.elementId)
      .slice(0, 2).map(option => option.in);
    swaps.push(best);
  }
  swaps.sort(priority);
  if (before === null) return swaps;
  // Preserve optional XI metrics for existing RPC consumers. They do not rank
  // or filter squad upgrades, including the fallback players.
  let held = squad;
  const positions = new Map(squadPositions);
  return swaps.map(swap => {
    const baseline = strongestLineup(held, positions)!;
    held = [...held.filter(player => player.elementId !== swap.out.elementId), swap.in];
    positions.set(swap.in.elementId, swap.position);
    const after = strongestLineup(held, positions)!;
    const lineupOut = baseline.players.find(player => !after.players.some(next => next.elementId === player.elementId))?.name;
    return { ...swap,
      lineupGain: Number((after.rating - baseline.rating).toFixed(2)),
      ...(lineupOut === undefined ? {} : { lineupOut }),
    };
  });
}

/** Why a rostered player counts against you, from most to least serious. */
export type Weakness =
  | "injured"
  | "suspended"
  | "unavailable"
  | "doubtful"
  | "fringe"
  | "lowest";

const WEAKNESS_ORDER: Weakness[] = [
  "injured",
  "suspended",
  "unavailable",
  "doubtful",
  "fringe",
  "lowest",
];

export function weaknessOf(candidate: SwapCandidate): Weakness {
  switch (candidate.availability) {
    case "i":
      return "injured";
    case "s":
      return "suspended";
    case "u":
    case "n":
      return "unavailable";
    case "d":
      return "doubtful";
    default:
      return candidate.minutesPerGame < STARTER_MINUTES ? "fringe" : "lowest";
  }
}

export interface WeakSpot {
  position: Position;
  player: SwapCandidate;
  weakness: Weakness;
}

/**
 * Squad problems ranked without preferring the latest starters. A covered
 * backup keeper is not a weakness. A healthy regular is listed only when a
 * planned claim drops him.
 */
export function buildWeakSpots(args: {
  squad: SwapCandidate[];
  squadPositions: Map<number, Position>;
  swaps: Swap[];
  startingElementIds?: ReadonlySet<number>;
}): WeakSpot[] {
  const { squad, squadPositions, swaps, startingElementIds } = args;
  const dropped = new Set(swaps.map((swap) => swap.out.elementId));
  const coveredKeeper = squad.some(player => squadPositions.get(player.elementId) === "GKP" &&
    startingElementIds?.has(player.elementId) && player.availability === "a" && player.minutesPerGame >= STARTER_MINUTES);
  return squad
    .map((player) => ({
      position: squadPositions.get(player.elementId) ?? "MID",
      player,
      weakness: weaknessOf(player),
    }))
    .filter((spot) => spot.weakness !== "lowest" || dropped.has(spot.player.elementId))
    .filter(spot => !(coveredKeeper && spot.position === "GKP" && !startingElementIds?.has(spot.player.elementId)))
    .sort(
      (a, b) =>
        WEAKNESS_ORDER.indexOf(a.weakness) - WEAKNESS_ORDER.indexOf(b.weakness) ||
        rank(a.player) - rank(b.player),
    );
}
