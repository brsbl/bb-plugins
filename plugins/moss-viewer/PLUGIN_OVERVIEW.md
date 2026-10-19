## Requirements and read-only fallback

Requires bb 0.43.4 or newer. Reading needs no separate Moss install or account; the viewer and editor are included.

Editing requires a connected Mac with the Moss app, a note in that Mac user's default Moss workspace, and metadata created by opening the note once in Moss. Saving also requires the bundled macOS atomic-swap helper to work on the note's volume. The helper uses `osascript` and `renamex_np`.

Notes on other operating systems stay read-only, as do unadopted, external and trashed notes or notes on unsupported volumes. The panel explains when a note needs to be opened once in Moss and offers that action when Moss is available on its Mac. Returning to bb refreshes editing eligibility. Opening a note in Moss does not enable editing on a different operating system.

## Read beside your thread

Open a note from a file link, the file picker or a pin. Tabs, tables, callouts, wiki links and note-local media render in a bb panel. Wiki links open another note in the same tab, with Back to return. File and layout changes appear while you read. Other Markdown keeps bb's normal preview.

Use **Send to agent** to put the note in your thread's composer. Select a passage first to include its Markdown and location. You choose when to send it.

## Edit on its Mac

Eligible notes open in Moss's editor with formatting, comments and images. Edits save after you stop typing. If Moss changes the file while you have unsaved edits, the panel offers to reload or keep your version. A last save replaced by Moss can be restored from bb.

## Where notes live

The plugin reads the note, layout and assets on the connected machine that holds them, and saves edits to those same files. The default workspace is resolved from that machine's home directory. A bb server can run elsewhere. Moss HTML blocks run in sandboxed frames that cannot access bb or load external scripts, styles or images.
