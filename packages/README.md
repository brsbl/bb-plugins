# Shared packages

`thread-history-maintenance` is the shared idle-episode queue used by Improve Prompt and Design Doctrine. It keeps per-thread checkpoints, leases bounded timeline batches, and periodically reconciles the thread inventory after downtime.

`website-icons` is the bounded public-origin favicon resolver and cache used by Compact Links and Pinned Files.

Plugin-owned SDK declarations and vendored UI primitives stay plugin-local. Other behavior remains in a plugin until at least two real plugins need the same stable contract.
