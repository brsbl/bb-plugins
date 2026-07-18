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
  composerRef.current = composer;
  composerScopeKeyRef.current = composerScopeKey;
  const isRunning = pending?.scopeKey === composerScopeKey;

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
  }, [composer.setTextEffect, isRunning]);

  useEffect(() => {
    return () => {
      composer.setTextEffect?.(null);
    };
  }, [composer.setTextEffect, composerScopeKey]);

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
      composerRef.current.setTextEffect?.(null);
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
    [applyEnhancement, rpc, setPendingRequest],
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
      composerRef.current.setTextEffect?.(null);
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
    consumeResult,
    projectId,
    rpc,
    setPendingRequest,
    threadId,
  ]);

  const isDisabled =
    projectId === null || composer.text.trim().length === 0 || isRunning;

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
            aria-label={isRunning ? "Improving prompt" : "Improve prompt"}
            onClick={() => void enhance()}
          >
            {isRunning ? (
              <Icon
                name="Loading"
                className="animate-spin"
                aria-hidden="true"
              />
            ) : (
              <Icon name="AiScanText" aria-hidden="true" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">Improve prompt</TooltipContent>
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
