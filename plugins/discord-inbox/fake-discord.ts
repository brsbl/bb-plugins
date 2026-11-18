import { CHANNEL, compareIds, snowflakeAt, type DiscordChannel, type DiscordMessage, type DiscordRole, type DiscordUser } from "./discord.js";

// An in-memory Discord guild for tests and dev QA. Nothing here talks to Discord.
// It answers GET only: any other method gets 405 and stays in `requests`, so tests can assert none was sent.

export interface FakeRequest {
  method: string;
  path: string;
}

export function createFakeDiscord(options: { base?: string; guildId?: string; now?: () => number } = {}) {
  const apiBase = `${options.base ?? "https://fake-discord.test"}/api/v10`;
  const guildId = options.guildId ?? "100000000000000000";
  const now = options.now ?? (() => Date.now());
  const channels = new Map<string, DiscordChannel>();
  const messages = new Map<string, DiscordMessage[]>();
  const roles: DiscordRole[] = [{ id: guildId, name: "@everyone" }];
  const members = new Map<string, string[]>();
  const forbidden = new Set<string>();
  const requests: FakeRequest[] = [];
  let failing = false;
  let rateLimitNext = 0;
  let sequence = 0;

  /** A snowflake for "now" that sorts after every earlier one. */
  const nextId = () => String(BigInt(snowflakeAt(now())) + BigInt((sequence += 1)));
  const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

  function addChannel(channel: Partial<DiscordChannel> & { name: string; type?: number }): DiscordChannel {
    const created: DiscordChannel = { id: channel.id ?? nextId(), type: CHANNEL.text, parent_id: null, last_message_id: null, ...channel };
    channels.set(created.id, created);
    messages.set(created.id, []);
    return created;
  }

  function post(channelId: string, author: DiscordUser, content: string, extra: Partial<DiscordMessage> = {}): DiscordMessage {
    const channel = channels.get(channelId);
    if (!channel) throw new Error(`No channel ${channelId}`);
    const id = extra.id ?? nextId();
    const message: DiscordMessage = {
      id, channel_id: channelId, author, content, timestamp: new Date(now()).toISOString(),
      mentions: [], mention_roles: [], mention_everyone: false, type: 0, attachments: [], ...extra,
    };
    if (message.message_reference?.message_id && extra.referenced_message === undefined) {
      message.referenced_message = (messages.get(channelId) ?? []).find((entry) => entry.id === message.message_reference!.message_id) ?? null;
      message.type = 19;
    }
    messages.get(channelId)!.push(message);
    channel.last_message_id = id;
    delete (channel as { archived?: boolean }).archived;
    return message;
  }

  /** A forum post or Discord thread: a thread channel whose ID is its first message's. */
  function startThread(parentId: string, name: string, author: DiscordUser, content: string, extra: Partial<DiscordChannel> = {}) {
    const parent = channels.get(parentId);
    if (!parent) throw new Error(`No channel ${parentId}`);
    const id = nextId();
    const thread = addChannel({ id, name, type: CHANNEL.publicThread, parent_id: parentId, applied_tags: [], ...extra });
    const first = post(id, author, content, { id });
    return { thread, first };
  }

  function page(channelId: string, query: URLSearchParams) {
    const all = [...(messages.get(channelId) ?? [])].sort((a, b) => compareIds(a.id, b.id));
    const limit = Math.min(100, Number(query.get("limit") ?? 50));
    const after = query.get("after");
    const before = query.get("before");
    // Like Discord: the messages right after `after` (or right before `before`, or the latest), newest first.
    const picked = after
      ? all.filter((message) => compareIds(message.id, after) > 0).slice(0, limit)
      : (before ? all.filter((message) => compareIds(message.id, before) < 0) : all).slice(-limit);
    return picked.reverse();
  }

  async function handle(input: Parameters<typeof fetch>[0], init?: RequestInit): Promise<Response> {
    const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url);
    const method = (init?.method ?? "GET").toUpperCase();
    const path = url.pathname.startsWith("/api/v10") ? url.pathname.slice("/api/v10".length) : url.pathname;
    requests.push({ method, path });
    if (method !== "GET") return json(405, { message: "405: Method Not Allowed", code: 0 });
    if (!new Headers(init?.headers).get("authorization")?.startsWith("Bot ")) return json(401, { message: "401: Unauthorized", code: 0 });
    if (rateLimitNext > 0) { rateLimitNext -= 1; return json(429, { message: "You are being rate limited.", retry_after: 2, global: false }); }
    if (failing) return json(502, { message: "Bad Gateway" });

    let match: RegExpMatchArray | null;
    if ((match = path.match(/^\/guilds\/(\d+)\/(channels|threads\/active|roles)$/))) {
      if (match[1] !== guildId) return json(404, { message: "Unknown Guild", code: 10004 });
      if (match[2] === "roles") return json(200, roles);
      const all = [...channels.values()];
      if (match[2] === "channels") return json(200, all.filter((channel) => channel.type !== CHANNEL.publicThread && channel.type !== CHANNEL.privateThread));
      return json(200, { threads: all.filter((channel) => channel.type === CHANNEL.publicThread && !(channel as { archived?: boolean }).archived), members: [] });
    }
    if ((match = path.match(/^\/guilds\/(\d+)\/members\/(\d+)$/))) {
      const memberRoles = members.get(match[2]!);
      return memberRoles ? json(200, { roles: memberRoles }) : json(404, { message: "Unknown Member", code: 10007 });
    }
    if ((match = path.match(/^\/channels\/(\d+)(?:\/messages(?:\/(\d+))?)?$/))) {
      const channelId = match[1]!;
      if (forbidden.has(channelId)) return json(403, { message: "Missing Access", code: 50001 });
      const channel = channels.get(channelId);
      if (!channel) return json(404, { message: "Unknown Channel", code: 10003 });
      if (!path.includes("/messages")) return json(200, channel);
      if (match[2]) {
        const found = messages.get(channelId)!.find((message) => message.id === match![2]);
        return found ? json(200, found) : json(404, { message: "Unknown Message", code: 10008 });
      }
      return json(200, page(channelId, url.searchParams));
    }
    return json(404, { message: "404: Not Found", code: 0 });
  }

  return {
    apiBase,
    guildId,
    fetch: handle as typeof fetch,
    requests,
    addChannel,
    post,
    startThread,
    addRole(name: string): DiscordRole {
      const role = { id: nextId(), name };
      roles.push(role);
      return role;
    },
    setMember: (userId: string, roleIds: string[]) => void members.set(userId, roleIds),
    rename(channelId: string, name: string, parentId?: string | null) {
      const channel = channels.get(channelId)!;
      channel.name = name;
      if (parentId !== undefined) channel.parent_id = parentId;
    },
    setTags(threadId: string, tagIds: string[]) {
      channels.get(threadId)!.applied_tags = tagIds;
    },
    /** Inactive posts leave the active-threads list. */
    archiveThread(threadId: string) {
      (channels.get(threadId) as { archived?: boolean }).archived = true;
    },
    forbid: (channelId: string) => void forbidden.add(channelId),
    setFailing(value: boolean) { failing = value; },
    rateLimit(count = 1) { rateLimitNext = count; },
    nonGet: () => requests.filter((request) => request.method !== "GET"),
    messages: (channelId: string) => messages.get(channelId) ?? [],
  };
}

export type FakeDiscord = ReturnType<typeof createFakeDiscord>;

export const user = (id: string, name: string, extra: Partial<DiscordUser> = {}): DiscordUser => ({ id, username: name.toLowerCase(), global_name: name, ...extra });
