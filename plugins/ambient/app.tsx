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
import { AmbientRenderer, type ThemeColors } from "./engine.js";
import { DEFAULT_SCENE, type Controls, type RippleKind, type SceneParam } from "./scene.js";
import type { AmbientState, CaptureRequest, DailyScene, ambientRpcContract } from "./server.js";
import { ambientStore, useAmbient } from "./store.js";

const FRAME_INTERVAL_MS = 1000 / 30;
const CAPTURE_DELAY_MS = 900;
const VEIL_STYLE_ID = "bb-ambient-veil";

function veilCss(showThrough: number): string {
  const keep = Math.round((1 - showThrough) * 1000) / 10;
  return `html.bb-app-shell-root { background-color: var(--canvas); }
body.bb-app-shell { background-color: transparent; --ambient-background: var(--background); --ambient-sidebar: var(--sidebar); }
body.bb-app-shell > #root { --background: color-mix(in oklab, var(--ambient-background) ${keep}%, transparent); --sidebar: color-mix(in oklab, var(--ambient-sidebar) ${keep}%, transparent); }
body.bb-app-shell > #root .bg-sidebar .bg-sidebar { --sidebar: transparent; }
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

  const renderFrame = useCallback((clock: { time: number }) => {
    const renderer = rendererRef.current;
    const current = liveRef.current.state;
    if (!renderer || !current) return;
    const field = fieldRef.current;
    renderer.resize(current.controls.quality);
    renderer.render({
      time: clock.time,
      frame: field.step(performance.now() / 1000),
      pointer: liveRef.current.pointer,
      theme: liveRef.current.theme,
    });
    ambientStore.setSummary(field.summary());
  }, []);

  const clockRef = useRef({ time: 0 });

  useEffect(() => {
    if (!enabled || !canvas) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let last = performance.now();
    const loop = (timestamp: number) => {
      frame = requestAnimationFrame(loop);
      if (document.hidden) {
        last = timestamp;
        return;
      }
      const elapsed = timestamp - last;
      if (elapsed < FRAME_INTERVAL_MS) return;
      last = timestamp;
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
        const { theme } = liveRef.current;
        const { dataUrl, visibility } = renderer.capture(960, theme.canvas);
        void rpc
          .call("submitCapture", {
            requestId: request.requestId,
            dataUrl,
            summary: fieldRef.current.summary(),
            visibility,
            dark: theme.dark,
          })
          .catch(() => undefined);
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

function Slider({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format?: (value: number) => string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="grid grid-cols-[1fr_auto] items-center gap-x-2 gap-y-1">
      <span className="truncate text-xs text-muted-foreground">{label}</span>
      <span className="text-xs tabular-nums text-muted-foreground">
        {format ? format(value) : value.toFixed(step >= 1 ? 0 : 2)}
      </span>
      <input
        type="range"
        className="col-span-2 h-4 w-full cursor-pointer accent-primary"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.currentTarget.value))}
      />
    </label>
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

const RIPPLE_BUTTONS: { kind: RippleKind; label: string }[] = [
  { kind: "done", label: "Done" },
  { kind: "error", label: "Error" },
  { kind: "started", label: "Start" },
];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="text-xs font-medium text-foreground">{title}</h3>
      {children}
    </section>
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
      className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${checked ? "bg-primary" : "bg-muted"}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 size-4 rounded-full bg-background shadow-sm transition-transform ${checked ? "translate-x-4" : "translate-x-0"}`}
      />
    </button>
  );
}

function hourLabel(hour: number): string {
  return new Date(2000, 0, 1, hour).toLocaleTimeString([], { hour: "numeric" });
}

function DailySceneSection() {
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
    <Section title="Daily scene">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">An agent paints a new scene every morning</span>
        <Switch
          checked={daily.enabled}
          label="Daily scene"
          onChange={(enabled) => void update({ enabled })}
        />
      </div>
      {daily.enabled && (
        <label className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>After</span>
          <select
            value={daily.hour}
            onChange={(event) => void update({ hour: Number(event.currentTarget.value) })}
            className="rounded-md border border-border bg-transparent px-1.5 py-0.5 text-xs text-foreground"
          >
            {Array.from({ length: 24 }, (_, hour) => (
              <option key={hour} value={hour}>
                {hourLabel(hour)}
              </option>
            ))}
          </select>
        </label>
      )}
      <button
        type="button"
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
        className="w-full rounded-md border border-border px-2 py-1 text-xs text-foreground transition-colors hover:bg-accent disabled:opacity-50"
      >
        {painting ? "Starting…" : "Paint one now"}
      </button>
      {daily.lastRunDate && (
        <div className="text-xs text-muted-foreground">Last painted {daily.lastRunDate}</div>
      )}
    </Section>
  );
}

function AmbientControls() {
  const rpc = useRpc<typeof ambientRpcContract>();
  const { state, summary, compileError } = useAmbient();
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
  return (
    <div className="max-h-[70vh] w-full space-y-4 overflow-y-auto p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-sm font-medium text-foreground">{scene.name}</div>
          <div className="text-xs text-muted-foreground">
            {summary.working} working · {summary.waiting} waiting
          </div>
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

      <Section title="Scene">
        <div className="flex flex-wrap gap-1">
          {library.map((entry) => (
            <button
              key={entry.id}
              type="button"
              onClick={() => void rpc.call("loadScene", { id: entry.id }).then(receive)}
              className={`rounded-md border px-2 py-0.5 text-xs transition-colors ${entry.id === activeId ? "border-primary bg-primary text-primary-foreground" : "border-border text-foreground hover:bg-accent"}`}
            >
              {entry.name}
            </button>
          ))}
        </div>
      </Section>

      {scene.params.length > 0 && (
        <Section title="Knobs">
          <div className="space-y-2">
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
          </div>
        </Section>
      )}

      <Section title="Palette">
        <div className="grid grid-cols-4 gap-1.5">
          {scene.palette.map((color, index) => (
            <label
              key={index}
              className="relative h-7 cursor-pointer overflow-hidden rounded-md border border-border"
              style={{ backgroundColor: color }}
              title={color}
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
      </Section>

      <Section title="Presence">
        <div className="space-y-2">
          <Slider
            label="Show-through"
            value={controls.showThrough}
            min={0}
            max={0.8}
            step={0.01}
            format={(value) => `${Math.round(value * 100)}%`}
            onChange={(value) => setControl("showThrough", value)}
          />
          <Slider
            label="Speed"
            value={controls.speed}
            min={0}
            max={4}
            step={0.05}
            format={(value) => `${value.toFixed(2)}×`}
            onChange={(value) => setControl("speed", value)}
          />
          <Slider
            label="Resolution"
            value={controls.quality}
            min={0.2}
            max={1}
            step={0.05}
            format={(value) => `${Math.round(value * 100)}%`}
            onChange={(value) => setControl("quality", value)}
          />
        </div>
      </Section>

      <Section title="Test a ripple">
        <div className="flex gap-1">
          {RIPPLE_BUTTONS.map((button) => (
            <button
              key={button.kind}
              type="button"
              onClick={() => ambientStore.requestRipple(button.kind)}
              className="flex-1 rounded-md border border-border px-2 py-1 text-xs text-foreground transition-colors hover:bg-accent"
            >
              {button.label}
            </button>
          ))}
        </div>
      </Section>

      <DailySceneSection />

      <button
        type="button"
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
        className="w-full rounded-md border border-border px-2 py-1.5 text-xs text-foreground transition-colors hover:bg-accent disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save to library"}
      </button>
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
