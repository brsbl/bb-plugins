import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  definePluginApp,
  useBbNavigate,
  useRealtime,
  useRpc,
} from "@bb/plugin-sdk/app";

import {
  detailRowEndIndex,
  displayDomainIdentifier,
  domainFilterFromIdentifier,
  filterRules,
  ruleIdFromPath,
  SUBDOMAIN_GRADIENT_STYLES,
  subdomainFromIdentifier,
  titleCaseDomainFilter,
  toggledRulePath,
} from "./app-logic";
import type { DoctrineRule, LibraryPayload, rpcContract } from "./server";

const DOMAIN_STYLES: Record<
  string,
  {
    idle: string;
    selected: string;
    gradientIdle: string;
    gradientSelected: string;
  }
> = {
  all: {
    idle: "border-border bg-background/35 hover:border-foreground/20 hover:bg-background/55",
    selected: "border-foreground/25 bg-background/60 text-foreground ring-1 ring-foreground/10",
    gradientIdle: "from-muted/10 hover:from-muted/20",
    gradientSelected: "from-muted/20 hover:from-muted/30",
  },
  accessibility: {
    idle: "border-teal-500/20 bg-background/35 hover:border-teal-500/40 hover:bg-background/55",
    selected: "border-teal-500/50 bg-background/60 text-foreground ring-1 ring-teal-500/30",
    gradientIdle: "from-teal-500/5 hover:from-teal-500/10",
    gradientSelected: "from-teal-500/10 hover:from-teal-500/15",
  },
  ai: {
    idle: "border-violet-500/20 bg-background/35 hover:border-violet-500/40 hover:bg-background/55",
    selected: "border-violet-500/50 bg-background/60 text-foreground ring-1 ring-violet-500/30",
    gradientIdle: "from-violet-500/5 hover:from-violet-500/10",
    gradientSelected: "from-violet-500/10 hover:from-violet-500/15",
  },
  content: {
    idle: "border-amber-500/20 bg-background/35 hover:border-amber-500/40 hover:bg-background/55",
    selected: "border-amber-500/50 bg-background/60 text-foreground ring-1 ring-amber-500/30",
    gradientIdle: "from-amber-500/5 hover:from-amber-500/10",
    gradientSelected: "from-amber-500/10 hover:from-amber-500/15",
  },
  information: {
    idle: "border-sky-500/20 bg-background/35 hover:border-sky-500/40 hover:bg-background/55",
    selected: "border-sky-500/50 bg-background/60 text-foreground ring-1 ring-sky-500/30",
    gradientIdle: "from-sky-500/5 hover:from-sky-500/10",
    gradientSelected: "from-sky-500/10 hover:from-sky-500/15",
  },
  interaction: {
    idle: "border-indigo-500/20 bg-background/35 hover:border-indigo-500/40 hover:bg-background/55",
    selected: "border-indigo-500/50 bg-background/60 text-foreground ring-1 ring-indigo-500/30",
    gradientIdle: "from-indigo-500/5 hover:from-indigo-500/10",
    gradientSelected: "from-indigo-500/10 hover:from-indigo-500/15",
  },
  process: {
    idle: "border-orange-500/20 bg-background/35 hover:border-orange-500/40 hover:bg-background/55",
    selected: "border-orange-500/50 bg-background/60 text-foreground ring-1 ring-orange-500/30",
    gradientIdle: "from-orange-500/5 hover:from-orange-500/10",
    gradientSelected: "from-orange-500/10 hover:from-orange-500/15",
  },
  system: {
    idle: "border-lime-500/20 bg-background/35 hover:border-lime-500/40 hover:bg-background/55",
    selected: "border-lime-500/50 bg-background/60 text-foreground ring-1 ring-lime-500/30",
    gradientIdle: "from-lime-500/5 hover:from-lime-500/10",
    gradientSelected: "from-lime-500/10 hover:from-lime-500/15",
  },
  visual: {
    idle: "border-pink-500/20 bg-background/35 hover:border-pink-500/40 hover:bg-background/55",
    selected: "border-pink-500/50 bg-background/60 text-foreground ring-1 ring-pink-500/30",
    gradientIdle: "from-pink-500/5 hover:from-pink-500/10",
    gradientSelected: "from-pink-500/10 hover:from-pink-500/15",
  },
};

function domainLabel(domain: string): string {
  return titleCaseDomainFilter(domain);
}

function getGridColumnCount(): number {
  if (typeof window === "undefined") return 1;
  if (window.matchMedia("(min-width: 1280px)").matches) return 3;
  if (window.matchMedia("(min-width: 768px)").matches) return 2;
  return 1;
}

function useGridColumnCount(): number {
  const [columnCount, setColumnCount] = useState(getGridColumnCount);

  useEffect(() => {
    const medium = window.matchMedia("(min-width: 768px)");
    const extraLarge = window.matchMedia("(min-width: 1280px)");
    const update = () => setColumnCount(getGridColumnCount());
    medium.addEventListener("change", update);
    extraLarge.addEventListener("change", update);
    return () => {
      medium.removeEventListener("change", update);
      extraLarge.removeEventListener("change", update);
    };
  }, []);

  return columnCount;
}

function StatusBadge({ status }: { status: DoctrineRule["status"] }) {
  if (status === "active") return null;
  return (
    <span
      className={
        status === "conflicted"
          ? "rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-medium text-destructive"
          : "rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
      }
    >
      {status}
    </span>
  );
}

function DomainPills({
  domains,
  selectedDomain,
  onSelect,
}: {
  domains: string[];
  selectedDomain: string;
  onSelect: (domain: string) => void;
}) {
  return (
    <div
      className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5 lg:flex-nowrap"
      role="group"
      aria-label="Filter by domain"
    >
      {["all", ...domains].map((domain) => {
        const selected = selectedDomain === domain;
        const style = DOMAIN_STYLES[domain] ?? DOMAIN_STYLES.all;
        const label = domainLabel(domain);
        return (
          <button
            key={domain}
            type="button"
            className={`cursor-pointer rounded-full border bg-linear-to-b to-background/75 px-3 py-1 text-xs font-medium text-foreground shadow-xs backdrop-blur-sm transition-colors hover:to-background/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${selected ? `${style.selected} ${style.gradientSelected}` : `${style.idle} ${style.gradientIdle}`}`}
            aria-label={domain === "all" ? "Show all domains" : `Show ${label} domain`}
            aria-pressed={selected}
            onClick={() => onSelect(domain)}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

function DomainIdentifierPill({
  identifier,
  selectedDomain,
  onSelect,
}: {
  identifier: string;
  selectedDomain: string;
  onSelect: (domain: string) => void;
}) {
  const filterDomain = domainFilterFromIdentifier(identifier);
  const selected = selectedDomain === filterDomain;
  const style = DOMAIN_STYLES[filterDomain] ?? DOMAIN_STYLES.all;
  const subdomainStyle =
    SUBDOMAIN_GRADIENT_STYLES[subdomainFromIdentifier(identifier)] ?? {
      idle: "to-muted/10 hover:to-muted/20",
      selected: "to-muted/20 hover:to-muted/30",
    };
  const label = displayDomainIdentifier(identifier);
  const gradientStyle = selected
    ? `${style.gradientSelected} ${subdomainStyle.selected}`
    : `${style.gradientIdle} ${subdomainStyle.idle}`;

  return (
    <button
      type="button"
      className={`inline-flex max-w-full cursor-pointer items-center rounded-full border bg-linear-to-r px-2 py-0.5 text-[11px] font-medium leading-4 text-foreground shadow-xs backdrop-blur-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${selected ? style.selected : style.idle} ${gradientStyle}`}
      aria-label={`Filter rules by ${filterDomain} domain`}
      aria-pressed={selected}
      onClick={() => onSelect(filterDomain)}
    >
      <span className="truncate">{label}</span>
    </button>
  );
}

function RuleCard({
  rule,
  selected,
  selectedDomain,
  onToggle,
  onSelectDomain,
}: {
  rule: DoctrineRule;
  selected: boolean;
  selectedDomain: string;
  onToggle: () => void;
  onSelectDomain: (domain: string) => void;
}) {
  const detailId = `rule-detail-${rule.id}`;
  return (
    <article
      className={`relative min-w-0 rounded-xl border bg-card text-card-foreground shadow-sm transition-colors hover:border-foreground/20 hover:bg-muted/30 ${selected ? "border-foreground/25 bg-muted/30 ring-1 ring-foreground/10" : "border-border"}`}
      id={`rule-card-${rule.id}`}
    >
      <div className="pointer-events-none relative z-10 flex h-full flex-col p-4">
        <div className="flex w-full items-center justify-between gap-3">
          <div className="pointer-events-auto min-w-0">
            <DomainIdentifierPill
              identifier={rule.domain}
              selectedDomain={selectedDomain}
              onSelect={onSelectDomain}
            />
          </div>
          <StatusBadge status={rule.status} />
        </div>
        <h2 className="mt-2 text-base font-semibold leading-snug text-foreground">
          {rule.title}
        </h2>
        <p className="mt-1.5 line-clamp-3 text-sm leading-6 text-muted-foreground">
          {rule.statement}
        </p>
        <div className="mt-auto flex w-full items-center gap-2 pt-4 text-[11px] text-muted-foreground">
          <span>{rule.strength}</span>
          <span aria-hidden="true">·</span>
          <span>{rule.confidence} confidence</span>
          <code className="ml-auto font-mono text-[10px] opacity-70">{rule.id}</code>
        </div>
      </div>
      <button
        type="button"
        className="absolute inset-0 z-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        aria-label={`${selected ? "Collapse" : "Expand"} rule: ${rule.title}`}
        aria-controls={detailId}
        aria-expanded={selected}
        onClick={onToggle}
      />
    </article>
  );
}

function ListSection({
  title,
  items,
  tone = "neutral",
}: {
  title: string;
  items: string[];
  tone?: "neutral" | "positive" | "negative";
}) {
  if (!items.length) return null;
  const marker = tone === "positive" ? "bg-emerald-600" : tone === "negative" ? "bg-destructive" : "bg-muted-foreground";
  return (
    <section>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      <ul className="mt-2 space-y-2 text-sm leading-6 text-foreground">
        {items.map((item) => (
          <li key={item} className="flex gap-2.5">
            <span className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${marker}`} aria-hidden="true" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1 break-words text-xs text-foreground">{children}</dd>
    </div>
  );
}

function RuleDetail({
  rule,
  requestedId,
  selectedDomain,
  onClose,
  onSelectDomain,
}: {
  rule: DoctrineRule | null;
  requestedId: string | null;
  selectedDomain: string;
  onClose: () => void;
  onSelectDomain: (domain: string) => void;
}) {
  useEffect(() => {
    if (!requestedId) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose, requestedId]);

  if (!requestedId) return null;

  return (
    <article
      id={`rule-detail-${requestedId}`}
      className="relative col-span-full overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-sm"
      aria-labelledby="doctrine-rule-title"
    >
      <div className="mx-auto w-full max-w-5xl px-5 pb-8 pt-6 md:px-8 md:pb-10 md:pt-8">
        <button
          type="button"
          className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-md text-xl leading-none text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Close rule"
          title="Close"
          onClick={onClose}
        >
          ×
        </button>

        {rule ? (
          <>
            <header className="border-b border-border pb-6 pr-10">
              <div className="flex items-center gap-2">
                <DomainIdentifierPill
                  identifier={rule.domain}
                  selectedDomain={selectedDomain}
                  onSelect={onSelectDomain}
                />
                <StatusBadge status={rule.status} />
              </div>
              <h2 id="doctrine-rule-title" className="mt-2 text-2xl font-semibold leading-tight tracking-tight">
                {rule.title}
              </h2>
              <p className="mt-3 text-base leading-7 text-muted-foreground">{rule.statement}</p>
              {rule.status !== "active" ? (
                <p className="mt-4 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
                  {rule.status === "conflicted"
                    ? "This rule is paused because explicit preferences conflict."
                    : "This rule is kept for history and no longer guides work."}
                </p>
              ) : null}
            </header>

            <section className="mt-6">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Why</h3>
              <p className="mt-2 text-sm leading-6 text-foreground">{rule.why}</p>
            </section>

            <div className="mt-7 grid gap-7 md:grid-cols-2">
              <ListSection title="Prefer" items={rule.prefer} tone="positive" />
              <ListSection title="Avoid" items={rule.avoid} tone="negative" />
            </div>
            <div className="mt-7 grid gap-7 md:grid-cols-2">
              <ListSection title="Use when" items={rule.use_when} />
              <ListSection title="Do not use when" items={rule.not_when} />
            </div>

            <div className="mt-7 space-y-7">
              <ListSection title="Exceptions" items={rule.exceptions} />
              <ListSection title="Check" items={rule.checks} />
            </div>

            {rule.evidence.length ? (
              <section className="mt-7">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Evidence</h3>
                <div className="mt-2 space-y-2">
                  {rule.evidence.map((item) => (
                    <p key={item} className="rounded-lg bg-muted/60 px-3 py-2.5 text-sm leading-6 text-muted-foreground">
                      {item}
                    </p>
                  ))}
                </div>
              </section>
            ) : null}

            <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-border pt-5 md:grid-cols-3">
              <Fact label="ID">{rule.id}</Fact>
              <Fact label="Kind">{rule.kind}</Fact>
              <Fact label="Strength">{rule.strength}</Fact>
              <Fact label="Confidence">{rule.confidence}</Fact>
              <Fact label="Evidence">{rule.supporting_episodes} supporting · {rule.challenging_episodes} challenging</Fact>
              <Fact label="Updated">{rule.updated}</Fact>
              <Fact label="Source"><code className="font-mono text-[10px]">{rule.canonical_path}</code></Fact>
            </dl>
          </>
        ) : (
          <div className="grid min-h-72 place-content-center p-8 text-center">
            <h2 id="doctrine-rule-title" className="text-lg font-semibold">Rule not found</h2>
            <p className="mt-1 text-sm text-muted-foreground">{requestedId} is not in this doctrine.</p>
          </div>
        )}
      </div>
    </article>
  );
}

function DoctrineLibrary({ subPath }: { subPath: string }) {
  const rpc = useRpc<typeof rpcContract>();
  const navigate = useBbNavigate();
  const [library, setLibrary] = useState<LibraryPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [domain, setDomain] = useState("all");
  const detailRef = useRef<HTMLDivElement | null>(null);
  const columnCount = useGridColumnCount();
  const requestedId = ruleIdFromPath(subPath);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setLibrary(await rpc.call("getLibrary"));
      setError(null);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : String(nextError));
    } finally {
      setLoading(false);
    }
  }, [rpc]);

  useEffect(() => {
    void load();
  }, [load]);

  useRealtime("rules-changed", () => {
    void load();
  });

  const results = useMemo(() => {
    if (!library) return [];
    return filterRules(library.rules, domain, query);
  }, [domain, library, query]);

  const closeDetail = useCallback(() => {
    navigate.toPluginPanel("library", { subPath: "", replace: true });
  }, [navigate]);

  const selectedRule = library?.rules.find((rule) => rule.id === requestedId) ?? null;
  const selectedResultIndex = results.findIndex((rule) => rule.id === requestedId);
  const detailAfterIndex = detailRowEndIndex(
    selectedResultIndex,
    results.length,
    columnCount,
  );

  useEffect(() => {
    if (!requestedId || selectedResultIndex < 0) return;
    const frame = window.requestAnimationFrame(() => {
      detailRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [columnCount, requestedId, selectedResultIndex]);

  useEffect(() => {
    if (requestedId && selectedRule && selectedResultIndex < 0) closeDetail();
  }, [closeDetail, requestedId, selectedResultIndex, selectedRule]);

  return (
    <main className="flex h-full min-h-0 flex-col bg-background text-foreground">
      <section className="flex shrink-0 flex-wrap items-center gap-2 border-b border-border bg-background px-4 py-3 lg:flex-nowrap" aria-label="Filter design doctrine">
        <input
          type="search"
          className="h-9 w-full min-w-0 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring sm:w-56 lg:w-64"
          aria-label="Search doctrine"
          placeholder="Search rules…"
          value={query}
          onChange={(event) => setQuery(event.currentTarget.value)}
        />
        <DomainPills
          domains={library?.domains ?? []}
          selectedDomain={domain}
          onSelect={setDomain}
        />
        <div className="ml-auto flex h-9 shrink-0 items-center gap-1.5">
          <span className="shrink-0 text-xs tabular-nums text-muted-foreground" role="status">
            {results.length} {results.length === 1 ? "rule" : "rules"}
          </span>
          <button
            type="button"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-wait disabled:opacity-50"
            title="Refresh"
            aria-label="Refresh doctrine"
            disabled={loading}
            onClick={() => void load()}
          >
            ↻
          </button>
        </div>
      </section>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {error ? (
          <div className="grid min-h-72 place-content-center text-center">
            <strong className="text-sm font-semibold">Could not load doctrine</strong>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">{error}</p>
            <button type="button" className="mx-auto mt-4 rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted" onClick={() => void load()}>
              Retry
            </button>
          </div>
        ) : loading && !library ? (
          <div className="grid min-h-72 place-content-center text-sm text-muted-foreground">Loading rules…</div>
        ) : results.length ? (
          <section className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3" aria-label="Design doctrine rules">
            {requestedId && !selectedRule ? (
              <div className="col-span-full" ref={detailRef}>
                <RuleDetail
                  rule={null}
                  requestedId={requestedId}
                  selectedDomain={domain}
                  onClose={closeDetail}
                  onSelectDomain={setDomain}
                />
              </div>
            ) : null}
            {results.map((rule, index) => (
              <Fragment key={rule.id}>
                <RuleCard
                  rule={rule}
                  selected={requestedId === rule.id}
                  selectedDomain={domain}
                  onToggle={() => {
                    const nextPath = toggledRulePath(requestedId, rule.id);
                    if (!nextPath) {
                      closeDetail();
                      return;
                    }
                    navigate.toPluginPanel("library", {
                      subPath: nextPath,
                      replace: requestedId !== null,
                    });
                  }}
                  onSelectDomain={setDomain}
                />
                {index === detailAfterIndex ? (
                  <div className="col-span-full" ref={detailRef}>
                    <RuleDetail
                      rule={selectedRule}
                      requestedId={requestedId}
                      selectedDomain={domain}
                      onClose={closeDetail}
                      onSelectDomain={setDomain}
                    />
                  </div>
                ) : null}
              </Fragment>
            ))}
          </section>
        ) : requestedId && !selectedRule ? (
          <div className="mx-auto w-full max-w-6xl" ref={detailRef}>
            <RuleDetail
              rule={null}
              requestedId={requestedId}
              selectedDomain={domain}
              onClose={closeDetail}
              onSelectDomain={setDomain}
            />
          </div>
        ) : (
          <div className="grid min-h-72 place-content-center text-center">
            <strong className="text-sm font-semibold">No rules found</strong>
            <p className="mt-1 text-sm text-muted-foreground">Try a different search or filter.</p>
          </div>
        )}
      </div>
    </main>
  );
}

export default definePluginApp((app) => {
  app.slots.navPanel({
    id: "library",
    title: "Design Doctrine",
    icon: "Explore",
    path: "library",
    component: DoctrineLibrary,
  });
});
