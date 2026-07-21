// bb-plugin-omega — omegacode command center.
import { useCallback, useEffect, useRef, useState } from "react";
import { WorkflowCircle03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  definePluginApp,
  useRealtime,
  useRealtimeConnectionState,
  useRpc,
} from "@bb/plugin-sdk/app";
import { OmegacodeOverview } from "./global-page";
import type { Run, rpcContract } from "./server";
import {
  activityIconClass,
  activityMetaClass,
  activityRowClass,
  activityTextClass,
} from "./vendor/activity-row-styles";
import { cn } from "./vendor/cn";
import { Icon } from "./vendor/icon";
import {
  WorkflowPhaseStrip,
  WorkflowProgress,
} from "./vendor/workflow-progress";
import { workflowProgressForAgents } from "./presentation";

function elapsed(from: number | null): string {
  if (!from) return "";
  const s = Math.max(0, Math.round((Date.now() - from) / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h${m % 60}m`;
}

function verticalScrollContainer(element: HTMLElement | null): HTMLElement | null {
  let current = element?.parentElement ?? null;
  while (current) {
    const overflowY = getComputedStyle(current).overflowY;
    if (overflowY === "auto" || overflowY === "scroll") return current;
    current = current.parentElement;
  }
  return null;
}

function BannerCard({ runs }: { runs: Run[] }) {
  const [open, setOpen] = useState(false);
  const head = [...runs].sort(
    (left, right) =>
      (right.createdAt ?? 0) - (left.createdAt ?? 0) ||
      right.runId.localeCompare(left.runId),
  )[0];
  if (!head) return null;

  const c = head.counts;
  const workflowName = head.workflowName ?? head.workflow?.replace(/\.workflow\.js$|\.js$/, "") ?? "workflow";
  const startedAt =
    head.agents
      .map((agent) => agent.startedAt)
      .filter((value): value is number => value !== null)
      .sort((left, right) => left - right)[0] ?? null;
  const representativeAgent =
    head.agents.find((agent) => agent.state === "running") ??
    head.agents.find((agent) => agent.state === "queued") ??
    head.agents[0];
  const runContext = [
    representativeAgent?.phase,
    representativeAgent?.provider,
    representativeAgent?.model,
  ].filter((value): value is string => Boolean(value));
  const { detail: snapshot, overview: phaseSnapshot } =
    workflowProgressForAgents(head.agents, head.phases);
  const settled = /^(completed|failed|cancelled)$/i.test(head.status);
  const terminalState = /fail|error/i.test(head.status)
    ? "failed"
    : /cancel|interrupt/i.test(head.status)
      ? "cancelled"
      : settled
        ? "completed"
        : undefined;
  const statusLabel = /fail|error/i.test(head.status)
    ? "Workflow failed"
    : /cancel|interrupt/i.test(head.status)
      ? "Workflow cancelled"
      : settled
        ? "Workflow complete"
        : "Running workflow";
  const toggleOpen = (button: HTMLButtonElement) => {
    const holder = button.closest("[data-omega-banner]") as HTMLElement | null;
    const promptBox = holder?.closest(".chat-prompt-box") as HTMLElement | null;
    const scrollContainer = verticalScrollContainer(promptBox);
    const beforeGap =
      promptBox && scrollContainer
        ? scrollContainer.getBoundingClientRect().bottom -
          promptBox.getBoundingClientRect().bottom
        : null;

    setOpen((value) => !value);
    if (!promptBox || !scrollContainer || beforeGap === null) return;

    const restoreBottomGap = () => {
      const afterGap =
        scrollContainer.getBoundingClientRect().bottom -
        promptBox.getBoundingClientRect().bottom;
      const drift = afterGap - beforeGap;
      if (Math.abs(drift) > 1) scrollContainer.scrollTop -= drift;
    };
    requestAnimationFrame(() => requestAnimationFrame(restoreBottomGap));
    window.setTimeout(restoreBottomGap, 220);
  };

  return (
    <div className="w-full overflow-hidden rounded-lg border border-border bg-surface-raised-solid text-sm">
      <button
        type="button"
        aria-expanded={open}
        onClick={(event) => toggleOpen(event.currentTarget)}
        className={activityRowClass(
          "active",
          "flex min-h-11 w-full min-w-0 cursor-pointer flex-col items-stretch gap-1 rounded-none px-3 py-1.5 text-foreground shadow-none ring-0 transition-colors hover:bg-background/80",
        )}
      >
        <span className="flex min-w-0 items-center gap-1.5">
          <HugeiconsIcon
            icon={WorkflowCircle03Icon}
            size={14}
            strokeWidth={1.5}
            className={activityIconClass("active", "size-3.5 shrink-0")}
            aria-hidden="true"
          />
          <span
            className={activityTextClass(
              "active",
              "shrink-0 whitespace-nowrap text-sm font-semibold no-underline",
            )}
          >
            {statusLabel}
          </span>
          <span
            aria-hidden="true"
            className="shrink-0 text-sm text-muted-foreground/50"
          >
            ·
          </span>
          <span
            className="min-w-0 truncate text-sm font-semibold text-foreground"
            title={workflowName}
          >
            {workflowName}
          </span>
          {startedAt === null ? null : (
            <span
              className={activityMetaClass(
                "active",
                "ml-auto w-10 shrink-0 text-right text-xs tabular-nums",
              )}
            >
              {elapsed(startedAt)}
            </span>
          )}
          <Icon
            name="ChevronDown"
            className={cn(
              activityIconClass("active"),
              "size-3.5 shrink-0 transition-transform duration-200",
              open && "rotate-180",
            )}
            aria-hidden="true"
          />
        </span>
        <span className="flex min-w-0 items-center gap-1.5 pl-5">
          <span
            className={activityMetaClass(
              "active",
              "shrink-0 whitespace-nowrap text-xs font-medium tabular-nums",
            )}
          >
            {c.total} workers
          </span>
          {runContext.length > 0 ? (
            <>
              <span
                aria-hidden="true"
                className="shrink-0 text-xs text-muted-foreground/40"
              >
                ·
              </span>
              <span
                className={activityMetaClass(
                  "active",
                  "min-w-0 truncate whitespace-nowrap text-xs",
                )}
                title={runContext.join(" · ")}
              >
                {runContext.join(" · ")}
              </span>
            </>
          ) : null}
          <span
            className={activityMetaClass(
              "active",
              "ml-auto flex shrink-0 items-center gap-1 whitespace-nowrap text-xs tabular-nums",
            )}
          >
            <span className="font-medium text-foreground">
              {c.running} running
            </span>
            <span aria-hidden="true">·</span>
            <span>{c.queued} queued</span>
            <span aria-hidden="true">·</span>
            <span>{c.completed} done</span>
            <span aria-hidden="true">·</span>
            <span className={cn(c.failed > 0 && "text-destructive-text")}>
              {c.failed} failed
            </span>
            {c.cancelled > 0 ? (
              <>
                <span aria-hidden="true">·</span>
                <span>{c.cancelled} cancelled</span>
              </>
            ) : null}
          </span>
        </span>
      </button>
      <WorkflowPhaseStrip
        progress={phaseSnapshot}
        settled={settled}
        className="px-3 pb-2"
      />
      {open ? (
        <div className="border-t border-border/70 bg-popover">
          <div
            data-detail-scroll-area="base"
            className="max-h-80 overflow-y-auto px-2.5 py-2"
          >
            <WorkflowProgress
              collapsiblePhases
              progress={snapshot}
              settled={settled}
              terminalState={terminalState}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function OmegacodeBanner({ threadId }: { threadId: string | null }) {
  const rpc = useRpc<typeof rpcContract>();
  const realtimeState = useRealtimeConnectionState();
  const [snapshot, setSnapshot] = useState<{
    threadId: string;
    runs: Run[];
  } | null>(null);
  const activeThreadId = useRef(threadId);
  activeThreadId.current = threadId;
  const requestSequence = useRef(0);
  const loadingThreadId = useRef<string | null>(null);
  const previousRealtimeState = useRef(realtimeState);
  const [, force] = useState(0);

  const scoped = typeof threadId === "string" && threadId !== "";
  const runs = snapshot?.threadId === threadId ? snapshot.runs : [];

  const load = useCallback(async () => {
    if (typeof threadId !== "string" || threadId === "") return;
    const requestedThreadId = threadId;
    if (loadingThreadId.current === requestedThreadId) return;
    const sequence = ++requestSequence.current;
    loadingThreadId.current = requestedThreadId;
    try {
      const res = await rpc.call("runs", { threadId: requestedThreadId });
      if (
        activeThreadId.current === requestedThreadId &&
        requestSequence.current === sequence
      ) {
        setSnapshot({
          threadId: requestedThreadId,
          runs: res.runs as Run[],
        });
      }
    } catch {
      /* Keep a same-thread snapshot, but never expose it in another thread. */
    } finally {
      if (loadingThreadId.current === requestedThreadId) {
        loadingThreadId.current = null;
      }
    }
  }, [rpc, threadId]);

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
    if (!scoped) return;
    const timer = window.setInterval(() => void load(), 5000);
    return () => window.clearInterval(timer);
  }, [load, scoped]);
  useEffect(() => {
    if (!scoped) return;
    const t = setInterval(() => force((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [scoped]);

  if (!scoped) return null;
  return <BannerCard runs={runs} />;
}

export default definePluginApp((app) => {
  app.slots.navPanel({
    id: "workflows",
    title: "Omegacode",
    icon: "Omega",
    path: "omegacode",
    component: OmegacodeOverview,
  });
  app.slots.experimental_composerStatus({
    id: "omegacode-banner",
    component: OmegacodeBanner,
  });
});
