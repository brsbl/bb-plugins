// Read-only Discord REST over an injected fetch. Every request this module can make is a GET:
// `request()` is the only fetch call and its method is fixed. discord.test.ts fails if that changes.

export const DISCORD_API = "https://discord.com/api/v10";
export const REQUEST_TIMEOUT = 20_000;
const METHOD = "GET";

export interface DiscordUser {
  id: string;
  username: string;
  global_name?: string | null;
  bot?: boolean;
}

export interface DiscordChannel {
  id: string;
  type: number;
  name?: string;
  parent_id?: string | null;
  position?: number;
  last_message_id?: string | null;
  /** Forum channels: the tags a post can carry. */
  available_tags?: { id: string; name: string }[];
  /** Forum posts: their tag IDs. */
  applied_tags?: string[];
}

export interface DiscordMessage {
  id: string;
  channel_id: string;
  author: DiscordUser;
  content: string;
  timestamp: string;
  type?: number;
  webhook_id?: string;
  mentions?: DiscordUser[];
  mention_roles?: string[];
  mention_everyone?: boolean;
  message_reference?: { message_id?: string; channel_id?: string };
  referenced_message?: DiscordMessage | null;
  attachments?: { filename: string }[];
}

export interface DiscordRole {
  id: string;
  name: string;
}

export interface DiscordMember {
  roles: string[];
}

export class DiscordError extends Error {
  constructor(message: string, readonly status: number | null = null) {
    super(message);
    this.name = "DiscordError";
  }
}

/** Discord said 429. Nothing more is requested until `until`. */
export class RateLimited extends DiscordError {
  constructor(readonly until: number) {
    super("Discord is rate limiting requests", 429);
    this.name = "RateLimited";
  }
}

export interface DiscordClientOptions {
  fetch: typeof fetch;
  apiBase: string;
  now(): number;
  token(): Promise<string | undefined>;
}

export type DiscordClient = ReturnType<typeof createDiscordClient>;

export function createDiscordClient(options: DiscordClientOptions) {
  let blockedUntil = 0;

  async function request(url: string, token: string): Promise<Response> {
    try {
      return await options.fetch(url, {
        method: METHOD,
        headers: { authorization: `Bot ${token}`, accept: "application/json" },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT),
      });
    } catch {
      throw new DiscordError("Discord is unreachable");
    }
  }

  /** The body, or null when Discord says it doesn't exist. Throws on 403 (status 403), 429 and other failures. */
  async function get<T>(path: string, query: Record<string, string | undefined> = {}): Promise<T | null> {
    if (options.now() < blockedUntil) throw new RateLimited(blockedUntil);
    const token = await options.token();
    if (!token) throw new DiscordError("Set the bot token in Discord settings");
    const url = new URL(`${options.apiBase}${path}`);
    for (const [key, value] of Object.entries(query)) if (value !== undefined) url.searchParams.set(key, value);
    const response = await request(url.toString(), token);
    if (response.status === 429) {
      const body = (await response.json().catch(() => ({}))) as { retry_after?: number };
      const seconds = Number(body.retry_after ?? response.headers.get("retry-after") ?? 5);
      // Back off rather than retry: the next request waits until Discord's window has passed.
      blockedUntil = options.now() + Math.max(1, Number.isFinite(seconds) ? seconds : 5) * 1000;
      throw new RateLimited(blockedUntil);
    }
    if (response.status === 404) return null;
    if (response.status === 401) throw new DiscordError("Discord rejected the bot token", 401);
    if (response.status === 403) throw new DiscordError("The bot can't read this", 403);
    if (!response.ok) throw new DiscordError(`Discord returned ${response.status}`, response.status);
    return (await response.json()) as T;
  }

  const list = async <T>(path: string, query: Record<string, string | undefined> = {}) => (await get<T[]>(path, query)) ?? [];

  return {
    channels: (guildId: string) => list<DiscordChannel>(`/guilds/${guildId}/channels`),
    activeThreads: async (guildId: string) => (await get<{ threads?: DiscordChannel[] }>(`/guilds/${guildId}/threads/active`))?.threads ?? [],
    roles: (guildId: string) => list<DiscordRole>(`/guilds/${guildId}/roles`),
    /** Null when they left the server. */
    member: (guildId: string, userId: string) => get<DiscordMember>(`/guilds/${guildId}/members/${userId}`),
    channel: (channelId: string) => get<DiscordChannel>(`/channels/${channelId}`),
    message: (channelId: string, messageId: string) => get<DiscordMessage>(`/channels/${channelId}/messages/${messageId}`),
    /** Up to 100 messages after or before a message ID, oldest first. */
    async messages(channelId: string, page: { after?: string; before?: string; limit?: number }): Promise<DiscordMessage[]> {
      const messages = await list<DiscordMessage>(`/channels/${channelId}/messages`, {
        after: page.after,
        before: page.before,
        limit: String(page.limit ?? 100),
      });
      return messages.sort((a, b) => compareIds(a.id, b.id));
    },
  };
}

/** Discord IDs are snowflakes: their order is their time order. */
export function compareIds(a: string, b: string): number {
  const left = BigInt(a);
  const right = BigInt(b);
  return left < right ? -1 : left > right ? 1 : 0;
}

const DISCORD_EPOCH = 1_420_070_400_000n;

/** The smallest snowflake at `ms`, so `after=` it reads everything sent from then on. */
export function snowflakeAt(ms: number): string {
  const offset = BigInt(Math.floor(ms)) - DISCORD_EPOCH;
  return String(offset > 0n ? offset << 22n : 0n);
}

export function timeOf(id: string): number {
  return Number((BigInt(id) >> 22n) + DISCORD_EPOCH);
}

export const CHANNEL = {
  text: 0,
  voice: 2,
  category: 4,
  announcement: 5,
  announcementThread: 10,
  publicThread: 11,
  privateThread: 12,
  stage: 13,
  forum: 15,
  media: 16,
} as const;

/** Channels whose messages are read directly. Voice and stage chats are skipped. */
export const isChatChannel = (type: number) => type === CHANNEL.text || type === CHANNEL.announcement;
export const isThread = (type: number) => type === CHANNEL.announcementThread || type === CHANNEL.publicThread || type === CHANNEL.privateThread;
export const isForum = (type: number) => type === CHANNEL.forum || type === CHANNEL.media;
