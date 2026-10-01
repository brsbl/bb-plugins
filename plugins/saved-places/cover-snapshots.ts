import maplibregl, { type StyleSpecification } from "maplibre-gl";
import { useEffect, useMemo, useState, useSyncExternalStore, type RefObject } from "react";
import { streetsStyle } from "./basemap";
import { groupOf } from "./categories";
import { trimmedBounds, type SavedPlace } from "./model";

const SIZE = 96;
const PADDING = 16;
const MAX_ZOOM = 14.5;
const RENDER_TIMEOUT = 10_000;
const RETIRE_AFTER = 15_000;
const CACHE_LIMIT = 120;
const MAX_ATTEMPTS = 3;
const RETRY_AFTER = 5_000;

interface Job { key: string; places: SavedPlace[]; dark: boolean; attempts: number }
type Result = { url: string | null; retry: boolean };

const cache = new Map<string, string>();
const failed = new Set<string>();
const queued = new Set<string>();
const queue: Job[] = [];
const listeners = new Set<() => void>();
let map: maplibregl.Map | null = null;
let host: HTMLDivElement | null = null;
let draining = false;
let retireTimer = 0;

function snapshotKey(places: SavedPlace[], dark: boolean) {
  let h = 2166136261;
  for (const place of places) {
    for (const char of place.key) h = Math.imul(h ^ char.charCodeAt(0), 16777619);
    h = Math.imul(h ^ 124, 16777619);
  }
  return `${dark ? "d" : "l"}:${places.length}:${(h >>> 0).toString(36)}`;
}

function coverStyle(places: SavedPlace[], dark: boolean): StyleSpecification {
  const base = streetsStyle({ dark }, { labels: false });
  return {
    ...base,
    sources: {
      ...base.sources,
      dots: {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: places.map(place => ({ type: "Feature", geometry: { type: "Point", coordinates: [place.longitude, place.latitude] }, properties: { color: groupOf(place.category).color } })),
        },
      },
    },
    layers: [
      ...base.layers,
      { id: "dots", type: "circle", source: "dots", paint: { "circle-color": ["get", "color"], "circle-radius": 5.5, "circle-stroke-color": dark ? "#1e2127" : "#ffffff", "circle-stroke-width": 1.75 } },
    ],
  };
}

function retire() {
  map?.remove();
  map = null;
  host?.remove();
  host = null;
}

function create(style: StyleSpecification) {
  host = document.createElement("div");
  host.setAttribute("aria-hidden", "true");
  Object.assign(host.style, { position: "fixed", left: "-10000px", top: "0", width: `${SIZE}px`, height: `${SIZE}px`, pointerEvents: "none" });
  document.body.append(host);
  try {
    map = new maplibregl.Map({
      container: host, style, interactive: false, attributionControl: false, trackResize: false, fadeDuration: 0, renderWorldCopies: false,
      minZoom: -2, maxZoom: 18, pixelRatio: Math.min(3, Math.max(2, window.devicePixelRatio || 1)),
      canvasContextAttributes: { preserveDrawingBuffer: true, antialias: true },
    });
  } catch {
    retire();
  }
  return map;
}

function render({ places, dark }: Job) {
  return new Promise<Result>(resolve => {
    const style = coverStyle(places, dark);
    const reuse = map;
    const target = reuse ?? create(style);
    if (!target) return resolve({ url: null, retry: false });
    const finish = (ok: boolean) => {
      window.clearTimeout(timer);
      target.off("idle", settled);
      let url: string | null = null;
      if (ok) {
        try { url = target.getCanvas().toDataURL("image/jpeg", 0.86); } catch { url = null; }
      }
      if (!ok || !url) retire();
      resolve({ url, retry: !ok });
    };
    const settled = () => finish(true);
    const timer = window.setTimeout(() => finish(false), RENDER_TIMEOUT);
    target.on("idle", settled);
    if (reuse) target.setStyle(style);
    const bounds = trimmedBounds(places);
    const camera = bounds ? target.cameraForBounds(bounds, { padding: PADDING, maxZoom: MAX_ZOOM }) : undefined;
    target.jumpTo(camera ?? { center: [places[0].longitude, places[0].latitude], zoom: MAX_ZOOM });
    target.triggerRepaint();
  });
}

function remember(job: Job, { url, retry }: Result) {
  const { key } = job;
  if (!url && retry && job.attempts + 1 < MAX_ATTEMPTS) {
    window.setTimeout(() => request({ ...job, attempts: job.attempts + 1 }), RETRY_AFTER);
    return;
  }
  if (!url) failed.add(key);
  else {
    cache.set(key, url);
    if (cache.size > CACHE_LIMIT) cache.delete(cache.keys().next().value!);
  }
  for (const listener of listeners) listener();
}

async function drain() {
  if (draining) return;
  draining = true;
  window.clearTimeout(retireTimer);
  while (queue.length && document.visibilityState === "visible") {
    const job = queue.shift()!;
    queued.delete(job.key);
    if (cache.has(job.key) || failed.has(job.key)) continue;
    remember(job, await render(job));
  }
  draining = false;
  retireTimer = window.setTimeout(retire, RETIRE_AFTER);
}

function request(job: Job) {
  if (cache.has(job.key) || failed.has(job.key) || queued.has(job.key)) return;
  queued.add(job.key);
  queue.push(job);
  void drain();
}

document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") void drain(); });

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
};

export function useMapSnapshot(element: RefObject<HTMLElement | null>, places: SavedPlace[], dark: boolean) {
  const key = useMemo(() => places.length ? snapshotKey(places, dark) : null, [places, dark]);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const target = element.current;
    if (seen || !key || !target) return;
    if (typeof IntersectionObserver === "undefined") { setSeen(true); return; }
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { setSeen(true); observer.disconnect(); }
    }, { rootMargin: "200px" });
    observer.observe(target);
    return () => observer.disconnect();
  }, [element, key, seen]);
  useEffect(() => {
    if (seen && key) request({ key, places, dark, attempts: 0 });
  }, [seen, key, places, dark]);
  return useSyncExternalStore(subscribe, () => key ? cache.get(key) ?? null : null);
}
