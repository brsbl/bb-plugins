import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import { smoothGeneratedGeometryNormals } from "./geometry-smoothing";
import { applySceneColor } from "./scene-color";
import type {
  SceneNodeV1,
  SceneObject,
  SceneObjectV1,
  SceneObjectV2,
} from "./scene-contract";
import {
  FALLBACK_THEME_PALETTE,
  RendererResourceRegistry,
  SceneRendererInvariantError,
  assertRendererSceneLimits,
  buildSceneNodeTree,
  cameraPlanForScene,
  createParticlePositions,
  evaluateMotion,
  evaluateReveal,
  mapMaterial,
  mapMeshGeometry,
  resolveMonochromeScenePalette,
  toMonochromeThemePalette,
  type MaterialPlan,
  type SceneNodeTree,
  type SceneThemePalette,
  type SceneThemeToken,
  type Vector3Tuple,
} from "./renderer-logic";

const CSS_VARIABLE_BY_TOKEN = {
  "theme:ink": "--ink",
  "theme:canvas": "--canvas",
  "theme:accent": "--accent",
  "theme:muted": "--muted",
  "theme:success": "--success",
  "theme:warning": "--warning",
  "theme:danger": "--destructive",
} as const satisfies Record<SceneThemeToken, string>;

const MAX_GEOMETRY_VERTICES = 40_000;
const TEXTURE_SIZE = 128;

export interface SceneRenderObject {
  readonly scene: SceneObject;
  readonly position?: Vector3Tuple;
  readonly rotation?: Vector3Tuple;
  readonly scale?: number | Vector3Tuple;
  readonly reveal?: boolean;
  readonly probeOnly?: boolean;
  readonly revisionKey?: string | number;
}

export type SceneTintToken = "blue" | "green" | "orange" | "red";

const SCENE_TINT_COLORS: Readonly<Record<SceneTintToken, string>> = {
  blue: "#2f6df6",
  green: "#21a568",
  orange: "#ed8a1e",
  red: "#d43f4b",
};

export type SceneRenderProbeEvent =
  | {
      readonly status: "ready";
      readonly jobId: string;
      readonly objectId: string;
      readonly nodeCount: number;
    }
  | {
      readonly status: "failed";
      readonly jobId: string;
      readonly objectId: string;
      readonly userMessage: "This interpretation could not be rendered here.";
      readonly diagnostic: string;
    };

export interface SceneRendererProps {
  readonly objects: readonly SceneRenderObject[];
  readonly sceneTint?: SceneTintToken | null;
  readonly onSelectObject?: (objectId: string | null) => void;
  readonly onRenderProbe?: (event: SceneRenderProbeEvent) => void;
  readonly onRevealComplete?: (objectId: string) => void;
  readonly onContextLost?: () => void;
  readonly onContextRestored?: () => void;
  readonly reducedMotion?: boolean;
  readonly enableOrbitControls?: boolean;
  readonly className?: string;
  readonly style?: CSSProperties;
  readonly fallback?: ReactNode;
}

interface AnimationRecord {
  readonly item: SceneRenderObject;
  readonly outer: THREE.Group;
  readonly animated: THREE.Group;
  ready: boolean;
  failed: boolean;
  revealStartedAt: number | null;
  revealAnnounced: boolean;
}

interface RendererCallbacks {
  onSelectObject?: (objectId: string | null) => void;
  onRenderProbe?: (event: SceneRenderProbeEvent) => void;
  onRevealComplete?: (objectId: string) => void;
  onContextLost?: () => void;
  onContextRestored?: () => void;
}

function rgbStringToHex(value: string): string | null {
  if (typeof document === "undefined" || value.trim() === "") return null;
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return null;
  context.clearRect(0, 0, 1, 1);
  const sentinel = "#ff00fe";
  context.fillStyle = sentinel;
  context.fillStyle = value;
  if (context.fillStyle === sentinel) return null;
  context.fillRect(0, 0, 1, 1);
  const [red, green, blue, alpha] = context.getImageData(0, 0, 1, 1).data;
  if (alpha === 0) return null;
  return `#${[red, green, blue]
    .map((channel) => channel.toString(16).padStart(2, "0"))
    .join("")}`;
}

function readHostThemePalette(): SceneThemePalette {
  if (
    typeof document === "undefined" ||
    typeof getComputedStyle === "undefined"
  ) {
    return FALLBACK_THEME_PALETTE;
  }
  const parent = document.body ?? document.documentElement;
  const probe = document.createElement("span");
  probe.setAttribute("aria-hidden", "true");
  probe.style.cssText =
    "position:fixed;left:-10000px;top:-10000px;visibility:hidden;pointer-events:none";
  parent.appendChild(probe);
  try {
    const entries = Object.entries(CSS_VARIABLE_BY_TOKEN).map(
      ([token, variable]) => {
        probe.style.color = `var(${variable})`;
        const resolved = getComputedStyle(probe).color;
        return [
          token,
          rgbStringToHex(resolved) ??
            FALLBACK_THEME_PALETTE[token as SceneThemeToken],
        ] as const;
      },
    );
    return Object.fromEntries(entries) as SceneThemePalette;
  } finally {
    probe.remove();
  }
}

function sameThemePalette(
  left: SceneThemePalette,
  right: SceneThemePalette,
): boolean {
  return (Object.keys(CSS_VARIABLE_BY_TOKEN) as SceneThemeToken[]).every(
    (token) => left[token] === right[token],
  );
}

function mixColor(left: string, right: string, amount: number): string {
  return `#${new THREE.Color(left)
    .lerp(new THREE.Color(right), amount)
    .getHexString(THREE.SRGBColorSpace)}`;
}

function brighterAnchor(palette: SceneThemePalette): string {
  const ink = new THREE.Color(palette["theme:ink"]);
  const canvas = new THREE.Color(palette["theme:canvas"]);
  return ink.getStyle().length > 0 &&
    ink.getHSL({ h: 0, s: 0, l: 0 }).l > canvas.getHSL({ h: 0, s: 0, l: 0 }).l
    ? palette["theme:ink"]
    : palette["theme:canvas"];
}

function stageColors(palette: SceneThemePalette) {
  const bright = brighterAnchor(palette);
  return {
    background: mixColor(
      palette["theme:canvas"],
      palette["theme:warning"],
      0.07,
    ),
    ground: mixColor(palette["theme:canvas"], palette["theme:success"], 0.14),
    key: mixColor(bright, palette["theme:warning"], 0.12),
    sky: mixColor(bright, palette["theme:accent"], 0.18),
    bounce: mixColor(bright, palette["theme:success"], 0.18),
  };
}

function useHostThemePalette(): SceneThemePalette {
  const [palette, setPalette] = useState<SceneThemePalette>(() =>
    readHostThemePalette(),
  );
  useEffect(() => {
    if (typeof document === "undefined") return;
    const update = () => {
      const next = readHostThemePalette();
      setPalette((current) =>
        sameThemePalette(current, next) ? current : next,
      );
    };
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: [
        "class",
        "style",
        "data-theme",
        "data-theme-preference",
      ],
    });
    const colorScheme = window.matchMedia("(prefers-color-scheme: dark)");
    colorScheme.addEventListener("change", update);
    return () => {
      observer.disconnect();
      colorScheme.removeEventListener("change", update);
    };
  }, []);
  return palette;
}

function usePrefersReducedMotion(override: boolean | undefined): boolean {
  const [preferred, setPreferred] = useState(() =>
    typeof window === "undefined"
      ? false
      : window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setPreferred(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  return override ?? preferred;
}

function register<T extends { dispose(): void }>(
  registry: RendererResourceRegistry,
  resource: T,
): T {
  registry.register(resource);
  return resource;
}

function createMeshMaterial(
  plan: MaterialPlan,
  color: string,
  initiallyHidden: boolean,
  doubleSided: boolean,
): THREE.Material {
  const opacity = initiallyHidden ? 0 : plan.opacity;
  const common = {
    color,
    opacity,
    transparent: plan.transparent || initiallyHidden,
    depthWrite: initiallyHidden ? false : plan.depthWrite,
    side: doubleSided ? THREE.DoubleSide : THREE.FrontSide,
  };
  let material: THREE.Material;
  switch (plan.kind) {
    case "standard":
      material = new THREE.MeshStandardMaterial({
        ...common,
        roughness: plan.roughness,
        metalness: plan.metalness,
        emissive: plan.emissiveIntensity ? color : "#000000",
        emissiveIntensity: plan.emissiveIntensity ?? 0,
      });
      break;
    case "physical":
      material = new THREE.MeshPhysicalMaterial({
        ...common,
        roughness: plan.roughness,
        metalness: plan.metalness,
        transmission: plan.transmission,
        thickness: plan.thickness,
        ior: 1.42,
      });
      break;
    case "toon":
      material = new THREE.MeshToonMaterial(common);
      break;
  }
  material.userData.sceneseedBaseOpacity = plan.opacity;
  material.userData.sceneseedTransparent = plan.transparent;
  material.userData.sceneseedDepthWrite = plan.depthWrite;
  return material;
}

function assertFiniteGeometry(geometry: THREE.BufferGeometry): void {
  const positions = geometry.getAttribute("position");
  if (!positions || positions.count > MAX_GEOMETRY_VERTICES) {
    throw new SceneRendererInvariantError(
      `Geometry contains ${positions?.count ?? 0} vertices; renderer limit is ${MAX_GEOMETRY_VERTICES}`,
    );
  }
  for (let index = 0; index < positions.array.length; index += 1) {
    if (!Number.isFinite(positions.array[index])) {
      throw new SceneRendererInvariantError(
        "Geometry contains a non-finite vertex",
      );
    }
  }
  geometry.computeBoundingSphere();
  if (
    !geometry.boundingSphere ||
    !Number.isFinite(geometry.boundingSphere.radius)
  ) {
    throw new SceneRendererInvariantError(
      "Geometry bounds could not be computed",
    );
  }
}

function createMeshGeometry(node: Extract<SceneNodeV1, { kind: "mesh" }>): {
  geometry: THREE.BufferGeometry;
  scale: Vector3Tuple;
  rotation: Vector3Tuple;
} {
  const plan = mapMeshGeometry(node);
  let geometry: THREE.BufferGeometry;
  switch (plan.kind) {
    case "box":
      geometry = new RoundedBoxGeometry(
        ...(plan.args as [number, number, number, number, number]),
      );
      break;
    case "sphere":
      geometry = new THREE.SphereGeometry(
        ...(plan.args as [number, number, number]),
      );
      break;
    case "cylinder":
      geometry = new THREE.CylinderGeometry(
        plan.args[0],
        plan.args[1],
        plan.args[2],
        plan.args[3],
        plan.args[4],
        Boolean(plan.args[5]),
      );
      break;
    case "cone":
      geometry = new THREE.ConeGeometry(
        plan.args[0],
        plan.args[1],
        plan.args[2],
        plan.args[3],
        Boolean(plan.args[4]),
      );
      break;
    case "torus":
      geometry = new THREE.TorusGeometry(
        ...(plan.args as [number, number, number, number]),
      );
      break;
    case "capsule":
      geometry = new THREE.CapsuleGeometry(
        ...(plan.args as [number, number, number, number]),
      );
      break;
    case "plane":
      geometry = new THREE.PlaneGeometry(
        ...(plan.args as [number, number, number, number]),
      );
      break;
  }
  assertFiniteGeometry(geometry);
  return { geometry, scale: plan.localScale, rotation: plan.localRotation };
}

function createExtrudedGeometry(
  node: Extract<SceneNodeV1, { kind: "extrudedShape" }>,
): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  const [first, ...rest] = node.points;
  shape.moveTo(first[0], first[1]);
  for (const [x, y] of rest) shape.lineTo(x, y);
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: node.depth,
    bevelEnabled: false,
    curveSegments: 2,
    steps: 1,
  });
  geometry.translate(0, 0, -node.depth / 2);
  assertFiniteGeometry(geometry);
  return geometry;
}

function textFont(
  font: Extract<SceneNodeV1, { kind: "text" }>["font"],
): string {
  switch (font) {
    case "sans":
      return "ui-sans-serif, system-ui, sans-serif";
    case "serif":
      return "ui-serif, Georgia, serif";
    case "mono":
      return "ui-monospace, SFMono-Regular, Menlo, monospace";
  }
}

function createTextMesh(
  node: Extract<SceneNodeV1, { kind: "text" }>,
  color: string,
  materialPlan: MaterialPlan,
  initiallyHidden: boolean,
  registry: RendererResourceRegistry,
): THREE.Mesh {
  const canvas = document.createElement("canvas");
  const initialContext = canvas.getContext("2d");
  if (!initialContext) {
    throw new SceneRendererInvariantError(
      "The bundled text renderer is unavailable",
    );
  }
  const family = textFont(node.font);
  initialContext.font = `700 96px ${family}`;
  const initialWidth = Math.max(1, initialContext.measureText(node.text).width);
  const fontSize = Math.max(
    18,
    Math.min(96, Math.floor((1_920 / initialWidth) * 96)),
  );
  initialContext.font = `700 ${fontSize}px ${family}`;
  const measuredWidth = initialContext.measureText(node.text).width;
  canvas.width = Math.max(64, Math.min(2_048, Math.ceil(measuredWidth + 32)));
  canvas.height = 128;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new SceneRendererInvariantError(
      "The bundled text renderer is unavailable",
    );
  }
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.font = `700 ${fontSize}px ${family}`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillStyle = color;
  context.fillText(node.text, canvas.width / 2, canvas.height / 2);

  const texture = register(registry, new THREE.CanvasTexture(canvas));
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  const aspect = canvas.width / canvas.height;
  const geometry = register(
    registry,
    new THREE.PlaneGeometry(node.size * aspect, node.size, 1, 1),
  );
  assertFiniteGeometry(geometry);
  const material = register(
    registry,
    new THREE.MeshBasicMaterial({
      map: texture,
      color: "#ffffff",
      opacity: initiallyHidden ? 0 : materialPlan.opacity,
      transparent: true,
      depthWrite: false,
      alphaTest: 0.02,
      side: THREE.DoubleSide,
      toneMapped: false,
    }),
  );
  material.userData.sceneseedBaseOpacity = materialPlan.opacity;
  material.userData.sceneseedTransparent = true;
  material.userData.sceneseedDepthWrite = false;
  return new THREE.Mesh(geometry, material);
}

function createParticlePoints(
  node: Extract<SceneNodeV1, { kind: "particles" }>,
  color: string,
  materialPlan: MaterialPlan,
  initiallyHidden: boolean,
  registry: RendererResourceRegistry,
): THREE.Points {
  const geometry = register(registry, new THREE.BufferGeometry());
  geometry.setAttribute(
    "position",
    new THREE.BufferAttribute(createParticlePositions(node), 3),
  );
  assertFiniteGeometry(geometry);
  const material = register(
    registry,
    new THREE.PointsMaterial({
      color,
      size: node.size,
      sizeAttenuation: true,
      opacity: initiallyHidden ? 0 : materialPlan.opacity,
      transparent: true,
      depthWrite: false,
      toneMapped: materialPlan.kind !== "toon",
    }),
  );
  material.userData.sceneseedBaseOpacity = materialPlan.opacity;
  material.userData.sceneseedTransparent = true;
  material.userData.sceneseedDepthWrite = false;
  const points = new THREE.Points(geometry, material);
  points.userData.sceneseedParticlePreset = node.preset;
  return points;
}

function createRenderNode(
  tree: SceneNodeTree,
  palette: readonly string[],
  materialPlan: MaterialPlan,
  initiallyHidden: boolean,
  registry: RendererResourceRegistry,
): THREE.Group {
  const { node, children } = tree;
  const group = new THREE.Group();
  group.position.set(...node.position);
  group.rotation.set(...node.rotation);
  group.scale.set(...node.scale);
  group.userData.sceneseedNodeId = node.id;
  group.userData.sceneseedNodeKind = node.kind;

  if (node.kind !== "group") {
    const color = palette[node.paletteIndex];
    if (!color) {
      throw new SceneRendererInvariantError(
        `Scene node ${node.id} refers to a missing palette entry`,
      );
    }
    let renderable: THREE.Object3D;
    if (node.kind === "mesh") {
      const planned = createMeshGeometry(node);
      const geometry = register(registry, planned.geometry);
      const material = register(
        registry,
        createMeshMaterial(
          materialPlan,
          color,
          initiallyHidden,
          node.geometry === "plane",
        ),
      );
      const mesh = new THREE.Mesh(geometry, material);
      mesh.rotation.set(...planned.rotation);
      mesh.scale.set(...planned.scale);
      mesh.castShadow = materialPlan.kind !== "physical";
      mesh.receiveShadow = true;
      renderable = mesh;
    } else if (node.kind === "extrudedShape") {
      const geometry = register(registry, createExtrudedGeometry(node));
      const material = register(
        registry,
        createMeshMaterial(materialPlan, color, initiallyHidden, false),
      );
      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = materialPlan.kind !== "physical";
      mesh.receiveShadow = true;
      renderable = mesh;
    } else if (node.kind === "text") {
      renderable = createTextMesh(
        node,
        color,
        materialPlan,
        initiallyHidden,
        registry,
      );
    } else {
      renderable = createParticlePoints(
        node,
        color,
        materialPlan,
        initiallyHidden,
        registry,
      );
    }
    renderable.userData.sceneseedNodeId = node.id;
    group.add(renderable);
  }

  for (const child of children) {
    group.add(
      createRenderNode(child, palette, materialPlan, initiallyHidden, registry),
    );
  }
  return group;
}

function createShadowTexture(softness: number): THREE.DataTexture {
  const bytes = new Uint8Array(TEXTURE_SIZE * TEXTURE_SIZE * 4);
  const exponent = 1 + (1 - softness) * 4;
  for (let y = 0; y < TEXTURE_SIZE; y += 1) {
    for (let x = 0; x < TEXTURE_SIZE; x += 1) {
      const nx = ((x + 0.5) / TEXTURE_SIZE) * 2 - 1;
      const ny = ((y + 0.5) / TEXTURE_SIZE) * 2 - 1;
      const distance = Math.min(1, Math.sqrt(nx * nx + ny * ny));
      const alpha = Math.pow(1 - distance, exponent);
      const offset = (y * TEXTURE_SIZE + x) * 4;
      bytes[offset] = 255;
      bytes[offset + 1] = 255;
      bytes[offset + 2] = 255;
      bytes[offset + 3] = Math.round(alpha * 255);
    }
  }
  const texture = new THREE.DataTexture(
    bytes,
    TEXTURE_SIZE,
    TEXTURE_SIZE,
    THREE.RGBAFormat,
    THREE.UnsignedByteType,
  );
  texture.needsUpdate = true;
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}

function createContactShadow(
  scene: SceneObject,
  color: string,
  visible: boolean,
  registry: RendererResourceRegistry,
): THREE.Mesh {
  const texture = register(
    registry,
    createShadowTexture(
      Math.min(0.5, scene.ground.contactShadow.softness),
    ),
  );
  const geometry = register(
    registry,
    new THREE.PlaneGeometry(
      scene.bounds.width * 1.06,
      scene.bounds.depth * 1.06,
      1,
      1,
    ),
  );
  const material = register(
    registry,
    new THREE.MeshBasicMaterial({
      color,
      map: texture,
      opacity: Math.min(0.78, scene.ground.contactShadow.strength * 0.72),
      transparent: true,
      depthWrite: false,
      toneMapped: false,
    }),
  );
  const shadow = new THREE.Mesh(geometry, material);
  shadow.position.y = 0.008;
  shadow.rotation.x = -Math.PI / 2;
  shadow.renderOrder = -1;
  shadow.visible = visible;
  shadow.raycast = () => undefined;
  return shadow;
}

function addLocalLights(
  root: THREE.Group,
  scene: SceneObjectV1,
  palette: readonly string[],
  suppressed: boolean,
): void {
  for (const light of scene.lights) {
    const color = palette[light.paletteIndex];
    if (!color) {
      throw new SceneRendererInvariantError(
        `Scene light ${light.id} refers to a missing palette entry`,
      );
    }
    const next =
      light.kind === "point"
        ? new THREE.PointLight(
            color,
            suppressed ? 0 : light.intensity,
            light.range,
            2,
          )
        : new THREE.SpotLight(
            color,
            suppressed ? 0 : light.intensity,
            light.range,
            Math.PI / 5,
            0.65,
            2,
          );
    next.position.set(...light.position);
    next.castShadow = false;
    next.userData.sceneseedLightId = light.id;
    root.add(next);
  }
}

function createGeneratedThreeObject(
  scene: SceneObjectV2,
  initiallyHidden: boolean,
  registry: RendererResourceRegistry,
): THREE.Object3D {
  const loader = new THREE.ObjectLoader();
  const root = loader.parse(
    scene.objectJson as unknown as Parameters<typeof loader.parse>[0],
  );
  const resources = new Set<THREE.BufferGeometry | THREE.Material | THREE.Texture>();
  const optimizedMaterials = new Map<THREE.Material, THREE.Material>();
  const smoothedGeometries = new Set<THREE.BufferGeometry>();

  const optimizeMaterial = (material: THREE.Material): THREE.Material => {
    if (!(material instanceof THREE.MeshStandardMaterial)) return material;
    const cached = optimizedMaterials.get(material);
    if (cached) return cached;

    // PBR shader compilation is disproportionately expensive in software
    // WebGL. A Phong finish preserves the authored glossy/glass read without
    // making the first visible frame compile the full PBR pipeline.
    const transmission =
      material instanceof THREE.MeshPhysicalMaterial
        ? material.transmission
        : 0;
    const isGlass = transmission > 0.01 || material.transparent;
    const optimized = new THREE.MeshPhongMaterial({
      color: material.color,
      emissive: material.emissive,
      emissiveIntensity: material.emissiveIntensity,
      specular: 0xbebebe,
      shininess: Math.max(
        48,
        Math.min(84, Math.round((1 - material.roughness) * 96)),
      ),
      opacity: isGlass ? Math.min(material.opacity, 0.84) : material.opacity,
      transparent: isGlass || material.transparent,
      depthTest: material.depthTest,
      depthWrite: isGlass ? false : material.depthWrite,
      side: material.side,
      vertexColors: material.vertexColors,
      flatShading: false,
      wireframe: material.wireframe,
      fog: material.fog,
    });
    optimized.name = material.name;
    optimized.visible = material.visible;
    optimized.toneMapped = material.toneMapped;
    optimized.alphaTest = material.alphaTest;
    optimized.premultipliedAlpha = material.premultipliedAlpha;
    optimized.dithering = material.dithering;
    optimized.userData = { ...material.userData };
    optimizedMaterials.set(material, optimized);
    return optimized;
  };

  root.traverse((object) => {
    if (object instanceof THREE.Light) {
      object.userData.sceneseedBaseIntensity = object.intensity;
      if (initiallyHidden) object.intensity = 0;
    }
    if (!("geometry" in object || "material" in object)) return;
    const renderable = object as THREE.Object3D & {
      geometry?: THREE.BufferGeometry;
      material?: THREE.Material | THREE.Material[];
    };
    if (renderable.geometry instanceof THREE.BufferGeometry) {
      assertFiniteGeometry(renderable.geometry);
      if (!smoothedGeometries.has(renderable.geometry)) {
        smoothGeneratedGeometryNormals(renderable.geometry);
        smoothedGeometries.add(renderable.geometry);
      }
      resources.add(renderable.geometry);
    }
    const sourceMaterials =
      renderable.material === undefined
        ? []
        : Array.isArray(renderable.material)
          ? renderable.material
          : [renderable.material];
    const materials = sourceMaterials.map(optimizeMaterial);
    if (renderable.material !== undefined) {
      if (Array.isArray(renderable.material)) {
        renderable.material = materials;
      } else {
        renderable.material = materials[0] ?? renderable.material;
      }
    }
    for (const sourceMaterial of sourceMaterials) {
      resources.add(sourceMaterial);
      for (const value of Object.values(sourceMaterial)) {
        if (value instanceof THREE.Texture) resources.add(value);
      }
    }
    for (const material of materials) {
      material.userData.sceneseedBaseOpacity = material.opacity;
      material.userData.sceneseedTransparent = material.transparent;
      material.userData.sceneseedDepthWrite = material.depthWrite;
      if (initiallyHidden) {
        material.opacity = 0;
        material.transparent = true;
        material.depthWrite = false;
      }
      resources.add(material);
      for (const value of Object.values(material)) {
        if (value instanceof THREE.Texture) resources.add(value);
      }
    }
  });
  for (const resource of resources) registry.register(resource);
  return root;
}

function applyRenderProbeMaterials(
  root: THREE.Object3D,
  registry: RendererResourceRegistry,
): void {
  const meshMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    toneMapped: false,
  });
  const lineMaterial = new THREE.LineBasicMaterial({
    color: 0xffffff,
    toneMapped: false,
  });
  const pointsMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 1,
    toneMapped: false,
  });
  registry.register(meshMaterial);
  registry.register(lineMaterial);
  registry.register(pointsMaterial);

  root.traverse((object) => {
    object.castShadow = false;
    object.receiveShadow = false;
    object.frustumCulled = false;
    if (object instanceof THREE.Light) {
      object.visible = false;
    } else if (object instanceof THREE.Mesh) {
      object.material = meshMaterial;
    } else if (object instanceof THREE.Line) {
      object.material = lineMaterial;
    } else if (object instanceof THREE.Points) {
      object.material = pointsMaterial;
    }
  });
}

function forEachSceneMaterial(
  root: THREE.Object3D,
  callback: (material: THREE.Material, baseOpacity: number) => void,
): void {
  root.traverse((object) => {
    if (
      !(
        object instanceof THREE.Mesh ||
        object instanceof THREE.Points ||
        object instanceof THREE.Line
      )
    )
      return;
    const materials = Array.isArray(object.material)
      ? object.material
      : [object.material];
    for (const material of materials) {
      const baseOpacity = material.userData.sceneseedBaseOpacity;
      if (typeof baseOpacity === "number") callback(material, baseOpacity);
    }
  });
}

function applyMaterialOpacity(root: THREE.Object3D, multiplier: number): void {
  forEachSceneMaterial(root, (material, baseOpacity) => {
    const nextOpacity = Math.max(0, Math.min(1, baseOpacity * multiplier));
    const originalTransparent = material.userData.sceneseedTransparent === true;
    const nextTransparent = originalTransparent || nextOpacity < 0.999;
    if (material.transparent !== nextTransparent) {
      material.transparent = nextTransparent;
      material.needsUpdate = true;
    }
    material.opacity = nextOpacity;
    material.depthWrite =
      material.userData.sceneseedDepthWrite === true && nextOpacity >= 0.999;
  });
  root.traverse((object) => {
    if (!(object instanceof THREE.Light)) return;
    const baseIntensity = object.userData.sceneseedBaseIntensity;
    if (typeof baseIntensity === "number") {
      object.intensity = Math.max(0, baseIntensity * multiplier);
    }
  });
}

function applySceneFinish(root: THREE.Object3D): void {
  root.traverse((object) => {
    if (
      !(
        object instanceof THREE.Mesh ||
        object instanceof THREE.Points ||
        object instanceof THREE.Line
      )
    )
      return;
    const materials = Array.isArray(object.material)
      ? object.material
      : [object.material];
    for (const material of materials) {
      if (material instanceof THREE.MeshPhysicalMaterial) {
        material.roughness = Math.min(material.roughness, 0.32);
        material.clearcoat = Math.max(material.clearcoat, 0.58);
        material.clearcoatRoughness = Math.min(
          material.clearcoatRoughness,
          0.22,
        );
        material.envMapIntensity = Math.max(material.envMapIntensity, 1.15);
      } else if (material instanceof THREE.MeshStandardMaterial) {
        material.roughness = Math.min(material.roughness, 0.42);
        material.envMapIntensity = Math.max(material.envMapIntensity, 1.08);
      } else if (material instanceof THREE.MeshPhongMaterial) {
        material.shininess = Math.max(material.shininess, 48);
        material.flatShading = false;
      } else if (material instanceof THREE.MeshLambertMaterial) {
        material.flatShading = false;
      }
      material.needsUpdate = true;
    }
  });
}

function zoomPercentForDistance(
  distance: number,
  minDistance: number,
  maxDistance: number,
): number {
  const bounded = Math.max(minDistance, Math.min(maxDistance, distance));
  const progress =
    1 -
    Math.log(bounded / minDistance) / Math.log(maxDistance / minDistance);
  return Math.round(Math.max(0, Math.min(1, progress)) * 100);
}

function objectScale(item: SceneRenderObject): Vector3Tuple {
  if (typeof item.scale === "number") {
    return [item.scale, item.scale, item.scale];
  }
  return item.scale ?? [1, 1, 1];
}

function diagnosticMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Maps retained SceneObjectV1 values to primitives and parses serialized
 * agent-authored Three.js objects for SceneObjectV2. Generated source runs on
 * the server for the explicit prompt action; the browser receives only finite
 * Three.js object JSON and never evaluates source text.
 */
export function SceneRenderer({
  objects,
  sceneTint = null,
  onSelectObject,
  onRenderProbe,
  onRevealComplete,
  onContextLost,
  onContextRestored,
  reducedMotion: reducedMotionOverride,
  enableOrbitControls = true,
  className,
  style,
  fallback = null,
}: SceneRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const renderRequestedRef = useRef(true);
  const framedSceneKeyRef = useRef("");
  const objectContainerRef = useRef<THREE.Group | null>(null);
  const animationsRef = useRef<AnimationRecord[]>([]);
  const objectRegistry = useMemo(() => new RendererResourceRegistry(), []);
  const callbacksRef = useRef<RendererCallbacks>({});
  callbacksRef.current = {
    onSelectObject,
    onRenderProbe,
    onRevealComplete,
    onContextLost,
    onContextRestored,
  };
  const [rendererAvailable, setRendererAvailable] = useState(true);
  const [rendererReadyVersion, setRendererReadyVersion] = useState(0);
  const [zoomPercent, setZoomPercent] = useState(50);
  const hostThemePalette = useHostThemePalette();
  const themePalette = useMemo(
    () => toMonochromeThemePalette(hostThemePalette),
    [hostThemePalette],
  );
  const reducedMotion = usePrefersReducedMotion(reducedMotionOverride);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Development Strict Mode recreates the renderer while preserving refs.
    // The replacement camera must frame the active scene again.
    framedSceneKeyRef.current = "";
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: false,
        antialias: true,
        powerPreference: "high-performance",
        preserveDrawingBuffer: false,
      });
    } catch {
      setRendererAvailable(false);
      return;
    }
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.AgXToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    const initialStageColors = stageColors(themePalette);
    scene.background = new THREE.Color(initialStageColors.background);
    scene.fog = new THREE.Fog(initialStageColors.background, 24, 58);
    sceneRef.current = scene;
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 240);
    camera.position.set(7, 5.2, 8);
    camera.lookAt(0, 1.4, 0);
    cameraRef.current = camera;

    const objectContainer = new THREE.Group();
    objectContainer.name = "SceneSeed objects";
    scene.add(objectContainer);
    objectContainerRef.current = objectContainer;

    const ambient = new THREE.AmbientLight(initialStageColors.key, 0.72);
    ambient.userData.sceneseedHostAmbient = true;
    scene.add(ambient);
    const hemisphere = new THREE.HemisphereLight(
      initialStageColors.sky,
      initialStageColors.bounce,
      1.05,
    );
    hemisphere.userData.sceneseedHostHemisphere = true;
    scene.add(hemisphere);
    const directional = new THREE.DirectionalLight(
      initialStageColors.key,
      2.25,
    );
    directional.position.set(8, 12, 7);
    directional.castShadow = true;
    directional.shadow.mapSize.set(1024, 1024);
    directional.shadow.camera.left = -10;
    directional.shadow.camera.right = 10;
    directional.shadow.camera.top = 10;
    directional.shadow.camera.bottom = -10;
    directional.shadow.camera.near = 0.5;
    directional.shadow.camera.far = 45;
    directional.shadow.bias = -0.00045;
    directional.shadow.normalBias = 0.018;
    directional.userData.sceneseedHostDirectional = true;
    scene.add(directional);
    const rim = new THREE.DirectionalLight(initialStageColors.sky, 1.05);
    rim.position.set(-7, 8, -9);
    rim.userData.sceneseedHostRim = true;
    scene.add(rim);

    const groundGeometry = new THREE.PlaneGeometry(160, 160, 1, 1);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: initialStageColors.ground,
      roughness: 1,
      metalness: 0,
      depthWrite: true,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    ground.userData.sceneseedHostGround = true;
    scene.add(ground);

    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = true;
    controls.minDistance = 4;
    controls.maxDistance = 80;
    controls.minPolarAngle = 0.08;
    controls.maxPolarAngle = Math.PI / 2 - 0.025;
    controls.target.set(0, 1.4, 0);
    controls.enabled = enableOrbitControls;
    controls.update();
    controlsRef.current = controls;
    setRendererReadyVersion((current) => current + 1);
    const updateZoomPercent = () => {
      renderRequestedRef.current = true;
      const distance = camera.position.distanceTo(controls.target);
      const next = zoomPercentForDistance(
        distance,
        controls.minDistance,
        controls.maxDistance,
      );
      setZoomPercent((current) => (current === next ? current : next));
    };
    controls.addEventListener("change", updateZoomPercent);
    updateZoomPercent();

    const resize = () => {
      const width = Math.max(1, canvas.clientWidth);
      const height = Math.max(1, canvas.clientHeight);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderRequestedRef.current = true;
    };
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const selectAtPointer = (event: PointerEvent) => {
      if (event.button !== 0) return;
      const bounds = canvas.getBoundingClientRect();
      if (bounds.width === 0 || bounds.height === 0) return;
      pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
      pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const intersections = raycaster.intersectObjects(
        objectContainer.children,
        true,
      );
      for (const intersection of intersections) {
        let candidate: THREE.Object3D | null = intersection.object;
        while (candidate && candidate !== objectContainer) {
          const objectId = candidate.userData.sceneseedObjectId;
          if (
            typeof objectId === "string" &&
            candidate.userData.sceneseedProbeOnly !== true
          ) {
            callbacksRef.current.onSelectObject?.(objectId);
            return;
          }
          candidate = candidate.parent;
        }
      }
      callbacksRef.current.onSelectObject?.(null);
    };
    canvas.addEventListener("pointerup", selectAtPointer);

    const contextLost = (event: Event) => {
      event.preventDefault();
      objectRegistry.disposeAll();
      renderer.renderLists.dispose();
      callbacksRef.current.onContextLost?.();
    };
    const contextRestored = () => {
      renderRequestedRef.current = true;
      callbacksRef.current.onContextRestored?.();
    };
    canvas.addEventListener("webglcontextlost", contextLost, false);
    canvas.addEventListener("webglcontextrestored", contextRestored, false);

    const clock = new THREE.Clock();
    let animationFrame = 0;
    const renderFrame = () => {
      const elapsed = clock.getElapsedTime();
      let needsContinuousRender = false;
      for (const record of animationsRef.current) {
        if (record.failed) continue;
        const { item, animated } = record;
        if (item.probeOnly === true) {
          animated.position.y = 0;
          animated.rotation.set(0, 0, 0);
          animated.scale.set(1, 1, 1);
          applyMaterialOpacity(animated, 0);
          continue;
        }
        const revealPending =
          item.reveal === true && record.revealAnnounced === false;
        if (!record.ready && revealPending) {
          applyMaterialOpacity(animated, 0);
          continue;
        }
        if (record.revealStartedAt === null) record.revealStartedAt = elapsed;
        const revealFrame =
          revealPending
            ? evaluateReveal(elapsed - record.revealStartedAt, reducedMotion)
            : {
                opacity: 1,
                scale: [1, 1, 1] as Vector3Tuple,
                rotationZ: 0,
                complete: true,
              };
        const motionFrame = reducedMotion
          ? evaluateMotion({ preset: "none", speed: 0, amplitude: 0 }, elapsed)
          : evaluateMotion(item.scene.motion, elapsed);
        animated.position.y = motionFrame.positionY;
        animated.rotation.y = motionFrame.rotationY;
        animated.rotation.z = revealFrame.rotationZ;
        animated.scale.set(
          revealFrame.scale[0] * motionFrame.scaleMultiplier,
          revealFrame.scale[1] * motionFrame.scaleMultiplier,
          revealFrame.scale[2] * motionFrame.scaleMultiplier,
        );
        applyMaterialOpacity(
          animated,
          revealFrame.opacity * motionFrame.opacityMultiplier,
        );
        needsContinuousRender ||=
          (revealPending && !revealFrame.complete) ||
          (item.scene.motion.preset !== "none" &&
            item.scene.motion.speed > 0 &&
            item.scene.motion.amplitude > 0);
        if (
          revealPending &&
          revealFrame.complete &&
          !record.revealAnnounced
        ) {
          record.revealAnnounced = true;
          callbacksRef.current.onRevealComplete?.(item.scene.objectId);
        }
      }
      const controlsChanged = controls.update();
      if (
        renderRequestedRef.current ||
        controlsChanged ||
        needsContinuousRender
      ) {
        renderer.render(scene, camera);
        renderRequestedRef.current = false;
      }
      animationFrame = requestAnimationFrame(renderFrame);
    };
    animationFrame = requestAnimationFrame(renderFrame);

    return () => {
      cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      canvas.removeEventListener("pointerup", selectAtPointer);
      canvas.removeEventListener("webglcontextlost", contextLost, false);
      canvas.removeEventListener(
        "webglcontextrestored",
        contextRestored,
        false,
      );
      objectRegistry.disposeAll();
      controls.removeEventListener("change", updateZoomPercent);
      controls.dispose();
      groundGeometry.dispose();
      groundMaterial.dispose();
      renderer.renderLists.dispose();
      renderer.dispose();
      animationsRef.current = [];
      controlsRef.current = null;
      objectContainerRef.current = null;
      cameraRef.current = null;
      sceneRef.current = null;
      rendererRef.current = null;
    };
  }, [objectRegistry]);

  useEffect(() => {
    if (controlsRef.current) controlsRef.current.enabled = enableOrbitControls;
  }, [enableOrbitControls]);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    const colors = stageColors(themePalette);
    scene.background = new THREE.Color(colors.background);
    if (scene.fog instanceof THREE.Fog) scene.fog.color.set(colors.background);
    scene.traverse((object) => {
      if (object.userData.sceneseedHostAmbient === true) {
        (object as THREE.AmbientLight).color.set(colors.key);
      } else if (object.userData.sceneseedHostHemisphere === true) {
        const hemisphere = object as THREE.HemisphereLight;
        hemisphere.color.set(colors.sky);
        hemisphere.groundColor.set(colors.bounce);
      } else if (object.userData.sceneseedHostDirectional === true) {
        (object as THREE.DirectionalLight).color.set(colors.key);
      } else if (object.userData.sceneseedHostRim === true) {
        (object as THREE.DirectionalLight).color.set(colors.sky);
      } else if (object.userData.sceneseedHostGround === true) {
        const ground = object as THREE.Mesh<
          THREE.BufferGeometry,
          THREE.MeshStandardMaterial
        >;
        ground.material.color.set(colors.ground);
      }
    });
    renderRequestedRef.current = true;
  }, [themePalette]);

  useEffect(() => {
    const renderer = rendererRef.current;
    const camera = cameraRef.current;
    const container = objectContainerRef.current;
    const hostScene = sceneRef.current;
    if (!renderer || !camera || !container || !hostScene) return;

    let cancelled = false;
    objectRegistry.disposeAll();
    container.clear();
    const records: AnimationRecord[] = [];
    const probing = objects.some((item) => item.probeOnly === true);

    for (const item of objects) {
      const { scene } = item;
      try {
        assertRendererSceneLimits(scene);
        const palette = resolveMonochromeScenePalette(scene, themePalette);
        const initiallyHidden = item.reveal === true && item.probeOnly !== true;
        const outer = new THREE.Group();
        outer.position.set(...(item.position ?? [0, 0, 0]));
        outer.rotation.set(...(item.rotation ?? [0, 0, 0]));
        outer.scale.set(...objectScale(item));
        outer.userData.sceneseedObjectId = scene.objectId;
        outer.userData.sceneseedJobId = scene.jobId;
        outer.userData.sceneseedAltText = scene.altText;
        outer.userData.sceneseedProbeOnly = item.probeOnly === true;
        outer.visible = !probing || item.probeOnly === true;
        outer.add(
          createContactShadow(
            scene,
            themePalette["theme:ink"],
            item.probeOnly !== true,
            objectRegistry,
          ),
        );

        const animated = new THREE.Group();
        if (scene.version === 1) {
          const materialPlan = mapMaterial(scene.material);
          addLocalLights(animated, scene, palette, item.probeOnly === true);
          for (const tree of buildSceneNodeTree(scene.nodes)) {
            animated.add(
              createRenderNode(
                tree,
                palette,
                materialPlan,
                initiallyHidden,
                objectRegistry,
              ),
            );
          }
        } else {
          animated.add(
            createGeneratedThreeObject(
              scene,
              initiallyHidden,
              objectRegistry,
            ),
          );
        }
        if (item.probeOnly === true) {
          applyRenderProbeMaterials(animated, objectRegistry);
        } else {
          applySceneColor(
            animated,
            sceneTint === null ? null : SCENE_TINT_COLORS[sceneTint],
          );
          applySceneFinish(animated);
        }
        outer.add(animated);
        container.add(outer);
        const record: AnimationRecord = {
          item,
          outer,
          animated,
          ready: false,
          failed: false,
          revealStartedAt: null,
          revealAnnounced: false,
        };
        records.push(record);

        const reportRenderFailure = (error: unknown) => {
          if (cancelled) return;
          record.failed = true;
          outer.visible = false;
          callbacksRef.current.onRenderProbe?.({
            status: "failed",
            jobId: scene.jobId,
            objectId: scene.objectId,
            userMessage: "This interpretation could not be rendered here.",
            diagnostic: diagnosticMessage(error),
          });
        };
        const reportRenderReady = () => {
          if (cancelled) return;
          record.ready = true;
          callbacksRef.current.onRenderProbe?.({
            status: "ready",
            jobId: scene.jobId,
            objectId: scene.objectId,
            nodeCount:
              scene.version === 1 ? scene.nodes.length : scene.stats.objects,
          });
        };

        if (item.probeOnly === true) {
          // Source execution, scene limits, ObjectLoader parsing, and finite
          // geometry checks have all succeeded by this point. A WebGL draw is
          // not part of candidate acceptance: software renderers can block one
          // frame beyond the realization lease and force the same scene to be
          // drawn twice. The accepted scene gets one real draw after cutover.
          queueMicrotask(reportRenderReady);
          continue;
        }
        try {
          requestAnimationFrame(() => {
            if (cancelled) return;
            try {
              if (item.reveal === true) {
                animated.position.y = 0;
                animated.rotation.set(0, 0, 0);
                animated.scale.set(1, 1, 1);
                applyMaterialOpacity(animated, 1);
              }
              renderer.render(hostScene, camera);
              reportRenderReady();
              if (item.reveal === true && !record.revealAnnounced) {
                record.revealAnnounced = true;
                callbacksRef.current.onRevealComplete?.(item.scene.objectId);
              }
            } catch (error: unknown) {
              reportRenderFailure(error);
            }
          });
        } catch (error: unknown) {
          reportRenderFailure(error);
        }
      } catch (error: unknown) {
        callbacksRef.current.onRenderProbe?.({
          status: "failed",
          jobId: scene.jobId,
          objectId: scene.objectId,
          userMessage: "This interpretation could not be rendered here.",
          diagnostic: diagnosticMessage(error),
        });
      }
    }
    const frameKey = objects
      .map(
        (item) =>
          `${item.revisionKey ?? item.scene.jobId}:${item.probeOnly === true ? "probe" : "scene"}`,
      )
      .join("|");
    if (records.length > 0 && frameKey !== framedSceneKeyRef.current) {
      let framed = false;
      container.updateMatrixWorld(true);
      const bounds = new THREE.Box3().setFromObject(container);
      if (!bounds.isEmpty()) {
        const sphere = bounds.getBoundingSphere(new THREE.Sphere());
        const controls = controlsRef.current;
        if (controls && Number.isFinite(sphere.radius) && sphere.radius > 0) {
          const verticalFov = THREE.MathUtils.degToRad(camera.fov);
          const horizontalFov =
            2 * Math.atan(Math.tan(verticalFov / 2) * camera.aspect);
          const limitingFov = Math.min(verticalFov, horizontalFov);
          const distance = Math.max(
            controls.minDistance,
            Math.min(
              controls.maxDistance,
              (sphere.radius / Math.sin(limitingFov / 2)) * 1.18,
            ),
          );
          const frontOnly = records.every(
            (record) => record.item.scene.cameraHint === "front",
          );
          controls.enableRotate = !frontOnly;
          const direction = frontOnly
            ? (() => {
                const plan = cameraPlanForScene(records[0]!.item.scene);
                return new THREE.Vector3(...plan.position).sub(
                  new THREE.Vector3(...plan.target),
                );
              })()
            : camera.position.clone().sub(controls.target);
          if (direction.lengthSq() === 0) direction.set(1, 0.6, 1);
          controls.target.copy(sphere.center);
          camera.position.copy(
            sphere.center.clone().add(direction.normalize().multiplyScalar(distance)),
          );
          controls.update();
          setZoomPercent(
            zoomPercentForDistance(
              camera.position.distanceTo(controls.target),
              controls.minDistance,
              controls.maxDistance,
            ),
          );
          framed = true;
        }
      }
      if (framed) framedSceneKeyRef.current = frameKey;
    }
    animationsRef.current = records;
    // Every visible record has one guarded first-render callback above. Keep
    // the animation loop from drawing that same first frame a second time;
    // an empty container still needs one paint to clear the previous scene.
    renderRequestedRef.current = records.length === 0;

    return () => {
      cancelled = true;
      animationsRef.current = [];
    };
  }, [
    hostThemePalette,
    objectRegistry,
    objects,
    reducedMotion,
    rendererReadyVersion,
    sceneTint,
    themePalette,
  ]);

  const zoomBy = (factor: number) => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls || !controls.enabled) return;
    const offset = camera.position.clone().sub(controls.target);
    const currentDistance = offset.length();
    if (currentDistance <= 0) return;
    const nextDistance = Math.max(
      controls.minDistance,
      Math.min(controls.maxDistance, currentDistance * factor),
    );
    camera.position.copy(
      controls.target.clone().add(offset.setLength(nextDistance)),
    );
    controls.update();
  };

  if (!rendererAvailable) {
    return (
      <div className={className} style={style}>
        {fallback}
      </div>
    );
  }

  return (
    <div className={className} style={style}>
      <canvas
        ref={canvasRef}
        className="sceneseed-webgl-canvas"
        aria-label="Protofetti canvas"
      />
      {objects.some((item) => item.probeOnly !== true) ? (
        <div className="sceneseed-zoom-controls" aria-label="Canvas zoom">
          <button
            type="button"
            aria-label="Zoom in"
            title="Zoom in"
            disabled={!enableOrbitControls || zoomPercent >= 100}
            onClick={() => zoomBy(0.82)}
          >
            +
          </button>
          <div
            className="sceneseed-zoom-level"
            role="meter"
            aria-label="Zoom level"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={zoomPercent}
            aria-valuetext={`${zoomPercent}%`}
          >
            <span style={{ height: `${zoomPercent}%` }} />
            <i style={{ bottom: `calc(${zoomPercent}% - 0.18rem)` }} />
          </div>
          <button
            type="button"
            aria-label="Zoom out"
            title="Zoom out"
            disabled={!enableOrbitControls || zoomPercent <= 0}
            onClick={() => zoomBy(1.22)}
          >
            &minus;
          </button>
        </div>
      ) : null}
    </div>
  );
}
