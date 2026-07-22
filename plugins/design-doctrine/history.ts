import { execFile } from "node:child_process";
import { readFile, unlink } from "node:fs/promises";
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

export type { HistoryAdvanceInput, HistoryScanOptions };

async function ensureCleanRules(pluginRoot: string): Promise<void> {
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
  if (result.stdout.length > 0) {
    throw new Error(
      "rules tree has pre-existing work; commit, stash, or move it before scanning",
    );
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
  resolvePluginRoot: () => Promise<string>,
) {
  const history = createThreadHistoryMaintenance(bb, {
    beforeScan: async () => ensureCleanRules(await resolvePluginRoot()),
    legacyStateKeys: [LEGACY_HISTORY_STATE_KEY],
  });
  let migrationQueue: Promise<unknown> = Promise.resolve();

  function withLegacyStateMigration<T>(operation: () => Promise<T>): Promise<T> {
    const result = migrationQueue.then(async () => {
      const statePath = await importLegacyStateFile(
        bb,
        await resolvePluginRoot(),
      );
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
