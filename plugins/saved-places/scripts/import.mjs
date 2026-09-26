#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, dirname, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const pluginRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const usage = `Usage: npm run import -- [--geocode] [--out <file>] <file…>

Builds data/saved-places.json from your own places. Each input file becomes one list.

  Google Takeout "Saved Places.json"  GeoJSON with coordinates (Starred places)
  Google Takeout Saved/<List>.csv     Title, Note, URL columns; needs --geocode
  Any GeoJSON file of Point features
  Any CSV with name, latitude, longitude columns (optional: address, url, list, category, type)

  --geocode   Look up missing coordinates with OpenStreetMap Nominatim (1 request per second)
  --out       Output path (default: data/saved-places.json)`;

const CATEGORY_RULES = [
  ["ramen", /ramen|ラーメン|noodle|soba|udon|tsukemen|pho\b/i],
  ["sushi", /sushi|寿司|omakase|sashimi/i],
  ["coffee", /coffee|café|cafe|espresso|roaster|coffee shop|tea house|bakery/i],
  ["bars", /\bbar\b|pub|brewery|cocktail|izakaya|wine|tavern|speakeasy|lounge/i],
  ["records", /record|vinyl|disk union|music store/i],
  ["music", /jazz|live music|concert|music venue|club|blue note/i],
  ["culture", /museum|gallery|temple|shrine|church|cathedral|castle|palace|monument|landmark|tower|library|theater|theatre|tourist attraction|historical/i],
  ["outdoors", /park|garden|beach|trail|hike|mountain|lake|viewpoint|nature|forest|island/i],
  ["stays", /hotel|hostel|inn\b|ryokan|resort|lodge|motel|airbnb/i],
  ["food", /restaurant|food|kitchen|diner|grill|taco|taqueria|pizza|burger|market|bistro|eatery|dumpling|bbq|steak|curry|bakery|deli|yokocho/i],
];

function categoryFor(...texts) {
  const text = texts.filter(Boolean).join(" ");
  return CATEGORY_RULES.find(([, pattern]) => pattern.test(text))?.[0] ?? "other";
}

function slugify(text) {
  return text.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "list";
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') { field += '"'; index += 1; }
      else if (char === '"') quoted = false;
      else field += char;
    } else if (char === '"') quoted = true;
    else if (char === ",") { row.push(field); field = ""; }
    else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[index + 1] === "\n") index += 1;
      row.push(field); rows.push(row); row = []; field = "";
    } else field += char;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  const nonEmpty = rows.filter(cells => cells.some(cell => cell.trim()));
  const header = (nonEmpty.shift() ?? []).map(cell => cell.replace(/^﻿/, "").trim().toLowerCase());
  return nonEmpty.map(cells => Object.fromEntries(header.map((name, column) => [name, (cells[column] ?? "").trim()])));
}

function pick(record, ...names) {
  for (const name of names) if (record[name]) return record[name];
  return "";
}

function number(value) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function coordinatesFromUrl(url) {
  const patterns = [/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/, /@(-?\d+\.\d+),(-?\d+\.\d+)/, /[?&](?:query|q|ll)=(-?\d+\.\d+),(-?\d+\.\d+)/];
  for (const pattern of patterns) {
    const match = pattern.exec(url);
    if (match) return { latitude: Number(match[1]), longitude: Number(match[2]) };
  }
  return null;
}

function nameFromUrl(url) {
  const match = /\/maps\/place\/([^/]+)/.exec(url);
  return match ? decodeURIComponent(match[1].replace(/\+/g, " ")) : "";
}

function normalizeUrl(url, name, latitude, longitude) {
  const cid = /0x[0-9a-f]+:(0x[0-9a-f]+)/i.exec(url)?.[1];
  if (cid) return `https://www.google.com/maps?cid=${BigInt(cid).toString()}`;
  if (/^https?:\/\//.test(url)) return url;
  return `https://www.google.com/maps/search/?${new URLSearchParams({ api: "1", query: `${name} ${latitude},${longitude}` })}`;
}

function recordsFromGeoJson(json, fallbackList) {
  const features = json.type === "FeatureCollection" ? json.features : [];
  return features.filter(feature => feature?.geometry?.type === "Point").map(feature => {
    const properties = feature.properties ?? {};
    const location = properties.location ?? properties.Location ?? {};
    const [longitude, latitude] = feature.geometry.coordinates;
    const hasPoint = !(longitude === 0 && latitude === 0);
    const url = properties.google_maps_url ?? properties["Google Maps URL"] ?? properties.url ?? "";
    return {
      name: location.name ?? location["Business Name"] ?? properties.Title ?? properties.title ?? properties.name ?? nameFromUrl(url),
      address: location.address ?? location.Address ?? properties.address ?? "",
      latitude: hasPoint ? latitude : null,
      longitude: hasPoint ? longitude : null,
      url,
      list: properties.list ?? fallbackList,
      category: properties.category ?? "",
      type: properties.type ?? "",
    };
  });
}

function recordsFromCsv(text, fallbackList) {
  return parseCsv(text).map(record => {
    const url = pick(record, "url", "google maps url", "link");
    const fromUrl = coordinatesFromUrl(url);
    return {
      name: pick(record, "name", "title") || nameFromUrl(url),
      address: pick(record, "address"),
      latitude: number(pick(record, "latitude", "lat")) ?? fromUrl?.latitude ?? null,
      longitude: number(pick(record, "longitude", "lng", "lon")) ?? fromUrl?.longitude ?? null,
      url,
      list: pick(record, "list", "collection") || fallbackList,
      category: pick(record, "category").toLowerCase(),
      type: pick(record, "type", "place type"),
    };
  });
}

const cachePath = resolve(pluginRoot, "data/.geocode-cache.json");
let lastRequest = 0;

async function geocode(query, cache) {
  if (query in cache) return cache[query];
  const wait = lastRequest + 1100 - Date.now();
  if (wait > 0) await new Promise(done => setTimeout(done, wait));
  lastRequest = Date.now();
  const response = await fetch(`https://nominatim.openstreetmap.org/search?${new URLSearchParams({ q: query, format: "jsonv2", limit: "1" })}`, {
    headers: { "User-Agent": "bb-plugin-saved-places-import (https://github.com/brsbl/bb-plugins)" },
  });
  if (!response.ok) throw new Error(`Nominatim returned ${response.status} for "${query}"`);
  const [hit] = await response.json();
  cache[query] = hit ? { latitude: Number(hit.lat), longitude: Number(hit.lon), address: hit.display_name, type: hit.type } : null;
  return cache[query];
}

async function main(argv) {
  const files = [];
  let out = resolve(pluginRoot, "data/saved-places.json");
  let shouldGeocode = false;
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--help" || token === "-h") { console.log(usage); return; }
    if (token === "--geocode") shouldGeocode = true;
    else if (token === "--out") out = resolve(argv[++index] ?? "");
    else files.push(resolve(token));
  }
  if (!files.length) { console.error(usage); process.exitCode = 1; return; }

  const records = [];
  for (const file of files) {
    const text = await readFile(file, "utf8");
    const stem = basename(file, extname(file));
    const fallbackList = stem === "Saved Places" ? "Starred places" : stem;
    records.push(...(extname(file).toLowerCase() === ".csv" ? recordsFromCsv(text, fallbackList) : recordsFromGeoJson(JSON.parse(text), fallbackList)));
  }

  const cache = shouldGeocode ? JSON.parse(await readFile(cachePath, "utf8").catch(() => "{}")) : {};
  const collections = new Map();
  const places = [];
  let skipped = 0;
  for (const record of records) {
    if (!record.name) { skipped += 1; continue; }
    let { latitude, longitude, address } = record;
    let type = record.type;
    if ((latitude === null || longitude === null) && shouldGeocode) {
      const hit = await geocode(address ? `${record.name}, ${address}` : record.name, cache);
      if (hit) { latitude = hit.latitude; longitude = hit.longitude; address ||= hit.address; type ||= hit.type; }
    }
    if (latitude === null || longitude === null) {
      skipped += 1;
      console.warn(`Skipped "${record.name}": no coordinates${shouldGeocode ? " found" : " (add --geocode to look them up)"}`);
      continue;
    }
    const collectionId = slugify(record.list);
    if (!collections.has(collectionId)) collections.set(collectionId, { id: collectionId, title: record.list, subtitle: "Saved list", emoji: "📍" });
    const known = ["ramen", "sushi", "food", "coffee", "bars", "records", "music", "culture", "outdoors", "stays", "other"];
    places.push({
      id: places.length + 1,
      name: record.name,
      address: address ?? "",
      latitude,
      longitude,
      url: normalizeUrl(record.url, record.name, latitude, longitude),
      collectionId,
      category: known.includes(record.category) ? record.category : categoryFor(record.name, type, address),
      placeType: type || null,
    });
  }

  if (shouldGeocode) await writeFile(cachePath, `${JSON.stringify(cache, null, 2)}\n`);
  if (!places.length) throw new Error("No places with coordinates were imported.");
  await mkdir(dirname(out), { recursive: true });
  await writeFile(out, `${JSON.stringify({ collections: [...collections.values()], places }, null, 2)}\n`);
  console.log(`Wrote ${places.length} places in ${collections.size} lists to ${out}${skipped ? ` (${skipped} skipped)` : ""}.`);
}

main(process.argv.slice(2)).catch(error => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
