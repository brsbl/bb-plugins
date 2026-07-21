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

// app-logic.ts
var SUBDOMAIN_MESH_STYLES = {
  operation: {
    idle: "bg-cyan-300/40 group-hover:bg-cyan-300/50",
    selected: "bg-cyan-300/55 group-hover:bg-cyan-300/65"
  },
  agency: {
    idle: "bg-rose-300/40 group-hover:bg-rose-300/50",
    selected: "bg-rose-300/55 group-hover:bg-rose-300/65"
  },
  context: {
    idle: "bg-sky-300/40 group-hover:bg-sky-300/50",
    selected: "bg-sky-300/55 group-hover:bg-sky-300/65"
  },
  instructions: {
    idle: "bg-amber-200/40 group-hover:bg-amber-200/50",
    selected: "bg-amber-200/55 group-hover:bg-amber-200/65"
  },
  terminology: {
    idle: "bg-orange-300/40 group-hover:bg-orange-300/50",
    selected: "bg-orange-300/55 group-hover:bg-orange-300/65"
  },
  density: {
    idle: "bg-blue-300/40 group-hover:bg-blue-300/50",
    selected: "bg-blue-300/55 group-hover:bg-blue-300/65"
  },
  hierarchy: {
    idle: "bg-indigo-300/40 group-hover:bg-indigo-300/50",
    selected: "bg-indigo-300/55 group-hover:bg-indigo-300/65"
  },
  organization: {
    idle: "bg-emerald-300/40 group-hover:bg-emerald-300/50",
    selected: "bg-emerald-300/55 group-hover:bg-emerald-300/65"
  },
  efficiency: {
    idle: "bg-lime-300/40 group-hover:bg-lime-300/50",
    selected: "bg-lime-300/55 group-hover:bg-lime-300/65"
  },
  feedback: {
    idle: "bg-pink-300/40 group-hover:bg-pink-300/50",
    selected: "bg-pink-300/55 group-hover:bg-pink-300/65"
  },
  input: {
    idle: "bg-teal-300/40 group-hover:bg-teal-300/50",
    selected: "bg-teal-300/55 group-hover:bg-teal-300/65"
  },
  navigation: {
    idle: "bg-violet-300/40 group-hover:bg-violet-300/50",
    selected: "bg-violet-300/55 group-hover:bg-violet-300/65"
  },
  handoff: {
    idle: "bg-yellow-300/40 group-hover:bg-yellow-300/50",
    selected: "bg-yellow-300/55 group-hover:bg-yellow-300/65"
  },
  validation: {
    idle: "bg-green-300/40 group-hover:bg-green-300/50",
    selected: "bg-green-300/55 group-hover:bg-green-300/65"
  },
  "design-system": {
    idle: "bg-fuchsia-300/40 group-hover:bg-fuchsia-300/50",
    selected: "bg-fuchsia-300/55 group-hover:bg-fuchsia-300/65"
  },
  color: {
    idle: "bg-red-300/40 group-hover:bg-red-300/50",
    selected: "bg-red-300/55 group-hover:bg-red-300/65"
  },
  imagery: {
    idle: "bg-purple-300/40 group-hover:bg-purple-300/50",
    selected: "bg-purple-300/55 group-hover:bg-purple-300/65"
  },
  layout: {
    idle: "bg-cyan-200/40 group-hover:bg-cyan-200/50",
    selected: "bg-cyan-200/55 group-hover:bg-cyan-200/65"
  }
};
function displayDomainIdentifier(identifier) {
  return identifier.toLocaleLowerCase();
}
function domainFilterFromIdentifier(identifier) {
  return displayDomainIdentifier(identifier).split(".", 1)[0] || "all";
}
function subdomainFromIdentifier(identifier) {
  const [, subdomain] = displayDomainIdentifier(identifier).split(".", 2);
  return subdomain || "unknown";
}
function titleCaseDomainFilter(domain) {
  const normalized = displayDomainIdentifier(domain);
  if (normalized === "ai") return "AI";
  return normalized.split("-").map((part) => `${part.charAt(0).toLocaleUpperCase()}${part.slice(1)}`).join(" ");
}
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
function toggledRulePath(selectedRuleId, nextRuleId) {
  return selectedRuleId === nextRuleId ? "" : rulePath(nextRuleId);
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
function filterRules(rules, domain, query) {
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return rules.filter((rule) => {
    if (domain !== "all" && !rule.domain.startsWith(`${domain}.`)) return false;
    if (!terms.length) return true;
    const text = searchableText(rule);
    return terms.every((term) => text.includes(term));
  });
}
function detailRowEndIndex(selectedIndex, resultCount, columnCount) {
  if (selectedIndex < 0 || resultCount < 1) return -1;
  return Math.min(
    resultCount - 1,
    Math.floor(selectedIndex / columnCount) * columnCount + columnCount - 1
  );
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
var DOMAIN_STYLES = {
  all: {
    idle: "border-border/60 bg-background/45 hover:border-foreground/15 hover:bg-background/55",
    selected: "border-foreground/20 bg-background/55 text-foreground ring-1 ring-foreground/8",
    meshStartIdle: "bg-muted/40 group-hover:bg-muted/50",
    meshStartSelected: "bg-muted/55 group-hover:bg-muted/65",
    meshEndIdle: "bg-accent/35 group-hover:bg-accent/45",
    meshEndSelected: "bg-accent/50 group-hover:bg-accent/60"
  },
  accessibility: {
    idle: "border-emerald-400/10 bg-background/45 hover:border-emerald-400/25 hover:bg-background/55",
    selected: "border-emerald-400/30 bg-background/55 text-foreground ring-1 ring-emerald-400/20",
    meshStartIdle: "bg-emerald-300/40 group-hover:bg-emerald-300/50",
    meshStartSelected: "bg-emerald-300/55 group-hover:bg-emerald-300/65",
    meshEndIdle: "bg-cyan-300/35 group-hover:bg-cyan-300/45",
    meshEndSelected: "bg-cyan-300/50 group-hover:bg-cyan-300/60"
  },
  ai: {
    idle: "border-indigo-400/10 bg-background/45 hover:border-indigo-400/25 hover:bg-background/55",
    selected: "border-indigo-400/30 bg-background/55 text-foreground ring-1 ring-indigo-400/20",
    meshStartIdle: "bg-indigo-300/40 group-hover:bg-indigo-300/50",
    meshStartSelected: "bg-indigo-300/55 group-hover:bg-indigo-300/65",
    meshEndIdle: "bg-violet-300/35 group-hover:bg-violet-300/45",
    meshEndSelected: "bg-violet-300/50 group-hover:bg-violet-300/60"
  },
  content: {
    idle: "border-amber-400/10 bg-background/45 hover:border-amber-400/25 hover:bg-background/55",
    selected: "border-amber-400/30 bg-background/55 text-foreground ring-1 ring-amber-400/20",
    meshStartIdle: "bg-amber-300/40 group-hover:bg-amber-300/50",
    meshStartSelected: "bg-amber-300/55 group-hover:bg-amber-300/65",
    meshEndIdle: "bg-rose-300/35 group-hover:bg-rose-300/45",
    meshEndSelected: "bg-rose-300/50 group-hover:bg-rose-300/60"
  },
  information: {
    idle: "border-sky-400/10 bg-background/45 hover:border-sky-400/25 hover:bg-background/55",
    selected: "border-sky-400/30 bg-background/55 text-foreground ring-1 ring-sky-400/20",
    meshStartIdle: "bg-sky-300/40 group-hover:bg-sky-300/50",
    meshStartSelected: "bg-sky-300/55 group-hover:bg-sky-300/65",
    meshEndIdle: "bg-indigo-300/35 group-hover:bg-indigo-300/45",
    meshEndSelected: "bg-indigo-300/50 group-hover:bg-indigo-300/60"
  },
  interaction: {
    idle: "border-violet-400/10 bg-background/45 hover:border-violet-400/25 hover:bg-background/55",
    selected: "border-violet-400/30 bg-background/55 text-foreground ring-1 ring-violet-400/20",
    meshStartIdle: "bg-violet-300/40 group-hover:bg-violet-300/50",
    meshStartSelected: "bg-violet-300/55 group-hover:bg-violet-300/65",
    meshEndIdle: "bg-pink-300/35 group-hover:bg-pink-300/45",
    meshEndSelected: "bg-pink-300/50 group-hover:bg-pink-300/60"
  },
  process: {
    idle: "border-orange-400/10 bg-background/45 hover:border-orange-400/25 hover:bg-background/55",
    selected: "border-orange-400/30 bg-background/55 text-foreground ring-1 ring-orange-400/20",
    meshStartIdle: "bg-orange-300/40 group-hover:bg-orange-300/50",
    meshStartSelected: "bg-orange-300/55 group-hover:bg-orange-300/65",
    meshEndIdle: "bg-yellow-300/35 group-hover:bg-yellow-300/45",
    meshEndSelected: "bg-yellow-300/50 group-hover:bg-yellow-300/60"
  },
  system: {
    idle: "border-teal-400/10 bg-background/45 hover:border-teal-400/25 hover:bg-background/55",
    selected: "border-teal-400/30 bg-background/55 text-foreground ring-1 ring-teal-400/20",
    meshStartIdle: "bg-teal-300/40 group-hover:bg-teal-300/50",
    meshStartSelected: "bg-teal-300/55 group-hover:bg-teal-300/65",
    meshEndIdle: "bg-lime-300/35 group-hover:bg-lime-300/45",
    meshEndSelected: "bg-lime-300/50 group-hover:bg-lime-300/60"
  },
  visual: {
    idle: "border-rose-400/10 bg-background/45 hover:border-rose-400/25 hover:bg-background/55",
    selected: "border-rose-400/30 bg-background/55 text-foreground ring-1 ring-rose-400/20",
    meshStartIdle: "bg-rose-300/40 group-hover:bg-rose-300/50",
    meshStartSelected: "bg-rose-300/55 group-hover:bg-rose-300/65",
    meshEndIdle: "bg-purple-300/35 group-hover:bg-purple-300/45",
    meshEndSelected: "bg-purple-300/50 group-hover:bg-purple-300/60"
  }
};
function MeshFill({ start, end }) {
  return /* @__PURE__ */ jsxs(
    "span",
    {
      "aria-hidden": "true",
      className: "pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit] opacity-[0.85]",
      children: [
        /* @__PURE__ */ jsx(
          "span",
          {
            className: `absolute -left-3 -top-3 h-8 w-2/3 rounded-full blur-md transition-colors duration-200 ${start}`
          }
        ),
        /* @__PURE__ */ jsx(
          "span",
          {
            className: `absolute -bottom-3 -right-3 h-8 w-2/3 rounded-full blur-md transition-colors duration-200 ${end}`
          }
        )
      ]
    }
  );
}
function domainLabel(domain) {
  return titleCaseDomainFilter(domain);
}
function getGridColumnCount() {
  if (typeof window === "undefined") return 1;
  if (window.matchMedia("(min-width: 1280px)").matches) return 3;
  if (window.matchMedia("(min-width: 768px)").matches) return 2;
  return 1;
}
function useGridColumnCount() {
  const [columnCount, setColumnCount] = useState(getGridColumnCount);
  useEffect(() => {
    const medium = window.matchMedia("(min-width: 768px)");
    const extraLarge = window.matchMedia("(min-width: 1280px)");
    const update = () => setColumnCount(getGridColumnCount());
    medium.addEventListener("change", update);
    extraLarge.addEventListener("change", update);
    return () => {
      medium.removeEventListener("change", update);
      extraLarge.removeEventListener("change", update);
    };
  }, []);
  return columnCount;
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
function DomainPills({
  domains,
  selectedDomain,
  onSelect
}) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      className: "flex min-w-0 flex-1 flex-wrap items-center gap-1.5 lg:flex-nowrap",
      role: "group",
      "aria-label": "Filter by domain",
      children: ["all", ...domains].map((domain) => {
        const selected = selectedDomain === domain;
        const style = DOMAIN_STYLES[domain] ?? DOMAIN_STYLES.all;
        const label = domainLabel(domain);
        const meshStart = selected ? style.meshStartSelected : style.meshStartIdle;
        const meshEnd = selected ? style.meshEndSelected : style.meshEndIdle;
        return /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            className: `group relative isolate cursor-pointer overflow-hidden rounded-full border px-3 py-1 text-xs font-medium text-foreground shadow-xs backdrop-blur-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${selected ? style.selected : style.idle}`,
            "aria-label": domain === "all" ? "Show all domains" : `Show ${label} domain`,
            "aria-pressed": selected,
            onClick: () => onSelect(domain),
            children: [
              /* @__PURE__ */ jsx(MeshFill, { start: meshStart, end: meshEnd }),
              /* @__PURE__ */ jsx("span", { className: "relative z-10", children: label })
            ]
          },
          domain
        );
      })
    }
  );
}
function DomainIdentifierPill({
  identifier,
  selectedDomain,
  onSelect
}) {
  const filterDomain = domainFilterFromIdentifier(identifier);
  const selected = selectedDomain === filterDomain;
  const style = DOMAIN_STYLES[filterDomain] ?? DOMAIN_STYLES.all;
  const subdomainMesh = SUBDOMAIN_MESH_STYLES[subdomainFromIdentifier(identifier)] ?? {
    idle: "bg-accent/35 group-hover:bg-accent/45",
    selected: "bg-accent/50 group-hover:bg-accent/60"
  };
  const label = displayDomainIdentifier(identifier);
  const meshStart = selected ? style.meshStartSelected : style.meshStartIdle;
  const meshEnd = selected ? subdomainMesh.selected : subdomainMesh.idle;
  return /* @__PURE__ */ jsxs(
    "button",
    {
      type: "button",
      className: `group relative isolate inline-flex max-w-full cursor-pointer items-center overflow-hidden rounded-full border px-2 py-0.5 text-[11px] font-medium leading-4 text-foreground shadow-xs backdrop-blur-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${selected ? style.selected : style.idle}`,
      "aria-label": `Filter rules by ${filterDomain} domain`,
      "aria-pressed": selected,
      onClick: () => onSelect(filterDomain),
      children: [
        /* @__PURE__ */ jsx(MeshFill, { start: meshStart, end: meshEnd }),
        /* @__PURE__ */ jsx("span", { className: "relative z-10 truncate", children: label })
      ]
    }
  );
}
function RuleCard({
  rule,
  selected,
  selectedDomain,
  onToggle,
  onSelectDomain
}) {
  const detailId = `rule-detail-${rule.id}`;
  return /* @__PURE__ */ jsxs(
    "article",
    {
      className: `relative min-w-0 rounded-xl border bg-card text-card-foreground shadow-sm transition-colors hover:border-foreground/20 hover:bg-muted/30 ${selected ? "border-foreground/25 bg-muted/30 ring-1 ring-foreground/10" : "border-border"}`,
      id: `rule-card-${rule.id}`,
      children: [
        /* @__PURE__ */ jsxs("div", { className: "pointer-events-none relative z-10 flex h-full flex-col p-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex w-full items-center justify-between gap-3", children: [
            /* @__PURE__ */ jsx("div", { className: "pointer-events-auto min-w-0", children: /* @__PURE__ */ jsx(
              DomainIdentifierPill,
              {
                identifier: rule.domain,
                selectedDomain,
                onSelect: onSelectDomain
              }
            ) }),
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
        ] }),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            className: "absolute inset-0 z-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            "aria-label": `${selected ? "Collapse" : "Expand"} rule: ${rule.title}`,
            "aria-controls": detailId,
            "aria-expanded": selected,
            onClick: onToggle
          }
        )
      ]
    }
  );
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
function RuleDetail({
  rule,
  requestedId,
  selectedDomain,
  onClose,
  onSelectDomain
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
    "article",
    {
      id: `rule-detail-${requestedId}`,
      className: "relative col-span-full overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-sm",
      "aria-labelledby": "doctrine-rule-title",
      children: /* @__PURE__ */ jsxs("div", { className: "mx-auto w-full max-w-5xl px-5 pb-8 pt-6 md:px-8 md:pb-10 md:pt-8", children: [
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
        rule ? /* @__PURE__ */ jsxs(Fragment2, { children: [
          /* @__PURE__ */ jsxs("header", { className: "border-b border-border pb-6 pr-10", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(
                DomainIdentifierPill,
                {
                  identifier: rule.domain,
                  selectedDomain,
                  onSelect: onSelectDomain
                }
              ),
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
      ] })
    }
  );
}
function DoctrineLibrary({ subPath }) {
  const rpc = useRpc();
  const navigate = useBbNavigate();
  const connectionState = useRealtimeConnectionState();
  const previousConnectionState = useRef(connectionState);
  const hasConnected = useRef(connectionState !== "connecting");
  const [library, setLibrary] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [domain, setDomain] = useState("all");
  const detailRef = useRef(null);
  const columnCount = useGridColumnCount();
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
  useEffect(() => {
    const previous = previousConnectionState.current;
    previousConnectionState.current = connectionState;
    if (connectionState !== "connected" || previous === "connected") return;
    if (hasConnected.current) void load();
    hasConnected.current = true;
  }, [connectionState, load]);
  const results = useMemo(() => {
    if (!library) return [];
    return filterRules(library.rules, domain, query);
  }, [domain, library, query]);
  const closeDetail = useCallback(() => {
    navigate.toPluginPanel("library", { subPath: "", replace: true });
  }, [navigate]);
  const selectedRule = library?.rules.find((rule) => rule.id === requestedId) ?? null;
  const selectedResultIndex = results.findIndex((rule) => rule.id === requestedId);
  const detailAfterIndex = detailRowEndIndex(
    selectedResultIndex,
    results.length,
    columnCount
  );
  useEffect(() => {
    if (!requestedId || selectedResultIndex < 0) return;
    const frame = window.requestAnimationFrame(() => {
      detailRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [columnCount, requestedId, selectedResultIndex]);
  useEffect(() => {
    if (requestedId && selectedRule && selectedResultIndex < 0) closeDetail();
  }, [closeDetail, requestedId, selectedResultIndex, selectedRule]);
  return /* @__PURE__ */ jsxs("main", { className: "flex h-full min-h-0 flex-col bg-background text-foreground", children: [
    /* @__PURE__ */ jsxs("section", { className: "flex shrink-0 flex-wrap items-center gap-2 border-b border-border bg-background px-4 py-3 lg:flex-nowrap", "aria-label": "Filter design doctrine", children: [
      /* @__PURE__ */ jsx(
        "input",
        {
          type: "search",
          className: "h-9 w-full min-w-0 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring sm:w-56 lg:w-64",
          "aria-label": "Search doctrine",
          placeholder: "Search rules\u2026",
          value: query,
          onChange: (event) => setQuery(event.currentTarget.value)
        }
      ),
      /* @__PURE__ */ jsx(
        DomainPills,
        {
          domains: library?.domains ?? [],
          selectedDomain: domain,
          onSelect: setDomain
        }
      ),
      /* @__PURE__ */ jsx("div", { className: "ml-auto flex h-9 shrink-0 items-center", children: /* @__PURE__ */ jsxs("span", { className: "shrink-0 text-xs tabular-nums text-muted-foreground", role: "status", children: [
        results.length,
        " ",
        results.length === 1 ? "rule" : "rules"
      ] }) })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "min-h-0 flex-1 overflow-y-auto p-4", children: error ? /* @__PURE__ */ jsxs("div", { className: "grid min-h-72 place-content-center text-center", children: [
      /* @__PURE__ */ jsx("strong", { className: "text-sm font-semibold", children: "Could not load doctrine" }),
      /* @__PURE__ */ jsx("p", { className: "mt-1 max-w-md text-sm text-muted-foreground", children: error }),
      /* @__PURE__ */ jsx("button", { type: "button", className: "mx-auto mt-4 rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted", onClick: () => void load(), children: "Retry" })
    ] }) : loading && !library ? /* @__PURE__ */ jsx("div", { className: "grid min-h-72 place-content-center text-sm text-muted-foreground", children: "Loading rules\u2026" }) : results.length ? /* @__PURE__ */ jsxs("section", { className: "mx-auto grid w-full max-w-6xl grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3", "aria-label": "Design doctrine rules", children: [
      requestedId && !selectedRule ? /* @__PURE__ */ jsx("div", { className: "col-span-full", ref: detailRef, children: /* @__PURE__ */ jsx(
        RuleDetail,
        {
          rule: null,
          requestedId,
          selectedDomain: domain,
          onClose: closeDetail,
          onSelectDomain: setDomain
        }
      ) }) : null,
      results.map((rule, index) => /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx(
          RuleCard,
          {
            rule,
            selected: requestedId === rule.id,
            selectedDomain: domain,
            onToggle: () => {
              const nextPath = toggledRulePath(requestedId, rule.id);
              if (!nextPath) {
                closeDetail();
                return;
              }
              navigate.toPluginPanel("library", {
                subPath: nextPath,
                replace: requestedId !== null
              });
            },
            onSelectDomain: setDomain
          }
        ),
        index === detailAfterIndex ? /* @__PURE__ */ jsx("div", { className: "col-span-full", ref: detailRef, children: /* @__PURE__ */ jsx(
          RuleDetail,
          {
            rule: selectedRule,
            requestedId,
            selectedDomain: domain,
            onClose: closeDetail,
            onSelectDomain: setDomain
          }
        ) }) : null
      ] }, rule.id))
    ] }) : requestedId && !selectedRule ? /* @__PURE__ */ jsx("div", { className: "mx-auto w-full max-w-6xl", ref: detailRef, children: /* @__PURE__ */ jsx(
      RuleDetail,
      {
        rule: null,
        requestedId,
        selectedDomain: domain,
        onClose: closeDetail,
        onSelectDomain: setDomain
      }
    ) }) : /* @__PURE__ */ jsxs("div", { className: "grid min-h-72 place-content-center text-center", children: [
      /* @__PURE__ */ jsx("strong", { className: "text-sm font-semibold", children: "No rules found" }),
      /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: "Try a different search or filter." })
    ] }) })
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
