#!/usr/bin/env node
// Render the one canonical bootstrap-prompt template into per-plugin variants,
// and validate that each generated variant uses current bb automation commands
// and permission modes. Copied variants cannot silently drift: hygiene compares
// the committed file against a fresh render, and this validator rejects stale
// commands or modes.
//
//   node tooling/bootstrap/render-bootstrap.mjs          check (default): assert committed == rendered and interface is current
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
const variantsPath = resolve(here, "variants.json");
const interfacePath = resolve(here, "automation-interface.json");

const TOKEN = /\{\{([A-Z0-9_]+)\}\}/g;

export function renderTemplate(template, values, extra = {}) {
  const all = { ...values, ...extra };
  const missing = new Set();
  const rendered = template.replace(TOKEN, (_, key) => {
    if (!Object.hasOwn(all, key)) {
      missing.add(key);
      return `{{${key}}}`;
    }
    return String(all[key]);
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

export function loadConfig() {
  const template = readFileSync(templatePath, "utf8");
  const variants = JSON.parse(readFileSync(variantsPath, "utf8"));
  const iface = JSON.parse(readFileSync(interfacePath, "utf8"));
  return { template, variants, iface };
}

export function renderVariant(template, variant, iface) {
  const rendered = renderTemplate(template, variant.values, { VARIANT_KEY: variant.key });
  const problems = validateAutomationInterface(rendered, iface);
  if (problems.length) {
    throw new Error(`variant ${variant.key}: ${problems.join("; ")}`);
  }
  return rendered;
}

// Assert every committed variant matches a fresh render and passes validation.
// Throws on the first drift; returns the variant count otherwise.
export function checkBootstrapPrompts(root = repoRoot) {
  const { template, variants, iface } = loadConfig();
  for (const variant of variants.variants) {
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
  return { variantCount: variants.variants.length };
}

function writeAll(root = repoRoot) {
  const { template, variants, iface } = loadConfig();
  for (const variant of variants.variants) {
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
