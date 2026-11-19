// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  SYNC_AFTER_REORDER_MS,
  mountThreadOrganizerSidebar,
} from "./sidebar-controller.js";

function sidebar(...sectionIds: string[]): HTMLElement {
  const root = document.createElement("aside");
  root.dataset.sidebar = "sidebar";
  for (const id of sectionIds) {
    const group = document.createElement("div");
    group.dataset.sidebarSectionId = id;
    root.append(group);
  }
  document.body.append(root);
  return root;
}

function row(root: Element, id: string): Element {
  return root.querySelector(`[data-sidebar-section-id="${id}"]`)!;
}

function mount(syncFromBb = vi.fn(async () => undefined)) {
  const controller = new AbortController();
  mountThreadOrganizerSidebar({
    document,
    pluginId: "thread-organizer",
    signal: controller.signal,
    syncFromBb,
  });
  return { controller, syncFromBb };
}

afterEach(() => {
  document.body.replaceChildren();
  vi.useRealTimers();
});

describe("workflow sidebar controller", () => {
  it("asks the server to sync once the thread list has saved a section drag", () => {
    vi.useFakeTimers();
    const root = sidebar("sec_a", "sec_b", "sec_c");
    const { syncFromBb } = mount();

    row(root, "sec_a").dispatchEvent(new Event("pointerdown", { bubbles: true }));
    root.append(row(root, "sec_a"));
    row(root, "sec_a").dispatchEvent(new Event("pointerup", { bubbles: true }));
    vi.advanceTimersByTime(SYNC_AFTER_REORDER_MS - 1);
    expect(syncFromBb).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(syncFromBb).toHaveBeenCalledTimes(1);
  });

  it("ignores clicks that leave the section order alone", () => {
    vi.useFakeTimers();
    const root = sidebar("sec_a", "sec_b");
    const { syncFromBb } = mount();

    row(root, "sec_b").dispatchEvent(new Event("pointerdown", { bubbles: true }));
    row(root, "sec_b").dispatchEvent(new Event("pointerup", { bubbles: true }));
    vi.advanceTimersByTime(SYNC_AFTER_REORDER_MS);
    document.body.dispatchEvent(new Event("pointerup", { bubbles: true }));
    vi.advanceTimersByTime(SYNC_AFTER_REORDER_MS);
    expect(syncFromBb).not.toHaveBeenCalled();
  });

  it("stops listening once its signal aborts", () => {
    vi.useFakeTimers();
    const root = sidebar("sec_a", "sec_b");
    const { controller, syncFromBb } = mount();

    row(root, "sec_a").dispatchEvent(new Event("pointerdown", { bubbles: true }));
    root.append(row(root, "sec_a"));
    row(root, "sec_a").dispatchEvent(new Event("pointerup", { bubbles: true }));
    controller.abort();
    vi.advanceTimersByTime(SYNC_AFTER_REORDER_MS);
    expect(syncFromBb).not.toHaveBeenCalled();
  });

  it("calls the plugin's syncFromBb RPC by default", async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("{}", { status: 200 }));
    const root = sidebar("sec_a", "sec_b");
    const controller = new AbortController();
    mountThreadOrganizerSidebar({ document, pluginId: "org-dev", signal: controller.signal });

    row(root, "sec_a").dispatchEvent(new Event("keydown", { bubbles: true }));
    root.append(row(root, "sec_a"));
    row(root, "sec_a").dispatchEvent(new Event("keyup", { bubbles: true }));
    vi.advanceTimersByTime(SYNC_AFTER_REORDER_MS);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/plugins/org-dev/rpc/syncFromBb",
      expect.objectContaining({ method: "POST" }),
    );
    controller.abort();
  });
});
