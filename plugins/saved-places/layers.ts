import type { GeoJSONSource, Map as GlMap } from "maplibre-gl";
import type { FeatureCollection, Point } from "geojson";
import { categoryIdSchema, groupOf, type CategoryId } from "./categories";
import { categoryIcons, drawIcon } from "./category-icons";
import { CLUSTER_MAX_ZOOM, CLUSTER_MIN_POINTS, CLUSTER_RADIUS, PLACES_SOURCE, clusterProperties } from "./cluster-piles";
import type { MapTheme } from "./basemap";
import type { SavedPlace } from "./model";
import type { Ring } from "./routing";

export interface PinInput { place: SavedPlace; color: string; note: boolean; dim: boolean; picked: boolean }
export const POINT_LAYERS = ["sp-points"];
const empty: FeatureCollection = { type: "FeatureCollection", features: [] };
const PIN_ZOOM = 14;

export function pinCollection(pins: PinInput[]): FeatureCollection<Point> {
  return {
    type: "FeatureCollection",
    features: pins.map(({ place, color, note, dim, picked }) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [place.longitude, place.latitude] },
      properties: { key: place.key, name: place.name, category: place.category, group: groupOf(place.category).id, lng: place.longitude, lat: place.latitude, icon: place.category, color, note: note ? 1 : 0, dim: dim ? 1 : 0, picked: picked ? 1 : 0, rank: note ? 0 : place.rating !== null ? 1 : 2 },
    })),
  };
}

function poiImage(category: CategoryId, dark: boolean) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 40;
  const context = canvas.getContext("2d");
  if (!context) return null;
  context.fillStyle = dark ? "#1e2127" : "#ffffff";
  context.beginPath();
  context.arc(20, 20, 20, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = groupOf(category).color;
  context.beginPath();
  context.arc(20, 20, 17, 0, Math.PI * 2);
  context.fill();
  context.translate(9, 9);
  drawIcon(context, categoryIcons[category], "#ffffff", 22, 2.1);
  return context.getImageData(0, 0, 40, 40);
}

function pinImage(category: CategoryId) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 48;
  const context = canvas.getContext("2d");
  if (!context) return null;
  if (category === "other") {
    context.fillStyle = "#ffffff";
    context.beginPath();
    context.arc(24, 24, 11, 0, Math.PI * 2);
    context.fill();
  } else drawIcon(context, categoryIcons[category], "#ffffff", 48, 2);
  return context.getImageData(0, 0, 48, 48);
}

export function provideCategoryImages(map: GlMap, dark: () => boolean) {
  const provide = ({ id }: { id: string }) => {
    const [, kind, raw] = /^sp-(poi|icon)-(.+)$/.exec(id) ?? [];
    const category = categoryIdSchema.safeParse(raw);
    if (!kind || !category.success || map.hasImage(id)) return;
    const image = kind === "poi" ? poiImage(category.data, dark()) : pinImage(category.data);
    if (image) map.addImage(id, image, { pixelRatio: kind === "poi" ? 2 : 3 });
  };
  map.on("styleimagemissing", provide);
  return () => map.off("styleimagemissing", provide);
}

export function installLayers(map: GlMap, theme: MapTheme) {
  const firstLabel = map.getStyle().layers?.find(layer => layer.type === "symbol")?.id;
  map.addSource("sp-rings", { type: "geojson", data: empty });
  map.addSource("sp-selected", { type: "geojson", data: empty });
  map.addSource("sp-hover", { type: "geojson", data: empty });
  map.addSource(PLACES_SOURCE, { type: "geojson", data: empty, cluster: true, clusterRadius: CLUSTER_RADIUS, clusterMaxZoom: CLUSTER_MAX_ZOOM, clusterMinPoints: CLUSTER_MIN_POINTS, clusterProperties });

  map.addLayer({ id: "sp-rings-fill", type: "fill", source: "sp-rings", paint: { "fill-color": theme.accent, "fill-opacity": theme.dark ? 0.12 : 0.085 } }, firstLabel);
  map.addLayer({ id: "sp-rings-line", type: "line", source: "sp-rings", paint: { "line-color": theme.accent, "line-opacity": 0.55, "line-width": 1.2, "line-dasharray": [2, 2] } }, firstLabel);
  map.addLayer({ id: "sp-rings-label", type: "symbol", source: "sp-rings", layout: { "symbol-placement": "line", "symbol-spacing": 420, "text-field": ["get", "label"], "text-font": ["Noto Sans Bold"], "text-size": 11, "text-keep-upright": true }, paint: { "text-color": theme.accent, "text-halo-color": theme.panel, "text-halo-width": 2 } });

  map.addLayer({ id: "sp-selected-halo", type: "circle", source: "sp-selected", paint: { "circle-radius": ["interpolate", ["linear"], ["zoom"], 10, 14, PIN_ZOOM, 20, 16, 24], "circle-color": ["get", "color"], "circle-opacity": 0.18, "circle-stroke-width": 2, "circle-stroke-color": ["get", "color"], "circle-stroke-opacity": 0.9 } });
  const unclustered = ["!", ["has", "point_count"]] as const;
  const opacity = ["case", ["==", ["get", "dim"], 1], 0.14, 1] as const;
  map.addLayer({ id: "sp-points-shadow", type: "circle", source: PLACES_SOURCE, filter: unclustered as never, paint: { "circle-radius": ["interpolate", ["linear"], ["zoom"], 3, 5, 12, 7, PIN_ZOOM, 13, 16, 15.5], "circle-color": "#000", "circle-opacity": ["case", ["==", ["get", "dim"], 1], 0, theme.dark ? 0.4 : 0.16], "circle-blur": 0.7, "circle-translate": [0, 1.5] } });
  map.addLayer({ id: "sp-points-picked", type: "circle", source: PLACES_SOURCE, filter: ["all", unclustered, ["==", ["get", "picked"], 1]] as never, paint: { "circle-radius": ["interpolate", ["linear"], ["zoom"], 3, 8, 12, 10, PIN_ZOOM, 17, 16, 20], "circle-color": theme.accent, "circle-opacity": 0.18, "circle-stroke-width": 2.5, "circle-stroke-color": theme.accent } });
  map.addLayer({ id: "sp-points", type: "circle", source: PLACES_SOURCE, filter: unclustered as never, layout: { "circle-sort-key": ["-", 3, ["get", "rank"]] }, paint: { "circle-radius": ["interpolate", ["linear"], ["zoom"], 3, 4, 12, 5.5, PIN_ZOOM, 11.5, 16, 14], "circle-color": ["get", "color"], "circle-opacity": opacity as never, "circle-stroke-color": theme.dark ? "#141414" : "#ffffff", "circle-stroke-width": ["interpolate", ["linear"], ["zoom"], 3, 1.25, PIN_ZOOM, 2.25], "circle-stroke-opacity": opacity as never } });
  map.addLayer({ id: "sp-points-icon", type: "symbol", source: PLACES_SOURCE, minzoom: PIN_ZOOM, filter: unclustered as never, layout: { "icon-image": ["concat", "sp-icon-", ["get", "icon"]], "icon-size": ["interpolate", ["linear"], ["zoom"], PIN_ZOOM, 0.85, 16, 1], "icon-overlap": "always", "icon-padding": 6 }, paint: { "icon-opacity": opacity as never } });
  map.addLayer({ id: "sp-points-note", type: "circle", source: PLACES_SOURCE, minzoom: PIN_ZOOM, filter: ["all", unclustered, ["==", ["get", "note"], 1]] as never, paint: { "circle-radius": 4.5, "circle-color": "#ffc53d", "circle-stroke-color": theme.dark ? "#141414" : "#ffffff", "circle-stroke-width": 1.75, "circle-translate": [10, -10], "circle-opacity": opacity as never, "circle-stroke-opacity": opacity as never } });
  map.addLayer({ id: "sp-hover-ring", type: "circle", source: "sp-hover", paint: { "circle-radius": ["interpolate", ["linear"], ["zoom"], 10, 10, PIN_ZOOM, 17, 16, 20], "circle-color": "transparent", "circle-stroke-width": 2.5, "circle-stroke-color": theme.ink } });
  map.addLayer({ id: "sp-labels", type: "symbol", source: PLACES_SOURCE, minzoom: 14.8, filter: unclustered as never, layout: { "symbol-sort-key": ["get", "rank"], "text-field": ["get", "name"], "text-font": ["Noto Sans Bold"], "text-size": ["interpolate", ["linear"], ["zoom"], 14.8, 11, 17, 13], "text-variable-anchor": ["left", "right", "top", "bottom"], "text-radial-offset": 1.35, "text-justify": "auto", "text-max-width": 9, "text-padding": 3, "text-optional": true, "text-overlap": "never" }, paint: { "text-color": theme.ink, "text-halo-color": theme.panel, "text-halo-width": 1.5, "text-halo-blur": 0.5, "text-opacity": opacity as never } });
}

const setData = (map: GlMap, id: string, data: FeatureCollection) => (map.getSource(id) as GeoJSONSource | undefined)?.setData(data);
export const setPins = (map: GlMap, pins: PinInput[]) => setData(map, PLACES_SOURCE, pinCollection(pins));
export const setRings = (map: GlMap, rings: Ring[]) => setData(map, "sp-rings", { type: "FeatureCollection", features: rings });
export const setMarkedPoint = (map: GlMap, source: "sp-selected" | "sp-hover", place: SavedPlace | null, color = "#000") => setData(map, source, { type: "FeatureCollection", features: place ? [{ type: "Feature", geometry: { type: "Point", coordinates: [place.longitude, place.latitude] }, properties: { color } }] : [] });
