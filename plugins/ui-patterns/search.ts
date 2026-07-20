import atlasRegistry from "./generated/atlas-registry.v2.json";
import type { PatternEntry } from "./data.js";

const fieldWeights = {
  name: 1_000,
  altLabels: 700,
  hiddenLabels: 650,
  subject: 500,
  description: 130,
  details: 90,
} as const;

const commonFramingWords = new Set([
  "a", "an", "and", "are", "called", "can", "component", "create",
  "design", "do", "find", "for", "i", "in", "interface", "is", "it",
  "like", "looking", "make", "me", "need", "of", "on", "or", "pattern",
  "please", "show", "something", "that", "the", "this", "to", "ui", "use",
  "want", "we", "what", "with",
]);

type SearchFieldName = keyof typeof fieldWeights;
type MatchStrategy = "exact" | "prefix" | "fuzzy";

interface SearchFilters {
  query?: string;
  type?: "all" | PatternEntry["type"];
  category?: string;
}

interface EntryMatch {
  score: number;
  matchedTerms: string[];
  unmatchedTerms: string[];
  fields: SearchFieldName[];
  strategies: MatchStrategy[];
  strongMatches: number;
}

function singularize(token: string) {
  if (token.endsWith("ies") && token.length > 4) return `${token.slice(0, -3)}y`;
  if (/(xes|ches|shes)$/.test(token) && token.length > 4) return token.slice(0, -2);
  if (token.endsWith("ses") && token.length > 4) return token.slice(0, -2);
  if (token.endsWith("s") && token.length > 3 && !/(ss|us|is)$/.test(token)) {
    return token.slice(0, -1);
  }
  return token;
}

function normalizeText(value = "") {
  return value
    .toLocaleLowerCase()
    .replace(/combo[\s-]*box/g, "combobox")
    .replace(/drop[\s-]*down/g, "dropdown")
    .replace(/\bai\b/g, "ai")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map(singularize)
    .join(" ");
}

function parseQuery(query: string) {
  const normalizedQuery = normalizeText(query);
  const allTokens = normalizedQuery ? normalizedQuery.split(" ") : [];
  if (allTokens.length < 2) {
    return { normalizedQuery, queryTokens: allTokens, ignoredTokens: [] };
  }
  const queryTokens = allTokens.filter((token) => !commonFramingWords.has(token));
  if (!queryTokens.length) {
    return { normalizedQuery, queryTokens: allTokens, ignoredTokens: [] };
  }
  return {
    normalizedQuery,
    queryTokens,
    ignoredTokens: allTokens.filter((token) => commonFramingWords.has(token)),
  };
}

function editDistance(left: string, right: string) {
  if (left === right) return 0;
  if (!left.length) return right.length;
  if (!right.length) return left.length;
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  const current = Array<number>(right.length + 1).fill(0);
  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    current[0] = leftIndex;
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const substitution = left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1;
      current[rightIndex] = Math.min(
        current[rightIndex - 1] + 1,
        previous[rightIndex] + 1,
        previous[rightIndex - 1] + substitution,
      );
    }
    previous.splice(0, previous.length, ...current);
  }
  return previous[right.length];
}

function tokenSimilarity(
  queryToken: string,
  targetToken: string,
  allowFuzzy: boolean,
): { strength: number; kind: MatchStrategy } | null {
  if (queryToken === targetToken) return { strength: 1, kind: "exact" };
  if (queryToken.length >= 3 && targetToken.startsWith(queryToken)) {
    return { strength: 0.82, kind: "prefix" };
  }
  if (!allowFuzzy || queryToken.length < 4 || targetToken.length < 4) return null;
  const distance = editDistance(queryToken, targetToken);
  const threshold = queryToken.length >= 8 ? 2 : 1;
  if (
    distance <= threshold &&
    distance / Math.max(queryToken.length, targetToken.length) <= 0.24
  ) {
    return { strength: distance === 1 ? 0.72 : 0.6, kind: "fuzzy" };
  }
  return null;
}

function searchableFields(entry: PatternEntry) {
  return [
    { name: "name", value: entry.name, allowFuzzy: true },
    { name: "altLabels", value: entry.altLabels.join(" "), allowFuzzy: true },
    { name: "hiddenLabels", value: entry.hiddenLabels.join(" "), allowFuzzy: true },
    { name: "subject", value: entry.subject ?? "", allowFuzzy: true },
    { name: "description", value: entry.description, allowFuzzy: false },
    { name: "details", value: entry.details, allowFuzzy: false },
  ].map((field) => ({
    ...field,
    name: field.name as SearchFieldName,
    weight: fieldWeights[field.name as SearchFieldName],
    normalized: normalizeText(field.value),
    tokens: normalizeText(field.value).split(" ").filter(Boolean),
  }));
}

function matchEntry(
  entry: PatternEntry,
  queryTokens: string[],
  normalizedQuery: string,
): EntryMatch {
  const fields = searchableFields(entry);
  const matchedTerms: string[] = [];
  const unmatchedTerms: string[] = [];
  const matchedFields = new Set<SearchFieldName>();
  const strategies = new Set<MatchStrategy>();
  let score = 0;
  let strongMatches = 0;

  for (const queryToken of queryTokens) {
    let best:
      | { strength: number; kind: MatchStrategy; field: SearchFieldName; weight: number }
      | null = null;
    for (const field of fields) {
      for (const targetToken of field.tokens) {
        const similarity = tokenSimilarity(queryToken, targetToken, field.allowFuzzy);
        if (!similarity) continue;
        const candidate = {
          ...similarity,
          field: field.name,
          weight: field.weight,
        };
        if (!best || candidate.weight * candidate.strength > best.weight * best.strength) {
          best = candidate;
        }
      }
    }
    if (!best) {
      unmatchedTerms.push(queryToken);
      continue;
    }
    matchedTerms.push(queryToken);
    matchedFields.add(best.field);
    strategies.add(best.kind);
    if (["name", "altLabels", "hiddenLabels", "subject"].includes(best.field)) {
      strongMatches += 1;
    }
    score += best.weight * best.strength;
  }

  const normalizedName = normalizeText(entry.name);
  const normalizedAltLabels = entry.altLabels.map(normalizeText);
  const normalizedHiddenLabels = entry.hiddenLabels.map(normalizeText);
  if (normalizedName === normalizedQuery) score += fieldWeights.name * 2;
  if (normalizedAltLabels.includes(normalizedQuery)) score += fieldWeights.altLabels * 2;
  if (normalizedHiddenLabels.includes(normalizedQuery)) score += fieldWeights.hiddenLabels * 2;
  if (normalizeText(entry.subject) === normalizedQuery) score += fieldWeights.subject * 2;
  score += queryTokens.length ? (matchedTerms.length / queryTokens.length) * 400 : 0;

  return {
    score,
    matchedTerms,
    unmatchedTerms,
    fields: [...matchedFields],
    strategies: [...strategies],
    strongMatches,
  };
}

export function searchEntries(
  entries: PatternEntry[],
  { query = "", type = "all", category = "all" }: SearchFilters = {},
) {
  const { normalizedQuery, queryTokens, ignoredTokens } = parseQuery(query);
  const ambiguityRoutes: Record<string, string[]> = atlasRegistry.search.ambiguityRoutes;
  const routedIds = ambiguityRoutes[normalizedQuery] ?? [];
  const routeRanks = new Map(
    routedIds.map((id, index) => [id, routedIds.length - index]),
  );
  const candidates = entries
    .filter((entry) => type === "all" || entry.type === type)
    .filter((entry) => category === "all" || entry.category === category);

  if (!normalizedQuery) {
    const hits = candidates
      .slice()
      .sort((left, right) => left.name.localeCompare(right.name))
      .map((entry) => ({
        entry,
        match: {
          score: 0,
          matchedTerms: [],
          unmatchedTerms: [],
          fields: [],
          strategies: [],
          strongMatches: 0,
        } satisfies EntryMatch,
      }));
    return {
      entries: hits.map(({ entry }) => entry),
      hits,
      mode: "browse",
      normalizedQuery,
      queryTokens,
      ignoredTokens,
      routedIds,
    };
  }

  const scored = candidates.map((entry) => ({
    entry,
    match: matchEntry(entry, queryTokens, normalizedQuery),
  }));
  const strict = scored.filter(
    ({ entry, match }) =>
      routeRanks.has(entry.id) || match.matchedTerms.length === queryTokens.length,
  );
  let mode = routedIds.length
    ? "routed"
    : strict.some(({ match }) =>
        match.strategies.some((strategy) => strategy !== "exact"),
      )
      ? "tolerant"
      : "exact";
  let selected = strict;
  if (!selected.length) {
    mode = "expanded";
    const requiredMatches = queryTokens.length <= 2 ? 1 : Math.ceil(queryTokens.length / 2);
    selected = scored.filter(
      ({ match }) =>
        match.matchedTerms.length >= requiredMatches &&
        (queryTokens.length === 1 ||
          match.strongMatches > 0 ||
          match.matchedTerms.length >= 2),
    );
  }

  const hits = selected
    .map(({ entry, match }) => ({
      entry,
      match: {
        ...match,
        score: match.score + (routeRanks.get(entry.id) ?? 0) * 100_000,
      },
    }))
    .filter(({ entry, match }) => routeRanks.has(entry.id) || match.score > 0)
    .sort(
      (left, right) =>
        right.match.score - left.match.score ||
        left.entry.name.localeCompare(right.entry.name),
    );

  return {
    entries: hits.map(({ entry }) => entry),
    hits,
    mode,
    normalizedQuery,
    queryTokens,
    ignoredTokens,
    routedIds,
  };
}
