import { defineRpcContract } from "@get-bb/plugin-sdk";
import { z } from "zod";
export const statusSchema = z.object({ state: z.enum(["needs_client", "not_connected", "connected", "reconnect"]), account: z.string().nullable() });
export const contract = defineRpcContract({
  status: { input: z.object({}), output: statusSchema },
  connectStart: { input: z.object({}), output: z.object({ authUrl: z.string() }) },
  connectFinish: { input: z.object({ redirectUrl: z.string().max(8000) }).strict(), output: statusSchema },
  disconnect: { input: z.object({}), output: statusSchema },
});
