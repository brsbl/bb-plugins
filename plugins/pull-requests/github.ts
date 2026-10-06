import { execFile } from "node:child_process";
import { z } from "zod";
import { snapshotSchema, type Snapshot, type ReadResult, type SearchResult, type Changes } from "./contract.js";
import { originMarkers, parsePullRequestUrl } from "./core.js";

export type GhRunner = (args: string[], signal?: AbortSignal) => Promise<string>;
export const runGh: GhRunner = (args, signal) => new Promise((resolve, reject) => {
  execFile("gh", args, { encoding: "utf8", timeout: 20_000, maxBuffer: 3 * 1024 * 1024, signal, env: { ...process.env, GH_PROMPT_DISABLED: "1", GH_HOST: "github.com" } }, (error, stdout, stderr) => {
    if (error) { reject(Object.assign(error, { stderr })); return; } resolve(stdout);
  });
});
const viewerSchema = z.object({ id: z.string(), login: z.string() });
const checkNode = z.object({ __typename: z.string(), name: z.string().optional(), context: z.string().optional(), status: z.string().optional(), state: z.string().optional(), conclusion: z.string().nullable().optional(), detailsUrl: z.string().nullable().optional(), targetUrl: z.string().nullable().optional() });
const rawPrSchema = z.object({
  id: z.string(), url: z.string(), number: z.number(), title: z.string(), body: z.string(), state: z.string(), isDraft: z.boolean(), headRefOid: z.string(), headRefName: z.string(), baseRefName: z.string(), updatedAt: z.string(),
  repository: z.object({ nameWithOwner: z.string() }), author: z.object({ login: z.string(), avatarUrl: z.string().nullable().optional() }).nullable(),
  reviewRequests: z.object({ pageInfo: z.object({ hasNextPage: z.boolean() }), nodes: z.array(z.object({ requestedReviewer: z.object({ __typename: z.string(), login: z.string().optional(), slug: z.string().optional(), organization: z.object({ login: z.string() }).optional() }).nullable() }).nullable()) }).optional(),
  additions: z.number(), deletions: z.number(), changedFiles: z.number(), reviewDecision: z.string().nullable(), mergeable: z.string(), mergeStateStatus: z.string(),
  mergeQueueEntry: z.object({ id: z.string() }).nullable(), autoMergeRequest: z.object({ enabledAt: z.string() }).nullable(),
  commits: z.object({ nodes: z.array(z.object({ commit: z.object({ oid: z.string(), statusCheckRollup: z.object({ state: z.string(), contexts: z.object({ totalCount: z.number(), pageInfo: z.object({ hasNextPage: z.boolean() }), nodes: z.array(checkNode.nullable()) }) }).nullable() }) }).nullable()) }),
});
type RawPr = z.infer<typeof rawPrSchema>;
const prFields = `id url number title body state isDraft headRefOid headRefName baseRefName updatedAt repository { nameWithOwner } author { login avatarUrl(size:40) } reviewRequests(first:100) { pageInfo { hasNextPage } nodes { requestedReviewer { __typename ... on User { login } ... on Bot { login } ... on Mannequin { login } ... on Team { slug organization { login } } } } } additions deletions changedFiles reviewDecision mergeable mergeStateStatus mergeQueueEntry { id } autoMergeRequest { enabledAt } commits(last:1) { nodes { commit { oid statusCheckRollup { state contexts(first:100) { totalCount pageInfo { hasNextPage } nodes { __typename ... on CheckRun { name status conclusion detailsUrl } ... on StatusContext { context state targetUrl } } } } } } }`;
function queryFor(url: string, fields: string) {
  const pr = parsePullRequestUrl(url);
  return `query { viewer { id login } repository(owner:${JSON.stringify(pr.owner)},name:${JSON.stringify(pr.repository)}) { pullRequest(number:${pr.number}) { ${fields} } } }`;
}
class ReadError extends Error {
  constructor(readonly kind: "denied" | "authentication-required" | "auth-changed" | "unavailable", message: string, readonly fatal = false) { super(message); }
}
export function classifyFailure(error: unknown): Extract<ReadResult, { ok: false }> {
  if (error instanceof ReadError) return { ok: false, kind: error.kind, message: error.message };
  const detail = typeof error === "object" && error !== null ? String((error as { stderr?: string }).stderr ?? "") : "";
  const message = error instanceof Error ? error.message : String(error);
  if (/HTTP 401|Bad credentials|authentication token|gh auth login|not logged|requires authentication/i.test(detail)) return { ok: false, kind: "authentication-required", message: "GitHub login is required on this machine. Sign in with gh auth login, then retry." };
  if (/HTTP 404|Could not resolve|Resource not accessible|HTTP 403(?![\s\S]*rate limit)/i.test(detail) && !/rate.limit/i.test(detail)) return { ok: false, kind: "denied", message: "This GitHub account cannot read this pull request. Its cached content is hidden." };
  return { ok: false, kind: "unavailable", message: /rate.limit/i.test(detail) ? "GitHub rate limit reached. Retry after the limit resets." : /ENOENT/.test(message) ? "GitHub CLI is not installed on this machine." : "GitHub could not be reached. Retry when this machine and GitHub are available." };
}
async function graphql(run: GhRunner, query: string, signal?: AbortSignal): Promise<{ viewer: z.infer<typeof viewerSchema>; pr: unknown }> {
  const raw = JSON.parse(await run(["api", "graphql", "--hostname", "github.com", "-f", `query=${query}`], signal)) as { data?: { viewer?: unknown; repository?: { pullRequest?: unknown } | null }; errors?: Array<{ type?: string; message?: string }> };
  if (raw.errors?.length) {
    const denied = raw.errors.some((item) => /NOT_FOUND|FORBIDDEN/.test(item.type ?? ""));
    throw new ReadError(denied ? "denied" : "unavailable", denied ? "This GitHub account cannot read this pull request. Its cached content is hidden." : "GitHub returned an incomplete response. Retry.");
  }
  const viewer = viewerSchema.parse(raw.data?.viewer);
  const pr = raw.data?.repository?.pullRequest;
  if (!pr) throw new ReadError("denied", "This GitHub account cannot read this pull request. Its cached content is hidden.");
  return { viewer, pr };
}
function assertAccount(actual: string, expected?: string) {
  if (expected && actual !== expected) throw new ReadError("auth-changed", "The GitHub account on this machine changed. Choose the read source explicitly to use the new account.");
}
function checkState(raw: z.infer<typeof checkNode>): Snapshot["checks"]["items"][number]["state"] {
  if (raw.__typename === "CheckRun" && raw.status !== "COMPLETED") return "pending";
  const state = raw.__typename === "CheckRun" ? raw.conclusion : raw.state;
  if (state === "SUCCESS") return "passing";
  if (["FAILURE", "ERROR", "CANCELLED", "TIMED_OUT", "ACTION_REQUIRED", "STALE", "STARTUP_FAILURE"].includes(state ?? "")) return "failing";
  if (["PENDING", "EXPECTED", "QUEUED", "IN_PROGRESS"].includes(state ?? "")) return "pending";
  if (["NEUTRAL", "SKIPPED"].includes(state ?? "")) return "neutral";
  return "unknown";
}
export function projectSnapshot(pr: RawPr, now = new Date().toISOString()): Snapshot {
  const commit = pr.commits.nodes[0]?.commit;
  if (commit && commit.oid !== pr.headRefOid) throw new ReadError("unavailable", "The pull request changed during refresh. Retry for the current revision.");
  const rollup = commit?.statusCheckRollup;
  const items = (rollup?.contexts.nodes ?? []).flatMap((item) => item ? [{ name: item.name ?? item.context ?? "Check", state: checkState(item), url: item.detailsUrl ?? item.targetUrl ?? null }] : []);
  const count = (state: string) => items.filter((item) => item.state === state).length;
  const requestedReviewers = (pr.reviewRequests?.nodes ?? []).flatMap((node) => {
    const reviewer = node?.requestedReviewer;
    return reviewer?.__typename === "Team" && reviewer.organization && reviewer.slug ? [`${reviewer.organization.login}/${reviewer.slug}`] : reviewer?.login ? [reviewer.login] : [];
  });
  const complete = !rollup?.contexts.pageInfo.hasNextPage;
  const state: Snapshot["checks"]["state"] = !commit ? "unknown" : !rollup ? "none" : rollup.state === "SUCCESS" ? "passing" : ["FAILURE", "ERROR"].includes(rollup.state) ? "failing" : ["PENDING", "EXPECTED"].includes(rollup.state) ? "pending" : "unknown";
  return snapshotSchema.parse({
    nodeId: pr.id, url: parsePullRequestUrl(pr.url).url, repository: pr.repository.nameWithOwner, number: pr.number, title: pr.title, body: pr.body,
    author: pr.author?.login ?? null, authorAvatarUrl: pr.author?.avatarUrl ?? null, state: pr.state === "MERGED" ? "merged" : pr.state === "CLOSED" ? "closed" : pr.isDraft ? "draft" : "open", headSha: pr.headRefOid,
    requestedReviewers, reviewRequestsComplete: !!pr.reviewRequests && !pr.reviewRequests.pageInfo.hasNextPage && requestedReviewers.length === pr.reviewRequests.nodes.length,
    headBranch: pr.headRefName, baseBranch: pr.baseRefName, updatedAt: pr.updatedAt, fetchedAt: now,
    checks: { state, passing: count("passing"), failing: count("failing"), pending: count("pending"), total: rollup?.contexts.totalCount ?? 0, complete, items },
    review: pr.reviewDecision === "APPROVED" ? "approved" : pr.reviewDecision === "CHANGES_REQUESTED" ? "changes-requested" : pr.reviewDecision === "REVIEW_REQUIRED" ? "required" : pr.reviewDecision === null ? "none" : "unknown",
    mergeability: pr.mergeable === "CONFLICTING" ? "conflicts" : ["BLOCKED", "BEHIND", "DIRTY"].includes(pr.mergeStateStatus) ? "blocked" : pr.mergeable === "MERGEABLE" ? "mergeable" : "unknown",
    queued: pr.mergeQueueEntry !== null, autoMerge: pr.autoMergeRequest !== null, additions: pr.additions, deletions: pr.deletions, changedFiles: pr.changedFiles,
    originThreadIds: originMarkers(pr.body), stack: { state: "unavailable", items: [] },
  });
}
const stackSchema = z.object({ headRefOid: z.string(), stack: z.object({ entries: z.object({ pageInfo: z.object({ hasNextPage: z.boolean() }), nodes: z.array(z.object({ position: z.number(), pullRequest: z.object({ url: z.string(), title: z.string(), number: z.number(), state: z.string() }).nullable() }).nullable()) }) }).nullable() });
export async function searchPullRequests(input: { scope: "authored" | "review" | "history" | "repository"; repositories?: string[]; cursor?: string; expectedAccountId?: string }, run: GhRunner = runGh, signal?: AbortSignal): Promise<SearchResult> {
  let accountId: string | undefined;
  try {
    const account = z.object({ node_id: z.string(), login: z.string().regex(/^[a-z\d](?:[a-z\d-]*[a-z\d])?$/i) }).parse(JSON.parse(await run(["api", "user", "--hostname", "github.com"], signal)));
    accountId = account.node_id;
    assertAccount(account.node_id, input.expectedAccountId);
    if (input.scope === "repository" && !input.repositories?.length) throw new ReadError("unavailable", "Choose at least one repository to search.");
    const scope = input.scope === "repository" ? `is:open ${input.repositories!.map((repository) => `repo:${repository}`).join(" ")}` : input.scope === "review" ? `is:open review-requested:${account.login}` : `author:${account.login} ${input.scope === "history" ? "is:closed" : "is:open"}`;
    const query = `query { viewer { id login } search(type:ISSUE,query:${JSON.stringify(`is:pr ${scope} sort:updated-desc`)},first:25${input.cursor ? `,after:${JSON.stringify(input.cursor)}` : ""}) { pageInfo { hasNextPage endCursor } nodes { ... on PullRequest { ${prFields} } } } }`;
    const raw = JSON.parse(await run(["api", "graphql", "--hostname", "github.com", "-f", `query=${query}`], signal));
    if (raw.errors?.length) throw new ReadError("unavailable", "GitHub search returned an incomplete response. Retry.");
    const data = z.object({ viewer: viewerSchema, search: z.object({ pageInfo: z.object({ hasNextPage: z.boolean(), endCursor: z.string().nullable() }), nodes: z.array(rawPrSchema.nullable()) }) }).parse(raw.data);
    assertAccount(data.viewer.id, account.node_id);
    const confirmed = z.object({ node_id: z.string() }).parse(JSON.parse(await run(["api", "user", "--hostname", "github.com"], signal)));
    assertAccount(confirmed.node_id, account.node_id);
    if (data.search.pageInfo.hasNextPage && !data.search.pageInfo.endCursor) throw new ReadError("unavailable", "GitHub did not return the next page.");
    return { ok: true, accountId: account.node_id, login: account.login, snapshots: data.search.nodes.flatMap((pr) => pr ? [projectSnapshot(pr)] : []), nextCursor: data.search.pageInfo.hasNextPage ? data.search.pageInfo.endCursor : null };
  } catch (error) {
    const failure = classifyFailure(error);
    if (accountId && failure.kind !== "auth-changed" && failure.kind !== "authentication-required") {
      try {
        const confirmed = z.object({ node_id: z.string() }).parse(JSON.parse(await run(["api", "user", "--hostname", "github.com"], signal)));
        assertAccount(confirmed.node_id, accountId);
      } catch (identityError) {
        const identityFailure = classifyFailure(identityError);
        if (identityFailure.kind === "auth-changed" || identityFailure.kind === "authentication-required") return identityFailure;
      }
    }
    return { ...failure, ...(accountId ? { accountId } : {}) };
  }
}
export async function readPullRequest(input: { url: string; expectedAccountId?: string }, run: GhRunner = runGh, signal?: AbortSignal): Promise<ReadResult> {
  let observedAccountId: string | undefined;
  try {
    const initial = z.object({ node_id: z.string(), login: z.string() }).parse(JSON.parse(await run(["api", "user", "--hostname", "github.com"], signal)));
    observedAccountId = initial.node_id;
    assertAccount(initial.node_id, input.expectedAccountId);
    const result = await graphql(run, queryFor(input.url, prFields), signal);
    assertAccount(result.viewer.id, initial.node_id);
    assertAccount(result.viewer.id, input.expectedAccountId);
    const snapshot = projectSnapshot(rawPrSchema.parse(result.pr));
    try {
      const enrichment = await graphql(run, queryFor(input.url, "headRefOid stack { entries(first:100) { pageInfo { hasNextPage } nodes { position pullRequest { url title number state } } } }"), signal);
      assertAccount(enrichment.viewer.id, result.viewer.id);
      const stack = stackSchema.parse(enrichment.pr);
      if (stack.headRefOid !== snapshot.headSha) throw new ReadError("unavailable", "The pull request changed during refresh. Retry for the current revision.", true);
      if (stack.stack === null) snapshot.stack = { state: "none", items: [] };
      else if (!stack.stack.entries.pageInfo.hasNextPage) snapshot.stack = { state: "available", items: stack.stack.entries.nodes.filter((entry) => entry !== null).sort((a, b) => a.position - b.position).flatMap((entry) => entry.pullRequest ? [{ ...entry.pullRequest, url: parsePullRequestUrl(entry.pullRequest.url).url }] : []) };
    } catch (error) {
      if (error instanceof ReadError && error.fatal) throw error;
      const failure = classifyFailure(error);
      if (failure.kind !== "unavailable") return failure;
      // Native stack fields are optional enrichment. Never infer a stack from branch names.
    }
    // A host may switch accounts between requests; revalidate before returning cached private content.
    const confirmed = JSON.parse(await run(["api", "user", "--hostname", "github.com"], signal)) as { node_id?: string };
    if (!confirmed.node_id) throw new ReadError("unavailable", "GitHub did not confirm the current account.");
    assertAccount(confirmed.node_id, result.viewer.id);
    return { ok: true, accountId: result.viewer.id, login: result.viewer.login, snapshot };
  } catch (error) {
    const failure = classifyFailure(error);
    if (failure.kind === "denied" && input.expectedAccountId) {
      try {
        const account = z.object({ node_id: z.string() }).parse(JSON.parse(await run(["api", "user", "--hostname", "github.com"], signal)));
        assertAccount(account.node_id, input.expectedAccountId);
      } catch (identityError) {
        const identityFailure = classifyFailure(identityError);
        if (identityFailure.kind === "auth-changed" || identityFailure.kind === "authentication-required") return identityFailure;
      }
    }
    return { ...failure, ...(observedAccountId ? { accountId: observedAccountId } : {}) };
  }
}
const fileSchema = z.object({ filename: z.string(), previous_filename: z.string().optional(), additions: z.number(), deletions: z.number(), status: z.string(), patch: z.string().optional() });
export async function readChanges(input: { url: string; expectedAccountId: string; headSha: string }, run: GhRunner = runGh, signal?: AbortSignal): Promise<{ ok: true; changes: Changes } | Extract<ReadResult, { ok: false }>> {
  try {
    const ref = parsePullRequestUrl(input.url);
    const initial = z.object({ node_id: z.string() }).parse(JSON.parse(await run(["api", "user", "--hostname", "github.com"], signal)));
    assertAccount(initial.node_id, input.expectedAccountId);
    const before = await graphql(run, queryFor(ref.url, "headRefOid changedFiles"), signal);
    assertAccount(before.viewer.id, input.expectedAccountId);
    const revision = z.object({ headRefOid: z.string(), changedFiles: z.number() }).parse(before.pr);
    if (revision.headRefOid !== input.headSha) throw new ReadError("unavailable", "This pull request has a newer revision. Refresh before opening Changes.");
    const files = z.array(fileSchema).parse(JSON.parse(await run(["api", `repos/${ref.owner}/${ref.repository}/pulls/${ref.number}/files?per_page=100`, "--hostname", "github.com"], signal)));
    const after = await graphql(run, queryFor(ref.url, "headRefOid"), signal);
    assertAccount(after.viewer.id, input.expectedAccountId);
    if (z.object({ headRefOid: z.string() }).parse(after.pr).headRefOid !== input.headSha) throw new ReadError("unavailable", "The pull request changed while loading Changes. Refresh and retry.");
    let budget = 200_000;
    let truncated = revision.changedFiles > files.length;
    const projected = files.map((file) => {
      const original = file.patch ?? null;
      const patch = original === null ? null : original.slice(0, Math.max(0, budget));
      budget -= patch?.length ?? 0;
      if (patch !== original) truncated = true;
      return { path: file.filename, previousPath: file.previous_filename ?? null, additions: file.additions, deletions: file.deletions, status: file.status, patch };
    });
    return { ok: true, changes: { headSha: input.headSha, files: projected, total: revision.changedFiles, truncated, message: truncated ? "This preview is limited to 100 files and 200,000 patch characters. Open GitHub for the complete diff." : projected.some((file) => file.patch === null) ? "GitHub did not provide a text patch for some files. Open GitHub for binary or oversized changes." : null } };
  } catch (error) { return classifyFailure(error); }
}
