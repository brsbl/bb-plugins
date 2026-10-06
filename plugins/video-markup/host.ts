import { createHash, randomUUID } from "node:crypto";
import { execFile } from "node:child_process";
import { copyFile, link, mkdir, open, realpath, stat, unlink } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { experimental_defineHostEntry } from "@get-bb/plugin-sdk/host";
import { hostContract } from "./host-contract.js";
import { VIDEO_EXTENSIONS } from "./model.js";

const execute = promisify(execFile);
export default experimental_defineHostEntry({contract: hostContract, handlers: {
  async readChunk(input, context) {
    if (context.signal.aborted) throw new Error("Video request cancelled");
    if (!path.isAbsolute(input.path) || !VIDEO_EXTENSIONS.includes(path.extname(input.path).slice(1).toLowerCase())) throw new Error("Invalid video path");
    if (await realpath(input.path) !== input.path) throw new Error("The video path changed");
    const file = await open(input.path, "r");
    try {
      const details = await file.stat();
      if (!details.isFile() || details.size !== input.size || details.mtimeMs !== input.modifiedAt) throw new Error("The registered video changed on disk");
      const buffer = Buffer.alloc(Math.min(input.length, Math.max(0, details.size - input.start)));
      const {bytesRead} = await file.read(buffer, 0, buffer.length, input.start);
      return {data: buffer.subarray(0, bytesRead).toString("base64")};
    } finally { await file.close(); }
  },
  async inspect(input, context) {
    if (!path.isAbsolute(input.path) || !path.isAbsolute(input.rootPath)) throw new Error("Video paths must be absolute");
    if (!VIDEO_EXTENSIONS.includes(path.extname(input.path).slice(1).toLowerCase())) throw new Error("Choose an MP4, WebM, or MOV file");
    const [sourceFile, root] = await Promise.all([realpath(input.path), realpath(input.rootPath)]);
    const relative = path.relative(root, sourceFile);
    if (relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) throw new Error("Video escapes its workspace");
    let file = sourceFile;
    let details = await stat(file);
    if (!details.isFile()) throw new Error("Video is not a regular file");
    if (input.retain) {
      // Composer attachments are deleted after their turn. Keep a durable, atomic copy.
      const key = createHash("sha256").update(JSON.stringify([file, details.size, details.mtimeMs])).digest("hex");
      const directory = path.join(context.experimental_paths.dataDir, "videos", key);
      await mkdir(directory, {recursive: true});
      const destination = path.join(directory, path.basename(file));
      try { await stat(destination); } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
        const temporary = path.join(directory, `.${randomUUID()}.partial`);
        try {
          await copyFile(file, temporary);
          await link(temporary, destination).catch(error => { if (error.code !== "EEXIST") throw error; });
        } finally { await unlink(temporary).catch(() => undefined); }
      }
      file = await realpath(destination);
      details = await stat(file);
    }
    const media = {path: file, size: details.size, modifiedAt: details.mtimeMs, duration: 0, fps: input.fps ?? null, width: 0, height: 0, codec: null as string | null, frameTimes: [] as number[]};
    if (!input.probe) return media;
    let startTime = NaN;
    try {
      // Never couple basic metadata to reading or decoding every frame.
      const {stdout} = await execute("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=avg_frame_rate,r_frame_rate,width,height,codec_name,duration,start_time:format=duration,start_time", "-of", "json", file], {timeout: 5_000, killSignal: "SIGKILL", maxBuffer: 256 * 1024, signal: context.signal});
      const probe = JSON.parse(stdout);
      const stream = probe.streams?.[0];
      const rates = [stream?.avg_frame_rate, stream?.r_frame_rate].map(value => {
        const [n, d = 1] = String(value ?? "0/1").split("/").map(Number);
        return n / d;
      });
      media.fps = input.fps ?? rates.find(rate => Number.isFinite(rate) && rate > 0) ?? null;
      media.width = Number(stream?.width) || 0; media.height = Number(stream?.height) || 0;
      media.duration = Number(probe.format?.duration) || Number(stream?.duration) || 0;
      media.codec = typeof stream?.codec_name === "string" ? stream.codec_name : null;
      startTime = Number(stream?.start_time ?? probe.format?.start_time);
    } catch (error) {
      if (context.signal.aborted) throw error;
      // Playback remains available when ffprobe is absent; stepping needs an explicit CFR rate.
      return media;
    }
    try {
      // Packet PTS preserves variable timing without decoding. Optional indexing
      // gets a short budget; a timeout must not discard the metadata above.
      const {stdout} = await execute("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "packet=pts_time", "-of", "json", file], {timeout: 1_000, killSignal: "SIGKILL", maxBuffer: 8 * 1024 * 1024, signal: context.signal});
      const probe = JSON.parse(stdout);
      const times: number[] = (probe.packets ?? []).map((packet: {pts_time?: string}) => Number(packet.pts_time)).filter((t: number) => Number.isFinite(t)).sort((a: number, b: number) => a - b);
      // Packets arrive in decoding order; B-frame PTS can be out of order.
      const first = Number.isFinite(startTime) ? startTime : times[0] ?? 0;
      media.frameTimes = [...new Set(times.filter(t => t >= first).map(t => t - first))].slice(0, 100_000);
    } catch (error) {
      if (context.signal.aborted) throw error;
      // The stream's rate still provides immediate CFR stepping.
    }
    return media;
  },
}});
