import providerIndexInput from "../generated/provider-index.v1.json";
import providerSnapshotInput from "../generated/provider-snapshot.v1.json";
import {
  federatedSnapshotSchema,
  providerIndexSchema,
} from "./schema.js";

export const providerSnapshot = federatedSnapshotSchema.parse(
  providerSnapshotInput,
);
export const providerIndex = providerIndexSchema.parse(providerIndexInput);

if (providerIndex.snapshotFingerprint !== providerSnapshot.fingerprint) {
  throw new Error(
    "Provider index does not match the bundled provider snapshot.",
  );
}
