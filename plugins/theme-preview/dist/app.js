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

// bb-plugin-runtime-shim:react
var runtime2 = globalThis.__bbPluginRuntime;
if (runtime2 == null || runtime2.react == null) {
  throw new Error('Cannot load "react": this bundle must be loaded by the BB app, which provides the shared plugin runtime (globalThis.__bbPluginRuntime).');
}
var mod2 = runtime2.react;
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
var v = (name, fallback) => fallback === void 0 ? `var(--${name})` : `var(--${name}, ${fallback})`;
var SANS = v("font-sans", "ui-sans-serif, system-ui, sans-serif");
var MONO = v("font-mono", "ui-monospace, SFMono-Regular, Menlo, monospace");
var VIEWS = ["new", "thread", "split", "panel", "overlays", "settings"];
var VIEW_LABEL = {
  new: "New thread",
  thread: "Thread",
  split: "Split",
  panel: "Thread + panel",
  overlays: "Overlays",
  settings: "Settings"
};
var FRAME_W = 1360;
var FRAME_H = 820;
function Dot({ color, size = 7 }) {
  return /* @__PURE__ */ jsx("span", { style: { display: "inline-block", width: size, height: size, borderRadius: 999, background: color, flex: "none" } });
}
function Glyph({ size = 14, color = "currentColor" }) {
  return /* @__PURE__ */ jsx(
    "span",
    {
      style: {
        display: "inline-block",
        width: size,
        height: size,
        borderRadius: Math.max(2, size / 4),
        boxShadow: `inset 0 0 0 1.5px ${color}`,
        flex: "none",
        opacity: 0.85
      }
    }
  );
}
function Eyebrow({ children, style }) {
  return /* @__PURE__ */ jsx("div", { style: { fontFamily: MONO, fontSize: 10.5, letterSpacing: "0.08em", textTransform: "uppercase", color: v("muted-foreground"), ...style }, children });
}
function Badge({ children, tone = "outline" }) {
  const tones = {
    outline: { boxShadow: `inset 0 0 0 1px ${v("border")}`, color: v("foreground") },
    primary: { background: v("primary"), color: v("primary-foreground") },
    secondary: { background: v("secondary"), color: v("secondary-foreground") },
    success: { background: `color-mix(in srgb, ${v("success")} 16%, transparent)`, color: v("success") },
    warning: { background: `color-mix(in srgb, ${v("warning")} 16%, transparent)`, color: v("warning-text", v("warning")) },
    destructive: { background: `color-mix(in srgb, ${v("destructive")} 16%, transparent)`, color: v("destructive-text", v("destructive")) },
    merged: { background: `color-mix(in srgb, ${v("pr-merged")} 16%, transparent)`, color: v("pr-merged") }
  };
  return /* @__PURE__ */ jsx("span", { style: { display: "inline-flex", alignItems: "center", gap: 5, height: 20, padding: "0 7px", borderRadius: 6, fontSize: 11, fontWeight: 500, lineHeight: 1, whiteSpace: "nowrap", ...tones[tone] }, children });
}
function Button({ children, variant = "primary", size = "md", disabled = false }) {
  const variants = {
    primary: { background: v("primary"), color: v("primary-foreground") },
    secondary: { background: v("secondary"), color: v("secondary-foreground") },
    outline: { boxShadow: `inset 0 0 0 1px ${v("border")}`, color: v("foreground") },
    ghost: { color: v("foreground") },
    destructive: { background: v("destructive"), color: v("destructive-foreground") }
  };
  return /* @__PURE__ */ jsx(
    "span",
    {
      style: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        borderRadius: 7,
        whiteSpace: "nowrap",
        height: size === "sm" ? 28 : 32,
        padding: size === "sm" ? "0 10px" : "0 12px",
        fontSize: size === "sm" ? 12.5 : 13,
        fontWeight: 500,
        opacity: disabled ? 0.5 : 1,
        fontFamily: SANS,
        ...variants[variant]
      },
      children
    }
  );
}
function Switch({ on }) {
  return /* @__PURE__ */ jsx("span", { style: { width: 32, height: 18, borderRadius: 999, background: on ? v("primary") : v("input"), position: "relative", display: "inline-block", flex: "none" }, children: /* @__PURE__ */ jsx("span", { style: { position: "absolute", top: 2, left: on ? 16 : 2, width: 14, height: 14, borderRadius: 999, background: on ? v("primary-foreground") : v("background", "#fff"), boxShadow: "0 1px 2px rgba(0,0,0,.25)" } }) });
}
function TextInput({ focused = false, value, placeholder, width = 220 }) {
  return /* @__PURE__ */ jsxs(
    "div",
    {
      style: {
        height: 32,
        width,
        borderRadius: 7,
        boxSizing: "border-box",
        padding: "0 10px",
        display: "flex",
        alignItems: "center",
        gap: 1,
        boxShadow: focused ? `inset 0 0 0 1px ${v("ring")}, 0 0 0 3px color-mix(in srgb, ${v("ring")} 30%, transparent)` : `inset 0 0 0 1px ${v("input")}`,
        background: v("background", "transparent"),
        fontSize: 13,
        fontFamily: SANS,
        color: value ? v("foreground") : v("muted-foreground")
      },
      children: [
        value ?? placeholder,
        focused ? /* @__PURE__ */ jsx("span", { style: { width: 1, height: 15, background: v("foreground") } }) : null
      ]
    }
  );
}
var sidebarScope = { position: "relative", inset: "auto", zIndex: "auto" };
function rowStyle(state) {
  switch (state) {
    case "hover":
      return { background: v("state-hover") };
    case "selected":
      return { background: v("surface-selected"), boxShadow: `inset 0 0 0 1px ${v("surface-selected-border", "transparent")}` };
    case "split":
      return { background: v("bb-sidebar-open-in-split-background", v("surface-selected")) };
    case "active":
      return { background: v("state-active") };
    default:
      return {};
  }
}
function Row({ label, state = "rest", dot, meta, icon }) {
  return /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 8, height: 28, padding: "0 8px", borderRadius: 6, fontSize: 13, color: v("sidebar-foreground"), ...rowStyle(state) }, children: [
    icon ? /* @__PURE__ */ jsx(Glyph, { size: 14 }) : /* @__PURE__ */ jsx(Dot, { color: dot ?? v("muted-foreground") }),
    /* @__PURE__ */ jsx("span", { style: { flex: 1, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }, children: label }),
    meta ? /* @__PURE__ */ jsx("span", { style: { fontSize: 11, color: v("muted-foreground"), fontFamily: MONO }, children: meta }) : null
  ] });
}
function SectionTitle({ children }) {
  return /* @__PURE__ */ jsx("div", { style: { fontSize: 11, fontWeight: 500, color: v("muted-foreground"), padding: "12px 8px 4px" }, children });
}
function Sidebar({ selected, split, hover }) {
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: "fixed bg-sidebar",
      style: {
        ...sidebarScope,
        width: 256,
        height: "100%",
        flex: "none",
        background: v("sidebar"),
        color: v("sidebar-foreground"),
        borderRight: `1px solid ${v("sidebar-border")}`,
        display: "flex",
        flexDirection: "column",
        padding: "0 8px 8px",
        boxSizing: "border-box",
        fontFamily: SANS
      },
      children: [
        /* @__PURE__ */ jsxs("div", { style: { height: 40, display: "flex", alignItems: "center", gap: 7, padding: "0 6px" }, children: [
          /* @__PURE__ */ jsx(Dot, { color: v("destructive"), size: 11 }),
          /* @__PURE__ */ jsx(Dot, { color: v("warning"), size: 11 }),
          /* @__PURE__ */ jsx(Dot, { color: v("success"), size: 11 }),
          /* @__PURE__ */ jsx("div", { style: { flex: 1 } }),
          /* @__PURE__ */ jsx(Glyph, { size: 13, color: v("muted-foreground") })
        ] }),
        /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 8, height: 30, padding: "0 8px", fontSize: 13, fontWeight: 600 }, children: [
          /* @__PURE__ */ jsx("span", { style: { width: 16, height: 16, borderRadius: 4, background: v("primary"), flex: "none" } }),
          /* @__PURE__ */ jsx("span", { style: { flex: 1 }, children: "bb-plugins" }),
          /* @__PURE__ */ jsx("span", { style: { color: v("muted-foreground"), fontSize: 11 }, children: "\u25BE" })
        ] }),
        /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: 6, padding: "6px 0 2px" }, children: [
          /* @__PURE__ */ jsx("div", { style: { flex: 1, height: 28, borderRadius: 7, background: v("primary"), color: v("primary-foreground"), fontSize: 12.5, fontWeight: 500, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }, children: "+ New thread" }),
          /* @__PURE__ */ jsx("div", { style: { width: 28, height: 28, borderRadius: 7, boxShadow: `inset 0 0 0 1px ${v("border")}`, display: "grid", placeItems: "center" }, children: /* @__PURE__ */ jsx(Glyph, { size: 12 }) })
        ] }),
        /* @__PURE__ */ jsx(Row, { icon: true, label: "Extensions" }),
        /* @__PURE__ */ jsx(Row, { icon: true, label: "Automations", meta: "3" }),
        /* @__PURE__ */ jsx(SectionTitle, { children: "Today" }),
        /* @__PURE__ */ jsx(Row, { label: "Endless theme family \u2014 blacklight pass", state: selected ? "selected" : "rest", dot: v("success") }),
        /* @__PURE__ */ jsx(Row, { label: "Specimen sheets + social grid", state: split ? "split" : "rest", dot: v("warning") }),
        /* @__PURE__ */ jsx(Row, { label: "theme-preview plugin", state: hover ? "hover" : "rest", dot: v("primary") }),
        /* @__PURE__ */ jsx(Row, { label: "Crit: endless-color light foil" }),
        /* @__PURE__ */ jsx(SectionTitle, { children: "Yesterday" }),
        /* @__PURE__ */ jsx(Row, { label: "Sidebar brushed-noise overlay" }),
        /* @__PURE__ */ jsx(Row, { label: "Fix pink split row (oklch mix)", dot: v("destructive") }),
        /* @__PURE__ */ jsx(Row, { label: "Hue census battery" }),
        /* @__PURE__ */ jsx("div", { style: { flex: 1 } }),
        /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 8, height: 30, padding: "0 8px", fontSize: 12.5 }, children: [
          /* @__PURE__ */ jsx("span", { style: { width: 18, height: 18, borderRadius: 999, background: v("secondary"), boxShadow: `inset 0 0 0 1px ${v("border")}` } }),
          /* @__PURE__ */ jsx("span", { style: { flex: 1 }, children: "brsbl" }),
          /* @__PURE__ */ jsx(Glyph, { size: 13, color: v("muted-foreground") })
        ] })
      ]
    }
  );
}
var popover = {
  background: v("popover"),
  color: v("popover-foreground"),
  boxShadow: `inset 0 0 0 1px ${v("border")}, ${v("shadow-md", "0 4px 16px rgba(0,0,0,.2)")}`,
  borderRadius: 8,
  fontFamily: SANS,
  fontSize: 13
};
function MenuItem({ children, hover = false, destructive = false, kbd }) {
  return /* @__PURE__ */ jsxs(
    "div",
    {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        height: 28,
        padding: "0 8px",
        borderRadius: 5,
        margin: "0 4px",
        background: hover ? v("accent") : void 0,
        color: destructive ? v("destructive-text", v("destructive")) : hover ? v("accent-foreground") : v("popover-foreground")
      },
      children: [
        /* @__PURE__ */ jsx(Glyph, { size: 12 }),
        /* @__PURE__ */ jsx("span", { style: { flex: 1 }, children }),
        kbd ? /* @__PURE__ */ jsx("span", { style: { fontFamily: MONO, fontSize: 11, color: v("muted-foreground") }, children: kbd }) : null
      ]
    }
  );
}
function ContextMenu({ left, top }) {
  return /* @__PURE__ */ jsxs("div", { style: { ...popover, position: "absolute", left, top, width: 210, padding: "4px 0", zIndex: 5 }, children: [
    /* @__PURE__ */ jsx(MenuItem, { kbd: "\u2318\u21E7O", children: "Open in split" }),
    /* @__PURE__ */ jsx(MenuItem, { hover: true, kbd: "\u2318R", children: "Rename" }),
    /* @__PURE__ */ jsx(MenuItem, { children: "Move to section \u25B8" }),
    /* @__PURE__ */ jsx("div", { style: { height: 1, background: v("border"), margin: "4px 0" } }),
    /* @__PURE__ */ jsx(MenuItem, { children: "Archive" }),
    /* @__PURE__ */ jsx(MenuItem, { destructive: true, children: "Delete thread" })
  ] });
}
function Dialog() {
  return /* @__PURE__ */ jsx("div", { style: { position: "absolute", inset: 0, background: v("surface-scrim", "rgba(0,0,0,.5)"), display: "grid", placeItems: "center", zIndex: 4 }, children: /* @__PURE__ */ jsxs("div", { style: { width: 380, background: v("card"), color: v("card-foreground"), boxShadow: `inset 0 0 0 1px ${v("border")}, ${v("shadow-lift", v("shadow-xl", "0 16px 40px rgba(0,0,0,.35)"))}`, borderRadius: 12, padding: 20, fontFamily: SANS }, children: [
    /* @__PURE__ */ jsx("div", { style: { fontSize: 15, fontWeight: 600, marginBottom: 6 }, children: "Delete thread?" }),
    /* @__PURE__ */ jsx("div", { style: { fontSize: 13, color: v("muted-foreground"), lineHeight: "19px", marginBottom: 18 }, children: "This removes the thread and its timeline. The workspace stays on disk." }),
    /* @__PURE__ */ jsxs("div", { style: { display: "flex", justifyContent: "flex-end", gap: 8 }, children: [
      /* @__PURE__ */ jsx(Button, { variant: "outline", size: "sm", children: "Cancel" }),
      /* @__PURE__ */ jsx(Button, { variant: "destructive", size: "sm", children: "Delete" })
    ] })
  ] }) });
}
function Tooltip({ children, style }) {
  return /* @__PURE__ */ jsx("span", { style: { ...popover, position: "absolute", padding: "5px 9px", fontSize: 12, borderRadius: 6, whiteSpace: "nowrap", zIndex: 5, ...style }, children });
}
var ASSISTANT_MD = `Three blacks were fragmenting the frame. The base theme's \`.fixed.bg-sidebar\` block was overriding the variant's sidebar tokens, so the sidebar rendered \`#1d1d1d\` instead of true black. Scoped the variant's values at the same selector, after the base \u2014 see [build-color.py](https://example.com).

\`\`\`css
.dark .fixed.bg-sidebar {
  --sidebar: #070509;
  --sidebar-border: rgba(255, 106, 31, 0.60);
}
\`\`\`

Sidebar, right panel and seam now agree: **one black**, one orange line.`;
function ToolPill({ name, path }) {
  return /* @__PURE__ */ jsxs(
    "div",
    {
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        height: 26,
        padding: "0 10px 0 8px",
        borderRadius: 7,
        background: v("pill-surface", v("secondary")),
        boxShadow: `inset 0 0 0 1px ${v("border-hairline", v("border"))}, ${v("pill-shadow", "none")}`,
        fontSize: 12,
        color: v("foreground")
      },
      children: [
        /* @__PURE__ */ jsx(Glyph, { size: 12 }),
        /* @__PURE__ */ jsx("span", { style: { fontWeight: 500 }, children: name }),
        /* @__PURE__ */ jsx("span", { style: { fontFamily: MONO, fontSize: 11.5, color: v("file-accent", v("muted-foreground")) }, children: path })
      ]
    }
  );
}
function DiffBlock() {
  const line = (text, kind) => /* @__PURE__ */ jsx("div", { style: { padding: "0 12px", whiteSpace: "pre", background: kind === "add" ? `color-mix(in srgb, ${v("diff-added")} 18%, transparent)` : kind === "del" ? `color-mix(in srgb, ${v("diff-removed")} 18%, transparent)` : void 0 }, children: text }, text);
  return /* @__PURE__ */ jsxs("div", { style: { borderRadius: 8, overflow: "hidden", background: v("surface-recessed-solid"), boxShadow: `inset 0 0 0 1px ${v("border-hairline", v("border"))}`, fontFamily: MONO, fontSize: 12, lineHeight: "19px", color: v("foreground"), padding: "8px 0" }, children: [
    /* @__PURE__ */ jsxs("div", { style: { padding: "0 12px 6px", fontSize: 11, color: v("muted-foreground"), display: "flex", gap: 8 }, children: [
      /* @__PURE__ */ jsx("span", { style: { color: v("file-accent", v("muted-foreground")) }, children: "themes/endless-color.css" }),
      /* @__PURE__ */ jsx("span", { children: "+2 \u22121" })
    ] }),
    line("  .dark .fixed.bg-sidebar {"),
    line("-   --sidebar: #1d1d1d;", "del"),
    line("+   --sidebar: #070509;", "add"),
    line("+   --sidebar-border: rgba(255,106,31,0.60);", "add"),
    line("  }")
  ] });
}
function Composer({ focused = false, text }) {
  return /* @__PURE__ */ jsxs(
    "div",
    {
      style: {
        borderRadius: 12,
        background: v("card"),
        padding: "10px 10px 8px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        boxShadow: focused ? `inset 0 0 0 1px ${v("ring")}, 0 0 0 3px color-mix(in srgb, ${v("ring")} 28%, transparent)` : `inset 0 0 0 1px ${v("input")}, ${v("shadow-sm", "none")}`
      },
      children: [
        /* @__PURE__ */ jsx("div", { style: { fontSize: 13.5, color: text ? v("foreground") : v("muted-foreground"), minHeight: 20 }, children: text ?? "Message the agent\u2026" }),
        /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 6 }, children: [
          /* @__PURE__ */ jsx(Badge, { tone: "secondary", children: "claude-fable-5" }),
          /* @__PURE__ */ jsx(Badge, { tone: "outline", children: "\u2318 plan" }),
          /* @__PURE__ */ jsx("div", { style: { flex: 1 } }),
          /* @__PURE__ */ jsx("div", { style: { width: 26, height: 26, borderRadius: 999, background: text ? v("primary") : v("muted"), display: "grid", placeItems: "center", color: text ? v("primary-foreground") : v("muted-foreground"), fontSize: 12 }, children: "\u2191" })
        ] })
      ]
    }
  );
}
function ThreadHeader({ title, active, narrow, marker }) {
  return /* @__PURE__ */ jsxs("div", { style: { height: 44, display: "flex", alignItems: "center", gap: 8, padding: "0 16px", flex: "none", borderBottom: `1px solid ${v("border-seam", v("border"))}`, position: "relative" }, children: [
    marker && active ? /* @__PURE__ */ jsx("span", { style: { position: "absolute", left: 0, right: 0, top: 0, height: 2, background: v("primary") } }) : null,
    /* @__PURE__ */ jsx("span", { style: { fontSize: 13.5, fontWeight: 600, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }, children: title }),
    /* @__PURE__ */ jsxs(Badge, { tone: "success", children: [
      /* @__PURE__ */ jsx(Dot, { color: v("success"), size: 6 }),
      " Running"
    ] }),
    narrow ? null : /* @__PURE__ */ jsx(Badge, { tone: "outline", children: "bb/endless-theme-plugin" }),
    /* @__PURE__ */ jsx("div", { style: { flex: 1 } }),
    /* @__PURE__ */ jsx(Glyph, { color: v("muted-foreground") }),
    /* @__PURE__ */ jsx(Glyph, { color: v("muted-foreground") }),
    /* @__PURE__ */ jsx(Glyph, { color: v("muted-foreground") })
  ] });
}
function Thread({ title = "Endless theme family \u2014 blacklight pass", active = true, narrow = false, empty = false, marker = false, children }) {
  const pad = narrow ? 18 : 32;
  return /* @__PURE__ */ jsxs("div", { style: { flex: 1, minWidth: 0, height: "100%", background: v("canvas", v("background")), color: v("foreground"), display: "flex", flexDirection: "column", fontFamily: SANS, position: "relative" }, children: [
    empty ? /* @__PURE__ */ jsxs("div", { style: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 22, padding: `0 ${pad}px` }, children: [
      /* @__PURE__ */ jsxs("div", { style: { textAlign: "center" }, children: [
        /* @__PURE__ */ jsx("div", { style: { fontSize: 22, fontWeight: 600, letterSpacing: "-0.01em", marginBottom: 6 }, children: "What are we building?" }),
        /* @__PURE__ */ jsx("div", { style: { fontSize: 13.5, color: v("muted-foreground") }, children: "Pick a project, describe the work, and an agent takes it from here." })
      ] }),
      /* @__PURE__ */ jsx("div", { style: { width: "100%", maxWidth: 680 }, children: /* @__PURE__ */ jsx(Composer, { focused: true, text: "make the blacklight variant feel like the reference \u2014 neon orange seam, blue selection, calm UV canvas" }) }),
      /* @__PURE__ */ jsx("div", { style: { display: "flex", gap: 8 }, children: ["Fix the failing build", "Review open PRs", "Draft release notes"].map((s) => /* @__PURE__ */ jsx("span", { style: { fontSize: 12.5, padding: "6px 12px", borderRadius: 999, boxShadow: `inset 0 0 0 1px ${v("border")}`, color: v("muted-foreground") }, children: s }, s)) })
    ] }) : /* @__PURE__ */ jsxs(Fragment2, { children: [
      /* @__PURE__ */ jsx(ThreadHeader, { title, active, narrow, marker }),
      /* @__PURE__ */ jsxs("div", { style: { flex: 1, overflow: "hidden", padding: `22px ${pad}px 0`, display: "flex", flexDirection: "column", gap: 16, fontSize: 13.5, lineHeight: "21px" }, children: [
        /* @__PURE__ */ jsx("div", { style: { alignSelf: "flex-end", maxWidth: "72%", background: v("card"), boxShadow: `inset 0 0 0 1px ${v("border")}`, borderRadius: 12, padding: "8px 12px" }, children: "make the blacklight variant feel like the reference \u2014 neon orange seam, blue selection, calm UV canvas." }),
        /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: 8, flexWrap: "wrap" }, children: [
          /* @__PURE__ */ jsx(ToolPill, { name: "Read", path: "theme-src/endless/build-color.py" }),
          /* @__PURE__ */ jsx(ToolPill, { name: "Bash", path: "python3 build-color.py 0.035 0.045" })
        ] }),
        /* @__PURE__ */ jsx(Markdown, { content: ASSISTANT_MD }),
        /* @__PURE__ */ jsx(DiffBlock, {}),
        /* @__PURE__ */ jsxs("div", { style: { color: v("muted-foreground"), fontSize: 12.5, display: "flex", alignItems: "center", gap: 8 }, children: [
          /* @__PURE__ */ jsx("span", { style: { width: 1, height: 18, background: v("timeline-accent", v("border")) } }),
          "14:02 \xB7 2 files changed \xB7 ",
          /* @__PURE__ */ jsx("span", { style: { color: v("file-accent", v("muted-foreground")), fontFamily: MONO }, children: "themes/endless-color.css" })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { style: { padding: `12px ${pad}px 16px`, flex: "none" }, children: /* @__PURE__ */ jsx(Composer, { focused: active }) })
    ] }),
    children
  ] });
}
function InfoPanel() {
  const kv = (k, val) => /* @__PURE__ */ jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, fontSize: 12.5, height: 28 }, children: [
    /* @__PURE__ */ jsx("span", { style: { color: v("muted-foreground") }, children: k }),
    /* @__PURE__ */ jsx("span", { style: { color: v("foreground"), textAlign: "right", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }, children: val })
  ] }, k);
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: "fixed bg-sidebar",
      style: { ...sidebarScope, width: 320, height: "100%", flex: "none", background: v("sidebar"), color: v("sidebar-foreground"), borderLeft: `1px solid ${v("sidebar-border")}`, fontFamily: SANS, display: "flex", flexDirection: "column" },
      children: [
        /* @__PURE__ */ jsx("div", { style: { height: 44, display: "flex", alignItems: "center", gap: 2, padding: "0 10px", borderBottom: `1px solid ${v("border-seam", v("border"))}` }, children: ["Info", "Files", "Changes"].map((t, i) => /* @__PURE__ */ jsx("span", { style: { fontSize: 12.5, padding: "0 10px", height: 26, display: "inline-flex", alignItems: "center", borderRadius: 6, background: i === 0 ? v("state-active", v("state-hover")) : void 0, color: i === 0 ? v("foreground") : v("muted-foreground"), fontWeight: i === 0 ? 500 : 400 }, children: t }, t)) }),
        /* @__PURE__ */ jsxs("div", { style: { padding: "14px 16px", display: "flex", flexDirection: "column", gap: 16 }, children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Eyebrow, { style: { marginBottom: 4 }, children: "Thread" }),
            kv("Status", /* @__PURE__ */ jsx(Badge, { tone: "success", children: "Running" })),
            kv("Agent", "Claude Fable 5"),
            kv("Branch", /* @__PURE__ */ jsx("span", { style: { fontFamily: MONO, fontSize: 12 }, children: "bb/endless-theme-plugin" })),
            kv("Pull request", /* @__PURE__ */ jsx(Badge, { tone: "merged", children: "Merged #42" }))
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Eyebrow, { style: { marginBottom: 4 }, children: "Git" }),
            kv("Working tree", /* @__PURE__ */ jsxs("span", { style: { display: "inline-flex", gap: 6, alignItems: "center" }, children: [
              /* @__PURE__ */ jsx(Dot, { color: v("success") }),
              " Clean"
            ] })),
            kv("Ahead", "3 commits")
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Eyebrow, { style: { marginBottom: 4 }, children: "Files" }),
            ["themes/endless-color.css", "build-color.py", "README.md"].map((f) => /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: 8, alignItems: "center", height: 26, fontSize: 12.5, fontFamily: MONO, color: v("file-accent", v("foreground")) }, children: [
              /* @__PURE__ */ jsx(Glyph, { size: 12, color: v("muted-foreground") }),
              f
            ] }, f))
          ] }),
          /* @__PURE__ */ jsx("div", { style: { borderRadius: 8, background: v("surface-recessed-soft-solid", v("card")), boxShadow: `inset 0 0 0 1px ${v("border-hairline", v("border"))}`, padding: "10px 12px", fontSize: 12.5, color: v("readback-foreground", v("muted-foreground")), lineHeight: "18px" }, children: "Sidebar now reads true black with the orange seam; blue selection at .20 over the UV canvas." })
        ] })
      ]
    }
  );
}
function SettingsPage() {
  return /* @__PURE__ */ jsx("div", { style: { flex: 1, minWidth: 0, height: "100%", background: v("canvas", v("background")), color: v("foreground"), fontFamily: SANS, overflow: "hidden" }, children: /* @__PURE__ */ jsxs("div", { style: { maxWidth: 820, margin: "0 auto", padding: "40px 36px" }, children: [
    /* @__PURE__ */ jsxs("div", { style: { borderRadius: 14, padding: "26px 28px", marginBottom: 24, background: `linear-gradient(135deg, ${v("secondary")} 0%, ${v("accent")} 100%)`, boxShadow: `inset 0 0 0 1px ${v("border-hairline", v("border"))}` }, children: [
      /* @__PURE__ */ jsx("div", { style: { fontSize: 22, fontWeight: 600, letterSpacing: "-0.01em", marginBottom: 6 }, children: "Extensions" }),
      /* @__PURE__ */ jsx("div", { style: { fontSize: 13.5, color: v("muted-foreground"), maxWidth: 480, lineHeight: "20px" }, children: "Plugins add surfaces, agents, and themes to bb. Everything here is on by default and reloads in place." })
    ] }),
    /* @__PURE__ */ jsx("div", { style: { display: "flex", gap: 2, borderBottom: `1px solid ${v("border")}`, marginBottom: 18 }, children: ["Installed", "Marketplace", "Themes"].map((t, i) => /* @__PURE__ */ jsx("span", { style: { padding: "7px 12px", fontSize: 13, color: i === 0 ? v("foreground") : v("muted-foreground"), fontWeight: i === 0 ? 500 : 400, boxShadow: i === 0 ? `inset 0 -2px 0 0 ${v("primary")}` : void 0 }, children: t }, t)) }),
    /* @__PURE__ */ jsx("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }, children: ["Endless", "Endless Color", "Theme Preview", "Plugin Guide"].map((name, i) => /* @__PURE__ */ jsxs("div", { style: { borderRadius: 10, background: v("card"), boxShadow: `inset 0 0 0 1px ${v("border")}, ${v("shadow-xs", "none")}`, padding: "12px 14px", display: "flex", gap: 12, alignItems: "center" }, children: [
      /* @__PURE__ */ jsx("span", { style: { width: 32, height: 32, borderRadius: 8, background: v("secondary"), display: "grid", placeItems: "center" }, children: /* @__PURE__ */ jsx(Glyph, { size: 14 }) }),
      /* @__PURE__ */ jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [
        /* @__PURE__ */ jsx("div", { style: { fontSize: 13, fontWeight: 600 }, children: name }),
        /* @__PURE__ */ jsxs("div", { style: { fontSize: 12, color: v("muted-foreground"), whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }, children: [
          "A bb plugin \xB7 v0.1.",
          i
        ] })
      ] }),
      /* @__PURE__ */ jsx(Switch, { on: i !== 3 })
    ] }, name)) })
  ] }) });
}
function FrameView({ view }) {
  switch (view) {
    case "new":
      return /* @__PURE__ */ jsxs(Fragment2, { children: [
        /* @__PURE__ */ jsx(Sidebar, { hover: true }),
        /* @__PURE__ */ jsx(Thread, { empty: true })
      ] });
    case "thread":
      return /* @__PURE__ */ jsxs(Fragment2, { children: [
        /* @__PURE__ */ jsx(Sidebar, { selected: true }),
        /* @__PURE__ */ jsx(Thread, {})
      ] });
    case "split":
      return /* @__PURE__ */ jsxs(Fragment2, { children: [
        /* @__PURE__ */ jsx(Sidebar, { selected: true, split: true }),
        /* @__PURE__ */ jsx(Thread, { narrow: true, marker: true }),
        /* @__PURE__ */ jsx("div", { style: { width: 1, background: v("border-seam-vertical", v("border-seam", v("border"))), flex: "none" } }),
        /* @__PURE__ */ jsx(Thread, { title: "Specimen sheets + social grid", active: false, narrow: true, marker: true })
      ] });
    case "panel":
      return /* @__PURE__ */ jsxs(Fragment2, { children: [
        /* @__PURE__ */ jsx(Sidebar, { selected: true }),
        /* @__PURE__ */ jsx(Thread, {}),
        /* @__PURE__ */ jsx(InfoPanel, {})
      ] });
    case "overlays":
      return /* @__PURE__ */ jsxs(Fragment2, { children: [
        /* @__PURE__ */ jsx(Sidebar, { selected: true }),
        /* @__PURE__ */ jsx(Thread, { children: /* @__PURE__ */ jsx(Tooltip, { style: { right: 64, top: 48 }, children: "Open side panel \u2318I" }) }),
        /* @__PURE__ */ jsx(ContextMenu, { left: 132, top: 216 }),
        /* @__PURE__ */ jsx(Dialog, {})
      ] });
    case "settings":
      return /* @__PURE__ */ jsxs(Fragment2, { children: [
        /* @__PURE__ */ jsx(Sidebar, {}),
        /* @__PURE__ */ jsx(SettingsPage, {})
      ] });
  }
}
function Frame({ view }) {
  const hostRef = useRef(null);
  const [zoom, setZoom] = useState(0.8);
  useLayoutEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const measure = () => setZoom(Math.min(1, Math.max(0.2, el.clientWidth / FRAME_W)));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return /* @__PURE__ */ jsx("div", { ref: hostRef, style: { width: "100%", height: FRAME_H * zoom }, children: /* @__PURE__ */ jsx(
    "div",
    {
      style: {
        width: FRAME_W,
        height: FRAME_H,
        zoom,
        display: "flex",
        overflow: "hidden",
        borderRadius: 12,
        position: "relative",
        boxShadow: v("shadow-lg", "0 10px 30px rgba(0,0,0,.25)"),
        background: v("canvas", v("background"))
      },
      children: /* @__PURE__ */ jsx(FrameView, { view })
    }
  ) });
}
var SURFACES = ["canvas", "sidebar", "card", "popover", "secondary", "muted", "surface-recessed-solid"];
var INKS = ["foreground", "muted-foreground", "subtle-foreground", "readback-foreground"];
var ACCENTS = ["primary", "file-accent", "timeline-accent", "success", "warning", "destructive", "pr-merged"];
var LINES = ["border", "border-hairline", "border-seam", "sidebar-border", "input", "ring"];
function toHex(rgb) {
  const m = /rgba?\(([^)]+)\)/.exec(rgb);
  if (!m) return rgb;
  const parts = m[1].split(",").map((p) => parseFloat(p.trim()));
  const [r, g, b] = parts;
  const a = parts[3];
  const hex = "#" + [r, g, b].map((c) => Math.round(c).toString(16).padStart(2, "0")).join("");
  return a !== void 0 && a < 1 ? `${hex} \xB7 ${Math.round(a * 100)}%` : hex;
}
function useComputedTokens(names) {
  const [out, setOut] = useState({});
  useEffect(() => {
    const rootStyle = getComputedStyle(document.documentElement);
    const probe = document.createElement("div");
    probe.className = "fixed bg-sidebar";
    probe.style.cssText = "position:fixed;left:-9999px;top:-9999px;width:0;height:0;pointer-events:none";
    document.body.appendChild(probe);
    const sidebarStyle = getComputedStyle(probe);
    const swatch = document.createElement("span");
    swatch.style.cssText = "position:fixed;left:-9999px;top:-9999px;width:1px;height:1px";
    document.body.appendChild(swatch);
    const next = {};
    for (const name of names) {
      const value = rootStyle.getPropertyValue(`--${name}`).trim();
      const scoped = sidebarStyle.getPropertyValue(`--${name}`).trim();
      swatch.style.backgroundColor = "";
      swatch.style.backgroundColor = `var(--${name})`;
      const hex = value ? toHex(getComputedStyle(swatch).backgroundColor) : "\u2014";
      next[name] = { value, hex, sidebar: scoped && scoped !== value ? scoped : null };
    }
    probe.remove();
    swatch.remove();
    setOut(next);
  }, [names]);
  return out;
}
function GuideBlock({ title, note, children, span = 1 }) {
  return /* @__PURE__ */ jsxs("div", { "data-tp-guide-block": true, style: { gridColumn: `span ${span}`, minWidth: 0 }, children: [
    /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "baseline", gap: 10, marginBottom: 10 }, children: [
      /* @__PURE__ */ jsx("span", { style: { fontSize: 13, fontWeight: 600, color: v("foreground") }, children: title }),
      note ? /* @__PURE__ */ jsx("span", { style: { fontSize: 12, color: v("muted-foreground") }, children: note }) : null
    ] }),
    children
  ] });
}
function Swatch({ name, computed, tall = false }) {
  const c = computed[name];
  return /* @__PURE__ */ jsxs("div", { style: { minWidth: 0 }, children: [
    /* @__PURE__ */ jsx("div", { style: { height: tall ? 64 : 40, borderRadius: 8, background: v(name), boxShadow: `inset 0 0 0 1px ${v("border-hairline", v("border"))}` } }),
    /* @__PURE__ */ jsx("div", { style: { fontFamily: MONO, fontSize: 10.5, lineHeight: "15px", marginTop: 6, color: v("foreground"), overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }, children: name }),
    /* @__PURE__ */ jsx("div", { style: { fontFamily: MONO, fontSize: 10.5, lineHeight: "15px", color: v("muted-foreground"), overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }, title: c?.value, children: c?.hex ?? "" }),
    c?.sidebar ? /* @__PURE__ */ jsxs("div", { style: { fontFamily: MONO, fontSize: 10.5, lineHeight: "15px", color: v("warning-text", v("warning")), overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }, title: c.sidebar, children: [
      "sidebar ",
      c.sidebar
    ] }) : null
  ] });
}
var ALL_TOKENS = [...SURFACES, ...INKS, ...ACCENTS, ...LINES];
function StyleGuide() {
  const computed = useComputedTokens(ALL_TOKENS);
  const inkSample = (scopeLabel, bg, className) => /* @__PURE__ */ jsxs("div", { className, style: { ...className ? sidebarScope : {}, background: bg, borderRadius: 10, padding: "14px 16px", boxShadow: `inset 0 0 0 1px ${v("border-hairline", v("border"))}`, display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }, children: [
    /* @__PURE__ */ jsx(Eyebrow, { children: scopeLabel }),
    /* @__PURE__ */ jsx("div", { style: { fontSize: 15, fontWeight: 600, color: className ? v("sidebar-foreground") : v("foreground"), letterSpacing: "-0.005em" }, children: "Title \xB7 foreground 600" }),
    /* @__PURE__ */ jsx("div", { style: { fontSize: 13.5, color: className ? v("sidebar-foreground") : v("foreground"), lineHeight: "20px" }, children: "Body text at 13.5 \u2014 the thing most pixels are." }),
    /* @__PURE__ */ jsx("div", { style: { fontSize: 13, color: v("muted-foreground") }, children: "Muted \xB7 labels, captions, timestamps" }),
    /* @__PURE__ */ jsx("div", { style: { fontSize: 12.5, color: v("subtle-foreground", v("muted-foreground")) }, children: "Subtle \xB7 secondary metadata" }),
    /* @__PURE__ */ jsxs("div", { style: { fontSize: 13, color: className ? v("sidebar-foreground") : v("foreground") }, children: [
      "inline ",
      /* @__PURE__ */ jsx("code", { style: { fontFamily: MONO, fontSize: "0.92em", fontWeight: 600, background: v("surface-recessed"), padding: "1px 5px", borderRadius: 4 }, children: "--token" }),
      " \xB7 ",
      /* @__PURE__ */ jsx("span", { style: { fontFamily: MONO, fontSize: 12.5, color: v("file-accent", "inherit") }, children: "path/file.tsx" }),
      " \xB7 ",
      /* @__PURE__ */ jsx("span", { style: { color: v("primary"), textDecoration: "underline", textUnderlineOffset: 3 }, children: "link" })
    ] })
  ] });
  return /* @__PURE__ */ jsxs("div", { "data-tp-guide-grid": true, style: { display: "grid", gridTemplateColumns: "repeat(12, 1fr)", columnGap: 28, rowGap: 30 }, children: [
    /* @__PURE__ */ jsx(GuideBlock, { title: "Surfaces", note: "the rooms, darkest to lightest in the ramp", span: 12, children: /* @__PURE__ */ jsx("div", { style: { display: "grid", gridTemplateColumns: `repeat(${SURFACES.length}, 1fr)`, gap: 10 }, children: SURFACES.map((n) => /* @__PURE__ */ jsx(Swatch, { name: n, computed, tall: true }, n)) }) }),
    /* @__PURE__ */ jsx(GuideBlock, { title: "Ink", note: "the same ramp on canvas and on the sidebar scope", span: 7, children: /* @__PURE__ */ jsxs("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }, children: [
      inkSample("on canvas", v("canvas", v("background"))),
      inkSample("on sidebar", v("sidebar"), "fixed bg-sidebar")
    ] }) }),
    /* @__PURE__ */ jsx(GuideBlock, { title: "Accent & status", span: 5, children: /* @__PURE__ */ jsx("div", { style: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }, children: ACCENTS.map((n) => /* @__PURE__ */ jsx(Swatch, { name: n, computed }, n)) }) }),
    /* @__PURE__ */ jsx(GuideBlock, { title: "Lines", note: "1px, drawn on canvas", span: 5, children: /* @__PURE__ */ jsx("div", { style: { display: "flex", flexDirection: "column", gap: 10 }, children: LINES.map((n) => /* @__PURE__ */ jsxs("div", { style: { display: "grid", gridTemplateColumns: "120px 1fr auto", alignItems: "center", gap: 12, fontFamily: MONO, fontSize: 10.5 }, children: [
      /* @__PURE__ */ jsx("span", { style: { color: v("foreground") }, children: n }),
      /* @__PURE__ */ jsx("span", { style: { height: 1, background: v(n) } }),
      /* @__PURE__ */ jsx("span", { style: { color: v("muted-foreground") }, children: computed[n]?.hex ?? "" })
    ] }, n)) }) }),
    /* @__PURE__ */ jsx(GuideBlock, { title: "Controls", span: 7, children: /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexDirection: "column", gap: 12 }, children: [
      /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }, children: [
        /* @__PURE__ */ jsx(Button, { children: "Primary" }),
        /* @__PURE__ */ jsx(Button, { variant: "secondary", children: "Secondary" }),
        /* @__PURE__ */ jsx(Button, { variant: "outline", children: "Outline" }),
        /* @__PURE__ */ jsx(Button, { variant: "ghost", children: "Ghost" }),
        /* @__PURE__ */ jsx(Button, { variant: "destructive", children: "Destructive" }),
        /* @__PURE__ */ jsx(Button, { disabled: true, children: "Disabled" })
      ] }),
      /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }, children: [
        /* @__PURE__ */ jsx(TextInput, { placeholder: "Search threads\u2026", width: 200 }),
        /* @__PURE__ */ jsx(TextInput, { focused: true, value: "endless-color", width: 200 }),
        /* @__PURE__ */ jsx(Switch, { on: true }),
        /* @__PURE__ */ jsx(Switch, { on: false }),
        /* @__PURE__ */ jsx("span", { style: { width: 16, height: 16, borderRadius: 4, background: v("primary"), color: v("primary-foreground"), display: "grid", placeItems: "center", fontSize: 11 }, children: "\u2713" }),
        /* @__PURE__ */ jsx("span", { style: { width: 16, height: 16, borderRadius: 4, boxShadow: `inset 0 0 0 1px ${v("input")}` } })
      ] }),
      /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: 6, flexWrap: "wrap" }, children: [
        /* @__PURE__ */ jsx(Badge, { tone: "primary", children: "Primary" }),
        /* @__PURE__ */ jsx(Badge, { tone: "secondary", children: "Secondary" }),
        /* @__PURE__ */ jsx(Badge, { tone: "outline", children: "Outline" }),
        /* @__PURE__ */ jsxs(Badge, { tone: "success", children: [
          /* @__PURE__ */ jsx(Dot, { color: v("success"), size: 6 }),
          " Running"
        ] }),
        /* @__PURE__ */ jsx(Badge, { tone: "warning", children: "Attention" }),
        /* @__PURE__ */ jsx(Badge, { tone: "destructive", children: "Failed" }),
        /* @__PURE__ */ jsx(Badge, { tone: "merged", children: "Merged" })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx(GuideBlock, { title: "Sidebar row states", note: "1:1, inside the real sidebar scope", span: 5, children: /* @__PURE__ */ jsx("div", { className: "fixed bg-sidebar", style: { ...sidebarScope, overflow: "hidden", background: v("sidebar"), boxShadow: `inset 0 0 0 1px ${v("sidebar-border")}`, borderRadius: 10, padding: 8, display: "flex", flexDirection: "column", gap: 2 }, children: ["rest", "hover", "selected", "split", "active"].map((s) => /* @__PURE__ */ jsx(Row, { label: s === "split" ? "open in split" : s, state: s, dot: v("success"), meta: s === "rest" ? "" : s === "hover" ? "state-hover" : s === "selected" ? "surface-selected" : s === "split" ? "open-in-split" : "state-active" }, s)) }) }),
    /* @__PURE__ */ jsx(GuideBlock, { title: "Menu & popover", span: 3, children: /* @__PURE__ */ jsxs("div", { style: { ...popover, padding: "4px 0" }, children: [
      /* @__PURE__ */ jsx(MenuItem, { kbd: "\u2318\u21E7O", children: "Open in split" }),
      /* @__PURE__ */ jsx(MenuItem, { hover: true, kbd: "\u2318R", children: "Rename" }),
      /* @__PURE__ */ jsx(MenuItem, { children: "Move to section \u25B8" }),
      /* @__PURE__ */ jsx("div", { style: { height: 1, background: v("border"), margin: "4px 0" } }),
      /* @__PURE__ */ jsx(MenuItem, { destructive: true, children: "Delete thread" })
    ] }) }),
    /* @__PURE__ */ jsx(GuideBlock, { title: "Message surfaces", span: 4, children: /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexDirection: "column", gap: 10 }, children: [
      /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: 8, flexWrap: "wrap" }, children: [
        /* @__PURE__ */ jsx(ToolPill, { name: "Edit", path: "build-color.py" }),
        /* @__PURE__ */ jsx(ToolPill, { name: "Bash", path: "npm test" })
      ] }),
      /* @__PURE__ */ jsx(DiffBlock, {})
    ] }) })
  ] });
}
function Segmented({ value, onChange }) {
  return /* @__PURE__ */ jsx("div", { "data-tp-view-switcher": true, style: { display: "inline-flex", gap: 2, padding: 3, borderRadius: 9, background: v("surface-recessed", v("muted")), boxShadow: `inset 0 0 0 1px ${v("border-hairline", "transparent")}` }, children: VIEWS.map((view) => {
    const active = view === value;
    return /* @__PURE__ */ jsx(
      "button",
      {
        type: "button",
        onClick: () => onChange(view),
        style: {
          appearance: "none",
          border: 0,
          cursor: "pointer",
          fontFamily: SANS,
          fontSize: 12.5,
          fontWeight: active ? 600 : 500,
          height: 26,
          padding: "0 11px",
          borderRadius: 6,
          background: active ? v("card") : "transparent",
          color: active ? v("foreground") : v("muted-foreground"),
          boxShadow: active ? `inset 0 0 0 1px ${v("border")}, ${v("shadow-xs", "none")}` : "none"
        },
        children: VIEW_LABEL[view]
      },
      view
    );
  }) });
}
function useColorMode() {
  const read = () => document.documentElement.classList.contains("dark") ? "dark" : "light";
  const [mode, setMode] = useState(read);
  useEffect(() => {
    const mo = new MutationObserver(() => setMode(read()));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => mo.disconnect();
  }, []);
  const set = (next) => {
    document.documentElement.classList.toggle("dark", next === "dark");
    document.documentElement.style.colorScheme = next;
    setMode(next);
  };
  return [mode, set];
}
function PreviewPage({ subPath }) {
  const rpc = useRpc();
  const [mode, setMode] = useColorMode();
  const navigate = useBbNavigate();
  const [catalog, setCatalog] = useState({ activeThemeId: null, themes: [] });
  const [error, setError] = useState(null);
  const view = useMemo(() => {
    const first = subPath.split("/").filter(Boolean)[0] ?? "";
    return VIEWS.includes(first) ? first : "thread";
  }, [subPath]);
  useEffect(() => {
    let cancelled = false;
    rpc.call("themeCatalog", {}).then((c) => {
      if (!cancelled) setCatalog(c);
    }).catch((e) => setError(String(e)));
    return () => {
      cancelled = true;
    };
  }, [rpc]);
  const setView = (next) => navigate.toPluginPanel("preview", { subPath: next });
  return /* @__PURE__ */ jsxs("div", { "data-tp-root": true, className: "tp-root", style: { height: "100%", overflowY: "auto", overscrollBehavior: "contain", background: v("canvas", v("background")), color: v("foreground"), fontFamily: SANS }, children: [
    /* @__PURE__ */ jsx("style", { children: `
        .tp-root {
          container-name: theme-preview;
          container-type: inline-size;
        }
        @container theme-preview (max-width: 600px) {
          [data-tp-content] {
            padding: 16px 16px 56px !important;
          }
          [data-tp-toolbar] {
            align-items: stretch !important;
            flex-wrap: wrap !important;
            gap: 10px !important;
          }
          [data-tp-view-switcher] {
            display: grid !important;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            width: 100%;
          }
          [data-tp-view-switcher] button {
            min-width: 0;
            padding: 0 4px !important;
            white-space: nowrap;
          }
          [data-tp-toolbar-spacer] {
            display: none;
          }
          [data-tp-theme-picker] {
            flex: 1;
            justify-content: flex-end;
            min-width: 0;
          }
          [data-tp-theme-picker] select {
            min-width: 0;
          }
          [data-tp-guide-heading] {
            align-items: flex-start !important;
            flex-direction: column;
            gap: 4px !important;
          }
          [data-tp-guide-grid] > [data-tp-guide-block] {
            grid-column: 1 / -1 !important;
          }
        }
      ` }),
    /* @__PURE__ */ jsxs("div", { "data-tp-content": true, style: { maxWidth: 1280, margin: "0 auto", padding: "24px 28px 72px" }, children: [
      /* @__PURE__ */ jsxs("div", { "data-tp-toolbar": true, style: { display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }, children: [
        /* @__PURE__ */ jsx(Segmented, { value: view, onChange: setView }),
        /* @__PURE__ */ jsx("div", { "data-tp-toolbar-spacer": true, style: { flex: 1 } }),
        /* @__PURE__ */ jsx("div", { style: { display: "inline-flex", gap: 2, padding: 3, borderRadius: 9, background: v("surface-recessed", v("muted")), boxShadow: `inset 0 0 0 1px ${v("border-hairline", "transparent")}` }, children: ["light", "dark"].map((m) => {
          const active = m === mode;
          return /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: () => setMode(m),
              style: {
                appearance: "none",
                border: 0,
                cursor: "pointer",
                fontFamily: SANS,
                fontSize: 12.5,
                fontWeight: active ? 600 : 500,
                height: 26,
                padding: "0 11px",
                borderRadius: 6,
                textTransform: "capitalize",
                background: active ? v("card") : "transparent",
                color: active ? v("foreground") : v("muted-foreground"),
                boxShadow: active ? `inset 0 0 0 1px ${v("border")}, ${v("shadow-xs", "none")}` : "none"
              },
              children: m
            },
            m
          );
        }) }),
        /* @__PURE__ */ jsxs("label", { "data-tp-theme-picker": true, style: { display: "inline-flex", alignItems: "center", gap: 8, fontSize: 12.5, color: v("muted-foreground") }, children: [
          "theme",
          /* @__PURE__ */ jsx(
            "select",
            {
              value: catalog.activeThemeId ?? "",
              onChange: (e) => rpc.call("setTheme", { themeId: e.target.value }).then(setCatalog).catch((err) => setError(String(err))),
              style: { height: 28, borderRadius: 7, border: 0, boxShadow: `inset 0 0 0 1px ${v("input")}`, background: v("card"), color: v("foreground"), fontSize: 12.5, padding: "0 8px", maxWidth: 260, fontFamily: SANS },
              children: catalog.themes.map((t) => /* @__PURE__ */ jsx("option", { value: t.id, children: t.name }, t.id))
            }
          )
        ] }),
        error ? /* @__PURE__ */ jsx("span", { style: { fontSize: 12, color: v("destructive-text", v("destructive")) }, children: error }) : null
      ] }),
      /* @__PURE__ */ jsx("div", { "data-tp-section": "frame", children: /* @__PURE__ */ jsx(Frame, { view }) }),
      /* @__PURE__ */ jsxs("div", { "data-tp-guide-heading": true, style: { display: "flex", alignItems: "baseline", gap: 12, margin: "44px 0 18px" }, children: [
        /* @__PURE__ */ jsx("span", { style: { fontSize: 15, fontWeight: 600 }, children: "Style guide" }),
        /* @__PURE__ */ jsx("span", { style: { fontSize: 12.5, color: v("muted-foreground") }, children: "values computed from the live theme \xB7 amber = sidebar-scoped override" })
      ] }),
      /* @__PURE__ */ jsx("div", { "data-tp-section": "guide", children: /* @__PURE__ */ jsx(StyleGuide, {}) })
    ] })
  ] });
}
var app_default = definePluginApp((app) => {
  app.slots.navPanel({
    id: "preview",
    title: "Theme Preview",
    icon: "Zap",
    path: "preview",
    component: PreviewPage
  });
});
export {
  app_default as default
};
