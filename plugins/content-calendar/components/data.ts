import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRealtime, useRealtimeConnectionState, useRpc, type PluginRpcClient } from "@get-bb/plugin-sdk/app";
import { CHANGED, type AddInput, type ConnectionStatus, type RpcContract } from "../contract.js";
import { todayInCalendar, type Item, type Tray } from "../model.js";
import { byPos, placementPos, type Placement } from "../calendar-layout.js";
import { useToasts } from "./toasts.js";

export type Rpc = PluginRpcClient<RpcContract>;
export type When = { date: string } | { tray: Tray };
export const useCalendarRpc = (): Rpc => useRpc<RpcContract>();
export const readableError = (error: unknown) => error instanceof Error && error.message ? error.message : "Something went wrong. Try again.";

/** Reason the server publishes with CHANGED when only the connection state moved. */
const STATUS_REASON = "status";
const RELOAD_DEBOUNCE_MS = 250;

/**
 * Reloads on the plugin's change signal, and after the realtime socket
 * reconnects (signals are not replayed). Signals are debounced so a burst
 * (the engine's "items" then "sync") becomes one reload. A `status`-only
 * signal calls `onStatus` instead, or nothing when the view shows no status.
 */
export function useLiveReload(reload: () => void, onStatus?: () => void) {
  const latest = useRef({ reload, onStatus }); latest.current = { reload, onStatus };
  const pending = useRef<{ timer: ReturnType<typeof setTimeout>; full: boolean } | null>(null);
  const schedule = useCallback((full: boolean) => {
    if (!full && !latest.current.onStatus && !pending.current) return;
    const wasFull = pending.current?.full ?? false;
    if (pending.current) clearTimeout(pending.current.timer);
    const entry = { full: full || wasFull, timer: setTimeout(() => {
      pending.current = null;
      if (entry.full) latest.current.reload(); else latest.current.onStatus?.();
    }, RELOAD_DEBOUNCE_MS) };
    pending.current = entry;
  }, []);
  useEffect(() => () => { if (pending.current) clearTimeout(pending.current.timer); pending.current = null; }, []);
  useRealtime(CHANGED, (payload) => {
    const reason = payload && typeof payload === "object" ? (payload as { reason?: unknown }).reason : undefined;
    schedule(reason !== STATUS_REASON);
  });
  const state = useRealtimeConnectionState();
  const previous = useRef(state);
  useEffect(() => {
    if (state === "connected" && previous.current !== "connected") schedule(true);
    previous.current = state;
  }, [state, schedule]);
}

/** Tells the server a calendar is on screen about every 30 seconds, so it polls Google every minute. */
export function useVisiblePing() {
  const rpc = useCalendarRpc();
  useEffect(() => {
    const ping = () => { if (document.visibilityState === "visible") void rpc.call("visible", {}).catch(() => {}); };
    ping();
    const timer = setInterval(ping, 30_000);
    document.addEventListener("visibilitychange", ping);
    return () => { clearInterval(timer); document.removeEventListener("visibilitychange", ping); };
  }, [rpc]);
}

/** Re-renders on an interval, for relative times like "Synced 1 min ago". */
export function useNow(interval = 30_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), interval); return () => clearInterval(timer); }, [interval]);
  return now;
}

export function useStatus() {
  const rpc = useCalendarRpc();
  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const version = useRef(0);
  const reload = useCallback(async () => {
    const current = ++version.current;
    try {
      const next = await rpc.call("status", {});
      if (current === version.current) { setStatus(next); setError(null); }
    } catch (err) { if (current === version.current) setError(readableError(err)); }
  }, [rpc]);
  useEffect(() => { void reload(); }, [reload]);
  useLiveReload(() => void reload(), () => void reload());
  return { status, error, reload, setStatus };
}

interface CalendarData { items: Item[]; evergreen: Item[]; later: Item[]; status: ConnectionStatus }
export interface CalendarView { dated: Item[]; evergreen: Item[]; later: Item[]; status: ConnectionStatus }

function place(data: CalendarData, item: Item, from: string, to: string): CalendarData {
  const without = (list: Item[]) => list.filter((entry) => entry.id !== item.id);
  const next = { ...data, items: without(data.items), evergreen: without(data.evergreen), later: without(data.later) };
  if (item.tray === "evergreen") next.evergreen.push(item);
  else if (item.tray === "later") next.later.push(item);
  else if (item.date && item.date >= from && item.date <= to) next.items.push(item);
  return next;
}

/**
 * The calendar's items for [from, to] plus both trays, kept live. Moves,
 * checks, and deletes show at once through local overrides and settle when
 * the server answers; a failed write drops its override and reports one line.
 */
export function useCalendarData(from: string, to: string, trays: boolean) {
  const rpc = useCalendarRpc();
  const [data, setData] = useState<CalendarData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [overrides, setOverrides] = useState<ReadonlyMap<string, Item | null>>(() => new Map());
  const version = useRef(0);
  const bounds = useRef({ from, to }); bounds.current = { from, to };
  const load = useCallback(async () => {
    const current = ++version.current;
    try {
      const next = await rpc.call("calendar", { from, to, trays });
      if (current === version.current) { setData(next); setLoadError(null); }
    } catch (err) { if (current === version.current) setLoadError(readableError(err)); }
  }, [rpc, from, to, trays]);
  useEffect(() => { void load(); }, [load]);
  // A status-only signal refreshes the connection state without refetching items.
  const loadStatus = useCallback(async () => {
    try {
      const status = await rpc.call("status", {});
      setData((current) => current && { ...current, status });
    } catch { /* the next full reload reports it */ }
  }, [rpc]);
  useLiveReload(() => void load(), () => void loadStatus());
  useVisiblePing();

  const setOverride = useCallback((id: string, value: Item | null) => setOverrides((map) => new Map(map).set(id, value)), []);
  const clearOverride = useCallback((id: string) => setOverrides((map) => { const next = new Map(map); next.delete(id); return next; }), []);
  const upsert = useCallback((item: Item) => setData((current) => current && place(current, item, bounds.current.from, bounds.current.to)), []);
  const drop = useCallback((id: string) => setData((current) => current && {
    ...current, items: current.items.filter((item) => item.id !== id), evergreen: current.evergreen.filter((item) => item.id !== id), later: current.later.filter((item) => item.id !== id),
  }), []);

  const view = useMemo<CalendarView | null>(() => {
    if (!data) return null;
    const all = new Map<string, Item>();
    for (const item of [...data.items, ...data.evergreen, ...data.later]) all.set(item.id, item);
    for (const [id, value] of overrides) { if (value) all.set(id, value); else all.delete(id); }
    const list = [...all.values()];
    return {
      dated: list.filter((item) => !item.tray && item.date && item.date >= from && item.date <= to),
      evergreen: list.filter((item) => item.tray === "evergreen").sort(byPos),
      later: list.filter((item) => item.tray === "later").sort(byPos),
      status: data.status,
    };
  }, [data, overrides, from, to]);

  /** Moves an item to a day or tray, placed among `list` (the destination, in order). */
  const move = useCallback(async (item: Item, when: When, placement: Placement, list: readonly Item[]) => {
    const pos = placementPos(list, item.id, placement);
    setOverride(item.id, { ...item, date: "date" in when ? when.date : null, tray: "tray" in when ? when.tray : null, pos });
    setActionError(null);
    try {
      upsert(await rpc.call("move", { id: item.id, when, ...placement }));
    } catch (err) {
      setActionError(`Couldn't move “${item.title}”. ${readableError(err)}`);
    } finally { clearOverride(item.id); }
  }, [rpc, setOverride, clearOverride, upsert]);

  /** The checkbox. Checking a tray item gives it today's date; unchecking returns it to Ready. */
  const setPosted = useCallback(async (item: Item, posted: boolean) => {
    const toDay = posted && !!item.tray;
    setOverride(item.id, { ...item, status: posted ? "posted" : "ready", ...(toDay ? { tray: null, date: todayInCalendar() } : {}) });
    setActionError(null);
    try {
      upsert(await rpc.call("update", { id: item.id, status: posted ? "posted" : "ready" }));
    } catch (err) {
      setActionError(`Couldn't update “${item.title}”. ${readableError(err)}`);
    } finally { clearOverride(item.id); }
  }, [rpc, setOverride, clearOverride, upsert]);

  const add = useCallback(async (input: AddInput) => {
    const item = await rpc.call("add", input);
    upsert(item);
    return item;
  }, [rpc, upsert]);

  const deferDelete = useDeferredDelete();
  const remove = useCallback((item: Item) => deferDelete(item, {
    hide: () => setOverride(item.id, null),
    restore: () => clearOverride(item.id),
    deleted: () => { drop(item.id); clearOverride(item.id); },
    error: setActionError,
  }), [deferDelete, setOverride, clearOverride, drop]);

  return { view, loadError, actionError, dismissError: () => setActionError(null), reload: load, move, setPosted, add, remove, upsert };
}

/**
 * Delete with a five-second Undo: the item hides at once, and the delete is
 * sent only when the Undo window ends (or when the view closes first).
 */
export function useDeferredDelete() {
  const rpc = useCalendarRpc();
  const toasts = useToasts();
  const pending = useRef(new Map<string, { timer: ReturnType<typeof setTimeout>; commit: () => void }>());
  useEffect(() => () => {
    for (const entry of pending.current.values()) { clearTimeout(entry.timer); entry.commit(); }
    pending.current.clear();
  }, []);
  return useCallback((item: Item, hooks: { hide(): void; restore(): void; deleted(): void; error(message: string): void }) => {
    if (pending.current.has(item.id)) return;
    hooks.hide();
    let dismiss = () => {};
    const commit = () => {
      pending.current.delete(item.id);
      dismiss();
      rpc.call("delete", { id: item.id }).then(() => hooks.deleted(), (err: unknown) => {
        hooks.restore();
        hooks.error(`Couldn't delete “${item.title}”. ${readableError(err)}`);
      });
    };
    const timer = setTimeout(commit, 5000);
    pending.current.set(item.id, { timer, commit });
    dismiss = toasts.show({
      message: `Deleted “${item.title}”`,
      duration: 5000,
      action: { label: "Undo", run: () => { clearTimeout(timer); pending.current.delete(item.id); hooks.restore(); } },
    });
  }, [rpc, toasts]);
}

/** Remembers the last format used in quick add. */
const FORMAT_KEY = "content-calendar:last-format";
export function lastFormat(): string {
  try { return localStorage.getItem(FORMAT_KEY) ?? "tweet"; } catch { return "tweet"; }
}
export function rememberFormat(value: string) {
  try { localStorage.setItem(FORMAT_KEY, value); } catch { /* storage unavailable */ }
}
