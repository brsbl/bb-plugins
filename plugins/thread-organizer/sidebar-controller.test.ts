// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";

import { mountInboxSectionCollapser } from "./sidebar-controller.js";

function section(
  label: string,
  expanded: boolean,
  threadIds: string[],
  commit: "sync" | "microtask" = "sync",
  hasFullRowToggle = true,
): HTMLElement {
  const group = document.createElement("div");
  group.dataset.sidebarStickyGroup = "";
  group.dataset.sidebarSectionId = label;
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
  const toggleExpanded = () => {
    const nextExpanded = button.getAttribute("aria-expanded") !== "true";
    if (commit === "microtask") {
      queueMicrotask(() => setExpanded(nextExpanded));
    } else {
      setExpanded(nextExpanded);
    }
  };
  button.addEventListener("click", () => {
    toggleExpanded();
  });
  rowToggle.addEventListener("click", () => {
    toggleExpanded();
  });
  group.append(button);
  if (hasFullRowToggle) group.append(rowToggle);
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
  const pinned = section("Pinned", true, ["thr_active"], "sync", false);
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

function sectionLabels(root: Element): string[] {
  return [...root.children].flatMap((slot) => {
    const group = slot.matches("[data-sidebar-sticky-group]")
      ? slot
      : slot.querySelector("[data-sidebar-sticky-group]");
    if (group === null) return [];
    const label = toggle(group).getAttribute("aria-label") ?? "";
    const match = /^(?:Expand|Collapse) (.+) section$/.exec(label);
    return match === null ? [] : [match[1]!];
  });
}

function persistedSectionOrder(...labels: string[]): string[] {
  return labels.map((label) => `section:${label}`);
}

function windowedSection(group: HTMLElement): HTMLElement {
  const stickySection = document.createElement("div");
  stickySection.dataset.sidebarStickySection = "";
  const windowedItem = document.createElement("div");
  windowedItem.dataset.sidebarWindowedItem = "";
  windowedItem.append(group);
  stickySection.append(windowedItem);
  const slot = document.createElement("div");
  slot.append(stickySection);
  return slot;
}

async function mutationsSettled(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

afterEach(() => {
  document.body.replaceChildren();
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe("inbox section collapser", () => {
  it("updates BB's persisted order while preserving unrelated section positions and focus", () => {
    const customBefore = section("Personal", false, []);
    const testing = section("✅ Testing / Deploy", false, []);
    const planning = section("📋 Planning", false, []);
    const customMiddle = section("Design", false, []);
    const inbox = section("📥 Inbox", false, []);
    const specReview = section("🔎 Spec Review", false, []);
    const building = section("🛠️ Building", false, []);
    const handoff = section("🤝 Handoff", false, []);
    const root = sidebar(
      ...[
        customBefore,
        testing,
        planning,
        customMiddle,
        inbox,
        specReview,
        building,
        handoff,
      ].map(windowedSection),
    );
    document.body.append(root);
    window.localStorage.setItem(
      "bb.sidebar.manualSectionOrder",
      JSON.stringify(
        persistedSectionOrder(
          "Personal",
          "✅ Testing / Deploy",
          "📋 Planning",
          "Design",
          "📥 Inbox",
          "🔎 Spec Review",
          "🛠️ Building",
          "🤝 Handoff",
        ),
      ),
    );
    const focusedToggle = toggle(planning);
    focusedToggle.focus();
    const controller = new AbortController();

    mountInboxSectionCollapser({ document, signal: controller.signal });

    expect(
      JSON.parse(
        window.localStorage.getItem("bb.sidebar.manualSectionOrder")!,
      ),
    ).toEqual(
      persistedSectionOrder(
        "Personal",
        "📥 Inbox",
        "📋 Planning",
        "Design",
        "🔎 Spec Review",
        "🛠️ Building",
        "✅ Testing / Deploy",
        "🤝 Handoff",
      ),
    );
    expect(sectionLabels(root)).toEqual([
      "Personal",
      "✅ Testing / Deploy",
      "📋 Planning",
      "Design",
      "📥 Inbox",
      "🔎 Spec Review",
      "🛠️ Building",
      "🤝 Handoff",
    ]);
    expect(document.activeElement).toBe(focusedToggle);
    controller.abort();
  });

  it("restores persisted phase order after the host inserts a section", async () => {
    const planning = windowedSection(section("📋 Planning", false, []));
    const building = windowedSection(section("🛠️ Building", false, []));
    const root = sidebar(planning, building);
    document.body.append(root);
    window.localStorage.setItem(
      "bb.sidebar.manualSectionOrder",
      JSON.stringify(persistedSectionOrder("📋 Planning", "🛠️ Building")),
    );
    const controller = new AbortController();
    mountInboxSectionCollapser({ document, signal: controller.signal });

    root.append(windowedSection(section("📥 Inbox", false, [])));
    window.localStorage.setItem(
      "bb.sidebar.manualSectionOrder",
      JSON.stringify(
        persistedSectionOrder("📋 Planning", "🛠️ Building", "📥 Inbox"),
      ),
    );
    await mutationsSettled();

    expect(
      JSON.parse(
        window.localStorage.getItem("bb.sidebar.manualSectionOrder")!,
      ),
    ).toEqual(
      persistedSectionOrder("📥 Inbox", "📋 Planning", "🛠️ Building"),
    );
    controller.abort();
  });

  it("collapses sections on mount without collapsing the native Pinned inbox", () => {
    const { controller, destination, pinned } = setup();

    expect(toggle(destination).getAttribute("aria-expanded")).toBe("false");
    expect(toggle(pinned).getAttribute("aria-expanded")).toBe("true");
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

  it("never collapses the native Pinned inbox after a thread moves into it", async () => {
    const { controller, destination, pinned } = setup();
    const pinnedToggle = toggle(pinned);
    const click = vi.spyOn(pinnedToggle, "click");
    const row = pinned.querySelector<HTMLElement>(
      '[data-sidebar-thread-id="thr_active"]',
    )!;

    destination.append(row);
    await mutationsSettled();
    pinned.append(row);
    await mutationsSettled();

    expect(click).not.toHaveBeenCalled();
    expect(pinnedToggle.getAttribute("aria-expanded")).toBe("true");
    controller.abort();
  });

  it("collapses a top-level custom section named Pinned", async () => {
    const nativePinned = section(
      "Pinned",
      true,
      ["thr_active"],
      "sync",
      false,
    );
    const customPinned = section("Pinned", true, [], "sync", false);
    const action = document.createElement("button");
    action.setAttribute("aria-label", "New thread in Pinned");
    customPinned.append(action);
    const root = sidebar(nativePinned, customPinned);
    document.body.append(root);
    const controller = new AbortController();
    mountInboxSectionCollapser({ document, signal: controller.signal });
    const nativeToggle = toggle(nativePinned);
    const customToggle = toggle(customPinned);

    expect(nativeToggle.getAttribute("aria-expanded")).toBe("true");
    expect(customToggle.getAttribute("aria-expanded")).toBe("false");

    const customClick = vi.spyOn(customToggle, "click");
    const row = nativePinned.querySelector<HTMLElement>(
      '[data-sidebar-thread-id="thr_active"]',
    )!;
    customToggle.setAttribute("aria-expanded", "true");
    customToggle.setAttribute("aria-label", "Collapse Pinned section");
    customPinned.append(row);

    await vi.waitFor(() => expect(customClick).toHaveBeenCalledOnce());
    expect(customToggle.getAttribute("aria-expanded")).toBe("false");
    expect(nativeToggle.getAttribute("aria-expanded")).toBe("true");
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

  it("preserves a deliberate expansion when the native state commit is deferred", async () => {
    const destination = section("Engineering", false, [], "microtask");
    const root = sidebar(destination);
    document.body.append(root);
    const controller = new AbortController();
    mountInboxSectionCollapser({ document, signal: controller.signal });
    const sectionToggle = toggle(destination);

    sectionToggle.click();
    await mutationsSettled();

    expect(sectionToggle.getAttribute("aria-expanded")).toBe("true");
    controller.abort();
  });

  it("records a deliberate expansion when native handling runs first", async () => {
    const destination = section("Engineering", false, []);
    const originalToggle = toggle(destination);
    const sectionToggle = originalToggle.cloneNode(true) as HTMLButtonElement;
    originalToggle.replaceWith(sectionToggle);
    const root = sidebar(destination);
    root.addEventListener(
      "click",
      () => {
        sectionToggle.setAttribute("aria-expanded", "true");
        sectionToggle.setAttribute(
          "aria-label",
          "Collapse Engineering section",
        );
      },
      true,
    );
    document.body.append(root);
    const controller = new AbortController();
    mountInboxSectionCollapser({ document, signal: controller.signal });

    sectionToggle.click();
    await mutationsSettled();

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

  it("retries a controller collapse once when drag-click suppression swallows it", async () => {
    const destination = section("Engineering", true, []);
    let suppressNextClick = true;
    destination.addEventListener(
      "click",
      (event) => {
        if (!suppressNextClick) return;
        suppressNextClick = false;
        event.preventDefault();
        event.stopPropagation();
      },
      true,
    );
    const root = sidebar(destination);
    document.body.append(root);
    const sectionToggle = toggle(destination);
    const click = vi.spyOn(sectionToggle, "click");
    const controller = new AbortController();

    mountInboxSectionCollapser({ document, signal: controller.signal });

    await vi.waitFor(() =>
      expect(sectionToggle.getAttribute("aria-expanded")).toBe("false"),
    );
    expect(click).toHaveBeenCalledTimes(2);
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
