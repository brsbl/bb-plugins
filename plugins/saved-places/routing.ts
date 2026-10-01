import type { Feature, FeatureCollection, MultiPolygon, Polygon, Position } from "geojson";

export type TravelMode = "walk" | "bike" | "drive";
export const TRAVEL_MODES: Array<{ id: TravelMode; label: string; verb: string }> = [
  { id: "walk", label: "Walk", verb: "walk" },
  { id: "bike", label: "Bike", verb: "ride" },
  { id: "drive", label: "Drive", verb: "drive" },
];
const COSTING: Record<TravelMode, string> = { walk: "pedestrian", bike: "bicycle", drive: "auto" };
const ENDPOINT = "https://valhalla1.openstreetmap.de";
export const RING_MINUTES = [5, 10, 15];
export const MAX_RING_PLACES = 12;

export interface LatLng { latitude: number; longitude: number }
export type Ring = Feature<Polygon | MultiPolygon, { minutes: number; label: string }>;

let lastRequest = 0;
async function valhalla<T>(path: string, body: unknown, signal?: AbortSignal): Promise<T> {
  const wait = Math.max(0, lastRequest + 350 - Date.now());
  lastRequest = Date.now() + wait;
  if (wait) await new Promise(resolve => setTimeout(resolve, wait));
  const response = await fetch(`${ENDPOINT}/${path}?json=${encodeURIComponent(JSON.stringify(body))}`, { signal });
  const data = await response.json().catch(() => null) as (T & { error?: string }) | null;
  if (!response.ok || !data) throw new Error(data?.error ?? `Routing service returned ${response.status}`);
  return data;
}
const location = (p: LatLng) => ({ lat: p.latitude, lon: p.longitude });

const cache = new Map<string, Ring[]>();
const cacheKey = (point: LatLng, mode: TravelMode, minutes: number[]) => `${point.latitude.toFixed(5)},${point.longitude.toFixed(5)}|${mode}|${minutes.join(",")}`;
export const cachedIsochrone = (point: LatLng, mode: TravelMode, minutes: number[]) => cache.get(cacheKey(point, mode, minutes));

export async function isochrone(point: LatLng, mode: TravelMode, minutes = RING_MINUTES, signal?: AbortSignal): Promise<Ring[]> {
  const cached = cachedIsochrone(point, mode, minutes);
  if (cached) return cached;
  const data = await valhalla<FeatureCollection<Polygon | MultiPolygon, { contour: number }>>("isochrone", { locations: [location(point)], costing: COSTING[mode], contours: minutes.map(time => ({ time })), polygons: true, denoise: 0.4, generalize: 30 }, signal);
  const rings: Ring[] = data.features.map(f => ({ type: "Feature", geometry: f.geometry, properties: { minutes: f.properties.contour, label: `${f.properties.contour} min` } }));
  cache.set(cacheKey(point, mode, minutes), rings);
  return rings;
}

function inRing(point: Position, ring: Position[]) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if (((yi > point[1]) !== (yj > point[1])) && point[0] < (xj - xi) * (point[1] - yi) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
export function inPolygon(point: Position, geometry: Polygon | MultiPolygon) {
  const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  return polygons.some(([outer, ...holes]) => inRing(point, outer) && !holes.some(hole => inRing(point, hole)));
}
