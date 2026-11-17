import { cliCommand, defineCli, type BbPluginApi } from "@get-bb/plugin-sdk";
import { z } from "zod";
import { createEngine, emptyState, MINUTE, type CalendarState, type ThreadPort } from "./engine.js";
import { createGoogleClient, GOOGLE_ENDPOINTS, type GoogleEndpoints } from "./google.js";

const PLUGIN_ID = "calendar";
const STAGE_KEY = "calendar";
const STATE_KEY = "state";
const PLACED_KEY = "placed-above-pinned";
const TICK = 15_000;
const FETCH_EVERY = MINUTE;

const organizerSchema = z.object({
  revision: z.number().optional(),
  stages: z.array(z.object({ key: z.string(), role: z.string(), sectionId: z.string().nullable(), catchesPluginId: z.string().optional() }).passthrough()),
}).passthrough();
const preferencesSchema = z.object({ preferences: z.record(z.string(), z.unknown()) }).passthrough();
const levelSchema = z.object({ own: z.string() }).passthrough();

/** Dev QA only: read a loopback fake of Google (`fake-google-server.ts`) instead of Google. */
export function devGoogleEndpoints(base: string | undefined): GoogleEndpoints | undefined {
  if (!base || !/^http:\/\/127\.0\.0\.1:\d+$/.test(base)) return undefined;
  return { apiBase: `${base}/calendar/v3`, tokenUrl: `${base}/token` };
}

const text = (value: unknown) => (typeof value === "string" && value.trim() ? value.trim() : undefined);
const output = (value: unknown) => ({ exitCode: 0, stdout: JSON.stringify(value, null, 2) });

export default function plugin(bb: BbPluginApi): void {
  const settings = bb.settings.define({
    calendars: { type: "string", label: "Calendars", description: "Google calendar IDs to list, separated by commas. The first one keeps an event that appears on several.", default: "primary" },
    timeZone: { type: "string", label: "Time zone", description: "IANA time zone for titles, days and times", default: "America/Los_Angeles" },
    clientId: { type: "string", label: "Google OAuth client ID", secret: true },
    clientSecret: { type: "string", label: "Google OAuth client secret", secret: true },
    refreshToken: { type: "string", label: "Google refresh token", description: "Read-only (calendar.events.readonly) refresh token for that client", secret: true },
    projectId: { type: "project", label: "Project", description: "Where Calendar threads live; defaults to your personal project" },
    providerId: { type: "string", label: "Agent provider", description: "Each notification is one short reply from this agent", default: "codex" },
    model: { type: "string", label: "Agent model", default: "gpt-6.1-sol" },
    reasoningLevel: { type: "select", label: "Reasoning level", options: ["low", "medium", "high"], default: "low" },
  });

  const google = createGoogleClient({
    // Read at call time so tests can swap it.
    fetch: ((input: Parameters<typeof fetch>[0], init?: RequestInit) => globalThis.fetch(input, init)) as typeof fetch,
    endpoints: devGoogleEndpoints(process.env.BB_CALENDAR_FAKE_GOOGLE) ?? GOOGLE_ENDPOINTS,
    now: () => Date.now(),
    async credentials() {
      const values = await settings.get();
      return { clientId: text(values.clientId), clientSecret: text(values.clientSecret), refreshToken: text(values.refreshToken) };
    },
  });

  async function organizer() {
    return bb.sdk.plugins.callRpc({ pluginId: "thread-organizer", method: "getConfig", input: {}, outputSchema: organizerSchema });
  }

  /** The 📅 Calendar inbox in Thread Organizer, first in its workflow so it can sit above Pinned. */
  async function ensureSection(): Promise<string> {
    const config = await organizer();
    const stage = config.stages.find((entry) => entry.key === STAGE_KEY);
    if (stage?.role === "inbox" && stage.catchesPluginId === PLUGIN_ID && stage.sectionId) return stage.sectionId;
    const { revision, stages, ...base } = config;
    const strip = ({ sectionId: _sectionId, ...entry }: (typeof stages)[number]) => entry;
    const own = stage
      ? { ...strip(stage), role: "inbox", catchesPluginId: PLUGIN_ID }
      : { key: STAGE_KEY, role: "inbox", title: "📅 Calendar", catchesPluginId: PLUGIN_ID, rule: "Upcoming events from your Google calendars. Each one leaves 30 minutes after it ends." };
    const saved = await bb.sdk.plugins.callRpc({
      pluginId: "thread-organizer",
      method: "saveConfig",
      input: JSON.parse(JSON.stringify({ ...base, baseRevision: revision ?? 0, stages: [own, ...stages.filter((entry) => entry.key !== STAGE_KEY).map(strip)] })),
      outputSchema: organizerSchema,
    });
    const sectionId = saved.stages.find((entry) => entry.key === STAGE_KEY && entry.catchesPluginId === PLUGIN_ID)?.sectionId;
    if (!sectionId) throw new Error("Update Thread Organizer to a version with additional inboxes.");
    return sectionId;
  }

  /** Once: put the section above Pinned. Later drags are hers to keep. */
  async function placeAbovePinned(sectionId: string) {
    if (await bb.storage.kv.get<boolean>(PLACED_KEY)) return;
    const { preferences } = await bb.sdk.plugins.callRpc({ pluginId: "thread-list", method: "listPreferences", input: null, outputSchema: preferencesSchema });
    const order = preferences.manualSectionOrder;
    if (!Array.isArray(order) || !order.every((entry): entry is string => typeof entry === "string")) return;
    const entry = `section:${sectionId}`;
    // Organizer may still be adding the new section to this order, so the flag waits for a pass that finds it first.
    if (order[0] === entry) return bb.storage.kv.set(PLACED_KEY, true);
    await bb.sdk.plugins.callRpc({
      pluginId: "thread-list",
      method: "setPreference",
      input: { key: "manualSectionOrder", value: [entry, ...order.filter((value) => value !== entry)] },
      outputSchema: z.unknown(),
    });
  }

  const setLevel = (threadId: string, level: "all" | "muted") =>
    bb.sdk.plugins.callRpc({ pluginId: "push-notifications", method: "threadNotifications.set", input: { threadId, level }, outputSchema: levelSchema });

  async function execution() {
    const values = await settings.get();
    let projectId = text(values.projectId);
    if (!projectId) {
      const projects = await bb.sdk.projects.list({ includePersonal: true });
      projectId = projects.find((project) => project.kind === "personal")?.id;
      if (!projectId) throw new Error("Choose a project in Calendar settings.");
    }
    return { projectId, providerId: values.providerId, model: values.model, reasoningLevel: values.reasoningLevel as "low" | "medium" | "high" };
  }

  const input = (prompt: string) => [{ type: "text" as const, text: prompt, mentions: [], visibility: "agent-only" as const }];

  const threads: ThreadPort = {
    async spawn({ title, prompt, eventId, notify }) {
      const sectionId = await ensureSection();
      const thread = await bb.sdk.threads.spawn({
        ...(await execution()),
        environment: { type: "project-default" },
        title,
        input: input(prompt),
        sectionId,
        pluginMetadata: { inbox: true, ...(eventId ? { eventId } : {}) },
      });
      await setLevel(thread.id, notify ? "all" : "muted");
      return thread.id;
    },
    async find(eventId) {
      const listed = await bb.sdk.threads.list({ originPluginId: PLUGIN_ID, archived: false });
      for (const thread of listed) {
        const metadata = await bb.sdk.threads.getPluginMetadata({ threadId: thread.id });
        if (metadata.eventId === eventId) return thread.id;
      }
      return null;
    },
    async state(threadId) {
      let thread;
      try { thread = await bb.sdk.threads.get({ threadId }); } catch { return { state: "gone" }; }
      if (thread.archivedAt !== null || thread.deletedAt !== null) return { state: "gone" };
      if (thread.status !== "idle" && thread.status !== "error") return { state: "busy" };
      return { state: "idle", settledAt: thread.latestAttentionAt };
    },
    async send(threadId, prompt) {
      await setLevel(threadId, "all");
      const { model, reasoningLevel } = await execution();
      await bb.sdk.threads.send({ threadId, input: input(prompt), mode: "queue-if-active", model, reasoningLevel });
    },
    async retitle(threadId, title) {
      await bb.sdk.threads.update({ threadId, title });
    },
    async archive(threadId) {
      await bb.sdk.threads.archive({ threadId });
    },
  };

  const load = async (): Promise<CalendarState> => ({ ...emptyState(), ...(await bb.storage.kv.get<CalendarState>(STATE_KEY)) });
  const engine = createEngine({
    google,
    threads,
    load,
    save: (state) => bb.storage.kv.set(STATE_KEY, state),
    now: () => Date.now(),
    log: bb.log,
  });

  async function config() {
    const values = await settings.get();
    return {
      calendars: values.calendars.split(",").map((value) => value.trim()).filter(Boolean),
      timeZone: text(values.timeZone) ?? "America/Los_Angeles",
    };
  }

  let lastFetch = 0;
  let wake: (() => void) | null = null;
  async function pass(force = false) {
    const fetch = force || Date.now() - lastFetch >= FETCH_EVERY;
    if (fetch) {
      lastFetch = Date.now();
      const sectionId = await ensureSection();
      await placeAbovePinned(sectionId).catch((error: unknown) => bb.log.warn(`Calendar couldn't place its section: ${String(error)}`));
    }
    return engine.tick(await config(), { fetch });
  }
  let running: Promise<unknown> = Promise.resolve();
  const serial = <T>(work: () => Promise<T>): Promise<T> => {
    const next = running.catch(() => undefined).then(work);
    running = next;
    return next;
  };

  bb.background.service("sync", {
    async start(signal) {
      while (!signal.aborted) {
        try { await serial(() => pass()); } catch (error) { bb.log.warn(`Calendar sync failed: ${error instanceof Error ? error.message : String(error)}`); }
        await new Promise<void>((resolve) => {
          const done = () => { clearTimeout(timer); signal.removeEventListener("abort", done); wake = null; resolve(); };
          const timer = setTimeout(done, TICK);
          wake = done;
          signal.addEventListener("abort", done, { once: true });
        });
      }
    },
  });
  settings.onChange(() => { lastFetch = 0; wake?.(); });

  const summary = (state: CalendarState) => ({
    lastSyncAt: state.lastSyncAt && new Date(state.lastSyncAt).toISOString(),
    lastError: state.lastError,
    events: Object.values(state.events)
      .filter((record) => record.phase !== "done")
      .sort((a, b) => a.event.startMs - b.event.startMs)
      .map((record) => ({ title: record.title, phase: record.phase, threadId: record.threadId, calendarId: record.event.calendarId, reminded: record.reminded })),
  });

  bb.cli.register(defineCli({
    name: "calendar",
    summary: "Show or refresh the Calendar section's events",
    commands: {
      status: cliCommand({
        summary: "Show the last sync, its error and the listed events",
        options: { json: { type: "boolean", description: "Print JSON" } },
        run: async () => output(summary(await load())),
      }),
      sync: cliCommand({
        summary: "Read Google Calendar now",
        options: { json: { type: "boolean", description: "Print JSON" } },
        run: async () => output(summary(await serial(() => pass(true)))),
      }),
    },
  }));
}
