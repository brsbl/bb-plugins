# Repository tooling

The root tooling makes every plugin follow the same build, validation, scaffolding, and publishing contract. Plugins still own their runtime code, generated SDK declarations, and UI primitives.

## Commands

| Command | Result |
| --- | --- |
| `npm run check` | Runs repository hygiene, every plugin's typecheck, production build and tests, the scaffold smoke test, built-artifact tests, and artifact validation. |
| `npm run check --workspace=<package>` | Runs the focused check declared by one plugin package. |
| `npm run new:plugin -- --slug <slug> --name <name> --description <purpose>` | Generates and catalogs a plugin, installs its dependencies, then typechecks, tests, and builds it. |
| `npm run scaffold:smoke` | Generates temporary cataloged plugins, performs a clean `npm ci`, and proves the template and screenshot catalog stay in sync. |

## Scripts

| Script | Owns |
| --- | --- |
| [`catalog-renderer.mjs`](catalog-renderer.mjs) | The one catalog-to-README renderer shared by scaffolding and hygiene checks. |
| [`build-plugin.mjs`](build-plugin.mjs) | The consistent `bb plugin build` wrapper used by plugin packages. |
| [`check-repository.mjs`](check-repository.mjs) | Catalog, manifest, lockfile, README, screenshot, implicit-skill, nested-workflow, and repository-layout hygiene. |
| [`validate-plugin-artifacts.mjs`](validate-plugin-artifacts.mjs) | Production bundle and installable-artifact validation for every cataloged plugin. |
| [`create-plugin.mjs`](create-plugin.mjs) | The plugin generator, including package scripts, local SDK declarations, a focused test, and the catalog entry. |
| [`scaffold-smoke.mjs`](scaffold-smoke.mjs) | A clean-room test that prevents the generator and repository rules from drifting apart. |
| [`publish-install-refs.mjs`](publish-install-refs.mjs) | Root-shaped `plugin/<slug>` install refs for bb, updated only when a plugin's published tree changes and never pushed from a dirty worktree. |

## SDK provenance

CI and local installs use the pinned SDK archive in [`vendor/`](vendor/) so a clean lockfile install is reproducible. [`sdk-provenance.json`](vendor/sdk-provenance.json) records its package version, integrity, and source. Plugin-local declarations mirror the host-facing contract and are checked for drift.

There is no shared runtime package yet. Repeated setup remains generated tooling, and UI primitives remain plugin-local, until the same stable behavior is used by at least two real plugins.
