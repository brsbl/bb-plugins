import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRingStore } from "./ring-store.js";
import type { RingSetting, Rings, RingsSnapshot } from "./rings.js";

interface Pending {
  key: string;
  ring: RingSetting | null;
  resolve: (snapshot: RingsSnapshot) => void;
  reject: (error: Error) => void;
}

function setup() {
  const store = createRingStore(300);
  const calls: Pending[] = [];
  store.setSender(
    (key, ring) =>
      new Promise<RingsSnapshot>((resolve, reject) =>
        calls.push({ key, ring, resolve, reject }),
      ),
  );
  return { store, calls };
}

const at = (revision: number, rings: Rings): RingsSnapshot => ({
  revision,
  rings,
});
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

  it("waits for the debounce instead of draining edits behind a slow save", async () => {
    const { store, calls } = setup();
    store.queue("brsbl", blue);
    await vi.advanceTimersByTimeAsync(300);
    for (let step = 0; step < 10; step += 1) {
      store.queue("brsbl", step % 2 === 0 ? pink : green);
      await vi.advanceTimersByTimeAsync(50);
      if (step === 0) calls[0]!.resolve(at(1, { brsbl: blue }));
    }
    expect(calls).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(300);
    expect(calls).toHaveLength(2);
    expect(calls[1]!.ring).toEqual(green);
  });

  it("keeps a newer edit when an older save fails or succeeds late", async () => {
    const { store, calls } = setup();
    store.queue("brsbl", blue);
    await vi.advanceTimersByTimeAsync(300);
    store.queue("brsbl", pink);
    calls[0]!.reject(new Error("network"));
    await vi.advanceTimersByTimeAsync(0);
    expect(store.getSnapshot().brsbl).toEqual(pink);
    await vi.advanceTimersByTimeAsync(300);
    store.queue("brsbl", green);
    calls[1]!.resolve(at(1, { brsbl: pink }));
    await vi.advanceTimersByTimeAsync(0);
    expect(store.getSnapshot().brsbl).toEqual(green);
  });

  it("keeps a newer realtime snapshot when an older save reply arrives late", async () => {
    const { store, calls } = setup();
    store.queue("brsbl", blue);
    await vi.advanceTimersByTimeAsync(300);
    store.setServerRings(at(2, { brsbl: blue, "bb-demo": green }));
    calls[0]!.resolve(at(1, { brsbl: blue }));
    await vi.advanceTimersByTimeAsync(0);
    expect(store.getSnapshot()).toEqual({ brsbl: blue, "bb-demo": green });
  });

  it("applies its own save reply when realtime for another server came first", async () => {
    const { store, calls } = setup();
    store.queue("brsbl", blue);
    await vi.advanceTimersByTimeAsync(300);
    store.setServerRings(at(1, { "bb-demo": green }));
    calls[0]!.resolve(at(2, { "bb-demo": green, brsbl: blue }));
    await vi.advanceTimersByTimeAsync(0);
    expect(store.getSnapshot()).toEqual({ "bb-demo": green, brsbl: blue });
  });

  it("ignores a list reply that is older than a realtime snapshot", async () => {
    const { store } = setup();
    let resolveList: (snapshot: RingsSnapshot) => void = () => {};
    const loading = store.load(
      () => new Promise<RingsSnapshot>((resolve) => (resolveList = resolve)),
    );
    store.setServerRings(at(3, { "bb-demo": green }));
    resolveList(at(2, {}));
    await loading;
    expect(store.getSnapshot()).toEqual({ "bb-demo": green });
  });

  it("falls back to the server value when the only save fails", async () => {
    const { store, calls } = setup();
    store.setServerRings(at(1, { brsbl: green }));
    store.queue("brsbl", blue);
    await vi.advanceTimersByTimeAsync(300);
    calls[0]!.reject(new Error("network"));
    await vi.advanceTimersByTimeAsync(0);
    expect(store.getSnapshot().brsbl).toEqual(green);
  });
});
