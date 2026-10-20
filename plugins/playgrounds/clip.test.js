import { expect, it, vi } from "vitest";
import { clipOptions, endFrame, inspectGif, CREDIT, ANATOMY_CREDIT } from "./skills/how-it-works/scripts/clip-record.mjs";

function gif({ width = 1, height = 1, frames = 1 } = {}) {
  const header = Buffer.from("47494638396101000100800000000000ffffff", "hex");
  header.writeUInt16LE(width, 6); header.writeUInt16LE(height, 8);
  const frame = Buffer.from("2c0000000001000100000202440100", "hex");
  return Buffer.concat([header, ...Array.from({ length: frames }, () => frame), Buffer.from([0x3b])]);
}
it("validates actual GIF bytes, dimensions, frame count and total pixels", () => {
  expect(inspectGif(gif({ width: 720, height: 720, frames: 350 }))).toMatchObject({ width: 720, height: 720, frames: 350 });
  for (const data of [gif({ width: 1281 }), gif({ height: 1081 }), gif({ frames: 351 }), gif({ width: 1280, height: 1080, frames: 350 }), Buffer.concat([gif(), Buffer.alloc(15_000_000)]), gif().subarray(0, -1), Buffer.from("not a gif")]) expect(() => inspectGif(data)).toThrow();
});
it("restricts output to the three requested formats and 10–40 second range", () => {
  for (const [format, width, height] of [["square", 720, 720], ["landscape", 1280, 720], ["portrait", 720, 1280]]) expect(clipOptions({ format, prompt: "How?", seconds: 10 })).toMatchObject({ width, height, seconds: 10 });
  for (const seconds of [9, 41, 10.5, NaN, Infinity]) expect(() => clipOptions({ seconds, prompt: "How?" })).toThrow();
  expect(() => clipOptions({ prompt: " " })).toThrow();
  expect(() => clipOptions({ format: "__proto__", prompt: "How?" })).toThrow();
});
it("keeps exact credit and original prompt, safely escaped at readable sizes", () => {
  const html = endFrame({ prompt: '<script>alert("x")</script> & why?', anatomy: true });
  expect(html).toContain(CREDIT); expect(html).toContain(ANATOMY_CREDIT);
  expect(html).toContain("&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; why?");
  expect(html).toContain("font:32px");
  expect(endFrame({ prompt: "Why?", anatomy: true, width: 1280 })).toContain("font:56.888888888888886px");
  expect(endFrame({ prompt: "Why?", anatomy: false })).not.toContain(ANATOMY_CREDIT);
});


it("rejects a corrupted browser archive before extraction and gives one recovery instruction", async () => {
  const { mkdtempSync, existsSync, rmSync } = await import("node:fs");
  const { join } = await import("node:path");
  const { clipBrowserPath } = await import("./skills/how-it-works/scripts/clip-browser.mjs");
  const work = mkdtempSync(join(process.cwd(), ".clip-browser-test-"));
  vi.stubEnv("BB_CLIP_PORTABLE_BROWSER", "1");
  vi.stubGlobal("fetch", vi.fn(async () => new Response("corrupted browser archive")));
  try {
    await expect(clipBrowserPath(work, join(work, "cache"))).rejects.toThrow("Could not prepare the clip browser; set BB_CLIP_HEADLESS_SHELL to a working Chrome headless shell executable and retry.");
    expect(existsSync(join(work, "cache", "chrome.zip"))).toBe(false);
    expect(existsSync(join(work, "browser"))).toBe(false);
  } finally { vi.unstubAllGlobals(); vi.unstubAllEnvs(); rmSync(work, { recursive: true, force: true }); }
});
