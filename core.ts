export const WORKFLOW_CONFIG_VERSION = 2 as const;

export type WorkflowStageRole = "inbox" | "stage";

export const MAX_WORKFLOW_STAGES = 24;
/**
 * Rule a section starts with until its owner describes one. It has to be safe
 * for an agent to act on as written, so it says the section is user-managed
 * rather than inviting a guess about what belongs here.
 */
export const DEFAULT_STAGE_RULE =
  "Threads the user files here by hand. Never move a thread into this section on your own, and leave a thread you find here where it is, until this rule describes real work.";
export const ENTRY_PROMPT_MAX_LENGTH = 2000;
export const RENDERED_ENTRY_PROMPT_MAX_LENGTH = 8000;

export interface EditableWorkflowStage {
  /** An additional inbox catches this plugin's threads; without it the inbox only holds threads moved there by hand. */
  catchesPluginId?: string;
  /** Sent to a thread when it lands in this stage; omitted when unset. */
  entryPrompt?: string;
  key: string;
  /** Inboxes only: move a thread out once it is read; omitted keeps it until moved. */
  returnAfterRead?: boolean;
  role: WorkflowStageRole;
  rule: string;
  title: string;
}

export interface WorkflowStage extends EditableWorkflowStage {
  sectionId: string | null;
}

export interface EditableWorkflowConfig {
  /** Revision the editor started from; a save is refused when the stored revision differs. */
  baseRevision?: number;
  stages: EditableWorkflowStage[];
  version: typeof WORKFLOW_CONFIG_VERSION;
}

export interface WorkflowConfig {
  /** Bumped by the server on every saved change. */
  revision?: number;
  stages: WorkflowStage[];
  version: typeof WORKFLOW_CONFIG_VERSION;
}

/** Renderer id of the confirmation form CLI configuration changes wait on. */
export const WORKFLOW_CHANGE_INTERACTION_ID = "confirm-workflow-change";
/** Raised when a save is based on a revision the server has moved past. */
export const WORKFLOW_CHANGED_ELSEWHERE_MESSAGE =
  "The workflow changed elsewhere. Reload and try again.";

export interface OrganizableThread {
  archivedAt: number | null;
  childOrigin?: "fork" | "side-chat" | null;
  deletedAt: number | null;
  lastReadAt: number | null;
  latestAttentionAt: number;
  originKind: "fork" | "side-chat" | null;
  originPluginId: string | null;
  parentThreadId: string | null;
  queuedMessageCount?: number;
  sectionId: string | null;
  sourceThreadId: string | null;
  status: "active" | "error" | "idle" | "pending" | "starting" | "stopping";
  visibility: "hidden" | "visible";
}

// Keep the stored protected rule compatible with existing single-inbox readers.
export const INBOX_RULE =
  "Idle unread threads that need your attention appear here automatically and stay until work resumes or you move a read thread to another workflow section. This behavior can’t be customized.";

export const INBOX_DESCRIPTION =
  "Idle unread threads without queued messages and not claimed by another inbox appear here automatically. They stay until work resumes in the thread or a child, a message is queued, or you move a read thread to another section.";

export const RETURNING_INBOX_DESCRIPTION =
  "Idle unread threads without queued messages and not claimed by another inbox appear here automatically and move back to their section once you read them. Resuming work in the thread or a child, or queuing a message, also moves them back.";

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseStage(value: unknown, withSectionId: boolean): WorkflowStage {
  if (!isRecord(value))
    throw new Error("Every workflow stage must be an object.");
  const key = typeof value.key === "string" ? value.key.trim() : "";
  // Titles follow bb's section naming: trimmed, otherwise kept as written.
  const title = typeof value.title === "string" ? value.title.trim() : "";
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
  if (title.length === 0) {
    throw new Error(`Stage "${key}" needs a title.`);
  }
  if (rule.length === 0 || rule.length > 240) {
    throw new Error(`Stage "${key}" needs a rule of 1–240 characters.`);
  }
  if (role !== "inbox" && role !== "stage") {
    throw new Error(`Stage "${key}" has an invalid role.`);
  }
  if (
    value.catchesPluginId !== undefined &&
    (typeof value.catchesPluginId !== "string" ||
      !/^[a-z0-9][a-z0-9-]*$/u.test(value.catchesPluginId) ||
      value.catchesPluginId.length > 128)
  ) {
    throw new Error(
      `Section "${key}" needs a plugin id using lowercase letters, digits, and hyphens.`,
    );
  }
  if (
    value.returnAfterRead !== undefined &&
    typeof value.returnAfterRead !== "boolean"
  ) {
    throw new Error(`Section "${key}" after-reading setting must be a boolean.`);
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
    ...(typeof value.catchesPluginId === "string"
      ? { catchesPluginId: value.catchesPluginId }
      : {}),
    ...(value.returnAfterRead === true ? { returnAfterRead: true } : {}),
    sectionId: sectionId && sectionId.trim().length > 0 ? sectionId : null,
  };
}

function validateStages(stages: WorkflowStage[]): void {
  if (stages.length > MAX_WORKFLOW_STAGES) {
    throw new Error(`Configure at most ${MAX_WORKFLOW_STAGES} sections.`);
  }
  const keys = new Set<string>();
  const titles = new Set<string>();
  const caughtPlugins = new Set<string>();
  for (const stage of stages) {
    if (keys.has(stage.key)) {
      throw new Error(`Stage key "${stage.key}" is duplicated.`);
    }
    keys.add(stage.key);
    // bb only refuses an exact duplicate, so names differing in case are fine.
    if (titles.has(stage.title)) {
      throw new Error(`A section named "${stage.title}" already exists.`);
    }
    titles.add(stage.title);
    if (stage.role === "inbox" && hasEntryPrompt(stage)) {
      throw new Error("Inbox cannot send an entry prompt.");
    }
    if (stage.role !== "inbox" && stage.returnAfterRead) {
      throw new Error("Only an inbox can move threads back after reading.");
    }
    if (stage.role === "inbox" && stage.key !== "inbox") {
      if (stage.catchesPluginId !== undefined) {
        if (caughtPlugins.has(stage.catchesPluginId)) {
          throw new Error(`Plugin "${stage.catchesPluginId}" already has another inbox.`);
        }
        caughtPlugins.add(stage.catchesPluginId);
      }
    } else if (stage.catchesPluginId !== undefined) {
      throw new Error("Only an additional inbox can catch a plugin.");
    }
  }
  // The main Inbox is optional: deleting its section in bb removes it.
  const mainInbox = stages.find((stage) => stage.key === "inbox");
  if (mainInbox !== undefined && mainInbox.role !== "inbox") {
    throw new Error("The inbox key is reserved for the main Inbox.");
  }
  if (mainInbox !== undefined && mainInbox.rule !== INBOX_RULE) {
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
    const revision =
      typeof value.revision === "number" &&
      Number.isInteger(value.revision) &&
      value.revision >= 0
        ? value.revision
        : undefined;
    return {
      version: WORKFLOW_CONFIG_VERSION,
      stages,
      ...(revision === undefined ? {} : { revision }),
    };
  } catch {
    return null;
  }
}

export function normalizeEditableWorkflowConfig(
  value: EditableWorkflowConfig,
): EditableWorkflowConfig {
  const stages = value.stages.map((stage) => {
    const parsed = parseStage(stage, false);
    // Old editors may submit the previous protected Inbox copy. Accept it
    // just as the persisted-config loader does, without changing their fields.
    if (
      parsed.key === "inbox" &&
      PREVIOUS_INBOX_RULES.some((rule) => rule === parsed.rule)
    ) {
      parsed.rule = INBOX_RULE;
    }
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
    ...(config.revision === undefined ? {} : { baseRevision: config.revision }),
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
    "section.key": variables.stage.key,
    "section.title": variables.stage.title,
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

export function inboxStage(config: WorkflowConfig): WorkflowStage | null {
  return config.stages.find((stage) => stage.key === "inbox") ?? null;
}

export function stageForSectionId(
  config: WorkflowConfig,
  sectionId: string | null,
): WorkflowStage | null {
  if (sectionId === null) return null;
  return config.stages.find((stage) => stage.sectionId === sectionId) ?? null;
}

export interface BbSection {
  id: string;
  name: string;
}

export interface SectionSyncResult {
  config: WorkflowConfig;
  /** One log line per change taken from bb. */
  changes: string[];
  /** The main Inbox, when its section was deleted in bb during this sync. */
  droppedInbox: WorkflowStage | null;
  /** bb sections left unmanaged because the stage limit is reached. */
  unmanaged: number;
}

/**
 * Makes the stages match bb's sections, which own existence, names and
 * order. Stages keep only what the plugin adds (rules, inbox settings,
 * prompts). A stage whose section is gone is dropped, never rebuilt; a stage
 * that never had a section claims a same-named one; every other section
 * becomes a stage at its sidebar position. `sidebarOrder` lists section ids
 * top to bottom, or is null when the sidebar order could not be read.
 * `restorableInbox` is the main Inbox as it was when its section was deleted,
 * restored when a section with its name appears again.
 */
export function syncStagesWithSections(
  config: WorkflowConfig,
  sections: readonly BbSection[],
  sidebarOrder: readonly string[] | null,
  restorableInbox: WorkflowStage | null = null,
): SectionSyncResult {
  const changes: string[] = [];
  const byId = new Map(sections.map((section) => [section.id, section]));
  const claimed = new Set<string>();
  let droppedInbox: WorkflowStage | null = null;
  const stages: WorkflowStage[] = [];
  for (const original of config.stages) {
    const stage = { ...original };
    if (stage.sectionId === null) {
      const match = sections.find(
        (section) =>
          !claimed.has(section.id) &&
          !config.stages.some((other) => other.sectionId === section.id) &&
          legacySectionNames(stage).includes(section.name.trim()),
      );
      if (match) stage.sectionId = match.id;
    }
    if (stage.sectionId !== null) {
      const section = byId.get(stage.sectionId);
      if (!section) {
        changes.push(
          `action=stage-removed-from-bb stage=${stage.key} section=${stage.sectionId}`,
        );
        if (stage.key === "inbox") droppedInbox = original;
        continue;
      }
      claimed.add(section.id);
      const name = section.name.trim();
      if (name !== stage.title) {
        changes.push(
          `action=stage-renamed-from-bb stage=${stage.key} section=${section.id}`,
        );
        stage.title = name;
      }
    }
    stages.push(stage);
  }

  const rank = new Map((sidebarOrder ?? []).map((id, index) => [id, index]));
  const unclaimed = sections
    .filter((section) => !claimed.has(section.id))
    .sort(
      (left, right) =>
        (rank.get(left.id) ?? Number.MAX_SAFE_INTEGER) -
        (rank.get(right.id) ?? Number.MAX_SAFE_INTEGER),
    );
  let unmanaged = 0;
  for (const section of unclaimed) {
    if (stages.length >= MAX_WORKFLOW_STAGES) {
      unmanaged += 1;
      continue;
    }
    const title = section.name.trim();
    const restoresInbox =
      restorableInbox !== null &&
      restorableInbox.title === title &&
      !stages.some((stage) => stage.key === "inbox");
    const stage: WorkflowStage = restoresInbox
      ? { ...restorableInbox, sectionId: section.id }
      : {
          key: createStageKey(title, stages.map((entry) => entry.key)),
          role: "stage",
          title,
          rule: DEFAULT_STAGE_RULE,
          sectionId: section.id,
        };
    stages.push(stage);
    claimed.add(section.id);
    changes.push(
      `action=stage-added-from-bb stage=${stage.key} section=${section.id}`,
    );
  }

  if (sidebarOrder !== null) {
    // Stages with a section take the sidebar's order within the slots they
    // hold; a stage still waiting for its section keeps its place.
    const slots = stages.flatMap((stage, index) =>
      stage.sectionId === null ? [] : [index],
    );
    const sorted = slots
      .map((index) => stages[index]!)
      .sort(
        (left, right) =>
          (rank.get(left.sectionId!) ?? Number.MAX_SAFE_INTEGER) -
          (rank.get(right.sectionId!) ?? Number.MAX_SAFE_INTEGER),
      );
    const before = stages.map((stage) => stage.key).join(",");
    slots.forEach((slot, index) => {
      stages[slot] = sorted[index]!;
    });
    const after = stages.map((stage) => stage.key).join(",");
    if (after !== before) changes.push(`action=order-from-bb order=${after}`);
  }

  return {
    config: { ...config, stages },
    changes,
    droppedInbox,
    unmanaged,
  };
}

/**
 * Keys `migrateDraftStage` rewrites on load. A new stage must never take one,
 * or the next load would produce a duplicate key and reject the whole config.
 */
const MIGRATED_STAGE_KEYS = ["parked"] as const;

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
  const unavailable = new Set([
    "inbox",
    ...MIGRATED_STAGE_KEYS,
    ...existingKeys,
  ]);
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

export function returnsAfterRead(
  stage: WorkflowStage | null,
  thread: OrganizableThread,
): boolean {
  return (
    stage?.role === "inbox" &&
    stage.returnAfterRead === true &&
    !isRunningThread(thread) &&
    !isUnreadThread(thread)
  );
}

export function placementForThread(
  config: WorkflowConfig,
  thread: OrganizableThread,
  rememberedStageKey: string | null,
  leaveInbox = false,
  matchedInbox: WorkflowStage | null = null,
  releaseRead = false,
  hasRunningChildren = false,
): WorkflowStage | null {
  // A remembered stage that no longer exists means no section.
  const remembered =
    config.stages.find(
      (stage) => stage.key === rememberedStageKey && stage.role === "stage",
    ) ?? null;
  const currentStage = stageForSectionId(config, thread.sectionId);
  const keepInInbox =
    !leaveInbox &&
    !(releaseRead && returnsAfterRead(currentStage, thread));
  if (keepInInbox) {
    if (matchedInbox) return matchedInbox;
    if (currentStage?.role === "inbox" && currentStage.key !== "inbox") return currentStage;
  }
  const belongsInInbox =
    !hasRunningChildren &&
    !isRunningThread(thread) &&
    (thread.queuedMessageCount ?? 0) === 0 &&
    (isUnreadThread(thread) ||
      (keepInInbox && currentStage?.role === "inbox"));
  if (!belongsInInbox) return remembered;
  // Without a main Inbox, a thread that would go there stays where it is.
  return inboxStage(config) ?? currentStage;
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
  const mainInbox = inboxStage(config);
  return [
    ...(mainInbox === null
      ? []
      : [
          `**${escapeTableCell(mainInbox.title)}** is the protected main Inbox. Idle unread threads without queued messages and not claimed by another inbox go there automatically and ${mainInbox.returnAfterRead ? "return to their workflow section once the user reads them" : "stay until work resumes or the user moves a read thread to another workflow section"}. A running child or a queued message also returns the thread to its workflow section. Never choose an inbox with \`bb organizer phase\`.`,
        ]),
    ...config.stages
      .filter((stage) => stage.role === "inbox" && stage.key !== "inbox")
      .map((stage) =>
        `**${escapeTableCell(stage.title)}** ${stage.catchesPluginId === undefined ? "holds threads the user moves there by hand" : `catches threads from plugin \`${stage.catchesPluginId}\``} and ${stage.returnAfterRead ? "moves them back out once the user reads them" : "keeps them after reading until the user moves or archives them"}. Never move a thread there with \`bb organizer phase\`.`,
      ),
    "",
    "| Key | Section | What belongs here |",
    "| --- | --- | --- |",
    ...rows,
    ...entryPromptGuidance(config),
  ].join("\n");
}
