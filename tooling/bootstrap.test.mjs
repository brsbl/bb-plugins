import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

import {
  HISTORY_PERSONALIZABLE,
  checkBootstrapPrompts,
  loadConfig,
  renderTemplate,
  renderVariant,
  validateAutomationInterface,
  validateCatalogPersonalization,
  variantsFromCatalog,
} from "./bootstrap/render-bootstrap.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..");
const iface = JSON.parse(readFileSync(resolve(here, "bootstrap/automation-interface.json"), "utf8"));

// A deep clone of the real catalog to mutate in negative tests.
function cloneCatalog() {
  return JSON.parse(readFileSync(resolve(repoRoot, "catalog/plugins.json"), "utf8"));
}

test("renderTemplate fills tokens and rejects missing ones", () => {
  assert.equal(renderTemplate("hi {{NAME}}", { NAME: "x" }), "hi x");
  assert.throws(() => renderTemplate("hi {{NAME}} {{GONE}}", { NAME: "x" }), /unfilled placeholders: GONE/);
});

test("validateAutomationInterface accepts the current interface", () => {
  assert.deepEqual(validateAutomationInterface("bb plugin run automations create --permission-mode full", iface), []);
  assert.deepEqual(validateAutomationInterface("bb plugin run automations create --permission-mode accept-edits", iface), []);
});

test("validateAutomationInterface catches stale modes and deprecated commands", () => {
  assert.match(
    validateAutomationInterface("bb plugin run automations create --permission-mode workspace-write", iface).join(),
    /legacy permission mode "workspace-write"/,
  );
  assert.match(
    validateAutomationInterface("bb plugin run automations create --permission-mode readonly", iface).join(),
    /legacy permission mode "readonly"/,
  );
  assert.match(
    validateAutomationInterface("bb plugin run automations create --permission-mode nope", iface).join(),
    /unknown permission mode "nope"/,
  );
  assert.match(
    validateAutomationInterface("bb automations create --permission-mode full", iface).join(),
    /deprecated command "bb automations create"/,
  );
  assert.match(
    validateAutomationInterface("bb plugin run automations create --provider x", iface).join(),
    /no --permission-mode/,
  );
});

test("committed bootstrap variants are in sync with the catalog + template (drift guard)", () => {
  assert.doesNotThrow(() => checkBootstrapPrompts(repoRoot));
});

test("variants derive from the canonical catalog inventory, no second list", () => {
  const { catalog } = loadConfig(repoRoot);
  const variants = variantsFromCatalog(catalog);
  assert.deepEqual(variants.map((v) => v.key).sort(), ["design-doctrine", "improve-prompt"]);
  // Every variant value traces to a catalog field.
  const dd = catalog.plugins.find((p) => p.slug === "design-doctrine");
  const variant = variants.find((v) => v.key === "design-doctrine");
  assert.equal(variant.values.PLUGIN_NAME, dd.name);
  assert.equal(variant.values.PACKAGE_NAME, dd.packageName);
  assert.equal(variant.values.PLUGIN_README, `${dd.source}/README.md`);
  assert.equal(variant.output, `${dd.source}/maintenance/bootstrap-prompt.md`);
});

test("personalization sits on exactly the history-personalizable plugins", () => {
  const { catalog } = loadConfig(repoRoot);
  assert.doesNotThrow(() => validateCatalogPersonalization(catalog));
  const carrying = catalog.plugins.filter((p) => p.personalization).map((p) => p.pluginId).sort();
  assert.deepEqual(carrying, [...HISTORY_PERSONALIZABLE].sort());
});

test("a non-history plugin carrying personalization is rejected", () => {
  const catalog = cloneCatalog();
  const omega = catalog.plugins.find((p) => p.pluginId === "omega");
  omega.personalization = {
    artifact: "x", artifactTree: "x", maintenanceDoc: "x", adaptInstruction: "x", automationName: "x",
  };
  assert.throws(() => validateCatalogPersonalization(catalog), /omegacode carries personalization but is not history-personalizable/);
});

test("a missing history plugin's personalization is rejected", () => {
  const catalog = cloneCatalog();
  delete catalog.plugins.find((p) => p.pluginId === "prompt-shaper").personalization;
  assert.throws(() => validateCatalogPersonalization(catalog), /must be on exactly/);
});

test("an incomplete personalization block is rejected", () => {
  const catalog = cloneCatalog();
  delete catalog.plugins.find((p) => p.pluginId === "design-doctrine").personalization.artifact;
  assert.throws(() => validateCatalogPersonalization(catalog), /missing "artifact"/);
});

test("each rendered prompt instructs all required bootstrap steps", () => {
  const { template, catalog } = loadConfig(repoRoot);
  for (const variant of variantsFromCatalog(catalog)) {
    const text = renderVariant(template, variant, iface);
    // 1 fork, 2 seed evidence, 3 adapt plugin + skill, 4 install/test, 5 ongoing automation,
    // 6 checkpoint/concurrency/dirty/report, 7 current commands+modes, 8 reference repo docs.
    assert.match(text, /Fork and clone brsbl\/bb-plugins/, `${variant.key}: fork`);
    assert.match(text, /tooling\/bb-history\.mjs scan/, `${variant.key}: seed evidence`);
    assert.match(text, /Adapt the plugin and its companion skill/, `${variant.key}: adapt`);
    assert.match(text, /npm run check --workspace=/, `${variant.key}: install/test`);
    assert.match(text, /bb plugin run automations create/, `${variant.key}: ongoing automation`);
    assert.match(text, /saved cursor|lease|uncommitted work|advance the cursor only after/, `${variant.key}: checkpoint safety`);
    assert.match(text, /--permission-mode full/, `${variant.key}: current permission mode`);
    assert.match(text, /tooling\/README\.md, and docs\/provenance\.md/, `${variant.key}: reference docs`);
    assert.doesNotMatch(text, /\{\{[A-Z0-9_]+\}\}/, `${variant.key}: no leftover tokens`);
  }
});
