import { execFile } from "node:child_process";
import { readdir, readFile, stat } from "node:fs/promises";
import { homedir } from "node:os";
import { basename, dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import type { BbPluginApi } from "@get-bb/plugin-sdk";
import { z } from "zod";

import { createHistoryMaintenance } from "./history.js";
import {
  createHarvest,
  harvestProposalSchema,
  harvestVerdictSchema,
} from "./harvest.js";

const execFileAsync = promisify(execFile);
const HARVEST_AGENT_TIMEOUT_MS = 15 * 60 * 1_000;
const MODULE_DIR = dirname(fileURLToPath(import.meta.url));
const DEFAULT_DOCTRINE_PATH =
  basename(MODULE_DIR) === "dist" ? dirname(MODULE_DIR) : MODULE_DIR;
const WATCH_INTERVAL_MS = 2_500;
const SEARCH_RESULT_LIMIT = 24;
const AUTOMATIC_RULE_LIMIT = 4;
const SEARCH_STOP_TOKENS = new Set([
  "build",
  "change",
  "create",
  "fix",
  "improve",
  "make",
  "update",
]);
const TOKEN_ALIASES = new Map([
  ["flow", "workflow"],
  ["improving", "improve"],
  ["redesign", "design"],
]);
const DESIGN_CONTEXT_TOKENS = new Set([
  "accessibility",
  "affordance",
  "animation",
  "border",
  "button",
  "card",
  "color",
  "component",
  "composer",
  "design",
  "dialog",
  "drawer",
  "empty",
  "figma",
  "form",
  "frontend",
  "header",
  "hover",
  "icon",
  "interaction",
  "interface",
  "layout",
  "menu",
  "modal",
  "nav",
  "navigation",
  "panel",
  "popover",
  "prototype",
  "screen",
  "sidebar",
  "style",
  "theme",
  "toolbar",
  "typography",
  "ui",
  "ux",
  "visual",
  "wireframe",
]);

function defineRpcContract<T>(contract: T): T {
  return contract;
}

const stringListSchema = z.array(z.string());
const ruleSchema = z.object({
  id: z.string().regex(/^ddr_\d{3,}$/),
  title: z.string().min(3),
  kind: z.enum(["principle", "standard", "guideline", "taste", "anti_pattern"]),
  strength: z.enum(["required", "default", "preference", "warning"]),
  confidence: z.enum(["low", "medium", "high"]),
  status: z.enum(["active", "conflicted", "retired"]),
  domain: z.string().regex(/^[a-z-]+\.[a-z-]+$/),
  products: stringListSchema.min(1),
  activities: stringListSchema.min(1),
  artifacts: stringListSchema.min(1),
  surfaces: stringListSchema,
  relations: stringListSchema,
  supporting_episodes: z.number().int().nonnegative(),
  challenging_episodes: z.number().int().nonnegative(),
  updated: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  statement: z.string().min(10),
  why: z.string().min(10),
  prefer: stringListSchema.min(1),
  avoid: stringListSchema.min(1),
  use_when: stringListSchema.min(1),
  not_when: stringListSchema,
  exceptions: stringListSchema,
  evidence: stringListSchema.min(1),
  checks: stringListSchema.min(1),
  canonical_path: z.string(),
});

const gitSchema = z.object({
  available: z.boolean(),
  branch: z.string().nullable(),
  commit: z.string().nullable(),
  full_commit: z.string().nullable(),
  dirty: z.boolean(),
  changed_files: z.number().int(),
});

const librarySchema = z.object({
  root: z.string(),
  loaded_at: z.string(),
  rules: z.array(ruleSchema),
  domains: stringListSchema,
  status_counts: z.record(z.string(), z.number().int()),
  git: gitSchema,
});

export const rpcContract = defineRpcContract({
  getLibrary: { input: z.null(), output: librarySchema },
});

export type DoctrineRule = z.infer<typeof ruleSchema>;
export type LibraryPayload = z.infer<typeof librarySchema>;

function expandPath(input: string): string {
  if (input === "~") return homedir();
  if (input.startsWith("~/")) return join(homedir(), input.slice(2));
  return resolve(input);
}

async function listRuleFiles(root: string): Promise<string[]> {
  const rulesRoot = join(root, "rules");
  const domains = await readdir(rulesRoot, { withFileTypes: true });
  const files = await Promise.all(
    domains
      .filter((entry) => entry.isDirectory())
      .map(async (domain) => {
        const directory = join(rulesRoot, domain.name);
        return (await readdir(directory, { withFileTypes: true }))
          .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
          .map((entry) => join(directory, entry.name));
      }),
  );
  return files.flat().sort();
}

function parseValue(value: string): unknown {
  const trimmed = value.trim();
  if (trimmed.startsWith("[") || trimmed.startsWith('"')) {
    return JSON.parse(trimmed) as unknown;
  }
  if (/^\d+$/.test(trimmed)) return Number(trimmed);
  return trimmed;
}

function parseSections(body: string): {
  title: string;
  statement: string;
  sections: Map<string, string[]>;
} {
  const lines = body.trim().split(/\r?\n/);
  const titleLine = lines.shift();
  if (!titleLine?.startsWith("# ")) throw new Error("Rule needs one H1 title");
  const sections = new Map<string, string[]>();
  const statement: string[] = [];
  let current: string | null = null;
  for (const line of lines) {
    if (line.startsWith("## ")) {
      current = line.slice(3).trim().toLocaleLowerCase();
      sections.set(current, []);
      continue;
    }
    if (current) sections.get(current)?.push(line);
    else statement.push(line);
  }
  return {
    title: titleLine.slice(2).trim(),
    statement: statement.join("\n").trim(),
    sections,
  };
}

function sectionText(sections: Map<string, string[]>, name: string): string {
  return (sections.get(name) ?? []).join("\n").trim();
}

function sectionList(sections: Map<string, string[]>, name: string): string[] {
  return (sections.get(name) ?? [])
    .filter((line) => line.startsWith("- "))
    .map((line) => line.slice(2).trim())
    .filter(Boolean);
}

async function parseRule(path: string, root: string): Promise<DoctrineRule> {
  const source = await readFile(path, "utf8");
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]+)$/);
  if (!match) throw new Error(`${relative(root, path)}: missing frontmatter`);
  const metadata: Record<string, unknown> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const separator = line.indexOf(":");
    if (separator < 1) throw new Error(`${relative(root, path)}: invalid frontmatter`);
    metadata[line.slice(0, separator).trim()] = parseValue(
      line.slice(separator + 1),
    );
  }
  const { title, statement, sections } = parseSections(match[2]);
  try {
    return ruleSchema.parse({
      ...metadata,
      title,
      statement,
      why: sectionText(sections, "why"),
      prefer: sectionList(sections, "prefer"),
      avoid: sectionList(sections, "avoid"),
      use_when: sectionList(sections, "use when"),
      not_when: sectionList(sections, "do not use when"),
      exceptions: sectionList(sections, "exceptions"),
      evidence: sectionList(sections, "evidence"),
      checks: sectionList(sections, "check"),
      canonical_path: relative(root, path),
    });
  } catch (error) {
    throw new Error(`${relative(root, path)}: ${String(error)}`);
  }
}

async function runGit(root: string, args: string[]): Promise<string> {
  const result = await execFileAsync("git", ["-C", root, ...args], {
    encoding: "utf8",
    maxBuffer: 256 * 1024,
  });
  return result.stdout.trim();
}

export async function readGit(root: string): Promise<z.infer<typeof gitSchema>> {
  try {
    const [branch, fullCommit, porcelain] = await Promise.all([
      runGit(root, ["branch", "--show-current"]),
      runGit(root, ["rev-parse", "HEAD"]),
      runGit(root, [
        "status",
        "--porcelain=v1",
        "--untracked-files=normal",
        "--",
        ".",
      ]),
    ]);
    const changedFiles = porcelain ? porcelain.split("\n").filter(Boolean).length : 0;
    return {
      available: true,
      branch: branch || null,
      commit: fullCommit.slice(0, 8) || null,
      full_commit: fullCommit || null,
      dirty: changedFiles > 0,
      changed_files: changedFiles,
    };
  } catch {
    return {
      available: false,
      branch: null,
      commit: null,
      full_commit: null,
      dirty: false,
      changed_files: 0,
    };
  }
}

function validateRelations(rules: DoctrineRule[]): void {
  const byId = new Map(rules.map((rule) => [rule.id, rule]));
  for (const rule of rules) {
    if (rule.evidence.length !== rule.supporting_episodes + rule.challenging_episodes) {
      throw new Error(`${rule.id}: episode counts must match the Evidence lines`);
    }
    if (rule.status === "conflicted" && rule.challenging_episodes === 0) {
      throw new Error(`${rule.id}: conflicted rules need challenging evidence`);
    }
    for (const relation of rule.relations) {
      const separator = relation.indexOf(":");
      const type = relation.slice(0, separator);
      const targetId = relation.slice(separator + 1);
      const target = byId.get(targetId);
      if (separator < 1 || !target) throw new Error(`${rule.id}: invalid relation ${relation}`);
      if (type === "supersedes" && target.status !== "retired") {
        throw new Error(`${rule.id}: superseded rule ${targetId} must be retired`);
      }
    }
  }
}

export async function loadDoctrine(rootInput = DEFAULT_DOCTRINE_PATH): Promise<LibraryPayload> {
  const root = expandPath(rootInput);
  const files = await listRuleFiles(root);
  const [rules, git] = await Promise.all([
    Promise.all(files.map((path) => parseRule(path, root))),
    readGit(root),
  ]);
  const ids = new Set<string>();
  for (const rule of rules) {
    if (ids.has(rule.id)) throw new Error(`Duplicate rule ID: ${rule.id}`);
    ids.add(rule.id);
  }
  validateRelations(rules);
  rules.sort((left, right) => left.domain.localeCompare(right.domain) || left.title.localeCompare(right.title));
  const statusCounts = rules.reduce<Record<string, number>>((counts, rule) => {
    counts[rule.status] = (counts[rule.status] ?? 0) + 1;
    return counts;
  }, {});
  return librarySchema.parse({
    root,
    loaded_at: new Date().toISOString(),
    rules,
    domains: [...new Set(rules.map((rule) => rule.domain.split(".")[0]))].sort(),
    status_counts: statusCounts,
    git,
  });
}

function searchableText(rule: DoctrineRule): string {
  return [
    rule.id,
    rule.title,
    rule.statement,
    rule.why,
    rule.kind,
    rule.strength,
    rule.confidence,
    rule.domain,
    ...rule.products,
    ...rule.activities,
    ...rule.artifacts,
    ...rule.surfaces,
    ...rule.prefer,
    ...rule.avoid,
    ...rule.use_when,
    ...rule.not_when,
    ...rule.exceptions,
    ...rule.evidence,
    ...rule.checks,
  ].join("\n").toLocaleLowerCase();
}

function normalizeToken(token: string): string {
  let normalized = token.toLocaleLowerCase();
  if (normalized.length > 5 && normalized.endsWith("ies")) {
    normalized = `${normalized.slice(0, -3)}y`;
  } else if (
    normalized.length > 5 &&
    /(ches|shes|sses|xes|zes)$/.test(normalized)
  ) {
    normalized = normalized.slice(0, -2);
  } else if (
    normalized.length > 4 &&
    normalized.endsWith("s") &&
    !normalized.endsWith("ss")
  ) {
    normalized = normalized.slice(0, -1);
  }
  if (normalized.length > 5 && normalized.endsWith("ly")) {
    normalized = normalized.slice(0, -2);
  }
  return TOKEN_ALIASES.get(normalized) ?? normalized;
}

function tokenize(value: string): string[] {
  return (value.normalize("NFKD").match(/[a-zA-Z0-9]+/g) ?? [])
    .map(normalizeToken)
    .filter((token) => token.length > 1);
}

function weightedSearchFields(rule: DoctrineRule): Array<{
  text: string;
  weight: number;
}> {
  return [
    { text: rule.title, weight: 9 },
    { text: rule.statement, weight: 7 },
    { text: rule.use_when.join(" "), weight: 7 },
    { text: rule.surfaces.join(" "), weight: 6 },
    { text: rule.domain, weight: 6 },
    { text: rule.prefer.join(" "), weight: 5 },
    { text: rule.avoid.join(" "), weight: 5 },
    { text: rule.checks.join(" "), weight: 4 },
    { text: rule.not_when.join(" "), weight: 4 },
    { text: rule.exceptions.join(" "), weight: 4 },
    {
      text: [
        rule.kind,
        rule.strength,
        ...rule.products,
        ...rule.activities,
        ...rule.artifacts,
      ].join(" "),
      weight: 3,
    },
    { text: `${rule.why} ${rule.evidence.join(" ")}`, weight: 2 },
  ];
}

function confidenceScore(rule: DoctrineRule): number {
  return { high: 3, medium: 2, low: 1 }[rule.confidence];
}

export function searchDoctrine(
  rules: DoctrineRule[],
  query: string,
  includeInactive = false,
): DoctrineRule[] {
  const candidates = rules.filter(
    (rule) => includeInactive || rule.status === "active",
  );
  const rawTerms = [...new Set(tokenize(query))];
  const terms = [
    ...rawTerms.filter((token) => !SEARCH_STOP_TOKENS.has(token)),
  ];
  if (rawTerms.length > 0 && terms.length === 0) return [];
  if (terms.length === 0) {
    return candidates
      .sort(
        (left, right) =>
          confidenceScore(right) - confidenceScore(left) ||
          left.id.localeCompare(right.id),
      )
      .slice(0, SEARCH_RESULT_LIMIT);
  }
  const documentFrequency = new Map<string, number>();
  for (const rule of candidates) {
    const tokens = new Set(tokenize(searchableText(rule)));
    for (const term of terms) {
      if (tokens.has(term)) {
        documentFrequency.set(term, (documentFrequency.get(term) ?? 0) + 1);
      }
    }
  }
  return candidates
    .map((rule) => {
      const fields = weightedSearchFields(rule).map(({ text, weight }) => ({
        tokens: new Set(tokenize(text)),
        weight,
      }));
      let matchedTerms = 0;
      let matchedDesignContext = false;
      let strongestFieldWeight = 0;
      let score = confidenceScore(rule) * 0.1;
      for (const term of terms) {
        const bestFieldWeight = fields.reduce(
          (best, field) =>
            field.tokens.has(term) ? Math.max(best, field.weight) : best,
          0,
        );
        if (bestFieldWeight === 0) continue;
        matchedTerms += 1;
        matchedDesignContext ||= DESIGN_CONTEXT_TOKENS.has(term);
        strongestFieldWeight = Math.max(
          strongestFieldWeight,
          bestFieldWeight,
        );
        const frequency = documentFrequency.get(term) ?? 0;
        const inverseFrequency = Math.log(
          (candidates.length + 1) / (frequency + 1),
        ) + 1;
        score += bestFieldWeight * inverseFrequency;
      }
      score += (matchedTerms / terms.length) * 8;
      return {
        rule,
        score,
        matchedTerms,
        matchedDesignContext,
        strongestFieldWeight,
      };
    })
    .filter(
      ({ matchedTerms, matchedDesignContext, strongestFieldWeight }) =>
        matchedTerms >= 2 ||
        matchedDesignContext ||
        strongestFieldWeight >= 6,
    )
    .sort(
      (left, right) =>
        right.score - left.score || left.rule.id.localeCompare(right.rule.id),
    )
    .slice(0, SEARCH_RESULT_LIMIT)
    .map(({ rule }) => rule);
}

export function formatAgentSearchResults(rules: DoctrineRule[]): string {
  if (rules.length === 0) {
    return "No applicable active Design Doctrine rules found.";
  }
  return rules
    .map((rule) => {
      const lines = [
        `${rule.id} · ${rule.strength} · ${rule.confidence} confidence · ${rule.title}`,
        rule.statement,
        `Use when: ${rule.use_when.join("; ")}`,
      ];
      if (rule.not_when.length > 0) {
        lines.push(`Do not use when: ${rule.not_when.join("; ")}`);
      }
      if (rule.exceptions.length > 0) {
        lines.push(`Exceptions: ${rule.exceptions.join("; ")}`);
      }
      lines.push(`Check: ${rule.checks.join("; ")}`);
      return lines.join("\n");
    })
    .join("\n\n");
}

export function automaticDoctrineGuidance(
  rules: DoctrineRule[],
  threadTitle: string | null,
): string | undefined {
  if (!threadTitle) return undefined;
  const titleTokens = new Set(tokenize(threadTitle));
  if (![...titleTokens].some((token) => DESIGN_CONTEXT_TOKENS.has(token))) {
    return undefined;
  }
  const matches = searchDoctrine(rules, threadTitle).slice(
    0,
    AUTOMATIC_RULE_LIMIT,
  );
  if (matches.length === 0) return undefined;
  return [
    "Design Doctrine candidates inferred from the thread title:",
    ...matches.map(
      (rule) =>
        `- ${rule.id} (${rule.strength}): ${rule.title} — ${rule.statement}`,
    ),
    "Validate each rule's Use when and exceptions against the current request. Current user instructions and hard product constraints win. Use design_doctrine_search when the exact task needs different guidance; cite IDs only when they materially affect a decision.",
  ].join("\n");
}

export async function gitStatusFingerprint(rootInput: string): Promise<string> {
  const root = expandPath(rootInput);
  try {
    const [branch, fullCommit, porcelain] = await Promise.all([
      runGit(root, ["branch", "--show-current"]),
      runGit(root, ["rev-parse", "HEAD"]),
      runGit(root, [
        "status",
        "--porcelain=v1",
        "--untracked-files=normal",
        "--",
        ".",
      ]),
    ]);
    return JSON.stringify({ branch, fullCommit, porcelain });
  } catch {
    return "git:unavailable";
  }
}

async function watchFingerprint(rootInput: string): Promise<string> {
  const root = expandPath(rootInput);
  const paths = await listRuleFiles(root);
  const values = await Promise.all(
    paths.map(async (path) => {
      try {
        const value = await stat(path);
        return `${path}:${value.mtimeMs}:${value.size}`;
      } catch {
        return `${path}:missing`;
      }
    }),
  );
  return [...values, await gitStatusFingerprint(root)].join("|");
}

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  if (signal.aborted) return Promise.resolve();
  return new Promise((resolveSleep) => {
    const timer = setTimeout(resolveSleep, ms);
    signal.addEventListener("abort", () => {
      clearTimeout(timer);
      resolveSleep();
    }, { once: true });
  });
}

function formatRule(rule: DoctrineRule): string {
  return [
    `${rule.id} — ${rule.title}`,
    `${rule.strength} · ${rule.confidence} confidence · ${rule.domain}`,
    "",
    rule.statement,
    "",
    `Why: ${rule.why}`,
    "",
    "Prefer:",
    ...rule.prefer.map((item) => `- ${item}`),
    "",
    "Avoid:",
    ...rule.avoid.map((item) => `- ${item}`),
    "",
    "Evidence:",
    ...rule.evidence.map((item) => `- ${item}`),
    "",
    `Source: ${rule.canonical_path}`,
  ].join("\n");
}

function optionValue(argv: string[], name: string): string | undefined {
  const index = argv.indexOf(name);
  if (index < 0) return undefined;
  const value = argv[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`${name} requires a value`);
  }
  return value;
}

function integerOption(
  argv: string[],
  name: string,
  fallback: number,
  minimum: number,
  maximum: number,
): number {
  const raw = optionValue(argv, name);
  if (raw === undefined) return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < minimum || value > maximum) {
    throw new Error(`${name} must be an integer from ${minimum} to ${maximum}`);
  }
  return value;
}

function requiredOption(argv: string[], name: string): string {
  const value = optionValue(argv, name);
  if (value === undefined) throw new Error(`${name} is required`);
  return value;
}

export default async function plugin(bb: BbPluginApi) {
  const settings = bb.settings.define({
    doctrinePath: {
      type: "string",
      label: "Doctrine repository",
      default: DEFAULT_DOCTRINE_PATH,
    },
  });
  let cacheGeneration = 0;
  let cached: { root: string; value: LibraryPayload } | null = null;
  let loading: Promise<LibraryPayload> | null = null;
  let automaticRules: DoctrineRule[] = [];

  function invalidate(): void {
    cacheGeneration += 1;
    cached = null;
    loading = null;
    automaticRules = [];
  }

  async function currentLibrary(): Promise<LibraryPayload> {
    const root = expandPath((await settings.get()).doctrinePath);
    if (cached?.root === root) return cached.value;
    if (loading) return loading;
    const generation = cacheGeneration;
    const request = loadDoctrine(root);
    loading = request;
    try {
      const value = await request;
      if (generation === cacheGeneration) {
        cached = { root, value };
        automaticRules = value.rules;
      }
      return value;
    } finally {
      if (loading === request) loading = null;
    }
  }

  const historyMaintenance = createHistoryMaintenance(
    bb,
    async () => expandPath((await settings.get()).doctrinePath),
    DEFAULT_DOCTRINE_PATH,
  );
  const harvest = createHarvest({
    bb,
    resolveDoctrineRoot: async () =>
      expandPath((await settings.get()).doctrinePath),
    listRuleIds: async () =>
      (
        await loadDoctrine(
          expandPath((await settings.get()).doctrinePath),
        )
      ).rules.map((rule) => rule.id),
    describeExistingRules: async () =>
      (
        await loadDoctrine(
          expandPath((await settings.get()).doctrinePath),
        )
      ).rules
        .map(
          (rule) =>
            `${rule.id} (${rule.domain}, ${rule.strength}): ${rule.title} — ${rule.statement}`,
        )
        .join("\n"),
    validateRules: async () => {
      await loadDoctrine(
        expandPath((await settings.get()).doctrinePath),
      );
    },
    async runAgent({ projectId, environmentId, title, prompt }) {
      const spawned = await bb.sdk.threads.spawn({
        projectId,
        // Hidden so the harvest never interrupts the user. `spawn` attributes
        // the thread to this plugin, which also keeps it out of its own queue.
        visibility: "hidden",
        environment: environmentId
          ? { type: "reuse", environmentId }
          : { type: "host", workspace: { type: "unmanaged", path: null } },
        title,
        prompt,
      });
      await bb.sdk.threads.wait({
        threadId: spawned.id,
        status: "idle",
        timeoutMs: HARVEST_AGENT_TIMEOUT_MS,
      });
    },
  });

  // Serializes harvests so two archives never run agents concurrently, and keeps
  // the work off the archive event, which must stay instant.
  let harvestQueue: Promise<void> = Promise.resolve();

  function drainHarvest(): void {
    harvestQueue = harvestQueue
      .then(async () => {
        for (const {
          threadId,
          projectId,
          environmentId,
        } of harvest.pendingThreads()) {
          await harvest.harvestThread(threadId, projectId, environmentId);
        }
      })
      .catch((error: unknown) => {
        bb.log.warn(
          `doctrine harvest: drain failed: ${error instanceof Error ? error.message : String(error)}`,
        );
      });
  }

  bb.events.on("thread.created", async ({ thread }) => {
    await historyMaintenance.observeCreated(thread);
  });
  bb.events.on("thread.idle", async ({ thread }) => {
    await historyMaintenance.observeThread(thread);
  });
  bb.events.on("thread.archived", ({ thread }) => {
    // Observe-only and fire-and-forget: archiving never waits on the harvest,
    // and a harvest failure is a log line, not a user-facing error.
    try {
      if (!harvest.enqueue(thread)) return;
      drainHarvest();
    } catch (error) {
      bb.log.warn(
        `doctrine harvest: could not queue ${thread.id}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  });
  bb.events.on("thread.deleted", async ({ thread }) => {
    await historyMaintenance.forgetThread(thread.id);
  });
  // Resume durable archive work after reloads. A dirty maintenance checkout
  // leaves the row pending; rule-watch retries it when that checkout changes.
  drainHarvest();

  bb.rpc.register(rpcContract, { getLibrary: currentLibrary });
  bb.agents.registerTool({
    name: "design_doctrine_search",
    description:
      "Search the user's active Design Doctrine rules for a product, UX, UI, visual-design, design-system, or AI-interaction task.",
    instructions:
      "Use this when automatic Design Doctrine guidance does not cover the exact task. Apply only rules whose Use when fits; current user instructions and hard constraints outrank doctrine.",
    parameters: z.object({
      query: z.string().trim().min(2).max(500),
      limit: z.number().int().min(1).max(8).default(6),
    }),
    async execute({ query, limit }) {
      const library = await currentLibrary();
      return formatAgentSearchResults(
        searchDoctrine(library.rules, query).slice(0, limit),
      );
    },
  });
  try {
    await currentLibrary();
  } catch (error) {
    bb.log.warn(error instanceof Error ? error.message : String(error));
  }
  bb.agents.configure(({ thread }) => {
    const instructions = automaticDoctrineGuidance(
      automaticRules,
      thread.title,
    );
    return {
      tools: ["design_doctrine_search"],
      skills: ["design-doctrine"],
      ...(instructions ? { instructions } : {}),
    };
  });
  bb.cli.register({
    name: "doctrine",
    summary: "Browse and search product-design rules",
    commands: [
      { name: "status", summary: "Show rule and Git status", usage: "bb doctrine status [--json]" },
      { name: "search", summary: "Search current rules", usage: "bb doctrine search <query> [--all] [--json]" },
      { name: "show", summary: "Show one rule", usage: "bb doctrine show <rule-id> [--json]" },
      { name: "history", summary: "Scan bb thread history through the SDK", usage: "bb doctrine history <scan|advance|release> [options]" },
      { name: "harvest", summary: "Report archive-harvest proposals and verdicts", usage: "bb doctrine harvest <propose|verdict|status> [options]" },
      { name: "validate", summary: "Validate the personalized rule corpus", usage: "bb doctrine validate" },
    ],
    async run(argv, context) {
      try {
        const command = argv[0] ?? "status";
        const json = argv.includes("--json");
        if (command === "history") {
          const action = argv[1];
          if (action === "scan") {
            const maxBytes = integerOption(
              argv,
              "--max-bytes",
              262_144,
              1,
              900_000,
            );
            const maxMessageBytes = integerOption(
              argv,
              "--max-message-bytes",
              8_192,
              1,
              maxBytes,
            );
            const result = await historyMaintenance.scan({
              limit: integerOption(argv, "--limit", 200, 1, 1_000),
              maxBytes,
              maxMessageBytes,
              leaseSeconds: integerOption(
                argv,
                "--lease-seconds",
                6 * 60 * 60,
                60,
                86_400,
              ),
              forceReconcile: argv.includes("--reconcile"),
              signal: context.signal,
            });
            return { exitCode: 0, stdout: `${JSON.stringify(result, null, 2)}\n` };
          }
          if (action === "advance") {
            const result = await historyMaintenance.advance({
              leaseId: requiredOption(argv, "--lease-id"),
            });
            return { exitCode: 0, stdout: `${JSON.stringify(result)}\n` };
          }
          if (action === "release") {
            const result = await historyMaintenance.release(
              requiredOption(argv, "--lease-id"),
            );
            return { exitCode: 0, stdout: `${JSON.stringify(result)}\n` };
          }
          return {
            exitCode: 2,
            stderr: "Usage: bb doctrine history <scan|advance|release> [options]\n",
          };
        }
        if (command === "harvest") {
          const action = argv[1];
          if (action === "propose") {
            const threadId = requiredOption(argv, "--thread");
            const parsed: unknown = JSON.parse(requiredOption(argv, "--json"));
            const proposals = z
              .array(harvestProposalSchema)
              .max(10)
              .parse(parsed);
            const stored = harvest.recordProposals(threadId, proposals);
            return {
              exitCode: 0,
              stdout: `${JSON.stringify({
                thread_id: threadId,
                recorded: stored.length,
                proposal_ids: stored.map((item) => item.id),
              })}\n`,
            };
          }
          if (action === "verdict") {
            const proposalId = Number(requiredOption(argv, "--proposal"));
            if (!Number.isInteger(proposalId) || proposalId < 1) {
              throw new Error("--proposal must be a positive integer");
            }
            const approve = argv.includes("--approve");
            const reject = argv.includes("--reject");
            if (approve === reject) {
              throw new Error("pass exactly one of --approve or --reject");
            }
            const verdict = harvestVerdictSchema.parse({
              approve,
              reason: requiredOption(argv, "--reason"),
            });
            harvest.recordVerdict(
              proposalId,
              verdict.approve ? "approved" : "rejected",
              verdict.reason,
            );
            return {
              exitCode: 0,
              stdout: `${JSON.stringify({
                proposal_id: proposalId,
                verdict: verdict.approve ? "approved" : "rejected",
              })}\n`,
            };
          }
          if (action === "status") {
            const threadId = requiredOption(argv, "--thread");
            return {
              exitCode: 0,
              stdout: `${JSON.stringify(
                {
                  thread: harvest.threadState(threadId),
                  proposals: harvest.proposalsForThread(threadId).map((item) => ({
                    id: item.id,
                    rule_key: item.ruleKey,
                    verdict: item.verdict,
                    reason: item.reason,
                    written_path: item.writtenPath,
                  })),
                },
                null,
                2,
              )}\n`,
            };
          }
          return {
            exitCode: 2,
            stderr:
              "Usage: bb doctrine harvest <propose|verdict|status> [options]\n",
          };
        }
        if (command === "validate") {
          const library = await loadDoctrine(
            expandPath((await settings.get()).doctrinePath),
          );
          return {
            exitCode: 0,
            stdout: `${JSON.stringify(
              {
                root: library.root,
                rules: library.rules.length,
                statuses: library.status_counts,
              },
              null,
              2,
            )}\n`,
          };
        }
        const library = await currentLibrary();
        if (command === "status") {
          const summary = {
            root: library.root,
            rules: library.rules.length,
            statuses: library.status_counts,
            git: library.git,
          };
          return {
            exitCode: 0,
            stdout: json
              ? `${JSON.stringify(summary, null, 2)}\n`
              : `${summary.rules} rules (${Object.entries(summary.statuses).map(([status, count]) => `${count} ${status}`).join(", ")})\nRepository: ${summary.root}\n`,
          };
        }
        if (command === "search") {
          const query = argv.slice(1).filter((value) => !value.startsWith("--")).join(" ");
          if (!query) return { exitCode: 2, stderr: "Usage: bb doctrine search <query> [--all] [--json]\n" };
          const results = searchDoctrine(library.rules, query, argv.includes("--all"));
          return {
            exitCode: 0,
            stdout: json
              ? `${JSON.stringify(results, null, 2)}\n`
              : results.length
                ? `${results.map((rule) => `${rule.id} · ${rule.confidence} confidence · ${rule.title}\n  ${rule.statement}`).join("\n\n")}\n`
                : "No matching rules.\n",
          };
        }
        if (command === "show") {
          const rule = library.rules.find((item) => item.id === argv[1]);
          if (!rule) return { exitCode: 1, stderr: `Rule not found: ${argv[1] ?? ""}\n` };
          return { exitCode: 0, stdout: json ? `${JSON.stringify(rule, null, 2)}\n` : `${formatRule(rule)}\n` };
        }
        return { exitCode: 2, stderr: "Usage: bb doctrine <status|search|show|history|harvest|validate>\n" };
      } catch (error) {
        return { exitCode: 1, stderr: `${error instanceof Error ? error.message : String(error)}\n` };
      }
    },
  });

  bb.background.service("rule-watch", {
    async start(signal) {
      let fingerprint = await watchFingerprint((await settings.get()).doctrinePath);
      try { await currentLibrary(); } catch (error) {
        bb.log.warn(error instanceof Error ? error.message : String(error));
      }
      while (!signal.aborted) {
        await sleep(WATCH_INTERVAL_MS, signal);
        if (signal.aborted) break;
        const next = await watchFingerprint((await settings.get()).doctrinePath);
        if (next !== fingerprint) {
          fingerprint = next;
          invalidate();
          try {
            await currentLibrary();
          } catch (error) {
            bb.log.warn(error instanceof Error ? error.message : String(error));
          }
          bb.realtime.publish("rules-changed", { changed_at: new Date().toISOString() });
          drainHarvest();
        }
      }
    },
  });
  settings.onChange(() => {
    invalidate();
    void currentLibrary().catch((error) => {
      bb.log.warn(error instanceof Error ? error.message : String(error));
    });
    bb.realtime.publish("rules-changed", { changed_at: new Date().toISOString() });
  });

  void historyMaintenance.prepare().catch((error) => {
    bb.log.warn(
      `could not prepare incremental thread history: ${error instanceof Error ? error.message : String(error)}; the next history scan will retry`,
    );
  });
}
