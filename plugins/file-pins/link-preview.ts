import { readPublicResource, type WebsiteResourceErrorReason } from "@brsbl/bb-website-icons";
import { iconUrl } from "@brsbl/bb-website-icons/url";
import { metadataCandidates, pageMetadata } from "./preview-metadata.js";
import { PreviewProviders, ProviderRateLimited } from "./preview-providers.js";

export { pageMetadata };
export type LinkPreview = { title: string; description: string; site: string; image: string | null };
/** How the latest load for a URL ended. `preview` may still hold earlier useful content after a failure. */
export type PreviewStatus = "ready" | "no-image" | "blocked" | "not-found" | "timeout" | "rate-limited" | "unsupported" | "invalid-image" | "network" | "busy";
export type PreviewResult = { preview: LinkPreview | null; status: PreviewStatus; retryAt?: number };
/** Bounded diagnostics only: never the URL, image data or a remote response body. */
export type PreviewDiagnostic = { reason: PreviewStatus; status?: number; elapsedMs: number };
export type PreviewLogger = (diagnostic: PreviewDiagnostic) => void;
type Providers = Pick<PreviewProviders, "get">;

const IMAGE_BYTES = 2 * 1024 * 1024;
export const PREVIEW_LIMITS = {
  active: 4,
  pending: 16,
  queueWaitMs: 5_000,
  entries: 40,
  retainedBytes: 24 * 1024 * 1024,
  loadMs: 12_000,
  requests: 6,
  pageMs: 5_000,
  imageMs: 3_000,
  candidates: 3,
  oembedBytes: 64 * 1024,
  freshMs: 60 * 60_000,
  transientMs: 30_000,
  cooldownMs: 10 * 60_000,
  backoffMs: 24 * 60 * 60_000,
  refreshDebounceMs: 5_000,
} as const;
const USER_AGENT = "Mozilla/5.0 (compatible; BB-Link-Preview/1.0; +https://getbb.app)";
const PAGE_ACCEPT = "text/html,application/xhtml+xml;q=0.9,image/png;q=0.8,image/jpeg;q=0.8,image/webp;q=0.8,*/*;q=0.1";
const IMAGE_ACCEPT = "image/png,image/jpeg,image/webp;q=0.9";
const JSON_ACCEPT = "application/json;q=1,*/*;q=0.1";

/** Only bounded PNG/JPEG/WebP raster data, never SVG or page markup. */
export function previewImage(body: Buffer): string | null {
  let width = 0, height = 0, mime = "";
  if (body.length > IMAGE_BYTES) return null;
  if (body.length >= 33 && body.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
    width = body.readUInt32BE(16); height = body.readUInt32BE(20); mime = "image/png";
  } else if (body.length >= 30 && body.toString("ascii", 0, 4) === "RIFF" && body.toString("ascii", 8, 12) === "WEBP" && body.readUInt32LE(4) + 8 === body.length) {
    const kind = body.toString("ascii", 12, 16);
    const size = body.readUInt32LE(16);
    if (size + 20 > body.length) return null;
    if (kind === "VP8X" && size === 10 && !(body[20] & 2)) {
      width = body.readUIntLE(24, 3) + 1; height = body.readUIntLE(27, 3) + 1;
    } else if (kind === "VP8 " && size >= 10 && body.subarray(23, 26).equals(Buffer.from([0x9d, 0x01, 0x2a]))) {
      width = body.readUInt16LE(26) & 0x3fff; height = body.readUInt16LE(28) & 0x3fff;
    } else if (kind === "VP8L" && size >= 5 && body[20] === 0x2f) {
      const bits = body.readUInt32LE(21);
      width = (bits & 0x3fff) + 1; height = ((bits >>> 14) & 0x3fff) + 1;
    }
    mime = "image/webp";
  } else if (body[0] === 255 && body[1] === 216) {
    for (let i = 2; i + 8 < body.length;) {
      if (body[i++] !== 255) break;
      while (body[i] === 255) i++;
      const marker = body[i++];
      if (marker === 0xda || marker === 0xd9 || i + 2 > body.length) break;
      const length = body.readUInt16BE(i);
      if (length < 2 || i + length > body.length) break;
      if ([0xc0, 0xc1, 0xc2].includes(marker)) {
        height = body.readUInt16BE(i + 3); width = body.readUInt16BE(i + 5); mime = "image/jpeg"; break;
      }
      i += length;
    }
  }
  return width > 0 && height > 0 && width <= 4096 && height <= 4096 && width * height <= 4_000_000
    ? `data:${mime};base64,${body.toString("base64")}` : null;
}

type Outcome = { preview?: LinkPreview | null; status: PreviewStatus; httpStatus?: number; retryAt?: number };
type Entry = {
  good?: LinkPreview;
  status?: PreviewStatus;
  freshUntil: number;
  retryAt?: number;
  refreshedAt?: number;
  inflight?: Promise<PreviewResult>;
  bytes: number;
};
type Slot = { grant(): void; cancel(): void };

/** Our own deadline, distinct from disposal or a transport failure. */
class Expired extends Error {}
class Busy extends Error {}

function failure(error: unknown, now: number): Outcome {
  if (error instanceof ProviderRateLimited) return { status: "rate-limited", retryAt: error.retryAt };
  if (error instanceof Expired) return { status: "timeout" };
  if (error instanceof Busy) return { status: "busy" };
  const detail = error instanceof Error && "reason" in error
    ? error as Error & { reason: WebsiteResourceErrorReason; status?: number; retryAt?: number } : null;
  if (!detail) return { status: "network" };
  const { reason, status, retryAt } = detail;
  const outcome = (value: PreviewStatus): Outcome => ({ status: value, httpStatus: status, retryAt: retryAt && retryAt > now ? retryAt : undefined });
  if (reason !== "http" || status === undefined) return outcome(reason === "network" ? "network" : "unsupported");
  if (status === 429) return { ...outcome("rate-limited"), retryAt: retryAt && retryAt > now ? retryAt : now + PREVIEW_LIMITS.cooldownMs };
  if ([401, 403, 407, 451].includes(status)) return outcome("blocked");
  if (status === 404 || status === 410) return outcome("not-found");
  if (status === 408) return outcome("timeout");
  return outcome(status >= 500 ? "network" : "unsupported");
}

function ttl(status: PreviewStatus): number {
  if (status === "ready" || status === "no-image") return PREVIEW_LIMITS.freshMs;
  if (status === "blocked" || status === "not-found" || status === "unsupported" || status === "rate-limited") return PREVIEW_LIMITS.cooldownMs;
  return PREVIEW_LIMITS.transientMs;
}

/** One URL load: a shared twelve-second deadline and at most six requests, each with its own two-redirect budget. */
class LoadBudget {
  private requests = 0;
  private readonly deadline: number;
  constructor(private readonly signal: AbortSignal) { this.deadline = Date.now() + PREVIEW_LIMITS.loadMs; }
  get aborted() { return this.signal.aborted; }
  get exhausted() { return this.requests >= PREVIEW_LIMITS.requests || Date.now() >= this.deadline; }

  async read(url: URL, kind: "page" | "image" | "api", options: { accept: string; maxBytes: number; truncate?: boolean }) {
    this.signal.throwIfAborted();
    if (++this.requests > PREVIEW_LIMITS.requests) throw new Expired("Preview request limit reached");
    const ms = Math.min(kind === "image" ? PREVIEW_LIMITS.imageMs : PREVIEW_LIMITS.pageMs, this.deadline - Date.now());
    if (ms <= 0) throw new Expired("Preview deadline reached");
    const controller = new AbortController();
    let stop!: (error: unknown) => void;
    const stopped = new Promise<never>((_, reject) => { stop = reject; });
    const abort = () => { const reason = this.signal.reason ?? new Busy("Preview cancelled"); controller.abort(reason); stop(reason); };
    const timer = setTimeout(() => { const reason = new Expired("Preview request timed out"); controller.abort(reason); stop(reason); }, ms);
    this.signal.addEventListener("abort", abort, { once: true });
    try {
      // Racing also bounds a transport that is slow to observe the abort.
      return await Promise.race([stopped, readPublicResource(url, controller.signal, { redirects: 0 }, {
        ...options, userAgent: USER_AGENT, decodeCompressed: true,
      })]);
    } finally {
      clearTimeout(timer);
      this.signal.removeEventListener("abort", abort);
    }
  }
}

function oembed(body: Buffer, base: URL): { title: string; site: string; thumbnail: string | null } | null {
  try {
    const data = JSON.parse(body.toString("utf8")) as Record<string, unknown>;
    if (!data || typeof data !== "object") return null;
    const text = (value: unknown, max: number) => typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, max) : "";
    let thumbnail: string | null = null;
    try { if (typeof data.thumbnail_url === "string" && data.thumbnail_url.length <= 2048) thumbnail = new URL(data.thumbnail_url, base).href; }
    catch { /* A malformed thumbnail leaves the text usable. */ }
    return { title: text(data.title, 240), site: text(data.provider_name, 100), thumbnail };
  } catch { return null; }
}

/**
 * A process-local preview cache: one entry per URL keeping the last useful preview apart from freshness,
 * server-directed retry time and the shared in-flight load. Loads run four at a time behind a short bounded queue.
 */
export class LinkPreviews {
  private cache = new Map<string, Entry>();
  private controllers = new Set<AbortController>();
  private running = 0;
  private queue: Slot[] = [];
  private disposed = false;
  private readonly providers: Providers;
  private readonly logger?: PreviewLogger;

  constructor(options: { logger?: PreviewLogger; providers?: Providers } = {}) {
    this.providers = options.providers ?? new PreviewProviders();
    this.logger = options.logger;
  }

  dispose() {
    this.disposed = true;
    for (const controller of this.controllers) controller.abort(new Busy("Preview cancelled"));
    for (const slot of this.queue.splice(0)) slot.cancel();
    this.cache.clear();
  }

  async get(value: string): Promise<LinkPreview | null> {
    return (await this.getResult(value)).preview;
  }

  /** A stale useful preview returns at once while one refresh runs; `refresh` waits, but never overrides a server-directed pause. */
  getResult(value: string, refresh = false): Promise<PreviewResult> {
    const url = iconUrl(value);
    if (!url) return Promise.resolve({ preview: null, status: "unsupported" });
    if (this.disposed) return Promise.resolve({ preview: null, status: "busy" });
    const now = Date.now();
    const key = url.href;
    const saturated = this.running >= PREVIEW_LIMITS.active && this.queue.length >= PREVIEW_LIMITS.pending;
    let entry = this.cache.get(key);
    // A saturated queue never creates an entry, so a burst of new URLs cannot grow the cache.
    if (!entry && saturated) return Promise.resolve({ preview: null, status: "busy" });
    if (entry) this.cache.delete(key);
    this.cache.set(key, entry ??= { freshUntil: 0, bytes: 0 });
    if (entry.inflight) return entry.good && !refresh ? Promise.resolve(this.snapshot(entry)) : entry.inflight;
    if (entry.retryAt && entry.retryAt > now) return Promise.resolve(this.snapshot(entry));
    if (!refresh && entry.freshUntil > now) return Promise.resolve(this.snapshot(entry));
    if (refresh && entry.refreshedAt !== undefined && now - entry.refreshedAt < PREVIEW_LIMITS.refreshDebounceMs) return Promise.resolve(this.snapshot(entry));
    if (saturated) return Promise.resolve({ ...this.snapshot(entry), status: "busy" });
    if (refresh) entry.refreshedAt = now;
    const result = this.start(key, url, entry);
    entry.inflight = result;
    return entry.good && !refresh ? Promise.resolve(this.snapshot(entry)) : result;
  }

  private snapshot(entry: Entry): PreviewResult {
    const result: PreviewResult = { preview: entry.good ?? null, status: entry.status ?? "busy" };
    if (entry.retryAt && entry.retryAt > Date.now()) result.retryAt = entry.retryAt;
    return result;
  }

  private slot(): Promise<boolean> {
    if (this.running < PREVIEW_LIMITS.active) { this.running++; return Promise.resolve(true); }
    return new Promise((resolve) => {
      const slot: Slot = {
        grant: () => { clearTimeout(timer); resolve(true); },
        cancel: () => { clearTimeout(timer); resolve(false); },
      };
      const timer = setTimeout(() => { this.queue = this.queue.filter((item) => item !== slot); resolve(false); }, PREVIEW_LIMITS.queueWaitMs);
      this.queue.push(slot);
    });
  }

  private release() {
    const next = this.queue.shift();
    if (next) next.grant();
    else this.running--;
  }

  private async start(key: string, url: URL, entry: Entry): Promise<PreviewResult> {
    try {
      if (!await this.slot()) return this.disposed ? { preview: null, status: "busy" } : { ...this.snapshot(entry), status: "busy" };
      const began = Date.now();
      const controller = new AbortController();
      this.controllers.add(controller);
      let outcome: Outcome;
      try { outcome = this.disposed ? { status: "busy" } : await this.load(url, new LoadBudget(controller.signal)); }
      catch (error) { outcome = failure(error, Date.now()); }
      finally { this.controllers.delete(controller); this.release(); }
      if (this.disposed) return { preview: null, status: "busy" };
      if (outcome.status === "busy") return { ...this.snapshot(entry), status: "busy" };
      try { this.logger?.({ reason: outcome.status, ...(outcome.httpStatus ? { status: outcome.httpStatus } : {}), elapsedMs: Date.now() - began }); }
      catch { /* Diagnostics never affect previews. */ }
      return this.settle(key, entry, outcome);
    } finally {
      if (entry.inflight) entry.inflight = undefined;
      // A load that never settled (queue timeout or cancellation) leaves nothing behind.
      if (!entry.status && !entry.good && this.cache.get(key) === entry) this.cache.delete(key);
      this.trim();
    }
  }

  private settle(key: string, entry: Entry, outcome: Outcome): PreviewResult {
    const now = Date.now();
    let preview = outcome.preview ?? null;
    // A failed image refresh keeps the image that already worked.
    if (preview && !preview.image && (outcome.status === "invalid-image" || outcome.status === "rate-limited") && entry.good?.image) preview = { ...preview, image: entry.good.image };
    if (preview) entry.good = preview;
    entry.status = outcome.status;
    entry.retryAt = outcome.retryAt && outcome.retryAt > now ? Math.min(outcome.retryAt, now + PREVIEW_LIMITS.backoffMs) : undefined;
    entry.freshUntil = Math.max(now + ttl(outcome.status), entry.retryAt ?? 0);
    entry.bytes = entry.good ? entry.good.title.length + entry.good.description.length + entry.good.site.length + (entry.good.image?.length ?? 0) : 0;
    if (this.cache.get(key) === entry) this.trim();
    return this.snapshot(entry);
  }

  /** Least-recently-used completed entries go first; an in-flight load is never evicted. */
  private trim() {
    let bytes = 0;
    for (const entry of this.cache.values()) bytes += entry.bytes;
    for (const [key, entry] of this.cache) {
      if (this.cache.size <= PREVIEW_LIMITS.entries && bytes <= PREVIEW_LIMITS.retainedBytes) break;
      if (entry.inflight) continue;
      this.cache.delete(key);
      bytes -= entry.bytes;
    }
  }

  private async load(url: URL, budget: LoadBudget): Promise<Outcome> {
    let provider: Outcome | undefined;
    try {
      const preview = await this.providers.get(url, (target) => budget.read(target, "api", { accept: JSON_ACCEPT, maxBytes: IMAGE_BYTES }));
      if (preview) return { preview, status: preview.image ? "ready" : "no-image" };
    } catch (error) {
      provider = failure(error, Date.now());
      // A paused provider is never worked around through its page; other failures fall back within the same budget.
      if (provider.status === "rate-limited" || provider.status === "busy" || budget.aborted || budget.exhausted) return provider;
    }
    let page: Awaited<ReturnType<LoadBudget["read"]>>;
    try {
      // Some sites (including YouTube) put metadata after large inline scripts.
      page = await budget.read(url, "page", { accept: PAGE_ACCEPT, maxBytes: IMAGE_BYTES, truncate: true });
    } catch (error) {
      // Provider sites usually refuse page fetches, so the provider's own failure is the truthful outcome.
      if (provider && !(error instanceof Busy) && !budget.aborted) return provider;
      throw error;
    }
    if (/^image\//i.test(page.contentType)) {
      const image = page.body.length < IMAGE_BYTES ? previewImage(page.body) : null;
      return image
        ? { preview: { title: page.url.pathname.split("/").pop() || page.url.hostname, description: "", site: page.url.hostname, image }, status: "ready" }
        : { preview: null, status: "invalid-image" };
    }
    if (!/^(?:text\/html|application\/xhtml\+xml)\b/i.test(page.contentType)) return { preview: null, status: "unsupported" };
    const html = page.body.toString("utf8");
    const meta = pageMetadata(html);
    const found = metadataCandidates(html);
    const images = found.images.map((value) => { try { return new URL(value, page.url).href; } catch { return null; } });
    let { title, site } = meta;
    // A server-directed pause stops further requests to that origin in this load and travels with the result.
    const paused = new Map<string, number>();
    const pause = (target: URL, error: unknown) => {
      const { retryAt } = failure(error, Date.now());
      if (retryAt) paused.set(target.origin, Math.max(paused.get(target.origin) ?? 0, retryAt));
    };
    // oEmbed only fills gaps: plain title, provider name and thumbnail URL, never its HTML.
    if (found.oembed && (!title || !site || !images.some(Boolean))) {
      try {
        const endpoint = new URL(found.oembed, page.url);
        const response = await budget.read(endpoint, "page", { accept: JSON_ACCEPT, maxBytes: PREVIEW_LIMITS.oembedBytes });
        const extra = oembed(response.body, response.url);
        if (extra) {
          title ||= extra.title; site ||= extra.site;
          if (extra.thumbnail) images.push(extra.thumbnail);
        }
      } catch (error) {
        if (error instanceof Busy || budget.aborted) throw error;
        try { pause(new URL(found.oembed, page.url), error); } catch { /* An unparsable endpoint was never requested. */ }
      }
    }
    const candidates = [...new Set(images.filter((value): value is string => !!value && !!iconUrl(value)))].slice(0, PREVIEW_LIMITS.candidates);
    let image: string | null = null;
    for (const candidate of candidates) {
      const target = new URL(candidate);
      if (paused.has(target.origin)) continue;
      try {
        const asset = await budget.read(target, "image", { accept: IMAGE_ACCEPT, maxBytes: IMAGE_BYTES });
        image = previewImage(asset.body);
        if (image) break;
      } catch (error) {
        // Keep the text; a later candidate may still work unless the load itself is out of time.
        if (error instanceof Busy || budget.aborted) throw error;
        pause(target, error);
        if (budget.exhausted) break;
      }
    }
    const preview = { title, description: meta.description, site: site || page.url.hostname.replace(/^www\./, ""), image };
    const retryAt = paused.size ? Math.max(...paused.values()) : undefined;
    const status = image ? "ready" : retryAt ? "rate-limited" : candidates.length ? "invalid-image" : "no-image";
    return { preview, status, ...(retryAt ? { retryAt } : {}) };
  }
}
