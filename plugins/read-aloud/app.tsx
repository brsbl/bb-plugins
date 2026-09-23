import { definePluginApp } from "@get-bb/plugin-sdk/app";
import { toast } from "sonner";

import type { EngineDevice } from "./kokoro-worker";
import { ReadAloudPlayer } from "./player";
import type { ReadAloudSettings } from "./server";
import { toSpeechText } from "./speech-text";

const pluginId = "read-aloud";
const toastId = "read-aloud";
const defaults: ReadAloudSettings = { voice: "af_heart", speed: 1, device: "auto" };
const downloadSize: Record<EngineDevice, string> = {
  webgpu: "about 330 MB",
  wasm: "about 90 MB",
};

let player: ReadAloudPlayer | null = null;

async function loadSettings(): Promise<ReadAloudSettings> {
  try {
    const response = await fetch(`/api/v1/plugins/${pluginId}/http/settings`);
    if (!response.ok) return defaults;
    const value = (await response.json()) as Partial<ReadAloudSettings>;
    return {
      voice: typeof value.voice === "string" ? value.voice : defaults.voice,
      speed:
        typeof value.speed === "number" && Number.isFinite(value.speed)
          ? Math.min(2, Math.max(0.5, value.speed))
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
  player?.stop();
  toast.dismiss(toastId);
}

const stopAction = { label: "Stop", onClick: stop };

async function readAloud(key: string, markdown: string): Promise<void> {
  player ??= new ReadAloudPlayer();
  if (player.isReading(key)) {
    stop();
    return;
  }
  const text = toSpeechText(markdown);
  if (text.length === 0) {
    toast.message("Nothing to read aloud", {
      id: toastId,
      description: "This message only contains code or media.",
    });
    return;
  }
  // Start audio while the click still counts as a user gesture.
  player.unlockAudio();
  toast.loading("Preparing to read aloud…", { id: toastId, action: stopAction });
  const settings = await loadSettings();
  const device = await resolveDevice(settings.device);
  player.speak(
    key,
    { text, voice: settings.voice, speed: settings.speed, device },
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
        toast.dismiss(toastId);
      },
      onError(message) {
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
      const text = selectedText ?? message.text;
      const key = selectedText === undefined ? message.id : `${message.id}:selection`;
      return readAloud(key, text);
    },
  });
  app.contentScripts.register({
    id: "read-aloud-cleanup",
    mount: () => () => {
      stop();
      player?.dispose();
      player = null;
    },
  });
});
