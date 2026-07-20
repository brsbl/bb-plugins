import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
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
const sourceBrowserData = await readFile(
  new URL("../source-browser-data.ts", import.meta.url),
  "utf8",
);
const livePreviews = await readFile(
  new URL("../live-component-previews.tsx", import.meta.url),
  "utf8",
);
const assistantPreviews = await readFile(
  new URL("../assistant-ui-previews.tsx", import.meta.url),
  "utf8",
);
const basePreviews = await readFile(
  new URL("../base-ui-demo-previews.tsx", import.meta.url),
  "utf8",
);
const shadcnBasePreviews = await readFile(
  new URL("../shadcn-demo-previews.tsx", import.meta.url),
  "utf8",
);
const shadcnUpstream = JSON.parse(
  await readFile(
    new URL("../vendor/shadcn-ui/upstream.json", import.meta.url),
    "utf8",
  ),
);
const baseUpstream = JSON.parse(
  await readFile(
    new URL("../vendor/base-ui/upstream.json", import.meta.url),
    "utf8",
  ),
);
const shadcnLicense = await readFile(
  new URL("../vendor/shadcn-ui/LICENSE.md", import.meta.url),
  "utf8",
);
const baseLicense = await readFile(
  new URL("../vendor/base-ui/LICENSE", import.meta.url),
  "utf8",
);

test("the package ships approved-source live previews, not a bespoke Atlas design system", () => {
  assert.ok(packageJson.files.includes("providers/"));
  assert.ok(packageJson.files.includes("source-browser-data.ts"));
  assert.ok(packageJson.files.includes("source-browser-model.ts"));
  assert.ok(packageJson.files.includes("live-component-previews.tsx"));
  assert.ok(packageJson.files.includes("preview-frame-context.tsx"));
  assert.ok(packageJson.files.includes("assistant-ui-previews.tsx"));
  assert.ok(packageJson.files.includes("base-ui-demo-previews.tsx"));
  assert.ok(packageJson.files.includes("shadcn-demo-previews.tsx"));
  assert.ok(packageJson.files.includes("vendor/base-ui/"));
  assert.ok(packageJson.files.includes("vendor/shadcn-ui/"));
  assert.equal(packageJson.files.includes("atlas-ds/"), false);
  assert.equal(packageJson.files.includes("pattern-previews.tsx"), false);
  assert.equal(
    packageJson.files.includes("generated/atlas-registry.v2.json"),
    false,
  );
  assert.equal(packageJson.files.includes("dist/"), true);
  assert.equal(packageJson.files.includes("standalone.tsx"), false);
  assert.equal(packageJson.scripts.test.includes("pattern-previews"), false);
  assert.equal(packageJson.dependencies["@base-ui/react"], "1.6.0");
  assert.equal(packageJson.dependencies["@assistant-ui/react"], "0.14.27");
  assert.match(livePreviews, /from "\.\/shadcn-demo-previews\.js"/);
  assert.match(livePreviews, /import\("\.\/assistant-ui-previews\.js"\)/);
  assert.match(livePreviews, /from "\.\/base-ui-demo-previews\.js"/);
  assert.match(livePreviews, /<PreviewFrameProvider container=\{documentBody\}>/);
  assert.match(livePreviews, /shadcn\/ui registry · d28738b/);
  assert.match(assistantPreviews, /from "@assistant-ui\/react"/);
  assert.match(assistantPreviews, /export function AssistantComposerPreview/);
  assert.match(assistantPreviews, /export function AssistantActionBarPreview/);
  assert.match(assistantPreviews, /export function AssistantMessagePreview/);
  assert.match(assistantPreviews, /export function AssistantThreadPreview/);
  assert.match(assistantPreviews, /<ThreadPrimitive\.Root/);
  assert.match(assistantPreviews, /<ThreadPrimitive\.Viewport/);
  assert.match(assistantPreviews, /<ThreadPrimitive\.Messages>/);
  assert.equal(
    [...assistantPreviews.matchAll(/portalProps=\{\{ container: portalContainer \}\}/g)]
      .length,
    3,
  );
  assert.match(livePreviews, /AssistantActionBarPreview/);
  assert.match(livePreviews, /AssistantMessagePreview/);
  assert.match(basePreviews, /vendor\/base-ui\/examples\/accordion/);
  assert.match(
    shadcnBasePreviews,
    /vendor\/shadcn-ui\/examples\/base\/button-demo/,
  );
  assert.equal(
    shadcnUpstream.revision,
    "d28738b183c5eaa69d8d540826e450f30d39ab6c",
  );
  assert.doesNotMatch(buildScript, /atlas-ds|gallery\.css|pluginCustomCss/);
  assert.match(
    readme,
    /full four-source Atlas remains available/,
  );
  assert.doesNotMatch(readme, /Atlas DS/);
});

test("the plugin is registered only as a thread side-panel", () => {
  assert.doesNotMatch(app, /app\.slots\.navPanel\(\{/);
  assert.match(app, /app\.slots\.threadPanelAction\(\{/);
  assert.match(app, /run: \(\{ openPanel \}\) => \{/);
  assert.match(app, /openPanel\(\{ title: "UI Patterns" \}\)/);
  assert.doesNotMatch(app, /app\.slots\.composerAccessory\(\{/);
  assert.doesNotMatch(app, /openThreadPanel\(\{/);
  assert.match(app, /useSourceBrowserData/);
  assert.match(app, /className="h-full min-h-0 overflow-hidden"/);
  assert.doesNotMatch(app, /sourceBrowserFixture/);
  assert.match(sourceBrowserData, /useRpc<typeof sourceBrowserRpcContract>/);
  assert.match(
    sourceBrowserData,
    /rpc\.call\("getSourceBrowserSnapshot", null\)/,
  );
});

test("the active browser uses sanctioned controls and attributable source detail", () => {
  assert.match(gallery, /from "\.\/components\/ui\/button\.js"/);
  assert.match(gallery, /from "\.\/components\/ui\/input\.js"/);
  assert.match(gallery, /from "\.\/components\/ui\/select\.js"/);
  assert.match(gallery, /Accessibility guidance/);
  assert.match(gallery, /Examples/);
  assert.match(gallery, /LiveComponentPreview/);
  assert.match(gallery, /data-gallery-card/);
  assert.match(gallery, /size="card"/);
  assert.match(gallery, /sticky top-0/);
  assert.match(gallery, /Source guidance and examples/);
  assert.match(gallery, /const query = event\.currentTarget\.value/);
  assert.doesNotMatch(
    gallery,
    /setFilters\(\(current\) => \(\{[^}]*event\.currentTarget\.value/,
  );
  assert.match(livePreviews, /queueMicrotask\(\(\) => \{\s*root\.unmount\(\)/);
  assert.match(livePreviews, /<base target='_blank'>/);
  assert.match(
    livePreviews,
    /try \{\s*const frameWindow = frame\.contentWindow;[\s\S]*\} catch \{\s*setFrameReady\(false\);\s*setFrameFailed\(true\);/,
  );
  assert.match(gallery, /providers\/source-browser/);
  assert.doesNotMatch(
    gallery,
    /<details|<summary|Native ID|Preview count|Source links|Relationships|Revision|Licensed excerpt|Evidence|Technologies|Packages|pattern-previews|atlas-ds|PatternVisual|entry\.details|seeAlsoIds/,
  );
});

test("the vendored shadcn registry tree stays byte-for-byte pinned", async () => {
  const directory = resolve(
    new URL("../vendor/shadcn-ui/bases/base/ui", import.meta.url).pathname,
  );
  const files = (await readdir(directory))
    .filter((file) => file.endsWith(".tsx"))
    .sort();
  const hash = createHash("sha256");
  for (const file of files) {
    hash.update(file);
    hash.update("\0");
    hash.update(await readFile(resolve(directory, file)));
    hash.update("\0");
  }
  assert.equal(files.length, shadcnUpstream.uiFileCount);
  assert.equal(hash.digest("hex"), shadcnUpstream.uiTreeSha256);

  for (const [name, expectedHash] of Object.entries(
    shadcnUpstream.styleSha256,
  )) {
    const style = await readFile(
      resolve(
        new URL("../vendor/shadcn-ui/styles", import.meta.url).pathname,
        name === "nova" ? "style-nova.css" : `${name}.css`,
      ),
    );
    assert.equal(
      createHash("sha256").update(style).digest("hex"),
      expectedHash,
      name,
    );
  }
});

test("vendored example trees and licenses stay pinned", async () => {
  async function hashExamples(directory) {
    const files = (await readdir(directory))
      .filter((file) => file.endsWith(".tsx"))
      .sort();
    const hash = createHash("sha256");
    for (const file of files) {
      hash.update(file);
      hash.update("\0");
      hash.update(await readFile(resolve(directory, file)));
      hash.update("\0");
    }
    return { count: files.length, sha256: hash.digest("hex") };
  }

  const shadcnExamples = await hashExamples(
    resolve(
      new URL("../vendor/shadcn-ui/examples/base", import.meta.url).pathname,
    ),
  );
  assert.deepEqual(shadcnExamples, {
    count: shadcnUpstream.demoFileCount,
    sha256: shadcnUpstream.demoTreeSha256,
  });

  const baseExamples = await hashExamples(
    resolve(new URL("../vendor/base-ui/examples", import.meta.url).pathname),
  );
  assert.deepEqual(baseExamples, {
    count: baseUpstream.exampleFileCount,
    sha256: baseUpstream.exampleTreeSha256,
  });
  assert.match(shadcnLicense, /^MIT License/);
  assert.match(baseLicense, /^MIT License/);
});
