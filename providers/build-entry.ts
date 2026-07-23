import { buildProviderArtifacts } from "./build.js";
import {
  providerBuildInputs,
  providerSnapshotAssembledAt,
} from "./registry.js";
import type { FederatedSnapshot } from "./schema.js";

export function buildRegisteredProviderArtifacts(
  previousSnapshot?: FederatedSnapshot,
) {
  return buildProviderArtifacts({
    inputs: providerBuildInputs,
    assembledAt: providerSnapshotAssembledAt,
    previousSnapshot,
  });
}
