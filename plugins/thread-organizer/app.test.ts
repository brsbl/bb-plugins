import { installTestPluginRuntime } from "@bb/plugin-sdk/testing/app";
import { describe, expect, it, vi } from "vitest";

async function loadApp() {
  installTestPluginRuntime();
  return (await import("./app.js")).default;
}

describe("Thread Organizer app registration", () => {
  it.each(["contentScripts", "experimental_contentScripts"] as const)(
    "registers through the %s builder",
    async (builderKey) => {
      const app = await loadApp();
      const register = vi.fn();

      Reflect.apply(app.setup, undefined, [
        { [builderKey]: { register } },
      ]);

      expect(register).toHaveBeenCalledWith(
        expect.objectContaining({ id: "collapse-unpinned-destination" }),
      );
    },
  );

  it("prefers the stable builder when both names are present", async () => {
    const app = await loadApp();
    const stableRegister = vi.fn();
    const legacyRegister = vi.fn();

    Reflect.apply(app.setup, undefined, [
      {
        contentScripts: { register: stableRegister },
        experimental_contentScripts: { register: legacyRegister },
      },
    ]);

    expect(stableRegister).toHaveBeenCalledOnce();
    expect(legacyRegister).not.toHaveBeenCalled();
  });
});
