import type {
  WorkflowProgressAgent,
  WorkflowProgressAgentState,
  WorkflowProgressSnapshot,
} from "./vendor/workflow-progress";

const AGENT_CAP = 16;

export type Agent = {
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

function normalizedPhase(phase: string | null): string | null {
  const value = phase?.trim();
  return value ? value.toLocaleLowerCase() : null;
}

export function agentDisplayLabel(agent: Agent): string {
  return agent.label;
}

function workerAction(agent: Agent): string {
  const phase = agent.phase ? ` in ${agent.phase}` : "";
  if (agent.state === "running") return `${agent.label} is working${phase}`;
  if (/^(queued|pending)$/i.test(agent.state)) {
    return `${agent.label} is queued${phase}`;
  }
  if (/fail|error/i.test(agent.state)) return `${agent.label} failed${phase}`;
  if (/cancel|interrupt/i.test(agent.state)) {
    return `${agent.label} was cancelled${phase}`;
  }
  if (/^(completed|done|success|skipped)$/i.test(agent.state)) {
    return `${agent.label} finished${phase}`;
  }
  return `${agent.label} is waiting${phase}`;
}

function workerSummaryPriority(agent: Agent): number {
  if (/^running$/i.test(agent.state)) return 0;
  if (/fail|error/i.test(agent.state)) return 1;
  if (/^(queued|pending)$/i.test(agent.state)) return 2;
  if (/^(completed|done|success|skipped)$/i.test(agent.state)) return 4;
  if (/cancel|interrupt/i.test(agent.state)) return 5;
  return 3;
}

export function workerActivitySummary(agents: readonly Agent[]): string {
  if (agents.length === 0) {
    return "Worker details will appear when the run starts.";
  }
  const visible = [...agents]
    .sort(
      (left, right) =>
        workerSummaryPriority(left) - workerSummaryPriority(right) ||
        left.index - right.index,
    )
    .slice(0, 3)
    .map(workerAction);
  const remaining = agents.length - visible.length;
  return `${visible.join("; ")}${remaining > 0 ? `; plus ${remaining} more` : ""}.`;
}

export function workflowAgentState(
  state: string,
): WorkflowProgressAgentState {
  if (state === "running") return "running";
  if (/^(completed|done|success)$/i.test(state)) return "done";
  if (state === "skipped") return "skipped";
  if (/cancel|interrupt|stopp?ed/i.test(state)) return "cancelled";
  if (/fail|error/i.test(state)) return "failed";
  return "queued";
}

function agentSortPriority(state: string): number {
  if (state === "running") return 0;
  if (/fail|error/i.test(state)) return 1;
  if (state === "queued") return 2;
  return 3;
}

export function workflowProgressForAgents(
  agents: readonly Agent[],
  declaredPhases: readonly string[] = [],
): {
  detail: WorkflowProgressSnapshot;
  overview: WorkflowProgressSnapshot;
} {
  const phases: { index: number; title: string }[] = [];
  const phaseIndexes = new Map<string, number>();
  const addPhase = (title: string | null): void => {
    const phase = normalizedPhase(title);
    if (!phase || phaseIndexes.has(phase)) return;
    phaseIndexes.set(phase, phases.length);
    phases.push({ index: phases.length, title: title!.trim() });
  };
  for (const phase of declaredPhases) addPhase(phase);
  for (const agent of [...agents].sort((left, right) => left.index - right.index)) {
    addPhase(agent.phase);
  }

  const toProgressAgent = (agent: Agent): WorkflowProgressAgent => {
    const phase = normalizedPhase(agent.phase);
    return {
      index: agent.index,
      label: agentDisplayLabel(agent),
      state: workflowAgentState(agent.state),
      model: agent.model ?? "",
      metadata: [agent.provider, agent.model].filter(
        (value): value is string => value !== null && value !== "",
      ),
      phaseIndex: phase ? phaseIndexes.get(phase) : undefined,
      attempt: 1,
      cached: false,
      lastProgressAt: agent.startedAt ?? 0,
      tokens: agent.tokens,
      outputBytes: agent.bytes,
      durationMs: agent.durationMs,
    };
  };

  const allAgents = agents.map(toProgressAgent);
  const detailAgents = [...agents]
    .sort(
      (left, right) =>
        agentSortPriority(left.state) - agentSortPriority(right.state) ||
        left.index - right.index,
    )
    .slice(0, AGENT_CAP)
    .map(toProgressAgent);

  return {
    detail: { phases, agents: detailAgents },
    overview: { phases, agents: allAgents },
  };
}
