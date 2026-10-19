// Real renderer/encoder acceptance, run in remote CI on Linux and macOS.
import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import assert from "node:assert/strict";
import { ffmpegPath } from "../skills/how-it-works/scripts/clip-tools.mjs";
import { inspectGif } from "../skills/how-it-works/scripts/clip-record.mjs";
const root = resolve("plugins/playgrounds");
const out = resolve("clip-evidence");
mkdirSync(out, { recursive: true });
execFileSync(process.execPath, [root + "/skills/how-it-works/examples/dial-indicator/build.mjs"], { stdio: "inherit" });
const actions = [["wait", 1000], ["key", "ArrowLeft"], ["wait", 2500], ["key", "End"], ["wait", 2500], ["key", "Home"]];
writeFileSync(out + "/actions.json", JSON.stringify(actions));
execFileSync(process.execPath, [root + "/skills/how-it-works/scripts/clip.mjs", "--file", root + "/skills/how-it-works/examples/dial-indicator/dial-indicator.html", "--prompt", "How does a dial indicator measure the height of a surface?", "--out", out + "/dial.mp4", "--gif", out + "/dial.gif", "--seconds", "18", "--actions", out + "/actions.json"], { stdio: "inherit", timeout: 240000 });
const report = JSON.parse(readFileSync(out + "/dial.mp4.json", "utf8"));
assert.equal(report.frames, 540); assert.equal(report.width, 720); assert.equal(report.height, 720);
const gif = inspectGif(readFileSync(out + "/dial.gif"));
assert.ok(gif.frames >= 175 && gif.frames <= 180);
const mp4 = readFileSync(out + "/dial.mp4");
let at = 0; const boxes = [];
while (at < mp4.length) { const size = mp4.readUInt32BE(at); assert.ok(size >= 8); boxes.push(mp4.toString("ascii", at + 4, at + 8)); at += size; }
assert.equal(at, mp4.length); assert.ok(boxes.indexOf("moov") < boxes.indexOf("mdat"), "faststart moov before media");
assert.ok(mp4.includes(Buffer.from("avc1")), "H264 video sample entry");
assert.ok(!mp4.includes(Buffer.from("mp4a")), "silent output");
console.log(JSON.stringify({ mp4Bytes: mp4.length, boxes, gif }));

const probe = spawnSync(await ffmpegPath(), ["-hide_banner", "-i", out + "/dial.mp4"], { encoding: "utf8" });
assert.match(probe.stderr, /Video: h264 \(High\)/); assert.match(probe.stderr, /yuv420p/);
assert.match(probe.stderr, /720x720/); assert.match(probe.stderr, /30 fps/);
assert.match(probe.stderr, /Duration: 00:00:18\.00/); assert.doesNotMatch(probe.stderr, /Audio:/);
writeFileSync(out + "/probe.txt", probe.stderr);
