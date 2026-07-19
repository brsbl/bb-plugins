import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import test, { after } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { build } from "esbuild";

import providerIndex from "../generated/provider-index.v1.json" with {
  type: "json",
};
import providerSnapshot from "../generated/provider-snapshot.v1.json" with {
  type: "json",
};

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const temporaryDirectory = await mkdtemp(
  resolve(tmpdir(), "ui-pattern-atlas-provider-test-"),
);
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
      'export * from "./providers/search.ts";',
    ].join("\n"),
    loader: "ts",
    resolveDir: packageRoot,
    sourcefile: "provider-kernel-test-entry.ts",
  },
  outfile: outputFile,
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node20",
  logLevel: "silent",
});

const kernel = await import(
  `${pathToFileURL(outputFile).href}?provider-test=${Date.now()}`
);

after(async () => {
  await rm(temporaryDirectory, { recursive: true, force: true });
});

test("bundled provider artifacts validate and contain only upstream records", () => {
  assert.deepEqual(
    kernel.federatedSnapshotSchema.parse(providerSnapshot),
    providerSnapshot,
  );
  assert.deepEqual(
    kernel.providerIndexSchema.parse(providerIndex),
    providerIndex,
  );
  assert.equal(providerSnapshot.providers.length, 2);
  assert.deepEqual(
    providerSnapshot.providers.map(({ id, records }) => [id, records.length]),
    [
      ["govuk-design-system", 70],
      ["uswds", 55],
    ],
  );
  assert.equal(providerIndex.documents.length, 125);

  for (const provider of providerSnapshot.providers) {
    assert.equal(provider.license.scope, "metadata-only");
    assert.equal(provider.build.mode, "current");
    for (const record of provider.records) {
      assert.equal(record.provenance.providerId, provider.id);
      assert.equal("taxonomy" in record, false);
      assert.equal("relationships" in record, false);
      assert.equal("examples" in record, false);
      assert.equal("preview" in record, false);
    }
  }
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

test("source-native IDs remain scoped by provider instead of being rewritten", () => {
  const results = kernel.searchProviderIndex(providerIndex, {
    query: "accordion",
  });
  assert.equal(results.mode, "exact");
  assert.deepEqual(
    results.results
      .map(({ record }) => [
        record.provenance.providerId,
        record.nativeId,
      ])
      .sort(),
    [
      ["govuk-design-system", "accordion"],
      ["uswds", "usa-accordion"],
    ],
  );

  const uswdsOnly = kernel.searchProviderIndex(providerIndex, {
    query: "accordion",
    providerId: "uswds",
  });
  assert.deepEqual(
    uswdsOnly.results.map(({ record }) => record.nativeId),
    ["usa-accordion"],
  );
});

test("offline search uses upstream names, aliases, summaries, and kinds", () => {
  const alias = kernel.searchProviderIndex(providerIndex, {
    query: "back button",
    providerId: "govuk-design-system",
  });
  assert.equal(alias.results[0].record.nativeId, "back-link");

  const patterns = kernel.searchProviderIndex(providerIndex, {
    query: "addresses",
    kind: "pattern",
  });
  assert.equal(patterns.results[0].record.nativeId, "addresses");
  assert.equal(
    kernel.findProviderRecord(
      providerIndex,
      "govuk-design-system",
      "addresses",
    ).canonicalUrl,
    "https://design-system.service.gov.uk/patterns/addresses/",
  );
});

test("license policy rejects unapproved provider ingestion", () => {
  const input = structuredClone(kernel.providerBuildInputs[0]);
  input.definition.license.expression = "LicenseRef-Unreviewed";
  assert.throws(
    () =>
      kernel.buildProviderArtifacts({
        inputs: [input],
        assembledAt: kernel.providerSnapshotAssembledAt,
      }),
    (error) => error.code === "license-not-allowed",
  );
});

test("an invalid candidate retains a verified last-known-good provider", () => {
  const inputs = structuredClone(kernel.providerBuildInputs);
  inputs[0].expectedInputSha256 = "0".repeat(64);
  const result = kernel.buildProviderArtifacts({
    inputs,
    assembledAt: kernel.providerSnapshotAssembledAt,
    previousSnapshot: providerSnapshot,
  });
  const retained = result.snapshot.providers.find(
    ({ id }) => id === "govuk-design-system",
  );
  assert.equal(retained.build.mode, "last-known-good");
  assert.equal(retained.build.failure.code, "input-integrity-mismatch");
  assert.deepEqual(
    retained.records,
    providerSnapshot.providers[0].records,
  );
  assert.equal(
    result.snapshot.providers.find(({ id }) => id === "uswds").build.mode,
    "current",
  );
});

test("provider health separates availability from freshness", () => {
  const provider = providerSnapshot.providers[0];
  const fresh = kernel.assessProviderHealth(
    provider,
    new Date("2026-07-18T00:00:00.000Z"),
  );
  assert.deepEqual(
    [fresh.health, fresh.availability, fresh.freshness],
    ["healthy", "current", "fresh"],
  );

  const stale = kernel.assessProviderHealth(
    provider,
    new Date("2027-01-01T00:00:00.000Z"),
  );
  assert.deepEqual(
    [stale.health, stale.availability, stale.freshness],
    ["degraded", "current", "stale"],
  );
  assert.equal(stale.reason, "freshness-window-exceeded");

  const unavailable = kernel.assessProviderHealth(undefined);
  assert.deepEqual(
    [
      unavailable.health,
      unavailable.availability,
      unavailable.freshness,
    ],
    ["unavailable", "unavailable", "unknown"],
  );
});

test("strict record validation rejects Atlas-authored catalog fields", () => {
  const record = providerSnapshot.providers[0].records[0];
  for (const field of [
    "taxonomy",
    "relationships",
    "examples",
    "preview",
    "details",
  ]) {
    assert.throws(() =>
      kernel.providerRecordSchema.parse({
        ...record,
        [field]: [],
      }),
    );
  }
});

test("runtime provider modules do not fetch or scrape", async () => {
  const files = [
    "providers/generated.ts",
    "providers/health.ts",
    "providers/rpc.ts",
    "providers/search.ts",
  ];
  const source = (
    await Promise.all(
      files.map((file) => readFile(resolve(packageRoot, file), "utf8")),
    )
  ).join("\n");
  assert.doesNotMatch(source, /\bfetch\s*\(|node:https|node:http|puppeteer|playwright/);
});
