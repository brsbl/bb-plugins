// bb-plugin-omega — omegacode command center.
//
// The banner renders ABOVE the composer (like the host's "Running background
// command" banner). The plugin API only exposes a composer-FOOTER accessory
// slot, so the accessory mounts an anchor there, walks up to find its own
// composer box, and portals the banner in as that box's previous sibling.
// If the anchor can't be found (host layout changed), it falls back to
// rendering inline in the footer — never blank.
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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

/**
 * Find THIS accessory's composer box (nearest ancestor that also contains the
 * prompt input), and return a host-inserted div that sits just before it — i.e.
 * above the composer. Returns null until found; the caller falls back to inline.
 */
function useAboveComposerTarget(anchor: HTMLElement | null): HTMLElement | null {
  const [target, setTarget] = useState<HTMLElement | null>(null);

  useLayoutEffect(() => {
    if (!anchor) return;
    // Match bb's prompt-stack placement: the workflow card is a standalone
    // sibling immediately above the composer, outside its managed height.
    const holder = document.createElement("div");
    holder.dataset.omegaBanner = "1";
    holder.style.width = "100%";
    holder.style.marginBottom = "8px";
    const mount = () => {
      let el: HTMLElement | null = anchor;
      let composerBox: HTMLElement | null = null;
      let inputAncestor: HTMLElement | null = null;
      // Re-resolve from THIS accessory each time: bb may replace the composer
      // or its stack wrapper during autosize/provider updates. Prefer bb's
      // semantic promptbox form, not an inner overflow/editor wrapper.
      while (el && el.parentElement) {
        el = el.parentElement;
        if (el.querySelector("textarea, [contenteditable='true']")) {
          inputAncestor ??= el;
          if (el.tagName === "FORM") {
            composerBox = el;
            break;
          }
        }
      }
      composerBox ??= inputAncestor;
      if (!composerBox) return;

      // bb keeps native context cards and the composer unit under a spaced
      // prompt-stack layout. Mount before the direct composer unit so the
      // expanded card contributes to stack height instead of overflowing the
      // composer's constrained z-20 wrapper.
      let composerUnit = composerBox;
      let stack = composerBox.parentElement;
      while (stack && stack !== document.body) {
        if (stack.classList.contains("space-y-2")) break;
        composerUnit = stack;
        stack = stack.parentElement;
      }
      if (!stack || stack === document.body) {
        stack = composerBox.parentElement;
        composerUnit = composerBox;
      }
      if (!stack) return;
      const nativeCardStack = Array.from(stack.children).find(
        (child): child is HTMLElement =>
          child instanceof HTMLElement &&
          child !== composerUnit &&
          child.classList.contains("space-y-2"),
      );
      const mountParent = nativeCardStack ?? stack;
      const mountBefore = nativeCardStack ? null : composerUnit;
      holder.style.marginBottom = mountParent.classList.contains("space-y-2")
        ? "0px"
        : "8px";
      if (
        holder.parentElement !== mountParent ||
        holder.nextSibling !== mountBefore
      ) {
        mountParent.insertBefore(holder, mountBefore);
      }
    };
    mount();
    setTarget(holder.isConnected ? holder : null);
    // The prompt stack is React-owned and may reconcile away foreign siblings
    // or replace the wrapper entirely. Coalesce subtree changes and restore the
    // scoped mount against the accessory's current ancestry.
    let frame = 0;
    const observer = new MutationObserver(() => {
      if (frame !== 0) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        mount();
        setTarget(holder.isConnected ? holder : null);
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      if (frame !== 0) cancelAnimationFrame(frame);
      holder.remove();
      setTarget(null);
    };
  }, [anchor]);

  return target;
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
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

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

  const target = useAboveComposerTarget(scoped ? anchor : null);

  if (!scoped) return null;
  const card = <BannerCard runs={runs} />;

  // Invisible footer anchor; the visible card is portaled above THIS composer.
  // Falls back to inline (footer) if the composer box can't be located.
  return (
    <span ref={setAnchor} className="contents">
      {target ? createPortal(card, target) : card}
    </span>
  );
}


export default definePluginApp((app) => {
  app.slots.navPanel({
    id: "workflows",
    title: "Omegacode",
    icon: "Activity",
    path: "omegacode",
    component: OmegacodeOverview,
  });
  app.slots.composerAccessory({
    id: "omegacode-banner",
    component: OmegacodeBanner,
  });
});
