import { createFakePluginHost } from "@bb/plugin-sdk/testing";
import { describe, expect, it } from "vitest";

import plugin from "./server";

describe("Improve Prompt plugin contract", () => {
  it("registers enhancement RPC and completion events", async () => {
    const { bb, harness } = createFakePluginHost({
      pluginId: "prompt-shaper",
      sdk: { threads: { list: async () => [] } },
    });

    await plugin(bb);

    expect(harness.inspection.registrations.rpcMethods).toEqual([
      "startEnhancement",
      "getEnhancement",
      "cancelEnhancement",
    ]);
    expect(
      harness.inspection.registrations.threadEventHandlers["thread.idle"],
    ).toBe(2);
    expect(
      harness.inspection.registrations.threadEventHandlers["thread.created"],
    ).toBe(1);
    expect(
      harness.inspection.registrations.threadEventHandlers["thread.failed"],
    ).toBe(1);
    expect(
      harness.inspection.registrations.threadEventHandlers["thread.deleted"],
    ).toBe(1);
    await harness.lifecycle.dispose();
  });
});
