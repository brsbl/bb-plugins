# Import provenance

All five installed or recovered personal plugins were copied into this repository without changing their source checkouts. Clean repositories were imported with history; uncommitted UI Patterns work was recorded as a separate snapshot commit.

| Plugin | Imported source | Source revision | Monorepo record | Notes |
| --- | --- | --- | --- | --- |
| Design Doctrine | `brsbl/design-doctrine` | `7ed31d67a1dec62f31a3229a76390a551876ce7f` | Git subtree history | Clean `main`. |
| Improve Prompt | `brsbl/bb-plugin-prompt-shaper` | `ea3d6a339f9f6875f2cbe1b9f0e61a482ef363dd` | Git subtree history | Renamed only at the display layer. Rejected bb core PR #808 was not imported. |
| Omegacode | Local installed snapshot | Tree SHA-256 `4f04de5c26cf0059b86b5b5c32211e3db0baf3ff0afa7d878a2aab32e5c16b6d` | `c292c4c` plus ownership fix `538846a` | Stable package/plugin identity remains `bb-plugin-omega` / `omega`. |
| Thread Hover Cards | `brsbl/bb-plugin-thread-hover-cards` | `24414f09407fe6a9cd433972a530c2771ac8dc76` | Git subtree history | Imported from final green remote `main`. |
| UI Patterns | Recovered local checkout | Base `1e8dc681d01ee26abab3c85b4759bdcccb5590c3`; source tree SHA-256 `1e2cecd5bda13eddff8edb5cbf28a180536a740427dc38151ae0eb553a67ec5f` | Base subtree plus snapshot `63b018c` | Original dirty checkout is unchanged; snapshot contained 205 untracked files. |

Design Loop was excluded because it was stale local source and was not installed. The original repositories remain available for migration and are not archived or deleted.

The vendored `@bb/plugin-sdk` testing archive comes from official bb `main` commit `6e72cd0276947b400b4e5862668d855051ba2060`; its exact archive hash is recorded in `tooling/vendor/sdk-provenance.json`.
