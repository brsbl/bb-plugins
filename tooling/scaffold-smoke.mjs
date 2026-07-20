import assert from "node:assert/strict";
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { checkRepository } from "./check-repository.mjs";
import { scaffoldPlugin } from "./create-plugin.mjs";
import { assertPublishWorktreeClean } from "./publish-install-refs.mjs";
import { validatePluginArtifacts } from "./validate-plugin-artifacts.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const bundledTypesDirectory = resolve(
  root,
  "node_modules/@bb/plugin-sdk/bundled-types",
);

function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} exited ${result.status}`);
}

async function createFixtureRepository(directory) {
  const rootManifest = JSON.parse(await readFile(resolve(root, "package.json"), "utf8"));
  const sdkProvenance = JSON.parse(
    await readFile(resolve(root, "tooling/vendor/sdk-provenance.json"), "utf8"),
  );
  await mkdir(resolve(directory, "catalog"), { recursive: true });
  await mkdir(resolve(directory, "docs"), { recursive: true });
  await mkdir(resolve(directory, "packages"), { recursive: true });
  await mkdir(resolve(directory, "plugins"), { recursive: true });
  await mkdir(resolve(directory, "tooling/vendor"), { recursive: true });
  await writeFile(
    resolve(directory, "package.json"),
    `${JSON.stringify({
      name: "bb-plugins-scaffold-smoke",
      private: true,
      type: "module",
      workspaces: ["plugins/*", "packages/*"],
      devDependencies: {
        "@bb/plugin-sdk": "file:tooling/vendor/bb-plugin-sdk-0.4.0.tgz",
        "bb-app": rootManifest.devDependencies["bb-app"],
      },
    }, null, 2)}\n`,
  );
  await writeFile(
    resolve(directory, "catalog/plugins.json"),
    `${JSON.stringify({ schemaVersion: 1, plugins: [] }, null, 2)}\n`,
  );
  await writeFile(
    resolve(directory, "README.md"),
    "# Fixture\n\n## Plugins\n\n<!-- plugin-catalog:start -->\n| Plugin | Purpose and when to use it | Surfaces and visual | Install and source | CI and maintenance |\n| --- | --- | --- | --- | --- |\n<!-- plugin-catalog:end -->\n\n## Develop\n",
  );
  await writeFile(
    resolve(directory, "docs/provenance.md"),
    `# Fixture provenance\n\n| Plugin | Imported source | Source revision | Monorepo record | Notes |\n| --- | --- | --- | --- | --- |\n\nSDK source: ${sdkProvenance.sourceCommit}\n`,
  );
  await copyFile(
    resolve(root, "tooling/build-plugin.mjs"),
    resolve(directory, "tooling/build-plugin.mjs"),
  );
  await copyFile(
    resolve(root, "tooling/vendor/sdk-provenance.json"),
    resolve(directory, "tooling/vendor/sdk-provenance.json"),
  );
  await copyFile(
    resolve(root, "tooling/vendor", sdkProvenance.archive),
    resolve(directory, "tooling/vendor", sdkProvenance.archive),
  );
}

async function addScreenshotContract(repositoryRoot, directory, description) {
  const screenshot = "docs/screenshot.png";
  await mkdir(resolve(directory, "docs"));
  await writeFile(
    resolve(directory, screenshot),
    Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
      "base64",
    ),
  );

  const manifestPath = resolve(directory, "package.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  manifest.files.splice(1, 0, "docs");
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  const readmePath = resolve(directory, "README.md");
  const readme = await readFile(readmePath, "utf8");
  await writeFile(
    readmePath,
    readme.replace(
      `${description}\n\n`,
      `${description}\n\n![Scaffold screenshot](${screenshot})\n\n`,
    ),
  );

  const catalogPath = resolve(repositoryRoot, "catalog/plugins.json");
  const catalog = JSON.parse(await readFile(catalogPath, "utf8"));
  const entry = catalog.plugins.find(({ slug }) => slug === "scaffold-smoke");
  assert(entry, "scaffold-smoke catalog entry missing");
  entry.screenshot = screenshot;
  await writeFile(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);
}

const fixtureRoot = await mkdtemp(resolve(tmpdir(), "bb-plugin-scaffold-smoke-"));
try {
  assert.throws(
    () => assertPublishWorktreeClean(" M tooling/publish-install-refs.mjs"),
    /refusing to push install refs from a dirty worktree/,
  );
  await createFixtureRepository(fixtureRoot);

  const visualDescription = "Verifies screenshot catalog preservation.";
  const visualPlugin = await scaffoldPlugin({
    slug: "scaffold-smoke",
    name: "Scaffold Smoke",
    description: visualDescription,
    repositoryRoot: fixtureRoot,
    bundledTypesDirectory,
    skipInstall: true,
    skipVerify: true,
    surfaces: ["Server capability"],
  });
  await addScreenshotContract(
    fixtureRoot,
    visualPlugin.directory,
    visualDescription,
  );

  const generatedPlugin = await scaffoldPlugin({
    slug: "catalog-smoke",
    name: 'Catalog | "Smoke" \\ Tools',
    description: "Verifies the personal bb plugin\nscaffold.",
    repositoryRoot: fixtureRoot,
    bundledTypesDirectory,
    surfaces: ["Server capability"],
  });

  for (const directory of [visualPlugin.directory, generatedPlugin.directory]) {
    for (const typeFile of ["bb-plugin-sdk.d.ts", "bb-plugin-sdk-app.d.ts"]) {
      assert.equal(
        await readFile(resolve(directory, "types", typeFile), "utf8"),
        await readFile(resolve(bundledTypesDirectory, typeFile), "utf8"),
      );
    }
  }

  let catalog = JSON.parse(
    await readFile(resolve(fixtureRoot, "catalog/plugins.json"), "utf8"),
  );
  assert.deepEqual(
    catalog.plugins.map(({ slug }) => slug),
    ["catalog-smoke", "scaffold-smoke"],
  );
  assert.equal(
    catalog.plugins.find(({ slug }) => slug === "scaffold-smoke")?.screenshot,
    "docs/screenshot.png",
  );
  const rootReadme = await readFile(resolve(fixtureRoot, "README.md"), "utf8");
  assert.match(
    rootReadme,
    /\[Screenshot\]\(plugins\/scaffold-smoke\/docs\/screenshot\.png\)/,
  );
  assert.match(rootReadme, /plugin\/catalog-smoke/);
  assert.ok(rootReadme.includes('**Catalog \\| "Smoke" \\ Tools**'));
  assert.match(rootReadme, /Verifies the personal bb plugin scaffold\./);
  assert.match(
    await readFile(resolve(fixtureRoot, "docs/provenance.md"), "utf8"),
    /Catalog \\\| "Smoke" \\ Tools/,
  );

  run(
    "npm",
    ["run", "check", "--workspace=bb-plugin-scaffold-smoke"],
    fixtureRoot,
  );
  await validatePluginArtifacts(visualPlugin.directory, {
    expectedScreenshot: "docs/screenshot.png",
  });
  await validatePluginArtifacts(generatedPlugin.directory);
  await checkRepository(fixtureRoot, { bundledTypesDirectory });

  await rm(resolve(fixtureRoot, "node_modules"), {
    recursive: true,
    force: true,
  });
  run("npm", ["ci", "--no-audit", "--no-fund"], fixtureRoot);
  run("npm", ["run", "check", "--workspaces", "--if-present"], fixtureRoot);

  const accidentalSkill = resolve(generatedPlugin.directory, "skills/example-skill");
  await mkdir(accidentalSkill, { recursive: true });
  await writeFile(resolve(accidentalSkill, "SKILL.md"), "# Accidental skill\n");
  await assert.rejects(
    validatePluginArtifacts(generatedPlugin.directory),
    /bb\.skills opts out, but skills\/example-skill\/SKILL\.md exists/,
  );
  const manifestPath = resolve(generatedPlugin.directory, "package.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  delete manifest.bb.skills;
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  await assert.rejects(
    validatePluginArtifacts(generatedPlugin.directory),
    /would be implicitly auto-imported by bb; declare bb\.skills explicitly/,
  );
  manifest.bb.skills = [];
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  await rm(resolve(generatedPlugin.directory, "skills"), {
    recursive: true,
    force: true,
  });

  const nestedWorkflows = resolve(generatedPlugin.directory, ".github/workflows");
  await mkdir(nestedWorkflows, { recursive: true });
  await writeFile(resolve(nestedWorkflows, "ci.yml"), "name: accidental\n");
  await assert.rejects(
    checkRepository(fixtureRoot, { bundledTypesDirectory }),
    /nested plugin \.github\/workflows is not allowed/,
  );
  await rm(resolve(generatedPlugin.directory, ".github"), {
    recursive: true,
    force: true,
  });

  catalog = JSON.parse(
    await readFile(resolve(fixtureRoot, "catalog/plugins.json"), "utf8"),
  );
  await validatePluginArtifacts(visualPlugin.directory, {
    expectedScreenshot: catalog.plugins.find(
      ({ slug }) => slug === "scaffold-smoke",
    )?.screenshot,
  });
  await validatePluginArtifacts(generatedPlugin.directory);
  await checkRepository(fixtureRoot, { bundledTypesDirectory });
  console.log("plugin scaffold smoke test passed after clean npm ci");
} finally {
  await rm(fixtureRoot, { recursive: true, force: true });
}
