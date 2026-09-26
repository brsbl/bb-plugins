import { describe, expect, it } from "vitest";

import { driveFromKeys, IDLE_DRIVE, isIdle } from "./controls";

describe("driveFromKeys", () => {
  it("rolls forward and back with up and down", () => {
    expect(driveFromKeys(new Set(["ArrowUp"]))).toEqual({ forward: 1, turn: 0 });
    expect(driveFromKeys(new Set(["ArrowDown"]))).toEqual({ forward: -1, turn: 0 });
  });

  it("steers with left and right, alone or while rolling", () => {
    expect(driveFromKeys(new Set(["ArrowLeft"]))).toEqual({ forward: 0, turn: -1 });
    expect(driveFromKeys(new Set(["ArrowUp", "ArrowRight"]))).toEqual({ forward: 1, turn: 1 });
  });

  it("cancels opposite keys", () => {
    expect(isIdle(driveFromKeys(new Set(["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"])))).toBe(true);
  });

  it("ignores every other key", () => {
    expect(driveFromKeys(new Set(["KeyW", "Space"]))).toEqual(IDLE_DRIVE);
  });
});
