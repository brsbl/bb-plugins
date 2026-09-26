import type { IconSvgElement } from "@hugeicons/react";
import Noodles from "@hugeicons/core-free-icons/NoodlesIcon";
import Sushi from "@hugeicons/core-free-icons/Sushi01Icon";
import Restaurant01 from "@hugeicons/core-free-icons/Restaurant01Icon";
import Coffee02 from "@hugeicons/core-free-icons/Coffee02Icon";
import Drink from "@hugeicons/core-free-icons/DrinkIcon";
import Vynil01 from "@hugeicons/core-free-icons/Vynil01Icon";
import MusicNote01 from "@hugeicons/core-free-icons/MusicNote01Icon";
import Landmark from "@hugeicons/core-free-icons/LandmarkIcon";
import Tree06 from "@hugeicons/core-free-icons/Tree06Icon";
import BedDouble from "@hugeicons/core-free-icons/BedDoubleIcon";
import Location01 from "@hugeicons/core-free-icons/Location01Icon";
import type { CategoryId } from "./categories";

export const categoryIcons: Record<CategoryId, IconSvgElement> = {
  ramen: Noodles,
  sushi: Sushi,
  food: Restaurant01,
  coffee: Coffee02,
  bars: Drink,
  records: Vynil01,
  music: MusicNote01,
  culture: Landmark,
  outdoors: Tree06,
  stays: BedDouble,
  other: Location01,
};

const attr = (name: string) => name.replace(/[A-Z]/g, c => `-${c.toLowerCase()}`);
export function iconSvg(icon: IconSvgElement, { color = "currentColor", size = 24, strokeWidth = 1.8 }: { color?: string; size?: number; strokeWidth?: number } = {}) {
  const body = icon.map(([tag, attrs]) => `<${tag} ${Object.entries(attrs).filter(([k]) => k !== "key").map(([k, v]) => {
    const value = k === "strokeWidth" ? strokeWidth : v === "currentColor" ? color : v;
    return `${attr(k)}="${String(value)}"`;
  }).join(" ")}/>`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none">${body}</svg>`;
}

export function drawIcon(context: CanvasRenderingContext2D, icon: IconSvgElement, color: string, size: number, strokeWidth = 1.8) {
  context.save();
  context.scale(size / 24, size / 24);
  context.lineCap = "round";
  context.lineJoin = "round";
  for (const [tag, a] of icon) {
    const n = (k: string) => Number(a[k] ?? 0);
    const path = new Path2D();
    if (tag === "path") path.addPath(new Path2D(String(a.d)));
    else if (tag === "circle") path.arc(n("cx"), n("cy"), n("r"), 0, Math.PI * 2);
    else if (tag === "ellipse") path.ellipse(n("cx"), n("cy"), n("rx"), n("ry"), 0, 0, Math.PI * 2);
    else if (tag === "rect") path.roundRect(n("x"), n("y"), n("width"), n("height"), n("rx"));
    else if (tag === "line") { path.moveTo(n("x1"), n("y1")); path.lineTo(n("x2"), n("y2")); }
    else continue;
    if (a.fill && a.fill !== "none") { context.fillStyle = color; context.fill(path, a.fillRule === "evenodd" ? "evenodd" : "nonzero"); }
    if (a.stroke && a.stroke !== "none") { context.strokeStyle = color; context.lineWidth = strokeWidth; context.stroke(path); }
  }
  context.restore();
}
