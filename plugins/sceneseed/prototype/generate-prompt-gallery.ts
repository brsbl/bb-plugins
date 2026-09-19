import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { safeCompileSceneCode } from "../scene-code.js";
import {
  PROMPT_GALLERY_PROMPTS,
  buildPromptGallerySource,
} from "./prompt-gallery-prompts.js";

const outputDirectory = fileURLToPath(
  new URL("./generated/", import.meta.url),
);
const outputPath = fileURLToPath(
  new URL("./generated/prompt-gallery-scenes.json", import.meta.url),
);

const entries: Array<Record<string, unknown>> = [];
const failures: Array<Record<string, unknown>> = [];

function canonicalScene(value: unknown): string {
  return JSON.stringify(value, (_key, candidate) =>
    typeof candidate === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(
      candidate,
    )
      ? "<uuid>"
      : candidate,
  );
}

for (const [index, prompt] of PROMPT_GALLERY_PROMPTS.entries()) {
  const source = buildPromptGallerySource(prompt);
  const identity = {
    jobId: `job_gallery_${String(index + 1).padStart(2, "0")}`,
    objectId: `object_gallery_${String(index + 1).padStart(2, "0")}`,
  };
  const first = safeCompileSceneCode(source, identity);
  const second = safeCompileSceneCode(source, identity);
  if (!first.success || !second.success) {
    failures.push({
      id: prompt.id,
      title: prompt.title,
      issues: !first.success
        ? first.issues
        : !second.success
          ? second.issues
          : [],
    });
    continue;
  }
  const deterministic =
    canonicalScene(first.scene.objectJson) === canonicalScene(second.scene.objectJson);
  if (!deterministic) {
    failures.push({
      id: prompt.id,
      title: prompt.title,
      issues: [{ message: "Repeated compilation produced different geometry." }],
    });
    continue;
  }
  entries.push({
    ...prompt,
    index: index + 1,
    sourceBytes: new TextEncoder().encode(source).byteLength,
    deterministic,
    scene: first.scene,
  });
}

await mkdir(outputDirectory, { recursive: true });
await writeFile(
  outputPath,
  `${JSON.stringify(
    {
      viewport: { width: 1440, height: 900 },
      count: PROMPT_GALLERY_PROMPTS.length,
      entries,
      failures,
    },
    null,
    2,
  )}\n`,
  "utf8",
);

if (failures.length > 0 || entries.length !== PROMPT_GALLERY_PROMPTS.length) {
  console.error(JSON.stringify({ entries: entries.length, failures }, null, 2));
  process.exitCode = 1;
} else {
  const vertices = entries.map((entry) =>
    Number((entry.scene as { stats: { vertices: number } }).stats.vertices),
  );
  console.log(
    JSON.stringify(
      {
        outputPath,
        entries: entries.length,
        vertices: {
          minimum: Math.min(...vertices),
          maximum: Math.max(...vertices),
          average: Math.round(
            vertices.reduce((total, value) => total + value, 0) / vertices.length,
          ),
        },
      },
      null,
      2,
    ),
  );
}
