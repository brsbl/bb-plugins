import type { ActivitySummary } from "./activity.js";
import type { RippleKind } from "./contract.js";
import { captureInContext, snapshotScene } from "./context.js";
import { motionBetween, type AmbientRenderer, type ThemeColors } from "./engine.js";
import type { CaptureRequest, CaptureSubmission } from "./rpc.js";

const CAPTURE_WIDTH = 960;
const CAPTURE_DELAY_MS = 900;
const MOTION_SAMPLE_MS = 1000;
const CONTEXT_CAPTURE_WIDTH = 1280;
const MAX_FRAME_MS = 10_000;

export interface CaptureSource {
  renderer: AmbientRenderer;
  canvas: HTMLCanvasElement;
  /** Draws a fresh frame, advancing the scene by the real time since the last one. */
  renderNow(): void;
  ripple(kind: RippleKind): void;
  theme(): ThemeColors;
  summary(): ActivitySummary;
  /** Measured cost of one frame at full detail, in milliseconds. */
  frameMs(): number;
  /** Effective render detail, 0..1. */
  detail(): number;
}

const delay = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

/**
 * What an agent sees when it checks its work: the scene alone, the scene under bb, and numbers
 * for how visible and how lively it is. Two frames a second apart measure motion.
 */
export async function captureScene(request: CaptureRequest, source: CaptureSource): Promise<CaptureSubmission> {
  const { renderer } = source;
  if (request.ripple) {
    source.ripple(request.ripple);
    await delay(CAPTURE_DELAY_MS);
  }
  source.renderNow();
  const before = await renderer.capture(CAPTURE_WIDTH, source.theme().canvas, { encode: false });
  await delay(MOTION_SAMPLE_MS);
  source.renderNow();
  const theme = source.theme();
  const frame = snapshotScene(source.canvas, CONTEXT_CAPTURE_WIDTH);
  const after = await renderer.capture(CAPTURE_WIDTH, theme.canvas, { encode: true });
  const context = await captureInContext(frame, theme.canvas).catch(() => null);
  return {
    requestId: request.requestId,
    dataUrl: after.dataUrl,
    ...(context ? { context } : {}),
    summary: source.summary(),
    visibility: {
      ...after.visibility,
      motion: motionBetween(before, after),
      frameMs: Math.min(source.frameMs(), MAX_FRAME_MS),
      detail: Math.min(1, source.detail()),
    },
    dark: theme.dark,
  };
}
