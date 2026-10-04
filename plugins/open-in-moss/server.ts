import type { BbPluginApi } from "@get-bb/plugin-sdk";
import { z } from "zod";
import { mossHostContract, pathInput } from "./contract";
import {
  OpenInMossError,
  runOnHost,
  systemDependencies,
  type OpenInMossDependencies,
} from "./open";

export type { OpenInMossDependencies } from "./open";

const requestSchema = pathInput.extend({ hostId: z.string().min(1).optional() });

function errorResponse(
  context: Parameters<Parameters<BbPluginApi["http"]["route"]>[2]>[0],
  error: OpenInMossError,
): Response {
  const body = { ok: false, error: { code: error.code, message: error.message } };
  switch (error.code) {
    case "invalid_path":
    case "not_markdown":
      return context.json(body, 400);
    case "not_found":
      return context.json(body, 404);
    case "not_regular_file":
      return context.json(body, 422);
    case "ambiguous_host":
    case "unsupported_platform":
      return context.json(body, 409);
    case "host_unavailable":
    case "open_failed":
      return context.json(body, 502);
  }
}

export function createOpenInMossPlugin(
  dependencies: OpenInMossDependencies = systemDependencies,
) {
  return async function plugin(bb: BbPluginApi) {
    const hosts = bb.hosts.experimental_client({ contract: mossHostContract });

    async function openFile(path: string, hostId?: string) {
      if (hostId === undefined) {
        // A macOS server that has the file opens it itself, as before host RPC.
        if (dependencies.platform === "darwin" && (await runOnHost(path, false, dependencies)).ok) {
          return runOnHost(path, true, dependencies);
        }
        hostId = await findHost(path);
      }
      try {
        return await hosts.call("open", { path }, { hostId, timeoutMs: 20_000 });
      } catch {
        throw new OpenInMossError("host_unavailable", "The file host could not be reached. Reconnect it and try again.");
      }
    }

    // One unreachable or slow host must not block a host that has the file.
    // When several hosts have the same path, the lowest host ID wins.
    async function findHost(path: string): Promise<string> {
      const connected = (await bb.sdk.hosts.list())
        .filter((host) => host.status === "connected")
        .map((host) => host.id)
        .sort();
      const probes = await Promise.allSettled(
        connected.map((id) => hosts.call("probe", { path }, { hostId: id, timeoutMs: 10_000 })),
      );
      const match = probes.findIndex((probe) => probe.status === "fulfilled" && probe.value.ok);
      if (match !== -1) return connected[match]!;
      const errors = probes.flatMap((probe) =>
        probe.status === "fulfilled" && !probe.value.ok ? [probe.value.error] : []);
      const error = errors.find(({ code }) => code !== "unsupported_platform")
        ?? (errors.length > 0 && errors.length === probes.length ? errors[0] : undefined);
      if (error) throw new OpenInMossError(error.code, error.message);
      throw new OpenInMossError("host_unavailable", "No connected Mac could be checked for this file. Reconnect it and try again.");
    }

    bb.http.route(
      "POST",
      "/open",
      async (context) => {
        const parsed = requestSchema.safeParse(await context.req.json<unknown>().catch(() => null));
        if (!parsed.success) {
          return errorResponse(context, new OpenInMossError(
            "invalid_path", "The request must contain a Markdown file path and, optionally, a non-empty hostId.",
          ));
        }
        try {
          const result = await openFile(parsed.data.path, parsed.data.hostId);
          if (!result.ok) throw new OpenInMossError(result.error.code, result.error.message);
          return context.json({ ok: true, opened: true, path: result.path });
        } catch (error) {
          if (!(error instanceof OpenInMossError)) throw error;
          bb.log.warn(`Open in Moss failed (${error.code}): ${error.message}`);
          return errorResponse(context, error);
        }
      },
      { auth: "local" },
    );
    bb.log.info("Markdown file links will open in Moss on their host");
  };
}

export default createOpenInMossPlugin();
