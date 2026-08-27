import { z } from "zod";

export const SCENE_OBJECT_VERSION = 1 as const;
export const MAX_SCENE_NODES = 40;
export const MAX_SCENE_LIGHTS = 3;
export const MAX_SCENE_COST = 10;
export const MAX_CANVAS_OBJECTS = 25;
export const MAX_CANVAS_COST = 100;

const identifierSchema = z
  .string()
  .min(1)
  .max(80)
  .regex(/^[A-Za-z0-9][A-Za-z0-9_-]*$/, "must be a simple identifier");

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

const boundedNumber = (minimum: number, maximum: number) =>
  z.number().finite().min(minimum).max(maximum);

const positionSchema = z.tuple([
  boundedNumber(-50, 50),
  boundedNumber(-50, 50),
  boundedNumber(-50, 50),
]);

const rotationSchema = z.tuple([
  boundedNumber(-Math.PI * 2, Math.PI * 2),
  boundedNumber(-Math.PI * 2, Math.PI * 2),
  boundedNumber(-Math.PI * 2, Math.PI * 2),
]);

const scaleSchema = z.tuple([
  boundedNumber(0.05, 10),
  boundedNumber(0.05, 10),
  boundedNumber(0.05, 10),
]);

const dimensionsSchema = z
  .object({
    width: boundedNumber(0.05, 20),
    height: boundedNumber(0.05, 20),
    depth: boundedNumber(0.05, 20),
  })
  .strict();

const colorSchema = z.union([
  z.enum([
    "theme:ink",
    "theme:canvas",
    "theme:accent",
    "theme:muted",
    "theme:success",
    "theme:warning",
    "theme:danger",
  ]),
  z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "must be a six-digit hexadecimal color")
    .transform((value) => value.toLowerCase()),
]);

const transformFields = {
  position: positionSchema,
  rotation: rotationSchema,
  scale: scaleSchema,
} as const;

const parentFields = {
  id: identifierSchema,
  parentId: identifierSchema.nullable(),
  ...transformFields,
} as const;

const coloredNodeFields = {
  ...parentFields,
  paletteIndex: z.number().int().min(0).max(7),
} as const;

const groupNodeSchema = z
  .object({
    kind: z.literal("group"),
    ...parentFields,
  })
  .strict();

const meshNodeSchema = z
  .object({
    kind: z.literal("mesh"),
    ...coloredNodeFields,
    geometry: z.enum([
      "box",
      "sphere",
      "cylinder",
      "cone",
      "torus",
      "capsule",
      "plane",
    ]),
    size: dimensionsSchema,
  })
  .strict();

const extrudedShapeNodeSchema = z
  .object({
    kind: z.literal("extrudedShape"),
    ...coloredNodeFields,
    points: z
      .array(z.tuple([boundedNumber(-10, 10), boundedNumber(-10, 10)]))
      .min(3)
      .max(24),
    depth: boundedNumber(0.05, 10),
  })
  .strict();

const textNodeSchema = z
  .object({
    kind: z.literal("text"),
    ...coloredNodeFields,
    text: visibleTextSchema(80),
    font: z.enum(["sans", "serif", "mono"]),
    size: boundedNumber(0.05, 10),
  })
  .strict();

const particlesNodeSchema = z
  .object({
    kind: z.literal("particles"),
    ...coloredNodeFields,
    preset: z.enum(["dust", "motes", "sparks", "snow"]),
    count: z.number().int().min(1).max(500),
    size: boundedNumber(0.01, 1),
    spread: dimensionsSchema,
  })
  .strict();

export const sceneNodeV1Schema = z.discriminatedUnion("kind", [
  groupNodeSchema,
  meshNodeSchema,
  extrudedShapeNodeSchema,
  textNodeSchema,
  particlesNodeSchema,
]);

const materialSchema = z
  .object({
    preset: z.enum(["matte", "glossy", "glass", "metal", "emissive", "toon"]),
    opacity: boundedNumber(0.1, 1),
  })
  .strict();

const lightSchema = z
  .object({
    id: identifierSchema,
    kind: z.enum(["point", "spot"]),
    position: positionSchema,
    paletteIndex: z.number().int().min(0).max(7),
    intensity: boundedNumber(0, 5),
    range: boundedNumber(0.1, 50),
  })
  .strict();

const motionSchema = z
  .object({
    preset: z.enum(["none", "breathe", "orbit", "bob", "shimmer"]),
    speed: boundedNumber(0, 2),
    amplitude: boundedNumber(0, 2),
  })
  .strict();

const groundSchema = z
  .object({
    contactShadow: z
      .object({
        strength: boundedNumber(0, 1),
        softness: boundedNumber(0, 1),
      })
      .strict(),
  })
  .strict();

export const sceneObjectV1Schema = z
  .object({
    version: z.literal(SCENE_OBJECT_VERSION),
    jobId: identifierSchema,
    objectId: identifierSchema,
    name: visibleTextSchema(80),
    altText: visibleTextSchema(240),
    bounds: dimensionsSchema,
    cameraHint: z.enum(["front", "three-quarter", "top", "free"]),
    palette: z.array(colorSchema).min(1).max(8),
    material: materialSchema,
    nodes: z.array(sceneNodeV1Schema).min(1).max(MAX_SCENE_NODES),
    lights: z.array(lightSchema).max(MAX_SCENE_LIGHTS),
    motion: motionSchema,
    ground: groundSchema,
  })
  .strict()
  .superRefine((scene, context) => {
    const nodesById = new Map(scene.nodes.map((node) => [node.id, node]));
    if (nodesById.size !== scene.nodes.length) {
      context.addIssue({
        code: "custom",
        path: ["nodes"],
        message: "node IDs must be unique",
      });
    }

    const lightIds = new Set<string>();
    for (const [index, light] of scene.lights.entries()) {
      if (nodesById.has(light.id) || lightIds.has(light.id)) {
        context.addIssue({
          code: "custom",
          path: ["lights", index, "id"],
          message: "IDs must be unique across nodes and lights",
        });
      }
      lightIds.add(light.id);
      if (light.paletteIndex >= scene.palette.length) {
        context.addIssue({
          code: "custom",
          path: ["lights", index, "paletteIndex"],
          message: "paletteIndex must refer to an existing palette entry",
        });
      }
    }

    for (const [index, node] of scene.nodes.entries()) {
      if (node.kind !== "group" && node.paletteIndex >= scene.palette.length) {
        context.addIssue({
          code: "custom",
          path: ["nodes", index, "paletteIndex"],
          message: "paletteIndex must refer to an existing palette entry",
        });
      }
      if (node.parentId !== null && !nodesById.has(node.parentId)) {
        context.addIssue({
          code: "custom",
          path: ["nodes", index, "parentId"],
          message: "parentId must refer to another node",
        });
      }
      if (node.parentId === node.id) {
        context.addIssue({
          code: "custom",
          path: ["nodes", index, "parentId"],
          message: "a node cannot parent itself",
        });
      }
    }

    for (const [index, node] of scene.nodes.entries()) {
      const visited = new Set<string>();
      let cursor: typeof node | undefined = node;
      while (cursor?.parentId !== null && cursor?.parentId !== undefined) {
        if (visited.has(cursor.id)) {
          context.addIssue({
            code: "custom",
            path: ["nodes", index, "parentId"],
            message: "node graph must be acyclic",
          });
          break;
        }
        visited.add(cursor.id);
        cursor = nodesById.get(cursor.parentId);
      }
    }
  });

export type SceneNodeV1 = z.infer<typeof sceneNodeV1Schema>;
export type SceneObjectV1 = z.infer<typeof sceneObjectV1Schema>;

export interface SceneContractIssue {
  code: string;
  path: string;
  message: string;
}

export class SceneContractError extends Error {
  constructor(readonly issues: readonly SceneContractIssue[]) {
    super(issues.map((issue) => `${issue.path}: ${issue.message}`).join("; "));
    this.name = "SceneContractError";
  }
}

function nodeCost(node: SceneNodeV1): number {
  switch (node.kind) {
    case "group":
      return 0.1;
    case "mesh":
      return node.geometry === "torus" || node.geometry === "capsule"
        ? 0.5
        : 0.35;
    case "extrudedShape":
      return 0.75 + node.points.length * 0.02;
    case "text":
      return 0.7 + node.text.length / 160;
    case "particles":
      return 0.6 + (node.count / 500) * 0.8;
  }
}

export function calculateSceneCost(scene: SceneObjectV1): number {
  const materialCost =
    scene.material.preset === "glass"
      ? 0.5
      : scene.material.preset === "metal" ||
          scene.material.preset === "emissive"
        ? 0.25
        : 0;
  const motionCost = scene.motion.preset === "none" ? 0 : 0.25;
  const rawCost =
    1 +
    materialCost +
    motionCost +
    scene.lights.length * 0.25 +
    scene.nodes.reduce((total, node) => total + nodeCost(node), 0);
  return Math.max(1, Math.ceil(rawCost));
}

export function normalizeSceneObjectV1(input: unknown): SceneObjectV1 {
  const result = sceneObjectV1Schema.safeParse(input);
  if (!result.success) {
    throw new SceneContractError(
      result.error.issues.map((issue) => ({
        code: issue.code,
        path: issue.path.join("."),
        message: issue.message,
      })),
    );
  }
  const cost = calculateSceneCost(result.data);
  if (cost > MAX_SCENE_COST) {
    throw new SceneContractError([
      {
        code: "scene_cost_exceeded",
        path: "scene",
        message: `scene costs ${cost} units; maximum is ${MAX_SCENE_COST}`,
      },
    ]);
  }
  return result.data;
}

export function safeNormalizeSceneObjectV1(
  input: unknown,
):
  | { success: true; scene: SceneObjectV1; cost: number }
  | { success: false; issues: readonly SceneContractIssue[] } {
  try {
    const scene = normalizeSceneObjectV1(input);
    return { success: true, scene, cost: calculateSceneCost(scene) };
  } catch (error) {
    if (error instanceof SceneContractError) {
      return { success: false, issues: error.issues };
    }
    throw error;
  }
}
