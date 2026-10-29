import type { Cursors, DiscordAuthor } from "./model.js";

export type DiscordCursor = NonNullable<Cursors["discord"]>;
/** GET a Discord REST route (`/guilds/...`) and return its JSON. */
export type DiscordApi = (route: string, signal?: AbortSignal) => Promise<unknown>;

const API = "https://discord.com/api/v10";
const VIEW_CHANNEL = 1n << 10n;
const MESSAGE_PARENT_TYPES = new Set([0, 5]); // text, announcement
const THREAD_PARENT_TYPES = new Set([0, 5, 15, 16]); // plus forum and media
const PUBLIC_THREAD_TYPES = new Set([10, 11]); // announcement and public threads
const COUNTED_MESSAGE_TYPES = new Set([0, 19]); // default and reply; skips joins, pins and thread notices
const SNIPPET = 80;
const sleep = (ms: number, signal?: AbortSignal) => new Promise<void>((resolve, reject) => {
  const timer = setTimeout(resolve, ms);
  signal?.addEventListener("abort", () => { clearTimeout(timer); reject(signal.reason); }, { once: true });
});

/** Read-only Discord REST client with rate-limit retries. Error messages never include the token. */
export function createDiscordApi(token: string, fetchImpl: typeof fetch = fetch): DiscordApi {
  return async (route, signal) => {
    const path = route.split("?")[0];
    for (let attempt = 0; attempt < 8; attempt++) {
      const response = await fetchImpl(API + route, { headers: { Authorization: `Bot ${token}` }, signal });
      if (response.status === 429) {
        const body = await response.json().catch(() => ({})) as { retry_after?: number };
        await sleep(Math.ceil((body.retry_after ?? 1) * 1000), signal);
        continue;
      }
      if (response.status >= 500) { await sleep(500 * 2 ** attempt, signal); continue; }
      if (response.status === 401) throw new Error("Discord rejected the bot token");
      if (!response.ok) throw new Error(`Discord ${response.status} for ${path}`);
      return response.json();
    }
    throw new Error(`Discord kept failing for ${path}`);
  };
}

type Overwrite = { id: string; type: number; allow?: string; deny?: string };
type Channel = { id: string; type: number; parent_id?: string | null; permission_overwrites?: Overwrite[]; thread_metadata?: { archive_timestamp?: string } };
type Message = { id: string; type: number; timestamp: string; content?: string; author?: { username?: string; bot?: boolean } };

function publicToEveryone(channel: Channel, guildId: string, everyone: bigint): boolean {
  let permissions = everyone;
  const overwrite = channel.permission_overwrites?.find(item => item.type === 0 && item.id === guildId);
  if (overwrite) permissions = (permissions & ~BigInt(overwrite.deny ?? "0")) | BigInt(overwrite.allow ?? "0");
  return (permissions & VIEW_CHANNEL) !== 0n;
}

const newer = (left: string, right: string) => BigInt(left) > BigInt(right);

/** Adds one message to its author's running totals. */
export function countMessage(authors: Record<string, DiscordAuthor>, guildId: string, channelId: string, message: Message): void {
  const handle = message.author?.username?.toLowerCase();
  if (!handle || message.author?.bot || !COUNTED_MESSAGE_TYPES.has(message.type)) return;
  const date = message.timestamp.slice(0, 10);
  const url = `https://discord.com/channels/${guildId}/${channelId}/${message.id}`;
  const entry = { id: message.id, url, date, snippet: (message.content ?? "").replace(/\s+/g, " ").trim().slice(0, SNIPPET) };
  const author = authors[handle];
  if (!author) { authors[handle] = { m: 1, f: date, l: date, u: url, recent: [entry] }; return; }
  author.m += 1;
  if (date < author.f) author.f = date;
  if (date > author.l) author.l = date;
  if (!author.recent[0] || newer(message.id, author.recent[0].id)) author.u = url;
  if (!author.recent.some(item => item.id === message.id)) {
    author.recent = [...author.recent, entry].sort((a, b) => (newer(a.id, b.id) ? -1 : 1)).slice(0, 2);
  }
}

async function readMessagesAfter(api: DiscordApi, channelId: string, after: string, signal?: AbortSignal): Promise<Message[]> {
  const messages: Message[] = [];
  let cursor = after;
  for (;;) {
    signal?.throwIfAborted();
    const page = await api(`/channels/${channelId}/messages?limit=100&after=${cursor}`, signal);
    if (!Array.isArray(page) || page.length === 0) break;
    messages.push(...(page as Message[]));
    cursor = (page as Message[]).reduce((max, item) => (newer(item.id, max) ? item.id : max), cursor);
    if (page.length < 100) break;
  }
  return messages;
}

export interface DiscordResult {
  cursor: DiscordCursor;
  /** Channels or threads that couldn't be read this run; their cursors stay put. */
  failures: string[];
}

/**
 * Reads public messages posted since each channel's cursor, including forum posts and
 * active or recently archived public threads, and adds them to per-author totals.
 * The first run reads the whole history. Throws when the guild itself can't be read.
 */
export async function fetchDiscord(api: DiscordApi, guildId: string, previous: DiscordCursor | undefined, now: Date, signal?: AbortSignal): Promise<DiscordResult> {
  const cursor: DiscordCursor = {
    channels: { ...previous?.channels },
    threadsCheckedAt: previous?.threadsCheckedAt ?? null,
    authors: structuredClone(previous?.authors ?? {}),
  };
  const failures: string[] = [];
  const guild = await api(`/guilds/${guildId}`, signal) as { roles?: { id: string; permissions?: string }[] };
  const everyone = guild.roles?.find(role => role.id === guildId);
  if (!everyone) throw new Error("Discord didn't return the server's @everyone role");
  const channels = await api(`/guilds/${guildId}/channels`, signal);
  if (!Array.isArray(channels)) throw new Error("Discord didn't return the channel list");
  const open = (channels as Channel[]).filter(channel => publicToEveryone(channel, guildId, BigInt(everyone.permissions ?? "0")));
  const parents = new Set(open.filter(channel => THREAD_PARENT_TYPES.has(channel.type)).map(channel => channel.id));
  const readable = open.filter(channel => MESSAGE_PARENT_TYPES.has(channel.type)).map(channel => channel.id);

  const threads = new Set<string>();
  const active = await api(`/guilds/${guildId}/threads/active`, signal) as { threads?: Channel[] };
  for (const thread of active.threads ?? []) {
    if (PUBLIC_THREAD_TYPES.has(thread.type) && thread.parent_id && parents.has(thread.parent_id)) threads.add(thread.id);
  }
  const checkedAt = cursor.threadsCheckedAt;
  for (const parent of parents) {
    let before: string | null = null;
    try {
      for (;;) {
        const page = await api(`/channels/${parent}/threads/archived/public?limit=100${before ? `&before=${encodeURIComponent(before)}` : ""}`, signal) as { threads?: Channel[]; has_more?: boolean };
        const list = page.threads ?? [];
        let oldest: string | null = null;
        for (const thread of list) {
          const archived = thread.thread_metadata?.archive_timestamp ?? "";
          if (!checkedAt || archived >= checkedAt) threads.add(thread.id);
          if (archived && (!oldest || archived < oldest)) oldest = archived;
        }
        if (!page.has_more || list.length === 0 || !oldest || (checkedAt && oldest < checkedAt)) break;
        before = oldest;
      }
    } catch (error) {
      if (signal?.aborted) throw error;
      failures.push(`archived threads in ${parent}`);
    }
  }

  for (const channelId of [...readable, ...threads]) {
    try {
      const messages = await readMessagesAfter(api, channelId, cursor.channels[channelId] ?? "0", signal);
      for (const message of messages) {
        countMessage(cursor.authors, guildId, channelId, message);
        if (!cursor.channels[channelId] || newer(message.id, cursor.channels[channelId])) cursor.channels[channelId] = message.id;
      }
    } catch (error) {
      if (signal?.aborted) throw error;
      failures.push(channelId);
    }
  }
  // Threads archived before this run started were read above or on an earlier run.
  cursor.threadsCheckedAt = failures.length ? checkedAt : now.toISOString();
  return { cursor, failures };
}
