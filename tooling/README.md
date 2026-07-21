# Repository tooling

This folder holds the small amount of machinery the plugins genuinely share. Runtime code, SDK declarations, tests, and UI components stay with the plugin that owns them.

## Commands

| Command | Result |
| --- | --- |
| `npm run check` | Checks the repository, then typechecks, builds, tests, and validates every plugin. |
| `npm run check --workspace=<package>` | Runs one plugin's own focused check. |
| `npm run new:plugin -- --slug <slug> --name <name> --description <purpose>` | Creates a plugin, installs dependencies, and runs its first typecheck, test, and build. |
| `npm run scaffold:smoke` | Creates a temporary plugin and proves the scaffold still works after a clean install. |

## Shared scripts

| Script | Purpose |
| --- | --- |
| [`plugin-workspaces.mjs`](plugin-workspaces.mjs) | Finds plugins and reads their names and stable IDs from their manifests. |
| [`build-plugin.mjs`](build-plugin.mjs) | Gives every workspace the same `bb plugin build` entrypoint. |
| [`check-repository.mjs`](check-repository.mjs) | Catches drift in manifests, lockfiles, READMEs, screenshots, skills, workflows, and layout. |
| [`validate-plugin-artifacts.mjs`](validate-plugin-artifacts.mjs) | Makes sure production bundles contain everything bb needs to install them. |
| [`create-plugin.mjs`](create-plugin.mjs) | Starts a plugin with package scripts, local SDK declarations, and a focused test. |
| [`scaffold-smoke.mjs`](scaffold-smoke.mjs) | Runs the generator inside a clean temporary repository. |
| [`publish-install-refs.mjs`](publish-install-refs.mjs) | Publishes one root-shaped `plugin/<slug>` ref per plugin after `main` passes CI. |

## Boundaries

There is no shared runtime package. Generated SDK declarations and vendored UI stay plugin-local, while repeated setup belongs in the generator. A helper moves under `packages/` only after at least two real plugins depend on the same stable behavior.

The pinned SDK archive under [`vendor/`](vendor/) keeps clean installs reproducible. [`sdk-provenance.json`](vendor/sdk-provenance.json) records where it came from and verifies its contents.
