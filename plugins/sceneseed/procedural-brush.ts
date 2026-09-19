import * as THREE from "three";

export const MAX_BRUSH_POINTS = 48;
export const MAX_BRUSH_LAYERS = 4;
export const MAX_BRUSH_VERTICES = 520;

export type BrushPoint =
  | readonly [number, number]
  | readonly [number, number, number];
export type BrushStrokeShape = "round" | "tapered" | "flat";
export type BrushTexture = "clean" | "pencil" | "charcoal" | "ink";
export type BrushColorBehavior = "fixed" | "graphite" | "layered";

export interface ProceduralBrushOptions {
  readonly seed?: number;
  readonly shape?: BrushStrokeShape;
  readonly texture?: BrushTexture;
  readonly textureStrength?: number;
  readonly opacity?: number;
  readonly width?: number;
  readonly pressure?: number | readonly number[];
  readonly pressureVariation?: number;
  readonly jitter?: number;
  readonly layering?: number;
  readonly color?: number | string;
  readonly colorBehavior?: BrushColorBehavior;
  readonly colorVariation?: number;
  readonly smoothing?: number;
  readonly normal?: BrushPoint;
  readonly closed?: boolean;
  readonly depth?: number;
}

export interface ProceduralBrushStats {
  readonly strokes: number;
  readonly layers: number;
  readonly vertices: number;
}

export interface ProceduralBrush {
  stroke(
    points: readonly BrushPoint[],
    options?: ProceduralBrushOptions,
  ): THREE.Group;
  stats(): ProceduralBrushStats;
}

export interface ProceduralBrushApi {
  create(options?: ProceduralBrushOptions): ProceduralBrush;
}

interface TextureProfile {
  readonly opacity: number;
  readonly jitter: number;
  readonly pressureVariation: number;
  readonly layering: number;
  readonly colorVariation: number;
  readonly gaps: number;
}

interface ResolvedBrushOptions {
  readonly seed: number;
  readonly shape: BrushStrokeShape;
  readonly texture: BrushTexture;
  readonly textureStrength: number;
  readonly opacity: number;
  readonly width: number;
  readonly pressure: number | readonly number[];
  readonly pressureVariation: number;
  readonly jitter: number;
  readonly layering: number;
  readonly color: THREE.Color;
  readonly colorBehavior: BrushColorBehavior;
  readonly colorVariation: number;
  readonly smoothing: number;
  readonly normal: THREE.Vector3;
  readonly closed: boolean;
  readonly depth: number;
  readonly gaps: number;
}

interface PathSample {
  readonly point: THREE.Vector3;
  readonly pressure: number;
}

const TEXTURE_PROFILES: Record<BrushTexture, TextureProfile> = {
  clean: {
    opacity: 0.86,
    jitter: 0.02,
    pressureVariation: 0.08,
    layering: 1,
    colorVariation: 0.02,
    gaps: 0,
  },
  pencil: {
    opacity: 0.72,
    jitter: 0.32,
    pressureVariation: 0.26,
    layering: 2,
    colorVariation: 0.12,
    gaps: 0.08,
  },
  charcoal: {
    opacity: 0.56,
    jitter: 0.7,
    pressureVariation: 0.34,
    layering: 3,
    colorVariation: 0.18,
    gaps: 0.14,
  },
  ink: {
    opacity: 0.76,
    jitter: 0.08,
    pressureVariation: 0.2,
    layering: 1,
    colorVariation: 0.04,
    gaps: 0.015,
  },
};

const DEFAULT_OPTIONS: Required<
  Omit<ProceduralBrushOptions, "pressure" | "normal" | "color">
> & {
  readonly pressure: number;
  readonly normal: BrushPoint;
  readonly color: number;
} = {
  seed: 1,
  shape: "tapered",
  texture: "pencil",
  textureStrength: 0.78,
  opacity: 0.72,
  width: 0.12,
  pressure: 0.82,
  pressureVariation: 0.26,
  jitter: 0.12,
  layering: 2,
  color: 0x333333,
  colorBehavior: "graphite",
  colorVariation: 0.12,
  smoothing: 0.32,
  closed: false,
  depth: 0,
  normal: [0, 0, 1],
};

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}

function finiteNumber(
  value: unknown,
  fallback: number,
  minimum: number,
  maximum: number,
  label: string,
): number {
  if (value === undefined) return fallback;
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new TypeError(`${label} must be a finite number`);
  }
  return clamp(value, minimum, maximum);
}

function integer(
  value: unknown,
  fallback: number,
  minimum: number,
  maximum: number,
  label: string,
): number {
  return Math.round(finiteNumber(value, fallback, minimum, maximum, label));
}

function point(value: BrushPoint, label: string): THREE.Vector3 {
  if (!Array.isArray(value) || (value.length !== 2 && value.length !== 3)) {
    throw new TypeError(`${label} must contain two or three coordinates`);
  }
  const coordinates = [value[0], value[1], value[2] ?? 0];
  if (
    coordinates.some(
      (coordinate) =>
        typeof coordinate !== "number" || !Number.isFinite(coordinate),
    )
  ) {
    throw new TypeError(`${label} coordinates must be finite numbers`);
  }
  return new THREE.Vector3(...(coordinates as [number, number, number]));
}

function color(value: number | string | undefined): THREE.Color {
  if (value !== undefined && typeof value !== "number" && typeof value !== "string") {
    throw new TypeError("color must be a hexadecimal number or CSS color string");
  }
  return new THREE.Color(value ?? DEFAULT_OPTIONS.color);
}

function enumValue<T extends string>(
  value: unknown,
  allowed: readonly T[],
  fallback: T,
  label: string,
): T {
  if (value === undefined) return fallback;
  if (typeof value !== "string" || !allowed.includes(value as T)) {
    throw new TypeError(`${label} must be one of ${allowed.join(", ")}`);
  }
  return value as T;
}

function optionsRecord(
  value: unknown,
  label: string,
): ProceduralBrushOptions {
  if (
    value === undefined ||
    (value !== null && typeof value === "object" && !Array.isArray(value))
  ) {
    return (value ?? {}) as ProceduralBrushOptions;
  }
  throw new TypeError(`${label} must be an object`);
}

function booleanValue(
  value: unknown,
  fallback: boolean,
  label: string,
): boolean {
  if (value === undefined) return fallback;
  if (typeof value !== "boolean") {
    throw new TypeError(`${label} must be a boolean`);
  }
  return value;
}

function pressure(
  value: ProceduralBrushOptions["pressure"],
  fallback: number | readonly number[],
): number | readonly number[] {
  if (value === undefined) return fallback;
  if (typeof value === "number") {
    return finiteNumber(value, DEFAULT_OPTIONS.pressure, 0.05, 1, "pressure");
  }
  if (!Array.isArray(value) || value.length < 2 || value.length > MAX_BRUSH_POINTS) {
    throw new TypeError(
      `pressure must be a number or an array of 2–${MAX_BRUSH_POINTS} numbers`,
    );
  }
  return value.map((entry, index) =>
    finiteNumber(entry, 1, 0.05, 1, `pressure[${index}]`),
  );
}

function resolveOptions(
  base: ProceduralBrushOptions,
  override: ProceduralBrushOptions = {},
): ResolvedBrushOptions {
  const merged = { ...base, ...override };
  const texture = enumValue(
    merged.texture,
    ["clean", "pencil", "charcoal", "ink"] as const,
    DEFAULT_OPTIONS.texture,
    "texture",
  );
  const profile = TEXTURE_PROFILES[texture];
  const textureStrength = finiteNumber(
    merged.textureStrength,
    DEFAULT_OPTIONS.textureStrength,
    0,
    1,
    "textureStrength",
  );
  const profileAmount = (value: number, clean: number) =>
    clean + (value - clean) * textureStrength;
  const normal = point(merged.normal ?? DEFAULT_OPTIONS.normal, "normal");
  if (normal.lengthSq() < 0.000001) {
    throw new TypeError("normal must not be a zero vector");
  }
  normal.normalize();

  return {
    seed: integer(merged.seed, DEFAULT_OPTIONS.seed, -1_000_000, 1_000_000, "seed"),
    shape: enumValue(
      merged.shape,
      ["round", "tapered", "flat"] as const,
      DEFAULT_OPTIONS.shape,
      "shape",
    ),
    texture,
    textureStrength,
    opacity: finiteNumber(
      merged.opacity,
      profileAmount(profile.opacity, TEXTURE_PROFILES.clean.opacity),
      0.05,
      1,
      "opacity",
    ),
    width: finiteNumber(merged.width, DEFAULT_OPTIONS.width, 0.01, 2, "width"),
    pressure: pressure(merged.pressure, DEFAULT_OPTIONS.pressure),
    pressureVariation: finiteNumber(
      merged.pressureVariation,
      profileAmount(
        profile.pressureVariation,
        TEXTURE_PROFILES.clean.pressureVariation,
      ),
      0,
      0.9,
      "pressureVariation",
    ),
    jitter: finiteNumber(
      merged.jitter,
      profileAmount(profile.jitter, TEXTURE_PROFILES.clean.jitter),
      0,
      1.5,
      "jitter",
    ),
    layering: integer(
      merged.layering,
      Math.round(
        profileAmount(profile.layering, TEXTURE_PROFILES.clean.layering),
      ),
      1,
      MAX_BRUSH_LAYERS,
      "layering",
    ),
    color: color(merged.color),
    colorBehavior: enumValue(
      merged.colorBehavior,
      ["fixed", "graphite", "layered"] as const,
      DEFAULT_OPTIONS.colorBehavior,
      "colorBehavior",
    ),
    colorVariation: finiteNumber(
      merged.colorVariation,
      profileAmount(
        profile.colorVariation,
        TEXTURE_PROFILES.clean.colorVariation,
      ),
      0,
      0.45,
      "colorVariation",
    ),
    smoothing: finiteNumber(
      merged.smoothing,
      DEFAULT_OPTIONS.smoothing,
      0,
      0.45,
      "smoothing",
    ),
    normal,
    closed: booleanValue(merged.closed, DEFAULT_OPTIONS.closed, "closed"),
    depth: finiteNumber(merged.depth, DEFAULT_OPTIONS.depth, -20, 20, "depth"),
    gaps: profileAmount(profile.gaps, TEXTURE_PROFILES.clean.gaps),
  };
}

function randomFactory(seed: number): () => number {
  let state = (seed | 0) ^ 0x9e3779b9;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function pressureAt(
  configured: number | readonly number[],
  index: number,
  count: number,
): number {
  if (typeof configured === "number") return configured;
  const position = count <= 1 ? 0 : (index / (count - 1)) * (configured.length - 1);
  const left = Math.floor(position);
  const right = Math.min(configured.length - 1, left + 1);
  const amount = position - left;
  return THREE.MathUtils.lerp(configured[left]!, configured[right]!, amount);
}

function smoothSamples(
  samples: readonly PathSample[],
  amount: number,
  closed: boolean,
): PathSample[] {
  if (amount <= 0 || samples.length < 3) return [...samples];
  const next: PathSample[] = [];
  if (!closed) next.push(samples[0]!);
  const count = closed ? samples.length : samples.length - 1;
  for (let index = 0; index < count; index += 1) {
    const left = samples[index]!;
    const right = samples[(index + 1) % samples.length]!;
    next.push({
      point: left.point.clone().lerp(right.point, amount),
      pressure: THREE.MathUtils.lerp(left.pressure, right.pressure, amount),
    });
    next.push({
      point: left.point.clone().lerp(right.point, 1 - amount),
      pressure: THREE.MathUtils.lerp(left.pressure, right.pressure, 1 - amount),
    });
  }
  if (!closed) next.push(samples.at(-1)!);
  return next;
}

function shapePressure(shape: BrushStrokeShape, progress: number): number {
  if (shape === "flat") return 1;
  if (shape === "round") {
    return 0.82 + 0.18 * Math.sin(Math.PI * progress);
  }
  return 0.16 + 0.84 * Math.pow(Math.sin(Math.PI * progress), 0.42);
}

function layerColor(options: ResolvedBrushOptions, layer: number): THREE.Color {
  const base = options.color.getHSL({ h: 0, s: 0, l: 0 });
  if (options.colorBehavior === "fixed") return options.color.clone();
  const centered = options.layering <= 1 ? 0 : layer / (options.layering - 1) - 0.5;
  const direction = options.colorBehavior === "graphite" ? 1 : -1;
  const lightness = clamp(
    base.l + centered * options.colorVariation * direction,
    0.03,
    0.94,
  );
  return new THREE.Color().setHSL(
    base.h,
    options.colorBehavior === "graphite" ? 0 : base.s,
    lightness,
  );
}

function layerOpacity(options: ResolvedBrushOptions, layer: number): number {
  if (options.layering === 1) return options.opacity;
  const primaryLayer = Math.floor(options.layering / 2);
  if (layer === primaryLayer) return options.opacity;
  const distance = Math.abs(layer - primaryLayer);
  return options.opacity * Math.max(0.24, 0.5 - distance * 0.1);
}

function materialKey(options: ResolvedBrushOptions, layer: number): string {
  return [
    layerColor(options, layer).getHexString(),
    layerOpacity(options, layer).toFixed(4),
    options.layering,
    options.texture,
  ].join(":");
}

function createLayerGeometry(
  samples: readonly PathSample[],
  options: ResolvedBrushOptions,
  layer: number,
  random: () => number,
): THREE.BufferGeometry {
  const positions: number[] = [];
  const indices: number[] = [];
  const count = samples.length;
  const layerBias = options.layering <= 1 ? 0 : layer / (options.layering - 1) - 0.5;

  for (let index = 0; index < count; index += 1) {
    const current = samples[index]!;
    const previous = samples[index === 0 ? (options.closed ? count - 1 : 0) : index - 1]!;
    const next = samples[index === count - 1 ? (options.closed ? 0 : count - 1) : index + 1]!;
    const tangent = next.point.clone().sub(previous.point);
    if (tangent.lengthSq() < 0.000001) tangent.set(1, 0, 0);
    tangent.normalize();
    const side = options.normal.clone().cross(tangent);
    if (side.lengthSq() < 0.000001) {
      side.set(0, 1, 0).cross(tangent);
    }
    side.normalize();
    const progress = options.closed ? index / count : index / Math.max(1, count - 1);
    const pressureNoise = (random() * 2 - 1) * options.pressureVariation;
    const halfWidth =
      options.width *
      current.pressure *
      (options.closed ? 1 : shapePressure(options.shape, progress)) *
      (1 + pressureNoise) *
      0.5;
    const jitter = options.jitter * options.width;
    const displaced = current.point
      .clone()
      .addScaledVector(side, (random() * 2 - 1 + layerBias * 1.8) * jitter)
      .addScaledVector(tangent, (random() * 2 - 1) * jitter * 0.35)
      .addScaledVector(options.normal, options.depth + layer * 0.0025);
    const left = displaced.clone().addScaledVector(side, halfWidth);
    const right = displaced.clone().addScaledVector(side, -halfWidth);
    positions.push(left.x, left.y, left.z, right.x, right.y, right.z);
  }

  const segmentCount = options.closed ? count : count - 1;
  let includedSegments = 0;
  for (let index = 0; index < segmentCount; index += 1) {
    const next = (index + 1) % count;
    const omit = options.gaps > 0 && random() < options.gaps;
    if (omit && includedSegments > 0) continue;
    const left = index * 2;
    const right = left + 1;
    const nextLeft = next * 2;
    const nextRight = nextLeft + 1;
    indices.push(left, right, nextLeft, right, nextRight, nextLeft);
    includedSegments += 1;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

/**
 * Creates the deterministic, plugin-local sketch API injected into generated
 * SceneSeed source as `BRUSH`. It returns ordinary serializable Three.js
 * groups, meshes, indexed geometry, and basic materials; the browser never
 * executes brush code.
 */
export function createProceduralBrushApi(): ProceduralBrushApi {
  return Object.freeze({
    create(baseOptions: ProceduralBrushOptions = {}): ProceduralBrush {
      const safeBaseOptions = optionsRecord(baseOptions, "brush options");
      let strokes = 0;
      let layers = 0;
      let vertices = 0;
      const materialCache = new Map<string, THREE.MeshBasicMaterial>();

      return Object.freeze({
        stroke(
          input: readonly BrushPoint[],
          override: ProceduralBrushOptions = {},
        ): THREE.Group {
          if (!Array.isArray(input) || input.length < 2 || input.length > MAX_BRUSH_POINTS) {
            throw new TypeError(
              `stroke points must contain 2–${MAX_BRUSH_POINTS} entries`,
            );
          }
          const options = resolveOptions(
            safeBaseOptions,
            optionsRecord(override, "stroke options"),
          );
          const smoothedSamples = smoothSamples(
            input.map((entry, index) => ({
              point: point(entry, `points[${index}]`),
              pressure: pressureAt(options.pressure, index, input.length),
            })),
            options.smoothing,
            options.closed,
          );
          const samples =
            options.shape === "tapered" &&
            !options.closed &&
            smoothedSamples.length === 2
              ? [
                  smoothedSamples[0]!,
                  {
                    point: smoothedSamples[0]!.point
                      .clone()
                      .lerp(smoothedSamples[1]!.point, 0.5),
                    pressure: THREE.MathUtils.lerp(
                      smoothedSamples[0]!.pressure,
                      smoothedSamples[1]!.pressure,
                      0.5,
                    ),
                  },
                  smoothedSamples[1]!,
                ]
              : smoothedSamples;
          const nextVertices = samples.length * 2 * options.layering;
          if (vertices + nextVertices > MAX_BRUSH_VERTICES) {
            throw new RangeError(
              `brush output would exceed ${MAX_BRUSH_VERTICES} vertices; use fewer points, layers, or strokes`,
            );
          }

          const group = new THREE.Group();
          group.name = `Sketch stroke ${strokes + 1}`;
          for (let layer = 0; layer < options.layering; layer += 1) {
            const random = randomFactory(
              options.seed + strokes * 1_009 + layer * 7_919,
            );
            const geometry = createLayerGeometry(samples, options, layer, random);
            const key = materialKey(options, layer);
            let material = materialCache.get(key);
            if (!material) {
              material = new THREE.MeshBasicMaterial({
                color: layerColor(options, layer),
                opacity: layerOpacity(options, layer),
                transparent: true,
                depthTest: true,
                depthWrite: false,
                side: THREE.DoubleSide,
                toneMapped: false,
              });
              material.name = `Sketch ${options.texture} ${layer + 1}`;
              materialCache.set(key, material);
            }
            const mesh = new THREE.Mesh(geometry, material);
            mesh.name = `Sketch stroke ${strokes + 1} layer ${layer + 1}`;
            mesh.renderOrder = strokes * MAX_BRUSH_LAYERS + layer;
            mesh.castShadow = false;
            mesh.receiveShadow = false;
            group.add(mesh);
          }
          strokes += 1;
          layers += options.layering;
          vertices += nextVertices;
          return group;
        },
        stats(): ProceduralBrushStats {
          return { strokes, layers, vertices };
        },
      });
    },
  });
}

export const PROCEDURAL_BRUSH = createProceduralBrushApi();
