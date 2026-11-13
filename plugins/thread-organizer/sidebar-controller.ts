const SIDEBAR_SELECTOR = '[data-sidebar="sidebar"]';
const SECTION_ROW_SELECTOR = "[data-sidebar-section-id]";

/**
 * A drag in the sidebar only updates the thread list's stored order, which
 * sends no server event. Wait for that write to land before asking the
 * server to read it.
 */
export const SYNC_AFTER_REORDER_MS = 1_000;

interface MountThreadOrganizerSidebarOptions {
  document?: Document;
  pluginId: string;
  signal: AbortSignal;
  syncFromBb?: () => Promise<unknown>;
}

async function requestSyncFromBb(pluginId: string): Promise<void> {
  const response = await fetch(
    `/api/v1/plugins/${encodeURIComponent(pluginId)}/rpc/syncFromBb`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}",
    },
  );
  if (!response.ok) {
    throw new Error(`Thread Organizer sync failed (${response.status})`);
  }
}

function renderedSectionOrder(sidebar: Element): string {
  return [...sidebar.querySelectorAll(SECTION_ROW_SELECTOR)]
    .map((row) => row.getAttribute("data-sidebar-section-id") ?? "")
    .join("\n");
}

/**
 * Asks the server to sync from bb after the user reorders sections in the
 * sidebar. The server reads the order itself, so this script never writes
 * the config; it is only a trigger.
 */
export function mountThreadOrganizerSidebar({
  document: targetDocument = document,
  pluginId,
  signal,
  syncFromBb = () => requestSyncFromBb(pluginId),
}: MountThreadOrganizerSidebarOptions): () => void {
  const orderAtStart = new Map<Element, string>();
  let timer: ReturnType<typeof setTimeout> | null = null;

  const sidebarOf = (event: Event): Element | null =>
    event.target instanceof Element
      ? event.target.closest(SIDEBAR_SELECTOR)
      : null;

  const onStart = (event: Event) => {
    const sidebar = sidebarOf(event);
    if (sidebar) orderAtStart.set(sidebar, renderedSectionOrder(sidebar));
  };

  const onEnd = (event: Event) => {
    const sidebar = sidebarOf(event);
    if (!sidebar || !orderAtStart.has(sidebar)) return;
    if (timer !== null) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      const before = orderAtStart.get(sidebar);
      orderAtStart.delete(sidebar);
      if (signal.aborted || before === renderedSectionOrder(sidebar)) return;
      void syncFromBb().catch(() => undefined);
    }, SYNC_AFTER_REORDER_MS);
  };

  const startEvents = ["pointerdown", "keydown"] as const;
  const endEvents = ["pointerup", "keyup", "drop", "dragend"] as const;
  for (const type of startEvents) targetDocument.addEventListener(type, onStart, true);
  for (const type of endEvents) targetDocument.addEventListener(type, onEnd, true);

  const dispose = () => {
    if (timer !== null) clearTimeout(timer);
    for (const type of startEvents) targetDocument.removeEventListener(type, onStart, true);
    for (const type of endEvents) targetDocument.removeEventListener(type, onEnd, true);
  };
  signal.addEventListener("abort", dispose, { once: true });
  return dispose;
}
