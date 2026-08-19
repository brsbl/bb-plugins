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

// bb-plugin-runtime-shim:sonner
var runtime2 = globalThis.__bbPluginRuntime;
if (runtime2 == null || runtime2.sonner == null) {
  throw new Error('Cannot load "sonner": this bundle must be loaded by the BB app, which provides the shared plugin runtime (globalThis.__bbPluginRuntime).');
}
var mod2 = runtime2.sonner;
var {
  Toaster,
  toast,
  useSonner
} = mod2;

// bb-plugin-runtime-shim:@get-bb/plugin-sdk/app
var runtime3 = globalThis.__bbPluginRuntime;
if (runtime3 == null || runtime3.pluginSdkApp == null) {
  throw new Error('Cannot load "@get-bb/plugin-sdk/app": this bundle must be loaded by the BB app, which provides the shared plugin runtime (globalThis.__bbPluginRuntime).');
}
var mod3 = runtime3.pluginSdkApp;
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
} = mod3;

// gradient.ts
var MESH_STYLE_NAMES = [
  "aurora",
  "sunset",
  "ocean",
  "candy",
  "forest",
  "mono",
  "custom"
];
var MIN_POINTS = 3;
var MAX_POINTS = 8;
var DEFAULT_POINTS = 5;
var EDIT_MAX_POINTS = 12;
var MIN_RADIUS = 20;
var MAX_RADIUS = 120;
var STYLE_RANGES = {
  aurora: { hue: [140, 320], saturation: [70, 95], lightness: [52, 70] },
  sunset: { hue: [-30, 55], saturation: [75, 98], lightness: [55, 72] },
  ocean: { hue: [165, 260], saturation: [60, 92], lightness: [48, 68] },
  candy: { hue: [280, 430], saturation: [70, 100], lightness: [64, 80] },
  forest: { hue: [70, 170], saturation: [45, 80], lightness: [40, 62] }
};
var CORNER_ANCHORS = [
  [10, 12],
  [90, 10],
  [12, 88],
  [88, 90]
];
function mulberry32(seed) {
  let state = seed >>> 0;
  return () => {
    state = state + 1831565813 >>> 0;
    let t = state;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function between(random, range) {
  return range[0] + random() * (range[1] - range[0]);
}
function round(value) {
  return Math.round(value * 10) / 10;
}
function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
function normalizeSeed(seed) {
  if (!Number.isFinite(seed)) throw new Error("seed must be a finite number");
  return Math.abs(Math.trunc(seed)) % 4294967296;
}
function clampPointCount(pointCount) {
  if (!Number.isFinite(pointCount)) return DEFAULT_POINTS;
  return Math.min(MAX_POINTS, Math.max(MIN_POINTS, Math.trunc(pointCount)));
}
function randomSeed() {
  return Math.floor(Math.random() * 4294967296);
}
function styleRangesFor(style, random, customColor) {
  const monoBaseHue = random() * 360;
  if (style === "mono") {
    return {
      hue: [monoBaseHue - 16, monoBaseHue + 16],
      saturation: [55, 85],
      lightness: [42, 74]
    };
  }
  if (style === "custom") {
    return STYLE_RANGES.aurora;
  }
  return STYLE_RANGES[style];
}
var BASE_HUE_SWEEP = 70;
var BASE_LIGHTNESS_SWEEP = 26;
var BASE_EDGE_DESATURATION = 0.25;
function colorPointFromBase(point, hex) {
  const base = hexToHsl(hex);
  const offsetX = point.x / 100 - 0.5;
  const offsetY = point.y / 100 - 0.5;
  const distance = Math.min(1, Math.hypot(offsetX, offsetY) / Math.SQRT1_2);
  const hue = ((base.hue + offsetX * BASE_HUE_SWEEP) % 360 + 360) % 360;
  return {
    ...point,
    hue: round(hue) % 360,
    saturation: round(
      clamp(base.saturation * (1 - BASE_EDGE_DESATURATION * distance), 8, 100)
    ),
    // Top of the canvas reads lighter, bottom deeper.
    lightness: round(
      clamp(base.lightness - offsetY * BASE_LIGHTNESS_SWEEP, 12, 92)
    )
  };
}
function applyBaseColor(points, hex) {
  return points.map((point) => colorPointFromBase(point, hex));
}
function generateMeshGradient(options) {
  const seed = normalizeSeed(options.seed);
  const pointCount = clampPointCount(options.pointCount ?? DEFAULT_POINTS);
  const style = options.style ?? "aurora";
  if (!MESH_STYLE_NAMES.includes(style)) {
    throw new Error(`unknown style ${JSON.stringify(style)}`);
  }
  if (style === "custom" && options.customColor === void 0) {
    throw new Error("the custom style requires customColor");
  }
  const random = mulberry32(seed);
  const ranges = styleRangesFor(style, random, options.customColor);
  const points = [];
  for (let index = 0; index < pointCount; index += 1) {
    const anchor = CORNER_ANCHORS[index];
    const x = anchor ? anchor[0] + (random() - 0.5) * 28 : 15 + random() * 70;
    const y = anchor ? anchor[1] + (random() - 0.5) * 28 : 15 + random() * 70;
    points.push({
      x: round(clamp(x, 0, 100)),
      y: round(clamp(y, 0, 100)),
      hue: round((between(random, ranges.hue) % 360 + 360) % 360) % 360,
      saturation: round(between(random, ranges.saturation)),
      lightness: round(between(random, ranges.lightness)),
      radius: round(45 + random() * 35)
    });
  }
  return {
    seed,
    style,
    points: style === "custom" && options.customColor ? applyBaseColor(points, options.customColor) : points,
    ...style === "custom" ? { customColor: options.customColor } : {}
  };
}
function newPointAt(spec, x, y) {
  const random = mulberry32(
    (spec.seed ^ Math.round(x * 71) * 31 + Math.round(y * 137)) >>> 0
  );
  const ranges = styleRangesFor(spec.style, random, spec.customColor);
  const point = {
    x: round(clamp(x, 0, 100)),
    y: round(clamp(y, 0, 100)),
    hue: round((between(random, ranges.hue) % 360 + 360) % 360) % 360,
    saturation: round(between(random, ranges.saturation)),
    lightness: round(between(random, ranges.lightness)),
    radius: round(45 + random() * 35)
  };
  return spec.style === "custom" && spec.customColor ? colorPointFromBase(point, spec.customColor) : point;
}
function pointColor(point) {
  return `hsl(${point.hue} ${point.saturation}% ${point.lightness}%)`;
}
function baseColor(spec) {
  const first = spec.points[0];
  if (!first) throw new Error("mesh gradient has no points");
  return `hsl(${first.hue} ${first.saturation}% ${Math.max(
    8,
    round(first.lightness * 0.45)
  )}%)`;
}
function toCssLayers(spec) {
  const layers = spec.points.map(
    (point) => `radial-gradient(at ${point.x}% ${point.y}%, ${pointColor(point)} 0px, transparent ${point.radius}%)`
  );
  return { backgroundColor: baseColor(spec), backgroundImage: layers.join(", ") };
}
function toCss(spec) {
  const layers = toCssLayers(spec);
  return `background-color: ${layers.backgroundColor};
background-image: ${layers.backgroundImage};`;
}
function relativeLuminance(r, g, b) {
  const channel = (value) => {
    const scaled = value / 255;
    return scaled <= 0.04045 ? scaled / 12.92 : ((scaled + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}
function contrastRatio(luminanceA, luminanceB) {
  const lighter = Math.max(luminanceA, luminanceB);
  const darker = Math.min(luminanceA, luminanceB);
  return (lighter + 0.05) / (darker + 0.05);
}
function contrastReportFor(luminances) {
  if (luminances.length === 0) {
    throw new Error("contrast report needs at least one sample");
  }
  const brightest = Math.max(...luminances);
  const darkest = Math.min(...luminances);
  const white = contrastRatio(1, brightest);
  const black = contrastRatio(0, darkest);
  const best = white >= black ? "white" : "black";
  const bestRatio = Math.max(white, black);
  return {
    white: Math.round(white * 100) / 100,
    black: Math.round(black * 100) / 100,
    best,
    bestRatio: Math.round(bestRatio * 100) / 100,
    passesAA: bestRatio >= 4.5,
    passesAALarge: bestRatio >= 3
  };
}
function toSvg(spec, options = {}) {
  const width = options.width ?? 800;
  const height = options.height ?? 600;
  const prefix = `mesh-${spec.seed}`;
  const defs = spec.points.map((point, index) => {
    const cx = round(point.x / 100 * width);
    const cy = round(point.y / 100 * height);
    const r = round(point.radius / 100 * Math.max(width, height));
    return `<radialGradient id="${prefix}-${index}" gradientUnits="userSpaceOnUse" cx="${cx}" cy="${cy}" r="${r}"><stop offset="0" stop-color="${pointColor(point)}"/><stop offset="1" stop-color="${pointColor(point)}" stop-opacity="0"/></radialGradient>`;
  }).join("");
  const rects = spec.points.map((_, index) => index).reverse().map(
    (index) => `<rect width="${width}" height="${height}" fill="url(#${prefix}-${index})"/>`
  ).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><defs>${defs}</defs><rect width="${width}" height="${height}" fill="${baseColor(spec)}"/>${rects}</svg>`;
}
function hslToHex(hue, saturation, lightness) {
  const s = saturation / 100;
  const l = lightness / 100;
  const k = (n) => (n + hue / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const channel = (n) => {
    const value = l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return Math.round(value * 255).toString(16).padStart(2, "0");
  };
  return `#${channel(0)}${channel(8)}${channel(4)}`;
}
function hexToHsl(hex) {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) throw new Error(`invalid hex color ${JSON.stringify(hex)}`);
  const value = Number.parseInt(match[1], 16);
  const r = (value >> 16 & 255) / 255;
  const g = (value >> 8 & 255) / 255;
  const b = (value & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  const lightness = (max + min) / 2;
  let hue = 0;
  if (delta !== 0) {
    if (max === r) hue = (g - b) / delta % 6;
    else if (max === g) hue = (b - r) / delta + 2;
    else hue = (r - g) / delta + 4;
    hue *= 60;
    if (hue < 0) hue += 360;
  }
  const saturation = delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1));
  return {
    hue: round(hue) % 360,
    saturation: round(saturation * 100),
    lightness: round(lightness * 100)
  };
}
var NAME_TONES = [
  "quiet",
  "molten",
  "electric",
  "misty",
  "velvet",
  "glassy",
  "wild",
  "soft",
  "deep",
  "radiant",
  "dusky",
  "neon"
];
var NAME_FORMS = [
  "aurora",
  "dusk",
  "lagoon",
  "meadow",
  "nebula",
  "tide",
  "ember",
  "bloom",
  "drift",
  "haze",
  "prism",
  "horizon"
];
function nameFor(spec) {
  const random = mulberry32(spec.seed ^ 2654435769);
  const tone = NAME_TONES[Math.floor(random() * NAME_TONES.length)];
  const form = NAME_FORMS[Math.floor(random() * NAME_FORMS.length)];
  return `${tone} ${form}`;
}

// raster.ts
var SURFACE_PRESETS = [
  {
    id: "canvas",
    label: "Canvas",
    width: 1600,
    height: 1e3,
    overlay: "none",
    hint: "Free-form editing surface"
  },
  {
    id: "og",
    label: "OG card",
    width: 1200,
    height: 630,
    overlay: "headline",
    hint: "Link unfurls on X, Slack, iMessage"
  },
  {
    id: "hero",
    label: "Hero",
    width: 1600,
    height: 900,
    overlay: "headline",
    hint: "Marketing hero behind a headline"
  },
  {
    id: "avatar",
    label: "Avatar",
    width: 400,
    height: 400,
    overlay: "avatar",
    hint: "Circular identity mark"
  }
];
function presetById(id) {
  return SURFACE_PRESETS.find((preset) => preset.id === id) ?? SURFACE_PRESETS[0];
}
function hslaString(hue, saturation, lightness, alpha) {
  return `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`;
}
function drawMeshGradient(context, spec, width, height) {
  const points = spec.points;
  const first = points[0];
  if (!first) throw new Error("mesh gradient has no points");
  context.clearRect(0, 0, width, height);
  context.fillStyle = hslaString(
    first.hue,
    first.saturation,
    Math.max(8, Math.round(first.lightness * 0.45 * 10) / 10),
    1
  );
  context.fillRect(0, 0, width, height);
  const longest = Math.max(width, height);
  for (const point of [...points].reverse()) {
    const cx = point.x / 100 * width;
    const cy = point.y / 100 * height;
    const radius = Math.max(1, point.radius / 100 * longest);
    const gradient = context.createRadialGradient(cx, cy, 0, cx, cy, radius);
    gradient.addColorStop(
      0,
      hslaString(point.hue, point.saturation, point.lightness, 1)
    );
    gradient.addColorStop(
      1,
      hslaString(point.hue, point.saturation, point.lightness, 0)
    );
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);
  }
}
function createCanvas(width, height) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}
function measureContrast(spec, options = {}) {
  const width = options.width ?? 64;
  const height = options.height ?? 40;
  const canvas = createCanvas(width, height);
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return null;
  drawMeshGradient(context, spec, width, height);
  let data;
  try {
    data = context.getImageData(0, 0, width, height).data;
  } catch {
    return null;
  }
  const luminances = [];
  for (let index = 0; index < data.length; index += 4) {
    luminances.push(
      relativeLuminance(data[index], data[index + 1], data[index + 2])
    );
  }
  return luminances.length ? contrastReportFor(luminances) : null;
}
async function renderPngDataUrl(spec, preset) {
  const canvas = createCanvas(preset.width, preset.height);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("this browser has no 2D canvas context");
  drawMeshGradient(context, spec, preset.width, preset.height);
  return canvas.toDataURL("image/png");
}
function base64FromDataUrl(dataUrl) {
  const comma = dataUrl.indexOf(",");
  if (comma === -1) throw new Error("malformed data URL");
  return dataUrl.slice(comma + 1);
}

// theme.ts
function dominant(spec) {
  return spec.points.reduce(
    (widest, point) => point.radius > widest.radius ? point : widest
  );
}
function secondary(spec, baseHue) {
  let furthest = spec.points[0];
  let bestDistance = -1;
  for (const point of spec.points) {
    const delta = Math.abs(point.hue - baseHue);
    const distance = Math.min(delta, 360 - delta);
    if (distance > bestDistance) {
      bestDistance = distance;
      furthest = point;
    }
  }
  return furthest;
}
function toThemeCss(spec, options) {
  const base = dominant(spec);
  const accent = secondary(spec, base.hue);
  const hue = Math.round(base.hue);
  const accentHue = Math.round(accent.hue);
  const lightCanvas = hslToHex(hue, 24, 97);
  const lightInk = hslToHex(hue, 32, 14);
  const lightPrimary = hslToHex(accentHue, 62, 42);
  const darkCanvas = hslToHex(hue, 26, 11);
  const darkInk = hslToHex(hue, 16, 90);
  const darkPrimary = hslToHex(accentHue, 62, 68);
  return `/* ${options.name} \u2014 generated from a mesh gradient (seed ${spec.seed}).
   Only the anchors, accent, and semantics are set; bb derives the rest. */
:root, .light {
  --canvas: ${lightCanvas};
  --ink: ${lightInk};
  --primary: ${lightPrimary};
  --primary-foreground: ${lightCanvas};
  --muted-foreground: color-mix(in oklch, var(--ink) 70%, var(--canvas));
  --subtle-foreground: color-mix(in oklch, var(--ink) 58%, var(--canvas));
  --readback-foreground: color-mix(in oklch, var(--ink) 64%, var(--canvas));
  --timeline-accent: ${lightPrimary};
  --file-accent: var(--timeline-accent);
  --destructive: #b3261e;
  --destructive-text: #8c1d18;
  --warning: #b06000;
  --warning-text: #8a4b00;
  --attention: ${hslToHex(accentHue, 70, 55)};
  --success: #2e7d32;
  --diff-added: #2e7d32;
  --diff-removed: #b3261e;
  --pr-merged: ${hslToHex((accentHue + 40) % 360, 45, 50)};
}
.dark {
  --canvas: ${darkCanvas};
  --ink: ${darkInk};
  --primary: ${darkPrimary};
  --primary-foreground: ${darkCanvas};
  --timeline-accent: ${darkPrimary};
  --file-accent: var(--timeline-accent);
  --destructive: #f2b8b5;
  --destructive-text: #f2b8b5;
  --warning: #ffb77c;
  --warning-text: #ffb77c;
  --attention: ${hslToHex(accentHue, 70, 68)};
  --success: #7bc47f;
  --diff-added: #7bc47f;
  --diff-removed: #f2b8b5;
  --pr-merged: ${hslToHex((accentHue + 40) % 360, 50, 70)};
}
`;
}

// bb-plugin-runtime-shim:react/jsx-runtime
var runtime4 = globalThis.__bbPluginRuntime;
if (runtime4 == null || runtime4.jsxRuntime == null) {
  throw new Error('Cannot load "react/jsx-runtime": this bundle must be loaded by the BB app, which provides the shared plugin runtime (globalThis.__bbPluginRuntime).');
}
var mod4 = runtime4.jsxRuntime;
var {
  Fragment: Fragment2,
  jsx,
  jsxs
} = mod4;

// app.tsx
var MIN_EDIT_POINTS = 2;
var segmentIconClass = "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-40";
var clusterClass = "flex h-8 items-center rounded-full border border-border bg-card";
var menuClass = "absolute left-0 top-9 z-10 min-w-36 rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-lg";
var primaryButtonClass = "ml-auto inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-primary px-3.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-50";
var sliderClass = "h-1 min-w-10 flex-1 cursor-pointer appearance-none rounded-full bg-border outline-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-foreground [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-foreground";
var swatchClass = "h-5 w-5 shrink-0 cursor-pointer appearance-none rounded-full border border-border bg-transparent p-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-full [&::-webkit-color-swatch]:border-0";
function errorMessage(error) {
  return error instanceof Error ? error.message : "Something went wrong";
}
async function copyToClipboard(label, text) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  } catch (error) {
    toast.error(`Copy failed: ${errorMessage(error)}`);
  }
}
function IconMore() {
  return /* @__PURE__ */ jsxs("svg", { width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
    /* @__PURE__ */ jsx("circle", { cx: "5", cy: "12", r: "1" }),
    /* @__PURE__ */ jsx("circle", { cx: "12", cy: "12", r: "1" }),
    /* @__PURE__ */ jsx("circle", { cx: "19", cy: "12", r: "1" })
  ] });
}
function IconSend() {
  return /* @__PURE__ */ jsxs("svg", { width: "12", height: "12", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
    /* @__PURE__ */ jsx("path", { d: "m22 2-11 11" }),
    /* @__PURE__ */ jsx("path", { d: "M22 2 15 22l-4-9-9-4z" })
  ] });
}
function IconUndo() {
  return /* @__PURE__ */ jsxs("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
    /* @__PURE__ */ jsx("path", { d: "M3 7v6h6" }),
    /* @__PURE__ */ jsx("path", { d: "M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" })
  ] });
}
function IconShuffle() {
  return /* @__PURE__ */ jsxs("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
    /* @__PURE__ */ jsx("path", { d: "M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.8-1.1 2-1.7 3.3-1.7H22" }),
    /* @__PURE__ */ jsx("path", { d: "m18 2 4 4-4 4" }),
    /* @__PURE__ */ jsx("path", { d: "M2 6h1.9c1.5 0 2.9.9 3.6 2.2" }),
    /* @__PURE__ */ jsx("path", { d: "M22 18h-5.9c-1.3 0-2.6-.7-3.3-1.8l-.5-.8" }),
    /* @__PURE__ */ jsx("path", { d: "m18 14 4 4-4 4" })
  ] });
}
function IconTrash() {
  return /* @__PURE__ */ jsxs("svg", { width: "13", height: "13", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
    /* @__PURE__ */ jsx("path", { d: "M3 6h18" }),
    /* @__PURE__ */ jsx("path", { d: "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" }),
    /* @__PURE__ */ jsx("path", { d: "M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" })
  ] });
}
function IconChevron() {
  return /* @__PURE__ */ jsx("svg", { width: "12", height: "12", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsx("path", { d: "m6 9 6 6 6-6" }) });
}
var GLASS_ORB = {
  backgroundColor: "rgba(255,255,255,0.05)",
  backgroundImage: "radial-gradient(circle at 32% 26%, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.10) 38%, rgba(255,255,255,0) 68%)",
  boxShadow: [
    "inset 0 0 0 1px rgba(255,255,255,0.22)",
    "inset 0 1px 1.5px rgba(255,255,255,0.40)",
    "inset 0 -1px 1.5px rgba(0,0,0,0.16)",
    "0 1px 2px rgba(0,0,0,0.28)",
    "0 2px 7px rgba(0,0,0,0.26)"
  ].join(", ")
};
var SELECTED_ORB = {
  ...GLASS_ORB,
  backgroundColor: "rgba(255,255,255,0.09)",
  boxShadow: [
    "inset 0 0 0 1.5px rgba(255,255,255,0.34)",
    "inset 0 1.5px 2px rgba(255,255,255,0.52)",
    "inset 0 -1.5px 2px rgba(0,0,0,0.2)",
    "0 1px 2px rgba(0,0,0,0.32)",
    "0 3px 9px rgba(0,0,0,0.3)"
  ].join(", ")
};
function usePopover() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);
  return { open, setOpen, rootRef };
}
function MoreMenu({ items }) {
  const { open, setOpen, rootRef } = usePopover();
  return /* @__PURE__ */ jsxs("div", { className: "relative", ref: rootRef, children: [
    /* @__PURE__ */ jsx(
      "button",
      {
        type: "button",
        "aria-label": "More actions",
        title: "More actions",
        "aria-expanded": open,
        "aria-haspopup": "menu",
        className: segmentIconClass,
        onClick: () => setOpen((current) => !current),
        children: /* @__PURE__ */ jsx(IconMore, {})
      }
    ),
    open && /* @__PURE__ */ jsx("div", { role: "menu", className: menuClass, children: items.map((item) => /* @__PURE__ */ jsx(
      "button",
      {
        type: "button",
        role: "menuitem",
        className: "block w-full rounded-lg px-2.5 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground",
        onClick: () => {
          setOpen(false);
          item.onSelect();
        },
        children: item.label
      },
      item.label
    )) })
  ] });
}
function PresetMenu({
  value,
  onChange
}) {
  const { open, setOpen, rootRef } = usePopover();
  return /* @__PURE__ */ jsxs("div", { className: "relative flex h-full items-center", ref: rootRef, children: [
    /* @__PURE__ */ jsxs(
      "button",
      {
        type: "button",
        "aria-label": "Surface",
        title: `Surface \u2014 ${value.hint}`,
        "aria-expanded": open,
        "aria-haspopup": "menu",
        className: "inline-flex h-6 items-center gap-1.5 rounded-full px-2 text-sm text-foreground transition-colors hover:bg-accent",
        onClick: () => setOpen((current) => !current),
        children: [
          value.label,
          /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: /* @__PURE__ */ jsx(IconChevron, {}) })
        ]
      }
    ),
    open && /* @__PURE__ */ jsx("div", { role: "menu", className: menuClass, children: SURFACE_PRESETS.map((preset) => /* @__PURE__ */ jsxs(
      "button",
      {
        type: "button",
        role: "menuitemradio",
        "aria-checked": preset.id === value.id,
        className: "flex w-full flex-col rounded-lg px-2.5 py-1.5 text-left hover:bg-accent hover:text-accent-foreground",
        onClick: () => {
          setOpen(false);
          onChange(preset);
        },
        children: [
          /* @__PURE__ */ jsxs(
            "span",
            {
              className: `text-sm ${preset.id === value.id ? "font-medium" : ""}`,
              children: [
                preset.label,
                /* @__PURE__ */ jsxs("span", { className: "ml-1.5 text-xs text-muted-foreground", children: [
                  preset.width,
                  "\xD7",
                  preset.height
                ] })
              ]
            }
          ),
          /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground", children: preset.hint })
        ]
      },
      preset.id
    )) })
  ] });
}
var SELECTABLE_STYLES = MESH_STYLE_NAMES.filter((style) => style !== "custom");
var STYLE_PREVIEWS = Object.fromEntries(
  SELECTABLE_STYLES.map((style) => {
    const layers = toCssLayers(
      generateMeshGradient({ seed: 47, pointCount: 4, style })
    );
    return [
      style,
      {
        backgroundColor: layers.backgroundColor,
        backgroundImage: layers.backgroundImage
      }
    ];
  })
);
function chipStyle(spec) {
  if (spec.style === "custom") {
    const layers = toCssLayers(spec);
    return {
      backgroundColor: layers.backgroundColor,
      backgroundImage: layers.backgroundImage
    };
  }
  return STYLE_PREVIEWS[spec.style];
}
function StyleMenu({
  spec,
  customHex,
  onChange,
  onCustomColor,
  onCustomColorCommit
}) {
  const { open, setOpen, rootRef } = usePopover();
  return /* @__PURE__ */ jsxs("div", { className: "relative flex h-full items-center", ref: rootRef, children: [
    /* @__PURE__ */ jsxs(
      "button",
      {
        type: "button",
        "aria-label": "Gradient style",
        title: "Gradient style",
        "aria-expanded": open,
        "aria-haspopup": "menu",
        className: "inline-flex h-6 items-center gap-1.5 rounded-full px-2 text-sm text-foreground transition-colors hover:bg-accent",
        onClick: () => setOpen((current) => !current),
        children: [
          /* @__PURE__ */ jsx(
            "span",
            {
              "aria-hidden": true,
              className: "h-3.5 w-3.5 rounded-full border border-border",
              style: chipStyle(spec)
            }
          ),
          spec.style,
          /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: /* @__PURE__ */ jsx(IconChevron, {}) })
        ]
      }
    ),
    open && /* @__PURE__ */ jsxs("div", { role: "menu", className: menuClass, children: [
      SELECTABLE_STYLES.map((styleName) => /* @__PURE__ */ jsxs(
        "button",
        {
          type: "button",
          role: "menuitemradio",
          "aria-checked": styleName === spec.style,
          className: "flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground",
          onClick: () => {
            setOpen(false);
            onChange(styleName);
          },
          children: [
            /* @__PURE__ */ jsx(
              "span",
              {
                "aria-hidden": true,
                className: "h-4 w-7 shrink-0 rounded border border-border",
                style: STYLE_PREVIEWS[styleName]
              }
            ),
            /* @__PURE__ */ jsx("span", { className: styleName === spec.style ? "font-medium" : void 0, children: styleName })
          ]
        },
        styleName
      )),
      /* @__PURE__ */ jsx("div", { "aria-hidden": true, className: "my-1 h-px bg-border" }),
      /* @__PURE__ */ jsxs("label", { className: "flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground", children: [
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "color",
            "aria-label": "Custom color",
            className: `${swatchClass} h-4 w-7 rounded`,
            value: customHex,
            onChange: (event) => onCustomColor(event.target.value),
            onBlur: onCustomColorCommit
          }
        ),
        /* @__PURE__ */ jsx("span", { className: spec.style === "custom" ? "font-medium" : void 0, children: "custom" })
      ] })
    ] })
  ] });
}
function SavedTile({
  gradient,
  onLoad,
  onDelete,
  onSend
}) {
  const layers = useMemo(
    () => toCssLayers({
      seed: gradient.seed,
      style: gradient.style,
      points: gradient.points
    }),
    [gradient]
  );
  return /* @__PURE__ */ jsxs("div", { className: "group relative overflow-hidden rounded-lg border border-border bg-card", children: [
    /* @__PURE__ */ jsxs(
      "button",
      {
        type: "button",
        className: "block w-full text-left",
        onClick: () => onLoad(gradient),
        children: [
          /* @__PURE__ */ jsx(
            "div",
            {
              className: "h-20 w-full",
              style: {
                backgroundColor: layers.backgroundColor,
                backgroundImage: layers.backgroundImage
              }
            }
          ),
          /* @__PURE__ */ jsxs("div", { className: "px-2.5 py-2", children: [
            /* @__PURE__ */ jsx("div", { className: "truncate text-sm font-medium text-foreground", children: gradient.name }),
            /* @__PURE__ */ jsxs("div", { className: "truncate text-xs text-muted-foreground", children: [
              gradient.edited ? "edited" : gradient.style,
              " \xB7 seed ",
              gradient.seed
            ] })
          ] })
        ]
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "absolute right-1.5 top-1.5 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-100", children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          "aria-label": `Send ${gradient.name} to agent`,
          title: "Send to agent",
          className: "inline-flex h-6 w-6 items-center justify-center rounded-md bg-black/45 text-white",
          onClick: () => onSend(gradient),
          children: /* @__PURE__ */ jsx(IconSend, {})
        }
      ),
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          "aria-label": `Delete ${gradient.name}`,
          title: "Delete",
          className: "inline-flex h-6 w-6 items-center justify-center rounded-md bg-black/45 text-xs text-white",
          onClick: () => onDelete(gradient.id),
          children: "\xD7"
        }
      )
    ] })
  ] });
}
function Studio({ threadId }) {
  const rpc = useRpc();
  const composer = useComposer();
  const { projectId } = useBbContext();
  const [state, setState] = useState(() => ({
    draft: { spec: generateMeshGradient({ seed: randomSeed() }), edited: false },
    history: [],
    selected: null
  }));
  const [saved, setSaved] = useState([]);
  const [libraryLoaded, setLibraryLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [preset, setPreset] = useState(() => presetById("canvas"));
  const [customHex, setCustomHex] = useState("#3366ff");
  const canvasRef = useRef(null);
  const lastAction = useRef(null);
  const dragKey = useRef(null);
  const dragCount = useRef(0);
  const { spec, edited } = state.draft;
  const customColor = spec.style === "custom" && spec.customColor !== void 0 ? spec.customColor : customHex;
  const contrast = useMemo(() => measureContrast(spec), [spec]);
  const layers = useMemo(() => toCssLayers(spec), [spec]);
  const displayName = useMemo(
    () => edited ? `${nameFor(spec)} (edited)` : nameFor(spec),
    [spec, edited]
  );
  const selectedPoint = state.selected !== null ? spec.points[state.selected] : void 0;
  const mutate = useCallback(
    (actionKey, produce, select) => {
      setState((prev) => {
        const push = actionKey === null || lastAction.current !== actionKey;
        lastAction.current = actionKey;
        return {
          draft: produce(prev.draft),
          history: push ? [...prev.history.slice(-49), prev.draft] : prev.history,
          selected: select === void 0 ? prev.selected : select
        };
      });
    },
    []
  );
  const undo = useCallback(() => {
    lastAction.current = null;
    setState((prev) => {
      const previous = prev.history.at(-1);
      if (!previous) return prev;
      return {
        draft: previous,
        history: prev.history.slice(0, -1),
        selected: null
      };
    });
  }, []);
  const updatePoint = useCallback(
    (actionKey, index, patch) => {
      mutate(actionKey, (draft) => ({
        spec: {
          ...draft.spec,
          points: draft.spec.points.map(
            (point, pointIndex) => pointIndex === index ? { ...point, ...patch } : point
          )
        },
        edited: true
      }));
    },
    [mutate]
  );
  const addPoint = useCallback(
    (x, y) => {
      mutate(
        null,
        (draft) => draft.spec.points.length >= EDIT_MAX_POINTS ? draft : {
          spec: {
            ...draft.spec,
            points: [...draft.spec.points, newPointAt(draft.spec, x, y)]
          },
          edited: true
        },
        Math.min(spec.points.length, EDIT_MAX_POINTS - 1)
      );
    },
    [mutate, spec.points.length]
  );
  const removePoint = useCallback(
    (index) => {
      mutate(
        null,
        (draft) => draft.spec.points.length <= MIN_EDIT_POINTS ? draft : {
          spec: {
            ...draft.spec,
            points: draft.spec.points.filter(
              (_, pointIndex) => pointIndex !== index
            )
          },
          edited: true
        },
        null
      );
    },
    [mutate]
  );
  const refresh = useCallback(async () => {
    try {
      const { gradients } = await rpc.call("listSaved");
      setSaved(gradients);
    } catch (error) {
      toast.error(`Loading library failed: ${errorMessage(error)}`);
    } finally {
      setLibraryLoaded(true);
    }
  }, [rpc]);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  useRealtime("gradients", () => {
    void refresh();
  });
  const persist = useCallback(async () => {
    const result = await rpc.call("saveGradient", {
      name: displayName,
      seed: spec.seed,
      style: spec.style,
      edited,
      points: spec.points,
      ...spec.customColor === void 0 ? {} : { customColor: spec.customColor }
    });
    await refresh();
    return result;
  }, [rpc, displayName, spec, edited, refresh]);
  const exportPng = useCallback(async () => {
    if (!projectId) {
      toast.error("Open a project to export a PNG");
      return;
    }
    setBusy(true);
    try {
      const dataUrl = await renderPngDataUrl(spec, preset);
      const { path } = await rpc.call("exportPng", {
        projectId,
        name: `${displayName}-${preset.id}`,
        base64: base64FromDataUrl(dataUrl)
      });
      composer.updateText(
        (current) => `${current.trim() === "" ? "" : `${current}

`}Use the gradient image at ${path} (${preset.width}\xD7${preset.height}) for `
      );
      composer.focus();
      toast.success(`PNG attached as ${path}`);
    } catch (error) {
      toast.error(`PNG export failed: ${errorMessage(error)}`);
    } finally {
      setBusy(false);
    }
  }, [projectId, spec, preset, rpc, displayName, composer]);
  const exportTokens = useCallback(async () => {
    setBusy(true);
    try {
      const { path, gradientCount } = await rpc.call("exportTokens", {
        threadId: threadId ?? null
      });
      toast.success(`Wrote ${gradientCount} gradients to ${path}`);
    } catch (error) {
      toast.error(`Token export failed: ${errorMessage(error)}`);
    } finally {
      setBusy(false);
    }
  }, [rpc, threadId]);
  const save = useCallback(async () => {
    setBusy(true);
    try {
      const { gradient, alreadySaved } = await persist();
      toast.success(
        alreadySaved ? `Already in library as \u201C${gradient.name}\u201D` : `Saved \u201C${gradient.name}\u201D`
      );
    } catch (error) {
      toast.error(`Save failed: ${errorMessage(error)}`);
    } finally {
      setBusy(false);
    }
  }, [persist]);
  const insertHandoff = useCallback(
    (gradient) => {
      composer.updateText(
        (current) => current.trim() === "" ? "Apply the " : `${current}

Apply the `
      );
      composer.insertMention({
        provider: "gradient",
        id: gradient.id,
        label: gradient.name
      });
      composer.updateText((current) => `${current} mesh gradient to `);
      composer.focus();
      toast.success("Handoff added to the composer");
    },
    [composer]
  );
  const sendToAgent = useCallback(async () => {
    setBusy(true);
    try {
      const { gradient } = await persist();
      insertHandoff(gradient);
    } catch (error) {
      toast.error(`Send failed: ${errorMessage(error)}`);
    } finally {
      setBusy(false);
    }
  }, [persist, insertHandoff]);
  const canvasPercent = useCallback((clientX, clientY) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return null;
    return {
      x: clamp((clientX - rect.left) / rect.width * 100, 0, 100),
      y: clamp((clientY - rect.top) / rect.height * 100, 0, 100)
    };
  }, []);
  return /* @__PURE__ */ jsx(
    "div",
    {
      className: "h-full overflow-y-auto px-4 py-2.5 md:px-5 md:py-3",
      onKeyDown: (event) => {
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") {
          event.preventDefault();
          undo();
          return;
        }
        const target = event.target;
        if (target.tagName === "INPUT" || target.tagName === "SELECT") return;
        if (state.selected === null) return;
        const step = event.shiftKey ? 5 : 1;
        const nudgeKey = `nudge-${state.selected}`;
        const point = spec.points[state.selected];
        if (!point) return;
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          updatePoint(nudgeKey, state.selected, { x: clamp(point.x - step, 0, 100) });
        } else if (event.key === "ArrowRight") {
          event.preventDefault();
          updatePoint(nudgeKey, state.selected, { x: clamp(point.x + step, 0, 100) });
        } else if (event.key === "ArrowUp") {
          event.preventDefault();
          updatePoint(nudgeKey, state.selected, { y: clamp(point.y - step, 0, 100) });
        } else if (event.key === "ArrowDown") {
          event.preventDefault();
          updatePoint(nudgeKey, state.selected, { y: clamp(point.y + step, 0, 100) });
        } else if (event.key === "Delete" || event.key === "Backspace") {
          event.preventDefault();
          removePoint(state.selected);
        }
      },
      children: /* @__PURE__ */ jsxs("div", { className: "mx-auto w-full max-w-3xl space-y-2.5", children: [
        /* @__PURE__ */ jsxs("p", { className: "text-xs leading-relaxed text-muted-foreground", children: [
          "Drag points to move them, click one to recolor it or set its falloff, double-click the canvas to add one. \u2318Z undoes.",
          " ",
          /* @__PURE__ */ jsx("span", { className: "text-foreground", children: "Send to agent" }),
          " writes a handoff into this thread\u2019s composer \u2014 or hover a saved gradient to send it straight from the library. In any thread, type",
          " ",
          /* @__PURE__ */ jsx("code", { className: "rounded bg-muted px-1 py-0.5", children: "@gradient" }),
          " to hand a saved gradient to an agent with its exact values."
        ] }),
        /* @__PURE__ */ jsx("div", { className: "overflow-hidden rounded-lg border border-border", children: /* @__PURE__ */ jsxs(
          "div",
          {
            ref: canvasRef,
            className: `relative w-full ${preset.overlay === "avatar" ? "mx-auto max-w-[260px] rounded-full" : ""}`,
            "data-testid": "gradient-preview",
            style: {
              aspectRatio: `${preset.width} / ${preset.height}`,
              backgroundColor: layers.backgroundColor,
              backgroundImage: layers.backgroundImage
            },
            onDoubleClick: (event) => {
              const position = canvasPercent(event.clientX, event.clientY);
              if (position) addPoint(position.x, position.y);
            },
            onPointerDown: () => setState((prev) => ({ ...prev, selected: null })),
            children: [
              spec.points.map((point, index) => /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  "aria-label": `Gradient point ${index + 1}`,
                  "aria-pressed": state.selected === index,
                  "data-mesh-handle": index,
                  className: "group absolute z-10 flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 touch-none cursor-grab items-center justify-center active:cursor-grabbing",
                  style: { left: `${point.x}%`, top: `${point.y}%` },
                  onClick: (event) => event.stopPropagation(),
                  onDoubleClick: (event) => event.stopPropagation(),
                  onPointerDown: (event) => {
                    event.stopPropagation();
                    dragCount.current += 1;
                    dragKey.current = `drag-${dragCount.current}`;
                    setState((prev) => ({ ...prev, selected: index }));
                    try {
                      event.currentTarget.setPointerCapture(event.pointerId);
                    } catch {
                    }
                  },
                  onPointerMove: (event) => {
                    if (!dragKey.current) return;
                    const position = canvasPercent(event.clientX, event.clientY);
                    if (position) {
                      updatePoint(dragKey.current, index, position);
                    }
                  },
                  onPointerUp: () => {
                    dragKey.current = null;
                    lastAction.current = null;
                  },
                  onLostPointerCapture: () => {
                    dragKey.current = null;
                    lastAction.current = null;
                  },
                  children: /* @__PURE__ */ jsx(
                    "span",
                    {
                      "aria-hidden": true,
                      className: `block rounded-full backdrop-blur-[3px] backdrop-saturate-[1.9] backdrop-contrast-[1.12] backdrop-brightness-[0.9] transition-[width,height,box-shadow] duration-100 group-hover:backdrop-brightness-105 ${state.selected === index ? "h-3.5 w-3.5" : "h-2.5 w-2.5"}`,
                      style: state.selected === index ? SELECTED_ORB : GLASS_ORB
                    }
                  )
                },
                index
              )),
              preset.overlay === "headline" && contrast && /* @__PURE__ */ jsxs(
                "div",
                {
                  className: "pointer-events-none absolute inset-0 flex flex-col justify-center gap-1 p-[8%]",
                  style: { color: contrast.best === "white" ? "#ffffff" : "#000000" },
                  children: [
                    /* @__PURE__ */ jsx("p", { className: "text-[clamp(1rem,4cqw,2.25rem)] font-semibold leading-tight", children: "Put your agents to work" }),
                    /* @__PURE__ */ jsx("p", { className: "text-[clamp(0.7rem,2cqw,1rem)] opacity-80", children: "Sample copy \u2014 check it stays readable" })
                  ]
                }
              ),
              preset.overlay === "headline" && contrast && /* @__PURE__ */ jsx(
                "div",
                {
                  className: "pointer-events-none absolute right-3 top-3 rounded-full bg-black/50 px-2 py-0.5 text-xs font-medium text-white",
                  title: `Worst-case contrast for ${contrast.best} text on this gradient: ${contrast.bestRatio}:1. White ${contrast.white}:1, black ${contrast.black}:1.`,
                  children: contrast.passesAA ? "Readable" : contrast.passesAALarge ? "Large text only" : "Hard to read"
                }
              ),
              /* @__PURE__ */ jsxs("div", { className: "pointer-events-none absolute bottom-3 left-3 rounded-md bg-black/45 px-2.5 py-1 text-white", children: [
                /* @__PURE__ */ jsx("div", { className: "text-sm font-medium leading-tight", children: displayName }),
                /* @__PURE__ */ jsx("div", { className: "text-xs leading-tight opacity-80", children: edited ? `edited \xB7 from seed ${spec.seed}` : `seed ${spec.seed}` })
              ] })
            ]
          }
        ) }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
          /* @__PURE__ */ jsxs("div", { className: `${clusterClass} shrink-0 gap-0.5 px-1`, children: [
            /* @__PURE__ */ jsx(
              StyleMenu,
              {
                spec,
                customHex: customColor,
                onChange: (styleName) => mutate(
                  null,
                  (draft) => ({
                    spec: generateMeshGradient({
                      seed: draft.spec.seed,
                      pointCount: draft.spec.points.length,
                      style: styleName
                    }),
                    edited: false
                  }),
                  null
                ),
                onCustomColor: (hex) => {
                  setCustomHex(hex);
                  mutate(
                    "custom-color",
                    (draft) => ({
                      spec: {
                        ...draft.spec,
                        style: "custom",
                        customColor: hex,
                        points: applyBaseColor(draft.spec.points, hex)
                      },
                      edited: draft.edited
                    }),
                    null
                  );
                },
                onCustomColorCommit: () => {
                  lastAction.current = null;
                }
              }
            ),
            /* @__PURE__ */ jsx("span", { "aria-hidden": true, className: "mx-0.5 h-4 w-px bg-border" }),
            /* @__PURE__ */ jsx(PresetMenu, { value: preset, onChange: setPreset }),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                "aria-label": "Shuffle",
                title: "Shuffle",
                className: segmentIconClass,
                onClick: () => mutate(
                  null,
                  (draft) => ({
                    spec: generateMeshGradient({
                      seed: randomSeed(),
                      pointCount: draft.spec.points.length,
                      style: draft.spec.style,
                      ...draft.spec.customColor === void 0 ? {} : { customColor: draft.spec.customColor }
                    }),
                    edited: false
                  }),
                  null
                ),
                children: /* @__PURE__ */ jsx(IconShuffle, {})
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                "aria-label": "Undo",
                title: "Undo (\u2318Z)",
                className: segmentIconClass,
                disabled: state.history.length === 0,
                onClick: undo,
                children: /* @__PURE__ */ jsx(IconUndo, {})
              }
            ),
            /* @__PURE__ */ jsx(
              MoreMenu,
              {
                items: [
                  {
                    label: "Add point",
                    onSelect: () => addPoint(20 + Math.random() * 60, 20 + Math.random() * 60)
                  },
                  {
                    label: "Copy CSS",
                    onSelect: () => void copyToClipboard("CSS", toCss(spec))
                  },
                  {
                    label: "Copy SVG",
                    onSelect: () => void copyToClipboard("SVG", toSvg(spec))
                  },
                  {
                    label: `Export PNG (${preset.width}\xD7${preset.height})`,
                    onSelect: () => void exportPng()
                  },
                  { label: "Save to library", onSelect: () => void save() },
                  { label: "Write token file", onSelect: () => void exportTokens() },
                  {
                    label: "Copy bb theme CSS",
                    onSelect: () => void copyToClipboard(
                      "Theme CSS",
                      toThemeCss(spec, { name: displayName })
                    )
                  },
                  ...edited ? [
                    {
                      label: "Reset to seed",
                      onSelect: () => mutate(
                        null,
                        (draft) => ({
                          spec: generateMeshGradient({
                            seed: draft.spec.seed,
                            pointCount: draft.spec.points.length,
                            style: draft.spec.style,
                            ...draft.spec.customColor === void 0 ? {} : { customColor: draft.spec.customColor }
                          }),
                          edited: false
                        }),
                        null
                      )
                    }
                  ] : []
                ]
              }
            )
          ] }),
          selectedPoint && state.selected !== null && /* @__PURE__ */ jsxs("div", { className: `${clusterClass} min-w-0 flex-1 gap-2 px-2.5`, children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "color",
                "aria-label": "Point color",
                title: "Point color",
                className: swatchClass,
                value: hslToHex(
                  selectedPoint.hue,
                  selectedPoint.saturation,
                  selectedPoint.lightness
                ),
                onChange: (event) => updatePoint(
                  `color-${state.selected}`,
                  state.selected,
                  hexToHsl(event.target.value)
                ),
                onBlur: () => {
                  lastAction.current = null;
                }
              }
            ),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "range",
                "aria-label": "Point falloff radius",
                title: "Falloff",
                className: sliderClass,
                min: MIN_RADIUS,
                max: MAX_RADIUS,
                value: selectedPoint.radius,
                onChange: (event) => updatePoint(`radius-${state.selected}`, state.selected, {
                  radius: Number(event.target.value)
                }),
                onBlur: () => {
                  lastAction.current = null;
                }
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                "aria-label": "Delete point",
                title: "Delete point",
                className: segmentIconClass,
                disabled: spec.points.length <= MIN_EDIT_POINTS,
                onClick: () => removePoint(state.selected),
                children: /* @__PURE__ */ jsx(IconTrash, {})
              }
            )
          ] }),
          /* @__PURE__ */ jsxs(
            "button",
            {
              type: "button",
              className: primaryButtonClass,
              disabled: busy,
              onClick: () => void sendToAgent(),
              children: [
                /* @__PURE__ */ jsx(IconSend, {}),
                "Send to agent"
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx("h2", { className: "text-sm font-medium text-foreground", children: "Library" }),
          !libraryLoaded ? /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 gap-2 sm:grid-cols-3", "aria-hidden": true, children: [0, 1, 2].map((slot) => /* @__PURE__ */ jsx(
            "div",
            {
              className: "h-[7.5rem] animate-pulse rounded-lg border border-border bg-muted/40"
            },
            slot
          )) }) : saved.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Nothing saved yet \u2014 sending to an agent saves automatically." }) : /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 gap-2 sm:grid-cols-3", children: saved.map((gradient) => /* @__PURE__ */ jsx(
            SavedTile,
            {
              gradient,
              onLoad: (loaded) => mutate(
                null,
                () => ({
                  spec: {
                    seed: loaded.seed,
                    style: loaded.style,
                    points: loaded.points,
                    ...loaded.customColor === void 0 ? {} : { customColor: loaded.customColor }
                  },
                  edited: loaded.edited
                }),
                null
              ),
              onDelete: (id) => {
                void (async () => {
                  try {
                    await rpc.call("deleteGradient", { id });
                    await refresh();
                  } catch (error) {
                    toast.error(`Delete failed: ${errorMessage(error)}`);
                  }
                })();
              },
              onSend: insertHandoff
            },
            gradient.id
          )) })
        ] })
      ] })
    }
  );
}
function GradientDirective({
  attributes
}) {
  const rpc = useRpc();
  const [resolved, setResolved] = useState(null);
  const [missing, setMissing] = useState(false);
  const id = attributes.id?.trim();
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    void (async () => {
      try {
        const { gradients } = await rpc.call("listSaved");
        if (cancelled) return;
        const match = gradients.find((gradient) => gradient.id === id) ?? null;
        setResolved(match);
        setMissing(match === null);
      } catch {
        if (!cancelled) setMissing(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, rpc]);
  const spec = useMemo(() => {
    if (resolved) {
      return {
        seed: resolved.seed,
        style: resolved.style,
        points: resolved.points
      };
    }
    if (id) return null;
    const seed = Number(attributes.seed);
    const style = MESH_STYLE_NAMES.find((name) => name === attributes.style);
    if (!Number.isFinite(seed)) return null;
    if (style === "custom") return null;
    return generateMeshGradient({ seed, style });
  }, [resolved, id, attributes.seed, attributes.style]);
  if (!spec) {
    return /* @__PURE__ */ jsx("span", { className: "text-sm text-muted-foreground", children: missing ? "This gradient is no longer in the library." : "Loading gradient\u2026" });
  }
  const layers = toCssLayers(spec);
  const label = resolved?.name ?? `seed ${spec.seed}`;
  return /* @__PURE__ */ jsxs("span", { className: "my-1 inline-flex items-center gap-2 rounded-lg border border-border bg-card p-1 pr-2.5 align-middle", children: [
    /* @__PURE__ */ jsx(
      "span",
      {
        "aria-hidden": true,
        className: "h-8 w-14 rounded",
        style: {
          backgroundColor: layers.backgroundColor,
          backgroundImage: layers.backgroundImage
        }
      }
    ),
    /* @__PURE__ */ jsx("span", { className: "text-sm text-foreground", children: label })
  ] });
}
var app_default = definePluginApp((app) => {
  app.slots.threadPanelAction({
    id: "studio",
    title: "Mesh Gradient",
    layout: "flush",
    component: Studio
  });
  app.slots.messageDirective({
    id: "mesh-gradient",
    component: GradientDirective
  });
});
export {
  app_default as default
};
