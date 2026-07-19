---
name: ui-pattern-atlas
description: Use Pattern Atlas for precise, established UI vocabulary and concise interaction guidance when planning, designing, implementing, reviewing, critiquing, or naming an interface; resolving vague terms such as dropdown, alert, popup, panel, search, or command palette; or surveying Category and Record type.
---

# UI Pattern Atlas

Search for the concrete UI noun, inspect the selected stable record ID, then apply the result to the product. Pattern Atlas is lexical and deterministic; the agent still owns product reasoning.

## Query workflow

1. Pull one concrete UI term from the task, product, screenshot, or discussion.
2. Search once:

   ```bash
   bb ui-patterns search "<term>" --json
   ```

3. Read descriptions and match metadata. Keep routed ambiguity candidates distinct.
4. Show the selected stable ID:

   ```bash
   bb ui-patterns show <id> --json
   ```

5. If the boundary remains unclear, show no more than two alternatives.
6. Apply the guidance while preserving the product’s design system, platform conventions, accessibility requirements, and established terminology.

Search covers preferred names, alternate labels, hidden lookup labels, descriptions, details, and the optional search-only subject. It tolerates bounded spelling and prefix variants and ignores common framing words; it does not infer design intent.

Use `data.retrieval.mode` to judge results:

- `exact` and `routed` are direct vocabulary matches.
- `tolerant` used bounded spelling or prefix recovery.
- `expanded` did not match every meaningful term; inspect `match.unmatchedTerms`.

## Inventory work

Use broader commands only for a taxonomy or bounded inventory:

```bash
bb ui-patterns categories --json
bb ui-patterns list --type component --category "<category>" --json
bb ui-patterns list --type pattern --category "<category>" --json
```

Category and Record type are the only inventory filters. `categories` returns the controlled scope notes and tie-break rule.

Intrinsically generative or agentic records remain discoverable through ordinary search:

```bash
bb ui-patterns search "generative AI" --limit 107 --json
```

The result identifies `subject` in `match.fields` when the search-only subject contributes. Do not treat subject or Kind as another filter.

## Decision output

Summarize the query, canonical candidate or candidates, selected record and distinguishing boundary, and any directional see-also records that change the plan. Do not paste raw JSON.

If no useful match appears, shorten the query once. Then use `categories` plus `list` for a bounded slice. If that fails, say so and continue with product evidence.

## Common ambiguity checks

| Informal term | Inspect |
| --- | --- |
| `dropdown` | Select, Combobox, and Menu |
| `sidebar` | Side navigation, Panel, and Drawer |
| `pill` | Badge, Tag, and Chip |
| `alert` | Inline alert, Banner, Alert dialog, and Toast where relevant |
| `popup` | Popover, Menu, Dialog, Tooltip, and related disclosure surfaces |
| `search` | Search field, Search and filtering, and Command palette |

Treat this table as query guidance, not a substitute for current CLI results.

## Sources and recovery

Entries omit per-entry citations. Retrieve the library-level register when provenance matters:

```bash
bb ui-patterns sources --json
```

If the top-level command is unavailable, try:

```bash
bb plugin run ui-patterns search "<term>" --json
```

If both forms fail, report that Pattern Atlas is unavailable and continue with product evidence.
