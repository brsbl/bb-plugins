// @vitest-environment jsdom
import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { WindowManagerProvider, useWindowManager, type WindowSpec } from "../windows";
import { WindowFrame } from "../windows/frame";
import { STORAGE_KEY } from "../windows/state";
import { useWindowCycle } from "./window-cycle";

function DesktopCycle() {
  const { cycle, canCycle } = useWindowCycle();
  const manager = useWindowManager();
  return <><button disabled={!canCycle} onClick={() => cycle(1)}>Next window</button><button disabled={!canCycle} onClick={() => cycle(-1)}>Previous window</button>{manager.windows.map((window) => <WindowFrame key={window.id} window={window} title={window.id} icon={null}>
    <textarea aria-label={`Draft ${window.id}`} defaultValue="Unsent draft" />
  </WindowFrame>)}</>;
}

function mount(specs: WindowSpec[] = [{ kind: "paint" }, { kind: "minesweeper" }, { kind: "solitaire" }], minimized = false) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(specs.map((spec, index) => ({
    spec, rect: { x: index * 20, y: 48, width: 400, height: 300 }, z: index + 1, minimized, restoreRect: null,
  }))));
  return render(<WindowManagerProvider sizeOf={() => ({ width: 400, height: 300 })}><DesktopCycle /></WindowManagerProvider>);
}

const focused = () => document.querySelector('[data-bbd-window-id][data-focused="true"]')?.getAttribute("data-bbd-window-id");
// jsdom lacks CSS.escape; fixture ids contain only selector-safe characters.
beforeEach(() => { vi.stubGlobal("CSS", { escape: (value: string) => value }); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); localStorage.clear(); document.body.innerHTML = ""; });

it("cycles every window in taskbar order, wraps, reverses and moves DOM focus from an unsent draft", () => {
  const ui = mount();
  const draft = ui.getByLabelText("Draft solitaire") as HTMLTextAreaElement;
  draft.focus();
  draft.setSelectionRange(2, 6);
  fireEvent.click(ui.getByText("Next window"));
  expect(focused()).toBe("paint");
  expect(document.activeElement?.getAttribute("data-bbd-window-id")).toBe("paint");
  expect(draft.value).toBe("Unsent draft");
  expect([draft.selectionStart, draft.selectionEnd]).toEqual([2, 6]);
  fireEvent.click(ui.getByText("Next window")); expect(focused()).toBe("minesweeper");
  fireEvent.click(ui.getByText("Next window")); expect(focused()).toBe("solitaire");
  fireEvent.click(ui.getByText("Previous window")); expect(focused()).toBe("minesweeper");
});

it("restores minimized windows, including their attached windows, using normal focus semantics", () => {
  const ui = mount([{ kind: "thread", threadId: "t1" }, { kind: "buddy-list", threadId: "t1" }, { kind: "panel", threadId: "t1" }], true);
  fireEvent.click(ui.getByText("Next window"));
  expect(focused()).toBe("thread:t1");
  expect(document.querySelectorAll("[data-bbd-window-id]")).toHaveLength(3);
  fireEvent.click(ui.getByText("Next window")); expect(focused()).toBe("buddy-list:t1");
  fireEvent.click(ui.getByText("Next window")); expect(focused()).toBe("panel:t1");
});

it("disables cycling with zero/one visible window, but restores one minimized window", () => {
  const empty = mount([]);
  expect((empty.getByText("Next window") as HTMLButtonElement).disabled).toBe(true);
  empty.unmount();
  const single = mount([{ kind: "paint" }]);
  expect((single.getByText("Next window") as HTMLButtonElement).disabled).toBe(true);
  single.unmount();
  const ui = mount([{ kind: "paint" }], true);
  fireEvent.click(ui.getByText("Next window"));
  expect(focused()).toBe("paint");
});
