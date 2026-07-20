import { normalizeProviderSearchText } from "./build.js";
import { providerSnapshot } from "./generated-v2.js";
import type {
  AtlasEntryDocument,
  ProviderRecord,
  ProviderIndex,
} from "./schema.js";

export interface ProviderSearchOptions {
  query?: string;
  providerId?: string;
  limit?: number;
}

type SearchMode = "browse" | "exact" | "prefix" | "expanded";

const weights = {
  name: 1_000,
  aliases: 700,
  nativeIds: 600,
  kinds: 120,
  summaries: 80,
  sections: 60,
  relationships: 40,
} as const;

const providerRecordById = new Map(
  providerSnapshot.providers.flatMap((provider) =>
    provider.records.map(
      (record) =>
        [`${provider.id}:${record.nativeId}`, record] as const,
    ),
  ),
);

function searchFieldsForRecords(records: readonly ProviderRecord[]) {
  return {
    name: normalizeProviderSearchText(
      records.map((record) => record.name).join(" "),
    ),
    aliases: normalizeProviderSearchText(
      records.flatMap((record) => record.aliases).join(" "),
    ),
    summaries: normalizeProviderSearchText(
      records.map((record) => record.summary?.text ?? "").join(" "),
    ),
    kinds: normalizeProviderSearchText(
      records.map((record) => record.kind).join(" "),
    ),
    nativeIds: normalizeProviderSearchText(
      records.map((record) => record.nativeId).join(" "),
    ),
    sections: normalizeProviderSearchText(
      records
        .flatMap((record) =>
          record.sections.flatMap(({ title, content }) => [
            title,
            content ?? "",
          ]),
        )
        .join(" "),
    ),
    relationships: normalizeProviderSearchText(
      records
        .flatMap((record) =>
          record.relationships.flatMap(({ label, targetTitle }) => [
            label,
            targetTitle,
          ]),
        )
        .join(" "),
    ),
  };
}

function documentForProvider(
  document: AtlasEntryDocument,
  providerId: string,
): AtlasEntryDocument {
  const records = document.sourceRecordIds
    .filter((id) => id.startsWith(`${providerId}:`))
    .map((id) => providerRecordById.get(id))
    .filter((record): record is ProviderRecord => Boolean(record));
  return {
    ...document,
    search: searchFieldsForRecords(records),
  };
}

function scoreDocument(
  document: AtlasEntryDocument,
  queryTerms: readonly string[],
) {
  let score = 0;
  let exact = 0;
  let prefix = 0;
  for (const query of queryTerms) {
    let termHasExactMatch = false;
    let termHasPrefixMatch = false;
    for (const field of Object.keys(weights) as (keyof typeof weights)[]) {
      const terms = document.search[field];
      if (terms.includes(query)) {
        score += weights[field];
        termHasExactMatch = true;
      } else if (terms.some((term) => term.startsWith(query))) {
        score += Math.round(weights[field] * 0.6);
        termHasPrefixMatch = true;
      }
    }
    if (termHasExactMatch) exact += 1;
    else if (termHasPrefixMatch) prefix += 1;
  }
  const queryPhrase = queryTerms.join(" ");
  const namePhrase = document.search.name.join(" ");
  if (queryPhrase && namePhrase === queryPhrase) score += 10_000;
  else if (queryPhrase && namePhrase.startsWith(queryPhrase)) score += 5_000;
  return { score, exact, prefix };
}

export function searchProviderIndex(
  index: ProviderIndex,
  {
    query = "",
    providerId,
    limit = 50,
  }: ProviderSearchOptions = {},
) {
  const queryTerms = normalizeProviderSearchText(query);
  const candidates = index.documents
    .filter(
      (document) =>
        !providerId ||
        document.sourceRecordIds.some((id) => id.startsWith(`${providerId}:`)),
    );

  if (!queryTerms.length) {
    return {
      mode: "browse" as SearchMode,
      queryTerms,
      results: candidates
        .slice()
        .sort(
          (left, right) =>
            left.name.localeCompare(right.name) ||
            left.key.localeCompare(right.key),
        )
        .slice(0, limit)
        .map((entry) => ({ entry, score: 0 })),
    };
  }

  const scored = candidates
    .map((entry) => ({
      entry,
      ...scoreDocument(
        providerId ? documentForProvider(entry, providerId) : entry,
        queryTerms,
      ),
    }))
    .filter(({ exact, prefix }) => exact + prefix === queryTerms.length)
    .sort(
      (left, right) =>
        right.score - left.score ||
        left.entry.name.localeCompare(right.entry.name) ||
        left.entry.key.localeCompare(right.entry.key),
    );
  const mode: SearchMode = scored.some(({ prefix }) => prefix > 0)
    ? "prefix"
    : "exact";

  return {
    mode,
    queryTerms,
    results: scored
      .slice(0, limit)
      .map(({ entry, score }) => ({ entry, score })),
  };
}

export function findAtlasEntry(
  index: ProviderIndex,
  sourceRecordId: string,
) {
  return (
    index.documents.find((entry) =>
      entry.sourceRecordIds.includes(sourceRecordId as `${string}:${string}`),
    ) ?? null
  );
}
