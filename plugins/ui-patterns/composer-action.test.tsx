// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { UiPatternsComposerAction } from "./composer-action.js";

const navigation = vi.hoisted(() => ({
  openThreadPanel: vi.fn(() => true),
}));

vi.mock("@bb/plugin-sdk/app", () => ({
  useBbNavigate: () => ({
    experimental_openThreadPanel: navigation.openThreadPanel,
  }),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("UI Patterns composer action", () => {
  it("opens the registered UI Patterns thread panel", () => {
    render(<UiPatternsComposerAction />);
    fireEvent.click(screen.getByRole("button", { name: "Open UI Patterns" }));

    expect(navigation.openThreadPanel).toHaveBeenCalledTimes(1);
    expect(navigation.openThreadPanel).toHaveBeenCalledWith({
      actionId: "library-panel",
      title: "UI Patterns",
    });
  });

  it("keeps the action visible when the current surface declines navigation", () => {
    navigation.openThreadPanel.mockReturnValueOnce(false);

    render(<UiPatternsComposerAction />);
    fireEvent.click(screen.getByRole("button", { name: "Open UI Patterns" }));

    expect(navigation.openThreadPanel).toHaveBeenCalledTimes(1);
  });
});
