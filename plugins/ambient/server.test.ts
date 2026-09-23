import { createFakePluginHost } from "@get-bb/plugin-sdk/testing";
import { describe, expect, it } from "vitest";

import plugin, { describeVisibility, isDailyDue, localMoment, type DailyScene } from "./server";

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
    expect(describeVisibility({ fromBackground: 0.104, spread: 0.009 }, true)).toContain("Too faint");
    expect(describeVisibility({ fromBackground: 0.115, spread: 0.051 }, true)).not.toContain("Too faint");
    expect(describeVisibility({ fromBackground: 0.369, spread: 0.141 }, true)).not.toContain("Too faint");
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
