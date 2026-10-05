import { experimental_defineHostEntry } from "@get-bb/plugin-sdk/host";
import { hostContract, hostSignals } from "./contract.js";
import { unsupportedEditorHost } from "./editor-host.js";
import { listNotes, openInMoss, readAsset, readNote } from "./host-notes.js";

// Editing needs moss-multi's host helpers and an atomic exchange on the note's
// volume. Until both ship, every note answers hostUnsupported and stays in the viewer.
const { dispose, ...editor } = unsupportedEditorHost();

export default experimental_defineHostEntry({
  contract: hostContract,
  experimental_signals: hostSignals,
  handlers: { readNote, listNotes, readAsset, openInMoss, ...editor },
  dispose,
});
