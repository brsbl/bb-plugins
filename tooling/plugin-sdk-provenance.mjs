import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const provenance = JSON.parse(
  await readFile(
    new URL("./vendor/sdk-provenance.json", import.meta.url),
    "utf8",
  ),
);
const packageVersion = /^@get-bb\/plugin-sdk@(\d+\.\d+\.\d+)$/.exec(
  provenance.package,
)?.[1];

if (packageVersion === undefined) {
  throw new Error("vendored plugin SDK has no concrete version");
}
if (provenance.archive !== `get-bb-plugin-sdk-${packageVersion}.tgz`) {
  throw new Error("vendored plugin SDK archive does not match its version");
}

export const pluginSdkArchive = provenance.archive;
export const pluginSdkVersion = packageVersion;

function versionFromProvenance(record, label) {
  const version = /^@get-bb\/plugin-sdk@(\d+\.\d+\.\d+)$/.exec(
    record.package ?? "",
  )?.[1];
  if (version === undefined) {
    throw new Error(`${label} has no concrete @get-bb/plugin-sdk version`);
  }
  if (record.archive !== `get-bb-plugin-sdk-${version}.tgz`) {
    throw new Error(`${label} archive does not match its version`);
  }
  return version;
}

export async function resolvePluginSdkProvenance(pluginDirectory, manifest) {
  const dependency = manifest.devDependencies?.["@get-bb/plugin-sdk"];
  const sharedDependency = `file:../../tooling/vendor/${pluginSdkArchive}`;
  if (dependency === undefined || dependency === sharedDependency) {
    return {
      archive: pluginSdkArchive,
      archivePath: null,
      local: false,
      record: provenance,
      version: pluginSdkVersion,
    };
  }

  const localArchive = /^file:\.\/vendor\/([^/]+\.tgz)$/.exec(dependency)?.[1];
  if (localArchive === undefined) {
    throw new Error(`${manifest.name}: plugin SDK dependency drift`);
  }
  if (localArchive === pluginSdkArchive) {
    return {
      archive: pluginSdkArchive,
      archivePath: resolve(pluginDirectory, "vendor", pluginSdkArchive),
      local: true,
      record: provenance,
      version: pluginSdkVersion,
    };
  }
  const record = JSON.parse(
    await readFile(resolve(pluginDirectory, "vendor/sdk-provenance.json"), "utf8"),
  );
  const version = versionFromProvenance(
    record,
    `${manifest.name}: vendored plugin SDK provenance`,
  );
  if (record.archive !== localArchive) {
    throw new Error(`${manifest.name}: plugin SDK dependency and provenance drift`);
  }
  return {
    archive: localArchive,
    archivePath: resolve(pluginDirectory, "vendor", localArchive),
    local: true,
    record,
    version,
  };
}

function parseVersion(value) {
  const match = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.exec(value);
  return match?.slice(1).map(Number) ?? null;
}

function compareVersions(left, right) {
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) return left[index] - right[index];
  }
  return 0;
}

export function sdkRangeIncludesVersion(range, version) {
  const match = /^(\^|>=)(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.exec(
    range ?? "",
  );
  const target = parseVersion(version);
  if (match === null || target === null) return false;

  const operator = match[1];
  const floor = match.slice(2).map(Number);
  if (compareVersions(target, floor) < 0) return false;
  if (operator === ">=") return true;
  if (floor[0] > 0) return target[0] === floor[0];
  if (floor[1] > 0) return target[0] === 0 && target[1] === floor[1];
  return target[0] === 0 && target[1] === 0 && target[2] === floor[2];
}
