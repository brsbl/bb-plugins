import { definePluginApp } from "@get-bb/plugin-sdk/app";
import { findColorMatches } from "./colors";

// ---------------------------------------------------------------------------
// Why this decorates with CSS instead of inserting elements
//
// The timeline is React's DOM. Splitting its text nodes to wrap a literal is
// the usual way to do IDE swatches, and it is exactly what breaks while a
// message streams: React keeps the text node it created and writes the next
// chunk into whatever is left of it, so the wrapper survives with stale text
// beside it.
//
// So nothing is inserted. A decorated element gets one attribute and one custom
// property, and a stylesheet draws the chip in `::before`. Generated content is
// not part of the document, so React never sees it, selection never selects it,
// and copying a line still yields the original text.
//
// Placement relies on how bb highlights code: every token is its own span, so a
// literal always begins at a child boundary (`<span>#</span><span>f4f4f4</span>`)
// and the chip can sit on the token that starts the match.
//
// Submitted user-message prose has no token boundary to decorate, so it uses
// the browser's Custom Highlight API. A Range identifies the literal and CSS
// paints it without changing React's DOM. Agent prose deliberately stays on
// the token path above so live streaming remains as cheap as possible.
// ---------------------------------------------------------------------------

const ATTR = "data-bb-color-swatch";
const PROP = "--bb-color-swatch";
const USER_PROSE_SELECTOR =
  "[data-message-column] > .ml-auto [data-markdown-preview]";
const PROSE_HIGHLIGHT_PREFIX = "bb-color-swatches-prose-";

interface HighlightRegistryLike {
  delete(name: string): boolean;
  set(name: string, highlight: unknown): unknown;
}

interface HighlightApi {
  registry: HighlightRegistryLike;
  HighlightConstructor: new (...ranges: Range[]) => unknown;
}

interface ProseHighlightEntry {
  name: string;
  value: string;
  foreground: string | null;
}

const STYLESHEET = `
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

/** Containers whose text is being edited — never decorate the composer. */
const EXCLUDED = "[contenteditable], input, textarea";

const isColor = (value: string): boolean =>
  typeof CSS !== "undefined" && typeof CSS.supports === "function"
    ? CSS.supports("color", value)
    : true;

function decorate(el: HTMLElement, value: string): void {
  el.setAttribute(ATTR, "");
  el.style.setProperty(PROP, value);
}

function undecorate(el: Element): void {
  el.removeAttribute(ATTR);
  (el as HTMLElement).style?.removeProperty(PROP);
}

function highlightApi(): HighlightApi | null {
  if (typeof CSS === "undefined") return null;
  const registry = (CSS as typeof CSS & { highlights?: HighlightRegistryLike })
    .highlights;
  const HighlightConstructor = (
    globalThis as typeof globalThis & {
      Highlight?: new (...ranges: Range[]) => unknown;
    }
  ).Highlight;
  return registry && HighlightConstructor
    ? { registry, HighlightConstructor }
    : null;
}

/**
 * Decorate the direct children of a highlighted code line. A match is only
 * placed when it starts exactly at a child boundary; anything else would put
 * the chip in the wrong column, and a wrong chip is worse than none.
 */
function decorateTokenizedLine(line: Element): void {
  const starts = new Map<number, HTMLElement>();
  let text = "";
  for (const node of Array.from(line.childNodes)) {
    if (node.nodeType === Node.ELEMENT_NODE)
      starts.set(text.length, node as HTMLElement);
    text += node.textContent ?? "";
  }
  if (!text.includes("#") && !/[a-z]\(/i.test(text)) return;

  for (const match of findColorMatches(text)) {
    const target = starts.get(match.start);
    if (target && isColor(match.value)) decorate(target, match.value);
  }
}

/** An inline `<code>` chip whose whole content is one literal. */
function decorateWholeElement(el: HTMLElement): void {
  const text = (el.textContent ?? "").trim();
  if (!text || text.length > 64) return;
  const matches = findColorMatches(text);
  if (matches.length !== 1) return;
  const [only] = matches;
  if (only.start !== 0 || only.end !== text.length) return;
  if (isColor(only.value)) decorate(el, only.value);
}

function contrastForeground(value: string): string | null {
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
  const composite = (channel: number) =>
    channel * opacity + 128 * (1 - opacity);
  const linear = (channel: number) => {
    const normalized = composite(channel) / 255;
    return normalized <= 0.04045
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  };
  const luminance =
    0.2126 * linear(red) + 0.7152 * linear(green) + 0.0722 * linear(blue);
  return luminance > 0.42 ? "#111" : "#fff";
}

/** Paint submitted user-message literals without changing React-owned DOM. */
class ProseHighlighter {
  private readonly api = highlightApi();
  private readonly entriesByRoot = new Map<Element, ProseHighlightEntry[]>();
  private dirty = false;
  private nextId = 1;

  constructor(private readonly style: HTMLStyleElement) {}

  prune(): void {
    for (const root of this.entriesByRoot.keys()) {
      if (!root.isConnected) this.clearRoot(root);
    }
  }

  replace(root: Element): void {
    this.clearRoot(root);
    if (!this.api) return;

    const entries: ProseHighlightEntry[] = [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const textNode = node as Text;
      const parent = textNode.parentElement;
      if (
        !parent ||
        parent.closest(`${EXCLUDED}, code, pre`) ||
        (!textNode.data.includes("#") && !/[a-z]\(/i.test(textNode.data))
      ) {
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
          foreground: contrastForeground(match.value),
        });
      }
    }
    if (entries.length > 0) {
      this.entriesByRoot.set(root, entries);
      this.dirty = true;
    }
  }

  commit(): void {
    if (!this.dirty) return;
    this.syncStyles();
    this.dirty = false;
  }

  dispose(): void {
    for (const root of [...this.entriesByRoot.keys()]) this.clearRoot(root);
    this.commit();
  }

  private clearRoot(root: Element): void {
    const entries = this.entriesByRoot.get(root);
    if (!entries) return;
    for (const entry of entries) this.api?.registry.delete(entry.name);
    this.entriesByRoot.delete(root);
    this.dirty = true;
  }

  private syncStyles(): void {
    const proseRules = [...this.entriesByRoot.values()]
      .flat()
      .map(
        ({ name, value, foreground }) => `
::highlight(${name}) {
  background-color: ${value};
  ${foreground ? `color: ${foreground};` : ""}
  text-decoration-line: underline;
  text-decoration-color: rgba(128, 128, 128, 0.65);
  text-decoration-thickness: 1px;
  text-underline-offset: 2px;
}`,
      )
      .join("\n");
    this.style.textContent = `${STYLESHEET}${proseRules}`;
  }
}

function matchesWithin(root: ParentNode, selector: string): Element[] {
  const matches = Array.from(root.querySelectorAll?.(selector) ?? []);
  return root instanceof Element && root.matches(selector)
    ? [root, ...matches]
    : matches;
}

function scan(root: ParentNode, proseHighlighter: ProseHighlighter): void {
  proseHighlighter.prune();
  // Re-scanning a streamed line must not leave yesterday's chips behind.
  for (const stale of Array.from(root.querySelectorAll?.(`[${ATTR}]`) ?? [])) {
    undecorate(stale);
  }

  for (const line of matchesWithin(root, ".sh__line")) {
    if (line.closest(EXCLUDED)) continue;
    decorateTokenizedLine(line);
  }
  for (const code of matchesWithin(root, "code")) {
    if (code.closest(EXCLUDED) || code.closest("pre")) continue;
    decorateWholeElement(code as HTMLElement);
  }
  for (const prose of matchesWithin(root, USER_PROSE_SELECTOR)) {
    if (!prose.closest(EXCLUDED)) proseHighlighter.replace(prose);
  }
  proseHighlighter.commit();
}

export default definePluginApp((app) => {
  app.contentScripts.register({
    id: "swatches",
    mount({ signal }) {
      const style = document.createElement("style");
      style.dataset.bbColorSwatches = "";
      style.textContent = STYLESHEET;
      document.head.append(style);
      const proseHighlighter = new ProseHighlighter(style);

      // Streaming fires mutations constantly; collect subtrees and do one pass
      // per frame rather than one pass per mutation record.
      let pending: Set<ParentNode> | null = null;
      const flush = () => {
        const roots = pending ?? new Set();
        pending = null;
        for (const root of roots) {
          if (root.isConnected !== false) scan(root, proseHighlighter);
        }
      };
      const queue = (node: ParentNode) => {
        if (!pending) {
          pending = new Set();
          requestAnimationFrame(flush);
        }
        pending.add(node);
      };

      const observer = new MutationObserver((records) => {
        for (const record of records) {
          const target = record.target;
          const host =
            target.nodeType === Node.ELEMENT_NODE
              ? (target as Element)
              : target.parentElement;
          // A code line is the smallest unit worth rescanning; above that, the
          // message container catches whole re-renders.
          const scope =
            host?.closest?.("pre, .sh__line, [data-markdown-preview], main") ??
            host;
          if (scope) queue(scope as ParentNode);
        }
      });
      observer.observe(document.body, {
        subtree: true,
        childList: true,
        characterData: true,
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
    },
  });
});
