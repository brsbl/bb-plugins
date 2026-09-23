import { execFile } from "node:child_process";
import { open, realpath, stat } from "node:fs/promises";
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
    const [file, root] = await Promise.all([realpath(input.path), realpath(input.rootPath)]);
    const relative = path.relative(root, file);
    if (relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) throw new Error("Video escapes its workspace");
    const details = await stat(file);
    if (!details.isFile()) throw new Error("Video is not a regular file");
    const media = {path: file, size: details.size, modifiedAt: details.mtimeMs, duration: 0, fps: input.fps ?? null, width: 0, height: 0, frameTimes: [] as number[]};
    if (!input.probe) return media;
    try {
      const {stdout} = await execute("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=avg_frame_rate,width,height:format=duration:frame=best_effort_timestamp_time", "-of", "json", file], {timeout: 60_000, maxBuffer: 8 * 1024 * 1024, signal: context.signal});
      const probe = JSON.parse(stdout);
      const stream = probe.streams?.[0];
      const [n, d] = String(stream?.avg_frame_rate ?? "0/1").split("/").map(Number);
      const rate = n / d;
      media.fps = input.fps ?? (Number.isFinite(rate) && rate > 0 ? rate : null);
      media.width = Number(stream?.width) || 0; media.height = Number(stream?.height) || 0;
      media.duration = Number(probe.format?.duration) || 0;
      const times: number[] = (probe.frames ?? []).map((frame: {best_effort_timestamp_time?: string}) => Number(frame.best_effort_timestamp_time)).filter((t: number) => Number.isFinite(t) && t >= 0);
      const first = times[0] ?? 0;
      media.frameTimes = [...new Set(times.map(t => t - first))].sort((a, b) => a - b).slice(0, 100_000);
    } catch (error) {
      if (context.signal.aborted) throw error;
      // Playback remains available when ffprobe is absent; stepping needs an explicit CFR rate.
    }
    return media;
  },
}});
