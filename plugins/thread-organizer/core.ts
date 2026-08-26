export const WORKFLOW_CONFIG_VERSION = 2 as const;

export const SECTION_ICON_OPTIONS = [
  "AiContentGenerator01",
  "AlertCircle",
  "AlertTriangle",
  "AlignLeft",
  "AppWindow",
  "Archive",
  "ArchiveRestore",
  "ArrowDown",
  "ArrowReloadHorizontal",
  "ArrowRight",
  "ArrowTurnBackward",
  "ArrowTurnForward",
  "ArrowUp",
  "ArrowUpDown",
  "ArrowUpRight",
  "Beaker",
  "Brain",
  "Browser",
  "Bug",
  "Calendar",
  "CalendarCheckOut02",
  "ChartColumn",
  "Check",
  "ChevronDown",
  "ChevronLeft",
  "ChevronRight",
  "ChevronUp",
  "ChevronsDown",
  "ChevronsUp",
  "Circle",
  "CircleArrowShrink",
  "CircleCheck",
  "CircleQuestion",
  "CircleX",
  "Clean",
  "Clock",
  "ClosePluginPane",
  "CloseThreadPane",
  "Cloud",
  "CloudOff",
  "Code",
  "Coffee",
  "Columns2",
  "ComputerTerminal01",
  "Copy",
  "CornerDownLeft",
  "CornerDownRight",
  "DateTime",
  "Discord",
  "Download",
  "DragDropHorizontal",
  "DragDropVertical",
  "Edit",
  "EditFile",
  "ElectricPlugs",
  "Explore",
  "ExternalLink",
  "Eye",
  "EyeOff",
  "File",
  "FileAttachment",
  "FileDiff",
  "FileQuestion",
  "FileText",
  "FileView",
  "Folder",
  "FolderEdit",
  "FolderExport",
  "FolderGit",
  "FolderMinus",
  "FolderOpen",
  "FolderPlus",
  "Fork",
  "GitBranch",
  "GitMerge",
  "GitPullRequest",
  "GitPullRequestArrow",
  "GitPullRequestClosed",
  "GitPullRequestDraft",
  "Github",
  "Globe",
  "GridView",
  "Info",
  "Laptop",
  "Layers",
  "ListTodo",
  "ListView",
  "Loading",
  "Lock",
  "Mail",
  "MailOpen",
  "Maximize2",
  "MessageCirclePlus",
  "MessageQuestion",
  "MessageSquare",
  "MessageSquarePlus",
  "Mic",
  "Minimize2",
  "MoreHorizontal",
  "NewTab",
  "PackageReceive",
  "Palette",
  "PanelBottom",
  "PanelLeft",
  "PanelRight",
  "Paperclip",
  "Pause",
  "Pin",
  "PinOff",
  "Play",
  "Plus",
  "Puzzle",
  "Repeat",
  "RotateCcw",
  "Rows2",
  "Search",
  "SectionAdd",
  "SecurityCheck",
  "Sent",
  "Settings",
  "SideChat",
  "SlidersHorizontal",
  "Smartphone",
  "Sort",
  "Spinner",
  "Square",
  "SquareUnlock02",
  "Star",
  "Target",
  "Terminal",
  "TextWrap",
  "TimeSchedule",
  "ToolCase",
  "Toolbox",
  "Trash2",
  "UserRound",
  "UserRoundPlus",
  "Workflow",
  "X",
  "Zap",
  "ZoomIn",
  "ZoomOut",
] as const;

export type SectionIconName = (typeof SECTION_ICON_OPTIONS)[number];
export type WorkflowStageRole = "inbox" | "stage";

export interface EditableWorkflowStage {
  icon: SectionIconName;
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
      icon: "Mail",
      rule: INBOX_RULE,
      sectionId: null,
    },
    {
      key: "planning",
      role: "stage",
      title: "Planning",
      icon: "ListTodo",
      rule: "Defining scope, requirements, or approach before a reviewable spec exists.",
      sectionId: null,
    },
    {
      key: "spec-review",
      role: "stage",
      title: "Spec Review",
      icon: "FileView",
      rule: "A spec or implementation plan is ready for, awaiting, or undergoing user review.",
      sectionId: null,
    },
    {
      key: "building",
      role: "stage",
      title: "Building",
      icon: "Code",
      rule: "Implementing or changing approved work.",
      sectionId: null,
    },
    {
      key: "testing-deploy",
      role: "stage",
      title: "Testing / Deploy",
      icon: "Beaker",
      rule: "Validating, packaging, releasing, or deploying completed work.",
      sectionId: null,
    },
    {
      key: "handoff",
      role: "stage",
      title: "Handoff",
      icon: "ArrowRight",
      rule: HANDOFF_RULE,
      sectionId: null,
    },
    {
      key: "on-hold",
      role: "stage",
      title: "On Hold",
      icon: "Pause",
      rule: "Work intentionally paused until a later time or external condition.",
      sectionId: null,
    },
  ],
};

const LEGACY_SECTION_NAMES: Readonly<Record<string, readonly string[]>> = {
  inbox: ["📥 Inbox"],
  planning: ["📋 Planning"],
  "spec-review": ["🔎 Spec Review"],
  building: ["🛠️ Building"],
  "testing-deploy": ["✅ Testing / Deploy"],
  handoff: ["🤝 Handoff"],
  "on-hold": ["Parked"],
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
  const icon = value.icon;
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
  if (!SECTION_ICON_OPTIONS.includes(icon as SectionIconName)) {
    throw new Error(`Stage "${key}" has an unsupported icon.`);
  }
  return {
    key,
    title,
    rule,
    role,
    icon: icon as SectionIconName,
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

const LOCAL_SECTION_EMOJIS: Partial<Record<SectionIconName, string>> = {
  ArrowRight: "🤝",
  Beaker: "🧪",
  Circle: "⚪",
  Code: "🛠️",
  FileView: "📄",
  ListTodo: "📋",
  Mail: "📥",
  MailOpen: "📬",
  Pause: "⏸️",
};

export function localSectionEmoji(icon: SectionIconName): string {
  const exact = LOCAL_SECTION_EMOJIS[icon];
  if (exact) return exact;
  if (/Alert|Bug|CircleX/u.test(icon)) return "⚠️";
  if (/Archive/u.test(icon)) return "🗄️";
  if (/Arrow|Chevron|Corner/u.test(icon)) return "➡️";
  if (/Brain|AiContent/u.test(icon)) return "🧠";
  if (/Browser|AppWindow|Laptop|Smartphone/u.test(icon)) return "🖥️";
  if (/Calendar|Clock|DateTime|TimeSchedule/u.test(icon)) return "📅";
  if (/Check|Security/u.test(icon)) return "✅";
  if (/Cloud/u.test(icon)) return "☁️";
  if (/Code|Terminal|Tool/u.test(icon)) return "🛠️";
  if (/Download|Package|Sent/u.test(icon)) return "📦";
  if (/Edit|File/u.test(icon)) return "📄";
  if (/Eye|Explore|Globe|Search|Zoom/u.test(icon)) return "🔎";
  if (/Folder/u.test(icon)) return "📁";
  if (/Fork|Git/u.test(icon)) return "🌿";
  if (/Info|Question/u.test(icon)) return "❓";
  if (/List|Rows|Columns|Grid|Workflow/u.test(icon)) return "📋";
  if (/Loading|Repeat|Rotate/u.test(icon)) return "🔄";
  if (/Lock|Unlock/u.test(icon)) return "🔒";
  if (/Mail/u.test(icon)) return "📥";
  if (/Message|SideChat/u.test(icon)) return "💬";
  if (/Palette/u.test(icon)) return "🎨";
  if (/Panel/u.test(icon)) return "🗂️";
  if (/Pause/u.test(icon)) return "⏸️";
  if (/Pin/u.test(icon)) return "📌";
  if (/Play/u.test(icon)) return "▶️";
  if (/Plus|SectionAdd/u.test(icon)) return "➕";
  if (/Settings|Sliders/u.test(icon)) return "⚙️";
  if (/Star/u.test(icon)) return "⭐";
  if (/Target/u.test(icon)) return "🎯";
  if (/Trash|Clean/u.test(icon)) return "🗑️";
  if (/User/u.test(icon)) return "👤";
  if (/Zap|Electric/u.test(icon)) return "⚡";
  return "🗂️";
}

export function localSectionName(stage: EditableWorkflowStage): string {
  return `${localSectionEmoji(stage.icon)} ${stage.title}`;
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

export interface ThreadPlacement {
  inboxLatched: boolean;
  stage: WorkflowStage;
}

export function placementForThread(
  config: WorkflowConfig,
  thread: OrganizableThread,
  rememberedStageKey: string,
  inboxLatched: boolean,
): ThreadPlacement {
  const remembered =
    config.stages.find(
      (stage) => stage.key === rememberedStageKey && stage.role === "stage",
    ) ?? firstWorkflowStage(config);
  const nextInboxLatched =
    !isRunningThread(thread) && (inboxLatched || isUnreadThread(thread));
  return {
    inboxLatched: nextInboxLatched,
    stage: nextInboxLatched ? inboxStage(config) : remembered,
  };
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
  ].join("\n");
}
