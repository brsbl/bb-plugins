/**
 * The HUD drawn over the world. The window re-renders whenever the world
 * reports, so each piece is memoized and redraws only when its own value moves.
 */
import { memo, useEffect, useState } from "react";

import { turnTier } from "./commentary";
import type { TurnCost } from "./contract";
import { diameterMillimetres, formatTokens } from "./katamari-math";
import type { StageMode } from "./stage";

/** The game's size readout: big numbers with small units, "11cm7mm" or "4m84cm". */
export const SizeText = memo(function SizeText({ radius }: { radius: number }) {
  const total = Math.round(diameterMillimetres(radius));
  const metres = Math.floor(total / 1000);
  const centimetres = Math.floor((total % 1000) / 10);
  const millimetres = total % 10;
  return (
    <span className="ck-size-text">
      {metres > 0 ? (
        <>
          {metres}
          <small>m</small>
          {centimetres}
          <small>cm</small>
        </>
      ) : centimetres === 0 ? (
        <>
          {millimetres}
          <small>mm</small>
        </>
      ) : (
        <>
          {centimetres}
          <small>cm</small>
          {millimetres}
          <small>mm</small>
        </>
      )}
    </span>
  );
});

const PETAL_RINGS = ["#ff3d7f", "#ffe14d", "#2fd35a", "#2f8cff", "#ff8a1d", "#c23bff"];

// The petals never change, so their outlines are traced once rather than every render.
const PETALS = PETAL_RINGS.map((color, ring) => {
  const radius = 46 - ring * 6.5;
  const petals = 18 - ring;
  const points: string[] = [];
  for (let step = 0; step <= petals * 8; step += 1) {
    const angle = (step / (petals * 8)) * Math.PI * 2;
    const wobble = 1 + 0.08 * Math.cos(angle * petals);
    points.push(`${50 + Math.cos(angle) * radius * wobble},${50 + Math.sin(angle) * radius * wobble}`);
  }
  return <polygon key={color} points={points.join(" ")} fill={color} />;
});

/** The rainbow flower gauge in the top-left corner, with the katamari at its heart. */
export const FlowerGauge = memo(function FlowerGauge({ fill }: { fill: number }) {
  const core = 8 + fill * 12;
  return (
    <svg className="ck-flower" viewBox="0 0 100 100" aria-hidden="true">
      {PETALS}
      <circle cx="50" cy="50" r="13" fill="#6b3ac8" />
      <circle cx="50" cy="50" r={core} fill="#f7f5ea" opacity="0.92" />
      <circle cx="50" cy="50" r={core * 0.45} fill="#e8453c" opacity="0.85" />
    </svg>
  );
});

/** The time-limit clock, standing in for how much context is left before compaction. */
export const Clock = memo(function Clock({ percentLeft }: { percentLeft: number }) {
  const urgent = percentLeft <= 15;
  const angle = (1 - percentLeft / 100) * 360;
  return (
    <div className="ck-clock" data-urgent={urgent} aria-label={`${percentLeft}% of context left`}>
      <span className="ck-clock-number">
        {percentLeft}
        <small>%</small>
      </span>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="10" className="ck-clock-face" />
        <line x1="12" y1="12" x2="12" y2="4" className="ck-clock-hand" transform={`rotate(${angle} 12 12)`} />
        {urgent ? <text x="12" y="17" textAnchor="middle" className="ck-clock-bang">!</text> : null}
      </svg>
    </div>
  );
});

/** The Prince standing on the Earth, bottom right, glowing while he rolls. */
export const PrinceOnEarth = memo(function PrinceOnEarth({
  mode,
  compactions,
}: {
  mode: StageMode;
  compactions: number;
}) {
  return (
    <div className="ck-prince-earth" data-mode={mode} aria-hidden="true">
      <svg viewBox="0 0 80 80">
        <defs>
          <radialGradient id="ck-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle className="ck-prince-glow" cx="40" cy="42" r="30" fill="url(#ck-glow)" />
        <circle cx="86" cy="96" r="48" fill="#2f6fd6" />
        <path d="M44 72 q10 -6 20 0 t20 0 M52 82 q10 -6 20 0 t20 0" stroke="#bfe3ff" strokeWidth="2.5" fill="none" />
        <path d="M60 58 q8 -4 12 4 q-6 6 -12 -4z" fill="#3fae4a" />
        <g className="ck-prince-figure">
          <rect x="22" y="22" width="30" height="13" rx="6.5" fill="#7cc242" />
          <rect x="24" y="22" width="4" height="13" fill="#b4dd72" />
          <rect x="46" y="22" width="4" height="13" fill="#b4dd72" />
          <rect x="31" y="23.5" width="12" height="10" fill="#f5d94a" />
          <rect x="32.5" y="25" width="9" height="7" fill="#f2dcc0" />
          <circle cx="35" cy="27.5" r="0.9" fill="#2b2233" />
          <circle cx="39" cy="27.5" r="0.9" fill="#2b2233" />
          <circle cx="37" cy="30.3" r="1" fill="#d8342f" />
          <path d="M37 16 l2 6 h-4z" fill="#f5d94a" />
          <circle cx="37" cy="15" r="1.8" fill="#e0312b" />
          <path d="M30 35 h14 l3 13 h-20z" fill="#7cc242" />
          <rect x="31" y="48" width="2.4" height="9" fill="#7a2a8c" />
          <rect x="40.6" y="48" width="2.4" height="9" fill="#7a2a8c" />
        </g>
      </svg>
      {mode === "resting" ? <span className="ck-prince-mark">z z</span> : null}
      {mode === "waiting" ? <span className="ck-prince-mark">?</span> : null}
      {compactions > 0 ? (
        <span className="ck-stars" title={`Compacted ${compactions} ${compactions === 1 ? "time" : "times"}`}>
          ✦{compactions >= 99 ? "99+" : compactions}
        </span>
      ) : null}
    </div>
  );
});

/**
 * Recent turns as bars, oldest to newest: height is how much context each
 * swallowed, so a heavy prompt stands out next to a light one.
 */
export const TurnStrip = memo(function TurnStrip({
  turns,
  capacity,
}: {
  turns: readonly TurnCost[];
  capacity: number | null;
}) {
  if (turns.length === 0) return null;
  const ordered = [...turns].reverse();
  // The setup turn would dwarf every prompt after it, so it does not set the scale.
  const largest = Math.max(
    1,
    ...ordered.map((turn) => (turn.baseline ? 0 : Math.max(0, turn.contextTokens))),
  );
  return (
    <div className="ck-turns">
      <span className="ck-turn-bars" aria-label="Context each recent turn swallowed">
        {ordered.map((turn) => {
          const grown = Math.max(0, turn.contextTokens);
          return (
            <span
              key={turn.turnId}
              className="ck-turn-bar"
              data-tier={turnTier(turn, capacity)}
              data-running={turn.status === "running"}
              style={{ height: `${Math.min(100, Math.max(12, Math.sqrt(grown / largest) * 100))}%` }}
              title={`${turn.prompt ?? "Turn"}\n${
                turn.contextTokens < 0
                  ? "Compacted"
                  : `Context +${formatTokens(grown)}${turn.baseline ? " (system prompt and tools included)" : ""}`
              }`}
            />
          );
        })}
      </span>
    </div>
  );
});

/** The King's lines type out a letter at a time, the way the game delivers them. */
export const Typewriter = memo(function Typewriter({ text }: { text: string }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    setShown(0);
    const timer = window.setInterval(() => {
      setShown((count) => {
        if (count >= text.length) {
          window.clearInterval(timer);
          return count;
        }
        return count + 1;
      });
    }, 30);
    return () => window.clearInterval(timer);
  }, [text]);
  return <span aria-hidden="true">{text.slice(0, shown)}</span>;
});
