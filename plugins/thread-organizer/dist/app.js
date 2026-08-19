// bb-plugin-runtime-shim:@get-bb/plugin-sdk/app
var runtime = globalThis.__bbPluginRuntime;
if (runtime == null || runtime.pluginSdkApp == null) {
  throw new Error('Cannot load "@get-bb/plugin-sdk/app": this bundle must be loaded by the BB app, which provides the shared plugin runtime (globalThis.__bbPluginRuntime).');
}
var mod = runtime.pluginSdkApp;
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
} = mod;

// core.ts
var PHASE_TARGETS = [
  "inbox",
  "planning",
  "spec-review",
  "building",
  "testing-deploy",
  "handoff"
];
var PHASE_SECTION_NAMES = {
  inbox: "\u{1F4E5} Inbox",
  planning: "\u{1F4CB} Planning",
  "spec-review": "\u{1F50E} Spec Review",
  building: "\u{1F6E0}\uFE0F Building",
  "testing-deploy": "\u2705 Testing / Deploy",
  handoff: "\u{1F91D} Handoff"
};
var ACTION_PATTERNS = [
  [/^take\s+over\b/i, "Take Over"],
  [/^clean\s+up\b/i, "Clean Up"],
  [/^root\s+cause\b/i, "Investigate"],
  [/^investigate\b/i, "Investigate"],
  [/^implement\b/i, "Implement"],
  [/^optimize\b/i, "Optimize"],
  [/^reorganize\b/i, "Reorganize"],
  [/^refactor\b/i, "Refactor"],
  [/^analyze\b/i, "Analyze"],
  [/^create\b/i, "Create"],
  [/^design\b/i, "Design"],
  [/^rewrite\b/i, "Rewrite"],
  [/^refresh\b/i, "Refresh"],
  [/^profile\b/i, "Profile"],
  [/^review\b/i, "Review"],
  [/^rename\b/i, "Rename"],
  [/^update\b/i, "Update"],
  [/^render\b/i, "Render"],
  [/^archive\b/i, "Archive"],
  [/^debug\b/i, "Debug"],
  [/^build\b/i, "Build"],
  [/^write\b/i, "Write"],
  [/^style\b/i, "Style"],
  [/^move\b/i, "Move"],
  [/^open\b/i, "Open"],
  [/^audit\b/i, "Audit"],
  [/^add\b/i, "Add"],
  [/^fix\b/i, "Fix"]
].map(([expression, title]) => ({
  expression,
  title
}));

// sidebar-controller.ts
var SIDEBAR_SELECTOR = '[data-sidebar="sidebar"]';
var STICKY_GROUP_SELECTOR = "[data-sidebar-sticky-group]";
var THREAD_SELECTOR = "[data-sidebar-thread-id]";
var SECTION_TOGGLE_SELECTOR = 'button[aria-expanded][aria-label$=" section"]';
var SECTION_ROW_TOGGLE_SELECTOR = 'button[aria-hidden="true"][tabindex="-1"]';
var MANUAL_SECTION_ORDER_STORAGE_KEY = "bb.sidebar.manualSectionOrder";
var PHASE_SECTION_RANK = new Map(
  PHASE_TARGETS.map((target, index) => [PHASE_SECTION_NAMES[target], index])
);
function groupToggle(group) {
  for (const button of group.querySelectorAll(
    SECTION_TOGGLE_SELECTOR
  )) {
    if (button.closest(STICKY_GROUP_SELECTOR) === group) return button;
  }
  return null;
}
function isNativePinnedGroup(group) {
  const toggle = groupToggle(group);
  if (!/^(?:Expand|Collapse) Pinned section$/.test(
    toggle?.getAttribute("aria-label") ?? ""
  )) {
    return false;
  }
  for (const button of group.querySelectorAll(
    `${SECTION_ROW_TOGGLE_SELECTOR}, button[aria-label="Pinned section actions"], button[aria-label="New thread in Pinned"]`
  )) {
    if (button.closest(STICKY_GROUP_SELECTOR) === group) return false;
  }
  return true;
}
function visibleThreadGroups(sidebar) {
  const groups = /* @__PURE__ */ new Map();
  for (const row of sidebar.querySelectorAll(THREAD_SELECTOR)) {
    const id = row.dataset.sidebarThreadId;
    const group = row.closest(STICKY_GROUP_SELECTOR);
    if (id && group) groups.set(id, group);
  }
  return groups;
}
function phaseSection(group) {
  const label = groupToggle(group)?.getAttribute("aria-label") ?? "";
  const match = /^(?:Expand|Collapse) (.+) section$/.exec(label);
  if (match === null) return null;
  const rank = PHASE_SECTION_RANK.get(match[1]);
  const sectionId = group.getAttribute("data-sidebar-section-id");
  return rank === void 0 || sectionId === null ? null : { id: `section:${sectionId}`, rank };
}
function reorderPhaseSections(sidebar) {
  const ranksById = /* @__PURE__ */ new Map();
  for (const group of sidebar.querySelectorAll(STICKY_GROUP_SELECTOR)) {
    const section = phaseSection(group);
    if (section !== null) ranksById.set(section.id, section.rank);
  }
  if (ranksById.size < 2) return;
  const view = sidebar.ownerDocument.defaultView;
  if (view === null) return;
  const previousJson = view.localStorage.getItem(
    MANUAL_SECTION_ORDER_STORAGE_KEY
  );
  if (previousJson === null) return;
  let currentOrder;
  try {
    currentOrder = JSON.parse(previousJson);
  } catch {
    return;
  }
  if (!Array.isArray(currentOrder) || currentOrder.some((sectionId) => typeof sectionId !== "string") || [...ranksById.keys()].some((sectionId) => !currentOrder.includes(sectionId))) {
    return;
  }
  const phasePositions = currentOrder.flatMap(
    (sectionId, index) => ranksById.has(sectionId) ? [index] : []
  );
  const orderedPhaseIds = phasePositions.map((index) => currentOrder[index]).sort((left, right) => ranksById.get(left) - ranksById.get(right));
  const nextOrder = [...currentOrder];
  phasePositions.forEach((position, index) => {
    nextOrder[position] = orderedPhaseIds[index];
  });
  if (nextOrder.every((sectionId, index) => sectionId === currentOrder[index])) {
    return;
  }
  const nextJson = JSON.stringify(nextOrder);
  view.localStorage.setItem(MANUAL_SECTION_ORDER_STORAGE_KEY, nextJson);
  view.dispatchEvent(
    new view.StorageEvent("storage", {
      key: MANUAL_SECTION_ORDER_STORAGE_KEY,
      oldValue: previousJson,
      newValue: nextJson,
      storageArea: view.localStorage,
      url: view.location.href
    })
  );
}
function addExpandedGroupAndAncestors(controls, group, userExpandedGroups, pendingUserExpandedGroups) {
  let current = group;
  while (current) {
    const toggle = groupToggle(current);
    if (!isNativePinnedGroup(current) && toggle?.getAttribute("aria-expanded") === "true" && !userExpandedGroups.has(current) && !pendingUserExpandedGroups.has(current)) {
      controls.add(toggle);
    }
    current = current.parentElement?.closest(STICKY_GROUP_SELECTOR) ?? null;
  }
}
function mountSidebarCollapser(sidebar, signal) {
  const expandedByGroup = /* @__PURE__ */ new WeakMap();
  const userExpandedGroups = /* @__PURE__ */ new WeakSet();
  const pendingUserExpandedGroups = /* @__PURE__ */ new WeakSet();
  const controllerCollapseControls = /* @__PURE__ */ new WeakSet();
  const pendingExpansionTimers = /* @__PURE__ */ new Set();
  const knownThreadGroups = visibleThreadGroups(sidebar);
  let scheduled = false;
  const reconcile = () => {
    scheduled = false;
    if (signal.aborted || !sidebar.isConnected) return;
    reorderPhaseSections(sidebar);
    const currentThreadGroups = visibleThreadGroups(sidebar);
    const controls = /* @__PURE__ */ new Set();
    for (const group of sidebar.querySelectorAll(STICKY_GROUP_SELECTOR)) {
      const toggle = groupToggle(group);
      if (toggle === null || isNativePinnedGroup(group)) continue;
      const expanded = toggle.getAttribute("aria-expanded") === "true";
      const wasExpanded = expandedByGroup.get(group);
      if (!expanded) userExpandedGroups.delete(group);
      if (expanded && !userExpandedGroups.has(group) && !pendingUserExpandedGroups.has(group) && (wasExpanded === void 0 || wasExpanded === false)) {
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
          pendingUserExpandedGroups
        );
      }
      knownThreadGroups.set(id, currentGroup);
    }
    for (const control of controls) {
      if (control.isConnected && control.getAttribute("aria-expanded") === "true") {
        const collapse = (remainingAttempts) => {
          if (signal.aborted || !control.isConnected || control.getAttribute("aria-expanded") !== "true") {
            return;
          }
          controllerCollapseControls.add(control);
          try {
            control.click();
          } finally {
            controllerCollapseControls.delete(control);
          }
          if (remainingAttempts > 1 && control.getAttribute("aria-expanded") === "true") {
            queueMicrotask(() => collapse(remainingAttempts - 1));
          }
        };
        collapse(2);
      }
    }
    for (const group of sidebar.querySelectorAll(STICKY_GROUP_SELECTOR)) {
      const toggle = groupToggle(group);
      if (toggle !== null) {
        expandedByGroup.set(
          group,
          toggle.getAttribute("aria-expanded") === "true"
        );
      }
    }
  };
  const recordUserExpansion = (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const button = target.closest(
      `${SECTION_TOGGLE_SELECTOR}, ${SECTION_ROW_TOGGLE_SELECTOR}`
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
        if (!signal.aborted && group.isConnected && groupToggle(group)?.getAttribute("aria-expanded") === "true") {
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
    subtree: true
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
    { once: true }
  );
  return () => {
    observer.disconnect();
    for (const timer of pendingExpansionTimers) clearTimeout(timer);
    pendingExpansionTimers.clear();
    sidebar.removeEventListener("click", recordUserExpansion, true);
  };
}
function mountInboxSectionCollapser({
  document: targetDocument = document,
  signal
}) {
  const disposers = /* @__PURE__ */ new Map();
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
    subtree: true
  });
  const dispose = () => {
    discoveryObserver.disconnect();
    for (const stop of disposers.values()) stop();
    disposers.clear();
  };
  signal.addEventListener("abort", dispose, { once: true });
  return dispose;
}

// app.ts
var app_default = definePluginApp((app) => {
  const contentScripts = app.contentScripts ?? app.experimental_contentScripts;
  if (contentScripts === void 0) {
    throw new Error("BB does not expose the content scripts plugin API");
  }
  contentScripts.register({
    id: "collapse-unpinned-destination",
    mount: ({ signal }) => mountInboxSectionCollapser({ signal })
  });
});
export {
  app_default as default
};
