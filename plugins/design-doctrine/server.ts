import { execFile } from "node:child_process";
import { createHmac, timingSafeEqual } from "node:crypto";
import { readdir, readFile, stat } from "node:fs/promises";
import { homedir } from "node:os";
import { basename, dirname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import type { BbPluginApi } from "@get-bb/plugin-sdk";
import { z } from "zod";

import {
  type CorpusSource,
  type OpenPublication,
  type Publication,
  materializeRules,
  openPublication,
  pluginDataDirectory,
  publishedBranchId,
  readStalledPublications,
  remoteBranchId,
  resolveBaseBranch,
  resolveGitHubRepository,
  resolveRepositoryRoot,
} from "./corpus.js";
import {
  createHistoryMaintenance,
  ensureNotPublishedBranch,
} from "./history.js";
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
const CORPUS_FRESHNESS_TTL_MS = 15 * 60 * 1_000;
const CORPUS_DIRECTORY = "rules-cache";
const MAX_WEBHOOK_BODY_BYTES = 2 * 1_024 * 1_024;
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

const githubPushEnvelopeSchema = z
  .object({
    ref: z.string(),
    after: z.string().regex(/^[0-9a-f]{40,64}$/i),
    deleted: z.boolean().optional(),
    forced: z.boolean().optional(),
    repository: z.object({ full_name: z.string() }).passthrough(),
  })
  .passthrough();

type GitHubPushDecision =
  | { kind: "refresh"; remoteCommit: string }
  | { kind: "ignore"; reason: string }
  | { kind: "invalid"; reason: string };

function isRulePath(path: string, prefix: string): boolean {
  const rules = `${prefix.replace(/\\/g, "/").replace(/\/$/, "")}/rules`;
  return path === rules || path.startsWith(`${rules}/`);
}

/**
 * A complete GitHub commit list can prove that a push did not touch rules.
 * Incomplete or unfamiliar lists reconcile conservatively instead of risking
 * a missed corpus update.
 */
function pushMayChangeRules(
  payload: Record<string, unknown>,
  prefix: string,
): boolean {
  if (payload.forced === true) return true;
  const size = payload.size;
  const commits = payload.commits;
  if (!Number.isInteger(size) || (size as number) < 0 || !Array.isArray(commits)) {
    return true;
  }
  if (commits.length !== size) return true;
  for (const commit of commits) {
    if (!commit || typeof commit !== "object" || Array.isArray(commit)) return true;
    const row = commit as Record<string, unknown>;
    for (const key of ["added", "modified", "removed"] as const) {
      const paths = row[key];
      if (!Array.isArray(paths) || paths.some((path) => typeof path !== "string")) {
        return true;
      }
      if ((paths as string[]).some((path) => isRulePath(path, prefix))) {
        return true;
      }
    }
  }
  return false;
}

export function classifyGitHubPush(
  input: unknown,
  expectedRepository: string | null,
  source: Pick<CorpusSource, "baseBranch" | "prefix">,
): GitHubPushDecision {
  const parsed = githubPushEnvelopeSchema.safeParse(input);
  if (!parsed.success) return { kind: "invalid", reason: "invalid push payload" };
  if (!expectedRepository) {
    return { kind: "ignore", reason: "origin is not a GitHub repository" };
  }
  if (
    parsed.data.repository.full_name.toLocaleLowerCase() !==
    expectedRepository.toLocaleLowerCase()
  ) {
    return { kind: "ignore", reason: "different repository" };
  }
  if (parsed.data.ref !== `refs/heads/${source.baseBranch}`) {
    return { kind: "ignore", reason: "different branch" };
  }
  if (parsed.data.deleted || /^0+$/.test(parsed.data.after)) {
    return { kind: "ignore", reason: "branch deletion" };
  }
  if (!pushMayChangeRules(parsed.data, source.prefix)) {
    return { kind: "ignore", reason: "rules unchanged" };
  }
  return { kind: "refresh", remoteCommit: parsed.data.after };
}

export function verifyGitHubSignature(
  secret: string,
  body: Uint8Array,
  signature: string | undefined,
): boolean {
  const match = signature?.match(/^sha256=([0-9a-f]{64})$/i);
  if (!match) return false;
  const expected = createHmac("sha256", secret).update(body).digest();
  const received = Buffer.from(match[1], "hex");
  return received.length === expected.length && timingSafeEqual(received, expected);
}

class WebhookBodyTooLargeError extends Error {}

async function readWebhookBody(request: Request): Promise<Uint8Array> {
  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_WEBHOOK_BODY_BYTES) {
    throw new WebhookBodyTooLargeError();
  }
  if (!request.body) return new Uint8Array();
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > MAX_WEBHOOK_BODY_BYTES) {
      await reader.cancel().catch(() => undefined);
      throw new WebhookBodyTooLargeError();
    }
    chunks.push(value);
  }
  const body = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body;
}

export const rpcContract = defineRpcContract({
  getLibrary: { input: z.null(), output: librarySchema },
});

export type DoctrineRule = z.infer<typeof ruleSchema>;
export type LibraryPayload = z.infer<typeof librarySchema>;

/** Resolves a caller-supplied path against the caller's directory. */
function resolveAgainst(cwd: string | undefined, input: string): string {
  if (input === "~" || input.startsWith("~/")) return expandPath(input);
  return isAbsolute(input) ? input : resolve(cwd ?? process.cwd(), input);
}

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

/**
 * Words that mark an episode as worth a reviewer's attention. Deliberately
 * broad: the queue grows about eighty episodes a week and yields a rule from
 * roughly one in twenty-five, so the cost of reading a dull episode is a little
 * budget while the cost of dropping a real one is feedback lost for good.
 */
const FEEDBACK_SIGNAL_TOKENS = new Set([
  ...DESIGN_CONTEXT_TOKENS,
  "align",
  "alignment",
  "badge",
  "chip",
  "cluttered",
  "confusing",
  "contrast",
  "copy",
  "cramped",
  "font",
  "label",
  "language",
  "margin",
  "padding",
  "placement",
  "position",
  "readable",
  "row",
  "spacing",
  "step",
  "tab",
  "table",
  "toast",
  "tooltip",
  "typo",
  "ux",
  "verbose",
  "wording",
  "wordy",
]);

/** Episodes older than this are advanced unread so the queue cannot diverge. */
const EPISODE_MAX_AGE_MS = 90 * 24 * 60 * 60 * 1_000;

/**
 * Decides whether an episode is worth a maintenance pass. Only the user's own
 * messages count, because only those are evidence.
 */
export function skipEpisodeReason(
  episode: {
    title: string;
    targetAt: number;
    messages: ReadonlyArray<{ role: "user" | "assistant"; text: string }>;
  },
  now = Date.now(),
): string | null {
  if (now - episode.targetAt > EPISODE_MAX_AGE_MS) {
    return "older than the review window";
  }
  const spoken = [
    episode.title,
    ...episode.messages
      .filter((message) => message.role === "user")
      .map((message) => message.text),
  ].join(" ");
  for (const token of tokenize(spoken)) {
    if (FEEDBACK_SIGNAL_TOKENS.has(token)) return null;
  }
  return "no design signal in the user's messages";
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
    githubWebhookSecret: {
      type: "string",
      label: "GitHub webhook secret",
      description: "Verifies push events that refresh the published rule corpus.",
      secret: true,
    },
  });
  let cacheGeneration = 0;
  let cached: { root: string; value: LibraryPayload } | null = null;
  let loading: Promise<LibraryPayload> | null = null;
  let automaticRules: DoctrineRule[] = [];

  // The plugin keeps its own copy of the published rules. bb owns the
  // directory, it is rebuilt whenever the published rules change, and it holds
  // no git metadata — nothing commits into it, so there is nothing to lose by
  // rebuilding it. An explicitly configured doctrinePath still wins.
  let corpusSource: CorpusSource | null = null;
  let githubRepository: string | null = null;
  let materializedId: string | null = null;
  let observedRemoteCommit: string | null = null;
  let lastFreshnessCheckAt = Date.now();
  let corpusRefresh: Promise<boolean> | null = null;
  let freshnessCheck: Promise<void> | null = null;
  let watchedFingerprint = "rules:unavailable";
  let stalledPublications: OpenPublication[] = [];
  let reportedStalls: string | null = null;

  /**
   * Resolves where rules are published from. Only a successful resolution is
   * remembered: caching a failure would disable the corpus for the lifetime of
   * the process after one offline fetch.
   */
  async function resolveSource(): Promise<CorpusSource | null> {
    if (corpusSource) return corpusSource;
    const repositoryRoot = await resolveRepositoryRoot(DEFAULT_DOCTRINE_PATH);
    if (!repositoryRoot) return null;
    githubRepository = await resolveGitHubRepository(repositoryRoot);
    const dataDirectory = pluginDataDirectory(bb.storage.database().name);
    const readPath = join(dataDirectory, CORPUS_DIRECTORY);
    // bb owns the data directory; anything materialized inside the repository
    // would surface as untracked work in the user's own checkout.
    if (!isAbsolute(readPath) || !relative(repositoryRoot, readPath).startsWith("..")) {
      return null;
    }
    corpusSource = {
      repositoryRoot,
      baseBranch: await resolveBaseBranch(repositoryRoot),
      prefix: relative(repositoryRoot, DEFAULT_DOCTRINE_PATH),
      readPath,
      workPath: dataDirectory,
    };
    return corpusSource;
  }

  async function doctrineRoot(): Promise<string> {
    const configured = expandPath((await settings.get()).doctrinePath);
    if (configured !== DEFAULT_DOCTRINE_PATH) return configured;
    return materializedId ? (corpusSource?.readPath ?? configured) : configured;
  }

  /**
   * Opens somewhere safe to write a batch of rules. A configured doctrinePath
   * is committed into directly, as before. Otherwise the batch gets a throwaway
   * checkout of the published branch. When neither exists there is nowhere
   * legitimate to commit, and the harvest declines rather than writing rules
   * into the directory the plugin was installed from.
   */
  async function openRulePublication(): Promise<Publication | null> {
    const configured = expandPath((await settings.get()).doctrinePath);
    if (configured !== DEFAULT_DOCTRINE_PATH) {
      await ensureNotPublishedBranch(configured);
      return { root: configured, finish: async () => null };
    }
    const source = await resolveSource();
    if (!source) return null;
    return openPublication(source);
  }

  function invalidate(): void {
    cacheGeneration += 1;
    cached = null;
    loading = null;
    automaticRules = [];
  }

  async function loadCurrentLibrary(): Promise<LibraryPayload> {
    const root = await doctrineRoot();
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

  async function currentLibrary(): Promise<LibraryPayload> {
    await reconcileCorpusOnRead();
    return loadCurrentLibrary();
  }

  const historyMaintenance = createHistoryMaintenance(
    bb,
    DEFAULT_DOCTRINE_PATH,
    (episode) => {
      const reason = skipEpisodeReason(episode);
      if (reason) {
        bb.log.info(`doctrine history: skipped ${episode.threadId} — ${reason}`);
      }
      return reason;
    },
  );
  const harvest = createHarvest({
    bb,
    openPublication: openRulePublication,
    listRuleIds: async (doctrineRoot) =>
      (await loadDoctrine(doctrineRoot)).rules.map((rule) => rule.id),
    describeExistingRules: async (doctrineRoot) =>
      (await loadDoctrine(doctrineRoot)).rules
        .map(
          (rule) =>
            `${rule.id} (${rule.domain}, ${rule.strength}): ${rule.title} — ${rule.statement}`,
        )
        .join("\n"),
    validateRules: async (doctrineRoot) => {
      await loadDoctrine(doctrineRoot);
    },
    async runAgent({ projectId, title, prompt }) {
      const spawned = await bb.sdk.threads.spawn({
        projectId,
        // Hidden so the harvest never interrupts the user. `spawn` attributes
        // the thread to this plugin, which also keeps it out of its own queue.
        visibility: "hidden",
        // Both agents read the thread through bb's API and report through the
        // doctrine CLI; neither opens a file. Reusing the archived thread's
        // environment only tied the harvest to workspaces bb had already
        // destroyed.
        environment: { type: "host", workspace: { type: "unmanaged", path: null } },
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
        } of harvest.pendingThreads()) {
          await harvest.harvestThread(threadId, projectId);
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
      const queued = harvest.enqueue(thread);
      if (!queued && !harvest.isPending(thread.id)) return;
      drainHarvest();
    } catch (error) {
      bb.log.warn(
        `doctrine harvest: could not queue ${thread.id}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  });
  bb.events.on("thread.deleted", async ({ thread }) => {
    harvest.cancel(thread.id);
    await historyMaintenance.forgetThread(thread.id);
  });
  // Resume durable archive work after reloads. A dirty maintenance checkout
  // leaves the row pending; rule-watch retries it when that checkout changes.
  drainHarvest();

  bb.http.route(
    "POST",
    "/github",
    async (context) => {
      const { doctrinePath, githubWebhookSecret } = await settings.get();
      if (!githubWebhookSecret) {
        return context.json(
          { ok: false, error: "GitHub webhook secret is not configured" },
          503,
        );
      }
      let body: Uint8Array;
      try {
        body = await readWebhookBody(context.req.raw);
      } catch (error) {
        if (error instanceof WebhookBodyTooLargeError) {
          return context.json({ ok: false, error: "Webhook body is too large" }, 413);
        }
        throw error;
      }
      if (
        !verifyGitHubSignature(
          githubWebhookSecret,
          body,
          context.req.header("x-hub-signature-256"),
        )
      ) {
        return context.json({ ok: false, error: "Invalid webhook signature" }, 401);
      }
      const event = context.req.header("x-github-event");
      if (event !== "push") {
        return context.json({ ok: true, ignored: event ?? "missing event" }, 202);
      }
      let payload: unknown;
      try {
        payload = JSON.parse(Buffer.from(body).toString("utf8")) as unknown;
      } catch {
        return context.json({ ok: false, error: "Invalid JSON payload" }, 400);
      }
      if (expandPath(doctrinePath) !== DEFAULT_DOCTRINE_PATH) {
        return context.json({ ok: true, ignored: "custom doctrine path" }, 202);
      }
      const source = await resolveSource();
      if (!source) {
        return context.json({ ok: false, error: "Corpus source is unavailable" }, 503);
      }
      const decision = classifyGitHubPush(payload, githubRepository, source);
      if (decision.kind === "invalid") {
        return context.json({ ok: false, error: decision.reason }, 400);
      }
      if (decision.kind === "ignore") {
        return context.json({ ok: true, ignored: decision.reason }, 202);
      }
      try {
        let changed = false;
        if (decision.remoteCommit !== observedRemoteCommit) {
          changed = await refreshCorpus();
          // A second delivery can arrive while the first fetch is in flight.
          // One follow-up closes that race without restoring a poll loop.
          if (decision.remoteCommit !== observedRemoteCommit) {
            changed = (await refreshCorpus()) || changed;
          }
        }
        return context.json({ ok: true, changed }, 200);
      } catch (error) {
        bb.log.warn(
          `doctrine corpus webhook refresh failed: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
        return context.json({ ok: false, error: "Corpus refresh failed" }, 500);
      }
    },
    { auth: "none" },
  );
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
              // A daily pass reads far more than the original ceiling allowed;
              // the queue grows faster than 256KB a day can drain.
              2_097_152,
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
            const token = requiredOption(argv, "--token");
            const parsed: unknown = JSON.parse(requiredOption(argv, "--json"));
            const proposals = z
              .array(harvestProposalSchema)
              .max(10)
              .parse(parsed);
            const stored = harvest.recordProposals(threadId, token, proposals);
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
              requiredOption(argv, "--token"),
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
          // Maintenance edits rules in its own checkout, so it has to be able
          // to validate that working copy rather than the published corpus.
          // The path is the caller's, so it must resolve against the caller's
          // cwd — resolving against this long-lived server process would
          // silently validate an unrelated checkout and report it clean.
          const target = argv[1] && !argv[1].startsWith("--") ? argv[1] : null;
          if (target && !isAbsolute(expandPath(target)) && !context.cwd) {
            return {
              exitCode: 2,
              stderr:
                "bb doctrine validate needs an absolute path when the caller's directory is unknown\n",
            };
          }
          const library = await loadDoctrine(
            target ? resolveAgainst(context.cwd, target) : await doctrineRoot(),
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
            stalled_publications: stalledPublications,
          };
          return {
            exitCode: 0,
            stdout: json
              ? `${JSON.stringify(summary, null, 2)}\n`
              : `${summary.rules} rules (${Object.entries(summary.statuses).map(([status, count]) => `${count} ${status}`).join(", ")})\nRepository: ${summary.root}\n${
                  stalledPublications
                    .map(
                      (stall) =>
                        `Stalled: ${stall.url} not merged after ${stall.ageHours}h (${stall.mergeStateStatus})\n`,
                    )
                    .join("")
                }`,
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

  async function refreshStalls(
    source: CorpusSource,
    signal?: AbortSignal,
  ): Promise<void> {
    try {
      stalledPublications = await readStalledPublications(
        source,
        undefined,
        signal,
      );
    } catch (error) {
      // A failed query must not leave a stale report standing as current. Rule
      // refreshes still succeed when GitHub's pull-request API is unavailable.
      stalledPublications = [];
      bb.log.warn(
        `doctrine corpus publication check failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
    // Say so once per distinct set of stalls rather than every cycle.
    const signature = stalledPublications.map((row) => `${row.url}:${row.mergeStateStatus}`).join(",");
    if (signature !== reportedStalls) {
      reportedStalls = signature;
      for (const stall of stalledPublications) {
        bb.log.warn(
          `doctrine corpus: ${stall.url} has not merged after ${stall.ageHours}h (${stall.mergeStateStatus}); those rules stay unpublished until it does`,
        );
      }
    }
  }

  /**
   * Fetch and publish the corpus once. The single-flight wrapper below keeps a
   * webhook, startup, and stale read from racing the atomic symlink swap.
   */
  async function performCorpusRefresh(signal?: AbortSignal): Promise<boolean> {
    const source = await resolveSource();
    if (!source) return false;
    const published = await materializeRules(source, materializedId, signal);
    observedRemoteCommit = await publishedBranchId(source, signal);
    lastFreshnessCheckAt = Date.now();
    if (published) {
      materializedId = published;
      invalidate();
      await loadCurrentLibrary();
      watchedFingerprint = await safeFingerprint();
      bb.realtime.publish("rules-changed", {
        changed_at: new Date().toISOString(),
      });
    }
    await refreshStalls(source, signal);
    return published !== null;
  }

  async function refreshCorpus(signal?: AbortSignal): Promise<boolean> {
    if (corpusRefresh) return corpusRefresh;
    const request = performCorpusRefresh(signal);
    corpusRefresh = request;
    try {
      return await request;
    } finally {
      if (corpusRefresh === request) corpusRefresh = null;
    }
  }

  /**
   * Reconcile a webhook missed while bb was offline. Reads at most probe one
   * remote ref per TTL, and only a changed ref downloads git objects.
   */
  async function reconcileCorpusOnRead(): Promise<void> {
    const configured = expandPath((await settings.get()).doctrinePath);
    if (configured !== DEFAULT_DOCTRINE_PATH) return;
    if (Date.now() - lastFreshnessCheckAt < CORPUS_FRESHNESS_TTL_MS) return;
    if (freshnessCheck) return freshnessCheck;
    const request = (async () => {
      // Rate-limit failures as well as successes so an offline read path stays
      // fast and keeps serving the last good corpus.
      lastFreshnessCheckAt = Date.now();
      try {
        const source = await resolveSource();
        if (!source) return;
        const remoteCommit = await remoteBranchId(source);
        if (remoteCommit !== observedRemoteCommit || materializedId === null) {
          await refreshCorpus();
          if (remoteCommit !== observedRemoteCommit) await refreshCorpus();
        } else {
          await refreshStalls(source);
        }
      } catch (error) {
        bb.log.warn(
          `doctrine corpus freshness check failed: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    })();
    freshnessCheck = request;
    try {
      await request;
    } finally {
      if (freshnessCheck === request) freshnessCheck = null;
    }
  }

  /**
   * Never let an unreadable rules directory throw out of the watcher: a crash
   * loop here would take the service down with the one cycle that repairs it
   * still pending, which is the failure this whole design exists to remove.
   */
  async function safeFingerprint(): Promise<string> {
    try {
      return await watchFingerprint(await doctrineRoot());
    } catch (error) {
      bb.log.warn(
        `doctrine rules unreadable: ${error instanceof Error ? error.message : String(error)}`,
      );
      return "rules:unavailable";
    }
  }

  bb.background.service("rule-watch", {
    async start(signal) {
      // Build the read copy before serving anything, rather than a cycle later.
      try {
        await refreshCorpus(signal);
      } catch (error) {
        bb.log.warn(
          `doctrine corpus startup refresh failed: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
      watchedFingerprint = await safeFingerprint();
      try { await currentLibrary(); } catch (error) {
        bb.log.warn(error instanceof Error ? error.message : String(error));
      }
      while (!signal.aborted) {
        await sleep(WATCH_INTERVAL_MS, signal);
        if (signal.aborted) break;
        const next = await safeFingerprint();
        if (next !== watchedFingerprint) {
          watchedFingerprint = next;
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
  settings.onChange((next, previous) => {
    if (next.doctrinePath === previous.doctrinePath) return;
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
