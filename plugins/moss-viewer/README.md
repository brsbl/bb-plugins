# Moss Viewer

Read and edit Moss notes in a bb panel the way Moss does, saving to the note's files on your Mac.

![A Moss note with a wiki link pill and an embedded X post in bb's panel](https://github.com/user-attachments/assets/1f0ba527-c96d-4f11-9083-a2780231f7ef)

## Install

```bash
bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/moss-viewer --yes
```

## Use

Open a Moss note from bb the way you open any file: a file link, the file picker, `bb thread open`, or a File Pins pin. Moss notes are Markdown files under `~/Moss/Notes`, or Markdown that uses Moss blocks such as `:::tabs` or `moss-callout`. Other Markdown files keep bb's own preview.

Notes in `~/Moss/Notes` on a Mac open in Moss's own editor: type with Moss's shortcuts, slash menu and formatting, add images, and comment as you would in Moss. Edits save a moment after you stop typing, to the note's own files, written the way Moss writes them; the header shows **Saving…** and **Saved**. If Moss changes the note while you have unsaved edits, the editor shows **Changed in Moss** so you can reload or keep your version, and bb never overwrites what Moss wrote. If Moss later replaces a save you made in bb, **Restore your last save from bb** brings it back.

Other Moss notes open read-only in the Moss viewer, with tabs, tables, callouts, wiki links, note-local images and video, and post embeds: Markdown with Moss blocks outside `~/Moss/Notes`, notes Moss hasn't opened yet, trashed and external notes, and notes on machines other than a Mac.

Wiki links open the linked note in the same tab; Back returns to the previous note. **Open in Moss** opens the note in the Moss app on the Mac that holds it.

The note, its `layout.json`, its `assets/` folder, and the list of notes that wiki links resolve against are read on the machine that holds the file, so a bb server on another machine still shows notes from your Mac. Moss HTML blocks run live in sandboxed frames. A block can't reach bb, and its page policy keeps it from loading scripts, styles or images from the web.

## Develop

From the monorepo root:

```bash
npm ci
npm run check --workspace=bb-plugin-moss-viewer
bb plugin install "path:$PWD/plugins/moss-viewer" --yes
```

The renderer is [`@moss-multi/viewer`](https://github.com/brsbl/moss-multi/tree/viewer-v1.0.0/packages/viewer), Moss's own editor in read-only mode, vendored under `vendor/moss-viewer/`. [`vendor/moss-viewer.provenance.json`](vendor/moss-viewer.provenance.json) records the GitHub Release it came from and how to update it. The server refuses to serve the bundle unless every file matches `viewer.json`.

The editor is [`@moss-multi/editor`](https://github.com/brsbl/moss-multi/releases/tag/editor-v0.1.0), vendored under `vendor/moss-editor/` with its contract types in `vendor/moss-editor.contract.d.ts`; [`vendor/moss-editor.provenance.json`](vendor/moss-editor.provenance.json) records the release. The server serves it only when every file matches `editor.json`. The Mac host saves through the editor's file bridge (`editor-host.ts`, `editor-write.ts`): each file is swapped in atomically and checked against what was read, so a save that races Moss never destroys Moss's bytes. The swap uses `renamex_np` through a long-lived `osascript -l JavaScript` helper (`mac-exchange.ts`); where that cannot run, notes stay read-only.
