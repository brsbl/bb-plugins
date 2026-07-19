import {
  defineRpcContract,
  type BbPluginApi,
} from "@bb/plugin-sdk";
import { z } from "zod";
import { providerIndex, providerSnapshot } from "./generated.js";
import { assessProviderHealth } from "./health.js";
import { providerRecordSchema } from "./schema.js";
import {
  getSourceBrowserSnapshot,
  searchSourceItems,
  sourceBrowserSnapshotSchema,
  sourceItemSearchInputSchema,
  sourceItemSearchResultSchema,
} from "./source-browser.js";
import {
  findProviderRecord,
  searchProviderIndex,
} from "./search.js";

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

const publicRecordSchema = providerRecordSchema.extend({
  providerName: z.string().min(1),
});

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
        scope: z.literal("metadata-only"),
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
  searchSourceItems: {
    input: sourceItemSearchInputSchema,
    output: sourceItemSearchResultSchema,
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
  searchProviderRecords: {
    input: z
      .object({
        query: z.string().max(500).optional(),
        providerId: z.string().max(80).optional(),
        kind: z.string().max(120).optional(),
        limit: z.number().int().min(1).max(100).optional(),
      })
      .strict(),
    output: z
      .object({
        mode: z.enum(["browse", "exact", "prefix", "expanded"]),
        queryTerms: z.array(z.string()),
        results: z.array(
          z
            .object({
              record: publicRecordSchema,
              score: z.number().finite(),
            })
            .strict(),
        ),
      })
      .strict(),
  },
  getProviderRecord: {
    input: z
      .object({
        providerId: z.string().min(1).max(80),
        nativeId: z.string().min(1).max(240),
      })
      .strict(),
    output: z
      .object({
        record: publicRecordSchema.nullable(),
      })
      .strict(),
  },
});

function publicRecord(
  record: (typeof providerIndex.documents)[number],
) {
  const {
    key: _key,
    search: _search,
    ...result
  } = record;
  return result;
}

export function registerProviderRpc(bb: BbPluginApi): void {
  bb.rpc.register(sourceBrowserRpcContract, {
    getSourceBrowserSnapshot() {
      const snapshot = getSourceBrowserSnapshot();
      return {
        providers: [...snapshot.providers],
        items: [...snapshot.items],
      };
    },
    searchSourceItems(input) {
      const result = searchSourceItems(input);
      return {
        mode: result.mode,
        queryTerms: [...result.queryTerms],
        items: [...result.items],
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
    searchProviderRecords(input) {
      const result = searchProviderIndex(providerIndex, input);
      return {
        mode: result.mode,
        queryTerms: result.queryTerms,
        results: result.results.map(({ record, score }) => ({
          record: publicRecord(record),
          score,
        })),
      };
    },
    getProviderRecord({ providerId, nativeId }) {
      const record = findProviderRecord(
        providerIndex,
        providerId,
        nativeId,
      );
      return {
        record: record ? publicRecord(record) : null,
      };
    },
  });
}
