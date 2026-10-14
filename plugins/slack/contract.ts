import { defineRpcContract } from "@get-bb/plugin-sdk";
import { z } from "zod";
import { identitySchema, tokenSchema } from "./schemas.js";
export const statusSchema = z.object({ connected: z.boolean(), identity: identitySchema.nullable(), missingScopes: z.array(z.string()) });
export type Status = z.infer<typeof statusSchema>;
export const rpcContract = defineRpcContract({
  status: { input: z.object({}), output: statusSchema },
  connect: { input: z.object({ token: tokenSchema }).strict(), output: statusSchema },
  disconnect: { input: z.object({}), output: statusSchema },
});
