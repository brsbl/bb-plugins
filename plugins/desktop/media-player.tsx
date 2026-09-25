import { useEffect, useRef, useSyncExternalStore } from "react";

import { MediaPlayerArt, NextGlyph, PlayGlyph, PreviousGlyph, StopGlyph } from "./art";
import { WindowFrame, type DesktopWindow } from "./windows";

type MicStatus = "off" | "starting" | "live" | "blocked";

interface MicState {
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
    if (micState.status !== "starting") {
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

interface Scene {
  freq: Uint8Array<ArrayBuffer>;
  wave: Uint8Array<ArrayBuffer>;
  peaks: number[];
  tick: number;
  width: number;
  height: number;
  compact: boolean;
}

interface Preset {
  name: string;
  trail: number;
  draw: (context: CanvasRenderingContext2D, scene: Scene) => void;
}

const BACKDROP = "oklch(0.13 0.03 262)";

function bands(freq: Uint8Array, count: number): number[] {
  const usable = Math.floor(freq.length * 0.7);
  return Array.from({ length: count }, (_, index) => {
    const start = Math.floor(Math.pow(usable, index / count));
    const end = Math.max(start + 1, Math.floor(Math.pow(usable, (index + 1) / count)));
    let total = 0;
    for (let bin = start; bin < end; bin += 1) total += freq[bin] ?? 0;
    return total / (end - start) / 255;
  });
}

const PRESETS: readonly Preset[] = [
  {
    name: "Bars and Waves: Bars",
    trail: 1,
    draw(context, { freq, peaks, width, height, compact }) {
      const levels = bands(freq, compact ? 10 : 40);
      const gap = compact ? 1 : 2;
      const barWidth = (width - gap * (levels.length - 1)) / levels.length;
      const gradient = context.createLinearGradient(0, height, 0, 0);
      gradient.addColorStop(0, "oklch(0.72 0.19 150)");
      gradient.addColorStop(0.6, "oklch(0.9 0.17 105)");
      gradient.addColorStop(1, "oklch(0.68 0.22 30)");
      levels.forEach((level, index) => {
        const x = index * (barWidth + gap);
        const barHeight = Math.max(1, level * height);
        context.fillStyle = gradient;
        context.fillRect(x, height - barHeight, barWidth, barHeight);
        const peak = Math.max(level, (peaks[index] ?? 0) - 0.012);
        peaks[index] = peak;
        context.fillStyle = "oklch(0.97 0.02 250)";
        context.fillRect(x, height - peak * height - 2, barWidth, compact ? 1 : 2);
      });
    },
  },
  {
    name: "Bars and Waves: Scope",
    trail: 0.28,
    draw(context, { wave, tick, width, height, compact }) {
      context.lineWidth = compact ? 1.25 : 2.5;
      context.strokeStyle = `oklch(0.82 0.16 ${(tick * 0.6) % 360})`;
      context.shadowColor = context.strokeStyle;
      context.shadowBlur = compact ? 4 : 12;
      context.beginPath();
      const step = wave.length / width;
      for (let x = 0; x <= width; x += 1) {
        const sample = ((wave[Math.floor(x * step)] ?? 128) - 128) / 128;
        const y = height / 2 + sample * height * 0.45;
        if (x === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
      }
      context.stroke();
      context.shadowBlur = 0;
    },
  },
  {
    name: "Ambience: Swirl",
    trail: 0.12,
    draw(context, { freq, tick, width, height, compact }) {
      const levels = bands(freq, compact ? 16 : 48);
      const energy = levels.reduce((sum, level) => sum + level, 0) / levels.length;
      const radius = Math.min(width, height) * (0.18 + energy * 0.35);
      const arms = 6;
      context.save();
      context.translate(width / 2, height / 2);
      context.rotate(tick * 0.006 + energy);
      for (let arm = 0; arm < arms; arm += 1) {
        context.rotate((Math.PI * 2) / arms);
        context.beginPath();
        levels.forEach((level, index) => {
          const angle = (index / levels.length) * Math.PI;
          const reach = radius * (0.4 + level * 1.6);
          const x = Math.cos(angle) * reach;
          const y = Math.sin(angle) * reach * 0.5;
          if (index === 0) context.moveTo(x, y);
          else context.lineTo(x, y);
        });
        context.strokeStyle = `oklch(0.78 0.17 ${(tick * 0.8 + arm * 40) % 360} / 0.85)`;
        context.lineWidth = compact ? 1 : 2;
        context.stroke();
      }
      context.restore();
    },
  },
];

const PRESET_KEY = "bb-desktop:visualization";

function loadPreset(): number {
  const stored = Number(localStorage.getItem(PRESET_KEY));
  return Number.isInteger(stored) && stored >= 0 && stored < PRESETS.length ? stored : 0;
}

const presetListeners = new Set<() => void>();
let presetIndex = typeof localStorage === "undefined" ? 0 : loadPreset();

function cyclePreset(step: number) {
  presetIndex = (presetIndex + step + PRESETS.length) % PRESETS.length;
  localStorage.setItem(PRESET_KEY, String(presetIndex));
  for (const listener of presetListeners) listener();
}

function usePreset(): Preset {
  const index = useSyncExternalStore(
    (listener) => {
      presetListeners.add(listener);
      return () => {
        presetListeners.delete(listener);
      };
    },
    () => presetIndex,
  );
  return PRESETS[index]!;
}

function Visualizer({ compact = false }: { compact?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { analyser } = useMic();
  const preset = usePreset();

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    const scene: Scene = {
      freq: new Uint8Array(analyser?.frequencyBinCount ?? 1024),
      wave: new Uint8Array(analyser?.fftSize ?? 2048).fill(128),
      peaks: [],
      tick: 0,
      width: 0,
      height: 0,
      compact,
    };
    let frame = 0;
    let cleared = false;
    const draw = () => {
      const ratio = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (canvas.width !== Math.round(width * ratio) || canvas.height !== Math.round(height * ratio)) {
        canvas.width = Math.round(width * ratio);
        canvas.height = Math.round(height * ratio);
        cleared = false;
      }
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      scene.width = width;
      scene.height = height;
      scene.tick += 1;
      if (analyser) {
        analyser.getByteFrequencyData(scene.freq);
        analyser.getByteTimeDomainData(scene.wave);
      }
      context.globalAlpha = cleared ? preset.trail : 1;
      context.fillStyle = BACKDROP;
      context.fillRect(0, 0, width, height);
      context.globalAlpha = 1;
      cleared = true;
      preset.draw(context, scene);
      if (analyser) frame = requestAnimationFrame(draw);
    };
    draw();
    const observer = new ResizeObserver(() => {
      if (!analyser) draw();
    });
    observer.observe(canvas);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [analyser, compact, preset]);

  return <canvas ref={canvasRef} className="block size-full" aria-hidden />;
}

function statusText(status: MicStatus, preset: Preset): string {
  switch (status) {
    case "live":
      return `Microphone · ${preset.name}`;
    case "starting":
      return "Connecting to microphone…";
    case "blocked":
      return "Microphone access was blocked";
    case "off":
      return "Ready";
  }
}

function PlayButton({ size }: { size: "large" | "small" }) {
  const { status } = useMic();
  const playing = status === "live" || status === "starting";
  const Glyph = playing ? StopGlyph : PlayGlyph;
  return (
    <button
      type="button"
      className="bbd-wmp-play"
      data-size={size}
      data-playing={playing}
      aria-label={playing ? "Stop visualizing the microphone" : "Visualize the microphone"}
      title={playing ? "Stop" : "Play"}
      onClick={() => (playing ? stopMic() : void startMic())}
    >
      <Glyph className={size === "large" ? "size-4" : "size-3"} strokeWidth={2.5} />
    </button>
  );
}

function PresetButton({ step }: { step: number }) {
  const Glyph = step < 0 ? PreviousGlyph : NextGlyph;
  const label = step < 0 ? "Previous visualization" : "Next visualization";
  return (
    <button type="button" className="bbd-wmp-button" aria-label={label} title={label} onClick={() => cyclePreset(step)}>
      <Glyph className="size-3.5" strokeWidth={2} />
    </button>
  );
}

export function MediaPlayerWindow({ window: desktopWindow }: { window: DesktopWindow }) {
  const { status } = useMic();
  const preset = usePreset();
  return (
    <WindowFrame
      window={desktopWindow}
      title="Windows Media Player"
      icon={<MediaPlayerArt size={16} />}
      statusBar={<span className="flex-1 truncate">{statusText(status, preset)}</span>}
    >
      <div className="bbd-wmp flex h-full flex-col">
        <div
          className="bbd-wmp-screen relative min-h-0 flex-1"
          onDoubleClick={() => cyclePreset(1)}
        >
          <Visualizer />
          {status === "live" ? null : (
            <div className="bbd-wmp-idle">
              <MediaPlayerArt size={56} />
              <span>
                {status === "blocked"
                  ? "Allow microphone access for bb, then press play."
                  : "Press play to visualize your microphone."}
              </span>
            </div>
          )}
        </div>
        <div className="bbd-wmp-transport">
          <PresetButton step={-1} />
          <PlayButton size="large" />
          <PresetButton step={1} />
          <span className="bbd-wmp-readout">{preset.name}</span>
        </div>
      </div>
    </WindowFrame>
  );
}

export function MediaDeskband({ onRestore }: { onRestore: () => void }) {
  return (
    <div className="bbd-deskband" role="group" aria-label="Windows Media Player">
      <PlayButton size="small" />
      <button
        type="button"
        className="bbd-deskband-screen"
        aria-label="Open Windows Media Player"
        title="Open Windows Media Player"
        onClick={onRestore}
      >
        <Visualizer compact />
      </button>
    </div>
  );
}
