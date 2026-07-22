import type { BbPluginApi } from "@bb/plugin-sdk";
import {
  createThreadHistoryMaintenance,
  type HistoryAdvanceInput,
  type HistoryScanOptions,
} from "@brsbl/bb-thread-history-maintenance";

const LEGACY_HISTORY_STATE_KEY = "maintenance:thread-history:v1";

export type { HistoryAdvanceInput, HistoryScanOptions };

export function createHistoryMaintenance(bb: BbPluginApi) {
  return createThreadHistoryMaintenance(bb, {
    legacyStateKeys: [LEGACY_HISTORY_STATE_KEY],
  });
}
