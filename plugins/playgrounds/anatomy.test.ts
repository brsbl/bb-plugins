import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { Script } from "node:vm";
import { describe, expect, it } from "vitest";
import { htmlAnswerSchema } from "./model.js";

const skill = new URL("./skills/playground-design/", import.meta.url);
describe("Anatomy design instruments", () => {
  for (const instrument of ["typography-press", "motion-rig"]) {
    it(`${instrument} produces a self-contained payload accepted by the current sandbox`, async () => {
      const { createPayload } = await import(new URL(`${instrument}/build.mjs`, skill).href);
      const payload = htmlAnswerSchema.parse(await createPayload());
      const script = /<script>([\s\S]*)<\/script>/.exec(payload.html)?.[1];
      expect(script).toBeTruthy();
      expect(payload.html.match(/<\/script>/gi)).toHaveLength(1);
      expect(() => new Script(script!)).not.toThrow();
      expect(payload.html).not.toMatch(/<script[^>]+src=|<link[^>]+href=/);
      expect(payload.html).toContain("Copyright (c) 2026 Ryan");
      expect(payload.html).toContain("Learning-demo inspiration: The Bugged Dev");
    });
  }

  it("keeps the printed typography unchanged until a new impression is made", async () => {
    const press = await import(new URL("typography-press/model.mjs", skill).href);
    const state = press.normalizeState({
      draft: { fontSize: 20, leading: 1.75, measure: 32, margin: 40 },
      printed: press.DEFAULTS,
    });
    expect(press.isDirty(state)).toBe(true);
    expect(state.printed).toEqual(press.DEFAULTS);
    const printed = press.printState(state);
    expect(printed.printed).toEqual(state.draft);
    expect(press.isDirty(printed)).toBe(false);
    expect(press.typographyMetrics(printed.printed).lineHeight).toBe(35);
    printed.draft.fontSize = 12;
    expect(printed.printed.fontSize).toBe(20);
  });

  it("bounds restored typography inputs and ignores unknown fields", async () => {
    const press = await import(new URL("typography-press/model.mjs", skill).href);
    expect(press.normalizeState(null)).toEqual(press.initialState);
    expect(press.normalizeInputs({ fontSize: Infinity, measure: 1000, leading: -4, margin: "40", html: "<script>" }))
      .toEqual({ fontSize: 16, measure: 64, leading: 1.1, margin: 24 });
    expect(press.normalizeInputs({ leading: 1.63, margin: 30 })).toMatchObject({ leading: 1.65, margin: 32 });
  });

  it("distinguishes bouncy and overdamped motion and settles at the target", async () => {
    const rig = await import(new URL("motion-rig/model.mjs", skill).href);
    for (const [name, overshoots] of [["bouncy", true], ["gentle", false]] as const) {
      const state = rig.normalizeState({ ...rig.PRESETS[name], target: 1 });
      let motion = { position: 0, velocity: 0 };
      let maximum = 0;
      for (let index = 0; index < 600; index++) {
        motion = rig.advance(state, motion, 1 / 60);
        maximum = Math.max(maximum, motion.position);
      }
      expect(maximum > 1.02).toBe(overshoots);
      expect(motion).toEqual({ position: 1, velocity: 0 });
    }
  });

  it("preserves momentum when a moving drawer is interrupted", async () => {
    const rig = await import(new URL("motion-rig/model.mjs", skill).href);
    const state = rig.normalizeState({ ...rig.PRESETS.bouncy, target: 1 });
    let motion = { position: 0, velocity: 0 };
    for (let index = 0; index < 6; index++) motion = rig.advance(state, motion, 1 / 60);
    const interrupted = rig.advance({ ...state, target: 0 }, motion, 1 / 1000);
    expect(interrupted.velocity).toBeGreaterThan(0);
    expect(interrupted.position).toBeGreaterThan(motion.position);
    expect(interrupted.velocity).toBeLessThan(motion.velocity);
    let resting = interrupted;
    for (let index = 0; index < 600; index++) resting = rig.advance({ ...state, target: 0 }, resting, 1 / 60);
    expect(resting).toEqual({ position: 0, velocity: 0 });
  });

  it("bounds spring inputs, travel, and elapsed time from restored or agent state", async () => {
    const rig = await import(new URL("motion-rig/model.mjs", skill).href);
    expect(rig.normalizeState({ stiffness: Infinity, damping: -100, target: 5, extra: "ignored" }))
      .toEqual({ stiffness: 180, damping: 1, target: 1 });
    expect(rig.normalizeState(null)).toEqual(rig.initialState);
    expect(rig.advance(rig.initialState, { position: NaN, velocity: Infinity }, 10)).toEqual(rig.atRest());
    for (const target of [0, 1]) {
      const state = { stiffness: 400, damping: 1, target };
      let motion = { position: 1 - target, velocity: target ? 20 : -20 };
      for (let index = 0; index < 120; index++) {
        motion = rig.advance(state, motion, 10);
        expect(motion.position).toBeGreaterThanOrEqual(rig.TRAVEL.min);
        expect(motion.position).toBeLessThanOrEqual(rig.TRAVEL.max);
        expect(Number.isFinite(motion.velocity)).toBe(true);
      }
    }
  });

  it("preserves every pinned upstream source and license byte", async () => {
    const provenance = JSON.parse(await readFile(new URL("upstream.json", skill), "utf8"));
    for (const [path, hash] of Object.entries(provenance.files)) {
      const data = await readFile(new URL(path, skill));
      expect(createHash("sha256").update(data).digest("hex"), path).toBe(hash);
    }
  });
});
