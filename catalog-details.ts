import type { BbPluginApi } from "@get-bb/plugin-sdk";
import type { CommunityCatalogRecord } from "./community-catalog";
import { normalizeUntrustedText } from "./mention-context";

// Additive host fields: older supported BB versions may not provide these.
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

export async function readCatalogDetails(
  bb: BbPluginApi,
  query: string,
  signal: AbortSignal,
): Promise<{ entries: CatalogDetails[]; matches: CatalogDetails[] }> {
  // Keep host-only matches (notably tags) while adding overview-only matches.
  // Both calls run inside the same bounded read, not one request per plugin.
  const [all, searched] = await Promise.all([
    bb.sdk.plugins.catalog.search({ query: "", signal }),
    query ? bb.sdk.plugins.catalog.search({ query, signal }) : Promise.resolve(null),
  ]);
  const entries = catalogEntries(all);
  if (searched === null) return { entries, matches: entries };
  const hostMatches = catalogEntries(searched);
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
