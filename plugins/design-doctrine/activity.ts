/**
 * How the harvest activity feed describes one processed thread. Shared by the
 * server, which classifies rows, and the panel and CLI, which summarize them,
 * so the three never disagree about what a thread contributed.
 */

export type ProposalVerdict = "approved" | "rejected" | "cancelled";
export type ProposalResult =
  | "added"
  | "waiting"
  | "rejected"
  | "cancelled"
  | "undecided";
export type HarvestResult =
  | "added"
  | "waiting"
  | "rejected"
  | "cancelled"
  | "failed"
  | "none";

const RULE_ID_PATTERN = /^(?:ddr|ext)_\d{3,}$/;

export function localDayStart(now: number): number {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  return start.getTime();
}

export function ruleIdFromWrittenPath(writtenPath: string | null): string | null {
  if (!writtenPath) return null;
  const name = writtenPath.split(/[\\/]/).pop() ?? "";
  const id = name.endsWith(".md") ? name.slice(0, -3) : "";
  return RULE_ID_PATTERN.test(id) ? id : null;
}

/**
 * An approval counts as added only once its rule is in the corpus being read.
 * An approval that never reached a commit, or a rule committed to a publication
 * that has not merged, is still waiting. A null `publishedRuleIds` means the
 * corpus could not be read, so the written path is trusted.
 */
export function proposalResult(
  verdict: ProposalVerdict | null,
  writtenPath: string | null,
  publishedRuleIds: ReadonlySet<string> | null,
): { result: ProposalResult; ruleId: string | null } {
  if (verdict === "rejected") return { result: "rejected", ruleId: null };
  if (verdict === "cancelled") return { result: "cancelled", ruleId: null };
  if (verdict === null) return { result: "undecided", ruleId: null };
  const ruleId = ruleIdFromWrittenPath(writtenPath);
  if (ruleId && (!publishedRuleIds || publishedRuleIds.has(ruleId))) {
    return { result: "added", ruleId };
  }
  return { result: "waiting", ruleId };
}

function isFailedOutcome(outcome: string | null): boolean {
  return outcome?.endsWith("failed") ?? false;
}

export function harvestResult(
  outcome: string | null,
  proposals: ReadonlyArray<{ result: ProposalResult }>,
): HarvestResult {
  if (proposals.some((proposal) => proposal.result === "added")) return "added";
  if (proposals.some((proposal) => proposal.result === "waiting")) return "waiting";
  if (isFailedOutcome(outcome)) return "failed";
  if (proposals.some((proposal) => proposal.result === "cancelled")) return "cancelled";
  if (proposals.some((proposal) => proposal.result === "rejected")) return "rejected";
  return "none";
}

export interface HarvestSummary {
  label: string;
  ruleIds: string[];
  note: string | null;
}

export function harvestSummary(item: {
  result: HarvestResult;
  proposals: ReadonlyArray<{ result: ProposalResult; ruleId: string | null }>;
}): HarvestSummary {
  const count = (result: ProposalResult) =>
    item.proposals.filter((proposal) => proposal.result === result).length;
  switch (item.result) {
    case "added": {
      const waiting = count("waiting");
      return {
        label: "Added",
        ruleIds: item.proposals.flatMap((proposal) =>
          proposal.result === "added" && proposal.ruleId ? [proposal.ruleId] : [],
        ),
        note: waiting > 0 ? `${waiting} waiting to publish` : null,
      };
    }
    case "waiting":
      return { label: "Waiting to publish", ruleIds: [], note: null };
    case "failed":
      return { label: "Harvest failed", ruleIds: [], note: null };
    case "cancelled":
    case "rejected": {
      const matching = count(item.result);
      return {
        label: `${matching} ${matching === 1 ? "proposal" : "proposals"} ${item.result}`,
        ruleIds: [],
        note: null,
      };
    }
    case "none":
      return { label: "No new rules", ruleIds: [], note: null };
  }
}

export function formatHarvestSummary(summary: HarvestSummary): string {
  const head = summary.ruleIds.length
    ? `${summary.label} ${summary.ruleIds.join(", ")}`
    : summary.label;
  return summary.note ? `${head} · ${summary.note}` : head;
}
