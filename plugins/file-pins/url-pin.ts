export const MAX_URL_LENGTH = 4096;
export const MAX_TITLE_LENGTH = 200;

/** True when CLI input names a URL (`scheme://`) rather than a file path. */
export function looksLikeUrl(input: string): boolean {
  return /^[a-z][a-z\d+.-]*:\/\//i.test(input.trim());
}

/** Only http(s) URLs without credentials can be pinned; the normalized href is the pin's identity. */
export function parseWebUrl(input: string): string | null {
  const text = input.trim();
  if (!text || text.length > MAX_URL_LENGTH || /[\s\u0000-\u001f\u007f]/u.test(text)) return null;
  try {
    const url = new URL(text);
    if ((url.protocol !== "http:" && url.protocol !== "https:") || !url.hostname || url.username || url.password) return null;
    return url.href.length <= MAX_URL_LENGTH ? url.href : null;
  } catch { return null; }
}

function decode(segment: string): string {
  try { return decodeURIComponent(segment); } catch { return segment; }
}

/** Compact Links' label, shortened: the host without www., then the first and last path segments. */
export function urlLabel(href: string): string {
  const url = new URL(href);
  const host = url.host.replace(/^www\./i, "");
  const segments = url.pathname.split("/").filter(Boolean).map(decode);
  const path = segments.length > 2 ? [segments[0], "…", segments.at(-1)] : segments;
  return [host, ...path].join("/");
}

/** A page title the agent supplied, collapsed to one line, or the URL's label. */
export function urlPinName(href: string, title?: string): string {
  const text = title?.replace(/\s+/g, " ").trim();
  return text ? text.slice(0, MAX_TITLE_LENGTH) : urlLabel(href);
}
