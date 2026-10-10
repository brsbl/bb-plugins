import { defineRpcContract } from "@get-bb/plugin-sdk";
import { z } from "zod";
import { overridesSchema, settingsSchema } from "./settings.js";

export const CHANGED = "settings-changed";

export const rpcContract = defineRpcContract({
  getSettings: { input: z.object({}).strict(), output: settingsSchema },
  /** Merge the given values; `null` resets a setting to its default. */
  saveSettings: {
    input: z.object({ values: overridesSchema, reset: z.array(z.string()).optional() }).strict(),
    output: settingsSchema,
  },
});
