import { randomUUID } from "node:crypto";
import type { BbPluginApi } from "@get-bb/plugin-sdk";
import { z } from "zod";
import {
  safeNormalizeSceneObject,
  type SceneContractIssue,
  type SceneObject,
} from "../scene-contract.js";
import {
  safeCompileSceneCode,
  sceneCodeSourceSchema,
} from "../scene-code.js";
import { safeCompileSceneSeedKitProgram } from "../scene-kit.js";
import {
  SceneSeedStoreError,
  type CanvasSnapshotDto,
  type JobDto,
  type NonterminalJobState,
  type Placement,
  type Transform3D,
  createSceneSeedStore,
} from "../store.js";

export type SceneSeedStore = ReturnType<typeof createSceneSeedStore>;

// Keep accepting the older declarative and raw-scene envelopes at execution so
// in-flight and persisted version-1 interpreters remain compatible. New
// sessions only see the agent-authored Three.js source contract below.
const submitEnvelopeSchema = z
  .object({
    source: z.unknown().optional(),
    program: z.unknown().optional(),
    scene: z.unknown().optional(),
  })
  .strict()
  .superRefine((value, context) => {
    const supplied = [value.source, value.program, value.scene].filter(
      (entry) => entry !== undefined,
    ).length;
    if (supplied !== 1) {
      context.addIssue({
        code: "custom",
        path: [],
        message: "supply exactly one of source, program, or scene",
      });
    }
  });

function lowerHomogeneousTuplesForToolSchema(
  schema: Record<string, unknown>,
): Record<string, unknown> {
  const normalized = JSON.parse(JSON.stringify(schema)) as Record<
    string,
    unknown
  >;
  const visit = (value: unknown): void => {
    if (Array.isArray(value)) {
      for (const child of value) visit(child);
      return;
    }
    if (value === null || typeof value !== "object") return;
    const object = value as Record<string, unknown>;
    if (Array.isArray(object.items)) {
      const [first, ...rest] = object.items;
      const serializedFirst = JSON.stringify(first);
      if (rest.some((item) => JSON.stringify(item) !== serializedFirst)) {
        throw new Error(
          "SceneSeed tool schema contains a heterogeneous tuple that cannot be lowered safely",
        );
      }
      object.items = first ?? {};
    }
    for (const child of Object.values(object)) visit(child);
  };
  visit(normalized);
  return normalized;
}

export const submitSceneObjectParameters = lowerHomogeneousTuplesForToolSchema(
  z.toJSONSchema(
    z
      .object({
        source: sceneCodeSourceSchema,
      })
      .strict(),
    { io: "input", target: "draft-7" },
  ) as Record<string, unknown>,
);

const SETTLED_JOB_STATES = new Set(["complete", "failed", "superseded"]);
const GENERATION_STREAM_EVENT_TYPES = [
  "item/agentMessage/delta",
  "item/completed",
] as const;
const MAX_GENERATION_STREAM_LINE_LENGTH = 120;
const FAST_GENERATION_MODELS: Readonly<Record<string, readonly string[]>> = {
  codex: [
    "gpt-5.6-luna",
    "gpt-5.4-mini",
    "gpt-5.3-codex-spark",
  ],
};

interface GenerationExecutionOptions {
  model?: string;
  reasoningLevel?:
    | "none"
    | "low"
    | "medium"
    | "high"
    | "xhigh"
    | "max"
    | "ultra"
    | "ultracode";
  serviceTier?: "default" | "fast";
}

interface SpawnGenerationExecutionOptions extends GenerationExecutionOptions {
  providerId?: string;
}

interface AgentStreamItemState {
  buffer: string;
  emittedLineCount: number;
}

function isNonterminalJobState(
  state: JobDto["state"],
): state is NonterminalJobState {
  return (
    state === "queued" ||
    state === "interpreting" ||
    state === "candidate_ready" ||
    state === "realizing"
  );
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function createRuntimeId(prefix: string): string {
  return `${prefix}_${randomUUID().replaceAll("-", "")}`;
}

function boundedIssues(issues: readonly SceneContractIssue[]): string {
  return issues
    .slice(0, 8)
    .map((issue) => `${issue.path || "scene"}: ${issue.message}`)
    .join("\n")
    .slice(0, 1_000);
}

function envelopeIssues(error: z.ZodError): SceneContractIssue[] {
  return error.issues.map((issue) => ({
    code: issue.code,
    path: issue.path.join("."),
    message: issue.message,
  }));
}

function abortWait(signal: AbortSignal): Promise<void> {
  if (signal.aborted) return Promise.resolve();
  return new Promise((resolve) =>
    signal.addEventListener("abort", () => resolve(), { once: true }),
  );
}

export interface SceneSeedCleanupResult {
  archived: boolean;
  stopped: boolean;
}

export class SceneSeedRuntime {
  private readonly locks = new Map<string, Promise<void>>();
  private readonly initialJobReadiness = new Map<string, Promise<void>>();
  private readonly agentStreamCursorByThread = new Map<string, number>();
  private readonly agentStreamItemsByThread = new Map<
    string,
    Map<string, AgentStreamItemState>
  >();
  private readonly agentStreamReadsByThread = new Map<string, Promise<void>>();
  private readonly generationPreludeJobByThread = new Map<string, string>();
  private readonly generationExecutionByProvider = new Map<
    string,
    GenerationExecutionOptions
  >();

  constructor(
    private readonly bb: BbPluginApi,
    readonly store: SceneSeedStore,
  ) {}

  private async withCanvasLock<T>(
    canvasId: string,
    operation: () => Promise<T> | T,
  ): Promise<T> {
    const previous = this.locks.get(canvasId) ?? Promise.resolve();
    let release!: () => void;
    const barrier = new Promise<void>((resolve) => {
      release = resolve;
    });
    const tail = previous.catch(() => undefined).then(() => barrier);
    this.locks.set(canvasId, tail);
    await previous.catch(() => undefined);
    try {
      return await operation();
    } finally {
      release();
      if (this.locks.get(canvasId) === tail) this.locks.delete(canvasId);
    }
  }

  private requiredSnapshot(canvasId: string): CanvasSnapshotDto {
    const snapshot = this.store.getCanvasSnapshot(canvasId);
    if (snapshot === null) {
      throw new SceneSeedStoreError(
        "not_found",
        `canvas ${canvasId} was not found`,
      );
    }
    return snapshot;
  }

  private assertRevision(canvasId: string, expectedRevision: number): void {
    const canvas = this.store.getCanvas(canvasId);
    if (canvas === null) {
      throw new SceneSeedStoreError(
        "not_found",
        `canvas ${canvasId} was not found`,
      );
    }
    if (canvas.revision !== expectedRevision) {
      throw new SceneSeedStoreError(
        "revision_conflict",
        `canvas revision is ${canvas.revision}; expected ${expectedRevision}`,
      );
    }
  }

  private assertCardOnCanvas(canvasId: string, cardId: string): void {
    if (
      !this.requiredSnapshot(canvasId).cards.some((card) => card.id === cardId)
    ) {
      throw new SceneSeedStoreError(
        "not_found",
        `card ${cardId} was not found on canvas ${canvasId}`,
      );
    }
  }

  private assertObjectOnCanvas(canvasId: string, objectId: string): void {
    if (
      !this.requiredSnapshot(canvasId).objects.some(
        (object) => object.id === objectId,
      )
    ) {
      throw new SceneSeedStoreError(
        "not_found",
        `object ${objectId} was not found on canvas ${canvasId}`,
      );
    }
  }

  private publishCanvas(
    canvasId: string,
    revision: number,
    jobId?: string,
  ): void {
    this.bb.realtime.publish("canvas-changed", {
      canvasId,
      revision,
      ...(jobId === undefined ? {} : { jobId }),
    });
  }

  private publishLibrary(canvasId: string): void {
    this.bb.realtime.publish("library-changed", { canvasId });
  }

  private publishGenerationStreamLine(input: {
    canvasId: string;
    jobId: string;
    itemId: string;
    eventSeq: number;
    lineIndex: number;
    text: string;
  }): void {
    const text = input.text.replace(/\s+/gu, " ").trim();
    if (text.length === 0) return;
    this.bb.realtime.publish("generation-stream", {
      kind: "line",
      canvasId: input.canvasId,
      jobId: input.jobId,
      lineId: `${input.itemId}:${input.eventSeq}:${input.lineIndex}`,
      text: text.slice(0, MAX_GENERATION_STREAM_LINE_LENGTH),
    });
  }

  private clearGenerationStream(threadId: string): void {
    this.agentStreamItemsByThread.delete(threadId);
    const canvas = this.store.getCanvasByAgentThreadId(threadId);
    if (canvas === null) return;
    this.bb.realtime.publish("generation-stream", {
      kind: "clear",
      canvasId: canvas.id,
    });
  }

  private queueAgentStreamRead(threadId: string): void {
    const previous =
      this.agentStreamReadsByThread.get(threadId) ?? Promise.resolve();
    const next = previous
      .catch(() => undefined)
      .then(() => this.readAgentStream(threadId))
      .catch((error) => {
        this.bb.log.warn(
          `Could not read SceneSeed agent stream for ${threadId}: ${errorMessage(error)}`,
        );
      })
      .finally(() => {
        if (this.agentStreamReadsByThread.get(threadId) === next) {
          this.agentStreamReadsByThread.delete(threadId);
        }
      });
    this.agentStreamReadsByThread.set(threadId, next);
  }

  private async readAgentStream(threadId: string): Promise<void> {
    const canvas = this.store.getCanvasByAgentThreadId(threadId);
    const job = this.store.getCurrentJobByAgentThreadId(threadId);
    if (
      canvas === null ||
      job === null ||
      job.state !== "interpreting" ||
      job.startedAt === null
    ) {
      this.agentStreamItemsByThread.delete(threadId);
      return;
    }

    const afterSeq = this.agentStreamCursorByThread.get(threadId);
    const events = await this.bb.sdk.threads.events.list({
      threadId,
      ...(afterSeq === undefined ? {} : { afterSeq: String(afterSeq) }),
      types: GENERATION_STREAM_EVENT_TYPES,
      order: "asc",
      limit: "100",
    });
    if (events.length === 0) return;

    let items = this.agentStreamItemsByThread.get(threadId);
    if (items === undefined) {
      items = new Map();
      this.agentStreamItemsByThread.set(threadId, items);
    }
    for (const event of events) {
      this.agentStreamCursorByThread.set(threadId, event.seq);
      if (event.createdAt < job.startedAt) continue;

      if (event.type === "item/agentMessage/delta") {
        const item = items.get(event.data.itemId) ?? {
          buffer: "",
          emittedLineCount: 0,
        };
        const lines = `${item.buffer}${event.data.delta}`.split(/\r?\n/u);
        item.buffer = lines.pop() ?? "";
        items.set(event.data.itemId, item);
        lines.forEach((line) => {
          const lineIndex = item.emittedLineCount;
          item.emittedLineCount += 1;
          this.publishGenerationStreamLine({
            canvasId: canvas.id,
            jobId: job.id,
            itemId: event.data.itemId,
            eventSeq: event.seq,
            lineIndex,
            text: line,
          });
        });
        continue;
      }

      if (
        event.type !== "item/completed" ||
        event.data.item.type !== "agentMessage"
      ) {
        continue;
      }
      const item = items.get(event.data.item.id);
      const emittedLineCount = item?.emittedLineCount ?? 0;
      event.data.item.text
        .split(/\r?\n/u)
        .slice(emittedLineCount)
        .forEach((line, offset) =>
          this.publishGenerationStreamLine({
            canvasId: canvas.id,
            jobId: job.id,
            itemId: event.data.item.id,
            eventSeq: event.seq,
            lineIndex: emittedLineCount + offset,
            text: line,
          }),
        );
      items.delete(event.data.item.id);
    }
  }

  listCanvases() {
    return this.store.listCanvases();
  }

  getCanvasSnapshot(canvasId: string) {
    return this.store.getCanvasSnapshot(canvasId);
  }

  isDisclosureAcknowledged(): boolean {
    return this.store.isDisclosureAcknowledged();
  }

  acknowledgeDisclosure() {
    return this.store.acknowledgeDisclosure();
  }

  createCanvas(name: string): CanvasSnapshotDto {
    const existing = [...this.store.listCanvases()].sort(
      (left, right) =>
        left.createdAt - right.createdAt || left.id.localeCompare(right.id),
    )[0];
    if (existing !== undefined) return this.requiredSnapshot(existing.id);

    const canvas = this.store.createCanvas({ name });
    this.publishLibrary(canvas.id);
    return this.requiredSnapshot(canvas.id);
  }

  async renameCanvas(input: {
    canvasId: string;
    name: string;
    expectedRevision: number;
  }): Promise<CanvasSnapshotDto> {
    return this.withCanvasLock(input.canvasId, () => {
      const canvas = this.store.renameCanvas(input);
      this.publishCanvas(canvas.id, canvas.revision);
      this.publishLibrary(canvas.id);
      return this.requiredSnapshot(canvas.id);
    });
  }

  async createCard(input: {
    canvasId: string;
    prompt: string;
    expectedRevision: number;
  }): Promise<{ snapshot: CanvasSnapshotDto; cardId: string }> {
    return this.withCanvasLock(input.canvasId, () => {
      const created = this.store.createReadyCard(input);
      this.publishCanvas(input.canvasId, created.revision);
      return {
        snapshot: this.requiredSnapshot(input.canvasId),
        cardId: created.card.id,
      };
    });
  }

  private async personalProjectId(): Promise<string> {
    const projects = await this.bb.sdk.projects.list({ includePersonal: true });
    const personal = projects.find((project) => project.kind === "personal");
    if (personal === undefined) {
      throw new Error("SceneSeed could not resolve bb's personal project");
    }
    return personal.id;
  }

  private buildJobPromptFromPayload(
    snapshot: CanvasSnapshotDto,
    payload: {
      jobId: string;
      objectId: string;
      generation: number;
      prompt: string;
      placement: Placement;
    },
    phase: "progress" | "scene" = "progress",
  ): string {
    const activeCandidates = new Map(
      snapshot.candidates
        .filter(
          (candidate) =>
            candidate.state === "active" && candidate.normalizedScene !== null,
        )
        .map((candidate) => [candidate.id, candidate.normalizedScene!]),
    );
    const nearby = snapshot.objects
      .filter(
        (entry) =>
          entry.id !== payload.objectId &&
          entry.removedAt === null &&
          entry.activeSceneId !== null,
      )
      .slice(0, 12)
      .flatMap((entry) => {
        const scene = activeCandidates.get(entry.activeSceneId!);
        return scene === undefined
          ? []
          : [
              {
                name: scene.name,
                bounds: scene.bounds,
                palette: scene.palette,
                position: entry.transform.position,
              },
            ];
      });
    const context = JSON.stringify({
      jobId: payload.jobId,
      objectId: payload.objectId,
      generation: payload.generation,
      prompt: payload.prompt,
      placement: payload.placement,
      nearby,
    });
    if (phase === "progress") {
      return [
        "Prepare the visual direction for this SceneSeed job using the sceneseed-interpreter skill.",
        "Do not call tools or write code in this progress turn. Do not inspect files, use network access, or call unrelated tools.",
        "Reply with exactly four concise, display-ready lines describing the playful mockup choices you will use for this prompt. Use one complete sentence fragment per line, under 72 characters, with no bullets, numbering, markdown, code, preamble, conclusion, or generic filler. End every line with a newline so Diorama can stream it as a complete line.",
        context,
      ].join("\n\n");
    }
    return [
      "Build and submit the SceneSeed job below using the visual direction from the preceding progress turn and the sceneseed-interpreter skill.",
      "Use only the submit_scene_object tool. Do not write commentary or a final answer, inspect files, use network access, or call unrelated tools.",
      "Write one compact visualization as a JavaScript function body using the THREE namespace described by the sceneseed-interpreter skill and pass that source text directly to submit_scene_object. THREE is supplied only when the plugin executes the source, so do not try to inspect or execute THREE yourself. Target 3–7 drawable objects and 250–800 aggregate vertices, with no more than 3 unique geometries, at most 3 materials, under 2,500 source characters, and under 160 KB when serialized. Reuse geometry and materials. Keep radial segments around 10–16, TubeGeometry at or below 24 tubular by 6 radial segments, and ExtrudeGeometry at or below 1 step, 1 bevel segment, and 6 curve segments; never call toNonIndexed or create per-face geometry. Do not add a ground plane, shadow mesh, ring, cage, grid, axes, or presentation frame unless the user's subject explicitly requires one; Diorama supplies the stage and shadow. Return the canonical presentation values camera: \"three-quarter\", movement: \"still\", and shadow: \"crisp\" rather than inventing option objects. Make it feel like a fun, loose concept mockup: use one recognizable, exaggerated rounded silhouette, toy-like proportions, a small off-kilter composition, simple curved primitives, and soft or glossy finishes. Avoid the visual language of technical diagrams, serious geometric studies, monuments, exact product renders, stacked boxes, and decorative detail that does not help recognition. The plugin injects job and object identity, runs the source for this requested job, recenters and grounds the returned Object3D, and persists its serialized Three.js result. If validation issues are returned, correct them and call the tool one final time. End without prose after one visualization is accepted.",
      context,
    ].join("\n\n");
  }

  private buildJobPrompt(
    snapshot: CanvasSnapshotDto,
    job: JobDto,
    phase: "progress" | "scene" = "progress",
  ): string {
    const card = snapshot.cards.find((entry) => entry.id === job.cardId);
    const object = snapshot.objects.find((entry) => entry.id === job.objectId);
    if (card === undefined || object === undefined || card.placement === null) {
      throw new Error(
        `SceneSeed job ${job.id} is missing its card or placement`,
      );
    }
    return this.buildJobPromptFromPayload(
      snapshot,
      {
        jobId: job.id,
        objectId: job.objectId,
        generation: job.generation,
        prompt: card.prompt,
        placement: card.placement,
      },
      phase,
    );
  }

  private async generationExecutionForProvider(
    providerId: string,
    defaultModel?: string,
  ): Promise<GenerationExecutionOptions> {
    const cached = this.generationExecutionByProvider.get(providerId);
    if (cached) return cached;

    const catalog = await this.bb.sdk.providers.models({ providerId });
    const preferredModels = FAST_GENERATION_MODELS[providerId] ?? [];
    const selected =
      preferredModels
        .map((model) => catalog.models.find((entry) => entry.model === model))
        .find((entry) => entry !== undefined) ??
      catalog.models.find((entry) => entry.model === defaultModel) ??
      catalog.models.find((entry) => entry.isDefault);
    if (!selected) return { serviceTier: "fast" };

    const supportsLowReasoning = selected.supportedReasoningEfforts.some(
      (effort) => effort.reasoningEffort === "low",
    );
    const options: GenerationExecutionOptions = {
      model: selected.model,
      reasoningLevel: supportsLowReasoning
        ? "low"
        : selected.defaultReasoningEffort,
      serviceTier: "fast",
    };
    this.generationExecutionByProvider.set(providerId, options);
    this.bb.log.info(
      `SceneSeed generation will use ${providerId}/${selected.model} at ${options.reasoningLevel} reasoning on the fast service tier`,
    );
    return options;
  }

  private async generationExecutionOptions(
    threadId: string,
  ): Promise<GenerationExecutionOptions> {
    try {
      const thread = await this.bb.sdk.threads.get({ threadId });
      const defaults = await this.bb.sdk.threads.defaultExecutionOptions({
        threadId,
      });
      return await this.generationExecutionForProvider(
        thread.providerId,
        defaults?.model,
      );
    } catch (error) {
      this.bb.log.warn(
        `Could not resolve a faster SceneSeed generation model; using the thread defaults: ${errorMessage(error)}`,
      );
      return { serviceTier: "fast" };
    }
  }

  private async initialGenerationExecutionOptions(
    projectId: string,
  ): Promise<SpawnGenerationExecutionOptions> {
    try {
      const defaults = await this.bb.sdk.projects.defaultExecutionOptions({
        projectId,
      });
      if (defaults === null) {
        const providers = await this.bb.sdk.providers.list();
        const preferred = providers.find(
          (provider) =>
            provider.available &&
            (FAST_GENERATION_MODELS[provider.id]?.length ?? 0) > 0,
        );
        if (preferred === undefined) return { serviceTier: "fast" };
        return {
          providerId: preferred.id,
          ...(await this.generationExecutionForProvider(preferred.id)),
        };
      }
      return {
        providerId: defaults.providerId,
        ...(await this.generationExecutionForProvider(
          defaults.providerId,
          defaults.model,
        )),
      };
    } catch (error) {
      this.bb.log.warn(
        `Could not resolve first-turn SceneSeed execution options; using the project defaults on the fast service tier: ${errorMessage(error)}`,
      );
      return { serviceTier: "fast" };
    }
  }

  private async startFirstJobLocked(input: {
    canvasId: string;
    prompt: string;
    placement: Placement;
    objectId: string;
    jobId: string;
    generation: number;
    queue: (
      agentThreadId: string,
      expectedRevision: number,
    ) => { job: JobDto; revision: number };
  }): Promise<{ snapshot: CanvasSnapshotDto; jobId: string }> {
    const current = this.store.getCanvas(input.canvasId);
    if (current === null) {
      throw new SceneSeedStoreError(
        "not_found",
        `canvas ${input.canvasId} was not found`,
      );
    }
    if (current.agentThreadId !== null) {
      throw new SceneSeedStoreError(
        "invalid_state",
        "canvas already has an interpreter thread",
      );
    }

    const projectId = await this.personalProjectId();
    const execution = await this.initialGenerationExecutionOptions(projectId);
    const thread = await this.bb.sdk.threads.spawn({
      projectId,
      environment: { type: "project-default" },
      prompt: this.buildJobPromptFromPayload(
        this.requiredSnapshot(input.canvasId),
        {
          jobId: input.jobId,
          objectId: input.objectId,
          generation: input.generation,
          prompt: input.prompt,
          placement: input.placement,
        },
      ),
      title: `SceneSeed: ${current.name}`,
      visibility: "hidden",
      permissionMode: "accept-edits",
      origin: "plugin",
      originPluginId: this.bb.pluginId,
      ...execution,
    });

    let markInitialJobReady!: () => void;
    const initialJobReady = new Promise<void>((resolve) => {
      markInitialJobReady = resolve;
    });
    this.initialJobReadiness.set(thread.id, initialJobReady);

    try {
      const bound = this.store.setCanvasAgentThreadId({
        canvasId: input.canvasId,
        agentThreadId: thread.id,
        expectedRevision: current.revision,
      });
      const queued = input.queue(thread.id, bound.revision);
      const claimed = this.store.claimNextQueuedJob({
        canvasId: input.canvasId,
        agentThreadId: thread.id,
        expectedRevision: queued.revision,
      });
      if (claimed === null || claimed.job.id !== input.jobId) {
        throw new Error("SceneSeed could not claim its first generation job");
      }
      this.generationPreludeJobByThread.set(thread.id, claimed.job.id);
      this.publishCanvas(input.canvasId, claimed.revision, claimed.job.id);
      return {
        snapshot: this.requiredSnapshot(input.canvasId),
        jobId: claimed.job.id,
      };
    } catch (error) {
      const latest = this.store.getCanvas(input.canvasId);
      if (latest?.agentThreadId === thread.id) {
        try {
          const reset = this.store.replaceCanvasAgentThreadId({
            canvasId: input.canvasId,
            agentThreadId: null,
            expectedRevision: latest.revision,
          });
          this.publishCanvas(input.canvasId, reset.revision);
        } catch (resetError) {
          this.bb.log.warn(
            `Could not detach failed SceneSeed thread ${thread.id}: ${errorMessage(resetError)}`,
          );
        }
      }
      await this.cleanupThread(thread.id);
      throw error;
    } finally {
      markInitialJobReady();
      queueMicrotask(() => {
        if (this.initialJobReadiness.get(thread.id) === initialJobReady) {
          this.initialJobReadiness.delete(thread.id);
        }
      });
    }
  }

  private async dispatchNextLocked(canvasId: string): Promise<void> {
    const canvas = this.store.getCanvas(canvasId);
    if (canvas?.agentThreadId === null || canvas === null) return;
    const claimed = this.store.claimNextQueuedJob({
      canvasId,
      agentThreadId: canvas.agentThreadId,
      expectedRevision: canvas.revision,
    });
    if (claimed === null) return;
    this.publishCanvas(canvasId, claimed.revision, claimed.job.id);
    const snapshot = this.requiredSnapshot(canvasId);
    try {
      const execution = await this.generationExecutionOptions(
        canvas.agentThreadId,
      );
      this.generationPreludeJobByThread.set(
        canvas.agentThreadId,
        claimed.job.id,
      );
      await this.bb.sdk.threads.send({
        threadId: canvas.agentThreadId,
        mode: "queue-if-active",
        input: [
          {
            type: "text",
            text: this.buildJobPrompt(snapshot, claimed.job),
            mentions: [],
          },
        ],
        permissionMode: "accept-edits",
        ...execution,
      });
    } catch (error) {
      if (
        this.generationPreludeJobByThread.get(canvas.agentThreadId) ===
        claimed.job.id
      ) {
        this.generationPreludeJobByThread.delete(canvas.agentThreadId);
      }
      const latest = this.store.getCanvas(canvasId);
      if (latest === null) return;
      this.store.failNonterminalJob({
        jobId: claimed.job.id,
        generation: claimed.job.generation,
        expectedState: "interpreting",
        agentThreadId: canvas.agentThreadId,
        expectedCanvasRevision: latest.revision,
        errorCode: "dispatch_failed",
        errorMessage: errorMessage(error),
      });
      const failed = this.store.getCanvas(canvasId);
      if (failed !== null)
        this.publishCanvas(canvasId, failed.revision, claimed.job.id);
    }
  }

  private async dispatchNextWhenThreadIdleLocked(
    canvasId: string,
  ): Promise<void> {
    const canvas = this.store.getCanvas(canvasId);
    if (canvas?.agentThreadId === null || canvas === null) return;
    try {
      const thread = await this.bb.sdk.threads.get({
        threadId: canvas.agentThreadId,
      });
      if (thread.status === "idle") await this.dispatchNextLocked(canvasId);
    } catch (error) {
      this.bb.log.warn(
        `Could not inspect SceneSeed thread ${canvas.agentThreadId} before dispatch: ${errorMessage(error)}`,
      );
    }
  }

  async placeCard(input: {
    canvasId: string;
    cardId: string;
    placement: Placement;
    expectedRevision: number;
  }): Promise<{ snapshot: CanvasSnapshotDto; jobId: string }> {
    return this.withCanvasLock(input.canvasId, async () => {
      this.assertRevision(input.canvasId, input.expectedRevision);
      this.assertCardOnCanvas(input.canvasId, input.cardId);
      const before = this.requiredSnapshot(input.canvasId);
      const card = before.cards.find((entry) => entry.id === input.cardId)!;
      const existingObject = before.objects.find(
        (entry) => entry.sourceCardId === input.cardId,
      );
      const objectId = existingObject?.id ?? createRuntimeId("object");
      const generation =
        Math.max(
          0,
          ...before.jobs
            .filter((job) => job.objectId === objectId)
            .map((job) => job.generation),
        ) + 1;
      const jobId = createRuntimeId("job");
      if (before.canvas.agentThreadId === null) {
        return this.startFirstJobLocked({
          canvasId: input.canvasId,
          prompt: card.prompt,
          placement: input.placement,
          objectId,
          jobId,
          generation,
          queue: (agentThreadId, expectedRevision) =>
            this.store.queueCard({
              cardId: input.cardId,
              objectId,
              jobId,
              placement: input.placement,
              agentThreadId,
              expectedRevision,
            }),
        });
      }

      const threadId = before.canvas.agentThreadId;
      const canvas = this.store.getCanvas(input.canvasId)!;
      const queued = this.store.queueCard({
        cardId: input.cardId,
        objectId,
        jobId,
        placement: input.placement,
        agentThreadId: threadId,
        expectedRevision: canvas.revision,
      });
      this.publishCanvas(input.canvasId, queued.revision, queued.job.id);
      await this.dispatchNextWhenThreadIdleLocked(input.canvasId);
      return {
        snapshot: this.requiredSnapshot(input.canvasId),
        jobId: queued.job.id,
      };
    });
  }

  async remixObject(input: {
    canvasId: string;
    objectId: string;
    expectedRevision: number;
  }): Promise<{ snapshot: CanvasSnapshotDto; jobId: string }> {
    return this.withCanvasLock(input.canvasId, async () => {
      this.assertRevision(input.canvasId, input.expectedRevision);
      this.assertObjectOnCanvas(input.canvasId, input.objectId);
      const before = this.requiredSnapshot(input.canvasId);
      const object = before.objects.find(
        (entry) => entry.id === input.objectId,
      )!;
      const card = before.cards.find(
        (entry) => entry.id === object.sourceCardId,
      );
      if (card?.placement === null || card === undefined) {
        throw new SceneSeedStoreError(
          "invalid_state",
          "remix source is missing its prompt placement",
        );
      }
      const generation =
        Math.max(
          0,
          ...before.jobs
            .filter((job) => job.objectId === object.id)
            .map((job) => job.generation),
        ) + 1;
      const jobId = createRuntimeId("job");
      if (before.canvas.agentThreadId === null) {
        return this.startFirstJobLocked({
          canvasId: input.canvasId,
          prompt: card.prompt,
          placement: card.placement,
          objectId: object.id,
          jobId,
          generation,
          queue: (agentThreadId, expectedRevision) =>
            this.store.queueRemix({
              objectId: input.objectId,
              jobId,
              agentThreadId,
              expectedRevision,
            }),
        });
      }

      const threadId = before.canvas.agentThreadId;
      const canvas = this.store.getCanvas(input.canvasId)!;
      const queued = this.store.queueRemix({
        objectId: input.objectId,
        jobId,
        agentThreadId: threadId,
        expectedRevision: canvas.revision,
      });
      this.publishCanvas(input.canvasId, queued.revision, queued.job.id);
      await this.dispatchNextWhenThreadIdleLocked(input.canvasId);
      return {
        snapshot: this.requiredSnapshot(input.canvasId),
        jobId: queued.job.id,
      };
    });
  }

  async beginRealization(input: {
    candidateId: string;
    attemptId: string;
    jobId: string;
    generation: number;
    expectedCanvasRevision: number;
  }) {
    const candidate = this.store.getCandidate(input.candidateId);
    if (candidate === null) {
      throw new SceneSeedStoreError("not_found", "candidate was not found");
    }
    return this.withCanvasLock(candidate.canvasId, async () => {
      const canvas = this.store.getCanvas(candidate.canvasId);
      if (canvas?.agentThreadId === null || canvas === null) {
        throw new SceneSeedStoreError(
          "invalid_state",
          "canvas has no interpreter thread",
        );
      }
      const currentCandidate = this.store.getCandidate(input.candidateId);
      const currentJob = this.store.getJob(input.jobId);
      if (
        currentCandidate?.jobId === input.jobId &&
        currentCandidate.generation === input.generation &&
        currentCandidate.state === "active" &&
        currentJob?.state === "complete"
      ) {
        return {
          alreadyProcessed: true,
          snapshot: this.requiredSnapshot(candidate.canvasId),
        };
      }

      const begun = this.store.beginRealization({
        ...input,
        agentThreadId: canvas.agentThreadId,
      });
      // Generated source has already executed in the bounded server runtime,
      // passed scene limits, and serialized through Three.js. Promote it in
      // the same lock instead of leasing acceptance to whichever browser tab
      // happens to answer first; an inactive tab otherwise adds a full lease
      // timeout before another client can show the result.
      const completed = this.store.acknowledgeRealization({
        ...input,
        agentThreadId: canvas.agentThreadId,
        expectedCanvasRevision: begun.revision,
        outcome: "success",
      });
      this.publishCanvas(candidate.canvasId, completed.revision, input.jobId);
      await this.dispatchNextWhenThreadIdleLocked(candidate.canvasId);
      return {
        alreadyProcessed:
          begun.alreadyProcessed || completed.outcome === "already_processed",
        snapshot: this.requiredSnapshot(candidate.canvasId),
      };
    });
  }

  async acknowledgeRealization(input: {
    candidateId: string;
    attemptId: string;
    jobId: string;
    generation: number;
    expectedCanvasRevision: number;
    outcome: "success" | "failure";
    errorMessage?: string;
  }) {
    const candidate = this.store.getCandidate(input.candidateId);
    if (candidate === null) {
      throw new SceneSeedStoreError("not_found", "candidate was not found");
    }
    return this.withCanvasLock(candidate.canvasId, async () => {
      const canvas = this.store.getCanvas(candidate.canvasId);
      if (canvas?.agentThreadId === null || canvas === null) {
        throw new SceneSeedStoreError(
          "invalid_state",
          "canvas has no interpreter thread",
        );
      }
      const result = this.store.acknowledgeRealization({
        ...input,
        agentThreadId: canvas.agentThreadId,
      });
      this.publishCanvas(candidate.canvasId, result.revision, input.jobId);
      await this.dispatchNextWhenThreadIdleLocked(candidate.canvasId);
      return {
        outcome: result.outcome,
        snapshot: this.requiredSnapshot(candidate.canvasId),
      };
    });
  }

  async updateObjectTransform(input: {
    canvasId: string;
    objectId: string;
    transform: Transform3D;
    expectedCanvasRevision: number;
  }): Promise<CanvasSnapshotDto> {
    return this.withCanvasLock(input.canvasId, () => {
      this.assertRevision(input.canvasId, input.expectedCanvasRevision);
      this.assertObjectOnCanvas(input.canvasId, input.objectId);
      const result = this.store.updateObjectTransform({
        objectId: input.objectId,
        transform: input.transform,
        expectedCanvasRevision: input.expectedCanvasRevision,
      });
      this.publishCanvas(input.canvasId, result.revision);
      return this.requiredSnapshot(input.canvasId);
    });
  }

  async duplicateObject(input: {
    canvasId: string;
    sourceObjectId: string;
    expectedCanvasRevision: number;
    transform?: Transform3D;
  }) {
    return this.withCanvasLock(input.canvasId, () => {
      this.assertRevision(input.canvasId, input.expectedCanvasRevision);
      this.assertObjectOnCanvas(input.canvasId, input.sourceObjectId);
      const result = this.store.duplicateObject({
        sourceObjectId: input.sourceObjectId,
        expectedCanvasRevision: input.expectedCanvasRevision,
        ...(input.transform === undefined
          ? {}
          : { transform: input.transform }),
      });
      this.publishCanvas(input.canvasId, result.revision);
      return {
        snapshot: this.requiredSnapshot(input.canvasId),
        objectId: result.object.id,
        cardId: result.card.id,
      };
    });
  }

  async cancelJob(jobId: string): Promise<CanvasSnapshotDto> {
    const job = this.store.getJob(jobId);
    if (job === null) {
      throw new SceneSeedStoreError("not_found", `job ${jobId} was not found`);
    }
    return this.withCanvasLock(job.canvasId, async () => {
      const current = this.store.getJob(jobId);
      const canvas = this.store.getCanvas(job.canvasId);
      if (
        current === null ||
        canvas?.agentThreadId === null ||
        canvas === null
      ) {
        throw new SceneSeedStoreError(
          "invalid_state",
          "job cannot be cancelled",
        );
      }
      if (current.state !== "queued" && current.state !== "interpreting") {
        throw new SceneSeedStoreError(
          "invalid_state",
          `job ${jobId} cannot be cancelled from ${current.state}`,
        );
      }
      const result = this.store.cancelJob({
        jobId,
        generation: current.generation,
        expectedState: current.state,
        agentThreadId: canvas.agentThreadId,
        expectedCanvasRevision: canvas.revision,
      });
      this.publishCanvas(job.canvasId, result.revision, jobId);
      if (current.state === "interpreting") {
        try {
          await this.bb.sdk.threads.stop({ threadId: canvas.agentThreadId });
        } catch (error) {
          this.bb.log.warn(
            `Could not stop cancelled SceneSeed thread ${canvas.agentThreadId}: ${errorMessage(error)}`,
          );
        }
      } else {
        await this.dispatchNextWhenThreadIdleLocked(job.canvasId);
      }
      return this.requiredSnapshot(job.canvasId);
    });
  }

  async removeObject(input: {
    canvasId: string;
    objectId: string;
    expectedCanvasRevision: number;
  }): Promise<CanvasSnapshotDto> {
    return this.withCanvasLock(input.canvasId, async () => {
      this.assertRevision(input.canvasId, input.expectedCanvasRevision);
      const before = this.requiredSnapshot(input.canvasId);
      const object = before.objects.find(
        (entry) => entry.id === input.objectId,
      );
      if (object === undefined) {
        throw new SceneSeedStoreError("not_found", "object was not found");
      }
      const activeJob =
        object.activeJobId === null
          ? null
          : before.jobs.find((job) => job.id === object.activeJobId);
      if (activeJob?.state === "interpreting") {
        const threadId = before.canvas.agentThreadId;
        if (threadId !== null) {
          try {
            await this.bb.sdk.threads.stop({ threadId });
          } catch (error) {
            this.bb.log.warn(
              `Could not stop removed SceneSeed object job: ${errorMessage(error)}`,
            );
          }
        }
      }
      const result = this.store.removeObject({
        objectId: input.objectId,
        expectedCanvasRevision: input.expectedCanvasRevision,
      });
      this.publishCanvas(input.canvasId, result.revision);
      return this.requiredSnapshot(input.canvasId);
    });
  }

  async cleanupThread(threadId: string): Promise<SceneSeedCleanupResult> {
    let archived = false;
    let stopped = false;
    try {
      await this.bb.sdk.threads.archive({ threadId });
      archived = true;
    } catch (error) {
      this.bb.log.warn(
        `Could not archive SceneSeed thread ${threadId}: ${errorMessage(error)}`,
      );
    }
    try {
      await this.bb.sdk.threads.stop({ threadId });
      stopped = true;
    } catch (error) {
      this.bb.log.warn(
        `Could not stop SceneSeed thread ${threadId}: ${errorMessage(error)}`,
      );
    }
    return { archived, stopped };
  }

  async deleteCanvas(input: {
    canvasId: string;
    expectedRevision: number;
  }): Promise<{ deleted: boolean; threadCleanupFailed: boolean }> {
    return this.withCanvasLock(input.canvasId, async () => {
      this.assertRevision(input.canvasId, input.expectedRevision);
      const canvas = this.store.getCanvas(input.canvasId)!;
      const cleanup =
        canvas.agentThreadId === null
          ? { archived: true, stopped: true }
          : await this.cleanupThread(canvas.agentThreadId);
      const deleted = this.store.deleteCanvas(input);
      this.publishLibrary(input.canvasId);
      return {
        deleted: deleted.deleted,
        threadCleanupFailed: !cleanup.archived || !cleanup.stopped,
      };
    });
  }

  async clearAllCanvasData(): Promise<{
    deletedCanvasCount: number;
    failedThreadIds: string[];
  }> {
    const canvases = this.store.listCanvases();
    const failedThreadIds: string[] = [];
    for (const canvas of canvases) {
      if (canvas.agentThreadId === null) continue;
      const cleanup = await this.cleanupThread(canvas.agentThreadId);
      if (!cleanup.archived || !cleanup.stopped) {
        failedThreadIds.push(canvas.agentThreadId);
      }
    }
    const result = this.store.clearAllCanvasData();
    for (const canvas of canvases) this.publishLibrary(canvas.id);
    return { deletedCanvasCount: result.deletedCanvasCount, failedThreadIds };
  }

  async submitSceneObject(params: unknown, callerThreadId: string) {
    await this.initialJobReadiness.get(callerThreadId);
    const canvas = this.store.getCanvasByAgentThreadId(callerThreadId);
    if (canvas === null) {
      return {
        content: [
          {
            type: "text" as const,
            text: "Rejected: this thread does not own a SceneSeed canvas.",
          },
        ],
        isError: true,
      };
    }
    return this.withCanvasLock(canvas.id, () => {
      const current = this.store.getCurrentJobByAgentThreadId(callerThreadId);
      if (current === null || current.state !== "interpreting") {
        return {
          content: [
            {
              type: "text" as const,
              text: "Rejected: this canvas has no interpreting job for this thread.",
            },
          ],
          isError: true,
        };
      }

      const envelope = submitEnvelopeSchema.safeParse(params);
      let issues: readonly SceneContractIssue[];
      let normalized:
        | { success: true; scene: SceneObject }
        | { success: false; issues: readonly SceneContractIssue[] }
        | undefined;
      if (!envelope.success) {
        issues = envelopeIssues(envelope.error);
      } else if (envelope.data.source !== undefined) {
        normalized = safeCompileSceneCode(envelope.data.source, {
          jobId: current.id,
          objectId: current.objectId,
        });
        issues = normalized.success ? [] : normalized.issues;
      } else if (envelope.data.program !== undefined) {
        normalized = safeCompileSceneSeedKitProgram(envelope.data.program, {
          jobId: current.id,
          objectId: current.objectId,
        });
        issues = normalized.success ? [] : normalized.issues;
      } else {
        normalized = safeNormalizeSceneObject(envelope.data.scene);
        issues = normalized.success ? [] : normalized.issues;
      }
      if (normalized?.success) {
        if (normalized.scene.jobId !== current.id) {
          issues = [
            ...issues,
            {
              code: "job_id_mismatch",
              path: "scene.jobId",
              message: `must equal ${current.id}`,
            },
          ];
        }
        if (normalized.scene.objectId !== current.objectId) {
          issues = [
            ...issues,
            {
              code: "object_id_mismatch",
              path: "scene.objectId",
              message: `must equal ${current.objectId}`,
            },
          ];
        }
      }

      if (!normalized?.success || issues.length > 0) {
        const latest = this.store.getCanvas(canvas.id)!;
        const message = boundedIssues(issues);
        const result = this.store.recordInvalidSubmission({
          jobId: current.id,
          generation: current.generation,
          agentThreadId: callerThreadId,
          expectedCanvasRevision: latest.revision,
          errorMessage: message,
        });
        this.publishCanvas(canvas.id, result.revision, current.id);
        if (!result.terminal) {
          return JSON.stringify({
            accepted: false,
            retryAllowed: true,
            issues: issues.slice(0, 8),
            instruction:
              "Correct every issue and call submit_scene_object one final time.",
          });
        }
        return {
          content: [
            {
              type: "text" as const,
              text: `Rejected: the second invalid submission failed this job.\n${message}`,
            },
          ],
          isError: true,
        };
      }

      const latest = this.store.getCanvas(canvas.id)!;
      const result = this.store.submitCandidate({
        jobId: current.id,
        generation: current.generation,
        agentThreadId: callerThreadId,
        expectedCanvasRevision: latest.revision,
        scene: normalized.scene,
      });
      const attemptId = createRuntimeId("realization");
      const begun = this.store.beginRealization({
        candidateId: result.candidate.id,
        attemptId,
        jobId: current.id,
        generation: current.generation,
        agentThreadId: callerThreadId,
        expectedCanvasRevision: result.revision,
      });
      const activated = this.store.acknowledgeRealization({
        candidateId: result.candidate.id,
        attemptId,
        jobId: current.id,
        generation: current.generation,
        agentThreadId: callerThreadId,
        expectedCanvasRevision: begun.revision,
        outcome: "success",
      });
      this.publishCanvas(canvas.id, activated.revision, current.id);
      this.generationPreludeJobByThread.delete(callerThreadId);
      this.clearGenerationStream(callerThreadId);
      if (activated.outcome !== "complete") {
        return {
          content: [
            {
              type: "text" as const,
              text: `Rejected: the validated scene could not be activated (${activated.outcome}).`,
            },
          ],
          isError: true,
        };
      }
      return JSON.stringify({
        accepted: true,
        jobId: current.id,
        candidateId: result.candidate.id,
        revision: activated.revision,
      });
    });
  }

  private async failJobsForMissingThreadLocked(
    canvasId: string,
    threadId: string,
    message: string,
  ): Promise<void> {
    let snapshot = this.store.getCanvasSnapshot(canvasId);
    if (snapshot === null) return;
    for (const job of snapshot.jobs) {
      if (job.agentThreadId !== threadId || SETTLED_JOB_STATES.has(job.state)) {
        continue;
      }
      if (job.state === "cancelled") {
        if (job.threadSettledAt !== null) continue;
        const settled = this.store.settleCancelledAgentTurn({
          jobId: job.id,
          generation: job.generation,
          agentThreadId: threadId,
          expectedCanvasRevision: snapshot.canvas.revision,
        });
        this.publishCanvas(canvasId, settled.revision, job.id);
      } else if (isNonterminalJobState(job.state)) {
        const failed = this.store.failNonterminalJob({
          jobId: job.id,
          generation: job.generation,
          expectedState: job.state,
          agentThreadId: threadId,
          expectedCanvasRevision: snapshot.canvas.revision,
          errorCode: "agent_thread_unavailable",
          errorMessage: message,
        });
        this.publishCanvas(canvasId, failed.revision, job.id);
      }
      snapshot = this.store.getCanvasSnapshot(canvasId);
      if (snapshot === null) return;
    }
    const current = this.store.getCanvas(canvasId);
    if (current?.agentThreadId === threadId) {
      const replaced = this.store.replaceCanvasAgentThreadId({
        canvasId,
        agentThreadId: null,
        expectedRevision: current.revision,
      });
      this.publishCanvas(canvasId, replaced.revision);
    }
  }

  async reconcileThread(
    threadId: string,
    outcome: "idle" | "failed" | "unavailable",
    detail?: string | null,
  ): Promise<void> {
    const canvas = this.store.getCanvasByAgentThreadId(threadId);
    if (canvas === null) return;
    await this.withCanvasLock(canvas.id, async () => {
      if (outcome === "idle") {
        try {
          const liveThread = await this.bb.sdk.threads.get({ threadId });
          if (liveThread.status !== "idle") return;
        } catch (error) {
          await this.failJobsForMissingThreadLocked(
            canvas.id,
            threadId,
            `The SceneSeed interpreter thread could not be reconciled: ${errorMessage(error)}`,
          );
          return;
        }
      }
      if (outcome === "unavailable") {
        await this.failJobsForMissingThreadLocked(
          canvas.id,
          threadId,
          detail ?? "The SceneSeed interpreter thread is unavailable.",
        );
        return;
      }
      let snapshot = this.store.getCanvasSnapshot(canvas.id);
      if (snapshot === null) return;
      const cancelled = snapshot.jobs.find(
        (job) =>
          job.agentThreadId === threadId &&
          job.state === "cancelled" &&
          job.startedAt !== null &&
          job.threadSettledAt === null,
      );
      if (cancelled !== undefined) {
        const result = this.store.settleCancelledAgentTurn({
          jobId: cancelled.id,
          generation: cancelled.generation,
          agentThreadId: threadId,
          expectedCanvasRevision: snapshot.canvas.revision,
        });
        this.publishCanvas(canvas.id, result.revision, cancelled.id);
        snapshot = this.requiredSnapshot(canvas.id);
      }
      const interpreting = snapshot.jobs.find(
        (job) => job.agentThreadId === threadId && job.state === "interpreting",
      );
      if (
        outcome === "idle" &&
        interpreting !== undefined &&
        this.generationPreludeJobByThread.get(threadId) === interpreting.id
      ) {
        this.generationPreludeJobByThread.delete(threadId);
        try {
          const execution = await this.generationExecutionOptions(threadId);
          await this.bb.sdk.threads.send({
            threadId,
            mode: "queue-if-active",
            input: [
              {
                type: "text",
                text: this.buildJobPrompt(snapshot, interpreting, "scene"),
                mentions: [],
              },
            ],
            permissionMode: "accept-edits",
            ...execution,
          });
          return;
        } catch (error) {
          const latest = this.requiredSnapshot(canvas.id);
          const failed = this.store.failNonterminalJob({
            jobId: interpreting.id,
            generation: interpreting.generation,
            expectedState: "interpreting",
            agentThreadId: threadId,
            expectedCanvasRevision: latest.canvas.revision,
            errorCode: "dispatch_failed",
            errorMessage: errorMessage(error),
          });
          this.publishCanvas(canvas.id, failed.revision, interpreting.id);
          await this.dispatchNextLocked(canvas.id);
          return;
        }
      }
      if (interpreting === undefined) {
        this.generationPreludeJobByThread.delete(threadId);
      }
      if (interpreting !== undefined) {
        const result = this.store.failNonterminalJob({
          jobId: interpreting.id,
          generation: interpreting.generation,
          expectedState: "interpreting",
          agentThreadId: threadId,
          expectedCanvasRevision: snapshot.canvas.revision,
          errorCode: outcome === "failed" ? "agent_failed" : "agent_no_scene",
          errorMessage:
            detail ??
            (outcome === "failed"
              ? "The SceneSeed interpreter failed."
              : "The SceneSeed interpreter finished without submitting a scene."),
        });
        this.publishCanvas(canvas.id, result.revision, interpreting.id);
      }
      await this.dispatchNextLocked(canvas.id);
    });
  }

  async reconcileStartup(): Promise<void> {
    const canvasIds = [
      ...new Set(this.store.listNonterminalJobs().map((job) => job.canvasId)),
    ];
    for (const canvasId of canvasIds) {
      await this.withCanvasLock(canvasId, async () => {
        const canvas = this.store.getCanvas(canvasId);
        if (canvas?.agentThreadId === null || canvas === null) return;
        try {
          const thread = await this.bb.sdk.threads.get({
            threadId: canvas.agentThreadId,
          });
          if (thread.archivedAt !== null || thread.deletedAt !== null) {
            await this.failJobsForMissingThreadLocked(
              canvasId,
              canvas.agentThreadId,
              "The SceneSeed interpreter thread was archived or deleted.",
            );
            return;
          }
          if (thread.status === "idle" || thread.status === "error") {
            const snapshot = this.requiredSnapshot(canvasId);
            const cancelled = snapshot.jobs.find(
              (job) =>
                job.state === "cancelled" &&
                job.startedAt !== null &&
                job.threadSettledAt === null,
            );
            if (cancelled !== undefined) {
              this.store.settleCancelledAgentTurn({
                jobId: cancelled.id,
                generation: cancelled.generation,
                agentThreadId: canvas.agentThreadId,
                expectedCanvasRevision: snapshot.canvas.revision,
              });
            }
            const latest = this.requiredSnapshot(canvasId);
            const interpreting = latest.jobs.find(
              (job) => job.state === "interpreting",
            );
            if (interpreting !== undefined) {
              this.store.failNonterminalJob({
                jobId: interpreting.id,
                generation: interpreting.generation,
                expectedState: "interpreting",
                agentThreadId: canvas.agentThreadId,
                expectedCanvasRevision: latest.canvas.revision,
                errorCode: "stale_interpreter_attempt",
                errorMessage:
                  "The server restarted after the interpreter turn settled; retry this card.",
              });
            }
            await this.dispatchNextLocked(canvasId);
          }
        } catch (error) {
          await this.failJobsForMissingThreadLocked(
            canvasId,
            canvas.agentThreadId,
            `The SceneSeed interpreter thread could not be reconciled: ${errorMessage(error)}`,
          );
        }
      });
    }
  }

  registerLifecycle(): void {
    const unsubscribeThreadChanges = this.bb.sdk.subscribe({
      event: "thread:changed",
      callback: (event) => {
        if (
          event.id === undefined ||
          !event.metadata?.eventTypes?.some((type) =>
            GENERATION_STREAM_EVENT_TYPES.includes(
              type as (typeof GENERATION_STREAM_EVENT_TYPES)[number],
            ),
          )
        ) {
          return;
        }
        if (this.store.getCanvasByAgentThreadId(event.id) !== null) {
          this.queueAgentStreamRead(event.id);
        }
      },
    });
    this.bb.onDispose(unsubscribeThreadChanges);
    this.bb.events.on("thread.idle", ({ thread }) =>
      this.reconcileThread(thread.id, "idle"),
    );
    this.bb.events.on("thread.failed", ({ thread, error }) =>
      this.reconcileThread(thread.id, "failed", error),
    );
    this.bb.events.on("thread.archived", ({ thread }) =>
      this.reconcileThread(
        thread.id,
        "unavailable",
        "The SceneSeed interpreter thread was archived.",
      ),
    );
    this.bb.events.on("thread.deleted", ({ thread }) =>
      this.reconcileThread(
        thread.id,
        "unavailable",
        "The SceneSeed interpreter thread was deleted.",
      ),
    );
    this.bb.background.service("scene-reconciler", {
      start: async (signal) => {
        await this.reconcileStartup();
        await abortWait(signal);
      },
    });
  }
}
