import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildPluginApp,
  buildPluginServer,
} from "./vendor/bb-plugin-build-0.0.34.mjs";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const pluginPath = resolve(process.argv[2] ?? process.cwd());
const esbuild = resolve(
  repositoryRoot,
  "node_modules",
  ".bin",
  process.platform === "win32" ? "esbuild.cmd" : "esbuild",
);
process.env.ESBUILD_BINARY_PATH ??= esbuild;

const bbVersion = "0.0.34";
const server = await buildPluginServer(pluginPath, bbVersion);
const files = [server.jsPath, server.mapPath, server.metaPath];
const manifest = JSON.parse(
  await readFile(resolve(pluginPath, "package.json"), "utf8"),
);
if (typeof manifest.bb?.app === "string") {
  const app = await buildPluginApp(pluginPath, bbVersion);
  files.push(app.jsPath, app.cssPath, app.metaPath);
}

for (const file of files) console.log(file);
