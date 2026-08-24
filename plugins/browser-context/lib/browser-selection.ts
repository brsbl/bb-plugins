import type {
  ExperimentalBrowserPageCapture,
  PluginBrowserActionProps,
} from "@get-bb/plugin-sdk/app";

export interface CapturePoint {
  x: number;
  y: number;
}

export interface CaptureRect extends CapturePoint {
  width: number;
  height: number;
}

export interface CaptureLocator {
  selectors: string[];
}

export interface CaptureAccessibility {
  source: "dom-hint";
  roleHint: string | null;
  nameHint: string | null;
  attributes: Record<string, string>;
}

export interface CaptureReactHint {
  componentStack: string[];
  source?: {
    fileName: string;
    lineNumber: number;
    columnNumber: number | null;
  };
}

export interface CaptureTarget {
  absoluteLocator: CaptureLocator;
  relativeLocator: CaptureLocator;
  text: string;
  rect: CaptureRect;
  accessibility?: CaptureAccessibility;
  react?: CaptureReactHint;
}

export interface BrowserSelectionCapture {
  version: 2;
  kind: "element" | "region";
  page: {
    url: string;
    title: string | null;
    viewport: { width: number; height: number };
    scroll: CapturePoint;
  };
  rect: CaptureRect;
  screenshot: Omit<ExperimentalBrowserPageCapture, "navigationEpoch"> & {
    deviceScaleFactor: number;
    pageZoom: number;
    cssToImageScale: CapturePoint;
  };
  element: null | {
    selector: string;
    tag: string;
    id: string | null;
    classNames: string[];
    rect: CaptureRect;
    dom: string;
    text: string;
    styles: Record<string, string>;
    accessibility: CaptureAccessibility;
    reactComponentStack: string[] | null;
    reactSource?: CaptureReactHint["source"];
  };
  region: null | {
    commonAncestor: null | {
      kind: "element" | "shadow-root" | "composed-element";
      absoluteLocator: CaptureLocator;
    };
    targets: CaptureTarget[];
    groups: Array<{
      absoluteLocator: CaptureLocator;
      relativeLocator: CaptureLocator;
      count: number;
      rect: CaptureRect;
    }>;
    omittedTargetCount: number;
    omittedGroupCount: number;
    scanTruncated: boolean;
  };
}

type PageSelectionResult = Omit<BrowserSelectionCapture, "screenshot"> & {
  deviceScaleFactor: number;
  elementLocator?: CaptureLocator;
};

/**
 * Reusable click/drag selection controller. Every dependency is nested because
 * BB serializes this function into the Browser page's isolated world.
 */
export function pageSelectionController({
  input,
  signal,
}: {
  input: { overlayId: string };
  signal: AbortSignal;
}) {
  const MAX_SCAN_NODES = 10_000;
  const MAX_SCAN_MS = 100;
  const MAX_CANDIDATES = 1_024;
  const MAX_TARGETS = 64;
  const MAX_GROUPS = 24;
  const MAX_DOM_NODES = 200;
  const MAX_DOM_DEPTH = 6;
  const SECRET_ATTRIBUTES = new Set([
    "action",
    "formaction",
    "href",
    "poster",
    "src",
    "srcdoc",
    "srcset",
    "style",
    "value",
    "xlink:href",
  ]);
  const A11Y_ATTRIBUTES = [
    "aria-label",
    "aria-labelledby",
    "aria-describedby",
    "aria-expanded",
    "aria-pressed",
    "aria-checked",
    "aria-current",
    "aria-hidden",
  ];
  const STYLE_NAMES = [
    "display",
    "position",
    "color",
    "backgroundColor",
    "fontFamily",
    "fontSize",
    "fontWeight",
    "lineHeight",
    "margin",
    "padding",
    "border",
    "borderRadius",
    "boxShadow",
    "opacity",
    "overflow",
    "zIndex",
    "flex",
    "grid",
    "transform",
  ];
  const cap = (value: string, max: number) =>
    value.length > max ? value.slice(0, max) : value;
  const text = (value: string, max: number) =>
    cap(value.replace(/\s+/gu, " ").trim(), max);
  const rect = (value: DOMRect | CaptureRect): CaptureRect => ({
    x: value.x,
    y: value.y,
    width: value.width,
    height: value.height,
  });
  const escape = (value: string) =>
    typeof CSS?.escape === "function"
      ? CSS.escape(value)
      : value.replace(/[^a-zA-Z0-9_-]/gu, "\\$&");
  const rootOf = (element: Element): Document | ShadowRoot => {
    const root = element.getRootNode();
    return root instanceof ShadowRoot ? root : document;
  };
  const selectorInRoot = (element: Element, root: Document | ShadowRoot) => {
    if (element.id) {
      const candidate = `#${escape(cap(element.id, 256))}`;
      try {
        if (root.querySelectorAll(candidate).length === 1) return candidate;
      } catch {}
    }
    const parts: string[] = [];
    let current: Element | null = element;
    while (current && parts.length < 8) {
      let part = current.localName.toLowerCase();
      const parent: Element | null = current.parentElement;
      if (parent) {
        const peers = [...parent.children].filter(
          (item) => item.localName === current?.localName,
        );
        if (peers.length > 1) {
          part += `:nth-of-type(${peers.indexOf(current) + 1})`;
        }
      }
      parts.unshift(part);
      const candidate = parts.join(" > ");
      try {
        if (root.querySelectorAll(candidate).length === 1) return candidate;
      } catch {}
      current = parent;
      if (current === null && root instanceof ShadowRoot) break;
    }
    return cap(parts.join(" > "), 2_048);
  };
  const locator = (element: Element): CaptureLocator => {
    const selectors: string[] = [];
    let current = element;
    while (true) {
      const root = rootOf(current);
      selectors.unshift(selectorInRoot(current, root));
      if (!(root instanceof ShadowRoot)) break;
      current = root.host;
    }
    return { selectors };
  };
  const relativeLocator = (
    element: Element,
    ancestor: Element | ShadowRoot,
  ): CaptureLocator => {
    if (ancestor instanceof ShadowRoot) {
      return { selectors: [selectorInRoot(element, ancestor)] };
    }
    if (element === ancestor) return { selectors: [":scope"] };
    const parts: string[] = [];
    let current: Element | null = element;
    while (current && current !== ancestor && parts.length < 8) {
      const parent: Element | null = current.parentElement;
      let part = current.localName.toLowerCase();
      if (parent) {
        const peers = [...parent.children].filter(
          (item) => item.localName === current?.localName,
        );
        if (peers.length > 1)
          part += `:nth-of-type(${peers.indexOf(current) + 1})`;
      }
      parts.unshift(part);
      current = parent;
    }
    return { selectors: [cap(parts.join(" > "), 2_048)] };
  };
  const isEditable = (element: Element) =>
    document.designMode === "on" ||
    element.matches("input,textarea,[contenteditable]") ||
    element.closest("[contenteditable]") !== null ||
    (element as HTMLElement).isContentEditable;
  const accessible = (element: Element): CaptureAccessibility => {
    const attributes: Record<string, string> = {};
    for (const name of A11Y_ATTRIBUTES) {
      const value = element.getAttribute(name);
      if (value !== null) attributes[name] = cap(value, 512);
    }
    const roleHint = element.getAttribute("role");
    const nameHint =
      element.getAttribute("aria-label") ||
      (!isEditable(element)
        ? text(
            (element as HTMLElement).innerText || element.textContent || "",
            512,
          )
        : "");
    return {
      source: "dom-hint",
      roleHint: roleHint ? cap(roleHint, 256) : null,
      nameHint: nameHint || null,
      attributes,
    };
  };
  const react = (element: Element): CaptureReactHint | undefined => {
    const key = Object.getOwnPropertyNames(element).find((name) =>
      name.startsWith("__reactFiber$"),
    );
    let fiber = key
      ? (element as unknown as Record<string, unknown>)[key]
      : undefined;
    const componentStack: string[] = [];
    let source: CaptureReactHint["source"] | undefined;
    for (let depth = 0; fiber && depth < 40; depth += 1) {
      const node = fiber as Record<string, unknown>;
      const type = node.type as
        { displayName?: string; name?: string } | string | undefined;
      const name =
        typeof type === "string"
          ? null
          : type?.displayName || type?.name || null;
      if (name && !componentStack.includes(name))
        componentStack.push(cap(name, 256));
      const debugSource = node._debugSource as
        | { fileName?: unknown; lineNumber?: unknown; columnNumber?: unknown }
        | undefined;
      if (
        source === undefined &&
        typeof debugSource?.fileName === "string" &&
        typeof debugSource.lineNumber === "number"
      ) {
        source = {
          fileName: cap(debugSource.fileName, 1_024),
          lineNumber: debugSource.lineNumber,
          columnNumber:
            typeof debugSource.columnNumber === "number"
              ? debugSource.columnNumber
              : null,
        };
      }
      fiber = node.return;
    }
    return componentStack.length || source
      ? { componentStack, ...(source ? { source } : {}) }
      : undefined;
  };
  const sanitizeDom = (source: Element) => {
    let count = 0;
    const visit = (element: Element, depth: number): string => {
      if (count >= MAX_DOM_NODES || depth > MAX_DOM_DEPTH) return "";
      count += 1;
      const attributes = [...element.attributes]
        .filter(
          ({ name }) =>
            !SECRET_ATTRIBUTES.has(name.toLowerCase()) &&
            !name.toLowerCase().startsWith("on"),
        )
        .slice(0, 24)
        .map(
          ({ name, value }) =>
            ` ${name}="${cap(value, 512)
              .replaceAll("&", "&amp;")
              .replaceAll('"', "&quot;")}"`,
        )
        .join("");
      const children = [...element.children]
        .map((child) => visit(child, depth + 1))
        .join("");
      const ownText =
        isEditable(element) || children
          ? ""
          : text(element.textContent || "", 2_000)
              .replaceAll("&", "&amp;")
              .replaceAll("<", "&lt;");
      return `<${element.localName}${attributes}>${ownText}${children}</${element.localName}>`;
    };
    return cap(visit(source, 0), 16_384);
  };
  const styles = (element: Element) => {
    const computed = getComputedStyle(element);
    return Object.fromEntries(
      STYLE_NAMES.map((name) => [
        name,
        cap(computed[name as keyof CSSStyleDeclaration] as string, 512),
      ]).filter(([, value]) => value.length > 0),
    );
  };
  const page = () => ({
    url: cap(location.href, 4_096),
    title: document.title ? cap(document.title, 1_024) : null,
    viewport: {
      width: document.documentElement.clientWidth || innerWidth,
      height: document.documentElement.clientHeight || innerHeight,
    },
    scroll: { x: scrollX, y: scrollY },
  });
  const elementCapture = (element: Element): PageSelectionResult => {
    const bounds = rect(element.getBoundingClientRect());
    const a11y = accessible(element);
    const reactHint = react(element);
    return {
      version: 2,
      kind: "element",
      page: page(),
      rect: bounds,
      deviceScaleFactor: window.devicePixelRatio,
      elementLocator: locator(element),
      element: {
        selector: locator(element).selectors.join(" → shadow → "),
        tag: element.localName,
        id: element.id || null,
        classNames: [...element.classList].slice(0, 12),
        rect: bounds,
        dom: sanitizeDom(element),
        text: isEditable(element)
          ? ""
          : text(
              (element as HTMLElement).innerText || element.textContent || "",
              2_000,
            ),
        styles: styles(element),
        accessibility: a11y,
        reactComponentStack: reactHint?.componentStack.length
          ? reactHint.componentStack
          : null,
        ...(reactHint?.source === undefined
          ? {}
          : { reactSource: reactHint.source }),
      },
      region: null,
    };
  };
  const intersects = (a: DOMRect, b: DOMRect) =>
    a.right > b.left &&
    a.left < b.right &&
    a.bottom > b.top &&
    a.top < b.bottom;
  const composedParent = (element: Element): Element | null =>
    element.parentElement ||
    (element.getRootNode() instanceof ShadowRoot
      ? (element.getRootNode() as ShadowRoot).host
      : null);
  const composedContains = (ancestor: Element, candidate: Element) => {
    let current: Element | null = candidate;
    while (current) {
      if (current === ancestor) return true;
      current = composedParent(current);
    }
    return false;
  };
  const commonAncestor = (elements: Element[]) => {
    if (!elements.length) return null;
    const roots = new Set(elements.map((element) => element.getRootNode()));
    if (roots.size === 1) {
      const root = elements[0]!.getRootNode();
      if (root instanceof ShadowRoot) {
        let current: Element | null = elements[0]!;
        while (
          current &&
          !elements.every((element) => current?.contains(element))
        ) {
          current = current.parentElement;
        }
        if (current) return { kind: "element" as const, node: current };
        return { kind: "shadow-root" as const, node: root };
      }
      let current: Element | null = elements[0]!;
      while (
        current &&
        !elements.every((element) => current?.contains(element))
      ) {
        current = current.parentElement;
      }
      return current ? { kind: "element" as const, node: current } : null;
    }
    let current: Element | null = elements[0]!;
    while (
      current &&
      !elements.every((element) => composedContains(current!, element))
    ) {
      current = composedParent(current);
    }
    return current
      ? { kind: "composed-element" as const, node: current }
      : null;
  };
  const regionCapture = (selection: DOMRect): PageSelectionResult => {
    const started = performance.now();
    const stack: Element[] = [...document.documentElement.children].reverse();
    const candidates: Element[] = [];
    let scanned = 0;
    let scanTruncated = false;
    while (stack.length) {
      if (
        scanned >= MAX_SCAN_NODES ||
        candidates.length >= MAX_CANDIDATES ||
        performance.now() - started > MAX_SCAN_MS
      ) {
        scanTruncated = true;
        break;
      }
      const element = stack.pop()!;
      scanned += 1;
      const children = [
        ...element.children,
        ...(element.shadowRoot ? [...element.shadowRoot.children] : []),
      ];
      for (let index = children.length - 1; index >= 0; index -= 1) {
        stack.push(children[index]!);
      }
      const bounds = element.getBoundingClientRect();
      if (
        !intersects(bounds, selection) ||
        bounds.width <= 0 ||
        bounds.height <= 0
      )
        continue;
      const computed = getComputedStyle(element);
      if (computed.display === "none" || computed.visibility === "hidden")
        continue;
      const meaningful =
        element.matches(
          "a,button,input,select,textarea,[role],[tabindex],summary",
        ) ||
        (!isEditable(element) &&
          text(element.textContent || "", 240).length > 0);
      if (meaningful) candidates.push(element);
    }
    const leaves = candidates.filter(
      (candidate) =>
        !candidates.some(
          (other) => other !== candidate && composedContains(candidate, other),
        ),
    );
    const ancestor = commonAncestor(leaves);
    const ancestorNode = ancestor?.node ?? null;
    const absoluteAncestor =
      ancestorNode instanceof ShadowRoot
        ? locator(ancestorNode.host)
        : ancestorNode
          ? locator(ancestorNode)
          : null;
    const targets = leaves.slice(0, MAX_TARGETS).map((element) => {
      const a11y = accessible(element);
      const reactHint = react(element);
      const relative = ancestorNode
        ? relativeLocator(element, ancestorNode)
        : locator(element);
      return {
        absoluteLocator: locator(element),
        relativeLocator: relative,
        text: isEditable(element)
          ? ""
          : text(
              (element as HTMLElement).innerText || element.textContent || "",
              240,
            ),
        rect: rect(element.getBoundingClientRect()),
        ...(a11y.roleHint ||
        a11y.nameHint ||
        Object.keys(a11y.attributes).length
          ? { accessibility: a11y }
          : {}),
        ...(reactHint ? { react: reactHint } : {}),
      };
    });
    const siblingBuckets = new Map<Element, Element[]>();
    for (const element of leaves) {
      const parent = element.parentElement;
      if (!parent) continue;
      const bucket = siblingBuckets.get(parent) ?? [];
      bucket.push(element);
      siblingBuckets.set(parent, bucket);
    }
    const allGroups = [...siblingBuckets.entries()]
      .filter(([, elements]) => elements.length > 1)
      .map(([parent, elements]) => {
        const boxes = elements.map((element) =>
          element.getBoundingClientRect(),
        );
        const left = Math.min(...boxes.map((box) => box.left));
        const top = Math.min(...boxes.map((box) => box.top));
        const right = Math.max(...boxes.map((box) => box.right));
        const bottom = Math.max(...boxes.map((box) => box.bottom));
        return {
          absoluteLocator: locator(parent),
          relativeLocator: ancestorNode
            ? relativeLocator(parent, ancestorNode)
            : locator(parent),
          count: elements.length,
          rect: { x: left, y: top, width: right - left, height: bottom - top },
        };
      });
    return {
      version: 2,
      kind: "region",
      page: page(),
      rect: rect(selection),
      deviceScaleFactor: window.devicePixelRatio,
      element: null,
      region: {
        commonAncestor:
          ancestor && absoluteAncestor
            ? { kind: ancestor.kind, absoluteLocator: absoluteAncestor }
            : null,
        targets,
        groups: allGroups.slice(0, MAX_GROUPS),
        omittedTargetCount: Math.max(0, leaves.length - targets.length),
        omittedGroupCount: Math.max(0, allGroups.length - MAX_GROUPS),
        scanTruncated,
      },
    };
  };

  return new Promise<PageSelectionResult>((resolve, reject) => {
    const overlay = document.createElement("div");
    overlay.setAttribute("data-bb-browser-context-overlay", "");
    overlay.setAttribute("data-bb-browser-context-overlay-id", input.overlayId);
    overlay.style.cssText =
      "position:fixed;inset:0;pointer-events:none;z-index:2147483647";
    const outline = document.createElement("div");
    outline.style.cssText =
      "position:absolute;display:none;border:2px solid #6558f5;background:rgba(101,88,245,.12);box-sizing:border-box";
    const label = document.createElement("div");
    label.style.cssText =
      "position:absolute;display:none;max-width:320px;padding:3px 6px;border-radius:4px;background:#171717;color:white;font:11px/1.4 system-ui;white-space:nowrap;overflow:hidden;text-overflow:ellipsis";
    overlay.append(outline, label);
    document.documentElement.append(overlay);
    const previousCursor = document.documentElement.style.cursor;
    document.documentElement.style.setProperty(
      "cursor",
      "crosshair",
      "important",
    );
    const removers: Array<() => void> = [];
    const listen = (
      target: EventTarget,
      type: string,
      handler: EventListener,
    ) => {
      target.addEventListener(type, handler, { capture: true });
      removers.push(() =>
        target.removeEventListener(type, handler, { capture: true }),
      );
    };
    let settled = false;
    let start: CapturePoint | null = null;
    let dragging = false;
    const cleanup = (removeOverlay = true) => {
      for (const remove of removers.splice(0)) remove();
      document.documentElement.style.cursor = previousCursor;
      if (removeOverlay) overlay.remove();
    };
    const finish = (value: PageSelectionResult) => {
      if (settled) return;
      settled = true;
      draw(
        value.rect,
        value.kind === "region"
          ? "Selected region"
          : value.element?.accessibility.nameHint ||
              value.element?.text ||
              value.element?.tag ||
              "Selected element",
      );
      cleanup(false);
      window.setTimeout(() => overlay.remove(), 30_000);
      resolve(value);
    };
    const cancel = () => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(
        Object.assign(new Error("Browser selection cancelled"), {
          name: "AbortError",
        }),
      );
    };
    const draw = (bounds: CaptureRect, caption: string) => {
      Object.assign(outline.style, {
        display: "block",
        left: `${bounds.x}px`,
        top: `${bounds.y}px`,
        width: `${bounds.width}px`,
        height: `${bounds.height}px`,
      });
      Object.assign(label.style, {
        display: "block",
        left: `${Math.max(0, Math.min(bounds.x, innerWidth - 320))}px`,
        top: `${Math.max(0, bounds.y - 23)}px`,
      });
      label.textContent = caption;
    };
    signal.addEventListener("abort", cancel, { once: true });
    removers.push(() => signal.removeEventListener("abort", cancel));
    listen(window, "keydown", ((event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopImmediatePropagation();
      cancel();
    }) as EventListener);
    listen(document, "pointerdown", ((event: PointerEvent) => {
      if (event.button !== 0) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      start = { x: event.clientX, y: event.clientY };
      dragging = false;
    }) as EventListener);
    listen(document, "pointermove", ((event: PointerEvent) => {
      if (start) {
        const width = Math.abs(event.clientX - start.x);
        const height = Math.abs(event.clientY - start.y);
        dragging ||= width >= 8 || height >= 8;
        if (dragging) {
          draw(
            {
              x: Math.min(start.x, event.clientX),
              y: Math.min(start.y, event.clientY),
              width,
              height,
            },
            "Selected region",
          );
          return;
        }
      }
      const target = document.elementFromPoint(event.clientX, event.clientY);
      if (!target || overlay.contains(target)) return;
      draw(rect(target.getBoundingClientRect()), target.localName);
    }) as EventListener);
    listen(document, "pointerup", ((event: PointerEvent) => {
      if (event.button !== 0 || !start) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      try {
        const suppressActivationClick = (clickEvent: Event) => {
          clickEvent.preventDefault();
          clickEvent.stopImmediatePropagation();
          document.removeEventListener("click", suppressActivationClick, true);
        };
        document.addEventListener("click", suppressActivationClick, {
          capture: true,
        });
        window.setTimeout(
          () =>
            document.removeEventListener(
              "click",
              suppressActivationClick,
              true,
            ),
          0,
        );
        if (dragging) {
          const selection = new DOMRect(
            Math.min(start.x, event.clientX),
            Math.min(start.y, event.clientY),
            Math.abs(event.clientX - start.x),
            Math.abs(event.clientY - start.y),
          );
          finish(regionCapture(selection));
        } else {
          const target = document.elementFromPoint(
            event.clientX,
            event.clientY,
          );
          if (!target || overlay.contains(target)) return;
          finish(elementCapture(target));
        }
      } catch (error) {
        cleanup();
        reject(error);
      }
    }) as EventListener);
  });
}

const PAGE_SELECTION_SOURCE = pageSelectionController.toString();

/** Removes the exact selection overlay after BB captures the preview image. */
export function pageSelectionOverlayCleanup({
  input,
}: {
  input: { overlayId: string };
}) {
  let removed = 0;
  document
    .querySelectorAll("[data-bb-browser-context-overlay-id]")
    .forEach((candidate) => {
      if (
        candidate.getAttribute("data-bb-browser-context-overlay-id") ===
        input.overlayId
      ) {
        candidate.remove();
        removed += 1;
      }
    });
  return { removed };
}

const PAGE_SELECTION_OVERLAY_CLEANUP_SOURCE =
  pageSelectionOverlayCleanup.toString();

/** Main-world follow-up used only for page-owned React Fiber/source hints. */
export function pageReactHintController({
  input,
}: {
  input: {
    elementLocator?: CaptureLocator;
    regionLocators: CaptureLocator[];
  };
}) {
  const resolve = (locator: CaptureLocator): Element | null => {
    let root: Document | ShadowRoot = document;
    let element: Element | null = null;
    for (let index = 0; index < locator.selectors.length; index += 1) {
      try {
        element = root.querySelector(locator.selectors[index]);
      } catch {
        return null;
      }
      if (element === null) return null;
      if (index < locator.selectors.length - 1) {
        if (!(element.shadowRoot instanceof ShadowRoot)) return null;
        root = element.shadowRoot;
      }
    }
    return element;
  };
  const inspect = (locator: CaptureLocator): CaptureReactHint | null => {
    const element = resolve(locator);
    if (element === null) return null;
    const key = Object.getOwnPropertyNames(element).find((name) =>
      name.startsWith("__reactFiber$"),
    );
    let fiber = key
      ? (element as unknown as Record<string, unknown>)[key]
      : undefined;
    const componentStack: string[] = [];
    let source: CaptureReactHint["source"] | undefined;
    for (let depth = 0; fiber && depth < 40; depth += 1) {
      const node = fiber as Record<string, unknown>;
      const type = node.type as
        { displayName?: string; name?: string } | string | undefined;
      const name =
        typeof type === "string"
          ? null
          : type?.displayName || type?.name || null;
      if (name && !componentStack.includes(name)) {
        componentStack.push(name.slice(0, 256));
      }
      const debugSource = node._debugSource as
        | { fileName?: unknown; lineNumber?: unknown; columnNumber?: unknown }
        | undefined;
      if (
        source === undefined &&
        typeof debugSource?.fileName === "string" &&
        typeof debugSource.lineNumber === "number"
      ) {
        source = {
          fileName: debugSource.fileName.slice(0, 1_024),
          lineNumber: debugSource.lineNumber,
          columnNumber:
            typeof debugSource.columnNumber === "number"
              ? debugSource.columnNumber
              : null,
        };
      }
      fiber = node.return;
    }
    return componentStack.length > 0 || source !== undefined
      ? { componentStack, ...(source === undefined ? {} : { source }) }
      : null;
  };
  return {
    element:
      input.elementLocator === undefined ? null : inspect(input.elementLocator),
    targets: input.regionLocators.map(inspect),
  };
}

const PAGE_REACT_HINT_SOURCE = pageReactHintController.toString();

export async function selectBrowserContext(
  props: Pick<
    PluginBrowserActionProps,
    "experimental_runPageContentScript" | "experimental_capturePage"
  >,
  signal: AbortSignal,
): Promise<BrowserSelectionCapture> {
  const overlayId = `capture-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const execution = await props.experimental_runPageContentScript(
    {
      source: PAGE_SELECTION_SOURCE,
      input: { overlayId },
      timeoutMs: 60_000,
    },
    { signal },
  );
  const selected = execution.value as unknown as PageSelectionResult;
  const cleanupOverlay = async () => {
    try {
      await props.experimental_runPageContentScript(
        {
          source: PAGE_SELECTION_OVERLAY_CLEANUP_SOURCE,
          input: { overlayId },
          timeoutMs: 2_000,
        },
        { signal: new AbortController().signal },
      );
    } catch {
      // Navigation can invalidate cleanup. The page-side timeout is the final
      // guard when the original document remains alive.
    }
  };
  if (signal.aborted) {
    await cleanupOverlay();
    signal.throwIfAborted();
  }
  try {
    const hints = await props.experimental_runPageContentScript(
      {
        world: "main",
        source: PAGE_REACT_HINT_SOURCE,
        input: {
          ...(selected.elementLocator === undefined
            ? {}
            : {
                elementLocator: {
                  selectors: [...selected.elementLocator.selectors],
                },
              }),
          regionLocators:
            selected.region?.targets.map((target) => ({
              selectors: [...target.absoluteLocator.selectors],
            })) ?? [],
        },
        timeoutMs: 5_000,
      },
      { signal },
    );
    if (hints.navigationEpoch !== execution.navigationEpoch) {
      const navigationError = new Error(
        "The Browser page changed while React context was captured",
      );
      navigationError.name = "NavigationError";
      throw navigationError;
    }
    const value = hints.value as unknown as {
      element: CaptureReactHint | null;
      targets: Array<CaptureReactHint | null>;
    };
    if (selected.element !== null && value.element !== null) {
      selected.element.reactComponentStack = value.element.componentStack;
      if (value.element.source !== undefined) {
        selected.element.reactSource = value.element.source;
      }
    }
    selected.region?.targets.forEach((target, index) => {
      const hint = value.targets[index];
      if (hint !== undefined && hint !== null) target.react = hint;
    });
  } catch (error) {
    if (
      signal.aborted ||
      (error instanceof Error && error.name === "NavigationError")
    ) {
      await cleanupOverlay();
      throw error;
    }
    // React is an optional enhancement. A hostile or non-React page must not
    // prevent deterministic DOM/a11y capture from completing.
  }
  if (signal.aborted) {
    await cleanupOverlay();
    signal.throwIfAborted();
  }
  let screenshot: ExperimentalBrowserPageCapture;
  try {
    screenshot = await props.experimental_capturePage({
      format: "png",
      expectedNavigationEpoch: execution.navigationEpoch,
    });
  } finally {
    await cleanupOverlay();
  }
  signal.throwIfAborted();
  if (screenshot.navigationEpoch !== execution.navigationEpoch) {
    throw new Error("The Browser page changed before the preview was captured");
  }
  const scaleX =
    selected.page.viewport.width > 0
      ? screenshot.pixelSize.width / selected.page.viewport.width
      : selected.deviceScaleFactor;
  const scaleY =
    selected.page.viewport.height > 0
      ? screenshot.pixelSize.height / selected.page.viewport.height
      : selected.deviceScaleFactor;
  const {
    deviceScaleFactor,
    elementLocator: _elementLocator,
    ...capture
  } = selected;
  const { navigationEpoch: _navigationEpoch, ...preview } = screenshot;
  return {
    ...capture,
    screenshot: {
      ...preview,
      deviceScaleFactor,
      pageZoom: 1,
      cssToImageScale: { x: scaleX, y: scaleY },
    },
  };
}
