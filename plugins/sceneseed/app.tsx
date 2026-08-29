import {
  Component,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ErrorInfo,
  type ReactNode,
} from "react";
import {
  definePluginApp,
  experimental_NewThreadComposer as NewThreadComposer,
  useBbNavigate,
  useRealtime,
  useRealtimeConnectionState,
  useRpc,
  type NewThreadRequest,
  type PluginNavPanelProps,
  type PluginSettingsSectionProps,
} from "@get-bb/plugin-sdk/app";
import { Button } from "./components/ui/button.js";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "./components/ui/dropdown-menu.js";
import { Icon } from "./components/ui/icon.js";
import { Skeleton } from "./components/ui/skeleton.js";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./components/ui/tooltip.js";

import type { rpcContract } from "./server";
import {
  SceneRenderer,
  type SceneRenderObject,
  type SceneRenderProbeEvent,
} from "./scene-renderer.js";
import {
  createSceneSeedUiFixture,
  SCENESEED_QA_SUBPATH,
} from "./sceneseed-ui-fixture.js";
import type {
  CanvasSnapshotDto,
  CardDto,
  JobDto,
  ObjectDto,
  Placement,
  Transform3D,
} from "./store.js";
import "./app.css";

const PANEL_PATH = "sceneseed";
const ACTIVE_CARD_STATES = new Set<CardDto["state"]>([
  "queued",
  "interpreting",
  "realizing",
]);

type ConnectionState = ReturnType<typeof useRealtimeConnectionState>;

interface WorkspaceActions {
  submit(prompt: string, placement: Placement): Promise<void>;
  retry(card: CardDto): Promise<void>;
  cancel(jobId: string): Promise<void>;
  transform(object: ObjectDto, transform: Transform3D): Promise<void>;
  remix(objectId: string): Promise<void>;
  duplicate(object: ObjectDto): Promise<void>;
  remove(object: ObjectDto): Promise<void>;
}

function nextClientId(prefix: string): string {
  const id = globalThis.crypto?.randomUUID?.();
  if (id) return `${prefix}_${id.replaceAll("-", "")}`;
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function isCanvasSignal(
  payload: unknown,
): payload is { canvasId: string; revision: number } {
  if (typeof payload !== "object" || payload === null) return false;
  return (
    "canvasId" in payload &&
    typeof payload.canvasId === "string" &&
    "revision" in payload &&
    typeof payload.revision === "number"
  );
}

function parseCanvasId(subPath: string): string | null {
  if (!subPath.startsWith("canvas/")) return null;
  const encoded = subPath.slice("canvas/".length);
  if (!encoded || encoded.includes("/")) return null;
  try {
    return decodeURIComponent(encoded);
  } catch {
    return null;
  }
}

function cardStateLabel(card: CardDto): string {
  switch (card.state) {
    case "ready":
      return "Ready";
    case "queued":
      return "Queued";
    case "interpreting":
      return "Interpreting";
    case "realizing":
      return "Realizing";
    case "complete":
      return "Complete";
    case "cancelled":
      return "Cancelled";
    case "failed":
      return "Failed";
  }
}

function useClock(active: boolean): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, [active]);
  return now;
}

function ImplicitCanvas() {
  const rpc = useRpc<typeof rpcContract>();
  const connection = useRealtimeConnectionState();
  const [canvasId, setCanvasId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryNonce, setRetryNonce] = useState(0);

  useEffect(() => {
    let active = true;
    const open = async () => {
      try {
        const listed = await rpc.call("listCanvases");
        const existing = [...listed.canvases].sort(
          (left, right) => left.createdAt - right.createdAt,
        )[0];
        if (existing) {
          if (active) setCanvasId(existing.id);
          return;
        }
        if (connection !== "connected") {
          throw new Error("Reconnect to restore the canvas.");
        }
        const created = await rpc.call("createCanvas", { name: "SceneSeed" });
        if (active) setCanvasId(created.snapshot.canvas.id);
      } catch (reason) {
        if (active) setError(errorMessage(reason));
      }
    };
    setError(null);
    void open();
    return () => {
      active = false;
    };
  }, [connection, retryNonce, rpc]);

  if (canvasId) return <CanvasEditor canvasId={canvasId} />;
  if (!error) return <LoadingCanvas />;
  return (
    <main className="sceneseed-missing">
      <h1>Canvas unavailable</h1>
      <p>{error}</p>
      <Button
        type="button"
        variant="outline"
        onClick={() => setRetryNonce((value) => value + 1)}
      >
        Retry
      </Button>
    </main>
  );
}

class RendererBoundary extends Component<
  { resetKey: number; children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  componentDidUpdate(previous: Readonly<{ resetKey: number }>) {
    if (previous.resetKey !== this.props.resetKey && this.state.failed) {
      this.setState({ failed: false });
    }
  }

  componentDidCatch(_error: Error, _info: ErrorInfo): void {}

  render(): ReactNode {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function RendererUnavailable({ onReload }: { onReload: () => void }) {
  return (
    <div className="sceneseed-renderer-fallback" role="status">
      <div className="sceneseed-seed-mark" aria-hidden="true" />
      <h3>The 3D canvas is resting.</h3>
      <p>
        WebGL is unavailable or its context was lost. Your prompts and objects
        are still saved.
      </p>
      <Button type="button" variant="outline" onClick={onReload}>
        Reload renderer
      </Button>
    </div>
  );
}

function activeJobForCard(
  snapshot: CanvasSnapshotDto,
  card: CardDto,
): JobDto | null {
  if (!card.activeJobId) return null;
  return snapshot.jobs.find((job) => job.id === card.activeJobId) ?? null;
}

function objectForCard(
  snapshot: CanvasSnapshotDto,
  cardId: string,
): ObjectDto | null {
  return (
    snapshot.objects.find(
      (object) => object.sourceCardId === cardId && object.removedAt === null,
    ) ?? null
  );
}

function buildRenderObjects(
  snapshot: CanvasSnapshotDto,
  revealingObjectIds: ReadonlySet<string>,
  realizationAttemptIds: ReadonlyMap<string, string> = new Map(),
): SceneRenderObject[] {
  const objects: SceneRenderObject[] = [];
  for (const object of snapshot.objects) {
    if (object.removedAt !== null) continue;
    const active = snapshot.candidates.find(
      (candidate) => candidate.id === object.activeSceneId,
    );
    if (active?.normalizedScene) {
      objects.push({
        scene: active.normalizedScene,
        position: object.transform.position,
        rotation: object.transform.rotation,
        scale: object.transform.scale,
        revisionKey: active.id,
        reveal: revealingObjectIds.has(object.id),
      });
    }
    const currentJob = object.activeJobId
      ? snapshot.jobs.find((job) => job.id === object.activeJobId)
      : null;
    if (currentJob?.state !== "realizing") continue;
    const pending = snapshot.candidates.find(
      (candidate) =>
        candidate.jobId === currentJob.id &&
        candidate.state === "pending" &&
        candidate.normalizedScene !== null,
    );
    if (!pending?.normalizedScene) continue;
    const attemptId = realizationAttemptIds.get(pending.id);
    if (!attemptId) continue;
    objects.push({
      scene: pending.normalizedScene,
      position: object.transform.position,
      rotation: object.transform.rotation,
      scale: object.transform.scale,
      revisionKey: `${pending.id}:${attemptId}`,
      reveal: true,
      probeOnly: true,
    });
  }
  return objects;
}

function promptFromComposerRequest(request: NewThreadRequest): string {
  if (request.input.some((entry) => entry.type !== "text")) {
    throw new Error(
      "SceneSeed can draw from text only. Remove attachments and send again.",
    );
  }
  const visibleText: string[] = [];
  for (const entry of request.input) {
    if (entry.type === "text" && entry.visibility !== "agent-only") {
      visibleText.push(entry.text);
    }
  }
  const prompt = visibleText.join("\n").trim();
  if (!prompt)
    throw new Error("Write a prompt before sending it to the scene.");
  if (prompt.length > 500) {
    throw new Error("Keep the SceneSeed prompt to 500 characters or fewer.");
  }
  return prompt;
}

const AUTO_PLACEMENTS: readonly Placement[] = [
  { x: 0, y: 0 },
  { x: -3.2, y: 1.2 },
  { x: 3.2, y: -0.9 },
  { x: 0.7, y: 3.2 },
  { x: -1.1, y: -3.4 },
  { x: 5.4, y: 2.4 },
  { x: -5.2, y: -2.2 },
  { x: 5.7, y: -3.4 },
  { x: -5.8, y: 3.5 },
];

function automaticPlacement(snapshot: CanvasSnapshotDto): Placement {
  const occupied = snapshot.cards.flatMap((card) =>
    card.placement === null ? [] : [card.placement],
  );
  const open = AUTO_PLACEMENTS.find(
    (candidate) =>
      !occupied.some(
        (placement) =>
          Math.hypot(candidate.x - placement.x, candidate.y - placement.y) <
          1.75,
      ),
  );
  if (open) return open;
  const index = occupied.length;
  const angle = index * 2.399963229728653;
  const radius = Math.min(7, 2.4 + Math.sqrt(index) * 0.8);
  return {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * Math.min(radius, 5.2),
  };
}

function CanvasActivity({
  snapshot,
  now,
  readOnly,
  onCancel,
  onRetry,
}: {
  snapshot: CanvasSnapshotDto;
  now: number;
  readOnly: boolean;
  onCancel: (jobId: string) => void;
  onRetry: (card: CardDto) => void;
}) {
  const active = [...snapshot.cards]
    .reverse()
    .find(
      (card) =>
        card.state === "queued" ||
        card.state === "interpreting" ||
        card.state === "realizing",
    );
  const newest = [...snapshot.cards].sort(
    (left, right) => right.updatedAt - left.updatedAt,
  )[0];
  const failed = newest?.state === "failed" ? newest : undefined;
  const card = active ?? failed;
  if (!card) return null;
  const job = activeJobForCard(snapshot, card);
  if (card.state === "failed") {
    return (
      <section className="sceneseed-activity" data-tone="error" role="alert">
        <Icon name="AlertCircle" aria-hidden="true" />
        <div>
          <strong>That idea didn’t make it onto the canvas</strong>
          <span>{job?.errorMessage ?? card.prompt}</span>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={readOnly}
          onClick={() => onRetry(card)}
        >
          Retry
        </Button>
      </section>
    );
  }
  const startedAt = job?.startedAt ?? job?.createdAt ?? card.updatedAt;
  const label =
    card.state === "queued"
      ? "Waiting to draw"
      : card.state === "interpreting"
        ? "Drawing your idea"
        : "Building the scene";
  return (
    <section className="sceneseed-activity" role="status" aria-live="polite">
      <Icon name="Spinner" className="sceneseed-spin" aria-hidden="true" />
      <div>
        <strong>{label}</strong>
        <span>{card.prompt}</span>
      </div>
      {card.state !== "queued" ? (
        <small>{Math.max(1, Math.floor((now - startedAt) / 1_000))}s</small>
      ) : null}
      {(card.state === "queued" || card.state === "interpreting") && job ? (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={readOnly}
          onClick={() => onCancel(job.id)}
        >
          Cancel
        </Button>
      ) : null}
    </section>
  );
}

function SceneContentsMenu({
  snapshot,
  selectedObjectId,
  readOnly,
  onSelectObject,
  onCancel,
  onRetry,
}: {
  snapshot: CanvasSnapshotDto;
  selectedObjectId: string | null;
  readOnly: boolean;
  onSelectObject: (objectId: string) => void;
  onCancel: (jobId: string) => void;
  onRetry: (card: CardDto) => void;
}) {
  const visibleObjects = snapshot.objects.filter(
    (object) => object.removedAt === null,
  );
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" size="sm" variant="ghost">
          <Icon name="Layers" aria-hidden="true" />
          {visibleObjects.length}{" "}
          {visibleObjects.length === 1 ? "object" : "objects"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="sceneseed-contents-menu">
        <DropdownMenuLabel>Scene contents</DropdownMenuLabel>
        {snapshot.cards.length === 0 ? (
          <DropdownMenuItem disabled>No objects yet</DropdownMenuItem>
        ) : (
          snapshot.cards.map((card) => {
            const object = objectForCard(snapshot, card.id);
            const job = activeJobForCard(snapshot, card);
            const canRetry =
              card.state === "ready" ||
              card.state === "cancelled" ||
              card.state === "failed";
            const canCancel =
              (card.state === "queued" || card.state === "interpreting") &&
              job !== null;
            const canSelect = object !== null;
            return (
              <DropdownMenuItem
                key={card.id}
                disabled={!canSelect && !canRetry && !canCancel}
                aria-checked={object?.id === selectedObjectId}
                role={canSelect ? "menuitemradio" : "menuitem"}
                onSelect={() => {
                  if (object) onSelectObject(object.id);
                  else if (canRetry) onRetry(card);
                  else if (canCancel && job) onCancel(job.id);
                }}
              >
                <span
                  className="sceneseed-contents-status"
                  data-state={card.state}
                />
                <span className="sceneseed-contents-copy">
                  <strong>{card.prompt}</strong>
                  <small>
                    {canRetry
                      ? "Retry"
                      : canCancel
                        ? "Cancel generation"
                        : cardStateLabel(card)}
                  </small>
                </span>
                {object?.id === selectedObjectId ? (
                  <Icon
                    name="Check"
                    className="sceneseed-contents-check"
                    aria-hidden="true"
                  />
                ) : null}
              </DropdownMenuItem>
            );
          })
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ObjectControls({
  object,
  card,
  readOnly,
  actionRef,
  onTransform,
  onRemix,
  onDuplicate,
  onRemove,
}: {
  object: ObjectDto;
  card: CardDto;
  readOnly: boolean;
  actionRef: (element: HTMLButtonElement | null) => void;
  onTransform: (transform: Transform3D) => void;
  onRemix: () => void;
  onDuplicate: () => void;
  onRemove: () => void;
}) {
  const transform = object.transform;
  const move = (x: number, z: number) =>
    onTransform({
      ...transform,
      position: [
        transform.position[0] + x,
        transform.position[1],
        transform.position[2] + z,
      ],
    });
  const rotate = (delta: number) =>
    onTransform({
      ...transform,
      rotation: [
        transform.rotation[0],
        transform.rotation[1] + delta,
        transform.rotation[2],
      ],
    });
  const scale = (factor: number) =>
    onTransform({
      ...transform,
      scale: transform.scale.map((value) =>
        Math.max(0.1, Math.min(10, value * factor)),
      ) as [number, number, number],
    });
  return (
    <section
      className="sceneseed-object-controls"
      aria-labelledby="sceneseed-selected-heading"
    >
      <span className="sceneseed-selection-dot" aria-hidden="true" />
      <h3 id="sceneseed-selected-heading">{card.prompt}</h3>
      <Button
        ref={actionRef}
        type="button"
        size="sm"
        variant="secondary"
        disabled={readOnly}
        onClick={onRemix}
      >
        Remix
      </Button>
      <DropdownMenu>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  disabled={readOnly}
                  aria-label="More object actions"
                >
                  <Icon name="MoreHorizontal" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>More object actions</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Arrange object</DropdownMenuLabel>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Move</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem onSelect={() => move(-0.5, 0)}>
                Left
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => move(0.5, 0)}>
                Right
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => move(0, -0.5)}>
                Forward
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => move(0, 0.5)}>
                Back
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Rotate</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem onSelect={() => rotate(-Math.PI / 12)}>
                Counterclockwise
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => rotate(Math.PI / 12)}>
                Clockwise
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Scale</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem onSelect={() => scale(0.9)}>
                Smaller
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => scale(1.1)}>
                Larger
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={onDuplicate}>
            <Icon name="Copy" aria-hidden="true" /> Duplicate
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onSelect={onRemove}>
            <Icon name="Trash2" aria-hidden="true" /> Remove
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </section>
  );
}

function CanvasWorkspace({
  snapshot,
  connection,
  actions,
  renderObjects,
  fixture = false,
  initialPrompt,
  composerDraftKey,
  error,
  onRenderProbe,
  onRevealComplete,
}: {
  snapshot: CanvasSnapshotDto;
  connection: ConnectionState;
  actions: WorkspaceActions;
  renderObjects: SceneRenderObject[];
  fixture?: boolean;
  initialPrompt?: string;
  composerDraftKey?: string;
  error: string | null;
  onRenderProbe?: (event: SceneRenderProbeEvent) => void;
  onRevealComplete?: (objectId: string) => void;
}) {
  const readOnly = connection !== "connected";
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(
    snapshot.objects.find((object) => object.removedAt === null)?.id ?? null,
  );
  const [rendererReset, setRendererReset] = useState(0);
  const [rendererLost, setRendererLost] = useState(false);
  const [announcement, setAnnouncement] = useState("Canvas restored.");
  const [busy, setBusy] = useState(false);
  const [composerError, setComposerError] = useState<string | null>(null);
  const objectActionRefs = useRef(new Map<string, HTMLButtonElement>());
  const hasLiveStatus = snapshot.cards.some(
    (card) => card.state === "interpreting" || card.state === "realizing",
  );
  const now = useClock(hasLiveStatus);
  const inFlightCount = snapshot.cards.filter((card) =>
    ACTIVE_CARD_STATES.has(card.state),
  ).length;
  const isGenerating = inFlightCount > 0 || busy;

  useEffect(() => {
    if (
      selectedObjectId &&
      !snapshot.objects.some(
        (object) => object.id === selectedObjectId && object.removedAt === null,
      )
    ) {
      setSelectedObjectId(null);
    }
  }, [selectedObjectId, snapshot.objects]);

  const selectFromRenderer = (objectId: string | null) => {
    setSelectedObjectId(objectId);
    if (!objectId) return;
    const object = snapshot.objects.find((entry) => entry.id === objectId);
    const card = object
      ? snapshot.cards.find((entry) => entry.id === object.sourceCardId)
      : null;
    setAnnouncement(`${card?.prompt ?? "Object"} selected.`);
  };

  const selectedObject = selectedObjectId
    ? (snapshot.objects.find(
        (object) => object.id === selectedObjectId && object.removedAt === null,
      ) ?? null)
    : null;
  const selectedCard = selectedObject
    ? (snapshot.cards.find((card) => card.id === selectedObject.sourceCardId) ??
      null)
    : null;

  const runAction = async (message: string, action: () => Promise<void>) => {
    if (readOnly || busy) return;
    setBusy(true);
    try {
      await action();
      setAnnouncement(message);
    } catch {
      setAnnouncement("Action failed. The canvas was reconciled.");
    } finally {
      setBusy(false);
    }
  };

  const submitPrompt = async (request: NewThreadRequest) => {
    setComposerError(null);
    try {
      const prompt = promptFromComposerRequest(request);
      if (connection !== "connected") {
        throw new Error("Reconnect before sending this idea to the scene.");
      }
      if (inFlightCount > 0) {
        throw new Error("Wait for the current scene to finish generating.");
      }
      setBusy(true);
      await actions.submit(prompt, { x: 0, y: 0 });
      setAnnouncement(`${prompt} was sent to the canvas interpreter.`);
    } catch (reason) {
      const message = errorMessage(reason);
      setComposerError(message);
      setAnnouncement(`Send failed. ${message}`);
      throw reason;
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="sceneseed-editor" data-fixture={fixture || undefined}>
      {connection !== "connected" ? (
        <div className="sceneseed-offline-banner" role="status">
          Reconnecting — keep composing if you like. Sending and scene edits are
          paused.
        </div>
      ) : null}
      {error ? (
        <div className="sceneseed-editor-error" role="alert">
          {error}
        </div>
      ) : null}

      <section className="sceneseed-workspace" aria-label="Scene canvas">
        <div className="sceneseed-stage" aria-busy={isGenerating}>
          <RendererBoundary
            resetKey={rendererReset}
            fallback={
              <RendererUnavailable
                onReload={() => {
                  setRendererLost(false);
                  setRendererReset((value) => value + 1);
                }}
              />
            }
          >
            {rendererLost ? (
              <RendererUnavailable
                onReload={() => {
                  setRendererLost(false);
                  setRendererReset((value) => value + 1);
                }}
              />
            ) : (
              <SceneRenderer
                key={rendererReset}
                className="sceneseed-webgl"
                objects={renderObjects}
                selectedObjectId={selectedObjectId}
                enableOrbitControls={!isGenerating}
                onSelectObject={selectFromRenderer}
                onRenderProbe={onRenderProbe}
                onRevealComplete={(objectId) => {
                  setAnnouncement("Interpretation complete.");
                  onRevealComplete?.(objectId);
                }}
                onContextLost={() => setRendererLost(true)}
                onContextRestored={() => setRendererLost(false)}
                fallback={
                  <RendererUnavailable
                    onReload={() => setRendererReset((value) => value + 1)}
                  />
                }
              />
            )}
          </RendererBoundary>
          {snapshot.objects
            .filter(
              (object) =>
                object.activeSceneId === null && object.removedAt === null,
            )
            .map((object) => {
              const card = snapshot.cards.find(
                (entry) => entry.id === object.sourceCardId,
              );
              if (!card?.placement) return null;
              return (
                <div
                  key={object.id}
                  className="sceneseed-stage-seed"
                  data-state={card.state}
                  style={{
                    left: `${((card.placement.x + 8) / 16) * 100}%`,
                    top: `${((6 - card.placement.y) / 12) * 100}%`,
                  }}
                  aria-label={`${cardStateLabel(card)} seed for ${card.prompt}`}
                >
                  <span aria-hidden="true" />
                  <small>{cardStateLabel(card)}</small>
                </div>
              );
            })}
          {renderObjects.length === 0 &&
          !isGenerating &&
          snapshot.objects.every(
            (object) =>
              object.activeSceneId === null || object.removedAt !== null,
          ) ? (
            <div className="sceneseed-stage-empty">
              <strong>Enter a prompt and send it.</strong>
            </div>
          ) : null}
          {isGenerating ? (
            <div
              className="sceneseed-stage-shimmer"
              data-testid="sceneseed-canvas-shimmer"
              role="status"
              aria-label="Generating scene"
            />
          ) : null}
          <div className="sceneseed-stage-status">
            <CanvasActivity
              snapshot={snapshot}
              now={now}
              readOnly={readOnly || busy}
              onCancel={(jobId) =>
                void runAction(
                  "Generation cancelled. The prompt is ready to retry.",
                  () => actions.cancel(jobId),
                )
              }
              onRetry={(card) =>
                void runAction(`${card.prompt} was sent again.`, () =>
                  actions.retry(card),
                )
              }
            />
          </div>

          <div className="sceneseed-compose-stack">
            {selectedObject && selectedCard && !isGenerating ? (
              <ObjectControls
                object={selectedObject}
                card={selectedCard}
                readOnly={readOnly}
                actionRef={(element) => {
                  if (element)
                    objectActionRefs.current.set(selectedObject.id, element);
                  else objectActionRefs.current.delete(selectedObject.id);
                }}
                onTransform={(transform) =>
                  void runAction("Object moved.", () =>
                    actions.transform(selectedObject, transform),
                  )
                }
                onRemix={() =>
                  void runAction("Scene regeneration started.", () =>
                    actions.remix(selectedObject.id),
                  )
                }
                onDuplicate={() =>
                  void runAction("Object duplicated.", () =>
                    actions.duplicate(selectedObject),
                  )
                }
                onRemove={() =>
                  void runAction("Object removed from the scene.", () =>
                    actions.remove(selectedObject),
                  )
                }
              />
            ) : null}
            {composerError ? (
              <div className="sceneseed-composer-error" role="alert">
                <Icon name="AlertCircle" aria-hidden="true" />
                <span>{composerError}</span>
                <button type="button" onClick={() => setComposerError(null)}>
                  Dismiss
                </button>
              </div>
            ) : null}
            <div className="sceneseed-composer-shell">
              <NewThreadComposer
                layout="document"
                className="sceneseed-composer"
                draftKey={
                  composerDraftKey ?? `sceneseed-canvas-${snapshot.canvas.id}`
                }
                initialPrompt={initialPrompt}
                placeholder="Enter a prompt…"
                onSubmit={submitPrompt}
              />
            </div>
          </div>
        </div>
      </section>
      <div className="sceneseed-sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>
    </main>
  );
}

function LoadingCanvas() {
  return (
    <main className="sceneseed-editor" aria-label="Restoring canvas">
      <div className="sceneseed-workspace sceneseed-loading-stage">
        <Skeleton className="sceneseed-stage" />
        <Skeleton className="sceneseed-loading-composer" />
      </div>
    </main>
  );
}

function CanvasEditor({ canvasId }: { canvasId: string }) {
  const rpc = useRpc<typeof rpcContract>();
  const connection = useRealtimeConnectionState();
  const [snapshot, setSnapshot] = useState<CanvasSnapshotDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [revealing, setRevealing] = useState<Set<string>>(() => new Set());
  const latestSnapshot = useRef<CanvasSnapshotDto | null>(null);
  const realizationStarts = useRef(new Set<string>());
  const realizationAttempts = useRef(new Map<string, string>());
  const acknowledgementInFlight = useRef(new Set<string>());
  const realizationRetryTimers = useRef(new Map<string, number>());
  const [realizationRetryNonce, setRealizationRetryNonce] = useState(0);
  const hasConnected = useRef(false);

  const applySnapshot = useCallback((next: CanvasSnapshotDto) => {
    latestSnapshot.current = next;
    setSnapshot(next);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const result = await rpc.call("getCanvas", { canvasId });
      if (result.snapshot === null) {
        setError("This canvas no longer exists.");
        setSnapshot(null);
        return;
      }
      applySnapshot(result.snapshot);
      setError(null);
    } catch (reason) {
      setError(errorMessage(reason));
    }
  }, [applySnapshot, canvasId, rpc]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(
    () => () => {
      for (const timer of realizationRetryTimers.current.values()) {
        window.clearTimeout(timer);
      }
      realizationRetryTimers.current.clear();
    },
    [],
  );

  useRealtime(
    "canvas-changed",
    useCallback(
      (payload: unknown) => {
        if (!isCanvasSignal(payload) || payload.canvasId === canvasId)
          void refresh();
      },
      [canvasId, refresh],
    ),
  );

  useEffect(() => {
    if (connection !== "connected") return;
    if (hasConnected.current) void refresh();
    hasConnected.current = true;
  }, [connection, refresh]);

  useEffect(() => {
    if (!snapshot || connection !== "connected") return;
    const candidate = snapshot.candidates.find((entry) => {
      if (entry.state !== "pending" || entry.normalizedScene === null)
        return false;
      const job = snapshot.jobs.find((item) => item.id === entry.jobId);
      return (
        (job?.state === "candidate_ready" || job?.state === "realizing") &&
        !realizationStarts.current.has(entry.id) &&
        !realizationAttempts.current.has(entry.id) &&
        !realizationRetryTimers.current.has(entry.id)
      );
    });
    if (!candidate) return;
    const job = snapshot.jobs.find((entry) => entry.id === candidate.jobId);
    if (!job) return;
    const attemptId = nextClientId("realization");
    realizationStarts.current.add(candidate.id);
    void rpc
      .call("beginRealization", {
        candidateId: candidate.id,
        attemptId,
        jobId: job.id,
        generation: job.generation,
        expectedCanvasRevision: snapshot.canvas.revision,
      })
      .then(
        (result) => {
          realizationStarts.current.delete(candidate.id);
          applySnapshot(result.snapshot);
          realizationAttempts.current.set(candidate.id, attemptId);
          setError(null);
        },
        (reason: unknown) => {
          realizationStarts.current.delete(candidate.id);
          const message = errorMessage(reason);
          if (message.includes("already realizing")) {
            setError(
              "Another client is realizing this interpretation. SceneSeed will retry if its lease expires.",
            );
            const existingTimer = realizationRetryTimers.current.get(
              candidate.id,
            );
            if (existingTimer !== undefined) window.clearTimeout(existingTimer);
            const timer = window.setTimeout(() => {
              realizationRetryTimers.current.delete(candidate.id);
              setRealizationRetryNonce((value) => value + 1);
            }, 30_500);
            realizationRetryTimers.current.set(candidate.id, timer);
            return;
          }
          setError(message);
          void refresh();
        },
      );
  }, [
    applySnapshot,
    connection,
    realizationRetryNonce,
    refresh,
    rpc,
    snapshot,
  ]);

  const onRenderProbe = useCallback(
    (event: SceneRenderProbeEvent) => {
      const current = latestSnapshot.current;
      if (!current) return;
      const candidate = current.candidates.find(
        (entry) => entry.jobId === event.jobId && entry.state === "pending",
      );
      if (!candidate) return;
      const attemptId = realizationAttempts.current.get(candidate.id);
      const job = current.jobs.find((entry) => entry.id === candidate.jobId);
      if (
        !attemptId ||
        !job ||
        acknowledgementInFlight.current.has(candidate.id)
      )
        return;
      acknowledgementInFlight.current.add(candidate.id);
      void rpc
        .call("acknowledgeRealization", {
          candidateId: candidate.id,
          attemptId,
          jobId: job.id,
          generation: job.generation,
          expectedCanvasRevision: current.canvas.revision,
          outcome: event.status === "ready" ? "success" : "failure",
          ...(event.status === "failed"
            ? { errorMessage: event.diagnostic.slice(0, 1_000) }
            : {}),
        })
        .then(
          (result) => {
            realizationAttempts.current.delete(candidate.id);
            acknowledgementInFlight.current.delete(candidate.id);
            const retryTimer = realizationRetryTimers.current.get(candidate.id);
            if (retryTimer !== undefined) {
              window.clearTimeout(retryTimer);
              realizationRetryTimers.current.delete(candidate.id);
            }
            if (result.outcome === "complete") {
              setRevealing((ids) => new Set(ids).add(candidate.objectId));
            }
            applySnapshot(result.snapshot);
            setError(null);
          },
          (reason: unknown) => {
            realizationAttempts.current.delete(candidate.id);
            acknowledgementInFlight.current.delete(candidate.id);
            setError(errorMessage(reason));
            void refresh();
          },
        );
    },
    [applySnapshot, refresh, rpc],
  );

  const mutate = useCallback(
    async <Result extends { snapshot: CanvasSnapshotDto }>(
      promise: Promise<Result>,
    ) => {
      setError(null);
      try {
        const result = await promise;
        applySnapshot(result.snapshot);
      } catch (reason) {
        setError(errorMessage(reason));
        await refresh();
        throw reason;
      }
    },
    [applySnapshot, refresh],
  );

  if (snapshot === null) {
    return error ? (
      <main className="sceneseed-missing">
        <div className="sceneseed-seed-mark" aria-hidden="true" />
        <h1>Canvas unavailable</h1>
        <p>{error}</p>
        <Button type="button" variant="outline" onClick={() => void refresh()}>
          Retry
        </Button>
      </main>
    ) : (
      <LoadingCanvas />
    );
  }

  const actions: WorkspaceActions = {
    submit: async (prompt, placement) => {
      let current = latestSnapshot.current!;
      for (const object of current.objects.filter(
        (entry) => entry.removedAt === null,
      )) {
        const removed = await rpc.call("removeObject", {
          canvasId,
          objectId: object.id,
          expectedCanvasRevision: current.canvas.revision,
        });
        applySnapshot(removed.snapshot);
        current = removed.snapshot;
      }
      const created = await rpc.call("createCard", {
        canvasId,
        prompt,
        expectedRevision: current.canvas.revision,
      });
      applySnapshot(created.snapshot);
      current = created.snapshot;
      await mutate(
        rpc.call("placeCard", {
          canvasId,
          cardId: created.cardId,
          placement,
          expectedRevision: current.canvas.revision,
        }),
      );
    },
    retry: async (card) => {
      const current = latestSnapshot.current!;
      await mutate(
        rpc.call("placeCard", {
          canvasId,
          cardId: card.id,
          placement: card.placement ?? automaticPlacement(current),
          expectedRevision: current.canvas.revision,
        }),
      );
    },
    cancel: async (jobId) => mutate(rpc.call("cancelJob", { jobId })),
    transform: async (object, transform) =>
      mutate(
        rpc.call("updateObjectTransform", {
          canvasId,
          objectId: object.id,
          transform,
          expectedCanvasRevision: latestSnapshot.current!.canvas.revision,
        }),
      ),
    remix: async (objectId) =>
      mutate(
        rpc.call("remixObject", {
          canvasId,
          objectId,
          expectedRevision: latestSnapshot.current!.canvas.revision,
        }),
      ),
    duplicate: async (object) =>
      mutate(
        rpc.call("duplicateObject", {
          canvasId,
          sourceObjectId: object.id,
          expectedCanvasRevision: latestSnapshot.current!.canvas.revision,
          transform: {
            ...object.transform,
            position: [
              object.transform.position[0] + 1,
              object.transform.position[1],
              object.transform.position[2] + 1,
            ],
          },
        }),
      ),
    remove: async (object) =>
      mutate(
        rpc.call("removeObject", {
          canvasId,
          objectId: object.id,
          expectedCanvasRevision: latestSnapshot.current!.canvas.revision,
        }),
      ),
  };

  return (
    <CanvasWorkspace
      snapshot={snapshot}
      connection={connection}
      actions={actions}
      renderObjects={buildRenderObjects(
        snapshot,
        revealing,
        realizationAttempts.current,
      )}
      error={error}
      onRenderProbe={onRenderProbe}
      onRevealComplete={(objectId) =>
        setRevealing((current) => {
          const next = new Set(current);
          next.delete(objectId);
          return next;
        })
      }
    />
  );
}

type SceneSeedFixtureState =
  | "empty"
  | "composing"
  | "processing"
  | "success"
  | "error";

function fixtureSnapshot(state: SceneSeedFixtureState): CanvasSnapshotDto {
  const snapshot = createSceneSeedUiFixture();
  if (state === "empty" || state === "composing") {
    return {
      ...snapshot,
      cards: [],
      objects: [],
      jobs: [],
      candidates: [],
    };
  }
  const wantedCardId =
    state === "success"
      ? "card_lighthouse"
      : state === "processing"
        ? "card_queue"
        : "card_failed";
  const cards = snapshot.cards.filter((card) => card.id === wantedCardId);
  const cardIds = new Set(cards.map((card) => card.id));
  const objects = snapshot.objects.filter((object) =>
    cardIds.has(object.sourceCardId),
  );
  const objectIds = new Set(objects.map((object) => object.id));
  return {
    ...snapshot,
    cards,
    objects,
    jobs: snapshot.jobs.filter((job) => objectIds.has(job.objectId)),
    candidates: snapshot.candidates.filter((candidate) =>
      objectIds.has(candidate.objectId),
    ),
  };
}

function FixtureCanvasEditor({
  state = "empty",
}: {
  state?: SceneSeedFixtureState;
}) {
  const connection = useRealtimeConnectionState();
  const [snapshot, setSnapshot] = useState(() => fixtureSnapshot(state));
  const [revealing, setRevealing] = useState<Set<string>>(() => new Set());
  const replacementCount = useRef(0);
  const completionTimers = useRef<number[]>([]);
  useEffect(
    () => () => {
      for (const timer of completionTimers.current) window.clearTimeout(timer);
    },
    [],
  );
  const update = (
    change: (current: CanvasSnapshotDto) => CanvasSnapshotDto,
  ) => {
    setSnapshot((current) => {
      const next = change(current);
      return {
        ...next,
        canvas: {
          ...next.canvas,
          revision: next.canvas.revision + 1,
          updatedAt: Date.now(),
        },
      };
    });
  };
  const actions: WorkspaceActions = {
    submit: async (prompt, placement) => {
      const cardId = nextClientId("fixture_card");
      const jobId = nextClientId("fixture_job");
      const objectId = nextClientId("fixture_object");
      const sceneId = nextClientId("fixture_scene");
      const timestamp = Date.now();
      const variant = replacementCount.current++ % 2;
      const templateSnapshot = createSceneSeedUiFixture();
      const template = templateSnapshot.candidates[variant]?.normalizedScene;
      if (!template) throw new Error("Fixture scene is unavailable.");
      const scene = {
        ...template,
        jobId,
        objectId,
        name: variant === 0 ? "Storm in glass" : "Lighthouse at midnight",
        altText:
          variant === 0
            ? "A grayscale storm cloud suspended inside a clear glass jar."
            : "A black-and-white lighthouse with a bright lantern and pointed roof.",
        palette: ["#111111", "#f4f4f4", "#777777"],
      };
      update((current) => ({
        ...current,
        cards: [
          {
            id: cardId,
            canvasId: current.canvas.id,
            prompt,
            state: "queued",
            order: 0,
            placement,
            activeJobId: jobId,
            createdAt: timestamp,
            updatedAt: timestamp,
          },
        ],
        objects: [
          {
            id: objectId,
            canvasId: current.canvas.id,
            sourceCardId: cardId,
            activeSceneId: null,
            activeJobId: jobId,
            transform: {
              position: [placement.x, 0, -placement.y],
              rotation: [0, 0, 0],
              scale: [1, 1, 1],
            },
            order: 0,
            removedAt: null,
            createdAt: timestamp,
            updatedAt: timestamp,
          },
        ],
        jobs: [
          {
            id: jobId,
            canvasId: current.canvas.id,
            cardId,
            objectId,
            generation: 1,
            state: "queued",
            agentThreadId: current.canvas.agentThreadId ?? "thr_fixture",
            invalidSubmissionAttempts: 0,
            errorCode: null,
            errorMessage: null,
            startedAt: null,
            finishedAt: null,
            threadSettledAt: null,
            createdAt: timestamp,
            updatedAt: timestamp,
          },
        ],
        candidates: [],
      }));
      const timer = window.setTimeout(() => {
        const completedAt = Date.now();
        update((current) => {
          if (current.objects[0]?.id !== objectId) return current;
          return {
            ...current,
            cards: current.cards.map((card) => ({
              ...card,
              state: "complete",
              updatedAt: completedAt,
            })),
            objects: current.objects.map((object) => ({
              ...object,
              activeSceneId: sceneId,
              updatedAt: completedAt,
            })),
            jobs: current.jobs.map((job) => ({
              ...job,
              state: "complete",
              startedAt: timestamp,
              finishedAt: completedAt,
              threadSettledAt: completedAt,
              updatedAt: completedAt,
            })),
            candidates: [
              {
                id: sceneId,
                canvasId: current.canvas.id,
                jobId,
                objectId,
                generation: 1,
                originalScene: scene,
                normalizedScene: scene,
                sceneVersion: 1,
                cost: 4,
                state: "active",
                realizationAttempts: 1,
                realizedAt: completedAt,
                readError: null,
                createdAt: timestamp,
                updatedAt: completedAt,
              },
            ],
          };
        });
        setRevealing(new Set([objectId]));
      }, 1_600);
      completionTimers.current.push(timer);
    },
    retry: async (wanted) =>
      update((current) => ({
        ...current,
        cards: current.cards.map((card) =>
          card.id === wanted.id ? { ...card, state: "queued" } : card,
        ),
        jobs: current.jobs.map((job) =>
          job.id === wanted.activeJobId
            ? { ...job, state: "queued", errorCode: null, errorMessage: null }
            : job,
        ),
      })),
    cancel: async (jobId) =>
      update((current) => ({
        ...current,
        cards: current.cards.map((card) =>
          card.activeJobId === jobId ? { ...card, state: "ready" } : card,
        ),
      })),
    transform: async (object, transform) =>
      update((current) => ({
        ...current,
        objects: current.objects.map((entry) =>
          entry.id === object.id ? { ...entry, transform } : entry,
        ),
      })),
    remix: async (objectId) => setRevealing(new Set([objectId])),
    duplicate: async (object) =>
      update((current) => {
        const sourceCard = current.cards.find(
          (card) => card.id === object.sourceCardId,
        );
        const sourceCandidate = current.candidates.find(
          (candidate) => candidate.id === object.activeSceneId,
        );
        if (!sourceCard || !sourceCandidate?.normalizedScene) return current;
        const id = nextClientId("fixture_object");
        const cardId = nextClientId("fixture_card");
        const jobId = nextClientId("fixture_job");
        const sceneId = nextClientId("fixture_scene");
        const scene = {
          ...sourceCandidate.normalizedScene,
          objectId: id,
          jobId,
        };
        return {
          ...current,
          cards: [
            ...current.cards,
            {
              ...sourceCard,
              id: cardId,
              order: current.cards.length,
              activeJobId: jobId,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            },
          ],
          objects: [
            ...current.objects,
            {
              ...object,
              id,
              sourceCardId: cardId,
              activeSceneId: sceneId,
              activeJobId: jobId,
              order: current.objects.length,
              transform: {
                ...object.transform,
                position: [
                  object.transform.position[0] + 1,
                  object.transform.position[1],
                  object.transform.position[2] + 1,
                ],
              },
              createdAt: Date.now(),
              updatedAt: Date.now(),
            },
          ],
          candidates: [
            ...current.candidates,
            {
              ...sourceCandidate,
              id: sceneId,
              jobId,
              objectId: id,
              originalScene: scene,
              normalizedScene: scene,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            },
          ],
        };
      }),
    remove: async (object) =>
      update((current) => ({
        ...current,
        objects: current.objects.map((entry) =>
          entry.id === object.id ? { ...entry, removedAt: Date.now() } : entry,
        ),
      })),
  };
  return (
    <CanvasWorkspace
      snapshot={snapshot}
      connection={connection}
      actions={actions}
      renderObjects={buildRenderObjects(snapshot, revealing)}
      fixture
      initialPrompt={
        state === "composing" ? "a folded paper moon" : undefined
      }
      composerDraftKey={`sceneseed-qa-v2-${state}`}
      error={null}
      onRevealComplete={(objectId) =>
        setRevealing((current) => {
          const next = new Set(current);
          next.delete(objectId);
          return next;
        })
      }
    />
  );
}

function SceneSeedPanel({ subPath }: PluginNavPanelProps) {
  if (subPath === "" || subPath === "library") return <ImplicitCanvas />;
  if (subPath === SCENESEED_QA_SUBPATH) return <FixtureCanvasEditor />;
  if (subPath.startsWith(`${SCENESEED_QA_SUBPATH}/`)) {
    const state = subPath.slice(SCENESEED_QA_SUBPATH.length + 1);
    if (
      state === "empty" ||
      state === "composing" ||
      state === "processing" ||
      state === "success" ||
      state === "error"
    ) {
      return <FixtureCanvasEditor key={state} state={state} />;
    }
  }
  const canvasId = parseCanvasId(subPath);
  if (canvasId) return <CanvasEditor canvasId={canvasId} />;
  return (
    <main className="sceneseed-missing">
      <div className="sceneseed-seed-mark" aria-hidden="true" />
      <h1>SceneSeed could not open this path.</h1>
      <p>Open the persistent canvas instead.</p>
      <BackToLibrary />
    </main>
  );
}

function BackToLibrary() {
  const navigate = useBbNavigate();
  return (
    <Button
      type="button"
      variant="outline"
      onClick={() => navigate.toPluginPanel(PANEL_PATH)}
    >
      Open SceneSeed
    </Button>
  );
}

function SceneSeedSettings(_props: PluginSettingsSectionProps) {
  const rpc = useRpc<typeof rpcContract>();
  const connection = useRealtimeConnectionState();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const clearAll = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const result = await rpc.call("clearAllCanvasData");
      setMessage(
        result.failedThreadIds.length === 0
          ? `Deleted ${result.deletedCanvasCount} ${result.deletedCanvasCount === 1 ? "canvas" : "canvases"} and archived their hidden threads.`
          : `Deleted ${result.deletedCanvasCount} canvases. ${result.failedThreadIds.length} hidden threads could not be archived; check plugin logs.`,
      );
      setConfirming(false);
    } catch (reason) {
      setMessage(errorMessage(reason));
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="sceneseed-settings">
      <h3>Stored SceneSeed data</h3>
      <p>
        SceneSeed stores prompts, scene graphs, transforms, and job state in its
        plugin database. Hidden interpreter transcripts follow bb’s thread
        retention behavior.
      </p>
      <p>
        Disabling or uninstalling SceneSeed does not delete that database or its
        hidden threads.
      </p>
      {confirming ? (
        <div
          className="sceneseed-clear-confirmation"
          role="group"
          aria-label="Confirm deleting all SceneSeed canvas data"
        >
          <strong>Delete SceneSeed data?</strong>
          <p>
            This clears the persistent canvas and archives its interpreter
            thread. Legacy canvas data is cleared too. This cannot be undone.
          </p>
          <div>
            <Button
              type="button"
              variant="destructive"
              disabled={busy || connection !== "connected"}
              onClick={() => void clearAll()}
            >
              {busy ? "Deleting…" : "Delete SceneSeed data"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => setConfirming(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          variant="destructive"
          disabled={connection !== "connected"}
          onClick={() => setConfirming(true)}
        >
          Delete SceneSeed data…
        </Button>
      )}
      {connection !== "connected" ? (
        <p role="status">Reconnect to delete stored data.</p>
      ) : null}
      {message ? (
        <p className="sceneseed-settings-result" role="status">
          {message}
        </p>
      ) : null}
    </section>
  );
}

export default definePluginApp((app) => {
  app.slots.navPanel({
    id: "sceneseed",
    title: "SceneSeed",
    icon: "Layers",
    path: PANEL_PATH,
    component: SceneSeedPanel,
  });
  app.slots.settingsSection({
    id: "storage",
    title: "SceneSeed data",
    description: "Understand retention and permanently clear SceneSeed data.",
    component: SceneSeedSettings,
  });
});
