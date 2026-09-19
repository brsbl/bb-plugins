import { createContext, Script } from "node:vm";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { z } from "zod";

import {
  MAX_GENERATED_SCENE_JSON_BYTES,
  SceneContractError,
  normalizeSceneObject,
  type SceneContractIssue,
  type SceneObjectV2,
} from "./scene-contract.js";
import { PROCEDURAL_BRUSH } from "./procedural-brush.js";
import { prepareGeneratedRoot } from "./scene-output.js";

const MAX_SOURCE_LENGTH = 24_000;
const EXECUTION_TIMEOUT_MS = 2_000;
const MAX_AGENT_AUTHORED_SCENE_VERTICES = 600;
const SCENE_THREE = Object.freeze({ ...THREE, RoundedBoxGeometry });

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
    "JavaScript function body with THREE and BRUSH already in scope. Build and return { root, name, altText, camera?, movement?, shadow? }. root must be a THREE.Object3D. Do not include imports, exports, markdown fences, textures, external assets, shaders, DOM, or network code.",
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
        z.object({}).passthrough(),
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
        z
          .object({
            rotation: z.tuple([
              z.number().finite(),
              z.number().finite(),
              z.number().finite(),
            ]),
          })
          .passthrough(),
      ])
      .optional(),
    shadow: z
      .union([
        z.boolean(),
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

const PALETTE = [
  "#111111",
  "#444444",
  "#888888",
  "#cccccc",
  "#f5f5f5",
] as const;

export interface SceneCodeIdentity {
  readonly jobId: string;
  readonly objectId: string;
}

function fail(path: string, message: string): never {
  throw new SceneContractError([
    { code: "invalid_generated_scene", path, message },
  ]);
}

function motionFor(
  movement: z.infer<typeof generatedResultSchema>["movement"],
): SceneObjectV2["motion"] {
  const preset =
    typeof movement === "object"
      ? "type" in movement
        ? movement.type
        : "orbit"
      : movement;
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
  return { preset: "none", speed: 0, amplitude: 0 };
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
  if (typeof shadow === "boolean") {
    return shadow
      ? { contactShadow: { strength: 0.78, softness: 0.18 } }
      : { contactShadow: { strength: 0, softness: 1 } };
  }
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
    { BRUSH: PROCEDURAL_BRUSH, THREE: SCENE_THREE },
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
  const prepared = prepareGeneratedRoot(result.root);
  const { stats } = prepared;
  if (stats.vertices > MAX_AGENT_AUTHORED_SCENE_VERTICES) {
    fail(
      "source",
      `generated scene has ${stats.vertices} vertices; Protofetti's agent-authored scene budget is ${MAX_AGENT_AUTHORED_SCENE_VERTICES}. Reuse simpler geometry and lower segment counts`,
    );
  }
  if (prepared.bytes > MAX_GENERATED_SCENE_JSON_BYTES) {
    fail(
      "source",
      `serialized scene is ${prepared.bytes} bytes; maximum is ${MAX_GENERATED_SCENE_JSON_BYTES}. Simplify unique geometry and segment counts (objects: ${stats.objects}, vertices: ${stats.vertices}, materials: ${stats.materials})`,
    );
  }

  return normalizeSceneObject({
    version: 2,
    jobId: identity.jobId,
    objectId: identity.objectId,
    name: result.name,
    altText: result.altText,
    bounds: prepared.bounds,
    cameraHint: cameraFor(result.camera),
    palette: [...PALETTE],
    motion: motionFor(result.movement),
    ground: groundFor(result.shadow),
    objectJson: prepared.objectJson,
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
