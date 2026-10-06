import type { Media } from "./model.js";

export const CHUNK_BYTES = 256 * 1024;

/** A single HTTP byte range, including Safari's bytes=0-1 probe and suffix seeks. */
export function byteRange(value: string | null, size: number): {start: number; end: number} | null {
  if (value === null) return size > 0 ? {start: 0, end: size - 1} : null;
  const match = /^bytes=(\d*)-(\d*)$/.exec(value.trim());
  if (!match || (!match[1] && !match[2]) || size <= 0) return null;
  if (!match[1]) {
    const length = Number(match[2]);
    return Number.isSafeInteger(length) && length > 0 ? {start: Math.max(0, size - length), end: size - 1} : null;
  }
  const start = Number(match[1]), end = match[2] ? Number(match[2]) : size - 1;
  return Number.isSafeInteger(start) && Number.isSafeInteger(end) && start < size && end >= start ? {start, end: Math.min(size - 1, end)} : null;
}

export function mediaResponse(args: {
  media: Media; range: string | null; head: boolean; signal: AbortSignal;
  read: (start: number, length: number, signal: AbortSignal) => Promise<string>;
}): Response {
  const {media} = args;
  const range = byteRange(args.range, media.size);
  const extension = media.path.split(".").at(-1)?.toLowerCase();
  const headers = new Headers({
    "accept-ranges": "bytes", "cache-control": "private, no-store", "x-content-type-options": "nosniff",
    "content-type": extension === "webm" ? "video/webm" : extension === "mov" ? "video/quicktime" : "video/mp4",
  });
  if (!range) {
    headers.set("content-range", `bytes */${media.size}`);
    return new Response(null, {status: 416, headers});
  }
  const partial = args.range !== null;
  headers.set("content-length", String(range.end - range.start + 1));
  if (partial) headers.set("content-range", `bytes ${range.start}-${range.end}/${media.size}`);
  if (args.head) return new Response(null, {status: partial ? 206 : 200, headers});
  const cancelled = new AbortController();
  const signal = AbortSignal.any([args.signal, cancelled.signal]);
  let position = range.start;
  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      if (signal.aborted) { controller.error(new Error("Video request cancelled")); return; }
      try {
        const length = Math.min(CHUNK_BYTES, range.end - position + 1);
        const bytes = Buffer.from(await args.read(position, length, signal), "base64");
        if (signal.aborted) return;
        if (!bytes.length || bytes.length > length) throw new Error("Video returned an invalid byte range");
        position += bytes.length;
        controller.enqueue(bytes);
        if (position > range.end) controller.close();
      } catch (error) { if (!cancelled.signal.aborted) controller.error(error); }
    },
    cancel() { cancelled.abort(); },
  });
  return new Response(stream, {status: partial ? 206 : 200, headers});
}
