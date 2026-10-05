import { experimental_defineHostEntry } from "@get-bb/plugin-sdk/host";
import { hostContract, hostSignals } from "./contract.js";
import { commitAsset, readNoteFiles, stopWatches, watchNote, writeAssetChunk, writeNoteFiles } from "./host-edit.js";
import { listNotes, openInMoss, readAsset, readNote } from "./host-notes.js";

export default experimental_defineHostEntry({
  contract: hostContract,
  experimental_signals: hostSignals,
  handlers: {
    readNote,
    listNotes,
    readAsset,
    openInMoss,
    readNoteFiles,
    writeNoteFiles,
    watchNote,
    writeAssetChunk,
    commitAsset,
  },
  dispose: stopWatches,
});
