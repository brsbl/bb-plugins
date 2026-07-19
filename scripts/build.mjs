import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const packageRoot = fileURLToPath(new URL("..", import.meta.url));
const bb = process.env.BB_CLI || "bb";

const providerBuild = spawnSync(
  process.execPath,
  [resolve(packageRoot, "scripts/build-provider-snapshot.mjs")],
  { cwd: packageRoot, stdio: "inherit" },
);
if (providerBuild.error) throw providerBuild.error;
if (providerBuild.status !== 0) process.exit(providerBuild.status ?? 1);

const result = spawnSync(bb, ["plugin", "build", packageRoot], {
  cwd: packageRoot,
  stdio: "inherit",
});

if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);
