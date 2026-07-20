import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const pluginPath = resolve(process.argv[2] ?? process.cwd());
const executable = resolve(
  repositoryRoot,
  "node_modules",
  ".bin",
  process.platform === "win32" ? "bb.cmd" : "bb",
);
const { BB_CLI: _hostBbCli, ...environment } = process.env;
const esbuild = resolve(
  repositoryRoot,
  "node_modules",
  ".bin",
  process.platform === "win32" ? "esbuild.cmd" : "esbuild",
);
const result = spawnSync(executable, ["plugin", "build", pluginPath], {
  cwd: pluginPath,
  env: {
    ...environment,
    ESBUILD_BINARY_PATH: environment.ESBUILD_BINARY_PATH ?? esbuild,
  },
  stdio: "inherit",
});

if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
