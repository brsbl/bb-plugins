import { readFile } from "node:fs/promises";

const provenance = JSON.parse(
  await readFile(
    new URL("./vendor/plugin-build-provenance.json", import.meta.url),
    "utf8",
  ),
);
const builderVersion = /^bb plugin build@(\d+\.\d+\.\d+)$/.exec(
  provenance.builder,
)?.[1];

if (builderVersion === undefined) {
  throw new Error("vendored plugin builder has no concrete BB version");
}

export const pluginBuildBbVersion = builderVersion;
