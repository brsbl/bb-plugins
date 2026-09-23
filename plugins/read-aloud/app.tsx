import { definePluginApp } from "@get-bb/plugin-sdk/app";
import { toast } from "sonner";

import type { EngineDevice } from "./kokoro-worker";
import { ReadAloudPlayer } from "./player";
import type { ReadAloudSettings } from "./server";
import { chunkForSpeech, toSpeechText } from "./speech-text";

const toastId = "read-aloud";
const defaults: ReadAloudSettings = { voice: "af_heart", speed: 1, device: "auto" };
const downloadSize: Record<EngineDevice, string> = {
  webgpu: "about 330 MB",
  wasm: "about 90 MB",
};

let pluginId = "read-aloud";
let player: ReadAloudPlayer | null = null;
/** The reading the user asked for most recently, including while it prepares. */
let current: { key: string; token: number } | null = null;
let nextToken = 1;

async function loadSettings(): Promise<ReadAloudSettings> {
  try {
    const response = await fetch(
      `/api/v1/plugins/${encodeURIComponent(pluginId)}/http/settings`,
    );
    if (!response.ok) return defaults;
    const value = (await response.json()) as Partial<ReadAloudSettings>;
    return {
      voice: typeof value.voice === "string" ? value.voice : defaults.voice,
      speed:
        typeof value.speed === "number" && Number.isFinite(value.speed)
          ? value.speed
          : defaults.speed,
      device:
        value.device === "webgpu" || value.device === "wasm" ? value.device : "auto",
    } as ReadAloudSettings;
  } catch {
    return defaults;
  }
}

async function resolveDevice(preference: ReadAloudSettings["device"]): Promise<EngineDevice> {
  if (preference !== "auto") return preference;
  const gpu = (navigator as Navigator & {
    gpu?: { requestAdapter(): Promise<unknown | null> };
  }).gpu;
  try {
    return gpu && (await gpu.requestAdapter()) ? "webgpu" : "wasm";
  } catch {
    return "wasm";
  }
}

function stop(): void {
  current = null;
  player?.stop();
  toast.dismiss(toastId);
}

const stopAction = { label: "Stop", onClick: stop };

async function readAloud(key: string, markdown: string): Promise<void> {
  if (current?.key === key) {
    stop();
    return;
  }
  stop();
  const chunks = chunkForSpeech(toSpeechText(markdown));
  if (chunks.length === 0) {
    toast.message("Nothing to read aloud", {
      id: toastId,
      description: "This message only contains code or media.",
    });
    return;
  }
  const request = { key, token: nextToken++ };
  current = request;
  player ??= new ReadAloudPlayer();
  // Start audio while the click still counts as a user gesture.
  player.unlockAudio();
  toast.loading("Preparing to read aloud…", { id: toastId, action: stopAction });
  const settings = await loadSettings();
  const device = await resolveDevice(settings.device);
  // A stop, another click, or a plugin reload while preparing wins.
  if (current !== request || !player) return;
  const isCurrent = () => current === request;
  player.speak(
    key,
    { chunks, voice: settings.voice, speed: settings.speed, device },
    {
      onLoading(loadingDevice) {
        toast.loading("Loading the Kokoro voice…", {
          id: toastId,
          description: `The first time downloads ${downloadSize[loadingDevice]}; after that it loads from your browser cache.`,
          action: stopAction,
        });
      },
      onPlaying() {
        toast("Reading aloud", {
          id: toastId,
          description: undefined,
          duration: Number.POSITIVE_INFINITY,
          action: stopAction,
        });
      },
      onFinished() {
        if (isCurrent()) current = null;
        toast.dismiss(toastId);
      },
      onError(message) {
        if (isCurrent()) current = null;
        toast.error("Couldn’t read this message aloud", {
          id: toastId,
          description: message,
          duration: 8000,
        });
      },
    },
  );
}

export default definePluginApp((app) => {
  app.slots.messageAction({
    id: "read-aloud",
    title: "Read aloud",
    icon: "Play",
    run({ message, selectedText }) {
      const key =
        selectedText === undefined
          ? message.id
          : `${message.id}:selection:${selectedText}`;
      return readAloud(key, selectedText ?? message.text);
    },
  });
  app.contentScripts.register({
    id: "read-aloud-lifecycle",
    mount(context) {
      pluginId = context.pluginId;
      return () => {
        stop();
        player?.dispose();
        player = null;
      };
    },
  });
});
