import { expect, it } from "vitest";
import { readOlder, refreshHistory, startHistory } from "./dispatch-history.js";

const row = (id: string, createdAt: number, text = id) => ({ id, createdAt, sourceSeqStart: createdAt, sourceSeqEnd: createdAt, text, kind: "conversation", role: "user" }) as never;

it("bounds retained rows and content without calling truncated history complete", () => {
  const many = startHistory({ rows: Array.from({ length: 2_001 }, (_, i) => row(String(i), i)), complete: true, cursor: null });
  expect(many.rows).toHaveLength(2_000);
  expect(many).toMatchObject({ limited: true, complete: false });
  const large = startHistory({ rows: [row("large", 1, "x".repeat(1_000_001)), row("recent", 2)], complete: true, cursor: null });
  expect(large.rows.map((item) => item.id)).toEqual(["recent"]);
  expect(large).toMatchObject({ limited: true, complete: false });
});

it("keeps three loaded pages and their deeper cursor when a new snapshot only appends rows", () => {
  const previous = { ...startHistory({ rows: [row("old", 10), row("middle", 40), row("recent", 80)], complete: false, cursor: { anchorId: "deep", anchorSeq: 5 }, snapshot: "first" }), pages: 3, maxSeq: 100, surface: "sample" };
  const latest = { rows: [row("recent", 80), row("new", 120)], complete: false, cursor: { anchorId: "latest", anchorSeq: 60 }, snapshot: "second", maxSeq: 120, olderRowsSourceSeqEnd: 40, surface: "sample" };
  const merged = refreshHistory(previous, latest);
  expect(merged.rows.map((item) => item.id)).toEqual(["old", "middle", "recent", "new"]);
  expect(merged).toMatchObject({ pages: 3, cursor: previous.cursor, snapshot: "second", maxSeq: 120 });
});

it("restarts when a loaded row disappears from the latest window", () => {
  const previous = { ...startHistory({ rows: [row("old", 10), row("removed", 70), row("recent", 80)], complete: false, cursor: { anchorId: "deep", anchorSeq: 5 }, snapshot: "first" }), pages: 3, maxSeq: 100, surface: "sample" };
  const latest = { rows: [row("recent", 80), row("new", 120)], complete: false, cursor: { anchorId: "latest", anchorSeq: 60 }, snapshot: "second", maxSeq: 120, olderRowsSourceSeqEnd: 10, surface: "sample" };
  const merged = refreshHistory(previous, latest);
  expect(merged.rows.map((item) => item.id)).toEqual(["recent", "new"]);
  expect(merged).toMatchObject({ pages: 1, cursor: latest.cursor, snapshot: "second" });
});


it.each([
  { name: "older row changed beyond the loaded tip", olderRowsSourceSeqEnd: 110 },
  { name: "latest window no longer reaches the loaded tip", cursor: { anchorId: "gap", anchorSeq: 102 } },
  { name: "display surface changed", surface: "changed" },
])("restarts when $name", (change) => {
  const previous = { ...startHistory({ rows: [row("old", 10), row("recent", 80)], complete: false, cursor: { anchorId: "deep", anchorSeq: 5 }, snapshot: "first" }), pages: 3, maxSeq: 100, surface: "sample" };
  const latest = { rows: [row("recent", 80), row("new", 120)], complete: false, cursor: { anchorId: "latest", anchorSeq: 60 }, snapshot: "second", maxSeq: 120, olderRowsSourceSeqEnd: null, surface: "sample", ...change };
  expect(refreshHistory(previous, latest)).toMatchObject({ pages: 1, cursor: latest.cursor, rows: latest.rows });
});

it("merges updates only into loaded older rows and keeps a deeper cursor at the same sequence", () => {
  const previous = { ...startHistory({ rows: [row("old", 10), row("recent", 80)], complete: false, cursor: { anchorId: "deep-content", anchorSeq: 60 }, snapshot: "first" }), pages: 3, maxSeq: 100, surface: "sample" };
  const latest = { rows: [row("recent", 80), row("new", 120)], complete: false, cursor: { anchorId: "latest-content", anchorSeq: 60 }, snapshot: "second", maxSeq: 120, olderRowsSourceSeqEnd: null, surface: "sample", updates: [row("old", 70, "Updated older message"), row("unloaded", 50)] };
  const merged = refreshHistory(previous, latest);
  expect(merged.rows.map((item) => item.text)).toEqual(["Updated older message", "recent", "new"]);
  expect(merged).toMatchObject({ pages: 3, cursor: previous.cursor, snapshot: "second" });
});

it("keeps the refreshed latest tip when continuing a cursor from the earlier snapshot", async () => {
  const history = { ...startHistory({ rows: [row("recent", 120)], complete: false, cursor: { anchorId: "old-cursor", anchorSeq: 60 }, snapshot: "second" }), maxSeq: 120, surface: "sample" };
  const sdk = { threads: { timeline: async () => ({ rows: [row("older", 10)], maxSeq: 100, timelinePage: { olderCursor: null, historySnapshot: "first" } }) } } as never;
  const merged = await readOlder(sdk, "sample-thread", history, new AbortController().signal);
  expect(merged).toMatchObject({ snapshot: "second", maxSeq: 120, surface: "sample", complete: true });
  expect(merged.rows.map((item) => item.id)).toEqual(["older", "recent"]);
});
