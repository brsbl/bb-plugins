import { createFakePluginHost } from "@get-bb/plugin-sdk/testing";
import { describe, expect, it } from "vitest";

import plugin from "./server";

describe("Content Calendar plugin", () => {
  it("loads through the bb plugin harness", async () => {
    const { bb, harness } = createFakePluginHost({ pluginId: "content-calendar" });
    plugin(bb);
    expect(harness.inspection.logEntries.at(-1)?.message).toBe("Content Calendar loaded");
    await harness.lifecycle.dispose();
  });
});
