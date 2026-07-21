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
  const rootManifest = JSON.parse(
    await readFile(resolve(root, "package.json"), "utf8"),
  );
  const sdkRecord = JSON.parse(
    await readFile(resolve(root, "tooling/vendor/sdk-provenance.json"), "utf8"),
  );
  await mkdir(resolve(directory, "packages"), { recursive: true });
  await mkdir(resolve(directory, "plugins"), { recursive: true });
  await mkdir(resolve(directory, "tooling/vendor"), { recursive: true });
  await writeFile(
    resolve(directory, "package.json"),
    `${JSON.stringify(
      {
        name: "bb-plugins-scaffold-smoke",
        private: true,
        type: "module",
        workspaces: ["plugins/*", "packages/*"],
        devDependencies: {
          "@bb/plugin-sdk": "file:tooling/vendor/bb-plugin-sdk-0.4.0.tgz",
          "bb-app": rootManifest.devDependencies["bb-app"],
        },
      },
      null,
      2,
    )}\n`,
  );
  await writeFile(resolve(directory, "README.md"), "# Fixture\n");
  await copyFile(
    resolve(root, "tooling/build-plugin.mjs"),
    resolve(directory, "tooling/build-plugin.mjs"),
  );
  await copyFile(
    resolve(root, "tooling/vendor/sdk-provenance.json"),
    resolve(directory, "tooling/vendor/sdk-provenance.json"),
  );
  await copyFile(
    resolve(root, "tooling/vendor", sdkRecord.archive),
    resolve(directory, "tooling/vendor", sdkRecord.archive),
  );
}

async function addVisualIndex(repositoryRoot, directory, description) {
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
  await writeFile(
    resolve(repositoryRoot, "README.md"),
    `# Fixture

## Plugins

### Scaffold Smoke

${description}

![Scaffold Smoke in bb](plugins/scaffold-smoke/${screenshot})

[Source](plugins/scaffold-smoke) · [README](plugins/scaffold-smoke/README.md)

Install: \`bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/scaffold-smoke --yes\`
`,
  );
  return screenshot;
}

const fixtureRoot = await mkdtemp(resolve(tmpdir(), "bb-plugin-scaffold-smoke-"));
try {
  assert.throws(
    () => assertPublishWorktreeClean(" M tooling/publish-install-refs.mjs"),
    /refusing to push install refs from a dirty worktree/,
  );
  await createFixtureRepository(fixtureRoot);

  const description = "Verifies the personal bb plugin scaffold.";
  const generated = await scaffoldPlugin({
    slug: "scaffold-smoke",
    name: "Scaffold Smoke",
    description,
    repositoryRoot: fixtureRoot,
    bundledTypesDirectory,
    skipInstall: true,
    skipVerify: true,
  });
  const screenshot = await addVisualIndex(
    fixtureRoot,
    generated.directory,
    description,
  );

  for (const typeFile of ["bb-plugin-sdk.d.ts", "bb-plugin-sdk-app.d.ts"]) {
    assert.equal(
      await readFile(resolve(generated.directory, "types", typeFile), "utf8"),
      await readFile(resolve(bundledTypesDirectory, typeFile), "utf8"),
    );
  }

  run("npm", ["install", "--no-audit", "--no-fund"], fixtureRoot);
  run(
    "npm",
    ["run", "check", "--workspace=bb-plugin-scaffold-smoke"],
    fixtureRoot,
  );
  await validatePluginArtifacts(generated.directory, {
    expectedScreenshot: screenshot,
  });
  await checkRepository(fixtureRoot, { bundledTypesDirectory });

  await rm(resolve(fixtureRoot, "node_modules"), {
    recursive: true,
    force: true,
  });
  run("npm", ["ci", "--no-audit", "--no-fund"], fixtureRoot);
  run("npm", ["run", "check", "--workspaces", "--if-present"], fixtureRoot);

  const accidentalSkill = resolve(generated.directory, "skills/example-skill");
  await mkdir(accidentalSkill, { recursive: true });
  await writeFile(resolve(accidentalSkill, "SKILL.md"), "# Accidental skill\n");
  await assert.rejects(
    validatePluginArtifacts(generated.directory),
    /bb\.skills opts out, but skills\/example-skill\/SKILL\.md exists/,
  );
  const manifestPath = resolve(generated.directory, "package.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  delete manifest.bb.skills;
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  await assert.rejects(
    validatePluginArtifacts(generated.directory),
    /would be implicitly auto-imported by bb; declare bb\.skills explicitly/,
  );
  manifest.bb.skills = [];
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  await rm(resolve(generated.directory, "skills"), {
    recursive: true,
    force: true,
  });

  const nestedWorkflows = resolve(generated.directory, ".github/workflows");
  await mkdir(nestedWorkflows, { recursive: true });
  await writeFile(resolve(nestedWorkflows, "ci.yml"), "name: accidental\n");
  await assert.rejects(
    checkRepository(fixtureRoot, { bundledTypesDirectory }),
    /nested plugin \.github\/workflows is not allowed/,
  );
  await rm(resolve(generated.directory, ".github"), {
    recursive: true,
    force: true,
  });

  await validatePluginArtifacts(generated.directory, {
    expectedScreenshot: screenshot,
  });
  await checkRepository(fixtureRoot, { bundledTypesDirectory });
  console.log("plugin scaffold smoke test passed after clean npm ci");
} finally {
  await rm(fixtureRoot, { recursive: true, force: true });
}
