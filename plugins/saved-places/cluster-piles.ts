import maplibregl, { type ExpressionSpecification, type GeoJSONSource, type Map as GlMap } from "maplibre-gl";
import { categories } from "./categories";
import { categoryIcons, iconSvg } from "./category-icons";

export const PLACES_SOURCE = "places";
export const CLUSTER_MAX_ZOOM = 14;
export const CLUSTER_RADIUS = 55;
export const CLUSTER_MIN_POINTS = 3;

const tracked = categories.filter(category => category.id !== "other");
export const clusterProperties: Record<string, ExpressionSpecification> = {
  ...Object.fromEntries(categories.flatMap(category => {
    const member = ["==", ["get", "category"], category.id] as ExpressionSpecification;
    return [
      [category.id, ["+", ["case", member, 1, 0]]],
      [`${category.id}_lng`, ["+", ["case", member, ["get", "lng"], 0]]],
      [`${category.id}_lat`, ["+", ["case", member, ["get", "lat"], 0]]],
    ];
  })),
  west: ["min", ["get", "lng"]],
  east: ["max", ["get", "lng"]],
  south: ["min", ["get", "lat"]],
  north: ["max", ["get", "lat"]],
  notes: ["+", ["get", "note"]],
  dim: ["min", ["get", "dim"]],
};

const channels = (hex: string) => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255);
const luminance = (rgb: number[]) => {
  const [r, g, b] = rgb.map(v => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const onWhite = (hex: string) => {
  let rgb = channels(hex);
  while (1.05 / (luminance(rgb) + 0.05) < 4.5) rgb = rgb.map(v => v * 0.95);
  return `#${rgb.map(v => Math.round(v * 255).toString(16).padStart(2, "0")).join("")}`;
};

type Blob = { color: string; count: number; lng: number; lat: number };
const OTHER_COLOR = categories.find(category => category.id === "other")!.color;
export function meshGradient(blobs: Blob[], extent: { west: number; east: number; south: number; north: number }) {
  const typed = blobs.filter(blob => blob.color !== OTHER_COLOR);
  if (typed.length) blobs = typed;
  const total = blobs.reduce((n, blob) => n + blob.count, 0);
  const midLng = (extent.west + extent.east) / 2;
  const midLat = (extent.south + extent.north) / 2;
  const scale = Math.cos((midLat * Math.PI) / 180);
  const span = Math.max((extent.east - extent.west) * scale, extent.north - extent.south, 1e-9);
  const ordered = [...blobs].sort((a, b) => b.count - a.count);
  const base = onWhite(ordered[0].color);
  const layers = ordered.slice(1, 6).reverse().map(blob => {
    const x = Math.round(50 + ((blob.lng - midLng) * scale / span) * 70);
    const y = Math.round(50 - ((blob.lat - midLat) / span) * 70);
    const r = Math.round(24 + 66 * Math.sqrt(blob.count / total));
    const fill = onWhite(blob.color);
    return `radial-gradient(${r}% ${r}% at ${x}% ${y}%, ${fill} 0%, ${fill} 22%, ${fill}00 100%)`;
  });
  return { base, background: [...layers, base].join(", ") };
}
const sizeFor = (count: number) => Math.round(Math.min(58, 26 + 3.2 * Math.sqrt(count)));

export function attachClusterPiles(map: GlMap, onError: (message: string) => void) {
  const markers = new Map<string, { marker: maplibregl.Marker; signature: string }>();
  let active = true;
  const update = () => {
    if (!map.getSource(PLACES_SOURCE) || !map.isSourceLoaded(PLACES_SOURCE)) return;
    const visible = new Set<string>();
    const frame = map.getContainer();
    for (const feature of map.querySourceFeatures(PLACES_SOURCE)) {
      const { cluster_id: clusterId, point_count: count } = feature.properties;
      const id = String(clusterId);
      if (feature.geometry.type !== "Point" || typeof clusterId !== "number" || typeof count !== "number" || visible.has(id)) continue;
      const coordinates: [number, number] = [feature.geometry.coordinates[0], feature.geometry.coordinates[1]];
      const screen = map.project(coordinates);
      if (screen.x < -60 || screen.y < -60 || screen.x > frame.clientWidth + 60 || screen.y > frame.clientHeight + 60) continue;
      visible.add(id);
      const blobs = categories.map(category => {
        const n = Number(feature.properties[category.id]) || 0;
        return { color: category.color, count: n, lng: n ? Number(feature.properties[`${category.id}_lng`]) / n : 0, lat: n ? Number(feature.properties[`${category.id}_lat`]) / n : 0 };
      }).filter(blob => blob.count > 0);
      const composition = tracked.map(category => ({ ...category, count: Number(feature.properties[category.id]) || 0 })).filter(category => category.count > 0).sort((a, b) => b.count - a.count);
      const notes = Number(feature.properties.notes) || 0;
      const dim = feature.properties.dim === 1;
      const mesh = blobs.length ? meshGradient(blobs, { west: Number(feature.properties.west), east: Number(feature.properties.east), south: Number(feature.properties.south), north: Number(feature.properties.north) }) : { base: "#60646c", background: "#60646c" };
      const signature = `${count}:${mesh.background}:${notes}:${dim}:${composition.map(category => `${category.id}${category.count}`).join(",")}`;
      let entry = markers.get(id);
      if (entry?.signature !== signature) {
        entry?.marker.remove();
        const button = document.createElement("button");
        button.type = "button";
        button.className = "sp-cluster";
        button.style.setProperty("--cluster-color", mesh.base);
        button.style.setProperty("--cluster-fill", mesh.background);
        button.style.setProperty("--cluster-size", `${sizeFor(count)}px`);
        if (dim) button.dataset.dim = "true";
        const description = `${count} places${composition.length ? `: ${composition.map(category => `${category.count} ${category.label}`).join(", ")}` : ""}${notes ? `, ${notes} with notes` : ""}`;
        button.setAttribute("aria-label", `${description}. Zoom in`);
        button.title = description;
        const total = document.createElement("span");
        total.className = "sp-cluster-count";
        total.textContent = count >= 1000 ? `${(count / 1000).toFixed(1)}k` : String(count);
        button.append(total);
        if (composition.length) {
          const pile = document.createElement("span");
          pile.className = "sp-cluster-pile";
          pile.setAttribute("aria-hidden", "true");
          for (const category of composition.slice(0, 2)) {
            const badge = document.createElement("span");
            badge.innerHTML = iconSvg(categoryIcons[category.id], { size: 12, strokeWidth: 2.1 });
            pile.append(badge);
          }
          button.append(pile);
        }
        if (notes) {
          const dot = document.createElement("span");
          dot.className = "sp-cluster-note";
          dot.setAttribute("aria-hidden", "true");
          button.append(dot);
        }
        const marker = new maplibregl.Marker({ element: button, anchor: "center" }).setLngLat(coordinates).addTo(map);
        button.addEventListener("click", async event => {
          event.stopPropagation();
          try {
            const zoom = await (map.getSource(PLACES_SOURCE) as GeoJSONSource).getClusterExpansionZoom(clusterId);
            if (active && markers.get(id)?.marker === marker) map.easeTo({ center: marker.getLngLat(), zoom: Math.min(zoom + 0.35, 18), duration: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 650 });
          } catch {
            if (active && markers.get(id)?.marker === marker) onError("The group changed. Tap it again to zoom in.");
          }
        });
        entry = { marker, signature };
        markers.set(id, entry);
      }
      const previous = entry.marker.getLngLat();
      if (previous.lng !== coordinates[0] || previous.lat !== coordinates[1]) entry.marker.setLngLat(coordinates);
    }
    for (const [id, entry] of markers) {
      if (visible.has(id)) continue;
      entry.marker.remove();
      markers.delete(id);
    }
  };
  map.on("render", update);
  return {
    refresh: () => { for (const entry of markers.values()) entry.marker.remove(); markers.clear(); update(); },
    remove: () => {
      active = false;
      map.off("render", update);
      for (const entry of markers.values()) entry.marker.remove();
      markers.clear();
    },
  };
}
