// @vitest-environment jsdom
import { fireEvent, waitFor, cleanup } from "@testing-library/react";
import { loadPluginApp, renderSlot } from "@get-bb/plugin-sdk/testing/app";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { parsePreferences, storageKey } from "./emojis";

const app = await loadPluginApp(() => import("./app"));
const banner = app.composerCustomizations[0]!.banners![0]!;

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("colon picker workflow", () => {
  it("replaces the new colon in the middle of a draft and preserves its attachments", async () => {
    expect(app.navPanels).toHaveLength(0);
    expect(app.composerCustomizations[0]!.actions).toBeUndefined();
    const slot = renderSlot(banner, {}, { composer: { text: "Before  after", attachmentCount: 1 } });
    expect(slot.queryByLabelText("Search emojis")).toBeNull();
    await slot.behavior.setComposerText("Before : after");
    fireEvent.change(await slot.findByLabelText("Search emojis"), { target: { value: "rocket" } });
    fireEvent.click(slot.getByRole("button", { name: "Rocket" }));
    expect(slot.inspection.composer.text).toBe("Before 🚀 after");
    expect(slot.inspection.composer.attachmentCount).toBe(1);
    expect(slot.inspection.composer.submits).toEqual([]);
    await waitFor(() => expect(slot.queryByLabelText("Search emojis")).toBeNull());
  });

  it("leaves a dismissed colon intact and does not reopen for saved or changed drafts", async () => {
    const slot = renderSlot(banner, {}, { composer: { text: "Saved:" } });
    expect(slot.queryByLabelText("Search emojis")).toBeNull();
    await slot.behavior.setComposerText("Saved: :");
    fireEvent.keyDown(await slot.findByLabelText("Search emojis"), { key: "Escape" });
    await waitFor(() => expect(slot.queryByLabelText("Search emojis")).toBeNull());
    expect(slot.inspection.composer.text).toBe("Saved: :");
    await slot.behavior.setComposerText("Saved: : text");
    expect(slot.queryByLabelText("Search emojis")).toBeNull();
    await slot.behavior.setComposerText("Saved: : text:");
    await slot.findByLabelText("Search emojis");
    await slot.behavior.setComposerScope({ kind: "thread", threadId: "different-thread" });
    await waitFor(() => expect(slot.queryByLabelText("Search emojis")).toBeNull());
    expect(slot.inspection.composer.text).toBe("Saved: : text:");
  });

  it("inserts a preferred skin tone with the keyboard and remembers recent choices", async () => {
    const slot = renderSlot(banner, {});
    await slot.behavior.setComposerText(":");
    const search = await slot.findByLabelText("Search emojis");
    fireEvent.change(search, { target: { value: ":thumbsup:" } });
    fireEvent.change(slot.getByLabelText("Skin tone"), { target: { value: "3" } });
    fireEvent.keyDown(search, { key: "Enter" });
    expect(slot.inspection.composer.text).toBe("👍🏽");
    expect(parsePreferences(localStorage.getItem(storageKey))).toEqual({ tone: 3, recent: ["+1"] });
    slot.lifecycle.unmount();
    const reopened = renderSlot(banner, {});
    await reopened.behavior.setComposerText(":");
    fireEvent.click(await reopened.findByRole("button", { name: "Recently used" }));
    expect(reopened.getByRole("button", { name: "Thumbs Up" }).textContent).toBe("👍🏽");
    fireEvent.change(reopened.getByLabelText("Search emojis"), { target: { value: "no-such-emoji-xyz" } });
    expect(reopened.getByText("No emojis found")).toBeTruthy();
    fireEvent.click(reopened.getByRole("button", { name: "Clear search" }));
    fireEvent.keyDown(reopened.getByLabelText("Search emojis"), { key: "ArrowDown" });
    expect(document.activeElement?.getAttribute("aria-label")).toBe("Thumbs Up");
  });
});
