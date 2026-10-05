import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import * as Tooltip from "@radix-ui/react-tooltip";
import { ArrowRight, ExternalLink, ChevronLeft, ChevronRight, MessageSquarePlus, RefreshCw } from "lucide-react";
import { definePluginApp, useBbNavigate, useComposer, useRpc, useSettings, type PluginComposerMention } from "@get-bb/plugin-sdk/app";

import {
  ColumnHeader,
  FTE,
  Crest,
  Monogram,
  Fixtures,
  Flag,
  Identity,
  Pill,
  Pitch,
  Row,
  Stat,
  cx,
  type PitchPlayer,
} from "./components";
import type {
  CandidatePayload,
  LeaguePayload,
  ManagerPayload,
  MatchupPayload,
  NextWaiverOrderPayload,
  SquadPlayerPayload,
  SwapPayload,
  TableRowPayload,
  WaiverPlanPayload,
  WeakSpotPayload,
  WeekPayload,
  rpcContract,
} from "./server";
import { describeWaiverAssessment, WAIVER_STRENGTH_LABELS } from "./waiver-rules";

const LIVE_REFRESH_MS = 60_000;

type Tab = "matches" | "table" | "waivers";

// Views keep their own action state; the shared header owns its placement.
const ViewActionsTarget = createContext<HTMLDivElement | null>(null);

const err = (error: unknown) => (error instanceof Error ? error.message : String(error));

function LoadError({ title, error, retry, loading }: {
  title: string;
  error: string;
  retry: () => void;
  loading: boolean;
}) {
  return (
    <div role="alert" className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-destructive/30 px-3 py-2 text-xs">
      <div>
        <p className="font-medium">{title}</p>
        <p className="mt-0.5 text-muted-foreground">{error}</p>
      </div>
      <button type="button" onClick={retry} disabled={loading}
        className="rounded-md border border-border px-3 py-1.5 font-medium hover:bg-accent disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        {loading ? "Retrying…" : "Retry"}
      </button>
    </div>
  );
}

function IconButton({
  label,
  onClick,
  spinning,
  disabled,
  tooltip,
  children,
}: {
  label: string;
  onClick: () => void;
  spinning?: boolean;
  disabled?: boolean;
  tooltip?: boolean;
  children: React.ReactNode;
}) {
  const target = useContext(ViewActionsTarget);
  const button = (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      disabled={disabled}
      className="inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className={cx("block [&>svg]:size-4", spinning === true && "animate-spin")}>{children}</span>
    </button>
  );
  if (!tooltip) return button;
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>{button}</Tooltip.Trigger>
      <Tooltip.Portal container={target}>
        <Tooltip.Content side="bottom" sideOffset={6} collisionPadding={8}
          className="z-50 rounded-md bg-foreground px-2 py-1 text-xs text-background shadow-sm">
          {label}
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

function AgentLink({ label, prompt, mention }: { label: string; prompt: string; mention?: PluginComposerMention }) {
  const navigate = useBbNavigate();
  const composer = useComposer();
  return (
    <IconButton label={label} tooltip
      onClick={() => {
        if (mention) {
          composer.updateText((current) => `${current}${current.length ? "\n\n" : ""}${prompt}\n`);
          composer.insertMention(mention);
          navigate.toCompose({ focusPrompt: true });
        } else {
          navigate.toCompose({ initialPrompt: prompt, focusPrompt: true });
        }
      }}
    >
      <MessageSquarePlus aria-hidden="true" className="size-3.5" strokeWidth={1.75} />
    </IconButton>
  );
}

function ViewFrame({ controls, actions, children }: {
  controls?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const target = useContext(ViewActionsTarget);
  return (
    <div className="flex min-h-0 w-full flex-1 flex-col gap-4 overflow-y-auto [scrollbar-gutter:stable]" data-view-frame="">
      {target && actions ? createPortal(actions, target) : null}
      {controls ? <div className="flex min-h-8 shrink-0 flex-wrap items-center gap-1" data-view-toolbar="">{controls}</div> : null}
      <div className="flex min-w-0 shrink-0 flex-col gap-4" data-view-content="">{children}</div>
    </div>
  );
}

/* ------------------------------ league view ------------------------------ */

const MATCH_COLUMNS = "1fr 96px 58px 1fr";

const RESULT_FILL: Record<string, string> = { W: FTE.blue, D: FTE.gray, L: FTE.red };

function FormStrip({ form }: { form: readonly ("W" | "D" | "L")[] }) {
  const last = form.slice(-5);
  if (last.length === 0) return <span className="text-center text-[10px] text-muted-foreground">—</span>;
  return (
    <span
      className="flex justify-center gap-0.5"
      aria-label={last.map((r) => (r === "W" ? "won" : r === "D" ? "drew" : "lost")).join(", ")}
    >
      {last.map((result, index) => (
        <i
          key={index}
          style={{ background: RESULT_FILL[result] }}
          className="inline-flex size-[18px] items-center justify-center rounded text-[10px] font-semibold not-italic text-white"
        >
          {result}
        </i>
      ))}
    </span>
  );
}

function Movement({ delta }: { delta: number }) {
  if (delta === 0) return null;
  return (
    <span
      aria-label={`${Math.abs(delta)} ${delta > 0 ? "up" : "down"}`}
      style={{ color: delta > 0 ? FTE.blue : FTE.red }}
      className="text-[8px] leading-none"
    >
      {delta > 0 ? "\u25B2" : "\u25BC"}
    </span>
  );
}

function TableView({ league, week, loading, error, onRefresh }: {
  league: LeaguePayload;
  week: WeekPayload | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}) {
  const { values: settings } = useSettings();
  const rows = week?.table ?? [];
  const maxFor = Math.max(...rows.map((row) => row.pointsFor), 1);
  const minFor = Math.min(...rows.map((row) => row.pointsFor), 0);
  const nameOf = (id: number) =>
    league.managers.find((manager) => manager.leagueEntryId === id)?.teamName ?? "Unknown";
  const managerOf = (id: number) =>
    league.managers.find((manager) => manager.leagueEntryId === id)?.managerName ?? "";
  return (
    <ViewFrame actions={<>
      {week === null || typeof settings?.leagueId !== "string" ? null : <AgentLink
        label="Ask agent"
        prompt="Review my league position, recent form, and the teams above and below me."
        mention={{ provider: "week", id: JSON.stringify([settings.leagueId, week.event]), label: `FPL Draft · GW ${week.event}` }}
      />}
      <IconButton label="Refresh" tooltip onClick={onRefresh} spinning={loading} disabled={loading}>
        <RefreshCw aria-hidden="true" className="size-3.5" strokeWidth={1.75} />
      </IconButton>
    </>}>
      {error === null ? null : <LoadError title="Couldn’t load the table" error={error} retry={onRefresh} loading={loading} />}
      {week === null && loading ? <p className="text-xs text-muted-foreground">Loading table…</p> : rows.length === 0 ? (
        error === null ? <p className="text-xs text-muted-foreground">No results yet this season.</p> : null
      ) : <>
      {week?.live === true ? (
        <p className="text-[11px] text-muted-foreground">
          Counting this week&apos;s scores as final while they are still moving.
        </p>
      ) : null}
      <div className="w-full max-w-full overflow-x-auto rounded-xl border border-border/60 bg-card p-3 shadow-sm" data-table="">
        <table aria-label="League standings" className="w-full min-w-[44rem] table-fixed border-separate border-spacing-0 whitespace-nowrap text-center">
          <colgroup>
            <col className="w-10" />
            <col className="w-[28%]" />
            <col span={6} />
            <col className="w-[18%]" />
          </colgroup>
          <thead>
            <tr>
              {["#", "Team", "Pts", "Played", "W", "D", "L", "Scored", "Form"].map(label => (
                <th key={label} scope="col" className={cx("border-b border-border/60 px-2 pb-2 text-xs font-medium text-muted-foreground", label === "Team" && "text-left")}>
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr
                key={row.leagueEntryId}
                className={cx(
                  "[&>td]:px-2 [&>td]:py-2.5 [&>td:first-child]:rounded-l-lg [&>td:last-child]:rounded-r-lg",
                  row.leagueEntryId === league.viewerLeagueEntryId && "bg-accent/40",
                )}
              >
                <td>
                  <span className="flex items-center justify-center gap-0.5 text-[11px] tabular-nums text-muted-foreground">
                    {row.rank}
                    <Movement delta={row.rankDelta} />
                  </span>
                </td>
                <td className="text-left">
                  <span className="flex min-w-0 items-center gap-1.5">
                    <Monogram name={nameOf(row.leagueEntryId)} />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">
                        {nameOf(row.leagueEntryId)}
                      </span>
                      <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
                        {managerOf(row.leagueEntryId)}
                      </span>
                    </span>
                  </span>
                </td>
                <td><Stat value={row.leaguePoints} emphasis /></td>
                <td><Stat value={row.played} /></td>
                <td><Stat value={row.won} /></td>
                <td><Stat value={row.drawn} /></td>
                <td><Stat value={row.lost} /></td>
                <td><Stat value={row.pointsFor} max={maxFor} min={minFor} bar /></td>
                <td><FormStrip form={row.form} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </>}
    </ViewFrame>
  );
}

function useSquad(event: number | null, leagueEntryId: number | null, current = false) {
  const rpc = useRpc<typeof rpcContract>();
  const [players, setPlayers] = useState<SquadPlayerPayload[] | null>(null);
  const [note, setNote] = useState<string | null>(null);
  useEffect(() => {
    if (event === null || leagueEntryId === null) return;
    let cancelled = false;
    setPlayers(null);
    setNote(null);
    rpc
      .call("getSquad", { event, leagueEntryId })
      .then((payload) => {
        if (cancelled) return;
        if (payload.available) setPlayers(payload.players);
        else setNote(payload.reason);
      })
      .catch((error: unknown) => {
        if (!cancelled) setNote(err(error));
      });
    return () => {
      cancelled = true;
    };
  }, [current, event, leagueEntryId, rpc]);
  return { players, note };
}

function toPitch(players: SquadPlayerPayload[]): PitchPlayer[] {
  return players.map((player) => ({
    elementId: player.elementId,
    name: player.name,
    team: player.team,
    position: player.position,
    points: player.eventPoints,
    minutes: player.eventMinutes,
    minutesPerGame: player.minutesPerGame,
    availability: player.availability,
    news: player.news,
    opponents: [],
  }));
}

function SquadSide({ event, side }: { event: number | null; side: MatchupPayload["home"] }) {
  const { players, note } = useSquad(event, side.leagueEntryId);
  if (note !== null) return <p className="px-2 py-6 text-center text-xs text-muted-foreground">{note}</p>;
  if (players === null) return <p className="px-2 py-6 text-center text-xs text-muted-foreground">Loading…</p>;
  return (
    <Pitch
      players={toPitch(players)}
      startingCount={players.filter((player) => player.starting).length}
      compact
    />
  );
}

/** One matchup: always shows the score, expands in place to both squads. */
function MatchRow({
  matchup,
  event,
  isViewer,
  open,
  onToggle,
}: {
  matchup: MatchupPayload;
  event: number;
  isViewer: boolean;
  open: boolean;
  onToggle: () => void;
}) {
  const homeLeads = matchup.home.points > matchup.away.points;
  const awayLeads = matchup.away.points > matchup.home.points;
  return (
    <li
      data-match=""
      className={cx("rounded-xl border bg-card shadow-sm", isViewer ? "border-foreground/20" : "border-border/60")}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        data-match-toggle=""
        className="grid w-full cursor-pointer grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      >
        <span className="flex min-w-0 items-center gap-2">
          <span className="min-w-0">
            <span
              className={cx(
                "block truncate text-sm",
                homeLeads ? "font-semibold" : "font-medium",
              )}
            >
              {matchup.home.teamName}
            </span>
            <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
              {matchup.home.managerName}
            </span>
          </span>
        </span>
        <span className="flex items-baseline justify-center gap-2 px-2 py-1 text-xl font-semibold tabular-nums">
          {matchup.started ? (
            <>
              <span className={homeLeads ? "" : "text-muted-foreground"}>
                {matchup.home.points}
              </span>
              <span className="text-xs font-normal text-muted-foreground">–</span>
              <span className={awayLeads ? "" : "text-muted-foreground"}>
                {matchup.away.points}
              </span>
            </>
          ) : (
            <span className="text-xs font-normal text-muted-foreground">v</span>
          )}
        </span>
        <span className="min-w-0 text-right">
          <span
            className={cx(
              "block truncate text-sm",
              awayLeads ? "font-semibold" : "font-medium",
            )}
          >
            {matchup.away.teamName}
          </span>
          <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
            {matchup.away.managerName}
          </span>
        </span>
      </button>
      {open ? (
        <div className="border-t border-border/50 p-3">
          <div className="grid gap-4 xl:grid-cols-2" data-match-squads="">
            {[matchup.home, matchup.away].map(side => <div key={side.leagueEntryId} className="min-w-0">
              <p className="mb-2 text-xs font-medium text-muted-foreground xl:hidden">{side.teamName}</p>
              <SquadSide event={event} side={side} />
            </div>)}
          </div>
        </div>
      ) : null}
    </li>
  );
}

function LeagueView({ league }: { league: LeaguePayload }) {
  const rpc = useRpc<typeof rpcContract>();
  const { values: settings } = useSettings();
  const [event, setEvent] = useState(league.currentEvent ?? league.events[0]?.id ?? 1);
  const [week, setWeek] = useState<WeekPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<ReadonlySet<number>>(new Set());
  const eventIds = useMemo(() => league.events.map((entry) => entry.id), [league.events]);
  const eventIndex = eventIds.indexOf(event);

  const keyOf = (matchup: MatchupPayload) => matchup.home.leagueEntryId;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const next = await rpc.call("getWeek", { event });
      setWeek(next);
      // Your own match starts open; the rest are one click away.
      const mine = next.matchups.find(
        (matchup) =>
          matchup.home.leagueEntryId === league.viewerLeagueEntryId ||
          matchup.away.leagueEntryId === league.viewerLeagueEntryId,
      );
      setOpen(mine === undefined ? new Set() : new Set([mine.home.leagueEntryId]));
      setError(null);
    } catch (nextError) {
      setError(err(nextError));
    } finally {
      setLoading(false);
    }
  }, [event, league.viewerLeagueEntryId, rpc]);

  useEffect(() => {
    void load();
  }, [load]);

  const live = week?.live ?? false;
  useEffect(() => {
    if (!live) return;
    const timer = setInterval(() => void load(), LIVE_REFRESH_MS);
    return () => clearInterval(timer);
  }, [live, load]);

  const matchups = [...(week?.matchups ?? [])].sort(
    (a, b) => Math.max(b.home.points, b.away.points) - Math.max(a.home.points, a.away.points),
  );

  return (
    <ViewFrame controls={<>
        <IconButton
          label="Previous gameweek"
          disabled={eventIndex <= 0}
          onClick={() => {
            const previous = eventIds[eventIndex - 1];
            if (previous !== undefined) setEvent(previous);
          }}
        >
          <ChevronLeft aria-hidden="true" className="size-4" strokeWidth={1.75} />
        </IconButton>
        <span className="px-1 text-[13px] font-semibold tabular-nums" aria-live="polite">
          {league.events.find((entry) => entry.id === event)?.name ?? `Gameweek ${event}`}
        </span>
        <IconButton
          label="Next gameweek"
          disabled={eventIndex < 0 || eventIndex >= eventIds.length - 1}
          onClick={() => {
            const next = eventIds[eventIndex + 1];
            if (next !== undefined) setEvent(next);
          }}
        >
          <ChevronRight aria-hidden="true" className="size-4" strokeWidth={1.75} />
        </IconButton>
        {live ? <span className="ml-1 text-xs text-emerald-600 dark:text-emerald-400">Live</span> : null}
      </>} actions={<>
        {week === null || week.event !== event || typeof settings?.leagueId !== "string" ? null : (
          <AgentLink
            label="Ask agent"
            prompt="What does this week do to the table, and who is over- or under-performing?"
            mention={{ provider: "week", id: JSON.stringify([settings.leagueId, event]), label: `FPL Draft · GW ${event}` }}
          />
        )}
        <IconButton label="Refresh" tooltip onClick={() => void load()} spinning={loading}>
          <RefreshCw aria-hidden="true" className="size-3.5" strokeWidth={1.75} />
        </IconButton>
      </>}>

      {error === null ? null : <p className="text-xs text-destructive">{error}</p>}

      <ul className="flex flex-col gap-2">
        {week === null ? (
          <li className="text-xs text-muted-foreground">Loading…</li>
        ) : matchups.length === 0 ? (
          <li className="text-xs text-muted-foreground">No matches this gameweek.</li>
        ) : (
          matchups.map((matchup) => {
            const key = keyOf(matchup);
            return (
              <MatchRow
                key={key}
                matchup={matchup}
                event={event}
                isViewer={
                  league.viewerLeagueEntryId !== null &&
                  (matchup.home.leagueEntryId === league.viewerLeagueEntryId ||
                    matchup.away.leagueEntryId === league.viewerLeagueEntryId)
                }
                open={open.has(key)}
                onToggle={() =>
                  setOpen((current) => {
                    const next = new Set(current);
                    if (next.has(key)) next.delete(key);
                    else next.add(key);
                    return next;
                  })
                }
              />
            );
          })
        )}
      </ul>
    </ViewFrame>
  );
}

/* ------------------------------ waiver view ------------------------------ */

const POSITION_NOUN: Record<string, string> = {
  GKP: "keeper",
  DEF: "defender",
  MID: "midfielder",
  FWD: "forward",
};

const COMPARE_ROWS: readonly { label: string; decimals?: number; of: (c: CandidatePayload) => number | null | undefined }[] = [
  { label: "Total points", of: c => c.seasonPoints },
  { label: "Points per match", decimals: 1, of: c => c.fplStats?.pointsPerMatch },
  { label: "Form", decimals: 1, of: c => c.fplStats?.form },
  { label: "Minutes played", of: c => c.fplStats?.minutes },
  { label: "Starts", of: c => c.fplStats?.starts },
  { label: "Goals scored", of: c => c.goals },
  { label: "Assists", of: c => c.assists },
  { label: "xG", decimals: 2, of: c => c.fplStats?.expectedGoals },
  { label: "xA", decimals: 2, of: c => c.fplStats?.expectedAssists },
  { label: "Clean sheets", of: c => c.fplStats?.cleanSheets },
  { label: "Defensive contributions", of: c => c.defending },
  { label: "Bonus", of: c => c.bonus },
];

function publishedStat(value: number | null | undefined, decimals = 0): string {
  return value == null ? "—" : value.toFixed(decimals);
}

/** Plain words for why a player is a weak spot. */
function weaknessText(spot: WeakSpotPayload): string {
  const { player, weakness } = spot;
  const news = player.news.trim();
  switch (weakness) {
    case "injured":
      return news.length > 0 ? `Injured · ${news}` : "Injured";
    case "suspended":
      return news.length > 0 ? `Suspended · ${news}` : "Suspended";
    case "unavailable":
      return news.length > 0 ? `Unavailable · ${news}` : "Unavailable";
    case "doubtful":
      return news.length > 0 ? `Doubtful · ${news}` : "Doubtful";
    case "fringe":
      return `Plays ${player.minutesPerGame} of 90 minutes`;
    default:
      return `Lowest-scoring ${POSITION_NOUN[spot.position] ?? spot.position}, and a better one is free`;
  }
}

function publishedWaiverPick(plan: Pick<WaiverPlanPayload, "waiverPick" | "totalManagers">): number | null {
  const pick = plan.waiverPick;
  return pick !== null && Number.isInteger(pick) && pick >= 1 && pick <= plan.totalManagers ? pick : null;
}

/** Estimated need among managers ahead in the last published order. */
function rivalsAhead(swap: SwapPayload, waiverPick: number | null): number {
  if (waiverPick === null) return swap.competition.managersNeeding;
  return swap.competition.needingPicks.filter((pick) => pick < waiverPick).length;
}

const rangeText = (min: number, max: number) => min === max ? String(min) : `${min}–${max}`;

function swapPrompt(plan: WaiverPlanPayload, nextOrder: NextWaiverOrderPayload): string {
  const pick = publishedWaiverPick(plan);
  return [
    nextOrder
      ? `My Fantasy Premier League Draft waiver options. Estimated first-round position for GW ${nextOrder.event}: ${rangeText(nextOrder.min, nextOrder.max)} of ${nextOrder.totalManagers}, based on GW ${nextOrder.throughEvent} ${nextOrder.live ? "starting-XI scores if they hold; substitutions and unplayed fixtures are not predicted" : "completed scores"}. This is not a confirmed queue.`
      : `My Fantasy Premier League Draft waiver options. Last published waiver position: ${pick === null ? "unavailable" : `${pick} of ${plan.totalManagers}`}. The next order is unverified.`,
    "",
    "Weak spots in my squad:",
    ...plan.weakSpots.map(
      (spot, i) => `${i + 1}. ${spot.player.name} (${spot.position} ${spot.player.team}): ${weaknessText(spot)}.`,
    ),
    "",
    "Suggested waivers for my full squad, in priority order (one replacement per position):",
    ...plan.swaps.map(
      (s, i) => {
        const demand = nextOrder?.competition.find(row => row.position === s.position);
        const competition = nextOrder
          ? demand
            ? `${rangeText(demand.minAhead, demand.maxAhead)} managers ahead in the estimated next order need a ${POSITION_NOUN[s.position] ?? s.position}. `
            : "Next-order rival demand is unavailable. "
          : `${rivalsAhead(s, pick)} managers ${pick === null ? "in the league" : "ahead of me in the last published order"} are estimated to need a ${POSITION_NOUN[s.position] ?? s.position}. `;
        return (
          `${i + 1}. IN ${s.in.name} (${s.position} ${s.in.team}, ${s.in.pointsPerGame} pts/game, ${s.in.minutesPerGame} mins/game) ` +
          `OUT ${s.out.name} (${s.out.pointsPerGame} pts/game, ${s.out.minutesPerGame} mins/game). ` +
          (s.assessment ? `Programmatic assessment: ${describeWaiverAssessment(s.assessment)} ` : "") +
          competition +
          `Rival needs are estimated. Fallbacks: ${s.fallbacks.map((f) => f.name).join(", ") || "none"}.`
        );
      },
    ),
    "",
    "Draft has no prices and no captaincy. Which would you file, and in what order?",
  ].join("\n");
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="flex min-h-8 items-center whitespace-nowrap text-sm font-semibold tracking-tight">
      {children}
    </h3>
  );
}

/**
 * The waiver order as a strip of seats, one per manager. A filled seat is a
 * manager who needs this position; your own seat is marked. Everyone filled
 * before your seat had priority in that published order. This is not a
 * prediction of the next queue; historical validation is still incomplete.
 */
function WaiverOrder({
  total,
  needingPicks,
  waiverPick,
}: {
  total: number;
  needingPicks: readonly number[];
  waiverPick: number | null;
}) {
  const seats = Array.from({ length: total }, (_, i) => i + 1);
  const needs = new Set(needingPicks);
  return (
    <span className="inline-flex min-h-6 items-center" role="img" aria-label="Last published order · Red: estimated need · Blue: you · Faded: later">
    <span className="inline-flex gap-px">
      {seats.map((seat) => {
        const mine = seat === waiverPick;
        const later = waiverPick !== null && seat > waiverPick;
        const filled = needs.has(seat);
        return (
          <i
            key={seat}
            style={{
              background: mine ? "transparent" : filled ? FTE.red : undefined,
              borderColor: mine ? FTE.blue : undefined,
              opacity: later && !mine ? 0.35 : 1,
            }}
            className={cx(
              "block h-[10px] w-[7px] rounded-[2px] border",
              mine ? "border-2" : filled ? "border-transparent" : "border-border bg-muted",
            )}
          />
        );
      })}
    </span>
    </span>
  );
}

function CompareGrid({ compared }: { compared: CandidatePayload[] }) {
  const columns = `minmax(100px,120px) repeat(${Math.max(1, compared.length)},minmax(0,1fr))`;
  return (
    <div className="mx-4 mb-4 rounded-xl border border-border/50 bg-muted/30" data-claim-stats="">
      <div
        className="grid items-end gap-x-2 border-b border-border px-2 pb-2 pt-3"
        style={{ gridTemplateColumns: columns }}
      >
        <span />
        {compared.map((candidate, index) => (
          <span key={candidate.elementId} className="flex flex-col items-center gap-1">
            <Crest club={candidate.team} size={26} />
            <span className="flex items-center gap-1">
              <span className="truncate text-[11px] font-semibold">{candidate.name}</span>
              <Flag status={candidate.availability} news={candidate.news} />
            </span>
            <span className="text-[10px] text-muted-foreground">
              {index === 0 ? "yours" : "free"}
            </span>
          </span>
        ))}
      </div>
      {COMPARE_ROWS.map((row) => {
        const values = compared.map((candidate) => row.of(candidate));
        const best = Math.max(...values.filter((value): value is number => value != null));
        const unique = values.filter((value) => value === best).length === 1;
        return (
          <div
            key={row.label}
            className="grid items-center gap-x-2 border-b border-border/60 px-2 py-1.5"
            style={{ gridTemplateColumns: columns }}
          >
            <span className="text-[11px] text-muted-foreground">{row.label}</span>
            {values.map((value, index) => (
              <span
                key={index}
                className={cx(
                  "text-center text-xs tabular-nums",
                  value === best && unique ? "font-bold text-foreground" : "text-muted-foreground",
                )}
              >
                {publishedStat(value, row.decimals)}
              </span>
            ))}
          </div>
        );
      })}
      <div className="grid items-center gap-x-2 px-2 py-1.5" style={{ gridTemplateColumns: columns }}>
        <span className="text-[11px] text-muted-foreground">Next fixtures</span>
        {compared.map((candidate) => (
          <span key={candidate.elementId} className="flex justify-center">
            <Fixtures opponents={candidate.opponents} showOpponent />
          </span>
        ))}
      </div>
    </div>
  );
}

const WEAK_COLUMNS = "16px minmax(0,1fr) 28px 54px 48px";
const WEAK_LABELS = [
  "",
  "Player",
  "Pos",
  { text: "Total pts", align: "end" as const },
  { text: "Minutes", align: "end" as const },
];

function ClaimRow({
  index,
  swap,
  waiverPick,
  totalManagers,
  nextOrder,
  open,
  onToggle,
}: {
  index: number;
  swap: SwapPayload;
  waiverPick: number | null;
  totalManagers: number;
  nextOrder: NextWaiverOrderPayload;
  open: boolean;
  onToggle: () => void;
}) {
  const noun = POSITION_NOUN[swap.position] ?? swap.position;
  const ahead = rivalsAhead(swap, waiverPick);
  const before = waiverPick === null ? totalManagers : waiverPick - 1;
  const demand = nextOrder?.competition.find(row => row.position === swap.position);
  const compared = [swap.out, swap.in, ...swap.fallbacks.slice(0, 2)];
  return (
    <li className="max-w-full" data-claim="">
      <div
        role="button"
        tabIndex={0}
        aria-label={`Claim ${index}, ${noun}: ${swap.out.name} out, ${swap.in.name} in`}
        aria-expanded={open}
        onClick={onToggle}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            if (!event.repeat) onToggle();
          }
        }}
        className={cx("w-full cursor-pointer rounded-xl border bg-card text-left shadow-sm transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", open ? "border-foreground/20" : "border-border/60")}
      >
      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-center justify-between gap-3" data-claim-header="">
          <span className="inline-flex w-12 items-center justify-center rounded-md bg-muted px-2 py-0.5 text-xs font-semibold leading-4" data-claim-position="">
            {swap.position}
          </span>
          <span className="text-xs tabular-nums text-muted-foreground" data-waiver-assessment={swap.assessment?.strength}>
            Priority {index}{swap.assessment ? ` · ${WAIVER_STRENGTH_LABELS[swap.assessment.strength]}` : ""}
          </span>
        </div>
        <div className="flex flex-col gap-2">
          <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_16px_minmax(0,1fr)] items-center gap-x-3" data-claim-transfer="">
            <span className="flex min-w-0 items-center gap-2">
              <Crest club={swap.out.team} size={32} />
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="break-words text-sm leading-tight text-muted-foreground">{swap.out.name}</span>
                <span className="text-[11px] text-muted-foreground">{swap.out.team}</span>
              </span>
            </span>
            <ArrowRight aria-hidden="true" className="size-4 text-muted-foreground" strokeWidth={1.75} />
            <span className="flex min-w-0 items-center gap-2">
              <Crest club={swap.in.team} size={32} />
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="flex min-w-0 items-start gap-1.5">
                  <span className="min-w-0 break-words text-sm font-semibold leading-tight">{swap.in.name}</span>
                  <Flag status={swap.in.availability} news={swap.in.news} />
                </span>
                <span className="text-[11px] text-muted-foreground">{swap.in.team}</span>
              </span>
            </span>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-start gap-4 border-t border-border/50 px-4 py-3" data-claim-summary="">
            <div className="flex min-w-28 flex-1 flex-col gap-1">
              <span className="text-[11px] text-muted-foreground">Points per match</span>
              <span className="min-h-6 text-base font-semibold leading-tight tabular-nums">
                <span className="font-normal text-muted-foreground">{publishedStat(swap.out.fplStats?.pointsPerMatch, 1)}</span>{" "}<span className="text-xs font-normal text-muted-foreground">→</span>{" "}{publishedStat(swap.in.fplStats?.pointsPerMatch, 1)}
              </span>
            </div>
            <div className="flex min-w-28 flex-1 flex-col gap-1">
              <span className="text-[11px] text-muted-foreground">Minutes played</span>
              <span className="min-h-6 text-base font-semibold leading-tight tabular-nums">
                <span className="font-normal text-muted-foreground">{publishedStat(swap.out.fplStats?.minutes)}</span>{" "}<span className="text-xs font-normal text-muted-foreground">→</span>{" "}{publishedStat(swap.in.fplStats?.minutes)}
              </span>
            </div>
            <div className="flex min-w-32 flex-1 flex-col gap-1">
              <span className="text-[11px] text-muted-foreground">Fixtures</span>
              <Fixtures opponents={swap.in.opponents} showOpponent />
            </div>
      </div>
      {open ? <>
          <div className="mx-4 mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border/50 pt-4 text-xs leading-snug text-muted-foreground" data-claim-details="">
            <span className="inline-flex items-center gap-1.5">
              {nextOrder || waiverPick === null ? null : <WaiverOrder
                total={totalManagers}
                needingPicks={swap.competition.needingPicks}
                waiverPick={waiverPick}
              />}
              {nextOrder ? <span>
                {demand ? <>Est. demand: <b className="font-semibold tabular-nums text-foreground">{rangeText(demand.minAhead, demand.maxAhead)}</b> ahead need a {noun}</> : "Rival demand unavailable"}
              </span> : <span>
                Est. demand: <b className="font-semibold tabular-nums text-foreground">{ahead}</b>
                {waiverPick === null ? ` managers need a ${noun}; order unavailable` : ` of ${before} ahead in the last published order need a ${noun}`}
              </span>}
            </span>
            <span>
              <span className="font-medium text-muted-foreground">If taken</span>{" "}
              {swap.fallbacks.length === 0 ? (
                "nobody else worth it"
              ) : (
                swap.fallbacks.map((f, i) => (
                  <span key={f.elementId}>
                    {i > 0 ? ", then " : ""}
                    <span className="font-semibold text-foreground">{f.name}</span>{" "}
                    <span className="text-[11px] text-muted-foreground">{f.team}</span>
                  </span>
                ))
              )}
            </span>
          </div>
          <CompareGrid compared={compared} />
      </> : null}
      </div>
    </li>
  );
}

function WaiverView({ league }: { league: LeaguePayload }) {
  const rpc = useRpc<typeof rpcContract>();
  const [plan, setPlan] = useState<WaiverPlanPayload | null>(null);
  const [nextOrder, setNextOrder] = useState<NextWaiverOrderPayload>(null);
  const [weekScore, setWeekScore] = useState<{ points: number; live: boolean } | null>(null);
  const [squad, setSquad] = useState<SquadPlayerPayload[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [openClaim, setOpenClaim] = useState<string | null>(null);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [next, nextOutlook, scoreWeek] = await Promise.all([
        rpc.call("getWaiverPlan"),
        rpc.call("getNextWaiverOrder").catch(() => null),
        league.currentEvent !== null && league.viewerLeagueEntryId !== null
          ? rpc.call("getWeek", { event: league.currentEvent }).catch(() => null)
          : Promise.resolve(null),
      ]);
      let nextSquad: SquadPlayerPayload[] = [];
      if (next.available && league.viewerLeagueEntryId !== null && league.currentEvent !== null) {
        const mine = await rpc.call("getSquad", {
          event: league.currentEvent,
          leagueEntryId: league.viewerLeagueEntryId,
          current: true,
        });
        nextSquad = mine.available ? mine.players : [];
      }
      setPlan(next);
      setNextOrder(nextOutlook);
      const match = scoreWeek?.matchups.find(match => match.started &&
        (match.home.leagueEntryId === league.viewerLeagueEntryId || match.away.leagueEntryId === league.viewerLeagueEntryId));
      const side = match?.home.leagueEntryId === league.viewerLeagueEntryId ? match.home : match?.away;
      setWeekScore(match && side ? { points: side.points, live: !match.finished } : null);
      setSquad(nextSquad);
      setError(null);
    } catch (nextError) {
      setError(err(nextError));
    } finally {
      setLoading(false);
    }
  }, [league.currentEvent, league.viewerLeagueEntryId, rpc]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!nextOrder?.live && !weekScore?.live) return;
    const timer = setInterval(() => void load(), LIVE_REFRESH_MS);
    return () => clearInterval(timer);
  }, [nextOrder?.live, weekScore?.live, load]);

  const swaps = plan?.swaps ?? [];
  const weakSpots = plan?.weakSpots ?? [];
  const active = swaps.find((swap) => swap.position === openClaim) ?? null;

  const pitchPlayers: PitchPlayer[] = useMemo(
    () =>
      squad.map((player) => ({
        elementId: player.elementId,
        name: player.name,
        team: player.team,
        position: player.position,
        points: player.eventPoints,
        minutes: player.eventMinutes,
        minutesPerGame: player.minutesPerGame,
        availability: player.availability,
        news: player.news,
        opponents: [],
      })),
    [squad],
  );
  const badges = useMemo(
    () => new Map(weakSpots.map((spot, index) => [spot.player.elementId, index + 1])),
    [weakSpots],
  );
  const startingCount = squad.filter((player) => player.starting).length;

  const errorNotice = error === null ? null : (
    <LoadError title={plan === null ? "Couldn’t load waiver suggestions" : "Couldn’t refresh. Showing the previous suggestions."}
      error={error} retry={() => void load()} loading={loading} />
  );
  if (plan === null && errorNotice) return <ViewFrame>{errorNotice}</ViewFrame>;
  if (loading && plan === null) return <ViewFrame><p className="text-xs text-muted-foreground">Loading…</p></ViewFrame>;
  if (plan === null) return null;
  if (!plan.available) return <ViewFrame><p className="text-xs text-muted-foreground">{plan.reason}</p></ViewFrame>;
  const publishedPick = publishedWaiverPick(plan);
  const score = league.currentEvent === null ? null : (
    <span className="text-sm tabular-nums text-muted-foreground" data-waiver-score=""
      aria-label={`Gameweek ${league.currentEvent} team total${weekScore ? `: ${weekScore.points} points${weekScore.live ? ", live" : ""}` : " unavailable"}`}>
      GW {league.currentEvent} · <b className="text-lg font-semibold text-foreground">{weekScore?.points ?? "—"} pts</b>{weekScore?.live ? " · Live" : ""}
    </span>
  );

  return (
    <ViewFrame actions={<>
        <AgentLink label="Ask agent" prompt={swapPrompt(plan, nextOrder)} />
        <IconButton label="Refresh" tooltip onClick={() => void load()} spinning={loading} disabled={loading}>
          <RefreshCw aria-hidden="true" className="size-3.5" strokeWidth={1.75} />
        </IconButton>
      </>}>
      {errorNotice}

      <div className="grid gap-x-6 gap-y-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]" data-waiver-layout="">
        <section aria-labelledby="fpl-claims" className="flex min-w-0 flex-col gap-3 xl:col-start-2 xl:row-start-1">
          <div className="flex min-h-6 flex-wrap items-center gap-2" data-claims-header="">
            <h3 id="fpl-claims" className="whitespace-nowrap text-sm font-semibold tracking-tight">Suggested waivers</h3>
            <span className="inline-flex" data-waiver-status={nextOrder ? "estimated" : publishedPick === null ? "unavailable" : "historical"}>
              <span className="inline-flex" role="img" aria-label={nextOrder ? `GW ${nextOrder.event} · ${nextOrder.live ? "If current starting-XI scores hold" : `Based on GW ${nextOrder.throughEvent} scores`}` : publishedPick === null ? "No published position; next order unverified" : "Historical position; next order unverified"}>
                <Pill>{nextOrder ? `Est. ${rangeText(nextOrder.min, nextOrder.max)} of ${nextOrder.totalManagers} Waiver Position` : publishedPick === null ? "Order unavailable" : `Last published · ${publishedPick} of ${plan.totalManagers}`}</Pill>
              </span>
            </span>
            <a href="https://draft.premierleague.com/" target="_blank" rel="noopener noreferrer"
            className="ml-auto inline-flex min-h-6 shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              Open FPL Draft <ExternalLink aria-hidden="true" className="size-3.5" />
            </a>
          </div>
          {swaps.length === 0 ? (
            <p className="text-xs text-muted-foreground">No clear upgrades found right now.</p>
          ) : (
            <ol className="flex w-full max-w-full list-none flex-col gap-3 p-0">
              {swaps.map((swap, index) => (
                <ClaimRow
                  key={swap.position}
                  index={index + 1}
                  swap={swap}
                  waiverPick={publishedPick}
                  totalManagers={plan.totalManagers}
                  nextOrder={nextOrder}
                  open={openClaim === swap.position}
                  onToggle={() => setOpenClaim((prev) => (prev === swap.position ? null : swap.position))}
                />
              ))}
            </ol>
          )}
        </section>

        <section aria-labelledby="fpl-weak" className="flex min-w-0 flex-col gap-4 xl:col-start-1 xl:row-start-1">
          {pitchPlayers.length === 0 ? (score === null ? null : <div className="py-2 text-center">{score}</div>) : (
            <Pitch
              players={pitchPlayers}
              startingCount={startingCount}
              compact
              header={score}
              selectedId={active?.out.elementId ?? null}
              badges={badges}
            />
          )}
          <div className="flex flex-col gap-2">
            <SectionLabel>
              <span id="fpl-weak">Weakest spots</span>
            </SectionLabel>
            {weakSpots.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No squad problems identified from the available data.
              </p>
            ) : (
              <div>
                <ColumnHeader columns={WEAK_COLUMNS} labels={WEAK_LABELS} gap="gap-1.5" />
                <ol className="list-none p-0" data-weak-spots="">
                  {weakSpots.map((spot, index) => (
                    <li key={spot.player.elementId} data-weak-spot="">
                      <Row columns={WEAK_COLUMNS} gap="gap-1.5" selected={active?.out.elementId === spot.player.elementId}>
                        <span role="img" aria-label={`Weak spot #${index + 1} · Ranked by urgency`}>
                        <span
                          style={{ background: FTE.red }}
                          className="flex size-[14px] items-center justify-center rounded-full text-[9px] font-semibold leading-none text-white"
                        >
                          {index + 1}
                        </span>
                        </span>
                        <span className="flex min-w-0 flex-col gap-0.5">
                          <span className="flex items-center gap-1.5">
                            <span className="truncate text-[13px] font-medium">{spot.player.name}</span>
                            <span className="text-[10px] text-muted-foreground">
                              {spot.player.team}
                            </span>
                            <Flag status={spot.player.availability} news={spot.player.news} />
                          </span>
                        <span className="text-[11px] leading-snug text-muted-foreground">
                            {squad.some(player => player.elementId === spot.player.elementId && !player.starting) ? "Bench · " : ""}
                            {{ injured: "Injured", suspended: "Suspended", unavailable: "Unavailable", doubtful: "Doubtful", fringe: "Limited minutes", lowest: "Low points" }[spot.weakness]}
                          </span>
                        </span>
                        <span className="text-[11px] font-medium text-muted-foreground">
                          {spot.position}
                        </span>
                        <span className="text-right text-xs tabular-nums">
                          {spot.player.seasonPoints}
                        </span>
                        <span className="text-right text-xs tabular-nums">
                          {publishedStat(spot.player.fplStats?.minutes)}
                        </span>
                      </Row>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        </section>
      </div>
    </ViewFrame>
  );
}

/* --------------------------------- root ---------------------------------- */

const TABS: readonly { id: Tab; label: string }[] = [
  { id: "matches", label: "Matches" },
  { id: "table", label: "Table" },
  { id: "waivers", label: "Waivers" },
];

export function FplDraftPanel({ subPath }: { subPath: string }) {
  const rpc = useRpc<typeof rpcContract>();
  const [league, setLeague] = useState<LeaguePayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>(
    subPath.startsWith("waiver") ? "waivers" : subPath.startsWith("table") ? "table" : "matches",
  );
  const [week, setWeek] = useState<WeekPayload | null>(null);
  const [readyTab, setReadyTab] = useState<Tab | null>(null);
  const leagueRequest = useRef(0);
  const tableRequest = useRef(0);
  const [tableError, setTableError] = useState<string | null>(null);
  const [tableLoading, setTableLoading] = useState(false);
  const [actionsTarget, setActionsTarget] = useState<HTMLDivElement | null>(null);

  const loadLeague = useCallback(async () => {
    const request = ++leagueRequest.current;
    setLoading(true);
    setReadyTab(null);
    setWeek(null);
    tableRequest.current += 1;
    try {
      const next = await rpc.call("getLeague", { refresh: true });
      if (request !== leagueRequest.current) return;
      setLeague(next);
      setError(null);
    } catch (nextError) {
      if (request !== leagueRequest.current) return;
      setError(err(nextError));
    } finally {
      if (request === leagueRequest.current) {
        setReadyTab(tab);
        setLoading(false);
      }
    }
  }, [rpc, tab]);

  const loadTable = useCallback(async () => {
    const event = league?.currentEvent ?? league?.events[0]?.id;
    if (event === undefined) return;
    const request = ++tableRequest.current;
    setTableLoading(true);
    try {
      const next = await rpc.call("getWeek", { event });
      if (request !== tableRequest.current) return;
      setWeek(next);
      setTableError(null);
    } catch (nextError) {
      if (request === tableRequest.current) setTableError(err(nextError));
    } finally {
      if (request === tableRequest.current) setTableLoading(false);
    }
  }, [league, rpc]);

  useEffect(() => {
    setTab(subPath.startsWith("waiver") ? "waivers" : subPath.startsWith("table") ? "table" : "matches");
  }, [subPath]);

  useEffect(() => {
    void loadLeague();
    return () => { leagueRequest.current += 1; };
  }, [loadLeague]);

  useEffect(() => {
    if (readyTab !== "table" || tab !== "table") return;
    void loadTable();
  }, [readyTab, tab, loadTable]);

  return (
    <Tooltip.Provider delayDuration={300}>
    <ViewActionsTarget.Provider value={actionsTarget}>
    <main className="mx-auto flex h-full w-full max-w-6xl flex-col overflow-hidden bg-muted/20 p-4" data-view={tab}>
      {loading && league === null ? (
        <p className="text-xs text-muted-foreground">Loading…</p>
      ) : error !== null && league === null ? (
        <LoadError title="Couldn’t load your league" error={error} retry={() => void loadLeague()} loading={loading} />
      ) : league === null ? null : (
        <>
          <div className="mb-4 flex min-h-9 shrink-0 flex-wrap items-center gap-3" data-view-header="">
            <div className="flex shrink-0 items-center gap-1">
            <div className="inline-flex items-center gap-0.5 rounded-lg border border-border/50 bg-card p-0.5" role="tablist">
              {TABS.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  role="tab"
                  aria-selected={tab === entry.id}
                  onClick={() => setTab(entry.id)}
                  className={cx(
                    "min-h-8 cursor-pointer rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    tab === entry.id
                      ? "bg-foreground text-background shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {entry.label}
                </button>
              ))}
            </div>
            <div ref={setActionsTarget} className="flex min-h-8 w-[68px] shrink-0 items-center gap-1" data-view-actions="" />
            </div>
            <span className="ml-auto min-w-0 flex-1 truncate text-right text-xs text-muted-foreground">
              League: {league.leagueName}
            </span>
          </div>
          {league.viewerWarning === null ? null : (
            <p className="mb-3 text-xs text-muted-foreground">{league.viewerWarning}</p>
          )}
          {error === null ? null : <LoadError title="Couldn’t refresh your league" error={error} retry={() => void loadLeague()} loading={loading} />}
          {readyTab !== tab ? <ViewFrame><p className="text-xs text-muted-foreground">Loading…</p></ViewFrame> : tab === "matches" ? (
            <LeagueView league={league} />
          ) : tab === "table" ? (
            <TableView league={league} week={week} loading={tableLoading} error={tableError} onRefresh={() => void loadTable()} />
          ) : (
            <WaiverView league={league} />
          )}
        </>
      )}
    </main>
    </ViewActionsTarget.Provider>
    </Tooltip.Provider>
  );
}

export default definePluginApp((app) => {
  app.slots.navPanel({
    id: "fpl-draft",
    title: "FPL Draft",
    icon: "./assets/pitch.svg",
    path: "fpl-draft",
    component: FplDraftPanel,
  });
});
