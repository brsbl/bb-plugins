import { z } from "zod";

const providerIdPattern = /^[a-z0-9][a-z0-9._-]*$/;
const sha256Pattern = /^[a-f0-9]{64}$/;
const gitRevisionPattern = /^[a-f0-9]{40}$/;

export const providerIdSchema = z
  .string()
  .min(1)
  .max(80)
  .regex(providerIdPattern);

export const providerDefinitionSchema = z
  .object({
    id: providerIdSchema,
    name: z.string().min(1).max(160),
    homepage: z.url(),
    adapter: z.enum(["govuk-design-system", "uswds"]),
    source: z
      .object({
        repository: z.url(),
        revision: z.string().regex(gitRevisionPattern),
        observedAt: z.iso.datetime({ offset: true }),
        format: z.string().min(1).max(120),
        inputPath: z.string().min(1),
        sourcePaths: z.array(z.string().min(1)).min(1),
      })
      .strict(),
    license: z
      .object({
        expression: z.string().min(1).max(120),
        url: z.url(),
        scope: z.literal("metadata-only"),
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

export const providerLockSchema = z
  .object({
    schemaVersion: z.literal("1"),
    inputs: z.record(providerIdSchema, z.string().regex(sha256Pattern)),
  })
  .strict();

export const providerRecordSchema = z
  .object({
    nativeId: z.string().min(1).max(240),
    name: z.string().min(1).max(240),
    summary: z.string().min(1).max(1_000).nullable(),
    kind: z.string().min(1).max(120),
    aliases: z.array(z.string().min(1).max(240)),
    canonicalUrl: z.url(),
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
        adapter: z.string().min(1).max(120),
        repository: z.url(),
        revision: z.string().regex(gitRevisionPattern),
        observedAt: z.iso.datetime({ offset: true }),
        format: z.string().min(1).max(120),
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
    schemaVersion: z.literal("1"),
    assembledAt: z.iso.datetime({ offset: true }),
    fingerprint: z.string().regex(sha256Pattern),
    providers: z.array(providerSnapshotSchema),
  })
  .strict();

export const providerDocumentSchema = providerRecordSchema.extend({
  providerName: z.string().min(1).max(160),
  key: z.string().min(1),
  search: z
    .object({
      name: z.array(z.string().min(1)),
      aliases: z.array(z.string().min(1)),
      summary: z.array(z.string().min(1)),
      kind: z.array(z.string().min(1)),
      nativeId: z.array(z.string().min(1)),
    })
    .strict(),
});

export const providerIndexSchema = z
  .object({
    schemaVersion: z.literal("1"),
    snapshotFingerprint: z.string().regex(sha256Pattern),
    documents: z.array(providerDocumentSchema),
    postings: z.record(z.string().min(1), z.array(z.string().min(1))),
  })
  .strict();

export type ProviderDefinition = z.infer<typeof providerDefinitionSchema>;
export type ProviderRecord = z.infer<typeof providerRecordSchema>;
export type ProviderSnapshot = z.infer<typeof providerSnapshotSchema>;
export type FederatedSnapshot = z.infer<typeof federatedSnapshotSchema>;
export type ProviderDocument = z.infer<typeof providerDocumentSchema>;
export type ProviderIndex = z.infer<typeof providerIndexSchema>;
