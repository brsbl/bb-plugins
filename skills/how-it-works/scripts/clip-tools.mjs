import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync, chmodSync, renameSync, rmSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { gunzipSync } from "node:zlib";

// Reviewed ffmpeg-static b6.1.1 compressed release assets. Download only tools,
// never card contents. Cache is private and no shell/package installer is run.
const SHA256 = {
  "linux-x64": "bfe8a8fc511530457b528c48d77b5737527b504a3797a9bc4866aeca69c2dffa",
  "darwin-arm64": "8923876afa8db5585022d7860ec7e589af192f441c56793971276d450ed3bbfa",
  "darwin-x64": "929b375c1182d956c51f7ac25e0b2b0411fb01f6f407aa15c9758efeb4242106",
};
export async function ffmpegPath(cache) {
  for (const binary of [process.env.FFMPEG_PATH, "ffmpeg"].filter(Boolean)) {
    const probe = spawnSync(binary, ["-hide_banner", "-encoders"], { encoding: "utf8", timeout: 10000 });
    if (probe.status === 0 && /\blibx264\b/.test(probe.stdout)) return binary;
    if (process.env.FFMPEG_PATH === binary) throw new Error("FFMPEG_PATH must name an FFmpeg build with libx264.");
  }
  const arch = `${process.platform}-${process.arch}`, digest = SHA256[arch];
  if (!digest) throw new Error(`No bundled encoder route for ${arch}; set FFMPEG_PATH.`);
  const root = cache ?? join(homedir(), ".cache", "bb-playgrounds", "ffmpeg-b6.1.1", arch);
  mkdirSync(root, { recursive: true, mode: 0o700 });
  const archive = join(root, "ffmpeg.gz"), binary = join(root, "ffmpeg");
  let data = existsSync(archive) ? readFileSync(archive) : null;
  if (!data || createHash("sha256").update(data).digest("hex") !== digest) {
    console.error("Preparing the local clip encoder (one-time download; no card data is sent).");
    const response = await fetch(`https://github.com/eugeneware/ffmpeg-static/releases/download/b6.1.1/ffmpeg-${arch}.gz`, { signal: AbortSignal.timeout(120000) });
    if (!response.ok) throw new Error(`Encoder download failed (${response.status}).`);
    data = Buffer.from(await response.arrayBuffer());
    if (createHash("sha256").update(data).digest("hex") !== digest) throw new Error("Encoder checksum mismatch.");
    writeFileSync(archive, data, { mode: 0o600 });
  }
  // Recreate from the authenticated archive rather than trusting a cached executable.
  const temp = binary + `.${process.pid}`;
  try { writeFileSync(temp, gunzipSync(data), { mode: 0o700 }); chmodSync(temp, 0o700); renameSync(temp, binary); }
  finally { rmSync(temp, { force: true }); }
  return binary;
}
