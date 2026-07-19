import { useCallback, useEffect, useRef, useState } from "react";
import {
  definePluginApp,
  useComposer,
  useRealtime,
  useRpc,
} from "@bb/plugin-sdk/app";
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
  requestId: string;
  scopeKey: string;
}

interface UndoState {
  scopeKey: string;
  enhancedPrompt: string;
  previousDraft: string;
}

const PENDING_STORAGE_PREFIX = "bb-plugin-prompt-shaper:pending:";
const THREAD_ROW_STATUS = {
  icon: "AiContentGenerator01",
  label: "Prompt Shaper improving prompt",
  effect: "shimmer",
  tone: "success",
} as const;

function pendingStorageKey(composerScopeKey: string): string {
  return `${PENDING_STORAGE_PREFIX}${composerScopeKey}`;
}

function loadPendingRequest(composerScopeKey: string): PendingRequest | null {
  try {
    const raw = window.sessionStorage.getItem(
      pendingStorageKey(composerScopeKey),
    );
    if (raw === null) return null;
    const value: unknown = JSON.parse(raw);
    if (
      typeof value === "object" &&
      value !== null &&
      "requestId" in value &&
      typeof value.requestId === "string" &&
      "scopeKey" in value &&
      value.scopeKey === composerScopeKey
    ) {
      return {
        requestId: value.requestId,
        scopeKey: value.scopeKey,
      };
    }
  } catch {
    // Session storage is a recovery aid; enhancement still works without it.
  }
  return null;
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

function PromptShaperAction({
  projectId,
  threadId,
}: {
  projectId: string | null;
  threadId: string | null;
}) {
  const composer = useComposer();
  const composerScopeKey = scopeKey(composer.scope);
  const rpc = useRpc<typeof rpcContract>();
  const [pending, setPending] = useState<PendingRequest | null>(() =>
    loadPendingRequest(composerScopeKey),
  );
  const reconcileRecoveredPendingRef = useRef(pending !== null);
  const pendingRef = useRef<PendingRequest | null>(pending);
  const composerRef = useRef(composer);
  const composerScopeKeyRef = useRef(composerScopeKey);
  const previousComposerScopeKeyRef = useRef(composerScopeKey);
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
  }, []);

  useEffect(() => {
    if (previousComposerScopeKeyRef.current === composerScopeKey) return;
    const previousComposerScopeKey = previousComposerScopeKeyRef.current;
    previousComposerScopeKeyRef.current = composerScopeKey;
    const staleRequest = pendingRef.current;
    const isThreadNavigation =
      previousComposerScopeKey.startsWith("thread:") &&
      composerScopeKey.startsWith("thread:");

    if (staleRequest !== null && !isThreadNavigation) {
      clearPendingRequest(staleRequest);
      void rpc
        .call("cancelEnhancement", { requestId: staleRequest.requestId })
        .catch(() => {
          // The old scope is already invalidated locally even if the helper
          // has exited or cancellation transport is unavailable.
        });
    }

    const recoveredRequest = loadPendingRequest(composerScopeKey);
    pendingRef.current = recoveredRequest;
    reconcileRecoveredPendingRef.current = recoveredRequest !== null;
    setPending(recoveredRequest);
  }, [composerScopeKey, rpc]);

  useEffect(() => {
    composer.setTextEffect?.(isRunning ? "shimmer" : null);
    composer.setThreadRowStatus?.(isRunning ? THREAD_ROW_STATUS : null);
  }, [composer.setTextEffect, composer.setThreadRowStatus, isRunning]);

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
      composer.setTextEffect?.(null);
      composer.setThreadRowStatus?.(null);
    };
  }, [composer.setTextEffect, composer.setThreadRowStatus, composerScopeKey]);

  useEffect(() => {
    const recoveredRequest = loadPendingRequest(
      composerScopeKeyRef.current,
    );
    if (pendingRef.current === null && recoveredRequest !== null) {
      pendingRef.current = recoveredRequest;
      setPending(recoveredRequest);
    }
    return () => {
      // Detach this component instance from any in-flight async work without
      // cancelling the durable request. Navigating away and ordinary host
      // remounts both unmount composer accessories; the next instance for the
      // same scope recovers the request from session storage and reconciles it.
      pendingRef.current = null;
    };
  }, []);

  const clearLoadingEffects = useCallback(() => {
    composerRef.current.setTextEffect?.(null);
    composerRef.current.setThreadRowStatus?.(null);
  }, []);

  const applyEnhancement = useCallback((enhancedPrompt: string) => {
    const activeComposer = composerRef.current;
    let previousDraft = activeComposer.text;
    activeComposer.updateText((current) => {
      previousDraft = current;
      return enhancedPrompt;
    });
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
    async (requestId: string) => {
      const active = pendingRef.current;
      if (active === null || active.requestId !== requestId) return;

      const record = await rpc.call("getEnhancement", { requestId });
      if (pendingRef.current !== active) return;
      if (record === null || record.status === "running") return;

      // A composer change is visible during render before the passive scope
      // reconciliation effect moves pendingRef to the destination scope. Do
      // not delete the source scope's durable request in that window. Thread
      // navigation can recover and consume the terminal result on return;
      // non-thread scope changes are still cleared/cancelled by reconciliation.
      if (active.scopeKey !== composerScopeKeyRef.current) {
        clearLoadingEffects();
        return;
      }

      clearLoadingEffects();
      setPendingRequest(null);

      if (record.status === "failed") {
        toast.error(record.error);
        return;
      }
      applyEnhancement(record.enhancedPrompt);
    },
    [applyEnhancement, clearLoadingEffects, rpc, setPendingRequest],
  );

  useRealtime("enhancement-changed", (payload) => {
    const requestId = signalRequestId(payload);
    if (requestId !== null) void consumeResult(requestId);
  });

  useEffect(() => {
    if (!isRunning || pending === null) return;
    if (reconcileRecoveredPendingRef.current) {
      reconcileRecoveredPendingRef.current = false;
      void consumeResult(pending.requestId);
    }
    const timer = window.setInterval(() => {
      void consumeResult(pending.requestId);
    }, 2_000);
    return () => window.clearInterval(timer);
  }, [consumeResult, isRunning, pending]);

  const enhance = useCallback(async () => {
    const draft = composer.text;
    if (projectId === null || draft.trim().length === 0 || pendingRef.current) {
      return;
    }

    const request: PendingRequest = {
      requestId: crypto.randomUUID(),
      scopeKey: composerScopeKey,
    };
    setUndoState(null);
    composer.setTextEffect?.("shimmer");
    composer.setThreadRowStatus?.(THREAD_ROW_STATUS);
    setPendingRequest(request);

    try {
      await rpc.call("startEnhancement", {
        requestId: request.requestId,
        draft,
        projectId,
        sourceThreadId: threadId,
      });
    } catch (error) {
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
    } catch (error) {
      if (pendingRef.current !== request) return;
      clearLoadingEffects();
      setPendingRequest(null);
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not enhance the prompt.",
      );
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

    clearLoadingEffects();
    setPendingRequest(null);
    try {
      await rpc.call("cancelEnhancement", {
        requestId: active.requestId,
      });
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not cancel prompt improvement.",
      );
    }
  }, [clearLoadingEffects, rpc, setPendingRequest]);

  const isDisabled =
    !isRunning && (projectId === null || composer.text.trim().length === 0);
  const actionLabel = isRunning
    ? "Cancel prompt improvement"
    : "Improve prompt";
  const controlLabel = canUndo ? "Undo prompt" : actionLabel;
  const iconName =
    isRunning
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
                void (isRunning ? cancel() : enhance());
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
  app.slots.composerAccessory({
    id: "enhance-prompt",
    component: PromptShaperAction,
  });
});
