import {
  MAX_SCENE_LIGHTS,
  MAX_SCENE_NODES,
  type SceneNodeV1,
  type SceneObjectV1,
} from "./scene-contract";

export type Vector3Tuple = readonly [number, number, number];

export type SceneThemeToken =
  | "theme:ink"
  | "theme:canvas"
  | "theme:accent"
  | "theme:muted"
  | "theme:success"
  | "theme:warning"
  | "theme:danger";

export type SceneThemePalette = Readonly<Record<SceneThemeToken, string>>;

export const FALLBACK_THEME_PALETTE = {
  "theme:ink": "#292929",
  "theme:canvas": "#fafafa",
  "theme:accent": "#d8d8d8",
  "theme:muted": "#e6e6e6",
  "theme:success": "#2f9e63",
  "theme:warning": "#d27a20",
  "theme:danger": "#c54848",
} as const satisfies SceneThemePalette;

const HEX_COLOR = /^#[0-9a-f]{6}$/i;
const THEME_TOKEN = /^theme:/;

export class SceneRendererInvariantError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SceneRendererInvariantError";
  }
}

export interface DisposableRendererResource {
  dispose(): void;
}

export class RendererResourceRegistry {
  readonly #resources = new Set<DisposableRendererResource>();

  register(resource: DisposableRendererResource): () => void {
    this.#resources.add(resource);
    return () => {
      this.#resources.delete(resource);
    };
  }

  dispose(resource: DisposableRendererResource): void {
    if (!this.#resources.delete(resource)) return;
    resource.dispose();
  }

  disposeAll(): void {
    const resources = [...this.#resources];
    this.#resources.clear();
    for (const resource of resources) resource.dispose();
  }

  get size(): number {
    return this.#resources.size;
  }
}

export function isSafeHexColor(value: string): boolean {
  return HEX_COLOR.test(value);
}

function safeThemeColor(
  token: SceneThemeToken,
  palette: SceneThemePalette,
): string {
  const candidate = palette[token];
  return isSafeHexColor(candidate)
    ? candidate.toLowerCase()
    : FALLBACK_THEME_PALETTE[token];
}

export function resolvePaletteEntry(
  value: string,
  palette: SceneThemePalette = FALLBACK_THEME_PALETTE,
): string {
  if (isSafeHexColor(value)) return value.toLowerCase();
  if (THEME_TOKEN.test(value) && value in FALLBACK_THEME_PALETTE) {
    return safeThemeColor(value as SceneThemeToken, palette);
  }
  return safeThemeColor("theme:accent", palette);
}

export function resolveScenePalette(
  scene: Pick<SceneObjectV1, "palette">,
  palette: SceneThemePalette = FALLBACK_THEME_PALETTE,
): readonly string[] {
  return scene.palette.map((entry) => resolvePaletteEntry(entry, palette));
}

export interface SceneNodeTree {
  readonly node: SceneNodeV1;
  readonly children: readonly SceneNodeTree[];
}

export function buildSceneNodeTree(
  nodes: readonly SceneNodeV1[],
): readonly SceneNodeTree[] {
  const byId = new Map<string, SceneNodeV1>();
  const childrenByParent = new Map<string, SceneNodeV1[]>();
  const roots: SceneNodeV1[] = [];

  for (const node of nodes) {
    if (byId.has(node.id)) {
      throw new SceneRendererInvariantError(`Duplicate scene node: ${node.id}`);
    }
    byId.set(node.id, node);
  }

  for (const node of nodes) {
    if (node.parentId === null) {
      roots.push(node);
      continue;
    }
    if (!byId.has(node.parentId)) {
      throw new SceneRendererInvariantError(
        `Scene node ${node.id} has missing parent ${node.parentId}`,
      );
    }
    const siblings = childrenByParent.get(node.parentId) ?? [];
    siblings.push(node);
    childrenByParent.set(node.parentId, siblings);
  }

  const visiting = new Set<string>();
  const visited = new Set<string>();

  const visit = (node: SceneNodeV1): SceneNodeTree => {
    if (visiting.has(node.id)) {
      throw new SceneRendererInvariantError(
        `Scene node graph contains a cycle at ${node.id}`,
      );
    }
    visiting.add(node.id);
    const children = (childrenByParent.get(node.id) ?? []).map(visit);
    visiting.delete(node.id);
    visited.add(node.id);
    return { node, children };
  };

  const tree = roots.map(visit);
  if (visited.size !== nodes.length) {
    const unreachable = nodes.find((node) => !visited.has(node.id));
    throw new SceneRendererInvariantError(
      `Scene node graph is not rooted${unreachable ? ` at ${unreachable.id}` : ""}`,
    );
  }
  return tree;
}

export type MeshGeometryKind = Extract<
  SceneNodeV1,
  { kind: "mesh" }
>["geometry"];

export interface MeshGeometryPlan {
  readonly kind: MeshGeometryKind;
  readonly args: readonly number[];
  readonly localScale: Vector3Tuple;
  readonly localRotation: Vector3Tuple;
}

export function mapMeshGeometry(
  node: Extract<SceneNodeV1, { kind: "mesh" }>,
): MeshGeometryPlan {
  const { width, height, depth } = node.size;
  switch (node.geometry) {
    case "box":
      return {
        kind: "box",
        args: [width, height, depth],
        localScale: [1, 1, 1],
        localRotation: [0, 0, 0],
      };
    case "sphere":
      return {
        kind: "sphere",
        args: [0.5, 24, 16],
        localScale: [width, height, depth],
        localRotation: [0, 0, 0],
      };
    case "cylinder":
      return {
        kind: "cylinder",
        args: [0.5, 0.5, 1, 24, 1, 0],
        localScale: [width, height, depth],
        localRotation: [0, 0, 0],
      };
    case "cone":
      return {
        kind: "cone",
        args: [0.5, 1, 24, 1, 0],
        localScale: [width, height, depth],
        localRotation: [0, 0, 0],
      };
    case "torus":
      return {
        kind: "torus",
        args: [0.35, 0.15, 10, 24],
        localScale: [width, height / 0.3, depth],
        localRotation: [Math.PI / 2, 0, 0],
      };
    case "capsule":
      return {
        kind: "capsule",
        args: [0.5, 0.5, 6, 12],
        localScale: [width, height / 1.5, depth],
        localRotation: [0, 0, 0],
      };
    case "plane":
      return {
        kind: "plane",
        args: [width, depth, 1, 1],
        localScale: [1, 1, 1],
        localRotation: [-Math.PI / 2, 0, 0],
      };
  }
}

export type MaterialKind = "standard" | "physical" | "toon";

export interface MaterialPlan {
  readonly kind: MaterialKind;
  readonly opacity: number;
  readonly transparent: boolean;
  readonly depthWrite: boolean;
  readonly roughness?: number;
  readonly metalness?: number;
  readonly transmission?: number;
  readonly thickness?: number;
  readonly emissiveIntensity?: number;
}

export function mapMaterial(material: SceneObjectV1["material"]): MaterialPlan {
  const transparent = material.opacity < 1 || material.preset === "glass";
  switch (material.preset) {
    case "matte":
      return {
        kind: "standard",
        opacity: material.opacity,
        transparent,
        depthWrite: !transparent,
        roughness: 0.82,
        metalness: 0.02,
      };
    case "glossy":
      return {
        kind: "standard",
        opacity: material.opacity,
        transparent,
        depthWrite: !transparent,
        roughness: 0.18,
        metalness: 0.08,
      };
    case "glass":
      return {
        kind: "physical",
        opacity: material.opacity,
        transparent: true,
        depthWrite: false,
        roughness: 0.08,
        metalness: 0,
        transmission: 0.82,
        thickness: 0.35,
      };
    case "metal":
      return {
        kind: "standard",
        opacity: material.opacity,
        transparent,
        depthWrite: !transparent,
        roughness: 0.26,
        metalness: 0.9,
      };
    case "emissive":
      return {
        kind: "standard",
        opacity: material.opacity,
        transparent,
        depthWrite: !transparent,
        roughness: 0.42,
        metalness: 0.04,
        emissiveIntensity: 0.65,
      };
    case "toon":
      return {
        kind: "toon",
        opacity: material.opacity,
        transparent,
        depthWrite: !transparent,
      };
  }
}

function hashString(value: string): number {
  let hash = 2_166_136_261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }
  return hash >>> 0;
}

function createRandom(seed: number): () => number {
  let state = seed || 1;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
}

export function createParticlePositions(
  node: Extract<SceneNodeV1, { kind: "particles" }>,
): Float32Array {
  const count = Math.min(500, Math.max(1, Math.trunc(node.count)));
  const positions = new Float32Array(count * 3);
  const random = createRandom(hashString(`${node.id}:${node.preset}`));
  const halfWidth = node.spread.width / 2;
  const halfHeight = node.spread.height / 2;
  const halfDepth = node.spread.depth / 2;

  for (let index = 0; index < count; index += 1) {
    let x = (random() * 2 - 1) * halfWidth;
    let y = (random() * 2 - 1) * halfHeight;
    let z = (random() * 2 - 1) * halfDepth;
    if (node.preset === "sparks") {
      const rise = Math.pow(random(), 0.65);
      y = -halfHeight + rise * node.spread.height;
      const taper = 1 - rise * 0.7;
      x *= taper;
      z *= taper;
    } else if (node.preset === "snow") {
      x += Math.sin(index * 2.399) * halfWidth * 0.08;
      z += Math.cos(index * 2.399) * halfDepth * 0.08;
    } else if (node.preset === "motes") {
      x *= 0.82;
      z *= 0.82;
    }
    const offset = index * 3;
    positions[offset] = x;
    positions[offset + 1] = y;
    positions[offset + 2] = z;
  }
  return positions;
}

export interface MotionFrame {
  readonly positionY: number;
  readonly rotationY: number;
  readonly scaleMultiplier: number;
  readonly opacityMultiplier: number;
}

export function evaluateMotion(
  motion: SceneObjectV1["motion"],
  elapsedSeconds: number,
): MotionFrame {
  const phase = elapsedSeconds * motion.speed * Math.PI * 2;
  const wave = Math.sin(phase);
  switch (motion.preset) {
    case "none":
      return {
        positionY: 0,
        rotationY: 0,
        scaleMultiplier: 1,
        opacityMultiplier: 1,
      };
    case "breathe":
      return {
        positionY: 0,
        rotationY: 0,
        scaleMultiplier: 1 + wave * motion.amplitude * 0.04,
        opacityMultiplier: 1,
      };
    case "orbit":
      return {
        positionY: 0,
        rotationY:
          (elapsedSeconds * motion.speed * motion.amplitude * Math.PI) %
          (Math.PI * 2),
        scaleMultiplier: 1,
        opacityMultiplier: 1,
      };
    case "bob":
      return {
        positionY: wave * motion.amplitude * 0.35,
        rotationY: 0,
        scaleMultiplier: 1,
        opacityMultiplier: 1,
      };
    case "shimmer":
      return {
        positionY: 0,
        rotationY: 0,
        scaleMultiplier: 1,
        opacityMultiplier: 1 - motion.amplitude * 0.18 * (0.5 + wave * 0.5),
      };
  }
}

export const REDUCED_MOTION_REVEAL_SECONDS = 0.15;
export const STANDARD_REVEAL_SECONDS = 0.55;

export interface RevealFrame {
  readonly opacity: number;
  readonly scale: Vector3Tuple;
  readonly rotationZ: number;
  readonly complete: boolean;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function evaluateReveal(
  elapsedSeconds: number,
  reducedMotion: boolean,
): RevealFrame {
  const duration = reducedMotion
    ? REDUCED_MOTION_REVEAL_SECONDS
    : STANDARD_REVEAL_SECONDS;
  const progress = clamp01(elapsedSeconds / duration);
  const eased = 1 - Math.pow(1 - progress, 3);
  if (reducedMotion) {
    return {
      opacity: progress,
      scale: [1, 1, 1],
      rotationZ: 0,
      complete: progress >= 1,
    };
  }
  return {
    opacity: clamp01(progress * 1.35),
    scale: [0.86 + eased * 0.14, 0.035 + eased * 0.965, 0.86 + eased * 0.14],
    rotationZ: progress >= 1 ? 0 : (1 - eased) * -0.08,
    complete: progress >= 1,
  };
}

export interface CameraPlan {
  readonly position: Vector3Tuple;
  readonly target: Vector3Tuple;
}

export function cameraPlanForScene(
  scene: Pick<SceneObjectV1, "bounds" | "cameraHint">,
): CameraPlan {
  const radius = Math.max(
    scene.bounds.width,
    scene.bounds.height,
    scene.bounds.depth,
  );
  const target: Vector3Tuple = [0, scene.bounds.height * 0.45, 0];
  switch (scene.cameraHint) {
    case "front":
      return {
        position: [0, scene.bounds.height * 0.55, radius * 1.8],
        target,
      };
    case "three-quarter":
      return {
        position: [radius * 1.15, scene.bounds.height * 0.75, radius * 1.35],
        target,
      };
    case "top":
      return {
        position: [0, Math.max(radius * 1.9, scene.bounds.height * 1.3), 0.01],
        target,
      };
    case "free":
      return {
        position: [radius * 1.3, scene.bounds.height * 0.9, radius * 1.55],
        target,
      };
  }
}

export function assertRendererSceneLimits(scene: SceneObjectV1): void {
  if (scene.nodes.length < 1 || scene.nodes.length > MAX_SCENE_NODES) {
    throw new SceneRendererInvariantError(
      `Scene node count ${scene.nodes.length} is outside renderer limits`,
    );
  }
  if (scene.lights.length > MAX_SCENE_LIGHTS) {
    throw new SceneRendererInvariantError(
      `Scene light count ${scene.lights.length} is outside renderer limits`,
    );
  }
  if (scene.palette.length < 1 || scene.palette.length > 8) {
    throw new SceneRendererInvariantError(
      `Scene palette count ${scene.palette.length} is outside renderer limits`,
    );
  }
  for (const node of scene.nodes) {
    if (node.kind === "particles" && node.count > 500) {
      throw new SceneRendererInvariantError(
        `Particle node ${node.id} exceeds renderer limits`,
      );
    }
    if (node.kind === "text" && node.text.length > 80) {
      throw new SceneRendererInvariantError(
        `Text node ${node.id} exceeds renderer limits`,
      );
    }
  }
  buildSceneNodeTree(scene.nodes);
}
