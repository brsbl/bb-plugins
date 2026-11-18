import type { BbPluginApi } from "@get-bb/plugin-sdk";
import { z } from "zod";

export const playgroundKindSchema = z.enum(["anatomy", "html", "native"]);
export const clipExportPropertiesSchema = z.object({
  kind: playgroundKindSchema,
  format: z.enum(["mp4", "gif"]),
  size: z.enum(["square", "landscape", "portrait"]),
  duration_bucket: z.enum(["under_15s", "15_30s", "30_60s", "over_60s"]),
}).strict();
export type PlaygroundKind = z.infer<typeof playgroundKindSchema>;
export type PlaygroundEvent =
  | { name: "playground_published"; properties: { kind: PlaygroundKind } }
  | { name: "playground_clip_exported"; properties: z.infer<typeof clipExportPropertiesSchema> };

export function playgroundKind(kind: "document" | "html", html = ""): PlaygroundKind {
  return kind === "document" ? "native" : /class=["'][^"']*\biso\b/.test(html) ? "anatomy" : "html";
}

// The route is public; these two strict event variants are added by the core
// prerequisite. Until its SDK release, narrow the call to just our fixed payloads.
export function createAnalytics(bb: BbPluginApi) {
  return (event: PlaygroundEvent): Promise<void> => Promise.resolve().then(async () => {
    // @ts-expect-error The released SDK predates the two core event variants.
    await bb.sdk.system.experimental_recordTelemetryEvent(event);
  }).catch(() => {
    // A missing/older route or failed telemetry must not fail a publish/export.
    // No queue, retries or content-bearing error logs.
  });
}
