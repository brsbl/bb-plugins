import { useEffect, useRef, useSyncExternalStore } from "react";

import { MediaPlayerArt, MicGlyph, NextGlyph, PlayGlyph, PreviousGlyph, StopGlyph } from "./art";
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

const BACKDROP = "oklch(0.16 0.04 262)";

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

function smoothLine(context: CanvasRenderingContext2D, points: readonly [number, number][], closed = false) {
  if (points.length < 2) return;
  const at = (index: number) => points[(index + points.length) % points.length]!;
  const mid = (a: [number, number], b: [number, number]): [number, number] => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const first = closed ? mid(at(-1), at(0)) : at(0);
  context.moveTo(first[0], first[1]);
  const last = closed ? points.length : points.length - 1;
  for (let index = closed ? 0 : 1; index < last; index += 1) {
    const [x, y] = mid(at(index), at(index + 1));
    context.quadraticCurveTo(at(index)[0], at(index)[1], x, y);
  }
  if (closed) context.closePath();
  else context.lineTo(at(-1)[0], at(-1)[1]);
}

const PRESETS: readonly Preset[] = [
  {
    name: "Bars and Waves: Bars",
    trail: 1,
    draw(context, { freq, peaks, width, height, compact }) {
      const levels = bands(freq, compact ? 12 : 36);
      const gap = compact ? 2 : 4;
      const barWidth = (width - gap * (levels.length + 1)) / levels.length;
      const floor = compact ? height - 2 : height * 0.78;
      const reach = floor - (compact ? 2 : 10);
      const gradient = context.createLinearGradient(0, floor, 0, floor - reach);
      gradient.addColorStop(0, "oklch(0.72 0.14 160)");
      gradient.addColorStop(0.55, "oklch(0.88 0.13 110)");
      gradient.addColorStop(1, "oklch(0.74 0.15 40)");
      const radius = Math.min(barWidth / 2, compact ? 1.5 : 4);
      levels.forEach((level, index) => {
        const x = gap + index * (barWidth + gap);
        const barHeight = Math.max(barWidth, level * reach);
        context.fillStyle = gradient;
        context.beginPath();
        context.roundRect(x, floor - barHeight, barWidth, barHeight, radius);
        context.fill();
        if (!compact) {
          const reflection = context.createLinearGradient(0, floor, 0, floor + barHeight * 0.3);
          reflection.addColorStop(0, "oklch(0.72 0.14 160 / 0.28)");
          reflection.addColorStop(1, "oklch(0.72 0.14 160 / 0)");
          context.fillStyle = reflection;
          context.beginPath();
          context.roundRect(x, floor + 3, barWidth, barHeight * 0.3, radius);
          context.fill();
        }
        const peak = Math.max(level, (peaks[index] ?? 0) - 0.008);
        peaks[index] = peak;
        if (!compact && peak > 0.02) {
          context.fillStyle = "oklch(0.97 0.02 250 / 0.9)";
          context.beginPath();
          context.roundRect(x, floor - peak * reach - 6, barWidth, 3, 1.5);
          context.fill();
        }
      });
    },
  },
  {
    name: "Bars and Waves: Scope",
    trail: 0.45,
    draw(context, { wave, tick, width, height, compact }) {
      const count = compact ? 32 : 96;
      const points = Array.from({ length: count }, (_, index): [number, number] => {
        const sample = ((wave[Math.floor((index / (count - 1)) * (wave.length - 1))] ?? 128) - 128) / 128;
        const taper = Math.sin((index / (count - 1)) * Math.PI);
        return [(index / (count - 1)) * width, height / 2 + sample * taper * height * 0.42];
      });
      const hue = 220 + Math.sin(tick * 0.01) * 40;
      const stroke = context.createLinearGradient(0, 0, width, 0);
      stroke.addColorStop(0, `oklch(0.8 0.13 ${hue})`);
      stroke.addColorStop(0.5, `oklch(0.88 0.12 ${hue - 60})`);
      stroke.addColorStop(1, `oklch(0.8 0.14 ${hue + 90})`);
      context.lineCap = "round";
      context.lineJoin = "round";
      context.strokeStyle = stroke;
      context.shadowColor = `oklch(0.75 0.15 ${hue})`;
      context.shadowBlur = compact ? 4 : 16;
      context.lineWidth = compact ? 1.5 : 3;
      context.beginPath();
      smoothLine(context, points);
      context.stroke();
      context.shadowBlur = 0;
      if (!compact) {
        context.globalAlpha = 0.25;
        context.lineWidth = 1.5;
        context.beginPath();
        smoothLine(context, points.map(([x, y]): [number, number] => [x, height - y]));
        context.stroke();
        context.globalAlpha = 1;
      }
    },
  },
  {
    name: "Ambience: Swirl",
    trail: 0.16,
    draw(context, { freq, tick, width, height, compact }) {
      const levels = bands(freq, compact ? 12 : 32);
      const energy = levels.reduce((sum, level) => sum + level, 0) / levels.length;
      const radius = Math.min(width, height) * (compact ? 0.3 : 0.16 + energy * 0.3);
      const arms = compact ? 5 : 7;
      context.save();
      context.globalCompositeOperation = "lighter";
      context.translate(width / 2, height / 2);
      context.rotate(tick * 0.005 + energy * 0.8);
      context.lineCap = "round";
      context.lineJoin = "round";
      for (let arm = 0; arm < arms; arm += 1) {
        context.rotate((Math.PI * 2) / arms);
        const points = levels.map((level, index): [number, number] => {
          const angle = (index / (levels.length - 1)) * Math.PI;
          const reach = radius * (0.35 + level * 1.7);
          return [Math.cos(angle) * reach, Math.sin(angle) * reach * 0.45];
        });
        const hue = 250 + Math.sin(tick * 0.008 + arm) * 70;
        context.strokeStyle = `oklch(0.7 0.14 ${hue} / 0.4)`;
        context.shadowColor = `oklch(0.7 0.16 ${hue})`;
        context.shadowBlur = compact ? 2 : 6;
        context.lineWidth = compact ? 1 : 1.75;
        context.beginPath();
        smoothLine(context, points);
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

function idleText(status: MicStatus): string {
  switch (status) {
    case "starting":
      return "Allow microphone access when your browser asks.";
    case "blocked":
      return "Microphone access is blocked. Allow it in your browser's site settings, then click here to try again.";
    default:
      return "Click here to visualize your microphone.";
  }
}

export function MediaPlayerWindow({ window: desktopWindow }: { window: DesktopWindow }) {
  const { status } = useMic();
  const preset = usePreset();
  const autoplay = useRef(desktopWindow.openedThisSession);

  useEffect(() => {
    if (autoplay.current) void startMic();
    return stopMic;
  }, []);
  return (
    <WindowFrame
      window={desktopWindow}
      title="Windows Media Player"
      icon={<MediaPlayerArt size={16} />}
      statusBar={<span className="flex-1 truncate">{statusText(status, preset)}</span>}
    >
      <div className="bbd-wmp h-full">
        <div
          className="bbd-wmp-screen relative min-h-0 flex-1"
          data-idle={status !== "live"}
          onClick={() => {
            if (status === "off" || status === "blocked") void startMic();
          }}
          onDoubleClick={() => {
            if (status === "live") cyclePreset(1);
          }}
        >
          <Visualizer />
          {status === "live" ? null : (
            <div className="bbd-wmp-idle">
              <MicGlyph className="size-10" strokeWidth={1.5} />
              <span>{idleText(status)}</span>
            </div>
          )}
        </div>
        <div className="bbd-wmp-transport">
          <PresetButton step={-1} />
          <PlayButton size="large" />
          <PresetButton step={1} />
          <div className="bbd-wmp-readout">
            <span>{preset.name}</span>
            <span className="bbd-wmp-dots" aria-hidden>
              {PRESETS.map((candidate) => (
                <i key={candidate.name} data-active={candidate === preset} />
              ))}
            </span>
          </div>
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
