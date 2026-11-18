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

function visible(id: string) {
  return vi.mocked(browser.setVisibleWithoutFocus!).mock.calls.filter(([request]) => request.tabId === id).at(-1)?.[0].visible
    ?? vi.mocked(browser.attach).mock.calls.find(([request]) => request.tabId === id)?.[0].visible;
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(document, "hidden", "get").mockReturnValue(false);
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
    // Default windows are disjoint from the native page.
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

it("keeps a browser visible for disjoint window moves, but hides it for overlap, its own move, and other gestures", async () => {
  const root = await mount("first");
  expect(visible("first")).toBe(true);
  const shield = document.createElement("div");
  shield.className = "bbd-drag-shield";
  shield.dataset.windowDrag = "true";
  const moving = document.createElement("div");
  moving.className = "bbd-window";
  moving.dataset.dragging = "true";
  moving.style.zIndex = "2";
  document.body.append(shield, moving);
  const sync = () => act(() => { window.dispatchEvent(new Event("bbd-drag-state")); });
  sync();
  expect(visible("first")).toBe(true);
  moving.getBoundingClientRect = () => new DOMRect(150, 0, 300, 300);
  sync();
  expect(visible("first")).toBe(false);
  moving.remove();
  sync();
  expect(visible("first")).toBe(true);
  const own = root.container.querySelector<HTMLElement>(".bbd-window")!;
  own.dataset.dragging = "true";
  sync();
  expect(visible("first")).toBe(false);
  delete own.dataset.dragging;
  delete shield.dataset.windowDrag;
  sync();
  expect(visible("first")).toBe(false);
  shield.remove();
  sync();
  expect(visible("first")).toBe(true);
  expect(browser.attach).toHaveBeenCalledTimes(1);
  expect(browser.detach).not.toHaveBeenCalled();
  expect(browser.navigate).not.toHaveBeenCalled();
});
