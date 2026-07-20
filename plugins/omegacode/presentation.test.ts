import { describe, expect, it } from "vitest";

import {
  agentDisplayLabel,
  workflowAgentState,
  workflowProgressForAgents,
  type Agent,
} from "./presentation";

function agent(overrides: Partial<Agent> = {}): Agent {
  return {
    index: 1,
    label: "audit:Design Doctrine",
    phase: "Audit",
    provider: "codex",
    model: "gpt-5.6-sol",
    state: "running",
    startedAt: 10,
    bytes: 120,
    tokens: 30,
    durationMs: 40,
    ...overrides,
  };
}

describe("Omegacode workflow presentation", () => {
  it("derives phase names and labels from journal data", () => {
    const progress = workflowProgressForAgents(
      [
        agent(),
        agent({
          index: 2,
          label: "synthesize:monorepo",
          phase: "Synthesize",
          state: "queued",
        }),
      ],
      ["Prepare", "Audit", "Synthesize"],
    );

    expect(progress.overview.phases).toEqual([
      { index: 0, title: "Prepare" },
      { index: 1, title: "Audit" },
      { index: 2, title: "Synthesize" },
    ]);
    expect(progress.overview.agents.map(({ label, phaseIndex }) => ({
      label,
      phaseIndex,
    }))).toEqual([
      { label: "audit:Design Doctrine", phaseIndex: 1 },
      { label: "synthesize:monorepo", phaseIndex: 2 },
    ]);
  });

  it("uses recorded provider metadata without invented defaults", () => {
    const progress = workflowProgressForAgents([
      agent({ provider: null, model: null }),
    ]);

    expect(progress.detail.agents[0]?.metadata).toEqual([]);
    expect(progress.detail.agents[0]?.model).toBe("");
    expect(agentDisplayLabel(agent({ phase: null }))).toBe(
      "audit:Design Doctrine",
    );
  });

  it("maps terminal states and enforces the detail-row cap", () => {
    expect(workflowAgentState("interrupted")).toBe("cancelled");
    expect(workflowAgentState("failed")).toBe("failed");
    expect(workflowAgentState("skipped")).toBe("skipped");
    expect(workflowAgentState("done")).toBe("done");

    const agents = Array.from({ length: 20 }, (_, index) =>
      agent({ index: index + 1, label: `Audit:worker-${index + 1}` }),
    );
    const progress = workflowProgressForAgents(agents);
    expect(progress.overview.agents).toHaveLength(20);
    expect(progress.detail.agents).toHaveLength(16);
  });
});
