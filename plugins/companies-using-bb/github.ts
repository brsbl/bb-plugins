import { execFile } from "node:child_process";
import type { Cursors, GithubItem, GithubProfile } from "./model.js";

export type GithubCursor = NonNullable<Cursors["github"]>;
/** Runs `gh api <path>` and returns its JSON output. */
export type GhApi = (path: string, signal?: AbortSignal) => Promise<unknown>;

const PER_PAGE = 100;
/** A cached profile is read again after this long. */
export const PROFILE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
/** Author associations that mark the project's own team. */
const TEAM = new Set(["OWNER", "MEMBER"]);

export const ghApi: GhApi = (path, signal) => new Promise((resolve, reject) => {
  execFile("gh", ["api", "-X", "GET", path], {
    encoding: "utf8", timeout: 60_000, maxBuffer: 32 * 1024 * 1024, signal,
    env: { ...process.env, GH_PROMPT_DISABLED: "1", GH_HOST: "github.com" },
  }, (error, stdout, stderr) => {
    if (error) {
      const detail = (stderr || error.message).trim().split("\n")[0]?.slice(0, 200);
      reject(new Error(`GitHub request failed (${path.split("?")[0]}): ${detail}`));
      return;
    }
    try { resolve(JSON.parse(stdout)); } catch { reject(new Error(`GitHub returned unreadable data for ${path.split("?")[0]}`)); }
  });
});

type RepoJson = { full_name?: string; fork?: boolean };
type IssueJson = {
  html_url?: string; title?: string; created_at?: string; updated_at?: string; state?: string; author_association?: string;
  user?: { login?: string } | null; pull_request?: { merged_at?: string | null } | null;
};

/** Expands `owner/name` and `owner/*` (every public, non-fork repository of the owner). */
export async function listRepositories(api: GhApi, spec: string, signal?: AbortSignal): Promise<string[]> {
  const repos = new Set<string>();
  for (const entry of spec.split(",").map(value => value.trim()).filter(Boolean)) {
    const [owner, name] = entry.split("/");
    if (!owner || !name) throw new Error(`GitHub repository "${entry}" must look like owner/name or owner/*`);
    if (name !== "*") { repos.add(`${owner}/${name}`); continue; }
    for (let page = 1; ; page++) {
      const result = await api(`orgs/${owner}/repos?type=public&per_page=${PER_PAGE}&page=${page}`, signal);
      if (!Array.isArray(result)) throw new Error(`GitHub returned no repository list for ${owner}`);
      for (const repo of result as RepoJson[]) if (repo.full_name && !repo.fork) repos.add(repo.full_name);
      if (result.length < PER_PAGE) break;
    }
  }
  return [...repos].sort();
}

function toItem(issue: IssueJson): [string, GithubItem] | null {
  if (!issue.html_url || !issue.created_at) return null;
  const isPr = Boolean(issue.pull_request);
  const state = isPr && issue.pull_request?.merged_at ? "merged" : issue.state ?? "";
  return [issue.html_url, [issue.title ?? "", issue.created_at.slice(0, 10), state, isPr ? "p" : "i", (issue.user?.login ?? "").toLowerCase()]];
}

/**
 * Reads every issue and PR updated since the last run (everything on the first run) and
 * returns the merged cursor. Throws on any GitHub failure; the caller keeps the old cursor.
 */
export async function fetchGithub(api: GhApi, repos: string[], previous: GithubCursor | undefined, signal?: AbortSignal): Promise<GithubCursor> {
  const next: GithubCursor = { ...previous, repos: { ...previous?.repos }, items: { ...previous?.items } };
  const team = new Set(previous?.team);
  for (const repo of repos) {
    const since = next.repos[repo];
    let newest = since ?? "";
    for (let page = 1; ; page++) {
      signal?.throwIfAborted();
      const query = `state=all&sort=updated&direction=asc&per_page=${PER_PAGE}&page=${page}` + (since ? `&since=${encodeURIComponent(since)}` : "");
      const result = await api(`repos/${repo}/issues?${query}`, signal);
      if (!Array.isArray(result)) throw new Error(`GitHub returned no issue list for ${repo}`);
      for (const issue of result as IssueJson[]) {
        const entry = toItem(issue);
        if (entry) next.items[entry[0]] = entry[1];
        if (entry?.[1][4] && TEAM.has(issue.author_association ?? "")) team.add(entry[1][4]);
        if (issue.updated_at && issue.updated_at > newest) newest = issue.updated_at;
      }
      if (result.length < PER_PAGE) break;
    }
    if (newest) next.repos[repo] = newest;
  }
  if (team.size) next.team = [...team].sort();
  return next;
}

type UserJson = { login?: string; company?: string | null; name?: string | null };

/**
 * Reads the public profile of each login whose cached profile is missing or older than
 * 30 days. A profile that can't be read keeps its cached value and is tried again next run.
 */
export async function fetchProfiles(api: GhApi, logins: string[], cursor: GithubCursor, now: Date, signal?: AbortSignal): Promise<GithubCursor> {
  const profiles: Record<string, GithubProfile> = { ...cursor.profiles };
  for (const login of new Set(logins.map(value => value.toLowerCase()))) {
    const cached = profiles[login];
    if (cached && now.getTime() - Date.parse(cached.fetchedAt) < PROFILE_MAX_AGE_MS) continue;
    signal?.throwIfAborted();
    try {
      const user = await api(`users/${encodeURIComponent(login)}`, signal) as UserJson;
      profiles[login] = { company: user?.company?.trim() || null, name: user?.name?.trim() || null, fetchedAt: now.toISOString() };
    } catch (error) {
      if (signal?.aborted) throw error;
    }
  }
  return { ...cursor, profiles };
}
