// @vitest-environment jsdom
import { cleanup, fireEvent, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { loadPluginApp, renderSlot } from "@get-bb/plugin-sdk/testing/app";

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

type Request = { threadId: string; includeNestedRows?: string; segmentLimit?: string; beforeAnchorId?: string; beforeAnchorSeq?: string };
const cursor = (anchorSeq: number) => ({ anchorId: `sample-window-${anchorSeq}`, anchorSeq });
const brief = { id: "brief", kind: "conversation", role: "user", initiator: "user", createdAt: 1, text: "Calculate the synthetic total." };
const reply = (id: string, createdAt: number, text: string) => ({
  id, kind: "conversation", role: "user", createdAt, sourceSeqStart: createdAt, sourceSeqEnd: createdAt, initiator: "system", systemMessageKind: "child-completed",
  systemMessageSubject: { kind: "thread", threadId: "sample-worker" }, text,
});
const recent = reply("recent", 30, "Synthetic total: 42.");
const older = reply("older", 20, "Checked the sample input.");
const oldest = reply("oldest", 10, "Started the sample calculation.");
const collapsed = (children: unknown[]) => ({ id: "collapsed-turn", kind: "turn", createdAt: 1, children });

async function panel(read: (args: Request) => unknown) {
  const timeline = vi.fn(async (args: Request) => read(args) as never);
  const app = await loadPluginApp(() => import("./app.js"));
  const slot = renderSlot(app.threadPanelActions[0]!, { threadId: "sample-lead", params: { counterpart: "sample-worker" } }, {
    sidebarThreads: { threads: ["sample-worker", "sample-other"].map((id) => ({
      id, parentThreadId: "sample-lead", originKind: null, isArchived: false, displayTitle: id, updatedAt: 1,
    })) as never },
    sdk: { threads: { timeline } },
  });
  return { slot, timeline };
}

it.each([{ hasOlderRows: false }, { olderCursor: null }, {}])("shows nested completed replies once when history is complete: %j", async (timelinePage) => {
  const { slot, timeline } = await panel(({ threadId, includeNestedRows }) => ({
    rows: threadId === "sample-lead" ? [collapsed(includeNestedRows === "true" ? [recent, collapsed([recent, older])] : [])] : [brief],
    timelinePage,
  }));
  await slot.findByText("Calculate the synthetic total.");
  expect(slot.getAllByText("Synthetic total: 42.")).toHaveLength(1);
  expect(Array.from(slot.container.querySelectorAll(".dp-reply"), (row) => row.textContent)).toEqual([older.text, recent.text]);
  expect(timeline.mock.calls.every(([args]) => !args.beforeAnchorId)).toBe(true);
});

it("follows multiple cursors despite a fixed latest window, retains nested replies, and stops at the beginning", async () => {
  const { slot, timeline } = await panel(({ threadId, beforeAnchorId, beforeAnchorSeq }) => {
    // The event budget fixes the latest window, regardless of segmentLimit.
    const page = beforeAnchorId === cursor(20).anchorId ? 1 : beforeAnchorId === cursor(10).anchorId ? 2 : 0;
    if (beforeAnchorId) expect(beforeAnchorSeq).toBe(page === 1 ? "20" : "10");
    return {
      rows: threadId === "sample-lead" ? [collapsed(page === 0 ? [recent] : page === 1 ? [older, recent] : [oldest, older])]
        : threadId === "sample-worker" && page === 2 ? [brief] : [],
      timelinePage: { olderCursor: page === 2 ? null : cursor(page === 0 ? 20 : 10), historySnapshot: "sample-snapshot" },
    };
  });
  await slot.findByText("Calculate the synthetic total.");
  expect(Array.from(slot.container.querySelectorAll(".dp-reply"), (row) => row.textContent)).toEqual([oldest.text, older.text, recent.text]);
  for (const id of ["sample-lead", "sample-worker"]) {
    expect(timeline.mock.calls.filter(([args]) => args.threadId === id).map(([args]) => args.beforeAnchorId ?? "latest")).toEqual([
      "latest", cursor(20).anchorId, cursor(10).anchorId,
    ]);
  }
  expect(timeline.mock.calls.filter(([args]) => args.threadId === "sample-other")).toHaveLength(1);
  expect(timeline.mock.calls.every(([args]) => args.segmentLimit === "20" && args.includeNestedRows === "true")).toBe(true);
  const reads = timeline.mock.calls.length;
  fireEvent.scroll(slot.getByRole("tabpanel"));
  expect(timeline).toHaveBeenCalledTimes(reads);
});

it("stops a repeated cursor and explains where to find remaining history", async () => {
  const { slot, timeline } = await panel(({ threadId }) => ({
    rows: threadId === "sample-lead" ? [recent] : [],
    timelinePage: { olderCursor: cursor(20), historySnapshot: "sample-snapshot" },
  }));
  await slot.findByText(/Earlier messages are available in the threads/);
  expect(timeline.mock.calls.filter(([args]) => args.beforeAnchorId)).toHaveLength(2);
  fireEvent.scroll(slot.getByRole("tabpanel"));
  expect(timeline.mock.calls.filter(([args]) => args.beforeAnchorId)).toHaveLength(2);
});

it("keeps bounded window growth for legacy servers without cursors", async () => {
  const { slot, timeline } = await panel(({ threadId, segmentLimit }) => ({
    rows: threadId === "sample-lead" ? [recent] : Number(segmentLimit) === 100 ? [brief] : [],
    timelinePage: { hasOlderRows: Number(segmentLimit) < 100 },
  }));
  await slot.findByText("Calculate the synthetic total.");
  await waitFor(() => expect(timeline.mock.calls.some(([args]) => args.segmentLimit === "100")).toBe(true));
  expect(timeline.mock.calls.every(([args]) => Number(args.segmentLimit) <= 100 && !args.beforeAnchorId)).toBe(true);
});

it("bounds an endless advancing cursor walk and exposes the history limit", async () => {
  const { slot, timeline } = await panel(({ threadId, beforeAnchorSeq }) => ({
    rows: threadId === "sample-lead" ? [recent] : [],
    timelinePage: { olderCursor: cursor(Number(beforeAnchorSeq ?? 100) - 1), historySnapshot: "sample-snapshot" },
  }));
  await slot.findByText(/Earlier messages are available in the threads/);
  for (const id of ["sample-lead", "sample-worker"]) {
    expect(timeline.mock.calls.filter(([args]) => args.threadId === id)).toHaveLength(20);
  }
  const reads = timeline.mock.calls.length;
  fireEvent.scroll(slot.getByRole("tabpanel"));
  expect(timeline).toHaveBeenCalledTimes(reads);
});

it("recovers an unavailable cursor from latest and waits for retry", async () => {
  let stale = true;
  const { slot, timeline } = await panel(({ threadId, beforeAnchorId }) => {
    if (beforeAnchorId && stale) throw new Error("The cursor is no longer available. Reload latest.");
    return {
      rows: threadId === "sample-lead" ? [recent] : beforeAnchorId ? [brief] : [],
      timelinePage: { olderCursor: beforeAnchorId ? null : cursor(20), historySnapshot: "sample-snapshot" },
    };
  });
  await slot.findByText(/Couldn't load older messages/);
  const reads = timeline.mock.calls.length;
  fireEvent.scroll(slot.getByRole("tabpanel"));
  expect(timeline).toHaveBeenCalledTimes(reads);
  stale = false;
  fireEvent.click(slot.getByRole("button", { name: "Retry" }));
  await slot.findByText("Calculate the synthetic total.");
  expect(slot.queryByText(/Couldn't load older messages/)).toBeNull();
});


it("keeps loaded older messages and the reader's position when new events refresh the tail", async () => {
  let appended = false;
  vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible");
  const { slot, timeline } = await panel(({ threadId, beforeAnchorSeq }) => {
    if (threadId !== "sample-lead") return { rows: [brief], timelinePage: { olderCursor: null } };
    const page = beforeAnchorSeq === "20" ? 1 : beforeAnchorSeq === "10" ? 2 : 0;
    return {
      rows: [collapsed(page === 0 ? [recent, ...(appended ? [reply("new", 40, "New tail reply.")] : [])] : page === 1 ? [older] : [oldest])],
      maxSeq: appended ? 40 : 30,
      timelinePage: { olderCursor: page === 2 ? null : cursor(page === 0 ? 20 : 10), historySnapshot: appended ? "second" : "first", olderRowsSourceSeqEnd: null },
    };
  });
  await slot.findByText(oldest.text);
  const channel = slot.getByRole("tabpanel");
  Object.defineProperties(channel, { scrollHeight: { get: () => channel.querySelectorAll("li").length * 100 }, clientHeight: { value: 100 } });
  channel.scrollTop = 100;
  fireEvent.scroll(channel);
  const olderReads = timeline.mock.calls.filter(([args]) => args.beforeAnchorId).length;
  appended = true;
  fireEvent(document, new Event("visibilitychange"));
  await slot.findByText("New tail reply.");
  expect(slot.getAllByText(oldest.text)).toHaveLength(1);
  expect(slot.getAllByText(older.text)).toHaveLength(1);
  expect(channel.scrollTop).toBe(100);
  expect(timeline.mock.calls.filter(([args]) => args.beforeAnchorId)).toHaveLength(olderReads);
});
