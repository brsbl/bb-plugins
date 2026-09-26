import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
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
import { captureScene } from "./capture.js";
import {
  CONTROL_SPECS,
  DETAIL,
  FALLBACK_SCENE,
  type Controls,
  type RippleKind,
  type SceneParam,
} from "./contract.js";
import { AmbientRenderer, releaseContext, type CompileResult, type FrameInput, type ThemeColors } from "./engine.js";
import { colorParser } from "./pixels.js";
import type { AmbientState, CaptureRequest, DailyScene, ambientRpcContract } from "./rpc.js";
import { FrameScheduler, MIN_AUTO_SCALE } from "./scheduler.js";
import { ambientStore, useAmbient } from "./store.js";
import { applyVeil, glassTier, mountVeil } from "./veil.js";

const HEARTBEAT_MS = 60_000;
const REJECT_FRAME_MS = 50;
const QUARANTINE_KEY = "bb-ambient:quarantine";
const MAX_QUARANTINED = 20;
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

interface Snapshot {
  sceneId: string | null;
  values: Record<string, number>;
  palette: [string, string, string, string];
  controls: Controls;
}

function valuesOf(params: readonly SceneParam[]): Record<string, number> {
  return Object.fromEntries(params.map((entry) => [entry.id, entry.value]));
}

// Scenes that reset or stalled the GPU this session. They are not drawn again until the user
// picks a scene, so a bad shader can't wedge the GPU on every reload.
function sourceKey(source: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < source.length; index += 1) {
    hash = Math.imul(hash ^ source.charCodeAt(index), 0x01000193);
  }
  return `${(hash >>> 0).toString(16)}:${source.length}`;
}

function readQuarantine(): string[] {
  try {
    const parsed: unknown = JSON.parse(window.sessionStorage.getItem(QUARANTINE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((entry): entry is string => typeof entry === "string") : [];
  } catch {
    return [];
  }
}

function isQuarantined(source: string): boolean {
  return readQuarantine().includes(sourceKey(source));
}

function quarantine(source: string): void {
  const key = sourceKey(source);
  const keys = readQuarantine().filter((entry) => entry !== key);
  try {
    window.sessionStorage.setItem(QUARANTINE_KEY, JSON.stringify([...keys, key].slice(-MAX_QUARANTINED)));
  } catch {}
}

function clearQuarantine(): void {
  try {
    window.sessionStorage.removeItem(QUARANTINE_KEY);
  } catch {}
}

function AmbientOverlay() {
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
    const request = payload as CaptureRequest;
    const renderer = rendererRef.current;
    if (
      !renderer ||
      !canvas ||
      document.hidden ||
      renderer.isContextLost() ||
      typeof request?.requestId !== "string"
    ) {
      return;
    }
    void captureScene(request, {
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

/** Debounces per first argument. Calls still pending when the panel closes are sent, not dropped. */
function useDebouncedCall<Args extends unknown[]>(
  call: (...args: Args) => void,
  delay: number,
): (...args: Args) => void {
  const pending = useRef(new Map<string, { timer: number; args: Args }>());
  const callRef = useRef(call);
  callRef.current = call;
  useEffect(() => {
    const calls = pending.current;
    return () => {
      for (const { timer, args } of calls.values()) {
        window.clearTimeout(timer);
        callRef.current(...args);
      }
      calls.clear();
    };
  }, []);
  return useCallback(
    (...args: Args) => {
      const key = String(args[0]);
      const existing = pending.current.get(key);
      if (existing) window.clearTimeout(existing.timer);
      pending.current.set(key, {
        args,
        timer: window.setTimeout(() => {
          pending.current.delete(key);
          callRef.current(...args);
        }, delay),
      });
    },
    [delay],
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

const THEME_KEY = "bb.theme";
type ThemeMode = "light" | "dark" | "system";
const THEME_MODES: { mode: ThemeMode; label: string; icon: ReactNode }[] = [
  {
    mode: "light",
    label: "Light",
    icon: (
      <>
        <circle cx="8" cy="8" r="2.75" />
        <path d="M8 1.75v1.5M8 12.75v1.5M1.75 8h1.5M12.75 8h1.5M3.6 3.6l1.05 1.05M11.35 11.35l1.05 1.05M3.6 12.4l1.05-1.05M11.35 4.65l1.05-1.05" />
      </>
    ),
  },
  { mode: "dark", label: "Dark", icon: <path d="M13.25 9.6A5.5 5.5 0 1 1 6.4 2.75a4.5 4.5 0 0 0 6.85 6.85z" /> },
  {
    mode: "system",
    label: "System",
    icon: (
      <>
        <rect x="2" y="3" width="12" height="8" rx="1.5" />
        <path d="M6 13.5h4M8 11v2.5" />
      </>
    ),
  },
];

function readThemeMode(): ThemeMode {
  const stored = localStorage.getItem(THEME_KEY);
  return stored === "light" || stored === "dark" ? stored : "system";
}

function ThemeModeSwitch() {
  const [mode, setMode] = useState<ThemeMode>(readThemeMode);

  useEffect(() => {
    const sync = () => setMode(readThemeMode());
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    window.addEventListener("storage", sync);
    return () => {
      observer.disconnect();
      window.removeEventListener("storage", sync);
    };
  }, []);

  const choose = (next: ThemeMode) => {
    const previous = localStorage.getItem(THEME_KEY);
    localStorage.setItem(THEME_KEY, next);
    window.dispatchEvent(
      new StorageEvent("storage", { key: THEME_KEY, oldValue: previous, newValue: next, storageArea: localStorage }),
    );
    setMode(next);
  };

  return (
    <div role="radiogroup" aria-label="Appearance" className="flex items-center gap-px rounded-full bg-foreground/5 p-px">
      {THEME_MODES.map((entry) => (
        <button
          key={entry.mode}
          type="button"
          role="radio"
          aria-checked={mode === entry.mode}
          aria-label={entry.label}
          title={entry.label}
          onClick={() => choose(entry.mode)}
          className={`flex size-5 items-center justify-center rounded-full transition-colors ${
            mode === entry.mode ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <svg viewBox="0 0 16 16" aria-hidden="true" className="size-3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            {entry.icon}
          </svg>
        </button>
      ))}
    </div>
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
  const [error, setError] = useState<string | null>(null);

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
    const previous = daily;
    setDaily({ ...daily, ...next });
    setError(null);
    try {
      setDaily(
        await rpc.call("setDaily", {
          ...next,
          ...(next.enabled ? { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone } : {}),
        }),
      );
    } catch (caught) {
      setDaily(previous);
      setError(caught instanceof Error ? caught.message : String(caught));
    }
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
      {error && <div className="text-xs text-destructive">{error}</div>}
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

  const ref = state?.ref ?? null;
  const activeId =
    ref && library.some((entry) => entry.id === ref.id && entry.builtIn === (ref.kind === "builtIn")) ? ref.id : null;

  const history = useRef<{ past: Snapshot[]; future: Snapshot[]; lastKey: string | null; lastAt: number }>({
    past: [],
    future: [],
    lastKey: null,
    lastAt: 0,
  });
  const activeIdRef = useRef(activeId);
  activeIdRef.current = activeId;
  const activeEntry = library.find((entry) => entry.id === activeId);
  const [confirming, setConfirming] = useState<"reset" | "delete" | null>(null);

  useEffect(() => {
    setConfirming(null);
  }, [activeId]);

  useEffect(() => {
    if (!confirming) return;
    const timer = setTimeout(() => setConfirming(null), 4000);
    return () => clearTimeout(timer);
  }, [confirming]);

  const deleteActiveScene = useCallback(async () => {
    const id = activeIdRef.current;
    setConfirming(null);
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
      controls: { ...current.controls },
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
      let current = ambientStore.getSnapshot().state;
      if (target.sceneId && target.sceneId !== activeIdRef.current) {
        current = await rpc.call("loadScene", { id: target.sceneId });
        receive(current);
      }
      // Only values the scene on screen still has; a scene can change its params between snapshots.
      const ids = new Set(current?.scene.params.map((entry) => entry.id));
      const values = Object.fromEntries(Object.entries(target.values).filter(([id]) => ids.has(id)));
      if (Object.keys(values).length > 0) receive(await rpc.call("setValues", { values }));
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
    record(`control:${key}`);
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
      style={{ maxHeight: "min(70vh, max(9rem, calc(100dvh - var(--ambient-panel-reserve, 32rem))))" }}
    >
      <style>{'[data-testid="plugin-sidebar-footer-disclosure-ambient-controls"] > div { max-height: none; overflow: visible; } @media (max-width: 767px) { [data-testid="plugin-sidebar-footer-disclosure-ambient-controls"] { --ambient-panel-reserve: 36rem; } }'}</style>
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
              {confirming ? (
                <>
                  <TextButton onClick={() => setConfirming(null)}>Cancel</TextButton>
                  {confirming === "reset" ? (
                    <TextButton
                      danger
                      onClick={() => {
                        setConfirming(null);
                        if (!activeId) return;
                        record(`reset:${Date.now()}`);
                        ambientStore.clearOverrides();
                        void rpc.call("resetScene", { id: activeId }).then(receive);
                      }}
                    >
                      Reset scene
                    </TextButton>
                  ) : (
                    <TextButton danger onClick={() => void deleteActiveScene()}>
                      Delete scene
                    </TextButton>
                  )}
                </>
              ) : (
                <>
                  {activeEntry.tweaked && <TextButton onClick={() => setConfirming("reset")}>Reset</TextButton>}
                  {!activeEntry.builtIn && <TextButton onClick={() => setConfirming("delete")}>Delete</TextButton>}
                </>
              )}
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
              clearQuarantine();
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

      <Section title="Display" action={<ThemeModeSwitch />}>
        {CONTROL_SPECS.map((spec) => (
          <Slider
            key={spec.key}
            label={spec.label}
            hint={spec.hint}
            value={controls[spec.key]}
            min={spec.min}
            max={spec.max}
            step={spec.step}
            format={spec.format}
            onChange={(value) => setControl(spec.key, value)}
          />
        ))}
        <Slider
          label={DETAIL.label}
          hint={DETAIL.hint}
          value={deviceDetail}
          min={DETAIL.min}
          max={DETAIL.max}
          step={DETAIL.step}
          format={DETAIL.format}
          onChange={(value) => ambientStore.setDeviceDetail(value)}
        />
      </Section>

      <div className="flex min-h-6 flex-wrap items-center justify-between gap-x-1 gap-y-0.5 whitespace-nowrap">
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
