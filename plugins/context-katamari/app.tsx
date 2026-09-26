import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import {
  definePluginApp,
  experimental_useSidebarThreads,
  useBbContext,
  useRpc,
} from "@get-bb/plugin-sdk/app";

import type { contextKatamariRpcContract, ThreadContext, TurnCost } from "./contract";
import { contextFill } from "./katamari-math";
import { KatamariWindow, type KatamariStage } from "./katamari-window";
import {
  createReadOrder,
  EMPTY_STAGE,
  isThreadWorking,
  resolveStage,
  type StageState,
} from "./stage";
import "./app.css";

const OPEN_KEY = "context-katamari:open";
const MUTED_KEY = "context-katamari:muted";
const WORKING_POLL_MS = 4_000;
const IDLE_POLL_MS = 30_000;
const NO_TURNS: readonly TurnCost[] = [];

/** A tiny persisted flag store, shared by the footer button and the overlay. */
function persistedFlag(key: string, fallback: boolean) {
  const listeners = new Set<() => void>();
  let value = fallback;
  try {
    const stored = window.localStorage.getItem(key);
    if (stored !== null) value = stored === "true";
  } catch {
    // Storage can be unavailable; the flag just will not persist.
  }
  return {
    get: () => value,
    set(next: boolean) {
      value = next;
      try {
        window.localStorage.setItem(key, String(next));
      } catch {
        // Ignore: the in-memory value still drives this session.
      }
      for (const listener of listeners) listener();
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

const openFlag = persistedFlag(OPEN_KEY, false);
const mutedFlag = persistedFlag(MUTED_KEY, false);

function useFlag(flag: ReturnType<typeof persistedFlag>): boolean {
  return useSyncExternalStore(flag.subscribe, flag.get, flag.get);
}

/** Poll a thread's context usage quickly while it works and lazily while it rests. */
function useThreadContext(
  threadId: string | null,
  working: boolean,
  updatedAt: number | null,
): ThreadContext | null {
  const rpc = useRpc<typeof contextKatamariRpcContract>();
  const [contexts, setContexts] = useState<ReadonlyMap<string, ThreadContext | null>>(new Map());
  const readOrders = useRef(new Map<string, ReturnType<typeof createReadOrder>>());

  const refresh = useCallback(
    (id: string) => {
      const order = readOrders.current.get(id) ?? createReadOrder();
      readOrders.current.set(id, order);
      const request = order.begin();
      void rpc
        .call("readThreadContext", { threadId: id })
        .then((read) => {
          // A slower, older read must not replace a newer one: its lower
          // compaction count would come back as a phantom compaction.
          if (!order.accept(request)) return;
          setContexts((current) => {
            const previous = current.get(id);
            // Keep the last known count when this read could not get one.
            const context =
              read.compactions === null
                ? { ...read, compactions: previous?.compactions ?? null }
                : read;
            if (
              previous !== undefined &&
              previous?.usage?.usedTokens === context.usage?.usedTokens &&
              previous?.usage?.capacityTokens === context.usage?.capacityTokens &&
              previous?.compactions === context.compactions &&
              JSON.stringify(previous?.turns ?? []) === JSON.stringify(context.turns ?? [])
            ) {
              return current;
            }
            const next = new Map(current);
            next.set(id, context);
            return next;
          });
        })
        .catch((error: unknown) => {
          console.warn("Context Katamari could not read thread context", error);
        });
    },
    [rpc],
  );

  useEffect(() => {
    if (threadId === null) return;
    refresh(threadId);
    const timer = window.setInterval(
      () => refresh(threadId),
      working ? WORKING_POLL_MS : IDLE_POLL_MS,
    );
    return () => window.clearInterval(timer);
  }, [refresh, threadId, working, updatedAt]);

  return threadId === null ? null : (contexts.get(threadId) ?? null);
}

function KatamariOverlay() {
  const open = useFlag(openFlag);
  const muted = useFlag(mutedFlag);
  if (!open) return null;
  return (
    <KatamariController
      muted={muted}
      onMutedChange={mutedFlag.set}
      onClose={() => openFlag.set(false)}
    />
  );
}

function KatamariController({
  muted,
  onMutedChange,
  onClose,
}: {
  muted: boolean;
  onMutedChange(muted: boolean): void;
  onClose(): void;
}) {
  const { threadId: routeThreadId } = useBbContext();
  const sidebar = experimental_useSidebarThreads();
  const routeThread = useMemo(
    () =>
      routeThreadId === null
        ? null
        : (sidebar.threads.find((thread) => thread.id === routeThreadId) ?? null),
    [routeThreadId, sidebar.threads],
  );
  const working = routeThread ? isThreadWorking(routeThread) : false;

  // Off a thread page, the last thread's cousin stays on stage and waits.
  const stageRef = useRef<StageState>(EMPTY_STAGE);
  const stage = useMemo(() => {
    const next = resolveStage(stageRef.current, { threadId: routeThreadId, working });
    stageRef.current = next.state;
    return next.state;
  }, [routeThreadId, working]);

  const stageThread =
    stage.threadId === null
      ? null
      : (sidebar.threads.find((thread) => thread.id === stage.threadId) ?? null);
  const context = useThreadContext(
    stage.threadId,
    stage.mode === "rolling",
    stageThread?.updatedAt ?? null,
  );

  const usage = context?.usage ?? null;
  const windowStage: KatamariStage = {
    threadId: stage.threadId,
    mode: stage.mode,
    fill: usage ? contextFill(usage.usedTokens, usage.capacityTokens) : 0,
    compactions: context?.compactions ?? null,
    ready: context !== null,
    title: stageThread
      ? stageThread.title?.trim() || stageThread.titleFallback?.trim() || "Untitled thread"
      : stage.threadId === null
        ? null
        : "Thread",
    usedTokens: usage?.usedTokens ?? null,
    capacityTokens: usage?.capacityTokens ?? null,
    turns: context?.turns ?? NO_TURNS,
  };

  return (
    <KatamariWindow
      stage={windowStage}
      muted={muted}
      onMutedChange={onMutedChange}
      onClose={onClose}
    />
  );
}

export default definePluginApp((app) => {
  app.slots.sidebarFooterAction({
    id: "toggle",
    title: "Context Katamari",
    icon: "Circle",
    run: () => openFlag.set(!openFlag.get()),
  });
  app.slots.experimental_appOverlay({
    id: "window",
    component: KatamariOverlay,
  });
});
