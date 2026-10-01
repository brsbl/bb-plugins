import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRpc } from "@get-bb/plugin-sdk/app";
import type { rpcContract } from "./server";
import { applyCategoryOverrides, customToList, importedLists, type CustomList, type SavedList, type SavedState } from "./model";
import type { CategoryId } from "./categories";

export function useSavedState() {
  const rpc = useRpc<typeof rpcContract>();
  const [state, setState] = useState<SavedState>({ lists: [], notes: {}, categories: {} });
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const noteTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const latest = useRef(state);
  latest.current = state;

  useEffect(() => {
    let active = true;
    rpc.call("state", null).then(next => { if (active) { setState(next); setLoaded(true); } }, () => { if (active) { setError("Your notes and lists could not load."); setLoaded(true); } });
    return () => { active = false; };
  }, [rpc]);

  useMemo(() => applyCategoryOverrides(state.categories), [state.categories]);
  const lists = useMemo<SavedList[]>(() => [...state.lists.map(customToList).sort((a, b) => a.title.localeCompare(b.title)), ...importedLists], [state.lists]);
  const listsById = useMemo(() => new Map(lists.map(l => [l.id, l])), [lists]);

  const saveList = useCallback(async (list: CustomList) => {
    const previous = latest.current.lists.find(l => l.id === list.id);
    setState(current => ({ ...current, lists: current.lists.some(l => l.id === list.id) ? current.lists.map(l => l.id === list.id ? list : l) : [...current.lists, list] }));
    try {
      setState(await rpc.call("saveList", list));
      return true;
    } catch {
      setState(current => ({ ...current, lists: previous ? current.lists.map(l => l.id === list.id ? previous : l) : current.lists.filter(l => l.id !== list.id) }));
      return false;
    }
  }, [rpc]);
  const updatePlaces = useCallback(async (id: string, change: (keys: string[]) => string[]) => {
    const list = latest.current.lists.find(l => l.id === id);
    return list ? saveList({ ...list, placeKeys: change(list.placeKeys), updatedAt: Date.now() }) : false;
  }, [saveList]);
  const addPlaces = useCallback((id: string, keys: string[]) => updatePlaces(id, current => [...current, ...keys.filter(key => !current.includes(key))]), [updatePlaces]);
  const removePlaces = useCallback((id: string, keys: string[]) => updatePlaces(id, current => current.filter(key => !keys.includes(key))), [updatePlaces]);
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
  const saveCategory = useCallback(async (key: string, category: CategoryId | null) => {
    const previous = latest.current.categories;
    setState(current => {
      const categories = { ...current.categories };
      if (category) categories[key] = category;
      else delete categories[key];
      return { ...current, categories };
    });
    try {
      setState(await rpc.call("saveCategory", { key, category }));
    } catch {
      setState(current => ({ ...current, categories: previous }));
      setError("That category could not be saved. Try again.");
    }
  }, [rpc]);
  const togglePlaceInList = useCallback(async (list: CustomList, key: string) => {
    const placeKeys = list.placeKeys.includes(key) ? list.placeKeys.filter(k => k !== key) : [...list.placeKeys, key];
    if (!await saveList({ ...list, placeKeys, updatedAt: Date.now() })) setError("That list could not be saved. Try again.");
  }, [saveList]);

  return { loaded, error, fail: setError, clearError: () => setError(null), customLists: state.lists, notes: state.notes, categories: state.categories, lists, listsById, saveList, addPlaces, removePlaces, deleteList, saveNote, saveCategory, togglePlaceInList };
}
export type SavedStore = ReturnType<typeof useSavedState>;
