import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const packageRoot = fileURLToPath(new URL("..", import.meta.url));
const bb = process.env.BB_CLI || "bb";
const localEsbuild = resolve(packageRoot, "node_modules/esbuild/bin/esbuild");

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

const result = spawnSync(bb, ["plugin", "build", packageRoot], {
  cwd: packageRoot,
  stdio: "inherit",
  env: {
    ...process.env,
    ...(process.env.ESBUILD_BINARY_PATH || !existsSync(localEsbuild)
      ? {}
      : { ESBUILD_BINARY_PATH: localEsbuild }),
  },
});

if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);
