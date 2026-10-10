import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRingStore } from "./ring-store.js";
import type { RingSetting, Rings } from "./rings.js";

interface Pending {
  key: string;
  ring: RingSetting | null;
  resolve: (rings: Rings) => void;
  reject: (error: Error) => void;
}

function setup() {
  const store = createRingStore(300);
  const calls: Pending[] = [];
  store.setSender(
    (key, ring) =>
      new Promise<Rings>((resolve, reject) =>
        calls.push({ key, ring, resolve, reject }),
      ),
  );
  return { store, calls };
}

const blue = { from: "#3b82f6", to: null };
const pink = { from: "#ec4899", to: null };
const green = { from: "#22c55e", to: null };

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("ring store", () => {
  it("shows edits immediately and coalesces a burst into one save", async () => {
    const { store, calls } = setup();
    for (let index = 0; index < 60; index += 1)
      store.queue("brsbl", index % 2 === 0 ? blue : pink);
    expect(store.getSnapshot().brsbl).toEqual(pink);
    await vi.advanceTimersByTimeAsync(300);
    expect(calls).toHaveLength(1);
    expect(calls[0]!.ring).toEqual(pink);
  });

  it("keeps a newer edit when an older save fails late", async () => {
    const { store, calls } = setup();
    store.queue("brsbl", blue);
    await vi.advanceTimersByTimeAsync(300);
    store.queue("brsbl", pink);
    calls[0]!.reject(new Error("network"));
    await vi.advanceTimersByTimeAsync(0);
    expect(store.getSnapshot().brsbl).toEqual(pink);
    await vi.advanceTimersByTimeAsync(300);
    calls[1]!.resolve({ brsbl: pink });
    await vi.advanceTimersByTimeAsync(0);
    expect(store.getSnapshot().brsbl).toEqual(pink);
  });

  it("keeps a newer edit when an older save succeeds late", async () => {
    const { store, calls } = setup();
    store.queue("brsbl", blue);
    await vi.advanceTimersByTimeAsync(300);
    store.queue("brsbl", pink);
    calls[0]!.resolve({ brsbl: blue });
    await vi.advanceTimersByTimeAsync(0);
    expect(store.getSnapshot().brsbl).toEqual(pink);
  });

  it("keeps realtime updates for other servers during a pending save", async () => {
    const { store, calls } = setup();
    store.queue("brsbl", blue);
    await vi.advanceTimersByTimeAsync(300);
    store.setServerRings({ "bb-demo": green });
    expect(store.getSnapshot()).toEqual({ "bb-demo": green, brsbl: blue });
    calls[0]!.resolve({ "bb-demo": green, brsbl: blue });
    await vi.advanceTimersByTimeAsync(0);
    expect(store.getSnapshot()).toEqual({ "bb-demo": green, brsbl: blue });
  });

  it("falls back to the server value when the only save fails", async () => {
    const { store, calls } = setup();
    store.setServerRings({ brsbl: green });
    store.queue("brsbl", blue);
    await vi.advanceTimersByTimeAsync(300);
    calls[0]!.reject(new Error("network"));
    await vi.advanceTimersByTimeAsync(0);
    expect(store.getSnapshot().brsbl).toEqual(green);
  });
});
