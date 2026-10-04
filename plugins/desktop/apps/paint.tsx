import { useRealtime, useRpc } from "@get-bb/plugin-sdk/app";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";

import { toast } from "sonner";

import { LIBRARY_CHANNEL, PICTURE_MENTIONS, type PictureSummary } from "../library";
import type { libraryContract } from "../library-server";
import { sendToThread, useSendLabel } from "../page/library-bridge";
import { previewRect, usePointerTracker } from "../windows";
import { ProgramMenuBar, ProgramStatusBar } from "./xp-chrome";
import {
  BACKGROUND_TOOLS,
  DEFAULT_CANVAS_SIZE,
  DEFAULT_PRIMARY,
  DEFAULT_SECONDARY,
  FILLED_TOOLS,
  PALETTE,
  PAPER,
  TOOLS,
  TOOL_SIZES,
  ZOOM_LEVELS,
  clampCanvasSize,
  clipRect,
  containsPoint,
  defaultSizes,
  floodFill,
  hexToRgba,
  knockOut,
  linePoints,
  pathBounds,
  rgbaToHex,
  shapeBounds,
  shapeColors,
  snapAngle,
  sprayDots,
  trimHistory,
  wrapText,
  type FillStyle,
  type Point,
  type Rect,
  type ToolId,
} from "./paint-core";
import { askText } from "../shell/ask-text";

interface Size {
  width: number;
  height: number;
}

interface Snapshot {
  size: Size;
  image: ImageData;
}

interface Stroke {
  tool: ToolId;
  color: string;
  /** The other color, which fills an outlined shape. */
  other: string;
  fill: FillStyle;
  width: number;
  start: Point;
  last: Point;
}

/** A Curve after its line lands: the first bend moves both control points, the second only the latter. */
interface Curve {
  color: string;
  width: number;
  start: Point;
  end: Point;
  controls: [Point, Point];
  bends: number;
}

/** A Polygon's placed corners, open until a click near the first corner or a double-click closes it. */
interface Polygon {
  color: string;
  other: string;
  fill: FillStyle;
  width: number;
  points: Point[];
  placedAt: number;
}

/** A selected region; `lifted` holds its pixels once a drag picks them up off the picture. */
interface Selection {
  rect: Rect;
  origin: Rect;
  /** The free-form outline, or null for a rectangle. */
  path: Point[] | null;
  lifted: HTMLCanvasElement | null;
  /** The lifted pixels as drawn, with the background knocked out when the selection is transparent. */
  shown: HTMLCanvasElement | null;
}

/** Toolbox reading order, row by row, so Tab moves through the grid the way it looks. */
const TOOL_ORDER: ToolId[] = [
  "freeform", "select", "eraser", "fill", "picker", "magnifier", "pencil", "brush",
  "airbrush", "text", "line", "curve", "rectangle", "polygon", "ellipse", "rounded",
];
const TOOL_AREAS: Record<ToolId, string> = {
  freeform: "1 / 1", select: "1 / 2", eraser: "2 / 1", fill: "2 / 2", picker: "3 / 1", magnifier: "3 / 2",
  pencil: "4 / 1", brush: "4 / 2", airbrush: "5 / 1", text: "5 / 2", line: "6 / 1", curve: "6 / 2",
  rectangle: "7 / 1", polygon: "7 / 2", ellipse: "8 / 1", rounded: "8 / 2",
};
const FILL_STYLES: readonly { id: FillStyle; label: string }[] = [
  { id: "outline", label: "Outline" },
  { id: "both", label: "Outline and fill" },
  { id: "fill", label: "Fill only" },
];

const TEXT_FONT = "Arial, Helvetica, sans-serif";
const TEXT_SIZE = 13;
const TEXT_LINE = 16;
/** A clicked, rather than dragged, text box's width. */
const TEXT_WIDTH = 160;
/** How often a held Airbrush sprays; each burst lays one dot per pixel of radius. */
const SPRAY_INTERVAL = 30;
/** XP's rounded rectangle corners, shrinking for shapes too small to hold them. */
const ROUND_RADIUS = 8;
/** A second Polygon click this soon after the last, on the last corner, closes the shape. */
const DOUBLE_CLICK_MS = 400;

const INK = "oklch(0.24 0.03 260)";
const UNTITLED = "untitled";
/** How many saved pictures File lists to open. */
const OPEN_LIMIT = 8;

let pictureName = UNTITLED;
const nameListeners = new Set<() => void>();

function setPictureName(name: string) {
  pictureName = name;
  for (const listener of nameListeners) listener();
}

/** Paint's Send, for the button in its window's title bar. */
let sendPicture: (() => void) | null = null;

export function sendOpenPicture() {
  sendPicture?.();
}

export function currentPictureName(): string {
  return pictureName;
}

/** The open picture's name, for Paint's title bar and taskbar button. */
export function usePictureName(): string {
  return useSyncExternalStore(
    (listener) => {
      nameListeners.add(listener);
      return () => nameListeners.delete(listener);
    },
    () => pictureName,
  );
}

function decodeImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Paint couldn't read that picture."));
    image.src = src;
  });
}

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
    case "freeform":
      body = <path d="M2 5 6 2 11 4 14 9 9 13 3 11Z" {...common} strokeWidth="1.1" strokeDasharray="2 1" />;
      break;
    case "select":
      body = <path d="M2.5 3.5h11v9h-11Z" {...common} strokeWidth="1.1" strokeDasharray="2 1" />;
      break;
    case "magnifier":
      body = (
        <>
          <circle cx="6.5" cy="6.5" r="4" fill="oklch(0.9 0.04 220)" stroke={INK} strokeWidth="1.3" />
          <path d="M9.5 9.5l4 4" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />
        </>
      );
      break;
    case "airbrush":
      body = (
        <>
          <path d="M2.5 7.5h5v6h-5Z" fill="oklch(0.75 0.02 250)" stroke={INK} strokeWidth="1.1" strokeLinejoin="round" />
          <path d="M4 7.5v-2h2v2M6 6h2" fill="none" stroke={INK} strokeWidth="1.1" />
          {[[10.5, 3], [12.5, 5], [10, 6.5], [13.5, 2], [14, 7], [12, 8.5]].map(([cx, cy]) => <circle key={`${cx},${cy}`} cx={cx} cy={cy} r="0.8" fill="oklch(0.62 0.19 250)" />)}
        </>
      );
      break;
    case "text":
      body = <path d="M3 14 8 2l5 12M5 10h6" {...common} />;
      break;
    case "curve":
      body = <path d="M3 13C3 4 13 12 13 3" {...common} strokeWidth="1.6" />;
      break;
    case "polygon":
      body = <path d="M2 13 5 3h6L8 8h6v5Z" {...common} />;
      break;
    case "rounded":
      body = <rect x="2.5" y="4" width="11" height="8" rx="2.5" {...common} />;
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
  if (tool === "airbrush") {
    // A fixed seed keeps each size's dot cloud the same on every render.
    let seed = size * 7919;
    const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const radius = size / 2 + 1;
    return (
      <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden>
        {sprayDots({ x: 8, y: 8 }, radius, size * 2, random).map((dot, index) => <rect key={index} x={dot.x - 0.5} y={dot.y - 0.5} width="1" height="1" fill={INK} />)}
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 36 12" width="36" height="12" aria-hidden>
      <rect x="2" y={6 - size / 2} width="32" height={size} fill={INK} />
    </svg>
  );
}

function FillGlyph({ style }: { style: FillStyle }) {
  return (
    <svg viewBox="0 0 36 12" width="36" height="12" aria-hidden>
      <rect x="6.5" y="1.5" width="23" height="9" fill={style === "outline" ? "none" : INK} fillOpacity={style === "both" ? 0.3 : 0.6} stroke={style === "fill" ? undefined : INK} />
    </svg>
  );
}

/** XP's opaque option draws its shapes over a filled backdrop; the transparent one leaves the backdrop out. */
function BackgroundGlyph({ transparent }: { transparent: boolean }) {
  return (
    <svg viewBox="0 0 36 12" width="36" height="12" aria-hidden>
      {!transparent && <rect x="8.5" y="0.5" width="19" height="11" fill={INK} fillOpacity={0.2} stroke={INK} />}
      <circle cx="14" cy="6" r="3" fill={INK} />
      <path d="M18.5 9h6l-3-6Z" fill={INK} />
    </svg>
  );
}

function ZoomGlyph({ level }: { level: number }) {
  return (
    <svg viewBox="0 0 36 12" width="36" height="12" aria-hidden>
      <text x="18" y="9.5" textAnchor="middle" fontSize="9" fill={INK}>{level}x</text>
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

/** Fills, then outlines, the current path in a shape's colors. */
function paintPath(ctx: CanvasRenderingContext2D, colors: { stroke: string | null; fill: string | null }) {
  if (colors.fill !== null) {
    ctx.fillStyle = colors.fill;
    ctx.fill();
  }
  if (colors.stroke !== null) {
    ctx.strokeStyle = colors.stroke;
    ctx.stroke();
  }
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
    ctx.stroke();
    return;
  }
  const bounds = shapeBounds(stroke.start, end, square);
  if (stroke.tool === "rectangle") {
    ctx.rect(bounds.x + offset, bounds.y + offset, bounds.width, bounds.height);
  } else if (stroke.tool === "rounded") {
    const radius = Math.min(ROUND_RADIUS, bounds.width / 2, bounds.height / 2);
    ctx.roundRect(bounds.x + offset, bounds.y + offset, bounds.width, bounds.height, radius);
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
  paintPath(ctx, shapeColors(stroke.fill, stroke.color, stroke.other));
}

function drawCurve(ctx: CanvasRenderingContext2D, curve: Curve) {
  const offset = curve.width % 2 === 1 ? 0.5 : 0;
  const [first, second] = curve.controls;
  ctx.strokeStyle = curve.color;
  ctx.lineWidth = curve.width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(curve.start.x + offset, curve.start.y + offset);
  ctx.bezierCurveTo(first.x + offset, first.y + offset, second.x + offset, second.y + offset, curve.end.x + offset, curve.end.y + offset);
  ctx.stroke();
}

/** An open polygon previews as its outline; a closed one lands in its fill style. */
function drawPolygon(ctx: CanvasRenderingContext2D, polygon: Polygon, points: readonly Point[], closed: boolean) {
  const offset = polygon.width % 2 === 1 ? 0.5 : 0;
  ctx.lineWidth = polygon.width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  points.forEach((point, index) => {
    if (index === 0) ctx.moveTo(point.x + offset, point.y + offset);
    else ctx.lineTo(point.x + offset, point.y + offset);
  });
  if (!closed) {
    ctx.strokeStyle = polygon.color;
    ctx.stroke();
    return;
  }
  ctx.closePath();
  paintPath(ctx, shapeColors(polygon.fill, polygon.color, polygon.other));
}

/** Traces a free-form selection's outline through its pixel centers. */
function traceOutline(ctx: CanvasRenderingContext2D, path: readonly Point[]) {
  ctx.beginPath();
  path.forEach((point, index) => {
    if (index === 0) ctx.moveTo(point.x + 0.5, point.y + 0.5);
    else ctx.lineTo(point.x + 0.5, point.y + 0.5);
  });
  ctx.closePath();
}

export function PaintApp() {
  const rootRef = useRef<HTMLDivElement>(null);
  const workRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const ratioRef = useRef(1);
  /** True while a pointer gesture owns the canvas. */
  const gestureRef = useRef(false);
  const curveRef = useRef<Curve | null>(null);
  const polygonRef = useRef<Polygon | null>(null);
  const selectionRef = useRef<Selection | null>(null);
  /** The text box being typed into, mirrored from state so one box can't be printed twice. */
  const textBoxRef = useRef<Rect | null>(null);
  /** The picture point the next zoom keeps in the middle of the view. */
  const focusRef = useRef<Point | null>(null);
  const track = usePointerTracker();
  const ghostRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<Snapshot[]>([]);
  const sizeRef = useRef<Size>(DEFAULT_CANVAS_SIZE);
  const [size, setSize] = useState<Size>(DEFAULT_CANVAS_SIZE);
  const [tool, setTool] = useState<ToolId>("pencil");
  const [previousTool, setPreviousTool] = useState<ToolId>("pencil");
  const [sizes, setSizes] = useState(defaultSizes);
  const [fillStyle, setFillStyle] = useState<FillStyle>("outline");
  const [transparent, setTransparent] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [textBox, setTextBox] = useState<Rect | null>(null);
  const [primary, setPrimary] = useState(DEFAULT_PRIMARY);
  const [secondary, setSecondary] = useState(DEFAULT_SECONDARY);
  const [canUndo, setCanUndo] = useState(false);
  const [dirty, setDirty] = useState(false);
  const rpc = useRpc<typeof libraryContract>();
  const [pictures, setPictures] = useState<PictureSummary[]>([]);
  /** The saved picture this canvas came from; null until the first save. */
  const [pictureId, setPictureId] = useState<string | null>(null);
  const name = usePictureName();
  const sendLabel = useSendLabel();

  const loadPictures = useCallback(() => {
    rpc.call("listPictures").then(({ pictures: list }) => setPictures(list), () => undefined);
  }, [rpc]);
  useEffect(loadPictures, [loadPictures]);
  useRealtime(LIBRARY_CHANNEL, (payload) => {
    if ((payload as { kind?: unknown } | null)?.kind === "pictures") loadPictures();
  });

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
    historyRef.current = trimHistory([...historyRef.current, snapshot], (entry) => entry.image.data.byteLength);
    setCanUndo(true);
    setDirty(true);
    return snapshot;
  };

  const undo = () => {
    if (gestureRef.current || discardPending()) return;
    const snapshot = historyRef.current.at(-1);
    if (snapshot === undefined) return;
    historyRef.current = historyRef.current.slice(0, -1);
    setCanUndo(historyRef.current.length > 0);
    applySize(snapshot.size, snapshot.image);
  };

  const newPicture = () => {
    if ((dirty || hasPending()) && !window.confirm("Clear the picture? Unsaved changes will be lost.")) return;
    finishPending();
    remember();
    applySize(sizeRef.current, null);
    setDirty(false);
    setPictureId(null);
    setPictureName(UNTITLED);
  };

  /** The picture at its own size, as Paint saves it. */
  const flatten = (): HTMLCanvasElement | null => {
    finishPending();
    const canvas = canvasRef.current;
    if (canvas === null) return null;
    const output = document.createElement("canvas");
    output.width = sizeRef.current.width;
    output.height = sizeRef.current.height;
    const ctx = output.getContext("2d");
    if (ctx === null) return null;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(canvas, 0, 0, output.width, output.height);
    return output;
  };

  const exportPng = () => {
    flatten()?.toBlob((blob) => {
      if (blob === null) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${name}.png`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, "image/png");
  };

  /** Saves into the Desktop's pictures, where agents can see it; asks for a name the first time or for Save As. */
  const save = async (asNew = false): Promise<PictureSummary | null> => {
    const output = flatten();
    if (output === null) return null;
    let nextName = name;
    if (pictureId === null || asNew) {
      const answer = await askText({ title: "Save As", label: "File name:", initial: name === UNTITLED ? "" : name, confirmLabel: "Save" });
      if (answer === null) return null;
      nextName = answer.slice(0, 80);
    }
    try {
      const saved = await rpc.call("savePicture", {
        id: asNew ? null : pictureId,
        name: nextName,
        width: output.width,
        height: output.height,
        pngBase64: output.toDataURL("image/png").slice("data:image/png;base64,".length),
      });
      setPictureId(saved.id);
      setPictureName(saved.name);
      setDirty(false);
      toast(`Saved ${saved.name}`);
      return saved;
    } catch (error) {
      toast("Couldn't save the picture", { description: error instanceof Error ? error.message : String(error) });
      return null;
    }
  };

  const openPicture = async (summary: PictureSummary) => {
    if ((dirty || hasPending()) && !window.confirm(`Open ${summary.name}? Unsaved changes will be lost.`)) return;
    try {
      const picture = await rpc.call("getPicture", { id: summary.id });
      const image = await decodeImage(`data:${picture.mimeType};base64,${picture.dataBase64}`);
      finishPending();
      remember();
      applySize({ width: picture.width, height: picture.height }, null);
      const ctx = context(canvasRef.current);
      ctx?.drawImage(image, 0, 0, picture.width, picture.height);
      setDirty(false);
      setPictureId(picture.id);
      setPictureName(picture.name);
    } catch (error) {
      toast("Couldn't open the picture", { description: error instanceof Error ? error.message : String(error) });
    }
  };

  /** Saves the picture, then adds it to the message being written so the agent can see it. */
  const send = async () => {
    // Pending text or shapes aren't in `dirty` until they land, and this render's `dirty` wouldn't see it.
    const landed = finishPending();
    const saved = landed || dirty || pictureId === null ? await save() : null;
    const id = saved?.id ?? pictureId;
    if (id === null) return;
    sendToThread({ kind: PICTURE_MENTIONS, id, label: saved?.name ?? name });
  };

  sendPicture = () => void send();
  useEffect(() => () => {
    sendPicture = null;
  }, []);

  const clearOverlay = () => {
    const overlay = overlayRef.current;
    const ctx = overlay?.getContext("2d");
    if (overlay == null || ctx == null) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, overlay.width, overlay.height);
  };

  /** The dashed selection frame is an element, not overlay ink, so it stays one pixel thin at every zoom. */
  const showFrame = (rect: Rect | null) => {
    const frame = frameRef.current;
    if (frame === null) return;
    frame.hidden = rect === null;
    if (rect !== null) previewRect(frame, { x: rect.x * zoom, y: rect.y * zoom, width: rect.width * zoom, height: rect.height * zoom });
  };

  /** Redraws the selection: its frame, plus its pixels on the overlay once they've been lifted. */
  const drawSelection = () => {
    clearOverlay();
    const selection = selectionRef.current;
    showFrame(selection?.rect ?? null);
    const ctx = overlayRef.current?.getContext("2d");
    if (selection?.shown == null || ctx == null) return;
    const ratio = ratioRef.current;
    ctx.drawImage(selection.shown, Math.round(selection.rect.x * ratio), Math.round(selection.rect.y * ratio));
  };

  /** What a lifted selection shows: in transparent mode its background-colored pixels drop out, as in XP. */
  const refreshShown = (selection: Selection) => {
    const lifted = selection.lifted;
    if (lifted === null) return;
    if (!transparent) {
      selection.shown = lifted;
      return;
    }
    const shown = document.createElement("canvas");
    shown.width = lifted.width;
    shown.height = lifted.height;
    const ctx = shown.getContext("2d", { willReadFrequently: true });
    if (ctx === null) return;
    ctx.drawImage(lifted, 0, 0);
    const image = ctx.getImageData(0, 0, shown.width, shown.height);
    knockOut(image.data, hexToRgba(secondary));
    ctx.putImageData(image, 0, 0);
    selection.shown = shown;
  };

  const fillRegion = (ctx: CanvasRenderingContext2D, selection: Selection, color: string) => {
    const { origin, path } = selection;
    ctx.fillStyle = color;
    if (path === null) {
      ctx.fillRect(origin.x, origin.y, origin.width, origin.height);
      return;
    }
    traceOutline(ctx, path);
    ctx.fill();
  };

  /** Picks a selection's pixels up off the picture, leaving the background color behind unless it's a copy. */
  const lift = (selection: Selection, copy: boolean) => {
    const canvas = canvasRef.current;
    if (canvas === null) return;
    const ratio = ratioRef.current;
    const { origin, path } = selection;
    const lifted = document.createElement("canvas");
    lifted.width = Math.max(1, Math.round(origin.width * ratio));
    lifted.height = Math.max(1, Math.round(origin.height * ratio));
    const ctx = lifted.getContext("2d");
    if (ctx === null) return;
    if (path !== null) {
      ctx.setTransform(ratio, 0, 0, ratio, -origin.x * ratio, -origin.y * ratio);
      traceOutline(ctx, path);
      ctx.clip();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    ctx.drawImage(canvas, Math.round(origin.x * ratio), Math.round(origin.y * ratio), lifted.width, lifted.height, 0, 0, lifted.width, lifted.height);
    remember();
    const main = context(canvas);
    if (!copy && main !== null) fillRegion(main, selection, secondary);
    selection.lifted = lifted;
    refreshShown(selection);
  };

  /** Puts a lifted selection's pixels down where it sits. */
  const printSelection = (selection: Selection) => {
    const ctx = canvasRef.current?.getContext("2d");
    if (selection.shown === null || ctx == null) return;
    const ratio = ratioRef.current;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(selection.shown, Math.round(selection.rect.x * ratio), Math.round(selection.rect.y * ratio));
  };

  /** Ends the selection; `land` puts lifted pixels down, otherwise they're thrown away. */
  const dropSelection = (land: boolean) => {
    const selection = selectionRef.current;
    if (selection === null) return;
    selectionRef.current = null;
    showFrame(null);
    clearOverlay();
    if (land) printSelection(selection);
  };

  /** Delete: an unmoved selection clears to the background color; a lifted one already left that behind. */
  const deleteSelection = () => {
    const selection = selectionRef.current;
    if (selection === null) return;
    if (selection.lifted === null) {
      remember();
      const ctx = context(canvasRef.current);
      if (ctx !== null) fillRegion(ctx, selection, secondary);
    }
    dropSelection(false);
  };

  /** Prints the typed text into its box in the primary color, over the background color unless transparent. */
  const commitText = () => {
    const box = textBoxRef.current;
    if (box === null) return;
    const typed = textRef.current?.value ?? "";
    if (document.activeElement === textRef.current) rootRef.current?.focus({ preventScroll: true });
    textBoxRef.current = null;
    setTextBox(null);
    if (typed.trim() === "") return;
    remember();
    const ctx = context(canvasRef.current);
    if (ctx === null) return;
    ctx.save();
    ctx.beginPath();
    ctx.rect(box.x, box.y, box.width, box.height);
    ctx.clip();
    if (!transparent) {
      ctx.fillStyle = secondary;
      ctx.fillRect(box.x, box.y, box.width, box.height);
    }
    ctx.font = `${TEXT_SIZE}px ${TEXT_FONT}`;
    ctx.fillStyle = primary;
    ctx.textBaseline = "middle";
    wrapText(typed, box.width, (line) => ctx.measureText(line).width, Math.ceil(box.height / TEXT_LINE)).forEach((line, index) => {
      ctx.fillText(line, box.x, box.y + index * TEXT_LINE + TEXT_LINE / 2);
    });
    ctx.restore();
  };

  /** The text box grows downward as lines are typed, as far as the picture's bottom edge. */
  const growText = (event: FormEvent<HTMLTextAreaElement>) => {
    const box = textBoxRef.current;
    const area = event.currentTarget;
    if (box === null || area.scrollHeight <= area.clientHeight) return;
    const height = Math.min(sizeRef.current.height - box.y, Math.ceil(area.scrollHeight / zoom));
    if (height <= box.height) return;
    const next = { ...box, height };
    textBoxRef.current = next;
    setTextBox(next);
  };

  const previewCurve = (curve: Curve) => {
    clearOverlay();
    const ctx = context(overlayRef.current);
    if (ctx !== null) drawCurve(ctx, curve);
  };

  const closePolygon = (polygon: Polygon) => {
    polygonRef.current = null;
    clearOverlay();
    if (polygon.points.length < 2) return;
    remember();
    const ctx = context(canvasRef.current);
    if (ctx !== null) drawPolygon(ctx, polygon, polygon.points, true);
  };

  /** True when a multi-step tool holds work that landing it would put on the picture. */
  const hasPending = () =>
    selectionRef.current?.lifted != null ||
    curveRef.current !== null ||
    (polygonRef.current?.points.length ?? 0) >= 2 ||
    (textBoxRef.current !== null && (textRef.current?.value ?? "").trim() !== "");

  /** Lands whatever a multi-step tool still holds: a selection, text, a curve or an open polygon. True when it landed any. */
  const finishPending = (): boolean => {
    const landed = hasPending();
    dropSelection(true);
    commitText();
    const curve = curveRef.current;
    const polygon = polygonRef.current;
    curveRef.current = null;
    clearOverlay();
    if (curve !== null) {
      remember();
      const ctx = context(canvasRef.current);
      if (ctx !== null) drawCurve(ctx, curve);
    }
    if (polygon !== null) closePolygon(polygon);
    return landed;
  };

  /** Throws it away instead. True when what it threw away never reached the undo history, so Undo is done. */
  const discardPending = (): boolean => {
    const unrecorded =
      curveRef.current !== null || polygonRef.current !== null || textBoxRef.current !== null || selectionRef.current?.lifted === null;
    curveRef.current = null;
    polygonRef.current = null;
    textBoxRef.current = null;
    setTextBox(null);
    dropSelection(false);
    clearOverlay();
    return unrecorded;
  };

  /** Escape abandons a curve or polygon and lets a selection go where it sits. */
  const escapePending = (): boolean => {
    if (selectionRef.current === null && curveRef.current === null && polygonRef.current === null) return false;
    dropSelection(true);
    curveRef.current = null;
    polygonRef.current = null;
    clearOverlay();
    return true;
  };

  /** Zooms, keeping `focus` (a picture point), or else the middle of the current view, centered. */
  const zoomTo = (level: number, focus: Point | null) => {
    const work = workRef.current;
    focusRef.current =
      focus ?? (work === null ? null : { x: (work.scrollLeft + work.clientWidth / 2) / zoom, y: (work.scrollTop + work.clientHeight / 2) / zoom });
    setZoom(level);
  };

  useLayoutEffect(() => {
    const work = workRef.current;
    const focus = focusRef.current;
    focusRef.current = null;
    if (work !== null && focus !== null) {
      work.scrollLeft = focus.x * zoom - work.clientWidth / 2;
      work.scrollTop = focus.y * zoom - work.clientHeight / 2;
    }
    showFrame(selectionRef.current?.rect ?? null);
  }, [zoom]);

  // Switching between opaque and transparent, or picking a new background color, redraws a lifted selection live.
  useEffect(() => {
    const selection = selectionRef.current;
    if (selection?.lifted == null) return;
    refreshShown(selection);
    drawSelection();
  }, [transparent, secondary]);

  const selectTool = (next: ToolId) => {
    if (next === tool) return;
    finishPending();
    // The picker and the Magnifier hand back to the tool they interrupted.
    if ((next === "picker" || next === "magnifier") && tool !== "picker" && tool !== "magnifier") setPreviousTool(tool);
    setTool(next);
  };

  const onCanvasPointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (event.button !== 0 || event.isPrimary === false || gestureRef.current) return;
    event.preventDefault();
    rootRef.current?.focus({ preventScroll: true });
    const bounds = event.currentTarget.getBoundingClientRect();
    const logicalSize = sizeRef.current;
    const toPoint = (pointer: { clientX: number; clientY: number }): Point => ({
      x: Math.floor((pointer.clientX - bounds.left) * logicalSize.width / bounds.width),
      y: Math.floor((pointer.clientY - bounds.top) * logicalSize.height / bounds.height),
    });
    const point = toPoint(event);
    const alternate = event.altKey;
    const canvas = canvasRef.current;
    if (canvas === null) return;
    const inside = point.x >= 0 && point.y >= 0 && point.x < logicalSize.width && point.y < logicalSize.height;

    // A click away from the text being typed prints it, as in XP; it doesn't start another box.
    if (textBoxRef.current !== null) {
      commitText();
      return;
    }

    if (tool === "picker") {
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (ctx === null || !inside) return;
      const ratio = ratioRef.current;
      const [r, g, b] = ctx.getImageData(Math.floor(point.x * ratio), Math.floor(point.y * ratio), 1, 1).data;
      const picked = rgbaToHex(r ?? 0, g ?? 0, b ?? 0);
      if (alternate) setSecondary(picked);
      else setPrimary(picked);
      setTool(previousTool);
      return;
    }

    if (tool === "magnifier") {
      const index = Math.max(0, ZOOM_LEVELS.indexOf(zoom));
      const level = ZOOM_LEVELS[alternate ? Math.max(0, index - 1) : Math.min(ZOOM_LEVELS.length - 1, index + 1)] ?? 1;
      zoomTo(level, point);
      setTool(previousTool);
      return;
    }

    if (tool === "fill") {
      if (!inside) return;
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

    if (tool === "select" || tool === "freeform") {
      const held = selectionRef.current;
      if (held !== null && containsPoint(held.rect, point)) {
        // The first movement lifts the pixels (Option leaves the original behind); Option on lifted pixels prints a copy first.
        const from = held.rect;
        let started = false;
        gestureRef.current = true;
        track(event, (_delta, pointer) => {
          const next = toPoint(pointer);
          if (!started) {
            started = true;
            if (held.lifted === null) lift(held, alternate);
            else if (alternate) {
              printSelection(held);
              remember();
            }
          }
          held.rect = { ...from, x: from.x + next.x - point.x, y: from.y + next.y - point.y };
          drawSelection();
        }, (cancelled) => {
          gestureRef.current = false;
          if (!cancelled) return;
          held.rect = from;
          drawSelection();
        }, { threshold: 0 });
        return;
      }
      dropSelection(true);
      const free = tool === "freeform";
      const path: Point[] = [point];
      let rect: Rect | null = null;
      gestureRef.current = true;
      track(event, (_delta, pointer) => {
        const next = toPoint(pointer);
        if (free) {
          const ctx = context(overlayRef.current);
          if (ctx !== null) {
            ctx.fillStyle = "#000000";
            for (const dot of linePoints(path.at(-1) ?? point, next)) ctx.fillRect(dot.x, dot.y, 1, 1);
          }
          path.push(next);
        } else {
          rect = clipRect(shapeBounds(point, next, false), logicalSize.width, logicalSize.height);
          showFrame(rect);
        }
      }, (cancelled) => {
        gestureRef.current = false;
        clearOverlay();
        showFrame(null);
        const area = free ? (path.length > 2 ? pathBounds(path, logicalSize.width, logicalSize.height) : null) : rect;
        if (cancelled || area === null) return;
        selectionRef.current = { rect: area, origin: area, path: free ? path : null, lifted: null, shown: null };
        drawSelection();
      }, { threshold: 0, samples: free });
      return;
    }

    if (tool === "text") {
      let rect: Rect | null = null;
      gestureRef.current = true;
      track(event, (_delta, pointer) => {
        rect = clipRect(shapeBounds(point, toPoint(pointer), false), logicalSize.width, logicalSize.height);
        showFrame(rect);
      }, (cancelled) => {
        gestureRef.current = false;
        showFrame(null);
        if (cancelled || !inside) return;
        // A drag sets the box; a click, or a drag too small to type in, opens a one-line box at the pointer,
        // nudged in from the right and bottom edges so it isn't clipped to a sliver.
        const dragged: Rect | null = rect;
        const at = {
          x: Math.max(0, Math.min(point.x, logicalSize.width - TEXT_WIDTH)),
          y: Math.max(0, Math.min(point.y, logicalSize.height - TEXT_LINE)),
        };
        const box =
          dragged !== null && dragged.width >= TEXT_SIZE && dragged.height >= TEXT_LINE / 2
            ? dragged
            : clipRect({ ...at, width: TEXT_WIDTH, height: TEXT_LINE }, logicalSize.width, logicalSize.height);
        if (box === null) return;
        textBoxRef.current = box;
        setTextBox(box);
      }, { threshold: 0 });
      return;
    }

    if (tool === "airbrush") {
      const color = alternate ? secondary : primary;
      const radius = sizes.airbrush;
      let at = point;
      const spray = () => {
        const ctx = context(canvasRef.current);
        if (ctx === null) return;
        ctx.fillStyle = color;
        for (const dot of sprayDots(at, radius, radius)) ctx.fillRect(dot.x, dot.y, 1, 1);
      };
      remember();
      spray();
      // XP's airbrush keeps spraying while the pointer rests, so a timer lays the paint and movement only aims it.
      const timer = window.setInterval(spray, SPRAY_INTERVAL);
      gestureRef.current = true;
      track(event, (_delta, pointer) => {
        at = toPoint(pointer);
      }, () => {
        gestureRef.current = false;
        window.clearInterval(timer);
      }, { threshold: 0 });
      return;
    }

    if (tool === "curve") {
      const held = curveRef.current;
      gestureRef.current = true;
      if (held === null) {
        const curve: Curve = { color: alternate ? secondary : primary, width: sizes.curve, start: point, end: point, controls: [point, point], bends: 0 };
        track(event, (_delta, pointer) => {
          const next = toPoint(pointer);
          curve.end = pointer.shiftKey ? snapAngle(point, next) : next;
          curve.controls = [curve.start, curve.end];
          previewCurve(curve);
        }, (cancelled) => {
          gestureRef.current = false;
          if (cancelled || (curve.end.x === curve.start.x && curve.end.y === curve.start.y)) clearOverlay();
          else curveRef.current = curve;
        }, { threshold: 0 });
        return;
      }
      // Each later click or drag bends the line: the first pulls both control points, the second only the latter.
      const bend = (at: Point) => {
        held.controls = held.bends === 0 ? [at, at] : [held.controls[0], at];
        previewCurve(held);
      };
      bend(point);
      track(event, (_delta, pointer) => bend(toPoint(pointer)), (cancelled) => {
        gestureRef.current = false;
        if (cancelled) {
          curveRef.current = null;
          clearOverlay();
          return;
        }
        held.bends += 1;
        if (held.bends < 2) return;
        curveRef.current = null;
        clearOverlay();
        remember();
        const ctx = context(canvasRef.current);
        if (ctx !== null) drawCurve(ctx, held);
      }, { threshold: 0 });
      return;
    }

    if (tool === "polygon") {
      const held = polygonRef.current;
      const near = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y) <= Math.max(1, 4 / zoom);
      const last = held?.points.at(-1);
      if (held !== null && last !== undefined && performance.now() - held.placedAt < DOUBLE_CLICK_MS && near(point, last)) {
        closePolygon(held);
        return;
      }
      const polygon: Polygon = held ?? {
        color: alternate ? secondary : primary,
        other: alternate ? primary : secondary,
        fill: fillStyle,
        width: sizes.polygon,
        points: [point],
        placedAt: 0,
      };
      const anchor = polygon.points.at(-1) ?? point;
      let corner = point;
      const preview = () => {
        clearOverlay();
        const ctx = context(overlayRef.current);
        if (ctx !== null) drawPolygon(ctx, polygon, [...polygon.points, corner], false);
      };
      preview();
      gestureRef.current = true;
      track(event, (_delta, pointer) => {
        const next = toPoint(pointer);
        corner = pointer.shiftKey ? snapAngle(anchor, next) : next;
        preview();
      }, (cancelled) => {
        gestureRef.current = false;
        if (cancelled) {
          polygonRef.current = null;
          clearOverlay();
          return;
        }
        // The first drag lays the first edge; after that, each click adds a corner, and one near the start closes it.
        const first = polygon.points[0] ?? point;
        if (held !== null && polygon.points.length >= 2 && near(corner, first)) {
          closePolygon(polygon);
          return;
        }
        if (corner.x !== anchor.x || corner.y !== anchor.y) polygon.points.push(corner);
        polygon.placedAt = performance.now();
        polygonRef.current = polygon;
        preview();
      }, { threshold: 0 });
      return;
    }

    const color = tool === "eraser" || alternate ? secondary : primary;
    const stroke: Stroke = { tool, color, other: alternate ? primary : secondary, fill: fillStyle, width: sizes[tool], start: point, last: point };
    gestureRef.current = true;
    // Shapes snapshot only once they land, so an Escape-cancelled shape leaves no undo step or dirty mark.
    if (tool === "pencil" || tool === "brush" || tool === "eraser") {
      remember();
      const ctx = context(canvas);
      if (ctx !== null) strokeSegment(ctx, stroke, point, point);
    }
    let square = event.shiftKey;
    track(event, (_delta, pointer) => {
      const next = toPoint(pointer);
      square = pointer.shiftKey;
      if (stroke.tool === "pencil" || stroke.tool === "brush" || stroke.tool === "eraser") {
        const ctx = context(canvasRef.current);
        if (ctx !== null) strokeSegment(ctx, stroke, stroke.last, next);
      } else {
        clearOverlay();
        const ctx = context(overlayRef.current);
        if (ctx !== null) drawShape(ctx, stroke, next, square);
      }
      stroke.last = next;
    }, (cancelled) => {
      gestureRef.current = false;
      clearOverlay();
      if (!cancelled && (stroke.tool === "line" || stroke.tool === "rectangle" || stroke.tool === "ellipse" || stroke.tool === "rounded")) {
        remember();
        const ctx = context(canvasRef.current);
        if (ctx !== null) drawShape(ctx, stroke, stroke.last, square);
      }
    }, { threshold: 0, samples: true });
  };

  /** Shows the move cursor over a selection that can be dragged. */
  const onCanvasPointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const selection = selectionRef.current;
    const canvas = event.currentTarget;
    let over = false;
    if (selection !== null && !gestureRef.current) {
      const bounds = canvas.getBoundingClientRect();
      over = containsPoint(selection.rect, {
        x: Math.floor((event.clientX - bounds.left) * sizeRef.current.width / bounds.width),
        y: Math.floor((event.clientY - bounds.top) * sizeRef.current.height / bounds.height),
      });
    }
    canvas.dataset.over = String(over);
  };

  const onHandlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || event.isPrimary === false || gestureRef.current) return;
    event.preventDefault();
    event.stopPropagation();
    finishPending();
    const start = sizeRef.current;
    let next = start;
    track(event, (delta) => {
      next = { width: clampCanvasSize(start.width + delta.x / zoom), height: clampCanvasSize(start.height + delta.y / zoom) };
      const ghost = ghostRef.current;
      if (ghost) {
        ghost.hidden = false;
        ghost.style.width = `${next.width * zoom}px`;
        ghost.style.height = `${next.height * zoom}px`;
      }
    }, (cancelled, moved) => {
      if (ghostRef.current) ghostRef.current.hidden = true;
      if (cancelled || !moved || (next.width === start.width && next.height === start.height)) return;
      const snapshot = remember();
      applySize(next, null);
      const ctx = canvasRef.current?.getContext("2d", { willReadFrequently: true });
      if (snapshot !== null && ctx != null) ctx.putImageData(snapshot.image, 0, 0);
    });
  };

  const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if ((event.ctrlKey || event.metaKey) && !event.altKey && event.key.toLowerCase() === "s") {
      event.preventDefault();
      // As with Undo, a curve or polygon mid-gesture would land twice: once by the save, again when the gesture ends.
      if (!gestureRef.current) void save(event.shiftKey);
      return;
    }
    // Everything else typed into the text box is the text's own, Undo included.
    if (event.target instanceof HTMLTextAreaElement) return;
    if ((event.ctrlKey || event.metaKey) && !event.shiftKey && !event.altKey && event.key.toLowerCase() === "z") {
      event.preventDefault();
      undo();
    } else if ((event.key === "Delete" || event.key === "Backspace") && selectionRef.current !== null) {
      event.preventDefault();
      event.stopPropagation();
      deleteSelection();
    } else if (event.key === "Escape" && !event.defaultPrevented && escapePending()) {
      // A gesture's own Escape arrives already handled by the pointer tracker; this one is between gestures.
      event.preventDefault();
      event.stopPropagation();
    }
  };

  const toolLabel = TOOLS.find((entry) => entry.id === tool)?.label ?? tool;
  const background = BACKGROUND_TOOLS.includes(tool);
  // The options box holds whatever XP's held for the tool: zoom levels, opaque or transparent, or sizes.
  const options: { key: string; label: string; title: string; pressed: boolean; choose: () => void; glyph: ReactNode }[] =
    tool === "magnifier"
      ? ZOOM_LEVELS.map((level) => ({
          key: `${level}`,
          label: `Zoom ${level}x`,
          title: `${level}x`,
          pressed: zoom === level,
          choose: () => zoomTo(level, null),
          glyph: <ZoomGlyph level={level} />,
        }))
      : background
        ? [false, true].map((clear) => ({
            key: `${clear}`,
            label: clear ? "Transparent background" : "Opaque background",
            title: clear ? "Transparent" : "Opaque",
            pressed: transparent === clear,
            choose: () => setTransparent(clear),
            glyph: <BackgroundGlyph transparent={clear} />,
          }))
        : TOOL_SIZES[tool].map((value) => ({
            key: `${value}`,
            label: `${value} pixels`,
            title: `${value} px`,
            pressed: sizes[tool] === value,
            choose: () => setSizes((current) => ({ ...current, [tool]: value })),
            glyph: <SizeGlyph tool={tool} size={value} />,
          }));

  return (
    <div ref={rootRef} className="bbd-program bbd-paint flex h-full flex-col" tabIndex={-1} onKeyDown={onKeyDown}>
      <ProgramMenuBar menus={[
        { label: "File", items: [
          { label: "New", action: newPicture },
          ...(pictures.length === 0
            ? [{ label: "Open: no saved pictures", disabled: true }]
            : pictures.slice(0, OPEN_LIMIT).map((picture) => ({
                label: `Open ${picture.name}${picture.format === "svg" ? " (from an agent)" : ""}`,
                checked: picture.id === pictureId,
                action: () => void openPicture(picture),
              }))),
          "separator" as const,
          { label: "Save", shortcut: "Ctrl+S", action: () => void save() },
          { label: "Save As…", action: () => void save(true) },
          { label: "Export as PNG…", action: exportPng },
          "separator" as const,
          { label: sendLabel, action: () => void send() },
        ] },
        { label: "Edit", items: [{ label: "Undo", shortcut: "Ctrl+Z", disabled: !canUndo, action: undo }] },
        { label: "View", items: [
          { label: "Tool Box", checked: true },
          { label: "Color Box", checked: true },
          { label: "Status Bar", checked: true },
          "separator" as const,
          ...ZOOM_LEVELS.map((level) => ({ label: `Zoom ${level}x`, checked: zoom === level, action: () => zoomTo(level, null) })),
        ] },
        { label: "Image", items: [{ label: "Attributes…", disabled: true }, { label: "Clear Image", action: newPicture }] },
        { label: "Colors", items: [{ label: "Choose foreground: click a color" }, { label: "Choose background: right-click" }, { label: "Swap colors: double-click the two squares" }] },
        { label: "Help", items: [{ label: "Drag to draw; resize at bottom right" }] },
      ]} />
      <div className="flex min-h-0 flex-1">
        <div className="bbd-paint-toolbox flex-none">
          <div className="bbd-paint-tools" role="toolbar" aria-label="Tools">
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
          <div className="bbd-paint-sizes" role="radiogroup" aria-label={tool === "magnifier" ? "Zoom" : background ? "Background" : `${toolLabel} size`}>
            {options.map((option) => (
              <button
                key={option.key}
                type="button"
                role="radio"
                className="bbd-paint-size"
                data-pressed={option.pressed}
                aria-checked={option.pressed}
                aria-label={option.label}
                title={option.title}
                onClick={option.choose}
              >
                {option.glyph}
              </button>
            ))}
          </div>
          {FILLED_TOOLS.includes(tool) && (
            <div className="bbd-paint-sizes" role="radiogroup" aria-label="Fill style">
              {FILL_STYLES.map((style) => (
                <button
                  key={style.id}
                  type="button"
                  role="radio"
                  className="bbd-paint-size"
                  data-pressed={fillStyle === style.id}
                  aria-checked={fillStyle === style.id}
                  aria-label={style.label}
                  title={style.label}
                  onClick={() => setFillStyle(style.id)}
                >
                  <FillGlyph style={style.id} />
                </button>
              ))}
            </div>
          )}
        </div>
        <div ref={workRef} className="bbd-paint-work min-h-0 min-w-0 flex-1">
          <div className="bbd-paint-sheet" data-zoomed={zoom > 1} style={{ width: size.width * zoom, height: size.height * zoom }}>
            <canvas
              ref={canvasRef}
              className="bbd-paint-canvas"
              data-tool={tool}
              style={{ width: size.width * zoom, height: size.height * zoom }}
              aria-label={`Picture, ${size.width} by ${size.height} pixels`}
              role="img"
              onPointerDown={onCanvasPointerDown}
              onPointerMove={onCanvasPointerMove}
              onContextMenu={(event) => event.preventDefault()}
            />
            <canvas
              ref={overlayRef}
              className="bbd-paint-overlay"
              style={{ width: size.width * zoom, height: size.height * zoom }}
              aria-hidden
            />
            <div ref={frameRef} className="bbd-paint-frame" hidden aria-hidden />
            {textBox !== null && (
              <textarea
                ref={textRef}
                className="bbd-paint-text"
                aria-label="Text"
                autoFocus
                spellCheck={false}
                style={{
                  left: textBox.x * zoom,
                  top: textBox.y * zoom,
                  width: textBox.width * zoom,
                  height: textBox.height * zoom,
                  font: `${TEXT_SIZE * zoom}px/${TEXT_LINE * zoom}px ${TEXT_FONT}`,
                  color: primary,
                  background: transparent ? "transparent" : secondary,
                }}
                onInput={growText}
                onKeyDown={(event) => {
                  if (event.key !== "Escape") return;
                  event.preventDefault();
                  event.stopPropagation();
                  textBoxRef.current = null;
                  setTextBox(null);
                  rootRef.current?.focus({ preventScroll: true });
                }}
              />
            )}
            <div ref={ghostRef} className="bbd-paint-ghost" hidden aria-hidden />
            <div
              className="bbd-paint-handle"
              role="separator"
              aria-label="Resize picture"
              title="Resize picture"
              onPointerDown={onHandlePointerDown}
            />
          </div>
        </div>
      </div>
      <div className="bbd-paint-colorbox flex-none">
        <div
          className="bbd-paint-current"
          aria-label={`Primary ${primary}, secondary ${secondary}`}
          role="img"
          title="Double-click to swap colors"
          onDoubleClick={() => {
            setPrimary(secondary);
            setSecondary(primary);
          }}
        >
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
