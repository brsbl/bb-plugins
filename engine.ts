import {
  compareIds, isChatChannel, isForum, isThread, RateLimited, snowflakeAt, timeOf,
  type DiscordChannel, type DiscordClient, type DiscordMessage,
} from "./discord.js";
import {
  authorName, directTag, jumpLink, localDay, mentionNote, mentionTitle, messageText, oneLine, replyPrompt, summaryData, summaryDue, summaryPrompt,
  type Names, type SummaryChannel, type SummaryMessage, type SummaryPost, type TagKind,
} from "./messages.js";

export const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
/** Tags older than this when first seen (after downtime) go to the summary instead of their own thread. */
export const MENTION_MAX_AGE = DAY;
const FAILURE_ALERT_AFTER = HOUR;
const POLL_PAGES = 5;
const SUMMARY_PAGES = 20;
export const SUMMARY_BUDGET = 150_000;
const CONTEXT = 5;
const MEMBER_TTL = DAY;
const ROLES_TTL = DAY;
const MEMBER_LOOKUPS = 100;
const KEEP_MENTIONS = 7 * DAY;
const KEEP_UNSEEN = 30 * DAY;
/** Discord threads and forum posts that left the active list. Hundreds turn over a month, and state is one KV value capped at 256 KB. */
const KEEP_UNSEEN_THREADS = 7 * DAY;
const MAX_NAME = 100;
/** Flood guard: tags beyond these limits are left to the summary. */
const MENTIONS_PER_AUTHOR_HOUR = 3;
const DELIVERIES_PER_PASS = 10;
/** A failed scheduled summary waits this long before rebuilding, so it doesn't re-read the server every minute. */
const SUMMARY_RETRY = 15 * MINUTE;

export interface ChannelInfo {
  name: string;
  type: number;
  parentId: string | null;
}

export interface MentionRecord {
  channelId: string;
  authorId: string;
  kind: TagKind;
  /** When the message was sent. */
  at: number;
  /** pending: not delivered; spawning: its thread may exist (adopted by its message ID); done: delivered. */
  phase: "pending" | "spawning" | "done";
  threadId: string | null;
}

export interface DiscordState {
  /** The first successful poll. Messages before it are neither tagged nor summarized. */
  baselineAt: number | null;
  /** When the last successful poll started. A channel first seen later is read from here. */
  lastPollAt: number | null;
  lastError: string | null;
  failingSince: number | null;
  /** The "can't read Discord" thread, while it stands. */
  problemThreadId: string | null;
  /** Channel or Discord thread ID → the last message ID read. */
  positions: Record<string, string>;
  /** Channel or Discord thread ID → when a poll last listed it. */
  seenAt: Record<string, number>;
  channels: Record<string, ChannelInfo>;
  /** Discord threads and forum posts with messages since the last summary; inactive ones drop out of the active list. */
  activePosts: string[];
  /** Message ID → its tag, saved before its thread is made so it's delivered once. */
  mentions: Record<string, MentionRecord>;
  /** Discord thread or forum post ID → the bb thread its tags go to. */
  links: Record<string, string>;
  lastSummaryAt: number | null;
  /** The local date of the last scheduled summary. */
  lastSummaryDate: string | null;
  summaryThreadId: string | null;
  /** Set while a summary thread is being made, so a restart adopts it rather than posting another. */
  summaryKey: string | null;
  /** After a failed scheduled summary, the next try waits until then. */
  summaryRetryAt: number | null;
  maintainerRoleId: string | null;
  roleNames: Record<string, string>;
  rolesAt: number | null;
  /** User ID → their role IDs, cached for a day. */
  members: Record<string, { roles: string[]; at: number }>;
}

export const emptyState = (): DiscordState => ({
  baselineAt: null, lastPollAt: null, lastError: null, failingSince: null, problemThreadId: null,
  positions: {}, seenAt: {}, channels: {}, activePosts: [], mentions: {}, links: {},
  lastSummaryAt: null, lastSummaryDate: null, summaryThreadId: null, summaryKey: null, summaryRetryAt: null,
  maintainerRoleId: null, roleNames: {}, rolesAt: null, members: {},
});

export interface ThreadPort {
  /** A new Discord thread whose first turn is `prompt`. `key` is kept in its metadata so an interrupted spawn can be adopted. */
  spawn(input: { title: string; prompt: string; key: string | null; notify: boolean; kind: "mention" | "summary" | "notice" }): Promise<string>;
  /** The live thread spawned with this key, if any. */
  find(key: string): Promise<string | null>;
  /** Not archived or deleted. */
  live(threadId: string): Promise<boolean>;
  /** Another notifying turn on the thread. */
  send(threadId: string, prompt: string): Promise<void>;
  archive(threadId: string): Promise<void>;
  /** She wrote in the thread herself. */
  replied(threadId: string): Promise<boolean>;
}

export interface EngineDeps {
  discord: Pick<DiscordClient, "channels" | "activeThreads" | "roles" | "member" | "channel" | "message" | "messages">;
  threads: ThreadPort;
  load(): Promise<DiscordState>;
  save(state: DiscordState): Promise<void>;
  now(): number;
  log: { warn(message: string): void };
}

export interface EngineConfig {
  guildId: string;
  userId: string;
  maintainerRole: string;
  timeZone: string;
  summaryTime: string;
}

const errorText = (error: unknown) => (error instanceof Error ? error.message : String(error));
const status = (error: unknown) => (error as { status?: unknown } | null)?.status;
const newer = (id: string | null | undefined, than: string) => Boolean(id) && compareIds(id!, than) > 0;

export function createEngine(deps: EngineDeps) {
  const { discord, threads } = deps;

  function remember(state: DiscordState, channels: DiscordChannel[], now: number) {
    for (const channel of channels) {
      state.channels[channel.id] = { name: oneLine(channel.name, MAX_NAME) || "unknown", type: channel.type, parentId: channel.parent_id ?? null };
      state.seenAt[channel.id] = now;
    }
  }

  async function refreshRoles(state: DiscordState, now: number, config: EngineConfig) {
    if (state.rolesAt !== null && now - state.rolesAt < ROLES_TTL) return;
    const roles = await discord.roles(config.guildId);
    state.roleNames = Object.fromEntries(roles.map((role) => [role.id, role.name]));
    state.maintainerRoleId = roles.find((role) => role.name.toLowerCase() === config.maintainerRole.toLowerCase())?.id ?? null;
    state.rolesAt = now;
  }

  /** Chat channels, plus Discord threads and forum posts under channels the plugin reads. */
  function targets(listed: DiscordChannel[], active: DiscordChannel[]) {
    const parents = new Map(listed.map((channel) => [channel.id, channel]));
    return [
      ...listed.filter((channel) => isChatChannel(channel.type)),
      ...active.filter((thread) => {
        const parent = parents.get(thread.parent_id ?? "");
        return isThread(thread.type) && parent !== undefined && (isChatChannel(parent.type) || isForum(parent.type));
      }),
    ];
  }

  /** Reads new messages from channels whose last message moved, and records the ones that tag her. */
  async function poll(state: DiscordState, now: number, config: EngineConfig, fresh: Map<string, DiscordMessage>) {
    await refreshRoles(state, now, config);
    const listed = await discord.channels(config.guildId);
    const active = await discord.activeThreads(config.guildId);
    remember(state, [...listed, ...active], now);
    const first = state.baselineAt === null;
    const me = { userId: config.userId, maintainerRoleId: state.maintainerRoleId };
    for (const target of targets(listed, active)) {
      // First run: start at "now". A channel or post first seen later: read from the previous poll.
      let position = state.positions[target.id] ?? (first ? target.last_message_id ?? snowflakeAt(now) : snowflakeAt(state.lastPollAt!));
      state.positions[target.id] = position;
      if (!newer(target.last_message_id, position)) continue;
      try {
        for (let page = 0; page < POLL_PAGES; page += 1) {
          const messages = await discord.messages(target.id, { after: position });
          for (const message of messages) {
            const kind = directTag(message, me);
            if (kind && !state.mentions[message.id] && now - timeOf(message.id) <= MENTION_MAX_AGE && !flooding(state, message)) {
              state.mentions[message.id] = { channelId: target.id, authorId: message.author.id, kind, at: timeOf(message.id), phase: "pending", threadId: null };
              fresh.set(message.id, message);
            }
          }
          if (!messages.length) break;
          position = messages[messages.length - 1]!.id;
          state.positions[target.id] = position;
          if (messages.length < 100) break;
        }
        if (isThread(target.type) && !state.activePosts.includes(target.id)) state.activePosts.push(target.id);
      } catch (error) {
        // No access (#moderator-only) or gone: skip to its latest message so it isn't asked again until it moves.
        if (status(error) === 403 || status(error) === 404) { state.positions[target.id] = target.last_message_id!; continue; }
        throw error;
      }
    }
    if (first) {
      state.baselineAt = now;
      state.lastSummaryAt = now;
      // Installed after today's summary time: the first summary is the next one.
      if (summaryDue(now, null, config.timeZone, config.summaryTime)) state.lastSummaryDate = localDay(now, config.timeZone).date;
    }
    state.lastPollAt = now;
  }

  /** This author already tagged her MENTIONS_PER_AUTHOR_HOUR times in the hour before this message. */
  function flooding(state: DiscordState, message: DiscordMessage) {
    const at = timeOf(message.id);
    let recent = 0;
    for (const record of Object.values(state.mentions)) if (record.authorId === message.author.id && at - record.at < HOUR) recent += 1;
    return recent >= MENTIONS_PER_AUTHOR_HOUR;
  }

  function place(state: DiscordState, channelId: string) {
    const info = state.channels[channelId];
    if (info && isThread(info.type)) return { channel: state.channels[info.parentId ?? ""]?.name ?? "unknown", post: info.name, thread: true };
    return { channel: info?.name ?? "unknown", post: null, thread: false };
  }

  const names = (state: DiscordState): Names => ({
    roles: state.roleNames,
    channels: Object.fromEntries(Object.entries(state.channels).map(([id, info]) => [id, info.name])),
  });

  async function deliver(state: DiscordState, fresh: Map<string, DiscordMessage>, config: EngineConfig) {
    const waiting = Object.entries(state.mentions).filter(([, record]) => record.phase !== "done").sort(([a], [b]) => compareIds(a, b));
    for (const [id, record] of waiting.slice(0, DELIVERIES_PER_PASS)) {
      try {
        if (record.phase === "spawning") {
          const found = await threads.find(id);
          if (found) { finish(state, record, found); await deps.save(state); continue; }
        }
        const message = fresh.get(id) ?? (await discord.message(record.channelId, id));
        if (!message) { record.phase = "done"; await deps.save(state); continue; }
        const context = await discord.messages(record.channelId, { before: id, limit: CONTEXT });
        const where = place(state, record.channelId);
        const prompt = replyPrompt(mentionNote({
          message, context, kind: record.kind, names: names(state),
          place: { channel: where.channel, post: where.post },
          link: jumpLink(config.guildId, record.channelId, id),
        }));
        // Later tags in the same Discord thread or forum post join its bb thread, unless she archived it.
        const linked = where.thread ? state.links[record.channelId] : undefined;
        if (linked && (await threads.live(linked))) {
          finish(state, record, linked);
          await deps.save(state);
          await threads.send(linked, prompt);
          continue;
        }
        record.phase = "spawning";
        await deps.save(state);
        const title = mentionTitle(record.kind, authorName(message.author), oneLine(where.channel, 60), messageText(message, names(state)));
        finish(state, record, await threads.spawn({ title, prompt, key: id, notify: true, kind: "mention" }));
        await deps.save(state);
      } catch (error) {
        deps.log.warn(`Discord mention ${id}: ${errorText(error)}`);
        if (error instanceof RateLimited) return;
      }
    }
  }

  function finish(state: DiscordState, record: MentionRecord, threadId: string) {
    record.phase = "done";
    record.threadId = threadId;
    if (place(state, record.channelId).thread) state.links[record.channelId] = threadId;
  }

  async function roleOf(state: DiscordState, userId: string, now: number, config: EngineConfig, budget: { lookups: number }): Promise<string[] | null> {
    const cached = state.members[userId];
    if (cached && now - cached.at < MEMBER_TTL) return cached.roles;
    if (budget.lookups <= 0) return null;
    budget.lookups -= 1;
    try {
      const member = await discord.member(config.guildId, userId);
      state.members[userId] = { roles: member?.roles ?? [], at: now };
      return state.members[userId]!.roles;
    } catch (error) {
      if (error instanceof RateLimited) throw error;
      return null;
    }
  }

  /** Messages after `from` and up to `to`, oldest first. `more` when the page cap stopped the read early. */
  async function readRange(channelId: string, from: string, to: string) {
    const read: DiscordMessage[] = [];
    let after = from;
    for (let page = 0; page < SUMMARY_PAGES; page += 1) {
      const messages = await discord.messages(channelId, { after });
      read.push(...messages.filter((message) => compareIds(message.id, to) <= 0));
      if (messages.length < 100 || compareIds(messages[messages.length - 1]!.id, to) > 0) return { messages: read, more: 0 };
      after = messages[messages.length - 1]!.id;
    }
    return { messages: read, more: 1 };
  }

  async function summarize(state: DiscordState, now: number, config: EngineConfig, force: boolean) {
    if (state.baselineAt === null) return;
    const today = localDay(now, config.timeZone);
    if (state.summaryKey) {
      const adopted = await threads.find(state.summaryKey);
      if (adopted) return posted(state, adopted, now, state.summaryKey.endsWith(":forced") ? null : today.date);
      state.summaryKey = null;
    }
    if (!force && !summaryDue(now, state.lastSummaryDate, config.timeZone, config.summaryTime)) return;
    if (!force && state.summaryRetryAt !== null && now < state.summaryRetryAt) return;

    await refreshRoles(state, now, config);
    const since = state.lastSummaryAt ?? now - DAY;
    const from = snowflakeAt(since);
    const to = snowflakeAt(now + 1);
    const listed = await discord.channels(config.guildId);
    const active = await discord.activeThreads(config.guildId);
    remember(state, [...listed, ...active], now);
    const byId = new Map([...listed, ...active].map((channel) => [channel.id, channel]));
    const postIds = [...new Set([...state.activePosts, ...active.filter((thread) => newer(thread.last_message_id, from)).map((thread) => thread.id)])];
    const posts: DiscordChannel[] = [];
    for (const id of postIds) {
      const post = byId.get(id) ?? (await discord.channel(id).catch((error: unknown) => { if (error instanceof RateLimited) throw error; return null; }));
      if (post && isThread(post.type)) posts.push(post);
    }

    // The server's own order: by category, then position within it.
    const category = (channel: DiscordChannel) => byId.get(channel.parent_id ?? "")?.position ?? -1;
    const parents = listed
      .filter((channel) => isChatChannel(channel.type) || isForum(channel.type))
      .sort((a, b) => category(a) - category(b) || (a.position ?? 0) - (b.position ?? 0));

    const lookups = { lookups: MEMBER_LOOKUPS };
    let budget = SUMMARY_BUDGET;
    const textNames = names(state);
    const convert = async (messages: DiscordMessage[], channelId: string) => {
      const kept: SummaryMessage[] = [];
      let omitted = 0;
      for (const message of messages) {
        const text = messageText(message, textNames);
        if (!text) continue;
        if (budget - text.length < 0) { omitted += 1; continue; }
        budget -= text.length + 120;
        let role: SummaryMessage["role"] = null;
        if (message.author.id === config.userId) role = "you";
        else if (message.author.bot) role = "bot";
        else if (state.maintainerRoleId && (await roleOf(state, message.author.id, now, config, lookups))?.includes(state.maintainerRoleId)) role = "maintainer";
        kept.push({
          id: message.id, author: authorName(message.author), role, at: timeOf(message.id),
          replyTo: message.message_reference?.message_id ?? null, text, link: jumpLink(config.guildId, channelId, message.id),
        });
      }
      return { kept, omitted };
    };
    const read = async (channelId: string) => {
      try { return await readRange(channelId, from, to); } catch (error) {
        if (status(error) === 403 || status(error) === 404) return { messages: [], more: 0 };
        throw error;
      }
    };

    const sections: SummaryChannel[] = [];
    for (const parent of parents) {
      const section: SummaryChannel = { id: parent.id, name: oneLine(parent.name, 60), forum: isForum(parent.type), messages: [], posts: [], omitted: 0 };
      if (isChatChannel(parent.type) && newer(parent.last_message_id, from)) {
        const range = await read(parent.id);
        const { kept, omitted } = await convert(range.messages, parent.id);
        section.messages = kept;
        section.omitted = omitted + range.more;
      }
      const tags = new Map((parent.available_tags ?? []).map((tag) => [tag.id, oneLine(tag.name, 40)]));
      for (const post of posts.filter((entry) => entry.parent_id === parent.id)) {
        const range = await read(post.id);
        if (!range.messages.length) continue;
        const { kept, omitted } = await convert(range.messages, post.id);
        const entry: SummaryPost = {
          id: post.id, title: oneLine(post.name, 100), link: jumpLink(config.guildId, post.id, post.id),
          tags: (post.applied_tags ?? []).map((tag) => tags.get(tag)).filter((tag): tag is string => Boolean(tag)),
          messages: kept, omitted: omitted + range.more,
        };
        section.posts.push(entry);
      }
      if (section.messages.length || section.omitted || section.posts.length) sections.push(section);
    }

    const title = `Discord · ${today.label}`;
    const sinceLabel = localDay(since, config.timeZone).weekday;
    const quiet = sections.length === 0;
    const prompt = quiet
      ? replyPrompt([`${title}: nothing new since ${sinceLabel}.`])
      : summaryPrompt({ title, since: sinceLabel, data: summaryData(sections, config.timeZone) });
    const key = `summary:${now}${force ? ":forced" : ""}`;
    state.summaryKey = key;
    await deps.save(state);
    const threadId = await threads.spawn({ title, prompt, key, notify: !quiet, kind: "summary" });
    await posted(state, threadId, now, force ? null : today.date);
  }

  async function posted(state: DiscordState, threadId: string, now: number, date: string | null) {
    const previous = state.summaryThreadId;
    state.summaryThreadId = threadId;
    state.summaryKey = null;
    state.summaryRetryAt = null;
    state.lastSummaryAt = now;
    if (date) state.lastSummaryDate = date;
    state.activePosts = [];
    await deps.save(state);
    // The previous summary leaves when the next arrives, unless she replied in it.
    if (previous && previous !== threadId && (await threads.live(previous)) && !(await threads.replied(previous))) await threads.archive(previous);
  }

  async function notices(state: DiscordState, now: number, healthy: boolean) {
    if (healthy) {
      state.failingSince = null;
      if (!state.problemThreadId) return;
      state.problemThreadId = null;
      await deps.save(state);
      await threads.spawn({
        title: "Discord can be read again",
        prompt: replyPrompt(["Discord can be read again. New mentions will show up here, and missed ones from the last day were delivered."]),
        key: null,
        notify: true,
        kind: "notice",
      });
      return;
    }
    state.failingSince ??= now;
    if (state.problemThreadId || now - state.failingSince < FAILURE_ALERT_AFTER) return;
    state.problemThreadId = "pending";
    await deps.save(state);
    state.problemThreadId = await threads.spawn({
      title: "Discord can't be read",
      prompt: replyPrompt([
        "Discord hasn't been readable for an hour, so new mentions and the daily summary won't show up here.",
        `Last error: ${oneLine(state.lastError ?? "unknown", 200)}. Ask an agent in bb to check the Discord plugin's settings and the bot's access.`,
      ]),
      key: null,
      notify: true,
      kind: "notice",
    });
  }

  function prune(state: DiscordState, now: number) {
    for (const [id, record] of Object.entries(state.mentions)) {
      // Undelivered past the age limit: the summary covers it instead.
      if (now - record.at > (record.phase === "done" ? KEEP_MENTIONS : MENTION_MAX_AGE)) delete state.mentions[id];
    }
    for (const [id, at] of Object.entries(state.seenAt)) {
      const thread = isThread(state.channels[id]?.type ?? -1);
      if (now - at <= (thread ? KEEP_UNSEEN_THREADS : KEEP_UNSEEN)) continue;
      delete state.seenAt[id];
      delete state.positions[id];
      delete state.channels[id];
      delete state.links[id];
    }
    for (const [id, member] of Object.entries(state.members)) if (now - member.at > MEMBER_TTL) delete state.members[id];
  }

  return {
    /** One pass: read new messages and deliver tags (`poll`), then post the summary if it's due (or `force`d). */
    async tick(config: EngineConfig, options: { poll: boolean; summary: "auto" | "force" | "skip" }) {
      const state = await deps.load();
      const now = deps.now();
      prune(state, now);
      if (options.poll) {
        const fresh = new Map<string, DiscordMessage>();
        let healthy = false;
        try {
          await poll(state, now, config, fresh);
          state.lastError = null;
          healthy = true;
        } catch (error) {
          state.lastError = errorText(error);
          deps.log.warn(`Discord poll failed: ${state.lastError}`);
        }
        await deps.save(state);
        await deliver(state, fresh, config);
        await notices(state, now, healthy);
      }
      if (options.summary !== "skip") {
        try { await summarize(state, now, config, options.summary === "force"); } catch (error) {
          state.lastError = `Summary: ${errorText(error)}`;
          deps.log.warn(`Discord summary failed: ${errorText(error)}`);
          if (options.summary === "force") { await deps.save(state); throw error; }
          state.summaryRetryAt = now + SUMMARY_RETRY;
        }
      }
      prune(state, now);
      await deps.save(state);
      return state;
    },
  };
}
