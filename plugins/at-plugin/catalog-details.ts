import type { BbPluginApi } from "@get-bb/plugin-sdk";
import type { CommunityCatalogRecord } from "./community-catalog";
import { normalizeUntrustedText } from "./mention-context";
import { boundedSdkRead } from "./sdk-read";

export type CatalogDetails = CommunityCatalogRecord & {
  overview?: string;
  screenshots?: string[];
  repositoryUrl?: string | null;
};

export function catalogEntries(
  response: CatalogDetails[] | { results: CatalogDetails[] },
): CatalogDetails[] {
  return Array.isArray(response) ? response : response.results;
}

function key(entry: CatalogDetails): string {
  return JSON.stringify([entry.marketplace, entry.entryId, entry.pluginId]);
}

export function matchesDetails(entry: CatalogDetails, query: string): boolean {
  const needle = normalizeUntrustedText(query).toLowerCase();
  return [entry.displayName, entry.pluginId, entry.entryId, entry.description,
    entry.category, entry.marketplaceDisplayName, entry.overview ?? ""]
    .some((field) => normalizeUntrustedText(field ?? "").toLowerCase().includes(needle));
}

export function readCatalogDetails(
  bb: BbPluginApi,
  query: string,
  signal: AbortSignal,
) {
  return catalogDetails(query, async (value) =>
    catalogEntries(await bb.sdk.plugins.catalog.search({ query: value, signal })));
}

export function createMentionCatalogReader(bb: BbPluginApi) {
  const cache = new Map<string, { request: Promise<CatalogDetails[]>; expiresAt: number }>();
  function search(query: string): Promise<CatalogDetails[]> {
    const cached = cache.get(query);
    if (cached && cached.expiresAt > Date.now()) {
      cache.delete(query);
      cache.set(query, cached);
      return cached.request;
    }
    cache.delete(query);
    const request = boundedSdkRead(async (signal) =>
      catalogEntries(await bb.sdk.plugins.catalog.search({ query, signal })), undefined, 10_000);
    const entry = { request, expiresAt: Infinity };
    cache.set(query, entry);
    while (cache.size > 64) cache.delete(cache.keys().next().value!);
    void request.then(
      () => { entry.expiresAt = Date.now() + 30_000; },
      () => { if (cache.get(query) === entry) cache.delete(query); },
    );
    return request;
  }
  return (query: string) => catalogDetails(query, search);
}

async function catalogDetails(
  query: string,
  search: (query: string) => Promise<CatalogDetails[]>,
): Promise<{ entries: CatalogDetails[]; matches: CatalogDetails[] }> {
  const [entries, hostMatches] = await Promise.all([
    search(""),
    query ? search(query) : Promise.resolve(null),
  ]);
  if (hostMatches === null) return { entries, matches: entries };
  const byIdentity = new Map(entries.map((entry) => [key(entry), entry]));
  const seen = new Set(hostMatches.map(key));
  return {
    entries,
    matches: [
      ...hostMatches.map((entry) => byIdentity.get(key(entry)) ?? entry),
      ...entries.filter((entry) => !seen.has(key(entry)) && matchesDetails(entry, query)),
    ],
  };
}
