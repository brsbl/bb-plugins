# Experimental API audit

- `rpcContract.experimental_addRule`: accepts the shared harvest rule fields with
  structured private evidence (`thread`, exact user `quote`, anonymous `summary`)
  and `originThreadId`. Returns `proposalId`, source `threadId`, `verdict`, and
  `reason`. Persists before returning, reuses harvest review and publication, and
  leaves direct rule PRs pending merge approval. CLI: `bb doctrine add --json`.
  Agent tool: `design_doctrine_add` (origin supplied by tool context).
