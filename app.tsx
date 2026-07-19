import {
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "./components/ui/dialog";
import { Button } from "./components/ui/button";
import { Icon } from "./components/ui/icon";
import { Input } from "./components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./components/ui/select";
import { RuleVisual } from "./rule-visual";
import type {
  DoctrineRule,
  LibraryPayload,
  rpcContract,
} from "./server";
import { libraryStyles } from "./library-styles";
import "./library.css";

type LifecycleFilter = "all" | "active" | "candidate" | "other";
type DomainFilter = "all" | string;

function ruleSubPath(id: string): string {
  return `rule/${encodeURIComponent(id)}`;
}

function idFromSubPath(subPath: string): string | null {
  if (!subPath.startsWith("rule/")) return null;
  try {
    return decodeURIComponent(subPath.slice("rule/".length)) || null;
  } catch {
    return null;
  }
}

function searchableText(rule: DoctrineRule): string {
  return [
    rule.id,
    rule.title,
    rule.kind,
    rule.strength,
    rule.statement,
    rule.rationale,
    rule.classification.primary,
    ...rule.classification.secondary,
    ...rule.classification.pattern_categories,
    ...rule.applicability.products,
    ...rule.applicability.activities,
    ...rule.applicability.artifacts,
    ...rule.applicability.surfaces,
    ...rule.applicability.contexts,
    ...rule.applicability.when,
    ...rule.applicability.not_when,
    ...rule.guidance.prefer,
    ...rule.guidance.avoid,
    ...rule.retrieval.keywords,
    ...rule.retrieval.aliases,
    ...rule.retrieval.positive_examples,
    ...rule.retrieval.negative_examples,
    ...rule.verification.checks,
    ...rule.evidence.map((item) => item.summary),
  ]
    .join("\n")
    .toLocaleLowerCase();
}

function StatusPill({ status }: { status: string }) {
  return (
    <span className={`dd-pill dd-pill--${status}`}>
      <span className="dd-pill__dot" aria-hidden="true" />
      {status}
    </span>
  );
}

function RuleCard({
  rule,
  onOpen,
}: {
  rule: DoctrineRule;
  onOpen: (id: string) => void;
}) {
  const leaf = rule.classification.primary.split(".")[1] ?? "general";
  return (
    <article className="dd-card">
      <RuleVisual rule={rule} />
      <div className="dd-card__body">
        <div className="dd-card__meta">
          <span>{leaf}</span>
          <StatusPill status={rule.lifecycle.status} />
        </div>
        <h2>{rule.title}</h2>
        <p>{rule.statement}</p>
        <div className="dd-card__footer">
          <span>{rule.kind}</span>
          <span>{rule.strength}</span>
          <code>{rule.id}</code>
        </div>
      </div>
      <button
        type="button"
        className="dd-card__trigger"
        aria-label={`View ${rule.title}`}
        data-rule-id={rule.id}
        onClick={() => onOpen(rule.id)}
      />
    </article>
  );
}

function ListBlock({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone?: "positive" | "negative";
}) {
  if (!items.length) return null;
  return (
    <section className={`dd-detail-block${tone ? ` dd-detail-block--${tone}` : ""}`}>
      <h3>{title}</h3>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
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
  return (
    <Dialog
      open={Boolean(requestedId)}
      onOpenChange={(open) => {
        if (!open && requestedId) onClose();
      }}
    >
      <DialogContent
        className={`dd-inspector${rule ? "" : " dd-inspector--missing"}`}
      >
        {rule ? (
          <>
            <RuleVisual rule={rule} inspector />
            <header className="dd-inspector__header">
              <div className="dd-inspector__kicker">
                <span>{rule.classification.primary}</span>
                <StatusPill status={rule.lifecycle.status} />
              </div>
              <DialogTitle>{rule.title}</DialogTitle>
              <DialogDescription>{rule.statement}</DialogDescription>
              {rule.lifecycle.status !== "active" ? (
                <div className="dd-candidate-note">
                  <Icon name="Info" aria-hidden="true" />
                  Candidate rules are preserved for review but do not guide
                  work until explicitly approved.
                </div>
              ) : null}
            </header>

            <div className="dd-inspector__content">
              <section className="dd-rationale">
                <h3>Why this exists</h3>
                <p>{rule.rationale}</p>
              </section>

              <div className="dd-guidance-grid">
                <ListBlock
                  title="Prefer"
                  items={rule.guidance.prefer}
                  tone="positive"
                />
                <ListBlock
                  title="Avoid"
                  items={rule.guidance.avoid}
                  tone="negative"
                />
              </div>

              <div className="dd-guidance-grid">
                <ListBlock title="Use when" items={rule.applicability.when} />
                <ListBlock
                  title="Not when"
                  items={rule.applicability.not_when}
                />
              </div>

              {rule.exceptions.length ? (
                <section className="dd-detail-block">
                  <h3>Exceptions</h3>
                  <div className="dd-exceptions">
                    {rule.exceptions.map((exception) => (
                      <article key={exception.id}>
                        <strong>{exception.condition}</strong>
                        <p>{exception.use_instead}</p>
                        <small>{exception.rationale}</small>
                      </article>
                    ))}
                  </div>
                </section>
              ) : null}

              <ListBlock
                title="Review checks"
                items={rule.verification.checks}
              />

              <section className="dd-detail-block">
                <h3>Evidence</h3>
                <div className="dd-evidence">
                  {rule.evidence.map((evidence) => (
                    <article key={evidence.id}>
                      <p>{evidence.summary}</p>
                      <code>
                        {evidence.source.type === "published_summary"
                          ? "Published evidence summary"
                          : evidence.source.thread_id
                            ? `${evidence.source.thread_id}/${evidence.source.source_keys.join(",")}`
                            : evidence.source.type}
                      </code>
                    </article>
                  ))}
                </div>
              </section>

              <dl className="dd-metadata">
                <div>
                  <dt>ID</dt>
                  <dd>{rule.id}</dd>
                </div>
                <div>
                  <dt>Kind</dt>
                  <dd>{rule.kind}</dd>
                </div>
                <div>
                  <dt>Strength</dt>
                  <dd>{rule.strength}</dd>
                </div>
                <div>
                  <dt>Confidence</dt>
                  <dd>{rule.confidence.level}</dd>
                </div>
                <div>
                  <dt>Reviewed</dt>
                  <dd>{rule.lifecycle.last_reviewed_at ?? "Not reviewed"}</dd>
                </div>
                <div>
                  <dt>Canonical source</dt>
                  <dd>
                    <code>{rule.canonical_path}</code>
                  </dd>
                </div>
              </dl>
            </div>
          </>
        ) : requestedId ? (
          <div className="dd-empty">
            <DialogTitle>Rule not found</DialogTitle>
            <DialogDescription>
              {requestedId} does not match a current doctrine rule.
            </DialogDescription>
          </div>
        ) : (
          <DialogTitle className="sr-only">Rule inspector</DialogTitle>
        )}
      </DialogContent>
    </Dialog>
  );
}

function DoctrineLibrary({ subPath }: { subPath: string }) {
  const rpc = useRpc<typeof rpcContract>();
  const navigate = useBbNavigate();
  const [library, setLibrary] = useState<LibraryPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [lifecycle, setLifecycle] = useState<LifecycleFilter>("active");
  const [domain, setDomain] = useState<DomainFilter>("all");
  const openedFromGallery = useRef(false);
  const requestedId = idFromSubPath(subPath);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const next = await rpc.call("getLibrary");
      setLibrary(next);
      setError(null);
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Could not load the doctrine repository.",
      );
    } finally {
      setLoading(false);
    }
  }, [rpc]);

  useEffect(() => {
    void load();
  }, [load]);

  useRealtime("corpus-changed", () => {
    void load();
  });

  const results = useMemo(() => {
    if (!library) return [];
    const terms = query
      .trim()
      .toLocaleLowerCase()
      .split(/\s+/)
      .filter(Boolean);
    return library.rules.filter((rule) => {
      const statusMatches =
        lifecycle === "all" ||
        (lifecycle === "other"
          ? !["active", "candidate"].includes(rule.lifecycle.status)
          : rule.lifecycle.status === lifecycle);
      const domainMatches =
        domain === "all" ||
        rule.classification.primary.startsWith(`${domain}.`);
      if (!statusMatches || !domainMatches) return false;
      if (!terms.length) return true;
      const text = searchableText(rule);
      return terms.every((term) => text.includes(term));
    });
  }, [domain, library, lifecycle, query]);

  const selectedRule =
    library?.rules.find((rule) => rule.id === requestedId) ?? null;

  function openRule(id: string) {
    openedFromGallery.current = true;
    navigate.toPluginPanel("library", { subPath: ruleSubPath(id) });
  }

  function closeRule() {
    if (openedFromGallery.current) {
      openedFromGallery.current = false;
      window.history.back();
      return;
    }
    navigate.toPluginPanel("library", { subPath: "", replace: true });
  }

  return (
    <main className="dd-shell">
      <style>{libraryStyles}</style>
      <section className="dd-toolbar" aria-label="Filter doctrine">
        <div className="dd-search">
          <Icon
            name="Search"
            className="dd-search__icon"
            aria-hidden="true"
          />
          <Input
            type="search"
            aria-label="Search doctrine"
            placeholder="Search principles, evidence, contexts…"
            value={query}
            onChange={(event) => setQuery(event.currentTarget.value)}
          />
        </div>

        <div className="dd-control">
          <span id="dd-domain-label">Domain</span>
          <Select value={domain} onValueChange={setDomain}>
            <SelectTrigger aria-labelledby="dd-domain-label">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All domains</SelectItem>
              {library?.taxonomy.roots.map((root) => (
                <SelectItem key={root.id} value={root.id}>
                  {root.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="dd-control">
          <span id="dd-lifecycle-label">Lifecycle</span>
          <Select
            value={lifecycle}
            onValueChange={(value) =>
              setLifecycle(value as LifecycleFilter)
            }
          >
            <SelectTrigger aria-labelledby="dd-lifecycle-label">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All lifecycle states</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="candidate">Candidates</SelectItem>
              <SelectItem value="other">Other states</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="dd-toolbar__status">
          {library?.git.available ? (
            <span
              className={`dd-git${library.git.dirty ? " dd-git--dirty" : ""}`}
              title={
                library.git.dirty
                  ? `${library.git.changed_files} uncommitted file changes`
                  : "Canonical doctrine repository is clean"
              }
            >
              <Icon name="GitBranch" aria-hidden="true" />
              {library.git.branch ?? "detached"}
              <code>{library.git.commit}</code>
              {library.git.dirty ? <i>dirty</i> : null}
            </span>
          ) : null}
          <span title="Refresh doctrine">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="dd-refresh"
              aria-label="Refresh doctrine"
              disabled={loading}
              onClick={() => void load()}
            >
              <Icon
                name={loading ? "Loading" : "RotateCcw"}
                className={loading ? "dd-spin" : undefined}
                aria-hidden="true"
              />
            </Button>
          </span>
        </div>

        <p className="dd-result-count" role="status" aria-live="polite">
          {results.length} {results.length === 1 ? "rule" : "rules"}
        </p>
      </section>

      {error ? (
        <div className="dd-empty">
          <strong>Doctrine unavailable</strong>
          <p>{error}</p>
          <Button variant="outline" size="sm" onClick={() => void load()}>
            Retry
          </Button>
        </div>
      ) : loading && !library ? (
        <div className="dd-loading" aria-label="Loading doctrine">
          <Icon name="Loading" className="dd-spin" aria-hidden="true" />
        </div>
      ) : results.length ? (
        <section className="dd-grid" aria-label="Doctrine rules">
          {results.map((rule) => (
            <RuleCard key={rule.id} rule={rule} onOpen={openRule} />
          ))}
        </section>
      ) : (
        <div className="dd-empty">
          <strong>No rules found</strong>
          <p>Try a different search or filter.</p>
        </div>
      )}

      <RuleInspector
        rule={selectedRule}
        requestedId={requestedId}
        onClose={closeRule}
      />
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
