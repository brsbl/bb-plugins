import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  experimental_useSidebarThreads,
  useRealtime,
  useRealtimeConnectionState,
  useRpc,
} from "@get-bb/plugin-sdk/app";

import { ActivityField, signalsOf } from "./activity.js";
import { captureScene } from "./capture.js";
import { FALLBACK_SCENE, valuesOf } from "./contract.js";
import { AmbientRenderer, releaseContext, type CompileResult, type FrameInput, type ThemeColors } from "./engine.js";
import { colorParser } from "./pixels.js";
import { isQuarantined, quarantine } from "./quarantine.js";
import { captureRequestSchema, type ambientRpcContract } from "./rpc.js";
import { FrameScheduler, MIN_AUTO_SCALE } from "./scheduler.js";
import { ambientStore, useAmbient } from "./store.js";
import { applyVeil, glassTier, mountVeil } from "./veil.js";

const HEARTBEAT_MS = 60_000;
const REJECT_FRAME_MS = 50;
const QUARANTINE_LOG =
  "Ambient stopped drawing this scene because it reset or stalled the GPU. It stays off until you pick a scene again.";

let parseColor: ReturnType<typeof colorParser> | null = null;

function readThemeColors(): ThemeColors {
  const parse = (parseColor ??= colorParser());
  const styles = getComputedStyle(document.documentElement);
  const read = (name: string, fallback: [number, number, number]): [number, number, number] => {
    const value = styles.getPropertyValue(name).trim();
    if (!value) return fallback;
    const [r, g, b] = parse(value);
    return [r, g, b];
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

/** The scene canvas behind bb, and everything that decides when and how it draws. */
export function AmbientOverlay() {
  const rpc = useRpc<typeof ambientRpcContract>();
  const connection = useRealtimeConnectionState();
  const { status, threads } = experimental_useSidebarThreads();
  const { state, deviceDetail } = useAmbient();
  const theme = useThemeColors();
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);
  const [rendererEpoch, setRendererEpoch] = useState(0);
  const rendererRef = useRef<AmbientRenderer | null>(null);
  const fieldRef = useRef(new ActivityField());
  const compiledRevision = useRef<number | null>(null);
  /** The scene source on screen, or null while the fallback is drawn. */
  const drawingRef = useRef<string | null>(null);
  const ripplesRef = useRef(0);
  const liveRef = useRef({ state, theme, pointer: [0.5, 0.5] as [number, number] });
  liveRef.current.state = state;
  liveRef.current.theme = theme;

  const frameInput = useCallback((time: number): FrameInput => {
    const frame = fieldRef.current.step(performance.now() / 1000);
    ripplesRef.current = frame.rippleCount;
    return { time, frame, pointer: liveRef.current.pointer, theme: liveRef.current.theme };
  }, []);

  const schedulerRef = useRef<FrameScheduler | null>(null);
  const detail = useCallback(
    () => ambientStore.getSnapshot().deviceDetail * (schedulerRef.current?.autoScale ?? 1),
    [],
  );

  const syncVeil = useCallback(() => {
    const controls = liveRef.current.state?.controls;
    if (!controls?.enabled) return;
    applyVeil({ showThrough: controls.showThrough, glass: controls.glass, tier: glassTier(detail()) });
  }, [detail]);

  const scheduler = (schedulerRef.current ??= new FrameScheduler({
    draw: (time) => {
      const renderer = rendererRef.current;
      if (!renderer || !liveRef.current.state) return;
      renderer.resize(detail());
      renderer.render(frameInput(time));
      ambientStore.setSummary(fieldRef.current.summary());
    },
    speed: () => liveRef.current.state?.controls.speed ?? 1,
    busy: () => ambientStore.getSnapshot().summary.working > 0,
    rippling: () => ripplesRef.current > 0,
    settled: () => liveRef.current.state?.controls.speed === 0 && fieldRef.current.quiet(),
    onScale: (scale) => {
      ambientStore.setThrottled(scale < 1);
      syncVeil();
    },
  }));

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
    scheduler.wake();
  }, [scheduler, status, threads]);

  useEffect(
    () =>
      ambientStore.onRipple((kind) => {
        fieldRef.current.rippleAtRandomAgent(performance.now() / 1000, kind);
        scheduler.wake();
      }),
    [scheduler],
  );

  const enabled = state?.controls.enabled ?? false;

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
    const lost = (event: Event) => {
      event.preventDefault();
      // A visible page losing its context while drawing a scene points at the scene.
      if (drawingRef.current !== null && !document.hidden) quarantine(drawingRef.current);
      drawingRef.current = null;
    };
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

  // Declared after the renderer effect so its listeners are gone first: releasing fires webglcontextlost.
  useEffect(() => {
    if (!canvas) return;
    return () => releaseContext(canvas);
  }, [canvas]);

  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer || !state) return;
    if (compiledRevision.current === state.sceneRevision) {
      if (drawingRef.current !== null) {
        renderer.setPalette(state.scene.palette);
        renderer.setParamValues(valuesOf(state.scene.params));
      }
      scheduler.wake();
      return;
    }
    const revision = state.sceneRevision;
    const scene = state.scene;
    compiledRevision.current = revision;
    void (async () => {
      let result: CompileResult = isQuarantined(scene.source)
        ? { ok: false, log: QUARANTINE_LOG }
        : await renderer.compile(scene);
      if (result.ok === "superseded" || compiledRevision.current !== revision) return;
      if (result.ok === true) {
        renderer.setPalette(scene.palette);
        renderer.setParamValues(valuesOf(scene.params));
        renderer.resize(ambientStore.getSnapshot().deviceDetail);
        const fullDetailMs = renderer.estimateFrameMs(frameInput(scheduler.time));
        const lowestDetailMs = fullDetailMs * MIN_AUTO_SCALE * MIN_AUTO_SCALE;
        if (lowestDetailMs > REJECT_FRAME_MS) {
          quarantine(scene.source);
          result = {
            ok: false,
            log: `Too heavy: about ${Math.round(fullDetailMs)} ms per frame, and still ${Math.round(lowestDetailMs)} ms at the lowest detail. Frames must render in a few milliseconds; use fewer loop iterations and fbm octaves.`,
          };
        } else {
          scheduler.calibrate(fullDetailMs);
        }
      }
      if (result.ok === true) {
        drawingRef.current = scene.source;
        ambientStore.setCompileError(null);
      } else if (result.ok === false) {
        drawingRef.current = null;
        scheduler.resetScale();
        ambientStore.setCompileError(result.log);
        const fallback = await renderer.compile(FALLBACK_SCENE);
        if (fallback.ok !== true || compiledRevision.current !== revision) return;
        renderer.setPalette(FALLBACK_SCENE.palette);
        renderer.setParamValues({});
      }
      scheduler.wake();
      if (document.hidden || renderer.isContextLost()) return;
      void rpc
        .call("reportCompile", {
          sceneRevision: revision,
          ok: result.ok === true,
          ...(result.ok === false ? { log: result.log.slice(0, 8_000) } : {}),
        })
        .catch(() => undefined);
    })();
  }, [canvas, frameInput, rendererEpoch, rpc, scheduler, state]);

  useEffect(() => {
    scheduler.wake();
  }, [scheduler, theme, deviceDetail]);

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
    const stop = scheduler.start();
    const move = (event: PointerEvent) => {
      liveRef.current.pointer = [event.clientX / window.innerWidth, 1 - event.clientY / window.innerHeight];
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => {
      stop();
      window.removeEventListener("pointermove", move);
    };
  }, [canvas, enabled, scheduler]);

  useRealtime("capture", (payload) => {
    const request = captureRequestSchema.safeParse(payload);
    const renderer = rendererRef.current;
    if (!request.success || !renderer || !canvas || document.hidden || renderer.isContextLost()) return;
    void captureScene(request.data, {
      renderer,
      canvas,
      renderNow: () => scheduler.renderNow(),
      ripple: (kind) => ambientStore.requestRipple(kind),
      theme: () => liveRef.current.theme,
      summary: () => fieldRef.current.summary(),
      frameMs: () => renderer.estimateFrameMs(frameInput(scheduler.time)),
      detail,
    })
      .then((submission) => rpc.call("submitCapture", submission))
      .catch(() => undefined);
  });

  const showThrough = state?.controls.showThrough;
  const glass = state?.controls.glass;
  useEffect(() => {
    if (enabled) return mountVeil();
  }, [enabled]);
  useEffect(() => {
    syncVeil();
  }, [enabled, showThrough, glass, deviceDetail, syncVeil]);

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
