import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

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

export async function resolvePluginBuildProvenance(pluginDirectory) {
  const record = await readFile(
    resolve(pluginDirectory, "vendor/plugin-build-provenance.json"),
    "utf8",
  )
    .then(JSON.parse)
    .catch((error) => {
      if (error?.code === "ENOENT") return null;
      throw error;
    });
  if (record === null) {
    return { local: false, record: provenance, version: pluginBuildBbVersion };
  }

  const version = /^bb plugin build@(\d+\.\d+\.\d+)$/.exec(
    record.builder ?? "",
  )?.[1];
  if (version === undefined) {
    throw new Error("plugin-local builder has no concrete BB version");
  }
  if (record.bundle !== `bb-plugin-build-${version}.mjs`) {
    throw new Error("plugin-local builder bundle does not match its version");
  }
  const bundlePath = resolve(pluginDirectory, "vendor", record.bundle);
  const bundle = await readFile(bundlePath);
  if (createHash("sha256").update(bundle).digest("hex") !== record.sha256) {
    throw new Error("plugin-local builder hash mismatch");
  }
  return { bundlePath, local: true, record, version };
}
