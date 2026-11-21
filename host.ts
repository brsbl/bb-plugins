import { experimental_defineHostEntry } from "@get-bb/plugin-sdk/host";
import { hostContract } from "./contract.js";
import { inspect, openInMoss, resolveFile, search, systemDeps } from "./host-files.js";

export function createHostEntry(deps = systemDeps) {
  return experimental_defineHostEntry({
    contract: hostContract,
    handlers: {
      search: (input) => search(input, deps),
      resolveFile: (input) => resolveFile(input, deps),
      inspect: (input) => inspect(input, deps),
      openInMoss: (input) => openInMoss(input, deps),
    },
  });
}

export default createHostEntry();
