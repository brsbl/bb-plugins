import { describe, expect, it } from "vitest";
import { createFakePluginHost } from "@get-bb/plugin-sdk/testing";
import serverSwitcher from "./server.js";
import {
  defaultRings,
  parseRingArgs,
  resolveRing,
  ringBackground,
  withRing,
  RINGS_MAX,
} from "./rings.js";

describe("rings", () => {
  it("parses one color or a two-stop gradient and normalizes case", () => {
    expect(parseRingArgs(["#3B82F6"])).toEqual({ from: "#3b82f6", to: null });
    expect(parseRingArgs(["#ef4444", "#8b5cf6"])).toEqual({
      from: "#ef4444",
      to: "#8b5cf6",
    });
    expect(ringBackground({ from: "#ef4444", to: "#8b5cf6" })).toBe(
      "linear-gradient(135deg, #ef4444, #8b5cf6)",
    );
  });

  it("gives each account server a distinct two-color default ring", () => {
    const defaults = defaultRings(["brsbl-bbox", "brsbl", "bb-demo", "brsbl"]);
    expect([...defaults.keys()]).toEqual(["bb-demo", "brsbl", "brsbl-bbox"]);
    const rings = [...defaults.values()];
    expect(new Set(rings.map((ring) => ring.from)).size).toBe(3);
    for (const ring of rings) expect(ring.to).not.toBe(ring.from);
    expect(defaultRings(["bb-demo", "brsbl", "brsbl-bbox"])).toEqual(defaults);
    const many = defaultRings(Array.from({ length: 20 }, (_, i) => `s${i}`));
    expect(
      new Set([...many.values()].map((ring) => `${ring.from}${ring.to}`)).size,
    ).toBe(20);
    const fallback = defaults.get("brsbl")!;
    expect(resolveRing({}, "brsbl", fallback)).toEqual(fallback);
    expect(resolveRing({}, "custom:1", null)).toBeNull();
    expect(resolveRing({ brsbl: "none" }, "brsbl", fallback)).toBeNull();
    expect(
      resolveRing({ brsbl: { from: "#000000", to: null } }, "brsbl", fallback),
    ).toEqual({ from: "#000000", to: null });
  });

  it("rejects non-hex colors and wrong stop counts", () => {
    expect(() => parseRingArgs(["red"])).toThrow("hex");
    expect(() => parseRingArgs([])).toThrow("one color");
    expect(() => parseRingArgs(["#000000", "#111111", "#222222"])).toThrow(
      "one color",
    );
  });

  it("caps the number of saved rings", () => {
    const full = Object.fromEntries(
      Array.from({ length: RINGS_MAX }, (_, index) => [
        `s${index}`,
        { from: "#000000", to: null },
      ]),
    );
    expect(() =>
      withRing(full, "extra", { from: "#ffffff", to: null }),
    ).toThrow(`${RINGS_MAX}`);
    expect(Object.keys(withRing(full, "s0", null))).toHaveLength(RINGS_MAX - 1);
  });

  it("keeps valid rings when stored data has a corrupt entry", async () => {
    const { harness, bb } = createFakePluginHost({
      pluginId: "server-switcher",
    });
    try {
      await bb.storage.kv.set("rings", {
        "": { from: "#000000", to: null },
        brsbl: { from: "#22c55e", to: null },
      });
      await serverSwitcher(bb);
      expect(await harness.behavior.callRpc("listRings", null)).toEqual({
        brsbl: { from: "#22c55e", to: null },
      });
    } finally {
      await harness.lifecycle.dispose();
    }
  });

  it("persists rings, publishes them, and exposes them through the CLI", async () => {
    const { harness, bb } = createFakePluginHost({
      pluginId: "server-switcher",
    });
    try {
      await serverSwitcher(bb);
      await harness.behavior.callRpc("setRing", {
        key: "brsbl",
        ring: { from: "#22C55E", to: "#3b82f6" },
      });
      expect(await harness.behavior.callRpc("listRings", null)).toEqual({
        brsbl: { from: "#22c55e", to: "#3b82f6" },
      });
      expect(harness.inspection.realtimeSignals.at(-1)).toMatchObject({
        channel: "rings",
      });
      const list = await harness.behavior.runCli(["ring", "list"]);
      expect(list.stdout).toContain("brsbl\t#22c55e → #3b82f6");
      const bad = await harness.behavior.runCli([
        "ring",
        "set",
        "brsbl",
        "blue",
      ]);
      expect(bad.exitCode).toBe(1);
      await harness.behavior.runCli(["ring", "clear", "brsbl"]);
      expect(await harness.behavior.callRpc("listRings", null)).toEqual({
        brsbl: "none",
      });
      const empty = await harness.behavior.runCli([
        "ring",
        "set",
        "",
        "#3b82f6",
      ]);
      expect(empty.exitCode).toBe(1);
      expect(empty.stderr).toContain("Server names");
      expect(await harness.behavior.callRpc("listRings", null)).toEqual({
        brsbl: "none",
      });
      await harness.behavior.runCli(["ring", "reset", "brsbl"]);
      expect(await harness.behavior.callRpc("listRings", null)).toEqual({});
    } finally {
      await harness.lifecycle.dispose();
    }
  });
});
