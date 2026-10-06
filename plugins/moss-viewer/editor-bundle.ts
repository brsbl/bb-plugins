import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";
import type { ViewerFile } from "./viewer-bundle.js";

/** The @moss-multi/editor entry contract this plugin is written against (`MossEditorApiVersion`). */
export const EDITOR_API = 1;

const CONTENT_TYPES: Readonly<Record<string, string>> = {
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

/** editor.json's `csp`: each directive with the sources the editor needs. */
export type EditorPolicy = Readonly<Record<string, readonly string[]>>;

/**
 * The editor's own document, under the policy editor.json declares. Its
 * `<asset-origin>` and `<html-frame-origin>` are this plugin's routes on bb's
 * origin. As in the viewer's frame, scripts are limited by nonce to the two
 * this page names and the modules they import rather than all of `'self'`,
 * because the frame shares bb's origin and session.
 */
export function editorFrameDocument(policy: EditorPolicy, nonce: string): { html: string; csp: string } {
  const csp = Object.entries(policy)
    .map(([directive, sources]) => {
      if (directive === "script-src") return `script-src 'nonce-${nonce}' 'strict-dynamic'`;
      const resolved = sources.map((source) => (source === "<asset-origin>" || source === "<html-frame-origin>" ? "'self'" : source));
      return `${directive} ${[...new Set(resolved)].join(" ")}`;
    })
    .join("; ");
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<script nonce="${nonce}" src="./theme.js"></script>
<link rel="stylesheet" href="./moss-editor.css">
<style>
html, body, #moss-editor { height: 100%; margin: 0; }
/* The title sits 3rem below bb's header, or 2rem on a phone (bb's phone query). Moss's 4rem side gutters stay on
   desktop. On a phone they shrink to what Moss's controls need, so the text gets most of the width: 1rem on the left,
   where controls reach 0.75rem past the text, and 3.5rem on the right, where each comment button sits in a 2rem rail
   moved 100% + 1.5rem past the text. Any narrower and the comment buttons leave the frame. */
[data-moss-editor] .pt-canvas-body-top { padding-top: 3rem; }
@media (max-width: 767px) and (pointer: coarse) {
  [data-moss-editor] .pt-canvas-body-top { padding-top: 2rem; }
  [data-moss-editor] .px-canvas-gutter { padding-left: 1rem; padding-right: 3.5rem; }
}
</style>
<script type="module" nonce="${nonce}" src="./frame.js"></script>
</head>
<body><div id="moss-editor"></div></body>
</html>
`;
  return { html, csp };
}

// Runs before first paint so a dark bb never flashes moss's light canvas.
const THEME_JS = `document.documentElement.dataset.theme = new URLSearchParams(location.search).get("theme") === "dark" ? "dark" : "light";
`;

// Hands the editor's entry to the bb panel that owns this frame, which mounts it
// with its bridge once the frame loads.
const FRAME_JS = `import { MOSS_EDITOR_API, MOSS_EDITOR_INFO, mountMossEditor } from "./moss-editor.js";
window.mossEditor = { api: MOSS_EDITOR_API, info: MOSS_EDITOR_INFO, mountMossEditor };
`;

export interface EditorBundle {
  version: string;
  bundleHash: string;
  /** Route prefix that changes with the bundle or frame, so every file can be cached as immutable. */
  base: string;
  files: ReadonlyMap<string, ViewerFile>;
  policy: EditorPolicy;
  /** Moss's page for HTML blocks, served only under its own sandbox policy. */
  htmlFrame: Uint8Array<ArrayBuffer>;
}

interface EditorRecord {
  name: string;
  version: string;
  api: number;
  entry: string;
  css: string;
  hostEntry: string;
  htmlFrame: { file: string; policy: string };
  bundleHash: string;
  csp: Record<string, string[]>;
  files: Record<string, { bytes: number; sha256: string }>;
}

function parseRecord(value: unknown): EditorRecord {
  const record = value as Partial<EditorRecord> | null;
  const csp = record?.csp;
  if (
    !record ||
    record.name !== "@moss-multi/editor" ||
    typeof record.version !== "string" ||
    record.api !== EDITOR_API ||
    record.entry !== "moss-editor.js" ||
    record.css !== "moss-editor.css" ||
    record.hostEntry !== "moss-editor-host.js" ||
    record.htmlFrame?.file !== "moss-html-frame.html" ||
    typeof record.htmlFrame.policy !== "string" ||
    !record.htmlFrame.policy.startsWith("sandbox") ||
    typeof record.bundleHash !== "string" ||
    !/^[0-9a-f]{64}$/.test(record.bundleHash) ||
    !csp ||
    typeof csp !== "object" ||
    !Object.entries(csp).every(([directive, sources]) => /^[a-z-]+$/.test(directive) && Array.isArray(sources)) ||
    !record.files ||
    typeof record.files !== "object"
  ) {
    throw new Error(`moss-viewer: editor.json is not an editor API ${EDITOR_API} manifest`);
  }
  return record as EditorRecord;
}

const sha256 = (bytes: Uint8Array | string) => createHash("sha256").update(bytes).digest("hex");

/** Where the vendored editor sits relative to the running module: the plugin root (source) or dist/. */
export async function findEditorDirectory(moduleUrl: string): Promise<string | null> {
  for (const candidate of ["./vendor/moss-editor/", "../vendor/moss-editor/"]) {
    const directory = fileURLToPath(new URL(candidate, moduleUrl));
    if (await stat(join(directory, "editor.json")).then((details) => details.isFile(), () => false)) {
      return directory;
    }
  }
  return null;
}

/**
 * Loads the vendored editor and refuses it unless every file matches editor.json
 * and the files together reproduce its bundle hash. The host helpers are checked
 * but never served; the host bundles its own copy.
 */
export async function loadEditorBundle(directory: string): Promise<EditorBundle> {
  const record = parseRecord(JSON.parse(await readFile(join(directory, "editor.json"), "utf8")));
  const digest = createHash("sha256");
  const files = new Map<string, ViewerFile>();
  let htmlFrame: Uint8Array<ArrayBuffer> | undefined;
  for (const name of Object.keys(record.files).sort()) {
    const expected = record.files[name]!;
    const contentType = name === record.htmlFrame.file ? "text/html" : CONTENT_TYPES[extname(name)];
    if (!/^(?:assets\/)?[\w.-]+$/.test(name) || contentType === undefined) {
      throw new Error(`moss-viewer: unexpected editor file ${name}`);
    }
    const body = new Uint8Array(await readFile(join(directory, name)));
    if (body.length !== expected.bytes || sha256(body) !== expected.sha256) {
      throw new Error(`moss-viewer: ${name} does not match editor.json`);
    }
    digest.update(`${name}\0${body.length}\0`).update(body);
    if (name === record.htmlFrame.file) htmlFrame = body;
    else if (name !== record.hostEntry) {
      files.set(name, {
        body,
        contentType,
        ...(contentType.startsWith("text/") ? { gzip: new Uint8Array(gzipSync(body)) } : {}),
      });
    }
  }
  if (digest.digest("hex") !== record.bundleHash) {
    throw new Error("moss-viewer: editor bundle hash does not match editor.json");
  }
  if (!files.has(record.entry) || !files.has(record.css) || htmlFrame === undefined) {
    throw new Error("moss-viewer: editor.json omits the editor entry, stylesheet or HTML frame");
  }
  files.set("theme.js", { body: new TextEncoder().encode(THEME_JS), contentType: CONTENT_TYPES[".js"]! });
  files.set("frame.js", { body: new TextEncoder().encode(FRAME_JS), contentType: CONTENT_TYPES[".js"]! });
  return {
    version: record.version,
    bundleHash: record.bundleHash,
    base: `/editor/${sha256(record.bundleHash + JSON.stringify(editorFrameDocument(record.csp, "")) + THEME_JS + FRAME_JS).slice(0, 16)}`,
    files,
    policy: record.csp,
    htmlFrame,
  };
}
