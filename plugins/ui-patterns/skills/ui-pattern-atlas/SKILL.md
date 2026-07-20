---
name: ui-pattern-atlas
description: Use Pattern Atlas v3 for source-native UI vocabulary and explicit provenance when planning, designing, implementing, reviewing, critiquing, or naming an interface.
---

# UI Pattern Atlas

Search for one concrete UI noun, inspect an explicit provider-native ID, then apply the result to the product. Pattern Atlas is lexical and deterministic; the agent still owns product reasoning.

## Query workflow

1. Pull one concrete UI term from the task, product, screenshot, or discussion.
2. Search once:

   ```bash
   bb ui-patterns search "<term>" --json
   ```

3. Read the candidates and provenance. Keep provider records distinct; the Atlas does not choose a preferred library.
4. Show one provider-native ID:

   ```bash
   bb ui-patterns show aria-apg:combobox --json
   ```

5. If the boundary remains unclear, show no more than two alternatives.
6. Apply the guidance while preserving the product’s design system, platform conventions, accessibility requirements, and established terminology.

Search covers source-native names, aliases, IDs, and concise paraphrases. It tolerates bounded spelling and prefix variants; it does not infer design intent.

Use `data.retrieval.mode` to judge results:

- `exact` is a direct vocabulary match.
- `tolerant` used bounded spelling or prefix recovery.
- `expanded` is a looser lexical result; inspect `match.unmatchedTerms`.

## Compatibility

For one compatibility release, a v2 slug never selects a source on the agent’s behalf. Both commands below return `data.status: "deprecated"`, a deprecation code, and sorted provider-native candidates:

```bash
bb ui-patterns show button --json
bb ui-patterns show entry/button --json
```

Choose a returned ID such as `aria-apg:button` or `html:button` and show it explicitly. Do not use legacy Category, see-also, or ambiguity-route metadata to make the choice.

## Inventory work

Use broader commands only for a bounded provider inventory:

```bash
bb ui-patterns list --provider aria-apg --json
bb ui-patterns list --type pattern --json
```

`--provider` and source-native `--type element|pattern` are the inventory filters. `--type component` is accepted only as a v2 compatibility alias for `element`; `--category` is explicitly retired.

## Decision output

Summarize the query, source-native candidate or candidates, selected record, and the provenance that matters to the decision. Do not paste raw JSON.

If no useful match appears, shorten the query once. Then use `list --provider` for a bounded slice. If that fails, say so and continue with product evidence.

## Provenance, status, and recovery

Every v3 record includes `provider`, `canonicalUrl`, `upstreamRevision`, `retrievedAt`, `license`, and `contentMode`. Retrieve the provider register or readiness state when needed:

```bash
bb ui-patterns sources --json
bb ui-patterns status --json
```

If the top-level command is unavailable, try:

```bash
bb plugin run ui-patterns search "<term>" --json
```

If both forms fail, report that Pattern Atlas is unavailable and continue with product evidence.
