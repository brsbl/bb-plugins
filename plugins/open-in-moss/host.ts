import { experimental_defineHostEntry } from "@get-bb/plugin-sdk/host";
import { mossHostContract } from "./contract";
import { runOnHost, systemDependencies } from "./open";

export function createMossHostEntry(dependencies = systemDependencies) {
  return experimental_defineHostEntry({
    contract: mossHostContract,
    handlers: {
      probe: ({ path }) => runOnHost(path, false, dependencies),
      open: ({ path }) => runOnHost(path, true, dependencies),
    },
  });
}

export default createMossHostEntry();
