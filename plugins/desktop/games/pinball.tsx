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
  space: "oklch(0.22 0.1 285)",
  spaceDeep: "oklch(0.13 0.06 268)",
  nebulaPink: "oklch(0.45 0.17 320 / 0.42)",
  nebulaBlue: "oklch(0.5 0.15 245 / 0.34)",
  clear: "oklch(0.2 0.08 280 / 0)",
  star: "oklch(0.96 0.03 240)",
  frame: "oklch(0.25 0.07 268)",
  frameEdge: "oklch(0.36 0.09 262)",
  lane: "oklch(0.16 0.05 268)",
  rail: "oklch(0.84 0.11 212)",
  railGlow: "oklch(0.7 0.16 228 / 0.35)",
  gateOpen: "oklch(0.84 0.11 212 / 0.35)",
  bumper: "oklch(0.48 0.21 300)",
  bumperCore: "oklch(0.72 0.16 300)",
  bumperRing: "oklch(0.84 0.13 200)",
  bumperLit: "oklch(0.95 0.13 95)",
  sling: "oklch(0.42 0.17 268)",
  slingLit: "oklch(0.9 0.15 95)",
  kicker: "oklch(0.76 0.18 32)",
  laneOff: "oklch(0.36 0.07 70)",
  laneOn: "oklch(0.88 0.17 80)",
  target: "oklch(0.74 0.19 42)",
  targetDown: "oklch(0.4 0.07 42)",
  flipper: "oklch(0.96 0.02 250)",
  flipperShade: "oklch(0.8 0.04 255)",
  flipperEdge: "oklch(0.56 0.2 27)",
  plunger: "oklch(0.78 0.03 250)",
  spring: "oklch(0.64 0.05 250)",
  ballLight: "oklch(0.99 0.01 250)",
  ballMid: "oklch(0.74 0.03 255)",
  ballDark: "oklch(0.34 0.04 262)",
  title: "oklch(0.84 0.11 212 / 0.42)",
  multiplierOn: "oklch(0.9 0.16 85)",
  multiplierOff: "oklch(0.6 0.06 262 / 0.55)",
  arrow: "oklch(0.88 0.17 80)",
  shade: "oklch(0.1 0.04 270 / 0.6)",
  overlayText: "oklch(0.95 0.05 215)",
} as const;

const FONT = "Tahoma, Verdana, 'Segoe UI', sans-serif";

const STARS = (() => {
  let seed = 7;
  const next = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
  return Array.from({ length: 110 }, () => ({
    x: next() * TABLE.width,
    y: next() * TABLE.height,
    size: next() < 0.15 ? 2 : 1,
    alpha: 0.25 + next() * 0.65,
  }));
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

function polygon(ctx: CanvasRenderingContext2D, points: readonly (readonly [number, number])[]) {
  ctx.beginPath();
  points.forEach(([x, y], index) => (index === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
  ctx.closePath();
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
    [110, 360, 230, COLORS.nebulaPink],
    [290, 170, 200, COLORS.nebulaBlue],
  ] as const) {
    const glow = ctx.createRadialGradient(x, y, 8, x, y, radius);
    glow.addColorStop(0, color);
    glow.addColorStop(1, COLORS.clear);
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);
  }
  ctx.fillStyle = COLORS.star;
  for (const star of STARS) {
    ctx.globalAlpha = star.alpha;
    ctx.fillRect(star.x, star.y, star.size, star.size);
  }
  ctx.globalAlpha = 1;
}

function drawFrame(ctx: CanvasRenderingContext2D) {
  const { width, height, arcCenter, arcRadius, shooter } = TABLE;
  const [left, right] = TABLE.flippers;
  ctx.fillStyle = COLORS.frame;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, arcCenter.y);
  ctx.arc(arcCenter.x, arcCenter.y, arcRadius, Math.PI, Math.PI * 2);
  ctx.lineTo(width, arcCenter.y);
  ctx.lineTo(width, 0);
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(0, arcCenter.y, 8, 366);
  ctx.fillRect(shooter.right, arcCenter.y, width - shooter.right, height - arcCenter.y);
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
  ctx.fillRect(shooter.left, shooter.floor - 180, shooter.right - shooter.left, height - shooter.floor + 180);
  ctx.strokeStyle = COLORS.frameEdge;
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, width - 1, height - 1);
}

function drawDecals(ctx: CanvasRenderingContext2D, state: PinballState) {
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = COLORS.title;
  ctx.font = `700 11px ${FONT}`;
  ctx.fillText("3D PINBALL", 185, 400);
  ctx.font = `700 22px ${FONT}`;
  ctx.fillText("SPACE CADET", 185, 422);
  ctx.font = `700 12px ${FONT}`;
  for (let level = 2; level <= MAX_MULTIPLIER; level += 1) {
    ctx.fillStyle = state.multiplier >= level ? COLORS.multiplierOn : COLORS.multiplierOff;
    ctx.fillText(`${level}×`, 140 + (level - 2) * 30, 500);
  }
  TABLE.lanes.forEach((lane, index) => {
    const lit = state.lanes[index] === true || state.lanesFlash > 0;
    ctx.fillStyle = lit ? COLORS.laneOn : COLORS.laneOff;
    ctx.beginPath();
    ctx.arc(lane.x, lane.bottom + 16, 5.5, 0, Math.PI * 2);
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
  ctx.strokeStyle = COLORS.railGlow;
  ctx.lineWidth = 6;
  ctx.stroke();
  ctx.strokeStyle = COLORS.rail;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(TABLE.gate.a.x, TABLE.gate.a.y);
  ctx.lineTo(TABLE.gate.b.x, TABLE.gate.b.y);
  ctx.strokeStyle = state.inLane ? COLORS.gateOpen : COLORS.rail;
  ctx.setLineDash(state.inLane ? [4, 4] : []);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawTargets(ctx: CanvasRenderingContext2D, state: PinballState) {
  TABLE.targets.forEach((target, index) => {
    const up = state.targets[index] === true;
    ctx.beginPath();
    ctx.moveTo(target.a.x + (up ? 3.5 : 6), target.a.y + 2);
    ctx.lineTo(target.b.x + (up ? 3.5 : 6), target.b.y - 2);
    ctx.strokeStyle = up ? COLORS.target : COLORS.targetDown;
    ctx.lineWidth = up ? 7 : 2;
    ctx.lineCap = "butt";
    ctx.stroke();
  });
}

function drawSlingshots(ctx: CanvasRenderingContext2D, state: PinballState) {
  TABLE.slingshots.forEach((sling, index) => {
    const lit = (state.slingFlash[index] ?? 0) > 0;
    ctx.fillStyle = lit ? COLORS.slingLit : COLORS.sling;
    polygon(
      ctx,
      sling.corners.map((corner) => [corner.x, corner.y] as const),
    );
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
    const body = ctx.createRadialGradient(bumper.x - 5, bumper.y - 6, 2, bumper.x, bumper.y, bumper.radius);
    body.addColorStop(0, lit ? COLORS.bumperLit : COLORS.bumperCore);
    body.addColorStop(1, lit ? COLORS.bumperCore : COLORS.bumper);
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.arc(bumper.x, bumper.y, bumper.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = lit ? COLORS.bumperLit : COLORS.bumperRing;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = lit ? COLORS.bumperLit : COLORS.bumperRing;
    ctx.beginPath();
    ctx.arc(bumper.x, bumper.y, bumper.radius * 0.36, 0, Math.PI * 2);
    ctx.fill();
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
  ctx.fillStyle = COLORS.plunger;
  ctx.fillRect(shooter.left + 4, floor, shooter.right - shooter.left - 8, 7);
}

function drawLaunchHint(ctx: CanvasRenderingContext2D, time: number) {
  const center = (TABLE.shooter.left + TABLE.shooter.right) / 2;
  ctx.globalAlpha = 0.35 + 0.45 * (0.5 + 0.5 * Math.sin(time * 6));
  ctx.fillStyle = COLORS.arrow;
  for (const offset of [0, 26]) {
    polygon(ctx, [
      [center, 560 + offset],
      [center + 8, 572 + offset],
      [center - 8, 572 + offset],
    ]);
  }
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
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = COLORS.flipperEdge;
    ctx.beginPath();
    ctx.arc(pose.pivot.x, pose.pivot.y, 3, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawBall(ctx: CanvasRenderingContext2D, state: PinballState) {
  const { x, y } = state.ball;
  const radius = TABLE.ballRadius;
  const shine = ctx.createRadialGradient(x - 3, y - 3, 1, x, y, radius);
  shine.addColorStop(0, COLORS.ballLight);
  shine.addColorStop(0.55, COLORS.ballMid);
  shine.addColorStop(1, COLORS.ballDark);
  ctx.fillStyle = shine;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
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
  drawDecals(ctx, state);
  drawTargets(ctx, state);
  drawSlingshots(ctx, state);
  drawBumpers(ctx, state);
  drawRails(ctx, state);
  drawPlunger(ctx, state);
  if (awaitingLaunch(state)) drawLaunchHint(ctx, time);
  drawFlippers(ctx, state);
  if (state.status === "playing") drawBall(ctx, state);
  if (state.status === "over") drawOverlay(ctx, "GAME OVER", "Press F2 for a new game");
  else if (paused && !state.inLane) drawOverlay(ctx, "PAUSED", "Click the table to resume");
}

export function PinballGame() {
  const [initial] = useState(newGame);
  const bodyRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
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
      const scale = Math.max(0.05, Math.min(stage.clientWidth / TABLE.width, stage.clientHeight / TABLE.height));
      const cssWidth = Math.max(1, Math.floor(TABLE.width * scale));
      const cssHeight = Math.max(1, Math.floor(TABLE.height * scale));
      const ratio = window.devicePixelRatio || 1;
      canvas.style.width = `${cssWidth}px`;
      canvas.style.height = `${cssHeight}px`;
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
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * TABLE.width;
    const y = ((event.clientY - rect.top) / rect.height) * TABLE.height;
    const control: Control =
      x >= TABLE.shooter.left && y >= TABLE.shooter.floor - 180 ? "plunger" : x < TABLE.shooter.left / 2 ? "left" : "right";
    hold(event, control);
  };

  const over = hud.status === "over";
  const message = over
    ? "Game Over — F2 for a new game"
    : hud.awaiting
      ? "Press Space to launch"
      : !running
        ? "Paused — click the table to resume"
        : hud.multiplier > 1
          ? `Bonus ${hud.multiplier}× lit`
          : "Light all three top lanes";

  return (
    <div className="bbd-pinball">
      <div className="bbd-menubar bbd-pinball-toolbar">
        <button
          type="button"
          className="bbd-button bbd-bevel"
          title="New game (F2)"
          onClick={() => {
            startNewGame();
            bodyRef.current?.focus({ preventScroll: true });
          }}
        >
          New game
        </button>
        <span className="bbd-pinball-stat">
          Ball {hud.ballNumber} of {BALLS_PER_GAME}
        </span>
      </div>
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
        <aside className="bbd-pinball-panel" aria-label="Scoreboard">
          <div className="bbd-pinball-logo" aria-hidden>
            <span className="bbd-pinball-logo-small">3D Pinball</span>
            <span className="bbd-pinball-logo-big">Space Cadet</span>
          </div>
          <div className="bbd-pinball-readout">
            <div className="bbd-pinball-row">
              <span className="bbd-pinball-label">Ball</span>
              <span className="bbd-pinball-led bbd-pinball-led-small">{over ? "-" : hud.ballNumber}</span>
            </div>
            <div className="bbd-pinball-player">
              <span className="bbd-pinball-label">Player 1</span>
              <span className="bbd-pinball-led">{formatScore(hud.score)}</span>
            </div>
            <div className="bbd-pinball-row">
              <span className="bbd-pinball-label">Bonus</span>
              <span className="bbd-pinball-led bbd-pinball-led-small">{hud.multiplier}×</span>
            </div>
            <div className="bbd-pinball-row">
              <span className="bbd-pinball-label">High score</span>
              <span className="bbd-pinball-high">{formatScore(Math.max(highScore, hud.score))}</span>
            </div>
          </div>
          <p className="bbd-pinball-message" data-tone={over ? "over" : hud.awaiting ? "launch" : undefined}>
            {message}
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
          <dl id={helpId} className="bbd-pinball-keys">
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
