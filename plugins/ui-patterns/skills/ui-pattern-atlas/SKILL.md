---
name: ui-pattern-atlas
description: Use the approved-source UI Pattern Atlas for established vocabulary and attributable upstream guidance when planning, designing, implementing, reviewing, critiquing, or naming an interface.
---

# UI Pattern Atlas

Search for a concrete UI noun, inspect the computed entry and its source records, then apply the relevant upstream guidance to the product. The Atlas is deterministic and source-attributed; the agent still owns product reasoning.

## Query workflow

1. Pull one concrete UI term from the task, product, screenshot, or discussion.
2. Search once:

   ```bash
   bb ui-patterns search "<term>" --json
   ```

3. Read the returned entry’s `sourceRecordIds`. Each value is a source-native ID: the upstream source’s own stable slug or key, namespaced with its provider for attribution and exact resolution.
4. Show one contributing source-native ID:

   ```bash
   bb ui-patterns show aria-apg:combobox --json
   ```

5. Compare the returned `sourceRecords` only when their source-owned guidance differs in a way that matters to the task.
6. Apply the guidance while preserving the product’s design system, platform conventions, accessibility requirements, and established terminology.

Search covers entry names and aliases plus source-owned summaries, native IDs,
sections, kinds, and relationships. `data.retrieval.mode` is `exact` or
`prefix`.

## Inventory work

Use broader commands only for a bounded slice:

```bash
bb ui-patterns list --provider assistant-ui --json
bb ui-patterns list --provider aria-apg --json
```

The approved provider IDs are `shadcn-ui`, `base-ui`, `assistant-ui`, and `aria-apg`. Record type is descriptive metadata, not an inventory filter.

## Decision output

Summarize the query, selected entry, and the source guidance that materially affected the decision. Attribute source-owned statements to their source and link its canonical URL when useful. Do not paste raw JSON.

If no useful match appears, shorten the query once. Then use `list --provider` for a bounded source inventory. If that fails, say so and continue with product evidence.

## Sources and recovery

Retrieve the approved source register or generated-snapshot status when needed:

```bash
bb ui-patterns sources --json
bb ui-patterns status --json
```

If the top-level command is unavailable, try:

```bash
bb plugin run ui-patterns search "<term>" --json
```

If both forms fail, report that UI Pattern Atlas is unavailable and continue with product evidence.
