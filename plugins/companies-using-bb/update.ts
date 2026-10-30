import type { CensusEntry } from "./census.js";
import type { DiscordCursor } from "./discord.js";
import type { GithubCursor } from "./github.js";
import type { Item, Person, Row, Snapshot } from "./model.js";

export interface Sources {
  github: GithubCursor;
  /** Null when Discord couldn't be read: Discord values keep their last values. */
  discord: DiscordCursor | null;
  /** Null when the census couldn't be read: no people are added. */
  census: CensusEntry[] | null;
}

const byNewest = (left: Item, right: Item) => right[1].localeCompare(left[1]) || right[3].localeCompare(left[3]);
const companyKey = (name: string) => name.toLowerCase().replace(/\s*\([^)]*\)/g, "")
  .replace(/,?\s+(gmbh|inc\.?|ltd\.?|limited|llc|ag|b\.v\.|pty ltd|co\.)$/i, "").replace(/[^\p{L}\p{N}]+/gu, "");

/** Issues and PRs each GitHub login opened, from the cached items. */
function authored(github: GithubCursor) {
  const byLogin = new Map<string, { issues: Item[]; prs: Item[] }>();
  for (const [url, [title, date, state, kind, login]] of Object.entries(github.items)) {
    if (!login) continue;
    let entry = byLogin.get(login);
    if (!entry) byLogin.set(login, entry = { issues: [], prs: [] });
    (kind === "p" ? entry.prs : entry.issues).push([title, date, state, url]);
  }
  return byLogin;
}

/** Existing items keep their place; fetched items add to them and update their title and state. */
function mergeItems(existing: Item[], fetched: Item[]): Item[] {
  const byUrl = new Map(existing.map(item => [item[3], item] as const));
  for (const item of fetched) byUrl.set(item[3], item);
  return [...byUrl.values()].sort(byNewest);
}

function applyGithub(person: Person, mine: { issues: Item[]; prs: Item[] } | undefined) {
  if (!mine) return;
  person.il = mergeItems(person.il, mine.issues);
  person.pl = mergeItems(person.pl, mine.prs);
}

function applyDiscord(person: Person, discord: DiscordCursor | null) {
  const author = discord && person.dh ? discord.authors[person.dh.toLowerCase()] : undefined;
  if (!author) return;
  person.d = true;
  person.dd = { ...(person.dd ?? {}), m: author.m, f: author.f, l: author.l, u: author.u };
  person.dm = author.recent.map(({ url, date, snippet }) => ({ url, date, snippet }));
}

/** Per-person and per-row counts follow the lists, as on the page. */
export function recount(rows: Row[]): void {
  for (const row of rows) {
    for (const person of row.ppl) {
      person.i = person.il.length;
      person.p = person.pl.length;
      person.iu = person.il[0]?.[3] ?? "";
      person.pu = person.pl[0]?.[3] ?? "";
    }
    row.iss = row.ppl.reduce((sum, person) => sum + person.il.length, 0);
    row.prs = row.ppl.reduce((sum, person) => sum + person.pl.length, 0);
    row.dis = row.ppl.reduce((sum, person) => sum + (person.d ? person.dd?.m ?? 0 : 0), 0);
    row.n = row.ppl.length;
  }
}

/**
 * Keys a GitHub profile's company field can match: the whole field without a leading "@",
 * and each "@org" it names ("@acme, @globex" names two).
 */
function profileKeys(company: string): string[] {
  const keys = [companyKey(company.replace(/^@/, "")), ...[...company.matchAll(/@([A-Za-z0-9-]+)/g)].map(match => companyKey(match[1]!))];
  return [...new Set(keys.filter(Boolean))];
}

/**
 * GitHub authors with activity whom nobody has placed: not in the table, not in the census
 * (the census decides for everyone it lists, even with no company), not recorded as reviewed
 * on the first update, not the project's own team, and not bots. Empty when the census
 * couldn't be read, since then nobody can tell whether the census would place them.
 */
export function profileCandidates(rows: Row[], github: GithubCursor, census: CensusEntry[] | null, reviewed: string[] | undefined): string[] {
  if (!census) return [];
  const skip = new Set([
    ...rows.flatMap(row => row.ppl.map(person => person.gh.toLowerCase())),
    ...census.flatMap(entry => (entry.gh ? [entry.gh.toLowerCase()] : [])),
    ...(reviewed ?? []).filter(key => key.startsWith("gh:")).map(key => key.slice(3)),
    ...(github.team ?? []),
  ]);
  return [...authored(github).keys()].filter(login => !skip.has(login) && !login.endsWith("[bot]")).sort();
}

/** Company name keys and the "@org" keys existing members list on their profiles, each mapped to its row. */
function companyIndex(rows: Row[], profiles: GithubCursor["profiles"]) {
  const names = new Map<string, Row>();
  for (const row of rows) for (const name of [row.full, row.c]) if (name) names.set(companyKey(name), row);
  const orgs = new Map<string, Row | null>();
  for (const row of rows) {
    for (const person of row.ppl) {
      const company = person.gh ? profiles?.[person.gh.toLowerCase()]?.company : null;
      for (const match of company?.matchAll(/@([A-Za-z0-9-]+)/g) ?? []) {
        const key = companyKey(match[1]!);
        if (!key || names.has(key)) continue;
        // An org two rows' members both list says nothing about which row it is.
        orgs.set(key, orgs.has(key) && orgs.get(key) !== row ? null : row);
      }
    }
  }
  return (company: string): Row | undefined => {
    const matches = new Set(profileKeys(company).map(key => names.get(key) ?? orgs.get(key)).filter((row): row is Row => Boolean(row)));
    return matches.size === 1 ? [...matches][0] : undefined;
  };
}

/**
 * Reads the profiles that placing new authors needs: the candidates', then, only when one
 * names a company no row is called, the existing members' too, for the "@org" they list.
 */
export async function readProfiles(previous: Snapshot, github: GithubCursor, census: CensusEntry[] | null, load: (logins: string[], cursor: GithubCursor) => Promise<GithubCursor>): Promise<GithubCursor> {
  const candidates = profileCandidates(previous.rows, github, census, previous.cursors?.census?.reviewed);
  if (!candidates.length) return github;
  const next = await load(candidates, github);
  const byName = companyIndex(previous.rows, {});
  const unnamed = candidates.some(login => {
    const company = next.profiles?.[login]?.company;
    return company && !byName(company);
  });
  if (!unnamed) return next;
  return load(previous.rows.flatMap(row => row.ppl.map(person => person.gh).filter(Boolean)), next);
}

const censusKeys = (entry: CensusEntry) => [entry.gh && `gh:${entry.gh.toLowerCase()}`, entry.dh && `d:${entry.dh.toLowerCase()}`].filter((key): key is string => Boolean(key));

function newRow(company: string): Row {
  return {
    c: company, full: company, url: "", site: false, seg: "Size unknown", pr: "—", emp: 0, size: "—", src: "",
    country: "", region: "", unv: false, comp: false, iss: 0, prs: 0, dis: 0, slack: false, n: 0, ppl: [],
  };
}

/**
 * Builds the next snapshot from the saved one. Counts and lists come from the sources;
 * research fields (country, employees, plan) and Slack Connect keep their saved values.
 * People the census maps to a company are added once they show activity, unless they
 * already had activity when the table was first updated (the table's authors chose them).
 */
export function buildSnapshot(previous: Snapshot, sources: Sources, now: Date): Snapshot {
  const rows = structuredClone(previous.rows);
  const mine = authored(sources.github);
  const known = new Set<string>();
  for (const row of rows) {
    for (const person of row.ppl) {
      if (person.gh) known.add(`gh:${person.gh.toLowerCase()}`);
      if (person.dh) known.add(`d:${person.dh.toLowerCase()}`);
      if (person.gh) applyGithub(person, mine.get(person.gh.toLowerCase()));
      applyDiscord(person, sources.discord);
    }
  }

  let reviewed = previous.cursors?.census?.reviewed;
  if (sources.census) {
    const activity = (entry: CensusEntry) => (entry.gh ? (mine.get(entry.gh.toLowerCase())?.issues.length ?? 0) + (mine.get(entry.gh.toLowerCase())?.prs.length ?? 0) : 0)
      + (entry.dh ? sources.discord?.authors[entry.dh.toLowerCase()]?.m ?? 0 : 0);
    const candidates = sources.census.filter(entry => entry.company && !censusKeys(entry).some(key => known.has(key)) && activity(entry) > 0);
    if (!reviewed) {
      reviewed = [...new Set(candidates.flatMap(censusKeys))].sort();
    } else {
      const skip = new Set(reviewed);
      const byCompany = new Map<string, Row>();
      for (const row of rows) for (const name of [row.full, row.c]) if (name) byCompany.set(companyKey(name), row);
      for (const entry of candidates) {
        const keys = censusKeys(entry);
        if (keys.some(key => skip.has(key) || known.has(key))) continue;
        const company = entry.company!;
        let row = byCompany.get(companyKey(company));
        if (!row) {
          row = newRow(company);
          rows.push(row);
          byCompany.set(companyKey(company), row);
        }
        const person: Person = {
          n: entry.name, gh: entry.gh ?? "", li: "", d: false, role: entry.role, champ: false, sl: false,
          i: 0, iu: "", p: 0, pu: "", il: [], pl: [], dd: null, dm: [], dh: entry.dh,
        };
        if (entry.gh) applyGithub(person, mine.get(entry.gh.toLowerCase()));
        applyDiscord(person, sources.discord);
        row.ppl.push(person);
        for (const key of keys) known.add(key);
      }
    }
  }

  if (sources.census) {
    // A profile only places someone at a company already in the table; new companies come
    // from the census alone. People recorded as reviewed on the first update stay out even
    // when their profile now names a company: the table's authors already chose to leave
    // them out, and a profile field is weaker evidence than that choice.
    const rowFor = companyIndex(rows, sources.github.profiles);
    for (const login of profileCandidates(rows, sources.github, sources.census, reviewed)) {
      const profile = sources.github.profiles?.[login];
      const row = profile?.company ? rowFor(profile.company) : undefined;
      if (!row) continue;
      const person: Person = {
        n: profile!.name ?? login, gh: login, li: "", d: false, role: "", champ: false, sl: false,
        i: 0, iu: "", p: 0, pu: "", il: [], pl: [], dd: null, dm: [], dh: null,
      };
      applyGithub(person, mine.get(login));
      row.ppl.push(person);
    }
  }

  recount(rows);
  return {
    version: 1,
    updatedAt: now.toISOString(),
    rows,
    cursors: {
      github: sources.github,
      ...(sources.discord ?? previous.cursors?.discord ? { discord: sources.discord ?? previous.cursors!.discord! } : {}),
      ...(reviewed ? { census: { reviewed } } : {}),
    },
  };
}
