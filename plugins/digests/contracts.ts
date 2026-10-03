import { defineRpcContract } from "@get-bb/plugin-sdk";
import { z } from "zod";
import { connectionSchema, digestDefinitionSchema, issueSchema, SaveDigestSchema } from "./model.js";

const id = z.string().min(1).max(160);
const issueRef = z.object({ threadId: id, id }).strict();
export const rpcContract = defineRpcContract({
  overview: {
    input: z.object({}).strict(),
    output: z.object({
      definitions: z.array(digestDefinitionSchema),
      connections: z.array(connectionSchema),
      actionCardsAvailable: z.boolean(),
      organizerReady: z.boolean(),
    }).strict(),
  },
  saveDigest: { input: SaveDigestSchema, output: digestDefinitionSchema },
  checkConnections: {
    input: z.object({ id: id.optional() }).strict(),
    output: z.array(connectionSchema),
  },
  reconnectConnection: {
    input: z.object({ id }).strict(),
    output: z.object({ message: z.string(), threadId: id }).strict(),
  },
  getIssue: { input: issueRef, output: issueSchema },
  recoveryIssue: { input: z.object({ threadId: id }).strict(), output: issueSchema.nullable() },
  setEnabled: {
    input: z.object({ id, enabled: z.boolean() }).strict(),
    output: digestDefinitionSchema,
  },
  run: {
    input: z.object({ id }).strict(),
    output: z.object({ threadId: id.nullable() }).strict(),
  },
  retry: { input: issueRef, output: z.object({ threadId: id }).strict() },
  reconnect: { input: issueRef, output: z.object({ message: z.string() }).strict() },
});
