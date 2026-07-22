// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { UiPatternsComposerAction } from "./composer-action.js";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("UI Patterns composer action", () => {
  it("opens the registered UI Patterns thread panel", () => {
    const openThreadPanel = vi.fn(() => true);

    render(<UiPatternsComposerAction openThreadPanel={openThreadPanel} />);
    fireEvent.click(screen.getByRole("button", { name: "Open UI Patterns" }));

    expect(openThreadPanel).toHaveBeenCalledTimes(1);
    expect(openThreadPanel).toHaveBeenCalledWith({
      actionId: "library-panel",
      title: "UI Patterns",
    });
  });

  it("omits the action when the host panel opener is unavailable", () => {
    const { container } = render(
      <UiPatternsComposerAction openThreadPanel={null} />,
    );

    expect(container.innerHTML).toBe("");
  });
});
