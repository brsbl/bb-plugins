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
  return { id: "github:PR_123", url: snapshot.url, snapshot, reader: { hostId: "host_1", accountId: "account_1", login: "author" }, sourceState: "available", sourceMessage: null, lastAttemptAt: snapshot.fetchedAt, links: [{ threadId: "thr_archived", evidence: "user-explicit", origin: false, environmentId: null, createdAt: snapshot.fetchedAt, actor: "user" }], preferredThreadId: "thr_archived", pinned: false };
}
const thread = { id: "thr_archived", title: "Archived implementation thread", projectId: "proj_1", environmentId: null, hostId: "host_1", archived: true };

describe("Pull Requests access and detail lifetime", () => {
  it("shows passing checks and expands the remaining checks without leaving Summary", async () => {
    const item = fixture();
    item.snapshot!.checks = { state: "passing", passing: 7, failing: 0, pending: 0, total: 7, complete: true, items: Array.from({ length: 7 }, (_, index) => ({ name: `Check ${index + 1}`, state: "passing", url: `https://github.com/example/repo/actions/runs/${index + 1}` })) };
    const app = await loadPluginApp(() => import("./app"));
    const slot = renderSlot(app.navPanels[0]!, { subPath: "github:PR_123/summary" }, { rpc: {
      list: () => ({ items: [], nextCursor: null, total: 0, coverage }), show: () => item, refresh: () => coverage,
      context: () => ({ threads: [thread], hosts: [], nextCursor: null }),
    } });
    expect(await screen.findByRole("link", { name: "Check 1" })).toBeDefined();
    expect(screen.queryByRole("link", { name: "Check 7" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "View 1 more checks" }));
    expect(screen.getByRole("link", { name: "Check 7" })).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Show fewer checks" }));
    expect(screen.queryByRole("link", { name: "Check 7" })).toBeNull();
    expect(slot.inspection.navigateCalls).toEqual([]);
    slot.lifecycle.unmount();
  });

  it("keeps a deep-linked PR outside the list page, then removes private content after access is denied", async () => {
    let item = fixture();
    const app = await loadPluginApp(() => import("./app"));
    const slot = renderSlot(app.navPanels[0]!, { subPath: "github:PR_123/summary" }, { rpc: {
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
    const slot = renderSlot(app.navPanels[0]!, { subPath: "github:PR_123/changes" }, { rpc: {
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
      const slot = renderSlot(app.navPanels[0]!, { subPath: "github:PR_123/changes" }, { rpc: {
        list: () => ({ items: [], nextCursor: null, total: 0, coverage }), show: () => item, refresh: () => coverage,
        context: () => ({ threads: [thread, { ...thread, id: "thr_second", title: "Second thread" }], hosts: [], nextCursor: null }),
        changes: () => ({ headSha: "abc1234", files: [], total: 0, truncated: false, message: null }),
      } });
      fireEvent.click(await screen.findByRole("button", { name: "Choose thread" }));
      expect(slot.inspection.navigateCalls).toContainEqual({ method: "toPluginPanel", path: "requests", options: { subPath: "github:PR_123/summary" } });
      slot.lifecycle.rerender(<Panel subPath="github:PR_123/summary" />);
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
      fireEvent.click(await screen.findByRole("button", { name: "Link a pull request" }));
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


describe("Compact pull request inbox", () => {
  it("combines author and requested reviewer filters, sorts within sections, and preserves them across navigation", async () => {
    const first = fixture();
    first.snapshot = { ...first.snapshot!, title: "Zebra fix", author: "author", updatedAt: "2026-10-01T00:00:00Z", requestedReviewers: ["reviewer", "acme/design"], reviewRequestsComplete: true };
    const second = { ...first, id: "github:PR_124", snapshot: { ...first.snapshot, title: "Alpha fix", updatedAt: "2026-10-02T00:00:00Z", requestedReviewers: ["reviewer"] } };
    const third = { ...first, id: "github:PR_125", snapshot: { ...first.snapshot, title: "Other author", author: "bob", requestedReviewers: ["AUTHOR"] } };
    const app = await loadPluginApp(() => import("./app"));
    const options = { rpc: { list: () => ({ items: [first, second, third], nextCursor: null, total: 3, coverage }), refresh: () => coverage, context: () => ({ threads: [thread], hosts: [], nextCursor: null }) } };
    let slot = renderSlot(app.navPanels[0]!, { subPath: "" }, options);
    await screen.findByRole("button", { name: "Zebra fix" });
    const titles = () => Array.from(document.querySelectorAll(".pr-row-title")).map((element) => element.textContent);
    expect(titles()).toEqual(["Alpha fix", "Zebra fix", "Other author"]);
    const choose = async (path: string[], label: string) => {
      fireEvent.keyDown(screen.getByRole("button", { name: "Filters and sort" }), { key: "ArrowDown" });
      for (const name of path) fireEvent.keyDown(await screen.findByRole("menuitem", { name }), { key: "ArrowRight" });
      fireEvent.click(await screen.findByRole("menuitemradio", { name: label }));
      await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());
    };
    await choose(["Filter", "Author"], "Me");
    await choose(["Filter", "Reviewer"], "acme/design");
    expect(titles()).toEqual(["Zebra fix"]);
    await choose(["Filter", "Reviewer"], "reviewer");
    await choose(["Sort by"], "Oldest updated");
    expect(titles()).toEqual(["Zebra fix", "Alpha fix"]);
    slot.lifecycle.unmount();
    slot = renderSlot(app.navPanels[0]!, { subPath: "" }, options);
    await screen.findByRole("button", { name: "Zebra fix" });
    expect(titles()).toEqual(["Zebra fix", "Alpha fix"]);
    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    await choose(["Filter", "Reviewer"], "Me");
    expect(titles()).toEqual(["Other author"]);
    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    await choose(["Sort by"], "Recently updated");
    fireEvent.keyDown(screen.getByRole("button", { name: "Filters and sort" }), { key: "ArrowDown" });
    await screen.findByRole("menuitem", { name: "Filter" });
    expect(screen.queryByText("Link pull request")).toBeNull();
    expect(screen.queryByText("Discover archived threads")).toBeNull();
    fireEvent.keyDown(document.activeElement!, { key: "Escape" });
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole("button", { name: "Filters and sort" })));
    slot.lifecycle.unmount();
  });

  it("drills into mobile filters and returns through the hierarchy with Escape", async () => {
    vi.stubGlobal("matchMedia", () => ({ matches: true, addEventListener() {}, removeEventListener() {} }));
    try {
      const item = fixture();
      const app = await loadPluginApp(() => import("./app"));
      const slot = renderSlot(app.navPanels[0]!, { subPath: "" }, { rpc: {
        list: () => ({ items: [item], nextCursor: null, total: 1, coverage }), refresh: () => coverage,
        context: () => ({ threads: [thread], hosts: [], nextCursor: null }),
      } });
      await screen.findByRole("button", { name: "Private pull request" });
      fireEvent.keyDown(screen.getByRole("button", { name: "Filters and sort" }), { key: "ArrowDown" });
      fireEvent.click(await screen.findByRole("menuitem", { name: "Filter" }));
      fireEvent.click(await screen.findByRole("menuitem", { name: "Author" }));
      await screen.findByRole("menuitemradio", { name: "All authors" });
      expect(screen.getAllByRole("menu")).toHaveLength(1);
      fireEvent.keyDown(document.activeElement!, { key: "Escape" });
      await screen.findByRole("menuitem", { name: "Reviewer" });
      fireEvent.click(screen.getByRole("menuitem", { name: "Back to Filters and sort" }));
      await screen.findByRole("menuitem", { name: "Sort by" });
      fireEvent.keyDown(document.activeElement!, { key: "Escape" });
      await waitFor(() => expect(document.activeElement).toBe(screen.getByRole("button", { name: "Filters and sort" })));
      slot.lifecycle.unmount();
    } finally { vi.unstubAllGlobals(); }
  });

  it("opens a known pasted URL and keeps legacy snapshots without reviewer metadata readable", async () => {
    const item = fixture();
    const app = await loadPluginApp(() => import("./app"));
    const slot = renderSlot(app.navPanels[0]!, { subPath: "" }, { rpc: {
      list: () => ({ items: [item], nextCursor: null, total: 1, coverage }), refresh: () => coverage,
      context: () => ({ threads: [thread], hosts: [], nextCursor: null }),
    } });
    await screen.findByRole("button", { name: "Private pull request" });
    const search = screen.getByRole("textbox", { name: "Search pull requests" });
    fireEvent.change(search, { target: { value: item.url } });
    fireEvent.submit(search.closest("form")!);
    expect(slot.inspection.navigateCalls).toContainEqual({ method: "toPluginPanel", path: "requests", options: { subPath: "github:PR_123/summary" } });
    fireEvent.click(screen.getByRole("button", { name: "Clear search" }));
    slot.lifecycle.unmount();
  });
});
