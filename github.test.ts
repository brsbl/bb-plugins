import { describe, expect, it, vi } from "vitest";
import { projectSnapshot, readChanges, readPullRequest, searchPullRequests, type GhRunner } from "./github.js";
import { githubNeedsAttention, githubRepository, originMarkers, parsePullRequestUrl, referencedThreadIds } from "./core.js";
import { snapshotSchema } from "./contract.js";

const url = "https://github.com/acme/repo/pull/42";
const account = { node_id: "U_A", login: "alice" };
const viewer = { id: "U_A", login: "alice" };
function rawPr() {
  return { id: "PR_42", url, number: 42, title: "Fix retries", body: "BB-Thread-ID: thr_original", state: "OPEN", isDraft: false, headRefOid: "abc", headRefName: "fix", baseRefName: "main", updatedAt: "2026-10-04T12:00:00Z", repository: { nameWithOwner: "acme/repo" }, author: { login: "alice" }, additions: 12, deletions: 3, changedFiles: 1, reviewDecision: "APPROVED", mergeable: "MERGEABLE", mergeStateStatus: "CLEAN", mergeQueueEntry: null, autoMergeRequest: null, commits: { nodes: [{ commit: { oid: "abc", statusCheckRollup: null } }] } };
}
function response(pr: unknown, actor = viewer) { return JSON.stringify({ data: { viewer: actor, repository: { pullRequest: pr } } }); }
function runner(pr = rawPr()): GhRunner {
  return async (args) => {
    if (args[1] === "user") return JSON.stringify(account);
    const query = args.find((arg) => arg.startsWith("query=")) ?? "";
    return response(query.includes("stack {") ? { headRefOid: "abc", stack: null } : pr);
  };
}
describe("GitHub read boundary", () => {
  it("reads qualified branch sources and native search stacks without requiring them in old snapshots", async () => {
    const pr = { ...rawPr(), headRepository: { nameWithOwner: "fork/repo" }, stack: { entries: { pageInfo: { hasNextPage: false }, nodes: [{ position: 1, pullRequest: { url, title: "Fix retries", number: 42, state: "OPEN" } }] } } };
    const run = vi.fn<GhRunner>().mockResolvedValueOnce(JSON.stringify(account)).mockResolvedValueOnce(JSON.stringify({ data: { viewer, search: { pageInfo: { hasNextPage: false, endCursor: null }, nodes: [pr] } } })).mockResolvedValueOnce(JSON.stringify(account));
    expect(await searchPullRequests({ scope: "authored" }, run)).toMatchObject({ ok: true, snapshots: [{ headRepository: "fork/repo", stack: { state: "available", items: [{ number: 42 }] } }] });
    const query = run.mock.calls[1]![0].join(" ");
    expect(query).toContain("headRepository { nameWithOwner }"); expect(query).toContain("stack { entries");
    const { headRepository: _, ...legacy } = projectSnapshot(rawPr());
    expect(snapshotSchema.parse(legacy).headRepository).toBeUndefined();
    pr.stack.entries.pageInfo.hasNextPage = true;
    expect(projectSnapshot(pr).stack.state).toBe("unavailable");
  });
  it("retries an unsupported search stack field without claiming a standalone PR", async () => {
    const run = vi.fn<GhRunner>().mockResolvedValueOnce(JSON.stringify(account)).mockRejectedValueOnce(Object.assign(new Error("GraphQL"), { stderr: "Field 'stack' doesn't exist on type 'PullRequest'" })).mockResolvedValueOnce(JSON.stringify({ data: { viewer, search: { pageInfo: { hasNextPage: false, endCursor: null }, nodes: [rawPr()] } } })).mockResolvedValueOnce(JSON.stringify(account));
    expect(await searchPullRequests({ scope: "authored" }, run)).toMatchObject({ ok: true, snapshots: [{ stack: { state: "unavailable" } }] });
    expect(run.mock.calls[2]![0].join(" ")).not.toContain("stack {");
    expect(originMarkers("BB-Thread: [Owner](https://brsbl.getbb.app/projects/proj_a/threads/thr_owner)\nBB-Thread-ID: thr_owner")).toEqual(["thr_owner"]);
  });
  it("keeps GitHub author avatars while accepting snapshots saved before avatars", async () => {
    const avatarUrl = "https://avatars.githubusercontent.com/u/42?s=40";
    const pr = { ...rawPr(), author: { login: "alice", avatarUrl } };
    const run = vi.fn<GhRunner>(runner(pr));
    const result = await readPullRequest({ url }, run);
    expect(result).toMatchObject({ ok: true, snapshot: { author: "alice", authorAvatarUrl: avatarUrl } });
    expect(run.mock.calls.some(([args]) => args.some((arg) => arg.includes("avatarUrl(size:40)")))).toBe(true);
    const { authorAvatarUrl: _, ...legacy } = projectSnapshot(rawPr());
    expect(snapshotSchema.parse(legacy).author).toBe("alice");
    expect(projectSnapshot({ ...rawPr(), author: null }).authorAvatarUrl).toBeNull();
  });
  it("deduplicates description IDs, mentions and thread links without matching partial IDs", () => {
    expect(referencedThreadIds("BB-Thread-ID: thr_a\nRelated: thr_b, @thread:thr_a\n[Review](https://brsbl.getbb.app/projects/proj_a/threads/thr_c)\n[Chat](bb://thread/thr_d)\nnot_thr_other thr_partial_suffix thr_partial-suffix")).toEqual(["thr_a", "thr_b", "thr_c", "thr_d"]);
  });
  it("queries account-wide authored and requested-review PRs with bounded cursor pagination", async () => {
    for (const [scope, qualifier] of [["authored", "author:alice is:open"], ["review", "is:open review-requested:alice"], ["history", "author:alice is:closed"]] as const) {
      const run = vi.fn<GhRunner>().mockResolvedValueOnce(JSON.stringify(account)).mockResolvedValueOnce(JSON.stringify({ data: { viewer, search: { pageInfo: { hasNextPage: true, endCursor: "next" }, nodes: [rawPr()] } } })).mockResolvedValueOnce(JSON.stringify(account));
      expect(await searchPullRequests({ scope, cursor: "previous" }, run)).toMatchObject({ ok: true, nextCursor: "next", snapshots: [{ nodeId: "PR_42" }] });
      const query = run.mock.calls[1]![0].join(" ");
      expect(query).toContain(qualifier); expect(query).toContain('first:25,after:"previous"');
      expect(query).not.toContain("repo:");
    }
  });
  it("searches open PRs from every author in project repositories, which come only from github.com remotes", async () => {
    const run = vi.fn<GhRunner>().mockResolvedValueOnce(JSON.stringify(account)).mockResolvedValueOnce(JSON.stringify({ data: { viewer, search: { pageInfo: { hasNextPage: false, endCursor: null }, nodes: [rawPr()] } } })).mockResolvedValueOnce(JSON.stringify(account));
    expect(await searchPullRequests({ scope: "repository", repositories: ["acme/repo", "acme/site"] }, run)).toMatchObject({ ok: true, nextCursor: null, snapshots: [{ nodeId: "PR_42" }] });
    const query = run.mock.calls[1]![0].join(" ");
    expect(query).toContain("is:pr is:open repo:acme/repo repo:acme/site"); expect(query).not.toContain("author:");
    expect(await searchPullRequests({ scope: "repository" }, vi.fn<GhRunner>().mockResolvedValue(JSON.stringify(account)))).toMatchObject({ ok: false, kind: "unavailable" });
    expect(["https://github.com/acme/repo.git", "git@github.com:acme/repo.git", "ssh://git@github.com/acme/repo", "https://token@github.com/acme/repo/"].map(githubRepository)).toEqual(["acme/repo", "acme/repo", "acme/repo", "acme/repo"]);
    expect(["https://gitlab.com/acme/repo.git", "https://github.com.evil/acme/repo", null, ""].map(githubRepository)).toEqual([null, null, null, null]);
  });
  it("rejects partial search responses and account switches without returning private results", async () => {
    const raw = { data: { viewer, search: { pageInfo: { hasNextPage: false, endCursor: null }, nodes: [rawPr()] } } };
    const switched = vi.fn<GhRunner>().mockResolvedValueOnce(JSON.stringify(account)).mockResolvedValueOnce(JSON.stringify(raw)).mockResolvedValueOnce(JSON.stringify({ node_id: "U_B" }));
    expect(await searchPullRequests({ scope: "authored" }, switched)).toMatchObject({ ok: false, kind: "auth-changed" });
    const partial = vi.fn<GhRunner>().mockResolvedValueOnce(JSON.stringify(account)).mockResolvedValueOnce(JSON.stringify({ ...raw, errors: [{ message: "Timeout" }] }));
    expect(await searchPullRequests({ scope: "authored" }, partial)).toMatchObject({ ok: false, kind: "unavailable" });
  });
  it("reports confirmed identity even when the account-wide search fails", async () => {
    const run = vi.fn<GhRunner>().mockResolvedValueOnce(JSON.stringify({ node_id: "U_B", login: "bob" })).mockRejectedValueOnce(new Error("Search timed out")).mockResolvedValueOnce(JSON.stringify({ node_id: "U_B" }));
    expect(await searchPullRequests({ scope: "history" }, run)).toMatchObject({ ok: false, kind: "unavailable", accountId: "U_B" });
  });
  it("normalizes safe PR URLs and rejects shell, credential, non-GitHub and malformed targets", () => {
    expect(parsePullRequestUrl(`${url}?tab=checks#foo`).url).toBe(url);
    for (const unsafe of ["https://evil.test/acme/repo/pull/42", "https://user:pass@github.com/acme/repo/pull/42", "http://github.com/acme/repo/pull/42", "https://github.com/acme/repo/issues/42", "https://github.com/a/$(say)/pull/42", "https://github.com/a/b/pull/9007199254740999"]) expect(() => parsePullRequestUrl(unsafe)).toThrow();
    expect(originMarkers("BB-Thread-ID: thr_a\nText BB-Thread-ID: thr_b\nBB-Thread-ID: thr_a\nBB-Thread-ID: thr_c")).toEqual(["thr_a", "thr_c"]);
  });
  it("reads requested users and namespaced teams without claiming incomplete reviewer data is complete", async () => {
    const pr = { ...rawPr(), reviewRequests: { pageInfo: { hasNextPage: false }, nodes: [
      { requestedReviewer: { __typename: "User", login: "bob" } },
      { requestedReviewer: { __typename: "Team", slug: "design", organization: { login: "acme" } } },
    ] } };
    const run = vi.fn<GhRunner>(runner(pr));
    expect(await readPullRequest({ url }, run)).toMatchObject({ ok: true, snapshot: { requestedReviewers: ["bob", "acme/design"], reviewRequestsComplete: true } });
    expect(run.mock.calls.some(([args]) => args.some((arg) => arg.includes("reviewRequests(first:100)")))).toBe(true);
    pr.reviewRequests.pageInfo.hasNextPage = true;
    expect(projectSnapshot(pr).reviewRequestsComplete).toBe(false);
    expect(projectSnapshot(rawPr())).toMatchObject({ requestedReviewers: [], reviewRequestsComplete: false });
  });
  it("checks identity before a newly signed-in account can turn a PR denial into a resource-only failure", async () => {
    const run = vi.fn<GhRunner>().mockResolvedValue(JSON.stringify({ node_id: "U_B", login: "bob" }));
    expect(await readPullRequest({ url, expectedAccountId: "U_A" }, run)).toMatchObject({ ok: false, kind: "auth-changed" });
    expect(run).toHaveBeenCalledTimes(1);
  });
  it("detects a mid-query account change even when GraphQL fails before returning viewer", async () => {
    const run = vi.fn<GhRunner>().mockResolvedValueOnce(JSON.stringify(account)).mockRejectedValueOnce(Object.assign(new Error("gh failed"), { stderr: "Could not resolve to a PullRequest" })).mockResolvedValueOnce(JSON.stringify({ node_id: "U_B" }));
    expect(await readPullRequest({ url, expectedAccountId: "U_A" }, run)).toMatchObject({ ok: false, kind: "auth-changed" });
  });
  it("rejects a head change between the snapshot and stack instead of publishing mixed revisions", async () => {
    const run = vi.fn<GhRunner>().mockResolvedValueOnce(JSON.stringify(account)).mockResolvedValueOnce(response(rawPr())).mockResolvedValueOnce(response({ headRefOid: "new", stack: null }));
    expect(await readPullRequest({ url, expectedAccountId: "U_A" }, run)).toMatchObject({ ok: false, kind: "unavailable" });
  });
  it("degrades unsupported native stack enrichment without inventing branch relationships", async () => {
    const run = vi.fn<GhRunner>().mockResolvedValueOnce(JSON.stringify(account)).mockResolvedValueOnce(response(rawPr())).mockRejectedValueOnce(new Error("Field stack does not exist")).mockResolvedValueOnce(JSON.stringify(account));
    const result = await readPullRequest({ url, expectedAccountId: "U_A" }, run);
    expect(result).toMatchObject({ ok: true, snapshot: { headSha: "abc", stack: { state: "unavailable", items: [] }, checks: { state: "none" } } });
    expect((await readPullRequest({ url }, runner()))).toMatchObject({ ok: true, snapshot: { stack: { state: "none" } } });
  });
  it("keeps missing commit checks unknown and excludes pending or required-review work from attention", () => {
    const pr = rawPr(); pr.commits.nodes = [];
    expect(projectSnapshot(pr).checks.state).toBe("unknown");
    const snapshot = projectSnapshot(rawPr()); snapshot.mergeability = "blocked";
    expect(githubNeedsAttention(snapshot)).toBe(true);
    snapshot.checks.state = "pending"; expect(githubNeedsAttention(snapshot)).toBe(false);
    snapshot.checks.state = "passing"; snapshot.review = "required"; expect(githubNeedsAttention(snapshot)).toBe(false);
    snapshot.checks.state = "failing"; expect(githubNeedsAttention(snapshot)).toBe(true);
  });
  it("rejects a diff captured while the PR head changed and never issues GitHub mutations", async () => {
    const run = vi.fn<GhRunner>().mockResolvedValueOnce(JSON.stringify(account)).mockResolvedValueOnce(response({ headRefOid: "abc", changedFiles: 1 })).mockResolvedValueOnce(JSON.stringify([{ filename: "a.ts", status: "modified", additions: 1, deletions: 0, patch: "+hello" }])).mockResolvedValueOnce(response({ headRefOid: "new" }));
    expect(await readChanges({ url, expectedAccountId: "U_A", headSha: "abc" }, run)).toMatchObject({ ok: false, kind: "unavailable" });
    for (const [args] of run.mock.calls) expect(args.join(" ")).not.toMatch(/mutation|--method|\bPATCH\b|\bDELETE\b/);
  });
});
