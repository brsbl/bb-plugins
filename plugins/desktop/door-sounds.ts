// Original procedural door Foley. No recordings or AOL sound assets are used.
let context: AudioContext | null = null;
const buffers = new Map<"open" | "close", AudioBuffer>();

function audio(): AudioContext | null {
  if (typeof AudioContext === "undefined") return null;
  context ??= new AudioContext();
  if (context.state === "suspended") void context.resume().catch(() => undefined);
  return context;
}

function doorBuffer(ctx: AudioContext, kind: "open" | "close"): AudioBuffer {
  const cached = buffers.get(kind);
  if (cached !== undefined) return cached;
  const opening = kind === "open";
  const duration = opening ? 1.05 : 0.85;
  const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * duration), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let seed = opening ? 1741 : 9239;
  let phase = 0;
  let wood = 0;
  let friction = 0;
  for (let i = 0; i < data.length; i += 1) {
    const t = i / ctx.sampleRate;
    // Repeatable irregular friction rather than a regular oscillator warble.
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const noise = seed / 2147483648 - 1;
    wood += (noise - wood) * (1 - Math.exp(-2 * Math.PI * 480 / ctx.sampleRate));
    friction += (noise - friction) * (1 - Math.exp(-2 * Math.PI * 35 / ctx.sampleRate));
    const start = opening ? 0.09 : 0.015;
    const length = opening ? 0.8 : 0.38;
    const travel = Math.max(0, Math.min(1, (t - start) / length));
    const pitch = (opening ? 390 - 220 * travel : 170 + 170 * travel)
      + 23 * Math.sin(t * 31) + 11 * Math.sin(t * 79) + friction * 240;
    phase += 2 * Math.PI * pitch / ctx.sampleRate;
    const movement = Math.pow(Math.sin(Math.PI * travel), 0.8);
    const stickSlip = 0.55 + 0.45 * Math.sin(t * 57 + 1.8 * Math.sin(t * 19));
    const hinge = (Math.sin(phase) + 0.4 * Math.sin(phase * 2) + 0.2 * Math.sin(phase * 3))
      * movement * stickSlip * (opening ? 0.13 : 0.07);
    let sample = hinge + wood * movement * 0.08;
    // Handle/latch release precedes opening. The closing latch follows the impact.
    const latchAt = opening ? 0.015 : 0.48;
    const latchTime = t - latchAt;
    if (latchTime >= 0 && latchTime < 0.09) {
      sample += (noise - wood) * 0.2 * Math.exp(-latchTime * 65);
      const rattle = latchTime - 0.035;
      if (rattle > 0) sample += noise * 0.1 * Math.exp(-rattle * 95);
    }
    if (!opening && t >= 0.42) {
      const impact = t - 0.42;
      // Broad panel resonance, with an abrupt noisy strike and a low wooden tail.
      sample += wood * 1.2 * Math.exp(-impact * 22)
        + noise * 0.22 * Math.exp(-impact * 100)
        + (Math.sin(impact * 2 * Math.PI * 73)
          + 0.5 * Math.sin(impact * 2 * Math.PI * 119)
          + 0.25 * Math.sin(impact * 2 * Math.PI * 181)) * 0.22 * Math.exp(-impact * 18);
    }
    // Short edge fades avoid clicks; soft saturation bounds simultaneous components.
    const fade = Math.min(1, t / 0.003, (duration - t) / 0.025);
    data[i] = Math.tanh(sample) * fade * 0.7;
  }
  buffers.set(kind, buffer);
  return buffer;
}

function play(kind: "open" | "close") {
  const ctx = audio();
  if (ctx === null) return;
  const source = ctx.createBufferSource();
  source.buffer = doorBuffer(ctx, kind);
  source.connect(ctx.destination);
  source.onended = () => source.disconnect();
  source.start(ctx.currentTime + 0.02);
}

export function playDoorOpen() {
  play("open");
}

export function playDoorClose() {
  play("close");
}
