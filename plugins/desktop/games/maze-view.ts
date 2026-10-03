/** Pure pieces of the 3D Maze view, kept apart from the canvas code so they can be tested. */

/**
 * The view renders at most this many pixels and is scaled up to the window. The original drew at about 320 × 240 and
 * stretched it, which is where its soft look comes from.
 */
export const MAX_VIEW_PIXELS = 400 * 300;
/**
 * While rolling, the buffer is the square on the viewport's diagonal. A 4:3 view's square is about 2.1 times its area, so
 * this keeps ordinary windows at the same detail through a roll while capping very wide or tall ones.
 */
export const MAX_ROLL_PIXELS = MAX_VIEW_PIXELS * 2.1;

/**
 * The render buffer for a canvas of the given size, within MAX_VIEW_PIXELS. While the view rolls the buffer is square
 * and as wide as the viewport's diagonal (so rotating it never exposes a corner), within MAX_ROLL_PIXELS. A rolling
 * buffer is drawn at one uniform `scale` (canvas pixels per buffer pixel, taken from the longer side so rounding the
 * shorter one cannot skew it), and its side is the viewport's diagonal in that scale. Scaling each axis by its own
 * rounded size can fall short in very wide or tall windows and expose corners mid-roll.
 */
export function viewSize(canvasWidth: number, canvasHeight: number, rolling: boolean) {
  const fit = rolling
    ? Math.min(1, Math.sqrt(MAX_VIEW_PIXELS / Math.max(1, canvasWidth * canvasHeight)), Math.sqrt(MAX_ROLL_PIXELS / Math.max(1, canvasWidth * canvasWidth + canvasHeight * canvasHeight)))
    : Math.min(1, Math.sqrt(MAX_VIEW_PIXELS / Math.max(1, canvasWidth * canvasHeight)));
  const baseWidth = Math.max(1, Math.round(canvasWidth * fit));
  const baseHeight = Math.max(1, Math.round(canvasHeight * fit));
  const scale = canvasWidth >= canvasHeight ? canvasWidth / baseWidth : canvasHeight / baseHeight;
  const diagonal = Math.ceil(Math.hypot(canvasWidth, canvasHeight) / scale);
  return { baseWidth, baseHeight, scale, width: rolling ? diagonal : baseWidth, height: rolling ? diagonal : baseHeight };
}

/** What a key press asks of the maze. Held keys repeat, and a repeat must not toggle pause or rebuild the maze again. */
export function mazeShortcut(event: Pick<KeyboardEvent, "key" | "repeat">): "new-maze" | "pause" | null {
  if (event.key !== "F2" && event.key !== "F3") return null;
  if (event.repeat) return null;
  return event.key === "F2" ? "new-maze" : "pause";
}
