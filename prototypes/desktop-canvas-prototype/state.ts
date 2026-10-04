import { z } from "zod";

const coordinate = z.number().finite().min(-100_000).max(100_000);
const point = z.object({ x: coordinate, y: coordinate });
export const layoutSchema = z.object({
  version: z.literal(1),
  camera: point.extend({ zoom: z.number().min(0.25).max(1.5) }),
  folders: z.array(z.object({ id: z.string().max(100), name: z.string().trim().min(1).max(80) })).max(100),
  membership: z.record(z.string().max(200), z.string().max(100)),
  positions: z.record(z.string().max(250), point),
  collapsed: z.array(z.string().max(100)).max(500),
  windows: z.array(point.extend({ id: z.string().max(200), kind: z.enum(["thread", "folder"]).optional(), minimized: z.boolean() })).max(50),
  promptPosition: point.nullable().default(null),
  composer: z.enum(["center", "float", "hidden"]),
});
export type Layout = z.infer<typeof layoutSchema>;
export type Point = { x: number; y: number };
export type Camera = Layout["camera"];
export const initialLayout = (): Layout => ({ version: 1, camera: { x: 0, y: 0, zoom: 1 }, folders: [], membership: {}, positions: {}, collapsed: [], windows: [], promptPosition: null, composer: "center" });

export function readLayout(raw: string | null): Layout {
  try { return layoutSchema.parse(JSON.parse(raw ?? "null")); } catch { return initialLayout(); }
}
export function folderFor(thread: { id: string; projectId: string }, layout: Layout): string {
  const assigned = layout.membership[thread.id];
  return layout.folders.some(folder => folder.id === assigned) ? assigned : `project:${thread.projectId}`;
}
export function zoomAt(camera: Camera, zoom: number, anchor: Point): Camera {
  const bounded = Math.max(0.25, Math.min(1.5, zoom));
  return { zoom: bounded, x: anchor.x - (anchor.x - camera.x) * bounded / camera.zoom, y: anchor.y - (anchor.y - camera.y) * bounded / camera.zoom };
}
export function fitCamera(bounds: { x: number; y: number; width: number; height: number }[], width: number, height: number): Camera {
  if (!bounds.length) return { x: 0, y: 0, zoom: 1 };
  const left = Math.min(...bounds.map(b => b.x));
  const top = Math.min(...bounds.map(b => b.y));
  const right = Math.max(...bounds.map(b => b.x + b.width));
  const bottom = Math.max(...bounds.map(b => b.y + b.height));
  const zoom = Math.max(0.25, Math.min(1, (width - 96) / (right - left), (height - 160) / (bottom - top)));
  return { zoom, x: (width - (right - left) * zoom) / 2 - left * zoom, y: (height - 64 - (bottom - top) * zoom) / 2 - top * zoom };
}
