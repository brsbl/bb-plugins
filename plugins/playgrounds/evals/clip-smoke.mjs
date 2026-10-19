// Real renderer/encoder acceptance, run in remote CI on Linux and macOS.
import { execFile, execFileSync, spawnSync } from "node:child_process";
import { createSocket } from "node:dgram";
import { promisify } from "node:util";
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

// The real clip path must disable WebRTC before untrusted code runs, including
// fresh child realms. HTTP interception alone does not cover ICE/STUN traffic.
const stun = createSocket("udp4");
let packets = 0;
stun.on("message", () => { packets++; });
await new Promise((done, fail) => { stun.once("error", fail); stun.bind(0, "127.0.0.1", done); });
try {
  const stunUrl = `stun:127.0.0.1:${stun.address().port}`;
  function checkRealm(realm, stunUrl) {
    const failures = [];
    for (const name of ["RTCPeerConnection", "webkitRTCPeerConnection"]) {
      const descriptor = Object.getOwnPropertyDescriptor(realm, name);
      if (!descriptor || descriptor.value !== undefined || descriptor.writable || descriptor.configurable) failures.push(name + " is not locked");
      // If protection regresses, actually start gathering against our private
      // UDP listener; no external service or real card data is used.
      if (typeof realm[name] === "function") {
        const pc = new realm[name]({ iceServers: [{ urls: stunUrl }] });
        pc.createDataChannel("clip-security-probe");
        pc.createOffer().then(offer => pc.setLocalDescription(offer)).catch(() => {});
      }
      if (Reflect.deleteProperty(realm, name) || Reflect.defineProperty(realm, name, { value: function () {} })) failures.push(name + " can be replaced");
    }
    return failures;
  }
  const childScript = `parent.postMessage({source:"clip-security-child",failures:(${checkRealm.toString()})(window,${JSON.stringify(stunUrl)})},"*")`;
  const childHtml = "<script>" + childScript + "</script>";
  const securityHtml = `<!doctype html><meta charset="utf-8"><p>Clip network isolation</p><script>
    const failures = (${checkRealm.toString()})(window,${JSON.stringify(stunUrl)});
    let childDone;
    const childResult = new Promise(resolve => { childDone = resolve; });
    addEventListener("message", async event => {
      const message = event.data;
      if (message?.source === "clip-security-child") childDone(message.failures);
      if (message?.source !== "playground" || message.type !== "command") return;
      const childFailures = await Promise.race([childResult,new Promise(resolve => setTimeout(() => resolve(["Child realm did not run"]),3000))]);
      const all = [...failures,...childFailures];
      postMessage({source:"playground",type:"result",cmdId:message.cmdId,ok:all.length===0,error:all.join("; ")},"*");
    });
    const frame = document.createElement("iframe");
    document.body.append(frame);
    try { failures.push(...(${checkRealm.toString()})(frame.contentWindow,${JSON.stringify(stunUrl)})); }
    catch (error) { if (error.name !== "SecurityError") throw error; }
    frame.srcdoc = ${JSON.stringify(childHtml).replaceAll("<", "\\u003c")};
  </script>`;
  writeFileSync(out + "/security.html", securityHtml);
  writeFileSync(out + "/security-actions.json", JSON.stringify([["do", "verifyIsolation", []]]));
  // Async execution keeps the UDP observer active while Chrome is running.
  const result = await promisify(execFile)(process.execPath, [root + "/skills/how-it-works/scripts/clip.mjs", "--file", out + "/security.html", "--prompt", "Can a local clip send WebRTC traffic?", "--out", out + "/security.mp4", "--seconds", "10", "--actions", out + "/security-actions.json"], { timeout: 120000 });
  process.stdout.write(result.stdout);
  process.stderr.write(result.stderr);
  assert.equal(packets, 0, "Clip scripts must not send STUN packets");
  writeFileSync(out + "/security.json", JSON.stringify({ parentAndChildRealmsLocked: true, stunPackets: packets }) + "\n");
} finally {
  await new Promise(done => stun.close(done));
}


// Check the two remaining delivery sizes, including credit readability after
// normalizing a landscape clip (and its GIF) to a 720-pixel-wide social feed.
for (const [format, width, height] of [["landscape", 1280, 720], ["portrait", 720, 1280]]) {
  const video = `${out}/${format}.mp4`;
  execFileSync(process.execPath, [root + "/skills/how-it-works/scripts/clip.mjs", "--file", root + "/skills/how-it-works/examples/dial-indicator/dial-indicator.html", "--prompt", "How does a dial indicator measure the height of a surface?", "--out", video, "--gif", `${out}/${format}.gif`, "--format", format, "--seconds", "10", "--actions", out + "/actions.json"], { stdio: "inherit", timeout: 240000 });
  const shape = JSON.parse(readFileSync(video + ".json", "utf8"));
  assert.equal(shape.width, width); assert.equal(shape.height, height); assert.equal(shape.frames, 300);
  assert.ok(shape.minimumTextPxAt720 >= 31.99, "Credits and prompt stay readable at 720 px wide");
  inspectGif(readFileSync(`${out}/${format}.gif`));
  const stream = spawnSync(await ffmpegPath(), ["-hide_banner", "-i", video], { encoding: "utf8" }).stderr;
  assert.ok(stream.includes(`${width}x${height}`)); assert.match(stream, /30 fps/); assert.match(stream, /Duration: 00:00:10\.00/);
}
assert.ok(report.minimumTextPxAt720 >= 31.99);
