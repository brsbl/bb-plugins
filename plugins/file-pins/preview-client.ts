import type { LinkPreview, PreviewStatus } from "./link-preview.js";

/** The `preview` and `refreshPreview` RPC output; servers before statuses send only `preview`. */
export type PreviewAnswer = { preview: LinkPreview | null; status?: PreviewStatus; retryAt?: number };
/** What a hover card shows: the last answer, kept while a newer one loads, and whether the last request failed. */
export type PreviewState = { readonly answer?: PreviewAnswer; readonly loading: boolean; readonly failed: boolean };
type Entry = { state: PreviewState; freshUntil: number; generation: number; bytes: number; load?: Promise<void>; refresh?: Promise<PreviewAnswer> };

export const CLIENT_PREVIEW_LIMITS = {
  entries: 40,
  bytes: 24 * 1024 * 1024,
  // The server keeps its own hour; this only spares repeat hovers a round trip, then asks again.
  freshMs: 5 * 60_000,
  // Failures are asked again on a later hover so the server's own 30-second retry is never masked.
  retryMs: 5_000,
} as const;
const EMPTY: PreviewState = Object.freeze({ loading: false, failed: false });

export const previewKey = (threadId: string, pinId: string, url: string) => JSON.stringify([threadId, pinId, url]);
/** A ready page or one that simply has no image; anything else is a failed or paused load. */
export function usefulAnswer(answer: PreviewAnswer): boolean {
  return answer.status === undefined ? answer.preview !== null : answer.status === "ready" || answer.status === "no-image";
}

/**
 * Hover cards' preview answers across mounts, keyed by thread, pin and URL. Concurrent hovers share one request,
 * Refresh replaces the answer for open cards, and an answer from before a refresh never lands after it.
 */
export class PreviewClient {
  private entries = new Map<string, Entry>();
  private listeners = new Map<string, Set<() => void>>();

  state(key: string): PreviewState {
    return this.entries.get(key)?.state ?? EMPTY;
  }

  subscribe(key: string, listener: () => void): () => void {
    let set = this.listeners.get(key);
    if (!set) this.listeners.set(key, set = new Set());
    set.add(listener);
    return () => {
      set.delete(listener);
      if (set.size === 0 && this.listeners.get(key) === set) this.listeners.delete(key);
    };
  }

  /** Asks the server unless a recent answer is fresh. Failures land in the state, never as a rejection. */
  load(key: string, call: () => Promise<PreviewAnswer>): Promise<void> {
    const entry = this.touch(key);
    if (entry.refresh) return entry.refresh.then(() => undefined, () => undefined);
    if (entry.load) return entry.load;
    if (entry.freshUntil > Date.now()) return Promise.resolve();
    const load = this.request(key, entry, call).then(() => undefined, () => undefined)
      .finally(() => { if (entry.load === load) entry.load = undefined; this.settle(key, entry); });
    entry.load = load;
    this.settle(key, entry);
    return load;
  }

  /** Re-asks through `call` (the server's refresh), keeping the current preview until a useful one replaces it. */
  refresh(key: string, call: () => Promise<PreviewAnswer>): Promise<PreviewAnswer> {
    const entry = this.touch(key);
    if (entry.refresh) return entry.refresh;
    entry.freshUntil = 0;
    // A load already on its way answered the older question; its answer is dropped.
    entry.generation++;
    const refresh = this.request(key, entry, call)
      .finally(() => { if (entry.refresh === refresh) entry.refresh = undefined; this.settle(key, entry); });
    entry.refresh = refresh;
    this.settle(key, entry);
    return refresh;
  }

  private async request(key: string, entry: Entry, call: () => Promise<PreviewAnswer>): Promise<PreviewAnswer> {
    const generation = entry.generation;
    const current = () => entry.generation === generation && this.entries.get(key) === entry;
    try {
      const answer = await call();
      // A failed refresh keeps the preview that already worked.
      const merged: PreviewAnswer = { ...answer, preview: answer.preview ?? entry.state.answer?.preview ?? null };
      if (current()) {
        const now = Date.now();
        entry.freshUntil = usefulAnswer(answer) ? now + CLIENT_PREVIEW_LIMITS.freshMs
          : Math.min(Math.max(now + CLIENT_PREVIEW_LIMITS.retryMs, answer.retryAt ?? 0), now + CLIENT_PREVIEW_LIMITS.freshMs);
        entry.bytes = merged.preview ? merged.preview.title.length + merged.preview.description.length + merged.preview.site.length + (merged.preview.image?.length ?? 0) : 0;
        entry.state = { ...entry.state, answer: merged, failed: false };
        this.trim();
      }
      return merged;
    } catch (error) {
      if (current()) {
        entry.freshUntil = Date.now() + CLIENT_PREVIEW_LIMITS.retryMs;
        entry.state = { ...entry.state, failed: true };
      }
      throw error;
    }
  }

  private settle(key: string, entry: Entry) {
    const loading = !!(entry.load || entry.refresh);
    if (entry.state.loading !== loading) entry.state = { ...entry.state, loading };
    if (this.entries.get(key) === entry) for (const listener of [...this.listeners.get(key) ?? []]) listener();
  }

  private touch(key: string): Entry {
    let entry = this.entries.get(key);
    if (entry) this.entries.delete(key);
    else entry = { state: EMPTY, freshUntil: 0, generation: 0, bytes: 0 };
    this.entries.set(key, entry);
    this.trim();
    return entry;
  }

  /** Least-recently-used first; an open card's entry or one still loading stays. */
  private trim() {
    let bytes = 0;
    for (const entry of this.entries.values()) bytes += entry.bytes;
    for (const [key, entry] of this.entries) {
      if (this.entries.size <= CLIENT_PREVIEW_LIMITS.entries && bytes <= CLIENT_PREVIEW_LIMITS.bytes) break;
      if (entry.load || entry.refresh || this.listeners.has(key)) continue;
      this.entries.delete(key);
      bytes -= entry.bytes;
    }
  }
}

/** One shared cache for every hover card in the app. */
export const previewClient = new PreviewClient();

/** A short, truthful reason a preview is missing or stale. */
export function previewProblem(answer: PreviewAnswer | undefined, now = Date.now()): string {
  switch (answer?.status) {
    case "blocked": return "This site doesn't allow previews.";
    case "not-found": return "This page wasn't found.";
    case "rate-limited": {
      const minutes = answer.retryAt && answer.retryAt > now ? Math.max(1, Math.ceil((answer.retryAt - now) / 60_000)) : 0;
      return minutes ? `This site is limiting requests. Try again in ${minutes} min.` : "This site is limiting requests. Try again later.";
    }
    case "timeout": return "The site took too long to respond.";
    case "unsupported": return "This link has no page to preview.";
    case "invalid-image": return "The preview image couldn't be loaded.";
    case "busy": return "Previews are busy. Try again in a moment.";
    default: return "Couldn't reach the site.";
  }
}

/** The Refresh preview toast: success only when the server loaded the page now. */
export function refreshNotice(answer: PreviewAnswer, now = Date.now()): { ok: boolean; message: string } {
  if (usefulAnswer(answer)) {
    return { ok: true, message: answer.status === "no-image" ? "Preview refreshed. This page has no image." : "Preview refreshed" };
  }
  const problem = previewProblem(answer, now);
  return { ok: false, message: answer.preview ? `${problem} Showing the last preview.` : problem };
}
