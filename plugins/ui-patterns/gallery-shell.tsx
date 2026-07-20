import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import {
  atlasEntryForRecordId,
  filterAtlasEntries,
  galleryImplementationRecords,
  galleryProviderIds,
  providerById,
  recordsForEntry,
  sourceRecordById,
  type SourceBrowserFilters,
} from "./source-browser-model.js";
import type { AtlasEntry } from "./providers/schema.js";
import type {
  LibraryProvider,
  SourceBrowserSnapshot,
  SourceRecord,
} from "./providers/source-browser-v2.js";
import { Button } from "./components/ui/button.js";
import { Icon } from "./components/ui/icon.js";
import { Input } from "./components/ui/input.js";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./components/ui/select.js";
import {
  galleryPreviewsForRecords,
  LiveComponentPreview,
} from "./live-component-previews.js";

export interface GalleryNavigation {
  entryId: string | null;
  /** A legacy Atlas id translated to a neutral source query. */
  legacyQuery?: string | null;
  openEntry: (id: string) => void;
  replaceEntry?: (id: string) => void;
  closeInspector: () => void;
}

function externalLinkProps(url: string) {
  return { href: url, target: "_blank", rel: "noreferrer" };
}

function plural(count: number, singular: string, pluralForm = `${singular}s`) {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

function providerName(
  providerId: string,
  providers: ReadonlyMap<string, LibraryProvider>,
) {
  return providers.get(providerId)?.name ?? providerId;
}

function ExampleLinks({
  record,
}: {
  record: SourceRecord;
}) {
  const examples = record.examples.filter(
    ({ url }) => url !== record.canonicalUrl,
  );
  if (!examples.length) return null;

  return (
    <section className="grid gap-2" aria-label={`${record.name} examples`}>
      <h4 className="text-xs font-medium text-muted-foreground">Examples</h4>
      <ul className="grid gap-1.5">
        {examples.map((example) => (
          <li key={`${example.nativeId}:${example.url}`}>
            <a
              className="group inline-flex cursor-pointer items-start gap-1.5 text-sm text-foreground underline-offset-4 hover:underline"
              {...externalLinkProps(example.url)}
            >
              <span>{example.title}</span>
              <Icon
                name="ArrowUpRight"
                className="mt-0.5 size-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground"
                aria-hidden="true"
              />
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ImplementationDetail({
  record,
  provider,
}: {
  record: SourceRecord;
  provider: LibraryProvider | undefined;
}) {
  return (
    <section
      className="grid gap-4"
      aria-label={`${provider?.name ?? record.provenance.providerId} source detail`}
    >
      <div className="grid gap-1">
        <h3 className="text-sm font-medium text-foreground">
          About this {provider?.name ?? record.provenance.providerId} implementation
        </h3>
        {record.summary ? (
          <p className="text-sm leading-6 text-muted-foreground">
            {record.summary.text}
          </p>
        ) : null}
      </div>
      <ExampleLinks record={record} />
    </section>
  );
}

function AccessibilityDetail({
  record,
}: {
  record: SourceRecord;
}) {
  const sections = record.sections.filter(
    (section): section is typeof section & { content: string } =>
      section.content !== null,
  );
  if (!sections.length && !record.examples.length) return null;

  return (
    <section
      className="grid gap-4 border-t border-border pt-5"
      aria-label="Additive WAI-ARIA APG guidance"
    >
      <div className="grid gap-1">
        <h3 className="text-sm font-medium text-foreground">
          Accessibility guidance
        </h3>
        <p className="text-xs text-muted-foreground">
          Paired guidance from the WAI-ARIA Authoring Practices Guide.
        </p>
      </div>
      <div className="grid gap-5">
        {sections.map((section) => (
          <section key={section.nativeId} className="grid gap-2">
            <h4 className="text-xs font-medium text-muted-foreground">
              {section.title}
            </h4>
            <p className="whitespace-pre-line text-sm leading-6 text-foreground">
              {section.content}
            </p>
          </section>
        ))}
      </div>
      <ExampleLinks record={record} />
    </section>
  );
}

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-40 place-items-center rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}

function GalleryCard({
  entry,
  records,
  providers,
  onOpen,
}: {
  entry: AtlasEntry;
  records: readonly SourceRecord[];
  providers: ReadonlyMap<string, LibraryProvider>;
  onOpen: (id: string) => void;
}) {
  const [implementation] = galleryPreviewsForRecords(records);
  if (!implementation) return null;

  const sourceName = providerName(
    implementation.record.provenance.providerId,
    providers,
  );
  const headingId = `gallery-card-${implementation.record.id.replace(
    /[^a-zA-Z0-9_-]/g,
    "-",
  )}`;

  return (
    <article
      className="min-w-0 overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-sm"
      data-gallery-card=""
      data-source-item-id={implementation.record.id}
      aria-labelledby={headingId}
    >
      <button
        type="button"
        className="group flex w-full cursor-pointer items-start justify-between gap-3 px-4 py-3 text-left outline-none transition-colors hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
        onClick={() => onOpen(implementation.record.id)}
        aria-label={`Open ${entry.name} details`}
      >
        <span className="min-w-0">
          <span
            id={headingId}
            className="block truncate text-sm font-semibold text-foreground"
          >
            {entry.name}
          </span>
          <span className="mt-0.5 block truncate text-xs text-muted-foreground">
            {sourceName}
          </span>
        </span>
        <Icon
          name="ChevronRight"
          className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
          aria-hidden="true"
        />
      </button>
      <LiveComponentPreview
        definition={implementation.preview}
        size="card"
      />
    </article>
  );
}

function ImplementationSwitcher({
  previews,
  providers,
  selectedSourceRecordId,
  onSelect,
}: {
  previews: ReturnType<typeof galleryPreviewsForRecords>;
  providers: ReadonlyMap<string, LibraryProvider>;
  selectedSourceRecordId: string;
  onSelect: (id: string) => void;
}) {
  if (previews.length < 2) return null;

  return (
    <div
      className="flex w-fit max-w-full flex-wrap gap-1 rounded-lg bg-muted p-1"
      role="group"
      aria-label="Implementation"
    >
      {previews.map(({ record, preview }) => {
        const selected = record.id === selectedSourceRecordId;
        return (
          <button
            key={record.id}
            type="button"
            aria-pressed={selected}
            className={`cursor-pointer rounded-md px-3 py-1.5 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring ${
              selected
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => onSelect(record.id)}
          >
            {providerName(record.provenance.providerId, providers)}
            <span className="sr-only"> — {preview.runtimeLabel}</span>
          </button>
        );
      })}
    </div>
  );
}

function EntryViewer({
  entry,
  records,
  providers,
  preferredSourceRecordId,
  onSelectSource,
  onBack,
}: {
  entry: AtlasEntry;
  records: readonly SourceRecord[];
  providers: ReadonlyMap<string, LibraryProvider>;
  preferredSourceRecordId?: string | null;
  onSelectSource?: (id: string) => void;
  onBack: () => void;
}) {
  const previews = galleryPreviewsForRecords(records);
  const [selectedPreviewId, setSelectedPreviewId] = useState<string | null>(null);
  const selectedPreview =
    previews.find(({ record }) => record.id === selectedPreviewId) ??
    previews.find(({ record }) => record.id === preferredSourceRecordId) ??
    previews.find(({ record }) => record.provenance.providerId === "shadcn-ui") ??
    previews[0];
  const guidanceRecords = records.filter(
    (record) =>
      record.provenance.providerId === "aria-apg" &&
      record.sections.some(({ content }) => content !== null),
  );

  if (!selectedPreview) {
    return (
      <div className="grid gap-4 p-4">
        <Button
          className="w-fit"
          type="button"
          variant="ghost"
          size="sm"
          onClick={onBack}
        >
          <Icon name="ChevronLeft" className="size-4" aria-hidden="true" />
          Back to UI Patterns
        </Button>
        <EmptyState>
          This retained source record does not have a visual gallery
          implementation. Browse the shadcn/ui and assistant-ui cards instead.
        </EmptyState>
      </div>
    );
  }

  function selectImplementation(id: string) {
    setSelectedPreviewId(id);
    onSelectSource?.(id);
  }

  return (
    <article className="mx-auto grid w-full max-w-6xl gap-5 pb-6">
      <header className="sticky top-0 z-20 grid gap-3 border-b border-border bg-background px-4 py-3">
        <Button
          className="-ml-2 w-fit"
          type="button"
          variant="ghost"
          size="sm"
          onClick={onBack}
        >
          <Icon name="ChevronLeft" className="size-4" aria-hidden="true" />
          Back to UI Patterns
        </Button>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold tracking-tight">
              {entry.name}
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {providerName(
                selectedPreview.record.provenance.providerId,
                providers,
              )}
            </p>
          </div>
          <a
            className="inline-flex cursor-pointer items-center gap-1 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            {...externalLinkProps(selectedPreview.record.canonicalUrl)}
          >
            Documentation
            <Icon name="ArrowUpRight" className="size-3.5" aria-hidden="true" />
          </a>
        </div>
        <ImplementationSwitcher
          previews={previews}
          providers={providers}
          selectedSourceRecordId={selectedPreview.record.id}
          onSelect={selectImplementation}
        />
      </header>

      <div className="grid gap-5 px-4">
        <section
          className="grid gap-3"
          aria-label={`${entry.name} interactive preview`}
        >
          <LiveComponentPreview
            key={selectedPreview.record.id}
            definition={selectedPreview.preview}
          />
        </section>

        <section
          className="grid gap-5 border-t border-border pt-5"
          aria-label="Source guidance and examples"
        >
          <ImplementationDetail
            record={selectedPreview.record}
            provider={providers.get(
              selectedPreview.record.provenance.providerId,
            )}
          />
          {guidanceRecords.map((record) => (
            <AccessibilityDetail key={record.id} record={record} />
          ))}
        </section>
      </div>
    </article>
  );
}

export function GalleryShell({
  navigation,
  snapshot,
  showTitle = true,
  mode = "gallery",
}: {
  navigation: GalleryNavigation;
  snapshot: SourceBrowserSnapshot;
  showTitle?: boolean;
  mode?: "gallery" | "panel";
}) {
  const [filters, setFilters] = useState<SourceBrowserFilters>({
    query: navigation.legacyQuery ?? "",
    providerId: "all",
  });
  const searchRef = useRef<HTMLInputElement>(null);
  const focusRestoreSourceIdRef = useRef<string | null>(null);
  const previousEntryIdRef = useRef(navigation.entryId);
  const providers = useMemo(
    () => providerById(snapshot.providers),
    [snapshot.providers],
  );
  const records = useMemo(
    () => sourceRecordById(snapshot.records),
    [snapshot.records],
  );
  const results = useMemo(
    () => filterAtlasEntries(snapshot, filters),
    [filters, snapshot],
  );
  const routedEntry = atlasEntryForRecordId(snapshot, navigation.entryId);
  const routedEntryRecords = routedEntry
    ? recordsForEntry(routedEntry, records)
    : [];
  const galleryProviders = galleryProviderIds.flatMap((providerId) => {
    const provider = providers.get(providerId);
    return provider ? [provider] : [];
  });

  useEffect(() => {
    if (!navigation.legacyQuery) return;
    setFilters((current) => ({
      ...current,
      query: navigation.legacyQuery ?? current.query,
    }));
  }, [navigation.legacyQuery]);

  useEffect(() => {
    const wasOpen = previousEntryIdRef.current !== null;
    previousEntryIdRef.current = navigation.entryId;
    if (!wasOpen || navigation.entryId !== null) return;

    const sourceRecordId = focusRestoreSourceIdRef.current;
    if (!sourceRecordId || typeof document === "undefined") return;
    const frame = requestAnimationFrame(() => {
      const card = Array.from(
        document.querySelectorAll<HTMLElement>("[data-source-item-id]"),
      ).find(
        (candidate) => candidate.dataset.sourceItemId === sourceRecordId,
      );
      card?.querySelector<HTMLButtonElement>("button")?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [navigation.entryId]);

  function openEntry(id: string) {
    focusRestoreSourceIdRef.current = id;
    navigation.openEntry(id);
  }

  if (navigation.entryId) {
    return (
      <main
        className="h-full min-h-0 overflow-y-auto"
        aria-label="UI Pattern detail"
      >
        {routedEntry ? (
          <EntryViewer
            entry={routedEntry}
            records={routedEntryRecords}
            providers={providers}
            preferredSourceRecordId={navigation.entryId}
            onSelectSource={navigation.replaceEntry}
            onBack={navigation.closeInspector}
          />
        ) : (
          <div className="grid gap-4 p-4">
            <Button
              className="w-fit"
              type="button"
              variant="ghost"
              size="sm"
              onClick={navigation.closeInspector}
            >
              <Icon name="ChevronLeft" className="size-4" aria-hidden="true" />
              Back to UI Patterns
            </Button>
            <EmptyState>
              This source-native record is not present in the current snapshot.
            </EmptyState>
          </div>
        )}
      </main>
    );
  }

  return (
    <main
      className={`flex w-full flex-col overflow-hidden ${
        showTitle ? "h-screen min-h-0" : "h-full min-h-0"
      }`}
      aria-label="UI Pattern Atlas"
      data-gallery-mode={mode}
    >
      <header className="grid shrink-0 gap-3 border-b border-border bg-background p-4">
        {showTitle ? (
          <h1 className="text-lg font-semibold tracking-tight">
            UI Pattern Atlas
          </h1>
        ) : null}
        {navigation.legacyQuery ? (
          <p
            className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground"
            role="status"
          >
            Legacy Atlas link: showing matches for “{navigation.legacyQuery}”.
          </p>
        ) : null}
        <section
          className="grid gap-3 sm:grid-cols-[minmax(12rem,1fr)_10rem_auto]"
          aria-label="Find components"
        >
          <div className="relative">
            <Icon
              name="Search"
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              ref={searchRef}
              id="source-search"
              type="search"
              aria-label="Search components"
              placeholder="Search UI patterns"
              className="h-9 pl-9"
              value={filters.query}
              onChange={(event) => {
                const query = event.currentTarget.value;
                setFilters((current) => ({ ...current, query }));
              }}
            />
          </div>
          <Select
            value={filters.providerId}
            onValueChange={(providerId) =>
              setFilters((current) => ({ ...current, providerId }))
            }
          >
            <SelectTrigger
              className="h-9 text-foreground"
              aria-label="Filter by library"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All libraries</SelectItem>
              {galleryProviders.map((provider) => (
                <SelectItem key={provider.id} value={provider.id}>
                  {provider.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p
            className="self-center text-right text-xs text-muted-foreground"
            role="status"
            aria-live="polite"
          >
            {plural(results.length, "component")}
          </p>
        </section>
      </header>

      <section
        id={showTitle ? "pattern-results" : undefined}
        tabIndex={showTitle ? -1 : undefined}
        className="min-h-0 flex-1 overflow-y-auto p-3 outline-none sm:p-4"
        aria-label="Components"
      >
        {results.length ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,20rem),1fr))] items-start gap-3">
            {results.map((entry) => (
              <GalleryCard
                key={entry.sourceRecordIds.join("|")}
                entry={entry}
                records={galleryImplementationRecords(
                  entry,
                  records,
                  filters.providerId,
                )}
                providers={providers}
                onOpen={openEntry}
              />
            ))}
          </div>
        ) : (
          <EmptyState>
            There are no matching UI patterns. Try a different search or
            library.
          </EmptyState>
        )}
      </section>
    </main>
  );
}
