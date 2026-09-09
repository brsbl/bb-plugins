import { useCallback, useEffect, useMemo, useState } from "react";
import { ExternalLink, MessageSquare, RefreshCw } from "lucide-react";
import {
  definePluginApp,
  useBbNavigate,
  useRealtime,
  useRpc,
} from "@get-bb/plugin-sdk/app";

import type { RunSummary, rpcContract } from "./server";

const PANEL_ID = "feedback-report";
const DASHBOARD_ROUTE = "/api/v1/plugins/feedback-report/http/dashboard";

function dashboardUrl(runId: string): string {
  return `${DASHBOARD_ROUTE}?run=${encodeURIComponent(runId)}`;
}

function periodLabel(run: RunSummary): string {
  return `${run.periodStart.slice(0, 10)} to ${run.asOf.slice(0, 10)}`;
}

function useRuns() {
  const rpc = useRpc<typeof rpcContract>();
  const [runs, setRuns] = useState<RunSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const refresh = useCallback(async () => {
    try {
      const result = await rpc.call("listRuns");
      setRuns(result.runs);
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    }
  }, [rpc]);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  useRealtime("runs-changed", () => {
    void refresh();
  });
  return { runs, error, refresh };
}

function RunList({
  runs,
  selected,
  onSelect,
}: {
  runs: RunSummary[];
  selected: string;
  onSelect: (id: string) => void;
}) {
  return (
    <ul className="m-0 list-none p-0">
      {runs.map((run) => {
        const active = run.id === selected;
        return (
          <li key={run.id}>
            <button
              type="button"
              onClick={() => onSelect(run.id)}
              aria-current={active ? "true" : undefined}
              className={`block w-full rounded px-4 py-2 text-left text-sm ${active ? "bg-accent text-accent-foreground" : "hover:bg-muted"}`}
            >
              <div className="font-medium">{periodLabel(run)}</div>
              <div className="text-muted-foreground text-xs">
                {run.weeks} weeks · {run.totals.topics} feedback · {run.totals.people} people
                {run.threadId ? " · thread open" : ""}
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function EmptyState() {
  return (
    <div className="mx-auto w-full max-w-xl space-y-4 p-6 text-sm">
      <h2 className="text-base font-semibold">No report runs yet</h2>
      <p className="text-muted-foreground">
        Ask an agent to run the feedback report for a period; the bundled
        feedback-report skill collects Discord and GitHub feedback, classifies
        it, checks what shipped, and builds the dashboard.
      </p>
      <p className="text-muted-foreground">
        When a run finishes, import it with{" "}
        <code>bb feedback-report import &lt;run-dir&gt;</code> and it appears
        here.
      </p>
    </div>
  );
}

function FeedbackReportPanel() {
  const { runs, error, refresh } = useRuns();
  const rpc = useRpc<typeof rpcContract>();
  const navigate = useBbNavigate();
  const [selectedId, setSelectedId] = useState<string>("");
  const [asking, setAsking] = useState(false);
  const [askError, setAskError] = useState<string | null>(null);

  const selected = useMemo(() => {
    if (!runs || runs.length === 0) return null;
    return runs.find((run) => run.id === selectedId) ?? runs[0];
  }, [runs, selectedId]);

  const askAgent = useCallback(async () => {
    if (!selected) return;
    setAsking(true);
    setAskError(null);
    try {
      const result = await rpc.call("askAgent", { runId: selected.id });
      navigate.toThread(result.threadId);
    } catch (cause) {
      setAskError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setAsking(false);
    }
  }, [navigate, rpc, selected]);

  if (error) {
    return (
      <div className="p-6 text-sm">
        <p className="text-destructive">Could not load runs: {error}</p>
        <button type="button" className="mt-2 underline" onClick={() => void refresh()}>
          Retry
        </button>
      </div>
    );
  }
  if (!runs) return <div className="text-muted-foreground p-6 text-sm">Loading runs…</div>;
  if (!selected) return <EmptyState />;

  return (
    <div className="flex h-full min-h-0 w-full">
      <aside className="border-border w-64 shrink-0 overflow-y-auto border-r p-2">
        <div className="text-muted-foreground px-4 py-2 text-xs font-medium">
          Runs
        </div>
        <RunList runs={runs} selected={selected.id} onSelect={setSelectedId} />
      </aside>
      <section className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="border-border flex flex-wrap items-center gap-2 border-b px-4 py-2 text-sm">
          <span className="font-medium">{periodLabel(selected)}</span>
          <span className="text-muted-foreground">
            · {selected.repository} · imported {selected.importedAt.slice(0, 10)}
          </span>
          <span className="flex-1" />
          <button
            type="button"
            onClick={() => void askAgent()}
            disabled={asking}
            className="border-border inline-flex h-8 shrink-0 items-center gap-1 whitespace-nowrap rounded border px-2 py-1 text-sm hover:bg-muted disabled:opacity-60"
          >
            <MessageSquare className="size-4" aria-hidden="true" />
            {selected.threadId ? "Open agent thread" : "Ask the agent"}
          </button>
          <a
            href={dashboardUrl(selected.id)}
            target="_blank"
            rel="noreferrer"
            className="border-border inline-flex h-8 shrink-0 items-center gap-1 whitespace-nowrap rounded border px-2 py-1 text-sm hover:bg-muted"
          >
            <ExternalLink className="size-4" aria-hidden="true" />
            Open in browser
          </a>
          <button
            type="button"
            onClick={() => void refresh()}
            aria-label="Refresh runs"
            className="border-border inline-flex size-8 shrink-0 items-center justify-center rounded border p-1 hover:bg-muted"
          >
            <RefreshCw className="size-4" aria-hidden="true" />
          </button>
        </div>
        {askError ? (
          <p className="text-destructive border-border border-b px-4 py-2 text-xs">{askError}</p>
        ) : null}
        <iframe
          key={selected.id}
          title={`Feedback report ${periodLabel(selected)}`}
          src={dashboardUrl(selected.id)}
          sandbox="allow-scripts allow-same-origin"
          className="min-h-0 w-full flex-1 border-0 bg-transparent"
        />
      </section>
    </div>
  );
}

export default definePluginApp((app) => {
  app.slots.navPanel({
    id: PANEL_ID,
    title: "Feedback report",
    icon: "ChartBar",
    path: "feedback-report",
    component: FeedbackReportPanel,
  });
});
