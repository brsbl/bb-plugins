import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type FocusEvent as ReactFocusEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";

import "./pinball.css";
import { ProgramMenuBar } from "../apps/xp-chrome";
import {
  BALLS_PER_GAME,
  MAX_MULTIPLIER,
  TABLE,
  awaitingLaunch,
  flipperPose,
  newGame,
  plungerFloor,
  step,
  type Nudge,
  type PinballInput,
  type PinballState,
  type PinballStatus,
} from "./pinball-core";

const HIGH_SCORE_KEY = "bb-desktop:pinball:high-score";
const MAX_FRAME_SECONDS = 0.05;

type Control = "left" | "right" | "plunger";

const DEFAULT_CONTROLS = {
  left: "KeyZ", right: "Slash", nudgeLeft: "KeyX", nudgeRight: "Period", nudgeUp: "ArrowUp", plunger: "Space",
} as const;
type Controls = Record<keyof typeof DEFAULT_CONTROLS, string>;
const CONTROL_KEY = "bb-desktop:pinball:controls:v1";
const KEY_CHOICES = [
  ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((key) => ["Key" + key, key]),
  ..."0123456789".split("").map((key) => ["Digit" + key, key]),
  ["Slash", "/"], ["Period", "."], ["Comma", ","], ["Space", "Space"],
  ["ArrowUp", "Up"], ["ArrowDown", "Down"], ["ArrowLeft", "Left"], ["ArrowRight", "Right"],
  ["ShiftLeft", "Left Shift"], ["ShiftRight", "Right Shift"],
];
function loadControls(): Controls {
  try {
    const stored = JSON.parse(localStorage.getItem(CONTROL_KEY) ?? "null") as Controls | null;
    if (stored && Object.keys(DEFAULT_CONTROLS).every((key) => KEY_CHOICES.some(([code]) => code === stored[key as keyof Controls]))) return stored;
  } catch { /* Keep the working defaults when a saved mapping cannot be read. */ }
  return { ...DEFAULT_CONTROLS };
}
function keyLabel(code: string) { return KEY_CHOICES.find(([key]) => key === code)?.[1] ?? code; }

function PinballDialog({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useLayoutEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    dialog.showModal();
    const place = () => {
      const parent = dialog.closest(".bbd-pinball")?.getBoundingClientRect();
      if (!parent) return;
      dialog.style.left = `${Math.max(8, Math.min(parent.left, innerWidth - dialog.offsetWidth - 8))}px`;
      dialog.style.top = `${Math.max(8, Math.min(parent.top + 30, innerHeight - dialog.offsetHeight - 8))}px`;
    };
    place(); window.addEventListener("resize", place);
    return () => { window.removeEventListener("resize", place); dialog.close(); };
  }, []);
  return <dialog ref={ref} className="bbd-pinball-dialog" aria-labelledby={titleId} onCancel={(event) => { event.preventDefault(); onClose(); }} onKeyDown={(event) => event.stopPropagation()}>
    <header><strong id={titleId}>{title}</strong><button type="button" aria-label="Close dialog" onClick={onClose}>×</button></header>
    <div className="bbd-pinball-dialog-body">{children}</div>
  </dialog>;
}

function PlayerControls({ controls, onSave, onClose }: { controls: Controls; onSave: (value: Controls) => void; onClose: () => void }) {
  const [draft, setDraft] = useState(controls);
  const labels = [["left", "Left Flipper"], ["right", "Right Flipper"], ["nudgeLeft", "Left Table Bump"], ["nudgeRight", "Right Table Bump"], ["nudgeUp", "Bottom Table Bump"], ["plunger", "Plunger"]] as const;
  const duplicate = new Set(Object.values(draft)).size !== labels.length;
  return <PinballDialog title="3D Pinball: Player Controls" onClose={onClose}>
    <fieldset><legend>Instructions</legend><p>Choose a key for each control, then choose OK.</p><p>To restore the original keys, choose Default, then OK.</p></fieldset>
    <fieldset><legend>Control Options</legend><div className="bbd-pinball-control-grid">
      {labels.map(([key, label]) => <label key={key}><span>{label}</span><select className="bbd-field bbd-sunken" value={draft[key]} onChange={(event) => setDraft({ ...draft, [key]: event.target.value })}>
        {KEY_CHOICES.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
      </select></label>)}
    </div></fieldset>
    {duplicate && <p role="alert">Choose a different key for each control.</p>}
    <footer><button className="bbd-button bbd-bevel" disabled={duplicate} onClick={() => onSave(draft)}>OK</button><button className="bbd-button bbd-bevel" onClick={onClose}>Cancel</button><button className="bbd-button bbd-bevel" onClick={() => setDraft({ ...DEFAULT_CONTROLS })}>Default</button></footer>
  </PinballDialog>;
}

const COLORS = {
  space: "#1b2540",
  spaceDeep: "#181c36",
  nebulaRed: "oklch(0.5 0.19 30 / 0.5)",
  nebulaViolet: "oklch(0.32 0.09 290 / 0.35)",
  nebulaBlue: "oklch(0.5 0.16 250 / 0.35)",
  clear: "oklch(0.2 0.08 280 / 0)",
  star: "oklch(0.96 0.03 240)",
  crack: "#456176",
  crackGlow: "oklch(0.6 0.16 250 / 0.14)",
  woodLight: "#716961",
  woodDark: "#292929",
  woodEdge: "#96958f",
  lane: "#0b0718",
  railShadow: "#1a0706",
  rail: "#923027",
  railShine: "#bfc4bb",
  gateOpen: "oklch(0.84 0.11 212 / 0.35)",
  ramp: "#6a3fb6",
  rampEdge: "#28125e",
  rampStripe: "#c2a6f2",
  bumperShadow: "oklch(0 0 0 / 0.5)",
  bumperSkirt: "#e7e4dc",
  bumperSkirtShade: "#8d8a86",
  bumperRing: "#c3262c",
  bumperCap: "#fdfaf0",
  bumperCore: "#2b54c9",
  bumperLit: "#ffe45c",
  sling: "#551226",
  slingLit: "#9a2238",
  slingEdge: "#e0463c",
  slingBolt: "oklch(0.78 0.14 235)",
  kicker: "#f4f1ea",
  lampOff: "#5c3a12",
  lampOn: "#ffc933",
  target: "#ffcf3f",
  targetStripe: "#c3262c",
  targetDown: "#4b3310",
  holeRim: "#0e1b4c",
  holeInner: "#218da2",
  holeLampOff: "#142776",
  holeLampOn: "#9fe4ff",
  holeCenter: "#17566c",
  holeCenterMid: "#bd481c",
  holeCenterEdge: "#153345",
  starburst: "#663c85",
  starburstLight: "#9d76ba",
  arrowOff: "#5c4a12",
  arrowOn: "#ffe45c",
  flipper: "#f4f4f6",
  flipperShade: "#9ea3ae",
  flipperEdge: "#d0302c",
  plungerRed: "#c3262c",
  plungerWhite: "#f2f2f2",
  spring: "#9aa0ab",
  ballLight: "#ffffff",
  ballMid: "#b9bec8",
  ballDark: "#3c4250",
  shade: "oklch(0.1 0.04 270 / 0.6)",
  overlayText: "oklch(0.95 0.05 215)",
} as const;

function seeded(seed: number) {
  let value = seed;
  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296;
    return value / 4294967296;
  };
}

const STARS = (() => {
  const next = seeded(7);
  return Array.from({ length: 140 }, () => ({
    x: next() * TABLE.width,
    y: next() * TABLE.height,
    size: next() < 0.15 ? 2 : 1,
    alpha: 0.25 + next() * 0.65,
  }));
})();

// The Space Cadet playfield is printed with branching blue "energy" cracks.
const CRACKS = (() => {
  const next = seeded(23);
  const lines: (readonly [number, number])[][] = [];
  const grow = (x: number, y: number, angle: number, steps: number) => {
    const line: [number, number][] = [[x, y]];
    for (let index = 0; index < steps; index += 1) {
      angle += (next() - 0.5) * 1.1;
      x += Math.cos(angle) * (10 + next() * 14);
      y += Math.sin(angle) * (10 + next() * 14);
      line.push([x, y]);
      if (next() < 0.18 && lines.length < 60) grow(x, y, angle + (next() < 0.5 ? 0.9 : -0.9), Math.floor(steps / 2));
    }
    lines.push(line);
  };
  for (let index = 0; index < 45; index += 1) grow(20 + next() * 340, 60 + next() * 560, next() * Math.PI * 2, 7 + Math.floor(next() * 6));
  return lines;
})();

// Hand-authored 5 × 7 lamps, independent of installed/ripped game fonts.
const MATRIX: Record<string, string> = {
  "0":"01110/10001/10011/10101/11001/10001/01110", "1":"00100/01100/00100/00100/00100/00100/01110",
  "2":"01110/10001/00001/00010/00100/01000/11111", "3":"11110/00001/00001/01110/00001/00001/11110",
  "4":"00010/00110/01010/10010/11111/00010/00010", "5":"11111/10000/10000/11110/00001/00001/11110",
  "6":"01110/10000/10000/11110/10001/10001/01110", "7":"11111/00001/00010/00100/01000/01000/01000",
  "8":"01110/10001/10001/01110/10001/10001/01110", "9":"01110/10001/10001/01111/00001/00001/01110",
  A:"01110/10001/10001/11111/10001/10001/10001", B:"11110/10001/10001/11110/10001/10001/11110",
  C:"01111/10000/10000/10000/10000/10000/01111", D:"11110/10001/10001/10001/10001/10001/11110",
  E:"11111/10000/10000/11110/10000/10000/11111", F:"11111/10000/10000/11110/10000/10000/10000",
  G:"01111/10000/10000/10111/10001/10001/01111", H:"10001/10001/10001/11111/10001/10001/10001",
  I:"01110/00100/00100/00100/00100/00100/01110", J:"00001/00001/00001/00001/10001/10001/01110",
  K:"10001/10010/10100/11000/10100/10010/10001", L:"10000/10000/10000/10000/10000/10000/11111",
  M:"10001/11011/10101/10101/10001/10001/10001", N:"10001/11001/10101/10011/10001/10001/10001",
  O:"01110/10001/10001/10001/10001/10001/01110", P:"11110/10001/10001/11110/10000/10000/10000",
  Q:"01110/10001/10001/10001/10101/10010/01101", R:"11110/10001/10001/11110/10100/10010/10001",
  S:"01111/10000/10000/01110/00001/00001/11110", T:"11111/00100/00100/00100/00100/00100/00100",
  U:"10001/10001/10001/10001/10001/10001/01110", V:"10001/10001/10001/10001/10001/01010/00100",
  W:"10001/10001/10001/10101/10101/11011/10001", X:"10001/10001/01010/00100/01010/10001/10001",
  Y:"10001/10001/01010/00100/00100/00100/00100", Z:"11111/00001/00010/00100/01000/10000/11111",
  a:"00000/00000/01110/00001/01111/10001/01111", b:"10000/10000/10110/11001/10001/10001/11110",
  c:"00000/00000/01110/10001/10000/10001/01110", d:"00001/00001/01101/10011/10001/10001/01111",
  e:"00000/00000/01110/10001/11111/10000/01110", f:"00110/01001/01000/11100/01000/01000/01000",
  g:"00000/01111/10001/10001/01111/00001/01110", h:"10000/10000/10110/11001/10001/10001/10001",
  i:"00100/00000/01100/00100/00100/00100/01110", j:"00010/00000/00110/00010/00010/10010/01100",
  k:"10000/10000/10010/10100/11000/10100/10010", l:"01100/00100/00100/00100/00100/00100/01110",
  m:"00000/00000/11010/10101/10101/10101/10101", n:"00000/00000/10110/11001/10001/10001/10001",
  o:"00000/00000/01110/10001/10001/10001/01110", p:"00000/11110/10001/10001/11110/10000/10000",
  q:"00000/01111/10001/10001/01111/00001/00001", r:"00000/00000/10110/11001/10000/10000/10000",
  s:"00000/00000/01111/10000/01110/00001/11110", t:"01000/01000/11100/01000/01000/01001/00110",
  u:"00000/00000/10001/10001/10001/10011/01101", v:"00000/00000/10001/10001/10001/01010/00100",
  w:"00000/00000/10001/10001/10101/10101/01010", x:"00000/00000/10001/01010/00100/01010/10001",
  y:"00000/10001/10001/10001/01111/00001/01110", z:"00000/00000/11111/00010/00100/01000/11111",
  ",":"00000/00000/00000/00000/00100/00100/01000", "-":"00000/00000/00000/11111/00000/00000/00000",
};
// Cache the lamp outlines once. One path per glyph avoids thousands of SVG nodes
// being reconciled whenever a bumper changes the score.
const MATRIX_PATHS = Object.fromEntries(Object.entries(MATRIX).map(([char, rows]) => [char,
  rows.split("/").flatMap((row, y) => [...row].flatMap((bit, x) => bit === "1"
    ? Array.from({ length: 12 }, (_, dot) => {
      const cx = (x + .16 + (dot % 4) / 3 + .145).toFixed(3);
      const cy = (y + .16 + Math.floor(dot / 4) / 3).toFixed(3);
      return `M${cx} ${cy}a.145 .145 0 1 0 -.29 0a.145 .145 0 1 0 .29 0`;
    }) : [])).join(" "),
]));
function DotMatrix({ text }: { text: string | number }) {
  return <span className="bbd-pinball-dots" aria-label={String(text)}>{String(text).split("\n").map((line, index) => <span className="bbd-pinball-dot-line" key={index}>{line.split(" ").map((word, wi) => <svg key={wi} aria-hidden viewBox={`0 0 ${word.length * 6} 8`} style={{ width: `${word.length * 0.68}em` }}>
    {[...word].map((char, ci) => <path key={ci} d={MATRIX_PATHS[char] ?? MATRIX_PATHS[char.toUpperCase()] ?? ""} transform={`translate(${ci * 6} 0)`} fill="currentColor" />)}
  </svg>)}</span>)}</span>;
}

/** Drawn letter outlines: the title recedes across the cabinet like the XP artwork. */
function SpaceCadetLettering() {
  return <svg className="bbd-pinball-lettering" viewBox="0 0 180 86" aria-hidden>
    <g fill="#b29adf" stroke="#49316d" strokeWidth=".7" strokeLinejoin="round">
      <path d="M34 7C18 2 4 10 5 25C5 38 23 42 24 52C26 62 13 66 4 67L2 82C19 81 40 67 38 50C37 35 21 31 19 24C17 16 27 17 33 18Z" />
      <path transform="translate(33 28) skewY(-22) scale(1.28 1.4)" fillRule="evenodd" d="M0 0H7V3Q11-2 17 1Q25 3 24 13Q24 25 15 26Q10 27 7 23V37H0ZM7 9V17Q14 24 17 16Q20 6 13 6Q10 6 7 9Z" />
      <path transform="translate(65 24) skewY(-22) scale(1.07 1.3)" fillRule="evenodd" d="M1 4Q11-3 20 2Q24 4 23 13V25H16V22Q11 28 4 25Q-3 21 1 14Q5 9 16 10Q17 4 10 6L2 9ZM16 15Q6 13 7 19Q10 24 16 19Z" />
      <path transform="translate(92 17) skewY(-22) scale(.96 1.16)" d="M22 2L20 9Q8 3 7 13Q7 23 20 17L21 23Q10 30 3 22Q-3 14 2 5Q9-3 22 2Z" />
      <path transform="translate(116 12) skewY(-22) scale(.84 1.03)" fillRule="evenodd" d="M23 14H7Q7 24 20 18L22 23Q10 29 3 23Q-3 16 2 6Q8-3 18 1Q25 4 23 14ZM7 9H17Q16 2 11 5Q8 5 7 9Z" />
    </g>
    <text x="59" y="17" fill="#8e71cd" stroke="#3a2360" strokeWidth=".5" fontFamily="serif" fontWeight="bold" fontSize="17" textLength="77" lengthAdjust="spacingAndGlyphs">3D Pinball</text>
    <g transform="translate(138 14) scale(.82 1) skewY(-13)" fill="none" stroke="#8e72b8" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 2Q-2-3 0 14Q1 27 8 21M17 10Q8 5 10 17Q10 24 17 18M17 8V22M27 0V20M27 10Q18 5 20 17Q21 25 27 18M32 15L39 13Q39 5 33 9Q28 15 33 21L39 18M44 2V19M41 9L47 7" />
    </g>
  </svg>;
}

interface Hud {
  score: number;
  ballNumber: number;
  status: PinballStatus;
  awaiting: boolean;
  multiplier: number;
}

function hudOf(state: PinballState): Hud {
  return {
    score: state.score,
    ballNumber: state.ballNumber,
    status: state.status,
    awaiting: awaitingLaunch(state),
    multiplier: state.multiplier,
  };
}

function sameHud(a: Hud, b: Hud): boolean {
  return (
    a.score === b.score &&
    a.ballNumber === b.ballNumber &&
    a.status === b.status &&
    a.awaiting === b.awaiting &&
    a.multiplier === b.multiplier
  );
}

function loadHighScore(): number {
  const stored = typeof localStorage === "undefined" ? null : localStorage.getItem(HIGH_SCORE_KEY);
  const value = Number(stored);
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
}

function formatScore(score: number): string {
  return String(score);
}

const HOLE = { x: 202, y: 548 };

// Yellow arrow inserts: [x, y, angle] where angle 0 points up the table.
const ARROWS = [
  [135, 430, 0],
  [130, 450, 0],
  [125, 470, 0],
  [120, 300, -0.35],
  [250, 300, 0.35],
  [318, 250, 0],
  [318, 425, 0],
  [60, 250, -0.2],
] as const;

function polygon(ctx: CanvasRenderingContext2D, points: readonly (readonly [number, number])[]) {
  ctx.beginPath();
  points.forEach(([x, y], index) => (index === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
  ctx.closePath();
  ctx.fill();
}

function disc(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, fill: string | CanvasGradient) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

function drawBackdrop(ctx: CanvasRenderingContext2D) {
  const { width, height } = TABLE;
  const base = ctx.createLinearGradient(0, 0, 0, height);
  base.addColorStop(0, COLORS.space);
  base.addColorStop(1, COLORS.spaceDeep);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, width, height);
  for (const [x, y, radius, color] of [
    [320, 110, 120, COLORS.nebulaRed],
    [70, 330, 190, COLORS.nebulaViolet],
    [250, 560, 200, COLORS.nebulaBlue],
  ] as const) {
    const glow = ctx.createRadialGradient(x, y, 6, x, y, radius);
    glow.addColorStop(0, color);
    glow.addColorStop(1, COLORS.clear);
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);
  }
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const [color, lineWidth] of [
    [COLORS.crackGlow, 2],
    [COLORS.crack, 0.8],
  ] as const) {
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    for (const line of CRACKS) line.forEach(([x, y], index) => (index === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
    ctx.stroke();
  }
  ctx.fillStyle = COLORS.star;
  for (const star of STARS) {
    ctx.globalAlpha = star.alpha;
    ctx.fillRect(star.x, star.y, star.size, star.size);
  }
  ctx.globalAlpha = 1;
  // Two bright printed stars on the right are a strong part of the original composition.
  for (const [x, y, radius] of [[350, 37, 42], [340, 350, 42]] as const) {
    const glow = ctx.createRadialGradient(x, y, 1, x, y, radius);
    glow.addColorStop(0, "#f7ece1");
    glow.addColorStop(.1, "#d2b5a1");
    glow.addColorStop(.27, "#77504d");
    glow.addColorStop(.6, "#392933");
    glow.addColorStop(1, "#1b254000");
    disc(ctx, x, y, radius, glow);
  }
}

function woodFill(ctx: CanvasRenderingContext2D, x0: number, x1: number) {
  const wood = ctx.createLinearGradient(x0, 0, x1, 0);
  wood.addColorStop(0, COLORS.woodDark);
  wood.addColorStop(0.5, COLORS.woodLight);
  wood.addColorStop(1, COLORS.woodDark);
  return wood;
}

function drawFrame(ctx: CanvasRenderingContext2D) {
  const { width, height, arcCenter, arcRadius, shooter } = TABLE;
  const [left, right] = TABLE.flippers;
  ctx.fillStyle = COLORS.spaceDeep;
  ctx.fillRect(0, 0, width, 16);
  ctx.fillStyle = woodFill(ctx, 0, 9);
  ctx.fillRect(0, 0, 9, height);
  ctx.fillStyle = woodFill(ctx, shooter.right, width);
  ctx.fillRect(shooter.right, 0, width - shooter.right, height);
  ctx.fillStyle = COLORS.woodDark;
  ctx.fillRect(0, 0, width, 9);
  ctx.strokeStyle = COLORS.woodEdge;
  ctx.lineWidth = 3;
  ctx.strokeRect(3, 3, width - 6, height - 6);
  // The outer orbit has alternating steel and red cushion sections.
  ctx.beginPath();
  ctx.ellipse(arcCenter.x, arcCenter.y / 2, arcRadius - 6, (arcRadius - 6) / 2, 0, Math.PI, Math.PI * 2);
  ctx.strokeStyle = COLORS.railShadow; ctx.lineWidth = 19; ctx.stroke();
  ctx.strokeStyle = COLORS.bumperSkirtShade; ctx.lineWidth = 12; ctx.stroke();
  ctx.strokeStyle = COLORS.rail; ctx.lineWidth = 4; ctx.stroke();
  ctx.strokeStyle = COLORS.bumperSkirt; ctx.setLineDash([14, 55]); ctx.lineWidth = 14; ctx.stroke(); ctx.setLineDash([]);
  for (let i = 0; i < 6; i++) {
    const a = Math.PI + 0.28 + i * 0.52;
    disc(ctx, arcCenter.x + Math.cos(a) * 179, arcCenter.y / 2 + Math.sin(a) * 89.5, 4, COLORS.lampOn);
  }
  // Red/silver wall running down the outside of the launch lane.
  for (let y = 200; y < 670; y += 86) {
    ctx.fillStyle = COLORS.rail; ctx.fillRect(shooter.left + 2, y, 24, 71);
    ctx.fillStyle = COLORS.bumperSkirtShade; ctx.fillRect(shooter.left + 8, y + 2, 12, 64);
    ctx.fillStyle = COLORS.lampOn; ctx.fillRect(shooter.left + 3, y + 71, 23, 6);
  }
  // Inlane/outlane aprons below the slingshots.
  ctx.fillStyle = COLORS.woodDark;
  polygon(ctx, [
    [0, 630],
    [8, 630],
    [left.pivot.x, left.pivot.y],
    [left.pivot.x - 6, height],
    [0, height],
  ]);
  polygon(ctx, [
    [shooter.left, 630],
    [right.pivot.x, right.pivot.y],
    [right.pivot.x + 6, height],
    [shooter.left, height],
  ]);
  ctx.fillStyle = COLORS.lane;
  ctx.fillRect(shooter.left + 1, 180, 6, height - 180);
  // Launch-lane chevrons.
  const center = (shooter.left + shooter.right) / 2;
  ctx.fillStyle = COLORS.lampOff;
  for (let y = 260; y < 620; y += 60) polygon(ctx, [[center, y], [center + 4, y + 6], [center - 4, y + 6]]);
  ctx.strokeStyle = COLORS.woodEdge;
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, width - 2, height - 2);
}

// Original vector reconstruction of the left launch ramp and return platform.
function drawRamp(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = COLORS.ramp;
  ctx.beginPath();
  ctx.moveTo(18, 310);
  ctx.bezierCurveTo(36, 250, 110, 252, 152, 346);
  ctx.lineTo(119, 365);
  ctx.bezierCurveTo(80, 300, 46, 306, 42, 355);
  ctx.bezierCurveTo(94, 393, 100, 450, 52, 512);
  ctx.lineTo(31, 565);
  ctx.lineTo(16, 555);
  ctx.bezierCurveTo(43, 466, -5, 409, 18, 310);
  ctx.fill();
  ctx.strokeStyle = COLORS.rampStripe;
  ctx.lineWidth = 2;
  ctx.stroke();
  const surface = ctx.createLinearGradient(10, 310, 125, 380);
  surface.addColorStop(0, COLORS.rampStripe);
  surface.addColorStop(0.45, COLORS.ramp);
  surface.addColorStop(1, COLORS.rampEdge);
  ctx.strokeStyle = surface;
  ctx.lineWidth = 31;
  ctx.beginPath();
  ctx.moveTo(27, 356);
  ctx.bezierCurveTo(8, 269, 95, 273, 135, 351);
  ctx.stroke();
  ctx.strokeStyle = COLORS.rampStripe;
  ctx.lineWidth = 26;
  ctx.lineCap = "butt";
  ctx.setLineDash([9, 10]);
  ctx.stroke();
  ctx.setLineDash([]);
  // Printed fuel ladder and launch chevrons beneath the ramp.
  for (let i = 0; i < 6; i++) {
    ctx.save(); ctx.translate(71 + i * 4, 324 + i * 17); ctx.rotate(-0.42);
    ctx.fillStyle = i % 2 ? COLORS.lampOn : COLORS.ramp;
    ctx.fillRect(-11, -5, 22, 10); ctx.restore();
  }
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = COLORS.bumperSkirt;
    ctx.fillRect(18 + i * 19, 360, 5, 25);
    disc(ctx, 20 + i * 19, 356, 4, i === 1 ? COLORS.lampOn : COLORS.plungerRed);
  }
  ctx.fillStyle = "#b46ab7";
  polygon(ctx, [[83, 394], [96, 402], [92, 418], [105, 433], [94, 438], [84, 420], [73, 414]]);
  ctx.strokeStyle = "#dbc0d5"; ctx.lineWidth = 1; ctx.stroke();
}

function drawPrintedArt(ctx: CanvasRenderingContext2D) {
  // Asteroid chain, rocket, and red arrow formation: ink on the playfield.
  const next = seeded(41);
  for (let i = 0; i < 7; i++) {
    const x = 252 + Math.sin(i * 0.8) * 20, y = 237 + i * 17;
    const points: [number, number][] = [];
    for (let j = 0; j < 9; j++) {
      const a = j / 9 * Math.PI * 2, r = 8 + next() * 7;
      points.push([x + Math.cos(a) * r, y + Math.sin(a) * r]);
    }
    ctx.fillStyle = COLORS.bumperSkirtShade; polygon(ctx, points);
    ctx.strokeStyle = COLORS.holeRim; ctx.lineWidth = 2; ctx.stroke();
    for (let j = 0; j < 3; j++) disc(ctx, x + (next() - 0.5) * 13, y + (next() - 0.5) * 13, 2, COLORS.space);
  }
  ctx.fillStyle = COLORS.rail;
  polygon(ctx, [[254, 375], [292, 318], [293, 340], [318, 313], [298, 364], [286, 350], [275, 390]]);
  ctx.strokeStyle = COLORS.crack; ctx.lineWidth = 3; ctx.stroke();
  ctx.fillStyle = COLORS.bumperSkirtShade;
  polygon(ctx, [[132, 265], [118, 240], [143, 229], [161, 249], [139, 251], [148, 282]]);
  ctx.strokeStyle = COLORS.crack; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = COLORS.rail;
  polygon(ctx, [[147, 299], [163, 303], [169, 294], [191, 311], [180, 326], [164, 337], [145, 320]]);
  // Lane inserts and tiny labels remain original, drawn source rather than game assets.
  for (const side of [0, 1]) {
    const x = side ? 324 : 63;
    for (let i = 0; i < 5; i++) disc(ctx, x + (side ? -1 : 1) * Math.sin(i) * 3, 492 + i * 15, 4, COLORS.lampOff);
    ctx.strokeStyle = COLORS.bumperSkirtShade; ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) ctx.strokeRect(x - 15 + i * 12, 530, 5, 26);
  }
}

function drawMechanisms(ctx: CanvasRenderingContext2D) {
  const rail = (points: readonly (readonly [number, number])[], width = 8) => {
    ctx.beginPath(); points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
    ctx.lineJoin = "round"; ctx.lineCap = "round";
    for (const [color, size] of [[COLORS.railShadow, width + 7], [COLORS.rail, width + 3], [COLORS.bumperSkirtShade, width], [COLORS.bumperSkirt, 1]] as const) {
      ctx.strokeStyle = color; ctx.lineWidth = size; ctx.stroke();
    }
  };
  // Inner return track, target banks and switches around the attack bumpers.
  rail([[258, 82], [293, 111], [307, 159], [315, 218], [294, 288]], 11);
  rail([[50, 170], [44, 208], [53, 250], [106, 284]], 5);
  for (let i = 0; i < 5; i++) {
    const x = 317 + Math.sin(i * 0.62) * 28, y = 108 + i * 33;
    ctx.save(); ctx.translate(x, y); ctx.rotate(-0.3 + i * 0.12);
    ctx.fillStyle = COLORS.railShadow; ctx.fillRect(-12, -8, 24, 16);
    ctx.strokeStyle = COLORS.rail; ctx.lineWidth = 3; ctx.strokeRect(-12, -8, 24, 16);
    ctx.strokeStyle = COLORS.crack; ctx.lineWidth = 2; ctx.strokeRect(-9, -6, 18, 12);ctx.restore();
  }
  for (const [x, y, angle] of [[119, 146, -0.35], [195, 322, 0.15]] as const) {
    ctx.save();ctx.translate(x, y);ctx.rotate(angle);
    ctx.fillStyle = COLORS.railShadow;ctx.fillRect(-29, -12, 58, 23);
    ctx.fillStyle = COLORS.bumperSkirt;ctx.fillRect(-28, 5, 56, 5);
    for (let i = 0; i < 3; i++) {ctx.fillStyle = COLORS.target;ctx.fillRect(-26 + i * 19, -5, 12, 13);ctx.fillStyle = COLORS.targetStripe;ctx.fillRect(-24 + i * 19, -5, 7, 4);}
    ctx.restore();
  }
  for (let i = 0; i < 6; i++) {
    disc(ctx, 68 + Math.sin(i * .6) * 7, 209 + i * 12, 4, COLORS.lampOff);
    disc(ctx, 290 + Math.sin(i * .6) * 6, 214 + i * 12, 4, COLORS.lampOff);
    disc(ctx, 91, 427 + i * 14, 4, COLORS.lampOff);
  }
  // Switches and stand-up targets between the upper entry lanes.
  for (let i = 0; i < 4; i++) {
    const x = 132 + i * 31;
    ctx.fillStyle = COLORS.bumperSkirtShade; ctx.fillRect(x, 118, 6, 24);
    ctx.fillStyle = COLORS.bumperSkirt; ctx.fillRect(x + 1, 120, 2, 17);
    ctx.fillStyle = COLORS.holeRim; ctx.fillRect(x - 1, 99, 8, 13);
    disc(ctx, x + 3, 106, 2, COLORS.lampOff);
  }
  for (let i = 0; i < 3; i++) {
    const x = 260 + i * 5, y = 250 + i * 19;
    disc(ctx, x, y, 9, COLORS.crack);
    disc(ctx, x, y, 6, COLORS.holeRim);
    ctx.fillStyle = COLORS.lampOn;
    polygon(ctx, [[296 - i * 12, 330 + i * 24], [291 - i * 12, 342 + i * 24], [302 - i * 12, 339 + i * 24]]);
  }
  // Circular return-lane insert and the striped opening underneath the ramp.
  disc(ctx, 90, 185, 13, COLORS.woodLight);
  disc(ctx, 90, 185, 9, COLORS.lampOff);
  disc(ctx, 90, 185, 5, "#569563");
  ctx.save(); ctx.translate(57, 331); ctx.rotate(-.45);
  ctx.fillStyle = COLORS.lane; ctx.fillRect(-19, -11, 38, 22);
  ctx.strokeStyle = COLORS.rail; ctx.lineWidth = 3; ctx.strokeRect(-19, -11, 38, 22);
  ctx.fillStyle = "#bb3bce"; ctx.fillRect(-14, -7, 22, 5);
  ctx.fillStyle = COLORS.lampOn; ctx.fillRect(-8, 3, 15, 6); ctx.restore();
  // Outlane/inlane metalwork narrows into the proven pivot guide geometry.
  for (const side of [0, 1]) {
    ctx.save(); if (side) {ctx.translate(370, 0);ctx.scale(-1, 1);}
    rail([[27, 565], [25, 648], [79, 675]], 4);
    rail([[43, 578], [45, 626], [93, 660]], 4);
    rail([[50, 654], [91, 680]], 10);
    ctx.fillStyle = COLORS.lampOff; polygon(ctx, [[20, 591], [30, 591], [25, 603]]);
    disc(ctx, 78, 557, 5, COLORS.lampOn);
    disc(ctx, 109, 683, 9, COLORS.holeCenterEdge);
    ctx.restore();
  }
  // Recessed launch lane switch and striped plunger markings.
  rail([[333, 449], [352, 460], [352, 496], [334, 516]], 7);
  ctx.fillStyle = COLORS.bumperSkirt;ctx.fillRect(329, 441, 15, 18);
  for (let i = 0; i < 7; i++) {ctx.fillStyle = i % 2 ? COLORS.rail : COLORS.bumperSkirtShade;ctx.fillRect(373, 680 + i * 5, 11, 3);}
}

function drawRankCircle(ctx: CanvasRenderingContext2D, state: PinballState, time: number) {
  // Printed rank circle and its two rings of inserts, not a physical hole.
  const { x, y } = HOLE;
  const rim = ctx.createRadialGradient(x, y, 20, x, y, 66);
  rim.addColorStop(0, COLORS.holeInner);
  rim.addColorStop(1, COLORS.holeRim);
  disc(ctx, x, y, 66, rim);
  const lit = Math.round(((state.multiplier - 1) / (MAX_MULTIPLIER - 1)) * 22);
  const chase = state.status === "playing" && !state.inLane ? Math.floor(time * 4) % 22 : -1;
  for (let index = 0; index < 22; index += 1) {
    const angle = (index / 22) * Math.PI * 2 - Math.PI / 2;
    const on = index < lit || index === chase;
    disc(ctx, x + Math.cos(angle) * 63, y + Math.sin(angle) * 63, 5, on ? COLORS.holeLampOn : COLORS.holeLampOff);
  }
  for (let index = 0; index < 14; index += 1) {
    const angle = (index / 14) * Math.PI * 2;
    const on = index === 10;
    disc(ctx, x + Math.cos(angle) * 43, y + Math.sin(angle) * 43, 4, on ? COLORS.lampOn : COLORS.holeCenterMid);
  }
  const vortex = ctx.createRadialGradient(x, y, 2, x, y, 30);
  vortex.addColorStop(0, "#286e83");
  vortex.addColorStop(0.7, "#287e92");
  vortex.addColorStop(1, "#274252");
  disc(ctx, x, y, 35, vortex);
  ctx.strokeStyle = "#345a70"; ctx.lineWidth = .7;
  for (let i = 0; i < 17; i++) {
    const a = i * Math.PI * 2 / 17;
    ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * 8, y + Math.sin(a) * 8);
    ctx.lineTo(x + Math.cos(a + .11) * 21, y + Math.sin(a + .11) * 21);
    ctx.lineTo(x + Math.cos(a - .08) * 33, y + Math.sin(a - .08) * 33); ctx.stroke();
  }
  disc(ctx, x, y, 5, COLORS.holeCenterMid);
}

function drawStarburst(ctx: CanvasRenderingContext2D) {
  ctx.save();
  ctx.translate(17, 0);
  const points = [[81, 656], [144, 680], [134, 605], [176, 678], [185, 597], [203, 679], [242, 608], [229, 681], [289, 648], [245, 692], [282, 714], [214, 710], [229, 720], [142, 720], [156, 710], [91, 714], [133, 692]] as const;
  ctx.fillStyle = COLORS.starburstLight; polygon(ctx, points);
  ctx.strokeStyle = COLORS.starburst; ctx.lineWidth = 5; ctx.stroke();
  disc(ctx, 185, 702, 6, COLORS.lampOff);
  disc(ctx, 185, 719, 3, COLORS.bumperSkirt);
  ctx.restore();
}

function drawArrows(ctx: CanvasRenderingContext2D, state: PinballState, time: number) {
  const blink = Math.sin(time * 5) > 0;
  ARROWS.forEach(([x, y, angle], index) => {
    const on = state.multiplier > 1 ? index % 2 === 0 || blink : blink && index % 3 === 0;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = on ? COLORS.arrowOn : COLORS.arrowOff;
    polygon(ctx, [[0, -8], [7, 5], [-7, 5]]);
    ctx.restore();
  });
}

function drawDecals(ctx: CanvasRenderingContext2D, state: PinballState, time: number) {
  drawRankCircle(ctx, state, time);
  drawArrows(ctx, state, time);
  TABLE.lanes.forEach((lane, index) => {
    const lit = state.lanes[index] === true || state.lanesFlash > 0;
    ctx.fillStyle = lit ? COLORS.lampOn : COLORS.lampOff;
    ctx.beginPath();
    ctx.roundRect(lane.x - 5, lane.bottom + 8, 10, 16, 5);
    ctx.fill();
  });
}

function drawRails(ctx: CanvasRenderingContext2D, state: PinballState) {
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  for (const wall of TABLE.walls) {
    ctx.moveTo(wall.a.x, wall.a.y);
    ctx.lineTo(wall.b.x, wall.b.y);
  }
  for (const [color, lineWidth] of [
    [COLORS.railShadow, 7],
    [COLORS.rail, 4],
    [COLORS.railShine, 1],
  ] as const) {
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(TABLE.gate.a.x, TABLE.gate.a.y);
  ctx.lineTo(TABLE.gate.b.x, TABLE.gate.b.y);
  ctx.strokeStyle = state.inLane ? COLORS.gateOpen : COLORS.rail;
  ctx.lineWidth = 3;
  ctx.setLineDash(state.inLane ? [4, 4] : []);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawTargets(ctx: CanvasRenderingContext2D, state: PinballState) {
  TABLE.targets.forEach((target, index) => {
    const up = state.targets[index] === true;
    const x = target.a.x + (up ? 1 : 4);
    const top = target.a.y + 2;
    const bottom = target.b.y - 2;
    ctx.fillStyle = up ? COLORS.target : COLORS.targetDown;
    ctx.fillRect(x, top, up ? 8 : 3, bottom - top);
    if (!up) return;
    ctx.fillStyle = COLORS.targetStripe;
    ctx.fillRect(x, (top + bottom) / 2 - 2, 8, 4);
  });
}

function drawSlingshots(ctx: CanvasRenderingContext2D, state: PinballState) {
  TABLE.slingshots.forEach((sling, index) => {
    const lit = (state.slingFlash[index] ?? 0) > 0;
    const [top, bottom, inner] = sling.corners;
    ctx.fillStyle = lit ? COLORS.slingLit : COLORS.sling;
    polygon(ctx, [[top.x, top.y], [bottom.x, bottom.y], [inner.x, inner.y]]);
    ctx.strokeStyle = COLORS.slingEdge;
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.stroke();
    // Electric bolt printed inside the slingshot.
    const mx = (top.x * 2 + bottom.x + inner.x) / 4;
    ctx.beginPath();
    ctx.moveTo(top.x + (inner.x - top.x) * 0.15, top.y + 14);
    ctx.lineTo(mx + 4, (top.y + bottom.y) / 2);
    ctx.lineTo(mx - 3, (top.y + bottom.y) / 2 + 8);
    ctx.lineTo(bottom.x + (inner.x - bottom.x) * 0.45, bottom.y + (inner.y - bottom.y) * 0.3);
    ctx.strokeStyle = COLORS.slingBolt;
    ctx.shadowColor = COLORS.slingBolt;
    ctx.shadowBlur = 5;
    ctx.lineWidth = lit ? 4 : 3;
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.moveTo(sling.kicker.a.x, sling.kicker.a.y);
    ctx.lineTo(sling.kicker.b.x, sling.kicker.b.y);
    ctx.strokeStyle = COLORS.kicker;
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.stroke();
  });
}

function drawBumpers(ctx: CanvasRenderingContext2D, state: PinballState) {
  TABLE.bumpers.forEach((bumper, index) => {
    const lit = (state.bumperFlash[index] ?? 0) > 0;
    const { x, y, radius } = bumper;
    disc(ctx, x + 3, y + 4, radius, COLORS.bumperShadow);
    const skirt = ctx.createRadialGradient(x - radius * 0.3, y - radius * 0.3, 2, x, y, radius);
    skirt.addColorStop(0, COLORS.bumperSkirt);
    skirt.addColorStop(1, COLORS.bumperSkirtShade);
    disc(ctx, x, y, radius, skirt);
    disc(ctx, x, y - 5, radius * 0.82, COLORS.bumperCap);
    for (let petal = 0; petal < 5; petal++) {
      const a = petal / 5 * Math.PI * 2;
      disc(ctx, x + Math.cos(a) * radius * 0.5, y - 5 + Math.sin(a) * radius * 0.5, radius * 0.25, lit ? COLORS.bumperLit : index >= 4 ? COLORS.bumperCore : COLORS.bumperRing);
    }
    disc(ctx, x, y - 7, radius * 0.39, COLORS.bumperSkirt);
    disc(ctx, x, y - 8, radius * 0.27, COLORS.bumperCore);

  });
}

function drawPlunger(ctx: CanvasRenderingContext2D, state: PinballState) {
  const { shooter, height } = TABLE;
  const floor = plungerFloor(state);
  const center = (shooter.left + shooter.right) / 2;
  ctx.beginPath();
  const coils = 7;
  const top = floor + 7;
  const bottom = height - 4;
  ctx.moveTo(center, top);
  for (let coil = 1; coil <= coils * 2; coil += 1) {
    ctx.lineTo(center + (coil % 2 === 0 ? -6 : 6), top + ((bottom - top) * coil) / (coils * 2));
  }
  ctx.strokeStyle = COLORS.spring;
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.stroke();
  const knobWidth = shooter.right - shooter.left - 8;
  for (let stripe = 0; stripe < 4; stripe += 1) {
    ctx.fillStyle = stripe % 2 === 0 ? COLORS.plungerRed : COLORS.plungerWhite;
    ctx.fillRect(shooter.left + 4 + (stripe * knobWidth) / 4, floor, knobWidth / 4, 8);
  }
}

function drawFlippers(ctx: CanvasRenderingContext2D, state: PinballState) {
  TABLE.flippers.forEach((_, index) => {
    const pose = flipperPose(state, index);
    const px = -Math.sin(pose.angle);
    const py = Math.cos(pose.angle);
    ctx.beginPath();
    ctx.moveTo(pose.pivot.x + px * pose.baseRadius, pose.pivot.y + py * pose.baseRadius);
    ctx.lineTo(pose.tip.x + px * pose.tipRadius, pose.tip.y + py * pose.tipRadius);
    ctx.arc(pose.tip.x, pose.tip.y, pose.tipRadius, pose.angle + Math.PI / 2, pose.angle - Math.PI / 2, true);
    ctx.lineTo(pose.pivot.x - px * pose.baseRadius, pose.pivot.y - py * pose.baseRadius);
    ctx.arc(pose.pivot.x, pose.pivot.y, pose.baseRadius, pose.angle - Math.PI / 2, pose.angle + Math.PI / 2, true);
    ctx.closePath();
    const fill = ctx.createLinearGradient(pose.pivot.x, pose.pivot.y - 9, pose.pivot.x, pose.pivot.y + 9);
    fill.addColorStop(0, COLORS.flipper);
    fill.addColorStop(1, COLORS.flipperShade);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = COLORS.flipperEdge;
    ctx.lineWidth = 3;
    ctx.stroke();
    disc(ctx, pose.pivot.x, pose.pivot.y, 3, COLORS.flipperEdge);
  });
}

function drawBall(ctx: CanvasRenderingContext2D, state: PinballState) {
  const { x, y } = state.ball;
  const radius = TABLE.ballRadius;
  disc(ctx, x + 2, y + 3, radius, COLORS.bumperShadow);
  const shine = ctx.createRadialGradient(x - 3, y - 3, 1, x, y, radius);
  shine.addColorStop(0, COLORS.ballLight);
  shine.addColorStop(0.55, COLORS.ballMid);
  shine.addColorStop(1, COLORS.ballDark);
  disc(ctx, x, y, radius, shine);
}

function drawTable(ctx: CanvasRenderingContext2D, state: PinballState, time: number, backdrop: HTMLCanvasElement) {
  ctx.drawImage(backdrop, 0, 0, TABLE.width, TABLE.height);
  drawDecals(ctx, state, time);
  drawTargets(ctx, state);
  drawSlingshots(ctx, state);
  drawRails(ctx, state);
  drawBumpers(ctx, state);
  drawPlunger(ctx, state);

  drawFlippers(ctx, state);
  if (state.status === "playing") drawBall(ctx, state);

}

// The table is drawn flat, then tilted away from the player like the original's 3D view.
const TILT_ANGLE = 0.42;
const TILT_DEPTH = 0.7;
const TABLE_STRETCH = 1.11;
const TILT_TOP_SCALE = TILT_DEPTH / (TILT_DEPTH + Math.sin(TILT_ANGLE));
const TILT_HEIGHT = Math.cos(TILT_ANGLE) * TILT_TOP_SCALE;

/** Maps a point on the tilted canvas (relative to its bottom center, y up) back to table units. */
function untilt(x: number, up: number, cssHeight: number): { x: number; y: number } {
  const depth = cssHeight * TILT_DEPTH;
  const rise = (up * depth) / (Math.cos(TILT_ANGLE) * depth - up * Math.sin(TILT_ANGLE));
  const scale = depth / (depth + rise * Math.sin(TILT_ANGLE));
  const unit = cssHeight / TABLE.height;
  return { x: TABLE.width / 2 + x / scale / unit, y: TABLE.height - rise / unit };
}

export function PinballGame({ active = true }: { active?: boolean }) {
  const [initial] = useState(newGame);
  const bodyRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const backdropRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<PinballState>(initial);
  const keysRef = useRef(new Set<string>());
  const pointersRef = useRef(new Map<number, Control>());
  const nudgeRef = useRef<Nudge | null>(null);
  const hudRef = useRef<Hud>(hudOf(initial));
  const [hud, setHud] = useState<Hud>(() => hudOf(initial));
  const [highScore, setHighScore] = useState(loadHighScore);
  const highRef = useRef(highScore);
  const [controls, setControls] = useState<Controls>(loadControls);
  const [dialog, setDialog] = useState<"controls" | "scores" | "help" | "about" | null>(null);
  const [focused, setFocused] = useState(false);
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(() => typeof document === "undefined" || document.visibilityState !== "hidden");
  const [announcement, setAnnouncement] = useState("");
  const helpId = useId();
  const running = active && focused && visible && !paused && dialog === null;
  const holdKeys = new Map<string, Control>([["ShiftLeft", "left"], ["ShiftRight", "right"], ["ArrowDown", "plunger"], [controls.left, "left"], [controls.right, "right"], [controls.plunger, "plunger"]]);
  const nudgeKeys = new Map<string, Nudge>([[controls.nudgeLeft, "left"], [controls.nudgeRight, "right"], [controls.nudgeUp, "up"]]);


  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.setTransform(canvas.width / TABLE.width, 0, 0, canvas.height / TABLE.height, 0, 0);
    let backdrop = backdropRef.current;
    if (!backdrop || backdrop.width !== canvas.width || backdrop.height !== canvas.height) {
      backdrop = document.createElement("canvas");
      backdrop.width = canvas.width; backdrop.height = canvas.height;
      const background = backdrop.getContext("2d");
      if (!background) return;
      background.setTransform(canvas.width / TABLE.width, 0, 0, canvas.height / TABLE.height, 0, 0);
      drawBackdrop(background); drawFrame(background); drawPrintedArt(background); drawRamp(background); drawStarburst(background); drawMechanisms(background);
      backdropRef.current = backdrop;
    }
    drawTable(ctx, stateRef.current, performance.now() / 1000, backdrop);
  }, []);

  const recordHighScore = useCallback((score: number) => {
    if (score <= highRef.current) return;
    highRef.current = score;
    setHighScore(score);
    localStorage.setItem(HIGH_SCORE_KEY, String(score));
  }, []);

  const syncHud = useCallback(() => {
    const next = hudOf(stateRef.current);
    const previous = hudRef.current;
    if (sameHud(previous, next)) return;
    hudRef.current = next;
    setHud(next);
    if (next.status === "over" && previous.status !== "over") {
      recordHighScore(next.score);
      setAnnouncement(`Game over. Final score ${formatScore(next.score)}. Press F2 for a new game.`);
    } else if (next.status === "playing" && next.ballNumber !== previous.ballNumber) {
      setAnnouncement(`Ball ${next.ballNumber} of ${BALLS_PER_GAME}.`);
    }
  }, [recordHighScore]);

  const clearInput = useCallback(() => {
    keysRef.current.clear();
    pointersRef.current.clear();
    nudgeRef.current = null;
    // Cancelling a held launch must not fire the ball when focus returns.
    const state = stateRef.current;
    state.plunger = 0;
    if (state.inLane && state.ball.y > TABLE.shooter.floor - TABLE.ballRadius) {
      state.ball.y = TABLE.shooter.floor - TABLE.ballRadius;
      state.ball.vy = 0;
    }
  }, []);

  const startNewGame = useCallback(() => {
    clearInput();
    setPaused(false);
    recordHighScore(stateRef.current.score);
    stateRef.current = newGame();
    syncHud();
    setAnnouncement(`New game. Ball 1 of ${BALLS_PER_GAME}.`);
    render();
  }, [clearInput, recordHighScore, render, syncHud]);

  useLayoutEffect(() => {
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!stage || !canvas) return;
    const apply = () => {
      const tilt = tiltRef.current;
      if (!tilt || stage.clientWidth === 0 || stage.clientHeight === 0) return;
      const scale = Math.max(
        0.05,
        Math.min(stage.clientWidth / TABLE.width, stage.clientHeight / (TABLE.height * TABLE_STRETCH * TILT_HEIGHT)),
      );
      const cssWidth = Math.max(1, Math.floor(TABLE.width * scale));
      const cssHeight = Math.max(1, Math.floor(TABLE.height * TABLE_STRETCH * scale));
      const ratio = window.devicePixelRatio || 1;
      tilt.style.width = `${cssWidth}px`;
      tilt.style.height = `${Math.ceil(cssHeight * TILT_HEIGHT)}px`;
      canvas.style.width = `${cssWidth}px`;
      canvas.style.height = `${cssHeight}px`;
      canvas.style.transform = `perspective(${cssHeight * TILT_DEPTH}px) rotateX(${TILT_ANGLE}rad)`;
      canvas.width = Math.max(1, Math.round(cssWidth * ratio));
      canvas.height = Math.max(1, Math.round(cssHeight * ratio));
      render();
    };
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(stage);
    return () => observer.disconnect();
  }, [render]);

  useEffect(() => {
    const suspend = () => {
      clearInput();
      setFocused(false);
    };
    const onVisibility = () => {
      setVisible(document.visibilityState !== "hidden");
      if (document.visibilityState === "hidden") suspend();
    };
    const resumeFocus = () => {
      setFocused(bodyRef.current?.contains(document.activeElement) ?? false);
    };
    window.addEventListener("blur", suspend);
    window.addEventListener("focus", resumeFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("blur", suspend);
      window.removeEventListener("focus", resumeFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [clearInput]);

  useEffect(() => {
    if (dialog !== null) return;
    const body = bodyRef.current;
    body?.focus({ preventScroll: true });
    setFocused(body?.contains(document.activeElement) ?? false);
  }, [dialog]);

  useEffect(
    () => () => {
      const score = stateRef.current.score;
      if (score > highRef.current) localStorage.setItem(HIGH_SCORE_KEY, String(score));
    },
    [],
  );

  useEffect(() => {
    if (!running) {
      clearInput();
      syncHud();
      render();
      return;
    }
    const readInput = (): PinballInput => {
      const held = new Set<Control>(pointersRef.current.values());
      for (const code of keysRef.current) {
        const control = holdKeys.get(code);
        if (control !== undefined) held.add(control);
      }
      const nudge = nudgeRef.current;
      nudgeRef.current = null;
      return { leftFlipper: held.has("left"), rightFlipper: held.has("right"), plunger: held.has("plunger"), nudge };
    };
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(MAX_FRAME_SECONDS, Math.max(0, (now - last) / 1000));
      last = now;
      stateRef.current = step(stateRef.current, readInput(), dt);
      syncHud();
      render();
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [running, controls, clearInput, render, syncHud]);

  const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (!active || event.metaKey || event.ctrlKey || event.altKey) return;
    if (event.code === "F8" || event.code === "F1") {
      event.preventDefault(); event.stopPropagation(); clearInput();
      setDialog(event.code === "F8" ? "controls" : "help"); return;
    }
    if (event.code === "F3") {
      event.preventDefault();
      event.stopPropagation();
      if (!event.repeat && stateRef.current.status === "playing") {
        setPaused((value) => !value && focused);
        bodyRef.current?.focus({ preventScroll: true });
      }
      return;
    }
    if (event.code === "F2") {
      event.preventDefault();
      event.stopPropagation();
      if (!event.repeat) startNewGame();
      return;
    }
    if (!bodyRef.current?.contains(event.target as Node)) return;
    const nudge = nudgeKeys.get(event.code);
    if (nudge !== undefined) {
      event.preventDefault();
      event.stopPropagation();
      if (running && !event.repeat) nudgeRef.current = nudge;
      return;
    }
    if (holdKeys.has(event.code)) {
      event.preventDefault();
      event.stopPropagation();
      if (running) keysRef.current.add(event.code);
    }
  };

  const onKeyUp = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (!holdKeys.has(event.code)) return;
    event.preventDefault();
    event.stopPropagation();
    keysRef.current.delete(event.code);
  };

  const onBlur = (event: ReactFocusEvent<HTMLDivElement>) => {
    if (event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)) return;
    clearInput();
    setFocused(false);
  };

  const hold = (event: ReactPointerEvent<HTMLElement>, control: Control) => {
    event.preventDefault();
    bodyRef.current?.focus({ preventScroll: true });
    if (paused || !active) return;
    pointersRef.current.set(event.pointerId, control);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const release = (event: ReactPointerEvent<HTMLElement>) => {
    pointersRef.current.delete(event.pointerId);
  };

  const onCanvasPointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const rect = tiltRef.current?.getBoundingClientRect();
    if (!rect) return;
    const { x, y } = untilt(event.clientX - (rect.left + rect.width / 2), rect.bottom - event.clientY, event.currentTarget.offsetHeight);
    const control: Control =
      x >= TABLE.shooter.left && y >= TABLE.shooter.floor - 180 ? "plunger" : x < TABLE.shooter.left / 2 ? "left" : "right";
    hold(event, control);
  };

  const over = hud.status === "over";
  // Mission-box copy follows the original's terse status lines.
  const message = over
    ? "Game Over"
    : !running
      ? "Game Paused\nF3 to Resume"
      : hud.awaiting
        ? "Awaiting Deployment"
        : hud.multiplier > 1
          ? `Bonus ${hud.multiplier}x Lit`
          : "Hit Targets To\nLight Bonus";
  const detail = over ? "F2 for a new game" : paused ? "F3 to resume" : !running ? "Click the table to resume" : hud.awaiting ? "Hold Space to launch" : "";

  return (
    <div className="bbd-program bbd-pinball" onKeyDown={onKeyDown} onKeyUp={onKeyUp}>
      <ProgramMenuBar menus={[
        { label: "Game", items: [
          { label: "New Game", shortcut: "F2", action: () => { startNewGame(); bodyRef.current?.focus(); } },
          { label: "Launch Ball", disabled: over || !hud.awaiting, action: () => { stateRef.current.plunger = 1; setPaused(false); bodyRef.current?.focus(); } },
          { label: "Pause/Resume Game", shortcut: "F3", disabled: over, action: () => { setPaused(!paused); bodyRef.current?.focus(); } },
          "separator",
          { label: "High Scores...", action: () => setDialog("scores") },
          { label: "Demo", disabled: true },
        ] },
        { label: "Options", items: [
          { label: "Full Screen", disabled: true, shortcut: "F4" },
          { label: "Select Players", disabled: true },
          "separator",
          { label: "Sounds", disabled: true },
          { label: "Music", disabled: true },
          "separator",
          { label: "Player Controls...", shortcut: "F8", action: () => setDialog("controls") },
        ] },
        { label: "Help", items: [
          { label: "Help Topics", shortcut: "F1", action: () => setDialog("help") },
          "separator",
          { label: "About Pinball", action: () => setDialog("about") },
        ] },
      ]} />
      <div
        ref={bodyRef}
        className="bbd-pinball-body"
        tabIndex={0}
        role="application"
        aria-label="3D Pinball table"
        aria-describedby={helpId}
        onFocus={() => setFocused(true)}
        onBlur={onBlur}
      >
        <div ref={stageRef} className="bbd-pinball-stage">
          <div ref={tiltRef} className="bbd-pinball-tilt">
            <canvas
              ref={canvasRef}
              className="bbd-pinball-canvas"
              aria-hidden
              onPointerDown={onCanvasPointerDown}
              onPointerUp={release}
              onPointerCancel={release}
              onLostPointerCapture={release}
              onContextMenu={(event) => event.preventDefault()}
            />
          </div>
        </div>
        <aside className="bbd-pinball-panel" aria-label="Scoreboard">
          <div className="bbd-pinball-logo">
            <SpaceCadetLettering />
            <svg viewBox="0 0 180 100" className="bbd-pinball-ship" aria-hidden>
              <defs><linearGradient id={`${helpId}-hull`} x2="0.3" y2="1"><stop stopColor="#deded8"/><stop offset=".45" stopColor="#969991"/><stop offset="1" stopColor="#5c6060"/></linearGradient></defs>
              <circle cx="15" cy="78" r="17" fill="#506023" />
              <path d="m2 69 11-5 9 5-5 5 10 8-10 5-5-8-11-1Z" fill="#778129" />
              <path d="m160 23 19-10-5 15 6 7-22 7" fill="#bc4725" /><path d="m166 26 12-7-5 15-9 1" fill="#f3c943" />
              <path d="M38 62Q44 39 68 30L112 19Q140 9 158 27Q166 35 163 46Q181 50 181 64Q177 76 153 78L79 89Q53 88 38 77Q31 69 38 62Z" fill={`url(#${helpId}-hull)`} stroke="#4c5355" strokeWidth="2" />
              <path d="m61 54 24-19 30-4 24 7 4 20-22 12-37-3Z" fill="#33383a" />
              <path d="m61 58 21-15 41 11-4 15-37-4Z" fill="#849647" />
              <path d="m76 56 4-15 14-8 24 7 12 19-16 4-16-7-9 8Z" fill="#7348a5" />
              <path d="m86 42 12-7 7 4 8 10-7 5-9-9-9 4-14-1-3-5Z" fill="#d7ad7e" stroke="#7d6145" />
              <ellipse cx="105" cy="29" rx="12" ry="15" fill="#e5b389" stroke="#785239" />
              <path d="M92 26q0-20 16-19 17 2 13 28l-6-9-1-10-15 0-1 15Z" fill="#4f7fa6" stroke="#b3c7ca" />
              <ellipse cx="101" cy="26" rx="3" ry="4" fill="#f2eee0"/><ellipse cx="110" cy="25" rx="3" ry="4" fill="#f2eee0"/>
              <circle cx="102" cy="27" r="1.4" fill="#292d36"/><circle cx="110" cy="26" r="1.4" fill="#292d36"/>
              <path d="m102 35 10-2-4 7Z" fill="#f0e1bd" stroke="#895740"/>
              <path d="M78 55q-6-51 31-53 38 0 38 52" fill="none" stroke="#84b1bc" strokeWidth="2" />
              <path d="M42 63Q45 53 58 54Q75 55 81 67Q88 83 72 86Q46 89 38 77Q34 70 42 63Z M126 67Q143 57 165 48Q183 56 178 68Q164 77 144 78Q132 80 126 67Z" fill="#a9aca5" stroke="#d1d0c8" strokeWidth="2" />
              <path d="M49 58Q42 70 49 82M58 58Q49 73 59 85M69 62Q60 77 70 86" fill="none" stroke="#747a77" strokeWidth="3"/>
              <ellipse cx="43" cy="72" rx="7" ry="10" fill="#777f7b"/>
              <path d="m39 60 10-6-3 12Z" fill="#fbdf79"/>
              <text x="53" y="61" transform="rotate(24 53 61)" fill="#f5f0e5" fontSize="9" fontFamily="Tahoma">2001</text>
            </svg>
            <span className="bbd-pinball-ball">
              <span className="bbd-pinball-ball-label">Ball</span>
              <span className="bbd-pinball-box"><DotMatrix text={over ? "" : hud.ballNumber} /></span>
            </span>
          </div>
          <div className="bbd-pinball-score">
            <span className="bbd-pinball-box"><DotMatrix text="1" /></span>
            <span className="bbd-pinball-box" aria-label={`Score ${formatScore(hud.score)}`}>
              <DotMatrix text={formatScore(hud.score)} />
            </span>
          </div>
          <p className="bbd-pinball-box bbd-pinball-info">
            <DotMatrix text={over ? "Game Over" : !running ? "Game Paused\nF3 to Resume" : "Player 1"} />
          </p>
          <p className="bbd-pinball-box bbd-pinball-message" data-tone={over ? "over" : undefined}>
            <DotMatrix text={over ? `HIGH SCORE\n${formatScore(Math.max(highScore, hud.score))}` : !running ? "" : message} />
            <span className="bbd-pinball-live">{detail}</span>
          </p>
          <button
            type="button"
            className="bbd-button bbd-bevel bbd-pinball-launch"
            tabIndex={-1}
            disabled={over}
            onPointerDown={(event) => {
              if (event.pointerType === "mouse" && event.button !== 0) return;
              hold(event, "plunger");
            }}
            onPointerUp={release}
            onPointerCancel={release}
            onLostPointerCapture={release}
          >
            Hold to launch
          </button>
        </aside>
      </div>
      <p id={helpId} className="bbd-pinball-live">{keyLabel(controls.left)}: left flipper. {keyLabel(controls.right)}: right flipper. Hold {keyLabel(controls.plunger)}, then release to launch. F3: pause. F8: player controls.</p>
      {dialog === "controls" && <PlayerControls controls={controls} onClose={() => { setDialog(null); bodyRef.current?.focus(); }} onSave={(value) => { clearInput(); setControls(value); localStorage.setItem(CONTROL_KEY, JSON.stringify(value)); setDialog(null); bodyRef.current?.focus(); }} />}
      {dialog !== null && dialog !== "controls" && <PinballDialog title={dialog === "scores" ? "3D Pinball: High Scores" : dialog === "help" ? "Pinball Help" : "About Pinball"} onClose={() => { setDialog(null); bodyRef.current?.focus(); }}>
        {dialog === "scores" ? <p>High score: {formatScore(Math.max(highScore, hud.score))}</p> : dialog === "about" ? <><p><strong>3D Pinball — Space Cadet</strong></p><p>Desktop's original vector tribute to the Windows classic. No original game assets are included.</p><p>Single-player scoring with bumpers, targets, and lane bonuses. Original missions, sounds, and multiplayer are not implemented.</p></> : <><p>Hold {keyLabel(controls.plunger)} and release to launch. Hit bumpers and targets to score; light all three top lanes to increase the bonus multiplier.</p><dl className="bbd-pinball-keys">
          <dt>{keyLabel(controls.left)} / Left Shift</dt><dd>Left flipper</dd>
          <dt>{keyLabel(controls.right)} / Right Shift</dt><dd>Right flipper</dd>
          <dt>{keyLabel(controls.plunger)} / Down</dt><dd>Hold, then release to launch</dd>
          <dt>{[controls.nudgeLeft, controls.nudgeRight, controls.nudgeUp].map(keyLabel).join(" · ")}</dt><dd>Nudge the table</dd>
          <dt>F3</dt><dd>Pause or resume</dd><dt>F2</dt><dd>New game</dd><dt>F8</dt><dd>Player controls</dd>
        </dl></>}
        <footer><button className="bbd-button bbd-bevel" onClick={() => { setDialog(null); bodyRef.current?.focus(); }}>OK</button></footer>
      </PinballDialog>}
      <p className="bbd-pinball-live" role="status" aria-live="polite">
        {announcement}
      </p>
    </div>
  );
}
