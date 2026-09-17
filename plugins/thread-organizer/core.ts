export const WORKFLOW_CONFIG_VERSION = 2 as const;

export type WorkflowStageRole = "inbox" | "stage";

export const ENTRY_PROMPT_MAX_LENGTH = 2000;
export const RENDERED_ENTRY_PROMPT_MAX_LENGTH = 8000;

export interface EditableWorkflowStage {
  /** Sent to a thread when it lands in this stage; omitted when unset. */
  entryPrompt?: string;
  key: string;
  role: WorkflowStageRole;
  rule: string;
  title: string;
}

export interface WorkflowStage extends EditableWorkflowStage {
  sectionId: string | null;
}

export interface EditableWorkflowConfig {
  stages: EditableWorkflowStage[];
  version: typeof WORKFLOW_CONFIG_VERSION;
}

export interface WorkflowConfig {
  stages: WorkflowStage[];
  version: typeof WORKFLOW_CONFIG_VERSION;
}

export interface OrganizableThread {
  archivedAt: number | null;
  childOrigin?: "fork" | "side-chat" | null;
  deletedAt: number | null;
  lastReadAt: number | null;
  latestAttentionAt: number;
  originKind: "fork" | "side-chat" | null;
  originPluginId: string | null;
  parentThreadId: string | null;
  sectionId: string | null;
  sourceThreadId: string | null;
  status: "active" | "error" | "idle" | "starting" | "stopping";
  visibility: "hidden" | "visible";
}

export const INBOX_RULE =
  "Idle unread threads that need your attention appear here automatically and stay until work resumes or you move a read thread to another workflow section. This behavior can’t be customized.";

export const HANDOFF_RULE =
  "Use only when the user explicitly says this thread is being handed to a colleague to take across the finish line; never infer it from packaging context, completed work, or waiting.";

const PREVIOUS_INBOX_RULES = [
  "Idle unread threads that need your attention appear here automatically and stay until work resumes. This behavior can’t be customized.",
  "Idle unread threads that need your attention appear here automatically. This behavior can’t be customized.",
  "Idle unread threads requiring the user's attention. This stage is managed automatically.",
] as const;

const PREVIOUS_HANDOFF_RULES = [
  "Packaging work and context so a colleague can continue it.",
  "Transferring work to a colleague after explicit user direction.",
] as const;

export const DEFAULT_WORKFLOW_CONFIG: WorkflowConfig = {
  version: WORKFLOW_CONFIG_VERSION,
  stages: [
    {
      key: "inbox",
      role: "inbox",
      title: "Inbox",
      rule: INBOX_RULE,
      sectionId: null,
    },
    {
      key: "planning",
      role: "stage",
      title: "Planning",
      rule: "Defining scope, requirements, or approach before a reviewable spec exists.",
      sectionId: null,
    },
    {
      key: "spec-review",
      role: "stage",
      title: "Spec Review",
      rule: "A spec or implementation plan is ready for, awaiting, or undergoing user review.",
      sectionId: null,
    },
    {
      key: "building",
      role: "stage",
      title: "Building",
      rule: "Implementing or changing approved work.",
      sectionId: null,
    },
    {
      key: "testing-deploy",
      role: "stage",
      title: "Testing / Deploy",
      rule: "Validating, packaging, releasing, or deploying completed work.",
      sectionId: null,
    },
    {
      key: "handoff",
      role: "stage",
      title: "Handoff",
      rule: HANDOFF_RULE,
      sectionId: null,
    },
    {
      key: "on-hold",
      role: "stage",
      title: "On Hold",
      rule: "Work intentionally paused until a later time or external condition.",
      sectionId: null,
    },
  ],
};

const LEGACY_SECTION_NAMES: Readonly<Record<string, readonly string[]>> = {
  inbox: ["📥 Inbox"],
  planning: ["📋 Planning"],
  "spec-review": ["🔎 Spec Review", "📄 Spec Review"],
  building: ["🛠️ Building"],
  "testing-deploy": ["✅ Testing / Deploy", "🧪 Testing / Deploy"],
  handoff: ["🤝 Handoff"],
  "on-hold": ["Parked", "⏸️ On Hold"],
};

function normalizeText(value: string): string {
  return value.normalize("NFKC").trim().replace(/\s+/gu, " ");
}

function normalizedIdentity(value: string): string {
  return normalizeText(value).toLocaleLowerCase();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseStage(value: unknown, withSectionId: boolean): WorkflowStage {
  if (!isRecord(value))
    throw new Error("Every workflow stage must be an object.");
  const key = typeof value.key === "string" ? value.key.trim() : "";
  const title =
    typeof value.title === "string" ? normalizeText(value.title) : "";
  const rule = typeof value.rule === "string" ? normalizeText(value.rule) : "";
  const role = value.role;
  // Prompts keep their line breaks; only the ends are trimmed.
  const entryPrompt =
    typeof value.entryPrompt === "string"
      ? value.entryPrompt.normalize("NFKC").replace(/\r\n?/gu, "\n").trim()
      : "";
  const sectionId = withSectionId
    ? value.sectionId === null || typeof value.sectionId === "string"
      ? value.sectionId
      : null
    : null;

  if (!/^[a-z0-9][a-z0-9-]{0,39}$/u.test(key)) {
    throw new Error(
      `Stage key "${key}" must use lowercase letters, numbers, and hyphens.`,
    );
  }
  if (title.length === 0 || title.length > 80) {
    throw new Error(`Stage "${key}" needs a title of 1–80 characters.`);
  }
  if (rule.length === 0 || rule.length > 240) {
    throw new Error(`Stage "${key}" needs a rule of 1–240 characters.`);
  }
  if (role !== "inbox" && role !== "stage") {
    throw new Error(`Stage "${key}" has an invalid role.`);
  }
  if (entryPrompt.length > ENTRY_PROMPT_MAX_LENGTH) {
    throw new Error(
      `Stage "${key}" entry prompt must be at most ${ENTRY_PROMPT_MAX_LENGTH} characters.`,
    );
  }
  return {
    key,
    title,
    rule,
    role,
    // Defaults are not persisted, so configs without prompts stay byte-stable.
    ...(entryPrompt.length > 0 ? { entryPrompt } : {}),
    sectionId: sectionId && sectionId.trim().length > 0 ? sectionId : null,
  };
}

function validateStages(stages: WorkflowStage[]): void {
  if (stages.length < 2 || stages.length > 12) {
    throw new Error("Configure Inbox plus 1–11 workflow stages.");
  }
  const keys = new Set<string>();
  const titles = new Set<string>();
  for (const stage of stages) {
    if (keys.has(stage.key)) {
      throw new Error(`Stage key "${stage.key}" is duplicated.`);
    }
    keys.add(stage.key);
    const titleIdentity = normalizedIdentity(stage.title);
    if (titles.has(titleIdentity)) {
      throw new Error(`Stage title "${stage.title}" is duplicated.`);
    }
    titles.add(titleIdentity);
    if (stage.role === "inbox" && hasEntryPrompt(stage)) {
      throw new Error("Inbox cannot send an entry prompt.");
    }
  }
  const inboxes = stages.filter((stage) => stage.role === "inbox");
  if (inboxes.length !== 1 || inboxes[0]?.key !== "inbox") {
    throw new Error(
      "The workflow must contain exactly one protected Inbox stage.",
    );
  }
  if (inboxes[0]?.rule !== INBOX_RULE) {
    throw new Error("Inbox routing and its system rule cannot be changed.");
  }
}

function migrateDraftStage(stage: WorkflowStage): WorkflowStage {
  if (stage.key === "inbox") {
    return {
      ...stage,
      title: stage.title === "Needs Me" ? "Inbox" : stage.title,
      rule: PREVIOUS_INBOX_RULES.some((rule) => rule === stage.rule)
        ? INBOX_RULE
        : stage.rule,
    };
  }
  if (
    stage.key === "handoff" &&
    PREVIOUS_HANDOFF_RULES.some((rule) => rule === stage.rule)
  ) {
    return {
      ...stage,
      rule: HANDOFF_RULE,
    };
  }
  if (stage.key !== "parked") return stage;
  return {
    ...stage,
    key: "on-hold",
    title: stage.title === "Parked" ? "On Hold" : stage.title,
    rule:
      stage.rule ===
      "Intentionally pausing work for later after explicit user direction."
        ? "Work intentionally paused until a later time or external condition."
        : stage.rule,
  };
}

export function parseWorkflowConfig(value: unknown): WorkflowConfig | null {
  try {
    if (!isRecord(value) || (value.version !== 1 && value.version !== 2)) {
      return null;
    }
    if (!Array.isArray(value.stages)) return null;
    const stages = value.stages
      .map((stage) => parseStage(stage, true))
      .map(migrateDraftStage);
    validateStages(stages);
    return { version: WORKFLOW_CONFIG_VERSION, stages };
  } catch {
    return null;
  }
}

export function normalizeEditableWorkflowConfig(
  value: EditableWorkflowConfig,
): EditableWorkflowConfig {
  const stages = value.stages.map((stage) => {
    const parsed = parseStage(stage, false);
    const { sectionId: _sectionId, ...editable } = parsed;
    return editable;
  });
  validateStages(stages.map((stage) => ({ ...stage, sectionId: null })));
  return { version: WORKFLOW_CONFIG_VERSION, stages };
}

export function cloneWorkflowConfig(config: WorkflowConfig): WorkflowConfig {
  return { ...config, stages: config.stages.map((stage) => ({ ...stage })) };
}

export function editableWorkflowConfig(
  config: WorkflowConfig,
): EditableWorkflowConfig {
  return {
    version: WORKFLOW_CONFIG_VERSION,
    stages: config.stages.map(({ sectionId: _sectionId, ...stage }) => ({
      ...stage,
    })),
  };
}

export function mergeEditableWorkflowConfig(
  current: WorkflowConfig,
  edited: EditableWorkflowConfig,
): WorkflowConfig {
  const normalized = normalizeEditableWorkflowConfig(edited);
  const sectionIdsByKey = new Map(
    current.stages.map((stage) => [stage.key, stage.sectionId]),
  );
  return {
    ...normalized,
    stages: normalized.stages.map((stage) => ({
      ...stage,
      sectionId: sectionIdsByKey.get(stage.key) ?? null,
    })),
  };
}

export function legacySectionNames(stage: WorkflowStage): readonly string[] {
  return [stage.title, ...(LEGACY_SECTION_NAMES[stage.key] ?? [])];
}

export function localSectionName(stage: EditableWorkflowStage): string {
  return stage.title;
}

export function hasEntryPrompt(
  stage: EditableWorkflowStage,
): stage is EditableWorkflowStage & { entryPrompt: string } {
  return typeof stage.entryPrompt === "string" && stage.entryPrompt.length > 0;
}

export interface EntryPromptVariables {
  stage: { key: string; title: string };
  thread: { id: string; title: string };
}

export function renderEntryPrompt(
  template: string,
  variables: EntryPromptVariables,
): string {
  const values: Record<string, string> = {
    "stage.key": variables.stage.key,
    "stage.title": variables.stage.title,
    "thread.id": variables.thread.id,
    "thread.title": variables.thread.title,
  };
  const rendered = template.replace(
    /\{\{\s*([A-Za-z]+\.[A-Za-z]+)\s*\}\}/gu,
    (match, name: string) => values[name.toLowerCase()] ?? match,
  );
  return rendered.length > RENDERED_ENTRY_PROMPT_MAX_LENGTH
    ? rendered.slice(0, RENDERED_ENTRY_PROMPT_MAX_LENGTH)
    : rendered;
}

export function entryPromptMessage(
  stage: EditableWorkflowStage & { entryPrompt: string },
  variables: EntryPromptVariables,
): string {
  return [
    `Thread Organizer — entering “${variables.stage.title}”:`,
    "",
    renderEntryPrompt(stage.entryPrompt, variables),
  ].join("\n");
}

export function inboxStage(config: WorkflowConfig): WorkflowStage {
  return config.stages.find((stage) => stage.role === "inbox")!;
}

export function firstWorkflowStage(config: WorkflowConfig): WorkflowStage {
  return config.stages.find((stage) => stage.role === "stage")!;
}

export function stageForSectionId(
  config: WorkflowConfig,
  sectionId: string | null,
): WorkflowStage | null {
  if (sectionId === null) return null;
  return config.stages.find((stage) => stage.sectionId === sectionId) ?? null;
}

export function createStageKey(
  title: string,
  existingKeys: readonly string[],
): string {
  const base =
    title
      .normalize("NFKD")
      .toLocaleLowerCase()
      .replace(/[^a-z0-9]+/gu, "-")
      .replace(/^-+|-+$/gu, "")
      .slice(0, 32) || "stage";
  const unavailable = new Set(["inbox", ...existingKeys]);
  if (!unavailable.has(base)) return base;
  for (let suffix = 2; suffix < 10_000; suffix += 1) {
    const key = `${base.slice(0, 36)}-${suffix}`;
    if (!unavailable.has(key)) return key;
  }
  throw new Error("Could not create a unique stage key.");
}

export function isManageableThread(thread: OrganizableThread): boolean {
  return (
    thread.visibility === "visible" &&
    thread.parentThreadId === null &&
    thread.sourceThreadId === null &&
    thread.originKind === null &&
    (thread.childOrigin ?? null) === null &&
    thread.archivedAt === null &&
    thread.deletedAt === null
  );
}

export function isRunningThread(thread: OrganizableThread): boolean {
  return (
    thread.status === "active" ||
    thread.status === "starting" ||
    thread.status === "stopping"
  );
}

export function isUnreadThread(thread: OrganizableThread): boolean {
  return (thread.lastReadAt ?? 0) < thread.latestAttentionAt;
}

export function placementForThread(
  config: WorkflowConfig,
  thread: OrganizableThread,
  rememberedStageKey: string,
  leaveInbox = false,
): WorkflowStage {
  const remembered =
    config.stages.find(
      (stage) => stage.key === rememberedStageKey && stage.role === "stage",
    ) ?? firstWorkflowStage(config);
  const currentStage = stageForSectionId(config, thread.sectionId);
  const belongsInInbox =
    !isRunningThread(thread) &&
    (isUnreadThread(thread) ||
      (!leaveInbox && currentStage?.role === "inbox"));
  return belongsInInbox ? inboxStage(config) : remembered;
}

function entryPromptGuidance(config: WorkflowConfig): string[] {
  const keys = config.stages
    .filter((stage) => stage.role === "stage" && hasEntryPrompt(stage))
    .map((stage) => `\`${stage.key}\``);
  if (keys.length === 0) return [];
  return [
    "",
    `Entering ${keys.join(", ")} sends that stage’s entry prompt to this thread as a follow-up message, queued until your current turn ends. Run \`bb organizer phase\` only when the thread’s primary activity has genuinely changed — never as a shortcut to trigger that prompt, and never twice for the same stage. After moving, end your turn promptly so the prompt can dispatch.`,
  ];
}

function escapeTableCell(value: string): string {
  return value.replace(/\|/gu, "\\|").replace(/\s+/gu, " ").trim();
}

export function buildWorkflowSkillSlot(config: WorkflowConfig): string {
  const rows = config.stages
    .filter((stage) => stage.role === "stage")
    .map(
      (stage) =>
        `| ${stage.key} | ${escapeTableCell(stage.title)} | ${escapeTableCell(stage.rule)} |`,
    );
  return [
    `**${escapeTableCell(inboxStage(config).title)}** is the protected Inbox section. Idle unread threads go there automatically and stay until work resumes or the user moves a read thread to another workflow section. This routing behavior can’t be customized; never choose Inbox yourself.`,
    "",
    "| Key | Section | What belongs here |",
    "| --- | --- | --- |",
    ...rows,
    ...entryPromptGuidance(config),
  ].join("\n");
}
