# UI Patterns bb Plugin

Install this plugin to add Pattern Atlas to bb as a visual gallery, native thread-panel action, agent-facing CLI, and automatically available skill. The retained gallery uses its 107-record preview registry; the isolated v3 CLI uses source-native provider records with deterministic provenance.

## What it provides

- Deterministic source-native search with typo/prefix tolerance and clearly labeled partial-match recovery
- Provider and source-native record-type filters for the CLI
- Quiet polaroid cards with a complete 8:5 preview and canonical name
- A compact inspector with the full interactive component and one-sentence definition
- A maintained Atlas design system with semantic React components, controlled state, and deterministic fixtures
- Reduced-motion support and host-theme styling
- Gallery routes in the form `gallery/<pattern-id>` that restore the selected inspector
- Legacy `entry/<pattern-id>` routes that return a deprecation and source-native provider candidates
- Prompt-box and thread-panel entry points for using the gallery without leaving active work
- An agent-facing `bb ui-patterns` command with deterministic, versioned JSON envelopes
- A packaged `ui-pattern-atlas` skill that teaches agents the bounded query workflow

## Compatibility

| Contract | Declared support |
| --- | --- |
| Plugin id | `ui-patterns` |
| bb | `>=0.0.30` |
| bb plugin SDK | `^0.4.0` |
| Artifact format | `1` |
| CLI schema / envelope | `3` / `1` |

User-installed plugins require the **Plugins** experiment under Settings → Experiments.

## Agent CLI

The plugin registers one discoverable top-level command. Its parser and output model are shared with the standalone executable, so the two access paths cannot drift.

```bash
bb ui-patterns search combobox --json
bb ui-patterns show aria-apg:combobox --json
bb ui-patterns list --provider aria-apg --type pattern --json
bb ui-patterns sources --json
bb ui-patterns status --json
```

`bb plugin run ui-patterns …` provides the same command through bb’s explicit plugin form. Search is lexical; agents reason from returned records rather than asking the Atlas to infer a design solution.

Every v3 entry includes `provider`, `canonicalUrl`, `upstreamRevision`, `retrievedAt`, `license`, and `contentMode`. Legacy `show button` and `show entry/button` return a deprecation plus sorted candidates such as `aria-apg:button` and `html:button`; they never choose a preferred provider.

## Build and verify

From this directory:

```bash
npm ci
npm run typecheck
npm run build
npm test
npm pack
```

The build script delegates to `bb plugin build`, supplying the platform binary installed by the local `esbuild` package. bb writes and identity-stamps `dist/server.js`, `dist/server.meta.json`, `dist/app.js`, `dist/app.css`, and `dist/app.meta.json`; the same script bundles the standalone History adapter into the repository-level `standalone-dist/`.

## Install from source

On a bb host whose path installer can build frontend plugins, install the source directory in place and inspect its status:

```bash
bb plugin install /absolute/path/to/bb-plugin-ui-patterns --yes
bb plugin list --json
```

Path installs load `server.ts` and rebuild the frontend when needed. Managed npm or release installs use the prebuilt, metadata-validated `dist/` bundle included by this package.

## Registered surfaces

| Surface | Registration |
| --- | --- |
| Navigation | `navPanel` at `/plugins/ui-patterns/library/*` |
| Prompt box | `composerAccessory` `library-button`; SDK 0.4.0 falls back to the Atlas nav panel because accessory props do not expose a thread-panel opener |
| Thread panel | `threadPanelAction` `library-panel` |
| CLI | `bb ui-patterns` with `search`, `show`, `list`, `sources`, and `status` |
| Agent guidance | `skills/ui-pattern-atlas/SKILL.md` |
| Settings | Standard host-rendered plugin status; no custom settings |

## Architecture

The generated registry remains the authority for gallery previews. The v3 CLI is an isolated source-native compatibility layer and does not depend on gallery taxonomy, see-also relationships, or ambiguity routes. Preview changes move through one enforced loop:

```text
research → Atlas DS primitives → reusable compositions → typed preview/card definitions → type, accessibility, and visual QA → promotion
```

`atlas-ds/` owns the neutral component system. `pattern-previews.tsx` composes those components for all 107 immutable IDs without SVG injection, Rough.js, network access, time, or randomness. `gallery-shell.tsx` is the shared React gallery and inspector used by the plugin and standalone browser.

The surrounding UI uses bb’s Input, Button, and Icon components plus Radix Select and Dialog primitives. `app.tsx` registers the three bb surfaces, `standalone.tsx` supplies History navigation, and `server.ts` registers the shared CLI. The build generates `plugin-styles.ts` before bb’s raw builder runs, so source-directory installs retain the same scoped Atlas tokens and gallery styling as the packaged artifact.
