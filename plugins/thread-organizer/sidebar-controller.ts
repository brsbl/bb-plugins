const SIDEBAR_SELECTOR = '[data-sidebar="sidebar"]';
const STICKY_GROUP_SELECTOR = "[data-sidebar-sticky-group]";
const THREAD_SELECTOR = "[data-sidebar-thread-id]";

interface MountInboxSectionCollapserOptions {
  document?: Document;
  signal: AbortSignal;
}

function sectionToggle(
  group: Element,
  label: string,
): HTMLButtonElement | null {
  for (const button of group.querySelectorAll<HTMLButtonElement>(
    'button[aria-expanded][aria-label]',
  )) {
    if (button.closest(STICKY_GROUP_SELECTOR) !== group) continue;
    if (button.getAttribute("aria-label") === label) return button;
  }
  return null;
}

function pinnedGroup(sidebar: Element): Element | null {
  for (const group of sidebar.querySelectorAll(STICKY_GROUP_SELECTOR)) {
    if (
      sectionToggle(group, "Collapse Pinned section") ||
      sectionToggle(group, "Expand Pinned section")
    ) {
      return group;
    }
  }
  return null;
}

function threadIds(group: Element): Set<string> {
  return new Set(
    [...group.querySelectorAll<HTMLElement>(THREAD_SELECTOR)]
      .map((row) => row.dataset.sidebarThreadId)
      .filter((id): id is string => typeof id === "string" && id.length > 0),
  );
}

function destinationCollapseToggle(row: Element): HTMLButtonElement | null {
  let group = row.closest(STICKY_GROUP_SELECTOR);
  while (group) {
    for (const button of group.querySelectorAll<HTMLButtonElement>(
      'button[aria-expanded="true"][aria-label^="Collapse "][aria-label$=" section"]',
    )) {
      if (button.closest(STICKY_GROUP_SELECTOR) === group) return button;
    }
    group = group.parentElement?.closest(STICKY_GROUP_SELECTOR) ?? null;
  }
  return null;
}

function findThreadOutsideGroup(
  sidebar: Element,
  id: string,
  excludedGroup: Element | null,
): Element | null {
  for (const row of sidebar.querySelectorAll<HTMLElement>(THREAD_SELECTOR)) {
    if (row.dataset.sidebarThreadId !== id) continue;
    if (excludedGroup?.contains(row)) continue;
    return row;
  }
  return null;
}

function mountSidebarCollapser(
  sidebar: Element,
  signal: AbortSignal,
): () => void {
  const initialPinnedGroup = pinnedGroup(sidebar);
  let knownPinnedIds =
    initialPinnedGroup === null ? new Set<string>() : threadIds(initialPinnedGroup);
  let scheduled = false;

  const reconcile = () => {
    scheduled = false;
    if (signal.aborted || !sidebar.isConnected) return;

    const currentPinnedGroup = pinnedGroup(sidebar);
    const pinnedToggle =
      currentPinnedGroup === null
        ? null
        : (sectionToggle(currentPinnedGroup, "Collapse Pinned section") ??
          sectionToggle(currentPinnedGroup, "Expand Pinned section"));
    const pinnedIsExpanded =
      pinnedToggle?.getAttribute("aria-expanded") === "true";

    if (currentPinnedGroup && pinnedIsExpanded) {
      const currentPinnedIds = threadIds(currentPinnedGroup);
      for (const id of currentPinnedIds) knownPinnedIds.add(id);
    }

    const controls = new Set<HTMLButtonElement>();
    for (const id of knownPinnedIds) {
      const row = findThreadOutsideGroup(sidebar, id, currentPinnedGroup);
      if (!row) continue;
      knownPinnedIds.delete(id);
      const control = destinationCollapseToggle(row);
      if (control) controls.add(control);
    }

    if (currentPinnedGroup && pinnedIsExpanded) {
      knownPinnedIds = threadIds(currentPinnedGroup);
    }

    for (const control of controls) {
      if (
        control.isConnected &&
        control.getAttribute("aria-expanded") === "true"
      ) {
        control.click();
      }
    }
  };

  const scheduleReconcile = () => {
    if (scheduled || signal.aborted) return;
    scheduled = true;
    queueMicrotask(reconcile);
  };
  const observer = new MutationObserver(scheduleReconcile);
  observer.observe(sidebar, { childList: true, subtree: true });
  signal.addEventListener("abort", () => observer.disconnect(), { once: true });

  return () => observer.disconnect();
}

export function mountInboxSectionCollapser({
  document: targetDocument = document,
  signal,
}: MountInboxSectionCollapserOptions): () => void {
  const disposers = new Map<Element, () => void>();

  const mountSidebars = () => {
    for (const sidebar of targetDocument.querySelectorAll(SIDEBAR_SELECTOR)) {
      if (!disposers.has(sidebar)) {
        disposers.set(sidebar, mountSidebarCollapser(sidebar, signal));
      }
    }
  };

  mountSidebars();
  let discoveryObserver: MutationObserver | null = null;
  if (disposers.size === 0) {
    discoveryObserver = new MutationObserver(() => {
      mountSidebars();
      if (disposers.size > 0) discoveryObserver?.disconnect();
    });
  }
  if (discoveryObserver) {
    discoveryObserver.observe(targetDocument.documentElement, {
      childList: true,
      subtree: true,
    });
  }

  const dispose = () => {
    discoveryObserver?.disconnect();
    for (const stop of disposers.values()) stop();
    disposers.clear();
  };
  signal.addEventListener("abort", dispose, { once: true });
  return dispose;
}
