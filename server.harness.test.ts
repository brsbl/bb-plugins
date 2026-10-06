import type { BbSdk } from "@get-bb/plugin-sdk";
import { createFakePluginHost } from "@get-bb/plugin-sdk/testing";
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
      "getHelperExecution",
      "setHelperExecution",
      "listHelperProviders",
      "listHelperModels",
    ]);
    expect(
      harness.inspection.registrations.threadEventHandlers["thread.idle"],
    ).toBe(1);
    expect(
      harness.inspection.registrations.threadEventHandlers["thread.failed"],
    ).toBe(1);
    expect(harness.inspection.registrations.cli?.name).toBe("prompt-shaper");
    await harness.lifecycle.dispose();
  });

  it("shows and sets the helper execution from the CLI", async () => {
    const providers = [
      { id: "codex", displayName: "Codex", available: true },
    ] as unknown as Awaited<ReturnType<BbSdk["providers"]["list"]>>;
    const { bb, harness } = createFakePluginHost({
      pluginId: "prompt-shaper",
      sdk: { providers: { list: async () => providers } },
    });
    await plugin(bb);
    const run = (argv: string[]) => harness.behavior.runCli(argv);

    expect((await run(["helper"])).stdout).toBe("default\n");
    expect((await run(["helper", "fixed", "codex", "gpt-5"])).exitCode).toBe(0);
    expect((await run(["helper"])).stdout).toBe(
      "fixed provider=codex model=gpt-5\n",
    );
    const unknown = await run(["helper", "fixed", "nope"]);
    expect(unknown.exitCode).toBe(1);
    expect(unknown.stderr).toContain("available: codex");
    expect((await run(["helper", "thread", "extra"])).exitCode).toBe(1);
    expect((await run(["helper", "default"])).exitCode).toBe(0);
    expect((await run(["helper"])).stdout).toBe("default\n");
    await harness.lifecycle.dispose();
  });
});
