import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactElement,
} from "react";
import {
  definePluginApp,
  type PluginAppComposer,
  type PluginAppContentScripts,
  useBbContext,
  useComposer,
  useComposerView,
  useRealtime,
  useRpc,
} from "@get-bb/plugin-sdk/app";
import "./app.css";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ProviderLogo } from "@/components/icons/provider-icon";
import type { rpcContract } from "./server";
import { FABLE_5_1_MODEL, scopeKey } from "./core.js";
import {
  clearPromptRun,
  installPromptThreadStatusController,
  trackPromptRun,
} from "./thread-status.js";

interface PendingRequest {
  cancellationRequested: boolean;
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

const COMPOSER_MODEL_TRIGGER =
  'button[aria-label^="Provider, model and reasoning"]';
const COMPOSER_ACTION_OVERFLOW =
  "[data-plugin-composer-action-overflow]";
const COMPOSER_ACTION_OVERFLOW_TRIGGER =
  'button[aria-label^="More plugin actions"][aria-expanded="true"]';

function owningComposer(actionRoot: HTMLElement): HTMLElement | null {
  const directComposer = actionRoot.closest<HTMLElement>("[data-app-composer]");
  if (directComposer !== null) return directComposer;

  const overflow = actionRoot.closest<HTMLElement>(COMPOSER_ACTION_OVERFLOW);
  if (overflow === null) return null;

  const openTriggers = Array.from(
    actionRoot.ownerDocument.querySelectorAll<HTMLElement>(
      COMPOSER_ACTION_OVERFLOW_TRIGGER,
    ),
  );
  const controlledTrigger =
    overflow.id.length === 0
      ? null
      : (openTriggers.find(
          (trigger) => trigger.getAttribute("aria-controls") === overflow.id,
        ) ?? null);
  const ownerTrigger =
    controlledTrigger ?? (openTriggers.length === 1 ? openTriggers[0] : null);
  return ownerTrigger?.closest<HTMLElement>("[data-app-composer]") ?? null;
}

/**
 * ComposerView does not currently expose execution selection. Read the exact
 * visible picker owned by this action's composer so new-thread, follow-up,
 * queued-message, and side-chat prompt boxes all route from what the user sees.
 * Overflow actions are portaled, so follow the open overflow trigger back to
 * its composer instead of relying only on DOM ancestry.
 */
export function promptBoxTargetModel(
  actionRoot: HTMLElement | null,
): typeof FABLE_5_1_MODEL | null | undefined {
  if (actionRoot === null) return undefined;
  const composerShell = owningComposer(actionRoot);
  if (composerShell === null) return undefined;
  const modelTrigger = composerShell.querySelector(COMPOSER_MODEL_TRIGGER);
  const title =
    modelTrigger?.getAttribute("title") ??
    modelTrigger?.querySelector("[title]")?.getAttribute("title");
  const visibleLabel = modelTrigger?.textContent ?? "";
  const selectionText = `${title ?? ""}\n${visibleLabel}`;
  if (/\b(?:Fable 5\.1|claude-fable-5-1)\b/iu.test(selectionText)) {
    return FABLE_5_1_MODEL;
  }
  if (/\bLoading models\b/iu.test(selectionText)) return undefined;
  return null;
}

type HelperExecutionInput =
  | { mode: "fixed"; providerId: string; model: string | null }
  | { mode: "default" | "thread"; providerId: null; model: null };

export function createHelperExecutionSaveQueue(
  save: (input: HelperExecutionInput) => Promise<unknown>,
  onLatestResult: (failed: boolean) => void,
): (input: HelperExecutionInput) => void {
  let generation = 0;
  let queue: Promise<void> = Promise.resolve();
  return (input) => {
    generation += 1;
    const requestGeneration = generation;
    queue = queue
      .catch(() => undefined)
      .then(() => save(input))
      .then(
        () => {
          if (requestGeneration === generation) onLatestResult(false);
        },
        () => {
          if (requestGeneration === generation) onLatestResult(true);
        },
      );
  };
}

interface ConsumeResultOptions {
  allowDuringCancellation?: boolean;
  clearIfAbsent?: boolean;
}

const PENDING_STORAGE_PREFIX = "bb-plugin-prompt-shaper:pending:";
const STARTUP_GRACE_MS = 30_000;
const DETACHED_CANCEL_ATTEMPTS = 3;
const locallyStartingRequestIds = new Set<string>();
const PROMPT_SHIMMER_EFFECT = {
  className: "bb-improve-prompt-shimmer",
} as const;

interface ContentScriptCompatibleApp {
  readonly composer: PluginAppComposer;
  readonly contentScripts?: PluginAppContentScripts;
  readonly experimental_contentScripts?: PluginAppContentScripts;
  readonly slots?: {
    settingsSection(registration: {
      id: string;
      description: string;
      component: () => ReactElement;
    }): void;
  };
}

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
      const cancellationRequested =
        "cancellationRequested" in value &&
        value.cancellationRequested === true;
      return {
        available: true,
        request: {
          cancellationRequested,
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
    if (stored !== null && stored.requestId !== request.requestId) return;
    window.sessionStorage.removeItem(pendingStorageKey(request.scopeKey));
  } catch {
    // Session storage is a recovery aid; enhancement still works without it.
  }
  clearPromptRun(request.requestId);
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

export function canStartEnhancement(input: {
  draft: string;
  hasPendingRequest: boolean;
  isSubmitting: boolean;
  projectId: string | null;
}): boolean {
  return (
    input.projectId !== null &&
    input.draft.trim().length > 0 &&
    !input.hasPendingRequest &&
    !input.isSubmitting
  );
}

export function shouldCancelForSubmission(input: {
  isSubmitting: boolean;
  pendingScopeKey: string | null;
  scopeKey: string;
}): boolean {
  return input.isSubmitting && input.pendingScopeKey === input.scopeKey;
}

async function cancelDetachedRequest(
  request: PendingRequest,
  cancel: () => Promise<unknown>,
): Promise<boolean> {
  for (let attempt = 0; attempt < DETACHED_CANCEL_ATTEMPTS; attempt += 1) {
    try {
      await cancel();
      clearPendingRequest(request);
      return true;
    } catch {
      // Retry a bounded number of times. If transport stays unavailable, keep
      // the durable marker so remount/reconciliation can recover the request.
    }
  }
  return false;
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
  const sourceThreadId =
    view.scope.kind === "thread" || view.scope.kind === "queued-message"
      ? view.scope.threadId
      : view.scope.kind === "side-chat"
        ? (view.scope.childThreadId ?? view.scope.parentThreadId)
        : null;
  const statusThreadId =
    view.scope.kind === "thread" || view.scope.kind === "queued-message"
      ? view.scope.threadId
      : view.scope.kind === "side-chat"
        ? view.scope.parentThreadId
        : null;
  const rpc = useRpc<typeof rpcContract>();
  const [pending, setPending] = useState<PendingRequest | null>(() =>
    loadPendingRequest(composerScopeKey),
  );
  const reconcileRecoveredPendingRef = useRef(pending !== null);
  const pendingRef = useRef<PendingRequest | null>(pending);
  const cancellingRequestIdRef = useRef<string | null>(null);
  const composerRef = useRef(composer);
  const actionsRootRef = useRef<HTMLDivElement>(null);
  const composerScopeKeyRef = useRef(composerScopeKey);
  const mountedComposerScopeKindRef = useRef(view.scope.kind);
  const rpcRef = useRef(rpc);
  const isSubmittingRef = useRef(view.run.isSubmitting);
  const [isHovered, setIsHovered] = useState(false);
  const [isKeyboardFocused, setIsKeyboardFocused] = useState(false);
  const [undoState, setUndoState] = useState<UndoState | null>(null);
  composerRef.current = composer;
  composerScopeKeyRef.current = composerScopeKey;
  isSubmittingRef.current = view.run.isSubmitting;
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

  const trackThreadStatus = useCallback(
    (request: PendingRequest) => {
      if (statusThreadId === null) return;
      trackPromptRun({
        requestId: request.requestId,
        threadId: statusThreadId,
        getState: async () => {
          const record = await rpcRef.current.call("getEnhancement", {
            requestId: request.requestId,
          });
          if (record?.status === "running") return "running";
          if (record !== null) return "terminal";

          const stored = readPendingStorage(request.scopeKey);
          const durable =
            stored.request?.requestId === request.requestId
              ? stored.request
              : null;
          const markerWasRemoved = stored.available && durable === null;
          const startupWasAcknowledged =
            (durable ?? request).startup === "acknowledged";
          const startupGraceExpired =
            Date.now() - (durable ?? request).createdAt >= STARTUP_GRACE_MS;
          const startupIsLocallyInFlight = locallyStartingRequestIds.has(
            request.requestId,
          );
          return markerWasRemoved ||
            startupWasAcknowledged ||
            (startupGraceExpired && !startupIsLocallyInFlight)
            ? "terminal"
            : "running";
        },
      });
    },
    [statusThreadId],
  );

  useEffect(() => {
    if (isRunning && pending !== null) trackThreadStatus(pending);
  }, [isRunning, pending, trackThreadStatus]);

  useEffect(() => {
    composer.setTextEffect(isRunning ? PROMPT_SHIMMER_EFFECT : null);
    composer.setInputLock(isRunning);
  }, [
    composer.setInputLock,
    composer.setTextEffect,
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
    };
  }, [
    composer.setInputLock,
    composer.setTextEffect,
    composerScopeKey,
  ]);

  const clearLoadingEffects = useCallback(() => {
    composerRef.current.setInputLock(false);
    composerRef.current.setTextEffect(null);
  }, []);

  const cancelInBackground = useCallback(
    (request: PendingRequest) => {
      void cancelDetachedRequest(request, () =>
        rpcRef.current.call("cancelEnhancement", {
          requestId: request.requestId,
        }),
      ).then((cancelled) => {
        if (
          !cancelled ||
          pendingRef.current?.requestId !== request.requestId
        ) {
          return;
        }
        clearLoadingEffects();
        setPendingRequest(null);
      });
    },
    [clearLoadingEffects, setPendingRequest],
  );

  useEffect(() => {
    const recoveredState = readPendingStorage(composerScopeKeyRef.current);
    const recoveredRequest = recoveredState.request;
    if (recoveredRequest?.cancellationRequested) {
      reconcileRecoveredPendingRef.current = false;
      cancelInBackground(recoveredRequest);
    } else if (
      recoveredState.available &&
      recoveredRequest === null &&
      pendingRef.current?.cancellationRequested
    ) {
      // Another mounted instance can finish cancellation after this render's
      // state initializer reads the marker but before this effect runs.
      reconcileRecoveredPendingRef.current = false;
      pendingRef.current = null;
      setPending(null);
      clearLoadingEffects();
    } else if (pendingRef.current === null && recoveredRequest !== null) {
      pendingRef.current = recoveredRequest;
      setPending(recoveredRequest);
    }
    return () => {
      const detachedRequest = pendingRef.current;
      pendingRef.current = null;

      // Thread and new-thread requests intentionally survive navigation so
      // returning to their durable scope can recover and reconcile them.
      // Side-chat and queued-message scopes are ephemeral: the host's
      // full-scope key unmounts this action when their owner changes, so
      // invalidate and cancel those requests from this cleanup.
      if (
        detachedRequest === null ||
        mountedComposerScopeKindRef.current === "thread" ||
        mountedComposerScopeKindRef.current === "new-thread"
      ) {
        return;
      }
      const cancellationRequest = {
        ...detachedRequest,
        cancellationRequested: true,
      };
      savePendingRequest(cancellationRequest);
      cancelInBackground(cancellationRequest);
    };
  }, [cancelInBackground, clearLoadingEffects]);

  useEffect(() => {
    const active = pendingRef.current;
    if (
      !shouldCancelForSubmission({
        isSubmitting: view.run.isSubmitting,
        pendingScopeKey: active?.scopeKey ?? null,
        scopeKey: composerScopeKey,
      }) ||
      active === null ||
      active.cancellationRequested
    ) {
      return;
    }

    const cancellationRequest = {
      ...active,
      cancellationRequested: true,
    };
    savePendingRequest(cancellationRequest);
    pendingRef.current = cancellationRequest;
    setPending(cancellationRequest);
    cancelInBackground(cancellationRequest);
  }, [cancelInBackground, composerScopeKey, view.run.isSubmitting]);

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
      if (active.cancellationRequested || isSubmittingRef.current) {
        return "ignored";
      }
      if (
        cancellingRequestIdRef.current === requestId &&
        !options.allowDuringCancellation
      ) {
        return "ignored";
      }

      const record = await rpc.call("getEnhancement", { requestId });
      if (pendingRef.current !== active) return "ignored";
      if (isSubmittingRef.current) return "ignored";
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
    if (
      projectId === null ||
      !canStartEnhancement({
        draft,
        hasPendingRequest: pendingRef.current !== null,
        isSubmitting: view.run.isSubmitting,
        projectId,
      })
    ) {
      return;
    }

    const targetModel = promptBoxTargetModel(actionsRootRef.current);
    if (targetModel === undefined) {
      toast.error(
        "Could not read this prompt box's selected model. Wait for the picker to finish loading, then try again.",
      );
      return;
    }

    const request: PendingRequest = {
      cancellationRequested: false,
      createdAt: Date.now(),
      requestId: crypto.randomUUID(),
      scopeKey: composerScopeKey,
      startup: "starting",
    };
    setUndoState(null);
    composer.setTextEffect(PROMPT_SHIMMER_EFFECT);
    composer.setInputLock(true);
    setPendingRequest(request);
    trackThreadStatus(request);
    locallyStartingRequestIds.add(request.requestId);

    try {
      await rpc.call("startEnhancement", {
        requestId: request.requestId,
        draft,
        projectId,
        sourceThreadId,
        targetModel,
      });
      locallyStartingRequestIds.delete(request.requestId);

      const stored = loadPendingRequest(request.scopeKey);
      const acknowledgedRequest: PendingRequest = {
        ...request,
        cancellationRequested:
          stored?.requestId === request.requestId
            ? stored.cancellationRequested
            : false,
        startup: "acknowledged",
      };
      if (stored?.requestId === request.requestId) {
        savePendingRequest(acknowledgedRequest);
      }
      if (pendingRef.current === request) {
        pendingRef.current = acknowledgedRequest;
        setPending(acknowledgedRequest);
      }
    } catch (error) {
      locallyStartingRequestIds.delete(request.requestId);
      // Startup can fail after this instance has detached. Preserve a durable
      // cancellation intent until the cancellation RPC acknowledges it;
      // otherwise clear a request that the server never created.
      const durable = loadPendingRequest(request.scopeKey);
      if (
        durable?.requestId !== request.requestId ||
        !durable.cancellationRequested
      ) {
        clearPendingRequest(request);
      }
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
    sourceThreadId,
    trackThreadStatus,
    view.run.isSubmitting,
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

  const isDisabled =
    !isRunning &&
    !canStartEnhancement({
      draft: view.draft.text,
      hasPendingRequest: pendingRef.current !== null,
      isSubmitting: view.run.isSubmitting,
      projectId,
    });
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
      <div
        ref={actionsRootRef}
        className="flex items-center"
        data-prompt-shaper-actions
      >
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
                  void cancel();
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

type HelperChoice =
  | { mode: "default" }
  | { mode: "thread" }
  | { mode: "fixed"; providerId: string; model: string | null };

function choiceKey(choice: HelperChoice): string {
  if (choice.mode === "fixed") {
    return `fixed:${choice.providerId}|${choice.model ?? ""}`;
  }
  // "default" and "thread" resolve identically (inherit the thread), so the
  // picker presents them as one "Same as thread" entry.
  return "thread";
}

interface HelperProviderGroup {
  id: string;
  displayName: string;
  available: boolean;
  models: { model: string; displayName: string }[];
}

function helperChoiceLabel(
  choice: HelperChoice,
  groups: readonly HelperProviderGroup[],
): string {
  if (choice.mode !== "fixed") return "Same as thread";
  const group = groups.find((entry) => entry.id === choice.providerId);
  const providerName = group?.displayName ?? choice.providerId;
  if (choice.model === null) return `${providerName} default`;
  return (
    group?.models.find((entry) => entry.model === choice.model)?.displayName ??
    choice.model
  );
}

/**
 * A menu row matching the composer model picker's rows: xs type, quiet hover,
 * and a trailing check on the selected entry.
 */
/**
 * Splits a trailing parenthetical off a model label (e.g. "Opus 5 (1M)" →
 * base "Opus 5", tag "1M") so the tag renders as a muted suffix without the
 * parentheses — the same treatment as the composer picker.
 */
function splitLabelTag(label: string): { base: string; tag: string | null } {
  const match = label.match(/^(.*\S)\s*\(([^()]+)\)$/u);
  if (!match) return { base: label, tag: null };
  return { base: match[1], tag: match[2] };
}

function HelperMenuRow({
  label,
  qualifier,
  leading,
  selected,
  onSelect,
}: {
  label: string;
  /** Muted suffix, e.g. "Default" on the inherit row. */
  qualifier?: string;
  leading?: ReactElement;
  selected: boolean;
  onSelect: () => void;
}) {
  const { base, tag } = splitLabelTag(label);
  return (
    <button
      type="button"
      onClick={onSelect}
      className="relative flex w-full cursor-default select-none items-center justify-between gap-3 rounded-sm px-2 py-[0.3125rem] text-xs outline-none transition-colors hover:bg-state-hover hover:text-foreground"
    >
      <span className="flex min-w-0 items-center gap-2">
        {leading ?? null}
        <span className="truncate">
          {base}
          {tag ? (
            <span className="ml-1.5 text-subtle-foreground">{tag}</span>
          ) : null}
          {qualifier ? (
            <span className="ml-1.5 text-subtle-foreground">{qualifier}</span>
          ) : null}
        </span>
      </span>
      <Icon
        name="Check"
        className={
          selected
            ? "size-3.5 shrink-0 opacity-100"
            : "size-3.5 shrink-0 opacity-0"
        }
        aria-hidden="true"
      />
    </button>
  );
}

/** Mirrors the composer picker's sticky section label. */
function HelperMenuSectionLabel({ children }: { children: string }) {
  return (
    <div className="sticky top-0 z-10 bg-background px-2 pb-[0.3125rem] pt-2 text-xs font-medium text-muted-foreground">
      {children}
    </div>
  );
}

const HELPER_SEARCH_MIN_OPTIONS = 5;

/**
 * The helper's execution picker, matching the composer model picker's
 * anatomy: provider icon tabs across the top, a search input, then one
 * provider's models as check-marked rows. The helper adds a single pinned
 * "Same as thread" entry, which is also the default.
 */
function HelperExecutionSettings(): ReactElement {
  const rpc = useRpc<typeof rpcContract>();
  const [groups, setGroups] = useState<HelperProviderGroup[]>([]);
  const [choice, setChoice] = useState<HelperChoice>({ mode: "default" });
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState(false);
  const [query, setQuery] = useState("");
  const [activeProviderId, setActiveProviderId] = useState<string | null>(
    null,
  );
  // The provider/model catalog can take seconds to load. A selection made
  // before it resolves must not be clobbered by the fetched initial value.
  const userChoseRef = useRef(false);
  const saveChoiceRef = useRef<((input: HelperExecutionInput) => void) | null>(
    null,
  );
  if (saveChoiceRef.current === null) {
    saveChoiceRef.current = createHelperExecutionSaveQueue(
      (input) => rpc.call("setHelperExecution", input),
      setFailed,
    );
  }

  useEffect(() => {
    let active = true;
    void (async () => {
      const [setting, providerList] = await Promise.all([
        rpc.call("getHelperExecution", {}),
        rpc.call("listHelperProviders", {}),
      ]);
      const loaded = await Promise.all(
        providerList.providers.map(async (provider) => ({
          ...provider,
          models: provider.available
            ? (
                await rpc
                  .call("listHelperModels", { providerId: provider.id })
                  .catch(() => ({ models: [] }))
              ).models
            : [],
        })),
      );
      if (!active) return;
      setGroups(loaded);
      if (!userChoseRef.current) {
        setChoice(
          setting.mode === "fixed"
            ? {
                mode: "fixed",
                providerId: setting.providerId,
                model: setting.model,
              }
            : { mode: setting.mode },
        );
      }
    })().catch(() => {
      if (active) setFailed(true);
    });
    return () => {
      active = false;
    };
  }, [rpc]);

  const select = (next: HelperChoice) => {
    userChoseRef.current = true;
    setChoice(next);
    setOpen(false);
    setQuery("");
    saveChoiceRef.current?.(
      next.mode === "fixed"
        ? { mode: "fixed", providerId: next.providerId, model: next.model }
        : { mode: next.mode, providerId: null, model: null },
    );
  };

  const availableGroups = groups.filter((group) => group.available);
  const selectedKey = choiceKey(choice);
  // The visible tab: the last one the user clicked, else the fixed choice's
  // provider, else the first available provider.
  const visibleProviderId =
    activeProviderId ??
    (choice.mode === "fixed" ? choice.providerId : null) ??
    availableGroups[0]?.id ??
    null;
  const visibleGroup =
    availableGroups.find((group) => group.id === visibleProviderId) ?? null;
  const normalizedQuery = query.trim().toLowerCase();
  const matches = (text: string) =>
    normalizedQuery.length === 0 ||
    text.toLowerCase().includes(normalizedQuery);
  const showSearch =
    (visibleGroup?.models.length ?? 0) + 1 > HELPER_SEARCH_MIN_OPTIONS;
  const selectedGroup =
    choice.mode === "fixed"
      ? groups.find((entry) => entry.id === choice.providerId)
      : undefined;
  // Real models only — the composer's picker has no synthetic
  // "provider default" row, so neither does this one.
  const visibleRows =
    visibleGroup === null
      ? []
      : visibleGroup.models
          .map((entry) => ({
            key: choiceKey({
              mode: "fixed",
              providerId: visibleGroup.id,
              model: entry.model,
            }),
            label: entry.displayName,
            model: entry.model as string | null,
          }))
          .filter((row) => matches(row.label));

  return (
    <div className="flex items-center gap-1 text-sm text-muted-foreground">
      Runs with
      <Popover
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) {
            setQuery("");
            setActiveProviderId(null);
          }
        }}
      >
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label="Helper provider and model"
            className="h-8 w-fit min-w-0 max-w-full items-center justify-start gap-1 border-none bg-transparent px-1 text-xs leading-tight shadow-none"
          >
            {choice.mode === "fixed" ? (
              <ProviderLogo
                providerId={choice.providerId}
                displayName={selectedGroup?.displayName ?? choice.providerId}
              />
            ) : null}
            <span className="min-w-0 truncate">
              {helperChoiceLabel(choice, groups)}
            </span>
            <Icon
              name="ChevronDown"
              className="size-3.5 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          mobileTitle="Helper model"
          className="flex w-max min-w-52 max-w-80 flex-col p-0"
        >
          {/* Provider icon tabs, matching the composer picker's strip. */}
          {availableGroups.length > 1 ? (
            <div className="flex items-center gap-0.5 border-b border-border bg-surface-recessed px-2.5 pt-1">
              {availableGroups.map((group) => {
                const isActive = group.id === visibleProviderId;
                return (
                  <button
                    key={group.id}
                    type="button"
                    title={group.displayName}
                    onClick={() => {
                      if (group.id !== visibleProviderId) {
                        setActiveProviderId(group.id);
                        setQuery("");
                      }
                    }}
                    className={
                      "flex h-8 w-8 items-center justify-center border-b-2 transition-colors focus-visible:outline-none " +
                      (isActive
                        ? "border-foreground text-foreground"
                        : "border-transparent text-muted-foreground hover:text-foreground")
                    }
                  >
                    <ProviderLogo
                      providerId={group.id}
                      displayName={group.displayName}
                    />
                  </button>
                );
              })}
            </div>
          ) : null}
          {showSearch ? (
            <div className="shrink-0 border-b border-border px-1.5 py-1">
              <div className="relative">
                <Icon
                  name="Search"
                  className="pointer-events-none absolute left-1.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search models"
                  aria-label="Search models"
                  className="h-7 w-full border-0 bg-transparent pl-8 pr-2 text-xs outline-none placeholder:text-muted-foreground"
                />
              </div>
            </div>
          ) : null}
          <div className="max-h-64 overflow-y-auto px-1 pb-1 pt-0">
            {matches("same as thread default") ? (
              <HelperMenuRow
                label="Same as thread"
                qualifier="Default"
                selected={selectedKey === "thread"}
                onSelect={() => select({ mode: "thread" })}
              />
            ) : null}
            <HelperMenuSectionLabel>Model</HelperMenuSectionLabel>
            {visibleRows.map((row) => (
              <HelperMenuRow
                key={row.key}
                label={row.label}
                selected={selectedKey === row.key}
                onSelect={() =>
                  select({
                    mode: "fixed",
                    providerId: visibleGroup?.id ?? "",
                    model: row.model,
                  })
                }
              />
            ))}
            {visibleRows.length === 0 && normalizedQuery.length > 0 ? (
              <div className="px-2 py-[0.3125rem] text-xs text-muted-foreground">
                No models match your search
              </div>
            ) : null}
          </div>
        </PopoverContent>
      </Popover>
      {failed ? (
        <span className="text-xs text-destructive" role="alert">
          Couldn&rsquo;t save
        </span>
      ) : null}
    </div>
  );
}

export function registerPromptPluginApp(app: ContentScriptCompatibleApp): void {
  const contentScripts =
    app.contentScripts ?? app.experimental_contentScripts;
  contentScripts?.register({
    id: "thread-status",
    mount({ experimental_setThreadRowStatus }) {
      if (experimental_setThreadRowStatus === undefined) return;
      return installPromptThreadStatusController(
        experimental_setThreadRowStatus,
      );
    },
  });
  app.composer.customize({
    id: "improve-prompt",
    actions: [{ id: "improve", component: PromptShaperAction }],
  });
  app.slots?.settingsSection({
    id: "improve-prompt",
    description: "Model for the hidden prompt-improvement helper.",
    component: HelperExecutionSettings,
  });
}

export default definePluginApp((app) => registerPromptPluginApp(app));
