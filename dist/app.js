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

// bb-plugin-runtime-shim:@bb/plugin-sdk/app
var runtime2 = globalThis.__bbPluginRuntime;
if (runtime2 == null || runtime2.pluginSdkApp == null) {
  throw new Error('Cannot load "@bb/plugin-sdk/app": this bundle must be loaded by the BB app, which provides the shared plugin runtime (globalThis.__bbPluginRuntime).');
}
var mod2 = runtime2.pluginSdkApp;
var {
  definePluginApp,
  useBbContext,
  useBbNavigate,
  useComposer,
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
function rulePath(id) {
  return `rule/${encodeURIComponent(id)}`;
}
function ruleIdFromPath(path) {
  if (!path.startsWith("rule/")) return null;
  try {
    return decodeURIComponent(path.slice(5)) || null;
  } catch {
    return null;
  }
}
function searchableText(rule) {
  return [
    rule.id,
    rule.title,
    rule.statement,
    rule.why,
    rule.kind,
    rule.strength,
    rule.confidence,
    rule.domain,
    ...rule.products,
    ...rule.activities,
    ...rule.artifacts,
    ...rule.surfaces,
    ...rule.prefer,
    ...rule.avoid,
    ...rule.use_when,
    ...rule.not_when,
    ...rule.exceptions,
    ...rule.evidence,
    ...rule.checks
  ].join("\n").toLocaleLowerCase();
}
function StatusBadge({ status }) {
  if (status === "active") return null;
  return /* @__PURE__ */ jsx(
    "span",
    {
      className: status === "conflicted" ? "rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-medium text-destructive" : "rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground",
      children: status
    }
  );
}
function RuleCard({ rule, onOpen }) {
  return /* @__PURE__ */ jsx("article", { className: "min-w-0", children: /* @__PURE__ */ jsxs(
    "button",
    {
      type: "button",
      className: "group flex h-full w-full flex-col rounded-xl border border-border bg-card p-4 text-left text-card-foreground shadow-sm transition-colors hover:border-foreground/20 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      onClick: onOpen,
      children: [
        /* @__PURE__ */ jsxs("div", { className: "flex w-full items-center justify-between gap-3", children: [
          /* @__PURE__ */ jsx("span", { className: "truncate text-[11px] font-medium uppercase tracking-wide text-muted-foreground", children: rule.domain }),
          /* @__PURE__ */ jsx(StatusBadge, { status: rule.status })
        ] }),
        /* @__PURE__ */ jsx("h2", { className: "mt-2 text-base font-semibold leading-snug text-foreground", children: rule.title }),
        /* @__PURE__ */ jsx("p", { className: "mt-1.5 line-clamp-3 text-sm leading-6 text-muted-foreground", children: rule.statement }),
        /* @__PURE__ */ jsxs("div", { className: "mt-auto flex w-full items-center gap-2 pt-4 text-[11px] text-muted-foreground", children: [
          /* @__PURE__ */ jsx("span", { children: rule.strength }),
          /* @__PURE__ */ jsx("span", { "aria-hidden": "true", children: "\xB7" }),
          /* @__PURE__ */ jsxs("span", { children: [
            rule.confidence,
            " confidence"
          ] }),
          /* @__PURE__ */ jsx("code", { className: "ml-auto font-mono text-[10px] opacity-70", children: rule.id })
        ] })
      ]
    }
  ) });
}
function ListSection({
  title,
  items,
  tone = "neutral"
}) {
  if (!items.length) return null;
  const marker = tone === "positive" ? "bg-emerald-600" : tone === "negative" ? "bg-destructive" : "bg-muted-foreground";
  return /* @__PURE__ */ jsxs("section", { children: [
    /* @__PURE__ */ jsx("h3", { className: "text-xs font-semibold uppercase tracking-wide text-muted-foreground", children: title }),
    /* @__PURE__ */ jsx("ul", { className: "mt-2 space-y-2 text-sm leading-6 text-foreground", children: items.map((item) => /* @__PURE__ */ jsxs("li", { className: "flex gap-2.5", children: [
      /* @__PURE__ */ jsx("span", { className: `mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${marker}`, "aria-hidden": "true" }),
      /* @__PURE__ */ jsx("span", { children: item })
    ] }, item)) })
  ] });
}
function Fact({ label, children }) {
  return /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
    /* @__PURE__ */ jsx("dt", { className: "text-[10px] font-medium uppercase tracking-wide text-muted-foreground", children: label }),
    /* @__PURE__ */ jsx("dd", { className: "mt-1 break-words text-xs text-foreground", children })
  ] });
}
function RuleInspector({
  rule,
  requestedId,
  onClose
}) {
  useEffect(() => {
    if (!requestedId) return;
    const handleKey = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose, requestedId]);
  if (!requestedId) return null;
  return /* @__PURE__ */ jsx(
    "div",
    {
      className: "fixed inset-0 z-50 flex justify-end bg-foreground/20 p-3 backdrop-blur-[1px]",
      role: "presentation",
      onMouseDown: onClose,
      children: /* @__PURE__ */ jsxs(
        "article",
        {
          className: "relative flex h-full max-h-full w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-border bg-background text-foreground shadow-2xl",
          role: "dialog",
          "aria-modal": "true",
          "aria-labelledby": "doctrine-rule-title",
          onMouseDown: (event) => event.stopPropagation(),
          children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                className: "absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-md text-xl leading-none text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                "aria-label": "Close rule",
                title: "Close",
                onClick: onClose,
                children: "\xD7"
              }
            ),
            rule ? /* @__PURE__ */ jsxs("div", { className: "min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-10 pt-6 md:px-8 md:pt-8", children: [
              /* @__PURE__ */ jsxs("header", { className: "border-b border-border pb-6 pr-10", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-[11px] font-medium uppercase tracking-wide text-muted-foreground", children: rule.domain }),
                  /* @__PURE__ */ jsx(StatusBadge, { status: rule.status })
                ] }),
                /* @__PURE__ */ jsx("h2", { id: "doctrine-rule-title", className: "mt-2 text-2xl font-semibold leading-tight tracking-tight", children: rule.title }),
                /* @__PURE__ */ jsx("p", { className: "mt-3 text-base leading-7 text-muted-foreground", children: rule.statement }),
                rule.status !== "active" ? /* @__PURE__ */ jsx("p", { className: "mt-4 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground", children: rule.status === "conflicted" ? "This rule is paused because explicit preferences conflict." : "This rule is kept for history and no longer guides work." }) : null
              ] }),
              /* @__PURE__ */ jsxs("section", { className: "mt-6", children: [
                /* @__PURE__ */ jsx("h3", { className: "text-xs font-semibold uppercase tracking-wide text-muted-foreground", children: "Why" }),
                /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm leading-6 text-foreground", children: rule.why })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "mt-7 grid gap-7 md:grid-cols-2", children: [
                /* @__PURE__ */ jsx(ListSection, { title: "Prefer", items: rule.prefer, tone: "positive" }),
                /* @__PURE__ */ jsx(ListSection, { title: "Avoid", items: rule.avoid, tone: "negative" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "mt-7 grid gap-7 md:grid-cols-2", children: [
                /* @__PURE__ */ jsx(ListSection, { title: "Use when", items: rule.use_when }),
                /* @__PURE__ */ jsx(ListSection, { title: "Do not use when", items: rule.not_when })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "mt-7 space-y-7", children: [
                /* @__PURE__ */ jsx(ListSection, { title: "Exceptions", items: rule.exceptions }),
                /* @__PURE__ */ jsx(ListSection, { title: "Check", items: rule.checks })
              ] }),
              rule.evidence.length ? /* @__PURE__ */ jsxs("section", { className: "mt-7", children: [
                /* @__PURE__ */ jsx("h3", { className: "text-xs font-semibold uppercase tracking-wide text-muted-foreground", children: "Evidence" }),
                /* @__PURE__ */ jsx("div", { className: "mt-2 space-y-2", children: rule.evidence.map((item) => /* @__PURE__ */ jsx("p", { className: "rounded-lg bg-muted/60 px-3 py-2.5 text-sm leading-6 text-muted-foreground", children: item }, item)) })
              ] }) : null,
              /* @__PURE__ */ jsxs("dl", { className: "mt-8 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-border pt-5 md:grid-cols-3", children: [
                /* @__PURE__ */ jsx(Fact, { label: "ID", children: rule.id }),
                /* @__PURE__ */ jsx(Fact, { label: "Kind", children: rule.kind }),
                /* @__PURE__ */ jsx(Fact, { label: "Strength", children: rule.strength }),
                /* @__PURE__ */ jsx(Fact, { label: "Confidence", children: rule.confidence }),
                /* @__PURE__ */ jsxs(Fact, { label: "Evidence", children: [
                  rule.supporting_episodes,
                  " supporting \xB7 ",
                  rule.challenging_episodes,
                  " challenging"
                ] }),
                /* @__PURE__ */ jsx(Fact, { label: "Updated", children: rule.updated }),
                /* @__PURE__ */ jsx(Fact, { label: "Source", children: /* @__PURE__ */ jsx("code", { className: "font-mono text-[10px]", children: rule.canonical_path }) })
              ] })
            ] }) : /* @__PURE__ */ jsxs("div", { className: "grid min-h-72 place-content-center p-8 text-center", children: [
              /* @__PURE__ */ jsx("h2", { id: "doctrine-rule-title", className: "text-lg font-semibold", children: "Rule not found" }),
              /* @__PURE__ */ jsxs("p", { className: "mt-1 text-sm text-muted-foreground", children: [
                requestedId,
                " is not in this doctrine."
              ] })
            ] })
          ]
        }
      )
    }
  );
}
function DoctrineLibrary({ subPath }) {
  const rpc = useRpc();
  const navigate = useBbNavigate();
  const [library, setLibrary] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [domain, setDomain] = useState("all");
  const [status, setStatus] = useState("active");
  const openedFromLibrary = useRef(false);
  const requestedId = ruleIdFromPath(subPath);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      setLibrary(await rpc.call("getLibrary"));
      setError(null);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : String(nextError));
    } finally {
      setLoading(false);
    }
  }, [rpc]);
  useEffect(() => {
    void load();
  }, [load]);
  useRealtime("rules-changed", () => {
    void load();
  });
  const results = useMemo(() => {
    if (!library) return [];
    const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
    return library.rules.filter((rule) => {
      if (domain !== "all" && !rule.domain.startsWith(`${domain}.`)) return false;
      if (status === "active" && rule.status !== "active") return false;
      if (status === "inactive" && rule.status === "active") return false;
      if (!terms.length) return true;
      const text = searchableText(rule);
      return terms.every((term) => text.includes(term));
    });
  }, [domain, library, query, status]);
  const closeInspector = useCallback(() => {
    if (openedFromLibrary.current) {
      openedFromLibrary.current = false;
      window.history.back();
      return;
    }
    navigate.toPluginPanel("library", { subPath: "", replace: true });
  }, [navigate]);
  const selectedRule = library?.rules.find((rule) => rule.id === requestedId) ?? null;
  return /* @__PURE__ */ jsxs("main", { className: "flex h-full min-h-0 flex-col bg-background text-foreground", children: [
    /* @__PURE__ */ jsxs("section", { className: "flex shrink-0 flex-wrap items-center gap-2 border-b border-border bg-background px-4 py-3", "aria-label": "Filter design doctrine", children: [
      /* @__PURE__ */ jsx(
        "input",
        {
          type: "search",
          className: "h-9 min-w-56 flex-1 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring",
          "aria-label": "Search doctrine",
          placeholder: "Search rules\u2026",
          value: query,
          onChange: (event) => setQuery(event.currentTarget.value)
        }
      ),
      /* @__PURE__ */ jsxs(
        "select",
        {
          className: "h-9 max-w-44 rounded-lg border border-input bg-background px-2.5 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring",
          "aria-label": "Domain",
          value: domain,
          onChange: (event) => setDomain(event.currentTarget.value),
          children: [
            /* @__PURE__ */ jsx("option", { value: "all", children: "All domains" }),
            library?.domains.map((item) => /* @__PURE__ */ jsx("option", { value: item, children: item }, item))
          ]
        }
      ),
      /* @__PURE__ */ jsxs(
        "select",
        {
          className: "h-9 max-w-44 rounded-lg border border-input bg-background px-2.5 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring",
          "aria-label": "Status",
          value: status,
          onChange: (event) => setStatus(event.currentTarget.value),
          children: [
            /* @__PURE__ */ jsx("option", { value: "active", children: "Current" }),
            /* @__PURE__ */ jsx("option", { value: "all", children: "All" }),
            /* @__PURE__ */ jsx("option", { value: "inactive", children: "Conflicted or retired" })
          ]
        }
      ),
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          className: "grid h-9 w-9 shrink-0 place-items-center rounded-lg text-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-wait disabled:opacity-50",
          title: "Refresh",
          "aria-label": "Refresh doctrine",
          disabled: loading,
          onClick: () => void load(),
          children: "\u21BB"
        }
      ),
      /* @__PURE__ */ jsxs("span", { className: "ml-auto text-xs tabular-nums text-muted-foreground", role: "status", children: [
        results.length,
        " ",
        results.length === 1 ? "rule" : "rules"
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "min-h-0 flex-1 overflow-y-auto p-4", children: error ? /* @__PURE__ */ jsxs("div", { className: "grid min-h-72 place-content-center text-center", children: [
      /* @__PURE__ */ jsx("strong", { className: "text-sm font-semibold", children: "Could not load doctrine" }),
      /* @__PURE__ */ jsx("p", { className: "mt-1 max-w-md text-sm text-muted-foreground", children: error }),
      /* @__PURE__ */ jsx("button", { type: "button", className: "mx-auto mt-4 rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted", onClick: () => void load(), children: "Retry" })
    ] }) : loading && !library ? /* @__PURE__ */ jsx("div", { className: "grid min-h-72 place-content-center text-sm text-muted-foreground", children: "Loading rules\u2026" }) : results.length ? /* @__PURE__ */ jsx("section", { className: "mx-auto grid w-full max-w-6xl grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3", "aria-label": "Design doctrine rules", children: results.map((rule) => /* @__PURE__ */ jsx(
      RuleCard,
      {
        rule,
        onOpen: () => {
          openedFromLibrary.current = true;
          navigate.toPluginPanel("library", { subPath: rulePath(rule.id) });
        }
      },
      rule.id
    )) }) : /* @__PURE__ */ jsxs("div", { className: "grid min-h-72 place-content-center text-center", children: [
      /* @__PURE__ */ jsx("strong", { className: "text-sm font-semibold", children: "No rules found" }),
      /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: "Try a different search or filter." })
    ] }) }),
    /* @__PURE__ */ jsx(RuleInspector, { rule: selectedRule, requestedId, onClose: closeInspector })
  ] });
}
var app_default = definePluginApp((app) => {
  app.slots.navPanel({
    id: "library",
    title: "Design Doctrine",
    icon: "Explore",
    path: "library",
    component: DoctrineLibrary
  });
});
export {
  app_default as default
};
