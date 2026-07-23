import { z } from "zod";
import {
  providerRecordSchema,
  type ProviderDefinition,
  type ProviderRecord,
} from "../schema.js";
import type { ProviderAdapter } from "./types.js";

const inputRecordSchema = providerRecordSchema
  .omit({ provenance: true })
  .extend({ sourcePath: z.string().min(1) })
  .strict();

const sourceRecordsInputSchema = z
  .object({
    schemaVersion: z.literal("1"),
    revision: z.string().min(1),
    records: z.array(inputRecordSchema),
  })
  .strict();

export const sourceRecordsAdapter: ProviderAdapter = {
  id: "source-records",
  version: "2",
  adapt(
    definition: ProviderDefinition,
    input: unknown,
  ): readonly ProviderRecord[] {
    const source = sourceRecordsInputSchema.parse(input);
    if (source.revision !== definition.source.revision) {
      throw new Error(
        `${definition.id} source revision ${source.revision} does not match ${definition.source.revision}.`,
      );
    }

    return source.records.map(({ sourcePath, ...record }) =>
      providerRecordSchema.parse({
        ...record,
        provenance: {
          providerId: definition.id,
          repository: definition.source.repository,
          revision: definition.source.revision,
          sourcePath,
        },
      }),
    );
  },
};
