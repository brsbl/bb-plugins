import { useCallback, useEffect, useRef, useState } from "react";
import {
  definePluginApp,
  useBbContext,
  useComposer,
  useComposerView,
  useRealtime,
  useRpc,
} from "@bb/plugin-sdk/app";
import "./app.css";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { rpcContract } from "./server";
import { scopeKey } from "./core.js";

interface PendingRequest {
  createdAt: number;
  requestId: string;
  scopeKey: string;
  startup: "acknowledged" | "starting";
}

interface UndoState {
  scopeKey: string;
  enhancedPrompt: string;
  previousDraft: string;
}

type ReconcileOutcome = "absent" | "ignored" | "running" | "terminal";

interface ConsumeResultOptions {
  allowDuringCancellation?: boolean;
  clearIfAbsent?: boolean;
}

const PENDING_STORAGE_PREFIX = "bb-plugin-prompt-shaper:pending:";
const STARTUP_GRACE_MS = 30_000;
const locallyStartingRequestIds = new Set<string>();
const PROMPT_SHIMMER_EFFECT = {
  className: "bb-improve-prompt-shimmer",
} as const;
const THREAD_ROW_STATUS = {
  icon: "AiContentGenerator01",
  label: "Improve Prompt is improving the draft",
  tone: "success",
} as const;

export function resetLocallyStartingRequestsForTest(): void {
  locallyStartingRequestIds.clear();
}

function pendingStorageKey(composerScopeKey: string): string {
  return `${PENDING_STORAGE_PREFIX}${composerScopeKey}`;
}

interface PendingStorageState {
  available: boolean;
  request: PendingRequest | null;
}

function readPendingStorage(composerScopeKey: string): PendingStorageState {
  try {
    const raw = window.sessionStorage.getItem(
      pendingStorageKey(composerScopeKey),
    );
    if (raw === null) return { available: true, request: null };
    const value: unknown = JSON.parse(raw);
    if (
      typeof value === "object" &&
      value !== null &&
      "requestId" in value &&
      typeof value.requestId === "string" &&
      "scopeKey" in value &&
      value.scopeKey === composerScopeKey
    ) {
      const createdAt =
        "createdAt" in value &&
        typeof value.createdAt === "number" &&
        Number.isFinite(value.createdAt) &&
        value.createdAt >= 0
          ? value.createdAt
          : 0;
      const startup =
        "startup" in value && value.startup === "starting"
          ? "starting"
          : "acknowledged";
      return {
        available: true,
        request: {
          createdAt,
          requestId: value.requestId,
          scopeKey: value.scopeKey,
          startup,
        },
      };
    }
  } catch {
    // Session storage is a recovery aid; enhancement still works without it.
    return { available: false, request: null };
  }
  return { available: true, request: null };
}

function loadPendingRequest(composerScopeKey: string): PendingRequest | null {
  return readPendingStorage(composerScopeKey).request;
}

function savePendingRequest(request: PendingRequest): void {
  try {
    window.sessionStorage.setItem(
      pendingStorageKey(request.scopeKey),
      JSON.stringify(request),
    );
  } catch {
    // Session storage is a recovery aid; enhancement still works without it.
  }
}

function clearPendingRequest(request: PendingRequest): void {
  try {
    const stored = loadPendingRequest(request.scopeKey);
    if (stored?.requestId !== request.requestId) return;
    window.sessionStorage.removeItem(pendingStorageKey(request.scopeKey));
  } catch {
    // Session storage is a recovery aid; enhancement still works without it.
  }
}

function signalRequestId(payload: unknown): string | null {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "requestId" in payload &&
    typeof payload.requestId === "string"
  ) {
    return payload.requestId;
  }
  return null;
}

function PromptShaperAction() {
  const composer = useComposer();
  const view = useComposerView();
  const context = useBbContext();
  const composerScopeKey = scopeKey(view.scope);
  const projectId =
    view.scope.kind === "side-chat" || view.scope.kind === "new-thread"
      ? view.scope.projectId
      : context.projectId;
  const threadId =
    view.scope.kind === "thread" || view.scope.kind === "queued-message"
      ? view.scope.threadId
      : view.scope.kind === "side-chat"
        ? view.scope.parentThreadId
        : null;
  const rpc = useRpc<typeof rpcContract>();
  const [pending, setPending] = useState<PendingRequest | null>(() =>
    loadPendingRequest(composerScopeKey),
  );
  const [busy, setBusy] = useState<AbortController | null>(() =>
    pending === null ? null : new AbortController(),
  );
  const reconcileRecoveredPendingRef = useRef(pending !== null);
  const pendingRef = useRef<PendingRequest | null>(pending);
  const cancellingRequestIdRef = useRef<string | null>(null);
  const composerRef = useRef(composer);
  const composerScopeKeyRef = useRef(composerScopeKey);
  const mountedComposerScopeKindRef = useRef(view.scope.kind);
  const rpcRef = useRef(rpc);
  const [isHovered, setIsHovered] = useState(false);
  const [isKeyboardFocused, setIsKeyboardFocused] = useState(false);
  const [undoState, setUndoState] = useState<UndoState | null>(null);
  composerRef.current = composer;
  composerScopeKeyRef.current = composerScopeKey;
  const isRunning = pending?.scopeKey === composerScopeKey;
  const canUndo =
    !isRunning &&
    undoState?.scopeKey === composerScopeKey &&
    composer.text === undoState.enhancedPrompt;
  const showCancelIcon = isRunning && (isHovered || isKeyboardFocused);

  const setPendingRequest = useCallback((next: PendingRequest | null) => {
    const previous = pendingRef.current;
    if (previous !== null) clearPendingRequest(previous);
    if (next !== null) savePendingRequest(next);
    pendingRef.current = next;
    setPending(next);
    setBusy(next === null ? null : new AbortController());
  }, []);

  useEffect(() => {
    composer.setTextEffect(isRunning ? PROMPT_SHIMMER_EFFECT : null);
    composer.setInputLock(isRunning);
    composer.setThreadRowStatus(isRunning ? THREAD_ROW_STATUS : null);
  }, [
    composer.setInputLock,
    composer.setTextEffect,
    composer.setThreadRowStatus,
    isRunning,
  ]);

  useEffect(() => {
    if (
      undoState !== null &&
      (undoState.scopeKey !== composerScopeKey ||
        composer.text !== undoState.enhancedPrompt)
    ) {
      setUndoState(null);
    }
  }, [composer.text, composerScopeKey, undoState]);

  useEffect(() => {
    return () => {
      composer.setInputLock(false);
      composer.setTextEffect(null);
      composer.setThreadRowStatus(null);
    };
  }, [
    composer.setInputLock,
    composer.setTextEffect,
    composer.setThreadRowStatus,
    composerScopeKey,
  ]);

  useEffect(() => {
    const recoveredRequest = loadPendingRequest(composerScopeKeyRef.current);
    if (pendingRef.current === null && recoveredRequest !== null) {
      pendingRef.current = recoveredRequest;
      setPending(recoveredRequest);
      setBusy(new AbortController());
    }
    return () => {
      const detachedRequest = pendingRef.current;
      pendingRef.current = null;

      // Thread requests intentionally survive keyed navigation so returning
      // to the thread can recover and reconcile them. Every other composer
      // scope is ephemeral: the host's full-scope key unmounts this action
      // when its owner changes, so invalidate and cancel from this cleanup.
      if (
        detachedRequest === null ||
        mountedComposerScopeKindRef.current === "thread"
      ) {
        return;
      }
      clearPendingRequest(detachedRequest);
      if (cancellingRequestIdRef.current === detachedRequest.requestId) return;
      void rpcRef.current
        .call("cancelEnhancement", { requestId: detachedRequest.requestId })
        .catch(() => {
          // The old scope is already invalidated locally even if the helper
          // has exited or cancellation transport is unavailable.
        });
    };
  }, []);

  const clearLoadingEffects = useCallback(() => {
    composerRef.current.setInputLock(false);
    composerRef.current.setTextEffect(null);
    composerRef.current.setThreadRowStatus(null);
  }, []);

  const applyEnhancement = useCallback((enhancedPrompt: string) => {
    const activeComposer = composerRef.current;
    const previousDraft = activeComposer.text;
    activeComposer.setText(enhancedPrompt);
    setUndoState({
      scopeKey: composerScopeKeyRef.current,
      enhancedPrompt,
      previousDraft,
    });
    activeComposer.focus();
  }, []);

  const undo = useCallback(() => {
    if (undoState === null) return;

    const currentComposer = composerRef.current;
    let restored = false;
    currentComposer.updateText((current) => {
      if (
        undoState.scopeKey !== composerScopeKeyRef.current ||
        current !== undoState.enhancedPrompt
      ) {
        return current;
      }
      restored = true;
      return undoState.previousDraft;
    });
    setUndoState(null);
    if (restored) currentComposer.focus();
  }, [undoState]);

  const consumeResult = useCallback(
    async (
      requestId: string,
      options: ConsumeResultOptions = {},
    ): Promise<ReconcileOutcome> => {
      const active = pendingRef.current;
      if (active === null || active.requestId !== requestId) return "ignored";
      if (
        cancellingRequestIdRef.current === requestId &&
        !options.allowDuringCancellation
      ) {
        return "ignored";
      }

      const record = await rpc.call("getEnhancement", { requestId });
      if (pendingRef.current !== active) return "ignored";
      if (
        cancellingRequestIdRef.current === requestId &&
        !options.allowDuringCancellation
      ) {
        return "ignored";
      }
      if (record === null) {
        const stored = readPendingStorage(active.scopeKey);
        const durable =
          stored.request?.requestId === active.requestId
            ? stored.request
            : null;
        const markerWasRemoved = stored.available && durable === null;
        const startupWasAcknowledged =
          (durable ?? active).startup === "acknowledged";
        const startupGraceExpired =
          Date.now() - (durable ?? active).createdAt >= STARTUP_GRACE_MS;
        const startupIsLocallyInFlight = locallyStartingRequestIds.has(
          active.requestId,
        );
        if (
          options.clearIfAbsent ||
          markerWasRemoved ||
          startupWasAcknowledged ||
          (startupGraceExpired && !startupIsLocallyInFlight)
        ) {
          if (active.scopeKey === composerScopeKeyRef.current) {
            clearLoadingEffects();
            setPendingRequest(null);
          } else {
            clearPendingRequest(active);
          }
        }
        return "absent";
      }
      if (record.status === "running") return "running";

      // The keyed host lifecycle normally detaches pendingRef before a new
      // scope mounts. Keep this guard for test harnesses or alternate hosts
      // that can expose a new composer before unmount cleanup runs.
      if (active.scopeKey !== composerScopeKeyRef.current) {
        clearLoadingEffects();
        return "ignored";
      }

      clearLoadingEffects();
      setPendingRequest(null);

      if (record.status === "failed") {
        toast.error(record.error);
        return "terminal";
      }
      applyEnhancement(record.enhancedPrompt);
      return "terminal";
    },
    [applyEnhancement, clearLoadingEffects, rpc, setPendingRequest],
  );

  const reconcileResult = useCallback(
    (requestId: string) => {
      void consumeResult(requestId).catch(() => {
        // Realtime and polling are reconciliation hints. Preserve the durable
        // pending request so the next signal or poll can retry safely.
      });
    },
    [consumeResult],
  );

  useRealtime("enhancement-changed", (payload) => {
    const requestId = signalRequestId(payload);
    if (requestId !== null) reconcileResult(requestId);
  });

  useEffect(() => {
    if (!isRunning || pending === null) return;
    if (reconcileRecoveredPendingRef.current) {
      reconcileRecoveredPendingRef.current = false;
      reconcileResult(pending.requestId);
    }
    const timer = window.setInterval(() => {
      reconcileResult(pending.requestId);
    }, 2_000);
    return () => window.clearInterval(timer);
  }, [isRunning, pending, reconcileResult]);

  const enhance = useCallback(async () => {
    const draft = composer.text;
    if (projectId === null || draft.trim().length === 0 || pendingRef.current) {
      return;
    }

    const request: PendingRequest = {
      createdAt: Date.now(),
      requestId: crypto.randomUUID(),
      scopeKey: composerScopeKey,
      startup: "starting",
    };
    setUndoState(null);
    composer.setTextEffect(PROMPT_SHIMMER_EFFECT);
    composer.setInputLock(true);
    composer.setThreadRowStatus(THREAD_ROW_STATUS);
    setPendingRequest(request);
    locallyStartingRequestIds.add(request.requestId);

    try {
      await rpc.call("startEnhancement", {
        requestId: request.requestId,
        draft,
        projectId,
        sourceThreadId: threadId,
      });
      locallyStartingRequestIds.delete(request.requestId);

      const acknowledgedRequest: PendingRequest = {
        ...request,
        startup: "acknowledged",
      };
      const stored = loadPendingRequest(request.scopeKey);
      if (stored?.requestId === request.requestId) {
        savePendingRequest(acknowledgedRequest);
      }
      if (pendingRef.current === request) {
        pendingRef.current = acknowledgedRequest;
        setPending(acknowledgedRequest);
      }
    } catch (error) {
      locallyStartingRequestIds.delete(request.requestId);
      // Startup can fail after navigation has detached this component. Clear
      // the exact durable marker even when this instance no longer owns the
      // active composer, or returning would recover a request the server never
      // created and leave the action running indefinitely.
      clearPendingRequest(request);
      if (pendingRef.current !== request) return;
      clearLoadingEffects();
      setPendingRequest(null);
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not enhance the prompt.",
      );
      return;
    }

    try {
      await consumeResult(request.requestId);
    } catch {
      // Starting succeeded, so the request is durable even when this first
      // read fails. Keep the marker and loading state; polling or realtime
      // reconciliation will retry without spawning a second helper.
    }
  }, [
    composer,
    composerScopeKey,
    clearLoadingEffects,
    consumeResult,
    projectId,
    rpc,
    setPendingRequest,
    threadId,
  ]);

  const cancel = useCallback(async () => {
    const active = pendingRef.current;
    if (active === null || active.scopeKey !== composerScopeKeyRef.current) {
      return;
    }
    if (cancellingRequestIdRef.current === active.requestId) return;

    cancellingRequestIdRef.current = active.requestId;
    try {
      await rpc.call("cancelEnhancement", {
        requestId: active.requestId,
      });
      if (pendingRef.current === active) {
        clearLoadingEffects();
        setPendingRequest(null);
      } else {
        clearPendingRequest(active);
      }
    } catch (error) {
      if (pendingRef.current !== active) return;

      let outcome: ReconcileOutcome = "ignored";
      try {
        const startupIsLocallyInFlight = locallyStartingRequestIds.has(
          active.requestId,
        );
        outcome = await consumeResult(active.requestId, {
          allowDuringCancellation: true,
          clearIfAbsent: !startupIsLocallyInFlight,
        });
      } catch {
        // The request is still durable. Leave it visible so polling or a
        // realtime signal can reconcile it when transport recovers.
      }

      if (
        pendingRef.current === active &&
        (outcome === "absent" || outcome === "ignored" || outcome === "running")
      ) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Could not cancel prompt improvement.",
        );
      }
    } finally {
      if (cancellingRequestIdRef.current === active.requestId) {
        cancellingRequestIdRef.current = null;
      }
    }
  }, [clearLoadingEffects, consumeResult, rpc, setPendingRequest]);

  useEffect(() => {
    if (busy === null) return;
    const abort = () => void cancel();
    busy.signal.addEventListener("abort", abort);
    return () => busy.signal.removeEventListener("abort", abort);
  }, [busy, cancel]);

  const isDisabled =
    !isRunning && (projectId === null || view.draft.text.trim().length === 0);
  const actionLabel = isRunning
    ? "Cancel prompt improvement"
    : "Improve prompt";
  const controlLabel = canUndo ? "Undo prompt" : actionLabel;
  const iconName = isRunning
    ? showCancelIcon
      ? "X"
      : "AiContentGenerator01"
    : "AiContentGenerator01";

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex items-center" data-prompt-shaper-actions>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={
                canUndo
                  ? "h-7 w-auto gap-1 px-1.5 text-muted-foreground"
                  : isRunning && !showCancelIcon
                    ? "size-7 text-success"
                    : "size-7 text-muted-foreground"
              }
              disabled={isDisabled}
              aria-busy={isRunning}
              aria-label={controlLabel}
              onMouseDown={(event) => {
                // Keep narrow/inline composers expanded until the click is
                // delivered. Their action row collapses when the editor blurs.
                event.preventDefault();
              }}
              onBlur={() => setIsKeyboardFocused(false)}
              onFocus={(event) =>
                setIsKeyboardFocused(
                  event.currentTarget.matches(":focus-visible"),
                )
              }
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              onClick={() => {
                if (canUndo) {
                  undo();
                  return;
                }
                if (isRunning) {
                  busy?.abort();
                  return;
                }
                void enhance();
              }}
            >
              {canUndo ? (
                <>
                  <Icon name="AiContentGenerator01" aria-hidden="true" />
                  <Icon name="ArrowTurnBackward" aria-hidden="true" />
                </>
              ) : (
                <span
                  className={
                    isRunning && !showCancelIcon
                      ? "inline-flex size-4 items-center justify-center motion-safe:animate-pulse"
                      : "inline-flex size-4 items-center justify-center"
                  }
                >
                  <Icon
                    name={iconName}
                    className={
                      isRunning && !showCancelIcon
                        ? "animate-shine-icon motion-safe:[animation-duration:1.5s]"
                        : undefined
                    }
                    aria-hidden="true"
                  />
                </span>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            {canUndo ? "Undo prompt" : isRunning ? "Cancel" : "Improve prompt"}
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}

export default definePluginApp((app) => {
  app.composer.customize({
    id: "improve-prompt",
    actions: [{ id: "improve", component: PromptShaperAction }],
  });
});
