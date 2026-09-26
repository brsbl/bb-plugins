import { z } from "zod";
import { collections, places, type Place } from "./places";
import type { CategoryId } from "./categories";

export const LIST_COLORS = ["#e5484d", "#f76b15", "#d6a100", "#30a46c", "#12a594", "#0090ff", "#3e63dd", "#8e4ec6", "#d6409f", "#a18072"] as const;

export const customListSchema = z.object({
  id: z.string().min(1).max(64),
  title: z.string().trim().min(1).max(80),
  color: z.string().regex(/^#[0-9a-f]{6}$/i),
  placeKeys: z.array(z.string().min(1)).max(2000),
  sourceIds: z.array(z.string()).max(64),
  createdAt: z.number().int(),
  updatedAt: z.number().int(),
});
export type CustomList = z.infer<typeof customListSchema>;
export const noteSchema = z.object({ text: z.string().max(2000), updatedAt: z.number().int() });
export type Note = z.infer<typeof noteSchema>;
export const savedStateSchema = z.object({ lists: z.array(customListSchema), notes: z.record(z.string(), noteSchema) });
export type SavedState = z.infer<typeof savedStateSchema>;

export type ListGroup = "custom" | "trips" | "friends" | "saved";
export const GROUP_LABELS: Record<ListGroup, string> = { custom: "Your lists", trips: "Trips & cities", friends: "From friends", saved: "Saved by Google" };

export interface SavedPlace {
  key: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  url: string;
  category: CategoryId;
  placeType: string | null;
  photoUrl: string | null;
  rating: number | null;
  reviewCount: number | null;
  price: string | null;
  status: string | null;
  listIds: string[];
}

export interface SavedList {
  id: string;
  title: string;
  color: string;
  group: ListGroup;
  placeKeys: string[];
  custom: boolean;
  sourceIds: string[];
}

export function placeKey(place: Pick<Place, "url" | "name" | "latitude" | "longitude">) {
  const cid = /[?&]cid=(\d+)/.exec(place.url)?.[1];
  return cid ? `cid:${cid}` : `${place.name}|${place.latitude.toFixed(5)}|${place.longitude.toFixed(5)}`;
}

const SYSTEM_LISTS = new Set(["favorite-places", "want-to-go", "starred-places", "saved-places"]);
function groupFor(id: string, title: string): ListGroup {
  if (SYSTEM_LISTS.has(id)) return "saved";
  if (/recommendations/i.test(title)) return "friends";
  return "trips";
}

function buildPlaces() {
  const byKey = new Map<string, SavedPlace>();
  for (const p of places) {
    const key = placeKey(p);
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, { key, name: p.name, address: p.address, latitude: p.latitude, longitude: p.longitude, url: p.url, category: p.category, placeType: p.placeType, photoUrl: p.photoUrl, rating: p.rating, reviewCount: p.reviewCount, price: p.price, status: p.status, listIds: [p.collectionId] });
      continue;
    }
    if (!existing.listIds.includes(p.collectionId)) existing.listIds.push(p.collectionId);
    if (existing.category === "other" && p.category !== "other") existing.category = p.category;
    existing.placeType ??= p.placeType;
    existing.photoUrl ??= p.photoUrl;
    existing.rating ??= p.rating;
    existing.reviewCount ??= p.reviewCount;
    existing.price ??= p.price;
    existing.status ??= p.status;
    if (existing.address.length < p.address.length) existing.address = p.address;
  }
  return byKey;
}

export const placesByKey = buildPlaces();
export const allPlaces = [...placesByKey.values()];

export const importedLists: SavedList[] = collections.map((c, index) => ({
  id: c.id,
  title: c.title,
  color: LIST_COLORS[index % LIST_COLORS.length],
  group: groupFor(c.id, c.title),
  placeKeys: [...new Set(places.filter(p => p.collectionId === c.id).map(placeKey))],
  custom: false,
  sourceIds: [],
}));

export function customToList(list: CustomList): SavedList {
  return { id: list.id, title: list.title, color: list.color, group: "custom", placeKeys: list.placeKeys.filter(key => placesByKey.has(key)), custom: true, sourceIds: list.sourceIds };
}

export function shortAddress(address: string) {
  const parts = address.split(",").map(part => part.trim()).filter(Boolean);
  if (parts.length <= 2) return parts.join(", ");
  const withoutPostcode = parts.filter(part => !/^\d[\d-]*$/.test(part) && !/〒/.test(part));
  return withoutPostcode.slice(Math.max(0, withoutPostcode.length - 3), withoutPostcode.length - 1).join(", ");
}

export function matchesQuery(place: SavedPlace, query: string, note?: string) {
  const q = query.trim().toLocaleLowerCase();
  if (!q) return true;
  return `${place.name} ${place.address} ${place.placeType ?? ""} ${note ?? ""}`.toLocaleLowerCase().includes(q);
}
