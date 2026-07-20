# UI Patterns bb Plugin

UI Patterns is a card-based gallery of real upstream components in a bb thread side panel. Its visible catalog is deliberately narrow—62 exact vendored shadcn/ui demos and 16 direct assistant-ui previews—while the full four-source Atlas remains available for attribution, source-native resolution, and agent CLI use.

## Browsing experience

Each gallery card contains an immediately visible interactive preview plus the component and implementation identity. Selecting the card header opens a focused detail view whose back affordance, entry identity, documentation link, and any implementation navigation remain sticky while the preview and guidance scroll.

| Source | Gallery behavior | Retained data behavior |
| --- | --- | --- |
| shadcn/ui | 62 exact demos from the pinned registry revision | All 64 source records remain indexed; `toast` and `typography` have no exact mapped preview |
| assistant-ui | 16 direct primitive previews with a local runtime | All 18 source records remain indexed; `queue-item` and `selection-toolbar` have no mapped preview |
| Base UI | Not shown as a standalone visual implementation | All 37 source records and vendored compatibility previews remain available to attribution and source-native CLI resolution |
| WAI-ARIA APG | Keyboard, roles/state guidance, and reference examples appear only beside a corresponding visual implementation | All 30 pattern records remain indexed |

The gallery currently exposes 78 canonical entries. Nineteen include additive APG guidance. Every displayed example is a link to the approved upstream page that demonstrates it; examples without a useful upstream destination are omitted.

The plugin does not register a `navPanel` or ship a separate Atlas design system. The shell uses sanctioned shadcn registry components and bb host theme tokens, and component behavior comes from approved source packages.

## Atlas identity and sources

The Atlas computes one `AtlasEntry` for a safely equivalent concept and retains every contributing `SourceRecord` beneath it.

| Record | Purpose |
| --- | --- |
| `AtlasEntry` | Canonical browsing identity, aliases, attributed summary, kind, contributing record IDs, and example count |
| `SourceRecord` | Source-owned name, summary, canonical URL, sections, links, examples, relationships, and provenance |
| Native ID | The upstream source’s own stable slug or key, namespaced with its provider—for example, `aria-apg:combobox` |

Native IDs provide stable attribution, deep-link resolution, and CLI lookup. They stay in the data and CLI contracts but are intentionally not prominent in the human detail view.

Entries are grouped deterministically from exact normalized names, source-declared aliases, and approved equivalence declarations. Conflicting summaries are omitted instead of reconciled, mixed source kinds remain `mixed`, and `related-to` links never imply equivalence.

The updater may read only the following repositories and paths. `providers/upstreams.json` pins exact revisions; `providers/policy.ts` independently enforces provider, repository, path, and license policy.

| Source | Approved content |
| --- | --- |
| [shadcn/ui](https://ui.shadcn.com/docs/components) | Base component metadata and MDX pages |
| [Base UI](https://base-ui.com/react/overview/quick-start) | React component MDX pages |
| [assistant-ui primitives](https://www.assistant-ui.com/docs/primitives) | Primitive guides and API-reference MDX pages |
| [WAI-ARIA APG](https://www.w3.org/WAI/ARIA/apg/patterns/) | Pattern pages and linked examples |

No other library is an ingestion source.

## bb surfaces and host requirement

| Surface | Behavior |
| --- | --- |
| Thread panel | `threadPanelAction` `library-panel` |
| Prompt box | `composerAccessory` `library-button` opens UI Patterns for the current thread |
| Deep links | `entry/<provider:native-id>` restores a source-native entry |
| Agent/CLI | `bb ui-patterns` and `skills/ui-pattern-atlas/SKILL.md` read the generated Atlas |

The composer launcher depends on the scoped `openThreadPanel` composer-accessory capability in the development bb host/SDK. Packaged bb 0.0.32 does not include that contract, so the launcher is visible in the development host but not the normal 0.0.32 packaged app.

## Agent CLI

The CLI reads the complete generated snapshot and index, including Base UI and source records without gallery previews:

```bash
bb ui-patterns search combobox --json
bb ui-patterns show aria-apg:combobox --json
bb ui-patterns list --provider assistant-ui --json
bb ui-patterns sources --json
bb ui-patterns status --json
```

`show` requires a source-native ID and returns its computed Atlas entry plus every contributing source record. Search and list results can be scoped by approved provider; record type remains descriptive metadata, not a filter.

## Upstream refresh

Provider updates are an explicit build-time operation; the plugin never fetches at runtime.

```bash
npm run update:providers
npm run build:providers
npm run check:providers
```

The update flow downloads each pinned repository revision, reads only approved paths, emits normalized JSON under `providers/sources/`, and updates the input hash lock. The build validates the strict schema and policy, computes entries, and writes the offline snapshot and search index under `generated/`.

Review `providers/upstreams.json` before changing a revision, path, or content policy. A new source requires an explicit policy addition; a compatible license alone does not approve it.

## Development

```bash
npm ci
npm run typecheck
npm test
npm run build
```

`npm run build` regenerates provider artifacts, then calls `bb plugin build` to produce installable output.
