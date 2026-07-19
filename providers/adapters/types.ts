import type { ProviderDefinition, ProviderRecord } from "../schema.js";

export interface ProviderAdapter {
  readonly id: ProviderDefinition["adapter"];
  adapt(
    definition: ProviderDefinition,
    input: unknown,
  ): readonly ProviderRecord[];
}
