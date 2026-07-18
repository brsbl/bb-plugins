import { useCallback, useEffect, useRef, useState } from "react";
import {
  definePluginApp,
  useComposer,
  useRealtime,
  useRpc,
} from "@bb/plugin-sdk/app";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Icon } from "@/components/ui/icon";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { rpcContract } from "./server";
import { decideCompletedEnhancement, scopeKey } from "./core.js";

interface PendingRequest {
  requestId: string;
  originalDraft: string;
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
      "originalDraft" in value &&
      typeof value.originalDraft === "string" &&
      "scopeKey" in value &&
      value.scopeKey === composerScopeKey
    ) {
      return {
        requestId: value.requestId,
        originalDraft: value.originalDraft,
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

interface ReviewState {
  enhancedPrompt: string;
  assumptions: string | null;
  draftChanged: boolean;
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
  const [review, setReview] = useState<ReviewState | null>(null);

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
    setReview(null);
  }, [composerScopeKey]);

  const applyEnhancement = useCallback(
    (enhancedPrompt: string) => {
      const previousDraft = composer.text;
      composer.setText(enhancedPrompt);
      composer.focus();
      toast.success("Prompt enhanced", {
        action: {
          label: "Undo",
          onClick: () => {
            let restored = false;
            composer.updateText((current) => {
              if (current !== enhancedPrompt) return current;
              restored = true;
              return previousDraft;
            });
            if (restored) {
              composer.focus();
            } else {
              toast.info("Draft changed, so undo was not applied.");
            }
          },
        },
      });
    },
    [composer],
  );

  const consumeResult = useCallback(
    async (requestId: string) => {
      const active = pendingRef.current;
      if (active === null || active.requestId !== requestId) return;

      const record = await rpc.call("getEnhancement", { requestId });
      if (record === null || record.status === "running") return;
      setPendingRequest(null);

      if (record.status === "failed") {
        toast.error(record.error);
        return;
      }

      const decision = decideCompletedEnhancement({
        originalDraft: active.originalDraft,
        currentDraft: composer.text,
        assumptions: record.assumptions,
        scopeMatches: active.scopeKey === composerScopeKey,
      });

      if (decision === "discard") {
        toast.info(
          "Enhancement finished after you changed composers. Nothing was replaced.",
        );
        return;
      }
      if (decision === "review") {
        setReview({
          enhancedPrompt: record.enhancedPrompt,
          assumptions: record.assumptions,
          draftChanged: composer.text !== active.originalDraft,
        });
        return;
      }
      applyEnhancement(record.enhancedPrompt);
    },
    [applyEnhancement, composer, composerScopeKey, rpc, setPendingRequest],
  );

  useRealtime("enhancement-changed", (payload) => {
    const requestId = signalRequestId(payload);
    if (requestId !== null) void consumeResult(requestId);
  });

  useEffect(() => {
    if (pending === null) return;
    const timer = window.setInterval(() => {
      void consumeResult(pending.requestId);
    }, 2_000);
    return () => window.clearInterval(timer);
  }, [consumeResult, pending]);

  const enhance = useCallback(async () => {
    const draft = composer.text;
    if (projectId === null || draft.trim().length === 0 || pendingRef.current) {
      return;
    }

    const request: PendingRequest = {
      requestId: crypto.randomUUID(),
      originalDraft: draft,
      scopeKey: composerScopeKey,
    };
    setPendingRequest(request);
    setReview(null);

    try {
      await rpc.call("startEnhancement", {
        requestId: request.requestId,
        draft,
        projectId,
        sourceThreadId: threadId,
      });
      await consumeResult(request.requestId);
    } catch (error) {
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

  const isRunning = pending !== null;
  const isDisabled =
    projectId === null || composer.text.trim().length === 0 || isRunning;

  return (
    <>
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-muted-foreground"
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
              {isRunning ? "Improving…" : "Improve prompt"}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            Rewrite this draft with clearer context and completion criteria
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Dialog
        open={review !== null}
        onOpenChange={(open) => {
          if (!open) setReview(null);
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review enhanced prompt</DialogTitle>
            <DialogDescription>
              {review?.draftChanged
                ? "Your draft changed while Prompt Shaper was working. Review before replacing it."
                : "Prompt Shaper found missing context. Review its assumption before replacing your draft."}
            </DialogDescription>
          </DialogHeader>

          {review?.assumptions ? (
            <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">
              <div className="mb-1 font-medium text-foreground">Assumption</div>
              <div className="whitespace-pre-wrap text-muted-foreground">
                {review.assumptions}
              </div>
            </div>
          ) : null}

          <textarea
            readOnly
            value={review?.enhancedPrompt ?? ""}
            aria-label="Enhanced prompt"
            className="min-h-64 w-full resize-y rounded-md border border-input bg-transparent p-3 font-mono text-sm leading-6 text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />

          <DialogFooter>
            <Button variant="outline" onClick={() => setReview(null)}>
              Keep current
            </Button>
            <Button
              onClick={() => {
                if (review === null) return;
                const enhancedPrompt = review.enhancedPrompt;
                setReview(null);
                applyEnhancement(enhancedPrompt);
              }}
            >
              Replace draft
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default definePluginApp((app) => {
  app.slots.composerAccessory({
    id: "enhance-prompt",
    component: PromptShaperAction,
  });
});
