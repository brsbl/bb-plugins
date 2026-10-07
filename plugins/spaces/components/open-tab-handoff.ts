// "Open" in the Space tab navigates to another thread, which unmounts the tab. The always-mounted More controller
// picks this request up once that thread is on screen and opens the Space tab there, so the panel stays on Space.

const REQUEST_TTL_MS = 5_000;

let pending: { threadId: string; expiresAt: number } | null = null;
const listeners = new Set<() => void>();

export function requestSpaceTab(threadId: string, now = Date.now()): void {
  pending = { threadId, expiresAt: now + REQUEST_TTL_MS };
  for (const listener of listeners) listener();
}

export function hasSpaceTabRequest(threadId: string, now = Date.now()): boolean {
  return pending !== null && pending.threadId === threadId && pending.expiresAt > now;
}

export function clearSpaceTabRequest(threadId: string): void {
  if (pending?.threadId === threadId) pending = null;
}

export function subscribeSpaceTabRequests(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
