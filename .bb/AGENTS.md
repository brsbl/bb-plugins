# Agent guidance

Treat the plugin workspace manifests as the repository inventory and keep user-facing plugin documentation short. Preserve stable package/plugin IDs, including `omega` and `prompt-shaper`, while using the display names Omegacode and Improve Prompt.

Run `npm run check` after repository-wide changes or `npm run check --workspace=<package>` for a focused plugin change. Do not add Design Loop; it is intentionally outside this repository. Do not edit generated `plugin/*` install branches.

Keep generated SDK declarations and vendored UI components plugin-local. Add shared code under `packages/` only after at least two real plugins use the same stable behavior; otherwise prefer `tooling/` or the plugin generator.
