import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  buildPluginApp as buildSharedPluginApp,
  buildPluginServer as buildSharedPluginServer,
  resolvePluginBuildToolchain as resolveSharedPluginBuildToolchain,
} from "./vendor/bb-plugin-build-0.39.0.mjs";
import {
  pluginBuildBbVersion,
  resolvePluginBuildProvenance,
} from "./plugin-build-provenance.mjs";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const arguments_ = process.argv.slice(2);
const appOnly = arguments_[0] === "--app-only";
const pluginArgument = arguments_[appOnly ? 1 : 0];
if (appOnly && pluginArgument === undefined) {
  throw new Error("--app-only requires a plugin path");
}
const pluginPath = resolve(pluginArgument ?? process.cwd());

const pluginBuild = await resolvePluginBuildProvenance(pluginPath);
const localBuilder = pluginBuild.local
  ? await import(pathToFileURL(pluginBuild.bundlePath).href)
  : null;
const buildPluginApp = localBuilder?.buildPluginApp ?? buildSharedPluginApp;
const buildPluginServer =
  localBuilder?.buildPluginServer ?? buildSharedPluginServer;
const resolvePluginBuildToolchain =
  localBuilder?.resolvePluginBuildToolchain ??
  resolveSharedPluginBuildToolchain;
const buildBbVersion = pluginBuild.local
  ? pluginBuild.version
  : pluginBuildBbVersion;
const toolchain = await resolvePluginBuildToolchain(repositoryRoot);
const files = [];
if (!appOnly) {
  const server = await buildPluginServer(pluginPath, buildBbVersion, toolchain);
  files.push(server.jsPath, server.mapPath, server.metaPath);
}
const manifest = JSON.parse(
  await readFile(resolve(pluginPath, "package.json"), "utf8"),
);
if (typeof manifest.bb?.app === "string") {
  const app = await buildPluginApp(pluginPath, buildBbVersion, toolchain);
  files.push(app.jsPath, app.cssPath, app.metaPath);
} else if (appOnly) {
  throw new Error(`${manifest.name}: --app-only requires bb.app`);
}

for (const file of files) console.log(file);
