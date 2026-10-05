import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { DraftBootstrap, DraftLeagueDetails, DraftMatch } from "./api";
import { projectNextWaiverOrder } from "./waiver-order";

const evidence = JSON.parse(readFileSync(new URL("./docs/waiver-order-evidence.json", import.meta.url), "utf8")) as {
  matches: DraftMatch[];
  managers: { leagueEntryId: number; entryId: number; publishedPick: number }[];
  firstProcessedRequests: Record<string, { entryId: number; index: number }[]>;
  currentPublishedQueueCheck: { positions: { leagueEntryId: number; pick: number }[] };
};
const now = Date.parse("2026-09-09T12:00:00Z");
const dataFor = (current: number): DraftBootstrap => ({
  events: { current, next: current + 1, data: [{ id: current + 1, name: "Next", deadline_time: "2026-09-12T12:00:00Z", waivers_time: "2026-09-11T12:00:00Z", trades_time: null, finished: false }] },
  settings: { squad: { play: 1, size: 1, select_GKP: 1, select_DEF: 0, select_MID: 0, select_FWD: 0 }, league: { h2h_win: 3, h2h_draw: 1, h2h_lose: 0 } },
  elements: [], teams: [], element_types: [],
});
const details: DraftLeagueDetails = {
  league: { id: 24738, name: "Fixture league", scoring: "h", transaction_mode: "waivers", start_event: 1, stop_event: 38 },
  league_entries: evidence.managers.map(m => ({ id: m.leagueEntryId, entry_id: m.entryId, entry_name: String(m.entryId), player_first_name: "", player_last_name: "", short_name: "", waiver_pick: m.publishedPick })),
  matches: evidence.matches.map(match => ({ ...match, started: true, finished: true })),
};

describe("next waiver order", () => {
  it.each([[1, 28], [2, 36]])("matches the observed first-request order after GW%s", (week, pairs) => {
    const projection = projectNextWaiverOrder({ data: dataFor(week), details, now })!;
    const requests = evidence.firstProcessedRequests[String(week + 1)]!;
    let compared = 0;
    for (let i = 0; i < requests.length; i++) for (let j = i + 1; j < requests.length; j++) {
      const rank = (entryId: number) => projection.order.find(row => row.leagueEntryId === evidence.managers.find(m => m.entryId === entryId)!.leagueEntryId)!;
      const a = rank(requests[i]!.entryId), b = rank(requests[j]!.entryId);
      if (a.min === b.min) continue;
      expect(Math.sign(a.min - b.min)).toBe(Math.sign(requests[i]!.index - requests[j]!.index));
      compared++;
    }
    expect(compared).toBe(pairs);
    console.log(`GW${week}: ${compared}/${pairs} observed pairs`);
  });

  it("matches the published GW4 queue after GW3 without inventing a tiebreak", () => {
    const projection = projectNextWaiverOrder({ data: dataFor(3), details, now })!;
    for (const actual of evidence.currentPublishedQueueCheck.positions) {
      const rank = projection.order.find(row => row.leagueEntryId === actual.leagueEntryId)!;
      expect(actual.pick).toBeGreaterThanOrEqual(rank.min);
      expect(actual.pick).toBeLessThanOrEqual(rank.max);
    }
    expect(projection.order.find(row => row.leagueEntryId === 126586)).toMatchObject({ min: 6, max: 6 });
    expect(projection.order.find(row => row.leagueEntryId === 126591)).toMatchObject({ min: 9, max: 10 });
    console.log("GW3: 12/12 published ranks within estimated ranges; GW4 processing pending");
  });

  it("uses locked starting-XI live points and ignores bench and future scores", () => {
    const subset = { ...details, league_entries: details.league_entries.slice(0, 2), matches: [
      { event: 1, started: true, finished: false, league_entry_1: 126585, league_entry_1_points: 100, league_entry_2: 126586, league_entry_2_points: 0 },
      { event: 2, started: true, finished: true, league_entry_1: 126585, league_entry_1_points: 999, league_entry_2: 126586, league_entry_2_points: 0 },
    ] };
    const projection = projectNextWaiverOrder({ data: dataFor(1), details: subset, now,
      lineups: new Map([[126067, [{ element: 1, position: 1 }, { element: 3, position: 2 }]], [126068, [{ element: 2, position: 1 }]]]),
      live: { elements: { "1": { stats: { total_points: 2, minutes: 90 } }, "2": { stats: { total_points: 8, minutes: 90 } }, "3": { stats: { total_points: 100, minutes: 90 } } } },
    })!;
    expect(projection.live).toBe(true);
    expect(projection.order).toEqual([{ leagueEntryId: 126585, min: 1, max: 1 }, { leagueEntryId: 126586, min: 2, max: 2 }]);
    expect(projectNextWaiverOrder({ data: dataFor(1), details: subset, now })).toBeNull();
  });

  it("withholds estimates for missing results, unsupported rules, and a passed window", () => {
    expect(projectNextWaiverOrder({ data: dataFor(3), details: { ...details, matches: details.matches.slice(1) }, now })).toBeNull();
    expect(projectNextWaiverOrder({ data: dataFor(3), details: { ...details, league: { ...details.league, scoring: "c" } }, now })).toBeNull();
    expect(projectNextWaiverOrder({ data: dataFor(3), details, now: Date.parse("2026-09-12T12:00:00Z") })).toBeNull();
  });
});
