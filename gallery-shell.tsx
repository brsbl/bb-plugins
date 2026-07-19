import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import {
  filterSourceItems,
  freshnessLabel,
  groupSourceItemsByExactTitle,
  mayDisplayExcerpt,
  providerById,
  sourceItemById,
  type SourceBrowserFilters,
} from "./source-browser-model.js";
import type { SourceBrowserSnapshot, SourceItem } from "./source-item.js";
import { Button } from "./components/ui/button.js";
import { Card } from "./components/ui/card.js";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "./components/ui/dialog.js";
import { Icon } from "./components/ui/icon.js";
import { Input } from "./components/ui/input.js";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./components/ui/select.js";

export interface GalleryNavigation {
  entryId: string | null;
  /** A legacy Atlas id translated to a neutral source query. */
  legacyQuery?: string | null;
  openEntry: (id: string) => void;
  closeInspector: () => void;
}

const contentKindLabels = {
  component: "Component",
  pattern: "Pattern",
  guidance: "Guidance",
  unknown: "Other",
} as const;
const focusRestoreStorageKey = "ui-pattern-atlas:source-focus-restore";
let pendingFocusRestoreId: string | null = null;

function storedFocusRestoreId() {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage.getItem(focusRestoreStorageKey);
  } catch {
    return null;
  }
}

function rememberFocusRestoreId(id: string) {
  pendingFocusRestoreId = id;
  try {
    window.sessionStorage.setItem(focusRestoreStorageKey, id);
  } catch {
    // Keep the module value when storage is unavailable in an isolated host.
  }
}

function clearStoredFocusRestoreId() {
  pendingFocusRestoreId = null;
  try {
    window.sessionStorage.removeItem(focusRestoreStorageKey);
  } catch {
    // No-op when storage is unavailable.
  }
}

function externalLinkProps(url: string) {
  return { href: url, target: "_blank", rel: "noreferrer" };
}

function SourceItemMetadata({
  item,
  library,
}: {
  item: SourceItem;
  library: string;
}) {
  return (
    <dl className="grid gap-2 text-sm sm:grid-cols-2">
      <div className="min-w-0">
        <dt className="text-xs font-medium text-muted-foreground">Library</dt>
        <dd className="mt-0.5 truncate text-foreground">{library}</dd>
      </div>
      <div className="min-w-0">
        <dt className="text-xs font-medium text-muted-foreground">Native kind</dt>
        <dd className="mt-0.5 text-foreground">{contentKindLabels[item.contentKind]}</dd>
      </div>
      <div className="min-w-0">
        <dt className="text-xs font-medium text-muted-foreground">Section</dt>
        <dd className="mt-0.5 truncate text-foreground">{item.sourceSection ?? "Not supplied"}</dd>
      </div>
      <div className="min-w-0">
        <dt className="text-xs font-medium text-muted-foreground">Freshness</dt>
        <dd className="mt-0.5 text-foreground">{freshnessLabel(item)}</dd>
      </div>
    </dl>
  );
}

function SourceLinks({ item }: { item: SourceItem }) {
  const links = new Map(item.links.map((link) => [link.kind, link.url]));

  return (
    <div className="flex flex-wrap gap-2" aria-label="Canonical source links">
      <Button asChild size="sm" variant="outline">
        <a {...externalLinkProps(item.canonicalUrl)}>
          Documentation <Icon name="ArrowUpRight" className="size-3.5" aria-hidden="true" />
        </a>
      </Button>
      {(["example", "code"] as const).map((kind) => {
        const url = links.get(kind);
        if (!url) return null;
        return (
          <Button asChild key={kind} size="sm" variant="outline">
            <a {...externalLinkProps(url)}>
              {kind === "example" ? "Example" : "Code"}
              <Icon name="ArrowUpRight" className="size-3.5" aria-hidden="true" />
            </a>
          </Button>
        );
      })}
    </div>
  );
}

function SourceItemCard({
  item,
  library,
  onOpen,
}: {
  item: SourceItem;
  library: string;
  onOpen: (id: string) => void;
}) {
  return (
    <Card className="min-w-0 shadow-sm transition-colors hover:bg-muted/40 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2" role="article">
      <button
        className="flex w-full flex-col gap-3 p-4 text-left outline-none"
        type="button"
        aria-label={`Open ${item.title} from ${library}`}
        data-source-item-id={item.id}
        onClick={() => onOpen(item.id)}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold text-foreground">{item.title}</h2>
            <p className="mt-1 text-xs text-muted-foreground">{library}</p>
          </div>
          <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
            {contentKindLabels[item.contentKind]}
          </span>
        </div>
        <p className="line-clamp-1 text-sm text-muted-foreground">
          {item.sourceSection ?? "No native section supplied"}
        </p>
        {mayDisplayExcerpt(item) ? (
          <p className="line-clamp-3 text-sm leading-6 text-foreground">
            <span className="font-medium">Licensed excerpt: </span>
            {item.excerpt}
          </p>
        ) : null}
        <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>{freshnessLabel(item)}</span>
          <span className="truncate">{item.id}</span>
        </div>
      </button>
    </Card>
  );
}

function SourceDetail({
  item,
  library,
  dialog = false,
}: {
  item: SourceItem;
  library: string;
  dialog?: boolean;
}) {
  const title = `${item.title} — ${library}`;
  const titleElement = dialog ? (
    <DialogTitle className="pr-8 text-base">{title}</DialogTitle>
  ) : (
    <h2 className="pr-8 text-base font-semibold">{title}</h2>
  );

  return (
    <div className="grid gap-5">
      <div className="grid gap-1">
        {titleElement}
        {dialog ? (
          <DialogDescription>{item.id}</DialogDescription>
        ) : (
          <p className="text-sm text-muted-foreground">{item.id}</p>
        )}
      </div>
      <SourceItemMetadata item={item} library={library} />
      {mayDisplayExcerpt(item) ? (
        <section className="grid gap-1.5 rounded-md border border-border bg-muted/40 p-3" aria-label="Licensed upstream excerpt">
          <p className="text-xs font-medium text-muted-foreground">Licensed excerpt</p>
          <p className="text-sm leading-6 text-foreground">{item.excerpt}</p>
        </section>
      ) : null}
      <SourceLinks item={item} />
      <p className="text-xs text-muted-foreground">
        Upstream revision {item.provenance.upstreamRevision}
      </p>
    </div>
  );
}

function SourceInspector({
  snapshot,
  entryId,
  onClose,
}: {
  snapshot: SourceBrowserSnapshot;
  entryId: string | null;
  onClose: () => void;
}) {
  const item = sourceItemById(snapshot, entryId);
  const providers = providerById(snapshot.providers);

  return (
    <Dialog open={Boolean(entryId)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] max-w-xl overflow-y-auto">
        {item ? (
          <SourceDetail item={item} library={providers.get(item.providerId)?.name ?? item.providerId} dialog />
        ) : (
          <div className="grid gap-3">
            <DialogTitle>Source item not found</DialogTitle>
            <DialogDescription>
              This link no longer matches an item in the current provider snapshot.
            </DialogDescription>
            <DialogClose asChild>
              <Button className="w-fit" variant="outline">Return to sources</Button>
            </DialogClose>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-40 place-items-center rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
      {children}
    </div>
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
    contentKind: "all",
  });
  const searchRef = useRef<HTMLInputElement>(null);
  const focusRestoreId = useRef<string | null>(null);
  const previousEntryId = useRef<string | null>(navigation.entryId);
  const providers = useMemo(() => providerById(snapshot.providers), [snapshot.providers]);
  const results = useMemo(
    () => filterSourceItems(snapshot.items, filters),
    [filters, snapshot.items],
  );
  const groups = useMemo(() => groupSourceItemsByExactTitle(results), [results]);

  useEffect(() => {
    const storedRestoreId = storedFocusRestoreId();
    if (!navigation.entryId && (previousEntryId.current || pendingFocusRestoreId || storedRestoreId)) {
      const restoreId = focusRestoreId.current ?? pendingFocusRestoreId ?? storedRestoreId;
      focusRestoreId.current = null;
      clearStoredFocusRestoreId();
      window.requestAnimationFrame(() => {
        const escapedId = window.CSS?.escape?.(restoreId ?? "") ?? restoreId ?? "";
        const card = escapedId
          ? document.querySelector<HTMLButtonElement>(`[data-source-item-id="${escapedId}"]`)
          : null;
        const target = card ?? searchRef.current;
        target?.focus();
      });
    }
    previousEntryId.current = navigation.entryId;
  }, [navigation.entryId]);

  useEffect(() => {
    if (!navigation.legacyQuery) return;
    setFilters((current) => ({ ...current, query: navigation.legacyQuery ?? current.query }));
  }, [navigation.legacyQuery]);

  function openEntry(id: string) {
    focusRestoreId.current = id;
    rememberFocusRestoreId(id);
    navigation.openEntry(id);
  }

  if (mode === "panel" && navigation.entryId) {
    const item = sourceItemById(snapshot, navigation.entryId);
    return (
      <main className="grid gap-4 p-4" aria-label="Source detail">
        <Button className="w-fit" type="button" variant="ghost" size="sm" onClick={navigation.closeInspector}>
          <Icon name="ChevronLeft" className="size-4" aria-hidden="true" /> Back to sources
        </Button>
        {item ? (
          <SourceDetail item={item} library={providers.get(item.providerId)?.name ?? item.providerId} />
        ) : (
          <EmptyState>This source item is not present in the current provider snapshot.</EmptyState>
        )}
      </main>
    );
  }

  return (
    <main className="mx-auto grid w-full max-w-6xl gap-5 p-4 sm:p-5" aria-label="UI pattern sources">
      {showTitle ? <h1 className="text-lg font-semibold tracking-tight">UI pattern sources</h1> : null}
      {navigation.legacyQuery ? (
        <p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground" role="status">
          Legacy Atlas link: showing upstream candidates for “{navigation.legacyQuery}”.
        </p>
      ) : null}
      <section className="grid gap-3 border-b border-border pb-4 sm:grid-cols-2 lg:grid-cols-[minmax(16rem,1fr)_12rem_10rem_auto]" aria-label="Filter sources">
        <div className="relative">
          <Icon name="Search" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            ref={searchRef}
            id="source-search"
            type="search"
            aria-label="Search sources"
            placeholder="Search upstream sources"
            className="h-9 pl-9"
            value={filters.query}
            onChange={(event) => setFilters((current) => ({ ...current, query: event.currentTarget.value }))}
          />
        </div>
        <label className="grid gap-1 text-xs font-medium text-muted-foreground">
          Library
          <Select value={filters.providerId} onValueChange={(providerId) => setFilters((current) => ({ ...current, providerId }))}>
            <SelectTrigger className="h-9 text-foreground" aria-label="Filter by library"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All libraries</SelectItem>
              {snapshot.providers.map((provider) => <SelectItem key={provider.id} value={provider.id}>{provider.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </label>
        <label className="grid gap-1 text-xs font-medium text-muted-foreground">
          Native kind
          <Select value={filters.contentKind} onValueChange={(contentKind) => setFilters((current) => ({ ...current, contentKind: contentKind as SourceBrowserFilters["contentKind"] }))}>
            <SelectTrigger className="h-9 text-foreground" aria-label="Filter by native kind"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All kinds</SelectItem>
              {Object.entries(contentKindLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
            </SelectContent>
          </Select>
        </label>
        <p className="self-end pb-2 text-right text-xs text-muted-foreground" role="status" aria-live="polite">
          {results.length} {results.length === 1 ? "source" : "sources"}
        </p>
      </section>
      {groups.length ? (
        <section className="grid gap-6" id="pattern-results" aria-label="Source results">
          {groups.map((group) => (
            <section key={group.title} className="grid gap-3" aria-label={`${group.title} source records`}>
              {group.items.length > 1 ? <p className="text-xs font-medium text-muted-foreground">{group.title} · {group.items.length} upstream records</p> : null}
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {group.items.map((item) => <SourceItemCard key={item.id} item={item} library={providers.get(item.providerId)?.name ?? item.providerId} onOpen={openEntry} />)}
              </div>
            </section>
          ))}
        </section>
      ) : (
        <EmptyState>There are no matching source records. Try a different search or filter.</EmptyState>
      )}
      {mode === "gallery" ? <SourceInspector snapshot={snapshot} entryId={navigation.entryId} onClose={navigation.closeInspector} /> : null}
    </main>
  );
}
