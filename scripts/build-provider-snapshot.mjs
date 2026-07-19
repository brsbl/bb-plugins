import {
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { build } from "esbuild";

const packageRoot = fileURLToPath(new URL("..", import.meta.url));
const generatedPaths = {
  snapshot: resolve(packageRoot, "generated/provider-snapshot.v1.json"),
  index: resolve(packageRoot, "generated/provider-index.v1.json"),
};
const check = process.argv.includes("--check");

async function readJson(path) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch (error) {
    if (error && typeof error === "object" && error.code === "ENOENT") {
      return undefined;
    }
    throw error;
  }
}

const bundle = await build({
  entryPoints: [resolve(packageRoot, "providers/build-entry.ts")],
  bundle: true,
  write: false,
  format: "esm",
  platform: "node",
  target: "node22",
  logLevel: "silent",
});
const source = bundle.outputFiles[0]?.text;
if (!source) throw new Error("Provider build entry did not produce a bundle.");

const temporaryDirectory = await mkdtemp(
  resolve(tmpdir(), "ui-pattern-atlas-providers-"),
);
const temporaryBundle = resolve(temporaryDirectory, "build-entry.mjs");
await writeFile(temporaryBundle, source);

let artifacts;
try {
  const providerBuild = await import(pathToFileURL(temporaryBundle).href);
  const previousSnapshot = await readJson(generatedPaths.snapshot);
  artifacts = providerBuild.buildRegisteredProviderArtifacts(
    previousSnapshot,
  );
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true });
}
const outputs = {
  snapshot: `${JSON.stringify(artifacts.snapshot, null, 2)}\n`,
  index: `${JSON.stringify(artifacts.index, null, 2)}\n`,
};

const lastKnownGood = artifacts.snapshot.providers.filter(
  ({ build: providerBuildState }) =>
    providerBuildState.mode === "last-known-good",
);
if (lastKnownGood.length) {
  console.warn(
    `Provider snapshot retained last-known-good data for: ${lastKnownGood.map(({ id }) => id).join(", ")}`,
  );
}

if (check) {
  const mismatches = [];
  for (const name of Object.keys(generatedPaths)) {
    const current = await readFile(generatedPaths[name], "utf8").catch(
      () => null,
    );
    if (current !== outputs[name]) mismatches.push(generatedPaths[name]);
  }
  if (mismatches.length) {
    throw new Error(
      `Provider artifacts are stale: ${mismatches.join(", ")}. Run npm run build:providers.`,
    );
  }
} else {
  await Promise.all(
    Object.keys(generatedPaths).map((name) =>
      writeFile(generatedPaths[name], outputs[name]),
    ),
  );
}
