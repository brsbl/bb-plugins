# Contributing

Run the repository check before publishing a change:

```bash
npm ci
npm run check
```

Use `npm run new:plugin -- --slug <slug> --name <name> --description <purpose>` to create a plugin, add it to the catalog, install dependencies, and run its first typecheck, test, and build. Add `--surface <surface>` for each primary bb surface.

Keep stable package and plugin IDs even when a display name changes. Plugins own generated SDK declarations and vendored UI primitives; extract code only after the same behavior is proven in at least two plugins. See [repository tooling](tooling/README.md) for the build, validation, scaffolding, and publishing boundaries.

CI publishes each validated `plugins/<slug>` subtree to its generated `plugin/<slug>` branch. Edit `main`, never an install branch.
