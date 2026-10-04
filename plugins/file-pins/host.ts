import { experimental_defineHostEntry } from "@get-bb/plugin-sdk/host";
import { hostContract } from "./contract.js";
import { home, inspect, mossRoot, openMossNote, resolveFile, recentFiles } from "./host-files.js";

export default experimental_defineHostEntry({
  contract: hostContract,
  handlers: { home, inspect, mossRoot, resolveFile, openMossNote, recentFiles },
});
