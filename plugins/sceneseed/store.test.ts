import Database from "better-sqlite3";
import { afterEach, describe, expect, it } from "vitest";
import type { SceneObjectV1 } from "./scene-contract.js";
import {
  SceneSeedStoreError,
  createSceneSeedStore,
  type SceneSeedStore,
} from "./store.js";

const databases: Database.Database[] = [];

afterEach(() => {
  for (const db of databases.splice(0)) db.close();
});

function setup() {
  const db = new Database(":memory:");
  databases.push(db);
  const store = createSceneSeedStore(db);
  return { db, store };
}

function sceneFixture(jobId: string, objectId: string): SceneObjectV1 {
  return {
    version: 1,
    jobId,
    objectId,
    name: "Rain jar",
    altText: "A blue jar holding a small rain cloud.",
    bounds: { width: 3, height: 4, depth: 3 },
    cameraHint: "three-quarter",
    palette: ["theme:accent", "#AACCEE"],
    material: { preset: "glass", opacity: 0.8 },
    nodes: [
      {
        kind: "mesh",
        id: "jar",
        parentId: null,
        position: [0, 1.5, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        paletteIndex: 1,
        geometry: "cylinder",
        size: { width: 2, height: 3, depth: 2 },
      },
    ],
    lights: [],
    motion: { preset: "none", speed: 0, amplitude: 0 },
    ground: { contactShadow: { strength: 0.6, softness: 0.7 } },
  };
}

function createCanvasWithAgent(store: SceneSeedStore) {
  const canvas = store.createCanvas({ id: "canvas_main", name: "Main" });
  return store.setCanvasAgentThreadId({
    canvasId: canvas.id,
    agentThreadId: "thr_agent",
    expectedRevision: canvas.revision,
  });
}

function queueAndClaim(store: SceneSeedStore) {
  let canvas = createCanvasWithAgent(store);
  const cardResult = store.createReadyCard({
    id: "card_one",
    canvasId: canvas.id,
    prompt: "a rainy thought in a jar",
    expectedRevision: canvas.revision,
  });
  const queued = store.queueCard({
    cardId: cardResult.card.id,
    objectId: "object_one",
    jobId: "job_one",
    placement: { x: 2, y: -3 },
    agentThreadId: "thr_agent",
    expectedRevision: cardResult.revision,
  });
  const claimed = store.claimNextQueuedJob({
    canvasId: canvas.id,
    agentThreadId: "thr_agent",
    expectedRevision: queued.revision,
  });
  if (claimed === null) throw new Error("expected queued job to be claimed");
  canvas = store.getCanvas(canvas.id)!;
  return { canvas, card: cardResult.card, queued, claimed };
}

function submitAndRealize(
  store: SceneSeedStore,
  makeScene: (jobId: string, objectId: string) => SceneObjectV1 = sceneFixture,
) {
  const { canvas, claimed } = queueAndClaim(store);
  const submitted = store.submitCandidate({
    candidateId: "scene_one",
    jobId: claimed.job.id,
    generation: claimed.job.generation,
    agentThreadId: "thr_agent",
    expectedCanvasRevision: canvas.revision,
    scene: makeScene(claimed.job.id, claimed.job.objectId),
  });
  const begun = store.beginRealization({
    candidateId: submitted.candidate.id,
    attemptId: "attempt_one",
    jobId: submitted.job.id,
    generation: submitted.job.generation,
    agentThreadId: "thr_agent",
    expectedCanvasRevision: submitted.revision,
  });
  const acknowledged = store.acknowledgeRealization({
    candidateId: submitted.candidate.id,
    attemptId: "attempt_one",
    jobId: submitted.job.id,
    generation: submitted.job.generation,
    agentThreadId: "thr_agent",
    expectedCanvasRevision: begun.revision,
    outcome: "success",
  });
  return { submitted, begun, acknowledged };
}

describe("SceneSeedStore", () => {
  it("migrates an actual in-memory SQLite database idempotently", () => {
    const { db } = setup();

    createSceneSeedStore(db);
    createSceneSeedStore(db);

    expect(
      db
        .prepare("SELECT COUNT(*) AS count FROM sceneseed_schema_version")
        .get(),
    ).toEqual({ count: 1 });
    expect(db.prepare("PRAGMA foreign_keys").get()).toEqual({
      foreign_keys: 1,
    });
  });

  it("persists canvas CRUD, disclosure acknowledgement, and clear-all scope", () => {
    const { store } = setup();
    const first = createCanvasWithAgent(store);
    const second = store.createCanvas({ id: "canvas_second", name: "Second" });

    expect(store.isDisclosureAcknowledged()).toBe(false);
    const acknowledgement = store.acknowledgeDisclosure();
    expect(acknowledgement.acknowledgedAt).toBeGreaterThan(0);
    expect(store.isDisclosureAcknowledged()).toBe(true);

    const renamed = store.renameCanvas({
      canvasId: second.id,
      name: "Quiet scene",
      expectedRevision: second.revision,
    });
    expect(renamed.name).toBe("Quiet scene");
    expect(store.listCanvases()).toHaveLength(2);

    expect(
      store.deleteCanvas({
        canvasId: renamed.id,
        expectedRevision: renamed.revision,
      }),
    ).toEqual({ deleted: true, agentThreadId: null });
    expect(store.clearAllCanvasData()).toEqual({
      deletedCanvasCount: 1,
      agentThreadIds: [first.agentThreadId],
    });
    expect(store.listCanvases()).toEqual([]);
    expect(store.isDisclosureAcknowledged()).toBe(true);
  });

  it("guards optimistic revisions and the canvas agent identity", () => {
    const { store } = setup();
    const canvas = createCanvasWithAgent(store);

    expect(() =>
      store.createReadyCard({
        canvasId: canvas.id,
        prompt: "one",
        expectedRevision: 0,
      }),
    ).toThrowError(expect.objectContaining({ code: "revision_conflict" }));

    const card = store.createReadyCard({
      canvasId: canvas.id,
      prompt: "one",
      expectedRevision: canvas.revision,
    });
    expect(() =>
      store.queueCard({
        cardId: card.card.id,
        placement: { x: 0, y: 0 },
        agentThreadId: "thr_intruder",
        expectedRevision: card.revision,
      }),
    ).toThrowError(expect.objectContaining({ code: "agent_thread_mismatch" }));
  });

  it("claims only one interpreting job and waits for a cancelled turn to settle", () => {
    const { store } = setup();
    let canvas = createCanvasWithAgent(store);
    const firstCard = store.createReadyCard({
      id: "card_first",
      canvasId: canvas.id,
      prompt: "first",
      expectedRevision: canvas.revision,
    });
    const first = store.queueCard({
      cardId: firstCard.card.id,
      objectId: "object_first",
      jobId: "job_first",
      placement: { x: 0, y: 0 },
      agentThreadId: "thr_agent",
      expectedRevision: firstCard.revision,
    });
    const secondCard = store.createReadyCard({
      id: "card_second",
      canvasId: canvas.id,
      prompt: "second",
      expectedRevision: first.revision,
    });
    const second = store.queueCard({
      cardId: secondCard.card.id,
      objectId: "object_second",
      jobId: "job_second",
      placement: { x: 1, y: 1 },
      agentThreadId: "thr_agent",
      expectedRevision: secondCard.revision,
    });

    const claimed = store.claimNextQueuedJob({
      canvasId: canvas.id,
      agentThreadId: "thr_agent",
      expectedRevision: second.revision,
    })!;
    expect(claimed.job.id).toBe("job_first");
    expect(
      store.claimNextQueuedJob({
        canvasId: canvas.id,
        agentThreadId: "thr_agent",
        expectedRevision: claimed.revision,
      }),
    ).toBeNull();

    const cancelled = store.cancelJob({
      jobId: claimed.job.id,
      generation: claimed.job.generation,
      expectedState: "interpreting",
      agentThreadId: "thr_agent",
      expectedCanvasRevision: claimed.revision,
    });
    expect(
      store.claimNextQueuedJob({
        canvasId: canvas.id,
        agentThreadId: "thr_agent",
        expectedRevision: cancelled.revision,
      }),
    ).toBeNull();
    const settled = store.settleCancelledAgentTurn({
      jobId: cancelled.job.id,
      generation: cancelled.job.generation,
      agentThreadId: "thr_agent",
      expectedCanvasRevision: cancelled.revision,
    });
    expect(
      store.claimNextQueuedJob({
        canvasId: canvas.id,
        agentThreadId: "thr_agent",
        expectedRevision: settled.revision,
      })?.job.id,
    ).toBe("job_second");
  });

  it("allows one actionable invalid correction and terminally rejects the second", () => {
    const { store } = setup();
    const { canvas, claimed } = queueAndClaim(store);

    const first = store.recordInvalidSubmission({
      jobId: claimed.job.id,
      generation: claimed.job.generation,
      agentThreadId: "thr_agent",
      expectedCanvasRevision: canvas.revision,
      errorMessage: "nodes.0.paletteIndex does not exist",
    });
    expect(first).toMatchObject({
      terminal: false,
      job: { state: "interpreting", invalidSubmissionAttempts: 1 },
    });
    const second = store.recordInvalidSubmission({
      jobId: claimed.job.id,
      generation: claimed.job.generation,
      agentThreadId: "thr_agent",
      expectedCanvasRevision: first.revision,
      errorMessage: "still invalid",
    });
    expect(second).toMatchObject({
      terminal: true,
      job: { state: "failed", invalidSubmissionAttempts: 2 },
    });
    expect(() =>
      store.submitCandidate({
        jobId: claimed.job.id,
        generation: claimed.job.generation,
        agentThreadId: "thr_agent",
        expectedCanvasRevision: second.revision,
        scene: sceneFixture(claimed.job.id, claimed.job.objectId),
      }),
    ).toThrowError(expect.objectContaining({ code: "invalid_state" }));
  });

  it("promotes only an acknowledged candidate and makes acknowledgements idempotent", () => {
    const { db, store } = setup();
    const { submitted, begun, acknowledged } = submitAndRealize(store);

    expect(acknowledged).toMatchObject({
      outcome: "complete",
      job: { state: "complete" },
      candidate: { state: "active" },
    });
    const snapshot = store.getCanvasSnapshot(acknowledged.job.canvasId)!;
    expect(snapshot.objects[0]?.activeSceneId).toBe(submitted.candidate.id);
    expect(snapshot.candidates[0]?.normalizedScene?.version).toBe(1);
    const stored = db
      .prepare<[string], { originalScene: string; normalizedScene: string }>(
        `SELECT original_scene_json AS originalScene,
                normalized_scene_json AS normalizedScene
         FROM sceneseed_candidates WHERE id = ?`,
      )
      .get(submitted.candidate.id);
    expect(stored).toBeDefined();
    expect(JSON.parse(stored!.originalScene).palette[1]).toBe("#AACCEE");
    expect(JSON.parse(stored!.normalizedScene).palette[1]).toBe("#aaccee");

    expect(
      store.acknowledgeRealization({
        candidateId: submitted.candidate.id,
        attemptId: "attempt_one",
        jobId: submitted.job.id,
        generation: submitted.job.generation,
        agentThreadId: "thr_agent",
        expectedCanvasRevision: begun.revision,
        outcome: "success",
      }),
    ).toMatchObject({
      outcome: "already_processed",
      revision: acknowledged.revision,
    });
  });

  it("reclaims an expired realization lease without stealing a live probe", () => {
    const { db, store } = setup();
    const { canvas, claimed } = queueAndClaim(store);
    const submitted = store.submitCandidate({
      candidateId: "scene_lease",
      jobId: claimed.job.id,
      generation: claimed.job.generation,
      agentThreadId: "thr_agent",
      expectedCanvasRevision: canvas.revision,
      scene: sceneFixture(claimed.job.id, claimed.job.objectId),
    });
    const begun = store.beginRealization({
      candidateId: submitted.candidate.id,
      attemptId: "attempt_live",
      jobId: submitted.job.id,
      generation: submitted.job.generation,
      agentThreadId: "thr_agent",
      expectedCanvasRevision: submitted.revision,
    });

    expect(() =>
      store.beginRealization({
        candidateId: submitted.candidate.id,
        attemptId: "attempt_too_soon",
        jobId: submitted.job.id,
        generation: submitted.job.generation,
        agentThreadId: "thr_agent",
        expectedCanvasRevision: begun.revision,
      }),
    ).toThrowError(expect.objectContaining({ code: "realization_busy" }));

    db.prepare(
      `UPDATE sceneseed_realization_receipts
       SET created_at = 0
       WHERE candidate_id = ? AND attempt_id = ?`,
    ).run(submitted.candidate.id, "attempt_live");
    const reclaimed = store.beginRealization({
      candidateId: submitted.candidate.id,
      attemptId: "attempt_reclaimed",
      jobId: submitted.job.id,
      generation: submitted.job.generation,
      agentThreadId: "thr_agent",
      expectedCanvasRevision: begun.revision,
    });

    expect(reclaimed).toMatchObject({
      alreadyProcessed: false,
      job: { state: "realizing" },
      revision: begun.revision + 1,
    });
    expect(
      db
        .prepare(
          `SELECT attempt_id, status
           FROM sceneseed_realization_receipts
           WHERE candidate_id = ? ORDER BY created_at, attempt_id`,
        )
        .all(submitted.candidate.id),
    ).toEqual([
      { attempt_id: "attempt_live", status: "failed" },
      { attempt_id: "attempt_reclaimed", status: "pending" },
    ]);
  });

  it("fails after two render probes while a remix keeps its prior active scene", () => {
    const { store } = setup();
    const initial = submitAndRealize(store);
    const priorSceneId = initial.submitted.candidate.id;
    const remix = store.queueRemix({
      objectId: initial.submitted.job.objectId,
      jobId: "job_remix",
      agentThreadId: "thr_agent",
      expectedRevision: initial.acknowledged.revision,
    });
    const claimed = store.claimNextQueuedJob({
      canvasId: remix.job.canvasId,
      agentThreadId: "thr_agent",
      expectedRevision: remix.revision,
    })!;
    const submitted = store.submitCandidate({
      candidateId: "scene_remix",
      jobId: claimed.job.id,
      generation: claimed.job.generation,
      agentThreadId: "thr_agent",
      expectedCanvasRevision: claimed.revision,
      scene: sceneFixture(claimed.job.id, claimed.job.objectId),
    });
    const firstBegin = store.beginRealization({
      candidateId: submitted.candidate.id,
      attemptId: "attempt_remix_one",
      jobId: submitted.job.id,
      generation: submitted.job.generation,
      agentThreadId: "thr_agent",
      expectedCanvasRevision: submitted.revision,
    });
    const firstFailure = store.acknowledgeRealization({
      candidateId: submitted.candidate.id,
      attemptId: "attempt_remix_one",
      jobId: submitted.job.id,
      generation: submitted.job.generation,
      agentThreadId: "thr_agent",
      expectedCanvasRevision: firstBegin.revision,
      outcome: "failure",
    });
    expect(firstFailure.outcome).toBe("retry");
    const secondBegin = store.beginRealization({
      candidateId: submitted.candidate.id,
      attemptId: "attempt_remix_two",
      jobId: submitted.job.id,
      generation: submitted.job.generation,
      agentThreadId: "thr_agent",
      expectedCanvasRevision: firstFailure.revision,
    });
    const secondFailure = store.acknowledgeRealization({
      candidateId: submitted.candidate.id,
      attemptId: "attempt_remix_two",
      jobId: submitted.job.id,
      generation: submitted.job.generation,
      agentThreadId: "thr_agent",
      expectedCanvasRevision: secondBegin.revision,
      outcome: "failure",
      errorMessage: "probe failed",
    });

    expect(secondFailure).toMatchObject({
      outcome: "failed",
      job: { state: "failed" },
      candidate: { state: "failed", realizationAttempts: 2 },
    });
    expect(
      store.getCanvasSnapshot(secondFailure.job.canvasId)?.objects[0]
        ?.activeSceneId,
    ).toBe(priorSceneId);
  });

  it("commits bounded transforms and removal without deleting source history", () => {
    const { store } = setup();
    const realized = submitAndRealize(store);
    const transformed = store.updateObjectTransform({
      objectId: realized.submitted.job.objectId,
      transform: {
        position: [4, 0, -2],
        rotation: [0, Math.PI / 2, 0],
        scale: [1.2, 1.2, 1.2],
      },
      expectedCanvasRevision: realized.acknowledged.revision,
    });
    expect(transformed.object.transform.position).toEqual([4, 0, -2]);
    const removed = store.removeObject({
      objectId: transformed.object.id,
      expectedCanvasRevision: transformed.revision,
    });
    expect(removed.object.removedAt).not.toBeNull();
    const snapshot = store.getCanvasSnapshot(removed.object.canvasId)!;
    expect(snapshot.cards[0]).toMatchObject({
      state: "ready",
      activeJobId: null,
    });
    expect(snapshot.candidates).toHaveLength(1);
    expect(snapshot.jobs).toHaveLength(1);
  });

  it("enforces the 25-object canvas ceiling transactionally", () => {
    const { store } = setup();
    const realized = submitAndRealize(store);
    let revision = realized.acknowledged.revision;

    for (let index = 1; index < 25; index += 1) {
      revision = store.duplicateObject({
        sourceObjectId: realized.submitted.job.objectId,
        objectId: `object_copy_${index}`,
        cardId: `card_copy_${index}`,
        jobId: `job_copy_${index}`,
        candidateId: `scene_copy_${index}`,
        expectedCanvasRevision: revision,
      }).revision;
    }

    expect(store.listCanvases()[0]).toMatchObject({
      objectCount: 25,
      activeCost: 50,
    });
    expect(() =>
      store.duplicateObject({
        sourceObjectId: realized.submitted.job.objectId,
        expectedCanvasRevision: revision,
      }),
    ).toThrowError(expect.objectContaining({ code: "canvas_object_limit" }));
  });

  it("enforces the 100-unit canvas cost ceiling transactionally", () => {
    const { store } = setup();
    const realized = submitAndRealize(store, (jobId, objectId) => ({
      ...sceneFixture(jobId, objectId),
      material: { preset: "matte", opacity: 1 },
      nodes: Array.from({ length: 8 }, (_, index) => ({
        kind: "mesh" as const,
        id: `torus_${index}`,
        parentId: null,
        position: [0, 0, 0] as [number, number, number],
        rotation: [0, 0, 0] as [number, number, number],
        scale: [1, 1, 1] as [number, number, number],
        paletteIndex: 0,
        geometry: "torus" as const,
        size: { width: 1, height: 1, depth: 1 },
      })),
    }));
    let revision = realized.acknowledged.revision;

    for (let index = 1; index < 20; index += 1) {
      revision = store.duplicateObject({
        sourceObjectId: realized.submitted.job.objectId,
        objectId: `cost_object_${index}`,
        cardId: `cost_card_${index}`,
        jobId: `cost_job_${index}`,
        candidateId: `cost_scene_${index}`,
        expectedCanvasRevision: revision,
      }).revision;
    }

    expect(store.listCanvases()[0]).toMatchObject({
      objectCount: 20,
      activeCost: 100,
    });
    expect(() =>
      store.duplicateObject({
        sourceObjectId: realized.submitted.job.objectId,
        expectedCanvasRevision: revision,
      }),
    ).toThrowError(expect.objectContaining({ code: "canvas_cost_limit" }));
  });

  it("replaces a lost canvas thread only after nonterminal jobs settle", () => {
    const { store } = setup();
    const { canvas, claimed } = queueAndClaim(store);

    expect(() =>
      store.replaceCanvasAgentThreadId({
        canvasId: canvas.id,
        agentThreadId: "thr_replacement",
        expectedRevision: canvas.revision,
      }),
    ).toThrowError(expect.objectContaining({ code: "invalid_state" }));
    const failed = store.failNonterminalJob({
      jobId: claimed.job.id,
      generation: claimed.job.generation,
      expectedState: "interpreting",
      agentThreadId: "thr_agent",
      expectedCanvasRevision: canvas.revision,
      errorCode: "thread_missing",
      errorMessage: "Hidden thread no longer exists",
    });
    const cleared = store.replaceCanvasAgentThreadId({
      canvasId: canvas.id,
      agentThreadId: null,
      expectedRevision: failed.revision,
    });
    const replaced = store.replaceCanvasAgentThreadId({
      canvasId: canvas.id,
      agentThreadId: "thr_replacement",
      expectedRevision: cleared.revision,
    });

    expect(replaced.agentThreadId).toBe("thr_replacement");
    expect(store.getJob(claimed.job.id)?.agentThreadId).toBe("thr_agent");
  });

  it("returns only strict JSON-safe DTO data", () => {
    const { store } = setup();
    const realized = submitAndRealize(store);
    const snapshot = store.getCanvasSnapshot(
      realized.acknowledged.job.canvasId,
    );

    expect(() => JSON.stringify(snapshot)).not.toThrow();
    expect(JSON.parse(JSON.stringify(snapshot))).toEqual(snapshot);
    expect(snapshot).not.toBeInstanceOf(Database);
  });
});
