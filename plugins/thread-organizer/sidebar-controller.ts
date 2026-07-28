const SIDEBAR_SELECTOR = '[data-sidebar="sidebar"]';
const STICKY_GROUP_SELECTOR = "[data-sidebar-sticky-group]";
const THREAD_SELECTOR = "[data-sidebar-thread-id]";
const SECTION_TOGGLE_SELECTOR =
  'button[aria-expanded][aria-label$=" section"]';
const SECTION_ROW_TOGGLE_SELECTOR =
  'button[aria-hidden="true"][tabindex="-1"]';

interface MountInboxSectionCollapserOptions {
  document?: Document;
  signal: AbortSignal;
}

function groupToggle(group: Element): HTMLButtonElement | null {
  for (const button of group.querySelectorAll<HTMLButtonElement>(
    SECTION_TOGGLE_SELECTOR,
  )) {
    if (button.closest(STICKY_GROUP_SELECTOR) === group) return button;
  }
  return null;
}

function isNativePinnedGroup(group: Element): boolean {
  const toggle = groupToggle(group);
  if (
    !/^(?:Expand|Collapse) Pinned section$/.test(
      toggle?.getAttribute("aria-label") ?? "",
    )
  ) {
    return false;
  }
  for (const button of group.querySelectorAll<HTMLButtonElement>(
    SECTION_ROW_TOGGLE_SELECTOR,
  )) {
    if (button.closest(STICKY_GROUP_SELECTOR) === group) return false;
  }
  return true;
}

function visibleThreadGroups(sidebar: Element): Map<string, Element> {
  const groups = new Map<string, Element>();
  for (const row of sidebar.querySelectorAll<HTMLElement>(THREAD_SELECTOR)) {
    const id = row.dataset.sidebarThreadId;
    const group = row.closest(STICKY_GROUP_SELECTOR);
    if (id && group) groups.set(id, group);
  }
  return groups;
}

function addExpandedGroupAndAncestors(
  controls: Set<HTMLButtonElement>,
  group: Element,
  userExpandedGroups: WeakSet<Element>,
  pendingUserExpandedGroups: WeakSet<Element>,
): void {
  let current: Element | null = group;
  while (current) {
    const toggle = groupToggle(current);
    if (
      !isNativePinnedGroup(current) &&
      toggle?.getAttribute("aria-expanded") === "true" &&
      !userExpandedGroups.has(current) &&
      !pendingUserExpandedGroups.has(current)
    ) {
      controls.add(toggle);
    }
    current =
      current.parentElement?.closest(STICKY_GROUP_SELECTOR) ?? null;
  }
}

function mountSidebarCollapser(
  sidebar: Element,
  signal: AbortSignal,
): () => void {
  const expandedByGroup = new WeakMap<Element, boolean>();
  const userExpandedGroups = new WeakSet<Element>();
  const pendingUserExpandedGroups = new WeakSet<Element>();
  const controllerCollapseControls = new WeakSet<HTMLButtonElement>();
  const pendingExpansionTimers = new Set<ReturnType<typeof setTimeout>>();
  const knownThreadGroups = visibleThreadGroups(sidebar);
  let scheduled = false;

  const reconcile = () => {
    scheduled = false;
    if (signal.aborted || !sidebar.isConnected) return;

    const currentThreadGroups = visibleThreadGroups(sidebar);
    const controls = new Set<HTMLButtonElement>();

    for (const group of sidebar.querySelectorAll(STICKY_GROUP_SELECTOR)) {
      const toggle = groupToggle(group);
      if (toggle === null || isNativePinnedGroup(group)) continue;
      const expanded = toggle.getAttribute("aria-expanded") === "true";
      const wasExpanded = expandedByGroup.get(group);
      if (!expanded) userExpandedGroups.delete(group);
      if (
        expanded &&
        !userExpandedGroups.has(group) &&
        !pendingUserExpandedGroups.has(group) &&
        (wasExpanded === undefined || wasExpanded === false)
      ) {
        controls.add(toggle);
      }
    }

    for (const [id, currentGroup] of currentThreadGroups) {
      const previousGroup = knownThreadGroups.get(id);
      if (previousGroup && previousGroup !== currentGroup) {
        addExpandedGroupAndAncestors(
          controls,
          currentGroup,
          userExpandedGroups,
          pendingUserExpandedGroups,
        );
      }
      knownThreadGroups.set(id, currentGroup);
    }

    for (const control of controls) {
      if (
        control.isConnected &&
        control.getAttribute("aria-expanded") === "true"
      ) {
        controllerCollapseControls.add(control);
        try {
          control.click();
        } finally {
          controllerCollapseControls.delete(control);
        }
      }
    }

    for (const group of sidebar.querySelectorAll(STICKY_GROUP_SELECTOR)) {
      const toggle = groupToggle(group);
      if (toggle !== null) {
        expandedByGroup.set(
          group,
          toggle.getAttribute("aria-expanded") === "true",
        );
      }
    }
  };

  const recordUserExpansion = (event: Event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const button = target.closest<HTMLButtonElement>(
      `${SECTION_TOGGLE_SELECTOR}, ${SECTION_ROW_TOGGLE_SELECTOR}`,
    );
    if (button === null) return;
    if (controllerCollapseControls.has(button)) return;
    const group = button.closest(STICKY_GROUP_SELECTOR);
    if (group === null) return;
    const toggle = groupToggle(group);
    if (toggle?.getAttribute("aria-expanded") === "true") {
      userExpandedGroups.add(group);
      return;
    }
    if (toggle !== null) {
      pendingUserExpandedGroups.add(group);
      const timer = setTimeout(() => {
        pendingExpansionTimers.delete(timer);
        pendingUserExpandedGroups.delete(group);
        if (
          !signal.aborted &&
          group.isConnected &&
          groupToggle(group)?.getAttribute("aria-expanded") === "true"
        ) {
          userExpandedGroups.add(group);
        }
        scheduleReconcile();
      }, 0);
      pendingExpansionTimers.add(timer);
    }
  };
  sidebar.addEventListener("click", recordUserExpansion, true);

  const scheduleReconcile = () => {
    if (scheduled || signal.aborted) return;
    scheduled = true;
    queueMicrotask(reconcile);
  };
  const observer = new MutationObserver(scheduleReconcile);
  observer.observe(sidebar, {
    attributeFilter: ["aria-expanded", "aria-label"],
    attributes: true,
    childList: true,
    subtree: true,
  });
  reconcile();
  signal.addEventListener(
    "abort",
    () => {
      observer.disconnect();
      for (const timer of pendingExpansionTimers) clearTimeout(timer);
      pendingExpansionTimers.clear();
      sidebar.removeEventListener("click", recordUserExpansion, true);
    },
    { once: true },
  );

  return () => {
    observer.disconnect();
    for (const timer of pendingExpansionTimers) clearTimeout(timer);
    pendingExpansionTimers.clear();
    sidebar.removeEventListener("click", recordUserExpansion, true);
  };
}

export function mountInboxSectionCollapser({
  document: targetDocument = document,
  signal,
}: MountInboxSectionCollapserOptions): () => void {
  const disposers = new Map<Element, () => void>();

  const mountSidebars = () => {
    for (const [sidebar, stop] of disposers) {
      if (!sidebar.isConnected) {
        stop();
        disposers.delete(sidebar);
      }
    }
    for (const sidebar of targetDocument.querySelectorAll(SIDEBAR_SELECTOR)) {
      if (!disposers.has(sidebar)) {
        disposers.set(sidebar, mountSidebarCollapser(sidebar, signal));
      }
    }
  };

  mountSidebars();
  const discoveryObserver = new MutationObserver(mountSidebars);
  discoveryObserver.observe(targetDocument.documentElement, {
    childList: true,
    subtree: true,
  });

  const dispose = () => {
    discoveryObserver.disconnect();
    for (const stop of disposers.values()) stop();
    disposers.clear();
  };
  signal.addEventListener("abort", dispose, { once: true });
  return dispose;
}
