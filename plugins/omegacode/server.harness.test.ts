import { createFakePluginHost } from "@bb/plugin-sdk/testing";
import { describe, expect, it } from "vitest";

import plugin from "./server";

describe("Omegacode plugin contract", () => {
  it("registers thread-scoped status surfaces", async () => {
    const { bb, harness } = createFakePluginHost({ pluginId: "omega" });

    await plugin(bb);

    expect(harness.inspection.registrations.rpcMethods.sort()).toEqual([
      "allRuns",
      "runs",
    ]);
    expect(harness.inspection.registrations.cli?.name).toBe("omegacode");
    expect(
      harness.inspection.registrations.services.map(({ name }) => name),
    ).toContain("watch");
    await harness.lifecycle.dispose();
  });
});
