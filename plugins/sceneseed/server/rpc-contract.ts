import { defineRpcContract } from "@get-bb/plugin-sdk";
import { z } from "zod";
import { sceneObjectV1Schema } from "../scene-contract.js";

const idSchema = z.string().min(1).max(128);
const revisionSchema = z.number().int().min(0);
const timestampSchema = z.number().int().min(0);

const placementSchema = z
  .object({
    x: z.number().finite().min(-50).max(50),
    y: z.number().finite().min(-50).max(50),
  })
  .strict();

const transformSchema = z
  .object({
    position: z.tuple([
      z.number().finite(),
      z.number().finite(),
      z.number().finite(),
    ]),
    rotation: z.tuple([
      z.number().finite(),
      z.number().finite(),
      z.number().finite(),
    ]),
    scale: z.tuple([
      z.number().finite(),
      z.number().finite(),
      z.number().finite(),
    ]),
  })
  .strict();

const canvasSchema = z
  .object({
    id: idSchema,
    name: z.string(),
    schemaVersion: z.number().int().min(1),
    revision: revisionSchema,
    agentThreadId: z.string().nullable(),
    createdAt: timestampSchema,
    updatedAt: timestampSchema,
  })
  .strict();

const canvasSummarySchema = canvasSchema.extend({
  objectCount: z.number().int().min(0),
  activeCost: z.number().min(0),
});

const cardSchema = z
  .object({
    id: idSchema,
    canvasId: idSchema,
    prompt: z.string(),
    state: z.enum([
      "ready",
      "queued",
      "interpreting",
      "realizing",
      "complete",
      "cancelled",
      "failed",
    ]),
    order: z.number().int().min(0),
    placement: placementSchema.nullable(),
    activeJobId: idSchema.nullable(),
    createdAt: timestampSchema,
    updatedAt: timestampSchema,
  })
  .strict();

const jobSchema = z
  .object({
    id: idSchema,
    canvasId: idSchema,
    cardId: idSchema,
    objectId: idSchema,
    generation: z.number().int().min(1),
    state: z.enum([
      "queued",
      "interpreting",
      "candidate_ready",
      "realizing",
      "complete",
      "cancelled",
      "failed",
      "superseded",
    ]),
    agentThreadId: z.string(),
    invalidSubmissionAttempts: z.number().int().min(0).max(2),
    errorCode: z.string().nullable(),
    errorMessage: z.string().nullable(),
    startedAt: timestampSchema.nullable(),
    finishedAt: timestampSchema.nullable(),
    threadSettledAt: timestampSchema.nullable(),
    createdAt: timestampSchema,
    updatedAt: timestampSchema,
  })
  .strict();

const objectSchema = z
  .object({
    id: idSchema,
    canvasId: idSchema,
    sourceCardId: idSchema,
    activeSceneId: idSchema.nullable(),
    activeJobId: idSchema.nullable(),
    transform: transformSchema,
    order: z.number().int().min(0),
    removedAt: timestampSchema.nullable(),
    createdAt: timestampSchema,
    updatedAt: timestampSchema,
  })
  .strict();

const candidateSchema = z
  .object({
    id: idSchema,
    canvasId: idSchema,
    jobId: idSchema,
    objectId: idSchema,
    generation: z.number().int().min(1),
    originalScene: sceneObjectV1Schema.nullable(),
    normalizedScene: sceneObjectV1Schema.nullable(),
    sceneVersion: z.number().int().min(1),
    cost: z.number().min(0),
    state: z.enum(["pending", "active", "failed", "superseded"]),
    realizationAttempts: z.number().int().min(0).max(2),
    realizedAt: timestampSchema.nullable(),
    readError: z.string().nullable(),
    createdAt: timestampSchema,
    updatedAt: timestampSchema,
  })
  .strict();

const snapshotSchema = z
  .object({
    canvas: canvasSchema,
    cards: z.array(cardSchema),
    objects: z.array(objectSchema),
    jobs: z.array(jobSchema),
    candidates: z.array(candidateSchema),
  })
  .strict();

const snapshotOutput = z.object({ snapshot: snapshotSchema }).strict();

export const rpcContract = defineRpcContract({
  listCanvases: {
    input: z.null(),
    output: z
      .object({
        canvases: z.array(canvasSummarySchema),
        disclosureAcknowledged: z.boolean(),
      })
      .strict(),
  },
  getCanvas: {
    input: z.object({ canvasId: idSchema }).strict(),
    output: z.object({ snapshot: snapshotSchema.nullable() }).strict(),
  },
  createCanvas: {
    input: z.object({ name: z.string().trim().min(1).max(80) }).strict(),
    output: snapshotOutput,
  },
  renameCanvas: {
    input: z
      .object({
        canvasId: idSchema,
        name: z.string().trim().min(1).max(80),
        expectedRevision: revisionSchema,
      })
      .strict(),
    output: snapshotOutput,
  },
  acknowledgeDisclosure: {
    input: z.null(),
    output: z.object({ acknowledgedAt: timestampSchema }).strict(),
  },
  createCard: {
    input: z
      .object({
        canvasId: idSchema,
        prompt: z.string().trim().min(1).max(500),
        expectedRevision: revisionSchema,
      })
      .strict(),
    output: snapshotOutput.extend({ cardId: idSchema }),
  },
  placeCard: {
    input: z
      .object({
        canvasId: idSchema,
        cardId: idSchema,
        placement: placementSchema,
        expectedRevision: revisionSchema,
      })
      .strict(),
    output: snapshotOutput.extend({ jobId: idSchema }),
  },
  remixObject: {
    input: z
      .object({
        canvasId: idSchema,
        objectId: idSchema,
        expectedRevision: revisionSchema,
      })
      .strict(),
    output: snapshotOutput.extend({ jobId: idSchema }),
  },
  beginRealization: {
    input: z
      .object({
        candidateId: idSchema,
        attemptId: idSchema,
        jobId: idSchema,
        generation: z.number().int().min(1),
        expectedCanvasRevision: revisionSchema,
      })
      .strict(),
    output: snapshotOutput.extend({ alreadyProcessed: z.boolean() }),
  },
  acknowledgeRealization: {
    input: z
      .object({
        candidateId: idSchema,
        attemptId: idSchema,
        jobId: idSchema,
        generation: z.number().int().min(1),
        expectedCanvasRevision: revisionSchema,
        outcome: z.enum(["success", "failure"]),
        errorMessage: z.string().max(1_000).optional(),
      })
      .strict(),
    output: snapshotOutput.extend({
      outcome: z.enum(["complete", "retry", "failed", "already_processed"]),
    }),
  },
  updateObjectTransform: {
    input: z
      .object({
        canvasId: idSchema,
        objectId: idSchema,
        transform: transformSchema,
        expectedCanvasRevision: revisionSchema,
      })
      .strict(),
    output: snapshotOutput,
  },
  duplicateObject: {
    input: z
      .object({
        canvasId: idSchema,
        sourceObjectId: idSchema,
        expectedCanvasRevision: revisionSchema,
        transform: transformSchema.optional(),
      })
      .strict(),
    output: snapshotOutput.extend({ objectId: idSchema, cardId: idSchema }),
  },
  cancelJob: {
    input: z.object({ jobId: idSchema }).strict(),
    output: snapshotOutput,
  },
  removeObject: {
    input: z
      .object({
        canvasId: idSchema,
        objectId: idSchema,
        expectedCanvasRevision: revisionSchema,
      })
      .strict(),
    output: snapshotOutput,
  },
  deleteCanvas: {
    input: z
      .object({ canvasId: idSchema, expectedRevision: revisionSchema })
      .strict(),
    output: z
      .object({
        deleted: z.boolean(),
        threadCleanupFailed: z.boolean(),
      })
      .strict(),
  },
  clearAllCanvasData: {
    input: z.null(),
    output: z
      .object({
        deletedCanvasCount: z.number().int().min(0),
        failedThreadIds: z.array(z.string()),
      })
      .strict(),
  },
});

export type SceneSeedRpcContract = typeof rpcContract;
