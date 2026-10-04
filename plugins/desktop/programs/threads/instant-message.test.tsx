// @vitest-environment jsdom
import { act, cleanup, render, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { DesktopWindow } from "../../windows";
import { ThreadWindow } from "./instant-message";

vi.mock("@get-bb/plugin-sdk/app", () => ({
  experimental_useSidebarThreadActions: () => ({}),
  ThreadChat: () => (
    <div data-scroll-footer="">
      <div data-promptbox-shell=""><div data-follow-up-composer-anchor="">
        <form data-promptbox=""><textarea /><button data-promptbox-submit-action="" type="submit" aria-label="Submit" disabled /></form>
      </div></div>
    </div>
  ),
}));
vi.mock("../../shell/data", () => ({ useDesktop: () => ({ threadById: new Map() }) }));
vi.mock("../../shell/menu", () => ({ useMenu: () => ({}) }));
vi.mock("../../shell/menus", () => ({ threadMenu: () => [] }));
vi.mock("../../services/browser", () => ({ nativeBrowser: () => null }));
vi.mock("../../windows", () => ({
  useWindowManager: () => ({ windows: [] }),
  windowId: () => "fixture",
  WindowFrame: ({ window, children }: { window: DesktopWindow; children: ReactNode }) => window.minimized ? null : children,
}));

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

const windowState = (minimized: boolean) => ({ id: "thread:fixture", minimized } as DesktopWindow);

describe("AIM restored transcript", () => {
  it.each([false, true])("reconnects Send/Stop and contract checks (initially minimized: %s)", async (initiallyMinimized) => {
    const view = render(<ThreadWindow window={windowState(initiallyMinimized)} threadId="fixture" />);
    if (!initiallyMinimized) view.rerender(<ThreadWindow window={windowState(true)} threadId="fixture" />);
    view.rerender(<ThreadWindow window={windowState(false)} threadId="fixture" />);
    const host = view.container.querySelector<HTMLButtonElement>("[data-promptbox-submit-action]")!;
    const strip = view.container.querySelector<HTMLButtonElement>(".bbd-im-send")!;
    expect(strip.disabled).toBe(true);
    act(() => { host.disabled = false; });
    await waitFor(() => expect(strip.disabled).toBe(false));
    act(() => { host.type = "button"; host.setAttribute("aria-label", "Stop run"); });
    await waitFor(() => expect(strip.getAttribute("aria-label")).toBe("Stop"));
    const clicked = vi.fn();
    host.addEventListener("click", clicked);
    act(() => strip.click());
    expect(clicked).toHaveBeenCalledOnce();
    const warning = vi.spyOn(console, "warn").mockImplementation(() => {});
    act(() => host.remove());
    await waitFor(() => expect(view.container.querySelector(".bbd-im-chat")).toBeNull());
    expect(warning).toHaveBeenCalledOnce();
    // A mismatch stays latched even when restoring a fresh, intact transcript.
    view.rerender(<ThreadWindow window={windowState(true)} threadId="fixture" />);
    view.rerender(<ThreadWindow window={windowState(false)} threadId="fixture" />);
    expect(view.container.querySelector(".bbd-im-chat")).toBeNull();
    expect(warning).toHaveBeenCalledOnce();
  });
});
