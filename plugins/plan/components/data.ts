import { useCallback, useEffect, useRef, useState } from "react";
import { useRealtime, useRealtimeConnectionState, useRpc, type PluginRpcClient } from "@get-bb/plugin-sdk/app";
import { CHANGED, type Outcome, type RpcContract, type Snapshot } from "../rpc.js";
import type { OpenRecord } from "../model.js";

export type Rpc = PluginRpcClient<RpcContract>;
export const usePlanRpc = (): Rpc => useRpc<RpcContract>();
export const readableError = (error: unknown) => error instanceof Error && error.message ? error.message : "Something went wrong. Try again.";

const RELOAD_DEBOUNCE_MS = 150;

export function usePlanData() {
  const rpc = usePlanRpc();
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const version = useRef(0);
  const reload = useCallback(async () => {
    const current = ++version.current;
    try {
      const next = await rpc.call("snapshot", {});
      if (current === version.current) { setSnapshot(next); setLoadError(null); }
    } catch (error) {
      if (current === version.current) setLoadError(readableError(error));
    }
  }, [rpc]);
  useEffect(() => { void reload(); }, [reload]);

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const schedule = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => { timer.current = null; void reload(); }, RELOAD_DEBOUNCE_MS);
  }, [reload]);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  useRealtime(CHANGED, schedule);
  const state = useRealtimeConnectionState();
  const previous = useRef(state);
  useEffect(() => {
    if (state === "connected" && previous.current !== "connected") schedule();
    previous.current = state;
  }, [state, schedule]);

  return { rpc, snapshot, loadError, reload, connection: state };
}

export function useSave(reload: () => Promise<void>, notify: (message: string | null) => void) {
  return useCallback(async <T>(run: () => Promise<Outcome<T>>): Promise<T | null> => {
    try {
      const result = await run();
      notify(result.ok ? null : result.message);
      await reload();
      return result.ok ? result.value : null;
    } catch (error) {
      notify(readableError(error));
      await reload();
      return null;
    }
  }, [reload, notify]);
}

export function useOpenRecord(rpc: Rpc, threadId: string, record: OpenRecord | null, connection: string) {
  const kind = record?.kind ?? null;
  const id = record?.id ?? null;
  useEffect(() => {
    void rpc.call("openRecord", { threadId, record: kind && id ? { kind, id } : null }).catch(() => {});
  }, [rpc, threadId, kind, id, connection]);
  const latest = useRef({ rpc, threadId });
  latest.current = { rpc, threadId };
  useEffect(() => () => {
    void latest.current.rpc.call("openRecord", { threadId: latest.current.threadId, record: null }).catch(() => {});
  }, []);
}
