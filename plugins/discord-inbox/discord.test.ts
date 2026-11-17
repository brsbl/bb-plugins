import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { createDiscordClient, DiscordError, RateLimited, snowflakeAt, timeOf } from "./discord";
import { createFakeDiscord } from "./fake-discord";

function recording() {
  const calls: { method: string; url: string }[] = [];
  const fetch = (async (input: Parameters<typeof globalThis.fetch>[0], init?: RequestInit) => {
    calls.push({ method: init?.method ?? "GET", url: String(input) });
    return new Response("[]", { status: 200, headers: { "content-type": "application/json" } });
  }) as typeof globalThis.fetch;
  return { calls, client: createDiscordClient({ fetch, apiBase: "https://fake.test/api/v10", now: () => 0, token: async () => "token" }) };
}

describe("read-only Discord client", () => {
  it("sends only GET requests, whatever it is asked for", async () => {
    const { calls, client } = recording();
    await client.channels("1");
    await client.activeThreads("1");
    await client.roles("1");
    await client.member("1", "2");
    await client.channel("3");
    await client.message("3", "4");
    await client.messages("3", { after: "4" });
    await client.messages("3", { before: "4", limit: 5 });
    expect(Object.keys(client).sort()).toEqual(["activeThreads", "channel", "channels", "member", "message", "messages", "roles"]);
    expect(calls).toHaveLength(8);
    expect(calls.every((call) => call.method === "GET")).toBe(true);
  });

  it("has no way to write: no other HTTP method appears in the plugin's code", () => {
    const sources = readdirSync(__dirname).filter((name) => name.endsWith(".ts") && !name.includes(".test.") && !name.startsWith("fake-"));
    expect(sources).toEqual(expect.arrayContaining(["discord.ts", "engine.ts", "messages.ts", "server.ts"]));
    for (const name of sources) {
      const source = readFileSync(`${__dirname}/${name}`, "utf8");
      expect(source, name).not.toMatch(/["'`](POST|PUT|PATCH|DELETE)["'`]/);
      // Only discord.ts reaches the network, through its single fixed-method request().
      const fetches = source.match(/\bfetch\(/g) ?? [];
      if (name === "discord.ts") expect(fetches).toHaveLength(1);
      if (name === "server.ts") expect(source.match(/globalThis\.fetch\(input, init\)/g)).toHaveLength(1);
      if (name !== "discord.ts" && name !== "server.ts") expect(fetches, name).toHaveLength(0);
      // HTTP methods (`method: METHOD` or an upper-case literal), not plugin RPC names like `method: "getConfig"`.
      expect(source.match(/\bmethod:\s*(METHOD\b|["'`][A-Z]+["'`])/g)?.length ?? 0, name).toBe(name === "discord.ts" ? 1 : 0);
    }
    expect(readFileSync(`${__dirname}/discord.ts`, "utf8")).toMatch(/const METHOD = "GET";\n/);
  });

  it("backs off after a 429 instead of retrying", async () => {
    let now = 0;
    const fake = createFakeDiscord({ now: () => now });
    const client = createDiscordClient({ fetch: fake.fetch, apiBase: fake.apiBase, now: () => now, token: async () => "token" });
    fake.rateLimit(1);
    await expect(client.channels(fake.guildId)).rejects.toBeInstanceOf(RateLimited);
    await expect(client.channels(fake.guildId)).rejects.toBeInstanceOf(RateLimited);
    expect(fake.requests).toHaveLength(1);
    now += 2_000;
    await expect(client.channels(fake.guildId)).resolves.toEqual([]);
    expect(fake.requests).toHaveLength(2);
  });

  it("reports missing access, missing things and a missing token", async () => {
    const fake = createFakeDiscord();
    const channel = fake.addChannel({ name: "moderator-only" });
    fake.forbid(channel.id);
    const client = createDiscordClient({ fetch: fake.fetch, apiBase: fake.apiBase, now: () => 0, token: async () => "token" });
    await expect(client.messages(channel.id, {})).rejects.toMatchObject({ status: 403 });
    await expect(client.channel("999")).resolves.toBeNull();
    const unset = createDiscordClient({ fetch: fake.fetch, apiBase: fake.apiBase, now: () => 0, token: async () => undefined });
    await expect(unset.roles(fake.guildId)).rejects.toBeInstanceOf(DiscordError);
  });

  it("orders snowflakes by time", () => {
    const at = Date.parse("2026-11-02T17:00:00Z");
    expect(timeOf(snowflakeAt(at))).toBe(at);
    expect(snowflakeAt(0)).toBe("0");
  });
});
