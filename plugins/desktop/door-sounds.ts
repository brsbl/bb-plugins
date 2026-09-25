let context: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof AudioContext === "undefined") return null;
  context ??= new AudioContext();
  if (context.state === "suspended") void context.resume().catch(() => undefined);
  return context;
}

function noise(ctx: AudioContext, seconds: number): AudioBufferSourceNode {
  const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * seconds), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  return source;
}

function envelope(ctx: AudioContext, at: number, peak: number, attack: number, decay: number): GainNode {
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(peak, at + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + attack + decay);
  gain.connect(ctx.destination);
  return gain;
}

function knock(ctx: AudioContext, at: number, pitch: number, peak: number, decay: number) {
  const body = ctx.createOscillator();
  body.type = "sine";
  body.frequency.setValueAtTime(pitch * 1.6, at);
  body.frequency.exponentialRampToValueAtTime(pitch, at + 0.05);
  body.connect(envelope(ctx, at, peak, 0.004, decay));
  body.start(at);
  body.stop(at + decay + 0.05);
  const thud = noise(ctx, decay + 0.05);
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = pitch * 5;
  thud.connect(filter).connect(envelope(ctx, at, peak * 0.8, 0.002, decay * 0.6));
  thud.start(at);
}

function latch(ctx: AudioContext, at: number, peak: number) {
  const click = noise(ctx, 0.04);
  const filter = ctx.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = 2400;
  click.connect(filter).connect(envelope(ctx, at, peak, 0.001, 0.03));
  click.start(at);
}

function creak(ctx: AudioContext, at: number, seconds: number, peak: number) {
  const hinge = ctx.createOscillator();
  hinge.type = "sawtooth";
  hinge.frequency.setValueAtTime(210, at);
  hinge.frequency.linearRampToValueAtTime(340, at + seconds * 0.6);
  hinge.frequency.linearRampToValueAtTime(290, at + seconds);
  const wobble = ctx.createOscillator();
  wobble.frequency.value = 28;
  const depth = ctx.createGain();
  depth.gain.value = 40;
  wobble.connect(depth).connect(hinge.frequency);
  const band = ctx.createBiquadFilter();
  band.type = "bandpass";
  band.frequency.value = 900;
  band.Q.value = 4;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(peak, at + 0.06);
  gain.gain.setValueAtTime(peak, at + seconds - 0.08);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + seconds);
  gain.connect(ctx.destination);
  hinge.connect(band).connect(gain);
  hinge.start(at);
  wobble.start(at);
  hinge.stop(at + seconds);
  wobble.stop(at + seconds);
}

export function playDoorOpen() {
  const ctx = audio();
  if (ctx === null) return;
  const at = ctx.currentTime + 0.02;
  latch(ctx, at, 0.18);
  creak(ctx, at + 0.05, 0.45, 0.07);
  knock(ctx, at + 0.52, 150, 0.12, 0.12);
}

export function playDoorClose() {
  const ctx = audio();
  if (ctx === null) return;
  const at = ctx.currentTime + 0.02;
  creak(ctx, at, 0.18, 0.04);
  knock(ctx, at + 0.18, 90, 0.35, 0.28);
  latch(ctx, at + 0.2, 0.2);
}
