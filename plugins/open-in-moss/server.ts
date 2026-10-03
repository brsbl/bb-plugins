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
    const hosts = bb.hosts?.experimental_client?.({ contract: mossHostContract });

    async function openFile(path: string, hostId?: string) {
      if (!hosts) {
        if (hostId !== undefined) {
          throw new OpenInMossError("host_unavailable", "This bb version cannot open a file on another host.");
        }
        return runOnHost(path, true, dependencies);
      }

      try {
        if (hostId === undefined) {
          const connected = (await bb.sdk.hosts.list()).filter((host) => host.status === "connected");
          if (connected.length === 0) {
            throw new OpenInMossError("host_unavailable", "No file host is connected.");
          }
          const probes = await Promise.all(connected.map(async (host) => ({
            hostId: host.id,
            result: await hosts.call("probe", { path }, { hostId: host.id, timeoutMs: 10_000 }),
          })));
          const matches = probes.filter((probe) => probe.result.ok);
          if (matches.length > 1) {
            throw new OpenInMossError("ambiguous_host", "This file exists on multiple Macs. Supply its hostId to choose one.");
          }
          if (matches.length === 0) {
            return probes.find((probe) => !probe.result.ok && probe.result.error.code !== "unsupported_platform")?.result ?? probes[0]!.result;
          }
          hostId = matches[0]!.hostId;
        }
        return await hosts.call("open", { path }, { hostId, timeoutMs: 20_000 });
      } catch (error) {
        if (error instanceof OpenInMossError) throw error;
        throw new OpenInMossError("host_unavailable", "The file host could not be reached. Reconnect it and try again.");
      }
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
