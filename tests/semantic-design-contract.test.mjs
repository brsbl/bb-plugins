import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import test, { after } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { build } from "esbuild";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import atlasRegistry from "../generated/atlas-registry.v2.json" with {
  type: "json",
};

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const temporaryDirectory = await mkdtemp(
  resolve(packageRoot, ".semantic-design-contract-test-"),
);
const outputFile = resolve(temporaryDirectory, "pattern-previews.mjs");

await build({
  entryPoints: [resolve(packageRoot, "pattern-previews.tsx")],
  outfile: outputFile,
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  packages: "external",
  jsx: "automatic",
  logLevel: "silent",
});

const previewModule = await import(
  `${pathToFileURL(outputFile).href}?semantic-audit=${Date.now()}`
);
const {
  PatternPreview,
  patternPreviewIds,
  patternPreviewRegistry,
} = previewModule;
const previewSource = await readFile(
  resolve(packageRoot, "pattern-previews.tsx"),
  "utf8",
);
const overlaySource = await readFile(
  resolve(packageRoot, "atlas-ds/overlays.tsx"),
  "utf8",
);

after(async () => {
  await rm(temporaryDirectory, { recursive: true, force: true });
});

function render(entryId, props = {}) {
  return renderToStaticMarkup(
    React.createElement(PatternPreview, { entryId, ...props }),
  );
}

function tryRender(entryId, props = {}) {
  try {
    return { markup: render(entryId, props), error: null };
  } catch (error) {
    return {
      markup: "",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function failById(message, failures) {
  assert.deepEqual(
    failures,
    [],
    `${message}\n${failures.map(({ entryId, reason }) => `- ${entryId}: ${reason}`).join("\n")}`,
  );
}

function stripTags(markup) {
  return markup
    .replaceAll(/<svg\b[\s\S]*?<\/svg>/gi, "")
    .replaceAll(/<[^>]*>/g, " ")
    .replaceAll(/&(?:nbsp|#160);/gi, " ")
    .replaceAll(/&(?:amp|lt|gt|quot|#x27|#39);/gi, "x")
    .replaceAll(/\s+/g, " ")
    .trim();
}

function attribute(openTag, name) {
  return openTag.match(
    new RegExp(`\\s${name}=(?:"([^"]*)"|'([^']*)')`, "i"),
  )?.slice(1).find((value) => value !== undefined);
}

function interactiveFragments(markup) {
  const paired = [
    ...markup.matchAll(
      /<(button|a|select|textarea)\b([^>]*)>([\s\S]*?)<\/\1>/gi,
    ),
  ].map((match) => ({
    tag: match[1].toLowerCase(),
    openTag: `<${match[1]}${match[2]}>`,
    content: match[3],
  }));
  const inputs = [...markup.matchAll(/<input\b[^>]*>/gi)].map((match) => ({
    tag: "input",
    openTag: match[0],
    content: "",
  }));
  const ariaControls = [
    ...markup.matchAll(
      /<([a-z][\w-]*)\b([^>]*\srole="(?:button|checkbox|combobox|link|menuitem|option|radio|slider|switch|tab|treeitem)"[^>]*)>([\s\S]*?)<\/\1>/gi,
    ),
  ].map((match) => ({
    tag: match[1].toLowerCase(),
    openTag: `<${match[1]}${match[2]}>`,
    content: match[3],
  }));
  return [...paired, ...inputs, ...ariaControls];
}

function labelMaps(markup) {
  const byFor = new Map();
  for (const match of markup.matchAll(
    /<label\b([^>]*)>([\s\S]*?)<\/label>/gi,
  )) {
    const htmlFor = attribute(`<label${match[1]}>`, "for");
    if (htmlFor) byFor.set(htmlFor, stripTags(match[2]));
  }
  const byId = new Map();
  for (const match of markup.matchAll(
    /<([a-z][\w-]*)\b([^>]*\sid="[^"]+"[^>]*)>([\s\S]*?)<\/\1>/gi,
  )) {
    const id = attribute(`<${match[1]}${match[2]}>`, "id");
    if (id) byId.set(id, stripTags(match[3]));
  }
  return { byFor, byId };
}

function accessibleName(fragment, markup) {
  const { openTag, content } = fragment;
  const ariaLabel = attribute(openTag, "aria-label");
  if (ariaLabel?.trim()) return ariaLabel.trim();
  const title = attribute(openTag, "title");
  if (title?.trim()) return title.trim();
  const { byFor, byId } = labelMaps(markup);
  const labelledBy = attribute(openTag, "aria-labelledby");
  if (labelledBy) {
    const name = labelledBy
      .split(/\s+/)
      .map((id) => byId.get(id) ?? "")
      .join(" ")
      .trim();
    if (name) return name;
  }
  const id = attribute(openTag, "id");
  if (id && byFor.get(id)?.trim()) return byFor.get(id).trim();
  for (const match of markup.matchAll(
    /<label\b[^>]*>([\s\S]*?)<\/label>/gi,
  )) {
    if (match[1].includes(openTag)) {
      const wrappedName = stripTags(match[1]);
      if (wrappedName) return wrappedName;
    }
  }
  const text = stripTags(content);
  if (text) return text;
  const inputType = attribute(openTag, "type")?.toLowerCase();
  const inputValue = attribute(openTag, "value");
  if (["button", "reset", "submit"].includes(inputType) && inputValue?.trim()) {
    return inputValue.trim();
  }
  return "";
}

function elementCount(markup) {
  return [...markup.matchAll(/<(?!\/|!)[a-z][\w-]*(?:\s|>)/gi)].length;
}

function semanticSignature(markup) {
  return [...markup.matchAll(/<([a-z][\w-]*)\b([^>]*)>/gi)]
    .map((match) => {
      const openTag = match[0];
      const tag = match[1].toLowerCase();
      const classes = (attribute(openTag, "class") ?? "")
        .split(/\s+/)
        .filter((className) =>
          /^(?:atlas-(?:button|icon-button|input|select|textarea|checkbox|switch|table|tree|tabs|tab-bar|navigation|side-navigation|preview-stage|dialog|popover|alert|toast|progress|loading|skeleton|step|collection|agent|approval|empty-state)|atlas-field)/.test(
            className,
          ),
        )
        .sort()
        .join(".");
      return [
        tag,
        attribute(openTag, "role") ?? "",
        attribute(openTag, "type") ?? "",
        attribute(openTag, "aria-modal") ?? "",
        attribute(openTag, "aria-multiselectable") ?? "",
        attribute(openTag, "aria-pressed") === undefined ? "" : "pressed",
        attribute(openTag, "aria-selected") === undefined ? "" : "selected",
        classes,
      ].join(":");
    })
    .join("|");
}

const semanticExpectations = {
  button: [/<button\b/i],
  "toggle-button": [/<button\b[^>]*aria-pressed=/i],
  link: [/<a\b[^>]*href=/i],
  "button-group": [/role="group"/i, /<button\b/i],
  toolbar: [/role="toolbar"/i, /<button\b/i],
  "command-palette": [/<StageDialog\b/],
  "text-field": [/<input\b[^>]*type="text"/i],
  "text-area": [/<textarea\b/i],
  checkbox: [/<input\b[^>]*type="checkbox"/i],
  "radio-group": [/<fieldset\b/i, /<input\b[^>]*type="radio"/i],
  switch: [/role="switch"/i],
  select: [/<select\b/i],
  combobox: [/role="combobox"/i, /aria-controls=/i, /aria-expanded=/i],
  listbox: [/<select\b[^>]*size="[2-9]\d*"/i, /<option\b/i],
  "segmented-control": [/role="group"/i, /aria-pressed=/i],
  slider: [/<input\b[^>]*type="range"/i],
  "date-picker": [/<input\b[^>]*type="date"/i],
  "file-upload": [/<input\b[^>]*type="file"/i],
  "search-field": [/<input\b[^>]*type="search"/i],
  "navigation-bar": [/<nav\b/i],
  "side-navigation": [/<nav\b/i],
  "navigation-rail": [/<nav\b/i],
  breadcrumb: [/<nav\b/i],
  tabs: [/role="tablist"/i, /role="tab"/i, /role="tabpanel"/i],
  "tab-bar": [/<nav\b/i],
  pagination: [/<nav\b/i],
  stepper: [/<ol\b/i, /aria-current="step"/i],
  chip: [/<button\b/i],
  "data-grid": [/<table\b/i, /<input\b[^>]*type="checkbox"/i],
  "tree-view": [/role="tree"/i, /role="treeitem"/i],
  dialog: [/<StageDialog\b/],
  "alert-dialog": [/<StageDialog\b/],
  popover: [/<StagePopover\b/],
  tooltip: [/role="tooltip"/i],
  menu: [/role="menu"/i, /role="menuitem"/i],
  drawer: [/<StageDialog\b/],
  sheet: [/<StageDialog\b/],
  accordion: [/<details\b/i, /<summary\b/i],
  disclosure: [/<details\b/i, /<summary\b/i],
  form: [/<form\b/i],
  "form-validation": [/<form\b/i, /aria-invalid="true"/i],
  "search-and-filtering": [/<input\b[^>]*type="search"/i],
  "multi-step-flow": [/<ol\b/i, /aria-current="step"/i],
  "bulk-selection-and-actions": [/<input\b[^>]*type="checkbox"/i],
  "ai-composer": [/<textarea\b/i, /<button\b/i],
  "prompt-suggestions": [/<button\b/i],
  "ai-feature-entry": [/<button\b/i],
  "response-regeneration": [/<button\b/i],
  "follow-up-question": [/<button\b/i],
  "action-approval": [/<button\b/i],
  "ai-feedback": [/<button\b/i],
  "workspace-switcher": [/<StagePopover\b/],
  "onboarding-checklist": [/<input\b[^>]*type="checkbox"/i],
  "inline-editing": [/<input\b/i, /<button\b/i],
  "approval-workflow": [/<ol\b/i, /aria-current="step"/i],
  "permission-matrix": [/role="switch"/i],
  "rule-builder": [/<select\b/i],
  "import-workflow": [/<ol\b/i, /<progress\b/i, /<table\b/i, /<button\b/i],
};

const overlayContracts = {
  "command-palette": [/<StageDialog\b/, /entryId === "command-palette"/],
  dialog: [/<StageDialog\b/, /variant=[\s\S]*?"dialog"/],
  "alert-dialog": [/<StageDialog\b/, /dismissible=\{context\.entryId !== "alert-dialog"\}/],
  popover: [/<StagePopover\b/],
  tooltip: [/role="tooltip"/],
  menu: [/role="menu"/, /role="menuitem"/],
  drawer: [/<StageDialog\b/, /context\.entryId === "drawer"[\s\S]*?\? "drawer"/],
  sheet: [/<StageDialog\b/, /context\.entryId === "sheet"[\s\S]*?\? "sheet"/],
  "workspace-switcher": [/<StagePopover\b/],
};

const ambiguousNeighbors = [
  ["button", "link"],
  ["button", "toggle-button"],
  ["toggle-button", "switch"],
  ["checkbox", "switch"],
  ["select", "combobox"],
  ["combobox", "listbox"],
  ["menu", "listbox"],
  ["tabs", "tab-bar"],
  ["navigation-bar", "navigation-rail"],
  ["navigation-rail", "side-navigation"],
  ["breadcrumb", "pagination"],
  ["stepper", "multi-step-flow"],
  ["tag", "chip"],
  ["badge", "tag"],
  ["table", "data-grid"],
  ["accordion", "disclosure"],
  ["alert", "banner"],
  ["alert", "toast"],
  ["spinner", "progress-indicator"],
  ["skeleton", "loading-state"],
  ["search-field", "search-and-filtering"],
  ["agent-activity", "action-approval"],
  ["notifications", "notification-center"],
  ["panel", "split-view"],
];

test("all preview IDs and metadata remain in exact registry parity", () => {
  const registryIds = atlasRegistry.entries.map(({ catalog }) => catalog.id);
  assert.equal(registryIds.length, 107);
  assert.equal(new Set(registryIds).size, 107);
  assert.deepEqual([...patternPreviewIds], registryIds);
  assert.deepEqual(
    patternPreviewRegistry.map(({ entryId }) => entryId),
    registryIds,
  );

  const failures = [];
  for (const entry of atlasRegistry.entries) {
    const preview = patternPreviewRegistry.find(
      ({ entryId }) => entryId === entry.catalog.id,
    );
    if (!preview) {
      failures.push({ entryId: entry.catalog.id, reason: "missing preview registry record" });
      continue;
    }
    if (preview.title !== entry.catalog.name) {
      failures.push({ entryId: entry.catalog.id, reason: "preview title differs from canonical name" });
    }
    if (preview.description !== entry.catalog.description) {
      failures.push({ entryId: entry.catalog.id, reason: "preview description differs from catalog" });
    }
    if (preview.template !== entry.anatomy.template) {
      failures.push({ entryId: entry.catalog.id, reason: "preview template differs from anatomy" });
    }
  }
  failById("Registry parity failures", failures);
});

test("all 107 compositions are deterministic, substantive, and asset-safe", () => {
  const failures = [];
  for (const entryId of patternPreviewIds) {
    const registryEntry = atlasRegistry.entries.find(
      ({ catalog }) => catalog.id === entryId,
    );
    for (const fixtureState of registryEntry?.story.fixture.states ?? []) {
      for (const mode of ["inert", "interactive"]) {
        const fixtureProps = {
          mode,
          phase: fixtureState.phase,
          state: fixtureState.id,
        };
        const firstFixture = tryRender(entryId, fixtureProps);
        const secondFixture = tryRender(entryId, fixtureProps);
        if (firstFixture.error || secondFixture.error) {
          failures.push({
            entryId,
            reason: `${mode}/${fixtureState.id} render failed: ${firstFixture.error ?? secondFixture.error}`,
          });
        } else if (firstFixture.markup !== secondFixture.markup) {
          failures.push({
            entryId,
            reason: `${mode}/${fixtureState.id} fixture rendered nondeterministically`,
          });
        }
      }
    }
    const props = { mode: "inert", phase: 1, state: "active" };
    const firstResult = tryRender(entryId, props);
    const secondResult = tryRender(entryId, props);
    if (firstResult.error || secondResult.error) {
      failures.push({
        entryId,
        reason: `render failed: ${firstResult.error ?? secondResult.error}`,
      });
      continue;
    }
    const first = firstResult.markup;
    const second = secondResult.markup;
    if (first !== second) {
      failures.push({ entryId, reason: "same fixture rendered nondeterministically" });
    }
    const count = elementCount(first);
    const minimumElements = first.includes("atlas-application-frame") ? 18 : 16;
    if (count < minimumElements) {
      failures.push({
        entryId,
        reason: `composition is sparse (${count} elements; minimum ${minimumElements})`,
      });
    }
    const words = stripTags(first).split(/\s+/).filter(Boolean).length;
    if (words < 6) {
      failures.push({ entryId, reason: `composition lacks content context (${words} words; minimum 6)` });
    }
    if (/<img\b|<canvas\b/i.test(first)) {
      failures.push({ entryId, reason: "uses a bitmap/canvas asset instead of DS composition" });
    }
    for (const svg of first.match(/<svg\b[^>]*>/gi) ?? []) {
      if (!/data-icon=/.test(svg)) {
        failures.push({ entryId, reason: "renders SVG outside AtlasIcon" });
      }
    }
    for (const fragment of interactiveFragments(first)) {
      const name = accessibleName(fragment, first);
      const visibleText = stripTags(fragment.content);
      if (/\p{Extended_Pictographic}|\p{Symbol}/u.test(name) ||
          /\p{Extended_Pictographic}|\p{Symbol}/u.test(visibleText)) {
        failures.push({
          entryId,
          reason: `interactive control uses a Unicode glyph (${JSON.stringify(visibleText || name)})`,
        });
      }
    }
    for (const match of first.matchAll(
      /<([a-z][\w-]*)\b([^>]*(?:aria-hidden="true"|class="[^"]*icon[^"]*")[^>]*)>([\s\S]*?)<\/\1>/gi,
    )) {
      const assetText = stripTags(match[3]);
      if (/\p{Extended_Pictographic}|\p{Symbol}/u.test(assetText)) {
        failures.push({
          entryId,
          reason: `decorative asset uses a Unicode glyph (${JSON.stringify(assetText)})`,
        });
      }
    }
  }
  failById("Composition quality failures", failures);
});

test("interactive compositions expose their defining native or ARIA semantics", () => {
  const failures = [];
  for (const [entryId, expectations] of Object.entries(semanticExpectations)) {
    const result = tryRender(entryId, {
      mode: "interactive",
      phase: 1,
      state: "active",
    });
    if (result.error) {
      failures.push({ entryId, reason: `render failed: ${result.error}` });
      continue;
    }
    const markup = result.markup;
    for (const expectation of expectations) {
      const target = expectation.source.includes("Stage") ||
          ["tooltip", "menu"].includes(entryId)
        ? previewSource
        : markup;
      if (!expectation.test(target)) {
        failures.push({ entryId, reason: `missing semantic contract ${expectation}` });
      }
    }
  }
  failById("Interactive semantic failures", failures);
});

test("every rendered control has an accessible name", () => {
  const failures = [];
  for (const entryId of patternPreviewIds) {
    const result = tryRender(entryId, {
      mode: "interactive",
      phase: 1,
      state: "active",
    });
    if (result.error) {
      failures.push({ entryId, reason: `render failed: ${result.error}` });
      continue;
    }
    const markup = result.markup;
    for (const fragment of interactiveFragments(markup)) {
      if (!accessibleName(fragment, markup)) {
        failures.push({
          entryId,
          reason: `unnamed <${fragment.tag}> control: ${fragment.openTag.slice(0, 160)}`,
        });
      }
    }
  }
  failById("Accessible-name failures", failures);
});

test("overlay entries use stage-local Atlas DS semantics", () => {
  const failures = [];
  for (const [entryId, expectations] of Object.entries(overlayContracts)) {
    const markup = render(entryId, { mode: "inert", state: "active" });
    if (!/atlas-preview-stage/.test(markup) || !/data-atlas-stage-portals/.test(markup)) {
      failures.push({ entryId, reason: "missing PreviewStage and its local portal root" });
    }
    for (const expectation of expectations) {
      if (!expectation.test(previewSource)) {
        failures.push({ entryId, reason: `missing DS overlay composition ${expectation}` });
      }
    }
  }
  for (const expectation of [
    /role\?: "dialog" \| "alertdialog"/,
    /role=\{role\}/,
    /aria-modal="true"/,
    /aria-labelledby=\{titleId\}/,
    /onKeyDown=/,
    /event\.key === "Escape"/,
    /focusableElements/,
    /createPortal\(children, portalNode\)/,
  ]) {
    if (!expectation.test(overlaySource)) {
      failures.push({ entryId: "atlas-ds/overlays", reason: `missing stage overlay behavior ${expectation}` });
    }
  }
  failById("Overlay semantic failures", failures);
});

test("ambiguous neighbors have different normalized semantic anatomy", () => {
  const failures = [];
  for (const [firstId, secondId] of ambiguousNeighbors) {
    const firstResult = tryRender(firstId, { mode: "interactive", state: "active" });
    const secondResult = tryRender(secondId, { mode: "interactive", state: "active" });
    if (firstResult.error || secondResult.error) {
      failures.push({
        entryId: `${firstId} ↔ ${secondId}`,
        reason: `render failed: ${firstResult.error ?? secondResult.error}`,
      });
      continue;
    }
    const firstSignature = semanticSignature(firstResult.markup);
    const secondSignature = semanticSignature(secondResult.markup);
    if (firstSignature === secondSignature) {
      failures.push({
        entryId: `${firstId} ↔ ${secondId}`,
        reason: "normalized roles, control types, and DS anatomy are indistinguishable",
      });
    }
  }
  failById("Ambiguous-neighbor failures", failures);
});
