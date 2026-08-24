import { execFile } from "node:child_process";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";

import type { BbPluginApi } from "@bb/plugin-sdk";
import {
  createThreadHistoryMaintenance,
  type HistoryAdvanceInput,
  type HistoryScanOptions,
} from "@brsbl/bb-thread-history-maintenance";

const execFileAsync = promisify(execFile);
const LEGACY_HISTORY_STATE_KEY = "maintenance:thread-history:v2";
const LEGACY_HISTORY_STATE_PATH = join("maintenance", "state.json");
const PRIMARY_BRANCH_NAMES = new Set(["main", "master", "trunk"]);

export type { HistoryAdvanceInput, HistoryScanOptions };

async function ensureMaintenanceBranch(pluginRoot: string): Promise<void> {
  let branchName: string;
  try {
    const branch = await execFileAsync(
      "git",
      ["-C", pluginRoot, "symbolic-ref", "--quiet", "--short", "HEAD"],
      { encoding: "utf8" },
    );
    branchName = branch.stdout.trim();
    if (branchName.length === 0) throw new Error("missing branch");
  } catch {
    throw new Error(
      "maintenance requires doctrinePath to point to a dedicated non-default branch checkout, not a detached managed install; configure it with `bb plugin config design-doctrine set doctrinePath /path/to/bb-plugins-doctrine-maintenance/plugins/design-doctrine`",
    );
  }
  if (PRIMARY_BRANCH_NAMES.has(branchName)) {
    throw new Error(
      `maintenance refuses primary branch ${branchName}; use a dedicated non-default branch/worktree and point doctrinePath at its plugins/design-doctrine folder`,
    );
  }
}

async function ruleTreeStatus(pluginRoot: string): Promise<string> {
  const result = await execFileAsync(
    "git",
    [
      "-C",
      pluginRoot,
      "status",
      "--porcelain=v1",
      "--untracked-files=all",
      "--",
      "rules",
    ],
    { encoding: "utf8" },
  );
  return result.stdout;
}

export async function ensureMaintenanceCheckout(
  pluginRoot: string,
): Promise<void> {
  await ensureMaintenanceBranch(pluginRoot);
  if ((await ruleTreeStatus(pluginRoot)).length > 0) {
    throw new Error(
      "rules tree has pre-existing work; commit, stash, or move it before scanning",
    );
  }
}

export interface NewRuleFile {
  relativePath: string;
  content: string;
}

function assertRulePath(relativePath: string): void {
  if (!/^rules\/[a-z-]+\/ddr_\d{3,}\.md$/.test(relativePath)) {
    throw new Error(`invalid generated rule path: ${relativePath}`);
  }
}

async function rollbackNewRuleFiles(
  pluginRoot: string,
  relativePaths: readonly string[],
): Promise<void> {
  if (relativePaths.length === 0) return;
  await execFileAsync(
    "git",
    ["-C", pluginRoot, "restore", "--staged", "--", ...relativePaths],
    { encoding: "utf8" },
  ).catch(() => undefined);
  await Promise.all(
    relativePaths.map(async (relativePath) => {
      try {
        await unlink(join(pluginRoot, relativePath));
      } catch (error) {
        if (!isMissingFile(error)) throw error;
      }
    }),
  );
}

/**
 * Completes one archive-harvest batch atomically: create, validate, and commit
 * only its new rule files. A failed batch removes only files it created, so it
 * cannot strand the maintenance checkout in the dirty state that blocks scans.
 */
export async function commitNewRuleFiles(
  pluginRoot: string,
  files: readonly NewRuleFile[],
  validate: () => Promise<void>,
): Promise<void> {
  if (files.length === 0) return;
  if (files.length > 5) {
    throw new Error("a doctrine harvest may commit at most five rule files");
  }
  const relativePaths = files.map((file) => file.relativePath);
  for (const relativePath of relativePaths) assertRulePath(relativePath);
  if (new Set(relativePaths).size !== relativePaths.length) {
    throw new Error("generated rule paths must be unique");
  }

  await ensureMaintenanceCheckout(pluginRoot);
  const created: string[] = [];
  let committed = false;
  try {
    for (const file of files) {
      const absolutePath = join(pluginRoot, file.relativePath);
      await mkdir(join(absolutePath, ".."), { recursive: true });
      await writeFile(absolutePath, file.content, { encoding: "utf8", flag: "wx" });
      created.push(file.relativePath);
    }

    await validate();
    const expectedStatus = new Set(
      relativePaths.map((relativePath) => `?? ${relativePath}`),
    );
    const actualStatus = (await ruleTreeStatus(pluginRoot))
      .trimEnd()
      .split("\n")
      .filter(Boolean);
    if (
      actualStatus.length !== expectedStatus.size ||
      actualStatus.some((line) => !expectedStatus.has(line))
    ) {
      throw new Error("rules tree changed while the doctrine harvest was running");
    }

    await execFileAsync("git", ["-C", pluginRoot, "add", "--", ...relativePaths]);
    await execFileAsync("git", [
      "-C",
      pluginRoot,
      "diff",
      "--check",
      "--cached",
      "--",
      ...relativePaths,
    ]);
    await execFileAsync("git", [
      "-C",
      pluginRoot,
      "commit",
      "--only",
      "-m",
      "doctrine: harvest archived feedback",
      "--",
      ...relativePaths,
    ]);
    committed = true;
  } finally {
    if (!committed) await rollbackNewRuleFiles(pluginRoot, created);
  }
}

function normalizeEpochMilliseconds(value: unknown): unknown {
  if (typeof value !== "number" || !Number.isFinite(value)) return value;
  return value < 10_000_000_000 ? value * 1_000 : value;
}

function normalizeLegacyState(value: unknown): unknown {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("legacy maintenance state must be a JSON object");
  }
  const state = value as Record<string, unknown>;
  const lease = state.lease;
  if (typeof lease !== "object" || lease === null || Array.isArray(lease)) {
    return state;
  }
  const leaseRecord = lease as Record<string, unknown>;
  return {
    ...state,
    lease: {
      ...leaseRecord,
      acquired_at: normalizeEpochMilliseconds(leaseRecord.acquired_at),
      expires_at: normalizeEpochMilliseconds(leaseRecord.expires_at),
    },
  };
}

function isMissingFile(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "ENOENT"
  );
}

async function importLegacyStateFile(
  bb: BbPluginApi,
  pluginRoot: string,
): Promise<string | null> {
  const statePath = join(pluginRoot, LEGACY_HISTORY_STATE_PATH);
  let source: string;
  try {
    source = await readFile(statePath, "utf8");
  } catch (error) {
    if (isMissingFile(error)) return null;
    throw error;
  }
  const state = normalizeLegacyState(JSON.parse(source) as unknown);
  await bb.storage.kv.set(LEGACY_HISTORY_STATE_KEY, state);
  return statePath;
}

async function removeMigratedStateFile(
  bb: BbPluginApi,
  statePath: string | null,
): Promise<void> {
  if (statePath === null) return;
  if (
    (await bb.storage.kv.get<unknown>(LEGACY_HISTORY_STATE_KEY)) !== undefined
  ) {
    return;
  }
  try {
    await unlink(statePath);
  } catch (error) {
    if (!isMissingFile(error)) throw error;
  }
}

export function createHistoryMaintenance(
  bb: BbPluginApi,
  resolveDoctrineRoot: () => Promise<string>,
  installedPluginRoot: string,
) {
  const history = createThreadHistoryMaintenance(bb, {
    beforeScan: async () =>
      ensureMaintenanceCheckout(await resolveDoctrineRoot()),
    legacyStateKeys: [LEGACY_HISTORY_STATE_KEY],
  });
  let migrationQueue: Promise<unknown> = Promise.resolve();

  function withLegacyStateMigration<T>(operation: () => Promise<T>): Promise<T> {
    const result = migrationQueue.then(async () => {
      const statePath = await importLegacyStateFile(bb, installedPluginRoot);
      const output = await operation();
      await removeMigratedStateFile(bb, statePath);
      return output;
    });
    migrationQueue = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  }

  return {
    ...history,
    prepare: () => withLegacyStateMigration(() => history.prepare()),
    scan: (options: HistoryScanOptions) =>
      withLegacyStateMigration(() => history.scan(options)),
  };
}
