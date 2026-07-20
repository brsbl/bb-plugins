import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { validatePluginArtifacts } from "./validate-plugin-artifacts.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const catalog = JSON.parse(
  await readFile(resolve(root, "catalog/plugins.json"), "utf8"),
);
const rootManifest = JSON.parse(await readFile(resolve(root, "package.json"), "utf8"));
const bbVersion = rootManifest.devDependencies["bb-app"];
const push = process.argv.includes("--push");

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd ?? root,
    encoding: options.encoding ?? "utf8",
    env: { ...process.env, ...options.env },
    input: options.input,
    maxBuffer: 64 * 1024 * 1024,
    stdio: options.stdio ?? [options.input === undefined ? "ignore" : "pipe", "pipe", "pipe"],
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(
      `${command} ${args.join(" ")} failed:\n${result.stderr || result.stdout}`,
    );
  }
  return typeof result.stdout === "string" ? result.stdout.trim() : result.stdout;
}

function git(args, options = {}) {
  return run("git", args, options);
}

async function filesBelow(directory, prefix = "") {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolutePath = resolve(directory, entry.name);
    const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      files.push(...(await filesBelow(absolutePath, relativePath)));
    } else if (entry.isFile()) {
      files.push({ absolutePath, relativePath });
    }
  }
  return files;
}

function releaseManifest(sourceManifest) {
  const manifest = structuredClone(sourceManifest);
  delete manifest.devDependencies;
  delete manifest.scripts;
  for (const [name, version] of Object.entries(manifest.dependencies ?? {})) {
    if (String(version).startsWith("file:")) {
      throw new Error(`${manifest.name}: production dependency ${name} uses ${version}`);
    }
  }
  return `${JSON.stringify(manifest, null, 2)}\n`;
}

function addBlob(indexPath, repositoryPath, input) {
  const blob = git(["hash-object", "-w", "--stdin"], { input });
  git(
    ["update-index", "--add", "--cacheinfo", `100644,${blob},${repositoryPath}`],
    { env: { GIT_INDEX_FILE: indexPath } },
  );
}

async function createReleaseCommit(plugin, sourceCommit, sourceRevision) {
  const pluginDirectory = resolve(root, plugin.source);
  const sourceManifest = JSON.parse(
    await readFile(resolve(pluginDirectory, "package.json"), "utf8"),
  );
  const stagingDirectory = await mkdtemp(
    resolve(tmpdir(), `bb-plugin-ref-${plugin.slug}-`),
  );
  const indexPath = resolve(stagingDirectory, "index");

  try {
    git(["read-tree", sourceCommit], { env: { GIT_INDEX_FILE: indexPath } });

    // Install refs are release artifacts, not development branches. Keep the
    // imported source history on main, and never ship repository automation in
    // a root-shaped plugin ref: GitHub Actions intentionally cannot create or
    // update workflow files with a contents-only token.
    const repositoryFiles = git(["ls-files"], {
      env: { GIT_INDEX_FILE: indexPath },
    })
      .split("\n")
      .filter(Boolean);
    for (const repositoryPath of repositoryFiles) {
      if (repositoryPath === ".github" || repositoryPath.startsWith(".github/")) {
        git(["update-index", "--force-remove", repositoryPath], {
          env: { GIT_INDEX_FILE: indexPath },
        });
      }
    }

    addBlob(indexPath, "package.json", releaseManifest(sourceManifest));

    for (const file of await filesBelow(resolve(pluginDirectory, "dist"))) {
      const contents = await readFile(file.absolutePath);
      addBlob(indexPath, `dist/${file.relativePath}`, contents);
    }

    const tree = git(["write-tree"], { env: { GIT_INDEX_FILE: indexPath } });
    return git(
      [
        "commit-tree",
        tree,
        "-m",
        `build: publish ${plugin.name} from ${sourceRevision}`,
      ],
      {
        env: {
          GIT_AUTHOR_NAME: "bb-plugins release",
          GIT_AUTHOR_EMAIL: "bb-plugins@users.noreply.github.com",
          GIT_COMMITTER_NAME: "bb-plugins release",
          GIT_COMMITTER_EMAIL: "bb-plugins@users.noreply.github.com",
        },
      },
    );
  } finally {
    await rm(stagingDirectory, { recursive: true, force: true });
  }
}

async function verifyReleaseRef(plugin, releaseCommit) {
  const checkoutRoot = await mkdtemp(
    resolve(tmpdir(), `bb-plugin-install-${plugin.slug}-`),
  );
  const checkout = resolve(checkoutRoot, "checkout");
  try {
    git([
      "clone",
      "--quiet",
      "--depth=1",
      "--branch",
      plugin.installRef,
      `file://${root}`,
      checkout,
    ]);
    const checkedOutCommit = git(["rev-parse", "HEAD"], { cwd: checkout });
    if (checkedOutCommit !== releaseCommit) {
      throw new Error(`${plugin.installRef}: cloned ${checkedOutCommit}, expected ${releaseCommit}`);
    }

    const manifest = JSON.parse(await readFile(resolve(checkout, "package.json"), "utf8"));
    if (manifest.devDependencies || manifest.scripts) {
      throw new Error(`${plugin.installRef}: release manifest contains development-only fields`);
    }
    run(
      "npm",
      [
        "install",
        "--omit=dev",
        "--ignore-scripts",
        "--package-lock=false",
        "--audit=false",
        "--fund=false",
      ],
      { cwd: checkout },
    );
    await validatePluginArtifacts(checkout, {
      bbVersion,
      expectedId: plugin.pluginId,
      expectedName: plugin.name,
    });
  } finally {
    await rm(checkoutRoot, { recursive: true, force: true });
  }
}

const sourceRevision = git(["rev-parse", "HEAD"]);
for (const plugin of catalog.plugins) {
  const pluginDirectory = resolve(root, plugin.source);
  await validatePluginArtifacts(pluginDirectory, {
    bbVersion,
    expectedId: plugin.pluginId,
    expectedName: plugin.name,
  });

  const sourceCommit = git([
    "subtree",
    "split",
    `--prefix=${plugin.source}`,
    sourceRevision,
  ])
    .split("\n")
    .at(-1);
  if (!sourceCommit) throw new Error(`no subtree commit produced for ${plugin.slug}`);

  const releaseCommit = await createReleaseCommit(
    plugin,
    sourceCommit,
    sourceRevision,
  );
  const ref = `refs/heads/${plugin.installRef}`;
  git(["update-ref", ref, releaseCommit]);
  await verifyReleaseRef(plugin, releaseCommit);

  if (push) {
    git(["push", "origin", `+${releaseCommit}:${ref}`]);
  }
  console.log(
    `${plugin.installRef} ${releaseCommit} verified${push ? " and pushed" : ""}`,
  );
}
