# Agent guidance

Treat the plugin workspace manifests as the repository inventory and keep user-facing plugin documentation short. Use [`tooling/plugin-catalog-entry.md`](../tooling/plugin-catalog-entry.md) when adding a plugin or refreshing the root catalog; descriptions change only when durable functionality changes, while screenshots change when they no longer represent the current product. Preserve stable package/plugin IDs for the remaining plugins, including `prompt-shaper`, while using their user-facing display names.

Run `npm run check` after repository-wide changes or `npm run check --workspace=<package>` for a focused plugin change. Do not add Design Loop; it is intentionally outside this repository. Do not edit generated `plugin/*` install branches.

Keep generated SDK declarations and vendored UI components plugin-local. Add shared code under `packages/` only after at least two real plugins use the same stable behavior; otherwise prefer `tooling/` or the plugin generator.
