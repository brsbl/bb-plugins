import { CONTROLS_CSS, CONTROLS_RUNTIME } from "./controls.js";
import { CHART_CSS, CHART_RUNTIME } from "./charts.js";
import { SETS_CSS, SETS_RUNTIME } from "./sets.js";

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
  color-scheme: light;
  --pg-ink: var(--foreground);
  --pg-body: color-mix(in oklch, var(--foreground) 84%, var(--card));
  --pg-meta: color-mix(in oklch, var(--foreground) 70%, var(--card));
  --pg-stage: color-mix(in oklch, var(--foreground) 4%, var(--card));
  --pg-hairline: color-mix(in oklch, var(--foreground) 10%, var(--card));
  --pg-rule: color-mix(in oklch, var(--foreground) 24%, var(--card));
  --pg-mark-muted: color-mix(in oklch, var(--foreground) 50%, var(--card));
  --pg-hover: color-mix(in oklab, var(--foreground) 6%, transparent);
  --pg-series-1: #2a78d6; --pg-series-2: #eb6834; --pg-series-3: #1baf7a; --pg-series-4: #eda100;
  --pg-series-5: #e87ba4; --pg-series-6: #008300; --pg-series-7: #6250d6;
  --pg-accent: var(--pg-series-1);
  --pg-good: oklch(0.54 0.13 150); --pg-warn: oklch(0.54 0.13 60); --pg-bad: oklch(0.55 0.19 27);
  --pg-text-hero: 28px; --pg-text-title: 18px; --pg-text-sentence: 15px; --pg-text-body: 13px; --pg-text-label: 12px; --pg-text-meta: 12px; --pg-text-axis: 11px;
  --pg-space-1: 4px; --pg-space-2: 8px; --pg-space-3: 12px; --pg-space-4: 16px; --pg-space-5: 24px;
  --pg-radius: 14px; --pg-radius-stage: 14px; --pg-radius-photo: 10px;
  --pg-ease: cubic-bezier(.2,.7,.2,1); --pg-fast: .12s; --pg-base: .2s;
}
:root[data-scheme=dark] {
  color-scheme: dark;
  --pg-series-1: #3987e5; --pg-series-2: #d95926; --pg-series-3: #199e70; --pg-series-4: #c98500;
  --pg-series-5: #d55181; --pg-series-6: #008300; --pg-series-7: #9085e9;
  --pg-good: oklch(0.72 0.14 155); --pg-warn: oklch(0.76 0.14 70); --pg-bad: oklch(0.68 0.17 25);
}
*, *::before, *::after { box-sizing: border-box; }
html, body { margin: 0; background: transparent; }
body { padding: 20px 24px 22px; font: var(--pg-text-body)/1.5 var(--font); color: var(--pg-ink); -webkit-font-smoothing: antialiased; overflow-wrap: anywhere; }
button, input, select, textarea { font: inherit; color: inherit; }
button { cursor: pointer; }
:focus-visible { outline: 2px solid var(--ring); outline-offset: 2px; }
img, svg { display: block; max-width: 100%; }
.pg-title { margin: 0; font-size: var(--pg-text-title); line-height: 1.3; font-weight: 600; letter-spacing: -.012em; color: var(--pg-ink); text-wrap: balance; }
.pg-subtitle { margin: 4px 0 0; font-size: var(--pg-text-body); line-height: 1.45; color: var(--pg-body); text-wrap: pretty; }
.pg-eyebrow { font-size: var(--pg-text-label); line-height: 1.3; font-weight: 500; color: var(--pg-meta); }
.pg-h { margin: 0; font-size: var(--pg-text-body); line-height: 1.35; font-weight: 600; color: var(--pg-ink); }
.pg-item-title { margin: 0; font-size: 15px; line-height: 1.3; font-weight: 600; letter-spacing: -.008em; color: var(--pg-ink); }
.pg-body { margin: 0; font-size: var(--pg-text-body); line-height: 1.5; color: var(--pg-body); }
.pg-meta, .pg-muted { font-size: var(--pg-text-meta); line-height: 1.4; color: var(--pg-meta); }
.pg-panel { padding: 14px 16px; border: 1px solid var(--pg-hairline); border-radius: var(--pg-radius); background: var(--card); }
.pg-stage { border-radius: var(--pg-radius-stage); background: var(--pg-stage); overflow: hidden; }
.pg-photos { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.pg-photos img { width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: var(--pg-radius-photo); }
.pg-seg { display: inline-flex; flex-wrap: wrap; max-width: 100%; flex-shrink: 0; gap: 2px; padding: 2px; border-radius: 999px; background: var(--pg-stage); box-shadow: inset 0 0 0 1px var(--pg-hairline); }
.pg-form > .pg-seg { grid-column: 1 / -1; justify-self: start; }
.pg-form > .pg-field:has(> .pg-seg) { grid-column: 1 / -1; }
.pg-seg button, .pg-chip { min-height: 28px; white-space: nowrap; border: 1px solid transparent; background: transparent; border-radius: 999px; padding: 4px 12px; font-size: var(--pg-text-label); line-height: 1.2; font-weight: 500; color: var(--pg-body); transition: background var(--pg-base), color var(--pg-base); }
.pg-seg button { max-width: 100%; overflow: hidden; text-overflow: ellipsis; }
.pg-seg button:hover:not([aria-pressed=true]), .pg-chip:hover:not([aria-pressed=true]) { background: var(--pg-hover); color: var(--pg-ink); }
.pg-chip { border-color: var(--pg-rule); }
.pg-seg button[aria-pressed=true], .pg-chip[aria-pressed=true] { background: var(--pg-ink); color: var(--card); border-color: var(--pg-ink); }
.pg-btn, .pg-btn-primary { display: inline-flex; align-items: center; justify-content: center; gap: 6px; min-height: 32px; padding: 6px 14px; border-radius: 999px; border: 1px solid var(--pg-rule); background: var(--card); font-size: var(--pg-text-label); font-weight: 500; color: var(--pg-ink); transition: opacity var(--pg-base), background var(--pg-base); white-space: nowrap; }
.pg-btn:hover { background: var(--pg-hover); }
.pg-btn-primary { background: var(--pg-ink); border-color: var(--pg-ink); color: var(--card); }
.pg-btn-primary:hover { background: var(--pg-ink); opacity: .88; }
.pg-btn:disabled, .pg-btn-primary:disabled { opacity: .45; cursor: default; }
.pg-link { border: 0; background: none; padding: 4px 0; font-size: var(--pg-text-label); font-weight: 500; color: var(--pg-ink); text-decoration: underline; text-decoration-color: var(--pg-rule); text-underline-offset: 3px; }
.pg-check { display: grid; grid-template-columns: 16px 1fr; gap: 2px 9px; align-items: start; font-size: var(--pg-text-body); cursor: pointer; }
.pg-check input { width: 16px; height: 16px; margin: 1px 0 0; accent-color: var(--pg-ink); }
.pg-check small { grid-column: 2; color: var(--pg-meta); font-size: var(--pg-text-meta); }
.pg-dots { display: flex; gap: 6px; }
.pg-dots i { width: 6px; height: 6px; border-radius: 50%; background: var(--pg-rule); transition: background .3s; }
.pg-dots i[aria-current=step] { background: var(--pg-ink); }
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
  const api = {
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
  };
${CONTROLS_RUNTIME.replace("/*SETS*/", CHART_RUNTIME + SETS_RUNTIME)}
  window.playground = Object.freeze(api);
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

// A whole page (an Anatomy figure, say) keeps its head styles and scripts and its
// body's class and data-* attributes, so it renders in the card as it does alone.
// A page without a complete body is passed through as before. Offsets are found
// with linear scans so a crafted page can't make the frame route backtrack.
export function pageParts(html: string): { markup: string; bodyAttributes: string } {
  const whole = { markup: html, bodyAttributes: "" };
  if (!/^\s*(<!doctype|<html[\s>])/i.test(html)) return whole;
  const lower = html.replace(/[A-Z]/g, (letter) => letter.toLowerCase());
  const bodyOpen = /<body[\s>]/.exec(lower)?.index ?? -1;
  const bodyStart = bodyOpen < 0 ? -1 : lower.indexOf(">", bodyOpen) + 1;
  const bodyEnd = lower.lastIndexOf("</body>");
  if (bodyStart <= 0 || bodyEnd < bodyStart) return whole;
  const headOpen = /<head[\s>]/.exec(lower.slice(0, bodyOpen))?.index ?? -1;
  const headStart = headOpen < 0 ? -1 : lower.indexOf(">", headOpen) + 1;
  const headEnd = headStart <= 0 ? -1 : lower.indexOf("</head>", headStart);
  const head = headEnd >= 0 && headEnd <= bodyOpen ? html.slice(headStart, headEnd) : "";
  const bodyAttributes = [...html.slice(bodyOpen + 5, bodyStart - 1).matchAll(/\s(class|data-[\w-]+)="([^"<>]*)"/g)]
    .map(([, name, value]) => ` ${name}="${value}"`)
    .join("");
  return { markup: head.replace(/<title[\s\S]*?<\/title>|<meta[^>]*>/gi, "") + html.slice(bodyStart, bodyEnd), bodyAttributes };
}

// An Anatomy page's own scripts read its theme once as they load, before the kit
// starts, so the body takes bb's scheme before any of them run.
const FIGURE_THEME = '<script>if (document.body.matches(".iso[data-theme]")) document.body.dataset.theme = document.documentElement.dataset.scheme;</script>';

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
  const { markup, bodyAttributes } = pageParts(html);
  return `<!doctype html><html data-scheme="${theme.scheme}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>${KIT}${CONTROLS_CSS}${CHART_CSS}${SETS_CSS}${usesLegacyKit(html) ? LEGACY_KIT : ""}</style><script>${script}</script></head><body${bodyAttributes}>${bodyAttributes ? FIGURE_THEME : ""}${markup}</body></html>`;
}
