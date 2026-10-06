# @moss-multi/editor

## 0.1.0

API version 1 (`src/contract.ts`), no feature strings.

- **`mountMossEditor`** mounts moss's own editor at the pin, editable, on one note of a host's Moss workspace: the
  title field, the body with moss's shortcuts, slash menu and formatting, every node family, and moss's comment UI
  (Cmd+Shift+A, the gutter, threads, replies, resolve). Comments are stored as Moss desktop stores them: `%%m:`
  markers in the markdown and `comments.json`.
- **Byte-compatible saves.** Every save writes the bytes Moss desktop's own save path writes for the same edit:
  the markdown (`<folder>.md`, legacy names moved), `comments.json`, `layout.json` and `meta.json`, and the folder
  rename a title edit causes. CI holds this to desktop's code at the pin, file by file.
- **Files only through the host.** Reads, writes, companions and media go through the host's `MossEditorBridge`;
  the frame has no network and no file system. Writes carry the version they were based on, and a stale write is
  refused by the host and shown as "Changed in Moss" with Reload, Keep editing and Overwrite.
- **Autosave on desktop's timing** (1.5 s idle, a 15 s cap checked on edits, a 30 min safety net), `flush()` before
  hiding or quitting, `unmount()` that keeps unsaved edits unless told to drop them, drafts and save receipts.
- **Release:** `moss-editor-<version>.tgz` unpacks to `moss-editor/` with `moss-editor.js`, `moss-editor.css`,
  `moss-editor-host.js`, `moss-html-frame.html` and `editor.json` (version, API, moss pin, source commit, CI run,
  per-file SHA-256 and the frame's CSP).

### Not in 0.1.0

- External `.md` files, trashed and unadopted notes open in the viewer (`noteEditability`).
- No asset garbage collection, no automatic merge with concurrent Moss edits (M7), no Properties panel.
- Remote images stay remote references; a cross-note paste of a host-issued URL is not yet recognised.
