import type {
  Briefing,
  CheckKind,
  CoordinatorItem,
  CoordinatorRule,
  CoordinatorTemplate,
  GatedAction,
  LogEntry,
  PendingApproval,
  RuleColumn,
  RuleCondition,
} from "./contracts";

// ---------------------------------------------------------------------------
// Rule decisions

export type DecisionContext = {
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

export function describeCondition(condition: RuleCondition): string {
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
 * Second line of defense for commands `matchGatedCommand` doesn't recognize.
 * "self_rpc" reaches Coordinator Mode's own RPC or HTTP surface, which an agent
 * could use to approve its own items, so it is always denied. "risky" mentions a
 * gated operation in a form the matcher can't parse, so it is never approved
 * automatically. Everything else is "safe".
 */
export function classifyUnmatchedCommand(command: string): "self_rpc" | "risky" | "safe" {
  if (/\bplugin\s+rpc\b|\/plugins\/coordinator-mode\b|\bplugin\s+(?:run|disable|remove|uninstall|config)\s+coordinator-mode\b/i.test(command)) {
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

/** The first gated action in a command, or null. */
export function matchGatedCommand(command: string): GatedAction | null {
  return matchGatedCommands(command)[0] ?? null;
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

export type CheckResult = { result: "pass" | "fail" | "pending"; reason: string };

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

export type AdvanceOutcome = {
  item: CoordinatorItem;
  /** Log kind to record, or null when nothing changed. */
  logKind: Extract<LogEntry["kind"], "stage_advanced" | "stage_failed"> | null;
  text: string;
};

function stageName(template: CoordinatorTemplate, index: number): string {
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
// Briefings

export type BriefingInput = {
  since: number;
  log: LogEntry[];
  items: CoordinatorItem[];
  approvals: PendingApproval[];
  template: CoordinatorTemplate;
};

export function composeBriefing({ since, log, items, approvals, template }: BriefingInput): Briefing {
  const changes = log.filter((entry) => entry.at > since).sort((a, b) => a.at - b.at || a.id - b.id);
  const open = items.filter((item) => item.status !== "cut" && item.status !== "done");

  const needsYou: Briefing["needsYou"] = [];
  const next: CoordinatorItem[] = [];
  for (const item of [...open].sort((a, b) => a.updatedAt - b.updatedAt)) {
    const whys: string[] = [];
    if (item.proposed) whys.push("Proposed: confirm or cut it");
    for (const approval of approvals) {
      if (approval.itemId === item.id) whys.push(`Approve or decline: ${approval.summary}`);
    }
    if (item.status === "active" && !item.proposed && template.stages[item.stageIndex]?.check === "you_approve") {
      whys.push(`Waiting for your approval at ${stageName(template, item.stageIndex)}`);
    }
    if (item.status === "blocked") whys.push(`Blocked${item.reason ? `: ${item.reason}` : ""}`);
    if (whys.length > 0) needsYou.push({ item, why: whys.join("; ") });
    else if (item.status === "active") next.push(item);
  }
  next.sort((a, b) => b.stageIndex - a.stageIndex || a.updatedAt - b.updatedAt);
  return { since, changes, needsYou, next };
}

function itemLabel(item: CoordinatorItem): string {
  return item.link ? `[${item.title}](${item.link})` : `**${item.title}**`;
}

export function renderBriefingMarkdown(briefing: Briefing, template: CoordinatorTemplate): string {
  if (briefing.changes.length === 0 && briefing.needsYou.length === 0 && briefing.next.length === 0) {
    return "Nothing changed.";
  }
  const lines: string[] = ["**Since you last looked**"];
  if (briefing.changes.length === 0) lines.push("Nothing changed.");
  else lines.push(...briefing.changes.map((entry) => `- ${entry.text}`));
  if (briefing.needsYou.length > 0) {
    lines.push("", "**Needs you**");
    lines.push(...briefing.needsYou.map(({ item, why }) =>
      `- ${itemLabel(item)} (${stageName(template, item.stageIndex)}): ${why}`));
  }
  if (briefing.next.length > 0) {
    lines.push("", "**Next**");
    lines.push(...briefing.next.map((item) => `- ${itemLabel(item)}: ${stageName(template, item.stageIndex)}`));
  }
  return lines.join("\n");
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
  const sections: string[] = [
    `You are the coordinator for this thread, using the "${clip(template.name, 100)}" template. Purpose: ${clip(template.purpose, 400)}`,
    [
      "Do gated actions only through Coordinator Mode tools: coordinator_add_item, coordinator_start_sub_thread, coordinator_archive_sub_thread, coordinator_merge_pr, coordinator_briefing, coordinator_set_link, coordinator_cut_item.",
      "Shell commands such as gh pr merge or bb digest publish get the same decision as the tool. If an action is refused, tell the user why and do not work around it.",
      "Only checks advance stages. Saying a stage is done has no effect; a failed check moves the item back one stage with the reason.",
      "When the user asks to catch up, call coordinator_briefing.",
    ].join("\n"),
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
  const instructionOnly = template.rules.filter((rule) => rule.kind === "instruction");
  if (instructionOnly.length > 0) {
    sections.push([
      "Instruction only — not enforced. Follow these yourself:",
      ...instructionOnly.map((rule) => `- ${COLUMN_LABELS[rule.column]}: ${clip(describeRule(rule), 200)}`),
    ].join("\n"));
  }
  if (template.subThreadRules.trim()) {
    sections.push(`Sub-thread rules: ${clip(template.subThreadRules.trim(), 600)}`);
  }
  sections.push(template.intakePrefix
    ? `Intake: when a user message starts with "${template.intakePrefix}", add the rest as an item with coordinator_add_item and start its sub-thread with coordinator_start_sub_thread. Otherwise propose items with coordinator_add_item for the user to confirm.`
    : "Intake: propose new items with coordinator_add_item for the user to confirm.");

  return clip(sections.join("\n\n"), MAX_INSTRUCTIONS_LENGTH);
}
