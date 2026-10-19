# Moss Viewer

Read Moss notes beside your bb thread, and edit eligible notes on their Mac.

![A Moss note in Moss's own editor in bb's panel after a save, with a quiet header](https://github.com/user-attachments/assets/72e28ca7-3c9c-46b3-bca9-035f064c1fd3)

## Requirements and read-only fallback

Requires bb 0.43.4 or newer. Reading needs no separate Moss install or account; the viewer and editor are bundled with the plugin.

**Editing requires a connected Mac, the Moss app, and a note in that Mac user's default Moss workspace that Moss has opened at least once.** Opening the note in Moss creates the metadata that identifies it as an adopted note. Saving also requires the bundled macOS atomic-swap helper to run on the note's volume; it uses `osascript` and `renamex_np`.

**Other hosts and ineligible notes stay read-only.** This includes notes not yet adopted by Moss, notes outside the default workspace, trashed or external notes, and volumes where atomic swapping is unavailable. An unadopted note explains that it must be opened once in Moss; on a Mac with Moss available, the panel offers **Open in Moss**. Return to bb after opening it to refresh its eligibility. Adoption alone does not enable editing on Linux or Windows.

The workspace is resolved from the file host's home directory. No account-specific path is configured. A bb server on another machine can read notes from a connected Mac.

## Install

```bash
bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/moss-viewer --yes
```

## Use

Open a Moss note from bb the way you open any file: a file link, the file picker, `bb thread open`, or a pin from Pinned Files & Links. Moss notes are Markdown files in the file host’s default Moss notes workspace, or Markdown that uses Moss blocks such as `:::tabs` or `moss-callout`. Other Markdown files keep bb's own preview.

Eligible notes in the default workspace on a Mac open in Moss's own editor: type with Moss's shortcuts, slash menu and formatting, add images, and comment as you would in Moss. Edits save a moment after you stop typing, to the note's own files, written the way Moss writes them. The header stays quiet while edits save, and says **Saving…** only if a save takes more than a couple of seconds, or **Not saved** if one fails. If Moss changes the note while you have unsaved edits, the editor shows **Changed in Moss** so you can reload or keep your version, and bb never overwrites what Moss wrote. If Moss later replaces a save you made in bb, **Restore your last save from bb** brings it back.

Other Moss notes open read-only in the Moss viewer, with tabs, tables, callouts, wiki links, note-local images and video, and post embeds: Markdown with Moss blocks outside the default workspace, notes Moss hasn't opened yet, trashed and external notes, and notes on machines other than a Mac.

Wiki links open the linked note in the same tab; Back returns to the previous note. The header matches bb's file preview: click the path to copy it, **Show in Finder** reveals the note on the Mac that holds it, and **Open in Moss** opens it in the Moss app there. In a narrow panel the buttons fold into the **Note actions** menu. **Hide header** (the chevron at the end) leaves just bb's tab. Point at the top edge of the note, or tab into it, and the header slides down over the note; it slides back up when you move away. **Keep header shown** brings it back for good. The panel remembers the choice. A note in the viewer follows its file: when the note or its `layout.json` changes on disk, the panel shows the new version where you were reading.

**Send to agent**, at the right of the header, puts a pill for the note in the composer of the thread the panel belongs to, so you can add a message and send it. Select text first to share that passage too. When you send, the agent gets the note's path, the machine that holds it, its Moss link, and the selection: its Markdown, its lines in the file, and the headings above it. A selection over 20,000 characters is cut, and the agent is told to read the rest from the file.

The note, its `layout.json`, its `assets/` folder, and the list of notes that wiki links resolve against are read on the machine that holds the file, so a bb server on another machine still shows notes from your Mac. Moss HTML blocks run live in sandboxed frames. A block can't reach bb, and its page policy keeps it from loading scripts, styles or images from the web.

## Develop

From the monorepo root:

```bash
npm ci
npm run check --workspace=bb-plugin-moss-viewer
bb plugin install "path:$PWD/plugins/moss-viewer" --yes
```

The renderer is [`@moss-multi/viewer`](https://github.com/brsbl/moss-multi/tree/viewer-v1.1.0/packages/viewer), Moss's own editor in read-only mode, vendored under `vendor/moss-viewer/`. [`vendor/moss-viewer.provenance.json`](vendor/moss-viewer.provenance.json) records the GitHub Release it came from and how to update it. The server refuses to serve the bundle unless every file matches `viewer.json`.

The editor is [`@moss-multi/editor`](https://github.com/brsbl/moss-multi/releases/tag/editor-v0.2.0), vendored under `vendor/moss-editor/` with its contract types in `vendor/moss-editor.contract.d.ts`; [`vendor/moss-editor.provenance.json`](vendor/moss-editor.provenance.json) records the release. The server serves it only when every file matches `editor.json`. The Mac host saves through the editor's file bridge (`editor-host.ts`, `editor-write.ts`): each file is swapped in atomically and checked against what was read, so a save that races Moss never destroys Moss's bytes. The swap uses `renamex_np` through a long-lived `osascript -l JavaScript` helper (`mac-exchange.ts`); where that cannot run, notes stay read-only.
