import { createHash } from "node:crypto";
import { readdir, readFile, stat } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
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

const rootManifest = await readJson(resolve(root, "package.json"));
const catalog = await readJson(resolve(root, "catalog/plugins.json"));
const readme = await readFile(resolve(root, "README.md"), "utf8");
const provenance = await readFile(resolve(root, "docs/provenance.md"), "utf8");
const bundledTypesDirectory = resolve(
  root,
  "node_modules/@bb/plugin-sdk/bundled-types",
);

assert(catalog.schemaVersion === 1, "unsupported catalog schema");
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
  assert(provenance.includes(entry.name), `${entry.slug}: provenance missing`);

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

console.log(`repository hygiene passed for ${catalog.plugins.length} plugins`);
