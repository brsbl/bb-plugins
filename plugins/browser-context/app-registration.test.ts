// @vitest-environment jsdom

import { installTestPluginRuntime } from "@bb/plugin-sdk/testing/app";
import { describe, expect, it, vi } from "vitest";

describe("Browser Context registration", () => {
  it("registers on current hosts and remains inert on older hosts", async () => {
    installTestPluginRuntime();
    const { registerBrowserContextApp } = await import("./app.js");
    const register = vi.fn();

    registerBrowserContextApp({ experimental_browserAction: register });
    expect(register).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "capture",
        title: "Select page context",
        component: expect.any(Function),
      }),
    );
    expect(() => registerBrowserContextApp({})).not.toThrow();
  });
});
