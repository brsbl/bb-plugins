import { describe, expect, it, vi } from "vitest";
import type { Reference } from "./contract.js";
import { coalesce, lastKnownPins, rememberPins } from "./pin-state.js";

const pin: Reference = { id: "p1", hostId: "mac", path: "/Users/me/note.md", name: "note.md", createdAt: "2026-10-05T00:00:00.000Z", hostName: "My Mac", status: "available" };
function deferred() {
  let resolve!: () => void;
  return { promise: new Promise<void>((done) => { resolve = done; }), resolve };
}

describe("pin state", () => {
  it("lets a remounted strip start from the thread's last known pins", () => {
    expect(lastKnownPins("remount")).toBeUndefined();
    rememberPins("remount", { pins: [pin], more: [], threadHostId: "linux" });
    // A new strip instance (after bb remounts the banner) reads this before its first refresh.
    expect(lastKnownPins("remount")).toEqual({ pins: [pin], more: [], threadHostId: "linux" });
    expect(lastKnownPins("other")).toBeUndefined();
  });
  it("forgets the least recently shown threads beyond its limit", () => {
    rememberPins("oldest", { pins: [pin], more: [], threadHostId: null });
    for (let index = 0; index < 100; index++) rememberPins(`thread-${index}`, { pins: [], more: [], threadHostId: null });
    expect(lastKnownPins("oldest")).toBeUndefined();
    expect(lastKnownPins("thread-99")).toBeDefined();
  });
  it("applies a slow load instead of dropping it for refreshes requested meanwhile", async () => {
    const loads: Array<ReturnType<typeof deferred>> = [];
    const applied: number[] = [];
    const refresh = coalesce(async () => {
      const load = deferred();
      loads.push(load);
      await load.promise;
      applied.push(loads.length);
    });
    const first = refresh();
    // Focus, the 30s timer and pins-changed all ask again while the slow host answers.
    void refresh();
    void refresh();
    expect(loads).toHaveLength(1);
    loads[0]!.resolve();
    // The requests made during the first load share one follow-up load.
    await vi.waitFor(() => expect(loads).toHaveLength(2));
    expect(applied).toEqual([1]);
    loads[1]!.resolve();
    await first;
    expect(applied).toEqual([1, 2]);
    expect(loads).toHaveLength(2);
  });
});
