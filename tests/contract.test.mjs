import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const packageJson = JSON.parse(
  await readFile(new URL("../package.json", import.meta.url), "utf8"),
);
const app = await readFile(new URL("../app.tsx", import.meta.url), "utf8");
const gallery = await readFile(
  new URL("../gallery-shell.tsx", import.meta.url),
  "utf8",
);
const buildScript = await readFile(
  new URL("../scripts/build.mjs", import.meta.url),
  "utf8",
);
const readme = await readFile(new URL("../README.md", import.meta.url), "utf8");

test("the package ships the source browser, not the Atlas preview system", () => {
  assert.ok(packageJson.files.includes("source-item.ts"));
  assert.ok(packageJson.files.includes("source-browser-model.ts"));
  assert.ok(packageJson.files.includes("source-browser-fixtures.ts"));
  assert.equal(packageJson.files.includes("atlas-ds/"), false);
  assert.equal(packageJson.files.includes("pattern-previews.tsx"), false);
  assert.equal(packageJson.files.includes("generated/atlas-registry.v2.json"), false);
  assert.equal(packageJson.files.includes("dist/"), false);
  assert.equal(packageJson.scripts.test.includes("pattern-previews"), false);
  assert.doesNotMatch(buildScript, /atlas-ds|gallery\.css|pluginCustomCss/);
  assert.match(readme, /provider-owned UI guidance/);
  assert.doesNotMatch(readme, /Atlas DS|real React component previews/);
});

test("the plugin retains navigation, thread panel, composer, and deep-link surfaces", () => {
  assert.match(app, /app\.slots\.navPanel\(\{/);
  assert.match(app, /app\.slots\.threadPanelAction\(\{/);
  assert.match(app, /app\.slots\.composerAccessory\(\{/);
  assert.match(app, /entrySubPath\(id\)/);
  assert.match(app, /entryIdFromSubPath\(subPath\)/);
  assert.match(app, /window\.history\.back\(\)/);
  assert.match(app, /snapshot=\{sourceBrowserFixture\}/);
});

test("the active browser uses sanctioned controls and source-native detail fields", () => {
  assert.match(gallery, /from "\.\/components\/ui\/button\.js"/);
  assert.match(gallery, /from "\.\/components\/ui\/card\.js"/);
  assert.match(gallery, /from "\.\/components\/ui\/input\.js"/);
  assert.match(gallery, /from "\.\/components\/ui\/select\.js"/);
  assert.match(gallery, /from "\.\/components\/ui\/dialog\.js"/);
  assert.match(gallery, /Licensed excerpt/);
  assert.match(gallery, /Native kind/);
  assert.match(gallery, /Freshness/);
  assert.match(gallery, /Canonical source links/);
  assert.doesNotMatch(gallery, /pattern-previews|atlas-ds|PatternVisual|entry\.details|seeAlsoIds/);
});
