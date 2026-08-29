import { createContext, Script } from "node:vm";
import * as THREE from "three";
import { z } from "zod";

import {
  MAX_GENERATED_SCENE_JSON_BYTES,
  MAX_GENERATED_SCENE_LIGHTS,
  MAX_GENERATED_SCENE_MATERIALS,
  MAX_GENERATED_SCENE_OBJECTS,
  MAX_GENERATED_SCENE_VERTICES,
  SceneContractError,
  normalizeSceneObject,
  type SceneContractIssue,
  type SceneObjectV2,
} from "./scene-contract.js";

const MAX_SOURCE_LENGTH = 24_000;
const EXECUTION_TIMEOUT_MS = 2_000;
const TARGET_SCENE_SPAN = 16;

const visibleTextSchema = (maximum: number) =>
  z
    .string()
    .trim()
    .min(1)
    .max(maximum)
    .refine(
      (value) => !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(value),
      "must not contain control characters",
    );

export const sceneCodeSourceSchema = z
  .string()
  .trim()
  .min(1)
  .max(MAX_SOURCE_LENGTH)
  .describe(
    "JavaScript function body with THREE already in scope. Build and return { root, name, altText, camera?, movement?, shadow? }. root must be a THREE.Object3D. Do not include imports, exports, markdown fences, textures, external assets, shaders, DOM, or network code.",
  );

const generatedResultSchema = z
  .object({
    root: z.custom<THREE.Object3D>(
      (value) => value instanceof THREE.Object3D,
      "root must be a THREE.Object3D",
    ),
    name: visibleTextSchema(80),
    altText: visibleTextSchema(240),
    camera: z
      .union([
        z.enum(["front", "three-quarter", "top", "free"]),
        z
          .object({
            position: z.tuple([
              z.number().finite(),
              z.number().finite(),
              z.number().finite(),
            ]),
            target: z.tuple([
              z.number().finite(),
              z.number().finite(),
              z.number().finite(),
            ]),
            fov: z.number().finite().min(18).max(70),
          })
          .passthrough(),
      ])
      .optional(),
    movement: z
      .union([
        z.enum(["still", "breathe", "orbit", "bob", "shimmer"]),
        z
          .object({
            type: z.enum(["still", "breathe", "orbit", "bob", "shimmer"]),
          })
          .passthrough(),
      ])
      .optional(),
    shadow: z
      .union([
        z.enum(["soft", "crisp", "none"]),
        z
          .object({
            enabled: z.boolean().optional(),
            cast: z.boolean().optional(),
            receive: z.boolean().optional(),
          })
          .passthrough(),
      ])
      .optional(),
  })
  .strict();

const ALLOWED_MATERIAL_TYPES = new Set([
  "LineBasicMaterial",
  "LineDashedMaterial",
  "MeshBasicMaterial",
  "MeshLambertMaterial",
  "MeshPhongMaterial",
  "MeshPhysicalMaterial",
  "MeshStandardMaterial",
  "MeshToonMaterial",
  "PointsMaterial",
]);

const PALETTE = [
  "#111111",
  "#444444",
  "#888888",
  "#cccccc",
  "#f5f5f5",
] as const;

interface SceneCodeStats {
  objects: number;
  vertices: number;
  materials: number;
  lights: number;
}

export interface SceneCodeIdentity {
  readonly jobId: string;
  readonly objectId: string;
}

function fail(path: string, message: string): never {
  throw new SceneContractError([
    { code: "invalid_generated_scene", path, message },
  ]);
}

function monochrome(color: THREE.Color): void {
  const level = Math.max(
    0,
    Math.min(
      255,
      Math.round(
        (color.r * 0.2126 + color.g * 0.7152 + color.b * 0.0722) * 255,
      ),
    ),
  );
  color.setHex((level << 16) | (level << 8) | level);
}

function materialList(object: THREE.Object3D): THREE.Material[] {
  if (!("material" in object)) return [];
  const material = (object as THREE.Object3D & {
    material?: THREE.Material | THREE.Material[];
  }).material;
  if (material === undefined) return [];
  return Array.isArray(material) ? material : [material];
}

function geometryFor(object: THREE.Object3D): THREE.BufferGeometry | null {
  if (!("geometry" in object)) return null;
  const geometry = (object as THREE.Object3D & {
    geometry?: THREE.BufferGeometry;
  }).geometry;
  return geometry instanceof THREE.BufferGeometry ? geometry : null;
}

function assertNoTextures(material: THREE.Material): void {
  for (const value of Object.values(material)) {
    if (
      value !== null &&
      typeof value === "object" &&
      "isTexture" in value &&
      (value as { isTexture?: unknown }).isTexture === true
    ) {
      fail("source", "generated materials cannot contain textures");
    }
  }
}

function normalizeMaterial(material: THREE.Material): void {
  if (!ALLOWED_MATERIAL_TYPES.has(material.type)) {
    fail("source", `material ${material.type} is not supported`);
  }
  assertNoTextures(material);
  const colored = material as THREE.Material & {
    color?: THREE.Color;
    emissive?: THREE.Color;
  };
  if (colored.color instanceof THREE.Color) monochrome(colored.color);
  if (colored.emissive instanceof THREE.Color) monochrome(colored.emissive);
  material.userData = {};
}

function inspectRoot(root: THREE.Object3D): SceneCodeStats {
  let objects = 0;
  let vertices = 0;
  let lights = 0;
  const materials = new Set<THREE.Material>();
  const geometries = new Set<THREE.BufferGeometry>();

  root.traverse((object) => {
    object.userData = {};
    if (object instanceof THREE.Camera) {
      fail("source", "the generated root cannot contain a camera");
    }
    if (object instanceof THREE.Light) {
      lights += 1;
      monochrome(object.color);
    }

    const geometry = geometryFor(object);
    const nextMaterials = materialList(object);
    if (geometry !== null || nextMaterials.length > 0) objects += 1;
    if (geometry !== null && !geometries.has(geometry)) {
      geometries.add(geometry);
      const position = geometry.getAttribute("position");
      if (!position || position.count < 1) {
        fail("source", "every generated geometry needs finite positions");
      }
      const multiplier =
        object instanceof THREE.InstancedMesh ? Math.max(1, object.count) : 1;
      vertices += position.count * multiplier;
      for (const value of position.array) {
        if (!Number.isFinite(value)) {
          fail("source", "generated geometry contains a non-finite vertex");
        }
      }
    }
    for (const material of nextMaterials) {
      materials.add(material);
      normalizeMaterial(material);
    }
    if (object instanceof THREE.Mesh) {
      object.castShadow = true;
      object.receiveShadow = true;
    }
  });

  if (objects < 1) fail("source", "the generated root contains no drawable objects");
  if (objects > MAX_GENERATED_SCENE_OBJECTS) {
    fail(
      "source",
      `generated scene has ${objects} objects; maximum is ${MAX_GENERATED_SCENE_OBJECTS}`,
    );
  }
  if (vertices > MAX_GENERATED_SCENE_VERTICES) {
    fail(
      "source",
      `generated scene has ${vertices} vertices; maximum is ${MAX_GENERATED_SCENE_VERTICES}`,
    );
  }
  if (materials.size < 1 || materials.size > MAX_GENERATED_SCENE_MATERIALS) {
    fail(
      "source",
      `generated scene has ${materials.size} materials; maximum is ${MAX_GENERATED_SCENE_MATERIALS}`,
    );
  }
  if (lights > MAX_GENERATED_SCENE_LIGHTS) {
    fail(
      "source",
      `generated scene has ${lights} lights; maximum is ${MAX_GENERATED_SCENE_LIGHTS}`,
    );
  }
  return { objects, vertices, materials: materials.size, lights };
}

function makeGeometriesPortable(root: THREE.Object3D): void {
  const portableGeometries = new Map<
    THREE.BufferGeometry,
    THREE.BufferGeometry
  >();
  root.traverse((object) => {
    const geometry = geometryFor(object);
    if (geometry === null) return;
    let portable = portableGeometries.get(geometry);
    if (portable === undefined) {
      portable = new THREE.BufferGeometry().copy(geometry);
      portable.name = geometry.name;
      portable.userData = {};
      portableGeometries.set(geometry, portable);
    }
    (
      object as THREE.Object3D & {
        geometry: THREE.BufferGeometry;
      }
    ).geometry = portable;
  });
}

function normalizeRoot(root: THREE.Object3D): {
  root: THREE.Group;
  bounds: SceneObjectV2["bounds"];
} {
  root.updateMatrixWorld(true);
  const sourceBounds = new THREE.Box3().setFromObject(root);
  if (sourceBounds.isEmpty()) fail("source", "generated scene has empty bounds");
  const size = sourceBounds.getSize(new THREE.Vector3());
  const center = sourceBounds.getCenter(new THREE.Vector3());
  if (![size.x, size.y, size.z, center.x, center.y, center.z].every(Number.isFinite)) {
    fail("source", "generated scene bounds are not finite");
  }
  const largestSpan = Math.max(size.x, size.y, size.z);
  if (largestSpan <= 0) fail("source", "generated scene has zero-size bounds");
  const fitScale = Math.min(1, TARGET_SCENE_SPAN / largestSpan);

  const centered = new THREE.Group();
  centered.position.set(-center.x, -sourceBounds.min.y, -center.z);
  centered.add(root);
  const fitted = new THREE.Group();
  fitted.name = "SceneSeed generated scene";
  fitted.scale.setScalar(fitScale);
  fitted.add(centered);
  fitted.updateMatrixWorld(true);

  return {
    root: fitted,
    bounds: {
      width: Math.max(0.05, size.x * fitScale),
      height: Math.max(0.05, size.y * fitScale),
      depth: Math.max(0.05, size.z * fitScale),
    },
  };
}

function motionFor(
  movement: z.infer<typeof generatedResultSchema>["movement"],
): SceneObjectV2["motion"] {
  const preset = typeof movement === "object" ? movement.type : movement;
  switch (preset ?? "still") {
    case "still":
      return { preset: "none", speed: 0, amplitude: 0 };
    case "breathe":
      return { preset: "breathe", speed: 0.34, amplitude: 0.08 };
    case "orbit":
      return { preset: "orbit", speed: 0.18, amplitude: 0.08 };
    case "bob":
      return { preset: "bob", speed: 0.32, amplitude: 0.12 };
    case "shimmer":
      return { preset: "shimmer", speed: 0.42, amplitude: 0.1 };
  }
}

function cameraFor(
  camera: z.infer<typeof generatedResultSchema>["camera"],
): SceneObjectV2["cameraHint"] {
  if (camera === undefined) return "three-quarter";
  return typeof camera === "string" ? camera : "free";
}

function groundFor(
  shadow: z.infer<typeof generatedResultSchema>["shadow"],
): SceneObjectV2["ground"] {
  if (typeof shadow === "object") {
    if (
      shadow.enabled === false ||
      (shadow.cast === false && shadow.receive === false)
    ) {
      return { contactShadow: { strength: 0, softness: 1 } };
    }
    return { contactShadow: { strength: 0.66, softness: 0.46 } };
  }
  switch (shadow ?? "soft") {
    case "soft":
      return { contactShadow: { strength: 0.64, softness: 0.5 } };
    case "crisp":
      return { contactShadow: { strength: 0.78, softness: 0.18 } };
    case "none":
      return { contactShadow: { strength: 0, softness: 1 } };
  }
}

export function compileSceneCode(
  sourceInput: unknown,
  identity: SceneCodeIdentity,
): SceneObjectV2 {
  const source = sceneCodeSourceSchema.parse(sourceInput);
  const context = createContext(
    { THREE },
    {
      name: `SceneSeed ${identity.jobId}`,
      codeGeneration: { strings: false, wasm: false },
    },
  );
  const script = new Script(`"use strict"; (function () {\n${source}\n})()`, {
    filename: `sceneseed-${identity.jobId}.js`,
  });
  const result = generatedResultSchema.parse(
    script.runInContext(context, { timeout: EXECUTION_TIMEOUT_MS }),
  );
  const stats = inspectRoot(result.root);
  makeGeometriesPortable(result.root);
  const normalized = normalizeRoot(result.root);
  const objectJson = normalized.root.toJSON() as unknown as Record<
    string,
    unknown
  >;
  const bytes = new TextEncoder().encode(JSON.stringify(objectJson)).byteLength;
  if (bytes > MAX_GENERATED_SCENE_JSON_BYTES) {
    fail(
      "source",
      `serialized scene is ${bytes} bytes; maximum is ${MAX_GENERATED_SCENE_JSON_BYTES}. Simplify unique geometry and segment counts (objects: ${stats.objects}, vertices: ${stats.vertices}, materials: ${stats.materials})`,
    );
  }

  return normalizeSceneObject({
    version: 2,
    jobId: identity.jobId,
    objectId: identity.objectId,
    name: result.name,
    altText: result.altText,
    bounds: normalized.bounds,
    cameraHint: cameraFor(result.camera),
    palette: [...PALETTE],
    motion: motionFor(result.movement),
    ground: groundFor(result.shadow),
    objectJson,
    stats,
  }) as SceneObjectV2;
}

export function safeCompileSceneCode(
  source: unknown,
  identity: SceneCodeIdentity,
):
  | { success: true; scene: SceneObjectV2 }
  | { success: false; issues: readonly SceneContractIssue[] } {
  try {
    return { success: true, scene: compileSceneCode(source, identity) };
  } catch (error) {
    if (error instanceof SceneContractError) {
      return { success: false, issues: error.issues };
    }
    if (error instanceof z.ZodError) {
      return {
        success: false,
        issues: error.issues.map((issue) => ({
          code: issue.code,
          path: ["source", ...issue.path].join("."),
          message: issue.message,
        })),
      };
    }
    return {
      success: false,
      issues: [
        {
          code: "invalid_generated_code",
          path: "source",
          message: error instanceof Error ? error.message : String(error),
        },
      ],
    };
  }
}
