// @vitest-environment jsdom

import { loadPluginApp, mountPluginContentScripts } from "@get-bb/plugin-sdk/testing/app";
import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  document.body.replaceChildren();
  vi.unstubAllGlobals();
});

describe("Color Swatches content script", () => {
  it("redecorates a code line after its streamed text changes", async () => {
    const frames: FrameRequestCallback[] = [];
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      frames.push(callback);
      return frames.length;
    });
    document.body.innerHTML = `<pre><div class="sh__line"><span>#</span><span>fff</span></div></pre>`;

    const app = await loadPluginApp(() => import("./app"));
    const mounted = await mountPluginContentScripts(app, { pluginId: "color-swatches" });
    const line = document.querySelector<HTMLElement>(".sh__line")!;
    const [prefix, value] = Array.from(line.querySelectorAll<HTMLElement>("span"));
    expect(prefix.getAttribute("data-bb-color-swatch")).toBe("");
    expect(prefix.style.getPropertyValue("--bb-color-swatch")).toBe("#fff");

    value.textContent = "000";
    await Promise.resolve(); // deliver MutationObserver records
    expect(frames).toHaveLength(1);
    frames.shift()!(0);

    expect(prefix.getAttribute("data-bb-color-swatch")).toBe("");
    expect(prefix.style.getPropertyValue("--bb-color-swatch")).toBe("#000");
    await mounted.lifecycle.dispose();
  });
});
