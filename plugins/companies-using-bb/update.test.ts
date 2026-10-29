import { describe, expect, it } from "vitest";
import { census, github, person, row, snapshot } from "./fixtures.js";
import type { DiscordCursor } from "./discord.js";
import type { GithubCursor } from "./github.js";
import type { GithubItem, Snapshot } from "./model.js";
import { buildSnapshot, readProfiles } from "./update.js";

const NOW = new Date("2026-01-04T06:00:00.000Z");
const issue = (n: number, login: string, date = "2026-01-03", state = "open"): [string, GithubItem] =>
  [`https://github.com/example/app/issues/${n}`, [`Issue ${n}`, date, state, "i", login]];
const pr = (n: number, login: string, date = "2026-01-03", state = "merged"): [string, GithubItem] =>
  [`https://github.com/example/app/pull/${n}`, [`PR ${n}`, date, state, "p", login]];
const discord = (authors: DiscordCursor["authors"]): DiscordCursor => ({ channels: {}, threadsCheckedAt: null, authors });
const author = (m: number) => ({ m, f: "2026-01-01", l: "2026-01-03", u: "https://discord.example/c/3", recent: [{ id: "3", url: "https://discord.example/c/3", date: "2026-01-03", snippet: "Hello" }] });

describe("buildSnapshot", () => {
  it("updates counts and keeps research and Slack Connect fields", () => {
    const slackPerson = person({ n: "Hub Bot", gh: "", sl: true });
    const previous = snapshot([row({
      seg: "Enterprise", pr: 7, emp: 4200, size: "1K–5K", country: "Japan", region: "Asia", src: "https://source.example",
      slack: true, slack_ch: "acme-shared", slack_url: "https://slack.example/acme",
      ppl: [person({ dh: "octo.cat" }), slackPerson],
    })]);
    const next = buildSnapshot(previous, {
      github: github(Object.fromEntries([issue(1, "octocat"), pr(2, "octocat")])),
      discord: discord({ "octo.cat": author(5) }),
      census: null,
    }, NOW);
    const updated = next.rows[0]!;
    expect(updated).toMatchObject({
      seg: "Enterprise", pr: 7, emp: 4200, size: "1K–5K", country: "Japan", region: "Asia", src: "https://source.example",
      slack: true, slack_ch: "acme-shared", slack_url: "https://slack.example/acme",
      iss: 1, prs: 1, dis: 5, n: 2,
    });
    expect(updated.ppl[0]).toMatchObject({ i: 1, p: 1, d: true, dd: { m: 5, l: "2026-01-03" }, dm: [{ snippet: "Hello" }] });
    expect(updated.ppl[1]).toEqual(slackPerson);
    expect(next.updatedAt).toBe(NOW.toISOString());
  });

  it("recomputes totals from the people's lists", () => {
    const previous = snapshot([row({ iss: 9, prs: 9, dis: 99, n: 9, ppl: [
      person({ il: [["Old", "2025-12-01", "closed", "https://github.com/example/app/issues/1"]], d: true, dd: { m: 4 } }),
      person({ n: "Hu Bot", gh: "hubot", d: false, dd: { m: 50 } }),
    ] })]);
    const next = buildSnapshot(previous, { github: github(Object.fromEntries([issue(3, "hubot"), pr(4, "hubot")])), discord: null, census: null }, NOW);
    expect(next.rows[0]).toMatchObject({ iss: 2, prs: 1, dis: 4, n: 2 });
    expect(next.rows[0]!.ppl[1]).toMatchObject({ i: 1, iu: "https://github.com/example/app/issues/3", p: 1, pu: "https://github.com/example/app/pull/4" });
  });

  it("merges issues by URL, keeping saved ones and updating state", () => {
    const previous = snapshot([row({ ppl: [person({ il: [
      ["Kept", "2025-11-01", "open", "https://github.com/example/other/issues/8"],
      ["Issue 1", "2026-01-01", "open", "https://github.com/example/app/issues/1"],
    ] })] })]);
    const next = buildSnapshot(previous, { github: github(Object.fromEntries([issue(1, "octocat", "2026-01-01", "closed")])), discord: null, census: null }, NOW);
    expect(next.rows[0]!.ppl[0]!.il).toEqual([
      ["Issue 1", "2026-01-01", "closed", "https://github.com/example/app/issues/1"],
      ["Kept", "2025-11-01", "open", "https://github.com/example/other/issues/8"],
    ]);
  });

  it("keeps Discord values when Discord couldn't be read", () => {
    const previous = snapshot([row({ ppl: [person({ dh: "octo.cat", d: true, dd: { m: 12, f: "2025-10-01", l: "2025-12-01", u: "u" } })] })]);
    const next = buildSnapshot(previous, { github: github(), discord: null, census: null }, NOW);
    expect(next.rows[0]!.ppl[0]!.dd).toEqual({ m: 12, f: "2025-10-01", l: "2025-12-01", u: "u" });
    expect(next.rows[0]!.dis).toBe(12);
  });

  it("adds a new census-mapped author at a new company as a new row", () => {
    const previous = snapshot([row()], { cursors: { census: { reviewed: [] } } });
    const next = buildSnapshot(previous, {
      github: github(Object.fromEntries([issue(5, "monalisa")])),
      discord: null,
      census: census([{ name: "Mona Lisa", gh: "monalisa", company: "Globex", role: "Designer" }]),
    }, NOW);
    expect(next.rows).toHaveLength(2);
    expect(next.rows[1]).toMatchObject({
      c: "Globex", url: "", site: false, seg: "Size unknown", pr: "—", emp: 0, country: "", slack: false, iss: 1, prs: 0, n: 1,
      ppl: [{ n: "Mona Lisa", gh: "monalisa", role: "Designer", i: 1 }],
    });
  });

  it("adds a census-mapped author to an existing company row", () => {
    const previous = snapshot([row()], { cursors: { census: { reviewed: [] } } });
    const next = buildSnapshot(previous, {
      github: github(),
      discord: discord({ "mona.l": author(3) }),
      census: census([{ name: "Mona", dh: "mona.l", company: "ACME Inc." }]),
    }, NOW);
    expect(next.rows).toHaveLength(1);
    expect(next.rows[0]).toMatchObject({ n: 2, dis: 3, emp: 120 });
    expect(next.rows[0]!.ppl[1]).toMatchObject({ n: "Mona", dh: "mona.l", d: true, dd: { m: 3 } });
  });

  it("doesn't add people without activity, without a company, or already reviewed", () => {
    const previous = snapshot([row()], { cursors: { census: { reviewed: ["gh:skipped"] } } });
    const next = buildSnapshot(previous, {
      github: github(Object.fromEntries([issue(1, "skipped"), issue(2, "nocompany")])),
      discord: null,
      census: census([
        { gh: "skipped", company: "Initech" },
        { gh: "quiet", company: "Initech" },
        { gh: "nocompany", company: null },
      ]),
    }, NOW);
    expect(next.rows).toHaveLength(1);
  });

  it("records already-active census people on the first update instead of adding them", () => {
    const next = buildSnapshot(snapshot(), {
      github: github(Object.fromEntries([issue(1, "monalisa")])),
      discord: null,
      census: census([{ gh: "MonaLisa", dh: "mona.l", company: "Globex" }, { gh: "quiet", company: "Globex" }]),
    }, NOW);
    expect(next.rows).toHaveLength(1);
    expect(next.cursors?.census?.reviewed).toEqual(["d:mona.l", "gh:monalisa"]);
  });

  it("keeps the previous Discord cursor when Discord couldn't be read", () => {
    const saved = discord({ "octo.cat": author(2) });
    const next = buildSnapshot(snapshot([row()], { cursors: { discord: saved } }), { github: github(), discord: null, census: null }, NOW);
    expect(next.cursors?.discord).toEqual(saved);
  });
});

describe("placing new authors by GitHub profile", () => {
  const at = "2026-01-04T00:00:00.000Z";
  const profile = (company: string | null, name: string | null = null) => ({ company, name, fetchedAt: at });
  const withProfiles = (items: GithubCursor["items"], profiles: GithubCursor["profiles"], team?: string[]): GithubCursor =>
    ({ ...github(items), profiles, ...(team ? { team } : {}) });
  const reviewed = (keys: string[] = []): Partial<Snapshot> => ({ cursors: { census: { reviewed: keys } } });

  it("adds a new author whose profile company names an existing row", () => {
    const next = buildSnapshot(snapshot([row()], reviewed()), {
      github: withProfiles(Object.fromEntries([issue(1, "wile"), pr(2, "roadrunner")]), { wile: profile("@acme", "Wile E."), roadrunner: profile("ACME, Inc.") }),
      discord: null,
      census: census([]),
    }, NOW);
    expect(next.rows).toHaveLength(1);
    expect(next.rows[0]).toMatchObject({ n: 3, iss: 1, prs: 1, emp: 120, country: "Canada" });
    expect(next.rows[0]!.ppl.slice(1)).toEqual([
      expect.objectContaining({ n: "roadrunner", gh: "roadrunner", role: "", p: 1, sl: false, dh: null }),
      expect.objectContaining({ n: "Wile E.", gh: "wile", role: "", i: 1, sl: false }),
    ]);
  });

  it("matches the @org existing members list on their profiles", () => {
    const next = buildSnapshot(snapshot([row()], reviewed()), {
      github: withProfiles(Object.fromEntries([issue(1, "wile")]), { octocat: profile("@acme-labs"), wile: profile("@Acme-Labs, @other") }),
      discord: null,
      census: census([]),
    }, NOW);
    expect(next.rows[0]!.ppl.map(person => person.gh)).toEqual(["octocat", "wile"]);
  });

  it("never creates a row from a profile company that names no row", () => {
    const next = buildSnapshot(snapshot([row()], reviewed()), {
      github: withProfiles(Object.fromEntries([issue(1, "wile")]), { wile: profile("@globex") }),
      discord: null,
      census: census([]),
    }, NOW);
    expect(next.rows).toHaveLength(1);
    expect(next.rows[0]!.n).toBe(1);
  });

  it("keeps out reviewed, team, census-listed and bot logins, and everyone when the census is unreadable", () => {
    const items = Object.fromEntries([issue(1, "decided"), issue(2, "maint"), issue(3, "listed"), issue(4, "helper[bot]")]);
    const profiles = { decided: profile("@acme"), maint: profile("@acme"), listed: profile("@acme"), "helper[bot]": profile("@acme") };
    const previous = snapshot([row()], reviewed(["gh:decided"]));
    const github = withProfiles(items, profiles, ["maint"]);
    const next = buildSnapshot(previous, { github, discord: null, census: census([{ gh: "Listed", company: null }]) }, NOW);
    expect(next.rows[0]!.n).toBe(1);
    const unread = buildSnapshot(snapshot([row()], reviewed()), { github: withProfiles(Object.fromEntries([issue(1, "wile")]), { wile: profile("@acme") }), discord: null, census: null }, NOW);
    expect(unread.rows[0]!.n).toBe(1);
  });

  it("reads candidates' profiles, and members' only when a candidate names no row", async () => {
    const loads: string[][] = [];
    const load = async (logins: string[], cursor: GithubCursor) => {
      loads.push(logins);
      return { ...cursor, profiles: { ...cursor.profiles, ...Object.fromEntries(logins.map(login => [login, profile(login === "wile" ? "@acme" : "@acme-labs")])) } };
    };
    const previous = snapshot([row()], reviewed(["gh:decided"]));
    const items = Object.fromEntries([issue(1, "wile"), issue(2, "octocat"), issue(3, "decided")]);
    await readProfiles(previous, github(items), census([]), load);
    expect(loads).toEqual([["wile"]]);
    loads.length = 0;
    await readProfiles(previous, github(Object.fromEntries([issue(1, "coyote")])), census([]), load);
    expect(loads).toEqual([["coyote"], ["octocat"]]);
    loads.length = 0;
    await readProfiles(previous, github(items), null, load);
    expect(loads).toEqual([]);
  });
});
