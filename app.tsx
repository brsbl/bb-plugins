import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  definePluginApp,
  useBbNavigate,
  useRealtime,
  useRpc,
} from "@bb/plugin-sdk/app";

import type { DoctrineRule, LibraryPayload, rpcContract } from "./server";

type StatusFilter = "active" | "all" | "inactive";

function rulePath(id: string): string {
  return `rule/${encodeURIComponent(id)}`;
}

function ruleIdFromPath(path: string): string | null {
  if (!path.startsWith("rule/")) return null;
  try {
    return decodeURIComponent(path.slice(5)) || null;
  } catch {
    return null;
  }
}

function searchableText(rule: DoctrineRule): string {
  return [
    rule.id,
    rule.title,
    rule.statement,
    rule.why,
    rule.kind,
    rule.strength,
    rule.confidence,
    rule.domain,
    ...rule.products,
    ...rule.activities,
    ...rule.artifacts,
    ...rule.surfaces,
    ...rule.prefer,
    ...rule.avoid,
    ...rule.use_when,
    ...rule.not_when,
    ...rule.exceptions,
    ...rule.evidence,
    ...rule.checks,
  ]
    .join("\n")
    .toLocaleLowerCase();
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

function RuleCard({ rule, onOpen }: { rule: DoctrineRule; onOpen: () => void }) {
  return (
    <article className="min-w-0">
      <button
        type="button"
        className="group flex h-full w-full flex-col rounded-xl border border-border bg-card p-4 text-left text-card-foreground shadow-sm transition-colors hover:border-foreground/20 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onClick={onOpen}
      >
        <div className="flex w-full items-center justify-between gap-3">
          <span className="truncate text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {rule.domain}
          </span>
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
      </button>
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

function RuleInspector({
  rule,
  requestedId,
  onClose,
}: {
  rule: DoctrineRule | null;
  requestedId: string | null;
  onClose: () => void;
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
    <div
      className="fixed inset-0 z-50 flex justify-end bg-foreground/20 p-3 backdrop-blur-[1px]"
      role="presentation"
      onMouseDown={onClose}
    >
      <article
        className="relative flex h-full max-h-full w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-border bg-background text-foreground shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="doctrine-rule-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
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
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-10 pt-6 md:px-8 md:pt-8">
            <header className="border-b border-border pb-6 pr-10">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  {rule.domain}
                </span>
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
          </div>
        ) : (
          <div className="grid min-h-72 place-content-center p-8 text-center">
            <h2 id="doctrine-rule-title" className="text-lg font-semibold">Rule not found</h2>
            <p className="mt-1 text-sm text-muted-foreground">{requestedId} is not in this doctrine.</p>
          </div>
        )}
      </article>
    </div>
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
  const [status, setStatus] = useState<StatusFilter>("active");
  const openedFromLibrary = useRef(false);
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
    const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
    return library.rules.filter((rule) => {
      if (domain !== "all" && !rule.domain.startsWith(`${domain}.`)) return false;
      if (status === "active" && rule.status !== "active") return false;
      if (status === "inactive" && rule.status === "active") return false;
      if (!terms.length) return true;
      const text = searchableText(rule);
      return terms.every((term) => text.includes(term));
    });
  }, [domain, library, query, status]);

  const closeInspector = useCallback(() => {
    if (openedFromLibrary.current) {
      openedFromLibrary.current = false;
      window.history.back();
      return;
    }
    navigate.toPluginPanel("library", { subPath: "", replace: true });
  }, [navigate]);

  const selectedRule = library?.rules.find((rule) => rule.id === requestedId) ?? null;

  return (
    <main className="flex h-full min-h-0 flex-col bg-background text-foreground">
      <section className="flex shrink-0 flex-wrap items-center gap-2 border-b border-border bg-background px-4 py-3" aria-label="Filter design doctrine">
        <input
          type="search"
          className="h-9 min-w-56 flex-1 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Search doctrine"
          placeholder="Search rules…"
          value={query}
          onChange={(event) => setQuery(event.currentTarget.value)}
        />
        <select
          className="h-9 max-w-44 rounded-lg border border-input bg-background px-2.5 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Domain"
          value={domain}
          onChange={(event) => setDomain(event.currentTarget.value)}
        >
          <option value="all">All domains</option>
          {library?.domains.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select
          className="h-9 max-w-44 rounded-lg border border-input bg-background px-2.5 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Status"
          value={status}
          onChange={(event) => setStatus(event.currentTarget.value as StatusFilter)}
        >
          <option value="active">Current</option>
          <option value="all">All</option>
          <option value="inactive">Conflicted or retired</option>
        </select>
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
        <span className="ml-auto text-xs tabular-nums text-muted-foreground" role="status">
          {results.length} {results.length === 1 ? "rule" : "rules"}
        </span>
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
            {results.map((rule) => (
              <RuleCard
                key={rule.id}
                rule={rule}
                onOpen={() => {
                  openedFromLibrary.current = true;
                  navigate.toPluginPanel("library", { subPath: rulePath(rule.id) });
                }}
              />
            ))}
          </section>
        ) : (
          <div className="grid min-h-72 place-content-center text-center">
            <strong className="text-sm font-semibold">No rules found</strong>
            <p className="mt-1 text-sm text-muted-foreground">Try a different search or filter.</p>
          </div>
        )}
      </div>

      <RuleInspector rule={selectedRule} requestedId={requestedId} onClose={closeInspector} />
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
