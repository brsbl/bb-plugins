import { readFile } from "node:fs/promises";

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
