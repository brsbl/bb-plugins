import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { Script } from "node:vm";
import { describe, expect, it } from "vitest";
import { htmlAnswerSchema } from "./model.js";

const skill = new URL("./skills/anatomy/", import.meta.url);
const { normalize, measure, advance, STOP, EXPERIMENTS } = await import(new URL("lever-lab/model.mjs", skill).href);
const { buildLeverPlayground } = await import(new URL("lever-lab/build.mjs", skill).href);

describe("Anatomy lever lab", () => {
  it("balances unequal masses at inverse distances and predicts either tipping direction", () => {
    const state = EXPERIMENTS[0].state;
    expect(measure(state).left).toBeCloseTo(3.924);
    expect(measure(state).balanced).toBe(true);
    expect(measure({ ...state, rightDistance: 30 }).net).toBeGreaterThan(0);
    expect(measure({ ...state, leftDistance: 10 }).net).toBeLessThan(0);
    expect(measure(state, 0.15).balanced).toBe(true);
    expect(measure(state).balanceDistance).toBe(40);
  });

  it("stays still when balanced and obeys the travel stops under either torque", () => {
    expect(advance(EXPERIMENTS[0].state, { angle: 0, velocity: 0 }, 1 / 60)).toEqual({ angle: 0, velocity: 0 });
    for (const sign of [-1, 1]) {
      const state = normalize({ leftMass: sign > 0 ? 2 : 0.1, leftDistance: 40, rightMass: sign > 0 ? 0.1 : 2, rightDistance: 40 });
      let motion = { angle: 0, velocity: 0 };
      for (let i = 0; i < 240; i++) motion = advance(state, motion, 1 / 60);
      expect(motion.angle).toBeCloseTo(sign * STOP);
      expect(motion.velocity).toBe(0);
    }
  });

  it("normalizes restored or agent-provided inputs before using them", () => {
    expect(normalize({ leftMass: Infinity, rightMass: 100, leftDistance: -8, rightDistance: 25.6, ignored: "x" })).toEqual({ leftMass: 1, leftDistance: 5, rightMass: 2, rightDistance: 26 });
    expect(normalize(null)).toEqual(normalize({}));
  });

  it("produces a self-contained payload accepted by the current sandbox contract", () => {
    const payload = htmlAnswerSchema.parse(buildLeverPlayground());
    const script = /<script>([\s\S]*)<\/script>/.exec(payload.html)?.[1];
    expect(script).toBeTruthy();
    expect(payload.html.match(/<\/script>/gi)).toHaveLength(1);
    expect(() => new Script(script!)).not.toThrow();
    expect(payload.html).not.toMatch(/<script[^>]+src=|<link[^>]+href=/);
    expect(payload.html).toContain("Copyright (c) 2026 Ryan");
    expect(payload.html).toContain("Learning-demo inspiration: The Bugged Dev");
  });

  it("preserves every pinned upstream source and license byte", async () => {
    const provenance = JSON.parse(await readFile(new URL("upstream.json", skill), "utf8"));
    for (const [path, hash] of Object.entries(provenance.files)) {
      const data = await readFile(new URL(path, skill));
      expect(createHash("sha256").update(data).digest("hex"), path).toBe(hash);
    }
  });
});
