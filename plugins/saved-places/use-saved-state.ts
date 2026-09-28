import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRpc } from "@get-bb/plugin-sdk/app";
import type { rpcContract } from "./server";
import { customToList, importedLists, type CustomList, type SavedList, type SavedState } from "./model";

export function useSavedState() {
  const rpc = useRpc<typeof rpcContract>();
  const [state, setState] = useState<SavedState>({ lists: [], notes: {} });
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const noteTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  useEffect(() => {
    let active = true;
    rpc.call("state", null).then(next => { if (active) { setState(next); setLoaded(true); } }, () => { if (active) { setError("Your notes and lists could not load."); setLoaded(true); } });
    return () => { active = false; };
  }, [rpc]);

  const lists = useMemo<SavedList[]>(() => [...state.lists.map(customToList).sort((a, b) => a.title.localeCompare(b.title)), ...importedLists], [state.lists]);
  const listsById = useMemo(() => new Map(lists.map(l => [l.id, l])), [lists]);

  const saveList = useCallback(async (list: CustomList) => {
    setState(current => ({ ...current, lists: current.lists.some(l => l.id === list.id) ? current.lists.map(l => l.id === list.id ? list : l) : [...current.lists, list] }));
    try { setState(await rpc.call("saveList", list)); } catch { setError("That list could not be saved. Try again."); }
  }, [rpc]);
  const deleteList = useCallback(async (id: string) => {
    setState(current => ({ ...current, lists: current.lists.filter(l => l.id !== id) }));
    try { setState(await rpc.call("deleteList", { id })); } catch { setError("That list could not be deleted. Try again."); }
  }, [rpc]);
  const saveNote = useCallback((key: string, text: string) => {
    setState(current => {
      const notes = { ...current.notes };
      if (text.trim()) notes[key] = { text, updatedAt: Date.now() };
      else delete notes[key];
      return { ...current, notes };
    });
    clearTimeout(noteTimers.current.get(key));
    noteTimers.current.set(key, setTimeout(() => {
      noteTimers.current.delete(key);
      rpc.call("saveNote", { key, text }).catch(() => setError("Your note could not be saved. Try again."));
    }, 500));
  }, [rpc]);
  const togglePlaceInList = useCallback((list: CustomList, key: string) => {
    const placeKeys = list.placeKeys.includes(key) ? list.placeKeys.filter(k => k !== key) : [...list.placeKeys, key];
    return saveList({ ...list, placeKeys, updatedAt: Date.now() });
  }, [saveList]);

  return { loaded, error, clearError: () => setError(null), customLists: state.lists, notes: state.notes, lists, listsById, saveList, deleteList, saveNote, togglePlaceInList };
}
export type SavedStore = ReturnType<typeof useSavedState>;
