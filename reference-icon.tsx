export type FileType = "markdown" | "typescript" | "javascript" | "json" | "html" | "css" | "image" | "pdf" | "text" | "file";

const EXTENSIONS: Record<string, FileType> = {
  md: "markdown", markdown: "markdown", mdx: "markdown",
  ts: "typescript", tsx: "typescript", mts: "typescript", cts: "typescript",
  js: "javascript", jsx: "javascript", mjs: "javascript", cjs: "javascript",
  json: "json", jsonc: "json", json5: "json",
  html: "html", htm: "html",
  css: "css", scss: "css", sass: "css", less: "css",
  png: "image", jpg: "image", jpeg: "image", gif: "image", webp: "image", avif: "image", svg: "image", ico: "image", bmp: "image",
  pdf: "pdf",
  txt: "text", text: "text", log: "text",
};

export function fileType(path: string): FileType {
  const name = path.slice(path.lastIndexOf("/") + 1) || path;
  const dotIndex = name.lastIndexOf(".");
  return dotIndex <= 0 ? "file" : EXTENSIONS[name.slice(dotIndex + 1).toLowerCase()] ?? "file";
}

// Fills read on light and dark chips, the way favicons sit on their white tiles.
type Look = { fill: string; ink?: string; label?: string; size?: number; glyph?: "image" | "lines" };
const LOOKS: Record<FileType, Look> = {
  markdown: { fill: "#6D5BD0", label: "MD" },
  typescript: { fill: "#3178C6", label: "TS" },
  javascript: { fill: "#EAB308", ink: "#1F1F1F", label: "JS" },
  json: { fill: "#D97706", label: "{}" },
  html: { fill: "#E2552B", label: "<>" },
  css: { fill: "#8B5CF6", label: "#" },
  image: { fill: "#16A34A", glyph: "image" },
  pdf: { fill: "#DC2626", label: "PDF", size: 4.4 },
  text: { fill: "#64748B", glyph: "lines" },
  file: { fill: "#8A94A6" },
};

/** A filled, per-type document icon; `muted` paints it in the text color so a missing file's red tint covers it. */
export function ReferenceIcon({ path, muted = false }: { path: string; muted?: boolean }) {
  const look = LOOKS[fileType(path)];
  const ink = muted ? "#fff" : look.ink ?? "#fff";
  return <svg viewBox="0 0 14 14" aria-hidden="true" data-file-type={fileType(path)} className="size-3.5 shrink-0">
    <path d="M3 .5h5.75L12.5 4.25V12a1.5 1.5 0 0 1-1.5 1.5H3A1.5 1.5 0 0 1 1.5 12V2A1.5 1.5 0 0 1 3 .5Z" fill={muted ? "currentColor" : look.fill} />
    <path d="M8.75.5v2.25a1.5 1.5 0 0 0 1.5 1.5h2.25Z" fill="#000" fillOpacity={0.28} />
    {look.label && <text x="7" y="11.7" textAnchor="middle" fontFamily="ui-sans-serif, system-ui, sans-serif" fontWeight={800} fontSize={look.size ?? 6} letterSpacing={-0.2} fill={ink}>{look.label}</text>}
    {look.glyph === "image" && <><circle cx="5" cy="7" r="1.1" fill={ink} /><path d="M3 11.5l2.6-2.6 1.6 1.6 2-2.2 1.8 3.2Z" fill={ink} /></>}
    {look.glyph === "lines" && <path d="M4 7h6M4 9h6M4 11h4" stroke={ink} strokeWidth={1} strokeLinecap="round" />}
  </svg>;
}
