# Moss Viewer

Read Moss notes in a bb panel the way Moss renders them, and open them in Moss to edit.

![A Moss note with a wiki link pill and an embedded X post in bb's panel](https://github.com/user-attachments/assets/1f0ba527-c96d-4f11-9083-a2780231f7ef)

## Install

```bash
bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/moss-viewer --yes
```

## Use

Open a Moss note from bb the way you open any file: a file link, the file picker, `bb thread open`, or a File Pins pin. Moss notes are Markdown files under `~/Moss/Notes`, or Markdown that uses Moss blocks such as `:::tabs` or `moss-callout`. They open read-only in the Moss viewer, with tabs, tables, callouts, wiki links, note-local images and video, and post embeds. Other Markdown files keep bb's own preview.

Wiki links open the linked note in the same tab; Back returns to the previous note. **Open in Moss** opens the note in the Moss app on the Mac that holds it.

The note, its `layout.json`, its `assets/` folder, and the list of notes that wiki links resolve against are read on the machine that holds the file, so a bb server on another machine still shows notes from your Mac. Moss HTML blocks show a placeholder for now.

## Develop

From the monorepo root:

```bash
npm ci
npm run check --workspace=bb-plugin-moss-viewer
bb plugin install "path:$PWD/plugins/moss-viewer" --yes
```

The renderer is [`@moss-multi/viewer`](https://github.com/brsbl/moss-multi/tree/m0/packages/viewer), Moss's own editor in read-only mode, vendored under `vendor/moss-viewer/`. [`vendor/moss-viewer.provenance.json`](vendor/moss-viewer.provenance.json) records the CI artifact it came from and how to update it. The server refuses to serve the bundle unless every file matches `viewer.json`.
