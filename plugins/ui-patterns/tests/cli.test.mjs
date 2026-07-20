import assert from "node:assert/strict";
import test from "node:test";
import { cliCommandInfo, cliEnvelopeVersion, cliSchemaVersion, runAtlasCli } from "../atlas-cli-v5.js";

function jsonResult(argv) {
  const result = runAtlasCli(argv);
  const output = result.stdout ?? result.stderr;
  assert.ok(output, `expected JSON output for ${argv.join(" ")}`);
  return { result, payload: JSON.parse(output) };
}

function assertVersioned(payload, command) {
  assert.equal(payload.schemaVersion, "5");
  assert.equal(payload.envelopeVersion, "1");
  assert.equal(payload.command, command);
}

test("command metadata keeps the established CLI surface discoverable", () => {
  assert.equal(cliSchemaVersion, "5");
  assert.equal(cliEnvelopeVersion, "1");
  assert.deepEqual(cliCommandInfo.map(({ name }) => name), ["search", "show", "list", "sources", "status"]);
});

test("search returns one computed entry with all source-native IDs", () => {
  const { result, payload } = jsonResult(["search", "combobox", "--json"]);
  assert.equal(result.exitCode, 0);
  assertVersioned(payload, "search");
  assert.equal(payload.data.results[0].name, "Combobox");
  assert.equal("key" in payload.data.results[0], false);
  assert.deepEqual(payload.data.results[0].sourceRecordIds, [
    "aria-apg:combobox",
    "base-ui:combobox",
    "shadcn-ui:combobox",
  ]);
  for (const field of ["technologies", "packages", "evidence", "evidenceBadges", "sourceTags"]) {
    assert.equal(field in payload.data.results[0], false);
  }
});

test("search ranking prefers an exact entry name over relationship mentions", () => {
  const { payload } = jsonResult(["search", "dialog", "--json"]);
  assert.equal(payload.data.results[0].name, "Dialog");
});

test("search requires every query term instead of returning partial matches", () => {
  for (const query of [
    "button frobnicate",
    "combobox zzzzz",
    "composer nonexistent",
  ]) {
    const { payload } = jsonResult(["search", query, "--json"]);
    assert.equal(payload.data.retrieval.mode, "exact");
    assert.equal(payload.data.total, 0);
    assert.deepEqual(payload.data.results, []);
  }
});

test("provider-filtered search excludes text owned by other providers", () => {
  const { payload: baseOnly } = jsonResult([
    "search",
    "vertically",
    "--provider",
    "base-ui",
    "--json",
  ]);
  assert.equal(baseOnly.data.total, 0);

  const { payload: shadcnOnly } = jsonResult([
    "search",
    "collapsible",
    "--provider",
    "shadcn-ui",
    "--json",
  ]);
  assert.equal(
    shadcnOnly.data.results.some(({ name }) => name === "Accordion"),
    false,
  );
  assert.equal(
    shadcnOnly.data.results.some(({ name }) => name === "Collapsible"),
    true,
  );
});

test("show resolves a source-native ID to its Atlas entry and attributable records", () => {
  const { result, payload } = jsonResult(["show", "base-ui:combobox", "--json"]);
  assert.equal(result.exitCode, 0);
  assertVersioned(payload, "show");
  assert.equal(payload.data.entry.name, "Combobox");
  assert.deepEqual(payload.data.sourceRecords.map(({ provenance }) => provenance.providerId), ["aria-apg", "base-ui", "shadcn-ui"]);
  assert.equal(payload.data.sourceRecords.every(({ canonicalUrl }) => canonicalUrl.startsWith("https://")), true);
});

test("list, sources, and status use exactly the approved source set", () => {
  const first = runAtlasCli(["status", "--json"]);
  const second = runAtlasCli(["status", "--json"]);
  assert.equal(first.stdout, second.stdout);

  const status = JSON.parse(first.stdout);
  assertVersioned(status, "status");
  assert.equal(status.data.entryCount, 98);
  assert.equal(status.data.sourceRecordCount, 149);
  assert.deepEqual(status.data.providers.map(({ id }) => id), ["aria-apg", "assistant-ui", "base-ui", "shadcn-ui"]);

  const { payload: list } = jsonResult(["list", "--provider", "assistant-ui", "--json"]);
  assertVersioned(list, "list");
  assert.ok(list.data.results.every(({ sourceRecordIds }) => sourceRecordIds.some((id) => id.startsWith("assistant-ui:"))));
  assert.deepEqual(list.data.filters, { provider: "assistant-ui" });

  const { payload: sources } = jsonResult(["sources", "--provider", "aria-apg", "--json"]);
  assertVersioned(sources, "sources");
  assert.deepEqual(sources.data.sources.map(({ id }) => id), ["aria-apg"]);
});

test("record type filter flags are rejected", () => {
  for (const flag of ["--kind", "--type"]) {
    const { result, payload } = jsonResult(["list", flag, "primitive", "--json"]);
    assert.equal(result.exitCode, 2);
    assert.equal(payload.data.error.code, "unknown-option");
  }
});

test("unapproved providers and source-less show IDs fail explicitly", () => {
  const unknownProvider = jsonResult(["list", "--provider", "govuk-design-system", "--json"]);
  assert.equal(unknownProvider.result.exitCode, 2);
  assert.equal(unknownProvider.payload.data.error.code, "unknown-provider");

  const unknownRecord = jsonResult(["show", "button", "--json"]);
  assert.equal(unknownRecord.result.exitCode, 1);
  assert.equal(unknownRecord.payload.data.error.code, "unknown-source-record");
});
