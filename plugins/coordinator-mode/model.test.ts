import { describe, expect, it } from "vitest";

import type { CoordinatorItem, CoordinatorTemplate, LogEntry, PendingApproval } from "./contracts";
import {
  advanceItem,
  approvalCardContent,
  approvalCardRef,
  briefingHeadline,
  briefingLede,
  classifyUnmatchedCommand,
  describeRule,
  composeBriefing,
  decideAction,
  evaluateCheck,
  instructionsFor,
  itemStatusLine,
  MAX_INSTRUCTIONS_LENGTH,
  matchGatedCommands,
  parseCardRef,
  qaCardContent,
  qaCardRef,
  renderBriefingMarkdown,
} from "./model";
import { BUILT_IN_TEMPLATES } from "./templates";

const template = (id: string): CoordinatorTemplate => BUILT_IN_TEMPLATES.find((candidate) => candidate.id === id)!;
const SHIP = template("ship");

function item(overrides: Partial<CoordinatorItem> = {}): CoordinatorItem {
  return {
    id: "item_1",
    coordinatorThreadId: "thr_coord",
    title: "Nav buttons",
    stageIndex: 0,
    status: "active",
    reason: null,
    link: null,
    primaryThreadId: "thr_primary",
    helperThreadIds: [],
    proposed: false,
    summary: null,
    waitingOn: null,
    pr: null,
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  };
}

describe("decideAction", () => {
  it("never merges before Review passes", () => {
    for (const stageIndex of [1, 2, 3]) {
      const decision = decideAction(SHIP.rules, "merge_pr", { template: SHIP, item: item({ stageIndex }) });
      expect(decision.column).toBe("never");
      expect(decision.rule).toMatchObject({ condition: { kind: "before_stage_passes", stage: "Review" } });
    }
  });

  it("never merges while another merge is running, even after Review passed", () => {
    const decision = decideAction(SHIP.rules, "merge_pr", { template: SHIP, item: item({ stageIndex: 4 }), mergeRunning: true });
    expect(decision.column).toBe("never");
    expect(decision.rule).toMatchObject({ condition: { kind: "while_merge_running" } });
  });

  it("merges alone once Review passed and nothing else is merging", () => {
    const decision = decideAction(SHIP.rules, "merge_pr", { template: SHIP, item: item({ stageIndex: 4 }), mergeRunning: false });
    expect(decision.column).toBe("alone");
    expect(decision.rule).toEqual({ kind: "gated", action: "merge_pr", column: "alone" });
  });

  it("checks never before ask before alone regardless of rule order", () => {
    const rules = [
      { kind: "gated", action: "merge_pr", column: "alone" },
      { kind: "gated", action: "merge_pr", column: "ask" },
      { kind: "gated", action: "merge_pr", column: "never" },
    ] as const;
    expect(decideAction([...rules], "merge_pr", { template: SHIP }).column).toBe("never");
    expect(decideAction([rules[0], rules[1]], "merge_pr", { template: SHIP }).column).toBe("ask");
  });

  it("asks before archiving a primary sub-thread and archives helpers alone", () => {
    expect(decideAction(SHIP.rules, "archive_sub_thread", { template: SHIP, isPrimaryThread: true }).column).toBe("ask");
    expect(decideAction(SHIP.rules, "archive_sub_thread", { template: SHIP, isPrimaryThread: false }).column).toBe("alone");
  });

  it("asks when no rule covers the action", () => {
    const decision = decideAction(SHIP.rules, "digest_publish", { template: SHIP });
    expect(decision).toMatchObject({ column: "ask" });
    expect(decision.rule).toBeUndefined();
    expect(decision.reason).toMatch(/No rule covers/u);
  });

  it("ignores instruction-only rules", () => {
    const release = template("release");
    expect(decideAction(release.rules, "digest_publish", { template: release }).column).toBe("ask");
    expect(decideAction(release.rules, "merge_pr", { template: release }).column).toBe("ask");
  });
});

describe("matchGatedCommands", () => {
  it.each([
    ["gh pr merge 12 --squash", "merge_pr"],
    ["cd repo && gh pr merge 12 --squash", "merge_pr"],
    ["GH_TOKEN=abc FOO=1 gh pr merge", "merge_pr"],
    ["git fetch; /opt/homebrew/bin/gh pr merge --auto", "merge_pr"],
    ["sudo -E gh pr merge 3", "merge_pr"],
    ["bash -lc 'gh pr merge 4'", "merge_pr"],
    ["npm test\ngh pr merge", "merge_pr"],
    ["bb digest publish --digest weekly", "digest_publish"],
    ["bb thread archive thr_123", "archive_sub_thread"],
    ["bb thread spawn --prompt hi", "start_sub_thread"],
    ["bb thread create --title x", "start_sub_thread"],
  ] as const)("matches %j", (command, action) => {
    expect(matchGatedCommands(command)).toEqual([action]);
  });

  it.each([
    "npm test",
    "git push origin HEAD",
    "gh pr view 12",
    "gh pr create --title merge",
    'echo "gh pr merge"',
    "grep -r 'bb digest publish' .",
    "bb thread list",
    "git commit -m 'gh pr merge later'",
  ])("does not match %j", (command) => {
    expect(matchGatedCommands(command)).toEqual([]);
  });
});

describe("evaluateCheck", () => {
  it("passes and fails CI-backed checks from PR status", () => {
    expect(evaluateCheck("ci_green", { pr: { state: "open", checks: "passing" } }).result).toBe("pass");
    expect(evaluateCheck("ci_green", { pr: { state: "open", checks: "failing" } }).result).toBe("fail");
    expect(evaluateCheck("ci_green", { pr: { state: "open", checks: "pending" } }).result).toBe("pending");
    expect(evaluateCheck("pr_open", { pr: { state: "open", checks: "none" } }).result).toBe("pass");
    expect(evaluateCheck("pr_open", { pr: null }).result).toBe("pending");
    expect(evaluateCheck("pr_merged", { pr: { state: "merged", checks: "passing" } }).result).toBe("pass");
    expect(evaluateCheck("pr_merged", { pr: { state: "open", checks: "passing" } }).result).toBe("pending");
  });

  it("uses approvals, reviews, thread state, and links", () => {
    expect(evaluateCheck("you_approve", { approved: true }).result).toBe("pass");
    expect(evaluateCheck("you_approve", { rejected: { reason: "Button overlaps" } })).toEqual({ result: "fail", reason: "Button overlaps" });
    expect(evaluateCheck("you_approve", {}).result).toBe("pending");
    expect(evaluateCheck("reviewer_passes", { review: { pass: true } }).result).toBe("pass");
    expect(evaluateCheck("reviewer_passes", { review: { pass: false, findings: "Missing test" } })).toEqual({ result: "fail", reason: "Missing test" });
    expect(evaluateCheck("thread_done", { threadStatus: "idle", pendingQuestion: false }).result).toBe("pass");
    expect(evaluateCheck("thread_done", { threadStatus: "idle", pendingQuestion: true }).result).toBe("pending");
    expect(evaluateCheck("thread_done", { threadStatus: "active" }).result).toBe("pending");
    expect(evaluateCheck("link_added", { link: "https://example.com/post" }).result).toBe("pass");
    expect(evaluateCheck("link_added", { link: "  " }).result).toBe("pending");
  });
});

describe("advanceItem", () => {
  it("moves to the next stage on pass", () => {
    const outcome = advanceItem(item({ stageIndex: 1, reason: "old" }), SHIP, { result: "pass", reason: "The PR is open." }, 50);
    expect(outcome.item).toMatchObject({ stageIndex: 2, status: "active", reason: null, updatedAt: 50 });
    expect(outcome.logKind).toBe("stage_advanced");
  });

  it("moves back one stage with the reason when you reject at Your QA", () => {
    const outcome = advanceItem(item({ stageIndex: 2 }), SHIP, { result: "fail", reason: "Button overlaps" }, 50);
    expect(outcome.item).toMatchObject({ stageIndex: 1, reason: "Button overlaps" });
    expect(SHIP.stages[outcome.item.stageIndex]?.name).toBe("Building");
    expect(outcome.logKind).toBe("stage_failed");
    expect(outcome.text).toContain("Button overlaps");
  });

  it("never moves below the first stage", () => {
    expect(advanceItem(item({ stageIndex: 0 }), SHIP, { result: "fail", reason: "x" }, 2).item.stageIndex).toBe(0);
  });

  it("marks the item done when the last stage passes", () => {
    const outcome = advanceItem(item({ stageIndex: 4 }), SHIP, { result: "pass", reason: "The PR is merged." }, 9);
    expect(outcome.item).toMatchObject({ stageIndex: 4, status: "done" });
  });

  it("leaves pending results and cut or done items unchanged", () => {
    const active = item({ stageIndex: 2 });
    expect(advanceItem(active, SHIP, { result: "pending", reason: "" }, 9)).toEqual({ item: active, logKind: null, text: "" });
    for (const status of ["cut", "done"] as const) {
      const closed = item({ stageIndex: 2, status });
      expect(advanceItem(closed, SHIP, { result: "pass", reason: "" }, 9).item).toBe(closed);
    }
  });
});

describe("briefings", () => {
  const changes: LogEntry[] = [
    { id: 2, coordinatorThreadId: "thr_coord", itemId: "a", kind: "stage_advanced", text: "A moved to Your QA", at: 30 },
  ];
  const items = [
    item({ id: "a", title: "A", stageIndex: 2, updatedAt: 30 }),
    item({ id: "b", title: "B", stageIndex: 1, updatedAt: 5 }),
    item({ id: "d", title: "D", stageIndex: 3, updatedAt: 20 }),
    item({ id: "e", title: "E", stageIndex: 4, status: "done" }),
    item({ id: "f", title: "F", stageIndex: 1, updatedAt: 2 }),
    item({ id: "g", title: "G", stageIndex: 1, status: "blocked", reason: "Denied merge", updatedAt: 3 }),
  ];
  const approvals: PendingApproval[] = [
    { id: "ap_1", coordinatorThreadId: "thr_coord", itemId: "b", action: "merge_pr", summary: "Merge PR #12", args: {}, reason: null, createdAt: 3 },
  ];
  const cardFor = (id: string) => `::action{id="${id}" thread="thr_coord"}`;

  it("lists every decision and blocker, then what's next", () => {
    const briefing = composeBriefing({ changes, items, approvals, template: SHIP });
    expect(briefing.needsYou.map(({ item: needed, why, card }) => [needed?.id, why, card])).toEqual([
      ["g", "Blocked: Denied merge", null],
      ["b", "Approve or decline: Merge PR #12", null],
      ["a", "Waiting for your approval at Your QA", null],
    ]);
    expect(briefing.next.map((next) => next.id)).toEqual(["d", "f"]);
  });

  it("renders short markdown and says nothing changed when empty", () => {
    const markdown = renderBriefingMarkdown(composeBriefing({ changes, items, approvals, template: SHIP }), SHIP);
    expect(markdown).toContain("**Since you last looked**\n- A moved to Your QA");
    expect(markdown).toContain("**Needs you**\n- **G** (Building): Blocked: Denied merge");
    expect(markdown).toContain("- **A** (Your QA): Waiting for your approval at Your QA");
    expect(markdown).toContain("**Next**\n- **D**: Review");
    const empty = composeBriefing({ changes: [], items: [], approvals: [], template: SHIP });
    expect(renderBriefingMarkdown(empty, SHIP)).toBe("Nothing changed.");
  });

  it("embeds each live card's directive on its own line and keeps text for the rest", () => {
    const cards = new Map([[qaCardRef("a", 2), cardFor("cm-qa-a")], [approvalCardRef("ap_1"), cardFor("cm-ap-1")]]);
    const briefing = composeBriefing({ changes, items, approvals, template: SHIP, cards });
    const lines = renderBriefingMarkdown(briefing, SHIP).split("\n");
    expect(lines).toContain(cardFor("cm-qa-a"));
    expect(lines).toContain(cardFor("cm-ap-1"));
    expect(lines).toContain("- **G** (Building): Blocked: Denied merge");
    expect(lines.join("\n")).not.toContain("Waiting for your approval");
    // A directive renders only as its own block.
    const at = lines.indexOf(cardFor("cm-ap-1"));
    expect([lines[at - 1], lines[at + 1]]).toEqual(["", ""]);

    const omitted = renderBriefingMarkdown(briefing, SHIP, { cards: "omit" });
    expect(omitted).not.toContain("::action");
    expect(omitted).toContain("Blocked: Denied merge");
  });

  it("writes a Briefs headline and lede", () => {
    const briefing = composeBriefing({ changes, items, approvals, template: SHIP });
    expect(briefingHeadline(briefing)).toBe("3 need you · 1 changed");
    expect(briefingHeadline(briefing, 1)).toBe("3 need you · 2 changed");
    expect(briefingLede(briefing)).toBe("G: Blocked: Denied merge");
    const quiet = composeBriefing({ changes: [], items: [], approvals: [], template: SHIP });
    expect(briefingHeadline(quiet)).toBe("0 need you · 0 changed");
    expect(briefingLede(quiet)).toBe("Nothing changed since your last brief.");
  });
});

describe("decision cards and status lines", () => {
  it("round-trips card refs", () => {
    expect(parseCardRef(qaCardRef("item-1", 2))).toEqual({ kind: "qa", itemId: "item-1", stageIndex: 2 });
    expect(parseCardRef(approvalCardRef("ap-1"))).toEqual({ kind: "approval", approvalId: "ap-1" });
    expect(parseCardRef("other:1")).toBeNull();
  });

  it("asks for QA with where approving leads", () => {
    const content = qaCardContent(item({ title: "Moss viewer plugin", stageIndex: 2, summary: "Review passed with small follow-ups.", pr: { number: 12, url: null, state: "open", checks: "passing" } }), SHIP);
    expect(content).toEqual({
      type: "decide",
      question: "Approve QA for “Moss viewer plugin”?",
      consequence: "Review passed with small follow-ups · PR #12 · CI passing. Approving moves it to Review.",
      yesLabel: "Approve",
      noLabel: "Reject",
    });
    const last = template("bug-triage");
    expect(qaCardContent(item({ stageIndex: 3 }), last).consequence).toBe("Approving marks it done.");
    expect(qaCardContent(item({ title: "x".repeat(400), summary: "y".repeat(160), stageIndex: 2 }), SHIP).question.length).toBeLessThanOrEqual(300);
  });

  it("asks for an approval with why the rules asked", () => {
    const approval: PendingApproval = {
      id: "ap_1", coordinatorThreadId: "thr_coord", itemId: null, action: "merge_pr", summary: "Merge the PR for \"Nav\"", args: {},
      reason: "Asks you first: Merge a PR.", createdAt: 1,
    };
    expect(approvalCardContent(approval)).toEqual({
      type: "decide", question: "Approve: Merge the PR for \"Nav\"?", consequence: "Asks you first: Merge a PR.", yesLabel: "Approve", noLabel: "Decline",
    });
    expect(approvalCardContent({ ...approval, reason: "r".repeat(500) }).consequence.length).toBe(300);
  });

  it("writes one status line per item", () => {
    expect(itemStatusLine(item({ stageIndex: 1, pr: { number: 327, url: null, state: "open", checks: "passing" } }), SHIP)).toBe("Building · PR #327 · CI passing");
    expect(itemStatusLine(item({ stageIndex: 1, waitingOn: "Waiting on moss-multi" }), SHIP)).toBe("Building · Waiting on moss-multi");
    expect(itemStatusLine(item({ stageIndex: 1, status: "blocked" }), SHIP)).toBe("Building · Blocked");
    expect(itemStatusLine(item({ stageIndex: 3 }), SHIP, "Working")).toBe("Review · Working");
    expect(itemStatusLine(item({ stageIndex: 3 }), SHIP)).toBe("Review");
    expect(itemStatusLine(item({ stageIndex: 4, status: "done" }), SHIP)).toBe("Merged");
    expect(itemStatusLine(item({ status: "cut" }), SHIP)).toBe("Stopped tracking");
  });
});

describe("instructionsFor", () => {
  it.each(BUILT_IN_TEMPLATES.map((candidate) => [candidate.id, candidate] as const))("%s fits and names the tools", (_id, candidate) => {
    const text = instructionsFor(candidate);
    expect(text.length).toBeLessThanOrEqual(MAX_INSTRUCTIONS_LENGTH);
    for (const tool of ["coordinator_add_item", "coordinator_update_item", "coordinator_start_sub_thread", "coordinator_archive_sub_thread", "coordinator_merge_pr", "coordinator_briefing", "coordinator_set_link"]) {
      expect(text).toContain(tool);
    }
    expect(text).toContain("Only checks advance stages");
    expect(text).toContain("Never ask for approval in prose");
    expect(text).toContain("without asking the user to confirm");
    expect(text).not.toMatch(/propose/iu);
    const withoutPrefix = candidate.intakePrefix ? text.replaceAll(candidate.intakePrefix, "") : text;
    expect(withoutPrefix).not.toMatch(/\b(hub|lead|worker)s?\b/iu);
  });

  it("marks free-text rules as not enforced", () => {
    const text = instructionsFor(template("content"));
    expect(text).toContain("Instruction only — not enforced");
    expect(text).toContain("Post anything");
    expect(text).toContain("Title sub-threads 🔥1–3");
  });

  it("stays within the cap for oversized templates", () => {
    const huge: CoordinatorTemplate = {
      ...SHIP,
      purpose: "p".repeat(5000),
      rules: Array.from({ length: 40 }, () => ({ kind: "instruction" as const, column: "never" as const, text: "x".repeat(500) })),
    };
    const text = instructionsFor(huge);
    expect(text.length).toBeLessThanOrEqual(MAX_INSTRUCTIONS_LENGTH);
    // The cap trims the template's own lists, never the communication rules.
    expect(text).toContain("put the outcome first");
    expect(text).toContain("done condition only");
  });
});

describe("classifyUnmatchedCommand", () => {
  it("denies calls into Coordinator Mode's own RPC and its off command", () => {
    expect(classifyUnmatchedCommand("bb plugin rpc call coordinator-mode approveItem --input '{}'")).toBe("self_rpc");
    expect(classifyUnmatchedCommand("curl -X POST http://127.0.0.1:1/api/v1/plugins/coordinator-mode/rpc/approveItem")).toBe("self_rpc");
    expect(classifyUnmatchedCommand("bb plugin disable coordinator-mode")).toBe("self_rpc");
    expect(classifyUnmatchedCommand("bb coordinator-mode off --thread thr_coord")).toBe("self_rpc");
    expect(classifyUnmatchedCommand("bb coordinator-mode on --thread thr_coord --template content")).toBe("self_rpc");
    expect(classifyUnmatchedCommand("curl -X POST http://127.0.0.1:1/api/v1/plugins/inline-action-cards/rpc/act")).toBe("self_rpc");
  });
  it("never auto-approves gated operations the matcher can't parse", () => {
    expect(classifyUnmatchedCommand("gh -R o/r pr merge 12")).toBe("risky");
    expect(classifyUnmatchedCommand("gh api -X PUT repos/o/r/pulls/12/merge")).toBe("risky");
    expect(classifyUnmatchedCommand("eval \"$CMD\"")).toBe("risky");
  });
  it("leaves ordinary commands alone", () => {
    expect(classifyUnmatchedCommand("npm test")).toBe("safe");
    expect(classifyUnmatchedCommand("git status")).toBe("safe");
    expect(classifyUnmatchedCommand("bb coordinator-mode status")).toBe("safe");
  });
});

describe("describeRule", () => {
  it("names primary-only archive rules naturally", () => {
    expect(describeRule({ kind: "gated", action: "archive_sub_thread", column: "ask", condition: { kind: "primary_only" } }))
      .toBe("Archive a primary sub-thread");
  });
});
