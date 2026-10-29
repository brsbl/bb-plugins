import { parseLocalFile, type LocalFile } from "./files";
/** URL parsing never changes the authored text or the host's href. */
export interface PillUrl {
  text: string;
  localFile?: LocalFile;
  label: string;
  origin: string;
  iconOrigin: string | null;
}

export function parsePillUrl(text: string, currentOrigin = ""): PillUrl | null {
  const localFile = parseLocalFile(text);
  if (localFile) return { text, label: localFile.label, localFile, origin: "", iconOrigin: null };
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
    /(^|\n)[ \t]*>[^\n]*/g,
    /!?\[[^\]\n]*\]\([^\n]*?\)/g,
    /(^|\n)[ \t]*\[[^\]\n]+\]:[^\n]*/g,
  ];
  for (const pattern of patterns) for (const match of text.matchAll(pattern)) excluded.push([match.index, match.index + match[0].length]);
  // Code spans can cross line breaks, but close only at an equally long run.
  // Index the next matching run once, avoiding repeated searches in large drafts.
  const ticks = [...text.matchAll(/`+|\n[ \t]*\n/g)];
  const next = new Map<number, number>(), closing = new Map<number, number>();
  for (let i = ticks.length - 1; i >= 0; i--) {
    const run = ticks[i]!;
    if (run[0][0] !== '`') { next.clear(); continue; }
    const end = next.get(run[0].length);
    if (end !== undefined) closing.set(i, end);
    next.set(run[0].length, i);
  }
  for (let i = 0; i < ticks.length; i++) {
    const run = ticks[i]!;
    if (run[0][0] !== '`' || excluded.some(([start, end]) => run.index >= start && run.index < end)) continue;
    const end = closing.get(i);
    if (end !== undefined) {
      excluded.push([run.index, ticks[end]!.index + run[0].length]); i = end;
    } else {
      // Preserve conservative handling of unfinished code on the current line.
      const lineEnd = text.indexOf('\n', run.index);
      excluded.push([run.index, lineEnd === -1 ? text.length : lineEnd]);
    }
  }
  // Indented code starts at a block boundary; indentation alone cannot
  // interrupt an ordinary paragraph. Blank lines may continue the code block.
  let offset = 0, afterBlank = true, inIndentedCode = false;
  for (const line of text.split('\n')) {
    const blank = /^[ \t]*$/.test(line);
    if (!blank) {
      inIndentedCode = /^(?: {4}| {0,3}\t)/.test(line) && (afterBlank || inIndentedCode);
      if (inIndentedCode) excluded.push([offset, offset + line.length]);
    }
    afterBlank = blank;
    offset += line.length + 1;
  }
  // A path alone on its line has an unambiguous end, so it may contain spaces.
  // Its first directory must not, which keeps slash commands and prose as text.
  const lines: { from: number; to: number }[] = [];
  offset = 0;
  for (const source of text.split('\n')) {
    const lineStart = offset;
    offset += source.length + 1;
    const path = /^[ \t]{0,3}((?:\/|[A-Za-z]:[\\/])[^\s\\/]+[\\/].*\S)/u.exec(source.length <= 8192 ? source : '');
    if (!path || !/[ \t]/u.test(path[1]) || /[<>"'`\u0000-\u001f]|[ \t](?:\/|[A-Za-z]:[\\/]|(?:https?|file):)/iu.test(path[1])) continue;
    const candidate = trimDelimiters(path[1]);
    const from = lineStart + path[0].length - path[1].length;
    const to = from + candidate.length;
    if (!/\.[\p{L}\p{N}]+(?::\d+(?:-\d+|:\d+)?|#L\d+(?:C\d+)?(?:-L?\d+(?:C\d+)?)?)?$/u.test(candidate)) continue;
    if (excluded.some(([start, end]) => from < end && to > start)) continue;
    if (parsePillUrl(candidate, currentOrigin)?.localFile) lines.push({ from, to });
    if (lines.length === 512) break;
  }
  const ranges: { from: number; to: number }[] = [];
  let line = 0;
  for (const match of text.matchAll(/(?:(?:https?|file):\/\/|[A-Za-z]:[\\/]|\/(?!\/))[^\s<>"'`\u0000-\u001f]+/gi)) {
    if (ranges.length + lines.length >= 512) break;
    const from = match.index;
    if (from > 0 && /[\p{L}\p{N}_@/\\~.:]/u.test(text[from - 1])) continue;
    const candidate = trimDelimiters(match[0]);
    const to = from + candidate.length;
    // Both scans run in document order, so one cursor finds a containing line.
    while (line < lines.length && lines[line]!.to <= from) line++;
    if (line < lines.length && lines[line]!.from < to) continue;
    if (excluded.some(([start, end]) => from < end && to > start)) continue;
    // A large paste must not monopolize the editor; the remainder stays text.
    if (parsePillUrl(candidate, currentOrigin)) ranges.push({ from, to });
  }
  return lines.length ? [...ranges, ...lines].sort((a, b) => a.from - b.from).slice(0, 512) : ranges;
}
