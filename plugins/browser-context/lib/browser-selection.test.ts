// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  pageReactHintController,
  pageSelectionController,
  pageSelectionOverlayCleanup,
} from "./browser-selection";

function pointer(type: string, x: number, y: number) {
  return new MouseEvent(type, {
    bubbles: true,
    button: 0,
    clientX: x,
    clientY: y,
  });
}

function setRect(
  element: Element,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  vi.spyOn(element, "getBoundingClientRect").mockReturnValue(
    DOMRect.fromRect({ x, y, width, height }),
  );
}

describe("Browser page selection controller", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    Object.defineProperty(globalThis, "CSS", {
      configurable: true,
      value: {
        escape: (value: string) => value.replace(/[^a-zA-Z0-9_-]/gu, "\\$&"),
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("captures one clicked element with bounded targeting data and no secret URL or editable value", async () => {
    const link = document.createElement("a");
    link.id = "reset-account";
    link.href = "https://example.test/reset?token=secret";
    link.setAttribute("aria-label", "Reset account");
    link.innerHTML = '<span>Reset account</span><input value="typed secret">';
    document.body.append(link);
    setRect(link, 20, 30, 140, 32);
    const activation = vi.fn();
    link.addEventListener("click", activation);
    Object.defineProperty(document, "elementFromPoint", {
      configurable: true,
      value: () => link,
    });

    const result = pageSelectionController({
      input: { overlayId: "capture-element" },
      signal: new AbortController().signal,
    });
    document.dispatchEvent(pointer("pointerdown", 30, 40));
    document.dispatchEvent(pointer("pointerup", 30, 40));
    const activationClick = new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
    });
    expect(link.dispatchEvent(activationClick)).toBe(false);
    expect(activation).not.toHaveBeenCalled();

    await expect(result).resolves.toMatchObject({
      version: 2,
      kind: "element",
      element: {
        selector: "#reset-account",
        accessibility: { nameHint: "Reset account" },
      },
    });
    const capture = await result;
    expect(capture.element?.dom).not.toContain("token=secret");
    expect(capture.element?.dom).not.toContain("typed secret");
    expect(capture.element?.dom.length).toBeLessThan(16_384);
    const overlay = document.querySelector(
      '[data-bb-browser-context-overlay-id="capture-element"]',
    );
    expect(overlay).not.toBeNull();
    expect(overlay?.querySelector("div")?.getAttribute("style")).toContain(
      "display: block",
    );
    expect(
      pageSelectionOverlayCleanup({
        input: { overlayId: "capture-element" },
      }),
    ).toEqual({ removed: 1 });
    expect(
      document.querySelector("[data-bb-browser-context-overlay]"),
    ).toBeNull();
  });

  it("captures a dragged region in composed document order with a deterministic common ancestor", async () => {
    vi.spyOn(performance, "now").mockReturnValue(0);
    const section = document.createElement("section");
    section.id = "members";
    const first = document.createElement("button");
    first.textContent = "Invite member";
    const second = document.createElement("button");
    second.textContent = "Export";
    section.append(first, second);
    document.body.append(section);
    setRect(section, 10, 10, 320, 180);
    setRect(first, 20, 30, 120, 32);
    setRect(second, 160, 30, 100, 32);

    const result = pageSelectionController({
      input: { overlayId: "capture-region" },
      signal: new AbortController().signal,
    });
    document.dispatchEvent(pointer("pointerdown", 15, 20));
    document.dispatchEvent(pointer("pointermove", 280, 100));
    document.dispatchEvent(pointer("pointerup", 280, 100));

    const capture = await result;
    expect(capture.kind).toBe("region");
    expect(capture.region?.commonAncestor).toMatchObject({
      kind: "element",
      absoluteLocator: { selectors: ["#members"] },
    });
    expect(capture.region?.targets.map((target) => target.text)).toEqual([
      "Invite member",
      "Export",
    ]);
    expect(capture.region?.scanTruncated).toBe(false);
    expect(
      document.querySelector(
        '[data-bb-browser-context-overlay-id="capture-region"]',
      ),
    ).not.toBeNull();
    pageSelectionOverlayCleanup({ input: { overlayId: "capture-region" } });
  });

  it("cleans up and rejects immediately on cancellation", async () => {
    const controller = new AbortController();
    const result = pageSelectionController({
      input: { overlayId: "capture-cancelled" },
      signal: controller.signal,
    });
    expect(
      document.querySelector("[data-bb-browser-context-overlay]"),
    ).not.toBeNull();
    controller.abort();
    await expect(result).rejects.toMatchObject({ name: "AbortError" });
    expect(
      document.querySelector("[data-bb-browser-context-overlay]"),
    ).toBeNull();
    expect(document.documentElement.style.cursor).toBe("");
  });

  it("reads page-owned React component and source hints in the explicit main-world follow-up", () => {
    const button = document.createElement("button");
    button.id = "save";
    document.body.append(button);
    Object.defineProperty(button, "__reactFiber$test", {
      value: {
        type: { displayName: "SaveButton" },
        _debugSource: {
          fileName: "/app/src/SaveButton.tsx",
          lineNumber: 42,
          columnNumber: 7,
        },
        return: {
          type: { name: "SettingsForm" },
          return: null,
        },
      },
    });

    expect(
      pageReactHintController({
        input: {
          elementLocator: { selectors: ["#save"] },
          regionLocators: [],
        },
      }),
    ).toEqual({
      element: {
        componentStack: ["SaveButton", "SettingsForm"],
        source: {
          fileName: "/app/src/SaveButton.tsx",
          lineNumber: 42,
          columnNumber: 7,
        },
      },
      targets: [],
    });
  });
});
