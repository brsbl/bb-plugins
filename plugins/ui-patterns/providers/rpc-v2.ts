import {
  defineRpcContract,
  type BbPluginApi,
} from "@bb/plugin-sdk";
import { z } from "zod";
import { providerSnapshot } from "./generated-v2.js";
import { assessProviderHealth } from "./health.js";
import {
  atlasEntrySearchInputSchema,
  atlasEntrySearchResultSchema,
  getSourceBrowserSnapshot,
  searchAtlasEntries,
  sourceBrowserSnapshotSchema,
} from "./source-browser-v2.js";
import { contentModeSchema } from "./schema.js";

const healthReportSchema = z
  .object({
    health: z.enum(["healthy", "degraded", "unavailable"]),
    availability: z.enum(["current", "last-known-good", "unavailable"]),
    freshness: z.enum(["fresh", "stale", "unknown"]),
    observedAt: z.string().nullable(),
    staleAt: z.string().nullable(),
    reason: z.string().nullable(),
  })
  .strict();

const providerSummarySchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    homepage: z.url(),
    recordCount: z.number().int().nonnegative(),
    license: z
      .object({
        expression: z.string().min(1),
        url: z.url(),
        scope: contentModeSchema,
        notice: z.string().min(1),
      })
      .strict(),
    health: healthReportSchema,
  })
  .strict();

export const sourceBrowserRpcContract = defineRpcContract({
  getSourceBrowserSnapshot: {
    input: z.null(),
    output: sourceBrowserSnapshotSchema,
  },
  searchAtlasEntries: {
    input: atlasEntrySearchInputSchema,
    output: atlasEntrySearchResultSchema,
  },
});

export const providerRpcContract = defineRpcContract({
  listProviders: {
    input: z.null(),
    output: z
      .object({
        providers: z.array(providerSummarySchema),
        snapshotFingerprint: z.string(),
      })
      .strict(),
  },
});

export function registerProviderRpc(bb: BbPluginApi): void {
  bb.rpc.register(sourceBrowserRpcContract, {
    getSourceBrowserSnapshot() {
      const snapshot = getSourceBrowserSnapshot();
      return {
        providers: [...snapshot.providers],
        records: [...snapshot.records],
        entries: [...snapshot.entries],
      };
    },
    searchAtlasEntries(input) {
      const result = searchAtlasEntries(input);
      return {
        mode: result.mode,
        queryTerms: [...result.queryTerms],
        entries: [...result.entries],
      };
    },
  });
  bb.rpc.register(providerRpcContract, {
    listProviders() {
      const now = new Date();
      return {
        providers: providerSnapshot.providers.map((provider) => ({
          id: provider.id,
          name: provider.name,
          homepage: provider.homepage,
          recordCount: provider.records.length,
          license: provider.license,
          health: assessProviderHealth(provider, now),
        })),
        snapshotFingerprint: providerSnapshot.fingerprint,
      };
    },
  });
}
