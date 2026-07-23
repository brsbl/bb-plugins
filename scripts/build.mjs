import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const packageRoot = fileURLToPath(new URL("..", import.meta.url));
const buildPlugin = resolve(packageRoot, "../../tooling/build-plugin.mjs");

const providerBuild = spawnSync(
  process.execPath,
  [resolve(packageRoot, "scripts/build-provider-snapshot.mjs")],
  { cwd: packageRoot, stdio: "inherit" },
);
if (providerBuild.error) throw providerBuild.error;
if (providerBuild.status !== 0) process.exit(providerBuild.status ?? 1);

const previewCssBuild = spawnSync(
  process.execPath,
  [resolve(packageRoot, "scripts/build-preview-css.mjs")],
  { cwd: packageRoot, stdio: "inherit" },
);
if (previewCssBuild.error) throw previewCssBuild.error;
if (previewCssBuild.status !== 0) process.exit(previewCssBuild.status ?? 1);

const result = spawnSync(process.execPath, [buildPlugin, packageRoot], {
  cwd: packageRoot,
  stdio: "inherit",
});

if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);
