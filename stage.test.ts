import { describe, expect, it } from "vitest";

import {
  quietCompactions,
  createReadOrder,
  EMPTY_STAGE,
  isThreadWorking,
  resolveStage,
} from "./stage";

describe("resolveStage", () => {
  it("brings the first thread on stage", () => {
    const result = resolveStage(EMPTY_STAGE, { threadId: "thr_a", working: true });
    expect(result.state).toEqual({ threadId: "thr_a", mode: "rolling" });
    expect(result.handoff).toEqual({ exitingThreadId: null, enteringThreadId: "thr_a" });
  });

  it("stops rolling when the thread stops working", () => {
    const result = resolveStage(
      { threadId: "thr_a", mode: "rolling" },
      { threadId: "thr_a", working: false },
    );
    expect(result.state.mode).toBe("resting");
    expect(result.handoff).toBeNull();
  });

  it("keeps the last cousin waiting on a non-thread page", () => {
    const result = resolveStage(
      { threadId: "thr_a", mode: "rolling" },
      { threadId: null, working: false },
    );
    expect(result.state).toEqual({ threadId: "thr_a", mode: "waiting" });
    expect(result.handoff).toBeNull();
  });

  it("resumes the same cousin without a handoff after waiting", () => {
    const result = resolveStage(
      { threadId: "thr_a", mode: "waiting" },
      { threadId: "thr_a", working: true },
    );
    expect(result.state.mode).toBe("rolling");
    expect(result.handoff).toBeNull();
  });

  it("rolls the previous cousin off when another thread opens", () => {
    const result = resolveStage(
      { threadId: "thr_a", mode: "waiting" },
      { threadId: "thr_b", working: false },
    );
    expect(result.state).toEqual({ threadId: "thr_b", mode: "resting" });
    expect(result.handoff).toEqual({ exitingThreadId: "thr_a", enteringThreadId: "thr_b" });
  });

  it("stays empty until a thread opens", () => {
    expect(resolveStage(EMPTY_STAGE, { threadId: null, working: false }).state).toBe(EMPTY_STAGE);
  });
});

describe("isThreadWorking", () => {
  it("treats busy statuses as working", () => {
    expect(isThreadWorking({ status: "active", indicator: "none" })).toBe(true);
    expect(isThreadWorking({ status: "starting", indicator: "none" })).toBe(true);
  });

  it("falls back to the busy indicator on hosts without a status", () => {
    expect(isThreadWorking({ indicator: "runtime" })).toBe(true);
    expect(isThreadWorking({ indicator: "background-command" })).toBe(true);
    expect(isThreadWorking({ indicator: "unread-success" })).toBe(false);
    expect(isThreadWorking({ indicator: "none" })).toBe(false);
  });

  it("treats idle, unknown, and blocked threads as not working", () => {
    expect(isThreadWorking({ status: "idle", indicator: "none" })).toBe(false);
    expect(isThreadWorking({ status: "mystery", indicator: "none" })).toBe(false);
    expect(isThreadWorking({ status: "active", indicator: "waiting-for-input" })).toBe(false);
  });
});

describe("quietCompactions", () => {
  it("shows a higher count and leaves an equal one", () => {
    expect(quietCompactions(1, 2)).toBe(2);
    expect(quietCompactions(2, 2)).toBeNull();
  });

  it("ignores a lower, stale count", () => {
    expect(quietCompactions(2, 0)).toBeNull();
  });

  it("shows the first known count and ignores unknown counts", () => {
    expect(quietCompactions(null, 3)).toBe(3);
    expect(quietCompactions(null, null)).toBeNull();
    expect(quietCompactions(2, null)).toBeNull();
  });
});

describe("createReadOrder", () => {
  it("drops a reply older than one already applied", () => {
    const order = createReadOrder();
    const first = order.begin();
    const second = order.begin();
    expect(order.accept(second)).toBe(true);
    expect(order.accept(first)).toBe(false);
  });

  it("applies every newer reply even while more reads are in flight", () => {
    const order = createReadOrder();
    const first = order.begin();
    const second = order.begin();
    order.begin();
    expect(order.accept(first)).toBe(true);
    expect(order.accept(second)).toBe(true);
  });
});
