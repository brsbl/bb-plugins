import { experimental_defineHostEntry } from "@get-bb/plugin-sdk/host";
import { hostContract } from "./contract.js";
import { readChanges, readPullRequest } from "./github.js";

export default experimental_defineHostEntry({
  contract: hostContract,
  handlers: {
    read: (input, context) => readPullRequest(input, undefined, context.signal),
    changes: (input, context) => readChanges(input, undefined, context.signal),
  },
});
