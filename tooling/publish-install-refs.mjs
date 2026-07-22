import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, readdir, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { readPluginWorkspaces } from "./plugin-workspaces.mjs";
import { validatePluginArtifacts } from "./validate-plugin-artifacts.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const releaseAppEntry = "./dist/install-app.mjs";
const releaseAppCss = "dist/install-app.css";
const productionDependencyFields = [
  "dependencies",
  "optionalDependencies",
  "peerDependencies",
];
const explicitlyRetiredInstallRefs = Object.freeze(["plugin/omegacode"]);

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

function fullInstallRef(installRef) {
  if (!/^plugin\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(installRef)) {
    throw new Error(`invalid plugin install ref: ${installRef}`);
  }
  return `refs/heads/${installRef}`;
}

export function resolveRetiredInstallRefs(activeInstallRefs) {
  const active = new Set(activeInstallRefs);
  for (const installRef of explicitlyRetiredInstallRefs) {
    fullInstallRef(installRef);
    if (active.has(installRef)) {
      throw new Error(`cannot retire active plugin install ref: ${installRef}`);
    }
  }
  return [...explicitlyRetiredInstallRefs];
}

export function retiredInstallRefPushArgs(installRef, expectedCommit) {
  const ref = fullInstallRef(installRef);
  if (!/^[0-9a-f]{40}$/i.test(expectedCommit)) {
    throw new Error(`invalid expected commit for ${installRef}: ${expectedCommit}`);
  }
  return [
    "push",
    `--force-with-lease=${ref}:${expectedCommit}`,
    "origin",
    `:${ref}`,
  ];
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

export function releaseManifest(sourceManifest, bundledPackageNames = new Set()) {
  const manifest = structuredClone(sourceManifest);
  delete manifest.devDependencies;
  delete manifest.scripts;
  // bb recompiles frontend entries for direct git installs. Point the
  // release-only manifest at a self-contained wrapper around the prebuilt app
  // so installation never depends on development node_modules. The wrapper
  // also carries plugin-authored CSS through that second build.
  if (manifest.bb?.app) manifest.bb.app = releaseAppEntry;
  for (const field of productionDependencyFields) {
    const dependencies = manifest[field];
    if (!dependencies) continue;
    for (const [name, version] of Object.entries(dependencies)) {
      if (bundledPackageNames.has(name)) {
        dependencies[name] = `file:${bundledPackageVendorPath(name)}`;
        continue;
      }
      if (String(version).startsWith("file:")) {
        throw new Error(`${manifest.name}: production dependency ${name} uses ${version}`);
      }
    }
    if (Object.keys(dependencies).length === 0) delete manifest[field];
  }
  return `${JSON.stringify(manifest, null, 2)}\n`;
}

function bundledPackageVendorPath(name) {
  if (!/^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/.test(name)) {
    throw new Error(`invalid bundled package name: ${name}`);
  }
  return `vendor/${name}`;
}

function bundledPackageInstallPath(name) {
  bundledPackageVendorPath(name);
  return `node_modules/${name}`;
}

function bundledPackageRuntimeManifest(sourceManifest) {
  const manifest = structuredClone(sourceManifest);
  delete manifest.devDependencies;
  delete manifest.scripts;
  delete manifest.private;
  return `${JSON.stringify(manifest, null, 2)}\n`;
}

function normalizeBundledPackageFilePath(entry) {
  if (typeof entry !== "string") {
    throw new Error(`invalid bundled package file path: ${String(entry)}`);
  }
  const normalized = entry.replace(/\\/g, "/").replace(/^\.\//, "").replace(/\/+$/, "");
  if (
    normalized === "" ||
    normalized.startsWith("/") ||
    normalized.split("/").some((segment) => segment === "." || segment === "..")
  ) {
    throw new Error(`invalid bundled package file path: ${entry}`);
  }
  return normalized;
}

function bundledPackageFileIncluded(relativePath, manifestFiles) {
  return manifestFiles.some((entry) => {
    const normalized = normalizeBundledPackageFilePath(entry);
    return relativePath === normalized || relativePath.startsWith(`${normalized}/`);
  });
}

async function readBundledPackages() {
  const packagesDirectory = resolve(root, "packages");
  const entries = await readdir(packagesDirectory, {
    withFileTypes: true,
  }).catch((error) => {
    if (error?.code === "ENOENT") return [];
    throw error;
  });
  const packages = new Map();
  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith(".")) continue;
    const directory = resolve(packagesDirectory, entry.name);
    const manifest = JSON.parse(await readFile(resolve(directory, "package.json"), "utf8"));
    if (!manifest.name) {
      throw new Error(`packages/${entry.name}/package.json has no package name`);
    }
    if (!Array.isArray(manifest.files) || manifest.files.length === 0) {
      throw new Error(`packages/${entry.name}/package.json has no runtime files allowlist`);
    }
    bundledPackageVendorPath(manifest.name);
    for (const runtimePath of manifest.files) {
      normalizeBundledPackageFilePath(runtimePath);
    }
    packages.set(manifest.name, { directory, manifest });
  }
  return packages;
}

function addBlob(indexPath, repositoryPath, input) {
  const blob = git(["hash-object", "-w", "--stdin"], { input });
  git(
    ["update-index", "--add", "--cacheinfo", `100644,${blob},${repositoryPath}`],
    { env: { GIT_INDEX_FILE: indexPath } },
  );
}

async function createReleaseTree(plugin, sourceCommit, bundledPackages) {
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

    for (const file of await filesBelow(resolve(pluginDirectory, "dist"))) {
      const contents = await readFile(file.absolutePath);
      addBlob(indexPath, `dist/${file.relativePath}`, contents);
    }

    const bundledPackageNames = new Set(bundledPackages.keys());
    for (const field of productionDependencyFields) {
      const dependencies = sourceManifest[field];
      if (!dependencies) continue;
      for (const name of Object.keys(dependencies)) {
        const bundledPackage = bundledPackages.get(name);
        if (!bundledPackage) continue;
        const vendorPath = bundledPackageVendorPath(name);
        const packagePaths = [vendorPath, bundledPackageInstallPath(name)];
        const runtimeManifest = bundledPackageRuntimeManifest(bundledPackage.manifest);
        for (const packagePath of packagePaths) {
          addBlob(indexPath, `${packagePath}/package.json`, runtimeManifest);
        }
        for (const file of await filesBelow(bundledPackage.directory)) {
          if (file.relativePath === "package.json") continue;
          if (!bundledPackageFileIncluded(file.relativePath, bundledPackage.manifest.files)) {
            continue;
          }
          const contents = await readFile(file.absolutePath);
          for (const packagePath of packagePaths) {
            addBlob(indexPath, `${packagePath}/${file.relativePath}`, contents);
          }
        }
      }
    }

    if (sourceManifest.bb?.app) {
      const authoredCss = await readFile(resolve(pluginDirectory, "app.css"), "utf8").catch(
        (error) => {
          if (error?.code === "ENOENT") return null;
          throw error;
        },
      );
      const wrapper = [
        'export { default } from "./app.js";',
        'export * from "./app.js";',
      ];
      if (authoredCss !== null) {
        wrapper.push('import "./install-app.css";');
        addBlob(
          indexPath,
          releaseAppCss,
          `[data-bb-plugin-release-style="${plugin.pluginId}"] { --bb-plugin-release-style: 1; }\n${authoredCss}`,
        );
      }
      addBlob(indexPath, releaseAppEntry.replace(/^\.\//, ""), `${wrapper.join("\n")}\n`);
    }

    addBlob(
      indexPath,
      "package.json",
      releaseManifest(sourceManifest, bundledPackageNames),
    );

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

function remoteInstallRefCommit(installRef) {
  const ref = fullInstallRef(installRef);
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
    `+${ref}:refs/remotes/origin/${installRef}`,
  ]);
  return commit;
}

function currentReleaseCommit(plugin, push) {
  const ref = `refs/heads/${plugin.installRef}`;
  if (push) {
    if (!hasOrigin()) throw new Error("cannot push install refs without an origin remote");
    return remoteInstallRefCommit(plugin.installRef);
  }
  return (
    localRefCommit(ref) ??
    localRefCommit(`refs/remotes/origin/${plugin.installRef}`) ??
    (hasOrigin() ? remoteInstallRefCommit(plugin.installRef) : null)
  );
}

function retireInstallRefs(plugins, push) {
  const retiredInstallRefs = resolveRetiredInstallRefs(
    plugins.map((plugin) => plugin.installRef),
  );
  if (push && !hasOrigin()) {
    throw new Error("cannot retire install refs without an origin remote");
  }
  for (const installRef of retiredInstallRefs) {
    const currentCommit = hasOrigin()
      ? remoteInstallRefCommit(installRef)
      : localRefCommit(`refs/remotes/origin/${installRef}`);
    if (!currentCommit) {
      console.log(`${installRef} already retired`);
      continue;
    }
    if (!push) {
      console.log(`${installRef} ${currentCommit} pending retirement`);
      continue;
    }
    git(retiredInstallRefPushArgs(installRef, currentCommit));
    console.log(`${installRef} ${currentCommit} retired`);
  }
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

function bundledPluginDependencyNames(plugin, bundledPackageNames) {
  const names = new Set();
  for (const field of productionDependencyFields) {
    for (const name of Object.keys(plugin.manifest[field] ?? {})) {
      if (bundledPackageNames.has(name)) names.add(name);
    }
  }
  return [...names];
}

async function verifyBundledRuntimePackage(plugin, directory, name, location) {
  const bundledManifest = JSON.parse(
    await readFile(resolve(directory, "package.json"), "utf8").catch((error) => {
      if (error?.code === "ENOENT") {
        throw new Error(
          `${plugin.installRef}: ${location} omits bundled runtime package ${name}`,
        );
      }
      throw error;
    }),
  );
  if (bundledManifest.name !== name) {
    throw new Error(
      `${plugin.installRef}: ${location} runtime package ${name} has mismatched manifest name`,
    );
  }
  for (const runtimePath of bundledManifest.files ?? []) {
    const normalized = normalizeBundledPackageFilePath(runtimePath);
    const details = await stat(resolve(directory, normalized)).catch((error) => {
      if (error?.code === "ENOENT") return null;
      throw error;
    });
    if (details === null) {
      throw new Error(
        `${plugin.installRef}: ${location} runtime package ${name} omits ${normalized}`,
      );
    }
  }
}

async function verifyReleaseCommit(plugin, releaseCommit, bundledPackageNames) {
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
    if (manifest.bb?.app && manifest.bb.app !== releaseAppEntry) {
      throw new Error(`${plugin.installRef}: release app entry is not the prebuilt wrapper`);
    }

    const bundledDependencyNames = bundledPluginDependencyNames(
      plugin,
      bundledPackageNames,
    );
    for (const name of bundledDependencyNames) {
      const vendorPath = bundledPackageVendorPath(name);
      const sourceField = productionDependencyFields.find(
        (field) => plugin.manifest[field]?.[name] !== undefined,
      );
      if (manifest[sourceField]?.[name] !== `file:${vendorPath}`) {
        throw new Error(
          `${plugin.installRef}: release manifest does not install bundled runtime package ${name}`,
        );
      }
      await verifyBundledRuntimePackage(
        plugin,
        resolve(checkout, vendorPath),
        name,
        "release vendor",
      );
      await verifyBundledRuntimePackage(
        plugin,
        resolve(checkout, bundledPackageInstallPath(name)),
        name,
        "release checkout",
      );
    }
    await validatePluginArtifacts(checkout, {
      expectedId: plugin.pluginId,
      expectedName: plugin.name,
    });

    // Managed installs load the validated prebuilt server directly. Syntax
    // check it, but do not feed that bundle back through the server builder:
    // its Node ESM compatibility banner is intentionally not re-entrant.
    run(process.execPath, ["--check", resolve(checkout, "dist/server.js")]);

    // Direct git installs rebuild frontend entries before production
    // dependencies are present. Rebuild only the release wrapper to mirror
    // that host path without mutating the already-valid server artifact.
    const hasAuthoredCss = await stat(resolve(checkout, releaseAppCss))
      .then((details) => details.isFile())
      .catch((error) => {
        if (error?.code === "ENOENT") return false;
        throw error;
      });
    if (manifest.bb?.app) {
      run(
        process.execPath,
        [resolve(root, "tooling/build-plugin.mjs"), "--app-only", checkout],
        { cwd: root },
      );
    }
    if (hasAuthoredCss) {
      const rebuiltCss = await readFile(resolve(checkout, "dist/app.css"), "utf8");
      if (!rebuiltCss.includes("bb-plugin-release-style")) {
        throw new Error(`${plugin.installRef}: install build dropped plugin-authored CSS`);
      }
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
    for (const name of bundledDependencyNames) {
      await verifyBundledRuntimePackage(
        plugin,
        resolve(checkout, "node_modules", name),
        name,
        "production install",
      );
    }
    await validatePluginArtifacts(checkout, {
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
  const bundledPackages = await readBundledPackages();
  const bundledPackageNames = new Set(bundledPackages.keys());
  if (push) assertPublishWorktreeClean();
  const sourceRevision = git(["rev-parse", "HEAD"]);

  for (const plugin of plugins) {
    const pluginDirectory = resolve(root, plugin.source);
    await validatePluginArtifacts(pluginDirectory, {
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

    const candidateTree = await createReleaseTree(
      plugin,
      sourceCommit,
      bundledPackages,
    );
    const currentCommit = currentReleaseCommit(plugin, push);
    const currentTree = currentCommit
      ? git(["rev-parse", `${currentCommit}^{tree}`])
      : null;
    if (currentCommit && currentTree === candidateTree) {
      await verifyReleaseCommit(plugin, currentCommit, bundledPackageNames);
      console.log(`${plugin.installRef} ${currentCommit} unchanged and verified`);
      continue;
    }

    const releaseCommit = createReleaseCommit(plugin, candidateTree, sourceRevision);
    const ref = `refs/heads/${plugin.installRef}`;
    await verifyReleaseCommit(plugin, releaseCommit, bundledPackageNames);
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

  retireInstallRefs(plugins, push);
}

if (resolve(process.argv[1] ?? "") === fileURLToPath(import.meta.url)) {
  await publishInstallRefs({ push: process.argv.includes("--push") });
}
