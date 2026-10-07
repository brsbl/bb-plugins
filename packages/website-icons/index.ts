import { lookup as dnsLookup } from "node:dns/promises";
import { request as httpsRequest } from "node:https";
import { isIP, type LookupFunction } from "node:net";
import { PNG } from "pngjs";
import type { BbPluginApi } from "@get-bb/plugin-sdk";
import { iconUrl } from "./url.js";

export const ICON_LIMITS = {
  inputBytes: 256 * 1024,
  decodedPixels: 1024 * 1024,
  dimension: 1024,
  outputDimension: 128,
  timeoutMs: 5_000,
  redirects: 2,
  concurrent: 4,
  pending: 64,
  entries: 500,
  cacheBytes: 32 * 1024 * 1024,
  positiveMs: 7 * 24 * 60 * 60 * 1000,
  negativeMs: 60 * 60 * 1000,
} as const;

/** Conservative public-address policy; transitional/mapped IPv6 is never used. */
export function isPublicAddress(address: string): boolean {
  if (isIP(address) === 4) {
    const [a, b, c] = address.split(".").map(Number);
    return !(a === 0 || a === 10 || a === 127 || a! >= 224 ||
      (a === 100 && b! >= 64 && b! <= 127) ||
      (a === 169 && b === 254) || (a === 172 && b! >= 16 && b! <= 31) ||
      (a === 192 && (b === 168 || (b === 0 && (c === 0 || c === 2)) || (b === 88 && c === 99))) ||
      (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) ||
      (a === 203 && b === 0 && c === 113));
  }
  if (isIP(address) !== 6 || address.includes("%")) return false;
  const [first, second = "0"] = address.split(":");
  const a = Number.parseInt(first!, 16);
  const b = Number.parseInt(second || "0", 16);
  return a >= 0x2000 && a <= 0x3fff && a !== 0x2002 &&
    !(a === 0x2001 && (b < 0x0200 || b === 0x0db8)) &&
    !(a === 0x3fff && b < 0x1000);
}

const publicUrl = iconUrl;

/** RPC takes an origin, never a pasted URL or credentials. */
export function publicOrigin(value: string): string | null {
  const url = publicUrl(value);
  return url && (value === url.origin || value === `${url.origin}/`) ? url.origin : null;
}

export function publicLookup(): LookupFunction {
  return (hostname, options, callback) => {
    // Supply the vetted answer directly to this socket, avoiding a second DNS
    // resolution between policy validation and connection (DNS rebinding).
    void dnsLookup(hostname, { all: true, verbatim: true }).then((answers) => {
      if (!answers.length || answers.some(({ address }) => !isPublicAddress(address))) {
        callback(new Error("Website address is not public"), "", 4);
        return;
      }
      const selected = answers.find(({ family }) => family === 4) ?? answers[0]!;
      if (options.all) callback(null, [selected]);
      else callback(null, selected.address, selected.family);
    }, () => callback(new Error("Website address is unavailable"), "", 4));
  };
}

type Resource = { url: URL; body: Buffer; contentType: string };
type Budget = { redirects: number };

/**
 * No ambient HTTP client, shared agent, proxy credentials, cookies or referrer.
 * `truncate` keeps the first bytes of an oversized page, where <head> icon links live, instead of failing.
 */
export async function readPublicResource(input: URL, signal: AbortSignal, budget: Budget, { truncate = false } = {}): Promise<Resource> {
  let url = publicUrl(input.href);
  if (!url) throw new Error("Website URL is not public HTTPS");
  while (true) {
    signal.throwIfAborted();
    const current = url;
    const response = await new Promise<{ status: number; location?: string; contentType: string; body: Buffer }>((resolve, reject) => {
      const request = httpsRequest(current, {
        agent: false,
        lookup: publicLookup(),
        signal,
        headers: { Accept: "image/png,image/x-icon,text/html;q=0.5,*/*;q=0.1", "Accept-Encoding": "identity", "User-Agent": "BB-URL-Pills/0.1" },
      }, (reply) => {
        const status = reply.statusCode ?? 0;
        if ([301, 302, 303, 307, 308].includes(status)) {
          reply.resume();
          resolve({ status, location: reply.headers.location, contentType: "", body: Buffer.alloc(0) });
          reply.destroy();
          return;
        }
        if (status < 200 || status >= 300 ||
          (reply.headers["content-encoding"] && reply.headers["content-encoding"] !== "identity") ||
          (!truncate && Number(reply.headers["content-length"] ?? 0) > ICON_LIMITS.inputBytes)) {
          reply.destroy();
          reject(new Error("Website resource is unavailable"));
          return;
        }
        const contentType = String(reply.headers["content-type"] ?? "");
        const chunks: Buffer[] = [];
        let bytes = 0;
        reply.on("data", (chunk: Buffer) => {
          bytes += chunk.length;
          if (bytes > ICON_LIMITS.inputBytes) {
            if (!truncate) { request.destroy(new Error("Website resource is too large")); return; }
            chunks.push(chunk.subarray(0, chunk.length - (bytes - ICON_LIMITS.inputBytes)));
            resolve({ status, body: Buffer.concat(chunks), contentType });
            reply.destroy();
            return;
          }
          chunks.push(chunk);
        });
        reply.on("end", () => resolve({ status, body: Buffer.concat(chunks), contentType }));
        reply.on("error", reject);
        reply.on("aborted", () => reject(new Error("Website resource was interrupted")));
      });
      request.on("error", reject);
      request.end();
    });
    if (response.location !== undefined && [301, 302, 303, 307, 308].includes(response.status)) {
      if (++budget.redirects > ICON_LIMITS.redirects) throw new Error("Too many website redirects");
      url = publicUrl(new URL(response.location, current).href);
      if (!url) throw new Error("Website redirect is not public HTTPS");
      continue;
    }
    return { url: current, body: response.body, contentType: response.contentType };
  }
}

function validDimensions(width: number, height: number): boolean {
  return Number.isInteger(width) && Number.isInteger(height) && width > 0 && height > 0 &&
    width <= ICON_LIMITS.dimension && height <= ICON_LIMITS.dimension && width * height <= ICON_LIMITS.decodedPixels;
}

function readPng(input: Buffer): PNG {
  if (input.length < 33 || !input.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) ||
    input.readUInt32BE(8) !== 13 || input.toString("ascii", 12, 16) !== "IHDR" || input[28] !== 0 ||
    !validDimensions(input.readUInt32BE(16), input.readUInt32BE(20))) {
    throw new Error("Invalid icon image");
  }
  // pngjs bounds non-interlaced inflation to the declared image size. Reject
  // duplicate IHDR chunks too: they must not replace the dimensions we checked.
  for (let offset = 8; offset < input.length;) {
    if (offset + 12 > input.length) throw new Error("Invalid icon chunk");
    const length = input.readUInt32BE(offset);
    const type = input.toString("ascii", offset + 4, offset + 8);
    if (offset + 12 + length > input.length || (type === "IHDR" && offset !== 8)) throw new Error("Invalid icon chunk");
    offset += length + 12;
  }
  return PNG.sync.read(input, { checkCRC: true });
}

function readIco(input: Buffer): PNG {
  if (input.length < 22 || input.readUInt16LE(0) !== 0 || input.readUInt16LE(2) !== 1) throw new Error("Invalid icon image");
  const count = input.readUInt16LE(4);
  if (!count || count > 64 || 6 + count * 16 > input.length) throw new Error("Invalid icon directory");
  const entries = Array.from({ length: count }, (_, index) => {
    const base = 6 + index * 16;
    return { width: input[base] || 256, height: input[base + 1] || 256, size: input.readUInt32LE(base + 8), offset: input.readUInt32LE(base + 12) };
  }).sort((a, b) => Math.abs(a.width - 32) - Math.abs(b.width - 32));
  for (const entry of entries) {
    if (entry.offset < 6 + count * 16 || entry.size < 40 || entry.offset + entry.size > input.length) continue;
    const bytes = input.subarray(entry.offset, entry.offset + entry.size);
    try {
      if (bytes[0] === 137) return readPng(bytes);
      // Only uncompressed 32-bit icon DIBs. Other ICO encodings safely fall back.
      if (bytes.readUInt32LE(0) !== 40 || bytes.readUInt16LE(12) !== 1 || bytes.readUInt16LE(14) !== 32 || bytes.readUInt32LE(16) !== 0) continue;
      const width = bytes.readInt32LE(4);
      const height = bytes.readInt32LE(8) / 2;
      if (!validDimensions(width, height) || width !== entry.width || height !== entry.height || 40 + width * height * 4 > bytes.length) continue;
      const image = new PNG({ width, height });
      let hasAlpha = false;
      for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
        const source = 40 + ((height - 1 - y) * width + x) * 4;
        const target = (y * width + x) * 4;
        image.data[target] = bytes[source + 2]!;
        image.data[target + 1] = bytes[source + 1]!;
        image.data[target + 2] = bytes[source]!;
        image.data[target + 3] = bytes[source + 3]!;
        hasAlpha ||= bytes[source + 3] !== 0;
      }
      const maskStart = 40 + width * height * 4;
      const maskStride = Math.ceil(width / 32) * 4;
      if (!hasAlpha) {
        if (maskStart + maskStride * height > bytes.length) continue;
        for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
          const mask = bytes[maskStart + (height - 1 - y) * maskStride + (x >> 3)]!;
          image.data[(y * width + x) * 4 + 3] = mask & (0x80 >> (x % 8)) ? 0 : 255;
        }
      }
      return image;
    } catch { /* Try another embedded icon. */ }
  }
  throw new Error("Unsupported icon image");
}

/** Re-encode only bounded raster pixels; never send fetched markup to clients. */
export function decodeIcon(input: Buffer): string | null {
  if (input.length > ICON_LIMITS.inputBytes) return null;
  try {
    const source = input[0] === 137 ? readPng(input) : readIco(input);
    const scale = Math.min(1, ICON_LIMITS.outputDimension / Math.max(source.width, source.height));
    const output = new PNG({ width: Math.max(1, Math.round(source.width * scale)), height: Math.max(1, Math.round(source.height * scale)) });
    for (let y = 0; y < output.height; y++) for (let x = 0; x < output.width; x++) {
      const from = (Math.min(source.height - 1, Math.floor(y / scale)) * source.width + Math.min(source.width - 1, Math.floor(x / scale))) * 4;
      source.data.copy(output.data, (y * output.width + x) * 4, from, from + 4);
    }
    return `data:image/png;base64,${PNG.sync.write(output).toString("base64")}`;
  } catch { return null; }
}

function htmlAttribute(value: string): string {
  return value.replace(/&(?:amp|quot|apos|lt|gt|#\d+|#x[a-f0-9]+);/gi, (entity) => {
    const named: Record<string, string> = { "&amp;": "&", "&quot;": '"', "&apos;": "'", "&lt;": "<", "&gt;": ">" };
    if (named[entity.toLowerCase()]) return named[entity.toLowerCase()]!;
    const number = entity[2]?.toLowerCase() === "x" ? Number.parseInt(entity.slice(3, -1), 16) : Number.parseInt(entity.slice(2, -1), 10);
    return number > 0 && number <= 0x10ffff ? String.fromCodePoint(number) : "";
  });
}

export function declaredIcons(html: string, base: URL): URL[] {
  const urls: URL[] = [];
  const lower = html.toLowerCase();
  let position = 0;
  while (position < html.length) {
    const start = html.indexOf("<", position);
    if (start < 0) break;
    if (lower.startsWith("<!--", start)) {
      const end = html.indexOf("-->", start + 4);
      if (end < 0) break;
      position = end + 3;
      continue;
    }
    const end = html.indexOf(">", start + 1);
    if (end < 0) break;
    position = end + 1;
    const name = /^<([a-z][a-z0-9-]*)\b/.exec(lower.slice(start, Math.min(end, start + 32)))?.[1];
    if (name === "script" || name === "style") {
      const close = lower.indexOf(`</${name}`, position);
      if (close < 0) break;
      position = close;
      continue;
    }
    if (name !== "link" || end - start > 8192) continue;
    const tag = html.slice(start, end + 1);
    const attrs = new Map<string, string>();
    for (const attr of tag.matchAll(/([a-z][\w:-]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi)) {
      attrs.set(attr[1]!.toLowerCase(), htmlAttribute(attr[2] ?? attr[3] ?? attr[4] ?? ""));
    }
    if (!(attrs.get("rel") ?? "").toLowerCase().split(/\s+/).includes("icon")) continue;
    try {
      const url = publicUrl(new URL(attrs.get("href") ?? "", base).href);
      if (url && !urls.some((item) => item.href === url.href)) urls.push(url);
    } catch { /* Ignore malformed declarations. */ }
    if (urls.length === 4) break;
  }
  return urls;
}

export async function resolveIcon(origin: string, signal: AbortSignal): Promise<string | null> {
  if (!publicOrigin(origin)) return null;
  const budget: Budget = { redirects: 0 };
  const imageAt = async (url: URL) => {
    const resource = await readPublicResource(url, signal, budget);
    signal.throwIfAborted();
    return decodeIcon(resource.body);
  };
  try {
    const icon = await imageAt(new URL("/favicon.ico", origin));
    if (icon) return icon;
  } catch { signal.throwIfAborted(); }
  try {
    const page = await readPublicResource(new URL("/", origin), signal, budget, { truncate: true });
    if (!/^(?:text\/html|application\/xhtml\+xml)\b/i.test(page.contentType)) return null;
    for (const candidate of declaredIcons(page.body.toString("utf8"), page.url)) {
      try { const icon = await imageAt(candidate); if (icon) return icon; }
      catch { signal.throwIfAborted(); }
    }
  } catch { signal.throwIfAborted(); }
  return null;
}

export type IconCache = { get(origin: string): string | null | undefined; put(origin: string, dataUrl: string | null): void };

export class IconService {
  private enabled = true;
  private active = 0;
  private queue: Array<() => void> = [];
  private pending = new Map<string, { controller: AbortController; result: Promise<string | null> }>();
  constructor(private cache: IconCache, private resolve: typeof resolveIcon = resolveIcon) {}

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) for (const work of this.pending.values()) work.controller.abort();
  }

  private acquire(signal: AbortSignal): Promise<() => void> {
    return new Promise((resolve, reject) => {
      const start = () => {
        signal.removeEventListener("abort", abort);
        this.active++;
        resolve(() => { this.active--; this.queue.shift()?.(); });
      };
      const abort = () => {
        this.queue = this.queue.filter((item) => item !== start);
        reject(new Error("Icon lookup cancelled"));
      };
      if (signal.aborted) { abort(); return; }
      if (this.active < ICON_LIMITS.concurrent) start();
      else { this.queue.push(start); signal.addEventListener("abort", abort, { once: true }); }
    });
  }

  get(input: string): Promise<string | null> {
    const origin = publicOrigin(input);
    if (!this.enabled || !origin) return Promise.resolve(null);
    const cached = this.cache.get(origin);
    if (cached !== undefined) return Promise.resolve(cached);
    const pending = this.pending.get(origin);
    if (pending) return pending.result;
    if (this.pending.size >= ICON_LIMITS.pending) return Promise.resolve(null);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ICON_LIMITS.timeoutMs);
    const result = (async () => {
      let release: (() => void) | undefined;
      try {
        release = await this.acquire(controller.signal);
        controller.signal.throwIfAborted();
        const data = await this.resolve(origin, controller.signal);
        controller.signal.throwIfAborted();
        this.cache.put(origin, data);
        return data;
      } catch {
        // Timeouts are negative-cached too; explicit disable/disposal is not.
        if (this.enabled) this.cache.put(origin, null);
        return null;
      } finally {
        clearTimeout(timer);
        this.pending.delete(origin);
        release?.();
      }
    })();
    this.pending.set(origin, { controller, result });
    return result;
  }
}

/** Only disposable origin-level raster data lives in the plugin's own database. */
export function createIconCache(bb: Pick<BbPluginApi, "storage">, now = Date.now): IconCache {
  const db = bb.storage.database();
  db.exec("CREATE TABLE IF NOT EXISTS icons (origin TEXT PRIMARY KEY, data TEXT, expires INTEGER NOT NULL, touched INTEGER NOT NULL, bytes INTEGER NOT NULL)");
  const read = db.prepare("SELECT data, expires FROM icons WHERE origin = ?");
  const remove = db.prepare("DELETE FROM icons WHERE origin = ?");
  const touch = db.prepare("UPDATE icons SET touched = ? WHERE origin = ?");
  const write = db.prepare("INSERT OR REPLACE INTO icons(origin, data, expires, touched, bytes) VALUES (?, ?, ?, ?, ?)");
  const expired = db.prepare("DELETE FROM icons WHERE expires <= ?");
  const list = db.prepare("SELECT origin, bytes FROM icons ORDER BY touched DESC, rowid DESC");
  // Misses are retried after each restart or update instead of lingering for the negative TTL.
  db.exec("DELETE FROM icons WHERE data IS NULL");
  const put = db.transaction((origin: string, dataUrl: string | null) => {
    const time = now();
    expired.run(time);
    write.run(origin, dataUrl, time + (dataUrl ? ICON_LIMITS.positiveMs : ICON_LIMITS.negativeMs), time, Buffer.byteLength(dataUrl ?? ""));
    let bytes = 0;
    for (const [index, entry] of (list.all() as Array<{ origin: string; bytes: number }>).entries()) {
      bytes += entry.bytes;
      if (index >= ICON_LIMITS.entries || bytes > ICON_LIMITS.cacheBytes) remove.run(entry.origin);
    }
  });
  return {
    get(origin) {
      const entry = read.get(origin) as { data: string | null; expires: number } | undefined;
      if (!entry) return undefined;
      if (entry.expires <= now()) { remove.run(origin); return undefined; }
      touch.run(now(), origin);
      return entry.data;
    },
    put,
  };
}
