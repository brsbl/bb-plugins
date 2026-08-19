import { readFile } from "node:fs/promises";

const provenance = JSON.parse(
  await readFile(
    new URL(
      "./vendor/plugin-build-sdk-0.4.8-provenance.json",
      import.meta.url,
    ),
    "utf8",
  ),
);
const builderVersion = /^bb plugin build@(\d+\.\d+\.\d+)$/.exec(
  provenance.builder,
)?.[1];
const pluginSdkVersion = /^(\d+\.\d+\.\d+)$/.exec(
  provenance.pluginSdkVersion,
)?.[1];

if (builderVersion === undefined || pluginSdkVersion === undefined) {
  throw new Error(
    "vendored SDK 0.4.8 plugin builder has no concrete BB or SDK version",
  );
}

export const currentPluginBuildBbVersion = builderVersion;
export const currentPluginSdkVersion = pluginSdkVersion;
