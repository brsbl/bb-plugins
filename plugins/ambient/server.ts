import { randomUUID } from "node:crypto";

import { defineRpcContract, type BbPluginApi, type JsonValue } from "@get-bb/plugin-sdk";
import { z } from "zod";

import {
  BUILT_IN_SCENES,
  DEFAULT_CONTROLS,
  DEFAULT_SCENE,
  HEX_COLOR_PATTERN,
  MAX_PARAMS,
  MAX_SOURCE_LENGTH,
  PARAM_ID_PATTERN,
  SHADER_CONTRACT,
  rebuildBuiltIn,
  sceneOf,
  type Controls,
  type Scene,
} from "./scene.js";

const STATE_KEY = "state";
const DAILY_KEY = "daily";
const LIBRARY_PREFIX = "library/";
const COMPILE_TIMEOUT_MS = 6_000;
const CAPTURE_TIMEOUT_MS = 8_000;
const PERSONAL_PROJECT_ID = "proj_personal";
const LAST_GOOD_KEY = "last-good";
const LIBRARY_INDEX_KEY = "library-index";
const WINDOW_FRESH_MS = 3 * 60_000;
const AUTOMATIONS_PLUGIN_ID = "automations";
const DAILY_AUTOMATION_NAME = "Ambient: new scene every morning";
const DAILY_AUTOMATION_PROMPT =
  "Paint today's Ambient scene: call the ambient tool with action=brief and follow the instructions it returns.";

const hexColor = z.string().regex(HEX_COLOR_PATTERN);
const paletteSchema = z.tuple([hexColor, hexColor, hexColor, hexColor]);

const paramSchema = z
  .object({
    id: z.string().regex(PARAM_ID_PATTERN),
    label: z.string().min(1).max(40),
    min: z.number().finite(),
    max: z.number().finite(),
    step: z.number().positive().finite(),
    value: z.number().finite(),
  })
  .refine((entry) => entry.max > entry.min, "max must exceed min");

const sceneSchema = z.object({
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

const controlFields = {
  enabled: z.boolean(),
  showThrough: z.number().min(0).max(1),
  speed: z.number().min(0).max(4),
  quality: z.number().min(0.2).max(1),
  glass: z.number().min(0.2).max(0.6),
};

const controlsSchema = z.object({ ...controlFields, glass: controlFields.glass.default(0.6) });

const stateSchema = z.object({
  revision: z.number().int().nonnegative(),
  sceneRevision: z.number().int().nonnegative(),
  scene: sceneSchema,
  controls: controlsSchema,
});

export type AmbientState = z.infer<typeof stateSchema>;

const libraryEntrySchema = z.object({
  id: z.string().min(1),
  scene: sceneSchema,
  savedAt: z.number().int().nonnegative(),
});

type LibraryEntry = z.infer<typeof libraryEntrySchema>;

const libraryIndexSchema = z.array(
  z.object({ id: z.string().min(1), name: z.string(), savedAt: z.number().int().nonnegative() }),
);

type LibraryIndex = z.infer<typeof libraryIndexSchema>;

const rippleKindSchema = z.enum(["done", "error", "started"]);

const summarySchema = z.object({
  working: z.number().int().nonnegative(),
  waiting: z.number().int().nonnegative(),
});

const visibilitySchema = z.object({
  fromBackground: z.number().min(0).max(1),
  spread: z.number().min(0).max(1),
  motion: z.number().min(0).max(1),
  frameMs: z.number().min(0).max(10_000),
  detail: z.number().min(0).max(1),
});

const FAINT_FROM_BACKGROUND = 0.06;
const FLAT_SPREAD = 0.025;
const STILL_MOTION = 0.0025;
const HEAVY_FRAME_MS = 8;

export function describeVisibility(
  visibility: z.infer<typeof visibilitySchema>,
  dark: boolean,
): string {
  const percent = (value: number) => `${Math.round(value * 100)}%`;
  const measured = `Measured against bb's ${dark ? "dark" : "light"} background: ${percent(visibility.fromBackground)} average color difference, ${percent(visibility.spread)} brightness variation, ${(visibility.motion * 100).toFixed(1)}% change over one second. One frame takes ${visibility.frameMs.toFixed(1)} ms to render at ${percent(visibility.detail)} detail.`;
  const faint = [
    visibility.fromBackground < FAINT_FROM_BACKGROUND &&
      "the scene is nearly the same color as bb's background, so it will be close to invisible behind bb's veil",
    visibility.spread < FLAT_SPREAD && "the scene is almost flat, with little visible structure",
  ].filter(Boolean);
  const notes = [
    faint.length > 0 &&
      `Too faint: ${faint.join("; ")}. The veil already adapts to the theme, so do not darken or wash out the scene yourself; raise its contrast and color.`,
    visibility.motion < STILL_MOTION &&
      "Nearly still: almost nothing moved in a second at the user's speed. Give the scene visible, continuous motion.",
    visibility.frameMs > HEAVY_FRAME_MS &&
      `Too heavy: frames should render in under ${HEAVY_FRAME_MS} ms or bb slows down. Use fewer loop iterations and fbm octaves, and never call fbm inside the per-agent or per-ripple loops.`,
  ].filter(Boolean);
  return [measured, ...notes].join(" ");
}

const timeZoneSchema = z.string().min(1).max(64).refine((zone) => {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: zone });
    return true;
  } catch {
    return false;
  }
}, "unknown time zone");

const dailySchema = z.object({
  enabled: z.boolean(),
  hour: z.number().int().min(0).max(23),
  timeZone: timeZoneSchema,
  automationId: z.string().nullable(),
  nextRunAt: z.number().nullable(),
  lastRunAt: z.number().nullable(),
});

const storedDailySchema = z.object({
  automationId: z.string().nullable().catch(null),
  hour: z.number().int().min(0).max(23).catch(8),
  timeZone: timeZoneSchema.catch(() => Intl.DateTimeFormat().resolvedOptions().timeZone),
});

const automationSchema = z.object({
  id: z.string(),
  enabled: z.boolean(),
  trigger: z.object({ triggerType: z.string(), cron: z.string().optional(), timezone: z.string().optional() }),
  nextRunAt: z.number().nullable(),
  lastRunAt: z.number().nullable(),
});

const automationRunSchema = z.object({
  run: z.object({
    threadId: z.string().nullable(),
    status: z.string(),
    skipReason: z.string().nullable(),
    error: z.string().nullable(),
  }),
});

const executionDefaultsSchema = z.object({
  providerId: z.string().min(1),
  model: z.string().min(1),
  reasoningLevel: z.string().min(1),
});

export type DailyScene = z.infer<typeof dailySchema>;

const dailyUpdateSchema = z
  .object({
    enabled: z.boolean(),
    hour: z.number().int().min(0).max(23),
    timeZone: timeZoneSchema,
  })
  .partial()
  .strict();

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
    input: z.object(controlFields).partial().strict(),
    output: stateSchema,
  },
  loadScene: {
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
        z.object({ id: z.string(), name: z.string(), builtIn: z.boolean() }),
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
    input: z
      .object({
        requestId: z.string().min(1),
        dataUrl: z.string().max(6_000_000).startsWith("data:image/png;base64,"),
        summary: summarySchema,
        visibility: visibilitySchema,
        dark: z.boolean(),
      })
      .strict(),
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

export interface CaptureRequest {
  requestId: string;
  ripple: z.infer<typeof rippleKindSchema> | null;
}

type CompileReport = { ok: boolean; log?: string };
type CaptureReport = {
  dataUrl: string;
  summary: z.infer<typeof summarySchema>;
  visibility: z.infer<typeof visibilitySchema>;
  dark: boolean;
};

function clampValue(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function initialState(): AmbientState {
  return {
    revision: 1,
    sceneRevision: 1,
    scene: DEFAULT_SCENE,
    controls: DEFAULT_CONTROLS,
  };
}

function slugOf(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return slug || "scene";
}

export function applyValues(scene: Scene, values: Record<string, number>): Scene {
  const unknown = Object.keys(values).filter(
    (id) => !scene.params.some((entry) => entry.id === id),
  );
  if (unknown.length > 0) {
    throw new Error(
      `unknown param ${unknown.map((id) => JSON.stringify(id)).join(", ")}; scene params are ${scene.params.map((entry) => entry.id).join(", ") || "none"}`,
    );
  }
  return {
    ...scene,
    params: scene.params.map((entry) =>
      Object.hasOwn(values, entry.id)
        ? { ...entry, value: clampValue(values[entry.id]!, entry.min, entry.max) }
        : entry,
    ),
  };
}

export interface LocalMoment {
  date: string;
  hour: number;
  label: string;
}

export function localMoment(timeZone: string, at: Date): LocalMoment {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(at)
      .map((part) => [part.type, part.value]),
  );
  const label = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(at);
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    hour: Number(parts.hour),
    label,
  };
}

export function dailyCron(hour: number): string {
  return `0 ${hour} * * *`;
}

export function cronHour(cron: string | undefined): number | null {
  const match = /^0 (\d{1,2}) \* \* \*$/.exec(cron ?? "");
  return match ? Number(match[1]) : null;
}

export function parseDailyOptions(options: readonly string[]): { hour?: number; timeZone?: string } {
  const parsed: { hour?: number; timeZone?: string } = {};
  for (const option of options) {
    if (/^\d{1,2}$/.test(option)) {
      parsed.hour = Number(option);
    } else {
      parsed.timeZone = option;
    }
  }
  return parsed;
}

export const DAILY_CONCEPTS = [
  "bioluminescent tide pool at night, agents as glowing jellyfish",
  "aurora over a frozen lake, agents as drifting lanterns on the ice",
  "koi pond from above, agents as koi that leave wakes",
  "rain running down a window with city bokeh behind it, agents as passing headlights",
  "ink blooming in water, agents as drops that keep feeding new blooms",
  "murmuration of starlings at dusk, agents as the birds leading the flock",
  "slow meteor shower over a desert, agents as comets with tails",
  "paper-cut mountain ranges in parallax, agents as hot-air balloons",
  "lava lamp, agents as rising wax blobs",
  "wheat field swaying in wind, agents as gusts moving through it",
  "coral reef caustics, agents as small bright fish",
  "neon fog over a night city, agents as moving signs",
  "snow falling under streetlights, agents as the lamps",
  "deep-space nebula with slow gas currents, agents as newborn stars",
  "cloud chamber with particle trails, agents as the particle sources",
  "sun through slowly turning window blinds, agents as floating dust motes",
  "ocean swell from above with foam lines, agents as small boats",
  "moss and ferns on a forest floor with drifting pollen, agents as fireflies",
  "stained glass lit from behind by a moving sun, agents as brighter panes",
  "sand dunes shifting at golden hour, agents as wandering caravans",
] as const;

export function dailyConcept(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  const dayNumber = Math.floor(Date.UTC(year!, month! - 1, day!) / 86_400_000);
  return DAILY_CONCEPTS[dayNumber % DAILY_CONCEPTS.length]!;
}

function conceptLines(moment: LocalMoment, request: string | undefined): string[] {
  if (!request) {
    return [
      `Paint today's Ambient scene: the living background bb shows behind its UI. It is ${moment.label} in the user's time zone.`,
      `Today's starting concept: ${dailyConcept(moment.date)}. Make it your own, and let the season and time of day color it.`,
    ];
  }
  return [
    `Paint a new Ambient scene: the living background bb shows behind its UI. It is ${moment.label} in the user's time zone.`,
    `The user asked for: ${JSON.stringify(request)}`,
    "Before writing any GLSL, expand that request into a full concept the way an art director would, keeping the user's words at its center:",
    "- The subject and setting, concretely.",
    "- A specific art style with visible traits: brushwork, texture, linework, lighting.",
    "- A four-color palette that makes it vivid against bb's UI.",
    "- The motion: what moves, and how wind, water, or light behaves.",
    "- What working agents become (bright, characterful elements), what waiting agents do, and what ripples become: finished turns, and something red for errors.",
    "- An evocative name under 40 characters.",
    "Say the expanded concept in two or three sentences, then paint it.",
  ];
}

export function dailyPrompt(moment: LocalMoment, timeZone: string, request?: string): string {
  return [
    ...conceptLines(moment, request),
    `The user's time zone is ${timeZone}.`,
    "It should feel alive, not like a still gradient:",
    "- Continuous, visible motion at the default speed: things drift, flow, orbit, or fall. Layer at least two motions at different speeds.",
    "- Agents (u_agents) are characters in the concept, not generic dots: give working agents movement or trails and let waiting agents pulse or call out.",
    "- Ripples (u_ripples) are events in the concept, like splashes, bursts, or gusts. Errors (kind 1) read red or alarming.",
    "- The cursor (u_pointer) disturbs the scene nearby.",
    "- Stay readable behind text: the motion can be lively, but keep contrast soft in the middle of the screen.",
    "Steps:",
    "1. Call the ambient tool with action=get to read the shader contract and the current scene, and action=library to see recent scenes; make something clearly different from them.",
    "2. Write the scene with action=set. Name it evocatively in under 40 characters, and expose 3 to 6 params someone would enjoy tuning (for example speed of a motion, density, glow, trail length).",
    "3. If set reports a compile error or that the scene is too heavy, fix the GLSL and set it again. Then call action=look with ripple=done and adjust until the report flags nothing (not too faint, nearly still, or too heavy) and the image shows the concept clearly.",
    "4. Call action=save so the scene lands in the library.",
    "If set says no bb window verified the scene, stop and say so instead of saving.",
    "Finish with one sentence describing the scene.",
  ].join("\n");
}

function describeControls(controls: Controls): string {
  return `${controls.enabled ? "on" : "off"}; Visibility (show-through) ${Math.round(controls.showThrough * 100)}%, Motion (speed) ${controls.speed}×, Detail (quality) ${Math.round(controls.quality * 100)}%, Glass opacity ${Math.round(controls.glass * 100)}%`;
}

function describeScene(state: AmbientState): string {
  const { scene, controls } = state;
  const params = scene.params
    .map(
      (entry) =>
        `  ${entry.id} = ${entry.value}  (${entry.label}; ${entry.min}..${entry.max}, step ${entry.step})`,
    )
    .join("\n");
  return [
    `Scene: ${scene.name}`,
    `Palette: ${scene.palette.join(" ")}`,
    `Params:\n${params || "  (none)"}`,
    `Controls: ${describeControls(controls)}`,
    `Source:\n${scene.source}`,
  ].join("\n");
}

const controlInputSchema = z
  .object({
    enabled: z.boolean(),
    visibility: controlFields.showThrough,
    motion: controlFields.speed,
    detail: controlFields.quality,
    glass: controlFields.glass,
  })
  .partial()
  .strict();

function controlsFromInput(input: z.infer<typeof controlInputSchema>): Partial<Controls> {
  return {
    ...(input.enabled === undefined ? {} : { enabled: input.enabled }),
    ...(input.visibility === undefined ? {} : { showThrough: input.visibility }),
    ...(input.motion === undefined ? {} : { speed: input.motion }),
    ...(input.detail === undefined ? {} : { quality: input.detail }),
    ...(input.glass === undefined ? {} : { glass: input.glass }),
  };
}

const CLI_CONTROL_KEYS: Record<string, "showThrough" | "speed" | "quality" | "glass"> = {
  glass: "glass",
  visibility: "showThrough",
  showthrough: "showThrough",
  motion: "speed",
  speed: "speed",
  detail: "quality",
  quality: "quality",
};

export function parseSetPairs(pairs: readonly string[]): {
  values: Record<string, number>;
  controls: Partial<Controls>;
} {
  const values: Record<string, number> = {};
  const controls: Partial<Controls> = {};
  for (const pair of pairs) {
    const match = /^([a-z][a-z0-9_]*)=(-?\d+(?:\.\d+)?)(%?)$/.exec(pair);
    if (!match) throw new Error(`expected <param>=<number>, got ${JSON.stringify(pair)}`);
    const [, key, number, percent] = match;
    const control = CLI_CONTROL_KEYS[key!];
    const value = Number(number) / (percent ? 100 : 1);
    if (control) {
      controls[control] = value;
    } else {
      values[key!] = value;
    }
  }
  return { values, controls };
}

function formatIssues(error: z.ZodError): string {
  return error.issues
    .map((issue) => `${issue.path.join(".") || "input"}: ${issue.message}`)
    .join("\n");
}

export default function plugin(bb: BbPluginApi): void {
  const compileWaiters = new Map<number, (report: CompileReport) => void>();
  const captureWaiters = new Map<string, (report: CaptureReport) => void>();
  let lastWindowAt = 0;
  let queue: Promise<unknown> = Promise.resolve();

  function serialized<T>(task: () => Promise<T>): Promise<T> {
    const run = queue.then(task, task);
    queue = run.catch(() => undefined);
    return run;
  }

  async function readState(): Promise<AmbientState> {
    const raw = await bb.storage.kv.get(STATE_KEY);
    const stored = stateSchema.safeParse(raw);
    if (stored.success) {
      return { ...stored.data, scene: rebuildBuiltIn(stored.data.scene) };
    }
    const base = initialState();
    if (raw === undefined) return base;
    bb.log.warn("Ambient state failed validation; keeping the parts that still parse");
    const record = typeof raw === "object" && raw !== null ? (raw as Record<string, unknown>) : {};
    const controls = controlsSchema.safeParse(record.controls);
    const scene = sceneSchema.safeParse(record.scene);
    const revision = z.number().int().nonnegative().safeParse(record.revision);
    return {
      ...base,
      ...(revision.success ? { revision: revision.data, sceneRevision: revision.data } : {}),
      ...(controls.success ? { controls: controls.data } : {}),
      ...(scene.success ? { scene: rebuildBuiltIn(scene.data) } : {}),
    };
  }

  async function writeState(
    next: Omit<AmbientState, "revision" | "sceneRevision">,
    options: { sceneChanged: boolean },
  ): Promise<AmbientState> {
    const previous = await readState();
    const state = stateSchema.parse({
      ...next,
      revision: previous.revision + 1,
      sceneRevision: options.sceneChanged
        ? previous.revision + 1
        : previous.sceneRevision,
    });
    await bb.storage.kv.set(STATE_KEY, state);
    bb.realtime.publish("state", {
      revision: state.revision,
      sceneRevision: state.sceneRevision,
    });
    return state;
  }

  async function readLastGood(): Promise<Scene | null> {
    const stored = sceneSchema.safeParse(await bb.storage.kv.get(LAST_GOOD_KEY));
    return stored.success ? rebuildBuiltIn(stored.data) : null;
  }

  async function restoreScene(sceneRevision: number, fallback?: Scene): Promise<boolean> {
    const current = await readState();
    if (current.sceneRevision !== sceneRevision) return false;
    const scene = fallback ?? (await readLastGood()) ?? DEFAULT_SCENE;
    await writeState({ ...current, scene }, { sceneChanged: true });
    return true;
  }

  async function readStoredDaily(): Promise<z.infer<typeof storedDailySchema>> {
    const stored = storedDailySchema.safeParse((await bb.storage.kv.get(DAILY_KEY)) ?? {});
    return stored.success
      ? stored.data
      : { automationId: null, hour: 8, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone };
  }

  async function automations<T>(method: string, input: JsonValue, outputSchema: z.ZodType<T>): Promise<T> {
    return bb.sdk.plugins.callRpc({ pluginId: AUTOMATIONS_PLUGIN_ID, method, input, outputSchema });
  }

  async function readAutomation(automationId: string | null): Promise<z.infer<typeof automationSchema> | null> {
    if (!automationId) return null;
    const listed = await automations("automations_list", { projectId: PERSONAL_PROJECT_ID }, z.array(z.unknown()));
    const entry = listed.find((candidate) => z.object({ id: z.literal(automationId) }).safeParse(candidate).success);
    if (entry === undefined) return null;
    const automation = automationSchema.safeParse(entry);
    if (!automation.success) throw new Error("The daily scene automation can't be read. Check it in Automations.");
    return automation.data;
  }

  async function readDaily(): Promise<DailyScene> {
    const stored = await readStoredDaily();
    const automation = await readAutomation(stored.automationId);
    return {
      enabled: automation?.enabled ?? false,
      hour: cronHour(automation?.trigger.cron) ?? stored.hour,
      timeZone: automation?.trigger.timezone ?? stored.timeZone,
      automationId: automation?.id ?? null,
      nextRunAt: automation?.nextRunAt ?? null,
      lastRunAt: automation?.lastRunAt ?? null,
    };
  }

  async function agentDefaults(): Promise<z.infer<typeof executionDefaultsSchema>> {
    const project = executionDefaultsSchema.safeParse(
      await bb.sdk.projects.defaultExecutionOptions({ projectId: PERSONAL_PROJECT_ID }),
    );
    if (project.success) return project.data;
    const [recent] = await bb.sdk.threads.list({ projectId: PERSONAL_PROJECT_ID, limit: 1 });
    if (recent) {
      const options = executionDefaultsSchema
        .omit({ providerId: true })
        .safeParse(await bb.sdk.threads.defaultExecutionOptions({ threadId: recent.id }));
      if (options.success) return { providerId: recent.providerId, ...options.data };
    }
    throw new Error("Start a thread in your personal workspace first so bb knows which agent to use.");
  }

  async function createDailyAutomation(hour: number, timeZone: string, enabled: boolean): Promise<string> {
    const defaults = { data: await agentDefaults() };
    const created = await automations(
      "automations_create",
      {
        projectId: PERSONAL_PROJECT_ID,
        name: DAILY_AUTOMATION_NAME,
        enabled,
        origin: "app",
        trigger: { triggerType: "schedule", cron: dailyCron(hour), timezone: timeZone },
        execution: {
          mode: "agent",
          prompt: DAILY_AUTOMATION_PROMPT,
          providerId: defaults.data.providerId,
          model: defaults.data.model,
          reasoningLevel: defaults.data.reasoningLevel,
          permissionMode: "auto",
          environment: { type: "project-default" },
        },
      },
      automationSchema,
    );
    return created.id;
  }

  function updateDaily(update: { enabled?: boolean; hour?: number; timeZone?: string }): Promise<DailyScene> {
    return serialized(async () => {
      const stored = await readStoredDaily();
      const hour = update.hour ?? stored.hour;
      const timeZone = update.timeZone ?? stored.timeZone;
      let automation = await readAutomation(stored.automationId);
      if (!automation && update.enabled) {
        automation = await readAutomation(await createDailyAutomation(hour, timeZone, true));
      } else if (automation) {
        const target = { projectId: PERSONAL_PROJECT_ID, automationId: automation.id };
        if (cronHour(automation.trigger.cron) !== hour || automation.trigger.timezone !== timeZone) {
          await automations(
            "automations_update",
            { ...target, trigger: { triggerType: "schedule", cron: dailyCron(hour), timezone: timeZone } },
            z.unknown(),
          );
        }
        if (update.enabled !== undefined && update.enabled !== automation.enabled) {
          await automations(update.enabled ? "automations_resume" : "automations_pause", target, z.unknown());
        }
      }
      await bb.storage.kv.set(DAILY_KEY, { automationId: automation?.id ?? null, hour, timeZone });
      bb.realtime.publish("daily", { automationId: automation?.id ?? null });
      return readDaily();
    });
  }

  function paintNow(): Promise<string | null> {
    return serialized(async () => {
      const stored = await readStoredDaily();
      const automationId =
        (await readAutomation(stored.automationId))?.id ??
        (await createDailyAutomation(stored.hour, stored.timeZone, false));
      if (automationId !== stored.automationId) {
        await bb.storage.kv.set(DAILY_KEY, { ...stored, automationId });
      }
      const { run } = await automations(
        "automations_run",
        { projectId: PERSONAL_PROJECT_ID, automationId },
        automationRunSchema,
      );
      if (run.status === "skipped" || run.status === "failed") {
        throw new Error(run.skipReason ?? run.error ?? `the run was ${run.status}`);
      }
      bb.realtime.publish("daily", { automationId });
      return run.threadId;
    });
  }

  async function dailyBrief(at: Date, request?: string): Promise<string> {
    if (at.getTime() - lastWindowAt > WINDOW_FRESH_MS) {
      return "No bb window is open, so the scene can't be checked. Stop now without changing the scene and say it was skipped because bb wasn't open.";
    }
    const { timeZone } = await readStoredDaily();
    return dailyPrompt(localMoment(timeZone, at), timeZone, request);
  }

  async function paintRequest(request: string): Promise<string> {
    const thread = await bb.sdk.threads.spawn({
      projectId: PERSONAL_PROJECT_ID,
      environment: { type: "project-default" },
      permissionMode: "auto",
      title: `Ambient: ${request.length > 48 ? `${request.slice(0, 47)}…` : request}`,
      prompt: `Paint a new Ambient scene the user described: ${JSON.stringify(request)}. Call the ambient tool with action=brief and request set to exactly that text, then follow the instructions it returns.`,
    });
    return thread.id;
  }

  async function readIndex(): Promise<LibraryIndex> {
    const stored = libraryIndexSchema.safeParse(await bb.storage.kv.get(LIBRARY_INDEX_KEY));
    if (stored.success) return stored.data;
    const keys = await bb.storage.kv.list(LIBRARY_PREFIX);
    const entries = await Promise.all(keys.map((key) => bb.storage.kv.get(key)));
    const index = entries
      .map((value) => libraryEntrySchema.safeParse(value))
      .flatMap((parsed) =>
        parsed.success
          ? [{ id: parsed.data.id, name: parsed.data.scene.name, savedAt: parsed.data.savedAt }]
          : [],
      )
      .sort((left, right) => right.savedAt - left.savedAt);
    await bb.storage.kv.set(LIBRARY_INDEX_KEY, index);
    return index;
  }

  async function readSaved(id: string): Promise<Scene | null> {
    const saved = libraryEntrySchema.safeParse(await bb.storage.kv.get(`${LIBRARY_PREFIX}${id}`));
    return saved.success ? rebuildBuiltIn(saved.data.scene) : null;
  }

  async function resolveScene(idOrName: string): Promise<Scene> {
    const wanted = idOrName.trim().toLowerCase();
    const builtIn = BUILT_IN_SCENES.find(
      (entry) => entry.id === wanted || entry.name.toLowerCase() === wanted,
    );
    if (builtIn) return sceneOf(builtIn);
    const byId = await readSaved(idOrName.trim());
    if (byId) return byId;
    const byName = (await readIndex()).find((entry) => entry.name.toLowerCase() === wanted);
    const named = byName ? await readSaved(byName.id) : null;
    if (named) return named;
    throw new Error(`no scene matches ${JSON.stringify(idOrName)}`);
  }

  function saveScene(name: string | undefined): Promise<string> {
    return serialized(async () => {
      const { scene } = await readState();
      let finalName = name ?? scene.name;
      if (BUILT_IN_SCENES.some((entry) => entry.name.toLowerCase() === finalName.toLowerCase())) {
        finalName = `${finalName.slice(0, 53)} (mine)`;
      }
      const index = await readIndex();
      const existing = index.find((entry) => entry.name.toLowerCase() === finalName.toLowerCase());
      let id = existing?.id;
      if (!id) {
        const taken = new Set([
          ...index.map((entry) => entry.id),
          ...BUILT_IN_SCENES.map((entry) => entry.id),
        ]);
        const base = slugOf(finalName);
        id = base;
        for (let suffix = 2; taken.has(id); suffix += 1) id = `${base}-${suffix}`;
      }
      const savedAt = Date.now();
      await bb.storage.kv.set(`${LIBRARY_PREFIX}${id}`, {
        id,
        scene: { ...scene, name: finalName },
        savedAt,
      } satisfies LibraryEntry);
      await bb.storage.kv.set(LIBRARY_INDEX_KEY, [
        { id, name: finalName, savedAt },
        ...index.filter((entry) => entry.id !== id),
      ]);
      bb.realtime.publish("library", { id });
      return id;
    });
  }

  function deleteScene(id: string): Promise<boolean> {
    return serialized(async () => {
      const key = `${LIBRARY_PREFIX}${id}`;
      if ((await bb.storage.kv.get(key)) === undefined) return false;
      await bb.storage.kv.delete(key);
      const index = await readIndex();
      await bb.storage.kv.set(
        LIBRARY_INDEX_KEY,
        index.filter((entry) => entry.id !== id),
      );
      bb.realtime.publish("library", { id });
      return true;
    });
  }

  async function libraryLines(): Promise<string[]> {
    return [
      ...BUILT_IN_SCENES.map((entry) => `${entry.id}  ${entry.name}  (built-in)`),
      ...(await readIndex()).map((entry) => `${entry.id}  ${entry.name}`),
    ];
  }

  function awaitCompile(sceneRevision: number): Promise<CompileReport | null> {
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        compileWaiters.delete(sceneRevision);
        resolve(null);
      }, COMPILE_TIMEOUT_MS);
      compileWaiters.set(sceneRevision, (report) => {
        clearTimeout(timer);
        compileWaiters.delete(sceneRevision);
        resolve(report);
      });
    });
  }

  function awaitCapture(request: CaptureRequest): Promise<CaptureReport | null> {
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        captureWaiters.delete(request.requestId);
        resolve(null);
      }, CAPTURE_TIMEOUT_MS);
      captureWaiters.set(request.requestId, (report) => {
        clearTimeout(timer);
        captureWaiters.delete(request.requestId);
        resolve(report);
      });
      bb.realtime.publish("capture", request);
    });
  }

  async function updateControls(partial: Partial<Controls>): Promise<AmbientState> {
    const state = await readState();
    return writeState(
      { ...state, controls: { ...state.controls, ...partial } },
      { sceneChanged: false },
    );
  }

  bb.rpc.register(ambientRpcContract, {
    state: () => readState(),
    async setValues({ values }) {
      const state = await readState();
      return writeState(
        { ...state, scene: applyValues(state.scene, values) },
        { sceneChanged: false },
      );
    },
    async setPalette({ palette }) {
      const state = await readState();
      return writeState(
        { ...state, scene: { ...state.scene, palette } },
        { sceneChanged: false },
      );
    },
    setControls: (partial) => updateControls(partial),
    async loadScene({ id }) {
      const state = await readState();
      return writeState(
        { ...state, scene: await resolveScene(id) },
        { sceneChanged: true },
      );
    },
    async saveScene({ name }) {
      return { id: await saveScene(name) };
    },
    async deleteScene({ id }) {
      return { deleted: await deleteScene(id) };
    },
    async library() {
      const saved = await readIndex();
      return {
        entries: [
          ...saved.map((entry) => ({ id: entry.id, name: entry.name, builtIn: false })),
          ...BUILT_IN_SCENES.map((entry) => ({
            id: entry.id,
            name: entry.name,
            builtIn: true,
          })),
        ],
      };
    },
    async reportCompile({ sceneRevision, ok, log }) {
      lastWindowAt = Date.now();
      const waiter = compileWaiters.get(sceneRevision);
      if (waiter) {
        waiter({ ok, ...(log === undefined ? {} : { log }) });
        return { accepted: true };
      }
      if (ok) {
        const current = await readState();
        if (current.sceneRevision === sceneRevision) {
          await bb.storage.kv.set(LAST_GOOD_KEY, current.scene);
        }
        return { accepted: true };
      }
      return { accepted: await serialized(() => restoreScene(sceneRevision)) };
    },
    submitCapture({ requestId, dataUrl, summary, visibility, dark }) {
      lastWindowAt = Date.now();
      const waiter = captureWaiters.get(requestId);
      waiter?.({ dataUrl, summary, visibility, dark });
      return { accepted: waiter !== undefined };
    },
    daily: () => readDaily(),
    setDaily: (update) => updateDaily(update),
    async paintNow() {
      return { threadId: await paintNow() };
    },
    async paintRequest({ request }) {
      return { threadId: await paintRequest(request) };
    },
    heartbeat() {
      lastWindowAt = Date.now();
      return { ok: true };
    },
  });

  bb.agents.registerTool({
    name: "ambient",
    description:
      "Read, rewrite, and look at the Ambient scene: the live GLSL background bb paints behind its UI, driven by what the user's agents are doing. The user tunes it with sliders generated from the params you declare.",
    instructions:
      "When the user asks to change bb's ambient background, call ambient action=get first for the shader contract and current source, then action=set, then action=look to see the result before describing it. Expose the knobs a person would want to play with as params rather than hard-coding them. To make the background subtler or bolder without rewriting the scene, use action=set with controls.visibility. When the user describes a new scene they want, call action=brief with request set to their words and follow the instructions it returns.",
    presentation: {
      label: { pending: "Painting the ambient scene", completed: "Painted the ambient scene" },
    },
    parameters: z.object({
      action: z
        .enum(["get", "set", "look", "library", "load", "save", "delete", "brief"])
        .describe(
          "get: shader contract + current scene. set: replace any of name/source/params/palette, nudge values, or change controls. look: capture the rendered scene as an image. library/load/save/delete: manage saved scenes. brief: step-by-step instructions for painting a new scene; pass request to paint what the user described, or omit it for today's daily concept.",
        ),
      name: sceneNameSchema.optional().describe("scene name (set, save)"),
      source: z
        .string()
        .max(MAX_SOURCE_LENGTH)
        .optional()
        .describe("GLSL defining vec3 scene(vec2 uv, vec2 p); see action=get"),
      params: z
        .array(
          z.object({
            id: z.string().regex(PARAM_ID_PATTERN),
            label: z.string().min(1).max(40),
            min: z.number(),
            max: z.number(),
            step: z.number().positive().optional(),
            value: z.number(),
          }),
        )
        .max(MAX_PARAMS)
        .optional()
        .describe("full slider list; each becomes uniform float p_<id>"),
      values: z
        .record(z.string(), z.number())
        .optional()
        .describe("set existing param values by id"),
      palette: z.array(hexColor).length(4).optional().describe("four #rrggbb colors"),
      controls: controlInputSchema
        .optional()
        .describe(
          "user display controls: enabled, visibility (0..1, how much of the scene shows through bb), motion (0..4 speed), detail (0.2..1 render resolution), glass (0.2..0.6 opacity of the frosted glass that keeps text readable over the scene; it is always on and can only be lowered from its 0.6 default)",
        ),
      ripple: rippleKindSchema
        .optional()
        .describe("look: fire a test ripple of this kind just before capturing"),
      id: z.string().optional().describe("scene id or name for action=load and action=delete"),
      request: sceneRequestSchema
        .optional()
        .describe("brief: the user's own description of the scene to paint, in their words"),
    }),
    async execute(input) {
      const error = (text: string) => ({
        content: [{ type: "text" as const, text }],
        isError: true,
      });
      try {
        if (input.action === "get") {
          return `${SHADER_CONTRACT}\n\n---\n${describeScene(await readState())}`;
        }
        if (input.action === "library") {
          return (await libraryLines()).join("\n");
        }
        if (input.action === "brief") {
          return dailyBrief(new Date(), input.request);
        }
        if (input.action === "load") {
          if (!input.id) return error("action=load needs an id");
          const state = await readState();
          const next = await writeState(
            { ...state, scene: await resolveScene(input.id) },
            { sceneChanged: true },
          );
          return `Loaded ${next.scene.name}.`;
        }
        if (input.action === "save") {
          const id = await saveScene(input.name);
          return `Saved as ${id}.`;
        }
        if (input.action === "delete") {
          if (!input.id) return error("action=delete needs an id");
          return (await deleteScene(input.id))
            ? `Deleted ${input.id}.`
            : error(`no saved scene ${JSON.stringify(input.id)}; built-in scenes cannot be deleted`);
        }
        if (input.action === "look") {
          const report = await awaitCapture({
            requestId: randomUUID(),
            ripple: input.ripple ?? null,
          });
          if (!report) {
            return error("No visible bb window answered. The user needs bb open in the foreground with Ambient enabled.");
          }
          const { working, waiting } = report.summary;
          return {
            content: [
              {
                type: "image" as const,
                data: report.dataUrl.slice("data:image/png;base64,".length),
                mimeType: "image/png",
              },
              {
                type: "text" as const,
                text: `Captured the raw scene (bb's UI veil is not included). Live agents: ${working} working, ${waiting} waiting. ${describeVisibility(report.visibility, report.dark)}`,
              },
            ],
          };
        }

        const state = await readState();
        const structural =
          input.source !== undefined || input.params !== undefined;
        let scene: Scene = {
          ...state.scene,
          ...(input.name === undefined ? {} : { name: input.name }),
          ...(input.source === undefined ? {} : { source: input.source }),
          ...(input.palette === undefined
            ? {}
            : { palette: input.palette as Scene["palette"] }),
          ...(input.params === undefined
            ? {}
            : {
                params: input.params.map((entry) => ({
                  ...entry,
                  step: entry.step ?? (entry.max - entry.min) / 100,
                })),
              }),
        };
        if (structural) delete scene.baseId;
        if (input.values) scene = applyValues(scene, input.values);
        const parsed = sceneSchema.safeParse(scene);
        if (!parsed.success) return error(formatIssues(parsed.error));
        if (!/\bvec3\s+scene\s*\(/.test(parsed.data.source)) {
          return error("source must define vec3 scene(vec2 uv, vec2 p)");
        }
        const next = await writeState(
          {
            ...state,
            scene: parsed.data,
            controls: { ...state.controls, ...controlsFromInput(input.controls ?? {}) },
          },
          { sceneChanged: structural },
        );
        if (!structural) return `Updated ${next.scene.name}. Controls: ${describeControls(next.controls)}.`;
        const report = await awaitCompile(next.sceneRevision);
        if (report === null) {
          await serialized(() => restoreScene(next.sceneRevision, state.scene));
          return error(
            `No visible bb window verified ${next.scene.name} within ${COMPILE_TIMEOUT_MS / 1000}s, so it was not applied. Ask the user to bring bb to the foreground and try again.`,
          );
        }
        if (!report.ok) {
          await serialized(() => restoreScene(next.sceneRevision, state.scene));
          return error(`The scene was not applied; the previous scene was restored.\n${report.log ?? ""}`);
        }
        await bb.storage.kv.set(LAST_GOOD_KEY, next.scene);
        return `Compiled and live: ${next.scene.name} with ${next.scene.params.length} sliders.`;
      } catch (caught) {
        if (caught instanceof z.ZodError) return error(formatIssues(caught));
        return error(caught instanceof Error ? caught.message : String(caught));
      }
    },
  });

  bb.cli.register({
    name: "ambient",
    summary: "Control bb's generative ambient background",
    commands: [
      { name: "status", summary: "Show the active scene, its params, and controls", usage: "bb ambient status" },
      { name: "list", summary: "List built-in and saved scenes", usage: "bb ambient list" },
      { name: "load", summary: "Make a built-in or saved scene active", usage: "bb ambient load <id-or-name>" },
      {
        name: "set",
        summary: "Set scene params or the Visibility, Motion, Detail, and Glass opacity controls",
        usage: "bb ambient set <param|visibility|motion|detail|glass>=<value>[%] [...]",
      },
      { name: "palette", summary: "Set the scene's four colors", usage: "bb ambient palette <#rrggbb> <#rrggbb> <#rrggbb> <#rrggbb>" },
      { name: "save", summary: "Save the active scene to the library", usage: "bb ambient save [name]" },
      { name: "delete", summary: "Remove a saved scene from the library", usage: "bb ambient delete <id>" },
      { name: "on", summary: "Turn the background on", usage: "bb ambient on" },
      { name: "off", summary: "Turn the background off", usage: "bb ambient off" },
      {
        name: "paint",
        summary: "Start a thread where an agent paints the scene you describe",
        usage: "bb ambient paint <description>",
      },
      {
        name: "daily",
        summary: "Have an agent paint a new scene every morning",
        usage: "bb ambient daily <status|on [hour] [time-zone]|off|now>",
      },
    ],
    async run(argv) {
      const [command, ...rest] = argv;
      try {
        if (command === "status") {
          const state = await readState();
          const lines = describeScene(state).split("\nSource:")[0];
          return { exitCode: 0, stdout: `${lines}\n` };
        }
        if (command === "list") {
          return { exitCode: 0, stdout: `${(await libraryLines()).join("\n")}\n` };
        }
        if (command === "load") {
          const id = rest.join(" ").trim();
          if (!id) throw new Error("usage: bb ambient load <id-or-name>");
          const state = await readState();
          const next = await writeState(
            { ...state, scene: await resolveScene(id) },
            { sceneChanged: true },
          );
          return { exitCode: 0, stdout: `loaded ${next.scene.name}\n` };
        }
        if (command === "set") {
          if (rest.length === 0) {
            throw new Error("usage: bb ambient set <param|visibility|motion|detail>=<value>[%] [...]");
          }
          const { values, controls } = parseSetPairs(rest);
          const state = await readState();
          const next = await writeState(
            {
              ...state,
              scene: applyValues(state.scene, values),
              controls: controlsSchema.parse({ ...state.controls, ...controls }),
            },
            { sceneChanged: false },
          );
          const applied = next.scene.params
            .filter((entry) => Object.hasOwn(values, entry.id))
            .map((entry) => `${entry.id}=${entry.value}`);
          if (Object.keys(controls).length > 0) applied.push(describeControls(next.controls));
          return { exitCode: 0, stdout: `${applied.join("\n")}\n` };
        }
        if (command === "palette") {
          const palette = paletteSchema.parse(rest);
          const state = await readState();
          await writeState({ ...state, scene: { ...state.scene, palette } }, { sceneChanged: false });
          return { exitCode: 0, stdout: `palette ${palette.join(" ")}\n` };
        }
        if (command === "save") {
          const name = rest.join(" ").trim();
          const id = await saveScene(name ? sceneNameSchema.parse(name) : undefined);
          return { exitCode: 0, stdout: `saved as ${id}\n` };
        }
        if (command === "delete") {
          const id = rest.join(" ").trim();
          if (!id) throw new Error("usage: bb ambient delete <id>");
          if (!(await deleteScene(id))) throw new Error(`no saved scene ${JSON.stringify(id)}; built-in scenes cannot be deleted`);
          return { exitCode: 0, stdout: `deleted ${id}\n` };
        }
        if (command === "on" || command === "off") {
          await updateControls({ enabled: command === "on" });
          return { exitCode: 0, stdout: `ambient ${command}\n` };
        }
        if (command === "paint") {
          const request = sceneRequestSchema.parse(rest.join(" "));
          const threadId = await paintRequest(request);
          return { exitCode: 0, stdout: `painting in ${threadId}\n` };
        }
        if (command === "daily") {
          const [action = "status", ...options] = rest;
          if (action === "now") {
            const threadId = await paintNow();
            return { exitCode: 0, stdout: `painting${threadId ? ` in ${threadId}` : ""}\n` };
          }
          if (action === "on" || action === "off") {
            await updateDaily(
              dailyUpdateSchema.parse({ enabled: action === "on", ...parseDailyOptions(options) }),
            );
          } else if (action !== "status") {
            throw new Error("usage: bb ambient daily <status|on [hour] [time-zone]|off|now>");
          }
          const daily = await readDaily();
          const schedule = daily.enabled
            ? `on, after ${daily.hour}:00 ${daily.timeZone} (bb automation ${daily.automationId})`
            : "off";
          const next = daily.nextRunAt ? new Date(daily.nextRunAt).toISOString() : "none";
          return { exitCode: 0, stdout: `daily scene: ${schedule}\nnext run: ${daily.enabled ? next : "none"}\n` };
        }
        return {
          exitCode: 1,
          stderr: "usage: bb ambient <status|list|load|set|palette|save|delete|on|off|paint|daily>\n",
        };
      } catch (caught) {
        const message =
          caught instanceof z.ZodError
            ? formatIssues(caught)
            : caught instanceof Error
              ? caught.message
              : String(caught);
        return { exitCode: 1, stderr: `${message}\n` };
      }
    },
  });

  bb.log.info("Ambient loaded");
}
