import { BASE_RADIUS } from "../katamari-math";

/**
 * Themed patches of the world. Like the game, a small katamari starts on a
 * tatami floor among stationery and snacks, then graduates to gardens,
 * streets, beaches, forests, and snowfields as it grows.
 */
export const ZONES = [
  "room",
  "garden",
  "town",
  "beach",
  "candy",
  "forest",
  "snow",
] as const;

export type Zone = (typeof ZONES)[number];

export function zoneIndex(zone: Zone): number {
  return ZONES.indexOf(zone);
}

type ZoneWeights = Partial<Record<Zone, number>>;

const ZONE_WEIGHTS_BY_LEVEL: readonly ZoneWeights[] = [
  { room: 0.72, candy: 0.14, garden: 0.14 },
  { room: 0.55, candy: 0.15, garden: 0.2, beach: 0.1 },
  { room: 0.28, garden: 0.28, candy: 0.14, town: 0.18, beach: 0.12 },
  { room: 0.06, garden: 0.24, town: 0.28, beach: 0.14, forest: 0.16, candy: 0.12 },
  { garden: 0.16, town: 0.3, beach: 0.16, forest: 0.16, snow: 0.12, candy: 0.1 },
];

function weightsFor(level: number): ZoneWeights {
  return ZONE_WEIGHTS_BY_LEVEL[Math.min(level, ZONE_WEIGHTS_BY_LEVEL.length - 1)];
}

function hash3(a: number, b: number, c: number): number {
  let hash = Math.imul(a | 0, 0x27d4eb2d) ^ Math.imul(b | 0, 0x165667b1);
  hash = Math.imul(hash ^ Math.imul(c | 0, 0x9e3779b9), 0x85ebca6b);
  hash ^= hash >>> 13;
  hash = Math.imul(hash, 0xc2b2ae35);
  hash ^= hash >>> 16;
  return (hash >>> 0) / 4_294_967_296;
}

function weightedZone(weights: ZoneWeights, roll: number): Zone {
  let total = 0;
  for (const zone of ZONES) total += weights[zone] ?? 0;
  let cursor = roll * total;
  for (const zone of ZONES) {
    cursor -= weights[zone] ?? 0;
    if (cursor <= 0 && (weights[zone] ?? 0) > 0) return zone;
  }
  return "garden";
}

/** Width of one themed patch at a scale level. */
export function zoneCellSize(level: number): number {
  return BASE_RADIUS * 2 ** level * 16;
}

export interface ZoneSample {
  zone: Zone;
  /** Stable per-patch value in [0, 1) for tinting and variety. */
  variant: number;
}

/** Nearest jittered cell center wins, giving irregular patches with crisp borders. */
export function zoneAt(x: number, z: number, level: number, seed: number): ZoneSample {
  const size = zoneCellSize(level);
  const cellX = Math.floor(x / size);
  const cellZ = Math.floor(z / size);
  let bestDistance = Number.POSITIVE_INFINITY;
  let bestX = cellX;
  let bestZ = cellZ;
  for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
    for (let offsetZ = -1; offsetZ <= 1; offsetZ += 1) {
      const candidateX = cellX + offsetX;
      const candidateZ = cellZ + offsetZ;
      const centerX = (candidateX + 0.15 + 0.7 * hash3(candidateX, candidateZ, seed + level * 7)) * size;
      const centerZ = (candidateZ + 0.15 + 0.7 * hash3(candidateZ, candidateX, seed + level * 13)) * size;
      const distance = (centerX - x) ** 2 + (centerZ - z) ** 2;
      if (distance < bestDistance) {
        bestDistance = distance;
        bestX = candidateX;
        bestZ = candidateZ;
      }
    }
  }
  return {
    zone: weightedZone(weightsFor(level), hash3(bestX, bestZ, seed + level * 31 + 5)),
    variant: hash3(bestX, bestZ, seed + level * 57 + 11),
  };
}

/** Ground base colors, one per zone, in `ZONES` order: the key art's flat palette. */
export const ZONE_GROUND_COLORS: readonly number[] = [
  0xe2cf8e, // room: tatami
  0x8cc63f, // garden: lime lawn
  0xbac3cb, // town: paving
  0xf3e2b3, // beach: sand
  0xffc6dc, // candy: frosting
  0x62ae3a, // forest: moss
  0xf2f7fb, // snow
];

/** Pattern accent colors, one per zone. */
export const ZONE_ACCENT_COLORS: readonly number[] = [
  0xc9b171, // tatami seams
  0x9ad24c, // mown stripes
  0xf7f3dc, // road paint
  0xebd6a2, // ripples
  0xfff0f6, // checks
  0x549f31, // clover
  0xdde9f5, // drifts
];
