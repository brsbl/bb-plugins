import { defineRpcContract } from "@get-bb/plugin-sdk";
import { z } from "zod";

import {
  CONTROL_SPECS,
  HEX_COLOR_PATTERN,
  MAX_PARAMS,
  MAX_SOURCE_LENGTH,
  PARAM_ID_PATTERN,
  clampToSpec,
  type ControlKey,
} from "./contract.js";

export const hexColor = z.string().regex(HEX_COLOR_PATTERN);
export const paletteSchema = z.tuple([hexColor, hexColor, hexColor, hexColor]);

export const paramSchema = z
  .object({
    id: z.string().regex(PARAM_ID_PATTERN),
    label: z.string().min(1).max(40),
    min: z.number().finite(),
    max: z.number().finite(),
    step: z.number().positive().finite(),
    value: z.number().finite(),
  })
  .refine((entry) => entry.max > entry.min, "max must exceed min");

export const sceneSchema = z.object({
  name: z.string().min(1).max(60),
  source: z.string().min(1).max(MAX_SOURCE_LENGTH),
  params: z
    .array(paramSchema)
    .max(MAX_PARAMS)
    .refine(
      (params) => new Set(params.map((entry) => entry.id)).size === params.length,
      "param ids must be unique",
    ),
  palette: paletteSchema,
  baseId: z.string().optional(),
});

export const sceneNameSchema = z
  .string()
  .trim()
  .min(1)
  .max(60)
  .regex(/^[^\p{Cc}\p{Cf}]+$/u, "scene names must be a single line of plain text");

export const sceneRequestSchema = z
  .string()
  .trim()
  .min(3)
  .max(400)
  .regex(/^[^\p{Cc}\p{Cf}]+$/u, "describe the scene in a single line of plain text");

function controlSpec(key: ControlKey) {
  return CONTROL_SPECS.find((spec) => spec.key === key)!;
}

function controlRange(key: ControlKey) {
  const spec = controlSpec(key);
  return z.number().min(spec.min).max(spec.max);
}

export const controlFields = {
  enabled: z.boolean(),
  showThrough: controlRange("showThrough"),
  speed: controlRange("speed"),
  glass: controlRange("glass"),
};

export const controlsSchema = z.object(controlFields);

/** Reads controls written by any earlier version: drops retired fields, clamps to today's ranges. */
function storedControl(key: ControlKey) {
  const spec = controlSpec(key);
  return z
    .number()
    .finite()
    .catch(spec.default)
    .transform((value) => clampToSpec(spec, value));
}

export const storedControlsSchema = z.object({
  enabled: z.boolean().catch(true),
  showThrough: storedControl("showThrough"),
  speed: storedControl("speed"),
  glass: storedControl("glass"),
});

export const sceneRefSchema = z.object({
  kind: z.enum(["builtIn", "saved"]),
  id: z.string().min(1),
});

export const stateSchema = z.object({
  revision: z.number().int().nonnegative(),
  sceneRevision: z.number().int().nonnegative(),
  scene: sceneSchema,
  ref: sceneRefSchema.nullable(),
  controls: controlsSchema,
});

export type AmbientState = z.infer<typeof stateSchema>;

export const libraryEntrySchema = z.object({
  id: z.string().min(1),
  scene: sceneSchema,
  original: sceneSchema.optional(),
  savedAt: z.number().int().nonnegative(),
});

export type LibraryEntry = z.infer<typeof libraryEntrySchema>;

export const tweaksSchema = z.object({
  values: z.record(z.string(), z.number().finite()),
  palette: paletteSchema,
  scene: sceneSchema.optional(),
});

export const libraryIndexSchema = z.array(
  z.object({ id: z.string().min(1), name: z.string(), savedAt: z.number().int().nonnegative() }),
);

export type LibraryIndex = z.infer<typeof libraryIndexSchema>;

export const rippleKindSchema = z.enum(["done", "error", "started"]);

export const summarySchema = z.object({
  working: z.number().int().nonnegative(),
  waiting: z.number().int().nonnegative(),
});

export const visibilitySchema = z.object({
  fromBackground: z.number().min(0).max(1),
  spread: z.number().min(0).max(1),
  motion: z.number().min(0).max(1),
  frameMs: z.number().min(0).max(10_000),
  detail: z.number().min(0).max(1),
});

export type Visibility = z.infer<typeof visibilitySchema>;

export const contextReportSchema = z.object({
  width: z.number().positive(),
  height: z.number().positive(),
  panels: z
    .array(z.object({ x0: z.number(), y0: z.number(), x1: z.number(), y1: z.number() }))
    .max(64),
  openArea: z.number().min(0).max(1),
  openSpread: z.number().min(0).max(1),
  coveredSpread: z.number().min(0).max(1),
  text: z.object({
    words: z.number().int().nonnegative(),
    median: z.number().nonnegative(),
    worst: z.number().nonnegative(),
    hardToRead: z.number().int().nonnegative(),
    examples: z
      .array(z.object({ x: z.number(), y: z.number(), contrast: z.number() }))
      .max(3),
  }),
});

export type ContextReport = z.infer<typeof contextReportSchema>;

export const contextCaptureSchema = z.object({
  dataUrl: z.string().max(8_000_000).startsWith("data:image/png;base64,"),
  report: contextReportSchema,
});

export const captureSubmissionSchema = z
  .object({
    requestId: z.string().min(1),
    dataUrl: z.string().max(6_000_000).startsWith("data:image/png;base64,"),
    summary: summarySchema,
    visibility: visibilitySchema,
    dark: z.boolean(),
    context: contextCaptureSchema.optional(),
  })
  .strict();

export type CaptureSubmission = z.infer<typeof captureSubmissionSchema>;

export const timeZoneSchema = z.string().min(1).max(64).refine((zone) => {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: zone });
    return true;
  } catch {
    return false;
  }
}, "unknown time zone");

export const dailySchema = z.object({
  enabled: z.boolean(),
  hour: z.number().int().min(0).max(23),
  timeZone: timeZoneSchema,
  automationId: z.string().nullable(),
  nextRunAt: z.number().nullable(),
  lastRunAt: z.number().nullable(),
});

export type DailyScene = z.infer<typeof dailySchema>;

export const dailyUpdateSchema = z
  .object({
    enabled: z.boolean(),
    hour: z.number().int().min(0).max(23),
    timeZone: timeZoneSchema,
  })
  .partial()
  .strict();

export type DailyUpdate = z.infer<typeof dailyUpdateSchema>;

export const ambientRpcContract = defineRpcContract({
  state: { input: z.null(), output: stateSchema },
  setValues: {
    input: z.object({ values: z.record(z.string(), z.number().finite()) }).strict(),
    output: stateSchema,
  },
  setPalette: {
    input: z.object({ palette: paletteSchema }).strict(),
    output: stateSchema,
  },
  setControls: {
    input: controlsSchema.partial().strict(),
    output: stateSchema,
  },
  loadScene: {
    input: z.object({ id: z.string().min(1) }).strict(),
    output: stateSchema,
  },
  resetScene: {
    input: z.object({ id: z.string().min(1) }).strict(),
    output: stateSchema,
  },
  saveScene: {
    input: z.object({ name: sceneNameSchema.optional() }).strict(),
    output: z.object({ id: z.string() }),
  },
  deleteScene: {
    input: z.object({ id: z.string().min(1) }).strict(),
    output: z.object({ deleted: z.boolean() }),
  },
  library: {
    input: z.null(),
    output: z.object({
      entries: z.array(
        z.object({ id: z.string(), name: z.string(), builtIn: z.boolean(), tweaked: z.boolean() }),
      ),
    }),
  },
  reportCompile: {
    input: z
      .object({
        sceneRevision: z.number().int().nonnegative(),
        ok: z.boolean(),
        log: z.string().max(8_000).optional(),
      })
      .strict(),
    output: z.object({ accepted: z.boolean() }),
  },
  submitCapture: {
    input: captureSubmissionSchema,
    output: z.object({ accepted: z.boolean() }),
  },
  daily: { input: z.null(), output: dailySchema },
  setDaily: { input: dailyUpdateSchema, output: dailySchema },
  paintNow: { input: z.null(), output: z.object({ threadId: z.string().nullable() }) },
  paintRequest: {
    input: z.object({ request: sceneRequestSchema }).strict(),
    output: z.object({ threadId: z.string() }),
  },
  heartbeat: { input: z.null(), output: z.object({ ok: z.boolean() }) },
});

export type CaptureRequestKind = z.infer<typeof rippleKindSchema>;

export interface CaptureRequest {
  requestId: string;
  ripple: CaptureRequestKind | null;
}

export type CaptureReport = {
  dataUrl: string;
  summary: z.infer<typeof summarySchema>;
  visibility: Visibility;
  dark: boolean;
  context: z.infer<typeof contextCaptureSchema> | null;
};

export function formatIssues(error: z.ZodError): string {
  return error.issues
    .map((issue) => `${issue.path.join(".") || "input"}: ${issue.message}`)
    .join("\n");
}
