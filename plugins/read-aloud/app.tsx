import { definePluginApp } from "@get-bb/plugin-sdk/app";
import { toast } from "sonner";

import { ReadAloudPlayer } from "./player";
import { chunkForSpeech, speeds, toSpeechText, type Speed } from "./speech-text";

const toastId = "read-aloud";
const speedKey = "read-aloud:speed";

let pluginId = "read-aloud";
let player: ReadAloudPlayer | null = null;

function savedSpeed(): Speed {
  const value = Number(globalThis.localStorage?.getItem(speedKey));
  return speeds.find((speed) => speed === value) ?? 1;
}

async function fetchSpeech(text: string, speed: number, signal: AbortSignal): Promise<Blob> {
  const response = await fetch(`/api/v1/plugins/${encodeURIComponent(pluginId)}/http/speak`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ text, speed }),
    signal,
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? `The voice server returned ${response.status}`);
  }
  return response.blob();
}

function stop(): void {
  player?.stop();
  toast.dismiss(toastId);
}

function showToast(state: "preparing" | "playing"): void {
  const speed = savedSpeed();
  const options = {
    id: toastId,
    duration: Number.POSITIVE_INFINITY,
    action: {
      label: `${speed}×`,
      onClick(event: { preventDefault(): void }) {
        // Keep the toast open; the label shows the new speed.
        event.preventDefault();
        const next = speeds[(speeds.indexOf(speed) + 1) % speeds.length]!;
        globalThis.localStorage?.setItem(speedKey, String(next));
        player?.setSpeed(next);
        showToast(state);
      },
    },
    cancel: { label: "Stop", onClick: stop },
  };
  if (state === "preparing") toast.loading("Preparing to read aloud…", options);
  else toast("Reading aloud", options);
}

function readAloud(key: string, markdown: string): void {
  if (player?.isReading(key)) {
    stop();
    return;
  }
  const chunks = chunkForSpeech(toSpeechText(markdown));
  if (chunks.length === 0) {
    stop();
    toast.message("Nothing to read aloud", {
      id: toastId,
      description: "This message only contains code or media.",
    });
    return;
  }
  player ??= new ReadAloudPlayer(fetchSpeech);
  player.stop();
  player.unlock();
  showToast("preparing");
  player.speak(key, chunks, savedSpeed(), {
    onPlaying: () => showToast("playing"),
    onFinished: () => toast.dismiss(toastId),
    onError(message) {
      toast.error("Couldn’t read this message aloud", {
        id: toastId,
        description: message,
        duration: 8000,
      });
    },
  });
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
      readAloud(key, selectedText ?? message.text);
    },
  });
  app.contentScripts.register({
    id: "read-aloud-lifecycle",
    mount(context) {
      pluginId = context.pluginId;
      return () => {
        stop();
        player = null;
      };
    },
  });
});
