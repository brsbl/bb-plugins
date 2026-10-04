// @vitest-environment jsdom
import { act, cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import { loadPluginApp, renderSlot } from "@get-bb/plugin-sdk/testing/app";
import { afterEach, describe, expect, it, vi } from "vitest";
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


describe("Pull Requests thread selection", () => {
  it("opens Summary and focuses Threads when Choose thread is used from Changes", async () => {
    const item = fixture();
    item.preferredThreadId = null;
    item.links.push({ ...item.links[0]!, threadId: "thr_second" });
    const scroll = vi.fn();
    const previousScroll = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "scrollIntoView");
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", { configurable: true, value: scroll });
    try {
      const app = await loadPluginApp(() => import("./app"));
      const Panel = app.navPanels[0]!.component;
      const slot = renderSlot(app.navPanels[0]!, { subPath: "PR_123/changes" }, { rpc: {
        list: () => ({ items: [], nextCursor: null, total: 0, coverage }), show: () => item, refresh: () => coverage,
        context: () => ({ threads: [thread, { ...thread, id: "thr_second", title: "Second thread" }], hosts: [], nextCursor: null }),
        changes: () => ({ headSha: "abc1234", files: [], total: 0, truncated: false, message: null }),
      } });
      fireEvent.click(await screen.findByRole("button", { name: "Choose thread" }));
      expect(slot.inspection.navigateCalls).toContainEqual({ method: "toPluginPanel", path: "requests", options: { subPath: "PR_123/summary" } });
      slot.lifecycle.rerender(<Panel subPath="PR_123/summary" />);
      await waitFor(() => expect(document.activeElement).toBe(screen.getByRole("region", { name: "Related threads" })));
      expect(scroll).toHaveBeenCalledWith({ behavior: "smooth", block: "center" });
      slot.lifecycle.unmount();
    } finally {
      if (previousScroll) Object.defineProperty(HTMLElement.prototype, "scrollIntoView", previousScroll);
      else Reflect.deleteProperty(HTMLElement.prototype, "scrollIntoView");
    }
  });

  it("continues empty filtered pages in bounded batches and retains the selected thread when search changes", async () => {
    const previousShow = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, "showModal");
    Object.defineProperty(HTMLDialogElement.prototype, "showModal", { configurable: true, value(this: HTMLDialogElement) { this.open = true; } });
    try {
      const app = await loadPluginApp(() => import("./app"));
      const slot = renderSlot(app.navPanels[0]!, { subPath: "" }, { rpc: {
        list: () => ({ items: [], nextCursor: null, total: 0, coverage }), refresh: () => coverage,
        context: (raw) => {
          const input = raw as { query?: string; cursor?: string };
          if (input.query === undefined || input.query === "different query") return { threads: [], hosts: [], nextCursor: null };
          const offset = Number(input.cursor ?? 0);
          return { threads: offset === 500 ? [thread] : [], hosts: [], nextCursor: offset < 500 ? String(offset + 100) : null };
        },
      } });
      fireEvent.click(screen.getByRole("button", { name: "Link pull request" }));
      fireEvent.click(await screen.findByRole("button", { name: "Search more threads" }));
      expect(await screen.findByRole("option", { name: "Archived implementation thread · archived" })).toBeDefined();
      const select = screen.getByRole("combobox", { name: "Thread" }) as HTMLSelectElement;
      fireEvent.change(select, { target: { value: thread.id } });
      fireEvent.change(screen.getByRole("searchbox", { name: "Find thread" }), { target: { value: "different query" } });
      await screen.findByText("0 matching threads · search complete");
      expect(select.value).toBe(thread.id);
      expect(screen.getByRole("option", { name: "Archived implementation thread · archived" })).toBeDefined();
      slot.lifecycle.unmount();
    } finally {
      if (previousShow) Object.defineProperty(HTMLDialogElement.prototype, "showModal", previousShow);
      else Reflect.deleteProperty(HTMLDialogElement.prototype, "showModal");
    }
  });
});
