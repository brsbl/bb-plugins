import { spawnSync } from "node:child_process";
import { readFile, readdir, stat } from "node:fs/promises";
import { builtinModules } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { readPluginWorkspaces } from "./plugin-workspaces.mjs";
import { pluginBuildBbVersion } from "./plugin-build-provenance.mjs";
import {
  pluginSdkVersion,
  sdkRangeIncludesVersion,
} from "./plugin-sdk-provenance.mjs";

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
  if (metadata.sdkVersion !== pluginSdkVersion) {
    throw new Error(`${path}: expected sdkVersion=${pluginSdkVersion}`);
  }
  if (metadata.builtWith?.bbVersion !== bbVersion) {
    throw new Error(`${path}: expected bb ${bbVersion} build metadata`);
  }
  if (metadata.builtWith?.pluginSdkVersion !== pluginSdkVersion) {
    throw new Error(
      `${path}: expected builtWith.pluginSdkVersion=${pluginSdkVersion}`,
    );
  }
}

const builtinModuleNames = new Set(
  builtinModules.flatMap((name) => [name, `node:${name}`]),
);
const managedServerRuntimeImports = new Set([
  "@get-bb/plugin-sdk",
  "better-sqlite3",
]);

function serverRuntimeImports(source) {
  const imports = new Set();
  for (const match of source.matchAll(/(?:^|\n)import\s+[^;]+;/gu)) {
    const specifier =
      /^import\s*["']([^"']+)["']/u.exec(match[0].trim())?.[1] ??
      /\bfrom\s+["']([^"']+)["']/u.exec(match[0])?.[1];
    if (specifier !== undefined) imports.add(specifier);
  }
  for (const match of source.matchAll(
    /\b(?:import|require)\s*\(\s*["']([^"']+)["']\s*\)/gu,
  )) {
    imports.add(match[1]);
  }
  return imports;
}

async function validateManagedServerBundle(path) {
  const source = await readFile(path, "utf8");
  for (const specifier of serverRuntimeImports(source)) {
    if (
      builtinModuleNames.has(specifier) ||
      managedServerRuntimeImports.has(specifier)
    ) {
      continue;
    }
    throw new Error(
      `${path}: server bundle has unmanaged runtime import ${JSON.stringify(specifier)}`,
    );
  }
}

function normalizePackagePath(path) {
  return path.replace(/^\.\//, "").replace(/\\/g, "/");
}

function normalizeManifestDirectory(path, label) {
  if (typeof path !== "string") {
    throw new Error(`${label} must contain only string paths`);
  }
  const normalized = normalizePackagePath(path).replace(/\/+$/, "");
  if (
    normalized === "" ||
    normalized.startsWith("/") ||
    normalized.split("/").some((segment) => segment === "." || segment === "..")
  ) {
    throw new Error(`${label} contains invalid path ${JSON.stringify(path)}`);
  }
  return normalized;
}

export function effectiveSkillsDirectories(manifest) {
  const configured = manifest.bb?.skills;
  if (configured === undefined) {
    return { directories: ["skills"], implicit: true };
  }
  if (!Array.isArray(configured)) {
    throw new Error(`${manifest.name}: bb.skills must be an array`);
  }
  const directories = configured.map((path) =>
    normalizeManifestDirectory(path, `${manifest.name}: bb.skills`),
  );
  if (new Set(directories).size !== directories.length) {
    throw new Error(`${manifest.name}: bb.skills contains duplicate paths`);
  }
  return { directories, implicit: false };
}

async function filesBelow(directory, prefix = "") {
  const entries = await readdir(directory, { withFileTypes: true }).catch(
    (error) => {
      if (error?.code === "ENOENT") return [];
      throw error;
    },
  );
  const files = [];
  for (const entry of entries) {
    const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      files.push(...(await filesBelow(resolve(directory, entry.name), relativePath)));
    } else if (entry.isFile()) {
      files.push(relativePath);
    }
  }
  return files;
}

async function validateSkills(directory, manifest, packed) {
  const skills = effectiveSkillsDirectories(manifest);

  if (!skills.implicit && skills.directories.length === 0) {
    const disabledSkillFiles = (await filesBelow(resolve(directory, "skills")))
      .filter((path) => path === "SKILL.md" || path.endsWith("/SKILL.md"));
    if (disabledSkillFiles.length > 0) {
      throw new Error(
        `${directory}: bb.skills opts out, but skills/${disabledSkillFiles[0]} exists`,
      );
    }
  }

  for (const skillsDirectory of skills.directories) {
    const skillFiles = (await filesBelow(resolve(directory, skillsDirectory)))
      .filter((path) => path === "SKILL.md" || path.endsWith("/SKILL.md"));
    if (skills.implicit && skillFiles.length > 0) {
      throw new Error(
        `${directory}: ${skillsDirectory}/${skillFiles[0]} would be implicitly auto-imported by bb; declare bb.skills explicitly`,
      );
    }
    if (!skills.implicit && skillFiles.length === 0) {
      throw new Error(
        `${directory}: bb.skills declares ${skillsDirectory}, but it contains no SKILL.md`,
      );
    }
    for (const skillFile of skillFiles) {
      const repositoryPath = `${skillsDirectory}/${skillFile}`;
      if (!packed.has(repositoryPath)) {
        throw new Error(
          `${directory}: ${repositoryPath} is declared by bb but omitted by the package allowlist`,
        );
      }
    }
  }
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
  const id = expectedPluginId(manifest.name);
  const buildBbVersion = options.buildBbVersion ?? pluginBuildBbVersion;

  if (options.expectedId && id !== options.expectedId) {
    throw new Error(`${directory}: expected plugin id ${options.expectedId}`);
  }
  if (options.expectedName && manifest.bb.name !== options.expectedName) {
    throw new Error(`${directory}: expected display name ${options.expectedName}`);
  }
  if (!sdkRangeIncludesVersion(manifest.engines?.bbPluginSdk, pluginSdkVersion)) {
    throw new Error(
      `${directory}: engines.bbPluginSdk must be a compatible floor at or below ${pluginSdkVersion}`,
    );
  }

  const serverBundlePath = resolve(directory, "dist/server.js");
  await requireNonEmpty(serverBundlePath);
  await validateManagedServerBundle(serverBundlePath);
  await validateMetadata(
    resolve(directory, "dist/server.meta.json"),
    manifest,
    id,
    buildBbVersion,
  );

  if (manifest.bb.app) {
    await requireNonEmpty(resolve(directory, "dist/app.js"));
    await validateMetadata(
      resolve(directory, "dist/app.meta.json"),
      manifest,
      id,
      buildBbVersion,
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
  if (options.expectedScreenshot) {
    const screenshot = normalizeManifestDirectory(
      options.expectedScreenshot,
      `${manifest.name}: screenshot`,
    );
    await requireNonEmpty(resolve(directory, screenshot));
    requirePacked(files, screenshot, directory);
  }
  await validateSkills(directory, manifest, files);
  if ([...files].some((path) => path.endsWith("package-lock.json"))) {
    throw new Error(`${directory}: package contains a nested lockfile`);
  }

  return { id, name: manifest.bb.name, packedFileCount: files.size };
}

async function main() {
  const requested = process.argv.slice(2);
  const directories = requested.length
    ? requested
    : (await readPluginWorkspaces(repositoryRoot)).map(({ source }) => source);

  for (const directory of directories) {
    const absoluteDirectory = resolve(repositoryRoot, directory);
    const result = await validatePluginArtifacts(absoluteDirectory);
    console.log(
      `validated ${result.id} (${result.name}), ${result.packedFileCount} packed files`,
    );
  }
}

if (resolve(process.argv[1] ?? "") === fileURLToPath(import.meta.url)) {
  await main();
}
