export interface MarkdownPreview {
  inline: string;
  kind: "code" | "heading" | "list" | "paragraph" | "quote" | "table";
}

function tableCells(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function isTableDivider(line: string): boolean {
  const cells = tableCells(line);
  return (
    cells.length > 0 &&
    cells.every((cell) => /^:?-{3,}:?$/.test(cell.replace(/\s+/g, "")))
  );
}

function cleanBlockText(value: string): string {
  return value
    .replace(/<\/?[A-Za-z][^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function tablePreview(lines: string[], start: number): MarkdownPreview | null {
  if (!lines[start]?.includes("|") || !isTableDivider(lines[start + 1] ?? "")) {
    return null;
  }

  const headers = tableCells(lines[start]);
  const values = tableCells(lines[start + 2] ?? "");
  const pairs = headers
    .map((header, index) => {
      const value = values[index];
      if (!header || !value) return null;
      return `${cleanBlockText(header)}: ${cleanBlockText(value)}`;
    })
    .filter((pair): pair is string => Boolean(pair))
    .slice(0, 3);

  const inline = pairs.length > 0 ? pairs.join(" · ") : headers.join(" · ");
  return inline ? { inline, kind: "table" } : null;
}

export function markdownPreview(source: string): MarkdownPreview | null {
  let lines = source.replace(/\r\n?/g, "\n").split("\n");
  let start = lines.findIndex((line) => line.trim().length > 0);
  if (start < 0) return null;

  if (lines[start]?.trim() === "---") {
    const frontmatterEnd = lines.findIndex(
      (line, index) => index > start && line.trim() === "---",
    );
    if (frontmatterEnd > start) {
      lines = lines.slice(frontmatterEnd + 1);
      start = lines.findIndex((line) => line.trim().length > 0);
      if (start < 0) return null;
    }
  }

  const table = tablePreview(lines, start);
  if (table) return table;

  const first = lines[start]!.trim();
  const fence = first.match(/^(```+|~~~+)\s*[^\s]*\s*$/);
  if (fence) {
    const codeLines: string[] = [];
    for (let index = start + 1; index < lines.length; index += 1) {
      const line = lines[index]!;
      if (line.trim().startsWith(fence[1]!)) break;
      if (line.trim() || codeLines.length > 0) codeLines.push(line.trim());
    }
    const inline = cleanBlockText(codeLines.join(" "));
    return inline ? { inline, kind: "code" } : null;
  }

  const heading = first.match(/^#{1,6}\s+(.+)$/);
  if (heading) {
    const inline = cleanBlockText(heading[1]!);
    return inline ? { inline, kind: "heading" } : null;
  }

  const listItem = first.match(/^(?:[-+*]|\d+[.)])\s+(.+)$/);
  if (listItem) {
    const items: string[] = [];
    for (let index = start; index < lines.length && items.length < 2; index += 1) {
      const match = lines[index]!.trim().match(/^(?:[-+*]|\d+[.)])\s+(.+)$/);
      if (!match) break;
      items.push(cleanBlockText(match[1]!.replace(/^\[[ xX]\]\s*/, "")));
    }
    const inline = items.filter(Boolean).join(" · ");
    return inline ? { inline, kind: "list" } : null;
  }

  if (first.startsWith(">")) {
    const quoteLines: string[] = [];
    for (let index = start; index < lines.length; index += 1) {
      const match = lines[index]!.trim().match(/^>\s?(.*)$/);
      if (!match) break;
      quoteLines.push(match[1]!);
    }
    const inline = cleanBlockText(quoteLines.join(" "));
    return inline ? { inline, kind: "quote" } : null;
  }

  const paragraph: string[] = [];
  for (let index = start; index < lines.length; index += 1) {
    const line = lines[index]!.trim();
    if (!line) break;
    if (index > start && tablePreview(lines, index)) break;
    if (index > start && /^(?:#{1,6}\s|```|~~~|>|[-+*]\s|\d+[.)]\s)/.test(line)) {
      break;
    }
    paragraph.push(line);
  }

  const inline = cleanBlockText(paragraph.join(" "));
  return inline ? { inline, kind: "paragraph" } : null;
}
