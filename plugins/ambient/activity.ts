import { MAX_AGENTS, MAX_RIPPLES, RIPPLE_KIND_CODE, type RippleKind } from "./contract.js";

export type ThreadMood = "working" | "waiting" | "idle";

export interface ThreadSignal {
  id: string;
  mood: ThreadMood;
  failed: boolean;
}

interface ThreadLike {
  id: string;
  isArchived: boolean;
  hasPendingInteraction: boolean;
  indicator: string;
  activity: {
    workflows: number;
    backgroundAgents: number;
    backgroundCommands: number;
    planMode: number;
    goals: number;
  };
}

const WORKING_INDICATORS = new Set([
  "runtime",
  "workflow",
  "background-agent",
  "background-command",
  "plan-mode",
  "goal",
]);

export function signalOf(thread: ThreadLike): ThreadSignal {
  const { activity } = thread;
  const busy =
    WORKING_INDICATORS.has(thread.indicator) ||
    activity.workflows +
      activity.backgroundAgents +
      activity.backgroundCommands +
      activity.goals >
      0;
  const waiting =
    thread.hasPendingInteraction || thread.indicator === "waiting-for-input";
  return {
    id: thread.id,
    mood: waiting ? "waiting" : busy ? "working" : "idle",
    failed: thread.indicator === "unread-error",
  };
}

export function signalsOf(threads: readonly ThreadLike[]): ThreadSignal[] {
  return threads.filter((thread) => !thread.isArchived).map(signalOf);
}

interface Agent {
  id: string;
  seed: number;
  mood: Exclude<ThreadMood, "idle">;
  presence: number;
  leaving: boolean;
  x: number;
  y: number;
}

interface Ripple {
  x: number;
  y: number;
  bornAt: number;
  kind: RippleKind;
}

/** One frame of uniforms. The arrays are reused by the next step(), so upload them right away. */
export interface ActivityFrame {
  agentCount: number;
  agents: Float32Array;
  rippleCount: number;
  ripples: Float32Array;
  activity: number;
}

export interface ActivitySummary {
  working: number;
  waiting: number;
}

const FADE_SECONDS = 1.6;
const RIPPLE_SECONDS = 4.5;

export function hashSeed(id: string): number {
  let hash = 2166136261;
  for (let index = 0; index < id.length; index += 1) {
    hash ^= id.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967295;
}

export function driftPosition(seed: number, time: number): [number, number] {
  const a = seed * 6.2831;
  const b = ((seed * 7.31) % 1) * 6.2831;
  const f1 = 0.6 + ((seed * 13.7) % 1) * 0.8;
  const f2 = 0.6 + ((seed * 29.3) % 1) * 0.8;
  const x =
    0.5 +
    0.36 * Math.sin(time * 0.045 * f1 + a) +
    0.08 * Math.sin(time * 0.13 * f2 + b);
  const y =
    0.5 +
    0.34 * Math.cos(time * 0.038 * f2 + b) +
    0.08 * Math.cos(time * 0.11 * f1 + a);
  return [x, y];
}

export class ActivityField {
  private agents = new Map<string, Agent>();
  private ripples: Ripple[] = [];
  private known = new Map<string, ThreadSignal>();
  private primed = false;
  private smoothedActivity = 0;
  private lastStep: number | null = null;
  private readonly agentBuffer = new Float32Array(MAX_AGENTS * 4);
  private readonly rippleBuffer = new Float32Array(MAX_RIPPLES * 4);

  observe(signals: readonly ThreadSignal[], now: number): void {
    const seen = new Set<string>();
    for (const signal of signals) {
      seen.add(signal.id);
      const previous = this.known.get(signal.id);
      this.known.set(signal.id, signal);
      const agent = this.agents.get(signal.id);
      if (signal.mood !== "idle") {
        if (agent && !agent.leaving) {
          agent.mood = signal.mood;
          continue;
        }
        const seed = hashSeed(signal.id);
        const [x, y] = driftPosition(seed, now);
        this.agents.set(signal.id, {
          id: signal.id,
          seed,
          mood: signal.mood,
          presence: agent?.presence ?? 0,
          leaving: false,
          x,
          y,
        });
        if (this.primed && previous?.mood !== signal.mood) {
          this.addRipple(x, y, now, "started");
        }
        continue;
      }
      if (agent && !agent.leaving) {
        agent.leaving = true;
        if (this.primed) {
          this.addRipple(agent.x, agent.y, now, signal.failed ? "error" : "done");
        }
      }
    }
    for (const [id, agent] of this.agents) {
      if (!seen.has(id)) agent.leaving = true;
    }
    for (const id of this.known.keys()) {
      if (!seen.has(id)) this.known.delete(id);
    }
    this.primed = true;
  }

  addRipple(x: number, y: number, now: number, kind: RippleKind): void {
    this.ripples.push({ x, y, bornAt: now, kind });
    if (this.ripples.length > MAX_RIPPLES) {
      this.ripples.splice(0, this.ripples.length - MAX_RIPPLES);
    }
  }

  rippleAtRandomAgent(now: number, kind: RippleKind): void {
    const live = [...this.agents.values()].filter((agent) => !agent.leaving);
    const agent = live[Math.floor(Math.random() * live.length)];
    const [x, y] = agent
      ? [agent.x, agent.y]
      : [0.3 + Math.random() * 0.4, 0.3 + Math.random() * 0.4];
    this.addRipple(x, y, now, kind);
  }

  summary(): ActivitySummary {
    let working = 0;
    let waiting = 0;
    for (const agent of this.agents.values()) {
      if (agent.leaving) continue;
      if (agent.mood === "waiting") waiting += 1;
      else working += 1;
    }
    return { working, waiting };
  }

  step(now: number): ActivityFrame {
    const dt = this.lastStep === null ? 0 : Math.min(now - this.lastStep, 0.25);
    this.lastStep = now;
    const fade = dt / FADE_SECONDS;
    for (const [id, agent] of this.agents) {
      agent.presence = agent.leaving
        ? agent.presence - fade
        : Math.min(1, agent.presence + fade);
      if (agent.leaving && agent.presence <= 0) {
        this.agents.delete(id);
        continue;
      }
      if (!agent.leaving) {
        [agent.x, agent.y] = driftPosition(agent.seed, now);
      }
    }
    this.ripples = this.ripples.filter(
      (ripple) => now - ripple.bornAt < RIPPLE_SECONDS,
    );

    const ordered = [...this.agents.values()]
      .sort((left, right) => right.presence - left.presence)
      .slice(0, MAX_AGENTS);
    const agents = this.agentBuffer.fill(0);
    ordered.forEach((agent, index) => {
      agents.set(
        [agent.x, agent.y, agent.mood === "waiting" ? 1 : 0, agent.presence],
        index * 4,
      );
    });
    const ripples = this.rippleBuffer.fill(0);
    this.ripples.forEach((ripple, index) => {
      ripples.set(
        [ripple.x, ripple.y, now - ripple.bornAt, RIPPLE_KIND_CODE[ripple.kind]],
        index * 4,
      );
    });
    const target = Math.min(1, this.summary().working / 4);
    this.smoothedActivity += (target - this.smoothedActivity) * Math.min(1, dt * 0.5);
    return {
      agentCount: ordered.length,
      agents,
      rippleCount: this.ripples.length,
      ripples,
      activity: this.smoothedActivity,
    };
  }
}
