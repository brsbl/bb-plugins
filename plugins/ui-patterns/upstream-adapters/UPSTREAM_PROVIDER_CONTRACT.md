# Offline upstream provider contract

Provider-kernel integration consumes verified, pinned upstream metadata through these adapters; it does not fetch, scrape, execute, install, or copy upstream assets at runtime.

## Kernel record

Every adapter returns this immutable, source-preserving shape. `upstreamId`, `title`, and `native` values come directly from the pinned upstream metadata; this layer does not create Atlas definitions or summaries.

| Field | Contract |
| --- | --- |
| `contractVersion` | `1` for this provider-kernel boundary. |
| `providerId` | Stable source identifier: `w3c-aria-apg`, `base-ui`, or `carbon`. |
| `upstreamId` | The source's own stable path or component identifier. |
| `title` | The source-supplied title. |
| `native.sections`, `native.tags`, `native.aliases` | Source-supplied labels only. Arrays may be empty when the source offers no alias surface. |
| `canonicalUrls.docs`, `.example`, `.code` | HTTPS canonical source locations. The code location is revision-pinned. |
| `provenance` | Upstream revision, retrieval time, SHA-256, license identifier/URL, explicit content mode, and excerpt attribution when applicable. |

## Fixture and verification rules

Fixtures are small JSON extracts kept in `fixtures/`. Their SHA-256 covers the deterministic JSON payload made from provenance revision/time, license/content mode, native metadata, and URLs; the checksum field itself is excluded. Adapters reject a checksum mismatch, a non-HTTPS URL, an unapproved source host, an unknown content mode, or any excerpt in a `metadata-only` fixture.

Only `metadata-only` fixtures are committed now. A future `licensed-excerpt` fixture must carry both its exact upstream excerpt and the required attribution, with the license allowing that reuse. No adapter may turn upstream material into an Atlas definition, summary, visual, or executable component.

## Integration boundary

The provider kernel should call `parsePinnedUpstreamFixture(providerId, fixture)` during its explicit offline ingest/build step, then persist or merge the returned records under its own ownership rules. The current UI Patterns plugin does not import these modules, so the existing runtime remains network-free and behaviorally unchanged.
