import { execFile } from "node:child_process";
import { promisify } from "node:util";

import type { BbPluginApi } from "@bb/plugin-sdk";
import {
  createThreadHistoryMaintenance,
  type HistoryAdvanceInput,
  type HistoryScanOptions,
} from "@brsbl/bb-thread-history-maintenance";

const execFileAsync = promisify(execFile);
const LEGACY_HISTORY_STATE_KEY = "maintenance:thread-history:v2";

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

export function createHistoryMaintenance(
  bb: BbPluginApi,
  resolvePluginRoot: () => Promise<string>,
) {
  return createThreadHistoryMaintenance(bb, {
    beforeScan: async () => ensureCleanRules(await resolvePluginRoot()),
    legacyStateKeys: [LEGACY_HISTORY_STATE_KEY],
  });
}
