import { createHash } from "node:crypto";
import { readdir, readFile, stat } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { readPluginWorkspaces } from "./plugin-workspaces.mjs";

const defaultRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function normalizeRelativePath(path, label) {
  assert(typeof path === "string", `${label} must be a string`);
  const normalized = path
    .replace(/\\/g, "/")
    .replace(/^\.\//, "")
    .replace(/\/+$/, "");
  assert(
    normalized !== "" &&
      !normalized.startsWith("/") &&
      !normalized.split("/").some((segment) => segment === "." || segment === ".."),
    `${label} contains invalid path ${JSON.stringify(path)}`,
  );
  return normalized;
}

function packageFilesInclude(manifestFiles, path) {
  return manifestFiles.some((entry) => {
    if (typeof entry !== "string") return false;
    const normalized = entry
      .replace(/\\/g, "/")
      .replace(/^\.\//, "")
      .replace(/\/+$/, "");
    return normalized === path || path.startsWith(`${normalized}/`);
  });
}

function markdownImageTargets(markdown) {
  return [...markdown.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)].map(
    (match) => match[1],
  );
}

function localImageTargets(markdown) {
  return markdownImageTargets(markdown).filter(
    (target) => !/^(?:[a-z]+:|#)/i.test(target),
  );
}

async function nestedLockfiles(directory) {
  const found = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === "dist") continue;
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) found.push(...(await nestedLockfiles(path)));
    if (entry.isFile() && entry.name === "package-lock.json") found.push(path);
  }
  return found;
}

async function directoryContainsFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true }).catch(
    (error) => {
      if (error?.code === "ENOENT") return [];
      throw error;
    },
  );
  for (const entry of entries) {
    if (entry.isFile()) return true;
    if (
      entry.isDirectory() &&
      (await directoryContainsFiles(resolve(directory, entry.name)))
    ) {
      return true;
    }
  }
  return false;
}

export async function checkRepository(repositoryRoot = defaultRoot, options = {}) {
  const root = resolve(repositoryRoot);
  const rootManifest = await readJson(resolve(root, "package.json"));
  const readme = await readFile(resolve(root, "README.md"), "utf8");
  const rootImages = markdownImageTargets(readme);
  const plugins = await readPluginWorkspaces(root);
  const bundledTypesDirectory = resolve(
    options.bundledTypesDirectory ??
      resolve(root, "node_modules/@bb/plugin-sdk/bundled-types"),
  );

  assert(rootManifest.workspaces.includes("plugins/*"), "plugins workspace missing");
  assert(rootManifest.workspaces.includes("packages/*"), "packages workspace missing");
  assert(
    !(await stat(resolve(root, "plugins/design-loop")).catch(() => null)),
    "Design Loop is intentionally excluded",
  );

  const packageNames = new Set();
  const pluginIds = new Set();
  const stableIds = new Map([
    ["improve-prompt", "prompt-shaper"],
    ["omegacode", "omega"],
  ]);

  for (const plugin of plugins) {
    const { directory, installRef, manifest, name, packageName, pluginId, slug, source } =
      plugin;
    assert(!packageNames.has(packageName), `duplicate package ${packageName}`);
    assert(!pluginIds.has(pluginId), `duplicate plugin id ${pluginId}`);
    packageNames.add(packageName);
    pluginIds.add(pluginId);
    if (stableIds.has(slug)) {
      assert(pluginId === stableIds.get(slug), `${slug}: stable plugin id drift`);
    }

    const pluginReadme = await readFile(resolve(directory, "README.md"), "utf8");
    for (const script of ["typecheck", "test", "build"]) {
      assert(typeof manifest.scripts?.[script] === "string", `${slug}: ${script} script missing`);
    }
    assert(Array.isArray(manifest.files), `${slug}: package files allowlist missing`);
    assert(
      manifest.files.some((path) => path.replace(/\/$/, "") === "dist"),
      `${slug}: dist missing from package files`,
    );
    assert(manifest.files.includes("README.md"), `${slug}: README missing from package files`);
    assert(manifest.engines?.bb === ">=0.0.32", `${slug}: bb engine drift`);
    assert(manifest.engines?.bbPluginSdk === "^0.4.0", `${slug}: SDK engine drift`);
    assert(pluginReadme.startsWith(`# ${name}\n`), `${slug}: README title drift`);
    for (const heading of ["## Install", "## Use", "## Develop"]) {
      assert(pluginReadme.includes(heading), `${slug}: README missing ${heading}`);
    }
    assert(readme.includes(`(${source})`), `${slug}: root source link missing`);
    assert(
      readme.includes(`[README](${source}/README.md)`),
      `${slug}: root README link missing`,
    );
    assert(readme.includes(`@${installRef}`), `${slug}: root install ref missing`);

    const screenshots = localImageTargets(pluginReadme).map((path) =>
      normalizeRelativePath(path, `${slug}: screenshot`),
    );
    assert(screenshots.length > 0, `${slug}: README screenshot missing`);
    for (const screenshot of screenshots) {
      const details = await stat(resolve(directory, screenshot)).catch(() => null);
      assert(
        details?.isFile() && details.size > 0,
        `${slug}: screenshot ${screenshot} is missing or empty`,
      );
      assert(
        packageFilesInclude(manifest.files, screenshot),
        `${slug}: screenshot ${screenshot} is omitted by package files`,
      );
    }
    assert(
      screenshots.some((screenshot) => rootImages.includes(`${source}/${screenshot}`)),
      `${slug}: root representative screenshot missing`,
    );
    assert(
      !(await directoryContainsFiles(resolve(directory, ".github/workflows"))),
      `${slug}: nested plugin .github/workflows is not allowed`,
    );

    for (const typeFile of ["bb-plugin-sdk.d.ts", "bb-plugin-sdk-app.d.ts"]) {
      const local = await readFile(resolve(directory, "types", typeFile), "utf8");
      const authoritative = await readFile(
        resolve(bundledTypesDirectory, typeFile),
        "utf8",
      );
      assert(local === authoritative, `${slug}: ${typeFile} is out of sync`);
    }
  }

  const locks = await nestedLockfiles(resolve(root, "plugins"));
  assert(locks.length === 0, `nested lockfiles found:\n${locks.join("\n")}`);

  const sdkRecord = await readJson(resolve(root, "tooling/vendor/sdk-provenance.json"));
  const sdkArchive = await readFile(resolve(root, "tooling/vendor", sdkRecord.archive));
  const sdkHash = createHash("sha256").update(sdkArchive).digest("hex");
  assert(sdkHash === sdkRecord.sha256, "vendored plugin SDK hash mismatch");

  return { pluginCount: plugins.length };
}

if (resolve(process.argv[1] ?? "") === fileURLToPath(import.meta.url)) {
  const result = await checkRepository();
  console.log(`repository hygiene passed for ${result.pluginCount} plugins`);
}
