import { createFakePluginHost } from "@bb/plugin-sdk/testing";
import { describe, expect, it } from "vitest";

import plugin from "./server";

describe("Design Doctrine plugin contract", () => {
  it("registers its RPC, CLI, and watcher through the bb harness", async () => {
    const { bb, harness } = createFakePluginHost({
      pluginId: "design-doctrine",
      sdk: { threads: { list: async () => [] } },
    });

    await plugin(bb);

    expect(harness.inspection.registrations.rpcMethods).toEqual([
      "getLibrary",
    ]);
    expect(harness.inspection.registrations.cli?.name).toBe("doctrine");
    expect(
      harness.inspection.registrations.services.map(({ name }) => name),
    ).toContain("rule-watch");
    expect(
      harness.inspection.registrations.threadEventHandlers["thread.idle"],
    ).toBe(1);
    expect(
      harness.inspection.registrations.threadEventHandlers["thread.created"],
    ).toBe(1);
    expect(
      harness.inspection.registrations.threadEventHandlers["thread.deleted"],
    ).toBe(1);
    await harness.lifecycle.dispose();
  });
});
