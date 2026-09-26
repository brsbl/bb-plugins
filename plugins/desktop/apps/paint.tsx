import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";

import "./paint.css";
import { ProgramMenuBar, ProgramStatusBar } from "./xp-chrome";
import {
  DEFAULT_CANVAS_SIZE,
  DEFAULT_PRIMARY,
  DEFAULT_SECONDARY,
  HISTORY_LIMIT,
  PALETTE,
  PAPER,
  TOOLS,
  TOOL_SIZES,
  clampCanvasSize,
  defaultSizes,
  floodFill,
  hexToRgba,
  linePoints,
  rgbaToHex,
  shapeBounds,
  type Point,
  type ToolId,
} from "./paint-core";

interface Size {
  width: number;
  height: number;
}

interface Snapshot {
  size: Size;
  image: ImageData;
}

interface Stroke {
  pointerId: number;
  tool: ToolId;
  color: string;
  width: number;
  start: Point;
  last: Point;
}

interface ResizeDrag {
  pointerId: number;
  originX: number;
  originY: number;
  start: Size;
}

const TOOL_ORDER: ToolId[] = ["eraser", "fill", "picker", "pencil", "brush", "line", "rectangle", "ellipse"];
const TOOL_AREAS: Record<ToolId, string> = { eraser: "2 / 1", fill: "2 / 2", picker: "3 / 1", pencil: "4 / 1", brush: "4 / 2", line: "6 / 1", rectangle: "7 / 1", ellipse: "8 / 1" };

const INK = "oklch(0.24 0.03 260)";

function ToolGlyph({ tool }: { tool: ToolId }) {
  const common = { fill: "none", stroke: INK, strokeWidth: 1.3, strokeLinecap: "round", strokeLinejoin: "round" } as const;
  let body: ReactNode;
  switch (tool) {
    case "pencil":
      body = (
        <>
          <path d="M3 13l1-3.5 7-7 2.5 2.5-7 7Z" fill="oklch(0.85 0.15 90)" stroke={INK} strokeWidth="1.1" strokeLinejoin="round" />
          <path d="M3 13l1-3.5 2.5 2.5Z" fill="oklch(0.3 0.03 60)" />
          <path d="M11 2.5l2.5 2.5" stroke="oklch(0.65 0.18 20)" strokeWidth="1.6" />
        </>
      );
      break;
    case "brush":
      body = (
        <>
          <path d="M13.5 2.5 8 8" stroke="oklch(0.55 0.12 60)" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M8.2 7.8 9.5 9" stroke="oklch(0.7 0.02 250)" strokeWidth="2" />
          <path d="M7.5 8.5c-2 0-2.6 1.2-3 2.6-.3 1.1-1 1.6-2 1.9 2.6 1 5.2.4 6-1.5.4-1 .2-2.2-1-3Z" fill={INK} />
        </>
      );
      break;
    case "eraser":
      body = (
        <>
          <path d="M2.5 10.5 8 5l4.5 4.5L9 13H5Z" fill="oklch(0.9 0.05 20)" stroke={INK} strokeWidth="1.1" strokeLinejoin="round" />
          <path d="M8 5l2.5-2.5 4.5 4.5-2.5 2.5Z" fill="oklch(0.7 0.14 250)" stroke={INK} strokeWidth="1.1" strokeLinejoin="round" />
          <path d="M9 13h5" {...common} />
        </>
      );
      break;
    case "fill":
      body = (
        <>
          <path d="M3 7.5 7.5 3l5 5L8 12.5Z" fill="oklch(0.95 0.01 250)" stroke={INK} strokeWidth="1.1" strokeLinejoin="round" />
          <path d="M3 7.5h9.5L8 12.5Z" fill="oklch(0.62 0.19 250)" />
          <path d="M13.5 9.5c.8 1.2 1.2 2 1.2 2.6a1.2 1.2 0 0 1-2.4 0c0-.6.4-1.4 1.2-2.6Z" fill="oklch(0.62 0.19 250)" />
        </>
      );
      break;
    case "line":
      body = <path d="M3 13 13 3" {...common} strokeWidth="1.6" />;
      break;
    case "rectangle":
      body = <rect x="2.5" y="4" width="11" height="8" {...common} />;
      break;
    case "ellipse":
      body = <ellipse cx="8" cy="8" rx="5.5" ry="4" {...common} />;
      break;
    case "picker":
      body = (
        <>
          <path d="M9.5 6.5 3.5 12.5 3 13.5l1 .5 1-.5 6-6" fill="oklch(0.9 0.04 220)" stroke={INK} strokeWidth="1.1" strokeLinejoin="round" />
          <path d="M8.5 4.5l3 3M10 6l2.2-2.2a1.5 1.5 0 0 0-2.1-2.1L8 3.9" fill={INK} stroke={INK} strokeWidth="1.3" strokeLinecap="round" />
        </>
      );
      break;
  }
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden>
      {body}
    </svg>
  );
}

function SizeGlyph({ tool, size }: { tool: ToolId; size: number }) {
  if (tool === "eraser") {
    const side = size + 2;
    return (
      <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden>
        <rect x={8 - side / 2} y={8 - side / 2} width={side} height={side} fill={INK} />
      </svg>
    );
  }
  if (tool === "brush") {
    return (
      <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden>
        <circle cx="8" cy="8" r={Math.max(1, size / 2 + 0.4)} fill={INK} />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 36 12" width="36" height="12" aria-hidden>
      <rect x="2" y={6 - size / 2} width="32" height={size} fill={INK} />
    </svg>
  );
}

function strokeSegment(ctx: CanvasRenderingContext2D, stroke: Stroke, from: Point, to: Point) {
  ctx.fillStyle = stroke.color;
  if (stroke.tool === "pencil") {
    for (const point of linePoints(from, to)) ctx.fillRect(point.x, point.y, 1, 1);
    return;
  }
  if (stroke.tool === "eraser") {
    const half = Math.floor(stroke.width / 2);
    for (const point of linePoints(from, to)) ctx.fillRect(point.x - half, point.y - half, stroke.width, stroke.width);
    return;
  }
  ctx.strokeStyle = stroke.color;
  ctx.lineWidth = stroke.width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(from.x + 0.5, from.y + 0.5);
  ctx.lineTo(to.x + 0.5, to.y + 0.5);
  ctx.stroke();
}

function drawShape(ctx: CanvasRenderingContext2D, stroke: Stroke, end: Point, square: boolean) {
  const offset = stroke.width % 2 === 1 ? 0.5 : 0;
  ctx.strokeStyle = stroke.color;
  ctx.lineWidth = stroke.width;
  ctx.lineCap = "round";
  ctx.lineJoin = "miter";
  ctx.beginPath();
  if (stroke.tool === "line") {
    ctx.moveTo(stroke.start.x + offset, stroke.start.y + offset);
    ctx.lineTo(end.x + offset, end.y + offset);
  } else {
    const bounds = shapeBounds(stroke.start, end, square);
    if (stroke.tool === "rectangle") {
      ctx.rect(bounds.x + offset, bounds.y + offset, bounds.width, bounds.height);
    } else {
      ctx.ellipse(
        bounds.x + bounds.width / 2 + offset,
        bounds.y + bounds.height / 2 + offset,
        bounds.width / 2,
        bounds.height / 2,
        0,
        0,
        Math.PI * 2,
      );
    }
  }
  ctx.stroke();
}

export function PaintApp() {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const ratioRef = useRef(1);
  const strokeRef = useRef<Stroke | null>(null);
  const resizeRef = useRef<ResizeDrag | null>(null);
  const historyRef = useRef<Snapshot[]>([]);
  const sizeRef = useRef<Size>(DEFAULT_CANVAS_SIZE);
  const [size, setSize] = useState<Size>(DEFAULT_CANVAS_SIZE);
  const [pending, setPending] = useState<Size | null>(null);
  const [tool, setTool] = useState<ToolId>("pencil");
  const [previousTool, setPreviousTool] = useState<ToolId>("pencil");
  const [sizes, setSizes] = useState(defaultSizes);
  const [primary, setPrimary] = useState(DEFAULT_PRIMARY);
  const [secondary, setSecondary] = useState(DEFAULT_SECONDARY);
  const [canUndo, setCanUndo] = useState(false);
  const [dirty, setDirty] = useState(false);

  const context = (canvas: HTMLCanvasElement | null) => {
    const ctx = canvas?.getContext("2d", { willReadFrequently: canvas === canvasRef.current }) ?? null;
    if (ctx !== null) ctx.setTransform(ratioRef.current, 0, 0, ratioRef.current, 0, 0);
    return ctx;
  };

  const applySize = useCallback((next: Size, image: ImageData | null) => {
    const canvas = canvasRef.current;
    const overlay = overlayRef.current;
    if (canvas === null || overlay === null) return;
    const ratio = ratioRef.current;
    const pixelWidth = image?.width ?? Math.round(next.width * ratio);
    const pixelHeight = image?.height ?? Math.round(next.height * ratio);
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
    overlay.width = pixelWidth;
    overlay.height = pixelHeight;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (ctx !== null) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = PAPER;
      ctx.fillRect(0, 0, pixelWidth, pixelHeight);
      if (image !== null) ctx.putImageData(image, 0, 0);
    }
    sizeRef.current = next;
    setSize(next);
  }, []);

  useLayoutEffect(() => {
    ratioRef.current = Math.max(1, window.devicePixelRatio || 1);
    applySize(DEFAULT_CANVAS_SIZE, null);
  }, [applySize]);

  const capture = (): Snapshot | null => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d", { willReadFrequently: true });
    if (canvas == null || ctx == null) return null;
    return { size: sizeRef.current, image: ctx.getImageData(0, 0, canvas.width, canvas.height) };
  };

  const remember = () => {
    const snapshot = capture();
    if (snapshot === null) return null;
    historyRef.current = [...historyRef.current, snapshot].slice(-HISTORY_LIMIT);
    setCanUndo(true);
    setDirty(true);
    return snapshot;
  };

  const undo = () => {
    const snapshot = historyRef.current.at(-1);
    if (snapshot === undefined || strokeRef.current !== null) return;
    historyRef.current = historyRef.current.slice(0, -1);
    setCanUndo(historyRef.current.length > 0);
    applySize(snapshot.size, snapshot.image);
  };

  const newPicture = () => {
    if (dirty && !window.confirm("Clear the picture? Unsaved changes will be lost.")) return;
    remember();
    applySize(sizeRef.current, null);
    setDirty(false);
  };

  const save = () => {
    const canvas = canvasRef.current;
    if (canvas === null) return;
    const output = document.createElement("canvas");
    output.width = sizeRef.current.width;
    output.height = sizeRef.current.height;
    const ctx = output.getContext("2d");
    if (ctx === null) return;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(canvas, 0, 0, output.width, output.height);
    output.toBlob((blob) => {
      if (blob === null) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "untitled.png";
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setDirty(false);
    }, "image/png");
  };

  const pointFrom = (event: ReactPointerEvent<HTMLCanvasElement>): Point => {
    const rect = event.currentTarget.getBoundingClientRect();
    const scaleX = rect.width > 0 ? sizeRef.current.width / rect.width : 1;
    const scaleY = rect.height > 0 ? sizeRef.current.height / rect.height : 1;
    return {
      x: Math.floor((event.clientX - rect.left) * scaleX),
      y: Math.floor((event.clientY - rect.top) * scaleY),
    };
  };

  const selectTool = (next: ToolId) => {
    if (next === "picker" && tool !== "picker") setPreviousTool(tool);
    setTool(next);
  };

  const clearOverlay = () => {
    const overlay = overlayRef.current;
    const ctx = overlay?.getContext("2d");
    if (overlay == null || ctx == null) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, overlay.width, overlay.height);
  };

  const onCanvasPointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if ((event.button !== 0 && event.button !== 2) || strokeRef.current !== null) return;
    event.preventDefault();
    rootRef.current?.focus({ preventScroll: true });
    const point = pointFrom(event);
    const alternate = event.button === 2;
    const canvas = canvasRef.current;
    if (canvas === null) return;

    if (tool === "picker") {
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (ctx === null || point.x < 0 || point.y < 0 || point.x >= sizeRef.current.width || point.y >= sizeRef.current.height) return;
      const ratio = ratioRef.current;
      const [r, g, b] = ctx.getImageData(Math.floor(point.x * ratio), Math.floor(point.y * ratio), 1, 1).data;
      const picked = rgbaToHex(r ?? 0, g ?? 0, b ?? 0);
      if (alternate) setSecondary(picked);
      else setPrimary(picked);
      setTool(previousTool);
      return;
    }

    if (tool === "fill") {
      if (point.x < 0 || point.y < 0 || point.x >= sizeRef.current.width || point.y >= sizeRef.current.height) return;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (ctx === null) return;
      remember();
      const ratio = ratioRef.current;
      const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
      floodFill(
        image.data,
        image.width,
        image.height,
        Math.floor((point.x + 0.5) * ratio),
        Math.floor((point.y + 0.5) * ratio),
        hexToRgba(alternate ? secondary : primary),
      );
      ctx.putImageData(image, 0, 0);
      return;
    }

    const color = tool === "eraser" || alternate ? secondary : primary;
    const stroke: Stroke = { pointerId: event.pointerId, tool, color, width: sizes[tool], start: point, last: point };
    event.currentTarget.setPointerCapture(event.pointerId);
    strokeRef.current = stroke;
    remember();
    if (tool === "pencil" || tool === "brush" || tool === "eraser") {
      const ctx = context(canvas);
      if (ctx !== null) strokeSegment(ctx, stroke, point, point);
    }
  };

  const onCanvasPointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const stroke = strokeRef.current;
    if (stroke === null || stroke.pointerId !== event.pointerId) return;
    const point = pointFrom(event);
    if (stroke.tool === "pencil" || stroke.tool === "brush" || stroke.tool === "eraser") {
      const ctx = context(canvasRef.current);
      if (ctx !== null) strokeSegment(ctx, stroke, stroke.last, point);
      stroke.last = point;
      return;
    }
    stroke.last = point;
    clearOverlay();
    const ctx = context(overlayRef.current);
    if (ctx !== null) drawShape(ctx, stroke, point, event.shiftKey);
  };

  const finishStroke = (event: ReactPointerEvent<HTMLCanvasElement>, commit: boolean) => {
    const stroke = strokeRef.current;
    if (stroke === null || stroke.pointerId !== event.pointerId) return;
    strokeRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (stroke.tool === "line" || stroke.tool === "rectangle" || stroke.tool === "ellipse") {
      clearOverlay();
      const ctx = context(canvasRef.current);
      if (commit && ctx !== null) drawShape(ctx, stroke, pointFrom(event), event.shiftKey);
    }
  };

  const onHandlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || strokeRef.current !== null) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    resizeRef.current = { pointerId: event.pointerId, originX: event.clientX, originY: event.clientY, start: sizeRef.current };
    setPending(sizeRef.current);
  };

  const onHandlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = resizeRef.current;
    if (drag === null || drag.pointerId !== event.pointerId) return;
    setPending({
      width: clampCanvasSize(drag.start.width + event.clientX - drag.originX),
      height: clampCanvasSize(drag.start.height + event.clientY - drag.originY),
    });
  };

  const onHandlePointerUp = (event: ReactPointerEvent<HTMLDivElement>, commit: boolean) => {
    const drag = resizeRef.current;
    if (drag === null || drag.pointerId !== event.pointerId) return;
    resizeRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    const next = {
      width: clampCanvasSize(drag.start.width + event.clientX - drag.originX),
      height: clampCanvasSize(drag.start.height + event.clientY - drag.originY),
    };
    setPending(null);
    if (!commit || (next.width === sizeRef.current.width && next.height === sizeRef.current.height)) return;
    const snapshot = remember();
    applySize(next, null);
    const ctx = canvasRef.current?.getContext("2d", { willReadFrequently: true });
    if (snapshot !== null && ctx != null) ctx.putImageData(snapshot.image, 0, 0);
  };

  const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if ((event.ctrlKey || event.metaKey) && !event.shiftKey && !event.altKey && event.key.toLowerCase() === "z") {
      event.preventDefault();
      undo();
    }
  };

  const toolSizes = TOOL_SIZES[tool];
  const toolLabel = TOOLS.find((entry) => entry.id === tool)?.label ?? tool;

  return (
    <div ref={rootRef} className="bbd-program bbd-paint flex h-full flex-col" tabIndex={-1} onKeyDown={onKeyDown}>
      <ProgramMenuBar menus={[
        { label: "File", items: [{ label: "New", action: newPicture }, { label: "Save", action: save }, { label: "Save As…", action: save }] },
        { label: "Edit", items: [{ label: "Undo", shortcut: "Ctrl+Z", disabled: !canUndo, action: undo }] },
        { label: "View", items: [{ label: "Tool Box", checked: true }, { label: "Color Box", checked: true }, { label: "Status Bar", checked: true }] },
        { label: "Image", items: [{ label: "Attributes…", disabled: true }, { label: "Clear Image", action: newPicture }] },
        { label: "Colors", items: [{ label: "Choose foreground: click a color" }, { label: "Choose background: right-click" }] },
        { label: "Help", items: [{ label: "Drag to draw; resize at bottom right" }] },
      ]} />
      <div className="flex min-h-0 flex-1">
        <div className="bbd-paint-toolbox flex-none">
          <div className="bbd-paint-tools" role="toolbar" aria-label="Tools">
            {[
              ["Free-form select", "1 / 1", "M2 5 6 2 11 4 14 9 9 13 3 11Z"],
              ["Select", "1 / 2", "M2 3h12v10H2Z"],
              ["Magnifier", "3 / 2", "M10 10l5 5M11 6a5 5 0 1 1-10 0 5 5 0 0 1 10 0"],
              ["Airbrush", "5 / 1", "M2 5h5v9H2ZM8 3h1m3 2h1m-3 3h1m3 3h1"],
              ["Text", "5 / 2", "M3 14 8 2l5 12M5 10h6"],
              ["Curve", "6 / 2", "M3 14c12-6-7-6 8-12"],
              ["Polygon", "7 / 2", "M2 13 5 3h6L8 8h6v5Z"],
              ["Rounded rectangle", "8 / 2", "M5 3h6q3 0 3 3v4q0 3-3 3H5q-3 0-3-3V6q0-3 3-3"],
            ].map(([label, area, path]) => <button key={label} className="bbd-paint-tool" style={{ gridArea: area }} type="button" disabled aria-label={label} title={`${label} (not available)`}><svg viewBox="0 0 16 16" width="16" height="16" aria-hidden><path d={path} fill="none" stroke="currentColor" strokeWidth="1.3" strokeDasharray={label?.includes("select") || label === "Select" ? "2 1" : undefined} /></svg></button>)}
            {[...TOOLS].sort((a, b) => TOOL_ORDER.indexOf(a.id) - TOOL_ORDER.indexOf(b.id)).map((entry) => (
              <button
                key={entry.id}
                type="button"
                className="bbd-paint-tool"
                style={{ gridArea: TOOL_AREAS[entry.id] }}
                data-pressed={tool === entry.id}
                aria-pressed={tool === entry.id}
                aria-label={entry.label}
                title={entry.label}
                onClick={() => selectTool(entry.id)}
              >
                <ToolGlyph tool={entry.id} />
              </button>
            ))}
          </div>
          <div className="bbd-paint-sizes" role="radiogroup" aria-label={`${toolLabel} size`}>
            {toolSizes.map((value) => (
              <button
                key={value}
                type="button"
                role="radio"
                className="bbd-paint-size"
                data-pressed={sizes[tool] === value}
                aria-checked={sizes[tool] === value}
                aria-label={`${value} pixels`}
                title={`${value} px`}
                onClick={() => setSizes((current) => ({ ...current, [tool]: value }))}
              >
                <SizeGlyph tool={tool} size={value} />
              </button>
            ))}
          </div>
        </div>
        <div className="bbd-paint-work min-h-0 min-w-0 flex-1">
          <div className="bbd-paint-sheet" style={{ width: size.width, height: size.height }}>
            <canvas
              ref={canvasRef}
              className="bbd-paint-canvas"
              data-tool={tool}
              style={{ width: size.width, height: size.height }}
              aria-label={`Picture, ${size.width} by ${size.height} pixels`}
              role="img"
              onPointerDown={onCanvasPointerDown}
              onPointerMove={onCanvasPointerMove}
              onPointerUp={(event) => finishStroke(event, true)}
              onPointerCancel={(event) => finishStroke(event, false)}
              onContextMenu={(event) => event.preventDefault()}
            />
            <canvas
              ref={overlayRef}
              className="bbd-paint-overlay"
              style={{ width: size.width, height: size.height }}
              aria-hidden
            />
            {pending !== null ? (
              <div className="bbd-paint-ghost" style={{ width: pending.width, height: pending.height }} aria-hidden />
            ) : null}
            <div
              className="bbd-paint-handle"
              role="separator"
              aria-label="Resize picture"
              title={pending !== null ? `${pending.width} × ${pending.height}` : "Resize picture"}
              onPointerDown={onHandlePointerDown}
              onPointerMove={onHandlePointerMove}
              onPointerUp={(event) => onHandlePointerUp(event, true)}
              onPointerCancel={(event) => onHandlePointerUp(event, false)}
            />
          </div>
        </div>
      </div>
      <div className="bbd-paint-colorbox flex-none">
        <div className="bbd-paint-current" aria-label={`Primary ${primary}, secondary ${secondary}`} role="img">
          <span className="bbd-paint-chip bbd-paint-chip-secondary" style={{ backgroundColor: secondary }} />
          <span className="bbd-paint-chip bbd-paint-chip-primary" style={{ backgroundColor: primary }} />
        </div>
        <div className="bbd-paint-swatches" role="group" aria-label="Colors">
          {PALETTE.map((color) => (
            <button
              key={color}
              type="button"
              className="bbd-paint-swatch"
              style={{ backgroundColor: color }}
              aria-label={`Color ${color}`}
              title={`${color}: click for primary, right-click for secondary`}
              onClick={() => setPrimary(color)}
              onContextMenu={(event) => {
                event.preventDefault();
                setSecondary(color);
              }}
            />
          ))}
        </div>
      </div>
      <ProgramStatusBar><span className="flex-1">{toolLabel}</span><span>{size.width} × {size.height} pixels</span></ProgramStatusBar>
    </div>
  );
}
