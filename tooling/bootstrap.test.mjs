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

// A snippet that exercises the whole current interface (create form + working
// help form + valid mode), the way a real generated prompt does.
const GOOD =
  'bb plugin run automations create --permission-mode full ... bb plugin run automations help --project <id>';

function cloneCatalog() {
  return JSON.parse(readFileSync(resolve(repoRoot, "catalog/plugins.json"), "utf8"));
}

test("renderTemplate fills tokens and rejects missing ones", () => {
  assert.equal(renderTemplate("hi {{NAME}}", { NAME: "x" }), "hi x");
  assert.throws(() => renderTemplate("hi {{NAME}} {{GONE}}", { NAME: "x" }), /unfilled placeholders: GONE/);
});

test("validateAutomationInterface accepts the current interface", () => {
  assert.deepEqual(validateAutomationInterface(GOOD, iface), []);
  assert.deepEqual(
    validateAutomationInterface(GOOD.replace("--permission-mode full", "--permission-mode accept-edits"), iface),
    [],
  );
});

test("validateAutomationInterface catches stale modes and deprecated commands", () => {
  assert.match(
    validateAutomationInterface(GOOD.replace("full", "workspace-write"), iface).join(),
    /legacy permission mode "workspace-write"/,
  );
  assert.match(
    validateAutomationInterface(GOOD.replace("full", "readonly"), iface).join(),
    /legacy permission mode "readonly"/,
  );
  assert.match(
    validateAutomationInterface(GOOD.replace("full", "nope"), iface).join(),
    /unknown permission mode "nope"/,
  );
  assert.match(
    validateAutomationInterface(`bb automations create --permission-mode full ${iface.command.helpForm}`, iface).join(),
    /deprecated command "bb automations create"/,
  );
  assert.match(
    validateAutomationInterface(`${iface.command.createForm} --provider x ${iface.command.helpForm}`, iface).join(),
    /no --permission-mode/,
  );
});

test("validateAutomationInterface requires the working help form and rejects the broken one", () => {
  // Missing the working `help --project` form.
  assert.match(
    validateAutomationInterface("bb plugin run automations create --permission-mode full", iface).join(),
    /missing working help form "bb plugin run automations help --project"/,
  );
  // Uses the 0.0.32-broken `create --help` form.
  assert.match(
    validateAutomationInterface(`${GOOD} bb plugin run automations create --help`, iface).join(),
    /non-working help form "bb plugin run automations create --help"/,
  );
});

test("committed bootstrap variants are in sync with the catalog + template (drift guard)", () => {
  assert.doesNotThrow(() => checkBootstrapPrompts(repoRoot));
});

test("the seed evidence file each prompt writes is gitignored", () => {
  const { template, catalog } = loadConfig(repoRoot);
  const ignored = new Set(
    readFileSync(resolve(repoRoot, ".gitignore"), "utf8")
      .split("\n")
      .map((line) => line.trim()),
  );
  for (const variant of variantsFromCatalog(catalog)) {
    const text = renderVariant(template, variant, iface);
    const match = text.match(/>\s*(seed-evidence\.\S+)/);
    assert.ok(match, `${variant.key}: seed writes an evidence file`);
    assert.ok(ignored.has(match[1]), `${variant.key}: ${match[1]} must be listed in .gitignore`);
  }
});

test("variants derive from the canonical catalog inventory, no second list", () => {
  const { catalog } = loadConfig(repoRoot);
  const variants = variantsFromCatalog(catalog);
  assert.deepEqual(variants.map((v) => v.key).sort(), ["design-doctrine", "improve-prompt"]);
  const dd = catalog.plugins.find((p) => p.slug === "design-doctrine");
  const variant = variants.find((v) => v.key === "design-doctrine");
  assert.equal(variant.values.PLUGIN_NAME, dd.name);
  assert.equal(variant.values.STATE_PATH, dd.personalization.statePath);
  assert.equal(variant.values.ARTIFACT_PATH, dd.personalization.artifactPath);
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
    artifact: "x", artifactTree: "x", artifactPath: "x", maintenanceDoc: "x", statePath: "x", adaptInstruction: "x", automationName: "x",
  };
  assert.throws(() => validateCatalogPersonalization(catalog), /omegacode carries personalization but is not history-personalizable/);
});

test("a missing history plugin's personalization is rejected", () => {
  const catalog = cloneCatalog();
  delete catalog.plugins.find((p) => p.pluginId === "prompt-shaper").personalization;
  assert.throws(() => validateCatalogPersonalization(catalog), /must be on exactly/);
});

test("an incomplete personalization block is rejected (statePath required)", () => {
  const catalog = cloneCatalog();
  delete catalog.plugins.find((p) => p.pluginId === "design-doctrine").personalization.statePath;
  assert.throws(() => validateCatalogPersonalization(catalog), /missing "statePath"/);
});

test("each rendered prompt instructs all required bootstrap steps and workflow fixes", () => {
  const { template, catalog } = loadConfig(repoRoot);
  for (const variant of variantsFromCatalog(catalog)) {
    const text = renderVariant(template, variant, iface);
    const p = catalog.plugins.find((x) => x.slug === variant.key).personalization;
    // 1 fork, 2 seed via the maintenance checkpoint, 3 adapt, 4 install/test,
    // 5 initial commit+advance/release, 6 ongoing automation, 7 safety, 8 reference.
    assert.match(text, /Fork and clone brsbl\/bb-plugins/, `${variant.key}: fork`);
    assert.match(text, /Adapt the plugin and its companion skill/, `${variant.key}: adapt`);
    assert.match(text, /npm run check --workspace=/, `${variant.key}: install/test`);
    assert.match(text, /tooling\/README\.md, and docs\/provenance\.md/, `${variant.key}: reference docs`);
    assert.doesNotMatch(text, /\{\{[A-Z0-9_]+\}\}/, `${variant.key}: no leftover tokens`);

    // 1) Persistent --environment on the automation.
    assert.match(text, /--environment "\$PWD"/, `${variant.key}: persistent environment`);

    // 2) Seed uses the exact maintenance checkpoint, not a root scratch file.
    assert.match(
      text,
      new RegExp(`bb-history\\.mjs scan --state ${p.statePath.replace(/[.]/g, "\\.")}`),
      `${variant.key}: seed uses maintenance checkpoint`,
    );
    assert.doesNotMatch(text, /\.bb-evidence-state\.json/, `${variant.key}: no root scratch checkpoint`);

    // 3) Stage (new untracked files) + commit the plugin-owned artifact, then advance/release.
    assert.match(text, new RegExp(`git add -- ${p.artifactPath.replace(/[/]/g, "\\/")}`), `${variant.key}: git add artifact before commit`);
    assert.match(text, new RegExp(`git commit --only[^\\n]*-- ${p.artifactPath.replace(/[/]/g, "\\/")}`), `${variant.key}: initial artifact commit`);
    assert.match(text, /bb-history\.mjs advance --state /, `${variant.key}: advance seed cursor`);
    assert.match(text, /bb-history\.mjs release --state /, `${variant.key}: release on failure`);
    assert.match(text, /null lease_id/, `${variant.key}: null-lease caught-up rule`);
    assert.match(text, /verified no-change batch[^]*skip the add and commit but still advance/, `${variant.key}: no-change skips commit but advances`);

    // 5/7) Current commands + working help form, no broken help form or legacy mode.
    assert.match(text, /--permission-mode full/, `${variant.key}: current permission mode`);
    assert.match(text, /bb plugin run automations help --project/, `${variant.key}: working help form`);
    assert.doesNotMatch(text, /bb plugin run automations create --help/, `${variant.key}: no broken help form`);
  }
});
