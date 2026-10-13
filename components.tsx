/**
 * The plugin's whole visual vocabulary.
 *
 * Every surface is built from these; a surface may not invent its own row.
 * Quantities are drawn as shape — bars, fills, blocks — before they are
 * written as numbers, and no quantity is ever encoded in colour alone.
 */

import type { ReactNode } from "react";
import { CircleAlert, TriangleAlert } from "lucide-react";

import { fadedKit, kitFor } from "./kits";

/**
 * Shared chart colours. Club identity and status carry the colour;
 * surface depth and typography establish the hierarchy.
 */
export const FTE = {
  blue: "#008fd5",
  red: "#fc4f30",
  yellow: "#e5ae38",
  green: "#6d904f",
  gray: "#8b8b8b",
} as const;

export function cx(...values: (string | false | null | undefined)[]): string {
  return values.filter(Boolean).join(" ");
}

/* --------------------------------- Row ---------------------------------- */

/** The single horizontal unit. Lists own their column template; rows fill it. */
export function Row({
  children,
  columns,
  selected,
  highlighted,
  muted,
  onClick,
  expanded,
  label,
  gap = "gap-2",
}: {
  children: ReactNode;
  columns: string;
  selected?: boolean;
  highlighted?: boolean;
  muted?: boolean;
  onClick?: () => void;
  expanded?: boolean;
  label?: string;
  gap?: string;
}) {
  const shared = cx(
    "grid w-full items-center rounded-lg px-2 py-2.5 text-left",
    gap,
    highlighted && "bg-accent/40",
    selected && "bg-accent/60",
    muted && "opacity-60",
  );
  if (onClick === undefined) {
    return (
      <div className={shared} style={{ gridTemplateColumns: columns }}>
        {children}
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      {...(expanded === undefined ? { "aria-pressed": selected } : { "aria-expanded": expanded })}
      className={cx(
        shared,
        "cursor-pointer hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
      )}
      style={{ gridTemplateColumns: columns }}
    >
      {children}
    </button>
  );
}

/** Column headings for a list. Same template as its rows, so they line up. */
export interface ColumnLabel {
  text: string;
  align?: "start" | "end" | "center";
}

export function ColumnHeader({
  columns,
  labels,
  gap = "gap-2",
}: {
  columns: string;
  labels: (string | ColumnLabel)[];
  gap?: string;
}) {
  return (
    <div
      className={cx(
        "grid items-center border-b border-border/60 px-2 pb-2 text-xs font-medium text-muted-foreground",
        gap,
      )}
      style={{ gridTemplateColumns: columns }}
    >
      {labels.map((label, index) => {
        const value = typeof label === "string" ? { text: label } : label;
        const align = cx(
          value.align === "end" && "text-right",
          value.align === "center" && "text-center",
        );
        return <span key={index} className={cx("min-w-0", align)}>{value.text}</span>;
      })}
    </div>
  );
}

/* ------------------------------- Identity -------------------------------- */

export function Identity({
  name,
  secondary,
  strike,
  align = "start",
}: {
  name: string;
  secondary?: string;
  strike?: boolean;
  align?: "start" | "end";
}) {
  return (
    <span
      className={cx(
        "flex min-w-0 items-baseline gap-1.5",
        align === "end" && "justify-end",
      )}
    >
      <span className={cx("truncate text-sm", strike && "text-muted-foreground line-through")}>
        {name}
      </span>
      {secondary === undefined ? null : (
        <span className="shrink-0 text-[10px] uppercase tracking-wide text-muted-foreground">
          {secondary}
        </span>
      )}
    </span>
  );
}

/* --------------------------------- Flag ---------------------------------- */

const STATUS_LABEL: Record<string, string> = {
  d: "Doubtful",
  i: "Injured",
  s: "Suspended",
  u: "Out of the league",
};

/** True when the API's status means the player cannot be relied on to feature. */
export function isOut(status: string): boolean {
  return status === "i" || status === "s" || status === "u";
}

export function isDoubtful(status: string): boolean {
  return status === "d";
}

/**
 * Availability only. Playing time is a separate signal carried by the card's
 * faded treatment, so a fit player who rarely starts and an injured regular
 * never look alike.
 */
export function Flag({ status, news }: { status: string; news?: string }) {
  if (status === "a") return null;
  const doubtful = isDoubtful(status);
  const Icon = doubtful ? TriangleAlert : CircleAlert;
  const label = STATUS_LABEL[status] ?? status.toUpperCase();
  const detail = news === undefined || news === "" ? label : `${label} — ${news}`;
  return (
    <span
      role="img"
      aria-label={detail}
      className={cx(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-background ring-1 ring-border",
        doubtful ? "text-amber-600 dark:text-amber-400" : "text-rose-600 dark:text-rose-400",
      )}
    >
      <Icon aria-hidden="true" className="size-3.5" strokeWidth={2.25} />
    </span>
  );
}

/* --------------------------------- Stat ---------------------------------- */

/** One number. The list owns its column; Stat owns its formatting. */
export function Stat({
  value,
  max,
  min = 0,
  bar,
  emphasis,
  suffix,
}: {
  value: number | string;
  max?: number;
  /** Bars scale across the observed range; from zero they all look full. */
  min?: number;
  bar?: boolean;
  emphasis?: boolean;
  suffix?: string;
}) {
  const numeric = typeof value === "number" ? value : Number.parseFloat(value);
  const span = max === undefined ? 0 : Math.max(1, max - min);
  const width =
    bar === true && max !== undefined && Number.isFinite(numeric)
      ? Math.max(8, Math.min(100, ((numeric - min) / span) * 100))
      : null;
  return (
    <span className="flex flex-col items-center justify-center gap-1 text-center tabular-nums">
      {width === null ? null : (
        <span className="order-last h-1 w-full overflow-hidden rounded-full bg-muted">
          <span
            className={cx("block h-full rounded-full", emphasis ? "bg-primary" : "bg-muted-foreground/50")}
            style={{ width: `${width}%` }}
          />
        </span>
      )}
      <span className={cx("shrink-0 text-[13px] tabular-nums", emphasis ? "font-semibold text-foreground" : "text-muted-foreground")}>
        {value}
        {suffix}
      </span>
    </span>
  );
}

/** A club's three-letter code on its own colours. Sized to never clip. */
export function Crest({ club, size = 22 }: { club: string; size?: number }) {
  const { ground, label } = kitFor(club);
  return (
    <span
      aria-hidden="true"
      style={{ background: ground, color: label, width: size, height: size }}
      className="inline-flex shrink-0 items-center justify-center rounded-lg px-0.5 text-[9px] font-bold leading-none tracking-tight"
    >
      {club}
    </span>
  );
}

/**
 * A fantasy team's initials. These are not clubs, so they take a deterministic
 * hue of their own rather than borrowing a club's colours.
 */
export function Monogram({ name, size = 20 }: { name: string; size?: number }) {
  const letters =
    name
      .replace(/[^A-Za-z0-9 ]/g, "")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase() || "?";
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash = (hash * 31 + name.charCodeAt(i)) % 360;
  return (
    <span
      aria-hidden="true"
      style={{ background: `hsl(${hash} 26% 42%)`, width: size, height: size }}
      className="inline-flex shrink-0 items-center justify-center rounded-md text-[9px] font-bold leading-none text-white"
    >
      {letters}
    </span>
  );
}

/** Win / draw / loss as blocks. Always accompanied by a key. */
export function FormBlocks({ won, drawn, lost }: { won: number; drawn: number; lost: number }) {
  const blocks = [
    ...Array.from({ length: won }, () => "bg-emerald-600"),
    ...Array.from({ length: drawn }, () => "bg-muted-foreground/40"),
    ...Array.from({ length: lost }, () => "bg-rose-600"),
  ];
  return (
    <span className="flex gap-0.5" aria-label={`${won} won, ${drawn} drawn, ${lost} lost`}>
      {blocks.map((tone, index) => (
        <i key={index} className={cx("size-1.5 rounded-[2px]", tone)} />
      ))}
    </span>
  );
}

/** Compact inline label for a standing fact, e.g. a waiver position. */
export function Pill({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "accent";
}) {
  return (
    <span
      style={tone === "accent" ? { background: FTE.blue } : undefined}
      className={cx(
        "inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs leading-4",
        tone === "accent" ? "text-white" : "bg-muted/60 text-muted-foreground",
      )}
    >
      {children}
    </span>
  );
}

/* ------------------------------- Fixtures -------------------------------- */

export interface OpponentLike {
  opponent: string;
  difficulty: number;
  isHome: boolean;
  averagePoints?: number | null;
  sample?: number;
}

const DIFFICULTY_FILL: Record<number, string> = {
  1: FTE.green,
  2: FTE.green,
  3: FTE.gray,
  4: FTE.yellow,
  5: FTE.red,
};

/**
 * Upcoming fixtures. The numeral is always present, so difficulty survives
 * greyscale and colour-blindness rather than living in the colour alone.
 */
export function Fixtures({
  opponents,
  showOpponent,
}: {
  opponents: OpponentLike[];
  showOpponent?: boolean;
}) {
  if (opponents.length === 0) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }
  return (
    <span className="flex flex-wrap gap-1">
      {opponents.map((entry, index) => {
        const label = `${entry.opponent} ${entry.isHome ? "home" : "away"} · Difficulty ${entry.difficulty}/5 (5 hardest)`;
        const badge = <span
          style={{ background: DIFFICULTY_FILL[entry.difficulty] ?? FTE.gray }}
          className="rounded-md px-1.5 py-0.5 text-[10px] font-semibold leading-[14px] tabular-nums text-white"
        >
          {showOpponent ? `${entry.opponent} ` : ""}{entry.difficulty}
        </span>;
        return <span key={index} role="img" aria-label={label} className="inline-flex min-h-6 items-center">{badge}</span>;
      })}
    </span>
  );
}

/* -------------------------------- Pitch ---------------------------------- */

/** Below this a player is a substitute rather than a starter. */
export const STARTER_MINUTES_PER_GAME = 30;

export interface PitchPlayer {
  elementId: number;
  name: string;
  team: string;
  position: string;
  points: number;
  minutes: number;
  /** Season average. Drives the faded treatment; unrelated to availability. */
  minutesPerGame?: number;
  availability: string;
  news: string;
  opponents: OpponentLike[];
}

export function PlayerCard({
  player,
  compact,
  selected,
  onSelect,
  badge,
}: {
  player: PitchPlayer;
  compact?: boolean;
  selected?: boolean;
  onSelect?: () => void;
  /** A short marker in the card's corner that ties it to a list beside the pitch. */
  badge?: string | number;
}) {
  // Two independent signals: availability (icon) and playing time (faded card).
  const benchWarmer =
    player.minutesPerGame !== undefined &&
    player.minutesPerGame < STARTER_MINUTES_PER_GAME;
  const unavailable = player.availability !== "a";
  // The card is the club's colour; a faded kit marks a substitute.
  const kit = benchWarmer ? fadedKit(player.team) : kitFor(player.team);
  const notes = [
    unavailable ? (STATUS_LABEL[player.availability] ?? player.availability) : null,
    benchWarmer ? `${player.minutesPerGame} minutes a game` : null,
  ].filter(Boolean);
  const bandStyle = { background: kit.ground, color: kit.label };
  const body = (
    <>
      {/* Club colour is confined to the band so it cannot outweigh the score. */}
      <span className="block px-1.5 py-1.5" style={bandStyle}>
        <span
          className={cx(
            "block truncate text-[11px] font-semibold leading-tight",
            // Leave room for the status icon so it never sits on the name.
            unavailable && "pr-3.5",
          )}
        >
          {player.name}
        </span>
        <span className="mt-0.5 block text-[10px] leading-tight opacity-80">
          {player.team}
        </span>
      </span>
      <span
        className={cx(
          "block px-1.5 py-1 text-base font-semibold leading-tight tabular-nums",
          benchWarmer && "text-muted-foreground",
        )}
      >
        {player.points}
      </span>
      {player.opponents.length === 0 ? null : (
        <span className="flex justify-center pb-1">
          <Fixtures opponents={player.opponents} />
        </span>
      )}
    </>
  );
  const className = cx(
    "relative block min-w-0 overflow-hidden rounded-lg border border-border/40 bg-card text-center",
    compact === true ? "w-[76px]" : "w-[84px]",
    // A substitute is carried by the muted kit alone. A dashed edge made the
    // least important players the most eye-catching ones on the pitch.
    benchWarmer && "opacity-80",
    selected === true && "ring-2 ring-foreground ring-offset-1 ring-offset-background",
    onSelect !== undefined &&
      "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
  );
  const flag = unavailable ? (
    <span className="absolute right-0.5 top-1.5 leading-none">
      <Flag status={player.availability} news={player.news} />
    </span>
  ) : null;
  const marker =
    badge === undefined ? null : (
      <span className="absolute bottom-1 left-1">
      <span
        data-badge=""
        aria-label={`Weak spot ${badge}`}
        style={{ background: FTE.red }}
        // Bottom corner: the points row has empty flanks, the name band does not.
        className="flex size-[15px] items-center justify-center rounded-full text-[9px] font-semibold leading-none text-white"
      >
        {badge}
      </span>
      </span>
    );
  if (onSelect === undefined) {
    return (
      <div
        data-player-card=""
        data-fringe={benchWarmer ? "" : undefined}
        aria-description={notes.length === 0 ? undefined : notes.join(" · ")}
        className={className}
      >
        {body}
        {flag}
        {marker}
      </div>
    );
  }
  return (
    <button
      type="button"
      data-player-card=""
      data-fringe={benchWarmer ? "" : undefined}
      onClick={onSelect}
      aria-pressed={selected === true}
      aria-description={notes.length === 0 ? undefined : notes.join(" · ")}
      className={className}
    >
      {body}
      {flag}
      {marker}
    </button>
  );
}

/**
 * A pale ground. Half the league plays in red, so the pitch stays quiet enough
 * to sit behind twenty club colours rather than argue with them.
 */
/** Themed rather than a literal grey, so the pitch follows bb's light/dark. */
const PITCH_CLASS = "border border-border/40 bg-muted/50";

/** A squad in formation. Shape carries the position quota without a label. */
export function Pitch({
  players,
  startingCount,
  order = ["GKP", "DEF", "MID", "FWD"],
  compact,
  selectedId,
  onSelect,
  highlightPosition,
  badges,
  header,
}: {
  players: PitchPlayer[];
  startingCount: number;
  order?: string[];
  compact?: boolean;
  selectedId?: number | null;
  onSelect?: (player: PitchPlayer) => void;
  highlightPosition?: string | null;
  /** Markers by element id, drawn in the corner of the matching card. */
  badges?: ReadonlyMap<number, string | number>;
  header?: ReactNode;
}) {
  const starting = players.slice(0, startingCount);
  const bench = players.slice(startingCount);
  const card = (player: PitchPlayer, isBench: boolean) => (
    <PlayerCard
      key={player.elementId}
      player={player}
      compact={compact === true || isBench}
      selected={selectedId === player.elementId}
      onSelect={onSelect === undefined ? undefined : () => onSelect(player)}
      badge={badges?.get(player.elementId)}
    />
  );
  return (
    <div data-pitch="">
      <div
        className={cx("relative flex flex-col gap-2 overflow-hidden rounded-xl p-2.5", PITCH_CLASS)}
      >
        {header == null ? null : <div className="relative py-2 text-center">{header}</div>}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-0 right-0 top-1/2 border-t border-foreground/10"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 size-14 -translate-x-1/2 -translate-y-1/2 rounded-full border border-foreground/10"
        />
        {order.map((position) => {
          const line = starting.filter((player) => player.position === position);
          if (line.length === 0) return null;
          return (
            <div
              key={position}
              data-pitch-line=""
              className={cx(
                "relative flex justify-center gap-1",
                highlightPosition === position && "bg-background",
              )}
            >
              {line.map((player) => card(player, false))}
            </div>
          );
        })}
      </div>
      {bench.length === 0 ? null : (
        <div className="mt-2 flex justify-center gap-1.5">
          {bench.map((player) => card(player, true))}
        </div>
      )}
    </div>
  );
}
