import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { BbPluginApi } from "@get-bb/plugin-sdk";

import { chunkForSpeech, maxSpeakLength, speeds, toSpeechText } from "./speech-text";
import {
  KokoroSynthesizer,
  SynthesisBusyError,
  SynthesisUnavailableError,
  toWav,
  trimSilence,
  type SynthesisRequest,
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

/** Recently synthesized chunks, keyed by voice, speed, and text. */
class SpeechCache {
  private readonly entries = new Map<string, Uint8Array<ArrayBuffer>>();

  constructor(private readonly limit = 48) {}

  get(key: string): Uint8Array<ArrayBuffer> | undefined {
    const wav = this.entries.get(key);
    if (wav) {
      this.entries.delete(key);
      this.entries.set(key, wav);
    }
    return wav;
  }

  set(key: string, wav: Uint8Array<ArrayBuffer>): void {
    this.entries.delete(key);
    this.entries.set(key, wav);
    while (this.entries.size > this.limit) {
      this.entries.delete(this.entries.keys().next().value!);
    }
  }
}

/** Chunks of each finished reply synthesized before anyone presses play. */
const preparedChunks = 2;

export function registerReadAloud(bb: BbPluginApi, synthesizer: Synthesizer): void {
  const settings = bb.settings.define({
    voice: {
      type: "select",
      label: "Voice",
      options: [...voices],
      default: "af_heart",
    },
    prepare: {
      type: "boolean",
      label: "Prepare replies in advance so reading starts instantly",
      default: true,
    },
  });
  const cache = new SpeechCache();
  /** Background preparations, so a click can reuse one already running. */
  const preparing = new Map<
    string,
    { wav: Promise<Uint8Array<ArrayBuffer>>; started: boolean; controller: AbortController }
  >();
  /** The speed listeners last chose; replies are prepared at this speed. */
  let lastSpeed: number = speeds[0];
  const cacheKey = (voice: string, speed: number, text: string) => `${voice}|${speed}|${text}`;

  async function currentVoice(): Promise<string> {
    const current = await settings.get();
    return voices.find((value) => value === current.voice) ?? "af_heart";
  }

  async function synthesizeWav(
    text: string,
    voice: string,
    speed: number,
    options: Pick<SynthesisRequest, "first" | "background" | "onStart" | "signal">,
  ): Promise<Uint8Array<ArrayBuffer>> {
    const audio = await synthesizer.synthesize({ text, voice, speed, ...options });
    const wav = toWav(trimSilence(audio, text, speed));
    cache.set(cacheKey(voice, speed, text), wav);
    return wav;
  }

  bb.events.on("thread.idle", async ({ lastAssistantText }) => {
    if (!lastAssistantText) return;
    const current = await settings.get();
    if (!current.prepare) return;
    const voice = await currentVoice();
    const speed = lastSpeed;
    for (const text of chunkForSpeech(toSpeechText(lastAssistantText)).slice(0, preparedChunks)) {
      const key = cacheKey(voice, speed, text);
      if (cache.get(key) || preparing.has(key)) continue;
      const controller = new AbortController();
      const entry = {
        started: false,
        controller,
        wav: synthesizeWav(text, voice, speed, {
          background: true,
          signal: controller.signal,
          onStart: () => {
            entry.started = true;
          },
        }),
      };
      preparing.set(key, entry);
      entry.wav.catch(() => {}).finally(() => preparing.delete(key));
    }
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
    lastSpeed = speed;
    const voice = await currentVoice();
    const key = cacheKey(voice, speed, text);
    const respond = (wav: Uint8Array<ArrayBuffer>) =>
      new Response(wav, {
        headers: { "content-type": "audio/wav", "cache-control": "no-store" },
      });
    const cached = cache.get(key);
    if (cached) return respond(cached);
    try {
      const prepared = preparing.get(key);
      // Reuse preparation already in progress; otherwise take its place so
      // the live request is not stuck behind background work.
      if (prepared?.started) return respond(await prepared.wav);
      prepared?.controller.abort();
      return respond(
        await synthesizeWav(text, voice, speed, {
          first: body?.first === true,
          signal: context.req.raw.signal,
        }),
      );
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
