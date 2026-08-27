import { randomUUID } from "node:crypto";
import type Database from "better-sqlite3";
import { z } from "zod";
import {
  MAX_CANVAS_COST,
  MAX_CANVAS_OBJECTS,
  SCENE_OBJECT_VERSION,
  calculateSceneCost,
  normalizeSceneObjectV1,
  safeNormalizeSceneObjectV1,
  type SceneObjectV1,
} from "./scene-contract.js";

type PluginDatabase = Database.Database;

export const MAX_IN_FLIGHT_CARDS = 12;
export const REALIZATION_LEASE_MS = 30_000;

export const CARD_STATES = [
  "ready",
  "queued",
  "interpreting",
  "realizing",
  "complete",
  "cancelled",
  "failed",
] as const;
export type CardState = (typeof CARD_STATES)[number];

export const JOB_STATES = [
  "queued",
  "interpreting",
  "candidate_ready",
  "realizing",
  "complete",
  "cancelled",
  "failed",
  "superseded",
] as const;
export type JobState = (typeof JOB_STATES)[number];
export type NonterminalJobState = Extract<
  JobState,
  "queued" | "interpreting" | "candidate_ready" | "realizing"
>;

export type CandidateState = "pending" | "active" | "failed" | "superseded";

export interface Placement {
  x: number;
  y: number;
}

export interface Transform3D {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
}

export interface CanvasDto {
  id: string;
  name: string;
  schemaVersion: number;
  revision: number;
  agentThreadId: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface CanvasSummaryDto extends CanvasDto {
  objectCount: number;
  activeCost: number;
}

export interface CardDto {
  id: string;
  canvasId: string;
  prompt: string;
  state: CardState;
  order: number;
  placement: Placement | null;
  activeJobId: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface JobDto {
  id: string;
  canvasId: string;
  cardId: string;
  objectId: string;
  generation: number;
  state: JobState;
  agentThreadId: string;
  invalidSubmissionAttempts: number;
  errorCode: string | null;
  errorMessage: string | null;
  startedAt: number | null;
  finishedAt: number | null;
  threadSettledAt: number | null;
  createdAt: number;
  updatedAt: number;
}

export interface ObjectDto {
  id: string;
  canvasId: string;
  sourceCardId: string;
  activeSceneId: string | null;
  activeJobId: string | null;
  transform: Transform3D;
  order: number;
  removedAt: number | null;
  createdAt: number;
  updatedAt: number;
}

export interface SceneCandidateDto {
  id: string;
  canvasId: string;
  jobId: string;
  objectId: string;
  generation: number;
  originalScene: SceneObjectV1 | null;
  normalizedScene: SceneObjectV1 | null;
  sceneVersion: number;
  cost: number;
  state: CandidateState;
  realizationAttempts: number;
  realizedAt: number | null;
  readError: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface CanvasSnapshotDto {
  canvas: CanvasDto;
  cards: CardDto[];
  objects: ObjectDto[];
  jobs: JobDto[];
  candidates: SceneCandidateDto[];
}

export class SceneSeedStoreError extends Error {
  constructor(
    readonly code:
      | "not_found"
      | "revision_conflict"
      | "invalid_state"
      | "invalid_input"
      | "agent_thread_mismatch"
      | "in_flight_limit"
      | "canvas_object_limit"
      | "canvas_cost_limit"
      | "realization_busy"
      | "idempotency_conflict",
    message: string,
  ) {
    super(message);
    this.name = "SceneSeedStoreError";
  }
}

const promptSchema = z.string().trim().min(1).max(500);
const nameSchema = z.string().trim().min(1).max(80);
const idSchema = z
  .string()
  .min(1)
  .max(80)
  .regex(/^[A-Za-z0-9][A-Za-z0-9_-]*$/);
const threadIdSchema = z
  .string()
  .min(5)
  .max(128)
  .regex(/^thr_[A-Za-z0-9_-]+$/);
const finitePlacementSchema = z
  .object({
    x: z.number().finite().min(-50).max(50),
    y: z.number().finite().min(-50).max(50),
  })
  .strict();
const transformSchema = z
  .object({
    position: z.tuple([
      z.number().finite().min(-50).max(50),
      z.number().finite().min(-50).max(50),
      z.number().finite().min(-50).max(50),
    ]),
    rotation: z.tuple([
      z
        .number()
        .finite()
        .min(-Math.PI * 2)
        .max(Math.PI * 2),
      z
        .number()
        .finite()
        .min(-Math.PI * 2)
        .max(Math.PI * 2),
      z
        .number()
        .finite()
        .min(-Math.PI * 2)
        .max(Math.PI * 2),
    ]),
    scale: z.tuple([
      z.number().finite().min(0.05).max(10),
      z.number().finite().min(0.05).max(10),
      z.number().finite().min(0.05).max(10),
    ]),
  })
  .strict();

export const DEFAULT_TRANSFORM: Transform3D = {
  position: [0, 0, 0],
  rotation: [0, 0, 0],
  scale: [1, 1, 1],
};

interface CanvasRow {
  id: string;
  name: string;
  schema_version: number;
  revision: number;
  agent_thread_id: string | null;
  created_at: number;
  updated_at: number;
}

interface CanvasSummaryRow extends CanvasRow {
  object_count: number;
  active_cost: number;
}

interface CardRow {
  id: string;
  canvas_id: string;
  prompt: string;
  state: CardState;
  order_index: number;
  placement_x: number | null;
  placement_y: number | null;
  active_job_id: string | null;
  created_at: number;
  updated_at: number;
}

interface JobRow {
  id: string;
  canvas_id: string;
  card_id: string;
  object_id: string;
  generation: number;
  state: JobState;
  agent_thread_id: string;
  invalid_submission_attempts: number;
  error_code: string | null;
  error_message: string | null;
  started_at: number | null;
  finished_at: number | null;
  thread_settled_at: number | null;
  created_at: number;
  updated_at: number;
}

interface ObjectRow {
  id: string;
  canvas_id: string;
  source_card_id: string;
  active_scene_id: string | null;
  active_job_id: string | null;
  transform_json: string;
  order_index: number;
  removed_at: number | null;
  created_at: number;
  updated_at: number;
}

interface CandidateRow {
  id: string;
  canvas_id: string;
  job_id: string;
  object_id: string;
  generation: number;
  original_scene_json: string;
  normalized_scene_json: string;
  scene_version: number;
  cost: number;
  state: CandidateState;
  realization_attempts: number;
  realized_at: number | null;
  created_at: number;
  updated_at: number;
}

interface RealizationReceiptRow {
  candidate_id: string;
  attempt_id: string;
  status: "pending" | "succeeded" | "failed";
  created_at: number;
}

interface CountRow {
  count: number;
}

interface CostRow {
  cost: number;
}

interface GenerationRow {
  generation: number;
}

interface DisclosureRow {
  disclosure_acknowledged_at: number | null;
}

function createId(prefix: string): string {
  return `${prefix}_${randomUUID().replaceAll("-", "")}`;
}

function nowMs(): number {
  return Date.now();
}

function parseId(value: string, field: string): string {
  const result = idSchema.safeParse(value);
  if (!result.success) {
    throw new SceneSeedStoreError("invalid_input", `${field} is invalid`);
  }
  return result.data;
}

function parseThreadId(value: string): string {
  const result = threadIdSchema.safeParse(value);
  if (!result.success) {
    throw new SceneSeedStoreError(
      "invalid_input",
      "agentThreadId must be a bb thr_* id",
    );
  }
  return result.data;
}

function serializeOriginalScene(input: unknown): string {
  try {
    const serialized = JSON.stringify(input);
    if (serialized === undefined) throw new Error("not JSON serializable");
    return serialized;
  } catch {
    throw new SceneSeedStoreError(
      "invalid_input",
      "scene must be a finite, acyclic JSON value",
    );
  }
}

function canvasFromRow(row: CanvasRow): CanvasDto {
  return {
    id: row.id,
    name: row.name,
    schemaVersion: row.schema_version,
    revision: row.revision,
    agentThreadId: row.agent_thread_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function cardFromRow(row: CardRow): CardDto {
  return {
    id: row.id,
    canvasId: row.canvas_id,
    prompt: row.prompt,
    state: row.state,
    order: row.order_index,
    placement:
      row.placement_x === null || row.placement_y === null
        ? null
        : { x: row.placement_x, y: row.placement_y },
    activeJobId: row.active_job_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function jobFromRow(row: JobRow): JobDto {
  return {
    id: row.id,
    canvasId: row.canvas_id,
    cardId: row.card_id,
    objectId: row.object_id,
    generation: row.generation,
    state: row.state,
    agentThreadId: row.agent_thread_id,
    invalidSubmissionAttempts: row.invalid_submission_attempts,
    errorCode: row.error_code,
    errorMessage: row.error_message,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    threadSettledAt: row.thread_settled_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function objectFromRow(row: ObjectRow): ObjectDto {
  const parsed = transformSchema.safeParse(JSON.parse(row.transform_json));
  if (!parsed.success) {
    throw new SceneSeedStoreError(
      "invalid_input",
      `stored transform for object ${row.id} is invalid`,
    );
  }
  return {
    id: row.id,
    canvasId: row.canvas_id,
    sourceCardId: row.source_card_id,
    activeSceneId: row.active_scene_id,
    activeJobId: row.active_job_id,
    transform: parsed.data,
    order: row.order_index,
    removedAt: row.removed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function candidateFromRow(row: CandidateRow): SceneCandidateDto {
  let originalScene: SceneObjectV1 | null = null;
  let normalizedScene: SceneObjectV1 | null = null;
  let readError: string | null = null;
  try {
    const originalResult = safeNormalizeSceneObjectV1(
      JSON.parse(row.original_scene_json),
    );
    const normalizedResult = safeNormalizeSceneObjectV1(
      JSON.parse(row.normalized_scene_json),
    );
    if (!originalResult.success || !normalizedResult.success) {
      readError = "Stored scene no longer matches its retained schema version.";
    } else {
      originalScene = originalResult.scene;
      normalizedScene = normalizedResult.scene;
    }
  } catch {
    readError = "Stored scene data could not be parsed.";
  }
  return {
    id: row.id,
    canvasId: row.canvas_id,
    jobId: row.job_id,
    objectId: row.object_id,
    generation: row.generation,
    originalScene,
    normalizedScene,
    sceneVersion: row.scene_version,
    cost: row.cost,
    state: row.state,
    realizationAttempts: row.realization_attempts,
    realizedAt: row.realized_at,
    readError,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const SCENESEED_MIGRATIONS = [
  `
    CREATE TABLE IF NOT EXISTS sceneseed_canvases (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      schema_version INTEGER NOT NULL CHECK (schema_version >= 1),
      revision INTEGER NOT NULL DEFAULT 0 CHECK (revision >= 0),
      agent_thread_id TEXT UNIQUE,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      CHECK (agent_thread_id IS NULL OR agent_thread_id GLOB 'thr_*')
    );

    CREATE TABLE IF NOT EXISTS sceneseed_cards (
      id TEXT PRIMARY KEY,
      canvas_id TEXT NOT NULL REFERENCES sceneseed_canvases(id) ON DELETE CASCADE,
      prompt TEXT NOT NULL CHECK (length(prompt) BETWEEN 1 AND 500),
      state TEXT NOT NULL CHECK (state IN ('ready', 'queued', 'interpreting', 'realizing', 'complete', 'cancelled', 'failed')),
      order_index INTEGER NOT NULL CHECK (order_index >= 0),
      placement_x REAL,
      placement_y REAL,
      active_job_id TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      CHECK ((placement_x IS NULL) = (placement_y IS NULL))
    );

    CREATE TABLE IF NOT EXISTS sceneseed_objects (
      id TEXT PRIMARY KEY,
      canvas_id TEXT NOT NULL REFERENCES sceneseed_canvases(id) ON DELETE CASCADE,
      source_card_id TEXT NOT NULL UNIQUE REFERENCES sceneseed_cards(id) ON DELETE CASCADE,
      active_scene_id TEXT,
      active_job_id TEXT,
      transform_json TEXT NOT NULL CHECK (json_valid(transform_json)),
      order_index INTEGER NOT NULL CHECK (order_index >= 0),
      removed_at INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sceneseed_jobs (
      id TEXT PRIMARY KEY,
      canvas_id TEXT NOT NULL REFERENCES sceneseed_canvases(id) ON DELETE CASCADE,
      card_id TEXT NOT NULL REFERENCES sceneseed_cards(id) ON DELETE CASCADE,
      object_id TEXT NOT NULL REFERENCES sceneseed_objects(id) ON DELETE CASCADE,
      generation INTEGER NOT NULL CHECK (generation >= 1),
      state TEXT NOT NULL CHECK (state IN ('queued', 'interpreting', 'candidate_ready', 'realizing', 'complete', 'cancelled', 'failed', 'superseded')),
      agent_thread_id TEXT NOT NULL CHECK (agent_thread_id GLOB 'thr_*'),
      invalid_submission_attempts INTEGER NOT NULL DEFAULT 0 CHECK (invalid_submission_attempts BETWEEN 0 AND 2),
      error_code TEXT,
      error_message TEXT,
      started_at INTEGER,
      finished_at INTEGER,
      thread_settled_at INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      UNIQUE (object_id, generation)
    );

    CREATE TABLE IF NOT EXISTS sceneseed_candidates (
      id TEXT PRIMARY KEY,
      canvas_id TEXT NOT NULL REFERENCES sceneseed_canvases(id) ON DELETE CASCADE,
      job_id TEXT NOT NULL UNIQUE REFERENCES sceneseed_jobs(id) ON DELETE CASCADE,
      object_id TEXT NOT NULL REFERENCES sceneseed_objects(id) ON DELETE CASCADE,
      generation INTEGER NOT NULL CHECK (generation >= 1),
      original_scene_json TEXT NOT NULL CHECK (json_valid(original_scene_json)),
      normalized_scene_json TEXT NOT NULL CHECK (json_valid(normalized_scene_json)),
      scene_version INTEGER NOT NULL CHECK (scene_version >= 1),
      cost INTEGER NOT NULL CHECK (cost BETWEEN 1 AND 10),
      state TEXT NOT NULL CHECK (state IN ('pending', 'active', 'failed', 'superseded')),
      realization_attempts INTEGER NOT NULL DEFAULT 0 CHECK (realization_attempts BETWEEN 0 AND 2),
      realized_at INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      UNIQUE (object_id, generation)
    );

    CREATE TABLE IF NOT EXISTS sceneseed_realization_receipts (
      candidate_id TEXT NOT NULL REFERENCES sceneseed_candidates(id) ON DELETE CASCADE,
      attempt_id TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed')),
      created_at INTEGER NOT NULL,
      completed_at INTEGER,
      PRIMARY KEY (candidate_id, attempt_id)
    );

    CREATE TABLE IF NOT EXISTS sceneseed_plugin_state (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      disclosure_acknowledged_at INTEGER
    );
    INSERT OR IGNORE INTO sceneseed_plugin_state (id, disclosure_acknowledged_at)
    VALUES (1, NULL);

    CREATE INDEX IF NOT EXISTS sceneseed_cards_canvas_order_idx
      ON sceneseed_cards(canvas_id, order_index, id);
    CREATE INDEX IF NOT EXISTS sceneseed_objects_canvas_order_idx
      ON sceneseed_objects(canvas_id, removed_at, order_index, id);
    CREATE INDEX IF NOT EXISTS sceneseed_jobs_canvas_queue_idx
      ON sceneseed_jobs(canvas_id, state, created_at, id);
    CREATE INDEX IF NOT EXISTS sceneseed_jobs_thread_state_idx
      ON sceneseed_jobs(agent_thread_id, state, updated_at, id);
    CREATE INDEX IF NOT EXISTS sceneseed_candidates_object_state_idx
      ON sceneseed_candidates(object_id, state, generation);
    CREATE UNIQUE INDEX IF NOT EXISTS sceneseed_one_pending_realization_idx
      ON sceneseed_realization_receipts(candidate_id)
      WHERE status = 'pending';
  `,
] as const;

export function migrateSceneSeedDatabase(db: PluginDatabase): void {
  db.pragma("foreign_keys = ON");
  db.exec(`
    CREATE TABLE IF NOT EXISTS sceneseed_schema_version (
      version INTEGER PRIMARY KEY,
      applied_at INTEGER NOT NULL
    )
  `);
  const hasVersion = db.prepare<[number], { found: number }>(
    "SELECT 1 AS found FROM sceneseed_schema_version WHERE version = ?",
  );
  const recordVersion = db.prepare<[number, number]>(
    "INSERT INTO sceneseed_schema_version (version, applied_at) VALUES (?, ?)",
  );
  db.transaction(() => {
    for (const [index, migration] of SCENESEED_MIGRATIONS.entries()) {
      const version = index + 1;
      if (hasVersion.get(version) !== undefined) continue;
      db.exec(migration);
      recordVersion.run(version, nowMs());
    }
  })();
}

function requiredCanvas(db: PluginDatabase, canvasId: string): CanvasRow {
  const row = db
    .prepare<
      [string],
      CanvasRow
    >("SELECT * FROM sceneseed_canvases WHERE id = ?")
    .get(canvasId);
  if (row === undefined) {
    throw new SceneSeedStoreError(
      "not_found",
      `canvas ${canvasId} was not found`,
    );
  }
  return row;
}

function requiredCard(db: PluginDatabase, cardId: string): CardRow {
  const row = db
    .prepare<[string], CardRow>("SELECT * FROM sceneseed_cards WHERE id = ?")
    .get(cardId);
  if (row === undefined) {
    throw new SceneSeedStoreError("not_found", `card ${cardId} was not found`);
  }
  return row;
}

function requiredObject(db: PluginDatabase, objectId: string): ObjectRow {
  const row = db
    .prepare<
      [string],
      ObjectRow
    >("SELECT * FROM sceneseed_objects WHERE id = ?")
    .get(objectId);
  if (row === undefined) {
    throw new SceneSeedStoreError(
      "not_found",
      `object ${objectId} was not found`,
    );
  }
  return row;
}

function requiredJob(db: PluginDatabase, jobId: string): JobRow {
  const row = db
    .prepare<[string], JobRow>("SELECT * FROM sceneseed_jobs WHERE id = ?")
    .get(jobId);
  if (row === undefined) {
    throw new SceneSeedStoreError("not_found", `job ${jobId} was not found`);
  }
  return row;
}

function requiredCandidate(
  db: PluginDatabase,
  candidateId: string,
): CandidateRow {
  const row = db
    .prepare<
      [string],
      CandidateRow
    >("SELECT * FROM sceneseed_candidates WHERE id = ?")
    .get(candidateId);
  if (row === undefined) {
    throw new SceneSeedStoreError(
      "not_found",
      `candidate ${candidateId} was not found`,
    );
  }
  return row;
}

function requireRevision(canvas: CanvasRow, expectedRevision: number): void {
  if (canvas.revision !== expectedRevision) {
    throw new SceneSeedStoreError(
      "revision_conflict",
      `canvas revision is ${canvas.revision}; expected ${expectedRevision}`,
    );
  }
}

function requireAgentThread(
  canvas: CanvasRow,
  job: JobRow | null,
  agentThreadId: string,
): void {
  const parsed = parseThreadId(agentThreadId);
  if (
    canvas.agent_thread_id !== parsed ||
    (job !== null && job.agent_thread_id !== parsed)
  ) {
    throw new SceneSeedStoreError(
      "agent_thread_mismatch",
      "the calling agent thread does not own this canvas job",
    );
  }
}

function requireJobGuard(
  job: JobRow,
  input: {
    generation: number;
    expectedState: JobState | readonly JobState[];
  },
): void {
  if (job.generation !== input.generation) {
    throw new SceneSeedStoreError(
      "invalid_state",
      `job generation is ${job.generation}; expected ${input.generation}`,
    );
  }
  const expected = Array.isArray(input.expectedState)
    ? input.expectedState
    : [input.expectedState];
  if (!expected.includes(job.state)) {
    throw new SceneSeedStoreError(
      "invalid_state",
      `job ${job.id} is ${job.state}; expected ${expected.join(" or ")}`,
    );
  }
}

function bumpCanvasRevision(
  db: PluginDatabase,
  canvasId: string,
  expectedRevision: number,
  timestamp: number,
): number {
  const result = db
    .prepare<[number, string, number]>(
      `UPDATE sceneseed_canvases
       SET revision = revision + 1, updated_at = ?
       WHERE id = ? AND revision = ?`,
    )
    .run(timestamp, canvasId, expectedRevision);
  if (result.changes !== 1) {
    throw new SceneSeedStoreError(
      "revision_conflict",
      "canvas changed before the mutation could commit",
    );
  }
  return expectedRevision + 1;
}

function activeObjectCount(db: PluginDatabase, canvasId: string): number {
  return (
    db
      .prepare<[string], CountRow>(
        `SELECT COUNT(*) AS count FROM sceneseed_objects
         WHERE canvas_id = ? AND removed_at IS NULL`,
      )
      .get(canvasId)?.count ?? 0
  );
}

function activeCanvasCost(
  db: PluginDatabase,
  canvasId: string,
  excludingObjectId: string | null = null,
): number {
  return (
    db
      .prepare<[string, string | null, string | null], CostRow>(
        `SELECT COALESCE(SUM(candidate.cost), 0) AS cost
         FROM sceneseed_objects object
         JOIN sceneseed_candidates candidate ON candidate.id = object.active_scene_id
         WHERE object.canvas_id = ?
           AND object.removed_at IS NULL
           AND (? IS NULL OR object.id <> ?)`,
      )
      .get(canvasId, excludingObjectId, excludingObjectId)?.cost ?? 0
  );
}

function ensureObjectCapacity(db: PluginDatabase, canvasId: string): void {
  if (activeObjectCount(db, canvasId) >= MAX_CANVAS_OBJECTS) {
    throw new SceneSeedStoreError(
      "canvas_object_limit",
      `canvas already has ${MAX_CANVAS_OBJECTS} active objects`,
    );
  }
}

function ensureCardCapacity(db: PluginDatabase, canvasId: string): void {
  const count =
    db
      .prepare<[string], CountRow>(
        `SELECT COUNT(*) AS count FROM sceneseed_cards
         WHERE canvas_id = ?
           AND state IN ('ready', 'queued', 'interpreting', 'realizing')`,
      )
      .get(canvasId)?.count ?? 0;
  if (count >= MAX_IN_FLIGHT_CARDS) {
    throw new SceneSeedStoreError(
      "in_flight_limit",
      `canvas already has ${MAX_IN_FLIGHT_CARDS} cards in flight`,
    );
  }
}

function nextOrder(
  db: PluginDatabase,
  table: "sceneseed_cards" | "sceneseed_objects",
  canvasId: string,
): number {
  const row = db
    .prepare<
      [string],
      { next_order: number }
    >(`SELECT COALESCE(MAX(order_index), -1) + 1 AS next_order FROM ${table} WHERE canvas_id = ?`)
    .get(canvasId);
  return row?.next_order ?? 0;
}

export function createSceneSeedStore(db: PluginDatabase) {
  migrateSceneSeedDatabase(db);

  function getCanvas(canvasId: string): CanvasDto | null {
    const row = db
      .prepare<
        [string],
        CanvasRow
      >("SELECT * FROM sceneseed_canvases WHERE id = ?")
      .get(canvasId);
    return row === undefined ? null : canvasFromRow(row);
  }

  function getJob(jobId: string): JobDto | null {
    const row = db
      .prepare<[string], JobRow>("SELECT * FROM sceneseed_jobs WHERE id = ?")
      .get(jobId);
    return row === undefined ? null : jobFromRow(row);
  }

  function getCandidate(candidateId: string): SceneCandidateDto | null {
    const row = db
      .prepare<
        [string],
        CandidateRow
      >("SELECT * FROM sceneseed_candidates WHERE id = ?")
      .get(candidateId);
    return row === undefined ? null : candidateFromRow(row);
  }

  return {
    getCanvas,
    getJob,
    getCandidate,

    createCanvas(input: { id?: string; name: string }): CanvasDto {
      const id = parseId(input.id ?? createId("canvas"), "canvas id");
      const name = nameSchema.parse(input.name);
      const timestamp = nowMs();
      db.prepare<[string, string, number, number, number]>(
        `INSERT INTO sceneseed_canvases
         (id, name, schema_version, revision, created_at, updated_at)
         VALUES (?, ?, ?, 0, ?, ?)`,
      ).run(id, name, SCENE_OBJECT_VERSION, timestamp, timestamp);
      return canvasFromRow(requiredCanvas(db, id));
    },

    listCanvases(): CanvasSummaryDto[] {
      return db
        .prepare<[], CanvasSummaryRow>(
          `SELECT canvas.*,
                  COUNT(object.id) AS object_count,
                  COALESCE(SUM(candidate.cost), 0) AS active_cost
           FROM sceneseed_canvases canvas
           LEFT JOIN sceneseed_objects object
             ON object.canvas_id = canvas.id AND object.removed_at IS NULL
           LEFT JOIN sceneseed_candidates candidate
             ON candidate.id = object.active_scene_id
           GROUP BY canvas.id
           ORDER BY canvas.updated_at DESC, canvas.id`,
        )
        .all()
        .map((row) => ({
          ...canvasFromRow(row),
          objectCount: row.object_count,
          activeCost: row.active_cost,
        }));
    },

    getCanvasSnapshot(canvasId: string): CanvasSnapshotDto | null {
      const canvas = getCanvas(canvasId);
      if (canvas === null) return null;
      const cards = db
        .prepare<[string], CardRow>(
          `SELECT * FROM sceneseed_cards WHERE canvas_id = ?
           ORDER BY order_index, id`,
        )
        .all(canvasId)
        .map(cardFromRow);
      const objects = db
        .prepare<[string], ObjectRow>(
          `SELECT * FROM sceneseed_objects WHERE canvas_id = ?
           ORDER BY order_index, id`,
        )
        .all(canvasId)
        .map(objectFromRow);
      const jobs = db
        .prepare<[string], JobRow>(
          `SELECT * FROM sceneseed_jobs WHERE canvas_id = ?
           ORDER BY created_at, id`,
        )
        .all(canvasId)
        .map(jobFromRow);
      const candidates = db
        .prepare<[string], CandidateRow>(
          `SELECT * FROM sceneseed_candidates WHERE canvas_id = ?
           ORDER BY created_at, id`,
        )
        .all(canvasId)
        .map(candidateFromRow);
      return { canvas, cards, objects, jobs, candidates };
    },

    renameCanvas(input: {
      canvasId: string;
      name: string;
      expectedRevision: number;
    }): CanvasDto {
      return db.transaction(() => {
        const canvas = requiredCanvas(db, input.canvasId);
        requireRevision(canvas, input.expectedRevision);
        const timestamp = nowMs();
        db.prepare<[string, string]>(
          "UPDATE sceneseed_canvases SET name = ? WHERE id = ?",
        ).run(nameSchema.parse(input.name), input.canvasId);
        bumpCanvasRevision(
          db,
          input.canvasId,
          input.expectedRevision,
          timestamp,
        );
        return canvasFromRow(requiredCanvas(db, input.canvasId));
      })();
    },

    setCanvasAgentThreadId(input: {
      canvasId: string;
      agentThreadId: string;
      expectedRevision: number;
    }): CanvasDto {
      return db.transaction(() => {
        const canvas = requiredCanvas(db, input.canvasId);
        requireRevision(canvas, input.expectedRevision);
        const threadId = parseThreadId(input.agentThreadId);
        if (
          canvas.agent_thread_id !== null &&
          canvas.agent_thread_id !== threadId
        ) {
          throw new SceneSeedStoreError(
            "invalid_state",
            "canvas already belongs to another agent thread",
          );
        }
        if (canvas.agent_thread_id === threadId) return canvasFromRow(canvas);
        db.prepare<[string, string]>(
          "UPDATE sceneseed_canvases SET agent_thread_id = ? WHERE id = ?",
        ).run(threadId, input.canvasId);
        bumpCanvasRevision(db, input.canvasId, input.expectedRevision, nowMs());
        return canvasFromRow(requiredCanvas(db, input.canvasId));
      })();
    },

    replaceCanvasAgentThreadId(input: {
      canvasId: string;
      agentThreadId: string | null;
      expectedRevision: number;
    }): CanvasDto {
      return db.transaction(() => {
        const canvas = requiredCanvas(db, input.canvasId);
        requireRevision(canvas, input.expectedRevision);
        const nextThreadId =
          input.agentThreadId === null
            ? null
            : parseThreadId(input.agentThreadId);
        if (canvas.agent_thread_id === nextThreadId)
          return canvasFromRow(canvas);
        const nonterminalCount =
          db
            .prepare<[string], CountRow>(
              `SELECT COUNT(*) AS count FROM sceneseed_jobs
               WHERE canvas_id = ?
                 AND state IN ('queued', 'interpreting', 'candidate_ready', 'realizing')`,
            )
            .get(canvas.id)?.count ?? 0;
        if (nonterminalCount > 0) {
          throw new SceneSeedStoreError(
            "invalid_state",
            "settle every nonterminal job before replacing the canvas agent thread",
          );
        }
        db.prepare<[string | null, string]>(
          "UPDATE sceneseed_canvases SET agent_thread_id = ? WHERE id = ?",
        ).run(nextThreadId, canvas.id);
        bumpCanvasRevision(db, canvas.id, input.expectedRevision, nowMs());
        return canvasFromRow(requiredCanvas(db, canvas.id));
      })();
    },

    getCanvasByAgentThreadId(agentThreadId: string): CanvasDto | null {
      const row = db
        .prepare<
          [string],
          CanvasRow
        >("SELECT * FROM sceneseed_canvases WHERE agent_thread_id = ?")
        .get(parseThreadId(agentThreadId));
      return row === undefined ? null : canvasFromRow(row);
    },

    getCurrentJobByAgentThreadId(agentThreadId: string): JobDto | null {
      const row = db
        .prepare<[string], JobRow>(
          `SELECT * FROM sceneseed_jobs
           WHERE agent_thread_id = ?
             AND state IN ('interpreting', 'realizing', 'candidate_ready', 'queued')
           ORDER BY CASE state
             WHEN 'interpreting' THEN 0
             WHEN 'realizing' THEN 1
             WHEN 'candidate_ready' THEN 2
             ELSE 3 END,
             created_at, id
           LIMIT 1`,
        )
        .get(parseThreadId(agentThreadId));
      return row === undefined ? null : jobFromRow(row);
    },

    createReadyCard(input: {
      id?: string;
      canvasId: string;
      prompt: string;
      order?: number;
      expectedRevision: number;
    }): { card: CardDto; revision: number } {
      return db.transaction(() => {
        const canvas = requiredCanvas(db, input.canvasId);
        requireRevision(canvas, input.expectedRevision);
        ensureCardCapacity(db, input.canvasId);
        const id = parseId(input.id ?? createId("card"), "card id");
        const prompt = promptSchema.parse(input.prompt);
        const order =
          input.order ?? nextOrder(db, "sceneseed_cards", input.canvasId);
        if (!Number.isInteger(order) || order < 0) {
          throw new SceneSeedStoreError(
            "invalid_input",
            "card order is invalid",
          );
        }
        const timestamp = nowMs();
        db.prepare<[string, string, string, number, number, number]>(
          `INSERT INTO sceneseed_cards
           (id, canvas_id, prompt, state, order_index, created_at, updated_at)
           VALUES (?, ?, ?, 'ready', ?, ?, ?)`,
        ).run(id, input.canvasId, prompt, order, timestamp, timestamp);
        const revision = bumpCanvasRevision(
          db,
          input.canvasId,
          input.expectedRevision,
          timestamp,
        );
        return { card: cardFromRow(requiredCard(db, id)), revision };
      })();
    },

    queueCard(input: {
      cardId: string;
      objectId?: string;
      jobId?: string;
      placement: Placement;
      agentThreadId: string;
      expectedRevision: number;
    }): { card: CardDto; object: ObjectDto; job: JobDto; revision: number } {
      return db.transaction(() => {
        const card = requiredCard(db, input.cardId);
        const canvas = requiredCanvas(db, card.canvas_id);
        requireRevision(canvas, input.expectedRevision);
        requireAgentThread(canvas, null, input.agentThreadId);
        if (
          !(["ready", "cancelled", "failed"] as CardState[]).includes(
            card.state,
          )
        ) {
          throw new SceneSeedStoreError(
            "invalid_state",
            `card ${card.id} cannot be queued from ${card.state}`,
          );
        }
        const placement = finitePlacementSchema.parse(input.placement);
        let object = db
          .prepare<
            [string],
            ObjectRow
          >("SELECT * FROM sceneseed_objects WHERE source_card_id = ?")
          .get(card.id);
        const timestamp = nowMs();
        if (object === undefined) {
          ensureObjectCapacity(db, canvas.id);
          const objectId = parseId(
            input.objectId ?? createId("object"),
            "object id",
          );
          const order = nextOrder(db, "sceneseed_objects", canvas.id);
          db.prepare<[string, string, string, string, number, number, number]>(
            `INSERT INTO sceneseed_objects
             (id, canvas_id, source_card_id, transform_json, order_index, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
          ).run(
            objectId,
            canvas.id,
            card.id,
            JSON.stringify({
              ...DEFAULT_TRANSFORM,
              position: [placement.x, 0, placement.y],
            }),
            order,
            timestamp,
            timestamp,
          );
          object = requiredObject(db, objectId);
        } else if (object.removed_at !== null) {
          ensureObjectCapacity(db, canvas.id);
          db.prepare<[number, string]>(
            "UPDATE sceneseed_objects SET removed_at = NULL, updated_at = ? WHERE id = ?",
          ).run(timestamp, object.id);
          object = requiredObject(db, object.id);
        }
        const generation =
          (db
            .prepare<
              [string],
              GenerationRow
            >("SELECT COALESCE(MAX(generation), 0) AS generation FROM sceneseed_jobs WHERE object_id = ?")
            .get(object.id)?.generation ?? 0) + 1;
        const jobId = parseId(input.jobId ?? createId("job"), "job id");
        db.prepare<
          [string, string, string, string, number, string, number, number]
        >(
          `INSERT INTO sceneseed_jobs
           (id, canvas_id, card_id, object_id, generation, state,
            agent_thread_id, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, 'queued', ?, ?, ?)`,
        ).run(
          jobId,
          canvas.id,
          card.id,
          object.id,
          generation,
          input.agentThreadId,
          timestamp,
          timestamp,
        );
        db.prepare<[number, number, string, number, string]>(
          `UPDATE sceneseed_cards
           SET state = 'queued', placement_x = ?, placement_y = ?,
               active_job_id = ?, updated_at = ?
           WHERE id = ?`,
        ).run(placement.x, placement.y, jobId, timestamp, card.id);
        db.prepare<[string, number, string]>(
          `UPDATE sceneseed_objects
           SET active_job_id = ?, updated_at = ? WHERE id = ?`,
        ).run(jobId, timestamp, object.id);
        const revision = bumpCanvasRevision(
          db,
          canvas.id,
          input.expectedRevision,
          timestamp,
        );
        return {
          card: cardFromRow(requiredCard(db, card.id)),
          object: objectFromRow(requiredObject(db, object.id)),
          job: jobFromRow(requiredJob(db, jobId)),
          revision,
        };
      })();
    },

    queueRemix(input: {
      objectId: string;
      jobId?: string;
      agentThreadId: string;
      expectedRevision: number;
    }): { job: JobDto; revision: number } {
      return db.transaction(() => {
        const object = requiredObject(db, input.objectId);
        const canvas = requiredCanvas(db, object.canvas_id);
        requireRevision(canvas, input.expectedRevision);
        requireAgentThread(canvas, null, input.agentThreadId);
        if (object.removed_at !== null || object.active_scene_id === null) {
          throw new SceneSeedStoreError(
            "invalid_state",
            "only an active realized object can be remixed",
          );
        }
        const card = requiredCard(db, object.source_card_id);
        if (!(["complete", "realizing"] as CardState[]).includes(card.state)) {
          throw new SceneSeedStoreError(
            "invalid_state",
            `card ${card.id} cannot be remixed from ${card.state}`,
          );
        }
        const generation =
          (db
            .prepare<
              [string],
              GenerationRow
            >("SELECT COALESCE(MAX(generation), 0) AS generation FROM sceneseed_jobs WHERE object_id = ?")
            .get(object.id)?.generation ?? 0) + 1;
        const jobId = parseId(input.jobId ?? createId("job"), "job id");
        const timestamp = nowMs();
        db.prepare<
          [string, string, string, string, number, string, number, number]
        >(
          `INSERT INTO sceneseed_jobs
           (id, canvas_id, card_id, object_id, generation, state,
            agent_thread_id, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, 'queued', ?, ?, ?)`,
        ).run(
          jobId,
          canvas.id,
          card.id,
          object.id,
          generation,
          input.agentThreadId,
          timestamp,
          timestamp,
        );
        db.prepare<[string, number, string]>(
          "UPDATE sceneseed_cards SET state = 'queued', active_job_id = ?, updated_at = ? WHERE id = ?",
        ).run(jobId, timestamp, card.id);
        db.prepare<[string, number, string]>(
          "UPDATE sceneseed_objects SET active_job_id = ?, updated_at = ? WHERE id = ?",
        ).run(jobId, timestamp, object.id);
        const revision = bumpCanvasRevision(
          db,
          canvas.id,
          input.expectedRevision,
          timestamp,
        );
        return { job: jobFromRow(requiredJob(db, jobId)), revision };
      })();
    },

    claimNextQueuedJob(input: {
      canvasId: string;
      agentThreadId: string;
      expectedRevision: number;
    }): { job: JobDto; revision: number } | null {
      return db.transaction(() => {
        const canvas = requiredCanvas(db, input.canvasId);
        requireRevision(canvas, input.expectedRevision);
        requireAgentThread(canvas, null, input.agentThreadId);
        const blocking = db
          .prepare<[string], CountRow>(
            `SELECT COUNT(*) AS count FROM sceneseed_jobs
             WHERE canvas_id = ?
               AND (state = 'interpreting'
                 OR (state = 'cancelled' AND started_at IS NOT NULL AND thread_settled_at IS NULL))`,
          )
          .get(canvas.id)?.count;
        if ((blocking ?? 0) > 0) return null;
        const row = db
          .prepare<[string, string], JobRow>(
            `SELECT * FROM sceneseed_jobs
             WHERE canvas_id = ? AND state = 'queued' AND agent_thread_id = ?
             ORDER BY created_at, id LIMIT 1`,
          )
          .get(canvas.id, input.agentThreadId);
        if (row === undefined) return null;
        const timestamp = nowMs();
        db.prepare<[number, number, string]>(
          `UPDATE sceneseed_jobs
           SET state = 'interpreting', started_at = ?, updated_at = ?
           WHERE id = ? AND state = 'queued'`,
        ).run(timestamp, timestamp, row.id);
        db.prepare<[number, string, string]>(
          `UPDATE sceneseed_cards SET state = 'interpreting', updated_at = ?
           WHERE id = ? AND active_job_id = ?`,
        ).run(timestamp, row.card_id, row.id);
        const revision = bumpCanvasRevision(
          db,
          canvas.id,
          input.expectedRevision,
          timestamp,
        );
        return { job: jobFromRow(requiredJob(db, row.id)), revision };
      })();
    },

    recordInvalidSubmission(input: {
      jobId: string;
      generation: number;
      agentThreadId: string;
      expectedCanvasRevision: number;
      errorMessage: string;
    }): { job: JobDto; terminal: boolean; revision: number } {
      return db.transaction(() => {
        const job = requiredJob(db, input.jobId);
        const canvas = requiredCanvas(db, job.canvas_id);
        requireRevision(canvas, input.expectedCanvasRevision);
        requireAgentThread(canvas, job, input.agentThreadId);
        requireJobGuard(job, {
          generation: input.generation,
          expectedState: "interpreting",
        });
        const attempts = job.invalid_submission_attempts + 1;
        const terminal = attempts >= 2;
        const timestamp = nowMs();
        db.prepare<[number, string, string, number | null, number, string]>(
          `UPDATE sceneseed_jobs
           SET invalid_submission_attempts = ?, state = ?,
               error_code = 'invalid_scene', error_message = ?,
               finished_at = ?, updated_at = ?
           WHERE id = ? AND state = 'interpreting'`,
        ).run(
          attempts,
          terminal ? "failed" : "interpreting",
          input.errorMessage.slice(0, 1_000),
          terminal ? timestamp : null,
          timestamp,
          job.id,
        );
        if (terminal) {
          db.prepare<[number, string, string]>(
            `UPDATE sceneseed_cards SET state = 'failed', updated_at = ?
             WHERE id = ? AND active_job_id = ?`,
          ).run(timestamp, job.card_id, job.id);
        }
        const revision = bumpCanvasRevision(
          db,
          canvas.id,
          input.expectedCanvasRevision,
          timestamp,
        );
        return { job: jobFromRow(requiredJob(db, job.id)), terminal, revision };
      })();
    },

    submitCandidate(input: {
      candidateId?: string;
      jobId: string;
      generation: number;
      agentThreadId: string;
      expectedCanvasRevision: number;
      scene: unknown;
    }): { candidate: SceneCandidateDto; job: JobDto; revision: number } {
      const normalized = normalizeSceneObjectV1(input.scene);
      const originalSceneJson = serializeOriginalScene(input.scene);
      const cost = calculateSceneCost(normalized);
      return db.transaction(() => {
        const job = requiredJob(db, input.jobId);
        const canvas = requiredCanvas(db, job.canvas_id);
        requireRevision(canvas, input.expectedCanvasRevision);
        requireAgentThread(canvas, job, input.agentThreadId);
        requireJobGuard(job, {
          generation: input.generation,
          expectedState: "interpreting",
        });
        if (
          normalized.jobId !== job.id ||
          normalized.objectId !== job.object_id
        ) {
          throw new SceneSeedStoreError(
            "invalid_input",
            "scene jobId and objectId must match the guarded job",
          );
        }
        const candidateId = parseId(
          input.candidateId ?? createId("scene"),
          "candidate id",
        );
        const timestamp = nowMs();
        const sceneJson = JSON.stringify(normalized);
        db.prepare<
          [
            string,
            string,
            string,
            string,
            number,
            string,
            string,
            number,
            number,
            number,
            number,
          ]
        >(
          `INSERT INTO sceneseed_candidates
           (id, canvas_id, job_id, object_id, generation,
            original_scene_json, normalized_scene_json, scene_version, cost,
            state, realization_attempts, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 0, ?, ?)`,
        ).run(
          candidateId,
          canvas.id,
          job.id,
          job.object_id,
          job.generation,
          originalSceneJson,
          sceneJson,
          normalized.version,
          cost,
          timestamp,
          timestamp,
        );
        db.prepare<[number, string]>(
          `UPDATE sceneseed_jobs
           SET state = 'candidate_ready', error_code = NULL,
               error_message = NULL, updated_at = ? WHERE id = ?`,
        ).run(timestamp, job.id);
        db.prepare<[number, string, string]>(
          `UPDATE sceneseed_cards SET state = 'realizing', updated_at = ?
           WHERE id = ? AND active_job_id = ?`,
        ).run(timestamp, job.card_id, job.id);
        const revision = bumpCanvasRevision(
          db,
          canvas.id,
          input.expectedCanvasRevision,
          timestamp,
        );
        return {
          candidate: candidateFromRow(requiredCandidate(db, candidateId)),
          job: jobFromRow(requiredJob(db, job.id)),
          revision,
        };
      })();
    },

    beginRealization(input: {
      candidateId: string;
      attemptId: string;
      jobId: string;
      generation: number;
      agentThreadId: string;
      expectedCanvasRevision: number;
    }): { alreadyProcessed: boolean; job: JobDto; revision: number } {
      return db.transaction(() => {
        const attemptId = parseId(input.attemptId, "realization attempt id");
        const existing = db
          .prepare<[string, string], RealizationReceiptRow>(
            `SELECT candidate_id, attempt_id, status, created_at
             FROM sceneseed_realization_receipts
             WHERE candidate_id = ? AND attempt_id = ?`,
          )
          .get(input.candidateId, attemptId);
        const currentJob = requiredJob(db, input.jobId);
        if (existing !== undefined) {
          return {
            alreadyProcessed: true,
            job: jobFromRow(currentJob),
            revision: requiredCanvas(db, currentJob.canvas_id).revision,
          };
        }
        const candidate = requiredCandidate(db, input.candidateId);
        const canvas = requiredCanvas(db, candidate.canvas_id);
        requireRevision(canvas, input.expectedCanvasRevision);
        if (candidate.job_id !== input.jobId) {
          throw new SceneSeedStoreError(
            "invalid_input",
            "candidate does not belong to the guarded job",
          );
        }
        requireAgentThread(canvas, currentJob, input.agentThreadId);
        requireJobGuard(currentJob, {
          generation: input.generation,
          expectedState: ["candidate_ready", "realizing"],
        });
        if (
          candidate.state !== "pending" ||
          candidate.realization_attempts >= 2
        ) {
          throw new SceneSeedStoreError(
            "invalid_state",
            "candidate cannot start another realization",
          );
        }
        const pending = db
          .prepare<[string], RealizationReceiptRow>(
            `SELECT candidate_id, attempt_id, status, created_at
             FROM sceneseed_realization_receipts
             WHERE candidate_id = ? AND status = 'pending'`,
          )
          .get(candidate.id);
        const timestamp = nowMs();
        if (currentJob.state === "realizing" && pending === undefined) {
          throw new SceneSeedStoreError(
            "invalid_state",
            "realizing job has no active realization lease",
          );
        }
        if (pending !== undefined) {
          if (timestamp - pending.created_at < REALIZATION_LEASE_MS) {
            throw new SceneSeedStoreError(
              "realization_busy",
              "another client is already realizing this candidate",
            );
          }
          db.prepare<[number, string, string]>(
            `UPDATE sceneseed_realization_receipts
             SET status = 'failed', completed_at = ?
             WHERE candidate_id = ? AND attempt_id = ? AND status = 'pending'`,
          ).run(timestamp, candidate.id, pending.attempt_id);
        }
        db.prepare<[string, string, number]>(
          `INSERT INTO sceneseed_realization_receipts
           (candidate_id, attempt_id, status, created_at)
           VALUES (?, ?, 'pending', ?)`,
        ).run(candidate.id, attemptId, timestamp);
        db.prepare<[number, string]>(
          "UPDATE sceneseed_jobs SET state = 'realizing', updated_at = ? WHERE id = ?",
        ).run(timestamp, currentJob.id);
        const revision = bumpCanvasRevision(
          db,
          canvas.id,
          input.expectedCanvasRevision,
          timestamp,
        );
        return {
          alreadyProcessed: false,
          job: jobFromRow(requiredJob(db, currentJob.id)),
          revision,
        };
      })();
    },

    acknowledgeRealization(input: {
      candidateId: string;
      attemptId: string;
      jobId: string;
      generation: number;
      agentThreadId: string;
      expectedCanvasRevision: number;
      outcome: "success" | "failure";
      errorMessage?: string;
    }): {
      outcome: "complete" | "retry" | "failed" | "already_processed";
      job: JobDto;
      candidate: SceneCandidateDto;
      revision: number;
    } {
      return db.transaction(
        (): {
          outcome: "complete" | "retry" | "failed" | "already_processed";
          job: JobDto;
          candidate: SceneCandidateDto;
          revision: number;
        } => {
          const attemptId = parseId(input.attemptId, "realization attempt id");
          const receipt = db
            .prepare<[string, string], RealizationReceiptRow>(
              `SELECT candidate_id, attempt_id, status, created_at
             FROM sceneseed_realization_receipts
             WHERE candidate_id = ? AND attempt_id = ?`,
            )
            .get(input.candidateId, attemptId);
          if (receipt === undefined) {
            throw new SceneSeedStoreError(
              "invalid_state",
              "realization must begin before it can be acknowledged",
            );
          }
          const candidate = requiredCandidate(db, input.candidateId);
          const job = requiredJob(db, input.jobId);
          const canvas = requiredCanvas(db, candidate.canvas_id);
          if (receipt.status !== "pending") {
            const matches =
              (receipt.status === "succeeded" && input.outcome === "success") ||
              (receipt.status === "failed" && input.outcome === "failure");
            if (!matches) {
              throw new SceneSeedStoreError(
                "idempotency_conflict",
                "realization attempt was already acknowledged with another outcome",
              );
            }
            return {
              outcome: "already_processed",
              job: jobFromRow(job),
              candidate: candidateFromRow(candidate),
              revision: canvas.revision,
            };
          }
          requireRevision(canvas, input.expectedCanvasRevision);
          if (
            candidate.job_id !== job.id ||
            candidate.object_id !== job.object_id
          ) {
            throw new SceneSeedStoreError(
              "invalid_input",
              "candidate does not belong to the guarded job",
            );
          }
          requireAgentThread(canvas, job, input.agentThreadId);
          requireJobGuard(job, {
            generation: input.generation,
            expectedState: "realizing",
          });
          if (candidate.state !== "pending") {
            throw new SceneSeedStoreError(
              "invalid_state",
              `candidate is already ${candidate.state}`,
            );
          }
          const timestamp = nowMs();
          let result: "complete" | "retry" | "failed";
          if (input.outcome === "failure") {
            const attempts = candidate.realization_attempts + 1;
            const terminal = attempts >= 2;
            db.prepare<[number, string, number, string]>(
              `UPDATE sceneseed_candidates
             SET realization_attempts = ?, state = ?, updated_at = ?
             WHERE id = ?`,
            ).run(
              attempts,
              terminal ? "failed" : "pending",
              timestamp,
              candidate.id,
            );
            db.prepare<[number, string, string]>(
              `UPDATE sceneseed_realization_receipts
             SET status = 'failed', completed_at = ?
             WHERE candidate_id = ? AND attempt_id = ?`,
            ).run(timestamp, candidate.id, attemptId);
            db.prepare<
              [
                string,
                string | null,
                string | null,
                number | null,
                number,
                string,
              ]
            >(
              `UPDATE sceneseed_jobs
             SET state = ?, error_code = ?, error_message = ?, finished_at = ?,
                 updated_at = ? WHERE id = ?`,
            ).run(
              terminal ? "failed" : "candidate_ready",
              terminal ? "unrenderable_scene" : null,
              terminal
                ? (input.errorMessage ?? "Scene render probe failed").slice(
                    0,
                    1_000,
                  )
                : null,
              terminal ? timestamp : null,
              timestamp,
              job.id,
            );
            if (terminal) {
              db.prepare<[number, string, string]>(
                `UPDATE sceneseed_cards SET state = 'failed', updated_at = ?
               WHERE id = ? AND active_job_id = ?`,
              ).run(timestamp, job.card_id, job.id);
            }
            result = terminal ? "failed" : "retry";
          } else {
            const count = activeObjectCount(db, canvas.id);
            const nextCost =
              activeCanvasCost(db, canvas.id, candidate.object_id) +
              candidate.cost;
            if (count > MAX_CANVAS_OBJECTS || nextCost > MAX_CANVAS_COST) {
              const code =
                count > MAX_CANVAS_OBJECTS
                  ? "canvas_object_limit"
                  : "canvas_cost_limit";
              db.prepare<[number, string]>(
                `UPDATE sceneseed_candidates
               SET state = 'failed', updated_at = ? WHERE id = ?`,
              ).run(timestamp, candidate.id);
              db.prepare<[number, string, string]>(
                `UPDATE sceneseed_realization_receipts
               SET status = 'failed', completed_at = ?
               WHERE candidate_id = ? AND attempt_id = ?`,
              ).run(timestamp, candidate.id, attemptId);
              db.prepare<[string, string, number, number, string]>(
                `UPDATE sceneseed_jobs
               SET state = 'failed', error_code = ?, error_message = ?,
                   finished_at = ?, updated_at = ? WHERE id = ?`,
              ).run(
                code,
                code === "canvas_object_limit"
                  ? "Canvas object limit reached"
                  : "Canvas cost limit reached",
                timestamp,
                timestamp,
                job.id,
              );
              db.prepare<[number, string, string]>(
                `UPDATE sceneseed_cards SET state = 'failed', updated_at = ?
               WHERE id = ? AND active_job_id = ?`,
              ).run(timestamp, job.card_id, job.id);
              result = "failed";
            } else {
              db.prepare<[number, string, string]>(
                `UPDATE sceneseed_candidates
               SET state = 'superseded', updated_at = ?
               WHERE object_id = ? AND id <> ? AND state = 'active'`,
              ).run(timestamp, candidate.object_id, candidate.id);
              db.prepare<[number, number, string]>(
                `UPDATE sceneseed_candidates
               SET state = 'active', realized_at = ?, updated_at = ? WHERE id = ?`,
              ).run(timestamp, timestamp, candidate.id);
              db.prepare<[number, string, string]>(
                `UPDATE sceneseed_realization_receipts
               SET status = 'succeeded', completed_at = ?
               WHERE candidate_id = ? AND attempt_id = ?`,
              ).run(timestamp, candidate.id, attemptId);
              db.prepare<[string, number, string]>(
                `UPDATE sceneseed_objects
               SET active_scene_id = ?, removed_at = NULL, updated_at = ?
               WHERE id = ?`,
              ).run(candidate.id, timestamp, candidate.object_id);
              db.prepare<[number, number, string]>(
                `UPDATE sceneseed_jobs
               SET state = 'complete', finished_at = ?, updated_at = ? WHERE id = ?`,
              ).run(timestamp, timestamp, job.id);
              db.prepare<[number, string, string]>(
                `UPDATE sceneseed_cards SET state = 'complete', updated_at = ?
               WHERE id = ? AND active_job_id = ?`,
              ).run(timestamp, job.card_id, job.id);
              db.prepare<[number, string, number]>(
                `UPDATE sceneseed_candidates
               SET state = 'superseded', updated_at = ?
               WHERE object_id = ? AND generation < ? AND state = 'pending'`,
              ).run(timestamp, candidate.object_id, candidate.generation);
              db.prepare<[number, number, string, number]>(
                `UPDATE sceneseed_jobs
               SET state = 'superseded', finished_at = ?, updated_at = ?
               WHERE object_id = ? AND generation < ?
                 AND state IN ('candidate_ready', 'realizing')`,
              ).run(
                timestamp,
                timestamp,
                candidate.object_id,
                candidate.generation,
              );
              result = "complete";
            }
          }
          const revision = bumpCanvasRevision(
            db,
            canvas.id,
            input.expectedCanvasRevision,
            timestamp,
          );
          return {
            outcome: result,
            job: jobFromRow(requiredJob(db, job.id)),
            candidate: candidateFromRow(requiredCandidate(db, candidate.id)),
            revision,
          };
        },
      )();
    },

    cancelJob(input: {
      jobId: string;
      generation: number;
      expectedState: "queued" | "interpreting";
      agentThreadId: string;
      expectedCanvasRevision: number;
    }): { job: JobDto; revision: number } {
      return db.transaction(() => {
        const job = requiredJob(db, input.jobId);
        const canvas = requiredCanvas(db, job.canvas_id);
        requireRevision(canvas, input.expectedCanvasRevision);
        requireAgentThread(canvas, job, input.agentThreadId);
        requireJobGuard(job, {
          generation: input.generation,
          expectedState: input.expectedState,
        });
        const timestamp = nowMs();
        db.prepare<[number, number | null, number, string]>(
          `UPDATE sceneseed_jobs
           SET state = 'cancelled', error_code = NULL, error_message = NULL,
               finished_at = ?, thread_settled_at = ?, updated_at = ?
           WHERE id = ?`,
        ).run(
          timestamp,
          job.state === "queued" ? timestamp : null,
          timestamp,
          job.id,
        );
        db.prepare<[string, number, string, string]>(
          `UPDATE sceneseed_cards SET state = ?, updated_at = ?
           WHERE id = ? AND active_job_id = ?`,
        ).run(
          job.state === "queued" ? "ready" : "cancelled",
          timestamp,
          job.card_id,
          job.id,
        );
        const revision = bumpCanvasRevision(
          db,
          canvas.id,
          input.expectedCanvasRevision,
          timestamp,
        );
        return { job: jobFromRow(requiredJob(db, job.id)), revision };
      })();
    },

    settleCancelledAgentTurn(input: {
      jobId: string;
      generation: number;
      agentThreadId: string;
      expectedCanvasRevision: number;
    }): { alreadySettled: boolean; job: JobDto; revision: number } {
      return db.transaction(() => {
        const job = requiredJob(db, input.jobId);
        if (job.state === "cancelled" && job.thread_settled_at !== null) {
          return {
            alreadySettled: true,
            job: jobFromRow(job),
            revision: requiredCanvas(db, job.canvas_id).revision,
          };
        }
        const canvas = requiredCanvas(db, job.canvas_id);
        requireRevision(canvas, input.expectedCanvasRevision);
        requireAgentThread(canvas, job, input.agentThreadId);
        requireJobGuard(job, {
          generation: input.generation,
          expectedState: "cancelled",
        });
        const timestamp = nowMs();
        db.prepare<[number, number, string]>(
          `UPDATE sceneseed_jobs SET thread_settled_at = ?, updated_at = ?
           WHERE id = ?`,
        ).run(timestamp, timestamp, job.id);
        const revision = bumpCanvasRevision(
          db,
          canvas.id,
          input.expectedCanvasRevision,
          timestamp,
        );
        return {
          alreadySettled: false,
          job: jobFromRow(requiredJob(db, job.id)),
          revision,
        };
      })();
    },

    failNonterminalJob(input: {
      jobId: string;
      generation: number;
      expectedState: NonterminalJobState;
      agentThreadId: string;
      expectedCanvasRevision: number;
      errorCode: string;
      errorMessage: string;
    }): { job: JobDto; revision: number } {
      return db.transaction(() => {
        const job = requiredJob(db, input.jobId);
        const canvas = requiredCanvas(db, job.canvas_id);
        requireRevision(canvas, input.expectedCanvasRevision);
        requireAgentThread(canvas, job, input.agentThreadId);
        requireJobGuard(job, {
          generation: input.generation,
          expectedState: input.expectedState,
        });
        const timestamp = nowMs();
        db.prepare<[string, string, number, number, string]>(
          `UPDATE sceneseed_jobs
           SET state = 'failed', error_code = ?, error_message = ?,
               finished_at = ?, updated_at = ? WHERE id = ?`,
        ).run(
          input.errorCode.slice(0, 80),
          input.errorMessage.slice(0, 1_000),
          timestamp,
          timestamp,
          job.id,
        );
        db.prepare<[number, string]>(
          `UPDATE sceneseed_candidates SET state = 'failed', updated_at = ?
           WHERE job_id = ? AND state = 'pending'`,
        ).run(timestamp, job.id);
        db.prepare<[number, string, string]>(
          `UPDATE sceneseed_cards SET state = 'failed', updated_at = ?
           WHERE id = ? AND active_job_id = ?`,
        ).run(timestamp, job.card_id, job.id);
        const revision = bumpCanvasRevision(
          db,
          canvas.id,
          input.expectedCanvasRevision,
          timestamp,
        );
        return { job: jobFromRow(requiredJob(db, job.id)), revision };
      })();
    },

    listNonterminalJobs(): JobDto[] {
      return db
        .prepare<[], JobRow>(
          `SELECT * FROM sceneseed_jobs
           WHERE state IN ('queued', 'interpreting', 'candidate_ready', 'realizing')
              OR (state = 'cancelled' AND started_at IS NOT NULL AND thread_settled_at IS NULL)
           ORDER BY created_at, id`,
        )
        .all()
        .map(jobFromRow);
    },

    updateObjectTransform(input: {
      objectId: string;
      transform: Transform3D;
      expectedCanvasRevision: number;
    }): { object: ObjectDto; revision: number } {
      const transform = transformSchema.parse(input.transform);
      return db.transaction(() => {
        const object = requiredObject(db, input.objectId);
        const canvas = requiredCanvas(db, object.canvas_id);
        requireRevision(canvas, input.expectedCanvasRevision);
        if (object.removed_at !== null) {
          throw new SceneSeedStoreError(
            "invalid_state",
            "removed objects cannot be transformed",
          );
        }
        const timestamp = nowMs();
        db.prepare<[string, number, string]>(
          `UPDATE sceneseed_objects SET transform_json = ?, updated_at = ?
           WHERE id = ?`,
        ).run(JSON.stringify(transform), timestamp, object.id);
        const revision = bumpCanvasRevision(
          db,
          canvas.id,
          input.expectedCanvasRevision,
          timestamp,
        );
        return {
          object: objectFromRow(requiredObject(db, object.id)),
          revision,
        };
      })();
    },

    removeObject(input: { objectId: string; expectedCanvasRevision: number }): {
      object: ObjectDto;
      revision: number;
    } {
      return db.transaction(() => {
        const object = requiredObject(db, input.objectId);
        const canvas = requiredCanvas(db, object.canvas_id);
        requireRevision(canvas, input.expectedCanvasRevision);
        if (object.removed_at !== null) {
          return { object: objectFromRow(object), revision: canvas.revision };
        }
        const timestamp = nowMs();
        db.prepare<[number, number, string]>(
          `UPDATE sceneseed_objects SET removed_at = ?, updated_at = ? WHERE id = ?`,
        ).run(timestamp, timestamp, object.id);
        db.prepare<[number, number, number, string]>(
          `UPDATE sceneseed_jobs
           SET state = 'cancelled', finished_at = ?,
               thread_settled_at = CASE WHEN state = 'interpreting' THEN NULL ELSE ? END,
               updated_at = ?
           WHERE object_id = ? AND state IN ('queued', 'interpreting', 'candidate_ready', 'realizing')`,
        ).run(timestamp, timestamp, timestamp, object.id);
        db.prepare<[number, string]>(
          `UPDATE sceneseed_candidates SET state = 'superseded', updated_at = ?
           WHERE object_id = ? AND state = 'pending'`,
        ).run(timestamp, object.id);
        db.prepare<[number, string]>(
          `UPDATE sceneseed_cards
           SET state = 'ready', active_job_id = NULL, updated_at = ? WHERE id = ?`,
        ).run(timestamp, object.source_card_id);
        const revision = bumpCanvasRevision(
          db,
          canvas.id,
          input.expectedCanvasRevision,
          timestamp,
        );
        return {
          object: objectFromRow(requiredObject(db, object.id)),
          revision,
        };
      })();
    },

    duplicateObject(input: {
      sourceObjectId: string;
      objectId?: string;
      cardId?: string;
      jobId?: string;
      candidateId?: string;
      expectedCanvasRevision: number;
      transform?: Transform3D;
    }): {
      card: CardDto;
      object: ObjectDto;
      job: JobDto;
      candidate: SceneCandidateDto;
      revision: number;
    } {
      return db.transaction(() => {
        const source = requiredObject(db, input.sourceObjectId);
        const canvas = requiredCanvas(db, source.canvas_id);
        requireRevision(canvas, input.expectedCanvasRevision);
        if (
          source.removed_at !== null ||
          source.active_scene_id === null ||
          canvas.agent_thread_id === null
        ) {
          throw new SceneSeedStoreError(
            "invalid_state",
            "only an active realized object can be duplicated",
          );
        }
        ensureObjectCapacity(db, canvas.id);
        const sourceScene = requiredCandidate(db, source.active_scene_id);
        const nextCost = activeCanvasCost(db, canvas.id) + sourceScene.cost;
        if (nextCost > MAX_CANVAS_COST) {
          throw new SceneSeedStoreError(
            "canvas_cost_limit",
            `duplicate would raise canvas cost to ${nextCost}`,
          );
        }
        const sourceCard = requiredCard(db, source.source_card_id);
        const objectId = parseId(
          input.objectId ?? createId("object"),
          "object id",
        );
        const cardId = parseId(input.cardId ?? createId("card"), "card id");
        const jobId = parseId(input.jobId ?? createId("job"), "job id");
        const candidateId = parseId(
          input.candidateId ?? createId("scene"),
          "candidate id",
        );
        const transform = transformSchema.parse(
          input.transform ?? JSON.parse(source.transform_json),
        );
        const sourceParsed = normalizeSceneObjectV1(
          JSON.parse(sourceScene.normalized_scene_json),
        );
        const scene = normalizeSceneObjectV1({
          ...sourceParsed,
          jobId,
          objectId,
        });
        const timestamp = nowMs();
        db.prepare<[string, string, string, number, number, number]>(
          `INSERT INTO sceneseed_cards
           (id, canvas_id, prompt, state, order_index, created_at, updated_at)
           VALUES (?, ?, ?, 'complete', ?, ?, ?)`,
        ).run(
          cardId,
          canvas.id,
          sourceCard.prompt,
          nextOrder(db, "sceneseed_cards", canvas.id),
          timestamp,
          timestamp,
        );
        db.prepare<
          [string, string, string, string, string, number, number, number]
        >(
          `INSERT INTO sceneseed_objects
           (id, canvas_id, source_card_id, active_scene_id, transform_json,
            order_index, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        ).run(
          objectId,
          canvas.id,
          cardId,
          candidateId,
          JSON.stringify(transform),
          nextOrder(db, "sceneseed_objects", canvas.id),
          timestamp,
          timestamp,
        );
        db.prepare<
          [
            string,
            string,
            string,
            string,
            string,
            number,
            number,
            number,
            number,
            number,
          ]
        >(
          `INSERT INTO sceneseed_jobs
           (id, canvas_id, card_id, object_id, generation, state,
            agent_thread_id, started_at, finished_at, thread_settled_at,
            created_at, updated_at)
           VALUES (?, ?, ?, ?, 1, 'complete', ?, ?, ?, ?, ?, ?)`,
        ).run(
          jobId,
          canvas.id,
          cardId,
          objectId,
          canvas.agent_thread_id,
          timestamp,
          timestamp,
          timestamp,
          timestamp,
          timestamp,
        );
        const sceneJson = JSON.stringify(scene);
        db.prepare<
          [
            string,
            string,
            string,
            string,
            string,
            string,
            number,
            number,
            number,
            number,
            number,
          ]
        >(
          `INSERT INTO sceneseed_candidates
           (id, canvas_id, job_id, object_id, generation,
            original_scene_json, normalized_scene_json, scene_version, cost,
            state, realization_attempts, realized_at, created_at, updated_at)
           VALUES (?, ?, ?, ?, 1, ?, ?, ?, ?, 'active', 0, ?, ?, ?)`,
        ).run(
          candidateId,
          canvas.id,
          jobId,
          objectId,
          sceneJson,
          sceneJson,
          scene.version,
          sourceScene.cost,
          timestamp,
          timestamp,
          timestamp,
        );
        db.prepare<[string, string]>(
          "UPDATE sceneseed_cards SET active_job_id = ? WHERE id = ?",
        ).run(jobId, cardId);
        db.prepare<[string, string]>(
          "UPDATE sceneseed_objects SET active_job_id = ? WHERE id = ?",
        ).run(jobId, objectId);
        const revision = bumpCanvasRevision(
          db,
          canvas.id,
          input.expectedCanvasRevision,
          timestamp,
        );
        return {
          card: cardFromRow(requiredCard(db, cardId)),
          object: objectFromRow(requiredObject(db, objectId)),
          job: jobFromRow(requiredJob(db, jobId)),
          candidate: candidateFromRow(requiredCandidate(db, candidateId)),
          revision,
        };
      })();
    },

    deleteCanvas(input: { canvasId: string; expectedRevision: number }): {
      deleted: boolean;
      agentThreadId: string | null;
    } {
      return db.transaction(() => {
        const canvas = requiredCanvas(db, input.canvasId);
        requireRevision(canvas, input.expectedRevision);
        const result = db
          .prepare<[string]>("DELETE FROM sceneseed_canvases WHERE id = ?")
          .run(canvas.id);
        return {
          deleted: result.changes === 1,
          agentThreadId: canvas.agent_thread_id,
        };
      })();
    },

    clearAllCanvasData(): {
      deletedCanvasCount: number;
      agentThreadIds: string[];
    } {
      return db.transaction(() => {
        const threadRows = db
          .prepare<[], { agent_thread_id: string }>(
            `SELECT agent_thread_id FROM sceneseed_canvases
             WHERE agent_thread_id IS NOT NULL ORDER BY agent_thread_id`,
          )
          .all();
        const result = db.prepare("DELETE FROM sceneseed_canvases").run();
        return {
          deletedCanvasCount: result.changes,
          agentThreadIds: threadRows.map((row) => row.agent_thread_id),
        };
      })();
    },

    isDisclosureAcknowledged(): boolean {
      const acknowledgedAt = db
        .prepare<
          [],
          DisclosureRow
        >("SELECT disclosure_acknowledged_at FROM sceneseed_plugin_state WHERE id = 1")
        .get()?.disclosure_acknowledged_at;
      return acknowledgedAt !== null && acknowledgedAt !== undefined;
    },

    acknowledgeDisclosure(): { acknowledgedAt: number } {
      const timestamp = nowMs();
      db.prepare<[number]>(
        `UPDATE sceneseed_plugin_state
         SET disclosure_acknowledged_at = COALESCE(disclosure_acknowledged_at, ?)
         WHERE id = 1`,
      ).run(timestamp);
      const acknowledgedAt = db
        .prepare<
          [],
          DisclosureRow
        >("SELECT disclosure_acknowledged_at FROM sceneseed_plugin_state WHERE id = 1")
        .get()?.disclosure_acknowledged_at;
      if (acknowledgedAt === null || acknowledgedAt === undefined) {
        throw new SceneSeedStoreError(
          "invalid_state",
          "disclosure acknowledgement could not be saved",
        );
      }
      return { acknowledgedAt };
    },
  };
}

export type SceneSeedStore = ReturnType<typeof createSceneSeedStore>;
