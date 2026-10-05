import { defineRpcContract } from "@get-bb/plugin-sdk";
import { z } from "zod";
import { connectionSchema, digestDefinitionSchema, issueSchema, PluginPublishInputSchema, SaveDigestSchema } from "./model.js";

const id = z.string().min(1).max(160);
const issueRef = z.object({ threadId: id, id }).strict();
export const rpcContract = defineRpcContract({
  overview: {
    input: z.object({}).strict(),
    output: z.object({
      definitions: z.array(digestDefinitionSchema),
      startingIds: z.array(z.string()).default([]),
      runErrors: z.record(z.string(), z.string()).default({}),
      connections: z.array(connectionSchema),
      actionCardsAvailable: z.boolean(),
      organizerReady: z.boolean(),
      /** Display names of plugins that own publish-only briefs. */
      pluginNames: z.record(z.string(), z.string()).default({}),
    }).strict(),
  },
  executionOptions: { input: z.object({}).strict(), output: z.object({
    projects: z.array(z.object({ id, name: z.string(), kind: z.enum(["personal", "standard"]) })),
    hosts: z.array(z.object({ id, name: z.string() })),
    environments: z.array(z.object({ id, name: z.string(), projectId: id, hostId: id.nullable() })),
  }) },
  settingsPreferences: { input: z.object({}).strict(), output: z.object({ importBannerDismissed: z.boolean() }).strict() },
  dismissImportBanner: { input: z.object({}).strict(), output: z.boolean() },
  checkSettingsConnections: { input: z.object({}).strict(), output: z.array(connectionSchema) },
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
    output: z.object({ threadId: id.nullable(), pending: z.boolean().optional() }).strict(),
  },
  runStatus: { input: z.object({ id }).strict(), output: z.object({ threadId: id.nullable(), pending: z.boolean().optional() }).strict() },
  retry: { input: issueRef, output: z.object({ threadId: id }).strict() },
  reconnect: { input: issueRef, output: z.object({ message: z.string() }).strict() },
  /** Other plugins publish into a brief they own, keyed by their plugin id and key. */
  publishFromPlugin: { input: PluginPublishInputSchema, output: z.object({ threadId: id }).strict() },
});
