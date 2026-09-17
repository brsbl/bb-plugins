import {
  cloneWorkflowConfig,
  editableWorkflowConfig,
  parseWorkflowConfig,
  type EditableWorkflowConfig,
  type WorkflowConfig,
} from "./core.js";

const SIDEBAR_SELECTOR = '[data-sidebar="sidebar"]';
const SECTION_ROW_SELECTOR = "[data-sidebar-section-id]";

/**
 * bb keeps the sidebar's manual section order as a server-synced UI
 * preference. Every entry is a sidebar section id: `section:<threadSectionId>`
 * for a thread section, plus built-in ids such as `pinned` and `threads`.
 */
export const SECTION_ORDER_PREFERENCE_KEY = "sidebar.manualSectionOrder";
const UI_PREFERENCES_PATH = "/api/v1/preferences/ui";

export const WORKFLOW_CACHE_STORAGE_KEY = "bb.thread-organizer.workflow-config";
export const WORKFLOW_CONFIG_EVENT = "bb-thread-organizer-workflow-config";

export interface SectionOrderPreference {
  revision: number;
  value: string[];
}

export type SectionOrderWriteResult =
  | SectionOrderPreference
  | { conflict: true; revision: number | null };

/** Reads and writes bb's `sidebar.manualSectionOrder` preference. */
export interface SectionOrderStore {
  read: () => Promise<SectionOrderPreference>;
  write: (
    expectedRevision: number,
    value: readonly string[],
  ) => Promise<SectionOrderWriteResult>;
}

interface MountThreadOrganizerSidebarOptions {
  document?: Document;
  loadConfig?: () => Promise<WorkflowConfig>;
  pluginId: string;
  saveConfig?: (config: EditableWorkflowConfig) => Promise<WorkflowConfig>;
  sectionOrderStore?: SectionOrderStore;
  signal: AbortSignal;
}

interface SidebarController {
  applyConfiguredOrder: () => void;
  dispose: () => void;
}

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((entry) => typeof entry === "string")
  );
}

function parseSectionOrderPreference(
  payload: unknown,
): SectionOrderPreference | null {
  if (typeof payload !== "object" || payload === null) return null;
  const revision = (payload as { revision?: unknown }).revision;
  const value = (payload as { value?: unknown }).value;
  if (
    typeof revision !== "number" ||
    !Number.isInteger(revision) ||
    revision < 0 ||
    !isStringArray(value)
  ) {
    return null;
  }
  return { revision, value: [...value] };
}

/** The default store talks to bb's UI preferences API on the app's origin. */
export function createSectionOrderStore(
  fetchImpl: typeof fetch = (...args) => fetch(...args),
): SectionOrderStore {
  return {
    async read() {
      const response = await fetchImpl(UI_PREFERENCES_PATH, {
        headers: { accept: "application/json" },
      });
      if (!response.ok) {
        throw new Error(
          `Sidebar section order request failed (${response.status})`,
        );
      }
      const payload: unknown = await response.json();
      const preferences =
        typeof payload === "object" && payload !== null
          ? (payload as { preferences?: unknown }).preferences
          : undefined;
      const entry =
        typeof preferences === "object" && preferences !== null
          ? (preferences as Record<string, unknown>)[
              SECTION_ORDER_PREFERENCE_KEY
            ]
          : undefined;
      const parsed = parseSectionOrderPreference(entry);
      if (parsed === null) {
        throw new Error("bb returned an invalid sidebar section order");
      }
      return parsed;
    },
    async write(expectedRevision, value) {
      const response = await fetchImpl(
        `${UI_PREFERENCES_PATH}/${encodeURIComponent(SECTION_ORDER_PREFERENCE_KEY)}`,
        {
          method: "PUT",
          headers: {
            accept: "application/json",
            "content-type": "application/json",
          },
          body: JSON.stringify({ expectedRevision, value: [...value] }),
        },
      );
      if (response.status === 409) {
        const payload: unknown = await response.json().catch(() => null);
        const details =
          typeof payload === "object" && payload !== null
            ? (payload as { details?: unknown }).details
            : undefined;
        const current =
          typeof details === "object" && details !== null
            ? (details as { currentRevision?: unknown }).currentRevision
            : undefined;
        return {
          conflict: true,
          revision: typeof current === "number" ? current : null,
        };
      }
      if (!response.ok) {
        throw new Error(
          `Sidebar section order update failed (${response.status})`,
        );
      }
      const parsed = parseSectionOrderPreference(await response.json());
      if (parsed === null) {
        throw new Error("bb returned an invalid sidebar section order");
      }
      return parsed;
    },
  };
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

/**
 * bb's manual order with the workflow sections in configured order. Sections
 * bb already knows keep the slots they occupy, so unrelated sections do not
 * move; a workflow section bb has never ordered is inserted right after its
 * configured predecessor. Null when nothing would change.
 */
export function orderWithConfiguredSections(
  current: readonly string[],
  config: WorkflowConfig,
): string[] | null {
  const configured = configuredSectionIds(config).map(
    (sectionId) => `section:${sectionId}`,
  );
  if (configured.length < 2) return null;
  const configuredSet = new Set(configured);
  const positions = current.flatMap((entry, index) =>
    configuredSet.has(entry) ? [index] : [],
  );
  const present = new Set(current.filter((entry) => configuredSet.has(entry)));
  const next = [...current];
  const placed = configured.filter((entry) => present.has(entry));
  positions.forEach((position, index) => {
    next[position] = placed[index]!;
  });
  for (const [index, entry] of configured.entries()) {
    if (present.has(entry)) continue;
    const predecessor = configured
      .slice(0, index)
      .reverse()
      .find((candidate) => present.has(candidate));
    let insertAt: number;
    if (predecessor !== undefined) {
      insertAt = next.indexOf(predecessor) + 1;
    } else {
      const successor = configured
        .slice(index + 1)
        .find((candidate) => present.has(candidate));
      insertAt =
        successor !== undefined
          ? next.indexOf(successor)
          : next[0] === "pinned"
            ? 1
            : 0;
    }
    next.splice(insertAt, 0, entry);
    present.add(entry);
  }
  return sameOrder(next, current) ? null : next;
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

function mountSidebarController(
  sidebar: Element,
  signal: AbortSignal,
  getConfig: () => WorkflowConfig | null,
  onStageOrderChange: (sectionIds: readonly string[]) => boolean,
  store: SectionOrderStore,
): SidebarController {
  let applyConfiguredOrder = true;
  let scheduled = false;
  let pushing = false;
  // After a push, the sidebar still shows the old order until bb re-renders
  // from the preference. Until it changes, a mismatch is not a user drag.
  let renderedAtPush: string[] | null = null;

  const pushConfiguredOrder = async (config: WorkflowConfig) => {
    pushing = true;
    try {
      for (let attempt = 0; attempt < 2; attempt += 1) {
        const current = await store.read();
        if (signal.aborted) return;
        const next = orderWithConfiguredSections(current.value, config);
        if (next === null) {
          // bb already holds the configured order. Whatever the sidebar shows
          // right now is bb's render of it, not a drag, so do not push again
          // until it changes.
          renderedAtPush = renderedWorkflowSectionOrder(sidebar, config);
          return;
        }
        const result = await store.write(current.revision, next);
        if (signal.aborted) return;
        if (!("conflict" in result)) {
          renderedAtPush = renderedWorkflowSectionOrder(sidebar, config);
          return;
        }
      }
    } catch {
      // bb could not be reached or refused the write; the next config
      // change or reorder tries again.
    } finally {
      // Deliberately no reschedule here: bb's re-render after the write
      // arrives as a DOM mutation and drives the next reconcile, so a push
      // can never chain into another push on its own.
      pushing = false;
    }
  };

  const reconcile = () => {
    scheduled = false;
    if (signal.aborted || !sidebar.isConnected) return;
    const config = getConfig();
    if (config === null) return;
    if (applyConfiguredOrder) {
      applyConfiguredOrder = false;
      void pushConfiguredOrder(config);
      return;
    }
    if (pushing) return;
    const rendered = renderedWorkflowSectionOrder(sidebar, config);
    if (rendered === null) return;
    const configured = configuredSectionIds(config);
    const matches = sameOrder(rendered, configured);
    if (renderedAtPush !== null) {
      if (matches || !sameOrder(rendered, renderedAtPush)) {
        renderedAtPush = null;
      } else {
        return;
      }
    }
    if (!matches && !onStageOrderChange(rendered)) {
      void pushConfiguredOrder(config);
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

  const Observer =
    sidebar.ownerDocument.defaultView?.MutationObserver ?? MutationObserver;
  const observer = new Observer(schedule);
  observer.observe(sidebar, {
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
  sectionOrderStore = createSectionOrderStore(),
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
      // A refused save usually means the workflow changed elsewhere and this
      // sidebar's cached revision is stale. Refresh it so the next reorder
      // is based on the current config instead of failing every time.
      pendingSectionOrder = null;
      try {
        const latest = await (loadConfig ??
          (() => fetchWorkflowConfig(pluginId)))();
        if (!signal.aborted) updateConfig(latest);
      } catch {
        // Keep the cached config; the next reorder will try again.
      }
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
            sectionOrderStore,
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

/** Compatibility alias for existing imports. */
export const mountInboxSectionCollapser = mountThreadOrganizerSidebar;
