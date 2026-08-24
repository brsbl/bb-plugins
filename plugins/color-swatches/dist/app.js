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

// colors.ts
var HEX_LENGTHS = /* @__PURE__ */ new Set([3, 4, 6, 8]);
var FUNCTION_NAMES = [
  "rgb",
  "rgba",
  "hsl",
  "hsla",
  "hwb",
  "lab",
  "lch",
  "oklab",
  "oklch",
  "color",
  "color-mix"
];
var PATTERN = new RegExp(
  [
    "#[0-9a-fA-F]+",
    `(?:${FUNCTION_NAMES.join("|")})\\([^()]*(?:\\([^()]*\\)[^()]*)*\\)`
  ].join("|"),
  "gi"
);
var isWordish = (char) => char !== void 0 && /[\w#$@-]/.test(char);
function findColorMatches(text) {
  const out = [];
  PATTERN.lastIndex = 0;
  for (let m = PATTERN.exec(text); m !== null; m = PATTERN.exec(text)) {
    const value = m[0];
    const start = m.index;
    if (isWordish(text[start - 1])) continue;
    if (value.startsWith("#")) {
      const digits = value.length - 1;
      if (!HEX_LENGTHS.has(digits)) continue;
      if (/[\w-]/.test(text[start + value.length] ?? "")) continue;
    }
    out.push({ start, end: start + value.length, value });
  }
  return out;
}

// app.tsx
var ATTR = "data-bb-color-swatch";
var PROP = "--bb-color-swatch";
var USER_PROSE_SELECTOR = "[data-message-column] > .ml-auto [data-markdown-preview]";
var PROSE_HIGHLIGHT_PREFIX = "bb-color-swatches-prose-";
var STYLESHEET = `
[${ATTR}] {
  /* The chip inherits the line's font size, so it tracks code and prose. */
  --bb-color-swatch-size: 0.78em;
}
[${ATTR}]::before {
  content: "";
  display: inline-block;
  width: var(--bb-color-swatch-size);
  height: var(--bb-color-swatch-size);
  margin-inline-end: 0.34em;
  vertical-align: -0.085em;
  border-radius: 3px;
  /* The color rides on top of a checkerboard so alpha reads as alpha, and an
   * inset ring keeps white-on-white and black-on-black visible. */
  background-image:
    linear-gradient(var(${PROP}), var(${PROP})),
    linear-gradient(45deg, rgba(128, 128, 128, 0.34) 25%, transparent 25%, transparent 75%, rgba(128, 128, 128, 0.34) 75%),
    linear-gradient(45deg, rgba(128, 128, 128, 0.34) 25%, transparent 25%, transparent 75%, rgba(128, 128, 128, 0.34) 75%);
  background-size: 100% 100%, 6px 6px, 6px 6px;
  background-position: 0 0, 0 0, 3px 3px;
  background-color: #fff;
  box-shadow: inset 0 0 0 1px rgba(128, 128, 128, 0.45);
}
`;
var EXCLUDED = "[contenteditable], input, textarea";
var isColor = (value) => typeof CSS !== "undefined" && typeof CSS.supports === "function" ? CSS.supports("color", value) : true;
function decorate(el, value) {
  el.setAttribute(ATTR, "");
  el.style.setProperty(PROP, value);
}
function undecorate(el) {
  el.removeAttribute(ATTR);
  el.style?.removeProperty(PROP);
}
function highlightApi() {
  if (typeof CSS === "undefined") return null;
  const registry = CSS.highlights;
  const HighlightConstructor = globalThis.Highlight;
  return registry && HighlightConstructor ? { registry, HighlightConstructor } : null;
}
function decorateTokenizedLine(line) {
  const starts = /* @__PURE__ */ new Map();
  let text = "";
  for (const node of Array.from(line.childNodes)) {
    if (node.nodeType === Node.ELEMENT_NODE)
      starts.set(text.length, node);
    text += node.textContent ?? "";
  }
  if (!text.includes("#") && !/[a-z]\(/i.test(text)) return;
  for (const match of findColorMatches(text)) {
    const target = starts.get(match.start);
    if (target && isColor(match.value)) decorate(target, match.value);
  }
}
function decorateWholeElement(el) {
  const text = (el.textContent ?? "").trim();
  if (!text || text.length > 64) return;
  const matches = findColorMatches(text);
  if (matches.length !== 1) return;
  const [only] = matches;
  if (only.start !== 0 || only.end !== text.length) return;
  if (isColor(only.value)) decorate(el, only.value);
}
function contrastForeground(value) {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return null;
  context.fillStyle = "rgb(1, 2, 3)";
  const sentinel = context.fillStyle;
  context.fillStyle = value;
  if (context.fillStyle === sentinel) return null;
  context.fillRect(0, 0, 1, 1);
  const [red, green, blue, alpha] = context.getImageData(0, 0, 1, 1).data;
  const opacity = alpha / 255;
  const composite = (channel) => channel * opacity + 128 * (1 - opacity);
  const linear = (channel) => {
    const normalized = composite(channel) / 255;
    return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  };
  const luminance = 0.2126 * linear(red) + 0.7152 * linear(green) + 0.0722 * linear(blue);
  return luminance > 0.42 ? "#111" : "#fff";
}
var ProseHighlighter = class {
  constructor(style) {
    this.style = style;
  }
  style;
  api = highlightApi();
  entriesByRoot = /* @__PURE__ */ new Map();
  dirty = false;
  nextId = 1;
  prune() {
    for (const root of this.entriesByRoot.keys()) {
      if (!root.isConnected) this.clearRoot(root);
    }
  }
  replace(root) {
    this.clearRoot(root);
    if (!this.api) return;
    const entries = [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const textNode = node;
      const parent = textNode.parentElement;
      if (!parent || parent.closest(`${EXCLUDED}, code, pre`) || !textNode.data.includes("#") && !/[a-z]\(/i.test(textNode.data)) {
        continue;
      }
      for (const match of findColorMatches(textNode.data)) {
        if (!isColor(match.value)) continue;
        const range = document.createRange();
        range.setStart(textNode, match.start);
        range.setEnd(textNode, match.end);
        const name = `${PROSE_HIGHLIGHT_PREFIX}${this.nextId++}`;
        this.api.registry.set(name, new this.api.HighlightConstructor(range));
        entries.push({
          name,
          value: match.value,
          foreground: contrastForeground(match.value)
        });
      }
    }
    if (entries.length > 0) {
      this.entriesByRoot.set(root, entries);
      this.dirty = true;
    }
  }
  commit() {
    if (!this.dirty) return;
    this.syncStyles();
    this.dirty = false;
  }
  dispose() {
    for (const root of [...this.entriesByRoot.keys()]) this.clearRoot(root);
    this.commit();
  }
  clearRoot(root) {
    const entries = this.entriesByRoot.get(root);
    if (!entries) return;
    for (const entry of entries) this.api?.registry.delete(entry.name);
    this.entriesByRoot.delete(root);
    this.dirty = true;
  }
  syncStyles() {
    const proseRules = [...this.entriesByRoot.values()].flat().map(
      ({ name, value, foreground }) => `
::highlight(${name}) {
  background-color: ${value};
  ${foreground ? `color: ${foreground};` : ""}
  text-decoration-line: underline;
  text-decoration-color: rgba(128, 128, 128, 0.65);
  text-decoration-thickness: 1px;
  text-underline-offset: 2px;
}`
    ).join("\n");
    this.style.textContent = `${STYLESHEET}${proseRules}`;
  }
};
function matchesWithin(root, selector) {
  const matches = Array.from(root.querySelectorAll?.(selector) ?? []);
  return root instanceof Element && root.matches(selector) ? [root, ...matches] : matches;
}
function scan(root, proseHighlighter) {
  proseHighlighter.prune();
  for (const stale of Array.from(root.querySelectorAll?.(`[${ATTR}]`) ?? [])) {
    undecorate(stale);
  }
  for (const line of matchesWithin(root, ".sh__line")) {
    if (line.closest(EXCLUDED)) continue;
    decorateTokenizedLine(line);
  }
  for (const code of matchesWithin(root, "code")) {
    if (code.closest(EXCLUDED) || code.closest("pre")) continue;
    decorateWholeElement(code);
  }
  for (const prose of matchesWithin(root, USER_PROSE_SELECTOR)) {
    if (!prose.closest(EXCLUDED)) proseHighlighter.replace(prose);
  }
  proseHighlighter.commit();
}
var app_default = definePluginApp((app) => {
  app.contentScripts.register({
    id: "swatches",
    mount({ signal }) {
      const style = document.createElement("style");
      style.dataset.bbColorSwatches = "";
      style.textContent = STYLESHEET;
      document.head.append(style);
      const proseHighlighter = new ProseHighlighter(style);
      let pending = null;
      const flush = () => {
        const roots = pending ?? /* @__PURE__ */ new Set();
        pending = null;
        for (const root of roots) {
          if (root.isConnected !== false) scan(root, proseHighlighter);
        }
      };
      const queue = (node) => {
        if (!pending) {
          pending = /* @__PURE__ */ new Set();
          requestAnimationFrame(flush);
        }
        pending.add(node);
      };
      const observer = new MutationObserver((records) => {
        for (const record of records) {
          const target = record.target;
          const host = target.nodeType === Node.ELEMENT_NODE ? target : target.parentElement;
          const scope = host?.closest?.("pre, .sh__line, [data-markdown-preview], main") ?? host;
          if (scope) queue(scope);
        }
      });
      observer.observe(document.body, {
        subtree: true,
        childList: true,
        characterData: true
      });
      scan(document.body, proseHighlighter);
      observer.takeRecords();
      const dispose = () => {
        observer.disconnect();
        proseHighlighter.dispose();
        style.remove();
        for (const el of Array.from(document.querySelectorAll(`[${ATTR}]`))) {
          undecorate(el);
        }
      };
      signal.addEventListener("abort", dispose, { once: true });
      return dispose;
    }
  });
});
export {
  app_default as default
};
