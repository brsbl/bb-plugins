import { createHash } from "node:crypto";
import { readdir, readFile, stat } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  markdownTableText,
  renderCatalogBlock,
} from "./catalog-renderer.mjs";

const defaultRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function normalizeRelativePath(path, label) {
  assert(typeof path === "string", `${label} must be a string`);
  const normalized = path.replace(/\\/g, "/").replace(/^\.\//, "").replace(/\/+$/, "");
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
    const normalized = entry.replace(/\\/g, "/").replace(/^\.\//, "").replace(/\/+$/, "");
    return normalized === path || path.startsWith(`${normalized}/`);
  });
}

function markdownImageTargets(markdown) {
  return [...markdown.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)].map((match) => match[1]);
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
  const catalog = await readJson(resolve(root, "catalog/plugins.json"));
  const readme = await readFile(resolve(root, "README.md"), "utf8");
  const provenance = await readFile(resolve(root, "docs/provenance.md"), "utf8");
  const bundledTypesDirectory = resolve(
    options.bundledTypesDirectory ??
      resolve(root, "node_modules/@bb/plugin-sdk/bundled-types"),
  );

  assert(catalog.schemaVersion === 1, "unsupported catalog schema");
  assert(
    readme.includes(renderCatalogBlock(catalog)),
    "README plugin table has drifted from catalog/plugins.json",
  );
  assert(rootManifest.workspaces.includes("plugins/*"), "plugins workspace missing");
  assert(rootManifest.workspaces.includes("packages/*"), "packages workspace missing");
  assert(
    !(await stat(resolve(root, "plugins/design-loop")).catch(() => null)),
    "Design Loop is intentionally excluded",
  );

  const slugs = new Set();
  const packageNames = new Set();
  const pluginIds = new Set();
  for (const entry of catalog.plugins) {
    assert(!slugs.has(entry.slug), `duplicate catalog slug ${entry.slug}`);
    assert(!packageNames.has(entry.packageName), `duplicate package ${entry.packageName}`);
    assert(!pluginIds.has(entry.pluginId), `duplicate plugin id ${entry.pluginId}`);
    slugs.add(entry.slug);
    packageNames.add(entry.packageName);
    pluginIds.add(entry.pluginId);

    assert(entry.source === `plugins/${entry.slug}`, `${entry.slug}: source mismatch`);
    assert(entry.installRef === `plugin/${entry.slug}`, `${entry.slug}: install ref mismatch`);
    assert(Object.hasOwn(entry, "screenshot"), `${entry.slug}: screenshot metadata missing`);
    assert(
      entry.screenshot === null || typeof entry.screenshot === "string",
      `${entry.slug}: screenshot must be a relative path or null`,
    );
    assert(Array.isArray(entry.surfaces) && entry.surfaces.length > 0, `${entry.slug}: surfaces missing`);
    for (const field of ["purpose", "whenToUse", "visual", "ci", "maintenance"]) {
      assert(typeof entry[field] === "string" && entry[field].length > 0, `${entry.slug}: ${field} missing`);
    }

    const directory = resolve(root, entry.source);
    const manifest = await readJson(resolve(directory, "package.json"));
    const pluginReadme = await readFile(resolve(directory, "README.md"), "utf8");
    assert(manifest.name === entry.packageName, `${entry.slug}: package name drift`);
    assert(manifest.bb.name === entry.name, `${entry.slug}: display name drift`);
    assert(
      manifest.name.slice("bb-plugin-".length) === entry.pluginId,
      `${entry.slug}: stable plugin id drift`,
    );
    for (const script of ["typecheck", "test", "build"]) {
      assert(typeof manifest.scripts?.[script] === "string", `${entry.slug}: ${script} script missing`);
    }
    assert(Array.isArray(manifest.files), `${entry.slug}: package files allowlist missing`);
    assert(
      manifest.files.some((path) => path.replace(/\/$/, "") === "dist"),
      `${entry.slug}: dist missing from package files`,
    );
    assert(manifest.files.includes("README.md"), `${entry.slug}: README missing from package files`);
    assert(manifest.engines?.bb === ">=0.0.32", `${entry.slug}: bb engine drift`);
    assert(manifest.engines?.bbPluginSdk === "^0.4.0", `${entry.slug}: SDK engine drift`);
    assert(pluginReadme.startsWith(`# ${entry.name}\n`), `${entry.slug}: README title drift`);
    for (const heading of ["## Install", "## Use", "## Develop"]) {
      assert(pluginReadme.includes(heading), `${entry.slug}: README missing ${heading}`);
    }
    assert(readme.includes(`(${entry.source})`), `${entry.slug}: root source link missing`);
    assert(readme.includes(`@${entry.installRef}`), `${entry.slug}: root install ref missing`);
    assert(
      provenance.includes(markdownTableText(entry.name)),
      `${entry.slug}: provenance missing`,
    );
    if (entry.screenshot) {
      const screenshot = normalizeRelativePath(
        entry.screenshot,
        `${entry.slug}: screenshot`,
      );
      assert(
        screenshot === entry.screenshot,
        `${entry.slug}: screenshot path must be normalized`,
      );
      const screenshotDetails = await stat(resolve(directory, screenshot)).catch(
        () => null,
      );
      assert(
        screenshotDetails?.isFile() && screenshotDetails.size > 0,
        `${entry.slug}: screenshot ${screenshot} is missing or empty`,
      );
      assert(
        packageFilesInclude(manifest.files, screenshot),
        `${entry.slug}: screenshot ${screenshot} is omitted by package files`,
      );
      assert(
        markdownImageTargets(pluginReadme).includes(screenshot),
        `${entry.slug}: README must embed screenshot ${screenshot}`,
      );
      assert(
        readme.includes(`[Screenshot](${entry.source}/${screenshot})`),
        `${entry.slug}: root screenshot link missing`,
      );
    }
    assert(
      !(await directoryContainsFiles(resolve(directory, ".github/workflows"))),
      `${entry.slug}: nested plugin .github/workflows is not allowed`,
    );

    for (const typeFile of ["bb-plugin-sdk.d.ts", "bb-plugin-sdk-app.d.ts"]) {
      const localPath = resolve(directory, "types", typeFile);
      const local = await readFile(localPath, "utf8");
      const authoritative = await readFile(
        resolve(bundledTypesDirectory, typeFile),
        "utf8",
      );
      assert(local === authoritative, `${entry.slug}: ${typeFile} is out of sync`);
    }
  }

  const pluginDirectories = (await readdir(resolve(root, "plugins"), {
    withFileTypes: true,
  }))
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
    .map((entry) => entry.name)
    .sort();
  assert(
    JSON.stringify(pluginDirectories) === JSON.stringify([...slugs].sort()),
    `catalog/plugin directory mismatch: ${pluginDirectories.join(", ")}`,
  );

  const locks = await nestedLockfiles(resolve(root, "plugins"));
  assert(locks.length === 0, `nested lockfiles found:\n${locks.join("\n")}`);

  const sdkProvenance = await readJson(resolve(root, "tooling/vendor/sdk-provenance.json"));
  assert(
    provenance.includes(sdkProvenance.sourceCommit),
    "SDK source commit missing from provenance",
  );
  const sdkArchive = await readFile(resolve(root, "tooling/vendor", sdkProvenance.archive));
  const sdkHash = createHash("sha256").update(sdkArchive).digest("hex");
  assert(sdkHash === sdkProvenance.sha256, "vendored plugin SDK hash mismatch");

  return { pluginCount: catalog.plugins.length };
}

if (resolve(process.argv[1] ?? "") === fileURLToPath(import.meta.url)) {
  const result = await checkRepository();
  console.log(`repository hygiene passed for ${result.pluginCount} plugins`);
}
