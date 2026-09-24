import type { ComponentType } from "react";
import { definePluginApp } from "@get-bb/plugin-sdk/app";
import { toast } from "sonner";

import { playback, ReadAloudControls, type PlaybackStatus } from "./controls";
import { ReadAloudPlayer } from "./player";
import { chunkForSpeech, speeds, toSpeechText, type Speed } from "./speech-text";
import "./app.css";

const toastId = "read-aloud";
const speedKey = "read-aloud:speed";

let pluginId = "read-aloud";
let player: ReadAloudPlayer | null = null;

/** The sidebar-footer disclosure controller, on hosts that provide one. */
interface FooterDisclosure {
  open(): void;
  close(): void;
}
let footer: FooterDisclosure | null = null;
let footerOpenedForReading = false;

function savedSpeed(): Speed {
  const value = Number(globalThis.localStorage?.getItem(speedKey));
  return speeds.find((speed) => speed === value) ?? 1;
}

async function fetchSpeech(
  text: string,
  speed: number,
  signal: AbortSignal,
  first: boolean,
): Promise<Blob> {
  // A busy server (other devices reading at once) clears within seconds.
  for (let attempt = 0; ; attempt += 1) {
    const response = await fetch(
      `/api/v1/plugins/${encodeURIComponent(pluginId)}/http/speak`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text, speed, first }),
        signal,
      },
    );
    if (response.ok) return response.blob();
    if (response.status === 429 && attempt < 4) {
      await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** attempt));
      signal.throwIfAborted();
      continue;
    }
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? `The voice server returned ${response.status}`);
  }
}

function setSpeed(speed: Speed): void {
  globalThis.localStorage?.setItem(speedKey, String(speed));
  playback.set({ speed });
  player?.setSpeed(speed);
  if (!footer && playback.get().status !== "idle") showToast();
}

/** Shows the reading state in the sidebar footer, or a toast on older hosts. */
function setStatus(status: PlaybackStatus): void {
  playback.set({ status });
  if (footer) {
    if (status !== "idle" && !playback.get().shown) {
      footer.open();
      footerOpenedForReading = true;
    } else if (status === "idle" && footerOpenedForReading) {
      footerOpenedForReading = false;
      footer.close();
    }
    return;
  }
  if (status === "idle") toast.dismiss(toastId);
  else showToast();
}

function showToast(): void {
  const { speed, status } = playback.get();
  toast(status === "preparing" ? "Preparing…" : "Reading aloud", {
    id: toastId,
    duration: Number.POSITIVE_INFINITY,
    action: {
      label: `${speed}×`,
      onClick(event: { preventDefault(): void }) {
        // Keep the toast open; the label shows the new speed.
        event.preventDefault();
        setSpeed(speeds[(speeds.indexOf(speed) + 1) % speeds.length]!);
      },
    },
    cancel: { label: "Stop", onClick: stop },
  });
}

function stop(): void {
  player?.stop();
  setStatus("idle");
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
  setStatus("preparing");
  player.speak(key, chunks, savedSpeed(), {
    onPlaying: () => setStatus("playing"),
    onFinished: () => setStatus("idle"),
    onError(message) {
      setStatus("idle");
      toast.error("Couldn’t read this message aloud", {
        id: toastId,
        description: message,
        duration: 8000,
      });
    },
  });
}

function FooterControls() {
  return <ReadAloudControls onSpeed={setSpeed} onStop={stop} />;
}

type SidebarFooterApi = {
  register(registration: {
    kind: "disclosure";
    id: string;
    label: string;
    icon: string;
    component: ComponentType<{ dismiss(): void }>;
  }): FooterDisclosure;
};

export default definePluginApp((app) => {
  playback.set({ speed: savedSpeed() });
  const sidebarFooter = (app as { experimental_sidebarFooter?: SidebarFooterApi })
    .experimental_sidebarFooter;
  footer =
    sidebarFooter?.register({
      kind: "disclosure",
      id: "read-aloud",
      label: "Read aloud",
      icon: "Play",
      component: FooterControls,
    }) ?? null;
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
