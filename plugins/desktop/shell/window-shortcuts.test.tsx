// @vitest-environment jsdom
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { WindowManagerProvider, useWindowManager, type WindowSpec } from "../windows";
import { WindowFrame } from "../windows/frame";
import { STORAGE_KEY } from "../windows/state";
import { useWindowShortcuts } from "./window-shortcuts";

function DesktopKeys() {
  useWindowShortcuts();
  const manager = useWindowManager();
  return <>{manager.windows.map((window) => <WindowFrame key={window.id} window={window} title={window.id} icon={null}>
    <textarea aria-label={`Draft ${window.id}`} defaultValue="Unsent draft" />
  </WindowFrame>)}</>;
}

function mount(specs: WindowSpec[] = [{ kind: "paint" }, { kind: "minesweeper" }, { kind: "solitaire" }], minimized = false) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(specs.map((spec, index) => ({
    spec, rect: { x: index * 20, y: 48, width: 400, height: 300 }, z: index + 1, minimized, restoreRect: null,
  }))));
  return render(<WindowManagerProvider sizeOf={() => ({ width: 400, height: 300 })}><DesktopKeys /></WindowManagerProvider>);
}

const focused = () => document.querySelector('[data-bbd-window-id][data-focused="true"]')?.getAttribute("data-bbd-window-id");
const press = (init: KeyboardEventInit = {}) => {
  const event = new KeyboardEvent("keydown", { key: "`", ctrlKey: true, bubbles: true, cancelable: true, ...init });
  act(() => { (document.activeElement ?? document.body).dispatchEvent(event); });
  return event;
};
// jsdom lacks CSS.escape; fixture ids contain only selector-safe characters.
beforeEach(() => { vi.stubGlobal("CSS", { escape: (value: string) => value }); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); localStorage.clear(); document.body.innerHTML = ""; });

it("cycles every window in taskbar order, wraps, reverses and moves DOM focus from an unsent draft", () => {
  const ui = mount();
  const draft = ui.getByLabelText("Draft solitaire") as HTMLTextAreaElement;
  draft.focus();
  draft.setSelectionRange(2, 6);
  expect(press().defaultPrevented).toBe(true);
  expect(focused()).toBe("paint");
  expect(document.activeElement?.getAttribute("data-bbd-window-id")).toBe("paint");
  expect(draft.value).toBe("Unsent draft");
  expect([draft.selectionStart, draft.selectionEnd]).toEqual([2, 6]);
  press(); expect(focused()).toBe("minesweeper");
  press(); expect(focused()).toBe("solitaire");
  press({ key: "~", shiftKey: true }); expect(focused()).toBe("minesweeper");
});

it("restores minimized windows, including their attached windows, using normal focus semantics", () => {
  mount([{ kind: "thread", threadId: "t1" }, { kind: "buddy-list", threadId: "t1" }, { kind: "panel", threadId: "t1" }], true);
  press();
  expect(focused()).toBe("thread:t1");
  expect(document.querySelectorAll("[data-bbd-window-id]")).toHaveLength(3);
  press(); expect(focused()).toBe("buddy-list:t1");
  press(); expect(focused()).toBe("panel:t1");
});

it("does not consume zero/one visible window shortcuts, but restores one minimized window", () => {
  const empty = mount([]);
  expect(press().defaultPrevented).toBe(false);
  empty.unmount();
  const single = mount([{ kind: "paint" }]);
  expect(press().defaultPrevented).toBe(false);
  single.unmount();
  mount([{ kind: "paint" }], true);
  expect(press().defaultPrevented).toBe(true);
  expect(focused()).toBe("paint");
});

it("leaves typing, text-editing modifiers, IME, repeat, terminals, modals and handled events alone", () => {
  const ui = mount();
  ui.getByLabelText("Draft solitaire").focus();
  for (const init of [{ ctrlKey: false }, { metaKey: true }, { altKey: true }, { isComposing: true },
    { keyCode: 229 }, { repeat: true }, { key: "Dead", code: "Backquote" }, { key: "a" }, { key: "z" }]) {
    expect(press(init).defaultPrevented).toBe(false);
    expect(focused()).toBe("solitaire");
  }
  const handled = new KeyboardEvent("keydown", { key: "`", ctrlKey: true, bubbles: true, cancelable: true });
  handled.preventDefault();
  fireEvent(document.activeElement!, handled);
  expect(focused()).toBe("solitaire");
  document.activeElement!.classList.add("xterm");
  expect(press().defaultPrevented).toBe(false);
  document.activeElement!.classList.remove("xterm");
  const modal = document.createElement("div");
  modal.setAttribute("aria-modal", "true");
  document.body.append(modal);
  expect(press().defaultPrevented).toBe(false);
  modal.remove();
  ui.unmount();
  expect(press().defaultPrevented).toBe(false);
});
