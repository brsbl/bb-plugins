import { createFakePluginHost } from "@bb/plugin-sdk/testing";
import { stat } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";

describe("UI Patterns built server", () => {
  it("loads the bundled provider data and registers its surfaces", async () => {
    const built = await import(
      `${pathToFileURL(new URL("./dist/server.js", import.meta.url).pathname).href}?test=${Date.now()}`
    );
    const { bb, harness } = createFakePluginHost({ pluginId: "ui-patterns" });

    await built.default(bb);

    expect(harness.inspection.registrations.rpcMethods.length).toBeGreaterThan(
      0,
    );
    expect(harness.inspection.registrations.cli?.name).toBe("ui-patterns");
    await harness.lifecycle.dispose();
  }, 60_000);

  it("keeps shipped runtime bundles within their reviewed budgets", async () => {
    const budgets = {
      "dist/server.js": 650_000,
      "dist/app.js": 13_250_000,
      "dist/app.css": 220_000,
    } as const;

    for (const [path, budget] of Object.entries(budgets)) {
      const artifact = await stat(new URL(`./${path}`, import.meta.url));
      expect(artifact.size, `${path} exceeds ${budget} bytes`).toBeLessThanOrEqual(
        budget,
      );
    }
  });
});
