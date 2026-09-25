import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  definePluginApp,
  experimental_useSidebarThreads,
  useBbNavigate,
  useRealtime,
  useRealtimeConnectionState,
  useRpc,
} from "@get-bb/plugin-sdk/app";

import { ActivityField, signalsOf } from "./activity.js";
import { captureInContext, snapshotScene } from "./context.js";
import { AmbientRenderer, motionBetween, type FrameInput, type ThemeColors } from "./engine.js";
import { DEFAULT_SCENE, type Controls, type RippleKind, type SceneParam } from "./scene.js";
import type { AmbientState, CaptureRequest, DailyScene, ambientRpcContract } from "./server.js";
import { ambientStore, useAmbient } from "./store.js";

const FRAME_INTERVAL_MS = 1000 / 30;
const FRAME_TOLERANCE_MS = 2;
const DISCONTINUITY_MS = 1000;
const SLOW_LATENESS_MS = 25;
const FAST_LATENESS_MS = 6;
const STALL_LATENESS_MS = 80;
const STALLED_FRAME_INTERVAL_MS = 250;
const MIN_AUTO_SCALE = 0.25;
const TARGET_FRAME_MS = 12;
const REJECT_FRAME_MS = 50;
const HEARTBEAT_MS = 60_000;
const CAPTURE_DELAY_MS = 900;
const MOTION_SAMPLE_MS = 1000;
const CONTEXT_CAPTURE_WIDTH = 1280;
const VEIL_STYLE_ID = "bb-ambient-veil";

const PANES = 'body.bb-app-shell > #root, [data-testid="secondary-panel-shelf"]';
const BLUR = "-webkit-backdrop-filter: blur(12px); backdrop-filter: blur(12px);";
const GLASS_FILL = "var(--ambient-glass-fill)";
const GLASS_BLUR = "-webkit-backdrop-filter: blur(24px) saturate(1.6); backdrop-filter: blur(24px) saturate(1.6);";
const GLASS_SURFACE = `background-color: ${GLASS_FILL}; ${GLASS_BLUR}
  border: 1px solid color-mix(in oklab, var(--ink) 9%, transparent);
  box-shadow: inset 0 1px 0 color-mix(in oklab, var(--canvas) 60%, transparent), 0 12px 32px -16px color-mix(in oklab, var(--ink) 35%, transparent);`;
const COLUMN_HALF = "404px";
const COLUMN_MASK = `linear-gradient(to right, transparent max(10px, 50% - ${COLUMN_HALF}), #000 max(10px, 50% - ${COLUMN_HALF}), #000 min(calc(100% - 10px), 50% + ${COLUMN_HALF}), transparent min(calc(100% - 10px), 50% + ${COLUMN_HALF}))`;
const RIGHT_PANEL = "body.bb-app-shell > #root #thread-detail-secondary-panel-handle + [data-panel] > aside";
const COLUMN_LEFT = `max(var(--ambient-column-gutter, 8px), 50% - ${COLUMN_HALF})`;
const COLUMN_RIGHT = `max(8px, 50% - ${COLUMN_HALF})`;
const COLUMN_BOTTOM = "8px";
const THREAD = "body.bb-app-shell > #root [data-thread-window]";
const COMPACT_HOME = 'body.bb-app-shell > #root [data-testid="root-compose-compact-home"]:has([data-root-compose-mobile-recents])';
const COMPACT_INSET = "max(16px, calc((100% - 760px) / 2 + 16px))";
const CHROME_PILLS = 'body.bb-app-shell > #root :is([data-testid="app-page-header-content-row"] > :first-child, [data-app-page-header-actions], [data-testid="app-sidebar-top-reserve-row"] > div, button[data-sidebar="trigger"])';
const SIDEBAR_CARDS = 'body.bb-app-shell > #root :is([data-testid="sidebar-navigation-region"], [data-sidebar="content"], [data-sidebar="footer"])';
const PAGE_MAIN = '[data-testid="app-layout-content-shell"] > main:not(:has([data-thread-window], [data-app-composer], [role="img"][aria-label="bb"]))';
const PAGE = `body.bb-app-shell > #root ${PAGE_MAIN}`;
const SIDEBAR_OPEN = 'body.bb-app-shell > #root .peer[data-state="expanded"][data-side="left"] + [data-sidebar="inset"]';
const THREAD_TITLE_ROW = '[data-split-pane-id]:has([data-thread-window]) > header > [data-testid="app-page-header-content-row"]';

function glassCss(glass: number): string {
  return `body.bb-app-shell { --ambient-glass-fill: color-mix(in oklab, var(--ambient-background) ${Math.round(glass * 100)}%, transparent); --ambient-glass-solid: color-mix(in oklab, var(--ambient-background) ${Math.round(Math.min(0.92, Math.max(0.88, glass + 0.3)) * 100)}%, transparent); }
${THREAD} { position: relative; isolation: isolate; }
${THREAD} > * { clip-path: inset(0 ${COLUMN_RIGHT} ${COLUMN_BOTTOM} ${COLUMN_LEFT} round 20px); }
${THREAD}::before { content: ""; position: absolute; z-index: -1; pointer-events: none; ${GLASS_SURFACE} border-radius: 20px; top: 0; bottom: ${COLUMN_BOTTOM}; left: ${COLUMN_LEFT}; right: ${COLUMN_RIGHT}; }
${THREAD} [data-overflow-fade] { display: none; }
${PAGE} { position: relative; isolation: isolate; }
${PAGE}::before { content: ""; position: absolute; z-index: -1; pointer-events: none; ${GLASS_SURFACE} border-radius: 20px; inset: 0 8px 8px; }
${PAGE_MAIN} :is(.max-w-5xl, [class~="max-w-[760px]"]):not(:is(.max-w-5xl, [class~="max-w-[760px]"]) *) { anchor-name: --ambient-page-column; }
${PAGE}::before { left: max(var(--ambient-column-gutter, 8px), anchor(--ambient-page-column left, 8px)); right: max(8px, anchor(--ambient-page-column right, 8px)); }
${PAGE}:has([data-testid="app-page-header-content-row"])::before { top: var(--bb-app-chrome-row-height, 3rem); }
${PAGE} :is(input[type="search"], input[placeholder^="Search" i]) { background-color: color-mix(in oklab, var(--card) 72%, transparent); border-color: color-mix(in oklab, var(--ink) 12%, transparent); }
${PAGE} .bg-card[class*="hover:bg-"]:hover { background-color: color-mix(in oklab, var(--card) 97%, var(--ink)); border-color: color-mix(in oklab, var(--ink) 14%, transparent); box-shadow: 0 8px 24px -16px color-mix(in oklab, var(--ink) 35%, transparent); }
@media (min-width: 768px) { ${SIDEBAR_OPEN} { --ambient-column-gutter: 0px; } ${SIDEBAR_OPEN} [data-testid="app-page-header-content-row"] > :first-child { margin-inline-start: -16px; } }
@media (min-width: 768px) { body.bb-app-shell > #root ${THREAD_TITLE_ROW} { padding-inline-start: max(32px, 50% - ${COLUMN_HALF} + 6px); } ${SIDEBAR_OPEN} ${THREAD_TITLE_ROW} { padding-inline-start: max(0px, 50% - ${COLUMN_HALF} + 16px); } }
${THREAD}::after { content: ""; position: absolute; z-index: 1; pointer-events: none; top: 1px; height: 28px; left: calc(${COLUMN_LEFT} + 1px); right: calc(${COLUMN_RIGHT} + 1px); border-radius: 19px 19px 0 0; background: linear-gradient(to bottom, color-mix(in oklab, var(--ambient-background) 18%, transparent), transparent); }
${THREAD} [data-timeline-row-list] :is([data-message-column].border, [data-message-column] .border) { border-color: color-mix(in oklab, var(--ink) 8%, transparent); }
${THREAD} [data-markdown-preview] div:has(> div > table) { width: 100% !important; margin-inline: 0 !important; }
${THREAD} [data-scroll-footer] > .bg-background { background-color: transparent; }
${THREAD} [data-scroll-footer] { isolation: isolate; padding-top: 16px; }
${THREAD} [data-scroll-footer]::before { content: ""; position: absolute; z-index: -1; pointer-events: none; top: 0; bottom: ${COLUMN_BOTTOM}; left: ${COLUMN_LEFT}; right: ${COLUMN_RIGHT}; border-radius: 20px; background: linear-gradient(to bottom, color-mix(in oklab, var(--canvas) 28%, transparent), transparent 45%), var(--ambient-background); border: 1px solid color-mix(in oklab, var(--ink) 9%, transparent); box-shadow: inset 0 1px 0 color-mix(in oklab, var(--canvas) 70%, transparent), inset 0 0 0 1px color-mix(in oklab, var(--canvas) 18%, transparent); }
body.bb-app-shell > #root header.bg-surface-scrim { border-color: transparent; }
${COMPACT_HOME} > [data-testid="root-compose-compact-scroll-viewport"] { ${GLASS_SURFACE} top: auto !important; bottom: 6px; left: ${COMPACT_INSET}; right: ${COMPACT_INSET}; max-height: min(calc(100% - 62px), 600px); border-radius: 20px; }
${COMPACT_HOME} [data-testid="root-compose-compact-recents-offset"] { display: none; }
${COMPACT_HOME} [data-testid="root-compose-compact-scroll-viewport"] > .px-4 { padding-inline: 0; }
${COMPACT_HOME} [data-testid="root-compose-compact-composer"] > .bg-background { border-radius: 0 0 20px 20px; }
body.bb-app-shell > #root [data-root-compose-mobile-recents] { padding-block: 0 6px; }
body.bb-app-shell > #root [data-root-compose-mobile-recents] > .sticky { background-color: var(--ambient-background); padding-block-start: 4px; }
body.bb-app-shell > #root [data-root-compose-mobile-recents] > .sticky [data-overflow-fade] { display: none; }
body.bb-app-shell > #root [data-testid="root-compose-compact-composer"] > [data-overflow-fade] { display: none; }
body.bb-app-shell > #root [data-testid="root-compose-compact-composer"] > .bg-background { background: linear-gradient(to bottom, color-mix(in oklab, var(--canvas) 28%, transparent), transparent 45%), var(--ambient-background); margin-inline: ${COMPACT_INSET}; margin-block-end: 6px; padding-block-start: 12px; border-radius: 20px; border: 1px solid color-mix(in oklab, var(--ink) 9%, transparent); box-shadow: inset 0 1px 0 color-mix(in oklab, var(--canvas) 70%, transparent), 0 -10px 24px -18px color-mix(in oklab, var(--ink) 40%, transparent); }
body.bb-app-shell > #root [data-app-composer]:not([data-thread-window] *, [data-testid="root-compose-compact-composer"] *) { ${GLASS_SURFACE} border-radius: 20px; padding: 10px 10px 4px; }
body.bb-app-shell > #root [role="img"][aria-label="bb"] + div { ${GLASS_SURFACE} border-radius: 20px; padding: 6px; }
body.bb-app-shell > #root div.fixed:has(> button[aria-label*="right panel" i]) { top: calc(6px + env(safe-area-inset-top)); right: calc(6px + env(safe-area-inset-right)); }
body.bb-app-shell > #root div.fixed > button[aria-label*="right panel" i] { ${GLASS_SURFACE} border-radius: 12px; }
body.bb-app-shell > #root [data-sidebar="panel"] { border-inline-end-color: transparent; }
:is(${CHROME_PILLS}) { ${GLASS_SURFACE} border-radius: 12px; padding-inline: 6px; }
body.bb-app-shell > #root :is([data-testid="app-page-header-content-row"] > :first-child, [data-testid="app-sidebar-top-reserve-row"] > div) { margin-inline: -6px; }
body.bb-app-shell > #root button[data-sidebar="trigger"] { margin-inline: -4px 0; width: 32px; height: 32px; }
body.bb-app-shell > #root [data-testid="app-sidebar-top-reserve-row"] > div:nth-child(n) { margin-inline-end: 0; min-height: 32px; }
body.bb-app-shell > #root [data-testid="app-page-header-content-row"] > :first-child { flex: 0 1 auto; min-width: 0; min-height: 32px; margin-inline-end: 4px; padding-inline-start: 12px; }
body.bb-app-shell > #root [data-testid="app-page-header-content-row"] > :first-child:has([data-pane-header-focus-tab]) { background-image: linear-gradient(var(--state-active), var(--state-active)); }
body.bb-app-shell > #root [data-pane-header-focus-tab] { background-color: transparent; }
body.bb-app-shell > #root [data-testid="app-page-header-content-row"] > [data-app-page-header-actions] { margin-inline: auto -8px; min-height: 32px; }
body.bb-app-shell > #root [data-app-page-header-actions] button.border { border-color: transparent; }
:is(${THREAD}, ${PAGE}, ${SIDEBAR_CARDS}, ${CHROME_PILLS}) { --state-hover: color-mix(in oklab, var(--ink) 9%, transparent); --state-active: color-mix(in oklab, var(--ink) 15%, transparent); --sidebar-accent: var(--state-hover); }
${SIDEBAR_CARDS} { ${GLASS_SURFACE} border-radius: 16px; margin-inline: 8px; }
body.bb-app-shell > #root [data-testid="sidebar-navigation-region"] { margin-block: 0 8px; }
body.bb-app-shell > #root [data-sidebar="content"] { flex: 0 1 auto; min-height: min(7rem, 18dvh); margin-block-end: auto; }
body.bb-app-shell > #root [data-sidebar="content"]:not(:has(~ [data-sidebar="footer"])) { margin-block-end: 8px; }
body.bb-app-shell > #root [data-sidebar="content"] > .px-2:first-child { padding-block-start: 12px; }
@media (max-height: 560px) { body.bb-app-shell > #root [data-testid="sidebar-navigation-region"] { flex: 0 1 auto; min-height: 3rem; overflow-y: auto; } }
body.bb-app-shell > #root [data-sidebar="footer"] { flex-shrink: 0; margin-block: 8px; align-self: flex-start; width: max-content; max-width: calc(100% - 16px); }
body.bb-app-shell > #root [data-sidebar="footer"]:has([data-testid^="plugin-sidebar-footer-disclosure-"]) { align-self: stretch; width: auto; max-width: none; }
body.bb-app-shell > #root [data-sidebar="footer"] [data-testid^="plugin-sidebar-footer-disclosure-"] { border-color: transparent; background-color: transparent; }
body.bb-app-shell > #root [data-sidebar="footer"] > [data-overflow-fade], body.bb-app-shell > #root [data-sidebar="footer"] > ul > li[aria-hidden="true"]:empty { display: none; }
:is(${SIDEBAR_CARDS}) :is(.sticky, [data-sidebar-sticky-tier], [data-sidebar-sticky-stack]), :is(${SIDEBAR_CARDS}) [data-sidebar-sticky-stack]::before { -webkit-backdrop-filter: none; backdrop-filter: none; }
body.bb-app-shell > #root [data-app-composer] { --background: color-mix(in oklab, var(--ambient-background) 88%, transparent); }
${RIGHT_PANEL} { ${GLASS_SURFACE} inset: 8px 8px 8px 2px; height: auto; max-width: calc(100% - 10px); border-radius: 20px; overflow: hidden; --background: transparent; --sidebar: transparent; }
body.bb-app-shell > #root :is([role="separator"][data-split-resize-grid-boundary], [data-panel-resize-handle-id]):not(:hover, [data-dragging], [data-resize-handle-state="drag"]), body.bb-app-shell > #root [data-panel-resize-handle-id]:not(:hover, [data-resize-handle-state="drag"]) > span { background-color: transparent; }
${RIGHT_PANEL} :is(.sticky, [data-sidebar-sticky-tier]) { -webkit-backdrop-filter: none; backdrop-filter: none; }
${RIGHT_PANEL} [data-app-browser] > [class~="flex-1"]:last-child { margin: 0 8px 8px; border-radius: 12px; overflow: hidden; }
body.bb-app-shell [data-testid="secondary-panel-shelf"] { background-color: var(--ambient-glass-solid); -webkit-backdrop-filter: blur(32px); backdrop-filter: blur(32px); }`;
}

function veilCss(showThrough: number): string {
  const keep = Math.round((1 - showThrough) * 1000) / 10;
  return `html.bb-app-shell-root { background-color: var(--canvas); }
body.bb-app-shell { background-color: transparent; --ambient-background: var(--background); --ambient-sidebar: var(--sidebar); }
:is(${PANES}) { --background: color-mix(in oklab, var(--ambient-background) ${keep}%, transparent); --sidebar: color-mix(in oklab, var(--ambient-sidebar) ${keep}%, transparent); }
:is(${PANES}) .bg-sidebar .bg-sidebar:not(.sticky), [data-testid="secondary-panel-shelf"] .bg-sidebar:not(.sticky) { --sidebar: transparent; }
:is(${PANES}) .sticky:is(.bg-sidebar, .bg-background) { --sidebar: transparent; --background: transparent; ${BLUR} }
:is(${PANES}) header.bg-surface-scrim { background-color: transparent; }
body.bb-app-shell [role="switch"][aria-checked="true"] > span.bg-background { background-color: var(--canvas); }
body.bb-app-shell [class~="text-background"] { color: var(--ambient-background); }
body.bb-app-shell :is(button[role="checkbox"][data-state="checked"], [data-category-option-checkbox][data-state="enabled"]) { color: var(--canvas); }
body.bb-app-shell > #root [data-sidebar-sticky-stack]::before, body.bb-app-shell > #root [data-sidebar-sticky-tier] { ${BLUR} }
body.bb-app-shell > #root [data-sidebar="panel"][data-vaul-drawer-direction][data-state="closed"]:not([data-vaul-animate]) { visibility: hidden; transition: visibility 0s linear 260ms; }`;
}

function readThemeColors(): ThemeColors {
  const probe = document.createElement("canvas");
  probe.width = 1;
  probe.height = 1;
  const context = probe.getContext("2d", { willReadFrequently: true });
  const styles = getComputedStyle(document.documentElement);
  const read = (name: string, fallback: [number, number, number]) => {
    const value = styles.getPropertyValue(name).trim();
    if (!context || !value) return fallback;
    context.clearRect(0, 0, 1, 1);
    context.fillStyle = "#000";
    context.fillStyle = value;
    context.fillRect(0, 0, 1, 1);
    const [r, g, b] = context.getImageData(0, 0, 1, 1).data;
    return [r! / 255, g! / 255, b! / 255] as [number, number, number];
  };
  const canvas = read("--canvas", [1, 1, 1]);
  const ink = read("--ink", [0.2, 0.2, 0.2]);
  const luminance = 0.2126 * canvas[0] + 0.7152 * canvas[1] + 0.0722 * canvas[2];
  return { canvas, ink, dark: luminance < 0.5 };
}

function useThemeColors(): ThemeColors {
  const [theme, setTheme] = useState(readThemeColors);
  useEffect(() => {
    let pending = 0;
    const refresh = () => {
      if (pending) return;
      pending = requestAnimationFrame(() => {
        pending = 0;
        const next = readThemeColors();
        setTheme((current) =>
          current.dark === next.dark &&
          current.canvas.every((value, index) => value === next.canvas[index]) &&
          current.ink.every((value, index) => value === next.ink[index])
            ? current
            : next,
        );
      });
    };
    const observer = new MutationObserver(refresh);
    observer.observe(document.documentElement, { attributes: true });
    observer.observe(document.head, { childList: true, subtree: true, characterData: true });
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", refresh);
    return () => {
      cancelAnimationFrame(pending);
      observer.disconnect();
      media.removeEventListener("change", refresh);
    };
  }, []);
  return theme;
}

interface Snapshot {
  sceneId: string | null;
  values: Record<string, number>;
  palette: [string, string, string, string];
  controls: { showThrough: number; speed: number; glass: number; enabled: boolean };
}

function valuesOf(params: readonly SceneParam[]): Record<string, number> {
  return Object.fromEntries(params.map((entry) => [entry.id, entry.value]));
}

function AmbientOverlay() {
  const rpc = useRpc<typeof ambientRpcContract>();
  const connection = useRealtimeConnectionState();
  const { status, threads } = experimental_useSidebarThreads();
  const { state } = useAmbient();
  const theme = useThemeColors();
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<AmbientRenderer | null>(null);
  const fieldRef = useRef(new ActivityField());
  const compiledRevision = useRef<number | null>(null);
  const liveRef = useRef({ state, theme, pointer: [0.5, 0.5] as [number, number] });
  liveRef.current.state = state;
  liveRef.current.theme = theme;

  const refresh = useCallback(async () => {
    ambientStore.receive(await rpc.call("state"));
  }, [rpc]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (connection === "connected") void refresh();
  }, [connection, refresh]);

  useRealtime("state", () => {
    void refresh();
  });

  useEffect(() => {
    if (status !== "ready") return;
    const field = fieldRef.current;
    field.observe(signalsOf(threads), performance.now() / 1000);
    ambientStore.setSummary(field.summary());
  }, [status, threads]);

  useEffect(
    () =>
      ambientStore.onRipple((kind) => {
        fieldRef.current.rippleAtRandomAgent(performance.now() / 1000, kind);
      }),
    [],
  );

  const enabled = state?.controls.enabled ?? false;
  const [rendererEpoch, setRendererEpoch] = useState(0);
  const fallbackRef = useRef(false);
  const autoScaleRef = useRef(1);
  const pacingRef = useRef({ lateness: 0, lastAdjust: 0 });
  const clockRef = useRef({ time: 0 });

  useEffect(() => {
    if (!canvas) return;
    let renderer: AmbientRenderer;
    try {
      renderer = new AmbientRenderer(canvas);
    } catch (error) {
      ambientStore.setCompileError(error instanceof Error ? error.message : String(error));
      return;
    }
    rendererRef.current = renderer;
    compiledRevision.current = null;
    const lost = (event: Event) => event.preventDefault();
    const restored = () => setRendererEpoch((epoch) => epoch + 1);
    canvas.addEventListener("webglcontextlost", lost);
    canvas.addEventListener("webglcontextrestored", restored);
    return () => {
      canvas.removeEventListener("webglcontextlost", lost);
      canvas.removeEventListener("webglcontextrestored", restored);
      renderer.dispose();
      rendererRef.current = null;
    };
  }, [canvas, rendererEpoch]);

  const frameInput = useCallback(
    (clock: { time: number }): FrameInput => ({
      time: clock.time,
      frame: fieldRef.current.step(performance.now() / 1000),
      pointer: liveRef.current.pointer,
      theme: liveRef.current.theme,
    }),
    [],
  );

  const detail = useCallback(() => {
    const current = liveRef.current.state;
    return (ambientStore.getSnapshot().deviceDetail ?? current?.controls.quality ?? 0.5) * autoScaleRef.current;
  }, []);

  const renderFrame = useCallback(
    (clock: { time: number }) => {
      const renderer = rendererRef.current;
      if (!renderer || !liveRef.current.state) return;
      renderer.resize(detail());
      renderer.render(frameInput(clock));
      ambientStore.setSummary(fieldRef.current.summary());
    },
    [detail, frameInput],
  );

  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer || !state) return;
    const applySceneValues = () => {
      const source = fallbackRef.current ? DEFAULT_SCENE : state.scene;
      renderer.setPalette(source.palette);
      renderer.setParamValues(valuesOf(source.params));
    };
    if (compiledRevision.current === state.sceneRevision) {
      applySceneValues();
      return;
    }
    const revision = state.sceneRevision;
    const scene = state.scene;
    compiledRevision.current = revision;
    void (async () => {
      let result = await renderer.compile(scene);
      if (result.ok === "superseded" || compiledRevision.current !== revision) return;
      if (result.ok) {
        renderer.setPalette(scene.palette);
        renderer.setParamValues(valuesOf(scene.params));
        renderer.resize(detail() / autoScaleRef.current);
        const fullDetailMs = renderer.estimateFrameMs(frameInput(clockRef.current));
        const lowestDetailMs = fullDetailMs * MIN_AUTO_SCALE * MIN_AUTO_SCALE;
        if (lowestDetailMs > REJECT_FRAME_MS) {
          result = {
            ok: false,
            log: `Too heavy: about ${Math.round(fullDetailMs)} ms per frame, and still ${Math.round(lowestDetailMs)} ms at the lowest detail. Frames must render in a few milliseconds; use fewer loop iterations and fbm octaves.`,
          };
        } else {
          autoScaleRef.current =
            fullDetailMs > TARGET_FRAME_MS
              ? Math.max(MIN_AUTO_SCALE, Math.sqrt(TARGET_FRAME_MS / fullDetailMs))
              : 1;
          pacingRef.current.lateness = 0;
          pacingRef.current.lastAdjust = performance.now();
        }
      }
      if (result.ok === true) {
        fallbackRef.current = false;
        ambientStore.setCompileError(null);
      } else if (result.ok === false) {
        fallbackRef.current = true;
        autoScaleRef.current = 1;
        ambientStore.setCompileError(result.log);
        const fallback = await renderer.compile(DEFAULT_SCENE);
        if (fallback.ok !== true) return;
        applySceneValues();
      }
      if (document.hidden || renderer.isContextLost()) return;
      void rpc
        .call("reportCompile", {
          sceneRevision: revision,
          ok: result.ok === true,
          ...(result.ok === false ? { log: result.log.slice(0, 8_000) } : {}),
        })
        .catch(() => undefined);
    })();
  }, [canvas, detail, frameInput, rendererEpoch, rpc, state]);

  useEffect(() => {
    if (!enabled) return;
    const beat = () => {
      if (!document.hidden) void rpc.call("heartbeat").catch(() => undefined);
    };
    beat();
    const timer = window.setInterval(beat, HEARTBEAT_MS);
    document.addEventListener("visibilitychange", beat);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", beat);
    };
  }, [enabled, rpc]);

  useEffect(() => {
    if (!enabled || !canvas) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let last = performance.now();
    const pacing = pacingRef.current;
    const loop = (timestamp: number) => {
      frame = requestAnimationFrame(loop);
      if (document.hidden) {
        last = timestamp;
        return;
      }
      const stalled = autoScaleRef.current <= MIN_AUTO_SCALE && pacing.lateness > STALL_LATENESS_MS;
      const interval = stalled ? STALLED_FRAME_INTERVAL_MS : FRAME_INTERVAL_MS;
      const elapsed = timestamp - last;
      if (elapsed < interval - FRAME_TOLERANCE_MS) return;
      last = timestamp;
      if (elapsed < DISCONTINUITY_MS) {
        pacing.lateness = pacing.lateness * 0.9 + Math.max(0, elapsed - interval) * 0.1;
        if (pacing.lateness > SLOW_LATENESS_MS && timestamp - pacing.lastAdjust > 1500 && autoScaleRef.current > MIN_AUTO_SCALE) {
          autoScaleRef.current = Math.max(MIN_AUTO_SCALE, autoScaleRef.current * 0.7);
          pacing.lastAdjust = timestamp;
        } else if (pacing.lateness < FAST_LATENESS_MS && timestamp - pacing.lastAdjust > 8000 && autoScaleRef.current < 1) {
          autoScaleRef.current = Math.min(1, autoScaleRef.current / 0.85);
          pacing.lastAdjust = timestamp;
        }
      }
      ambientStore.setThrottled(autoScaleRef.current < 1);
      const speed = liveRef.current.state?.controls.speed ?? 1;
      clockRef.current.time +=
        (Math.min(elapsed, 250) / 1000) * speed * (reducedMotion.matches ? 0.25 : 1);
      renderFrame(clockRef.current);
    };
    frame = requestAnimationFrame(loop);
    const resume = () => {
      last = performance.now();
    };
    const move = (event: PointerEvent) => {
      liveRef.current.pointer = [
        event.clientX / window.innerWidth,
        1 - event.clientY / window.innerHeight,
      ];
    };
    document.addEventListener("visibilitychange", resume);
    window.addEventListener("pointermove", move, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      pacing.lateness = 0;
      document.removeEventListener("visibilitychange", resume);
      window.removeEventListener("pointermove", move);
    };
  }, [canvas, enabled, renderFrame]);

  useRealtime("capture", (payload) => {
    const request = payload as CaptureRequest;
    const renderer = rendererRef.current;
    if (!renderer || document.hidden || renderer.isContextLost() || typeof request?.requestId !== "string") {
      return;
    }
    if (request.ripple) ambientStore.requestRipple(request.ripple);
    window.setTimeout(
      () => {
        renderFrame(clockRef.current);
        void renderer
          .capture(960, liveRef.current.theme.canvas, { encode: false })
          .then((before) => {
            window.setTimeout(() => {
              renderFrame(clockRef.current);
              const { theme } = liveRef.current;
              const source = document.querySelector<HTMLCanvasElement>("canvas[data-bb-ambient]");
              const frame = source ? snapshotScene(source, CONTEXT_CAPTURE_WIDTH) : null;
              void renderer
                .capture(960, theme.canvas, { encode: true })
                .then(async (after) => ({
                  after,
                  inContext: frame ? await captureInContext(frame, theme.canvas).catch(() => null) : null,
                }))
                .then(({ after, inContext }) =>
                  rpc.call("submitCapture", {
                    requestId: request.requestId,
                    dataUrl: after.dataUrl,
                    ...(inContext ? { context: inContext } : {}),
                    summary: fieldRef.current.summary(),
                    visibility: {
                      ...after.visibility,
                      motion: motionBetween(before, after),
                      frameMs: Math.min(renderer.estimateFrameMs(frameInput(clockRef.current)), 10_000),
                      detail: Math.min(1, detail()),
                    },
                    dark: theme.dark,
                  }),
                )
                .catch(() => undefined);
            }, MOTION_SAMPLE_MS);
          })
          .catch(() => undefined);
      },
      request.ripple ? CAPTURE_DELAY_MS : 0,
    );
  });

  const showThrough = state?.controls.showThrough ?? 0;
  const glass = state?.controls.glass ?? 0.6;
  useEffect(() => {
    if (!enabled) return;
    const style = document.createElement("style");
    style.id = VEIL_STYLE_ID;
    style.textContent = `${veilCss(showThrough)}\n${glassCss(glass)}`;
    document.head.append(style);
    return () => style.remove();
  }, [enabled, showThrough, glass]);

  if (!enabled) return null;
  return createPortal(
    <canvas
      ref={setCanvas}
      aria-hidden="true"
      data-bb-ambient=""
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        zIndex: -1,
        pointerEvents: "none",
      }}
    />,
    document.body,
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function snap(value: number, min: number, max: number, step: number): number {
  return clamp(Number((Math.round((value - min) / step) * step + min).toFixed(4)), min, max);
}

function Slider({
  label,
  hint,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: {
  label: string;
  hint?: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format?: (value: number) => string;
  onChange: (value: number) => void;
}) {
  const track = useRef<HTMLDivElement>(null);
  const fraction = (clamp(value, min, max) - min) / (max - min);
  const text = format ? format(value) : value.toFixed(step >= 1 ? 0 : step >= 0.1 ? 1 : 2);
  const fromPointer = (clientX: number) => {
    const rect = track.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    onChange(snap(min + ((clientX - rect.left) / rect.width) * (max - min), min, max, step));
  };
  return (
    <div className="grid min-h-6 grid-cols-[7rem_1fr_2.25rem] items-center gap-2">
      <span className="line-clamp-2 text-xs leading-tight break-words text-muted-foreground" title={hint ? `${label}: ${hint}` : label}>
        {label}
      </span>
      <div
        ref={track}
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={text}
        className="group relative flex h-5 cursor-pointer touch-none items-center outline-none"
        onPointerDown={(event) => {
          event.currentTarget.focus();
          event.currentTarget.setPointerCapture(event.pointerId);
          fromPointer(event.clientX);
        }}
        onPointerMove={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) fromPointer(event.clientX);
        }}
        onKeyDown={(event) => {
          const direction =
            event.key === "ArrowRight" || event.key === "ArrowUp"
              ? 1
              : event.key === "ArrowLeft" || event.key === "ArrowDown"
                ? -1
                : 0;
          if (direction === 0) return;
          event.preventDefault();
          onChange(snap(value + direction * step * (event.shiftKey ? 10 : 1), min, max, step));
        }}
      >
        <div className="h-1 w-full rounded-full bg-foreground/15" />
        <div
          className="absolute left-0 h-1 rounded-full bg-foreground/60"
          style={{ width: `${fraction * 100}%` }}
        />
        <div
          className="absolute h-4 w-4 -translate-x-1/2 cursor-grab rounded-full border border-foreground/20 shadow-[0_1px_3px_color-mix(in_oklab,var(--ink)_35%,transparent)] transition-transform duration-150 group-hover:scale-110 group-focus:scale-110 group-focus:ring-4 group-focus:ring-foreground/15 group-active:cursor-grabbing"
          style={{ left: `${fraction * 100}%`, backgroundColor: "var(--canvas)" }}
        />
      </div>
      <span className="text-right text-xs tabular-nums text-muted-foreground">{text}</span>
    </div>
  );
}

function useDebouncedCall<Args extends unknown[]>(
  call: (...args: Args) => void,
  delay: number,
): (...args: Args) => void {
  const timers = useRef(new Map<string, number>());
  useEffect(() => {
    const pending = timers.current;
    return () => {
      for (const timer of pending.values()) window.clearTimeout(timer);
    };
  }, []);
  return useCallback(
    (...args: Args) => {
      const key = String(args[0]);
      const existing = timers.current.get(key);
      if (existing !== undefined) window.clearTimeout(existing);
      timers.current.set(
        key,
        window.setTimeout(() => {
          timers.current.delete(key);
          call(...args);
        }, delay),
      );
    },
    [call, delay],
  );
}

const RIPPLE_BUTTONS: { kind: RippleKind; label: string; hint: string; dot: string }[] = [
  { kind: "started", label: "starts", hint: "Show what the scene does when an agent starts", dot: "bg-foreground/50" },
  { kind: "done", label: "finishes", hint: "Show what the scene does when an agent finishes a turn", dot: "bg-foreground" },
  { kind: "error", label: "errors", hint: "Show what the scene does when an agent hits an error", dot: "bg-destructive" },
];

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="space-y-1">
      <div className="flex h-5 items-center justify-between gap-2">
        <h3 className="text-xs font-medium text-foreground/70">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

function TextButton({
  children,
  danger,
  disabled,
  onClick,
}: {
  children: ReactNode;
  danger?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded-full px-1.5 text-xs transition-colors disabled:opacity-50 ${
        danger ? "text-destructive hover:text-destructive/80" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function Switch({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-4 w-7 shrink-0 rounded-full transition-colors ${checked ? "bg-foreground" : "bg-foreground/20"}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 size-3 rounded-full shadow-sm transition-transform ${checked ? "translate-x-3" : "translate-x-0"}`}
        style={{ backgroundColor: "var(--canvas)" }}
      />
    </button>
  );
}

function hourLabel(hour: number): string {
  return new Date(2000, 0, 1, hour).toLocaleTimeString([], { hour: "numeric" });
}

function DailySceneRow() {
  const rpc = useRpc<typeof ambientRpcContract>();
  const [daily, setDaily] = useState<DailyScene | null>(null);

  const refresh = useCallback(async () => {
    setDaily(await rpc.call("daily"));
  }, [rpc]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useRealtime("daily", () => {
    void refresh();
  });

  if (!daily) return null;

  const update = async (next: { enabled?: boolean; hour?: number }) => {
    setDaily({ ...daily, ...next });
    setDaily(
      await rpc.call("setDaily", {
        ...next,
        ...(next.enabled ? { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone } : {}),
      }),
    );
  };


  const next =
    daily.enabled && daily.nextRunAt
      ? `Next ${new Date(daily.nextRunAt).toLocaleString([], { weekday: "short", hour: "numeric", minute: "2-digit" })}, in Automations`
      : "An agent paints a new scene each day";

  return (
    <div className="space-y-1">
      <div className="flex h-6 items-center gap-1 whitespace-nowrap text-xs text-muted-foreground" title={next}>
        <span className="font-medium text-foreground/70">Daily scene</span>
        <select
          aria-label="Daily scene hour"
          value={daily.hour}
          onChange={(event) => void update({ hour: Number(event.currentTarget.value) })}
          className="min-w-0 cursor-pointer appearance-none rounded bg-transparent px-0.5 text-xs text-foreground underline decoration-foreground/30 underline-offset-2 outline-none"
        >
          {Array.from({ length: 24 }, (_, hour) => (
            <option key={hour} value={hour}>
              {hourLabel(hour)}
            </option>
          ))}
        </select>
        <span className="ml-auto flex shrink-0 items-center gap-1">
          <Switch
            checked={daily.enabled}
            label="New scene every morning"
            onChange={(enabled) => void update({ enabled })}
          />
        </span>
      </div>
    </div>
  );
}

function PaintRequestRow() {
  const rpc = useRpc<typeof ambientRpcContract>();
  const navigate = useBbNavigate();
  const [request, setRequest] = useState("");
  const [painting, setPainting] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const text = request.trim();
    if (text.length < 3 || painting) return;
    setPainting(true);
    setError(null);
    try {
      setThreadId((await rpc.call("paintRequest", { request: text })).threadId);
      setRequest("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setPainting(false);
    }
  };

  return (
    <Section title="Create a scene">
      <form
        className="flex h-7 items-center gap-1 rounded-md bg-foreground/5 pr-1 pl-2"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <input
          aria-label="Describe a scene for an agent to create"
          value={request}
          maxLength={400}
          placeholder="California poppies, impressionist, in the wind"
          onChange={(event) => setRequest(event.currentTarget.value)}
          className="min-w-0 flex-1 bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground/70"
        />
        <button
          type="submit"
          aria-label="Create this scene"
          title="Create this scene"
          disabled={painting || request.trim().length < 3}
          className="flex size-5 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-state-hover hover:text-foreground disabled:opacity-40"
        >
          <svg viewBox="0 0 16 16" aria-hidden="true" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3.5 8.5l3 3 6-7" />
          </svg>
        </button>
      </form>
      {threadId && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <span>An agent is creating it in a new thread.</span>
          <TextButton onClick={() => navigate.toThread(threadId)}>Open</TextButton>
        </div>
      )}
      {error && <div className="text-xs text-destructive">{error}</div>}
    </Section>
  );
}

function AmbientControls({ dismiss }: { dismiss: () => void }) {
  const rpc = useRpc<typeof ambientRpcContract>();
  const { state, summary, compileError, throttled, deviceDetail } = useAmbient();
  const [library, setLibrary] = useState<{ id: string; name: string; builtIn: boolean; tweaked: boolean }[]>([]);

  const refreshLibrary = useCallback(async () => {
    setLibrary((await rpc.call("library")).entries);
  }, [rpc]);

  useEffect(() => {
    void refreshLibrary();
  }, [refreshLibrary]);

  useRealtime("library", () => {
    void refreshLibrary();
  });

  const receive = useCallback((next: AmbientState) => ambientStore.receive(next), []);

  const sendValue = useDebouncedCall(
    useCallback(
      (id: string, value: number) => {
        void rpc.call("setValues", { values: { [id]: value } }).then(receive);
      },
      [receive, rpc],
    ),
    120,
  );

  const sendPalette = useDebouncedCall(
    useCallback(() => {
      const current = ambientStore.getSnapshot().state;
      if (current) void rpc.call("setPalette", { palette: current.scene.palette }).then(receive);
    }, [receive, rpc]),
    200,
  );

  const sendControl = useDebouncedCall(
    useCallback(
      <Key extends keyof Controls>(key: Key, value: Controls[Key]) => {
        void rpc.call("setControls", { [key]: value }).then(receive);
      },
      [receive, rpc],
    ),
    120,
  );

  const activeId = useMemo(() => {
    if (!state) return null;
    return library.find((entry) => entry.name === state.scene.name)?.id ?? null;
  }, [library, state]);

  const history = useRef<{ past: Snapshot[]; future: Snapshot[]; lastKey: string | null; lastAt: number }>({
    past: [],
    future: [],
    lastKey: null,
    lastAt: 0,
  });
  const activeIdRef = useRef(activeId);
  activeIdRef.current = activeId;
  const activeEntry = library.find((entry) => entry.id === activeId);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    setConfirmingDelete(false);
  }, [activeId]);

  useEffect(() => {
    if (!confirmingDelete) return;
    const timer = setTimeout(() => setConfirmingDelete(false), 4000);
    return () => clearTimeout(timer);
  }, [confirmingDelete]);

  const deleteActiveScene = useCallback(async () => {
    const id = activeIdRef.current;
    setConfirmingDelete(false);
    if (!id) return;
    const { deleted } = await rpc.call("deleteScene", { id });
    if (!deleted) return;
    const entry = history.current;
    entry.past = entry.past.filter((snap) => snap.sceneId !== id);
    entry.future = entry.future.filter((snap) => snap.sceneId !== id);
    const fallback = library.find((entry) => entry.builtIn);
    if (fallback) receive(await rpc.call("loadScene", { id: fallback.id }));
  }, [library, receive, rpc]);

  const snapshot = useCallback((): Snapshot | null => {
    const current = ambientStore.getSnapshot().state;
    if (!current) return null;
    return {
      sceneId: activeIdRef.current,
      values: valuesOf(current.scene.params),
      palette: [...current.scene.palette],
      controls: {
        showThrough: current.controls.showThrough,
        speed: current.controls.speed,
        glass: current.controls.glass,
        enabled: current.controls.enabled,
      },
    };
  }, []);

  const record = useCallback(
    (key: string) => {
      const entry = history.current;
      const now = Date.now();
      if (key !== entry.lastKey || now - entry.lastAt > 800) {
        const before = snapshot();
        if (before) entry.past = [...entry.past.slice(-49), before];
        entry.future = [];
      }
      entry.lastKey = key;
      entry.lastAt = now;
    },
    [snapshot],
  );

  const restore = useCallback(
    async (target: Snapshot) => {
      ambientStore.clearOverrides();
      if (target.sceneId && target.sceneId !== activeIdRef.current) {
        receive(await rpc.call("loadScene", { id: target.sceneId }));
      }
      receive(await rpc.call("setValues", { values: target.values }));
      receive(await rpc.call("setPalette", { palette: target.palette }));
      receive(await rpc.call("setControls", target.controls));
    },
    [receive, rpc],
  );

  const step = useCallback(
    (direction: "undo" | "redo") => {
      const entry = history.current;
      const source = direction === "undo" ? entry.past : entry.future;
      const target = source.at(-1);
      const current = snapshot();
      if (!target || !current) return;
      if (direction === "undo") {
        entry.past = entry.past.slice(0, -1);
        entry.future = [...entry.future, current];
      } else {
        entry.future = entry.future.slice(0, -1);
        entry.past = [...entry.past, current];
      }
      entry.lastKey = null;
      void restore(target);
    },
    [restore, snapshot],
  );

  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== "z" || event.altKey) return;
      const focus = document.activeElement;
      const inPanel = focus instanceof Node && panel.current?.contains(focus);
      if (!inPanel && focus !== document.body) return;
      if (focus instanceof HTMLInputElement && focus.type === "text") return;
      event.preventDefault();
      step(event.shiftKey ? "redo" : "undo");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step]);

  const setControl = <Key extends keyof Controls>(key: Key, value: Controls[Key]) => {
    if (key !== "quality") record(`control:${key}`);
    ambientStore.setControl(key, value);
    sendControl(key, value);
  };


  if (!state) {
    return <div className="p-3 text-xs text-muted-foreground">Loading Ambient…</div>;
  }

  const { scene, controls } = state;
  const activity =
    summary.working + summary.waiting === 0
      ? "No agents running"
      : [
          summary.working > 0 && `${summary.working} working`,
          summary.waiting > 0 && `${summary.waiting} waiting on you`,
        ]
          .filter(Boolean)
          .join(" · ");
  return (
    <div
      ref={panel}
      className="w-full space-y-3 overflow-x-hidden overflow-y-auto overscroll-contain px-3 pt-2 pb-3"
      style={{ maxHeight: "min(70vh, max(9rem, calc(100dvh - 32rem)))" }}
    >
      <style>{'[data-testid="plugin-sidebar-footer-disclosure-ambient-controls"] > div { max-height: none; overflow: visible; }'}</style>
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-sm font-medium text-foreground">Ambient</div>
          <div className="truncate text-xs text-muted-foreground">{activity}</div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <Switch
            checked={controls.enabled}
            label="Ambient background"
            onChange={(enabled) => setControl("enabled", enabled)}
          />
          <button
            type="button"
            aria-label="Close Ambient"
            title="Close"
            onClick={dismiss}
            className="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-state-hover hover:text-foreground"
          >
            <svg viewBox="0 0 16 16" aria-hidden="true" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>
        </div>
      </div>

      {compileError && (
        <pre className="max-h-24 overflow-auto whitespace-pre-wrap rounded-md border border-border p-2 text-xs text-destructive">
          {compileError}
        </pre>
      )}

      {throttled && (
        <div className="text-xs text-muted-foreground">
          This scene is heavy for this machine, so Ambient lowered its detail to keep bb responsive.
        </div>
      )}

      <Section
        title="Scene"
        action={
          activeEntry && (activeEntry.tweaked || !activeEntry.builtIn) ? (
            <div className="flex items-center">
              {activeEntry.tweaked && !confirmingDelete && (
                <TextButton
                  onClick={() => {
                    if (!activeId) return;
                    record(`reset:${Date.now()}`);
                    ambientStore.clearOverrides();
                    void rpc.call("resetScene", { id: activeId }).then(receive);
                  }}
                >
                  Reset
                </TextButton>
              )}
              {!activeEntry.builtIn &&
                (confirmingDelete ? (
                  <>
                    <TextButton onClick={() => setConfirmingDelete(false)}>Cancel</TextButton>
                    <TextButton danger onClick={() => void deleteActiveScene()}>
                      Delete scene
                    </TextButton>
                  </>
                ) : (
                  <TextButton onClick={() => setConfirmingDelete(true)}>Delete</TextButton>
                ))}
            </div>
          ) : undefined
        }
      >
        <div className="relative">
          <select
            aria-label="Scene"
            value={activeId ?? ""}
            onChange={(event) => {
              const id = event.currentTarget.value;
              if (!id || id === activeId) return;
              record(`scene:${Date.now()}`);
              void rpc.call("loadScene", { id }).then(receive);
            }}
            className="h-7 w-full cursor-pointer appearance-none truncate rounded-md bg-foreground/5 pr-7 pl-2 text-xs text-foreground outline-none transition-colors hover:bg-foreground/10 focus-visible:ring-2 focus-visible:ring-ring"
          >
            {activeId === null && <option value="">{scene.name}</option>}
            <optgroup label="Built-in">
              {library
                .filter((entry) => entry.builtIn)
                .map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.name}
                  </option>
                ))}
            </optgroup>
            {library.some((entry) => !entry.builtIn) && (
              <optgroup label="Saved">
                {library
                  .filter((entry) => !entry.builtIn)
                  .map((entry) => (
                    <option key={entry.id} value={entry.id}>
                      {entry.name}
                    </option>
                  ))}
              </optgroup>
            )}
          </select>
          <svg viewBox="0 0 16 16" aria-hidden="true" className="pointer-events-none absolute top-1/2 right-2 size-3.5 -translate-y-1/2 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 6l4 4 4-4" />
          </svg>
        </div>
        <div className="flex h-7 items-center justify-between">
          <span className="text-xs text-muted-foreground">Colors</span>
          <div className="flex items-center gap-1.5" aria-label="Palette">
            {scene.palette.map((color, index) => (
              <label
                key={index}
                className="relative h-6 w-7 cursor-pointer overflow-hidden rounded-md border border-foreground/20 shadow-[0_1px_2px_color-mix(in_oklab,var(--ink)_30%,transparent),inset_0_1px_0_color-mix(in_oklab,var(--canvas)_35%,transparent)] transition-[transform,box-shadow] duration-150 hover:-translate-y-px hover:ring-2 hover:ring-foreground/25 active:translate-y-0 focus-within:ring-2 focus-within:ring-ring"
                style={{ backgroundColor: color }}
                title={`Change color ${index + 1} (${color})`}
              >
                <input
                  type="color"
                  value={color}
                  aria-label={`Palette color ${index + 1}`}
                  className="absolute inset-0 size-full cursor-pointer opacity-0"
                  onChange={(event) => {
                    record(`palette:${index}`);
                    ambientStore.setPaletteColor(index, event.currentTarget.value);
                    sendPalette();
                  }}
                />
              </label>
            ))}
          </div>
        </div>
      </Section>

      <div className="space-y-1">
        {scene.params.map((entry) => (
          <Slider
            key={entry.id}
            label={entry.label}
            value={entry.value}
            min={entry.min}
            max={entry.max}
            step={entry.step}
            onChange={(value) => {
              record(`value:${entry.id}`);
              ambientStore.setValue(entry.id, value);
              sendValue(entry.id, value);
            }}
          />
        ))}
      </div>

      <Section title="Display">
        <Slider
          label="Visibility"
          hint="How much of the scene shows through bb"
          value={controls.showThrough}
          min={0}
          max={0.8}
          step={0.01}
          format={(value) => `${Math.round(value * 100)}%`}
          onChange={(value) => setControl("showThrough", value)}
        />
        <Slider
          label="Motion"
          hint="How fast the scene moves"
          value={controls.speed}
          min={0}
          max={4}
          step={0.05}
          format={(value) => `${value.toFixed(1)}×`}
          onChange={(value) => setControl("speed", value)}
        />
        <Slider
          label="Detail"
          hint="Render resolution on this device; lower is softer and uses less GPU"
          value={deviceDetail ?? controls.quality}
          min={0.2}
          max={1}
          step={0.05}
          format={(value) => `${Math.round(value * 100)}%`}
          onChange={(value) => ambientStore.setDeviceDetail(value)}
        />
        <Slider
          label="Glass opacity"
          hint="How solid the glass behind text is; lower lets more of the scene through"
          value={controls.glass}
          min={0.2}
          max={0.6}
          step={0.01}
          format={(value) => `${Math.round(value * 100)}%`}
          onChange={(value) => setControl("glass", value)}
        />
      </Section>

      <div className="flex h-6 items-center justify-between gap-1 whitespace-nowrap">
        <h3 className="shrink-0 text-xs font-medium text-foreground/70">When an agent</h3>
        <div className="flex min-w-0 gap-0">
          {RIPPLE_BUTTONS.map((button) => (
            <button
              key={button.kind}
              type="button"
              title={button.hint}
              onClick={() => ambientStore.requestRipple(button.kind)}
              className="flex shrink-0 items-center gap-1 rounded-full px-1 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"
            >
              <span className={`size-1.5 rounded-full ${button.dot}`} />
              {button.label}
            </button>
          ))}
        </div>
      </div>

      <PaintRequestRow />

      <DailySceneRow />
    </div>
  );
}

export default definePluginApp((app) => {
  app.slots.experimental_appOverlay({ id: "ambient", component: AmbientOverlay });
  app.experimental_sidebarFooter.register({
    kind: "disclosure",
    id: "controls",
    label: "Ambient",
    icon: "ambient/ambient",
    component: AmbientControls,
  });
});
