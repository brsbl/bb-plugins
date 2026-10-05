import { defineRpcContract, type BbPluginApi } from "@get-bb/plugin-sdk";
import { z } from "zod";
import { projectNextWaiverOrder } from "./waiver-order.js";
import { WAIVER_SIGNALS, WAIVER_CAUTIONS } from "./waiver-rules.js";

import {
  createDraftApi,
  defaultFetch,
  type DraftApi,
  type DraftBootstrap,
  type DraftElement,
  type DraftLeagueDetails,
  type DraftPick,
  type FetchLike,
} from "./api.js";
import {
  buildCompetition,
  buildFixtureRun,
  buildManagerIndex,
  buildMatchups,
  buildOpponentRecords,
  buildPlayerRows,
  buildProjectedTable,
  buildSquad,
  applyTransactions,
  buildWaiverPlan,
  buildWeakSpots,
  positionOf,
  resolveManager,
  valuePlayer,
  type FixtureRun,
  type ManagerIndex,
  type Position,
  type SwapCandidate,
} from "./core.js";

const BOOTSTRAP_TTL_MS = 5 * 60_000;
const LEAGUE_TTL_MS = 30_000;
const OWNERSHIP_TTL_MS = 60_000;
const LIVE_TTL_MS = 30_000;
const PICKS_TTL_MS = 60_000;
const TRANSACTIONS_TTL_MS = 60_000;
const FIXTURES_TTL_MS = 6 * 60 * 60_000;
const FIXTURE_RUN_LENGTH = 4;

const positionSchema = z.enum(["GKP", "DEF", "MID", "FWD"]);

const managerSchema = z
  .object({
    leagueEntryId: z.number().int(),
    entryId: z.number().int(),
    teamName: z.string(),
    managerName: z.string(),
    shortName: z.string(),
    waiverPick: z.number().int().nullable(),
  })
  .strict();

const matchupSideSchema = z
  .object({
    leagueEntryId: z.number().int(),
    teamName: z.string(),
    managerName: z.string(),
    points: z.number(),
    result: z.enum(["W", "D", "L"]).nullable(),
  })
  .strict();

const matchupSchema = z
  .object({
    event: z.number().int(),
    started: z.boolean(),
    finished: z.boolean(),
    home: matchupSideSchema,
    away: matchupSideSchema,
  })
  .strict();

const tableRowSchema = z
  .object({
    leagueEntryId: z.number().int(),
    rank: z.number().int(),
    won: z.number().int(),
    drawn: z.number().int(),
    lost: z.number().int(),
    played: z.number().int(),
    pointsFor: z.number(),
    pointsAgainst: z.number(),
    leaguePoints: z.number(),
    rankDelta: z.number().int(),
    liveLeaguePoints: z.number(),
    form: z.array(z.enum(["W", "D", "L"])),
    averageFor: z.number(),
  })
  .strict();

const fixtureRunSchema = z
  .object({
    event: z.number().int(),
    opponent: z.string(),
    isHome: z.boolean(),
    difficulty: z.number(),
  })
  .strict();

const squadPlayerSchema = z
  .object({
    elementId: z.number().int(),
    name: z.string(),
    team: z.string(),
    position: positionSchema,
    slot: z.number().int(),
    starting: z.boolean(),
    eventPoints: z.number(),
    eventMinutes: z.number(),
    minutesPerGame: z.number(),
    availability: z.string(),
    news: z.string(),
  })
  .strict();

const playerRowSchema = z
  .object({
    elementId: z.number().int(),
    name: z.string(),
    team: z.string(),
    position: positionSchema,
    ownedBy: z.string().nullable(),
    goals: z.number(),
    assists: z.number(),
    defensiveContribution: z.number(),
    bonus: z.number(),
    starts: z.number(),
    minutes: z.number(),
    chanceOfPlaying: z.number().nullable(),
    totalPoints: z.number(),
    pointsPerGame: z.number(),
    form: z.number(),
    availability: z.string(),
    news: z.string(),
    fixtures: z.array(fixtureRunSchema),
    fixtureDifficulty: z.number().nullable(),
  })
  .strict();

const opponentSchema = z
  .object({
    opponent: z.string(),
    averagePoints: z.number().nullable(),
    sample: z.number().int(),
    difficulty: z.number(),
    isHome: z.boolean(),
    event: z.number().int(),
  })
  .strict();

const candidateSchema = z
  .object({
    elementId: z.number().int(),
    name: z.string(),
    team: z.string(),
    pointsPerGame: z.number(),
    minutesPerGame: z.number(),
    seasonPoints: z.number(),
    goals: z.number(),
    assists: z.number(),
    defending: z.number(),
    bonus: z.number(),
    fplStats: z.object({
      pointsPerMatch: z.number().nullable(),
      form: z.number().nullable().optional(),
      minutes: z.number(),
      starts: z.number(),
      cleanSheets: z.number(),
      expectedGoals: z.number().nullable(),
      expectedAssists: z.number().nullable(),
    }).strict().optional(),
    availability: z.string(),
    news: z.string(),
    opponents: z.array(opponentSchema),
  })
  .strict();

const swapSchema = z
  .object({
    position: positionSchema,
    out: candidateSchema,
    in: candidateSchema,
    fallbacks: z.array(candidateSchema),
    gain: z.number(),
    assessment: z.object({
      strength: z.enum(["upgrade", "depth", "weak"]),
      signals: z.array(z.enum(WAIVER_SIGNALS)),
      cautions: z.array(z.enum(WAIVER_CAUTIONS)),
    }).strict().optional(),
    lineupGain: z.number().optional(),
    lineupOut: z.string().optional(),
    competition: z
      .object({
        position: positionSchema,
        managersNeeding: z.number().int(),
        totalManagers: z.number().int(),
        /** Waiver picks of the managers who need this position, ascending. */
        needingPicks: z.array(z.number().int()),
      })
      .strict(),
  })
  .strict();

const weakSpotSchema = z
  .object({
    position: positionSchema,
    player: candidateSchema,
    weakness: z.enum(["injured", "suspended", "unavailable", "doubtful", "fringe", "lowest"]),
  })
  .strict();

export const rpcContract = defineRpcContract({
  getNextWaiverOrder: {
    input: z.null().optional(),
    output: z.object({
      event: z.number().int(),
      throughEvent: z.number().int(),
      live: z.boolean(),
      min: z.number().int(),
      max: z.number().int(),
      totalManagers: z.number().int(),
      competition: z.array(z.object({
        position: positionSchema,
        minAhead: z.number().int(),
        maxAhead: z.number().int(),
      }).strict()),
    }).strict().nullable(),
  },
  getLeague: {
    input: z.object({ refresh: z.boolean().optional() }).strict().nullable().optional(),
    output: z
      .object({
        leagueName: z.string(),
        scoring: z.string(),
        transactionMode: z.string(),
        currentEvent: z.number().int().nullable(),
        nextEvent: z.number().int().nullable(),
        events: z.array(
          z
            .object({
              id: z.number().int(),
              name: z.string(),
              deadlineTime: z.string(),
              finished: z.boolean(),
              started: z.boolean(),
            })
            .strict(),
        ),
        managers: z.array(managerSchema),
        viewerLeagueEntryId: z.number().int().nullable(),
        viewerWarning: z.string().nullable(),
      })
      .strict(),
  },
  getWeek: {
    input: z.object({ event: z.number().int().positive() }).strict(),
    output: z
      .object({
        event: z.number().int(),
        matchups: z.array(matchupSchema),
        table: z.array(tableRowSchema),
        live: z.boolean(),
        fetchedAt: z.string(),
      })
      .strict(),
  },
  getSquad: {
    input: z
      .object({
        event: z.number().int().positive(),
        leagueEntryId: z.number().int(),
        /** Replay moves made since the event, giving the roster held today. */
        current: z.boolean().optional(),
      })
      .strict(),
    output: z
      .object({
        available: z.boolean(),
        reason: z.string().nullable(),
        players: z.array(squadPlayerSchema),
      })
      .strict(),
  },
  getWaiverPlan: {
    input: z.null().optional(),
    output: z
      .object({
        available: z.boolean(),
        reason: z.string().nullable(),
        waiverPick: z.number().int().nullable(),
        totalManagers: z.number().int(),
        /** Squad problems, worst first. */
        weakSpots: z.array(weakSpotSchema),
        swaps: z.array(swapSchema),
        fetchedAt: z.string(),
      })
      .strict(),
  },
  getPlayers: {
    input: z.null().optional(),
    output: z
      .object({
        players: z.array(playerRowSchema),
        fetchedAt: z.string(),
      })
      .strict(),
  },
});

export type LeaguePayload = z.infer<(typeof rpcContract)["getLeague"]["output"]>;
export type NextWaiverOrderPayload = z.infer<(typeof rpcContract)["getNextWaiverOrder"]["output"]>;
export type WeekPayload = z.infer<(typeof rpcContract)["getWeek"]["output"]>;
export type SquadPayload = z.infer<(typeof rpcContract)["getSquad"]["output"]>;
export type PlayersPayload = z.infer<(typeof rpcContract)["getPlayers"]["output"]>;
export type WaiverPlanPayload = z.infer<(typeof rpcContract)["getWaiverPlan"]["output"]>;
export type SwapPayload = WaiverPlanPayload["swaps"][number];
export type WeakSpotPayload = WaiverPlanPayload["weakSpots"][number];
export type CandidatePayload = SwapPayload["out"];
export type OpponentPayload = CandidatePayload["opponents"][number];
export type PlayerRowPayload = PlayersPayload["players"][number];
export type MatchupPayload = WeekPayload["matchups"][number];
export type TableRowPayload = WeekPayload["table"][number];
export type SquadPlayerPayload = SquadPayload["players"][number];
export type ManagerPayload = LeaguePayload["managers"][number];

/** Single-flight TTL cache: concurrent callers share one in-flight request. */
function createCache() {
  const entries = new Map<string, { at: number; value: unknown }>();
  const inFlight = new Map<string, Promise<unknown>>();
  return {
    async read<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
      const cached = entries.get(key);
      if (cached !== undefined && Date.now() - cached.at < ttlMs) {
        return cached.value as T;
      }
      const pending = inFlight.get(key);
      if (pending !== undefined) return pending as Promise<T>;
      const promise = load()
        .then((value) => {
          if (inFlight.get(key) === promise) entries.set(key, { at: Date.now(), value });
          return value;
        })
        .finally(() => {
          if (inFlight.get(key) === promise) inFlight.delete(key);
        });
      inFlight.set(key, promise);
      return promise;
    },
    clear() {
      entries.clear();
      inFlight.clear();
    },
  };
}

/** Missing published stats stay unknown rather than becoming a fabricated zero. */
function publishedNumber(value: string | null | undefined): number | null {
  if (value == null || value.trim() === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function parseLeagueId(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed.length === 0) return null;
  // Accept a bare id or any league URL, e.g. …/league/4211/standings.
  const fromUrl = /\/league\/(\d+)/.exec(trimmed)?.[1];
  const candidate = fromUrl ?? trimmed;
  return /^\d+$/.test(candidate) ? Number.parseInt(candidate, 10) : null;
}

export function createFplDraftPlugin(fetchImpl: FetchLike) {
  const api: DraftApi = createDraftApi(fetchImpl);

  return function plugin(bb: BbPluginApi): void {
    const cache = createCache();

    const settings = bb.settings.define({
      leagueId: {
        type: "string",
        label: "Draft league",
        description:
          "Your league id, or the league URL from draft.premierleague.com.",
      },
      managerName: {
        type: "string",
        label: "Your team",
        description:
          "Your team name, manager name or initials in the league. Highlights your row.",
      },
    });

    async function requireLeagueId(): Promise<number> {
      const values = await settings.get();
      const leagueId = parseLeagueId(String(values.leagueId ?? ""));
      if (leagueId === null) {
        throw new Error(
          "Set your Draft league id in FPL Draft settings before loading the match centre.",
        );
      }
      return leagueId;
    }

    const bootstrap = () =>
      cache.read<DraftBootstrap>("bootstrap", BOOTSTRAP_TTL_MS, () => api.bootstrap());

    const transactions = (leagueId: number) =>
      cache.read(`transactions:${leagueId}`, TRANSACTIONS_TTL_MS, () =>
        api.transactions(leagueId),
      );

    const leagueDetails = (leagueId: number) =>
      cache.read<DraftLeagueDetails>(`league:${leagueId}`, LEAGUE_TTL_MS, () =>
        api.leagueDetails(leagueId),
      );

    /** Every player's own history, fetched only for a shortlist. */
    async function historyFor(elementId: number) {
      return cache.read(`summary:${elementId}`, FIXTURES_TTL_MS, () =>
        api.elementSummary(elementId),
      );
    }

    /**
     * Fixture difficulty is identical for every player at a club, so one
     * `element-summary` call per team covers the entire player pool.
     */
    async function fixturesByTeam(
      data: DraftBootstrap,
    ): Promise<Map<number, FixtureRun[]>> {
      return cache.read(`fixtures:${data.events.current ?? 0}`, FIXTURES_TTL_MS, async () => {
        const teams = new Map(data.teams.map((team) => [team.id, team]));
        const representative = new Map<number, DraftElement>();
        for (const element of data.elements) {
          if (!representative.has(element.team)) representative.set(element.team, element);
        }
        const runs = new Map<number, FixtureRun[]>();
        await Promise.all(
          [...representative].map(async ([teamId, element]) => {
            try {
              const summary = await api.elementSummary(element.id);
              runs.set(teamId, buildFixtureRun(summary.fixtures, teams, FIXTURE_RUN_LENGTH));
            } catch (error) {
              bb.log.warn(
                `FPL Draft: fixtures unavailable for team ${teamId}: ${String(error)}`,
              );
              runs.set(teamId, []);
            }
          }),
        );
        return runs;
      });
    }

    async function viewer(
      index: ManagerIndex,
    ): Promise<{ leagueEntryId: number | null; warning: string | null }> {
      const values = await settings.get();
      const raw = String(values.managerName ?? "").trim();
      if (raw.length === 0) return { leagueEntryId: null, warning: null };
      const manager = resolveManager(index, raw);
      if (manager !== null) return { leagueEntryId: manager.leagueEntryId, warning: null };
      return {
        leagueEntryId: null,
        warning: `No single team in this league matches "${raw}".`,
      };
    }

    async function refreshStatus(): Promise<void> {
      const values = await settings.get();
      if (parseLeagueId(String(values.leagueId ?? "")) === null) {
        bb.status.needsConfiguration("Add your Draft league id to use FPL Draft.");
      }
    }

    void refreshStatus();
    settings.onChange(() => {
      cache.clear();
      void refreshStatus();
    });

    bb.ui.registerMentionProvider({
      id: "week",
      label: "FPL Draft",
      async search({ query }) {
        const values = await settings.get();
        const leagueId = parseLeagueId(String(values.leagueId ?? ""));
        if (leagueId === null) return [];
        const [data, details] = await Promise.all([bootstrap(), leagueDetails(leagueId)]);
        const words = query.trim().toLowerCase().split(/\s+/);
        const current = data.events.current ?? details.league.start_event;
        return data.events.data
          .filter((event) => event.id >= details.league.start_event && event.id <= details.league.stop_event)
          .filter((event) => words.every((word) =>
            `fpl draft gameweek ${event.id} gw ${event.id} ${details.league.name}`.toLowerCase().includes(word),
          ))
          .sort((a, b) => Math.abs(a.id - current) - Math.abs(b.id - current))
          .slice(0, 10)
          .map((event) => ({
            id: JSON.stringify([String(leagueId), event.id]),
            title: `FPL Draft · GW ${event.id}`,
            subtitle: details.league.name,
          }));
      },
      async resolve(itemId) {
        let reference: [string, number];
        try {
          reference = z.tuple([z.string(), z.number().int().positive()]).parse(JSON.parse(itemId));
        } catch {
          throw new Error("This FPL Draft gameweek mention is invalid.");
        }
        const [rawLeagueId, event] = reference;
        const leagueId = parseLeagueId(rawLeagueId);
        if (leagueId === null || !Number.isSafeInteger(leagueId) || leagueId <= 0) {
          throw new Error("This FPL Draft league mention is invalid.");
        }
        const [data, details] = await Promise.all([bootstrap(), leagueDetails(leagueId)]);
        if (!data.events.data.some((week) => week.id === event) ||
          event < details.league.start_event || event > details.league.stop_event) {
          throw new Error("This gameweek is not available in the referenced FPL Draft league.");
        }
        const index = buildManagerIndex(details.league_entries);
        return {
          context: JSON.stringify({
            source: "FPL Draft",
            league: { id: leagueId, name: details.league.name, scoring: details.league.scoring },
            gameweek: event,
            matchups: buildMatchups(details.matches, index, event),
            tableScope: "Current table, including later gameweeks if present.",
            table: buildProjectedTable({ matches: details.matches, managers: index.managers, rules: data.settings.league }),
            fetchedAt: new Date().toISOString(),
          }, null, 2),
        };
      },
    });

    bb.rpc.register(rpcContract, {
      async getNextWaiverOrder() {
        const leagueId = await requireLeagueId();
        const [data, details] = await Promise.all([bootstrap(), leagueDetails(leagueId)]);
        const index = buildManagerIndex(details.league_entries);
        const { leagueEntryId } = await viewer(index);
        const event = data.events.current;
        if (leagueEntryId === null || event === null) return null;
        const lineups = new Map(await Promise.all(index.managers.map(async manager => {
          const picks = await cache.read(`picks:${manager.entryId}:${event}`, PICKS_TTL_MS, () => api.entryPicks(manager.entryId, event));
          return [manager.entryId, picks?.picks ?? []] as const;
        })));
        const inFlight = details.matches.some(match => match.event === event && match.started && !match.finished);
        const live = inFlight ? await cache.read(`live:${event}`, LIVE_TTL_MS, () => api.eventLive(event)).catch(() => null) : null;
        const projected = projectNextWaiverOrder({ data, details, lineups, live });
        const mine = projected?.order.find(row => row.leagueEntryId === leagueEntryId);
        if (!projected || !mine) return null;
        const log = await transactions(leagueId);
        const squads = new Map([...lineups].filter(([entryId]) => index.byEntry.get(entryId)?.leagueEntryId !== leagueEntryId)
          .map(([entryId, picks]) => [entryId, applyTransactions({ picks, transactions: log, entryId, afterEvent: event })]));
        // Incomplete rival rosters cannot support a demand count.
        const complete = [...squads.values()].every(picks => picks.length === data.settings.squad.size);
        const competitionAt = (bound: "min" | "max") => buildCompetition({
          squads, elements: new Map(data.elements.map(element => [element.id, element])),
          types: data.element_types, gamesPlayed: event,
          waiverPickOf: entryId => projected.order.find(row => row.leagueEntryId === index.byEntry.get(entryId)?.leagueEntryId)?.[bound] ?? null,
        });
        const earliest = competitionAt("min");
        const latest = competitionAt("max");
        return {
          event: projected.event, throughEvent: projected.throughEvent, live: projected.live,
          min: mine.min, max: mine.max, totalManagers: index.managers.length,
          competition: complete ? [...earliest].map(([position, row]) => ({
            position,
            minAhead: latest.get(position)!.needingPicks.filter(pick => pick < mine.min).length,
            maxAhead: row.needingPicks.filter(pick => pick < mine.max).length,
          })) : [],
        };
      },
      async getLeague(input) {
        if (input?.refresh) cache.clear();
        const leagueId = await requireLeagueId();
        const [data, details] = await Promise.all([bootstrap(), leagueDetails(leagueId)]);
        const index = buildManagerIndex(details.league_entries);
        const startedEvents = new Set(
          details.matches.filter((match) => match.started).map((match) => match.event),
        );
        const { leagueEntryId, warning } = await viewer(index);
        return {
          leagueName: details.league.name,
          scoring: details.league.scoring,
          transactionMode: details.league.transaction_mode,
          currentEvent: data.events.current,
          nextEvent: data.events.next,
          events: data.events.data
            .filter(
              (event) =>
                event.id >= details.league.start_event &&
                event.id <= details.league.stop_event,
            )
            .map((event) => ({
              id: event.id,
              name: event.name,
              deadlineTime: event.deadline_time,
              finished: event.finished,
              started: startedEvents.has(event.id),
            })),
          managers: index.managers,
          viewerLeagueEntryId: leagueEntryId,
          viewerWarning: warning,
        };
      },

      async getWeek({ event }) {
        const leagueId = await requireLeagueId();
        const details = await leagueDetails(leagueId);
        const data = await bootstrap();
        const index = buildManagerIndex(details.league_entries);
        const matchups = buildMatchups(details.matches, index, event);
        const table = buildProjectedTable({
          matches: details.matches,
          managers: index.managers,
          rules: data.settings.league,
        });
        return {
          event,
          matchups,
          table,
          live: matchups.some((matchup) => matchup.started && !matchup.finished),
          fetchedAt: new Date().toISOString(),
        };
      },

      async getSquad({ event, leagueEntryId, current }) {
        const leagueId = await requireLeagueId();
        const [data, details] = await Promise.all([bootstrap(), leagueDetails(leagueId)]);
        const index = buildManagerIndex(details.league_entries);
        const manager = index.byLeagueEntry.get(leagueEntryId);
        if (manager === undefined) {
          return { available: false, reason: "Unknown team in this league.", players: [] };
        }
        const picks = await cache.read(
          `picks:${manager.entryId}:${event}`,
          PICKS_TTL_MS,
          () => api.entryPicks(manager.entryId, event),
        );
        if (picks === null) {
          return {
            available: false,
            // Squads are only published once a gameweek has started.
            reason: `Squads for gameweek ${event} are not published yet.`,
            players: [],
          };
        }
        const roster =
          current === true
            ? applyTransactions({
                picks: picks.picks,
                transactions: await transactions(leagueId),
                entryId: manager.entryId,
                afterEvent: event,
              })
            : picks.picks;
        const live = await cache
          .read(`live:${event}`, LIVE_TTL_MS, () => api.eventLive(event))
          .catch(() => null);
        return {
          available: true,
          reason: null,
          players: buildSquad({
            picks: roster,
            elements: new Map(data.elements.map((element) => [element.id, element])),
            teams: new Map(data.teams.map((team) => [team.id, team])),
            types: data.element_types,
            live,
            gamesPlayed: event,
          }),
        };
      },

      async getWaiverPlan() {
        const leagueId = await requireLeagueId();
        const [data, details] = await Promise.all([bootstrap(), leagueDetails(leagueId)]);
        const index = buildManagerIndex(details.league_entries);
        const { leagueEntryId } = await viewer(index);
        const me =
          leagueEntryId === null ? undefined : index.byLeagueEntry.get(leagueEntryId);
        const event = data.events.current;
        if (me === undefined || event === null) {
          return {
            available: false,
            reason:
              me === undefined
                ? "Set which team is yours in FPL Draft settings to get a waiver plan."
                : "The season has not started yet.",
            waiverPick: null,
            totalManagers: index.managers.length,
            weakSpots: [],
            swaps: [],
            fetchedAt: new Date().toISOString(),
          };
        }

        const elements = new Map(data.elements.map((e) => [e.id, e]));
        const teams = new Map(data.teams.map((t) => [t.id, t]));
        const positionFor = (id: number): Position => {
          const element = elements.get(id);
          return element === undefined ? "MID" : positionOf(element, data.element_types);
        };

        // Every squad in the league — needed to know how crowded a position is.
        const squads = new Map<number, DraftPick[]>();
        const fetched = await Promise.all(
          index.managers.map(async (manager) => {
            const picks = await cache.read(
              `picks:${manager.entryId}:${event}`,
              PICKS_TTL_MS,
              () => api.entryPicks(manager.entryId, event),
            );
            return [manager.entryId, picks?.picks ?? []] as const;
          }),
        );
        const log = await transactions(leagueId);
        for (const [entryId, picks] of fetched) {
          if (picks.length === 0) continue;
          // Every squad is brought up to date, so positional need across the
          // league reflects today's rosters rather than last week's lineups.
          squads.set(
            entryId,
            applyTransactions({ picks, transactions: log, entryId, afterEvent: event }),
          );
        }
        const myPicks: { picks: DraftPick[] } = { picks: squads.get(me.entryId) ?? [] };
        if (myPicks.picks.length === 0) {
          return {
            available: false,
            reason: `Your squad for gameweek ${event} is not published yet.`,
            waiverPick: me.waiverPick,
            totalManagers: index.managers.length,
            weakSpots: [],
            swaps: [],
            fetchedAt: new Date().toISOString(),
          };
        }

        const competition = buildCompetition({
          squads,
          elements,
          types: data.element_types,
          gamesPlayed: event,
          waiverPickOf: (entryId) => index.byEntry.get(entryId)?.waiverPick ?? null,
        });

        const ownership = await cache.read(`ownership:${leagueId}`, OWNERSHIP_TTL_MS, () =>
          api.elementStatus(leagueId),
        );
        const free = new Set(
          ownership
            .filter((row) => row.status === "a" && !row.in_accepted_trade)
            .map((row) => row.element),
        );

        // Shortlist first, then fetch per-player history only for those.
        const toCandidate = async (element: DraftElement): Promise<SwapCandidate> => {
          const value = valuePlayer(element, event);
          let opponents: Awaited<ReturnType<typeof buildOpponentRecords>> = [];
          try {
            const summary = await historyFor(element.id);
            opponents = buildOpponentRecords({
              fixtures: summary.fixtures,
              history: summary.history ?? [],
              teams,
              limit: FIXTURE_RUN_LENGTH - 1,
            });
          } catch (error) {
            bb.log.warn(`FPL Draft: no fixtures for ${element.id}: ${String(error)}`);
          }
          return {
            elementId: element.id,
            name: element.web_name,
            team: teams.get(element.team)?.short_name ?? "",
            pointsPerGame: value.pointsPerGame,
            minutesPerGame: value.minutesPerGame,
            seasonPoints: element.total_points,
            goals: element.goals_scored,
            assists: element.assists,
            defending: element.defensive_contribution,
            bonus: element.bonus,
            fplStats: {
              pointsPerMatch: publishedNumber(element.points_per_game),
              form: publishedNumber(element.form),
              minutes: element.minutes,
              starts: element.starts,
              cleanSheets: element.clean_sheets,
              expectedGoals: publishedNumber(element.expected_goals),
              expectedAssists: publishedNumber(element.expected_assists),
            },
            availability: element.status,
            news: element.news,
            opponents,
          };
        };

        const mineRaw = myPicks.picks
          .map((pick) => elements.get(pick.element))
          .filter((e): e is DraftElement => e !== undefined);
        const poolRaw: DraftElement[] = [];
        for (const position of ["GKP", "DEF", "MID", "FWD"] as const) {
          const best = data.elements
            .filter(
              (e) =>
                free.has(e.id) &&
                e.status !== "u" &&
                positionOf(e, data.element_types) === position,
            )
            .map((e) => ({ e, v: valuePlayer(e, event) }))
            .sort(
              (a, b) =>
                b.v.pointsPerGame * (0.35 + 0.65 * Math.min(1, b.v.minutesPerGame / 90)) -
                a.v.pointsPerGame * (0.35 + 0.65 * Math.min(1, a.v.minutesPerGame / 90)),
            )
            .slice(0, 6)
            .map((x) => x.e);
          poolRaw.push(...best);
        }

        const [squadCandidates, poolCandidates] = await Promise.all([
          Promise.all(mineRaw.map(toCandidate)),
          Promise.all(poolRaw.map(toCandidate)),
        ]);

        const squadPositions = new Map(
          squadCandidates.map((c) => [c.elementId, positionFor(c.elementId)]),
        );
        const swaps = buildWaiverPlan({
          squad: squadCandidates,
          squadPositions,
          pool: poolCandidates,
          poolPositions: new Map(poolCandidates.map((c) => [c.elementId, positionFor(c.elementId)])),
          competition,
        });
        const weakSpots = buildWeakSpots({ squad: squadCandidates, squadPositions, swaps,
          startingElementIds: new Set(myPicks.picks.filter(pick => pick.position <= data.settings.squad.play).map(pick => pick.element)),
        });

        return {
          available: true,
          reason: null,
          waiverPick: me.waiverPick,
          totalManagers: index.managers.length,
          weakSpots,
          swaps,
          fetchedAt: new Date().toISOString(),
        };
      },

      async getPlayers() {
        const leagueId = await requireLeagueId();
        const [data, details] = await Promise.all([bootstrap(), leagueDetails(leagueId)]);
        const ownership = await cache.read(
          `ownership:${leagueId}`,
          OWNERSHIP_TTL_MS,
          () => api.elementStatus(leagueId),
        );
        const runs = await fixturesByTeam(data);
        const index = buildManagerIndex(details.league_entries);
        return {
          players: buildPlayerRows({
            elements: data.elements,
            teams: new Map(data.teams.map((team) => [team.id, team])),
            types: data.element_types,
            ownership: new Map(ownership.map((row) => [row.element, row])),
            index,
            fixturesByTeam: runs,
          }),
          fetchedAt: new Date().toISOString(),
        };
      },
    });

    bb.log.info("FPL Draft loaded");
  };
}

export default createFplDraftPlugin(defaultFetch());
