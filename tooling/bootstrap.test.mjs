import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

import {
  checkBootstrapPrompts,
  loadConfig,
  renderTemplate,
  renderVariant,
  validateAutomationInterface,
} from "./bootstrap/render-bootstrap.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..");
const iface = JSON.parse(readFileSync(resolve(here, "bootstrap/automation-interface.json"), "utf8"));

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

test("committed bootstrap variants are in sync with the template (drift guard)", () => {
  assert.doesNotThrow(() => checkBootstrapPrompts(repoRoot));
});

test("exactly the evidence-justified variants exist", () => {
  const { variants } = loadConfig();
  assert.deepEqual(
    variants.variants.map((v) => v.key).sort(),
    ["design-doctrine", "improve-prompt"],
  );
});

test("each rendered prompt instructs all required bootstrap steps", () => {
  const { template, variants } = loadConfig();
  for (const variant of variants.variants) {
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
