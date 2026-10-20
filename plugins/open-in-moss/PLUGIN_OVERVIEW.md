## Requirements

Moss must be installed on the Mac that holds the Markdown file. Use bb 0.43.4 or newer. When the bb server runs elsewhere, that Mac must be connected to bb. If the file or Moss is unavailable, the link falls back to bb's file viewer.

## Follow a Markdown link

Click a local `.md` or `.markdown` link in bb to open the file in Moss. The plugin checks connected machines for the file; it does not copy the note to another computer. Right-click keeps bb's normal menu.

When several Macs have the same file path, the first host in ID order is selected. An unreachable host does not stop the plugin checking the others.

## Works with Moss Viewer

When Moss Viewer is enabled, links stay in bb's file preview so Moss Viewer can render the note there. Open in Moss does not require an external account or a separate service.
