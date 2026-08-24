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

// theme-menu.ts
var MENU_MAX_HEIGHT = 520;
var BOUNDARY_GAP = 8;
function placeThemeMenu(bounds) {
  const above = Math.max(0, bounds.controlTop - bounds.boundaryTop - BOUNDARY_GAP);
  const below = Math.max(0, bounds.boundaryBottom - bounds.controlBottom - BOUNDARY_GAP);
  const side = below < MENU_MAX_HEIGHT && above > below ? "up" : "down";
  return {
    side,
    maxHeight: Math.min(MENU_MAX_HEIGHT, Math.floor(side === "up" ? above : below))
  };
}

// theme-utils.ts
function parseChannel(value) {
  const trimmed = value.trim();
  return trimmed.endsWith("%") ? Number.parseFloat(trimmed) * 2.55 : Number.parseFloat(trimmed);
}
function parseAlpha(value) {
  if (value === void 0) return 1;
  const trimmed = value.trim();
  return trimmed.endsWith("%") ? Number.parseFloat(trimmed) / 100 : Number.parseFloat(trimmed);
}
function parseRgb(value) {
  const match = /rgba?\(([^)]+)\)/.exec(value);
  if (!match) return null;
  const body = match[1].replace(/\s*\/\s*/g, ",");
  const parts = body.includes(",") ? body.split(",") : body.trim().split(/\s+/);
  if (parts.length < 3 || parts.length > 4) return null;
  const channels = [parseChannel(parts[0]), parseChannel(parts[1]), parseChannel(parts[2]), parseAlpha(parts[3])];
  return channels.every(Number.isFinite) ? channels : null;
}
function composite(foreground, background) {
  const alpha = foreground[3] + background[3] * (1 - foreground[3]);
  if (alpha === 0) return [0, 0, 0, 0];
  return [
    (foreground[0] * foreground[3] + background[0] * background[3] * (1 - foreground[3])) / alpha,
    (foreground[1] * foreground[3] + background[1] * background[3] * (1 - foreground[3])) / alpha,
    (foreground[2] * foreground[3] + background[2] * background[3] * (1 - foreground[3])) / alpha,
    alpha
  ];
}
function luminance(color) {
  const linear = (channel) => {
    const normalized = channel / 255;
    return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * linear(color[0]) + 0.7152 * linear(color[1]) + 0.0722 * linear(color[2]);
}
function contrastRatio(foregroundValue, backgroundValue, backdropValue = "rgb(255, 255, 255)") {
  const foreground = parseRgb(foregroundValue);
  const background = parseRgb(backgroundValue);
  const backdrop = parseRgb(backdropValue);
  if (!foreground || !background || !backdrop) return null;
  const opaqueBackdrop = backdrop[3] < 1 ? composite(backdrop, [255, 255, 255, 1]) : backdrop;
  const paintedBackground = composite(background, opaqueBackdrop);
  const paintedForeground = composite(foreground, paintedBackground);
  const foregroundLuminance = luminance(paintedForeground);
  const backgroundLuminance = luminance(paintedBackground);
  return (Math.max(foregroundLuminance, backgroundLuminance) + 0.05) / (Math.min(foregroundLuminance, backgroundLuminance) + 0.05);
}
var LatestRequest = class {
  #generation = 0;
  begin() {
    this.#generation += 1;
    return this.#generation;
  }
  isLatest(generation) {
    return generation === this.#generation;
  }
};

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
var R_ROW = 10;
var R_BUBBLE = 16;
var R_BLOCK = 10;
var VIEWS = ["thread", "new", "split", "settings"];
var VIEW_LABEL = {
  thread: "Thread",
  new: "New thread",
  split: "Split",
  settings: "Settings"
};
var VIEW_NOTE = {
  thread: "open thread \xB7 timeline TOC \xB7 side panel \xB7 row menu, hover card, toast",
  new: "empty state and composer",
  split: "two panes, one focused",
  settings: "page header, cards, controls"
};
var FRAME_W = 1280;
var FRAME_H = 780;
function Dot({ color, size = 6 }) {
  return /* @__PURE__ */ jsx("span", { style: { display: "inline-block", width: size, height: size, borderRadius: 999, background: color, flex: "none" } });
}
function Eyebrow({ children, style }) {
  return /* @__PURE__ */ jsx("div", { style: { fontFamily: MONO, fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: v("muted-foreground"), ...style }, children });
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
function Button({ children, variant = "default", size = "md", disabled = false }) {
  const variants = {
    default: { background: v("foreground"), color: v("background", v("canvas")) },
    secondary: { background: v("secondary"), color: v("secondary-foreground") },
    outline: { boxShadow: `inset 0 0 0 1px ${v("input")}`, color: v("foreground") },
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
        borderRadius: 8,
        whiteSpace: "nowrap",
        height: size === "sm" ? 26 : 30,
        padding: size === "sm" ? "0 10px" : "0 12px",
        fontSize: size === "sm" ? 12 : 13,
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
  return /* @__PURE__ */ jsx("span", { style: { width: 30, height: 17, borderRadius: 999, background: on ? v("primary") : v("input"), position: "relative", display: "inline-block", flex: "none" }, children: /* @__PURE__ */ jsx("span", { style: { position: "absolute", top: 2, left: on ? 15 : 2, width: 13, height: 13, borderRadius: 999, background: on ? v("primary-foreground") : v("background", "#fff") } }) });
}
function TextInput({ focused = false, value, placeholder, width = 190 }) {
  return /* @__PURE__ */ jsxs(
    "div",
    {
      style: {
        height: 30,
        width,
        borderRadius: 8,
        boxSizing: "border-box",
        padding: "0 10px",
        display: "flex",
        alignItems: "center",
        gap: 1,
        boxShadow: focused ? `inset 0 0 0 1px ${v("ring")}, 0 0 0 3px color-mix(in srgb, ${v("ring")} 28%, transparent)` : `inset 0 0 0 1px ${v("input")}`,
        background: v("background", "transparent"),
        fontSize: 12.5,
        fontFamily: SANS,
        color: value ? v("foreground") : v("muted-foreground")
      },
      children: [
        value ?? placeholder,
        focused ? /* @__PURE__ */ jsx("span", { style: { width: 1, height: 14, background: v("foreground") } }) : null
      ]
    }
  );
}
var sidebarScope = { position: "relative", inset: "auto", zIndex: "auto" };
function rowStyle(state) {
  switch (state) {
    case "hover":
      return { background: v("sidebar-accent"), color: v("sidebar-accent-foreground") };
    case "selected":
      return { background: v("state-active") };
    case "split":
      return { background: v("bb-sidebar-open-in-split-background", `color-mix(in oklch, ${v("sidebar-accent")} 50%, ${v("sidebar")})`) };
    default:
      return {};
  }
}
function Row({ label, state = "rest", dot }) {
  return /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 8, height: 28, padding: "0 10px", borderRadius: R_ROW, fontSize: 13, color: v("sidebar-foreground"), ...rowStyle(state) }, children: [
    /* @__PURE__ */ jsx("span", { style: { flex: 1, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }, children: label }),
    dot === "unread" ? /* @__PURE__ */ jsx(Dot, { color: v("foreground"), size: 5 }) : dot === "status" ? /* @__PURE__ */ jsx(Dot, { color: `color-mix(in srgb, ${v("muted-foreground")} 60%, transparent)`, size: 5 }) : null
  ] });
}
function Sidebar({ selected, split, hover }) {
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: "fixed bg-sidebar",
      style: {
        ...sidebarScope,
        width: 248,
        height: "100%",
        flex: "none",
        background: v("sidebar"),
        color: v("sidebar-foreground"),
        // bb's sidebar divider is border-border-seam; a theme's scoped seam
        // (blacklight's orange line) still arrives via the element class.
        borderRight: `1px solid ${v("border-seam", v("border"))}`,
        display: "flex",
        flexDirection: "column",
        padding: "10px 8px",
        boxSizing: "border-box",
        fontFamily: SANS
      },
      children: [
        /* @__PURE__ */ jsx("div", { style: { display: "flex", alignItems: "center", height: 30, padding: "0 10px", fontSize: 13, fontWeight: 600 }, children: "bb-plugins" }),
        /* @__PURE__ */ jsx(Row, { label: "New thread" }),
        /* @__PURE__ */ jsx("div", { style: { fontSize: 11, color: v("muted-foreground"), padding: "6px 10px 4px" }, children: "Today" }),
        /* @__PURE__ */ jsx(Row, { label: "Endless theme family \u2014 blacklight", state: selected ? "selected" : "rest", dot: "unread" }),
        /* @__PURE__ */ jsx(Row, { label: "Specimen sheets + social grid", state: split ? "split" : "rest", dot: "status" }),
        /* @__PURE__ */ jsx(Row, { label: "theme-preview plugin", state: hover ? "hover" : "rest" }),
        /* @__PURE__ */ jsx(Row, { label: "Crit: endless-color light foil", dot: "unread" }),
        /* @__PURE__ */ jsx("div", { style: { fontSize: 11, color: v("muted-foreground"), padding: "12px 10px 4px" }, children: "Yesterday" }),
        /* @__PURE__ */ jsx(Row, { label: "Fix pink split row (oklch mix)", dot: "status" }),
        /* @__PURE__ */ jsx(Row, { label: "Hue census battery" }),
        /* @__PURE__ */ jsx("div", { style: { flex: 1 } }),
        /* @__PURE__ */ jsx("div", { style: { display: "flex", alignItems: "center", height: 30, padding: "0 10px", fontSize: 12.5, color: v("muted-foreground") }, children: "brsbl" })
      ]
    }
  );
}
var popover = {
  background: v("popover"),
  color: v("popover-foreground"),
  boxShadow: `inset 0 0 0 1px ${v("border")}, ${v("shadow-md", "0 4px 16px rgba(0,0,0,.2)")}`,
  borderRadius: 10,
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
        padding: "0 10px",
        borderRadius: 6,
        margin: "0 4px",
        background: hover ? v("accent") : void 0,
        color: destructive ? v("destructive-text", v("destructive")) : hover ? v("accent-foreground") : v("popover-foreground")
      },
      children: [
        /* @__PURE__ */ jsx("span", { style: { flex: 1 }, children }),
        kbd ? /* @__PURE__ */ jsx("span", { style: { fontFamily: MONO, fontSize: 11, color: v("muted-foreground") }, children: kbd }) : null
      ]
    }
  );
}
function Menu({ style }) {
  return /* @__PURE__ */ jsxs("div", { style: { ...popover, width: 200, padding: "5px 0", ...style }, children: [
    /* @__PURE__ */ jsx(MenuItem, { kbd: "\u2318\u21E7O", children: "Open in split" }),
    /* @__PURE__ */ jsx(MenuItem, { hover: true, kbd: "\u2318R", children: "Rename" }),
    /* @__PURE__ */ jsx(MenuItem, { children: "Move to section" }),
    /* @__PURE__ */ jsx("div", { style: { height: 1, background: v("border"), margin: "5px 0" } }),
    /* @__PURE__ */ jsx(MenuItem, { destructive: true, children: "Delete thread" })
  ] });
}
function HoverCard({ style }) {
  return /* @__PURE__ */ jsxs("div", { style: { ...popover, width: 280, padding: 13, ...style }, children: [
    /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }, children: [
      /* @__PURE__ */ jsx(Dot, { color: v("warning") }),
      " ",
      /* @__PURE__ */ jsx("span", { style: { fontWeight: 600 }, children: "Specimen sheets + social grid" })
    ] }),
    /* @__PURE__ */ jsx("div", { style: { fontSize: 12.5, color: v("muted-foreground"), lineHeight: "18px", marginBottom: 10 }, children: "Regenerating both sheets against the new ramp." }),
    /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: 6 }, children: [
      /* @__PURE__ */ jsx(Badge, { tone: "outline", children: "bb/endless-theme" }),
      /* @__PURE__ */ jsx(Badge, { tone: "merged", children: "#42" })
    ] })
  ] });
}
function Toast({ style }) {
  return /* @__PURE__ */ jsxs("div", { style: { ...popover, width: 280, padding: "11px 13px", display: "flex", gap: 10, alignItems: "flex-start", boxShadow: `inset 0 0 0 1px ${v("border")}, ${v("shadow-lg", "0 8px 24px rgba(0,0,0,.25)")}`, ...style }, children: [
    /* @__PURE__ */ jsx(Dot, { color: v("success"), size: 8 }),
    /* @__PURE__ */ jsxs("div", { style: { flex: 1 }, children: [
      /* @__PURE__ */ jsx("div", { style: { fontWeight: 600, marginBottom: 2 }, children: "Theme applied" }),
      /* @__PURE__ */ jsx("div", { style: { fontSize: 12.5, color: v("muted-foreground") }, children: "endless-color is now active." })
    ] })
  ] });
}
function Bubble({ children }) {
  return /* @__PURE__ */ jsx("div", { style: { alignSelf: "flex-end", maxWidth: "70%", background: v("surface-recessed", "rgba(127,127,127,.05)"), boxShadow: `inset 0 0 0 1px ${v("border-seam", v("border"))}`, borderRadius: R_BUBBLE, padding: "10px 14px" }, children });
}
function CodeBlock() {
  const line = (text, kind) => /* @__PURE__ */ jsx("div", { style: { padding: "0 12px", whiteSpace: "pre", background: kind === "add" ? `color-mix(in srgb, ${v("diff-added")} 18%, transparent)` : kind === "del" ? `color-mix(in srgb, ${v("diff-removed")} 18%, transparent)` : void 0 }, children: text }, text);
  return /* @__PURE__ */ jsxs("div", { style: { borderRadius: R_BLOCK, overflow: "hidden", boxShadow: `inset 0 0 0 1px ${v("border-seam", v("border"))}`, fontFamily: MONO, fontSize: 12, lineHeight: "19px", color: v("foreground"), padding: "8px 0" }, children: [
    /* @__PURE__ */ jsxs("div", { style: { padding: "0 12px 6px", fontSize: 11, display: "flex", gap: 8, color: v("muted-foreground") }, children: [
      /* @__PURE__ */ jsx("span", { style: { color: v("file-accent", v("muted-foreground")) }, children: "themes/endless-color.css" }),
      /* @__PURE__ */ jsx("span", { children: "+2 \u22121" })
    ] }),
    line("  .dark .fixed.bg-sidebar {"),
    line("-   --sidebar: #1d1d1d;", "del"),
    line("+   --sidebar: #070707;", "add"),
    line("  }")
  ] });
}
function Composer({ focused = false, text }) {
  return /* @__PURE__ */ jsxs(
    "div",
    {
      style: {
        borderRadius: R_BUBBLE,
        background: v("background", v("canvas")),
        padding: "12px 12px 10px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        boxShadow: focused ? `inset 0 0 0 1px ${v("ring")}, 0 0 0 3px color-mix(in srgb, ${v("ring")} 25%, transparent)` : `inset 0 0 0 1px ${v("border")}`
      },
      children: [
        /* @__PURE__ */ jsx("div", { style: { fontSize: 13.5, color: text ? v("foreground") : v("muted-foreground"), minHeight: 20 }, children: text ?? "Ask for a follow-up." }),
        /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 6 }, children: [
          /* @__PURE__ */ jsx("span", { style: { fontSize: 12, color: v("muted-foreground") }, children: "claude-fable-5" }),
          /* @__PURE__ */ jsx("div", { style: { flex: 1 } }),
          /* @__PURE__ */ jsx("div", { style: { width: 26, height: 26, borderRadius: 8, background: text ? v("primary") : v("muted"), color: text ? v("primary-foreground") : v("muted-foreground"), display: "grid", placeItems: "center", fontSize: 12 }, children: "\u2191" })
        ] })
      ]
    }
  );
}
function VerificationCard() {
  const rows = [
    ["Theme tokens", "28 resolved", "success"],
    ["Contrast floor", "AA passed", "success"],
    ["Reference sheet", "Updated", "secondary"]
  ];
  return /* @__PURE__ */ jsxs("div", { style: { borderRadius: R_BLOCK, background: v("surface-recessed", "rgba(127,127,127,.05)"), boxShadow: `inset 0 0 0 1px ${v("border-seam", v("border"))}`, padding: "10px 12px" }, children: [
    /* @__PURE__ */ jsx("div", { style: { fontSize: 12.5, fontWeight: 600, marginBottom: 6 }, children: "Verification summary" }),
    rows.map(([label, value, tone]) => /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 10, minHeight: 25, borderTop: `1px solid ${v("border-hairline", v("border"))}` }, children: [
      /* @__PURE__ */ jsx("span", { style: { flex: 1, color: v("muted-foreground") }, children: label }),
      /* @__PURE__ */ jsx(Badge, { tone, children: value })
    ] }, label))
  ] });
}
function TimelineToc() {
  const items = [
    "Three blacks were fragmenting the frame\u2026",
    "Selection now reads rgba(47,180,255,.20)\u2026",
    "Tightened the raised surfaces and kept seams neutral\u2026"
  ];
  return /* @__PURE__ */ jsxs("div", { style: { position: "absolute", right: 10, top: 58, zIndex: 4, display: "flex", alignItems: "flex-start" }, children: [
    /* @__PURE__ */ jsx(
      "div",
      {
        id: "thread-toc-panel-preview",
        style: {
          position: "absolute",
          right: 36,
          top: 0,
          width: 292,
          paddingRight: 4
        },
        children: /* @__PURE__ */ jsxs("div", { "data-tp-toc": "panel", style: { padding: 4, borderRadius: 8, background: v("popover"), color: v("popover-foreground"), boxShadow: `inset 0 0 0 1px ${v("border")}, ${v("shadow-lg", "0 8px 24px rgba(0,0,0,.22)")}` }, children: [
          /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 2, paddingBottom: 4 }, children: [
            /* @__PURE__ */ jsx("span", { style: { borderRadius: 6, padding: "5px 8px", background: v("state-hover"), color: v("foreground"), fontSize: 11.5, fontWeight: 600 }, children: "Agent messages" }),
            /* @__PURE__ */ jsx("span", { style: { borderRadius: 6, padding: "5px 8px", color: v("muted-foreground"), fontSize: 11.5 }, children: "Your messages" })
          ] }),
          /* @__PURE__ */ jsx("div", { style: { display: "flex", flexDirection: "column" }, children: items.map((item, index) => /* @__PURE__ */ jsx(
            "div",
            {
              style: {
                borderRadius: 6,
                padding: "6px 8px",
                fontSize: 12,
                lineHeight: "16px",
                background: index === 1 ? v("state-hover") : void 0,
                color: index === 1 ? v("foreground") : v("muted-foreground")
              },
              children: item
            },
            item
          )) })
        ] })
      }
    ),
    /* @__PURE__ */ jsx("div", { "aria-label": "Thread table of contents", style: { width: 32, padding: "8px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }, children: [12, 12, 20, 12, 12].map((width, index) => /* @__PURE__ */ jsx("span", { style: { width, height: 3, borderRadius: 999, background: index === 2 ? `color-mix(in srgb, ${v("foreground")} 70%, transparent)` : `color-mix(in srgb, ${v("foreground")} 20%, transparent)` } }, index)) })
  ] });
}
function Thread({ title = "Endless theme family \u2014 blacklight pass", active = true, narrow = false, empty = false, marker = false, toc = false, children }) {
  const pad = narrow ? 20 : 30;
  return /* @__PURE__ */ jsxs("div", { style: { flex: 1, minWidth: 0, height: "100%", background: v("canvas", v("background")), color: v("foreground"), display: "flex", flexDirection: "column", fontFamily: SANS, position: "relative" }, children: [
    empty ? /* @__PURE__ */ jsxs("div", { style: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20, padding: `0 ${pad}px` }, children: [
      /* @__PURE__ */ jsx("div", { style: { fontSize: 21, fontWeight: 600, letterSpacing: "-0.01em" }, children: "What are we building?" }),
      /* @__PURE__ */ jsx("div", { style: { width: "100%", maxWidth: 620 }, children: /* @__PURE__ */ jsx(Composer, { focused: true, text: "make the blacklight variant feel like the reference" }) }),
      /* @__PURE__ */ jsx("div", { style: { display: "flex", gap: 8 }, children: ["Fix the failing build", "Review open PRs"].map((s) => /* @__PURE__ */ jsx("span", { style: { fontSize: 12.5, padding: "6px 12px", borderRadius: 999, boxShadow: `inset 0 0 0 1px ${v("border")}`, color: v("muted-foreground") }, children: s }, s)) })
    ] }) : /* @__PURE__ */ jsxs(Fragment2, { children: [
      /* @__PURE__ */ jsxs("div", { style: { height: 48, display: "flex", alignItems: "center", gap: 10, padding: `0 ${pad}px`, flex: "none", position: "relative" }, children: [
        marker && active ? /* @__PURE__ */ jsx("span", { style: { position: "absolute", left: 0, right: 0, top: 0, height: 2, background: v("primary") } }) : null,
        /* @__PURE__ */ jsx("span", { style: { fontSize: 13.5, fontWeight: 600, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }, children: title }),
        /* @__PURE__ */ jsxs(Badge, { tone: "success", children: [
          /* @__PURE__ */ jsx(Dot, { color: v("success"), size: 6 }),
          " Running"
        ] }),
        narrow ? null : /* @__PURE__ */ jsx(Badge, { tone: "outline", children: "bb/endless-theme-plugin" })
      ] }),
      /* @__PURE__ */ jsxs("div", { style: { flex: 1, overflow: "hidden", padding: `22px ${toc ? 54 : pad}px 0 ${pad}px`, display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 16, fontSize: 13.5, lineHeight: "21px" }, children: [
        /* @__PURE__ */ jsx(Bubble, { children: "make the blacklight variant feel like the reference \u2014 neon orange seam, blue selection, calm UV canvas." }),
        /* @__PURE__ */ jsxs("div", { children: [
          "Three blacks were fragmenting the frame. The base theme's",
          " ",
          /* @__PURE__ */ jsx("code", { style: { fontFamily: MONO, fontSize: "0.92em", fontWeight: 600, background: v("surface-recessed"), padding: "1px 5px", borderRadius: 4 }, children: ".fixed.bg-sidebar" }),
          " ",
          "block was overriding the variant's sidebar tokens, so it rendered ",
          /* @__PURE__ */ jsx("span", { style: { fontFamily: MONO, fontSize: "0.92em" }, children: "#1d1d1d" }),
          " instead of true black."
        ] }),
        /* @__PURE__ */ jsx(CodeBlock, {}),
        /* @__PURE__ */ jsxs("div", { style: { color: v("muted-foreground"), fontSize: 12.5, display: "flex", alignItems: "center", gap: 8 }, children: [
          /* @__PURE__ */ jsx("span", { style: { width: 1, height: 18, background: v("timeline-accent", v("border")) } }),
          "14:02 \xB7 ",
          /* @__PURE__ */ jsx("span", { style: { color: v("file-accent", v("muted-foreground")), fontFamily: MONO }, children: "themes/endless-color.css" })
        ] }),
        /* @__PURE__ */ jsx(Bubble, { children: "looks right \u2014 now match the selection blue to the glove." }),
        /* @__PURE__ */ jsxs("div", { children: [
          "Done. Selection now reads ",
          /* @__PURE__ */ jsx("span", { style: { fontFamily: MONO, fontSize: "0.92em" }, children: "rgba(47,180,255,.20)" }),
          " over the canvas, and file paths pick up the glove's steel blue \u2014 ",
          /* @__PURE__ */ jsx("span", { style: { color: v("file-accent", v("muted-foreground")), fontFamily: MONO, fontSize: "0.92em" }, children: "build-color.py" }),
          " shows it inline.",
          /* @__PURE__ */ jsx("span", { "data-tp-selection": "sample", style: { background: v("selection-color-default", v("surface-selected")), color: v("foreground"), borderRadius: 3, padding: "0 3px", WebkitBoxDecorationBreak: "clone", boxDecorationBreak: "clone" }, children: " Selected text stays readable." })
        ] }),
        /* @__PURE__ */ jsxs("div", { style: { color: v("muted-foreground"), fontSize: 12.5, display: "flex", alignItems: "center", gap: 8 }, children: [
          /* @__PURE__ */ jsx("span", { style: { width: 1, height: 18, background: v("timeline-accent", v("border")) } }),
          "14:18 \xB7 checks completed"
        ] }),
        /* @__PURE__ */ jsx(VerificationCard, {}),
        /* @__PURE__ */ jsx(Bubble, { children: "keep the hierarchy calm \u2014 orange should guide the eye, not fill the room." }),
        /* @__PURE__ */ jsx("div", { children: "Tightened the raised surfaces and kept the content seams neutral. The sidebar edge is the only persistent orange line; focus and selection stay blue, so the two signals never compete." })
      ] }),
      /* @__PURE__ */ jsx("div", { style: { padding: `12px ${pad}px 18px`, flex: "none" }, children: /* @__PURE__ */ jsx(Composer, { focused: active }) })
    ] }),
    toc ? /* @__PURE__ */ jsx(TimelineToc, {}) : null,
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
      className: "bg-sidebar",
      style: { ...sidebarScope, width: 280, height: "100%", flex: "none", background: v("sidebar"), color: v("sidebar-foreground"), borderLeft: `1px solid ${v("border-seam", v("border"))}`, fontFamily: SANS, display: "flex", flexDirection: "column" },
      children: [
        /* @__PURE__ */ jsx("div", { style: { height: 48, display: "flex", alignItems: "center", gap: 14, padding: "0 16px", fontSize: 12.5 }, children: ["Info", "Files", "Changes"].map((t, i) => /* @__PURE__ */ jsx("span", { style: { color: i === 0 ? v("foreground") : v("muted-foreground"), fontWeight: i === 0 ? 600 : 400 }, children: t }, t)) }),
        /* @__PURE__ */ jsxs("div", { style: { padding: "14px 16px", display: "flex", flexDirection: "column", gap: 14 }, children: [
          /* @__PURE__ */ jsxs("div", { children: [
            kv("Status", /* @__PURE__ */ jsx(Badge, { tone: "success", children: "Running" })),
            kv("Agent", "Claude Fable 5"),
            kv("Branch", /* @__PURE__ */ jsx("span", { style: { fontFamily: MONO, fontSize: 12 }, children: "bb/endless-theme" })),
            kv("Pull request", /* @__PURE__ */ jsx(Badge, { tone: "merged", children: "Merged #42" }))
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Eyebrow, { style: { marginBottom: 4 }, children: "Files" }),
            ["themes/endless-color.css", "build-color.py"].map((f) => /* @__PURE__ */ jsx("div", { style: { height: 24, fontSize: 12.5, fontFamily: MONO, color: v("file-accent", v("foreground")), overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }, children: f }, f))
          ] }),
          /* @__PURE__ */ jsx("div", { style: { borderRadius: R_BLOCK, background: v("surface-recessed-soft-solid", v("card")), boxShadow: `inset 0 0 0 1px ${v("border-hairline", v("border"))}`, padding: "10px 12px", fontSize: 12.5, color: v("readback-foreground", v("muted-foreground")), lineHeight: "18px" }, children: "Sidebar reads true black with the orange seam; blue selection at .20." })
        ] })
      ]
    }
  );
}
function SettingsPage() {
  return /* @__PURE__ */ jsx("div", { style: { flex: 1, minWidth: 0, height: "100%", background: v("canvas", v("background")), color: v("foreground"), fontFamily: SANS, overflow: "hidden" }, children: /* @__PURE__ */ jsxs("div", { style: { maxWidth: 720, margin: "0 auto", padding: "36px 32px" }, children: [
    /* @__PURE__ */ jsxs("div", { style: { borderRadius: 14, padding: "24px 26px", marginBottom: 22, background: `linear-gradient(135deg, ${v("secondary")} 0%, ${v("accent")} 100%)`, boxShadow: `inset 0 0 0 1px ${v("border-hairline", v("border"))}` }, children: [
      /* @__PURE__ */ jsx("div", { style: { fontSize: 21, fontWeight: 600, letterSpacing: "-0.01em", marginBottom: 6 }, children: "Extensions" }),
      /* @__PURE__ */ jsx("div", { style: { fontSize: 13.5, color: v("muted-foreground"), maxWidth: 440, lineHeight: "20px" }, children: "Plugins add surfaces, agents and themes to bb." })
    ] }),
    /* @__PURE__ */ jsx("div", { style: { display: "flex", gap: 18, borderBottom: `1px solid ${v("border")}`, marginBottom: 18, fontSize: 13 }, children: ["Installed", "Marketplace", "Themes"].map((t, i) => /* @__PURE__ */ jsx("span", { style: { padding: "0 0 8px", color: i === 0 ? v("foreground") : v("muted-foreground"), fontWeight: i === 0 ? 600 : 400, boxShadow: i === 0 ? `inset 0 -2px 0 0 ${v("primary")}` : void 0 }, children: t }, t)) }),
    /* @__PURE__ */ jsx("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }, children: ["Endless", "Endless Color", "Theme Preview", "Plugin Guide"].map((name, i) => /* @__PURE__ */ jsxs("div", { style: { borderRadius: 12, background: v("card"), boxShadow: `inset 0 0 0 1px ${v("border")}, ${v("shadow-xs", "none")}`, padding: "12px 14px", display: "flex", gap: 12, alignItems: "center" }, children: [
      /* @__PURE__ */ jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [
        /* @__PURE__ */ jsx("div", { style: { fontSize: 13, fontWeight: 600 }, children: name }),
        /* @__PURE__ */ jsxs("div", { style: { fontSize: 12, color: v("muted-foreground") }, children: [
          "v0.1.",
          i
        ] })
      ] }),
      /* @__PURE__ */ jsx(Switch, { on: i !== 3 })
    ] }, name)) })
  ] }) });
}
function FrameView({ view }) {
  switch (view) {
    case "thread":
      return /* @__PURE__ */ jsxs(Fragment2, { children: [
        /* @__PURE__ */ jsx(Sidebar, { selected: true }),
        /* @__PURE__ */ jsx(Thread, { toc: true }),
        /* @__PURE__ */ jsx(InfoPanel, {}),
        /* @__PURE__ */ jsx(Menu, { style: { position: "absolute", left: 196, top: 118, zIndex: 5 } }),
        /* @__PURE__ */ jsx(HoverCard, { style: { position: "absolute", left: 254, top: 292, zIndex: 5 } }),
        /* @__PURE__ */ jsx(Toast, { style: { position: "absolute", right: 20, bottom: 20, zIndex: 5 } })
      ] });
    case "new":
      return /* @__PURE__ */ jsxs(Fragment2, { children: [
        /* @__PURE__ */ jsx(Sidebar, { hover: true }),
        /* @__PURE__ */ jsx(Thread, { empty: true })
      ] });
    case "split":
      return /* @__PURE__ */ jsxs(Fragment2, { children: [
        /* @__PURE__ */ jsx(Sidebar, { selected: true, split: true }),
        /* @__PURE__ */ jsx(Thread, { narrow: true, marker: true }),
        /* @__PURE__ */ jsx("div", { style: { width: 1, background: v("border-seam-vertical", v("border-seam", v("border"))), flex: "none" } }),
        /* @__PURE__ */ jsx(Thread, { title: "Specimen sheets + social grid", active: false, narrow: true, marker: true })
      ] });
    case "settings":
      return /* @__PURE__ */ jsxs(Fragment2, { children: [
        /* @__PURE__ */ jsx(Sidebar, {}),
        /* @__PURE__ */ jsx(SettingsPage, {})
      ] });
  }
}
function Frame({ view, fitBoth = false }) {
  const hostRef = useRef(null);
  const [fit, setFit] = useState({ zoom: 0.8, height: FRAME_H });
  useLayoutEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const measure = () => {
      if (fitBoth) {
        const zoom2 = Math.min(1, Math.max(0.24, Math.min(el.clientWidth / FRAME_W, el.clientHeight / FRAME_H)));
        setFit({ zoom: zoom2, height: FRAME_H });
        return;
      }
      const zoom = Math.min(1, Math.max(0.24, el.clientWidth / FRAME_W));
      const height = Math.min(1400, Math.max(620, Math.floor(el.clientHeight / zoom)));
      setFit({ zoom, height });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [fitBoth]);
  return /* @__PURE__ */ jsx("div", { ref: hostRef, style: { flex: 1, minHeight: 0, display: "flex", alignItems: "flex-start", justifyContent: "center", overflow: "hidden" }, children: /* @__PURE__ */ jsx(
    "div",
    {
      style: {
        width: FRAME_W,
        height: fit.height,
        zoom: fit.zoom,
        display: "flex",
        overflow: "hidden",
        borderRadius: 12,
        position: "relative",
        flex: "none",
        boxShadow: v("shadow-lg", "0 10px 30px rgba(0,0,0,.25)"),
        background: v("canvas", v("background"))
      },
      children: /* @__PURE__ */ jsx(FrameView, { view })
    }
  ) });
}
var SURFACE_TOKENS = ["canvas", "sidebar", "card", "popover", "secondary", "muted", "surface-recessed-solid", "surface-scrim"];
var GUIDE_GROUPS = [
  { title: "Ink", tokens: ["foreground", "muted-foreground", "subtle-foreground", "readback-foreground", "sidebar-foreground"] },
  { title: "Accent", tokens: ["primary", "file-accent", "timeline-accent", "surface-selected", "state-hover", "state-active"] },
  { title: "Status", tokens: ["success", "warning", "destructive", "pr-merged", "diff-added", "diff-removed"] },
  { title: "Lines", tokens: ["border", "border-hairline", "border-seam", "sidebar-border", "input", "ring"] }
];
var ALL_TOKENS = [...SURFACE_TOKENS, ...GUIDE_GROUPS.flatMap((group) => group.tokens)];
function resolveColor(color) {
  const m = /rgba?\(([^)]+)\)/.exec(color);
  let channels = null;
  if (m) {
    channels = m[1].split(",").map((p) => parseFloat(p.trim()));
  } else if (color) {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (context) {
      context.clearRect(0, 0, 1, 1);
      context.fillStyle = color;
      context.fillRect(0, 0, 1, 1);
      const [r2, g2, b2, a2] = context.getImageData(0, 0, 1, 1).data;
      channels = [r2, g2, b2, a2 / 255];
    }
  }
  if (!channels || channels.length < 3 || channels.some((channel) => !Number.isFinite(channel))) return { rgb: "", hex: "\u2014" };
  const [r, g, b, a] = channels;
  const rounded = [r, g, b].map((channel) => Math.round(channel));
  const baseHex = "#" + rounded.map((channel) => channel.toString(16).padStart(2, "0")).join("");
  const alpha = a === void 0 ? 1 : a;
  return {
    rgb: alpha < 1 ? `rgba(${rounded.join(", ")}, ${alpha})` : `rgb(${rounded.join(", ")})`,
    hex: alpha < 1 ? `${baseHex} ${Math.round(alpha * 100)}%` : baseHex
  };
}
function useComputedTokens(names, revision) {
  const [out, setOut] = useState({});
  useEffect(() => {
    const timer = setTimeout(() => {
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
        const resolved = value ? resolveColor(getComputedStyle(swatch).backgroundColor) : { rgb: "", hex: "\u2014" };
        next[name] = {
          value,
          hex: resolved.hex,
          rgb: resolved.rgb,
          sidebar: scoped && scoped !== value ? scoped : null
        };
      }
      probe.remove();
      swatch.remove();
      setOut(next);
    }, 350);
    return () => clearTimeout(timer);
  }, [names, revision]);
  return out;
}
function TokenRow({ name, computed, contrastAgainst }) {
  const c = computed[name];
  const ratio = contrastAgainst && c?.rgb && computed[contrastAgainst]?.rgb ? contrastRatio(c.rgb, computed[contrastAgainst].rgb, contrastAgainst === "canvas" ? void 0 : computed.canvas?.rgb) : null;
  return /* @__PURE__ */ jsxs("div", { style: { display: "grid", gridTemplateColumns: contrastAgainst ? "24px minmax(0, 1fr) 72px 46px" : "24px minmax(0, 1fr) 72px", alignItems: "center", columnGap: 6, height: 22 }, children: [
    /* @__PURE__ */ jsx(
      "span",
      {
        title: c?.sidebar ? `${c.value}
sidebar: ${c.sidebar}` : c?.value,
        style: {
          width: 24,
          height: 14,
          borderRadius: 3,
          background: c?.value ? v(name) : "transparent",
          boxShadow: `inset 0 0 0 1px ${c?.sidebar ? v("warning") : v("border-hairline", v("border"))}`
        }
      }
    ),
    /* @__PURE__ */ jsx("span", { style: { fontFamily: MONO, fontSize: 10.5, color: v("foreground"), overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }, children: name }),
    /* @__PURE__ */ jsx("span", { style: { minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", fontFamily: MONO, fontSize: 10.5, color: v("muted-foreground"), textAlign: "right", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }, children: c?.hex ?? "" }),
    contrastAgainst ? /* @__PURE__ */ jsx(
      "span",
      {
        title: `contrast vs --${contrastAgainst} \xB7 WCAG floor 4.5:1`,
        style: { fontFamily: MONO, fontSize: 10.5, textAlign: "right", fontVariantNumeric: "tabular-nums", color: ratio === null || ratio >= 4.5 ? v("success") : v("destructive-text", v("destructive")), fontWeight: ratio !== null && ratio < 4.5 ? 600 : 400, whiteSpace: "nowrap" },
        children: ratio === null ? "" : `${ratio.toFixed(2)}:1`
      }
    ) : null
  ] });
}
function GuideBlock({ title, note, wide = false, children }) {
  return /* @__PURE__ */ jsxs("div", { style: { marginBottom: 14, gridColumn: wide ? "1 / -1" : void 0, minWidth: 0 }, children: [
    /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "baseline", gap: 8, minHeight: 18, marginBottom: 6, overflow: "hidden" }, children: [
      /* @__PURE__ */ jsx("span", { style: { fontSize: 12, fontWeight: 650, color: v("foreground"), whiteSpace: "nowrap" }, children: title }),
      note ? /* @__PURE__ */ jsx("span", { style: { minWidth: 0, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", fontSize: 10.5, color: v("muted-foreground") }, children: note }) : null
    ] }),
    children
  ] });
}
function TypeSpecimen() {
  return /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexDirection: "column", gap: 3 }, children: [
    /* @__PURE__ */ jsx("span", { style: { fontSize: 15, fontWeight: 600, letterSpacing: "-0.005em" }, children: "Title \xB7 foreground 600" }),
    /* @__PURE__ */ jsx("span", { style: { fontSize: 13.5 }, children: "Body at 13.5 \u2014 the thing most pixels are." }),
    /* @__PURE__ */ jsx("span", { style: { fontSize: 13, color: v("muted-foreground") }, children: "Muted \xB7 labels and captions" }),
    /* @__PURE__ */ jsx("span", { style: { fontSize: 12.5, color: v("subtle-foreground", v("muted-foreground")) }, children: "Subtle \xB7 secondary metadata" }),
    /* @__PURE__ */ jsxs("span", { style: { fontSize: 13 }, children: [
      "inline ",
      /* @__PURE__ */ jsx("code", { style: { fontFamily: MONO, fontSize: "0.92em", fontWeight: 600, background: v("surface-recessed"), padding: "1px 5px", borderRadius: 4 }, children: "--token" }),
      " \xB7 ",
      /* @__PURE__ */ jsx("span", { style: { fontFamily: MONO, fontSize: 12.5, color: v("file-accent", "inherit") }, children: "path/file.tsx" }),
      " \xB7 ",
      /* @__PURE__ */ jsx("span", { style: { color: v("primary"), textDecoration: "underline", textUnderlineOffset: 3 }, children: "link" })
    ] })
  ] });
}
function SurfaceControls({ computed, catalog, mode, onPick }) {
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "baseline", gap: 8, minHeight: 22, marginBottom: 12 }, children: [
      /* @__PURE__ */ jsx("span", { style: { fontSize: 13, fontWeight: 650, letterSpacing: "-0.005em" }, children: "Theme surfaces" }),
      /* @__PURE__ */ jsx("span", { style: { fontSize: 10.5, color: v("muted-foreground") }, children: "live values" })
    ] }),
    /* @__PURE__ */ jsx(GuideBlock, { title: "Theme", note: "applies live", children: /* @__PURE__ */ jsx(ThemePicker, { catalog, mode, onPick }) }),
    /* @__PURE__ */ jsx(GuideBlock, { title: "Surfaces", note: "amber = sidebar override", children: /* @__PURE__ */ jsx("div", { style: { display: "flex", flexDirection: "column", gap: 1 }, children: SURFACE_TOKENS.map((token) => /* @__PURE__ */ jsx(TokenRow, { name: token, computed }, token)) }) })
  ] });
}
function StyleGuide({ computed }) {
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "baseline", gap: 9, minHeight: 22, marginBottom: 14 }, children: [
      /* @__PURE__ */ jsx("span", { style: { fontSize: 13, fontWeight: 650, letterSpacing: "-0.005em" }, children: "Style guide" }),
      /* @__PURE__ */ jsx("span", { style: { fontSize: 11, color: v("muted-foreground") }, children: "visual specimens + live token readout" })
    ] }),
    /* @__PURE__ */ jsxs("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", columnGap: 24, alignItems: "start" }, children: [
      /* @__PURE__ */ jsx(GuideBlock, { title: "Visual controls", note: "preview only", wide: true, children: /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }, children: [
        /* @__PURE__ */ jsx(Button, { size: "sm", children: "Default" }),
        /* @__PURE__ */ jsx(Button, { size: "sm", variant: "secondary", children: "Secondary" }),
        /* @__PURE__ */ jsx(Button, { size: "sm", variant: "outline", children: "Outline" }),
        /* @__PURE__ */ jsx(Button, { size: "sm", variant: "destructive", children: "Delete" }),
        /* @__PURE__ */ jsx(Switch, { on: true }),
        /* @__PURE__ */ jsx(TextInput, { placeholder: "Search threads\u2026", width: 150 }),
        /* @__PURE__ */ jsx(TextInput, { focused: true, value: "endless", width: 110 }),
        /* @__PURE__ */ jsxs(Badge, { tone: "success", children: [
          /* @__PURE__ */ jsx(Dot, { color: v("success"), size: 6 }),
          " Running"
        ] }),
        /* @__PURE__ */ jsx(Badge, { tone: "warning", children: "Attention" }),
        /* @__PURE__ */ jsx(Badge, { tone: "destructive", children: "Failed" }),
        /* @__PURE__ */ jsx(Badge, { tone: "merged", children: "Merged" }),
        /* @__PURE__ */ jsx(Badge, { tone: "outline", children: "branch" })
      ] }) }),
      /* @__PURE__ */ jsx(GuideBlock, { title: "Type", note: "visual specimen", children: /* @__PURE__ */ jsx(TypeSpecimen, {}) }),
      GUIDE_GROUPS.map((group) => /* @__PURE__ */ jsx(
        GuideBlock,
        {
          title: group.title,
          note: group.title === "Ink" ? "ratio vs its surface \xB7 floor 4.5:1" : group.title === "Status" ? "ratio vs canvas" : void 0,
          children: /* @__PURE__ */ jsx("div", { style: { display: "flex", flexDirection: "column", gap: 1 }, children: group.tokens.map((token) => /* @__PURE__ */ jsx(
            TokenRow,
            {
              name: token,
              computed,
              contrastAgainst: group.title === "Ink" ? token === "sidebar-foreground" ? "sidebar" : "canvas" : group.title === "Status" ? "canvas" : void 0
            },
            token
          )) })
        },
        group.title
      )),
      /* @__PURE__ */ jsx(GuideBlock, { title: "Sidebar rows", note: "1:1, in the real sidebar scope", children: /* @__PURE__ */ jsxs("div", { className: "fixed bg-sidebar", style: { ...sidebarScope, overflow: "hidden", background: v("sidebar"), boxShadow: `inset 0 0 0 1px ${v("border-seam", v("border"))}`, borderRadius: 10, padding: 6 }, children: [
        /* @__PURE__ */ jsx(Row, { label: "rest \xB7 unread", dot: "unread" }),
        /* @__PURE__ */ jsx(Row, { label: "hover \xB7 sidebar-accent", state: "hover" }),
        /* @__PURE__ */ jsx(Row, { label: "open thread \xB7 state-active", state: "selected" }),
        /* @__PURE__ */ jsx(Row, { label: "open in split", state: "split", dot: "status" })
      ] }) })
    ] })
  ] });
}
var CHIP_KEYS = ["sidebar", "canvas", "card", "primary", "accent"];
function Chips({ swatch, w = 13, h = 20 }) {
  return /* @__PURE__ */ jsx("span", { style: { display: "flex", gap: 3, flex: "none" }, children: CHIP_KEYS.map((key) => /* @__PURE__ */ jsx(
    "span",
    {
      title: `--${key === "accent" ? "file-accent" : key}: ${swatch?.[key] ?? "bundled with the app, not readable from disk"}`,
      style: {
        width: w,
        height: h,
        borderRadius: 3,
        flex: "none",
        background: swatch?.[key] ?? "transparent",
        boxShadow: `inset 0 0 0 1px ${swatch?.[key] ? v("border-hairline", v("border")) : v("border")}`,
        opacity: swatch?.[key] ? 1 : 0.35
      }
    },
    key
  )) });
}
function ThemeRow({ entry, mode, active, onPick }) {
  const swatch = mode === "dark" ? entry.dark : entry.light;
  const shell = swatch?.canvas ?? (mode === "dark" ? "#1a1a1a" : "#f4f4f4");
  const ink = swatch?.foreground ?? (mode === "dark" ? "#e6e6e6" : "#111111");
  const fontSans = swatch?.fontSans ?? entry.light?.fontSans ?? entry.dark?.fontSans ?? SANS;
  const fontMono = swatch?.fontMono ?? entry.light?.fontMono ?? entry.dark?.fontMono ?? MONO;
  return /* @__PURE__ */ jsxs(
    "button",
    {
      type: "button",
      onClick: onPick,
      style: {
        appearance: "none",
        border: 0,
        cursor: "pointer",
        textAlign: "left",
        padding: "4px 6px",
        borderRadius: 7,
        display: "flex",
        alignItems: "center",
        gap: 8,
        width: "100%",
        fontFamily: SANS,
        background: active ? v("accent") : "transparent",
        color: active ? v("accent-foreground") : v("popover-foreground")
      },
      children: [
        /* @__PURE__ */ jsx(Chips, { swatch, w: 10, h: 16 }),
        /* @__PURE__ */ jsx("span", { style: { flex: 1, minWidth: 0, fontSize: 12, fontWeight: active ? 600 : 500, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }, children: entry.name }),
        /* @__PURE__ */ jsxs("span", { style: { display: "inline-flex", alignItems: "baseline", gap: 5, padding: "1px 6px", borderRadius: 4, flex: "none", background: shell, color: ink, boxShadow: `inset 0 0 0 1px ${v("border-hairline", v("border"))}` }, children: [
          /* @__PURE__ */ jsx("span", { style: { fontFamily: fontSans, fontSize: 12.5, fontWeight: 600 }, children: "Aa" }),
          /* @__PURE__ */ jsx("span", { style: { fontFamily: fontMono, fontSize: 11 }, children: "Aa" })
        ] }),
        /* @__PURE__ */ jsx("span", { style: { fontSize: 10.5, color: v("muted-foreground"), width: 28, flex: "none", textTransform: "capitalize" }, children: mode })
      ]
    }
  );
}
function ThemePicker({ catalog, mode, onPick }) {
  const [open, setOpen] = useState(false);
  const [menuPlacement, setMenuPlacement] = useState({ side: "down", maxHeight: 520 });
  const hostRef = useRef(null);
  useLayoutEffect(() => {
    if (!open) return;
    const host = hostRef.current;
    const root = host?.closest("[data-tp-root]");
    if (!host || !root) return;
    const updatePlacement = () => {
      const control = host.querySelector("[data-tp-theme-control]");
      if (!control) return;
      const controlRect = control.getBoundingClientRect();
      const rootRect = root.getBoundingClientRect();
      setMenuPlacement(placeThemeMenu({
        controlTop: controlRect.top,
        controlBottom: controlRect.bottom,
        boundaryTop: Math.max(0, rootRect.top),
        boundaryBottom: Math.min(window.innerHeight, rootRect.bottom)
      }));
    };
    updatePlacement();
    window.addEventListener("resize", updatePlacement);
    root.addEventListener("scroll", updatePlacement, { passive: true });
    return () => {
      window.removeEventListener("resize", updatePlacement);
      root.removeEventListener("scroll", updatePlacement);
    };
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (!hostRef.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const options = Array.from(hostRef.current?.querySelectorAll("[role=listbox] button") ?? []);
        if (options.length === 0) return;
        const index = options.indexOf(document.activeElement);
        const next = index === -1 ? 0 : (index + (e.key === "ArrowDown" ? 1 : options.length - 1)) % options.length;
        options[next].focus();
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  const current = catalog.themes.find((t) => t.id === catalog.activeThemeId) ?? catalog.themes[0];
  const currentSwatch = current ? mode === "dark" ? current.dark : current.light : null;
  return /* @__PURE__ */ jsxs("div", { ref: hostRef, style: { position: "relative" }, children: [
    /* @__PURE__ */ jsxs(
      "button",
      {
        "data-tp-theme-control": "",
        type: "button",
        "aria-haspopup": "listbox",
        "aria-expanded": open,
        onClick: () => setOpen((o) => !o),
        style: {
          appearance: "none",
          border: 0,
          cursor: "pointer",
          fontFamily: SANS,
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          height: 24,
          padding: "0 6px",
          borderRadius: 7,
          background: v("card"),
          color: v("foreground"),
          fontSize: 11.5,
          fontWeight: 500,
          maxWidth: 200,
          boxShadow: `inset 0 0 0 1px ${v("border")}, ${v("shadow-xs", "none")}`
        },
        children: [
          /* @__PURE__ */ jsx(Chips, { swatch: currentSwatch, w: 6, h: 11 }),
          /* @__PURE__ */ jsx("span", { style: { overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", minWidth: 0 }, children: current?.name ?? "theme" }),
          /* @__PURE__ */ jsx("span", { style: { color: v("muted-foreground"), textTransform: "capitalize", fontSize: 10.5, flex: "none" }, children: mode }),
          /* @__PURE__ */ jsx("span", { style: { color: v("muted-foreground"), fontSize: 9, flex: "none" }, children: "\u25BE" })
        ]
      }
    ),
    open ? /* @__PURE__ */ jsx(
      "div",
      {
        role: "listbox",
        "aria-label": "Theme and mode",
        style: {
          ...popover,
          position: "absolute",
          top: menuPlacement.side === "down" ? 28 : void 0,
          bottom: menuPlacement.side === "up" ? 28 : void 0,
          right: 0,
          width: 296,
          padding: 4,
          zIndex: 30,
          maxHeight: menuPlacement.maxHeight,
          overflowY: "auto"
        },
        children: catalog.themes.map((entry) => /* @__PURE__ */ jsxs("div", { style: { padding: "1px 0" }, children: [
          ["light", "dark"].map((m) => /* @__PURE__ */ jsx(ThemeRow, { entry, mode: m, active: entry.id === catalog.activeThemeId && m === mode, onPick: () => {
            onPick(entry.id, m);
            setOpen(false);
          } }, m)),
          /* @__PURE__ */ jsx("div", { style: { height: 1, background: v("border-hairline", v("border")), margin: "3px 6px" } })
        ] }, entry.id))
      }
    ) : null
  ] });
}
var MODE_KEY = "bb.theme";
function useColorMode() {
  const read = () => document.documentElement.classList.contains("dark") ? "dark" : "light";
  const [mode, setMode] = useState(read);
  useEffect(() => {
    const mo = new MutationObserver(() => setMode(read()));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => mo.disconnect();
  }, []);
  const set = (next) => {
    const previous = localStorage.getItem(MODE_KEY);
    localStorage.setItem(MODE_KEY, next);
    window.dispatchEvent(new StorageEvent("storage", { key: MODE_KEY, oldValue: previous, newValue: next, storageArea: localStorage }));
    document.documentElement.classList.toggle("dark", next === "dark");
    document.documentElement.style.colorScheme = next;
    setMode(next);
  };
  return [mode, set];
}
function Toggle({ on, onChange, children }) {
  return /* @__PURE__ */ jsx(
    "button",
    {
      type: "button",
      onClick: onChange,
      style: {
        appearance: "none",
        border: 0,
        cursor: "pointer",
        fontFamily: SANS,
        fontSize: 11.5,
        fontWeight: on ? 600 : 500,
        height: 22,
        padding: "0 8px",
        borderRadius: 6,
        background: on ? v("card") : "transparent",
        color: on ? v("foreground") : v("muted-foreground"),
        boxShadow: on ? `inset 0 0 0 1px ${v("border")}, ${v("shadow-xs", "none")}` : "none"
      },
      children
    }
  );
}
function PreviewPage({ subPath }) {
  const rpc = useRpc();
  const [mode, setMode] = useColorMode();
  const navigate = useBbNavigate();
  const rootRef = useRef(null);
  const [layout, setLayout] = useState({ compact: false, stageHeight: 620 });
  const [catalog, setCatalog] = useState({ activeThemeId: null, themes: [], revision: 0 });
  const [error, setError] = useState(null);
  const catalogRequests = useRef(new LatestRequest());
  const selectionPending = useRef(false);
  const view = useMemo(() => {
    const first = subPath.split("/").filter(Boolean)[0] ?? "";
    return VIEWS.includes(first) ? first : "thread";
  }, [subPath]);
  const loadRef = useRef(() => {
  });
  useEffect(() => {
    let cancelled = false;
    const load = () => {
      if (selectionPending.current) return;
      const request = catalogRequests.current.begin();
      rpc.call("themeCatalog", {}).then((c) => {
        if (!cancelled && catalogRequests.current.isLatest(request)) setCatalog(c);
      }).catch((e) => {
        if (catalogRequests.current.isLatest(request)) setError(String(e));
      });
    };
    loadRef.current = load;
    load();
    const timer = setInterval(load, 8e3);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [rpc]);
  useRealtime("theme-preview:changed", () => loadRef.current());
  useLayoutEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const measure = () => {
      const compact = el.clientWidth < 920;
      const framePaneWidth = compact ? el.clientWidth : el.clientWidth - 276;
      const fittedFrameHeight = Math.round(Math.max(0, framePaneWidth - 32) / FRAME_W * FRAME_H + 26);
      const stageHeight = Math.min(720, Math.max(compact ? 320 : 500, fittedFrameHeight));
      setLayout((current) => current.compact === compact && current.stageHeight === stageHeight ? current : { compact, stageHeight });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);
  const pick = (themeId, nextMode) => {
    setMode(nextMode);
    selectionPending.current = true;
    const request = catalogRequests.current.begin();
    rpc.call("setTheme", { themeId }).then((next) => {
      if (catalogRequests.current.isLatest(request)) setCatalog(next);
    }).catch((err) => {
      if (catalogRequests.current.isLatest(request)) setError(String(err));
    }).finally(() => {
      if (catalogRequests.current.isLatest(request)) selectionPending.current = false;
    });
  };
  const revision = `${mode}:${catalog.activeThemeId ?? ""}:${catalog.revision}`;
  const computed = useComputedTokens(ALL_TOKENS, revision);
  return /* @__PURE__ */ jsxs("div", { ref: rootRef, "data-tp-root": true, style: { height: "100%", overflowY: "auto", overflowX: "hidden", background: v("canvas", v("background")), color: v("foreground"), fontFamily: SANS }, children: [
    /* @__PURE__ */ jsxs("div", { style: { position: "sticky", top: 0, zIndex: 20, display: "flex", alignItems: "center", flexWrap: "wrap", rowGap: 6, gap: 8, padding: "8px 16px", borderBottom: `1px solid ${v("border-seam", v("border"))}`, background: v("canvas", v("background")) }, children: [
      /* @__PURE__ */ jsx("div", { style: { display: "inline-flex", gap: 1, padding: 2, borderRadius: 8, background: v("surface-recessed", v("muted")) }, children: VIEWS.map((item) => /* @__PURE__ */ jsx(Toggle, { on: item === view, onChange: () => navigate.toPluginPanel("preview", { subPath: item }), children: VIEW_LABEL[item] }, item)) }),
      layout.compact ? null : /* @__PURE__ */ jsx("span", { style: { fontSize: 11.5, color: v("muted-foreground") }, children: VIEW_NOTE[view] }),
      /* @__PURE__ */ jsx("div", { style: { flex: 1 } }),
      error ? /* @__PURE__ */ jsx("span", { style: { fontSize: 12, color: v("destructive-text", v("destructive")) }, children: error }) : null
    ] }),
    /* @__PURE__ */ jsxs(
      "div",
      {
        "data-tp-layout": layout.compact ? "stacked" : "stage-with-surfaces",
        style: {
          minHeight: 0,
          display: "grid",
          gridTemplateColumns: layout.compact ? "minmax(0, 1fr)" : "minmax(0, 1fr) 276px",
          gridTemplateRows: layout.compact ? `${layout.stageHeight}px auto` : void 0,
          height: layout.compact ? void 0 : layout.stageHeight,
          borderBottom: `1px solid ${v("border-seam", v("border"))}`
        },
        children: [
          /* @__PURE__ */ jsx("div", { "data-tp-section": "frame", style: { minWidth: 0, minHeight: 0, display: "flex", flexDirection: "column", padding: "12px 16px 14px" }, children: /* @__PURE__ */ jsx(Frame, { view, fitBoth: true }) }),
          /* @__PURE__ */ jsx(
            "div",
            {
              "data-tp-section": "surfaces",
              style: {
                minWidth: 0,
                padding: "16px 16px 20px",
                borderLeft: layout.compact ? void 0 : `1px solid ${v("border-seam", v("border"))}`,
                borderTop: layout.compact ? `1px solid ${v("border-seam", v("border"))}` : void 0,
                background: v("surface-recessed-soft-solid", v("card"))
              },
              children: /* @__PURE__ */ jsx(SurfaceControls, { computed, catalog, mode, onPick: pick })
            }
          )
        ]
      }
    ),
    /* @__PURE__ */ jsx("div", { "data-tp-section": "guide", style: { margin: "18px 16px 24px", padding: "18px 18px 22px", borderRadius: 14, background: v("card"), boxShadow: `inset 0 0 0 1px ${v("border-seam", v("border"))}, ${v("shadow-xs", "none")}` }, children: /* @__PURE__ */ jsx(StyleGuide, { computed }) })
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
