import { describe, expect, it } from "vitest";

import {
  DEFAULT_POINTS,
  MAX_POINTS,
  MESH_STYLE_NAMES,
  MIN_POINTS,
  applyBaseColor,
  clampPointCount,
  colorPointFromBase,
  contrastRatio,
  contrastReportFor,
  generateFromColor,
  generateMeshGradient,
  hexToHsl,
  hslToHex,
  nameFor,
  newPointAt,
  normalizeSeed,
  relativeLuminance,
  toCss,
  toCssLayers,
  toSvg,
} from "./gradient.js";

describe("mesh gradient generation", () => {
  it("is deterministic for a given seed, point count, and style", () => {
    const first = generateMeshGradient({ seed: 42, pointCount: 6, style: "ocean" });
    const second = generateMeshGradient({ seed: 42, pointCount: 6, style: "ocean" });
    expect(second).toEqual(first);
    expect(toCss(second)).toBe(toCss(first));
    expect(nameFor(second)).toBe(nameFor(first));
  });

  it("produces different gradients for different seeds", () => {
    const first = generateMeshGradient({ seed: 1 });
    const second = generateMeshGradient({ seed: 2 });
    expect(toCss(first)).not.toBe(toCss(second));
  });

  it("keeps every point inside the canvas with valid color channels", () => {
    for (const style of MESH_STYLE_NAMES) {
      const spec = generateMeshGradient({
        seed: 7,
        pointCount: MAX_POINTS,
        style,
        ...(style === "custom" ? { customColor: "#3366ff" } : {}),
      });
      expect(spec.points).toHaveLength(MAX_POINTS);
      for (const point of spec.points) {
        expect(point.x).toBeGreaterThanOrEqual(0);
        expect(point.x).toBeLessThanOrEqual(100);
        expect(point.y).toBeGreaterThanOrEqual(0);
        expect(point.y).toBeLessThanOrEqual(100);
        expect(point.hue).toBeGreaterThanOrEqual(0);
        expect(point.hue).toBeLessThan(360);
        expect(point.saturation).toBeGreaterThanOrEqual(0);
        expect(point.saturation).toBeLessThanOrEqual(100);
        expect(point.lightness).toBeGreaterThanOrEqual(0);
        expect(point.lightness).toBeLessThanOrEqual(100);
      }
    }
  });

  it("keeps mono gradients within a narrow hue band", () => {
    const spec = generateMeshGradient({ seed: 99, pointCount: MAX_POINTS, style: "mono" });
    const hues = spec.points.map((point) => point.hue);
    const spread = hues.map((hue) => {
      const delta = Math.abs(hue - hues[0]);
      return Math.min(delta, 360 - delta);
    });
    expect(Math.max(...spread)).toBeLessThanOrEqual(32);
  });

  it("clamps point counts and normalizes seeds", () => {
    expect(clampPointCount(0)).toBe(MIN_POINTS);
    expect(clampPointCount(100)).toBe(MAX_POINTS);
    expect(clampPointCount(Number.NaN)).toBe(DEFAULT_POINTS);
    expect(normalizeSeed(-5.7)).toBe(5);
    expect(normalizeSeed(2 ** 33 + 3)).toBe(3);
    expect(() => normalizeSeed(Number.POSITIVE_INFINITY)).toThrow();
    expect(() => generateMeshGradient({ seed: 1, style: "plaid" as never })).toThrow(
      /unknown style/,
    );
  });

  it("emits one CSS radial-gradient layer per point", () => {
    const spec = generateMeshGradient({ seed: 11, pointCount: 4 });
    const layers = toCssLayers(spec);
    expect(layers.backgroundImage.match(/radial-gradient\(/g)).toHaveLength(4);
    expect(layers.backgroundColor).toMatch(/^hsl\(/);
    expect(toCss(spec)).toContain(`background-color: ${layers.backgroundColor};`);
  });

  it("round-trips point colors through hex", () => {
    const spec = generateMeshGradient({ seed: 21, style: "candy" });
    for (const point of spec.points) {
      const hex = hslToHex(point.hue, point.saturation, point.lightness);
      expect(hex).toMatch(/^#[0-9a-f]{6}$/);
      const back = hexToHsl(hex);
      const hueDelta = Math.abs(back.hue - point.hue);
      expect(Math.min(hueDelta, 360 - hueDelta)).toBeLessThanOrEqual(1.5);
      expect(Math.abs(back.saturation - point.saturation)).toBeLessThanOrEqual(1.5);
      expect(Math.abs(back.lightness - point.lightness)).toBeLessThanOrEqual(1.5);
    }
    expect(() => hexToHsl("#12")).toThrow(/invalid hex/);
  });

  it("adds palette-fitting points deterministically per position", () => {
    const spec = generateMeshGradient({ seed: 5, style: "forest" });
    const added = newPointAt(spec, 33, 66);
    expect(added).toEqual(newPointAt(spec, 33, 66));
    expect(added.x).toBe(33);
    expect(added.y).toBe(66);
    expect(added.hue).toBeGreaterThanOrEqual(0);
    expect(added.hue).toBeLessThan(360);
  });

  it("derives a custom gradient from a hex and keeps the color as provenance", () => {
    const spec = generateFromColor("#3366ff", { seed: 5 });
    expect(spec.style).toBe("custom");
    expect(spec.customColor).toBe("#3366ff");
    const { hue } = hexToHsl("#3366ff");
    for (const point of spec.points) {
      const delta = Math.abs(point.hue - hue);
      expect(Math.min(delta, 360 - delta)).toBeLessThanOrEqual(41);
    }
    expect(() => generateMeshGradient({ seed: 1, style: "custom" })).toThrow(
      /requires customColor/,
    );
  });

  it("recolors an existing layout from a base color, keeping every position", () => {
    const original = generateMeshGradient({ seed: 12, pointCount: 6, style: "forest" });
    const recolored = applyBaseColor(original.points, "#3366ff");
    expect(recolored).toHaveLength(original.points.length);
    for (const [index, point] of recolored.entries()) {
      expect(point.x).toBe(original.points[index].x);
      expect(point.y).toBe(original.points[index].y);
      expect(point.radius).toBe(original.points[index].radius);
    }
    // Re-applying must not compound: the transform reads position, not the
    // color already there.
    expect(applyBaseColor(recolored, "#3366ff")).toEqual(recolored);
  });

  it("varies each point by where it sits on the canvas", () => {
    const base = "#3366ff";
    const layout = [
      { x: 5, y: 50, hue: 0, saturation: 0, lightness: 0, radius: 60 },
      { x: 95, y: 50, hue: 0, saturation: 0, lightness: 0, radius: 60 },
      { x: 50, y: 5, hue: 0, saturation: 0, lightness: 0, radius: 60 },
      { x: 50, y: 95, hue: 0, saturation: 0, lightness: 0, radius: 60 },
      { x: 50, y: 50, hue: 0, saturation: 0, lightness: 0, radius: 60 },
    ];
    const [left, right, top, bottom, center] = applyBaseColor(layout, base);
    // Hue sweeps left to right.
    expect(right.hue).toBeGreaterThan(left.hue);
    // Lightness runs light at the top to deep at the bottom.
    expect(top.lightness).toBeGreaterThan(bottom.lightness);
    // Saturation is richest at the center and eases off toward the edges.
    expect(center.saturation).toBeGreaterThan(left.saturation);
    // Moving a point re-colors it consistently with its new home.
    expect(colorPointFromBase({ ...left, x: 95 }, base).hue).toBe(right.hue);
  });

  it("colors a point added to a custom gradient from the same base", () => {
    const spec = generateFromColor("#3366ff", { seed: 9 });
    const added = newPointAt(spec, 80, 20);
    expect(added).toMatchObject(
      colorPointFromBase({ ...added, x: 80, y: 20 }, "#3366ff"),
    );
  });

  it("tracks lightness and saturation of the picked color, not just its hue", () => {
    const pale = generateFromColor("#cfd8f5", { seed: 5 });
    const deep = generateFromColor("#0b1f6b", { seed: 5 });
    const muted = generateFromColor("#6b7280", { seed: 5 });
    const average = (spec: { points: { lightness: number; saturation: number }[] }) => ({
      lightness:
        spec.points.reduce((sum, point) => sum + point.lightness, 0) /
        spec.points.length,
      saturation:
        spec.points.reduce((sum, point) => sum + point.saturation, 0) /
        spec.points.length,
    });
    // Same seed and near-same hue: only the picked color's tone differs, so if
    // these matched, dragging the picker would look inert.
    expect(average(pale).lightness).toBeGreaterThan(average(deep).lightness + 20);
    expect(average(muted).saturation).toBeLessThan(average(deep).saturation);
    expect(toCss(pale)).not.toBe(toCss(deep));
  });

  it("scores contrast against the worst region for each text color", () => {
    // A near-white surface: white text fails, black text passes.
    const bright = contrastReportFor([0.9, 0.92, 0.95]);
    expect(bright.best).toBe("black");
    expect(bright.passesAA).toBe(true);
    const dark = contrastReportFor([0.02, 0.03]);
    expect(dark.best).toBe("white");
    expect(dark.passesAA).toBe(true);
    // A gradient spanning mid luminances is the case worth flagging: neither
    // text color clears AA against both ends of the range.
    const wideRange = contrastReportFor([0.09, 0.35]);
    expect(wideRange.passesAA).toBe(false);
    expect(wideRange.passesAALarge).toBe(false);
    const borderline = contrastReportFor([0.1, 0.3]);
    expect(borderline.passesAA).toBe(false);
    expect(borderline.passesAALarge).toBe(true);
    expect(relativeLuminance(255, 255, 255)).toBeCloseTo(1, 5);
    expect(relativeLuminance(0, 0, 0)).toBeCloseTo(0, 5);
    expect(contrastRatio(1, 0)).toBeCloseTo(21, 5);
  });

  it("emits standalone SVG with a gradient def and rect per point", () => {
    const spec = generateMeshGradient({ seed: 13, pointCount: 5 });
    const svg = toSvg(spec, { width: 400, height: 300 });
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
    expect(svg).toContain('viewBox="0 0 400 300"');
    expect(svg.match(/<radialGradient /g)).toHaveLength(5);
    expect(svg.match(/fill="url\(#mesh-13-/g)).toHaveLength(5);
  });
});
