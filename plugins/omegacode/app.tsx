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
import { definePluginApp, useRealtime, useRpc, useSettings } from "@bb/plugin-sdk/app";
import type { rpcContract } from "./server";
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
  type WorkflowProgressAgent,
  type WorkflowProgressAgentState,
  type WorkflowProgressSnapshot,
} from "./vendor/workflow-progress";

const AGENT_CAP = 16; // never render an unbounded agent list in the banner

type Agent = {
  index: number;
  label: string;
  phase: string | null;
  provider: string | null;
  model: string | null;
  state: string;
  startedAt: number | null;
  bytes: number;
  tokens: number;
  durationMs: number;
};

type Run = {
  runId: string;
  workflow: string | null;
  workflowName: string | null;
  status: string;
  updatedAt: number | null;
  heartbeatAgeMs: number | null;
  counts: { total: number; running: number; queued: number; completed: number; failed: number };
  agents: Agent[];
};

function elapsed(from: number | null): string {
  if (!from) return "";
  const s = Math.max(0, Math.round((Date.now() - from) / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h${m % 60}m`;
}

const PHASES = [
  { index: 0, title: "Build" },
  { index: 1, title: "Verify" },
] as const;

const SECTION_LABELS = {
  A: "Editor nodes",
  B: "App chrome",
  C: "Collaboration + cursors",
  D: "Comments",
  E: "Suggestions",
  F: "History + versions",
  G: "Auth + sharing",
  H: "CLI + converter",
  I: "Search + navigation",
  J: "Deliverables",
} as const;

type SectionLetter = keyof typeof SECTION_LABELS;

function agentSection(agent: Agent): SectionLetter | null {
  const label = agent.label.replace(/^(build|verify):/, "");
  const match = /^([A-J])(?:-|$)/i.exec(label);
  if (!match) return null;
  const letter = match[1]?.toUpperCase();
  return letter && letter in SECTION_LABELS ? (letter as SectionLetter) : null;
}

function liveHeadline(run: Run, fallback: string): string {
  const runningSection = run.agents
    .filter((agent) => agent.state === "running" && agentSection(agent) !== null)
    .sort((left, right) => left.index - right.index)
    .map(agentSection)[0];
  const section =
    runningSection ??
    run.agents
      .filter(
        (agent) => agent.startedAt !== null && agentSection(agent) !== null,
      )
      .sort(
        (left, right) =>
          (right.startedAt ?? 0) - (left.startedAt ?? 0) ||
          right.index - left.index,
      )
      .map(agentSection)[0];
  return section
    ? `section ${section} — ${SECTION_LABELS[section]}`
    : fallback;
}

function workflowAgentState(state: string): WorkflowProgressAgentState {
  if (state === "running") return "running";
  if (state === "completed") return "done";
  if (/fail|error/i.test(state)) return "failed";
  return "queued";
}

function agentSortPriority(state: string): number {
  if (state === "running") return 0;
  if (/fail|error/i.test(state)) return 1;
  if (state === "queued") return 2;
  return 3;
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
  // With several live runs (build farm + verify side-runs), show the one with the
  // most ACTIVE work, not the most recently created — a 2-agent side-run must not
  // hide a 115-row sweep.
  const head = [...runs].sort(
    (a, b) =>
      b.counts.running + b.counts.queued - (a.counts.running + a.counts.queued),
  )[0];
  if (!head) return null;

  const c = head.counts;
  const workflowName = head.workflowName ?? head.workflow?.replace(/\.workflow\.js$|\.js$/, "") ?? "workflow";
  const name = liveHeadline(head, workflowName);
  const startedAt =
    head.agents
      .map((agent) => agent.startedAt)
      .filter((value): value is number => value !== null)
      .sort((left, right) => left - right)[0] ?? null;
  const workerProvider = head.agents[0]?.provider || "codex";
  const workerModel = head.agents[0]?.model || "gpt-5.6-sol";
  const cappedAgents = PHASES.flatMap((phase) =>
    head.agents
      .filter((agent) =>
        phase.index === 1 ? agent.phase === "Verify" : agent.phase !== "Verify",
      )
      .sort(
        (left, right) =>
          agentSortPriority(left.state) - agentSortPriority(right.state) ||
          right.index - left.index,
      )
      .slice(0, AGENT_CAP),
  );
  const toProgressAgent = (agent: Agent): WorkflowProgressAgent => {
    const section = agentSection(agent);
    return {
      index: agent.index,
      label: agent.label.replace(/^(build|verify):/, ""),
      description: section ? SECTION_LABELS[section] : undefined,
      state: workflowAgentState(agent.state),
      model: agent.model || "gpt-5.6-sol",
      metadata: [
        agent.provider || "codex",
        agent.model || "gpt-5.6-sol",
        "xhigh",
      ],
      phaseIndex: agent.phase === "Verify" ? 1 : 0,
      attempt: 1,
      cached: false,
      lastProgressAt: agent.startedAt || Date.now(),
      tokens: agent.tokens,
      outputBytes: agent.bytes,
      durationMs: agent.durationMs,
    };
  };
  const agents = cappedAgents.map(toProgressAgent);
  const snapshot: WorkflowProgressSnapshot = { phases: PHASES, agents };
  const phaseSnapshot: WorkflowProgressSnapshot = {
    phases: PHASES,
    agents: head.agents.map(toProgressAgent),
  };
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
            Running workflow
          </span>
          <span
            aria-hidden="true"
            className="shrink-0 text-sm text-muted-foreground/50"
          >
            ·
          </span>
          <span
            className="min-w-0 truncate text-sm font-semibold text-foreground"
            title={name}
          >
            {name}
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
            title={`${workerProvider} · ${workerModel}`}
          >
            {workerProvider} · {workerModel}
          </span>
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
          </span>
        </span>
      </button>
      <WorkflowPhaseStrip
        progress={phaseSnapshot}
        settled={false}
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
              settled={false}
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
    // The prompt stack is React-owned and may reconcile away foreign siblings
    // or replace the wrapper entirely. Coalesce subtree changes and restore the
    // scoped mount against the accessory's current ancestry.
    let frame = 0;
    const observer = new MutationObserver(() => {
      if (frame !== 0) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        mount();
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
    setTarget(holder);

    return () => {
      observer.disconnect();
      if (frame !== 0) cancelAnimationFrame(frame);
      holder.remove();
      setTarget(null);
    };
  }, [anchor]);

  return target;
}

function OmegaBanner({ threadId }: { threadId: string | null }) {
  const rpc = useRpc<typeof rpcContract>();
  const { values } = useSettings();
  const [runs, setRuns] = useState<Run[]>([]);
  const [, force] = useState(0);
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  const pinnedThreadId = typeof values?.threadId === "string" ? values.threadId : "";
  const routeThreadId =
    typeof window === "undefined"
      ? null
      : window.location.pathname.match(/\/threads\/([^/?#]+)/)?.[1] ?? null;
  // Only render in the one pinned thread's composer — not above every prompt box.
  const scoped =
    pinnedThreadId !== "" &&
    (threadId === pinnedThreadId || routeThreadId === pinnedThreadId);

  const load = useCallback(async () => {
    if (!scoped) return;
    try {
      const res = await rpc.call("runs");
      setRuns(res.runs as Run[]);
    } catch {
      /* keep last snapshot */
    }
  }, [rpc, scoped]);

  useEffect(() => {
    void load();
  }, [load]);
  useRealtime("omega", () => void load());
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
  // The plugin lives ONLY above the prompt box of the thread it's used in —
  // no sidebar page.
  app.slots.composerAccessory({ id: "omega-banner", component: OmegaBanner });
});
