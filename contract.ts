import type { PluginRpcContract } from "@get-bb/plugin-sdk";
import { z } from "zod";

export const pathInput = z.object({ path: z.string() });
const result = z.discriminatedUnion("ok", [
  z.object({ ok: z.literal(true), path: z.string() }),
  z.object({
    ok: z.literal(false),
    error: z.object({
      code: z.enum([
        "invalid_path", "not_found", "not_markdown", "not_regular_file",
        "open_failed", "unsupported_platform", "host_unavailable", "ambiguous_host",
      ]),
      message: z.string(),
    }),
  }),
]);

export type OpenResult = z.infer<typeof result>;
export const mossHostContract = {
  probe: { input: pathInput, output: result },
  open: { input: pathInput, output: result },
} satisfies PluginRpcContract;
