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

const HOLD_KEYS = new Map<string, Control>([
  ["KeyZ", "left"],
  ["ShiftLeft", "left"],
  ["Slash", "right"],
  ["ShiftRight", "right"],
  ["Space", "plunger"],
  ["ArrowDown", "plunger"],
]);

const NUDGE_KEYS = new Map<string, Nudge>([
  ["KeyX", "left"],
  ["Period", "right"],
  ["ArrowUp", "up"],
]);

const COLORS = {
  space: "#1b1352",
  spaceDeep: "#070720",
  nebulaRed: "oklch(0.5 0.19 30 / 0.5)",
  nebulaViolet: "oklch(0.45 0.2 300 / 0.45)",
  nebulaBlue: "oklch(0.5 0.16 250 / 0.35)",
  clear: "oklch(0.2 0.08 280 / 0)",
  star: "oklch(0.96 0.03 240)",
  crack: "oklch(0.66 0.15 245 / 0.5)",
  crackGlow: "oklch(0.6 0.16 250 / 0.14)",
  woodLight: "#b0643a",
  woodDark: "#4a1d0c",
  woodEdge: "#1d0904",
  lane: "#0b0718",
  railShadow: "#1a0706",
  rail: "#b8452f",
  railShine: "#f2b48c",
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
  holeInner: "#1e4aa8",
  holeLampOff: "#1d3b8f",
  holeLampOn: "#9fe4ff",
  holeCenter: "#ffcf6a",
  holeCenterMid: "#d2491f",
  holeCenterEdge: "#4a0f14",
  starburst: "#5b33a8",
  starburstLight: "#a57ce6",
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

const FONT = "Tahoma, Verdana, 'Segoe UI', sans-serif";

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
  for (let index = 0; index < 16; index += 1) grow(20 + next() * 340, 60 + next() * 560, next() * Math.PI * 2, 7 + Math.floor(next() * 6));
  return lines;
})();

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
  return score.toLocaleString("en-US");
}

const HOLE = { x: 185, y: 410 };

// Yellow arrow inserts: [x, y, angle] where angle 0 points up the table.
const ARROWS = [
  [150, 468, 0],
  [220, 468, 0],
  [185, 492, 0],
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
    [COLORS.crackGlow, 4],
    [COLORS.crack, 1.2],
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
  ctx.fillStyle = woodFill(ctx, 0, width);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, arcCenter.y);
  ctx.arc(arcCenter.x, arcCenter.y, arcRadius, Math.PI, Math.PI * 2);
  ctx.lineTo(width, arcCenter.y);
  ctx.lineTo(width, 0);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = woodFill(ctx, 0, 8);
  ctx.fillRect(0, arcCenter.y, 8, height - arcCenter.y);
  ctx.fillStyle = woodFill(ctx, shooter.right, width);
  ctx.fillRect(shooter.right, arcCenter.y, width - shooter.right, height - arcCenter.y);
  // Inlane/outlane aprons below the slingshots.
  ctx.fillStyle = COLORS.woodDark;
  polygon(ctx, [
    [0, 566],
    [8, 566],
    [left.pivot.x, left.pivot.y],
    [left.pivot.x - 6, height],
    [0, height],
  ]);
  polygon(ctx, [
    [shooter.left, 566],
    [right.pivot.x, right.pivot.y],
    [right.pivot.x + 6, height],
    [shooter.left, height],
  ]);
  ctx.fillStyle = COLORS.lane;
  ctx.fillRect(shooter.left, arcCenter.y, shooter.right - shooter.left, height - arcCenter.y);
  // Launch-lane chevrons.
  const center = (shooter.left + shooter.right) / 2;
  ctx.fillStyle = COLORS.lampOff;
  for (let y = 250; y < 620; y += 46) polygon(ctx, [[center, y], [center + 9, y + 10], [center - 9, y + 10]]);
  ctx.strokeStyle = COLORS.woodEdge;
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, width - 2, height - 2);
}

function drawRamp(ctx: CanvasRenderingContext2D) {
  // The purple left ramp that curls up toward the top of the table.
  ctx.lineCap = "butt";
  ctx.beginPath();
  ctx.moveTo(34, 455);
  ctx.bezierCurveTo(22, 330, 50, 200, 122, 138);
  ctx.strokeStyle = COLORS.rampEdge;
  ctx.lineWidth = 34;
  ctx.stroke();
  ctx.strokeStyle = COLORS.ramp;
  ctx.lineWidth = 28;
  ctx.stroke();
  ctx.setLineDash([7, 9]);
  ctx.strokeStyle = COLORS.rampStripe;
  ctx.lineWidth = 20;
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = COLORS.slingEdge;
  polygon(ctx, [[22, 470], [46, 470], [34, 452]]);
}

function drawHole(ctx: CanvasRenderingContext2D, state: PinballState, time: number) {
  // The hyperspace "black hole": two rings of blue inserts around an orange vortex.
  const { x, y } = HOLE;
  const rim = ctx.createRadialGradient(x, y, 20, x, y, 78);
  rim.addColorStop(0, COLORS.holeInner);
  rim.addColorStop(1, COLORS.holeRim);
  disc(ctx, x, y, 78, rim);
  const lit = Math.round(((state.multiplier - 1) / (MAX_MULTIPLIER - 1)) * 22);
  const chase = Math.floor(time * 10) % 22;
  for (let index = 0; index < 22; index += 1) {
    const angle = (index / 22) * Math.PI * 2 - Math.PI / 2;
    const on = index < lit || index === chase;
    disc(ctx, x + Math.cos(angle) * 66, y + Math.sin(angle) * 66, 5, on ? COLORS.holeLampOn : COLORS.holeLampOff);
  }
  for (let index = 0; index < 14; index += 1) {
    const angle = (index / 14) * Math.PI * 2;
    const on = (index + Math.floor(time * 6)) % 7 === 0;
    disc(ctx, x + Math.cos(angle) * 46, y + Math.sin(angle) * 46, 4, on ? COLORS.holeLampOn : COLORS.holeLampOff);
  }
  const vortex = ctx.createRadialGradient(x, y, 2, x, y, 30);
  vortex.addColorStop(0, COLORS.spaceDeep);
  vortex.addColorStop(0.3, COLORS.holeCenter);
  vortex.addColorStop(0.7, COLORS.holeCenterMid);
  vortex.addColorStop(1, COLORS.holeCenterEdge);
  disc(ctx, x, y, 30, vortex);
}

function drawStarburst(ctx: CanvasRenderingContext2D) {
  const cx = 185;
  const cy = 712;
  for (let index = 0; index < 11; index += 1) {
    const angle = -Math.PI / 2 + ((index - 5) / 5) * 1.15;
    const length = index % 2 === 0 ? 118 : 78;
    const spread = 0.13;
    ctx.fillStyle = index % 2 === 0 ? COLORS.starburst : COLORS.starburstLight;
    polygon(ctx, [
      [cx + Math.cos(angle - spread) * 14, cy + Math.sin(angle - spread) * 14],
      [cx + Math.cos(angle) * length, cy + Math.sin(angle) * length],
      [cx + Math.cos(angle + spread) * 14, cy + Math.sin(angle + spread) * 14],
    ]);
  }
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
  drawRamp(ctx);
  drawStarburst(ctx);
  drawHole(ctx, state, time);
  drawArrows(ctx, state, time);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `700 11px ${FONT}`;
  for (let level = 2; level <= MAX_MULTIPLIER; level += 1) {
    const x = 140 + (level - 2) * 30;
    const on = state.multiplier >= level;
    ctx.fillStyle = on ? COLORS.lampOn : COLORS.lampOff;
    ctx.fillRect(x - 11, 510, 22, 13);
    ctx.fillStyle = on ? COLORS.spaceDeep : COLORS.lampOn;
    ctx.globalAlpha = on ? 1 : 0.5;
    ctx.fillText(`${level}×`, x, 517);
    ctx.globalAlpha = 1;
  }
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
    ctx.lineWidth = lit ? 2.5 : 1.5;
    ctx.stroke();
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
    disc(ctx, x, y, radius * 0.74, lit ? COLORS.bumperLit : COLORS.bumperRing);
    const cap = ctx.createRadialGradient(x - 3, y - 3, 1, x, y, radius * 0.5);
    cap.addColorStop(0, COLORS.bumperCap);
    cap.addColorStop(1, COLORS.bumperSkirt);
    disc(ctx, x, y, radius * 0.5, cap);
    disc(ctx, x, y, radius * 0.22, lit ? COLORS.bumperRing : COLORS.bumperCore);
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

function drawLaunchHint(ctx: CanvasRenderingContext2D, time: number) {
  const center = (TABLE.shooter.left + TABLE.shooter.right) / 2;
  ctx.globalAlpha = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(time * 6));
  ctx.fillStyle = COLORS.arrowOn;
  for (let y = 250; y < 620; y += 46) polygon(ctx, [[center, y], [center + 9, y + 10], [center - 9, y + 10]]);
  ctx.globalAlpha = 1;
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

function drawOverlay(ctx: CanvasRenderingContext2D, title: string, detail: string) {
  ctx.fillStyle = COLORS.shade;
  ctx.fillRect(0, 0, TABLE.width, TABLE.height);
  ctx.fillStyle = COLORS.overlayText;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `700 26px ${FONT}`;
  ctx.fillText(title, TABLE.width / 2, 340);
  ctx.font = `400 13px ${FONT}`;
  ctx.fillText(detail, TABLE.width / 2, 372);
}

function drawTable(ctx: CanvasRenderingContext2D, state: PinballState, paused: boolean, time: number) {
  drawBackdrop(ctx);
  drawFrame(ctx);
  drawDecals(ctx, state, time);
  drawTargets(ctx, state);
  drawSlingshots(ctx, state);
  drawRails(ctx, state);
  drawBumpers(ctx, state);
  drawPlunger(ctx, state);
  if (awaitingLaunch(state)) drawLaunchHint(ctx, time);
  drawFlippers(ctx, state);
  if (state.status === "playing") drawBall(ctx, state);
  if (state.status === "over") drawOverlay(ctx, "GAME OVER", "Press F2 for a new game");
  else if (paused && !state.inLane) drawOverlay(ctx, "PAUSED", "Click the table to resume");
}

// The table is drawn flat, then tilted away from the player like the original's 3D view.
const TILT_ANGLE = (24 * Math.PI) / 180;
const TILT_DEPTH = 1.3;
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

export function PinballGame() {
  const [initial] = useState(newGame);
  const bodyRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<PinballState>(initial);
  const keysRef = useRef(new Set<string>());
  const pointersRef = useRef(new Map<number, Control>());
  const nudgeRef = useRef<Nudge | null>(null);
  const hudRef = useRef<Hud>(hudOf(initial));
  const pausedRef = useRef(true);
  const [hud, setHud] = useState<Hud>(() => hudOf(initial));
  const [highScore, setHighScore] = useState(loadHighScore);
  const highRef = useRef(highScore);
  const [showControls, setShowControls] = useState(false);
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(() => typeof document === "undefined" || document.visibilityState !== "hidden");
  const [announcement, setAnnouncement] = useState("");
  const helpId = useId();
  const running = focused && visible;

  pausedRef.current = !running;

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.setTransform(canvas.width / TABLE.width, 0, 0, canvas.height / TABLE.height, 0, 0);
    drawTable(ctx, stateRef.current, pausedRef.current, performance.now() / 1000);
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

  const startNewGame = useCallback(() => {
    recordHighScore(stateRef.current.score);
    stateRef.current = newGame();
    syncHud();
    setAnnouncement(`New game. Ball 1 of ${BALLS_PER_GAME}.`);
    render();
  }, [recordHighScore, render, syncHud]);

  useLayoutEffect(() => {
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!stage || !canvas) return;
    const apply = () => {
      const tilt = tiltRef.current;
      if (!tilt) return;
      const scale = Math.max(
        0.05,
        Math.min(stage.clientWidth / TABLE.width, stage.clientHeight / (TABLE.height * TILT_HEIGHT)),
      );
      const cssWidth = Math.max(1, Math.floor(TABLE.width * scale));
      const cssHeight = Math.max(1, Math.floor(TABLE.height * scale));
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
    const onVisibility = () => setVisible(document.visibilityState !== "hidden");
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useEffect(() => {
    bodyRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(
    () => () => {
      const score = stateRef.current.score;
      if (score > highRef.current) localStorage.setItem(HIGH_SCORE_KEY, String(score));
    },
    [],
  );

  useEffect(() => {
    if (!running) {
      render();
      return;
    }
    const readInput = (): PinballInput => {
      const held = new Set<Control>(pointersRef.current.values());
      for (const code of keysRef.current) {
        const control = HOLD_KEYS.get(code);
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
  }, [running, render, syncHud]);

  const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    if (event.code === "F2") {
      event.preventDefault();
      if (!event.repeat) startNewGame();
      return;
    }
    const nudge = NUDGE_KEYS.get(event.code);
    if (nudge !== undefined) {
      event.preventDefault();
      if (!event.repeat) nudgeRef.current = nudge;
      return;
    }
    if (HOLD_KEYS.has(event.code)) {
      event.preventDefault();
      keysRef.current.add(event.code);
    }
  };

  const onKeyUp = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (!HOLD_KEYS.has(event.code)) return;
    event.preventDefault();
    keysRef.current.delete(event.code);
  };

  const onBlur = (event: ReactFocusEvent<HTMLDivElement>) => {
    if (event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)) return;
    keysRef.current.clear();
    setFocused(false);
  };

  const hold = (event: ReactPointerEvent<HTMLElement>, control: Control) => {
    event.preventDefault();
    bodyRef.current?.focus({ preventScroll: true });
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
    : hud.awaiting
      ? "Awaiting Deployment"
      : !running
        ? "Paused"
        : hud.multiplier > 1
          ? `Bonus ${hud.multiplier}x Lit`
          : "Launch Training";
  const detail = over ? "F2 for a new game" : hud.awaiting ? "Hold Space to launch" : !running ? "Click the table to resume" : "";

  return (
    <div className="bbd-program bbd-pinball">
      <ProgramMenuBar menus={[
        { label: "Game", items: [{ label: "New Game", shortcut: "F2", action: () => { startNewGame(); bodyRef.current?.focus(); } }] },
        { label: "Options", items: [{ label: "Player Controls", action: () => setShowControls(!showControls), checked: showControls }] },
        { label: "Help", items: [{ label: "Z / Left Shift: left flipper" }, { label: "/ / Right Shift: right flipper" }, { label: "Hold Space, then release to launch" }] },
      ]} />
      <div
        ref={bodyRef}
        className="bbd-pinball-body"
        tabIndex={0}
        role="application"
        aria-label="3D Pinball table"
        aria-describedby={helpId}
        onKeyDown={onKeyDown}
        onKeyUp={onKeyUp}
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
            <span className="bbd-pinball-logo-small" aria-hidden>3D Pinball</span>
            <span className="bbd-pinball-logo-big" aria-hidden>Space Cadet</span>
            <svg viewBox="0 0 180 90" className="bbd-pinball-ship" aria-hidden>
              <circle cx="22" cy="68" r="17" fill="#5f9b3c" />
              <path d="M10 60c6-4 12 2 18-2s8 6 4 10-14 2-22-8Z M14 76c6 2 12-2 18 1" fill="#3d6e28" />
              <path d="m162 50 16-7-5 9 7 5-18 3Z" fill="#e8702a" />
              <ellipse cx="110" cy="62" rx="44" ry="9" fill="#6f737e" />
              <ellipse cx="110" cy="55" rx="58" ry="14" fill="#c3c7d0" stroke="#5a5e68" strokeWidth="2" />
              <path d="M88 53c-2-18 8-30 22-30s24 12 22 30Z" fill="#8a4fd0" />
              <circle cx="110" cy="31" r="10" fill="#f0c39a" />
              <path d="M99 28c2-10 20-12 23 0-6-4-16-4-23 0Z" fill="#6b3b1a" />
              <rect x="102" y="28" width="16" height="5" rx="2" fill="#3b2a6e" />
              <path d="M84 55a26 30 0 0 1 52 0Z" fill="#bfe0ff" fillOpacity="0.35" stroke="#eaf5ff" strokeWidth="1.5" />
              <circle cx="72" cy="57" r="2.5" fill="#ffc933" />
              <circle cx="110" cy="62" r="2.5" fill="#ffc933" />
              <circle cx="148" cy="57" r="2.5" fill="#ffc933" />
            </svg>
            <span className="bbd-pinball-ball">
              <span className="bbd-pinball-ball-label">Ball</span>
              <span className="bbd-pinball-box bbd-pinball-dots">{over ? "-" : hud.ballNumber}</span>
            </span>
          </div>
          <div className="bbd-pinball-score">
            <span className="bbd-pinball-box bbd-pinball-dots">1</span>
            <span className="bbd-pinball-box bbd-pinball-dots" aria-label={`Score ${formatScore(hud.score)}`}>
              {formatScore(hud.score)}
            </span>
          </div>
          <p className="bbd-pinball-box bbd-pinball-info bbd-pinball-dots">
            {over ? `High Score ${formatScore(Math.max(highScore, hud.score))}` : "Player 1"}
          </p>
          <p className="bbd-pinball-box bbd-pinball-message" data-tone={over ? "over" : undefined}>
            <span className="bbd-pinball-dots">{message}</span>
            {detail ? <span className="bbd-pinball-detail">{detail}</span> : null}
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
          <dl id={helpId} className="bbd-pinball-keys" hidden={!showControls}>
            <dt>Z or Left Shift</dt>
            <dd>Left flipper</dd>
            <dt>/ or Right Shift</dt>
            <dd>Right flipper</dd>
            <dt>Space or Down</dt>
            <dd>Hold, then release to launch</dd>
            <dt>X . Up</dt>
            <dd>Nudge the table</dd>
            <dt>F2</dt>
            <dd>New game</dd>
          </dl>
        </aside>
      </div>
      <p className="bbd-pinball-live" role="status" aria-live="polite">
        {announcement}
      </p>
    </div>
  );
}
