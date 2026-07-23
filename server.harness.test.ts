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

    const rpc = await harness.behavior.callRpc("searchAtlasEntries", {
      query: "combobox",
    });
    const cli = await harness.behavior.runCli([
      "search",
      "combobox",
      "--json",
    ]);
    const cliPayload = JSON.parse(cli.stdout ?? "{}") as {
      data?: { results?: Array<{ name: string }> };
    };
    expect(rpc).toMatchObject({ mode: "exact" });
    expect(cliPayload.data?.results?.map(({ name }) => name)).toEqual(
      (rpc as { entries: Array<{ name: string }> }).entries.map(({ name }) =>
        name,
      ),
    );
    await harness.lifecycle.dispose();
  });
});
