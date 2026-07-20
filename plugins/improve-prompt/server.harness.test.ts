import { createFakePluginHost } from "@bb/plugin-sdk/testing";
import { describe, expect, it } from "vitest";

import plugin from "./server";

describe("Improve Prompt plugin contract", () => {
  it("registers enhancement RPC and completion events", async () => {
    const { bb, harness } = createFakePluginHost({
      pluginId: "prompt-shaper",
    });

    await plugin(bb);

    expect(harness.inspection.registrations.rpcMethods).toEqual([
      "startEnhancement",
      "getEnhancement",
      "cancelEnhancement",
    ]);
    expect(
      harness.inspection.registrations.threadEventHandlers["thread.idle"],
    ).toBe(1);
    expect(
      harness.inspection.registrations.threadEventHandlers["thread.failed"],
    ).toBe(1);
    await harness.lifecycle.dispose();
  });
});
