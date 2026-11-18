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
    await expect(clipBrowserPath(work, join(work, "cache"))).rejects.toThrow("Could not prepare the clip browser; set CHROME_PATH to a working Chrome or Chromium executable and retry.");
    expect(existsSync(join(work, "cache", "chrome.zip"))).toBe(false);
    expect(existsSync(join(work, "browser"))).toBe(false);
  } finally { vi.unstubAllGlobals(); vi.unstubAllEnvs(); rmSync(work, { recursive: true, force: true }); }
});

it("buckets duration without forwarding seconds or content to bb", async () => {
  const { durationBucket, reportClipExport } = await import("./skills/how-it-works/scripts/clip-analytics.mjs");
  for (const [seconds, bucket] of [[1, "under_15s"], [14.99, "under_15s"], [15, "15_30s"], [30, "15_30s"], [30.01, "30_60s"], [60, "30_60s"], [60.01, "over_60s"]]) expect(durationBucket(seconds)).toBe(bucket);
  for (const invalid of [0, -1, NaN, Infinity]) expect(() => durationBucket(invalid)).toThrow();
  const run = vi.fn();
  reportClipExport({ anatomy: true, format: "mp4", size: "square", seconds: 30, prompt: "private", path: "/private" }, run);
  expect(run).toHaveBeenCalledExactlyOnceWith(expect.any(String), ["playgrounds", "clip-exported", "--kind", "anatomy", "--format", "mp4", "--size", "square", "--duration-bucket", "15_30s"], { stdio: "ignore", timeout: 3000 });
  expect(() => reportClipExport({ anatomy: false, format: "gif", size: "square", seconds: 10 }, () => { throw new Error("offline"); })).not.toThrow();
});

it("counts only files saved successfully, including partial MP4/GIF copy failure", async () => {
  const { saveClipOutputs } = await import("./skills/how-it-works/scripts/clip-analytics.mjs");
  const { mkdtempSync, writeFileSync, rmSync } = await import("node:fs");
  const { join } = await import("node:path");
  const dir = mkdtempSync(join(process.cwd(), ".clip-output-test-"));
  try {
    const out = join(dir, "source.mp4"), output = join(dir, "saved.mp4"), gif = join(dir, "source.gif"), gifOutput = join(dir, "saved.gif");
    const options = { out, output, gif, gifOutput, anatomy: true, size: "square", seconds: 30 };
    const report = vi.fn();
    expect(() => saveClipOutputs(options, report)).toThrow();
    expect(report).not.toHaveBeenCalled();
    for (const file of [out, out + ".json", out + ".end.png"]) writeFileSync(file, "test");
    expect(() => saveClipOutputs(options, report)).toThrow();
    expect(report).toHaveBeenCalledExactlyOnceWith({ anatomy: true, format: "mp4", size: "square", seconds: 30 });
    report.mockClear();
    expect(() => saveClipOutputs(options, report)).toThrow();
    expect(report).not.toHaveBeenCalled();
    for (const file of [output, output + ".json", output + ".end.png"]) rmSync(file);
    writeFileSync(gif, "test");
    saveClipOutputs(options, report);
    expect(report.mock.calls.map(([event]) => event.format)).toEqual(["mp4", "gif"]);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
