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
  const authored = /^\[([^\]\n]+)\]\((?:<([^>\n]+)>|([^()\s]+))\)$/u.exec(text);
  const wrapped = /^(?:<([^>\n]+)>|"([^"\n]+)"|'([^'\n]+)')$/u.exec(text);
  const localFile = parseLocalFile(authored?.[2] ?? authored?.[3] ?? wrapped?.[1] ?? wrapped?.[2] ?? wrapped?.[3] ?? text);
  if (localFile) return { text, label: authored?.[1] ?? localFile.label, localFile, origin: "", iconOrigin: null };
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
  const ranges: { from: number; to: number }[] = [];
  function addLocal(from: number, source: string): void {
    const to = from + source.length;
    if (ranges.length < 512 && !excluded.some(([start, end]) => from < end && to > start)
      && !ranges.some((range) => from < range.to && to > range.from)
      && parsePillUrl(source, currentOrigin)?.localFile) ranges.push({ from, to });
  }
  // Copying a chat file link preserves its Markdown source. Match the whole
  // link so its label and destination remain a single editable range.
  for (const match of text.matchAll(/!?\[[^\]\n]*\]\((?:<[^>\n]*>|[^()\n]*)\)/g)) {
    if (!match[0].startsWith('!')) addLocal(match.index, match[0]);
    excluded.push([match.index, match.index + match[0].length]);
  }
  for (const match of text.matchAll(/<[^<>\n]+>|"[^"\n]+"|'[^'\n]+'/g)) addLocal(match.index, match[0]);
  // A standalone path has an unambiguous line boundary, including spaces.
  // In prose, require delimiters instead of guessing where the filename ends.
  for (const match of text.matchAll(/(?:^|\n)[ \t]{0,3}((?:\/(?!\/)|[A-Za-z]:[\\/])[^\n<>"'`]+)(?=\n|$)/g)) {
    const source = match[1].trimEnd();
    if (!/[ \t]+(?:\/(?!\/)|[A-Za-z]:[\\/])/u.test(source)
      && /\.[\p{L}\p{N}]+(?::\d+(?:-\d+|:\d+)?|#L\d+(?:C\d+)?(?:-L?\d+(?:C\d+)?)?)?$/u.test(source)) {
      addLocal(match.index + match[0].indexOf(match[1]), source);
    }
  }
  for (const match of text.matchAll(/(?:(?:https?|file):\/\/|[A-Za-z]:[\\/]|\/(?!\/))[^\s<>"'`\u0000-\u001f]+/gi)) {
    if (ranges.length === 512) break;
    const from = match.index;
    if (from > 0 && /[\p{L}\p{N}_@/\\~.:]/u.test(text[from - 1])) continue;
    const candidate = trimDelimiters(match[0]);
    const to = from + candidate.length;
    if (excluded.some(([start, end]) => from < end && to > start)) continue;
    if (ranges.some((range) => from < range.to && to > range.from)) continue;
    if (parsePillUrl(candidate, currentOrigin)) ranges.push({ from, to });
    // A large paste must not monopolize the editor; the remainder stays text.
    if (ranges.length === 512) break;
  }
  return ranges.sort((a, b) => a.from - b.from);
}
