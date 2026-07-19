import { execFile } from "node:child_process";
import { homedir } from "node:os";
import { basename, dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { readdir, readFile, stat } from "node:fs/promises";

import type { BbPluginApi } from "@bb/plugin-sdk";
import { z } from "zod";

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
const evidenceSourceSchema = z.object({
  type: z.string(),
  store: z.string(),
  thread_id: z.string().nullable(),
  source_keys: stringListSchema,
  project_id: z.string().nullable(),
});
const evidenceSchema = z.object({
  id: z.string(),
  source: evidenceSourceSchema,
  signal: z.string(),
  stance: z.string(),
  observed_at: z.string(),
  summary: z.string(),
  excerpt: z.string().nullable(),
  content_sha256: z.string(),
  doctrine_version_seen: z.string().nullable(),
  episode_id: z.string(),
  episode_source_keys: stringListSchema,
});
const exceptionSchema = z.object({
  id: z.string(),
  condition: z.string(),
  use_instead: z.string(),
  rationale: z.string(),
  evidence_refs: stringListSchema,
});
const relationshipSchema = z.object({
  type: z.string(),
  target_id: z.string(),
  resolution: z.string().nullable(),
});
const lifecycleSchema = z.object({
  status: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  activated_at: z.string().nullable(),
  last_reviewed_at: z.string().nullable(),
  review_after: z.string().nullable(),
  approved_by: z.string().nullable(),
  decision_note: z.string(),
});
const ruleSchema = z.object({
  schema_version: z.number().int(),
  id: z.string(),
  revision: z.number().int(),
  title: z.string(),
  kind: z.string(),
  strength: z.string(),
  statement: z.string(),
  rationale: z.string(),
  guidance: z.object({
    prefer: stringListSchema,
    avoid: stringListSchema,
  }),
  classification: z.object({
    primary: z.string(),
    secondary: stringListSchema,
    pattern_categories: stringListSchema,
  }),
  applicability: z.object({
    products: stringListSchema,
    activities: stringListSchema,
    artifacts: stringListSchema,
    surfaces: stringListSchema,
    contexts: stringListSchema,
    when: stringListSchema,
    not_when: stringListSchema,
  }),
  exceptions: z.array(exceptionSchema),
  relationships: z.array(relationshipSchema),
  evidence: z.array(evidenceSchema),
  confidence: z.object({
    level: z.string(),
    basis: z.object({
      explicit_user_signals: z.number().int(),
      supporting_episodes: z.number().int(),
      challenging_episodes: z.number().int(),
      distinct_threads: z.number().int(),
      distinct_projects: z.number().int(),
    }),
    assessed_at: z.string(),
    note: z.string(),
  }),
  lifecycle: lifecycleSchema,
  retrieval: z.object({
    keywords: stringListSchema,
    aliases: stringListSchema,
    positive_examples: stringListSchema,
    negative_examples: stringListSchema,
  }),
  verification: z.object({
    method: z.string(),
    checks: stringListSchema,
  }),
  canonical_path: z.string(),
});
const taxonomyLeafSchema = z.object({
  id: z.string(),
  name: z.string(),
});
const taxonomyRootSchema = z.object({
  id: z.string(),
  name: z.string(),
  definition: z.string(),
  leaves: z.array(taxonomyLeafSchema),
});
const taxonomySchema = z.object({
  schema_version: z.number().int(),
  updated_at: z.string(),
  id_aliases: z.array(z.unknown()),
  deprecations: z.array(z.unknown()),
  roots: z.array(taxonomyRootSchema),
  pattern_categories: stringListSchema,
  products: z.array(taxonomyLeafSchema),
  activities: stringListSchema,
  artifacts: stringListSchema,
});
const manifestSchema = z.object({
  generated_at: z.string(),
  corpus_sha256: z.string(),
  rule_count: z.number().int(),
  status_counts: z.record(z.string(), z.number().int()),
});
const gitSchema = z.object({
  available: z.boolean(),
  branch: z.string().nullable(),
  commit: z.string().nullable(),
  full_commit: z.string().nullable(),
  committed_at: z.string().nullable(),
  dirty: z.boolean(),
  changed_files: z.number().int(),
});
const librarySchema = z.object({
  root: z.string(),
  loaded_at: z.string(),
  taxonomy: taxonomySchema,
  rules: z.array(ruleSchema),
  status_counts: z.record(z.string(), z.number().int()),
  manifest: manifestSchema.nullable(),
  git: gitSchema,
});

export const rpcContract = defineRpcContract({
  getLibrary: {
    input: z.null(),
    output: librarySchema,
  },
});

export type DoctrineRule = z.infer<typeof ruleSchema>;
export type DoctrineTaxonomy = z.infer<typeof taxonomySchema>;
export type LibraryPayload = z.infer<typeof librarySchema>;

function expandPath(input: string): string {
  if (input === "~") return homedir();
  if (input.startsWith("~/")) return join(homedir(), input.slice(2));
  return resolve(input);
}

async function readJson(path: string): Promise<unknown> {
  return JSON.parse(await readFile(path, "utf8")) as unknown;
}

async function listRuleFiles(root: string): Promise<string[]> {
  const rulesRoot = join(root, "rules");
  const domains = await readdir(rulesRoot, { withFileTypes: true });
  const files = await Promise.all(
    domains
      .filter((entry) => entry.isDirectory())
      .map(async (domain) => {
        const domainRoot = join(rulesRoot, domain.name);
        const entries = await readdir(domainRoot, { withFileTypes: true });
        return entries
          .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
          .map((entry) => join(domainRoot, entry.name));
      }),
  );
  return files.flat().sort();
}

async function runGit(root: string, args: string[]): Promise<string> {
  const result = await execFileAsync("git", ["-C", root, ...args], {
    encoding: "utf8",
    maxBuffer: 256 * 1024,
  });
  return result.stdout.trim();
}

async function readGit(root: string): Promise<z.infer<typeof gitSchema>> {
  try {
    const [branch, fullCommit, committedAt, porcelain] = await Promise.all([
      runGit(root, ["branch", "--show-current"]),
      runGit(root, ["rev-parse", "HEAD"]),
      runGit(root, ["show", "-s", "--format=%cI", "HEAD"]),
      runGit(root, ["status", "--porcelain=v1", "--untracked-files=normal"]),
    ]);
    const changedFiles = porcelain
      ? porcelain.split("\n").filter(Boolean).length
      : 0;
    return {
      available: true,
      branch: branch || null,
      commit: fullCommit.slice(0, 8) || null,
      full_commit: fullCommit || null,
      committed_at: committedAt || null,
      dirty: changedFiles > 0,
      changed_files: changedFiles,
    };
  } catch {
    return {
      available: false,
      branch: null,
      commit: null,
      full_commit: null,
      committed_at: null,
      dirty: false,
      changed_files: 0,
    };
  }
}

export async function loadDoctrine(
  rootInput = DEFAULT_DOCTRINE_PATH,
): Promise<LibraryPayload> {
  const root = expandPath(rootInput);
  const ruleFiles = await listRuleFiles(root);
  const [taxonomyValue, ruleValues, manifestValue, git] = await Promise.all([
    readJson(join(root, "taxonomy.json")),
    Promise.all(ruleFiles.map((path) => readJson(path))),
    readJson(join(root, "generated", "manifest.json")).catch(() => null),
    readGit(root),
  ]);
  const taxonomy = taxonomySchema.parse(taxonomyValue);
  const rules = ruleValues
    .map((value, index) =>
      ruleSchema.parse({
        ...(value as Record<string, unknown>),
        canonical_path: relative(root, ruleFiles[index]),
      }),
    )
    .sort(
      (left, right) =>
        left.classification.primary.localeCompare(
          right.classification.primary,
        ) || left.title.localeCompare(right.title),
    );
  const statusCounts = rules.reduce<Record<string, number>>((counts, rule) => {
    counts[rule.lifecycle.status] = (counts[rule.lifecycle.status] ?? 0) + 1;
    return counts;
  }, {});
  return librarySchema.parse({
    root,
    loaded_at: new Date().toISOString(),
    taxonomy,
    rules,
    status_counts: statusCounts,
    manifest: manifestValue ? manifestSchema.parse(manifestValue) : null,
    git,
  });
}

function searchableText(rule: DoctrineRule): string {
  return [
    rule.id,
    rule.title,
    rule.kind,
    rule.strength,
    rule.statement,
    rule.rationale,
    rule.classification.primary,
    ...rule.classification.secondary,
    ...rule.classification.pattern_categories,
    ...rule.applicability.products,
    ...rule.applicability.activities,
    ...rule.applicability.artifacts,
    ...rule.applicability.surfaces,
    ...rule.applicability.contexts,
    ...rule.applicability.when,
    ...rule.applicability.not_when,
    ...rule.guidance.prefer,
    ...rule.guidance.avoid,
    ...rule.retrieval.keywords,
    ...rule.retrieval.aliases,
    ...rule.retrieval.positive_examples,
    ...rule.retrieval.negative_examples,
    ...rule.verification.checks,
    ...rule.evidence.map((item) => item.summary),
  ]
    .join("\n")
    .toLocaleLowerCase();
}

export function searchDoctrine(
  rules: DoctrineRule[],
  query: string,
  includeAllStatuses = false,
): DoctrineRule[] {
  const terms = query
    .trim()
    .toLocaleLowerCase()
    .split(/\s+/)
    .filter(Boolean);
  return rules
    .filter(
      (rule) =>
        includeAllStatuses || rule.lifecycle.status === "active",
    )
    .filter((rule) => {
      if (terms.length === 0) return true;
      const text = searchableText(rule);
      return terms.every((term) => text.includes(term));
    })
    .slice(0, SEARCH_RESULT_LIMIT);
}

async function watchFingerprint(rootInput: string): Promise<string> {
  const root = expandPath(rootInput);
  const paths = [
    join(root, "taxonomy.json"),
    join(root, "generated", "manifest.json"),
    join(root, ".git", "HEAD"),
    join(root, ".git", "index"),
  ];
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
  return values.join("|");
}

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  if (signal.aborted) return Promise.resolve();
  return new Promise((resolveSleep) => {
    const timer = setTimeout(resolveSleep, ms);
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        resolveSleep();
      },
      { once: true },
    );
  });
}

function librarySummary(library: LibraryPayload): Record<string, unknown> {
  return {
    root: library.root,
    rules: library.rules.length,
    statuses: library.status_counts,
    corpus_sha256: library.manifest?.corpus_sha256 ?? null,
    generated_at: library.manifest?.generated_at ?? null,
    git: library.git,
  };
}

function ruleSummary(rule: DoctrineRule): Record<string, unknown> {
  return {
    id: rule.id,
    title: rule.title,
    status: rule.lifecycle.status,
    domain: rule.classification.primary,
    kind: rule.kind,
    strength: rule.strength,
    statement: rule.statement,
    canonical_path: rule.canonical_path,
  };
}

function formatRule(rule: DoctrineRule): string {
  const evidence = rule.evidence
    .map((item) => {
      const source =
        item.source.type === "published_summary"
          ? "published evidence summary"
          : item.source.thread_id
            ? `${item.source.thread_id}/${item.source.source_keys.join(",")}`
            : item.source.type;
      return `- ${item.summary} (${source})`;
    })
    .join("\n");
  return [
    `${rule.id} — ${rule.title}`,
    `${rule.lifecycle.status} · ${rule.kind} · ${rule.strength} · ${rule.classification.primary}`,
    "",
    rule.statement,
    "",
    `Why: ${rule.rationale}`,
    "",
    "Prefer:",
    ...rule.guidance.prefer.map((item) => `- ${item}`),
    "",
    "Avoid:",
    ...rule.guidance.avoid.map((item) => `- ${item}`),
    "",
    "Evidence:",
    evidence || "- None",
    "",
    `Source: ${rule.canonical_path}`,
  ].join("\n");
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
  let cachedLibrary: { root: string; value: LibraryPayload } | null = null;
  let loadingLibrary: {
    generation: number;
    root: string;
    promise: Promise<LibraryPayload>;
  } | null = null;

  function invalidateLibrary(): void {
    cacheGeneration += 1;
    cachedLibrary = null;
    loadingLibrary = null;
  }

  async function currentLibrary(): Promise<LibraryPayload> {
    const { doctrinePath } = await settings.get();
    const root = expandPath(doctrinePath);
    if (cachedLibrary?.root === root) return cachedLibrary.value;
    if (
      loadingLibrary?.root === root &&
      loadingLibrary.generation === cacheGeneration
    ) {
      return loadingLibrary.promise;
    }

    const generation = cacheGeneration;
    const promise = loadDoctrine(root);
    loadingLibrary = { generation, root, promise };
    try {
      const value = await promise;
      if (generation === cacheGeneration) {
        cachedLibrary = { root, value };
      }
      return value;
    } finally {
      if (loadingLibrary?.promise === promise) loadingLibrary = null;
    }
  }

  bb.rpc.register(rpcContract, {
    getLibrary: currentLibrary,
  });

  bb.cli.register({
    name: "doctrine",
    summary: "Browse and query the personal design doctrine",
    commands: [
      {
        name: "status",
        summary: "Show corpus and Git status",
        usage: "bb doctrine status [--json]",
      },
      {
        name: "search",
        summary: "Search operative rules, or all lifecycle states",
        usage: "bb doctrine search <query> [--all] [--json]",
      },
      {
        name: "show",
        summary: "Show one complete rule",
        usage: "bb doctrine show <rule-id> [--json]",
      },
    ],
    async run(argv) {
      try {
        const library = await currentLibrary();
        const command = argv[0] ?? "status";
        const json = argv.includes("--json");
        if (command === "status") {
          const summary = librarySummary(library);
          return {
            exitCode: 0,
            stdout: json
              ? `${JSON.stringify(summary, null, 2)}\n`
              : [
                  `${summary.rules} rules (${Object.entries(library.status_counts)
                    .map(([status, count]) => `${count} ${status}`)
                    .join(", ")})`,
                  library.git.available
                    ? `Git: ${library.git.branch ?? "detached"}@${library.git.commit ?? "unknown"}${library.git.dirty ? ` · ${library.git.changed_files} changed` : " · clean"}`
                    : "Git: unavailable",
                  `Repository: ${library.root}`,
                ].join("\n") + "\n",
          };
        }
        if (command === "search") {
          const includeAll = argv.includes("--all");
          const query = argv
            .slice(1)
            .filter((value) => !value.startsWith("--"))
            .join(" ");
          if (!query) {
            return {
              exitCode: 2,
              stderr: "Usage: bb doctrine search <query> [--all] [--json]\n",
            };
          }
          const results = searchDoctrine(
            library.rules,
            query,
            includeAll,
          );
          return {
            exitCode: 0,
            stdout: json
              ? `${JSON.stringify(results.map(ruleSummary), null, 2)}\n`
              : results.length
                ? `${results
                    .map(
                      (rule) =>
                        `${rule.id} · ${rule.lifecycle.status} · ${rule.title}\n  ${rule.statement}`,
                    )
                    .join("\n\n")}\n`
                : "No matching rules.\n",
          };
        }
        if (command === "show") {
          const id = argv[1];
          const rule = library.rules.find((item) => item.id === id);
          if (!id || !rule) {
            return {
              exitCode: 1,
              stderr: id
                ? `Rule not found: ${id}\n`
                : "Usage: bb doctrine show <rule-id> [--json]\n",
            };
          }
          return {
            exitCode: 0,
            stdout: json
              ? `${JSON.stringify(rule, null, 2)}\n`
              : `${formatRule(rule)}\n`,
          };
        }
        return {
          exitCode: 2,
          stderr:
            "Usage: bb doctrine <status|search|show> [arguments] [--json]\n",
        };
      } catch (error) {
        return {
          exitCode: 1,
          stderr: `${error instanceof Error ? error.message : String(error)}\n`,
        };
      }
    },
  });

  bb.background.service("corpus-watch", {
    async start(signal) {
      const initial = await settings.get();
      let fingerprint = await watchFingerprint(initial.doctrinePath);
      try {
        await currentLibrary();
      } catch (error) {
        bb.log.warn(
          `could not warm doctrine cache: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
      while (!signal.aborted) {
        await sleep(WATCH_INTERVAL_MS, signal);
        if (signal.aborted) break;
        const nextSettings = await settings.get();
        const nextFingerprint = await watchFingerprint(
          nextSettings.doctrinePath,
        );
        if (nextFingerprint !== fingerprint) {
          fingerprint = nextFingerprint;
          invalidateLibrary();
          bb.realtime.publish("corpus-changed", {
            changed_at: new Date().toISOString(),
          });
        }
      }
    },
  });

  settings.onChange(() => {
    invalidateLibrary();
    bb.realtime.publish("corpus-changed", {
      changed_at: new Date().toISOString(),
    });
  });

  bb.log.info("loaded");
  bb.onDispose(() => {
    bb.log.info("disposed");
  });
}
