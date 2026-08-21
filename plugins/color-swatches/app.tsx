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
// ---------------------------------------------------------------------------

const ATTR = "data-bb-color-swatch";
const PROP = "--bb-color-swatch";

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

/**
 * Decorate the direct children of a highlighted code line. A match is only
 * placed when it starts exactly at a child boundary; anything else would put
 * the chip in the wrong column, and a wrong chip is worse than none.
 */
function decorateTokenizedLine(line: Element): void {
  const starts = new Map<number, HTMLElement>();
  let text = "";
  for (const node of Array.from(line.childNodes)) {
    if (node.nodeType === Node.ELEMENT_NODE) starts.set(text.length, node as HTMLElement);
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

function matchesWithin(root: ParentNode, selector: string): Element[] {
  const matches = Array.from(root.querySelectorAll?.(selector) ?? []);
  return root instanceof Element && root.matches(selector) ? [root, ...matches] : matches;
}

function scan(root: ParentNode): void {
  // Re-scanning a streamed line must not leave yesterday's chips behind.
  for (const stale of Array.from(root.querySelectorAll?.(`[${ATTR}]`) ?? [])) undecorate(stale);

  for (const line of matchesWithin(root, ".sh__line")) {
    if (line.closest(EXCLUDED)) continue;
    decorateTokenizedLine(line);
  }
  for (const code of matchesWithin(root, "code")) {
    if (code.closest(EXCLUDED) || code.closest("pre")) continue;
    decorateWholeElement(code as HTMLElement);
  }
}

export default definePluginApp((app) => {
  app.contentScripts.register({
    id: "swatches",
    mount({ signal }) {
      const style = document.createElement("style");
      style.dataset.bbColorSwatches = "";
      style.textContent = STYLESHEET;
      document.head.append(style);

      // Streaming fires mutations constantly; collect subtrees and do one pass
      // per frame rather than one pass per mutation record.
      let pending: Set<ParentNode> | null = null;
      const flush = () => {
        const roots = pending ?? new Set();
        pending = null;
        for (const root of roots) {
          if (root.isConnected !== false) scan(root);
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
          const scope = host?.closest?.("pre, .sh__line, [class*='markdown'], main") ?? host;
          if (scope) queue(scope as ParentNode);
        }
      });
      observer.observe(document.body, { subtree: true, childList: true, characterData: true });

      scan(document.body);

      const dispose = () => {
        observer.disconnect();
        style.remove();
        for (const el of Array.from(document.querySelectorAll(`[${ATTR}]`))) undecorate(el);
      };
      signal.addEventListener("abort", dispose, { once: true });
      return dispose;
    },
  });
});
