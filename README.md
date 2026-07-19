# UI Patterns bb Plugin

Install this plugin to add the project-agnostic Pattern Atlas to bb as a visual gallery, native thread-panel action, agent-facing CLI, and automatically available skill. Every surface uses the same 107-record registry, deterministic search, taxonomy, and real React component previews.

## What it provides

- Deterministic ranked search with typo/prefix tolerance and clearly labeled partial-match recovery
- Category and Record type filters
- Quiet polaroid cards with a complete 8:5 preview and canonical name
- A compact inspector with the full interactive component and one-sentence definition
- A maintained Atlas design system with semantic React components, controlled state, and deterministic fixtures
- Reduced-motion support and host-theme styling
- Deep links in the form `entry/<pattern-id>` that restore the selected inspector
- Prompt-box and thread-panel entry points for using the gallery without leaving active work
- An agent-facing `bb ui-patterns` command with stable JSON output
- A packaged `ui-pattern-atlas` skill that teaches agents the bounded query workflow

## Compatibility

| Contract | Declared support |
| --- | --- |
| Plugin id | `ui-patterns` |
| bb | `>=0.0.30` |
| bb plugin SDK | `^0.4.0` |
| Artifact format | `1` |

User-installed plugins require the **Plugins** experiment under Settings → Experiments.

## Agent CLI

The plugin registers one discoverable top-level command. Its parser and output model are shared with the standalone executable, so the two access paths cannot drift.

```bash
bb ui-patterns search dropdown --json
bb ui-patterns show combobox --json
bb ui-patterns list --category "Feedback & status" --type pattern --json
bb ui-patterns categories --json
bb ui-patterns search "generative AI" --type pattern --json
bb ui-patterns sources --json
```

`bb plugin run ui-patterns …` provides the same command through bb’s explicit plugin form. Search is lexical; agents reason from returned records rather than asking the Atlas to infer a design solution.

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
| CLI | `bb ui-patterns` with `search`, `show`, `list`, `categories`, and `sources` |
| Agent guidance | `skills/ui-pattern-atlas/SKILL.md` |
| Settings | Standard host-rendered plugin status; no custom settings |

## Architecture

Research and the generated registry are the authority for every preview. Changes move through one enforced loop:

```text
research → Atlas DS primitives → reusable compositions → typed preview/card definitions → type, accessibility, and visual QA → promotion
```

`atlas-ds/` owns the neutral component system. `pattern-previews.tsx` composes those components for all 107 immutable IDs without SVG injection, Rough.js, network access, time, or randomness. `gallery-shell.tsx` is the shared React gallery and inspector used by the plugin and standalone browser.

The surrounding UI uses bb’s Input, Button, and Icon components plus Radix Select and Dialog primitives. `app.tsx` registers the three bb surfaces, `standalone.tsx` supplies History navigation, and `server.ts` registers the shared CLI. The build generates `plugin-styles.ts` before bb’s raw builder runs, so source-directory installs retain the same scoped Atlas tokens and gallery styling as the packaged artifact.
