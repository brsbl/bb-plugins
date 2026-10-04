import type { BbPluginApi } from "@get-bb/plugin-sdk";
import type { z } from "zod";
import type { Connection, DigestDefinition, ExplicitEnvironmentSchema } from "./model.js";

export class ExecutionError extends Error {}
export type ExecutionTarget = { projectId: string; environment: z.infer<typeof ExplicitEnvironmentSchema> };

/** Resolve before dispatch; project-default otherwise chooses the server's host. */
export async function executionTarget(bb: BbPluginApi, definition: Pick<DigestDefinition, "projectId" | "environment" | "execution">, connections: Connection[]): Promise<ExecutionTarget> {
  const hosts = [...new Set(connections.map((connection) => connection.browserHostId).filter(Boolean))];
  const hostId = definition.execution?.hostId ?? (hosts.length === 1 ? hosts[0] : null);
  if (!hostId) throw new ExecutionError("Choose the computer with your browser sign-ins for this brief, then Retry.");
  let host;
  try { host = await bb.sdk.hosts.get({ hostId }); }
  catch { throw new ExecutionError("This digest’s computer is unavailable. Reconnect it to bb, then Retry."); }
  if (host.status !== "connected") throw new ExecutionError(`${host.name} is offline. Open bb on that computer, then Retry.`);

  const projectId = definition.execution?.projectId ?? definition.projectId;
  const environmentId = definition.execution?.environmentId ?? (definition.environment.type === "reuse" ? definition.environment.environmentId : undefined);
  if (environmentId) {
    let environment;
    try { environment = await bb.sdk.environments.get({ environmentId }); }
    catch { throw new ExecutionError("This digest’s workspace is unavailable. Choose another workspace, then Retry."); }
    if (environment.projectId !== projectId || environment.hostId !== hostId || environment.status !== "ready" || environment.lifecycle.phase !== "active") {
      throw new ExecutionError("This digest needs a ready workspace on its selected computer. Choose another workspace, then Retry.");
    }
    return { projectId, environment: { type: "reuse", environmentId } };
  }

  const projects = await bb.sdk.projects.list({ includePersonal: true });
  const personal = projects.find((project) => project.kind === "personal");
  const selected = definition.execution ? projects.find((project) => project.id === projectId) : personal;
  if (selected?.kind === "personal") {
    const providers = await bb.sdk.environments.listProviders({ projectId: selected.id, hostId });
    if (providers.some((provider) => provider.id === "personal-workspace" && (!provider.availability || provider.availability.status === "available"))) {
      return { projectId: selected.id, environment: { type: "host", hostId, workspace: { type: "personal" } } };
    }
  }
  // The original project is a user-selected fallback, resolved only on the
  // browser computer. Never infer another host or reuse an arbitrary checkout.
  const fallback = projects.find((project) => project.id === projectId);
  const sources = fallback?.sources.filter((source) => source.hostId === hostId) ?? [];
  const source = sources.find((candidate) => candidate.isDefault) ?? (sources.length === 1 ? sources[0] : undefined);
  if (!source) throw new ExecutionError("Personal workspace isn’t available on this computer. Choose a project and workspace for this brief, then Retry.");
  return { projectId, environment: { type: "host", hostId, workspace: { type: "unmanaged", path: source.path } } };
}

export function executionFailure(error: unknown): string {
  if (error instanceof ExecutionError) return error.message;
  return "Couldn’t open this brief’s workspace on its computer. Check that the computer is connected and the workspace is available, then Retry.";
}
