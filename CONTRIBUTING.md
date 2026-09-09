# Contributing

Run the repository check before publishing a change:

```bash
npm ci
npm run check
```

Use `npm run new:plugin -- --slug <slug> --name <name> --description <purpose>` to create a plugin, install dependencies, and run its first typecheck, test, and build. Use npm 11 or newer for that command and for `npm run scaffold:smoke`: the npm 10 bundled with Node 22 crashes with `Cannot read properties of null (reading 'edgesOut')` while resolving vitest 4's optional peers now that vitest 5 is published. Add its screenshot and root README entry with the [plugin catalog entry template](tooling/plugin-catalog-entry.md) before opening a PR.

Keep stable package and plugin IDs even when a display name changes. Plugins own generated SDK declarations and vendored UI primitives; extract code only after the same behavior is proven in at least two plugins. See [repository tooling](tooling/README.md) for the build, validation, scaffolding, and publishing boundaries.

CI publishes each validated `plugins/<slug>` subtree to its generated `plugin/<slug>` branch. Edit `main`, never an install branch.
