export type ToolId =
  | "freeform"
  | "select"
  | "eraser"
  | "fill"
  | "picker"
  | "magnifier"
  | "pencil"
  | "brush"
  | "airbrush"
  | "text"
  | "line"
  | "curve"
  | "rectangle"
  | "polygon"
  | "ellipse"
  | "rounded";

/** XP's three shape styles: outline only, outline filled with the other color, or a solid fill. */
export type FillStyle = "outline" | "both" | "fill";

export type Rgba = [number, number, number, number];

export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const TOOLS: readonly { id: ToolId; label: string }[] = [
  { id: "pencil", label: "Pencil" },
  { id: "brush", label: "Brush" },
  { id: "eraser", label: "Eraser" },
  { id: "fill", label: "Fill with color" },
  { id: "line", label: "Line" },
  { id: "picker", label: "Pick color" },
  { id: "rectangle", label: "Rectangle" },
  { id: "ellipse", label: "Ellipse" },
  { id: "freeform", label: "Free-form select" },
  { id: "select", label: "Select" },
  { id: "magnifier", label: "Magnifier" },
  { id: "airbrush", label: "Airbrush" },
  { id: "text", label: "Text" },
  { id: "curve", label: "Curve" },
  { id: "polygon", label: "Polygon" },
  { id: "rounded", label: "Rounded rectangle" },
];

/** Tools whose options box offers XP's fill styles. */
export const FILLED_TOOLS: readonly ToolId[] = ["rectangle", "polygon", "ellipse", "rounded"];

/** Tools whose options box offers XP's opaque and transparent backgrounds. */
export const BACKGROUND_TOOLS: readonly ToolId[] = ["freeform", "select", "text"];

/** The Magnifier's levels, as XP offered them. */
export const ZOOM_LEVELS: readonly number[] = [1, 2, 6, 8];

export const PALETTE: readonly string[] = [
  "#000000",
  "#808080",
  "#800000",
  "#808000",
  "#008000",
  "#008080",
  "#000080",
  "#800080",
  "#808040",
  "#004040",
  "#0080ff",
  "#004080",
  "#8000ff",
  "#804000",
  "#ffffff",
  "#c0c0c0",
  "#ff0000",
  "#ffff00",
  "#00ff00",
  "#00ffff",
  "#0000ff",
  "#ff00ff",
  "#ffff80",
  "#00ff80",
  "#80ffff",
  "#8080ff",
  "#ff0080",
  "#ff8040",
];

export const PAPER = "#ffffff";

export const DEFAULT_PRIMARY = "#000000";

export const DEFAULT_SECONDARY = "#ffffff";

export const DEFAULT_CANVAS_SIZE = { width: 640, height: 400 };

export const MIN_CANVAS_SIZE = 16;

export const MAX_CANVAS_SIZE = 4096;

export const HISTORY_LIMIT = 20;

/** Undo keeps whole canvas copies, so it also stops at a memory budget: 20 steps at 640×400, one at 4096×4096. */
export const HISTORY_BYTES = 64 * 1024 * 1024;

/** The newest undo steps that fit both the step limit and the memory budget, always keeping the newest one. */
export function trimHistory<T>(history: readonly T[], bytesOf: (entry: T) => number): T[] {
  const kept: T[] = [];
  let bytes = 0;
  for (let index = history.length - 1; index >= 0 && kept.length < HISTORY_LIMIT; index -= 1) {
    const entry = history[index]!;
    bytes += bytesOf(entry);
    if (kept.length > 0 && bytes > HISTORY_BYTES) break;
    kept.unshift(entry);
  }
  return kept;
}

export const TOOL_SIZES: Record<ToolId, readonly number[]> = {
  pencil: [],
  brush: [2, 4, 7, 11],
  eraser: [4, 6, 8, 10],
  fill: [],
  line: [1, 2, 3, 4, 5],
  rectangle: [1, 2, 3, 4, 5],
  ellipse: [1, 2, 3, 4, 5],
  picker: [],
  freeform: [],
  select: [],
  magnifier: [],
  /** Spray radii. */
  airbrush: [4, 8, 12],
  text: [],
  curve: [1, 2, 3, 4, 5],
  polygon: [1, 2, 3, 4, 5],
  rounded: [1, 2, 3, 4, 5],
};

export function defaultSizes(): Record<ToolId, number> {
  return {
    pencil: 1,
    brush: 4,
    eraser: 8,
    fill: 1,
    line: 1,
    rectangle: 1,
    ellipse: 1,
    picker: 1,
    freeform: 1,
    select: 1,
    magnifier: 1,
    airbrush: 4,
    text: 1,
    curve: 1,
    polygon: 1,
    rounded: 1,
  };
}

export function hexToRgba(hex: string): Rgba {
  const body = hex.trim().replace(/^#/, "");
  if (!/^[0-9a-fA-F]+$/.test(body)) throw new Error(`Invalid hex color: ${hex}`);
  const expanded =
    body.length === 3 || body.length === 4
      ? body
          .split("")
          .map((digit) => digit + digit)
          .join("")
      : body;
  if (expanded.length !== 6 && expanded.length !== 8) throw new Error(`Invalid hex color: ${hex}`);
  const channel = (offset: number) => Number.parseInt(expanded.slice(offset, offset + 2), 16);
  return [channel(0), channel(2), channel(4), expanded.length === 8 ? channel(6) : 255];
}

export function rgbaToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((value) => Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, "0")).join("")}`;
}

export function linePoints(from: Point, to: Point): Point[] {
  let x = Math.round(from.x);
  let y = Math.round(from.y);
  const endX = Math.round(to.x);
  const endY = Math.round(to.y);
  const dx = Math.abs(endX - x);
  const dy = -Math.abs(endY - y);
  const stepX = x < endX ? 1 : -1;
  const stepY = y < endY ? 1 : -1;
  let error = dx + dy;
  const points: Point[] = [];
  for (;;) {
    points.push({ x, y });
    if (x === endX && y === endY) return points;
    const doubled = 2 * error;
    if (doubled >= dy) {
      error += dy;
      x += stepX;
    }
    if (doubled <= dx) {
      error += dx;
      y += stepY;
    }
  }
}

export function shapeBounds(from: Point, to: Point, square: boolean): Rect {
  let dx = to.x - from.x;
  let dy = to.y - from.y;
  if (square) {
    const side = Math.max(Math.abs(dx), Math.abs(dy));
    dx = dx < 0 ? -side : side;
    dy = dy < 0 ? -side : side;
  }
  return {
    x: Math.min(from.x, from.x + dx),
    y: Math.min(from.y, from.y + dy),
    width: Math.abs(dx),
    height: Math.abs(dy),
  };
}

export function clampCanvasSize(value: number): number {
  return Math.max(MIN_CANVAS_SIZE, Math.min(MAX_CANVAS_SIZE, Math.round(value)));
}

export function floodFill(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  x: number,
  y: number,
  rgba: [number, number, number, number],
): void {
  const seedX = Math.floor(x);
  const seedY = Math.floor(y);
  if (seedX < 0 || seedY < 0 || seedX >= width || seedY >= height) return;
  const origin = (seedY * width + seedX) * 4;
  const target = [pixels[origin], pixels[origin + 1], pixels[origin + 2], pixels[origin + 3]];
  if (target[0] === rgba[0] && target[1] === rgba[1] && target[2] === rgba[2] && target[3] === rgba[3]) return;
  const matches = (px: number, py: number) => {
    const index = (py * width + px) * 4;
    return (
      pixels[index] === target[0] &&
      pixels[index + 1] === target[1] &&
      pixels[index + 2] === target[2] &&
      pixels[index + 3] === target[3]
    );
  };
  const stack: number[] = [seedX, seedY];
  while (stack.length > 0) {
    const py = stack.pop()!;
    const px = stack.pop()!;
    if (!matches(px, py)) continue;
    let left = px;
    while (left > 0 && matches(left - 1, py)) left -= 1;
    let right = px;
    while (right < width - 1 && matches(right + 1, py)) right += 1;
    for (let cx = left; cx <= right; cx += 1) {
      const index = (py * width + cx) * 4;
      pixels[index] = rgba[0];
      pixels[index + 1] = rgba[1];
      pixels[index + 2] = rgba[2];
      pixels[index + 3] = rgba[3];
    }
    for (const ny of [py - 1, py + 1]) {
      if (ny < 0 || ny >= height) continue;
      let inRun = false;
      for (let cx = left; cx <= right; cx += 1) {
        if (matches(cx, ny)) {
          if (!inRun) {
            stack.push(cx, ny);
            inRun = true;
          }
        } else {
          inRun = false;
        }
      }
    }
  }
}

/** Shift's constraint for line-like edges: the end moves to the nearest horizontal, vertical or 45° direction. */
export function snapAngle(from: Point, to: Point): Point {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const step = (((Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) % 8) + 8) % 8);
  if (step === 0 || step === 4) return { x: to.x, y: from.y };
  if (step === 2 || step === 6) return { x: from.x, y: to.y };
  const side = Math.max(Math.abs(dx), Math.abs(dy));
  return { x: from.x + (step === 1 || step === 7 ? side : -side), y: from.y + (step === 1 || step === 3 ? side : -side) };
}

/** Up to `count` random pixels inside a circle, as one burst of the Airbrush. */
export function sprayDots(center: Point, radius: number, count: number, random: () => number = Math.random): Point[] {
  const dots: Point[] = [];
  // Sampling the square and rejecting its corners keeps the cloud uniform; the attempt cap keeps a bad source finite.
  for (let attempt = 0; attempt < count * 4 && dots.length < count; attempt += 1) {
    const dx = Math.round((random() * 2 - 1) * radius);
    const dy = Math.round((random() * 2 - 1) * radius);
    if (dx * dx + dy * dy <= radius * radius) dots.push({ x: center.x + dx, y: center.y + dy });
  }
  return dots;
}

/** The part of a rect inside a width × height picture, or null when nothing is left. */
export function clipRect(rect: Rect, width: number, height: number): Rect | null {
  const left = Math.max(0, Math.min(rect.x, rect.x + rect.width));
  const top = Math.max(0, Math.min(rect.y, rect.y + rect.height));
  const right = Math.min(width, Math.max(rect.x, rect.x + rect.width));
  const bottom = Math.min(height, Math.max(rect.y, rect.y + rect.height));
  if (right <= left || bottom <= top) return null;
  return { x: left, y: top, width: right - left, height: bottom - top };
}

/** The pixels a free-form outline covers, clipped to the picture; each point is a whole pixel. */
export function pathBounds(points: readonly Point[], width: number, height: number): Rect | null {
  if (points.length === 0) return null;
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const left = Math.min(...xs);
  const top = Math.min(...ys);
  return clipRect({ x: left, y: top, width: Math.max(...xs) - left + 1, height: Math.max(...ys) - top + 1 }, width, height);
}

export function containsPoint(rect: Rect, point: Point): boolean {
  return point.x >= rect.x && point.y >= rect.y && point.x < rect.x + rect.width && point.y < rect.y + rect.height;
}

/** A transparent selection drops its pixels that match the background color, as XP's did. */
export function knockOut(pixels: Uint8ClampedArray, rgba: Rgba): void {
  for (let index = 0; index < pixels.length; index += 4) {
    if (pixels[index] === rgba[0] && pixels[index + 1] === rgba[1] && pixels[index + 2] === rgba[2]) pixels[index + 3] = 0;
  }
}

/** Which colors outline and fill a shape: the fill is the other color, and a solid shape uses the drawing color. */
export function shapeColors(style: FillStyle, color: string, other: string): { stroke: string | null; fill: string | null } {
  if (style === "outline") return { stroke: color, fill: null };
  if (style === "both") return { stroke: color, fill: other };
  return { stroke: null, fill: color };
}

/** Breaks typed text into lines no wider than `maxWidth`, splitting a word only when it alone is too wide. */
export function wrapText(text: string, maxWidth: number, measure: (text: string) => number): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    let line = "";
    for (const word of paragraph.split(/(?<= )/)) {
      if (measure(line + word.trimEnd()) <= maxWidth || line === "") {
        line += word;
      } else {
        lines.push(line.trimEnd());
        line = word;
      }
      while (measure(line.trimEnd()) > maxWidth && line.trimEnd().length > 1) {
        let cut = line.length - 1;
        while (cut > 1 && measure(line.slice(0, cut)) > maxWidth) cut -= 1;
        lines.push(line.slice(0, cut));
        line = line.slice(cut);
      }
    }
    lines.push(line.trimEnd());
  }
  return lines;
}
