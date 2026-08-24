import { createFakePluginHost } from "@get-bb/plugin-sdk/testing";
import { describe, expect, it } from "vitest";

import plugin from "./server";

describe("Endless plugin", () => {
  it("loads through the bb plugin harness", async () => {
    const { bb, harness } = createFakePluginHost({ pluginId: "endless" });
    plugin(bb);
    expect(harness.inspection.logEntries.at(-1)?.message).toBe("Endless loaded");
    await harness.lifecycle.dispose();
  });
});
