import { z } from "zod";
import { adapterVersionFor } from "./adapters/index.js";
import { providerIndex, providerSnapshot } from "./generated.js";
import type { ProviderRecord, ProviderSnapshot } from "./schema.js";
import { searchProviderIndex } from "./search.js";

export interface LibraryProvider {
  id: string;
  name: string;
  homepageUrl: string;
  adapterVersion: string;
  upstream: {
    kind: "git" | "npm" | "json";
    locator: string;
  };
  license: {
    id: string;
    url: string;
    attribution?: string;
    contentMode: "metadata-only" | "excerpt" | "redistributable";
  };
}

export type SourceItemLinkKind = "docs" | "example" | "code";

export interface SourceItem {
  id: `${string}:${string}`;
  providerId: string;
  nativeId: string;
  title: string;
  canonicalUrl: string;
  contentKind: "component" | "pattern" | "guidance" | "unknown";
  aliases: string[];
  excerpt?: string;
  sourceSection?: string;
  sourceTags: string[];
  links: Array<{
    kind: SourceItemLinkKind;
    url: string;
  }>;
  provenance: {
    upstreamRevision: string;
    retrievedAt: string;
    contentMode: LibraryProvider["license"]["contentMode"];
  };
}

export interface SourceBrowserSnapshot {
  providers: readonly LibraryProvider[];
  items: readonly SourceItem[];
}

export interface SourceItemSearchOptions {
  query?: string;
  providerId?: string;
  contentKind?: SourceItem["contentKind"];
  limit?: number;
}

export type SourceItemSearchMode = "browse" | "exact" | "prefix" | "expanded";

export interface SourceItemSearchResult {
  mode: SourceItemSearchMode;
  queryTerms: readonly string[];
  items: readonly SourceItem[];
}

const contentModeSchema = z.enum([
  "metadata-only",
  "excerpt",
  "redistributable",
]);
const contentKindSchema = z.enum([
  "component",
  "pattern",
  "guidance",
  "unknown",
]);

const libraryProviderSchema: z.ZodType<LibraryProvider> = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    homepageUrl: z.url(),
    adapterVersion: z.string().min(1),
    upstream: z
      .object({
        kind: z.enum(["git", "npm", "json"]),
        locator: z.string().min(1),
      })
      .strict(),
    license: z
      .object({
        id: z.string().min(1),
        url: z.url(),
        attribution: z.string().min(1).optional(),
        contentMode: contentModeSchema,
      })
      .strict(),
  })
  .strict();

const sourceItemLinkSchema = z
  .object({
    kind: z.enum(["docs", "example", "code"]),
    url: z.url(),
  })
  .strict();

const sourceItemSchema: z.ZodType<SourceItem> = z
  .object({
    id: z.custom<`${string}:${string}`>(
      (value) =>
        typeof value === "string" &&
        value.indexOf(":") > 0 &&
        value.indexOf(":") < value.length - 1,
      "Expected a provider-scoped source-native id.",
    ),
    providerId: z.string().min(1),
    nativeId: z.string().min(1),
    title: z.string().min(1),
    canonicalUrl: z.url(),
    contentKind: contentKindSchema,
    aliases: z.array(z.string().min(1)),
    excerpt: z.string().min(1).optional(),
    sourceSection: z.string().min(1).optional(),
    sourceTags: z.array(z.string().min(1)),
    links: z.array(sourceItemLinkSchema),
    provenance: z
      .object({
        upstreamRevision: z.string().min(1),
        retrievedAt: z.string().min(1),
        contentMode: contentModeSchema,
      })
      .strict(),
  })
  .strict();

export const sourceBrowserSnapshotSchema: z.ZodType<SourceBrowserSnapshot> = z
  .object({
    providers: z.array(libraryProviderSchema),
    items: z.array(sourceItemSchema),
  })
  .strict();

export const sourceItemSearchInputSchema = z
  .object({
    query: z.string().max(500).optional(),
    providerId: z.string().min(1).max(80).optional(),
    contentKind: contentKindSchema.optional(),
    limit: z.number().int().min(1).max(100).optional(),
  })
  .strict();

export const sourceItemSearchResultSchema = z
  .object({
    mode: z.enum(["browse", "exact", "prefix", "expanded"]),
    queryTerms: z.array(z.string()),
    items: z.array(sourceItemSchema),
  })
  .strict();

function contentKindFor(kind: string): SourceItem["contentKind"] {
  switch (kind.toLocaleLowerCase()) {
    case "component":
    case "components":
      return "component";
    case "pattern":
    case "patterns":
      return "pattern";
    default:
      return "unknown";
  }
}

function codeUrl(record: ProviderRecord): string {
  return (
    `${record.provenance.repository}/blob/` +
    `${record.provenance.revision}/${record.provenance.sourcePath}`
  );
}

function linksFor(record: ProviderRecord): SourceItem["links"] {
  const sourceCodeUrl = codeUrl(record);
  const links: SourceItem["links"] = [
    {
      kind: record.canonicalUrl === sourceCodeUrl ? "code" : "docs",
      url: record.canonicalUrl,
    },
  ];
  if (record.canonicalUrl !== sourceCodeUrl) {
    links.push({ kind: "code", url: sourceCodeUrl });
  }
  return links;
}

function toLibraryProvider(provider: ProviderSnapshot): LibraryProvider {
  return {
    id: provider.id,
    name: provider.name,
    homepageUrl: provider.homepage,
    adapterVersion: adapterVersionFor(provider.source.adapter),
    upstream: {
      kind: "git",
      locator: provider.source.repository,
    },
    license: {
      id: provider.license.expression,
      url: provider.license.url,
      ...(provider.license.expression === "MIT"
        ? { attribution: provider.license.notice }
        : {}),
      contentMode: provider.license.scope,
    },
  };
}

function toSourceItem(
  provider: ProviderSnapshot,
  record: ProviderRecord,
): SourceItem {
  return {
    id: `${provider.id}:${record.nativeId}`,
    providerId: provider.id,
    nativeId: record.nativeId,
    title: record.name,
    canonicalUrl: record.canonicalUrl,
    contentKind: contentKindFor(record.kind),
    aliases: [...record.aliases],
    sourceSection: record.kind,
    sourceTags: [],
    links: linksFor(record),
    provenance: {
      upstreamRevision: record.provenance.revision,
      retrievedAt: provider.source.observedAt,
      contentMode: provider.license.scope,
    },
  };
}

function freezeProvider(provider: LibraryProvider): LibraryProvider {
  Object.freeze(provider.upstream);
  Object.freeze(provider.license);
  return Object.freeze(provider);
}

function freezeItem(item: SourceItem): SourceItem {
  Object.freeze(item.aliases);
  Object.freeze(item.sourceTags);
  for (const link of item.links) Object.freeze(link);
  Object.freeze(item.links);
  Object.freeze(item.provenance);
  return Object.freeze(item);
}

function createSourceBrowserSnapshot(): SourceBrowserSnapshot {
  const parsed = sourceBrowserSnapshotSchema.parse({
    providers: providerSnapshot.providers.map(toLibraryProvider),
    items: providerSnapshot.providers.flatMap((provider) =>
      provider.records.map((record) => toSourceItem(provider, record)),
    ),
  });
  const providers = parsed.providers.map(freezeProvider);
  const items = parsed.items.map(freezeItem);
  return Object.freeze({
    providers: Object.freeze(providers),
    items: Object.freeze(items),
  });
}

const bundledSourceBrowserSnapshot = createSourceBrowserSnapshot();
const sourceItemsById = new Map(
  bundledSourceBrowserSnapshot.items.map((item) => [item.id, item]),
);

/** Returns the validated, runtime-frozen build-time snapshot. */
export function getSourceBrowserSnapshot(): SourceBrowserSnapshot {
  return bundledSourceBrowserSnapshot;
}

/** Searches only the bundled offline index and returns source-native items. */
export function searchSourceItems(
  options: SourceItemSearchOptions = {},
): SourceItemSearchResult {
  const parsed = sourceItemSearchInputSchema.parse(options);
  const limit = parsed.limit ?? 50;
  const result = searchProviderIndex(providerIndex, {
    query: parsed.query,
    providerId: parsed.providerId,
    limit: providerIndex.documents.length,
  });
  const items = result.results
    .map(({ record }) =>
      sourceItemsById.get(
        `${record.provenance.providerId}:${record.nativeId}`,
      ),
    )
    .filter((item): item is SourceItem => Boolean(item))
    .filter(
      (item) =>
        !parsed.contentKind || item.contentKind === parsed.contentKind,
    )
    .slice(0, limit);

  return Object.freeze({
    mode: result.mode,
    queryTerms: Object.freeze([...result.queryTerms]),
    items: Object.freeze(items),
  });
}
