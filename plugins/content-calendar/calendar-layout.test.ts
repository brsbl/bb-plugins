import { describe, expect, it } from "vitest";
import {
  cellNumber, dayName, dropPlacement, gridWeeks, keyboardStep, parseDirective, parsePullRequest, parseSubPath, placementPos,
  rangeLabel, rangeSubPath, samePlace, scheduledBefore, shiftRange, switchView, syncLabel,
} from "./calendar-layout.js";

describe("ranges", () => {
  it("parses page subpaths and defaults to the current month", () => {
    expect(parseSubPath("month/2026-10", "2026-10-07")).toEqual({ view: "month", start: "2026-10" });
    expect(parseSubPath("week/2026-10-07", "2026-10-07")).toEqual({ view: "week", start: "2026-10-05" });
    expect(parseSubPath("", "2026-10-07")).toEqual({ view: "month", start: "2026-10" });
    expect(parseSubPath("week/2026-02-30", "2026-10-07")).toEqual({ view: "month", start: "2026-10" });
    expect(rangeSubPath({ view: "week", start: "2026-10-05" })).toBe("week/2026-10-05");
  });

  it("lays a month out in Monday-to-Sunday weeks", () => {
    const weeks = gridWeeks({ view: "month", start: "2026-10" });
    expect(weeks).toHaveLength(5);
    expect(weeks[0]![0]).toBe("2026-09-28");
    expect(weeks.at(-1)![6]).toBe("2026-11-01");
    expect(gridWeeks({ view: "week", start: "2026-10-05" })).toEqual([["2026-10-05", "2026-10-06", "2026-10-07", "2026-10-08", "2026-10-09", "2026-10-10", "2026-10-11"]]);
  });

  it("steps months and weeks across year ends", () => {
    expect(shiftRange({ view: "month", start: "2026-12" }, 1)).toEqual({ view: "month", start: "2027-01" });
    expect(shiftRange({ view: "month", start: "2026-01" }, -1)).toEqual({ view: "month", start: "2025-12" });
    expect(shiftRange({ view: "week", start: "2026-12-28" }, 1)).toEqual({ view: "week", start: "2027-01-04" });
  });

  it("switches views around the period in view", () => {
    expect(switchView({ view: "month", start: "2026-10" }, "week", "2026-10-07")).toEqual({ view: "week", start: "2026-10-05" });
    expect(switchView({ view: "month", start: "2026-11" }, "week", "2026-10-07")).toEqual({ view: "week", start: "2026-10-26" });
    expect(switchView({ view: "week", start: "2026-10-05" }, "month", "2026-10-07")).toEqual({ view: "month", start: "2026-10" });
  });

  it("labels ranges and days", () => {
    expect(rangeLabel({ view: "month", start: "2026-10" })).toBe("October 2026");
    expect(rangeLabel({ view: "week", start: "2026-10-05" })).toBe("Oct 5 – 11, 2026");
    expect(rangeLabel({ view: "week", start: "2026-09-28" })).toBe("Sep 28 – Oct 4, 2026");
    expect(rangeLabel({ view: "week", start: "2026-12-28" })).toBe("Dec 28, 2026 – Jan 3, 2027");
    expect(dayName("2026-10-28")).toBe("Wednesday, October 28");
    expect(cellNumber("2026-10-01", false)).toBe("Oct 1");
    expect(cellNumber("2026-09-28", true)).toBe("Sep 28");
    expect(cellNumber("2026-10-14", false)).toBe("14");
  });
});

describe("directive", () => {
  it("accepts week and month starts", () => {
    expect(parseDirective({ view: "week", start: "2026-10-07" })).toEqual({ ok: true, range: { view: "week", start: "2026-10-05" } });
    expect(parseDirective({ view: "month", start: "2026-10" })).toEqual({ ok: true, range: { view: "month", start: "2026-10" } });
    expect(parseDirective({ view: "month", start: "2026-10-12" })).toEqual({ ok: true, range: { view: "month", start: "2026-10" } });
  });

  it("rejects bad attributes", () => {
    expect(parseDirective({ view: "year", start: "2026" }).ok).toBe(false);
    expect(parseDirective({ view: "week" }).ok).toBe(false);
    expect(parseDirective({ view: "month", start: "2026-13" }).ok).toBe(false);
  });
});

describe("moving", () => {
  const day = [{ id: "a", pos: 1 }, { id: "b", pos: 2 }, { id: "c", pos: 3 }];

  it("moves a day or a week with the arrows", () => {
    expect(keyboardStep("2026-10-28", "ArrowRight")).toBe("2026-10-29");
    expect(keyboardStep("2026-10-01", "ArrowLeft")).toBe("2026-09-30");
    expect(keyboardStep("2026-10-28", "ArrowDown")).toBe("2026-11-04");
    expect(keyboardStep("2026-10-28", "ArrowUp")).toBe("2026-10-21");
    expect(keyboardStep("2026-10-28", "Enter")).toBeNull();
  });

  it("places drops before or after their target", () => {
    expect(dropPlacement(day, "c", "a")).toEqual({ before: "a" });
    expect(dropPlacement(day, "a", "c")).toEqual({ after: "c" });
    expect(dropPlacement(day, "x", "b")).toEqual({ before: "b" });
    expect(dropPlacement(day, "x", null)).toEqual({ after: "c" });
    expect(dropPlacement([], "x", null)).toEqual({});
    expect(dropPlacement(day, "b", "b")).toEqual({ before: "c" });
  });

  it("computes optimistic positions between neighbours", () => {
    expect(placementPos(day, "c", { before: "a" })).toBe(0);
    expect(placementPos(day, "c", { before: "b" })).toBe(1.5);
    expect(placementPos(day, "a", { after: "c" })).toBe(4);
    expect(placementPos([], "x", {})).toBe(0);
  });

  it("knows when a drop changes nothing", () => {
    expect(samePlace(day, "b", { before: "c" })).toBe(true);
    expect(samePlace(day, "b", { after: "a" })).toBe(true);
    expect(samePlace(day, "a", { after: "c" })).toBe(false);
  });
});

describe("details", () => {
  it("flags items scheduled before what they wait on", () => {
    const item = {
      date: "2026-10-27",
      waitsOn: [
        { id: "g1", kind: "item" as const, itemId: "cc_aaaa", cleared: false, title: "Orchestration blog post", date: "2026-10-28" },
        { id: "g2", kind: "item" as const, itemId: "cc_bbbb", cleared: false, title: null, date: null },
        { id: "g3", kind: "item" as const, itemId: "cc_cccc", cleared: false, title: "Earlier", date: "2026-10-01" },
      ],
    };
    expect(scheduledBefore(item)).toEqual([{ title: "Orchestration blog post", date: "2026-10-28" }]);
    expect(scheduledBefore({ ...item, date: null })).toEqual([]);
  });

  it("parses pull request references", () => {
    expect(parsePullRequest("get-bb/bb#4772")).toEqual({ repo: "get-bb/bb", number: 4772 });
    expect(parsePullRequest("https://github.com/get-bb/bb/pull/4772/files")).toEqual({ repo: "get-bb/bb", number: 4772 });
    expect(parsePullRequest("#4772")).toBeNull();
  });

  it("describes the sync state", () => {
    const now = Date.parse("2026-10-07T17:43:00Z");
    expect(syncLabel({ state: "synced", lastSyncedAt: "2026-10-07T17:42:00Z" }, now)).toEqual({ text: "Synced 1 min ago", tone: "ok" });
    expect(syncLabel({ state: "syncing", lastSyncedAt: null }, now).text).toBe("Syncing…");
    expect(syncLabel({ state: "offline", lastSyncedAt: "2026-10-07T17:42:00Z" }, now).text).toMatch(/^Offline · last synced 10:42\sAM$/);
    expect(syncLabel({ state: "reconnect", lastSyncedAt: null }, now).text).toBe("Reconnect Google Calendar");
  });
});
