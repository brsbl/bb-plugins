# UI Patterns bb Plugin

UI Patterns is a read-only browser for provider-owned UI guidance and components. It preserves bb navigation, thread-panel, composer, deep-link, CLI, and agent-skill access while keeping definitions, examples, and implementations canonical at their upstream source.

## Source browser

Every rendered record is a source-native `SourceItem`, not an Atlas entry. The browser never merges same-name records or invents cross-library equivalence.

| Field | Browser behavior |
| --- | --- |
| Identity | Uses `providerId:nativeId`, such as `aria-apg:combobox` |
| Attribution | Shows the upstream title, library, native kind, and native section |
| Content | Shows an excerpt only when its provider policy permits it |
| Freshness | Shows the upstream retrieval date and revision in detail |
| Handoff | Links to canonical documentation and available example/code URLs |

Exact same-title groups are visual scanning aids only. Each card remains an independently attributable upstream record.

## bb surfaces

| Surface | Behavior |
| --- | --- |
| Navigation | `navPanel` at `/plugins/ui-patterns/library/*` |
| Deep links | `entry/<provider:native-id>` restores a source detail and browser history |
| Thread panel | `threadPanelAction` `library-panel` |
| Composer | `composerAccessory` `library-button` opens the navigation panel on SDK 0.4.0 |
| Agent/CLI | `bb ui-patterns` and `skills/ui-pattern-atlas/SKILL.md` share the provider-backed index |

The shell uses the sanctioned shadcn registry components and bb host theme tokens. It does not ship an Atlas design system or locally authored previews.

## Agent CLI

The versioned CLI preserves the existing `bb ui-patterns` surface while exposing source-native identities and provenance:

```bash
bb ui-patterns search combobox --json
bb ui-patterns show aria-apg:combobox --json
bb ui-patterns list --provider aria-apg --type pattern --json
bb ui-patterns sources --json
bb ui-patterns status --json
```

Legacy unqualified identities return an explicit deprecation with provider-native candidates; the CLI does not silently choose a preferred library.

## Development

```bash
npm ci
npm run typecheck
npm test
npm run build
```

`npm run build` calls `bb plugin build` to produce installable artifacts. The package intentionally does not include stale prebuilt artifacts; build it on a bb host with the matching plugin SDK.
