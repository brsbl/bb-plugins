import type {
  Briefing,
  CheckKind,
  CoordinatorItem,
  CoordinatorRule,
  CoordinatorTemplate,
  GatedAction,
  ItemPullRequest,
  LogEntry,
  PendingApproval,
  RuleColumn,
  RuleCondition,
} from "./contracts";

// ---------------------------------------------------------------------------
// Rule decisions

type DecisionContext = {
  item?: CoordinatorItem;
  template: CoordinatorTemplate;
  isPrimaryThread?: boolean;
  mergeRunning?: boolean;
};

export type Decision = { column: RuleColumn; rule?: CoordinatorRule; reason: string };

type GatedRule = Extract<CoordinatorRule, { kind: "gated" }>;

export const ACTION_LABELS: Record<GatedAction, string> = {
  start_sub_thread: "start a sub-thread",
  archive_sub_thread: "archive a sub-thread",
  merge_pr: "merge a PR",
  digest_publish: "run bb digest publish",
};

export const COLUMN_LABELS: Record<RuleColumn, string> = {
  never: "Never",
  ask: "Asks you first",
  alone: "Does alone",
};

function describeCondition(condition: RuleCondition): string {
  switch (condition.kind) {
    case "before_stage_passes":
      return `before ${condition.stage} passes`;
    case "while_merge_running":
      return "while another merge is running";
    case "primary_only":
      return "primary sub-threads only";
  }
}

export function describeRule(rule: CoordinatorRule): string {
  if (rule.kind === "instruction") return rule.text;
  const action = ACTION_LABELS[rule.action];
  const label = action.charAt(0).toUpperCase() + action.slice(1);
  if (rule.condition?.kind === "primary_only") return label.replace("a sub-thread", "a primary sub-thread");
  return rule.condition ? `${label} ${describeCondition(rule.condition)}` : label;
}

function conditionHolds(condition: RuleCondition | undefined, ctx: DecisionContext): boolean {
  if (!condition) return true;
  switch (condition.kind) {
    case "before_stage_passes": {
      const { item } = ctx;
      if (!item || item.status === "done") return false;
      const stageIndex = ctx.template.stages.findIndex((stage) => stage.name === condition.stage);
      if (stageIndex < 0) return false;
      // An item sitting in stage S is still waiting on S's check.
      return item.stageIndex <= stageIndex;
    }
    case "while_merge_running":
      return ctx.mergeRunning === true;
    case "primary_only":
      return ctx.isPrimaryThread === true;
  }
}

const PRECEDENCE: readonly RuleColumn[] = ["never", "ask", "alone"];

/**
 * Decides what to do with a gated action. Never is checked first, then Ask, then
 * Alone; within a column the first matching rule wins. Unmatched actions ask.
 */
export function decideAction(rules: CoordinatorRule[], action: GatedAction, ctx: DecisionContext): Decision {
  const candidates = rules.filter((rule): rule is GatedRule => rule.kind === "gated" && rule.action === action);
  for (const column of PRECEDENCE) {
    const rule = candidates.find((candidate) => candidate.column === column && conditionHolds(candidate.condition, ctx));
    if (rule) return { column, rule, reason: `${COLUMN_LABELS[column]}: ${describeRule(rule)}.` };
  }
  return { column: "ask", reason: `No rule covers "${ACTION_LABELS[action]}", so it asks you first.` };
}

// ---------------------------------------------------------------------------
// Command matching

const PREFIX_COMMANDS = new Set(["sudo", "env", "command", "exec", "time", "nohup", "nice", "xargs"]);
const SHELLS = new Set(["sh", "bash", "zsh", "dash"]);
const ENV_ASSIGNMENT = /^[A-Za-z_][A-Za-z0-9_]*=/u;

/** Splits a shell string into segments of words, honoring quotes and escapes. */
function splitSegments(command: string): string[][] {
  const segments: string[][] = [];
  let words: string[] = [];
  let word = "";
  let inWord = false;
  let quote: "'" | '"' | null = null;

  const endWord = () => {
    if (inWord) words.push(word);
    word = "";
    inWord = false;
  };
  const endSegment = () => {
    endWord();
    if (words.length > 0) segments.push(words);
    words = [];
  };

  for (let i = 0; i < command.length; i += 1) {
    const char = command.charAt(i);
    if (quote) {
      if (char === quote) quote = null;
      else if (char === "\\" && quote === '"' && i + 1 < command.length) word += command.charAt(++i);
      else word += char;
      continue;
    }
    if (char === "'" || char === '"') {
      quote = char;
      inWord = true;
    } else if (char === "\\" && i + 1 < command.length) {
      const next = command.charAt(++i);
      if (next !== "\n") {
        word += next;
        inWord = true;
      }
    } else if (";&|\n()`".includes(char)) {
      endSegment();
    } else if (/\s/u.test(char)) {
      endWord();
    } else {
      word += char;
      inWord = true;
    }
  }
  endSegment();
  return segments;
}

function basename(word: string): string {
  const slash = word.lastIndexOf("/");
  return slash >= 0 ? word.slice(slash + 1) : word;
}

function matchWords(words: string[], depth: number): GatedAction[] {
  let start = 0;
  while (start < words.length) {
    const current = words[start] ?? "";
    if (ENV_ASSIGNMENT.test(current)) start += 1;
    else if (PREFIX_COMMANDS.has(basename(current))) {
      start += 1;
      // Skip the prefix command's own flags, e.g. `sudo -u me` or `env -i`.
      while (start < words.length && (words[start] ?? "").startsWith("-")) start += 1;
    } else break;
  }
  const program = basename(words[start] ?? "");
  const rest = words.slice(start + 1);

  if (SHELLS.has(program) && depth < 3) {
    const flag = rest.findIndex((word) => /^-[a-z]*c[a-z]*$/u.test(word));
    const script = flag >= 0 ? rest[flag + 1] : undefined;
    return script ? matchCommandDepth(script, depth + 1) : [];
  }

  const positional = rest.filter((word) => !word.startsWith("-"));
  const [first, second] = positional;
  if (program === "gh" && first === "pr" && second === "merge") return ["merge_pr"];
  if (program === "bb" && first === "digest" && second === "publish") return ["digest_publish"];
  if (program === "bb" && first === "thread" && second === "archive") return ["archive_sub_thread"];
  if (program === "bb" && first === "thread" && (second === "spawn" || second === "create")) return ["start_sub_thread"];
  return [];
}

function matchCommandDepth(command: string, depth: number): GatedAction[] {
  return splitSegments(command).flatMap((words) => matchWords(words, depth));
}

/**
 * Second line of defense for commands `matchGatedCommands` doesn't recognize.
 * "self_rpc" reaches Coordinator Mode's own RPC or HTTP surface, Action Cards' RPC (whose clicks
 * carry Coordinator Mode's decisions), or its `off` CLI command, which an agent could use to approve
 * its own items or drop its rules, so it is always denied. "risky" mentions a
 * gated operation in a form the matcher can't parse, so it is never approved
 * automatically. Everything else is "safe".
 */
export function classifyUnmatchedCommand(command: string): "self_rpc" | "risky" | "safe" {
  if (/\bplugin\s+rpc\b|\/plugins\/(?:coordinator-mode|inline-action-cards\/rpc)\b|\bplugin\s+(?:run|disable|remove|uninstall|config)\s+coordinator-mode\b|\bcoordinator-mode\s+(?:on|off)\b/i.test(command)) {
    return "self_rpc";
  }
  if (
    /\bmerge\b|\beval\b|\bdigest\s+publish\b|\bthread\s+(?:archive|spawn|create|delete)\b/i.test(command) ||
    /\bgh\s+api\b[\s\S]*(?:-X|--method)\s*(?:PUT|POST|PATCH|DELETE)\b/i.test(command)
  ) {
    return "risky";
  }
  return "safe";
}

/**
 * Best-effort detection of a gated action in a shell command. The command is split
 * on `&&`, `||`, `;`, `|`, `&`, parentheses, backticks, and newlines outside quotes;
 * leading env assignments and wrappers like `sudo` or `env` are skipped, and
 * `bash -c "..."` is inspected recursively. Quoted text such as `echo "gh pr merge"`
 * is not a match.
 *
 * Limits: `$(...)` inside double quotes, aliases, shell functions, scripts that
 * call these commands, `eval`, and flags that take a value before the subcommand
 * (`gh -R o/r pr merge`) are not detected. Every gated command in the string is returned, in order.
 */
export function matchGatedCommands(command: string): GatedAction[] {
  return [...new Set(matchCommandDepth(command, 0))];
}

// ---------------------------------------------------------------------------
// Stage checks

export type CheckEvidence = {
  threadStatus?: string;
  pendingQuestion?: boolean;
  pr?: {
    state: "open" | "closed" | "merged" | "draft";
    checks: "passing" | "failing" | "pending" | "none";
  } | null;
  approved?: boolean;
  rejected?: { reason: string };
  review?: { pass: boolean; findings?: string };
  link?: string | null;
};

type CheckResult = { result: "pass" | "fail" | "pending"; reason: string };

const pass = (reason: string): CheckResult => ({ result: "pass", reason });
const fail = (reason: string): CheckResult => ({ result: "fail", reason });
const pending = (reason: string): CheckResult => ({ result: "pending", reason });

export function evaluateCheck(check: CheckKind, evidence: CheckEvidence): CheckResult {
  const { pr } = evidence;
  switch (check) {
    case "none":
      return pass("This stage has no check.");
    case "thread_done":
      if (evidence.threadStatus !== "idle") return pending("The sub-thread is still working.");
      if (evidence.pendingQuestion) return pending("The sub-thread is waiting on a question.");
      return pass("The sub-thread finished.");
    case "pr_open":
      if (!pr) return pending("No PR yet.");
      if (pr.state === "open" || pr.state === "merged") return pass("The PR is open.");
      return pending(pr.state === "draft" ? "The PR is still a draft." : "The PR is closed.");
    case "ci_green":
      if (!pr) return pending("No PR yet.");
      if (pr.checks === "passing") return pass("CI is green.");
      if (pr.checks === "failing") return fail("CI failed.");
      return pending(pr.checks === "pending" ? "CI is running." : "No CI checks yet.");
    case "pr_merged":
      if (!pr) return pending("No PR yet.");
      if (pr.state === "merged") return pass("The PR is merged.");
      if (pr.checks === "failing") return fail("CI failed.");
      return pending("The PR is not merged yet.");
    case "you_approve":
      if (evidence.rejected) return fail(evidence.rejected.reason.trim() || "You rejected it.");
      if (evidence.approved) return pass("You approved it.");
      return pending("Waiting for your approval.");
    case "reviewer_passes":
      if (!evidence.review) return pending("Waiting for a review.");
      if (evidence.review.pass) return pass("The reviewer passed it.");
      return fail(evidence.review.findings?.trim() || "The reviewer failed it.");
    case "link_added":
      if (evidence.link && evidence.link.trim().length > 0) return pass("A link was added.");
      return pending("Waiting for a link.");
  }
}

type AdvanceOutcome = {
  item: CoordinatorItem;
  /** Log kind to record, or null when nothing changed. */
  logKind: Extract<LogEntry["kind"], "stage_advanced" | "stage_failed"> | null;
  text: string;
};

export function stageName(template: CoordinatorTemplate, index: number): string {
  const clamped = Math.min(Math.max(index, 0), template.stages.length - 1);
  return template.stages[clamped]?.name ?? `Stage ${index + 1}`;
}

/**
 * Applies a check result to an item. A pass moves it to the next stage (or marks it
 * done after the last stage); a fail moves it back one stage with the reason.
 * Pending results and cut or done items are left unchanged.
 */
export function advanceItem(
  item: CoordinatorItem,
  template: CoordinatorTemplate,
  result: CheckResult,
  now: number,
): AdvanceOutcome {
  if (result.result === "pending" || item.status === "cut" || item.status === "done") {
    return { item, logKind: null, text: "" };
  }
  const last = template.stages.length - 1;
  const from = stageName(template, item.stageIndex);
  if (result.result === "pass") {
    if (item.stageIndex >= last) {
      return {
        item: { ...item, stageIndex: last, status: "done", reason: null, updatedAt: now },
        logKind: "stage_advanced",
        text: `${item.title} passed ${from} and is done.`,
      };
    }
    const next = item.stageIndex + 1;
    return {
      item: { ...item, stageIndex: next, reason: null, updatedAt: now },
      logKind: "stage_advanced",
      text: `${item.title} moved from ${from} to ${stageName(template, next)}.`,
    };
  }
  const back = Math.max(0, item.stageIndex - 1);
  return {
    item: { ...item, stageIndex: back, reason: result.reason, updatedAt: now },
    logKind: "stage_failed",
    text: `${item.title} failed ${from} and moved back to ${stageName(template, back)}: ${result.reason}`,
  };
}

// ---------------------------------------------------------------------------
// Decision cards and status lines

/** Owner ref of the QA card for an item waiting at a you_approve stage. */
export function qaCardRef(itemId: string, stageIndex: number): string {
  return `qa:${itemId}:${stageIndex}`;
}

/** Owner ref of the card for a pending "asks you first" approval. */
export function approvalCardRef(approvalId: string): string {
  return `approval:${approvalId}`;
}

export type CardRef =
  | { kind: "qa"; itemId: string; stageIndex: number }
  | { kind: "approval"; approvalId: string };

export function parseCardRef(ref: string): CardRef | null {
  const qa = /^qa:(.+):(\d{1,3})$/u.exec(ref);
  if (qa?.[1] && qa[2]) return { kind: "qa", itemId: qa[1], stageIndex: Number(qa[2]) };
  const approval = /^approval:(.+)$/u.exec(ref);
  if (approval?.[1]) return { kind: "approval", approvalId: approval[1] };
  return null;
}

/** Collapses whitespace to one line and clips it. Action Cards lines are single-line and at most 300 characters. */
export function oneLine(text: string, max: number): string {
  const single = text.replace(/\s+/gu, " ").trim();
  return single.length <= max ? single : `${single.slice(0, max - 1)}…`;
}

function withoutPeriod(text: string): string {
  return text.replace(/[.\s]+$/u, "");
}

function prLine(pr: ItemPullRequest | null): string | null {
  if (!pr) return null;
  const name = pr.number !== null ? `PR #${pr.number}` : "PR";
  if (pr.state === "merged") return `${name} merged`;
  if (pr.state === "closed") return `${name} closed`;
  if (pr.state === "draft") return `Draft ${name}`;
  const ci = pr.checks === "passing" ? "CI passing" : pr.checks === "failing" ? "CI failing" : pr.checks === "pending" ? "CI running" : null;
  return ci ? `${name} · ${ci}` : name;
}

/** "Waiting on X" without doubling a prefix the coordinator already wrote. */
export function waitingOnLine(waitingOn: string | null): string | null {
  const text = waitingOn?.replace(/^waiting\s+on\s+/iu, "").trim();
  return text ? `Waiting on ${text}` : null;
}

/**
 * The detail half of an item's status: what it waits on, that it's blocked, its PR and CI,
 * or the primary sub-thread's activity when nothing else is known.
 */
export function itemStatusDetail(item: CoordinatorItem, threadActivity: string | null = null): string | null {
  return waitingOnLine(item.waitingOn) ?? (item.status === "blocked" ? "Blocked" : null) ?? prLine(item.pr) ?? threadActivity;
}

/** One muted line for a tracker row: stage, then the status detail. */
export function itemStatusLine(item: CoordinatorItem, template: CoordinatorTemplate, threadActivity: string | null = null): string {
  if (item.status === "cut") return "Stopped tracking";
  if (item.status === "done") return template.stages.at(-1)?.name ?? "Done";
  const stage = stageName(template, item.stageIndex);
  const detail = itemStatusDetail(item, threadActivity);
  return detail ? `${stage} · ${detail}` : stage;
}

/** What approving moves an item to: the next stage's name, or null after the last stage. */
export function nextStageName(template: CoordinatorTemplate, stageIndex: number): string | null {
  return stageIndex + 1 < template.stages.length ? stageName(template, stageIndex + 1) : null;
}

export type DecideCardContent = {
  type: "decide";
  question: string;
  consequence: string;
  yesLabel: string;
  noLabel: string;
};

export function qaCardContent(item: CoordinatorItem, template: CoordinatorTemplate): DecideCardContent {
  const next = nextStageName(template, item.stageIndex);
  const context = [item.summary, itemStatusDetail(item)].filter((part): part is string => Boolean(part && part.trim()));
  const outcome = next ? `Approving moves it to ${next}.` : "Approving marks it done.";
  return {
    type: "decide",
    question: `Approve QA for “${oneLine(item.title, 240)}”?`,
    consequence: oneLine(context.length > 0 ? `${withoutPeriod(context.map(withoutPeriod).join(" · "))}. ${outcome}` : outcome, 300),
    yesLabel: "Approve",
    noLabel: "Reject",
  };
}

export function approvalCardContent(approval: PendingApproval): DecideCardContent {
  return {
    type: "decide",
    question: `Approve: ${oneLine(withoutPeriod(approval.summary), 280)}?`,
    consequence: oneLine(approval.reason?.trim() || "The coordinator rules ask you first.", 300),
    yesLabel: "Approve",
    noLabel: "Decline",
  };
}

// ---------------------------------------------------------------------------
// Briefings

type BriefingInput = {
  /** Log entries since the user last looked, oldest first. */
  changes: LogEntry[];
  items: CoordinatorItem[];
  approvals: PendingApproval[];
  template: CoordinatorTemplate;
  /** Live card directives by owner ref (see qaCardRef and approvalCardRef). */
  cards?: ReadonlyMap<string, string>;
};

export function composeBriefing({ changes, items, approvals, template, cards = new Map<string, string>() }: BriefingInput): Briefing {
  const open = items.filter((item) => item.status !== "cut" && item.status !== "done");
  const known = new Set(open.map((item) => item.id));

  const needsYou: Briefing["needsYou"] = [];
  const next: CoordinatorItem[] = [];
  for (const item of [...open].sort((a, b) => a.updatedAt - b.updatedAt)) {
    const before = needsYou.length;
    for (const approval of approvals) {
      if (approval.itemId !== item.id) continue;
      needsYou.push({ item, why: `Approve or decline: ${approval.summary}`, card: cards.get(approvalCardRef(approval.id)) ?? null });
    }
    if (template.stages[item.stageIndex]?.check === "you_approve") {
      needsYou.push({
        item,
        why: `Waiting for your approval at ${stageName(template, item.stageIndex)}`,
        card: cards.get(qaCardRef(item.id, item.stageIndex)) ?? null,
      });
    }
    if (item.status === "blocked") needsYou.push({ item, why: `Blocked${item.reason ? `: ${item.reason}` : ""}`, card: null });
    if (needsYou.length === before && item.status === "active") next.push(item);
  }
  for (const approval of approvals) {
    if (approval.itemId && known.has(approval.itemId)) continue;
    needsYou.push({ item: null, why: `Approve or decline: ${approval.summary}`, card: cards.get(approvalCardRef(approval.id)) ?? null });
  }
  next.sort((a, b) => b.stageIndex - a.stageIndex || a.updatedAt - b.updatedAt);
  return { changes, needsYou, next };
}

function itemLabel(item: CoordinatorItem): string {
  return item.link ? `[${item.title}](${item.link})` : `**${item.title}**`;
}

function needLine({ item, why }: Briefing["needsYou"][number], template: CoordinatorTemplate): string {
  return item ? `- ${itemLabel(item)} (${stageName(template, item.stageIndex)}): ${why}` : `- ${why}`;
}

type RenderOptions = {
  /**
   * "embed" (default) puts each live card's directive on its own line in Needs you, with text for the rest.
   * "omit" leaves decisions that have cards out, for destinations that attach the cards themselves.
   */
  cards?: "embed" | "omit";
};

export function renderBriefingMarkdown(briefing: Briefing, template: CoordinatorTemplate, options: RenderOptions = {}): string {
  const mode = options.cards ?? "embed";
  const needs = mode === "omit" ? briefing.needsYou.filter((entry) => entry.card === null) : briefing.needsYou;
  if (briefing.changes.length === 0 && needs.length === 0 && briefing.next.length === 0) {
    return "Nothing changed.";
  }
  const lines: string[] = ["**Since you last looked**"];
  if (briefing.changes.length === 0) lines.push("Nothing changed.");
  else lines.push(...briefing.changes.map((entry) => `- ${entry.text}`));
  if (needs.length > 0) {
    lines.push("", "**Needs you**");
    let previousWasCard = false;
    for (const entry of needs) {
      // A directive renders only as its own block, so cards sit between blank lines.
      if (entry.card) lines.push("", entry.card);
      else lines.push(...(previousWasCard ? [""] : []), needLine(entry, template));
      previousWasCard = entry.card !== null;
    }
  }
  if (briefing.next.length > 0) {
    lines.push("", "**Next**");
    lines.push(...briefing.next.map((item) => `- ${itemLabel(item)}: ${stageName(template, item.stageIndex)}`));
  }
  return lines.join("\n");
}

/** A Briefs headline such as "2 need you · 3 changed". */
export function briefingHeadline(briefing: Briefing, extraChanges = 0): string {
  const needs = briefing.needsYou.length;
  return `${needs} ${needs === 1 ? "needs" : "need"} you · ${briefing.changes.length + extraChanges} changed`;
}

/** The brief's first line: the first thing that needs the user, else the first change. */
export function briefingLede(briefing: Briefing): string {
  const need = briefing.needsYou[0];
  if (need) return oneLine(need.item ? `${need.item.title}: ${need.why}` : need.why, 300);
  const change = briefing.changes[0];
  return change ? oneLine(change.text, 300) : "Nothing changed since your last brief.";
}

// ---------------------------------------------------------------------------
// Coordinator instructions

export const MAX_INSTRUCTIONS_LENGTH = 4096;

const CHECK_DESCRIPTIONS: Record<CheckKind, string> = {
  none: "items start here when created",
  thread_done: "passes when its sub-thread is idle with no pending question",
  pr_open: "passes when the PR is open",
  ci_green: "passes when CI is green; fails when CI fails",
  pr_merged: "passes when the PR is merged",
  you_approve: "passes when the user approves; a rejection sends it back",
  reviewer_passes: "passes when a sub-thread started with role \"reviewer\" records pass with coordinator_review_verdict; you cannot record a verdict for your own items",
  link_added: "passes when the item has a link (set it with coordinator_set_link)",
};

function clip(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max - 1)}…`;
}

/** Instructions injected into the coordinator's session, capped at 4096 characters. */
export function instructionsFor(template: CoordinatorTemplate): string {
  const track = "Track each real ask as an item with coordinator_add_item, with a one-line summary, without asking the user to confirm it. Sub-threads that existed when Coordinator Mode turned on are already tracked.";
  // Fixed guidance comes first so the final cap only ever trims the template's own lists.
  const sections: string[] = [
    `You are the coordinator for this thread, using the "${clip(template.name, 100)}" template. Purpose: ${clip(template.purpose, 400)}`,
    [
      "Do gated actions only through Coordinator Mode tools: coordinator_add_item, coordinator_update_item, coordinator_start_sub_thread, coordinator_archive_sub_thread, coordinator_merge_pr, coordinator_briefing, coordinator_set_link, coordinator_cut_item.",
      "Shell commands such as gh pr merge or bb digest publish get the same decision as the tool. If an action is refused, tell the user why and do not work around it.",
      "Only checks advance stages. Saying a stage is done has no effect; a failed check moves the item back one stage with the reason.",
      "When the user asks to catch up, call coordinator_briefing and share it as written: card lines in, item IDs out.",
    ].join("\n"),
    [
      "Communication (keep it curt):",
      "- To the user: put the outcome first, report only what changed, never restate unchanged items, keep replies to a few lines.",
      "- Decisions (approvals, ask-first actions) are cards in the Coordinator panel and the briefing. Never ask for approval in prose; point to the card.",
      "- Sub-thread prompts (coordinator_start_sub_thread): the outcome, constraints, and done condition only; no background narration.",
      "- Keep each item's summary (one line) and waitingOn (what it waits on, or empty) current with coordinator_update_item.",
    ].join("\n"),
    template.intakePrefix
      ? `Intake: ${track} When a user message starts with "${clip(template.intakePrefix, 40)}", add the rest as an item and start its sub-thread at once (startSubThread true).`
      : `Intake: ${track}`,
    [
      "Stages:",
      ...template.stages.map((stage, i) => `${i + 1}. ${clip(stage.name, 60)}: ${CHECK_DESCRIPTIONS[stage.check]}`),
    ].join("\n"),
  ];

  const enforced = template.rules.filter((rule): rule is GatedRule => rule.kind === "gated");
  if (enforced.length > 0) {
    sections.push([
      "Rules enforced by Coordinator Mode:",
      ...enforced.map((rule) => `- ${COLUMN_LABELS[rule.column]}: ${describeRule(rule)}`),
    ].join("\n"));
  }
  if (template.subThreadRules.trim()) {
    sections.push(`Sub-thread rules: ${clip(template.subThreadRules.trim(), 600)}`);
  }
  const instructionOnly = template.rules.filter((rule) => rule.kind === "instruction");
  if (instructionOnly.length > 0) {
    sections.push([
      "Instruction only — not enforced. Follow these yourself:",
      ...instructionOnly.map((rule) => `- ${COLUMN_LABELS[rule.column]}: ${clip(describeRule(rule), 200)}`),
    ].join("\n"));
  }

  return clip(sections.join("\n\n"), MAX_INSTRUCTIONS_LENGTH);
}

/** Instructions for every sub-thread a coordinator tracks, started or adopted: report once, briefly. */
export const SUB_THREAD_INSTRUCTIONS =
  "You are a sub-thread tracked by a Coordinator Mode coordinator. Don't send progress updates; Coordinator Mode tracks status and PRs. When done or blocked, reply in 3 lines or fewer: result, PR link if any, blocker. Your final reply is the report; don't message the coordinator with bb thread tell.";
