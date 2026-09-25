type Rect = { left: number; top: number; right: number; bottom: number };
type Rgba = [number, number, number, number];

export interface ContextReport {
  width: number;
  height: number;
  panels: { x0: number; y0: number; x1: number; y1: number }[];
  openArea: number;
  openSpread: number;
  coveredSpread: number;
  text: {
    words: number;
    median: number;
    worst: number;
    hardToRead: number;
    examples: { x: number; y: number; contrast: number }[];
  };
}

export interface ContextCapture {
  dataUrl: string;
  report: ContextReport;
}

const MAX_ELEMENTS = 12_000;
const MAX_WORDS = 6_000;
const PANEL_MIN_AREA = 0.03;
const HARD_TO_READ = 3;
const COVERAGE_CELL = 16;

const EVERYWHERE: Rect = { left: -Infinity, top: -Infinity, right: Infinity, bottom: Infinity };

function intersect(a: Rect, b: Rect): Rect {
  return {
    left: Math.max(a.left, b.left),
    top: Math.max(a.top, b.top),
    right: Math.min(a.right, b.right),
    bottom: Math.min(a.bottom, b.bottom),
  };
}

function isEmpty(rect: Rect): boolean {
  return rect.right - rect.left < 1 || rect.bottom - rect.top < 1;
}

function colorParser(): (value: string) => Rgba {
  const probe = document.createElement("canvas");
  probe.width = 1;
  probe.height = 1;
  const context = probe.getContext("2d", { willReadFrequently: true });
  const cache = new Map<string, Rgba>();
  return (value) => {
    const cached = cache.get(value);
    if (cached) return cached;
    let parsed: Rgba = [0, 0, 0, 0];
    if (context && value && value !== "transparent") {
      context.clearRect(0, 0, 1, 1);
      context.fillStyle = "rgba(0, 0, 0, 0)";
      context.fillStyle = value;
      context.fillRect(0, 0, 1, 1);
      const [r, g, b, a] = context.getImageData(0, 0, 1, 1).data;
      parsed = [r! / 255, g! / 255, b! / 255, a! / 255];
    }
    cache.set(value, parsed);
    return parsed;
  };
}

function channel(value: number): number {
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function luminance(r: number, g: number, b: number): number {
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrast(a: number, b: number): number {
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

function backdrop(style: CSSStyleDeclaration): { blur: number; saturate: number } | null {
  const value = style.backdropFilter || style.getPropertyValue("-webkit-backdrop-filter");
  if (!value || value === "none") return null;
  const blur = /blur\(([\d.]+)px\)/.exec(value);
  const saturate = /saturate\(([\d.]+)\)/.exec(value);
  return { blur: blur ? Number(blur[1]) : 0, saturate: saturate ? Number(saturate[1]) : 1 };
}

function pseudoRect(host: DOMRect, hostStyle: CSSStyleDeclaration, style: CSSStyleDeclaration): Rect | null {
  if (style.content === "none" || style.content === "normal" || style.display === "none") return null;
  if (style.position !== "absolute" && style.position !== "fixed") return null;
  const width = Number.parseFloat(style.width);
  const height = Number.parseFloat(style.height);
  if (!(width > 0 && height > 0)) return null;
  const left = Number.parseFloat(style.left);
  const top = Number.parseFloat(style.top);
  const originX = style.position === "fixed" ? 0 : host.left + Number.parseFloat(hostStyle.borderLeftWidth || "0");
  const originY = style.position === "fixed" ? 0 : host.top + Number.parseFloat(hostStyle.borderTopWidth || "0");
  const x = originX + (Number.isFinite(left) ? left : 0);
  const y = originY + (Number.isFinite(top) ? top : 0);
  return { left: x, top: y, right: x + width, bottom: y + height };
}

export function snapshotScene(scene: HTMLCanvasElement, maxWidth: number): HTMLCanvasElement {
  const scale = Math.min(1, maxWidth / window.innerWidth);
  const frame = document.createElement("canvas");
  frame.width = Math.round(window.innerWidth * scale);
  frame.height = Math.round(window.innerHeight * scale);
  const context = frame.getContext("2d");
  if (!context) throw new Error("2D canvas unavailable");
  context.imageSmoothingQuality = "high";
  context.drawImage(scene, 0, 0, frame.width, frame.height);
  return frame;
}

export async function captureInContext(
  frame: HTMLCanvasElement,
  canvasColor: readonly [number, number, number],
): Promise<ContextCapture> {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const scale = frame.width / width;
  const output = document.createElement("canvas");
  output.width = frame.width;
  output.height = frame.height;
  const context = output.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("2D canvas unavailable");
  const toCss = () => context.setTransform(scale, 0, 0, scale, 0, 0);
  context.drawImage(frame, 0, 0);
  const sceneLumas = context.getImageData(0, 0, output.width, output.height).data;

  const parse = colorParser();
  const viewport: Rect = { left: 0, top: 0, right: width, bottom: height };
  const clips = new Map<Element, Rect>();
  const clipOf = (element: Element | null): Rect => {
    if (!element || element === document.body) return viewport;
    const cached = clips.get(element);
    if (cached) return cached;
    const style = getComputedStyle(element);
    let clip = style.position === "fixed" ? viewport : clipOf(element.parentElement);
    if (style.overflowX !== "visible" || style.overflowY !== "visible") {
      clip = intersect(clip, element.getBoundingClientRect());
    }
    clips.set(element, clip);
    return clip;
  };

  const panels: Rect[] = [];
  const paintBox = (box: Rect, style: CSSStyleDeclaration, clip: Rect, opacity: number) => {
    const visible = intersect(box, clip);
    if (isEmpty(visible)) return;
    const fill = parse(style.backgroundColor);
    const blur = backdrop(style);
    const border = Number.parseFloat(style.borderTopWidth || "0");
    const borderColor = border > 0 ? parse(style.borderTopColor) : null;
    if (fill[3] === 0 && !blur && !(borderColor && borderColor[3] > 0)) return;
    const w = box.right - box.left;
    const h = box.bottom - box.top;
    const radius = Math.min(Number.parseFloat(style.borderTopLeftRadius || "0") || 0, w / 2, h / 2);
    const area = ((visible.right - visible.left) * (visible.bottom - visible.top)) / (width * height);
    if (area >= PANEL_MIN_AREA && (blur || fill[3] >= 0.3)) panels.push(visible);
    context.save();
    toCss();
    context.globalAlpha = opacity;
    context.beginPath();
    context.rect(clip.left, clip.top, clip.right - clip.left, clip.bottom - clip.top);
    context.clip();
    context.beginPath();
    context.roundRect(box.left, box.top, w, h, radius);
    if (blur) {
      context.save();
      context.clip();
      const snapshot = document.createElement("canvas");
      snapshot.width = output.width;
      snapshot.height = output.height;
      snapshot.getContext("2d")?.drawImage(output, 0, 0);
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.filter = `blur(${blur.blur * scale}px) saturate(${blur.saturate})`;
      context.drawImage(snapshot, 0, 0);
      context.restore();
    }
    if (fill[3] > 0) {
      context.fillStyle = style.backgroundColor;
      context.fill();
    }
    if (borderColor && borderColor[3] > 0) {
      context.lineWidth = border;
      context.strokeStyle = style.borderTopColor;
      context.stroke();
    }
    context.restore();
  };

  const elements = Array.from(document.body.querySelectorAll("*")).slice(0, MAX_ELEMENTS);
  for (const element of elements) {
    if (element instanceof HTMLCanvasElement && element.hasAttribute("data-bb-ambient")) continue;
    if (element instanceof SVGElement) continue;
    const rect = element.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) continue;
    if (rect.right < 0 || rect.bottom < 0 || rect.left > width || rect.top > height) continue;
    if (!element.checkVisibility({ opacityProperty: true, visibilityProperty: true })) continue;
    const style = getComputedStyle(element);
    const opacity = Number(style.opacity) || 1;
    const clip = style.position === "fixed" ? viewport : clipOf(element.parentElement);
    paintBox(rect, style, clip, opacity);
    const inner = clipOf(element);
    for (const pseudo of ["::before", "::after"] as const) {
      const pseudoStyle = getComputedStyle(element, pseudo);
      const box = pseudoRect(rect, style, pseudoStyle);
      if (box) paintBox(box, pseudoStyle, inner, opacity);
    }
  }

  const words: { rect: Rect; size: number; color: string; rgba: Rgba }[] = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  const styles = new Map<Element, CSSStyleDeclaration>();
  for (let node = walker.nextNode(); node && words.length < MAX_WORDS; node = walker.nextNode()) {
    const parent = node.parentElement;
    const text = node.textContent ?? "";
    if (!parent || !text.trim() || parent.closest("svg, script, style, noscript, option")) continue;
    if (!parent.checkVisibility({ opacityProperty: true, visibilityProperty: true })) continue;
    let style = styles.get(parent);
    if (!style) {
      style = getComputedStyle(parent);
      styles.set(parent, style);
    }
    const color = style.color;
    const rgba = parse(color);
    if (rgba[3] === 0) continue;
    const size = Number.parseFloat(style.fontSize) || 12;
    const clip = clipOf(parent);
    for (const match of text.matchAll(/\S+/g)) {
      if (words.length >= MAX_WORDS) break;
      const start = match.index ?? 0;
      range.setStart(node, start);
      range.setEnd(node, start + match[0].length);
      const box = range.getBoundingClientRect();
      const visible = intersect(box, clip);
      if (isEmpty(visible) || visible.right - visible.left < (box.right - box.left) * 0.8) continue;
      words.push({ rect: box, size, color, rgba });
    }
  }

  const composite = context.getImageData(0, 0, output.width, output.height).data;
  const canvasLuma = luminance(...canvasColor);
  const scored = words.map((word) => {
    const x0 = Math.max(0, Math.floor(word.rect.left * scale));
    const x1 = Math.min(output.width, Math.ceil(word.rect.right * scale));
    const y0 = Math.max(0, Math.floor(word.rect.top * scale));
    const y1 = Math.min(output.height, Math.ceil(word.rect.bottom * scale));
    const ratios: number[] = [];
    let r = 0;
    let g = 0;
    let b = 0;
    let count = 0;
    for (let y = y0; y < y1; y += 2) {
      for (let x = x0; x < x1; x += 2) {
        const index = (y * output.width + x) * 4;
        r += composite[index]! / 255;
        g += composite[index + 1]! / 255;
        b += composite[index + 2]! / 255;
        count += 1;
      }
    }
    if (count === 0) return { word, contrast: Infinity, baseline: Infinity };
    const [tr, tg, tb, ta] = word.rgba;
    const mean = [r / count, g / count, b / count] as const;
    const text = luminance(tr * ta + mean[0] * (1 - ta), tg * ta + mean[1] * (1 - ta), tb * ta + mean[2] * (1 - ta));
    for (let y = y0; y < y1; y += 2) {
      for (let x = x0; x < x1; x += 2) {
        const index = (y * output.width + x) * 4;
        ratios.push(contrast(text, luminance(composite[index]! / 255, composite[index + 1]! / 255, composite[index + 2]! / 255)));
      }
    }
    ratios.sort((left, right) => left - right);
    const baselineText = luminance(
      tr * ta + canvasColor[0] * (1 - ta),
      tg * ta + canvasColor[1] * (1 - ta),
      tb * ta + canvasColor[2] * (1 - ta),
    );
    return {
      word,
      contrast: ratios[Math.floor(ratios.length * 0.1)] ?? Infinity,
      baseline: contrast(baselineText, canvasLuma),
    };
  });

  toCss();
  for (const { word } of scored) {
    const barHeight = word.size * 0.55;
    context.fillStyle = word.color;
    context.fillRect(word.rect.left, (word.rect.top + word.rect.bottom - barHeight) / 2, word.rect.right - word.rect.left, barHeight);
  }
  const hard = scored.filter(
    (entry) => Number.isFinite(entry.contrast) && entry.contrast < HARD_TO_READ && entry.contrast < entry.baseline * 0.75,
  );
  context.lineWidth = 1.5;
  context.strokeStyle = "#ff2d2d";
  for (const { word } of hard) {
    context.strokeRect(word.rect.left - 1, word.rect.top - 1, word.rect.right - word.rect.left + 2, word.rect.bottom - word.rect.top + 2);
  }

  const columns = Math.ceil(width / COVERAGE_CELL);
  const rows = Math.ceil(height / COVERAGE_CELL);
  const open: number[] = [];
  const covered: number[] = [];
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const x = (column + 0.5) * COVERAGE_CELL;
      const y = (row + 0.5) * COVERAGE_CELL;
      const index = (Math.min(output.height - 1, Math.floor(y * scale)) * output.width + Math.min(output.width - 1, Math.floor(x * scale))) * 4;
      const luma = (0.2126 * sceneLumas[index]! + 0.7152 * sceneLumas[index + 1]! + 0.0722 * sceneLumas[index + 2]!) / 255;
      const inPanel = panels.some((panel) => x >= panel.left && x <= panel.right && y >= panel.top && y <= panel.bottom);
      (inPanel ? covered : open).push(luma);
    }
  }
  const spread = (values: number[]) => {
    if (values.length === 0) return 0;
    const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
    return Math.sqrt(values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length);
  };
  const ratios = scored.map((entry) => entry.contrast).filter(Number.isFinite).sort((left, right) => left - right);
  const round = (value: number) => Math.round(value * 1000) / 1000;

  const blob = await new Promise<Blob | null>((resolve) => output.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("could not encode the capture");
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("could not read the capture"));
    reader.readAsDataURL(blob);
  });

  return {
    dataUrl,
    report: {
      width,
      height,
      panels: panels
        .filter((panel, index) => panels.findIndex((other) => other.left === panel.left && other.top === panel.top && other.right === panel.right && other.bottom === panel.bottom) === index)
        .map((panel) => ({
          x0: round(Math.max(0, panel.left) / width),
          x1: round(Math.min(width, panel.right) / width),
          y0: round(1 - Math.min(height, panel.bottom) / height),
          y1: round(1 - Math.max(0, panel.top) / height),
        })),
      openArea: open.length / (open.length + covered.length),
      openSpread: spread(open),
      coveredSpread: spread(covered),
      text: {
        words: ratios.length,
        median: ratios[Math.floor(ratios.length / 2)] ?? 0,
        worst: ratios[Math.floor(ratios.length * 0.05)] ?? 0,
        hardToRead: hard.length,
        examples: hard
          .sort((left, right) => left.contrast - right.contrast)
          .slice(0, 3)
          .map(({ word, contrast: ratio }) => ({
            x: round((word.rect.left + word.rect.right) / 2 / width),
            y: round(1 - (word.rect.top + word.rect.bottom) / 2 / height),
            contrast: Math.round(ratio * 10) / 10,
          })),
      },
    },
  };
}
