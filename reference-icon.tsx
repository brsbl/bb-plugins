export type FileType = "code" | "document" | "image" | "file";

const EXTENSIONS: Record<string, FileType> = {
  ts: "code", tsx: "code", mts: "code", cts: "code", js: "code", jsx: "code", mjs: "code", cjs: "code",
  html: "code", htm: "code", css: "code", scss: "code", sass: "code", less: "code", json: "code", jsonc: "code", json5: "code",
  md: "document", markdown: "document", mdx: "document", txt: "document", text: "document", log: "document", pdf: "document",
  png: "image", jpg: "image", jpeg: "image", gif: "image", webp: "image", avif: "image", svg: "image", ico: "image", bmp: "image",
};

export function fileType(path: string): FileType {
  const name = path.slice(path.lastIndexOf("/") + 1) || path;
  const dotIndex = name.lastIndexOf(".");
  return dotIndex <= 0 ? "file" : EXTENSIONS[name.slice(dotIndex + 1).toLowerCase()] ?? "file";
}

// The shape names the kind; the color is the theme's, the same --file-accent bb paints file paths with.
const MARKS: Record<FileType, string> = {
  code: "M10 12.5 8 15l2 2.5M14 12.5l2 2.5-2 2.5",
  document: "M10 9H8M16 13H8M16 17H8",
  image: "M12 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0M20 17l-1.3-1.3a2.4 2.4 0 0 0-3.4 0L9 22",
  file: "",
};

/** An outline document marked with the file's kind; `muted` uses the text color so a missing file's red tint covers it. */
export function ReferenceIcon({ path, muted = false }: { path: string; muted?: boolean }) {
  const type = fileType(path);
  return <svg viewBox="0 0 24 24" aria-hidden="true" data-file-type={type} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
    className="size-3.5 shrink-0" style={muted ? undefined : { color: "var(--file-accent, currentColor)" }}>
    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
    <path d="M14 2v4a2 2 0 0 0 2 2h4" />
    {MARKS[type] && <path d={MARKS[type]} />}
  </svg>;
}
