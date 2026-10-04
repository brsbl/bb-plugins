import { useMemo } from "react";
import type { DesktopGroup } from "../core";
import { noteTitle, useSavedNotes, type StickyNote } from "../page/sticky-notes";
import { useDesktop } from "./data";

export const RECYCLE_BIN_KEY = "recycle-bin";
export const MORE_KEY = "more";
export const NOTE_KEY_PREFIX = "note:";

export type DesktopEntry =
  | { kind: "group"; key: string; title: string; group: DesktopGroup }
  | { kind: "note"; key: string; title: string; note: StickyNote }
  | { kind: "more"; key: string; title: string }
  | { kind: "recycle-bin"; key: string; title: string };

/** The canvas and Finder show the same live entries, with the same layout identities. */
export function useDesktopEntries(): DesktopEntry[] {
  const { desktopGroups, moreGroups } = useDesktop();
  const notes = useSavedNotes();
  const hasMore = moreGroups.length > 0;
  return useMemo<DesktopEntry[]>(() => [
    { kind: "recycle-bin", key: RECYCLE_BIN_KEY, title: "Recycle Bin" },
    ...(hasMore ? [{ kind: "more" as const, key: MORE_KEY, title: "More" }] : []),
    ...desktopGroups.map((group) => ({ kind: "group" as const, key: group.key, title: group.name, group })),
    ...notes.map((note) => ({ kind: "note" as const, key: NOTE_KEY_PREFIX + note.id, title: noteTitle(note), note })),
  ], [desktopGroups, hasMore, notes]);
}
