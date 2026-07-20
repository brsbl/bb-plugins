import assert from "node:assert/strict";
import test from "node:test";
import {
  cliCommandInfo,
  cliEnvelopeVersion,
  cliSchemaVersion,
  runAtlasCli,
} from "../runtime-cli.js";

function jsonResult(argv) {
  const result = runAtlasCli(argv);
  const output = result.stdout ?? result.stderr;
  assert.ok(output, `expected JSON output for ${argv.join(" ")}`);
  return { result, payload: JSON.parse(output) };
}

function assertVersioned(payload, command) {
  assert.equal(payload.schemaVersion, "3");
  assert.equal(payload.envelopeVersion, "1");
  assert.equal(payload.command, command);
}

test("v3 command metadata keeps the top-level command discoverable", () => {
  assert.equal(cliSchemaVersion, "3");
  assert.equal(cliEnvelopeVersion, "1");
  assert.deepEqual(
    cliCommandInfo.map(({ name }) => name),
    ["search", "show", "list", "sources", "status"],
  );
});

test("search returns source-native IDs and explicit provenance", () => {
  const { result, payload } = jsonResult(["search", "combobox", "--json"]);
  assert.equal(result.exitCode, 0);
  assertVersioned(payload, "search");
  assert.equal(payload.data.status, "ok");
  assert.equal(payload.data.results[0].id, "aria-apg:combobox");
  for (const field of ["provider", "canonicalUrl", "upstreamRevision", "retrievedAt", "license", "contentMode", "status"]) {
    assert.equal(field in payload.data.results[0], true, `${field} must be explicit`);
  }
  assert.equal("category" in payload.data.results[0], false);
  assert.equal("seeAlso" in payload.data.results[0], false);
});

test("legacy show identities deprecate without choosing a provider", () => {
  for (const target of ["button", "entry/button"]) {
    const { result, payload } = jsonResult(["show", target, "--json"]);
    assert.equal(result.exitCode, 0);
    assertVersioned(payload, "show");
    assert.equal(payload.data.status, "deprecated");
    assert.equal(payload.data.deprecation.code, "atlas-v2-identity-retired");
    assert.deepEqual(
      payload.data.candidates.map(({ id }) => id),
      ["aria-apg:button", "html:button"],
    );
  }
});

test("provider-native show resolves exactly one record without v2 relationships", () => {
  const { result, payload } = jsonResult(["show", "aria-apg:combobox", "--json"]);
  assert.equal(result.exitCode, 0);
  assertVersioned(payload, "show");
  assert.equal(payload.data.status, "ok");
  assert.equal(payload.data.entry.id, "aria-apg:combobox");
  assert.equal("seeAlso" in payload.data.entry, false);
  assert.equal("category" in payload.data.entry, false);
});

test("list, sources, and status are deterministic and provider-scoped", () => {
  const first = runAtlasCli(["status", "--json"]);
  const second = runAtlasCli(["status", "--json"]);
  assert.equal(first.stdout, second.stdout);

  const status = JSON.parse(first.stdout);
  assertVersioned(status, "status");
  assert.equal(status.data.status, "ready");
  assert.deepEqual(status.data.providers.map(({ provider }) => provider), ["aria-apg", "html"]);

  const { payload: list } = jsonResult(["list", "--provider", "html", "--json"]);
  assertVersioned(list, "list");
  assert.ok(list.data.results.every(({ provider }) => provider === "html"));

  const { payload: sources } = jsonResult(["sources", "--provider", "aria-apg", "--json"]);
  assertVersioned(sources, "sources");
  assert.equal(sources.data.sources.length, 1);
  assert.deepEqual(
    Object.keys(sources.data.sources[0]).slice(2, 8),
    ["canonicalUrl", "upstreamRevision", "retrievedAt", "license", "contentMode", "status"],
  );
});

test("retired v2 taxonomy filters fail explicitly rather than applying hidden routing", () => {
  const { result, payload } = jsonResult(["list", "--category", "Feedback & status", "--json"]);
  assert.equal(result.exitCode, 2);
  assertVersioned(payload, "list");
  assert.equal(payload.data.error.code, "atlas-v2-house-taxonomy-retired");
});
