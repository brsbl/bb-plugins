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

import {
  workerActivitySummary,
  workflowProgressForAgents,
} from "./presentation";
import type { GlobalRun, rpcContract } from "./server";
import { cn } from "./vendor/cn";
import { Icon } from "./vendor/icon";
import {
  WorkflowPhaseStrip,
  WorkflowProgress,
} from "./vendor/workflow-progress";

type RunGroup = "active" | "attention" | "completed" | "cancelled";

type GroupedRuns = Record<RunGroup, GlobalRun[]>;

function workflowName(run: GlobalRun): string {
  return (
    run.workflowName ??
    run.workflow?.replace(/\.workflow\.js$|\.js$/, "") ??
    run.runId
  );
}

function isCompleted(run: GlobalRun): boolean {
  return /^(completed|done|success)$/i.test(run.status);
}

function isCancelled(run: GlobalRun): boolean {
  return /cancel|interrupt/i.test(run.status);
}

function needsAttention(run: GlobalRun): boolean {
  return /^(failed|stalled)$/i.test(run.status);
}

function statusLabel(status: string): string {
  if (/fail|error/i.test(status)) return "Failed";
  if (/stalled/i.test(status)) return "Stalled";
  if (/start/i.test(status)) return "Starting";
  return "Running";
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

function ownerLabel(run: GlobalRun): string {
  if (!run.owner) return "Outside bb";
  return run.owner.threadTitle ?? "Started from bb";
}

function sourceLabel(run: GlobalRun): string {
  return run.workflow ? `Source: ${run.workflow}` : "Workflow source unavailable";
}

export function workflowDescription(run: GlobalRun): string {
  if (run.description) return run.description;
  if (run.agents.length === 0) return "Omegacode is preparing this workflow.";
  const phases = [...new Set(run.agents.map((agent) => agent.phase).filter(Boolean))];
  const phaseContext = phases.length > 0 ? ` across ${phases.join(", ")}` : "";
  return `Omegacode is coordinating ${run.agents.length} ${
    run.agents.length === 1 ? "worker" : "workers"
  }${phaseContext}.`;
}

export function groupRuns(runs: readonly GlobalRun[]): GroupedRuns {
  const groups: GroupedRuns = {
    active: [],
    attention: [],
    completed: [],
    cancelled: [],
  };
  for (const run of runs) {
    if (isCompleted(run)) groups.completed.push(run);
    else if (isCancelled(run)) groups.cancelled.push(run);
    else if (needsAttention(run)) groups.attention.push(run);
    else groups.active.push(run);
  }
  return groups;
}

function LaunchContext({ run }: { run: GlobalRun }) {
  if (!run.owner) {
    return (
      <span title={sourceLabel(run)}>
        Outside bb · launched from local Omegacode · {sourceLabel(run)}
      </span>
    );
  }
  return (
    <span title={sourceLabel(run)}>
      {ownerLabel(run)} · {sourceLabel(run)}
    </span>
  );
}

function StatusIcon({ status }: { status: string }) {
  if (/fail|error/i.test(status)) {
    return <Icon name="X" className="size-3.5 text-destructive-text" aria-hidden="true" />;
  }
  if (/stalled/i.test(status)) {
    return <Icon name="Circle" className="size-3.5 text-muted-foreground" aria-hidden="true" />;
  }
  return <Icon name="Spinner" className="size-3.5 text-foreground" aria-hidden="true" />;
}

function DetailedRunCard({
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
  const terminalState = /fail|error/i.test(run.status) ? "failed" : undefined;
  const canOpenThread = run.owner?.threadAvailable === true;

  return (
    <article className="overflow-hidden rounded-lg border border-border bg-surface-raised-solid">
      <div className="flex min-w-0 flex-col sm:flex-row">
        <button
          type="button"
          aria-expanded={expanded}
          aria-label={`${expanded ? "Hide" : "Show"} details for ${name}`}
          onClick={onToggle}
          className="min-w-0 flex-1 cursor-pointer px-3 py-3 text-left transition-colors hover:bg-state-hover"
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
          <span className="mt-2 block text-xs leading-5 text-foreground">
            {workflowDescription(run)}
          </span>
          <span className="mt-1 block text-xs leading-5 text-muted-foreground">
            <span className="font-medium text-foreground">Workers: </span>
            {workerActivitySummary(run.agents)}
          </span>
          <span className="mt-1 block truncate text-xs text-muted-foreground">
            <LaunchContext run={run} />
          </span>
        </button>
        {canOpenThread ? (
          <button
            type="button"
            onClick={onOpenThread}
            aria-label={`Open ${name}'s thread ${ownerLabel(run)}`}
            className="border-t border-border px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-state-hover hover:text-foreground sm:w-28 sm:border-l sm:border-t-0"
          >
            Open thread
          </button>
        ) : null}
      </div>
      <WorkflowPhaseStrip
        progress={overview}
        settled={terminalState !== undefined}
        className="px-3 pb-2"
      />
      {expanded ? (
        <div className="border-t border-border bg-popover px-3 py-2.5">
          <div className="mb-2 font-mono text-[11px] text-muted-foreground">{run.runId}</div>
          <WorkflowProgress
            collapsiblePhases
            progress={detail}
            settled={terminalState !== undefined}
            terminalState={terminalState}
          />
        </div>
      ) : null}
    </article>
  );
}

function DetailedRunGroup({
  title,
  description,
  runs,
  expandedRunId,
  onToggle,
  onOpenThread,
}: {
  title: string;
  description: string;
  runs: readonly GlobalRun[];
  expandedRunId: string | null;
  onToggle(runId: string): void;
  onOpenThread(run: GlobalRun): void;
}) {
  if (runs.length === 0) return null;
  return (
    <section aria-labelledby={`${title.toLowerCase().replaceAll(" ", "-")}-heading`}>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <div>
          <h2
            id={`${title.toLowerCase().replaceAll(" ", "-")}-heading`}
            className="text-sm font-semibold text-foreground"
          >
            {title}
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        </div>
        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
          {runs.length}
        </span>
      </div>
      <ol className="space-y-2" aria-label={`${title} workflows`}>
        {runs.map((run) => (
          <li key={run.runId}>
            <DetailedRunCard
              run={run}
              expanded={expandedRunId === run.runId}
              onToggle={() => onToggle(run.runId)}
              onOpenThread={() => onOpenThread(run)}
            />
          </li>
        ))}
      </ol>
    </section>
  );
}

function HistoryRow({ run, onOpenThread }: { run: GlobalRun; onOpenThread(run: GlobalRun): void }) {
  const canOpenThread = run.owner?.threadAvailable === true;
  const name = workflowName(run);
  return (
    <li className="flex min-w-0 items-center gap-3 border-t border-border px-3 py-2.5 first:border-t-0">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground" title={name}>
          {name}
        </p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          <LaunchContext run={run} />
        </p>
      </div>
      <time className="shrink-0 text-xs tabular-nums text-muted-foreground">
        {relativeTime(run.updatedAt ?? run.createdAt)}
      </time>
      {canOpenThread ? (
        <button
          type="button"
          onClick={() => onOpenThread(run)}
          className="shrink-0 text-xs font-medium text-muted-foreground hover:text-foreground"
          aria-label={`Open ${name}'s thread ${ownerLabel(run)}`}
        >
          Open
        </button>
      ) : null}
    </li>
  );
}

function HistorySection({
  id,
  title,
  runs,
  onOpenThread,
}: {
  id: string;
  title: string;
  runs: readonly GlobalRun[];
  onOpenThread(run: GlobalRun): void;
}) {
  const [open, setOpen] = useState(false);
  if (runs.length === 0) return null;
  return (
    <section className="overflow-hidden rounded-lg border border-border bg-surface-raised-solid">
      <button
        type="button"
        aria-label={`${title} workflows`}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center gap-2 px-3 py-2.5 text-left transition-colors hover:bg-state-hover"
      >
        <Icon
          name="ChevronDown"
          className={cn(
            "size-3.5 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
          aria-hidden="true"
        />
        <span className="flex-1 text-sm font-medium text-foreground">{title}</span>
        <span className="text-xs tabular-nums text-muted-foreground">{runs.length}</span>
      </button>
      {open ? (
        <ol id={id} aria-label={`${title} workflows`}>
          {runs.map((run) => (
            <HistoryRow key={run.runId} run={run} onOpenThread={onOpenThread} />
          ))}
        </ol>
      ) : null}
    </section>
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
    if (previousRealtimeState.current !== "connected" && realtimeState === "connected") {
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

  const grouped = useMemo(() => groupRuns(runs ?? []), [runs]);
  const activeCount = grouped.active.length;
  const attentionCount = grouped.attention.length;
  const openThread = useCallback(
    (run: GlobalRun) => {
      if (run.owner?.threadAvailable) navigate.toThread(run.owner.threadId);
    },
    [navigate],
  );

  return (
    <main className="h-full min-h-0 overflow-y-auto bg-background text-sm text-foreground">
      <div className="mx-auto w-full max-w-4xl space-y-5 p-4 md:p-5">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">Across threads</h2>
            <p className="mt-0.5 max-w-2xl text-xs leading-5 text-muted-foreground">
              All machine-local Omegacode workflows. Live work stays detailed; completed history stays quiet.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs tabular-nums text-muted-foreground">
            <span>{runs?.length ?? 0} total · {activeCount} active · {attentionCount} attention</span>
            <button
              type="button"
              onClick={() => void load()}
              className="rounded-md px-2.5 py-1 font-medium text-muted-foreground transition-colors hover:bg-state-hover hover:text-foreground"
            >
              Refresh
            </button>
          </div>
        </header>

        {error ? (
          <div className="flex items-center gap-2 rounded-md border border-border bg-popover px-3 py-2 text-xs text-destructive-text" role="alert">
            <span className="min-w-0 flex-1 truncate">{error}</span>
            <button type="button" onClick={() => void load()} className="font-medium underline-offset-2 hover:underline">
              Retry
            </button>
          </div>
        ) : null}

        {runs === null && error === null ? (
          <div className="grid min-h-40 place-items-center text-sm text-muted-foreground" role="status">
            Loading workflows…
          </div>
        ) : runs?.length === 0 ? (
          <div className="grid min-h-40 place-items-center px-6 text-center">
            <div>
              <p className="font-medium text-foreground">No workflows yet</p>
              <p className="mt-1 max-w-sm text-xs leading-5 text-muted-foreground">
                Workflows launched from bb link back to their thread. Other local launches appear here as Outside bb.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <DetailedRunGroup
              title="Active"
              description="Current work and each worker’s next step."
              runs={grouped.active}
              expandedRunId={expandedRunId}
              onToggle={(runId) => setExpandedRunId((current) => (current === runId ? null : runId))}
              onOpenThread={openThread}
            />
            <DetailedRunGroup
              title="Needs attention"
              description="Failed or stalled work that may need a decision."
              runs={grouped.attention}
              expandedRunId={expandedRunId}
              onToggle={(runId) => setExpandedRunId((current) => (current === runId ? null : runId))}
              onOpenThread={openThread}
            />
            <HistorySection
              id="completed-workflows"
              title="Completed"
              runs={grouped.completed}
              onOpenThread={openThread}
            />
            <HistorySection
              id="cancelled-workflows"
              title="Canceled"
              runs={grouped.cancelled}
              onOpenThread={openThread}
            />
          </div>
        )}
      </div>
    </main>
  );
}
