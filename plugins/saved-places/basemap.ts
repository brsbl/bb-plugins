import type { ExpressionSpecification, LayerSpecification, StyleSpecification } from "maplibre-gl";
import { categories, groupOf } from "./categories";

export interface MapTheme {
  dark: boolean;
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
  return { dark, panel, ink, muted, accent: dark ? "#8da4ff" : "#3e63dd" };
}

export function mixHex(from: string, to: string, amount: number) {
  const channel = (hex: string, i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);
  return `#${[0, 1, 2].map(i => Math.round(channel(from, i) + (channel(to, i) - channel(from, i)) * amount).toString(16).padStart(2, "0")).join("")}`;
}

const palettes = {
  light: {
    land: "#f6f3ee", park: "#d3ebc4", wood: "#c8e4b6", grass: "#dcefd0", wetland: "#d6ebe0", sand: "#f5ebcd", ice: "#fbfdff",
    cemetery: "#e0e9d7", hospital: "#f8e4e7", school: "#f2ecdf", pitch: "#cde8bf", commercial: "#f4eee8",
    water: "#a4d6f6", waterLine: "#8fcbf2", aeroway: "#e9e5ec",
    building: "#ebe6dd", buildingLine: "#ddd6ca",
    motorway: "#ffc56e", motorwayCase: "#e7a449", trunk: "#ffe29b", trunkCase: "#e8c37a",
    road: "#ffffff", roadCase: "#d8d1c5", minorCase: "#e3ddd3", path: "#cfc3ae", rail: "#c7c1b7", ferry: "#6fb2e3",
    boundary: "#b3aac4", boundaryState: "#cfc8d8",
    city: "#26292e", town: "#3b3f45", village: "#51555b", suburb: "#7b7e84", country: "#55585e", state: "#9a948c",
    roadLabel: "#5c6066", waterLabel: "#3a78a6", halo: "#ffffff", waterHalo: "rgba(255,255,255,0.75)",
  },
  dark: {
    land: "#1e2127", park: "#1f3428", wood: "#1c3124", grass: "#21332a", wetland: "#1e3130", sand: "#2c2a24", ice: "#2a2f37",
    cemetery: "#222c25", hospital: "#312428", school: "#2a282b", pitch: "#213a2a", commercial: "#23252b",
    water: "#132b44", waterLine: "#16324e", aeroway: "#2a2d34",
    building: "#2a2e35", buildingLine: "#31363e",
    motorway: "#6f5531", motorwayCase: "#15171b", trunk: "#5b4d35", trunkCase: "#15171b",
    road: "#3a3f48", roadCase: "#16181c", minorCase: "#191b20", path: "#3f444c", rail: "#3a3e45", ferry: "#2f6a99",
    boundary: "#5d6170", boundaryState: "#454956",
    city: "#dadde2", town: "#bfc3ca", village: "#a4a8b0", suburb: "#8a8f97", country: "#a9adb4", state: "#7f848c",
    roadLabel: "#9ca1a9", waterLabel: "#6e9cc4", halo: "#1e2127", waterHalo: "rgba(20,24,30,0.8)",
  },
};

type LayerOf<T extends LayerSpecification["type"]> = Extract<LayerSpecification, { type: T }>;
type LinePaint = NonNullable<LayerOf<"line">["paint"]>;
type FillPaint = NonNullable<LayerOf<"fill">["paint"]>;
type SymbolLayout = NonNullable<LayerOf<"symbol">["layout"]>;

const matchExpression = (input: ExpressionSpecification, arms: Array<string | string[]>, fallback: string | ExpressionSpecification) => ["match", input, ...arms, fallback] as ExpressionSpecification;
const latinName: ExpressionSpecification = ["coalesce", ["get", "name:en"], ["get", "name:latin"], ["get", "name"]];
const zoomWidth = (...stops: Array<number | ExpressionSpecification>): ExpressionSpecification => ["interpolate", ["exponential", 1.2], ["zoom"], ...stops];
const classIn = (...values: string[]): ExpressionSpecification => ["match", ["get", "class"], values, true, false];
const lines: ExpressionSpecification = ["match", ["geometry-type"], ["LineString", "MultiLineString"], true, false];
const tunnelOpacity: ExpressionSpecification = ["case", ["==", ["get", "brunnel"], "tunnel"], 0.45, 1];

const poiArms = categories.flatMap(category => category.poi.length ? [category.poi, category.id] : []);
const lowerName: ExpressionSpecification = ["downcase", ["coalesce", ["get", "name:en"], ["get", "name:latin"], ["get", "name"], ""]];
const rawName: ExpressionSpecification = ["coalesce", ["get", "name"], ""];
const nameHas = (...needles: string[]): ExpressionSpecification => ["any", ...needles.map(needle => ["in", needle, /[a-z]/.test(needle) ? lowerName : rawName] as ExpressionSpecification)];
const worship: ExpressionSpecification = ["case",
  nameHas("shrine", "jinja", "jingu", "taisha", "神社", "神宮", "大社", "稲荷"), "shrine",
  nameHas("temple", "pagoda", "monastery", "寺", "院", "wat "), "temple",
  nameHas("mosque", "masjid", "جامع", "مسجد"), "mosque",
  "church",
];
export const poiCategory: ExpressionSpecification = ["case",
  ["==", ["get", "class"], "place_of_worship"], worship,
  matchExpression(["get", "subclass"], poiArms, matchExpression(["get", "class"], poiArms, "")),
];

export function streetsStyle(theme: Pick<MapTheme, "dark">, { labels = true }: { labels?: boolean } = {}): StyleSpecification {
  const c = theme.dark ? palettes.dark : palettes.light;
  const road = (id: string, filter: ExpressionSpecification, color: string, width: ExpressionSpecification, minzoom = 0, extra: LinePaint = {}): LayerSpecification => ({
    id, type: "line", source: "openmaptiles", "source-layer": "transportation", minzoom, filter: ["all", lines, filter],
    layout: { "line-cap": "round", "line-join": "round" },
    paint: { "line-color": color, "line-width": width, "line-opacity": tunnelOpacity, ...extra },
  });
  const fill = (id: string, sourceLayer: string, filter: ExpressionSpecification | null, color: string, extra: FillPaint = {}, minzoom = 0): LayerSpecification => ({
    id, type: "fill", source: "openmaptiles", "source-layer": sourceLayer, minzoom, ...(filter ? { filter } : {}), paint: { "fill-color": color, "fill-antialias": false, ...extra },
  });
  const halo = { "text-halo-color": c.halo, "text-halo-width": 1.4, "text-halo-blur": 0.4 };
  const place = (id: string, filter: ExpressionSpecification, color: string, size: ExpressionSpecification, minzoom: number, maxzoom: number, layout: SymbolLayout = {}): LayerSpecification => ({
    id, type: "symbol", source: "openmaptiles", "source-layer": "place", minzoom, maxzoom, filter,
    layout: { "text-field": latinName, "text-font": ["Noto Sans Regular"], "text-size": size, "text-max-width": 8, "symbol-sort-key": ["coalesce", ["get", "rank"], 99], ...layout },
    paint: { "text-color": color, ...halo },
  });
  const labelTone = theme.dark ? "#ffffff" : "#000000";
  const poiText = matchExpression(poiCategory, categories.flatMap(category => [category.id, mixHex(groupOf(category.id).color, labelTone, 0.38)]), c.roadLabel);
  const poi = (id: string, filter: ExpressionSpecification, minzoom: number): LayerSpecification => ({
    id, type: "symbol", source: "openmaptiles", "source-layer": "poi", minzoom, filter,
    layout: {
      "icon-image": ["concat", "sp-poi-", poiCategory], "icon-size": ["interpolate", ["linear"], ["zoom"], 14, 0.85, 17, 1],
      "symbol-sort-key": ["coalesce", ["get", "rank"], 99], "icon-padding": 2,
      "text-field": latinName, "text-font": ["Noto Sans Regular"], "text-size": ["interpolate", ["linear"], ["zoom"], 14, 10.5, 18, 12.5],
      "text-max-width": 8, "text-variable-anchor": ["top", "bottom", "left", "right"], "text-radial-offset": 0.95, "text-justify": "auto", "text-padding": 2,
    },
    paint: { "text-color": poiText, ...halo },
  });

  const base: LayerSpecification[] = [
    { id: "background", type: "background", paint: { "background-color": c.land } },
    fill("landuse-commercial", "landuse", classIn("commercial", "retail"), c.commercial, {}, 12),
    fill("landcover-wood", "landcover", classIn("wood", "forest"), c.wood),
    fill("landcover-grass", "landcover", classIn("grass", "meadow", "scrub", "farmland"), c.grass, { "fill-opacity": 0.7 }),
    fill("landcover-wetland", "landcover", classIn("wetland"), c.wetland),
    fill("landcover-sand", "landcover", classIn("sand", "beach"), c.sand),
    fill("landcover-ice", "landcover", classIn("ice", "glacier"), c.ice),
    fill("landuse-cemetery", "landuse", classIn("cemetery"), c.cemetery),
    fill("landuse-hospital", "landuse", classIn("hospital"), c.hospital),
    fill("landuse-school", "landuse", classIn("school", "university", "college", "kindergarten"), c.school),
    fill("park", "park", null, c.park, { "fill-opacity": ["interpolate", ["linear"], ["zoom"], 5, 0.5, 9, 0.9] }),
    fill("landuse-pitch", "landuse", classIn("pitch", "stadium", "playground", "zoo", "theme_park"), c.pitch),
    { id: "waterway", type: "line", source: "openmaptiles", "source-layer": "waterway", filter: ["!=", ["get", "brunnel"], "tunnel"], layout: { "line-cap": "round" }, paint: { "line-color": c.waterLine, "line-width": ["interpolate", ["exponential", 1.3], ["zoom"], 8, ["match", ["get", "class"], "river", 1, 0.4], 18, ["match", ["get", "class"], "river", 10, 3]] } },
    fill("water", "water", ["!=", ["get", "brunnel"], "tunnel"], c.water),
    fill("aeroway-area", "aeroway", ["match", ["geometry-type"], ["Polygon", "MultiPolygon"], true, false], c.aeroway, {}, 11),
    { id: "aeroway-runway", type: "line", source: "openmaptiles", "source-layer": "aeroway", minzoom: 11, filter: ["all", lines, classIn("runway", "taxiway")], paint: { "line-color": c.aeroway, "line-width": zoomWidth(11, ["match", ["get", "class"], "runway", 3, 0.5], 18, ["match", ["get", "class"], "runway", 40, 10]) } },
    fill("building", "building", null, c.building, { "fill-antialias": true, "fill-outline-color": c.buildingLine, "fill-opacity": ["interpolate", ["linear"], ["zoom"], 14, 0, 15, 1] }, 14),

    road("road-path", classIn("path", "track", "pedestrian"), c.path, zoomWidth(15, 0.8, 20, 2.5), 15, { "line-dasharray": [2, 1.2] }),
    road("road-minor-case", classIn("minor", "service", "busway"), c.minorCase, zoomWidth(12, 0.5, 13, 1, 14, 4, 20, 20), 12, { "line-opacity": ["interpolate", ["linear"], ["zoom"], 12, 0, 12.5, tunnelOpacity] }),
    road("road-secondary-case", classIn("secondary", "tertiary"), c.roadCase, zoomWidth(8, 1.5, 20, 17), 8),
    road("road-primary-case", classIn("primary"), c.roadCase, zoomWidth(7, 0.7, 20, 22), 7),
    road("road-trunk-case", classIn("trunk"), c.trunkCase, zoomWidth(5, 0.4, 7, 0.7, 20, 22), 5),
    road("road-motorway-case", classIn("motorway"), c.motorwayCase, zoomWidth(5, 0.4, 7, 0.7, 20, 22), 5),
    road("road-minor", classIn("minor", "service", "busway"), c.road, zoomWidth(13.5, 0, 14, 2.5, 20, 18), 13.5),
    road("road-secondary", classIn("secondary", "tertiary"), c.road, zoomWidth(6.5, 0, 8, 0.5, 20, 13), 6.5),
    road("road-primary", classIn("primary"), c.road, zoomWidth(5, 0, 7, 1, 20, 18), 5),
    road("road-trunk", classIn("trunk"), c.trunk, zoomWidth(5, 0, 7, 1, 20, 18), 5),
    road("road-motorway", classIn("motorway"), c.motorway, zoomWidth(5, 0, 7, 1, 20, 18), 5),
    road("road-rail", classIn("rail", "transit"), c.rail, ["interpolate", ["exponential", 1.4], ["zoom"], 11, 0.4, 15, 0.9, 20, 2.2], 11),
    road("road-ferry", classIn("ferry"), c.ferry, ["interpolate", ["linear"], ["zoom"], 8, 0.5, 16, 1.4], 8, { "line-dasharray": [2, 2] }),
    { id: "boundary-state", type: "line", source: "openmaptiles", "source-layer": "boundary", minzoom: 3, filter: ["all", [">=", ["get", "admin_level"], 3], ["<=", ["get", "admin_level"], 4], ["!=", ["get", "maritime"], 1]], paint: { "line-color": c.boundaryState, "line-dasharray": [2, 2], "line-width": ["interpolate", ["linear"], ["zoom"], 4, 0.6, 10, 1.2] } },
    { id: "boundary-country", type: "line", source: "openmaptiles", "source-layer": "boundary", filter: ["all", ["==", ["get", "admin_level"], 2], ["!=", ["get", "maritime"], 1], ["!=", ["get", "disputed"], 1]], layout: { "line-join": "round" }, paint: { "line-color": c.boundary, "line-width": ["interpolate", ["linear"], ["zoom"], 2, 0.6, 6, 1.1, 12, 2] } },
  ];

  const symbols: LayerSpecification[] = [
    { id: "water-name-line", type: "symbol", source: "openmaptiles", "source-layer": "waterway", minzoom: 12, filter: ["all", lines, ["has", "name"]], layout: { "symbol-placement": "line", "symbol-spacing": 400, "text-field": latinName, "text-font": ["Noto Sans Italic"], "text-size": 11.5, "text-letter-spacing": 0.08 }, paint: { "text-color": c.waterLabel, "text-halo-color": c.waterHalo, "text-halo-width": 1.2 } },
    { id: "water-name", type: "symbol", source: "openmaptiles", "source-layer": "water_name", filter: ["match", ["geometry-type"], ["Point", "MultiPoint"], true, false], layout: { "text-field": latinName, "text-font": ["Noto Sans Italic"], "text-size": ["interpolate", ["linear"], ["zoom"], 3, 11, 10, 13, 16, 15], "text-max-width": 6, "text-letter-spacing": 0.1 }, paint: { "text-color": c.waterLabel, "text-halo-color": c.waterHalo, "text-halo-width": 1.2 } },
    { id: "road-name-minor", type: "symbol", source: "openmaptiles", "source-layer": "transportation_name", minzoom: 15, filter: ["all", lines, classIn("minor", "service", "pedestrian")], layout: { "symbol-placement": "line", "text-field": latinName, "text-font": ["Noto Sans Regular"], "text-size": ["interpolate", ["linear"], ["zoom"], 15, 10, 19, 13], "text-rotation-alignment": "map", "text-padding": 4 }, paint: { "text-color": c.roadLabel, ...halo } },
    { id: "road-name-major", type: "symbol", source: "openmaptiles", "source-layer": "transportation_name", minzoom: 12, filter: ["all", lines, classIn("motorway", "trunk", "primary", "secondary", "tertiary")], layout: { "symbol-placement": "line", "text-field": latinName, "text-font": ["Noto Sans Regular"], "text-size": ["interpolate", ["linear"], ["zoom"], 12, 10, 19, 14], "text-rotation-alignment": "map", "text-padding": 4 }, paint: { "text-color": c.roadLabel, ...halo } },
    poi("poi-transport", ["match", poiCategory, ["transit", "ferry"], true, false], 13),
    poi("poi", ["all", ["match", poiCategory, ["", "transit", "ferry"], false, true], ["<=", ["coalesce", ["get", "rank"], 99], ["step", ["zoom"], 6, 16, 18, 17, 999]]], 14.5),
    { id: "airport", type: "symbol", source: "openmaptiles", "source-layer": "aerodrome_label", minzoom: 10, filter: ["all", ["has", "iata"], ["match", ["get", "class"], ["international", "public", "regional"], true, false]], layout: { "icon-image": "sp-poi-airport", "text-field": latinName, "text-font": ["Noto Sans Regular"], "text-size": 11.5, "text-anchor": "top", "text-offset": [0, 1], "text-max-width": 8 }, paint: { "text-color": mixHex(groupOf("airport").color, labelTone, 0.38), ...halo } },
    place("place-minor", classIn("hamlet", "isolated_dwelling", "locality", "island"), c.suburb, ["interpolate", ["linear"], ["zoom"], 13, 10.5, 16, 12.5], 13, 24),
    place("place-suburb", classIn("suburb", "quarter", "neighbourhood"), c.suburb, ["interpolate", ["linear"], ["zoom"], 11, 9.5, 15, 12], 11, 16.5, { "text-transform": "uppercase", "text-letter-spacing": 0.12 }),
    place("place-village", classIn("village"), c.village, ["interpolate", ["linear"], ["zoom"], 10, 11, 15, 14], 10, 24),
    place("place-town", classIn("town"), c.town, ["interpolate", ["linear"], ["zoom"], 7, 11, 12, 14, 15, 16], 7, 24),
    place("place-city", classIn("city"), c.city, ["interpolate", ["linear"], ["zoom"], 3, 11, 8, 14, 12, 18, 15, 21], 3, 24, { "text-font": ["case", ["<=", ["coalesce", ["get", "rank"], 99], 5], ["literal", ["Noto Sans Bold"]], ["literal", ["Noto Sans Regular"]]] }),
    place("place-state", classIn("state", "province"), c.state, ["interpolate", ["linear"], ["zoom"], 3, 9, 7, 11.5], 3, 8, { "text-transform": "uppercase", "text-letter-spacing": 0.14 }),
    place("place-country", classIn("country"), c.country, ["interpolate", ["linear"], ["zoom"], 1, 10, 4, 13, 7, 17], 0, 9, { "text-font": ["Noto Sans Bold"], "text-max-width": 6.5 }),
  ];

  return {
    version: 8,
    name: theme.dark ? "Saved Places Streets Dark" : "Saved Places Streets",
    glyphs: "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf",
    sources: { openmaptiles: { type: "vector", url: "https://tiles.openfreemap.org/planet", attribution: '<a href="https://openfreemap.org" target="_blank">OpenFreeMap</a> <a href="https://www.openmaptiles.org/" target="_blank">&copy; OpenMapTiles</a> Data from <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>' } },
    layers: labels ? [...base, ...symbols] : base,
  };
}
