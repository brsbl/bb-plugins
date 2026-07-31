// @vitest-environment jsdom

import { installTestPluginRuntime } from "@bb/plugin-sdk/testing/app";
import { describe, expect, it, vi } from "vitest";

async function loadApp() {
  installTestPluginRuntime();
  return (await import("./app.js")).default;
}

function composerBuilder(customize: ReturnType<typeof vi.fn>) {
  return { customize };
}

describe("Improve Prompt app registration", () => {
  it.each(["contentScripts", "experimental_contentScripts"] as const)(
    "registers thread status through the %s builder",
    async (builderKey) => {
      const app = await loadApp();
      const customize = vi.fn();
      const register = vi.fn();

      Reflect.apply(app.setup, undefined, [
        {
          composer: composerBuilder(customize),
          [builderKey]: { register },
        },
      ]);

      expect(register).toHaveBeenCalledWith(
        expect.objectContaining({ id: "thread-status" }),
      );
      expect(customize).toHaveBeenCalledWith(
        expect.objectContaining({ id: "improve-prompt" }),
      );
    },
  );

  it("prefers the stable builder when both names are present", async () => {
    const app = await loadApp();
    const stableRegister = vi.fn();
    const legacyRegister = vi.fn();

    Reflect.apply(app.setup, undefined, [
      {
        composer: composerBuilder(vi.fn()),
        contentScripts: { register: stableRegister },
        experimental_contentScripts: { register: legacyRegister },
      },
    ]);

    expect(stableRegister).toHaveBeenCalledOnce();
    expect(legacyRegister).not.toHaveBeenCalled();
  });

  it("still registers the composer when content scripts are unavailable", async () => {
    const app = await loadApp();
    const customize = vi.fn();

    expect(() =>
      Reflect.apply(app.setup, undefined, [
        { composer: composerBuilder(customize) },
      ]),
    ).not.toThrow();
    expect(customize).toHaveBeenCalledWith(
      expect.objectContaining({ id: "improve-prompt" }),
    );
  });
});
