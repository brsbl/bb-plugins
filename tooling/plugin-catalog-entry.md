# Plugin catalog entry template

Use this template when adding a plugin to the root README or when a plugin's durable purpose has changed enough to revise its existing entry. The plugin workspace manifests are the inventory; every workspace under `plugins/*` needs exactly one catalog entry.

## Add a plugin

1. Create the plugin with `npm run new:plugin -- --slug <slug> --name <name> --description <purpose>`.
2. Finish and verify the user-facing workflow before writing catalog copy.
3. Capture one or two representative states from the real bb interface. Store them under `plugins/<slug>/docs/` and reference at least one from both the plugin README and the root README.
4. Add the entry in the same order as `node tooling/plugin-workspaces.mjs`.
5. Run the verification checklist below.

```markdown
### <Display name>

<One or two sentences describing the durable user purpose and core capabilities.>

![<Specific state visible in the screenshot>](plugins/<slug>/docs/<screenshot>.png)

[Source](plugins/<slug>) · [README](plugins/<slug>/README.md)

Install: `bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/<slug> --yes`
```

## Write stable copy

Lead with the job the plugin does, then name only the few capabilities that define that job. Prefer language that will remain true across refactors, dependency updates, and small UI changes.

Do not mention SDK versions, internal APIs, branch names, implementation classes, migration details, or the latest bug fix. Those details belong in the plugin README, pull request, or release notes.

Change an existing description when the plugin gains, loses, or materially changes a core user workflow. Do not rewrite it for visual polish, bug fixes, performance work, dependency or SDK updates, test changes, or implementation refactors when the durable purpose remains the same.

## Update screenshots

- Use the real bb interface and the current plugin source, with a fixture that makes the capability immediately legible.
- Prefer a stable, representative state over an edge case or transient loading state. Add a second image only when one image cannot show another core workflow.
- Keep images in `plugins/<slug>/docs/`. Replace a stale image in place when it demonstrates the same state; add a clearly named image when it demonstrates a distinct capability.
- Write alt text that names what is visibly demonstrated, not merely the plugin name. Do not claim behavior the image does not show.
- Refresh a screenshot when the represented workflow, product chrome, or visual result has materially changed. Routine code changes do not require a new capture.

## Verify the catalog

1. Run `node tooling/plugin-workspaces.mjs` and compare every emitted plugin name and path with the root README.
2. Inspect every referenced image and confirm its file exists, decodes, renders at a useful size, and matches its alt text.
3. Run `npm run hygiene`; it verifies inventory links, install refs, plugin README coverage, and representative screenshot paths.
4. Run `git diff --check` and inspect `git diff -- README.md CONTRIBUTING.md .bb/AGENTS.md tooling/plugin-catalog-entry.md plugins/*/docs` for stale entries or unrelated changes.
