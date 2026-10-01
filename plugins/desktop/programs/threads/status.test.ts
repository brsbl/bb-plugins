import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { DesktopThread } from "../../core";
import { buddyRank, describeStatus, folderSummary, groupTone, idleFor, sortBuddies, statusKind, typingLine } from "./status";

const NOW = Date.UTC(2026, 0, 1, 12);

function thread(overrides: Partial<DesktopThread> = {}): DesktopThread {
  return {
    id: "thr_a",
    title: "Thread",
    projectId: "prj_1",
    sectionId: null,
    hostId: null,
    providerId: "claude-code",
    status: "idle",
    isArchived: false,
    isPinned: false,
    isHidden: false,
    isUnread: false,
    needsInput: false,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("thread status", () => {
  it("puts needing input ahead of everything else", () => {
    const waiting = thread({ needsInput: true, isArchived: true, status: "error" });
    expect(statusKind(waiting)).toBe("attention");
    expect(describeStatus(waiting)).toBe("Needs input");
    expect(typingLine(waiting, "Buddy")).toBe("Buddy is waiting for your reply");
  });

  it("reads each bb status", () => {
    expect(describeStatus(thread({ status: "active" }))).toBe("Working");
    expect(describeStatus(thread({ status: "pending" }))).toBe("Scheduled");
    expect(statusKind(thread({ status: "stopping" }))).toBe("working");
    expect(statusKind(thread({ isArchived: true }))).toBe("archived");
    expect(typingLine(thread({ status: "active" }), "Buddy")).toBe("Buddy is typing...");
  });

  it("says how long an idle buddy has been away", () => {
    expect(idleFor(NOW - 5 * 60_000)).toBe("5m");
    expect(idleFor(NOW - 3 * 3_600_000)).toBe("3h");
    expect(idleFor(NOW - 72 * 3_600_000)).toBe("3d");
    expect(typingLine(thread({ updatedAt: NOW - 2 * 3_600_000 }), "Buddy")).toBe("Buddy has been idle for 2h");
  });

  it("ranks buddies by urgency, then recency", () => {
    const idleOld = thread({ id: "idle-old", updatedAt: NOW - 10 });
    const idleNew = thread({ id: "idle-new" });
    const working = thread({ id: "working", status: "active", updatedAt: NOW - 50 });
    const waiting = thread({ id: "waiting", needsInput: true, updatedAt: NOW - 90 });
    const failed = thread({ id: "failed", status: "error" });
    expect(buddyRank(waiting)).toBeLessThan(buddyRank(working));
    expect(sortBuddies([idleOld, failed, idleNew, working, waiting]).map((buddy) => buddy.id)).toEqual([
      "waiting",
      "working",
      "failed",
      "idle-new",
      "idle-old",
    ]);
  });

  it("summarizes a folder by its most urgent members", () => {
    const members = [thread({ needsInput: true }), thread({ status: "active" }), thread({ needsInput: true })];
    expect(groupTone(members)).toEqual({ tone: "attention", toneCount: 2, unread: false });
    expect(groupTone([thread({ isUnread: true })])).toEqual({ tone: null, toneCount: 1, unread: true });
    expect(folderSummary("Work", 3, "attention", 2)).toBe("Work — 3 threads, 2 need input");
    expect(folderSummary("Work", 1, "running", 1)).toBe("Work — 1 thread, 1 running");
    expect(folderSummary("Work", 0, null, 0)).toBe("Work — empty");
  });
});
