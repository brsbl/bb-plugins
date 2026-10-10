import { experimental_defineHostEntry } from "@get-bb/plugin-sdk/host";
import { hostContract, hostSignals } from "./contract.js";
import { createEditorHost } from "./editor-host.js";
import { mossEditorHost } from "./editor-host-helpers.js";
import { canonicalWorkspaceRoot, listNotes, openInMoss, readAsset, readNote, revealNote } from "./host-notes.js";
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
    readNote: async (input) => editor.annotate(await readNote(input)),
    listNotes,
    readAsset,
    openInMoss,
    revealNote,
    ...editor.handlers,
  },
  dispose: async () => {
    paths.dispose();
    await editor.dispose();
  },
});
