import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { readPluginWorkspaces } from "./plugin-workspaces.mjs";
import { validatePluginArtifacts } from "./validate-plugin-artifacts.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
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
  if (result.status !== 0 && options.allowFailure) return null;
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
  // bb currently recompiles frontend entries for direct git installs even
  // when a valid prebuilt app is present. Point the release-only manifest at
  // that self-contained bundle so installation never depends on node_modules.
  if (manifest.bb?.app) manifest.bb.app = "./dist/app.js";
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

async function createReleaseTree(plugin, sourceCommit) {
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

    return git(["write-tree"], { env: { GIT_INDEX_FILE: indexPath } });
  } finally {
    await rm(stagingDirectory, { recursive: true, force: true });
  }
}

function createReleaseCommit(plugin, tree, sourceRevision) {
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
}

function localRefCommit(ref) {
  return git(["rev-parse", "--verify", ref], { allowFailure: true });
}

function hasOrigin() {
  return git(["remote", "get-url", "origin"], { allowFailure: true }) !== null;
}

function remoteRefCommit(plugin) {
  const ref = `refs/heads/${plugin.installRef}`;
  const output = git(["ls-remote", "--heads", "origin", ref], {
    allowFailure: true,
  });
  if (!output) return null;
  const commit = output.split(/\s+/)[0];
  if (!commit) return null;
  git([
    "fetch",
    "--quiet",
    "--no-tags",
    "origin",
    `+${ref}:refs/remotes/origin/${plugin.installRef}`,
  ]);
  return commit;
}

function currentReleaseCommit(plugin, push) {
  const ref = `refs/heads/${plugin.installRef}`;
  if (push) {
    if (!hasOrigin()) throw new Error("cannot push install refs without an origin remote");
    return remoteRefCommit(plugin);
  }
  return (
    localRefCommit(ref) ??
    localRefCommit(`refs/remotes/origin/${plugin.installRef}`) ??
    (hasOrigin() ? remoteRefCommit(plugin) : null)
  );
}

export function assertPublishWorktreeClean(
  dirty = git(["status", "--porcelain=v1", "--untracked-files=all"]),
) {
  if (dirty) {
    throw new Error(
      `refusing to push install refs from a dirty worktree:\n${dirty}`,
    );
  }
}

async function verifyReleaseCommit(plugin, releaseCommit, bbVersion) {
  const checkoutRoot = await mkdtemp(
    resolve(tmpdir(), `bb-plugin-install-${plugin.slug}-`),
  );
  const checkout = resolve(checkoutRoot, "checkout");
  const indexPath = resolve(checkoutRoot, "index");
  try {
    await mkdir(checkout);
    git(["read-tree", releaseCommit], { env: { GIT_INDEX_FILE: indexPath } });
    git(["checkout-index", "--all", "--force", `--prefix=${checkout}/`], {
      env: { GIT_INDEX_FILE: indexPath },
    });

    const manifestPath = resolve(checkout, "package.json");
    const manifestRaw = await readFile(manifestPath, "utf8");
    const manifest = JSON.parse(manifestRaw);
    if (manifest.devDependencies || manifest.scripts) {
      throw new Error(`${plugin.installRef}: release manifest contains development-only fields`);
    }
    if (manifest.bb?.app && manifest.bb.app !== "./dist/app.js") {
      throw new Error(`${plugin.installRef}: release app entry is not the prebuilt bundle`);
    }
    await validatePluginArtifacts(checkout, {
      bbVersion,
      expectedId: plugin.pluginId,
      expectedName: plugin.name,
    });

    // Mirror the build that bb performs for a git install before production
    // dependencies are present. The temporary server entry keeps this probe
    // focused on release artifacts; managed installs load the validated
    // prebuilt server directly.
    const buildManifest = structuredClone(manifest);
    buildManifest.bb.server = "./dist/server.js";
    await writeFile(manifestPath, `${JSON.stringify(buildManifest, null, 2)}\n`);
    try {
      run(
        process.execPath,
        [resolve(root, "node_modules/bb-app/dist/bb.js"), "plugin", "build", "."],
        { cwd: checkout, env: { BB_CLI: "" } },
      );
    } finally {
      await writeFile(manifestPath, manifestRaw);
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

export async function publishInstallRefs(options = {}) {
  const push = options.push ?? false;
  const plugins = await readPluginWorkspaces(root);
  if (push) assertPublishWorktreeClean();
  const rootManifest = JSON.parse(await readFile(resolve(root, "package.json"), "utf8"));
  const bbVersion = rootManifest.devDependencies["bb-app"];
  const sourceRevision = git(["rev-parse", "HEAD"]);

  for (const plugin of plugins) {
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

    const candidateTree = await createReleaseTree(plugin, sourceCommit);
    const currentCommit = currentReleaseCommit(plugin, push);
    const currentTree = currentCommit
      ? git(["rev-parse", `${currentCommit}^{tree}`])
      : null;
    if (currentCommit && currentTree === candidateTree) {
      await verifyReleaseCommit(plugin, currentCommit, bbVersion);
      console.log(`${plugin.installRef} ${currentCommit} unchanged and verified`);
      continue;
    }

    const releaseCommit = createReleaseCommit(plugin, candidateTree, sourceRevision);
    const ref = `refs/heads/${plugin.installRef}`;
    await verifyReleaseCommit(plugin, releaseCommit, bbVersion);
    git(["update-ref", ref, releaseCommit]);

    if (push) {
      git([
        "push",
        "origin",
        `${releaseCommit}:${ref}`,
        `--force-with-lease=${ref}:${currentCommit ?? ""}`,
      ]);
    }
    console.log(
      `${plugin.installRef} ${releaseCommit} verified${push ? " and pushed" : ""}`,
    );
  }
}

if (resolve(process.argv[1] ?? "") === fileURLToPath(import.meta.url)) {
  await publishInstallRefs({ push: process.argv.includes("--push") });
}
