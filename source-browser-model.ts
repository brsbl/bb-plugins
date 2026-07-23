import type { AtlasEntry } from "./providers/schema.js";
import type {
  LibraryProvider,
  SourceBrowserSnapshot,
  SourceRecord,
} from "./providers/source-browser-v2.js";
import { hasGalleryPreview } from "./live-component-previews.js";

export interface SourceBrowserFilters {
  query: string;
  providerId: string | "all";
}

const collator = new Intl.Collator(undefined, { sensitivity: "base" });

export const galleryProviderIds = ["shadcn-ui", "assistant-ui"] as const;

function normalized(value: string) {
  return value.trim().toLocaleLowerCase();
}

function relevance(entry: AtlasEntry, query: string) {
  const normalizedQuery = normalized(query);
  if (!normalizedQuery) return 0;
  if (normalized(entry.name) === normalizedQuery) return 0;
  if (entry.aliases.some((alias) => normalized(alias) === normalizedQuery)) return 1;
  if (normalized(entry.name).startsWith(normalizedQuery)) return 2;
  return 3;
}

export function sourceRecordById(records: readonly SourceRecord[]) {
  return new Map(records.map((record) => [record.id, record]));
}

export function recordsForEntry(
  entry: AtlasEntry,
  records: ReadonlyMap<string, SourceRecord>,
) {
  return entry.sourceRecordIds
    .map((id) => records.get(id))
    .filter((record): record is SourceRecord => Boolean(record));
}

export function galleryImplementationRecords(
  entry: AtlasEntry,
  records: ReadonlyMap<string, SourceRecord>,
  providerId: SourceBrowserFilters["providerId"] = "all",
) {
  return recordsForEntry(entry, records).filter(
    (record) =>
      hasGalleryPreview(record.id) &&
      (providerId === "all" ||
        record.provenance.providerId === providerId),
  );
}

export function additiveGuidanceRecords(
  entry: AtlasEntry,
  records: ReadonlyMap<string, SourceRecord>,
) {
  return recordsForEntry(entry, records).filter(
    (record) =>
      record.provenance.providerId === "aria-apg" &&
      record.sections.some(({ content }) => content !== null),
  );
}

function searchableText(
  entry: AtlasEntry,
  records: ReadonlyMap<string, SourceRecord>,
  providerId: SourceBrowserFilters["providerId"],
) {
  const sourceRecords = [
    ...galleryImplementationRecords(entry, records, providerId),
    ...(providerId === "all" ? additiveGuidanceRecords(entry, records) : []),
  ];
  return [
    ...(providerId === "all"
      ? [entry.name, ...entry.aliases, entry.summary?.text ?? "", entry.kind]
      : []),
    ...sourceRecords.flatMap((record) => [
      record.name,
      ...record.aliases,
      record.nativeId,
      record.summary?.text ?? "",
      record.kind,
      ...record.sections.flatMap(({ title, content }) => [title, content ?? ""]),
      ...record.relationships.flatMap(({ label, targetTitle }) => [label, targetTitle]),
    ]),
  ]
    .join(" ")
    .toLocaleLowerCase();
}

/** Deterministic, offline filtering over the latest generated Atlas entries. */
export function filterAtlasEntries(
  snapshot: SourceBrowserSnapshot,
  filters: SourceBrowserFilters,
) {
  const queryTerms = normalized(filters.query).split(/\s+/).filter(Boolean);
  const records = sourceRecordById(snapshot.records);

  return snapshot.entries
    .slice()
    .filter(
      (entry) =>
        galleryImplementationRecords(entry, records, filters.providerId).length >
        0,
    )
    .filter((entry) => {
      const text = searchableText(entry, records, filters.providerId);
      return queryTerms.every((term) => text.includes(term));
    })
    .sort(
      (left, right) =>
        relevance(left, filters.query) - relevance(right, filters.query) ||
        collator.compare(left.name, right.name) ||
        collator.compare(left.sourceRecordIds[0] ?? "", right.sourceRecordIds[0] ?? ""),
    );
}

export function providerById(providers: readonly LibraryProvider[]) {
  return new Map(providers.map((provider) => [provider.id, provider]));
}

export function atlasEntryForRecordId(
  snapshot: SourceBrowserSnapshot,
  sourceRecordId: string | null,
) {
  return sourceRecordId
    ? snapshot.entries.find((entry) => entry.sourceRecordIds.includes(sourceRecordId as `${string}:${string}`))
    : undefined;
}

export function primarySourceRecordId(entry: AtlasEntry) {
  return entry.sourceRecordIds[0] ?? null;
}

export function preferredVisibleSourceRecordId(
  visibleRecords: readonly SourceRecord[],
  currentSourceRecordId: string | null,
) {
  return (
    visibleRecords.find(({ id }) => id === currentSourceRecordId)?.id ??
    visibleRecords[0]?.id ??
    null
  );
}
