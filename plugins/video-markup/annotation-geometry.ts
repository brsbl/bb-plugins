import type { Shape } from "./model.js";

/** Project normalized saved coordinates into CSS pixels before sizing arrowheads. */
export function annotationGeometry(shape: Shape, width: number, height: number) {
  const x1 = shape.x1 * width, y1 = shape.y1 * height;
  const x2 = shape.x2 * width, y2 = shape.y2 * height;
  const marker = {
    x: Math.max(14, Math.min(width - 14, shape.kind === "arrow" ? x1 : Math.min(x1, x2))),
    y: Math.max(14, Math.min(height - 14, shape.kind === "arrow" ? y1 : Math.min(y1, y2))),
  };
  if (shape.kind !== "arrow") {
    return { marker, outline: `M ${x1} ${y1} H ${x2} V ${y2} H ${x1} Z`, head: null };
  }
  const length = Math.hypot(x2 - x1, y2 - y1);
  if (!length) return { marker, outline: "", head: null };
  const ux = (x2 - x1) / length, uy = (y2 - y1) / length;
  const headLength = Math.min(18, length * .5), halfWidth = headLength * .55;
  const baseX = x2 - ux * headLength, baseY = y2 - uy * headLength;
  return {
    marker,
    outline: `M ${x1} ${y1} L ${baseX} ${baseY}`,
    head: `M ${x2} ${y2} L ${baseX - uy * halfWidth} ${baseY + ux * halfWidth} L ${baseX + uy * halfWidth} ${baseY - ux * halfWidth} Z`,
  };
}
