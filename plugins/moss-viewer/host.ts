import { experimental_defineHostEntry } from "@get-bb/plugin-sdk/host";
import { hostContract } from "./contract.js";
import { listNotes, openInMoss, readAsset, readNote } from "./host-notes.js";

export default experimental_defineHostEntry({
  contract: hostContract,
  handlers: { readNote, listNotes, readAsset, openInMoss },
});
