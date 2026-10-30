import { describe, expect, it, vi } from "vitest";
import { companyName, parseCensus } from "./census.js";
import { createDiscordApi, fetchDiscord, type DiscordApi } from "./discord.js";
import { fetchGithub, fetchProfiles, listRepositories, type GhApi } from "./github.js";
import { lastScheduledRun, missedScheduledRun } from "./schedule.js";

const GUILD = "100";

describe("GitHub", () => {
  it("lists public, non-fork repositories for owner/*", async () => {
    const api: GhApi = async path => {
      expect(path).toBe("orgs/example/repos?type=public&per_page=100&page=1");
      return [{ full_name: "example/app" }, { full_name: "example/fork", fork: true }];
    };
    expect(await listRepositories(api, "example/*, other/tool")).toEqual(["example/app", "other/tool"]);
  });

  it("reads issues and PRs incrementally and records merged PRs", async () => {
    const calls: string[] = [];
    const api: GhApi = async path => {
      calls.push(path);
      return [
        { html_url: "https://github.com/example/app/issues/1", title: "Bug", created_at: "2026-01-01T10:00:00Z", updated_at: "2026-01-02T00:00:00Z", state: "closed", user: { login: "OctoCat" } },
        { html_url: "https://github.com/example/app/pull/2", title: "Fix", created_at: "2026-01-02T10:00:00Z", updated_at: "2026-01-03T00:00:00Z", state: "closed", user: { login: "octocat" }, pull_request: { merged_at: "2026-01-03T00:00:00Z" } },
      ];
    };
    const cursor = await fetchGithub(api, ["example/app"], { repos: { "example/app": "2026-01-01T00:00:00Z" }, items: { old: ["Old", "2025-01-01", "open", "i", "x"] } });
    expect(calls[0]).toContain("since=2026-01-01T00%3A00%3A00Z");
    expect(cursor.repos["example/app"]).toBe("2026-01-03T00:00:00Z");
    expect(cursor.items).toEqual({
      old: ["Old", "2025-01-01", "open", "i", "x"],
      "https://github.com/example/app/issues/1": ["Bug", "2026-01-01", "closed", "i", "octocat"],
      "https://github.com/example/app/pull/2": ["Fix", "2026-01-02", "merged", "p", "octocat"],
    });
  });

  it("follows pages until a short page", async () => {
    const full = Array.from({ length: 100 }, (_, n) => ({ html_url: `https://github.com/example/app/issues/${n}`, created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z", state: "open", user: { login: "a" } }));
    const api = vi.fn<GhApi>(async path => (path.endsWith("&page=1") ? full : []));
    const cursor = await fetchGithub(api, ["example/app"], undefined);
    expect(api).toHaveBeenCalledTimes(2);
    expect(Object.keys(cursor.items)).toHaveLength(100);
  });
});

describe("GitHub profiles", () => {
  const profile = (company: string | null, fetchedAt: string) => ({ company, name: null, fetchedAt });

  it("records the project's own team from author associations and keeps cached profiles", async () => {
    const api: GhApi = async () => [
      { html_url: "https://github.com/example/app/issues/1", created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z", state: "open", user: { login: "Maint" }, author_association: "MEMBER" },
      { html_url: "https://github.com/example/app/issues/2", created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z", state: "open", user: { login: "octocat" }, author_association: "CONTRIBUTOR" },
    ];
    const profiles = { octocat: profile("@acme", "2026-01-01T00:00:00Z") };
    const cursor = await fetchGithub(api, ["example/app"], { repos: {}, items: {}, team: ["owner"], profiles });
    expect(cursor.team).toEqual(["maint", "owner"]);
    expect(cursor.profiles).toEqual(profiles);
  });

  it("reads each profile once, again after 30 days, and skips ones it can't read", async () => {
    const calls: string[] = [];
    const api: GhApi = async path => {
      calls.push(path);
      if (path === "users/ghost") throw new Error("GitHub request failed (users/ghost): Not Found");
      return { login: path.slice(6), company: " @Acme ", name: path === "users/monalisa" ? "Mona Lisa" : "" };
    };
    const cursor = { repos: {}, items: {}, profiles: { stale: profile(null, "2025-11-01T00:00:00Z"), fresh: profile("Globex", "2025-12-20T00:00:00Z") } };
    const now = new Date("2026-01-04T00:00:00Z");
    const first = await fetchProfiles(api, ["MonaLisa", "monalisa", "stale", "fresh", "ghost"], cursor, now);
    expect(calls).toEqual(["users/monalisa", "users/stale", "users/ghost"]);
    expect(first.profiles).toEqual({
      monalisa: { company: "@Acme", name: "Mona Lisa", fetchedAt: now.toISOString() },
      stale: { company: "@Acme", name: null, fetchedAt: now.toISOString() },
      fresh: profile("Globex", "2025-12-20T00:00:00Z"),
    });
    calls.length = 0;
    await fetchProfiles(api, ["monalisa", "stale", "fresh"], first, new Date("2026-01-05T00:00:00Z"));
    expect(calls).toEqual([]);
  });
});

function fakeDiscord(messages: Record<string, { id: string; type?: number; username: string; bot?: boolean; content?: string; day: string }[]>, options: { archived?: Record<string, unknown[]>; active?: unknown[] } = {}): DiscordApi & { routes: string[] } {
  const routes: string[] = [];
  const api = async (route: string) => {
    routes.push(route);
    if (route === `/guilds/${GUILD}`) return { roles: [{ id: GUILD, permissions: String(1n << 10n) }] };
    if (route === `/guilds/${GUILD}/channels`) return [
      { id: "general", type: 0 },
      { id: "help", type: 15 },
      { id: "staff", type: 0, permission_overwrites: [{ id: GUILD, type: 0, deny: String(1n << 10n) }] },
    ];
    if (route === `/guilds/${GUILD}/threads/active`) return { threads: options.active ?? [] };
    const archived = /^\/channels\/(\w+)\/threads\/archived\/public/.exec(route);
    if (archived) return { threads: options.archived?.[archived[1]!] ?? [], has_more: false };
    const read = /^\/channels\/([\w-]+)\/messages\?limit=100&after=(\d+)$/.exec(route);
    if (read) {
      const after = BigInt(read[2]!);
      return (messages[read[1]!] ?? []).filter(item => BigInt(item.id) > after).reverse().map(item => ({
        id: item.id, type: item.type ?? 0, timestamp: `${item.day}T12:00:00.000Z`, content: item.content ?? "hi",
        author: { username: item.username, bot: item.bot ?? false },
      }));
    }
    throw new Error("unexpected route " + route);
  };
  return Object.assign(api, { routes });
}

describe("Discord", () => {
  it("counts public messages and forum posts, skipping bots, system messages and private channels", async () => {
    const api = fakeDiscord({
      general: [
        { id: "1", username: "Octo.Cat", day: "2026-01-01", content: "first" },
        { id: "2", username: "hubot", bot: true, day: "2026-01-01" },
        { id: "3", username: "octo.cat", type: 7, day: "2026-01-01" },
      ],
      "post-1": [{ id: "5", username: "octo.cat", day: "2026-01-03", content: "a  forum\npost" }],
      staff: [{ id: "4", username: "octo.cat", day: "2026-01-02" }],
    }, { archived: { help: [{ id: "post-1", type: 11, parent_id: "help", thread_metadata: { archive_timestamp: "2026-01-03T00:00:00Z" } }] } });
    const { cursor, failures } = await fetchDiscord(api, GUILD, undefined, new Date("2026-01-04T00:00:00Z"));
    expect(failures).toEqual([]);
    expect(api.routes.some(route => route.startsWith("/channels/staff/"))).toBe(false);
    expect(cursor.authors).toEqual({
      "octo.cat": {
        m: 2, f: "2026-01-01", l: "2026-01-03", u: `https://discord.com/channels/${GUILD}/post-1/5`,
        recent: [
          { id: "5", url: `https://discord.com/channels/${GUILD}/post-1/5`, date: "2026-01-03", snippet: "a forum post" },
          { id: "1", url: `https://discord.com/channels/${GUILD}/general/1`, date: "2026-01-01", snippet: "first" },
        ],
      },
    });
    expect(cursor.channels).toEqual({ general: "3", "post-1": "5" });
    expect(cursor.threadsCheckedAt).toBe("2026-01-04T00:00:00.000Z");
  });

  it("only reads new messages on the next run, including active threads", async () => {
    const history = { general: [{ id: "1", username: "octo.cat", day: "2026-01-01" }] } as Parameters<typeof fakeDiscord>[0];
    const first = await fetchDiscord(fakeDiscord(history), GUILD, undefined, new Date("2026-01-02T00:00:00Z"));
    history.general!.push({ id: "7", username: "octo.cat", day: "2026-01-05" });
    history["thread-9"] = [{ id: "8", username: "mona.l", day: "2026-01-05" }];
    const api = fakeDiscord(history, {
      active: [{ id: "thread-9", type: 11, parent_id: "general" }],
      archived: { help: [{ id: "old-thread", type: 11, parent_id: "help", thread_metadata: { archive_timestamp: "2026-01-01T00:00:00Z" } }] },
    });
    const second = await fetchDiscord(api, GUILD, first.cursor, new Date("2026-01-06T00:00:00Z"));
    expect(second.cursor.authors["octo.cat"]?.m).toBe(2);
    expect(second.cursor.authors["mona.l"]?.m).toBe(1);
    expect(api.routes).toContain("/channels/general/messages?limit=100&after=1");
    expect(api.routes.some(route => route.startsWith("/channels/old-thread/"))).toBe(false);
  });

  it("leaves a channel's cursor alone when it can't be read", async () => {
    const base = fakeDiscord({ general: [{ id: "1", username: "octo.cat", day: "2026-01-01" }] });
    const api: DiscordApi = async route => { if (route.startsWith("/channels/general/messages")) throw new Error("Discord 403"); return base(route); };
    const { cursor, failures } = await fetchDiscord(api, GUILD, undefined, new Date("2026-01-04T00:00:00Z"));
    expect(failures).toEqual(["general"]);
    expect(cursor.channels).toEqual({});
    expect(cursor.threadsCheckedAt).toBeNull();
  });

  it("never puts the token in errors", async () => {
    const fetchImpl = vi.fn(async () => new Response("nope", { status: 403 }));
    const api = createDiscordApi("secret-token-value", fetchImpl as unknown as typeof fetch);
    await expect(api(`/guilds/${GUILD}`)).rejects.toThrow(/^Discord 403 for \/guilds\/100$/);
    const unauthorized = createDiscordApi("secret-token-value", (async () => new Response("", { status: 401 })) as unknown as typeof fetch);
    await expect(unauthorized("/x")).rejects.not.toThrow(/secret-token-value/);
  });
});

describe("census", () => {
  const note = [
    "# Workplaces",
    "",
    "| Person / handles | Activity | Persona | Employer | Role | Size | Method | Confidence |",
    "| --- | --- | --- | --- | --- | --- | --- | --- |",
    "| Mona Lisa; [GH: monalisa](https://github.example/monalisa); D: mona.l | 5 | Eng | [Globex](https://globex.example) | Designer | 11–50 | web | High |",
    "| [GH: octocat](https://github.example/octocat) | 3 | Eng | Self-employed / Initech (contract) | Engineer | unknown | web | Medium |",
    "| Hu Bot; GH: unlinked; D: hubot | 1 | Other | Unknown | Unknown | unknown | web | Low |",
    "| No handles | 1 | Other | Acme | Engineer | 1 | web | Low |",
    "",
    "| Person / handles | Current workplace |",
    "| --- | --- |",
    "| Skip; GH: skipme | Acme |",
  ].join("\n");

  it("reads people, handles and employers from tables with an Employer column", () => {
    expect(parseCensus(note)).toEqual([
      { name: "Mona Lisa", gh: "monalisa", dh: "mona.l", company: "Globex", role: "Designer" },
      { name: "octocat", gh: "octocat", dh: null, company: "Initech", role: "Engineer" },
      { name: "Hu Bot", gh: null, dh: "hubot", company: null, role: "Unknown" },
    ]);
  });

  it("treats unknown and self-employment as no company", () => {
    expect(companyName("—")).toBeNull();
    expect(companyName("[Independent contractor](https://x.example)")).toBeNull();
    expect(companyName("Globex / self-employed")).toBe("Globex");
  });
});

describe("schedule", () => {
  it("finds the most recent 6:00 run", () => {
    expect(lastScheduledRun(new Date(2026, 0, 4, 5, 59)).getTime()).toBe(new Date(2026, 0, 3, 6, 0).getTime());
    expect(lastScheduledRun(new Date(2026, 0, 4, 6, 0)).getTime()).toBe(new Date(2026, 0, 4, 6, 0).getTime());
  });

  it("catches up only when the saved table predates the last run", () => {
    const now = new Date(2026, 0, 4, 9, 0);
    expect(missedScheduledRun(new Date(2026, 0, 4, 6, 1).toISOString(), now)).toBe(false);
    expect(missedScheduledRun(new Date(2026, 0, 3, 23, 0).toISOString(), now)).toBe(true);
  });
});
