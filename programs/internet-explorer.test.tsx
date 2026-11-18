// @vitest-environment jsdom
import React from "react";
import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { NativeBrowser } from "../services/browser";
import type { DesktopWindow } from "../windows";
import { InternetExplorer } from "./internet-explorer";

vi.mock("../shell/data", () => ({ useDesktop: vi.fn() }));
vi.mock("../windows", () => ({ WindowFrame: vi.fn() }));

const loadThread = async () => "thread";
const onTitle = vi.fn();
let browser: NativeBrowser;

function windowState(id: string, minimized = false): DesktopWindow {
  return { id, spec: { kind: "internet-explorer" }, rect: { x: 0, y: 0, width: 300, height: 300 }, z: 1, minimized, restoreRect: null, openedThisSession: true };
}

async function mount(id: string, minimized = false) {
  const result = render(
    <div className="bbd-window" data-browser={id} style={{ zIndex: 1 }}>
      <InternetExplorer window={windowState(id, minimized)} tabId={id} urlKey={id} loadThread={loadThread} onTitle={onTitle} />
    </div>,
  );
  await act(async () => {});
  return result;
}

function preview() {
  // The Browser Automation lightbox is a portaled Radix dialog, not DOM fullscreen.
  const dialog = document.createElement("div");
  dialog.dataset.bbPlugin = "browser-automation";
  dialog.dataset.bbPortaledOverlay = "";
  dialog.dataset.state = "open";
  dialog.setAttribute("role", "dialog");
  document.body.append(dialog);
  return dialog;
}

function tick() {
  act(() => vi.advanceTimersByTime(120));
}

function visible(id: string) {
  return vi.mocked(browser.setVisibleWithoutFocus!).mock.calls.filter(([request]) => request.tabId === id).at(-1)?.[0].visible
    ?? vi.mocked(browser.attach).mock.calls.find(([request]) => request.tabId === id)?.[0].visible;
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(document, "hidden", "get").mockReturnValue(false);
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
    // Keep the dialog outside every view: fullscreen must hide all views, not only overlaps.
    if (this.classList.contains("bbd-ie-view")) {
      const x = this.closest("[data-browser]")?.getAttribute("data-browser") === "second" ? 400 : 0;
      return new DOMRect(x, 0, 300, 300);
    }
    return new DOMRect(800, 600, 100, 100);
  });
  browser = {
    attach: vi.fn(), detach: vi.fn(), navigate: vi.fn(), goBack: vi.fn(), goForward: vi.fn(), reload: vi.fn(), stop: vi.fn(),
    setBounds: vi.fn(), setVisible: vi.fn(), setVisibleWithoutFocus: vi.fn(), onState: vi.fn(() => vi.fn()),
  };
  Object.assign(window, { bbDesktop: { browser } });
});

afterEach(() => {
  cleanup();
  document.body.innerHTML = "";
  localStorage.clear();
  delete (window as { bbDesktop?: unknown }).bbDesktop;
  vi.restoreAllMocks();
  vi.useRealTimers();
});

it("hides every browser through preview enter/exit without navigation or focus, then restores only eligible views", async () => {
  await mount("first");
  await mount("second");
  await mount("minimized", true);
  expect([visible("first"), visible("second"), visible("minimized")]).toEqual([true, true, false]);
  const dialog = preview();
  tick();
  expect([visible("first"), visible("second"), visible("minimized")]).toEqual([false, false, false]);
  // Keep views hidden during the lightbox's exit animation too.
  dialog.dataset.state = "closed";
  tick();
  expect(visible("first")).toBe(false);
  const cover = document.createElement("div");
  cover.className = "bbd-window";
  cover.style.zIndex = "2";
  cover.getBoundingClientRect = () => new DOMRect(400, 0, 300, 300);
  document.body.append(cover);
  dialog.remove();
  tick();
  expect([visible("first"), visible("second"), visible("minimized")]).toEqual([true, false, false]);
  expect(browser.attach).toHaveBeenCalledTimes(3);
  expect(browser.detach).not.toHaveBeenCalled();
  expect(browser.navigate).not.toHaveBeenCalled();
  expect(browser.setVisible).not.toHaveBeenCalled();
});

it("does not restore a hidden document or a destroyed browser when the preview unmounts", async () => {
  const first = await mount("first");
  await mount("second");
  const dialog = preview();
  tick();
  first.unmount();
  vi.spyOn(document, "hidden", "get").mockReturnValue(true);
  dialog.remove();
  vi.mocked(browser.setVisibleWithoutFocus!).mockClear();
  act(() => vi.advanceTimersByTime(1200));
  expect(vi.mocked(browser.setVisibleWithoutFocus!).mock.calls.some(([request]) => request.tabId === "first")).toBe(false);
  expect(visible("second")).toBe(false);
  vi.spyOn(document, "hidden", "get").mockReturnValue(false);
  tick();
  expect(visible("second")).toBe(true);
});

it("leaves browsers visible for inline previews and unrelated plugin overlays", async () => {
  await mount("first");
  const inline = document.createElement("section");
  inline.dataset.bbPlugin = "browser-automation";
  document.body.append(inline);
  const unrelated = preview();
  unrelated.dataset.bbPlugin = "another-plugin";
  tick();
  expect(visible("first")).toBe(true);
});
