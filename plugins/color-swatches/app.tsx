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
// Submitted user-message prose has no token boundary to decorate. It is not a
// streaming surface, so each matching literal gets an inline span after send.
// The original React-owned Text node remains first in the paragraph: we only
// shorten it to the prefix and insert the remaining nodes after it. If React
// updates that Text node later, the inserted nodes are removed before the new
// value is decorated. Copying still yields exactly the authored message because
// the visual chip remains generated content.
// ---------------------------------------------------------------------------

const ATTR = "data-bb-color-swatch";
const PROSE_ATTR = "data-bb-color-swatch-prose";
const PROP = "--bb-color-swatch";
const USER_PROSE_SELECTOR =
  "[data-message-column] > .ml-auto [data-markdown-preview]";

interface ProseDecoration {
  root: Element;
  originalText: string;
  insertedNodes: Node[];
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
[${PROSE_ATTR}] {
  /* Keep the generated chip attached to the literal at line boundaries. */
  white-space: nowrap;
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

/** Add inline chip hosts while retaining the Text nodes React owns. */
class ProseDecorator {
  private readonly decorations = new Map<Text, ProseDecoration>();
  private readonly nodesByRoot = new Map<Element, Set<Text>>();

  prune(): void {
    for (const [node, decoration] of [...this.decorations]) {
      if (!node.isConnected || !decoration.root.isConnected) {
        this.release(node, true);
      }
    }
  }

  replace(root: Element): void {
    this.clearRoot(root);

    const textNodes: Text[] = [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      textNodes.push(node as Text);
    }
    for (const textNode of textNodes) this.decorateTextNode(root, textNode);
  }

  /**
   * React updated a Text node we retained. Remove our siblings but preserve
   * React's new value so the next frame can decorate that value from scratch.
   */
  releaseForExternalUpdate(node: Text): Element | null {
    const root = this.decorations.get(node)?.root ?? null;
    if (root) this.release(node, false);
    return root;
  }

  dispose(): void {
    for (const root of [...this.nodesByRoot.keys()]) this.clearRoot(root);
  }

  private decorateTextNode(root: Element, textNode: Text): void {
    const parent = textNode.parentElement;
    const text = textNode.data;
    if (
      !parent ||
      parent.closest(`${EXCLUDED}, code, pre`) ||
      (!text.includes("#") && !/[a-z]\(/i.test(text))
    ) {
      return;
    }

    const matches = findColorMatches(text).filter((match) =>
      isColor(match.value),
    );
    if (matches.length === 0) return;

    const fragment = document.createDocumentFragment();
    const insertedNodes: Node[] = [];
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
    const rootNodes = this.nodesByRoot.get(root) ?? new Set<Text>();
    rootNodes.add(textNode);
    this.nodesByRoot.set(root, rootNodes);
  }

  private clearRoot(root: Element): void {
    for (const node of [...(this.nodesByRoot.get(root) ?? [])]) {
      this.release(node, true);
    }
  }

  private release(node: Text, restoreOriginal: boolean): void {
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
}

function matchesWithin(root: ParentNode, selector: string): Element[] {
  const matches = Array.from(root.querySelectorAll?.(selector) ?? []);
  return root instanceof Element && root.matches(selector)
    ? [root, ...matches]
    : matches;
}

function scan(root: ParentNode, proseDecorator: ProseDecorator): void {
  proseDecorator.prune();
  // Re-scanning a streamed line must not leave yesterday's chips behind.
  for (const stale of Array.from(
    root.querySelectorAll?.(`[${ATTR}]:not([${PROSE_ATTR}])`) ?? [],
  )) {
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
    if (!prose.closest(EXCLUDED)) proseDecorator.replace(prose);
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
      const proseDecorator = new ProseDecorator();

      // Streaming fires mutations constantly; collect subtrees and do one pass
      // per frame rather than one pass per mutation record.
      let pending: Set<ParentNode> | null = null;
      const flush = () => {
        const roots = pending ?? new Set();
        pending = null;
        for (const root of roots) {
          if (root.isConnected !== false) scan(root, proseDecorator);
        }
        // Discard the DOM mutations caused by this content script itself.
        observer.takeRecords();
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
          if (record.type === "characterData" && target instanceof Text) {
            const proseRoot = proseDecorator.releaseForExternalUpdate(target);
            if (proseRoot) {
              queue(proseRoot);
              continue;
            }
          }
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

      scan(document.body, proseDecorator);
      observer.takeRecords();

      const dispose = () => {
        observer.disconnect();
        proseDecorator.dispose();
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
