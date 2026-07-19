import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  UPSTREAM_ADAPTER_CONTRACT_VERSION,
  fixtureChecksum,
  parsePinnedUpstreamFixture,
  upstreamAdapters,
} from "../upstream-adapters/index.mjs";

const fixtureDirectory = new URL("../upstream-adapters/fixtures/", import.meta.url);
const fixtureNames = [
  "w3c-aria-apg.combobox.json",
  "base-ui.select.json",
  "carbon.select.json",
];
const fixtures = await Promise.all(
  fixtureNames.map(async (name) =>
    JSON.parse(await readFile(new URL(name, fixtureDirectory), "utf8")),
  ),
);

test("each official provider fixture maps the complete kernel contract", () => {
  assert.deepEqual([...upstreamAdapters.keys()], ["w3c-aria-apg", "base-ui", "carbon"]);

  for (const fixture of fixtures) {
    const record = parsePinnedUpstreamFixture(fixture.providerId, fixture);

    assert.equal(record.contractVersion, UPSTREAM_ADAPTER_CONTRACT_VERSION);
    assert.equal(record.providerId, fixture.providerId);
    assert.equal(record.upstreamId, fixture.document.stableId);
    assert.equal(record.title, fixture.document.title);
    assert.deepEqual(record.native, {
      sections: fixture.document.sections,
      tags: fixture.document.tags,
      aliases: fixture.document.aliases,
    });
    assert.deepEqual(record.canonicalUrls, fixture.urls);
    assert.equal(record.provenance.upstreamRevision, fixture.provenance.upstreamRevision);
    assert.equal(record.provenance.retrievedAt, fixture.provenance.retrievedAt);
    assert.deepEqual(record.provenance.checksum, fixture.provenance.checksum);
    assert.deepEqual(record.provenance.license, fixture.license);
    assert.equal(fixture.provenance.checksum.value, fixtureChecksum(fixture));
  }
});

test("fixtures are metadata-only and do not introduce upstream definitions or assets", () => {
  for (const fixture of fixtures) {
    assert.equal(fixture.license.contentMode, "metadata-only");
    assert.equal("excerpt" in fixture.document, false);
    assert.equal("assets" in fixture, false);
    assert.equal("component" in fixture, false);
  }
});

test("verification rejects corruption and non-official destinations before kernel ingest", () => {
  const fixture = structuredClone(fixtures[0]);
  fixture.document.title = "changed";
  assert.throws(
    () => parsePinnedUpstreamFixture(fixture.providerId, fixture),
    /checksum/i,
  );

  const wrongHost = structuredClone(fixtures[1]);
  wrongHost.urls.docs = "https://example.com/select";
  wrongHost.provenance.checksum.value = fixtureChecksum(wrongHost);
  assert.throws(
    () => parsePinnedUpstreamFixture(wrongHost.providerId, wrongHost),
    /official base-ui source/i,
  );

  const wrongRepository = structuredClone(fixtures[0]);
  wrongRepository.urls.code =
    "https://github.com/not-w3c/aria-practices/blob/18c1a2fca626f7aeb33270e23ae9b18833e2164d/content/patterns/combobox/combobox-pattern.html";
  wrongRepository.provenance.checksum.value = fixtureChecksum(wrongRepository);
  assert.throws(
    () => parsePinnedUpstreamFixture(wrongRepository.providerId, wrongRepository),
    /official w3c-aria-apg source/i,
  );

  assert.throws(
    () => parsePinnedUpstreamFixture("unapproved-provider", fixtures[0]),
    /No upstream adapter/i,
  );
});

test("adapter modules expose no runtime fetch or installer behavior", async () => {
  const source = await Promise.all(
    ["contract.mjs", "w3c-aria-apg.mjs", "base-ui.mjs", "carbon.mjs", "index.mjs"].map((name) =>
      readFile(new URL(`../upstream-adapters/${name}`, import.meta.url), "utf8"),
    ),
  );
  const joined = source.join("\n");

  assert.doesNotMatch(joined, /\bfetch\s*\(/);
  assert.doesNotMatch(
    joined,
    /child_process|spawnSync|execFile|bb\s+plugin\s+install|npm\s+install|pnpm\s+install|yarn\s+install/,
  );
});
