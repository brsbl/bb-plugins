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

// ../../node_modules/lucide-react/dist/esm/icons/arrow-down.js
var __iconNode = [
  ["path", { d: "M12 5v14", key: "s699le" }],
  ["path", { d: "m19 12-7 7-7-7", key: "1idqje" }]
];
var ArrowDown = createLucideIcon("ArrowDown", __iconNode);

// ../../node_modules/lucide-react/dist/esm/icons/arrow-up.js
var __iconNode2 = [
  ["path", { d: "m5 12 7-7 7 7", key: "hav0vg" }],
  ["path", { d: "M12 19V5", key: "x0mq9r" }]
];
var ArrowUp = createLucideIcon("ArrowUp", __iconNode2);

// ../../node_modules/lucide-react/dist/esm/icons/at-sign.js
var __iconNode3 = [
  ["circle", { cx: "12", cy: "12", r: "4", key: "4exip2" }],
  ["path", { d: "M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8", key: "7n84p3" }]
];
var AtSign = createLucideIcon("AtSign", __iconNode3);

// ../../node_modules/lucide-react/dist/esm/icons/check.js
var __iconNode4 = [["path", { d: "M20 6 9 17l-5-5", key: "1gmf2c" }]];
var Check = createLucideIcon("Check", __iconNode4);

// ../../node_modules/lucide-react/dist/esm/icons/chevron-down.js
var __iconNode5 = [["path", { d: "m6 9 6 6 6-6", key: "qrunsl" }]];
var ChevronDown = createLucideIcon("ChevronDown", __iconNode5);

// ../../node_modules/lucide-react/dist/esm/icons/chevrons-up-down.js
var __iconNode6 = [
  ["path", { d: "m7 15 5 5 5-5", key: "1hf1tw" }],
  ["path", { d: "m7 9 5-5 5 5", key: "sgt6xg" }]
];
var ChevronsUpDown = createLucideIcon("ChevronsUpDown", __iconNode6);

// ../../node_modules/lucide-react/dist/esm/icons/circle-check.js
var __iconNode7 = [
  ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
  ["path", { d: "m9 12 2 2 4-4", key: "dzmm74" }]
];
var CircleCheck = createLucideIcon("CircleCheck", __iconNode7);

// ../../node_modules/lucide-react/dist/esm/icons/circle-dot.js
var __iconNode8 = [
  ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
  ["circle", { cx: "12", cy: "12", r: "1", key: "41hilf" }]
];
var CircleDot = createLucideIcon("CircleDot", __iconNode8);

// ../../node_modules/lucide-react/dist/esm/icons/git-pull-request.js
var __iconNode9 = [
  ["circle", { cx: "18", cy: "18", r: "3", key: "1xkwt0" }],
  ["circle", { cx: "6", cy: "6", r: "3", key: "1lh9wr" }],
  ["path", { d: "M13 6h3a2 2 0 0 1 2 2v7", key: "1yeb86" }],
  ["line", { x1: "6", x2: "6", y1: "9", y2: "21", key: "rroup" }]
];
var GitPullRequest = createLucideIcon("GitPullRequest", __iconNode9);

// ../../node_modules/lucide-react/dist/esm/icons/message-square.js
var __iconNode10 = [
  ["path", { d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z", key: "1lielz" }]
];
var MessageSquare = createLucideIcon("MessageSquare", __iconNode10);

// ../../node_modules/lucide-react/dist/esm/icons/refresh-cw.js
var __iconNode11 = [
  ["path", { d: "M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8", key: "v9h5vc" }],
  ["path", { d: "M21 3v5h-5", key: "1q7to0" }],
  ["path", { d: "M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16", key: "3uifl3" }],
  ["path", { d: "M8 16H3v5", key: "1cv678" }]
];
var RefreshCw = createLucideIcon("RefreshCw", __iconNode11);

// ../../node_modules/lucide-react/dist/esm/icons/search.js
var __iconNode12 = [
  ["circle", { cx: "11", cy: "11", r: "8", key: "4ej97u" }],
  ["path", { d: "m21 21-4.3-4.3", key: "1qie3q" }]
];
var Search = createLucideIcon("Search", __iconNode12);

// ../../node_modules/lucide-react/dist/esm/icons/user-round.js
var __iconNode13 = [
  ["circle", { cx: "12", cy: "8", r: "5", key: "1hypcn" }],
  ["path", { d: "M20 21a8 8 0 0 0-16 0", key: "rfgkzh" }]
];
var UserRound = createLucideIcon("UserRound", __iconNode13);

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
var ACTIVITY_FILTERS = [
  { value: "all", label: "All activity" },
  { value: "comment", label: "Comments" },
  { value: "mention", label: "Mentions" }
];
function filterAndSortNotifications(args) {
  const query = args.query.trim().toLocaleLowerCase();
  const filtered = args.items.filter((item) => {
    if (args.resource !== "all" && item.resourceKind !== args.resource) return false;
    if (args.activity !== "all" && item.activityKind !== args.activity) return false;
    if (args.status === "open" && item.resolved) return false;
    if (args.status === "resolved" && !item.resolved) return false;
    if (query.length === 0) return true;
    return [
      item.activity,
      item.actor ?? "",
      item.number.toString(),
      item.repo,
      item.resourceKind === "pr" ? "pull request pr" : "issue",
      item.title
    ].some((value) => value.toLocaleLowerCase().includes(query));
  });
  const valueFor = (item) => {
    switch (args.sort) {
      case "resource":
        return `${item.title} ${item.repo} ${item.resourceKind} ${item.number}`;
      case "updated":
        return Date.parse(item.updatedAt);
    }
  };
  return [...filtered].sort((left, right) => {
    const leftValue = valueFor(left);
    const rightValue = valueFor(right);
    const result = typeof leftValue === "number" && typeof rightValue === "number" ? leftValue - rightValue : String(leftValue).localeCompare(String(rightValue));
    return args.direction === "asc" ? result : -result;
  });
}
function relativeTime(value) {
  const seconds = Math.max(0, Math.round((Date.now() - Date.parse(value)) / 1e3));
  if (seconds < 60) return "now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d`;
  return new Intl.DateTimeFormat(void 0, { month: "short", day: "numeric" }).format(
    new Date(value)
  );
}
function activityPresentation(kind) {
  switch (kind) {
    case "mention":
      return {
        className: "text-warning-text",
        icon: AtSign,
        label: "Mention"
      };
    case "comment":
      return {
        className: "text-muted-foreground",
        icon: MessageSquare,
        label: "Comment"
      };
  }
}
function resourcePresentation(kind) {
  return kind === "pr" ? { className: "text-muted-foreground", icon: GitPullRequest, label: "Pull request" } : { className: "text-muted-foreground", icon: CircleDot, label: "Issue" };
}
function TaxonomyIcon({
  className,
  icon: Icon2,
  label
}) {
  return /* @__PURE__ */ jsxs(
    "span",
    {
      className: `group/taxonomy relative inline-flex items-center rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${className}`,
      "aria-label": label,
      role: "img",
      tabIndex: 0,
      title: label,
      children: [
        /* @__PURE__ */ jsx(Icon2, { "aria-hidden": "true", className: "size-4", strokeWidth: 1.75 }),
        /* @__PURE__ */ jsx(
          "span",
          {
            "aria-hidden": "true",
            className: "pointer-events-none absolute left-1/2 top-full z-20 mt-1 -translate-x-1/2 whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-xs font-medium text-background opacity-0 shadow-sm transition-opacity group-hover/taxonomy:opacity-100 group-focus/taxonomy:opacity-100",
            children: label
          }
        )
      ]
    }
  );
}
function NotificationLink({ item }) {
  const resource = resourcePresentation(item.resourceKind);
  return /* @__PURE__ */ jsxs(
    "a",
    {
      href: item.url,
      target: "_blank",
      rel: "noopener noreferrer",
      className: "group flex min-w-0 items-start gap-2 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      children: [
        /* @__PURE__ */ jsx(
          "span",
          {
            className: `mt-0.5 inline-flex shrink-0 ${resource.className}`,
            "aria-label": resource.label,
            role: "img",
            title: resource.label,
            children: /* @__PURE__ */ jsx(resource.icon, { "aria-hidden": "true", className: "size-4", strokeWidth: 1.75 })
          }
        ),
        /* @__PURE__ */ jsxs("span", { className: "min-w-0 flex-1", children: [
          /* @__PURE__ */ jsx(
            "span",
            {
              className: `line-clamp-2 min-w-0 text-sm font-medium leading-5 group-hover:underline lg:line-clamp-1 ${item.resolved ? "text-muted-foreground" : "text-foreground"}`,
              children: item.title
            }
          ),
          /* @__PURE__ */ jsxs("span", { className: "mt-0.5 flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs leading-4 text-muted-foreground", children: [
            /* @__PURE__ */ jsxs("span", { className: "font-medium text-foreground", children: [
              "#",
              item.number
            ] }),
            /* @__PURE__ */ jsxs(
              "span",
              {
                className: "github-activity-inline-repo inline-flex min-w-0 items-center gap-1.5 lg:hidden",
                children: [
                  /* @__PURE__ */ jsx("span", { children: "\xB7" }),
                  /* @__PURE__ */ jsx("span", { className: "truncate", children: item.repo })
                ]
              }
            ),
            /* @__PURE__ */ jsx(LatestUpdate, { item, className: "xl:hidden" })
          ] })
        ] })
      ]
    }
  );
}
function LatestUpdate({
  className = "",
  item
}) {
  const actor = item.actor ? `@${item.actor}` : "Someone";
  return /* @__PURE__ */ jsxs(
    "span",
    {
      className: `flex min-w-0 items-center gap-1.5 text-xs ${className}`,
      children: [
        /* @__PURE__ */ jsxs("span", { className: "inline-flex max-w-40 shrink items-center gap-1 rounded-full bg-muted/35 py-0.5 pl-0.5 pr-1.5 font-normal text-muted-foreground", children: [
          /* @__PURE__ */ jsx(ActorAvatar, { avatarUrl: item.avatarUrl }),
          /* @__PURE__ */ jsx("span", { className: "truncate", children: actor })
        ] }),
        /* @__PURE__ */ jsx(UpdatedTime, { value: item.updatedAt })
      ]
    }
  );
}
function ActorAvatar({ avatarUrl }) {
  const [failed, setFailed] = useState(false);
  return /* @__PURE__ */ jsx("span", { className: "grid size-5 shrink-0 place-content-center overflow-hidden rounded-full bg-muted/70", children: avatarUrl && !failed ? /* @__PURE__ */ jsx(
    "img",
    {
      src: avatarUrl,
      alt: "",
      className: "aspect-square size-full object-cover",
      onError: () => setFailed(true)
    }
  ) : /* @__PURE__ */ jsx(
    UserRound,
    {
      "aria-hidden": "true",
      className: "size-3 text-muted-foreground",
      strokeWidth: 1.75
    }
  ) });
}
function UpdatedTime({ value }) {
  const fullDate = new Date(value).toLocaleString();
  return /* @__PURE__ */ jsx(
    "span",
    {
      className: "shrink-0 whitespace-nowrap text-xs tabular-nums text-muted-foreground",
      title: `Updated ${fullDate}`,
      "aria-label": `Updated ${fullDate}`,
      children: relativeTime(value)
    }
  );
}
function ResolveCheckbox({
  disabled,
  item,
  onToggle
}) {
  const label = item.resolved ? "Reopen" : "Resolve";
  return /* @__PURE__ */ jsxs(
    "label",
    {
      className: `group/resolve relative grid size-7 place-content-center rounded-md transition-colors hover:bg-accent ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`,
      children: [
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "checkbox",
            "aria-label": `${label}: ${item.title}`,
            checked: item.resolved,
            disabled,
            "data-resolve-control": "true",
            onChange: (event) => onToggle(event.currentTarget),
            title: label,
            className: "peer size-4 cursor-inherit appearance-none rounded-[4px] border border-muted-foreground/50 bg-background transition-colors hover:border-foreground/60 checked:border-success checked:bg-success focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background"
          }
        ),
        /* @__PURE__ */ jsx(
          Check,
          {
            "aria-hidden": "true",
            className: "pointer-events-none absolute left-1/2 top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 text-background opacity-0 transition-opacity peer-checked:opacity-100",
            strokeWidth: 2.5
          }
        ),
        /* @__PURE__ */ jsx(
          "span",
          {
            "aria-hidden": "true",
            className: "pointer-events-none absolute left-0 top-full z-20 mt-1 whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-xs font-medium text-background opacity-0 shadow-sm transition-opacity group-hover/resolve:opacity-100 peer-focus-visible:opacity-100",
            children: label
          }
        )
      ]
    }
  );
}
function SortHeader({
  active,
  ariaLabel,
  direction,
  label,
  onSort
}) {
  return /* @__PURE__ */ jsxs(
    "button",
    {
      type: "button",
      onClick: onSort,
      className: "inline-flex items-center gap-1 rounded-sm font-medium text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      "aria-label": `${ariaLabel ?? `Sort by ${label}`}${active ? `, ${direction === "asc" ? "ascending" : "descending"}` : ""}`,
      children: [
        label,
        active ? direction === "asc" ? /* @__PURE__ */ jsx(ArrowUp, { "aria-hidden": "true", className: "size-3" }) : /* @__PURE__ */ jsx(ArrowDown, { "aria-hidden": "true", className: "size-3" }) : /* @__PURE__ */ jsx(ChevronsUpDown, { "aria-hidden": "true", className: "size-3 text-muted-foreground/55" })
      ]
    }
  );
}
function GitHubActivityPanel() {
  const rpc = useRpc();
  const [payload, setPayload] = useState(null);
  const [error, setError] = useState(null);
  const [resolveError, setResolveError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pendingResolvedIds, setPendingResolvedIds] = useState(
    () => /* @__PURE__ */ new Set()
  );
  const [query, setQuery] = useState("");
  const [resourceFilter, setResourceFilter] = useState("all");
  const [activityFilter, setActivityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sort, setSort] = useState("updated");
  const [direction, setDirection] = useState("desc");
  const statusFilterRef = useRef(null);
  const load = useCallback(async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      setPayload(await rpc.call("listNotifications", { force }));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : String(loadError));
    } finally {
      setLoading(false);
    }
  }, [rpc]);
  useEffect(() => {
    void load();
  }, [load]);
  const items = useMemo(
    () => filterAndSortNotifications({
      activity: activityFilter,
      direction,
      items: payload?.items ?? [],
      query,
      resource: resourceFilter,
      sort,
      status: statusFilter
    }),
    [activityFilter, direction, payload, query, resourceFilter, sort, statusFilter]
  );
  const hasFilters = query.length > 0 || resourceFilter !== "all" || activityFilter !== "all" || statusFilter !== "all";
  const setSortKey = (next) => {
    if (sort === next) {
      setDirection((current) => current === "asc" ? "desc" : "asc");
    } else {
      setSort(next);
      setDirection(next === "updated" ? "desc" : "asc");
    }
  };
  const clearFilters = () => {
    setQuery("");
    setResourceFilter("all");
    setActivityFilter("all");
    setStatusFilter("all");
  };
  const toggleResolved = async (item, control) => {
    if (pendingResolvedIds.has(item.id)) return;
    const resolved = !item.resolved;
    const controls = Array.from(
      control.closest("table")?.querySelectorAll("[data-resolve-control='true']") ?? []
    );
    const controlIndex = controls.indexOf(control);
    const focusAfterRemoval = controls[controlIndex + 1] ?? controls[controlIndex - 1] ?? statusFilterRef.current;
    setResolveError(null);
    setPendingResolvedIds((current) => new Set(current).add(item.id));
    try {
      if (payload === null) return;
      await rpc.call("setNotificationResolved", {
        eventKey: item.eventKey ?? null,
        id: item.id,
        identityKey: payload.identityKey,
        resolved,
        updatedAt: item.updatedAt
      });
      setPayload(
        (current) => current === null ? current : {
          ...current,
          items: current.items.map(
            (candidate) => candidate.id === item.id ? { ...candidate, resolved } : candidate
          )
        }
      );
      if (statusFilter === "open" && resolved || statusFilter === "resolved" && !resolved) {
        queueMicrotask(() => focusAfterRemoval?.focus());
      }
    } catch {
      setResolveError("Couldn\u2019t update resolved state. Try again.");
      setTimeout(() => control.focus(), 0);
    } finally {
      setPendingResolvedIds((current) => {
        const next = new Set(current);
        next.delete(item.id);
        return next;
      });
    }
  };
  return /* @__PURE__ */ jsx("main", { className: "github-activity-surface h-full overflow-y-auto bg-background p-4 md:p-5", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto w-full max-w-6xl", children: [
    /* @__PURE__ */ jsxs("div", { className: "mb-5 flex items-start gap-3", children: [
      /* @__PURE__ */ jsx("div", { className: "min-w-0 flex-1", children: /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground", children: [
        "Comments and mentions on PRs and issues you authored",
        payload ? ` as @${payload.login}` : "",
        "."
      ] }) }),
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          "aria-label": "Refresh GitHub activity",
          title: "Refresh GitHub activity",
          onClick: () => void load(true),
          disabled: loading,
          className: "grid size-8 shrink-0 place-content-center rounded-md border border-border text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50",
          children: /* @__PURE__ */ jsx(RefreshCw, { "aria-hidden": "true", className: `size-3.5 ${loading ? "animate-spin" : ""}` })
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mb-3 flex flex-wrap items-center gap-2.5", children: [
      /* @__PURE__ */ jsxs("label", { className: "relative min-w-56 flex-1", children: [
        /* @__PURE__ */ jsx(Search, { "aria-hidden": "true", className: "pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "search",
            value: query,
            onChange: (event) => setQuery(event.target.value),
            placeholder: "Filter by title, repo, or person",
            "aria-label": "Filter GitHub activity",
            className: "h-9 w-full rounded-md border border-input bg-background pl-8 pr-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("label", { className: "relative w-36 shrink-0", children: [
        /* @__PURE__ */ jsx(CircleCheck, { "aria-hidden": "true", className: "pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" }),
        /* @__PURE__ */ jsxs(
          "select",
          {
            ref: statusFilterRef,
            value: statusFilter,
            onChange: (event) => setStatusFilter(event.target.value),
            "aria-label": "Filter by status",
            className: "h-9 w-full appearance-none rounded-md border border-input bg-background pl-8 pr-8 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring",
            children: [
              /* @__PURE__ */ jsx("option", { value: "all", children: "All statuses" }),
              /* @__PURE__ */ jsx("option", { value: "open", children: "Open" }),
              /* @__PURE__ */ jsx("option", { value: "resolved", children: "Resolved" })
            ]
          }
        ),
        /* @__PURE__ */ jsx(ChevronDown, { "aria-hidden": "true", className: "pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" })
      ] }),
      /* @__PURE__ */ jsxs("label", { className: "relative w-40 shrink-0", children: [
        /* @__PURE__ */ jsx(GitPullRequest, { "aria-hidden": "true", className: "pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" }),
        /* @__PURE__ */ jsxs(
          "select",
          {
            value: resourceFilter,
            onChange: (event) => setResourceFilter(event.target.value),
            "aria-label": "Filter by resource type",
            className: "h-9 w-full appearance-none rounded-md border border-input bg-background pl-8 pr-8 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring",
            children: [
              /* @__PURE__ */ jsx("option", { value: "all", children: "All items" }),
              /* @__PURE__ */ jsx("option", { value: "pr", children: "Pull requests" }),
              /* @__PURE__ */ jsx("option", { value: "issue", children: "Issues" })
            ]
          }
        ),
        /* @__PURE__ */ jsx(ChevronDown, { "aria-hidden": "true", className: "pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" })
      ] }),
      /* @__PURE__ */ jsxs("label", { className: "relative w-44 shrink-0", children: [
        /* @__PURE__ */ jsx(MessageSquare, { "aria-hidden": "true", className: "pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" }),
        /* @__PURE__ */ jsx(
          "select",
          {
            value: activityFilter,
            onChange: (event) => setActivityFilter(event.target.value),
            "aria-label": "Filter by update type",
            className: "h-9 w-full appearance-none rounded-md border border-input bg-background pl-8 pr-8 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring",
            children: ACTIVITY_FILTERS.map((filter) => /* @__PURE__ */ jsx("option", { value: filter.value, children: filter.label }, filter.value))
          }
        ),
        /* @__PURE__ */ jsx(ChevronDown, { "aria-hidden": "true", className: "pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" })
      ] }),
      /* @__PURE__ */ jsxs("span", { className: "px-1 text-xs tabular-nums text-muted-foreground", children: [
        items.length,
        " ",
        items.length === 1 ? "item" : "items"
      ] })
    ] }),
    resolveError ? /* @__PURE__ */ jsx("p", { role: "alert", className: "mb-3 text-sm text-destructive-text", children: resolveError }) : null,
    error && payload !== null ? /* @__PURE__ */ jsxs(
      "div",
      {
        role: "alert",
        className: "mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-warning/25 bg-warning/5 px-3 py-2",
        children: [
          /* @__PURE__ */ jsxs("p", { className: "text-sm text-foreground", children: [
            /* @__PURE__ */ jsx("span", { className: "font-medium", children: "Couldn\u2019t refresh GitHub activity." }),
            " ",
            /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Showing the last loaded results." })
          ] }),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              className: "rounded-md px-2 py-1 text-sm font-medium text-foreground hover:bg-accent",
              onClick: () => void load(true),
              children: "Retry"
            }
          )
        ]
      }
    ) : null,
    error && payload === null ? /* @__PURE__ */ jsxs("div", { role: "alert", className: "rounded-xl border border-destructive/25 bg-destructive/5 p-4", children: [
      /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-destructive", children: "Couldn\u2019t load GitHub activity" }),
      /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: error }),
      /* @__PURE__ */ jsx("button", { type: "button", className: "mt-3 rounded-md border border-border px-2.5 py-1.5 text-sm font-medium text-foreground hover:bg-accent", onClick: () => void load(true), children: "Try again" })
    ] }) : payload !== null && items.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "rounded-xl border border-dashed border-border p-6 text-center", children: [
      /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-foreground", children: hasFilters ? "No matching activity" : "No comments or mentions to triage" }),
      /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: hasFilters ? "Try a different search or clear the filters." : "New comments and mentions on GitHub PRs and issues you authored will appear here." }),
      hasFilters ? /* @__PURE__ */ jsx("button", { type: "button", className: "mt-3 rounded-md border border-border px-2.5 py-1.5 text-sm font-medium text-foreground hover:bg-accent", onClick: clearFilters, children: "Clear filters" }) : null
    ] }) : /* @__PURE__ */ jsx("div", { className: "overflow-hidden rounded-lg border border-border bg-card", children: /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsxs("table", { className: "github-activity-table w-full table-fixed border-collapse text-left", children: [
      /* @__PURE__ */ jsxs("colgroup", { className: "github-activity-colgroup", children: [
        /* @__PURE__ */ jsx("col", { className: "w-[3.75rem]" }),
        /* @__PURE__ */ jsx("col", {}),
        /* @__PURE__ */ jsx("col", { className: "hidden w-40 lg:table-column" }),
        /* @__PURE__ */ jsx("col", { className: "w-16" }),
        /* @__PURE__ */ jsx("col", { className: "hidden w-[14rem] xl:table-column" })
      ] }),
      /* @__PURE__ */ jsx("thead", { className: "border-b border-border bg-muted/35 text-xs", children: /* @__PURE__ */ jsxs("tr", { className: "github-activity-header-row", children: [
        /* @__PURE__ */ jsx("th", { scope: "col", className: "github-activity-status-header px-3 py-2.5 text-muted-foreground", children: "Status" }),
        /* @__PURE__ */ jsx("th", { scope: "col", "aria-label": "Resource", className: "github-activity-resource-header px-3 py-2.5", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-3", children: [
          /* @__PURE__ */ jsx(SortHeader, { label: "Resource", active: sort === "resource", direction, onSort: () => setSortKey("resource") }),
          /* @__PURE__ */ jsx("span", { className: "xl:hidden", children: /* @__PURE__ */ jsx(
            SortHeader,
            {
              label: "Recent",
              ariaLabel: "Sort by time",
              active: sort === "updated",
              direction,
              onSort: () => setSortKey("updated")
            }
          ) })
        ] }) }),
        /* @__PURE__ */ jsx("th", { scope: "col", className: "github-activity-repo-header hidden px-3 py-2.5 font-medium text-muted-foreground lg:table-cell", children: "Repo" }),
        /* @__PURE__ */ jsx("th", { scope: "col", className: "github-activity-update-header px-2 py-2.5 text-center text-muted-foreground", children: "Activity" }),
        /* @__PURE__ */ jsx("th", { scope: "col", className: "github-activity-from-header hidden px-3 py-2.5 xl:table-cell", children: /* @__PURE__ */ jsx(
          SortHeader,
          {
            label: "From",
            ariaLabel: "Sort by time",
            active: sort === "updated",
            direction,
            onSort: () => setSortKey("updated")
          }
        ) })
      ] }) }),
      /* @__PURE__ */ jsx("tbody", { className: "github-activity-body divide-y divide-border", children: loading && payload === null ? [0, 1, 2, 3, 4].map((index) => /* @__PURE__ */ jsx("tr", { "aria-label": "Loading GitHub activity", className: "github-activity-row", children: [0, 1, 2, 3, 4].map((cell) => /* @__PURE__ */ jsx(
        "td",
        {
          className: `px-3 py-3 ${cell === 0 ? "github-activity-status-cell" : cell === 1 ? "github-activity-resource-cell" : cell === 2 ? "github-activity-repo-cell hidden lg:table-cell" : cell === 3 ? "github-activity-update-cell" : "github-activity-from-cell hidden xl:table-cell"}`,
          children: /* @__PURE__ */ jsx("div", { className: "h-4 animate-pulse rounded bg-muted" })
        },
        cell
      )) }, index)) : items.map((item) => /* @__PURE__ */ jsxs(
        "tr",
        {
          "data-resolved": item.resolved ? "true" : "false",
          className: `github-activity-row align-top transition-colors hover:bg-accent/30 ${item.resolved ? "bg-muted/15" : ""}`,
          children: [
            /* @__PURE__ */ jsx("td", { className: "github-activity-status-cell px-3 py-2.5", children: /* @__PURE__ */ jsx(
              ResolveCheckbox,
              {
                disabled: pendingResolvedIds.has(item.id),
                item,
                onToggle: (control) => void toggleResolved(item, control)
              }
            ) }),
            /* @__PURE__ */ jsx("td", { className: "github-activity-resource-cell px-3 py-2.5", children: /* @__PURE__ */ jsx(NotificationLink, { item }) }),
            /* @__PURE__ */ jsx("td", { className: "github-activity-repo-cell hidden px-3 py-2.5 text-xs text-muted-foreground lg:table-cell", children: /* @__PURE__ */ jsx("span", { className: "block truncate", title: item.repo, children: item.repo }) }),
            /* @__PURE__ */ jsx("td", { className: "github-activity-update-cell px-2 py-2.5 text-center", children: /* @__PURE__ */ jsx(TaxonomyIcon, { ...activityPresentation(item.activityKind) }) }),
            /* @__PURE__ */ jsx("td", { className: "github-activity-from-cell hidden px-3 py-2.5 xl:table-cell", children: /* @__PURE__ */ jsx(LatestUpdate, { item, className: "justify-between" }) })
          ]
        },
        item.id
      )) })
    ] }) }) })
  ] }) });
}
var app_default = definePluginApp((app) => {
  app.slots.navPanel({
    id: "activity",
    title: "GitHub Activity",
    icon: "Github",
    path: "activity",
    component: GitHubActivityPanel
  });
});
export {
  app_default as default,
  filterAndSortNotifications
};
/*! Bundled license information:

lucide-react/dist/esm/shared/src/utils.js:
lucide-react/dist/esm/defaultAttributes.js:
lucide-react/dist/esm/Icon.js:
lucide-react/dist/esm/createLucideIcon.js:
lucide-react/dist/esm/icons/arrow-down.js:
lucide-react/dist/esm/icons/arrow-up.js:
lucide-react/dist/esm/icons/at-sign.js:
lucide-react/dist/esm/icons/check.js:
lucide-react/dist/esm/icons/chevron-down.js:
lucide-react/dist/esm/icons/chevrons-up-down.js:
lucide-react/dist/esm/icons/circle-check.js:
lucide-react/dist/esm/icons/circle-dot.js:
lucide-react/dist/esm/icons/git-pull-request.js:
lucide-react/dist/esm/icons/message-square.js:
lucide-react/dist/esm/icons/refresh-cw.js:
lucide-react/dist/esm/icons/search.js:
lucide-react/dist/esm/icons/user-round.js:
lucide-react/dist/esm/lucide-react.js:
  (**
   * @license lucide-react v0.474.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)
*/
