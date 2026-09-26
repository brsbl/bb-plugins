import type { GeoJSONSource, Map as GlMap } from "maplibre-gl";
import type { Feature, FeatureCollection, LineString, Point } from "geojson";
import { categories } from "./categories";
import { categoryIcons, drawIcon } from "./category-icons";
import { CLUSTER_MAX_ZOOM, CLUSTER_MIN_POINTS, CLUSTER_RADIUS, PLACES_SOURCE, clusterProperties } from "./cluster-piles";
import type { MapTheme } from "./basemap";
import type { SavedPlace } from "./model";
import type { Ring } from "./routing";

export interface PinInput { place: SavedPlace; color: string; note: boolean; dim: boolean }
export const POINT_LAYERS = ["sp-points"];
const empty: FeatureCollection = { type: "FeatureCollection", features: [] };
const PIN_ZOOM = 14;

export function pinCollection(pins: PinInput[]): FeatureCollection<Point> {
  return {
    type: "FeatureCollection",
    features: pins.map(({ place, color, note, dim }) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [place.longitude, place.latitude] },
      properties: { key: place.key, name: place.name, category: place.category, lng: place.longitude, lat: place.latitude, icon: place.category === "other" ? "" : `${place.category}-${lightColor(color) ? "dark" : "light"}`, color, note: note ? 1 : 0, dim: dim ? 1 : 0, rank: note ? 0 : place.rating !== null ? 1 : 2 },
    })),
  };
}

const lightColor = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.62;
};

function addCategoryImages(map: GlMap) {
  for (const category of categories) {
    for (const [tone, color] of [["light", "#ffffff"], ["dark", "#18191b"]] as const) {
      const id = `sp-icon-${category.id}-${tone}`;
      if (map.hasImage(id)) continue;
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 48;
      const context = canvas.getContext("2d");
      if (!context) continue;
      drawIcon(context, categoryIcons[category.id], color, 48, 2);
      map.addImage(id, context.getImageData(0, 0, 48, 48), { pixelRatio: 3 });
    }
  }
}

export function installLayers(map: GlMap, theme: MapTheme) {
  addCategoryImages(map);
  const firstLabel = map.getStyle().layers?.find(layer => layer.type === "symbol")?.id;
  map.addSource("sp-rings", { type: "geojson", data: empty });
  map.addSource("sp-route", { type: "geojson", data: empty });
  map.addSource("sp-selected", { type: "geojson", data: empty });
  map.addSource("sp-hover", { type: "geojson", data: empty });
  map.addSource("sp-stops", { type: "geojson", data: empty });
  map.addSource(PLACES_SOURCE, { type: "geojson", data: empty, cluster: true, clusterRadius: CLUSTER_RADIUS, clusterMaxZoom: CLUSTER_MAX_ZOOM, clusterMinPoints: CLUSTER_MIN_POINTS, clusterProperties });

  map.addLayer({ id: "sp-rings-fill", type: "fill", source: "sp-rings", paint: { "fill-color": theme.accent, "fill-opacity": theme.dark ? 0.12 : 0.085 } }, firstLabel);
  map.addLayer({ id: "sp-rings-line", type: "line", source: "sp-rings", paint: { "line-color": theme.accent, "line-opacity": 0.55, "line-width": 1.2, "line-dasharray": [2, 2] } }, firstLabel);
  map.addLayer({ id: "sp-route-casing", type: "line", source: "sp-route", layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": theme.panel, "line-width": ["interpolate", ["linear"], ["zoom"], 10, 6, 16, 11] } });
  map.addLayer({ id: "sp-route-line", type: "line", source: "sp-route", layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": theme.accent, "line-width": ["interpolate", ["linear"], ["zoom"], 10, 3, 16, 6] } });
  map.addLayer({ id: "sp-rings-label", type: "symbol", source: "sp-rings", layout: { "symbol-placement": "line", "symbol-spacing": 420, "text-field": ["get", "label"], "text-font": ["Noto Sans Bold"], "text-size": 11, "text-keep-upright": true }, paint: { "text-color": theme.accent, "text-halo-color": theme.panel, "text-halo-width": 2 } });

  map.addLayer({ id: "sp-selected-halo", type: "circle", source: "sp-selected", paint: { "circle-radius": ["interpolate", ["linear"], ["zoom"], 10, 14, PIN_ZOOM, 20, 16, 24], "circle-color": ["get", "color"], "circle-opacity": 0.18, "circle-stroke-width": 2, "circle-stroke-color": ["get", "color"], "circle-stroke-opacity": 0.9 } });
  const unclustered = ["!", ["has", "point_count"]] as const;
  const opacity = ["case", ["==", ["get", "dim"], 1], 0.14, 1] as const;
  map.addLayer({ id: "sp-points-shadow", type: "circle", source: PLACES_SOURCE, filter: unclustered as never, paint: { "circle-radius": ["interpolate", ["linear"], ["zoom"], 3, 5, 12, 7, PIN_ZOOM, 13, 16, 15.5], "circle-color": "#000", "circle-opacity": ["case", ["==", ["get", "dim"], 1], 0, theme.dark ? 0.4 : 0.16], "circle-blur": 0.7, "circle-translate": [0, 1.5] } });
  map.addLayer({ id: "sp-points", type: "circle", source: PLACES_SOURCE, filter: unclustered as never, layout: { "circle-sort-key": ["-", 3, ["get", "rank"]] }, paint: { "circle-radius": ["interpolate", ["linear"], ["zoom"], 3, 4, 12, 5.5, PIN_ZOOM, 11.5, 16, 14], "circle-color": ["get", "color"], "circle-opacity": opacity as never, "circle-stroke-color": theme.dark ? "#141414" : "#ffffff", "circle-stroke-width": ["interpolate", ["linear"], ["zoom"], 3, 1.25, PIN_ZOOM, 2.25], "circle-stroke-opacity": opacity as never } });
  map.addLayer({ id: "sp-points-core", type: "circle", source: PLACES_SOURCE, minzoom: PIN_ZOOM, filter: ["all", unclustered, ["==", ["get", "icon"], ""]] as never, paint: { "circle-radius": ["interpolate", ["linear"], ["zoom"], PIN_ZOOM, 3, 16, 4], "circle-color": "#ffffff", "circle-opacity": opacity as never } });
  map.addLayer({ id: "sp-points-icon", type: "symbol", source: PLACES_SOURCE, minzoom: PIN_ZOOM, filter: ["all", unclustered, ["!=", ["get", "icon"], ""]] as never, layout: { "icon-image": ["concat", "sp-icon-", ["get", "icon"]], "icon-size": ["interpolate", ["linear"], ["zoom"], PIN_ZOOM, 0.85, 16, 1], "icon-overlap": "always", "icon-ignore-placement": true }, paint: { "icon-opacity": opacity as never } });
  map.addLayer({ id: "sp-points-note", type: "circle", source: PLACES_SOURCE, minzoom: PIN_ZOOM, filter: ["all", unclustered, ["==", ["get", "note"], 1]] as never, paint: { "circle-radius": 4.5, "circle-color": "#ffc53d", "circle-stroke-color": theme.dark ? "#141414" : "#ffffff", "circle-stroke-width": 1.75, "circle-translate": [10, -10], "circle-opacity": opacity as never, "circle-stroke-opacity": opacity as never } });
  map.addLayer({ id: "sp-hover-ring", type: "circle", source: "sp-hover", paint: { "circle-radius": ["interpolate", ["linear"], ["zoom"], 10, 10, PIN_ZOOM, 17, 16, 20], "circle-color": "transparent", "circle-stroke-width": 2.5, "circle-stroke-color": theme.ink } });
  map.addLayer({ id: "sp-labels", type: "symbol", source: PLACES_SOURCE, minzoom: 14.8, filter: unclustered as never, layout: { "symbol-sort-key": ["get", "rank"], "text-field": ["get", "name"], "text-font": ["Noto Sans Bold"], "text-size": ["interpolate", ["linear"], ["zoom"], 14.8, 11, 17, 13], "text-variable-anchor": ["left", "right", "top", "bottom"], "text-radial-offset": 1.35, "text-justify": "auto", "text-max-width": 9, "text-padding": 3, "text-optional": true, "text-overlap": "never" }, paint: { "text-color": theme.ink, "text-halo-color": theme.panel, "text-halo-width": 1.5, "text-halo-blur": 0.5, "text-opacity": opacity as never } });
  map.addLayer({ id: "sp-stops", type: "circle", source: "sp-stops", paint: { "circle-radius": 13, "circle-color": theme.ink, "circle-stroke-color": theme.panel, "circle-stroke-width": 2.5 } });
  map.addLayer({ id: "sp-stop-numbers", type: "symbol", source: "sp-stops", layout: { "text-field": ["to-string", ["get", "n"]], "text-font": ["Noto Sans Bold"], "text-size": 12.5, "text-allow-overlap": true, "text-ignore-placement": true }, paint: { "text-color": theme.panel } });
}

const setData = (map: GlMap, id: string, data: FeatureCollection) => (map.getSource(id) as GeoJSONSource | undefined)?.setData(data);
export const setPins = (map: GlMap, pins: PinInput[]) => setData(map, PLACES_SOURCE, pinCollection(pins));
export const setRings = (map: GlMap, rings: Ring[]) => setData(map, "sp-rings", { type: "FeatureCollection", features: rings });
export const setRouteLine = (map: GlMap, line: Array<[number, number]> | null) => setData(map, "sp-route", { type: "FeatureCollection", features: line && line.length > 1 ? [{ type: "Feature", geometry: { type: "LineString", coordinates: line }, properties: {} } satisfies Feature<LineString>] : [] });
export const setMarkedPoint = (map: GlMap, source: "sp-selected" | "sp-hover", place: SavedPlace | null, color = "#000") => setData(map, source, { type: "FeatureCollection", features: place ? [{ type: "Feature", geometry: { type: "Point", coordinates: [place.longitude, place.latitude] }, properties: { color } }] : [] });
export const setStops = (map: GlMap, stops: SavedPlace[]) => setData(map, "sp-stops", { type: "FeatureCollection", features: stops.map((p, i) => ({ type: "Feature", geometry: { type: "Point", coordinates: [p.longitude, p.latitude] }, properties: { n: i + 1 } })) });
