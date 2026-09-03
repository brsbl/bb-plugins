import type { SceneObjectV1 } from "./scene-contract.js";
import { compileSceneSeedKitProgram } from "./scene-kit.js";
import type {
  CanvasSnapshotDto,
  SceneCandidateDto,
  Transform3D,
} from "./store.js";

export const SCENESEED_QA_SUBPATH = "qa-fixture";

const FIXTURE_TIME = Date.UTC(2026, 7, 26, 19, 0, 0);
const FIXTURE_TRANSFORM: Transform3D = {
  position: [0, 0, 0],
  rotation: [0, 0, 0],
  scale: [1, 1, 1],
};

function rainyThoughtScene(): SceneObjectV1 {
  return compileSceneSeedKitProgram(
    {
      version: 1,
      name: "Rainy thought",
      altText:
        "A pale rain cloud and dark halo suspended inside a clear glass jar.",
      camera: "three-quarter",
      material: "glass",
      movement: "breathe",
      shadow: "soft",
      parts: [
        {
          kind: "shape",
          id: "jar",
          shape: "cylinder",
          size: { width: 2.5, height: 3, depth: 2.5 },
          at: [0, 1.45, 0],
          tone: "light",
        },
        {
          kind: "shape",
          id: "cloud_left",
          shape: "sphere",
          size: { width: 1.5, height: 1.2, depth: 1.2 },
          at: [-0.48, 2.25, 0],
          scale: [1, 0.72, 0.86],
          tone: "dark",
        },
        {
          kind: "shape",
          id: "cloud_right",
          shape: "sphere",
          size: { width: 1.6, height: 1.3, depth: 1.2 },
          at: [0.48, 2.15, 0.05],
          scale: [1, 0.7, 0.84],
          tone: "dark",
        },
        {
          kind: "shape",
          id: "thought_halo",
          shape: "torus",
          size: { width: 2.25, height: 0.18, depth: 2.25 },
          at: [0, 2.12, 0],
          rotate: [Math.PI / 2, 0, 0],
          tone: "black",
        },
        {
          kind: "particles",
          id: "rain",
          effect: "motes",
          count: 42,
          size: 0.06,
          spread: { width: 1.4, height: 1.5, depth: 0.7 },
          at: [0, 1.25, 0],
          tone: "dark",
        },
      ],
    },
    { jobId: "job_rainy", objectId: "object_rainy" },
  );
}

function lighthouseScene(): SceneObjectV1 {
  return compileSceneSeedKitProgram(
    {
      version: 1,
      name: "Tiny lighthouse",
      altText:
        "A small dark lighthouse with a bright lantern and pointed black roof.",
      camera: "three-quarter",
      material: "matte",
      movement: "still",
      shadow: "crisp",
      parts: [
        {
          kind: "shape",
          id: "tower",
          shape: "cylinder",
          size: { width: 2, height: 4, depth: 2 },
          at: [0, 2, 0],
          scale: [0.72, 1, 0.72],
          tone: "dark",
        },
        {
          kind: "shape",
          id: "lantern",
          shape: "cylinder",
          size: { width: 1.45, height: 0.85, depth: 1.45 },
          at: [0, 4.3, 0],
          tone: "white",
        },
        {
          kind: "shape",
          id: "roof",
          shape: "cone",
          size: { width: 1.8, height: 1, depth: 1.8 },
          at: [0, 5.1, 0],
          tone: "black",
        },
      ],
      lights: [
        {
          id: "lantern_light",
          at: [0, 4.3, 0],
          tone: "white",
          intensity: 1.2,
          range: 5,
        },
      ],
    },
    { jobId: "job_lighthouse", objectId: "object_lighthouse" },
  );
}

function candidate(scene: SceneObjectV1, id: string): SceneCandidateDto {
  return {
    id,
    canvasId: "canvas_fixture",
    jobId: scene.jobId,
    objectId: scene.objectId,
    generation: 1,
    originalScene: scene,
    normalizedScene: scene,
    sceneVersion: 1,
    cost: 4,
    state: "active",
    realizationAttempts: 1,
    realizedAt: FIXTURE_TIME,
    readError: null,
    createdAt: FIXTURE_TIME,
    updatedAt: FIXTURE_TIME,
  };
}

export function createSceneSeedUiFixture(): CanvasSnapshotDto {
  const rainy = rainyThoughtScene();
  const lighthouse = lighthouseScene();
  return {
    canvas: {
      id: "canvas_fixture",
      name: "After the rain",
      schemaVersion: 1,
      revision: 7,
      agentThreadId: "thr_fixture",
      createdAt: FIXTURE_TIME - 86_400_000,
      updatedAt: FIXTURE_TIME,
    },
    cards: [
      {
        id: "card_rainy",
        canvasId: "canvas_fixture",
        prompt: "a rainy thought in a jar",
        state: "complete",
        order: 0,
        placement: { x: -2.8, y: 0.3 },
        activeJobId: rainy.jobId,
        createdAt: FIXTURE_TIME - 50_000,
        updatedAt: FIXTURE_TIME - 32_000,
      },
      {
        id: "card_lighthouse",
        canvasId: "canvas_fixture",
        prompt: "tiny red lighthouse",
        state: "complete",
        order: 1,
        placement: { x: 2.7, y: -0.8 },
        activeJobId: lighthouse.jobId,
        createdAt: FIXTURE_TIME - 40_000,
        updatedAt: FIXTURE_TIME - 18_000,
      },
      {
        id: "card_queue",
        canvasId: "canvas_fixture",
        prompt: "a brass moon on a museum stand",
        state: "queued",
        order: 2,
        placement: { x: 0.2, y: 3.2 },
        activeJobId: "job_queue",
        createdAt: FIXTURE_TIME - 8_000,
        updatedAt: FIXTURE_TIME - 8_000,
      },
      {
        id: "card_failed",
        canvasId: "canvas_fixture",
        prompt: "a secret too heavy to hold",
        state: "failed",
        order: 3,
        placement: { x: -0.6, y: -3.6 },
        activeJobId: "job_failed",
        createdAt: FIXTURE_TIME - 25_000,
        updatedAt: FIXTURE_TIME - 4_000,
      },
    ],
    objects: [
      {
        id: rainy.objectId,
        canvasId: "canvas_fixture",
        sourceCardId: "card_rainy",
        activeSceneId: "scene_rainy",
        activeJobId: rainy.jobId,
        transform: {
          ...FIXTURE_TRANSFORM,
          position: [-2.8, 0, 0.3],
        },
        order: 0,
        removedAt: null,
        createdAt: FIXTURE_TIME - 50_000,
        updatedAt: FIXTURE_TIME - 32_000,
      },
      {
        id: lighthouse.objectId,
        canvasId: "canvas_fixture",
        sourceCardId: "card_lighthouse",
        activeSceneId: "scene_lighthouse",
        activeJobId: lighthouse.jobId,
        transform: {
          ...FIXTURE_TRANSFORM,
          position: [2.7, 0, -0.8],
        },
        order: 1,
        removedAt: null,
        createdAt: FIXTURE_TIME - 40_000,
        updatedAt: FIXTURE_TIME - 18_000,
      },
    ],
    jobs: [
      {
        id: rainy.jobId,
        canvasId: "canvas_fixture",
        cardId: "card_rainy",
        objectId: rainy.objectId,
        generation: 1,
        state: "complete",
        agentThreadId: "thr_fixture",
        invalidSubmissionAttempts: 0,
        errorCode: null,
        errorMessage: null,
        startedAt: FIXTURE_TIME - 48_000,
        finishedAt: FIXTURE_TIME - 32_000,
        threadSettledAt: FIXTURE_TIME - 32_000,
        createdAt: FIXTURE_TIME - 50_000,
        updatedAt: FIXTURE_TIME - 32_000,
      },
      {
        id: lighthouse.jobId,
        canvasId: "canvas_fixture",
        cardId: "card_lighthouse",
        objectId: lighthouse.objectId,
        generation: 1,
        state: "complete",
        agentThreadId: "thr_fixture",
        invalidSubmissionAttempts: 0,
        errorCode: null,
        errorMessage: null,
        startedAt: FIXTURE_TIME - 36_000,
        finishedAt: FIXTURE_TIME - 18_000,
        threadSettledAt: FIXTURE_TIME - 18_000,
        createdAt: FIXTURE_TIME - 40_000,
        updatedAt: FIXTURE_TIME - 18_000,
      },
      {
        id: "job_queue",
        canvasId: "canvas_fixture",
        cardId: "card_queue",
        objectId: "object_queue",
        generation: 1,
        state: "queued",
        agentThreadId: "thr_fixture",
        invalidSubmissionAttempts: 0,
        errorCode: null,
        errorMessage: null,
        startedAt: null,
        finishedAt: null,
        threadSettledAt: null,
        createdAt: FIXTURE_TIME - 8_000,
        updatedAt: FIXTURE_TIME - 8_000,
      },
      {
        id: "job_failed",
        canvasId: "canvas_fixture",
        cardId: "card_failed",
        objectId: "object_failed",
        generation: 1,
        state: "failed",
        agentThreadId: "thr_fixture",
        invalidSubmissionAttempts: 2,
        errorCode: "invalid_scene",
        errorMessage: "Interpretation did not fit the canvas.",
        startedAt: FIXTURE_TIME - 23_000,
        finishedAt: FIXTURE_TIME - 4_000,
        threadSettledAt: FIXTURE_TIME - 4_000,
        createdAt: FIXTURE_TIME - 25_000,
        updatedAt: FIXTURE_TIME - 4_000,
      },
    ],
    candidates: [
      candidate(rainy, "scene_rainy"),
      candidate(lighthouse, "scene_lighthouse"),
    ],
  };
}
