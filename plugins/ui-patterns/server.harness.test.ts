import { createFakePluginHost } from "@bb/plugin-sdk/testing";
import { describe, expect, it } from "vitest";

import plugin from "./server";

describe("UI Patterns plugin contract", () => {
  it("registers the Atlas RPC and CLI", async () => {
    const { bb, harness } = createFakePluginHost({ pluginId: "ui-patterns" });

    await plugin(bb);

    expect(harness.inspection.registrations.rpcMethods.length).toBeGreaterThan(
      0,
    );
    expect(harness.inspection.registrations.cli?.name).toBe("ui-patterns");
    await harness.lifecycle.dispose();
  });
});
