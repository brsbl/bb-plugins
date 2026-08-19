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

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/ChatFeedback01Icon.js
var ChatFeedback01Icon = [
  ["path", { d: "M7.5 8.5H16.5M7.5 12.5H13", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M22 10.5C22 9.72921 21.9865 8.97679 21.9609 8.2503C21.8772 5.87683 21.8353 4.69009 20.8699 3.71745C19.9046 2.74481 18.6843 2.6926 16.2438 2.58819C14.9048 2.5309 13.4791 2.5 12 2.5C10.5209 2.5 9.09517 2.5309 7.7562 2.58819C5.3157 2.6926 4.09545 2.74481 3.13007 3.71745C2.16469 4.69009 2.12282 5.87683 2.03909 8.2503C2.01346 8.97679 2 9.72921 2 10.5C2 11.2708 2.01346 12.0232 2.03909 12.7497C2.12282 15.1232 2.16469 16.3099 3.13007 17.2826C4.09545 18.2552 5.31573 18.3074 7.7563 18.4118C8.4902 18.4432 9.25016 18.4667 10.0307 18.4815C10.7718 18.4955 11.1424 18.5026 11.468 18.6266C11.7936 18.7506 12.0675 18.9855 12.6155 19.4553L14.795 21.3242C14.9273 21.4376 15.0958 21.5 15.2701 21.5C15.6732 21.5 16 21.1732 16 20.7701V18.4219C16.0816 18.4186 16.1629 18.4153 16.2438 18.4118C18.6843 18.3074 19.9046 18.2552 20.8699 17.2825C21.8353 16.3099 21.8772 15.1232 21.9609 12.7497C21.9865 12.0232 22 11.2708 22 10.5Z", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "1" }]
];

// ../../node_modules/@hugeicons/react/dist/esm/HugeiconsIcon.js
var defaultAttributes = {
  xmlns: "http://www.w3.org/2000/svg",
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none"
};
var HugeiconsIcon = forwardRef(({ color = "currentColor", size = 24, strokeWidth, absoluteStrokeWidth = false, className = "", altIcon, showAlt = false, icon: icon2, primaryColor, secondaryColor, disableSecondaryOpacity = false, ...rest }, ref) => {
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
  const currentIcon = showAlt && altIcon ? altIcon : icon2;
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

// bridge.ts
var activeController = null;
var anchorHealthSnapshot = /* @__PURE__ */ new Map();
var anchorHealthListeners = /* @__PURE__ */ new Set();
var handoffTargets = /* @__PURE__ */ new Set();
function publishTimelineCommentAnchorHealth(health) {
  anchorHealthSnapshot = new Map(health);
  for (const listener of anchorHealthListeners) listener();
}
function getTimelineCommentAnchorHealth() {
  return anchorHealthSnapshot;
}
function subscribeTimelineCommentAnchorHealth(listener) {
  anchorHealthListeners.add(listener);
  return () => anchorHealthListeners.delete(listener);
}
function installTimelineCommentsController(controller) {
  activeController = controller;
  return () => {
    if (activeController === controller) activeController = null;
  };
}
function beginTimelineComment(context) {
  activeController?.beginComment(context);
}
async function focusTimelineComment(anchor) {
  return await activeController?.focusThread(anchor) ?? false;
}
function registerTimelineCommentThreadWindow(threadId, window2) {
  return activeController?.registerThreadWindow(threadId, window2) ?? (() => {
  });
}
function refreshTimelineCommentAnchors() {
  activeController?.refreshAnchors();
}
function isRendered(node) {
  if (node === null || !node.isConnected) return false;
  if (node.closest('[aria-hidden="true"], [hidden], [inert]') !== null) {
    return false;
  }
  const checkVisibility = node.checkVisibility;
  return checkVisibility?.call(node, {
    contentVisibilityAuto: true,
    visibilityProperty: true
  }) ?? true;
}
async function requestTimelineCommentHandoff(threadId) {
  const candidates = [...handoffTargets].filter((target2) => {
    return target2.threadId === threadId && isRendered(target2.getThreadWindow());
  });
  if (candidates.length === 0) return false;
  const activeWindow = document.activeElement instanceof Element ? document.activeElement.closest("[data-thread-window]") : null;
  const target = candidates.find(
    (candidate) => candidate.getThreadWindow() === activeWindow
  ) ?? candidates.find(
    (candidate) => candidate.getThreadWindow()?.closest('[data-split-pane-id][data-focused="true"]') !== null
  ) ?? candidates[0];
  return target.accept();
}
function subscribeTimelineCommentHandoff(target) {
  handoffTargets.add(target);
  return () => handoffTargets.delete(target);
}

// ../../node_modules/lucide/dist/esm/createElement.js
var createElement2 = (tag, attrs, children = []) => {
  const element2 = document.createElementNS("http://www.w3.org/2000/svg", tag);
  Object.keys(attrs).forEach((name) => {
    element2.setAttribute(name, String(attrs[name]));
  });
  if (children.length) {
    children.forEach((child) => {
      const childElement = createElement2(...child);
      element2.appendChild(childElement);
    });
  }
  return element2;
};
var createElement$1 = ([tag, attrs, children]) => createElement2(tag, attrs, children);

// ../../node_modules/lucide/dist/esm/defaultAttributes.js
var defaultAttributes2 = {
  xmlns: "http://www.w3.org/2000/svg",
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  "stroke-width": 2,
  "stroke-linecap": "round",
  "stroke-linejoin": "round"
};

// ../../node_modules/lucide/dist/esm/icons/check-check.js
var CheckCheck = [
  "svg",
  defaultAttributes2,
  [
    ["path", { d: "M18 6 7 17l-5-5" }],
    ["path", { d: "m22 10-7.5 7.5L13 16" }]
  ]
];

// ../../node_modules/lucide/dist/esm/icons/command.js
var Command = [
  "svg",
  defaultAttributes2,
  [["path", { d: "M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" }]]
];

// ../../node_modules/lucide/dist/esm/icons/corner-down-left.js
var CornerDownLeft = [
  "svg",
  defaultAttributes2,
  [
    ["polyline", { points: "9 10 4 15 9 20" }],
    ["path", { d: "M20 4v7a4 4 0 0 1-4 4H4" }]
  ]
];

// ../../node_modules/lucide/dist/esm/icons/ellipsis-vertical.js
var EllipsisVertical = [
  "svg",
  defaultAttributes2,
  [
    ["circle", { cx: "12", cy: "12", r: "1" }],
    ["circle", { cx: "12", cy: "5", r: "1" }],
    ["circle", { cx: "12", cy: "19", r: "1" }]
  ]
];

// ../../node_modules/lucide/dist/esm/icons/pencil.js
var Pencil = [
  "svg",
  defaultAttributes2,
  [
    [
      "path",
      {
        d: "M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"
      }
    ],
    ["path", { d: "m15 5 4 4" }]
  ]
];

// ../../node_modules/lucide/dist/esm/icons/sticky-note.js
var StickyNote = [
  "svg",
  defaultAttributes2,
  [
    ["path", { d: "M16 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8Z" }],
    ["path", { d: "M15 3v4a2 2 0 0 0 2 2h4" }]
  ]
];

// ../../node_modules/lucide/dist/esm/icons/trash-2.js
var Trash2 = [
  "svg",
  defaultAttributes2,
  [
    ["path", { d: "M3 6h18" }],
    ["path", { d: "M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" }],
    ["path", { d: "M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" }],
    ["line", { x1: "10", x2: "10", y1: "11", y2: "17" }],
    ["line", { x1: "14", x2: "14", y1: "11", y2: "17" }]
  ]
];

// ../../node_modules/lucide/dist/esm/icons/x.js
var X = [
  "svg",
  defaultAttributes2,
  [
    ["path", { d: "M18 6 6 18" }],
    ["path", { d: "m6 6 12 12" }]
  ]
];

// anchors.ts
function selectorForRange(root, range, contextLength = 32) {
  if (range.collapsed || !root.contains(range.startContainer) || !root.contains(range.endContainer)) {
    return null;
  }
  const { text } = indexText(root);
  const before = document.createRange();
  before.selectNodeContents(root);
  before.setEnd(range.startContainer, range.startOffset);
  const start = before.toString().length;
  const exact = range.toString();
  const end = start + exact.length;
  if (exact === "" || text.slice(start, end) !== exact) return null;
  return {
    version: 1,
    coordinateSpace: "rendered-text-utf16",
    start,
    end,
    exact,
    prefix: text.slice(Math.max(0, start - contextLength), start),
    suffix: text.slice(end, end + contextLength)
  };
}
function indexText(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const segments = [];
  let text = "";
  for (let node = walker.nextNode(); node !== null; node = walker.nextNode()) {
    const value = node.nodeValue ?? "";
    segments.push({
      node,
      start: text.length,
      end: text.length + value.length
    });
    text += value;
  }
  return { text, segments };
}
function boundaryAt(segments, offset, preferNext) {
  for (const [index, segment] of segments.entries()) {
    if (offset < segment.end || offset === segment.end && (!preferNext || index === segments.length - 1)) {
      return { node: segment.node, offset: offset - segment.start };
    }
    if (preferNext && offset === segment.end) continue;
  }
  return null;
}
function rangeForOffsets(segments, start, end) {
  const startBoundary = boundaryAt(segments, start, true);
  const endBoundary = boundaryAt(segments, end, false);
  if (startBoundary === null || endBoundary === null) return null;
  const range = document.createRange();
  range.setStart(startBoundary.node, startBoundary.offset);
  range.setEnd(endBoundary.node, endBoundary.offset);
  return range;
}
function contextMatches(text, at, selector) {
  const prefix = text.slice(Math.max(0, at - selector.prefix.length), at);
  const suffixStart = at + selector.exact.length;
  const suffix = text.slice(suffixStart, suffixStart + selector.suffix.length);
  return prefix === selector.prefix && suffix === selector.suffix;
}
function restoreSelector(root, selector) {
  const { text, segments } = indexText(root);
  if (text.slice(selector.start, selector.end) === selector.exact && contextMatches(text, selector.start, selector)) {
    const range2 = rangeForOffsets(segments, selector.start, selector.end);
    return range2 === null ? null : { range: range2, strategy: "offset" };
  }
  const occurrences = [];
  const candidates = [];
  let at = text.indexOf(selector.exact);
  while (at !== -1) {
    occurrences.push(at);
    if (contextMatches(text, at, selector)) candidates.push(at);
    at = text.indexOf(selector.exact, at + 1);
  }
  const start = candidates.length === 1 ? candidates[0] : occurrences.length === 1 ? occurrences[0] : void 0;
  if (start === void 0) return null;
  const range = rangeForOffsets(segments, start, start + selector.exact.length);
  return range === null ? null : { range, strategy: "context" };
}
function chooseNearestGutter(fragments, rail) {
  if (rail.width < 520 || fragments.length === 0) return "right";
  const leftDistance = Math.min(
    ...fragments.map((rect) => Math.abs(rect.left - rail.left))
  );
  const rightDistance = Math.min(
    ...fragments.map((rect) => Math.abs(rail.right - rect.right))
  );
  return leftDistance < rightDistance ? "left" : "right";
}
function chooseAvailableGutter(fragments, content, container, requiredSpace) {
  if (container.width < 520) return null;
  const spaces = {
    left: content.left - container.left,
    right: container.right - content.right
  };
  const preferred = chooseNearestGutter(fragments, {
    left: content.left,
    right: content.right,
    width: container.width
  });
  if (spaces[preferred] >= requiredSpace) return preferred;
  const alternate = preferred === "left" ? "right" : "left";
  return spaces[alternate] >= requiredSpace ? alternate : null;
}
function layoutGutterMarkers(candidates, top, bottom, markerSize = 24, gap = 4) {
  if (candidates.length === 0 || bottom <= top) return [];
  const sorted = [...candidates].sort(
    (a, b) => a.desiredY - b.desiredY || a.id.localeCompare(b.id)
  );
  const capacity = Math.max(
    1,
    Math.floor((bottom - top + gap) / (markerSize + gap))
  );
  const proximityGroups = [];
  for (const candidate of sorted) {
    const previous = proximityGroups.at(-1);
    const previousDesiredY = previous?.at(-1)?.desiredY;
    if (previous !== void 0 && previousDesiredY !== void 0 && candidate.desiredY - previousDesiredY < markerSize + gap) {
      previous.push(candidate);
    } else {
      proximityGroups.push([candidate]);
    }
  }
  const groups = proximityGroups.length <= capacity ? proximityGroups : [
    ...proximityGroups.slice(0, capacity - 1),
    proximityGroups.slice(capacity - 1).flat()
  ];
  const placements = groups.map((group) => ({
    ids: group.map(({ id }) => id),
    y: Math.min(
      bottom - markerSize,
      Math.max(
        top,
        group.reduce((sum, item) => sum + item.desiredY, 0) / group.length - markerSize / 2
      )
    )
  }));
  for (let index = 1; index < placements.length; index += 1) {
    placements[index].y = Math.max(
      placements[index].y,
      placements[index - 1].y + markerSize + gap
    );
  }
  const overflow = placements.at(-1).y + markerSize - bottom;
  if (overflow > 0) {
    for (const placement of placements) placement.y -= overflow;
  }
  return placements;
}

// comment-body.ts
var COMMENT_BODY_CODE_POINT_LIMIT = 1e4;
function commentBodyError(value) {
  if (value.trim() === "") return "Comment body is required";
  if (Array.from(value).length > COMMENT_BODY_CODE_POINT_LIMIT)
    return "Comment body must be at most 10,000 Unicode code points";
  return null;
}

// bb-plugin-runtime-shim:react-dom
var runtime3 = globalThis.__bbPluginRuntime;
if (runtime3 == null || runtime3.reactDom == null) {
  throw new Error('Cannot load "react-dom": this bundle must be loaded by the BB app, which provides the shared plugin runtime (globalThis.__bbPluginRuntime).');
}
var mod3 = runtime3.reactDom;
var {
  createPortal,
  flushSync,
  preconnect,
  prefetchDNS,
  preinit,
  preinitModule,
  preload,
  preloadModule,
  requestFormReset,
  unstable_batchedUpdates,
  useFormState,
  useFormStatus,
  version: version2
} = mod3;

// bb-plugin-runtime-shim:react-dom/client
var runtime4 = globalThis.__bbPluginRuntime;
if (runtime4 == null || runtime4.reactDomClient == null) {
  throw new Error('Cannot load "react-dom/client": this bundle must be loaded by the BB app, which provides the shared plugin runtime (globalThis.__bbPluginRuntime).');
}
var mod4 = runtime4.reactDomClient;
var {
  createRoot,
  hydrateRoot,
  version: version3
} = mod4;

// ../../node_modules/lucide-react/dist/esm/shared/src/utils.js
var toKebabCase = (string) => string.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
var mergeClasses = (...classes) => classes.filter((className, index, array) => {
  return Boolean(className) && className.trim() !== "" && array.indexOf(className) === index;
}).join(" ").trim();

// ../../node_modules/lucide-react/dist/esm/defaultAttributes.js
var defaultAttributes3 = {
  xmlns: "http://www.w3.org/2000/svg",
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round"
};

// ../../node_modules/lucide-react/dist/esm/Icon.js
var Icon = forwardRef(
  ({
    color = "currentColor",
    size = 24,
    strokeWidth = 2,
    absoluteStrokeWidth,
    className = "",
    children,
    iconNode,
    ...rest
  }, ref) => {
    return createElement(
      "svg",
      {
        ref,
        ...defaultAttributes3,
        width: size,
        height: size,
        stroke: color,
        strokeWidth: absoluteStrokeWidth ? Number(strokeWidth) * 24 / Number(size) : strokeWidth,
        className: mergeClasses("lucide", className),
        ...rest
      },
      [
        ...iconNode.map(([tag, attrs]) => createElement(tag, attrs)),
        ...Array.isArray(children) ? children : [children]
      ]
    );
  }
);

// ../../node_modules/lucide-react/dist/esm/createLucideIcon.js
var createLucideIcon = (iconName, iconNode) => {
  const Component2 = forwardRef(
    ({ className, ...props }, ref) => createElement(Icon, {
      ref,
      iconNode,
      className: mergeClasses(`lucide-${toKebabCase(iconName)}`, className),
      ...props
    })
  );
  Component2.displayName = `${iconName}`;
  return Component2;
};

// ../../node_modules/lucide-react/dist/esm/icons/at-sign.js
var __iconNode = [
  ["circle", { cx: "12", cy: "12", r: "4", key: "4exip2" }],
  ["path", { d: "M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8", key: "7n84p3" }]
];
var AtSign = createLucideIcon("AtSign", __iconNode);

// ../../node_modules/lucide-react/dist/esm/icons/check-check.js
var __iconNode2 = [
  ["path", { d: "M18 6 7 17l-5-5", key: "116fxf" }],
  ["path", { d: "m22 10-7.5 7.5L13 16", key: "ke71qq" }]
];
var CheckCheck2 = createLucideIcon("CheckCheck", __iconNode2);

// ../../node_modules/lucide-react/dist/esm/icons/command.js
var __iconNode3 = [
  [
    "path",
    { d: "M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3", key: "11bfej" }
  ]
];
var Command2 = createLucideIcon("Command", __iconNode3);

// ../../node_modules/lucide-react/dist/esm/icons/corner-down-left.js
var __iconNode4 = [
  ["polyline", { points: "9 10 4 15 9 20", key: "r3jprv" }],
  ["path", { d: "M20 4v7a4 4 0 0 1-4 4H4", key: "6o5b7l" }]
];
var CornerDownLeft2 = createLucideIcon("CornerDownLeft", __iconNode4);

// ../../node_modules/lucide-react/dist/esm/icons/ellipsis.js
var __iconNode5 = [
  ["circle", { cx: "12", cy: "12", r: "1", key: "41hilf" }],
  ["circle", { cx: "19", cy: "12", r: "1", key: "1wjl8i" }],
  ["circle", { cx: "5", cy: "12", r: "1", key: "1pcz8c" }]
];
var Ellipsis = createLucideIcon("Ellipsis", __iconNode5);

// ../../node_modules/lucide-react/dist/esm/icons/message-square-text.js
var __iconNode6 = [
  ["path", { d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z", key: "1lielz" }],
  ["path", { d: "M13 8H7", key: "14i4kc" }],
  ["path", { d: "M17 12H7", key: "16if0g" }]
];
var MessageSquareText = createLucideIcon("MessageSquareText", __iconNode6);

// ../../node_modules/lucide-react/dist/esm/icons/pencil.js
var __iconNode7 = [
  [
    "path",
    {
      d: "M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z",
      key: "1a8usu"
    }
  ],
  ["path", { d: "m15 5 4 4", key: "1mk7zo" }]
];
var Pencil2 = createLucideIcon("Pencil", __iconNode7);

// ../../node_modules/lucide-react/dist/esm/icons/plus.js
var __iconNode8 = [
  ["path", { d: "M5 12h14", key: "1ays0h" }],
  ["path", { d: "M12 5v14", key: "s699le" }]
];
var Plus = createLucideIcon("Plus", __iconNode8);

// ../../node_modules/lucide-react/dist/esm/icons/send.js
var __iconNode9 = [
  [
    "path",
    {
      d: "M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z",
      key: "1ffxy3"
    }
  ],
  ["path", { d: "m21.854 2.147-10.94 10.939", key: "12cjpa" }]
];
var Send = createLucideIcon("Send", __iconNode9);

// ../../node_modules/lucide-react/dist/esm/icons/trash-2.js
var __iconNode10 = [
  ["path", { d: "M3 6h18", key: "d0wm0j" }],
  ["path", { d: "M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6", key: "4alrt4" }],
  ["path", { d: "M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2", key: "v07s0e" }],
  ["line", { x1: "10", x2: "10", y1: "11", y2: "17", key: "1uufr5" }],
  ["line", { x1: "14", x2: "14", y1: "11", y2: "17", key: "xtxkd" }]
];
var Trash22 = createLucideIcon("Trash2", __iconNode10);

// ../../node_modules/lucide-react/dist/esm/icons/x.js
var __iconNode11 = [
  ["path", { d: "M18 6 6 18", key: "1bl5f8" }],
  ["path", { d: "m6 6 12 12", key: "d8bk6v" }]
];
var X2 = createLucideIcon("X", __iconNode11);

// bb-plugin-runtime-shim:react/jsx-runtime
var runtime5 = globalThis.__bbPluginRuntime;
if (runtime5 == null || runtime5.jsxRuntime == null) {
  throw new Error('Cannot load "react/jsx-runtime": this bundle must be loaded by the BB app, which provides the shared plugin runtime (globalThis.__bbPluginRuntime).');
}
var mod5 = runtime5.jsxRuntime;
var {
  Fragment: Fragment2,
  jsx,
  jsxs
} = mod5;

// comment-components.tsx
var MODE_TRANSITION = {
  duration: 150,
  easing: "cubic-bezier(0.22, 1, 0.36, 1)"
};
var DRAFT_TTL = 24 * 60 * 60 * 1e3;
function readDraft(key) {
  const saved = sessionStorage.getItem(key);
  if (saved === null) return null;
  try {
    const parsed = JSON.parse(saved);
    if (typeof parsed.body === "string" && typeof parsed.expiresAt === "number" && parsed.expiresAt > Date.now()) {
      return parsed.body;
    }
  } catch {
  }
  sessionStorage.removeItem(key);
  return null;
}
function writeDraft(key, body) {
  if (body.trim() === "") {
    sessionStorage.removeItem(key);
    return;
  }
  sessionStorage.setItem(
    key,
    JSON.stringify({ body, expiresAt: Date.now() + DRAFT_TTL })
  );
}
function focusAdjacentToActionsTrigger(trigger, backwards) {
  const focusable = [
    ...document.querySelectorAll(
      'button:not(:disabled), textarea:not(:disabled), input:not(:disabled), [href], [tabindex]:not([tabindex="-1"])'
    )
  ].filter(
    (node) => node.getClientRects().length > 0 && node.closest('[aria-hidden="true"], [inert], [hidden]') === null && node.closest(".bb-comments-actions-popover") === null
  );
  const current = focusable.indexOf(trigger);
  const adjacent = focusable[current + (backwards ? -1 : 1)];
  if (adjacent === void 0) return false;
  adjacent.focus({ preventScroll: true });
  return true;
}
function actionsTriggerIsFullyVisible(trigger) {
  const scrollViewport = trigger.closest(
    ".bb-comments-thread-comments"
  );
  if (scrollViewport === null) return true;
  const triggerRect = trigger.getBoundingClientRect();
  const viewportRect = scrollViewport.getBoundingClientRect();
  return triggerRect.top >= viewportRect.top && triggerRect.bottom <= viewportRect.bottom;
}
function reducedMotion() {
  return typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
function relativeTime(value) {
  const elapsed = Math.max(0, Date.now() - value);
  if (elapsed < 6e4) return "just now";
  if (elapsed < 36e5) {
    const minutes = Math.floor(elapsed / 6e4);
    return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
  }
  if (elapsed < 864e5) {
    const hours = Math.floor(elapsed / 36e5);
    return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  }
  const days = Math.floor(elapsed / 864e5);
  return `${days} ${days === 1 ? "day" : "days"} ago`;
}
function absoluteTime(value) {
  return new Intl.DateTimeFormat(void 0, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(value);
}
function useMeasuredModeTransition(elementRef, active) {
  const startHeightRef = useRef(null);
  const animationRef = useRef(null);
  const cleanupTimerRef = useRef(null);
  const run = useCallback(
    (update) => {
      const element2 = elementRef.current;
      if (!element2 || typeof element2.animate !== "function" || reducedMotion()) {
        update();
        return;
      }
      if (cleanupTimerRef.current !== null) {
        window.clearTimeout(cleanupTimerRef.current);
        cleanupTimerRef.current = null;
      }
      animationRef.current?.cancel();
      animationRef.current = null;
      element2.style.removeProperty("overflow");
      startHeightRef.current = element2.getBoundingClientRect().height;
      update();
    },
    [elementRef]
  );
  useLayoutEffect(() => {
    const startHeight = startHeightRef.current;
    startHeightRef.current = null;
    const element2 = elementRef.current;
    if (startHeight === null || !element2) return;
    const endHeight = element2.getBoundingClientRect().height;
    if (Math.abs(endHeight - startHeight) < 0.5) return;
    element2.style.overflow = "hidden";
    const animation = element2.animate(
      [{ height: `${startHeight}px` }, { height: `${endHeight}px` }],
      MODE_TRANSITION
    );
    animationRef.current = animation;
    const finish = () => {
      if (animationRef.current !== animation) return;
      animationRef.current = null;
      if (cleanupTimerRef.current !== null) {
        window.clearTimeout(cleanupTimerRef.current);
        cleanupTimerRef.current = null;
      }
      element2.style.removeProperty("overflow");
    };
    animation.addEventListener("finish", finish, { once: true });
    cleanupTimerRef.current = window.setTimeout(() => {
      if (animationRef.current === animation) {
        animationRef.current = null;
        animation.cancel();
        element2.style.removeProperty("overflow");
      }
      cleanupTimerRef.current = null;
    }, 200);
  }, [active, elementRef]);
  useEffect(
    () => () => {
      startHeightRef.current = null;
      if (cleanupTimerRef.current !== null)
        window.clearTimeout(cleanupTimerRef.current);
      animationRef.current?.cancel();
      elementRef.current?.style.removeProperty("overflow");
    },
    [elementRef]
  );
  return run;
}
function CommentTextInput({
  value,
  onChange,
  onSubmit,
  placeholder,
  ariaLabel,
  persistentFooter = false,
  footerPortalTarget,
  autoFocus = false,
  onCancel,
  submitPending = false
}) {
  const rootRef = useRef(null);
  const inputContentRef = useRef(null);
  const textareaRef = useRef(null);
  const previousFooterVisibleRef = useRef(false);
  const compactHeightRef = useRef(null);
  const compactContentOffsetRef = useRef(null);
  const expandedHeightRef = useRef(null);
  const responsiveHeightAnimationRef = useRef(null);
  const responsiveContentAnimationRef = useRef(null);
  const responsiveAnimationCleanupTimerRef = useRef(null);
  const responsiveMeasurementFrameRef = useRef(null);
  const [responsiveFooterLatched, setResponsiveFooterLatched] = useState(false);
  const hasExplicitLineBreak = value.includes("\n");
  const responsiveExpansionRequested = hasExplicitLineBreak || responsiveFooterLatched;
  const footerVisible = persistentFooter || responsiveExpansionRequested;
  const responsiveCompact = !persistentFooter && !footerVisible;
  const error = value.trim() === "" ? null : commentBodyError(value);
  const submitDisabled = commentBodyError(value) !== null;
  const animateResponsiveHeightToNaturalSize = useCallback(() => {
    const root = rootRef.current;
    const previousNaturalHeight = expandedHeightRef.current;
    if (!root || previousNaturalHeight === null) return;
    const naturalHeight = Array.from(root.children).reduce((height, child) => {
      if (!(child instanceof HTMLElement) || window.getComputedStyle(child).position === "absolute") {
        return height;
      }
      return height + child.getBoundingClientRect().height;
    }, 0);
    if (Math.abs(naturalHeight - previousNaturalHeight) < 0.5) return;
    expandedHeightRef.current = naturalHeight;
    const runningAnimation = responsiveHeightAnimationRef.current;
    const startHeight = runningAnimation ? root.getBoundingClientRect().height : previousNaturalHeight;
    responsiveHeightAnimationRef.current = null;
    runningAnimation?.cancel();
    if (responsiveAnimationCleanupTimerRef.current !== null) {
      window.clearTimeout(responsiveAnimationCleanupTimerRef.current);
      responsiveAnimationCleanupTimerRef.current = null;
    }
    if (typeof root.animate !== "function" || reducedMotion() || Math.abs(naturalHeight - startHeight) < 0.5) {
      root.style.removeProperty("overflow");
      return;
    }
    root.style.overflow = "hidden";
    const heightAnimation = root.animate(
      [{ height: `${startHeight}px` }, { height: `${naturalHeight}px` }],
      MODE_TRANSITION
    );
    responsiveHeightAnimationRef.current = heightAnimation;
    const finishTransition = () => {
      if (responsiveHeightAnimationRef.current !== heightAnimation) return;
      responsiveHeightAnimationRef.current = null;
      if (responsiveAnimationCleanupTimerRef.current !== null) {
        window.clearTimeout(responsiveAnimationCleanupTimerRef.current);
        responsiveAnimationCleanupTimerRef.current = null;
      }
      root.style.removeProperty("overflow");
    };
    heightAnimation.addEventListener("finish", finishTransition, { once: true });
    responsiveAnimationCleanupTimerRef.current = window.setTimeout(() => {
      if (responsiveHeightAnimationRef.current === heightAnimation) {
        responsiveHeightAnimationRef.current = null;
        heightAnimation.cancel();
        root.style.removeProperty("overflow");
      }
      responsiveAnimationCleanupTimerRef.current = null;
    }, 200);
  }, []);
  useLayoutEffect(() => {
    if (persistentFooter) {
      previousFooterVisibleRef.current = footerVisible;
      return;
    }
    const root = rootRef.current;
    const content = inputContentRef.current;
    const row = root?.querySelector('[data-mention-input-row="true"]');
    if (!root || !content || !row) return;
    const wasVisible = previousFooterVisibleRef.current;
    previousFooterVisibleRef.current = footerVisible;
    const currentNaturalHeight = root.offsetHeight || root.getBoundingClientRect().height;
    const currentContentOffset = Number.parseFloat(window.getComputedStyle(row).paddingLeft) || 0;
    if (wasVisible === footerVisible) {
      if (!footerVisible) {
        const previousCompactHeight = compactHeightRef.current;
        if (previousCompactHeight === null || currentNaturalHeight <= previousCompactHeight + 0.5) {
          compactHeightRef.current = currentNaturalHeight;
          compactContentOffsetRef.current = currentContentOffset;
        }
      } else if (!responsiveHeightAnimationRef.current) {
        expandedHeightRef.current = currentNaturalHeight;
      }
      return;
    }
    const runningHeightAnimation = responsiveHeightAnimationRef.current;
    const animatedStartHeight = runningHeightAnimation ? root.getBoundingClientRect().height : null;
    responsiveHeightAnimationRef.current = null;
    runningHeightAnimation?.cancel();
    responsiveContentAnimationRef.current?.cancel();
    responsiveContentAnimationRef.current = null;
    if (responsiveAnimationCleanupTimerRef.current !== null) {
      window.clearTimeout(responsiveAnimationCleanupTimerRef.current);
      responsiveAnimationCleanupTimerRef.current = null;
    }
    root.style.removeProperty("overflow");
    const endHeight = root.offsetHeight || root.getBoundingClientRect().height;
    const startHeight = animatedStartHeight ?? (footerVisible ? compactHeightRef.current : expandedHeightRef.current) ?? endHeight;
    if (footerVisible) expandedHeightRef.current = endHeight;
    else {
      compactHeightRef.current = endHeight;
      compactContentOffsetRef.current = currentContentOffset;
    }
    if (typeof root.animate !== "function" || reducedMotion() || Math.abs(endHeight - startHeight) < 0.5) return;
    root.style.overflow = "hidden";
    const heightAnimation = root.animate(
      [{ height: `${startHeight}px` }, { height: `${endHeight}px` }],
      MODE_TRANSITION
    );
    responsiveHeightAnimationRef.current = heightAnimation;
    if (footerVisible) {
      const compactContentOffset = compactContentOffsetRef.current;
      const contentOffset = compactContentOffset === null ? 0 : compactContentOffset - currentContentOffset;
      if (Math.abs(contentOffset) >= 0.5) {
        const contentAnimation = content.animate(
          [
            { transform: `translateX(${contentOffset}px)` },
            { transform: "translateX(0)" }
          ],
          MODE_TRANSITION
        );
        responsiveContentAnimationRef.current = contentAnimation;
        contentAnimation.addEventListener(
          "finish",
          () => {
            if (responsiveContentAnimationRef.current === contentAnimation)
              responsiveContentAnimationRef.current = null;
          },
          { once: true }
        );
      }
    }
    const finishTransition = () => {
      if (responsiveHeightAnimationRef.current !== heightAnimation) return;
      responsiveHeightAnimationRef.current = null;
      if (responsiveAnimationCleanupTimerRef.current !== null) {
        window.clearTimeout(responsiveAnimationCleanupTimerRef.current);
        responsiveAnimationCleanupTimerRef.current = null;
      }
      root.style.removeProperty("overflow");
    };
    heightAnimation.addEventListener("finish", finishTransition, { once: true });
    responsiveAnimationCleanupTimerRef.current = window.setTimeout(() => {
      if (responsiveHeightAnimationRef.current === heightAnimation) {
        responsiveHeightAnimationRef.current = null;
        heightAnimation.cancel();
        root.style.removeProperty("overflow");
      }
      responsiveAnimationCleanupTimerRef.current = null;
    }, 200);
  }, [footerVisible, persistentFooter]);
  useEffect(
    () => () => {
      if (responsiveMeasurementFrameRef.current !== null)
        window.cancelAnimationFrame(responsiveMeasurementFrameRef.current);
      if (responsiveAnimationCleanupTimerRef.current !== null)
        window.clearTimeout(responsiveAnimationCleanupTimerRef.current);
      responsiveHeightAnimationRef.current?.cancel();
      responsiveContentAnimationRef.current?.cancel();
      responsiveHeightAnimationRef.current = null;
      responsiveContentAnimationRef.current = null;
      rootRef.current?.style.removeProperty("overflow");
    },
    []
  );
  const shouldExpandResponsiveFooter = useCallback(() => {
    const element2 = textareaRef.current;
    if (!element2) return false;
    const computedLineHeight = Number.parseFloat(
      window.getComputedStyle(element2).lineHeight
    );
    const singleLineHeight = Number.isFinite(computedLineHeight) ? computedLineHeight : 20;
    const contentHeight = Math.max(
      element2.scrollHeight,
      element2.getBoundingClientRect().height
    );
    const singleLineOverflow = element2.scrollWidth > element2.clientWidth + 0.5;
    return Boolean(element2.value.trim()) && (singleLineOverflow || contentHeight > singleLineHeight * 1.5);
  }, []);
  const cancelResponsiveFooterMeasurement = useCallback(() => {
    if (responsiveMeasurementFrameRef.current === null) return;
    window.cancelAnimationFrame(responsiveMeasurementFrameRef.current);
    responsiveMeasurementFrameRef.current = null;
  }, []);
  const scheduleResponsiveFooterMeasurement = useCallback(() => {
    if (responsiveMeasurementFrameRef.current !== null) return;
    responsiveMeasurementFrameRef.current = window.requestAnimationFrame(() => {
      responsiveMeasurementFrameRef.current = null;
      if (shouldExpandResponsiveFooter()) setResponsiveFooterLatched(true);
    });
  }, [shouldExpandResponsiveFooter]);
  useLayoutEffect(() => {
    if (persistentFooter) {
      cancelResponsiveFooterMeasurement();
      return;
    }
    if (!value.trim()) {
      cancelResponsiveFooterMeasurement();
      setResponsiveFooterLatched(false);
      return;
    }
    if (responsiveFooterLatched) {
      cancelResponsiveFooterMeasurement();
      return;
    }
    if (hasExplicitLineBreak) {
      cancelResponsiveFooterMeasurement();
      setResponsiveFooterLatched(true);
      return;
    }
    scheduleResponsiveFooterMeasurement();
  }, [
    cancelResponsiveFooterMeasurement,
    hasExplicitLineBreak,
    persistentFooter,
    responsiveFooterLatched,
    scheduleResponsiveFooterMeasurement,
    value
  ]);
  useLayoutEffect(() => {
    if (persistentFooter || typeof ResizeObserver === "undefined") return;
    const element2 = textareaRef.current;
    if (!element2) return;
    const handleResize = () => {
      if (responsiveFooterLatched) animateResponsiveHeightToNaturalSize();
      else scheduleResponsiveFooterMeasurement();
    };
    const resizeObserver = new ResizeObserver(handleResize);
    const mutationObserver = responsiveFooterLatched || typeof MutationObserver === "undefined" ? null : new MutationObserver(scheduleResponsiveFooterMeasurement);
    resizeObserver.observe(element2);
    mutationObserver?.observe(element2, {
      childList: true,
      characterData: true,
      subtree: true
    });
    return () => {
      resizeObserver.disconnect();
      mutationObserver?.disconnect();
    };
  }, [
    animateResponsiveHeightToNaturalSize,
    persistentFooter,
    responsiveFooterLatched,
    scheduleResponsiveFooterMeasurement
  ]);
  useEffect(() => {
    if (!autoFocus) return;
    const frame = requestAnimationFrame(() => textareaRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [autoFocus]);
  const insertMentionTrigger = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const nextValue = `${value.slice(0, start)}@${value.slice(end)}`;
    onChange(nextValue);
    window.requestAnimationFrame(() => {
      textarea.focus({ preventScroll: true });
      textarea.setSelectionRange(start + 1, start + 1);
    });
  }, [onChange, value]);
  const submit = /* @__PURE__ */ jsxs(
    "button",
    {
      type: "button",
      className: "bb-comments-submit-shortcut",
      disabled: submitPending || submitDisabled,
      "aria-label": "Submit comment",
      title: "Submit comment \xB7 \u2318/Ctrl Enter",
      onMouseDown: (event) => event.preventDefault(),
      onClick: () => {
        if (!submitPending) onSubmit(value);
      },
      children: [
        /* @__PURE__ */ jsx(Command2, { "aria-hidden": "true" }),
        /* @__PURE__ */ jsx(CornerDownLeft2, { "aria-hidden": "true" })
      ]
    }
  );
  const footer = /* @__PURE__ */ jsxs(
    "div",
    {
      className: "bb-comments-edit-footer",
      "data-mention-input-footer": "true",
      "data-mention-input-footer-state": "expanded",
      "data-persistent-footer": "true",
      children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            className: "bb-comments-context-control",
            "aria-label": "Mention context",
            disabled: submitPending,
            onMouseDown: (event) => event.preventDefault(),
            onClick: insertMentionTrigger,
            children: /* @__PURE__ */ jsx(AtSign, { "aria-hidden": "true" })
          }
        ),
        submit
      ]
    }
  );
  return /* @__PURE__ */ jsxs(
    "div",
    {
      ref: rootRef,
      className: "bb-comments-mention-input",
      "data-mention-input-expanded": footerVisible ? "true" : "false",
      "aria-busy": submitPending || void 0,
      children: [
        /* @__PURE__ */ jsxs("div", { className: "bb-comments-input-surface", "data-mention-input-surface": "true", children: [
          /* @__PURE__ */ jsx(
            "div",
            {
              className: "bb-comments-input-row",
              "data-mention-input-row": "true",
              "data-responsive-compact": responsiveCompact ? "true" : "false",
              children: /* @__PURE__ */ jsx(
                "div",
                {
                  ref: inputContentRef,
                  className: "bb-comments-input-content",
                  "data-mention-input-content": "true",
                  children: /* @__PURE__ */ jsx(
                    "textarea",
                    {
                      ref: textareaRef,
                      className: persistentFooter ? "bb-comments-edit-input" : "bb-comments-reply-input",
                      "aria-label": ariaLabel,
                      placeholder,
                      maxLength: 2e4,
                      readOnly: submitPending,
                      "aria-disabled": submitPending || void 0,
                      value,
                      onChange: (event) => onChange(event.currentTarget.value),
                      onKeyDown: (event) => {
                        if (event.key === "Escape" && onCancel && !submitPending) {
                          event.preventDefault();
                          onCancel();
                          return;
                        }
                        if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                          event.preventDefault();
                          if (!submitPending && !submitDisabled) onSubmit(value);
                        }
                      }
                    }
                  )
                }
              )
            }
          ),
          error ? /* @__PURE__ */ jsx("div", { className: "bb-comments-error", role: "status", children: error }) : null
        ] }),
        persistentFooter ? footerPortalTarget ? createPortal(footer, footerPortalTarget) : footer : /* @__PURE__ */ jsxs(Fragment2, { children: [
          /* @__PURE__ */ jsx(
            "div",
            {
              className: "bb-comments-responsive-footer",
              "aria-hidden": "true",
              "data-mention-input-footer": "true",
              "data-mention-input-footer-state": footerVisible ? "expanded" : "collapsed",
              children: /* @__PURE__ */ jsx(
                "div",
                {
                  className: "bb-comments-responsive-footer-divider",
                  "data-mention-input-footer-divider": "true"
                }
              )
            }
          ),
          /* @__PURE__ */ jsxs(
            "div",
            {
              className: "bb-comments-responsive-actions",
              "data-mention-input-responsive-actions": "true",
              children: [
                /* @__PURE__ */ jsxs("div", { className: "bb-comments-responsive-action-switcher", children: [
                  /* @__PURE__ */ jsx(
                    "div",
                    {
                      className: "bb-comments-compact-actions",
                      "aria-hidden": footerVisible,
                      inert: footerVisible || void 0,
                      "data-mention-input-compact-actions": "true",
                      children: /* @__PURE__ */ jsx(
                        "button",
                        {
                          type: "button",
                          className: "bb-comments-context-control",
                          "aria-label": "Add comment context",
                          disabled: submitPending,
                          onMouseDown: (event) => event.preventDefault(),
                          onClick: insertMentionTrigger,
                          children: /* @__PURE__ */ jsx(Plus, { "aria-hidden": "true" })
                        }
                      )
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    "div",
                    {
                      className: "bb-comments-expanded-actions",
                      "aria-hidden": !footerVisible,
                      inert: !footerVisible || void 0,
                      "data-mention-input-expanded-actions": "true",
                      children: /* @__PURE__ */ jsx(
                        "button",
                        {
                          type: "button",
                          className: "bb-comments-context-control",
                          "aria-label": "Mention context",
                          disabled: submitPending,
                          onMouseDown: (event) => event.preventDefault(),
                          onClick: insertMentionTrigger,
                          children: /* @__PURE__ */ jsx(AtSign, { "aria-hidden": "true" })
                        }
                      )
                    }
                  )
                ] }),
                /* @__PURE__ */ jsx(
                  "div",
                  {
                    className: "bb-comments-responsive-submit",
                    "data-mention-input-responsive-submit": "true",
                    children: submit
                  }
                )
              ]
            }
          )
        ] })
      ]
    }
  );
}
function CommentMessage({
  comment,
  isLast,
  isEditing,
  editFooterPortalTarget,
  submitPending,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete
}) {
  const rowRef = useRef(null);
  const editDraftKey = `bb.timeline-comments.edit:${comment.id}`;
  const [editText, setEditText] = useState(
    () => readDraft(editDraftKey) ?? comment.body
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const menuTriggerRef = useRef(null);
  const menuRef = useRef(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const runModeTransition = useMeasuredModeTransition(rowRef, isEditing);
  const wasEditingRef = useRef(isEditing);
  const cancelEdit = useCallback(() => {
    sessionStorage.removeItem(editDraftKey);
    setEditText(comment.body);
    onCancelEdit();
  }, [comment.body, editDraftKey, onCancelEdit]);
  useLayoutEffect(() => {
    if (wasEditingRef.current && !isEditing) {
      menuTriggerRef.current?.focus({ preventScroll: true });
    }
    wasEditingRef.current = isEditing;
  }, [isEditing]);
  useLayoutEffect(() => {
    const row = rowRef.current;
    if (!row || typeof row.animate !== "function" || reducedMotion()) return;
    row.animate(
      [
        { opacity: 0, transform: "translateY(-4px)" },
        { opacity: 1, transform: "translateY(0)" }
      ],
      MODE_TRANSITION
    );
  }, []);
  useEffect(
    () => setEditText(readDraft(editDraftKey) ?? comment.body),
    [comment.body, editDraftKey]
  );
  useLayoutEffect(() => {
    if (!menuOpen) return;
    const close = (event) => {
      if (event.target instanceof Node && (rowRef.current?.contains(event.target) || menuRef.current?.contains(event.target))) return;
      setMenuOpen(false);
    };
    const closeOnFocus = (event) => {
      if (event.target instanceof Node && (rowRef.current?.contains(event.target) || menuRef.current?.contains(event.target))) return;
      setMenuOpen(false);
    };
    const closeOnScroll = () => setMenuOpen(false);
    const closeOnEscape = (event) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      setMenuOpen(false);
      menuTriggerRef.current?.focus({ preventScroll: true });
    };
    document.addEventListener("pointerdown", close, true);
    document.addEventListener("focusin", closeOnFocus, true);
    document.addEventListener("keydown", closeOnEscape, true);
    window.addEventListener("scroll", closeOnScroll, true);
    return () => {
      document.removeEventListener("pointerdown", close, true);
      document.removeEventListener("focusin", closeOnFocus, true);
      document.removeEventListener("keydown", closeOnEscape, true);
      window.removeEventListener("scroll", closeOnScroll, true);
    };
  }, [menuOpen]);
  useLayoutEffect(() => {
    if (!menuOpen) return;
    const trigger = menuTriggerRef.current;
    const menu = menuRef.current;
    if (!trigger || !menu) return;
    const rect = trigger.getBoundingClientRect();
    const menuRect = menu.getBoundingClientRect();
    setMenuPosition({
      top: Math.min(window.innerHeight - menuRect.height - 8, rect.bottom + 4),
      left: Math.max(8, Math.min(window.innerWidth - menuRect.width - 8, rect.right - menuRect.width))
    });
    menu.querySelector('[role="menuitem"]')?.focus({
      preventScroll: true
    });
  }, [menuOpen]);
  const onMenuKeyDown = (event) => {
    const items = [...event.currentTarget.querySelectorAll('[role="menuitem"]')];
    if (items.length === 0) return;
    const current = Math.max(0, items.indexOf(document.activeElement));
    let next = null;
    if (event.key === "ArrowDown") next = (current + 1) % items.length;
    if (event.key === "ArrowUp") next = (current - 1 + items.length) % items.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = items.length - 1;
    if (event.key === "Escape") {
      event.preventDefault();
      setMenuOpen(false);
      menuTriggerRef.current?.focus({ preventScroll: true });
      return;
    }
    if (event.key === "Tab") {
      const moved = menuTriggerRef.current !== null && focusAdjacentToActionsTrigger(menuTriggerRef.current, event.shiftKey);
      if (moved) {
        event.preventDefault();
      }
      setMenuOpen(false);
      return;
    }
    if (next !== null) {
      event.preventDefault();
      items[next]?.focus({ preventScroll: true });
    }
  };
  const menuPortalTarget = rowRef.current?.closest(
    '[data-bb-plugin-decoration="timeline-comments"]'
  );
  return /* @__PURE__ */ jsxs(
    "article",
    {
      ref: rowRef,
      className: "bb-comments-comment comment-edit-surface",
      "data-bb-comment-id": comment.id,
      "data-comment-message": "true",
      "data-comment-editing": isEditing ? "true" : void 0,
      "data-editing": isEditing ? "true" : void 0,
      children: [
        /* @__PURE__ */ jsxs("header", { className: "bb-comments-message-header", "data-comment-message-header": "true", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("strong", { children: "Me" }),
            /* @__PURE__ */ jsx("time", { dateTime: new Date(comment.createdAt).toISOString(), title: absoluteTime(comment.createdAt), children: relativeTime(comment.createdAt) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "bb-comments-actions-menu", children: [
            isEditing ? /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                className: "bb-comments-icon-control bb-comments-edit-cancel",
                "aria-label": "Cancel comment edit",
                disabled: submitPending,
                onClick: () => runModeTransition(cancelEdit),
                children: /* @__PURE__ */ jsx(X2, { "aria-hidden": "true" })
              }
            ) : /* @__PURE__ */ jsx(
              "button",
              {
                ref: menuTriggerRef,
                type: "button",
                className: "bb-comments-icon-control",
                "aria-label": "Comment actions",
                "aria-haspopup": "menu",
                "aria-expanded": menuOpen,
                onClick: () => {
                  const trigger = menuTriggerRef.current;
                  if (!menuOpen && trigger && !actionsTriggerIsFullyVisible(trigger)) {
                    return;
                  }
                  flushSync(() => setMenuOpen((open) => !open));
                },
                children: /* @__PURE__ */ jsx(Ellipsis, { "aria-hidden": "true" })
              }
            ),
            menuOpen && menuPortalTarget ? createPortal(
              /* @__PURE__ */ jsxs(
                "div",
                {
                  ref: menuRef,
                  className: "bb-comments-actions-popover",
                  role: "menu",
                  style: { top: menuPosition.top, left: menuPosition.left },
                  onKeyDown: onMenuKeyDown,
                  children: [
                    /* @__PURE__ */ jsxs(
                      "button",
                      {
                        type: "button",
                        role: "menuitem",
                        onClick: () => {
                          setMenuOpen(false);
                          runModeTransition(onStartEdit);
                        },
                        children: [
                          /* @__PURE__ */ jsx(Pencil2, { "aria-hidden": "true" }),
                          " Edit"
                        ]
                      }
                    ),
                    /* @__PURE__ */ jsxs("button", { type: "button", role: "menuitem", className: "bb-comments-destructive", onClick: onDelete, children: [
                      /* @__PURE__ */ jsx(Trash22, { "aria-hidden": "true" }),
                      " Delete"
                    ] })
                  ]
                }
              ),
              menuPortalTarget
            ) : null
          ] })
        ] }),
        /* @__PURE__ */ jsx(
          "div",
          {
            className: "bb-comments-edit-composer",
            "data-comment-edit-composer": isEditing ? "true" : void 0,
            "data-comment-view-content": isEditing ? void 0 : "true",
            children: isEditing ? /* @__PURE__ */ jsx(
              CommentTextInput,
              {
                value: editText,
                onChange: (value) => {
                  setEditText(value);
                  if (value === comment.body) sessionStorage.removeItem(editDraftKey);
                  else writeDraft(editDraftKey, value);
                },
                onSubmit: (body) => runModeTransition(() => onSaveEdit(body)),
                placeholder: "Edit comment\u2026",
                ariaLabel: "Edit comment",
                persistentFooter: true,
                footerPortalTarget: isLast ? editFooterPortalTarget : null,
                autoFocus: true,
                onCancel: () => runModeTransition(cancelEdit),
                submitPending
              }
            ) : /* @__PURE__ */ jsx("p", { className: "bb-comments-comment-body", children: comment.body })
          }
        )
      ]
    }
  );
}
function MossCommentPopover({
  rpc,
  initialDetail,
  onClose,
  onChanged,
  onSendToAgent
}) {
  const [detail, setDetail] = useState(initialDetail);
  const [editingId, setEditingId] = useState(null);
  const replyDraftKey = `bb.timeline-comments.reply:${initialDetail.thread.id}`;
  const [replyText, setReplyText] = useState(
    () => readDraft(replyDraftKey) ?? ""
  );
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const replyRegionRef = useRef(null);
  const [editFooterHost, setEditFooterHost] = useState(null);
  const replyStartHeightRef = useRef(null);
  const replyAnimationRef = useRef(null);
  const lastCommentId = detail.comments.at(-1)?.id ?? null;
  const isEditingLast = editingId !== null && editingId === lastCommentId;
  const beginReplyRegionTransition = useCallback(() => {
    const region = replyRegionRef.current;
    if (!region) return;
    replyAnimationRef.current?.cancel();
    replyAnimationRef.current = null;
    region.style.removeProperty("height");
    region.style.removeProperty("overflow");
    replyStartHeightRef.current = region.getBoundingClientRect().height;
  }, []);
  useLayoutEffect(() => {
    const region = replyRegionRef.current;
    const startHeight = replyStartHeightRef.current;
    replyStartHeightRef.current = null;
    if (!region || startHeight === null || reducedMotion() || typeof region.animate !== "function") return;
    const endHeight = region.getBoundingClientRect().height;
    if (Math.abs(endHeight - startHeight) < 0.5) return;
    region.style.overflow = "hidden";
    const animation = region.animate(
      [{ height: `${startHeight}px` }, { height: `${endHeight}px` }],
      MODE_TRANSITION
    );
    replyAnimationRef.current = animation;
    animation.addEventListener(
      "finish",
      () => {
        if (replyAnimationRef.current !== animation) return;
        replyAnimationRef.current = null;
        region.style.removeProperty("overflow");
      },
      { once: true }
    );
  }, [isEditingLast]);
  const mutate = async (operation) => {
    if (busyRef.current) return null;
    busyRef.current = true;
    setBusy(true);
    setError(null);
    try {
      const fresh = await operation();
      setDetail(fresh);
      onChanged();
      return fresh;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong");
      return null;
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };
  const removeComment = async (comment) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError(null);
    try {
      const result = await rpc.call("deleteComment", {
        bbThreadId: detail.thread.bbThreadId,
        commentId: comment.id,
        expectedVersion: comment.version,
        expectedThreadVersion: detail.thread.version
      });
      if (result.thread === null) onClose();
      else setDetail(result.thread);
      onChanged();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong");
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };
  const startEdit = (comment) => {
    if (comment.id === lastCommentId) beginReplyRegionTransition();
    setEditingId(comment.id);
  };
  const finishEdit = () => {
    if (editingId === lastCommentId) beginReplyRegionTransition();
    setEditingId(null);
  };
  return /* @__PURE__ */ jsxs("div", { className: "bb-comments-thread-inner moss-comment-popover", children: [
    /* @__PURE__ */ jsxs("header", { className: "bb-comments-thread-header", "data-comment-thread-header": "true", children: [
      /* @__PURE__ */ jsxs("div", { className: "bb-comments-thread-source", children: [
        /* @__PURE__ */ jsx(MessageSquareText, { "aria-hidden": "true" }),
        /* @__PURE__ */ jsx("span", { children: "Comment" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bb-comments-header-actions", "data-comment-thread-actions": "true", children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            className: "bb-comments-icon-control",
            "aria-label": detail.thread.resolvedAt === null ? "Resolve thread" : "Reopen thread",
            "aria-pressed": detail.thread.resolvedAt !== null,
            disabled: busy,
            onClick: () => void mutate(
              () => rpc.call("setThreadResolved", {
                bbThreadId: detail.thread.bbThreadId,
                commentThreadId: detail.thread.id,
                expectedVersion: detail.thread.version,
                resolved: detail.thread.resolvedAt === null
              })
            ),
            children: /* @__PURE__ */ jsx(CheckCheck2, { "aria-hidden": "true" })
          }
        ),
        /* @__PURE__ */ jsx("button", { type: "button", className: "bb-comments-icon-control", "aria-label": "Send thread to agent", onClick: onSendToAgent, children: /* @__PURE__ */ jsx(Send, { "aria-hidden": "true" }) }),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            className: "bb-comments-icon-control bb-comments-destructive",
            "aria-label": "Delete thread",
            disabled: busy,
            onClick: () => {
              if (!window.confirm("Delete this comment thread?")) return;
              const rootComment = detail.comments.find((comment) => comment.parentId === null);
              if (!rootComment) return;
              void removeComment(rootComment);
            },
            children: /* @__PURE__ */ jsx(Trash22, { "aria-hidden": "true" })
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "bb-comments-thread-comments comment-thread-scroll", children: detail.comments.map((comment) => /* @__PURE__ */ jsx(
      CommentMessage,
      {
        comment,
        isLast: comment.id === lastCommentId,
        isEditing: editingId === comment.id,
        editFooterPortalTarget: editFooterHost,
        submitPending: busy,
        onStartEdit: () => startEdit(comment),
        onCancelEdit: finishEdit,
        onSaveEdit: (body) => {
          const nextBody = body.trim();
          if (commentBodyError(nextBody) !== null || nextBody === comment.body) {
            sessionStorage.removeItem(
              `bb.timeline-comments.edit:${comment.id}`
            );
            finishEdit();
            return;
          }
          void mutate(
            () => rpc.call("updateComment", {
              bbThreadId: detail.thread.bbThreadId,
              commentId: comment.id,
              expectedVersion: comment.version,
              body: nextBody
            })
          ).then((fresh) => {
            if (fresh) {
              sessionStorage.removeItem(
                `bb.timeline-comments.edit:${comment.id}`
              );
              finishEdit();
            }
          });
        },
        onDelete: () => {
          if (!window.confirm(comment.parentId === null ? "Delete this comment thread?" : "Delete this reply?")) return;
          void removeComment(comment);
        }
      },
      comment.id
    )) }),
    detail.thread.resolvedAt === null ? /* @__PURE__ */ jsx(
      "form",
      {
        ref: replyRegionRef,
        className: "bb-comments-reply comment-reply-region",
        "data-comment-reply-region": "true",
        "data-editing": editingId && !isEditingLast ? "true" : "false",
        "data-last-editing": isEditingLast ? "true" : "false",
        "aria-hidden": editingId && !isEditingLast ? true : void 0,
        inert: editingId && !isEditingLast ? true : void 0,
        onSubmit: (event) => event.preventDefault(),
        children: /* @__PURE__ */ jsxs("div", { className: "bb-comments-reply-inner comment-reply-region-inner", children: [
          /* @__PURE__ */ jsx(
            "div",
            {
              className: "bb-comments-inline-composer",
              "data-bb-comment-reply-composer": "true",
              "data-comment-reply-composer": "true",
              "aria-hidden": editingId ? true : void 0,
              inert: editingId ? true : void 0,
              children: /* @__PURE__ */ jsx(
                CommentTextInput,
                {
                  value: replyText,
                  onChange: (value) => {
                    setReplyText(value);
                    writeDraft(replyDraftKey, value);
                  },
                  onSubmit: (body) => {
                    const nextBody = body.trim();
                    if (commentBodyError(nextBody) !== null) return;
                    void mutate(
                      () => rpc.call("reply", {
                        bbThreadId: detail.thread.bbThreadId,
                        commentThreadId: detail.thread.id,
                        body: nextBody
                      })
                    ).then((fresh) => {
                      if (fresh) {
                        sessionStorage.removeItem(replyDraftKey);
                        setReplyText("");
                      }
                    });
                  },
                  placeholder: "Reply...",
                  ariaLabel: "Reply to comment thread",
                  submitPending: busy
                }
              )
            }
          ),
          /* @__PURE__ */ jsx(
            "div",
            {
              ref: setEditFooterHost,
              className: "bb-comments-edit-footer-host",
              "data-bb-comment-edit-footer-host": "true",
              "data-comment-edit-footer-host": "true"
            }
          )
        ] })
      }
    ) : null,
    error ? /* @__PURE__ */ jsx("div", { className: "bb-comments-error", role: "status", children: error }) : null
  ] });
}
function mountMossCommentPopover(host, options) {
  let root = createRoot(host);
  flushSync(() => {
    root?.render(/* @__PURE__ */ jsx(MossCommentPopover, { initialDetail: options.detail, ...options }));
  });
  return () => {
    root?.unmount();
    root = null;
  };
}
function MossNewCommentComposer({
  initialValue,
  onChange,
  onCancel,
  onSubmit
}) {
  const [value, setValue] = useState(initialValue);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [error, setError] = useState(null);
  return /* @__PURE__ */ jsxs("div", { className: "bb-comments-new-comment-input", "data-comment-new-composer": "true", children: [
    /* @__PURE__ */ jsx(
      CommentTextInput,
      {
        value,
        onChange: (next) => {
          setValue(next);
          onChange(next);
        },
        onCancel,
        onSubmit: (body) => {
          if (busyRef.current || commentBodyError(body) !== null) return;
          busyRef.current = true;
          setBusy(true);
          setError(null);
          void onSubmit(body).catch(
            (caught) => setError(
              caught instanceof Error ? caught.message : "Something went wrong"
            )
          ).finally(() => {
            busyRef.current = false;
            setBusy(false);
          });
        },
        placeholder: "Add a comment\u2026",
        ariaLabel: "Add a comment",
        autoFocus: true,
        submitPending: busy
      }
    ),
    error ? /* @__PURE__ */ jsx("div", { className: "bb-comments-error", role: "status", children: error }) : null
  ] });
}
function mountMossCommentComposer(host, options) {
  let root = createRoot(host);
  flushSync(() => {
    root?.render(/* @__PURE__ */ jsx(MossNewCommentComposer, { ...options }));
  });
  return () => {
    root?.unmount();
    root = null;
  };
}

// controller.ts
function contentScriptRpcClient(signal) {
  return {
    async call(method, input) {
      const response = await fetch(
        `/api/v1/plugins/timeline-comments/rpc/${String(method)}`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(input ?? null),
          signal
        }
      );
      const envelope = await response.json();
      if (!response.ok || !envelope.ok) {
        throw new Error(
          envelope.ok ? "Timeline comments request failed." : envelope.error?.message ?? "Timeline comments request failed."
        );
      }
      return envelope.result;
    }
  };
}
var OWNED = "data-bb-timeline-comments-owned";
var NORMAL_HIGHLIGHT = "bb-timeline-comments";
var ACTIVE_HIGHLIGHT = "bb-timeline-comments-active";
var DRAFT_TTL2 = 24 * 60 * 60 * 1e3;
var PLUGIN_DECORATION = "data-bb-plugin-decoration";
var MARKER_SIZE = 24;
var MARKER_TEXT_GAP = 8;
var COMPOSER_WIDTH = 216;
var POPOVER_WIDTH = 264;
var MESSAGE_PROSE_SELECTOR = "[data-sidebar-swipe-selectable], [data-no-sidebar-swipe]";
function readDraft2(key) {
  const saved = sessionStorage.getItem(key);
  if (saved === null) return null;
  try {
    const parsed = JSON.parse(saved);
    if (typeof parsed.body === "string" && typeof parsed.expiresAt === "number" && parsed.expiresAt > Date.now()) {
      return parsed.body;
    }
  } catch {
  }
  sessionStorage.removeItem(key);
  return null;
}
function writeDraft2(key, body) {
  if (body.trim() === "") {
    sessionStorage.removeItem(key);
    return;
  }
  sessionStorage.setItem(
    key,
    JSON.stringify({ body, expiresAt: Date.now() + DRAFT_TTL2 })
  );
}
function element(tag, className, text) {
  const node = document.createElement(tag);
  node.setAttribute(OWNED, "");
  if (className !== void 0) node.className = className;
  if (text !== void 0) node.textContent = text;
  return node;
}
function decorateRoot(node) {
  node.setAttribute(PLUGIN_DECORATION, "timeline-comments");
  return node;
}
function escapeSelector(value) {
  return globalThis.CSS?.escape?.(value) ?? value.replace(/[^a-zA-Z0-9_-]/gu, "\\$&");
}
function sourceExcerpt(text) {
  return text.length > 120 ? `${text.slice(0, 117)}\u2026` : text;
}
function formatTime(value) {
  return new Intl.DateTimeFormat(void 0, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(value);
}
function relativeTime2(value) {
  const elapsed = Math.max(0, Date.now() - value);
  if (elapsed < 6e4) return "just now";
  if (elapsed < 36e5) {
    const minutes = Math.floor(elapsed / 6e4);
    return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
  }
  if (elapsed < 864e5) {
    const hours = Math.floor(elapsed / 36e5);
    return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  }
  if (elapsed < 6048e5) {
    const days = Math.floor(elapsed / 864e5);
    return `${days} ${days === 1 ? "day" : "days"} ago`;
  }
  return new Intl.DateTimeFormat(void 0, {
    month: "short",
    day: "numeric"
  }).format(value);
}
function icon(node) {
  const svg = createElement$1(node);
  svg.setAttribute(OWNED, "");
  svg.setAttribute("width", "16");
  svg.setAttribute("height", "16");
  svg.setAttribute("stroke-width", "1.5");
  svg.setAttribute("aria-hidden", "true");
  return svg;
}
function errorMessage(error) {
  return error instanceof Error ? error.message : "Something went wrong";
}
function selectionTextMatches(rangeText, hostText) {
  const canonicalize = (value) => value.replace(/[\r\n\t]/g, "").trim();
  return canonicalize(rangeText) === canonicalize(hostText);
}
var inlineComposerAnimations = /* @__PURE__ */ new WeakMap();
var inlineComposerNaturalHeights = /* @__PURE__ */ new WeakMap();
var modeTransitionAnimations = /* @__PURE__ */ new WeakMap();
function runMeasuredModeTransition(element2, update) {
  const scrollRegion = element2.closest(
    ".bb-comments-thread-comments"
  );
  const scrollTop = scrollRegion?.scrollTop;
  const running = modeTransitionAnimations.get(element2);
  const startHeight = element2.getBoundingClientRect().height;
  running?.cancel();
  modeTransitionAnimations.delete(element2);
  element2.style.removeProperty("overflow");
  update();
  if (scrollRegion !== null && scrollTop !== void 0) {
    scrollRegion.scrollTop = scrollTop;
    requestAnimationFrame(() => {
      if (scrollRegion.isConnected) scrollRegion.scrollTop = scrollTop;
    });
  }
  const endHeight = element2.getBoundingClientRect().height;
  if (Math.abs(endHeight - startHeight) < 0.5 || typeof element2.animate !== "function" || matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }
  element2.style.overflow = "hidden";
  const animation = element2.animate(
    [{ height: `${startHeight}px` }, { height: `${endHeight}px` }],
    {
      duration: 150,
      easing: "cubic-bezier(0.22, 1, 0.36, 1)"
    }
  );
  modeTransitionAnimations.set(element2, animation);
  const finish = () => {
    if (modeTransitionAnimations.get(element2) !== animation) return;
    modeTransitionAnimations.delete(element2);
    element2.style.removeProperty("overflow");
  };
  animation.addEventListener("finish", finish, { once: true });
  animation.addEventListener("cancel", finish, { once: true });
}
function removeWithTransition(element2, remove) {
  if (typeof element2.animate !== "function" || matchMedia("(prefers-reduced-motion: reduce)").matches) {
    remove();
    return;
  }
  const height = element2.getBoundingClientRect().height;
  element2.style.overflow = "hidden";
  const animation = element2.animate(
    [
      { height: `${height}px`, opacity: 1 },
      { height: "0px", opacity: 0 }
    ],
    { duration: 150, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }
  );
  animation.addEventListener("finish", remove, { once: true });
  animation.addEventListener("cancel", remove, { once: true });
}
function animateInsertion(element2) {
  if (typeof element2.animate !== "function" || matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }
  element2.animate(
    [
      { opacity: 0, transform: "translateY(-4px)" },
      { opacity: 1, transform: "translateY(0)" }
    ],
    { duration: 150, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }
  );
}
function syncInlineComposerLayout(textarea, composer, animate = true) {
  const styles = getComputedStyle(textarea);
  const lineHeight = Number.parseFloat(styles.lineHeight) || 20;
  const verticalPadding = (Number.parseFloat(styles.paddingTop) || 0) + (Number.parseFloat(styles.paddingBottom) || 0);
  const currentMultiline = composer.dataset.multiline === "true";
  const hasText = textarea.value.trim() !== "";
  const requestsMultiline = textarea.value.includes("\n") || textarea.scrollHeight - verticalPadding > lineHeight + 1;
  const nextMultiline = hasText && (currentMultiline || requestsMultiline);
  const running = inlineComposerAnimations.get(composer);
  const startHeight = running === void 0 ? inlineComposerNaturalHeights.get(composer) ?? composer.getBoundingClientRect().height : composer.getBoundingClientRect().height;
  running?.cancel();
  inlineComposerAnimations.delete(composer);
  composer.style.removeProperty("overflow");
  composer.dataset.multiline = nextMultiline ? "true" : "false";
  const endHeight = composer.getBoundingClientRect().height;
  inlineComposerNaturalHeights.set(composer, endHeight);
  if (!animate || Math.abs(endHeight - startHeight) < 0.5 || typeof composer.animate !== "function" || matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }
  composer.style.overflow = "hidden";
  const animation = composer.animate(
    [{ height: `${startHeight}px` }, { height: `${endHeight}px` }],
    {
      duration: 150,
      easing: "cubic-bezier(0.22, 1, 0.36, 1)"
    }
  );
  inlineComposerAnimations.set(composer, animation);
  const finish = () => {
    if (inlineComposerAnimations.get(composer) !== animation) return;
    inlineComposerAnimations.delete(composer);
    composer.style.removeProperty("overflow");
  };
  animation.addEventListener("finish", finish, { once: true });
  animation.addEventListener("cancel", finish, { once: true });
}
function isRelevantMutation(record) {
  const selector = `[data-thread-window], [data-timeline-row-id], ${MESSAGE_PROSE_SELECTOR}`;
  return [...record.addedNodes, ...record.removedNodes].some(
    (node) => node instanceof Element && (node.matches(selector) || node.querySelector(selector) !== null)
  );
}
function isThreadWindowRendered(windowNode) {
  if (!windowNode.isConnected) return false;
  if (windowNode.closest('[aria-hidden="true"], [hidden], [inert]') !== null) {
    return false;
  }
  const checkVisibility = windowNode.checkVisibility;
  return checkVisibility?.call(windowNode, {
    contentVisibilityAuto: true,
    visibilityProperty: true
  }) ?? true;
}
var TimelineCommentsController = class {
  #rpc;
  #portal = decorateRoot(element("div", "bb-comments-portal"));
  #overlay = element("div", "bb-comments-overlay");
  #highlightStyle = element("style");
  #anchors = /* @__PURE__ */ new Map();
  #restored = /* @__PURE__ */ new Map();
  #threadWindows = /* @__PURE__ */ new Map();
  #threadWindowVisibility = /* @__PURE__ */ new Map();
  #disposers = [];
  #observer;
  #resizeObserver;
  #refreshNonce = 0;
  #refreshing = null;
  #refreshQueued = false;
  #frame = null;
  #popover = null;
  #threadUiCleanup = null;
  #composer = null;
  #composerUiCleanup = null;
  #composerThreadId = null;
  #composerWindow = null;
  #popoverThreadIds = /* @__PURE__ */ new Set();
  #popoverWindows = /* @__PURE__ */ new Set();
  #activeIds = /* @__PURE__ */ new Set();
  #provisionalRange = null;
  #openThreadId = null;
  #destroyed = false;
  #selectionSnapshot = null;
  #focusNonce = 0;
  #outsideComposer = null;
  #outsidePopover = null;
  #popoverKeydown = null;
  #popoverInvoker = null;
  #actionsMenu = null;
  #actionsTrigger = null;
  #outsideActionsMenu = null;
  constructor(context) {
    this.#rpc = contentScriptRpcClient(context.signal);
    this.#overlay.setAttribute("aria-live", "polite");
    this.#highlightStyle.textContent = `
      ::highlight(${NORMAL_HIGHLIGHT}) {
        text-decoration: underline;
        text-decoration-color: color-mix(in oklab, var(--foreground) 62%, transparent);
        text-decoration-thickness: 1px;
        text-underline-offset: 3px;
      }
      ::highlight(${ACTIVE_HIGHLIGHT}) {
        background: color-mix(in oklab, var(--primary) 12%, transparent);
        text-decoration: underline;
        text-decoration-color: var(--foreground);
        text-decoration-thickness: 2px;
        text-underline-offset: 3px;
      }
    `;
    this.#portal.append(this.#overlay);
    document.body.append(this.#highlightStyle, this.#portal);
    this.#observer = new MutationObserver((records) => {
      const visibilityChanged = this.reconcileThreadWindowVisibility();
      if (visibilityChanged) {
        this.syncAttachedUiVisibility();
        this.restoreAll();
      }
      if (visibilityChanged || records.some(isRelevantMutation)) {
        this.scheduleRefresh();
      }
    });
    this.#observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["aria-hidden", "class", "hidden", "inert", "style"]
    });
    this.#resizeObserver = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(() => this.scheduleLayout());
    const onViewportChange = () => this.scheduleLayout();
    document.addEventListener("scroll", onViewportChange, true);
    window.addEventListener("resize", onViewportChange);
    this.#disposers.push(
      () => document.removeEventListener("scroll", onViewportChange, true)
    );
    this.#disposers.push(
      () => window.removeEventListener("resize", onViewportChange)
    );
    const rememberSelection = () => {
      const captured = this.captureCurrentSelection();
      if (captured !== null) this.#selectionSnapshot = captured;
    };
    const refreshVisible = () => {
      if (document.visibilityState === "visible") this.scheduleRefresh();
    };
    document.addEventListener("selectionchange", rememberSelection);
    document.addEventListener("visibilitychange", refreshVisible);
    window.addEventListener("focus", refreshVisible);
    this.#disposers.push(
      () => document.removeEventListener("selectionchange", rememberSelection)
    );
    this.#disposers.push(
      () => document.removeEventListener("visibilitychange", refreshVisible)
    );
    this.#disposers.push(
      () => window.removeEventListener("focus", refreshVisible)
    );
    this.#disposers.push(installTimelineCommentsController(this));
    this.scheduleRefresh();
  }
  beginComment(context) {
    if (context.selectedText === void 0) return;
    const current = this.captureCurrentSelection();
    if (current !== null) this.#selectionSnapshot = current;
    const captured = current ?? this.#selectionSnapshot;
    if (captured === null || captured.bbThreadId !== null && captured.bbThreadId !== context.threadId || captured.messageId !== context.message.id || !selectionTextMatches(captured.selector.exact, context.selectedText)) {
      return;
    }
    this.rememberThreadWindow(context.threadId, captured.threadWindow);
    this.#selectionSnapshot = {
      ...captured,
      bbThreadId: context.threadId
    };
    this.closeComposer();
    const restored = captured.prose.isConnected ? restoreSelector(captured.prose, captured.selector) : null;
    this.#provisionalRange = restored?.range ?? captured.range.cloneRange();
    this.rebuildHighlights();
    const key = `bb.timeline-comments.draft:${context.threadId}:${context.message.id}:${captured.selector.start}:${captured.selector.end}`;
    const shell = element("form", "bb-comments-composer");
    shell.setAttribute("role", "dialog");
    shell.setAttribute("aria-label", "Add comment");
    const initialValue = readDraft2(key) ?? "";
    const firstRect = captured.rects[0];
    const x = firstRect?.x ?? window.innerWidth / 2;
    const y = captured.rects.at(-1)?.y ?? window.innerHeight / 2;
    shell.style.left = `${Math.max(8, Math.min(window.innerWidth - COMPOSER_WIDTH - 8, x))}px`;
    shell.style.top = `${Math.max(8, Math.min(window.innerHeight - 144, y + 17))}px`;
    let draftValue = initialValue;
    const persist = () => writeDraft2(key, draftValue);
    this.#composerUiCleanup = mountMossCommentComposer(shell, {
      initialValue,
      onChange: (value) => {
        draftValue = value;
        persist();
      },
      onCancel: () => {
        persist();
        this.closeComposer();
      },
      onSubmit: async (body) => {
        const detail = await this.#rpc.call("createThread", {
          bbThreadId: context.threadId,
          message: context.message,
          selector: {
            ...captured.selector,
            rects: captured.rects.map((rect) => ({ ...rect }))
          },
          body
        });
        sessionStorage.removeItem(key);
        this.closeComposer();
        this.#openThreadId = detail.thread.id;
        await this.refresh();
        await this.openThread(detailId(this.#openThreadId));
      }
    });
    this.#composer = shell;
    this.#composerThreadId = context.threadId;
    this.#composerWindow = captured.threadWindow;
    this.#portal.append(shell);
    this.#outsideComposer = (event) => {
      if (event.target instanceof Node && shell.contains(event.target)) return;
      persist();
      this.closeComposer();
    };
    document.addEventListener("pointerdown", this.#outsideComposer, true);
  }
  refreshAnchors() {
    this.scheduleRefresh();
  }
  registerThreadWindow(threadId, windowNode) {
    if (threadId === "" || !windowNode.matches("[data-thread-window]")) {
      return () => {
      };
    }
    this.rememberThreadWindow(threadId, windowNode);
    return () => {
      if (windowNode.isConnected) return;
      const windows = this.#threadWindows.get(threadId);
      windows?.delete(windowNode);
      if (windows?.size === 0) this.#threadWindows.delete(threadId);
      if (![...this.#threadWindows.values()].some(
        (registered) => registered.has(windowNode)
      )) {
        this.#threadWindowVisibility.delete(windowNode);
      }
      this.scheduleRefresh();
    };
  }
  rememberThreadWindow(threadId, windowNode) {
    let changed = false;
    for (const [otherThreadId, windows2] of this.#threadWindows) {
      if (otherThreadId === threadId || !windows2.delete(windowNode)) continue;
      changed = true;
      if (windows2.size === 0) this.#threadWindows.delete(otherThreadId);
    }
    const windows = this.#threadWindows.get(threadId) ?? /* @__PURE__ */ new Set();
    const size = windows.size;
    windows.add(windowNode);
    this.#threadWindows.set(threadId, windows);
    this.#threadWindowVisibility.set(
      windowNode,
      isThreadWindowRendered(windowNode)
    );
    if (changed || windows.size !== size) this.scheduleRefresh();
  }
  threadIdForWindow(windowNode) {
    for (const [threadId, windows] of this.#threadWindows) {
      if (windows.has(windowNode)) return threadId;
    }
    return null;
  }
  reconcileThreadWindowVisibility() {
    let changed = false;
    for (const windows of this.#threadWindows.values()) {
      for (const windowNode of windows) {
        const rendered = isThreadWindowRendered(windowNode);
        const previous = this.#threadWindowVisibility.get(windowNode);
        this.#threadWindowVisibility.set(windowNode, rendered);
        if (previous !== void 0 && previous !== rendered) changed = true;
      }
    }
    return changed;
  }
  syncAttachedUiVisibility() {
    const visibleThreadIds = new Set(
      [...this.#threadWindows.keys()].filter(
        (threadId) => this.findWindow(threadId) !== null
      )
    );
    if (this.#composerWindow !== null && !isThreadWindowRendered(this.#composerWindow) || this.#composerWindow === null && this.#composerThreadId !== null && !visibleThreadIds.has(this.#composerThreadId)) {
      this.closeComposer();
    }
    if (this.#popoverWindows.size > 0 && [...this.#popoverWindows].some(
      (windowNode) => !isThreadWindowRendered(windowNode)
    ) || this.#popoverWindows.size === 0 && this.#popoverThreadIds.size > 0 && [...this.#popoverThreadIds].some(
      (threadId) => !visibleThreadIds.has(threadId)
    )) {
      this.closePopover(true, false);
    }
  }
  captureCurrentSelection() {
    const selection = document.getSelection();
    if (selection === null || selection.rangeCount !== 1 || selection.isCollapsed)
      return null;
    const range = selection.getRangeAt(0).cloneRange();
    const startElement = range.startContainer instanceof Element ? range.startContainer : range.startContainer.parentElement;
    const prose = startElement?.closest(
      MESSAGE_PROSE_SELECTOR
    );
    if (prose === void 0 || prose === null || !prose.contains(range.endContainer))
      return null;
    const message = prose.closest("[data-timeline-row-id]");
    const threadWindow = prose.closest("[data-thread-window]");
    const messageId = message?.dataset.timelineRowId;
    const selector = selectorForRange(prose, range);
    if (messageId === void 0 || threadWindow === null || selector === null)
      return null;
    const rects = [...range.getClientRects()].map(({ x, y, width, height }) => ({
      x,
      y,
      width,
      height
    }));
    if (rects.length === 0) return null;
    return {
      bbThreadId: this.threadIdForWindow(threadWindow),
      messageId,
      prose,
      range,
      rects,
      selector,
      threadWindow
    };
  }
  async focusThread(anchor) {
    const request = ++this.#focusNonce;
    this.#openThreadId = anchor.id;
    await this.refresh();
    if (request !== this.#focusNonce || this.#destroyed) return false;
    if (!this.#restored.has(anchor.id)) {
      this.#anchors.set(anchor.id, anchor);
      this.restoreAll();
    }
    const restored = this.#restored.get(anchor.id);
    if (restored === void 0 || !isThreadWindowRendered(restored.window)) {
      return false;
    }
    restored.prose.scrollIntoView({
      block: "center",
      behavior: "smooth"
    });
    this.setActive([anchor.id]);
    await new Promise(
      (resolve) => requestAnimationFrame(() => resolve())
    );
    if (request !== this.#focusNonce || this.#destroyed) return false;
    this.scheduleLayout();
    restored.marker?.focus({ preventScroll: true });
    await this.openThread(anchor.id, anchor);
    return true;
  }
  scheduleRefresh() {
    this.#refreshNonce += 1;
    if (this.#refreshQueued || this.#refreshing !== null) return;
    this.#refreshQueued = true;
    queueMicrotask(() => {
      this.#refreshQueued = false;
      void this.refresh().catch((error) => {
        if (!this.#destroyed)
          console.error("timeline-comments refresh failed", error);
      });
    });
  }
  async refresh() {
    if (this.#destroyed) return;
    if (this.#refreshing !== null) {
      return this.#refreshing;
    }
    this.#refreshing = (async () => {
      let nonce;
      do {
        nonce = this.#refreshNonce;
        await this.loadAnchors();
      } while (nonce !== this.#refreshNonce && !this.#destroyed);
    })();
    try {
      await this.#refreshing;
    } finally {
      this.#refreshing = null;
    }
  }
  async loadAnchors() {
    this.syncAttachedUiVisibility();
    const threadIds = [...this.#threadWindows.keys()].filter((threadId) => this.findWindow(threadId) !== null).slice(0, 20);
    this.#anchors.clear();
    if (threadIds.length > 0) {
      let cursor;
      do {
        const page = await this.#rpc.call("listOpenAnchors", {
          threadIds,
          ...cursor !== void 0 ? { cursor } : {}
        });
        if (this.#destroyed) return;
        for (const anchor of page.anchors)
          this.#anchors.set(anchor.id, anchor);
        cursor = page.nextCursor ?? void 0;
      } while (cursor !== void 0 && !this.#destroyed);
    }
    if (this.#destroyed) return;
    this.restoreAll();
  }
  findWindow(threadId) {
    const windows = this.#threadWindows.get(threadId);
    if (windows === void 0) return null;
    for (const windowNode of windows) {
      if (!windowNode.isConnected) {
        windows.delete(windowNode);
        if (![...this.#threadWindows.values()].some(
          (registered) => registered.has(windowNode)
        )) {
          this.#threadWindowVisibility.delete(windowNode);
        }
        continue;
      }
      if (isThreadWindowRendered(windowNode)) return windowNode;
    }
    if (windows.size === 0) this.#threadWindows.delete(threadId);
    return null;
  }
  findProse(threadId, messageId, selector) {
    const windowNode = this.findWindow(threadId);
    const row = windowNode?.querySelector(
      `[data-timeline-row-id="${escapeSelector(messageId)}"]`
    );
    if (row === void 0 || row === null) return null;
    for (const candidate of row.querySelectorAll(
      MESSAGE_PROSE_SELECTOR
    )) {
      if (candidate.matches("button, input, textarea, select, a")) continue;
      if (restoreSelector(candidate, selector) !== null) return candidate;
    }
    return null;
  }
  restoreAll() {
    this.#restored.clear();
    this.#overlay.replaceChildren();
    this.#resizeObserver?.disconnect();
    const health = /* @__PURE__ */ new Map();
    for (const anchor of this.#anchors.values()) {
      const windowNode = this.findWindow(anchor.bbThreadId);
      const prose = this.findProse(
        anchor.bbThreadId,
        anchor.messageId,
        anchor.selector
      );
      if (windowNode === null || prose === null) {
        health.set(anchor.id, "not-mounted");
        continue;
      }
      const restored = restoreSelector(prose, anchor.selector);
      if (restored === null) {
        health.set(anchor.id, "unanchored");
        continue;
      }
      health.set(anchor.id, "anchored");
      this.#resizeObserver?.observe(windowNode);
      this.#resizeObserver?.observe(prose);
      const fragments = [...restored.range.getClientRects()].filter(
        (rect) => rect.width > 0 || rect.height > 0
      );
      const fallback = restored.range.getBoundingClientRect();
      const rects = fragments.length > 0 ? fragments : [fallback];
      const proseRect = prose.getBoundingClientRect();
      const side = chooseAvailableGutter(
        rects,
        proseRect,
        windowNode.getBoundingClientRect(),
        MARKER_SIZE + MARKER_TEXT_GAP
      );
      const desiredY = rects.reduce((sum, rect) => sum + rect.top + rect.height / 2, 0) / rects.length;
      this.#restored.set(anchor.id, {
        anchor,
        range: restored.range,
        marker: null,
        side,
        desiredY,
        window: windowNode,
        prose
      });
    }
    publishTimelineCommentAnchorHealth(health);
    this.rebuildHighlights();
    this.layoutMarkers();
  }
  rebuildHighlights() {
    const registry = globalThis.CSS?.highlights;
    const HighlightClass = globalThis.Highlight;
    if (registry === void 0 || HighlightClass === void 0) return;
    const normal = new HighlightClass();
    const active = new HighlightClass();
    for (const [id, restored] of this.#restored) {
      const paintRange = typeof globalThis.StaticRange === "undefined" ? restored.range : new StaticRange({
        startContainer: restored.range.startContainer,
        startOffset: restored.range.startOffset,
        endContainer: restored.range.endContainer,
        endOffset: restored.range.endOffset
      });
      normal.add(paintRange);
      if (this.#activeIds.has(id)) active.add(paintRange);
    }
    if (this.#provisionalRange !== null) {
      const range = this.#provisionalRange;
      active.add(
        typeof globalThis.StaticRange === "undefined" ? range : new StaticRange({
          startContainer: range.startContainer,
          startOffset: range.startOffset,
          endContainer: range.endContainer,
          endOffset: range.endOffset
        })
      );
    }
    registry.set(NORMAL_HIGHLIGHT, normal);
    registry.set(ACTIVE_HIGHLIGHT, active);
  }
  scheduleLayout() {
    if (this.#frame !== null) return;
    this.#frame = requestAnimationFrame(() => {
      this.#frame = null;
      this.layoutMarkers();
      this.positionPopover();
      this.positionActionsMenu();
    });
  }
  layoutMarkers() {
    this.#overlay.replaceChildren();
    for (const restored of this.#restored.values()) {
      const rects = [...restored.range.getClientRects()];
      const bounding = restored.range.getBoundingClientRect();
      const fragments = rects.length > 0 ? rects : [bounding];
      restored.desiredY = fragments.reduce((sum, rect) => sum + rect.top + rect.height / 2, 0) / fragments.length;
      const proseRect = restored.prose.getBoundingClientRect();
      restored.side = chooseAvailableGutter(
        fragments,
        proseRect,
        restored.window.getBoundingClientRect(),
        MARKER_SIZE + MARKER_TEXT_GAP
      );
      restored.marker = null;
    }
    const groups = /* @__PURE__ */ new Map();
    for (const restored of this.#restored.values()) {
      if (restored.side === null) continue;
      const key = `${restored.anchor.bbThreadId}:${restored.side}`;
      const list = groups.get(key) ?? [];
      list.push(restored);
      groups.set(key, list);
    }
    for (const list of groups.values()) {
      const windowRect = list[0].window.getBoundingClientRect();
      const top = Math.max(8, windowRect.top);
      const bottom = Math.min(window.innerHeight - 8, windowRect.bottom);
      for (const placement of layoutGutterMarkers(
        list.map(({ anchor, desiredY }) => ({ id: anchor.id, desiredY })),
        top,
        bottom,
        MARKER_SIZE
      )) {
        const threads = placement.ids.map((id) => this.#restored.get(id)).filter(Boolean);
        const side = threads[0]?.side;
        if (side === null || side === void 0) continue;
        const marker = element(
          "button",
          "bb-comments-marker"
        );
        marker.type = "button";
        marker.dataset.bbCommentGutter = side;
        marker.style.top = `${placement.y}px`;
        const proseRects = threads.map(
          ({ prose }) => prose.getBoundingClientRect()
        );
        const gutterX = side === "left" ? Math.min(...proseRects.map(({ left }) => left)) - MARKER_SIZE - MARKER_TEXT_GAP : Math.max(...proseRects.map(({ right }) => right)) + MARKER_TEXT_GAP;
        marker.style.left = `${Math.max(
          8,
          Math.min(window.innerWidth - MARKER_SIZE - 8, gutterX)
        )}px`;
        marker.setAttribute(
          "aria-label",
          threads.length === 1 ? `Open comment thread${threads[0].anchor.replyCount > 0 ? ` with ${threads[0].anchor.replyCount} ${threads[0].anchor.replyCount === 1 ? "reply" : "replies"}` : ""}` : `Open ${threads.length} comment threads`
        );
        marker.append(icon(StickyNote));
        if (threads.length > 1) {
          marker.classList.add("bb-comments-marker-cluster");
          marker.append(
            element(
              "span",
              "bb-comments-marker-count",
              String(threads.length)
            )
          );
        }
        marker.addEventListener(
          "mouseenter",
          () => this.setActive(placement.ids)
        );
        marker.addEventListener("mouseleave", () => this.setActive([]));
        marker.addEventListener("focus", () => this.setActive(placement.ids));
        marker.addEventListener("blur", () => this.setActive([]));
        marker.addEventListener("click", () => {
          if (threads.length === 1) void this.openThread(threads[0].anchor.id);
          else this.openCluster(marker, threads);
        });
        this.#overlay.append(marker);
        for (const thread of threads) thread.marker = marker;
      }
    }
    if (this.#openThreadId !== null && this.#restored.get(this.#openThreadId)?.marker === null) {
      this.closePopover();
    }
  }
  setActive(ids) {
    this.#activeIds = new Set(ids);
    this.rebuildHighlights();
  }
  openCluster(marker, threads) {
    this.closePopover();
    const menu = element("div", "bb-comments-popover bb-comments-cluster");
    menu.setAttribute("role", "dialog");
    menu.setAttribute("aria-label", "Comment threads");
    let first = null;
    for (const thread of threads) {
      const button = element(
        "button",
        "bb-comments-cluster-row"
      );
      button.type = "button";
      button.textContent = sourceExcerpt(thread.anchor.selector.exact);
      button.addEventListener(
        "click",
        () => void this.openThread(thread.anchor.id)
      );
      first ??= button;
      menu.append(button);
    }
    this.#popover = menu;
    this.#popoverThreadIds = new Set(
      threads.map(({ anchor }) => anchor.bbThreadId)
    );
    this.#popoverWindows = new Set(threads.map(({ window: window2 }) => window2));
    this.#portal.append(menu);
    this.installPopoverDismissal(marker);
    this.positionNear(marker, menu);
    first?.focus({ preventScroll: true });
  }
  async openThread(commentThreadId, fallbackAnchor) {
    const anchor = this.#anchors.get(commentThreadId) ?? this.#restored.get(commentThreadId)?.anchor ?? fallbackAnchor;
    if (anchor === void 0) return;
    const restored = this.#restored.get(commentThreadId);
    const parentWindow = restored?.window ?? this.findWindow(anchor.bbThreadId);
    if (parentWindow === null || !isThreadWindowRendered(parentWindow)) return;
    this.#openThreadId = commentThreadId;
    this.closePopover(false);
    this.setActive([commentThreadId]);
    const popover = element(
      "section",
      "bb-comments-popover bb-comments-thread"
    );
    popover.setAttribute("role", "dialog");
    popover.setAttribute("aria-label", "Comment thread");
    popover.tabIndex = -1;
    popover.append(element("div", "bb-comments-loading", "Loading\u2026"));
    this.#popover = popover;
    this.#popoverThreadIds = /* @__PURE__ */ new Set([anchor.bbThreadId]);
    const restoredWindow = restored?.window ?? parentWindow;
    this.#popoverWindows = restoredWindow === void 0 ? /* @__PURE__ */ new Set() : /* @__PURE__ */ new Set([restoredWindow]);
    this.#portal.append(popover);
    this.installPopoverDismissal(
      this.#restored.get(commentThreadId)?.marker ?? null
    );
    this.positionPopover();
    popover.focus({ preventScroll: true });
    try {
      const detail = await this.loadThread(anchor.bbThreadId, commentThreadId);
      if (this.#popover !== popover) return;
      this.renderThreadPopover(popover, detail);
      this.positionPopover();
    } catch (caught) {
      popover.replaceChildren(
        element("div", "bb-comments-error", errorMessage(caught))
      );
    }
  }
  async loadThread(bbThreadId, commentThreadId) {
    let cursor;
    let detail = null;
    do {
      const page = await this.#rpc.call("getCommentThread", {
        bbThreadId,
        commentThreadId,
        ...cursor !== void 0 ? { cursor } : {}
      });
      detail = detail === null ? page : { ...page, comments: [...detail.comments, ...page.comments] };
      cursor = page.nextCursor ?? void 0;
    } while (cursor !== void 0);
    return detail;
  }
  renderThreadPopover(popover, detail) {
    this.#threadUiCleanup?.();
    this.#threadUiCleanup = null;
    this.closeActionsMenu();
    delete popover.dataset.editing;
    popover.replaceChildren();
    this.#threadUiCleanup = mountMossCommentPopover(popover, {
      rpc: this.#rpc,
      detail,
      onClose: () => this.closePopover(),
      onChanged: () => this.scheduleRefresh(),
      onSendToAgent: () => {
        void requestTimelineCommentHandoff(detail.thread.bbThreadId).then(
          (accepted) => {
            if (accepted && this.#popover === popover) {
              this.closePopover(true, false);
            }
          }
        );
      }
    });
  }
  renderLegacyThreadPopover(popover, detail) {
    this.closeActionsMenu();
    delete popover.dataset.editing;
    popover.replaceChildren();
    const header = element("header", "bb-comments-thread-header");
    const source = element("div", "bb-comments-thread-source");
    source.append(icon(StickyNote), document.createTextNode("Comment"));
    const headerActions = element("div", "bb-comments-header-actions");
    const resolve = element(
      "button",
      "bb-comments-icon-control"
    );
    resolve.type = "button";
    resolve.setAttribute(
      "aria-label",
      detail.thread.resolvedAt === null ? "Resolve thread" : "Reopen thread"
    );
    resolve.title = detail.thread.resolvedAt === null ? "Resolve thread" : "Reopen thread";
    resolve.setAttribute(
      "aria-pressed",
      String(detail.thread.resolvedAt !== null)
    );
    resolve.append(icon(CheckCheck));
    resolve.addEventListener("click", () => {
      resolve.disabled = true;
      void this.#rpc.call("setThreadResolved", {
        bbThreadId: detail.thread.bbThreadId,
        commentThreadId: detail.thread.id,
        expectedVersion: detail.thread.version,
        resolved: detail.thread.resolvedAt === null
      }).then(() => {
        this.closePopover();
        this.scheduleRefresh();
      }).catch((caught) => {
        resolve.disabled = false;
        this.handlePopoverMutationError(popover, detail, caught);
      });
    });
    const removeThread = element(
      "button",
      "bb-comments-icon-control bb-comments-destructive"
    );
    removeThread.type = "button";
    removeThread.setAttribute("aria-label", "Delete thread");
    removeThread.title = "Delete thread";
    removeThread.append(icon(Trash2));
    removeThread.addEventListener("click", () => {
      if (!window.confirm("Delete this comment thread?")) return;
      const root = detail.comments.find(({ parentId }) => parentId === null);
      if (root === void 0) return;
      removeThread.disabled = true;
      void this.#rpc.call("deleteComment", {
        bbThreadId: detail.thread.bbThreadId,
        commentId: root.id,
        expectedVersion: root.version,
        expectedThreadVersion: detail.thread.version
      }).then(() => {
        this.closePopover();
        this.scheduleRefresh();
      }).catch((caught) => {
        removeThread.disabled = false;
        this.handlePopoverMutationError(popover, detail, caught);
      });
    });
    headerActions.append(resolve, removeThread);
    header.append(source, headerActions);
    popover.append(header);
    const comments = element("div", "bb-comments-thread-comments");
    for (const comment of detail.comments)
      comments.append(this.renderComment(detail, comment, popover));
    popover.append(comments);
    if (detail.thread.resolvedAt === null) {
      const reply = element("form", "bb-comments-reply");
      reply.dataset.editing = "false";
      reply.dataset.lastEditing = "false";
      const replyInner = element("div", "bb-comments-reply-inner");
      const replyComposer = element("div", "bb-comments-inline-composer");
      replyComposer.dataset.bbCommentReplyComposer = "true";
      const editFooterHost = element(
        "div",
        "bb-comments-edit-footer-host"
      );
      editFooterHost.dataset.bbCommentEditFooterHost = "true";
      const draftKey = `bb.timeline-comments.reply:${detail.thread.id}`;
      const textarea = element(
        "textarea",
        "bb-comments-reply-input"
      );
      textarea.placeholder = "Reply...";
      textarea.maxLength = 2e4;
      textarea.value = readDraft2(draftKey) ?? "";
      const send = element(
        "button",
        "bb-comments-submit-shortcut"
      );
      send.type = "submit";
      send.setAttribute("aria-label", "Reply");
      send.title = "Reply \xB7 \u2318/Ctrl Enter";
      send.append(icon(Command), icon(CornerDownLeft));
      const error = element("div", "bb-comments-error");
      error.setAttribute("role", "status");
      const validate = () => {
        const message = commentBodyError(textarea.value);
        send.disabled = message !== null;
        error.textContent = message !== null && textarea.value.trim() !== "" ? message : "";
        return message;
      };
      textarea.addEventListener("input", () => {
        writeDraft2(draftKey, textarea.value);
        syncInlineComposerLayout(textarea, replyComposer);
        validate();
      });
      textarea.addEventListener("keydown", (event) => {
        if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
          event.preventDefault();
          reply.requestSubmit();
        }
      });
      replyComposer.append(textarea, send);
      replyInner.append(replyComposer, error, editFooterHost);
      reply.append(replyInner);
      reply.addEventListener("submit", (event) => {
        event.preventDefault();
        if (validate() !== null) return;
        send.disabled = true;
        void this.#rpc.call("reply", {
          bbThreadId: detail.thread.bbThreadId,
          commentThreadId: detail.thread.id,
          body: textarea.value
        }).then((result) => {
          if (this.#popover !== popover) return;
          const fresh = result;
          const knownIds = new Set(detail.comments.map(({ id }) => id));
          Object.assign(detail.thread, fresh.thread);
          detail.comments.splice(0, detail.comments.length, ...fresh.comments);
          sessionStorage.removeItem(draftKey);
          textarea.value = "";
          syncInlineComposerLayout(textarea, replyComposer);
          validate();
          for (const freshComment of fresh.comments) {
            if (knownIds.has(freshComment.id)) continue;
            const freshRow = this.renderComment(detail, freshComment, popover);
            comments.append(freshRow);
            animateInsertion(freshRow);
          }
          this.scheduleRefresh();
        }).catch((caught) => {
          send.disabled = false;
          this.handlePopoverMutationError(popover, detail, caught);
        });
      });
      validate();
      popover.append(reply);
      syncInlineComposerLayout(textarea, replyComposer, false);
    }
  }
  renderComment(detail, comment, popover) {
    const row = element("article", "bb-comments-comment");
    row.dataset.bbCommentId = comment.id;
    let currentComment = comment;
    const buildHeader = (action) => {
      const header = element("header", "bb-comments-message-header");
      const byline = element("div");
      byline.append(element("strong", void 0, "Me"));
      const timestamp = element(
        "time",
        void 0,
        relativeTime2(currentComment.createdAt)
      );
      timestamp.dateTime = new Date(currentComment.createdAt).toISOString();
      timestamp.title = formatTime(currentComment.createdAt);
      byline.append(timestamp);
      header.append(byline, action);
      return header;
    };
    const body = element("p", "bb-comments-comment-body", currentComment.body);
    const actions = element("div", "bb-comments-actions-menu");
    const actionsTrigger = element(
      "button",
      "bb-comments-icon-control"
    );
    actionsTrigger.type = "button";
    actionsTrigger.setAttribute("aria-label", "Comment actions");
    actionsTrigger.setAttribute("aria-haspopup", "menu");
    actionsTrigger.setAttribute("aria-expanded", "false");
    actionsTrigger.title = "Comment actions";
    actionsTrigger.append(icon(EllipsisVertical));
    const cancel = element(
      "button",
      "bb-comments-icon-control bb-comments-edit-cancel"
    );
    cancel.type = "button";
    cancel.setAttribute("aria-label", "Cancel comment edit");
    cancel.title = "Cancel edit";
    cancel.append(icon(X));
    const actionsMenu = element("div", "bb-comments-actions-popover");
    actionsMenu.setAttribute("role", "menu");
    const menuItems = () => [...actionsMenu.querySelectorAll('[role="menuitem"]')].filter((item) => !item.disabled);
    actionsMenu.addEventListener("keydown", (event) => {
      const items = menuItems();
      const current = items.indexOf(document.activeElement);
      let next;
      if (event.key === "ArrowDown")
        next = items[(current + 1 + items.length) % items.length];
      if (event.key === "ArrowUp")
        next = items[(current - 1 + items.length) % items.length];
      if (event.key === "Home") next = items[0];
      if (event.key === "End") next = items.at(-1);
      if (next !== void 0) {
        event.preventDefault();
        next.focus({ preventScroll: true });
        return;
      }
      if (event.key !== "Tab") return;
      event.preventDefault();
      this.focusAdjacentToActionsTrigger(actionsTrigger, event.shiftKey);
      this.closeActionsMenu();
    });
    actionsMenu.addEventListener("focusout", () => {
      queueMicrotask(() => {
        if (this.#actionsMenu === actionsMenu && !actionsMenu.contains(document.activeElement)) {
          this.closeActionsMenu();
        }
      });
    });
    actionsTrigger.addEventListener("click", () => {
      if (this.#actionsTrigger === actionsTrigger) {
        this.closeActionsMenu();
        return;
      }
      this.openActionsMenu(actionsTrigger, actionsMenu);
    });
    const edit = element("button");
    edit.type = "button";
    edit.tabIndex = -1;
    edit.setAttribute("role", "menuitem");
    edit.append(icon(Pencil), document.createTextNode("Edit"));
    const draftKey = `bb.timeline-comments.edit:${comment.id}`;
    const textarea = element(
      "textarea",
      "bb-comments-edit-input"
    );
    textarea.setAttribute("aria-label", "Edit comment");
    textarea.maxLength = 2e4;
    const editComposer = element("div", "bb-comments-edit-composer");
    const localFooterHost = element(
      "div",
      "bb-comments-local-edit-footer-host"
    );
    const editFooter = element("div", "bb-comments-edit-footer");
    const save = element(
      "button",
      "bb-comments-edit-submit"
    );
    save.type = "button";
    save.append(icon(Command), icon(CornerDownLeft));
    save.setAttribute("aria-label", "Save comment");
    save.title = "Save comment \xB7 \u2318/Ctrl Enter";
    editFooter.append(save);
    localFooterHost.append(editFooter);
    const error = element("div", "bb-comments-error");
    error.setAttribute("role", "status");
    editComposer.append(textarea, error, localFooterHost);
    const validate = () => {
      const message = commentBodyError(textarea.value);
      save.disabled = message !== null;
      error.textContent = message !== null && textarea.value.trim() !== "" ? message : "";
      return message;
    };
    const resetReplyRegion = () => {
      const reply = popover.querySelector(".bb-comments-reply");
      if (reply === null) return;
      reply.dataset.editing = "false";
      reply.dataset.lastEditing = "false";
      reply.removeAttribute("aria-hidden");
      reply.removeAttribute("inert");
      const replyComposer = reply.querySelector(
        "[data-bb-comment-reply-composer]"
      );
      replyComposer?.removeAttribute("aria-hidden");
      replyComposer?.removeAttribute("inert");
      localFooterHost.append(editFooter);
    };
    const finishEdit = (focusTrigger) => {
      runMeasuredModeTransition(row, () => {
        delete popover.dataset.editing;
        delete row.dataset.editing;
        resetReplyRegion();
      });
      if (focusTrigger) actionsTrigger.focus({ preventScroll: true });
    };
    const cancelEdit = () => {
      sessionStorage.removeItem(draftKey);
      finishEdit(true);
    };
    cancel.addEventListener("click", cancelEdit);
    textarea.addEventListener("input", () => {
      if (textarea.value === currentComment.body)
        sessionStorage.removeItem(draftKey);
      else writeDraft2(draftKey, textarea.value);
      validate();
    });
    textarea.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        cancelEdit();
      }
      if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        save.click();
      }
    });
    save.addEventListener("click", () => {
      if (validate() !== null) return;
      const nextBody = textarea.value.trim();
      if (nextBody === currentComment.body) {
        cancelEdit();
        return;
      }
      save.disabled = true;
      void this.#rpc.call("updateComment", {
        bbThreadId: detail.thread.bbThreadId,
        commentId: currentComment.id,
        expectedVersion: currentComment.version,
        body: nextBody
      }).then((result) => {
        if (this.#popover !== popover) return;
        const fresh = result;
        const updated = fresh.comments.find(({ id }) => id === currentComment.id);
        if (updated !== void 0) currentComment = updated;
        Object.assign(detail.thread, fresh.thread);
        body.textContent = currentComment.body;
        sessionStorage.removeItem(draftKey);
        finishEdit(false);
        this.scheduleRefresh();
      }).catch((caught) => {
        save.disabled = false;
        this.handlePopoverMutationError(popover, detail, caught);
      });
    });
    edit.addEventListener("click", () => {
      if (popover.dataset.editing !== void 0) return;
      this.closeActionsMenu();
      textarea.value = readDraft2(draftKey) ?? currentComment.body;
      const isLastComment = detail.comments.at(-1)?.id === currentComment.id;
      const reply = popover.querySelector(".bb-comments-reply");
      runMeasuredModeTransition(row, () => {
        popover.dataset.editing = currentComment.id;
        row.dataset.editing = "true";
        if (reply !== null) {
          if (isLastComment) {
            reply.dataset.lastEditing = "true";
            const replyComposer = reply.querySelector(
              "[data-bb-comment-reply-composer]"
            );
            replyComposer?.setAttribute("aria-hidden", "true");
            replyComposer?.setAttribute("inert", "");
            reply.querySelector("[data-bb-comment-edit-footer-host]")?.append(editFooter);
          } else {
            reply.dataset.editing = "true";
            reply.setAttribute("aria-hidden", "true");
            reply.setAttribute("inert", "");
          }
        }
      });
      validate();
      textarea.focus({ preventScroll: true });
    });
    const remove = element(
      "button",
      "bb-comments-destructive"
    );
    remove.type = "button";
    remove.tabIndex = -1;
    remove.setAttribute("role", "menuitem");
    remove.append(icon(Trash2), document.createTextNode("Delete"));
    remove.addEventListener("click", () => {
      if (!window.confirm(
        currentComment.parentId === null ? "Delete this comment thread?" : "Delete this reply?"
      ))
        return;
      remove.disabled = true;
      void this.#rpc.call("deleteComment", {
        bbThreadId: detail.thread.bbThreadId,
        commentId: currentComment.id,
        expectedVersion: currentComment.version,
        expectedThreadVersion: detail.thread.version
      }).then((result) => {
        if (result.deletedThreadId !== null) {
          this.closePopover();
        } else if (result.thread !== null) {
          Object.assign(detail.thread, result.thread.thread);
          detail.comments.splice(
            0,
            detail.comments.length,
            ...result.thread.comments
          );
          removeWithTransition(row, () => row.remove());
        }
        this.scheduleRefresh();
      }).catch((caught) => {
        remove.disabled = false;
        this.handlePopoverMutationError(popover, detail, caught);
      });
    });
    actionsMenu.append(edit, remove);
    actions.append(actionsTrigger, cancel);
    row.append(buildHeader(actions), body, editComposer);
    return row;
  }
  focusAdjacentToActionsTrigger(trigger, backwards) {
    const popover = trigger.closest(".bb-comments-thread");
    if (popover === null) {
      trigger.focus({ preventScroll: true });
      return;
    }
    const focusable = [
      ...popover.querySelectorAll(
        'button:not(:disabled), textarea:not(:disabled), input:not(:disabled), [href], [tabindex]:not([tabindex="-1"])'
      )
    ].filter((node) => node.getClientRects().length > 0);
    const current = focusable.indexOf(trigger);
    const adjacent = focusable[current + (backwards ? -1 : 1)] ?? trigger;
    adjacent.focus({ preventScroll: true });
  }
  openActionsMenu(trigger, menu) {
    this.closeActionsMenu();
    this.#actionsMenu = menu;
    this.#actionsTrigger = trigger;
    trigger.setAttribute("aria-expanded", "true");
    this.#portal.append(menu);
    this.positionActionsMenu();
    if (this.#actionsMenu !== menu) return;
    this.#outsideActionsMenu = (event) => {
      if (event.target instanceof Node && (menu.contains(event.target) || trigger.contains(event.target))) {
        return;
      }
      this.closeActionsMenu();
    };
    document.addEventListener("pointerdown", this.#outsideActionsMenu, true);
    menu.querySelector("button")?.focus({
      preventScroll: true
    });
  }
  positionActionsMenu() {
    const menu = this.#actionsMenu;
    const trigger = this.#actionsTrigger;
    if (menu === null || trigger === null) return;
    if (!trigger.isConnected) {
      this.closeActionsMenu();
      return;
    }
    const triggerRect = trigger.getBoundingClientRect();
    const scrollViewport = trigger.closest(
      ".bb-comments-thread-comments"
    );
    if (scrollViewport !== null) {
      const viewportRect = scrollViewport.getBoundingClientRect();
      if (triggerRect.top < viewportRect.top || triggerRect.bottom > viewportRect.bottom) {
        this.closeActionsMenu();
        return;
      }
    }
    const menuRect = menu.getBoundingClientRect();
    const gap = 4;
    const maxLeft = Math.max(8, window.innerWidth - menuRect.width - 8);
    const left = Math.max(
      8,
      Math.min(
        maxLeft,
        triggerRect.right - menuRect.width
      )
    );
    const below = triggerRect.bottom + gap;
    const candidateTop = below + menuRect.height <= window.innerHeight - 8 ? below : triggerRect.top - menuRect.height - gap;
    const maxTop = Math.max(8, window.innerHeight - menuRect.height - 8);
    const top = Math.max(8, Math.min(maxTop, candidateTop));
    menu.style.left = `${left}px`;
    menu.style.top = `${top}px`;
  }
  closeActionsMenu(restoreFocus = false) {
    const trigger = this.#actionsTrigger;
    if (this.#outsideActionsMenu !== null) {
      document.removeEventListener(
        "pointerdown",
        this.#outsideActionsMenu,
        true
      );
      this.#outsideActionsMenu = null;
    }
    this.#actionsMenu?.remove();
    this.#actionsMenu = null;
    this.#actionsTrigger = null;
    trigger?.setAttribute("aria-expanded", "false");
    if (restoreFocus && trigger?.isConnected === true)
      trigger.focus({ preventScroll: true });
  }
  showPopoverError(popover, error) {
    const existing = popover.querySelector(".bb-comments-error");
    const node = existing ?? element("div", "bb-comments-error");
    node.textContent = errorMessage(error);
    if (existing === null) popover.append(node);
  }
  handlePopoverMutationError(popover, detail, error) {
    this.showPopoverError(popover, error);
    if (!/changed/iu.test(errorMessage(error))) return;
    void this.loadThread(detail.thread.bbThreadId, detail.thread.id).then(
      (fresh) => {
        if (this.#popover !== popover) return;
        this.renderThreadPopover(popover, fresh);
        this.showPopoverError(popover, error);
      }
    );
  }
  installPopoverDismissal(invoker) {
    this.removePopoverDismissal();
    this.#popoverInvoker = invoker;
    this.#outsidePopover = (event) => {
      if (event.target instanceof Node && (this.#popover?.contains(event.target) === true || this.#popoverInvoker?.contains(event.target) === true || this.#actionsMenu?.contains(event.target) === true || this.#portal.querySelector(".bb-comments-actions-popover")?.contains(event.target) === true)) {
        return;
      }
      this.closePopover();
    };
    this.#popoverKeydown = (event) => {
      if (event.key !== "Escape") return;
      const componentMenu = this.#portal.querySelector(
        ".bb-comments-actions-popover"
      );
      if (componentMenu !== null) {
        event.preventDefault();
        event.stopPropagation();
        this.#popover?.querySelector(
          'button[aria-label="Comment actions"][aria-expanded="true"]'
        )?.click();
        return;
      }
      if (this.#actionsMenu !== null) {
        event.preventDefault();
        this.closeActionsMenu(true);
        return;
      }
      const cancelEdit = this.#popover?.querySelector(
        'button[aria-label="Cancel comment edit"]'
      );
      if (this.#popover?.querySelector('[data-comment-editing="true"]') !== null && cancelEdit != null) {
        event.preventDefault();
        event.stopPropagation();
        cancelEdit.click();
        return;
      }
      event.preventDefault();
      this.closePopover();
    };
    document.addEventListener("pointerdown", this.#outsidePopover, true);
    document.addEventListener("keydown", this.#popoverKeydown, true);
  }
  removePopoverDismissal() {
    if (this.#outsidePopover !== null) {
      document.removeEventListener("pointerdown", this.#outsidePopover, true);
      this.#outsidePopover = null;
    }
    if (this.#popoverKeydown !== null) {
      document.removeEventListener("keydown", this.#popoverKeydown, true);
      this.#popoverKeydown = null;
    }
  }
  positionPopover() {
    if (this.#popover === null || this.#openThreadId === null) return;
    const marker = this.#restored.get(this.#openThreadId)?.marker;
    if (marker !== null && marker !== void 0)
      this.positionNear(marker, this.#popover);
  }
  positionNear(anchor, popover) {
    const rect = anchor.getBoundingClientRect();
    const width = Math.min(POPOVER_WIDTH, window.innerWidth - 16);
    popover.style.width = `${width}px`;
    const leftOption = rect.left - width - 8;
    const rightOption = rect.right + 8;
    const fitsLeft = leftOption >= 8;
    const fitsRight = rightOption + width <= window.innerWidth - 8;
    const gutter = anchor.dataset.bbCommentGutter;
    const left = gutter === "left" && fitsLeft ? leftOption : gutter === "right" && fitsRight ? rightOption : fitsRight ? rightOption : leftOption;
    popover.style.left = `${Math.max(8, Math.min(window.innerWidth - width - 8, left))}px`;
    const height = Math.min(
      popover.getBoundingClientRect().height || 300,
      window.innerHeight - 16
    );
    popover.style.top = `${Math.max(8, Math.min(window.innerHeight - height - 8, rect.top - 8))}px`;
  }
  closeComposer() {
    if (this.#outsideComposer !== null) {
      document.removeEventListener("pointerdown", this.#outsideComposer, true);
      this.#outsideComposer = null;
    }
    this.#composerUiCleanup?.();
    this.#composerUiCleanup = null;
    this.#composer?.remove();
    this.#composer = null;
    this.#composerThreadId = null;
    this.#composerWindow = null;
    this.#provisionalRange = null;
    this.rebuildHighlights();
  }
  closePopover(clearOpen = true, restoreFocus = true) {
    const invoker = this.#popoverInvoker;
    const currentMarker = this.#openThreadId === null ? null : this.#restored.get(this.#openThreadId)?.marker ?? null;
    const focusTarget = invoker?.isConnected === true ? invoker : currentMarker;
    this.closeActionsMenu();
    this.removePopoverDismissal();
    this.#threadUiCleanup?.();
    this.#threadUiCleanup = null;
    this.#popoverInvoker = null;
    this.#popover?.remove();
    this.#popover = null;
    this.#popoverThreadIds.clear();
    this.#popoverWindows.clear();
    if (clearOpen) this.#openThreadId = null;
    this.setActive([]);
    if (restoreFocus && clearOpen && focusTarget?.isConnected === true) {
      focusTarget.focus({ preventScroll: true });
    }
  }
  destroy() {
    if (this.#destroyed) return;
    this.#destroyed = true;
    this.#focusNonce += 1;
    this.#observer.disconnect();
    this.#resizeObserver?.disconnect();
    if (this.#frame !== null) cancelAnimationFrame(this.#frame);
    for (const dispose of this.#disposers.splice(0).reverse()) dispose();
    this.closeComposer();
    this.closePopover();
    this.#portal.remove();
    this.#highlightStyle.remove();
    publishTimelineCommentAnchorHealth(/* @__PURE__ */ new Map());
    globalThis.CSS?.highlights?.delete(NORMAL_HIGHLIGHT);
    globalThis.CSS?.highlights?.delete(ACTIVE_HIGHLIGHT);
  }
};
function detailId(id) {
  if (id === null) throw new Error("Comment thread was not created");
  return id;
}
function mountTimelineCommentsController(context) {
  const controller = new TimelineCommentsController(context);
  return () => controller.destroy();
}

// app.tsx
function errorMessage2(error) {
  return error instanceof Error ? error.message : "Something went wrong";
}
function excerpt(value, length) {
  return value.length > length ? `${value.slice(0, length - 1)}\u2026` : value;
}
function threadWindowForNode(node) {
  return node?.closest("[data-thread-window]") ?? document.querySelector(
    '[data-split-pane-id][data-focused="true"] [data-thread-window]'
  ) ?? (document.querySelectorAll("[data-thread-window]").length === 1 ? document.querySelector("[data-thread-window]") : null);
}
function TimelineCommentHandoffBridge() {
  const rpc = useRpc();
  const composer = useComposer();
  const composerRef = useRef(composer);
  const root = useRef(null);
  const requestGeneration = useRef(0);
  const requestPending = useRef(false);
  const threadId = composer.scope.kind === "thread" ? composer.scope.threadId : null;
  useLayoutEffect(() => {
    composerRef.current = composer;
  }, [composer]);
  useLayoutEffect(() => {
    if (threadId === null) return;
    const generation = ++requestGeneration.current;
    let mounted = true;
    const threadWindow = threadWindowForNode(root.current);
    if (threadWindow === null) return;
    const unregisterWindow = registerTimelineCommentThreadWindow(
      threadId,
      threadWindow
    );
    const unregisterHandoff = subscribeTimelineCommentHandoff({
      threadId,
      getThreadWindow: () => threadWindow,
      accept: async () => {
        if (requestPending.current) return false;
        requestPending.current = true;
        try {
          const summary = await rpc.call("getThreadHandoffSummary", {
            bbThreadId: threadId
          });
          if (!mounted || generation !== requestGeneration.current || summary.threadCount === 0) {
            return false;
          }
          composerRef.current.insertMention({
            provider: "thread-comments",
            id: threadId,
            label: `${summary.commentCount} ${summary.commentCount === 1 ? "comment" : "comments"} from ${summary.threadCount} open ${summary.threadCount === 1 ? "thread" : "threads"}`
          });
          composerRef.current.focus();
          return true;
        } catch {
          return false;
        } finally {
          if (generation === requestGeneration.current) {
            requestPending.current = false;
          }
        }
      }
    });
    return () => {
      mounted = false;
      requestGeneration.current += 1;
      requestPending.current = false;
      unregisterHandoff();
      unregisterWindow();
    };
  }, [rpc, threadId]);
  return /* @__PURE__ */ jsx("span", { ref: root, hidden: true, "aria-hidden": "true" });
}
function AddCommentsAction() {
  const rpc = useRpc();
  const composer = useComposer();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const requestGeneration = useRef(0);
  const threadId = composer.scope.kind === "thread" ? composer.scope.threadId : null;
  const currentThreadId = useRef(threadId);
  useLayoutEffect(() => {
    currentThreadId.current = threadId;
    requestGeneration.current += 1;
    setBusy(false);
    setError(null);
    setNotice(null);
    return () => {
      currentThreadId.current = null;
      requestGeneration.current += 1;
    };
  }, [threadId]);
  useRealtime("comments-changed", (payload) => {
    if (typeof payload === "object" && payload !== null && payload.bbThreadId === threadId) {
      setNotice(null);
      refreshTimelineCommentAnchors();
    }
  });
  const addComments = useCallback(async () => {
    if (threadId === null) return;
    const generation = ++requestGeneration.current;
    const isCurrentRequest = () => generation === requestGeneration.current && currentThreadId.current === threadId;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const summary = await rpc.call("getThreadHandoffSummary", {
        bbThreadId: threadId
      });
      if (!isCurrentRequest()) return;
      if (summary.threadCount === 0) {
        setNotice("No open comments");
        return;
      }
      composer.insertMention({
        provider: "thread-comments",
        id: threadId,
        label: `${summary.commentCount} ${summary.commentCount === 1 ? "comment" : "comments"} from ${summary.threadCount} open ${summary.threadCount === 1 ? "thread" : "threads"}`
      });
      composer.focus();
    } catch (caught) {
      if (isCurrentRequest()) setError(errorMessage2(caught));
    } finally {
      if (isCurrentRequest()) setBusy(false);
    }
  }, [composer, rpc, threadId]);
  if (threadId === null) return null;
  return /* @__PURE__ */ jsxs("span", { className: "bb-comments-composer-action-wrap", children: [
    error !== null ? /* @__PURE__ */ jsx("span", { className: "bb-comments-composer-action-error", role: "alert", children: "Couldn\u2019t add comments" }) : null,
    notice !== null ? /* @__PURE__ */ jsx("span", { className: "bb-comments-composer-action-status", role: "status", children: notice }) : null,
    /* @__PURE__ */ jsx(
      "button",
      {
        type: "button",
        className: "bb-comments-composer-action",
        "aria-label": error === null ? "Add comments to chat" : "Retry adding comments to chat",
        title: error === null ? "Add comments to chat" : `Retry adding comments to chat: ${error}`,
        disabled: busy,
        onMouseDown: (event) => event.preventDefault(),
        onClick: () => void addComments(),
        children: /* @__PURE__ */ jsx("span", { className: "bb-comments-composer-action-icon", children: /* @__PURE__ */ jsx(
          HugeiconsIcon,
          {
            icon: ChatFeedback01Icon,
            "aria-hidden": "true",
            "data-icon": "ChatFeedback"
          }
        ) })
      }
    )
  ] });
}
function CommentPanel({ threadId }) {
  const rpc = useRpc();
  const connection = useRealtimeConnectionState();
  const anchorHealth = useSyncExternalStore(
    subscribeTimelineCommentAnchorHealth,
    getTimelineCommentAnchorHealth,
    getTimelineCommentAnchorHealth
  );
  const previousConnection = useRef(connection);
  const revealRequest = useRef(0);
  const loadGeneration = useRef(0);
  const [filter, setFilter] = useState("open");
  const loadScope = useRef({ filter, threadId });
  const [threads, setThreads] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [unanchored, setUnanchored] = useState(/* @__PURE__ */ new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useLayoutEffect(() => {
    loadScope.current = { filter, threadId };
    loadGeneration.current += 1;
    return () => {
      loadGeneration.current += 1;
    };
  }, [filter, threadId]);
  const loadThreads = useCallback(
    async (append = false) => {
      if (loadScope.current.threadId !== threadId || loadScope.current.filter !== filter)
        return;
      const generation = ++loadGeneration.current;
      const cursor = append ? nextCursor : null;
      const isCurrentLoad = () => generation === loadGeneration.current && loadScope.current.threadId === threadId && loadScope.current.filter === filter;
      setLoading(true);
      setError(null);
      if (!append) {
        setThreads([]);
        setNextCursor(null);
      }
      try {
        const page = await rpc.call("listCommentThreads", {
          bbThreadId: threadId,
          filter,
          ...cursor !== null ? { cursor } : {}
        });
        if (!isCurrentLoad()) return;
        setThreads(
          (current) => append ? [...current, ...page.threads] : page.threads
        );
        setNextCursor(page.nextCursor);
      } catch (caught) {
        if (!isCurrentLoad()) return;
        setError(errorMessage2(caught));
      } finally {
        if (isCurrentLoad()) setLoading(false);
      }
    },
    [filter, nextCursor, rpc, threadId]
  );
  const reconcile = useCallback(async () => {
    await loadThreads(false);
  }, [loadThreads]);
  useEffect(() => {
    setActiveId(null);
    void loadThreads(false);
  }, [filter, threadId]);
  useEffect(
    () => () => {
      revealRequest.current += 1;
    },
    [threadId]
  );
  useRealtime("comments-changed", (payload) => {
    if (typeof payload === "object" && payload !== null && payload.bbThreadId === threadId) {
      void reconcile();
    }
  });
  useEffect(() => {
    const previous = previousConnection.current;
    previousConnection.current = connection;
    if (connection === "connected" && previous === "reconnecting")
      void reconcile();
  }, [connection, reconcile]);
  const activate = async (item) => {
    const request = ++revealRequest.current;
    setActiveId(item.id);
    setError(null);
    try {
      const anchored = await focusTimelineComment(item);
      if (request !== revealRequest.current) return;
      setUnanchored((current) => {
        const next = new Set(current);
        if (anchored) next.delete(item.id);
        else next.add(item.id);
        return next;
      });
    } catch (caught) {
      if (request === revealRequest.current) setError(errorMessage2(caught));
    }
  };
  return /* @__PURE__ */ jsxs("section", { className: "bb-comments-panel", "aria-label": "Timeline comments", children: [
    /* @__PURE__ */ jsx(
      "div",
      {
        className: "bb-comments-filters",
        role: "group",
        "aria-label": "Comment state",
        children: ["open", "resolved", "all"].map((value) => /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            "aria-pressed": filter === value,
            onClick: () => setFilter(value),
            children: value[0].toUpperCase() + value.slice(1)
          },
          value
        ))
      }
    ),
    error !== null ? /* @__PURE__ */ jsx("div", { className: "bb-comments-panel-error", role: "status", children: error }) : null,
    /* @__PURE__ */ jsxs("div", { className: "bb-comments-panel-list", children: [
      !loading && threads.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "bb-comments-empty", children: [
        "No ",
        filter === "all" ? "" : `${filter} `,
        "comments."
      ] }) : null,
      threads.map((item) => {
        return /* @__PURE__ */ jsx(
          "article",
          {
            className: "bb-comments-panel-row",
            "data-active": activeId === item.id ? "true" : void 0,
            children: /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                className: "bb-comments-row-summary",
                onClick: () => void activate(item),
                children: [
                  /* @__PURE__ */ jsxs("span", { className: "bb-comments-row-source", children: [
                    "\u201C",
                    excerpt(item.selector.exact, 90),
                    "\u201D"
                  ] }),
                  /* @__PURE__ */ jsx("span", { className: "bb-comments-row-body", children: excerpt(item.rootComment.body, 140) }),
                  /* @__PURE__ */ jsxs("span", { className: "bb-comments-row-meta", children: [
                    item.replyCount,
                    " ",
                    item.replyCount === 1 ? "reply" : "replies",
                    item.resolvedAt !== null ? " \xB7 Resolved" : "",
                    unanchored.has(item.id) || anchorHealth.get(item.id) === "unanchored" ? " \xB7 Unanchored" : ""
                  ] })
                ]
              }
            )
          },
          item.id
        );
      }),
      loading ? /* @__PURE__ */ jsx("div", { className: "bb-comments-loading", children: "Loading\u2026" }) : null,
      !loading && nextCursor !== null ? /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          className: "bb-comments-load-more",
          onClick: () => void loadThreads(true),
          children: "Load more"
        }
      ) : null
    ] })
  ] });
}
var app_default = definePluginApp((app) => {
  app.contentScripts.register({
    id: "timeline-comment-anchors",
    mount: mountTimelineCommentsController
  });
  app.composer.customize({
    id: "timeline-comments",
    scopes: ["thread"],
    actions: [{ id: "add-comments", component: AddCommentsAction }],
    banners: [
      {
        id: "comment-handoff-bridge",
        chrome: "bare",
        component: TimelineCommentHandoffBridge
      }
    ]
  });
  app.slots.threadPanelAction({
    id: "comments",
    title: "Comments",
    icon: "ChatFeedback",
    component: CommentPanel,
    layout: "flush"
  });
  app.slots.messageAction({
    id: "comment-selection",
    title: "Comment",
    icon: "ChatFeedback",
    run(context) {
      if (context.selectedText === void 0) {
        context.openPanel({ actionId: "comments", title: "Comments" });
      } else {
        beginTimelineComment(context);
      }
    }
  });
});
export {
  app_default as default
};
/*! Bundled license information:

lucide/dist/esm/createElement.js:
lucide/dist/esm/defaultAttributes.js:
lucide/dist/esm/icons/check-check.js:
lucide/dist/esm/icons/command.js:
lucide/dist/esm/icons/corner-down-left.js:
lucide/dist/esm/icons/ellipsis-vertical.js:
lucide/dist/esm/icons/pencil.js:
lucide/dist/esm/icons/sticky-note.js:
lucide/dist/esm/icons/trash-2.js:
lucide/dist/esm/icons/x.js:
lucide/dist/esm/lucide.js:
  (**
   * @license lucide v0.474.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/shared/src/utils.js:
lucide-react/dist/esm/defaultAttributes.js:
lucide-react/dist/esm/Icon.js:
lucide-react/dist/esm/createLucideIcon.js:
lucide-react/dist/esm/icons/at-sign.js:
lucide-react/dist/esm/icons/check-check.js:
lucide-react/dist/esm/icons/command.js:
lucide-react/dist/esm/icons/corner-down-left.js:
lucide-react/dist/esm/icons/ellipsis.js:
lucide-react/dist/esm/icons/message-square-text.js:
lucide-react/dist/esm/icons/pencil.js:
lucide-react/dist/esm/icons/plus.js:
lucide-react/dist/esm/icons/send.js:
lucide-react/dist/esm/icons/trash-2.js:
lucide-react/dist/esm/icons/x.js:
lucide-react/dist/esm/lucide-react.js:
  (**
   * @license lucide-react v0.474.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)
*/
