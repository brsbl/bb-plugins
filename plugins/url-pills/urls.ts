/** URL parsing never changes the authored text or the host's href. */
export interface PillUrl {
  text: string;
  label: string;
  origin: string;
  iconOrigin: string | null;
}

export function parsePillUrl(text: string, currentOrigin = ""): PillUrl | null {
  if (text.length > 8192 || !/^https?:\/\//i.test(text) || /[\s<>"'`\u0000-\u001f\u007f\\]/u.test(text)) return null;
  let url: URL;
  try { url = new URL(text); } catch { return null; }
  if (!url.hostname || url.username || url.password) return null;
  // Core owns native thread references, including unresolved literal routes.
  if (url.origin === currentOrigin && /\/(?:threads|thread)\/[^/]+/.test(url.pathname)) return null;
  const explicitPort = /^https?:\/\/[^/?#]+:(\d+)(?:[/?#]|$)/i.exec(text)?.[1];
  const host = url.hostname + (explicitPort ? `:${explicitPort}` : "");
  const hostname = url.hostname.toLowerCase().replace(/\.$/, "");
  const networkName = hostname.includes(".") && !hostname.startsWith("[") && !/^[\d.]+$/.test(hostname)
    && !/(?:^|\.)(?:localhost|local|internal|lan|home|invalid|test)$/.test(hostname);
  return {
    text,
    label: host + (url.pathname === "/" ? "" : url.pathname),
    origin: url.origin,
    iconOrigin: url.protocol === "https:" && !url.port && networkName ? url.origin : null,
  };
}

function trimDelimiters(raw: string): string {
  let text = raw.replace(/[.,!?;:]+$/u, "");
  for (const [open, close] of [["(", ")"], ["[", "]"], ["{", "}"]]) {
    while (text.endsWith(close) && text.split(close).length > text.split(open).length) text = text.slice(0, -1);
  }
  return text.replace(/[.,!?;:]+$/u, "");
}

/** Conservative exclusions for plain-text composers; rendered code is excluded again in the DOM adapter. */
export function findComposerUrls(text: string, currentOrigin = ""): { from: number; to: number }[] {
  const excluded: [number, number][] = [];
  const patterns = [
    /(^|\n)[ \t]{0,3}(`{3,}|~{3,})[^\n]*\n[\s\S]*?(?:\n[ \t]{0,3}\2[^\n]*(?=\n|$)|$)/g,
    /`+[^`\n]*(?:`+|$)/g,
    /(^|\n)[ \t]*>[^\n]*/g,
    /!?\[[^\]\n]*\]\([^\n]*?\)/g,
    /(^|\n)[ \t]*\[[^\]\n]+\]:[^\n]*/g,
  ];
  for (const pattern of patterns) for (const match of text.matchAll(pattern)) excluded.push([match.index, match.index + match[0].length]);
  const ranges: { from: number; to: number }[] = [];
  for (const match of text.matchAll(/https?:\/\/[^\s<>"'`\u0000-\u001f]+/gi)) {
    const from = match.index;
    if (from > 0 && /[\p{L}\p{N}_@/]/u.test(text[from - 1])) continue;
    const candidate = trimDelimiters(match[0]);
    const to = from + candidate.length;
    if (excluded.some(([start, end]) => from < end && to > start)) continue;
    if (parsePillUrl(candidate, currentOrigin)) ranges.push({ from, to });
    // A large paste must not monopolize the editor; the remainder stays text.
    if (ranges.length === 512) break;
  }
  return ranges;
}
