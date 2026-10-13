import { defineRpcContract } from "@get-bb/plugin-sdk";
import { z } from "zod";
import { groupSchema, historyInputSchema, interactionSchema, personSchema, viewInputSchema } from "./model.js";
export const contract = defineRpcContract({
  view: { input: viewInputSchema, output: z.object({ groups: z.array(groupSchema), total: z.number().int(), nextOffset: z.number().int().nullable() }).strict() },
  history: { input: historyInputSchema, output: z.object({ items: z.array(interactionSchema), people: z.array(personSchema), nextOffset: z.number().int().nullable() }).strict() },
});

