/** Local paths are display metadata; native anchors retain their original href. */
export interface LocalFile {
  path: string;
  label: string;
  location?: { line: number; endLine?: number };
}

export function parseLocalFile(text: string, nativeAnchor = false): LocalFile | null {
  if (!text || text.length > 8192 || text.trim() !== text || /[\u0000-\u001f\u007f]/u.test(text)) return null;
  let path = text;
  let explicit = false;
  let encodedPath = false;
  let literalPath = false;
  try {
    if (nativeAnchor && /^\.\/[^/?#]+$/u.test(path)) {
      path = decodeURIComponent(path.slice(2));
      explicit = true; literalPath = true;
    } else if (/^file:/i.test(path)) {
      const url = new URL(path);
      if (url.host || url.search || url.username || url.password) return null;
      path = url.pathname + url.hash;
      encodedPath = true;
      if (/^\/[A-Za-z]:\//u.test(path)) path = path.slice(1);
      explicit = true;
    }
  } catch { return null; }
  let location: LocalFile['location'];
  let suffix = '';
  const lines = literalPath ? null : /(?::(\d+)(?:-(\d+)|:\d+)?|#L(\d+)(?:C\d+)?(?:-L?(\d+)(?:C\d+)?)?)$/u.exec(path);
  if (lines) {
    const line = Number(lines[1] ?? lines[3]);
    const endLine = Number(lines[2] ?? lines[4] ?? line);
    if (!Number.isSafeInteger(line) || line <= 0 || !Number.isSafeInteger(endLine) || endLine < line) return null;
    location = { line, ...(endLine !== line ? { endLine } : {}) };
    suffix = path.slice(lines.index);
    path = path.slice(0, lines.index);
  } else if (!literalPath && nativeAnchor && path.includes('#')) {
    suffix = path.slice(path.indexOf('#'));
    path = path.slice(0, path.indexOf('#'));
  }
  if (!literalPath && /[?#]/u.test(path)) return null;
  if (encodedPath) {
    try { path = decodeURIComponent(path); } catch { return null; }
  }
  if (!(/^(?:\/(?!\/)|[A-Za-z]:[\\/])/u.test(path)) || /[\u0000-\u001f\u007f]/u.test(path) || /[\\/]$/u.test(path)) return null;
  const name = path.split(/[\\/]/u).at(-1)!;
  if (!name || (!explicit && !name.includes('.'))) return null;
  return { path, label: name + suffix, ...(location ? { location } : {}) };
}

// Same shapes and classification as Pinned Files, kept plugin-local.
const extensions: Record<string, string> = {
  ...Object.fromEntries('ts tsx mts cts js jsx mjs cjs html htm css scss sass less json jsonc json5'.split(' ').map(x => [x, 'code'])),
  ...Object.fromEntries('md markdown mdx txt text log pdf'.split(' ').map(x => [x, 'document'])),
  ...Object.fromEntries('png jpg jpeg gif webp avif svg ico bmp'.split(' ').map(x => [x, 'image'])),
};
const marks: Record<string, string> = {
  code: 'M10 12.5 8 15l2 2.5M14 12.5l2 2.5-2 2.5',
  document: 'M10 9H8M16 13H8M16 17H8',
  image: 'M12 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0M20 17l-1.3-1.3a2.4 2.4 0 0 0-3.4 0L9 22',
  file: '',
};
export function fileIconMask(path: string): string {
  const name = path.split(/[\\/]/u).at(-1)!;
  const type = name.lastIndexOf('.') > 0 ? extensions[name.split('.').at(-1)!.toLowerCase()] ?? 'file' : 'file';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="${marks[type]}"/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}
