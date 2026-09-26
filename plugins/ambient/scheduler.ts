// Decides when the scene draws. The canvas sits under every glass surface, so each frame also
// re-composites their backdrop blur: frames are spent only when someone could notice them.
//
//   active  30 fps  recent input, agents working, or ripples playing
//   idle    10 fps  nothing happening (agents idle or waiting on you); the scene keeps drifting
//   paused   0 fps  bb hidden or unfocused (and not hovered); one frame for any change, then stop
//   still    0 fps  prefers-reduced-motion, except while a ripple plays
//
// It also owns auto-scale: when frames arrive late it lowers render resolution, and raises it
// again once they are comfortably on time.

const ACTIVE_FRAME_MS = 1000 / 30;
const IDLE_FRAME_MS = 1000 / 10;
const ACTIVE_INPUT_MS = 3_000;
const FRAME_TOLERANCE_MS = 2;
const DISCONTINUITY_MS = 1000;
const MAX_STEP_MS = 250;
const MAX_CAPTURE_STEP_MS = 1_000;
const SLOW_LATENESS_MS = 25;
const FAST_LATENESS_MS = 6;
const STALL_LATENESS_MS = 80;
const STALLED_FRAME_INTERVAL_MS = 250;
const SCALE_DOWN_AFTER_MS = 1_500;
const SCALE_UP_AFTER_MS = 8_000;
export const MIN_AUTO_SCALE = 0.25;
export const TARGET_FRAME_MS = 12;

export interface FrameHooks {
  /** Draw one frame at this scene time, in seconds. */
  draw(time: number): void;
  speed(): number;
  /** Agents are working. */
  busy(): boolean;
  rippling(): boolean;
  onScale(scale: number): void;
}

export class FrameScheduler {
  time = 0;
  autoScale = 1;
  private lateness = 0;
  private lastAdjust = 0;
  private last = 0;
  private lastInterval = 0;
  private lastInput = Number.NEGATIVE_INFINITY;
  private frame = 0;
  private dirty = true;
  private running = false;
  private readonly reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  constructor(private readonly hooks: FrameHooks) {}

  start(): () => void {
    this.running = true;
    this.last = performance.now();
    const input = () => {
      this.lastInput = performance.now();
      this.schedule();
    };
    const resume = () => this.schedule();
    const changed = () => this.wake();
    const options = { passive: true, capture: true } as const;
    for (const type of ["pointermove", "pointerdown", "keydown", "wheel"] as const) {
      window.addEventListener(type, input, options);
    }
    window.addEventListener("focus", resume);
    window.addEventListener("resize", changed);
    document.addEventListener("visibilitychange", resume);
    this.reducedMotion.addEventListener("change", changed);
    this.wake();
    return () => {
      this.running = false;
      cancelAnimationFrame(this.frame);
      this.frame = 0;
      this.lateness = 0;
      for (const type of ["pointermove", "pointerdown", "keydown", "wheel"] as const) {
        window.removeEventListener(type, input, options);
      }
      window.removeEventListener("focus", resume);
      window.removeEventListener("resize", changed);
      document.removeEventListener("visibilitychange", resume);
      this.reducedMotion.removeEventListener("change", changed);
    };
  }

  /** Something visible changed (scene, palette, theme, size): draw at least one frame, even when paused. */
  wake(): void {
    this.dirty = true;
    this.schedule();
  }

  /** Draws right now, advancing the scene by the real time since the last frame. Used by captures. */
  renderNow(): void {
    const now = performance.now();
    this.draw(now, Math.min(now - this.last, MAX_CAPTURE_STEP_MS));
  }

  /** Sets resolution from a measured full-detail frame cost, and restarts pacing. */
  calibrate(fullDetailMs: number): void {
    this.setScale(
      fullDetailMs > TARGET_FRAME_MS ? Math.max(MIN_AUTO_SCALE, Math.sqrt(TARGET_FRAME_MS / fullDetailMs)) : 1,
    );
    this.lateness = 0;
    this.lastAdjust = performance.now();
  }

  resetScale(): void {
    this.setScale(1);
  }

  private schedule(): void {
    if (this.running && !this.frame) this.frame = requestAnimationFrame(this.tick);
  }

  private readonly tick = (timestamp: number) => {
    this.frame = 0;
    const hovered = timestamp - this.lastInput < ACTIVE_INPUT_MS;
    const paused = document.hidden || (!document.hasFocus() && !hovered);
    const still = this.reducedMotion.matches && !this.hooks.rippling();
    if (paused || still) {
      if (this.dirty) this.draw(timestamp, 0);
      return;
    }
    this.frame = requestAnimationFrame(this.tick);
    const stalled = this.autoScale <= MIN_AUTO_SCALE && this.lateness > STALL_LATENESS_MS;
    const active = hovered || this.hooks.busy() || this.hooks.rippling();
    const interval = stalled ? STALLED_FRAME_INTERVAL_MS : active ? ACTIVE_FRAME_MS : IDLE_FRAME_MS;
    const elapsed = timestamp - this.last;
    if (!this.dirty && elapsed < interval - FRAME_TOLERANCE_MS) return;
    if (!this.dirty && interval === this.lastInterval && elapsed < DISCONTINUITY_MS) {
      this.pace(timestamp, elapsed - interval);
    }
    this.lastInterval = interval;
    this.draw(timestamp, this.reducedMotion.matches ? 0 : Math.min(elapsed, MAX_STEP_MS));
  };

  private pace(timestamp: number, late: number): void {
    this.lateness = this.lateness * 0.9 + Math.max(0, late) * 0.1;
    const sinceAdjust = timestamp - this.lastAdjust;
    if (this.lateness > SLOW_LATENESS_MS && sinceAdjust > SCALE_DOWN_AFTER_MS && this.autoScale > MIN_AUTO_SCALE) {
      this.setScale(Math.max(MIN_AUTO_SCALE, this.autoScale * 0.7));
      this.lastAdjust = timestamp;
    } else if (this.lateness < FAST_LATENESS_MS && sinceAdjust > SCALE_UP_AFTER_MS && this.autoScale < 1) {
      this.setScale(Math.min(1, this.autoScale / 0.85));
      this.lastAdjust = timestamp;
    }
  }

  private setScale(scale: number): void {
    if (scale === this.autoScale) return;
    this.autoScale = scale;
    this.hooks.onScale(scale);
  }

  private draw(timestamp: number, stepMs: number): void {
    this.time += (stepMs / 1000) * this.hooks.speed();
    this.last = timestamp;
    this.dirty = false;
    this.hooks.draw(this.time);
  }
}
