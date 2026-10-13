import { defineRpcContract } from "@get-bb/plugin-sdk";
import { z } from "zod";
import { groupSchema, historyInputSchema, interactionSchema, personSchema, viewInputSchema, customerRowSchema, investorRowSchema, priorityInputSchema, rankInputSchema, tierInputSchema, idSchema } from "./model.js";
export const contract = defineRpcContract({
  customers: { input: priorityInputSchema, output: z.object({ items: z.array(customerRowSchema), total: z.number().int(), nextOffset: z.number().int().nullable() }).strict() },
  investors: { input: priorityInputSchema, output: z.object({ items: z.array(investorRowSchema), total: z.number().int(), rankCount: z.number().int(), nextOffset: z.number().int().nullable() }).strict() },
  setRank: { input: rankInputSchema, output: investorRowSchema },
  autoRank: { input: z.object({ id: idSchema }).strict(), output: investorRowSchema },
  setTier: { input: tierInputSchema, output: customerRowSchema },
  view: { input: viewInputSchema, output: z.object({ groups: z.array(groupSchema), total: z.number().int(), nextOffset: z.number().int().nullable() }).strict() },
  history: { input: historyInputSchema, output: z.object({ items: z.array(interactionSchema), people: z.array(personSchema), nextOffset: z.number().int().nullable() }).strict() },
});

