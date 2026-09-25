/**
 * Everything is synthesized, so the plugin ships no audio files. While a
 * cousin rolls, a bouncy original tune plays over the clack of the ball;
 * pickups pop, bumps bonk, and a thread switch whooshes.
 */

const BPM = 132;
const STEP_SECONDS = 60 / BPM / 2;
const SWING = 0.18;
const LOOKAHEAD_SECONDS = 0.12;
const SCHEDULER_MS = 25;

const NOTE_INDEX: Record<string, number> = {
  C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11,
};

function frequency(note: string): number {
  const match = /^([A-G])(#?)(\d)$/.exec(note);
  if (!match) return 0;
  const semitone = NOTE_INDEX[match[1]] + (match[2] ? 1 : 0) + (Number(match[3]) + 1) * 12;
  return 440 * 2 ** ((semitone - 69) / 12);
}

// Eight bars of eighth notes. "-" rests; anything else plays a short note.
const MELODY = [
  "E5 G5 A5 G5 E5 - C5 D5",
  "E5 - D5 C5 A4 - C5 -",
  "F5 A5 C6 A5 G5 - F5 E5",
  "D5 - E5 F5 G5 - - -",
  "E5 G5 C6 B5 A5 G5 E5 G5",
  "A5 - G5 E5 C5 - D5 E5",
  "F5 E5 D5 F5 E5 D5 C5 D5",
  "C5 - G4 - C5 - - -",
].map((bar) => bar.split(" "));

const CHORDS = [
  ["C4", "E4", "G4"],
  ["A3", "C4", "E4"],
  ["F3", "A3", "C4"],
  ["G3", "B3", "D4"],
  ["C4", "E4", "G4"],
  ["A3", "C4", "E4"],
  ["D4", "F4", "A4"],
  ["G3", "B3", "D4"],
];

const BASS_ROOTS = ["C2", "A1", "F2", "G2", "C2", "A1", "D2", "G2"];

export class KatamariAudio {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private scheduler: number | null = null;
  private nextStepTime = 0;
  private step = 0;
  private musicOn = false;
  private muted: boolean;
  private lastClack = 0;

  constructor(muted: boolean) {
    this.muted = muted;
  }

  get isMuted(): boolean {
    return this.muted;
  }

  /** Create or resume audio. Browsers only allow this after a user gesture. */
  unlock(): void {
    if (typeof AudioContext === "undefined") return;
    if (!this.context) {
      const context = new AudioContext();
      this.context = context;
      this.master = context.createGain();
      this.master.gain.value = this.muted ? 0 : 0.5;
      this.master.connect(context.destination);

      this.musicBus = context.createGain();
      this.musicBus.gain.value = 0;
      this.musicBus.connect(this.master);

      this.noise = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
      const samples = this.noise.getChannelData(0);
      let brown = 0;
      for (let index = 0; index < samples.length; index += 1) {
        brown = (brown + 0.02 * (Math.random() * 2 - 1)) / 1.02;
        samples[index] = brown * 3.5;
      }
    }
    // Muted means silent: send no samples to the speakers at all.
    if (this.muted) void this.context.suspend();
    else if (this.context.state === "suspended") void this.context.resume();
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    const context = this.context;
    if (!context || !this.master) return;
    this.master.gain.setTargetAtTime(muted ? 0 : 0.5, context.currentTime, 0.05);
    if (!muted) {
      void context.resume();
      return;
    }
    // Let the fade finish, then stop sending samples to the speakers.
    window.setTimeout(() => {
      if (this.muted) void context.suspend();
    }, 300);
  }

  /** Call every frame with the ball's speed normalized to 0..1. */
  setRolling(rolling: boolean, speed: number): void {
    const context = this.context;
    if (!context || !this.musicBus) return;
    const now = context.currentTime;
    const intensity = rolling ? Math.min(1, Math.max(0, speed)) : 0;
    if (rolling && intensity > 0.15 && now - this.lastClack > 0.09 + (1 - intensity) * 0.25) {
      this.lastClack = now;
      if (Math.random() < 0.55) this.clack(now);
    }
    if (rolling && !this.musicOn) this.startMusic();
    if (!rolling && this.musicOn) this.stopMusic();
  }

  pickup(sizeRatio: number): void {
    const context = this.context;
    if (!context || !this.master) return;
    const now = context.currentTime;
    const pitch = 1500 - Math.min(1, sizeRatio) * 800;
    this.tone("sine", pitch, now, 0.12, 0.28, pitch * 1.6);
    this.tone("triangle", pitch * 1.5, now + 0.06, 0.16, 0.18, pitch * 2);
  }

  /**
   * The katamari swallowing context: a small munch for a nibble, and for a
   * heavy turn a run of deep gulps over a thud and a crunch of junk.
   * `strength` runs 0..1.
   */
  gulp(strength: number): void {
    const context = this.context;
    if (!context) return;
    const now = context.currentTime;
    const amount = Math.min(1, Math.max(0, strength));
    const gulps = amount < 0.25 ? 1 : amount < 0.6 ? 2 : 3;
    for (let index = 0; index < gulps; index += 1) {
      const time = now + index * 0.2;
      const hz = 260 - amount * 150 - index * 18;
      this.tone("sine", hz, time, 0.16 + amount * 0.12, 0.22 + amount * 0.25, hz * 0.35);
      this.noiseBurst(time, 0.1, 0.1 + amount * 0.18, "lowpass", 900, 200);
    }
    if (amount >= 0.6) {
      this.tone("sine", 70, now, 0.7, 0.5, 28);
      this.noiseBurst(now + 0.05, 0.45, 0.3, "bandpass", 3000, 400);
      // A satisfied belch-like rumble to close it out.
      this.tone("sawtooth", 90, now + gulps * 0.2, 0.35, 0.12, 60);
    }
  }

  /** A coin dropping behind the Prince: a bright two-note ching. */
  coin(): void {
    const context = this.context;
    if (!context) return;
    const now = context.currentTime;
    this.tone("square", frequency("B5"), now, 0.06, 0.035);
    this.tone("square", frequency("E6"), now + 0.06, 0.18, 0.035);
  }

  bonk(): void {
    const context = this.context;
    if (!context) return;
    const now = context.currentTime;
    this.tone("sine", 150, now, 0.18, 0.35, 55);
    this.noiseBurst(now, 0.08, 0.2, "lowpass", 600, 300);
  }

  whoosh(): void {
    const context = this.context;
    if (!context) return;
    this.noiseBurst(context.currentTime, 0.55, 0.3, "bandpass", 300, 2400);
  }

  shed(): void {
    const context = this.context;
    if (!context) return;
    const now = context.currentTime;
    ["G5", "E5", "C5", "G4"].forEach((note, index) => {
      this.tone("square", frequency(note), now + index * 0.07, 0.1, 0.1);
    });
  }

  /** Compaction: a fat pop, a sparkly fanfare, then a slide-whistle shrink. */
  pop(): void {
    const context = this.context;
    if (!context) return;
    const now = context.currentTime;
    this.noiseBurst(now, 0.3, 0.45, "bandpass", 2400, 180);
    this.tone("sine", 110, now, 0.35, 0.45, 38);
    ["C6", "E6", "G6", "C7"].forEach((note, index) => {
      this.tone("triangle", frequency(note), now + 0.08 + index * 0.06, 0.18, 0.16);
    });
    this.tone("sine", 1400, now + 0.35, 0.8, 0.12, 260);
  }

  dispose(): void {
    if (this.scheduler !== null) window.clearInterval(this.scheduler);
    this.scheduler = null;
    void this.context?.close();
    this.context = null;
  }

  private startMusic(): void {
    const context = this.context;
    if (!context || !this.musicBus) return;
    this.musicOn = true;
    this.musicBus.gain.setTargetAtTime(0.5, context.currentTime, 0.25);
    if (this.scheduler === null) {
      this.nextStepTime = context.currentTime + 0.05;
      this.scheduler = window.setInterval(() => this.schedule(), SCHEDULER_MS);
    }
  }

  private stopMusic(): void {
    const context = this.context;
    if (!context || !this.musicBus) return;
    this.musicOn = false;
    this.musicBus.gain.setTargetAtTime(0, context.currentTime, 0.3);
    window.setTimeout(() => {
      if (!this.musicOn && this.scheduler !== null) {
        window.clearInterval(this.scheduler);
        this.scheduler = null;
      }
    }, 1500);
  }

  private schedule(): void {
    const context = this.context;
    if (!context) return;
    while (this.nextStepTime < context.currentTime + LOOKAHEAD_SECONDS) {
      this.playStep(this.step, this.nextStepTime);
      const swing = this.step % 2 === 0 ? 1 + SWING : 1 - SWING;
      this.nextStepTime += STEP_SECONDS * swing;
      this.step = (this.step + 1) % (MELODY.length * 8);
    }
  }

  private playStep(step: number, time: number): void {
    const bar = Math.floor(step / 8);
    const beat = step % 8;
    const note = MELODY[bar][beat];
    if (note !== "-") {
      this.voice("square", frequency(note), time, STEP_SECONDS * 0.9, 0.07, 2400);
      this.voice("triangle", frequency(note) * 2, time, STEP_SECONDS * 0.5, 0.025, 6000);
    }
    const root = frequency(BASS_ROOTS[bar]);
    if (beat % 2 === 0) {
      const bassNote = beat % 4 === 0 ? root : root * 2;
      this.voice("triangle", bassNote, time, STEP_SECONDS * 0.85, 0.22, 900);
    }
    if (beat % 4 === 2) {
      for (const chordNote of CHORDS[bar]) {
        this.voice("sine", frequency(chordNote), time, STEP_SECONDS * 0.7, 0.05, 3000);
      }
    }
    if (beat % 4 === 0) this.kick(time);
    if (beat % 4 === 2) this.snare(time);
    this.hat(time, beat % 2 === 0 ? 0.035 : 0.02);
  }

  private voice(
    type: OscillatorType,
    hz: number,
    time: number,
    duration: number,
    level: number,
    cutoff: number,
  ): void {
    const context = this.context;
    if (!context || !this.musicBus) return;
    const oscillator = context.createOscillator();
    oscillator.type = type;
    oscillator.frequency.value = hz;
    const filter = context.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = cutoff;
    const gain = context.createGain();
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(level, time + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    oscillator.connect(filter).connect(gain).connect(this.musicBus);
    oscillator.start(time);
    oscillator.stop(time + duration + 0.02);
  }

  private kick(time: number): void {
    const context = this.context;
    if (!context || !this.musicBus) return;
    const oscillator = context.createOscillator();
    oscillator.frequency.setValueAtTime(140, time);
    oscillator.frequency.exponentialRampToValueAtTime(45, time + 0.12);
    const gain = context.createGain();
    gain.gain.setValueAtTime(0.35, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.16);
    oscillator.connect(gain).connect(this.musicBus);
    oscillator.start(time);
    oscillator.stop(time + 0.2);
  }

  private snare(time: number): void {
    this.noiseBurst(time, 0.12, 0.09, "bandpass", 1800, 1800, this.musicBus);
  }

  private hat(time: number, level: number): void {
    this.noiseBurst(time, 0.04, level, "highpass", 7000, 7000, this.musicBus);
  }

  private clack(time: number): void {
    const hz = 700 + Math.random() * 900;
    this.tone("square", hz, time, 0.025, 0.03, hz * 0.8);
  }

  private tone(
    type: OscillatorType,
    hz: number,
    time: number,
    duration: number,
    level: number,
    endHz = hz,
  ): void {
    const context = this.context;
    if (!context || !this.master) return;
    const oscillator = context.createOscillator();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(hz, time);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, endHz), time + duration);
    const gain = context.createGain();
    gain.gain.setValueAtTime(level, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    oscillator.connect(gain).connect(this.master);
    oscillator.start(time);
    oscillator.stop(time + duration + 0.02);
  }

  private noiseBurst(
    time: number,
    duration: number,
    level: number,
    type: BiquadFilterType,
    fromHz: number,
    toHz: number,
    destination: AudioNode | null = this.master,
  ): void {
    const context = this.context;
    if (!context || !this.noise || !destination) return;
    const source = context.createBufferSource();
    source.buffer = this.noise;
    source.playbackRate.value = 4;
    const filter = context.createBiquadFilter();
    filter.type = type;
    filter.frequency.setValueAtTime(fromHz, time);
    filter.frequency.exponentialRampToValueAtTime(toHz, time + duration);
    const gain = context.createGain();
    gain.gain.setValueAtTime(level, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    source.connect(filter).connect(gain).connect(destination);
    source.start(time, Math.random());
    source.stop(time + duration + 0.02);
  }
}
