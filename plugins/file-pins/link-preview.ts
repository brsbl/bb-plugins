import { readPublicResource } from "@brsbl/bb-website-icons";
import { iconUrl } from "@brsbl/bb-website-icons/url";

export type LinkPreview = { title: string; description: string; site: string; image: string | null };
const IMAGE_BYTES = 2 * 1024 * 1024;

function decode(value: string): string {
  const named: Record<string, string> = { amp: "&", quot: '"', apos: "'", lt: "<", gt: ">", nbsp: " " };
  return value.replace(/&(#x[\da-f]+|#\d+|amp|quot|apos|lt|gt|nbsp);/gi, (_, entity: string) => {
    if (!entity.startsWith("#")) return named[entity.toLowerCase()] ?? "";
    const n = entity[1].toLowerCase() === "x" ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10);
    return n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : "";
  }).replace(/\s+/g, " ").trim();
}

/** Metadata stays plain text; scripts, markup and remote image URLs never reach the renderer. */
export function pageMetadata(html: string) {
  const head = html.split(/<\/head\s*>/i)[0].replace(/<!--[\s\S]*?-->|<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, "");
  const meta = new Map<string, string>();
  for (const tag of head.matchAll(/<meta\b(?:[^>"']|"[^"]*"|'[^']*')*>/gi)) {
    const attrs = new Map<string, string>();
    for (const attr of tag[0].matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)) attrs.set(attr[1].toLowerCase(), decode(attr[2] ?? attr[3] ?? attr[4]));
    const key = attrs.get("property") ?? attrs.get("name");
    if (key && !meta.has(key.toLowerCase())) meta.set(key.toLowerCase(), attrs.get("content") ?? "");
  }
  return {
    title: (meta.get("og:title") || meta.get("twitter:title") || decode(/<title\b[^>]*>([\s\S]*?)<\/title>/i.exec(head)?.[1] ?? "")).slice(0, 240),
    description: (meta.get("og:description") || meta.get("description") || meta.get("twitter:description") || "").slice(0, 400),
    site: (meta.get("og:site_name") || "").slice(0, 100),
    image: meta.get("og:image") || meta.get("twitter:image") || null,
  };
}

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

/** A small per-plugin cache, with one fetch per URL and no unbounded queue. */
export class LinkPreviews {
  private cache = new Map<string, { expires: number; result: Promise<LinkPreview | null> }>();
  private active = new Set<AbortController>();
  private disposed = false;
  dispose() { this.disposed = true; for (const request of this.active) request.abort(); this.cache.clear(); }
  get(value: string): Promise<LinkPreview | null> {
    const url = iconUrl(value);
    if (!url || this.disposed) return Promise.resolve(null);
    const cached = this.cache.get(url.href);
    if (cached && cached.expires > Date.now()) return cached.result;
    if (this.active.size >= 4) return Promise.resolve(null);
    const controller = new AbortController();
    this.active.add(controller);
    const timer = setTimeout(() => controller.abort(), 5_000);
    const result = this.load(url, controller.signal).catch(() => null).finally(() => {
      clearTimeout(timer); this.active.delete(controller);
    });
    this.cache.delete(url.href);
    this.cache.set(url.href, { expires: Date.now() + 60 * 60_000, result });
    if (this.cache.size > 40) this.cache.delete(this.cache.keys().next().value!);
    return result;
  }
  private async load(url: URL, signal: AbortSignal): Promise<LinkPreview | null> {
    // Some sites (including YouTube) put metadata after large inline scripts.
    const page = await readPublicResource(url, signal, { redirects: 0 }, { truncate: true, maxBytes: IMAGE_BYTES });
    if (/^image\//i.test(page.contentType)) {
      const image = page.body.length < IMAGE_BYTES ? previewImage(page.body) : null;
      return image ? { title: page.url.pathname.split("/").pop() || page.url.hostname, description: "", site: page.url.hostname, image } : null;
    }
    if (!/^text\/html\b/i.test(page.contentType)) return null;
    const meta = pageMetadata(page.body.toString("utf8"));
    let image: string | null = null;
    if (meta.image) {
      try {
        const asset = await readPublicResource(new URL(meta.image, page.url), signal, { redirects: 0 }, { maxBytes: IMAGE_BYTES });
        image = previewImage(asset.body);
      } catch { /* Keep metadata and the site's cached-icon fallback. */ }
    }
    return { ...meta, site: meta.site || page.url.hostname.replace(/^www\./, ""), image };
  }
}
