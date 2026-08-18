export const MESH_STYLE_NAMES = [
  "aurora",
  "sunset",
  "ocean",
  "candy",
  "forest",
  "mono",
  "custom",
] as const;

export type MeshStyleName = (typeof MESH_STYLE_NAMES)[number];

export const MIN_POINTS = 3;
export const MAX_POINTS = 8;
export const DEFAULT_POINTS = 5;
/** Hand-editing may add points beyond what the generator produces. */
export const EDIT_MAX_POINTS = 12;
export const MIN_RADIUS = 20;
export const MAX_RADIUS = 120;

export interface MeshPoint {
  x: number;
  y: number;
  hue: number;
  saturation: number;
  lightness: number;
  radius: number;
}

/**
 * Points are the source of truth. seed and style are provenance: they record
 * how the gradient was first generated, name it, and keep SVG ids stable —
 * but once a gradient is hand-edited its points no longer derive from them.
 * customColor (hex) is required by the "custom" style and ignored otherwise.
 */
export interface MeshGradientSpec {
  seed: number;
  style: MeshStyleName;
  points: MeshPoint[];
  customColor?: string;
}

interface StyleRanges {
  hue: readonly [number, number];
  saturation: readonly [number, number];
  lightness: readonly [number, number];
}

const STYLE_RANGES: Record<
  Exclude<MeshStyleName, "mono" | "custom">,
  StyleRanges
> = {
  aurora: { hue: [140, 320], saturation: [70, 95], lightness: [52, 70] },
  sunset: { hue: [-30, 55], saturation: [75, 98], lightness: [55, 72] },
  ocean: { hue: [165, 260], saturation: [60, 92], lightness: [48, 68] },
  candy: { hue: [280, 430], saturation: [70, 100], lightness: [64, 80] },
  forest: { hue: [70, 170], saturation: [45, 80], lightness: [40, 62] },
};

const CORNER_ANCHORS: ReadonlyArray<readonly [number, number]> = [
  [10, 12],
  [90, 10],
  [12, 88],
  [88, 90],
];

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function between(random: () => number, range: readonly [number, number]): number {
  return range[0] + random() * (range[1] - range[0]);
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function normalizeSeed(seed: number): number {
  if (!Number.isFinite(seed)) throw new Error("seed must be a finite number");
  return Math.abs(Math.trunc(seed)) % 4294967296;
}

export function clampPointCount(pointCount: number): number {
  if (!Number.isFinite(pointCount)) return DEFAULT_POINTS;
  return Math.min(MAX_POINTS, Math.max(MIN_POINTS, Math.trunc(pointCount)));
}

export function randomSeed(): number {
  return Math.floor(Math.random() * 4294967296);
}

function styleRangesFor(
  style: MeshStyleName,
  random: () => number,
  customColor?: string,
): StyleRanges {
  const monoBaseHue = random() * 360;
  if (style === "mono") {
    return {
      hue: [monoBaseHue - 16, monoBaseHue + 16],
      saturation: [55, 85],
      lightness: [42, 74],
    };
  }
  if (style === "custom") {
    // Scratch values only — custom point colors are overwritten by
    // applyBaseColor, which derives them from position instead of randomness.
    return STYLE_RANGES.aurora;
  }
  return STYLE_RANGES[style];
}

/**
 * How far the palette travels across the canvas from the base color. Hue
 * sweeps left→right, lightness top→bottom, and saturation eases off toward the
 * edges so the middle stays the richest part of the mesh.
 */
const BASE_HUE_SWEEP = 70;
const BASE_LIGHTNESS_SWEEP = 26;
const BASE_EDGE_DESATURATION = 0.25;

/**
 * Color one point from a base color and its place on the canvas. Pure in
 * (position, base color) — it ignores the point's current color, so repeated
 * picks never compound and moving a point re-colors it consistently.
 */
export function colorPointFromBase(
  point: MeshPoint,
  hex: string,
): MeshPoint {
  const base = hexToHsl(hex);
  const offsetX = point.x / 100 - 0.5;
  const offsetY = point.y / 100 - 0.5;
  const distance = Math.min(1, Math.hypot(offsetX, offsetY) / Math.SQRT1_2);
  const hue = ((base.hue + offsetX * BASE_HUE_SWEEP) % 360 + 360) % 360;
  return {
    ...point,
    hue: round(hue) % 360,
    saturation: round(
      clamp(base.saturation * (1 - BASE_EDGE_DESATURATION * distance), 8, 100),
    ),
    // Top of the canvas reads lighter, bottom deeper.
    lightness: round(
      clamp(base.lightness - offsetY * BASE_LIGHTNESS_SWEEP, 12, 92),
    ),
  };
}

/** Recolor a whole layout from one base color, keeping every position. */
export function applyBaseColor(points: MeshPoint[], hex: string): MeshPoint[] {
  return points.map((point) => colorPointFromBase(point, hex));
}

export interface GenerateOptions {
  seed: number;
  pointCount?: number;
  style?: MeshStyleName;
  customColor?: string;
}

export function generateMeshGradient(options: GenerateOptions): MeshGradientSpec {
  const seed = normalizeSeed(options.seed);
  const pointCount = clampPointCount(options.pointCount ?? DEFAULT_POINTS);
  const style = options.style ?? "aurora";
  if (!MESH_STYLE_NAMES.includes(style)) {
    throw new Error(`unknown style ${JSON.stringify(style)}`);
  }
  if (style === "custom" && options.customColor === undefined) {
    throw new Error("the custom style requires customColor");
  }
  const random = mulberry32(seed);
  const ranges = styleRangesFor(style, random, options.customColor);
  const points: MeshPoint[] = [];
  for (let index = 0; index < pointCount; index += 1) {
    const anchor = CORNER_ANCHORS[index];
    const x = anchor
      ? anchor[0] + (random() - 0.5) * 28
      : 15 + random() * 70;
    const y = anchor
      ? anchor[1] + (random() - 0.5) * 28
      : 15 + random() * 70;
    points.push({
      x: round(clamp(x, 0, 100)),
      y: round(clamp(y, 0, 100)),
      hue: round(((between(random, ranges.hue) % 360) + 360) % 360) % 360,
      saturation: round(between(random, ranges.saturation)),
      lightness: round(between(random, ranges.lightness)),
      radius: round(45 + random() * 35),
    });
  }
  return {
    seed,
    style,
    points:
      style === "custom" && options.customColor
        ? applyBaseColor(points, options.customColor)
        : points,
    ...(style === "custom" ? { customColor: options.customColor } : {}),
  };
}

/** Derive a gradient from a chosen color, keeping the hex as provenance. */
export function generateFromColor(
  hex: string,
  options: { seed?: number; pointCount?: number } = {},
): MeshGradientSpec {
  // Validates the hex and normalizes it, so a bad value fails here.
  hexToHsl(hex);
  return generateMeshGradient({
    seed: options.seed ?? randomSeed(),
    pointCount: options.pointCount,
    style: "custom",
    customColor: hex,
  });
}

/**
 * A palette-fitting point for hand-adding to an existing gradient: hue drawn
 * from the spec's style ranges, seeded by the click position so adds are
 * varied but reproducible for a given spot.
 */
export function newPointAt(spec: MeshGradientSpec, x: number, y: number): MeshPoint {
  const random = mulberry32(
    (spec.seed ^ (Math.round(x * 71) * 31 + Math.round(y * 137))) >>> 0,
  );
  const ranges = styleRangesFor(spec.style, random, spec.customColor);
  const point: MeshPoint = {
    x: round(clamp(x, 0, 100)),
    y: round(clamp(y, 0, 100)),
    hue: round(((between(random, ranges.hue) % 360) + 360) % 360) % 360,
    saturation: round(between(random, ranges.saturation)),
    lightness: round(between(random, ranges.lightness)),
    radius: round(45 + random() * 35),
  };
  // A point added to a custom gradient follows the same base-color transform
  // as its neighbours rather than drawing a random palette color.
  return spec.style === "custom" && spec.customColor
    ? colorPointFromBase(point, spec.customColor)
    : point;
}

export function pointColor(point: MeshPoint): string {
  return `hsl(${point.hue} ${point.saturation}% ${point.lightness}%)`;
}

export function baseColor(spec: MeshGradientSpec): string {
  const first = spec.points[0];
  if (!first) throw new Error("mesh gradient has no points");
  return `hsl(${first.hue} ${first.saturation}% ${Math.max(
    8,
    round(first.lightness * 0.45),
  )}%)`;
}

export interface CssLayers {
  backgroundColor: string;
  backgroundImage: string;
}

export function toCssLayers(spec: MeshGradientSpec): CssLayers {
  const layers = spec.points.map(
    (point) =>
      `radial-gradient(at ${point.x}% ${point.y}%, ${pointColor(point)} 0px, transparent ${point.radius}%)`,
  );
  return { backgroundColor: baseColor(spec), backgroundImage: layers.join(", ") };
}

export function toCss(spec: MeshGradientSpec): string {
  const layers = toCssLayers(spec);
  return `background-color: ${layers.backgroundColor};\nbackground-image: ${layers.backgroundImage};`;
}

/** WCAG relative luminance from sRGB channels in 0..255. */
export function relativeLuminance(r: number, g: number, b: number): number {
  const channel = (value: number) => {
    const scaled = value / 255;
    return scaled <= 0.04045
      ? scaled / 12.92
      : ((scaled + 0.055) / 1.055) ** 2.4;
  };
  return (
    0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
  );
}

export function contrastRatio(luminanceA: number, luminanceB: number): number {
  const lighter = Math.max(luminanceA, luminanceB);
  const darker = Math.min(luminanceA, luminanceB);
  return (lighter + 0.05) / (darker + 0.05);
}

export interface ContrastReport {
  /** Worst-case ratio across the sampled surface, per candidate text color. */
  white: number;
  black: number;
  best: "white" | "black";
  bestRatio: number;
  passesAA: boolean;
  passesAALarge: boolean;
}

/**
 * Worst case wins: text has to stay legible over the LIGHTEST region for white
 * and the DARKEST for black, so we score each against its hardest sample.
 */
export function contrastReportFor(luminances: number[]): ContrastReport {
  if (luminances.length === 0) {
    throw new Error("contrast report needs at least one sample");
  }
  const brightest = Math.max(...luminances);
  const darkest = Math.min(...luminances);
  const white = contrastRatio(1, brightest);
  const black = contrastRatio(0, darkest);
  const best = white >= black ? "white" : "black";
  const bestRatio = Math.max(white, black);
  return {
    white: Math.round(white * 100) / 100,
    black: Math.round(black * 100) / 100,
    best,
    bestRatio: Math.round(bestRatio * 100) / 100,
    passesAA: bestRatio >= 4.5,
    passesAALarge: bestRatio >= 3,
  };
}

export interface SvgOptions {
  width?: number;
  height?: number;
}

export function toSvg(spec: MeshGradientSpec, options: SvgOptions = {}): string {
  const width = options.width ?? 800;
  const height = options.height ?? 600;
  const prefix = `mesh-${spec.seed}`;
  const defs = spec.points
    .map((point, index) => {
      const cx = round((point.x / 100) * width);
      const cy = round((point.y / 100) * height);
      const r = round((point.radius / 100) * Math.max(width, height));
      return (
        `<radialGradient id="${prefix}-${index}" gradientUnits="userSpaceOnUse" ` +
        `cx="${cx}" cy="${cy}" r="${r}">` +
        `<stop offset="0" stop-color="${pointColor(point)}"/>` +
        `<stop offset="1" stop-color="${pointColor(point)}" stop-opacity="0"/>` +
        `</radialGradient>`
      );
    })
    .join("");
  const rects = spec.points
    .map(
      (_, index) =>
        `<rect width="${width}" height="${height}" fill="url(#${prefix}-${index})"/>`,
    )
    .join("");
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" ` +
    `viewBox="0 0 ${width} ${height}">` +
    `<defs>${defs}</defs>` +
    `<rect width="${width}" height="${height}" fill="${baseColor(spec)}"/>` +
    `${rects}</svg>`
  );
}

export function hslToHex(hue: number, saturation: number, lightness: number): string {
  const s = saturation / 100;
  const l = lightness / 100;
  const k = (n: number) => (n + hue / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const channel = (n: number) => {
    const value = l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return Math.round(value * 255)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${channel(0)}${channel(8)}${channel(4)}`;
}

export function hexToHsl(hex: string): {
  hue: number;
  saturation: number;
  lightness: number;
} {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) throw new Error(`invalid hex color ${JSON.stringify(hex)}`);
  const value = Number.parseInt(match[1], 16);
  const r = ((value >> 16) & 255) / 255;
  const g = ((value >> 8) & 255) / 255;
  const b = (value & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  const lightness = (max + min) / 2;
  let hue = 0;
  if (delta !== 0) {
    if (max === r) hue = ((g - b) / delta) % 6;
    else if (max === g) hue = (b - r) / delta + 2;
    else hue = (r - g) / delta + 4;
    hue *= 60;
    if (hue < 0) hue += 360;
  }
  const saturation =
    delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1));
  return {
    hue: round(hue) % 360,
    saturation: round(saturation * 100),
    lightness: round(lightness * 100),
  };
}

const NAME_TONES = [
  "quiet",
  "molten",
  "electric",
  "misty",
  "velvet",
  "glassy",
  "wild",
  "soft",
  "deep",
  "radiant",
  "dusky",
  "neon",
] as const;

const NAME_FORMS = [
  "aurora",
  "dusk",
  "lagoon",
  "meadow",
  "nebula",
  "tide",
  "ember",
  "bloom",
  "drift",
  "haze",
  "prism",
  "horizon",
] as const;

export function nameFor(spec: MeshGradientSpec): string {
  const random = mulberry32(spec.seed ^ 0x9e3779b9);
  const tone = NAME_TONES[Math.floor(random() * NAME_TONES.length)];
  const form = NAME_FORMS[Math.floor(random() * NAME_FORMS.length)];
  return `${tone} ${form}`;
}
