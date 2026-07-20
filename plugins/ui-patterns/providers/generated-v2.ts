import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  federatedSnapshotSchema,
  providerIndexSchema,
} from "./schema.js";

const packageRoot =
  process.env.UI_PATTERN_ATLAS_ROOT ??
  fileURLToPath(new URL("..", import.meta.url));

function readGeneratedJson(fileName: string): unknown {
  return JSON.parse(
    readFileSync(resolve(packageRoot, "generated", fileName), "utf8"),
  );
}

export const providerSnapshot = federatedSnapshotSchema.parse(
  readGeneratedJson("provider-snapshot.v2.json"),
);
export const providerIndex = providerIndexSchema.parse(
  readGeneratedJson("provider-index.v2.json"),
);

if (providerIndex.snapshotFingerprint !== providerSnapshot.fingerprint) {
  throw new Error(
    "Provider index does not match the bundled provider snapshot.",
  );
}
