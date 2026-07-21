#!/usr/bin/env node
// Render the one canonical bootstrap-prompt template into per-plugin variants,
// deriving each variant from catalog/plugins.json — the single canonical
// inventory — so there is no second plugin list. Only the plugins genuinely
// personalizable from thread history carry a `personalization` block; this
// validates that exactly those plugins carry it, that each block is complete,
// and that the generated prompt uses current bb automation commands and
// permission modes. Copied variants cannot silently drift: hygiene compares the
// committed file against a fresh render.
//
//   node tooling/bootstrap/render-bootstrap.mjs          check (default): validate + assert committed == rendered
//   node tooling/bootstrap/render-bootstrap.mjs --write  regenerate every variant file
//
// Validation is text-only: it never runs `bb automation ...`, so it cannot
// create or mutate a live automation.

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..", "..");
const templatePath = resolve(here, "bootstrap-prompt.template.md");
const interfacePath = resolve(here, "automation-interface.json");

// The only plugins whose catalog entry may carry personalization metadata,
// identified by stable plugin id. This is the non-inventory constant that
// pins "exactly Design Doctrine + Improve Prompt".
export const HISTORY_PERSONALIZABLE = ["design-doctrine", "prompt-shaper"];
const PERSONALIZATION_FIELDS = ["artifact", "artifactTree", "artifactPath", "maintenanceDoc", "statePath", "adaptInstruction", "automationName"];

const TOKEN = /\{\{([A-Z0-9_]+)\}\}/g;

export function renderTemplate(template, values) {
  const missing = new Set();
  const rendered = template.replace(TOKEN, (_, key) => {
    if (!Object.hasOwn(values, key)) {
      missing.add(key);
      return `{{${key}}}`;
    }
    return String(values[key]);
  });
  if (missing.size) {
    throw new Error(`template has unfilled placeholders: ${[...missing].join(", ")}`);
  }
  return rendered;
}

// Deterministic check that a rendered prompt uses the current automation
// interface and no legacy/deprecated command or permission mode.
export function validateAutomationInterface(text, iface) {
  const problems = [];
  if (!text.includes(iface.command.createForm)) {
    problems.push(`missing canonical command "${iface.command.createForm}"`);
  }
  if (!text.includes(iface.command.helpForm)) {
    problems.push(`missing working help form "${iface.command.helpForm}"`);
  }
  for (const form of iface.command.brokenHelpForms ?? []) {
    if (text.includes(form)) problems.push(`uses non-working help form "${form}"`);
  }
  for (const form of iface.command.deprecatedForms) {
    if (text.includes(form)) problems.push(`uses deprecated command "${form}"`);
  }
  const modeMatches = [...text.matchAll(/--permission-mode\s+([a-z-]+)/g)].map((m) => m[1]);
  if (modeMatches.length === 0) {
    problems.push("no --permission-mode is specified");
  }
  for (const mode of modeMatches) {
    if (iface.permissionModes.legacy.includes(mode)) {
      problems.push(`uses legacy permission mode "${mode}" (folded into accept-edits)`);
    } else if (!iface.permissionModes.current.includes(mode)) {
      problems.push(`uses unknown permission mode "${mode}"`);
    }
  }
  return problems;
}

// Assert the canonical inventory carries personalization on exactly the
// history-personalizable plugins, and that each block is complete.
export function validateCatalogPersonalization(catalog) {
  const carrying = catalog.plugins.filter((entry) => entry.personalization != null);
  for (const entry of carrying) {
    if (!HISTORY_PERSONALIZABLE.includes(entry.pluginId)) {
      throw new Error(
        `catalog: ${entry.slug} carries personalization but is not history-personalizable (allowed: ${HISTORY_PERSONALIZABLE.join(", ")})`,
      );
    }
    for (const field of PERSONALIZATION_FIELDS) {
      const value = entry.personalization[field];
      if (typeof value !== "string" || value.length === 0) {
        throw new Error(`catalog: ${entry.slug} personalization is missing "${field}"`);
      }
    }
  }
  const present = carrying.map((entry) => entry.pluginId).sort();
  const expected = [...HISTORY_PERSONALIZABLE].sort();
  if (JSON.stringify(present) !== JSON.stringify(expected)) {
    throw new Error(
      `catalog: personalization must be on exactly [${expected.join(", ")}], found [${present.join(", ")}]`,
    );
  }
}

// Build one render job per history-personalizable catalog entry. Every value is
// derived from the canonical inventory; nothing lives in a second plugin list.
export function variantsFromCatalog(catalog) {
  return catalog.plugins
    .filter((entry) => entry.personalization != null)
    .map((entry) => ({
      key: entry.slug,
      output: `${entry.source}/maintenance/bootstrap-prompt.md`,
      values: {
        VARIANT_KEY: entry.slug,
        PLUGIN_NAME: entry.name,
        PLUGIN_ID: entry.pluginId,
        PACKAGE_NAME: entry.packageName,
        PLUGIN_SOURCE: entry.source,
        PLUGIN_README: `${entry.source}/README.md`,
        ARTIFACT: entry.personalization.artifact,
        ARTIFACT_TREE: entry.personalization.artifactTree,
        ARTIFACT_PATH: entry.personalization.artifactPath,
        MAINTENANCE_DOC: entry.personalization.maintenanceDoc,
        STATE_PATH: entry.personalization.statePath,
        ADAPT_INSTRUCTION: entry.personalization.adaptInstruction,
        AUTOMATION_NAME: entry.personalization.automationName,
      },
    }));
}

export function loadConfig(root = repoRoot) {
  const template = readFileSync(templatePath, "utf8");
  const catalog = JSON.parse(readFileSync(resolve(root, "catalog/plugins.json"), "utf8"));
  const iface = JSON.parse(readFileSync(interfacePath, "utf8"));
  return { template, catalog, iface };
}

export function renderVariant(template, variant, iface) {
  const rendered = renderTemplate(template, variant.values);
  const problems = validateAutomationInterface(rendered, iface);
  if (problems.length) {
    throw new Error(`variant ${variant.key}: ${problems.join("; ")}`);
  }
  return rendered;
}

// Validate the catalog and assert every committed variant matches a fresh
// render. Throws on the first problem; returns the variant count otherwise.
export function checkBootstrapPrompts(root = repoRoot) {
  const { template, catalog, iface } = loadConfig(root);
  validateCatalogPersonalization(catalog);
  const variants = variantsFromCatalog(catalog);
  for (const variant of variants) {
    const rendered = renderVariant(template, variant, iface);
    const outputPath = resolve(root, variant.output);
    let committed;
    try {
      committed = readFileSync(outputPath, "utf8");
    } catch (error) {
      if (error.code === "ENOENT") {
        throw new Error(`${variant.output} is missing; run: node tooling/bootstrap/render-bootstrap.mjs --write`);
      }
      throw error;
    }
    if (committed !== rendered) {
      throw new Error(`${variant.output} has drifted from the template; run: node tooling/bootstrap/render-bootstrap.mjs --write`);
    }
  }
  return { variantCount: variants.length };
}

function writeAll(root = repoRoot) {
  const { template, catalog, iface } = loadConfig(root);
  validateCatalogPersonalization(catalog);
  for (const variant of variantsFromCatalog(catalog)) {
    const rendered = renderVariant(template, variant, iface);
    writeFileSync(resolve(root, variant.output), rendered);
    process.stdout.write(`wrote ${variant.output}\n`);
  }
}

if (resolve(process.argv[1] ?? "") === fileURLToPath(import.meta.url)) {
  try {
    if (process.argv.includes("--write")) {
      writeAll();
    } else {
      const { variantCount } = checkBootstrapPrompts();
      process.stdout.write(`bootstrap prompts in sync for ${variantCount} variants\n`);
    }
  } catch (error) {
    process.stderr.write(`render-bootstrap: ${error.message}\n`);
    process.exit(1);
  }
}
