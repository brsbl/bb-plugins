import { experimental_defineHostEntry } from "@get-bb/plugin-sdk/host";
import { hostContract } from "./contract.js";
import { home, inspect, openMossNote, resolveFile, recentFiles } from "./host-files.js";

export default experimental_defineHostEntry({
  contract: hostContract,
  handlers: { home, inspect, resolveFile, openMossNote, recentFiles },
});
