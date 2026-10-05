import { experimental_defineHostEntry } from "@get-bb/plugin-sdk/host";
import { hostContract, hostSignals } from "./contract.js";
import { createEditorHost } from "./editor-host.js";
import { mossEditorHost } from "./editor-host-helpers.js";
import { canonicalWorkspaceRoot, listNotes, openInMoss, readAsset, readNote } from "./host-notes.js";
import { macPathExchange } from "./mac-exchange.js";

// Editing needs an atomic exchange on the note's volume. Where the Mac helper
// cannot provide one (any other platform, or a volume that cannot swap), every
// note answers hostUnsupported and stays in the viewer.
const paths = macPathExchange();
const editor = createEditorHost({ helpers: mossEditorHost, paths, workspaceRoot: canonicalWorkspaceRoot });

export default experimental_defineHostEntry({
  contract: hostContract,
  experimental_signals: hostSignals,
  handlers: {
    // A note the viewer opened may be the source of a paste into an editor.
    readNote: async (input) => {
      const note = await readNote(input);
      if (note.moss && note.noteId !== null) editor.viewed(note.noteId);
      return note;
    },
    listNotes,
    readAsset,
    openInMoss,
    ...editor.handlers,
  },
  dispose: async () => {
    paths.dispose();
    await editor.dispose();
  },
});
