import { z } from "zod";
import { githubPullRequest } from "./pr-state.js";
import type { ProviderRead } from "./preview-providers.js";

export const githubPreviewSchema = z.object({
  kind: z.enum(["pull-request", "issue"]), number: z.number().int().positive(),
  repository: z.string(), state: z.enum(["open", "draft", "merged", "closed"]),
  stateReason: z.string().nullable(), author: z.string().nullable(), updatedAt: z.string(),
  labels: z.array(z.string()), assignees: z.array(z.string()), comments: z.number().int().nonnegative(),
  branch: z.string().nullable(), checks: z.string().nullable(), review: z.string().nullable(), mergeability: z.string().nullable(),
});
export type GitHubPreview = z.infer<typeof githubPreviewSchema>;
export function githubReference(href: string) {
  let input: URL;
  try { input = new URL(href); } catch { return null; }
  if (input.username || input.password) return null;
  const pr = githubPullRequest(href);
  if (pr) return { ...pr, kind: "pull-request" as const };
  let url: URL;
  try { url = new URL(href); } catch { return null; }
  if (url.username || url.password) return null;
  const match = /^\/([^/]+)\/([^/]+)\/issues\/([1-9]\d{0,9})(?:\/|$)/.exec(url.pathname);
  if (!match) return null;
  const ref = githubPullRequest(`${url.origin}/${match[1]}/${match[2]}/pull/${match[3]}`);
  return ref ? { ...ref, kind: "issue" as const } : null;
}
const actor = z.object({ login: z.string() });
const itemSchema = z.object({
  number: z.number().int().positive(), title: z.string(), body: z.string().nullable().optional(),
  state: z.enum(["open", "closed"]), state_reason: z.string().nullable().optional(),
  user: actor.nullable(), updated_at: z.string(), labels: z.array(z.union([z.string(), z.object({ name: z.string() })])),
  assignees: z.array(actor), comments: z.number().int().nonnegative(),
  draft: z.boolean().optional(), merged_at: z.string().nullable().optional(), mergeable: z.boolean().nullable().optional(),
  mergeable_state: z.string().optional(), head: z.object({ ref: z.string(), sha: z.string().regex(/^[a-f0-9]{40,64}$/i) }).optional(),
  base: z.object({ ref: z.string() }).optional(), requested_reviewers: z.array(actor).optional(),
  requested_teams: z.array(z.unknown()).optional(), pull_request: z.unknown().optional(),
});
const reviewsSchema = z.array(z.object({ user: actor.nullable(), state: z.string(), submitted_at: z.string().nullable() }));
const runsSchema = z.object({ total_count: z.number(), check_runs: z.array(z.object({ status: z.string(), conclusion: z.string().nullable() })) });
const statusesSchema = z.object({ state: z.string(), total_count: z.number() });
const clean = (value: string, limit = 240) => value.replace(/\s+/g, " ").trim().slice(0, limit);
async function json(read: ProviderRead, url: string) {
  const page = await read(new URL(url));
  if (!/^application\/(?:[\w.+-]+\+)?json\b/i.test(page.contentType)) throw Error("GitHub preview is not JSON");
  return JSON.parse(page.body.toString("utf8"));
}
function reviewSummary(reviews: z.infer<typeof reviewsSchema>, requested: number): string {
  // REST provides individual reviews, not the repository's required-review decision.
  // Never call this "ready to merge": permissions and branch rules may still block it.
  if (reviews.length >= 100) return "Review status unavailable";
  const latest = new Map<string, string>();
  for (const review of reviews) if (review.user && review.submitted_at && ["APPROVED", "CHANGES_REQUESTED", "DISMISSED"].includes(review.state)) latest.set(review.user.login, review.state);
  const states = [...latest.values()];
  if (states.includes("CHANGES_REQUESTED")) return "Changes requested";
  if (requested > 0) return "Review requested";
  const approved = states.filter(s => s === "APPROVED").length;
  return approved ? `${approved} approval${approved === 1 ? "" : "s"}` : "No approvals";
}
function checkSummary(runs: z.infer<typeof runsSchema>, statuses: z.infer<typeof statusesSchema>): string {
  // Same terminal failure and neutral conclusions as pull-requests/github.ts.
  if (["failure", "error"].includes(statuses.state) || runs.check_runs.some(r => ["failure", "cancelled", "timed_out", "action_required", "stale", "startup_failure"].includes(r.conclusion ?? ""))) return "Checks failing";
  if (runs.total_count > runs.check_runs.length) return "Checks incomplete";
  if (runs.check_runs.some(r => r.status !== "completed") || (statuses.total_count > 0 && statuses.state === "pending")) return "Checks pending";
  if (runs.total_count === 0 && statuses.total_count === 0) return "No checks";
  if (runs.check_runs.some(r => !["success", "neutral", "skipped"].includes(r.conclusion ?? "")) || (statuses.total_count > 0 && statuses.state !== "success")) return "Checks unavailable";
  return "Checks passing";
}
/** Public-only GitHub facts, through the existing bounded, SSRF-safe preview transport. */
export async function githubPreview(ref: NonNullable<ReturnType<typeof githubReference>>, read: ProviderRead) {
  const root = `https://api.github.com/repos/${ref.owner}/${ref.repo}`;
  const item = itemSchema.parse(await json(read, `${root}/${ref.kind === "issue" ? "issues" : "pulls"}/${ref.number}`));
  // GitHub accepts PR numbers on /issues; use the PR representation for those links too.
  if (ref.kind === "issue" && item.pull_request) return githubPreview({ ...ref, kind: "pull-request" }, read);
  const github: GitHubPreview = {
    kind: ref.kind, number: item.number, repository: `${ref.owner}/${ref.repo}`,
    state: item.merged_at ? "merged" : item.state === "closed" ? "closed" : item.draft ? "draft" : "open",
    stateReason: item.state_reason ?? null, author: item.user?.login ?? null, updatedAt: item.updated_at,
    labels: item.labels.map(l => clean(typeof l === "string" ? l : l.name, 80)).slice(0, 20),
    assignees: item.assignees.map(a => a.login).slice(0, 20), comments: item.comments,
    branch: item.head && item.base ? `${item.head.ref} → ${item.base.ref}` : null,
    checks: null, review: null, mergeability: null,
  };
  if (ref.kind === "pull-request") {
    github.mergeability = github.state === "merged" ? "Merged" : github.state === "closed" ? "Closed without merging"
      : item.mergeable === false ? "Conflicts" : ["blocked", "behind", "dirty"].includes(item.mergeable_state ?? "") ? "Merge blocked"
      : item.mergeable === true ? "No conflicts" : "Mergeability unknown";
    const [reviews, checks] = await Promise.all([
      json(read, `${root}/pulls/${ref.number}/reviews?per_page=100`).then(r => reviewSummary(reviewsSchema.parse(r), (item.requested_reviewers?.length ?? 0) + (item.requested_teams?.length ?? 0))).catch(() => "Review status unavailable"),
      item.head ? Promise.all([
        json(read, `${root}/commits/${item.head.sha}/check-runs?per_page=100`).then(r => runsSchema.parse(r)),
        json(read, `${root}/commits/${item.head.sha}/status`).then(r => statusesSchema.parse(r)),
      ]).then(([runs, statuses]) => checkSummary(runs, statuses)).catch(() => "Checks unavailable") : Promise.resolve("Checks unavailable"),
    ]);
    github.review = reviews; github.checks = checks;
  }
  return { title: clean(item.title), description: clean(item.body ?? "", 400), site: "GitHub", image: null, github };
}
