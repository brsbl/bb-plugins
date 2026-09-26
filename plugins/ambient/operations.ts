import type { BbPluginApi, JsonValue } from "@get-bb/plugin-sdk";
import { z } from "zod";

import { BUILT_IN_SCENES, DEFAULT_SCENE, rebuildBuiltIn, sceneOf } from "./builtins.js";
import {
  DEFAULT_CONTROLS,
  type Controls,
  type Scene,
  type SceneParam,
  type SceneRef,
} from "./contract.js";
import { cronHour, dailyCron, dailyPrompt, localMoment } from "./daily.js";
import {
  controlsSchema,
  libraryEntrySchema,
  libraryIndexSchema,
  sceneRefSchema,
  sceneSchema,
  stateSchema,
  storedControlsSchema,
  timeZoneSchema,
  tweaksSchema,
  type AmbientState,
  type CaptureReport,
  type CaptureRequest,
  type DailyScene,
  type DailyUpdate,
  type LibraryEntry,
  type LibraryIndex,
} from "./rpc.js";

const STATE_KEY = "state";
const DAILY_KEY = "daily";
const LIBRARY_PREFIX = "library/";
const TWEAKS_PREFIX = "tweaks/";
const LAST_GOOD_KEY = "last-good";
const LIBRARY_INDEX_KEY = "library-index";
export const COMPILE_TIMEOUT_MS = 6_000;
const CAPTURE_TIMEOUT_MS = 8_000;
const PERSONAL_PROJECT_ID = "proj_personal";
const WINDOW_FRESH_MS = 3 * 60_000;
const AUTOMATIONS_PLUGIN_ID = "automations";
const DAILY_AUTOMATION_NAME = "Ambient: new scene every morning";
const PAINT_REASONING_LEVEL = "high";
const DAILY_AUTOMATION_PROMPT =
  "Paint today's Ambient scene: call the ambient tool with action=brief and follow the instructions it returns.";

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

const executionDefaultsSchema = z.object({
  providerId: z.string().min(1),
  model: z.string().min(1),
  reasoningLevel: z.string().min(1),
});

type CompileReport = { ok: boolean; log?: string };
type SceneFields = Omit<AmbientState, "revision" | "sceneRevision">;

/** One change to the open scene, from the panel, the agent tool, or the CLI. */
export interface SceneEdit {
  name?: string;
  source?: string;
  params?: Array<Omit<SceneParam, "step"> & { step?: number | undefined }>;
  palette?: Scene["palette"];
  values?: Record<string, number>;
  controls?: Partial<Controls>;
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
        ? { ...entry, value: Math.min(entry.max, Math.max(entry.min, values[entry.id]!)) }
        : entry,
    ),
  };
}

function sameScene(left: Scene, right: Scene): boolean {
  const key = (scene: Scene) =>
    JSON.stringify([
      scene.name,
      scene.source,
      scene.palette,
      scene.params.map((entry) => [entry.id, entry.label, entry.min, entry.max, entry.step, entry.value]),
    ]);
  return key(left) === key(right);
}

function slugOf(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return slug || "scene";
}

function nextFree(base: string, taken: Set<string>, join: string): string {
  if (!taken.has(base.toLowerCase())) return base;
  let suffix = 2;
  while (taken.has(`${base}${join}${suffix}`.toLowerCase())) suffix += 1;
  return `${base}${join}${suffix}`;
}

/** The single rule for scene names: never reuse a built-in's or another saved scene's name. */
export function uniqueName(name: string, index: LibraryIndex): string {
  const taken = new Set([...BUILT_IN_SCENES, ...index].map((entry) => entry.name.toLowerCase()));
  return taken.has(name.toLowerCase()) ? nextFree(name.slice(0, 56), taken, " ") : name;
}

function uniqueId(name: string, index: LibraryIndex): string {
  return nextFree(slugOf(name), new Set([...BUILT_IN_SCENES, ...index].map((entry) => entry.id)), "-");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function initialState(): AmbientState {
  return {
    revision: 1,
    sceneRevision: 1,
    scene: DEFAULT_SCENE,
    ref: { kind: "builtIn", id: DEFAULT_SCENE.baseId! },
    controls: DEFAULT_CONTROLS,
  };
}

/**
 * Every Ambient mutation, queued so concurrent callers never overwrite each other. The RPC
 * handlers, the agent tool, and the CLI are thin adapters over this.
 */
export function createOperations(bb: BbPluginApi) {
  const kv = bb.storage.kv;
  const compileWaiters = new Map<number, (report: CompileReport) => void>();
  const captureWaiters = new Map<string, (report: CaptureReport) => void>();
  let lastWindowAt = 0;
  let queue: Promise<unknown> = Promise.resolve();

  function serialized<T>(task: () => Promise<T>): Promise<T> {
    const run = queue.then(task, task);
    queue = run.catch(() => undefined);
    return run;
  }

  // ---- state -------------------------------------------------------------

  async function readIndex(): Promise<LibraryIndex> {
    const stored = libraryIndexSchema.safeParse(await kv.get(LIBRARY_INDEX_KEY));
    if (stored.success) return stored.data;
    const keys = await kv.list(LIBRARY_PREFIX);
    const entries = await Promise.all(keys.map((key) => kv.get(key)));
    const index = entries
      .map((value) => libraryEntrySchema.safeParse(value))
      .flatMap((parsed) =>
        parsed.success
          ? [{ id: parsed.data.id, name: parsed.data.scene.name, savedAt: parsed.data.savedAt }]
          : [],
      )
      .sort((left, right) => right.savedAt - left.savedAt);
    await kv.set(LIBRARY_INDEX_KEY, index);
    return index;
  }

  async function readEntry(id: string): Promise<LibraryEntry | null> {
    const entry = libraryEntrySchema.safeParse(await kv.get(`${LIBRARY_PREFIX}${id}`));
    return entry.success ? entry.data : null;
  }

  /** States written before refs existed matched scenes by name; derive the same answer once. */
  async function deriveRef(scene: Scene): Promise<SceneRef | null> {
    const builtIn = BUILT_IN_SCENES.find((entry) => entry.name === scene.name);
    if (builtIn) return { kind: "builtIn", id: builtIn.id };
    const saved = (await readIndex()).find((entry) => entry.name === scene.name);
    return saved ? { kind: "saved", id: saved.id } : null;
  }

  async function readState(): Promise<AmbientState> {
    const raw = await kv.get(STATE_KEY);
    if (raw === undefined) return initialState();
    const record = isRecord(raw) ? raw : {};
    const revision = z.number().int().nonnegative().safeParse(record.revision);
    const sceneRevision = z.number().int().nonnegative().safeParse(record.sceneRevision);
    const scene = sceneSchema.safeParse(record.scene);
    const ref = sceneRefSchema.nullable().safeParse(record.ref);
    const controls = storedControlsSchema.safeParse(record.controls ?? {});
    if (!revision.success || !scene.success) {
      bb.log.warn("Ambient state failed validation; keeping the parts that still parse");
    }
    const current = scene.success ? rebuildBuiltIn(scene.data) : DEFAULT_SCENE;
    const base = revision.success ? revision.data : 1;
    return {
      revision: base,
      sceneRevision: sceneRevision.success ? sceneRevision.data : base,
      scene: current,
      ref: scene.success && ref.success && "ref" in record ? ref.data : await deriveRef(current),
      controls: controls.success ? controls.data : DEFAULT_CONTROLS,
    };
  }

  /** Only call from inside serialized(). */
  async function writeState(next: SceneFields, options: { sceneChanged: boolean }): Promise<AmbientState> {
    const previous = await readState();
    const state = stateSchema.parse({
      ...next,
      revision: previous.revision + 1,
      sceneRevision: options.sceneChanged ? previous.revision + 1 : previous.sceneRevision,
    });
    await kv.set(STATE_KEY, state);
    bb.realtime.publish("state", { revision: state.revision, sceneRevision: state.sceneRevision });
    return state;
  }

  function update(
    change: (state: AmbientState) => SceneFields | Promise<SceneFields>,
    options: { sceneChanged: boolean; autosave?: boolean },
  ): Promise<AmbientState> {
    return serialized(async () => {
      const next = await writeState(await change(await readState()), options);
      if (options.autosave) await autosave(next);
      return next;
    });
  }

  /** Rewrites a state from an earlier version (no ref, a synced Detail) in the current shape. */
  function migrate(): Promise<void> {
    return serialized(async () => {
      const raw = await kv.get(STATE_KEY);
      if (!isRecord(raw)) return;
      const legacy = !("ref" in raw) || (isRecord(raw.controls) && "quality" in raw.controls);
      if (legacy) await kv.set(STATE_KEY, stateSchema.parse(await readState()));
    });
  }

  /**
   * Writes edits back to the library entry the open scene came from. Skips a scene whose shader
   * no window has compiled yet; the compile commit saves it once it's known to work.
   */
  async function autosave(state: AmbientState): Promise<void> {
    const { scene, ref } = state;
    if (!ref || compileWaiters.has(state.sceneRevision)) return;
    if (ref.kind === "builtIn") {
      const key = `${TWEAKS_PREFIX}${ref.id}`;
      const fresh = (await kv.get(key)) === undefined;
      await kv.set(key, {
        values: Object.fromEntries(scene.params.map((entry) => [entry.id, entry.value])),
        palette: scene.palette,
        ...(scene.baseId === ref.id ? {} : { scene }),
      });
      if (fresh) bb.realtime.publish("library", { id: ref.id });
      return;
    }
    const current = await readEntry(ref.id);
    if (!current || sameScene(current.scene, scene)) return;
    await kv.set(`${LIBRARY_PREFIX}${ref.id}`, {
      ...current,
      original: current.original ?? current.scene,
      scene,
    } satisfies LibraryEntry);
    if (current.original === undefined) bb.realtime.publish("library", { id: ref.id });
  }

  // ---- library -----------------------------------------------------------

  async function resolveScene(idOrName: string): Promise<{ scene: Scene; ref: SceneRef }> {
    const wanted = idOrName.trim().toLowerCase();
    const builtIn = BUILT_IN_SCENES.find(
      (entry) => entry.id === wanted || entry.name.toLowerCase() === wanted,
    );
    if (builtIn) {
      const ref = { kind: "builtIn", id: builtIn.id } as const;
      const scene = sceneOf(builtIn);
      const tweaks = tweaksSchema.safeParse(await kv.get(`${TWEAKS_PREFIX}${builtIn.id}`));
      if (!tweaks.success) return { scene, ref };
      if (tweaks.data.scene) return { scene: tweaks.data.scene, ref };
      const known = Object.fromEntries(
        Object.entries(tweaks.data.values).filter(([id]) => scene.params.some((entry) => entry.id === id)),
      );
      return { scene: { ...applyValues(scene, known), palette: tweaks.data.palette }, ref };
    }
    const id =
      (await readEntry(idOrName.trim()))?.id ??
      (await readIndex()).find((entry) => entry.name.toLowerCase() === wanted)?.id;
    const entry = id ? await readEntry(id) : null;
    if (!entry) throw new Error(`no scene matches ${JSON.stringify(idOrName)}`);
    return { scene: rebuildBuiltIn(entry.scene), ref: { kind: "saved", id: entry.id } };
  }

  function loadScene(idOrName: string): Promise<AmbientState> {
    return update(async (state) => ({ ...state, ...(await resolveScene(idOrName)) }), {
      sceneChanged: true,
    });
  }

  function resetScene(id: string): Promise<AmbientState> {
    return serialized(async () => {
      const state = await readState();
      const builtIn = BUILT_IN_SCENES.find((entry) => entry.id === id);
      if (builtIn) {
        await kv.delete(`${TWEAKS_PREFIX}${builtIn.id}`);
        bb.realtime.publish("library", { id: builtIn.id });
        return writeState(
          { scene: sceneOf(builtIn), ref: { kind: "builtIn", id: builtIn.id }, controls: DEFAULT_CONTROLS },
          { sceneChanged: true },
        );
      }
      const entry = await readEntry(id);
      if (!entry) throw new Error(`no scene matches ${JSON.stringify(id)}`);
      const { original, ...rest } = entry;
      if (!original) throw new Error(`${entry.scene.name} has no edits to reset`);
      await kv.set(`${LIBRARY_PREFIX}${id}`, { ...rest, scene: original } satisfies LibraryEntry);
      bb.realtime.publish("library", { id });
      return writeState(
        { ...state, scene: rebuildBuiltIn(original), ref: { kind: "saved", id } },
        { sceneChanged: true },
      );
    });
  }

  function saveScene(name: string | undefined): Promise<string> {
    return serialized(async () => {
      const state = await readState();
      const index = await readIndex();
      const wanted = name ?? state.scene.name;
      const own = state.ref?.kind === "saved" ? index.find((entry) => entry.id === state.ref!.id) : undefined;
      const overwrite = own && own.name.toLowerCase() === wanted.toLowerCase() ? own : undefined;
      const finalName = overwrite ? wanted : uniqueName(wanted, index);
      const id = overwrite?.id ?? uniqueId(finalName, index);
      const saving = { ...state.scene, name: finalName };
      const previous = overwrite ? await readEntry(id) : null;
      const original =
        previous?.original ?? (previous && !sameScene(previous.scene, saving) ? previous.scene : undefined);
      const savedAt = Date.now();
      await kv.set(`${LIBRARY_PREFIX}${id}`, {
        id,
        scene: saving,
        ...(original ? { original } : {}),
        savedAt,
      } satisfies LibraryEntry);
      await kv.set(LIBRARY_INDEX_KEY, [
        { id, name: finalName, savedAt },
        ...index.filter((entry) => entry.id !== id),
      ]);
      bb.realtime.publish("library", { id });
      await writeState({ ...state, scene: saving, ref: { kind: "saved", id } }, { sceneChanged: false });
      return id;
    });
  }

  function deleteScene(id: string): Promise<boolean> {
    return serialized(async () => {
      const key = `${LIBRARY_PREFIX}${id}`;
      if ((await kv.get(key)) === undefined) return false;
      await kv.delete(key);
      await kv.set(
        LIBRARY_INDEX_KEY,
        (await readIndex()).filter((entry) => entry.id !== id),
      );
      bb.realtime.publish("library", { id });
      const state = await readState();
      if (state.ref?.kind === "saved" && state.ref.id === id) {
        await writeState({ ...state, ref: null }, { sceneChanged: false });
      }
      return true;
    });
  }

  async function library() {
    const saved = await readIndex();
    return [
      ...(await Promise.all(
        BUILT_IN_SCENES.map(async (entry) => ({
          id: entry.id,
          name: entry.name,
          builtIn: true,
          tweaked: (await kv.get(`${TWEAKS_PREFIX}${entry.id}`)) !== undefined,
        })),
      )),
      ...(await Promise.all(
        saved.map(async (entry) => ({
          id: entry.id,
          name: entry.name,
          builtIn: false,
          tweaked: (await readEntry(entry.id))?.original !== undefined,
        })),
      )),
    ];
  }

  // ---- editing and compile -----------------------------------------------

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

  /** Puts back the scene a failed agent edit replaced, unless something newer already has. */
  function revert(sceneRevision: number, previous: AmbientState): Promise<void> {
    return serialized(async () => {
      const current = await readState();
      if (current.sceneRevision !== sceneRevision) return;
      await writeState({ ...current, scene: previous.scene, ref: previous.ref }, { sceneChanged: true });
    });
  }

  /**
   * Applies an edit. Values, palette, and controls land immediately. A new shader or param list
   * waits for a bb window to compile it and is rolled back if none can.
   */
  async function editScene(edit: SceneEdit): Promise<AmbientState> {
    const structural = edit.source !== undefined || edit.params !== undefined;
    const { previous, next, compiled } = await serialized(async () => {
      const state = await readState();
      const renamed = edit.name !== undefined && edit.name !== state.scene.name;
      // A new shader is no longer the built-in it started from.
      const { baseId: _replaced, ...unbased } = state.scene;
      let scene: Scene = {
        ...(structural ? unbased : state.scene),
        ...(renamed ? { name: uniqueName(edit.name!, await readIndex()) } : {}),
        ...(edit.source === undefined ? {} : { source: edit.source }),
        ...(edit.palette === undefined ? {} : { palette: edit.palette }),
        ...(edit.params === undefined
          ? {}
          : {
              params: edit.params.map((entry) => ({
                ...entry,
                step: entry.step ?? (entry.max - entry.min) / 100,
              })),
            }),
      };
      if (edit.values) scene = applyValues(scene, edit.values);
      scene = sceneSchema.parse(scene);
      if (structural && !/\bvec3\s+scene\s*\(/.test(scene.source)) {
        throw new Error("source must define vec3 scene(vec2 uv, vec2 p)");
      }
      const next = await writeState(
        {
          scene,
          ref: renamed ? null : state.ref,
          controls: controlsSchema.parse({ ...state.controls, ...edit.controls }),
        },
        { sceneChanged: structural },
      );
      // Register before anything else can run so a fast compile report can't slip past.
      const compiled = structural ? awaitCompile(next.sceneRevision) : null;
      if (!structural) await autosave(next);
      return { previous: state, next, compiled };
    });
    if (!compiled) return next;
    const report = await compiled;
    if (!report?.ok) {
      await revert(next.sceneRevision, previous);
      throw new Error(
        report === null
          ? `No visible bb window verified ${next.scene.name} within ${COMPILE_TIMEOUT_MS / 1000}s, so it was not applied. Ask the user to bring bb to the foreground and try again.`
          : `The scene was not applied; the previous scene was restored.\n${report.log ?? ""}`,
      );
    }
    return serialized(async () => {
      await kv.set(LAST_GOOD_KEY, next.scene);
      const latest = await readState();
      if (latest.sceneRevision === next.sceneRevision) await autosave(latest);
      return latest;
    });
  }

  /**
   * A window compiled a scene. Only an agent edit that is waiting on this report can be rolled
   * back; any other failure stays local to the window that saw it.
   */
  async function reportCompile(sceneRevision: number, report: CompileReport): Promise<boolean> {
    lastWindowAt = Date.now();
    const waiter = compileWaiters.get(sceneRevision);
    if (waiter) {
      waiter(report);
      return true;
    }
    if (!report.ok) return false;
    await serialized(async () => {
      const current = await readState();
      if (current.sceneRevision === sceneRevision) await kv.set(LAST_GOOD_KEY, current.scene);
    });
    return true;
  }

  function capture(request: CaptureRequest): Promise<CaptureReport | null> {
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

  function submitCapture(requestId: string, report: CaptureReport): boolean {
    lastWindowAt = Date.now();
    const waiter = captureWaiters.get(requestId);
    waiter?.(report);
    return waiter !== undefined;
  }

  function heartbeat(): void {
    lastWindowAt = Date.now();
  }

  // ---- painting and the daily scene -------------------------------------

  async function readStoredDaily(): Promise<z.infer<typeof storedDailySchema>> {
    const stored = storedDailySchema.safeParse((await kv.get(DAILY_KEY)) ?? {});
    return stored.success
      ? stored.data
      : { automationId: null, hour: 8, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone };
  }

  function automations<T>(method: string, input: JsonValue, outputSchema: z.ZodType<T>): Promise<T> {
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

  async function createDailyAutomation(hour: number, timeZone: string): Promise<string> {
    const defaults = await agentDefaults();
    const created = await automations(
      "automations_create",
      {
        projectId: PERSONAL_PROJECT_ID,
        name: DAILY_AUTOMATION_NAME,
        enabled: true,
        origin: "app",
        trigger: { triggerType: "schedule", cron: dailyCron(hour), timezone: timeZone },
        execution: {
          mode: "agent",
          prompt: DAILY_AUTOMATION_PROMPT,
          providerId: defaults.providerId,
          model: defaults.model,
          reasoningLevel: PAINT_REASONING_LEVEL,
          permissionMode: "auto",
          environment: { type: "project-default" },
        },
      },
      automationSchema,
    );
    return created.id;
  }

  /**
   * The automation owns the schedule once it exists; only fields in the update change it, so an
   * hour or time zone edited in Automations survives turning the daily scene on or off here.
   */
  function updateDaily(update: DailyUpdate): Promise<DailyScene> {
    return serialized(async () => {
      const stored = await readStoredDaily();
      let automation = await readAutomation(stored.automationId);
      const hour = update.hour ?? cronHour(automation?.trigger.cron) ?? stored.hour;
      const timeZone = update.timeZone ?? automation?.trigger.timezone ?? stored.timeZone;
      if (!automation && update.enabled) {
        automation = await readAutomation(await createDailyAutomation(hour, timeZone));
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
      await kv.set(DAILY_KEY, { automationId: automation?.id ?? null, hour, timeZone });
      bb.realtime.publish("daily", { automationId: automation?.id ?? null });
      return readDaily();
    });
  }

  /** Starts a thread where an agent paints a scene: the one described, or today's concept. */
  async function spawnPainter(request?: string): Promise<string> {
    const thread = await bb.sdk.threads.spawn({
      projectId: PERSONAL_PROJECT_ID,
      environment: { type: "project-default" },
      permissionMode: "auto",
      reasoningLevel: PAINT_REASONING_LEVEL,
      title: request
        ? `Ambient: ${request.length > 48 ? `${request.slice(0, 47)}…` : request}`
        : "Ambient: today's scene",
      prompt: request
        ? `Paint a new Ambient scene the user described: ${JSON.stringify(request)}. Call the ambient tool with action=brief and request set to exactly that text, then follow the instructions it returns.`
        : DAILY_AUTOMATION_PROMPT,
    });
    return thread.id;
  }

  async function brief(at: Date, request?: string): Promise<string> {
    if (at.getTime() - lastWindowAt > WINDOW_FRESH_MS) {
      return "No bb window is open, so the scene can't be checked. Stop now without changing the scene and say it was skipped because bb wasn't open.";
    }
    const { timeZone } = await readDaily().catch(() => readStoredDaily());
    return dailyPrompt(localMoment(timeZone, at), timeZone, request);
  }

  void migrate().catch((caught: unknown) => {
    bb.log.warn(`Ambient could not migrate its saved state: ${caught instanceof Error ? caught.message : String(caught)}`);
  });

  return {
    readState,
    editScene,
    setControls: (controls: Partial<Controls>) =>
      update((state) => ({ ...state, controls: controlsSchema.parse({ ...state.controls, ...controls }) }), {
        sceneChanged: false,
      }),
    loadScene,
    resetScene,
    saveScene,
    deleteScene,
    library,
    reportCompile,
    capture,
    submitCapture,
    heartbeat,
    readDaily,
    updateDaily,
    spawnPainter,
    brief,
  };
}

export type AmbientOperations = ReturnType<typeof createOperations>;
