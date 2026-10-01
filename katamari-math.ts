/** Ball radius, in world units, of an empty context window. */
export const BASE_RADIUS = 0.3;
/** How many times wider a full ball is than an empty one. */
export const GROWTH = 60;
/** Displayed diameter of an empty ball, in millimetres: comically small. */
const BASE_DIAMETER_MM = 5;
/** A full context window rolls a 50 m katamari. */
const FULL_DIAMETER_MM = 50_000;

export function clampFill(fill: number | null | undefined): number {
  if (fill === null || fill === undefined || !Number.isFinite(fill)) return 0;
  return Math.min(1, Math.max(0, fill));
}

export function contextFill(
  usedTokens: number,
  capacityTokens: number,
): number {
  if (!(capacityTokens > 0)) return 0;
  return clampFill(usedTokens / capacityTokens);
}

/** Katamari growth is exponential, so every stretch of context feels like a new world. */
export function radiusForFill(fill: number): number {
  return BASE_RADIUS * GROWTH ** clampFill(fill);
}

export function fillForRadius(radius: number): number {
  if (!(radius > BASE_RADIUS)) return 0;
  return clampFill(Math.log(radius / BASE_RADIUS) / Math.log(GROWTH));
}

/** Scale level of a radius: each level doubles the size of the world's props. */
export function scaleLevel(radius: number): number {
  return Math.max(0, Math.floor(Math.log2(Math.max(radius, BASE_RADIUS) / BASE_RADIUS)));
}

export function diameterMillimetres(radius: number): number {
  const fill = fillForRadius(radius);
  return BASE_DIAMETER_MM * (FULL_DIAMETER_MM / BASE_DIAMETER_MM) ** fill;
}

/** The game's size readout: `5mm`, `4cm 7mm`, `1m 23cm`, `37m 10cm`. */
export function formatKatamariSize(radius: number): string {
  const totalMm = Math.round(diameterMillimetres(radius));
  const metres = Math.floor(totalMm / 1000);
  const centimetres = Math.floor((totalMm % 1000) / 10);
  const millimetres = totalMm % 10;
  if (metres > 0) return `${metres}m ${centimetres}cm`;
  if (centimetres === 0) return `${millimetres}mm`;
  return `${centimetres}cm ${millimetres}mm`;
}

export function formatTokens(tokens: number): string {
  if (tokens >= 1_000_000) {
    const millions = tokens / 1_000_000;
    return `${millions >= 10 ? Math.round(millions) : millions.toFixed(1)}M`;
  }
  if (tokens >= 1_000) return `${Math.round(tokens / 1_000)}k`;
  return String(Math.round(tokens));
}

/** FNV-1a, so a thread keeps the same cousin across reloads. */
export function hashString(value: string): number {
  let hash = 2_166_136_261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }
  return hash >>> 0;
}

/** Small deterministic PRNG for world generation. */
export function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
}
