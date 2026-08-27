import type { BbPluginApi } from "@get-bb/plugin-sdk";
import { z } from "zod";
import {
  sceneObjectV1Schema,
  safeNormalizeSceneObjectV1,
  type SceneContractIssue,
} from "../scene-contract.js";
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

const submitEnvelopeSchema = z.object({ scene: z.unknown() }).strict();

export const submitSceneObjectParameters = z.toJSONSchema(
  z.object({ scene: sceneObjectV1Schema }).strict(),
  { io: "input", target: "draft-7" },
) as Record<string, unknown>;
const SETTLED_JOB_STATES = new Set(["complete", "failed", "superseded"]);

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

  private requireDisclosure(): void {
    if (!this.store.isDisclosureAcknowledged()) {
      throw new SceneSeedStoreError(
        "invalid_state",
        "Acknowledge the SceneSeed agent and retention disclosure before generating.",
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

  private async ensureAgentThreadLocked(canvasId: string): Promise<string> {
    const current = this.store.getCanvas(canvasId);
    if (current === null) {
      throw new SceneSeedStoreError(
        "not_found",
        `canvas ${canvasId} was not found`,
      );
    }
    if (current.agentThreadId !== null) return current.agentThreadId;

    const projectId = await this.personalProjectId();
    const thread = await this.bb.sdk.threads.spawn({
      projectId,
      environment: { type: "project-default" },
      prompt:
        "Initialize a SceneSeed canvas interpreter. Do not inspect files, use network access, or call tools in this initialization turn. Reply only READY.",
      title: `SceneSeed: ${current.name}`,
      visibility: "hidden",
      permissionMode: "accept-edits",
      origin: "plugin",
      originPluginId: this.bb.pluginId,
    });
    const bound = this.store.setCanvasAgentThreadId({
      canvasId,
      agentThreadId: thread.id,
      expectedRevision: current.revision,
    });
    this.publishCanvas(canvasId, bound.revision);
    return thread.id;
  }

  private buildJobPrompt(snapshot: CanvasSnapshotDto, job: JobDto): string {
    const card = snapshot.cards.find((entry) => entry.id === job.cardId);
    const object = snapshot.objects.find((entry) => entry.id === job.objectId);
    if (card === undefined || object === undefined || card.placement === null) {
      throw new Error(
        `SceneSeed job ${job.id} is missing its card or placement`,
      );
    }
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
          entry.id !== object.id &&
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
    return [
      "Interpret this SceneSeed job using the sceneseed-interpreter skill.",
      "Use only the submit_scene_object tool. Do not inspect files, use network access, or call unrelated tools.",
      "Call submit_scene_object once with a valid scene. If it returns validation issues, correct them and call it one final time. End without prose after one scene is accepted.",
      JSON.stringify({
        jobId: job.id,
        objectId: job.objectId,
        generation: job.generation,
        prompt: card.prompt,
        placement: card.placement,
        nearby,
      }),
    ].join("\n\n");
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
      });
    } catch (error) {
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
      this.requireDisclosure();
      this.assertRevision(input.canvasId, input.expectedRevision);
      this.assertCardOnCanvas(input.canvasId, input.cardId);
      const threadId = await this.ensureAgentThreadLocked(input.canvasId);
      const canvas = this.store.getCanvas(input.canvasId)!;
      const queued = this.store.queueCard({
        cardId: input.cardId,
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
      this.requireDisclosure();
      this.assertRevision(input.canvasId, input.expectedRevision);
      this.assertObjectOnCanvas(input.canvasId, input.objectId);
      const threadId = await this.ensureAgentThreadLocked(input.canvasId);
      const canvas = this.store.getCanvas(input.canvasId)!;
      const queued = this.store.queueRemix({
        objectId: input.objectId,
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
    return this.withCanvasLock(candidate.canvasId, () => {
      const canvas = this.store.getCanvas(candidate.canvasId);
      if (canvas?.agentThreadId === null || canvas === null) {
        throw new SceneSeedStoreError(
          "invalid_state",
          "canvas has no interpreter thread",
        );
      }
      const result = this.store.beginRealization({
        ...input,
        agentThreadId: canvas.agentThreadId,
      });
      this.publishCanvas(candidate.canvasId, result.revision, input.jobId);
      return {
        alreadyProcessed: result.alreadyProcessed,
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
      let normalized: ReturnType<typeof safeNormalizeSceneObjectV1> | undefined;
      if (!envelope.success) {
        issues = envelopeIssues(envelope.error);
      } else {
        normalized = safeNormalizeSceneObjectV1(envelope.data.scene);
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
        return {
          content: [
            {
              type: "text" as const,
              text: result.terminal
                ? `Rejected: the second invalid submission failed this job.\n${message}`
                : `Invalid scene. Correct every issue and call submit_scene_object one final time.\n${message}`,
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
      this.publishCanvas(canvas.id, result.revision, current.id);
      return JSON.stringify({
        accepted: true,
        jobId: current.id,
        candidateId: result.candidate.id,
        revision: result.revision,
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
