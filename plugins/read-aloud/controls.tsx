import { useEffect, useSyncExternalStore } from "react";

import { speeds, type Speed } from "./speech-text";

export type PlaybackStatus = "idle" | "preparing" | "playing";

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
};

export function ReadAloudControls({
  onSpeed,
  onStop,
}: {
  onSpeed(speed: Speed): void;
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
      {status !== "idle" ? (
        <button
          type="button"
          className="bb-read-aloud-stop"
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
