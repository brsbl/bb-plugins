import { normalizeProviderSearchText } from "./build.js";
import type {
  ProviderDocument,
  ProviderIndex,
} from "./schema.js";

export interface ProviderSearchOptions {
  query?: string;
  providerId?: string;
  kind?: string;
  limit?: number;
}

type SearchMode = "browse" | "exact" | "prefix" | "expanded";

const weights = {
  name: 1_000,
  aliases: 700,
  nativeId: 600,
  kind: 120,
  summary: 80,
} as const;

function scoreField(
  queryTerms: readonly string[],
  terms: readonly string[],
  weight: number,
) {
  let score = 0;
  let exact = 0;
  let prefix = 0;
  for (const query of queryTerms) {
    if (terms.includes(query)) {
      score += weight;
      exact += 1;
      continue;
    }
    if (terms.some((term) => term.startsWith(query))) {
      score += Math.round(weight * 0.6);
      prefix += 1;
    }
  }
  return { score, exact, prefix };
}

function scoreDocument(
  document: ProviderDocument,
  queryTerms: readonly string[],
) {
  let score = 0;
  let exact = 0;
  let prefix = 0;
  for (const field of Object.keys(weights) as (keyof typeof weights)[]) {
    const match = scoreField(
      queryTerms,
      document.search[field],
      weights[field],
    );
    score += match.score;
    exact += match.exact;
    prefix += match.prefix;
  }
  return { score, exact, prefix };
}

export function searchProviderIndex(
  index: ProviderIndex,
  {
    query = "",
    providerId,
    kind,
    limit = 50,
  }: ProviderSearchOptions = {},
) {
  const queryTerms = normalizeProviderSearchText(query);
  const normalizedKind = kind?.toLocaleLowerCase();
  const candidates = index.documents
    .filter(
      (document) =>
        !providerId || document.provenance.providerId === providerId,
    )
    .filter(
      (document) =>
        !normalizedKind ||
        document.kind.toLocaleLowerCase() === normalizedKind,
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
            left.provenance.providerId.localeCompare(
              right.provenance.providerId,
            ),
        )
        .slice(0, limit)
        .map((record) => ({ record, score: 0 })),
    };
  }

  const scored = candidates
    .map((record) => ({
      record,
      ...scoreDocument(record, queryTerms),
    }))
    .filter(({ exact, prefix }) => exact + prefix > 0)
    .sort(
      (left, right) =>
        right.score - left.score ||
        left.record.name.localeCompare(right.record.name) ||
        left.record.provenance.providerId.localeCompare(
          right.record.provenance.providerId,
        ),
    );
  const complete = scored.filter(
    ({ exact, prefix }) => exact + prefix >= queryTerms.length,
  );
  const results = complete.length ? complete : scored;
  const mode: SearchMode = complete.length
    ? complete.some(({ prefix }) => prefix > 0)
      ? "prefix"
      : "exact"
    : "expanded";

  return {
    mode,
    queryTerms,
    results: results
      .slice(0, limit)
      .map(({ record, score }) => ({ record, score })),
  };
}

export function findProviderRecord(
  index: ProviderIndex,
  providerId: string,
  nativeId: string,
) {
  return (
    index.documents.find(
      (document) =>
        document.provenance.providerId === providerId &&
        document.nativeId === nativeId,
    ) ?? null
  );
}
