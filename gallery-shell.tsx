import {
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { categories, entries, typeLabels } from "./data.js";
import { searchEntries } from "./search.js";
import {
  PatternPreview,
  patternPreviewRegistry,
  type PatternPreviewEntryId,
} from "./pattern-previews.js";
import {
  legacyCandidatesFor,
  legacyIdFromRouteEntryId,
} from "./atlas-compatibility.js";
import { Button } from "./components/ui/button.js";
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
import "./gallery.css";

type PatternEntry = (typeof entries)[number];
type EntryType = PatternEntry["type"];
type TypeFilter = EntryType | "all";
type Category = (typeof categories)[number];
type CategoryFilter = Category | "all";

interface BrowseFilters {
  query: string;
  type: TypeFilter;
  category: CategoryFilter;
}

export interface GalleryNavigation {
  entryId: string | null;
  openEntry: (id: string) => void;
  closeInspector: () => void;
}

const catalog = entries;
const entryById = new Map(catalog.map((entry) => [entry.id, entry]));
const motionDurationMs = 1_500;
const motionHoldMs = 650;
const motionEntryIds = new Set(
  patternPreviewRegistry
    .filter(
      ({ states }) => states.includes("rest") && states.includes("active"),
    )
    .map(({ entryId }) => entryId),
);
let pendingFocusRestoreId: string | null = null;
const focusRestoreStorageKey = "ui-pattern-atlas:focus-restore";

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
    // Storage may be unavailable in an isolated host; the module value remains.
  }
}

function clearStoredFocusRestoreId() {
  pendingFocusRestoreId = null;
  try {
    window.sessionStorage.removeItem(focusRestoreStorageKey);
  } catch {
    // No-op when the host blocks storage.
  }
}

function PatternVisual({
  entry,
  motion = "static",
  active = false,
  inspector = false,
}: {
  entry: PatternEntry;
  motion?: "static" | "hover" | "loop";
  active?: boolean;
  inspector?: boolean;
}) {
  const [phase, setPhase] = useState(1);
  const [visible, setVisible] = useState(inspector);
  const animationFrame = useRef<number | null>(null);
  const visualRef = useRef<HTMLElement | null>(null);
  const reduceMotion =
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasMotion = motionEntryIds.has(entry.id as PatternPreviewEntryId);
  const shouldAnimate =
    hasMotion &&
    !reduceMotion &&
    (motion === "loop" || (motion === "hover" && active));

  useEffect(() => {
    if (inspector || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const node = visualRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([record]) => {
        if (!record?.isIntersecting) return;
        setVisible(true);
        observer.disconnect();
      },
      { rootMargin: "480px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [inspector]);

  useEffect(() => {
    if (animationFrame.current !== null) {
      cancelAnimationFrame(animationFrame.current);
    }
    animationFrame.current = null;

    if (!shouldAnimate) {
      setPhase(1);
      return;
    }

    const start = performance.now();
    setPhase(0);

    const tick = (now: number) => {
      const elapsed = now - start;
      const cycle = motionDurationMs + motionHoldMs;
      const cycleElapsed = motion === "loop" ? elapsed % cycle : elapsed;
      setPhase(Math.min(1, cycleElapsed / motionDurationMs));
      if (motion === "loop" || elapsed < motionDurationMs) {
        animationFrame.current = requestAnimationFrame(tick);
      } else {
        animationFrame.current = null;
      }
    };

    animationFrame.current = requestAnimationFrame(tick);
    return () => {
      if (animationFrame.current !== null) {
        cancelAnimationFrame(animationFrame.current);
      }
      animationFrame.current = null;
    };
  }, [entry.id, motion, shouldAnimate]);

  return (
    <figure
      ref={visualRef}
      className={`pa-visual${inspector ? " pa-visual--inspector" : ""}`}
    >
      {visible ? (
        <PatternPreview
          className="pa-visual__component"
          entryId={entry.id as PatternPreviewEntryId}
          mode={inspector ? "interactive" : "inert"}
          phase={phase}
          state={reduceMotion ? "reduced-motion" : undefined}
        />
      ) : (
        <span className="pa-visual__placeholder" aria-hidden="true" />
      )}
    </figure>
  );
}

function PatternCaption({
  entry,
  inspector = false,
}: {
  entry: PatternEntry;
  inspector?: boolean;
}) {
  if (inspector) {
    return (
      <div className="pa-caption pa-caption--inspector">
        <DialogTitle className="pa-caption__name">{entry.name}</DialogTitle>
        <DialogDescription className="pa-caption__definition">
          {entry.description}
        </DialogDescription>
      </div>
    );
  }

  return (
    <div className="pa-caption">
      <span className="pa-caption__name">{entry.name}</span>
      <span
        id={`pattern-card-${entry.id}-description`}
        className="pa-caption__definition"
      >
        {entry.description}
      </span>
    </div>
  );
}

function ResultCard({
  entry,
  onOpen,
}: {
  entry: PatternEntry;
  onOpen: (id: string) => void;
}) {
  const [previewActive, setPreviewActive] = useState(false);

  return (
    <article
      className="pa-card"
      onPointerEnter={() => setPreviewActive(true)}
      onPointerLeave={() => setPreviewActive(false)}
    >
      <PatternVisual entry={entry} motion="hover" active={previewActive} />
      <PatternCaption entry={entry} />
      <button
        className="pa-card__trigger"
        type="button"
        aria-label={`View ${entry.name}`}
        aria-describedby={`pattern-card-${entry.id}-description`}
        data-entry-id={entry.id}
        onClick={() => onOpen(entry.id)}
        onFocus={() => setPreviewActive(true)}
        onBlur={() => setPreviewActive(false)}
      />
    </article>
  );
}

function EmptyState({
  title,
  description,
  action,
  dialog = false,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  dialog?: boolean;
}) {
  return (
    <div className="pa-empty">
      {dialog ? (
        <DialogTitle className="pa-empty__title">{title}</DialogTitle>
      ) : (
        <p className="pa-empty__title">{title}</p>
      )}
      {description ? (
        dialog ? (
          <DialogDescription className="pa-empty__description">
            {description}
          </DialogDescription>
        ) : (
          <p className="pa-empty__description">{description}</p>
        )
      ) : null}
      {action}
    </div>
  );
}

function DeprecatedRouteNotice({
  entryId,
  onClose,
  dialog = false,
}: {
  entryId: string;
  onClose: () => void;
  dialog?: boolean;
}) {
  const legacyId = legacyIdFromRouteEntryId(entryId);
  const candidates = legacyId ? legacyCandidatesFor(legacyId) : [];
  const candidateIds = candidates.map((candidate) => candidate.id).join(", ");

  return (
    <EmptyState
      dialog={dialog}
      title="This entry route is deprecated"
      description={`entry/${legacyId} is a legacy Atlas v2 identity. Choose an explicit provider-native ID: ${candidateIds}.`}
      action={
        dialog ? (
          <DialogClose asChild>
            <Button variant="outline" size="sm">
              Return to gallery
            </Button>
          </DialogClose>
        ) : (
          <Button variant="outline" size="sm" onClick={onClose}>
            Return to gallery
          </Button>
        )
      }
    />
  );
}

function PatternInspector({
  entryId,
  onClose,
}: {
  entryId: string | null;
  onClose: () => void;
}) {
  const legacyRoute = Boolean(entryId && legacyIdFromRouteEntryId(entryId));
  const entry = entryId && !legacyRoute ? entryById.get(entryId) : undefined;
  const missing = Boolean(entryId && !entry && !legacyRoute);

  return (
    <Dialog
      open={Boolean(entryId)}
      onOpenChange={(open) => {
        if (!open && entryId) onClose();
      }}
    >
      <DialogContent
        className={`pa-inspector${missing ? " pa-inspector--missing" : ""}`}
      >
        {entry ? (
          <>
            <PatternVisual entry={entry} motion="loop" inspector />
            <PatternCaption entry={entry} inspector />
          </>
        ) : legacyRoute && entryId ? (
          <DeprecatedRouteNotice entryId={entryId} onClose={onClose} dialog />
        ) : missing ? (
          <EmptyState
            dialog
            title="Pattern not found"
            description="This link does not match a current gallery entry."
            action={
              <DialogClose asChild>
                <Button variant="outline" size="sm">
                  Return to gallery
                </Button>
              </DialogClose>
            }
          />
        ) : (
          <DialogTitle className="sr-only">Pattern inspector</DialogTitle>
        )}
      </DialogContent>
    </Dialog>
  );
}

function PanelPatternInspector({
  entryId,
  onClose,
}: {
  entryId: string;
  onClose: () => void;
}) {
  const legacyRoute = Boolean(legacyIdFromRouteEntryId(entryId));
  const entry = legacyRoute ? undefined : entryById.get(entryId);

  return (
    <section className="pa-panel-inspector" aria-label="Pattern detail">
      <span className="pa-panel-inspector__back" title="Back to patterns">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          aria-label="Back to patterns"
          onClick={onClose}
        >
          <Icon name="ChevronLeft" aria-hidden="true" />
        </Button>
      </span>
      {entry ? (
        <>
          <PatternVisual entry={entry} motion="loop" inspector />
          <div className="pa-panel-inspector__caption">
            <h2 className="pa-caption__name">{entry.name}</h2>
            <p className="pa-caption__definition">{entry.description}</p>
          </div>
        </>
      ) : legacyRoute ? (
        <DeprecatedRouteNotice entryId={entryId} onClose={onClose} />
      ) : (
        <EmptyState
          title="Pattern not found"
          description="This link does not match a current gallery entry."
        />
      )}
    </section>
  );
}

function ResultCount({ count }: { count: number }) {
  return <>{`${count} ${count === 1 ? "result" : "results"}`}</>;
}

export function GalleryShell({
  navigation,
  showTitle = true,
  mode = "gallery",
}: {
  navigation: GalleryNavigation;
  showTitle?: boolean;
  mode?: "gallery" | "panel";
}) {
  const [filters, setFilters] = useState<BrowseFilters>({
    query: "",
    type: "all",
    category: "all",
  });
  const focusRestoreId = useRef<string | null>(null);
  const previousEntryId = useRef<string | null>(navigation.entryId);
  const searchRef = useRef<HTMLInputElement>(null);

  const search = useMemo(
    () => searchEntries(catalog, filters),
    [filters],
  );
  const results = search.entries as PatternEntry[];

  useEffect(() => {
    const storedRestoreId = storedFocusRestoreId();
    if (!navigation.entryId && (previousEntryId.current || pendingFocusRestoreId || storedRestoreId)) {
      const restoreId = focusRestoreId.current ?? pendingFocusRestoreId ?? storedRestoreId;
      focusRestoreId.current = null;
      clearStoredFocusRestoreId();
      window.requestAnimationFrame(() => {
        const card = restoreId
          ? document.querySelector<HTMLButtonElement>(
              `[data-entry-id="${CSS.escape(restoreId)}"]`,
            )
          : null;
        const target = card ?? searchRef.current;
        target?.focus();
        window.setTimeout(() => {
          if (document.activeElement === document.body) target?.focus();
        }, 350);
      });
    }
    previousEntryId.current = navigation.entryId;
  }, [navigation.entryId]);

  function openEntry(id: string) {
    focusRestoreId.current = id;
    rememberFocusRestoreId(id);
    navigation.openEntry(id);
  }

  if (mode === "panel" && navigation.entryId) {
    return (
      <main className="pa-shell pa-shell--panel">
        <PanelPatternInspector
          entryId={navigation.entryId}
          onClose={navigation.closeInspector}
        />
      </main>
    );
  }

  return (
    <main
      className={`pa-shell${mode === "panel" ? " pa-shell--panel" : ""}`}
    >
      {showTitle ? (
        <header className="pa-header">
          <h1 className="pa-title text-sm font-semibold">UI patterns</h1>
        </header>
      ) : null}

      <section className="pa-toolbar" aria-label="Filter patterns">
        <div className="pa-search">
          <Icon
            name="Search"
            className="pa-search__icon size-4"
            aria-hidden="true"
          />
          <Input
            ref={searchRef}
            id="pa-search"
            type="search"
            aria-label="Search"
            spellCheck={false}
            placeholder="Search"
            className="pa-search__input h-9"
            value={filters.query}
            onChange={(event) => {
              const query = event.currentTarget.value;
              setFilters((current) => ({ ...current, query }));
            }}
          />
        </div>

        <div className="pa-control">
          <span id="pa-category-label" className="pa-control__label text-xs font-medium">
            Category
          </span>
          <Select
            value={filters.category}
            onValueChange={(value) =>
              setFilters((current) => ({
                ...current,
                category: value as CategoryFilter,
              }))
            }
          >
            <SelectTrigger
              id="pa-category-filter"
              className="pa-select-trigger h-9"
              aria-labelledby="pa-category-label"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="pa-control">
          <span id="pa-type-label" className="pa-control__label text-xs font-medium">
            Record type
          </span>
          <Select
            value={filters.type}
            onValueChange={(value) =>
              setFilters((current) => ({
                ...current,
                type: value as TypeFilter,
              }))
            }
          >
            <SelectTrigger
              id="pa-type-filter"
              className="pa-select-trigger h-9"
              aria-labelledby="pa-type-label"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(typeLabels as Record<string, string>).map(
                ([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {value === "all" ? "All record types" : label}
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>
        </div>

        <p className="pa-result-count" role="status" aria-live="polite">
          <ResultCount count={results.length} />
        </p>
      </section>

      {results.length ? (
        <section
          className="pa-grid"
          id="pattern-results"
          aria-label="Pattern results"
        >
          {results.map((entry) => (
            <ResultCard key={entry.id} entry={entry} onOpen={openEntry} />
          ))}
        </section>
      ) : (
        <EmptyState
          title="No patterns found"
          description="Try a different search or filter."
        />
      )}

      {mode === "gallery" ? (
        <PatternInspector
          entryId={navigation.entryId}
          onClose={navigation.closeInspector}
        />
      ) : null}
    </main>
  );
}
