import type {
  CheckKind,
  CoordinatorRule,
  CoordinatorTemplate,
  GatedAction,
  RuleColumn,
  RuleCondition,
  StageDefinition,
} from "./contracts";

const ON_STAGE_CHANGE = "Whenever an item changes stage";
/** Every built-in template keeps sub-thread reports short; Coordinator Mode tracks status and PRs itself. */
const REPORT_RULE = "Report only when done or blocked, in three lines or fewer.";
const DAILY_9AM = "0 9 * * *";

export const BUILT_IN_TEMPLATES: CoordinatorTemplate[] = [
  {
    id: "ship",
    name: "Ship",
    purpose: "Take each ask from request to a merged pull request, with your QA and an independent review before merge.",
    stages: [
      { name: "Asked", check: "none" },
      { name: "Building", check: "pr_open" },
      { name: "Your QA", check: "you_approve" },
      { name: "Review", check: "reviewer_passes" },
      { name: "Merged", check: "pr_merged" },
    ],
    rules: [
      { kind: "gated", action: "start_sub_thread", column: "alone" },
      // Primary sub-threads need your OK to archive; helpers archive alone.
      { kind: "gated", action: "archive_sub_thread", column: "ask", condition: { kind: "primary_only" } },
      { kind: "gated", action: "archive_sub_thread", column: "alone" },
      { kind: "gated", action: "merge_pr", column: "never", condition: { kind: "before_stage_passes", stage: "Review" } },
      { kind: "gated", action: "merge_pr", column: "never", condition: { kind: "while_merge_running" } },
      { kind: "gated", action: "merge_pr", column: "alone" },
    ],
    subThreadRules: `Use Claude unless I say otherwise. Archive review sub-threads when their item is done. ${REPORT_RULE}`,
    briefingCron: null,
    briefingLabel: ON_STAGE_CHANGE,
    intakePrefix: "worker:",
  },
  {
    id: "release",
    name: "Release",
    purpose: "Carry a release from scope to a published release, with QA before it goes out.",
    stages: [
      { name: "Scoped", check: "none" },
      { name: "Built", check: "pr_merged" },
      { name: "QA", check: "you_approve" },
      { name: "Released", check: "link_added" },
    ],
    rules: [
      { kind: "gated", action: "merge_pr", column: "ask" },
      { kind: "gated", action: "start_sub_thread", column: "alone" },
      { kind: "instruction", column: "never", text: "Publish the release" },
    ],
    subThreadRules: REPORT_RULE,
    briefingCron: DAILY_9AM,
    briefingLabel: "Daily at 9am",
    intakePrefix: null,
  },
  {
    id: "bug-triage",
    name: "Bug triage",
    purpose: "Move each reported bug through reproduction and a fix to a verified result.",
    stages: [
      { name: "Reported", check: "none" },
      { name: "Reproduced", check: "you_approve" },
      { name: "Fixed", check: "pr_merged" },
      { name: "Verified", check: "you_approve" },
    ],
    rules: [
      { kind: "gated", action: "merge_pr", column: "ask" },
      { kind: "gated", action: "start_sub_thread", column: "alone" },
      { kind: "instruction", column: "never", text: "Close a bug without verifying" },
    ],
    subThreadRules: REPORT_RULE,
    briefingCron: DAILY_9AM,
    briefingLabel: "Daily at 9am",
    intakePrefix: null,
  },
  {
    id: "content",
    name: "Content",
    purpose: "Turn content ideas into drafts you approve, then track them until they are posted.",
    stages: [
      { name: "Idea", check: "none" },
      { name: "Drafting", check: "thread_done" },
      { name: "Ready", check: "you_approve" },
      { name: "Posted", check: "link_added" },
    ],
    rules: [
      { kind: "gated", action: "start_sub_thread", column: "alone" },
      { kind: "gated", action: "digest_publish", column: "ask" },
      { kind: "gated", action: "archive_sub_thread", column: "ask" },
      { kind: "instruction", column: "never", text: "Post anything" },
      { kind: "instruction", column: "never", text: "Write essays for me" },
    ],
    subThreadRules: `Title sub-threads 🔥1–3 by due date and effort. ${REPORT_RULE}`,
    briefingCron: "0 9 * * 1",
    briefingLabel: "Mondays at 9am",
    intakePrefix: null,
  },
];

const CHECK_KINDS: readonly CheckKind[] = [
  "none", "thread_done", "pr_open", "ci_green", "pr_merged", "you_approve", "reviewer_passes", "link_added",
];
const GATED_ACTIONS: readonly GatedAction[] = ["start_sub_thread", "archive_sub_thread", "merge_pr", "digest_publish"];
const RULE_COLUMNS: readonly RuleColumn[] = ["alone", "ask", "never"];

type Json = Record<string, unknown>;

function isObject(value: unknown): value is Json {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function fail(path: string, message: string): never {
  throw new Error(`Invalid template: ${path} ${message}`);
}

function text(obj: Json, key: string, path: string, opts: { allowEmpty?: boolean; max?: number } = {}): string {
  const value = obj[key];
  if (typeof value !== "string") fail(`${path}${key}`, "must be text.");
  const trimmed = value.trim();
  if (!opts.allowEmpty && trimmed.length === 0) fail(`${path}${key}`, "must not be empty.");
  const max = opts.max ?? 4000;
  if (trimmed.length > max) fail(`${path}${key}`, `must be ${max} characters or fewer.`);
  return trimmed;
}

function nullableText(obj: Json, key: string, path: string, max: number): string | null {
  const value = obj[key];
  if (value === null || value === undefined) return null;
  return text(obj, key, path, { max });
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[], path: string): T {
  if (typeof value !== "string" || !(allowed as readonly string[]).includes(value)) {
    fail(path, `must be one of: ${allowed.join(", ")}.`);
  }
  return value as T;
}

function parseStage(value: unknown, index: number): StageDefinition {
  const path = `stages[${index}].`;
  if (!isObject(value)) fail(`stages[${index}]`, "must be an object with name and check.");
  return { name: text(value, "name", path, { max: 60 }), check: oneOf(value.check, CHECK_KINDS, `${path}check`) };
}

function parseCondition(value: unknown, path: string, stageNames: string[]): RuleCondition | undefined {
  if (value === undefined || value === null) return undefined;
  if (!isObject(value)) fail(path, "must be an object.");
  const kind = oneOf(value.kind, ["before_stage_passes", "while_merge_running", "primary_only"] as const, `${path}.kind`);
  if (kind === "before_stage_passes") {
    const stage = text(value, "stage", `${path}.`, { max: 60 });
    if (!stageNames.includes(stage)) fail(`${path}.stage`, `"${stage}" is not one of this template's stages.`);
    return { kind, stage };
  }
  return { kind };
}

function parseRule(value: unknown, index: number, stageNames: string[]): CoordinatorRule {
  const path = `rules[${index}]`;
  if (!isObject(value)) fail(path, "must be an object.");
  const column = oneOf(value.column, RULE_COLUMNS, `${path}.column`);
  if (value.kind === "gated") {
    const action = oneOf(value.action, GATED_ACTIONS, `${path}.action`);
    const condition = parseCondition(value.condition, `${path}.condition`, stageNames);
    return condition ? { kind: "gated", action, column, condition } : { kind: "gated", action, column };
  }
  if (value.kind === "instruction") {
    return { kind: "instruction", column, text: text(value, "text", `${path}.`, { max: 500 }) };
  }
  return fail(`${path}.kind`, 'must be "gated" or "instruction".');
}

/** Validates an imported or edited template, throwing a readable error on the first problem. */
export function parseTemplate(json: unknown): CoordinatorTemplate {
  if (!isObject(json)) fail("template", "must be a JSON object.");
  const id = text(json, "id", "", { max: 80 });
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(id)) fail("id", "must be lowercase letters, numbers, and dashes.");

  const rawStages = json.stages;
  if (!Array.isArray(rawStages)) fail("stages", "must be a list.");
  if (rawStages.length < 2) fail("stages", "must have at least 2 stages.");
  if (rawStages.length > 12) fail("stages", "must have 12 stages or fewer.");
  const stages = rawStages.map((stage: unknown, i: number) => parseStage(stage, i));
  if (stages[0]?.check !== "none") fail("stages[0].check", 'must be "none": items enter the first stage when created.');
  stages.slice(1).forEach((stage, i) => {
    if (stage.check === "none") fail(`stages[${i + 1}].check`, 'can only be "none" on the first stage.');
  });
  const names = stages.map((stage) => stage.name);
  const duplicate = names.find((name, i) => names.findIndex((other) => other.toLowerCase() === name.toLowerCase()) !== i);
  if (duplicate !== undefined) fail("stages", `has more than one stage named "${duplicate}".`);

  const rawRules = json.rules ?? [];
  if (!Array.isArray(rawRules)) fail("rules", "must be a list.");
  if (rawRules.length > 40) fail("rules", "must have 40 rules or fewer.");
  const rules = rawRules.map((rule: unknown, i: number) => parseRule(rule, i, names));

  const briefingCron = nullableText(json, "briefingCron", "", 120);
  if (briefingCron !== null && briefingCron.split(/\s+/u).length !== 5) {
    fail("briefingCron", "must be a five-field cron schedule or null.");
  }
  const intakePrefix = nullableText(json, "intakePrefix", "", 40);

  return {
    id,
    name: text(json, "name", "", { max: 100 }),
    purpose: text(json, "purpose", "", { max: 1000 }),
    stages,
    rules,
    subThreadRules: json.subThreadRules === undefined ? "" : text(json, "subThreadRules", "", { allowEmpty: true, max: 1000 }),
    briefingCron,
    briefingLabel: text(json, "briefingLabel", "", { max: 100 }),
    intakePrefix,
  };
}
