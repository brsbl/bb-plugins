import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { PluginNavPanelProps } from "@bb/plugin-sdk";
import {
  useBbNavigate,
  useRealtime,
  useRealtimeConnectionState,
  useRpc,
} from "@bb/plugin-sdk/app";

import { workflowProgressForAgents } from "./presentation";
import type { GlobalRun, rpcContract } from "./server";
import { cn } from "./vendor/cn";
import { Icon } from "./vendor/icon";
import {
  WorkflowPhaseStrip,
  WorkflowProgress,
} from "./vendor/workflow-progress";

type RunFilter = "all" | "active" | "attention";

const FILTERS: readonly { id: RunFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "attention", label: "Needs attention" },
];

function workflowName(run: GlobalRun): string {
  return (
    run.workflowName ??
    run.workflow?.replace(/\.workflow\.js$|\.js$/, "") ??
    run.runId
  );
}

function isActive(run: GlobalRun): boolean {
  return /^(running|starting)$/i.test(run.status);
}

function needsAttention(run: GlobalRun): boolean {
  return /^(failed|stalled)$/i.test(run.status);
}

function matchesFilter(run: GlobalRun, filter: RunFilter): boolean {
  if (filter === "active") return isActive(run);
  if (filter === "attention") return needsAttention(run);
  return true;
}

function statusLabel(status: string): string {
  if (/fail|error/i.test(status)) return "Failed";
  if (/stalled/i.test(status)) return "Stalled";
  if (/cancel|interrupt/i.test(status)) return "Cancelled";
  if (/complete|done|success/i.test(status)) return "Completed";
  if (/start/i.test(status)) return "Starting";
  return "Running";
}

function StatusIcon({ status }: { status: string }) {
  if (/fail|error/i.test(status)) {
    return <Icon name="X" className="size-3.5 text-destructive-text" aria-hidden="true" />;
  }
  if (/cancel|interrupt/i.test(status)) {
    return <Icon name="Pause" className="size-3.5 text-muted-foreground" aria-hidden="true" />;
  }
  if (/complete|done|success/i.test(status)) {
    return <Icon name="Check" className="size-3.5 text-success" aria-hidden="true" />;
  }
  if (/stalled/i.test(status)) {
    return <Icon name="Circle" className="size-3.5 text-muted-foreground" aria-hidden="true" />;
  }
  return <Icon name="Spinner" className="size-3.5 text-foreground" aria-hidden="true" />;
}

function relativeTime(value: number | null): string {
  if (value === null) return "Time unavailable";
  const seconds = Math.max(0, Math.round((Date.now() - value) / 1_000));
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function workerSummary(run: GlobalRun): string {
  const { counts } = run;
  if (counts.total === 0) return "No workers recorded";
  const states = [
    counts.running > 0 ? `${counts.running} running` : null,
    counts.queued > 0 ? `${counts.queued} queued` : null,
    counts.completed > 0 ? `${counts.completed} done` : null,
    counts.failed > 0 ? `${counts.failed} failed` : null,
    counts.cancelled > 0 ? `${counts.cancelled} cancelled` : null,
  ].filter((value): value is string => value !== null);
  return `${counts.total} ${counts.total === 1 ? "worker" : "workers"}${
    states.length > 0 ? ` · ${states.join(" · ")}` : ""
  }`;
}

function ownerLabel(run: GlobalRun): string {
  if (!run.owner) return "Outside bb";
  return run.owner.threadTitle ?? run.owner.threadId;
}

function RunCard({
  run,
  expanded,
  onToggle,
  onOpenThread,
}: {
  run: GlobalRun;
  expanded: boolean;
  onToggle(): void;
  onOpenThread(): void;
}) {
  const name = workflowName(run);
  const { detail, overview } = workflowProgressForAgents(run.agents, run.phases);
  const settled = /^(completed|failed|cancelled)$/i.test(run.status);
  const terminalState = /fail|error/i.test(run.status)
    ? "failed"
    : /cancel|interrupt/i.test(run.status)
      ? "cancelled"
      : settled
        ? "completed"
        : undefined;
  const canOpenThread = run.owner?.threadAvailable === true;

  return (
    <article className="overflow-hidden rounded-lg border border-border bg-surface-raised-solid">
      <div className="flex min-w-0 items-stretch">
        <button
          type="button"
          aria-expanded={expanded}
          aria-label={`${expanded ? "Hide" : "Show"} details for ${name}`}
          onClick={onToggle}
          className="min-w-0 flex-1 cursor-pointer px-3 py-2.5 text-left transition-colors hover:bg-state-hover"
        >
          <span className="flex min-w-0 items-center gap-2">
            <StatusIcon status={run.status} />
            <span className="min-w-0 flex-1 truncate font-medium text-foreground" title={name}>
              {name}
            </span>
            <span
              className={cn(
                "shrink-0 text-xs font-medium",
                /fail|error/i.test(run.status)
                  ? "text-destructive-text"
                  : isActive(run)
                    ? "text-foreground"
                    : "text-muted-foreground",
              )}
            >
              {statusLabel(run.status)}
            </span>
            <Icon
              name="ChevronDown"
              className={cn(
                "size-3.5 shrink-0 text-muted-foreground transition-transform",
                expanded && "rotate-180",
              )}
              aria-hidden="true"
            />
          </span>
          <span className="mt-1 flex min-w-0 items-center gap-1.5 pl-5 text-xs text-muted-foreground">
            <span className="min-w-0 truncate" title={ownerLabel(run)}>
              {ownerLabel(run)}
            </span>
            <span aria-hidden="true">·</span>
            <span className="shrink-0" title={run.runId}>
              {relativeTime(run.updatedAt ?? run.createdAt)}
            </span>
          </span>
          <span className="mt-1 block truncate pl-5 text-xs tabular-nums text-muted-foreground">
            {workerSummary(run)}
          </span>
        </button>
        <button
          type="button"
          disabled={!canOpenThread}
          onClick={onOpenThread}
          aria-label={
            canOpenThread
              ? `Open thread ${ownerLabel(run)}`
              : run.owner
                ? "Owning thread is unavailable"
                : "Workflow has no owning bb thread"
          }
          title={
            canOpenThread
              ? "Open owning thread"
              : run.owner
                ? "Owning thread is unavailable"
                : "Started outside a bb thread"
          }
          className="w-24 shrink-0 border-l border-border px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-state-hover hover:text-foreground disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-transparent"
        >
          {canOpenThread ? "Open thread" : run.owner ? "Unavailable" : "Outside bb"}
        </button>
      </div>
      <WorkflowPhaseStrip progress={overview} settled={settled} className="px-3 pb-2" />
      {expanded ? (
        <div className="border-t border-border bg-popover px-3 py-2.5">
          <div className="mb-2 font-mono text-[11px] text-muted-foreground">
            {run.runId}
          </div>
          <WorkflowProgress
            collapsiblePhases
            progress={detail}
            settled={settled}
            terminalState={terminalState}
          />
        </div>
      ) : null}
    </article>
  );
}

export function OmegacodeOverview(_props: PluginNavPanelProps) {
  const rpc = useRpc<typeof rpcContract>();
  const navigate = useBbNavigate();
  const realtimeState = useRealtimeConnectionState();
  const previousRealtimeState = useRef(realtimeState);
  const requestSequence = useRef(0);
  const loading = useRef(false);
  const [runs, setRuns] = useState<GlobalRun[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<RunFilter>("all");
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null);
  const [, refreshTime] = useState(0);

  const load = useCallback(async () => {
    if (loading.current) return;
    const sequence = ++requestSequence.current;
    loading.current = true;
    try {
      const response = await rpc.call("allRuns", {});
      if (requestSequence.current === sequence) {
        setRuns(response.runs);
        setError(null);
      }
    } catch (cause) {
      if (requestSequence.current === sequence) {
        setError(cause instanceof Error ? cause.message : "Could not load workflows");
      }
    } finally {
      loading.current = false;
    }
  }, [rpc]);

  useEffect(() => {
    void load();
  }, [load]);
  useRealtime("omegacode", () => void load());
  useEffect(() => {
    if (
      previousRealtimeState.current !== "connected" &&
      realtimeState === "connected"
    ) {
      void load();
    }
    previousRealtimeState.current = realtimeState;
  }, [load, realtimeState]);
  useEffect(() => {
    const timer = window.setInterval(() => void load(), 10_000);
    return () => window.clearInterval(timer);
  }, [load]);
  useEffect(() => {
    const timer = window.setInterval(() => refreshTime((value) => value + 1), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const visibleRuns = useMemo(
    () => (runs ?? []).filter((run) => matchesFilter(run, filter)),
    [filter, runs],
  );
  const activeCount = (runs ?? []).filter(isActive).length;
  const attentionCount = (runs ?? []).filter(needsAttention).length;

  return (
    <main className="flex h-full min-h-0 flex-col bg-background text-sm text-foreground">
      <header className="shrink-0 border-b border-border px-4 py-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">Across threads</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Every machine-local Omegacode workflow, with its owning bb thread when available.
            </p>
          </div>
          <div className="text-xs tabular-nums text-muted-foreground">
            {runs?.length ?? 0} total · {activeCount} active · {attentionCount} attention
          </div>
        </div>
        <div className="mt-3 flex items-center gap-1" role="group" aria-label="Filter workflows by status">
          {FILTERS.map((option) => (
            <button
              key={option.id}
              type="button"
              aria-pressed={filter === option.id}
              onClick={() => setFilter(option.id)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                filter === option.id
                  ? "bg-state-active text-foreground"
                  : "text-muted-foreground hover:bg-state-hover hover:text-foreground",
              )}
            >
              {option.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => void load()}
            className="ml-auto rounded-md px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-state-hover hover:text-foreground"
          >
            Refresh
          </button>
        </div>
      </header>

      {error ? (
        <div className="flex shrink-0 items-center gap-2 border-b border-border bg-popover px-4 py-2 text-xs text-destructive-text" role="alert">
          <span className="min-w-0 flex-1 truncate">{error}</span>
          <button type="button" onClick={() => void load()} className="font-medium underline-offset-2 hover:underline">
            Retry
          </button>
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {runs === null && error === null ? (
          <div className="grid min-h-40 place-items-center text-sm text-muted-foreground" role="status">
            Loading workflows…
          </div>
        ) : visibleRuns.length === 0 ? (
          <div className="grid min-h-40 place-items-center px-6 text-center">
            <div>
              <p className="font-medium text-foreground">
                {runs?.length === 0 ? "No workflows yet" : "No workflows match this filter"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {runs?.length === 0
                  ? "Start Omegacode from a bb thread and its run will appear here."
                  : "Choose All to return to the complete history."}
              </p>
            </div>
          </div>
        ) : (
          <ol className="space-y-2" aria-label="Omegacode workflows">
            {visibleRuns.map((run) => (
              <li key={run.runId}>
                <RunCard
                  run={run}
                  expanded={expandedRunId === run.runId}
                  onToggle={() =>
                    setExpandedRunId((current) => (current === run.runId ? null : run.runId))
                  }
                  onOpenThread={() => {
                    if (run.owner?.threadAvailable) navigate.toThread(run.owner.threadId);
                  }}
                />
              </li>
            ))}
          </ol>
        )}
      </div>
    </main>
  );
}
