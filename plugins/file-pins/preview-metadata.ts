const MAX_IMAGES = 8;
const MAX_URL = 2048;
// Grouped in priority order; within a group, document order wins.
const IMAGE_KEYS = [["og:image:secure_url"], ["og:image", "og:image:url"], ["twitter:image"], ["twitter:image:src"]];

/** Plain text from an HTML attribute or text node: entities decoded, whitespace collapsed. */
export function decode(value: string): string {
  const named: Record<string, string> = { amp: "&", quot: '"', apos: "'", lt: "<", gt: ">", nbsp: " " };
  return value.replace(/&(#x[\da-f]+|#\d+|amp|quot|apos|lt|gt|nbsp);/gi, (_, entity: string) => {
    if (!entity.startsWith("#")) return named[entity.toLowerCase()] ?? "";
    const n = entity[1].toLowerCase() === "x" ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10);
    return n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : "";
  }).replace(/\s+/g, " ").trim();
}

const MAX_TAG = 8192;
const space = (char: string) => /\s/.test(char);
const nameChar = (char: string) => /[\w:-]/.test(char);

// Each cursor only moves forward. Never restart a regex search at every '<':
// malformed pages may contain millions of overlapping, unterminated tags.
function attributes(tag: string, offset: number) {
  const attrs = new Map<string, string>();
  let i = offset;
  while (i < tag.length) {
    while (i < tag.length && !nameChar(tag[i])) i++;
    const start = i;
    while (i < tag.length && nameChar(tag[i])) i++;
    const key = tag.slice(start, i).toLowerCase();
    while (i < tag.length && space(tag[i])) i++;
    if (tag[i] !== "=") continue;
    i++;
    while (i < tag.length && space(tag[i])) i++;
    const quote = tag[i] === '"' || tag[i] === "'" ? tag[i++] : null;
    const valueStart = i;
    if (quote) while (i < tag.length && tag[i] !== quote) i++;
    else while (i < tag.length && !space(tag[i]) && tag[i] !== ">") i++;
    if (key) attrs.set(key, decode(tag.slice(valueStart, i)));
    if (quote) i++;
  }
  return attrs;
}

function* headTags(html: string): Generator<{ name: string; attrs: Map<string, string>; text?: string }> {
  // ASCII folding preserves offsets even for Unicode whose lowercase expands.
  const lower = html.replace(/[A-Z]/g, (char) => char.toLowerCase());
  let cursor = 0;
  while (cursor < html.length) {
    const start = html.indexOf("<", cursor);
    if (start < 0) return;
    if (html.startsWith("<!--", start)) {
      const end = html.indexOf("-->", start + 4);
      if (end < 0) return;
      cursor = end + 3;
      continue;
    }
    // Bound both the tag scan and attribute parsing, including unmatched quotes.
    let end = start + 1;
    let quote: string | null = null;
    for (; end < html.length && end - start <= MAX_TAG; end++) {
      const char = html[end];
      if (quote) { if (char === quote) quote = null; }
      else if (char === '"' || char === "'") quote = char;
      else if (char === ">") break;
    }
    if (end >= html.length || end - start > MAX_TAG) return;
    cursor = end + 1;
    const tag = html.slice(start, cursor);
    const match = /^<(\/?)([a-z][\w:-]*)\b/i.exec(tag);
    if (!match) continue;
    const name = match[2].toLowerCase();
    const closing = match[1] === "/";
    if ((closing && name === "head") || (!closing && name === "body")) return;
    if (closing) continue;
    if (name === "script" || name === "style" || name === "title") {
      const textStart = cursor;
      // Skip raw text in one forward search, even if it contains fake tags.
      const close = `</${name}`;
      let found = lower.indexOf(close, cursor);
      while (found >= 0 && !/[\s>]/.test(lower[found + close.length] ?? "")) {
        found = lower.indexOf(close, found + close.length);
      }
      if (found < 0) return;
      cursor = found;
      if (name === "title") yield { name, attrs: new Map(), text: html.slice(textStart, Math.min(found, textStart + MAX_TAG)) };
    } else if (name === "meta" || name === "link") {
      yield { name, attrs: attributes(tag, match[0].length) };
    }
  }
}

/** Metadata stays plain text; scripts, markup and remote image URLs never reach the renderer. */
export function pageMetadata(html: string) {
  let title = "";
  const meta = new Map<string, string>();
  for (const tag of headTags(html)) {
    if (tag.name === "title" && !title) title = decode(tag.text ?? "");
    if (tag.name !== "meta") continue;
    const attrs = tag.attrs;
    const key = attrs.get("property") ?? attrs.get("name");
    if (key && !meta.has(key.toLowerCase())) meta.set(key.toLowerCase(), attrs.get("content") ?? "");
  }
  return {
    title: (meta.get("og:title") || meta.get("twitter:title") || title).slice(0, 240),
    description: (meta.get("og:description") || meta.get("description") || meta.get("twitter:description") || "").slice(0, 400),
    site: (meta.get("og:site_name") || "").slice(0, 100),
    image: meta.get("og:image") || meta.get("twitter:image") || null,
  };
}

/**
 * Declared preview images in priority order (deduplicated, bounded) and the first advertised JSON oEmbed endpoint.
 * URLs are returned as written; callers resolve them against the page URL and validate them before fetching.
 */
export function metadataCandidates(html: string): { images: string[]; oembed: string | null } {
  const groups: string[][] = IMAGE_KEYS.map(() => []);
  const linked: string[] = [];
  let oembed: string | null = null;
  for (const { name, attrs } of headTags(html)) {
    if (name === "meta") {
      const key = (attrs.get("property") ?? attrs.get("name") ?? "").toLowerCase();
      const group = IMAGE_KEYS.findIndex((keys) => keys.includes(key));
      if (group >= 0) groups[group].push(attrs.get("content") ?? "");
    } else if (name === "link") {
      const rel = (attrs.get("rel") ?? "").toLowerCase().split(" ");
      const href = attrs.get("href") ?? "";
      if (rel.includes("image_src")) linked.push(href);
      else if (!oembed && rel.includes("alternate") && attrs.get("type")?.toLowerCase() === "application/json+oembed" && href && href.length <= MAX_URL) oembed = href;
    }
  }
  const images = [...new Set([...groups.flat(), ...linked].filter((url) => url && url.length <= MAX_URL))].slice(0, MAX_IMAGES);
  return { images, oembed };
}
