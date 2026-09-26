import type { Note, SavedList } from "./model";
import { placesByKey } from "./model";

export const NOTES_LIST_ID = "@notes";
export const NOTE_COLOR = "#e2a336";

export function notesList(notes: Record<string, Note>): SavedList | undefined {
  const placeKeys = Object.entries(notes).filter(([key]) => placesByKey.has(key)).sort((a, b) => b[1].updatedAt - a[1].updatedAt).map(([key]) => key);
  if (!placeKeys.length) return undefined;
  return { id: NOTES_LIST_ID, title: "Your notes", color: NOTE_COLOR, group: "custom", placeKeys, custom: false, sourceIds: [] };
}
