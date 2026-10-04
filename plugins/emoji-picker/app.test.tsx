// @vitest-environment jsdom
import { fireEvent, waitFor, cleanup } from "@testing-library/react";
import { loadPluginApp, renderSlot } from "@get-bb/plugin-sdk/testing/app";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { parsePreferences, storageKey } from "./emojis";

const app = await loadPluginApp(() => import("./app"));
const page = app.navPanels[0]!;

beforeEach(() => localStorage.clear());
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

function clipboard(writeText = vi.fn().mockResolvedValue(undefined)) {
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
  return writeText;
}

describe("picker workflow", () => {
  it("copies the chosen skin tone and remembers it across mounts", async () => {
    const writeText = clipboard();
    const slot = renderSlot(page, { subPath: "" });
    fireEvent.change(slot.getByLabelText("Search emojis"), { target: { value: ":thumbsup:" } });
    fireEvent.change(slot.getByLabelText("Skin tone"), { target: { value: "3" } });
    fireEvent.click(slot.getByRole("button", { name: "Thumbs Up" }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith("👍🏽"));
    await slot.findByText("👍🏽 Copied");
    expect(parsePreferences(localStorage.getItem(storageKey))).toEqual({ tone: 3, recent: ["+1"] });
    slot.lifecycle.unmount();
    const reopened = renderSlot(page, { subPath: "" });
    fireEvent.click(reopened.getByRole("button", { name: "Recently used" }));
    expect(reopened.getByRole("button", { name: "Thumbs Up" }).textContent).toBe("👍🏽");
    reopened.lifecycle.unmount();
  });

  it("offers manual copy when clipboard permission is denied without recording success", async () => {
    clipboard(vi.fn().mockRejectedValue(new Error("NotAllowedError")));
    const slot = renderSlot(page, { subPath: "" });
    fireEvent.change(slot.getByLabelText("Search emojis"), { target: { value: "rocket" } });
    fireEvent.click(slot.getByRole("button", { name: "Rocket" }));
    const fallback = await slot.findByLabelText("Emoji to copy manually");
    expect((fallback as HTMLInputElement).value).toBe("🚀");
    expect(parsePreferences(localStorage.getItem(storageKey)).recent).toEqual([]);
    slot.lifecycle.unmount();
  });

  it("supports search-to-grid keyboard navigation and an empty-search recovery", async () => {
    clipboard();
    const slot = renderSlot(page, { subPath: "" });
    const search = slot.getByLabelText("Search emojis");
    fireEvent.change(search, { target: { value: "rocket" } });
    fireEvent.keyDown(search, { key: "ArrowDown" });
    expect(document.activeElement?.getAttribute("aria-label")).toBe("Rocket");
    fireEvent.change(search, { target: { value: "no-such-emoji-xyz" } });
    expect(slot.getByText("No emojis found")).toBeTruthy();
    fireEvent.click(slot.getByRole("button", { name: "Clear search" }));
    expect(slot.getByRole("button", { name: "Grinning Face" })).toBeTruthy();
    slot.lifecycle.unmount();
  });
});
