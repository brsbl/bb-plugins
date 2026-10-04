import { describe, expect, it, vi } from "vitest";
import { projectSnapshot, readChanges, readPullRequest, type GhRunner } from "./github.js";
import { githubNeedsAttention, originMarkers, parsePullRequestUrl } from "./core.js";

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
  it("normalizes safe PR URLs and rejects shell, credential, non-GitHub and malformed targets", () => {
    expect(parsePullRequestUrl(`${url}?tab=checks#foo`).url).toBe(url);
    for (const unsafe of ["https://evil.test/acme/repo/pull/42", "https://user:pass@github.com/acme/repo/pull/42", "http://github.com/acme/repo/pull/42", "https://github.com/acme/repo/issues/42", "https://github.com/a/$(say)/pull/42", "https://github.com/a/b/pull/9007199254740999"]) expect(() => parsePullRequestUrl(unsafe)).toThrow();
    expect(originMarkers("BB-Thread-ID: thr_a\nText BB-Thread-ID: thr_b\nBB-Thread-ID: thr_a\nBB-Thread-ID: thr_c")).toEqual(["thr_a", "thr_c"]);
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
