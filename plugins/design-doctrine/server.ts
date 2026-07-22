import { execFile } from "node:child_process";
import { readdir, readFile, stat } from "node:fs/promises";
import { homedir } from "node:os";
import { basename, dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import type { BbPluginApi } from "@bb/plugin-sdk";
import { z } from "zod";

import { createHistoryMaintenance } from "./history.js";

const execFileAsync = promisify(execFile);
const MODULE_DIR = dirname(fileURLToPath(import.meta.url));
const DEFAULT_DOCTRINE_PATH =
  basename(MODULE_DIR) === "dist" ? dirname(MODULE_DIR) : MODULE_DIR;
const WATCH_INTERVAL_MS = 2_500;
const SEARCH_RESULT_LIMIT = 24;

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

export function searchDoctrine(
  rules: DoctrineRule[],
  query: string,
  includeInactive = false,
): DoctrineRule[] {
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const confidence = { high: 3, medium: 2, low: 1 } as const;
  return rules
    .filter((rule) => includeInactive || rule.status === "active")
    .map((rule) => {
      const text = searchableText(rule);
      const matches = terms.filter((term) => text.includes(term)).length;
      return { rule, score: matches * 10 + confidence[rule.confidence] };
    })
    .filter(({ score }) => terms.length === 0 || score >= terms.length * 10)
    .sort((left, right) => right.score - left.score || left.rule.id.localeCompare(right.rule.id))
    .slice(0, SEARCH_RESULT_LIMIT)
    .map(({ rule }) => rule);
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

  function invalidate(): void {
    cacheGeneration += 1;
    cached = null;
    loading = null;
  }

  async function currentLibrary(): Promise<LibraryPayload> {
    const root = expandPath((await settings.get()).doctrinePath);
    if (cached?.root === root) return cached.value;
    if (loading) return loading;
    const generation = cacheGeneration;
    loading = loadDoctrine(root);
    try {
      const value = await loading;
      if (generation === cacheGeneration) cached = { root, value };
      return value;
    } finally {
      loading = null;
    }
  }

  const historyMaintenance = createHistoryMaintenance(bb, async () =>
    expandPath((await settings.get()).doctrinePath),
  );
  await historyMaintenance.prepare();
  bb.events.on("thread.created", async ({ thread }) => {
    await historyMaintenance.observeCreated(thread);
  });
  bb.events.on("thread.idle", async ({ thread }) => {
    await historyMaintenance.observeThread(thread);
  });
  bb.events.on("thread.deleted", async ({ thread }) => {
    await historyMaintenance.forgetThread(thread.id);
  });

  bb.rpc.register(rpcContract, { getLibrary: currentLibrary });
  bb.cli.register({
    name: "doctrine",
    summary: "Browse and search product-design rules",
    commands: [
      { name: "status", summary: "Show rule and Git status", usage: "bb doctrine status [--json]" },
      { name: "search", summary: "Search current rules", usage: "bb doctrine search <query> [--all] [--json]" },
      { name: "show", summary: "Show one rule", usage: "bb doctrine show <rule-id> [--json]" },
      { name: "history", summary: "Scan bb thread history through the SDK", usage: "bb doctrine history <scan|advance|release> [options]" },
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
        return { exitCode: 2, stderr: "Usage: bb doctrine <status|search|show|history|validate>\n" };
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
          bb.realtime.publish("rules-changed", { changed_at: new Date().toISOString() });
        }
      }
    },
  });
  settings.onChange(() => {
    invalidate();
    bb.realtime.publish("rules-changed", { changed_at: new Date().toISOString() });
  });
}
