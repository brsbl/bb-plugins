import type { LibraryProvider, SourceBrowserSnapshot, SourceItem } from "./source-item.js";

export interface SourceBrowserFilters {
  query: string;
  providerId: string | "all";
  contentKind: SourceItem["contentKind"] | "all";
}

export interface SourceItemGroup {
  /** Presentation-only grouping key. Individual source items are never merged. */
  title: string;
  items: readonly SourceItem[];
}

const collator = new Intl.Collator(undefined, { sensitivity: "base" });

function normalized(value: string) {
  return value.trim().toLocaleLowerCase();
}

function searchableText(item: SourceItem) {
  return [
    item.title,
    item.nativeId,
    ...item.aliases,
    item.sourceSection ?? "",
    ...item.sourceTags,
    item.provenance.contentMode === "metadata-only" ? "" : item.excerpt ?? "",
  ]
    .join(" ")
    .toLocaleLowerCase();
}

/** Deterministic, offline filtering over the latest provider snapshot. */
export function filterSourceItems(
  items: readonly SourceItem[],
  filters: SourceBrowserFilters,
) {
  const queryTerms = normalized(filters.query).split(/\s+/).filter(Boolean);

  return items
    .slice()
    .filter((item) =>
      filters.providerId === "all" ? true : item.providerId === filters.providerId,
    )
    .filter((item) =>
      filters.contentKind === "all" ? true : item.contentKind === filters.contentKind,
    )
    .filter((item) => {
      const text = searchableText(item);
      return queryTerms.every((term) => text.includes(term));
    })
    .sort((left, right) => {
      const titleComparison = collator.compare(left.title, right.title);
      if (titleComparison !== 0) return titleComparison;
      return collator.compare(left.id, right.id);
    });
}

/**
 * Exact-title groups only improve scanning. The group retains every upstream
 * item and does not imply equivalence, precedence, or a synthetic record.
 */
export function groupSourceItemsByExactTitle(
  items: readonly SourceItem[],
): SourceItemGroup[] {
  const byTitle = new Map<string, SourceItem[]>();

  for (const item of items) {
    const key = normalized(item.title);
    const existing = byTitle.get(key) ?? [];
    existing.push(item);
    byTitle.set(key, existing);
  }

  return [...byTitle.values()]
    .map((group) => ({
      title: group[0]?.title ?? "",
      items: group.slice().sort((left, right) => collator.compare(left.id, right.id)),
    }))
    .sort((left, right) => collator.compare(left.title, right.title));
}

export function providerById(providers: readonly LibraryProvider[]) {
  return new Map(providers.map((provider) => [provider.id, provider]));
}

export function sourceItemById(
  snapshot: SourceBrowserSnapshot,
  id: string | null,
) {
  return id ? snapshot.items.find((item) => item.id === id) : undefined;
}

export function mayDisplayExcerpt(item: SourceItem) {
  return Boolean(item.excerpt && item.provenance.contentMode !== "metadata-only");
}

export function freshnessLabel(item: SourceItem) {
  return `Retrieved ${item.provenance.retrievedAt}`;
}
