import { experimental_defineHostEntry } from "@get-bb/plugin-sdk/host";
import { hostContract, hostSignals } from "./contract.js";
import { unsupportedEditorHost } from "./editor-host.js";
import { listNotes, openInMoss, readAsset, readNote } from "./host-notes.js";

// Editing needs moss-multi's host helpers and an atomic exchange on the note's
// volume. Until both ship, every note answers hostUnsupported and stays in the viewer.
const editor = unsupportedEditorHost();

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
  dispose: editor.dispose,
});
