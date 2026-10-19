import { expect, it } from "vitest";
import { refreshHistory, startHistory } from "./dispatch-history.js";

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
