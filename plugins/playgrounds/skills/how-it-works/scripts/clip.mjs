#!/usr/bin/env node
import { spawn, execFileSync } from "node:child_process";
import { createServer } from "node:http";
import { existsSync, readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync, copyFileSync, constants } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { clipOptions, endFrame } from "./clip-record.mjs";
import { ffmpegPath } from "./clip-tools.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const HELP = `Make a local clip of an HTML or Anatomy playground (nothing uploads).
  node clip.mjs <id> --out clip.mp4 [--actions replay.json] [--gif clip.gif]
  node clip.mjs --file figure.html --prompt "How does it work?" --out clip.mp4
  --format square|landscape|portrait   720x720 (default), 1280x720, 720x1280
  --seconds 10..40                    total duration including 3-second end frame (default 20)
  --prompt TEXT                      original prompt if card provenance is unavailable
  --anatomy                          credit Anatomy for an unmarked standalone file
  --thread ID                        card's thread (otherwise current bb thread)
Replay is a drive.mjs action array: ["wait",1000], ["do","setParams",[{...}]],
["key","ArrowLeft"], ["click","#button"], ["drag",selector,x0,y0,x1,y1,steps].
Supply the agent's own do actions or an explicitly recorded input sequence.
The clip is a replay; audio is omitted. Needs Chrome/Chromium (CHROME_PATH overrides).
FFmpeg with libx264 is used if present, otherwise a verified portable build is cached
on macOS arm64/x64 or Linux x64 automatically. No Homebrew or manual encoder install.
Run through bb host-care on managed hosts. Output files are never overwritten.`;

async function main() {
  const argv = process.argv.slice(2);
  if (!argv.length || argv.includes("--help")) { console.log(HELP); return; }
  const options = {}, positionals = [];
  for (let at = 0; at < argv.length; at++) {
    const arg = argv[at];
    if (arg === "--anatomy") options.anatomy = true;
    else if (["--out", "--file", "--prompt", "--format", "--seconds", "--actions", "--gif", "--thread"].includes(arg)) {
      if (argv[at + 1] === undefined) throw new Error(`Missing value for ${arg}.`);
      options[arg.slice(2)] = argv[++at];
    } else if (arg.startsWith("--")) throw new Error(`Unknown option ${arg}.`);
    else positionals.push(arg);
  }
  if (!options.out?.endsWith(".mp4")) throw new Error("Pass --out <path>.mp4.");
  if (options.gif && !options.gif.endsWith(".gif")) throw new Error("Pass --gif <path>.gif.");
  if (positionals.length > 1 || Boolean(options.file) === Boolean(positionals[0])) throw new Error("Pass one card id or --file.");
  let source;
  if (options.file) {
    const html = readFileSync(resolve(options.file), "utf8");
    if (Buffer.byteLength(html) > 3_000_000) throw new Error("HTML exceeds 3 MB.");
    source = { html, anatomy: /class=["'][^"']*\biso\b/.test(html), prompt: null };
  } else {
    const args = ["playgrounds", "clip-source", positionals[0], ...(options.thread ? ["--thread", options.thread] : [])];
    const result = execFileSync(process.env.BB_CLI || "bb", args, { encoding: "utf8", maxBuffer: 12_000_000 });
    const match = /^<playground-data [^>]*>\n([\s\S]*)\n<\/playground-data>\n$/.exec(result);
    if (!match) throw new Error("Unexpected clip-source response. Update Playgrounds first.");
    source = JSON.parse(match[1]);
  }
  const config = clipOptions({ ...options, seconds: options.seconds === undefined ? 20 : Number(options.seconds), prompt: options.prompt ?? source.prompt, anatomy: Boolean(options.anatomy || source.anatomy) });
  const actions = options.actions ? JSON.parse(readFileSync(resolve(options.actions), "utf8")) : [];
  if (!Array.isArray(actions) || actions.length > 1000 || actions.some(a => !Array.isArray(a) || !["wait", "do", "key", "click", "move", "drag", "scroll", "turn"].includes(a[0]))) throw new Error("Replay must be an array of at most 1000 supported input actions.");
  const output = resolve(options.out), gifOutput = options.gif ? resolve(options.gif) : null;
  for (const file of [output, output + ".json", output + ".end.png", gifOutput].filter(Boolean)) {
    if (existsSync(file)) throw new Error(`Output already exists: ${file}`);
    mkdirSync(dirname(file), { recursive: true });
  }
  // All profiles and intermediates live beside the output, never in a shared /tmp.
  const work = mkdtempSync(join(dirname(output), ".bb-clip-"));
  let server;
  try {
    const ffmpeg = await ffmpegPath();
    const token = randomUUID();
    const csp = source.csp ?? "sandbox allow-scripts; default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob: https://upload.wikimedia.org; media-src data: blob:; font-src data: blob:; connect-src 'none'; form-action 'none'; base-uri 'none'";
    server = createServer((req, res) => {
      const html = req.url === `/${token}/card` ? source.html : req.url === `/${token}/end` ? endFrame(config) : null;
      res.writeHead(html === null ? 404 : 200, { "Content-Type": "text/html; charset=utf-8", "Content-Security-Policy": csp, "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" });
      res.end(html ?? "Not found");
    });
    await new Promise((done, fail) => { server.once("error", fail); server.listen(0, "127.0.0.1", done); });
    const base = `http://127.0.0.1:${server.address().port}/${token}`;
    const out = join(work, "clip.mp4"), gif = gifOutput ? join(work, "clip.gif") : null;
    const recipe = join(work, "recipe.json");
    writeFileSync(recipe, JSON.stringify({ ...config, actions, out, gif, ffmpeg, endUrl: base + "/end", cardUrl: base + "/card" }), { mode: 0o600 });
    const child = spawn(process.execPath, ["--experimental-websocket", join(HERE, "drive.mjs"), base + "/card", "--width", String(config.width), "--height", String(config.height), "--profile-root", work, "--clip", recipe], { stdio: "inherit" });
    const stop = () => child.kill("SIGTERM");
    process.once("SIGINT", stop); process.once("SIGTERM", stop);
    try {
      await new Promise((done, fail) => { child.once("error", fail); child.once("exit", code => code === 0 ? done() : fail(new Error(`Clip renderer exited ${code}.`))); });
    } finally { process.removeListener("SIGINT", stop); process.removeListener("SIGTERM", stop); }
    for (const [from, to] of [[out, output], [out + ".json", output + ".json"], [out + ".end.png", output + ".end.png"], ...(gifOutput ? [[gif, gifOutput]] : [])]) copyFileSync(from, to, constants.COPYFILE_EXCL);
    console.log(`Saved ${output}${gifOutput ? ` and ${gifOutput}` : ""}`);
  } finally {
    if (server) { server.closeAllConnections(); await new Promise(done => server.close(done)); }
    rmSync(work, { recursive: true, force: true });
  }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
