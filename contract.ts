import { defineRpcContract } from "@get-bb/plugin-sdk";
import { z } from "zod";
import { overridesSchema, stateSchema } from "./settings.js";

export { CHANGED } from "./settings.js";

export const rpcContract = defineRpcContract({
  getState: { input: z.object({}).strict(), output: stateSchema },
  /** Merge override values; `reset` removes overrides so the source or fallback applies. */
  saveSettings: {
    input: z.object({ values: overridesSchema, reset: z.array(z.string()).optional() }).strict(),
    output: stateSchema,
  },
});
