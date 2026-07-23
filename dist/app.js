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

// ../../node_modules/lucide-react/dist/esm/shared/src/utils.js
var toKebabCase = (string) => string.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
var mergeClasses = (...classes) => classes.filter((className, index, array) => {
  return Boolean(className) && className.trim() !== "" && array.indexOf(className) === index;
}).join(" ").trim();

// ../../node_modules/lucide-react/dist/esm/defaultAttributes.js
var defaultAttributes = {
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
        ...defaultAttributes,
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

// ../../node_modules/lucide-react/dist/esm/icons/message-square-text.js
var __iconNode = [
  ["path", { d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z", key: "1lielz" }],
  ["path", { d: "M13 8H7", key: "14i4kc" }],
  ["path", { d: "M17 12H7", key: "16if0g" }]
];
var MessageSquareText = createLucideIcon("MessageSquareText", __iconNode);

// bb-plugin-runtime-shim:@bb/plugin-sdk/app
var runtime2 = globalThis.__bbPluginRuntime;
if (runtime2 == null || runtime2.pluginSdkApp == null) {
  throw new Error('Cannot load "@bb/plugin-sdk/app": this bundle must be loaded by the BB app, which provides the shared plugin runtime (globalThis.__bbPluginRuntime).');
}
var mod2 = runtime2.pluginSdkApp;
var {
  definePluginApp,
  experimental_Markdown,
  experimental_ThreadChat,
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
async function focusTimelineComment(commentThreadId) {
  return await activeController?.focusThread(commentThreadId) ?? false;
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

// anchors.ts
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

// controller.ts
var OWNED = "data-bb-timeline-comments-owned";
var NORMAL_HIGHLIGHT = "bb-timeline-comments";
var ACTIVE_HIGHLIGHT = "bb-timeline-comments-active";
var DRAFT_TTL = 24 * 60 * 60 * 1e3;
var PLUGIN_DECORATION = "data-bb-plugin-decoration";
var MARKER_SIZE = 32;
var MARKER_TEXT_GAP = 8;
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
var inlineComposerAnimations = /* @__PURE__ */ new WeakMap();
var inlineComposerNaturalHeights = /* @__PURE__ */ new WeakMap();
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
  const selector = "[data-bb-thread-window], [data-bb-conversation-message-id], [data-bb-message-prose-root]";
  return [...record.addedNodes, ...record.removedNodes].some(
    (node) => node instanceof Element && (node.matches(selector) || node.querySelector(selector) !== null)
  );
}
var TimelineCommentsController = class {
  #rpc;
  #navigate;
  #portal = decorateRoot(element("div", "bb-comments-portal"));
  #overlay = element("div", "bb-comments-overlay");
  #highlightStyle = element("style");
  #anchors = /* @__PURE__ */ new Map();
  #restored = /* @__PURE__ */ new Map();
  #disposers = [];
  #observer;
  #resizeObserver;
  #refreshNonce = 0;
  #refreshing = null;
  #frame = null;
  #popover = null;
  #composer = null;
  #activeIds = /* @__PURE__ */ new Set();
  #provisionalRange = null;
  #openThreadId = null;
  #destroyed = false;
  #sawConnected = false;
  #focusNonce = 0;
  #outsideComposer = null;
  #outsidePopover = null;
  #popoverKeydown = null;
  #popoverInvoker = null;
  #actionsMenu = null;
  #actionsTrigger = null;
  #outsideActionsMenu = null;
  constructor(context) {
    this.#rpc = context.rpc;
    this.#navigate = context.navigate;
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
      if (records.some(isRelevantMutation)) this.scheduleRefresh();
    });
    this.#observer.observe(document.body, { childList: true, subtree: true });
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
    this.#disposers.push(
      context.realtime.subscribe(
        "comments-changed",
        () => this.scheduleRefresh()
      )
    );
    this.#disposers.push(
      context.realtime.subscribeConnectionState((state) => {
        if (state === "connected") {
          if (this.#sawConnected) this.scheduleRefresh();
          this.#sawConnected = true;
        }
      })
    );
    this.#sawConnected = context.realtime.getConnectionState() === "connected";
    this.#disposers.push(installTimelineCommentsController(this));
    this.scheduleRefresh();
  }
  beginComment(context) {
    if (context.selection === void 0 || context.selectedText === void 0)
      return;
    this.closeComposer();
    const root = this.findProse(context.threadId, context.message.id);
    const restored = root === null ? null : restoreSelector(root, context.selection);
    this.#provisionalRange = restored?.range ?? null;
    this.rebuildHighlights();
    const key = `bb.timeline-comments.draft:${context.threadId}:${context.message.id}:${context.selection.start}:${context.selection.end}`;
    const shell = element("form", "bb-comments-composer");
    shell.setAttribute("role", "dialog");
    shell.setAttribute("aria-label", "Add comment");
    const textarea = element(
      "textarea",
      "bb-comments-textarea"
    );
    textarea.placeholder = "Add a comment\u2026";
    textarea.maxLength = 2e4;
    textarea.value = readDraft(key) ?? "";
    const footer = element("div", "bb-comments-composer-footer");
    footer.append(element("span", "bb-comments-hint", "\u2318/Ctrl Enter"));
    const submit = element(
      "button",
      "bb-comments-primary",
      "Comment"
    );
    submit.type = "submit";
    footer.append(submit);
    const error = element("div", "bb-comments-error");
    error.setAttribute("role", "status");
    shell.append(textarea, error, footer);
    const firstRect = context.selection.rects[0];
    const x = firstRect?.x ?? window.innerWidth / 2;
    const y = context.selection.rects.at(-1)?.y ?? window.innerHeight / 2;
    shell.style.left = `${Math.max(8, Math.min(window.innerWidth - 328, x))}px`;
    shell.style.top = `${Math.max(8, Math.min(window.innerHeight - 180, y + 22))}px`;
    const validate = () => {
      const message = commentBodyError(textarea.value);
      submit.disabled = message !== null;
      error.textContent = message !== null && textarea.value.trim() !== "" ? message : "";
      return message;
    };
    const persist = () => writeDraft(key, textarea.value);
    textarea.addEventListener("input", () => {
      persist();
      validate();
    });
    textarea.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        persist();
        this.closeComposer();
      }
      if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        shell.requestSubmit();
      }
    });
    shell.addEventListener("submit", (event) => {
      event.preventDefault();
      if (validate() !== null) return;
      submit.disabled = true;
      error.textContent = "";
      void this.#rpc.call("createThread", {
        bbThreadId: context.threadId,
        message: context.message,
        selector: {
          ...context.selection,
          rects: context.selection.rects.map((rect) => ({ ...rect }))
        },
        body: textarea.value
      }).then((detail) => {
        sessionStorage.removeItem(key);
        this.closeComposer();
        this.#openThreadId = detail.thread.id;
        return this.refresh();
      }).then(() => this.openThread(detailId(this.#openThreadId))).catch((caught) => {
        submit.disabled = false;
        error.textContent = errorMessage(caught);
      });
    });
    validate();
    this.#composer = shell;
    this.#portal.append(shell);
    this.#outsideComposer = (event) => {
      if (event.target instanceof Node && shell.contains(event.target)) return;
      persist();
      this.closeComposer();
    };
    document.addEventListener("pointerdown", this.#outsideComposer, true);
    requestAnimationFrame(() => textarea.focus());
  }
  async focusThread(commentThreadId) {
    const request = ++this.#focusNonce;
    this.#openThreadId = commentThreadId;
    await this.refresh();
    if (request !== this.#focusNonce || this.#destroyed) return false;
    const restored = this.#restored.get(commentThreadId);
    if (restored === void 0) return false;
    const scrollRoot = restored.window.querySelector(
      "[data-bb-thread-scroll-root]"
    );
    if (scrollRoot === null) return false;
    const rangeRect = restored.range.getBoundingClientRect();
    const scrollRect = scrollRoot.getBoundingClientRect();
    scrollRoot.scrollBy({
      top: rangeRect.top + rangeRect.height / 2 - (scrollRect.top + scrollRect.height / 2),
      behavior: "smooth"
    });
    this.setActive([commentThreadId]);
    await new Promise(
      (resolve) => requestAnimationFrame(() => resolve())
    );
    if (request !== this.#focusNonce || this.#destroyed) return false;
    this.scheduleLayout();
    restored.marker?.focus({ preventScroll: true });
    await this.openThread(commentThreadId);
    return true;
  }
  scheduleRefresh() {
    this.#refreshNonce += 1;
    queueMicrotask(() => {
      void this.refresh().catch((error) => {
        if (!this.#destroyed)
          console.error("timeline-comments refresh failed", error);
      });
    });
  }
  async refresh() {
    if (this.#destroyed) return;
    if (this.#refreshing !== null) {
      await this.#refreshing;
      if (!this.#destroyed) return this.refresh();
      return;
    }
    const nonce = this.#refreshNonce;
    this.#refreshing = this.loadAnchors();
    try {
      await this.#refreshing;
    } finally {
      this.#refreshing = null;
    }
    if (nonce !== this.#refreshNonce && !this.#destroyed) await this.refresh();
  }
  async loadAnchors() {
    const threadIds = [
      ...document.querySelectorAll("[data-bb-thread-window]")
    ].map((node) => node.dataset.bbThreadWindow).filter((id) => typeof id === "string" && id !== "").filter((id, index, all) => all.indexOf(id) === index).slice(0, 20);
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
    return document.querySelector(
      `[data-bb-thread-window="${escapeSelector(threadId)}"]`
    );
  }
  findProse(threadId, messageId) {
    const windowNode = this.findWindow(threadId);
    const row = windowNode?.querySelector(
      `[data-bb-conversation-message-id="${escapeSelector(messageId)}"]`
    );
    return row?.querySelector("[data-bb-message-prose-root]") ?? null;
  }
  restoreAll() {
    this.#restored.clear();
    this.#overlay.replaceChildren();
    this.#resizeObserver?.disconnect();
    const health = /* @__PURE__ */ new Map();
    for (const anchor of this.#anchors.values()) {
      const windowNode = this.findWindow(anchor.bbThreadId);
      const prose = this.findProse(anchor.bbThreadId, anchor.messageId);
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
      const side = chooseNearestGutter(rects, {
        left: proseRect.left,
        right: proseRect.right,
        width: windowNode.getBoundingClientRect().width
      });
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
      restored.side = chooseNearestGutter(fragments, {
        left: proseRect.left,
        right: proseRect.right,
        width: restored.window.getBoundingClientRect().width
      });
      restored.marker = null;
    }
    const groups = /* @__PURE__ */ new Map();
    for (const restored of this.#restored.values()) {
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
        bottom
      )) {
        const threads = placement.ids.map((id) => this.#restored.get(id)).filter(Boolean);
        const marker = element(
          "button",
          "bb-comments-marker"
        );
        marker.type = "button";
        marker.dataset.bbCommentGutter = threads[0].side;
        marker.style.top = `${placement.y}px`;
        const proseRects = threads.map(
          ({ prose }) => prose.getBoundingClientRect()
        );
        const gutterX = threads[0].side === "left" ? Math.min(...proseRects.map(({ left }) => left)) - MARKER_SIZE - MARKER_TEXT_GAP : Math.max(...proseRects.map(({ right }) => right)) + MARKER_TEXT_GAP;
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
    this.#portal.append(menu);
    this.installPopoverDismissal(marker);
    this.positionNear(marker, menu);
    first?.focus({ preventScroll: true });
  }
  async openThread(commentThreadId) {
    const anchor = this.#anchors.get(commentThreadId) ?? this.#restored.get(commentThreadId)?.anchor;
    if (anchor === void 0) return;
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
      const replyComposer = element("div", "bb-comments-inline-composer");
      const draftKey = `bb.timeline-comments.reply:${detail.thread.id}`;
      const textarea = element(
        "textarea",
        "bb-comments-reply-input"
      );
      textarea.placeholder = "Reply...";
      textarea.maxLength = 2e4;
      textarea.value = readDraft(draftKey) ?? "";
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
        writeDraft(draftKey, textarea.value);
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
      reply.append(replyComposer, error);
      reply.addEventListener("submit", (event) => {
        event.preventDefault();
        if (validate() !== null) return;
        send.disabled = true;
        void this.#rpc.call("reply", {
          bbThreadId: detail.thread.bbThreadId,
          commentThreadId: detail.thread.id,
          body: textarea.value
        }).then(() => {
          sessionStorage.removeItem(draftKey);
          return this.openThread(detail.thread.id);
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
    const buildHeader = (action) => {
      const header = element("header", "bb-comments-message-header");
      const byline = element("div");
      byline.append(element("strong", void 0, "Me"));
      const timestamp = element("time", void 0, relativeTime(comment.createdAt));
      timestamp.dateTime = new Date(comment.createdAt).toISOString();
      timestamp.title = formatTime(comment.createdAt);
      byline.append(timestamp);
      header.append(byline, action);
      return header;
    };
    const body = element("p", "bb-comments-comment-body", comment.body);
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
    edit.addEventListener("click", () => {
      const draftKey = `bb.timeline-comments.edit:${comment.id}`;
      popover.dataset.editing = "true";
      row.dataset.editing = "true";
      this.closeActionsMenu();
      const textarea = element(
        "textarea",
        "bb-comments-edit-input"
      );
      textarea.setAttribute("aria-label", "Edit comment");
      textarea.maxLength = 2e4;
      textarea.value = readDraft(draftKey) ?? comment.body;
      const editComposer = element("div", "bb-comments-inline-composer");
      const save = element(
        "button",
        "bb-comments-submit-shortcut"
      );
      save.type = "button";
      save.append(icon(Command), icon(CornerDownLeft));
      save.setAttribute("aria-label", "Save comment");
      save.title = "Save comment \xB7 \u2318/Ctrl Enter";
      const error = element("div", "bb-comments-error");
      error.setAttribute("role", "status");
      const validate = () => {
        const message = commentBodyError(textarea.value);
        save.disabled = message !== null;
        error.textContent = message !== null && textarea.value.trim() !== "" ? message : "";
        return message;
      };
      const cancelEdit = () => {
        sessionStorage.removeItem(draftKey);
        this.renderThreadPopover(popover, detail);
        popover.querySelector(
          `[data-bb-comment-id="${escapeSelector(comment.id)}"] .bb-comments-actions-menu > button[aria-label="Comment actions"]`
        )?.focus({ preventScroll: true });
      };
      textarea.addEventListener("input", () => {
        if (textarea.value === comment.body) sessionStorage.removeItem(draftKey);
        else writeDraft(draftKey, textarea.value);
        syncInlineComposerLayout(textarea, editComposer);
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
        const body2 = textarea.value.trim();
        if (body2 === comment.body) {
          cancelEdit();
          return;
        }
        save.disabled = true;
        void this.#rpc.call("updateComment", {
          bbThreadId: detail.thread.bbThreadId,
          commentId: comment.id,
          expectedVersion: comment.version,
          body: body2
        }).then(() => {
          sessionStorage.removeItem(draftKey);
          return this.openThread(detail.thread.id);
        }).catch((caught) => {
          save.disabled = false;
          this.handlePopoverMutationError(popover, detail, caught);
        });
      });
      editComposer.append(textarea, save);
      row.replaceChildren(buildHeader(actions), editComposer, error);
      syncInlineComposerLayout(textarea, editComposer, false);
      validate();
      textarea.focus();
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
        comment.parentId === null ? "Delete this comment thread?" : "Delete this reply?"
      ))
        return;
      remove.disabled = true;
      void this.#rpc.call("deleteComment", {
        bbThreadId: detail.thread.bbThreadId,
        commentId: comment.id,
        expectedVersion: comment.version,
        expectedThreadVersion: detail.thread.version
      }).then((result) => {
        if (result.deletedThreadId !== null) this.closePopover();
        else void this.openThread(detail.thread.id);
        this.scheduleRefresh();
      }).catch((caught) => {
        remove.disabled = false;
        this.handlePopoverMutationError(popover, detail, caught);
      });
    });
    actionsMenu.append(edit, remove);
    actions.append(actionsTrigger);
    row.append(buildHeader(actions), body);
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
      if (event.target instanceof Node && (this.#popover?.contains(event.target) === true || this.#popoverInvoker?.contains(event.target) === true || this.#actionsMenu?.contains(event.target) === true)) {
        return;
      }
      this.closePopover();
    };
    this.#popoverKeydown = (event) => {
      if (event.key !== "Escape") return;
      if (this.#actionsMenu !== null) {
        event.preventDefault();
        this.closeActionsMenu(true);
        return;
      }
      if (event.target instanceof Element && event.target.closest(".bb-comments-edit-input") !== null) {
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
    const width = Math.min(340, window.innerWidth - 16);
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
    this.#composer?.remove();
    this.#composer = null;
    this.#provisionalRange = null;
    this.rebuildHighlights();
  }
  closePopover(clearOpen = true) {
    const invoker = this.#popoverInvoker;
    const currentMarker = this.#openThreadId === null ? null : this.#restored.get(this.#openThreadId)?.marker ?? null;
    const focusTarget = invoker?.isConnected === true ? invoker : currentMarker;
    this.closeActionsMenu();
    this.removePopoverDismissal();
    this.#popoverInvoker = null;
    this.#popover?.remove();
    this.#popover = null;
    if (clearOpen) this.#openThreadId = null;
    this.setActive([]);
    if (clearOpen && focusTarget?.isConnected === true) {
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
function errorMessage2(error) {
  return error instanceof Error ? error.message : "Something went wrong";
}
function excerpt(value, length) {
  return value.length > length ? `${value.slice(0, length - 1)}\u2026` : value;
}
function AddCommentsAction() {
  const rpc = useRpc();
  const composer = useComposer();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const requestGeneration = useRef(0);
  const threadId = composer.scope.kind === "thread" ? composer.scope.threadId : null;
  const currentThreadId = useRef(threadId);
  useLayoutEffect(() => {
    currentThreadId.current = threadId;
    requestGeneration.current += 1;
    setBusy(false);
    setError(null);
    return () => {
      currentThreadId.current = null;
      requestGeneration.current += 1;
    };
  }, [threadId]);
  if (threadId === null) return null;
  const addComments = async () => {
    const generation = ++requestGeneration.current;
    const isCurrentRequest = () => generation === requestGeneration.current && currentThreadId.current === threadId;
    setBusy(true);
    setError(null);
    try {
      const summary = await rpc.call("getThreadHandoffSummary", {
        bbThreadId: threadId
      });
      if (!isCurrentRequest()) return;
      if (summary.threadCount === 0) return;
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
  };
  return /* @__PURE__ */ jsxs("span", { className: "bb-comments-composer-action-wrap", children: [
    error !== null ? /* @__PURE__ */ jsx("span", { className: "bb-comments-composer-action-error", role: "alert", children: "Couldn\u2019t add comments" }) : null,
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
        children: /* @__PURE__ */ jsx(MessageSquareText, { "aria-hidden": "true", size: 16, strokeWidth: 1.5 })
      }
    )
  ] });
}
function CommentPanel({ threadId, revealMessage }) {
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
      const revealed = await revealMessage(item.messageId);
      if (request !== revealRequest.current) return;
      const anchored = revealed === "revealed" && await focusTimelineComment(item.id);
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
  app.experimental_contentScripts.register({
    id: "timeline-comment-anchors",
    mount: mountTimelineCommentsController
  });
  app.composer.customize({
    id: "timeline-comments",
    scopes: ["thread"],
    actions: [{ id: "add-comments", component: AddCommentsAction }]
  });
  app.slots.threadPanelAction({
    id: "comments",
    title: "Comments",
    icon: "MessageSquare",
    component: CommentPanel,
    layout: "flush"
  });
  app.slots.experimental_messageAction({
    id: "comment-selection",
    title: "Comment",
    icon: "MessageSquare",
    placements: ["selection-menu"],
    run(context) {
      beginTimelineComment(context);
    }
  });
});
export {
  app_default as default
};
/*! Bundled license information:

lucide-react/dist/esm/shared/src/utils.js:
lucide-react/dist/esm/defaultAttributes.js:
lucide-react/dist/esm/Icon.js:
lucide-react/dist/esm/createLucideIcon.js:
lucide-react/dist/esm/icons/message-square-text.js:
lucide-react/dist/esm/lucide-react.js:
  (**
   * @license lucide-react v0.474.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)

lucide/dist/esm/createElement.js:
lucide/dist/esm/defaultAttributes.js:
lucide/dist/esm/icons/check-check.js:
lucide/dist/esm/icons/command.js:
lucide/dist/esm/icons/corner-down-left.js:
lucide/dist/esm/icons/ellipsis-vertical.js:
lucide/dist/esm/icons/pencil.js:
lucide/dist/esm/icons/sticky-note.js:
lucide/dist/esm/icons/trash-2.js:
lucide/dist/esm/lucide.js:
  (**
   * @license lucide v0.474.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)
*/
