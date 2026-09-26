import type { Feature, FeatureCollection, MultiPolygon, Polygon, Position } from "geojson";

export type TravelMode = "walk" | "bike" | "drive";
export const TRAVEL_MODES: Array<{ id: TravelMode; label: string; verb: string }> = [
  { id: "walk", label: "Walk", verb: "walk" },
  { id: "bike", label: "Bike", verb: "ride" },
  { id: "drive", label: "Drive", verb: "drive" },
];
const COSTING: Record<TravelMode, string> = { walk: "pedestrian", bike: "bicycle", drive: "auto" };
const GOOGLE_MODE: Record<TravelMode, string> = { walk: "walking", bike: "bicycling", drive: "driving" };
const ENDPOINT = "https://valhalla1.openstreetmap.de";
export const RING_MINUTES = [5, 10, 15];

export interface LatLng { latitude: number; longitude: number }
export interface Leg { seconds: number; km: number }
export interface RouteResult { legs: Leg[]; line: Position[]; seconds: number; km: number }
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

export async function isochrone(point: LatLng, mode: TravelMode, minutes = RING_MINUTES, signal?: AbortSignal): Promise<Ring[]> {
  const data = await valhalla<FeatureCollection<Polygon | MultiPolygon, { contour: number }>>("isochrone", { locations: [location(point)], costing: COSTING[mode], contours: minutes.map(time => ({ time })), polygons: true, denoise: 0.4, generalize: 30 }, signal);
  return data.features.map(f => ({ type: "Feature", geometry: f.geometry, properties: { minutes: f.properties.contour, label: `${f.properties.contour} min` } }));
}

export async function matrix(points: LatLng[], mode: TravelMode, signal?: AbortSignal): Promise<number[][]> {
  const locations = points.map(location);
  const data = await valhalla<{ sources_to_targets: Array<Array<{ time: number | null }>> }>("sources_to_targets", { sources: locations, targets: locations, costing: COSTING[mode] }, signal);
  return data.sources_to_targets.map(row => row.map(cell => cell.time ?? Number.POSITIVE_INFINITY));
}

export async function route(points: LatLng[], mode: TravelMode, signal?: AbortSignal): Promise<RouteResult> {
  const data = await valhalla<{ trip: { legs: Array<{ shape: string; summary: { time: number; length: number } }>; summary: { time: number; length: number } } }>("route", { locations: points.map(location), costing: COSTING[mode], directions_type: "none" }, signal);
  const line = data.trip.legs.flatMap(leg => decodePolyline6(leg.shape));
  return { legs: data.trip.legs.map(leg => ({ seconds: leg.summary.time, km: leg.summary.length })), line, seconds: data.trip.summary.time, km: data.trip.summary.length };
}

export function bestOrder(times: number[][], keepStart: boolean): number[] {
  const n = times.length;
  if (n <= 2) return [...Array(n).keys()];
  const full = 1 << n;
  const cost = new Float64Array(full * n).fill(Number.POSITIVE_INFINITY);
  const parent = new Int8Array(full * n).fill(-1);
  for (let start = 0; start < n; start++) if (!keepStart || start === 0) cost[(1 << start) * n + start] = 0;
  for (let mask = 1; mask < full; mask++) {
    for (let last = 0; last < n; last++) {
      const current = cost[mask * n + last];
      if (!(mask & (1 << last)) || current === Number.POSITIVE_INFINITY) continue;
      for (let next = 0; next < n; next++) {
        if (mask & (1 << next)) continue;
        const nextMask = mask | (1 << next);
        const candidate = current + times[last][next];
        if (candidate < cost[nextMask * n + next]) {
          cost[nextMask * n + next] = candidate;
          parent[nextMask * n + next] = last;
        }
      }
    }
  }
  let last = 0;
  for (let i = 1; i < n; i++) if (cost[(full - 1) * n + i] < cost[(full - 1) * n + last]) last = i;
  const order: number[] = [];
  let mask = full - 1;
  while (last !== -1) {
    order.push(last);
    const previous = parent[mask * n + last];
    mask &= ~(1 << last);
    last = previous;
  }
  return order.reverse();
}

export function orderCost(times: number[][], order: number[]) {
  let total = 0;
  for (let i = 1; i < order.length; i++) total += times[order[i - 1]][order[i]];
  return total;
}

export function decodePolyline6(encoded: string): Position[] {
  const coordinates: Position[] = [];
  let index = 0, lat = 0, lng = 0;
  while (index < encoded.length) {
    for (const axis of [0, 1]) {
      let shift = 0, result = 0, byte: number;
      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);
      const delta = result & 1 ? ~(result >> 1) : result >> 1;
      if (axis === 0) lat += delta; else lng += delta;
    }
    coordinates.push([lng / 1e6, lat / 1e6]);
  }
  return coordinates;
}

export function directionsUrl(points: Array<LatLng & { name: string }>, mode: TravelMode) {
  const encode = (p: LatLng) => `${p.latitude},${p.longitude}`;
  const params = new URLSearchParams({ api: "1", origin: encode(points[0]), destination: encode(points[points.length - 1]), travelmode: GOOGLE_MODE[mode] });
  if (points.length > 2) params.set("waypoints", points.slice(1, -1).slice(0, 9).map(encode).join("|"));
  return `https://www.google.com/maps/dir/?${params}`;
}

export function formatDuration(seconds: number) {
  const minutes = Math.max(1, Math.round(seconds / 60));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  return minutes % 60 ? `${hours} h ${minutes % 60} min` : `${hours} h`;
}
export function formatDistance(km: number) {
  return km < 1 ? `${Math.round(km * 1000 / 10) * 10} m` : `${km.toFixed(km < 10 ? 1 : 0)} km`;
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
