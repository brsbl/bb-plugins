import { expect, it } from "vitest";
import { refreshHistory, startHistory } from "./dispatch-history.js";

const row = (id: string, createdAt: number, text = id) => ({ id, createdAt, text, kind: "conversation", role: "user" }) as never;

it("bounds retained rows and content without calling truncated history complete", () => {
  const many = startHistory({ rows: Array.from({ length: 2_001 }, (_, i) => row(String(i), i)), complete: true, cursor: null });
  expect(many.rows).toHaveLength(2_000);
  expect(many).toMatchObject({ limited: true, complete: false });
  const large = startHistory({ rows: [row("large", 1, "x".repeat(1_000_001)), row("recent", 2)], complete: true, cursor: null });
  expect(large.rows.map((item) => item.id)).toEqual(["recent"]);
  expect(large).toMatchObject({ limited: true, complete: false });
});

it("keeps loaded history for the same snapshot and restarts when the snapshot changes", () => {
  const previous = startHistory({ rows: [row("old", 1), row("recent", 2)], complete: true, cursor: null, snapshot: "first" });
  const latest = { rows: [row("recent", 2)], complete: false, cursor: { anchorId: "sample-window", anchorSeq: 1 }, snapshot: "first" };
  expect(refreshHistory(previous, latest).rows.map((item) => item.id)).toEqual(["old", "recent"]);
  expect(refreshHistory(previous, latest).complete).toBe(true);
  const changed = refreshHistory(previous, { ...latest, snapshot: "second" });
  expect(changed.rows.map((item) => item.id)).toEqual(["recent"]);
  expect(changed).toMatchObject({ pages: 1, complete: false, cursor: latest.cursor });
});
