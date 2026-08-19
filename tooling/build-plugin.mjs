import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { pluginBuildBbVersion } from "./plugin-build-provenance.mjs";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const arguments_ = process.argv.slice(2);
const appOnly = arguments_[0] === "--app-only";
const pluginArgument = arguments_[appOnly ? 1 : 0];
if (appOnly && pluginArgument === undefined) {
  throw new Error("--app-only requires a plugin path");
}
const pluginPath = resolve(pluginArgument ?? process.cwd());
const manifest = JSON.parse(
  await readFile(resolve(pluginPath, "package.json"), "utf8"),
);
const currentSdkDependency =
  manifest.dependencies?.["@get-bb/plugin-sdk"] ??
  manifest.devDependencies?.["@get-bb/plugin-sdk"];
const usesCurrentSdk = typeof currentSdkDependency === "string";

let buildPluginApp;
let buildPluginServer;
let bbVersion;
let toolchain;
if (usesCurrentSdk) {
  ({ buildPluginApp, buildPluginServer } = await import(
    "./vendor/bb-plugin-build-sdk-0.4.8.mjs"
  ));
  ({ currentPluginBuildBbVersion: bbVersion } = await import(
    "./plugin-build-sdk-0.4.8-provenance.mjs"
  ));
  const require = createRequire(import.meta.url);
  toolchain = {
    esbuild: pathToFileURL(require.resolve("esbuild")).href,
    tailwindNode: pathToFileURL(require.resolve("@tailwindcss/node")).href,
    tailwindOxide: pathToFileURL(require.resolve("@tailwindcss/oxide")).href,
    tailwindCssDir: resolve(repositoryRoot, "node_modules", "tailwindcss"),
  };
} else {
  ({ buildPluginApp, buildPluginServer } = await import(
    "./vendor/bb-plugin-build-0.0.34.mjs"
  ));
  bbVersion = pluginBuildBbVersion;
  const esbuild = resolve(
    repositoryRoot,
    "node_modules",
    ".bin",
    process.platform === "win32" ? "esbuild.cmd" : "esbuild",
  );
  process.env.ESBUILD_BINARY_PATH ??= esbuild;
}

const files = [];
if (!appOnly) {
  const server = await buildPluginServer(pluginPath, bbVersion, toolchain);
  files.push(server.jsPath, server.mapPath, server.metaPath);
}
if (typeof manifest.bb?.app === "string") {
  const app = await buildPluginApp(pluginPath, bbVersion, toolchain);
  files.push(app.jsPath, app.cssPath, app.metaPath);
} else if (appOnly) {
  throw new Error(`${manifest.name}: --app-only requires bb.app`);
}

for (const file of files) console.log(file);
