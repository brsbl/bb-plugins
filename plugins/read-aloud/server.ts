import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { BbPluginApi } from "@get-bb/plugin-sdk";

import { maxSpeakLength, speeds } from "./speech-text";
import {
  KokoroSynthesizer,
  SynthesisBusyError,
  SynthesisUnavailableError,
  toWav,
  trimSilence,
  type Synthesizer,
} from "./synthesizer";

const voices = [
  "af_heart",
  "af_alloy",
  "af_aoede",
  "af_bella",
  "af_jessica",
  "af_kore",
  "af_nicole",
  "af_nova",
  "af_river",
  "af_sarah",
  "af_sky",
  "am_adam",
  "am_echo",
  "am_eric",
  "am_fenrir",
  "am_liam",
  "am_michael",
  "am_onyx",
  "am_puck",
  "am_santa",
  "bf_alice",
  "bf_emma",
  "bf_isabella",
  "bf_lily",
  "bm_daniel",
  "bm_fable",
  "bm_george",
  "bm_lewis",
] as const;


const moduleDir = dirname(fileURLToPath(import.meta.url));
const pluginDir = moduleDir.endsWith("dist") ? dirname(moduleDir) : moduleDir;

export function registerReadAloud(bb: BbPluginApi, synthesizer: Synthesizer): void {
  const settings = bb.settings.define({
    voice: {
      type: "select",
      label: "Voice",
      options: [...voices],
      default: "af_heart",
    },
  });

  bb.http.route("POST", "/speak", async (context) => {
    const body = (await context.req.json().catch(() => null)) as {
      text?: unknown;
      speed?: unknown;
      first?: unknown;
    } | null;
    const text = typeof body?.text === "string" ? body.text.trim() : "";
    const speed = speeds.find((value) => value === body?.speed);
    if (text.length === 0 || text.length > maxSpeakLength || speed === undefined) {
      return context.json({ error: "Invalid speech request" }, 400);
    }
    const current = await settings.get();
    const voice = voices.find((value) => value === current.voice) ?? "af_heart";
    try {
      const audio = await synthesizer.synthesize({
        text,
        voice,
        speed,
        first: body?.first === true,
        signal: context.req.raw.signal,
      });
      return new Response(toWav(trimSilence(audio, text, speed)), {
        headers: { "content-type": "audio/wav", "cache-control": "no-store" },
      });
    } catch (error) {
      const status =
        error instanceof SynthesisBusyError
          ? 429
          : error instanceof SynthesisUnavailableError
            ? 503
            : 500;
      return context.json(
        { error: error instanceof Error ? error.message : "Speech failed" },
        status,
        status === 503 ? { "retry-after": "1" } : undefined,
      );
    }
  });
}

export default function plugin(bb: BbPluginApi): void {
  // The plugin's SQLite file sits in its private data directory, which
  // survives updates, so the Kokoro runtime and model are fetched only once.
  const dataDir = dirname(bb.storage.database().name);
  const synthesizer = new KokoroSynthesizer(
    join(pluginDir, "runtime"),
    dataDir,
    (message) => bb.log.info(message),
  );
  registerReadAloud(bb, synthesizer);
  bb.background.service("kokoro", { start: (signal) => synthesizer.run(signal) });
}
