import { useEffect, useSyncExternalStore } from "react";

import { speeds, type Speed } from "./speech-text";

export type PlaybackStatus = "idle" | "preparing" | "playing" | "paused";

interface PlaybackState {
  status: PlaybackStatus;
  speed: Speed;
  /** Whether the controls are currently on screen. */
  shown: boolean;
}

const listeners = new Set<() => void>();
let state: PlaybackState = { status: "idle", speed: 1, shown: false };

/** Playback state shared by the message action and the footer controls. */
export const playback = {
  get: () => state,
  set(next: Partial<PlaybackState>) {
    state = { ...state, ...next };
    for (const listener of listeners) listener();
  },
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

const labels: Record<PlaybackStatus, string> = {
  idle: "Read aloud",
  preparing: "Preparing…",
  playing: "Reading",
  paused: "Paused",
};

function PauseIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <rect x="4" y="3.5" width="2.75" height="9" rx="1" />
      <rect x="9.25" y="3.5" width="2.75" height="9" rx="1" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d="M5 3.8v8.4a.8.8 0 0 0 1.2.7l6.6-4.2a.8.8 0 0 0 0-1.4L6.2 3.1A.8.8 0 0 0 5 3.8Z" />
    </svg>
  );
}

export function ReadAloudControls({
  onSpeed,
  onPause,
  onResume,
  onStop,
}: {
  onSpeed(speed: Speed): void;
  onPause(): void;
  onResume(): void;
  onStop(): void;
}) {
  const { status, speed } = useSyncExternalStore(playback.subscribe, playback.get);
  useEffect(() => {
    playback.set({ shown: true });
    return () => playback.set({ shown: false });
  }, []);
  return (
    <div className="bb-read-aloud-controls" role="group" aria-label="Read aloud">
      <span className="bb-read-aloud-status" aria-live="polite">
        {status === "paused" ? <PauseIcon /> : null}
        {labels[status]}
      </span>
      <div className="bb-read-aloud-speeds" role="radiogroup" aria-label="Speed">
        {speeds.map((value) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={value === speed}
            className="bb-read-aloud-speed"
            onClick={() => onSpeed(value)}
          >
            {value}×
          </button>
        ))}
      </div>
      {status === "playing" || status === "paused" ? (
        <button
          type="button"
          className="bb-read-aloud-button"
          aria-label={status === "paused" ? "Resume reading" : "Pause reading"}
          title={status === "paused" ? "Resume" : "Pause"}
          onClick={status === "paused" ? onResume : onPause}
        >
          {status === "paused" ? <PlayIcon /> : <PauseIcon />}
        </button>
      ) : null}
      {status !== "idle" ? (
        <button
          type="button"
          className="bb-read-aloud-button"
          aria-label="Stop reading"
          title="Stop"
          onClick={onStop}
        >
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <rect x="4" y="4" width="8" height="8" rx="1.5" />
          </svg>
        </button>
      ) : null}
    </div>
  );
}
