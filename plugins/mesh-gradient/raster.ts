import {
  contrastReportFor,
  relativeLuminance,
  type ContrastReport,
  type MeshGradientSpec,
} from "./gradient.js";

export interface SurfacePreset {
  id: string;
  label: string;
  /** Export pixel size; also fixes the preview's aspect ratio. */
  width: number;
  height: number;
  /** Sample copy drawn over the preview so legibility is judged in context. */
  overlay: "none" | "headline" | "avatar";
  hint: string;
}

export const SURFACE_PRESETS: SurfacePreset[] = [
  {
    id: "canvas",
    label: "Canvas",
    width: 1600,
    height: 1000,
    overlay: "none",
    hint: "Free-form editing surface",
  },
  {
    id: "og",
    label: "OG card",
    width: 1200,
    height: 630,
    overlay: "headline",
    hint: "Link unfurls on X, Slack, iMessage",
  },
  {
    id: "hero",
    label: "Hero",
    width: 1600,
    height: 900,
    overlay: "headline",
    hint: "Marketing hero behind a headline",
  },
  {
    id: "avatar",
    label: "Avatar",
    width: 400,
    height: 400,
    overlay: "avatar",
    hint: "Circular identity mark",
  },
];

export function presetById(id: string): SurfacePreset {
  return SURFACE_PRESETS.find((preset) => preset.id === id) ?? SURFACE_PRESETS[0];
}

function hslaString(
  hue: number,
  saturation: number,
  lightness: number,
  alpha: number,
): string {
  // hsla() rather than `transparent`: a transparent stop interpolates through
  // rgba(0,0,0,0) in canvas and fringes every layer with grey.
  return `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`;
}

/**
 * Canvas twin of `toCssLayers` — same base fill plus one radial layer per
 * point, so a PNG export and the CSS a browser paints agree.
 */
export function drawMeshGradient(
  context: CanvasRenderingContext2D,
  spec: MeshGradientSpec,
  width: number,
  height: number,
): void {
  const points = spec.points;
  const first = points[0];
  if (!first) throw new Error("mesh gradient has no points");
  context.clearRect(0, 0, width, height);
  context.fillStyle = hslaString(
    first.hue,
    first.saturation,
    Math.max(8, Math.round(first.lightness * 0.45 * 10) / 10),
    1,
  );
  context.fillRect(0, 0, width, height);
  const longest = Math.max(width, height);
  // CSS paints the first background image on top. Canvas uses painter's
  // order, so draw the first CSS layer last to preserve the same stacking.
  for (const point of [...points].reverse()) {
    const cx = (point.x / 100) * width;
    const cy = (point.y / 100) * height;
    const radius = Math.max(1, (point.radius / 100) * longest);
    const gradient = context.createRadialGradient(cx, cy, 0, cx, cy, radius);
    gradient.addColorStop(
      0,
      hslaString(point.hue, point.saturation, point.lightness, 1),
    );
    gradient.addColorStop(
      1,
      hslaString(point.hue, point.saturation, point.lightness, 0),
    );
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);
  }
}

function createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

/**
 * Sample a coarse grid and score both candidate text colors. Small on purpose:
 * this runs on every edit and only needs the luminance envelope.
 */
export function measureContrast(
  spec: MeshGradientSpec,
  options: { width?: number; height?: number } = {},
): ContrastReport | null {
  const width = options.width ?? 64;
  const height = options.height ?? 40;
  const canvas = createCanvas(width, height);
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return null;
  drawMeshGradient(context, spec, width, height);
  let data: Uint8ClampedArray;
  try {
    data = context.getImageData(0, 0, width, height).data;
  } catch {
    return null;
  }
  const luminances: number[] = [];
  for (let index = 0; index < data.length; index += 4) {
    luminances.push(
      relativeLuminance(data[index], data[index + 1], data[index + 2]),
    );
  }
  return luminances.length ? contrastReportFor(luminances) : null;
}

export async function renderPngDataUrl(
  spec: MeshGradientSpec,
  preset: SurfacePreset,
): Promise<string> {
  const canvas = createCanvas(preset.width, preset.height);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("this browser has no 2D canvas context");
  drawMeshGradient(context, spec, preset.width, preset.height);
  return canvas.toDataURL("image/png");
}

export function base64FromDataUrl(dataUrl: string): string {
  const comma = dataUrl.indexOf(",");
  if (comma === -1) throw new Error("malformed data URL");
  return dataUrl.slice(comma + 1);
}
