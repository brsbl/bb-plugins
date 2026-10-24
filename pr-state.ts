import { z } from "zod";

export const PR_STATES = ["open", "draft", "merged", "closed"] as const;
export type PrState = (typeof PR_STATES)[number];
export type PullRequestRef = { owner: string; repo: string; number: number };

const NAME = /^[A-Za-z0-9_.-]{1,100}$/;

/** The GitHub pull request a pinned URL points at (any tab, such as /files), or null for every other URL. */
export function githubPullRequest(href: string): PullRequestRef | null {
  let url: URL;
  try { url = new URL(href); } catch { return null; }
  if (url.protocol !== "https:" || !/^(?:www\.)?github\.com$/i.test(url.hostname) || url.port) return null;
  const [owner, repo, kind, number] = url.pathname.split("/").filter(Boolean);
  if (kind !== "pull" || !owner || !repo || !NAME.test(owner) || !NAME.test(repo) || !/^[1-9]\d{0,9}$/.test(number ?? "")) return null;
  return { owner, repo, number: Number(number) };
}

export const prKey = ({ owner, repo, number }: PullRequestRef) => `${owner}/${repo}#${number}`.toLowerCase();

// Open and draft PRs change often, a closed one is rarely reopened, and a merge is final.
const FRESH_MS = { open: 10 * 60_000, draft: 10 * 60_000, closed: 60 * 60_000, unknown: 60 * 60_000 } as const;
export const isFresh = (entry: { state: PrState | null; checkedAt: number }, now: number) =>
  entry.state === "merged" || now - entry.checkedAt < FRESH_MS[entry.state ?? "unknown"];

const pullSchema = z.object({ state: z.enum(["open", "closed"]), draft: z.boolean().optional(), merged_at: z.string().nullable().optional() });

/** GitHub refused for its rate limit; no request should be sent before `resetAt`. */
export class GitHubRateLimited extends Error {
  constructor(readonly resetAt: number) { super("GitHub's rate limit is used up"); }
}

/** GitHub's public pulls API, without credentials: null when the PR is missing or private, and a throw when GitHub can't answer now. */
export async function fetchPrState({ owner, repo, number }: PullRequestRef, fetcher: typeof fetch = fetch): Promise<PrState | null> {
  const response = await fetcher(`https://api.github.com/repos/${owner}/${repo}/pulls/${number}`, {
    headers: { accept: "application/vnd.github+json", "user-agent": "bb-plugin-file-pins", "x-github-api-version": "2022-11-28" },
    redirect: "follow",
    signal: AbortSignal.timeout(8_000),
  });
  if (response.status === 404) return null;
  if ((response.status === 403 || response.status === 429) && (response.headers.get("x-ratelimit-remaining") === "0" || response.headers.has("retry-after"))) {
    const retry = Number(response.headers.get("retry-after"));
    const reset = Number(response.headers.get("x-ratelimit-reset"));
    throw new GitHubRateLimited(retry > 0 ? Date.now() + retry * 1000 : reset > 0 ? reset * 1000 : Date.now() + 60_000);
  }
  if (!response.ok) throw new Error(`GitHub answered ${response.status}`);
  const pull = pullSchema.parse(await response.json());
  if (pull.merged_at) return "merged";
  if (pull.state === "closed") return "closed";
  return pull.draft ? "draft" : "open";
}
