import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { useRealtime, useRpc } from "@get-bb/plugin-sdk/app";

import { valuesOf, type Controls } from "./contract.js";
import { clearQuarantine } from "./quarantine.js";
import type { AmbientState, HistoryEntry, ambientRpcContract } from "./rpc.js";
import { ambientStore } from "./store.js";

const HISTORY_LIMIT = 50;
/** Changes to one control closer together than this are one undo step. */
const MERGE_MS = 800;

export interface LibraryItem {
  id: string;
  name: string;
  builtIn: boolean;
  tweaked: boolean;
}

type History = { past: HistoryEntry[]; future: HistoryEntry[]; lastKey: string | null; lastAt: number };

const receive = (next: AmbientState) => ambientStore.receive(next);

/** Debounces per first argument. Calls still pending when the panel closes are sent, not dropped. */
function useDebouncedCall<Args extends unknown[]>(
  call: (...args: Args) => void,
  delay: number,
): (...args: Args) => void {
  const pending = useRef(new Map<string, { timer: number; args: Args }>());
  const callRef = useRef(call);
  callRef.current = call;
  useEffect(() => {
    const calls = pending.current;
    return () => {
      for (const { timer, args } of calls.values()) {
        window.clearTimeout(timer);
        callRef.current(...args);
      }
      calls.clear();
    };
  }, []);
  return useCallback(
    (...args: Args) => {
      const key = String(args[0]);
      const existing = pending.current.get(key);
      if (existing) window.clearTimeout(existing.timer);
      pending.current.set(key, {
        args,
        timer: window.setTimeout(() => {
          pending.current.delete(key);
          callRef.current(...args);
        }, delay),
      });
    },
    [delay],
  );
}

/**
 * Every change the panel makes to the open scene: optimistic local edits, debounced writes, the
 * library, and undo/redo. Each change records an undo step first; undo restores one in a single
 * server write.
 */
export function useSceneEditing(state: AmbientState | null) {
  const rpc = useRpc<typeof ambientRpcContract>();
  const [library, setLibrary] = useState<LibraryItem[]>([]);

  const refreshLibrary = useCallback(async () => {
    setLibrary((await rpc.call("library")).entries);
  }, [rpc]);

  useEffect(() => {
    void refreshLibrary();
  }, [refreshLibrary]);

  useRealtime("library", () => {
    void refreshLibrary();
  });

  const sendValue = useDebouncedCall(
    useCallback(
      (id: string, value: number) => {
        void rpc.call("setValues", { values: { [id]: value } }).then(receive);
      },
      [rpc],
    ),
    120,
  );

  const sendPalette = useDebouncedCall(
    useCallback(() => {
      const current = ambientStore.getSnapshot().state;
      if (current) void rpc.call("setPalette", { palette: current.scene.palette }).then(receive);
    }, [rpc]),
    200,
  );

  const sendControl = useDebouncedCall(
    useCallback(
      <Key extends keyof Controls>(key: Key, value: Controls[Key]) => {
        void rpc.call("setControls", { [key]: value }).then(receive);
      },
      [rpc],
    ),
    120,
  );

  const ref = state?.ref ?? null;
  const activeId =
    ref && library.some((entry) => entry.id === ref.id && entry.builtIn === (ref.kind === "builtIn")) ? ref.id : null;
  const activeIdRef = useRef(activeId);
  activeIdRef.current = activeId;
  const activeEntry = library.find((entry) => entry.id === activeId);

  const history = useRef<History>({ past: [], future: [], lastKey: null, lastAt: 0 });

  const snapshot = useCallback((): HistoryEntry | null => {
    const current = ambientStore.getSnapshot().state;
    if (!current) return null;
    return {
      sceneId: activeIdRef.current,
      values: valuesOf(current.scene.params),
      palette: [...current.scene.palette],
      controls: { ...current.controls },
    };
  }, []);

  const record = useCallback(
    (key: string) => {
      const entry = history.current;
      const now = Date.now();
      if (key !== entry.lastKey || now - entry.lastAt > MERGE_MS) {
        const before = snapshot();
        if (before) entry.past = [...entry.past.slice(1 - HISTORY_LIMIT), before];
        entry.future = [];
      }
      entry.lastKey = key;
      entry.lastAt = now;
    },
    [snapshot],
  );

  const step = useCallback(
    (direction: "undo" | "redo") => {
      const entry = history.current;
      const target = (direction === "undo" ? entry.past : entry.future).at(-1);
      const current = snapshot();
      if (!target || !current) return;
      if (direction === "undo") {
        entry.past = entry.past.slice(0, -1);
        entry.future = [...entry.future, current];
      } else {
        entry.future = entry.future.slice(0, -1);
        entry.past = [...entry.past, current];
      }
      entry.lastKey = null;
      ambientStore.clearOverrides();
      void rpc.call("restore", target).then(receive);
    },
    [rpc, snapshot],
  );

  const setValue = (id: string, value: number) => {
    record(`value:${id}`);
    ambientStore.setValue(id, value);
    sendValue(id, value);
  };

  const setPaletteColor = (index: number, color: string) => {
    record(`palette:${index}`);
    ambientStore.setPaletteColor(index, color);
    sendPalette();
  };

  const setControl = <Key extends keyof Controls>(key: Key, value: Controls[Key]) => {
    record(`control:${key}`);
    ambientStore.setControl(key, value);
    sendControl(key, value);
  };

  const loadScene = (id: string) => {
    if (!id || id === activeId) return;
    record(`scene:${Date.now()}`);
    clearQuarantine();
    void rpc.call("loadScene", { id }).then(receive);
  };

  const resetScene = () => {
    if (!activeId) return;
    record(`reset:${Date.now()}`);
    ambientStore.clearOverrides();
    void rpc.call("resetScene", { id: activeId }).then(receive);
  };

  const deleteScene = async () => {
    const id = activeIdRef.current;
    if (!id) return;
    const { deleted } = await rpc.call("deleteScene", { id });
    if (!deleted) return;
    const entry = history.current;
    entry.past = entry.past.filter((snap) => snap.sceneId !== id);
    entry.future = entry.future.filter((snap) => snap.sceneId !== id);
    const fallback = library.find((item) => item.builtIn);
    if (fallback) receive(await rpc.call("loadScene", { id: fallback.id }));
  };

  return { library, activeId, activeEntry, setValue, setPaletteColor, setControl, loadScene, resetScene, deleteScene, step };
}

/** Cmd/Ctrl+Z and Shift+Cmd/Ctrl+Z, while focus is in the panel or nowhere in particular. */
export function useUndoShortcut(panel: RefObject<HTMLElement | null>, step: (direction: "undo" | "redo") => void) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== "z" || event.altKey) return;
      const focus = document.activeElement;
      const inPanel = focus instanceof Node && panel.current?.contains(focus);
      if (!inPanel && focus !== document.body) return;
      if (focus instanceof HTMLInputElement && focus.type === "text") return;
      event.preventDefault();
      step(event.shiftKey ? "redo" : "undo");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [panel, step]);
}
