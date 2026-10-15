import { css, derive, themeReader, type Derived } from "./colors.js";
import { createRenderer } from "./renderer.js";

export interface Options { pills: boolean; speed: number; strength: number }
const FRAME = '.group\\/sidebar-wrapper';
const SURFACES = `${FRAME}[data-framed], [data-testid="app-nav-rail"], [data-testid="app-window-title-bar"]`;
const gradient = (colors: Derived["palette"]) => `linear-gradient(120deg, ${colors.map(css).join(", ")})`;

export function mountFrame(options: Options) {
  const style = document.createElement("style");
  style.dataset.prismFrameStyles = "";
  document.head.append(style);
  const reader = themeReader(document.body);
  let theme = derive(reader.read(), options.strength);
  const surfaces = new Map<HTMLElement, {
    layer: HTMLDivElement;
    renderer: ReturnType<typeof createRenderer>;
    dispose: () => void;
  }>();
  let raf = 0, pending = 0, last = 0, elapsed = 0;
  let disposed = false;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const scheme = matchMedia("(prefers-color-scheme: dark)");
  const stop = () => { cancelAnimationFrame(raf); raf = 0; last = 0; };
  const draw = (now: number) => {
    raf = 0;
    if (disposed || document.hidden || ![...surfaces.values()].some(surface => surface.renderer)) { last = 0; return; }
    if (!last || now - last >= 1000 / 30) {
      if (last && !reduced.matches) elapsed += Math.min(0.1, (now - last) / 1000) * options.speed;
      last = now;
      const bounds = [...surfaces].map(([target, surface]) => ({ surface, rect: target.getBoundingClientRect() }));
      const area = bounds.reduce((sum, { rect }) => sum + rect.width * rect.height, 0);
      const scale = Math.min(devicePixelRatio || 1, 1, Math.sqrt(900000 / Math.max(1, area)));
      for (const { surface, rect } of bounds) {
        if (rect.width <= 0 || rect.height <= 0 || rect.right <= 0 || rect.bottom <= 0 || rect.left >= innerWidth || rect.top >= innerHeight) continue;
        surface.renderer?.draw(theme, elapsed, rect, scale);
      }
    }
    if (!reduced.matches && options.speed > 0) raf = requestAnimationFrame(draw);
  };
  const schedule = () => { stop(); if (!disposed && !document.hidden) raf = requestAnimationFrame(draw); };
  const resize = new ResizeObserver(schedule);
  const attach = () => {
    for (const [target, surface] of surfaces) {
      if (!target.isConnected || !surface.layer.isConnected || !target.matches(SURFACES)) {
        surface.dispose();
        surfaces.delete(target);
      }
    }
    for (const target of document.querySelectorAll(SURFACES)) {
      if (!(target instanceof HTMLElement) || surfaces.has(target)) continue;
      target.setAttribute("data-prism-frame", "");
      const layer = document.createElement("div");
      layer.dataset.prismFrameLayer = "";
      layer.setAttribute("aria-hidden", "true");
      target.prepend(layer);
      const canvas = document.createElement("canvas");
      canvas.dataset.prismFrameCanvas = "";
      canvas.setAttribute("aria-hidden", "true");
      layer.append(canvas);
      const surface = { layer, renderer: createRenderer(canvas), dispose: () => {
        resize.unobserve(target);
        canvas.removeEventListener("webglcontextlost", lost);
        canvas.removeEventListener("webglcontextrestored", restored);
        surface.renderer?.dispose();
        canvas.getContext("webgl2")?.getExtension("WEBGL_lose_context")?.loseContext();
        layer.remove();
        target.removeAttribute("data-prism-frame");
      } };
      const lost = (event: Event) => {
        event.preventDefault();
        surface.renderer?.dispose();
        surface.renderer = null;
        canvas.style.visibility = "hidden";
      };
      const restored = () => {
        if (disposed) return;
        surface.renderer = createRenderer(canvas);
        canvas.style.visibility = surface.renderer ? "visible" : "hidden";
        schedule();
      };
      canvas.addEventListener("webglcontextlost", lost);
      canvas.addEventListener("webglcontextrestored", restored);
      if (!surface.renderer) canvas.style.visibility = "hidden";
      surfaces.set(target, surface);
      resize.observe(target);
    }
  };
  const update = () => {
    pending = 0;
    if (disposed) return;
    theme = derive(reader.read(), options.strength);
    const pillStyles = options.pills ? `
      html body .prompt-mention-pill {
        --pill-surface: ${gradient(theme.normal)};
        --pill-surface-selected: ${gradient(theme.selected)};
        --pill-foreground: ${css(theme.text)};
        --pill-icon: ${css(theme.icon)};
        --pill-surface-border: ${css(theme.border)};
        --pill-surface-selected-border: ${css(theme.selectedBorder)};
        --pill-shadow: inset 0 1px 0 color-mix(in oklab, ${css(theme.highlight)} 45%, transparent), 0 1px 2px color-mix(in oklab, ${css(theme.shadow)} 18%, transparent);
        color: var(--pill-foreground);
        background: var(--pill-surface);
        border-color: var(--pill-surface-border);
        box-shadow: var(--pill-shadow);
      }
      html body .prompt-mention-pill svg { color: var(--pill-icon); }
      html body .prompt-mention-pill--selected,
      html body .ProseMirror-selectednode .prompt-mention-pill { background: var(--pill-surface-selected); border-color: var(--pill-surface-selected-border); }
    ` : "";
    const next = `
      html body [data-prism-frame] { isolation: isolate; background: transparent; }
      html body ${FRAME}[data-prism-frame] { position: relative; }
      [data-prism-frame-layer] {
        position: absolute; inset: 0; z-index: -1; pointer-events: none; border-radius: inherit; overflow: hidden;
        background: ${gradient(theme.palette)};
      }
      ${FRAME} > [data-prism-frame-layer] {
        box-sizing: border-box; padding: inherit;
        mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
        mask-composite: exclude;
      }
      [data-prism-frame-canvas] { display: block; position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
      ${pillStyles}
    `;
    if (style.textContent !== next) style.textContent = next;
    attach();
    schedule();
  };
  const refresh = () => { if (!pending && !disposed) pending = requestAnimationFrame(update); };
  const colorsObserver = new MutationObserver(records => {
    if (records.some(record => record.target !== style && !style.contains(record.target))) refresh();
  });
  colorsObserver.observe(document.documentElement,{ attributes:true, attributeFilter:["class","style"] });
  colorsObserver.observe(document.body,{ attributes:true, attributeFilter:["class","style"] });
  colorsObserver.observe(document.head,{ childList:true, subtree:true, characterData:true, attributes:true, attributeFilter:["href","media","disabled"] });
  const layoutObserver = new MutationObserver(records => {
    if (records.some(record => record.type === "attributes" || [...record.addedNodes, ...record.removedNodes].some(node =>
      node instanceof Element && (node.matches(SURFACES) || node.querySelector(SURFACES) || node.hasAttribute("data-prism-frame-layer"))
    ))) refresh();
  });
  const root = document.getElementById("root") ?? document.body;
  layoutObserver.observe(root,{ childList:true, subtree:true, attributes:true, attributeFilter:["data-framed"] });
  document.addEventListener("visibilitychange",schedule);
  document.head.addEventListener("load",refresh,true);
  window.addEventListener("resize",schedule);
  reduced.addEventListener("change",schedule);
  scheme.addEventListener("change",refresh);
  update();
  return () => {
    disposed = true;
    cancelAnimationFrame(pending);
    colorsObserver.disconnect();
    layoutObserver.disconnect();
    document.removeEventListener("visibilitychange",schedule);
    document.head.removeEventListener("load",refresh,true);
    window.removeEventListener("resize",schedule);
    reduced.removeEventListener("change",schedule);
    scheme.removeEventListener("change",refresh);
    resize.disconnect();
    surfaces.forEach(surface => surface.dispose());
    surfaces.clear();
    stop();
    reader.dispose();
    style.remove();
  };
}
