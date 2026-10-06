import {
  cloneWorkflowConfig,
  editableWorkflowConfig,
  parseWorkflowConfig,
  type EditableWorkflowConfig,
  type WorkflowConfig,
} from "./core.js";

const SIDEBAR_SELECTOR = '[data-sidebar="sidebar"]';
const SECTION_ROW_SELECTOR = "[data-sidebar-section-id]";

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
  dispose: () => void;
  /** Ignore the current interaction, so a refused save is not retried. */
  forgetInteraction: () => void;
  refresh: () => void;
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

function configuredSectionIds(config: WorkflowConfig): string[] {
  return config.stages.flatMap((stage) =>
    stage.sectionId === null ? [] : [stage.sectionId],
  );
}

function sameOrder(left: readonly string[], right: readonly string[]): boolean {
  return (
    left.length === right.length &&
    left.every((entry, index) => entry === right[index])
  );
}

/**
 * The workflow sections as the sidebar currently renders them, top to
 * bottom. Null unless every configured section is on screen, so a partially
 * rendered sidebar never reads as a reorder.
 */
function renderedWorkflowSectionOrder(
  sidebar: Element,
  config: WorkflowConfig,
): string[] | null {
  const configured = new Set(configuredSectionIds(config));
  const rendered: string[] = [];
  for (const row of sidebar.querySelectorAll(SECTION_ROW_SELECTOR)) {
    const sectionId = row.getAttribute("data-sidebar-section-id");
    if (sectionId !== null && configured.has(sectionId)) {
      rendered.push(sectionId);
    }
  }
  return rendered.length === configured.size ? rendered : null;
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
  if (stages.length !== config.stages.length) return null;
  return { ...config, stages };
}

/**
 * The sidebar owns section order. A rendered order is adopted only right
 * after the user interacts with the sidebar, so a render that is still
 * settling, or a sidebar that never saw this config, cannot rewrite it.
 */
const ADOPT_ORDER_WINDOW_MS = 10_000;

function mountSidebarController(
  sidebar: Element,
  signal: AbortSignal,
  getConfig: () => WorkflowConfig | null,
  onStageOrderChange: (sectionIds: readonly string[]) => boolean,
): SidebarController {
  let scheduled = false;
  let interactedAt = Number.NEGATIVE_INFINITY;

  const reconcile = () => {
    scheduled = false;
    if (signal.aborted || !sidebar.isConnected) return;
    if (Date.now() - interactedAt > ADOPT_ORDER_WINDOW_MS) return;
    const config = getConfig();
    if (config === null) return;
    const rendered = renderedWorkflowSectionOrder(sidebar, config);
    if (rendered === null) return;
    if (!sameOrder(rendered, configuredSectionIds(config))) {
      onStageOrderChange(rendered);
    }
  };

  const schedule = () => {
    if (scheduled || signal.aborted) return;
    scheduled = true;
    queueMicrotask(reconcile);
  };

  const markInteraction = () => {
    interactedAt = Date.now();
  };
  const interactionEvents = ["pointerdown", "keydown", "drop", "dragend"] as const;
  for (const type of interactionEvents) {
    sidebar.addEventListener(type, markInteraction, true);
  }

  const Observer =
    sidebar.ownerDocument.defaultView?.MutationObserver ?? MutationObserver;
  const observer = new Observer(schedule);
  observer.observe(sidebar, {
    childList: true,
    subtree: true,
  });

  return {
    forgetInteraction: () => {
      interactedAt = Number.NEGATIVE_INFINITY;
    },
    refresh: schedule,
    dispose: () => {
      observer.disconnect();
      for (const type of interactionEvents) {
        sidebar.removeEventListener(type, markInteraction, true);
      }
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

  const refresh = () => {
    for (const controller of controllers.values()) {
      controller.refresh();
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
    refresh();
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
          refresh();
          continue;
        }
        const saved = await saveConfig(editableWorkflowConfig(next));
        if (!signal.aborted) updateConfig(saved);
      }
    } catch {
      // A refused save usually means the workflow changed elsewhere and this
      // sidebar's cached revision is stale. Refresh it so the next reorder
      // is based on the current config instead of failing every time.
      pendingSectionOrder = null;
      for (const controller of controllers.values()) {
        controller.forgetInteraction();
      }
      try {
        const latest = await (loadConfig ??
          (() => fetchWorkflowConfig(pluginId)))();
        if (!signal.aborted) updateConfig(latest);
      } catch {
        // Keep the cached config; the next reorder will try again.
      }
      refresh();
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
    if (candidate === null) return;
    // A config saved outside the sidebar is not a drag: the sidebar may
    // still render the old order, and adopting it would undo the save.
    for (const controller of controllers.values()) controller.forgetInteraction();
    updateConfig(candidate);
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

/** Compatibility alias for existing imports. */
export const mountInboxSectionCollapser = mountThreadOrganizerSidebar;
