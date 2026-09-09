import path from "node:path";
import { fileURLToPath } from "node:url";
import { readJson } from "./io.mjs";

export const NON_PRODUCT_AREAS = ["General", "Non-product", "Unclear"];
export const FEEDBACK_KINDS = new Set(["bug", "request", "complaint"]);
export const KINDS = new Set(["bug", "request", "complaint", "question", "praise", "showcase", "maintainer", "chatter"]);
export const SENTIMENTS = new Set(["positive", "negative", "neutral"]);
export const CONFIDENCES = new Set(["high", "medium", "low"]);

export function taxonomyPath() {
  return path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "taxonomy-v2.json");
}

export function loadTaxonomy() {
  const taxonomy = readJson(taxonomyPath());
  const themeOfV2Area = new Map();
  for (const [theme, areas] of Object.entries(taxonomy.themes)) {
    for (const area of areas) themeOfV2Area.set(area, theme);
  }
  const themeOfV1Area = new Map();
  for (const [v1Area, clusters] of Object.entries(taxonomy.map)) {
    const themes = new Set(Object.values(clusters).map((area) => themeOfV2Area.get(area)));
    if (themes.size !== 1) throw new Error(`v1 area ${v1Area} maps to ${themes.size} themes`);
    themeOfV1Area.set(v1Area, [...themes][0]);
  }
  return {
    themes: Object.keys(taxonomy.themes),
    areasByTheme: taxonomy.themes,
    v2Areas: Object.values(taxonomy.themes).flat(),
    v1Areas: taxonomy.v1.map((entry) => entry.area),
    v1: taxonomy.v1,
    short: taxonomy.short,
    map: taxonomy.map,
    themeOfV2Area,
    themeOfV1Area,
  };
}

export function v2AreaOf(taxonomy, v1Area, cluster) {
  const clusters = taxonomy.map[v1Area];
  if (!clusters) return v1Area;
  if (clusters["*"]) return clusters["*"];
  if (cluster === "") return `${taxonomy.themeOfV1Area.get(v1Area)}: unspecified`;
  return clusters[cluster] ?? clusters.Other ?? v1Area;
}

export function themeOf(taxonomy, v1Area, v2Area) {
  return taxonomy.themeOfV2Area.get(v2Area) ?? taxonomy.themeOfV1Area.get(v1Area) ?? v1Area;
}
