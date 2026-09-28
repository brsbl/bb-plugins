import { useCallback, useEffect, useMemo, useState } from "react";
import { placesByKey, type SavedPlace } from "./model";
import { bestOrder, matrix, orderCost, route as fetchRoute, type RouteResult, type TravelMode } from "./routing";

export const MAX_STOPS = 12;
const STORAGE_KEY = "saved-places:route";
const MODES: TravelMode[] = ["walk", "bike", "drive"];

function readSaved(): { stops: string[]; mode: TravelMode } {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    if (!raw || typeof raw !== "object") return { stops: [], mode: "walk" };
    const { stops, mode } = raw as { stops?: unknown; mode?: unknown };
    return {
      stops: Array.isArray(stops) ? stops.filter((k): k is string => typeof k === "string" && placesByKey.has(k)).slice(0, MAX_STOPS) : [],
      mode: MODES.find(m => m === mode) ?? "walk",
    };
  } catch {
    return { stops: [], mode: "walk" };
  }
}

export function useRoute() {
  const [initial] = useState(readSaved);
  const [stops, setStops] = useState<string[]>(initial.stops);
  const [mode, setMode] = useState<TravelMode>(initial.mode);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ stops, mode })); } catch { return; }
  }, [stops, mode]);
  const [result, setResult] = useState<(RouteResult & { signature: string }) | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [optimizing, setOptimizing] = useState(false);
  const [undo, setUndo] = useState<{ order: string[]; saved: number } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const places = useMemo(() => stops.map(key => placesByKey.get(key)).filter((p): p is SavedPlace => Boolean(p)), [stops]);
  const signature = `${mode}:${stops.join(",")}`;

  useEffect(() => {
    if (places.length < 2) { setResult(null); setLoading(false); return; }
    const controller = new AbortController();
    setLoading(true);
    const timer = setTimeout(() => {
      fetchRoute(places, mode, controller.signal)
        .then(next => { setResult({ ...next, signature }); setError(null); })
        .catch(() => { if (!controller.signal.aborted) setError("Directions are unavailable right now. Try again in a moment."); })
        .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [places, mode, signature]);

  const change = useCallback((next: (current: string[]) => string[]) => {
    setUndo(null);
    setNotice(null);
    setStops(current => next(current));
  }, []);
  const add = useCallback((key: string) => change(current => current.includes(key) || current.length >= MAX_STOPS ? current : [...current, key]), [change]);
  const remove = useCallback((key: string) => change(current => current.filter(k => k !== key)), [change]);
  const toggle = useCallback((key: string) => change(current => current.includes(key) ? current.filter(k => k !== key) : current.length >= MAX_STOPS ? current : [...current, key]), [change]);
  const move = useCallback((index: number, offset: -1 | 1) => change(current => {
    const target = index + offset;
    if (target < 0 || target >= current.length) return current;
    const next = [...current];
    [next[index], next[target]] = [next[target], next[index]];
    return next;
  }), [change]);
  const clear = useCallback(() => change(() => []), [change]);

  const optimize = useCallback(async (keepStart: boolean) => {
    if (places.length < 3) return;
    setOptimizing(true);
    setNotice(null);
    try {
      const times = await matrix(places, mode);
      const order = bestOrder(times, keepStart);
      const before = orderCost(times, places.map((_, i) => i));
      const after = orderCost(times, order);
      if (before - after < 30) {
        setNotice("This is already the quickest order.");
        return;
      }
      setUndo({ order: stops, saved: before - after });
      setStops(order.map(i => places[i].key));
    } catch {
      setError("The quickest order could not be worked out. Try again in a moment.");
    } finally {
      setOptimizing(false);
    }
  }, [places, mode, stops]);

  return {
    stops, places, mode, setMode, loading, error, clearError: () => setError(null), optimizing, undo, notice,
    result: result?.signature === signature ? result : null,
    add, remove, toggle, move, clear, optimize,
    applyUndo: () => { if (undo) { setStops(undo.order); setUndo(null); } },
    dismissUndo: () => { setUndo(null); setNotice(null); },
  };
}
export type RouteStore = ReturnType<typeof useRoute>;
