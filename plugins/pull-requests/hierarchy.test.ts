import { describe, expect, it } from "vitest";
import type { PullRequestItem, Snapshot, ThreadChoice } from "./contract";
import { attentionSummary, dependencyGroups, dependencyStatus, filterGroups, ownerThread, projectFor, statusOf, type Activity } from "./hierarchy";

const now = Date.parse("2026-10-06T12:00:00Z");
function pr(number: number, fields: Partial<Snapshot> = {}): PullRequestItem {
  const snapshot: Snapshot = {
    nodeId: `PR_${number}`, url: `https://github.com/acme/repo/pull/${number}`, repository: "acme/repo", number, title: `Change ${number}`, body: "", author: "alice", state: "open", headSha: `sha${number}`, headBranch: `branch${number}`, baseBranch: "main", headRepository: "acme/repo",
    updatedAt: new Date(now).toISOString(), fetchedAt: new Date(now).toISOString(), requestedReviewers: [], reviewRequestsComplete: true,
    checks: { state: "passing", passing: 1, failing: 0, pending: 0, total: 1, complete: true, items: [] }, review: "approved", mergeability: "mergeable", queued: false, autoMerge: false, additions: 1, deletions: 0, changedFiles: 1, originThreadIds: [], stack: { state: "none", items: [] }, ...fields,
  };
  return { id: `github:PR_${number}`, url: snapshot.url, snapshot, reader: { hostId: "host_a", accountId: "account_a", login: "alice" }, sourceState: "available", sourceMessage: null, lastAttemptAt: snapshot.fetchedAt, discoveredFromGitHub: true, links: [], preferredThreadId: null, pinned: false };
}
const link = (threadId: string, origin = false): PullRequestItem["links"][number] => ({ threadId, origin, evidence: "body-marker", environmentId: null, createdAt: new Date(now).toISOString(), actor: "discovery" });
const activity = (fields: Partial<Activity> = {}): Activity => ({ hasPendingInteraction: false, indicator: "none", status: "idle", activity: { backgroundAgents: 0, backgroundCommands: 0, goals: 0, planMode: 0, workflows: 0 }, runtimeStatus: "idle", ...fields });
const native = (...items: PullRequestItem[]): Snapshot["stack"] => ({ state: "available", items: items.map(({ snapshot }) => ({ url: snapshot!.url, title: snapshot!.title, number: snapshot!.number, state: snapshot!.state.toUpperCase() })) });

describe("PR status precedence and freshness", () => {
  it("keeps live questions above stale GitHub, failures, and working agents", () => {
    const item = pr(1); item.links = [link("thr_a")]; item.sourceState = "offline";
    const threads = new Map([["thr_a", activity({ hasPendingInteraction: true, status: "active" })]]);
    expect(statusOf(item, threads, now)).toMatchObject({ category: "Needs you", attention: true, cached: true });
    item.snapshot = null;
    expect(statusOf(item, threads, now)).toMatchObject({ category: "Needs you", reason: "Agent needs your input" });
    item.snapshot = pr(1).snapshot; item.sourceState = "available";
    item.snapshot!.requestedReviewers = ["ALICE"];
    expect(statusOf(item, new Map(), now)).toMatchObject({ category: "Needs you", reason: "Your review requested" });
    item.snapshot!.checks.state = "failing";
    const group = dependencyGroups([item], now)[0]!;
    expect(attentionSummary(group.entries, new Map([[item.id, statusOf(item, threads, now)]]))).toBe("1 needs you · 1 needs fixes");
  });
  it("orders fresh failures ahead of draft/activity, then waiting, then complete decision evidence", () => {
    const item = pr(1, { state: "draft", mergeability: "conflicts" });
    expect(statusOf(item, new Map(), now).category).toBe("Needs fixes");
    item.snapshot!.mergeability = "mergeable";
    expect(statusOf(item, new Map(), now).category).toBe("In progress");
    item.snapshot!.state = "open";
    expect(statusOf(item, new Map(), now, { waiting: "Prerequisite #4 must merge first" })).toMatchObject({ category: "Waiting", reason: "Prerequisite #4 must merge first" });
    item.snapshot!.review = "required";
    expect(statusOf(item, new Map(), now).category).toBe("Waiting");
    item.snapshot!.review = "none";
    expect(statusOf(item, new Map(), now)).toMatchObject({ category: "Ready for decision", reason: "No known GitHub blocker", attention: false });
    item.snapshot!.checks.complete = false;
    expect(statusOf(item, new Map(), now).category).toBe("Unknown");
    item.snapshot!.checks.state = "failing";
    expect(statusOf(item, new Map(), now).category).toBe("Needs fixes");
  });
  it("does not turn old failures, incomplete evidence, or offline evidence into current conclusions", () => {
    const item = pr(1, { review: "changes-requested" });
    expect(statusOf(item, new Map(), now).attention).toBe(true);
    for (const timestamp of [new Date(now - 60_001).toISOString(), new Date(now + 1).toISOString(), "invalid"]) {
      item.snapshot!.fetchedAt = timestamp;
      expect(statusOf(item, new Map(), now)).toMatchObject({ category: "Unknown", attention: false, cached: true });
    }
    item.snapshot!.fetchedAt = new Date(now).toISOString();
    expect(statusOf(item, new Map(), now, undefined, false).category).toBe("Unknown");
    item.snapshot!.state = "merged";
    item.links = [link("thr_a")];
    expect(statusOf(item, new Map([["thr_a", activity({ hasPendingInteraction: true })]]), now).attention).toBe(false);
  });
});

describe("Project ownership", () => {
  it("uses preferred, then one origin, then a unique repository mapping, never arbitrary worker order", () => {
    const item = pr(1);
    const threads = new Map<string, ThreadChoice>(["worker", "origin", "preferred"].map((name) => [`thr_${name}`, { id: `thr_${name}`, title: name, projectId: `proj_${name}`, environmentId: null, hostId: null, archived: false }]));
    item.links = [link("thr_worker"), link("thr_origin", true), link("thr_preferred")];
    const mappings = [{ id: "proj_repo", repository: "ACME/REPO" }];
    expect(projectFor(item, threads, mappings)).toBe("proj_origin");
    item.preferredThreadId = "thr_preferred";
    expect(projectFor(item, threads, mappings)).toBe("proj_preferred");
    item.preferredThreadId = null; item.links[0]!.origin = true;
    expect(ownerThread(item, threads)).toBeUndefined();
    expect(projectFor(item, threads, mappings)).toBe("proj_repo");
    expect(projectFor(item, threads, [...mappings, { id: "proj_other", repository: "acme/repo" }])).toBeUndefined();
  });
});

describe("Dependency groups", () => {
  it("orders prerequisites before children regardless of sort order and keeps branching relations explicit", () => {
    const root = pr(1), child = pr(2, { baseBranch: "branch1" }), sibling = pr(3, { baseBranch: "branch1" });
    const [group] = dependencyGroups([sibling, child, root], now);
    expect(group!.kind).toBe("branch");
    expect(group!.entries.map((entry) => entry.number)).toEqual([1, 2, 3]);
    expect(group!.entries.slice(1).map((entry) => entry.parent)).toEqual([root.url, root.url]);
    expect(dependencyStatus(group!.entries[1]!, group!, now).waiting).toContain("#1");
    root.snapshot!.state = "merged";
    expect(dependencyStatus(dependencyGroups([child, root], now)[0]!.entries[1]!, dependencyGroups([child, root], now)[0]!, now)).toEqual({});
    root.sourceState = "stale";
    const cached = dependencyGroups([child, root], now)[0]!;
    expect(dependencyStatus(cached.entries[1]!, cached, now).uncertain).toContain("#1");
  });
  it("rejects duplicate branch heads, unknown repositories, forks, cross-repo names and cycles", () => {
    const root = pr(1), child = pr(2, { baseBranch: "branch1" });
    const duplicate = pr(3, { headBranch: "branch1" });
    let groups = dependencyGroups([root, child, duplicate], now);
    expect(groups).toHaveLength(3);
    expect(groups.find((group) => group.key === child.url)!.entries[0]!.note).toContain("ambiguous");
    root.snapshot!.headRepository = undefined;
    groups = dependencyGroups([root, child, duplicate], now);
    expect(groups.find((group) => group.key === child.url)!.entries[0]!.note).toContain("source repository unknown");
    root.snapshot!.headRepository = "fork/repo";
    expect(dependencyGroups([root, child], now)).toHaveLength(2);
    root.snapshot!.headRepository = "acme/repo"; root.snapshot!.repository = "another/repo";
    expect(dependencyGroups([root, child], now)).toHaveLength(2);
    root.snapshot!.repository = "acme/repo"; root.snapshot!.baseBranch = "branch2";
    groups = dependencyGroups([root, child], now);
    expect(groups).toHaveLength(2);
    expect(groups.every((group) => group.entries[0]!.note?.includes("cycle"))).toBe(true);
  });
  it("uses verifiable native order, retains missing members, and rejects conflicting native claims", () => {
    const root = pr(1), child = pr(2);
    child.snapshot!.stack = native(root, child);
    const [group] = dependencyGroups([child], now);
    expect(group).toMatchObject({ kind: "native", entries: [{ number: 1 }, { number: 2 }] });
    expect(group!.entries[0]!.item).toBeUndefined();
    expect(dependencyStatus(group!.entries[1]!, group!, now).uncertain).toContain("#1");
    // A member explicitly reporting no native stack conflicts with the other claim.
    expect(dependencyGroups([root, child], now).every((group) => group.entries[0]!.note?.includes("ambiguous"))).toBe(true);
    root.snapshot!.stack = native(child, root);
    const conflict = dependencyGroups([child, root], now);
    expect(conflict).toHaveLength(2);
    expect(conflict.every((entry) => entry.entries[0]!.note?.includes("ambiguous"))).toBe(true);
  });
  it("keeps filtered groups and history ancestry intact and summarizes attention on any member", () => {
    const root = pr(1, { state: "merged" }), child = pr(2, { baseBranch: "branch1", author: "bob" }), leaf = pr(3, { baseBranch: "branch2", requestedReviewers: ["alice"] });
    child.snapshot!.checks.state = "failing";
    const groups = dependencyGroups([leaf, root, child], now);
    const statuses = new Map([root, child, leaf].map((item) => [item.id, statusOf(item, new Map(), now)]));
    const active = filterGroups(groups, "active", (item) => item.snapshot?.title === "Change 3", true, statuses);
    expect(active).toHaveLength(1);
    expect(active[0]!.entries.map((entry) => entry.number)).toEqual([1, 2, 3]);
    expect(attentionSummary(active[0]!.entries, statuses)).toBe("1 needs you · 1 needs fixes");
    expect(filterGroups(groups, "history", () => true, false, statuses)[0]!.entries).toHaveLength(3);
    expect(filterGroups(dependencyGroups([pr(4, { state: "closed" })], now), "active", () => true, false, statuses)).toEqual([]);
    expect(filterGroups(groups, "active", () => false, true, statuses)).toEqual([]);
  });
});
