import { randomUUID } from "node:crypto";

import { defineRpcContract, type BbPluginApi } from "@get-bb/plugin-sdk";
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
});

const controlsSchema = z.object({
  enabled: z.boolean(),
  showThrough: z.number().min(0).max(1),
  speed: z.number().min(0).max(4),
  quality: z.number().min(0.2).max(1),
});

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

const rippleKindSchema = z.enum(["done", "error", "started"]);

const summarySchema = z.object({
  working: z.number().int().nonnegative(),
  waiting: z.number().int().nonnegative(),
});

const visibilitySchema = z.object({
  fromBackground: z.number().min(0).max(1),
  spread: z.number().min(0).max(1),
});

const FAINT_FROM_BACKGROUND = 0.06;
const FLAT_SPREAD = 0.025;

export function describeVisibility(
  visibility: z.infer<typeof visibilitySchema>,
  dark: boolean,
): string {
  const percent = (value: number) => `${Math.round(value * 100)}%`;
  const measured = `Measured against bb's ${dark ? "dark" : "light"} background: ${percent(visibility.fromBackground)} average color difference, ${percent(visibility.spread)} brightness variation.`;
  const problems = [
    visibility.fromBackground < FAINT_FROM_BACKGROUND &&
      "the scene is nearly the same color as bb's background, so it will be close to invisible behind bb's veil",
    visibility.spread < FLAT_SPREAD && "the scene is almost flat, with little visible structure",
  ].filter(Boolean);
  if (problems.length === 0) return measured;
  return `${measured} Too faint: ${problems.join("; ")}. The veil already adapts to the theme, so do not darken or wash out the scene yourself; raise its contrast and color.`;
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
  lastRunDate: z.string().nullable(),
  lastThreadId: z.string().nullable(),
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
    input: controlsSchema.partial().strict(),
    output: stateSchema,
  },
  loadScene: {
    input: z.object({ id: z.string().min(1) }).strict(),
    output: stateSchema,
  },
  saveScene: {
    input: z.object({ name: z.string().min(1).max(60).optional() }).strict(),
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
  paintNow: { input: z.null(), output: z.object({ threadId: z.string() }) },
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
      entry.id in values
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

export function isDailyDue(daily: DailyScene, at: Date): boolean {
  if (!daily.enabled) return false;
  const moment = localMoment(daily.timeZone, at);
  return moment.date !== daily.lastRunDate && moment.hour >= daily.hour;
}

export function dailyPrompt(moment: LocalMoment, timeZone: string): string {
  return [
    `Paint today's Ambient scene: the generative background bb shows behind its UI. It is ${moment.label} in the user's time zone (${timeZone}).`,
    "1. Call the ambient tool with action=get to read the shader contract and the current scene.",
    "2. Write a new scene with action=set that fits today. Draw on the season and time of day, and on what the user has been working on lately (`bb thread list` shows recent thread titles). It must stay calm and low-contrast enough to sit behind text. Name it after the day's mood in under 40 characters, and expose 3 to 6 params someone would enjoy tuning.",
    "3. If the compile fails, fix the GLSL and set it again. Then call action=look and adjust until the capture is neither too busy nor reported as too faint.",
    "4. Call action=save so the scene lands in the library.",
    "If no bb window is open, set reports the scene as unverified and look cannot capture; keep the GLSL conservative and save anyway.",
    "Finish with one sentence describing the scene.",
  ].join("\n");
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
    `User controls: ${controls.enabled ? "on" : "off"}, show-through ${controls.showThrough}, speed ${controls.speed}, quality ${controls.quality}`,
    `Source:\n${scene.source}`,
  ].join("\n");
}

export default function plugin(bb: BbPluginApi): void {
  const compileWaiters = new Map<number, (report: CompileReport) => void>();
  const captureWaiters = new Map<string, (report: CaptureReport) => void>();

  async function readState(): Promise<AmbientState> {
    const stored = stateSchema.safeParse(await bb.storage.kv.get(STATE_KEY));
    return stored.success ? stored.data : initialState();
  }

  async function writeState(
    next: Omit<AmbientState, "revision" | "sceneRevision">,
    options: { sceneChanged: boolean },
  ): Promise<AmbientState> {
    const previous = await readState();
    const state: AmbientState = {
      ...next,
      revision: previous.revision + 1,
      sceneRevision: options.sceneChanged
        ? previous.revision + 1
        : previous.sceneRevision,
    };
    await bb.storage.kv.set(STATE_KEY, state);
    bb.realtime.publish("state", {
      revision: state.revision,
      sceneRevision: state.sceneRevision,
    });
    return state;
  }

  async function readDaily(): Promise<DailyScene> {
    const stored = dailySchema.safeParse(await bb.storage.kv.get(DAILY_KEY));
    if (stored.success) return stored.data;
    return {
      enabled: false,
      hour: 8,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      lastRunDate: null,
      lastThreadId: null,
    };
  }

  async function writeDaily(daily: DailyScene): Promise<DailyScene> {
    await bb.storage.kv.set(DAILY_KEY, daily);
    bb.realtime.publish("daily", { lastRunDate: daily.lastRunDate });
    return daily;
  }

  async function paintScene(at: Date): Promise<string> {
    const daily = await readDaily();
    const moment = localMoment(daily.timeZone, at);
    const thread = await bb.sdk.threads.spawn({
      projectId: PERSONAL_PROJECT_ID,
      environment: { type: "project-default" },
      title: `Ambient scene for ${moment.label.split(" at ")[0]}`,
      prompt: dailyPrompt(moment, daily.timeZone),
    });
    const threadId = thread.id;
    await writeDaily({ ...daily, lastRunDate: moment.date, lastThreadId: threadId });
    return threadId;
  }

  async function listLibrary(): Promise<LibraryEntry[]> {
    const keys = await bb.storage.kv.list(LIBRARY_PREFIX);
    const values = await Promise.all(keys.map((key) => bb.storage.kv.get(key)));
    return values
      .map((value) => libraryEntrySchema.safeParse(value))
      .flatMap((parsed) => (parsed.success ? [parsed.data] : []))
      .sort((left, right) => right.savedAt - left.savedAt);
  }

  async function resolveScene(id: string): Promise<Scene> {
    const builtIn = BUILT_IN_SCENES.find((entry) => entry.id === id);
    if (builtIn) return sceneOf(builtIn);
    const saved = libraryEntrySchema.safeParse(
      await bb.storage.kv.get(`${LIBRARY_PREFIX}${id}`),
    );
    if (saved.success) return saved.data.scene;
    const byName = (await listLibrary()).find(
      (entry) => entry.scene.name.toLowerCase() === id.toLowerCase(),
    );
    if (byName) return byName.scene;
    throw new Error(`no scene matches ${JSON.stringify(id)}`);
  }

  async function saveScene(name: string | undefined): Promise<string> {
    const { scene } = await readState();
    const finalName = name ?? scene.name;
    const base = slugOf(finalName);
    const existing = new Set((await listLibrary()).map((entry) => entry.id));
    const builtInIds = new Set(BUILT_IN_SCENES.map((entry) => entry.id));
    let id = base;
    for (let suffix = 2; existing.has(id) || builtInIds.has(id); suffix += 1) {
      id = `${base}-${suffix}`;
    }
    await bb.storage.kv.set(`${LIBRARY_PREFIX}${id}`, {
      id,
      scene: { ...scene, name: finalName },
      savedAt: Date.now(),
    } satisfies LibraryEntry);
    bb.realtime.publish("library", { id });
    return id;
  }

  async function deleteScene(id: string): Promise<boolean> {
    const key = `${LIBRARY_PREFIX}${id}`;
    if ((await bb.storage.kv.get(key)) === undefined) return false;
    await bb.storage.kv.delete(key);
    bb.realtime.publish("library", { id });
    return true;
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
    async setControls(partial) {
      const state = await readState();
      return writeState(
        { ...state, controls: { ...state.controls, ...partial } },
        { sceneChanged: false },
      );
    },
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
      const saved = await listLibrary();
      return {
        entries: [
          ...saved.map((entry) => ({
            id: entry.id,
            name: entry.scene.name,
            builtIn: false,
          })),
          ...BUILT_IN_SCENES.map((entry) => ({
            id: entry.id,
            name: entry.name,
            builtIn: true,
          })),
        ],
      };
    },
    reportCompile({ sceneRevision, ok, log }) {
      const waiter = compileWaiters.get(sceneRevision);
      waiter?.({ ok, ...(log === undefined ? {} : { log }) });
      return { accepted: waiter !== undefined };
    },
    submitCapture({ requestId, dataUrl, summary, visibility, dark }) {
      const waiter = captureWaiters.get(requestId);
      waiter?.({ dataUrl, summary, visibility, dark });
      return { accepted: waiter !== undefined };
    },
    daily: () => readDaily(),
    async setDaily(update) {
      return writeDaily({ ...(await readDaily()), ...update });
    },
    async paintNow() {
      return { threadId: await paintScene(new Date()) };
    },
  });

  bb.background.schedule("daily-scene", "*/15 * * * *", async () => {
    const now = new Date();
    if (isDailyDue(await readDaily(), now)) await paintScene(now);
  });

  bb.agents.registerTool({
    name: "ambient",
    description:
      "Read, rewrite, and look at the Ambient scene: the live GLSL background bb paints behind its UI, driven by what the user's agents are doing. The user tunes it with sliders generated from the params you declare.",
    instructions:
      "When the user asks to change bb's ambient background, call ambient action=get first for the shader contract and current source, then action=set, then action=look to see the result before describing it. Expose the knobs a person would want to play with as params rather than hard-coding them.",
    presentation: {
      label: { pending: "Painting the ambient scene", completed: "Painted the ambient scene" },
    },
    parameters: z.object({
      action: z
        .enum(["get", "set", "look", "library", "load", "save"])
        .describe(
          "get: shader contract + current scene. set: replace any of name/source/params/palette or nudge values. look: capture the rendered scene as an image. library/load/save: manage saved scenes.",
        ),
      name: z.string().min(1).max(60).optional().describe("scene name (set, save)"),
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
      ripple: rippleKindSchema
        .optional()
        .describe("look: fire a test ripple of this kind just before capturing"),
      id: z.string().optional().describe("scene id or name for action=load"),
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
          const saved = await listLibrary();
          return [
            ...BUILT_IN_SCENES.map((entry) => `${entry.id}  ${entry.name}  (built-in)`),
            ...saved.map((entry) => `${entry.id}  ${entry.scene.name}`),
          ].join("\n");
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
        if (input.action === "look") {
          const report = await awaitCapture({
            requestId: randomUUID(),
            ripple: input.ripple ?? null,
          });
          if (!report) {
            return error("No bb window answered. The user needs a bb window open with Ambient enabled.");
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
        if (input.values) scene = applyValues(scene, input.values);
        const parsed = sceneSchema.safeParse(scene);
        if (!parsed.success) {
          return error(parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("\n"));
        }
        if (!/\bvec3\s+scene\s*\(/.test(parsed.data.source)) {
          return error("source must define vec3 scene(vec2 uv, vec2 p)");
        }
        const next = await writeState(
          { ...state, scene: parsed.data },
          { sceneChanged: structural },
        );
        if (!structural) return `Updated ${next.scene.name}.`;
        const report = await awaitCompile(next.sceneRevision);
        if (report === null) {
          return `Saved ${next.scene.name}, but no bb window compiled it within ${COMPILE_TIMEOUT_MS / 1000}s, so it is unverified.`;
        }
        if (!report.ok) {
          await writeState(
            { ...next, scene: state.scene },
            { sceneChanged: true },
          );
          return error(
            `GLSL compile failed; the previous scene was restored.\n${report.log ?? ""}`,
          );
        }
        return `Compiled and live: ${next.scene.name} with ${next.scene.params.length} sliders.`;
      } catch (caught) {
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
      { name: "set", summary: "Set scene params", usage: "bb ambient set <param>=<value> [...]" },
      { name: "save", summary: "Save the active scene to the library", usage: "bb ambient save [name]" },
      { name: "delete", summary: "Remove a saved scene from the library", usage: "bb ambient delete <id>" },
      { name: "on", summary: "Turn the background on", usage: "bb ambient on" },
      { name: "off", summary: "Turn the background off", usage: "bb ambient off" },
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
          const saved = await listLibrary();
          const lines = [
            ...BUILT_IN_SCENES.map((entry) => `${entry.id}  ${entry.name}  (built-in)`),
            ...saved.map((entry) => `${entry.id}  ${entry.scene.name}`),
          ];
          return { exitCode: 0, stdout: `${lines.join("\n")}\n` };
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
          if (rest.length === 0) throw new Error("usage: bb ambient set <param>=<value> [...]");
          const values: Record<string, number> = {};
          for (const pair of rest) {
            const match = /^([a-z][a-z0-9_]*)=(-?\d+(?:\.\d+)?)$/.exec(pair);
            if (!match) throw new Error(`expected <param>=<number>, got ${JSON.stringify(pair)}`);
            values[match[1]!] = Number(match[2]);
          }
          const state = await readState();
          const next = await writeState(
            { ...state, scene: applyValues(state.scene, values) },
            { sceneChanged: false },
          );
          const applied = next.scene.params
            .filter((entry) => entry.id in values)
            .map((entry) => `${entry.id}=${entry.value}`)
            .join(" ");
          return { exitCode: 0, stdout: `${applied}\n` };
        }
        if (command === "save") {
          const name = rest.join(" ").trim();
          const id = await saveScene(name || undefined);
          return { exitCode: 0, stdout: `saved as ${id}\n` };
        }
        if (command === "delete") {
          const id = rest.join(" ").trim();
          if (!id) throw new Error("usage: bb ambient delete <id>");
          if (!(await deleteScene(id))) throw new Error(`no saved scene ${JSON.stringify(id)}; built-in scenes cannot be deleted`);
          return { exitCode: 0, stdout: `deleted ${id}\n` };
        }
        if (command === "on" || command === "off") {
          const state = await readState();
          await writeState(
            { ...state, controls: { ...state.controls, enabled: command === "on" } },
            { sceneChanged: false },
          );
          return { exitCode: 0, stdout: `ambient ${command}\n` };
        }
        if (command === "daily") {
          const [action = "status", ...options] = rest;
          if (action === "now") {
            return { exitCode: 0, stdout: `painting in ${await paintScene(new Date())}\n` };
          }
          if (action === "on" || action === "off") {
            const [hourText, timeZone] = options;
            const hour = hourText === undefined ? undefined : Number(hourText);
            const update = dailyUpdateSchema.parse({
              enabled: action === "on",
              ...(hour === undefined ? {} : { hour }),
              ...(timeZone === undefined ? {} : { timeZone }),
            });
            await writeDaily({ ...(await readDaily()), ...update });
          } else if (action !== "status") {
            throw new Error("usage: bb ambient daily <status|on [hour] [time-zone]|off|now>");
          }
          const daily = await readDaily();
          const schedule = daily.enabled
            ? `on, after ${daily.hour}:00 ${daily.timeZone}`
            : "off";
          const last = daily.lastRunDate
            ? `${daily.lastRunDate} (${daily.lastThreadId ?? "no thread"})`
            : "never";
          return { exitCode: 0, stdout: `daily scene: ${schedule}\nlast painted: ${last}\n` };
        }
        return {
          exitCode: 1,
          stderr: "usage: bb ambient <status|list|load|set|save|delete|on|off|daily>\n",
        };
      } catch (caught) {
        const message = caught instanceof Error ? caught.message : String(caught);
        return { exitCode: 1, stderr: `${message}\n` };
      }
    },
  });

  bb.log.info("Ambient loaded");
}
