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
  useRealtimeConnectionState,
  useRpc,
} from "@get-bb/plugin-sdk/app";

import {
  harvestSummary,
  localDayStart,
  type ProposalResult,
} from "./activity";
import {
  ACTIVITY_PATH,
  detailRowEndIndex,
  displayDomainIdentifier,
  domainFilterFromIdentifier,
  filterRules,
  isActivityPath,
  relativeTime,
  ruleIdFromPath,
  rulePath,
  titleCaseDomainFilter,
  toggledRulePath,
} from "./app-logic";
import type {
  DoctrineRule,
  HarvestActivityItem,
  HarvestActivityPayload,
  LibraryPayload,
  rpcContract,
} from "./server";

const ACTIVITY_PAGE_SIZE = 25;
const ACTIVITY_REFRESH_LIMIT = 100;
const ACTIVITY_RELOAD_DELAY_MS = 400;

const DOMAIN_STYLES: Record<
  string,
  {
    idle: string;
    selected: string;
    meshStartIdle: string;
    meshStartSelected: string;
    meshEndIdle: string;
    meshEndSelected: string;
  }
> = {
  all: {
    idle: "border-border/60 bg-background/45 hover:border-foreground/15 hover:bg-background/55",
    selected: "border-foreground/20 bg-background/55 text-foreground ring-1 ring-foreground/8",
    meshStartIdle: "bg-muted/40 group-hover:bg-muted/50",
    meshStartSelected: "bg-muted/55 group-hover:bg-muted/65",
    meshEndIdle: "bg-accent/35 group-hover:bg-accent/45",
    meshEndSelected: "bg-accent/50 group-hover:bg-accent/60",
  },
  accessibility: {
    idle: "border-emerald-400/10 bg-background/45 hover:border-emerald-400/25 hover:bg-background/55",
    selected: "border-emerald-400/30 bg-background/55 text-foreground ring-1 ring-emerald-400/20",
    meshStartIdle: "bg-emerald-300/40 group-hover:bg-emerald-300/50",
    meshStartSelected: "bg-emerald-300/55 group-hover:bg-emerald-300/65",
    meshEndIdle: "bg-cyan-300/35 group-hover:bg-cyan-300/45",
    meshEndSelected: "bg-cyan-300/50 group-hover:bg-cyan-300/60",
  },
  ai: {
    idle: "border-indigo-400/10 bg-background/45 hover:border-indigo-400/25 hover:bg-background/55",
    selected: "border-indigo-400/30 bg-background/55 text-foreground ring-1 ring-indigo-400/20",
    meshStartIdle: "bg-indigo-300/40 group-hover:bg-indigo-300/50",
    meshStartSelected: "bg-indigo-300/55 group-hover:bg-indigo-300/65",
    meshEndIdle: "bg-violet-300/35 group-hover:bg-violet-300/45",
    meshEndSelected: "bg-violet-300/50 group-hover:bg-violet-300/60",
  },
  content: {
    idle: "border-amber-400/10 bg-background/45 hover:border-amber-400/25 hover:bg-background/55",
    selected: "border-amber-400/30 bg-background/55 text-foreground ring-1 ring-amber-400/20",
    meshStartIdle: "bg-amber-300/40 group-hover:bg-amber-300/50",
    meshStartSelected: "bg-amber-300/55 group-hover:bg-amber-300/65",
    meshEndIdle: "bg-rose-300/35 group-hover:bg-rose-300/45",
    meshEndSelected: "bg-rose-300/50 group-hover:bg-rose-300/60",
  },
  information: {
    idle: "border-sky-400/10 bg-background/45 hover:border-sky-400/25 hover:bg-background/55",
    selected: "border-sky-400/30 bg-background/55 text-foreground ring-1 ring-sky-400/20",
    meshStartIdle: "bg-sky-300/40 group-hover:bg-sky-300/50",
    meshStartSelected: "bg-sky-300/55 group-hover:bg-sky-300/65",
    meshEndIdle: "bg-indigo-300/35 group-hover:bg-indigo-300/45",
    meshEndSelected: "bg-indigo-300/50 group-hover:bg-indigo-300/60",
  },
  interaction: {
    idle: "border-violet-400/10 bg-background/45 hover:border-violet-400/25 hover:bg-background/55",
    selected: "border-violet-400/30 bg-background/55 text-foreground ring-1 ring-violet-400/20",
    meshStartIdle: "bg-violet-300/40 group-hover:bg-violet-300/50",
    meshStartSelected: "bg-violet-300/55 group-hover:bg-violet-300/65",
    meshEndIdle: "bg-pink-300/35 group-hover:bg-pink-300/45",
    meshEndSelected: "bg-pink-300/50 group-hover:bg-pink-300/60",
  },
  process: {
    idle: "border-orange-400/10 bg-background/45 hover:border-orange-400/25 hover:bg-background/55",
    selected: "border-orange-400/30 bg-background/55 text-foreground ring-1 ring-orange-400/20",
    meshStartIdle: "bg-orange-300/40 group-hover:bg-orange-300/50",
    meshStartSelected: "bg-orange-300/55 group-hover:bg-orange-300/65",
    meshEndIdle: "bg-yellow-300/35 group-hover:bg-yellow-300/45",
    meshEndSelected: "bg-yellow-300/50 group-hover:bg-yellow-300/60",
  },
  system: {
    idle: "border-teal-400/10 bg-background/45 hover:border-teal-400/25 hover:bg-background/55",
    selected: "border-teal-400/30 bg-background/55 text-foreground ring-1 ring-teal-400/20",
    meshStartIdle: "bg-teal-300/40 group-hover:bg-teal-300/50",
    meshStartSelected: "bg-teal-300/55 group-hover:bg-teal-300/65",
    meshEndIdle: "bg-lime-300/35 group-hover:bg-lime-300/45",
    meshEndSelected: "bg-lime-300/50 group-hover:bg-lime-300/60",
  },
  visual: {
    idle: "border-rose-400/10 bg-background/45 hover:border-rose-400/25 hover:bg-background/55",
    selected: "border-rose-400/30 bg-background/55 text-foreground ring-1 ring-rose-400/20",
    meshStartIdle: "bg-rose-300/40 group-hover:bg-rose-300/50",
    meshStartSelected: "bg-rose-300/55 group-hover:bg-rose-300/65",
    meshEndIdle: "bg-purple-300/35 group-hover:bg-purple-300/45",
    meshEndSelected: "bg-purple-300/50 group-hover:bg-purple-300/60",
  },
};

function MeshFill({ start, end }: { start: string; end: string }) {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit] opacity-[0.85]"
    >
      <span
        className={`absolute -left-3 -top-3 h-8 w-2/3 rounded-full blur-md transition-colors duration-200 ${start}`}
      />
      <span
        className={`absolute -bottom-3 -right-3 h-8 w-2/3 rounded-full blur-md transition-colors duration-200 ${end}`}
      />
    </span>
  );
}

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

function ViewSwitch({ view }: { view: "rules" | "activity" }) {
  const navigate = useBbNavigate();
  const options = [
    { id: "rules", label: "Rules", subPath: "" },
    { id: "activity", label: "Activity", subPath: ACTIVITY_PATH },
  ] as const;
  return (
    <div
      className="inline-flex h-9 shrink-0 items-center rounded-lg border border-border bg-muted/40 p-0.5"
      role="group"
      aria-label="Design Doctrine view"
    >
      {options.map((option) => {
        const selected = view === option.id;
        return (
          <button
            key={option.id}
            type="button"
            className={`h-full rounded-md px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${selected ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"}`}
            aria-pressed={selected}
            onClick={() => {
              if (!selected) navigate.toPluginPanel("library", { subPath: option.subPath });
            }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
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
        const meshStart = selected
          ? style.meshStartSelected
          : style.meshStartIdle;
        const meshEnd = selected ? style.meshEndSelected : style.meshEndIdle;
        return (
          <button
            key={domain}
            type="button"
            className={`group relative isolate cursor-pointer overflow-hidden rounded-full border px-3 py-1 text-xs font-medium text-foreground shadow-xs backdrop-blur-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${selected ? style.selected : style.idle}`}
            aria-label={domain === "all" ? "Show all domains" : `Show ${label} domain`}
            aria-pressed={selected}
            onClick={() => onSelect(domain)}
          >
            <MeshFill start={meshStart} end={meshEnd} />
            <span className="relative z-10">{label}</span>
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
  const label = displayDomainIdentifier(identifier);
  const meshStart = selected ? style.meshStartSelected : style.meshStartIdle;
  const meshEnd = selected ? style.meshEndSelected : style.meshEndIdle;

  return (
    <button
      type="button"
      className={`group relative isolate inline-flex max-w-full cursor-pointer items-center overflow-hidden rounded-full border px-2 py-0.5 text-[11px] font-medium leading-4 text-foreground shadow-xs backdrop-blur-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${selected ? style.selected : style.idle}`}
      aria-label={`Filter rules by ${filterDomain} domain`}
      aria-pressed={selected}
      onClick={() => onSelect(filterDomain)}
    >
      <MeshFill start={meshStart} end={meshEnd} />
      <span className="relative z-10 truncate">{label}</span>
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
  const connectionState = useRealtimeConnectionState();
  const previousConnectionState = useRef(connectionState);
  const hasConnected = useRef(connectionState !== "connecting");
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

  useEffect(() => {
    const previous = previousConnectionState.current;
    previousConnectionState.current = connectionState;
    if (connectionState !== "connected" || previous === "connected") return;
    if (hasConnected.current) void load();
    hasConnected.current = true;
  }, [connectionState, load]);

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
        <ViewSwitch view="rules" />
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
        <div className="ml-auto flex h-9 shrink-0 items-center">
          <span className="shrink-0 text-xs tabular-nums text-muted-foreground" role="status">
            {results.length} {results.length === 1 ? "rule" : "rules"}
          </span>
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

const PROPOSAL_LABELS: Record<ProposalResult, string> = {
  added: "Added",
  waiting: "Waiting to publish",
  rejected: "Rejected",
  undecided: "Not reviewed",
};

function ProposalBadge({ result }: { result: ProposalResult }) {
  return (
    <span
      className={`shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-medium ${result === "added" ? "text-foreground" : "text-muted-foreground"}`}
    >
      {PROPOSAL_LABELS[result]}
    </span>
  );
}

function RuleLink({ id, onOpen }: { id: string; onOpen: (id: string) => void }) {
  return (
    <button
      type="button"
      className="rounded-sm font-mono text-foreground underline decoration-border underline-offset-2 transition-colors hover:decoration-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label={`Show rule ${id}`}
      onClick={() => onOpen(id)}
    >
      {id}
    </button>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className={`h-3 w-3 transition-transform ${open ? "rotate-90" : ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 4l4 4-4 4" />
    </svg>
  );
}

function ActivityRow({
  item,
  now,
  expanded,
  onToggle,
  onOpenThread,
  onOpenRule,
}: {
  item: HarvestActivityItem;
  now: number;
  expanded: boolean;
  onToggle: () => void;
  onOpenThread: () => void;
  onOpenRule: (id: string) => void;
}) {
  const summary = harvestSummary(item);
  const detailId = `harvest-proposals-${item.threadId}`;
  const processedAt = new Date(item.processedAt);
  const tone =
    item.result === "added"
      ? "text-foreground"
      : item.result === "failed"
        ? "text-destructive"
        : "text-muted-foreground";
  return (
    <li className="px-4 py-3">
      <div className="flex min-w-0 items-baseline gap-3">
        <button
          type="button"
          className="min-w-0 truncate rounded-sm text-left text-sm font-medium text-foreground underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={onOpenThread}
        >
          {item.title ?? "Untitled thread"}
        </button>
        <time
          className="ml-auto shrink-0 text-xs tabular-nums text-muted-foreground"
          dateTime={processedAt.toISOString()}
          title={processedAt.toLocaleString()}
        >
          {relativeTime(item.processedAt, now)}
        </time>
      </div>
      <div className="mt-1 flex min-w-0 items-center gap-3">
        <p className="min-w-0 flex-1 text-xs leading-5">
          <span className={tone}>{summary.label}</span>
          {summary.ruleIds.map((id, index) => (
            <Fragment key={id}>
              {index === 0 ? " " : ", "}
              <RuleLink id={id} onOpen={onOpenRule} />
            </Fragment>
          ))}
          {summary.note ? (
            <span className="text-muted-foreground"> · {summary.note}</span>
          ) : null}
        </p>
        {item.proposals.length ? (
          <button
            type="button"
            className="inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-expanded={expanded}
            aria-controls={detailId}
            onClick={onToggle}
          >
            {item.proposals.length} {item.proposals.length === 1 ? "proposal" : "proposals"}
            <Chevron open={expanded} />
          </button>
        ) : null}
      </div>
      {expanded ? (
        <ul id={detailId} className="mt-2 space-y-2 border-l border-border pl-3">
          {item.proposals.map((proposal) => (
            <li key={proposal.id}>
              <div className="flex min-w-0 items-start gap-2">
                <span className="min-w-0 flex-1 text-sm leading-6 text-foreground">
                  {proposal.title}
                </span>
                {proposal.result === "added" && proposal.ruleId ? (
                  <span className="shrink-0 pt-0.5 text-xs">
                    <RuleLink id={proposal.ruleId} onOpen={onOpenRule} />
                  </span>
                ) : null}
                <ProposalBadge result={proposal.result} />
              </div>
              {proposal.result === "rejected" && proposal.reason ? (
                <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                  {proposal.reason}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </li>
  );
}

function HarvestActivity() {
  const rpc = useRpc<typeof rpcContract>();
  const navigate = useBbNavigate();
  const connectionState = useRealtimeConnectionState();
  const previousConnectionState = useRef(connectionState);
  const hasConnected = useRef(connectionState !== "connecting");
  const generation = useRef(0);
  const loadedCount = useRef(0);
  const [activity, setActivity] = useState<HarvestActivityPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [moreError, setMoreError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(() => new Set());
  const [now, setNow] = useState(() => Date.now());

  const load = useCallback(async () => {
    const request = ++generation.current;
    setLoading(true);
    try {
      const next = await rpc.call("getHarvestActivity", {
        limit: Math.min(
          ACTIVITY_REFRESH_LIMIT,
          Math.max(ACTIVITY_PAGE_SIZE, loadedCount.current),
        ),
        dayStart: localDayStart(Date.now()),
      });
      if (request !== generation.current) return;
      loadedCount.current = next.items.length;
      setActivity(next);
      setNow(Date.now());
      setError(null);
      setMoreError(null);
    } catch (nextError) {
      if (request !== generation.current) return;
      setError(nextError instanceof Error ? nextError.message : String(nextError));
    } finally {
      if (request === generation.current) setLoading(false);
    }
  }, [rpc]);

  const loadMore = useCallback(async () => {
    const cursor = activity?.nextCursor;
    if (!cursor) return;
    const request = generation.current;
    setLoadingMore(true);
    try {
      const next = await rpc.call("getHarvestActivity", {
        limit: ACTIVITY_PAGE_SIZE,
        before: cursor,
        dayStart: localDayStart(Date.now()),
      });
      if (request !== generation.current) return;
      setActivity((previous) => {
        if (!previous) return next;
        const seen = new Set(previous.items.map((item) => item.threadId));
        const items = [
          ...previous.items,
          ...next.items.filter((item) => !seen.has(item.threadId)),
        ];
        loadedCount.current = items.length;
        return { ...next, items };
      });
      setMoreError(null);
    } catch (nextError) {
      if (request !== generation.current) return;
      setMoreError(nextError instanceof Error ? nextError.message : String(nextError));
    } finally {
      setLoadingMore(false);
    }
  }, [activity?.nextCursor, rpc]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  // A busy drain or a bulk archive emits bursts of events; collapse each burst
  // into one reload, and never run two at once.
  const reloadTimer = useRef<number | null>(null);
  const reloading = useRef<Promise<void> | null>(null);
  const reloadAgain = useRef(false);
  const scheduleReload = useCallback(() => {
    if (reloadTimer.current !== null) window.clearTimeout(reloadTimer.current);
    reloadTimer.current = window.setTimeout(() => {
      reloadTimer.current = null;
      if (reloading.current) {
        reloadAgain.current = true;
        return;
      }
      const run = async () => {
        do {
          reloadAgain.current = false;
          await load();
        } while (reloadAgain.current);
      };
      reloading.current = run().finally(() => {
        reloading.current = null;
      });
    }, ACTIVITY_RELOAD_DELAY_MS);
  }, [load]);

  useEffect(
    () => () => {
      if (reloadTimer.current !== null) window.clearTimeout(reloadTimer.current);
    },
    [],
  );

  useRealtime("harvest-changed", scheduleReload);

  useRealtime("rules-changed", scheduleReload);

  useEffect(() => {
    const previous = previousConnectionState.current;
    previousConnectionState.current = connectionState;
    if (connectionState !== "connected" || previous === "connected") return;
    if (hasConnected.current) void load();
    hasConnected.current = true;
  }, [connectionState, load]);

  const toggle = useCallback((threadId: string) => {
    setExpanded((previous) => {
      const next = new Set(previous);
      if (!next.delete(threadId)) next.add(threadId);
      return next;
    });
  }, []);

  const openRule = useCallback(
    (id: string) => navigate.toPluginPanel("library", { subPath: rulePath(id) }),
    [navigate],
  );

  return (
    <main className="flex h-full min-h-0 flex-col bg-background text-foreground">
      <section className="flex shrink-0 flex-wrap items-center gap-2 border-b border-border bg-background px-4 py-3 lg:flex-nowrap" aria-label="Harvest progress">
        <ViewSwitch view="activity" />
        {activity ? (
          <p className="ml-auto flex min-h-9 items-center text-xs tabular-nums text-muted-foreground" role="status">
            <span>
              {activity.queued} {activity.queued === 1 ? "thread" : "threads"} queued
              {" · "}
              {activity.processedToday} processed today
              {activity.publication ? (
                <>
                  {" · Paused until "}
                  <a
                    className="rounded-sm text-foreground underline decoration-border underline-offset-2 hover:decoration-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    href={activity.publication.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    rule PR
                  </a>
                  {" merges"}
                </>
              ) : null}
            </span>
          </p>
        ) : null}
      </section>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {error ? (
          <div className="grid min-h-72 place-content-center text-center">
            <strong className="text-sm font-semibold">Could not load harvest activity</strong>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">{error}</p>
            <button type="button" className="mx-auto mt-4 rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted" onClick={() => void load()}>
              Retry
            </button>
          </div>
        ) : loading && !activity ? (
          <div className="grid min-h-72 place-content-center text-sm text-muted-foreground">Loading activity…</div>
        ) : activity?.items.length ? (
          <section className="mx-auto w-full max-w-3xl" aria-label="Processed threads">
            <ol className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-sm">
              {activity.items.map((item) => (
                <ActivityRow
                  key={item.threadId}
                  item={item}
                  now={now}
                  expanded={expanded.has(item.threadId)}
                  onToggle={() => toggle(item.threadId)}
                  onOpenThread={() => navigate.toThread(item.threadId)}
                  onOpenRule={openRule}
                />
              ))}
            </ol>
            {activity.nextCursor ? (
              <div className="mt-3 flex flex-col items-center gap-1">
                <button
                  type="button"
                  className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted disabled:opacity-60"
                  disabled={loadingMore}
                  onClick={() => void loadMore()}
                >
                  {loadingMore ? "Loading…" : "Load more"}
                </button>
                {moreError ? (
                  <p className="text-xs text-destructive">{moreError}</p>
                ) : null}
              </div>
            ) : null}
          </section>
        ) : (
          <div className="grid min-h-72 place-content-center text-center">
            <strong className="text-sm font-semibold">No threads harvested yet</strong>
            <p className="mt-1 text-sm text-muted-foreground">Archived threads appear here once the harvest reads them.</p>
          </div>
        )}
      </div>
    </main>
  );
}

function DoctrinePanel({ subPath }: { subPath: string }) {
  return isActivityPath(subPath) ? <HarvestActivity /> : <DoctrineLibrary subPath={subPath} />;
}

export default definePluginApp((app) => {
  app.slots.navPanel({
    id: "library",
    title: "Design Doctrine",
    icon: "Palette",
    path: "library",
    component: DoctrinePanel,
  });
});
