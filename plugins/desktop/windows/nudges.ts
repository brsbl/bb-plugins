import type { Point } from "../core";

/**
 * Temporary offsets that slide windows clear of the focused composer. A nudge is visual only
 * until the person grabs the window, which commits it to the window's rect.
 */
let nudges: ReadonlyMap<string, Point> = new Map();
const listeners = new Set<() => void>();

export function subscribeNudges(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function windowNudge(id: string): Point | undefined {
  return nudges.get(id);
}

export function setWindowNudges(next: ReadonlyMap<string, Point>) {
  if (next.size === 0 && nudges.size === 0) return;
  nudges = next;
  for (const listener of listeners) listener();
}

export function takeWindowNudge(id: string): Point | undefined {
  const nudge = nudges.get(id);
  if (nudge === undefined) return undefined;
  const next = new Map(nudges);
  next.delete(id);
  setWindowNudges(next);
  return nudge;
}
