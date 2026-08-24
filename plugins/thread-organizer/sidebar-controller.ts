import {
  cloneWorkflowConfig,
  editableWorkflowConfig,
  parseWorkflowConfig,
  type EditableWorkflowConfig,
  type WorkflowConfig,
} from "./core.js";

const SIDEBAR_SELECTOR = '[data-sidebar="sidebar"]';
const STICKY_GROUP_SELECTOR = "[data-sidebar-sticky-group]";
const SECTION_TOGGLE_SELECTOR = 'button[aria-expanded][aria-label$=" section"]';
const SECTION_ROW_TOGGLE_SELECTOR = 'button[aria-hidden="true"][tabindex="-1"]';
const MANUAL_SECTION_ORDER_STORAGE_KEY = "bb.sidebar.manualSectionOrder";

export const WORKFLOW_CACHE_STORAGE_KEY = "bb.thread-organizer.workflow-config";
export const WORKFLOW_CONFIG_EVENT = "bb-thread-organizer-workflow-config";

interface MountThreadOrganizerSidebarOptions {
  document?: Document;
  loadConfig?: () => Promise<WorkflowConfig>;
  pluginId: string;
  saveConfig?: (config: EditableWorkflowConfig) => Promise<WorkflowConfig>;
  signal: AbortSignal;
}

interface SidebarController {
  applyConfiguredOrder: () => void;
  dispose: () => void;
}

function groupToggle(group: Element): HTMLButtonElement | null {
  for (const button of group.querySelectorAll<HTMLButtonElement>(
    SECTION_TOGGLE_SELECTOR,
  )) {
    if (button.closest(STICKY_GROUP_SELECTOR) === group) return button;
  }
  return null;
}

function groupSectionId(group: Element): string | null {
  return group.getAttribute("data-sidebar-section-id");
}

function parsedCachedConfig(view: Window): WorkflowConfig | null {
  try {
    const raw = view.localStorage.getItem(WORKFLOW_CACHE_STORAGE_KEY);
    return raw === null ? null : parseWorkflowConfig(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function cacheWorkflowConfig(
  config: WorkflowConfig,
  view: Window = window,
): void {
  const snapshot = cloneWorkflowConfig(config);
  view.localStorage.setItem(
    WORKFLOW_CACHE_STORAGE_KEY,
    JSON.stringify(snapshot),
  );
  view.dispatchEvent(
    new CustomEvent(WORKFLOW_CONFIG_EVENT, { detail: snapshot }),
  );
}

async function fetchWorkflowConfig(pluginId: string): Promise<WorkflowConfig> {
  const response = await fetch(
    `/api/v1/plugins/${encodeURIComponent(pluginId)}/rpc/getConfig`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}",
    },
  );
  if (!response.ok) {
    throw new Error(
      `Thread Organizer config request failed (${response.status})`,
    );
  }
  const payload: unknown = await response.json();
  if (
    typeof payload !== "object" ||
    payload === null ||
    !("ok" in payload) ||
    payload.ok !== true ||
    !("result" in payload)
  ) {
    throw new Error("Thread Organizer returned an invalid config response");
  }
  const config = parseWorkflowConfig(payload.result);
  if (config === null) {
    throw new Error("Thread Organizer returned an invalid workflow config");
  }
  return config;
}

async function saveWorkflowConfig(
  pluginId: string,
  config: EditableWorkflowConfig,
): Promise<WorkflowConfig> {
  const response = await fetch(
    `/api/v1/plugins/${encodeURIComponent(pluginId)}/rpc/saveConfig`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(config),
    },
  );
  if (!response.ok) {
    throw new Error(
      `Thread Organizer config save failed (${response.status})`,
    );
  }
  const payload: unknown = await response.json();
  if (
    typeof payload !== "object" ||
    payload === null ||
    !("ok" in payload) ||
    payload.ok !== true ||
    !("result" in payload)
  ) {
    throw new Error("Thread Organizer returned an invalid config response");
  }
  const saved = parseWorkflowConfig(payload.result);
  if (saved === null) {
    throw new Error("Thread Organizer returned an invalid workflow config");
  }
  return saved;
}

function currentWorkflowSectionOrder(
  sidebar: Element,
  config: WorkflowConfig,
): string[] | null {
  const view = sidebar.ownerDocument.defaultView;
  if (view === null) return null;
  const raw = view.localStorage.getItem(MANUAL_SECTION_ORDER_STORAGE_KEY);
  if (raw === null) return null;
  let current: unknown;
  try {
    current = JSON.parse(raw);
  } catch {
    return null;
  }
  if (
    !Array.isArray(current) ||
    current.some((value) => typeof value !== "string")
  ) {
    return null;
  }

  const configuredSectionIds = new Set(
    config.stages.flatMap((stage) =>
      stage.sectionId === null ? [] : [stage.sectionId],
    ),
  );
  const orderedSectionIds = (current as string[]).flatMap((orderId) => {
    if (!orderId.startsWith("section:")) return [];
    const sectionId = orderId.slice("section:".length);
    return configuredSectionIds.has(sectionId) ? [sectionId] : [];
  });
  return orderedSectionIds.length === configuredSectionIds.size
    ? orderedSectionIds
    : null;
}

function configInSectionOrder(
  config: WorkflowConfig,
  sectionIds: readonly string[],
): WorkflowConfig | null {
  if (sectionIds.length !== config.stages.length) return null;
  const stageBySectionId = new Map(
    config.stages.flatMap((stage) =>
      stage.sectionId === null ? [] : [[stage.sectionId, stage] as const],
    ),
  );
  if (stageBySectionId.size !== config.stages.length) return null;
  const stages = sectionIds.flatMap((sectionId) => {
    const stage = stageBySectionId.get(sectionId);
    return stage === undefined ? [] : [{ ...stage }];
  });
  if (stages.length !== config.stages.length || stages[0]?.role !== "inbox") {
    return null;
  }
  return { ...config, stages };
}

function reorderWorkflowSections(
  sidebar: Element,
  config: WorkflowConfig,
): void {
  const view = sidebar.ownerDocument.defaultView;
  if (view === null) return;
  const rankByOrderId = new Map<string, number>(
    config.stages.flatMap((stage, index) =>
      stage.sectionId === null
        ? []
        : [[`section:${stage.sectionId}`, index] as const],
    ),
  );
  if (rankByOrderId.size < 2) return;

  const raw = view.localStorage.getItem(MANUAL_SECTION_ORDER_STORAGE_KEY);
  if (raw === null) return;
  let current: unknown;
  try {
    current = JSON.parse(raw);
  } catch {
    return;
  }
  if (
    !Array.isArray(current) ||
    current.some((value) => typeof value !== "string")
  ) {
    return;
  }

  const currentOrder = current as string[];
  const positions = currentOrder.flatMap((id, index) =>
    rankByOrderId.has(id) ? [index] : [],
  );
  if (positions.length < 2) return;
  const configuredIds = positions
    .map((position) => currentOrder[position]!)
    .sort(
      (left, right) => rankByOrderId.get(left)! - rankByOrderId.get(right)!,
    );
  const nextOrder = [...currentOrder];
  positions.forEach((position, index) => {
    nextOrder[position] = configuredIds[index]!;
  });
  if (nextOrder.every((id, index) => id === currentOrder[index])) return;

  const nextRaw = JSON.stringify(nextOrder);
  view.localStorage.setItem(MANUAL_SECTION_ORDER_STORAGE_KEY, nextRaw);
  view.dispatchEvent(
    new view.StorageEvent("storage", {
      key: MANUAL_SECTION_ORDER_STORAGE_KEY,
      oldValue: raw,
      newValue: nextRaw,
      storageArea: view.localStorage,
      url: view.location.href,
    }),
  );
}

function mountSidebarController(
  sidebar: Element,
  signal: AbortSignal,
  getConfig: () => WorkflowConfig | null,
  onStageOrderChange: (sectionIds: readonly string[]) => boolean,
): SidebarController {
  const userExpansionBySectionId = new Map<string, boolean>();
  const pluginControls = new WeakSet<HTMLButtonElement>();
  let applyConfiguredOrder = true;
  let scheduled = false;

  const reconcile = () => {
    scheduled = false;
    if (signal.aborted || !sidebar.isConnected) return;
    const config = getConfig();
    if (config === null) return;
    if (applyConfiguredOrder) {
      applyConfiguredOrder = false;
      reorderWorkflowSections(sidebar, config);
    } else {
      const currentOrder = currentWorkflowSectionOrder(sidebar, config);
      const configuredOrder = config.stages.flatMap((stage) =>
        stage.sectionId === null ? [] : [stage.sectionId],
      );
      if (
        currentOrder !== null &&
        !currentOrder.every(
          (sectionId, index) => sectionId === configuredOrder[index],
        ) &&
        !onStageOrderChange(currentOrder)
      ) {
        reorderWorkflowSections(sidebar, config);
      }
    }
    const inbox = config.stages.find((stage) => stage.role === "inbox");
    const configuredIds = new Set(
      config.stages.flatMap((stage) =>
        stage.sectionId === null ? [] : [stage.sectionId],
      ),
    );

    for (const group of sidebar.querySelectorAll(STICKY_GROUP_SELECTOR)) {
      const sectionId = groupSectionId(group);
      if (sectionId === null || !configuredIds.has(sectionId)) continue;
      const toggle = groupToggle(group);
      if (toggle === null) continue;
      const expanded = toggle.getAttribute("aria-expanded") === "true";
      const userPreference = userExpansionBySectionId.get(sectionId);
      const desired = userPreference ?? sectionId === inbox?.sectionId;
      if (expanded === desired) continue;
      pluginControls.add(toggle);
      toggle.click();
      queueMicrotask(() => pluginControls.delete(toggle));
    }
  };

  const schedule = () => {
    if (scheduled || signal.aborted) return;
    scheduled = true;
    queueMicrotask(reconcile);
  };

  const requestConfiguredOrder = () => {
    applyConfiguredOrder = true;
    schedule();
  };

  const recordUserToggle = (event: Event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const control = target.closest<HTMLButtonElement>(
      `${SECTION_TOGGLE_SELECTOR}, ${SECTION_ROW_TOGGLE_SELECTOR}`,
    );
    if (control === null || pluginControls.has(control)) return;
    const group = control.closest(STICKY_GROUP_SELECTOR);
    const sectionId = group === null ? null : groupSectionId(group);
    if (group === null || sectionId === null) return;
    const config = getConfig();
    if (!config?.stages.some((stage) => stage.sectionId === sectionId)) return;
    const toggle = groupToggle(group);
    if (toggle === null) return;
    userExpansionBySectionId.set(
      sectionId,
      toggle.getAttribute("aria-expanded") !== "true",
    );
  };

  sidebar.addEventListener("click", recordUserToggle, true);
  const Observer =
    sidebar.ownerDocument.defaultView?.MutationObserver ?? MutationObserver;
  const observer = new Observer(schedule);
  observer.observe(sidebar, {
    attributeFilter: ["aria-expanded", "aria-label"],
    attributes: true,
    childList: true,
    subtree: true,
  });
  sidebar.addEventListener(
    "thread-organizer-config-changed",
    requestConfiguredOrder,
  );
  reconcile();

  return {
    applyConfiguredOrder: requestConfiguredOrder,
    dispose: () => {
      observer.disconnect();
      sidebar.removeEventListener("click", recordUserToggle, true);
      sidebar.removeEventListener(
        "thread-organizer-config-changed",
        requestConfiguredOrder,
      );
    },
  };
}

export function mountThreadOrganizerSidebar({
  document: targetDocument = document,
  loadConfig,
  pluginId,
  saveConfig = (config) => saveWorkflowConfig(pluginId, config),
  signal,
}: MountThreadOrganizerSidebarOptions): () => void {
  const view = targetDocument.defaultView;
  let config = view === null ? null : parsedCachedConfig(view);
  const controllers = new Map<Element, SidebarController>();
  let pendingSectionOrder: readonly string[] | null = null;
  let savingSectionOrder = false;

  const applyConfiguredOrder = () => {
    for (const controller of controllers.values()) {
      controller.applyConfiguredOrder();
    }
  };

  const updateConfig = (next: WorkflowConfig) => {
    config = cloneWorkflowConfig(next);
    if (view !== null) {
      view.localStorage.setItem(
        WORKFLOW_CACHE_STORAGE_KEY,
        JSON.stringify(config),
      );
    }
    mountSidebars();
    applyConfiguredOrder();
  };

  const savePendingSectionOrder = async () => {
    if (savingSectionOrder) return;
    savingSectionOrder = true;
    try {
      while (pendingSectionOrder !== null && !signal.aborted) {
        const requestedOrder = pendingSectionOrder;
        pendingSectionOrder = null;
        const next =
          config === null ? null : configInSectionOrder(config, requestedOrder);
        if (next === null) {
          applyConfiguredOrder();
          continue;
        }
        const saved = await saveConfig(editableWorkflowConfig(next));
        if (!signal.aborted) updateConfig(saved);
      }
    } catch {
      pendingSectionOrder = null;
      applyConfiguredOrder();
    } finally {
      savingSectionOrder = false;
      if (pendingSectionOrder !== null && !signal.aborted) {
        void savePendingSectionOrder();
      }
    }
  };

  const requestStageOrder = (sectionIds: readonly string[]): boolean => {
    if (config === null || configInSectionOrder(config, sectionIds) === null) {
      return false;
    }
    pendingSectionOrder = [...sectionIds];
    void savePendingSectionOrder();
    return true;
  };

  const mountSidebars = () => {
    for (const [sidebar, controller] of controllers) {
      if (!sidebar.isConnected) {
        controller.dispose();
        controllers.delete(sidebar);
      }
    }
    for (const sidebar of targetDocument.querySelectorAll(SIDEBAR_SELECTOR)) {
      if (!controllers.has(sidebar)) {
        controllers.set(
          sidebar,
          mountSidebarController(
            sidebar,
            signal,
            () => config,
            requestStageOrder,
          ),
        );
      }
    }
  };

  const onConfigEvent = (event: Event) => {
    const candidate =
      event instanceof CustomEvent ? parseWorkflowConfig(event.detail) : null;
    if (candidate !== null) updateConfig(candidate);
  };
  view?.addEventListener(WORKFLOW_CONFIG_EVENT, onConfigEvent);

  const Observer = view?.MutationObserver ?? MutationObserver;
  const discoveryObserver = new Observer(mountSidebars);
  discoveryObserver.observe(targetDocument.documentElement, {
    childList: true,
    subtree: true,
  });
  mountSidebars();
  void (loadConfig ?? (() => fetchWorkflowConfig(pluginId)))()
    .then((loaded) => {
      if (!signal.aborted) updateConfig(loaded);
    })
    .catch(() => undefined);

  const dispose = () => {
    discoveryObserver.disconnect();
    view?.removeEventListener(WORKFLOW_CONFIG_EVENT, onConfigEvent);
    for (const controller of controllers.values()) controller.dispose();
    controllers.clear();
  };
  signal.addEventListener("abort", dispose, { once: true });
  return dispose;
}

/** Compatibility alias for existing imports while the plugin migrates. */
export const mountInboxSectionCollapser = mountThreadOrganizerSidebar;
