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

/** The document head with scripts, styles and comments removed, so nothing inside them is read as metadata. */
const head = (html: string) => html.split(/<\/head\s*>/i)[0].replace(/<!--[\s\S]*?-->|<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, "");

function* tags(markup: string, name: "meta" | "link") {
  for (const tag of markup.matchAll(new RegExp(`<${name}\\b(?:[^>"']|"[^"]*"|'[^']*')*>`, "gi"))) {
    const attrs = new Map<string, string>();
    for (const attr of tag[0].matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)) attrs.set(attr[1].toLowerCase(), decode(attr[2] ?? attr[3] ?? attr[4]));
    yield attrs;
  }
}

/** Metadata stays plain text; scripts, markup and remote image URLs never reach the renderer. */
export function pageMetadata(html: string) {
  const markup = head(html);
  const meta = new Map<string, string>();
  for (const attrs of tags(markup, "meta")) {
    const key = attrs.get("property") ?? attrs.get("name");
    if (key && !meta.has(key.toLowerCase())) meta.set(key.toLowerCase(), attrs.get("content") ?? "");
  }
  return {
    title: (meta.get("og:title") || meta.get("twitter:title") || decode(/<title\b[^>]*>([\s\S]*?)<\/title>/i.exec(markup)?.[1] ?? "")).slice(0, 240),
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
  const markup = head(html);
  const groups: string[][] = IMAGE_KEYS.map(() => []);
  const linked: string[] = [];
  let oembed: string | null = null;
  for (const attrs of tags(markup, "meta")) {
    const key = (attrs.get("property") ?? attrs.get("name") ?? "").toLowerCase();
    const group = IMAGE_KEYS.findIndex((keys) => keys.includes(key));
    if (group >= 0) groups[group].push(attrs.get("content") ?? "");
  }
  for (const attrs of tags(markup, "link")) {
    const rel = (attrs.get("rel") ?? "").toLowerCase().split(" ");
    const href = attrs.get("href") ?? "";
    if (rel.includes("image_src")) linked.push(href);
    else if (!oembed && rel.includes("alternate") && attrs.get("type")?.toLowerCase() === "application/json+oembed" && href && href.length <= MAX_URL) oembed = href;
  }
  const images = [...new Set([...groups.flat(), ...linked].filter((url) => url && url.length <= MAX_URL))].slice(0, MAX_IMAGES);
  return { images, oembed };
}
