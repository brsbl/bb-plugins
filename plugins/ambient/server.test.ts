import { createFakePluginHost } from "@get-bb/plugin-sdk/testing";
import { describe, expect, it } from "vitest";

import plugin, {
  DAILY_CONCEPTS,
  dailyConcept,
  describeVisibility,
  isDailyDue,
  localMoment,
  type DailyScene,
} from "./server";

describe("Ambient plugin", () => {
  it("loads through the bb plugin harness", async () => {
    const { bb, harness } = createFakePluginHost({ pluginId: "ambient" });
    plugin(bb);
    expect(harness.inspection.logEntries.at(-1)?.message).toBe("Ambient loaded");
    await harness.lifecycle.dispose();
  });
});

describe("look visibility", () => {
  it("flags a dimmed, flat scene but not the sparse built-in ones", () => {
    expect(describeVisibility({ fromBackground: 0.104, spread: 0.009, motion: 0.01, frameMs: 2, detail: 0.5 }, true)).toContain("Too faint");
    expect(describeVisibility({ fromBackground: 0.115, spread: 0.051, motion: 0.01, frameMs: 2, detail: 0.5 }, true)).not.toContain("Too faint");
    expect(describeVisibility({ fromBackground: 0.369, spread: 0.141, motion: 0.01, frameMs: 2, detail: 0.5 }, true)).not.toContain("Too faint");
  });

  it("flags a scene that barely moves", () => {
    expect(describeVisibility({ fromBackground: 0.3, spread: 0.1, motion: 0.0005, frameMs: 2, detail: 0.5 }, true)).toContain("Nearly still");
    expect(describeVisibility({ fromBackground: 0.3, spread: 0.1, motion: 0.01, frameMs: 2, detail: 0.5 }, true)).not.toContain("Nearly still");
  });
});

describe("look cost", () => {
  it("flags a scene that is too expensive to render", () => {
    const base = { fromBackground: 0.3, spread: 0.1, motion: 0.01, detail: 0.5 };
    expect(describeVisibility({ ...base, frameMs: 40 }, true)).toContain("Too heavy");
    expect(describeVisibility({ ...base, frameMs: 2 }, true)).not.toContain("Too heavy");
  });
});

describe("daily concepts", () => {
  it("rotates to a different concept on consecutive days", () => {
    const concepts = ["2026-09-22", "2026-09-23", "2026-09-24"].map(dailyConcept);
    expect(new Set(concepts).size).toBe(3);
    expect(DAILY_CONCEPTS).toContain(concepts[0]);
  });
});

describe("daily scene timing", () => {
  const daily: DailyScene = {
    enabled: true,
    hour: 8,
    timeZone: "America/Los_Angeles",
    lastRunDate: null,
    lastThreadId: null,
  };

  it("uses the user's calendar day, not the server's", () => {
    const lateEveningInLosAngeles = new Date("2026-09-23T04:30:00Z");
    expect(localMoment("America/Los_Angeles", lateEveningInLosAngeles)).toMatchObject({
      date: "2026-09-22",
      hour: 21,
    });
  });

  it("waits for the configured local hour", () => {
    expect(isDailyDue(daily, new Date("2026-09-22T14:59:00Z"))).toBe(false);
    expect(isDailyDue(daily, new Date("2026-09-22T15:00:00Z"))).toBe(true);
  });

  it("paints once per local day and not when disabled", () => {
    const at = new Date("2026-09-22T18:00:00Z");
    expect(isDailyDue({ ...daily, lastRunDate: "2026-09-22" }, at)).toBe(false);
    expect(isDailyDue({ ...daily, lastRunDate: "2026-09-21" }, at)).toBe(true);
    expect(isDailyDue({ ...daily, enabled: false }, at)).toBe(false);
  });
});
