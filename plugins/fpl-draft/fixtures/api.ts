/** Invented API responses only; never send these IDs to the public service. */
import type { FetchLike } from "../api";

export const BOOTSTRAP = {
  elements: [
    {
      id: 1, web_name: "Keeper Amber", team: 1, element_type: 1, status: "a", news: "",
      draft_rank: 59, total_points: 6, event_points: 6, form: "3.0", points_per_game: "6.0",
      minutes: 90, starts: 1, goals_scored: 0, assists: 0, clean_sheets: 1, bonus: 0, bps: 20,
      defensive_contribution: 0, expected_goals: "0.00", expected_assists: "0.00",
      chance_of_playing_next_round: null,
    },
    {
      id: 2, web_name: "Midfielder Indigo", team: 2, element_type: 3, status: "a", news: "",
      draft_rank: 40, total_points: 24, event_points: 12, form: "7.3", points_per_game: "12.0",
      minutes: 180, starts: 2, goals_scored: 3, assists: 1, clean_sheets: 0, bonus: 5, bps: 60,
      defensive_contribution: 4, expected_goals: "1.20", expected_assists: "0.40",
      chance_of_playing_next_round: null,
    },
    {
      id: 3, web_name: "Gone", team: 2, element_type: 3, status: "u", news: "Left the league",
      draft_rank: 600, total_points: 0, event_points: 0, form: "0.0", points_per_game: "0.0",
      minutes: 0, starts: 0, goals_scored: 0, assists: 0, clean_sheets: 0, bonus: 0, bps: 0,
      defensive_contribution: 0, expected_goals: "0.00", expected_assists: "0.00",
      chance_of_playing_next_round: null,
    },
  ],
  element_types: [
    { id: 1, singular_name_short: "GKP" },
    { id: 2, singular_name_short: "DEF" },
    { id: 3, singular_name_short: "MID" },
    { id: 4, singular_name_short: "FWD" },
  ],
  teams: [
    { id: 1, name: "Amber Athletic", short_name: "AMB" },
    { id: 2, name: "Indigo United", short_name: "IND" },
  ],
  events: {
    current: 2,
    next: 3,
    data: [
      { id: 1, name: "Gameweek 1", deadline_time: "2026-08-21T17:30:00Z", waivers_time: null, trades_time: null, finished: true },
      { id: 2, name: "Gameweek 2", deadline_time: "2026-08-28T17:30:00Z", waivers_time: null, trades_time: null, finished: false },
      { id: 3, name: "Gameweek 3", deadline_time: "2026-09-04T17:30:00Z", waivers_time: "2026-09-03T17:30:00Z", trades_time: "2026-09-02T17:30:00Z", finished: false },
    ],
  },
  settings: {
    squad: { select_GKP: 2, select_DEF: 5, select_MID: 5, select_FWD: 3, size: 15, play: 11 },
    league: { h2h_win: 3, h2h_draw: 1, h2h_lose: 0 },
  },
};

export const DETAILS = {
  league: {
    id: 900001, name: "Test League", scoring: "h", transaction_mode: "waivers",
    start_event: 1, stop_event: 38,
  },
  league_entries: [
    { id: 100, entry_id: 900, entry_name: "Alpha", player_first_name: "Ada", player_last_name: "One", short_name: "AO", waiver_pick: 1 },
    { id: 200, entry_id: 800, entry_name: "Beta", player_first_name: "Ben", player_last_name: "Two", short_name: "BT", waiver_pick: 2 },
  ],
  matches: [
    { event: 1, started: true, finished: true, league_entry_1: 100, league_entry_1_points: 60, league_entry_2: 200, league_entry_2_points: 20 },
    { event: 2, started: true, finished: false, league_entry_1: 200, league_entry_1_points: 70, league_entry_2: 100, league_entry_2_points: 10 },
    { event: 3, started: false, finished: false, league_entry_1: 100, league_entry_1_points: 0, league_entry_2: 200, league_entry_2_points: 0 },
  ],
};

export interface FetchLog {
  urls: string[];
}

export function fakeFetch(log: FetchLog, overrides: Record<string, unknown> = {}): FetchLike {
  return async (url) => {
    log.urls.push(url);
    const path = url.replace("https://draft.premierleague.com/api", "");
    const key = Object.keys(overrides).find((candidate) => path.startsWith(candidate));
    if (key !== undefined) {
      const value = overrides[key];
      if (value === null) {
        return { ok: false, status: 404, json: async () => ({}) };
      }
      return { ok: true, status: 200, json: async () => value };
    }
    if (path === "/bootstrap-static") {
      return { ok: true, status: 200, json: async () => BOOTSTRAP };
    }
    if (path.endsWith("/details")) {
      return { ok: true, status: 200, json: async () => DETAILS };
    }
    if (path.includes("/element-status")) {
      return {
        ok: true, status: 200,
        json: async () => ({
          element_status: [
            // owner is the global entry id (900), not the league entry id (100).
            { element: 1, owner: null, status: "a", in_accepted_trade: false },
            { element: 2, owner: 900, status: "o", in_accepted_trade: false },
          ],
        }),
      };
    }
    if (path.includes("/transactions")) {
      return {
        ok: true, status: 200,
        json: async () => ({
          transactions: [
            // Accepted after GW2: this manager already swapped 1 out for 2.
            { event: 3, entry: 900, index: 1, kind: "w", element_in: 2, element_out: 1, result: "a" },
            // Denied, so it must not be replayed.
            { event: 3, entry: 900, index: 2, kind: "w", element_in: 3, element_out: 2, result: "di" },
          ],
        }),
      };
    }
    if (path.startsWith("/element-summary/")) {
      return {
        ok: true, status: 200,
        json: async () => ({
          fixtures: [{ event: 3, difficulty: 2, is_home: true, team_a: 2, team_h: 1 }],
          history: [{ event: 1, opponent_team: 2, total_points: 7, minutes: 90 }],
        }),
      };
    }
    if (path.includes("/event/") && path.startsWith("/entry/")) {
      return {
        ok: true, status: 200,
        json: async () => ({ picks: [{ element: 1, position: 1 }, { element: 2, position: 12 }] }),
      };
    }
    if (path.startsWith("/event/") && path.endsWith("/live")) {
      return {
        ok: true, status: 200,
        json: async () => ({ elements: { "1": { stats: { total_points: 6, minutes: 90 } } } }),
      };
    }
    return { ok: false, status: 404, json: async () => ({}) };
  };
}

