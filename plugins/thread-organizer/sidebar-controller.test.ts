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
  const rowToggle = document.createElement("button");
  rowToggle.setAttribute("aria-hidden", "true");
  rowToggle.tabIndex = -1;
  const setExpanded = (nextExpanded: boolean) => {
    button.setAttribute("aria-expanded", String(nextExpanded));
    button.setAttribute(
      "aria-label",
      `${nextExpanded ? "Collapse" : "Expand"} ${label} section`,
    );
  };
  setExpanded(expanded);
  button.addEventListener("click", () => {
    setExpanded(button.getAttribute("aria-expanded") !== "true");
  });
  rowToggle.addEventListener("click", () => {
    setExpanded(button.getAttribute("aria-expanded") !== "true");
  });
  group.append(button, rowToggle);
  for (const id of threadIds) {
    const row = document.createElement("a");
    row.dataset.sidebarThreadId = id;
    group.append(row);
  }
  return group;
}

function sidebar(...groups: HTMLElement[]): HTMLElement {
  const root = document.createElement("aside");
  root.dataset.sidebar = "sidebar";
  root.append(...groups);
  return root;
}

function setup() {
  const pinned = section("Pinned", true, ["thr_active"]);
  const destination = section("Engineering", true, []);
  const root = sidebar(pinned, destination);
  document.body.append(root);
  const controller = new AbortController();
  mountInboxSectionCollapser({ document, signal: controller.signal });
  return { controller, destination, pinned, sidebar: root };
}

function toggle(group: Element): HTMLButtonElement {
  return group.querySelector<HTMLButtonElement>("button[aria-expanded]")!;
}

async function mutationsSettled(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

afterEach(() => {
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

describe("inbox section collapser", () => {
  it("collapses every section, including the inbox, when the sidebar mounts", () => {
    const { controller, destination, pinned } = setup();

    expect(toggle(destination).getAttribute("aria-expanded")).toBe("false");
    expect(toggle(pinned).getAttribute("aria-expanded")).toBe("false");
    controller.abort();
  });

  it("collapses the destination section after a thread moves between groups", async () => {
    const { controller, destination, pinned } = setup();
    const collapse = toggle(destination);
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

  it("remembers a thread while collapsed section contents are unmounted", async () => {
    const { controller, destination, pinned } = setup();
    const collapse = toggle(destination);
    const click = vi.spyOn(collapse, "click");
    const row = pinned.querySelector<HTMLElement>(
      '[data-sidebar-thread-id="thr_active"]',
    )!;

    row.remove();
    await mutationsSettled();
    collapse.setAttribute("aria-expanded", "true");
    collapse.setAttribute("aria-label", "Collapse Engineering section");
    destination.append(row);

    await vi.waitFor(() => expect(click).toHaveBeenCalledOnce());
    expect(collapse.getAttribute("aria-expanded")).toBe("false");
    controller.abort();
  });

  it("preserves a section the user deliberately expands with its chevron", async () => {
    const { controller, destination } = setup();
    const sectionToggle = toggle(destination);
    sectionToggle.click();
    const click = vi.spyOn(sectionToggle, "click");
    const row = document.createElement("a");
    row.dataset.sidebarThreadId = "thr_new";

    destination.append(row);
    await mutationsSettled();

    expect(click).not.toHaveBeenCalled();
    expect(sectionToggle.getAttribute("aria-expanded")).toBe("true");
    controller.abort();
  });

  it("preserves a section the user deliberately expands with the native full row", async () => {
    const { controller, destination } = setup();
    const sectionToggle = toggle(destination);
    const rowToggle = destination.querySelector<HTMLButtonElement>(
      'button[aria-hidden="true"][tabindex="-1"]',
    )!;
    rowToggle.click();
    const click = vi.spyOn(sectionToggle, "click");
    const row = document.createElement("a");
    row.dataset.sidebarThreadId = "thr_new";

    destination.append(row);
    await mutationsSettled();

    expect(click).not.toHaveBeenCalled();
    expect(sectionToggle.getAttribute("aria-expanded")).toBe("true");
    controller.abort();
  });

  it("keeps a deliberately expanded destination open when a known thread moves into it", async () => {
    const { controller, destination, pinned } = setup();
    const sectionToggle = toggle(destination);
    sectionToggle.click();
    await mutationsSettled();
    const click = vi.spyOn(sectionToggle, "click");
    const row = pinned.querySelector<HTMLElement>(
      '[data-sidebar-thread-id="thr_active"]',
    )!;

    destination.append(row);
    await mutationsSettled();

    expect(click).not.toHaveBeenCalled();
    expect(sectionToggle.getAttribute("aria-expanded")).toBe("true");
    controller.abort();
  });

  it("does not preserve expansion intent when the native row click is suppressed", async () => {
    const { controller, destination } = setup();
    const sectionToggle = toggle(destination);
    const nativeRowToggle = destination.querySelector<HTMLButtonElement>(
      'button[aria-hidden="true"][tabindex="-1"]',
    )!;
    const suppressedRowToggle = nativeRowToggle.cloneNode(
      true,
    ) as HTMLButtonElement;
    nativeRowToggle.replaceWith(suppressedRowToggle);
    await mutationsSettled();

    suppressedRowToggle.click();
    await mutationsSettled();
    expect(sectionToggle.getAttribute("aria-expanded")).toBe("false");

    const click = vi.spyOn(sectionToggle, "click");
    sectionToggle.setAttribute("aria-expanded", "true");
    sectionToggle.setAttribute(
      "aria-label",
      "Collapse Engineering section",
    );

    await vi.waitFor(() => expect(click).toHaveBeenCalledOnce());
    expect(sectionToggle.getAttribute("aria-expanded")).toBe("false");
    controller.abort();
  });

  it("does not mistake a section action for a deliberate expansion", async () => {
    const { controller, destination } = setup();
    const sectionToggle = toggle(destination);
    const action = document.createElement("button");
    action.textContent = "Section action";
    destination.append(action);

    action.click();
    sectionToggle.setAttribute("aria-expanded", "true");
    sectionToggle.setAttribute(
      "aria-label",
      "Collapse Engineering section",
    );

    await vi.waitFor(() =>
      expect(sectionToggle.getAttribute("aria-expanded")).toBe("false"),
    );
    controller.abort();
  });

  it("tracks duplicate labels as independent section elements", async () => {
    const first = section("Engineering", true, []);
    const second = section("Engineering", true, []);
    const root = sidebar(first, second);
    document.body.append(root);
    const controller = new AbortController();
    mountInboxSectionCollapser({ document, signal: controller.signal });
    const firstToggle = toggle(first);
    const secondToggle = toggle(second);

    firstToggle.click();
    await mutationsSettled();
    secondToggle.setAttribute("aria-expanded", "true");
    secondToggle.setAttribute("aria-label", "Collapse Engineering section");

    await vi.waitFor(() =>
      expect(secondToggle.getAttribute("aria-expanded")).toBe("false"),
    );
    expect(firstToggle.getAttribute("aria-expanded")).toBe("true");
    controller.abort();
  });

  it("does not give a custom section named Pinned special treatment", () => {
    const customPinned = section("Pinned", true, []);
    const root = sidebar(customPinned);
    document.body.append(root);
    const controller = new AbortController();
    mountInboxSectionCollapser({ document, signal: controller.signal });

    expect(toggle(customPinned).getAttribute("aria-expanded")).toBe("false");
    controller.abort();
  });

  it("mounts replacement sidebars and stops handling the detached root", async () => {
    const { controller, destination, sidebar: oldSidebar } = setup();
    const oldToggle = toggle(destination);
    oldSidebar.remove();

    const replacementGroup = section("Product", true, []);
    const replacement = sidebar(replacementGroup);
    document.body.append(replacement);

    await vi.waitFor(() =>
      expect(toggle(replacementGroup).getAttribute("aria-expanded")).toBe(
        "false",
      ),
    );

    oldToggle.setAttribute("aria-expanded", "true");
    oldToggle.setAttribute("aria-label", "Collapse Engineering section");
    destination.append(document.createElement("span"));
    await mutationsSettled();

    expect(oldToggle.getAttribute("aria-expanded")).toBe("true");
    controller.abort();
  });

  it("stops observing when the content script is aborted", async () => {
    const { controller, destination } = setup();
    const collapse = toggle(destination);
    const click = vi.spyOn(collapse, "click");

    controller.abort();
    collapse.setAttribute("aria-expanded", "true");
    destination.append(document.createElement("span"));
    await mutationsSettled();

    expect(click).not.toHaveBeenCalled();
  });
});
