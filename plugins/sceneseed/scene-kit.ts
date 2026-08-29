import { z } from "zod";
import {
  SceneContractError,
  normalizeSceneObjectV1,
  type SceneContractIssue,
  type SceneObjectV1,
} from "./scene-contract.js";

const KIT_VERSION = 1 as const;
const MAX_KIT_PARTS = 12;
const MAX_KIT_LIGHTS = 2;
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

const identifierSchema = z
  .string()
  .min(1)
  .max(80)
  .regex(/^[A-Za-z0-9][A-Za-z0-9_-]*$/, "must be a simple identifier");

const boundedNumber = (minimum: number, maximum: number) =>
  z.number().finite().min(minimum).max(maximum);

const positionSchema = z.tuple([
  boundedNumber(-12, 12),
  boundedNumber(-12, 12),
  boundedNumber(-12, 12),
]);

const rotationSchema = z.tuple([
  boundedNumber(-Math.PI * 2, Math.PI * 2),
  boundedNumber(-Math.PI * 2, Math.PI * 2),
  boundedNumber(-Math.PI * 2, Math.PI * 2),
]);

const scaleSchema = z.tuple([
  boundedNumber(0.25, 3),
  boundedNumber(0.25, 3),
  boundedNumber(0.25, 3),
]);

const dimensionsSchema = z
  .object({
    width: boundedNumber(0.1, 12),
    height: boundedNumber(0.1, 12),
    depth: boundedNumber(0.1, 12),
  })
  .strict();

const toneSchema = z.enum(["black", "dark", "mid", "light", "white"]);

const transformFields = {
  at: positionSchema.optional(),
  rotate: rotationSchema.optional(),
  scale: scaleSchema.optional(),
} as const;

const shapePartSchema = z
  .object({
    kind: z.literal("shape"),
    id: identifierSchema,
    shape: z.enum([
      "box",
      "sphere",
      "cylinder",
      "cone",
      "torus",
      "capsule",
      "plane",
    ]),
    size: dimensionsSchema,
    tone: toneSchema.optional(),
    ...transformFields,
  })
  .strict();

const labelPartSchema = z
  .object({
    kind: z.literal("label"),
    id: identifierSchema,
    text: visibleTextSchema(80),
    font: z.enum(["sans", "serif", "mono"]).optional(),
    size: boundedNumber(0.1, 4),
    tone: toneSchema.optional(),
    ...transformFields,
  })
  .strict();

const particlesPartSchema = z
  .object({
    kind: z.literal("particles"),
    id: identifierSchema,
    effect: z.enum(["dust", "motes", "sparks", "snow"]),
    count: z.number().int().min(1).max(300),
    size: boundedNumber(0.01, 0.5),
    spread: dimensionsSchema,
    tone: toneSchema.optional(),
    ...transformFields,
  })
  .strict();

export const sceneSeedKitPartSchema = z.discriminatedUnion("kind", [
  shapePartSchema,
  labelPartSchema,
  particlesPartSchema,
]);

const sceneSeedKitLightSchema = z
  .object({
    id: identifierSchema,
    kind: z.enum(["point", "spot"]).optional(),
    at: positionSchema,
    tone: toneSchema.optional(),
    intensity: boundedNumber(0.1, 3).optional(),
    range: boundedNumber(1, 24).optional(),
  })
  .strict();

export const sceneSeedKitProgramSchema = z
  .object({
    version: z.literal(KIT_VERSION),
    name: visibleTextSchema(80),
    altText: visibleTextSchema(240),
    camera: z.enum(["front", "three-quarter", "top", "free"]).optional(),
    material: z
      .enum(["matte", "glossy", "glass", "metal", "emissive", "toon"])
      .optional(),
    opacity: boundedNumber(0.1, 1).optional(),
    movement: z
      .enum(["still", "breathe", "orbit", "bob", "shimmer"])
      .optional(),
    shadow: z.enum(["soft", "crisp", "none"]).optional(),
    parts: z.array(sceneSeedKitPartSchema).min(1).max(MAX_KIT_PARTS),
    lights: z.array(sceneSeedKitLightSchema).max(MAX_KIT_LIGHTS).optional(),
  })
  .strict()
  .superRefine((program, context) => {
    const ids = new Set<string>();
    for (const [index, part] of program.parts.entries()) {
      if (ids.has(part.id)) {
        context.addIssue({
          code: "custom",
          path: ["parts", index, "id"],
          message: "IDs must be unique across parts and lights",
        });
      }
      ids.add(part.id);
    }
    for (const [index, light] of (program.lights ?? []).entries()) {
      if (ids.has(light.id)) {
        context.addIssue({
          code: "custom",
          path: ["lights", index, "id"],
          message: "IDs must be unique across parts and lights",
        });
      }
      ids.add(light.id);
    }
    if (program.parts.filter((part) => part.kind === "label").length > 1) {
      context.addIssue({
        code: "custom",
        path: ["parts"],
        message: "the kit allows at most one essential label",
      });
    }
    if (program.parts.filter((part) => part.kind === "particles").length > 1) {
      context.addIssue({
        code: "custom",
        path: ["parts"],
        message: "the kit allows at most one particle effect",
      });
    }
  });

export type SceneSeedKitProgramV1 = z.infer<typeof sceneSeedKitProgramSchema>;

export interface SceneSeedKitIdentity {
  readonly jobId: string;
  readonly objectId: string;
}

const TONE_PALETTE = [
  "#111111",
  "#444444",
  "#888888",
  "#cccccc",
  "#f5f5f5",
] as const;

const TONE_INDEX: Record<z.infer<typeof toneSchema>, number> = {
  black: 0,
  dark: 1,
  mid: 2,
  light: 3,
  white: 4,
};

type Vector3 = [number, number, number];

interface PartBox {
  readonly minimum: Vector3;
  readonly maximum: Vector3;
}

function vector(value: Vector3 | undefined, fallback: Vector3): Vector3 {
  return value === undefined ? [...fallback] : [...value];
}

function dimensionsForPart(
  part: SceneSeedKitProgramV1["parts"][number],
): Vector3 {
  switch (part.kind) {
    case "shape":
      return [part.size.width, part.size.height, part.size.depth];
    case "particles":
      return [part.spread.width, part.spread.height, part.spread.depth];
    case "label":
      return [
        Math.min(12, Math.max(part.size, part.text.length * part.size * 0.58)),
        part.size * 1.2,
        Math.max(0.1, part.size * 0.15),
      ];
  }
}

function rotatePoint([x, y, z]: Vector3, [rx, ry, rz]: Vector3): Vector3 {
  const sinX = Math.sin(rx);
  const cosX = Math.cos(rx);
  const sinY = Math.sin(ry);
  const cosY = Math.cos(ry);
  const sinZ = Math.sin(rz);
  const cosZ = Math.cos(rz);

  const yAfterX = y * cosX - z * sinX;
  const zAfterX = y * sinX + z * cosX;
  const xAfterY = x * cosY + zAfterX * sinY;
  const zAfterY = -x * sinY + zAfterX * cosY;
  return [
    xAfterY * cosZ - yAfterX * sinZ,
    xAfterY * sinZ + yAfterX * cosZ,
    zAfterY,
  ];
}

function partBox(part: SceneSeedKitProgramV1["parts"][number]): PartBox {
  const at = vector(part.at, [0, 0, 0]);
  const rotate = vector(part.rotate, [0, 0, 0]);
  const scale = vector(part.scale, [1, 1, 1]);
  const dimensions = dimensionsForPart(part).map(
    (dimension, index) => (dimension * scale[index]!) / 2,
  ) as Vector3;

  const corners: Vector3[] = [];
  for (const x of [-dimensions[0], dimensions[0]]) {
    for (const y of [-dimensions[1], dimensions[1]]) {
      for (const z of [-dimensions[2], dimensions[2]]) {
        const rotated = rotatePoint([x, y, z], rotate);
        corners.push([
          rotated[0] + at[0],
          rotated[1] + at[1],
          rotated[2] + at[2],
        ]);
      }
    }
  }

  return {
    minimum: [
      Math.min(...corners.map((corner) => corner[0])),
      Math.min(...corners.map((corner) => corner[1])),
      Math.min(...corners.map((corner) => corner[2])),
    ],
    maximum: [
      Math.max(...corners.map((corner) => corner[0])),
      Math.max(...corners.map((corner) => corner[1])),
      Math.max(...corners.map((corner) => corner[2])),
    ],
  };
}

function compositionPlan(parts: SceneSeedKitProgramV1["parts"]): {
  offset: Vector3;
  fitScale: number;
  bounds: { width: number; height: number; depth: number };
} {
  const boxes = parts.map(partBox);
  const minimum: Vector3 = [
    Math.min(...boxes.map((box) => box.minimum[0])),
    Math.min(...boxes.map((box) => box.minimum[1])),
    Math.min(...boxes.map((box) => box.minimum[2])),
  ];
  const maximum: Vector3 = [
    Math.max(...boxes.map((box) => box.maximum[0])),
    Math.max(...boxes.map((box) => box.maximum[1])),
    Math.max(...boxes.map((box) => box.maximum[2])),
  ];
  const spans: Vector3 = [
    maximum[0] - minimum[0],
    maximum[1] - minimum[1],
    maximum[2] - minimum[2],
  ];
  const largestSpan = Math.max(...spans);
  const fitScale = Math.min(1, TARGET_SCENE_SPAN / largestSpan);
  const offset: Vector3 = [
    -(minimum[0] + maximum[0]) / 2,
    -minimum[1],
    -(minimum[2] + maximum[2]) / 2,
  ];
  const padded = spans.map((span) => Math.max(0.5, span * fitScale * 1.1));
  return {
    offset,
    fitScale,
    bounds: {
      width: padded[0]!,
      height: padded[1]!,
      depth: padded[2]!,
    },
  };
}

function transformedPosition(
  at: Vector3 | undefined,
  offset: Vector3,
  fitScale: number,
): Vector3 {
  const position = vector(at, [0, 0, 0]);
  return [
    (position[0] + offset[0]) * fitScale,
    (position[1] + offset[1]) * fitScale,
    (position[2] + offset[2]) * fitScale,
  ];
}

function transformedScale(
  scale: Vector3 | undefined,
  fitScale: number,
): Vector3 {
  const source = vector(scale, [1, 1, 1]);
  return source.map((value) => value * fitScale) as Vector3;
}

function materialOpacity(program: SceneSeedKitProgramV1): number {
  if (program.opacity !== undefined) return program.opacity;
  if (program.material === "glass") return 0.62;
  if (program.material === "emissive") return 0.9;
  return 1;
}

function motionForProgram(program: SceneSeedKitProgramV1): SceneObjectV1["motion"] {
  switch (program.movement ?? "still") {
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

function shadowForProgram(program: SceneSeedKitProgramV1): SceneObjectV1["ground"] {
  switch (program.shadow ?? "soft") {
    case "soft":
      return { contactShadow: { strength: 0.58, softness: 0.74 } };
    case "crisp":
      return { contactShadow: { strength: 0.72, softness: 0.34 } };
    case "none":
      return { contactShadow: { strength: 0, softness: 1 } };
  }
}

export function compileSceneSeedKitProgram(
  input: unknown,
  identity: SceneSeedKitIdentity,
): SceneObjectV1 {
  const program = sceneSeedKitProgramSchema.parse(input);
  const plan = compositionPlan(program.parts);
  const nodes: SceneObjectV1["nodes"] = program.parts.map((part) => {
    const common = {
      id: part.id,
      parentId: null,
      position: transformedPosition(part.at, plan.offset, plan.fitScale),
      rotation: vector(part.rotate, [0, 0, 0]),
      scale: transformedScale(part.scale, plan.fitScale),
      paletteIndex: TONE_INDEX[part.tone ?? "dark"],
    };
    switch (part.kind) {
      case "shape":
        return {
          kind: "mesh" as const,
          ...common,
          geometry: part.shape,
          size: part.size,
        };
      case "label":
        return {
          kind: "text" as const,
          ...common,
          text: part.text,
          font: part.font ?? "sans",
          size: part.size,
        };
      case "particles":
        return {
          kind: "particles" as const,
          ...common,
          preset: part.effect,
          count: part.count,
          size: part.size,
          spread: part.spread,
        };
    }
  });
  const lights: SceneObjectV1["lights"] = (program.lights ?? []).map(
    (light) => ({
      id: light.id,
      kind: light.kind ?? "point",
      position: transformedPosition(light.at, plan.offset, plan.fitScale),
      paletteIndex: TONE_INDEX[light.tone ?? "white"],
      intensity: light.intensity ?? 1,
      range: (light.range ?? 8) * plan.fitScale,
    }),
  );

  return normalizeSceneObjectV1({
    version: 1,
    jobId: identity.jobId,
    objectId: identity.objectId,
    name: program.name,
    altText: program.altText,
    bounds: plan.bounds,
    cameraHint: program.camera ?? "three-quarter",
    palette: [...TONE_PALETTE],
    material: {
      preset: program.material ?? "matte",
      opacity: materialOpacity(program),
    },
    nodes,
    lights,
    motion: motionForProgram(program),
    ground: shadowForProgram(program),
  });
}

function zodIssues(error: z.ZodError): SceneContractIssue[] {
  return error.issues.map((issue) => ({
    code: issue.code,
    path: ["program", ...issue.path].join("."),
    message: issue.message,
  }));
}

export function safeCompileSceneSeedKitProgram(
  input: unknown,
  identity: SceneSeedKitIdentity,
):
  | { success: true; scene: SceneObjectV1 }
  | { success: false; issues: readonly SceneContractIssue[] } {
  try {
    return { success: true, scene: compileSceneSeedKitProgram(input, identity) };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, issues: zodIssues(error) };
    }
    if (error instanceof SceneContractError) {
      return {
        success: false,
        issues: error.issues.map((issue) => ({
          ...issue,
          path: issue.path === "scene" ? "program" : issue.path,
        })),
      };
    }
    throw error;
  }
}
