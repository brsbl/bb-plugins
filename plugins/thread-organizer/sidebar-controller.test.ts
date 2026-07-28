// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";

import { mountInboxSectionCollapser } from "./sidebar-controller.js";

function section(
  label: string,
  expanded: boolean,
  threadIds: string[],
): HTMLElement {
  const group = document.createElement("div");
  group.dataset.sidebarStickyGroup = "";
  const button = document.createElement("button");
  button.setAttribute("aria-expanded", String(expanded));
  button.setAttribute(
    "aria-label",
    `${expanded ? "Collapse" : "Expand"} ${label} section`,
  );
  group.append(button);
  if (expanded) {
    for (const id of threadIds) {
      const row = document.createElement("a");
      row.dataset.sidebarThreadId = id;
      group.append(row);
    }
  }
  return group;
}

function setup() {
  const sidebar = document.createElement("aside");
  sidebar.dataset.sidebar = "sidebar";
  const pinned = section("Pinned", true, ["thr_active"]);
  const destination = section("Engineering", true, []);
  sidebar.append(pinned, destination);
  document.body.append(sidebar);
  const controller = new AbortController();
  mountInboxSectionCollapser({ document, signal: controller.signal });
  return { controller, destination, pinned, sidebar };
}

afterEach(() => {
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

describe("inbox section collapser", () => {
  it("collapses the destination section after a pinned thread is unpinned", async () => {
    const { controller, destination, pinned } = setup();
    const collapse = destination.querySelector("button")!;
    const click = vi.spyOn(collapse, "click");
    const row = pinned.querySelector<HTMLElement>(
      '[data-sidebar-thread-id="thr_active"]',
    )!;

    destination.append(row);

    await vi.waitFor(() => expect(click).toHaveBeenCalledOnce());
    controller.abort();
  });

  it("does not collapse a section when an ordinary thread is added", async () => {
    const { controller, destination } = setup();
    const collapse = destination.querySelector("button")!;
    const click = vi.spyOn(collapse, "click");
    const row = document.createElement("a");
    row.dataset.sidebarThreadId = "thr_new";

    destination.append(row);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(click).not.toHaveBeenCalled();
    controller.abort();
  });

  it("remembers pinned threads while the Pinned section is collapsed", async () => {
    const { controller, destination, pinned } = setup();
    const collapseDestination = destination.querySelector("button")!;
    const click = vi.spyOn(collapseDestination, "click");
    const row = pinned.querySelector<HTMLElement>(
      '[data-sidebar-thread-id="thr_active"]',
    )!;
    const pinnedToggle = pinned.querySelector("button")!;

    pinnedToggle.setAttribute("aria-expanded", "false");
    pinnedToggle.setAttribute("aria-label", "Expand Pinned section");
    row.remove();
    await new Promise((resolve) => setTimeout(resolve, 0));
    destination.append(row);

    await vi.waitFor(() => expect(click).toHaveBeenCalledOnce());
    controller.abort();
  });

  it("stops observing when the content script is aborted", async () => {
    const { controller, destination, pinned } = setup();
    const collapse = destination.querySelector("button")!;
    const click = vi.spyOn(collapse, "click");
    const row = pinned.querySelector<HTMLElement>(
      '[data-sidebar-thread-id="thr_active"]',
    )!;

    controller.abort();
    destination.append(row);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(click).not.toHaveBeenCalled();
  });
});
