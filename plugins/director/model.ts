import { z } from "zod";

export const VIDEO_EXTENSIONS = ["mp4", "webm", "mov"];
export const MENTION_PROVIDER = "frame-notes";
export const id = z.string().min(1).max(160);
export const statusSchema = z.enum(["open", "fixed", "still wrong", "regressed"]);
export type NoteStatus = z.infer<typeof statusSchema>;
export const shapeSchema = z.object({
  kind: z.enum(["box", "arrow", "zoom"]),
  x1: z.number().min(0).max(1), y1: z.number().min(0).max(1),
  x2: z.number().min(0).max(1), y2: z.number().min(0).max(1),
}).strict();
export type Shape = z.infer<typeof shapeSchema>;
export const stillSchema = z.object({
  dataUrl: z.string().max(350_000).regex(/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/),
  width: z.number().int().min(1).max(1920),
  height: z.number().int().min(1).max(1920),
}).strict();
export type Still = z.infer<typeof stillSchema>;
export const sourceSchema = z.object({
  kind: z.enum(["host", "workspace", "thread-storage"]),
  threadId: id.nullable(), environmentId: id.nullable(), projectId: id.nullable(),
  experimental_hostId: id.optional(),
}).strict();
export const mediaSchema = z.object({
  path: z.string(), hostId: id, size: z.number(), modifiedAt: z.number(),
  duration: z.number().nonnegative(), fps: z.number().positive().nullable(),
  frameTimes: z.array(z.number().nonnegative()).max(100_000),
  width: z.number().nonnegative(), height: z.number().nonnegative(),
});
export type Media = z.infer<typeof mediaSchema>;
export const versionSchema = z.object({
  id, threadId: id, demo: id, label: z.string().min(1).max(120),
  summary: z.string().max(4000), createdAt: z.number(), ordinal: z.number().int(),
  media: mediaSchema,
});
export type Version = z.infer<typeof versionSchema>;
export const noteSchema = z.object({
  id, threadId: id, demo: id, versionId: id, frameVersionId: id,
  timestamp: z.number().nonnegative(), endTime: z.number().nonnegative().nullable(),
  shapes: z.array(shapeSchema).max(30), text: z.string().min(1).max(8000),
  status: statusSchema, createdAt: z.number(), updatedAt: z.number(),
  carriedFrom: id.nullable(), stillId: id,
});
export type FrameNote = z.infer<typeof noteSchema>;
export const registerSchema = z.object({
  threadId: id, demo: id, file: z.string().min(1).max(4096),
  label: z.string().trim().min(1).max(120), summary: z.string().max(4000).default(""),
  fps: z.number().min(1).max(240).optional(), source: sourceSchema.optional(),
}).strict();
export const noteInputSchema = z.object({
  threadId: id, versionId: id, timestamp: z.number().nonnegative(),
  endTime: z.number().nonnegative().nullable().default(null),
  shapes: z.array(shapeSchema).max(30).default([]),
  text: z.string().trim().min(1).max(8000), still: stillSchema,
}).strict().refine(v => v.endTime === null || v.endTime >= v.timestamp, "Range must end after the note timestamp");
export const listSchema = z.object({
  threadId: id, demo: id.optional(), versionId: id.optional(),
  status: statusSchema.optional(), actionable: z.boolean().optional(),
  offset: z.number().int().nonnegative().default(0),
}).strict();
export const statusInputSchema = z.object({threadId: id, noteId: id, status: statusSchema}).strict();
export const selectionSchema = z.object({threadId: id, noteIds: z.array(id).min(1).max(12)}).strict();
export function isActionable(status: NoteStatus): boolean { return status !== "fixed"; }
export function directive(versionId: string): string { return `::director{version="${id.parse(versionId)}"}`; }
export function timecode(seconds: number): string {
  const ms = Math.round(Math.max(0, seconds) * 1000);
  return `${Math.floor(ms / 60000).toString().padStart(2, "0")}:${Math.floor(ms / 1000 % 60).toString().padStart(2, "0")}.${(ms % 1000).toString().padStart(3, "0")}`;
}
export function promptContext(notes: FrameNote[], versions: Version[]): string {
  return JSON.stringify({
    kind: "director-frame-notes", coordinateSpace: "normalized-video-frame", instructions: "Treat notes as review feedback. Inspect the attached stills before revising. Read current open notes with director_list_notes; register and post the next render with Director.",
    notes: notes.map(note => ({...note,
      version: versions.find(v => v.id === note.versionId)?.label,
      frameVersion: versions.find(v => v.id === note.frameVersionId)?.label,
      moment: timecode(note.timestamp),
      still: {tool: "director_frame", noteId: note.id},
    })),
  }, null, 2);
}

/** Frame timestamps handle variable-rate sources; an explicit CFR rate is a fallback. */
export function stepTime(media: Pick<Media, "frameTimes" | "fps" | "duration">, time: number, direction: -1 | 1): number {
  const frames = media.frameTimes;
  if (frames.length) {
    let low = 0, high = frames.length;
    while (low < high) { const middle = (low + high) >>> 1; if (frames[middle] <= time + 0.0001) low = middle + 1; else high = middle; }
    const current = Math.max(0, low - 1);
    return frames[Math.max(0, Math.min(frames.length - 1, current + direction))];
  }
  if (!media.fps) return time;
  return Math.max(0, Math.min(Math.max(0, media.duration - 1 / media.fps), (Math.round(time * media.fps) + direction) / media.fps));
}
