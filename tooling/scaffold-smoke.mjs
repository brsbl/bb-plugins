import { randomUUID } from "node:crypto";
import { rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { scaffoldPlugin } from "./create-plugin.mjs";
import { validatePluginArtifacts } from "./validate-plugin-artifacts.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const executable = (name) =>
  resolve(root, "node_modules", ".bin", process.platform === "win32" ? `${name}.cmd` : name);

function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} exited ${result.status}`);
}

const directory = resolve(root, "plugins", `.scaffold-smoke-${randomUUID()}`);
try {
  await scaffoldPlugin({
    slug: "scaffold-smoke",
    name: "Scaffold Smoke",
    description: "Verifies the personal bb plugin scaffold.",
    output: directory,
    updateCatalog: false,
    skipInstall: true,
    skipVerify: true,
    surfaces: ["Server capability"],
  });
  run(executable("tsc"), ["--noEmit", "-p", resolve(directory, "tsconfig.json")], root);
  run(executable("vitest"), ["run", resolve(directory, "server.test.ts")], root);
  run(process.execPath, [resolve(root, "tooling/build-plugin.mjs"), directory], root);
  await validatePluginArtifacts(directory);
  console.log("plugin scaffold smoke test passed");
} finally {
  await rm(directory, { recursive: true, force: true });
}
