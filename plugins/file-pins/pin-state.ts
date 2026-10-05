import type { Reference } from "./contract.js";

export type PinSnapshot = { pins: Reference[]; more: string[]; threadHostId: string | null };

// bb remounts composer banners (plugin reloads, composer swaps), so the strip
// starts from the last pins it showed for the thread instead of an empty strip.
const lastKnown = new Map<string, PinSnapshot>();
const LAST_KNOWN_LIMIT = 100;

export function lastKnownPins(threadId: string): PinSnapshot | undefined {
  return lastKnown.get(threadId);
}

export function rememberPins(threadId: string, snapshot: PinSnapshot): void {
  lastKnown.delete(threadId);
  lastKnown.set(threadId, snapshot);
  if (lastKnown.size > LAST_KNOWN_LIMIT) lastKnown.delete(lastKnown.keys().next().value!);
}

/**
 * Runs one load at a time. A call during a load runs once more after it, so a
 * slow answer is applied rather than dropped for a newer request that may be
 * just as slow.
 */
export function coalesce(load: () => Promise<void>): () => Promise<void> {
  let running: Promise<void> | null = null;
  let again = false;
  return () => {
    if (running) { again = true; return running; }
    running = (async () => {
      try {
        do { again = false; await load(); } while (again);
      } finally { running = null; }
    })();
    return running;
  };
}
