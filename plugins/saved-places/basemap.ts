import type { Map as GlMap } from "maplibre-gl";

export interface MapTheme {
  dark: boolean;
  style: string;
  panel: string;
  ink: string;
  muted: string;
  accent: string;
}

function resolveColor(element: HTMLElement, value: string, fallback: string) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  const probe = document.createElement("span");
  probe.style.color = value;
  probe.style.display = "none";
  element.append(probe);
  const computed = getComputedStyle(probe).color;
  probe.remove();
  if (!context || !computed) return fallback;
  context.fillStyle = fallback;
  context.fillStyle = computed;
  context.fillRect(0, 0, 1, 1);
  const [r, g, b] = context.getImageData(0, 0, 1, 1).data;
  return `#${[r, g, b].map(n => n.toString(16).padStart(2, "0")).join("")}`;
}
const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

export function readTheme(element: HTMLElement): MapTheme {
  const panel = resolveColor(element, "var(--background, #fdfdfc)", "#fdfdfc");
  const ink = resolveColor(element, "var(--foreground, #1f1f1d)", "#1f1f1d");
  const muted = resolveColor(element, "var(--muted-foreground, #74746f)", "#74746f");
  const dark = luminance(panel) < 0.4;
  return { dark, style: `https://tiles.openfreemap.org/styles/${dark ? "dark" : "positron"}`, panel, ink, muted, accent: dark ? "#8da4ff" : "#3e63dd" };
}

const HIDDEN = /shield|airport|aeroway|oneway|highway-name-path|highway_name_other|highway-name-minor|railway_(service|minor)|label_other|place_other|boundary_3|boundary_state/;
const PLACE_LABEL = /^(label_|place_)/;
const ROAD_LABEL = /^(highway-name|highway_name)/;

export function muteBasemap(map: GlMap, theme: MapTheme) {
  const latinName: unknown = ["coalesce", ["get", "name:en"], ["get", "name:latin"], ["get", "name"]];
  for (const layer of map.getStyle().layers ?? []) {
    const id = layer.id;
    if (HIDDEN.test(id)) {
      map.setLayoutProperty(id, "visibility", "none");
      continue;
    }
    if (layer.type !== "symbol") continue;
    if (PLACE_LABEL.test(id) || ROAD_LABEL.test(id) || /water/.test(id)) {
      map.setLayoutProperty(id, "text-field", latinName as never);
      map.setPaintProperty(id, "text-color", theme.dark ? "#8b8f94" : "#8a8a86");
      map.setPaintProperty(id, "text-halo-color", theme.dark ? "#1b1c1e" : "#f6f6f4");
      map.setPaintProperty(id, "text-halo-width", 1.2);
    }
    if (/country|state/.test(id)) map.setPaintProperty(id, "text-color", theme.dark ? "#6c7075" : "#a3a39e");
    if (/city|town|village|suburb/.test(id)) {
      map.setLayoutProperty(id, "text-transform", "none");
      map.setLayoutProperty(id, "text-size", ["interpolate", ["linear"], ["zoom"], 4, 10, 10, 11.5, 14, 12.5]);
      map.setPaintProperty(id, "text-color", theme.dark ? "#7d8186" : "#9a9a95");
    }
  }
  if (!theme.dark) {
    if (map.getLayer("background")) map.setPaintProperty("background", "background-color", "#f3f3f0");
    if (map.getLayer("water")) map.setPaintProperty("water", "fill-color", "#dde3e8");
    if (map.getLayer("park")) map.setPaintProperty("park", "fill-color", "#e6ebe2");
    if (map.getLayer("building")) map.setPaintProperty("building", "fill-color", "#ebebe7");
  }
}
