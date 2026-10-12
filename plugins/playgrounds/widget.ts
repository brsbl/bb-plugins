export const WIDGET_MESSAGE_SOURCE = "playground";
export const THEME_TOKENS = [
  "background",
  "foreground",
  "card",
  "card-foreground",
  "muted",
  "muted-foreground",
  "border",
  "input",
  "ring",
  "primary",
  "primary-foreground",
  "accent",
  "accent-foreground",
  "destructive",
] as const;

export type WidgetTheme = {
  scheme: "light" | "dark";
  font: string;
  tokens: Partial<Record<(typeof THEME_TOKENS)[number], string>>;
};
export const fallbackTheme: WidgetTheme = {
  scheme: "light",
  font: '"Inter Variable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
  tokens: {
    background: "#ffffff",
    foreground: "#111111",
    card: "#ffffff",
    muted: "#f4f4f2",
    "muted-foreground": "#6b6b6b",
    border: "#e6e6e3",
    ring: "#2f80ed",
    primary: "#111111",
    "primary-foreground": "#ffffff",
    accent: "#f4f4f2",
  },
};

const KIT = String.raw`
:root {
  color-scheme: light; --pg-ease: cubic-bezier(.2,.7,.2,1);
  --pg-ink: var(--foreground);
  --pg-body: color-mix(in srgb, var(--foreground) 76%, var(--card));
  --pg-meta: color-mix(in srgb, var(--foreground) 52%, var(--card));
  --pg-stage: color-mix(in srgb, var(--foreground) 4%, var(--card));
  --pg-hairline: color-mix(in srgb, var(--foreground) 9%, var(--card));
  --pg-radius: 16px; --pg-radius-stage: 12px; --pg-radius-photo: 12px;
  --pg-accent: var(--foreground);
  --pg-good: #1f8a4c; --pg-bad: #d23f3f; --pg-warn: #b26b00;
  --pg-good-soft: color-mix(in srgb, var(--pg-good) 12%, var(--card));
  --pg-bad-soft: color-mix(in srgb, var(--pg-bad) 12%, var(--card));
  --pg-warn-soft: color-mix(in srgb, var(--pg-warn) 14%, var(--card));
}
:root[data-scheme=dark] { color-scheme: dark; --pg-good: #4cc282; --pg-bad: #f06a6a; --pg-warn: #e0a040; }
*, *::before, *::after { box-sizing: border-box; }
html, body { margin: 0; background: transparent; }
body { padding: 20px 22px 22px; font: 13px/1.45 var(--font); color: var(--foreground); -webkit-font-smoothing: antialiased; overflow-wrap: anywhere; }
button, input, select, textarea { font: inherit; color: inherit; }
button { cursor: pointer; }
a { color: inherit; text-underline-offset: 2px; text-decoration-color: var(--pg-hairline); }
:focus-visible { outline: 2px solid var(--ring); outline-offset: 2px; }
img, svg { display: block; max-width: 100%; }
:where(body > * + *) { margin-top: 16px; }
.pg-title { margin: 0; font-size: 20px; line-height: 1.2; font-weight: 500; letter-spacing: -.02em; color: var(--pg-ink); }
.pg-subtitle { margin: 3px 0 0; font-size: 12px; line-height: 1.4; color: var(--pg-meta); }
.pg-eyebrow { font-size: 10.5px; letter-spacing: .04em; text-transform: uppercase; color: var(--pg-meta); font-weight: 500; }
.pg-h { margin: 0; font-size: 13px; line-height: 1.3; font-weight: 500; color: var(--pg-ink); }
.pg-item-title { margin: 0; font-size: 15px; line-height: 1.3; font-weight: 500; letter-spacing: -.01em; color: var(--pg-ink); }
.pg-body { margin: 0; font-size: 12px; line-height: 1.45; color: var(--pg-body); }
.pg-meta, .pg-muted { font-size: 11px; line-height: 1.4; color: var(--pg-meta); }
.pg-panel { padding: 14px 16px; border: 1px solid var(--pg-hairline); border-radius: var(--pg-radius); background: var(--card); }
.pg-stage { border-radius: var(--pg-radius-stage); background: var(--pg-stage); overflow: hidden; }
.pg-photos { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.pg-photos img { width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: var(--pg-radius-photo); }
.pg-seg { display: inline-flex; flex-shrink: 0; gap: 2px; padding: 3px; border-radius: 999px; border: 1px solid var(--pg-hairline); background: var(--card); }
.pg-seg button, .pg-chip { white-space: nowrap; border: 1px solid transparent; background: transparent; border-radius: 999px; padding: 5px 11px; font-size: 11.5px; line-height: 1.2; color: var(--muted-foreground); transition: background .2s, color .2s; }
.pg-chip { border-color: var(--pg-hairline); }
.pg-seg button[aria-pressed=true], .pg-chip[aria-pressed=true] { background: var(--foreground); color: var(--background); border-color: var(--foreground); font-weight: 500; }
.pg-btn, .pg-btn-primary { display: inline-flex; align-items: center; justify-content: center; gap: 5px; min-height: 32px; padding: 6px 14px; border-radius: 999px; border: 1px solid var(--pg-hairline); background: var(--card); font-size: 12px; font-weight: 500; color: var(--pg-ink); transition: opacity .2s, background .2s; }
.pg-btn:hover { background: var(--muted); }
.pg-btn-primary { background: var(--foreground); border-color: var(--foreground); color: var(--background); }
.pg-btn-primary:hover { background: var(--foreground); opacity: .88; }
.pg-btn:disabled, .pg-btn-primary:disabled { opacity: .45; cursor: default; }
.pg-link { border: 0; background: none; padding: 4px 0; font-size: 12px; color: var(--foreground); }
.pg-check { display: grid; grid-template-columns: 16px 1fr; gap: 2px 9px; align-items: start; font-size: 12px; cursor: pointer; }
.pg-check input { width: 14px; height: 14px; margin: 1px 0 0; accent-color: var(--foreground); }
.pg-check small { grid-column: 2; color: var(--muted-foreground); font-size: 11.5px; }
.pg-dots { display: flex; gap: 5px; }
.pg-dots i { width: 5px; height: 5px; border-radius: 50%; background: var(--border); transition: background .3s; }
.pg-dots i[aria-current=step] { background: var(--ring); }
.pg-fig { margin: 0; border-radius: var(--pg-radius-stage); background: var(--pg-stage); overflow: hidden; }
.pg-fig-head, .pg-fig-foot { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; padding: 10px 14px; font-size: 10.5px; line-height: 1.4; color: var(--pg-meta); }
.pg-fig-foot { padding-top: 6px; }
.pg-fig-foot output, .pg-fig-foot strong { color: var(--pg-ink); font-weight: 500; font-variant-numeric: tabular-nums; white-space: nowrap; }
.pg-fig-body { position: relative; padding: 0 14px; }
.pg-fig-body > svg, .pg-fig-body > canvas { display: block; width: 100%; height: auto; }
.pg-legend { display: flex; flex-wrap: wrap; gap: 4px 14px; margin: 8px 2px 0; font-size: 11px; line-height: 1.4; color: var(--pg-meta); }
.pg-field { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: baseline; gap: 6px 12px; margin: 0; font-size: 12px; font-weight: 500; color: var(--pg-ink); }
.pg-field > output { font-variant-numeric: tabular-nums; white-space: nowrap; }
.pg-field > input, .pg-field > select, .pg-field > .pg-input, .pg-field > small { grid-column: 1 / -1; }
.pg-field > small { font-size: 11px; font-weight: 400; color: var(--pg-meta); }
.pg-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; font-size: 12px; font-weight: 500; color: var(--pg-ink); }
.pg-fields { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 14px 20px; }
input[type=range] { -webkit-appearance: none; appearance: none; display: block; width: 100%; height: 20px; margin: 0; background: transparent; cursor: pointer; }
input[type=range]::-webkit-slider-runnable-track { height: 4px; border-radius: 2px; background: linear-gradient(var(--pg-accent), var(--pg-accent)) 0 / var(--pg-fill, 50%) 100% no-repeat, var(--pg-hairline); }
input[type=range]::-moz-range-track { height: 4px; border-radius: 2px; background: var(--pg-hairline); }
input[type=range]::-moz-range-progress { height: 4px; border-radius: 2px; background: var(--pg-accent); }
input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px; margin-top: -6px; border-radius: 50%; background: var(--card); border: 1px solid color-mix(in srgb, var(--foreground) 22%, var(--card)); box-shadow: 0 1px 2px color-mix(in srgb, var(--foreground) 18%, transparent); }
input[type=range]::-moz-range-thumb { width: 16px; height: 16px; border-radius: 50%; background: var(--card); border: 1px solid color-mix(in srgb, var(--foreground) 22%, var(--card)); }
input[type=range]:focus-visible { outline: none; }
input[type=range]:focus-visible::-webkit-slider-thumb { outline: 2px solid var(--ring); outline-offset: 2px; }
.pg-input { display: flex; align-items: center; gap: 6px; min-height: 32px; padding: 0 10px; border: 1px solid var(--pg-hairline); border-radius: 8px; background: var(--card); font-weight: 400; }
.pg-input:focus-within { outline: 2px solid var(--ring); outline-offset: 1px; }
.pg-input input { flex: 1; min-width: 0; border: 0; padding: 6px 0; background: none; outline: none; font-variant-numeric: tabular-nums; }
.pg-input span { flex-shrink: 0; white-space: nowrap; font-size: 11px; color: var(--pg-meta); }
.pg-readouts { display: grid; grid-template-columns: repeat(auto-fit, minmax(96px, 1fr)); gap: 12px; margin: 0; }
.pg-readouts dt { font-size: 11px; line-height: 1.4; color: var(--pg-meta); }
.pg-readouts dd { margin: 2px 0 0; font-size: 20px; line-height: 1.2; font-weight: 500; letter-spacing: -.01em; color: var(--pg-ink); font-variant-numeric: tabular-nums; }
.pg-readouts dd small { display: block; margin-top: 2px; font-size: 11px; font-weight: 400; letter-spacing: 0; color: var(--pg-meta); }
.pg-agent { display: grid; grid-template-columns: 20px minmax(0, 1fr); gap: 2px 10px; align-items: start; padding: 11px 14px; border-radius: var(--pg-radius-stage); border: 1px solid var(--pg-hairline); background: var(--card); }
.pg-agent::before { content: ""; grid-row: 1 / 3; width: 20px; height: 20px; border-radius: 50%; background: radial-gradient(circle at 50% 50%, var(--card) 0 3px, transparent 3.5px), var(--pg-ink); }
.pg-agent-who { font-size: 11px; line-height: 18px; font-weight: 500; color: var(--pg-ink); }
.pg-agent-who small { margin-left: 6px; font-weight: 400; color: var(--pg-meta); }
.pg-agent-text { margin: 0; font-size: 12px; line-height: 1.45; color: var(--pg-body); }
.pg-agent[data-state=thinking] .pg-agent-text::after { content: " · · ·"; animation: pg-pulse 1.2s ease-in-out infinite; }
@keyframes pg-pulse { 50% { opacity: .3; } }
.pg-badge { display: inline-flex; align-items: center; gap: 4px; padding: 1px 7px; border-radius: 999px; border: 1px solid var(--pg-hairline); font-size: 10.5px; line-height: 1.4; font-weight: 500; white-space: nowrap; color: var(--pg-ink); background: var(--card); }
.pg-badge[data-tone] { border-color: transparent; padding-left: 6px; }
.pg-badge::before { font-size: 10px; }
.pg-badge[data-tone=good] { color: var(--pg-good); background: var(--pg-good-soft); }
.pg-badge[data-tone=good]::before { content: "✓"; }
.pg-badge[data-tone=bad] { color: var(--pg-bad); background: var(--pg-bad-soft); }
.pg-badge[data-tone=bad]::before { content: "✕"; }
.pg-badge[data-tone=warn] { color: var(--pg-warn); background: var(--pg-warn-soft); }
.pg-badge[data-tone=warn]::before { content: "!"; font-weight: 700; }
.pg-transport { display: flex; align-items: center; gap: 8px; }
.pg-transport input[type=range] { flex: 1; min-width: 0; }
.pg-icon-btn { display: inline-grid; place-items: center; width: 32px; height: 32px; padding: 0; border-radius: 50%; border: 1px solid var(--pg-hairline); background: var(--card); color: var(--pg-ink); }
.pg-icon-btn:hover { background: var(--muted); }
.pg-icon-btn[data-primary] { background: var(--pg-ink); border-color: var(--pg-ink); color: var(--card); }
.pg-icon-btn svg { width: 14px; height: 14px; fill: currentColor; }
.pg-transport output { min-width: 4.5em; text-align: right; font-size: 11px; color: var(--pg-meta); }
.pg-window { overflow: hidden; border-radius: 10px; border: 1px solid var(--pg-hairline); background: var(--card); box-shadow: 0 1px 2px color-mix(in srgb, var(--foreground) 6%, transparent), 0 8px 24px -12px color-mix(in srgb, var(--foreground) 18%, transparent); }
.pg-window-bar { display: flex; align-items: center; gap: 8px; height: 30px; padding: 0 12px; border-bottom: 1px solid var(--pg-hairline); font-size: 11px; color: var(--pg-meta); }
.pg-window-bar strong { font-weight: 500; color: var(--pg-ink); }
.pg-window-body { padding: 14px; }
.pg-table { width: 100%; border-collapse: collapse; font-size: 12px; font-variant-numeric: tabular-nums; }
.pg-table th { padding: 0 8px 6px; text-align: left; font-size: 11px; font-weight: 400; color: var(--pg-meta); }
.pg-table td { padding: 7px 8px; border-top: 1px solid var(--pg-hairline); color: var(--pg-ink); }
.pg-table th:first-child, .pg-table td:first-child { padding-left: 0; }
.pg-table [data-num] { text-align: right; }
.pg-table tr[aria-current] td { background: var(--pg-stage); }
.pg-log { display: grid; gap: 2px; margin: 0; padding: 0; list-style: none; font-size: 11px; line-height: 1.5; color: var(--pg-body); font-variant-numeric: tabular-nums; }
.pg-log li { display: grid; grid-template-columns: 3.5em minmax(0, 1fr); gap: 8px; }
.pg-log time { color: var(--pg-meta); }
.pg-chart { display: block; width: 100%; height: auto; overflow: visible; font-size: 10.5px; }
.pg-chart text { fill: var(--pg-meta); font-variant-numeric: tabular-nums; }
.pg-chart .grid { stroke: var(--pg-hairline); stroke-width: 1; vector-effect: non-scaling-stroke; }
.pg-chart .axis { stroke: color-mix(in srgb, var(--foreground) 22%, var(--card)); stroke-width: 1; vector-effect: non-scaling-stroke; }
.pg-chart .series { fill: none; stroke: var(--pg-ink); stroke-width: 1.6; stroke-linejoin: round; stroke-linecap: round; vector-effect: non-scaling-stroke; }
.pg-chart .area { stroke: none; fill: color-mix(in srgb, var(--pg-ink) 8%, transparent); }
.pg-chart .bar { fill: var(--pg-ink); }
.pg-chart [data-tone=meta] { stroke: var(--pg-meta); fill: var(--pg-meta); }
.pg-chart .series[data-tone=meta] { fill: none; }
.pg-chart [data-tone=accent] { stroke: var(--pg-accent); }
.pg-chart [data-tone=bad] { stroke: var(--pg-bad); }
.pg-chart [data-tone=good] { stroke: var(--pg-good); }
.pg-chart .bar[data-tone=bad] { fill: var(--pg-bad); }
.pg-chart .bar[data-tone=meta] { fill: color-mix(in srgb, var(--foreground) 22%, var(--card)); }
.pg-chart [data-dashed] { stroke-dasharray: 4 3; }
.pg-chart .mark { stroke: var(--pg-meta); stroke-width: 1; stroke-dasharray: 3 3; vector-effect: non-scaling-stroke; }
.pg-chart .mark-label { fill: var(--pg-meta); font-weight: 500; }
.pg-chart .mark[data-tone=bad] { stroke: var(--pg-bad); }
.pg-chart .mark-label[data-tone=bad] { fill: var(--pg-bad); }
.pg-chart .now { stroke: var(--pg-ink); stroke-width: 1; vector-effect: non-scaling-stroke; }
.pg-chart .now-dot { fill: var(--pg-ink); stroke: var(--card); stroke-width: 2; }
.pg-chart .event { stroke: var(--pg-meta); stroke-width: 1; stroke-dasharray: 2 3; vector-effect: non-scaling-stroke; }
.pg-chart .event[data-tone=bad] { stroke: var(--pg-bad); }
.pg-chart .event-label { font-weight: 500; fill: var(--pg-ink); }
.pg-chart .event-label[data-tone=bad] { fill: var(--pg-bad); }
.pg-chart .band { fill: color-mix(in srgb, var(--pg-bad) 7%, transparent); }
output { font-variant-numeric: tabular-nums; }
.pg-reveal { animation: pg-reveal .38s var(--pg-ease) both; animation-delay: calc(var(--i, 0) * 45ms); }
@keyframes pg-reveal { from { opacity: 0; transform: translateY(6px); } }
@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: 1ms !important; animation-delay: 0ms !important; transition-duration: 1ms !important; } }
`;

// Playgrounds began as Interactive Answers, whose cards used --ia-* tokens and
// .ia-* classes. Cards saved then still name them, so they get the same kit under
// those names.
const LEGACY_KIT = KIT.replaceAll("pg-", "ia-");
const usesLegacyKit = (html: string) => /(?:--|\.|class=["'][^"']*\b)ia-/.test(html);

function bridge(id: string, state: unknown, theme: WidgetTheme) {
  return String.raw`(() => {
  const SOURCE = ${JSON.stringify(WIDGET_MESSAGE_SOURCE)}, ID = ${JSON.stringify(id)};
  const post = (type, data) => parent.postMessage({ source: SOURCE, id: ID, type, ...data }, "*");
  const listeners = new Set(), stateListeners = new Set();
  const notify = (set, value) => { for (const callback of set) try { callback(value); } catch (error) { console.error(error); } };
  const plain = (value) => JSON.parse(JSON.stringify(value ?? null));
  const apply = (theme) => {
    const root = document.documentElement;
    root.dataset.scheme = theme.scheme;
    root.style.setProperty("--font", theme.font);
    for (const [name, value] of Object.entries(theme.tokens)) root.style.setProperty("--" + name, value);
  };
  let init = {};
  try { if (location.hash.length > 1) init = JSON.parse(decodeURIComponent(location.hash.slice(1))); } catch {}
  let theme = init.theme || ${JSON.stringify(theme)};
  apply(theme);
  let state = "state" in init ? init.state : ${JSON.stringify(state ?? null)};
  let version = typeof init.version === "number" ? init.version : 0;
  const actions = new Map();
  window.playground = Object.freeze({
    id: ID,
    get state() { return state; },
    save(value) { try { state = plain(value); post("state", { state, base: version }); } catch {} },
    onState(callback) { stateListeners.add(callback); return () => stateListeners.delete(callback); },
    get theme() { return theme; },
    onTheme(callback) { listeners.add(callback); return () => listeners.delete(callback); },
    expose(map) {
      for (const [name, run] of Object.entries(map || {})) if (typeof run === "function" && /^[A-Za-z][\w.-]*$/.test(name)) actions.set(name, run);
      post("actions", { actions: [...actions.keys()] });
    },
    emit(name, data) { try { post("event", { name: String(name), data: plain(data) }); } catch {} },
    send(label, data) { try { post("send", { label: String(label).slice(0, 80), data: plain(data) }); } catch {} },
  });
  window.answer = window.playground;
  addEventListener("message", async (event) => {
    const message = event.data;
    if (event.source !== parent || !message || message.source !== SOURCE) return;
    if (message.type === "theme") { theme = message.theme; apply(theme); notify(listeners, theme); }
    if (message.type === "state") { state = message.state; if (typeof message.version === "number") version = message.version; notify(stateListeners, state); }
    if (message.type === "font" && typeof message.family === "string" && message.data instanceof ArrayBuffer) {
      try { const face = new FontFace(message.family, message.data, { weight: "100 900" }); document.fonts.add(face); face.load().catch(() => {}); } catch {}
    }
    if (message.type === "command") {
      const run = actions.get(message.action);
      try {
        if (!run) throw new Error("Unknown action " + message.action);
        const value = await run(...(Array.isArray(message.args) ? message.args : []));
        post("result", { cmdId: message.cmdId, ok: true, value: value === undefined ? null : plain(value) });
      } catch (error) { post("result", { cmdId: message.cmdId, ok: false, error: String(error && error.message || error).slice(0, 2000) }); }
    }
  });
  let lastActive = 0;
  const active = () => { const now = Date.now(); if (now - lastActive > 4000) { lastActive = now; post("active", {}); } };
  addEventListener("pointerdown", active, true); addEventListener("keydown", active, true);
  const BaseAudio = window.AudioContext || window.webkitAudioContext;
  if (BaseAudio) {
    let silent = null;
    const unlock = () => {
      try { if (navigator.audioSession) navigator.audioSession.type = "playback"; } catch {}
      if (silent || !/iP(hone|ad|od)|Macintosh.*Mobile/.test(navigator.userAgent) && !(navigator.maxTouchPoints > 1 && /Mac/.test(navigator.platform))) return;
      const n = 4000, bytes = new Uint8Array(44 + n), view = new DataView(bytes.buffer), text = (o, str) => [...str].forEach((ch, i) => bytes[o + i] = ch.charCodeAt(0));
      text(0, "RIFF"); view.setUint32(4, 36 + n, true); text(8, "WAVEfmt "); view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
      view.setUint32(24, 8000, true); view.setUint32(28, 8000, true); view.setUint16(32, 1, true); view.setUint16(34, 8, true); text(36, "data"); view.setUint32(40, n, true); bytes.fill(128, 44);
      silent = new Audio(URL.createObjectURL(new Blob([bytes], { type: "audio/wav" }))); silent.loop = true; silent.setAttribute("playsinline", ""); silent.play().catch(() => { silent = null; });
    };
    class PlaybackAudioContext extends BaseAudio {
      constructor(...args) { super(...args); unlock(); }
      resume() { unlock(); return super.resume(); }
    }
    window.AudioContext = PlaybackAudioContext;
    if (window.webkitAudioContext) window.webkitAudioContext = PlaybackAudioContext;
  }
  const fillRange = (input) => {
    const min = Number(input.min || 0), max = Number(input.max || 100), value = Number(input.value);
    input.style.setProperty("--pg-fill", (max > min ? Math.min(100, Math.max(0, (value - min) / (max - min) * 100)) : 0) + "%");
  };
  const valueProperty = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value");
  if (valueProperty && valueProperty.set) Object.defineProperty(HTMLInputElement.prototype, "value", { ...valueProperty, set(next) { valueProperty.set.call(this, next); if (this.type === "range") fillRange(this); } });
  const fillAll = (root) => { if (root.querySelectorAll) root.querySelectorAll("input[type=range]").forEach(fillRange); };
  addEventListener("input", (event) => { if (event.target instanceof HTMLInputElement && event.target.type === "range") fillRange(event.target); }, true);
  addEventListener("DOMContentLoaded", () => {
    fillAll(document);
    new MutationObserver((records) => { for (const record of records) for (const node of record.addedNodes) if (node.nodeType === 1) { if (node.matches("input[type=range]")) fillRange(node); fillAll(node); } }).observe(document.body, { childList: true, subtree: true });
  });
  let last = 0;
  const report = () => { const height = Math.ceil(document.documentElement.getBoundingClientRect().height); if (height !== last) { last = height; post("height", { height }); } };
  addEventListener("DOMContentLoaded", () => { new ResizeObserver(report).observe(document.documentElement); report(); });
  addEventListener("load", report);
  addEventListener("click", (event) => {
    const link = event.target instanceof Element && event.target.closest("a[href]");
    if (!link || event.defaultPrevented) return;
    const url = new URL(link.getAttribute("href"), "https://invalid.invalid/");
    if (url.protocol !== "https:" && url.protocol !== "http:") return;
    event.preventDefault(); post("open", { url: url.href });
  });
})();`;
}

export const FRAME_PATH = "/frame";
const IMAGE_HOSTS = ["https://upload.wikimedia.org"] as const;
const FRAME_CSP = [
  "sandbox allow-scripts",
  "default-src 'none'",
  "script-src 'unsafe-inline'",
  "style-src 'unsafe-inline'",
  `img-src data: blob: ${IMAGE_HOSTS.join(" ")}`,
  "media-src data: blob:",
  "font-src data: blob:",
  "connect-src 'none'",
  "form-action 'none'",
  "base-uri 'none'",
].join("; ");
export const FRAME_HEADERS = {
  "content-type": "text/html; charset=utf-8",
  "content-security-policy": FRAME_CSP,
  "x-content-type-options": "nosniff",
  "referrer-policy": "no-referrer",
  "cache-control": "private, max-age=3600",
};

export function buildWidgetDocument({
  id,
  html,
  state,
  theme,
}: {
  id: string;
  html: string;
  state: unknown;
  theme: WidgetTheme;
}): string {
  const script = bridge(id, state, theme).replaceAll("</", "<\\/");
  return `<!doctype html><html data-scheme="${theme.scheme}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>${KIT}${usesLegacyKit(html) ? LEGACY_KIT : ""}</style><script>${script}</script></head><body>${html}</body></html>`;
}
