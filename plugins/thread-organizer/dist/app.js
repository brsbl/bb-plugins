// bb-plugin-runtime-shim:react
var runtime = globalThis.__bbPluginRuntime;
if (runtime == null || runtime.react == null) {
  throw new Error('Cannot load "react": this bundle must be loaded by the BB app, which provides the shared plugin runtime (globalThis.__bbPluginRuntime).');
}
var mod = runtime.react;
var {
  Activity,
  Children,
  Component,
  Fragment,
  Profiler,
  PureComponent,
  StrictMode,
  Suspense,
  act,
  cache,
  cacheSignal,
  captureOwnerStack,
  cloneElement,
  createContext,
  createElement,
  createRef,
  forwardRef,
  isValidElement,
  lazy,
  memo,
  startTransition,
  unstable_useCacheRefresh,
  use,
  useActionState,
  useCallback,
  useContext,
  useDebugValue,
  useDeferredValue,
  useEffect,
  useEffectEvent,
  useId,
  useImperativeHandle,
  useInsertionEffect,
  useLayoutEffect,
  useMemo,
  useOptimistic,
  useReducer,
  useRef,
  useState,
  useSyncExternalStore,
  useTransition,
  version
} = mod;

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/ArrowDown02Icon.js
var ArrowDown02Icon = [
  ["path", { d: "M12 18.502V5.00195", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M18 13.002C18 13.002 13.5811 19.0019 12 19.002C10.4188 19.002 6 13.002 6 13.002", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "1" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/ArrowUp02Icon.js
var ArrowUp02Icon = [
  ["path", { d: "M12 5.5V19", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M18 11C18 11 13.5811 5.00001 12 5C10.4188 4.99999 6 11 6 11", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "1" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/Delete02Icon.js
var Delete02Icon = [
  ["path", { d: "M19.5 5.5L18.8803 15.5251C18.7219 18.0864 18.6428 19.3671 18.0008 20.2879C17.6833 20.7431 17.2747 21.1273 16.8007 21.416C15.8421 22 14.559 22 11.9927 22C9.42312 22 8.1383 22 7.17905 21.4149C6.7048 21.1257 6.296 20.7408 5.97868 20.2848C5.33688 19.3626 5.25945 18.0801 5.10461 15.5152L4.5 5.5", stroke: "currentColor", strokeLinecap: "round", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M3 5.5H21M16.0557 5.5L15.3731 4.09173C14.9196 3.15626 14.6928 2.68852 14.3017 2.39681C14.215 2.3321 14.1231 2.27454 14.027 2.2247C13.5939 2 13.0741 2 12.0345 2C10.9688 2 10.436 2 9.99568 2.23412C9.8981 2.28601 9.80498 2.3459 9.71729 2.41317C9.32164 2.7167 9.10063 3.20155 8.65861 4.17126L8.05292 5.5", stroke: "currentColor", strokeLinecap: "round", strokeWidth: "1.5", key: "1" }],
  ["path", { d: "M9.5 16.5L9.5 10.5", stroke: "currentColor", strokeLinecap: "round", strokeWidth: "1.5", key: "2" }],
  ["path", { d: "M14.5 16.5L14.5 10.5", stroke: "currentColor", strokeLinecap: "round", strokeWidth: "1.5", key: "3" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/DragDropVerticalIcon.js
var DragDropVerticalIcon = [
  ["path", { d: "M16 6C16 6.55228 15.5523 7 15 7C14.4477 7 14 6.55228 14 6C14 5.44772 14.4477 5 15 5C15.5523 5 16 5.44772 16 6Z", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M10 6C10 6.55228 9.55228 7 9 7C8.44772 7 8 6.55228 8 6C8 5.44772 8.44772 5 9 5C9.55228 5 10 5.44772 10 6Z", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "1" }],
  ["path", { d: "M16 18C16 18.5523 15.5523 19 15 19C14.4477 19 14 18.5523 14 18C14 17.4477 14.4477 17 15 17C15.5523 17 16 17.4477 16 18Z", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "2" }],
  ["path", { d: "M16 12C16 12.5523 15.5523 13 15 13C14.4477 13 14 12.5523 14 12C14 11.4477 14.4477 11 15 11C15.5523 11 16 11.4477 16 12Z", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "3" }],
  ["path", { d: "M10 18C10 18.5523 9.55228 19 9 19C8.44772 19 8 18.5523 8 18C8 17.4477 8.44772 17 9 17C9.55228 17 10 17.4477 10 18Z", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "4" }],
  ["path", { d: "M10 12C10 12.5523 9.55228 13 9 13C8.44772 13 8 12.5523 8 12C8 11.4477 8.44772 11 9 11C9.55228 11 10 11.4477 10 12Z", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "5" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/MoreHorizontalIcon.js
var MoreHorizontalIcon = [
  ["path", { d: "M6.00449 12.5V12M18.0045 12.5V12M12.0045 12.5V12M7.00449 12.5C7.00449 11.9477 6.55677 11.5 6.00449 11.5C5.4522 11.5 5.00449 11.9477 5.00449 12.5C5.00449 13.0523 5.4522 13.5 6.00449 13.5C6.55677 13.5 7.00449 13.0523 7.00449 12.5ZM19.0045 12.5C19.0045 11.9477 18.5568 11.5 18.0045 11.5C17.4522 11.5 17.0045 11.9477 17.0045 12.5C17.0045 13.0523 17.4522 13.5 18.0045 13.5C18.5568 13.5 19.0045 13.0523 19.0045 12.5ZM13.0045 12.5C13.0045 11.9477 12.5568 11.5 12.0045 11.5C11.4522 11.5 11.0045 11.9477 11.0045 12.5C11.0045 13.0523 11.4522 13.5 12.0045 13.5C12.5568 13.5 13.0045 13.0523 13.0045 12.5Z", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/PlusSignIcon.js
var PlusSignIcon = [
  ["path", { d: "M12 4V20M20 12H4", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/Tick02Icon.js
var Tick02Icon = [
  ["path", { d: "M5 14L8.5 17.5L19 6.5", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }]
];

// ../../node_modules/@hugeicons/react/dist/esm/HugeiconsIcon.js
var defaultAttributes = {
  xmlns: "http://www.w3.org/2000/svg",
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none"
};
var HugeiconsIcon = forwardRef(({ color = "currentColor", size = 24, strokeWidth, absoluteStrokeWidth = false, className = "", altIcon, showAlt = false, icon, primaryColor, secondaryColor, disableSecondaryOpacity = false, ...rest }, ref) => {
  const calculatedStrokeWidth = strokeWidth !== void 0 ? absoluteStrokeWidth ? Number(strokeWidth) * 24 / Number(size) : strokeWidth : void 0;
  const strokeProps = calculatedStrokeWidth !== void 0 ? {
    strokeWidth: calculatedStrokeWidth,
    stroke: "currentColor"
  } : {};
  const elementProps = {
    ref,
    ...defaultAttributes,
    width: size,
    height: size,
    color: primaryColor || color,
    className,
    ...strokeProps,
    ...rest
  };
  const currentIcon = showAlt && altIcon ? altIcon : icon;
  const svgChildren = [...currentIcon].sort(([, a], [, b]) => {
    const hasOpacityA = a.opacity !== void 0;
    const hasOpacityB = b.opacity !== void 0;
    return hasOpacityB ? 1 : hasOpacityA ? -1 : 0;
  }).map(([tag, attrs]) => {
    const isSecondaryPath = attrs.opacity !== void 0;
    const pathOpacity = isSecondaryPath && !disableSecondaryOpacity ? attrs.opacity : void 0;
    const fillProps = secondaryColor ? {
      ...attrs.stroke !== void 0 ? {
        stroke: isSecondaryPath ? secondaryColor : primaryColor || color
      } : {
        fill: isSecondaryPath ? secondaryColor : primaryColor || color
      }
    } : {};
    return createElement(tag, {
      ...attrs,
      ...strokeProps,
      ...fillProps,
      opacity: pathOpacity,
      key: attrs.key
    });
  });
  return createElement("svg", elementProps, svgChildren);
});
HugeiconsIcon.displayName = "HugeiconsIcon";

// bb-plugin-runtime-shim:@get-bb/plugin-sdk/app
var runtime2 = globalThis.__bbPluginRuntime;
if (runtime2 == null || runtime2.pluginSdkApp == null) {
  throw new Error('Cannot load "@get-bb/plugin-sdk/app": this bundle must be loaded by the BB app, which provides the shared plugin runtime (globalThis.__bbPluginRuntime).');
}
var mod2 = runtime2.pluginSdkApp;
var {
  Markdown,
  ThreadChat,
  definePluginApp,
  experimental_NewThreadComposer,
  experimental_useSidebarThreadActions,
  experimental_useSidebarThreadPullRequest,
  experimental_useSidebarThreadSplit,
  experimental_useSidebarThreads,
  useBbContext,
  useBbNavigate,
  useComposer,
  useComposerView,
  useRealtime,
  useRealtimeConnectionState,
  useRpc,
  useSettings
} = mod2;

// core.ts
var WORKFLOW_CONFIG_VERSION = 2;
var ENTRY_PROMPT_MAX_LENGTH = 2e3;
var WORKFLOW_CHANGE_INTERACTION_ID = "confirm-workflow-change";
var INBOX_RULE = "Idle unread threads that need your attention appear here automatically and stay until work resumes or you move a read thread to another workflow section. This behavior can\u2019t be customized.";
var HANDOFF_RULE = "Use only when the user explicitly says this thread is being handed to a colleague to take across the finish line; never infer it from packaging context, completed work, or waiting.";
var PREVIOUS_INBOX_RULES = [
  "Idle unread threads that need your attention appear here automatically and stay until work resumes. This behavior can\u2019t be customized.",
  "Idle unread threads that need your attention appear here automatically. This behavior can\u2019t be customized.",
  "Idle unread threads requiring the user's attention. This stage is managed automatically."
];
var PREVIOUS_HANDOFF_RULES = [
  "Packaging work and context so a colleague can continue it.",
  "Transferring work to a colleague after explicit user direction."
];
function normalizeText(value) {
  return value.normalize("NFKC").trim().replace(/\s+/gu, " ");
}
function normalizedIdentity(value) {
  return normalizeText(value).toLocaleLowerCase();
}
function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function parseStage(value, withSectionId) {
  if (!isRecord(value))
    throw new Error("Every workflow stage must be an object.");
  const key = typeof value.key === "string" ? value.key.trim() : "";
  const title = typeof value.title === "string" ? normalizeText(value.title) : "";
  const rule = typeof value.rule === "string" ? normalizeText(value.rule) : "";
  const role = value.role;
  const entryPrompt = typeof value.entryPrompt === "string" ? value.entryPrompt.normalize("NFKC").replace(/\r\n?/gu, "\n").trim() : "";
  const sectionId = withSectionId ? value.sectionId === null || typeof value.sectionId === "string" ? value.sectionId : null : null;
  if (!/^[a-z0-9][a-z0-9-]{0,39}$/u.test(key)) {
    throw new Error(
      `Stage key "${key}" must use lowercase letters, numbers, and hyphens.`
    );
  }
  if (title.length === 0 || title.length > 80) {
    throw new Error(`Stage "${key}" needs a title of 1\u201380 characters.`);
  }
  if (rule.length === 0 || rule.length > 240) {
    throw new Error(`Stage "${key}" needs a rule of 1\u2013240 characters.`);
  }
  if (role !== "inbox" && role !== "stage") {
    throw new Error(`Stage "${key}" has an invalid role.`);
  }
  if (entryPrompt.length > ENTRY_PROMPT_MAX_LENGTH) {
    throw new Error(
      `Stage "${key}" entry prompt must be at most ${ENTRY_PROMPT_MAX_LENGTH} characters.`
    );
  }
  return {
    key,
    title,
    rule,
    role,
    // Defaults are not persisted, so configs without prompts stay byte-stable.
    ...entryPrompt.length > 0 ? { entryPrompt } : {},
    sectionId: sectionId && sectionId.trim().length > 0 ? sectionId : null
  };
}
function validateStages(stages) {
  if (stages.length < 2 || stages.length > 12) {
    throw new Error("Configure Inbox plus 1\u201311 workflow stages.");
  }
  const keys = /* @__PURE__ */ new Set();
  const titles = /* @__PURE__ */ new Set();
  for (const stage of stages) {
    if (keys.has(stage.key)) {
      throw new Error(`Stage key "${stage.key}" is duplicated.`);
    }
    keys.add(stage.key);
    const titleIdentity = normalizedIdentity(stage.title);
    if (titles.has(titleIdentity)) {
      throw new Error(`Stage title "${stage.title}" is duplicated.`);
    }
    titles.add(titleIdentity);
    if (stage.role === "inbox" && hasEntryPrompt(stage)) {
      throw new Error("Inbox cannot send an entry prompt.");
    }
  }
  const inboxes = stages.filter((stage) => stage.role === "inbox");
  if (inboxes.length !== 1 || inboxes[0]?.key !== "inbox") {
    throw new Error(
      "The workflow must contain exactly one protected Inbox stage."
    );
  }
  if (inboxes[0]?.rule !== INBOX_RULE) {
    throw new Error("Inbox routing and its system rule cannot be changed.");
  }
}
function migrateDraftStage(stage) {
  if (stage.key === "inbox") {
    return {
      ...stage,
      title: stage.title === "Needs Me" ? "Inbox" : stage.title,
      rule: PREVIOUS_INBOX_RULES.some((rule) => rule === stage.rule) ? INBOX_RULE : stage.rule
    };
  }
  if (stage.key === "handoff" && PREVIOUS_HANDOFF_RULES.some((rule) => rule === stage.rule)) {
    return {
      ...stage,
      rule: HANDOFF_RULE
    };
  }
  if (stage.key !== "parked") return stage;
  return {
    ...stage,
    key: "on-hold",
    title: stage.title === "Parked" ? "On Hold" : stage.title,
    rule: stage.rule === "Intentionally pausing work for later after explicit user direction." ? "Work intentionally paused until a later time or external condition." : stage.rule
  };
}
function parseWorkflowConfig(value) {
  try {
    if (!isRecord(value) || value.version !== 1 && value.version !== 2) {
      return null;
    }
    if (!Array.isArray(value.stages)) return null;
    const stages = value.stages.map((stage) => parseStage(stage, true)).map(migrateDraftStage);
    validateStages(stages);
    const revision = typeof value.revision === "number" && Number.isInteger(value.revision) && value.revision >= 0 ? value.revision : void 0;
    return {
      version: WORKFLOW_CONFIG_VERSION,
      stages,
      ...revision === void 0 ? {} : { revision }
    };
  } catch {
    return null;
  }
}
function normalizeEditableWorkflowConfig(value) {
  const stages = value.stages.map((stage) => {
    const parsed = parseStage(stage, false);
    const { sectionId: _sectionId, ...editable } = parsed;
    return editable;
  });
  validateStages(stages.map((stage) => ({ ...stage, sectionId: null })));
  return { version: WORKFLOW_CONFIG_VERSION, stages };
}
function cloneWorkflowConfig(config) {
  return { ...config, stages: config.stages.map((stage) => ({ ...stage })) };
}
function editableWorkflowConfig(config) {
  return {
    version: WORKFLOW_CONFIG_VERSION,
    stages: config.stages.map(({ sectionId: _sectionId, ...stage }) => ({
      ...stage
    })),
    ...config.revision === void 0 ? {} : { baseRevision: config.revision }
  };
}
function hasEntryPrompt(stage) {
  return typeof stage.entryPrompt === "string" && stage.entryPrompt.length > 0;
}
var MIGRATED_STAGE_KEYS = ["parked"];
function createStageKey(title, existingKeys) {
  const base = title.normalize("NFKD").toLocaleLowerCase().replace(/[^a-z0-9]+/gu, "-").replace(/^-+|-+$/gu, "").slice(0, 32) || "stage";
  const unavailable = /* @__PURE__ */ new Set([
    "inbox",
    ...MIGRATED_STAGE_KEYS,
    ...existingKeys
  ]);
  if (!unavailable.has(base)) return base;
  for (let suffix = 2; suffix < 1e4; suffix += 1) {
    const key = `${base.slice(0, 36)}-${suffix}`;
    if (!unavailable.has(key)) return key;
  }
  throw new Error("Could not create a unique stage key.");
}

// sidebar-controller.ts
var SIDEBAR_SELECTOR = '[data-sidebar="sidebar"]';
var MANUAL_SECTION_ORDER_STORAGE_KEY = "bb.sidebar.manualSectionOrder";
var WORKFLOW_CACHE_STORAGE_KEY = "bb.thread-organizer.workflow-config";
var WORKFLOW_CONFIG_EVENT = "bb-thread-organizer-workflow-config";
function parsedCachedConfig(view) {
  try {
    const raw = view.localStorage.getItem(WORKFLOW_CACHE_STORAGE_KEY);
    return raw === null ? null : parseWorkflowConfig(JSON.parse(raw));
  } catch {
    return null;
  }
}
function cacheWorkflowConfig(config, view = window) {
  const snapshot = cloneWorkflowConfig(config);
  view.localStorage.setItem(
    WORKFLOW_CACHE_STORAGE_KEY,
    JSON.stringify(snapshot)
  );
  view.dispatchEvent(
    new CustomEvent(WORKFLOW_CONFIG_EVENT, { detail: snapshot })
  );
}
async function fetchWorkflowConfig(pluginId) {
  const response = await fetch(
    `/api/v1/plugins/${encodeURIComponent(pluginId)}/rpc/getConfig`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}"
    }
  );
  if (!response.ok) {
    throw new Error(
      `Thread Organizer config request failed (${response.status})`
    );
  }
  const payload = await response.json();
  if (typeof payload !== "object" || payload === null || !("ok" in payload) || payload.ok !== true || !("result" in payload)) {
    throw new Error("Thread Organizer returned an invalid config response");
  }
  const config = parseWorkflowConfig(payload.result);
  if (config === null) {
    throw new Error("Thread Organizer returned an invalid workflow config");
  }
  return config;
}
async function saveWorkflowConfig(pluginId, config) {
  const response = await fetch(
    `/api/v1/plugins/${encodeURIComponent(pluginId)}/rpc/saveConfig`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(config)
    }
  );
  if (!response.ok) {
    throw new Error(
      `Thread Organizer config save failed (${response.status})`
    );
  }
  const payload = await response.json();
  if (typeof payload !== "object" || payload === null || !("ok" in payload) || payload.ok !== true || !("result" in payload)) {
    throw new Error("Thread Organizer returned an invalid config response");
  }
  const saved = parseWorkflowConfig(payload.result);
  if (saved === null) {
    throw new Error("Thread Organizer returned an invalid workflow config");
  }
  return saved;
}
function currentWorkflowSectionOrder(sidebar, config) {
  const view = sidebar.ownerDocument.defaultView;
  if (view === null) return null;
  const raw = view.localStorage.getItem(MANUAL_SECTION_ORDER_STORAGE_KEY);
  if (raw === null) return null;
  let current;
  try {
    current = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!Array.isArray(current) || current.some((value) => typeof value !== "string")) {
    return null;
  }
  const configuredSectionIds = new Set(
    config.stages.flatMap(
      (stage) => stage.sectionId === null ? [] : [stage.sectionId]
    )
  );
  const orderedSectionIds = current.flatMap((orderId) => {
    if (!orderId.startsWith("section:")) return [];
    const sectionId = orderId.slice("section:".length);
    return configuredSectionIds.has(sectionId) ? [sectionId] : [];
  });
  return orderedSectionIds.length === configuredSectionIds.size ? orderedSectionIds : null;
}
function configInSectionOrder(config, sectionIds) {
  if (sectionIds.length !== config.stages.length) return null;
  const stageBySectionId = new Map(
    config.stages.flatMap(
      (stage) => stage.sectionId === null ? [] : [[stage.sectionId, stage]]
    )
  );
  if (stageBySectionId.size !== config.stages.length) return null;
  const stages = sectionIds.flatMap((sectionId) => {
    const stage = stageBySectionId.get(sectionId);
    return stage === void 0 ? [] : [{ ...stage }];
  });
  if (stages.length !== config.stages.length || stages[0]?.role !== "inbox") {
    return null;
  }
  return { ...config, stages };
}
function reorderWorkflowSections(sidebar, config) {
  const view = sidebar.ownerDocument.defaultView;
  if (view === null) return;
  const rankByOrderId = new Map(
    config.stages.flatMap(
      (stage, index) => stage.sectionId === null ? [] : [[`section:${stage.sectionId}`, index]]
    )
  );
  if (rankByOrderId.size < 2) return;
  const raw = view.localStorage.getItem(MANUAL_SECTION_ORDER_STORAGE_KEY);
  if (raw === null) return;
  let current;
  try {
    current = JSON.parse(raw);
  } catch {
    return;
  }
  if (!Array.isArray(current) || current.some((value) => typeof value !== "string")) {
    return;
  }
  const currentOrder = current;
  const positions = currentOrder.flatMap(
    (id, index) => rankByOrderId.has(id) ? [index] : []
  );
  if (positions.length < 2) return;
  const configuredIds = positions.map((position) => currentOrder[position]).sort(
    (left, right) => rankByOrderId.get(left) - rankByOrderId.get(right)
  );
  const nextOrder = [...currentOrder];
  positions.forEach((position, index) => {
    nextOrder[position] = configuredIds[index];
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
      url: view.location.href
    })
  );
}
function mountSidebarController(sidebar, signal, getConfig, onStageOrderChange) {
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
      const configuredOrder = config.stages.flatMap(
        (stage) => stage.sectionId === null ? [] : [stage.sectionId]
      );
      if (currentOrder !== null && !currentOrder.every(
        (sectionId, index) => sectionId === configuredOrder[index]
      ) && !onStageOrderChange(currentOrder)) {
        reorderWorkflowSections(sidebar, config);
      }
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
  const Observer = sidebar.ownerDocument.defaultView?.MutationObserver ?? MutationObserver;
  const observer = new Observer(schedule);
  observer.observe(sidebar, {
    childList: true,
    subtree: true
  });
  sidebar.addEventListener(
    "thread-organizer-config-changed",
    requestConfiguredOrder
  );
  reconcile();
  return {
    applyConfiguredOrder: requestConfiguredOrder,
    dispose: () => {
      observer.disconnect();
      sidebar.removeEventListener(
        "thread-organizer-config-changed",
        requestConfiguredOrder
      );
    }
  };
}
function mountThreadOrganizerSidebar({
  document: targetDocument = document,
  loadConfig,
  pluginId,
  saveConfig = (config) => saveWorkflowConfig(pluginId, config),
  signal
}) {
  const view = targetDocument.defaultView;
  let config = view === null ? null : parsedCachedConfig(view);
  const controllers = /* @__PURE__ */ new Map();
  let pendingSectionOrder = null;
  let savingSectionOrder = false;
  const applyConfiguredOrder = () => {
    for (const controller of controllers.values()) {
      controller.applyConfiguredOrder();
    }
  };
  const updateConfig = (next) => {
    config = cloneWorkflowConfig(next);
    if (view !== null) {
      view.localStorage.setItem(
        WORKFLOW_CACHE_STORAGE_KEY,
        JSON.stringify(config)
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
        const next = config === null ? null : configInSectionOrder(config, requestedOrder);
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
  const requestStageOrder = (sectionIds) => {
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
            requestStageOrder
          )
        );
      }
    }
  };
  const onConfigEvent = (event) => {
    const candidate = event instanceof CustomEvent ? parseWorkflowConfig(event.detail) : null;
    if (candidate !== null) updateConfig(candidate);
  };
  view?.addEventListener(WORKFLOW_CONFIG_EVENT, onConfigEvent);
  const Observer = view?.MutationObserver ?? MutationObserver;
  const discoveryObserver = new Observer(mountSidebars);
  discoveryObserver.observe(targetDocument.documentElement, {
    childList: true,
    subtree: true
  });
  mountSidebars();
  void (loadConfig ?? (() => fetchWorkflowConfig(pluginId)))().then((loaded) => {
    if (!signal.aborted) updateConfig(loaded);
  }).catch(() => void 0);
  const dispose = () => {
    discoveryObserver.disconnect();
    view?.removeEventListener(WORKFLOW_CONFIG_EVENT, onConfigEvent);
    for (const controller of controllers.values()) controller.dispose();
    controllers.clear();
  };
  signal.addEventListener("abort", dispose, { once: true });
  return dispose;
}

// bb-plugin-runtime-shim:react/jsx-runtime
var runtime3 = globalThis.__bbPluginRuntime;
if (runtime3 == null || runtime3.jsxRuntime == null) {
  throw new Error('Cannot load "react/jsx-runtime": this bundle must be loaded by the BB app, which provides the shared plugin runtime (globalThis.__bbPluginRuntime).');
}
var mod3 = runtime3.jsxRuntime;
var {
  Fragment: Fragment2,
  jsx,
  jsxs
} = mod3;

// app.tsx
var fieldClass = "min-w-0 w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm text-foreground outline-none focus:border-foreground/45 disabled:cursor-not-allowed disabled:opacity-60";
var quietFieldClass = "min-w-0 w-full rounded-md border border-transparent bg-transparent px-2.5 py-1.5 text-sm text-foreground outline-none hover:border-border focus:border-foreground/45 focus:bg-background disabled:cursor-not-allowed disabled:opacity-60";
var buttonBaseClass = "inline-flex h-8 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md px-3 text-xs font-medium outline-none transition-colors focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0";
var outlineButtonClass = `${buttonBaseClass} border border-input bg-transparent text-foreground hover:bg-muted`;
var primaryButtonClass = `${buttonBaseClass} bg-foreground text-background hover:bg-foreground/90`;
var iconButtonClass = "inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-40";
var stageColumnsClass = "lg:grid-cols-[2rem_minmax(7rem,9rem)_minmax(0,1fr)_minmax(0,1.25fr)_2rem]";
var stageRowClass = `grid min-w-0 grid-cols-[minmax(0,1fr)_2rem] items-start gap-x-2 gap-y-0 ${stageColumnsClass}`;
var stageHeaderClass = `hidden min-w-0 items-end gap-x-2 rounded-t-lg border-b border-border bg-muted/30 px-3 py-2 lg:grid ${stageColumnsClass}`;
var stageRuleLayoutClass = "col-span-2 col-start-1 row-start-2 min-w-0 lg:col-span-1 lg:col-start-3 lg:row-start-1";
var stagePromptLayoutClass = "col-span-2 col-start-1 row-start-3 min-w-0 lg:col-span-1 lg:col-start-4 lg:row-start-1";
var fieldCaptionClass = "text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground";
var fieldHintClass = "ml-1.5 font-normal normal-case tracking-normal text-muted-foreground/70";
var workflowSettingsDescription = "Rename, reorder, and define the workflow your agents follow.";
var workflowSettingsDescriptionClass = "ps-[var(--radius-lg,0.5rem)] [text-indent:-0.088em] text-sm leading-5 text-muted-foreground";
function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}
function uniqueNewStageTitle(stages) {
  const titles = new Set(
    stages.map((stage) => stage.title.toLocaleLowerCase())
  );
  if (!titles.has("new section")) return "New Section";
  for (let suffix = 2; suffix < 1e4; suffix += 1) {
    const title = `New Section ${suffix}`;
    if (!titles.has(title.toLocaleLowerCase())) return title;
  }
  return "Untitled Section";
}
function StageActions({
  index,
  onMove,
  onRemove,
  stage,
  stageCount
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  useEffect(() => {
    if (!open) return;
    const closeOnOutsidePress = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    };
    document.addEventListener("pointerdown", closeOnOutsidePress);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePress);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: "relative col-start-2 row-start-1 shrink-0 lg:col-start-5",
      ref: rootRef,
      children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            "aria-expanded": open,
            "aria-haspopup": "menu",
            "aria-label": `More actions for ${stage.title}`,
            className: iconButtonClass,
            onClick: () => setOpen((current) => !current),
            ref: triggerRef,
            title: `More actions for ${stage.title}`,
            type: "button",
            children: /* @__PURE__ */ jsx(
              HugeiconsIcon,
              {
                "aria-hidden": "true",
                className: "size-4",
                icon: MoreHorizontalIcon
              }
            )
          }
        ),
        open ? /* @__PURE__ */ jsxs(
          "div",
          {
            "aria-label": `Actions for ${stage.title}`,
            className: "absolute right-0 top-full z-20 mt-1 grid w-40 gap-0.5 rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-lg",
            role: "menu",
            children: [
              /* @__PURE__ */ jsxs(
                "button",
                {
                  className: "flex min-h-8 items-center gap-2 rounded-md px-2 text-left text-sm hover:bg-muted disabled:opacity-40",
                  disabled: index <= 1,
                  onClick: () => {
                    setOpen(false);
                    onMove(index, -1);
                  },
                  role: "menuitem",
                  type: "button",
                  children: [
                    /* @__PURE__ */ jsx(
                      HugeiconsIcon,
                      {
                        "aria-hidden": "true",
                        className: "size-4",
                        icon: ArrowUp02Icon
                      }
                    ),
                    "Move up"
                  ]
                }
              ),
              /* @__PURE__ */ jsxs(
                "button",
                {
                  className: "flex min-h-8 items-center gap-2 rounded-md px-2 text-left text-sm hover:bg-muted disabled:opacity-40",
                  disabled: index >= stageCount - 1,
                  onClick: () => {
                    setOpen(false);
                    onMove(index, 1);
                  },
                  role: "menuitem",
                  type: "button",
                  children: [
                    /* @__PURE__ */ jsx(
                      HugeiconsIcon,
                      {
                        "aria-hidden": "true",
                        className: "size-4",
                        icon: ArrowDown02Icon
                      }
                    ),
                    "Move down"
                  ]
                }
              ),
              /* @__PURE__ */ jsxs(
                "button",
                {
                  className: "flex min-h-8 items-center gap-2 rounded-md px-2 text-left text-sm text-destructive hover:bg-destructive/10",
                  onClick: () => {
                    setOpen(false);
                    onRemove(index);
                  },
                  role: "menuitem",
                  type: "button",
                  children: [
                    /* @__PURE__ */ jsx(
                      HugeiconsIcon,
                      {
                        "aria-hidden": "true",
                        className: "size-4",
                        icon: Delete02Icon
                      }
                    ),
                    "Remove section"
                  ]
                }
              )
            ]
          }
        ) : null
      ]
    }
  );
}
function finalizeDraftKeys(config, draftKeys) {
  if (draftKeys.size === 0) return config;
  const taken = config.stages.filter((stage) => !draftKeys.has(stage.key)).map((stage) => stage.key);
  const stages = config.stages.map((stage) => {
    if (!draftKeys.has(stage.key)) return stage;
    const key = createStageKey(stage.title, taken);
    taken.push(key);
    return key === stage.key ? stage : { ...stage, key };
  });
  return { ...config, stages };
}
function StageCard({
  index,
  onChange,
  onDragStart,
  onDrop,
  onMove,
  onRemove,
  stage,
  stageCount
}) {
  const inbox = stage.role === "inbox";
  const update = (key, value) => onChange({ ...stage, [key]: value });
  const hasPrompt = (stage.entryPrompt ?? "").trim().length > 0;
  const [promptExpanded, setPromptExpanded] = useState(hasPrompt);
  const [focusPromptPending, setFocusPromptPending] = useState(false);
  const promptRef = useRef(null);
  const showPrompt = promptExpanded || hasPrompt;
  useEffect(() => {
    if (!focusPromptPending || promptRef.current === null) return;
    setFocusPromptPending(false);
    promptRef.current.focus();
  }, [focusPromptPending]);
  return /* @__PURE__ */ jsx(
    "article",
    {
      className: "min-w-0 border-b border-border bg-background px-3 py-2.5 last:rounded-b-lg last:border-b-0 lg:p-3",
      onDragOver: (event) => {
        if (!inbox) event.preventDefault();
      },
      onDrop: (event) => {
        event.preventDefault();
        if (!inbox) onDrop(index);
      },
      children: /* @__PURE__ */ jsxs("div", { className: stageRowClass, children: [
        inbox ? /* @__PURE__ */ jsx("span", { "aria-hidden": "true", className: "hidden size-8 lg:block" }) : /* @__PURE__ */ jsx("span", { className: "hidden shrink-0 lg:inline-flex", children: /* @__PURE__ */ jsx(
          "button",
          {
            "aria-label": `Drag ${stage.title} to reorder`,
            className: `${iconButtonClass} cursor-grab active:cursor-grabbing`,
            draggable: true,
            onDragStart: () => onDragStart(index),
            title: `Drag ${stage.title} to reorder`,
            type: "button",
            children: /* @__PURE__ */ jsx(
              HugeiconsIcon,
              {
                "aria-hidden": "true",
                className: "size-4",
                icon: DragDropVerticalIcon
              }
            )
          }
        ) }),
        /* @__PURE__ */ jsx(
          "input",
          {
            "aria-label": `${stage.title || "Untitled section"} section title`,
            "data-stage-key": stage.key,
            className: "h-8 min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-2.5 text-sm font-semibold text-foreground outline-none hover:border-border focus:border-foreground/45 focus:bg-background",
            maxLength: 80,
            onChange: (event) => update("title", event.target.value),
            value: stage.title
          }
        ),
        inbox ? /* @__PURE__ */ jsx(
          "span",
          {
            "aria-hidden": "true",
            className: "col-start-2 row-start-1 size-8 lg:col-start-5"
          }
        ) : /* @__PURE__ */ jsx(
          StageActions,
          {
            index,
            onMove,
            onRemove,
            stage,
            stageCount
          }
        ),
        inbox ? /* @__PURE__ */ jsx(
          "p",
          {
            className: `${stageRuleLayoutClass} px-2.5 py-1.5 text-sm leading-5 text-muted-foreground`,
            children: stage.rule
          }
        ) : /* @__PURE__ */ jsxs("label", { className: `${stageRuleLayoutClass} mt-1.5 grid gap-0.5 lg:mt-0`, children: [
          /* @__PURE__ */ jsx("span", { className: `${fieldCaptionClass} px-2.5 lg:sr-only`, children: "Rule" }),
          /* @__PURE__ */ jsx(
            "textarea",
            {
              "aria-label": `What belongs in ${stage.title}`,
              className: `${quietFieldClass} min-h-8 max-h-44 resize-none overflow-y-auto leading-5`,
              maxLength: 240,
              onChange: (event) => update("rule", event.target.value),
              rows: 1,
              style: { fieldSizing: "content" },
              value: stage.rule
            }
          )
        ] }),
        inbox ? /* @__PURE__ */ jsx(
          "span",
          {
            "aria-hidden": "true",
            className: `${stagePromptLayoutClass} hidden px-2.5 py-1.5 text-sm leading-5 text-muted-foreground lg:block`,
            children: "\u2014"
          }
        ) : /* @__PURE__ */ jsxs(Fragment2, { children: [
          showPrompt ? null : /* @__PURE__ */ jsxs(
            "button",
            {
              className: `${stagePromptLayoutClass} mt-2 inline-flex h-8 items-center gap-1.5 justify-self-start rounded-md border border-dashed border-border px-2.5 text-xs font-medium text-muted-foreground hover:border-foreground/40 hover:text-foreground lg:mt-0`,
              onClick: () => {
                setPromptExpanded(true);
                setFocusPromptPending(true);
              },
              type: "button",
              children: [
                /* @__PURE__ */ jsx(
                  HugeiconsIcon,
                  {
                    "aria-hidden": "true",
                    className: "size-3.5",
                    icon: PlusSignIcon
                  }
                ),
                "Add entry prompt"
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            "label",
            {
              className: `${stagePromptLayoutClass} mt-2 gap-0.5 lg:mt-0 ${showPrompt ? "grid" : "hidden"}`,
              children: [
                /* @__PURE__ */ jsx("span", { className: `${fieldCaptionClass} px-2.5 lg:sr-only`, children: "Entry prompt" }),
                /* @__PURE__ */ jsx(
                  "textarea",
                  {
                    "aria-label": `Entry prompt for ${stage.title}`,
                    className: `${fieldClass} min-h-8 max-h-48 resize-none overflow-y-auto leading-5`,
                    maxLength: ENTRY_PROMPT_MAX_LENGTH,
                    onChange: (event) => update("entryPrompt", event.target.value),
                    ref: promptRef,
                    rows: 2,
                    style: { fieldSizing: "content" },
                    value: stage.entryPrompt ?? ""
                  }
                ),
                hasPrompt ? null : /* @__PURE__ */ jsx(
                  "button",
                  {
                    className: "justify-self-end text-xs text-muted-foreground hover:text-foreground",
                    onClick: () => setPromptExpanded(false),
                    type: "button",
                    children: "Dismiss"
                  }
                )
              ]
            }
          )
        ] })
      ] })
    }
  );
}
function WorkflowSettings() {
  const rpc = useRpc();
  const [config, setConfig] = useState(null);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);
  const [pendingFocusKey, setPendingFocusKey] = useState(
    null
  );
  const listRef = useRef(null);
  const draftKeysRef = useRef(/* @__PURE__ */ new Set());
  const editRevisionRef = useRef(0);
  const dirtyRef = useRef(false);
  const savingRef = useRef(false);
  const loadedRevisionRef = useRef(0);
  const [changedElsewhere, setChangedElsewhere] = useState(false);
  const load = useCallback(async () => {
    if (dirtyRef.current || savingRef.current) return;
    const requestedRevision = editRevisionRef.current;
    setError(null);
    try {
      const full = await rpc.call("getConfig", {});
      if (dirtyRef.current || savingRef.current || editRevisionRef.current !== requestedRevision) {
        return;
      }
      setConfig(editableWorkflowConfig(full));
      cacheWorkflowConfig(full);
      loadedRevisionRef.current = full.revision ?? 0;
      setChangedElsewhere(false);
    } catch (loadError) {
      setError(errorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [rpc]);
  useEffect(() => {
    void load();
  }, [load]);
  useRealtime("workflow-config-changed", (payload) => {
    const revision = typeof payload === "object" && payload !== null && typeof payload.revision === "number" ? payload.revision : null;
    if (revision !== null && revision <= loadedRevisionRef.current) return;
    if (savingRef.current) return;
    if (dirtyRef.current) {
      setChangedElsewhere(true);
      return;
    }
    void load();
  });
  const reloadFromServer = () => {
    editRevisionRef.current += 1;
    dirtyRef.current = false;
    draftKeysRef.current.clear();
    setChangedElsewhere(false);
    void load();
  };
  const markEdited = () => {
    editRevisionRef.current += 1;
    dirtyRef.current = true;
    setSaved(false);
  };
  useEffect(() => {
    if (pendingFocusKey === null) return;
    const input = listRef.current?.querySelector(
      `input[data-stage-key="${pendingFocusKey}"]`
    );
    if (!input) return;
    setPendingFocusKey(null);
    input.focus();
    if (typeof input.scrollIntoView === "function") {
      input.scrollIntoView({ block: "nearest" });
    }
  }, [config, pendingFocusKey]);
  const replaceStage = (index, stage) => {
    markEdited();
    setConfig(
      (current) => current === null ? null : {
        ...current,
        stages: current.stages.map(
          (candidate, candidateIndex) => candidateIndex === index ? stage : candidate
        )
      }
    );
  };
  const moveStage = (from, to) => {
    if (from <= 0 || to <= 0 || config === null) return;
    const stages = [...config.stages];
    const [stage] = stages.splice(from, 1);
    if (stage === void 0) return;
    stages.splice(Math.min(to, stages.length), 0, stage);
    markEdited();
    setConfig({ ...config, stages });
  };
  const removeStage = (index) => {
    if (index <= 0 || config === null) return;
    const stages = config.stages.filter(
      (_, stageIndex) => stageIndex !== index
    );
    markEdited();
    setConfig({ ...config, stages });
  };
  const addStage = () => {
    if (config === null || config.stages.length >= 12) return;
    const title = uniqueNewStageTitle(config.stages);
    const key = createStageKey(
      title,
      config.stages.map((stage) => stage.key)
    );
    markEdited();
    draftKeysRef.current.add(key);
    setPendingFocusKey(key);
    setConfig({
      ...config,
      stages: [
        ...config.stages,
        {
          key,
          role: "stage",
          title,
          rule: "Describe the work that belongs in this section."
        }
      ]
    });
  };
  const save = async () => {
    if (config === null) return;
    const submittedRevision = editRevisionRef.current;
    const normalized = normalizeEditableWorkflowConfig(
      finalizeDraftKeys(config, draftKeysRef.current)
    );
    savingRef.current = true;
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const full = await rpc.call("saveConfig", normalized);
      cacheWorkflowConfig(full);
      loadedRevisionRef.current = full.revision ?? 0;
      if (editRevisionRef.current === submittedRevision) {
        dirtyRef.current = false;
        draftKeysRef.current.clear();
        setConfig(editableWorkflowConfig(full));
        setSaved(true);
      }
    } catch (saveError) {
      setError(errorMessage(saveError));
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };
  if (loading) {
    return /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Loading workflow\u2026" });
  }
  if (config === null) {
    return /* @__PURE__ */ jsxs("div", { className: "grid gap-3", children: [
      /* @__PURE__ */ jsx("p", { className: "text-sm text-destructive", role: "alert", children: error ?? "Couldn\u2019t load the workflow." }),
      /* @__PURE__ */ jsx(
        "button",
        {
          className: `${outlineButtonClass} w-fit`,
          onClick: () => void load(),
          children: "Try again"
        }
      )
    ] });
  }
  return /* @__PURE__ */ jsxs("div", { className: "grid min-w-0 w-full max-w-3xl gap-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex min-w-0 flex-wrap items-end gap-x-4 gap-y-3", children: [
      /* @__PURE__ */ jsx("div", { className: "min-w-60 flex-1", children: /* @__PURE__ */ jsx("p", { className: workflowSettingsDescriptionClass, children: workflowSettingsDescription }) }),
      /* @__PURE__ */ jsxs(
        "div",
        {
          "aria-label": "Workflow actions",
          className: "ml-auto flex shrink-0 items-center justify-end gap-2",
          role: "group",
          children: [
            /* @__PURE__ */ jsxs(
              "button",
              {
                className: outlineButtonClass,
                disabled: config.stages.length >= 12,
                onClick: addStage,
                type: "button",
                children: [
                  /* @__PURE__ */ jsx(HugeiconsIcon, { "aria-hidden": true, icon: PlusSignIcon }),
                  "Add section"
                ]
              }
            ),
            /* @__PURE__ */ jsxs(
              "button",
              {
                className: primaryButtonClass,
                disabled: saving || changedElsewhere,
                onClick: () => void save(),
                type: "button",
                children: [
                  /* @__PURE__ */ jsx(HugeiconsIcon, { "aria-hidden": true, icon: Tick02Icon }),
                  saving ? "Saving\u2026" : saved ? "Saved" : "Save"
                ]
              }
            )
          ]
        }
      )
    ] }),
    error ? /* @__PURE__ */ jsx("p", { className: "text-sm text-destructive", role: "alert", children: error }) : null,
    changedElsewhere ? /* @__PURE__ */ jsxs(
      "p",
      {
        className: "flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-foreground",
        role: "status",
        children: [
          "The workflow changed elsewhere. Reload to see the latest before saving.",
          /* @__PURE__ */ jsx(
            "button",
            {
              className: "font-medium underline underline-offset-2",
              onClick: reloadFromServer,
              type: "button",
              children: "Reload"
            }
          )
        ]
      }
    ) : null,
    /* @__PURE__ */ jsxs(
      "div",
      {
        className: "min-w-0 overflow-visible rounded-lg border border-border",
        ref: listRef,
        children: [
          /* @__PURE__ */ jsxs(
            "p",
            {
              className: `${fieldCaptionClass} rounded-t-lg border-b border-border bg-muted/30 px-3 py-2 lg:hidden`,
              children: [
                "Rule",
                /* @__PURE__ */ jsx("span", { className: fieldHintClass, children: "what belongs here" }),
                /* @__PURE__ */ jsx("span", { "aria-hidden": "true", className: "mx-2 font-normal", children: "\xB7" }),
                "Entry prompt",
                /* @__PURE__ */ jsx("span", { className: fieldHintClass, children: "sent on arrival" })
              ]
            }
          ),
          /* @__PURE__ */ jsxs("div", { className: stageHeaderClass, children: [
            /* @__PURE__ */ jsx("span", {}),
            /* @__PURE__ */ jsx("span", { className: `${fieldCaptionClass} px-2.5`, children: "Section" }),
            /* @__PURE__ */ jsxs("span", { className: `${fieldCaptionClass} px-2.5`, children: [
              "Rule",
              /* @__PURE__ */ jsx("span", { className: fieldHintClass, children: "what belongs here" })
            ] }),
            /* @__PURE__ */ jsxs("span", { className: `${fieldCaptionClass} px-2.5`, children: [
              "Entry prompt",
              /* @__PURE__ */ jsx("span", { className: fieldHintClass, children: "sent on arrival" })
            ] }),
            /* @__PURE__ */ jsx("span", {})
          ] }),
          config.stages.map((stage, index) => /* @__PURE__ */ jsx(
            StageCard,
            {
              index,
              onChange: (next) => replaceStage(index, next),
              onDragStart: setDraggedIndex,
              onDrop: (target) => {
                if (draggedIndex !== null) moveStage(draggedIndex, target);
                setDraggedIndex(null);
              },
              onMove: (stageIndex, direction) => moveStage(stageIndex, stageIndex + direction),
              onRemove: removeStage,
              stage,
              stageCount: config.stages.length
            },
            stage.key
          ))
        ]
      }
    ),
    /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground", children: [
      "Entry prompts can use",
      " ",
      /* @__PURE__ */ jsx("code", { className: "font-mono", children: "{{thread.title}}" }),
      ",",
      " ",
      /* @__PURE__ */ jsx("code", { className: "font-mono", children: "{{thread.id}}" }),
      ",",
      " ",
      /* @__PURE__ */ jsx("code", { className: "font-mono", children: "{{section.title}}" }),
      ", and",
      " ",
      /* @__PURE__ */ jsx("code", { className: "font-mono", children: "{{section.key}}" }),
      "."
    ] })
  ] });
}
function ConfirmWorkflowChange({
  interaction,
  submit,
  cancel
}) {
  const payload = typeof interaction.payload === "object" && interaction.payload !== null ? interaction.payload : {};
  const summary = typeof payload.summary === "string" ? payload.summary : "";
  const text = typeof payload.text === "string" ? payload.text : null;
  const [busy, setBusy] = useState(false);
  const decide = async (approve) => {
    setBusy(true);
    try {
      if (approve) await submit(true);
      else await cancel();
    } finally {
      setBusy(false);
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "grid gap-3 rounded-lg border border-border bg-background p-3 text-sm", children: [
    /* @__PURE__ */ jsx("p", { className: "font-semibold text-foreground", children: interaction.title }),
    summary ? /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: summary }) : null,
    text !== null ? /* @__PURE__ */ jsx("pre", { className: "max-h-48 overflow-auto whitespace-pre-wrap rounded-md border border-border bg-muted/30 px-2.5 py-1.5 font-sans text-sm text-foreground", children: text }) : null,
    /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-2", children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          className: outlineButtonClass,
          disabled: busy,
          onClick: () => void decide(false),
          type: "button",
          children: "Cancel"
        }
      ),
      /* @__PURE__ */ jsx(
        "button",
        {
          className: primaryButtonClass,
          disabled: busy,
          onClick: () => void decide(true),
          type: "button",
          children: "Approve"
        }
      )
    ] })
  ] });
}
var app_default = definePluginApp((app) => {
  app.contentScripts.register({
    id: "workflow-sidebar",
    mount: ({ pluginId, signal }) => mountThreadOrganizerSidebar({ pluginId, signal })
  });
  app.slots.settingsSection({
    id: "workflow-sections",
    component: WorkflowSettings
  });
  app.slots.pendingInteraction({
    id: WORKFLOW_CHANGE_INTERACTION_ID,
    component: ConfirmWorkflowChange
  });
});
var workflowConfigVersion = WORKFLOW_CONFIG_VERSION;
export {
  WorkflowSettings,
  app_default as default,
  workflowConfigVersion
};
