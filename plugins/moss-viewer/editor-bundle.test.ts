import { createHash } from "node:crypto";
import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, it } from "vitest";
import { editorFrameDocument, loadEditorBundle } from "./editor-bundle.js";
import { mossEditorHost } from "./editor-host-helpers.js";

const vendor = fileURLToPath(new URL("./vendor/moss-editor/", import.meta.url));
const sha256 = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");

it("is the editor release, unmodified, and the host helpers come from it", async () => {
  const manifestBytes = await readFile(join(vendor, "editor.json"));
  const manifest = JSON.parse(manifestBytes.toString("utf8")) as Record<string, any>;
  const provenance = JSON.parse(await readFile(join(vendor, "../moss-editor.provenance.json"), "utf8")) as Record<string, any>;
  expect(provenance).toMatchObject({
    version: manifest.version,
    api: manifest.api,
    release: { tag: `editor-v${manifest.version}` },
    build: { run: manifest.build.run, sourceCommit: manifest.source.commit },
    mossPin: manifest.moss.commit,
    bundleHash: manifest.bundleHash,
    editorJsonSha256: sha256(manifestBytes),
    contractSha256: sha256(await readFile(join(vendor, "../moss-editor.contract.d.ts"))),
  });
  const bundle = await loadEditorBundle(vendor);
  expect(bundle.bundleHash).toBe(manifest.bundleHash);
  expect(bundle.files.has("moss-editor.js")).toBe(true);
  // The host bundles its own copy of the helpers; the frame never serves them.
  expect(bundle.files.has("moss-editor-host.js")).toBe(false);
  expect(mossEditorHost.MOSS_EDITOR_INFO.version).toBe(manifest.version);
});

it("refuses an editor whose files no longer match editor.json", async () => {
  const copy = await mkdtemp(join(tmpdir(), "moss-editor-bundle-"));
  try {
    await cp(vendor, copy, { recursive: true });
    await writeFile(join(copy, "moss-editor.css"), `${await readFile(join(copy, "moss-editor.css"), "utf8")}\n/* edited */`);
    await expect(loadEditorBundle(copy)).rejects.toThrow("moss-editor.css does not match editor.json");
  } finally {
    await rm(copy, { recursive: true, force: true });
  }
});

it("frames the editor under editor.json's policy, with this plugin as the asset and HTML-frame origin", () => {
  const { html, csp } = editorFrameDocument(
    {
      "default-src": ["'none'"],
      "script-src": ["'self'"],
      "img-src": ["'self'", "data:", "blob:", "https:", "<asset-origin>"],
      "frame-src": ["data:", "https:", "<html-frame-origin>"],
      "connect-src": ["'none'"],
    },
    "n0nce",
  );
  expect(csp).toBe(
    "default-src 'none'; script-src 'nonce-n0nce' 'strict-dynamic'; img-src 'self' data: blob: https:; frame-src data: https: 'self'; connect-src 'none'",
  );
  expect(html).toContain('<script nonce="n0nce" src="./theme.js"></script>');
  expect(html).toContain('<script type="module" nonce="n0nce" src="./frame.js"></script>');
  expect(html).toContain('<div id="moss-editor"></div>');
});
