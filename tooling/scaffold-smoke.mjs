import assert from "node:assert/strict";
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { checkRepository } from "./check-repository.mjs";
import { scaffoldPlugin } from "./create-plugin.mjs";
import {
  assertPublishWorktreeClean,
  releaseManifest,
  releaseServerBundle,
  resolveRetiredInstallRefs,
  retiredInstallRefPushArgs,
} from "./publish-install-refs.mjs";
import { validatePluginArtifacts } from "./validate-plugin-artifacts.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
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
  const pluginBuildRecord = JSON.parse(
    await readFile(
      resolve(root, "tooling/vendor/plugin-build-provenance.json"),
      "utf8",
    ),
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
          "@get-bb/plugin-sdk": rootManifest.devDependencies["@get-bb/plugin-sdk"],
          "@tailwindcss/node": rootManifest.devDependencies["@tailwindcss/node"],
          "@tailwindcss/oxide": rootManifest.devDependencies["@tailwindcss/oxide"],
          esbuild: rootManifest.devDependencies.esbuild,
          tailwindcss: rootManifest.devDependencies.tailwindcss,
        },
        optionalDependencies: rootManifest.optionalDependencies,
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
    resolve(root, "tooling/plugin-build-provenance.mjs"),
    resolve(directory, "tooling/plugin-build-provenance.mjs"),
  );
  await copyFile(
    resolve(root, "tooling/vendor/sdk-provenance.json"),
    resolve(directory, "tooling/vendor/sdk-provenance.json"),
  );
  await copyFile(
    resolve(root, "tooling/vendor", sdkRecord.archive),
    resolve(directory, "tooling/vendor", sdkRecord.archive),
  );
  await copyFile(
    resolve(root, "tooling/vendor/plugin-build-provenance.json"),
    resolve(directory, "tooling/vendor/plugin-build-provenance.json"),
  );
  await copyFile(
    resolve(root, "tooling/vendor", pluginBuildRecord.bundle),
    resolve(directory, "tooling/vendor", pluginBuildRecord.bundle),
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
  assert.deepEqual(
    resolveRetiredInstallRefs(["plugin/design-doctrine", "plugin/improve-prompt"]),
    ["plugin/omegacode", "plugin/ui-patterns"],
  );
  assert.throws(
    () => resolveRetiredInstallRefs(["plugin/omegacode"]),
    /cannot retire active plugin install ref/,
  );
  assert.throws(
    () => resolveRetiredInstallRefs(["plugin/ui-patterns"]),
    /cannot retire active plugin install ref/,
  );
  const retiredCommit = "a".repeat(40);
  assert.deepEqual(retiredInstallRefPushArgs("plugin/omegacode", retiredCommit), [
    "push",
    `--force-with-lease=refs/heads/plugin/omegacode:${retiredCommit}`,
    "origin",
    ":refs/heads/plugin/omegacode",
  ]);
  assert.throws(
    () => retiredInstallRefPushArgs("main", retiredCommit),
    /invalid plugin install ref/,
  );
  assert.throws(
    () => retiredInstallRefPushArgs("plugin/omegacode", "not-a-commit"),
    /invalid expected commit/,
  );
  const releasedManifest = JSON.parse(
    releaseManifest({
      name: "bb-plugin-release-smoke",
      dependencies: {
        "@fixture/bundled-helper": "0.1.0",
        "external-runtime": "^2.0.0",
      },
      optionalDependencies: {
        "@fixture/optional-bundled-helper": "0.1.0",
      },
      peerDependencies: {
        "external-peer": "^3.0.0",
      },
      devDependencies: { typescript: "^5.7.0" },
      scripts: { check: "tsc --noEmit" },
      bb: {
        server: "./server.ts",
        app: "./app.tsx",
      },
    }),
  );
  assert.equal(releasedManifest.bb.server, "./dist/install-server.mjs");
  assert.equal(releasedManifest.bb.app, "./dist/install-app.mjs");
  assert.equal(releasedManifest.dependencies, undefined);
  assert.equal(releasedManifest.optionalDependencies, undefined);
  assert.equal(releasedManifest.peerDependencies, undefined);
  assert.equal(releasedManifest.devDependencies, undefined);
  assert.equal(releasedManifest.scripts, undefined);
  const serverBanner = [
    'import { createRequire as __createRequire } from "node:module";',
    'import { dirname as __pathDirname } from "node:path";',
    'import { fileURLToPath as __fileURLToPath } from "node:url";',
    "const require = __createRequire(import.meta.url);",
    "var __filename = __fileURLToPath(import.meta.url);",
    "var __dirname = __pathDirname(__filename);",
  ].join("\n");
  assert.equal(
    releaseServerBundle(`${serverBanner}\nexport default function plugin() {}\n`),
    "export default function plugin() {}\n",
  );
  assert.throws(
    () => releaseServerBundle("export default function plugin() {}\n"),
    /missing the expected Node ESM banner/,
  );
  await createFixtureRepository(fixtureRoot);

  const description = "Verifies the personal bb plugin scaffold.";
  const generated = await scaffoldPlugin({
    slug: "scaffold-smoke",
    name: "Scaffold Smoke",
    description,
    repositoryRoot: fixtureRoot,
    skipInstall: true,
    skipVerify: true,
  });
  const screenshot = await addVisualIndex(
    fixtureRoot,
    generated.directory,
    description,
  );

  run("npm", ["install", "--no-audit", "--no-fund"], fixtureRoot);
  run(
    "npm",
    ["run", "check", "--workspace=bb-plugin-scaffold-smoke"],
    fixtureRoot,
  );
  await validatePluginArtifacts(generated.directory, {
    expectedScreenshot: screenshot,
  });
  await checkRepository(fixtureRoot);

  const serverMetaPath = resolve(generated.directory, "dist/server.meta.json");
  const serverMetaRaw = await readFile(serverMetaPath, "utf8");
  const serverMeta = JSON.parse(serverMetaRaw);
  serverMeta.builtWith.pluginSdkVersion = "0.4.999";
  await writeFile(serverMetaPath, `${JSON.stringify(serverMeta, null, 2)}\n`);
  await assert.rejects(
    validatePluginArtifacts(generated.directory),
    /expected builtWith\.pluginSdkVersion=/,
  );
  await writeFile(serverMetaPath, serverMetaRaw);

  const serverBundlePath = resolve(generated.directory, "dist/server.js");
  const serverBundle = await readFile(serverBundlePath, "utf8");
  await writeFile(serverBundlePath, `${serverBundle}\nimport "zod";\n`);
  await assert.rejects(
    validatePluginArtifacts(generated.directory),
    /server bundle has unmanaged runtime import "zod"/,
  );
  await writeFile(serverBundlePath, serverBundle);

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
    checkRepository(fixtureRoot),
    /nested plugin \.github\/workflows is not allowed/,
  );
  await rm(resolve(generated.directory, ".github"), {
    recursive: true,
    force: true,
  });

  await validatePluginArtifacts(generated.directory, {
    expectedScreenshot: screenshot,
  });
  await checkRepository(fixtureRoot);
  console.log("plugin scaffold smoke test passed after clean npm ci");
} finally {
  await rm(fixtureRoot, { recursive: true, force: true });
}
