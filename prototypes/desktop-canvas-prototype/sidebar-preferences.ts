import { useCallback, useEffect, useRef, useState } from "react";
import { useSdk } from "@get-bb/plugin-sdk/app";
import { z } from "zod";

// The Thread List plugin owns these values. This is a read/write client of its
// public RPC; the canvas never maintains a second preferences store.
export const sidebarPreferencesSchema = z.object({
  organizationMode: z.enum(["project", "chronological", "machine"]),
  chronologicalSort: z.enum(["updated", "created", "alpha", "none"]),
  sortDirection: z.enum(["default", "ascending", "descending"]),
  environmentGrouping: z.union([z.literal("auto"), z.boolean()]),
  showProviderIcons: z.boolean(),
  threadLifecycles: z.array(z.enum(["active", "archived"])).min(1),
  sectionOrder: z.array(z.string()),
  manualSectionOrder: z.array(z.string()),
  machineSectionOrder: z.array(z.string()),
  hiddenGroups: z.array(z.string()),
});
export type SidebarPreferences = z.infer<typeof sidebarPreferencesSchema>;
export type PreferencePatch = Partial<SidebarPreferences>;
const responseSchema = z.object({ preferences: sidebarPreferencesSchema });
const mutationSchema = z.object({ key: z.string(), value: z.unknown() });

export function useSidebarPreferences() {
  const sdk = useSdk();
  const [preferences, setPreferences] = useState<SidebarPreferences | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const busy = useRef(false);
  const generation = useRef(0);
  const mounted = useRef(true);
  const refresh = useCallback(async (signal?: AbortSignal) => {
    if (busy.current) return;
    const current = ++generation.current;
    try {
      const result = await sdk.plugins.callRpc({ pluginId: "thread-list", method: "listPreferences", input: null, outputSchema: responseSchema, signal });
      if (!mounted.current || current !== generation.current) return;
      setPreferences(previous => JSON.stringify(previous) === JSON.stringify(result.preferences) ? previous : result.preferences);
      setError(current => current?.startsWith("Sidebar settings could not be saved") ? current : null);
    } catch {
      if (mounted.current && !signal?.aborted && current === generation.current) setError("Sidebar settings could not load.");
    }
  }, [sdk]);
  useEffect(() => {
    mounted.current = true;
    const controller = new AbortController();
    let timer: number;
    let stopped = false;
    // Cross-plugin realtime signals are not exposed by this SDK. Reconcile
    // through the owning RPC while visible, and immediately on window focus.
    const poll = async () => {
      if (!document.hidden) await refresh(controller.signal);
      if (!stopped) timer = window.setTimeout(poll, 1500);
    };
    const focus = () => { void refresh(controller.signal); };
    void poll();
    window.addEventListener("focus", focus);
    document.addEventListener("visibilitychange", focus);
    return () => {
      stopped = true; mounted.current = false; controller.abort();
      window.clearTimeout(timer);
      window.removeEventListener("focus", focus);
      document.removeEventListener("visibilitychange", focus);
    };
  }, [refresh]);
  const update = useCallback(async (patch: PreferencePatch) => {
    if (busy.current) return;
    busy.current = true; ++generation.current; setSaving(true);
    let failed = false;
    try {
      for (const [key, value] of Object.entries(patch)) {
        await sdk.plugins.callRpc({ pluginId: "thread-list", method: "setPreference", input: { key, value }, outputSchema: mutationSchema });
      }
      if (mounted.current) setError(null);
    } catch {
      failed = true;
    } finally {
      busy.current = false;
      if (mounted.current) { setSaving(false); await refresh(); if (failed && mounted.current) setError("Sidebar settings could not be saved. Try again."); }
    }
  }, [sdk, refresh]);
  return { preferences, error, saving, update, refresh };
}
