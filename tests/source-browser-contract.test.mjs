import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import test, { after } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { build } from "esbuild";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const temporaryDirectory = await mkdtemp(
  resolve(packageRoot, ".source-browser-contract-test-"),
);
const outputFile = resolve(temporaryDirectory, "source-browser-model.mjs");
const galleryOutputFile = resolve(temporaryDirectory, "gallery-shell.mjs");

await build({
  entryPoints: [resolve(packageRoot, "tests/source-browser-test-entry.ts")],
  outfile: outputFile,
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  logLevel: "silent",
});

await build({
  entryPoints: [resolve(packageRoot, "gallery-shell.tsx")],
  outfile: galleryOutputFile,
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  packages: "external",
  jsx: "automatic",
  logLevel: "silent",
});

const sourceBrowser = await import(
  `${pathToFileURL(outputFile).href}?contract=${Date.now()}`,
);
const { GalleryShell } = await import(
  `${pathToFileURL(galleryOutputFile).href}?contract=${Date.now()}`,
);

after(async () => {
  await rm(temporaryDirectory, { recursive: true, force: true });
});

test("same-title source records are grouped only for presentation and stay attributable", () => {
  const groups = sourceBrowser.groupSourceItemsByExactTitle(sourceBrowser.sourceBrowserFixture.items);
  const button = groups.find((group) => group.title === "Button");

  assert.equal(button.items.length, 2);
  assert.deepEqual(
    button.items.map((item) => item.id),
    ["aria-apg:button", "base-ui:button"],
  );
  assert.deepEqual(
    new Set(button.items.map((item) => item.providerId)),
    new Set(["aria-apg", "base-ui"]),
  );
});

test("source filtering searches upstream fields without inventing a canonical Atlas entry", () => {
  const results = sourceBrowser.filterSourceItems(sourceBrowser.sourceBrowserFixture.items, {
    query: "autocomplete",
    providerId: "all",
    contentKind: "all",
  });

  assert.deepEqual(
    results.map((item) => item.id),
    ["aria-apg:combobox", "base-ui:combobox"],
  );
  assert.equal(results.every((item) => item.id.includes(":")), true);
  assert.equal(results.every((item) => "details" in item), false);
});

test("licensed excerpts and freshness are controlled by provider provenance", () => {
  const licensed = sourceBrowser.sourceBrowserFixture.items.find(
    (item) => item.id === "aria-apg:combobox",
  );
  const withoutExcerpt = sourceBrowser.sourceBrowserFixture.items.find(
    (item) => item.id === "base-ui:combobox",
  );

  assert.equal(sourceBrowser.mayDisplayExcerpt(licensed), true);
  assert.equal(sourceBrowser.freshnessLabel(licensed), "Retrieved 2026-07-18");
  assert.equal(sourceBrowser.mayDisplayExcerpt(withoutExcerpt), false);
});

test("the rendered browser presents provider metadata and source-specific links", () => {
  const markup = renderToStaticMarkup(
    React.createElement(GalleryShell, {
      snapshot: sourceBrowser.sourceBrowserFixture,
      navigation: {
        entryId: null,
        openEntry() {},
        closeInspector() {},
      },
    }),
  );

  assert.match(markup, /UI pattern sources/);
  assert.match(markup, /Button · 2 upstream records/);
  assert.match(markup, /WAI-ARIA Authoring Practices Guide/);
  assert.match(markup, /Base UI/);
  assert.match(markup, /Licensed excerpt:/);
  assert.match(markup, /Retrieved 2026-07-18/);
  assert.match(markup, /data-source-item-id="aria-apg:button"/);
  assert.match(markup, /data-source-item-id="base-ui:button"/);
});

test("the generated provider snapshot is a usable source-browser input", () => {
  const snapshot = sourceBrowser.getSourceBrowserSnapshot();
  const markup = renderToStaticMarkup(
    React.createElement(GalleryShell, {
      snapshot,
      navigation: {
        entryId: null,
        openEntry() {},
        closeInspector() {},
      },
    }),
  );

  assert.equal(Object.isFrozen(snapshot), true);
  assert.equal(snapshot.items.length, 125);
  assert.equal(snapshot.items.every((item) => item.id.includes(":")), true);
  assert.match(markup, /data-source-item-id="govuk-design-system:/);
  assert.match(markup, /data-source-item-id="uswds:/);
});

test("source-native deep links encode IDs and preserve close-history semantics", () => {
  const subPath = sourceBrowser.entrySubPath("aria-apg:combobox");
  assert.equal(subPath, "entry/aria-apg%3Acombobox");
  assert.equal(sourceBrowser.entryIdFromSubPath(subPath), "aria-apg:combobox");
  assert.equal(sourceBrowser.legacyQueryFromEntryId("button"), "button");
  assert.equal(sourceBrowser.legacyQueryFromEntryId("aria-apg:combobox"), null);
  assert.equal(sourceBrowser.inspectorCloseMode(true), "back");
  assert.equal(sourceBrowser.inspectorCloseMode(false), "replace");
});
