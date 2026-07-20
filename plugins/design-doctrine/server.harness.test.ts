import { createFakePluginHost } from "@bb/plugin-sdk/testing";
import { describe, expect, it } from "vitest";

import plugin from "./server";

describe("Design Doctrine plugin contract", () => {
  it("registers its RPC, CLI, and watcher through the bb harness", async () => {
    const { bb, harness } = createFakePluginHost({
      pluginId: "design-doctrine",
    });

    await plugin(bb);

    expect(harness.inspection.registrations.rpcMethods).toEqual([
      "getLibrary",
    ]);
    expect(harness.inspection.registrations.cli?.name).toBe("doctrine");
    expect(
      harness.inspection.registrations.services.map(({ name }) => name),
    ).toContain("rule-watch");
    await harness.lifecycle.dispose();
  });
});
