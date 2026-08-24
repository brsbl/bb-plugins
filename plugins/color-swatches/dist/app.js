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
var PROSE_ATTR = "data-bb-color-swatch-prose";
var PROP = "--bb-color-swatch";
var USER_PROSE_SELECTOR = "[data-message-column] > .ml-auto [data-markdown-preview]";
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
[${PROSE_ATTR}] {
  /* Keep the generated chip attached to the literal at line boundaries. */
  white-space: nowrap;
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
var ProseDecorator = class {
  decorations = /* @__PURE__ */ new Map();
  nodesByRoot = /* @__PURE__ */ new Map();
  prune() {
    for (const [node, decoration] of [...this.decorations]) {
      if (!node.isConnected || !decoration.root.isConnected) {
        this.release(node, true);
      }
    }
  }
  replace(root) {
    this.clearRoot(root);
    const textNodes = [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      textNodes.push(node);
    }
    for (const textNode of textNodes) this.decorateTextNode(root, textNode);
  }
  /**
   * React updated a Text node we retained. Remove our siblings but preserve
   * React's new value so the next frame can decorate that value from scratch.
   */
  releaseForExternalUpdate(node) {
    const root = this.decorations.get(node)?.root ?? null;
    if (root) this.release(node, false);
    return root;
  }
  dispose() {
    for (const root of [...this.nodesByRoot.keys()]) this.clearRoot(root);
  }
  decorateTextNode(root, textNode) {
    const parent = textNode.parentElement;
    const text = textNode.data;
    if (!parent || parent.closest(`${EXCLUDED}, code, pre`) || !text.includes("#") && !/[a-z]\(/i.test(text)) {
      return;
    }
    const matches = findColorMatches(text).filter(
      (match) => isColor(match.value)
    );
    if (matches.length === 0) return;
    const fragment = document.createDocumentFragment();
    const insertedNodes = [];
    let cursor = matches[0].start;
    textNode.data = text.slice(0, cursor);
    for (const match of matches) {
      if (match.start > cursor) {
        const between = document.createTextNode(text.slice(cursor, match.start));
        fragment.append(between);
        insertedNodes.push(between);
      }
      const swatch = document.createElement("span");
      swatch.setAttribute(PROSE_ATTR, "");
      swatch.textContent = match.value;
      decorate(swatch, match.value);
      fragment.append(swatch);
      insertedNodes.push(swatch);
      cursor = match.end;
    }
    if (cursor < text.length) {
      const trailing = document.createTextNode(text.slice(cursor));
      fragment.append(trailing);
      insertedNodes.push(trailing);
    }
    textNode.parentNode?.insertBefore(fragment, textNode.nextSibling);
    this.decorations.set(textNode, { root, originalText: text, insertedNodes });
    const rootNodes = this.nodesByRoot.get(root) ?? /* @__PURE__ */ new Set();
    rootNodes.add(textNode);
    this.nodesByRoot.set(root, rootNodes);
  }
  clearRoot(root) {
    for (const node of [...this.nodesByRoot.get(root) ?? []]) {
      this.release(node, true);
    }
  }
  release(node, restoreOriginal) {
    const decoration = this.decorations.get(node);
    if (!decoration) return;
    if (restoreOriginal) node.data = decoration.originalText;
    for (const inserted of decoration.insertedNodes) {
      inserted.parentNode?.removeChild(inserted);
    }
    this.decorations.delete(node);
    const rootNodes = this.nodesByRoot.get(decoration.root);
    rootNodes?.delete(node);
    if (rootNodes?.size === 0) this.nodesByRoot.delete(decoration.root);
  }
};
function matchesWithin(root, selector) {
  const matches = Array.from(root.querySelectorAll?.(selector) ?? []);
  return root instanceof Element && root.matches(selector) ? [root, ...matches] : matches;
}
function scan(root, proseDecorator) {
  proseDecorator.prune();
  for (const stale of Array.from(
    root.querySelectorAll?.(`[${ATTR}]:not([${PROSE_ATTR}])`) ?? []
  )) {
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
    if (!prose.closest(EXCLUDED)) proseDecorator.replace(prose);
  }
}
var app_default = definePluginApp((app) => {
  app.contentScripts.register({
    id: "swatches",
    mount({ signal }) {
      const style = document.createElement("style");
      style.dataset.bbColorSwatches = "";
      style.textContent = STYLESHEET;
      document.head.append(style);
      const proseDecorator = new ProseDecorator();
      let pending = null;
      let frameId = null;
      let disposed = false;
      const flush = () => {
        frameId = null;
        if (disposed) {
          pending = null;
          return;
        }
        const roots = pending ?? /* @__PURE__ */ new Set();
        pending = null;
        for (const root of roots) {
          if (root.isConnected !== false) scan(root, proseDecorator);
        }
        observer.takeRecords();
      };
      const queue = (node) => {
        if (disposed) return;
        if (!pending) {
          pending = /* @__PURE__ */ new Set();
          frameId = requestAnimationFrame(flush);
        }
        pending.add(node);
      };
      const observer = new MutationObserver((records) => {
        for (const record of records) {
          const target = record.target;
          if (record.type === "characterData" && target instanceof Text) {
            const proseRoot = proseDecorator.releaseForExternalUpdate(target);
            if (proseRoot) {
              queue(proseRoot);
              continue;
            }
          }
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
      scan(document.body, proseDecorator);
      observer.takeRecords();
      const dispose = () => {
        disposed = true;
        pending = null;
        if (frameId !== null) {
          cancelAnimationFrame(frameId);
          frameId = null;
        }
        observer.disconnect();
        proseDecorator.dispose();
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
