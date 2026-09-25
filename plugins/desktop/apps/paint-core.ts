export type ToolId = "pencil" | "brush" | "eraser" | "fill" | "line" | "rectangle" | "ellipse" | "picker";

export type Rgba = [number, number, number, number];

export interface Point {
  x: number;
  y: number;
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
];

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

export const TOOL_SIZES: Record<ToolId, readonly number[]> = {
  pencil: [],
  brush: [2, 4, 7, 11],
  eraser: [4, 6, 8, 10],
  fill: [],
  line: [1, 2, 3, 4, 5],
  rectangle: [1, 2, 3, 4, 5],
  ellipse: [1, 2, 3, 4, 5],
  picker: [],
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

export function shapeBounds(from: Point, to: Point, square: boolean): { x: number; y: number; width: number; height: number } {
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
