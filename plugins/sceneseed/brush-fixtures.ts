import * as THREE from "three";

import {
  normalizeSceneObject,
  type SceneObject,
  type SceneObjectV2,
} from "./scene-contract.js";
import { compileSceneSeedKitProgram } from "./scene-kit.js";
import { prepareGeneratedRoot } from "./scene-output.js";
import {
  createProceduralBrushApi,
  type ProceduralBrush,
} from "./procedural-brush.js";

export type BrushFixtureId = "seated-traveler" | "rain-jar" | "pocket-radio";

export interface BrushComparisonFixture {
  readonly id: BrushFixtureId;
  readonly prompt: string;
  readonly before: SceneObject;
  readonly after: SceneObjectV2;
}

export const BRUSH_COMPARISON_CRITERIA = [
  "stroke character",
  "graphite texture",
  "pressure and width variation",
  "searching-line layering",
  "grayscale and tint hierarchy",
  "overall illustration quality",
] as const;

const PALETTE = [
  "#111111",
  "#444444",
  "#888888",
  "#cccccc",
  "#f5f5f5",
] as const;

function makeSketchScene(input: {
  readonly id: BrushFixtureId;
  readonly name: string;
  readonly altText: string;
  readonly draw: (brush: ProceduralBrush, root: THREE.Group) => void;
}): SceneObjectV2 {
  const root = new THREE.Group();
  const brush = createProceduralBrushApi().create({
    seed:
      input.id === "seated-traveler"
        ? 19
        : input.id === "rain-jar"
          ? 43
          : 71,
    texture: "pencil",
    textureStrength: 0.92,
    shape: "tapered",
    width: 0.11,
    opacity: 0.9,
    pressureVariation: 0.34,
    jitter: 0.65,
    layering: 3,
    color: 0x111111,
    colorBehavior: "graphite",
    colorVariation: 0.14,
    smoothing: 0.25,
  });
  input.draw(brush, root);
  const prepared = prepareGeneratedRoot(root);
  return normalizeSceneObject({
    version: 2,
    jobId: `job_brush_${input.id.replaceAll("-", "_")}`,
    objectId: `object_brush_${input.id.replaceAll("-", "_")}`,
    name: input.name,
    altText: input.altText,
    bounds: prepared.bounds,
    cameraHint: "front",
    palette: [...PALETTE],
    motion: { preset: "none", speed: 0, amplitude: 0 },
    ground: { contactShadow: { strength: 0, softness: 1 } },
    objectJson: prepared.objectJson,
    stats: prepared.stats,
  }) as SceneObjectV2;
}

function seatedTravelerBefore(): SceneObject {
  return compileSceneSeedKitProgram(
    {
      version: 1,
      name: "Seated traveler",
      altText: "A simplified traveler leaning back in a chair.",
      camera: "front",
      material: "matte",
      movement: "still",
      shadow: "none",
      parts: [
        { kind: "shape", id: "head", shape: "sphere", size: { width: 1.2, height: 1.2, depth: 1 }, at: [-0.7, 3.6, 0], tone: "dark" },
        { kind: "shape", id: "body", shape: "capsule", size: { width: 1.8, height: 3.1, depth: 1 }, at: [-0.2, 2.1, 0], rotate: [0, 0, -0.45], tone: "mid" },
        { kind: "shape", id: "legs", shape: "capsule", size: { width: 1.1, height: 4, depth: 0.9 }, at: [1.4, 0.4, 0], rotate: [0, 0, -0.72], tone: "light" },
        { kind: "shape", id: "chair_back", shape: "box", size: { width: 0.3, height: 5.4, depth: 1 }, at: [-2, 1.3, 0.2], rotate: [0, 0, 0.24], tone: "black" },
        { kind: "shape", id: "chair_seat", shape: "box", size: { width: 3.5, height: 0.3, depth: 1.2 }, at: [-0.2, 0.6, 0.2], rotate: [0, 0, -0.12], tone: "black" },
      ],
    },
    { jobId: "job_before_seated", objectId: "object_before_seated" },
  );
}

function rainJarBefore(): SceneObject {
  return compileSceneSeedKitProgram(
    {
      version: 1,
      name: "Rain jar",
      altText: "A cloud and rain contained in a cylindrical jar.",
      camera: "front",
      material: "matte",
      movement: "still",
      shadow: "none",
      parts: [
        { kind: "shape", id: "jar", shape: "cylinder", size: { width: 4, height: 5.8, depth: 1 }, at: [0, 2.9, 0], tone: "light" },
        { kind: "shape", id: "cloud_left", shape: "sphere", size: { width: 2.4, height: 1.2, depth: 0.8 }, at: [-0.8, 3.8, 0.1], tone: "dark" },
        { kind: "shape", id: "cloud_right", shape: "sphere", size: { width: 2.5, height: 1.4, depth: 0.8 }, at: [0.8, 3.7, 0.1], tone: "dark" },
        { kind: "particles", id: "rain", effect: "motes", count: 28, size: 0.08, spread: { width: 2.2, height: 2.1, depth: 0.3 }, at: [0, 2.1, 0.1], tone: "dark" },
      ],
    },
    { jobId: "job_before_rain", objectId: "object_before_rain" },
  );
}

function pocketRadioBefore(): SceneObject {
  return compileSceneSeedKitProgram(
    {
      version: 1,
      name: "Pocket radio",
      altText: "A boxy pocket radio with a handle, speaker, and two knobs.",
      camera: "front",
      material: "matte",
      movement: "still",
      shadow: "none",
      parts: [
        { kind: "shape", id: "body", shape: "box", size: { width: 5.8, height: 3.7, depth: 1 }, at: [0, 1.9, 0], tone: "light" },
        { kind: "shape", id: "speaker", shape: "cylinder", size: { width: 2.2, height: 0.2, depth: 2.2 }, at: [-1.2, 2, 0.6], rotate: [Math.PI / 2, 0, 0], tone: "dark" },
        { kind: "shape", id: "dial", shape: "cylinder", size: { width: 0.8, height: 0.25, depth: 0.8 }, at: [1.6, 2.4, 0.6], rotate: [Math.PI / 2, 0, 0], tone: "black" },
        { kind: "shape", id: "knob", shape: "cylinder", size: { width: 0.55, height: 0.25, depth: 0.55 }, at: [2, 1.3, 0.6], rotate: [Math.PI / 2, 0, 0], tone: "dark" },
        { kind: "shape", id: "handle", shape: "torus", size: { width: 3.4, height: 0.25, depth: 2.5 }, at: [0, 4, 0], tone: "dark" },
      ],
    },
    { jobId: "job_before_radio", objectId: "object_before_radio" },
  );
}

function seatedTravelerAfter(): SceneObjectV2 {
  return makeSketchScene({
    id: "seated-traveler",
    name: "Seated traveler sketch",
    altText: "A loose graphite traveler leans back in a chair with crossed legs and a book on their lap.",
    draw(brush, root) {
      root.add(brush.stroke([[-3.1,-3],[-3.2,0.7],[-2.8,3],[-1.8,4],[-0.9,3.7],[-0.5,2.5],[0.5,1.6],[2.8,-0.5],[3.4,-2.4],[2.2,-3.2]], { pressure: [0.2,0.65,0.9,0.72,1,0.8,0.68,0.92,0.55,0.18] }));
      root.add(brush.stroke([[-1.8,3.9],[-1.3,4.4],[-0.5,4.1],[-0.4,3.3],[-1.1,3],[-1.8,3.3]], { closed: true, width: 0.12 }));
      root.add(brush.stroke([[-0.6,2.7],[0.3,2],[1.4,1.5],[0.6,0.8],[-0.5,1.1],[-1.2,2.1]], { closed: true }));
      root.add(brush.stroke([[-0.4,1.2],[1,1.1],[1.8,0.5],[0.8,0.1],[-0.6,0.5]], { closed: true, width: 0.11 }));
      root.add(brush.stroke([[0.7,0.1],[1.8,-0.5],[2.8,-1.8],[3.2,-2.7]], { pressure: [0.25,0.9,0.72,0.12] }));
      root.add(brush.stroke([[-2.9,2.2],[-3.7,0.4],[-2.4,-0.8],[0.2,-0.4]], { opacity: 0.66, width: 0.09, layering: 1 }));
      root.add(brush.stroke([[-2.7,0.6],[-2.1,-1.2],[-1.7,-3.5]], { opacity: 0.66, width: 0.08, layering: 1 }));
    },
  });
}

function rainJarAfter(): SceneObjectV2 {
  return makeSketchScene({
    id: "rain-jar",
    name: "Rain jar sketch",
    altText: "A loose graphite cloud rains inside an imperfect glass jar outline.",
    draw(brush, root) {
      root.add(brush.stroke([[-2.4,-2.8],[-2.7,0.8],[-2.3,3.3],[0,3.7],[2.2,3.2],[2.7,0.6],[2.4,-2.8]], { closed: true, pressure: [0.18,0.7,0.9,0.62,1,0.65,0.16] }));
      root.add(brush.stroke([[-2.3,2.8],[-1,2.55],[0.3,2.8],[1.4,2.5],[2.2,2.9]], { width: 0.1 }));
      root.add(brush.stroke([[-1.8,1.9],[-1.2,2.55],[-0.3,2.25],[0.5,2.7],[1.5,2.1],[1.1,1.55],[0,1.7],[-1.1,1.5]], { closed: true }));
      root.add(brush.stroke([[-1,1.2],[-0.8,-0.2]], { width: 0.08, opacity: 0.66, pressure: [0.8,0.2] }));
      root.add(brush.stroke([[0,1.3],[0.1,-0.5]], { width: 0.08, opacity: 0.66, pressure: [0.9,0.2] }));
      root.add(brush.stroke([[1,1.15],[0.8,0.05]], { width: 0.08, opacity: 0.66, pressure: [0.82,0.2] }));
      root.add(brush.stroke([[-1.8,-2.1],[-0.8,-2.35],[0.5,-2.2],[1.7,-2.4]], { opacity: 0.34, width: 0.07, layering: 1 }));
    },
  });
}

function pocketRadioAfter(): SceneObjectV2 {
  return makeSketchScene({
    id: "pocket-radio",
    name: "Pocket radio sketch",
    altText: "A loose graphite pocket radio with a bowed handle, speaker marks, and two uneven knobs.",
    draw(brush, root) {
      root.add(brush.stroke([[-3.2,-2.2],[-3.4,1.5],[-2.7,2.5],[0.4,2.7],[3.1,2],[3.4,-1.5],[2.6,-2.5],[-1,-2.7]], { closed: true, pressure: [0.2,0.8,0.68,0.92,0.72,1,0.55,0.16] }));
      root.add(brush.stroke([[-2.2,2.5],[-1.9,3.7],[-0.6,4.25],[1.1,4.05],[2.1,3.1],[2.2,2.2]], { width: 0.12 }));
      root.add(brush.stroke([[-2.4,-1.3],[-2.6,0],[-2.1,1.2],[-0.9,1.45],[0.1,0.8],[0.2,-0.6],[-0.8,-1.5]], { closed: true }));
      root.add(brush.stroke([[-1.8,-0.9],[-1.5,0.7],[-0.7,1.1],[-0.1,0.1],[-0.6,-1]], { opacity: 0.66, width: 0.08, layering: 1 }));
      root.add(brush.stroke([[1.2,1.1],[1.8,1.5],[2.4,1.1],[2.1,0.5],[1.4,0.5]], { closed: true, width: 0.11 }));
      root.add(brush.stroke([[1.5,-0.7],[2,-0.35],[2.45,-0.8],[2,-1.3],[1.55,-1]], { closed: true, width: 0.09 }));
      root.add(brush.stroke([[0.5,-1.8],[1.1,-1.55],[1.7,-1.8]], { opacity: 0.36, width: 0.08, layering: 1 }));
    },
  });
}

export function createBrushComparisonFixtures(): readonly BrushComparisonFixture[] {
  return [
    {
      id: "seated-traveler",
      prompt: "a tired traveler sketching in a chair",
      before: seatedTravelerBefore(),
      after: seatedTravelerAfter(),
    },
    {
      id: "rain-jar",
      prompt: "a rainy thought in a jar",
      before: rainJarBefore(),
      after: rainJarAfter(),
    },
    {
      id: "pocket-radio",
      prompt: "a playful pocket radio",
      before: pocketRadioBefore(),
      after: pocketRadioAfter(),
    },
  ];
}
