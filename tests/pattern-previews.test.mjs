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

const anatomyRecords = atlasRegistry.entries.map(({ anatomy }) => anatomy);
const entryStories = atlasRegistry.entries.map(({ story }) => story);

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const temporaryDirectory = await mkdtemp(
  resolve(packageRoot, ".pattern-preview-test-"),
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
  `${pathToFileURL(outputFile).href}?test=${Date.now()}`
);
const {
  PatternPreview,
  patternPreviewIds,
  patternPreviewRegistry,
  patternPreviewTemplateFamilies,
  resolvePreviewActiveState,
  resolvePreviewEnabledState,
} = previewModule;
const source = await readFile(
  resolve(packageRoot, "pattern-previews.tsx"),
  "utf8",
);
const tokenSource = await readFile(
  resolve(packageRoot, "atlas-ds/tokens.css"),
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

function escapeAttribute(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function normalizeFixtureAttributes(markup) {
  return markup
    .replace(/ data-preview-phase="[^"]+"/, "")
    .replace(/ data-preview-state="[^"]+"/, "");
}

test("preview registry exactly covers the 107 Atlas entries", () => {
  const anatomyIds = anatomyRecords.map(({ entryId }) => entryId);
  const storyIds = entryStories.map(({ entryId }) => entryId);

  assert.equal(patternPreviewIds.length, 107);
  assert.equal(new Set(patternPreviewIds).size, 107);
  assert.deepEqual([...patternPreviewIds], anatomyIds);
  assert.deepEqual([...patternPreviewIds], storyIds);
  assert.deepEqual(
    patternPreviewRegistry.map(({ entryId }) => entryId),
    anatomyIds,
  );
});

test("preview renderer covers every current registry template family", () => {
  const registryTemplates = [
    ...new Set(anatomyRecords.map(({ template }) => template)),
  ].sort();
  const supportedTemplates = [...patternPreviewTemplateFamilies].sort();

  assert.equal(registryTemplates.length, 39);
  assert.deepEqual(supportedTemplates, registryTemplates);
  assert.deepEqual(
    [...new Set(patternPreviewRegistry.map(({ template }) => template))].sort(),
    registryTemplates,
  );
});

test("all 107 entries render deterministic real React DOM compositions", () => {
  for (const record of patternPreviewRegistry) {
    const first = render(record.entryId, {
      mode: "inert",
      phase: 1,
      state: "active",
    });
    const second = render(record.entryId, {
      mode: "inert",
      phase: 1,
      state: "active",
    });

    assert.equal(first, second, `${record.entryId} output must be stable`);
    assert.match(first, /data-pattern-preview=""/);
    assert.match(
      first,
      new RegExp(`data-entry-id="${escapeAttribute(record.entryId)}"`),
    );
    assert.match(
      first,
      new RegExp(
        `data-preview-template="${escapeAttribute(record.template)}"`,
      ),
    );
    assert.match(first, /class="atlas-root/);
    assert.match(first, /class="atlas-surface/);
    assert.match(first, /inert=""/);
    assert.doesNotMatch(first, /<canvas|<img/i);
    for (const svg of first.match(/<svg\b[^>]*>/gi) ?? []) {
      assert.match(
        svg,
        /data-icon="/,
        `${record.entryId} may render SVG only through the vendored icon component`,
      );
    }
  }
});

test("product chrome appears only when the pattern needs application context", () => {
  assert.doesNotMatch(source, /title="Northstar"/);

  for (const entryId of [
    "button",
    "toggle-button",
    "text-field",
    "checkbox",
    "select",
    "progress-indicator",
    "card",
    "table",
    "form",
  ]) {
    assert.doesNotMatch(
      render(entryId),
      /atlas-application-frame/,
      `${entryId} must render as a local composition, not a product shell`,
    );
  }

  for (const entryId of [
    "header",
    "navigation-bar",
    "side-navigation",
    "banner",
    "command-palette",
    "split-view",
  ]) {
    assert.match(
      render(entryId),
      /atlas-application-frame/,
      `${entryId} needs application context to explain its placement`,
    );
  }

  assert.doesNotMatch(
    source.match(/function ContextPage[\s\S]*?\n\}/)?.[0] ?? "",
    /ApplicationFrame/,
  );
});

test("inert, interactive, phase, and state props remain explicit", () => {
  const inert = render("toggle-button", {
    mode: "inert",
    phase: 0,
    state: "rest",
  });
  const interactive = render("toggle-button", {
    mode: "interactive",
    phase: 1,
    state: "active",
  });

  assert.match(inert, /inert=""/);
  assert.match(inert, /data-preview-mode="inert"/);
  assert.match(inert, /data-preview-phase="0"/);
  assert.match(inert, /data-preview-state="rest"/);
  assert.match(inert, /aria-pressed="false"/);

  assert.doesNotMatch(interactive, /inert=""/);
  assert.match(interactive, /data-preview-mode="interactive"/);
  assert.match(interactive, /data-preview-phase="1"/);
  assert.match(interactive, /data-preview-state="active"/);
  assert.match(interactive, /aria-pressed="true"/);
});

test("reduced motion preserves the final stable anatomy", () => {
  for (const record of patternPreviewRegistry) {
    const active = render(record.entryId, {
      mode: "inert",
      phase: 1,
      state: "active",
    }).replace('data-preview-state="active"', 'data-preview-state="fixture"');
    const reduced = render(record.entryId, {
      mode: "inert",
      phase: 1,
      state: "reduced-motion",
    }).replace(
      'data-preview-state="reduced-motion"',
      'data-preview-state="fixture"',
    );

    assert.equal(
      reduced,
      active,
      `${record.entryId} reduced-motion must show the active final state`,
    );
  }

  assert.equal(resolvePreviewActiveState("rest", 0), false);
  assert.equal(resolvePreviewActiveState("default", 0.49), true);
  assert.equal(resolvePreviewActiveState("default", 0.5), true);
  assert.equal(resolvePreviewActiveState("reduced-motion", 1), true);
});

test("static records are phase invariant and every motion record has distinct endpoints", () => {
  for (const record of patternPreviewRegistry) {
    const hasMotion = record.states.includes("rest") && record.states.includes("active");
    const rest = normalizeFixtureAttributes(render(record.entryId, {
      mode: "inert",
      phase: 0,
    }));
    const active = normalizeFixtureAttributes(render(record.entryId, {
      mode: "inert",
      phase: 1,
    }));

    if (hasMotion) {
      assert.notEqual(rest, active, `${record.entryId} motion endpoints must differ`);
    } else {
      assert.equal(rest, active, `${record.entryId} static output must ignore phase`);
    }
  }
});

test("explicit and operating-system reduced motion stop Atlas animation", () => {
  assert.match(
    tokenSource,
    /\[data-preview-state="reduced-motion"\] \.atlas-spinner-glyph\s*\{[^}]*animation:\s*none/s,
  );
  assert.match(
    tokenSource,
    /\[data-preview-state="reduced-motion"\] \.atlas-skeleton\[data-animated\]::after\s*\{[^}]*animation:\s*none/s,
  );
  assert.match(
    tokenSource,
    /\[data-preview-state="reduced-motion"\] \.atlas-switch::after\s*\{[^}]*transition:\s*none/s,
  );
  assert.match(tokenSource, /@media \(prefers-reduced-motion: reduce\)[\s\S]*animation:\s*none/);
});

test("phase-driven enabled state follows motion without bypassing governance", () => {
  assert.equal(resolvePreviewEnabledState("dialog", false), false);
  assert.equal(resolvePreviewEnabledState("dialog", true), true);
  assert.equal(resolvePreviewEnabledState("action-approval", true), false);
  assert.equal(resolvePreviewEnabledState("agent-management", true), false);
  assert.match(
    source,
    /React\.useEffect\(\(\) => \{\s*if \(!interactive\) setEnabled\(phaseDrivenEnabled\);\s*\}, \[entryId, interactive, phaseDrivenEnabled\]\);/,
  );
});

test("ambiguous neighbors and specialist patterns keep distinct anatomy", () => {
  const expectations = {
    button: [/<button/, /data-tone="primary"/],
    select: [/<select/, /atlas-field/],
    combobox: [/role="combobox"/, /suggestions/],
    listbox: [/<select[^>]*size="3"/, /<option/],
    table: [/<table/, /atlas-table/],
    "data-grid": [/<table[^>]*role="grid"/, /Role for Member/, /Active status for Member/],
    "tree-view": [/<ul/, /<ul/],
    "kanban-board": [/Backlog/, /atlas-collection/],
    dashboard: [/<progress/, /atlas-surface/],
    "ai-composer": [/<textarea/, /context\.pdf/],
    "agent-activity": [/atlas-agent-activity/, /atlas-agent-steps/],
    "action-approval": [/atlas-approval/, /atlas-approval__facts/],
    "permission-matrix": [/<table/, /role="switch"/],
    "rule-builder": [/<select/, /value="is"[^>]*>is/],
    "audit-log": [/<table/, />Time</, />Actor</, />Action</, />Target</],
  };

  for (const [entryId, matchers] of Object.entries(expectations)) {
    const markup = render(entryId, { mode: "inert", state: "active" });
    for (const matcher of matchers) {
      assert.match(markup, matcher, `${entryId} must expose ${matcher}`);
    }
  }

  assert.notEqual(render("select"), render("combobox"));
  assert.notEqual(render("table"), render("data-grid"));
  assert.notEqual(render("agent-activity"), render("action-approval"));
});

test("overlays use the controlled stage-local DS contract", () => {
  for (const entryId of [
    "command-palette",
    "dialog",
    "alert-dialog",
    "popover",
    "tooltip",
    "menu",
    "drawer",
    "sheet",
    "workspace-switcher",
  ]) {
    const markup = render(entryId, { mode: "inert", state: "active" });
    assert.match(markup, /atlas-preview-stage/);
    assert.match(markup, /data-atlas-stage-portals/);
  }
  assert.match(source, /<StageDialog/);
  assert.match(source, /<StagePopover/);
  assert.match(source, /variant=\{/);
  assert.match(source, /\? "drawer"/);
  assert.match(source, /\? "sheet"/);
  assert.match(source, /role="tooltip"/);
  assert.match(source, /role="menu"/);
  assert.match(source, /role="menuitem"/);
});

test("agent management exposes identity and governance instead of a generic flow", () => {
  const markup = render("agent-management", {
    mode: "interactive",
    state: "active",
  });

  assert.match(markup, /Policy reviewer/);
  assert.match(markup, /Release assistant/);
  assert.match(markup, /Vendor/);
  assert.match(markup, /Built-in/);
  assert.match(markup, /Review policies · Summarize changes/);
  assert.match(markup, /Scope: Workspace · Permissions: Read policies/);
  assert.match(markup, /Enabled/);
  assert.match(markup, /Available/);
  assert.match(markup, /role="switch"/);
  assert.match(markup, /Enable Policy reviewer/);
  assert.doesNotMatch(markup, />Continue<|>Back</);
});

test("loading state preserves its destination and scopes the busy region", () => {
  const markup = render("loading-state", {
    mode: "inert",
    state: "active",
  });
  const skeleton = render("skeleton", {
    mode: "inert",
    state: "active",
  });

  assert.match(markup, /Audit events/);
  assert.match(markup, /aria-label="Audit event updates"/);
  assert.match(markup, /aria-busy="true"/);
  assert.match(markup, /<table/);
  assert.match(markup, /Recent audit events/);
  assert.match(markup, /Policy updated/);
  assert.match(markup, /role="status"/);
  assert.match(markup, /Updating events/);
  assert.notEqual(markup, skeleton);
  assert.doesNotMatch(skeleton, /<table|role="status"/);
});

test("sheet uses bottom-edge placement while drawer uses the side edge", () => {
  assert.match(source, /context\.entryId === "drawer"[\s\S]*\? "drawer"/);
  assert.match(source, /context\.entryId === "sheet"[\s\S]*\? "sheet"/);
});

test("registry anatomy supplies deterministic labels and fixture states", () => {
  for (const record of patternPreviewRegistry) {
    const anatomy = anatomyRecords.find(
      ({ entryId }) => entryId === record.entryId,
    );
    const story = entryStories.find(({ entryId }) => entryId === record.entryId);

    assert.ok(anatomy);
    assert.ok(story);
    assert.deepEqual(
      record.labels,
      anatomy.regions.map(({ label }) => label),
    );
    assert.deepEqual(
      record.states,
      story.fixture.states.map(({ id }) => id),
    );
  }
});

test("preview source has no legacy bitmap or injected-markup path", () => {
  assert.doesNotMatch(source, /visualMarkup|dangerouslySetInnerHTML/i);
  assert.match(source, /const \[approved, setApproved\] = React\.useState\(false\)/);
  assert.match(source, /state=\{context\.approved \? "approved" : "pending"\}/);
  assert.match(source, /checked: context\.enabled/);
  assert.match(source, /I reviewed the scope and impact/);
  assert.doesNotMatch(
    source,
    /state=\{context\.enabled \? "approved" : "pending"\}/,
  );
  assert.doesNotMatch(source, /\brough(?:js)?\b|RoughJS/i);
  assert.doesNotMatch(source, /createElementNS|innerHTML/i);
  assert.match(source, /<AtlasIcon/);
  assert.match(source, /from "\.\/atlas-ds\/index\.js"/);
  assert.match(source, /from "\.\/generated\/atlas-registry\.v2\.json"/);
});
