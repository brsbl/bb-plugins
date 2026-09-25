export interface Vec {
  x: number;
  y: number;
}

export interface Segment {
  a: Vec;
  b: Vec;
}

export interface Circle {
  x: number;
  y: number;
  radius: number;
}

export interface FlipperSpec {
  side: "left" | "right";
  pivot: Vec;
  length: number;
  baseRadius: number;
  tipRadius: number;
  restAngle: number;
  activeAngle: number;
}

export interface Slingshot {
  corners: readonly [Vec, Vec, Vec];
  kicker: Segment;
}

export interface RolloverLane {
  x: number;
  top: number;
  bottom: number;
  halfWidth: number;
}

export interface ShooterLane {
  left: number;
  right: number;
  floor: number;
  travel: number;
}

export interface Table {
  width: number;
  height: number;
  ballRadius: number;
  gravity: number;
  arcCenter: Vec;
  arcRadius: number;
  walls: readonly Segment[];
  gate: Segment;
  shooter: ShooterLane;
  bumpers: readonly Circle[];
  slingshots: readonly Slingshot[];
  lanes: readonly RolloverLane[];
  targets: readonly Segment[];
  flippers: readonly [FlipperSpec, FlipperSpec];
  drainY: number;
}

export type Nudge = "left" | "right" | "up";

export interface PinballInput {
  leftFlipper: boolean;
  rightFlipper: boolean;
  plunger: boolean;
  nudge: Nudge | null;
}

export interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export type PinballStatus = "playing" | "over";

export interface PinballState {
  status: PinballStatus;
  ball: Ball;
  inLane: boolean;
  ballNumber: number;
  score: number;
  multiplier: number;
  flipperAngles: number[];
  flipperSpeeds: number[];
  plunger: number;
  lanes: boolean[];
  laneInside: number;
  lanesFlash: number;
  targets: boolean[];
  targetsReset: number;
  bumperFlash: number[];
  slingFlash: number[];
  nudgeCooldown: number;
  held: { left: boolean; right: boolean };
  accumulator: number;
}

export const BALLS_PER_GAME = 3;
export const SUBSTEP = 1 / 480;
export const MAX_SPEED = 2400;
export const MAX_MULTIPLIER = 5;

export const POINTS = {
  bumper: 100,
  slingshot: 50,
  lane: 250,
  lanesComplete: 1000,
  target: 500,
  targetsComplete: 5000,
} as const;

const MAX_FRAME = 0.1;
const WALL_RESTITUTION = 0.45;
const FLIPPER_RESTITUTION = 0.3;
const BUMPER_RESTITUTION = 0.5;
const BUMPER_KICK = 650;
const SLING_KICK = 520;
const SLING_TRIGGER = 60;
const REST_THRESHOLD = 30;
const FLIPPER_UP_SPEED = 24;
const FLIPPER_DOWN_SPEED = 16;
const PLUNGER_CHARGE_SECONDS = 1;
const LAUNCH_MIN = 1250;
const LAUNCH_MAX = 2150;
const NUDGE_COOLDOWN = 0.5;
const NUDGE_IMPULSE = 150;
const FLASH_SECONDS = 0.14;
const LANES_FLASH_SECONDS = 0.7;
const TARGETS_RESET_SECONDS = 1.2;
const DRAG_PER_SECOND = 0.12;

function arc(center: Vec, radius: number, from: number, to: number, pieces: number): Segment[] {
  const points = Array.from({ length: pieces + 1 }, (_, index) => {
    const angle = from + ((to - from) * index) / pieces;
    return { x: center.x + radius * Math.cos(angle), y: center.y + radius * Math.sin(angle) };
  });
  return points.slice(1).map((point, index) => ({ a: points[index]!, b: point }));
}

function segment(ax: number, ay: number, bx: number, by: number): Segment {
  return { a: { x: ax, y: ay }, b: { x: bx, y: by } };
}

function slingshot(top: Vec, bottom: Vec, inner: Vec): Slingshot {
  return { corners: [top, bottom, inner], kicker: { a: top, b: inner } };
}

const LEFT_SLING = slingshot({ x: 48, y: 470 }, { x: 48, y: 540 }, { x: 96, y: 568 });
const RIGHT_SLING = slingshot({ x: 322, y: 470 }, { x: 322, y: 540 }, { x: 274, y: 568 });
const ARC_CENTER = { x: 200, y: 200 };
const ARC_RADIUS = 192;

export const TABLE: Table = {
  width: 400,
  height: 720,
  ballRadius: 9,
  gravity: 1300,
  arcCenter: ARC_CENTER,
  arcRadius: ARC_RADIUS,
  walls: [
    ...arc(ARC_CENTER, ARC_RADIUS, Math.PI, Math.PI * 2, 28),
    segment(8, 200, 8, 566),
    segment(8, 566, 111, 626),
    segment(362, 566, 259, 626),
    segment(362, 205, 362, 720),
    segment(392, 200, 392, 720),
    segment(125, 62, 125, 100),
    segment(165, 62, 165, 100),
    segment(205, 62, 205, 100),
    segment(245, 62, 245, 100),
    { a: LEFT_SLING.corners[0], b: LEFT_SLING.corners[1] },
    { a: LEFT_SLING.corners[1], b: LEFT_SLING.corners[2] },
    { a: RIGHT_SLING.corners[0], b: RIGHT_SLING.corners[1] },
    { a: RIGHT_SLING.corners[1], b: RIGHT_SLING.corners[2] },
  ],
  gate: segment(362, 205, 392, 177),
  shooter: { left: 362, right: 392, floor: 690, travel: 26 },
  bumpers: [
    { x: 135, y: 215, radius: 22 },
    { x: 235, y: 215, radius: 22 },
    { x: 185, y: 290, radius: 22 },
  ],
  slingshots: [LEFT_SLING, RIGHT_SLING],
  lanes: [
    { x: 145, top: 62, bottom: 100, halfWidth: 20 },
    { x: 185, top: 62, bottom: 100, halfWidth: 20 },
    { x: 225, top: 62, bottom: 100, halfWidth: 20 },
  ],
  targets: [segment(346, 300, 346, 328), segment(346, 336, 346, 364), segment(346, 372, 346, 400)],
  flippers: [
    { side: "left", pivot: { x: 111, y: 626 }, length: 62, baseRadius: 9, tipRadius: 5, restAngle: 0.52, activeAngle: -0.38 },
    {
      side: "right",
      pivot: { x: 259, y: 626 },
      length: 62,
      baseRadius: 9,
      tipRadius: 5,
      restAngle: Math.PI - 0.52,
      activeAngle: Math.PI + 0.38,
    },
  ],
  drainY: 760,
};

function laneRestBall(): Ball {
  return {
    x: (TABLE.shooter.left + TABLE.shooter.right) / 2,
    y: TABLE.shooter.floor - TABLE.ballRadius,
    vx: 0,
    vy: 0,
  };
}

export function newGame(): PinballState {
  return {
    status: "playing",
    ball: laneRestBall(),
    inLane: true,
    ballNumber: 1,
    score: 0,
    multiplier: 1,
    flipperAngles: TABLE.flippers.map((flipper) => flipper.restAngle),
    flipperSpeeds: [0, 0],
    plunger: 0,
    lanes: [false, false, false],
    laneInside: -1,
    lanesFlash: 0,
    targets: [true, true, true],
    targetsReset: 0,
    bumperFlash: [0, 0, 0],
    slingFlash: [0, 0],
    nudgeCooldown: 0,
    held: { left: false, right: false },
    accumulator: 0,
  };
}

function clone(state: PinballState): PinballState {
  return {
    ...state,
    ball: { ...state.ball },
    flipperAngles: [...state.flipperAngles],
    flipperSpeeds: [...state.flipperSpeeds],
    lanes: [...state.lanes],
    targets: [...state.targets],
    bumperFlash: [...state.bumperFlash],
    slingFlash: [...state.slingFlash],
    held: { ...state.held },
  };
}

export function plungerFloor(state: Pick<PinballState, "plunger">): number {
  return TABLE.shooter.floor + TABLE.shooter.travel * state.plunger;
}

export function awaitingLaunch(state: PinballState): boolean {
  return (
    state.status === "playing" &&
    state.inLane &&
    Math.abs(state.ball.vy) < 20 &&
    state.ball.y >= plungerFloor(state) - TABLE.ballRadius - 3
  );
}

export interface FlipperPose {
  pivot: Vec;
  tip: Vec;
  angle: number;
  baseRadius: number;
  tipRadius: number;
}

export function flipperPose(state: PinballState, index: number): FlipperPose {
  const spec = TABLE.flippers[index]!;
  const angle = state.flipperAngles[index]!;
  return {
    pivot: spec.pivot,
    tip: { x: spec.pivot.x + Math.cos(angle) * spec.length, y: spec.pivot.y + Math.sin(angle) * spec.length },
    angle,
    baseRadius: spec.baseRadius,
    tipRadius: spec.tipRadius,
  };
}

function award(state: PinballState, points: number) {
  state.score += points * state.multiplier;
}

function resolve(
  state: PinballState,
  nx: number,
  ny: number,
  penetration: number,
  ux: number,
  uy: number,
  restitution: number,
): number {
  const ball = state.ball;
  ball.x += nx * penetration;
  ball.y += ny * penetration;
  const normalSpeed = (ball.vx - ux) * nx + (ball.vy - uy) * ny;
  if (normalSpeed >= 0) return 0;
  const bounce = -normalSpeed < REST_THRESHOLD ? 0 : restitution;
  ball.vx -= (1 + bounce) * normalSpeed * nx;
  ball.vy -= (1 + bounce) * normalSpeed * ny;
  return -normalSpeed;
}

interface Contact {
  nx: number;
  ny: number;
  penetration: number;
}

function touchSegment(ball: Ball, a: Vec, b: Vec, thickness: number): Contact | null {
  const abx = b.x - a.x;
  const aby = b.y - a.y;
  const lengthSquared = abx * abx + aby * aby;
  const t =
    lengthSquared === 0 ? 0 : Math.max(0, Math.min(1, ((ball.x - a.x) * abx + (ball.y - a.y) * aby) / lengthSquared));
  const dx = ball.x - (a.x + abx * t);
  const dy = ball.y - (a.y + aby * t);
  const reach = TABLE.ballRadius + thickness;
  const distanceSquared = dx * dx + dy * dy;
  if (distanceSquared >= reach * reach) return null;
  const distance = Math.sqrt(distanceSquared);
  if (distance > 1e-6) return { nx: dx / distance, ny: dy / distance, penetration: reach - distance };
  const length = Math.sqrt(lengthSquared) || 1;
  return { nx: -aby / length, ny: abx / length, penetration: reach };
}

function collideSegment(state: PinballState, wall: Segment, restitution: number): number {
  const contact = touchSegment(state.ball, wall.a, wall.b, 0);
  if (contact === null) return -1;
  return resolve(state, contact.nx, contact.ny, contact.penetration, 0, 0, restitution);
}

function collideFlipper(state: PinballState, index: number) {
  const spec = TABLE.flippers[index]!;
  const angle = state.flipperAngles[index]!;
  const omega = state.flipperSpeeds[index]!;
  const ball = state.ball;
  const dx = Math.cos(angle) * spec.length;
  const dy = Math.sin(angle) * spec.length;
  const t = Math.max(0, Math.min(1, ((ball.x - spec.pivot.x) * dx + (ball.y - spec.pivot.y) * dy) / (spec.length * spec.length)));
  const cx = spec.pivot.x + dx * t;
  const cy = spec.pivot.y + dy * t;
  const radius = spec.baseRadius + (spec.tipRadius - spec.baseRadius) * t;
  const reach = TABLE.ballRadius + radius;
  const ox = ball.x - cx;
  const oy = ball.y - cy;
  const distanceSquared = ox * ox + oy * oy;
  if (distanceSquared >= reach * reach) return;
  const distance = Math.sqrt(distanceSquared);
  let nx = distance > 1e-6 ? ox / distance : Math.sin(angle);
  let ny = distance > 1e-6 ? oy / distance : -Math.cos(angle);
  if (distance <= 1e-6 && ny > 0) {
    nx = -nx;
    ny = -ny;
  }
  const qx = cx + nx * radius;
  const qy = cy + ny * radius;
  const ux = -omega * (qy - spec.pivot.y);
  const uy = omega * (qx - spec.pivot.x);
  resolve(state, nx, ny, reach - distance, ux, uy, FLIPPER_RESTITUTION);
}

function collideBumper(state: PinballState, index: number) {
  const bumper = TABLE.bumpers[index]!;
  const ball = state.ball;
  const dx = ball.x - bumper.x;
  const dy = ball.y - bumper.y;
  const reach = bumper.radius + TABLE.ballRadius;
  const distanceSquared = dx * dx + dy * dy;
  if (distanceSquared >= reach * reach) return;
  const distance = Math.sqrt(distanceSquared) || 1;
  const nx = dx / distance;
  const ny = dy / distance;
  const impact = resolve(state, nx, ny, reach - distance, 0, 0, BUMPER_RESTITUTION);
  if (impact <= 0) return;
  const outward = ball.vx * nx + ball.vy * ny;
  if (outward < BUMPER_KICK) {
    ball.vx += nx * (BUMPER_KICK - outward);
    ball.vy += ny * (BUMPER_KICK - outward);
  }
  state.bumperFlash[index] = FLASH_SECONDS;
  award(state, POINTS.bumper);
}

function collideSlingshot(state: PinballState, index: number) {
  const sling = TABLE.slingshots[index]!;
  const contact = touchSegment(state.ball, sling.kicker.a, sling.kicker.b, 0);
  if (contact === null) return;
  const impact = resolve(state, contact.nx, contact.ny, contact.penetration, 0, 0, WALL_RESTITUTION);
  if (impact < SLING_TRIGGER) return;
  state.ball.vx += contact.nx * SLING_KICK;
  state.ball.vy += contact.ny * SLING_KICK;
  state.slingFlash[index] = FLASH_SECONDS;
  award(state, POINTS.slingshot);
}

function collideTarget(state: PinballState, index: number) {
  if (!state.targets[index]) return;
  const target = TABLE.targets[index]!;
  if (state.ball.x >= target.a.x) return;
  if (collideSegment(state, target, WALL_RESTITUTION) <= 0) return;
  state.targets[index] = false;
  award(state, POINTS.target);
  if (state.targets.every((up) => !up)) {
    award(state, POINTS.targetsComplete);
    state.targetsReset = TARGETS_RESET_SECONDS;
  }
}

function updateFlippers(state: PinballState, input: PinballInput, h: number) {
  TABLE.flippers.forEach((spec, index) => {
    const pressed = state.status === "playing" && (index === 0 ? input.leftFlipper : input.rightFlipper);
    const target = pressed ? spec.activeAngle : spec.restAngle;
    const current = state.flipperAngles[index]!;
    const speed = pressed ? FLIPPER_UP_SPEED : FLIPPER_DOWN_SPEED;
    const delta = Math.max(-speed * h, Math.min(speed * h, target - current));
    state.flipperAngles[index] = current + delta;
    state.flipperSpeeds[index] = delta / h;
  });
}

function updatePlunger(state: PinballState, input: PinballInput, h: number) {
  if (input.plunger && state.status === "playing") {
    state.plunger = Math.min(1, state.plunger + h / PLUNGER_CHARGE_SECONDS);
    return;
  }
  if (state.plunger === 0) return;
  const ball = state.ball;
  if (state.inLane && ball.y >= plungerFloor(state) - TABLE.ballRadius - 6) {
    ball.y = TABLE.shooter.floor - TABLE.ballRadius;
    ball.vx = 0;
    ball.vy = -(LAUNCH_MIN + (LAUNCH_MAX - LAUNCH_MIN) * state.plunger);
  }
  state.plunger = 0;
}

function updateLanes(state: PinballState) {
  const ball = state.ball;
  const inside = TABLE.lanes.findIndex(
    (lane) => Math.abs(ball.x - lane.x) < lane.halfWidth && ball.y >= lane.top && ball.y <= lane.bottom,
  );
  if (inside !== -1 && inside !== state.laneInside) {
    state.lanes[inside] = true;
    award(state, POINTS.lane);
    if (state.lanes.every(Boolean)) {
      award(state, POINTS.lanesComplete);
      state.multiplier = Math.min(MAX_MULTIPLIER, state.multiplier + 1);
      state.lanes = state.lanes.map(() => false);
      state.lanesFlash = LANES_FLASH_SECONDS;
    }
  }
  state.laneInside = inside;
}

function drain(state: PinballState) {
  if (state.ballNumber >= BALLS_PER_GAME) {
    state.status = "over";
    state.ball.vx = 0;
    state.ball.vy = 0;
    state.plunger = 0;
    return;
  }
  state.ballNumber += 1;
  state.multiplier = 1;
  state.lanes = state.lanes.map(() => false);
  state.laneInside = -1;
  state.ball = laneRestBall();
  state.inLane = true;
  state.plunger = 0;
}

function tickTimers(state: PinballState, h: number) {
  state.bumperFlash = state.bumperFlash.map((value) => Math.max(0, value - h));
  state.slingFlash = state.slingFlash.map((value) => Math.max(0, value - h));
  state.lanesFlash = Math.max(0, state.lanesFlash - h);
  state.nudgeCooldown = Math.max(0, state.nudgeCooldown - h);
  if (state.targetsReset > 0) {
    state.targetsReset = Math.max(0, state.targetsReset - h);
    if (state.targetsReset === 0) state.targets = state.targets.map(() => true);
  }
}

function moveBall(state: PinballState, h: number) {
  const ball = state.ball;
  const speed = Math.hypot(ball.vx, ball.vy);
  if (speed > MAX_SPEED) {
    ball.vx *= MAX_SPEED / speed;
    ball.vy *= MAX_SPEED / speed;
  }
  const drag = 1 - DRAG_PER_SECOND * h;
  ball.vx *= drag;
  ball.vy = ball.vy * drag + TABLE.gravity * h;
  ball.x += ball.vx * h;
  ball.y += ball.vy * h;
}

function substep(state: PinballState, input: PinballInput, h: number) {
  tickTimers(state, h);
  updateFlippers(state, input, h);
  if (state.status !== "playing") return;
  updatePlunger(state, input, h);
  moveBall(state, h);
  for (const wall of TABLE.walls) collideSegment(state, wall, WALL_RESTITUTION);
  if (!state.inLane) collideSegment(state, TABLE.gate, WALL_RESTITUTION);
  if (state.inLane) {
    const floor = plungerFloor(state);
    collideSegment(state, segment(TABLE.shooter.left, floor, TABLE.shooter.right, floor), 0.2);
  }
  TABLE.targets.forEach((_, index) => collideTarget(state, index));
  TABLE.slingshots.forEach((_, index) => collideSlingshot(state, index));
  TABLE.bumpers.forEach((_, index) => collideBumper(state, index));
  TABLE.flippers.forEach((_, index) => collideFlipper(state, index));
  if (state.inLane && state.ball.y + TABLE.ballRadius < TABLE.gate.b.y) state.inLane = false;
  updateLanes(state);
  if (state.ball.y > TABLE.drainY || !Number.isFinite(state.ball.x + state.ball.y)) drain(state);
}

function rotateLanes(state: PinballState, input: PinballInput) {
  if (state.status !== "playing") return;
  const [first, second, third] = state.lanes;
  if (input.leftFlipper && !state.held.left) state.lanes = [second!, third!, first!];
  if (input.rightFlipper && !state.held.right) state.lanes = [third!, first!, second!];
}

function applyNudge(state: PinballState, nudge: Nudge | null) {
  if (nudge === null || state.status !== "playing" || state.inLane || state.nudgeCooldown > 0) return;
  if (nudge === "left") state.ball.vx -= NUDGE_IMPULSE;
  if (nudge === "right") state.ball.vx += NUDGE_IMPULSE;
  state.ball.vy -= nudge === "up" ? NUDGE_IMPULSE * 1.2 : NUDGE_IMPULSE * 0.3;
  state.nudgeCooldown = NUDGE_COOLDOWN;
}

export function step(state: PinballState, input: PinballInput, dt: number): PinballState {
  const next = clone(state);
  rotateLanes(next, input);
  applyNudge(next, input.nudge);
  next.held = { left: input.leftFlipper, right: input.rightFlipper };
  next.accumulator = Math.min(MAX_FRAME, state.accumulator + (Number.isFinite(dt) ? Math.max(0, dt) : 0));
  while (next.accumulator >= SUBSTEP) {
    substep(next, input, SUBSTEP);
    next.accumulator -= SUBSTEP;
  }
  return next;
}
