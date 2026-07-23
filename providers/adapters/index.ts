import type { ProviderDefinition } from "../schema.js";
import { sourceRecordsAdapter } from "./source-records.js";
import type { ProviderAdapter } from "./types.js";

const adapters = new Map<ProviderDefinition["adapter"], ProviderAdapter>([
  [sourceRecordsAdapter.id, sourceRecordsAdapter],
]);

export function adapterFor(definition: ProviderDefinition): ProviderAdapter {
  const adapter = adapters.get(definition.adapter);
  if (!adapter) {
    throw new Error(`No adapter registered for ${definition.adapter}.`);
  }
  return adapter;
}

export function adapterVersionFor(adapterId: string): string {
  const adapter = adapters.get(adapterId as ProviderDefinition["adapter"]);
  if (!adapter) {
    throw new Error(`No adapter registered for ${adapterId}.`);
  }
  return adapter.version;
}
