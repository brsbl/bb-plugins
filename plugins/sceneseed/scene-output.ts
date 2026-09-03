import * as THREE from "three";

import {
  MAX_GENERATED_SCENE_LIGHTS,
  MAX_GENERATED_SCENE_MATERIALS,
  MAX_GENERATED_SCENE_OBJECTS,
  MAX_GENERATED_SCENE_VERTICES,
  SceneContractError,
  type SceneObjectV2,
} from "./scene-contract.js";

const TARGET_SCENE_SPAN = 16;

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

export interface GeneratedRootStats {
  readonly objects: number;
  readonly vertices: number;
  readonly materials: number;
  readonly lights: number;
}

export interface PreparedGeneratedRoot {
  readonly objectJson: Record<string, unknown>;
  readonly bounds: SceneObjectV2["bounds"];
  readonly stats: GeneratedRootStats;
  readonly bytes: number;
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

function inspectRoot(root: THREE.Object3D): GeneratedRootStats {
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
      if (materials.has(material)) continue;
      materials.add(material);
      normalizeMaterial(material);
    }
    if (object instanceof THREE.Mesh) {
      const sketchLayer = object.name.startsWith("Sketch stroke ");
      object.castShadow = !sketchLayer;
      object.receiveShadow = !sketchLayer;
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
  readonly root: THREE.Group;
  readonly bounds: SceneObjectV2["bounds"];
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

/**
 * Applies the production output-validation, monochrome, portability, framing,
 * and serialization path to an already-created generated root.
 */
export function prepareGeneratedRoot(root: THREE.Object3D): PreparedGeneratedRoot {
  const stats = inspectRoot(root);
  makeGeometriesPortable(root);
  const normalized = normalizeRoot(root);
  const objectJson = normalized.root.toJSON() as unknown as Record<string, unknown>;
  const bytes = new TextEncoder().encode(JSON.stringify(objectJson)).byteLength;
  return { objectJson, bounds: normalized.bounds, stats, bytes };
}
