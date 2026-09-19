import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type PointerEvent,
  type WheelEvent,
} from "react";
import "./svg-illustration.css";

type Phase =
  | "empty"
  | "first-loading"
  | "generated"
  | "replacement-loading"
  | "error";
type Scene = "radio" | "rain";
type Tint = "mono" | "blue" | "green" | "orange";
type Role = "body" | "secondary" | "accent" | "ink" | "highlight";
type Material = "matte" | "gloss" | "glass";

type ShapeBase = {
  role: Role;
  material: Material;
  rotation?: number;
};

type Drawable =
  | (ShapeBase & {
      kind: "blob";
      x: number;
      y: number;
      width: number;
      height: number;
      wobble: number;
      seed: number;
    })
  | (ShapeBase & {
      kind: "orb";
      x: number;
      y: number;
      radiusX: number;
      radiusY?: number;
    })
  | (ShapeBase & {
      kind: "ribbon" | "stroke";
      points: Array<[number, number]>;
      width: number;
      closed?: boolean;
    })
  | (ShapeBase & {
      kind: "squircle";
      x: number;
      y: number;
      width: number;
      height: number;
      roundness?: number;
    });

type IllustrationScene = {
  name: string;
  altText: string;
  layers: Drawable[];
};

type PrototypeProps = {
  initialPhase: Phase;
  initialScene?: Scene;
  initialPrompt?: string;
  initialPendingPrompt?: string;
  autoAdvance?: boolean;
};

const TINTS: Array<{ value: Tint; label: string }> = [
  { value: "mono", label: "Black and white" },
  { value: "blue", label: "Blue" },
  { value: "green", label: "Green" },
  { value: "orange", label: "Orange" },
];

const SCENES: Record<Scene, IllustrationScene> = {
  rain: {
    name: "A rainy thought resting in a glass jar",
    altText:
      "A soft thought cloud floats in a rounded translucent jar while three drops fall beneath it.",
    layers: [
      { kind: "squircle", x: 50, y: 55, width: 50, height: 62, roundness: 0.34, role: "body", material: "glass" },
      { kind: "blob", x: 50, y: 48, width: 36, height: 17, wobble: 0.24, seed: 7, role: "secondary", material: "gloss" },
      { kind: "blob", x: 42, y: 66, width: 5, height: 9, wobble: 0.2, seed: 21, role: "accent", material: "matte" },
      { kind: "blob", x: 51, y: 68, width: 5, height: 10, wobble: 0.18, seed: 34, role: "accent", material: "matte" },
      { kind: "blob", x: 60, y: 66, width: 5, height: 9, wobble: 0.2, seed: 55, role: "accent", material: "matte" },
      { kind: "stroke", points: [[77, 38], [84, 47], [79, 57], [84, 66]], width: 1.5, role: "accent", material: "matte" },
    ],
  },
  radio: {
    name: "A playful pocket radio",
    altText:
      "A pillowy radio with a curved handle, two round knobs, and a soft speaker grille.",
    layers: [
      { kind: "ribbon", points: [[31, 40], [33, 25], [50, 19], [68, 25], [70, 40]], width: 4.6, role: "ink", material: "matte" },
      { kind: "blob", x: 50, y: 57, width: 59, height: 45, wobble: 0.07, seed: 91, role: "body", material: "gloss" },
      { kind: "orb", x: 39, y: 58, radiusX: 12, radiusY: 11, role: "secondary", material: "matte" },
      { kind: "orb", x: 35, y: 55, radiusX: 1.4, role: "ink", material: "matte" },
      { kind: "orb", x: 41, y: 54, radiusX: 1.4, role: "ink", material: "matte" },
      { kind: "orb", x: 39, y: 62, radiusX: 1.4, role: "ink", material: "matte" },
      { kind: "orb", x: 62, y: 53, radiusX: 6.3, role: "accent", material: "gloss" },
      { kind: "orb", x: 68, y: 66, radiusX: 4.3, role: "ink", material: "matte" },
      { kind: "stroke", points: [[55, 67], [59, 72], [64, 69]], width: 1.2, role: "accent", material: "matte" },
    ],
  },
};

const ROLE_COLOR: Record<Role, string> = {
  body: "var(--scene-body)",
  secondary: "var(--scene-secondary)",
  accent: "var(--scene-accent)",
  ink: "var(--scene-ink)",
  highlight: "var(--scene-highlight)",
};

function rounded(value: number) {
  return Number(value.toFixed(2));
}

function curvePath(points: Array<[number, number]>, closed: boolean) {
  if (points.length < 2) return "";
  const get = (index: number) => {
    if (closed) return points[(index + points.length) % points.length];
    return points[Math.max(0, Math.min(points.length - 1, index))];
  };
  let path = `M ${rounded(points[0][0])} ${rounded(points[0][1])}`;
  const segmentCount = closed ? points.length : points.length - 1;

  for (let index = 0; index < segmentCount; index += 1) {
    const previous = get(index - 1);
    const start = get(index);
    const end = get(index + 1);
    const next = get(index + 2);
    const controlOne: [number, number] = [
      start[0] + (end[0] - previous[0]) / 6,
      start[1] + (end[1] - previous[1]) / 6,
    ];
    const controlTwo: [number, number] = [
      end[0] - (next[0] - start[0]) / 6,
      end[1] - (next[1] - start[1]) / 6,
    ];
    path += ` C ${rounded(controlOne[0])} ${rounded(controlOne[1])} ${rounded(controlTwo[0])} ${rounded(controlTwo[1])} ${rounded(end[0])} ${rounded(end[1])}`;
  }

  return closed ? `${path} Z` : path;
}

function blobPath(layer: Extract<Drawable, { kind: "blob" }>) {
  const points: Array<[number, number]> = [];
  const count = 10;
  for (let index = 0; index < count; index += 1) {
    const angle = (Math.PI * 2 * index) / count - Math.PI / 2;
    const noise = Math.sin((layer.seed + index * 31) * 12.9898) * 43758.5453;
    const centeredNoise = (noise - Math.floor(noise)) * 2 - 1;
    const radius = 1 + centeredNoise * layer.wobble;
    points.push([
      layer.x + Math.cos(angle) * (layer.width / 2) * radius,
      layer.y + Math.sin(angle) * (layer.height / 2) * radius,
    ]);
  }
  return curvePath(points, true);
}

function Illustration({ id, scene }: { id: string; scene: IllustrationScene }) {
  const fillFor = (layer: Drawable) => {
    if (layer.material === "glass") return `url(#${id}-glass)`;
    if (layer.material === "gloss") return `url(#${id}-gloss)`;
    return ROLE_COLOR[layer.role];
  };

  return (
    <svg
      className="svg-prototype-art"
      viewBox="0 0 100 100"
      role="img"
      aria-labelledby={`${id}-title ${id}-description`}
    >
      <title id={`${id}-title`}>{scene.name}</title>
      <desc id={`${id}-description`}>{scene.altText}</desc>
      <defs>
        <linearGradient id={`${id}-gloss`} x1="0.15" x2="0.86" y1="0" y2="1">
          <stop offset="0" stopColor="var(--scene-highlight)" />
          <stop offset="0.42" stopColor="var(--scene-body)" />
          <stop offset="1" stopColor="var(--scene-secondary)" />
        </linearGradient>
        <linearGradient id={`${id}-glass`} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="var(--scene-highlight)" stopOpacity="0.82" />
          <stop offset="0.48" stopColor="var(--scene-secondary)" stopOpacity="0.24" />
          <stop offset="1" stopColor="var(--scene-body)" stopOpacity="0.54" />
        </linearGradient>
        <filter id={`${id}-shadow`} x="-30%" y="-80%" width="160%" height="260%">
          <feGaussianBlur stdDeviation="2.2" />
        </filter>
      </defs>

      <ellipse
        cx="50"
        cy="81"
        rx="25"
        ry="3.6"
        fill="var(--scene-ink)"
        opacity="0.15"
        filter={`url(#${id}-shadow)`}
      />

      {scene.layers.map((layer, index) => {
        const key = `${layer.kind}-${index}`;
        const rotation = layer.rotation ?? 0;
        const stroke = "var(--scene-ink)";
        const common = {
          fill: fillFor(layer),
          stroke,
          strokeOpacity: layer.material === "glass" ? 0.5 : 0.72,
          strokeWidth: layer.material === "glass" ? 1.05 : 0.85,
        };

        if (layer.kind === "blob") {
          return (
            <path
              key={key}
              data-layer-kind={layer.kind}
              d={blobPath(layer)}
              {...common}
              transform={`rotate(${rotation} ${layer.x} ${layer.y})`}
              strokeLinejoin="round"
            />
          );
        }
        if (layer.kind === "orb") {
          return (
            <ellipse
              key={key}
              data-layer-kind={layer.kind}
              cx={layer.x}
              cy={layer.y}
              rx={layer.radiusX}
              ry={layer.radiusY ?? layer.radiusX}
              {...common}
              transform={`rotate(${rotation} ${layer.x} ${layer.y})`}
            />
          );
        }
        if (layer.kind === "squircle") {
          const roundness = layer.roundness ?? 0.25;
          return (
            <rect
              key={key}
              data-layer-kind={layer.kind}
              x={layer.x - layer.width / 2}
              y={layer.y - layer.height / 2}
              width={layer.width}
              height={layer.height}
              rx={Math.min(layer.width, layer.height) * roundness}
              {...common}
              transform={`rotate(${rotation} ${layer.x} ${layer.y})`}
            />
          );
        }
        return (
          <path
            key={key}
            data-layer-kind={layer.kind}
            d={curvePath(layer.points, layer.closed ?? false)}
            fill="none"
            stroke={ROLE_COLOR[layer.role]}
            strokeWidth={layer.width}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );
      })}
    </svg>
  );
}

function Prototype({
  initialPhase,
  initialScene,
  initialPrompt = "",
  initialPendingPrompt = "",
  autoAdvance = false,
}: PrototypeProps) {
  const id = useId().replaceAll(":", "");
  const [phase, setPhase] = useState<Phase>(initialPhase);
  const [scene, setScene] = useState<Scene | null>(initialScene ?? null);
  const [prompt, setPrompt] = useState(initialPrompt);
  const [pendingPrompt, setPendingPrompt] = useState(initialPendingPrompt);
  const [draft, setDraft] = useState(initialPendingPrompt || initialPrompt);
  const [pendingScene, setPendingScene] = useState<Scene>(
    initialScene === "radio" ? "rain" : "radio",
  );
  const [tint, setTint] = useState<Tint>("mono");
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const drag = useRef<
    | { pointerId: number; startX: number; startY: number; x: number; y: number }
    | undefined
  >(undefined);

  const loading =
    phase === "first-loading" || phase === "replacement-loading";
  const hasScene = scene !== null;

  useEffect(() => {
    if (!autoAdvance || !loading) return;
    const timer = window.setTimeout(() => {
      setScene(pendingScene);
      setPrompt(pendingPrompt);
      setPhase("generated");
      setZoom(1);
      setOffset({ x: 0, y: 0 });
    }, 1_700);
    return () => window.clearTimeout(timer);
  }, [autoAdvance, loading, pendingPrompt, pendingScene]);

  const generate = (nextPrompt: string, nextScene?: Scene) => {
    const cleanPrompt = nextPrompt.trim();
    if (!cleanPrompt || loading) return;
    setPendingPrompt(cleanPrompt);
    setPendingScene(
      nextScene ?? (cleanPrompt.toLowerCase().includes("radio") ? "radio" : "rain"),
    );
    setPhase(hasScene ? "replacement-loading" : "first-loading");
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    generate(draft);
  };

  const retry = () => {
    generate(
      pendingPrompt || draft || "a rainy thought resting in a glass jar",
      pendingScene,
    );
  };

  const remix = () => {
    generate(
      prompt || "a rainy thought resting in a glass jar",
      scene === "rain" ? "radio" : "rain",
    );
  };

  const changeZoom = (next: number) => {
    setZoom(Math.min(1.5, Math.max(0.7, Number(next.toFixed(2)))));
  };

  const startDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (!hasScene || loading) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      x: offset.x,
      y: offset.y,
    };
  };

  const moveDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (drag.current?.pointerId !== event.pointerId) return;
    setOffset({
      x: Math.max(-90, Math.min(90, drag.current.x + event.clientX - drag.current.startX)),
      y: Math.max(-70, Math.min(70, drag.current.y + event.clientY - drag.current.startY)),
    });
  };

  const stopDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (drag.current?.pointerId !== event.pointerId) return;
    drag.current = undefined;
  };

  const wheel = (event: WheelEvent<HTMLDivElement>) => {
    if (!hasScene || loading) return;
    changeZoom(zoom + (event.deltaY < 0 ? 0.08 : -0.08));
  };

  return (
    <div className="svg-prototype-root" data-tint={tint}>
      <header className="svg-prototype-header">
        <span className="svg-prototype-mark" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <strong>Protofetti</strong>
      </header>

      <main className="svg-prototype-stage" aria-busy={loading}>
        <div
          className="svg-prototype-pan-layer"
          onPointerDown={startDrag}
          onPointerMove={moveDrag}
          onPointerUp={stopDrag}
          onPointerCancel={stopDrag}
          onWheel={wheel}
        >
          {hasScene ? (
            <div
              className="svg-prototype-scene"
              style={{
                transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
              }}
            >
              {scene === "rain" ? (
                <Illustration id={`${id}-rain`} scene={SCENES.rain} />
              ) : (
                <Illustration id={`${id}-radio`} scene={SCENES.radio} />
              )}
            </div>
          ) : null}
        </div>

        {!hasScene && phase === "empty" ? (
          <div className="svg-prototype-empty">
            <strong>Enter a prompt and send it.</strong>
          </div>
        ) : null}

        {loading ? (
          <>
            <div className="svg-prototype-shimmer" aria-hidden="true" />
            <div className="svg-prototype-status" role="status">
              <span className="svg-prototype-spinner" aria-hidden="true" />
              <span>{phase === "replacement-loading" ? "Updating illustration…" : "Making illustration…"}</span>
            </div>
          </>
        ) : null}

        {phase === "error" ? (
          <div className="svg-prototype-status" data-tone="error" role="alert">
            <span className="svg-prototype-error-dot" aria-hidden="true" />
            <span>Couldn’t make that illustration.</span>
            <button type="button" onClick={retry}>Retry</button>
          </div>
        ) : null}

        {hasScene ? (
          <div className="svg-prototype-zoom" aria-label="Canvas zoom controls">
            <button
              type="button"
              aria-label="Zoom in"
              disabled={loading || zoom >= 1.5}
              onClick={() => changeZoom(zoom + 0.1)}
            >
              +
            </button>
            <span className="svg-prototype-zoom-track" aria-hidden="true">
              <i style={{ bottom: `${((zoom - 0.7) / 0.8) * 100}%` }} />
            </span>
            <button
              type="button"
              aria-label="Zoom out"
              disabled={loading || zoom <= 0.7}
              onClick={() => changeZoom(zoom - 0.1)}
            >
              −
            </button>
          </div>
        ) : null}

        <div className="svg-prototype-compose-stack">
          {hasScene && !loading ? (
            <section className="svg-prototype-object-controls" aria-label="Illustration controls">
              <span className="svg-prototype-selection-dot" aria-hidden="true" />
              <strong>{prompt || (scene === "rain" ? "a rainy thought resting in a glass jar" : "a playful pocket radio")}</strong>
              <span className="svg-prototype-color-label">Color</span>
              <div className="svg-prototype-colors">
                {TINTS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    data-color={option.value}
                    aria-label={option.label}
                    aria-pressed={tint === option.value}
                    onClick={() => setTint(option.value)}
                  >
                    <span />
                  </button>
                ))}
              </div>
              <button className="svg-prototype-remix" type="button" onClick={remix}>
                Remix
              </button>
            </section>
          ) : null}

          <form className="svg-prototype-composer" onSubmit={submit}>
            <textarea
              aria-label="Illustration prompt"
              placeholder="Enter a prompt…"
              rows={2}
              value={draft}
              disabled={loading}
              onChange={(event) => setDraft(event.target.value.slice(0, 500))}
              onKeyDown={(event) => {
                if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                  event.preventDefault();
                  generate(draft);
                }
              }}
            />
            <div className="svg-prototype-composer-footer">
              <span>{draft.length}/500</span>
              <button type="submit" disabled={loading || draft.trim().length === 0}>
                <span>Send</span>
                <svg viewBox="0 0 16 16" aria-hidden="true">
                  <path d="M8 13V3M4.5 6.5 8 3l3.5 3.5" />
                </svg>
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

export default {
  title: "Protofetti / SVG illustration prototype",
};

export const InteractiveFlow = () => (
  <Prototype initialPhase="empty" autoAdvance />
);
InteractiveFlow.storyName = "Interactive flow";

export const EmptyState = () => <Prototype initialPhase="empty" />;
EmptyState.storyName = "01 Empty state";

export const FirstSubmission = () => (
  <Prototype
    initialPhase="first-loading"
    initialPendingPrompt="a rainy thought resting in a glass jar"
  />
);
FirstSubmission.storyName = "02 First submission";

export const GeneratedScene = () => (
  <Prototype
    initialPhase="generated"
    initialScene="rain"
    initialPrompt="a rainy thought resting in a glass jar"
  />
);
GeneratedScene.storyName = "03 Generated scene";

export const ReplacementLoading = () => (
  <Prototype
    initialPhase="replacement-loading"
    initialScene="rain"
    initialPrompt="a rainy thought resting in a glass jar"
    initialPendingPrompt="a playful pocket radio with a pillowy body and two round knobs"
  />
);
ReplacementLoading.storyName = "04 Replacement loading";

export const PreservedSceneError = () => (
  <Prototype
    initialPhase="error"
    initialScene="rain"
    initialPrompt="a rainy thought resting in a glass jar"
    initialPendingPrompt="a playful pocket radio with a pillowy body and two round knobs"
  />
);
PreservedSceneError.storyName = "05 Preserved scene error";
