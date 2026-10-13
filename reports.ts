import type { ContextReport, Visibility } from "./rpc.js";

const FLAT_OPEN_SPREAD = 0.04;
const HARD_TO_READ_SHARE = 0.02;

const FAINT_FROM_BACKGROUND = 0.06;
const FLAT_SPREAD = 0.025;
const STILL_MOTION = 0.0025;
const HEAVY_FRAME_MS = 8;

export function describeVisibility(
  visibility: Visibility,
  dark: boolean,
): string {
  const percent = (value: number) => `${Math.round(value * 100)}%`;
  const measured = `Measured against bb's ${dark ? "dark" : "light"} background: ${percent(visibility.fromBackground)} average color difference, ${percent(visibility.spread)} brightness variation, ${(visibility.motion * 100).toFixed(1)}% change over one second. One frame takes ${visibility.frameMs.toFixed(1)} ms to render at ${percent(visibility.detail)} detail.`;
  const faint = [
    visibility.fromBackground < FAINT_FROM_BACKGROUND &&
      "the scene is nearly the same color as bb's background, so it will be close to invisible behind bb's veil",
    visibility.spread < FLAT_SPREAD && "the scene is almost flat, with little visible structure",
  ].filter(Boolean);
  const notes = [
    faint.length > 0 &&
      `Too faint: ${faint.join("; ")}. The veil already adapts to the theme, so do not darken or wash out the scene yourself; raise its contrast and color.`,
    visibility.motion < STILL_MOTION &&
      "Nearly still: almost nothing moved in a second at the user's speed. Give the scene visible, continuous motion.",
    visibility.frameMs > HEAVY_FRAME_MS &&
      `Too heavy: frames should render in under ${HEAVY_FRAME_MS} ms or bb slows down. Use fewer loop iterations and fbm octaves, and never call fbm inside the per-agent or per-ripple loops.`,
  ].filter(Boolean);
  return [measured, ...notes].join(" ");
}

export function describeContext(report: ContextReport): string {
  const percent = (value: number) => `${Math.round(value * 100)}%`;
  const range = (a: number, b: number) => `${a.toFixed(2)}–${b.toFixed(2)}`;
  const panels = report.panels
    .map((panel) => `x ${range(panel.x0, panel.x1)}, y ${range(panel.y0, panel.y1)}`)
    .join("; ");
  const { text } = report;
  const lines = [
    `The first image is the scene as the user sees it: behind bb's real panels and frosted glass, with each word of bb's text drawn as a bar in its real color and position, in a ${Math.round(report.width)}×${Math.round(report.height)} window. Judge the scene by that image. The second image is the raw scene.`,
    `bb's panels cover ${percent(1 - report.openArea)} of the window, at uv (y up): ${panels || "none"}. Under them the scene is blurred and tinted, so only big shapes and color fields read there; the rest of the window shows the scene clearly. These positions hold only for this window: the sidebar collapses and windows resize, so never mask, fade, or tint the scene to fit them. Brightness variation is ${percent(report.openSpread)} in the open areas and ${percent(report.coveredSpread)} under the panels.`,
    text.words > 0
      ? `Text over the scene: ${text.words} words checked, median contrast ${text.median.toFixed(1)}:1, worst 5% ${text.worst.toFixed(1)}:1. ${text.hardToRead} ${text.hardToRead === 1 ? "word is" : "words are"} harder to read because of the scene (outlined in red)${text.examples.length > 0 ? `, for example ${text.examples.map((example) => `a word at uv (${example.x.toFixed(2)}, ${example.y.toFixed(2)}), ${example.contrast.toFixed(1)}:1`).join("; ")}` : ""}.`
      : "No text was visible to check.",
  ];
  const notes = [
    report.openSpread < FLAT_OPEN_SPREAD &&
      "Hidden subject: the parts of the window people actually see are nearly flat, so the scene's detail is sitting behind bb's panels. Move the subject, horizon, and characters into the open areas and fill the frame edge to edge.",
    text.words > 0 &&
      text.hardToRead / text.words > HARD_TO_READ_SHARE &&
      "Hard to read: the scene fights the text above it. Calm the value contrast and fine detail in that part of the composition, especially where the red outlines are, without fading or masking the panel's area.",
  ].filter(Boolean);
  return [...lines, ...notes].join("\n");
}
