import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import test, { after } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { build } from "esbuild";

import providerIndex from "../generated/provider-index.v2.json" with { type: "json" };
import providerSnapshot from "../generated/provider-snapshot.v2.json" with { type: "json" };

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
process.env.UI_PATTERN_ATLAS_ROOT = packageRoot;
const temporaryDirectory = await mkdtemp(resolve(tmpdir(), "ui-pattern-atlas-provider-test-"));
const outputFile = resolve(temporaryDirectory, "provider-kernel.mjs");

await build({
  stdin: {
    contents: [
      'export * from "./providers/build.ts";',
      'export * from "./providers/build-entry.ts";',
      'export * from "./providers/health.ts";',
      'export * from "./providers/policy.ts";',
      'export * from "./providers/registry.ts";',
      'export * from "./providers/schema.ts";',
      'export * from "./providers/search-v2.ts";',
      'export * from "./providers/source-browser-v2.ts";',
    ].join("\n"),
    loader: "ts",
    resolveDir: packageRoot,
    sourcefile: "provider-kernel-test-entry.ts",
  },
  outfile: outputFile,
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  logLevel: "silent",
});

const kernel = await import(`${pathToFileURL(outputFile).href}?provider-test=${Date.now()}`);

after(async () => {
  await rm(temporaryDirectory, { recursive: true, force: true });
});

test("bundled artifacts contain only the four approved sources", () => {
  assert.deepEqual(kernel.federatedSnapshotSchema.parse(providerSnapshot), providerSnapshot);
  assert.deepEqual(kernel.providerIndexSchema.parse(providerIndex), providerIndex);
  assert.deepEqual(
    providerSnapshot.providers.map(({ id, records }) => [id, records.length]),
    [
      ["aria-apg", 30],
      ["assistant-ui", 18],
      ["base-ui", 37],
      ["shadcn-ui", 64],
    ],
  );
  assert.equal(providerSnapshot.entries.length, 98);
  assert.equal(providerIndex.documents.length, 98);
  assert.equal(providerSnapshot.providers.every(({ build }) => build.mode === "current"), true);
});

test("the checked-in snapshot and index are deterministic build outputs", () => {
  const first = kernel.buildRegisteredProviderArtifacts();
  const second = kernel.buildRegisteredProviderArtifacts();
  assert.deepEqual(first, second);
  assert.deepEqual(first.snapshot, providerSnapshot);
  assert.deepEqual(first.index, providerIndex);

  const reversed = kernel.buildProviderArtifacts({
    inputs: [...kernel.providerBuildInputs].reverse(),
    assembledAt: kernel.providerSnapshotAssembledAt,
  });
  assert.deepEqual(reversed, first);
});

test("deterministic grouping joins declared equivalents but keeps all source records", () => {
  const button = providerSnapshot.entries.find(({ name }) => name === "Button");
  assert.deepEqual(button.sourceRecordIds, ["aria-apg:button", "base-ui:button", "shadcn-ui:button"]);
  assert.equal(button.kind, "mixed");
  assert.equal(button.summary, null);
  assert.equal(button.exampleCount, 19);

  const composer = providerSnapshot.entries.find(({ name }) => name === "Composer");
  assert.equal(composer.summary.sourceRecordId, "assistant-ui:composer");

  assert.deepEqual(
    providerSnapshot.entries.find(({ name }) => name === "Alert").sourceRecordIds,
    ["aria-apg:alert", "shadcn-ui:alert"],
  );
  assert.equal(providerSnapshot.entries.filter(({ name }) => name === "Attachment").length, 2);
  assert.equal(providerSnapshot.entries.filter(({ name }) => name === "Message").length, 2);
  const dialog = providerSnapshot.entries.find(({ name }) => name === "Dialog");
  assert.equal(dialog.sourceRecordIds.includes("shadcn-ui:sheet"), false);
});

test("offline search returns computed entries with provider filtering", () => {
  const result = kernel.searchProviderIndex(providerIndex, { query: "combobox" });
  assert.equal(result.mode, "exact");
  assert.equal(result.results[0].entry.name, "Combobox");

  const assistantOnly = kernel.searchProviderIndex(providerIndex, {
    query: "composerprimitive",
    providerId: "assistant-ui",
  });
  assert.equal(assistantOnly.results[0].entry.name, "Composer");
  assert.equal(kernel.findAtlasEntry(providerIndex, "base-ui:combobox").name, "Combobox");

  const dialog = kernel.searchProviderIndex(providerIndex, { query: "dialog" });
  assert.equal(dialog.results[0].entry.name, "Dialog");

  assert.throws(() =>
    kernel.atlasEntrySearchInputSchema.parse({ kind: "primitive" }),
  );
  assert.throws(() =>
    kernel.atlasEntrySearchResultSchema.parse({
      mode: "expanded",
      queryTerms: ["button"],
      entries: [],
    }),
  );
});

test("offline search requires every query term", () => {
  for (const query of [
    "button frobnicate",
    "combobox zzzzz",
    "composer nonexistent",
  ]) {
    const result = kernel.searchProviderIndex(providerIndex, { query });
    assert.equal(result.mode, "exact");
    assert.deepEqual(result.results, []);
  }
});

test("provider-filtered search excludes text owned by other providers", () => {
  const baseOnly = kernel.searchProviderIndex(providerIndex, {
    query: "vertically",
    providerId: "base-ui",
  });
  assert.deepEqual(baseOnly.results, []);

  const shadcnOnly = kernel.searchProviderIndex(providerIndex, {
    query: "collapsible",
    providerId: "shadcn-ui",
  });
  assert.equal(
    shadcnOnly.results.some(({ entry }) => entry.name === "Accordion"),
    false,
  );
  assert.equal(
    shadcnOnly.results.some(({ entry }) => entry.name === "Collapsible"),
    true,
  );
});

test("source browser exposes entries and source-owned detail through one frozen snapshot", () => {
  const snapshot = kernel.getSourceBrowserSnapshot();
  assert.equal(snapshot.providers.length, 4);
  assert.equal(snapshot.records.length, 149);
  assert.equal(snapshot.entries.length, 98);
  assert.equal(Object.isFrozen(snapshot), true);
  assert.equal(Object.isFrozen(snapshot.records), true);

  const composer = snapshot.records.find(({ id }) => id === "assistant-ui:composer");
  assert.equal(composer.summary.text, "Build custom message input UIs with full control over layout and behavior.");
  assert.ok(composer.sections.length > 0);
  assert.equal(composer.examples.length, 0);
  assert.ok(composer.relationships.length > 0);

  const apgButton = snapshot.records.find(({ id }) => id === "aria-apg:button");
  assert.ok(
    apgButton.sections.some(
      ({ nativeId, content }) =>
        nativeId === "keyboard_interaction" &&
        content?.includes("Space : Activates the button"),
    ),
  );
  assert.ok(
    snapshot.records
      .flatMap((record) =>
        record.examples.map((example) => ({ record, example })),
      )
      .every(
        ({ record, example }) =>
          example.url.startsWith("https://") &&
          example.url !== record.canonicalUrl,
      ),
  );
});

test("provider policy binds exact IDs, repositories, paths, and licenses", () => {
  for (const mutation of [
    (input) => { input.definition.id = "unapproved"; },
    (input) => { input.definition.source.repository = "https://github.com/example/repo"; },
    (input) => { input.definition.source.sourcePaths = ["**/*"]; },
    (input) => { input.definition.license.expression = "LicenseRef-Unreviewed"; },
  ]) {
    const input = structuredClone(kernel.providerBuildInputs[0]);
    mutation(input);
    assert.throws(() => kernel.enforceProviderLicensePolicy(input.definition));
  }
});

test("an invalid candidate retains its verified last-known-good provider", () => {
  const inputs = structuredClone(kernel.providerBuildInputs);
  inputs[0].expectedInputSha256 = "0".repeat(64);
  const result = kernel.buildProviderArtifacts({
    inputs,
    assembledAt: kernel.providerSnapshotAssembledAt,
    previousSnapshot: providerSnapshot,
  });
  const providerId = inputs[0].definition.id;
  const retained = result.snapshot.providers.find(({ id }) => id === providerId);
  assert.equal(retained.build.mode, "last-known-good");
  assert.equal(retained.build.failure.code, "input-integrity-mismatch");
});

test("strict schemas reject bespoke taxonomy, technology, package, and evidence fields", () => {
  const record = providerSnapshot.providers[0].records[0];
  for (const field of ["taxonomy", "technologies", "packages", "evidence", "evidenceBadges", "sourceTags", "details", "preview"]) {
    assert.throws(() => kernel.providerRecordSchema.parse({ ...record, [field]: [] }));
  }
  const entry = providerSnapshot.entries[0];
  for (const field of ["taxonomy", "technologies", "packages", "evidence", "evidenceBadges", "sourceTags"]) {
    assert.throws(() => kernel.atlasEntrySchema.parse({ ...entry, [field]: [] }));
  }
});

test("runtime modules remain offline", async () => {
  const files = [
    "providers/generated-v2.ts",
    "providers/health.ts",
    "providers/rpc-v2.ts",
    "providers/search-v2.ts",
    "providers/source-browser-v2.ts",
  ];
  const source = (await Promise.all(files.map((file) => readFile(resolve(packageRoot, file), "utf8")))).join("\n");
  assert.doesNotMatch(source, /\bfetch\s*\(|node:https|node:http|puppeteer|playwright/);
});
