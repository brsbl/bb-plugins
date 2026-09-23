import { createFakePluginHost } from "@get-bb/plugin-sdk/testing";
import { describe, expect, it } from "vitest";

import plugin from "./server";

describe("Ambient plugin", () => {
  it("loads through the bb plugin harness", async () => {
    const { bb, harness } = createFakePluginHost({ pluginId: "ambient" });
    plugin(bb);
    expect(harness.inspection.logEntries.at(-1)?.message).toBe("Ambient loaded");
    await harness.lifecycle.dispose();
  });
});
