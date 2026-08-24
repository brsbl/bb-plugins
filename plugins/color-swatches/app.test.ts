// @vitest-environment jsdom

import {
  loadPluginApp,
  mountPluginContentScripts,
} from "@get-bb/plugin-sdk/testing/app";
import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  document.body.replaceChildren();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("Color Swatches content script", () => {
  it("decorates a color literal in user-message prose", async () => {
    class TestHighlight {
      readonly ranges: Range[];

      constructor(...ranges: Range[]) {
        this.ranges = ranges;
      }
    }
    const highlights = new Map<string, TestHighlight>();
    vi.stubGlobal("Highlight", TestHighlight);
    vi.stubGlobal("CSS", { supports: () => true, highlights });
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    document.body.innerHTML = `
      <div data-message-column="">
        <div class="ml-auto">
          <div data-markdown-preview=""><p>just testing the color swatch plugin #ffffff</p></div>
        </div>
      </div>
    `;

    const app = await loadPluginApp(() => import("./app"));
    const mounted = await mountPluginContentScripts(app, {
      pluginId: "color-swatches",
    });
    const [[name, swatch]] = [...highlights];

    expect(name).toMatch(/^bb-color-swatches-prose-/);
    expect(swatch.ranges.map((range) => range.toString())).toEqual(["#ffffff"]);
    expect(
      document.querySelector("style[data-bb-color-swatches]")?.textContent,
    ).toContain("background-color: #ffffff");
    expect(document.querySelector("[data-markdown-preview]")?.textContent).toBe(
      "just testing the color swatch plugin #ffffff",
    );
    expect(document.querySelector("[data-markdown-preview] span")).toBeNull();
    await mounted.lifecycle.dispose();
    expect(highlights.size).toBe(0);
    expect(document.querySelector("[data-markdown-preview]")?.textContent).toBe(
      "just testing the color swatch plugin #ffffff",
    );
  });

  it("redecorates a code line after its streamed text changes", async () => {
    const frames: FrameRequestCallback[] = [];
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      frames.push(callback);
      return frames.length;
    });
    document.body.innerHTML = `<pre><div class="sh__line"><span>#</span><span>fff</span></div></pre>`;

    const app = await loadPluginApp(() => import("./app"));
    const mounted = await mountPluginContentScripts(app, {
      pluginId: "color-swatches",
    });
    const line = document.querySelector<HTMLElement>(".sh__line")!;
    const [prefix, value] = Array.from(
      line.querySelectorAll<HTMLElement>("span"),
    );
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
