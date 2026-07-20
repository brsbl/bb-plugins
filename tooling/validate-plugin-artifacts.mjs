import { spawnSync } from "node:child_process";
import { readFile, stat } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

async function requireNonEmpty(path) {
  const details = await stat(path);
  if (!details.isFile() || details.size === 0) {
    throw new Error(`${path} is not a non-empty file`);
  }
}

function expectedPluginId(packageName) {
  if (!packageName.startsWith("bb-plugin-")) {
    throw new Error(`plugin package ${packageName} must start with bb-plugin-`);
  }
  return packageName.slice("bb-plugin-".length);
}

async function validateMetadata(path, manifest, id, bbVersion) {
  const metadata = await readJson(path);
  const expectedSdk = manifest.engines.bbPluginSdk.match(/\d+\.\d+\.\d+/)?.[0];
  const expected = {
    artifactFormatVersion: 1,
    pluginId: id,
    pluginVersion: manifest.version,
  };
  for (const [key, value] of Object.entries(expected)) {
    if (metadata[key] !== value) {
      throw new Error(`${path}: expected ${key}=${JSON.stringify(value)}`);
    }
  }
  if (metadata.sdkVersion !== expectedSdk) {
    throw new Error(`${path}: expected sdkVersion=${expectedSdk}`);
  }
  if (metadata.builtWith?.bbVersion !== bbVersion) {
    throw new Error(`${path}: expected bb ${bbVersion} build metadata`);
  }
}

function normalizePackagePath(path) {
  return path.replace(/^\.\//, "").replace(/\\/g, "/");
}

function packedFiles(directory) {
  const result = spawnSync(
    "npm",
    ["pack", "--dry-run", "--json", "--ignore-scripts"],
    { cwd: directory, encoding: "utf8", maxBuffer: 32 * 1024 * 1024 },
  );
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`npm pack failed in ${directory}:\n${result.stderr || result.stdout}`);
  }
  const report = JSON.parse(result.stdout);
  return new Set(
    report[0].files.map(({ path }) => normalizePackagePath(path)),
  );
}

function requirePacked(files, path, directory) {
  const normalized = normalizePackagePath(path);
  if (!files.has(normalized)) {
    throw new Error(`${directory}: package omits ${normalized}`);
  }
}

export async function validatePluginArtifacts(pluginDirectory, options = {}) {
  const directory = resolve(pluginDirectory);
  const manifest = await readJson(resolve(directory, "package.json"));
  const rootManifest = await readJson(resolve(repositoryRoot, "package.json"));
  const id = expectedPluginId(manifest.name);
  const bbVersion = options.bbVersion ?? rootManifest.devDependencies["bb-app"];

  if (options.expectedId && id !== options.expectedId) {
    throw new Error(`${directory}: expected plugin id ${options.expectedId}`);
  }
  if (options.expectedName && manifest.bb.name !== options.expectedName) {
    throw new Error(`${directory}: expected display name ${options.expectedName}`);
  }

  await requireNonEmpty(resolve(directory, "dist/server.js"));
  await validateMetadata(
    resolve(directory, "dist/server.meta.json"),
    manifest,
    id,
    bbVersion,
  );

  if (manifest.bb.app) {
    await requireNonEmpty(resolve(directory, "dist/app.js"));
    await validateMetadata(
      resolve(directory, "dist/app.meta.json"),
      manifest,
      id,
      bbVersion,
    );
  }

  const files = packedFiles(directory);
  for (const path of ["package.json", "README.md", "dist/server.js", "dist/server.meta.json"]) {
    requirePacked(files, path, directory);
  }
  if (manifest.bb.app) {
    for (const path of ["dist/app.js", "dist/app.css", "dist/app.meta.json"]) {
      requirePacked(files, path, directory);
    }
  }
  for (const path of Object.values(manifest.bb.branding?.logo ?? {})) {
    requirePacked(files, path, directory);
  }
  for (const skillsDirectory of manifest.bb.skills ?? []) {
    const prefix = `${normalizePackagePath(skillsDirectory).replace(/\/$/, "")}/`;
    if (![...files].some((path) => path.startsWith(prefix))) {
      throw new Error(`${directory}: package omits skills under ${prefix}`);
    }
  }
  if ([...files].some((path) => path.endsWith("package-lock.json"))) {
    throw new Error(`${directory}: package contains a nested lockfile`);
  }

  return { id, name: manifest.bb.name, packedFileCount: files.size };
}

async function main() {
  const requested = process.argv.slice(2);
  const directories = requested.length
    ? requested
    : (await readJson(resolve(repositoryRoot, "catalog/plugins.json"))).plugins.map(
        ({ source }) => source,
      );

  for (const directory of directories) {
    const result = await validatePluginArtifacts(resolve(repositoryRoot, directory));
    console.log(
      `validated ${result.id} (${result.name}), ${result.packedFileCount} packed files`,
    );
  }
}

if (resolve(process.argv[1] ?? "") === fileURLToPath(import.meta.url)) {
  await main();
}
