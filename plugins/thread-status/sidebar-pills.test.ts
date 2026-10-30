// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";

import { applyPills, parseStatuses, removePills, type StatusMap } from "./sidebar-pills";
import type { ThreadStatus } from "./status";

function row(threadId: string, title = "Fix the thing"): string {
  return `<span data-row="${threadId}"><a data-sidebar-thread-id="${threadId}"></a><span class="contents"><span><span class="bb-thread-title"><span class="truncate">${title}</span></span></span><button aria-expanded="true"></button></span></span>`;
}

function statuses(entries: Record<string, Omit<ThreadStatus, "updatedAt">>): StatusMap {
  return new Map(Object.entries(entries).map(([id, status]) => [id, { ...status, updatedAt: 1 }]));
}

afterEach(() => document.body.replaceChildren());

function title(threadId: string): Element {
  return document.querySelector(`[data-row="${threadId}"] .bb-thread-title`)!;
}

function pill(threadId: string): [string | null, string | null] {
  return [title(threadId).getAttribute("data-thread-status"), title(threadId).getAttribute("data-thread-status-tone")];
}

describe("applyPills", () => {
  it("anchors the status to the title of rows that have one", () => {
    document.body.innerHTML = `<div data-sidebar="sidebar">${row("thr_a")}${row("thr_b")}</div>`;
    applyPills(document, statuses({ thr_a: { label: "CI red", tone: "danger" } }));
    expect(pill("thr_a")).toEqual(["CI red", "danger"]);
    expect(pill("thr_b")).toEqual([null, null]);
  });

  it("leaves the row's DOM structure untouched", () => {
    document.body.innerHTML = `<div data-sidebar="sidebar">${row("thr_a")}</div>`;
    const before = document.querySelector("[data-row]")!.childElementCount;
    applyPills(document, statuses({ thr_a: { label: "CI red", tone: "danger" } }));
    expect(document.querySelector("[data-row]")!.childElementCount).toBe(before);
    expect(title("thr_a").childElementCount).toBe(1);
  });

  it("updates and removes the status as it changes", () => {
    document.body.innerHTML = `<div data-sidebar="sidebar">${row("thr_a")}</div>`;
    applyPills(document, statuses({ thr_a: { label: "Drafting", tone: "info" } }));
    applyPills(document, statuses({ thr_a: { label: "Done", tone: "success" } }));
    expect(pill("thr_a")).toEqual(["Done", "success"]);
    applyPills(document, new Map());
    expect(pill("thr_a")).toEqual([null, null]);
  });

  it("re-anchors to a title the sidebar re-rendered", () => {
    document.body.innerHTML = `<div data-sidebar="sidebar">${row("thr_a")}</div>`;
    const status = statuses({ thr_a: { label: "Done", tone: "success" } });
    applyPills(document, status);
    const fresh = document.createElement("span");
    fresh.className = "bb-thread-title";
    title("thr_a").replaceWith(fresh);
    applyPills(document, status);
    expect(pill("thr_a")).toEqual(["Done", "success"]);
  });

  it("ignores thread links outside the sidebar", () => {
    document.body.innerHTML = `<div>${row("thr_a")}</div>`;
    applyPills(document, statuses({ thr_a: { label: "Done", tone: "success" } }));
    expect(pill("thr_a")).toEqual([null, null]);
  });

  it("removes every status on dispose", () => {
    document.body.innerHTML = `<div data-sidebar="sidebar">${row("thr_a")}</div>`;
    applyPills(document, statuses({ thr_a: { label: "Done", tone: "success" } }));
    removePills(document);
    expect(pill("thr_a")).toEqual([null, null]);
  });
});

describe("parseStatuses", () => {
  it("keeps valid statuses and drops malformed ones", () => {
    const parsed = parseStatuses({ ok: true, result: { statuses: { a: { label: "Done", tone: "success", updatedAt: 1 }, b: { label: "x", tone: "purple", updatedAt: 1 } } } });
    expect([...parsed!.keys()]).toEqual(["a"]);
  });

  it("rejects error envelopes", () => {
    expect(parseStatuses({ ok: false, error: {} })).toBeNull();
  });
});
