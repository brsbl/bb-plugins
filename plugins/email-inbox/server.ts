import { cliCommand, defineCli, type BbPluginApi } from "@get-bb/plugin-sdk";
import { z } from "zod";
import { createEngine, emptyState, nextSummaryAt, type EmailState, type ThreadPort } from "./engine.js";
import { createGmailClient, GMAIL_ENDPOINTS, type GmailEndpoints } from "./gmail.js";

const PLUGIN_ID = "email-inbox";
const STAGE_KEY = "email-inbox";
/** Sections this one sits right after, nearest first: Discord, then Calendar. */
const ANCHOR_PLUGINS = ["discord-inbox", "calendar"];
const STATE_KEY = "state";
const PLACED_KEY = "placed";
const TICK = 60_000;

const stageSchema = z.object({ key: z.string(), role: z.string(), sectionId: z.string().nullable(), catchesPluginId: z.string().optional() }).passthrough();
const organizerSchema = z.object({ revision: z.number().optional(), stages: z.array(stageSchema) }).passthrough();
type Stage = z.infer<typeof stageSchema>;
const preferencesSchema = z.object({ preferences: z.record(z.string(), z.unknown()) }).passthrough();
const levelSchema = z.object({ own: z.string() }).passthrough();
const promptsSchema = z.array(z.unknown());
const tokensSchema = z.record(z.string(), z.string());

/** Dev QA only: read a loopback fake of Gmail (`fake-gmail-server.ts`) instead of Google. */
export function devGmailEndpoints(base: string | undefined): GmailEndpoints | undefined {
  if (!base || !/^http:\/\/127\.0\.0\.1:\d+$/.test(base)) return undefined;
  return { apiBase: `${base}/gmail/v1`, tokenUrl: `${base}/token` };
}

/** `HH:MM` → minutes after midnight. */
export function parseTime(value: string): number | null {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match || Number(match[1]) > 23 || Number(match[2]) > 59) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

/** The refresh-token setting: a JSON object from account address to token. */
export function parseTokens(value: string | undefined): Record<string, string> {
  if (!value?.trim()) return {};
  const parsed = tokensSchema.safeParse(JSON.parse(value));
  if (!parsed.success) throw new Error("Refresh tokens must be a JSON object of address → token.");
  return Object.fromEntries(Object.entries(parsed.data).map(([address, token]) => [address.trim().toLowerCase(), token.trim()]));
}

/**
 * Where this plugin's stage goes in Thread Organizer's workflow: right after the nearest anchor that exists
 * (Discord, then Calendar), else first.
 */
export function insertStage(stages: Stage[], own: Stage): Stage[] {
  const rest = stages.filter((entry) => entry.key !== own.key);
  for (const anchor of ANCHOR_PLUGINS) {
    const index = rest.findIndex((entry) => entry.catchesPluginId === anchor);
    if (index >= 0) return [...rest.slice(0, index + 1), own, ...rest.slice(index + 1)];
  }
  return [own, ...rest];
}

/** The sidebar order with `entry` right after the nearest anchor section in it, else first. */
export function placeSection(order: string[], entry: string, anchors: string[]): string[] {
  const rest = order.filter((value) => value !== entry);
  const anchor = anchors.find((value) => rest.includes(value));
  if (!anchor) return [entry, ...rest];
  const index = rest.indexOf(anchor);
  return [...rest.slice(0, index + 1), entry, ...rest.slice(index + 1)];
}

const text = (value: unknown) => (typeof value === "string" && value.trim() ? value.trim() : undefined);
const output = (value: unknown) => ({ exitCode: 0, stdout: JSON.stringify(value, null, 2) });

export default function plugin(bb: BbPluginApi): void {
  const settings = bb.settings.define({
    accounts: { type: "string", label: "Accounts", description: "Gmail addresses to summarize, separated by commas. The first one keeps a message sent to several.", default: "" },
    summaryTime: { type: "string", label: "Summary time", description: "Weekdays at this local time (HH:MM, 24-hour)", default: "13:00" },
    timeZone: { type: "string", label: "Time zone", description: "IANA time zone for the schedule and titles", default: "America/Los_Angeles" },
    clientId: { type: "string", label: "Google OAuth client ID", secret: true },
    clientSecret: { type: "string", label: "Google OAuth client secret", secret: true },
    refreshTokens: { type: "string", label: "Google refresh tokens", description: "JSON object of address → read-only (gmail.readonly) refresh token for that client", secret: true },
    projectId: { type: "project", label: "Project", description: "Where Email threads live; defaults to your personal project" },
    providerId: { type: "string", label: "Agent provider", description: "Each summary is one reply from this agent", default: "codex" },
    model: { type: "string", label: "Agent model", default: "gpt-6.1-sol" },
    reasoningLevel: { type: "select", label: "Reasoning level", options: ["low", "medium", "high"], default: "high" },
  });

  const gmail = createGmailClient({
    // Read at call time so tests can swap it.
    fetch: ((input: Parameters<typeof fetch>[0], init?: RequestInit) => globalThis.fetch(input, init)) as typeof fetch,
    endpoints: devGmailEndpoints(process.env.BB_EMAIL_FAKE_GMAIL) ?? GMAIL_ENDPOINTS,
    now: () => Date.now(),
    async credentials(account) {
      const values = await settings.get();
      return { clientId: text(values.clientId), clientSecret: text(values.clientSecret), refreshToken: parseTokens(values.refreshTokens)[account] };
    },
  });

  async function organizer() {
    return bb.sdk.plugins.callRpc({ pluginId: "thread-organizer", method: "getConfig", input: {}, outputSchema: organizerSchema });
  }

  /** The 📧 Email inbox in Thread Organizer, right after Discord's or Calendar's. */
  async function ensureSection(): Promise<{ sectionId: string; stages: Stage[] }> {
    const config = await organizer();
    const stage = config.stages.find((entry) => entry.key === STAGE_KEY);
    if (stage?.role === "inbox" && stage.catchesPluginId === PLUGIN_ID && stage.sectionId) return { sectionId: stage.sectionId, stages: config.stages };
    const { revision, stages, ...base } = config;
    const strip = ({ sectionId: _sectionId, ...entry }: Stage) => entry as Stage;
    const own = stage
      ? { ...strip(stage), role: "inbox", catchesPluginId: PLUGIN_ID }
      : { key: STAGE_KEY, role: "inbox", sectionId: null, title: "📧 Email", catchesPluginId: PLUGIN_ID, rule: "A weekday summary of new mail. The previous one is archived when the next arrives, unless you replied in it." };
    const saved = await bb.sdk.plugins.callRpc({
      pluginId: "thread-organizer",
      method: "saveConfig",
      input: JSON.parse(JSON.stringify({ ...base, baseRevision: revision ?? 0, stages: insertStage(stages, own).map(strip) })),
      outputSchema: organizerSchema,
    });
    const sectionId = saved.stages.find((entry) => entry.key === STAGE_KEY && entry.catchesPluginId === PLUGIN_ID)?.sectionId;
    if (!sectionId) throw new Error("Update Thread Organizer to a version with additional inboxes.");
    return { sectionId, stages: saved.stages };
  }

  /** Once: put the section right below Discord's or Calendar's, else first. Later drags are hers to keep. */
  async function placeOnce(sectionId: string, stages: Stage[]) {
    if (await bb.storage.kv.get<boolean>(PLACED_KEY)) return;
    const { preferences } = await bb.sdk.plugins.callRpc({ pluginId: "thread-list", method: "listPreferences", input: null, outputSchema: preferencesSchema });
    const order = preferences.manualSectionOrder;
    if (!Array.isArray(order) || !order.every((entry): entry is string => typeof entry === "string")) return;
    const entry = `section:${sectionId}`;
    const anchors = ANCHOR_PLUGINS.flatMap((pluginId) => {
      const anchor = stages.find((stage) => stage.catchesPluginId === pluginId)?.sectionId;
      return anchor ? [`section:${anchor}`] : [];
    });
    const placed = placeSection(order, entry, anchors);
    // Organizer may still be adding the new section to this order, so the flag waits for a pass that finds it placed.
    if (order.includes(entry) && JSON.stringify(placed) === JSON.stringify(order)) return bb.storage.kv.set(PLACED_KEY, true);
    await bb.sdk.plugins.callRpc({ pluginId: "thread-list", method: "setPreference", input: { key: "manualSectionOrder", value: placed }, outputSchema: z.unknown() });
  }

  const setLevel = (threadId: string, level: "all" | "muted") =>
    bb.sdk.plugins.callRpc({ pluginId: "push-notifications", method: "threadNotifications.set", input: { threadId, level }, outputSchema: levelSchema });

  async function execution(kind: "summary" | "notice") {
    const values = await settings.get();
    let projectId = text(values.projectId);
    if (!projectId) {
      const projects = await bb.sdk.projects.list({ includePersonal: true });
      projectId = projects.find((project) => project.kind === "personal")?.id;
      if (!projectId) throw new Error("Choose a project in Email settings.");
    }
    const reasoningLevel = kind === "summary" ? (values.reasoningLevel as "low" | "medium" | "high") : "low";
    return { projectId, providerId: values.providerId, model: values.model, reasoningLevel };
  }

  const threads: ThreadPort = {
    async spawn({ title, prompt, kind, notify }) {
      const { sectionId } = await ensureSection();
      const thread = await bb.sdk.threads.spawn({
        ...(await execution(kind)),
        // The most restricted mode bb offers; the turn needs no tools.
        permissionMode: "accept-edits",
        environment: { type: "project-default" },
        title,
        input: [{ type: "text", text: prompt, mentions: [], visibility: "agent-only" }],
        sectionId,
        pluginMetadata: { inbox: true, kind },
      } as Parameters<typeof bb.sdk.threads.spawn>[0]);
      await setLevel(thread.id, notify ? "all" : "muted");
      return thread.id;
    },
    async replied(threadId) {
      let thread;
      try { thread = await bb.sdk.threads.get({ threadId }); } catch { return "gone"; }
      if (thread.archivedAt !== null || thread.deletedAt !== null) return "gone";
      // Prompt history holds only what people typed; the plugin's agent-only prompt isn't in it.
      const prompts = promptsSchema.parse(await bb.sdk.threads.promptHistory({ threadId, limit: "1" }));
      return prompts.length > 0;
    },
    async archive(threadId) {
      await bb.sdk.threads.archive({ threadId });
    },
  };

  const load = async (): Promise<EmailState> => ({ ...emptyState(), ...(await bb.storage.kv.get<EmailState>(STATE_KEY)) });
  const engine = createEngine({ gmail, threads, load, save: (state) => bb.storage.kv.set(STATE_KEY, state), now: () => Date.now(), log: bb.log });

  async function config() {
    const values = await settings.get();
    return {
      accounts: [...new Set(values.accounts.split(",").map((value) => value.trim().toLowerCase()).filter(Boolean))],
      timeZone: text(values.timeZone) ?? "America/Los_Angeles",
      summaryAt: parseTime(values.summaryTime) ?? 13 * 60,
    };
  }

  async function pass() {
    const { sectionId, stages } = await ensureSection();
    await placeOnce(sectionId, stages).catch((error: unknown) => bb.log.warn(`Email couldn't place its section: ${String(error)}`));
    return engine.tick(await config());
  }
  let running: Promise<unknown> = Promise.resolve();
  const serial = <T>(work: () => Promise<T>): Promise<T> => {
    const next = running.catch(() => undefined).then(work);
    running = next;
    return next;
  };

  let wake: (() => void) | null = null;
  bb.background.service("summary", {
    async start(signal) {
      while (!signal.aborted) {
        try { await serial(pass); } catch (error) { bb.log.warn(`Email pass failed: ${error instanceof Error ? error.message : String(error)}`); }
        await new Promise<void>((resolve) => {
          const done = () => { clearTimeout(timer); signal.removeEventListener("abort", done); wake = null; resolve(); };
          const timer = setTimeout(done, TICK);
          wake = done;
          signal.addEventListener("abort", done, { once: true });
        });
      }
    },
  });
  settings.onChange(() => wake?.());

  async function status() {
    const state = await load();
    const current = await config();
    const values = await settings.get();
    let tokens: Record<string, string> = {};
    let tokenError: string | undefined;
    try { tokens = parseTokens(values.refreshTokens); } catch (error) { tokenError = error instanceof Error ? error.message : String(error); }
    const iso = (ms: number | null) => (ms === null ? null : new Date(ms).toISOString());
    return {
      lastSummaryAt: iso(state.lastSummaryAt),
      lastRunAt: iso(state.lastRunAt),
      nextSummaryAt: current.accounts.length ? iso(nextSummaryAt(state, Date.now(), current)) : null,
      summaryThreadId: state.summaryThreadId,
      ...(tokenError ? { tokenError } : {}),
      accounts: current.accounts.map((account) => ({
        account,
        token: Boolean(tokens[account]),
        lastError: state.errors[account] ?? null,
        reconnectThreadId: state.reconnect[account] ?? null,
      })),
    };
  }

  bb.cli.register(defineCli({
    name: "email-inbox",
    summary: "Show the Email summary's status or post one now",
    commands: {
      status: cliCommand({
        summary: "Show the last summary, each account's last error and the next summary time",
        options: { json: { type: "boolean", description: "Print JSON" } },
        run: async () => output(await status()),
      }),
      summary: cliCommand({
        summary: "Post a summary of mail since the last one",
        options: {
          now: { type: "boolean", description: "Post it now, outside the schedule" },
          json: { type: "boolean", description: "Print JSON" },
        },
        run: async ({ options }) => {
          if (!options.now) return { exitCode: 1, stdout: "", stderr: "Pass --now to post a summary outside the schedule.\n" };
          const result = await serial(async () => {
            await ensureSection();
            return engine.summaryNow(await config());
          });
          return output(result);
        },
      }),
    },
  }));
}
