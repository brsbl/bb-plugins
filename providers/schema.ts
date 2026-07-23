import { z } from "zod";

const providerIdPattern = /^[a-z0-9][a-z0-9._-]*$/;
const sha256Pattern = /^[a-f0-9]{64}$/;
const gitRevisionPattern = /^[a-f0-9]{40}$/;

export const providerIdSchema = z
  .string()
  .min(1)
  .max(80)
  .regex(providerIdPattern);

export const sourceRecordIdSchema = z.custom<`${string}:${string}`>(
  (value) =>
    typeof value === "string" &&
    value.indexOf(":") > 0 &&
    value.indexOf(":") < value.length - 1,
  "Expected a provider-scoped source-native id.",
);

export const contentModeSchema = z.enum(["metadata-only", "excerpt"]);
export const sourceKindSchema = z.enum([
  "primitive",
  "component",
  "block",
  "pattern",
  "guidance",
  "example",
  "unknown",
]);

export const providerDefinitionSchema = z
  .object({
    id: providerIdSchema,
    name: z.string().min(1).max(160),
    homepage: z.url(),
    adapter: z.literal("source-records"),
    source: z
      .object({
        repository: z.url(),
        revision: z.string().regex(gitRevisionPattern),
        observedAt: z.iso.datetime({ offset: true }),
        format: z.string().min(1).max(160),
        inputPath: z.string().min(1),
        sourcePaths: z.array(z.string().min(1)).min(1),
      })
      .strict(),
    license: z
      .object({
        expression: z.string().min(1).max(120),
        url: z.url(),
        scope: contentModeSchema,
        notice: z.string().min(1).max(500),
      })
      .strict(),
    freshness: z
      .object({
        staleAfterDays: z.number().int().positive().max(365),
      })
      .strict(),
  })
  .strict();

export const providerManifestSchema = z
  .object({
    schemaVersion: z.literal("1"),
    assembledAt: z.iso.datetime({ offset: true }),
    providers: z.array(providerDefinitionSchema).length(4),
  })
  .strict();

export const providerLockSchema = z
  .object({
    schemaVersion: z.literal("2"),
    inputs: z.record(providerIdSchema, z.string().regex(sha256Pattern)),
  })
  .strict();

export const sourceSummarySchema = z
  .object({
    text: z.string().min(1).max(2_000),
    url: z.url(),
  })
  .strict();

export const sourceSectionSchema = z
  .object({
    nativeId: z.string().min(1).max(240),
    title: z.string().min(1).max(240),
    url: z.url(),
    content: z.string().min(1).max(20_000).nullable(),
  })
  .strict();

export const sourceLinkSchema = z
  .object({
    kind: z.enum(["docs", "code"]),
    label: z.string().min(1).max(240).nullable(),
    url: z.url(),
  })
  .strict();

export const sourceExampleSchema = z
  .object({
    nativeId: z.string().min(1).max(240),
    title: z.string().min(1).max(240),
    url: z.url(),
  })
  .strict();

export const sourceRelationshipSchema = z
  .object({
    kind: z.enum([
      "same-as",
      "implementation-of",
      "related-to",
      "alternative-to",
    ]),
    label: z.string().min(1).max(240),
    targetTitle: z.string().min(1).max(240),
    targetUrl: z.url(),
  })
  .strict();

export const providerRecordSchema = z
  .object({
    nativeId: z.string().min(1).max(240),
    name: z.string().min(1).max(240),
    aliases: z.array(z.string().min(1).max(240)),
    summary: sourceSummarySchema.nullable(),
    kind: sourceKindSchema,
    canonicalUrl: z.url(),
    sections: z.array(sourceSectionSchema),
    links: z.array(sourceLinkSchema),
    examples: z.array(sourceExampleSchema),
    relationships: z.array(sourceRelationshipSchema),
    provenance: z
      .object({
        providerId: providerIdSchema,
        repository: z.url(),
        revision: z.string().regex(gitRevisionPattern),
        sourcePath: z.string().min(1),
      })
      .strict(),
  })
  .strict();

export const atlasEntrySchema = z
  .object({
    name: z.string().min(1).max(240),
    aliases: z.array(z.string().min(1).max(240)),
    summary: z
      .object({
        text: z.string().min(1).max(2_000),
        sourceRecordId: sourceRecordIdSchema,
      })
      .strict()
      .nullable(),
    kind: z.union([sourceKindSchema, z.literal("mixed")]),
    sourceRecordIds: z.array(sourceRecordIdSchema).min(1),
    exampleCount: z.number().int().nonnegative(),
  })
  .strict();

const providerBuildSchema = z
  .object({
    mode: z.enum(["current", "last-known-good"]),
    inputSha256: z.string().regex(sha256Pattern),
    failure: z
      .object({
        code: z.string().min(1).max(120),
        candidateRevision: z.string().regex(gitRevisionPattern),
        candidateInputSha256: z.string().regex(sha256Pattern).nullable(),
      })
      .strict()
      .nullable(),
  })
  .strict();

export const providerSnapshotSchema = z
  .object({
    id: providerIdSchema,
    name: z.string().min(1).max(160),
    homepage: z.url(),
    source: z
      .object({
        adapter: z.literal("source-records"),
        repository: z.url(),
        revision: z.string().regex(gitRevisionPattern),
        observedAt: z.iso.datetime({ offset: true }),
        format: z.string().min(1).max(160),
        inputPath: z.string().min(1),
        sourcePaths: z.array(z.string().min(1)).min(1),
      })
      .strict(),
    license: providerDefinitionSchema.shape.license,
    freshness: providerDefinitionSchema.shape.freshness,
    build: providerBuildSchema,
    records: z.array(providerRecordSchema),
  })
  .strict();

export const federatedSnapshotSchema = z
  .object({
    schemaVersion: z.literal("2"),
    assembledAt: z.iso.datetime({ offset: true }),
    fingerprint: z.string().regex(sha256Pattern),
    providers: z.array(providerSnapshotSchema),
    entries: z.array(atlasEntrySchema),
  })
  .strict();

export const atlasEntryDocumentSchema = atlasEntrySchema.extend({
  key: sourceRecordIdSchema,
  search: z
    .object({
      name: z.array(z.string().min(1)),
      aliases: z.array(z.string().min(1)),
      summaries: z.array(z.string().min(1)),
      kinds: z.array(z.string().min(1)),
      nativeIds: z.array(z.string().min(1)),
      sections: z.array(z.string().min(1)),
      relationships: z.array(z.string().min(1)),
    })
    .strict(),
});

export const providerIndexSchema = z
  .object({
    schemaVersion: z.literal("2"),
    snapshotFingerprint: z.string().regex(sha256Pattern),
    documents: z.array(atlasEntryDocumentSchema),
    postings: z.record(z.string().min(1), z.array(sourceRecordIdSchema)),
  })
  .strict();

export type ProviderDefinition = z.infer<typeof providerDefinitionSchema>;
export type ProviderManifest = z.infer<typeof providerManifestSchema>;
export type ProviderRecord = z.infer<typeof providerRecordSchema>;
export type AtlasEntry = z.infer<typeof atlasEntrySchema>;
export type ProviderSnapshot = z.infer<typeof providerSnapshotSchema>;
export type FederatedSnapshot = z.infer<typeof federatedSnapshotSchema>;
export type AtlasEntryDocument = z.infer<typeof atlasEntryDocumentSchema>;
export type ProviderIndex = z.infer<typeof providerIndexSchema>;
