import { matchesQuery, placesByKey, type Note, type SavedList, type SavedPlace } from "./model";
import type { ListFilter } from "./views/context";

export interface Selection { lists: SavedList[]; all: SavedPlace[]; filtered: SavedPlace[] }

export function selectLists(ids: string[], filter: ListFilter, getList: (id: string) => SavedList | undefined, notes: Record<string, Note>): Selection {
  const lists = ids.map(getList).filter((l): l is SavedList => l !== undefined);
  const seen = new Set<string>();
  const all: SavedPlace[] = [];
  for (const list of lists) for (const key of list.placeKeys) {
    if (seen.has(key)) continue;
    const place = placesByKey.get(key);
    if (!place) continue;
    seen.add(key);
    all.push(place);
  }
  const filtered = all.filter(place =>
    (!filter.categories.length || filter.categories.includes(place.category)) &&
    (!filter.notes || Boolean(notes[place.key])) &&
    matchesQuery(place, filter.query, notes[place.key]?.text));
  return { lists, all, filtered };
}
