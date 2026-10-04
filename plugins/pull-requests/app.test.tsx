// @vitest-environment jsdom
import { act, cleanup, screen, waitFor } from "@testing-library/react";
import { loadPluginApp, renderSlot } from "@get-bb/plugin-sdk/testing/app";
import { afterEach, describe, expect, it } from "vitest";
import { CHANGED, type Changes, type PullRequestItem, type Snapshot } from "./contract";

afterEach(cleanup);
const coverage = { running: false, checked: 1, total: 1, unavailable: 0, incomplete: false, lastDiscoveryAt: new Date().toISOString(), includesArchived: false };
function fixture(): PullRequestItem {
  const snapshot: Snapshot = {
    nodeId: "PR_123", url: "https://github.com/example/repo/pull/123", repository: "example/repo", number: 123,
    title: "Private pull request", body: "Private description", author: "author", state: "open", headSha: "abc1234", headBranch: "feature", baseBranch: "main",
    updatedAt: new Date().toISOString(), fetchedAt: new Date().toISOString(),
    checks: { state: "failing", passing: 0, failing: 1, pending: 0, total: 1, complete: true, items: [{ name: "Unsafe check destination", state: "failing", url: "javascript:alert(1)" }] },
    review: "none", mergeability: "mergeable", queued: false, autoMerge: false, additions: 1, deletions: 0, changedFiles: 1,
    originThreadIds: [], stack: { state: "none", items: [] },
  };
  return { id: "PR_123", url: snapshot.url, snapshot, reader: { hostId: "host_1", accountId: "account_1", login: "author" }, sourceState: "available", sourceMessage: null, lastAttemptAt: snapshot.fetchedAt, links: [{ threadId: "thr_archived", evidence: "user-explicit", origin: false, environmentId: null, createdAt: snapshot.fetchedAt, actor: "user" }], preferredThreadId: "thr_archived", pinned: false };
}
const thread = { id: "thr_archived", title: "Archived implementation thread", projectId: "proj_1", environmentId: null, hostId: "host_1", archived: true };

describe("Pull Requests access and detail lifetime", () => {
  it("keeps a deep-linked PR outside the list page, then removes private content after access is denied", async () => {
    let item = fixture();
    const app = await loadPluginApp(() => import("./app"));
    const slot = renderSlot(app.navPanels[0]!, { subPath: "PR_123/summary" }, { rpc: {
      list: () => ({ items: [], nextCursor: null, total: 0, coverage }),
      show: () => item,
      refresh: () => coverage,
      context: (input) => ({ threads: (input as { threadIds?: string[] }).threadIds ? [thread] : [], hosts: [{ id: "host_1", name: "Source", connected: true }], nextCursor: null }),
    } });
    expect(await screen.findByText("Private description")).toBeDefined();
    expect(await screen.findByText("Archived implementation thread")).toBeDefined();
    expect(screen.queryByRole("link", { name: "Unsafe check destination" })).toBeNull();
    await slot.behavior.emitRealtime(CHANGED, {});
    expect(await screen.findByText("Private description")).toBeDefined();
    item = { ...item, snapshot: null, sourceState: "denied", sourceMessage: "Access denied" };
    await slot.behavior.emitRealtime(CHANGED, {});
    await waitFor(() => expect(screen.queryByText("Private description")).toBeNull());
    expect(screen.queryByText("Private pull request")).toBeNull();
    expect(screen.getByText("Access denied")).toBeDefined();
    slot.lifecycle.unmount();
  });

  it("discards an in-flight private diff when account access changes", async () => {
    let item = fixture();
    let finish!: (changes: Changes) => void;
    const pending = new Promise<Changes>((resolve) => { finish = resolve; });
    const app = await loadPluginApp(() => import("./app"));
    const slot = renderSlot(app.navPanels[0]!, { subPath: "PR_123/changes" }, { rpc: {
      list: () => ({ items: [], nextCursor: null, total: 0, coverage }), show: () => item, refresh: () => coverage,
      context: () => ({ threads: [thread], hosts: [], nextCursor: null }), changes: () => pending,
    } });
    expect(await screen.findByText("Loading changes…")).toBeDefined();
    item = { ...item, snapshot: null, sourceState: "auth-changed", sourceMessage: "Account changed" };
    await slot.behavior.emitRealtime(CHANGED, {});
    await screen.findByText("Changes unavailable");
    await act(async () => { finish({ headSha: "abc1234", files: [{ path: "secret.txt", previousPath: null, additions: 1, deletions: 0, status: "added", patch: "+Private diff content" }], total: 1, truncated: false, message: null }); await pending; });
    expect(screen.queryByText("secret.txt")).toBeNull();
    expect(screen.queryByText(/Private diff content/)).toBeNull();
    slot.lifecycle.unmount();
  });
});
