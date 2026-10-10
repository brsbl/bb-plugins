import type { FileReference } from "./contract.js";

export type PinTarget = { kind: "host"; hostId: string; path: string };

const MARKDOWN = /\.(?:md|markdown)$/i;

/**
 * Where bb's preview should open a pin, or null when it can't from this thread.
 * bb previews host files only on the thread environment's host. A Markdown pin from
 * another machine opens like a chat file link, on the thread's host, where Moss Viewer
 * finds the note on the machine that holds it. Other files there have no preview.
 */
export function previewTarget(pin: Pick<FileReference, "hostId" | "path">, threadHostId: string | null): PinTarget | null {
  if (pin.hostId === threadHostId) return { kind: "host", hostId: pin.hostId, path: pin.path };
  if (threadHostId && MARKDOWN.test(pin.path)) return { kind: "host", hostId: threadHostId, path: pin.path };
  return null;
}
