import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildPluginApp,
  buildPluginServer,
  resolvePluginBuildToolchain,
} from "./vendor/bb-plugin-build-0.39.0.mjs";

const pluginPath = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(pluginPath, "../..");
const bbVersion = "0.39.0";
const toolchain = await resolvePluginBuildToolchain(repositoryRoot);
const files = [];

const server = await buildPluginServer(pluginPath, bbVersion, toolchain);
files.push(server.jsPath, server.mapPath, server.metaPath);

const manifest = JSON.parse(
  await readFile(resolve(pluginPath, "package.json"), "utf8"),
);
if (typeof manifest.bb?.app === "string") {
  const app = await buildPluginApp(pluginPath, bbVersion, toolchain);
  files.push(app.jsPath, app.cssPath, app.metaPath);
}

for (const file of files) console.log(file);
