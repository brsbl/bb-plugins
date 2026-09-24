import { useLayoutEffect, type ComponentType } from "react";
import { definePluginApp, useBbNavigate } from "@get-bb/plugin-sdk/app";
import { toast } from "sonner";

import {
  playback,
  ReadAloudControls,
  type PlaybackStatus,
  type ReadingSource,
} from "./controls";
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
/** Collapsing the footer controls pauses; expanding them again resumes. */
let pausedByCollapse = false;
/** Whether the current reading has produced audio yet. */
let readingStarted = false;

function savedSpeed(): Speed {
  const value = Number(globalThis.localStorage?.getItem(speedKey));
  return speeds.find((speed) => speed === value) ?? 1;
}

/** Statuses that mean "try again shortly": busy, restarting, or a proxy hiccup. */
const retryableStatuses = new Set([429, 502, 503, 504]);
const retryDelaysMs = [500, 1000, 2000, 4000, 4000];

async function fetchSpeech(
  text: string,
  speed: number,
  signal: AbortSignal,
  first: boolean,
): Promise<Blob> {
  for (let attempt = 0; ; attempt += 1) {
    let response: Response | null = null;
    try {
      response = await fetch(`/api/v1/plugins/${encodeURIComponent(pluginId)}/http/speak`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text, speed, first }),
        signal,
      });
    } catch (error) {
      // A dropped connection during a server restart is retried like a 503.
      if (signal.aborted || attempt >= retryDelaysMs.length) throw error;
    }
    if (response?.ok) return response.blob();
    if (response && (!retryableStatuses.has(response.status) || attempt >= retryDelaysMs.length)) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new Error(body?.error ?? `The voice server returned ${response.status}`);
    }
    await new Promise((resolve) => setTimeout(resolve, retryDelaysMs[attempt]));
    signal.throwIfAborted();
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
    if (status === "preparing" && !playback.get().shown) {
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

function pause(): void {
  if (!player || playback.get().status === "idle") return;
  player.pause();
  setStatus("paused");
}

function resume(): void {
  if (!player || playback.get().status !== "paused") return;
  player.resume();
  setStatus(readingStarted ? "playing" : "preparing");
}

function stop(): void {
  pausedByCollapse = false;
  player?.stop();
  setStatus("idle");
}

function readAloud(key: string, markdown: string, source: ReadingSource): void {
  if (player?.isReading(key)) {
    if (playback.get().status === "paused") {
      pausedByCollapse = false;
      resume();
      if (footer && !playback.get().shown) {
        footer.open();
        footerOpenedForReading = true;
      }
    } else {
      stop();
    }
    return;
  }
  pausedByCollapse = false;
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
  readingStarted = false;
  playback.set({ source });
  setStatus("preparing");
  player.speak(key, chunks, savedSpeed(), {
    onPlaying: () => {
      readingStarted = true;
      if (playback.get().status !== "paused") setStatus("playing");
    },
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

/** Scrolls the message into view once its thread's timeline has rendered it. */
function revealMessage(messageId: string): void {
  const selector = `[data-timeline-row-id="${CSS.escape(messageId)}"]`;
  const deadline = Date.now() + 5000;
  const attempt = () => {
    const row = document.querySelector<HTMLElement>(selector);
    if (!row) {
      if (Date.now() < deadline) setTimeout(attempt, 100);
      return;
    }
    row.scrollIntoView({ behavior: "smooth", block: "center" });
    row.classList.remove("bb-read-aloud-target");
    void row.offsetWidth;
    row.classList.add("bb-read-aloud-target");
    setTimeout(() => row.classList.remove("bb-read-aloud-target"), 1600);
  };
  attempt();
}

function FooterControls() {
  const navigate = useBbNavigate();
  // Layout effects run inside the toggle's click, so resuming stays a user
  // gesture that mobile browsers accept.
  useLayoutEffect(() => {
    if (pausedByCollapse) {
      pausedByCollapse = false;
      resume();
    }
    return () => {
      const { status } = playback.get();
      if (status === "playing" || status === "preparing") {
        pause();
        pausedByCollapse = true;
      }
    };
  }, []);
  return (
    <ReadAloudControls
      onSpeed={setSpeed}
      onJump={({ threadId, messageId }) => {
        navigate.toThread(threadId);
        revealMessage(messageId);
      }}
      onPause={pause}
      onResume={resume}
      onStop={stop}
    />
  );
}

/** Same artwork as the plugin's branding icon, which bb shows on messages. */
function SpeakerIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M3 10.5v3a1.5 1.5 0 0 0 1.5 1.5H7l4.2 3.6a.8.8 0 0 0 1.3-.6V6a.8.8 0 0 0-1.3-.6L7 9H4.5A1.5 1.5 0 0 0 3 10.5Z" />
      <path d="M16 9a4 4 0 0 1 0 6" />
      <path d="M18.5 6.5a7.5 7.5 0 0 1 0 11" />
    </svg>
  );
}

type AppIconsApi = {
  register(registration: { name: string; component: ComponentType<{ className?: string }> }): void;
};

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
  const host = app as {
    experimental_icons?: AppIconsApi;
    experimental_sidebarFooter?: SidebarFooterApi;
  };
  host.experimental_icons?.register({ name: "read-aloud-speaker", component: SpeakerIcon });
  const sidebarFooter = host.experimental_sidebarFooter;
  footer =
    sidebarFooter?.register({
      kind: "disclosure",
      id: "read-aloud",
      label: "Read aloud",
      icon: host.experimental_icons ? "read-aloud-speaker" : "Play",
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
      readAloud(key, selectedText ?? message.text, {
        threadId: message.threadId,
        messageId: message.id,
      });
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
