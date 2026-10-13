import type { DraftBootstrap, DraftLeagueDetails, DraftLiveEvent, DraftPick } from "./api.js";
import { buildManagerIndex, buildTable } from "./core.js";

/** An as-it-stands first-round queue, not a forecast of unplayed fixtures. */
export function projectNextWaiverOrder({ data, details, lineups, live, now = Date.now() }: {
  data: DraftBootstrap;
  details: DraftLeagueDetails;
  lineups?: Map<number, DraftPick[]>;
  live?: DraftLiveEvent | null;
  now?: number;
}) {
  const current = data.events.current;
  const next = data.events.data.find(event =>
    event.id >= details.league.start_event && event.id <= details.league.stop_event &&
    event.waivers_time !== null && Date.parse(event.waivers_time) > now,
  );
  // No evidence for Classic leagues, preseason, or weeks with no scores yet.
  if (details.league.scoring !== "h" || details.league.transaction_mode !== "waivers" ||
      current === null || next?.id !== current + 1) return null;
  const managers = buildManagerIndex(details.league_entries).managers;
  const matches = details.matches.filter(match => match.event >= details.league.start_event && match.event <= current);
  if (managers.length < 2 || matches.length === 0) return null;
  for (let event = details.league.start_event; event <= current; event++) {
    const week = matches.filter(match => match.event === event);
    if (week.some(match => !match.started || (event < current && !match.finished))) return null;
    for (const manager of managers) {
      if (week.filter(match => match.league_entry_1 === manager.leagueEntryId || match.league_entry_2 === manager.leagueEntryId).length !== 1) return null;
    }
  }
  const inFlight = matches.some(match => !match.finished);
  const scores = new Map<number, number>();
  if (inFlight) {
    // Use the locked lineup, never today's roster after transfers. Final match
    // totals already include substitutions; live estimates do not predict them.
    for (const manager of managers) {
      const starters = lineups?.get(manager.entryId)?.filter(pick => pick.position <= data.settings.squad.play);
      if (!starters || starters.length !== data.settings.squad.play || new Set(starters.map(p => p.element)).size !== starters.length) return null;
      const points = starters.map(pick => live?.elements[String(pick.element)]?.stats.total_points);
      if (points.some(point => point === undefined || !Number.isFinite(point))) return null;
      scores.set(manager.leagueEntryId, points.reduce<number>((sum, point) => sum + point!, 0));
    }
  }
  const counted = matches.map(match => !match.finished ? {
    ...match,
    league_entry_1_points: scores.get(match.league_entry_1)!,
    league_entry_2_points: scores.get(match.league_entry_2)!,
  } : match);
  if (counted.some(match => !Number.isFinite(match.league_entry_1_points) || !Number.isFinite(match.league_entry_2_points))) return null;
  // Waiver tiebreaking is fantasy points, not the table's score differential.
  const rows = buildTable({ matches: counted, managers, rules: data.settings.league, includeUnfinished: true })
    .sort((a, b) => a.leaguePoints - b.leaguePoints || a.pointsFor - b.pointsFor);
  const order = rows.map(row => {
    const tied = rows.filter(other => other.leaguePoints === row.leaguePoints && other.pointsFor === row.pointsFor);
    const min = rows.indexOf(tied[0]!) + 1;
    return { leagueEntryId: row.leagueEntryId, min, max: min + tied.length - 1 };
  });
  return { event: next.id, throughEvent: current, live: inFlight, order };
}
