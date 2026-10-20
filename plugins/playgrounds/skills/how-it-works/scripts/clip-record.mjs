import { spawn } from "node:child_process";
import { once } from "node:events";
import { readFileSync, writeFileSync, rmSync } from "node:fs";
import { FRAME_MS } from "./clip-clock.mjs";

export const FORMATS = { square: [720, 720], landscape: [1280, 720], portrait: [720, 1280] };
export const CREDIT = "Made with bb · getbb.app";
export const ANATOMY_CREDIT = "Anatomy by Ryan (@wheresryan22)";

export function clipOptions({ format = "square", seconds = 20, prompt, anatomy = false }) {
  if (!Object.hasOwn(FORMATS, format)) throw new Error("Choose square, landscape or portrait.");
  if (!Number.isInteger(seconds) || seconds < 10 || seconds > 40) throw new Error("Duration must be an integer from 10 to 40 seconds.");
  if (typeof prompt !== "string" || !prompt.trim()) throw new Error("The original prompt is required; pass --prompt if the card has no provenance.");
  if (prompt.length > 2000) throw new Error("The prompt exceeds 2000 characters.");
  return { width: FORMATS[format][0], height: FORMATS[format][1], seconds, prompt, anatomy };
}
const escape = (s) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
export function endFrame({ prompt, anatomy, width = 720 }) {
  const scale = width / 720;
  return `<!doctype html><meta charset="utf-8"><style>
  *{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;background:#10151d;color:#fff}
  body{display:grid;place-items:center;padding:48px;font:${32 * scale}px/1.35 system-ui,sans-serif}
  main{width:100%;text-align:center}h1{font-size:${36 * scale}px;line-height:1.25;margin:0;font-weight:650}
  p{margin:24px 0 0;white-space:pre-wrap;overflow-wrap:anywhere} .credit{font-size:${32 * scale}px}
  </style><main><h1>${CREDIT}</h1>${anatomy ? `<p class="credit">${ANATOMY_CREDIT}</p>` : ""}<p>${escape(prompt)}</p></main>`;
}

// Inspect the actual GIF, including image descriptors; never trust encoder flags.
export function inspectGif(bytes) {
  if (bytes.length < 14 || !/^GIF8[79]a$/.test(bytes.toString("ascii", 0, 6))) throw new Error("Invalid GIF header.");
  const width = bytes.readUInt16LE(6), height = bytes.readUInt16LE(8);
  let at = 13 + (bytes[10] & 128 ? 3 * (2 ** ((bytes[10] & 7) + 1)) : 0), frames = 0;
  const blocks = () => {
    for (;;) {
      if (at >= bytes.length) throw new Error("Truncated GIF.");
      const size = bytes[at++];
      if (!size) break;
      at += size;
      if (at > bytes.length) throw new Error("Truncated GIF.");
    }
  };
  for (;;) {
    if (at >= bytes.length) throw new Error("Missing GIF trailer.");
    const kind = bytes[at++];
    if (kind === 0x3b) break;
    if (kind === 0x21) { at++; blocks(); }
    else if (kind === 0x2c) {
      if (at + 9 >= bytes.length) throw new Error("Truncated GIF image.");
      const left = bytes.readUInt16LE(at), top = bytes.readUInt16LE(at + 2);
      if (left + bytes.readUInt16LE(at + 4) > width || top + bytes.readUInt16LE(at + 6) > height) throw new Error("GIF frame exceeds its canvas.");
      const packed = bytes[at + 8]; at += 9;
      if (packed & 128) at += 3 * (2 ** ((packed & 7) + 1));
      at++; blocks(); frames++;
    } else throw new Error("Invalid GIF block.");
  }
  if (!width || !height || !frames || width > 1280 || height > 1080 || frames > 350 || bytes.length > 15_000_000 || width * height * frames > 300_000_000) throw new Error("GIF exceeds export limits.");
  return { width, height, frames, bytes: bytes.length };
}

function encoder(binary, args, pipe = false) {
  const child = spawn(binary, ["-hide_banner", "-loglevel", "error", "-nostdin", "-threads", "2", ...args], { stdio: [pipe ? "pipe" : "ignore", "ignore", "pipe"] });
  let error = "";
  child.stderr.on("data", (data) => { error = (error + data).slice(-8000); });
  const done = new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("close", (code) => code === 0 ? resolve() : reject(new Error(`FFmpeg exited ${code}: ${error}`)));
  });
  done.catch(() => {});
  child.stdin?.on("error", () => {});
  return { child, done };
}

export async function recordClip({ send, evaluate, replay, clock, options }) {
  const { width, height, seconds, out, ffmpeg, endUrl, actions = [], gif } = options;
  const frames = seconds * 30, contentFrames = frames - 90;
  const capture = () => clock.capture();
  const enc = encoder(ffmpeg, ["-f", "image2pipe", "-framerate", "30", "-i", "pipe:0", "-an", "-c:v", "libx264", "-threads", "2", "-preset", "veryfast", "-profile:v", "high", "-pix_fmt", "yuv420p", "-b:v", "5M", "-minrate", "5M", "-maxrate", "5M", "-bufsize", "10M", "-x264-params", "nal-hrd=cbr:force-cfr=1:open-gop=0", "-g", "60", "-movflags", "+faststart", "-f", "mp4", "-n", out], true);
  const write = async (frame) => {
    if (enc.child.stdin.destroyed) { await enc.done; throw new Error("Encoder stopped."); }
    if (!enc.child.stdin.write(frame)) await Promise.race([once(enc.child.stdin, "drain"), enc.done.then(() => { throw new Error("Encoder stopped."); })]);
  };
  const playback = replay(actions);
  try {
    let resumeAt = 0, replayDone = false;
    for (let index = 0; index < contentFrames; index++) {
      const time = index * FRAME_MS;
      await clock.advanceTo(time);
      while (!replayDone && resumeAt <= time + 1e-7) {
        const next = await playback.next();
        replayDone = next.done;
        if (!next.done) {
          if (!Number.isFinite(next.value) || next.value < 0) throw new Error("Replay delays must be finite and non-negative.");
          resumeAt += next.value;
        }
      }
      await write(await capture());
    }
    if (!replayDone) throw new Error("Replay does not fit before the final 3 seconds. Shorten its waits or choose a longer clip.");
    const captured = contentFrames;
    await clock.advanceTo(contentFrames * FRAME_MS);
    console.log(`Captured ${captured} images for ${contentFrames} content frames; drawing end frame.`);
    await send("Page.navigate", { url: endUrl });
    await new Promise((done) => setTimeout(done, 300));
    const endFrameCheck = await evaluate(`document.fonts.ready.then(()=>{const r=document.querySelector('main')?.getBoundingClientRect();const minimumTextPxAt720=Math.min(...[...document.querySelectorAll('h1,p')].map(el=>parseFloat(getComputedStyle(el).fontSize)))*720/innerWidth;return {fits:!!r && r.top>=32 && r.bottom<=innerHeight-32 && document.documentElement.scrollWidth<=innerWidth,minimumTextPxAt720}})`);
    if (!endFrameCheck?.fits) throw new Error("The original prompt does not fit the end frame at 32 px. Use a portrait clip for more text.");
    if (!(endFrameCheck.minimumTextPxAt720 >= 31.99)) throw new Error("End-frame text is smaller than 32 px at 720 px wide.");
    const end = await capture();
    for (let i = 0; i < 90; i++) await write(end);
    enc.child.stdin.end(); await enc.done;
    writeFileSync(out + ".end.png", end);
    let gifInfo = null;
    if (gif) {
      const palette = out + ".palette.png";
      const filter = `fps=${Math.min(10, Math.floor(350 / seconds))},scale=w=720:h=1080:force_original_aspect_ratio=decrease:flags=lanczos`;
      try {
        await encoder(ffmpeg, ["-i", out, "-vf", filter + ",palettegen=max_colors=128", "-frames:v", "1", "-n", palette]).done;
        await encoder(ffmpeg, ["-i", out, "-i", palette, "-filter_complex_threads", "1", "-lavfi", `[0:v]${filter}[v];[v][1:v]paletteuse=dither=bayer:bayer_scale=3`, "-loop", "0", "-n", gif]).done;
        gifInfo = inspectGif(readFileSync(gif));
      } catch (error) { rmSync(gif, { force: true }); throw error; }
      finally { rmSync(palette, { force: true }); }
    }
    const report = { out, width, height, fps: 30, seconds, frames, captured, clock: "virtual", codec: "h264", pixelFormat: "yuv420p", audio: false, faststart: true, minimumTextPxAt720: endFrameCheck.minimumTextPxAt720, gif: gifInfo };
    writeFileSync(out + ".json", JSON.stringify(report, null, 2) + "\n");
    console.log(JSON.stringify(report));
  } catch (error) {
    enc.child.kill("SIGTERM"); await enc.done.catch(() => {});
    // Output is new (the entry script rejects existing destinations).
    rmSync(out, { force: true });
    throw error;
  }
}
