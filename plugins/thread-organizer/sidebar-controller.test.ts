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
  button.addEventListener("click", () => {
    const nextExpanded = button.getAttribute("aria-expanded") !== "true";
    button.setAttribute("aria-expanded", String(nextExpanded));
    button.setAttribute(
      "aria-label",
      `${nextExpanded ? "Collapse" : "Expand"} ${label} section`,
    );
  });
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
  it("collapses every non-pinned section when the sidebar mounts", () => {
    const { controller, destination } = setup();

    expect(
      destination.querySelector("button")?.getAttribute("aria-expanded"),
    ).toBe("false");
    controller.abort();
  });

  it("collapses the destination section after a pinned thread is unpinned", async () => {
    const { controller, destination, pinned } = setup();
    const collapse = destination.querySelector("button")!;
    const click = vi.spyOn(collapse, "click");
    const row = pinned.querySelector<HTMLElement>(
      '[data-sidebar-thread-id="thr_active"]',
    )!;

    collapse.setAttribute("aria-expanded", "true");
    collapse.setAttribute("aria-label", "Collapse Engineering section");
    destination.append(row);

    await vi.waitFor(() => expect(click).toHaveBeenCalledOnce());
    expect(collapse.getAttribute("aria-expanded")).toBe("false");
    controller.abort();
  });

  it("preserves a section the user deliberately expands", async () => {
    const { controller, destination } = setup();
    const toggle = destination.querySelector("button")!;
    toggle.click();
    const click = vi.spyOn(toggle, "click");
    const row = document.createElement("a");
    row.dataset.sidebarThreadId = "thr_new";

    destination.append(row);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(click).not.toHaveBeenCalled();
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    controller.abort();
  });

  it("re-collapses a native destination expansion when Pinned is collapsed", async () => {
    const { controller, destination, pinned } = setup();
    const collapseDestination = destination.querySelector("button")!;
    const click = vi.spyOn(collapseDestination, "click");
    const row = pinned.querySelector<HTMLElement>(
      '[data-sidebar-thread-id="thr_active"]',
    )!;
    const pinnedToggle = pinned.querySelector("button")!;

    pinnedToggle.click();
    row.remove();
    await new Promise((resolve) => setTimeout(resolve, 0));
    collapseDestination.setAttribute("aria-expanded", "true");
    collapseDestination.setAttribute(
      "aria-label",
      "Collapse Engineering section",
    );
    destination.append(row);

    await vi.waitFor(() => expect(click).toHaveBeenCalledOnce());
    expect(collapseDestination.getAttribute("aria-expanded")).toBe("false");
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
