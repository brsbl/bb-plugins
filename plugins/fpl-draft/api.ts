/**
 * Thin client for the public FPL Draft JSON API.
 *
 * Every endpoint used here is readable without authentication, including for
 * private leagues, so the plugin never stores a credential. The API sends no
 * CORS headers, so these calls only ever run on the plugin server.
 */

const BASE_URL = "https://draft.premierleague.com/api";
const REQUEST_TIMEOUT_MS = 15_000;
const USER_AGENT = "bb-plugin-fpl-draft";

/** Injected so tests run against recorded fixtures instead of the network. */
export type FetchLike = (
  url: string,
  init: { headers: Record<string, string>; signal: AbortSignal },
) => Promise<{ ok: boolean; status: number; json(): Promise<unknown> }>;

export interface DraftTeam {
  id: number;
  name: string;
  short_name: string;
}

export interface DraftElement {
  id: number;
  web_name: string;
  team: number;
  element_type: number;
  status: string;
  news: string;
  draft_rank: number;
  total_points: number;
  event_points: number;
  form: string;
  points_per_game: string;
  minutes: number;
  starts: number;
  goals_scored: number;
  assists: number;
  clean_sheets: number;
  bonus: number;
  bps: number;
  defensive_contribution: number;
  expected_goals: string;
  expected_assists: string;
  chance_of_playing_next_round: number | null;
}

export interface DraftEvent {
  id: number;
  name: string;
  deadline_time: string;
  waivers_time: string | null;
  trades_time: string | null;
  finished: boolean;
}

export interface DraftSquadRules {
  select_GKP: number;
  select_DEF: number;
  select_MID: number;
  select_FWD: number;
  size: number;
  play: number;
}

export interface DraftBootstrap {
  elements: DraftElement[];
  element_types: { id: number; singular_name_short: string }[];
  teams: DraftTeam[];
  events: { current: number | null; next: number | null; data: DraftEvent[] };
  settings: {
    squad: DraftSquadRules;
    league: { h2h_win: number; h2h_draw: number; h2h_lose: number };
  };
}

export interface DraftLeagueEntry {
  /** League-scoped id. Referenced by standings, matches and element ownership. */
  id: number;
  /** Global entry id. Referenced by `/entry/{id}/…` paths and transactions. */
  entry_id: number;
  entry_name: string;
  player_first_name: string;
  player_last_name: string;
  short_name: string;
  waiver_pick: number | null;
}

export interface DraftMatch {
  event: number;
  started: boolean;
  finished: boolean;
  league_entry_1: number;
  league_entry_1_points: number;
  league_entry_2: number;
  league_entry_2_points: number;
}

export interface DraftLeagueDetails {
  league: {
    id: number;
    name: string;
    scoring: string;
    transaction_mode: string;
    start_event: number;
    stop_event: number;
  };
  league_entries: DraftLeagueEntry[];
  matches: DraftMatch[];
}

export interface DraftPick {
  element: number;
  position: number;
}

export interface DraftEntryPicks {
  picks: DraftPick[];
}

export interface DraftTransaction {
  event: number;
  /** Global entry id, not the league-entry id. */
  entry: number;
  index: number;
  kind: string;
  element_in: number;
  element_out: number;
  result: string;
}

export interface DraftElementStatusRow {
  element: number;
  owner: number | null;
  status: string;
  in_accepted_trade: boolean;
}

export interface DraftLiveEvent {
  elements: Record<string, { stats: { total_points: number; minutes: number } }>;
}

export interface DraftFixture {
  event: number;
  difficulty: number;
  is_home: boolean;
  team_a: number;
  team_h: number;
}

export interface DraftSettingsSquad {
  select_GKP: number;
  select_DEF: number;
  select_MID: number;
  select_FWD: number;
  size: number;
  play: number;
}

export interface DraftHistoryEntry {
  event: number;
  opponent_team: number;
  total_points: number;
  minutes: number;
}

export interface DraftElementSummary {
  fixtures: DraftFixture[];
  /** Current season only — the Draft API serves no `history_past`. */
  history: DraftHistoryEntry[];
}

export class DraftApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "DraftApiError";
  }
}

export interface DraftApi {
  bootstrap(): Promise<DraftBootstrap>;
  leagueDetails(leagueId: number): Promise<DraftLeagueDetails>;
  elementStatus(leagueId: number): Promise<DraftElementStatusRow[]>;
  transactions(leagueId: number): Promise<DraftTransaction[]>;
  entryPicks(entryId: number, event: number): Promise<DraftEntryPicks | null>;
  eventLive(event: number): Promise<DraftLiveEvent>;
  elementSummary(elementId: number): Promise<DraftElementSummary>;
}

export function createDraftApi(fetchImpl: FetchLike): DraftApi {
  async function get<T>(path: string, options?: { allow404?: boolean }): Promise<T | null> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetchImpl(`${BASE_URL}${path}`, {
        headers: { "accept-encoding": "gzip", "user-agent": USER_AGENT },
        signal: controller.signal,
      });
      if (response.status === 404 && options?.allow404 === true) return null;
      if (!response.ok) {
        throw new DraftApiError(
          `FPL Draft API returned ${response.status} for ${path}`,
          response.status,
        );
      }
      return (await response.json()) as T;
    } finally {
      clearTimeout(timer);
    }
  }

  async function require<T>(path: string): Promise<T> {
    const value = await get<T>(path);
    if (value === null) throw new DraftApiError(`Empty response for ${path}`, 500);
    return value;
  }

  return {
    bootstrap: () => require<DraftBootstrap>("/bootstrap-static"),
    leagueDetails: (leagueId) =>
      require<DraftLeagueDetails>(`/league/${leagueId}/details`),
    // Fastly edge-caches this path for 48h even though the origin sends
    // no-store, so a unique query parameter is required for fresh ownership.
    elementStatus: async (leagueId) => {
      const payload = await require<{ element_status: DraftElementStatusRow[] }>(
        `/league/${leagueId}/element-status?_=${Date.now()}`,
      );
      return payload.element_status;
    },
    transactions: async (leagueId) => {
      const payload = await require<{ transactions: DraftTransaction[] }>(
        `/draft/league/${leagueId}/transactions?_=${Date.now()}`,
      );
      return payload.transactions;
    },
    // Picks only exist once an event has started; future events return 404.
    entryPicks: (entryId, event) =>
      get<DraftEntryPicks>(`/entry/${entryId}/event/${event}`, { allow404: true }),
    eventLive: (event) => require<DraftLiveEvent>(`/event/${event}/live`),
    elementSummary: (elementId) =>
      require<DraftElementSummary>(`/element-summary/${elementId}`),
  };
}

export function defaultFetch(): FetchLike {
  return (url, init) => fetch(url, init);
}
