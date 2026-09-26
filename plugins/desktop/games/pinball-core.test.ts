import { describe, expect, it } from "vitest";

import {
  BALLS_PER_GAME,
  POINTS,
  TABLE,
  newGame,
  step,
  type Ball,
  type PinballInput,
  type PinballState,
} from "./pinball-core";

const idle: PinballInput = { leftFlipper: false, rightFlipper: false, plunger: false, nudge: null };

function run(
  state: PinballState,
  input: PinballInput,
  seconds: number,
  observe: (state: PinballState) => void = () => {},
): PinballState {
  let current = state;
  for (let frame = 0; frame < Math.round(seconds * 60); frame += 1) {
    current = step(current, input, 1 / 60);
    observe(current);
  }
  return current;
}

function inPlay(ball: Ball, base: PinballState = newGame()): PinballState {
  return { ...base, inLane: false, ball };
}

describe("pinball", () => {
  it("launches a charged ball out of the shooter lane and into the table", () => {
    const charged = run(newGame(), { ...idle, plunger: true }, 1.2);
    expect(charged.plunger).toBe(1);
    let minX = Infinity;
    let minY = Infinity;
    let leftLane = false;
    run(charged, idle, 1.5, (state) => {
      minX = Math.min(minX, state.ball.x);
      minY = Math.min(minY, state.ball.y);
      if (!state.inLane) leftLane = true;
    });
    expect(leftLane).toBe(true);
    expect(minY).toBeLessThan(TABLE.gate.b.y);
    expect(minX).toBeLessThan(TABLE.shooter.left - 20);
  });

  it("keeps a very fast ball from tunnelling through a raised flipper", () => {
    const raised = run(newGame(), { ...idle, leftFlipper: true }, 0.1);
    let maxY = -Infinity;
    const after = run(inPlay({ x: 150, y: 480, vx: 0, vy: 5000 }, raised), { ...idle, leftFlipper: true }, 0.15, (state) => {
      maxY = Math.max(maxY, state.ball.y);
    });
    expect(maxY).toBeLessThan(TABLE.flippers[0].pivot.y - 15);
    expect(after.ballNumber).toBe(1);
  });

  it("keeps a very fast ball from tunnelling through a wall", () => {
    let minX = Infinity;
    const after = run(inPlay({ x: 100, y: 400, vx: -9000, vy: 0 }), idle, 0.2, (state) => {
      minX = Math.min(minX, state.ball.x);
    });
    expect(minX).toBeGreaterThan(16);
    expect(after.ball.vx).toBeGreaterThan(0);
  });

  it.each([0, 1])("rolls past flipper %i's pivot instead of lodging against its guide rail", (index) => {
    const direction = index === 0 ? 1 : -1;
    const pivot = TABLE.flippers[index]!.pivot;
    // Position observed after a real game settled in the old rail/pivot pocket.
    const trapped = inPlay({ x: pivot.x - direction * 8.94, y: pivot.y - 15.62, vx: 0, vy: 0 });
    let progress = 0;
    run(trapped, idle, 1, (state) => {
      if (!state.inLane) progress = Math.max(progress, direction * (state.ball.x - pivot.x));
    });
    expect(progress).toBeGreaterThan(20);
  });

  it("drains an idle ball between the flippers and serves the next ball", () => {
    const after = run(inPlay({ x: 185, y: 450, vx: 0, vy: 0 }), idle, 1.5);
    expect(after.status).toBe("playing");
    expect(after.ballNumber).toBe(2);
    expect(after.inLane).toBe(true);
    expect(after.ball.x).toBeGreaterThan(TABLE.shooter.left);
  });

  it("ends the game when the last ball drains and then ignores input", () => {
    const last = { ...inPlay({ x: 185, y: 450, vx: 0, vy: 0 }), ballNumber: BALLS_PER_GAME, score: 1200 };
    const over = run(last, idle, 1.5);
    expect(over.status).toBe("over");
    expect(over.ballNumber).toBe(BALLS_PER_GAME);
    const later = run(over, { leftFlipper: true, rightFlipper: true, plunger: true, nudge: "up" }, 1);
    expect(later.status).toBe("over");
    expect(later.score).toBe(1200);
    expect(later.ballNumber).toBe(BALLS_PER_GAME);
  });

  it("scores and kicks the ball away when it hits a bumper", () => {
    const bumper = TABLE.bumpers[2]!;
    const after = run(inPlay({ x: bumper.x, y: bumper.y - bumper.radius - TABLE.ballRadius - 8, vx: 0, vy: 400 }), idle, 0.04);
    expect(after.score).toBe(POINTS.bumper);
    expect(after.bumperFlash[2]).toBeGreaterThan(0);
    expect(after.ball.vy).toBeLessThan(0);
  });

  it.each([0, 1, 2, 4, 5, 6])("scores a contact with attack/return bumper %i", (index) => {
    const bumper = TABLE.bumpers[index]!;
    const after = run(inPlay({ x: bumper.x, y: bumper.y - bumper.radius - TABLE.ballRadius - 4, vx: 0, vy: 350 }), idle, 1 / 60);
    expect(after.bumperFlash[index]).toBeGreaterThan(0);
    expect(after.score).toBeGreaterThanOrEqual(POINTS.bumper);
    expect(Number.isFinite(after.ball.x + after.ball.y + after.ball.vx + after.ball.vy)).toBe(true);
  });

  it("keeps a full launch inside the flattened upper orbit", () => {
    const charged = run(newGame(), { ...idle, plunger: true }, 1.2);
    run(charged, idle, 5, (state) => {
      expect(state.ball.x).toBeGreaterThanOrEqual(0);
      expect(state.ball.x).toBeLessThanOrEqual(TABLE.width);
      expect(state.ball.y).toBeGreaterThanOrEqual(0);
    });
  });

  it("sends a falling ball back up when the flipper swings into it", () => {
    const flipper = TABLE.flippers[0];
    const along = 40;
    const t = along / flipper.length;
    const radius = flipper.baseRadius + (flipper.tipRadius - flipper.baseRadius) * t;
    const angle = flipper.restAngle;
    const gap = radius + TABLE.ballRadius + 3;
    const ball = {
      x: flipper.pivot.x + Math.cos(angle) * along + Math.sin(angle) * gap,
      y: flipper.pivot.y + Math.sin(angle) * along - Math.cos(angle) * gap,
      vx: 0,
      vy: 300,
    };
    const after = run(inPlay(ball), { ...idle, leftFlipper: true }, 0.08);
    expect(after.ball.vy).toBeLessThan(-400);
    expect(after.ballNumber).toBe(1);
  });

  it("drops a target once and scores it", () => {
    const after = run(inPlay({ x: 320, y: 314, vx: 700, vy: 0 }), idle, 0.1);
    expect(after.targets).toEqual([false, true, true]);
    expect(after.score).toBe(POINTS.target);
    expect(after.ball.vx).toBeLessThan(0);
  });

  it("raises the multiplier when every rollover lane is lit", () => {
    let state = newGame();
    for (const lane of TABLE.lanes) {
      state = run(inPlay({ x: lane.x, y: 50, vx: 0, vy: 100 }, state), idle, 0.15);
    }
    expect(state.multiplier).toBe(2);
    expect(state.lanes).toEqual([false, false, false]);
    expect(state.score).toBe(POINTS.lane * 3 + POINTS.lanesComplete);
  });
});
