# Repository tooling

The root tooling centralizes the build and repository mechanics every plugin shares. Runtime code, SDK declarations, tests, and UI components stay with the plugin that owns them.

## Commands

| Command | Result |
| --- | --- |
| `npm run check` | Runs repository hygiene and every plugin's typecheck, production build, tests, and artifact validation. |
| `npm run check --workspace=<package>` | Runs the focused check declared by one plugin package. |
| `npm run new:plugin -- --slug <slug> --name <name> --description <purpose>` | Generates and catalogs a plugin, installs dependencies, then typechecks, tests, and builds it. |
| `npm run scaffold:smoke` | Generates temporary plugins and proves the scaffold still passes a clean install and repository checks. |

## Shared scripts

| Script | Purpose |
| --- | --- |
| [`catalog-renderer.mjs`](catalog-renderer.mjs) | Renders the root visual index from `catalog/plugins.json`. |
| [`build-plugin.mjs`](build-plugin.mjs) | Runs the same `bb plugin build` contract for each workspace. |
| [`check-repository.mjs`](check-repository.mjs) | Checks catalog, manifests, lockfiles, READMEs, screenshots, skills, workflows, and repository layout. |
| [`validate-plugin-artifacts.mjs`](validate-plugin-artifacts.mjs) | Verifies production bundles and installable plugin artifacts. |
| [`create-plugin.mjs`](create-plugin.mjs) | Creates a plugin with package scripts, local SDK declarations, a focused test, and a catalog entry. |
| [`scaffold-smoke.mjs`](scaffold-smoke.mjs) | Exercises the generator in a clean temporary repository. |
| [`publish-install-refs.mjs`](publish-install-refs.mjs) | Publishes root-shaped `plugin/<slug>` refs after main passes CI. |

## Boundaries

There is no shared runtime package. Generated SDK declarations and vendored UI stay plugin-local, and repeated setup stays in the generator. A runtime helper belongs under `packages/` only after at least two real plugins use the same stable behavior.

The pinned SDK archive under [`vendor/`](vendor/) keeps clean installs reproducible. [`sdk-provenance.json`](vendor/sdk-provenance.json) records its version, integrity, and source.
