import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { toast } from "sonner";
import {
  definePluginApp,
  useBbContext,
  useComposer,
  useRealtime,
  useRpc,
  type PluginThreadPanelProps,
} from "@get-bb/plugin-sdk/app";

import {
  EDIT_MAX_POINTS,
  MAX_RADIUS,
  MESH_STYLE_NAMES,
  MIN_RADIUS,
  applyBaseColor,
  clamp,
  generateMeshGradient,
  hexToHsl,
  hslToHex,
  nameFor,
  newPointAt,
  randomSeed,
  toCss,
  toCssLayers,
  toSvg,
  type MeshGradientSpec,
  type MeshStyleName,
} from "./gradient.js";
import {
  SURFACE_PRESETS,
  base64FromDataUrl,
  measureContrast,
  presetById,
  renderPngDataUrl,
  type SurfacePreset,
} from "./raster.js";
import type { SavedGradient, meshGradientRpcContract } from "./server.js";
import { toThemeCss } from "./theme.js";

const MIN_EDIT_POINTS = 2;

const segmentIconClass =
  "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-40";

const clusterClass =
  "flex h-8 items-center rounded-full border border-border bg-card";

const menuClass =
  "absolute left-0 top-9 z-10 min-w-36 rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-lg";

const primaryButtonClass =
  "ml-auto inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-primary px-3.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-50";

const sliderClass =
  "h-1 min-w-10 flex-1 cursor-pointer appearance-none rounded-full bg-border outline-none " +
  "[&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-foreground " +
  "[&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-foreground";

const swatchClass =
  "h-5 w-5 shrink-0 cursor-pointer appearance-none rounded-full border border-border bg-transparent p-0 " +
  "[&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-full [&::-webkit-color-swatch]:border-0";

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong";
}

async function copyToClipboard(label: string, text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  } catch (error) {
    toast.error(`Copy failed: ${errorMessage(error)}`);
  }
}

function IconMore() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="5" cy="12" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
    </svg>
  );
}

function IconSend() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m22 2-11 11" />
      <path d="M22 2 15 22l-4-9-9-4z" />
    </svg>
  );
}

function IconUndo() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 7v6h6" />
      <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
    </svg>
  );
}

function IconShuffle() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.8-1.1 2-1.7 3.3-1.7H22" />
      <path d="m18 2 4 4-4 4" />
      <path d="M2 6h1.9c1.5 0 2.9.9 3.6 2.2" />
      <path d="M22 18h-5.9c-1.3 0-2.6-.7-3.3-1.8l-.5-.8" />
      <path d="m18 14 4 4-4 4" />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 6h18" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

function IconChevron() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

/**
 * Control-point chrome: a translucent orb that lets the gradient read through
 * rather than a solid marker.
 *
 * No opaque ring. The edge is a low-alpha refraction — a bright sliver along
 * the lit top edge and a dimmer one along the bottom, both semi-transparent so
 * they tint with whatever is behind them instead of drawing white or black.
 * Separation comes from the soft cast shadow and the backdrop distortion, which
 * is how a real glass bead reads on paper: you see its shadow and its caustics,
 * not an outline.
 */
const GLASS_ORB: CSSProperties = {
  backgroundColor: "rgba(255,255,255,0.05)",
  backgroundImage:
    "radial-gradient(circle at 32% 26%, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.10) 38%, rgba(255,255,255,0) 68%)",
  boxShadow: [
    "inset 0 0 0 1px rgba(255,255,255,0.22)",
    "inset 0 1px 1.5px rgba(255,255,255,0.40)",
    "inset 0 -1px 1.5px rgba(0,0,0,0.16)",
    "0 1px 2px rgba(0,0,0,0.28)",
    "0 2px 7px rgba(0,0,0,0.26)",
  ].join(", "),
};

/** Same glass, thicker and lifted: brighter caustics and a deeper cast. */
const SELECTED_ORB: CSSProperties = {
  ...GLASS_ORB,
  backgroundColor: "rgba(255,255,255,0.09)",
  boxShadow: [
    "inset 0 0 0 1.5px rgba(255,255,255,0.34)",
    "inset 0 1.5px 2px rgba(255,255,255,0.52)",
    "inset 0 -1.5px 2px rgba(0,0,0,0.2)",
    "0 1px 2px rgba(0,0,0,0.32)",
    "0 3px 9px rgba(0,0,0,0.3)",
  ].join(", "),
};

interface Draft {
  spec: MeshGradientSpec;
  edited: boolean;
}

interface StudioState {
  draft: Draft;
  history: Draft[];
  selected: number | null;
}

interface MenuItem {
  label: string;
  onSelect: () => void;
}

function usePopover() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);
  return { open, setOpen, rootRef };
}

function MoreMenu({ items }: { items: MenuItem[] }) {
  const { open, setOpen, rootRef } = usePopover();
  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        aria-label="More actions"
        title="More actions"
        aria-expanded={open}
        aria-haspopup="menu"
        className={segmentIconClass}
        onClick={() => setOpen((current) => !current)}
      >
        <IconMore />
      </button>
      {open && (
        <div role="menu" className={menuClass}>
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              className="block w-full rounded-lg px-2.5 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground"
              onClick={() => {
                setOpen(false);
                item.onSelect();
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function PresetMenu({
  value,
  onChange,
}: {
  value: SurfacePreset;
  onChange: (preset: SurfacePreset) => void;
}) {
  const { open, setOpen, rootRef } = usePopover();
  return (
    <div className="relative flex h-full items-center" ref={rootRef}>
      <button
        type="button"
        aria-label="Surface"
        title={`Surface — ${value.hint}`}
        aria-expanded={open}
        aria-haspopup="menu"
        className="inline-flex h-6 items-center gap-1.5 rounded-full px-2 text-sm text-foreground transition-colors hover:bg-accent"
        onClick={() => setOpen((current) => !current)}
      >
        {value.label}
        <span className="text-muted-foreground">
          <IconChevron />
        </span>
      </button>
      {open && (
        <div role="menu" className={menuClass}>
          {SURFACE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              role="menuitemradio"
              aria-checked={preset.id === value.id}
              className="flex w-full flex-col rounded-lg px-2.5 py-1.5 text-left hover:bg-accent hover:text-accent-foreground"
              onClick={() => {
                setOpen(false);
                onChange(preset);
              }}
            >
              <span
                className={`text-sm ${preset.id === value.id ? "font-medium" : ""}`}
              >
                {preset.label}
                <span className="ml-1.5 text-xs text-muted-foreground">
                  {preset.width}×{preset.height}
                </span>
              </span>
              <span className="text-xs text-muted-foreground">{preset.hint}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Fixed-seed minis so each style option previews its actual palette. */
/** The custom palette derives from a live color, so it has no static chip. */
const SELECTABLE_STYLES = MESH_STYLE_NAMES.filter((style) => style !== "custom");

const STYLE_PREVIEWS = Object.fromEntries(
  SELECTABLE_STYLES.map((style) => {
    const layers = toCssLayers(
      generateMeshGradient({ seed: 47, pointCount: 4, style }),
    );
    return [
      style,
      {
        backgroundColor: layers.backgroundColor,
        backgroundImage: layers.backgroundImage,
      },
    ];
  }),
) as Record<MeshStyleName, { backgroundColor: string; backgroundImage: string }>;

function chipStyle(spec: MeshGradientSpec) {
  if (spec.style === "custom") {
    const layers = toCssLayers(spec);
    return {
      backgroundColor: layers.backgroundColor,
      backgroundImage: layers.backgroundImage,
    };
  }
  return STYLE_PREVIEWS[spec.style];
}

function StyleMenu({
  spec,
  customHex,
  onChange,
  onCustomColor,
  onCustomColorCommit,
}: {
  spec: MeshGradientSpec;
  customHex: string;
  onChange: (style: MeshStyleName) => void;
  onCustomColor: (hex: string) => void;
  onCustomColorCommit: () => void;
}) {
  const { open, setOpen, rootRef } = usePopover();
  return (
    <div className="relative flex h-full items-center" ref={rootRef}>
      <button
        type="button"
        aria-label="Gradient style"
        title="Gradient style"
        aria-expanded={open}
        aria-haspopup="menu"
        className="inline-flex h-6 items-center gap-1.5 rounded-full px-2 text-sm text-foreground transition-colors hover:bg-accent"
        onClick={() => setOpen((current) => !current)}
      >
        <span
          aria-hidden
          className="h-3.5 w-3.5 rounded-full border border-border"
          style={chipStyle(spec)}
        />
        {spec.style}
        <span className="text-muted-foreground">
          <IconChevron />
        </span>
      </button>
      {open && (
        <div role="menu" className={menuClass}>
          {SELECTABLE_STYLES.map((styleName) => (
            <button
              key={styleName}
              type="button"
              role="menuitemradio"
              aria-checked={styleName === spec.style}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground"
              onClick={() => {
                setOpen(false);
                onChange(styleName);
              }}
            >
              <span
                aria-hidden
                className="h-4 w-7 shrink-0 rounded border border-border"
                style={STYLE_PREVIEWS[styleName]}
              />
              <span className={styleName === spec.style ? "font-medium" : undefined}>
                {styleName}
              </span>
            </button>
          ))}
          <div aria-hidden className="my-1 h-px bg-border" />
          <label className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground">
            <input
              type="color"
              aria-label="Custom color"
              className={`${swatchClass} h-4 w-7 rounded`}
              value={customHex}
              /* React maps onChange to the native `input` event, which the OS
                 color panel fires continuously — so the mesh tracks the drag. */
              onChange={(event) => onCustomColor(event.target.value)}
              onBlur={onCustomColorCommit}
            />
            <span className={spec.style === "custom" ? "font-medium" : undefined}>
              custom
            </span>
          </label>
        </div>
      )}
    </div>
  );
}

function SavedTile({
  gradient,
  onLoad,
  onDelete,
  onSend,
}: {
  gradient: SavedGradient;
  onLoad: (gradient: SavedGradient) => void;
  onDelete: (id: string) => void;
  onSend: (gradient: SavedGradient) => void;
}) {
  const layers = useMemo(
    () =>
      toCssLayers({
        seed: gradient.seed,
        style: gradient.style,
        points: gradient.points,
      }),
    [gradient],
  );
  return (
    <div className="group relative overflow-hidden rounded-lg border border-border bg-card">
      <button
        type="button"
        className="block w-full text-left"
        onClick={() => onLoad(gradient)}
      >
        <div
          className="h-20 w-full"
          style={{
            backgroundColor: layers.backgroundColor,
            backgroundImage: layers.backgroundImage,
          }}
        />
        <div className="px-2.5 py-2">
          <div className="truncate text-sm font-medium text-foreground">
            {gradient.name}
          </div>
          <div className="truncate text-xs text-muted-foreground">
            {gradient.edited ? "edited" : gradient.style} · seed {gradient.seed}
          </div>
        </div>
      </button>
      <div className="absolute right-1.5 top-1.5 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-100">
        <button
          type="button"
          aria-label={`Send ${gradient.name} to agent`}
          title="Send to agent"
          className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-black/45 text-white"
          onClick={() => onSend(gradient)}
        >
          <IconSend />
        </button>
        <button
          type="button"
          aria-label={`Delete ${gradient.name}`}
          title="Delete"
          className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-black/45 text-xs text-white"
          onClick={() => onDelete(gradient.id)}
        >
          ×
        </button>
      </div>
    </div>
  );
}

function Studio({ threadId }: PluginThreadPanelProps) {
  const rpc = useRpc<typeof meshGradientRpcContract>();
  const composer = useComposer();
  const { projectId } = useBbContext();
  const [state, setState] = useState<StudioState>(() => ({
    draft: { spec: generateMeshGradient({ seed: randomSeed() }), edited: false },
    history: [],
    selected: null,
  }));
  const [saved, setSaved] = useState<SavedGradient[]>([]);
  // Distinguishes "no gradients" from "not fetched yet" — without it the empty
  // state flashes on every open.
  const [libraryLoaded, setLibraryLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [preset, setPreset] = useState<SurfacePreset>(() => presetById("canvas"));
  const [customHex, setCustomHex] = useState("#3366ff");
  const canvasRef = useRef<HTMLDivElement>(null);
  const lastAction = useRef<string | null>(null);
  const dragKey = useRef<string | null>(null);
  const dragCount = useRef(0);

  const { spec, edited } = state.draft;
  const customColor =
    spec.style === "custom" && spec.customColor !== undefined
      ? spec.customColor
      : customHex;
  const contrast = useMemo(() => measureContrast(spec), [spec]);
  const layers = useMemo(() => toCssLayers(spec), [spec]);
  const displayName = useMemo(
    () => (edited ? `${nameFor(spec)} (edited)` : nameFor(spec)),
    [spec, edited],
  );
  const selectedPoint =
    state.selected !== null ? spec.points[state.selected] : undefined;

  /**
   * All spec changes flow through here. actionKey groups rapid successive
   * changes (a drag, a color-picker scrub) into ONE history entry; null
   * always pushes.
   */
  const mutate = useCallback(
    (
      actionKey: string | null,
      produce: (draft: Draft) => Draft,
      select?: number | null,
    ) => {
      setState((prev) => {
        const push = actionKey === null || lastAction.current !== actionKey;
        lastAction.current = actionKey;
        return {
          draft: produce(prev.draft),
          history: push ? [...prev.history.slice(-49), prev.draft] : prev.history,
          selected: select === undefined ? prev.selected : select,
        };
      });
    },
    [],
  );

  const undo = useCallback(() => {
    lastAction.current = null;
    setState((prev) => {
      const previous = prev.history.at(-1);
      if (!previous) return prev;
      return {
        draft: previous,
        history: prev.history.slice(0, -1),
        selected: null,
      };
    });
  }, []);

  const updatePoint = useCallback(
    (actionKey: string | null, index: number, patch: Partial<MeshGradientSpec["points"][number]>) => {
      mutate(actionKey, (draft) => ({
        spec: {
          ...draft.spec,
          points: draft.spec.points.map((point, pointIndex) =>
            pointIndex === index ? { ...point, ...patch } : point,
          ),
        },
        edited: true,
      }));
    },
    [mutate],
  );

  const addPoint = useCallback(
    (x: number, y: number) => {
      mutate(
        null,
        (draft) =>
          draft.spec.points.length >= EDIT_MAX_POINTS
            ? draft
            : {
                spec: {
                  ...draft.spec,
                  points: [...draft.spec.points, newPointAt(draft.spec, x, y)],
                },
                edited: true,
              },
        Math.min(spec.points.length, EDIT_MAX_POINTS - 1),
      );
    },
    [mutate, spec.points.length],
  );

  const removePoint = useCallback(
    (index: number) => {
      mutate(
        null,
        (draft) =>
          draft.spec.points.length <= MIN_EDIT_POINTS
            ? draft
            : {
                spec: {
                  ...draft.spec,
                  points: draft.spec.points.filter(
                    (_, pointIndex) => pointIndex !== index,
                  ),
                },
                edited: true,
              },
        null,
      );
    },
    [mutate],
  );

  const refresh = useCallback(async () => {
    try {
      const { gradients } = await rpc.call("listSaved");
      setSaved(gradients);
    } catch (error) {
      toast.error(`Loading library failed: ${errorMessage(error)}`);
    } finally {
      setLibraryLoaded(true);
    }
  }, [rpc]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useRealtime("gradients", () => {
    void refresh();
  });

  const persist = useCallback(async () => {
    const result = await rpc.call("saveGradient", {
      name: displayName,
      seed: spec.seed,
      style: spec.style,
      edited,
      points: spec.points,
      ...(spec.customColor === undefined
        ? {}
        : { customColor: spec.customColor }),
    });
    await refresh();
    return result;
  }, [rpc, displayName, spec, edited, refresh]);

  const exportPng = useCallback(async () => {
    if (!projectId) {
      toast.error("Open a project to export a PNG");
      return;
    }
    setBusy(true);
    try {
      // Export the resting frame: an animated gradient still has one canonical
      // still, and a PNG cannot carry the drift anyway.
      const dataUrl = await renderPngDataUrl(spec, preset);
      const { path } = await rpc.call("exportPng", {
        projectId,
        name: `${displayName}-${preset.id}`,
        base64: base64FromDataUrl(dataUrl),
      });
      composer.updateText((current) =>
        `${current.trim() === "" ? "" : `${current}\n\n`}Use the gradient image at ${path} (${preset.width}×${preset.height}) for `,
      );
      composer.focus();
      toast.success(`PNG attached as ${path}`);
    } catch (error) {
      toast.error(`PNG export failed: ${errorMessage(error)}`);
    } finally {
      setBusy(false);
    }
  }, [projectId, spec, preset, rpc, displayName, composer]);

  const exportTokens = useCallback(async () => {
    setBusy(true);
    try {
      const { path, gradientCount } = await rpc.call("exportTokens", {
        threadId: threadId ?? null,
      });
      toast.success(`Wrote ${gradientCount} gradients to ${path}`);
    } catch (error) {
      toast.error(`Token export failed: ${errorMessage(error)}`);
    } finally {
      setBusy(false);
    }
  }, [rpc, threadId]);

  const save = useCallback(async () => {
    setBusy(true);
    try {
      const { gradient, alreadySaved } = await persist();
      toast.success(
        alreadySaved ? `Already in library as “${gradient.name}”` : `Saved “${gradient.name}”`,
      );
    } catch (error) {
      toast.error(`Save failed: ${errorMessage(error)}`);
    } finally {
      setBusy(false);
    }
  }, [persist]);

  const insertHandoff = useCallback(
    (gradient: SavedGradient) => {
      composer.updateText((current) =>
        current.trim() === "" ? "Apply the " : `${current}\n\nApply the `,
      );
      composer.insertMention({
        provider: "gradient",
        id: gradient.id,
        label: gradient.name,
      });
      composer.updateText((current) => `${current} mesh gradient to `);
      composer.focus();
      toast.success("Handoff added to the composer");
    },
    [composer],
  );

  const sendToAgent = useCallback(async () => {
    setBusy(true);
    try {
      const { gradient } = await persist();
      insertHandoff(gradient);
    } catch (error) {
      toast.error(`Send failed: ${errorMessage(error)}`);
    } finally {
      setBusy(false);
    }
  }, [persist, insertHandoff]);

  const canvasPercent = useCallback((clientX: number, clientY: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return null;
    return {
      x: clamp(((clientX - rect.left) / rect.width) * 100, 0, 100),
      y: clamp(((clientY - rect.top) / rect.height) * 100, 0, 100),
    };
  }, []);

  return (
    <div
      className="h-full overflow-y-auto px-4 py-2.5 md:px-5 md:py-3"
      onKeyDown={(event) => {
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") {
          event.preventDefault();
          undo();
          return;
        }
        const target = event.target as HTMLElement;
        if (target.tagName === "INPUT" || target.tagName === "SELECT") return;
        if (state.selected === null) return;
        const step = event.shiftKey ? 5 : 1;
        const nudgeKey = `nudge-${state.selected}`;
        const point = spec.points[state.selected];
        if (!point) return;
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          updatePoint(nudgeKey, state.selected, { x: clamp(point.x - step, 0, 100) });
        } else if (event.key === "ArrowRight") {
          event.preventDefault();
          updatePoint(nudgeKey, state.selected, { x: clamp(point.x + step, 0, 100) });
        } else if (event.key === "ArrowUp") {
          event.preventDefault();
          updatePoint(nudgeKey, state.selected, { y: clamp(point.y - step, 0, 100) });
        } else if (event.key === "ArrowDown") {
          event.preventDefault();
          updatePoint(nudgeKey, state.selected, { y: clamp(point.y + step, 0, 100) });
        } else if (event.key === "Delete" || event.key === "Backspace") {
          event.preventDefault();
          removePoint(state.selected);
        }
      }}
    >
      <div className="mx-auto w-full max-w-3xl space-y-2.5">
        {/* Every instruction lives here, so nothing is repeated further down. */}
        <p className="text-xs leading-relaxed text-muted-foreground">
          Drag points to move them, click one to recolor it or set its falloff,
          double-click the canvas to add one. ⌘Z undoes.{" "}
          <span className="text-foreground">Send to agent</span> writes a handoff
          into this thread&rsquo;s composer — or hover a saved gradient to send
          it straight from the library. In any thread, type{" "}
          <code className="rounded bg-muted px-1 py-0.5">@gradient</code> to hand
          a saved gradient to an agent with its exact values.
        </p>
        <div className="overflow-hidden rounded-lg border border-border">
          <div
            ref={canvasRef}
            className={`relative w-full ${preset.overlay === "avatar" ? "mx-auto max-w-[260px] rounded-full" : ""}`}
            data-testid="gradient-preview"
            style={{
              aspectRatio: `${preset.width} / ${preset.height}`,
              backgroundColor: layers.backgroundColor,
              backgroundImage: layers.backgroundImage,
            }}
            onDoubleClick={(event) => {
              const position = canvasPercent(event.clientX, event.clientY);
              if (position) addPoint(position.x, position.y);
            }}
            onPointerDown={() =>
              setState((prev) => ({ ...prev, selected: null }))
            }
          >
            {spec.points.map((point, index) => (
              <button
                key={index}
                type="button"
                aria-label={`Gradient point ${index + 1}`}
                aria-pressed={state.selected === index}
                data-mesh-handle={index}
                /* 24px hit target, small orb: crisp visually, still grabbable. */
                className="group absolute z-10 flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 touch-none cursor-grab items-center justify-center active:cursor-grabbing"
                style={{ left: `${point.x}%`, top: `${point.y}%` }}
                onClick={(event) => event.stopPropagation()}
                onDoubleClick={(event) => event.stopPropagation()}
                onPointerDown={(event) => {
                  event.stopPropagation();
                  dragCount.current += 1;
                  dragKey.current = `drag-${dragCount.current}`;
                  setState((prev) => ({ ...prev, selected: index }));
                  try {
                    event.currentTarget.setPointerCapture(event.pointerId);
                  } catch {
                    // Pointer capture is unavailable in some environments
                    // (jsdom); dragging degrades, selection still works.
                  }
                }}
                onPointerMove={(event) => {
                  if (!dragKey.current) return;
                  const position = canvasPercent(event.clientX, event.clientY);
                  if (position) {
                    updatePoint(dragKey.current, index, position);
                  }
                }}
                onPointerUp={() => {
                  dragKey.current = null;
                  lastAction.current = null;
                }}
                onLostPointerCapture={() => {
                  dragKey.current = null;
                  lastAction.current = null;
                }}
              >
                <span
                  aria-hidden
                  className={`block rounded-full backdrop-blur-[3px] backdrop-saturate-[1.9] backdrop-contrast-[1.12] backdrop-brightness-[0.9] transition-[width,height,box-shadow] duration-100 group-hover:backdrop-brightness-105 ${
                    state.selected === index ? "h-3.5 w-3.5" : "h-2.5 w-2.5"
                  }`}
                  style={state.selected === index ? SELECTED_ORB : GLASS_ORB}
                />
              </button>
            ))}
            {preset.overlay === "headline" && contrast && (
              <div
                className="pointer-events-none absolute inset-0 flex flex-col justify-center gap-1 p-[8%]"
                style={{ color: contrast.best === "white" ? "#ffffff" : "#000000" }}
              >
                <p className="text-[clamp(1rem,4cqw,2.25rem)] font-semibold leading-tight">
                  Put your agents to work
                </p>
                <p className="text-[clamp(0.7rem,2cqw,1rem)] opacity-80">
                  Sample copy — check it stays readable
                </p>
              </div>
            )}
            {/* Only shown where text actually sits on the gradient. */}
            {preset.overlay === "headline" && contrast && (
              <div
                className="pointer-events-none absolute right-3 top-3 rounded-full bg-black/50 px-2 py-0.5 text-xs font-medium text-white"
                title={`Worst-case contrast for ${contrast.best} text on this gradient: ${contrast.bestRatio}:1. White ${contrast.white}:1, black ${contrast.black}:1.`}
              >
                {contrast.passesAA
                  ? "Readable"
                  : contrast.passesAALarge
                    ? "Large text only"
                    : "Hard to read"}
              </div>
            )}
            <div className="pointer-events-none absolute bottom-3 left-3 rounded-md bg-black/45 px-2.5 py-1 text-white">
              <div className="text-sm font-medium leading-tight">{displayName}</div>
              <div className="text-xs leading-tight opacity-80">
                {edited ? `edited · from seed ${spec.seed}` : `seed ${spec.seed}`}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className={`${clusterClass} shrink-0 gap-0.5 px-1`}>
            <StyleMenu
              spec={spec}
              customHex={customColor}
              onChange={(styleName) =>
                mutate(
                  null,
                  (draft) => ({
                    spec: generateMeshGradient({
                      seed: draft.spec.seed,
                      pointCount: draft.spec.points.length,
                      style: styleName,
                    }),
                    edited: false,
                  }),
                  null,
                )
              }
              onCustomColor={(hex) => {
                setCustomHex(hex);
                // Keep the composition the user has built and sweep the new
                // palette across it. One history entry for the whole scrub, so
                // dragging stays live without flooding undo.
                mutate(
                  "custom-color",
                  (draft) => ({
                    spec: {
                      ...draft.spec,
                      style: "custom",
                      customColor: hex,
                      points: applyBaseColor(draft.spec.points, hex),
                    },
                    edited: draft.edited,
                  }),
                  null,
                );
              }}
              onCustomColorCommit={() => {
                lastAction.current = null;
              }}
            />
            <span aria-hidden className="mx-0.5 h-4 w-px bg-border" />
            <PresetMenu value={preset} onChange={setPreset} />
            <button
              type="button"
              aria-label="Shuffle"
              title="Shuffle"
              className={segmentIconClass}
              onClick={() =>
                mutate(
                  null,
                  (draft) => ({
                    spec: generateMeshGradient({
                      seed: randomSeed(),
                      pointCount: draft.spec.points.length,
                      style: draft.spec.style,
                      ...(draft.spec.customColor === undefined
                        ? {}
                        : { customColor: draft.spec.customColor }),
                    }),
                    edited: false,
                  }),
                  null,
                )
              }
            >
              <IconShuffle />
            </button>
            <button
              type="button"
              aria-label="Undo"
              title="Undo (⌘Z)"
              className={segmentIconClass}
              disabled={state.history.length === 0}
              onClick={undo}
            >
              <IconUndo />
            </button>
            <MoreMenu
            items={[
              {
                label: "Add point",
                onSelect: () =>
                  addPoint(20 + Math.random() * 60, 20 + Math.random() * 60),
              },
              {
                label: "Copy CSS",
                onSelect: () => void copyToClipboard("CSS", toCss(spec)),
              },
              {
                label: "Copy SVG",
                onSelect: () => void copyToClipboard("SVG", toSvg(spec)),
              },
              {
                label: `Export PNG (${preset.width}×${preset.height})`,
                onSelect: () => void exportPng(),
              },
              { label: "Save to library", onSelect: () => void save() },
              { label: "Write token file", onSelect: () => void exportTokens() },
              {
                label: "Copy bb theme CSS",
                onSelect: () =>
                  void copyToClipboard(
                    "Theme CSS",
                    toThemeCss(spec, { name: displayName }),
                  ),
              },
              ...(edited
                ? [
                    {
                      label: "Reset to seed",
                      onSelect: () =>
                        mutate(
                          null,
                          (draft) => ({
                            spec: generateMeshGradient({
                              seed: draft.spec.seed,
                              pointCount: draft.spec.points.length,
                              style: draft.spec.style,
                              ...(draft.spec.customColor === undefined
                                ? {}
                                : { customColor: draft.spec.customColor }),
                            }),
                            edited: false,
                          }),
                          null,
                        ),
                    },
                  ]
                : []),
            ]}
            />
          </div>
          {selectedPoint && state.selected !== null && (
            <div className={`${clusterClass} min-w-0 flex-1 gap-2 px-2.5`}>
              <input
                type="color"
                aria-label="Point color"
                title="Point color"
                className={swatchClass}
                value={hslToHex(
                  selectedPoint.hue,
                  selectedPoint.saturation,
                  selectedPoint.lightness,
                )}
                onChange={(event) =>
                  updatePoint(
                    `color-${state.selected}`,
                    state.selected!,
                    hexToHsl(event.target.value),
                  )
                }
                onBlur={() => {
                  lastAction.current = null;
                }}
              />
              <input
                type="range"
                aria-label="Point falloff radius"
                title="Falloff"
                className={sliderClass}
                min={MIN_RADIUS}
                max={MAX_RADIUS}
                value={selectedPoint.radius}
                onChange={(event) =>
                  updatePoint(`radius-${state.selected}`, state.selected!, {
                    radius: Number(event.target.value),
                  })
                }
                onBlur={() => {
                  lastAction.current = null;
                }}
              />
              <button
                type="button"
                aria-label="Delete point"
                title="Delete point"
                className={segmentIconClass}
                disabled={spec.points.length <= MIN_EDIT_POINTS}
                onClick={() => removePoint(state.selected!)}
              >
                <IconTrash />
              </button>
            </div>
          )}
          <button
            type="button"
            className={primaryButtonClass}
            disabled={busy}
            onClick={() => void sendToAgent()}
          >
            <IconSend />
            Send to agent
          </button>
        </div>

        <div className="space-y-2">
          <h2 className="text-sm font-medium text-foreground">Library</h2>
          {!libraryLoaded ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3" aria-hidden>
              {[0, 1, 2].map((slot) => (
                <div
                  key={slot}
                  className="h-[7.5rem] animate-pulse rounded-lg border border-border bg-muted/40"
                />
              ))}
            </div>
          ) : saved.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nothing saved yet — sending to an agent saves automatically.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {saved.map((gradient) => (
                  <SavedTile
                    key={gradient.id}
                    gradient={gradient}
                    onLoad={(loaded) =>
                      mutate(
                        null,
                        () => ({
                          spec: {
                            seed: loaded.seed,
                            style: loaded.style,
                            points: loaded.points,
                            ...(loaded.customColor === undefined
                              ? {}
                              : { customColor: loaded.customColor }),
                          },
                          edited: loaded.edited,
                        }),
                        null,
                      )
                    }
                    onDelete={(id) => {
                      void (async () => {
                        try {
                          await rpc.call("deleteGradient", { id });
                          await refresh();
                        } catch (error) {
                          toast.error(`Delete failed: ${errorMessage(error)}`);
                        }
                      })();
                    }}
                    onSend={insertHandoff}
                  />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * `::mesh-gradient{id=…}` or `::mesh-gradient{seed=… style=…}` in an assistant
 * message renders the real gradient instead of a wall of hex.
 */
function GradientDirective({
  attributes,
}: {
  attributes: Readonly<Record<string, string>>;
}) {
  const rpc = useRpc<typeof meshGradientRpcContract>();
  const [resolved, setResolved] = useState<SavedGradient | null>(null);
  const [missing, setMissing] = useState(false);
  const id = attributes.id?.trim();

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    void (async () => {
      try {
        const { gradients } = await rpc.call("listSaved");
        if (cancelled) return;
        const match = gradients.find((gradient) => gradient.id === id) ?? null;
        setResolved(match);
        setMissing(match === null);
      } catch {
        if (!cancelled) setMissing(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, rpc]);

  const spec = useMemo<MeshGradientSpec | null>(() => {
    if (resolved) {
      return {
        seed: resolved.seed,
        style: resolved.style,
        points: resolved.points,
      };
    }
    if (id) return null;
    // Attributes are model-authored: fall back to a valid gradient rather than
    // throwing inside a message.
    const seed = Number(attributes.seed);
    const style = MESH_STYLE_NAMES.find((name) => name === attributes.style);
    if (!Number.isFinite(seed)) return null;
    if (style === "custom") return null;
    return generateMeshGradient({ seed, style });
  }, [resolved, id, attributes.seed, attributes.style]);

  if (!spec) {
    return (
      <span className="text-sm text-muted-foreground">
        {missing ? "This gradient is no longer in the library." : "Loading gradient…"}
      </span>
    );
  }
  const layers = toCssLayers(spec);
  const label = resolved?.name ?? `seed ${spec.seed}`;
  return (
    <span className="my-1 inline-flex items-center gap-2 rounded-lg border border-border bg-card p-1 pr-2.5 align-middle">
      <span
        aria-hidden
        className="h-8 w-14 rounded"
        style={{
          backgroundColor: layers.backgroundColor,
          backgroundImage: layers.backgroundImage,
        }}
      />
      <span className="text-sm text-foreground">{label}</span>
    </span>
  );
}

export default definePluginApp((app) => {
  app.slots.threadPanelAction({
    id: "studio",
    title: "Mesh Gradient",
    layout: "flush",
    component: Studio,
  });
  app.slots.messageDirective({
    id: "mesh-gradient",
    component: GradientDirective,
  });
});
