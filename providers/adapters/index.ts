import type { ProviderDefinition } from "../schema.js";
import { govukDesignSystemAdapter } from "./govuk-design-system.js";
import type { ProviderAdapter } from "./types.js";
import { uswdsAdapter } from "./uswds.js";

const adapters = new Map<ProviderDefinition["adapter"], ProviderAdapter>([
  [govukDesignSystemAdapter.id, govukDesignSystemAdapter],
  [uswdsAdapter.id, uswdsAdapter],
]);

export function adapterFor(definition: ProviderDefinition): ProviderAdapter {
  const adapter = adapters.get(definition.adapter);
  if (!adapter) {
    throw new Error(`No adapter registered for ${definition.adapter}.`);
  }
  return adapter;
}
