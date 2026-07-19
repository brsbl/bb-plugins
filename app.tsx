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

const PENDING_STORAGE_PREFIX = "bb-plugin-prompt-shaper:pending:";
const THREAD_ROW_STATUS = {
  icon: "AiScanText",
  label: "Prompt Shaper improving prompt",
  effect: "shimmer",
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
  const pendingRef = useRef<PendingRequest | null>(pending);
  const composerRef = useRef(composer);
  const composerScopeKeyRef = useRef(composerScopeKey);
  const [isHovered, setIsHovered] = useState(false);
  const [isKeyboardFocused, setIsKeyboardFocused] = useState(false);
  composerRef.current = composer;
  composerScopeKeyRef.current = composerScopeKey;
  const isRunning = pending?.scopeKey === composerScopeKey;
  const showCancelIcon = isRunning && (isHovered || isKeyboardFocused);

  const setPendingRequest = useCallback((next: PendingRequest | null) => {
    const previous = pendingRef.current;
    if (previous !== null) clearPendingRequest(previous);
    if (next !== null) savePendingRequest(next);
    pendingRef.current = next;
    setPending(next);
  }, []);

  useEffect(() => {
    if (pendingRef.current?.scopeKey === composerScopeKey) return;
    const recovered = loadPendingRequest(composerScopeKey);
    pendingRef.current = recovered;
    setPending(recovered);
  }, [composerScopeKey]);

  useEffect(() => {
    composer.setTextEffect?.(isRunning ? "shimmer" : null);
    composer.setThreadRowStatus?.(isRunning ? THREAD_ROW_STATUS : null);
  }, [composer.setTextEffect, composer.setThreadRowStatus, isRunning]);

  useEffect(() => {
    return () => {
      composer.setTextEffect?.(null);
      composer.setThreadRowStatus?.(null);
    };
  }, [composer.setTextEffect, composer.setThreadRowStatus, composerScopeKey]);

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
    activeComposer.focus();
    toast.success("Prompt enhanced", {
      action: {
        label: "Undo",
        onClick: () => {
          const currentComposer = composerRef.current;
          let restored = false;
          currentComposer.updateText((current) => {
            if (current !== enhancedPrompt) return current;
            restored = true;
            return previousDraft;
          });
          if (restored) {
            currentComposer.focus();
          } else {
            toast.info("Draft changed, so undo was not applied.");
          }
        },
      },
    });
  }, []);

  const consumeResult = useCallback(
    async (requestId: string) => {
      const active = pendingRef.current;
      if (active === null || active.requestId !== requestId) return;

      const record = await rpc.call("getEnhancement", { requestId });
      if (pendingRef.current !== active) return;
      if (record === null || record.status === "running") return;
      clearLoadingEffects();
      setPendingRequest(null);

      if (record.status === "failed") {
        toast.error(record.error);
        return;
      }

      if (active.scopeKey !== composerScopeKeyRef.current) {
        toast.info(
          "Enhancement finished after you changed composers. Nothing was replaced.",
        );
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

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7 text-muted-foreground"
            disabled={isDisabled}
            aria-busy={isRunning}
            aria-label={
              isRunning ? "Cancel prompt improvement" : "Improve prompt"
            }
            onBlur={() => setIsKeyboardFocused(false)}
            onFocus={(event) =>
              setIsKeyboardFocused(
                event.currentTarget.matches(":focus-visible"),
              )
            }
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => void (isRunning ? cancel() : enhance())}
          >
            <span
              className={
                isRunning && !showCancelIcon
                  ? "inline-flex size-4 items-center justify-center motion-safe:animate-pulse"
                  : "inline-flex size-4 items-center justify-center"
              }
            >
              <Icon
                name={showCancelIcon ? "X" : "AiScanText"}
                className={
                  isRunning && !showCancelIcon
                    ? "animate-shine-icon motion-safe:[animation-duration:1.5s]"
                    : undefined
                }
                aria-hidden="true"
              />
            </span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          {isRunning ? "Cancel" : "Improve prompt"}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default definePluginApp((app) => {
  app.slots.composerAccessory({
    id: "enhance-prompt",
    component: PromptShaperAction,
  });
});
