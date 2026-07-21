# Repository tooling

The root tooling makes every plugin follow the same build, validation, scaffolding, and publishing contract. Plugins still own their runtime code, generated SDK declarations, and UI primitives.

## Commands

| Command | Result |
| --- | --- |
| `npm run check` | Runs repository hygiene, the tooling tests, every plugin's typecheck, production build and tests, the scaffold smoke test, built-artifact tests, and artifact validation. |
| `npm run check --workspace=<package>` | Runs the focused check declared by one plugin package. |
| `npm run test:tooling` | Runs the Node test suites for the shared tooling (history reader and bootstrap prompt rendering/validation). |
| `npm run new:plugin -- --slug <slug> --name <name> --description <purpose>` | Generates and catalogs a plugin, installs its dependencies, then typechecks, tests, and builds it. |
| `npm run scaffold:smoke` | Generates temporary cataloged plugins, performs a clean `npm ci`, and proves the template and screenshot catalog stay in sync. |

## Scripts

| Script | Owns |
| --- | --- |
| [`catalog-renderer.mjs`](catalog-renderer.mjs) | The one catalog-to-README renderer shared by scaffolding and hygiene checks. |
| [`build-plugin.mjs`](build-plugin.mjs) | The consistent `bb plugin build` wrapper used by plugin packages. |
| [`check-repository.mjs`](check-repository.mjs) | Catalog, manifest, lockfile, README, screenshot, implicit-skill, nested-workflow, repository-layout, and bootstrap-prompt hygiene. |
| [`validate-plugin-artifacts.mjs`](validate-plugin-artifacts.mjs) | Production bundle and installable-artifact validation for every cataloged plugin. |
| [`create-plugin.mjs`](create-plugin.mjs) | The plugin generator, including package scripts, local SDK declarations, a focused test, and the catalog entry. |
| [`scaffold-smoke.mjs`](scaffold-smoke.mjs) | A clean-room test that prevents the generator and repository rules from drifting apart. |
| [`publish-install-refs.mjs`](publish-install-refs.mjs) | Root-shaped `plugin/<slug>` install refs for bb, updated only when a plugin's published tree changes and never pushed from a dirty worktree. |
| [`bb-history.mjs`](bb-history.mjs) | The shared read-only bb thread-history reader used to personalize history-shaped plugins. |
| [`bootstrap/render-bootstrap.mjs`](bootstrap/render-bootstrap.mjs) | Renders the one bootstrap-prompt template into per-plugin variants and validates their automation commands and permission modes. |

## History personalization

Two plugins are personalizable from bb thread history — Design Doctrine (its rule library) and Improve Prompt (its `prompt-shaper` skill). They share one repository-owned reader and one bootstrap-prompt template so history is a practical, safe input instead of forked query and checkpoint logic.

[`bb-history.mjs`](bb-history.mjs) reads bb's local database (or a `--fixture` JSONL file) read-only and prints new history as previewable JSON or JSONL:

| Capability | How |
| --- | --- |
| Incremental queries | A saved `--state` checkpoint with a `(created_at, segment_id)` cursor. |
| Project / thread / time filters | `--project`, `--thread`, `--since`, `--until`. |
| Concurrency protection | A lease in the state plus a state lock, so two refreshes never advance the same cursor. |
| Redaction | On by default: emails, URLs, bb ids, secrets, and local usernames are removed and identifiers hashed, so output is safe to preview or commit. |
| Preserve in-progress work | `--require-clean <path>` refuses to run while an artifact tree has uncommitted changes. |
| Safe advancement | `scan` takes a lease but never moves the cursor; `advance` commits it only after a successful run; `release` drops a lease without advancing. |

Design Doctrine keeps its own `scripts/scan-history.py`, which follows the same cursor-and-lease contract; the two readers are reconciled, not competing. Plugin-specific interpretation — turning evidence into rules or skill edits — stays in each plugin.

The bootstrap prompts under [`bootstrap/`](bootstrap/) are generated from one template ([`bootstrap-prompt.template.md`](bootstrap/bootstrap-prompt.template.md)) and the `personalization` block on each history-personalizable entry in [`catalog/plugins.json`](../catalog/plugins.json) — the single canonical inventory, not a second plugin list. Copied variants cannot silently drift: repository hygiene re-renders each one and fails on a mismatch, checks that personalization sits on exactly the history-personalizable plugins (no other plugin may carry it), and validates every automation command and permission mode against the verified interface in [`bootstrap/automation-interface.json`](bootstrap/automation-interface.json) so a generated prompt can never ship a stale command or mode. Regenerate with `node tooling/bootstrap/render-bootstrap.mjs --write`.

## SDK provenance

CI and local installs use the pinned SDK archive in [`vendor/`](vendor/) so a clean lockfile install is reproducible. [`sdk-provenance.json`](vendor/sdk-provenance.json) records its package version, integrity, and source. Plugin-local declarations mirror the host-facing contract and are checked for drift.

There is no shared runtime package yet. Shared behavior that two plugins already use — the history reader and the bootstrap-prompt template — lives here in `tooling/`, not in a `packages/` runtime. Repeated setup stays generated tooling and UI primitives stay plugin-local until the same stable behavior is used by at least two real plugins.
