import { z } from "zod";
import { adapterVersionFor } from "./adapters/index.js";
import { providerIndex, providerSnapshot } from "./generated-v2.js";
import {
  atlasEntrySchema,
  contentModeSchema,
  providerRecordSchema,
  sourceRecordIdSchema,
  type AtlasEntry,
  type ProviderRecord,
  type ProviderSnapshot,
} from "./schema.js";
import { searchProviderIndex } from "./search-v2.js";

export interface LibraryProvider {
  id: string;
  name: string;
  homepageUrl: string;
  adapterVersion: string;
  repositoryUrl: string;
  approvedPaths: readonly string[];
  license: {
    id: string;
    url: string;
    attribution: string;
    contentMode: "metadata-only" | "excerpt";
  };
}

export type SourceRecord = ProviderRecord & {
  id: `${string}:${string}`;
};

export interface SourceBrowserSnapshot {
  providers: readonly LibraryProvider[];
  records: readonly SourceRecord[];
  entries: readonly AtlasEntry[];
}

export interface AtlasEntrySearchOptions {
  query?: string;
  providerId?: string;
  limit?: number;
}

export type AtlasEntrySearchMode = "browse" | "exact" | "prefix" | "expanded";

export interface AtlasEntrySearchResult {
  mode: AtlasEntrySearchMode;
  queryTerms: readonly string[];
  entries: readonly AtlasEntry[];
}

const libraryProviderSchema: z.ZodType<LibraryProvider> = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    homepageUrl: z.url(),
    adapterVersion: z.string().min(1),
    repositoryUrl: z.url(),
    approvedPaths: z.array(z.string().min(1)),
    license: z
      .object({
        id: z.string().min(1),
        url: z.url(),
        attribution: z.string().min(1),
        contentMode: contentModeSchema,
      })
      .strict(),
  })
  .strict();

export const sourceRecordSchema: z.ZodType<SourceRecord> = providerRecordSchema
  .extend({ id: sourceRecordIdSchema })
  .strict();

export const sourceBrowserSnapshotSchema: z.ZodType<SourceBrowserSnapshot> = z
  .object({
    providers: z.array(libraryProviderSchema),
    records: z.array(sourceRecordSchema),
    entries: z.array(atlasEntrySchema),
  })
  .strict();

export const atlasEntrySearchInputSchema = z
  .object({
    query: z.string().max(500).optional(),
    providerId: z.string().min(1).max(80).optional(),
    limit: z.number().int().min(1).max(100).optional(),
  })
  .strict();

export const atlasEntrySearchResultSchema = z
  .object({
    mode: z.enum(["browse", "exact", "prefix", "expanded"]),
    queryTerms: z.array(z.string()),
    entries: z.array(atlasEntrySchema),
  })
  .strict();

function toLibraryProvider(provider: ProviderSnapshot): LibraryProvider {
  return {
    id: provider.id,
    name: provider.name,
    homepageUrl: provider.homepage,
    adapterVersion: adapterVersionFor(provider.source.adapter),
    repositoryUrl: provider.source.repository,
    approvedPaths: [...provider.source.sourcePaths],
    license: {
      id: provider.license.expression,
      url: provider.license.url,
      attribution: provider.license.notice,
      contentMode: provider.license.scope,
    },
  };
}

function toSourceRecord(record: ProviderRecord): SourceRecord {
  return {
    ...record,
    id: `${record.provenance.providerId}:${record.nativeId}`,
  };
}

function freezeRecord(record: SourceRecord): SourceRecord {
  Object.freeze(record.aliases);
  for (const section of record.sections) Object.freeze(section);
  Object.freeze(record.sections);
  for (const link of record.links) Object.freeze(link);
  Object.freeze(record.links);
  for (const example of record.examples) Object.freeze(example);
  Object.freeze(record.examples);
  for (const relationship of record.relationships) Object.freeze(relationship);
  Object.freeze(record.relationships);
  if (record.summary) Object.freeze(record.summary);
  Object.freeze(record.provenance);
  return Object.freeze(record);
}

function freezeEntry(entry: AtlasEntry): AtlasEntry {
  Object.freeze(entry.aliases);
  Object.freeze(entry.sourceRecordIds);
  if (entry.summary) Object.freeze(entry.summary);
  return Object.freeze(entry);
}

function createSourceBrowserSnapshot(): SourceBrowserSnapshot {
  const parsed = sourceBrowserSnapshotSchema.parse({
    providers: providerSnapshot.providers.map(toLibraryProvider),
    records: providerSnapshot.providers.flatMap((provider) =>
      provider.records.map(toSourceRecord),
    ),
    entries: providerSnapshot.entries,
  });
  const providers = parsed.providers.map((provider) => {
    Object.freeze(provider.approvedPaths);
    Object.freeze(provider.license);
    return Object.freeze(provider);
  });
  const records = parsed.records.map(freezeRecord);
  const entries = parsed.entries.map(freezeEntry);
  return Object.freeze({
    providers: Object.freeze(providers),
    records: Object.freeze(records),
    entries: Object.freeze(entries),
  });
}

const bundledSourceBrowserSnapshot = createSourceBrowserSnapshot();

/** Returns the validated, runtime-frozen build-time snapshot. */
export function getSourceBrowserSnapshot(): SourceBrowserSnapshot {
  return bundledSourceBrowserSnapshot;
}

/** Searches only the bundled offline index and returns computed Atlas entries. */
export function searchAtlasEntries(
  options: AtlasEntrySearchOptions = {},
): AtlasEntrySearchResult {
  const parsed = atlasEntrySearchInputSchema.parse(options);
  const result = searchProviderIndex(providerIndex, parsed);
  const entries = result.results.map(({ entry }) => {
    const { key: _key, search: _search, ...atlasEntry } = entry;
    return atlasEntry;
  });
  return Object.freeze({
    mode: result.mode,
    queryTerms: Object.freeze([...result.queryTerms]),
    entries: Object.freeze(entries.map(freezeEntry)),
  });
}
