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
| [`publish-install-refs.mjs`](publish-install-refs.mjs) | Publishes root-shaped `plugin/<slug>` refs and bundled Thread Organizer version tags after `main` passes CI. |

## Thread Organizer releases

Bump the plugin version and lockfile, rebuild its artifacts, and merge after CI
passes. The existing publish job creates `thread-organizer/v<version>` from the
same bundles as `plugin/thread-organizer`. The tag retains
`plugins/thread-organizer`, so marketplace URLs and version ranges stay valid.
Do not tag the source commit manually.

The generated release commit is parented by its source commit and records the
package tree, lockfile digest, SDK archive, and builder provenance in
`plugin-release.json`. Its plugin manifest points to prebuilt wrappers and has
no install-time package dependencies. Source manifests on `main` retain the
dependencies needed for development.

Published version tags are immutable. A rerun accepts an existing tag only when
its plugin contents match; otherwise bump the version. Other plugins keep their
existing release process. The remote compatibility test installs the generated
tag through BB's managed Git installer with an empty npm cache and registry
access disabled.

## Boundaries

There is no shared runtime package. Generated SDK declarations and vendored UI stay plugin-local, while repeated setup belongs in the generator. A helper moves under `packages/` only after at least two real plugins depend on the same stable behavior.

The pinned SDK archive under [`vendor/`](vendor/) keeps clean installs reproducible. [`sdk-provenance.json`](vendor/sdk-provenance.json) records where it came from and verifies its contents.
