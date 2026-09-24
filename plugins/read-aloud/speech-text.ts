const fencedCode = /^ {0,3}(`{3,}|~{3,})[^\n]*(?:\n[\s\S]*?)??(?:\n {0,3}\1[^\n]*|(?![\s\S]))/gm;
// Every pattern keeps to one line and stops at its own delimiter, so hostile
// Markdown (thousands of unclosed brackets or blank lines) stays linear.
const directiveLine = /^[ \t]*:{2,3}[a-z][\w-]*(?:\[[^\]\n]*\])?(?:\{[^}\n]*\})?[ \t]*$/gm;
const tableDivider = /^[ \t]*\|?[ \t]*:?-{3,}:?[ \t]*(?:\|[ \t]*:?-{3,}:?[ \t]*)*\|?[ \t]*$/gm;

/** Turns an agent's Markdown into plain prose Kokoro can read naturally. */
export function toSpeechText(markdown: string): string {
  const text = markdown
    .replace(/\r\n?/g, "\n")
    .replace(fencedCode, "\n")
    .replace(directiveLine, "")
    .replace(tableDivider, "")
    .replace(/<\/?[a-z][^<>\n]*>/gi, "")
    .replace(/!\[([^[\]\n]*)\]\([^()\n]*\)/g, "$1")
    .replace(/\[([^[\]\n]+)\]\([^()\n]*\)/g, "$1")
    .replace(/<?\bhttps?:\/\/[^\s)>]+>?/g, "link")
    .replace(/`([^`\n]+)`/g, "$1")
    .replace(/\*\*([^*\n]+)\*\*|__([^_\n]+)__|~~([^~\n]+)~~/g, "$1$2$3")
    .replace(/(^|[^\w*])[*_]([^*_\n]+)[*_](?=[^\w*]|$)/g, "$1$2");

  return text
    .split("\n")
    .map((line) =>
      line
        .replace(/^\s{0,3}(?:#{1,6}\s+|>\s?)+/, "")
        .replace(/^\s*(?:[-*+]|\d+[.)])\s+(?:\[[ xX]\]\s+)?/, "")
        .replace(/\s*\|\s*/g, ", ")
        .replace(/^,\s*|,\s*$/g, "")
        .trim(),
    )
    .filter((line) => line.length > 0)
    .map((line) => (/[.!?:;…]["')\]]?$/.test(line) ? line : `${line}.`))
    .join("\n");
}

/** Playback speeds offered in the reading toast. */
export const speeds = [1, 1.5, 2] as const;
export type Speed = (typeof speeds)[number];
/** Longest text the speech route accepts in one request. */
export const maxSpeakLength = 400;

const maxChunkLength = 140;
const firstChunkLength = 40;

/**
 * Splits speech text into short pieces so the first audio arrives quickly and
 * a stop or switch never waits on a long sentence. Sentences are kept whole
 * when they fit, otherwise split at clause punctuation, then at spaces.
 */
export function chunkForSpeech(text: string): string[] {
  const chunks: string[] = [];
  const sentences = text.split(/(?<=[.!?…])\s+|\n+/);
  for (const sentence of sentences) {
    let rest = sentence.trim();
    while (rest.length > 0) {
      const limit = chunks.length === 0 ? firstChunkLength : maxChunkLength;
      if (rest.length <= limit) {
        chunks.push(rest);
        break;
      }
      const window = rest.slice(0, limit + 1);
      const clause = Math.max(
        window.lastIndexOf(", "),
        window.lastIndexOf("; "),
        window.lastIndexOf(": "),
        window.lastIndexOf(" – "),
        window.lastIndexOf(" — "),
      );
      const space = window.lastIndexOf(" ");
      const cut =
        clause > limit / 3 ? clause + 1 : space > 0 ? space : limit;
      chunks.push(rest.slice(0, cut).trim());
      rest = rest.slice(cut).trim();
    }
  }
  return chunks;
}
