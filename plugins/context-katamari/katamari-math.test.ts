import { describe, expect, it } from "vitest";

import {
  BASE_RADIUS,
  contextFill,
  fillForRadius,
  formatKatamariSize,
  formatTokens,
  GROWTH,
  radiusForFill,
  scaleLevel,
} from "./katamari-math";

describe("context to katamari size", () => {
  it("clamps fill to the context window", () => {
    expect(contextFill(50, 100)).toBe(0.5);
    expect(contextFill(500, 100)).toBe(1);
    expect(contextFill(-5, 100)).toBe(0);
    expect(contextFill(10, 0)).toBe(0);
  });

  it("grows exponentially from an empty to a full window", () => {
    expect(radiusForFill(0)).toBeCloseTo(BASE_RADIUS);
    expect(radiusForFill(1)).toBeCloseTo(BASE_RADIUS * GROWTH);
    expect(radiusForFill(0.5)).toBeCloseTo(BASE_RADIUS * Math.sqrt(GROWTH));
  });

  it("round-trips fill through radius", () => {
    for (const fill of [0, 0.1, 0.42, 0.9, 1]) {
      expect(fillForRadius(radiusForFill(fill))).toBeCloseTo(fill);
    }
  });

  it("assigns one scale level per doubling", () => {
    expect(scaleLevel(BASE_RADIUS)).toBe(0);
    expect(scaleLevel(BASE_RADIUS * 2.1)).toBe(1);
    expect(scaleLevel(BASE_RADIUS * GROWTH)).toBe(5);
  });

  it("reads out sizes the way the game does", () => {
    expect(formatKatamariSize(radiusForFill(0))).toBe("5mm");
    expect(formatKatamariSize(radiusForFill(0.3))).toBe("7cm 9mm");
    expect(formatKatamariSize(radiusForFill(1))).toBe("50m 0cm");
  });

  it("abbreviates token counts", () => {
    expect(formatTokens(812)).toBe("812");
    expect(formatTokens(83_400)).toBe("83k");
    expect(formatTokens(1_000_000)).toBe("1.0M");
  });
});
