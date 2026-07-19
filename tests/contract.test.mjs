import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import * as radixDialog from "@radix-ui/react-dialog";
import * as radixSelect from "@radix-ui/react-select";
import * as react from "react";
import * as reactDom from "react-dom";
import * as jsxRuntime from "react/jsx-runtime";
import * as vaul from "vaul";

const packageJson = JSON.parse(
  await readFile(new URL("../package.json", import.meta.url), "utf8"),
);
const serverMeta = JSON.parse(
  await readFile(new URL("../dist/server.meta.json", import.meta.url), "utf8"),
);
const appMeta = JSON.parse(
  await readFile(new URL("../dist/app.meta.json", import.meta.url), "utf8"),
);
const skill = await readFile(
  new URL("../skills/ui-pattern-atlas/SKILL.md", import.meta.url),
  "utf8",
);
const app = await readFile(new URL("../app.tsx", import.meta.url), "utf8");
const gallery = await readFile(
  new URL("../gallery-shell.tsx", import.meta.url),
  "utf8",
);
const styles = await readFile(
  new URL("../gallery.css", import.meta.url),
  "utf8",
);
const pluginStyles = await readFile(
  new URL("../plugin-styles.ts", import.meta.url),
  "utf8",
);
const buildScript = await readFile(
  new URL("../scripts/build.mjs", import.meta.url),
  "utf8",
);
const serverSource = await readFile(
  new URL("../server.ts", import.meta.url),
  "utf8",
);
const runtimeCli = await readFile(
  new URL("../runtime-cli.js", import.meta.url),
  "utf8",
);
const cliV3 = await readFile(
  new URL("../atlas-cli-v3.js", import.meta.url),
  "utf8",
);
const compatibility = await readFile(
  new URL("../atlas-compatibility.js", import.meta.url),
  "utf8",
);
const galleryState = await readFile(
  new URL("../gallery-state.ts", import.meta.url),
  "utf8",
);
const builtApp = await readFile(
  new URL("../dist/app.js", import.meta.url),
  "utf8",
);
const sdkAppTypes = await readFile(
  new URL("../types/bb-plugin-sdk-app.d.ts", import.meta.url),
  "utf8",
);

test("package declares the current installable bb contract", () => {
  assert.equal(packageJson.name, "bb-plugin-ui-patterns");
  assert.equal(packageJson.type, "module");
  assert.equal(packageJson.engines.bb, ">=0.0.30");
  assert.equal(packageJson.engines.bbPluginSdk, "^0.4.0");
  assert.equal(packageJson.bb.name, "UI Patterns");
  assert.match(packageJson.bb.description, /visual and agent-queryable/);
  assert.deepEqual(packageJson.bb.branding, { icon: "GridView" });
  assert.equal("displayName" in packageJson.bb, false);
  assert.equal(packageJson.bb.server, "./server.ts");
  assert.equal(packageJson.bb.app, "./app.tsx");
  assert.deepEqual(packageJson.bb.skills, ["skills"]);
  assert.ok(packageJson.files.includes("server.ts"));
  assert.ok(packageJson.files.includes("runtime-cli.js"));
  assert.ok(packageJson.files.includes("atlas-cli-v3.js"));
  assert.ok(packageJson.files.includes("atlas-compatibility.js"));
  assert.ok(packageJson.files.includes("app.tsx"));
  assert.ok(packageJson.files.includes("gallery-shell.tsx"));
  assert.ok(packageJson.files.includes("gallery-state.ts"));
  assert.ok(packageJson.files.includes("data.ts"));
  assert.ok(packageJson.files.includes("search.ts"));
  assert.ok(packageJson.files.includes("pattern-previews.tsx"));
  assert.ok(packageJson.files.includes("plugin-styles.ts"));
  assert.ok(packageJson.files.includes("dist/"));
  assert.ok(packageJson.files.includes("skills/"));
});

test("source-directory installs use a self-contained v3 CLI compatibility runtime", () => {
  assert.match(serverSource, /from "\.\/runtime-cli\.js"/);
  assert.doesNotMatch(serverSource, /from "\.\.\/cli-core\.js"/);
  assert.doesNotMatch(buildScript, /projectRoot|\.\.\/cli-core\.js/);
  assert.match(runtimeCli, /\.\/atlas-cli-v3\.js/);
  assert.match(cliV3, /function runAtlasCli/);
  assert.match(compatibility, /apg\("combobox"/);
  assert.doesNotMatch(cliV3, /seeAlso|ambiguityRoutes|categoryTieBreakRule/);
});

test("bb-built artifacts match the package identity and SDK", () => {
  for (const meta of [serverMeta, appMeta]) {
    assert.equal(meta.artifactFormatVersion, 1);
    assert.equal(meta.pluginId, "ui-patterns");
    assert.equal(meta.pluginVersion, packageJson.version);
    assert.equal(meta.sdkMajor, 0);
    assert.equal(meta.sdkVersion, "0.4.0");
    assert.equal(meta.builtWith.pluginSdkVersion, "0.4.0");
  }
});

test("the packaged skill teaches agents to use the bb command", () => {
  assert.match(skill, /name: ui-pattern-atlas/);
  assert.match(skill, /bb ui-patterns search/);
  assert.match(skill, /bb ui-patterns show aria-apg:combobox/);
  assert.match(skill, /bb ui-patterns status/);
  assert.match(skill, /provider-native/);
  assert.doesNotMatch(skill, /bb ui-patterns categories/);
  assert.doesNotMatch(skill, /\/Users\//);
});

test("legacy entry routes remain visible as compatibility routes while gallery navigation has a separate path", () => {
  assert.match(galleryState, /legacyRouteEntryId/);
  assert.match(galleryState, /gallery\/\$\{encodeURIComponent\(entryId\)\}/);
  assert.match(galleryState, /routeKind === "entry"/);
  assert.match(gallery, /This entry route is deprecated/);
  assert.match(gallery, /provider-native ID/);
});

test("the plugin UI exposes only Category and Record type facets", () => {
  assert.match(gallery, /Record type/);
  assert.match(gallery, /Category/);
  assert.doesNotMatch(gallery, /Pattern type|data-context|entry\.contexts/);
  assert.match(app, /entrySubPath\(id\)/);
});

test("preview components do not receive a redundant padded inner frame", () => {
  assert.match(
    styles,
    /\.pa-visual__component > \.atlas-surface \{[\s\S]*?border: 0;[\s\S]*?padding: 0;[\s\S]*?background: transparent;/,
  );
});

test("the plugin registers supported Atlas entry surfaces", () => {
  assert.match(app, /app\.slots\.navPanel\(\{/);
  assert.match(app, /app\.slots\.threadPanelAction\(\{/);
  assert.match(app, /id: "library-panel"/);
  assert.match(app, /component: UiPatternsThreadPanel/);
  assert.match(app, /mode="panel"/);
  assert.match(app, /app\.slots\.composerAccessory\(\{/);
  assert.match(app, /id: "library-button"/);
  assert.match(app, /component: UiPatternsComposerAccessory/);
  assert.match(app, /aria-label="Open UI Patterns"/);
  assert.match(app, /title="Open UI Patterns"/);
  assert.match(app, /className="h-6 w-6 shrink-0 rounded p-0/);
  assert.match(app, /\[&_svg\]:size-3\.5/);
  assert.match(app, /navigate\.toPluginPanel\("library"\)/);
  assert.doesNotMatch(app, /DialogPrimitive|pa-composer-panel|aria-expanded/);
  assert.doesNotMatch(app, /document\.|@\/|apps\/app/);
});

test("Atlas styles survive raw bb source-directory installs", () => {
  assert.match(app, /import \{ atlasPluginStyles \} from "\.\/plugin-styles\.js"/);
  assert.match(app, /data-ui-pattern-atlas-styles/);
  assert.match(pluginStyles, /--atlas-color-canvas/);
  assert.match(pluginStyles, /\.pa-card/);
  assert.match(buildScript, /pluginCustomCss/);
  assert.match(buildScript, /resolve\(packageRoot, "plugin-styles\.ts"\)/);
  assert.match(builtApp, /data-ui-pattern-atlas-styles/);
  assert.match(builtApp, /--atlas-color-canvas/);
  assert.match(builtApp, /\.pa-card/);
});

test("the built app registers nav, thread-panel, and composer surfaces", async () => {
  globalThis.__bbPluginRuntime = {
    react,
    reactDom,
    jsxRuntime,
    radixDialog,
    radixSelect,
    vaul,
    pluginSdkApp: {
      definePluginApp: (setup) => ({ __bbPluginApp: true, setup }),
      useBbContext() {},
      useBbNavigate() {},
      useComposer() {},
      useRealtime() {},
      useRealtimeConnectionState() {},
      useRpc() {},
      useSettings() {},
    },
  };

  try {
    const builtApp = await import(
      new URL(`../dist/app.js?contract=${Date.now()}`, import.meta.url)
    );
    const registrations = {
      navPanels: [],
      threadPanelActions: [],
      composerAccessories: [],
    };

    builtApp.default.setup({
      slots: {
        navPanel: (registration) =>
          registrations.navPanels.push(registration),
        threadPanelAction: (registration) =>
          registrations.threadPanelActions.push(registration),
        composerAccessory: (registration) =>
          registrations.composerAccessories.push(registration),
      },
    });

    assert.deepEqual(
      registrations.navPanels.map(({ id }) => id),
      ["library"],
    );
    assert.deepEqual(
      registrations.threadPanelActions.map(({ id }) => id),
      ["library-panel"],
    );
    assert.deepEqual(
      registrations.composerAccessories.map(({ id }) => id),
      ["library-button"],
    );
    assert.equal(
      typeof registrations.threadPanelActions[0].component,
      "function",
    );
    assert.equal("run" in registrations.threadPanelActions[0], false);
    assert.equal(
      typeof registrations.composerAccessories[0].component,
      "function",
    );
  } finally {
    delete globalThis.__bbPluginRuntime;
  }
});

test("SDK 0.4.0 exposes no composer-to-thread-panel bridge and the plugin does not fake one", () => {
  const composerProps = sdkAppTypes.match(
    /interface PluginComposerAccessoryProps \{(?<body>[\s\S]*?)\n\}/,
  )?.groups?.body;
  const threadActionContext = sdkAppTypes.match(
    /interface PluginThreadPanelActionContext \{(?<body>[\s\S]*?)\n\}/,
  )?.groups?.body;
  const navigateContract = sdkAppTypes.match(
    /interface BbNavigate \{(?<body>[\s\S]*?)\n\}/,
  )?.groups?.body;

  assert.ok(composerProps);
  assert.match(composerProps, /projectId: string \| null/);
  assert.match(composerProps, /threadId: string \| null/);
  assert.doesNotMatch(composerProps, /openPanel|openThreadPanel/);
  assert.ok(threadActionContext);
  assert.match(threadActionContext, /openPanel\(/);
  assert.ok(navigateContract);
  assert.match(navigateContract, /toPluginPanel\(/);
  assert.doesNotMatch(navigateContract, /openPanel|openThreadPanel/);
  assert.match(app, /host callback for invoking this plugin's registered threadPanelAction/);
  assert.match(app, /navigate\.toPluginPanel\("library"\)/);
  assert.doesNotMatch(app, /DialogPrimitive|pa-composer-panel/);
});

test("the plugin UI uses a gallery inspector instead of detail pages", () => {
  assert.match(gallery, /className=\{`pa-inspector\$\{missing/);
  assert.match(gallery, /<DialogTitle className="pa-caption__name">\{entry\.name\}<\/DialogTitle>/);
  assert.match(gallery, /<DialogDescription className="pa-caption__definition">/);
  assert.match(gallery, /id=\{`pattern-card-\$\{entry\.id\}-description`\}/);
  assert.match(gallery, /className="pa-caption__definition"/);
  assert.match(gallery, /aria-describedby=\{`pattern-card-\$\{entry\.id\}-description`\}/);
  assert.match(app, /window\.history\.back\(\)/);
  assert.match(gallery, /data-entry-id=\{entry\.id\}/);
  assert.match(gallery, /\.querySelector<HTMLButtonElement>/);
  assert.match(gallery, /\?\.focus\(\)/);
  assert.match(styles, /container-name: pattern-atlas/);
  assert.match(styles, /@container pattern-atlas/);
  assert.match(styles, /\.pa-caption--inspector/);
  assert.match(styles, /\.pa-inspector--missing/);
  assert.match(gallery, /function PanelPatternInspector/);
  assert.match(gallery, /className="pa-panel-inspector"/);
  assert.match(styles, /\.pa-shell--panel/);
  assert.match(styles, /\.pa-panel-inspector/);
  assert.doesNotMatch(
    gallery,
    /DetailView|How to recognize it|See also|entry\.altLabels|entry\.details|seeAlsoIds/,
  );
});
