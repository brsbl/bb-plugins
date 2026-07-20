import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import test, { after } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { build } from "esbuild";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const temporaryDirectory = await mkdtemp(resolve(packageRoot, ".source-browser-contract-test-"));
const outputFile = resolve(temporaryDirectory, "source-browser-model.mjs");
const galleryOutputFile = resolve(temporaryDirectory, "gallery-shell.cjs");
const previewOutputFile = resolve(temporaryDirectory, "live-previews.cjs");

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
  entryPoints: [resolve(packageRoot, "tests/live-preview-test-entry.ts")],
  outfile: previewOutputFile,
  bundle: true,
  format: "cjs",
  platform: "node",
  target: "node22",
  external: ["react", "react/*", "react-dom", "react-dom/*"],
  jsx: "automatic",
  logLevel: "silent",
});

await build({
  entryPoints: [resolve(packageRoot, "gallery-shell.tsx")],
  outfile: galleryOutputFile,
  bundle: true,
  format: "cjs",
  platform: "node",
  target: "node22",
  external: ["react", "react/*", "react-dom", "react-dom/*"],
  jsx: "automatic",
  logLevel: "silent",
});

const sourceBrowser = await import(`${pathToFileURL(outputFile).href}?contract=${Date.now()}`);
const { GalleryShell } = await import(`${pathToFileURL(galleryOutputFile).href}?contract=${Date.now()}`);
const snapshot = sourceBrowser.getSourceBrowserSnapshot();
const livePreviewSourceIds = sourceBrowser.livePreviewSourceIds;
const galleryPreviewSourceIds = sourceBrowser.galleryPreviewSourceIds;

after(async () => {
  await rm(temporaryDirectory, { recursive: true, force: true });
});

test("the generated source browser exposes computed entries and attributable records", () => {
  assert.equal(Object.isFrozen(snapshot), true);
  assert.equal(snapshot.providers.length, 4);
  assert.equal(snapshot.records.length, 149);
  assert.equal(snapshot.entries.length, 98);

  const button = snapshot.entries.find(({ name }) => name === "Button");
  assert.deepEqual(button.sourceRecordIds, [
    "aria-apg:button",
    "base-ui:button",
    "shadcn-ui:button",
  ]);
  assert.equal(button.summary, null);
  assert.equal(button.kind, "mixed");
});

test("entry filtering searches source-owned detail while returning one Atlas entry", () => {
  const results = sourceBrowser.filterAtlasEntries(snapshot, {
    query: "autocomplete",
    providerId: "all",
  });
  assert.deepEqual(results.map(({ name }) => name), ["Combobox"]);

  const baseOnly = sourceBrowser.filterAtlasEntries(snapshot, {
    query: "combobox",
    providerId: "base-ui",
  });
  assert.deepEqual(baseOnly, []);

  const assistantOnly = sourceBrowser.filterAtlasEntries(snapshot, {
    query: "composer",
    providerId: "assistant-ui",
  });
  assert.equal(
    assistantOnly.some(({ name }) => name === "Composer"),
    true,
  );

  const shadcnCannotMatchBaseText = sourceBrowser.filterAtlasEntries(snapshot, {
    query: "collapsible",
    providerId: "shadcn-ui",
  });
  assert.equal(
    shadcnCannotMatchBaseText.some(({ name }) => name === "Accordion"),
    false,
  );

  const apgGuidanceCanRefineAPairedImplementation =
    sourceBrowser.filterAtlasEntries(snapshot, {
      query: "aria-disabled",
      providerId: "all",
    });
  assert.equal(
    apgGuidanceCanRefineAPairedImplementation.some(
      ({ name }) => name === "Button",
    ),
    true,
  );
});

test("source-native deep links resolve their containing entry", () => {
  const button = sourceBrowser.atlasEntryForRecordId(snapshot, "base-ui:button");
  assert.equal(button.name, "Button");
  const records = sourceBrowser.recordsForEntry(button, sourceBrowser.sourceRecordById(snapshot.records));
  assert.deepEqual(records.map(({ id }) => id), button.sourceRecordIds);
  assert.equal(sourceBrowser.primarySourceRecordId(button), "aria-apg:button");
  assert.equal(
    sourceBrowser.preferredVisibleSourceRecordId(records, "base-ui:button"),
    "base-ui:button",
  );
  assert.equal(
    sourceBrowser.preferredVisibleSourceRecordId(
      records.filter(({ provenance }) => provenance.providerId === "base-ui"),
      "shadcn-ui:button",
    ),
    "base-ui:button",
  );
});

test("every live preview maps to a current approved source record", () => {
  const recordIds = new Set(snapshot.records.map(({ id }) => id));
  assert.equal(livePreviewSourceIds.length, 115);
  assert.equal(new Set(livePreviewSourceIds).size, livePreviewSourceIds.length);
  assert.equal(
    livePreviewSourceIds.every((id) => recordIds.has(id)),
    true,
  );
  assert.deepEqual(
    [...new Set(livePreviewSourceIds.map((id) => id.split(":")[0]))].sort(),
    ["assistant-ui", "base-ui", "shadcn-ui"],
  );
  assert.equal(galleryPreviewSourceIds.length, 78);
  assert.deepEqual(
    [...new Set(galleryPreviewSourceIds.map((id) => id.split(":")[0]))].sort(),
    ["assistant-ui", "shadcn-ui"],
  );
  assert.equal(
    galleryPreviewSourceIds.every((id) => recordIds.has(id)),
    true,
  );
});

test("every mapped upstream preview imports and renders without warnings or failures", () => {
  const result = spawnSync(
    process.execPath,
    [resolve(packageRoot, "tests/run-live-preview-smoke.mjs"), previewOutputFile],
    { encoding: "utf8", timeout: 30_000 },
  );
  const report = JSON.parse(result.stdout || "{}");

  assert.equal(
    result.status,
    0,
    JSON.stringify({ ...report, stderr: result.stderr }, null, 2),
  );
});

test("the rendered browser is a card gallery of real visual implementations", () => {
  const markup = renderToStaticMarkup(
    React.createElement(GalleryShell, {
      snapshot,
      navigation: { entryId: null, openEntry() {}, closeInspector() {} },
    }),
  );

  assert.match(markup, /UI Pattern Atlas/);
  assert.match(markup, /aria-label="Components"/);
  assert.equal((markup.match(/data-gallery-card=""/g) ?? []).length, 78);
  assert.match(markup, /data-live-component-preview=""/);
  assert.match(markup, /data-source-record-id="shadcn-ui:accordion"/);
  assert.match(markup, /data-preview-size="card"/);
  assert.match(markup, /data-source-item-id="shadcn-ui:accordion"/);
  assert.match(markup, /data-source-item-id="shadcn-ui:button"/);
  assert.doesNotMatch(markup, /data-source-(?:item|record)-id="base-ui:/);
  assert.doesNotMatch(markup, />Base UI</);
  assert.ok(
    markup.indexOf('aria-label="Find components"') <
      markup.indexOf('id="pattern-results" tabindex="-1"'),
  );
  assert.doesNotMatch(markup, /Filter by kind|All kinds/);
  assert.doesNotMatch(markup, /Licensed excerpt|Evidence|Technologies|Packages/);
});

test("query ordering puts the top-ranked preview card first", () => {
  const markup = renderToStaticMarkup(
    React.createElement(GalleryShell, {
      snapshot,
      navigation: {
        entryId: null,
        legacyQuery: "action",
        openEntry() {},
        closeInspector() {},
      },
    }),
  );

  assert.ok(
    markup.indexOf('data-source-item-id="assistant-ui:action-bar"') <
      markup.indexOf('data-source-item-id="assistant-ui:action-bar-more"'),
  );
});

test("retained Base UI routes resolve to the paired visual implementation", () => {
  const button = snapshot.records.find(({ id }) => id === "base-ui:button");
  const shadcnButton = snapshot.records.find(
    ({ id }) => id === "shadcn-ui:button",
  );
  const markup = renderToStaticMarkup(
    React.createElement(GalleryShell, {
      snapshot,
      navigation: {
        entryId: button.id,
        openEntry() {},
        closeInspector() {},
      },
    }),
  );

  assert.match(markup, /data-source-record-id="shadcn-ui:button"/);
  assert.doesNotMatch(markup, /data-source-record-id="base-ui:button"/);
  assert.match(markup, new RegExp(`href="${shadcnButton.canonicalUrl}"`));
  assert.doesNotMatch(markup, />Base UI</);
  assert.doesNotMatch(markup, /Native ID/);
});

test("every displayed entry has a focused detail route and every displayed preview is routable", () => {
  const displayedEntries = sourceBrowser.filterAtlasEntries(snapshot, {
    query: "",
    providerId: "all",
  });
  assert.equal(displayedEntries.length, 78);

  const records = sourceBrowser.sourceRecordById(snapshot.records);
  for (const entry of displayedEntries) {
    const implementation =
      sourceBrowser.galleryImplementationRecords(entry, records)[0];
    assert.ok(implementation, entry.name);
    const entryMarkup = renderToStaticMarkup(
      React.createElement(GalleryShell, {
        snapshot,
        navigation: {
          entryId: implementation.id,
          openEntry() {},
          closeInspector() {},
        },
      }),
    );

    assert.match(entryMarkup, new RegExp(`<h2[^>]*>${entry.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}</h2>`));
    assert.match(entryMarkup, /aria-label="Source guidance and examples"/);
    assert.match(entryMarkup, /class="sticky top-0/);
    assert.equal(
      (entryMarkup.match(/>Documentation</g) ?? []).length,
      1,
      entry.name,
    );
    assert.doesNotMatch(entryMarkup, /Native ID/);
  }

  for (const sourceRecordId of galleryPreviewSourceIds) {
    const implementationMarkup = renderToStaticMarkup(
      React.createElement(GalleryShell, {
        snapshot,
        navigation: {
          entryId: sourceRecordId,
          openEntry() {},
          closeInspector() {},
        },
      }),
    );

    assert.match(
      implementationMarkup,
      new RegExp(`data-source-record-id="${sourceRecordId}"`),
      sourceRecordId,
    );
  }
});

test("every displayed example is a real non-redundant upstream link", () => {
  const records = sourceBrowser.sourceRecordById(snapshot.records);
  const displayedEntries = sourceBrowser.filterAtlasEntries(snapshot, {
    query: "",
    providerId: "all",
  });
  const displayedRecords = displayedEntries.flatMap((entry) => [
    ...sourceBrowser.galleryImplementationRecords(entry, records),
    ...sourceBrowser
      .recordsForEntry(entry, records)
      .filter(({ provenance }) => provenance.providerId === "aria-apg"),
  ]);
  const examples = displayedRecords.flatMap((record) =>
    record.examples.map((example) => ({ record, example })),
  );

  assert.ok(examples.length > 0);
  for (const { record, example } of examples) {
    assert.match(example.url, /^https:\/\//);
    assert.notEqual(example.url, record.canonicalUrl);
  }
});

test("Base-only records stay source-native but are not promoted into the gallery", () => {
  const autocomplete = snapshot.records.find(
    ({ id }) => id === "base-ui:autocomplete",
  );
  const markup = renderToStaticMarkup(
    React.createElement(GalleryShell, {
      snapshot,
      mode: "panel",
      navigation: {
        entryId: autocomplete.id,
        openEntry() {},
        closeInspector() {},
      },
    }),
  );

  assert.match(markup, /retained source record/);
  assert.doesNotMatch(markup, /data-live-component-preview/);
});

test("unknown source-native routes show a clear missing state", () => {
  const markup = renderToStaticMarkup(
    React.createElement(GalleryShell, {
      snapshot,
      navigation: {
        entryId: "base-ui:does-not-exist",
        openEntry() {},
        closeInspector() {},
      },
    }),
  );

  assert.match(markup, /not present in the current snapshot/);
  assert.match(markup, /aria-label="UI Pattern detail"/);
  assert.doesNotMatch(markup, /data-live-component-preview/);
});

test("the thread panel keeps the focused preview, sticky navigation, and one primary docs link", () => {
  const markup = renderToStaticMarkup(
    React.createElement(GalleryShell, {
      snapshot,
      mode: "panel",
      navigation: { entryId: "assistant-ui:composer", openEntry() {}, closeInspector() {} },
    }),
  );

  assert.match(markup, /Composer/);
  assert.match(markup, /data-source-record-id="assistant-ui:composer"/);
  assert.match(markup, /assistant-ui/);
  assert.match(markup, /About this assistant-ui implementation/);
  assert.match(markup, /class="sticky top-0/);
  assert.equal((markup.match(/>Documentation</g) ?? []).length, 1);
  assert.doesNotMatch(markup, /<details|<summary|Source links|Relationships|Revision/);
});

test("source-native routes preserve close-history semantics", () => {
  const subPath = sourceBrowser.entrySubPath("aria-apg:combobox");
  assert.equal(subPath, "entry/aria-apg:combobox");
  assert.equal(sourceBrowser.entryIdFromSubPath(subPath), "aria-apg:combobox");
  assert.equal(
    sourceBrowser.entryIdFromSubPath("entry/aria-apg%3Acombobox"),
    "aria-apg:combobox",
  );
  assert.equal(
    sourceBrowser.entryIdFromSubPath("entry/aria-apg%253Acombobox"),
    "aria-apg:combobox",
  );
  assert.equal(sourceBrowser.legacyQueryFromEntryId("button"), "button");
  assert.equal(sourceBrowser.legacyQueryFromEntryId("aria-apg:combobox"), null);
  assert.equal(sourceBrowser.inspectorCloseMode(true), "back");
  assert.equal(sourceBrowser.inspectorCloseMode(false), "replace");
});
