import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  definePluginApp,
  experimental_useSidebarThreads,
  useRealtime,
  useRealtimeConnectionState,
  useRpc,
} from "@get-bb/plugin-sdk/app";

import { ActivityField, signalsOf } from "./activity.js";
import { AmbientRenderer, motionBetween, type FrameInput, type ThemeColors } from "./engine.js";
import { DEFAULT_SCENE, type Controls, type RippleKind, type SceneParam } from "./scene.js";
import type { AmbientState, CaptureRequest, DailyScene, ambientRpcContract } from "./server.js";
import { ambientStore, useAmbient } from "./store.js";

const FRAME_INTERVAL_MS = 1000 / 30;
const SLOW_FRAME_MS = 60;
const FAST_FRAME_MS = 40;
const STALLED_FRAME_INTERVAL_MS = 250;
const MIN_AUTO_SCALE = 0.25;
const CAPTURE_DELAY_MS = 900;
const MOTION_SAMPLE_MS = 1000;
const BENCHMARK_FRAMES = 6;
const VEIL_STYLE_ID = "bb-ambient-veil";

function veilCss(showThrough: number): string {
  const keep = Math.round((1 - showThrough) * 1000) / 10;
  return `html.bb-app-shell-root { background-color: var(--canvas); }
body.bb-app-shell { background-color: transparent; --ambient-background: var(--background); --ambient-sidebar: var(--sidebar); }
body.bb-app-shell > #root { --background: color-mix(in oklab, var(--ambient-background) ${keep}%, transparent); --sidebar: color-mix(in oklab, var(--ambient-sidebar) ${keep}%, transparent); }
body.bb-app-shell > #root .bg-sidebar .bg-sidebar { --sidebar: transparent; }
body.bb-app-shell > #root [data-sidebar="panel"][data-vaul-drawer-direction][data-state="closed"]:not([data-vaul-animate]) { visibility: hidden; transition: visibility 0s linear 260ms; }
body.bb-app-shell > #root [data-sidebar-sticky-stack]::before, body.bb-app-shell > #root [data-sidebar-sticky-tier] { -webkit-backdrop-filter: blur(12px); backdrop-filter: blur(12px); }`;
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
    canvas.addEventListener("webglcontextlost", lost);
    return () => {
      canvas.removeEventListener("webglcontextlost", lost);
      renderer.dispose();
      rendererRef.current = null;
    };
  }, [canvas]);

  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer || !state) return;
    if (compiledRevision.current !== state.sceneRevision) {
      compiledRevision.current = state.sceneRevision;
      const result = renderer.compile(state.scene);
      if (result.ok) {
        ambientStore.setCompileError(null);
      } else {
        ambientStore.setCompileError(result.log);
        if (!renderer.compile(DEFAULT_SCENE).ok) return;
      }
      void rpc
        .call("reportCompile", {
          sceneRevision: state.sceneRevision,
          ok: result.ok,
          ...(result.ok ? {} : { log: result.log.slice(0, 8_000) }),
        })
        .catch(() => undefined);
    }
    renderer.setPalette(state.scene.palette);
    renderer.setParamValues(valuesOf(state.scene.params));
  }, [canvas, rpc, state]);

  const autoScaleRef = useRef(1);

  const frameInput = useCallback(
    (clock: { time: number }): FrameInput => ({
      time: clock.time,
      frame: fieldRef.current.step(performance.now() / 1000),
      pointer: liveRef.current.pointer,
      theme: liveRef.current.theme,
    }),
    [],
  );

  const renderFrame = useCallback(
    (clock: { time: number }) => {
      const renderer = rendererRef.current;
      const current = liveRef.current.state;
      if (!renderer || !current) return;
      renderer.resize(current.controls.quality * autoScaleRef.current);
      renderer.render(frameInput(clock));
      ambientStore.setSummary(fieldRef.current.summary());
    },
    [frameInput],
  );

  const clockRef = useRef({ time: 0 });

  useEffect(() => {
    if (!enabled || !canvas) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let last = performance.now();
    let average = FRAME_INTERVAL_MS;
    let lastAdjust = last;
    const loop = (timestamp: number) => {
      frame = requestAnimationFrame(loop);
      if (document.hidden) {
        last = timestamp;
        return;
      }
      const elapsed = timestamp - last;
      const stalled = autoScaleRef.current <= MIN_AUTO_SCALE && average > SLOW_FRAME_MS * 2;
      if (elapsed < (stalled ? STALLED_FRAME_INTERVAL_MS : FRAME_INTERVAL_MS)) return;
      last = timestamp;
      average = average * 0.9 + Math.min(elapsed, 1000) * 0.1;
      if (average > SLOW_FRAME_MS && timestamp - lastAdjust > 1500 && autoScaleRef.current > MIN_AUTO_SCALE) {
        autoScaleRef.current = Math.max(MIN_AUTO_SCALE, autoScaleRef.current * 0.7);
        lastAdjust = timestamp;
      } else if (average < FAST_FRAME_MS && timestamp - lastAdjust > 8000 && autoScaleRef.current < 1) {
        autoScaleRef.current = Math.min(1, autoScaleRef.current / 0.85);
        lastAdjust = timestamp;
      }
      ambientStore.setThrottled(autoScaleRef.current < 1);
      const speed = liveRef.current.state?.controls.speed ?? 1;
      clockRef.current.time +=
        (Math.min(elapsed, 250) / 1000) * speed * (reducedMotion.matches ? 0.25 : 1);
      renderFrame(clockRef.current);
    };
    frame = requestAnimationFrame(loop);
    const move = (event: PointerEvent) => {
      liveRef.current.pointer = [
        event.clientX / window.innerWidth,
        1 - event.clientY / window.innerHeight,
      ];
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", move);
    };
  }, [canvas, enabled, renderFrame]);

  useRealtime("capture", (payload) => {
    const request = payload as CaptureRequest;
    const renderer = rendererRef.current;
    if (!renderer || typeof request?.requestId !== "string") return;
    if (request.ripple) ambientStore.requestRipple(request.ripple);
    window.setTimeout(
      () => {
        renderFrame(clockRef.current);
        const before = renderer.capture(960, liveRef.current.theme.canvas, { encode: false });
        window.setTimeout(() => {
          renderFrame(clockRef.current);
          const { theme } = liveRef.current;
          const after = renderer.capture(960, theme.canvas, { encode: true });
          const frameMs = renderer.benchmark(frameInput(clockRef.current), BENCHMARK_FRAMES);
          void rpc
            .call("submitCapture", {
              requestId: request.requestId,
              dataUrl: after.dataUrl,
              summary: fieldRef.current.summary(),
              visibility: {
                ...after.visibility,
                motion: motionBetween(before, after),
                frameMs: Math.min(frameMs, 10_000),
                detail: (liveRef.current.state?.controls.quality ?? 1) * autoScaleRef.current,
              },
              dark: theme.dark,
            })
            .catch(() => undefined);
        }, MOTION_SAMPLE_MS);
      },
      request.ripple ? CAPTURE_DELAY_MS : 0,
    );
  });

  const showThrough = state?.controls.showThrough ?? 0;
  useEffect(() => {
    if (!enabled) return;
    const style = document.createElement("style");
    style.id = VEIL_STYLE_ID;
    style.textContent = veilCss(showThrough);
    document.head.append(style);
    return () => style.remove();
  }, [enabled, showThrough]);

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
    <div className="grid h-6 grid-cols-[5.75rem_1fr_2.25rem] items-center gap-2" title={hint}>
      <span className="truncate text-xs text-muted-foreground">{label}</span>
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
        <div className="h-0.5 w-full rounded-full bg-foreground/15" />
        <div
          className="absolute left-0 h-0.5 rounded-full bg-foreground/60"
          style={{ width: `${fraction * 100}%` }}
        />
        <div
          className="absolute size-2.5 -translate-x-1/2 rounded-full bg-foreground shadow-sm transition-transform group-hover:scale-125 group-focus-visible:ring-2 group-focus-visible:ring-ring"
          style={{ left: `${fraction * 100}%` }}
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

const RIPPLE_BUTTONS: { kind: RippleKind; label: string; dot: string }[] = [
  { kind: "started", label: "Start", dot: "bg-foreground/50" },
  { kind: "done", label: "Done", dot: "bg-foreground" },
  { kind: "error", label: "Error", dot: "bg-destructive" },
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
  disabled,
  onClick,
}: {
  children: ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="rounded-full px-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
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
        className={`absolute top-0.5 left-0.5 size-3 rounded-full bg-background shadow-sm transition-transform ${checked ? "translate-x-3" : "translate-x-0"}`}
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
  const [painting, setPainting] = useState(false);

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
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      }),
    );
  };

  return (
    <Section
      title="New scene every morning"
      action={
        <Switch
          checked={daily.enabled}
          label="New scene every morning"
          onChange={(enabled) => void update({ enabled })}
        />
      }
    >
      <div className="flex h-6 items-center gap-1 text-xs text-muted-foreground">
        <span>An agent paints one after</span>
        <select
          aria-label="Daily scene hour"
          value={daily.hour}
          onChange={(event) => void update({ hour: Number(event.currentTarget.value) })}
          className="cursor-pointer appearance-none rounded bg-transparent px-0.5 text-xs text-foreground underline decoration-foreground/30 underline-offset-2 outline-none"
        >
          {Array.from({ length: 24 }, (_, hour) => (
            <option key={hour} value={hour}>
              {hourLabel(hour)}
            </option>
          ))}
        </select>
        <span className="ml-auto">
          <TextButton
            disabled={painting}
            onClick={async () => {
              setPainting(true);
              try {
                await rpc.call("paintNow");
                await refresh();
              } finally {
                setPainting(false);
              }
            }}
          >
            {painting ? "Starting…" : "Paint now"}
          </TextButton>
        </span>
      </div>
    </Section>
  );
}

function AmbientControls() {
  const rpc = useRpc<typeof ambientRpcContract>();
  const { state, summary, compileError, throttled } = useAmbient();
  const [library, setLibrary] = useState<{ id: string; name: string; builtIn: boolean }[]>([]);
  const [saving, setSaving] = useState(false);

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

  const setControl = <Key extends keyof Controls>(key: Key, value: Controls[Key]) => {
    ambientStore.setControl(key, value);
    sendControl(key, value);
  };

  const activeId = useMemo(() => {
    if (!state) return null;
    return library.find((entry) => entry.name === state.scene.name)?.id ?? null;
  }, [library, state]);

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
    <div className="max-h-[70vh] w-full space-y-3 overflow-y-auto px-3 pt-2 pb-3">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-sm font-medium text-foreground">Ambient</div>
          <div className="truncate text-xs text-muted-foreground">{activity}</div>
        </div>
        <Switch
          checked={controls.enabled}
          label="Ambient background"
          onChange={(enabled) => setControl("enabled", enabled)}
        />
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
          <TextButton
            disabled={saving}
            onClick={async () => {
              setSaving(true);
              try {
                await rpc.call("saveScene", {});
                await refreshLibrary();
              } finally {
                setSaving(false);
              }
            }}
          >
            {saving ? "Saving…" : "Save"}
          </TextButton>
        }
      >
        <div className="flex flex-wrap gap-1">
          {library.map((entry) => (
            <button
              key={entry.id}
              type="button"
              onClick={() => void rpc.call("loadScene", { id: entry.id }).then(receive)}
              className={`max-w-full truncate rounded-full px-2.5 py-0.5 text-xs transition-colors ${entry.id === activeId ? "bg-foreground text-background" : "text-muted-foreground hover:bg-foreground/10 hover:text-foreground"}`}
            >
              {entry.name}
            </button>
          ))}
        </div>
      </Section>

      <Section
        title={scene.name}
        action={
          <div className="flex items-center gap-1" aria-label="Palette">
            {scene.palette.map((color, index) => (
              <label
                key={index}
                className="relative size-3.5 cursor-pointer overflow-hidden rounded-full ring-1 ring-foreground/15 transition-transform hover:scale-125"
                style={{ backgroundColor: color }}
                title={`Color ${index + 1}: ${color}`}
              >
                <input
                  type="color"
                  value={color}
                  aria-label={`Palette color ${index + 1}`}
                  className="absolute inset-0 size-full cursor-pointer opacity-0"
                  onChange={(event) => {
                    ambientStore.setPaletteColor(index, event.currentTarget.value);
                    sendPalette();
                  }}
                />
              </label>
            ))}
          </div>
        }
      >
        {scene.params.map((entry) => (
          <Slider
            key={entry.id}
            label={entry.label}
            value={entry.value}
            min={entry.min}
            max={entry.max}
            step={entry.step}
            onChange={(value) => {
              ambientStore.setValue(entry.id, value);
              sendValue(entry.id, value);
            }}
          />
        ))}
      </Section>

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
          hint="Render resolution; lower is softer and uses less GPU"
          value={controls.quality}
          min={0.2}
          max={1}
          step={0.05}
          format={(value) => `${Math.round(value * 100)}%`}
          onChange={(value) => setControl("quality", value)}
        />
      </Section>

      <Section title="Preview a ripple">
        <div className="flex gap-1">
          {RIPPLE_BUTTONS.map((button) => (
            <button
              key={button.kind}
              type="button"
              onClick={() => ambientStore.requestRipple(button.kind)}
              className="flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"
            >
              <span className={`size-1.5 rounded-full ${button.dot}`} />
              {button.label}
            </button>
          ))}
        </div>
      </Section>

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
    icon: "Sparkles",
    component: AmbientControls,
  });
});
