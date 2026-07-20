import type { ProviderSnapshot } from "./schema.js";

const millisecondsPerDay = 86_400_000;

export type ProviderAvailability =
  | "current"
  | "last-known-good"
  | "unavailable";
export type ProviderFreshness = "fresh" | "stale" | "unknown";
export type ProviderHealth = "healthy" | "degraded" | "unavailable";

export interface ProviderHealthReport {
  health: ProviderHealth;
  availability: ProviderAvailability;
  freshness: ProviderFreshness;
  observedAt: string | null;
  staleAt: string | null;
  reason: string | null;
}

export function assessProviderHealth(
  provider: ProviderSnapshot | undefined,
  now: Date = new Date(),
): ProviderHealthReport {
  if (!provider) {
    return {
      health: "unavailable",
      availability: "unavailable",
      freshness: "unknown",
      observedAt: null,
      staleAt: null,
      reason: "no-last-known-good-snapshot",
    };
  }

  const observedAt = new Date(provider.source.observedAt);
  const staleAt = new Date(
    observedAt.getTime() +
      provider.freshness.staleAfterDays * millisecondsPerDay,
  );
  const freshness = now.getTime() > staleAt.getTime() ? "stale" : "fresh";
  const availability =
    provider.build.mode === "current" ? "current" : "last-known-good";
  const degraded = freshness === "stale" || availability === "last-known-good";

  return {
    health: degraded ? "degraded" : "healthy",
    availability,
    freshness,
    observedAt: provider.source.observedAt,
    staleAt: staleAt.toISOString(),
    reason:
      provider.build.failure?.code ??
      (freshness === "stale" ? "freshness-window-exceeded" : null),
  };
}
