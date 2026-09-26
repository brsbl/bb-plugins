import { useSyncExternalStore } from "react";

export type MicStatus = "off" | "starting" | "live" | "blocked";

export interface MicState {
  status: MicStatus;
  analyser: AnalyserNode | null;
}

let micState: MicState = { status: "off", analyser: null };
let micStream: MediaStream | null = null;
let micContext: AudioContext | null = null;
const micListeners = new Set<() => void>();

function setMicState(next: MicState) {
  micState = next;
  for (const listener of micListeners) listener();
}

export function currentMicStatus(): MicStatus {
  return micState.status;
}

function subscribeMic(listener: () => void) {
  micListeners.add(listener);
  return () => {
    micListeners.delete(listener);
  };
}

export async function startMic() {
  if (micState.status === "live" || micState.status === "starting") return;
  setMicState({ status: "starting", analyser: null });
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: true },
    });
    if (currentMicStatus() !== "starting") {
      for (const track of stream.getTracks()) track.stop();
      return;
    }
    const context = new AudioContext();
    const analyser = context.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.78;
    context.createMediaStreamSource(stream).connect(analyser);
    for (const track of stream.getTracks()) track.addEventListener("ended", stopMic);
    micStream = stream;
    micContext = context;
    setMicState({ status: "live", analyser });
  } catch {
    setMicState({ status: "blocked", analyser: null });
  }
}

export function stopMic() {
  for (const track of micStream?.getTracks() ?? []) track.stop();
  void micContext?.close();
  micStream = null;
  micContext = null;
  setMicState({ status: "off", analyser: null });
}

export function useMic(): MicState {
  return useSyncExternalStore(subscribeMic, () => micState);
}
