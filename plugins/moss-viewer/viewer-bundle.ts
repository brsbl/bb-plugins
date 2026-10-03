import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

/** The @moss-multi/viewer entry contract this plugin is written against. */
export const VIEWER_API = 1;

const CONTENT_TYPES: Readonly<Record<string, string>> = {
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

/**
 * The viewer's own document. Moss's stylesheet styles the whole page, so it gets
 * a page of its own inside an iframe. That frame shares bb's origin so its
 * requests carry bb's session, which is why scripts are limited to the two this
 * document names by nonce and the modules they import.
 */
export function frameDocument(nonce: string): { html: string; csp: string } {
  const csp = [
    "default-src 'none'",
    `script-src 'nonce-${nonce}' 'strict-dynamic'`,
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self' data:",
    "img-src 'self' https: data: blob:",
    "media-src 'self' https: blob:",
    "frame-src https:",
    "connect-src 'self'",
    "worker-src 'self' blob:",
    "base-uri 'none'",
    "form-action 'none'",
    "object-src 'none'",
  ].join("; ");
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<script nonce="${nonce}" src="./theme.js"></script>
<link rel="stylesheet" href="./moss-viewer.css">
<style>html, body, #moss-viewer { height: 100%; margin: 0; }</style>
<script type="module" nonce="${nonce}" src="./frame.js"></script>
</head>
<body><div id="moss-viewer"></div></body>
</html>
`;
  return { html, csp };
}

// Runs before first paint so a dark bb never flashes moss's light canvas.
const THEME_JS = `document.documentElement.dataset.theme = new URLSearchParams(location.search).get("theme") === "dark" ? "dark" : "light";
`;

// Hands the viewer's entry to the bb panel that owns this frame, which mounts it
// with its services once the frame loads. The module evaluates in this document,
// so moss renders against this document's globals.
const FRAME_JS = `import { MOSS_VIEWER_API, mountMossViewer } from "./moss-viewer.js";
window.mossViewer = { api: MOSS_VIEWER_API, mountMossViewer };
`;

export interface ViewerFile {
  body: Uint8Array<ArrayBuffer>;
  contentType: string;
  /** Present for text files worth compressing; served when the client accepts gzip. */
  gzip?: Uint8Array<ArrayBuffer>;
}

export interface ViewerBundle {
  version: string;
  bundleHash: string;
  /** Route prefix that changes with the bundle or frame, so every bundle file can be cached as immutable. */
  base: string;
  files: ReadonlyMap<string, ViewerFile>;
}

interface ViewerRecord {
  version: string;
  api: number;
  entry: string;
  css: string;
  bundleHash: string;
  files: Record<string, { bytes: number; sha256: string }>;
}

function parseRecord(value: unknown): ViewerRecord {
  const record = value as Partial<ViewerRecord> | null;
  if (
    !record ||
    typeof record.version !== "string" ||
    record.api !== VIEWER_API ||
    record.entry !== "moss-viewer.js" ||
    record.css !== "moss-viewer.css" ||
    typeof record.bundleHash !== "string" ||
    !/^[0-9a-f]{64}$/.test(record.bundleHash) ||
    !record.files ||
    typeof record.files !== "object"
  ) {
    throw new Error(`moss-viewer: viewer.json is not a viewer API ${VIEWER_API} manifest`);
  }
  return record as ViewerRecord;
}

const sha256 = (bytes: Uint8Array | string) => createHash("sha256").update(bytes).digest("hex");

/** Where the vendored bundle sits relative to the running module: the plugin root (source) or dist/. */
export async function findViewerDirectory(moduleUrl: string): Promise<string> {
  for (const candidate of ["./vendor/moss-viewer/", "../vendor/moss-viewer/"]) {
    const directory = fileURLToPath(new URL(candidate, moduleUrl));
    if (await stat(join(directory, "viewer.json")).then((details) => details.isFile(), () => false)) {
      return directory;
    }
  }
  throw new Error("moss-viewer: the vendored viewer bundle is missing");
}

/**
 * Loads the vendored viewer and refuses it unless every file matches viewer.json
 * and the files together reproduce its bundle hash.
 */
export async function loadViewerBundle(directory: string): Promise<ViewerBundle> {
  const record = parseRecord(JSON.parse(await readFile(join(directory, "viewer.json"), "utf8")));
  const digest = createHash("sha256");
  const files = new Map<string, ViewerFile>();
  for (const name of Object.keys(record.files).sort()) {
    const expected = record.files[name]!;
    const contentType = CONTENT_TYPES[extname(name)];
    if (!/^(?:assets\/)?[\w.-]+$/.test(name) || contentType === undefined) {
      throw new Error(`moss-viewer: unexpected bundle file ${name}`);
    }
    const body = new Uint8Array(await readFile(join(directory, name)));
    if (body.length !== expected.bytes || sha256(body) !== expected.sha256) {
      throw new Error(`moss-viewer: ${name} does not match viewer.json`);
    }
    digest.update(`${name}\0${body.length}\0`).update(body);
    files.set(name, {
      body,
      contentType,
      ...(contentType.startsWith("text/") ? { gzip: new Uint8Array(gzipSync(body)) } : {}),
    });
  }
  if (digest.digest("hex") !== record.bundleHash) {
    throw new Error("moss-viewer: bundle hash does not match viewer.json");
  }
  if (!files.has(record.entry) || !files.has(record.css)) {
    throw new Error("moss-viewer: viewer.json omits the viewer entry or stylesheet");
  }
  files.set("theme.js", { body: new TextEncoder().encode(THEME_JS), contentType: CONTENT_TYPES[".js"]! });
  files.set("frame.js", { body: new TextEncoder().encode(FRAME_JS), contentType: CONTENT_TYPES[".js"]! });
  return {
    version: record.version,
    bundleHash: record.bundleHash,
    base: `/viewer/${sha256(record.bundleHash + JSON.stringify(frameDocument("")) + THEME_JS + FRAME_JS).slice(0, 16)}`,
    files,
  };
}
