import { cliCommand, defineCli, type BbPluginApi } from "@get-bb/plugin-sdk";
import { z } from "zod";
import { createDiscordClient, DISCORD_API } from "./discord.js";
import { createEngine, emptyState, MINUTE, type DiscordState, type ThreadPort } from "./engine.js";
import { nextSummaryAt } from "./messages.js";

const PLUGIN_ID = "discord-inbox";
const STAGE_KEY = "discord";
/** Calendar's stage. The Discord section goes right after it. */
const CALENDAR_STAGE_KEY = "calendar";
const STATE_KEY = "state";
const PLACED_KEY = "placed-after-calendar";
const POLL_EVERY = MINUTE;

const organizerSchema = z.object({
  revision: z.number().optional(),
  stages: z.array(z.object({ key: z.string(), role: z.string(), sectionId: z.string().nullable(), catchesPluginId: z.string().optional() }).passthrough()),
}).passthrough();
const preferencesSchema = z.object({ preferences: z.record(z.string(), z.unknown()) }).passthrough();
const levelSchema = z.object({ own: z.string() }).passthrough();

/** Dev QA only: read a loopback fake of Discord (`fake-discord-server.ts`) instead of Discord. */
export function devDiscordApi(base: string | undefined): string | undefined {
  if (!base || !/^http:\/\/127\.0\.0\.1:\d+$/.test(base)) return undefined;
  return `${base}/api/v10`;
}

/**
 * Where a section goes in a stage or sidebar order: right after Calendar's, or first without it.
 * `entries` must not already contain `own`.
 */
export function insertAfter<T>(entries: T[], own: T, isAnchor: (entry: T) => boolean): T[] {
  const at = entries.findIndex(isAnchor) + 1;
  return [...entries.slice(0, at), own, ...entries.slice(at)];
}

const text = (value: unknown) => (typeof value === "string" && value.trim() ? value.trim() : undefined);
const output = (value: unknown) => ({ exitCode: 0, stdout: JSON.stringify(value, null, 2) });

export default function plugin(bb: BbPluginApi): void {
  const settings = bb.settings.define({
    botToken: { type: "string", label: "Discord bot token", description: "A bot in your server with the Message Content intent. Discord is only read.", secret: true },
    guildId: { type: "string", label: "Server ID", description: "The Discord server (guild) to read" },
    userId: { type: "string", label: "Your Discord user ID", description: "Tags of this user, and replies to them, get their own thread" },
    maintainerRole: { type: "string", label: "Maintainer role", description: "Tags of this role get their own thread too", default: "Maintainer" },
    timeZone: { type: "string", label: "Time zone", description: "IANA time zone for the daily summary", default: "America/Los_Angeles" },
    summaryTime: { type: "string", label: "Summary time", description: "Weekdays at this local time (HH:MM)", default: "09:00" },
    projectId: { type: "project", label: "Project", description: "Where Discord threads live; defaults to your personal project" },
    providerId: { type: "string", label: "Agent provider", description: "Each mention and summary is one reply from this agent", default: "codex" },
    model: { type: "string", label: "Agent model", default: "gpt-6.1-sol" },
    mentionReasoning: { type: "select", label: "Mention reasoning level", options: ["low", "medium", "high"], default: "low" },
    summaryReasoning: { type: "select", label: "Summary reasoning level", options: ["low", "medium", "high"], default: "high" },
  });

  const discord = createDiscordClient({
    // Read at call time so tests can swap it.
    fetch: ((input: Parameters<typeof fetch>[0], init?: RequestInit) => globalThis.fetch(input, init)) as typeof fetch,
    apiBase: devDiscordApi(process.env.BB_DISCORD_FAKE_API) ?? DISCORD_API,
    now: () => Date.now(),
    token: async () => text((await settings.get()).botToken),
  });

  async function organizer() {
    return bb.sdk.plugins.callRpc({ pluginId: "thread-organizer", method: "getConfig", input: {}, outputSchema: organizerSchema });
  }

  /** The 💬 Discord inbox in Thread Organizer, right after Calendar's stage so the two sit together. */
  async function ensureSection(): Promise<string> {
    const config = await organizer();
    const stage = config.stages.find((entry) => entry.key === STAGE_KEY);
    if (stage?.role === "inbox" && stage.catchesPluginId === PLUGIN_ID && stage.sectionId) return stage.sectionId;
    const { revision, stages, ...base } = config;
    const strip = ({ sectionId: _sectionId, ...entry }: (typeof stages)[number]) => entry;
    const own = stage
      ? { ...strip(stage), role: "inbox", catchesPluginId: PLUGIN_ID }
      : { key: STAGE_KEY, role: "inbox", title: "💬 Discord", catchesPluginId: PLUGIN_ID, rule: "Discord mentions and the daily summary. Each one stays until you archive it." };
    const others = stages.filter((entry) => entry.key !== STAGE_KEY).map(strip);
    const saved = await bb.sdk.plugins.callRpc({
      pluginId: "thread-organizer",
      method: "saveConfig",
      input: JSON.parse(JSON.stringify({ ...base, baseRevision: revision ?? 0, stages: insertAfter(others, own, (entry) => entry.key === CALENDAR_STAGE_KEY) })),
      outputSchema: organizerSchema,
    });
    const sectionId = saved.stages.find((entry) => entry.key === STAGE_KEY && entry.catchesPluginId === PLUGIN_ID)?.sectionId;
    if (!sectionId) throw new Error("Update Thread Organizer to a version with additional inboxes.");
    return sectionId;
  }

  /** Once: put the section right below 📅 Calendar (above Pinned), or first without Calendar. Later drags are hers to keep. */
  async function placeSection(sectionId: string) {
    if (await bb.storage.kv.get<boolean>(PLACED_KEY)) return;
    const { preferences } = await bb.sdk.plugins.callRpc({ pluginId: "thread-list", method: "listPreferences", input: null, outputSchema: preferencesSchema });
    const order = preferences.manualSectionOrder;
    if (!Array.isArray(order) || !order.every((entry): entry is string => typeof entry === "string")) return;
    const calendarSection = (await organizer()).stages.find((entry) => entry.key === CALENDAR_STAGE_KEY)?.sectionId;
    const anchor = calendarSection ? `section:${calendarSection}` : null;
    const entry = `section:${sectionId}`;
    const next = insertAfter(order.filter((value) => value !== entry), entry, (value) => value === anchor);
    // Organizer or Calendar may still be placing their sections, so the flag waits for a pass that finds this one in place.
    if (next.join("\n") === order.join("\n")) return bb.storage.kv.set(PLACED_KEY, true);
    await bb.sdk.plugins.callRpc({ pluginId: "thread-list", method: "setPreference", input: { key: "manualSectionOrder", value: next }, outputSchema: z.unknown() });
  }

  const setLevel = (threadId: string, level: "all" | "muted") =>
    bb.sdk.plugins.callRpc({ pluginId: "push-notifications", method: "threadNotifications.set", input: { threadId, level }, outputSchema: levelSchema });

  type Kind = Parameters<ThreadPort["spawn"]>[0]["kind"];
  async function execution(kind: Kind) {
    const values = await settings.get();
    let projectId = text(values.projectId);
    if (!projectId) {
      const projects = await bb.sdk.projects.list({ includePersonal: true });
      projectId = projects.find((project) => project.kind === "personal")?.id;
      if (!projectId) throw new Error("Choose a project in Discord settings.");
    }
    const reasoningLevel = (kind === "summary" ? values.summaryReasoning : kind === "mention" ? values.mentionReasoning : "low") as "low" | "medium" | "high";
    // The most restricted mode bb offers: the turn needs no tools, and Discord text is never instructions.
    return { projectId, providerId: values.providerId, model: values.model, reasoningLevel, permissionMode: "accept-edits" as const };
  }

  const input = (prompt: string) => [{ type: "text" as const, text: prompt, mentions: [], visibility: "agent-only" as const }];

  const threads: ThreadPort = {
    async spawn({ title, prompt, key, notify, kind }) {
      const sectionId = await ensureSection();
      const thread = await bb.sdk.threads.spawn({
        ...(await execution(kind)),
        environment: { type: "project-default" },
        title,
        input: input(prompt),
        sectionId,
        pluginMetadata: { inbox: true, kind, ...(key ? { key } : {}) },
      });
      await setLevel(thread.id, notify ? "all" : "muted");
      return thread.id;
    },
    async find(key) {
      const listed = await bb.sdk.threads.list({ originPluginId: PLUGIN_ID, archived: false });
      for (const thread of listed) {
        const metadata = await bb.sdk.threads.getPluginMetadata({ threadId: thread.id });
        if (metadata.key === key) return thread.id;
      }
      return null;
    },
    async live(threadId) {
      try {
        const thread = await bb.sdk.threads.get({ threadId });
        return thread.archivedAt === null && thread.deletedAt === null;
      } catch {
        return false;
      }
    },
    async send(threadId, prompt) {
      await setLevel(threadId, "all");
      const { model, reasoningLevel, permissionMode } = await execution("mention");
      await bb.sdk.threads.send({ threadId, input: input(prompt), mode: "queue-if-active", model, reasoningLevel, permissionMode });
    },
    async archive(threadId) {
      await bb.sdk.threads.archive({ threadId });
    },
    async replied(threadId) {
      const prompts = await bb.sdk.threads.promptHistory({ threadId });
      // The plugin's own turns are agent-only; anything else she wrote.
      return prompts.some((prompt) => prompt.input.some((part) => part.visibility !== "agent-only"));
    },
  };

  const load = async (): Promise<DiscordState> => ({ ...emptyState(), ...(await bb.storage.kv.get<DiscordState>(STATE_KEY)) });
  const engine = createEngine({ discord, threads, load, save: (state) => bb.storage.kv.set(STATE_KEY, state), now: () => Date.now(), log: bb.log });

  async function config() {
    const values = await settings.get();
    const guildId = text(values.guildId);
    const userId = text(values.userId);
    if (!guildId || !userId || !text(values.botToken)) return null;
    return {
      guildId,
      userId,
      maintainerRole: text(values.maintainerRole) ?? "Maintainer",
      timeZone: text(values.timeZone) ?? "America/Los_Angeles",
      summaryTime: text(values.summaryTime) ?? "09:00",
    };
  }

  let placed = false;
  async function pass(summary: "auto" | "force" | "skip" = "auto") {
    const current = await config();
    if (!current) {
      const state = await load();
      state.lastError = "Set the bot token, server ID and your user ID in Discord settings.";
      await bb.storage.kv.set(STATE_KEY, state);
      return state;
    }
    if (!placed) {
      const sectionId = await ensureSection();
      await placeSection(sectionId)
        .then(async () => { placed = Boolean(await bb.storage.kv.get<boolean>(PLACED_KEY)); })
        .catch((error: unknown) => bb.log.warn(`Discord couldn't place its section: ${String(error)}`));
    }
    return engine.tick(current, { poll: true, summary });
  }
  let running: Promise<unknown> = Promise.resolve();
  const serial = <T>(work: () => Promise<T>): Promise<T> => {
    const next = running.catch(() => undefined).then(work);
    running = next;
    return next;
  };

  let wake: (() => void) | null = null;
  bb.background.service("poll", {
    async start(signal) {
      while (!signal.aborted) {
        try { await serial(() => pass()); } catch (error) { bb.log.warn(`Discord poll failed: ${error instanceof Error ? error.message : String(error)}`); }
        await new Promise<void>((resolve) => {
          const done = () => { clearTimeout(timer); signal.removeEventListener("abort", done); wake = null; resolve(); };
          const timer = setTimeout(done, POLL_EVERY);
          wake = done;
          signal.addEventListener("abort", done, { once: true });
        });
      }
    },
  });
  settings.onChange(() => wake?.());

  const summary = async (state: DiscordState) => {
    const values = await settings.get();
    const timeZone = text(values.timeZone) ?? "America/Los_Angeles";
    return {
      lastReadAt: state.lastPollAt && new Date(state.lastPollAt).toISOString(),
      lastError: state.lastError,
      failingSince: state.failingSince && new Date(state.failingSince).toISOString(),
      nextSummaryAt: new Date(nextSummaryAt(Date.now(), state.lastSummaryDate, timeZone, text(values.summaryTime) ?? "09:00")).toISOString(),
      lastSummaryAt: state.lastSummaryAt && new Date(state.lastSummaryAt).toISOString(),
      summaryThreadId: state.summaryThreadId,
      channelsRead: Object.keys(state.positions).length,
      mentions: Object.entries(state.mentions).map(([messageId, record]) => ({ messageId, phase: record.phase, threadId: record.threadId })),
    };
  };

  bb.cli.register(defineCli({
    name: "discord-inbox",
    summary: "Show or refresh the Discord section",
    commands: {
      status: cliCommand({
        summary: "Show the last read, its error and the next summary time",
        options: { json: { type: "boolean", description: "Print JSON" } },
        run: async () => output(await summary(await load())),
      }),
      poll: cliCommand({
        summary: "Read Discord now and deliver new mentions",
        options: { json: { type: "boolean", description: "Print JSON" } },
        run: async () => output(await summary(await serial(() => pass("skip")))),
      }),
      summary: cliCommand({
        summary: "Post the daily summary; --now posts one covering everything since the last",
        options: { now: { type: "boolean", description: "Post it now, whatever the time" }, json: { type: "boolean", description: "Print JSON" } },
        run: async ({ options }) => output(await summary(await serial(() => pass(options.now ? "force" : "auto")))),
      }),
    },
  }));
}
