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
    const frames: FrameRequestCallback[] = [];
    const canceledFrames: number[] = [];
    let nextFrameId = 1;
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      frames.push(callback);
      return nextFrameId++;
    });
    vi.stubGlobal("cancelAnimationFrame", (frameId: number) => {
      canceledFrames.push(frameId);
    });
    vi.stubGlobal("CSS", { supports: () => true });
    document.body.innerHTML = `
      <div data-message-column="">
        <div class="ml-auto">
          <div data-markdown-preview=""><p>PR #123 and issue #1234; colors #3366ff and #3366ff80</p></div>
        </div>
      </div>
    `;
    const paragraph = document.querySelector("p")!;
    const originalTextNode = paragraph.firstChild as Text;

    const app = await loadPluginApp(() => import("./app"));
    const mounted = await mountPluginContentScripts(app, {
      pluginId: "color-swatches",
    });

    const proseSwatches = Array.from(
      document.querySelectorAll<HTMLElement>("[data-bb-color-swatch-prose]"),
    );
    expect(proseSwatches.map((swatch) => swatch.textContent)).toEqual([
      "#3366ff",
      "#3366ff80",
    ]);
    expect(
      proseSwatches.every(
        (swatch) => swatch.getAttribute("data-bb-color-swatch") === "",
      ),
    ).toBe(true);
    expect(
      proseSwatches.map((swatch) =>
        swatch.style.getPropertyValue("--bb-color-swatch"),
      ),
    ).toEqual(["#3366ff", "#3366ff80"]);
    expect(paragraph.textContent).toBe(
      "PR #123 and issue #1234; colors #3366ff and #3366ff80",
    );
    expect(paragraph.firstChild).toBe(originalTextNode);
    expect(
      document.querySelector("style[data-bb-color-swatches]")?.textContent,
    ).toContain("[data-bb-color-swatch]::before");

    // React retains and updates the Text node it created. Keep that node in
    // place so a later render replaces the literal without stale duplicate DOM.
    originalTextNode.data = "updated message #000000";
    await Promise.resolve();
    expect(frames).toHaveLength(1);
    frames.shift()!(0);

    const updatedSwatch = document.querySelector<HTMLElement>(
      "[data-bb-color-swatch-prose]",
    );
    expect(updatedSwatch?.textContent).toBe("#000000");
    expect(updatedSwatch?.style.getPropertyValue("--bb-color-swatch")).toBe(
      "#000000",
    );
    expect(paragraph.textContent).toBe("updated message #000000");
    expect(paragraph.firstChild).toBe(originalTextNode);

    originalTextNode.data = "final message #ff00ff";
    await Promise.resolve();
    expect(frames).toHaveLength(1);
    const staleFrame = frames.shift()!;

    await mounted.lifecycle.dispose();
    expect(canceledFrames).toEqual([2]);
    staleFrame(0);
    expect(document.querySelector("[data-bb-color-swatch-prose]")).toBeNull();
    expect(paragraph.textContent).toBe("final message #ff00ff");
    expect(paragraph.firstChild).toBe(originalTextNode);
  });

  it("redecorates a code line after its streamed text changes", async () => {
    const frames: FrameRequestCallback[] = [];
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      frames.push(callback);
      return frames.length;
    });
    document.body.innerHTML = `<pre><div class="sh__line"><span>#</span><span>ffffff</span></div></pre>`;

    const app = await loadPluginApp(() => import("./app"));
    const mounted = await mountPluginContentScripts(app, {
      pluginId: "color-swatches",
    });
    const line = document.querySelector<HTMLElement>(".sh__line")!;
    const [prefix, value] = Array.from(
      line.querySelectorAll<HTMLElement>("span"),
    );
    expect(prefix.getAttribute("data-bb-color-swatch")).toBe("");
    expect(prefix.style.getPropertyValue("--bb-color-swatch")).toBe("#ffffff");

    value.textContent = "000000";
    await Promise.resolve(); // deliver MutationObserver records
    expect(frames).toHaveLength(1);
    frames.shift()!(0);

    expect(prefix.getAttribute("data-bb-color-swatch")).toBe("");
    expect(prefix.style.getPropertyValue("--bb-color-swatch")).toBe("#000000");
    await mounted.lifecycle.dispose();
  });
});
