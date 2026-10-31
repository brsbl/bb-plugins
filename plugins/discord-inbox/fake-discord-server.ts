import { createServer } from "node:http";
import { CHANNEL, type DiscordMessage } from "./discord.js";
import { createFakeDiscord, user } from "./fake-discord.js";

// Dev QA only: serves the in-memory fake Discord over loopback HTTP. Start bb with
// BB_DISCORD_FAKE_API=http://127.0.0.1:<port>, set the guild and user IDs this prints, then act the way people would:
//   POST /_fake/post    { channelId, authorId, content, mentions?: [userId], mentionRoles?: [roleId], replyTo?: messageId, everyone?: true, bot?: true }
//   POST /_fake/thread  { parentId, name, authorId, content, tags?: [tagId] }
//   POST /_fake/rename  { channelId, name, parentId? }
//   POST /_fake/tags    { threadId, tags: [tagId] }
//   POST /_fake/fail    { failing: boolean }
//   GET  /_fake/state   the seeded IDs and every request the plugin made (method and path)
const port = Number(process.argv[2] ?? 47813);
const base = `http://127.0.0.1:${port}`;
const discord = createFakeDiscord({ base, guildId: "200000000000000000" });

const people = {
  brsbl: user("300000000000000001", "brsbl", { username: "brsabel" }),
  sawyer: user("300000000000000002", "Sawyer"),
  ada: user("300000000000000003", "Ada"),
  maintainer: user("300000000000000004", "Mo"),
  bot: user("300000000000000005", "Helper", { bot: true }),
};
const maintainerRole = discord.addRole("Maintainer");
discord.setMember(people.maintainer.id, [maintainerRole.id]);
discord.setMember(people.brsbl.id, [maintainerRole.id]);
const startHere = discord.addChannel({ name: "Start here", type: CHANNEL.category, position: 0 });
const chat = discord.addChannel({ name: "Chat & share", type: CHANNEL.category, position: 1 });
const help = discord.addChannel({ name: "Help & feedback", type: CHANNEL.category, position: 2 });
const channels = {
  announcements: discord.addChannel({ name: "announcements", type: CHANNEL.announcement, parent_id: startHere.id, position: 0 }),
  general: discord.addChannel({ name: "general", parent_id: chat.id, position: 0 }),
  questions: discord.addChannel({ name: "questions", parent_id: help.id, position: 0 }),
  moderatorOnly: discord.addChannel({ name: "moderator-only", parent_id: chat.id, position: 5 }),
  voice: discord.addChannel({ name: "Lounge", type: CHANNEL.voice, parent_id: chat.id, position: 6 }),
  bugs: discord.addChannel({
    name: "bugs", type: CHANNEL.forum, parent_id: help.id, position: 1,
    available_tags: [{ id: "400000000000000001", name: "repro-confirmed" }, { id: "400000000000000002", name: "fixed" }],
  }),
};
discord.forbid(channels.moderatorOnly.id);
const seeded = { guildId: discord.guildId, userId: people.brsbl.id, maintainerRoleId: maintainerRole.id, people, channels: Object.fromEntries(Object.entries(channels).map(([key, value]) => [key, value.id])) };
// History from before install: never tagged or summarized.
discord.post(channels.general.id, people.sawyer, `old ping <@${people.brsbl.id}>`, { mentions: [people.brsbl] });

const byId = new Map(Object.values(people).map((person) => [person.id, person]));

createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", base);
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(chunk as Buffer);
  const body = Buffer.concat(chunks).toString("utf8");
  if (url.pathname.startsWith("/_fake/")) {
    const input = (body ? JSON.parse(body) : {}) as Record<string, unknown>;
    const action = url.pathname.slice("/_fake/".length);
    const author = byId.get(String(input.authorId ?? people.sawyer.id)) ?? people.sawyer;
    let result: unknown = seeded;
    try {
      if (action === "post") {
        const extra: Partial<DiscordMessage> = {
          mentions: ((input.mentions as string[] | undefined) ?? []).map((id) => byId.get(id) ?? user(id, "someone")),
          mention_roles: (input.mentionRoles as string[] | undefined) ?? [],
          mention_everyone: Boolean(input.everyone),
          ...(input.replyTo ? { message_reference: { message_id: String(input.replyTo) } } : {}),
        };
        result = discord.post(String(input.channelId), input.bot ? people.bot : author, String(input.content ?? ""), extra);
      } else if (action === "thread") {
        const { thread, first } = discord.startThread(String(input.parentId), String(input.name), author, String(input.content ?? ""), { applied_tags: (input.tags as string[] | undefined) ?? [] });
        result = { thread, first };
      } else if (action === "rename") discord.rename(String(input.channelId), String(input.name), input.parentId === undefined ? undefined : (input.parentId as string | null));
      else if (action === "tags") discord.setTags(String(input.threadId), input.tags as string[]);
      else if (action === "fail") discord.setFailing(Boolean(input.failing));
      else if (action === "state") result = { ...seeded, requests: discord.requests, nonGet: discord.nonGet() };
      else { response.writeHead(400).end(); return; }
    } catch (error) {
      response.writeHead(400, { "content-type": "application/json" }).end(JSON.stringify({ error: String(error) }));
      return;
    }
    response.writeHead(200, { "content-type": "application/json" }).end(JSON.stringify(result));
    return;
  }
  const headers = Object.fromEntries(Object.entries(request.headers).filter((entry): entry is [string, string] => typeof entry[1] === "string"));
  const answer = await discord.fetch(url.toString(), { method: request.method, headers, ...(body ? { body } : {}) });
  response.writeHead(answer.status, { "content-type": "application/json" }).end(await answer.text());
}).listen(port, "127.0.0.1", () => console.log(JSON.stringify({ fake: base, ...seeded })));
