const fencedCode = /^ {0,3}(`{3,}|~{3,})[^\n]*(?:\n[\s\S]*?)??(?:\n {0,3}\1[^\n]*|(?![\s\S]))/gm;
const directiveLine = /^\s*:{2,3}[a-z][\w-]*(?:\[[^\]\n]*\])?(?:\{[^}\n]*\})?\s*$/gm;
const tableDivider = /^\s*\|?\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)*\|?\s*$/gm;

/** Turns an agent's Markdown into plain prose Kokoro can read naturally. */
export function toSpeechText(markdown: string): string {
  const text = markdown
    .replace(/\r\n?/g, "\n")
    .replace(fencedCode, "\n")
    .replace(directiveLine, "")
    .replace(tableDivider, "")
    .replace(/<\/?[a-z][^>\n]*>/gi, "")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/<?\bhttps?:\/\/[^\s)>]+>?/g, "link")
    .replace(/`([^`\n]+)`/g, "$1")
    .replace(/(\*\*|__|~~)(.+?)\1/g, "$2")
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
