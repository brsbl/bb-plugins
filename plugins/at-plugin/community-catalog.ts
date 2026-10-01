import type { BbPluginApi, PluginMentionItem } from "@get-bb/plugin-sdk";
import { isPluginBrowseQuery } from "./mention-query";
import { PLUGIN_ICON } from "./plugin-icon";

import {
  MAX_ITEM_SUBTITLE_BYTES,
  MAX_ITEM_TITLE_BYTES,
  boundUntrustedText,
  encodeCommunityItemId,
  normalizeStableIdentity,
  normalizeUntrustedText,
} from "./mention-context";

export type CommunityCatalogRecord = Awaited<
  ReturnType<BbPluginApi["sdk"]["plugins"]["catalog"]["search"]>
>["results"][number];

interface CommunityCandidate {
  entry: CommunityCatalogRecord;
  pluginId: string;
  marketplace: string;
  entryId: string;
  displayName: string;
  description: string;
  publisherLabel: string;
  normalizedName: string;
  hostRank: number;
  tier: number;
}

export const COMMUNITY_MARKETPLACE = "bb-community";
const RESULT_LIMIT = 6;

function folded(value: string): string {
  return value.toLowerCase();
}

function startsWord(field: string, query: string): boolean {
  for (let index = field.indexOf(query); index !== -1; index = field.indexOf(query, index + 1)) {
    if (index === 0 || !/[\p{L}\p{N}]/u.test(field[index - 1]!)) return true;
  }
  return false;
}

function matchTier(
  query: string,
  displayName: string,
  pluginId: string,
  entryId: string,
  entry: CommunityCatalogRecord,
): number {
  const foldedQuery = folded(normalizeUntrustedText(query));
  if (foldedQuery.length === 0) return 3;

  const fields = [displayName, pluginId, entryId].map(folded);
  if (fields.some((field) => field === foldedQuery)) return 0;
  if (fields.some((field) => field.startsWith(foldedQuery))) return 1;
  if (fields.some((field) => field.includes(foldedQuery))) return 2;
  // Long descriptions and overviews make mid-word hits ("amb" in "chamber")
  // likely noise, so rank those last. Entries with no local text match were
  // matched by the catalog itself (for example by tag) and keep its ranking.
  const summary = folded(normalizeUntrustedText(`${entry.description} ${entry.category ?? ""}`));
  const overview = folded(normalizeUntrustedText(entry.overview ?? ""));
  if (startsWord(summary, foldedQuery)) return 3;
  if (startsWord(overview, foldedQuery)) return 4;
  if (summary.includes(foldedQuery) || overview.includes(foldedQuery)) return 5;
  return 3;
}

function toCandidate(
  entry: CommunityCatalogRecord,
  query: string,
  hostRank: number,
): CommunityCandidate | null {
  if (
    entry.marketplace !== COMMUNITY_MARKETPLACE ||
    entry.installed !== false ||
    entry.compatible !== true
  ) {
    return null;
  }

  const pluginId = normalizeStableIdentity(entry.pluginId);
  const entryId = normalizeStableIdentity(entry.entryId);
  const displayName = normalizeUntrustedText(entry.displayName);
  if (pluginId === null || entryId === null || displayName.length === 0) return null;

  const description = normalizeUntrustedText(entry.description);
  const publisherLabel = normalizeUntrustedText(entry.publisherLabel);
  return {
    entry,
    pluginId,
    marketplace: COMMUNITY_MARKETPLACE,
    entryId,
    displayName,
    description,
    publisherLabel,
    normalizedName: folded(displayName),
    hostRank,
    tier: matchTier(query, displayName, pluginId, entryId, entry),
  };
}

export function searchCommunityPlugins(
  entries: readonly CommunityCatalogRecord[],
  query: string,
  limit: number | null = RESULT_LIMIT,
): PluginMentionItem[] {
  const browse = isPluginBrowseQuery(query);
  const ranked = entries
    .map((entry, hostRank) => toCandidate(entry, browse ? "" : query, hostRank))
    .filter((candidate): candidate is CommunityCandidate => candidate !== null)
    .sort((left, right) => left.tier - right.tier || left.hostRank - right.hostRank);

  const seenPluginIds = new Set<string>();
  const deduplicated = ranked.filter((candidate) => {
    if (seenPluginIds.has(candidate.pluginId)) return false;
    seenPluginIds.add(candidate.pluginId);
    return true;
  });

  const duplicateNames = new Set(
    Array.from(
      deduplicated.reduce((counts, candidate) => {
        counts.set(candidate.normalizedName, (counts.get(candidate.normalizedName) ?? 0) + 1);
        return counts;
      }, new Map<string, number>()),
    )
      .filter(([, count]) => count > 1)
      .map(([name]) => name),
  );

  return deduplicated.slice(0, browse || limit === null ? undefined : limit).map((candidate) => {
    const detail = candidate.description || candidate.publisherLabel;
    const subtitleParts = [
      "Not installed",
      ...(duplicateNames.has(candidate.normalizedName) ? [candidate.pluginId] : []),
      detail,
    ].filter(Boolean);

    return {
      id: encodeCommunityItemId({
        pluginId: candidate.pluginId,
        marketplace: candidate.marketplace,
        entryId: candidate.entryId,
      }),
      title: boundUntrustedText(candidate.displayName, MAX_ITEM_TITLE_BYTES),
      subtitle: boundUntrustedText(subtitleParts.join(" · "), MAX_ITEM_SUBTITLE_BYTES),
      icon: PLUGIN_ICON,
    };
  });
}
