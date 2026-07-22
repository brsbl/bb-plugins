// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const composerState = vi.hoisted(() => ({
  current: {} as Record<string, unknown>,
}));

vi.mock("@bb/plugin-sdk/app", () => ({
  useComposer: () => composerState.current,
}));

const { UiPatternsComposerAction } = await import("./composer-action.js");

afterEach(() => {
  composerState.current = {};
  cleanup();
  vi.clearAllMocks();
});

describe("UI Patterns composer action", () => {
  it("opens the registered UI Patterns thread panel", () => {
    const experimentalOpenThreadPanel = vi.fn(() => true);
    composerState.current = {
      experimental_openThreadPanel: experimentalOpenThreadPanel,
    };

    render(<UiPatternsComposerAction />);
    fireEvent.click(
      screen.getByRole("button", { name: "Open UI Patterns" }),
    );

    expect(experimentalOpenThreadPanel).toHaveBeenCalledTimes(1);
    expect(experimentalOpenThreadPanel).toHaveBeenCalledWith({
      actionId: "library-panel",
      title: "UI Patterns",
    });
  });

  it("omits the action when the experimental host bridge is unavailable", () => {
    const { container } = render(<UiPatternsComposerAction />);

    expect(container.innerHTML).toBe("");
  });
});
