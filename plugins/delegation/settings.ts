import type { PluginSettingDescriptors } from "@get-bb/plugin-sdk";

// The skills never restate these values; they read the effective ones with
// `bb plugin config delegation --json`. Defaults are brsbl's standing rules.
export const SETTINGS = {
  provider: {
    type: "string",
    label: "Default provider",
    description: "Provider for new workers unless the user names another, such as claude-code or codex.",
    default: "claude-code",
  },
  model: {
    type: "string",
    label: "Default model",
    description: "Model ID for new workers. Leave blank to use the spawn skill's normal tier for the provider.",
    default: "",
  },
  qaModel: {
    type: "string",
    label: "QA and smoke-test model",
    description: "Model ID for QA, smoke tests, and other mechanical checks, or \"cheapest\" for the cheapest model the provider lists.",
    default: "cheapest",
  },
  machine: {
    type: "string",
    label: "Default machine",
    description: "Machine ID or name for new workers. Leave blank to use the lead's machine unless the spawn skill's capacity check offloads it.",
    default: "",
  },
  environment: {
    type: "select",
    label: "Default environment",
    description: "worktree: a fresh managed worktree. personal: a personal workspace. lead: share the lead thread's environment.",
    options: ["worktree", "personal", "lead"],
    default: "worktree",
  },
  section: {
    type: "string",
    label: "Default section for new workers",
    description: "Section ID to file new workers into. Leave blank to use the lead's section.",
    default: "",
  },
  parentWorkers: {
    type: "boolean",
    label: "Parent workers to the lead",
    description: "On: spawn workers with --parent-thread so bb tells the lead when they finish.",
    default: true,
  },
  workerReportLines: {
    type: "number",
    label: "Worker report length (lines)",
    description: "Maximum lines in a worker's final reply: the result, a PR link, and any blocker.",
    default: 3,
  },
  reportMaxBullets: {
    type: "number",
    label: "Report length (bullets)",
    description: "Maximum bullets in a report to the user, after a one-line outcome.",
    default: 5,
  },
  reportStyle: {
    type: "select",
    label: "Report style",
    description: "bullets: one outcome line, then flat bullets. prose: one short paragraph.",
    options: ["bullets", "prose"],
    default: "bullets",
  },
  decisionsAsActionCards: {
    type: "boolean",
    label: "Ask for decisions with action cards",
    description: "On: every decision the user owes becomes an inline action card instead of a question in prose.",
    default: true,
  },
  evidenceInline: {
    type: "boolean",
    label: "Show evidence inline",
    description: "On: render screenshots and videos inline in the report instead of describing them or linking to them.",
    default: true,
  },
  relayBatching: {
    type: "select",
    label: "Relay batching",
    description: "batch: combine everything for one thread into a single message. each: send each request as it comes.",
    options: ["batch", "each"],
    default: "batch",
  },
  retryLimit: {
    type: "number",
    label: "Automatic retries per worker",
    description: "How many times the lead retries a worker's failed turn (for example a provider 429) before reporting it as blocked.",
    default: 2,
  },
  mayArchiveOrStop: {
    type: "boolean",
    label: "Agents may archive or stop threads",
    description: "Off: no agent archives or stops a thread unless the user asks for that thread.",
    default: false,
  },
} as const satisfies PluginSettingDescriptors;
