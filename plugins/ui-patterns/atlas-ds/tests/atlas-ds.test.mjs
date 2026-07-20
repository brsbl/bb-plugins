import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { readFile, unlink } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

import { build } from "esbuild";

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const fixturePath = path.join(testDirectory, "runtime-fixture.tsx");
const bundlePath = path.join(testDirectory, ".runtime-fixture.bundle.mjs");
const cssPath = path.join(testDirectory, "..", "tokens.css");
const sourceDirectory = path.join(testDirectory, "..");
const packagePath = path.join(testDirectory, "..", "..", "package.json");

let fixture;

before(async () => {
  await build({
    entryPoints: [fixturePath],
    outfile: bundlePath,
    bundle: true,
    format: "esm",
    platform: "node",
    target: "node20",
    external: ["react", "react-dom", "react-dom/server"],
    logLevel: "silent",
  });
  fixture = await import(`${pathToFileURL(bundlePath).href}?v=${Date.now()}`);
});

after(async () => {
  await unlink(bundlePath).catch(() => {});
});

test("exports the compact primitive and composition API", () => {
  for (const name of [
    "AtlasRoot",
    "Button",
    "TextField",
    "Tabs",
    "DataTable",
    "PreviewStage",
    "StageDialog",
    "InlineAlert",
    "AgentActivity",
    "ActionApproval",
    "ApplicationFrame",
    "AtlasIcon",
    "Avatar",
    "Badge",
    "Chip",
    "NavigationBar",
    "NavigationRail",
    "PageHeader",
    "Skeleton",
    "StepIndicator",
    "TabBar",
    "Tag",
    "TreeView",
  ]) {
    assert.ok(fixture.exportNames.includes(name), `${name} should be exported`);
  }
  assert.equal(fixture.manifest.schemaVersion, 1);
  assert.equal(fixture.manifest.entrypoint, "./atlas-ds/index.js");
  assert.equal(fixture.manifest.overlayRoot, "PreviewStage");
  assert.deepEqual(fixture.manifest.families.agent, [
    "AgentActivity",
    "ActionApproval",
  ]);
  const stableExports = [
    ...Object.values(fixture.manifest.families).flat(),
    ...fixture.manifest.examples,
  ];
  assert.equal(new Set(stableExports).size, stableExports.length);
  for (const name of stableExports) {
    assert.ok(fixture.exportNames.includes(name), `${name} must exist at the manifest entrypoint`);
  }
});

test("identity and context primitives expose quiet typed hierarchy", () => {
  const markup = fixture.renderExpandedFoundationFixture();
  assert.match(markup, /<section[^>]*class="atlas-application-frame"[^>]*aria-label="Policy center example"/);
  assert.match(markup, /<header class="atlas-application-frame__bar"/);
  assert.match(markup, /data-icon="GridView"/);
  assert.match(markup, /role="img"[^>]*aria-label="Mina Patel is online"/);
  assert.match(markup, /class="atlas-badge"[^>]*data-tone="success"/);
  assert.match(markup, /aria-label="Remove Finance"/);
  assert.match(markup, /aria-pressed="true"/);
  assert.match(markup, /class="atlas-skeleton"[^>]*data-shape="block"/);
  assert.doesNotMatch(markup, /[✦◇◫]/);
});

test("navigation primitives distinguish destinations, process, and hierarchy", () => {
  const markup = fixture.renderExpandedNavigationFixture();
  assert.match(markup, /class="atlas-navigation-rail"[^>]*aria-label="Workspace"/);
  assert.match(markup, /class="atlas-tab-bar"[^>]*aria-label="Mobile destinations"/);
  assert.match(markup, /class="atlas-step-indicator"[^>]*aria-label="Progress"/);
  assert.match(markup, /aria-current="step"/);
  assert.match(markup, /role="tree"[^>]*aria-label="Workspace files"/);
  assert.match(markup, /role="treeitem"[^>]*aria-level="1"[^>]*aria-expanded="true"/);
  assert.match(markup, /role="treeitem"[^>]*aria-level="2"[^>]*aria-selected="true"/);
  assert.match(markup, /data-icon="ChevronDown"/);
  assert.match(markup, /data-icon="File"/);
});

test("form compositions preserve native labels and error relationships", () => {
  const markup = fixture.renderFormFixture();
  assert.match(markup, /<label[^>]*for="name"/);
  assert.match(markup, /<input[^>]*id="name"/);
  assert.match(markup, /aria-invalid="true"/);
  assert.match(markup, /aria-describedby="name-description name-error"/);
  assert.match(markup, /role="alert"/);
  assert.match(markup, /<select[^>]*id="policy"/);
  assert.match(markup, /role="switch"/);
});

test("navigation and collections use APG roles and native table semantics", () => {
  const markup = fixture.renderNavigationFixture();
  assert.match(markup, /aria-current="page"/);
  assert.match(markup, /role="tablist"[^>]*aria-label="Views"/);
  assert.match(markup, /role="tab"[^>]*aria-selected="true"/);
  assert.match(markup, /role="tabpanel"/);
  assert.match(markup, /<caption[^>]*>Components<\/caption>/);
  assert.match(markup, /<th scope="row"/);
});

test("interactive data grids expose one roving cell and directional navigation", async () => {
  const markup = fixture.renderGridFixture();
  assert.match(markup, /<table[^>]*role="grid"/);
  assert.match(markup, /aria-rowcount="3"/);
  assert.match(markup, /aria-colcount="2"/);
  assert.match(markup, /role="columnheader"/);
  assert.match(markup, /role="rowheader"[^>]*tabindex="0"/);
  assert.match(markup, /role="gridcell"[^>]*tabindex="-1"/);
  const source = await readFile(path.join(sourceDirectory, "collections.tsx"), "utf8");
  for (const key of ["ArrowDown", "ArrowUp", "ArrowRight", "ArrowLeft", "Home", "End"]) {
    assert.match(source, new RegExp(`event\\.key === "${key}"`));
  }
});

test("feedback distinguishes assertive alerts, progress, and transient status", () => {
  const markup = fixture.renderFeedbackFixture();
  assert.match(markup, /role="alert"/);
  assert.match(markup, /<progress[^>]*aria-label="Import"[^>]*value="3"/);
  assert.match(markup, /aria-live="polite"/);
  assert.match(markup, /aria-label="Dismiss notification"/);
});

test("agent and approval surfaces expose observable steps and gate risk", () => {
  const markup = fixture.renderAgentFixture();
  assert.match(markup, /<ol class="atlas-agent-steps"/);
  assert.match(markup, /<details class="atlas-agent-step__details"/);
  assert.match(markup, />Stop<\/button>/);
  assert.match(markup, /<dt>Action<\/dt>/);
  assert.match(markup, /<dt>Risk<\/dt><dd>high<\/dd>/);
  assert.match(markup, /<dt>Recovery<\/dt><dd>Reversible<\/dd>/);
  assert.match(markup, /<button[^>]*disabled=""[^>]*>Approve<\/button>/);
});

test("inert previews keep a stage-local portal root", () => {
  const markup = fixture.renderStageFixture();
  assert.match(markup, /data-preview-inert="true"/);
  assert.match(markup, /inert=""/);
  assert.match(markup, /data-atlas-stage-portals=""/);
  assert.doesNotMatch(markup, /role="dialog"/);
});

test("overlays fail closed when no preview stage owns the portal", () => {
  assert.match(
    fixture.renderOrphanPortalError(),
    /must be rendered inside PreviewStage/,
  );
});

test("overlay CSS is contained and deterministic", async () => {
  const css = await readFile(cssPath, "utf8");
  const overlaySource = await readFile(path.join(sourceDirectory, "overlays.tsx"), "utf8");
  const portalRule = css.match(
    /\.atlas-preview-stage__portals\s*\{([^}]*)\}/,
  )?.[1];
  const scrimRule = css.match(/\.atlas-overlay-scrim\s*\{([^}]*)\}/)?.[1];
  assert.ok(portalRule);
  assert.ok(scrimRule);
  assert.match(portalRule, /position:\s*absolute/);
  assert.match(scrimRule, /position:\s*absolute/);
  assert.doesNotMatch(`${portalRule}${scrimRule}`, /position:\s*fixed/);
  assert.match(css, /\[data-atlas-ds-root\]/);
  assert.match(overlaySource, /variant\?: "dialog" \| "drawer" \| "sheet"/);
  assert.match(overlaySource, /data-variant=\{variant\}/);
  assert.match(css, /\.atlas-dialog\[data-variant="drawer"\]/);
  assert.match(css, /\.atlas-dialog\[data-variant="sheet"\]/);
  assert.doesNotMatch(overlaySource, />×</);
  assert.doesNotMatch(await readFile(path.join(sourceDirectory, "feedback.tsx"), "utf8"), />×</);
});

test("examples avoid time and randomness dependent states", async () => {
  const source = await readFile(path.join(sourceDirectory, "examples.tsx"), "utf8");
  assert.doesNotMatch(source, /setTimeout|setInterval|Math\.random|Date\.now/);
});

test("the installable package includes and validates the Atlas foundation", async () => {
  const packageJson = JSON.parse(await readFile(packagePath, "utf8"));
  assert.ok(packageJson.files.includes("atlas-ds/"));
  assert.match(packageJson.scripts.test, /atlas-ds\/tests\/\*\.test\.mjs/);
});
